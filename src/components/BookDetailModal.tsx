import React, { useState, useEffect } from 'react';
import { Audiobook, AudioTrack, PlayerState } from '../types';
import {
  X,
  Play,
  Pause,
  Clock,
  BookOpen,
  Bookmark,
  Download,
  Check,
  User,
  Radio,
  FileText,
  Volume2,
  Share2,
} from 'lucide-react';
import { resolveFullTracklist } from '../utils/librivoxRecommendations';
import { downloadAudiobook, isBookOfflineReady } from '../utils/offlineStorage';

interface BookDetailModalProps {
  isOpen: boolean;
  book: Audiobook | null;
  playerState: PlayerState;
  onClose: () => void;
  onPlayBook: (book: Audiobook, trackIndex?: number) => void;
  onTogglePlayPause: () => void;
  onOpenEbookReader: (book: Audiobook) => void;
  onToggleSaveBook: (book: Audiobook) => void;
  isSaved: boolean;
}

export const BookDetailModal: React.FC<BookDetailModalProps> = ({
  isOpen,
  book,
  playerState,
  onClose,
  onPlayBook,
  onTogglePlayPause,
  onOpenEbookReader,
  onToggleSaveBook,
  isSaved,
}) => {
  const [resolvedBook, setResolvedBook] = useState<Audiobook | null>(book);
  const [isLoadingChapters, setIsLoadingChapters] = useState(false);
  const [isOffline, setIsOffline] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [activeTab, setActiveTab] = useState<'info' | 'chapters'>('info');

  // Load and resolve chapters when book changes
  useEffect(() => {
    if (!book) return;
    setResolvedBook(book);

    let isMounted = true;
    isBookOfflineReady(book.id).then((ready) => {
      if (isMounted) setIsOffline(ready);
    });

    if (book.tracks.length <= 1) {
      setIsLoadingChapters(true);
      resolveFullTracklist(book).then((fullBook) => {
        if (isMounted) {
          setResolvedBook(fullBook);
          setIsLoadingChapters(false);
        }
      });
    }

    return () => {
      isMounted = false;
    };
  }, [book?.id]);

  if (!isOpen || !book) return null;

  const currentActiveBook = resolvedBook || book;
  const isCurrentPlayingBook = playerState.currentBook?.id === currentActiveBook.id;
  const isPlaying = isCurrentPlayingBook && playerState.isPlaying;

  const formatDuration = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    if (hrs > 0) return `${hrs}h ${mins}m`;
    return `${mins}m`;
  };

  const handleDownload = async () => {
    if (isOffline || isDownloading) return;
    setIsDownloading(true);
    try {
      await downloadAudiobook(currentActiveBook, (p) => {
        setDownloadProgress(p);
      });
      setIsOffline(true);
    } catch (e) {
      console.warn('Download error:', e);
    } finally {
      setIsDownloading(false);
    }
  };

  const handlePrimaryPlayClick = () => {
    if (isCurrentPlayingBook) {
      onTogglePlayPause();
    } else {
      onPlayBook(currentActiveBook, 0);
    }
  };

  return (
    <div
      id="book-detail-modal-overlay"
      className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4 overflow-y-auto animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        id="book-detail-modal-card"
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-2xl max-h-[90vh] bg-[#0E0E0E] rounded-t-3xl sm:rounded-3xl border border-white/[0.12] shadow-2xl overflow-hidden flex flex-col my-auto"
      >
        {/* Modal Top Action Bar */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.08] bg-[#141414]/90 shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-widest text-[#C5A059] bg-[#C5A059]/10 px-2.5 py-1 rounded-full border border-[#C5A059]/25 flex items-center gap-1.5">
              <Radio className="w-3 h-3 animate-pulse text-[#C5A059]" /> LibriVox Archive
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            {/* Save to Library Bookmark */}
            <button
              id="btn-detail-toggle-save"
              onClick={() => onToggleSaveBook(currentActiveBook)}
              className={`p-2 rounded-xl transition-all ${
                isSaved
                  ? 'bg-[#C5A059] text-black'
                  : 'bg-white/[0.05] hover:bg-white/[0.1] text-white/70 hover:text-white border border-white/10'
              }`}
              title={isSaved ? 'Saved in Library' : 'Save to Library'}
            >
              <Bookmark className={`w-4 h-4 ${isSaved ? 'fill-current' : ''}`} />
            </button>

            {/* Offline Download Button */}
            <button
              id="btn-detail-download"
              onClick={handleDownload}
              disabled={isOffline || isDownloading}
              className={`p-2 rounded-xl transition-all ${
                isOffline
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  : isDownloading
                  ? 'bg-[#C5A059]/20 text-[#C5A059] border border-[#C5A059]/40'
                  : 'bg-white/[0.05] hover:bg-white/[0.1] text-white/70 hover:text-white border border-white/10'
              }`}
              title={isOffline ? 'Downloaded Offline' : 'Download for Offline Listening'}
            >
              {isOffline ? (
                <Check className="w-4 h-4" />
              ) : isDownloading ? (
                <div className="w-4 h-4 border-2 border-[#C5A059] border-t-transparent rounded-full animate-spin" />
              ) : (
                <Download className="w-4 h-4" />
              )}
            </button>

            {/* Close Modal Button */}
            <button
              id="btn-close-book-detail"
              onClick={onClose}
              className="p-2 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] text-white/60 hover:text-white border border-white/10 transition-colors ml-1"
              title="Close Details"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Scrollable Content Body */}
        <div className="overflow-y-auto p-5 sm:p-6 space-y-6 scrollbar-none flex-1">
          {/* Main Book Header Info & Primary Play Controls */}
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 sm:gap-6 bg-[#141414] p-5 rounded-2xl border border-white/[0.08]">
            {/* Book Cover Artwork */}
            <div className="relative w-32 sm:w-36 aspect-[3/4] shrink-0 rounded-xl overflow-hidden shadow-2xl shadow-black border border-white/15 bg-[#181818]">
              <img
                src={currentActiveBook.coverImageUrl}
                alt={currentActiveBook.title}
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end justify-center pb-2">
                <span className="text-[10px] font-semibold text-white/90 bg-black/70 px-2 py-0.5 rounded-full backdrop-blur-xs border border-white/15">
                  {currentActiveBook.tracks.length} Ch.
                </span>
              </div>
            </div>

            {/* Book Metadata & Primary Play Button Next to it */}
            <div className="flex-1 min-w-0 text-center sm:text-left flex flex-col justify-between">
              <div>
                <h2 className="text-xl sm:text-2xl font-serif-display italic font-bold text-white tracking-wide leading-tight">
                  {currentActiveBook.title}
                </h2>
                <p className="text-sm font-serif-display italic text-[#C5A059] font-medium mt-1">
                  {currentActiveBook.author}
                </p>

                {/* Narrator & Runtime Badges */}
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mt-3 text-xs text-white/60">
                  <span className="flex items-center gap-1 bg-white/[0.04] px-2.5 py-1 rounded-lg border border-white/5">
                    <User className="w-3.5 h-3.5 text-[#C5A059]" />
                    <span className="truncate max-w-[160px]">{currentActiveBook.reader || 'LibriVox Community'}</span>
                  </span>
                  <span className="flex items-center gap-1 bg-white/[0.04] px-2.5 py-1 rounded-lg border border-white/5 font-mono">
                    <Clock className="w-3.5 h-3.5 text-[#C5A059]" />
                    <span>{formatDuration(currentActiveBook.totalTimeSecs)}</span>
                  </span>
                  <span className="bg-white/[0.04] px-2.5 py-1 rounded-lg border border-white/5 uppercase text-[10px] font-bold text-[#C5A059]">
                    {currentActiveBook.language || 'English'}
                  </span>
                </div>
              </div>

              {/* Big Action Buttons Row (Play Button prominently next to Information) */}
              <div className="flex items-center justify-center sm:justify-start gap-3 mt-5 pt-3 border-t border-white/5">
                <button
                  id={`btn-play-book-detail-${currentActiveBook.id}`}
                  onClick={handlePrimaryPlayClick}
                  className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2.5 px-6 py-3 rounded-xl bg-[#C5A059] hover:bg-[#d4af65] text-black text-xs font-bold shadow-[0_0_25px_rgba(197,160,89,0.4)] transition-all active:scale-95"
                >
                  {isPlaying ? (
                    <>
                      <Pause className="w-4 h-4 fill-current" />
                      <span>Pause Audio</span>
                    </>
                  ) : isCurrentPlayingBook ? (
                    <>
                      <Play className="w-4 h-4 fill-current" />
                      <span>Resume Audio</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4 fill-current" />
                      <span>Play Audiobook</span>
                    </>
                  )}
                </button>

                <button
                  id="btn-detail-read-ebook"
                  onClick={() => {
                    onClose();
                    onOpenEbookReader(currentActiveBook);
                  }}
                  className="inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-white/[0.06] hover:bg-[#C5A059]/20 text-white/90 hover:text-[#C5A059] border border-white/10 hover:border-[#C5A059]/40 text-xs font-semibold transition-all active:scale-95"
                  title="Read Ebook Text"
                >
                  <BookOpen className="w-4 h-4 text-[#C5A059]" />
                  <span className="hidden sm:inline">Read Ebook</span>
                </button>
              </div>
            </div>
          </div>

          {/* Section Switcher Tabs: Synopsis / Chapters */}
          <div className="flex items-center gap-2 border-b border-white/10 pb-2">
            <button
              id="tab-detail-info"
              onClick={() => setActiveTab('info')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                activeTab === 'info'
                  ? 'bg-[#C5A059] text-black shadow-md'
                  : 'text-white/60 hover:text-white hover:bg-white/[0.04]'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Book Overview & Synopsis</span>
            </button>

            <button
              id="tab-detail-chapters"
              onClick={() => setActiveTab('chapters')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                activeTab === 'chapters'
                  ? 'bg-[#C5A059] text-black shadow-md'
                  : 'text-white/60 hover:text-white hover:bg-white/[0.04]'
              }`}
            >
              <Volume2 className="w-3.5 h-3.5" />
              <span>Chapters ({currentActiveBook.tracks.length})</span>
            </button>
          </div>

          {/* TAB 1: Synopsis & Description */}
          {activeTab === 'info' && (
            <div id="book-detail-synopsis" className="space-y-4">
              <div className="bg-[#121212] p-4 sm:p-5 rounded-2xl border border-white/[0.06]">
                <h4 className="text-xs font-bold uppercase tracking-widest text-[#C5A059] mb-2 font-mono">
                  LibriVox Recording Synopsis
                </h4>
                <div className="text-xs sm:text-sm text-white/80 font-serif-display italic leading-relaxed whitespace-pre-line">
                  {currentActiveBook.description ||
                    'Classic unabridged recording from the LibriVox volunteer community. In the public domain and available for streaming and offline listening.'}
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div className="p-3 rounded-xl bg-white/[0.03] border border-white/5">
                  <span className="text-[10px] text-white/40 uppercase block">Catalog Source</span>
                  <span className="text-xs text-white font-medium">LibriVox / IA</span>
                </div>
                <div className="p-3 rounded-xl bg-white/[0.03] border border-white/5">
                  <span className="text-[10px] text-white/40 uppercase block">Total Duration</span>
                  <span className="text-xs text-white font-medium font-mono">{formatDuration(currentActiveBook.totalTimeSecs)}</span>
                </div>
                <div className="p-3 rounded-xl bg-white/[0.03] border border-white/5 col-span-2 sm:col-span-1">
                  <span className="text-[10px] text-white/40 uppercase block">Copyright Status</span>
                  <span className="text-xs text-[#C5A059] font-medium">Public Domain (Free)</span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: Chapters & Tracks List */}
          {activeTab === 'chapters' && (
            <div id="book-detail-chapters-list" className="space-y-2">
              {isLoadingChapters ? (
                <div className="py-8 text-center space-y-2">
                  <div className="w-5 h-5 border-2 border-[#C5A059] border-t-transparent rounded-full animate-spin mx-auto" />
                  <p className="text-xs text-white/50">Fetching complete chapter list from archive...</p>
                </div>
              ) : (
                currentActiveBook.tracks.map((track, idx) => {
                  const isTrackActive =
                    isCurrentPlayingBook && playerState.currentTrack?.id === track.id;

                  return (
                    <div
                      key={track.id || idx}
                      id={`detail-track-${track.id || idx}`}
                      onClick={() => onPlayBook(currentActiveBook, idx)}
                      className={`flex items-center justify-between p-3 rounded-xl transition-all cursor-pointer border ${
                        isTrackActive
                          ? 'bg-[#C5A059]/15 border-[#C5A059]/50 text-white'
                          : 'bg-[#121212] border-white/[0.06] hover:border-[#C5A059]/30 hover:bg-[#161616] text-white/80'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0 pr-2">
                        <span className="w-6 text-center text-xs font-mono text-white/40 font-bold shrink-0">
                          {idx + 1}
                        </span>
                        <div className="min-w-0">
                          <p className="text-xs font-medium truncate">{track.title}</p>
                          <p className="text-[10px] text-white/40 font-mono mt-0.5">
                            {formatDuration(track.durationSeconds || 1200)}
                          </p>
                        </div>
                      </div>

                      <button
                        className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-all ${
                          isTrackActive
                            ? 'bg-[#C5A059] text-black shadow-md'
                            : 'bg-white/[0.05] hover:bg-[#C5A059] text-white/70 hover:text-black'
                        }`}
                        title="Play this track"
                      >
                        {isTrackActive && playerState.isPlaying ? (
                          <Pause className="w-3.5 h-3.5 fill-current" />
                        ) : (
                          <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                        )}
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
