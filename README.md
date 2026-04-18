# NLP Machine Translation Application

A full-stack machine translation application using FastAPI (Python) and React (TypeScript).

## Features
- **Universal Translation:** Powered by the `facebook/nllb-200-distilled-600M` model, supporting 200+ languages.
- **Modern UI:** Sleek, responsive design built with React and Vanilla CSS.
- **Local Execution:** Runs entirely on your machine for privacy and zero API costs.
- **Cross-Platform:** Works on Windows, macOS, and Linux.

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
   *Note: The first time you run this, it will download the NLLB-200 model (~2.4GB). This might take a few minutes.*

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
1. Ensure the backend is running.
2. Select your source and target languages.
3. Type the text you want to translate in the left box.
4. Click "Translate".
5. Use the "Swap" button to quickly reverse languages or "Copy" to save the result.

## Tech Stack
- **Backend:** FastAPI, Hugging Face Transformers, PyTorch
- **Frontend:** React, TypeScript, Vite, Vanilla CSS
- **Model:** NLLB-200 (No Language Left Behind)
