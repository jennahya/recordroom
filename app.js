// app.js – collection page: load, filter, search, sort

let allRecords = [];
let extraDetailsById = {};       // id -> Discogs details (images, etc.)
let currentFilter = "all";       // 'all', 'favorites', or category slug
let currentSort = "alpha-asc";   // alpha-asc, alpha-desc, year-asc, year-desc, genre-asc
let searchQuery = "";

// Load records on page load
document.addEventListener("DOMContentLoaded", () => {
  loadRecords();
  setupFilterTabs();
  setupSearch();
  setupSort();
});

// Fetch records + extra details from JSON files
async function loadRecords() {
  try {
    const [recordsRes, detailsRes] = await Promise.all([
      fetch("./records.json"),
      fetch("./record_details.json").catch(() => null)
    ]);

    if (!recordsRes.ok) throw new Error("Failed to load records");

    allRecords = await recordsRes.json();

    // build a lookup from record_details.json if it exists
    extraDetailsById = {};
    if (detailsRes && detailsRes.ok) {
      try {
        const detailsList = await detailsRes.json();
        detailsList.forEach((d) => {
          if (d.id) {
            extraDetailsById[d.id] = d;
          }
        });
      } catch (e) {
        extraDetailsById = {};
      }
    }

    applyInitialFilterFromURL();
    updateView();
  } catch (error) {
    console.error("Error loading records:", error);
    showError();
  }
}

// Set up filter tab click handlers
function setupFilterTabs() {
  const tabs = document.querySelectorAll(".tab");

  tabs.forEach((tab) => {
    tab.addEventListener("click", (event) => {
      event.preventDefault(); // stay on the page

      tabs.forEach((t) => t.classList.remove("active"));
      tab.classList.add("active");

      currentFilter = tab.dataset.filter || "all";
      updateView();
    });
  });
}

// Apply initial filter based on URL ?tab=...
function applyInitialFilterFromURL() {
  const params = new URLSearchParams(window.location.search);
  const tabParam = params.get("tab");

  if (!tabParam) return;

  const validFilters = [
    "all",
    "favorites",
    "regular-rotation",
    "solid-picks",
    "slow-burners",
    "back-shelfers"
  ];

  if (validFilters.includes(tabParam)) {
    currentFilter = tabParam;
  } else {
    currentFilter = "all";
  }

  const tabs = document.querySelectorAll(".tab");
  tabs.forEach((tab) => {
    if (tab.dataset.filter === currentFilter) {
      tab.classList.add("active");
    } else {
      tab.classList.remove("active");
    }
  });
}

// Search setup
function setupSearch() {
  const input = document.getElementById("search-input");
  if (!input) return;

  input.addEventListener("input", () => {
    searchQuery = input.value;
    updateView();
  });
}

// Sort setup
function setupSort() {
  const select = document.getElementById("sort-select");
  if (!select) return;

  select.addEventListener("change", () => {
    currentSort = select.value;
    updateView();
  });
}

// Compute filtered + sorted records and render
function updateView() {
  const records = getFilteredAndSortedRecords();
  renderRecords(records);
}

// Filtering + search + sorting pipeline
function getFilteredAndSortedRecords() {
  let records = [...allRecords];

  // 1) filter by category / favorites (from records.json)
  if (currentFilter === "favorites") {
    records = records.filter((r) => r.favorite === true);
  } else if (currentFilter !== "all") {
    records = records.filter((r) => r.category === currentFilter);
  }

  // 2) search (use Discogs title/genre when available)
  const q = searchQuery.trim().toLowerCase();
  if (q) {
    records = records.filter((r) => {
      const extra = extraDetailsById[r.id] || {};
      const title =
        (extra.title || r.title || "").toString().toLowerCase();
      const artist =
        (r.artist || "").toString().toLowerCase();
      const genre =
        ((extra.genres && extra.genres[0]) || r.genre || "")
          .toString()
          .toLowerCase();

      return (
        title.includes(q) ||
        artist.includes(q) ||
        genre.includes(q)
      );
    });
  }

  // 3) sort (using Discogs data where possible)
  records.sort((a, b) => {
    const extraA = extraDetailsById[a.id] || {};
    const extraB = extraDetailsById[b.id] || {};

    switch (currentSort) {
      case "alpha-asc": {
        const titleA = extraA.title || a.title;
        const titleB = extraB.title || b.title;
        return compareStrings(titleA, titleB);
      }
      case "alpha-desc": {
        const titleA = extraA.title || a.title;
        const titleB = extraB.title || b.title;
        return compareStrings(titleB, titleA);
      }
      case "year-asc": {
        const yearA = extraA.year ?? a.year;
        const yearB = extraB.year ?? b.year;
        return compareNumbers(yearA, yearB);
      }
      case "year-desc": {
        const yearA = extraA.year ?? a.year;
        const yearB = extraB.year ?? b.year;
        return compareNumbers(yearB, yearA);
      }
      case "genre-asc": {
        const genreA =
          (extraA.genres && extraA.genres[0]) || a.genre;
        const genreB =
          (extraB.genres && extraB.genres[0]) || b.genre;
        return compareStrings(genreA, genreB);
      }
      default:
        return 0;
    }
  });

  return records;
}

// Safe string compare
function compareStrings(a, b) {
  const aStr = (a || "").toString().toLowerCase();
  const bStr = (b || "").toString().toLowerCase();
  if (aStr < bStr) return -1;
  if (aStr > bStr) return 1;
  return 0;
}

// Safe number compare (nulls go to the end)
function compareNumbers(a, b) {
  if (a == null && b == null) return 0;
  if (a == null) return 1;
  if (b == null) return -1;
  return a - b;
}

// Render record cards to the grid
function renderRecords(records) {
  const grid = document.getElementById("record-grid");
  if (!grid) return;

  if (records.length === 0) {
    grid.innerHTML = `
      <div class="empty-state">
        <p>No records found. Try a different filter or search.</p>
      </div>
    `;
    return;
  }

  grid.innerHTML = records
    .map((record) => {
      const extra = extraDetailsById[record.id] || {};

      // Prefer Discogs cover first, then your local one, then a default
      const coverFromDiscogs = extra.images?.[0]?.uri || "";
      const coverSrc =
        coverFromDiscogs || record.cover || "album covers/default.jpg";

      // Prefer Discogs title, year, genre when available
      const displayTitle = extra.title || record.title;
      const displayArtist = record.artist || ""; // artist lives in records.json
      const displayYear =
        extra.year ?? record.year ?? "";
      const displayGenre =
        (extra.genres && extra.genres[0]) || record.genre || "";

      return `
        <a href="record.html?id=${record.id}" class="record-card">
          <img 
            src="${coverSrc}" 
            alt="${displayTitle} by ${displayArtist} album cover"
            class="record-cover"
          >
          <h2>${displayTitle}</h2>
          <p class="artist">${displayArtist}</p>
          <div class="meta">
            <span class="year">${displayYear}</span>
            <span class="genre-tag">${displayGenre}</span>
            ${record.favorite ? '<span class="favorite-badge">★</span>' : ""}
          </div>
        </a>
      `;
    })
    .join("");
}

// Show error message if records fail to load
function showError() {
  const grid = document.getElementById("record-grid");
  if (!grid) return;

  grid.innerHTML = `
    <div class="empty-state">
      <p>Sorry, couldn't load the records. Please try again later.</p>
    </div>
  `;
}



