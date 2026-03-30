/**
 * Embedding pipeline for AD&D 2e rulebooks.
 * Reads OCR text files, trims non-rules content, chunks them,
 * generates embeddings via Voyage AI, and upserts into Supabase.
 *
 * Usage: npx tsx scripts/embed-books.ts
 *
 * Required env vars: VOYAGE_API_KEY, NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY
 */

import { readFileSync, readdirSync } from "fs";
import { join } from "path";
import { createClient } from "@supabase/supabase-js";
import { resolveBook, trimText, chunkText, type ChunkMetadata } from "../src/lib/rulebook/chunking";

// --- Config ---
const BOOKS_DIR = join(__dirname, "..", "ressources", "books");
const VOYAGE_API_URL = "https://api.voyageai.com/v1/embeddings";
const EMBEDDING_MODEL = "voyage-3-lite";
const BATCH_SIZE = 100;

interface VoyageResponse {
  data: { embedding: number[]; index: number }[];
  usage: { total_tokens: number };
}

// --- Init ---
function getEnvOrFail(key: string): string {
  const value = process.env[key];
  if (!value) {
    console.error(`Missing env var: ${key}`);
    process.exit(1);
  }
  return value;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function embedBatchWithRetry(
  texts: string[],
  apiKey: string,
  maxRetries = 5
): Promise<number[][]> {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const response = await fetch(VOYAGE_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: EMBEDDING_MODEL,
        input: texts,
        input_type: "document",
      }),
    });

    if (response.ok) {
      const data: VoyageResponse = await response.json();
      const sorted = data.data.sort((a, b) => a.index - b.index);
      return sorted.map((d) => d.embedding);
    }

    if (response.status === 429 && attempt < maxRetries) {
      const waitSec = 25 * (attempt + 1);
      console.log(
        `    Rate limited, waiting ${waitSec}s (attempt ${attempt + 1}/${maxRetries})...`
      );
      await sleep(waitSec * 1000);
      continue;
    }

    const error = await response.text();
    throw new Error(`Voyage API error (${response.status}): ${error}`);
  }
  throw new Error("Max retries exceeded");
}

async function main() {
  const supabaseUrl = getEnvOrFail("NEXT_PUBLIC_SUPABASE_URL");
  const supabaseServiceKey = getEnvOrFail("SUPABASE_SERVICE_ROLE_KEY");
  const voyageKey = getEnvOrFail("VOYAGE_API_KEY");

  // Use service role key to bypass RLS for bulk insert
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  // --- Read and process books ---
  const files = readdirSync(BOOKS_DIR).filter((f) => f.endsWith(".txt"));
  console.log(`Found ${files.length} book files.`);

  const allChunks: ChunkMetadata[] = [];

  for (const file of files) {
    const book = resolveBook(file);
    if (!book) {
      console.warn(`  Skipping unknown file: ${file}`);
      continue;
    }

    const raw = readFileSync(join(BOOKS_DIR, file), "utf-8");
    const trimmed = trimText(raw);
    const chunks = chunkText(trimmed, book.slug, book.title);

    console.log(
      `  [${book.slug}] ${book.title}: ${raw.length} chars → ${trimmed.length} trimmed → ${chunks.length} chunks`
    );
    allChunks.push(...chunks);
  }

  console.log(`\nTotal: ${allChunks.length} chunks to embed.`);

  // --- Embed in batches ---
  // Free tier: 3 RPM, 10K TPM — use small batches with delay
  const EMBED_BATCH = 100;
  const DELAY_MS = 500; // small delay between batches
  console.log(
    `\nEmbedding via Voyage AI (${EMBED_BATCH} chunks/batch, ${DELAY_MS / 1000}s delay)...`
  );
  console.log(
    `Estimated time: ~${Math.ceil((allChunks.length / EMBED_BATCH) * (DELAY_MS / 60000))} minutes`
  );
  const embeddings: number[][] = [];

  for (let i = 0; i < allChunks.length; i += EMBED_BATCH) {
    const batch = allChunks.slice(i, i + EMBED_BATCH);
    const batchTexts = batch.map((c) => c.content);

    const batchEmbeddings = await embedBatchWithRetry(batchTexts, voyageKey);
    embeddings.push(...batchEmbeddings);

    const progress = Math.min(i + EMBED_BATCH, allChunks.length);
    const pct = ((progress / allChunks.length) * 100).toFixed(1);
    console.log(`  ${progress}/${allChunks.length} (${pct}%) embedded`);

    // Delay between batches (skip after last)
    if (i + EMBED_BATCH < allChunks.length) {
      await sleep(DELAY_MS);
    }
  }

  // --- Upsert into Supabase ---
  console.log("\nUpserting into Supabase...");
  const UPSERT_BATCH = 50;

  for (let i = 0; i < allChunks.length; i += UPSERT_BATCH) {
    const batch = allChunks.slice(i, i + UPSERT_BATCH).map((chunk, idx) => ({
      book_slug: chunk.bookSlug,
      book_title: chunk.bookTitle,
      chunk_index: chunk.chunkIndex,
      content: chunk.content,
      token_count: chunk.tokenCount,
      embedding: JSON.stringify(embeddings[i + idx]),
    }));

    const { error } = await supabase.from("rulebook_chunks").upsert(batch, {
      onConflict: "book_slug,chunk_index",
    });

    if (error) {
      console.error(`  Upsert error at batch ${i}:`, error.message);
      process.exit(1);
    }

    const progress = Math.min(i + UPSERT_BATCH, allChunks.length);
    console.log(`  ${progress}/${allChunks.length} upserted`);
  }

  console.log("\nDone! All chunks embedded and stored.");
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
