/**
 * Debug helper: dump all non-custom monsters from the DB as JSON for
 * analysis during the backfill override-mapping work. Not part of the
 * regular pipeline, safe to delete once the backfill override map is stable.
 */
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import path from "path";
import { writeFileSync } from "fs";

dotenv.config({ path: path.resolve(__dirname, "..", ".env.local") });

async function main() {
  const sb = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
  const { data, error } = await sb
    .from("monsters")
    .select("id,name,name_en")
    .eq("is_custom", false)
    .order("name");
  if (error) {
    console.error(error);
    process.exit(1);
  }
  const out = path.resolve(
    __dirname,
    "..",
    "ressources",
    "compendium-snapshot",
    "existing-monsters.json"
  );
  writeFileSync(out, JSON.stringify(data, null, 2), "utf-8");
  console.log(`Wrote ${data?.length ?? 0} monsters to ${out}`);
}

const isCli = typeof require !== "undefined" && require.main === module;
if (isCli) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
