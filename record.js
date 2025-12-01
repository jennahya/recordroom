
document.addEventListener("DOMContentLoaded", () => {
    loadRecordDetail();
  });
  
  async function loadRecordDetail() {
    const params = new URLSearchParams(window.location.search);
    const id = params.get("id");
  
    const container = document.getElementById("record-detail");
    if (!id || !container) {
      if (container) {
        container.textContent = "No record selected.";
      }
      return;
    }
  
    try {

      const [recordsRes, detailsRes] = await Promise.all([
        fetch("./records.json"),
        fetch("./record_details.json")
      ]);
  
      const records = await recordsRes.json();
      let details = [];
      try {
        details = await detailsRes.json();
      } catch (e) {

        details = [];
      }
  
      const base = records.find((r) => r.id === id);
      const extra = details.find((d) => d.id === id);
  
      if (!base) {
        container.textContent = "Record not found.";
        return;
      }
  
      renderRecord(container, base, extra);
    } catch (err) {
      console.error("Error loading record detail:", err);
      if (container) {
        container.textContent = "Sorry, something went wrong loading this record.";
      }
    }
  }
  

  function formatRole(role) {
    if (!role) return "";
    return role
      .split(",")
      .map((part) => {
        const trimmed = part.trim();
        if (!trimmed) return "";
        const lower = trimmed.toLowerCase();
        return lower.charAt(0).toUpperCase() + lower.slice(1);
      })
      .filter(Boolean)
      .join(" · ");
  }
  
  function renderRecord(container, base, extra) {
    const year = base.year ?? extra?.year ?? "";
    const genre = base.genre ?? (extra?.genres ? extra.genres[0] : "") ?? "";
  

    const coverFromDiscogs = extra?.images?.[0]?.uri || "";
    const coverSrc = coverFromDiscogs || base.cover || "album covers/default.jpg";
  
    const tracklistHtml = extra?.tracklist?.length
      ? `
        <section class="detail-section">
          <h3>Tracklist</h3>
          <table class="tracklist">
            <tbody>
              ${extra.tracklist
                .map((t) => {
                  const pos = t.position || "";
                  const title = t.title || "";
                  const duration = t.duration || "";
                  return `
                    <tr>
                      <td class="track-pos">${pos}</td>
                      <td class="track-title">${title}</td>
                      <td class="track-time">${duration}</td>
                    </tr>
                  `;
                })
                .join("")}
            </tbody>
          </table>
        </section>
      `
      : "";
  
    const notesHtml = extra?.notes
      ? `
        <section class="detail-section">
          <h3>Notes</h3>
          <p>${escapeHtml(extra.notes).replace(/\n/g, "<br>")}</p>
        </section>
      `
      : "";
  
    const creditsHtml = extra?.credits?.length
      ? `
        <section class="detail-section">
          <h3>Credits</h3>
          <ul class="credits-list">
            ${extra.credits
              .map((c) => {
                const name = c.name || "";
                const prettyRole = formatRole(c.role || "");
                return `
                  <li>
                    <span class="credit-name">${name}</span>
                    ${prettyRole ? `<span class="credit-role">${prettyRole}</span>` : ""}
                  </li>
                `;
              })
              .join("")}
          </ul>
        </section>
      `
      : "";
  
    container.innerHTML = `
      <img
        src="${coverSrc}"
        alt="${base.title} by ${base.artist} album cover"
        class="cover"
      />
  
      <div class="detail-info">
        <h2>${base.title}</h2>
        <p class="detail-artist">${base.artist}</p>
  
        <div class="detail-meta">
          ${year ? `<span>${year}</span>` : ""}
          ${genre ? `<span>${genre}</span>` : ""}
          ${base.favorite ? `<span>★ favorite</span>` : ""}
        </div>
  
        ${tracklistHtml}
        ${notesHtml}
        ${creditsHtml}
      </div>
    `;
  }
  
  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }
  