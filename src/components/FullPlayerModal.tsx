import React, { useState } from 'react';
import { PlayerState, Audiobook, AudioTrack } from '../types';
import {
  ChevronDown,
  ListMusic,
  Bookmark,
  Play,
  Pause,
  RotateCcw,
  RotateCw,
  SkipForward,
  Volume2,
  VolumeX,
  X,
  Radio,
  Check,
  BookOpen,
  Moon,
  Sliders,
  Car,
  Download,
  CheckCircle2,
} from 'lucide-react';

interface FullPlayerModalProps {
  playerState: PlayerState;
  onClose: () => void;
  onTogglePlayPause: () => void;
  onSeek: (seconds: number) => void;
  onRewind15: () => void;
  onForward30: () => void;
  onSkipNext: () => void;
  onSetSpeed: (speed: number) => void;
  onSelectTrack: (trackIndex: number) => void;
  onToggleSaveBook: (book: Audiobook) => void;
  isSaved: boolean;
  onOpenEbookReader?: () => void;
  onOpenSleepTimer?: () => void;
  onOpenVoiceEnhancer?: () => void;
  onOpenBookmarks?: () => void;
  onOpenCarMode?: () => void;
  onOpenOfflineManager?: () => void;
  isDownloaded?: boolean;
}

export const FullPlayerModal: React.FC<FullPlayerModalProps> = ({
  playerState,
  onClose,
  onTogglePlayPause,
  onSeek,
  onRewind15,
  onForward30,
  onSkipNext,
  onSetSpeed,
  onSelectTrack,
  onToggleSaveBook,
  isSaved,
  onOpenEbookReader,
  onOpenSleepTimer,
  onOpenVoiceEnhancer,
  onOpenBookmarks,
  onOpenCarMode,
  onOpenOfflineManager,
  isDownloaded,
}) => {
  const [showChapters, setShowChapters] = useState(false);

  const { currentBook, currentTrack, currentTrackIndex, isPlaying, isBuffering, currentTime, duration, playbackSpeed, sleepTimer, voiceEnhancer } =
    playerState;

  if (!currentBook) return null;


  const formatTime = (secs: number) => {
    if (isNaN(secs) || secs < 0) return '0:00';
    const hours = Math.floor(secs / 3600);
    const minutes = Math.floor((secs % 3600) / 60);
    const seconds = Math.floor(secs % 60);
    if (hours > 0) {
      return `${hours}:${minutes < 10 ? '0' : ''}${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
    }
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  const currentDuration = duration > 0 ? duration : currentTrack?.durationSeconds || currentBook.totalTimeSecs;
  const remainingTime = Math.max(0, currentDuration - currentTime);

  const speedOptions = [1.0, 1.25, 1.5, 1.75, 2.0];
  const nextSpeed = () => {
    const currentIndex = speedOptions.indexOf(playbackSpeed);
    const nextIdx = (currentIndex + 1) % speedOptions.length;
    onSetSpeed(speedOptions[nextIdx]);
  };

  return (
    <div
      id="full-player-modal-backdrop"
      className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        id="full-player-modal"
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-lg bg-[#0E0E0E] border border-white/10 rounded-3xl p-5 sm:p-7 text-[#EFEFEF] shadow-2xl overflow-hidden flex flex-col justify-between max-h-[94vh]"
      >
        {/* Ambient background glow */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 bg-[#C5A059]/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top Action Bar */}
      <div id="player-top-bar" className="relative flex items-center justify-between z-10">
        <button
          id="btn-dismiss-player"
          onClick={onClose}
          className="p-2 -ml-2 rounded-full text-white/50 hover:text-white hover:bg-white/[0.06] transition-colors"
          title="Minimize player"
        >
          <ChevronDown className="w-5 h-5" />
        </button>

        <div className="flex flex-col items-center">
          <span className="text-[9px] uppercase font-semibold tracking-[0.25em] text-[#C5A059]">Now Playing</span>
          <span className="text-xs font-serif-display italic text-white/70 truncate max-w-[180px]">{currentBook.title}</span>
        </div>

        <div className="flex items-center gap-1">
          {onOpenEbookReader && (
            <button
              id="btn-open-ebook-from-player"
              onClick={onOpenEbookReader}
              className="p-2 rounded-full text-[#C5A059] bg-[#C5A059]/10 hover:bg-[#C5A059]/20 border border-[#C5A059]/30 transition-colors"
              title="Read Ebook Text"
            >
              <BookOpen className="w-4 h-4" />
            </button>
          )}
          {onOpenSleepTimer && (
            <button
              id="btn-open-sleep-timer-top"
              onClick={onOpenSleepTimer}
              className={`p-2 rounded-full transition-colors ${
                sleepTimer.isActive
                  ? 'text-[#C5A059] bg-[#C5A059]/15 border border-[#C5A059]/40'
                  : 'text-white/50 hover:text-white hover:bg-white/[0.06]'
              }`}
              title="Sleep Timer"
            >
              <Moon className="w-4 h-4" />
            </button>
          )}
          <button
            id="btn-save-audiobook"
            onClick={() => onToggleSaveBook(currentBook)}
            className={`p-2 rounded-full transition-colors ${
              isSaved ? 'text-[#C5A059]' : 'text-white/50 hover:text-white hover:bg-white/[0.06]'
            }`}
            title="Save to Library"
          >
            <Bookmark className={`w-4 h-4 ${isSaved ? 'fill-current' : ''}`} />
          </button>
          <button
            id="btn-toggle-chapters"
            onClick={() => setShowChapters(true)}
            className="p-2 -mr-2 rounded-full text-white/50 hover:text-white hover:bg-white/[0.06] transition-colors"
            title="Chapter tracks"
          >
            <ListMusic className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Large Artwork Display */}
      <div id="player-cover-container" className="relative my-auto flex flex-col items-center z-10">
        <div
          className="relative w-52 h-52 sm:w-56 sm:h-56 rounded-2xl overflow-hidden shadow-2xl shadow-black border border-white/10 bg-[#111111]"
        >
          <img
            src={currentBook.coverImageUrl}
            alt={currentBook.title}
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
          {isPlaying && (
            <div className="absolute top-3 right-3 px-2.5 py-1 rounded-full bg-black/70 backdrop-blur-md border border-[#C5A059]/40 flex items-center gap-1.5 text-[9px] text-[#C5A059] font-medium tracking-wider uppercase">
              <Radio className="w-3 h-3 text-[#C5A059] animate-pulse" /> LibriVox Stream
            </div>
          )}
        </div>

        {/* Audiobook & Chapter Meta */}
        <div className="text-center mt-4 px-4 max-w-full">
          <h2 className="text-lg font-serif-display italic font-semibold text-white leading-tight truncate">
            {currentTrack?.title || currentBook.title}
          </h2>
          <p className="text-xs font-serif-display italic text-[#888888] mt-1 truncate">{currentBook.author}</p>
          {currentBook.reader && (
            <p className="text-[10px] uppercase tracking-wider text-[#C5A059]/80 mt-1 truncate">Narrated by {currentBook.reader}</p>
          )}
        </div>
      </div>

      {/* Playback Scrubbing & Controls */}
      <div id="player-controls-container" className="relative space-y-4 z-10 mb-2">
        {/* Timeline Slider */}
        <div className="space-y-1.5">
          <input
            id="slider-player-progress"
            type="range"
            min={0}
            max={currentDuration || 100}
            value={currentTime}
            onChange={(e) => onSeek(Number(e.target.value))}
            className="w-full h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer transition-all accent-[#C5A059] hover:accent-[#d4af65]"
          />
          <div className="flex justify-between text-[10px] tracking-wider font-mono text-[#C5A059]">
            <span>{formatTime(currentTime)}</span>
            <span>-{formatTime(remainingTime)}</span>
          </div>
        </div>

        {/* Control Buttons Row */}
        <div className="flex items-center justify-between px-2">
          {/* Speed Toggle */}
          <button
            id="btn-playback-speed"
            onClick={nextSpeed}
            className="px-2.5 py-1 rounded-lg bg-white/[0.04] border border-white/10 hover:border-[#C5A059]/50 text-[#C5A059] text-[10px] uppercase tracking-widest font-semibold transition-all"
            title="Change Playback Speed"
          >
            {playbackSpeed}x
          </button>

          {/* Rewind 15s */}
          <button
            id="btn-player-rewind-15"
            onClick={onRewind15}
            className="p-2.5 rounded-full bg-white/[0.04] hover:bg-white/[0.08] text-white/70 hover:text-white border border-white/5 transition-all active:scale-95"
            title="Rewind 15 Seconds"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          {/* Big Play / Pause */}
          <button
            id="btn-player-main-play"
            onClick={onTogglePlayPause}
            className="w-16 h-16 rounded-full bg-[#C5A059] hover:bg-[#d4af65] text-black flex items-center justify-center shadow-[0_0_30px_rgba(197,160,89,0.35)] transition-all transform active:scale-95"
          >
            {isBuffering ? (
              <div className="w-6 h-6 border-3 border-black border-t-transparent rounded-full animate-spin" />
            ) : isPlaying ? (
              <Pause className="w-6 h-6 fill-current" />
            ) : (
              <Play className="w-6 h-6 fill-current ml-1" />
            )}
          </button>

          {/* Forward 30s */}
          <button
            id="btn-player-forward-30"
            onClick={onForward30}
            className="p-2.5 rounded-full bg-white/[0.04] hover:bg-white/[0.08] text-white/70 hover:text-white border border-white/5 transition-all active:scale-95"
            title="Fast Forward 30 Seconds"
          >
            <RotateCw className="w-4 h-4" />
          </button>

          {/* Next Chapter */}
          <button
            id="btn-player-skip-next"
            onClick={onSkipNext}
            className="p-2.5 rounded-full bg-white/[0.04] hover:bg-white/[0.08] text-white/70 hover:text-white border border-white/5 transition-all active:scale-95"
            title="Next Track"
          >
            <SkipForward className="w-4 h-4" />
          </button>
        </div>

        {/* Audio Enhancement & Convenience Toolbar */}
        <div className="pt-2 flex items-center justify-between gap-1.5 border-t border-white/10 px-1">
          {/* Voice Enhancer / EQ Preset */}
          {onOpenVoiceEnhancer && (
            <button
              id="btn-player-voice-enhancer"
              onClick={onOpenVoiceEnhancer}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl border text-[10px] font-semibold transition-all ${
                voiceEnhancer !== 'off'
                  ? 'bg-[#C5A059]/20 border-[#C5A059] text-[#C5A059]'
                  : 'bg-white/[0.03] border-white/10 text-white/60 hover:text-white hover:bg-white/[0.08]'
              }`}
              title="Voice Clarity & Equalizer"
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>{voiceEnhancer === 'voice_boost' ? 'Voice +' : voiceEnhancer === 'noise_reduce' ? 'De-Hiss' : 'EQ'}</span>
            </button>
          )}

          {/* Sleep Timer Indicator / Trigger */}
          {onOpenSleepTimer && (
            <button
              id="btn-player-sleep-timer-bottom"
              onClick={onOpenSleepTimer}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl border text-[10px] font-semibold transition-all ${
                sleepTimer.isActive
                  ? 'bg-[#C5A059]/20 border-[#C5A059] text-[#C5A059]'
                  : 'bg-white/[0.03] border-white/10 text-white/60 hover:text-white hover:bg-white/[0.08]'
              }`}
              title="Sleep Timer"
            >
              <Moon className="w-3.5 h-3.5" />
              <span>
                {sleepTimer.isActive
                  ? sleepTimer.isEndOfChapter
                    ? 'Ch End'
                    : `${Math.ceil(sleepTimer.remainingSeconds / 60)}m`
                  : 'Sleep'}
              </span>
            </button>
          )}

          {/* Offline Download Trigger */}
          {onOpenOfflineManager && (
            <button
              id="btn-player-offline-download"
              onClick={onOpenOfflineManager}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl border text-[10px] font-semibold transition-all ${
                isDownloaded
                  ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400'
                  : 'bg-white/[0.03] border-white/10 text-white/60 hover:text-white hover:bg-white/[0.08]'
              }`}
              title="Offline Downloads"
            >
              {isDownloaded ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Saved</span>
                </>
              ) : (
                <>
                  <Download className="w-3.5 h-3.5" />
                  <span>Offline</span>
                </>
              )}
            </button>
          )}

          {/* Car Mode */}
          {onOpenCarMode && (
            <button
              id="btn-player-car-mode"
              onClick={onOpenCarMode}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-white/[0.03] hover:bg-white/[0.08] border border-white/10 text-white/60 hover:text-white text-[10px] font-semibold transition-all"
              title="Car Driving Mode"
            >
              <Car className="w-3.5 h-3.5" />
              <span>Car</span>
            </button>
          )}
        </div>

        {/* Read Book Ebook Button Banner */}
        {onOpenEbookReader && (
          <div className="pt-1 flex justify-center">
            <button
              id="btn-read-ebook-banner"
              onClick={onOpenEbookReader}
              className="w-full flex items-center justify-center gap-2 py-2 rounded-2xl bg-white/[0.04] hover:bg-[#C5A059]/15 text-white/80 hover:text-[#C5A059] border border-white/10 hover:border-[#C5A059]/40 text-xs font-serif-display italic transition-all active:scale-98"
            >
              <BookOpen className="w-3.5 h-3.5 text-[#C5A059]" />
              <span>Read Gutenberg Ebook Text & Sync Audio</span>
            </button>
          </div>
        )}
      </div>

      {/* Chapters Modal Drawer */}
      {showChapters && (
        <div
          id="chapters-drawer"
          className="absolute inset-0 bg-[#050505]/98 backdrop-blur-2xl z-50 flex flex-col p-4 animate-in fade-in zoom-in-95 duration-200"
        >
          <div className="flex items-center justify-between pb-3 border-b border-white/10">
            <div className="flex items-center gap-2">
               <ListMusic className="w-4 h-4 text-[#C5A059]" />
               <h3 className="font-serif-display italic font-semibold text-sm text-white">Chapters & Sections</h3>
            </div>
            <button
              id="btn-close-chapters"
              onClick={() => setShowChapters(false)}
              className="p-1.5 rounded-full text-white/40 hover:text-white hover:bg-white/5"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto py-2 space-y-1.5 scrollbar-thin scrollbar-thumb-white/10">
            {currentBook.tracks.map((track, idx) => {
              const isCurrent = idx === currentTrackIndex;
              return (
                <div
                  key={track.id}
                  id={`chapter-item-${idx}`}
                  onClick={() => {
                    onSelectTrack(idx);
                    setShowChapters(false);
                  }}
                  className={`flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all ${
                    isCurrent
                      ? 'bg-[#C5A059]/15 border border-[#C5A059]/40 text-[#C5A059]'
                      : 'hover:bg-white/[0.04] text-white/70 border border-transparent hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-xs font-mono opacity-50 w-5">{idx + 1}.</span>
                    <span className="text-xs font-serif-display italic truncate">{track.title}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs opacity-75 shrink-0">
                    <span className="font-mono text-[10px]">{formatTime(track.durationSeconds)}</span>
                    {isCurrent && <Check className="w-3.5 h-3.5 text-[#C5A059]" />}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      </div>
    </div>
  );
};
