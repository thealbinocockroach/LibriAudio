import React, { useState, useEffect, useRef } from 'react';
import { Audiobook } from '../types';
import {
  Sparkles,
  Play,
  Clock,
  BookOpen,
  RefreshCw,
  Search,
  Flame,
  Shuffle,
  ChevronRight,
  ChevronLeft,
  Radio,
  User,
} from 'lucide-react';
import {
  LIBRIVOX_GENRES,
  GenreCategory,
  RecommendationSection,
  fetchLibriVoxCategory,
  fetchDynamicPersonalizedRecommendations,
  resolveFullTracklist,
} from '../utils/librivoxRecommendations';

interface ExploreViewProps {
  books: Audiobook[];
  currentBook: Audiobook | null;
  history: Audiobook[];
  savedBooks: Audiobook[];
  onSelectBook: (book: Audiobook) => void;
  isLoading: boolean;
  onRefresh: () => void;
  onReadBook?: (book: Audiobook) => void;
}

export const ExploreView: React.FC<ExploreViewProps> = ({
  books,
  currentBook,
  history,
  savedBooks,
  onSelectBook,
  isLoading,
  onRefresh,
  onReadBook,
}) => {
  const [selectedGenre, setSelectedGenre] = useState<GenreCategory>(LIBRIVOX_GENRES[0]);
  const [genreBooks, setGenreBooks] = useState<Audiobook[]>([]);
  const [isLoadingGenre, setIsLoadingGenre] = useState(false);
  const [dynamicSections, setDynamicSections] = useState<RecommendationSection[]>([]);
  const [isLoadingSections, setIsLoadingSections] = useState(false);
  const [surpriseBook, setSurpriseBook] = useState<Audiobook | null>(null);
  const [isRollingSurprise, setIsRollingSurprise] = useState(false);
  const [profileName, setProfileName] = useState<string>('');

  useEffect(() => {
    const savedName = localStorage.getItem('libriaudio_profile_name');
    if (savedName) setProfileName(savedName);
  }, []);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  // Featured book (either dynamic top pick or first in books)
  const featuredBook = surpriseBook || (genreBooks.length > 0 ? genreBooks[0] : books[0]);

  // Load dynamic personalized shelves on mount or when listening history changes
  useEffect(() => {
    let isMounted = true;
    const loadDynamicShelves = async () => {
      setIsLoadingSections(true);
      try {
        const sections = await fetchDynamicPersonalizedRecommendations(currentBook, history, savedBooks);
        if (isMounted) {
          setDynamicSections(sections);
        }
      } catch (err) {
        console.warn('Failed to load dynamic sections:', err);
      } finally {
        if (isMounted) setIsLoadingSections(false);
      }
    };

    loadDynamicShelves();
    return () => {
      isMounted = false;
    };
  }, [currentBook?.id, history.length, savedBooks.length]);

  // Load genre recommendations whenever selected genre changes
  useEffect(() => {
    let isMounted = true;

    if (selectedGenre.id === 'all') {
      setGenreBooks(books);
      return;
    }

    const loadGenreBooks = async () => {
      setIsLoadingGenre(true);
      try {
        const fetched = await fetchLibriVoxCategory(selectedGenre.query, 10);
        if (isMounted && fetched.length > 0) {
          setGenreBooks(fetched);
        }
      } catch (err) {
        console.warn(`Genre fetch error for ${selectedGenre.label}:`, err);
        if (isMounted) setGenreBooks(books);
      } finally {
        if (isMounted) setIsLoadingGenre(false);
      }
    };

    loadGenreBooks();
    return () => {
      isMounted = false;
    };
  }, [selectedGenre.id, books]);

  // Surprise Me: Dynamically discover a gem from LibriVox archives
  const handleSurpriseMe = async () => {
    setIsRollingSurprise(true);
    const surpriseQueries = [
      'dumas OR "count of monte cristo"',
      'verne OR "twenty thousand leagues"',
      'wilde OR "dorian gray"',
      'poe OR "raven"',
      'shelley OR "frankenstein"',
      'wells OR "war of the worlds"',
      'stoker OR "dracula"',
      'austen OR "pride and prejudice"',
      'tolstoy OR "war and peace"',
      'kafka OR "metamorphosis"',
      'melville OR "moby dick"',
      'kipling OR "jungle book"',
    ];
    const randomQuery = surpriseQueries[Math.floor(Math.random() * surpriseQueries.length)];

    try {
      const results = await fetchLibriVoxCategory(randomQuery, 4);
      if (results && results.length > 0) {
        const picked = results[Math.floor(Math.random() * results.length)];
        // Resolve full tracklist
        const resolved = await resolveFullTracklist(picked);
        setSurpriseBook(resolved);
      }
    } catch (e) {
      console.warn('Surprise pick error:', e);
    } finally {
      setIsRollingSurprise(false);
    }
  };

  const handleBookClick = async (book: Audiobook) => {
    const fullyResolved = await resolveFullTracklist(book);
    onSelectBook(fullyResolved);
  };

  return (
    <div id="explore-view-container" className="w-full pb-20 text-[#EFEFEF]">
      {/* Header Bar */}
      <div id="explore-header" className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-serif-display italic font-bold text-white tracking-wide leading-tight">
              {profileName ? `${getGreeting()}, ${profileName}` : 'LibriAudio Discover'}
            </h1>
            {!profileName && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] uppercase font-bold tracking-widest bg-[#C5A059]/15 text-[#C5A059] border border-[#C5A059]/30">
                <Radio className="w-2.5 h-2.5 animate-pulse text-[#C5A059]" /> LibriVox Live
              </span>
            )}
          </div>
          <p className="text-xs text-white/50 font-serif-display italic mt-0.5">
            {profileName ? 'Dynamic recommendations curated from the LibriVox and Internet Archive catalog' : 'Personalize your experience in Settings'}
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {/* Surprise Me Button */}
          <button
            id="btn-surprise-gem"
            onClick={handleSurpriseMe}
            disabled={isRollingSurprise}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/[0.05] hover:bg-[#C5A059]/15 text-white/80 hover:text-[#C5A059] border border-white/10 hover:border-[#C5A059]/40 text-xs font-semibold transition-all active:scale-95 disabled:opacity-50"
            title="Discover a random masterpiece"
          >
            <Shuffle className={`w-3.5 h-3.5 ${isRollingSurprise ? 'animate-spin text-[#C5A059]' : ''}`} />
            <span>{isRollingSurprise ? 'Discovering...' : 'Surprise Gem'}</span>
          </button>

          {/* Refresh Feed */}
          <button
            id="btn-refresh-catalog"
            onClick={onRefresh}
            className="p-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-white/60 hover:text-[#C5A059] transition-all border border-white/10"
            title="Refresh Recommendations"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-[#C5A059]' : ''}`} />
          </button>
        </div>
      </div>

      {/* Interactive Genre & Mood Carousel Filter */}
      <div id="explore-genre-carousel" className="mb-6 overflow-x-auto pb-2 scrollbar-none flex items-center gap-2">
        {LIBRIVOX_GENRES.map((genre) => {
          const isActive = selectedGenre.id === genre.id;
          return (
            <button
              key={genre.id}
              id={`genre-pill-${genre.id}`}
              onClick={() => {
                setSelectedGenre(genre);
                setSurpriseBook(null);
              }}
              className={`px-4 py-1.5 rounded-full text-xs font-sans transition-all flex items-center shrink-0 ${
                isActive
                  ? 'bg-white text-black font-semibold'
                  : 'bg-white/5 text-white/70 hover:text-white hover:bg-white/10'
              }`}
            >
              {genre.label}
            </button>
          );
        })}
      </div>

      {/* Continue Listening Hero */}
      {history.length > 0 && (
        <div className="mb-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <h3 className="text-sm font-semibold text-white/70 uppercase tracking-wider mb-3 px-1 flex items-center gap-2">
            Jump Back In
          </h3>
          <div 
            onClick={() => handleBookClick(history[0])}
            className="flex items-center gap-4 p-3 sm:p-4 rounded-xl bg-[#111111] hover:bg-[#1a1a1a] border border-white/5 transition-all cursor-pointer group"
          >
            <div className="w-16 h-16 shrink-0 rounded-lg overflow-hidden bg-[#1a1a1a]">
              <img 
                src={history[0].coverImageUrl} 
                alt={history[0].title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                referrerPolicy="no-referrer"
              />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-base font-serif-display italic font-semibold text-white group-hover:text-[#C5A059] transition-colors truncate">
                {history[0].title}
              </h4>
              <p className="text-xs text-white/50 truncate mt-0.5">
                {history[0].author}
              </p>
            </div>
            <button className="flex items-center justify-center w-10 h-10 rounded-full bg-[#C5A059] text-black hover:bg-[#d4af65] transition-colors shadow-sm shrink-0 mr-2">
              <Play className="w-4 h-4 fill-current ml-0.5" />
            </button>
          </div>
        </div>
      )}

      {/* Featured Pick Hero Banner */}
      {featuredBook && (
        <div
          id={`featured-card-${featuredBook.id}`}
          onClick={() => handleBookClick(featuredBook)}
          className="relative overflow-hidden rounded-2xl bg-[#111] border border-white/5 p-4 sm:p-5 mb-8 cursor-pointer group hover:bg-[#151515] hover:border-white/10 transition-all duration-300"
        >
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6 relative z-10">
            {/* Book Cover */}
            <div className="relative w-24 sm:w-32 aspect-[3/4] shrink-0 rounded-xl overflow-hidden shadow-lg border border-white/5 bg-[#181818]">
              <img
                src={featuredBook.coverImageUrl}
                alt={featuredBook.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                referrerPolicy="no-referrer"
              />
            </div>

            {/* Book Details */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <span className="text-[10px] font-bold text-[#C5A059] uppercase tracking-wider">
                  {surpriseBook ? 'Surprise Discovery' : selectedGenre.id !== 'all' ? selectedGenre.label : 'Featured Classic'}
                </span>
                {featuredBook.reader && (
                  <span className="text-[11px] text-white/40 flex items-center gap-1 truncate">
                    • {featuredBook.reader}
                  </span>
                )}
              </div>

              <h2 className="text-lg sm:text-2xl font-serif-display italic font-bold text-white group-hover:text-[#C5A059] transition-colors leading-tight">
                {featuredBook.title}
              </h2>
              <p className="text-xs sm:text-sm text-white/50 font-sans mt-0.5">
                {featuredBook.author}
              </p>

              <p className="text-xs text-white/60 line-clamp-2 sm:line-clamp-3 mt-3 leading-relaxed max-w-2xl">
                {featuredBook.description}
              </p>

              {/* Action Buttons */}
              <div className="flex items-center gap-3 mt-4">
                <button
                  id={`btn-play-featured-${featuredBook.id}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleBookClick(featuredBook);
                  }}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white hover:bg-gray-200 text-black text-xs font-bold transition-all active:scale-95"
                >
                  <Play className="w-3.5 h-3.5 fill-current" /> Listen
                </button>

                {onReadBook && (
                  <button
                    id={`btn-read-featured-${featuredBook.id}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      onReadBook(featuredBook);
                    }}
                    className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-white/90 text-xs font-semibold transition-all active:scale-95"
                  >
                    <BookOpen className="w-3.5 h-3.5" /> Read
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Active Genre Catalog Grid / List */}
      <div className="mb-10">
        <div className="flex items-center justify-between mb-3.5 px-0.5">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-serif-display italic font-semibold text-white">
              {selectedGenre.id === 'all' ? 'Curated LibriVox Masterpieces' : selectedGenre.label}
            </h3>
            {isLoadingGenre && (
              <span className="text-[10px] text-[#C5A059] animate-pulse">Fetching LibriVox archives...</span>
            )}
          </div>
          <span className="text-[11px] text-white/40 font-mono">
            {genreBooks.length} Works Available
          </span>
        </div>

        {/* Book Grid */}
        <div id="catalog-grid" className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3.5">
          {genreBooks.map((book) => (
            <BookGridCard
              key={book.id}
              book={book}
              onSelect={handleBookClick}
              onRead={onReadBook}
            />
          ))}
        </div>
      </div>

      {/* Dynamic Recommendation Sections */}
      {isLoadingSections ? (
        <div className="space-y-6">
          <div className="h-6 w-48 bg-white/5 rounded-lg animate-pulse" />
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="aspect-[3/4] bg-white/5 rounded-xl animate-pulse" />
            ))}
          </div>
        </div>
      ) : (
        <div className="space-y-10">
          {dynamicSections.map((section) => (
            <HorizontalBookShelf
              key={section.id}
              section={section}
              onSelectBook={handleBookClick}
              onReadBook={onReadBook}
            />
          ))}
        </div>
      )}
    </div>
  );
};

// Sub-component: Clean Book Grid Card
interface BookCardProps {
  book: Audiobook;
  onSelect: (book: Audiobook) => void;
  onRead?: (book: Audiobook) => void;
}

const BookGridCard: React.FC<BookCardProps> = ({ book, onSelect, onRead }) => {
  return (
    <div
      id={`book-card-${book.id}`}
      onClick={() => onSelect(book)}
      className="group flex flex-col bg-[#111111]/90 rounded-2xl border border-white/[0.07] p-3 hover:border-[#C5A059]/50 hover:bg-[#161616] transition-all duration-200 cursor-pointer shadow-md hover:shadow-[0_8px_30px_rgba(0,0,0,0.7)]"
    >
      <div className="relative aspect-[3/4] w-full rounded-xl overflow-hidden mb-2.5 bg-[#1a1a1a] border border-white/5 shadow-inner">
        <img
          src={book.coverImageUrl}
          alt={book.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          referrerPolicy="no-referrer"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <div className="w-10 h-10 rounded-full bg-[#C5A059] text-black flex items-center justify-center shadow-lg shadow-black transform scale-90 group-hover:scale-100 transition-transform">
            <Play className="w-4 h-4 fill-current ml-0.5" />
          </div>
        </div>
      </div>

      <h4 className="text-xs sm:text-sm font-serif-display italic font-semibold text-[#EFEFEF] truncate leading-tight group-hover:text-[#C5A059] transition-colors">
        {book.title}
      </h4>
      <p className="text-[11px] text-[#888888] font-serif-display italic truncate mt-0.5">
        {book.author}
      </p>

      <div className="flex items-center justify-between text-[10px] text-white/40 mt-auto pt-2 border-t border-white/5">
        <span>{book.tracks.length} Ch.</span>
        <span className="text-[#C5A059] font-medium font-mono">{Math.round(book.totalTimeSecs / 3600)}h</span>
      </div>
    </div>
  );
};

// Sub-component: Horizontal Scrolling Recommendation Rail / Shelf
interface HorizontalShelfProps {
  section: RecommendationSection;
  onSelectBook: (book: Audiobook) => void;
  onReadBook?: (book: Audiobook) => void;
}

const HorizontalBookShelf: React.FC<HorizontalShelfProps> = ({
  section,
  onSelectBook,
  onReadBook,
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = direction === 'left' ? -320 : 320;
      scrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  return (
    <div id={`shelf-section-${section.id}`} className="relative">
      {/* Section Header */}
      <div className="flex items-center justify-between mb-3 px-0.5">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-sm sm:text-base font-serif-display italic font-semibold text-white tracking-wide">
              {section.title}
            </h3>
            {section.badge && (
              <span className="text-[9px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-[#C5A059]/15 text-[#C5A059] border border-[#C5A059]/30">
                {section.badge}
              </span>
            )}
          </div>
          {section.subtitle && (
            <p className="text-[11px] text-white/50 font-serif-display italic mt-0.5">
              {section.subtitle}
            </p>
          )}
        </div>

        {/* Scroll Arrows */}
        <div className="hidden sm:flex items-center gap-1.5">
          <button
            onClick={() => scroll('left')}
            className="p-1.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-white/60 hover:text-white border border-white/10 transition-colors"
            title="Scroll left"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => scroll('right')}
            className="p-1.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-white/60 hover:text-white border border-white/10 transition-colors"
            title="Scroll right"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Horizontal Carousel */}
      <div
        ref={scrollRef}
        className="flex items-stretch gap-3.5 overflow-x-auto pb-3 pt-1 scrollbar-none snap-x snap-mandatory"
      >
        {section.books.map((book) => (
          <div
            key={book.id}
            id={`shelf-book-${book.id}`}
            onClick={() => onSelectBook(book)}
            className="group w-40 sm:w-44 shrink-0 snap-start flex flex-col bg-[#111111]/90 rounded-2xl border border-white/[0.07] p-3 hover:border-[#C5A059]/50 hover:bg-[#161616] transition-all duration-200 cursor-pointer shadow-md"
          >
            <div className="relative aspect-[3/4] w-full rounded-xl overflow-hidden mb-2.5 bg-[#181818] border border-white/5">
              <img
                src={book.coverImageUrl}
                alt={book.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                referrerPolicy="no-referrer"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <div className="w-9 h-9 rounded-full bg-[#C5A059] text-black flex items-center justify-center shadow-lg shadow-black transform scale-90 group-hover:scale-100 transition-transform">
                  <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                </div>
              </div>
            </div>

            <h4 className="text-xs font-serif-display italic font-semibold text-[#EFEFEF] truncate leading-tight group-hover:text-[#C5A059] transition-colors">
              {book.title}
            </h4>
            <p className="text-[11px] text-[#888888] font-serif-display italic truncate mt-0.5">
              {book.author}
            </p>

            <div className="flex items-center justify-between text-[10px] text-white/40 mt-auto pt-2 border-t border-white/5">
              <span>{book.tracks.length} Ch.</span>
              <span className="text-[#C5A059] font-medium font-mono">{Math.round(book.totalTimeSecs / 3600)}h</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
