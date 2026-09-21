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

  // Progress Bar Elements & Variables
  const optimisedFill = document.getElementById("optimised-progress-fill");
  const optimisedText = document.getElementById("optimised-progress-text");
  const scannedFill = document.getElementById("scanned-progress-fill");
  const scannedText = document.getElementById("scanned-progress-text");
  const pagesFill = document.getElementById("pages-progress-fill");
  const pagesText = document.getElementById("pages-progress-text");

  const totalIssuesInRun = 223;
  const totalPagesInRun = 7520;
  const manualScannedPages = 6784;
  const manualScannedIssues = 200;
  const lastUpdatedDate = "September 21, 2026";

  const highBase =
    "https://archive.org/download/sonic-the-comic-high-resolution-scans";
  const stdBase =
    "https://archive.org/download/sonic-the-comic-standard-resolution-scans";

  let allIssues = [];

  // State for filtering and pagination
  let currentSearch = "";
  let currentYearFilter = "all";
  let currentSort = "asc";

  // Update URL params
  const updateURLParams = () => {
    const params = new URLSearchParams();
    if (currentSearch) params.set("search", currentSearch);
    if (currentYearFilter !== "all") params.set("year", currentYearFilter);
    if (currentSort !== "asc") params.set("sort", currentSort);

    const newUrl = `${window.location.pathname}${params.toString() ? "?" + params.toString() : ""}${window.location.hash}`;
    window.history.replaceState({}, "", newUrl);
  };

  const updateClearFiltersVisibility = () => {
    const isActive =
      currentSearch !== "" ||
      currentYearFilter !== "all" ||
      currentSort !== "asc";
    clearFiltersBtns.forEach((btn) => {
      if (isActive) {
        btn.classList.remove("hidden");
      } else {
        btn.classList.add("hidden");
      }
    });
  };

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
    const issueNum =
      !isSpecial && /^\d+$/.test(String(issue.id))
        ? parseInt(issue.id, 10)
        : issue.id;
    const displayTitle = isSpecial ? issue.title : `Issue ${issueNum}`;
    const highUrl = `${highBase}/${encodeURIComponent(issue.high)}`;
    const stdUrl = `${stdBase}/${encodeURIComponent(issue.standard)}`;
    const issueId = `issue-${issue.id}`;
    let formattedDate = "";

    if (issue.date) {
      const [year, month, day] = issue.date.split("-").map(Number);
      const dateObj = new Date(Date.UTC(year, month - 1, day));
      formattedDate = dateObj
        .toLocaleDateString("en-GB", {
          weekday: "long",
          day: "numeric",
          month: "long",
          year: "numeric",
          timeZone: "UTC",
        })
        .replace(",", "");
    }

    const masterHtml = issue.master
      ? `<a href="${issue.master}" aria-label="Download ${displayTitle} Raw 600 DPI Master" target="_blank" rel="noopener noreferrer" class="btn-icon raw"><span class="icon-link"></span> RAW</a>`
      : "";

    return `
      <article class="card issue-card" id="${issueId}" data-url="issue.html?id=${issue.id}">
        <div class="card-left">
          <img src="${issue.image}" alt="Cover of ${displayTitle}" class="card-thumbnail skeleton" width="240" height="310" loading="lazy" onload="this.classList.remove('skeleton')">
        </div>
        <div class="card-right">
          <div class="card-header">
            <h3>
              <a href="issue.html?id=${issue.id}" class="issue-title-link">${displayTitle}</a>
              <button class="copy-link-btn" data-link="${issueId}" aria-label="Copy link to ${displayTitle}" title="Copy Link">
                <span class="icon icon-share"></span>
              </button>
            </h3>
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
    updateURLParams();
    updateClearFiltersVisibility();
    // 1. Filter
    const searchStripped = currentSearch.replace(/^0+/, "");
    const cleanSearch = currentSearch.replace(/^issue\s*/i, "").trim();
    const cleanSearchStripped = cleanSearch.replace(/^0+/, "");

    let filteredMain = allIssues.filter((issue) => {
      if (issue.type === "special") return false;
      const issueYear = issue.date ? issue.date.substring(0, 4) : "Unknown";
      const matchesYear =
        currentYearFilter === "all" || issueYear === currentYearFilter;
      const searchKey = String(issue.id).padStart(3, "0");
      const keyStripped = searchKey.replace(/^0+/, "");
      const matchesSearch =
        !currentSearch ||
        searchKey.includes(currentSearch) ||
        keyStripped === searchStripped ||
        (cleanSearch &&
          (searchKey.includes(cleanSearch) ||
            keyStripped === cleanSearchStripped));
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
      return (Number(a.id) - Number(b.id)) * sortMultiplier;
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
    const mainToShow = filteredMain;
    grid.innerHTML = mainToShow.map(generateCardHTML).join("");

    if (filteredMain.length === 0) {
      emptyState.classList.remove("hidden");
      grid.classList.add("hidden");
    } else {
      emptyState.classList.add("hidden");
      grid.classList.remove("hidden");
    }

    // 4. Render Specials Grid
    if (specialsGrid) {
      const specialsToShow = filteredSpecials;
      specialsGrid.innerHTML = specialsToShow.map(generateCardHTML).join("");

      if (filteredSpecials.length === 0) {
        specialsEmptyState.classList.remove("hidden");
        specialsGrid.classList.add("hidden");
      } else {
        specialsEmptyState.classList.add("hidden");
        specialsGrid.classList.remove("hidden");
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
    applyFiltersAndRender();
  };

  clearFiltersBtns.forEach((btn) =>
    btn.addEventListener("click", clearAllFilters),
  );

  if (yearFilterSelect) {
    yearFilterSelect.addEventListener("change", (e) => {
      currentYearFilter = e.target.value;
      applyFiltersAndRender();
    });
  }

  if (sortFilterSelect) {
    sortFilterSelect.addEventListener("change", (e) => {
      currentSort = e.target.value;
      applyFiltersAndRender();
    });
  }

  const handleSearch = debounce((e) => {
    currentSearch = e.target.value.trim().toLowerCase();
    applyFiltersAndRender();
  }, 250);

  if (searchInput) {
    searchInput.addEventListener("input", handleSearch);
  }

  // Handle copy link clicks and card clicks
  document.addEventListener("click", (e) => {
    const copyBtn = e.target.closest(".copy-link-btn");
    if (copyBtn) {
      e.stopPropagation();
      const targetId = copyBtn.getAttribute("data-link");
      const url = new URL(window.location.href);
      url.hash = targetId;
      navigator.clipboard.writeText(url.toString()).then(() => {
        const originalHtml = copyBtn.innerHTML;
        copyBtn.innerHTML = `<span class="icon icon-check icon-success"></span>`;
        setTimeout(() => {
          copyBtn.innerHTML = originalHtml;
        }, 2000);
      });
      return;
    }

    // If click is directly on an anchor or button inside the card, allow natural action
    if (e.target.closest("a, button")) return;

    // If click is on the card (thumbnail, text, background), navigate to issue page
    const card = e.target.closest(".card.issue-card");
    if (card && card.dataset.url) {
      window.location.href = card.dataset.url;
    }
  });

  // Highlight target if page loaded with hash
  if (window.location.hash) {
    setTimeout(() => {
      const el = document.querySelector(window.location.hash);
      if (el) {
        el.scrollIntoView({ behavior: "smooth" });
        el.classList.add("highlight");
        setTimeout(() => el.classList.remove("highlight"), 3000);
      }
    }, 500); // small delay to ensure cards render first
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

    // Read URL parameters on load
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.has("search")) {
      currentSearch = urlParams.get("search").toLowerCase();
      if (searchInput) searchInput.value = currentSearch;
    }
    if (urlParams.has("year")) {
      currentYearFilter = urlParams.get("year");
      if (yearFilterSelect) yearFilterSelect.value = currentYearFilter;
    }
    if (urlParams.has("sort")) {
      currentSort = urlParams.get("sort");
      if (sortFilterSelect) sortFilterSelect.value = currentSort;
    }

    // Call update to sync clear button visibility if needed
    updateClearFiltersVisibility();

    // Initial render
    applyFiltersAndRender();
  } catch (error) {
    console.error(error);
    if (countDisplay) countDisplay.textContent = "Error loading issue data.";
    if (scannedText) scannedText.textContent = "Error loading progress.";
    if (optimisedText) optimisedText.textContent = "Error loading progress.";
    if (grid)
      grid.innerHTML = `<p class="grid-error-message">Error loading archive files. Please ensure you are running a local server.</p>`;
  }
});
