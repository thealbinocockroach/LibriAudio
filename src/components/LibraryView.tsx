import React, { useState, useRef } from 'react';
import { Audiobook, Bookmark as BookmarkType, OfflineBookData } from '../types';
import {
  Bookmark,
  History,
  Play,
  Trash2,
  BookOpen,
  HardDrive,
  Download,
  CheckCircle2,
  MessageSquare,
  Clock,
  WifiOff,
  Upload,
} from 'lucide-react';
import { formatBytes } from '../utils/offlineStorage';
import { ListeningHabitsChart } from './ListeningHabitsChart';
import { parseUploadedEpub } from '../utils/epubParser';

interface LibraryViewProps {
  history: Audiobook[];
  savedBooks: Audiobook[];
  offlineBooks: OfflineBookData[];
  bookmarks: BookmarkType[];
  onSelectBook: (book: Audiobook) => void;
  onReadBook?: (book: Audiobook) => void;
  onClearHistory: () => void;
  onDeleteBookmark: (id: string) => void;
  onJumpToBookmark: (bm: BookmarkType) => void;
  onOpenOfflineManager: () => void;
  onUploadEpub: (book: Audiobook) => void;
}

export const LibraryView: React.FC<LibraryViewProps> = ({
  history,
  savedBooks,
  offlineBooks,
  bookmarks,
  onSelectBook,
  onReadBook,
  onClearHistory,
  onDeleteBookmark,
  onJumpToBookmark,
  onOpenOfflineManager,
  onUploadEpub,
}) => {
  const [tab, setTab] = useState<'saved' | 'offline' | 'history' | 'bookmarks'>('saved');
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const readyOffline = offlineBooks.filter((b) => b.status === 'ready');

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    try {
      const parsedBook = await parseUploadedEpub(file);
      onUploadEpub(parsedBook);
    } catch (err) {
      console.error('EPUB upload error:', err);
      alert('Failed to parse EPUB file. Please ensure it is a valid EPUB document.');
    } finally {
      setIsUploading(false);
      if (e.target) e.target.value = '';
    }
  };

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${mins}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div id="library-view-container" className="w-full pb-16 text-[#EFEFEF]">
      <div className="flex items-center justify-between mb-3">
        <h1 className="text-base font-serif-display italic font-semibold text-white tracking-wide">
          Your Library
        </h1>
        <div className="flex items-center gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept=".epub"
            className="hidden"
            onChange={handleFileChange}
          />
          <button
            id="btn-upload-epub"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#C5A059]/15 hover:bg-[#C5A059]/25 border border-[#C5A059]/40 text-[10px] uppercase tracking-wider text-[#C5A059] font-semibold transition-all disabled:opacity-50"
          >
            <Upload className="w-3 h-3" />
            <span>{isUploading ? 'Parsing...' : 'Upload EPUB'}</span>
          </button>
          <button
            id="btn-open-storage-manager"
            onClick={onOpenOfflineManager}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 text-[10px] uppercase tracking-wider text-[#C5A059] font-medium transition-all"
          >
            <HardDrive className="w-3 h-3" />
            <span>Storage</span>
          </button>
        </div>
      </div>

      <div className="mb-6">
        <ListeningHabitsChart />
      </div>

      {/* Library Sub-Navigation Tabs */}
      <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-white/[0.03] border border-white/10 mb-4 overflow-x-auto scrollbar-none">
        <button
          id="tab-library-saved"
          onClick={() => setTab('saved')}
          className={`flex-1 py-1.5 px-2.5 rounded-xl text-[11px] font-semibold transition-all whitespace-nowrap ${
            tab === 'saved'
              ? 'bg-[#C5A059] text-black shadow-md'
              : 'text-white/60 hover:text-white hover:bg-white/[0.04]'
          }`}
        >
          Saved ({savedBooks.length})
        </button>
        <button
          id="tab-library-offline"
          onClick={() => setTab('offline')}
          className={`flex-1 py-1.5 px-2.5 rounded-xl text-[11px] font-semibold transition-all whitespace-nowrap flex items-center justify-center gap-1 ${
            tab === 'offline'
              ? 'bg-[#C5A059] text-black shadow-md'
              : 'text-white/60 hover:text-white hover:bg-white/[0.04]'
          }`}
        >
          <Download className="w-3 h-3" />
          <span>Offline ({readyOffline.length})</span>
        </button>
        <button
          id="tab-library-history"
          onClick={() => setTab('history')}
          className={`flex-1 py-1.5 px-2.5 rounded-xl text-[11px] font-semibold transition-all whitespace-nowrap ${
            tab === 'history'
              ? 'bg-[#C5A059] text-black shadow-md'
              : 'text-white/60 hover:text-white hover:bg-white/[0.04]'
          }`}
        >
          History ({history.length})
        </button>
        <button
          id="tab-library-bookmarks"
          onClick={() => setTab('bookmarks')}
          className={`flex-1 py-1.5 px-2.5 rounded-xl text-[11px] font-semibold transition-all whitespace-nowrap ${
            tab === 'bookmarks'
              ? 'bg-[#C5A059] text-black shadow-md'
              : 'text-white/60 hover:text-white hover:bg-white/[0.04]'
          }`}
        >
          Notes ({bookmarks.length})
        </button>
      </div>

      {/* TAB 1: Saved Audiobooks */}
      {tab === 'saved' && (
        <div id="library-saved-section" className="space-y-2">
          {savedBooks.length === 0 ? (
            <div className="p-8 rounded-2xl bg-white/[0.02] border border-white/[0.06] text-center flex flex-col items-center">
              <div className="w-10 h-10 rounded-full bg-white/[0.03] border border-white/10 flex items-center justify-center text-[#C5A059] mb-2">
                <Bookmark className="w-4 h-4" />
              </div>
              <p className="text-xs font-serif-display italic font-medium text-white/70">Your saved list is empty</p>
              <p className="text-[10px] text-white/40 mt-1 max-w-[220px] leading-relaxed">
                Bookmark audiobooks from the Explore feed to curate your private bookshelf.
              </p>
            </div>
          ) : (
            savedBooks.map((book) => (
              <div
                key={`saved-${book.id}`}
                id={`saved-item-${book.id}`}
                onClick={() => onSelectBook(book)}
                className="flex items-center gap-3 p-2 rounded-2xl bg-[#111111]/90 border border-white/[0.07] hover:border-[#C5A059]/40 hover:bg-[#161616] transition-all cursor-pointer group"
              >
                <img
                  src={book.coverImageUrl}
                  alt={book.title}
                  className="w-10 h-14 object-cover rounded-xl bg-[#1a1a1a] border border-white/5"
                  referrerPolicy="no-referrer"
                />
                <div className="flex-1 min-w-0">
                  <h4 className="text-xs font-serif-display italic font-medium text-[#EFEFEF] truncate group-hover:text-[#C5A059] transition-colors">
                    {book.title}
                  </h4>
                  <p className="text-[11px] text-[#888888] font-serif-display italic truncate mt-0.5">{book.author}</p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  {onReadBook && (
                    <button
                      id={`btn-read-saved-${book.id}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        onReadBook(book);
                      }}
                      className="w-8 h-8 rounded-xl bg-white/[0.04] hover:bg-[#C5A059]/20 text-white/50 hover:text-[#C5A059] flex items-center justify-center transition-all border border-white/10 hover:border-[#C5A059]/40"
                      title="Read Ebook Text"
                    >
                      <BookOpen className="w-3.5 h-3.5" />
                    </button>
                  )}
                  <button
                    id={`btn-play-saved-${book.id}`}
                    className="w-8 h-8 rounded-xl bg-white/[0.05] group-hover:bg-[#C5A059] text-white/60 group-hover:text-black flex items-center justify-center transition-all shrink-0 border border-white/10 group-hover:border-[#C5A059]"
                    title="Play Audio"
                  >
                    <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* TAB 2: Downloaded Offline */}
      {tab === 'offline' && (
        <div id="library-offline-section" className="space-y-2">
          {readyOffline.length === 0 ? (
            <div className="p-8 rounded-2xl bg-white/[0.02] border border-white/[0.06] text-center flex flex-col items-center">
              <div className="w-10 h-10 rounded-full bg-white/[0.03] border border-white/10 flex items-center justify-center text-[#C5A059] mb-2">
                <Download className="w-4 h-4" />
              </div>
              <p className="text-xs font-serif-display italic font-medium text-white/70">No audiobooks saved offline</p>
              <p className="text-[10px] text-white/40 mt-1 max-w-[220px] leading-relaxed">
                Download audiobooks to listen offline during travel or offline sessions.
              </p>
              <button
                onClick={onOpenOfflineManager}
                className="mt-3 px-3 py-1.5 rounded-xl bg-[#C5A059] text-black text-xs font-semibold"
              >
                Open Download Manager
              </button>
            </div>
          ) : (
            readyOffline.map((item) => (
              <div
                key={`offline-${item.bookId}`}
                id={`offline-item-${item.bookId}`}
                onClick={() => onSelectBook(item.book)}
                className="flex items-center gap-3 p-2 rounded-2xl bg-[#111111]/90 border border-white/[0.07] hover:border-[#C5A059]/40 hover:bg-[#161616] transition-all cursor-pointer group"
              >
                <img
                  src={item.book.coverImageUrl}
                  alt={item.book.title}
                  className="w-10 h-14 object-cover rounded-xl bg-[#1a1a1a] border border-white/5"
                  referrerPolicy="no-referrer"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <h4 className="text-xs font-serif-display italic font-medium text-[#EFEFEF] truncate group-hover:text-[#C5A059] transition-colors">
                      {item.book.title}
                    </h4>
                    <span className="text-[9px] font-mono text-emerald-400 bg-emerald-500/10 px-1.5 py-0.2 rounded border border-emerald-500/20 shrink-0">
                      Offline
                    </span>
                  </div>
                  <p className="text-[11px] text-[#888888] font-serif-display italic truncate mt-0.5">
                    {item.book.author} • {formatBytes(item.sizeBytes)}
                  </p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  {onReadBook && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onReadBook(item.book);
                      }}
                      className="w-8 h-8 rounded-xl bg-white/[0.04] hover:bg-[#C5A059]/20 text-white/50 hover:text-[#C5A059] flex items-center justify-center transition-all border border-white/10"
                      title="Read Ebook Text"
                    >
                      <BookOpen className="w-3.5 h-3.5" />
                    </button>
                  )}
                  <button
                    className="w-8 h-8 rounded-xl bg-[#C5A059] text-black flex items-center justify-center transition-all shadow-md"
                    title="Play Cached Audio"
                  >
                    <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* TAB 3: History */}
      {tab === 'history' && (
        <div id="library-history-section" className="space-y-2">
          <div className="flex items-center justify-between pb-1">
            <span className="text-[11px] uppercase tracking-wider text-white/40">Recently Listened</span>
            {history.length > 0 && (
              <button
                id="btn-clear-history"
                onClick={onClearHistory}
                className="text-[10px] uppercase tracking-wider text-white/40 hover:text-rose-400 flex items-center gap-1 transition-colors"
              >
                <Trash2 className="w-3 h-3" /> Clear History
              </button>
            )}
          </div>

          {history.length === 0 ? (
            <div className="p-8 rounded-2xl bg-white/[0.02] border border-white/[0.06] text-center">
              <p className="text-xs font-serif-display italic text-white/50">No recently played audiobooks yet.</p>
              <p className="text-[10px] text-white/30 mt-0.5">Start listening from Explore to populate your history.</p>
            </div>
          ) : (
            history.map((book) => (
              <div
                key={`history-${book.id}`}
                id={`history-item-${book.id}`}
                onClick={() => onSelectBook(book)}
                className="flex items-center gap-3 p-2 rounded-2xl bg-[#111111]/90 border border-white/[0.07] hover:border-[#C5A059]/40 hover:bg-[#161616] transition-all cursor-pointer group"
              >
                <img
                  src={book.coverImageUrl}
                  alt={book.title}
                  className="w-10 h-14 object-cover rounded-xl bg-[#1a1a1a] border border-white/5"
                  referrerPolicy="no-referrer"
                />
                <div className="flex-1 min-w-0">
                  <h4 className="text-xs font-serif-display italic font-medium text-[#EFEFEF] truncate group-hover:text-[#C5A059] transition-colors">
                    {book.title}
                  </h4>
                  <p className="text-[11px] text-[#888888] font-serif-display italic truncate mt-0.5">{book.author}</p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  {onReadBook && (
                    <button
                      id={`btn-read-history-${book.id}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        onReadBook(book);
                      }}
                      className="w-8 h-8 rounded-xl bg-white/[0.04] hover:bg-[#C5A059]/20 text-white/50 hover:text-[#C5A059] flex items-center justify-center transition-all border border-white/10 hover:border-[#C5A059]/40"
                      title="Read Ebook Text"
                    >
                      <BookOpen className="w-3.5 h-3.5" />
                    </button>
                  )}
                  <button
                    id={`btn-resume-history-${book.id}`}
                    className="w-8 h-8 rounded-xl bg-white/[0.05] group-hover:bg-[#C5A059] text-white/60 group-hover:text-black flex items-center justify-center transition-all border border-white/10 group-hover:border-[#C5A059]"
                    title="Play Audio"
                  >
                    <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* TAB 4: Bookmarks & Timestamp Notes */}
      {tab === 'bookmarks' && (
        <div id="library-bookmarks-section" className="space-y-2">
          {bookmarks.length === 0 ? (
            <div className="p-8 rounded-2xl bg-white/[0.02] border border-white/[0.06] text-center flex flex-col items-center">
              <div className="w-10 h-10 rounded-full bg-white/[0.03] border border-white/10 flex items-center justify-center text-[#C5A059] mb-2">
                <Bookmark className="w-4 h-4" />
              </div>
              <p className="text-xs font-serif-display italic font-medium text-white/70">No audio notes saved yet</p>
              <p className="text-[10px] text-white/40 mt-1 max-w-[220px] leading-relaxed">
                Drop bookmarks while listening to save memorable quotes, timestamps, or reflections.
              </p>
            </div>
          ) : (
            bookmarks.map((bm) => (
              <div
                key={bm.id}
                className="p-3 rounded-2xl bg-[#111111]/90 border border-white/[0.07] hover:border-[#C5A059]/40 transition-all flex items-start justify-between gap-3 group"
              >
                <button
                  onClick={() => onJumpToBookmark(bm)}
                  className="flex-1 text-left flex items-start gap-3 min-w-0"
                >
                  <div className="p-2 rounded-xl bg-[#C5A059]/10 text-[#C5A059] group-hover:bg-[#C5A059] group-hover:text-black transition-colors shrink-0 mt-0.5">
                    <Play className="w-3.5 h-3.5 fill-current" />
                  </div>
                  <div className="min-w-0 space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold text-[#E8E8E8]">{formatTime(bm.timestamp)}</span>
                      <span className="text-[10px] text-[#C5A059] font-serif-display italic truncate">{bm.bookTitle}</span>
                    </div>
                    <p className="text-[10px] text-white/40 truncate">{bm.trackTitle}</p>
                    {bm.note && (
                      <p className="text-xs text-white/80 font-serif-display italic leading-relaxed pt-0.5">
                        "{bm.note}"
                      </p>
                    )}
                  </div>
                </button>

                <button
                  onClick={() => onDeleteBookmark(bm.id)}
                  className="p-1.5 rounded-lg text-white/30 hover:text-red-400 hover:bg-white/5 transition-colors shrink-0"
                  title="Delete Bookmark"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

