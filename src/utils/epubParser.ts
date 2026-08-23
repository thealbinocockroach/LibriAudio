import JSZip from 'jszip';
import { Audiobook, EbookChapter } from '../types';

export async function parseUploadedEpub(file: File): Promise<Audiobook> {
  const fileName = file.name.toLowerCase();

  // Support plain text or HTML files directly
  if (fileName.endsWith('.txt') || fileName.endsWith('.html') || fileName.endsWith('.htm')) {
    const text = await file.text();
    const title = file.name.replace(/\.[^/.]+$/, '');
    const chapters: EbookChapter[] = [];

    if (fileName.endsWith('.txt')) {
      const parts = text.split(/\n(?=(?:Chapter|Section|Book|Part)\s+\d+)/i);
      if (parts.length > 1) {
        parts.forEach((p, idx) => {
          const lines = p.trim().split('\n');
          const chTitle = lines[0] || `Section ${idx + 1}`;
          chapters.push({
            id: `txt_ch_${idx + 1}`,
            title: chTitle,
            content: `<p>${p.replace(/\n/g, '<br/>')}</p>`,
          });
        });
      } else {
        chapters.push({
          id: 'txt_ch_1',
          title: title,
          content: `<p>${text.replace(/\n/g, '<br/>')}</p>`,
        });
      }
    } else {
      chapters.push({
        id: 'html_ch_1',
        title: title,
        content: text,
      });
    }

    const bookId = `custom_${Date.now()}`;
    return {
      id: bookId,
      title,
      author: 'Uploaded Document',
      description: `Uploaded manuscript: ${title} (${chapters.length} chapter${chapters.length > 1 ? 's' : ''}).`,
      coverImageUrl: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600&auto=format&fit=crop&q=80',
      language: 'English',
      totalTimeSecs: chapters.length * 600,
      reader: 'EPUB / AI Voice Reader',
      tracks: chapters.map((ch, idx) => ({
        id: `${bookId}_tr_${idx + 1}`,
        title: ch.title,
        audioUrl: 'https://archive.org/download/librivox_audio_collection/placeholder.mp3',
        durationSeconds: 600,
        trackNumber: idx + 1,
      })),
      ebookChapters: chapters,
    };
  }

  // Parse EPUB archive via JSZip
  const zip = new JSZip();
  const zipContent = await zip.loadAsync(file);

  // 1. Locate container.xml
  let opfPath = '';
  const containerFile = zipContent.file('META-INF/container.xml') || zipContent.file('meta-inf/container.xml');
  if (containerFile) {
    const containerXmlText = await containerFile.async('text');
    const opfPathMatch = containerXmlText.match(/full-path="([^"]+)"/i);
    if (opfPathMatch && opfPathMatch[1]) {
      opfPath = opfPathMatch[1];
    }
  }

  // If container.xml was missing or path invalid, look for any .opf file in the zip
  if (!opfPath) {
    const anyOpf = Object.keys(zipContent.files).find((p) => p.toLowerCase().endsWith('.opf'));
    if (anyOpf) opfPath = anyOpf;
  }

  if (!opfPath) {
    throw new Error('Invalid EPUB file: No OPF package manifest found.');
  }

  const opfFolder = opfPath.includes('/') ? opfPath.substring(0, opfPath.lastIndexOf('/') + 1) : '';
  const opfFile = zipContent.file(opfPath);
  if (!opfFile) {
    throw new Error(`OPF manifest file not found in package at ${opfPath}`);
  }

  const opfText = await opfFile.async('text');

  // Extract title and author
  const titleMatch = opfText.match(/<dc:title[^>]*>([\s\S]*?)<\/dc:title>/i);
  const authorMatch = opfText.match(/<dc:creator[^>]*>([\s\S]*?)<\/dc:creator>/i);

  const rawTitle = titleMatch ? titleMatch[1].replace(/<[^>]*>/g, '').trim() : '';
  const rawAuthor = authorMatch ? authorMatch[1].replace(/<[^>]*>/g, '').trim() : '';

  const title = rawTitle || file.name.replace(/\.epub$/i, '').replace(/[-_]/g, ' ');
  const author = rawAuthor || 'Custom Author';

  // Extract manifest items
  const manifestItems: Record<string, string> = {};
  let coverHref = '';

  const itemRegex = /<item\s+([^>]+)>/gi;
  let itemMatch;
  while ((itemMatch = itemRegex.exec(opfText)) !== null) {
    const attrs = itemMatch[1];
    const idMatch = attrs.match(/id="([^"]+)"/i);
    const hrefMatch = attrs.match(/href="([^"]+)"/i);
    const mediaMatch = attrs.match(/media-type="([^"]+)"/i);
    if (idMatch && hrefMatch) {
      const id = idMatch[1];
      const href = hrefMatch[1];
      manifestItems[id] = href;

      const mediaType = mediaMatch ? mediaMatch[1].toLowerCase() : '';
      if (
        (mediaType.startsWith('image/') || href.match(/\.(jpg|jpeg|png|webp)$/i)) &&
        (id.toLowerCase().includes('cover') || attrs.toLowerCase().includes('cover'))
      ) {
        coverHref = href;
      }
    }
  }

  // Attempt to extract cover image if found
  let coverImageUrl = 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600&auto=format&fit=crop&q=80';
  if (coverHref) {
    try {
      const coverFile = zipContent.file(opfFolder + coverHref) || zipContent.file(coverHref);
      if (coverFile) {
        const coverBlob = await coverFile.async('blob');
        if (coverBlob.size > 0) {
          coverImageUrl = URL.createObjectURL(coverBlob);
        }
      }
    } catch {
      // Fallback
    }
  }

  // Extract spine itemrefs
  const spineIds: string[] = [];
  const spineRegex = /<itemref\s+idref="([^"]+)"/gi;
  let spineMatch;
  while ((spineMatch = spineRegex.exec(opfText)) !== null) {
    spineIds.push(spineMatch[1]);
  }

  const chapters: EbookChapter[] = [];
  let trackIndex = 1;

  for (const idref of spineIds) {
    const relativeHref = manifestItems[idref];
    if (!relativeHref) continue;

    const fullItemPath = opfFolder + relativeHref;
    const chapterFile =
      zipContent.file(fullItemPath) ||
      zipContent.file(relativeHref) ||
      zipContent.file(decodeURIComponent(fullItemPath));

    if (chapterFile) {
      const chapterHtml = await chapterFile.async('text');
      const bodyMatch = chapterHtml.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
      const contentHtml = bodyMatch ? bodyMatch[1] : chapterHtml;

      // Extract chapter title if available
      const hMatch = contentHtml.match(/<h[1-3][^>]*>([\s\S]*?)<\/h[1-3]>/i);
      const chapterTitle = hMatch
        ? hMatch[1].replace(/<[^>]*>/g, '').trim()
        : `Chapter ${trackIndex}`;

      if (contentHtml.trim().length > 30) {
        chapters.push({
          id: `uploaded_ch_${trackIndex}`,
          title: chapterTitle,
          content: contentHtml,
        });
        trackIndex++;
      }
    }
  }

  // If spine was empty, try reading any HTML/XHTML files in the zip
  if (chapters.length === 0) {
    const htmlFilePaths = Object.keys(zipContent.files).filter((p) =>
      p.match(/\.(html|xhtml|htm)$/i)
    );
    for (const p of htmlFilePaths) {
      const f = zipContent.file(p);
      if (f) {
        const text = await f.async('text');
        const bodyMatch = text.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
        const content = bodyMatch ? bodyMatch[1] : text;
        if (content.trim().length > 30) {
          chapters.push({
            id: `uploaded_ch_${trackIndex}`,
            title: `Chapter ${trackIndex}`,
            content,
          });
          trackIndex++;
        }
      }
    }
  }

  if (chapters.length === 0) {
    chapters.push({
      id: 'uploaded_ch_1',
      title: title,
      content: '<p>EPUB document content loaded successfully.</p>',
    });
  }

  const bookId = `uploaded_${Date.now()}`;
  const totalTimeSecs = chapters.length * 600;

  const audiobook: Audiobook = {
    id: bookId,
    title,
    author,
    description: `Custom uploaded EPUB by ${author}. Contains ${chapters.length} chapter${chapters.length > 1 ? 's' : ''}.`,
    coverImageUrl,
    language: 'English',
    totalTimeSecs,
    reader: 'EPUB Reader / AI Voice',
    tracks: chapters.map((ch, idx) => ({
      id: `${bookId}_tr_${idx + 1}`,
      title: ch.title,
      audioUrl: 'https://archive.org/download/librivox_audio_collection/placeholder.mp3',
      durationSeconds: 600,
      trackNumber: idx + 1,
    })),
    ebookChapters: chapters,
  };

  return audiobook;
}
