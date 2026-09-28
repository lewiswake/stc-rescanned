let allIssues = [];
let uniqueTags = []; // Array of objects: { tag: "nigel kitching", context: "Writer" }
let selectedTags = []; // Array of same objects

document.addEventListener('DOMContentLoaded', async () => {
  try {
    const response = await fetch('search_tags.json');
    if (!response.ok) throw new Error('Failed to load JSON');
    
    const data = await response.json();
    allIssues = data.issues || [];
    
    const tagContextMap = new Map();
    
    allIssues.forEach(issue => {
      if (!issue.search_tags || !Array.isArray(issue.search_tags)) return;
      
      issue.search_tags.forEach(tagStr => {
        const tag = tagStr.toLowerCase();
        
        const addContext = (context) => {
          const key = `${tag}:::${context}`;
          if (!tagContextMap.has(key)) {
            tagContextMap.set(key, { tag, context });
          }
        };

        const checkArray = (arr, context) => {
          if (arr && arr.some(item => item.toLowerCase().includes(tag) || tag.includes(item.toLowerCase()))) {
            addContext(context);
            return true;
          }
          return false;
        };

        let foundContext = false;

        // Cover
        if (issue.cover) {
          if (checkArray(issue.cover.artists, "Artist")) foundContext = true;
          if (checkArray(issue.cover.characters, "Character")) foundContext = true;
        }
        
        // Stories
        if (issue.stories) {
          issue.stories.forEach(story => {
            if (checkArray(story.writers, "Writer")) foundContext = true;
            if (checkArray(story.artists, "Artist")) foundContext = true;
            if (checkArray(story.letterers, "Letterer")) foundContext = true;
            if (checkArray(story.colourists, "Colourist")) foundContext = true;
            if (checkArray(story.characters, "Character")) foundContext = true;
          });
        }
        
        // Features
        if (issue.features) {
          issue.features.forEach(f => {
            if (f.description && (f.description.toLowerCase().includes(tag) || tag.includes(f.description.toLowerCase()))) {
              addContext(f.type || "Feature");
              foundContext = true;
            }
          });
        }
        
        // Editorial
        if (checkArray(issue.editorial_staff, "Editorial")) foundContext = true;
        
        if (!foundContext) {
          addContext("Tag");
        }
      });
    });
    
    uniqueTags = Array.from(tagContextMap.values())
      .sort((a, b) => a.tag.localeCompare(b.tag) || a.context.localeCompare(b.context));
    
    renderIssues(allIssues);
  } catch (error) {
    console.error("Error loading search_tags.json:", error);
    document.getElementById('results-container').innerHTML = '<p class="no-results">Error loading data. Make sure you are running a local server.</p>';
  }
});

const searchInput = document.getElementById('search-input');
const autocompleteList = document.getElementById('autocomplete-list');
const selectedTagsContainer = document.getElementById('selected-tags');
const resultsContainer = document.getElementById('results-container');

let currentFocus = -1;

searchInput.addEventListener('input', function() {
  const val = this.value.toLowerCase().trim();
  autocompleteList.innerHTML = '';
  currentFocus = -1;
  
  if (!val) return;
  
  // Filter tags matching input and not already selected
  const matches = uniqueTags.filter(item => {
    const isMatch = item.tag.includes(val);
    const isSelected = selectedTags.some(st => st.tag === item.tag && st.context === item.context);
    return isMatch && !isSelected;
  });
  
  matches.forEach(match => {
    const item = document.createElement('div');
    
    const regex = new RegExp(`(${val})`, "gi");
    const highlightedTag = match.tag.replace(regex, "<strong>$1</strong>");
    const contextHTML = `<span class="context-label">${match.context}</span>`;
    
    item.innerHTML = `<span>${highlightedTag}</span> ${contextHTML}`;
    
    item.addEventListener('click', function() {
      addTag(match);
      searchInput.value = '';
      autocompleteList.innerHTML = '';
      currentFocus = -1;
      searchInput.focus();
    });
    
    autocompleteList.appendChild(item);
  });
});

searchInput.addEventListener('keydown', function(e) {
  let x = document.getElementById("autocomplete-list");
  if (x) x = x.getElementsByTagName("div");
  if (e.keyCode == 40) {
    // DOWN
    currentFocus++;
    addActive(x);
  } else if (e.keyCode == 38) { // UP
    currentFocus--;
    addActive(x);
  } else if (e.keyCode == 13) {
    // ENTER
    e.preventDefault();
    if (currentFocus > -1) {
      if (x) x[currentFocus].click();
    }
  }
});

function addActive(x) {
  if (!x) return false;
  removeActive(x);
  if (currentFocus >= x.length) currentFocus = 0;
  if (currentFocus < 0) currentFocus = (x.length - 1);
  x[currentFocus].classList.add("autocomplete-active");
  // scroll into view
  x[currentFocus].scrollIntoView({ block: "nearest", behavior: "smooth" });
}

function removeActive(x) {
  for (let i = 0; i < x.length; i++) {
    x[i].classList.remove("autocomplete-active");
  }
}

document.addEventListener('click', function(e) {
  if (e.target !== searchInput && e.target !== autocompleteList) {
    autocompleteList.innerHTML = '';
    currentFocus = -1;
  }
});

function addTag(tagObj) {
  if (!selectedTags.some(st => st.tag === tagObj.tag && st.context === tagObj.context)) {
    selectedTags.push(tagObj);
    renderSelectedTags();
    filterIssues();
  }
}

function removeTag(tagObj) {
  selectedTags = selectedTags.filter(st => !(st.tag === tagObj.tag && st.context === tagObj.context));
  renderSelectedTags();
  filterIssues();
}

function renderSelectedTags() {
  selectedTagsContainer.innerHTML = '';
  selectedTags.forEach(tagObj => {
    const tagEl = document.createElement('div');
    tagEl.className = 'tag';
    
    const textEl = document.createElement('span');
    textEl.className = 'tag-text';
    textEl.textContent = `${tagObj.tag} (${tagObj.context})`;
    
    const closeEl = document.createElement('span');
    closeEl.className = 'tag-close';
    closeEl.innerHTML = '&times;';
    closeEl.title = "Remove tag";
    closeEl.addEventListener('click', () => removeTag(tagObj));
    
    tagEl.appendChild(textEl);
    tagEl.appendChild(closeEl);
    selectedTagsContainer.appendChild(tagEl);
  });
}

function issueHasTag(issue, selectedItem) {
  const { tag, context } = selectedItem;
  
  if (context === "Tag") {
    return issue.search_tags && issue.search_tags.some(t => t.toLowerCase() === tag);
  }
  
  const checkArr = (arr) => arr && arr.some(item => item.toLowerCase().includes(tag) || tag.includes(item.toLowerCase()));
  
  if (context === "Artist") {
    if (issue.cover && checkArr(issue.cover.artists)) return true;
    if (issue.stories && issue.stories.some(s => checkArr(s.artists))) return true;
    return false;
  }
  
  if (context === "Writer") {
    return issue.stories && issue.stories.some(s => checkArr(s.writers));
  }
  
  if (context === "Character") {
    if (issue.cover && checkArr(issue.cover.characters)) return true;
    if (issue.stories && issue.stories.some(s => checkArr(s.characters))) return true;
    return false;
  }
  
  if (context === "Letterer") {
    return issue.stories && issue.stories.some(s => checkArr(s.letterers));
  }
  
  if (context === "Colourist") {
    return issue.stories && issue.stories.some(s => checkArr(s.colourists));
  }
  
  if (context === "Editorial") {
    return checkArr(issue.editorial_staff);
  }
  
  if (issue.features) {
    return issue.features.some(f => (f.type || "Feature") === context && f.description && (f.description.toLowerCase().includes(tag) || tag.includes(f.description.toLowerCase())));
  }
  
  return false;
}

function filterIssues() {
  if (selectedTags.length === 0) {
    renderIssues(allIssues);
    return;
  }
  
  const filtered = allIssues.filter(issue => {
    return selectedTags.every(tagObj => issueHasTag(issue, tagObj));
  });
  
  renderIssues(filtered);
}

function renderIssues(issues) {
  resultsContainer.innerHTML = '';
  
  if (issues.length === 0) {
    resultsContainer.innerHTML = '<p class="no-results">No issues found matching all selected tags.</p>';
    return;
  }
  
  issues.forEach(issue => {
    let displayTitle = issue.title || `Issue ${issue.issue_number}`;
    let issueId = issue.id || issue.issue_number;
    let coverSrc = issue.image ? `../${issue.image}` : (issue.cover && issue.cover.image ? `../${issue.cover.image}` : `../images/thumbnails/${String(issueId).padStart(3, '0')}.jpg`);
    
    // For dates
    let formattedDate = "";
    if (issue.release_date || issue.date) {
      const rawDate = issue.release_date || issue.date;
      const [year, month, day] = rawDate.split("-").map(Number);
      const dateObj = new Date(Date.UTC(year, month - 1, day));
      formattedDate = dateObj.toLocaleDateString("en-GB", {
        day: "numeric",
        month: "long",
        year: "numeric",
      });
    }

    const card = document.createElement('article');
    card.className = 'card';
    card.innerHTML = `
      <div class="card-left">
        <a href="../issue.html?id=${issueId}">
          <img src="${coverSrc}" alt="Cover of ${displayTitle}" class="card-thumbnail" width="240" height="310" loading="lazy">
        </a>
      </div>
      <div class="card-right">
        <div class="card-header">
          <h3>
            <a href="../issue.html?id=${issueId}" class="issue-title-link">${displayTitle}</a>
          </h3>
          ${formattedDate ? `<p class="issue-date">${formattedDate}</p>` : ""}
        </div>
        <div class="btn-icon-group" style="margin-top: 15px;">
          ${issue.price ? `<p style="color: var(--text-2); font-size: 14px;">Price: ${issue.price}</p>` : ""}
          <p style="color: var(--text-2); font-size: 14px;"><em>${issue.search_tags ? issue.search_tags.length : 0} tags</em></p>
        </div>
      </div>
    `;
    resultsContainer.appendChild(card);
  });
}

// Mobile Navigation Toggle
document.addEventListener("DOMContentLoaded", () => {
  const hamburgerBtn = document.getElementById("hamburger-menu");
  const drawerOverlay = document.getElementById("drawer-overlay");

  if (hamburgerBtn) {
    hamburgerBtn.addEventListener("click", () => {
      document.body.classList.toggle("nav-open");
    });
  }

  if (drawerOverlay) {
    drawerOverlay.addEventListener("click", () => {
      document.body.classList.remove("nav-open");
    });
  }
});
