/**
 * Creates the private bucket that camp paperwork lives in.
 *
 * Idempotent: run it as often as you like. If the bucket already exists it is
 * re-checked and, if someone made it public, forced back to private — that is
 * the failure mode worth guarding, since these objects are medical records.
 *
 *   npm run ops:storage
 *
 * Needs NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in the
 * environment (the service key never reaches the browser).
 */

import { createClient } from "@supabase/supabase-js";

const BUCKET = "camp-documents";
const MAX_FILE_BYTES = 12 * 1024 * 1024;
const ALLOWED_MIME = ["application/pdf", "image/jpeg", "image/png"];

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    console.error("Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY first.");
    process.exit(1);
  }

  const supabase = createClient(url, serviceKey, { auth: { persistSession: false } });

  const { data: buckets, error: listError } = await supabase.storage.listBuckets();
  if (listError) {
    console.error(`Could not list buckets: ${listError.message}`);
    process.exit(1);
  }

  const existing = buckets?.find((b) => b.name === BUCKET);

  if (!existing) {
    const { error } = await supabase.storage.createBucket(BUCKET, {
      public: false,
      fileSizeLimit: MAX_FILE_BYTES,
      allowedMimeTypes: ALLOWED_MIME,
    });
    if (error) {
      console.error(`Could not create "${BUCKET}": ${error.message}`);
      process.exit(1);
    }
    console.log(`Created private bucket "${BUCKET}".`);
  } else {
    const { error } = await supabase.storage.updateBucket(BUCKET, {
      public: false,
      fileSizeLimit: MAX_FILE_BYTES,
      allowedMimeTypes: ALLOWED_MIME,
    });
    if (error) {
      console.error(`Could not update "${BUCKET}": ${error.message}`);
      process.exit(1);
    }
    console.log(
      existing.public
        ? `"${BUCKET}" was PUBLIC and has been set back to private.`
        : `"${BUCKET}" already exists and is private.`,
    );
  }

  console.log("Documents are read only through short-lived signed URLs minted server-side.");
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : String(err));
  process.exit(1);
});
