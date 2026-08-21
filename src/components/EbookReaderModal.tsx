import React, { useState, useEffect, useMemo } from 'react';
import { Audiobook, PlayerState, EbookChapter, EbookReaderSettings } from '../types';
import { getEbookForBook } from '../data/ebookData';
import {
  BookOpen,
  X,
  Type,
  Sun,
  Moon,
  Palette,
  ChevronLeft,
  ChevronRight,
  ListOrdered,
  Search,
  Play,
  Pause,
  RotateCcw,
  RotateCw,
  Volume2,
  VolumeX,
  Maximize2,
  Minimize2,
  Bookmark,
  Share2,
  Check,
  Headphones,
  Sliders,
} from 'lucide-react';

interface EbookReaderModalProps {
  isOpen: boolean;
  book: Audiobook | null;
  playerState: PlayerState;
  onClose: () => void;
  onTogglePlayPause: () => void;
  onSeek: (seconds: number) => void;
  onRewind15: () => void;
  onForward30: () => void;
  onSelectAudioTrack: (index: number) => void;
}

export const EbookReaderModal: React.FC<EbookReaderModalProps> = ({
  isOpen,
  book,
  playerState,
  onClose,
  onTogglePlayPause,
  onSeek,
  onRewind15,
  onForward30,
  onSelectAudioTrack,
}) => {
  const [chapters, setChapters] = useState<EbookChapter[]>([]);
  const [currentChapterIndex, setCurrentChapterIndex] = useState(0);
  const [isLoadingChapters, setIsLoadingChapters] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [showToc, setShowToc] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [copied, setCopied] = useState(false);

  // Reader Settings State
  const [settings, setSettings] = useState<EbookReaderSettings>({
    fontSize: 18,
    fontFamily: 'serif',
    theme: 'obsidian',
    lineHeight: 1.8,
  });

  // Load chapters when book changes
  useEffect(() => {
    if (!book) return;
    setIsLoadingChapters(true);
    getEbookForBook(book.id, book.title, book.author).then((data) => {
      setChapters(data);
      setCurrentChapterIndex(0);
      setIsLoadingChapters(false);
    });
  }, [book]);

  if (!isOpen || !book) return null;

  const currentChapter = chapters[currentChapterIndex] || null;

  // Theme styling definitions
  const themeStyles = {
    obsidian: {
      bg: 'bg-[#080808]',
      cardBg: 'bg-[#111111]',
      text: 'text-[#E8E8E8]',
      subtext: 'text-white/50',
      border: 'border-white/10',
      accent: 'text-[#C5A059]',
      accentBg: 'bg-[#C5A059]',
      accentBorder: 'border-[#C5A059]',
      headerBg: 'bg-[#0e0e0e]/95',
      dockBg: 'bg-[#0e0e0e]/95',
    },
    sepia: {
      bg: 'bg-[#FBF0D9]',
      cardBg: 'bg-[#F3E5C8]',
      text: 'text-[#3E2F1F]',
      subtext: 'text-[#6D5A43]',
      border: 'border-[#E0D0B0]',
      accent: 'text-[#8E4B10]',
      accentBg: 'bg-[#8E4B10]',
      accentBorder: 'border-[#8E4B10]',
      headerBg: 'bg-[#F7EBD0]/95',
      dockBg: 'bg-[#F7EBD0]/95',
    },
    paper: {
      bg: 'bg-[#F8F9FA]',
      cardBg: 'bg-[#FFFFFF]',
      text: 'text-[#1A1A1A]',
      subtext: 'text-[#555555]',
      border: 'border-gray-200',
      accent: 'text-[#9A7B38]',
      accentBg: 'bg-[#9A7B38]',
      accentBorder: 'border-[#9A7B38]',
      headerBg: 'bg-[#FFFFFF]/95',
      dockBg: 'bg-[#FFFFFF]/95',
    },
    midnight: {
      bg: 'bg-[#000000]',
      cardBg: 'bg-[#0A0A0A]',
      text: 'text-[#D4D4D4]',
      subtext: 'text-[#808080]',
      border: 'border-white/10',
      accent: 'text-[#D4AF65]',
      accentBg: 'bg-[#D4AF65]',
      accentBorder: 'border-[#D4AF65]',
      headerBg: 'bg-[#050505]/95',
      dockBg: 'bg-[#050505]/95',
    },
  }[settings.theme];

  const fontClass = {
    serif: 'font-serif',
    sans: 'font-sans',
    mono: 'font-mono',
    literary: 'font-serif-display',
  }[settings.fontFamily];

  const handleCopyChapter = () => {
    if (!currentChapter) return;
    navigator.clipboard.writeText(`${book.title} - ${currentChapter.title}\n\n${currentChapter.content}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formatTime = (secs: number) => {
    if (isNaN(secs) || secs < 0) return '0:00';
    const minutes = Math.floor(secs / 60);
    const seconds = Math.floor(secs % 60);
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  return (
    <div
      id="ebook-reader-modal"
      className={`fixed inset-0 z-50 flex flex-col ${themeStyles.bg} ${themeStyles.text} select-text overflow-hidden animate-fade-in`}
    >
      {/* Top Reader Navigation Bar */}
      <header
        id="reader-header"
        className={`flex items-center justify-between px-4 py-3 border-b ${themeStyles.border} ${themeStyles.headerBg} backdrop-blur-md z-30 shrink-0`}
      >
        <div className="flex items-center gap-3 min-w-0">
          <button
            id="btn-close-ebook-reader"
            onClick={onClose}
            className={`p-2 rounded-xl border ${themeStyles.border} hover:bg-white/10 transition-colors shrink-0`}
            title="Close Ebook Reader"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className={`text-[9px] uppercase font-bold tracking-widest px-1.5 py-0.5 rounded bg-black/10 dark:bg-white/10 ${themeStyles.accent}`}>
                Ebook Edition
              </span>
              <span className={`text-xs ${themeStyles.subtext} font-mono`}>
                {chapters.length > 0 ? `Chapter ${currentChapterIndex + 1} of ${chapters.length}` : 'Loading...'}
              </span>
            </div>
            <h2 className={`text-sm font-semibold truncate ${fontClass}`}>
              {book.title}
            </h2>
          </div>
        </div>

        {/* Reader Controls Toolbar */}
        <div className="flex items-center gap-1.5 shrink-0">
          {/* Search in Text Toggle */}
          <button
            id="btn-toggle-reader-search"
            onClick={() => setShowSearch(!showSearch)}
            className={`p-2 rounded-xl border ${themeStyles.border} hover:bg-white/10 transition-colors ${
              showSearch ? `${themeStyles.accent} bg-white/10` : themeStyles.subtext
            }`}
            title="Search chapter text"
          >
            <Search className="w-4 h-4" />
          </button>

          {/* Table of Contents */}
          <button
            id="btn-toggle-reader-toc"
            onClick={() => {
              setShowToc(!showToc);
              setShowSettings(false);
            }}
            className={`p-2 rounded-xl border ${themeStyles.border} hover:bg-white/10 transition-colors ${
              showToc ? `${themeStyles.accent} bg-white/10` : themeStyles.subtext
            }`}
            title="Table of Contents"
          >
            <ListOrdered className="w-4 h-4" />
          </button>

          {/* Typography / Theme Settings Button */}
          <button
            id="btn-toggle-reader-settings"
            onClick={() => {
              setShowSettings(!showSettings);
              setShowToc(false);
            }}
            className={`p-2 rounded-xl border ${themeStyles.border} hover:bg-white/10 transition-colors ${
              showSettings ? `${themeStyles.accent} bg-white/10` : themeStyles.subtext
            }`}
            title="Adjust Reader Typography & Theme"
          >
            <Type className="w-4 h-4" />
          </button>

          {/* Copy Text Action */}
          <button
            id="btn-copy-reader-text"
            onClick={handleCopyChapter}
            className={`p-2 rounded-xl border ${themeStyles.border} hover:bg-white/10 transition-colors ${themeStyles.subtext}`}
            title="Copy Chapter Text"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Share2 className="w-4 h-4" />}
          </button>
        </div>
      </header>

      {/* Floating Settings Panel */}
      {showSettings && (
        <div
          id="reader-settings-panel"
          className={`absolute top-16 right-4 z-40 w-80 p-4 rounded-2xl ${themeStyles.cardBg} border ${themeStyles.border} shadow-2xl shadow-black/80 space-y-4 animate-in fade-in zoom-in-95`}
        >
          <div className="flex items-center justify-between pb-2 border-b border-white/10">
            <h4 className="text-xs font-semibold uppercase tracking-wider">Reader Display Settings</h4>
            <button onClick={() => setShowSettings(false)} className="text-xs text-white/40 hover:text-white">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Font Size Adjustment */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-[11px] font-medium opacity-75">
              <span>Font Size</span>
              <span>{settings.fontSize}px</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setSettings((s) => ({ ...s, fontSize: Math.max(12, s.fontSize - 2) }))}
                className={`flex-1 py-1.5 rounded-lg border ${themeStyles.border} hover:bg-white/10 text-xs font-bold`}
              >
                A-
              </button>
              <button
                onClick={() => setSettings((s) => ({ ...s, fontSize: Math.min(28, s.fontSize + 2) }))}
                className={`flex-1 py-1.5 rounded-lg border ${themeStyles.border} hover:bg-white/10 text-xs font-bold`}
              >
                A+
              </button>
            </div>
          </div>

          {/* Font Family Selection */}
          <div className="space-y-1.5">
            <div className="text-[11px] font-medium opacity-75">Font Typeface</div>
            <div className="grid grid-cols-3 gap-1.5">
              {(
                [
                  { id: 'serif', label: 'Classic Serif' },
                  { id: 'sans', label: 'Modern Sans' },
                  { id: 'mono', label: 'Monospace' },
                ] as const
              ).map((font) => (
                <button
                  key={font.id}
                  onClick={() => setSettings((s) => ({ ...s, fontFamily: font.id }))}
                  className={`py-1.5 px-2 rounded-lg border text-[11px] font-medium transition-all ${
                    settings.fontFamily === font.id
                      ? `${themeStyles.accentBorder} ${themeStyles.accent} bg-white/10 font-bold`
                      : `${themeStyles.border} opacity-70 hover:opacity-100`
                  }`}
                >
                  {font.label}
                </button>
              ))}
            </div>
          </div>

          {/* Theme Palette Selection */}
          <div className="space-y-1.5">
            <div className="text-[11px] font-medium opacity-75">Color Theme</div>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setSettings((s) => ({ ...s, theme: 'obsidian' }))}
                className={`flex items-center gap-2 p-2 rounded-xl border transition-all ${
                  settings.theme === 'obsidian' ? 'border-[#C5A059] ring-1 ring-[#C5A059]' : 'border-white/10'
                } bg-[#080808] text-white`}
              >
                <div className="w-3.5 h-3.5 rounded-full bg-[#C5A059]" />
                <span className="text-xs">Obsidian Gold</span>
              </button>

              <button
                onClick={() => setSettings((s) => ({ ...s, theme: 'sepia' }))}
                className={`flex items-center gap-2 p-2 rounded-xl border transition-all ${
                  settings.theme === 'sepia' ? 'border-[#8E4B10] ring-1 ring-[#8E4B10]' : 'border-[#E0D0B0]'
                } bg-[#FBF0D9] text-[#3E2F1F]`}
              >
                <div className="w-3.5 h-3.5 rounded-full bg-[#8E4B10]" />
                <span className="text-xs">Vintage Sepia</span>
              </button>

              <button
                onClick={() => setSettings((s) => ({ ...s, theme: 'paper' }))}
                className={`flex items-center gap-2 p-2 rounded-xl border transition-all ${
                  settings.theme === 'paper' ? 'border-gray-800 ring-1 ring-gray-800' : 'border-gray-200'
                } bg-[#F8F9FA] text-[#1A1A1A]`}
              >
                <div className="w-3.5 h-3.5 rounded-full bg-gray-400" />
                <span className="text-xs">Paper White</span>
              </button>

              <button
                onClick={() => setSettings((s) => ({ ...s, theme: 'midnight' }))}
                className={`flex items-center gap-2 p-2 rounded-xl border transition-all ${
                  settings.theme === 'midnight' ? 'border-white/40 ring-1 ring-white/40' : 'border-white/10'
                } bg-[#000000] text-[#D4D4D4]`}
              >
                <div className="w-3.5 h-3.5 rounded-full bg-white/40" />
                <span className="text-xs">Midnight OLED</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Table of Contents Drawer */}
      {showToc && (
        <div
          id="reader-toc-panel"
          className={`absolute top-16 right-4 z-40 w-80 max-h-[70vh] flex flex-col p-4 rounded-2xl ${themeStyles.cardBg} border ${themeStyles.border} shadow-2xl shadow-black/80 animate-in fade-in zoom-in-95`}
        >
          <div className="flex items-center justify-between pb-3 border-b border-white/10">
            <h4 className="text-xs font-semibold uppercase tracking-wider">Table of Contents</h4>
            <button onClick={() => setShowToc(false)} className="text-xs text-white/40 hover:text-white">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto py-2 space-y-1 scrollbar-thin">
            {chapters.map((ch, idx) => (
              <button
                key={ch.id}
                onClick={() => {
                  setCurrentChapterIndex(idx);
                  setShowToc(false);
                }}
                className={`w-full text-left p-2.5 rounded-xl text-xs transition-all flex items-center justify-between ${
                  idx === currentChapterIndex
                    ? `${themeStyles.accent} bg-white/10 font-bold`
                    : 'opacity-70 hover:opacity-100 hover:bg-white/5'
                }`}
              >
                <span className="truncate">{ch.title}</span>
                {idx === currentChapterIndex && <Check className="w-3.5 h-3.5 shrink-0" />}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Search Bar Banner */}
      {showSearch && (
        <div className={`px-4 py-2 border-b ${themeStyles.border} ${themeStyles.headerBg} flex items-center gap-2`}>
          <Search className="w-4 h-4 opacity-50" />
          <input
            type="text"
            placeholder="Search keywords in current chapter..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={`flex-1 bg-transparent text-xs outline-none ${themeStyles.text}`}
            autoFocus
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} className="p-1 opacity-50 hover:opacity-100">
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      )}

      {/* Main Ebook Content Scrollable Stage */}
      <main
        id="reader-content-stage"
        className="flex-1 overflow-y-auto px-4 sm:px-8 py-8 max-w-3xl mx-auto w-full scrollbar-thin"
        style={{
          fontSize: `${settings.fontSize}px`,
          lineHeight: settings.lineHeight,
        }}
      >
        {isLoadingChapters ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-3">
            <div className={`w-8 h-8 border-2 ${themeStyles.accentBorder} border-t-transparent rounded-full animate-spin`} />
            <p className={`text-xs ${themeStyles.subtext}`}>Loading Gutenberg Ebook Text...</p>
          </div>
        ) : currentChapter ? (
          <article className={`space-y-6 ${fontClass}`}>
            {/* Chapter Header */}
            <div className="text-center pb-6 border-b border-black/10 dark:border-white/10 space-y-2">
              <span className={`text-[10px] uppercase font-bold tracking-[0.2em] ${themeStyles.accent}`}>
                {book.author}
              </span>
              <h1 className="text-2xl sm:text-3xl font-serif-display italic font-semibold leading-snug">
                {currentChapter.title}
              </h1>
              <p className={`text-xs ${themeStyles.subtext}`}>Public Domain Unabridged Edition</p>
            </div>

            {/* Formatted Chapter Paragraphs */}
            <div className="space-y-4 pt-2">
              {currentChapter.content.split('\n\n').map((paragraph, pIdx) => {
                if (paragraph.trim() === '***') {
                  return (
                    <div key={pIdx} className="text-center py-4 tracking-widest opacity-40 font-serif">
                      * * *
                    </div>
                  );
                }

                // If searching, highlight query text
                if (searchQuery.trim().length > 1) {
                  const parts = paragraph.split(new RegExp(`(${searchQuery})`, 'gi'));
                  return (
                    <p key={pIdx} className="text-justify leading-relaxed indent-4">
                      {parts.map((part, i) =>
                        part.toLowerCase() === searchQuery.toLowerCase() ? (
                          <mark key={i} className="bg-amber-300 text-black px-1 rounded">
                            {part}
                          </mark>
                        ) : (
                          part
                        )
                      )}
                    </p>
                  );
                }

                return (
                  <p key={pIdx} className="text-justify leading-relaxed indent-4">
                    {paragraph}
                  </p>
                );
              })}
            </div>

            {/* Chapter End Navigation Buttons */}
            <div className={`pt-10 pb-20 border-t ${themeStyles.border} flex items-center justify-between gap-4`}>
              <button
                disabled={currentChapterIndex === 0}
                onClick={() => {
                  setCurrentChapterIndex((prev) => Math.max(0, prev - 1));
                  document.getElementById('reader-content-stage')?.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-xl border ${themeStyles.border} text-xs font-semibold transition-all disabled:opacity-30 disabled:pointer-events-none hover:bg-white/10`}
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Previous Chapter</span>
              </button>

              <span className={`text-[11px] ${themeStyles.subtext} font-mono`}>
                {currentChapterIndex + 1} / {chapters.length}
              </span>

              <button
                disabled={currentChapterIndex >= chapters.length - 1}
                onClick={() => {
                  setCurrentChapterIndex((prev) => Math.min(chapters.length - 1, prev + 1));
                  document.getElementById('reader-content-stage')?.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-xl border ${themeStyles.border} text-xs font-semibold transition-all disabled:opacity-30 disabled:pointer-events-none hover:bg-white/10`}
              >
                <span>Next Chapter</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </article>
        ) : (
          <div className="text-center py-20 text-xs opacity-60">No chapter text available.</div>
        )}
      </main>

      {/* Synchronized "Read & Listen" Audio Dock (Pinned at Bottom) */}
      <footer
        id="reader-audio-dock"
        className={`border-t ${themeStyles.border} ${themeStyles.dockBg} backdrop-blur-xl px-4 py-2.5 flex items-center justify-between gap-3 z-30 shrink-0 shadow-2xl`}
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-8 h-8 rounded-lg overflow-hidden shrink-0 border border-white/10 bg-black/40">
            <img
              src={book.coverImageUrl}
              alt={book.title}
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <Headphones className={`w-3 h-3 ${themeStyles.accent}`} />
              <span className={`text-[10px] uppercase font-bold tracking-wider ${themeStyles.accent}`}>
                {playerState.isPlaying ? 'Listening Now' : 'Audiobook Sync'}
              </span>
            </div>
            <p className={`text-xs font-serif-display italic truncate max-w-[200px] sm:max-w-xs ${themeStyles.text}`}>
              {playerState.currentTrack?.title || book.title}
            </p>
          </div>
        </div>

        {/* Audio Controls */}
        <div className="flex items-center gap-2">
          {/* Rewind 15s */}
          <button
            onClick={onRewind15}
            className={`p-2 rounded-full border ${themeStyles.border} hover:bg-white/10 text-xs transition-colors`}
            title="Rewind 15s"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>

          {/* Main Play / Pause */}
          <button
            onClick={onTogglePlayPause}
            className={`w-9 h-9 rounded-full ${themeStyles.accentBg} text-black flex items-center justify-center shadow-lg transition-transform active:scale-95`}
          >
            {playerState.isBuffering ? (
              <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
            ) : playerState.isPlaying ? (
              <Pause className="w-4 h-4 fill-current" />
            ) : (
              <Play className="w-4 h-4 fill-current ml-0.5" />
            )}
          </button>

          {/* Forward 30s */}
          <button
            onClick={onForward30}
            className={`p-2 rounded-full border ${themeStyles.border} hover:bg-white/10 text-xs transition-colors`}
            title="Forward 30s"
          >
            <RotateCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </footer>
    </div>
  );
};
