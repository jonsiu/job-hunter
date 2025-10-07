// CareerOS Job Collector - Background Script (TypeScript)
// Handles extension lifecycle, data synchronization, and notifications

import { JobBookmark, JobAnalysis, ExtensionMessage, ExtensionResponse } from '../types';
import { settingsManager } from '../config/settings';
import { getConfigWithOverrides, debugLog } from '../config/environment';

class CareerOSBackground {
  constructor() {
    this.initializeExtension();
    this.setupEventListeners();
  }

  private async initializeExtension(): Promise<void> {
    debugLog('CareerOS Job Collector initialized');
    
    // Initialize settings manager
    await settingsManager.loadSettings();
    
    // Set up default storage
    const result = await chrome.storage.local.get(['bookmarkedJobs', 'userProfile']);
    
    if (!result.bookmarkedJobs) {
      await chrome.storage.local.set({ bookmarkedJobs: [] });
    }
    if (!result.userProfile) {
      await chrome.storage.local.set({ userProfile: null });
    }

    // Auto-detect CareerOS URL in development
    const config = await getConfigWithOverrides();
    if (config.environment === 'development') {
      const detected = await settingsManager.autoDetectCareerOSUrl();
      if (detected) {
        await settingsManager.updateSetting('careerOSUrl', detected);
        debugLog('Auto-detected CareerOS URL:', detected);
      }
    }
  }

  private setupEventListeners(): void {
    // Extension installation/update
    chrome.runtime.onInstalled.addListener((details) => {
      this.handleInstall(details);
    });

    // Message handling from content scripts and popup
    chrome.runtime.onMessage.addListener((request: ExtensionMessage, sender, sendResponse) => {
      this.handleMessage(request, sender, sendResponse);
      return true; // Keep message channel open for async responses
    });

    // Tab updates for job detection
    chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
      if (changeInfo.status === 'complete' && tab.url && this.isJobBoard(tab.url)) {
        this.injectJobDetector(tabId);
      }
    });
  }

  private handleInstall(details: chrome.runtime.InstalledDetails): void {
    if (details.reason === 'install') {
      debugLog('CareerOS Job Collector installed');
      this.showWelcomeNotification();
    } else if (details.reason === 'update') {
      debugLog('CareerOS Job Collector updated');
    }
  }

  private async handleMessage(
    request: ExtensionMessage, 
    sender: chrome.runtime.MessageSender, 
    sendResponse: (response: ExtensionResponse) => void
  ): Promise<void> {
    try {
      let response: ExtensionResponse;

      switch (request.action) {
        case 'bookmarkJob':
          await this.bookmarkJob(request.jobData!);
          response = { success: true };
          break;

        case 'getBookmarkedJobs':
          const jobs = await this.getBookmarkedJobs();
          response = { success: true, jobs };
          break;

        case 'analyzeJob':
          const analysis = await this.analyzeJob(request.jobId!);
          response = { success: true, analysis };
          break;

        case 'syncWithCareerOS':
          await this.syncWithCareerOS();
          response = { success: true };
          break;

        case 'updateBadge':
          this.updateBadge(request.count!);
          response = { success: true };
          break;

        default:
          response = { success: false, error: 'Unknown action' };
      }

      sendResponse(response);
    } catch (error) {
      console.error('Error handling message:', error);
      sendResponse({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
    }
  }

  private async bookmarkJob(jobData: JobBookmark): Promise<void> {
    try {
      const result = await chrome.storage.local.get(['bookmarkedJobs']);
      const bookmarkedJobs: JobBookmark[] = result.bookmarkedJobs || [];
      
      // Check if job already exists
      const existingJob = bookmarkedJobs.find(job => job.url === jobData.url);
      if (existingJob) {
        throw new Error('Job already bookmarked');
      }

      // Add new job with metadata
      const newJob: JobBookmark = {
        ...jobData,
        id: this.generateJobId(),
        bookmarkedAt: new Date().toISOString(),
        lastAnalyzed: undefined,
        analysis: undefined
      };

      bookmarkedJobs.push(newJob);
      await chrome.storage.local.set({ bookmarkedJobs });

      // Update badge count
      this.updateBadge(bookmarkedJobs.length);

      // Auto-analyze if enabled
      const settings = settingsManager.getSettings();
      if (settings?.autoAnalyze) {
        this.analyzeJob(newJob.id);
      }

      // Sync with CareerOS if enabled
      if (settings?.syncWithCareerOS) {
        this.syncJobWithCareerOS(newJob);
      }

      console.log('Job bookmarked:', newJob.title);
    } catch (error) {
      console.error('Error bookmarking job:', error);
      throw error;
    }
  }

  private async getBookmarkedJobs(): Promise<JobBookmark[]> {
    const result = await chrome.storage.local.get(['bookmarkedJobs']);
    return result.bookmarkedJobs || [];
  }

  private async analyzeJob(jobId: string): Promise<JobAnalysis> {
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

  private async performJobAnalysis(job: JobBookmark): Promise<JobAnalysis> {
    // This would integrate with CareerOS analysis API
    // For now, return mock analysis
    return {
      jobId: job.id,
      skillsMatch: {
        matchedSkills: ['JavaScript', 'React', 'Node.js'],
        missingSkills: ['TypeScript', 'AWS'],
        matchPercentage: 75,
        prioritySkills: ['TypeScript', 'AWS']
      },
      requirementsGap: {
        missingRequirements: ['5+ years experience', 'AWS certification'],
        experienceGap: { years: 2, type: 'senior' },
        educationGap: { required: 'Bachelor\'s', current: 'Bachelor\'s' },
        certificationGap: { required: ['AWS Certified Developer'], current: [] }
      },
      salaryBenchmark: {
        marketRate: 120000,
        userCurrentSalary: 95000,
        salaryGap: 25000,
        negotiationRoom: 15000,
        benefitsComparison: { 
          health: 'good', 
          retirement: 'excellent',
          vacation: 'standard',
          other: []
        }
      },
      companyCulture: {
        score: 85,
        workLifeBalance: 8,
        diversity: 7,
        growth: 9,
        values: ['Innovation', 'Collaboration', 'Growth']
      },
      applicationReadiness: {
        score: 75,
        strengths: ['Strong technical skills', 'Relevant experience'],
        weaknesses: ['Missing AWS experience', 'Need more senior-level projects'],
        recommendations: ['Get AWS certification', 'Build a senior-level project']
      },
      recommendations: [
        {
          type: 'skill',
          priority: 'high',
          title: 'Learn TypeScript',
          description: 'TypeScript is highly valued in modern web development',
          timeToComplete: '2-3 months',
          resources: ['TypeScript Handbook', 'Online courses']
        }
      ]
    };
  }

  private async syncWithCareerOS(): Promise<void> {
    try {
      const jobs = await this.getBookmarkedJobs();
      const settings = settingsManager.getSettings();
      
      if (!settings?.careerOSUrl) {
        throw new Error('CareerOS URL not configured');
      }
      
      // This would integrate with CareerOS API
      debugLog('Syncing with CareerOS:', settings.careerOSUrl);
      
      // Mock sync - in real implementation, this would make API calls
      debugLog('Synced', jobs.length, 'jobs with CareerOS');
    } catch (error) {
      console.error('Error syncing with CareerOS:', error);
      throw error;
    }
  }

  private async syncJobWithCareerOS(job: JobBookmark): Promise<void> {
    try {
      // This would make API call to CareerOS
      debugLog('Syncing job with CareerOS:', job.title);
    } catch (error) {
      console.error('Error syncing job with CareerOS:', error);
    }
  }

  private updateBadge(count: number): void {
    chrome.action.setBadgeText({ text: count > 0 ? count.toString() : '' });
    chrome.action.setBadgeBackgroundColor({ color: '#3B82F6' });
  }

  private isJobBoard(url: string): boolean {
    const jobBoards = [
      'linkedin.com/jobs',
      'indeed.com',
      'glassdoor.com',
      'angel.co',
      'stackoverflow.com/jobs',
      'remote.co',
      'weworkremotely.com'
    ];
    
    return jobBoards.some(board => url.includes(board));
  }

  private async injectJobDetector(tabId: number): Promise<void> {
    try {
      await chrome.scripting.executeScript({
        target: { tabId },
        files: ['content-scripts/job-detector.js']
      });
    } catch (error) {
      console.error('Error injecting job detector:', error);
    }
  }

  private showWelcomeNotification(): void {
    if (chrome.notifications) {
      chrome.notifications.create({
        type: 'basic',
        iconUrl: 'assets/icons/icon-48.png',
        title: 'CareerOS Job Collector',
        message: 'Welcome! Start bookmarking jobs to get personalized career insights.'
      });
    }
  }

  private generateJobId(): string {
    return 'job_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }
}

// Initialize the background script
new CareerOSBackground();
