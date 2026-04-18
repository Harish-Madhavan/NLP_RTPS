import { useState, useEffect } from 'react';
import './App.css';

const LANGUAGES = [
  { label: 'Auto Detect', code: 'auto' },
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

interface HistoryItem {
  id: number;
  sourceText: string;
  targetText: string;
  sourceLang: string;
  targetLang: string;
  timestamp: number;
}

function App() {
  const [sourceText, setSourceText] = useState('');
  const [targetText, setTargetText] = useState('');
  const [sourceLang, setSourceLang] = useState('auto');
  const [targetLang, setTargetLang] = useState('fra_Latn');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [backendStatus, setBackendStatus] = useState<'online' | 'offline'>('online');
  const [theme, setTheme] = useState<'light' | 'dark'>(
    (localStorage.getItem('theme') as 'light' | 'dark') || 'light'
  );
  const [history, setHistory] = useState<HistoryItem[]>(
    JSON.parse(localStorage.getItem('translateHistory') || '[]')
  );

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem('translateHistory', JSON.stringify(history));
  }, [history]);

  useEffect(() => {
    const timer = setInterval(checkBackend, 10000);
    checkBackend();
    return () => clearInterval(timer);
  }, []);

  const checkBackend = async () => {
    try {
      const response = await fetch(`${API_URL}/`);
      setBackendStatus(response.ok ? 'online' : 'offline');
    } catch {
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
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: sourceText,
          source_lang: sourceLang,
          target_lang: targetLang,
        }),
      });

      if (!response.ok) throw new Error('Translation failed');
      const data = await response.json();
      setTargetText(data.translated_text);

      // Add to history
      const newItem: HistoryItem = {
        id: Date.now(),
        sourceText: sourceText.substring(0, 100),
        targetText: data.translated_text.substring(0, 100),
        sourceLang,
        targetLang,
        timestamp: Date.now(),
      };
      setHistory(prev => [newItem, ...prev.slice(0, 9)]);
    } catch (err: any) {
      setError('Connection lost. Please check if the backend is running.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSwap = () => {
    if (sourceLang === 'auto') return;
    setSourceLang(targetLang);
    setTargetLang(sourceLang);
    setSourceText(targetText);
    setTargetText(sourceText);
  };

  const toggleTheme = () => setTheme(theme === 'light' ? 'dark' : 'light');

  const loadFromHistory = (item: HistoryItem) => {
    setSourceText(item.sourceText);
    setTargetText(item.targetText);
    setSourceLang(item.sourceLang);
    setTargetLang(item.targetLang);
  };

  return (
    <div className="app-wrapper">
      <div className="header">
        <h1>NLP Translator</h1>
        <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
          <div className="status-badge">
            <div className={`dot ${backendStatus}`}></div>
            {backendStatus.toUpperCase()}
          </div>
          <button className="theme-toggle" onClick={toggleTheme}>
            {theme === 'light' ? '🌙' : '☀️'}
          </button>
        </div>
      </div>

      <div className="main-card">
        <div className="translator-grid">
          <div className="language-pane">
            <select value={sourceLang} onChange={(e) => setSourceLang(e.target.value)}>
              {LANGUAGES.map(l => <option key={l.code} value={l.code}>{l.label}</option>)}
            </select>
            <textarea
              placeholder="Enter text..."
              value={sourceText}
              onChange={(e) => setSourceText(e.target.value)}
            />
          </div>

          <div className="swap-container">
            <button className="btn-swap" onClick={handleSwap} disabled={sourceLang === 'auto'}>
              ⇌
            </button>
          </div>

          <div className="language-pane">
            <select value={targetLang} onChange={(e) => setTargetLang(e.target.value)}>
              {LANGUAGES.filter(l => l.code !== 'auto').map(l => 
                <option key={l.code} value={l.code}>{l.label}</option>
              )}
            </select>
            <div className="output-container">
              {targetText || <span style={{color: 'var(--text-muted)'}}>Translation...</span>}
            </div>
          </div>
        </div>

        {error && <div style={{color: '#ef4444', marginTop: '15px', textAlign: 'center'}}>{error}</div>}

        <div className="footer-actions">
          <div className="char-count">{sourceText.length} characters</div>
          <button 
            className="btn-translate" 
            onClick={handleTranslate}
            disabled={isLoading || !sourceText.trim() || backendStatus === 'offline'}
          >
            {isLoading ? <div className="spinner"></div> : 'Translate'}
          </button>
        </div>
      </div>

      {history.length > 0 && (
        <div className="history-section">
          <h2>Recent History</h2>
          <div className="history-grid">
            {history.map(item => (
              <div key={item.id} className="history-item" onClick={() => loadFromHistory(item)}>
                <div className="history-header">
                  <span>{LANGUAGES.find(l => l.code === item.sourceLang)?.label} → {LANGUAGES.find(l => l.code === item.targetLang)?.label}</span>
                  <span>{new Date(item.timestamp).toLocaleTimeString()}</span>
                </div>
                <div className="history-text" style={{fontWeight: 'bold'}}>{item.sourceText}</div>
                <div className="history-text" style={{color: 'var(--text-muted)'}}>{item.targetText}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
