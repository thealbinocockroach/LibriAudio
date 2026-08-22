import React, { useState, useEffect } from 'react';
import { X, Type, BookOpen, Settings2 } from 'lucide-react';
import { Audiobook } from '../types';
import { getEbookCloudUrl } from '../data/ebookData';

interface GutenbergReaderModalProps {
  isOpen: boolean;
  book: Audiobook;
  onClose: () => void;
}

export const GutenbergReaderModal: React.FC<GutenbergReaderModalProps> = ({ isOpen, book, onClose }) => {
  const [htmlContent, setHtmlContent] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fontSize, setFontSize] = useState<number>(18);
  const [showSettings, setShowSettings] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark' | 'sepia'>('dark');

  useEffect(() => {
    let isMounted = true;
    const fetchContent = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const url = await getEbookCloudUrl(book.title);
        if (!url) {
          throw new Error('No readable ebook found for this title.');
        }

        // Fetch via proxy
        const res = await fetch(`/api/gutenberg/text?url=${encodeURIComponent(url)}`);
        if (!res.ok) {
          throw new Error('Failed to load text from proxy');
        }
        
        const text = await res.text();
        
        if (isMounted) {
          if (url.endsWith('.html') || url.includes('.htm')) {
            setHtmlContent(text);
          } else {
            // Very simple plain text wrapping if not HTML
            const paragraphs = text.split(/\n\s*\n/).map(p => `<p>${p.replace(/\n/g, '<br/>')}</p>`).join('');
            setHtmlContent(paragraphs);
          }
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err.message : 'Unknown error');
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };
    
    fetchContent();
    
    return () => {
      isMounted = false;
    };
  }, [book]);

  if (!isOpen) return null;

  const themes = {
    light: {
      bg: 'bg-white',
      text: 'text-gray-900',
      header: 'bg-white border-gray-200',
      prose: 'prose-stone',
      button: 'hover:bg-gray-100 text-gray-700',
      settingsBg: 'bg-white border-gray-200 shadow-xl',
      spinner: 'border-gray-200 border-t-gray-800'
    },
    dark: {
      bg: 'bg-[#111111]',
      text: 'text-gray-300',
      header: 'bg-[#0a0a0a] border-white/10',
      prose: 'prose-invert',
      button: 'hover:bg-white/10 text-gray-400 hover:text-white',
      settingsBg: 'bg-[#1a1a1a] border-white/10 shadow-2xl text-white',
      spinner: 'border-white/10 border-t-white/60'
    },
    sepia: {
      bg: 'bg-[#F4F1EA]',
      text: 'text-[#2C2A25]',
      header: 'bg-[#F4F1EA] border-black/10',
      prose: 'prose-stone',
      button: 'hover:bg-black/5 text-black/70',
      settingsBg: 'bg-[#F4F1EA] border-black/10 shadow-xl',
      spinner: 'border-black/20 border-t-black/60'
    }
  };

  const currentTheme = themes[theme];

  return (
    <div className={`fixed inset-0 z-50 flex flex-col animate-in fade-in zoom-in-95 duration-300 overflow-hidden font-serif ${currentTheme.bg} ${currentTheme.text}`}>
      <header className={`h-14 border-b flex items-center justify-between px-4 shrink-0 z-10 ${currentTheme.header}`}>
        <div className="flex items-center gap-3 overflow-hidden">
          <BookOpen className="w-5 h-5 opacity-60 shrink-0" />
          <h2 className="text-sm font-semibold truncate opacity-90 font-sans tracking-wide">
            {book.title}
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setShowSettings(!showSettings)}
            className={`p-2 rounded-full transition-colors ${currentTheme.button}`}
          >
            <Settings2 className="w-5 h-5" />
          </button>
          <button 
            onClick={onClose}
            className={`p-2 rounded-full transition-colors ml-2 ${currentTheme.button}`}
          >
            <X className="w-6 h-6" />
          </button>
        </div>
      </header>

      {showSettings && (
        <div className={`absolute top-16 right-4 p-5 rounded-xl border z-20 w-72 animate-in fade-in slide-in-from-top-4 font-sans ${currentTheme.settingsBg}`}>
          <h3 className="text-xs uppercase font-bold opacity-50 mb-4 tracking-wider">Reader Settings</h3>
          
          <div className="space-y-5">
            {/* Text Size */}
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium opacity-80">Text Size</span>
              <div className="flex gap-2">
                <button 
                  onClick={() => setFontSize(f => Math.max(12, f - 2))}
                  className={`w-9 h-9 rounded-full border flex items-center justify-center font-serif text-sm transition-colors ${currentTheme.button} ${currentTheme.header}`}
                >
                  A-
                </button>
                <button 
                  onClick={() => setFontSize(f => Math.min(32, f + 2))}
                  className={`w-9 h-9 rounded-full border flex items-center justify-center font-serif text-lg transition-colors ${currentTheme.button} ${currentTheme.header}`}
                >
                  A+
                </button>
              </div>
            </div>

            {/* Theme */}
            <div>
              <span className="text-sm font-medium opacity-80 mb-2 block">Theme</span>
              <div className="flex gap-2">
                <button 
                  onClick={() => setTheme('light')}
                  className={`flex-1 py-1.5 rounded-lg border text-sm font-medium transition-all ${theme === 'light' ? 'border-blue-500 ring-1 ring-blue-500' : 'border-gray-200'} bg-white text-gray-900`}
                >
                  Light
                </button>
                <button 
                  onClick={() => setTheme('sepia')}
                  className={`flex-1 py-1.5 rounded-lg border text-sm font-medium transition-all ${theme === 'sepia' ? 'border-[#C5A059] ring-1 ring-[#C5A059]' : 'border-black/10'} bg-[#F4F1EA] text-[#2C2A25]`}
                >
                  Sepia
                </button>
                <button 
                  onClick={() => setTheme('dark')}
                  className={`flex-1 py-1.5 rounded-lg border text-sm font-medium transition-all ${theme === 'dark' ? 'border-[#C5A059] ring-1 ring-[#C5A059]' : 'border-white/10'} bg-[#111111] text-gray-200`}
                >
                  Dark
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-black/20 pb-24">
        <div className="max-w-3xl mx-auto px-6 py-12 md:px-12 md:py-16">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-64 opacity-60">
              <div className={`w-8 h-8 rounded-full border-2 animate-spin mb-4 ${currentTheme.spinner}`} />
              <p className="font-sans text-sm tracking-wide">Retrieving classic manuscript...</p>
            </div>
          ) : error ? (
            <div className="text-center py-20 text-red-500/90">
              <p className="mb-4">Unable to load the manuscript.</p>
              <p className="text-sm">{error}</p>
            </div>
          ) : (
            <article 
              className={`prose ${currentTheme.prose} prose-a:text-blue-500 prose-headings:font-serif prose-p:font-serif prose-p:leading-relaxed mx-auto max-w-full`}
              style={{ fontSize: `${fontSize}px` }}
              dangerouslySetInnerHTML={{ __html: htmlContent || '' }}
            />
          )}
        </div>
      </div>
    </div>
  );
};
