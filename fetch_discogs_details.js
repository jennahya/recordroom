// fetch_discogs_details.js
// Run with: node fetch_discogs_details.js
// Reads records.json, looks up each album on Discogs,
// and writes/updates record_details.json with tracklist, notes, credits, images, etc.

const fs = require("fs").promises;

const DISCOGS_TOKEN = "PASTE_YOUR_TOKEN_HERE"; // <-- your token
const USER_AGENT = "JennaRecordRoom/1.0 +https://example.com";

// delay between requests (ms) to avoid 429
const REQUEST_DELAY = 2000;

async function main() {
  // 1. Load your base records.json
  const raw = await fs.readFile("./records.json", "utf8");
  const records = JSON.parse(raw);

  // 2. Load existing details if present (so you can re-run)
  let existingDetails = [];
  try {
    const existingRaw = await fs.readFile("./record_details.json", "utf8");
    existingDetails = JSON.parse(existingRaw);
  } catch {
    existingDetails = [];
  }

  const detailById = new Map();
  for (const d of existingDetails) {
    if (d.id) detailById.set(d.id, d);
  }

  console.log(`Loaded ${records.length} records from records.json`);
  console.log(`Loaded ${existingDetails.length} existing detail entries\n`);

  const updatedDetails = [...existingDetails];

  for (const record of records) {
    const { artist, title, id, discogs_id } = record;

    if (!artist || !title || !id) {
      console.log(`Skipping a record with missing id/artist/title`);
      continue;
    }

    // Skip if already in record_details.json
    if (detailById.has(id)) {
      console.log(`Already have details for ${artist} – ${title} (id: ${id}), skipping.`);
      continue;
    }

    // --------------------------------------------
    // ✅ NEW FEATURE: Use manual discogs_id if provided
    // --------------------------------------------
    if (discogs_id) {
      console.log(`Using manual Discogs ID ${discogs_id} for ${artist} – ${title}`);

      try {
        const full = await fetchRelease(discogs_id);

        updatedDetails.push({
          id,
          discogs_id,
          title: full.title,
          year: full.year,
          genres: full.genres || [],
          styles: full.styles || [],
          tracklist: full.tracklist || [],
          notes: full.notes || "",
          credits: full.extraartists || [],
          companies: full.companies || [],
          images: full.images || []
        });
      } catch (err) {
        console.error(`  ⚠️ Error fetching manual ID ${discogs_id}:`, err.message);
      }

      await wait(REQUEST_DELAY);
      continue; // skip search
    }

    // --------------------------------------------
    // Otherwise perform a Discogs search
    // --------------------------------------------
    console.log(`Searching Discogs for: ${artist} – ${title}`);

    try {
      const releaseId = await searchRelease(artist, title);
      if (!releaseId) {
        console.log(`  ❌ No match found, skipping for now.`);
      } else {
        console.log(`  ✅ Found release ID: ${releaseId}`);
        const full = await fetchRelease(releaseId);

        updatedDetails.push({
          id,
          discogs_id: releaseId,
          title: full.title,
          year: full.year,
          genres: full.genres || [],
          styles: full.styles || [],
          tracklist: full.tracklist || [],
          notes: full.notes || "",
          credits: full.extraartists || [],
          companies: full.companies || [],
          images: full.images || []
        });
      }
    } catch (err) {
      console.error(`  ⚠️ Error for ${artist} – ${title}:`, err.message);
      if (String(err.message).includes("429")) {
        console.log("Hit Discogs rate limit (429). Stop this run and try again later.");
        break;
      }
    }

    await wait(REQUEST_DELAY);
  }

  await fs.writeFile(
    "./record_details.json",
    JSON.stringify(updatedDetails, null, 2)
  );
  console.log("\n✨ Done! Wrote record_details.json");
}

async function searchRelease(artist, title) {
  const params = new URLSearchParams({
    q: `${artist} ${title}`,
    type: "release",
    per_page: "1",
    page: "1",
    token: DISCOGS_TOKEN
  });

  const url = `https://api.discogs.com/database/search?${params.toString()}`;

  const res = await fetch(url, {
    headers: { "User-Agent": USER_AGENT }
  });

  if (!res.ok) {
    throw new Error(`Search failed: ${res.status} ${res.statusText}`);
  }

  const data = await res.json();
  const results = data.results || [];
  if (results.length === 0) return null;
  return results[0].id;
}

async function fetchRelease(id) {
  const url = `https://api.discogs.com/releases/${id}?token=${DISCOGS_TOKEN}`;
  const res = await fetch(url, {
    headers: { "User-Agent": USER_AGENT }
  });

  if (!res.ok) {
    throw new Error(`Release fetch failed: ${res.status} ${res.statusText}`);
  }

  return res.json();
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

main().catch((err) => {
  console.error("Fatal error:", err);
});




