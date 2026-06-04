document.addEventListener("DOMContentLoaded", async () => {
  const grid = document.getElementById("issue-grid");
  const searchInput = document.getElementById("search-input");
  const emptyState = document.getElementById("empty-state");
  const countDisplay = document.getElementById("issue-count-display");

  const highBase =
    "https://archive.org/download/sonic-the-comic-high-resolution-scans";
  const stdBase =
    "https://archive.org/download/sonic-the-comic-standard-resolution-scans";

  function getBatchRangeString(id) {
    const size = 30;
    const start = Math.floor((id - 1) / size) * size + 1;
    const end = start + size - 1;
    return `${String(start).padStart(3, "0")} to ${String(end).padStart(3, "0")}`;
  }

  try {
    const response = await fetch("issues.json");
    if (!response.ok) throw new Error("Failed to load issues data.");
    const issues = await response.json();

    countDisplay.textContent = `Currently hosting ${issues.length} optimised issues.`;

    issues.forEach((issue) => {
      const issueDisplayNum = String(issue.id).padStart(3, "0");
      const rangeStr = getBatchRangeString(issue.id);
      const encodedRange = encodeURIComponent(rangeStr);

      const highUrl = `${highBase}/Sonic%20The%20Comic%20-%20High%20Resolution%20Scans%20-%20${encodedRange}.zip/Sonic%20The%20Comic%20-%20High%20Resolution%20Scans%2F${encodeURIComponent(issue.high)}`;
      const stdUrl = `${stdBase}/Sonic%20The%20Comic%20-%20Standard%20Resolution%20Scans%20-%20${encodedRange}.zip/Sonic%20The%20Comic%20-%20Standard%20Resolution%20Scans%2F${encodeURIComponent(issue.standard)}`;

      const article = document.createElement("article");
      article.className = "card issue-card";
      article.dataset.issueNumber = issueDisplayNum;

      article.innerHTML = `
                <div class="card-left">
                    <img src="${issue.image}" alt="Cover of STC Issue ${issueDisplayNum}" class="card-thumbnail" loading="lazy">
                </div>
                <div class="card-right">
                    <div class="card-header">
                        <h3>Issue ${issueDisplayNum}</h3>
                        <p>Optimised .cbz</p>
                    </div>
                    <div class="button-group">
                        <a href="${stdUrl}" aria-label="Download Issue ${issueDisplayNum} Standard Resolution" target="_blank" rel="noopener noreferrer" class="btn btn-primary">
                            Download Standard
                        </a>
                        <a href="${highUrl}" aria-label="Download Issue ${issueDisplayNum} High Resolution" target="_blank" rel="noopener noreferrer" class="btn btn-secondary">
                            Download High
                        </a>
                    </div>
                </div>
            `;
      grid.appendChild(article);
    });

    searchInput.addEventListener("input", (e) => {
      const searchTerm = e.target.value.trim();
      const allCards = document.querySelectorAll(".issue-card");
      let visibleCount = 0;

      allCards.forEach((card) => {
        const issueNum = card.dataset.issueNumber;
        const searchStripped = searchTerm.replace(/^0+/, "");
        const issueStripped = issueNum.replace(/^0+/, "");

        if (issueNum.includes(searchTerm) || issueStripped === searchStripped) {
          card.style.display = "flex";
          visibleCount++;
        } else {
          card.style.display = "none";
        }
      });

      if (visibleCount === 0) {
        emptyState.style.display = "block";
        grid.style.display = "none";
      } else {
        emptyState.style.display = "none";
        grid.style.display = "grid";
      }
    });
  } catch (error) {
    console.error(error);
    countDisplay.textContent = "Error loading issue data.";
    grid.innerHTML = `<p style="color: var(--text-muted); grid-column: 1 / -1; text-align: center;">Error loading archive files. Please ensure you are running a local server.</p>`;
  }
});
