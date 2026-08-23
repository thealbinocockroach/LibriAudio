import React, { useMemo } from 'react';
import { Audiobook } from '../types';
import { DailyGoalRing } from './DailyGoalRing';
import { ListeningHabitsChart } from './ListeningHabitsChart';
import { AuthorRankingsWidget } from './AuthorRankingsWidget';
import {
  BarChart3,
  Flame,
  Headphones,
  BookOpen,
  Calendar as CalendarIcon,
  Activity,
  Clock,
  Sparkles,
} from 'lucide-react';
import {
  getOverallActivitySummary,
  formatTrueDuration,
  getReadingSessions,
} from '../utils/activityTracker';

interface StatsViewProps {
  history: Audiobook[];
  onSelectBook?: (book: Audiobook) => void;
  onPlayBook?: (book: Audiobook) => void;
}

export const StatsView: React.FC<StatsViewProps> = ({
  history,
  onSelectBook,
  onPlayBook,
}) => {
  const summary = getOverallActivitySummary();
  const sessions = useMemo(() => getReadingSessions(), []);

  // Simple grouping by date
  const sessionsByDate = useMemo(() => {
    const map: Record<string, typeof sessions> = {};
    sessions.forEach(s => {
      const date = new Date(s.endTimestamp).toISOString().split('T')[0];
      if (!map[date]) map[date] = [];
      map[date].push(s);
    });
    return map;
  }, [sessions]);

  return (
    <div id="stats-view-page" className="space-y-6 max-w-4xl mx-auto pb-12">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-white/[0.08]">
        <div>
          <h1 className="text-xl sm:text-2xl font-serif-display italic font-bold text-white tracking-wide flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-[#C5A059]" />
            Listening & Reading Analytics
          </h1>
          <p className="text-xs text-white/50 font-serif-display italic mt-0.5">
            Real-time reading habits, daily milestones, and yearly ratios
          </p>
        </div>

        {summary.dailyStreak > 0 && (
          <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#C5A059]/15 border border-[#C5A059]/30 text-[#C5A059] text-xs font-mono font-bold self-start sm:self-auto">
            <Flame className="w-4 h-4 text-amber-400 fill-current" />
            <span>{summary.dailyStreak} Day Streak Active</span>
          </div>
        )}
      </div>

      {/* Calendar Reading View */}
      <section id="stats-calendar-section" className="p-4 rounded-2xl bg-[#111111] border border-white/[0.08]">
        <h3 className="text-xs font-semibold uppercase text-white/50 mb-3 flex items-center gap-2">
          <CalendarIcon className="w-4 h-4 text-[#C5A059]" /> Recent Reading Calendar
        </h3>
        <div className="grid grid-cols-7 gap-1">
          {Object.entries(sessionsByDate).slice(-14).map(([date, daySessions]) => (
            <div key={date} className="aspect-square rounded-lg bg-white/[0.03] border border-white/5 flex flex-col items-center justify-center p-1">
              <span className="text-[9px] text-white/40 font-mono">{date.split('-')[2]}</span>
              <span className="text-[10px] font-bold text-[#C5A059]">{daySessions.length}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Top Quick Key Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 rounded-2xl bg-[#111111] border border-white/[0.08] flex flex-col justify-between">
          <div className="flex items-center justify-between text-white/50 text-[10px] uppercase font-semibold">
            <span>Audiobook Time</span>
            <Headphones className="w-4 h-4 text-[#C5A059]" />
          </div>
          <div className="mt-2">
            <div className="text-base sm:text-lg font-bold font-mono text-white truncate">
              {formatTrueDuration(summary.totalListenedSeconds)}
            </div>
            <p className="text-[10px] text-white/40 mt-0.5">Audio listened</p>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-[#111111] border border-white/[0.08] flex flex-col justify-between">
          <div className="flex items-center justify-between text-white/50 text-[10px] uppercase font-semibold">
            <span>Ebook Time</span>
            <BookOpen className="w-4 h-4 text-blue-400" />
          </div>
          <div className="mt-2">
            <div className="text-base sm:text-lg font-bold font-mono text-white truncate">
              {formatTrueDuration(summary.totalReadSeconds)}
            </div>
            <p className="text-[10px] text-white/40 mt-0.5">Text read</p>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-[#111111] border border-white/[0.08] flex flex-col justify-between">
          <div className="flex items-center justify-between text-white/50 text-[10px] uppercase font-semibold">
            <span>Total Immersion</span>
            <Sparkles className="w-4 h-4 text-[#C5A059]" />
          </div>
          <div className="mt-2">
            <div className="text-base sm:text-lg font-bold font-mono text-[#C5A059] truncate">
              {formatTrueDuration(summary.totalCombinedSeconds)}
            </div>
            <p className="text-[10px] text-white/40 mt-0.5">Combined time</p>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-[#111111] border border-white/[0.08] flex flex-col justify-between">
          <div className="flex items-center justify-between text-white/50 text-[10px] uppercase font-semibold">
            <span>Books Engaged</span>
            <Activity className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="mt-2">
            <div className="text-base sm:text-lg font-bold font-mono text-white">
              {summary.booksStartedCount} Titles
            </div>
            <p className="text-[10px] text-white/40 mt-0.5">In personal library</p>
          </div>
        </div>
      </div>

      {/* Author Leaderboard Ranking - Prominently Displayed */}
      <section id="stats-author-rankings-section">
        <AuthorRankingsWidget
          history={history}
          onSelectBook={onSelectBook}
          onPlayBook={onPlayBook}
        />
      </section>

      {/* Daily Listening Goal Ring */}
      <section id="stats-daily-goal-section">
        <DailyGoalRing />
      </section>

      {/* 7-Day Activity Chart */}
      <section id="stats-habits-chart-section">
        <ListeningHabitsChart />
      </section>
    </div>
  );
};
