import os
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from llama_cpp import Llama
from huggingface_hub import hf_hub_download
from langdetect import detect, DetectorFactory
import torch

# Set seed for consistent detection
DetectorFactory.seed = 0

app = FastAPI(title="HY-MT1.5-1.8B-GGUF Translation API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

MODEL_REPO = "tencent/HY-MT1.5-1.8B-GGUF"
MODEL_FILE = "HY-MT1.5-1.8B-Q4_K_M.gguf"

# Detect hardware
if torch.cuda.is_available():
    n_gpu_layers = -1  # All layers to GPU
    device = "cuda"
elif hasattr(torch, "xpu") and torch.xpu.is_available():
    # llama-cpp-python might need specific build for XPU, 
    # but we'll try to offload if possible.
    n_gpu_layers = -1
    device = "xpu"
else:
    n_gpu_layers = 0  # CPU only
    device = "cpu"

print(f"Downloading/Loading model {MODEL_REPO} on {device}...")

try:
    model_path = hf_hub_download(repo_id=MODEL_REPO, filename=MODEL_FILE)
    llm = Llama(
        model_path=model_path,
        n_ctx=2048,
        n_gpu_layers=n_gpu_layers,
        verbose=False
    )
    print(f"Model loaded successfully on {device}!")
except Exception as e:
    print(f"Error loading model: {e}")
    llm = None

# Mapping for HY-MT1.5 (33 languages + 5 dialects)
# We use full names as the model is instruction-tuned.
LANG_MAP = {
    "zh": "Chinese",
    "en": "English",
    "fr": "French",
    "es": "Spanish",
    "de": "German",
    "ja": "Japanese",
    "ko": "Korean",
    "ru": "Russian",
    "pt": "Portuguese",
    "it": "Italian",
    "tr": "Turkish",
    "ar": "Arabic",
    "th": "Thai",
    "vi": "Vietnamese",
    "ms": "Malay",
    "id": "Indonesian",
    "tl": "Filipino",
    "hi": "Hindi",
    "pl": "Polish",
    "cs": "Czech",
    "nl": "Dutch",
    "km": "Khmer",
    "my": "Burmese",
    "fa": "Persian",
    "gu": "Gujarati",
    "ur": "Urdu",
    "te": "Telugu",
    "mr": "Marathi",
    "he": "Hebrew",
    "bn": "Bengali",
    "ta": "Tamil",
    "uk": "Ukrainian",
    "bo": "Tibetan",
    "kk": "Kazakh",
    "mn": "Mongolian",
    "ug": "Uyghur",
    "yue": "Cantonese"
}

# Reverse map for frontend codes if needed, but we'll use English names for model
# and match frontend codes to these names.

class TranslationRequest(BaseModel):
    text: str
    source_lang: str = "auto"
    target_lang: str = "French"

class TranslationResponse(BaseModel):
    translated_text: str
    source_lang: str
    target_lang: str
    detected_lang: str = None

@app.get("/")
def read_root():
    return {"status": "online", "model": MODEL_REPO, "device": device}

@app.post("/translate", response_model=TranslationResponse)
async def translate_text(request: TranslationRequest):
    if not llm:
        raise HTTPException(status_code=503, detail="Model not loaded")
    
    try:
        source_lang = request.source_lang
        detected_code = None

        if source_lang == "auto":
            detected_code = detect(request.text)
            source_lang = LANG_MAP.get(detected_code, "English")
        
        # Format prompt according to HY-MT1.5 instructions
        prompt = f"<|system|>\nYou are a translation assistant.\n<|user|>\nTranslate the following text from {source_lang} to {request.target_lang}:\n{request.text}\n<|assistant|>\n"
        
        output = llm(
            prompt,
            max_tokens=512,
            stop=["<|end_of_text|>", "<|im_end|>", "\n"],
            echo=False,
            temperature=0.7,
            top_p=0.6,
            top_k=20,
            repeat_penalty=1.05
        )
        
        translated_text = output['choices'][0]['text'].strip()
            
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
