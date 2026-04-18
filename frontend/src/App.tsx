import { useState, useEffect } from 'react';
import './App.css';

const LANGUAGES = [
  { label: 'English', code: 'eng_Latn' },
  { label: 'French', code: 'fra_Latn' },
  { label: 'Spanish', code: 'spa_Latn' },
  { label: 'German', code: 'deu_Latn' },
  { label: 'Chinese (Simplified)', code: 'zho_Hans' },
  { label: 'Japanese', code: 'jpn_Jpan' },
  { label: 'Hindi', code: 'hin_Deva' },
  { label: 'Arabic', code: 'arb_Arab' },
  { label: 'Russian', code: 'rus_Cyrl' },
  { label: 'Portuguese', code: 'por_Latn' },
  { label: 'Italian', code: 'ita_Latn' },
  { label: 'Korean', code: 'kor_Kore' },
];

const API_URL = 'http://localhost:8000';

function App() {
  const [sourceText, setSourceText] = useState('');
  const [targetText, setTargetText] = useState('');
  const [sourceLang, setSourceLang] = useState('eng_Latn');
  const [targetLang, setTargetLang] = useState('fra_Latn');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [backendStatus, setBackendStatus] = useState<'checking' | 'online' | 'offline'>('checking');

  useEffect(() => {
    const timer = setInterval(checkBackend, 5000);
    checkBackend();
    return () => clearInterval(timer);
  }, []);

  const checkBackend = async () => {
    try {
      const response = await fetch(`${API_URL}/`);
      if (response.ok) {
        setBackendStatus('online');
      } else {
        setBackendStatus('offline');
      }
    } catch (err) {
      setBackendStatus('offline');
    }
  };

  const handleTranslate = async () => {
    if (!sourceText.trim()) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_URL}/translate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: sourceText,
          source_lang: sourceLang,
          target_lang: targetLang,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Translation failed');
      }

      const data = await response.json();
      setTargetText(data.translated_text);
    } catch (err: any) {
      setError(err.message || 'Could not connect to the translation server.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSwap = () => {
    const sL = sourceLang;
    const tL = targetLang;
    const sT = sourceText;
    const tT = targetText;
    setSourceLang(tL);
    setTargetLang(sL);
    setSourceText(tT);
    setTargetText(sT);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(targetText);
    alert('Copied to clipboard!');
  };

  return (
    <div className="translator-container">
      <h1>NLP Machine Translation</h1>
      <div style={{ textAlign: 'center', marginBottom: '10px', fontSize: '12px' }}>
        Using: NLLB-200 (600M)
      </div>
      
      {backendStatus === 'offline' && (
        <div className="error-message">
          Backend server is offline or model is still loading (~2.4GB RAM needed).
        </div>
      )}

      <div className="controls">
        <select 
          className="language-select" 
          value={sourceLang} 
          onChange={(e) => setSourceLang(e.target.value)}
        >
          {LANGUAGES.map(lang => (
            <option key={lang.code} value={lang.code}>{lang.label}</option>
          ))}
        </select>

        <button className="swap-btn" onClick={handleSwap} title="Swap Languages">
          ⇌
        </button>

        <select 
          className="language-select" 
          value={targetLang} 
          onChange={(e) => setTargetLang(e.target.value)}
        >
          {LANGUAGES.map(lang => (
            <option key={lang.code} value={lang.code}>{lang.label}</option>
          ))}
        </select>
      </div>

      <div className="text-areas">
        <div className="input-group">
          <textarea
            placeholder="Enter text to translate..."
            value={sourceText}
            onChange={(e) => setSourceText(e.target.value)}
          />
        </div>

        <div className={`output-area ${isLoading ? 'loading' : ''}`}>
          {isLoading && (
            <div className="loading-overlay">
              <div className="spinner"></div>
            </div>
          )}
          {targetText || (isLoading ? '' : 'Translation will appear here...')}
          
          {targetText && !isLoading && (
            <button className="copy-btn" onClick={copyToClipboard}>
              Copy
            </button>
          )}
        </div>
      </div>

      {error && <div className="error-message">{error}</div>}

      <div className="action-bar">
        <button 
          className="translate-btn" 
          onClick={handleTranslate}
          disabled={isLoading || !sourceText.trim() || backendStatus === 'offline'}
        >
          {isLoading ? 'Translating...' : 'Translate'}
        </button>
      </div>
    </div>
  );
}

export default App;
