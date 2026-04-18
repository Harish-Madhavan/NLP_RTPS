import os
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from transformers import AutoTokenizer, AutoModelForSeq2SeqLM
import torch

app = FastAPI(title="NLP Machine Translation API (NLLB-200)")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configuration for the model
MODEL_NAME = "facebook/nllb-200-distilled-600M"

if torch.cuda.is_available():
    device = "cuda"
elif hasattr(torch, "xpu") and torch.xpu.is_available():
    device = "xpu"
else:
    device = "cpu"

print(f"Loading model {MODEL_NAME} on {device}...")

# Load tokenizer and model
try:
    tokenizer = AutoTokenizer.from_pretrained(MODEL_NAME)
    model = AutoModelForSeq2SeqLM.from_pretrained(MODEL_NAME)
    
    # Move to device
    model = model.to(device)
    if device != "cpu":
        model = model.to(torch.bfloat16)
        
    print(f"Model loaded successfully on {device}!")
except Exception as e:
    print(f"Error loading model: {e}")
    model = None
    tokenizer = None

class TranslationRequest(BaseModel):
    text: str
    source_lang: str = "eng_Latn"
    target_lang: str = "fra_Latn"

class TranslationResponse(BaseModel):
    translated_text: str
    source_lang: str
    target_lang: str

@app.get("/")
def read_root():
    return {"status": "online", "model": MODEL_NAME, "device": device}

@app.post("/translate", response_model=TranslationResponse)
async def translate_text(request: TranslationRequest):
    if not model or not tokenizer:
        raise HTTPException(status_code=503, detail="Model not loaded")
    
    try:
        # Manual inference logic for NLLB
        tokenizer.src_lang = request.source_lang
        inputs = tokenizer(request.text, return_tensors="pt").to(device)
        
        # NLLB uses special tokens for target language
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
            source_lang=request.source_lang,
            target_lang=request.target_lang
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
