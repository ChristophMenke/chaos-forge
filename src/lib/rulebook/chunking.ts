/**
 * Rulebook text chunking for RAG pipeline.
 * Trims non-rules content (foreword, credits, ToC, index) and splits
 * into overlapping chunks suitable for embedding.
 */

/** Metadata for a single chunk */
export interface ChunkMetadata {
  bookSlug: string;
  bookTitle: string;
  chunkIndex: number;
  content: string;
  tokenCount: number;
}

/** Map of filename patterns to book slugs and titles */
export const BOOK_MAPPING: Record<string, { slug: string; title: string }> = {
  "Players Handbook": { slug: "phb", title: "Players Handbook" },
  "PHBR01 - The Complete Fighter's Handbook": {
    slug: "phbr01",
    title: "Complete Fighter's Handbook",
  },
  "PHBR02 - The Complete Thief's Handbook": {
    slug: "phbr02",
    title: "Complete Thief's Handbook",
  },
  "PHBR03 - The Complete Priest's Handbook": {
    slug: "phbr03",
    title: "Complete Priest's Handbook",
  },
  "PHBR04 - The Complete Wizard's Handbook": {
    slug: "phbr04",
    title: "Complete Wizard's Handbook",
  },
  "PHBR05 - The Complete Psionics Handbook": {
    slug: "phbr05",
    title: "Complete Psionics Handbook",
  },
  "PHBR06 - The Complete Book of Dwarves": {
    slug: "phbr06",
    title: "Complete Book of Dwarves",
  },
  "PHBR07 - The Complete Bard's Handbook": {
    slug: "phbr07",
    title: "Complete Bard's Handbook",
  },
  "PHBR08 - The Complete Book of Elves": {
    slug: "phbr08",
    title: "Complete Book of Elves",
  },
  "PHBR09 - The Complete Book of Gnomes and Halflings": {
    slug: "phbr09",
    title: "Complete Book of Gnomes and Halflings",
  },
  "PHBR10 - The Complete Book of Humanoids": {
    slug: "phbr10",
    title: "Complete Book of Humanoids",
  },
  "PHBR11 - The Complete Ranger's Handbook": {
    slug: "phbr11",
    title: "Complete Ranger's Handbook",
  },
  "PHBR12 - The Complete Paladin's Handbook": {
    slug: "phbr12",
    title: "Complete Paladin's Handbook",
  },
  "PHBR13 - The Complete Druid's Handbook": {
    slug: "phbr13",
    title: "Complete Druid's Handbook",
  },
  "PHBR14 - The Complete Barbarian's Handbook": {
    slug: "phbr14",
    title: "Complete Barbarian's Handbook",
  },
  "DMGR3 - Arms and Equipment Guide": {
    slug: "aeg",
    title: "Arms and Equipment Guide",
  },
  "Tome of Magic": { slug: "tom", title: "Tome of Magic" },
  "Player's Option - Skills & Powers": {
    slug: "po-sp",
    title: "Player's Option: Skills & Powers",
  },
  "Player's Option - Spells & Magic": {
    slug: "po-sm",
    title: "Player's Option: Spells & Magic",
  },
  "Wizards Spell Compendium Volume 1": {
    slug: "wsc1",
    title: "Wizard's Spell Compendium Vol. 1",
  },
  "Wizards Spell Compendium Volume 2": {
    slug: "wsc2",
    title: "Wizard's Spell Compendium Vol. 2",
  },
  "Wizards Spell Compendium Volume 3": {
    slug: "wsc3",
    title: "Wizard's Spell Compendium Vol. 3",
  },
  "Wizards Spell Compendium Volume 4": {
    slug: "wsc4",
    title: "Wizard's Spell Compendium Vol. 4",
  },
  "Priest Spell Compendium Volume 1": {
    slug: "psc1",
    title: "Priest Spell Compendium Vol. 1",
  },
  "Priest Spell Compendium Volume 2": {
    slug: "psc2",
    title: "Priest Spell Compendium Vol. 2",
  },
  "Priest Spell Compendium Volume 3": {
    slug: "psc3",
    title: "Priest Spell Compendium Vol. 3",
  },
  "Book of Artifacts": { slug: "boa", title: "Book of Artifacts" },
  "The Magic Encyclopedia Volume 1": {
    slug: "me1",
    title: "Magic Encyclopedia Vol. 1",
  },
  "The Magic Encyclopedia Volume 2": {
    slug: "me2",
    title: "Magic Encyclopedia Vol. 2",
  },
};

/** Approximate token count (chars / 4) */
export function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

/**
 * Resolve a filename to its book slug and title.
 * Matches against BOOK_MAPPING keys as substrings of the filename.
 */
export function resolveBook(filename: string): { slug: string; title: string } | null {
  for (const [pattern, info] of Object.entries(BOOK_MAPPING)) {
    if (filename.includes(pattern)) return info;
  }
  return null;
}

/**
 * Trim non-rules content from OCR text:
 * - Leading content before first chapter/rules heading
 * - Table of Contents blocks
 * - Trailing index pages
 * - Copyright/legal blocks
 */
export function trimText(text: string): string {
  const lines = text.split("\n");

  // 1. Find first rules content line
  const firstContentIdx = findFirstContentLine(lines);

  // 2. Find trailing index start
  const indexStartIdx = findTrailingIndex(lines);

  // 3. Extract content range
  let contentLines = lines.slice(firstContentIdx, indexStartIdx);

  // 4. Remove ToC blocks inline
  contentLines = removeTocBlocks(contentLines);

  // 5. Remove copyright blocks
  contentLines = removeCopyrightBlocks(contentLines);

  return contentLines.join("\n").trim();
}

/** Find the first line that looks like rules content */
function findFirstContentLine(lines: string[]): number {
  const chapterPattern =
    /^(Chapter\s+\d|Introduction|Welcome|Part\s+(One|Two|Three|Four|I|II|III|IV)|[A-Z][a-z]+ Spells|Ability Scores|The Races|Character Classes)/i;

  for (let i = 0; i < Math.min(lines.length, 500); i++) {
    if (chapterPattern.test(lines[i].trim())) {
      return i;
    }
  }
  // If no chapter heading found in first 500 lines, skip first 30 (minimal trim)
  return Math.min(30, lines.length);
}

/** Find where a trailing index section begins */
function findTrailingIndex(lines: string[]): number {
  // Search from the end for an "Index" heading followed by page-reference patterns
  for (let i = lines.length - 1; i >= Math.max(0, lines.length - 2000); i--) {
    if (/^\s*Index\s*$/i.test(lines[i])) {
      // Check if next lines look like index entries (word ... number)
      let indexLikeCount = 0;
      for (let j = i + 1; j < Math.min(i + 20, lines.length); j++) {
        if (/\d+/.test(lines[j]) && lines[j].length < 100) {
          indexLikeCount++;
        }
      }
      if (indexLikeCount >= 3) return i;
    }
  }
  return lines.length;
}

/** Remove Table of Contents blocks (sequences of 5+ lines with page-number dot leaders) */
function removeTocBlocks(lines: string[]): string[] {
  const result: string[] = [];
  let buffer: string[] = [];
  const tocLinePattern = /\.{3,}\s*\d+|\.{2,}\d+|\.\s+\d+$/;

  for (const line of lines) {
    if (tocLinePattern.test(line)) {
      buffer.push(line);
    } else {
      if (buffer.length > 0 && buffer.length < 5) {
        // Short run — not a ToC block, keep these lines
        result.push(...buffer);
      }
      // If buffer.length >= 5, it was a ToC block — discard
      buffer = [];
      result.push(line);
    }
  }
  // Flush remaining buffer
  if (buffer.length > 0 && buffer.length < 5) {
    result.push(...buffer);
  }
  return result;
}

/** Remove copyright/legal blocks */
function removeCopyrightBlocks(lines: string[]): string[] {
  const result: string[] = [];
  for (let i = 0; i < lines.length; i++) {
    if (
      /TSR,?\s*Inc/i.test(lines[i]) &&
      /trademark|copyright|registered|all rights reserved/i.test(lines[i])
    ) {
      // Skip this line and up to 5 following lines that are part of the block
      let j = i + 1;
      while (
        j < lines.length &&
        j - i < 6 &&
        /TSR|trademark|copyright|ISBN|published|printed|reserved/i.test(lines[j])
      ) {
        j++;
      }
      i = j - 1; // skip block
    } else {
      result.push(lines[i]);
    }
  }
  return result;
}

const TARGET_TOKENS = 1500;
const OVERLAP_TOKENS = 200;

/**
 * Split trimmed text into overlapping chunks.
 * - Paragraph-based splitting (double newline)
 * - Spell entries are kept intact
 * - Overlap of ~200 tokens between consecutive chunks
 */
export function chunkText(text: string, bookSlug: string, bookTitle: string): ChunkMetadata[] {
  const paragraphs = text.split(/\n\n+/);
  const chunks: ChunkMetadata[] = [];

  let currentParagraphs: string[] = [];
  let currentTokens = 0;

  for (const para of paragraphs) {
    const paraTokens = estimateTokens(para);

    // If a single paragraph exceeds target, force it as its own chunk
    if (paraTokens > TARGET_TOKENS * 1.5 && currentParagraphs.length === 0) {
      chunks.push({
        bookSlug,
        bookTitle,
        chunkIndex: chunks.length,
        content: para.trim(),
        tokenCount: paraTokens,
      });
      continue;
    }

    // If adding this paragraph would exceed target, finalize current chunk
    if (currentTokens + paraTokens > TARGET_TOKENS && currentParagraphs.length > 0) {
      const content = currentParagraphs.join("\n\n").trim();
      chunks.push({
        bookSlug,
        bookTitle,
        chunkIndex: chunks.length,
        content,
        tokenCount: estimateTokens(content),
      });

      // Overlap: keep last paragraphs that fit in ~OVERLAP_TOKENS
      const overlapParagraphs: string[] = [];
      let overlapTokens = 0;
      for (let i = currentParagraphs.length - 1; i >= 0; i--) {
        const pTokens = estimateTokens(currentParagraphs[i]);
        if (overlapTokens + pTokens > OVERLAP_TOKENS) break;
        overlapParagraphs.unshift(currentParagraphs[i]);
        overlapTokens += pTokens;
      }
      currentParagraphs = overlapParagraphs;
      currentTokens = overlapTokens;
    }

    currentParagraphs.push(para);
    currentTokens += paraTokens;
  }

  // Finalize last chunk
  if (currentParagraphs.length > 0) {
    const content = currentParagraphs.join("\n\n").trim();
    if (content.length > 0) {
      chunks.push({
        bookSlug,
        bookTitle,
        chunkIndex: chunks.length,
        content,
        tokenCount: estimateTokens(content),
      });
    }
  }

  return chunks;
}
