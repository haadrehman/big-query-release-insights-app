document.addEventListener('DOMContentLoaded', () => {
  // Elements
  const refreshBtn = document.getElementById('refreshBtn');
  const spinnerIcon = document.getElementById('spinnerIcon');
  const syncStatus = document.getElementById('syncStatus');
  const searchInput = document.getElementById('searchInput');
  const filterTags = document.getElementById('filterTags');
  const skeletonContainer = document.getElementById('skeletonContainer');
  const notesGrid = document.getElementById('notesGrid');
  const noResults = document.getElementById('noResults');
  const clearFiltersBtn = document.getElementById('clearFiltersBtn');
  const toast = document.getElementById('toast');
  const themeToggleBtn = document.getElementById('themeToggleBtn');
  const exportCsvBtn = document.getElementById('exportCsvBtn');

  // Dialog Elements
  const tweetDialog = document.getElementById('tweetDialog');
  const previewTypeBadge = document.getElementById('previewTypeBadge');
  const previewDate = document.getElementById('previewDate');
  const previewText = document.getElementById('previewText');
  const tweetContent = document.getElementById('tweetContent');
  const charCount = document.getElementById('charCount');
  const charProgress = document.getElementById('charProgress');
  const charWarning = document.getElementById('charWarning');
  const sendTweetBtn = document.getElementById('sendTweetBtn');
  const tagChips = document.querySelectorAll('.chip');

  // App State
  let releases = [];
  let selectedRelease = null;
  let activeFilterType = 'All';
  let searchQuery = '';

  // Initialize Theme from LocalStorage
  const savedTheme = localStorage.getItem('theme') || 'dark';
  document.documentElement.setAttribute('data-theme', savedTheme);

  // Progress ring variables (Radius: 9, Circumference: 2 * PI * r = 56.54)
  const ringRadius = 9;
  const ringCircumference = 2 * Math.PI * ringRadius;

  // Initialize progress ring SVG properties
  if (charProgress) {
    charProgress.style.strokeDasharray = `${ringCircumference} ${ringCircumference}`;
    charProgress.style.strokeDashoffset = ringCircumference;
  }

  // Toast helper
  function showToast(message, type = 'info') {
    toast.textContent = message;
    toast.className = `toast show ${type}`;
    setTimeout(() => {
      toast.classList.remove('show');
    }, 3500);
  }

  // Set loading status
  function setLoading(isLoading) {
    if (isLoading) {
      spinnerIcon.classList.add('spinning');
      syncStatus.textContent = 'Syncing...';
      syncStatus.className = 'sync-status loading';
      skeletonContainer.style.display = 'grid';
      notesGrid.style.display = 'none';
      noResults.style.display = 'none';
      refreshBtn.disabled = true;
    } else {
      spinnerIcon.classList.remove('spinning');
      refreshBtn.disabled = false;
    }
  }

  // Fetch release notes from backend API
  async function fetchReleases(force = false) {
    setLoading(true);
    try {
      const url = `/api/releases${force ? '?force_refresh=true' : ''}`;
      const response = await fetch(url);
      const result = await response.json();
      
      if (result.status === 'success') {
        releases = result.releases;
        syncStatus.textContent = `Synced: ${result.last_fetched}`;
        syncStatus.className = 'sync-status success';
        
        renderReleases();
        
        if (force) {
          showToast('Release notes successfully refreshed!', 'success');
        }
      } else {
        throw new Error(result.message || 'Failed to fetch release notes.');
      }
    } catch (error) {
      console.error(error);
      syncStatus.textContent = 'Sync failed';
      syncStatus.className = 'sync-status error';
      showToast(`Error syncing notes: ${error.message}`, 'error');
      
      // If we already have release notes stored in memory, still render them
      if (releases.length > 0) {
        renderReleases();
      } else {
        skeletonContainer.style.display = 'none';
        noResults.style.display = 'block';
      }
    } finally {
      setLoading(false);
    }
  }

  // Render cards based on search filters and tag type selection
  function renderReleases() {
    notesGrid.innerHTML = '';
    
    // Filter release notes
    const filtered = releases.filter(item => {
      const matchesType = activeFilterType === 'All' || item.type.toLowerCase() === activeFilterType.toLowerCase();
      
      const query = searchQuery.toLowerCase().trim();
      const matchesSearch = !query || 
        item.date.toLowerCase().includes(query) ||
        item.type.toLowerCase().includes(query) ||
        item.content_text.toLowerCase().includes(query);
        
      return matchesType && matchesSearch;
    });

    skeletonContainer.style.display = 'none';

    if (filtered.length === 0) {
      notesGrid.style.display = 'none';
      noResults.style.display = 'block';
      return;
    }

    noResults.style.display = 'none';
    notesGrid.style.display = 'grid';

    // Generate HTML for each release note card
    filtered.forEach(item => {
      const card = document.createElement('article');
      card.className = 'release-card';
      
      const typeClass = item.type ? item.type.toLowerCase() : 'general';
      const badgeClass = `badge ${typeClass}`;

      card.innerHTML = `
        <div>
          <div class="card-header">
            <span class="${badgeClass}">${item.type || 'General'}</span>
            <time class="card-date">${item.date}</time>
          </div>
          <div class="card-body">
            ${item.content_html}
          </div>
        </div>
        <div class="card-footer">
          <a href="${item.link}" target="_blank" rel="noopener noreferrer" class="btn-card-link">
            <span>View Source Feed</span>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14 21 3"/>
            </svg>
          </a>
          <div class="card-actions">
            <button class="btn-copy-action" aria-label="Copy plain text to clipboard" title="Copy to Clipboard">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
              </svg>
              <span>Copy</span>
            </button>
            <button class="btn-tweet-action" aria-label="Tweet this release note">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
              </svg>
              <span>Tweet</span>
            </button>
          </div>
        </div>
      `;

      // Event listener for Copying card plain text
      const copyBtn = card.querySelector('.btn-copy-action');
      copyBtn.addEventListener('click', async () => {
        try {
          await navigator.clipboard.writeText(item.content_text);
          copyBtn.classList.add('copied');
          const span = copyBtn.querySelector('span');
          span.textContent = 'Copied!';
          showToast('Copied to clipboard!', 'success');
          setTimeout(() => {
            copyBtn.classList.remove('copied');
            span.textContent = 'Copy';
          }, 2000);
        } catch (err) {
          console.error('Failed to copy: ', err);
          showToast('Failed to copy to clipboard', 'error');
        }
      });

      // Event listener for Tweeting from this card
      const tweetBtn = card.querySelector('.btn-tweet-action');
      tweetBtn.addEventListener('click', () => {
        openTweetComposer(item);
      });

      notesGrid.appendChild(card);
    });
  }

  // Open Tweet dialog and pre-populate text
  function openTweetComposer(item) {
    selectedRelease = item;
    
    // Set Preview Content in modal
    previewTypeBadge.textContent = item.type || 'General';
    previewTypeBadge.className = `preview-type-badge ${item.type ? item.type.toLowerCase() : 'general'}`;
    previewDate.textContent = item.date;
    previewText.textContent = item.content_text;

    // Reset Hashtags chips to initial active state
    tagChips.forEach(chip => {
      const hashtag = chip.dataset.hashtag;
      if (hashtag === '#BigQuery' || hashtag === '#GoogleCloud') {
        chip.classList.add('active');
      } else {
        chip.classList.remove('active');
      }
    });

    // Construct Draft Tweet Text
    let prefix = `📢 BigQuery ${item.type || 'Update'} (${item.date}): `;
    let suffix = `\n\n#BigQuery #GoogleCloud`;
    
    // Extract a summary that leaves room for hashtags
    const maxBodyLen = 280 - prefix.length - suffix.length;
    let mainBody = item.content_text;
    
    if (mainBody.length > maxBodyLen) {
      mainBody = mainBody.substring(0, maxBodyLen - 3) + '...';
    }

    tweetContent.value = `${prefix}${mainBody}${suffix}`;
    
    // Open Dialog
    tweetDialog.showModal();
    updateCharCount();
  }

  // Update char count progress circle and warning indicator
  function updateCharCount() {
    const text = tweetContent.value;
    const len = text.length;
    
    charCount.textContent = `${len} / 280`;

    // Calculate percentage
    const percent = Math.min(len / 280, 1);
    const offset = ringCircumference - (percent * ringCircumference);
    charProgress.style.strokeDashoffset = offset;

    // Color progress ring depending on length limits
    if (len >= 280) {
      charProgress.style.stroke = '#ef4444'; // Red
      charCount.className = 'char-error';
      charWarning.style.display = 'none';
    } else if (len >= 250) {
      charProgress.style.stroke = '#f59e0b'; // Amber
      charCount.className = 'char-warning';
      charWarning.style.display = 'block';
      charWarning.textContent = 'Approaching limit!';
    } else {
      charProgress.style.stroke = '#3b82f6'; // Blue
      charCount.className = '';
      charWarning.style.display = 'none';
    }
  }

  // Handle character count updates in Textarea
  tweetContent.addEventListener('input', updateCharCount);

  // Hashtag Chips Event listeners - append/remove hashtag dynamically
  tagChips.forEach(chip => {
    chip.addEventListener('click', () => {
      const hashtag = chip.dataset.hashtag;
      let currentVal = tweetContent.value;
      const isActive = chip.classList.toggle('active');

      if (isActive) {
        // Append hashtag if it doesn't exist
        if (!currentVal.toLowerCase().includes(hashtag.toLowerCase())) {
          tweetContent.value = `${currentVal.trim()} ${hashtag}`;
        }
      } else {
        // Remove hashtag
        const regex = new RegExp(`\\s*${hashtag}`, 'gi');
        tweetContent.value = currentVal.replace(regex, '').trim();
      }
      updateCharCount();
    });
  });

  // Post Tweet Button click: opens X Web Intent in new tab
  sendTweetBtn.addEventListener('click', () => {
    const tweetText = tweetContent.value;
    if (!tweetText.trim()) {
      showToast('Tweet content cannot be empty!', 'error');
      return;
    }
    
    const intentUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(tweetText)}`;
    window.open(intentUrl, '_blank', 'noopener,noreferrer');
    
    tweetDialog.close();
    showToast('X composer opened in a new tab!', 'success');
  });

  // Filter Tag Buttons Click Event
  filterTags.addEventListener('click', (e) => {
    const tagButton = e.target.closest('.filter-tag');
    if (!tagButton) return;

    // Toggle active state
    document.querySelectorAll('.filter-tag').forEach(btn => btn.classList.remove('active'));
    tagButton.classList.add('active');

    activeFilterType = tagButton.dataset.type;
    renderReleases();
  });

  // Debounced search keyup input filter
  let searchTimeout;
  searchInput.addEventListener('input', (e) => {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
      searchQuery = e.target.value;
      renderReleases();
    }, 150);
  });

  // Clear filters
  clearFiltersBtn.addEventListener('click', () => {
    searchInput.value = '';
    searchQuery = '';
    
    document.querySelectorAll('.filter-tag').forEach(btn => btn.classList.remove('active'));
    document.querySelector('.filter-tag[data-type="All"]').classList.add('active');
    activeFilterType = 'All';
    
    renderReleases();
  });

  // Theme Switcher button click
  themeToggleBtn.addEventListener('click', () => {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    showToast(`Theme switched to ${newTheme} mode!`, 'success');
  });

  // Export CSV helper
  function exportToCsv() {
    const filtered = releases.filter(item => {
      const matchesType = activeFilterType === 'All' || item.type.toLowerCase() === activeFilterType.toLowerCase();
      const query = searchQuery.toLowerCase().trim();
      const matchesSearch = !query || 
        item.date.toLowerCase().includes(query) ||
        item.type.toLowerCase().includes(query) ||
        item.content_text.toLowerCase().includes(query);
      return matchesType && matchesSearch;
    });

    if (filtered.length === 0) {
      showToast('No releases to export!', 'error');
      return;
    }

    const headers = ['Date', 'Type', 'Link', 'Description'];
    const rows = filtered.map(item => [
      item.date,
      item.type,
      item.link,
      item.content_text
    ]);

    const escapeCsv = (val) => {
      if (val === null || val === undefined) return '';
      let str = String(val);
      str = str.replace(/"/g, '""');
      if (str.includes(',') || str.includes('\n') || str.includes('"')) {
        str = `"${str}"`;
      }
      return str;
    };

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(escapeCsv).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `bigquery_releases_${activeFilterType.toLowerCase()}_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('CSV export started!', 'success');
  }

  // Export CSV Button click
  exportCsvBtn.addEventListener('click', exportToCsv);

  // Refresh Button click
  refreshBtn.addEventListener('click', () => {
    fetchReleases(true);
  });

  // Native Dialog Light Dismiss Fallback
  // Checks if click is outside the dialog content boundary (on the backdrop) and dismisses it.
  if (!('closedBy' in HTMLDialogElement.prototype)) {
    tweetDialog.addEventListener('click', (event) => {
      if (event.target !== tweetDialog) return;
      
      const rect = tweetDialog.getBoundingClientRect();
      const isDialogContent = (
        rect.top <= event.clientY &&
        event.clientY <= rect.top + rect.height &&
        rect.left <= event.clientX &&
        event.clientX <= rect.left + rect.width
      );

      if (!isDialogContent) {
        tweetDialog.close();
      }
    });
  }

  // Load release notes on initialization
  fetchReleases();
});
