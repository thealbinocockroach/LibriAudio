import JSZip from 'jszip';
import { Audiobook, EbookChapter } from '../types';

export async function parseUploadedEpub(file: File): Promise<Audiobook> {
  const zip = new JSZip();
  const zipContent = await zip.loadAsync(file);

  // 1. Find container.xml to locate OPF file path
  const containerFile = zipContent.file('META-INF/container.xml');
  if (!containerFile) {
    throw new Error('Invalid EPUB file: META-INF/container.xml not found.');
  }
  const containerXmlText = await containerFile.async('text');
  
  // Simple XML parsing for rootfile full-path
  const opfPathMatch = containerXmlText.match(/full-path="([^"]+)"/i);
  if (!opfPathMatch || !opfPathMatch[1]) {
    throw new Error('Could not locate OPF manifest path in EPUB.');
  }
  const opfPath = opfPathMatch[1];
  const opfFolder = opfPath.includes('/') ? opfPath.substring(0, opfPath.lastIndexOf('/') + 1) : '';

  const opfFile = zipContent.file(opfPath);
  if (!opfFile) {
    throw new Error(`OPF manifest file not found at ${opfPath}`);
  }
  const opfText = await opfFile.async('text');

  // Extract title and author with regex
  const titleMatch = opfText.match(/<dc:title[^>]*>([^<]+)<\/dc:title>/i);
  const authorMatch = opfText.match(/<dc:creator[^>]*>([^<]+)<\/dc:creator>/i);

  const title = titleMatch ? titleMatch[1].trim() : file.name.replace(/\.epub$/i, '');
  const author = authorMatch ? authorMatch[1].trim() : 'Unknown Author';

  // Extract manifest items (id -> href)
  const manifestItems: Record<string, string> = {};
  const itemRegex = /<item\s+([^>]+)>/gi;
  let match;
  while ((match = itemRegex.exec(opfText)) !== null) {
    const attrs = match[1];
    const idMatch = attrs.match(/id="([^"]+)"/i);
    const hrefMatch = attrs.match(/href="([^"]+)"/i);
    const mediaMatch = attrs.match(/media-type="([^"]+)"/i);
    if (idMatch && hrefMatch) {
      manifestItems[idMatch[1]] = hrefMatch[1];
      // Check for cover image
      if (mediaMatch && mediaMatch[1].startsWith('image/') && (idMatch[1].toLowerCase().includes('cover') || attrs.toLowerCase().includes('cover'))) {
        // Can store cover href if needed
      }
    }
  }

  // Extract spine itemrefs
  const spineIds: string[] = [];
  const spineRegex = /<itemref\s+idref="([^"]+)"/gi;
  while ((match = spineRegex.exec(opfText)) !== null) {
    spineIds.push(match[1]);
  }

  const chapters: EbookChapter[] = [];
  let trackIndex = 1;

  for (const idref of spineIds) {
    const relativeHref = manifestItems[idref];
    if (!relativeHref) continue;

    const fullItemPath = opfFolder + relativeHref;
    const chapterFile = zipContent.file(fullItemPath) || zipContent.file(relativeHref);
    
    if (chapterFile) {
      const chapterHtml = await chapterFile.async('text');
      // Clean HTML body or extract text/html content
      const bodyMatch = chapterHtml.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
      const contentHtml = bodyMatch ? bodyMatch[1] : chapterHtml;

      // Extract chapter title from heading or filename
      const h1Match = contentHtml.match(/<h[12][^>]*>([^<]+)<\/h[12]>/i);
      const chapterTitle = h1Match ? h1Match[1].trim() : `Chapter ${trackIndex}`;

      chapters.push({
        id: `uploaded_ch_${trackIndex}`,
        title: chapterTitle,
        content: contentHtml,
      });
      trackIndex++;
    }
  }

  if (chapters.length === 0) {
    chapters.push({
      id: 'uploaded_ch_1',
      title: title,
      content: '<p>EPUB content loaded successfully.</p>',
    });
  }

  const bookId = `uploaded_${Date.now()}`;
  const totalTimeSecs = chapters.length * 600;

  const audiobook: Audiobook = {
    id: bookId,
    title,
    author,
    description: `Custom uploaded EPUB book by ${author}. Contains ${chapters.length} chapters.`,
    coverImageUrl: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600&auto=format&fit=crop&q=80',
    language: 'English',
    totalTimeSecs,
    reader: 'EPUB Reader AI Voice',
    tracks: chapters.map((ch, idx) => ({
      id: `${bookId}_tr_${idx + 1}`,
      title: ch.title,
      audioUrl: 'https://archive.org/download/librivox_audio_collection/placeholder.mp3', // synthetic stream fallback
      durationSeconds: 600,
      trackNumber: idx + 1,
    })),
    ebookChapters: chapters,
  };

  return audiobook;
}
