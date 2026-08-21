import React, { useState, useEffect } from 'react';
import { INITIAL_AUDIOBOOKS } from './data/mockCatalog';
import { Audiobook, PlayerState, Bookmark as BookmarkType, OfflineBookData, VoiceEnhancerPreset, SleepTimerOption } from './types';
import { ExploreView } from './components/ExploreView';
import { SearchView } from './components/SearchView';
import { LibraryView } from './components/LibraryView';
import { MiniPlayerWidget } from './components/MiniPlayerWidget';
import { FullPlayerModal } from './components/FullPlayerModal';
import { EbookReaderModal } from './components/EbookReaderModal';
import { AudioEngine } from './components/AudioEngine';
import { SleepTimerModal } from './components/SleepTimerModal';
import { VoiceEnhancerModal } from './components/VoiceEnhancerModal';
import { BookmarksModal } from './components/BookmarksModal';
import { CarModeModal } from './components/CarModeModal';
import { OfflineManagerModal } from './components/OfflineManagerModal';
import { BookDetailModal } from './components/BookDetailModal';
import { getAllOfflineBooks, isBookOfflineReady } from './utils/offlineStorage';
import { resolveFullTracklist } from './utils/librivoxRecommendations';
import {
  Compass,
  Search,
  Bookmark,
  Moon,
  Headphones,
  HardDrive,
} from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<'explore' | 'search' | 'library'>('explore');
  const [showFullPlayer, setShowFullPlayer] = useState(false);
  const [showEbookReader, setShowEbookReader] = useState(false);
  const [readingBook, setReadingBook] = useState<Audiobook | null>(INITIAL_AUDIOBOOKS[0]);
  const [catalog, setCatalog] = useState<Audiobook[]>(INITIAL_AUDIOBOOKS);
  const [isLoadingFeed, setIsLoadingFeed] = useState(false);

  // Modals for playback & storage features
  const [showSleepTimerModal, setShowSleepTimerModal] = useState(false);
  const [showVoiceEnhancerModal, setShowVoiceEnhancerModal] = useState(false);
  const [showBookmarksModal, setShowBookmarksModal] = useState(false);
  const [showCarModeModal, setShowCarModeModal] = useState(false);
  const [showOfflineManagerModal, setShowOfflineManagerModal] = useState(false);
  const [selectedBookForDetails, setSelectedBookForDetails] = useState<Audiobook | null>(null);
  const [showBookDetailModal, setShowBookDetailModal] = useState(false);

  // Offline items state
  const [offlineBooks, setOfflineBooks] = useState<OfflineBookData[]>([]);
  const [isCurrentBookOffline, setIsCurrentBookOffline] = useState(false);

  // Player State
  const [playerState, setPlayerState] = useState<PlayerState>({
    currentBook: INITIAL_AUDIOBOOKS[0],
    currentTrack: INITIAL_AUDIOBOOKS[0].tracks[0] || null,
    currentTrackIndex: 0,
    isPlaying: false,
    isBuffering: false,
    currentTime: 0,
    duration: INITIAL_AUDIOBOOKS[0].tracks[0]?.durationSeconds || INITIAL_AUDIOBOOKS[0].totalTimeSecs || 1800,
    playbackSpeed: 1.0,
    volume: 1.0,
    isMuted: false,
    history: [INITIAL_AUDIOBOOKS[0]],
    savedBooks: [INITIAL_AUDIOBOOKS[1]],
    bookmarks: [
      {
        id: 'bm_sample_1',
        bookId: INITIAL_AUDIOBOOKS[0].id,
        bookTitle: INITIAL_AUDIOBOOKS[0].title,
        trackIndex: 0,
        trackTitle: INITIAL_AUDIOBOOKS[0].tracks[0]?.title || 'Chapter 1',
        timestamp: 142,
        note: 'Famous opening: "Call me Ishmael."',
        createdAt: Date.now() - 3600000,
      },
    ],
    sleepTimer: {
      isActive: false,
      totalSeconds: 0,
      remainingSeconds: 0,
      isEndOfChapter: false,
      fadeDurationSecs: 20,
    },
    voiceEnhancer: 'off',
    isOfflineOnly: false,
  });

  // Sync offline status
  useEffect(() => {
    const refreshOfflineList = async () => {
      try {
        const list = await getAllOfflineBooks();
        setOfflineBooks(list);
        if (playerState.currentBook) {
          const isReady = await isBookOfflineReady(playerState.currentBook.id);
          setIsCurrentBookOffline(isReady);
        }
      } catch (err) {
        console.error('Failed to load offline list:', err);
      }
    };
    refreshOfflineList();
  }, [playerState.currentBook]);

  // Sleep Timer Tick Effect
  useEffect(() => {
    if (!playerState.sleepTimer.isActive || playerState.sleepTimer.isEndOfChapter) return;

    const interval = setInterval(() => {
      setPlayerState((prev) => {
        if (!prev.sleepTimer.isActive) return prev;
        const nextSeconds = prev.sleepTimer.remainingSeconds - 1;
        if (nextSeconds <= 0) {
          return {
            ...prev,
            isPlaying: false,
            sleepTimer: {
              isActive: false,
              durationMinutes: 0,
              remainingSeconds: 0,
              isEndOfChapter: false,
            },
          };
        }
        return {
          ...prev,
          sleepTimer: {
            ...prev.sleepTimer,
            remainingSeconds: nextSeconds,
          },
        };
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [playerState.sleepTimer.isActive, playerState.sleepTimer.isEndOfChapter]);

  const handleSelectBook = (book: Audiobook, trackIndex = 0) => {
    const selectedTrack = book.tracks[trackIndex] || {
      id: `default_${book.id}`,
      title: `${book.title} - Complete`,
      audioUrl: book.tracks[0]?.audioUrl || '',
      durationSeconds: book.totalTimeSecs || 1800,
      trackNumber: 1,
    };

    setPlayerState((prev) => {
      const alreadyInHistory = prev.history.some((b) => b.id === book.id);
      const newHistory = alreadyInHistory
        ? [book, ...prev.history.filter((b) => b.id !== book.id)]
        : [book, ...prev.history];

      return {
        ...prev,
        currentBook: book,
        currentTrack: selectedTrack,
        currentTrackIndex: trackIndex,
        isPlaying: true,
        currentTime: 0,
        duration: selectedTrack.durationSeconds || book.totalTimeSecs || 1800,
        history: newHistory,
      };
    });

    // If the book was dynamically loaded with only 1 track, asynchronously resolve all chapters in background
    if (book.tracks.length <= 1) {
      resolveFullTracklist(book).then((fullBook) => {
        if (fullBook.tracks.length > 1) {
          setPlayerState((prev) => {
            if (prev.currentBook?.id === book.id) {
              return {
                ...prev,
                currentBook: fullBook,
                currentTrack: fullBook.tracks[trackIndex] || fullBook.tracks[0],
                duration: fullBook.tracks[trackIndex]?.durationSeconds || prev.duration,
              };
            }
            return prev;
          });
        }
      });
    }
  };

  const handleOpenBookDetails = (book: Audiobook) => {
    setSelectedBookForDetails(book);
    setShowBookDetailModal(true);
  };

  const handleOpenEbookReader = (book: Audiobook) => {
    setReadingBook(book);
    setShowEbookReader(true);
  };

  const handleTogglePlayPause = () => {
    setPlayerState((prev) => ({ ...prev, isPlaying: !prev.isPlaying }));
  };

  const handleSeek = (seconds: number) => {
    setPlayerState((prev) => ({ ...prev, currentTime: seconds }));
  };

  const handleRewind15 = () => {
    setPlayerState((prev) => ({
      ...prev,
      currentTime: Math.max(0, prev.currentTime - 15),
    }));
  };

  const handleForward30 = () => {
    setPlayerState((prev) => ({
      ...prev,
      currentTime: Math.min(prev.duration, prev.currentTime + 30),
    }));
  };

  const handleSkipNext = () => {
    if (!playerState.currentBook) return;

    if (playerState.sleepTimer.isActive && playerState.sleepTimer.isEndOfChapter) {
      setPlayerState((prev) => ({
        ...prev,
        isPlaying: false,
        sleepTimer: {
          isActive: false,
          durationMinutes: 0,
          remainingSeconds: 0,
          isEndOfChapter: false,
        },
      }));
      return;
    }

    const tracks = playerState.currentBook.tracks;
    if (playerState.currentTrackIndex < tracks.length - 1) {
      const nextIndex = playerState.currentTrackIndex + 1;
      handleSelectBook(playerState.currentBook, nextIndex);
    }
  };

  const handleSkipPrevious = () => {
    if (!playerState.currentBook) return;
    if (playerState.currentTrackIndex > 0) {
      const prevIndex = playerState.currentTrackIndex - 1;
      handleSelectBook(playerState.currentBook, prevIndex);
    } else {
      handleSeek(0);
    }
  };

  const handleSetSpeed = (speed: number) => {
    setPlayerState((prev) => ({ ...prev, playbackSpeed: speed }));
  };

  const handleSelectTrack = (index: number) => {
    if (playerState.currentBook) {
      handleSelectBook(playerState.currentBook, index);
    }
  };

  const handleToggleSaveBook = (book: Audiobook) => {
    setPlayerState((prev) => {
      const exists = prev.savedBooks.some((b) => b.id === book.id);
      return {
        ...prev,
        savedBooks: exists
          ? prev.savedBooks.filter((b) => b.id !== book.id)
          : [book, ...prev.savedBooks],
      };
    });
  };

  const handleRefreshFeed = () => {
    setIsLoadingFeed(true);
    setTimeout(() => {
      setIsLoadingFeed(false);
    }, 800);
  };

  const handleClearHistory = () => {
    setPlayerState((prev) => ({ ...prev, history: [] }));
  };

  // Sleep Timer handlers
  const handleSetSleepTimer = (option: SleepTimerOption, customMinutes?: number) => {
    if (option === 'chapter') {
      setPlayerState((prev) => ({
        ...prev,
        sleepTimer: {
          isActive: true,
          totalSeconds: 0,
          remainingSeconds: 0,
          isEndOfChapter: true,
          fadeDurationSecs: 20,
        },
      }));
      return;
    }

    const durationMins = typeof option === 'number' ? option : customMinutes || 15;
    const totalSecs = durationMins * 60;

    setPlayerState((prev) => ({
      ...prev,
      sleepTimer: {
        isActive: true,
        totalSeconds: totalSecs,
        remainingSeconds: totalSecs,
        isEndOfChapter: false,
        fadeDurationSecs: 20,
      },
    }));
  };

  const handleCancelSleepTimer = () => {
    setPlayerState((prev) => ({
      ...prev,
      sleepTimer: {
        isActive: false,
        totalSeconds: 0,
        remainingSeconds: 0,
        isEndOfChapter: false,
        fadeDurationSecs: 20,
      },
    }));
  };

  const handleExtendSleepTimer = (minutes: number) => {
    setPlayerState((prev) => ({
      ...prev,
      sleepTimer: {
        ...prev.sleepTimer,
        isActive: true,
        remainingSeconds: prev.sleepTimer.remainingSeconds + minutes * 60,
        isEndOfChapter: false,
      },
    }));
  };

  // Voice Enhancer handler
  const handleSelectVoiceEnhancer = (preset: VoiceEnhancerPreset) => {
    setPlayerState((prev) => ({ ...prev, voiceEnhancer: preset }));
  };

  // Bookmarks handlers
  const handleAddBookmark = (note?: string) => {
    if (!playerState.currentBook) return;
    const newBookmark: BookmarkType = {
      id: `bm_${Date.now()}`,
      bookId: playerState.currentBook.id,
      bookTitle: playerState.currentBook.title,
      trackIndex: playerState.currentTrackIndex,
      trackTitle: playerState.currentTrack?.title || `Track ${playerState.currentTrackIndex + 1}`,
      timestamp: Math.floor(playerState.currentTime),
      note,
      createdAt: Date.now(),
    };

    setPlayerState((prev) => ({
      ...prev,
      bookmarks: [newBookmark, ...prev.bookmarks],
    }));
  };

  const handleDeleteBookmark = (id: string) => {
    setPlayerState((prev) => ({
      ...prev,
      bookmarks: prev.bookmarks.filter((b) => b.id !== id),
    }));
  };

  const handleJumpToBookmark = (bm: BookmarkType) => {
    const targetBook = catalog.find((b) => b.id === bm.bookId) || playerState.currentBook;
    if (targetBook) {
      if (playerState.currentBook?.id !== targetBook.id || playerState.currentTrackIndex !== bm.trackIndex) {
        handleSelectBook(targetBook, bm.trackIndex);
      }
      setTimeout(() => {
        handleSeek(bm.timestamp);
      }, 50);
    }
  };

  const isCurrentBookSaved = playerState.currentBook
    ? playerState.savedBooks.some((b) => b.id === playerState.currentBook!.id)
    : false;

  return (
    <div id="libriaudio-app-root" className="h-screen w-screen bg-[#070707] text-[#E0E0E0] flex flex-col font-sans overflow-hidden antialiased">
      {/* Background Audio Engine */}
      <AudioEngine
        playerState={playerState}
        onTimeUpdate={(currentTime, duration) => {
          setPlayerState((prev) => ({
            ...prev,
            currentTime,
            duration: duration > 0 ? duration : prev.duration,
          }));
        }}
        onEnded={handleSkipNext}
        onBuffering={(isBuffering) => {
          setPlayerState((prev) => ({ ...prev, isBuffering }));
        }}
        onError={() => {
          setPlayerState((prev) => ({ ...prev, isBuffering: false }));
        }}
      />

      {/* Top Universal App Navigation Bar */}
      <header
        id="app-top-header"
        className="h-16 px-4 md:px-8 border-b border-white/[0.08] bg-[#0A0A0A] flex items-center justify-between shrink-0 z-20"
      >
        {/* Brand Logo & Title */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#C5A059] to-[#8C6D2B] flex items-center justify-center text-black shadow-lg shadow-[#C5A059]/20">
            <Headphones className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg font-serif-display italic font-bold text-white tracking-wide">
              LibriAudio
            </h1>
            <p className="text-[11px] text-white/50 hidden md:block">
              Audiobooks & Ebook Reader
            </p>
          </div>
        </div>

        {/* Right Action Tools: Sleep Timer & Offline Downloads */}
        <div className="flex items-center gap-2">
          <button
            id="btn-header-sleep-timer"
            onClick={() => setShowSleepTimerModal(true)}
            className={`p-2 rounded-xl border text-xs font-medium flex items-center gap-1.5 transition-all ${
              playerState.sleepTimer.isActive
                ? 'bg-[#C5A059]/20 border-[#C5A059] text-[#C5A059]'
                : 'bg-white/[0.03] border-white/10 text-white/70 hover:text-white hover:bg-white/[0.08]'
            }`}
            title="Sleep Timer"
          >
            <Moon className="w-4 h-4" />
            {playerState.sleepTimer.isActive && (
              <span className="text-[10px] font-mono font-bold hidden sm:inline">
                {playerState.sleepTimer.isEndOfChapter
                  ? 'Ch End'
                  : `${Math.ceil(playerState.sleepTimer.remainingSeconds / 60)}m`}
              </span>
            )}
          </button>

          <button
            id="btn-header-offline-manager"
            onClick={() => setShowOfflineManagerModal(true)}
            className="p-2 rounded-xl bg-white/[0.03] hover:bg-white/[0.08] border border-white/10 text-white/70 hover:text-white text-xs font-medium flex items-center gap-1.5 transition-all"
            title="Offline Downloads"
          >
            <HardDrive className="w-4 h-4" />
            <span className="hidden sm:inline text-[11px]">Downloads</span>
          </button>
        </div>
      </header>

      {/* Main Content Viewport */}
      <main className="flex-1 relative overflow-hidden bg-[#070707] flex flex-col">
        <div className="flex-1 overflow-y-auto">
          {isLoadingFeed ? (
            <div className="h-full w-full flex flex-col items-center justify-center space-y-3 py-20">
              <div className="w-8 h-8 rounded-full border-2 border-[#C5A059] border-t-transparent animate-spin" />
              <p className="text-xs font-serif-display italic text-[#C5A059]">Restoring archive catalog...</p>
            </div>
          ) : (
            <>
              {activeTab === 'explore' && (
                <div className="max-w-6xl mx-auto w-full p-4 md:p-8">
                  <ExploreView
                    books={catalog}
                    currentBook={playerState.currentBook}
                    history={playerState.history}
                    savedBooks={playerState.savedBooks}
                    onSelectBook={handleOpenBookDetails}
                    onReadBook={handleOpenEbookReader}
                    isLoading={isLoadingFeed}
                    onRefresh={handleRefreshFeed}
                  />
                </div>
              )}
              {activeTab === 'search' && (
                <div className="max-w-5xl mx-auto w-full p-4 md:p-8">
                  <SearchView
                    allBooks={catalog}
                    onSelectBook={handleOpenBookDetails}
                    onReadBook={handleOpenEbookReader}
                  />
                </div>
              )}
              {activeTab === 'library' && (
                <div className="max-w-4xl mx-auto w-full p-4 md:p-8">
                  <LibraryView
                    history={playerState.history}
                    savedBooks={playerState.savedBooks}
                    offlineBooks={offlineBooks}
                    bookmarks={playerState.bookmarks}
                    onSelectBook={handleOpenBookDetails}
                    onReadBook={handleOpenEbookReader}
                    onClearHistory={handleClearHistory}
                    onDeleteBookmark={handleDeleteBookmark}
                    onJumpToBookmark={handleJumpToBookmark}
                    onOpenOfflineManager={() => setShowOfflineManagerModal(true)}
                  />
                </div>
              )}
            </>
          )}
        </div>

        {/* Persistent Bottom Mini Player Widget */}
        <div className="shrink-0 bg-[#0C0C0C] border-t border-white/[0.08] px-4 md:px-8 py-2 z-20">
          <div className="max-w-6xl mx-auto">
            <MiniPlayerWidget
              playerState={playerState}
              onOpenFullPlayer={() => setShowFullPlayer(true)}
              onTogglePlayPause={(e) => {
                e.stopPropagation();
                handleTogglePlayPause();
              }}
              onRewind15={(e) => {
                e.stopPropagation();
                handleRewind15();
              }}
              onOpenEbookReader={(e) => {
                e.stopPropagation();
                handleOpenEbookReader(playerState.currentBook || catalog[0]);
              }}
              onOpenSleepTimer={(e) => {
                e.stopPropagation();
                setShowSleepTimerModal(true);
              }}
            />
          </div>
        </div>

        {/* Sleek Bottom Navigation Bar (Icons Only) */}
        <nav
          id="app-bottom-nav"
          className="shrink-0 h-14 bg-[#090909] border-t border-white/[0.08] flex items-center justify-around px-8 z-20 max-w-md mx-auto w-full sm:max-w-none"
        >
          <button
            id="bottom-tab-explore"
            onClick={() => setActiveTab('explore')}
            className={`flex items-center justify-center w-14 h-10 rounded-2xl transition-all duration-200 ${
              activeTab === 'explore'
                ? 'bg-[#C5A059] text-black shadow-lg shadow-[#C5A059]/20 scale-105'
                : 'text-white/40 hover:text-white hover:bg-white/[0.06]'
            }`}
            title="Explore"
            aria-label="Explore"
          >
            <Compass className="w-5 h-5 stroke-[2.2]" />
          </button>

          <button
            id="bottom-tab-search"
            onClick={() => setActiveTab('search')}
            className={`flex items-center justify-center w-14 h-10 rounded-2xl transition-all duration-200 ${
              activeTab === 'search'
                ? 'bg-[#C5A059] text-black shadow-lg shadow-[#C5A059]/20 scale-105'
                : 'text-white/40 hover:text-white hover:bg-white/[0.06]'
            }`}
            title="Search"
            aria-label="Search"
          >
            <Search className="w-5 h-5 stroke-[2.2]" />
          </button>

          <button
            id="bottom-tab-library"
            onClick={() => setActiveTab('library')}
            className={`flex items-center justify-center w-14 h-10 rounded-2xl transition-all duration-200 ${
              activeTab === 'library'
                ? 'bg-[#C5A059] text-black shadow-lg shadow-[#C5A059]/20 scale-105'
                : 'text-white/40 hover:text-white hover:bg-white/[0.06]'
            }`}
            title="Library"
            aria-label="Library"
          >
            <Bookmark className="w-5 h-5 stroke-[2.2]" />
          </button>
        </nav>
      </main>

      {/* Full Player Modal */}
      {showFullPlayer && (
        <FullPlayerModal
          playerState={playerState}
          onClose={() => setShowFullPlayer(false)}
          onTogglePlayPause={handleTogglePlayPause}
          onSeek={handleSeek}
          onRewind15={handleRewind15}
          onForward30={handleForward30}
          onSkipNext={handleSkipNext}
          onSetSpeed={handleSetSpeed}
          onSelectTrack={handleSelectTrack}
          onToggleSaveBook={handleToggleSaveBook}
          isSaved={isCurrentBookSaved}
          onOpenEbookReader={() => {
            setShowFullPlayer(false);
            handleOpenEbookReader(playerState.currentBook || catalog[0]);
          }}
          onOpenSleepTimer={() => setShowSleepTimerModal(true)}
          onOpenVoiceEnhancer={() => setShowVoiceEnhancerModal(true)}
          onOpenBookmarks={() => setShowBookmarksModal(true)}
          onOpenCarMode={() => setShowCarModeModal(true)}
          onOpenOfflineManager={() => setShowOfflineManagerModal(true)}
          isDownloaded={isCurrentBookOffline}
        />
      )}

      {/* Synchronized Ebook Reader Modal */}
      {showEbookReader && (
        <EbookReaderModal
          isOpen={showEbookReader}
          book={readingBook || playerState.currentBook || catalog[0]}
          playerState={playerState}
          onClose={() => setShowEbookReader(false)}
          onTogglePlayPause={handleTogglePlayPause}
          onSeek={handleSeek}
          onRewind15={handleRewind15}
          onForward30={handleForward30}
          onSelectAudioTrack={handleSelectTrack}
        />
      )}

      {/* Sleep Timer Modal */}
      <SleepTimerModal
        isOpen={showSleepTimerModal}
        onClose={() => setShowSleepTimerModal(false)}
        sleepTimer={playerState.sleepTimer}
        onSetTimer={handleSetSleepTimer}
        onCancelTimer={handleCancelSleepTimer}
        onExtendTimer={handleExtendSleepTimer}
      />

      {/* Voice Clarity / EQ Modal */}
      <VoiceEnhancerModal
        isOpen={showVoiceEnhancerModal}
        onClose={() => setShowVoiceEnhancerModal(false)}
        currentPreset={playerState.voiceEnhancer}
        onSelectPreset={handleSelectVoiceEnhancer}
      />

      {/* Bookmarks Modal */}
      <BookmarksModal
        isOpen={showBookmarksModal}
        onClose={() => setShowBookmarksModal(false)}
        book={playerState.currentBook}
        currentTrack={playerState.currentTrack}
        currentTrackIndex={playerState.currentTrackIndex}
        currentTime={playerState.currentTime}
        bookmarks={playerState.bookmarks}
        onAddBookmark={handleAddBookmark}
        onDeleteBookmark={handleDeleteBookmark}
        onJumpToBookmark={handleJumpToBookmark}
      />

      {/* Driving / Car Mode Modal */}
      <CarModeModal
        isOpen={showCarModeModal}
        onClose={() => setShowCarModeModal(false)}
        playerState={playerState}
        onTogglePlayPause={handleTogglePlayPause}
        onRewind15={handleRewind15}
        onForward30={handleForward30}
        onNextTrack={handleSkipNext}
        onPrevTrack={handleSkipPrevious}
        onAddBookmark={() => handleAddBookmark('Saved during car driving mode')}
        onOpenSleepTimer={() => {
          setShowCarModeModal(false);
          setShowSleepTimerModal(true);
        }}
      />

      {/* Offline Storage Download Manager Modal */}
      <OfflineManagerModal
        isOpen={showOfflineManagerModal}
        onClose={() => {
          setShowOfflineManagerModal(false);
          getAllOfflineBooks().then(setOfflineBooks);
        }}
        catalog={catalog}
        isOfflineOnly={playerState.isOfflineOnly}
        onToggleOfflineOnly={() => setPlayerState((prev) => ({ ...prev, isOfflineOnly: !prev.isOfflineOnly }))}
        onSelectBook={handleOpenBookDetails}
        onReadBook={handleOpenEbookReader}
      />

      {/* Book Details & Information Modal (Shows details first, then Play button next to it) */}
      {showBookDetailModal && selectedBookForDetails && (
        <BookDetailModal
          isOpen={showBookDetailModal}
          book={selectedBookForDetails}
          playerState={playerState}
          onClose={() => setShowBookDetailModal(false)}
          onPlayBook={(book, trackIndex = 0) => {
            handleSelectBook(book, trackIndex);
          }}
          onTogglePlayPause={handleTogglePlayPause}
          onOpenEbookReader={handleOpenEbookReader}
          onToggleSaveBook={handleToggleSaveBook}
          isSaved={
            selectedBookForDetails
              ? playerState.savedBooks.some((b) => b.id === selectedBookForDetails.id)
              : false
          }
        />
      )}
    </div>
  );
}
