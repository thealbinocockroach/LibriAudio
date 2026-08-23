import React, { useState, useEffect, useRef } from 'react';
import { X, Type, BookOpen, Settings2, Upload, Volume2, VolumeX, ChevronLeft, ChevronRight, List } from 'lucide-react';
import { Audiobook } from '../types';
import { getEbookCloudUrl } from '../data/ebookData';
import { parseUploadedEpub } from '../utils/epubParser';

interface GutenbergReaderModalProps {
  isOpen: boolean;
  book: Audiobook;
  onClose: () => void;
  onUploadNewEpub?: (book: Audiobook) => void;
}

export const GutenbergReaderModal: React.FC<GutenbergReaderModalProps> = ({
  isOpen,
  book,
  onClose,
  onUploadNewEpub,
}) => {
  const [currentBook, setCurrentBook] = useState<Audiobook>(book);
  const [htmlContent, setHtmlContent] = useState<string | null>(null);
  const [currentChapterIndex, setCurrentChapterIndex] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fontSize, setFontSize] = useState<number>(18);
  const [showSettings, setShowSettings] = useState(false);
  const [showChapterDrawer, setShowChapterDrawer] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark' | 'sepia'>('dark');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setCurrentBook(book);
    setCurrentChapterIndex(0);
  }, [book]);

  // Clean up speech synthesis when closing or changing book
  useEffect(() => {
    return () => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, [currentBook, isOpen]);

  // Fetch or extract reader content
  useEffect(() => {
    if (!isOpen) return;
    let isMounted = true;

    const loadContent = async () => {
      setIsLoading(true);
      setError(null);

      // 1. If book has pre-parsed ebookChapters (e.g. from uploaded EPUB)
      if (currentBook.ebookChapters && currentBook.ebookChapters.length > 0) {
        const activeChapter = currentBook.ebookChapters[currentChapterIndex] || currentBook.ebookChapters[0];
        if (isMounted) {
          setHtmlContent(activeChapter.content);
          setIsLoading(false);
        }
        return;
      }

      // 2. Fetch from Project Gutenberg text proxy
      try {
        const url = await getEbookCloudUrl(currentBook.title);
        if (!url) {
          throw new Error('No public digital manuscript found for this title.');
        }

        const res = await fetch(`/api/gutenberg/text?url=${encodeURIComponent(url)}`);
        if (!res.ok) {
          throw new Error('Failed to load text manuscript from archive proxy');
        }

        const text = await res.text();

        if (isMounted) {
          if (url.endsWith('.html') || url.includes('.htm')) {
            setHtmlContent(text);
          } else {
            const paragraphs = text
              .split(/\n\s*\n/)
              .map((p) => `<p>${p.replace(/\n/g, '<br/>')}</p>`)
              .join('');
            setHtmlContent(paragraphs);
          }
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err.message : 'Unknown error loading text.');
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadContent();

    return () => {
      isMounted = false;
    };
  }, [currentBook, currentChapterIndex, isOpen]);

  // Scroll to top when chapter changes
  useEffect(() => {
    if (contentRef.current) {
      contentRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [currentChapterIndex]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const parsedBook = await parseUploadedEpub(file);
      setCurrentBook(parsedBook);
      setCurrentChapterIndex(0);
      if (onUploadNewEpub) {
        onUploadNewEpub(parsedBook);
      }
    } catch (err) {
      console.error('EPUB upload error:', err);
      alert('Failed to parse file. Please upload a standard .epub, .txt, or .html file.');
    } finally {
      setIsUploading(false);
      if (e.target) e.target.value = '';
    }
  };

  // Text-To-Speech Narration Toggle
  const toggleSpeechNarration = () => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      alert('Speech synthesis is not supported by your browser.');
      return;
    }

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = htmlContent || '';
    const cleanText = tempDiv.textContent || tempDiv.innerText || '';

    if (!cleanText.trim()) return;

    const utterance = new SpeechSynthesisUtterance(cleanText.substring(0, 15000));
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
    setIsSpeaking(true);
  };

  if (!isOpen) return null;

  const themes = {
    light: {
      bg: 'bg-[#FAFAFA]',
      text: 'text-gray-900',
      header: 'bg-white border-gray-200 shadow-sm',
      prose: 'prose-stone',
      button: 'hover:bg-gray-100 text-gray-700',
      settingsBg: 'bg-white border-gray-200 shadow-xl text-gray-900',
      spinner: 'border-gray-200 border-t-gray-800',
    },
    dark: {
      bg: 'bg-[#0D0D0D]',
      text: 'text-[#E0E0E0]',
      header: 'bg-[#141414] border-white/10 shadow-sm',
      prose: 'prose-invert',
      button: 'hover:bg-white/10 text-gray-300 hover:text-white',
      settingsBg: 'bg-[#181818] border-white/10 shadow-2xl text-white',
      spinner: 'border-white/10 border-t-[#C5A059]',
    },
    sepia: {
      bg: 'bg-[#F4EEDD]',
      text: 'text-[#362D1D]',
      header: 'bg-[#EDE4CD] border-black/10 shadow-sm',
      prose: 'prose-amber',
      button: 'hover:bg-black/5 text-[#362D1D]/80',
      settingsBg: 'bg-[#F4EEDD] border-black/10 shadow-xl text-[#362D1D]',
      spinner: 'border-black/20 border-t-[#C5A059]',
    },
  };

  const currentTheme = themes[theme];
  const hasChapters = currentBook.ebookChapters && currentBook.ebookChapters.length > 1;

  return (
    <div
      id="ebook-reader-modal"
      className={`fixed inset-0 z-50 flex flex-col animate-in fade-in duration-200 overflow-hidden font-serif ${currentTheme.bg} ${currentTheme.text}`}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept=".epub,.txt,.html,.htm"
        className="hidden"
        onChange={handleFileUpload}
      />

      {/* Reader Top App Bar */}
      <header
        className={`h-15 border-b flex items-center justify-between px-4 sm:px-6 shrink-0 z-10 ${currentTheme.header}`}
      >
        <div className="flex items-center gap-3 overflow-hidden min-w-0">
          <BookOpen className="w-5 h-5 text-[#C5A059] shrink-0" />
          <div className="min-w-0">
            <h2 className="text-sm font-semibold truncate opacity-90 font-sans tracking-wide">
              {currentBook.title}
            </h2>
            {currentBook.ebookChapters && currentBook.ebookChapters.length > 0 && (
              <p className="text-[11px] font-sans opacity-60 truncate">
                {currentBook.ebookChapters[currentChapterIndex]?.title ||
                  `Chapter ${currentChapterIndex + 1} of ${currentBook.ebookChapters.length}`}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0 font-sans">
          {/* Read Aloud Narration */}
          <button
            id="btn-reader-read-aloud"
            onClick={toggleSpeechNarration}
            className={`p-2 rounded-xl border transition-colors ${
              isSpeaking
                ? 'bg-[#C5A059] text-black border-[#C5A059]'
                : `border-transparent ${currentTheme.button}`
            }`}
            title={isSpeaking ? 'Stop Narration' : 'Read Aloud with AI Voice'}
          >
            {isSpeaking ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>

          {/* Chapter Drawer Toggle */}
          {hasChapters && (
            <button
              id="btn-reader-chapters"
              onClick={() => setShowChapterDrawer(!showChapterDrawer)}
              className={`p-2 rounded-xl transition-colors ${currentTheme.button}`}
              title="Table of Contents"
            >
              <List className="w-4 h-4" />
            </button>
          )}

          {/* Settings Toggle */}
          <button
            id="btn-reader-settings"
            onClick={() => setShowSettings(!showSettings)}
            className={`p-2 rounded-xl transition-colors ${currentTheme.button}`}
            title="Reader Settings"
          >
            <Settings2 className="w-4 h-4" />
          </button>

          {/* Close Reader */}
          <button
            id="btn-reader-close"
            onClick={onClose}
            className={`p-2 rounded-xl transition-colors ml-1 ${currentTheme.button}`}
            title="Close Reader"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Reader Settings Floating Dropdown */}
      {showSettings && (
        <div
          id="reader-settings-panel"
          className={`absolute top-16 right-4 p-5 rounded-2xl border z-30 w-72 shadow-2xl font-sans animate-in slide-in-from-top-2 duration-150 ${currentTheme.settingsBg}`}
        >
          <h3 className="text-xs uppercase font-bold opacity-50 mb-4 tracking-wider">Reader Typography & Theme</h3>

          <div className="space-y-4">
            {/* Text Size */}
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium opacity-80">Text Scale</span>
              <div className="flex gap-2">
                <button
                  onClick={() => setFontSize((f) => Math.max(12, f - 2))}
                  className={`w-8 h-8 rounded-xl border flex items-center justify-center font-serif text-xs transition-colors ${currentTheme.button}`}
                >
                  A-
                </button>
                <button
                  onClick={() => setFontSize((f) => Math.min(36, f + 2))}
                  className={`w-8 h-8 rounded-xl border flex items-center justify-center font-serif text-sm transition-colors ${currentTheme.button}`}
                >
                  A+
                </button>
              </div>
            </div>

            {/* Themes */}
            <div>
              <span className="text-xs font-medium opacity-80 mb-2 block">Appearance</span>
              <div className="grid grid-cols-3 gap-1.5">
                <button
                  onClick={() => setTheme('light')}
                  className={`py-1.5 rounded-lg border text-xs font-medium transition-all ${
                    theme === 'light' ? 'border-[#C5A059] ring-1 ring-[#C5A059]' : 'border-gray-300'
                  } bg-white text-gray-900`}
                >
                  Light
                </button>
                <button
                  onClick={() => setTheme('sepia')}
                  className={`py-1.5 rounded-lg border text-xs font-medium transition-all ${
                    theme === 'sepia' ? 'border-[#C5A059] ring-1 ring-[#C5A059]' : 'border-black/10'
                  } bg-[#F4EEDD] text-[#362D1D]`}
                >
                  Sepia
                </button>
                <button
                  onClick={() => setTheme('dark')}
                  className={`py-1.5 rounded-lg border text-xs font-medium transition-all ${
                    theme === 'dark' ? 'border-[#C5A059] ring-1 ring-[#C5A059]' : 'border-white/10'
                  } bg-[#111111] text-gray-200`}
                >
                  Dark
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Chapter Drawer / Table of Contents */}
      {showChapterDrawer && hasChapters && (
        <div
          id="reader-chapters-drawer"
          className={`absolute top-16 left-4 max-w-sm w-full p-4 rounded-2xl border z-30 shadow-2xl max-h-[70vh] flex flex-col font-sans animate-in slide-in-from-top-2 duration-150 ${currentTheme.settingsBg}`}
        >
          <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-2">
            <h4 className="text-xs uppercase font-bold opacity-60 tracking-wider">Table of Contents</h4>
            <button
              onClick={() => setShowChapterDrawer(false)}
              className="p-1 text-xs opacity-50 hover:opacity-100"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="overflow-y-auto space-y-1 pr-1 flex-1 scrollbar-thin">
            {currentBook.ebookChapters!.map((ch, idx) => (
              <button
                key={ch.id}
                onClick={() => {
                  setCurrentChapterIndex(idx);
                  setShowChapterDrawer(false);
                }}
                className={`w-full text-left px-3 py-2 rounded-xl text-xs transition-colors flex items-center justify-between ${
                  idx === currentChapterIndex
                    ? 'bg-[#C5A059] text-black font-semibold'
                    : 'hover:bg-white/5 opacity-80 hover:opacity-100'
                }`}
              >
                <span className="truncate">{ch.title}</span>
                <span className="text-[10px] opacity-60 ml-2 font-mono">#{idx + 1}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Main Text Manuscript View */}
      <div
        ref={contentRef}
        id="reader-content-scroll"
        className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-black/20 pb-28"
      >
        <div className="max-w-3xl mx-auto px-6 py-10 md:px-12 md:py-14">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-64 opacity-70">
              <div className={`w-8 h-8 rounded-full border-2 animate-spin mb-4 ${currentTheme.spinner}`} />
              <p className="font-sans text-xs tracking-wide">Rendering document manuscript...</p>
            </div>
          ) : error ? (
            <div className="text-center py-20 opacity-80 max-w-md mx-auto space-y-4">
              <p className="text-sm font-sans font-semibold text-[#C5A059]">Digital Text Unavailable for this Title</p>
              <p className="text-xs font-sans opacity-60 leading-relaxed">
                This audiobook comes from public domain audio archives. You can also import any local EPUB file to read right here!
              </p>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="px-4 py-2.5 rounded-xl bg-[#C5A059] text-black font-sans font-semibold text-xs inline-flex items-center gap-2"
              >
                <Upload className="w-4 h-4" />
                <span>Upload EPUB to Read</span>
              </button>
            </div>
          ) : (
            <article
              className={`prose ${currentTheme.prose} prose-headings:font-serif prose-p:font-serif prose-p:leading-relaxed mx-auto max-w-full`}
              style={{ fontSize: `${fontSize}px`, lineHeight: 1.7 }}
              dangerouslySetInnerHTML={{ __html: htmlContent || '' }}
            />
          )}
        </div>
      </div>

      {/* Bottom Chapter Next/Prev Floating Navigation */}
      {hasChapters && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-3 bg-[#111111]/90 backdrop-blur-md px-4 py-2 rounded-full border border-white/10 shadow-2xl text-white font-sans text-xs z-20">
          <button
            disabled={currentChapterIndex === 0}
            onClick={() => setCurrentChapterIndex((i) => Math.max(0, i - 1))}
            className="p-1.5 rounded-full hover:bg-white/10 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
            title="Previous Chapter"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="font-mono text-[11px] text-[#C5A059] px-2 font-medium">
            Chapter {currentChapterIndex + 1} / {currentBook.ebookChapters!.length}
          </span>
          <button
            disabled={currentChapterIndex === currentBook.ebookChapters!.length - 1}
            onClick={() =>
              setCurrentChapterIndex((i) =>
                Math.min(currentBook.ebookChapters!.length - 1, i + 1)
              )
            }
            className="p-1.5 rounded-full hover:bg-white/10 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
            title="Next Chapter"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
};
