// CareerOS Job Collector - Background Script
// Handles extension lifecycle, data synchronization, and notifications

class CareerOSBackground {
  constructor() {
    this.initializeExtension();
    this.setupEventListeners();
  }

  initializeExtension() {
    console.log('CareerOS Job Collector initialized');
    
    // Set up default storage
    chrome.storage.local.get(['bookmarkedJobs', 'userProfile', 'settings'], (result) => {
      if (!result.bookmarkedJobs) {
        chrome.storage.local.set({ bookmarkedJobs: [] });
      }
      if (!result.userProfile) {
        chrome.storage.local.set({ userProfile: null });
      }
      if (!result.settings) {
        chrome.storage.local.set({ 
          settings: {
            autoAnalyze: true,
            notifications: true,
            syncWithCareerOS: true,
            careerOSUrl: 'http://localhost:3000'
          }
        });
      }
    });
  }

  setupEventListeners() {
    // Extension installation/update
    chrome.runtime.onInstalled.addListener((details) => {
      this.handleInstall(details);
    });

    // Message handling from content scripts and popup
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      this.handleMessage(request, sender, sendResponse);
      return true; // Keep message channel open for async responses
    }.bind(this));

    // Tab updates for job detection
    chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
      if (changeInfo.status === 'complete' && tab.url && this.isJobBoard(tab.url)) {
        this.injectJobDetector(tabId);
      }
    });
  }

  handleInstall(details) {
    if (details.reason === 'install') {
      console.log('CareerOS Job Collector installed');
      this.showWelcomeNotification();
    } else if (details.reason === 'update') {
      console.log('CareerOS Job Collector updated');
    }
  }

  async handleMessage(request, sender, sendResponse) {
    try {
      switch (request.action) {
        case 'bookmarkJob':
          await this.bookmarkJob(request.jobData);
          sendResponse({ success: true });
          break;

        case 'getBookmarkedJobs':
          const jobs = await this.getBookmarkedJobs();
          sendResponse({ success: true, jobs });
          break;

        case 'analyzeJob':
          const analysis = await this.analyzeJob(request.jobId);
          sendResponse({ success: true, analysis });
          break;

        case 'syncWithCareerOS':
          await this.syncWithCareerOS();
          sendResponse({ success: true });
          break;

        case 'updateBadge':
          this.updateBadge(request.count);
          sendResponse({ success: true });
          break;

        case 'ping':
          console.log('Background: Received ping request');
          sendResponse({ success: true, message: 'Background script is alive' });
          break;

        case 'testConnection':
          console.log('Background: Received testConnection request for URL:', request.url);
          try {
            const connectionResult = await this.testConnection(request.url);
            console.log('Background: Connection test result:', connectionResult);
            sendResponse(connectionResult);
          } catch (error) {
            console.error('Background: Error in testConnection:', error);
            sendResponse({ success: false, error: error.message });
          }
          break;

        default:
          console.log('Background: Unknown action:', request.action);
          sendResponse({ success: false, error: 'Unknown action: ' + request.action });
      }
    } catch (error) {
      console.error('Error handling message:', error);
      sendResponse({ success: false, error: error.message });
    }
  }

  async bookmarkJob(jobData) {
    try {
      const result = await chrome.storage.local.get(['bookmarkedJobs']);
      const bookmarkedJobs = result.bookmarkedJobs || [];
      
      // Check if job already exists
      const existingJob = bookmarkedJobs.find(job => job.url === jobData.url);
      if (existingJob) {
        throw new Error('Job already bookmarked');
      }

      // Add new job with metadata
      const newJob = {
        id: this.generateJobId(),
        ...jobData,
        bookmarkedAt: new Date().toISOString(),
        lastAnalyzed: null,
        analysis: null
      };

      bookmarkedJobs.push(newJob);
      await chrome.storage.local.set({ bookmarkedJobs });

      // Update badge count
      this.updateBadge(bookmarkedJobs.length);

      // Auto-analyze if enabled
      const settings = await this.getSettings();
      if (settings.autoAnalyze) {
        this.analyzeJob(newJob.id);
      }

      // Sync with CareerOS if enabled
      if (settings.syncWithCareerOS) {
        this.syncJobWithCareerOS(newJob);
      }

      console.log('Job bookmarked:', newJob.title);
    } catch (error) {
      console.error('Error bookmarking job:', error);
      throw error;
    }
  }

  async getBookmarkedJobs() {
    const result = await chrome.storage.local.get(['bookmarkedJobs']);
    return result.bookmarkedJobs || [];
  }

  async analyzeJob(jobId) {
    try {
      const jobs = await this.getBookmarkedJobs();
      const job = jobs.find(j => j.id === jobId);
      
      if (!job) {
        throw new Error('Job not found');
      }

      // Perform analysis (this would integrate with CareerOS analysis API)
      const analysis = await this.performJobAnalysis(job);
      
      // Update job with analysis
      const updatedJobs = jobs.map(j => 
        j.id === jobId 
          ? { ...j, analysis, lastAnalyzed: new Date().toISOString() }
          : j
      );
      
      await chrome.storage.local.set({ bookmarkedJobs: updatedJobs });
      
      return analysis;
    } catch (error) {
      console.error('Error analyzing job:', error);
      throw error;
    }
  }

  async performJobAnalysis(job) {
    // This would integrate with CareerOS analysis API
    // For now, return mock analysis
    return {
      skillsMatch: {
        matchedSkills: ['JavaScript', 'React', 'Node.js'],
        missingSkills: ['TypeScript', 'AWS'],
        matchPercentage: 75,
        prioritySkills: ['TypeScript', 'AWS']
      },
      requirementsGap: {
        missingRequirements: ['5+ years experience', 'AWS certification'],
        experienceGap: { years: 2, type: 'senior' },
        educationGap: null,
        certificationGap: ['AWS Certified Developer']
      },
      salaryBenchmark: {
        marketRate: 120000,
        userCurrentSalary: 95000,
        salaryGap: 25000,
        negotiationRoom: 15000,
        benefitsComparison: { health: 'good', retirement: 'excellent' }
      },
      applicationReadiness: {
        score: 75,
        strengths: ['Strong technical skills', 'Relevant experience'],
        weaknesses: ['Missing AWS experience', 'Need more senior-level projects'],
        recommendations: ['Get AWS certification', 'Build a senior-level project']
      }
    };
  }

  async syncWithCareerOS() {
    try {
      const settings = await this.getSettings();
      const jobs = await this.getBookmarkedJobs();
      
      if (!settings?.careerOSUrl) {
        throw new Error('CareerOS URL not configured');
      }
      
      console.log('Syncing with CareerOS:', settings.careerOSUrl);
      
      // Make API call to CareerOS
      const response = await fetch(`${settings.careerOSUrl}/api/jobs/sync`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ jobs })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      console.log('Synced with CareerOS:', result);
      
      return result;
    } catch (error) {
      console.error('Error syncing with CareerOS:', error);
      throw error;
    }
  }

  async syncJobWithCareerOS(job) {
    try {
      const settings = await this.getSettings();
      
      if (!settings?.careerOSUrl) {
        console.warn('CareerOS URL not configured, skipping job sync');
        return;
      }
      
      console.log('Syncing job with CareerOS:', job.title);
      
      // Make API call to CareerOS
      const response = await fetch(`${settings.careerOSUrl}/api/jobs/bookmark`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(job)
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      console.log('Job synced with CareerOS:', result);
      
    } catch (error) {
      console.error('Error syncing job with CareerOS:', error);
    }
  }

  async getSettings() {
    const result = await chrome.storage.local.get(['settings']);
    return result.settings || {};
  }

  updateBadge(count) {
    chrome.action.setBadgeText({ text: count > 0 ? count.toString() : '' });
    chrome.action.setBadgeBackgroundColor({ color: '#3B82F6' });
  }

  isJobBoard(url) {
    console.log('isJobBoard called with URL:', url, 'Type:', typeof url);
    
    if (!url || typeof url !== 'string') {
      console.log('isJobBoard: URL is invalid, returning false');
      return false;
    }
    
    const jobBoards = [
      'linkedin.com/jobs',
      'indeed.com',
      'glassdoor.com',
      'angel.co',
      'stackoverflow.com/jobs',
      'remote.co',
      'weworkremotely.com'
    ];
    
    const result = jobBoards.some(board => url.includes(board));
    console.log('isJobBoard result:', result);
    return result;
  }

  async injectJobDetector(tabId) {
    try {
      await chrome.scripting.executeScript({
        target: { tabId },
        files: ['content-scripts/job-detector.js']
      });
    } catch (error) {
      console.error('Error injecting job detector:', error);
    }
  }

  showWelcomeNotification() {
    if (chrome.notifications) {
      chrome.notifications.create({
        type: 'basic',
        iconUrl: 'assets/icons/icon-48.png',
        title: 'CareerOS Job Collector',
        message: 'Welcome! Start bookmarking jobs to get personalized career insights.'
      });
    }
  }

  async testConnection(url) {
    try {
      if (!url) {
        return { success: false, error: 'URL is required' };
      }

      // Ensure URL has protocol
      if (!url.startsWith('http://') && !url.startsWith('https://')) {
        url = 'http://' + url;
      }

      console.log('Testing connection to:', url);
      
      // Create a timeout promise
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Connection timeout')), 10000);
      });

      // Test connection to CareerOS health endpoint
      const fetchPromise = fetch(`${url}/api/health`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      // Race between fetch and timeout
      const response = await Promise.race([fetchPromise, timeoutPromise]);

      if (response.ok) {
        const data = await response.json();
        console.log('Connection successful:', data);
        return { 
          success: true, 
          message: 'Connection successful!',
          data: data
        };
      } else {
        return { 
          success: false, 
          error: `HTTP ${response.status}: ${response.statusText}` 
        };
      }
    } catch (error) {
      console.error('Connection test failed:', error);
      
      // Provide more specific error messages
      if (error.message === 'Connection timeout') {
        return { 
          success: false, 
          error: 'Connection timeout. Please check if the server is running.' 
        };
      } else if (error.message.includes('Failed to fetch')) {
        return { 
          success: false, 
          error: 'Cannot connect to server. Please check the URL and ensure the server is running.' 
        };
      } else if (error.message.includes('CORS')) {
        return { 
          success: false, 
          error: 'CORS error. The server may not be configured to allow extension requests.' 
        };
      } else {
        return { 
          success: false, 
          error: `Connection failed: ${error.message}` 
        };
      }
    }
  }

  generateJobId() {
    return 'job_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }
}

// Initialize the background script
new CareerOSBackground();
