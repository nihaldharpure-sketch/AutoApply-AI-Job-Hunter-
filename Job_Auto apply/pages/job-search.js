// ============================================================
// Job Search Page
// ============================================================

import { Storage }              from '../services/storage.js';
import { searchJobs, enrichWithMatchScore } from '../services/job-api.js';
import { applyToJob, generateCoverLetter }  from '../services/auto-apply.js';

let currentJobs   = [];
let currentFilter = {};
let isLoading     = false;

export async function renderJobSearch(container) {
  const profile = Storage.getProfile() || {};
  const resume  = Storage.getResume() || {};

  container.innerHTML = `
    <div class="page-header">
      <div>
        <h1 class="page-title">Find Jobs</h1>
        <p class="page-sub">AI-matched jobs based on your resume — <span class="match-highlight">sorted by best match</span></p>
      </div>
      <div class="header-actions">
        <button class="btn btn-outline" id="auto-apply-btn">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
          Auto Apply All
        </button>
      </div>
    </div>

    <!-- Search Bar -->
    <div class="search-section">
      <div class="search-bar">
        <div class="search-input-wrap">
          <svg class="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
          </svg>
          <input type="text" id="search-query" class="search-input" placeholder="Job title, skill, or keyword..." />
        </div>
        <div class="search-input-wrap">
          <svg class="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
          </svg>
          <input type="text" id="search-location" class="search-input" placeholder="Location (e.g. Bangalore, Remote)..." />
        </div>
        <button class="btn btn-primary" id="search-btn">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
          </svg>
          Search
        </button>
      </div>

      <!-- Filters -->
      <div class="filters-row">
        <button class="filter-chip active" data-filter="all">All Jobs</button>
        <button class="filter-chip" data-filter="easy">⚡ Easy Apply</button>
        <button class="filter-chip" data-filter="linkedin">in LinkedIn</button>
        <button class="filter-chip" data-filter="indeed">Indeed</button>
        <button class="filter-chip" data-filter="glassdoor">Glassdoor</button>
        <button class="filter-chip" data-filter="saved">🔖 Saved</button>
        <div class="filter-sep"></div>
        <span class="jobs-count" id="jobs-count">Loading jobs...</span>
      </div>
    </div>

    <!-- Jobs Grid -->
    <div class="jobs-grid" id="jobs-grid">
      ${renderSkeletons(6)}
    </div>

    <!-- Auto Apply Progress Modal -->
    <div class="modal-overlay" id="auto-modal" style="display:none">
      <div class="modal-box">
        <div class="modal-icon auto-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="28" height="28">
            <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
          </svg>
        </div>
        <h3 class="modal-title">Auto Apply in Progress</h3>
        <p class="modal-desc" id="auto-modal-desc">Applying to matching jobs...</p>
        <div class="progress-bar-wrap">
          <div class="progress-bar" id="auto-progress" style="width:0%"></div>
        </div>
        <p class="progress-text" id="auto-progress-text">0 / 0 applications</p>
        <div class="modal-results" id="auto-results" style="display:none">
          <div class="result-item success"><span id="result-success">0</span> Applied</div>
          <div class="result-item skip"><span id="result-skip">0</span> Skipped</div>
          <div class="result-item fail"><span id="result-fail">0</span> Failed</div>
        </div>
        <button class="btn btn-primary" id="close-auto-modal" style="display:none">View Dashboard</button>
      </div>
    </div>

    <!-- Apply Confirm Modal -->
    <div class="modal-overlay" id="apply-modal" style="display:none">
      <div class="modal-box">
        <div class="modal-icon apply-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="28" height="28">
            <path d="M22 2 11 13"/><path d="M22 2 15 22 11 13 2 9l20-7z"/>
          </svg>
        </div>
        <h3 class="modal-title" id="apply-modal-title">Apply to Job?</h3>
        <p class="modal-desc" id="apply-modal-desc">This will open LinkedIn Easy Apply in a new tab and record this application.</p>
        <div class="cover-letter-section">
          <label class="form-label">Cover Letter (auto-generated)</label>
          <textarea class="form-textarea" id="cover-letter-text" rows="6"></textarea>
        </div>
        <div class="modal-actions">
          <button class="btn btn-ghost" onclick="document.getElementById('apply-modal').style.display='none'">Cancel</button>
          <button class="btn btn-primary" id="confirm-apply-btn">Apply Now →</button>
        </div>
      </div>
    </div>
  `;

  // Bind events
  document.getElementById('search-btn').addEventListener('click', doSearch);
  document.getElementById('search-query').addEventListener('keydown', e => e.key === 'Enter' && doSearch());
  document.getElementById('search-location').addEventListener('keydown', e => e.key === 'Enter' && doSearch());
  document.getElementById('auto-apply-btn').addEventListener('click', startAutoApply);

  // Filter chips
  document.querySelectorAll('.filter-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      document.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      applyFilter(chip.dataset.filter);
    });
  });

  // Initial load
  await doSearch();
}

async function doSearch() {
  if (isLoading) return;
  isLoading = true;

  const query    = document.getElementById('search-query')?.value || '';
  const location = document.getElementById('search-location')?.value || '';
  const grid     = document.getElementById('jobs-grid');
  const counter  = document.getElementById('jobs-count');

  grid.innerHTML = renderSkeletons(6);
  counter.textContent = 'Searching...';

  try {
    const resume   = Storage.getResume();
    const skills   = resume?.skills || [];
    const rawJobs  = await searchJobs(query, location, currentFilter);
    currentJobs    = enrichWithMatchScore(rawJobs, skills);

    renderJobCards(currentJobs);
    counter.textContent = `${currentJobs.length} job${currentJobs.length !== 1 ? 's' : ''} found`;
  } catch (err) {
    grid.innerHTML = `<div class="error-state"><p>Failed to load jobs. Check your connection.</p></div>`;
    console.error('Search error:', err);
  } finally {
    isLoading = false;
  }
}

function applyFilter(filter) {
  const apps    = Storage.getApplications();
  const applied = new Set(apps.map(a => a.jobId));

  let filtered = currentJobs;
  if (filter === 'easy')      filtered = currentJobs.filter(j => j.easyApply);
  if (filter === 'linkedin')  filtered = currentJobs.filter(j => j.source === 'LinkedIn');
  if (filter === 'indeed')    filtered = currentJobs.filter(j => j.source === 'Indeed');
  if (filter === 'glassdoor') filtered = currentJobs.filter(j => j.source === 'Glassdoor');
  if (filter === 'saved')     filtered = Storage.getSavedJobs();

  renderJobCards(filtered, applied);
  document.getElementById('jobs-count').textContent = `${filtered.length} job${filtered.length !== 1 ? 's' : ''} found`;
}

function renderJobCards(jobs, appliedSet) {
  const grid    = document.getElementById('jobs-grid');
  const apps    = Storage.getApplications();
  const applied = appliedSet || new Set(apps.map(a => a.jobId));

  if (!jobs.length) {
    grid.innerHTML = `
      <div class="empty-state">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="56" height="56">
          <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
        </svg>
        <h3>No jobs found</h3>
        <p>Try a different search term or location</p>
      </div>
    `;
    return;
  }

  grid.innerHTML = jobs.map(job => {
    const isApplied = applied.has(job.id);
    const isSaved   = Storage.isJobSaved(job.id);
    const score     = job.matchScore || 0;
    const scoreClass = score >= 80 ? 'score-high' : score >= 60 ? 'score-med' : 'score-low';

    return `
      <div class="job-card" data-id="${job.id}">
        <div class="job-card-header">
          <div class="job-logo-wrap">
            <img src="${job.logo}" alt="${job.company}" class="job-logo" onerror="this.src='https://ui-avatars.com/api/?name=${encodeURIComponent(job.company?.slice(0,2)||'J')}&background=6366f1&color=fff'" />
          </div>
          <div class="job-source-badge source-${job.source?.toLowerCase()}">${job.source}</div>
          <button class="save-btn ${isSaved ? 'saved' : ''}" data-job-id="${job.id}" title="${isSaved ? 'Unsave' : 'Save'}">
            <svg viewBox="0 0 24 24" fill="${isSaved ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2" width="16" height="16">
              <path d="m19 21-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z"/>
            </svg>
          </button>
        </div>

        <div class="job-card-body">
          <h3 class="job-title">${job.title}</h3>
          <p class="job-company">${job.company}</p>
          <div class="job-meta">
            <span class="job-location">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="12" height="12">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
              </svg>
              ${job.location}
            </span>
            <span class="job-type">${job.type}</span>
          </div>
          ${job.salary ? `<div class="job-salary">💰 ${job.salary}</div>` : ''}

          <p class="job-description">${(job.description || '').slice(0, 140)}...</p>

          <div class="job-skills">
            ${(job.skills || []).slice(0, 4).map(s => `<span class="skill-chip">${s}</span>`).join('')}
          </div>
        </div>

        <div class="job-card-footer">
          <div class="job-match">
            <div class="match-circle ${scoreClass}">
              <svg viewBox="0 0 36 36" class="match-svg">
                <circle cx="18" cy="18" r="15.9" fill="none" stroke="rgba(255,255,255,0.1)" stroke-width="3"/>
                <circle cx="18" cy="18" r="15.9" fill="none" stroke="currentColor" stroke-width="3"
                  stroke-dasharray="${score},100" stroke-dashoffset="25" stroke-linecap="round"/>
              </svg>
              <span class="match-pct">${score}%</span>
            </div>
            <div class="match-label">
              <span class="match-text">Match</span>
              <span class="posted-time">${job.postedAt}</span>
            </div>
          </div>

          <div class="job-actions">
            ${job.easyApply ? '<span class="easy-badge">⚡ Easy Apply</span>' : ''}
            ${isApplied
              ? '<span class="applied-badge">✓ Applied</span>'
              : `<button class="btn btn-primary btn-sm apply-btn" data-job-id="${job.id}">Apply Now</button>`
            }
          </div>
        </div>
      </div>
    `;
  }).join('');

  // Bind job card events
  grid.querySelectorAll('.apply-btn').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation();
      openApplyModal(btn.dataset.jobId);
    });
  });

  grid.querySelectorAll('.save-btn').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation();
      const job  = currentJobs.find(j => j.id === btn.dataset.jobId) || Storage.getSavedJobs().find(j => j.id === btn.dataset.jobId);
      if (!job) return;
      const saved = Storage.toggleSaveJob(job);
      btn.classList.toggle('saved', saved);
      btn.querySelector('svg').setAttribute('fill', saved ? 'currentColor' : 'none');
    });
  });
}

function openApplyModal(jobId) {
  const job     = currentJobs.find(j => j.id === jobId);
  if (!job) return;
  const profile = Storage.getProfile() || {};
  const cover   = generateCoverLetter(job, profile);

  document.getElementById('apply-modal-title').textContent = `Apply to ${job.title} at ${job.company}`;
  document.getElementById('cover-letter-text').value       = cover;
  document.getElementById('apply-modal').style.display     = 'flex';

  const confirmBtn = document.getElementById('confirm-apply-btn');
  confirmBtn.onclick = async () => {
    try {
      confirmBtn.disabled     = true;
      confirmBtn.textContent  = 'Applying...';
      await applyToJob(job, profile);
      document.getElementById('apply-modal').style.display = 'none';
      confirmBtn.disabled    = false;
      confirmBtn.textContent = 'Apply Now →';

      // Mark as applied in UI
      const applyBtn = document.querySelector(`.apply-btn[data-job-id="${jobId}"]`);
      if (applyBtn) {
        applyBtn.outerHTML = '<span class="applied-badge">✓ Applied</span>';
      }
      showToast(`✓ Applied to ${job.title} at ${job.company}`);
    } catch (err) {
      confirmBtn.disabled    = false;
      confirmBtn.textContent = 'Apply Now →';
      showToast(err.message, 'error');
    }
  };
}

async function startAutoApply() {
  const easyJobs = currentJobs.filter(j => j.easyApply && j.matchScore >= 60);
  if (!easyJobs.length) {
    showToast('No Easy Apply jobs with 60%+ match found', 'warn');
    return;
  }

  const modal   = document.getElementById('auto-modal');
  const desc    = document.getElementById('auto-modal-desc');
  const bar     = document.getElementById('auto-progress');
  const text    = document.getElementById('auto-progress-text');
  const results = document.getElementById('auto-results');
  const closeBtn= document.getElementById('close-auto-modal');

  modal.style.display = 'flex';
  desc.textContent    = `Found ${easyJobs.length} Easy Apply jobs with 60%+ match`;
  results.style.display = 'none';
  closeBtn.style.display = 'none';

  const { autoBatchApply } = await import('../services/auto-apply.js');
  const profile = Storage.getProfile() || {};

  const res = await autoBatchApply(easyJobs, profile, (done, total, job) => {
    const pct = Math.round((done / total) * 100);
    bar.style.width  = pct + '%';
    text.textContent = `${done} / ${total} — ${job.title} at ${job.company}`;
  });

  results.style.display = 'flex';
  closeBtn.style.display = 'block';
  desc.textContent      = 'Auto Apply complete!';
  document.getElementById('result-success').textContent = res.success.length;
  document.getElementById('result-skip').textContent    = res.skipped.length;
  document.getElementById('result-fail').textContent    = res.failed.length;

  closeBtn.onclick = () => {
    modal.style.display = 'none';
    window._navigate('dashboard');
  };
}

function renderSkeletons(count) {
  return Array(count).fill(`
    <div class="job-card skeleton">
      <div class="skel-header"></div>
      <div class="skel-title"></div>
      <div class="skel-text"></div>
      <div class="skel-text short"></div>
      <div class="skel-row"></div>
      <div class="skel-footer"></div>
    </div>
  `).join('');
}

function showToast(message, type = 'success') {
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.textContent = message;
  document.body.appendChild(toast);
  setTimeout(() => toast.classList.add('show'), 10);
  setTimeout(() => { toast.classList.remove('show'); setTimeout(() => toast.remove(), 300); }, 3500);
}
