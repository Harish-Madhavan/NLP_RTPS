import os
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from transformers import AutoTokenizer, AutoModelForSeq2SeqLM
import torch
from langdetect import detect, DetectorFactory

# Set seed for consistent detection
DetectorFactory.seed = 0

app = FastAPI(title="NLP Machine Translation API (NLLB-200)")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

MODEL_NAME = "facebook/nllb-200-distilled-600M"
if torch.cuda.is_available():
    device = "cuda"
elif hasattr(torch, "xpu") and torch.xpu.is_available():
    device = "xpu"
else:
    device = "cpu"

print(f"Loading model {MODEL_NAME} on {device}...")

try:
    tokenizer = AutoTokenizer.from_pretrained(MODEL_NAME)
    model = AutoModelForSeq2SeqLM.from_pretrained(MODEL_NAME)
    model = model.to(device)
    if device != "cpu":
        model = model.to(torch.bfloat16)
    print(f"Model loaded successfully on {device}!")
except Exception as e:
    print(f"Error loading model: {e}")
    model = None
    tokenizer = None

# Mapping common ISO 639-1 to FLORES-200
LANG_MAP = {
    "en": "eng_Latn", "fr": "fra_Latn", "es": "spa_Latn", "de": "deu_Latn",
    "zh": "zho_Hans", "ja": "jpn_Jpan", "hi": "hin_Deva", "ar": "arb_Arab",
    "ru": "rus_Cyrl", "pt": "por_Latn", "it": "ita_Latn", "ko": "kor_Kore",
}

class TranslationRequest(BaseModel):
    text: str
    source_lang: str = "auto"
    target_lang: str = "fra_Latn"

class TranslationResponse(BaseModel):
    translated_text: str
    source_lang: str
    target_lang: str
    detected_lang: str = None

@app.get("/")
def read_root():
    return {"status": "online", "model": MODEL_NAME, "device": device}

@app.post("/translate", response_model=TranslationResponse)
async def translate_text(request: TranslationRequest):
    if not model or not tokenizer:
        raise HTTPException(status_code=503, detail="Model not loaded")
    
    try:
        source_lang = request.source_lang
        detected_code = None

        if source_lang == "auto":
            detected_code = detect(request.text)
            source_lang = LANG_MAP.get(detected_code, "eng_Latn")

        tokenizer.src_lang = source_lang
        inputs = tokenizer(request.text, return_tensors="pt").to(device)
        forced_bos_token_id = tokenizer.convert_tokens_to_ids(request.target_lang)
        
        with torch.no_grad():
            generated_tokens = model.generate(
                **inputs,
                forced_bos_token_id=forced_bos_token_id,
                max_length=512
            )
        
        translated_text = tokenizer.batch_decode(generated_tokens, skip_special_tokens=True)[0]
            
        return TranslationResponse(
            translated_text=translated_text,
            source_lang=source_lang,
            target_lang=request.target_lang,
            detected_lang=detected_code
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
