import React, { useState, useEffect } from 'react';
import { Audiobook, AudioTrack } from '../types';
import { Search, X, Play, Clock, Sparkles, BookOpen, SearchX } from 'lucide-react';

interface SearchViewProps {
  allBooks: Audiobook[];
  onSelectBook: (book: Audiobook) => void;
  onReadBook?: (book: Audiobook) => void;
}

export const SearchView: React.FC<SearchViewProps> = ({ allBooks, onSelectBook, onReadBook }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedTerm, setDebouncedTerm] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState<Audiobook[]>([]);
  const [resolvingBookId, setResolvingBookId] = useState<string | null>(null);

  const quickQueries = [
    'Sherlock Holmes',
    'Jane Austen',
    'Frankenstein',
    'Dracula',
    'Moby Dick',
    'Alice in Wonderland',
    'The Time Machine',
    'Edgar Allan Poe',
  ];

  // Debounce search input
  useEffect(() => {
    setIsSearching(true);
    const handler = setTimeout(() => {
      setDebouncedTerm(searchTerm);
    }, 350);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  // Perform multi-source search (Local + LibriVox Feed + Internet Archive)
  useEffect(() => {
    if (!debouncedTerm.trim()) {
      setResults([]);
      setIsSearching(false);
      return;
    }

    const query = debouncedTerm.toLowerCase().trim();
    const localMatches = allBooks.filter(
      (book) =>
        book.title.toLowerCase().includes(query) ||
        book.author.toLowerCase().includes(query) ||
        book.description.toLowerCase().includes(query)
    );

    let isMounted = true;

    const fetchLibriVoxAndArchive = async () => {
      const combined: Audiobook[] = [...localMatches];

      try {
        // 1. Query Internet Archive LibriVox Collection (CORS-friendly, rich metadata)
        const archiveUrl = `https://archive.org/advancedsearch.php?q=collection:(librivoxaudio)+AND+(title:(${encodeURIComponent(
          query
        )})+OR+creator:(${encodeURIComponent(query)}))&fl[]=identifier,title,creator,description,year,runtime,downloads&sort[]=downloads+desc&output=json&rows=12`;

        const archiveRes = await fetch(archiveUrl);
        if (archiveRes.ok) {
          const archiveData = await archiveRes.json();
          if (archiveData.response?.docs && Array.isArray(archiveData.response.docs)) {
            archiveData.response.docs.forEach((doc: any) => {
              const id = doc.identifier;
              if (id && !combined.some((b) => b.id === id || b.title.toLowerCase() === (doc.title || '').toLowerCase())) {
                const rawDesc = typeof doc.description === 'string' ? doc.description.replace(/<[^>]*>/g, '').trim() : '';
                combined.push({
                  id,
                  title: doc.title || 'Untitled Work',
                  author: Array.isArray(doc.creator) ? doc.creator.join(', ') : doc.creator || 'LibriVox Volunteer Narrators',
                  description: rawDesc || 'Public domain classic recorded by LibriVox volunteers and hosted by the Internet Archive.',
                  coverImageUrl: `https://archive.org/services/img/${id}`,
                  language: 'English',
                  totalTimeSecs: typeof doc.runtime === 'string' ? parseRuntimeToSecs(doc.runtime) : 7200,
                  reader: 'LibriVox Community',
                  tracks: [
                    {
                      id: `ia_${id}_01`,
                      title: `${doc.title || 'Section 1'}`,
                      audioUrl: `https://archive.org/download/${id}/${id}_64kb.mp3`,
                      durationSeconds: 1800,
                      trackNumber: 1,
                    },
                  ],
                });
              }
            });
          }
        }
      } catch (err) {
        console.warn('Internet Archive search fallback:', err);
      }

      try {
        // 2. Query LibriVox JSON Feed directly
        const librivoxUrl = `https://librivox.org/api/feed/audiobooks?format=json&title=^${encodeURIComponent(
          query
        )}&limit=8&extended=1`;

        const lvRes = await fetch(librivoxUrl);
        if (lvRes.ok) {
          const lvData = await lvRes.json();
          if (lvData.books && Array.isArray(lvData.books)) {
            lvData.books.forEach((b: any) => {
              const id = String(b.id);
              if (!combined.some((c) => c.id === id)) {
                combined.push({
                  id,
                  title: b.title || 'Untitled',
                  author: b.authors?.[0]
                    ? `${b.authors[0].first_name || ''} ${b.authors[0].last_name || ''}`.trim()
                    : 'Public Domain Author',
                  description: (b.description || '').replace(/<[^>]*>/g, '').trim(),
                  coverImageUrl:
                    b.coverart_jpg ||
                    `https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&q=80&w=800`,
                  language: b.language || 'English',
                  totalTimeSecs: parseInt(b.totaltimesecs, 10) || 3600,
                  reader: b.sections?.[0]?.readers?.[0]?.display_name || 'LibriVox Reader',
                  tracks: (b.sections && Array.isArray(b.sections) && b.sections.length > 0)
                    ? b.sections.map((s: any, idx: number) => ({
                        id: `sec_${b.id}_${s.id || idx}`,
                        title: s.title || `Section ${idx + 1}`,
                        audioUrl: s.listen_url || '',
                        durationSeconds: parseInt(s.playtime, 10) || 1200,
                        trackNumber: idx + 1,
                      }))
                    : [
                        {
                          id: `tr_${b.id}_1`,
                          title: `${b.title} - Full Audiobook`,
                          audioUrl: b.url_librivox || '',
                          durationSeconds: 1800,
                          trackNumber: 1,
                        },
                      ],
                });
              }
            });
          }
        }
      } catch (err) {
        console.warn('LibriVox direct feed fallback:', err);
      }

      if (isMounted) {
        setResults(combined);
        setIsSearching(false);
      }
    };

    fetchLibriVoxAndArchive();

    return () => {
      isMounted = false;
    };
  }, [debouncedTerm, allBooks]);

  // Helper to parse runtimes like "01:23:45"
  const parseRuntimeToSecs = (runtimeStr: string): number => {
    try {
      const parts = runtimeStr.split(':').map(Number);
      if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
      if (parts.length === 2) return parts[0] * 60 + parts[1];
    } catch (_) {}
    return 3600;
  };

  // When clicking on an Internet Archive book, resolve exact MP3 tracks if needed
  const handleBookClick = async (book: Audiobook) => {
    // If book already has multiple fully configured tracks, play immediately
    if (book.tracks.length > 1 && book.tracks[0].audioUrl.endsWith('.mp3')) {
      onSelectBook(book);
      return;
    }

    // Otherwise check metadata from Archive.org to populate exact chapter mp3s
    setResolvingBookId(book.id);
    try {
      const metaRes = await fetch(`https://archive.org/metadata/${book.id}/files`);
      if (metaRes.ok) {
        const metaData = await metaRes.json();
        if (metaData.result && Array.isArray(metaData.result)) {
          const mp3Files = metaData.result.filter(
            (f: any) =>
              typeof f.name === 'string' &&
              f.name.toLowerCase().endsWith('.mp3') &&
              !f.name.toLowerCase().includes('vbr') &&
              !f.name.toLowerCase().includes('sample')
          );

          if (mp3Files.length > 0) {
            const enrichedTracks: AudioTrack[] = mp3Files.map((file: any, idx: number) => ({
              id: `${book.id}_tr_${idx + 1}`,
              title: file.title || file.name.replace(/_/g, ' ').replace(/\.mp3$/i, ''),
              audioUrl: `https://archive.org/download/${book.id}/${encodeURIComponent(file.name)}`,
              durationSeconds: Math.round(parseFloat(file.length)) || 1200,
              trackNumber: idx + 1,
            }));

            const updatedBook: Audiobook = {
              ...book,
              tracks: enrichedTracks,
            };
            setResolvingBookId(null);
            onSelectBook(updatedBook);
            return;
          }
        }
      }
    } catch (e) {
      console.warn('Could not enrich tracks from archive metadata:', e);
    }

    setResolvingBookId(null);
    onSelectBook(book);
  };

  return (
    <div id="search-view-container" className="w-full flex flex-col pb-16 text-[#EFEFEF]">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-base font-serif-display italic font-semibold text-white tracking-wide">
          Search Catalog
        </h1>
      </div>

      {/* Search Input Bar */}
      <div id="search-input-wrapper" className="relative mb-3">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#C5A059]" />
        <input
          id="input-audiobook-search"
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search any title, author, or keyword (e.g. Dracula, Poe)..."
          className="w-full pl-10 pr-9 py-2.5 rounded-xl bg-[#111111] border border-white/10 focus:border-[#C5A059] text-xs text-[#EFEFEF] placeholder-white/30 focus:outline-none focus:ring-1 focus:ring-[#C5A059] transition-all"
        />
        {searchTerm && (
          <button
            id="btn-clear-search"
            onClick={() => setSearchTerm('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Quick Search Chips */}
      <div id="quick-search-chips" className="flex items-center gap-1.5 overflow-x-auto pb-2 mb-2 scrollbar-none">
        {quickQueries.map((term) => (
          <button
            key={term}
            id={`chip-${term.toLowerCase().replace(/\s+/g, '-')}`}
            onClick={() => setSearchTerm(term)}
            className="shrink-0 px-2.5 py-1 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-[10px] font-medium text-white/70 hover:text-[#C5A059] border border-white/10 hover:border-[#C5A059]/40 transition-all font-serif-display italic whitespace-nowrap"
          >
            {term}
          </button>
        ))}
      </div>

      {/* Search Results / Empty State */}
      <div id="search-results-wrapper" className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-white/10">
        {isSearching ? (
          <div className="flex flex-col items-center justify-center h-48 text-[#888888]">
            <div className="w-5 h-5 border-2 border-[#C5A059] border-t-transparent rounded-full animate-spin mb-2.5" />
            <p className="text-xs font-serif-display italic">Searching LibriVox & Internet Archive catalogs...</p>
          </div>
        ) : debouncedTerm.trim() === '' ? (
          <div id="search-empty-prompt" className="flex flex-col items-center justify-center h-48 text-white/40 text-center px-4">
            <div className="w-12 h-12 rounded-full bg-white/[0.03] border border-white/10 flex items-center justify-center text-[#C5A059] mb-3 shadow-lg">
              <Sparkles className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-serif-display italic font-medium text-white">Discover Timeless Audiobooks</h3>
            <p className="text-xs text-[#888888] mt-1 max-w-[240px] leading-relaxed">
              Explore thousands of titles, authors, and narrators across classic literature.
            </p>
          </div>
        ) : results.length === 0 ? (
          <div id="search-no-results" className="flex flex-col items-center justify-center h-48 text-white/40 text-center px-4">
            <SearchX className="w-8 h-8 text-white/20 mb-2" />
            <h3 className="text-sm font-serif-display italic font-medium text-white">No results found for &ldquo;{debouncedTerm}&rdquo;</h3>
            <p className="text-xs text-[#888888] mt-1">Try another title or author name.</p>
          </div>
        ) : (
          <div id="search-results-list" className="space-y-2">
            <div className="flex items-center justify-between px-1">
              <p className="text-[10px] uppercase tracking-widest text-[#888888] font-medium">{results.length} Works Found</p>
            </div>
            {results.map((book) => {
              const isResolving = resolvingBookId === book.id;
              return (
                <div
                  key={book.id}
                  id={`search-result-${book.id}`}
                  onClick={() => handleBookClick(book)}
                  className="flex items-center gap-3 p-2.5 rounded-xl bg-[#111111]/90 border border-white/[0.07] hover:border-[#C5A059]/40 hover:bg-[#161616] transition-all cursor-pointer group"
                >
                  <div className="w-11 h-15 shrink-0 rounded-lg overflow-hidden bg-[#1a1a1a] border border-white/5 relative">
                    <img
                      src={book.coverImageUrl}
                      alt={book.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      referrerPolicy="no-referrer"
                      onError={(e) => {
                        // Fallback placeholder image if coverart fails
                        (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&q=80&w=800';
                      }}
                    />
                    {isResolving && (
                      <div className="absolute inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center">
                        <div className="w-4 h-4 border-2 border-[#C5A059] border-t-transparent rounded-full animate-spin" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-xs font-serif-display italic font-medium text-[#EFEFEF] truncate group-hover:text-[#C5A059] transition-colors">
                      {book.title}
                    </h4>
                    <p className="text-[11px] text-[#888888] font-serif-display italic truncate mt-0.5">{book.author}</p>
                    <div className="flex items-center gap-2 text-[10px] text-white/40 mt-1">
                      <span className="flex items-center gap-1">
                        <Clock className="w-2.5 h-2.5 text-[#C5A059]/70" />
                        {Math.round(book.totalTimeSecs / 3600) || 1}h
                      </span>
                      <span>•</span>
                      <span className="text-[#C5A059] uppercase tracking-wider text-[9px]">{book.language}</span>
                      <span>•</span>
                      <span className="text-white/30 truncate">{book.tracks.length} track{book.tracks.length > 1 ? 's' : ''}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    {onReadBook && (
                      <button
                        id={`btn-read-result-${book.id}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          onReadBook(book);
                        }}
                        className="w-8 h-8 rounded-full bg-white/[0.04] hover:bg-[#C5A059]/20 text-white/50 hover:text-[#C5A059] flex items-center justify-center transition-all border border-white/10 hover:border-[#C5A059]/40"
                        title="Read Ebook Edition"
                      >
                        <BookOpen className="w-3.5 h-3.5" />
                      </button>
                    )}
                    <button
                      id={`btn-play-result-${book.id}`}
                      className="w-8 h-8 rounded-full bg-white/[0.05] group-hover:bg-[#C5A059] text-white/60 group-hover:text-black flex items-center justify-center transition-all border border-white/10 group-hover:border-[#C5A059] group-hover:shadow-[0_0_12px_rgba(197,160,89,0.4)]"
                      title="Play Audiobook"
                    >
                      {isResolving ? (
                        <div className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

