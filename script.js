document.addEventListener("DOMContentLoaded", async () => {
  const grid = document.getElementById("issue-grid");
  const specialsGrid = document.getElementById("specials-grid");
  const searchInput = document.getElementById("search-input");
  const emptyState = document.getElementById("empty-state");
  const specialsEmptyState = document.getElementById("specials-empty-state");
  const countDisplay = document.getElementById("issue-count-display");
  const yearFiltersContainer = document.getElementById("year-filters");
  const backToTopBtn = document.getElementById("back-to-top");
  const clearFiltersBtns = document.querySelectorAll(".clear-filters-btn");

  // Progress Bar Elements & Variables
  const optimisedFill = document.getElementById("optimised-progress-fill");
  const optimisedText = document.getElementById("optimised-progress-text");

  const scannedFill = document.getElementById("scanned-progress-fill");
  const scannedText = document.getElementById("scanned-progress-text");

  const totalIssuesInRun = 223;

  // MANUALLY UPDATE THESE VALUES WHEN NEW RAW 600 DPI SCANS ARE COMPLETED
  const manualScannedIssues = 75;
  const lastUpdatedDate = "June 24, 2026";

  // State for filtering
  let currentSearch = "";
  let currentYearFilter = "all";

  // Debounce utility to prevent UI stutter on fast typing
  const debounce = (func, delay) => {
    let timeoutId;
    return (...args) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => func(...args), delay);
    };
  };

  // Push the date to the HTML
  const lastUpdatedEl = document.getElementById("last-updated-text");
  if (lastUpdatedEl) {
    lastUpdatedEl.textContent = `Last updated: ${lastUpdatedDate}`;
  }

  const highBase =
    "https://archive.org/download/sonic-the-comic-high-resolution-scans";
  const stdBase =
    "https://archive.org/download/sonic-the-comic-standard-resolution-scans";

  // Helper function to apply both search and year filters
  const applyFilters = () => {
    const allCards = document.querySelectorAll(".issue-card");
    let mainVisibleCount = 0;
    let specialsVisibleCount = 0;

    allCards.forEach((card) => {
      const searchKey = card.dataset.searchKey;
      const cardYear = card.dataset.year;

      const searchStripped = currentSearch.replace(/^0+/, "");
      const keyStripped = searchKey.replace(/^0+/, "");

      const matchesSearch =
        searchKey.includes(currentSearch) || keyStripped === searchStripped;
      const matchesYear =
        currentYearFilter === "all" || cardYear === currentYearFilter;

      if (matchesSearch && matchesYear) {
        card.style.display = "flex";
        if (card.parentElement.id === "specials-grid") {
          specialsVisibleCount++;
        } else {
          mainVisibleCount++;
        }
      } else {
        card.style.display = "none";
      }
    });

    // Handle main grid empty state
    if (mainVisibleCount === 0) {
      emptyState.style.display = "block";
      grid.style.display = "none";
    } else {
      emptyState.style.display = "none";
      grid.style.display = "grid";
    }

    // Handle specials grid empty state
    if (specialsGrid) {
      if (specialsVisibleCount === 0) {
        specialsEmptyState.style.display = "block";
        specialsGrid.style.display = "none";
      } else {
        specialsEmptyState.style.display = "none";
        specialsGrid.style.display = "grid";
      }
    }
  };

  // Handle completely clearing filters and search
  const clearAllFilters = () => {
    searchInput.value = "";
    currentSearch = "";
    currentYearFilter = "all";

    // Reset filter buttons UI
    const filterButtons = document.querySelectorAll(".btn-filter");
    filterButtons.forEach((b) => {
      if (b.dataset.year === "all") {
        b.classList.add("active");
        b.setAttribute("aria-pressed", "true");
      } else {
        b.classList.remove("active");
        b.setAttribute("aria-pressed", "false");
      }
    });

    applyFilters();
  };

  // Attach listeners to clear buttons
  clearFiltersBtns.forEach((btn) =>
    btn.addEventListener("click", clearAllFilters),
  );

  // Back to Top functionality
  window.addEventListener("scroll", () => {
    if (window.scrollY > 600) {
      backToTopBtn.classList.add("visible");
    } else {
      backToTopBtn.classList.remove("visible");
    }
  });

  backToTopBtn.addEventListener("click", () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  });

  try {
    const response = await fetch("issues.json");
    if (!response.ok) throw new Error("Failed to load issues data.");
    const issues = await response.json();

    // Setup Progress Bars
    const mainIssues = issues.filter((issue) => issue.type !== "special");
    countDisplay.textContent = `There are currently ${mainIssues.length} optimised mainline issues available for download from the Internet Archive.`;

    if (scannedFill && scannedText) {
      const scannedPercentage = (
        (manualScannedIssues / totalIssuesInRun) *
        100
      ).toFixed(1);
      scannedText.textContent = `${manualScannedIssues} out of ${totalIssuesInRun} issues (${scannedPercentage}%)`;
      setTimeout(() => {
        scannedFill.style.width = `${scannedPercentage}%`;
      }, 150);
    }

    if (optimisedFill && optimisedText) {
      const optPercentage = (
        (mainIssues.length / totalIssuesInRun) *
        100
      ).toFixed(1);
      optimisedText.textContent = `${mainIssues.length} out of ${totalIssuesInRun} issues (${optPercentage}%)`;
      setTimeout(() => {
        optimisedFill.style.width = `${optPercentage}%`;
      }, 350);
    }

    // Extract unique years for the filter UI
    const availableYears = [
      ...new Set(
        issues
          .map((issue) => {
            return issue.date ? issue.date.substring(0, 4) : null;
          })
          .filter(Boolean),
      ),
    ].sort();

    // Generate Year Filter Buttons with ARIA states
    let filtersHtml = `<button class="btn-filter active" data-year="all" aria-pressed="true">All Years</button>`;
    availableYears.forEach((year) => {
      filtersHtml += `<button class="btn-filter" data-year="${year}" aria-pressed="false">${year}</button>`;
    });
    yearFiltersContainer.innerHTML = filtersHtml;

    // Attach listener to Year Filter Buttons
    const filterButtons = document.querySelectorAll(".btn-filter");
    filterButtons.forEach((btn) => {
      btn.addEventListener("click", (e) => {
        // Update active class and ARIA state for accessibility
        filterButtons.forEach((b) => {
          b.classList.remove("active");
          b.setAttribute("aria-pressed", "false");
        });
        e.target.classList.add("active");
        e.target.setAttribute("aria-pressed", "true");

        // Update state and filter
        currentYearFilter = e.target.dataset.year;
        applyFilters();
      });
    });

    // Populate Grids
    issues.forEach((issue) => {
      const isSpecial = issue.type === "special";
      const displayTitle = isSpecial
        ? issue.title
        : `Issue ${String(issue.id).padStart(3, "0")}`;
      const searchKey = isSpecial
        ? issue.title.toLowerCase()
        : String(issue.id).padStart(3, "0");

      const highUrl = `${highBase}/${encodeURIComponent(issue.high)}`;
      const stdUrl = `${stdBase}/${encodeURIComponent(issue.standard)}`;

      const issueYear = issue.date ? issue.date.substring(0, 4) : "Unknown";

      // Format Date string (UK format: e.g. 29 May 1993)
      let formattedDate = "";
      if (issue.date) {
        const dateObj = new Date(issue.date);
        formattedDate = dateObj.toLocaleDateString("en-GB", {
          day: "numeric",
          month: "long",
          year: "numeric",
        });
      }

      const masterHtml = issue.master
        ? `<a href="${issue.master}" aria-label="Download ${displayTitle} Raw 600 DPI Master" target="_blank" rel="noopener noreferrer" class="btn btn-secondary" style="border-style: dashed;">600 DPI Master</a>`
        : "";

      const article = document.createElement("article");
      article.className = "card issue-card";
      article.dataset.searchKey = searchKey;
      article.dataset.year = issueYear;

      // Notice explicit width and height dimensions added directly to the image tag to prevent CLS
      article.innerHTML = `
                <div class="card-left">
                    <img src="${issue.image}" alt="Cover of ${displayTitle}" class="card-thumbnail" width="240" height="310" loading="lazy">
                </div>
                <div class="card-right">
                    <div class="card-header">
                        <h3>${displayTitle}</h3>
                        ${formattedDate ? `<p class="issue-date">${formattedDate}</p>` : ""}
                    </div>
                    <div class="button-group">
                        <a href="${stdUrl}" aria-label="Download ${displayTitle} Standard Resolution" target="_blank" rel="noopener noreferrer" class="btn btn-primary">
                            Download Standard
                        </a>
                        <a href="${highUrl}" aria-label="Download ${displayTitle} High Resolution" target="_blank" rel="noopener noreferrer" class="btn btn-secondary">
                            Download High
                        </a>
                        ${masterHtml}
                    </div>
                </div>
            `;

      if (isSpecial) {
        if (specialsGrid) specialsGrid.appendChild(article);
      } else {
        grid.appendChild(article);
      }
    });

    // Attach debounced listener to Search Input
    const handleSearch = debounce((e) => {
      currentSearch = e.target.value.trim().toLowerCase();
      applyFilters();
    }, 250);

    searchInput.addEventListener("input", handleSearch);
  } catch (error) {
    console.error(error);
    countDisplay.textContent = "Error loading issue data.";
    if (scannedText) scannedText.textContent = "Error loading progress.";
    if (optimisedText) optimisedText.textContent = "Error loading progress.";
    grid.innerHTML = `<p style="color: var(--text-muted); grid-column: 1 / -1; text-align: center;">Error loading archive files. Please ensure you are running a local server.</p>`;
  }
});
