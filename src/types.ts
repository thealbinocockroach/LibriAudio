export interface AudioTrack {
  id: string;
  title: string;
  audioUrl: string;
  durationSeconds: number;
  trackNumber: number;
}

export interface EbookChapter {
  id: string;
  title: string;
  content: string;
  trackId?: string;
}

export interface Audiobook {
  id: string;
  title: string;
  author: string;
  description: string;
  coverImageUrl: string;
  language: string;
  totalTimeSecs: number;
  reader?: string;
  tracks: AudioTrack[];
  gutenbergId?: number;
  ebookUrl?: string;
  ebookChapters?: EbookChapter[];
}

export interface EbookReaderSettings {
  fontSize: number; // e.g. 14, 16, 18, 20, 24
  fontFamily: 'serif' | 'sans' | 'mono' | 'literary';
  theme: 'obsidian' | 'sepia' | 'paper' | 'midnight';
  lineHeight: number; // 1.6, 1.8, 2.0
}

export interface Bookmark {
  id: string;
  bookId: string;
  bookTitle: string;
  trackIndex: number;
  trackTitle: string;
  timestamp: number;
  note?: string;
  createdAt: number;
}

export type SleepTimerOption = 5 | 10 | 15 | 30 | 45 | 60 | 90 | 'chapter' | null;

export interface SleepTimerState {
  isActive: boolean;
  totalSeconds: number;
  remainingSeconds: number;
  isEndOfChapter: boolean;
  fadeDurationSecs: number;
}

export type VoiceEnhancerPreset = 'off' | 'voice_boost' | 'clarity' | 'bass_warmth' | 'treble_bright' | 'noise_reduce';

export interface OfflineTrack {
  trackId: string;
  blobUrl?: string;
  sizeBytes: number;
}

export interface OfflineBookData {
  bookId: string;
  book: Audiobook;
  sizeBytes: number;
  downloadedAt: number;
  status: 'downloading' | 'ready' | 'error';
  progress: number; // 0 to 100
}

export interface PlayerState {
  currentBook: Audiobook | null;
  currentTrack: AudioTrack | null;
  currentTrackIndex: number;
  isPlaying: boolean;
  isBuffering: boolean;
  currentTime: number;
  duration: number;
  playbackSpeed: number;
  volume: number;
  isMuted: boolean;
  history: Audiobook[];
  savedBooks: Audiobook[];
  bookmarks: Bookmark[];
  sleepTimer: SleepTimerState;
  voiceEnhancer: VoiceEnhancerPreset;
  isOfflineOnly: boolean;
}

export interface FlutterFile {
  path: string;
  name: string;
  category: 'config' | 'core' | 'catalog' | 'player' | 'home' | 'main' | 'screens' | 'reader' | 'services';
  language: 'yaml' | 'gradle' | 'xml' | 'dart' | 'markdown' | 'json';
  description: string;
  content: string;
}

