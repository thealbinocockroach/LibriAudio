import { Audiobook } from '../types';

export interface BookActivity {
  bookId: string;
  bookTitle: string;
  bookAuthor: string;
  coverImageUrl?: string;
  trueListenedSeconds: number;
  trueReadSeconds: number;
  firstInteractedAt: number;
  lastInteractedAt: number;
  lastListenTimestamp?: number;
  lastReadTimestamp?: number;
  currentTrackIndex?: number;
  currentTrackTitle?: string;
  currentAudioTime?: number;
  lastReadChapterIndex?: number;
  totalChapters?: number;
}

export interface DailyActivityLog {
  date: string; // YYYY-MM-DD
  listenedSeconds: number;
  readSeconds: number;
}

export interface ActivityDatabase {
  books: Record<string, BookActivity>;
  dailyLogs: Record<string, DailyActivityLog>;
}

const STORAGE_KEY = 'libriaudio_true_activity_v1';

function getTodayKey(): string {
  const now = new Date();
  return now.toISOString().split('T')[0];
}

function loadActivityDb(): ActivityDatabase {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        books: parsed.books || {},
        dailyLogs: parsed.dailyLogs || {},
      };
    }
  } catch (e) {
    console.warn('Failed to load activity db:', e);
  }
  return { books: {}, dailyLogs: {} };
}

let memoryDb: ActivityDatabase = loadActivityDb();
let dirty = false;

// Periodic flush to LocalStorage
if (typeof window !== 'undefined') {
  setInterval(() => {
    if (dirty) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(memoryDb));
        dirty = false;
      } catch (e) {
        console.warn('Failed to save activity db:', e);
      }
    }
  }, 2000);

  window.addEventListener('beforeunload', () => {
    if (dirty) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(memoryDb));
        dirty = false;
      } catch (e) {}
    }
  });
}

/**
 * Record true listening time in seconds
 */
export function recordTrueListeningTime(
  book: Audiobook,
  seconds: number,
  trackIndex?: number,
  currentTime?: number
): void {
  if (!book || seconds <= 0) return;
  const now = Date.now();
  const today = getTodayKey();

  if (!memoryDb.books[book.id]) {
    memoryDb.books[book.id] = {
      bookId: book.id,
      bookTitle: book.title,
      bookAuthor: book.author,
      coverImageUrl: book.coverImageUrl,
      trueListenedSeconds: 0,
      trueReadSeconds: 0,
      firstInteractedAt: now,
      lastInteractedAt: now,
      totalChapters: book.tracks?.length || 1,
    };
  }

  const record = memoryDb.books[book.id];
  record.trueListenedSeconds += seconds;
  record.lastInteractedAt = now;
  record.lastListenTimestamp = now;
  if (trackIndex !== undefined) record.currentTrackIndex = trackIndex;
  if (currentTime !== undefined) record.currentAudioTime = currentTime;
  if (book.tracks && trackIndex !== undefined && book.tracks[trackIndex]) {
    record.currentTrackTitle = book.tracks[trackIndex].title;
  }

  // Daily log
  if (!memoryDb.dailyLogs[today]) {
    memoryDb.dailyLogs[today] = { date: today, listenedSeconds: 0, readSeconds: 0 };
  }
  memoryDb.dailyLogs[today].listenedSeconds += seconds;

  dirty = true;
}

/**
 * Record true reading time in seconds
 */
export function recordTrueReadingTime(
  book: Audiobook,
  seconds: number,
  chapterIndex?: number
): void {
  if (!book || seconds <= 0) return;
  const now = Date.now();
  const today = getTodayKey();

  if (!memoryDb.books[book.id]) {
    memoryDb.books[book.id] = {
      bookId: book.id,
      bookTitle: book.title,
      bookAuthor: book.author,
      coverImageUrl: book.coverImageUrl,
      trueListenedSeconds: 0,
      trueReadSeconds: 0,
      firstInteractedAt: now,
      lastInteractedAt: now,
      totalChapters: book.ebookChapters?.length || book.tracks?.length || 1,
    };
  }

  const record = memoryDb.books[book.id];
  record.trueReadSeconds += seconds;
  record.lastInteractedAt = now;
  record.lastReadTimestamp = now;
  if (chapterIndex !== undefined) record.lastReadChapterIndex = chapterIndex;

  // Daily log
  if (!memoryDb.dailyLogs[today]) {
    memoryDb.dailyLogs[today] = { date: today, listenedSeconds: 0, readSeconds: 0 };
  }
  memoryDb.dailyLogs[today].readSeconds += seconds;

  dirty = true;
}

/**
 * Get activity record for a specific book
 */
export function getBookActivity(bookId: string): BookActivity | null {
  return memoryDb.books[bookId] || null;
}

/**
 * Get all books activity list sorted by most recent
 */
export function getAllBookActivities(): BookActivity[] {
  return Object.values(memoryDb.books).sort((a, b) => b.lastInteractedAt - a.lastInteractedAt);
}

/**
 * Get overall summary stats
 */
export function getOverallActivitySummary(): {
  totalListenedSeconds: number;
  totalReadSeconds: number;
  totalCombinedSeconds: number;
  booksStartedCount: number;
  dailyStreak: number;
  dailyLogs: DailyActivityLog[];
} {
  const books = Object.values(memoryDb.books);
  const totalListenedSeconds = books.reduce((acc, b) => acc + (b.trueListenedSeconds || 0), 0);
  const totalReadSeconds = books.reduce((acc, b) => acc + (b.trueReadSeconds || 0), 0);
  const totalCombinedSeconds = totalListenedSeconds + totalReadSeconds;

  // Calculate day streak
  const logs = Object.values(memoryDb.dailyLogs).sort((a, b) => b.date.localeCompare(a.date));
  let streak = 0;
  const today = new Date();
  
  for (let i = 0; i < 365; i++) {
    const d = new Date();
    d.setDate(today.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    const log = memoryDb.dailyLogs[dateStr];
    if (log && (log.listenedSeconds > 0 || log.readSeconds > 0)) {
      streak++;
    } else if (i === 0) {
      // today hasn't happened yet or no activity today yet, check yesterday
      continue;
    } else {
      break;
    }
  }

  return {
    totalListenedSeconds,
    totalReadSeconds,
    totalCombinedSeconds,
    booksStartedCount: books.length,
    dailyStreak: streak,
    dailyLogs: logs.slice(0, 14),
  };
}

/**
 * Format exact true duration (e.g. "1 hr 24 mins 32 secs" or "8 mins 12 secs" or "45 secs")
 */
export function formatTrueDuration(seconds: number): string {
  if (!seconds || seconds <= 0) return '0 seconds';
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  const parts: string[] = [];
  if (hrs > 0) parts.push(`${hrs} hr${hrs > 1 ? 's' : ''}`);
  if (mins > 0) parts.push(`${mins} min${mins > 1 ? 's' : ''}`);
  if (secs > 0 || parts.length === 0) parts.push(`${secs} sec${secs !== 1 ? 's' : ''}`);

  return parts.join(' ');
}

/**
 * Format concise true duration (e.g. "1h 24m", "18m", "45s")
 */
export function formatTrueDurationShort(seconds: number): string {
  if (!seconds || seconds <= 0) return '0s';
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  if (hrs > 0) return `${hrs}h ${mins}m`;
  if (mins > 0) return `${mins}m ${secs > 0 ? `${secs}s` : ''}`;
  return `${secs}s`;
}

/**
 * Clear or reset all true activity tracking
 */
export function clearAllActivityLogs(): void {
  memoryDb = { books: {}, dailyLogs: {} };
  localStorage.removeItem(STORAGE_KEY);
  dirty = false;
}

export interface AuthorRanking {
  author: string;
  totalSeconds: number;
  listenedSeconds: number;
  readSeconds: number;
  booksCount: number;
  books: {
    id: string;
    title: string;
    coverImageUrl?: string;
    seconds: number;
    listenedSeconds: number;
    readSeconds: number;
  }[];
  percentageOfTotal: number;
  rank: number;
}

/**
 * Clean and standardize author names (e.g. "Dostoyevsky, Fyodor" -> "Fyodor Dostoyevsky")
 */
export function normalizeAuthorName(raw: string): string {
  if (!raw) return 'Unknown Author';
  let clean = raw.trim();
  // Remove birth/death years if present like (1828 - 1910)
  clean = clean.replace(/\(\s*\d{3,4}\s*-\s*\d{3,4}\s*\)/g, '').trim();
  clean = clean.replace(/\(\s*\d{3,4}\s*-\s*\)/g, '').trim();

  // If formatted as "Lastname, Firstname"
  if (clean.includes(',') && !clean.toLowerCase().includes('various') && !clean.toLowerCase().includes('librivox')) {
    const parts = clean.split(',').map((p) => p.trim());
    if (parts.length === 2) {
      clean = `${parts[1]} ${parts[0]}`;
    }
  }

  return clean;
}

/**
 * Calculate and rank authors by how long the user has listened / read them
 */
export function getAuthorRankings(historyFallback?: Audiobook[]): AuthorRanking[] {
  const authorMap: Record<
    string,
    {
      author: string;
      listenedSeconds: number;
      readSeconds: number;
      booksMap: Map<string, { id: string; title: string; coverImageUrl?: string; listenedSeconds: number; readSeconds: number }>;
    }
  > = {};

  // 1. Ingest tracked activities
  Object.values(memoryDb.books).forEach((bookActivity) => {
    const normAuthor = normalizeAuthorName(bookActivity.bookAuthor || 'Classic Author');
    if (!authorMap[normAuthor]) {
      authorMap[normAuthor] = {
        author: normAuthor,
        listenedSeconds: 0,
        readSeconds: 0,
        booksMap: new Map(),
      };
    }

    const item = authorMap[normAuthor];
    const listened = bookActivity.trueListenedSeconds || 0;
    const read = bookActivity.trueReadSeconds || 0;

    item.listenedSeconds += listened;
    item.readSeconds += read;

    const existingBook = item.booksMap.get(bookActivity.bookId);
    if (existingBook) {
      existingBook.listenedSeconds += listened;
      existingBook.readSeconds += read;
      if (bookActivity.coverImageUrl) existingBook.coverImageUrl = bookActivity.coverImageUrl;
    } else {
      item.booksMap.set(bookActivity.bookId, {
        id: bookActivity.bookId,
        title: bookActivity.bookTitle,
        coverImageUrl: bookActivity.coverImageUrl,
        listenedSeconds: listened,
        readSeconds: read,
      });
    }
  });

  // 2. If fallback history audiobooks are provided and not in activity db yet, record baseline engagement
  if (historyFallback && historyFallback.length > 0) {
    historyFallback.forEach((hBook, idx) => {
      const normAuthor = normalizeAuthorName(hBook.author);
      if (!authorMap[normAuthor]) {
        authorMap[normAuthor] = {
          author: normAuthor,
          listenedSeconds: 0,
          readSeconds: 0,
          booksMap: new Map(),
        };
      }

      const item = authorMap[normAuthor];
      if (!item.booksMap.has(hBook.id)) {
        // Provide an initial seed duration for history items if user hasn't accumulated raw tick seconds yet
        const seedSecs = Math.max(300, Math.floor((hBook.totalTimeSecs || 1800) * 0.15) / (idx + 1));
        item.listenedSeconds += seedSecs;
        item.booksMap.set(hBook.id, {
          id: hBook.id,
          title: hBook.title,
          coverImageUrl: hBook.coverImageUrl,
          listenedSeconds: seedSecs,
          readSeconds: 0,
        });
      }
    });
  }

  // 3. Convert map to ranked list
  const authorsList = Object.values(authorMap).map((entry) => {
    const totalSeconds = entry.listenedSeconds + entry.readSeconds;
    const books = Array.from(entry.booksMap.values()).map((b) => ({
      id: b.id,
      title: b.title,
      coverImageUrl: b.coverImageUrl,
      seconds: b.listenedSeconds + b.readSeconds,
      listenedSeconds: b.listenedSeconds,
      readSeconds: b.readSeconds,
    })).sort((a, b) => b.seconds - a.seconds);

    return {
      author: entry.author,
      totalSeconds,
      listenedSeconds: entry.listenedSeconds,
      readSeconds: entry.readSeconds,
      booksCount: books.length,
      books,
      percentageOfTotal: 0,
      rank: 1,
    };
  });

  // Filter out zero seconds authors
  const filtered = authorsList.filter((a) => a.totalSeconds > 0);

  // Sort descending by total duration
  filtered.sort((a, b) => b.totalSeconds - a.totalSeconds);

  // Calculate total duration across all authors for percentage calculation
  const totalAllAuthorsSeconds = filtered.reduce((acc, a) => acc + a.totalSeconds, 0);

  return filtered.map((a, idx) => ({
    ...a,
    rank: idx + 1,
    percentageOfTotal: totalAllAuthorsSeconds > 0 ? Math.round((a.totalSeconds / totalAllAuthorsSeconds) * 100) : 0,
  }));
}
