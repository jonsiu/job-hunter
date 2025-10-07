// CareerOS Job Collector - Popup Script
// Handles popup interface and user interactions

class CareerOSPopup {
  constructor() {
    try {
      console.log('Popup: Constructor called');
      this.currentTab = 'jobs';
      this.jobs = [];
      this.initialize();
    } catch (error) {
      console.error('Popup: Error in constructor:', error);
      throw error;
    }
  }

  initialize() {
    console.log('CareerOS Popup initialized');
    
    this.setupEventListeners();
    this.loadJobs();
    this.updateJobCount();
  }

  setupEventListeners() {
    // Tab navigation
    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const tab = e.currentTarget.dataset.tab;
        this.switchTab(tab);
      });
    });

    // Action buttons
    document.getElementById('sync-btn').addEventListener('click', () => {
      this.syncWithCareerOS();
    });

    document.getElementById('refresh-jobs').addEventListener('click', () => {
      this.loadJobs();
    });

    document.getElementById('open-career-os').addEventListener('click', () => {
      this.openCareerOS();
    });

    document.getElementById('settings-btn').addEventListener('click', () => {
      this.openSettings();
    });

    document.getElementById('help-btn').addEventListener('click', () => {
      this.showHelp();
    });
  }

  switchTab(tab) {
    // Update tab buttons
    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.classList.remove('active');
    });
    document.querySelector(`[data-tab="${tab}"]`).classList.add('active');

    // Update tab content
    document.querySelectorAll('.tab-content').forEach(content => {
      content.classList.remove('active');
    });
    document.getElementById(`${tab}-tab`).classList.add('active');

    this.currentTab = tab;

    // Load tab-specific content
    if (tab === 'jobs') {
      this.loadJobs();
    } else if (tab === 'analysis') {
      this.loadAnalysis();
    } else if (tab === 'insights') {
      this.loadInsights();
    }
  }

  async loadJobs() {
    console.log('Popup: Loading jobs...');
    const jobsList = document.getElementById('jobs-list');
    const loadingState = document.getElementById('jobs-loading');
    
    // Show loading state
    loadingState.style.display = 'flex';
    jobsList.innerHTML = '<div class="loading-state" id="jobs-loading"><div class="spinner"></div><p>Loading jobs...</p></div>';

    try {
      // Get jobs from background script
      console.log('Popup: Sending getBookmarkedJobs message...');
      
      // Add timeout to prevent infinite loading
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Request timeout')), 5000);
      });
      
      const messagePromise = this.sendMessage({ action: 'getBookmarkedJobs' });
      const response = await Promise.race([messagePromise, timeoutPromise]);
      
      console.log('Popup: Received response:', response);
      
      if (response && response.success) {
        this.jobs = response.jobs;
        this.renderJobs();
        this.updateJobCount();
      } else {
        throw new Error(response?.error || 'Failed to load jobs');
      }
    } catch (error) {
      console.error('Error loading jobs:', error);
      this.showError('Failed to load jobs. Please try again.');
    }
  }

  renderJobs() {
    const jobsList = document.getElementById('jobs-list');
    
    console.log('Popup: Rendering jobs, count:', this.jobs.length);
    
    if (this.jobs.length === 0) {
      jobsList.innerHTML = `
        <div class="empty-state">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
          </svg>
          <h3>No Jobs Bookmarked</h3>
          <p>Start bookmarking jobs to see them here</p>
        </div>
      `;
      return;
    }

    const jobsHTML = this.jobs.map(job => this.createJobItemHTML(job)).join('');
    jobsList.innerHTML = jobsHTML;

    // Add event listeners to job items
    this.setupJobItemListeners();
  }

  createJobItemHTML(job) {
    const bookmarkedDate = new Date(job.bookmarkedAt).toLocaleDateString();
    const hasAnalysis = job.analysis !== null;
    
    return `
      <div class="job-item" data-job-id="${job.id}">
        <div class="job-header">
          <h3 class="job-title">${this.escapeHtml(job.title)}</h3>
          <div class="job-actions">
            <button class="job-action-btn" data-action="analyze" title="Analyze job">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M9 19c-5 0-7-2-7-5V6c0-3 2-5 7-5s7 2 7 5v8c0 3-2 5-7 5z"/>
                <path d="M15 13l-3-3-3 3"/>
              </svg>
            </button>
            <button class="job-action-btn" data-action="open" title="Open job">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
                <polyline points="15,3 21,3 21,9"/>
                <line x1="10" y1="14" x2="21" y2="3"/>
              </svg>
            </button>
            <button class="job-action-btn" data-action="remove" title="Remove job">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M3 6h18"/>
                <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/>
                <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
              </svg>
            </button>
          </div>
        </div>
        <p class="job-company">${this.escapeHtml(job.company)}</p>
        <p class="job-location">${this.escapeHtml(job.location)}</p>
        <div class="job-meta">
          <span class="job-source">${job.source}</span>
          <span class="job-date">Bookmarked ${bookmarkedDate}</span>
          ${hasAnalysis ? '<span class="analysis-badge">Analyzed</span>' : ''}
        </div>
      </div>
    `;
  }

  setupJobItemListeners() {
    document.querySelectorAll('.job-item').forEach(item => {
      const jobId = item.dataset.jobId;
      const job = this.jobs.find(j => j.id === jobId);
      
      // Analyze button
      item.querySelector('[data-action="analyze"]').addEventListener('click', () => {
        this.analyzeJob(jobId);
      });

      // Open button
      item.querySelector('[data-action="open"]').addEventListener('click', () => {
        this.openJob(job);
      });

      // Remove button
      item.querySelector('[data-action="remove"]').addEventListener('click', () => {
        this.removeJob(jobId);
      });
    });
  }

  async analyzeJob(jobId) {
    try {
      const response = await this.sendMessage({ action: 'analyzeJob', jobId });
      
      if (response.success) {
        this.showSuccess('Job analyzed successfully!');
        this.loadJobs(); // Refresh to show analysis
      } else {
        throw new Error(response.error || 'Failed to analyze job');
      }
    } catch (error) {
      console.error('Error analyzing job:', error);
      this.showError('Failed to analyze job. Please try again.');
    }
  }

  openJob(job) {
    chrome.tabs.create({ url: job.url });
  }

  async removeJob(jobId) {
    if (!confirm('Are you sure you want to remove this job?')) {
      return;
    }

    try {
      // Remove from local storage
      const updatedJobs = this.jobs.filter(job => job.id !== jobId);
      await chrome.storage.local.set({ bookmarkedJobs: updatedJobs });
      
      this.jobs = updatedJobs;
      this.renderJobs();
      this.updateJobCount();
      this.showSuccess('Job removed successfully');
    } catch (error) {
      console.error('Error removing job:', error);
      this.showError('Failed to remove job. Please try again.');
    }
  }

  async loadAnalysis() {
    const analysisContent = document.getElementById('analysis-content');
    
    if (this.jobs.length === 0) {
      analysisContent.innerHTML = `
        <div class="empty-state">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <path d="M9 19c-5 0-7-2-7-5V6c0-3 2-5 7-5s7 2 7 5v8c0 3-2 5-7 5z"/>
            <path d="M15 13l-3-3-3 3"/>
          </svg>
          <h3>No Analysis Yet</h3>
          <p>Bookmark some jobs to see analysis results</p>
        </div>
      `;
      return;
    }

    const analyzedJobs = this.jobs.filter(job => job.analysis);
    
    if (analyzedJobs.length === 0) {
      analysisContent.innerHTML = `
        <div class="empty-state">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <path d="M9 19c-5 0-7-2-7-5V6c0-3 2-5 7-5s7 2 7 5v8c0 3-2 5-7 5z"/>
            <path d="M15 13l-3-3-3 3"/>
          </svg>
          <h3>No Analysis Yet</h3>
          <p>Analyze your bookmarked jobs to see insights</p>
        </div>
      `;
      return;
    }

    // Render analysis results
    analysisContent.innerHTML = this.createAnalysisHTML(analyzedJobs);
  }

  createAnalysisHTML(analyzedJobs) {
    return analyzedJobs.map(job => `
      <div class="analysis-item">
        <h3>${this.escapeHtml(job.title)}</h3>
        <p class="company">${this.escapeHtml(job.company)}</p>
        <div class="analysis-results">
          <div class="analysis-section">
            <h4>Skills Match</h4>
            <p>Match: ${job.analysis.skillsMatch.matchPercentage}%</p>
            <p>Missing: ${job.analysis.skillsMatch.missingSkills.join(', ')}</p>
          </div>
          <div class="analysis-section">
            <h4>Application Readiness</h4>
            <p>Score: ${job.analysis.applicationReadiness.score}/100</p>
          </div>
        </div>
      </div>
    `).join('');
  }

  async loadInsights() {
    const insightsContent = document.getElementById('insights-content');
    
    if (this.jobs.length === 0) {
      insightsContent.innerHTML = `
        <div class="empty-state">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
          </svg>
          <h3>No Insights Yet</h3>
          <p>Bookmark and analyze jobs to get personalized insights</p>
        </div>
      `;
      return;
    }

    // Generate insights based on bookmarked jobs
    const insights = this.generateInsights();
    insightsContent.innerHTML = this.createInsightsHTML(insights);
  }

  generateInsights() {
    const skills = new Set();
    const companies = new Set();
    const locations = new Set();
    
    this.jobs.forEach(job => {
      if (job.skills) {
        job.skills.forEach(skill => skills.add(skill));
      }
      companies.add(job.company);
      locations.add(job.location);
    });

    return {
      topSkills: Array.from(skills).slice(0, 5),
      topCompanies: Array.from(companies).slice(0, 3),
      locations: Array.from(locations),
      totalJobs: this.jobs.length,
      analyzedJobs: this.jobs.filter(job => job.analysis).length
    };
  }

  createInsightsHTML(insights) {
    return `
      <div class="insights-dashboard">
        <div class="insight-card">
          <h3>Your Job Collection</h3>
          <p>${insights.totalJobs} jobs bookmarked</p>
          <p>${insights.analyzedJobs} jobs analyzed</p>
        </div>
        
        <div class="insight-card">
          <h3>Top Skills</h3>
          <ul>
            ${insights.topSkills.map(skill => `<li>${this.escapeHtml(skill)}</li>`).join('')}
          </ul>
        </div>
        
        <div class="insight-card">
          <h3>Companies of Interest</h3>
          <ul>
            ${insights.topCompanies.map(company => `<li>${this.escapeHtml(company)}</li>`).join('')}
          </ul>
        </div>
      </div>
    `;
  }

  async syncWithCareerOS() {
    try {
      const response = await this.sendMessage({ action: 'syncWithCareerOS' });
      
      if (response.success) {
        this.showSuccess('Synced with CareerOS successfully!');
      } else {
        throw new Error(response.error || 'Failed to sync with CareerOS');
      }
    } catch (error) {
      console.error('Error syncing with CareerOS:', error);
      this.showError('Failed to sync with CareerOS. Please try again.');
    }
  }

  openCareerOS() {
    chrome.tabs.create({ url: 'http://localhost:3000' });
  }

  openSettings() {
    chrome.runtime.openOptionsPage();
  }

  showHelp() {
    chrome.tabs.create({ url: 'https://career-os.vercel.app/help' });
  }

  updateJobCount() {
    const jobCount = this.jobs.length;
    document.getElementById('job-count').textContent = `${jobCount} job${jobCount !== 1 ? 's' : ''} bookmarked`;
  }

  sendMessage(message) {
    console.log('Popup: Sending message:', message);
    return new Promise((resolve) => {
      chrome.runtime.sendMessage(message, (response) => {
        console.log('Popup: Message response:', response);
        resolve(response);
      });
    });
  }

  showSuccess(message) {
    // Simple success notification
    console.log('Success:', message);
    // Could implement toast notifications here
  }

  showError(message) {
    // Simple error notification
    console.error('Error:', message);
    // Could implement toast notifications here
  }

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}

// Initialize the popup when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  try {
    console.log('Popup: DOM loaded, initializing...');
    new CareerOSPopup();
  } catch (error) {
    console.error('Popup: Error during initialization:', error);
    // Show error message to user
    document.body.innerHTML = `
      <div style="padding: 20px; text-align: center;">
        <h2>Extension Error</h2>
        <p>There was an error loading the extension popup.</p>
        <p>Please try refreshing the extension.</p>
        <p>Error: ${error.message}</p>
      </div>
    `;
  }
});
