import React, { useState, useEffect } from 'react';
import { Audiobook, Bookmark as BookmarkType, OfflineBookData } from '../types';
import {
  Bookmark,
  Play,
  Trash2,
  BookOpen,
  HardDrive,
  Download,
  WifiOff,
} from 'lucide-react';
import { formatBytes, getBookDownloadSummary } from '../utils/offlineStorage';
import {
  CoverSyncBadge,
  InlineSyncBadge,
  SyncLegendBar,
  getBookSyncStatus,
} from './SyncStatusBadge';

interface LibraryViewProps {
  history: Audiobook[];
  savedBooks: Audiobook[];
  offlineBooks: OfflineBookData[];
  bookmarks: BookmarkType[];
  currentBook?: Audiobook | null;
  isPlaying?: boolean;
  onSelectBook: (book: Audiobook) => void;
  onReadBook?: (book: Audiobook) => void;
  onClearHistory: () => void;
  onDeleteBookmark: (id: string) => void;
  onJumpToBookmark: (bm: BookmarkType) => void;
  onOpenOfflineManager: () => void;
  onUploadEpub?: (book: Audiobook) => void;
}

export const LibraryView: React.FC<LibraryViewProps> = ({
  history,
  savedBooks,
  offlineBooks,
  bookmarks,
  currentBook = null,
  isPlaying = false,
  onSelectBook,
  onReadBook,
  onClearHistory,
  onDeleteBookmark,
  onJumpToBookmark,
  onOpenOfflineManager,
}) => {
  const [tab, setTab] = useState<'saved' | 'offline' | 'history' | 'bookmarks'>('saved');
  const [downloadSummaries, setDownloadSummaries] = useState<
    Record<
      string,
      {
        isFullyDownloaded: boolean;
        isPartiallyDownloaded: boolean;
        downloadedCount: number;
        totalTracks: number;
      }
    >
  >({});

  const readyOffline = offlineBooks.filter((b) => b.status === 'ready');

  // Asynchronously query exact download track breakdown for all books in library
  useEffect(() => {
    let isMounted = true;

    const loadSummaries = async () => {
      const allUniqueBooks = Array.from(
        new Map(
          [...savedBooks, ...history, ...offlineBooks.map((o) => o.book)].map((b) => [b.id, b])
        ).values()
      );

      const summaries: Record<
        string,
        {
          isFullyDownloaded: boolean;
          isPartiallyDownloaded: boolean;
          downloadedCount: number;
          totalTracks: number;
        }
      > = {};

      for (const book of allUniqueBooks) {
        try {
          const summary = await getBookDownloadSummary(book);
          summaries[book.id] = summary;
        } catch {
          // ignore
        }
      }

      if (isMounted) {
        setDownloadSummaries(summaries);
      }
    };

    loadSummaries();

    return () => {
      isMounted = false;
    };
  }, [savedBooks, history, offlineBooks]);

  // Overall sync stats across active library collections
  const allLibraryBooks = Array.from(
    new Map(
      [...savedBooks, ...history, ...offlineBooks.map((o) => o.book)].map((b) => [b.id, b])
    ).values()
  );

  const syncStats = allLibraryBooks.reduce(
    (acc, b) => {
      const info = getBookSyncStatus(
        b,
        offlineBooks,
        currentBook,
        isPlaying,
        downloadSummaries[b.id]
      );
      acc[info.status]++;
      return acc;
    },
    { cached: 0, partial: 0, streaming: 0, cloud: 0 }
  );

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${mins}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div id="library-view-container" className="w-full pb-16 text-[#EFEFEF]">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-xl font-serif-display italic font-bold text-white tracking-wide">
            Your Library
          </h1>
          <p className="text-xs text-white/50 font-serif-display italic mt-0.5">
            Saved audiobooks and offline sync storage
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* Download Manager Launcher */}
          <button
            id="btn-open-storage-manager"
            onClick={onOpenOfflineManager}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/[0.05] hover:bg-[#C5A059]/15 border border-white/10 hover:border-[#C5A059]/40 text-xs text-white/80 hover:text-[#C5A059] font-medium transition-all shadow-sm active:scale-95"
            title="Open Offline Download Manager"
          >
            <HardDrive className="w-3.5 h-3.5 text-[#C5A059]" />
            <span>Download Manager</span>
            {readyOffline.length > 0 && (
              <span className="ml-0.5 px-1.5 py-0.2 rounded-full bg-[#C5A059] text-black text-[10px] font-mono font-bold">
                {readyOffline.length}
              </span>
            )}
          </button>
        </div>
      </div>



      {/* Sync Status Legend Bar */}
      <SyncLegendBar stats={syncStats} />

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
            savedBooks.map((book) => {
              const syncInfo = getBookSyncStatus(
                book,
                offlineBooks,
                currentBook,
                isPlaying,
                downloadSummaries[book.id]
              );

              return (
                <div
                  key={`saved-${book.id}`}
                  id={`saved-item-${book.id}`}
                  onClick={() => onSelectBook(book)}
                  className="flex items-center gap-3 p-2.5 rounded-2xl bg-[#111111]/90 border border-white/[0.07] hover:border-[#C5A059]/40 hover:bg-[#161616] transition-all cursor-pointer group"
                >
                  {/* Book Cover with Visual Sync Status Overlay Badge */}
                  <div className="relative shrink-0 w-12 h-16 sm:w-14 sm:h-20 rounded-xl overflow-hidden bg-[#1a1a1a] border border-white/10 shadow-sm group-hover:border-[#C5A059]/40 transition-colors">
                    <img
                      src={book.coverImageUrl}
                      alt={book.title}
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                    <CoverSyncBadge syncInfo={syncInfo} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <h4 className="text-xs sm:text-sm font-serif-display italic font-medium text-[#EFEFEF] truncate group-hover:text-[#C5A059] transition-colors">
                        {book.title}
                      </h4>
                      <InlineSyncBadge syncInfo={syncInfo} />
                    </div>
                    <p className="text-[11px] text-[#888888] font-serif-display italic truncate">
                      {book.author} • {book.tracks?.length || 1} chapters
                    </p>
                    <p className="text-[10px] text-white/40 font-mono mt-0.5 truncate">
                      {syncInfo.description}
                    </p>
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
                      title={syncInfo.status === 'cached' ? 'Play from Local Cache' : 'Stream Audiobook'}
                    >
                      <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                    </button>
                  </div>
                </div>
              );
            })
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
            readyOffline.map((item) => {
              const syncInfo = getBookSyncStatus(
                item.book,
                offlineBooks,
                currentBook,
                isPlaying,
                downloadSummaries[item.bookId] || {
                  isFullyDownloaded: true,
                  isPartiallyDownloaded: false,
                  downloadedCount: item.book.tracks?.length || 1,
                  totalTracks: item.book.tracks?.length || 1,
                }
              );

              return (
                <div
                  key={`offline-${item.bookId}`}
                  id={`offline-item-${item.bookId}`}
                  onClick={() => onSelectBook(item.book)}
                  className="flex items-center gap-3 p-2.5 rounded-2xl bg-[#111111]/90 border border-white/[0.07] hover:border-[#C5A059]/40 hover:bg-[#161616] transition-all cursor-pointer group"
                >
                  {/* Book Cover with Visual Sync Status Overlay Badge */}
                  <div className="relative shrink-0 w-12 h-16 sm:w-14 sm:h-20 rounded-xl overflow-hidden bg-[#1a1a1a] border border-white/10 shadow-sm group-hover:border-[#C5A059]/40 transition-colors">
                    <img
                      src={item.book.coverImageUrl}
                      alt={item.book.title}
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                    <CoverSyncBadge syncInfo={syncInfo} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <h4 className="text-xs sm:text-sm font-serif-display italic font-medium text-[#EFEFEF] truncate group-hover:text-[#C5A059] transition-colors">
                        {item.book.title}
                      </h4>
                      <InlineSyncBadge syncInfo={syncInfo} />
                    </div>
                    <p className="text-[11px] text-[#888888] font-serif-display italic truncate">
                      {item.book.author} • {formatBytes(item.sizeBytes)}
                    </p>
                    <p className="text-[10px] text-emerald-400/80 font-mono mt-0.5 truncate">
                      100% Offline Ready • {item.book.tracks?.length || 1} tracks stored
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
              );
            })
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
            history.map((book) => {
              const syncInfo = getBookSyncStatus(
                book,
                offlineBooks,
                currentBook,
                isPlaying,
                downloadSummaries[book.id]
              );

              return (
                <div
                  key={`history-${book.id}`}
                  id={`history-item-${book.id}`}
                  onClick={() => onSelectBook(book)}
                  className="flex items-center gap-3 p-2.5 rounded-2xl bg-[#111111]/90 border border-white/[0.07] hover:border-[#C5A059]/40 hover:bg-[#161616] transition-all cursor-pointer group"
                >
                  {/* Book Cover with Visual Sync Status Overlay Badge */}
                  <div className="relative shrink-0 w-12 h-16 sm:w-14 sm:h-20 rounded-xl overflow-hidden bg-[#1a1a1a] border border-white/10 shadow-sm group-hover:border-[#C5A059]/40 transition-colors">
                    <img
                      src={book.coverImageUrl}
                      alt={book.title}
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                    <CoverSyncBadge syncInfo={syncInfo} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <h4 className="text-xs sm:text-sm font-serif-display italic font-medium text-[#EFEFEF] truncate group-hover:text-[#C5A059] transition-colors">
                        {book.title}
                      </h4>
                      <InlineSyncBadge syncInfo={syncInfo} />
                    </div>
                    <p className="text-[11px] text-[#888888] font-serif-display italic truncate">
                      {book.author} • {book.tracks?.length || 1} chapters
                    </p>
                    <p className="text-[10px] text-white/40 font-mono mt-0.5 truncate">
                      {syncInfo.description}
                    </p>
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
              );
            })
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
                        &ldquo;{bm.note}&rdquo;
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


