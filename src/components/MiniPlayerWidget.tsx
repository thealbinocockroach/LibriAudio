import React from 'react';
import { PlayerState } from '../types';
import { Play, Pause, RotateCcw, BookOpen, Moon, Sliders } from 'lucide-react';

interface MiniPlayerWidgetProps {
  playerState: PlayerState;
  onOpenFullPlayer: () => void;
  onTogglePlayPause: (e: React.MouseEvent) => void;
  onRewind15: (e: React.MouseEvent) => void;
  onOpenEbookReader?: (e: React.MouseEvent) => void;
  onOpenSleepTimer?: (e: React.MouseEvent) => void;
}

export const MiniPlayerWidget: React.FC<MiniPlayerWidgetProps> = ({
  playerState,
  onOpenFullPlayer,
  onTogglePlayPause,
  onRewind15,
  onOpenEbookReader,
  onOpenSleepTimer,
}) => {
  const { currentBook, currentTrack, isPlaying, isBuffering, currentTime, duration, sleepTimer, voiceEnhancer } = playerState;

  if (!currentBook) return null;

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div
      id="mini-player-container"
      onClick={onOpenFullPlayer}
      className="relative w-full bg-[#121212]/95 backdrop-blur-xl rounded-2xl border border-white/10 shadow-2xl shadow-black overflow-hidden cursor-pointer hover:border-[#C5A059]/40 transition-all duration-300 group"
    >
      <div className="flex items-center gap-3 p-3">
        {/* Cover thumbnail */}
        <div className="relative w-12 h-12 rounded-xl overflow-hidden shrink-0 bg-[#1a1a1a] border border-white/10 shadow-md">
          <img
            src={currentBook.coverImageUrl}
            alt={currentBook.title}
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
          {isPlaying && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <span className="flex h-2.5 w-2.5 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#C5A059] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#C5A059]"></span>
              </span>
            </div>
          )}
        </div>

        {/* Title and Author */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h4 className="text-xs sm:text-sm font-serif-display italic font-semibold text-[#EFEFEF] truncate leading-tight group-hover:text-[#C5A059] transition-colors">
              {currentTrack?.title || currentBook.title}
            </h4>
            {voiceEnhancer !== 'off' && (
              <span className="text-[8px] uppercase font-bold px-1.5 py-0.5 rounded bg-[#C5A059]/20 text-[#C5A059] shrink-0 border border-[#C5A059]/30">
                EQ
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            <p className="text-[11px] sm:text-xs text-[#888888] font-serif-display italic truncate">{currentBook.author}</p>
            {sleepTimer.isActive && (
              <span className="text-[9px] font-mono font-semibold px-2 py-0.5 rounded-full bg-[#C5A059]/20 text-[#C5A059] flex items-center gap-1 shrink-0 border border-[#C5A059]/30">
                <Moon className="w-2.5 h-2.5 fill-current" />
                {sleepTimer.isEndOfChapter ? 'Ch End' : `${Math.ceil(sleepTimer.remainingSeconds / 60)}m`}
              </span>
            )}
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1 sm:gap-2">
          {/* Quick Read Ebook Button */}
          {onOpenEbookReader && (
            <button
              id="btn-mini-read-ebook"
              onClick={onOpenEbookReader}
              className="p-2 text-[#C5A059] hover:bg-[#C5A059]/15 rounded-xl border border-[#C5A059]/30 transition-colors"
              title="Read Ebook Text"
            >
              <BookOpen className="w-4 h-4" />
            </button>
          )}

          {/* Quick Rewind 15s */}
          <button
            id="btn-mini-rewind-15"
            onClick={onRewind15}
            className="p-2 text-white/50 hover:text-white rounded-xl hover:bg-white/[0.08] transition-colors"
            title="Rewind 15s"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          {/* Play/Pause Button */}
          <button
            id="btn-mini-toggle-play"
            onClick={onTogglePlayPause}
            className="w-10 h-10 rounded-full bg-[#C5A059] hover:bg-[#d4af65] text-black flex items-center justify-center shadow-[0_0_15px_rgba(197,160,89,0.3)] transition-transform active:scale-95 shrink-0"
          >
            {isBuffering ? (
              <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
            ) : isPlaying ? (
              <Pause className="w-4 h-4 fill-current" />
            ) : (
              <Play className="w-4 h-4 fill-current ml-0.5" />
            )}
          </button>
        </div>
      </div>

      {/* Thin Bottom Progress Line */}
      <div className="w-full bg-white/10 h-[3px]">
        <div
          className="bg-[#C5A059] h-full transition-all duration-300 ease-linear shadow-[0_0_8px_rgba(197,160,89,0.5)]"
          style={{ width: `${Math.min(100, Math.max(0, progressPercent))}%` }}
        />
      </div>
    </div>
  );
};


