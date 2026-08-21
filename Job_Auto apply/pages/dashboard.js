// ============================================================
// Dashboard Page — Application Tracker + Stats
// ============================================================

import { Storage }                    from '../services/storage.js';
import { getStats, getApplicationsByDay } from '../services/auto-apply.js';

let chartInstance = null;

export function renderDashboard(container) {
  const applications = Storage.getApplications();
  const stats        = getStats(applications);
  const profile      = Storage.getProfile() || {};

  container.innerHTML = `
    <div class="page-header">
      <div>
        <h1 class="page-title">Dashboard</h1>
        <p class="page-sub">Track all your job applications in one place</p>
      </div>
      <div class="header-actions">
        <button class="btn btn-outline" id="export-btn">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7,10 12,15 17,10"/><line x1="12" y1="15" x2="12" y2="3"/>
          </svg>
          Export CSV
        </button>
        <button class="btn btn-primary" onclick="window._navigate('jobs')">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
          </svg>
          Find More Jobs
        </button>
      </div>
    </div>

    <!-- Stats Cards -->
    <div class="stats-grid">
      <div class="stat-card stat-total">
        <div class="stat-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="24" height="24">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14,2 14,8 20,8"/>
          </svg>
        </div>
        <div class="stat-info">
          <div class="stat-num" data-target="${stats.total}">0</div>
          <div class="stat-label">Total Applied</div>
        </div>
        <div class="stat-trend">
          <div class="stat-bar" style="--fill: 100%"></div>
        </div>
      </div>

      <div class="stat-card stat-interview">
        <div class="stat-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="24" height="24">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
            <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
          </svg>
        </div>
        <div class="stat-info">
          <div class="stat-num" data-target="${stats.interviews}">0</div>
          <div class="stat-label">Interviews</div>
        </div>
        <div class="stat-trend">
          <div class="stat-bar" style="--fill: ${stats.total ? Math.round(stats.interviews / stats.total * 100) : 0}%"></div>
        </div>
      </div>

      <div class="stat-card stat-offer">
        <div class="stat-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="24" height="24">
            <polyline points="20,6 9,17 4,12"/>
          </svg>
        </div>
        <div class="stat-info">
          <div class="stat-num" data-target="${stats.offers}">0</div>
          <div class="stat-label">Offers</div>
        </div>
        <div class="stat-trend">
          <div class="stat-bar" style="--fill: ${stats.total ? Math.round(stats.offers / stats.total * 100) : 0}%"></div>
        </div>
      </div>

      <div class="stat-card stat-pending">
        <div class="stat-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="24" height="24">
            <circle cx="12" cy="12" r="10"/><polyline points="12,6 12,12 16,14"/>
          </svg>
        </div>
        <div class="stat-info">
          <div class="stat-num" data-target="${stats.applied + stats.pending}">0</div>
          <div class="stat-label">Pending Reply</div>
        </div>
        <div class="stat-trend">
          <div class="stat-bar" style="--fill: ${stats.total ? Math.round((stats.applied + stats.pending) / stats.total * 100) : 0}%"></div>
        </div>
      </div>
    </div>

    <!-- Chart + Pipeline -->
    <div class="dash-middle">
      <div class="chart-card">
        <div class="card-header">
          <h3 class="card-title">Applications This Week</h3>
          <div class="chart-tabs">
            <button class="chart-tab active" data-days="7">7 Days</button>
            <button class="chart-tab" data-days="30">30 Days</button>
          </div>
        </div>
        <div class="chart-wrap">
          <canvas id="apps-chart"></canvas>
        </div>
      </div>

      <div class="pipeline-card">
        <div class="card-header">
          <h3 class="card-title">Application Pipeline</h3>
        </div>
        <div class="pipeline">
          <div class="pipe-stage">
            <div class="pipe-label">Applied</div>
            <div class="pipe-bar-wrap">
              <div class="pipe-bar" style="width: ${pct(stats.applied, stats.total)}%; background: var(--accent-blue)"></div>
            </div>
            <div class="pipe-count">${stats.applied}</div>
          </div>
          <div class="pipe-stage">
            <div class="pipe-label">Interviews</div>
            <div class="pipe-bar-wrap">
              <div class="pipe-bar" style="width: ${pct(stats.interviews, stats.total)}%; background: var(--accent-purple)"></div>
            </div>
            <div class="pipe-count">${stats.interviews}</div>
          </div>
          <div class="pipe-stage">
            <div class="pipe-label">Offers</div>
            <div class="pipe-bar-wrap">
              <div class="pipe-bar" style="width: ${pct(stats.offers, stats.total)}%; background: var(--success)"></div>
            </div>
            <div class="pipe-count">${stats.offers}</div>
          </div>
          <div class="pipe-stage">
            <div class="pipe-label">Rejected</div>
            <div class="pipe-bar-wrap">
              <div class="pipe-bar" style="width: ${pct(stats.rejected, stats.total)}%; background: var(--error)"></div>
            </div>
            <div class="pipe-count">${stats.rejected}</div>
          </div>
        </div>
        ${stats.total === 0 ? `
          <div class="pipeline-empty">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="40" height="40">
              <path d="M22 2 11 13"/><path d="M22 2 15 22 11 13 2 9l20-7z"/>
            </svg>
            <p>No applications yet</p>
            <button class="btn btn-primary btn-sm" onclick="window._navigate('jobs')">Start Applying</button>
          </div>
        ` : ''}
      </div>
    </div>

    <!-- Applications Table -->
    <div class="table-card">
      <div class="card-header">
        <h3 class="card-title">All Applications <span class="badge">${applications.length}</span></h3>
        <div class="table-filters">
          <select class="form-select" id="status-filter">
            <option value="">All Status</option>
            <option value="Applied">Applied</option>
            <option value="Interview">Interview</option>
            <option value="Offer">Offer</option>
            <option value="Rejected">Rejected</option>
            <option value="Pending">Pending</option>
          </select>
        </div>
      </div>

      <div class="table-wrap">
        ${renderTable(applications)}
      </div>
    </div>
  `;

  // Animate stat numbers
  animateNumbers();

  // Draw chart
  setTimeout(() => drawChart(7), 200);

  // Chart tab switching
  document.querySelectorAll('.chart-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.chart-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      drawChart(parseInt(tab.dataset.days));
    });
  });

  // Status filter
  document.getElementById('status-filter')?.addEventListener('change', e => {
    const filtered = e.target.value
      ? applications.filter(a => a.status === e.target.value)
      : applications;
    document.querySelector('.table-wrap').innerHTML = renderTable(filtered);
    bindTableEvents();
  });

  // Export CSV
  document.getElementById('export-btn')?.addEventListener('click', exportCSV);

  bindTableEvents();
}

function renderTable(apps) {
  if (!apps.length) {
    return `<div class="table-empty">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="48" height="48">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
        <polyline points="14,2 14,8 20,8"/>
      </svg>
      <p>No applications found</p>
    </div>`;
  }

  return `
    <table class="app-table">
      <thead>
        <tr>
          <th>Job Title</th>
          <th>Company</th>
          <th>Location</th>
          <th>Match</th>
          <th>Applied</th>
          <th>Status</th>
          <th>Source</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        ${apps.map(app => `
          <tr data-id="${app.id}">
            <td>
              <a href="${app.applyUrl}" target="_blank" class="job-link">${app.title}</a>
            </td>
            <td>${app.company}</td>
            <td class="text-muted">${app.location || '—'}</td>
            <td>
              <span class="score-pill ${scoreClass(app.matchScore)}">${app.matchScore || '—'}%</span>
            </td>
            <td class="text-muted">${formatDate(app.appliedAt)}</td>
            <td>
              <select class="status-select status-${app.status?.toLowerCase()}" data-id="${app.id}">
                <option value="Applied"    ${app.status === 'Applied'    ? 'selected' : ''}>Applied</option>
                <option value="Pending"    ${app.status === 'Pending'    ? 'selected' : ''}>Pending</option>
                <option value="Interview"  ${app.status === 'Interview'  ? 'selected' : ''}>Interview</option>
                <option value="Offer"      ${app.status === 'Offer'      ? 'selected' : ''}>Offer</option>
                <option value="Rejected"   ${app.status === 'Rejected'   ? 'selected' : ''}>Rejected</option>
              </select>
            </td>
            <td><span class="source-tag">${app.source || 'Manual'}</span></td>
            <td>
              <button class="icon-btn delete-btn" data-id="${app.id}" title="Delete">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14">
                  <polyline points="3,6 5,6 21,6"/><path d="M19 6l-1 14H6L5 6"/>
                  <path d="M10 11v6m4-6v6"/><path d="M9 6V4h6v2"/>
                </svg>
              </button>
            </td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;
}

function bindTableEvents() {
  // Status update
  document.querySelectorAll('.status-select').forEach(sel => {
    sel.addEventListener('change', () => {
      Storage.updateApplication(sel.dataset.id, { status: sel.value });
      sel.className = `status-select status-${sel.value.toLowerCase()}`;
    });
  });

  // Delete
  document.querySelectorAll('.delete-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      if (!confirm('Delete this application?')) return;
      Storage.deleteApplication(btn.dataset.id);
      btn.closest('tr').remove();
    });
  });
}

function drawChart(days) {
  const canvas = document.getElementById('apps-chart');
  if (!canvas) return;

  const applications = Storage.getApplications();
  const data         = getApplicationsByDay(applications, days);
  const ctx          = canvas.getContext('2d');

  if (chartInstance) { chartInstance.destroy(); chartInstance = null; }

  chartInstance = new Chart(ctx, {
    type: 'bar',
    data: {
      labels:   data.map(d => d.label),
      datasets: [{
        label:           'Applications',
        data:            data.map(d => d.count),
        backgroundColor: 'rgba(99, 102, 241, 0.7)',
        borderColor:     'rgba(99, 102, 241, 1)',
        borderWidth:     2,
        borderRadius:    6,
        borderSkipped:   false,
      }],
    },
    options: {
      responsive:         true,
      maintainAspectRatio:false,
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: 'rgba(15,15,30,0.95)',
          titleColor:      '#fff',
          bodyColor:       'rgba(255,255,255,0.7)',
          borderColor:     'rgba(99,102,241,0.3)',
          borderWidth:     1,
          padding:         12,
        },
      },
      scales: {
        x: {
          grid:  { color: 'rgba(255,255,255,0.05)' },
          ticks: { color: 'rgba(255,255,255,0.5)', font: { size: 11 } },
        },
        y: {
          grid:      { color: 'rgba(255,255,255,0.05)' },
          ticks:     { color: 'rgba(255,255,255,0.5)', font: { size: 11 }, stepSize: 1 },
          beginAtZero: true,
        },
      },
    },
  });
}

function animateNumbers() {
  document.querySelectorAll('.stat-num').forEach(el => {
    const target = parseInt(el.dataset.target) || 0;
    let current  = 0;
    const step   = Math.max(1, Math.ceil(target / 30));
    const timer  = setInterval(() => {
      current = Math.min(current + step, target);
      el.textContent = current;
      if (current >= target) clearInterval(timer);
    }, 40);
  });
}

function exportCSV() {
  const apps = Storage.getApplications();
  const rows = [
    ['Title', 'Company', 'Location', 'Status', 'Match%', 'Applied Date', 'Source'],
    ...apps.map(a => [
      a.title, a.company, a.location, a.status,
      a.matchScore || '', formatDate(a.appliedAt), a.source,
    ]),
  ];
  const csv  = rows.map(r => r.map(c => `"${c}"`).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url  = URL.createObjectURL(blob);
  const a    = Object.assign(document.createElement('a'), { href: url, download: 'applications.csv' });
  a.click();
  URL.revokeObjectURL(url);
}

function formatDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: '2-digit' });
}

function scoreClass(score) {
  if (!score) return '';
  return score >= 80 ? 'score-high' : score >= 60 ? 'score-med' : 'score-low';
}

function pct(val, total) {
  return total ? Math.round((val / total) * 100) : 0;
}
