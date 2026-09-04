document.addEventListener("DOMContentLoaded", async () => {
  const grid = document.getElementById("issue-grid");
  const specialsGrid = document.getElementById("specials-grid");
  const searchInput = document.getElementById("search-input");
  const emptyState = document.getElementById("empty-state");
  const specialsEmptyState = document.getElementById("specials-empty-state");
  const countDisplay = document.getElementById("issue-count-display");
  const yearFilterSelect = document.getElementById("year-filter");
  const sortFilterSelect = document.getElementById("sort-filter");
  const backToTopBtn = document.getElementById("back-to-top");
  const clearFiltersBtns = document.querySelectorAll(".clear-filters-btn");

  const loadMoreBtn = document.getElementById("load-more-btn");
  const loadMoreContainer = document.getElementById("load-more-container");
  const specialsLoadMoreBtn = document.getElementById("specials-load-more-btn");
  const specialsLoadMoreContainer = document.getElementById(
    "specials-load-more-container",
  );

  // Progress Bar Elements & Variables
  const optimisedFill = document.getElementById("optimised-progress-fill");
  const optimisedText = document.getElementById("optimised-progress-text");
  const scannedFill = document.getElementById("scanned-progress-fill");
  const scannedText = document.getElementById("scanned-progress-text");
  const pagesFill = document.getElementById("pages-progress-fill");
  const pagesText = document.getElementById("pages-progress-text");

  const totalIssuesInRun = 223;
  const totalPagesInRun = 7512;
  const manualScannedPages = 6272;
  const manualScannedIssues = 184;
  const lastUpdatedDate = "September 4, 2026";

  const highBase =
    "https://archive.org/download/sonic-the-comic-high-resolution-scans";
  const stdBase =
    "https://archive.org/download/sonic-the-comic-standard-resolution-scans";

  let allIssues = [];

  // State for filtering and pagination
  let currentSearch = "";
  let currentYearFilter = "all";
  let currentSort = "asc";
  let currentPageMain = 1;
  let currentPageSpecials = 1;
  const itemsPerPage = 48;

  const debounce = (func, delay) => {
    let timeoutId;
    return (...args) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => func(...args), delay);
    };
  };

  const lastUpdatedEl = document.getElementById("last-updated-text");
  if (lastUpdatedEl) {
    lastUpdatedEl.textContent = `Last updated: ${lastUpdatedDate}`;
  }

  const generateCardHTML = (issue) => {
    const isSpecial = issue.type === "special";
    const displayTitle = isSpecial
      ? issue.title
      : `Issue ${String(issue.id).padStart(3, "0")}`;
    const highUrl = `${highBase}/${encodeURIComponent(issue.high)}`;
    const stdUrl = `${stdBase}/${encodeURIComponent(issue.standard)}`;
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
      ? `<a href="${issue.master}" aria-label="Download ${displayTitle} Raw 600 DPI Master" target="_blank" rel="noopener noreferrer" class="btn-icon raw"><span class="icon-link"></span> RAW</a>`
      : "";

    return `
      <article class="card issue-card">
        <div class="card-left">
          <img src="${issue.image}" alt="Cover of ${displayTitle}" class="card-thumbnail" width="240" height="310" loading="lazy">
        </div>
        <div class="card-right">
          <div class="card-header">
            <h3>${displayTitle}</h3>
            ${formattedDate ? `<p class="issue-date">${formattedDate}</p>` : ""}
          </div>
          <div class="btn-icon-group">
            <a href="${stdUrl}" aria-label="Download ${displayTitle} Standard Resolution" target="_blank" rel="noopener noreferrer" class="btn-icon sd"><span class="icon-download"></span> SD</a>
            <a href="${highUrl}" aria-label="Download ${displayTitle} High Resolution" target="_blank" rel="noopener noreferrer" class="btn-icon hd"><span class="icon-download"></span> HD</a>
            ${masterHtml}
          </div>
        </div>
      </article>
    `;
  };

  const applyFiltersAndRender = () => {
    // 1. Filter
    const searchStripped = currentSearch.replace(/^0+/, "");

    let filteredMain = allIssues.filter((issue) => {
      if (issue.type === "special") return false;
      const issueYear = issue.date ? issue.date.substring(0, 4) : "Unknown";
      const matchesYear =
        currentYearFilter === "all" || issueYear === currentYearFilter;
      const searchKey = String(issue.id).padStart(3, "0");
      const keyStripped = searchKey.replace(/^0+/, "");
      const matchesSearch =
        searchKey.includes(currentSearch) || keyStripped === searchStripped;
      return matchesYear && matchesSearch;
    });

    let filteredSpecials = allIssues.filter((issue) => {
      if (issue.type !== "special") return false;
      const issueYear = issue.date ? issue.date.substring(0, 4) : "Unknown";
      const matchesYear =
        currentYearFilter === "all" || issueYear === currentYearFilter;
      const searchKey = issue.title.toLowerCase();
      const matchesSearch = searchKey.includes(currentSearch);
      return matchesYear && matchesSearch;
    });

    // 2. Sort
    const sortMultiplier = currentSort === "asc" ? 1 : -1;

    filteredMain.sort((a, b) => {
      return (a.id - b.id) * sortMultiplier;
    });

    // For specials, we sort by date or title
    filteredSpecials.sort((a, b) => {
      const dateA = a.date ? new Date(a.date).getTime() : 0;
      const dateB = b.date ? new Date(b.date).getTime() : 0;
      if (dateA !== dateB) {
        return (dateA - dateB) * sortMultiplier;
      }
      return a.title.localeCompare(b.title) * sortMultiplier;
    });

    // 3. Render Main Grid
    const mainToShow = filteredMain.slice(0, currentPageMain * itemsPerPage);
    grid.innerHTML = mainToShow.map(generateCardHTML).join("");

    if (filteredMain.length === 0) {
      emptyState.style.display = "block";
      grid.style.display = "none";
      loadMoreContainer.style.display = "none";
    } else {
      emptyState.style.display = "none";
      grid.style.display = "grid";
      if (mainToShow.length < filteredMain.length) {
        loadMoreContainer.style.display = "block";
      } else {
        loadMoreContainer.style.display = "none";
      }
    }

    // 4. Render Specials Grid
    if (specialsGrid) {
      const specialsToShow = filteredSpecials.slice(
        0,
        currentPageSpecials * itemsPerPage,
      );
      specialsGrid.innerHTML = specialsToShow.map(generateCardHTML).join("");

      if (filteredSpecials.length === 0) {
        specialsEmptyState.style.display = "block";
        specialsGrid.style.display = "none";
        specialsLoadMoreContainer.style.display = "none";
      } else {
        specialsEmptyState.style.display = "none";
        specialsGrid.style.display = "grid";
        if (specialsToShow.length < filteredSpecials.length) {
          specialsLoadMoreContainer.style.display = "block";
        } else {
          specialsLoadMoreContainer.style.display = "none";
        }
      }
    }
  };

  const clearAllFilters = () => {
    if (searchInput) searchInput.value = "";
    currentSearch = "";
    currentYearFilter = "all";
    currentSort = "asc";
    if (yearFilterSelect) yearFilterSelect.value = "all";
    if (sortFilterSelect) sortFilterSelect.value = "asc";
    currentPageMain = 1;
    currentPageSpecials = 1;
    applyFiltersAndRender();
  };

  clearFiltersBtns.forEach((btn) =>
    btn.addEventListener("click", clearAllFilters),
  );

  if (loadMoreBtn) {
    loadMoreBtn.addEventListener("click", () => {
      currentPageMain++;
      applyFiltersAndRender();
    });
  }

  if (specialsLoadMoreBtn) {
    specialsLoadMoreBtn.addEventListener("click", () => {
      currentPageSpecials++;
      applyFiltersAndRender();
    });
  }

  if (yearFilterSelect) {
    yearFilterSelect.addEventListener("change", (e) => {
      currentYearFilter = e.target.value;
      currentPageMain = 1;
      currentPageSpecials = 1;
      applyFiltersAndRender();
    });
  }

  if (sortFilterSelect) {
    sortFilterSelect.addEventListener("change", (e) => {
      currentSort = e.target.value;
      currentPageMain = 1;
      currentPageSpecials = 1;
      applyFiltersAndRender();
    });
  }

  const handleSearch = debounce((e) => {
    currentSearch = e.target.value.trim().toLowerCase();
    currentPageMain = 1;
    currentPageSpecials = 1;
    applyFiltersAndRender();
  }, 250);

  if (searchInput) {
    searchInput.addEventListener("input", handleSearch);
  }

  window.addEventListener("scroll", () => {
    if (window.scrollY > 600) {
      backToTopBtn.classList.add("visible");
    } else {
      backToTopBtn.classList.remove("visible");
    }
  });

  if (backToTopBtn) {
    backToTopBtn.addEventListener("click", () => {
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  }

  try {
    const response = await fetch("issues.json");
    if (!response.ok) throw new Error("Failed to load issues data.");
    allIssues = await response.json();

    const mainIssues = allIssues.filter((issue) => issue.type !== "special");
    if (countDisplay) {
      countDisplay.textContent = `There are currently ${mainIssues.length} optimised mainline issues available for download from the Internet Archive.`;
    }

    if (scannedFill && scannedText) {
      const scannedPercentage = (
        (manualScannedIssues / totalIssuesInRun) *
        100
      ).toFixed(1);
      scannedText.textContent = `${manualScannedIssues} out of ${totalIssuesInRun} issues (${scannedPercentage}%)`;
      setTimeout(
        () => (scannedFill.style.width = `${scannedPercentage}%`),
        150,
      );
    }

    if (pagesFill && pagesText) {
      const pagesPercentage = (
        (manualScannedPages / totalPagesInRun) *
        100
      ).toFixed(1);
      pagesText.textContent = `${manualScannedPages} out of ${totalPagesInRun} pages (${pagesPercentage}%)`;
      setTimeout(() => (pagesFill.style.width = `${pagesPercentage}%`), 250);
    }

    if (optimisedFill && optimisedText) {
      const optPercentage = (
        (mainIssues.length / totalIssuesInRun) *
        100
      ).toFixed(1);
      optimisedText.textContent = `${mainIssues.length} out of ${totalIssuesInRun} issues (${optPercentage}%)`;
      setTimeout(() => (optimisedFill.style.width = `${optPercentage}%`), 350);
    }

    // Populate Year Filter Select
    const availableYears = [
      ...new Set(
        allIssues
          .map((issue) => (issue.date ? issue.date.substring(0, 4) : null))
          .filter(Boolean),
      ),
    ].sort();

    if (yearFilterSelect) {
      let optionsHtml = `<option value="all">All Years</option>`;
      availableYears.forEach((year) => {
        optionsHtml += `<option value="${year}">${year}</option>`;
      });
      yearFilterSelect.innerHTML = optionsHtml;
    }

    // Initial render
    applyFiltersAndRender();
  } catch (error) {
    console.error(error);
    if (countDisplay) countDisplay.textContent = "Error loading issue data.";
    if (scannedText) scannedText.textContent = "Error loading progress.";
    if (optimisedText) optimisedText.textContent = "Error loading progress.";
    if (grid)
      grid.innerHTML = `<p style="color: var(--text-muted); grid-column: 1 / -1; text-align: center;">Error loading archive files. Please ensure you are running a local server.</p>`;
  }
});
