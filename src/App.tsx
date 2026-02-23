import React, { useState, useEffect, useRef } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import { 
  Download, 
  Link as LinkIcon, 
  Palette, 
  Maximize, 
  History, 
  Trash2, 
  Check, 
  Copy,
  ExternalLink,
  QrCode
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Utility for tailwind class merging
 */
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface QRHistoryItem {
  id: string;
  url: string;
  fgColor: string;
  bgColor: string;
  timestamp: number;
}

export default function App() {
  const [url, setUrl] = useState('https://google.com');
  const [fgColor, setFgColor] = useState('#000000');
  const [bgColor, setBgColor] = useState('#ffffff');
  const [size, setSize] = useState(256);
  const [history, setHistory] = useState<QRHistoryItem[]>([]);
  const [copied, setCopied] = useState(false);
  const qrRef = useRef<HTMLDivElement>(null);

  // Load history from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('qr_history');
    if (saved) {
      try {
        setHistory(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to parse history', e);
      }
    }
  }, []);

  // Save history to localStorage
  useEffect(() => {
    localStorage.setItem('qr_history', JSON.stringify(history));
  }, [history]);

  const addToHistory = () => {
    if (!url || url.trim() === '') return;
    
    const newItem: QRHistoryItem = {
      id: Math.random().toString(36).substr(2, 9),
      url: url.trim(),
      fgColor,
      bgColor,
      timestamp: Date.now(),
    };

    // Only add if it's not the same as the last one
    if (history.length === 0 || history[0].url !== newItem.url) {
      setHistory(prev => [newItem, ...prev].slice(0, 10));
    }
  };

  const downloadQR = () => {
    const qrCanvas = qrRef.current?.querySelector('canvas');
    if (qrCanvas) {
      // We want to capture the "style" (padding and rounded background)
      const padding = Math.max(20, size * 0.1); // Dynamic padding based on size
      const totalSize = size + padding * 2;
      
      const mainCanvas = document.createElement('canvas');
      mainCanvas.width = totalSize;
      mainCanvas.height = totalSize;
      const ctx = mainCanvas.getContext('2d');
      
      if (ctx) {
        // Draw background with rounded corners
        ctx.fillStyle = bgColor;
        const radius = totalSize * 0.1; // Dynamic radius
        
        ctx.beginPath();
        ctx.moveTo(radius, 0);
        ctx.lineTo(totalSize - radius, 0);
        ctx.quadraticCurveTo(totalSize, 0, totalSize, radius);
        ctx.lineTo(totalSize, totalSize - radius);
        ctx.quadraticCurveTo(totalSize, totalSize, totalSize - radius, totalSize);
        ctx.lineTo(radius, totalSize);
        ctx.quadraticCurveTo(0, totalSize, 0, totalSize - radius);
        ctx.lineTo(0, radius);
        ctx.quadraticCurveTo(0, 0, radius, 0);
        ctx.closePath();
        ctx.fill();
        
        // Draw the QR code onto the main canvas
        ctx.drawImage(qrCanvas, padding, padding, size, size);
        
        const pngUrl = mainCanvas.toDataURL('image/png');
        const downloadLink = document.createElement('a');
        downloadLink.href = pngUrl;
        downloadLink.download = `qr-code-${Date.now()}.png`;
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);
        addToHistory();
      }
    }
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy!', err);
    }
  };

  const clearHistory = () => {
    setHistory([]);
  };

  const loadFromHistory = (item: QRHistoryItem) => {
    setUrl(item.url);
    setFgColor(item.fgColor);
    setBgColor(item.bgColor);
  };

  return (
    <div className="min-h-screen flex flex-col items-center py-12 px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <header className="w-full max-w-4xl mb-12 text-center">
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="inline-flex items-center justify-center p-3 bg-zinc-900 rounded-2xl mb-6 shadow-xl"
        >
          <QrCode className="text-white w-8 h-8" />
        </motion.div>
        <h1 className="text-4xl font-bold tracking-tight text-zinc-900 sm:text-5xl mb-4">
          QR Static
        </h1>
        <p className="text-zinc-500 text-lg max-w-2xl mx-auto">
          Genera códigos QR estáticos que nunca caducan. Sin redirecciones, sin límites, 100% directos.
        </p>
      </header>

      <main className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Controls Section */}
        <section className="lg:col-span-7 space-y-6">
          <div className="bg-white rounded-3xl p-8 shadow-sm border border-zinc-200/50">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-400 mb-6 flex items-center gap-2">
              <LinkIcon size={16} /> Configuración del Enlace
            </h2>
            
            <div className="space-y-4">
              <div>
                <label htmlFor="url" className="block text-sm font-medium text-zinc-700 mb-2">
                  URL de Destino
                </label>
                <div className="relative">
                  <input
                    type="url"
                    id="url"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="https://tu-pagina.com"
                    className="w-full pl-4 pr-12 py-4 bg-zinc-50 border border-zinc-200 rounded-2xl focus:ring-2 focus:ring-zinc-900 focus:border-transparent transition-all outline-none text-zinc-900"
                  />
                  <button 
                    onClick={copyToClipboard}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-zinc-400 hover:text-zinc-900 transition-colors"
                  >
                    {copied ? <Check size={20} className="text-emerald-500" /> : <Copy size={20} />}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-zinc-700 flex items-center gap-2">
                    <Palette size={14} /> Color del QR
                  </label>
                  <div className="flex items-center gap-3 p-3 bg-zinc-50 border border-zinc-200 rounded-2xl">
                    <input
                      type="color"
                      value={fgColor}
                      onChange={(e) => setFgColor(e.target.value)}
                      className="w-10 h-10 rounded-lg cursor-pointer border-none bg-transparent"
                    />
                    <span className="text-sm font-mono text-zinc-500 uppercase">{fgColor}</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-zinc-700 flex items-center gap-2">
                    <Palette size={14} /> Fondo
                  </label>
                  <div className="flex items-center gap-3 p-3 bg-zinc-50 border border-zinc-200 rounded-2xl">
                    <input
                      type="color"
                      value={bgColor}
                      onChange={(e) => setBgColor(e.target.value)}
                      className="w-10 h-10 rounded-lg cursor-pointer border-none bg-transparent"
                    />
                    <span className="text-sm font-mono text-zinc-500 uppercase">{bgColor}</span>
                  </div>
                </div>
              </div>

              <div className="pt-4">
                <label className="text-sm font-medium text-zinc-700 flex items-center gap-2 mb-4">
                  <Maximize size={14} /> Tamaño ({size}px)
                </label>
                <input
                  type="range"
                  min="128"
                  max="512"
                  step="8"
                  value={size}
                  onChange={(e) => setSize(parseInt(e.target.value))}
                  className="w-full h-2 bg-zinc-200 rounded-lg appearance-none cursor-pointer accent-zinc-900"
                />
              </div>
            </div>
          </div>

          {/* History Section */}
          <div className="bg-white rounded-3xl p-8 shadow-sm border border-zinc-200/50">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-400 flex items-center gap-2">
                <History size={16} /> Recientes
              </h2>
              {history.length > 0 && (
                <button 
                  onClick={clearHistory}
                  className="text-xs text-zinc-400 hover:text-red-500 transition-colors flex items-center gap-1"
                >
                  <Trash2 size={12} /> Limpiar
                </button>
              )}
            </div>

            <div className="space-y-3">
              <AnimatePresence mode="popLayout">
                {history.length === 0 ? (
                  <motion.p 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-zinc-400 text-sm italic text-center py-4"
                  >
                    No hay códigos generados recientemente.
                  </motion.p>
                ) : (
                  history.map((item) => (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      className="group flex items-center justify-between p-4 bg-zinc-50 hover:bg-zinc-100 border border-zinc-200 rounded-2xl transition-all cursor-pointer"
                      onClick={() => loadFromHistory(item)}
                    >
                      <div className="flex items-center gap-4 overflow-hidden">
                        <div 
                          className="w-10 h-10 rounded-lg flex-shrink-0 flex items-center justify-center border border-zinc-200"
                          style={{ backgroundColor: item.bgColor }}
                        >
                          <QrCode size={20} style={{ color: item.fgColor }} />
                        </div>
                        <div className="overflow-hidden">
                          <p className="text-sm font-medium text-zinc-900 truncate">
                            {item.url}
                          </p>
                          <p className="text-xs text-zinc-400">
                            {new Date(item.timestamp).toLocaleTimeString()}
                          </p>
                        </div>
                      </div>
                      <ExternalLink size={16} className="text-zinc-300 group-hover:text-zinc-900 transition-colors" />
                    </motion.div>
                  ))
                )}
              </AnimatePresence>
            </div>
          </div>
        </section>

        {/* Preview Section */}
        <section className="lg:col-span-5">
          <div className="sticky top-8 space-y-6">
            <div className="bg-zinc-900 rounded-[2.5rem] p-10 shadow-2xl flex flex-col items-center text-center">
              <div className="mb-8">
                <h3 className="text-white/50 text-xs font-bold uppercase tracking-[0.2em] mb-2">Vista Previa</h3>
                <div className="h-px w-12 bg-white/20 mx-auto"></div>
              </div>

              <motion.div 
                key={`${url}-${fgColor}-${bgColor}`}
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                ref={qrRef}
                className="p-6 bg-white rounded-3xl shadow-inner mb-10"
                style={{ backgroundColor: bgColor }}
              >
                <QRCodeCanvas
                  value={url || ' '}
                  size={size}
                  level="H"
                  includeMargin={false}
                  fgColor={fgColor}
                  bgColor={bgColor}
                />
              </motion.div>

              <div className="w-full space-y-4">
                <button
                  onClick={downloadQR}
                  disabled={!url}
                  className="w-full py-4 bg-white text-zinc-900 rounded-2xl font-semibold flex items-center justify-center gap-2 hover:bg-zinc-100 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                >
                  <Download size={20} /> Descargar PNG
                </button>
                <p className="text-white/40 text-[10px] uppercase tracking-widest font-mono">
                  Static QR • No Expiration • High Quality
                </p>
              </div>
            </div>

            <div className="bg-emerald-50 border border-emerald-100 rounded-3xl p-6">
              <div className="flex gap-4">
                <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Check className="text-white" size={20} />
                </div>
                <div>
                  <h4 className="text-emerald-900 font-semibold mb-1">Código Estático</h4>
                  <p className="text-emerald-700/80 text-sm leading-relaxed">
                    Este código contiene la URL directamente. Funcionará para siempre mientras el sitio web exista. No depende de servidores externos.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="mt-20 py-8 border-t border-zinc-200 w-full max-w-5xl flex flex-col md:flex-row items-center justify-between gap-4 text-zinc-400 text-sm">
        <p>© {new Date().getFullYear()} QR Static. Herramienta gratuita.</p>
        <div className="flex gap-6">
          <a href="#" className="hover:text-zinc-900 transition-colors">Privacidad</a>
          <a href="#" className="hover:text-zinc-900 transition-colors">Términos</a>
          <a href="#" className="hover:text-zinc-900 transition-colors">GitHub</a>
        </div>
      </footer>
    </div>
  );
}
