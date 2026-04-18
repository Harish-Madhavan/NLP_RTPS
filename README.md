# NLP Machine Translation Application (Pro)

A full-stack, high-accuracy machine translation application using FastAPI (Python) and React (TypeScript).

## Features
- **High-Accuracy Translation:** Powered by the `tencent/HY-MT1.5-1.8B-GGUF` model, optimized for superior translation quality across 33+ major world languages.
- **GGUF Optimization:** Uses 4-bit quantization for extremely fast inference with low RAM overhead.
- **Modern UI:** Sleek, responsive design built with React and Vanilla CSS.
- **Local Execution:** Runs entirely on your machine for privacy and zero API costs.
- **Hardware Acceleration:** Supports GPU/XPU offloading via `llama-cpp-python`.

## Supported Languages
English, Chinese (Simplified/Traditional), French, Spanish, German, Japanese, Korean, Russian, Portuguese, Italian, Turkish, Arabic, Thai, Vietnamese, Malay, Indonesian, Filipino, Hindi, Polish, Czech, Dutch, Khmer, Burmese, Persian, Gujarati, Urdu, Telugu, Marathi, Hebrew, Bengali, Tamil, Ukrainian, Tibetan, Kazakh, Mongolian, Uyghur, and Cantonese.

## Prerequisites
- Python 3.8+
- Node.js 18+
- npm

## Setup Instructions

### 1. Backend Setup (FastAPI)
1. Open a terminal and navigate to the `backend` directory:
   ```bash
   cd backend
   ```
2. Create a virtual environment:
   ```bash
   python -m venv venv
   ```
3. Activate the virtual environment:
   - **Windows:** `venv\Scripts\activate`
   - **macOS/Linux:** `source venv/bin/activate`
4. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
5. Run the backend server:
   ```bash
   python main.py
   ```
   *Note: The first time you run this, it will automatically download the HY-MT1.5 model (~1.1GB). This might take a few minutes depending on your connection.*

### 2. Frontend Setup (React)
1. Open another terminal and navigate to the `frontend` directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Run the development server:
   ```bash
   npm run dev
   ```
4. Open your browser and navigate to the URL shown (usually `http://localhost:5173`).

## Usage
1. Ensure the backend is running and the status indicator in the UI is green.
2. Select your source and target languages.
3. Type the text you want to translate in the left box.
4. Click "Translate".
5. Use the "Swap" button to quickly reverse languages or "Copy" to save the result.

## Tech Stack
- **Backend:** FastAPI, llama-cpp-python, Hugging Face Hub, LangDetect
- **Frontend:** React, TypeScript, Vite, Vanilla CSS
- **Model:** HY-MT1.5-1.8B-GGUF (Q4_K_M)
