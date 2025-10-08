// CareerOS Job Collector - Popup Script
// Handles popup interface and user interactions

class CareerOSPopup {
  constructor() {
    try {
      console.log('Popup: Constructor called');
      this.currentTab = 'jobs';
      this.jobs = [];
      this.authService = null;
      this.authCheckInterval = null;
      this.initialize();
    } catch (error) {
      console.error('Popup: Error in constructor:', error);
      throw error;
    }
  }

  async initialize() {
    console.log('CareerOS Popup initialized');
    
    // Initialize authentication service
    await this.initializeAuth();
    
    this.setupEventListeners();
    
    // Check if user is authenticated first
    const isAuthenticated = await this.checkAuthentication();
    if (!isAuthenticated) {
      this.showAuthenticationRequired();
      // Start periodic authentication check
      this.startPeriodicAuthCheck();
      return;
    }
    
    // User is authenticated, load the extension
    this.loadJobs();
    this.updateJobCount();
  }

  async initializeAuth() {
    try {
      // Load the Clerk authentication service
      const authScript = document.createElement('script');
      authScript.src = chrome.runtime.getURL('src/auth/clerk-auth.js');
      document.head.appendChild(authScript);
      
      // Wait for the script to load
      await new Promise((resolve) => {
        authScript.onload = resolve;
      });
      
      // Initialize the auth service
      this.authService = new ClerkAuthService();
      console.log('Authentication service initialized');
    } catch (error) {
      console.error('Failed to initialize authentication service:', error);
    }
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
    const syncBtn = document.getElementById('sync-btn');
    if (syncBtn) {
      console.log('Popup: Sync button found, adding event listener');
      syncBtn.addEventListener('click', () => {
        console.log('Popup: Sync button clicked');
        this.syncWithCareerOS();
      });
    } else {
      console.error('Popup: Sync button not found!');
    }

    const refreshBtn = document.getElementById('refresh-jobs');
    if (refreshBtn) {
      refreshBtn.addEventListener('click', () => {
        this.loadJobs();
      });
    }

    const openCareerOSBtn = document.getElementById('open-career-os');
    if (openCareerOSBtn) {
      openCareerOSBtn.addEventListener('click', () => {
        this.openCareerOS();
      });
    }

    const settingsBtn = document.getElementById('settings-btn');
    if (settingsBtn) {
      settingsBtn.addEventListener('click', () => {
        this.openSettings();
      });
    }

    const helpBtn = document.getElementById('help-btn');
    if (helpBtn) {
      helpBtn.addEventListener('click', () => {
        this.showHelp();
      });
    }

  }

  switchTab(tab) {
    // Update tab buttons
    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.classList.remove('active');
    });
    const activeTabBtn = document.querySelector(`[data-tab="${tab}"]`);
    if (activeTabBtn) {
      activeTabBtn.classList.add('active');
    }

    // Update tab content
    document.querySelectorAll('.tab-content').forEach(content => {
      content.classList.remove('active');
    });
    const activeTabContent = document.getElementById(`${tab}-tab`);
    if (activeTabContent) {
      activeTabContent.classList.add('active');
    }

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
    if (loadingState) {
      loadingState.style.display = 'flex';
    }
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
    let originalContent = '';
    const syncBtn = document.getElementById('sync-btn');
    
    try {
      console.log('Popup: Starting sync with CareerOS...');
      
      // Check if user is authenticated
      if (!this.authService || !this.authService.isUserAuthenticated()) {
        this.showAuthenticationRequired();
        return;
      }
      
      // Show loading state on sync button
      if (syncBtn) {
        originalContent = syncBtn.innerHTML;
        syncBtn.innerHTML = '<div class="spinner" style="width: 16px; height: 16px; border: 2px solid #e5e7eb; border-top: 2px solid #3B82F6; border-radius: 50%; animation: spin 1s linear infinite;"></div>';
        syncBtn.disabled = true;
      }
      
      const response = await this.sendMessage({ action: 'syncWithCareerOS' });
      
      console.log('Popup: Sync response:', response);
      
      if (response.success) {
        this.showSuccess('Synced with CareerOS successfully!');
        // Refresh jobs list to show updated data
        this.loadJobs();
      } else {
        throw new Error(response.error || 'Failed to sync with CareerOS');
      }
    } catch (error) {
      console.error('Error syncing with CareerOS:', error);
      
      // Handle authentication errors specially
      if (error.message.includes('Please log in to CareerOS first')) {
        this.showAuthenticationRequired();
      } else {
        this.showError(`Failed to sync with CareerOS: ${error.message}`);
      }
    } finally {
      // Restore sync button
      if (syncBtn && originalContent) {
        syncBtn.innerHTML = originalContent;
        syncBtn.disabled = false;
      }
    }
  }

  openCareerOS() {
    chrome.tabs.create({ url: 'http://localhost:3000' });
    
    // Show a helpful message
    this.showNotification('CareerOS opened in new tab. After signing in, click "I\'ve signed in - Check again"', 'info');
  }

  openSettings() {
    chrome.runtime.openOptionsPage();
  }

  showHelp() {
    chrome.tabs.create({ url: 'https://career-os.vercel.app/help' });
  }


  showAuthLoading() {
    const authBtn = document.getElementById('auth-btn');
    if (authBtn) {
      authBtn.innerHTML = '<div class="spinner" style="width: 16px; height: 16px; border: 2px solid #e5e7eb; border-top: 2px solid #3B82F6; border-radius: 50%; animation: spin 1s linear infinite;"></div>';
      authBtn.disabled = true;
    }
  }

  hideAuthLoading() {
    const authBtn = document.getElementById('auth-btn');
    if (authBtn) {
      authBtn.innerHTML = `
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/>
          <polyline points="10,17 15,12 10,7"/>
          <line x1="15" y1="12" x2="3" y2="12"/>
        </svg>
      `;
      authBtn.disabled = false;
    }
  }

  async checkAuthentication() {
    if (!this.authService) {
      console.log('Authentication service not available');
      return false;
    }
    
    try {
      console.log('Checking authentication status...');
      const isAuthenticated = await this.authService.checkAuthenticationStatus();
      console.log('Authentication status:', isAuthenticated);
      return isAuthenticated;
    } catch (error) {
      console.error('Error checking authentication:', error);
      return false;
    }
  }

  startPeriodicAuthCheck() {
    // Check authentication every 3 seconds when not authenticated
    this.authCheckInterval = setInterval(async () => {
      try {
        const isAuthenticated = await this.checkAuthentication();
        if (isAuthenticated) {
          console.log('Authentication detected! Reloading extension...');
          clearInterval(this.authCheckInterval);
          window.location.reload();
        }
      } catch (error) {
        console.error('Error in periodic auth check:', error);
      }
    }, 3000);
  }

  async checkAuthenticationAndReload() {
    const checkBtn = document.getElementById('check-auth-btn');
    if (checkBtn) {
      checkBtn.innerHTML = '<div class="spinner" style="width: 16px; height: 16px; border: 2px solid #e5e7eb; border-top: 2px solid #3B82F6; border-radius: 50%; animation: spin 1s linear infinite;"></div>';
      checkBtn.disabled = true;
    }

    try {
      console.log('Checking authentication after user signed in...');
      this.showNotification('Checking authentication...', 'info');
      
      const isAuthenticated = await this.checkAuthentication();
      
      if (isAuthenticated) {
        console.log('User is now authenticated! Reloading extension...');
        this.showSuccess('Authentication detected! Loading extension...');
        
        // Stop periodic check
        if (this.authCheckInterval) {
          clearInterval(this.authCheckInterval);
        }
        
        // Small delay to show success message
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      } else {
        console.log('User is still not authenticated');
        this.showError('Still not authenticated. Please make sure you are signed in to CareerOS and try again.');
      }
    } catch (error) {
      console.error('Error checking authentication:', error);
      this.showError(`Failed to check authentication: ${error.message}`);
    } finally {
      if (checkBtn) {
        checkBtn.innerHTML = `
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/>
            <path d="M21 3v5h-5"/>
            <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/>
            <path d="M3 21v-5h5"/>
          </svg>
          I've signed in - Check again
        `;
        checkBtn.disabled = false;
      }
    }
  }

  updateAuthUI() {
    const authBtn = document.getElementById('auth-btn');
    if (!authBtn || !this.authService) return;

    if (this.authService.isUserAuthenticated()) {
      authBtn.classList.add('authenticated');
      authBtn.title = 'Sign Out';
      authBtn.innerHTML = `
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
          <polyline points="16,17 21,12 16,7"/>
          <line x1="21" y1="12" x2="9" y2="12"/>
        </svg>
      `;
    } else {
      authBtn.classList.remove('authenticated');
      authBtn.title = 'Sign In';
      authBtn.innerHTML = `
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/>
          <polyline points="10,17 15,12 10,7"/>
          <line x1="15" y1="12" x2="3" y2="12"/>
        </svg>
      `;
    }
  }

  updateJobCount() {
    const jobCount = this.jobs.length;
    const jobCountElement = document.getElementById('job-count');
    if (jobCountElement) {
      jobCountElement.textContent = `${jobCount} job${jobCount !== 1 ? 's' : ''} bookmarked`;
    }
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
    console.log('Success:', message);
    this.showNotification(message, 'success');
  }

  showError(message) {
    console.error('Error:', message);
    this.showNotification(message, 'error');
  }

  showAuthenticationRequired() {
    // Replace the entire popup content with authentication screen
    document.body.innerHTML = `
      <div class="popup-container">
        <header class="popup-header">
          <div class="header-content">
            <img src="../assets/icons/icon-32.png" alt="CareerOS" class="header-icon">
            <div class="header-text">
              <h1>CareerOS Job Collector</h1>
              <p>Sign in required</p>
            </div>
          </div>
        </header>
        
        <main class="popup-content">
          <div class="auth-required">
            <div class="auth-icon">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/>
                <polyline points="10,17 15,12 10,7"/>
                <line x1="15" y1="12" x2="3" y2="12"/>
              </svg>
            </div>
            <h2>Sign in to CareerOS</h2>
            <p>You need to sign in to your CareerOS account to use this extension.</p>
            <button id="sign-in-btn" class="sign-in-button">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/>
                <polyline points="10,17 15,12 10,7"/>
                <line x1="15" y1="12" x2="3" y2="12"/>
              </svg>
              Sign in to CareerOS
            </button>
            <button id="check-auth-btn" class="check-auth-button">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/>
                <path d="M21 3v5h-5"/>
                <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/>
                <path d="M3 21v-5h5"/>
              </svg>
              I've signed in - Check again
            </button>
            <p class="auth-help">Don't have an account? <a href="http://localhost:3000/sign-up" target="_blank">Create one here</a></p>
          </div>
        </main>
      </div>
    `;
    
    // Add click handlers
    document.getElementById('sign-in-btn').addEventListener('click', () => {
      this.openCareerOS();
    });
    
    document.getElementById('check-auth-btn').addEventListener('click', async () => {
      await this.checkAuthenticationAndReload();
    });
  }

  showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
      <div class="notification-content">
        <span class="notification-message">${message}</span>
        <button class="notification-close" onclick="this.parentElement.parentElement.remove()">×</button>
      </div>
    `;
    
    // Add styles
    notification.style.cssText = `
      position: fixed;
      top: 10px;
      right: 10px;
      background: ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#3b82f6'};
      color: white;
      padding: 12px 16px;
      border-radius: 6px;
      font-size: 12px;
      font-weight: 500;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
      z-index: 1000;
      max-width: 300px;
      animation: slideIn 0.3s ease-out;
    `;
    
    // Add animation keyframes
    if (!document.querySelector('#notification-styles')) {
      const style = document.createElement('style');
      style.id = 'notification-styles';
      style.textContent = `
        @keyframes slideIn {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        .notification-content {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
        }
        .notification-close {
          background: none;
          border: none;
          color: white;
          font-size: 16px;
          cursor: pointer;
          padding: 0;
          width: 20px;
          height: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
      `;
      document.head.appendChild(style);
    }
    
    document.body.appendChild(notification);
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
      if (notification.parentElement) {
        notification.remove();
      }
    }, 5000);
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
    window.careerOSPopup = new CareerOSPopup();
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

// Cleanup when popup is closed
window.addEventListener('beforeunload', () => {
  if (window.careerOSPopup && window.careerOSPopup.authCheckInterval) {
    clearInterval(window.careerOSPopup.authCheckInterval);
  }
});
