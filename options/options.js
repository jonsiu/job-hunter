// CareerOS Job Collector - Options Script
// Handles settings page functionality

class CareerOSOptions {
  constructor() {
    this.settings = {};
    this.initialize();
  }

  initialize() {
    console.log('CareerOS Options initialized');
    
    this.loadSettings();
    this.setupEventListeners();
    this.updateDataStats();
  }

  setupEventListeners() {
    // Save settings button
    document.getElementById('save-settings').addEventListener('click', () => {
      this.saveSettings();
    });

    // Reset settings button
    document.getElementById('reset-settings').addEventListener('click', () => {
      this.resetSettings();
    });

    // Test connection button
    document.getElementById('test-connection').addEventListener('click', () => {
      this.testConnection();
    });

    // Data management buttons
    document.getElementById('export-data').addEventListener('click', () => {
      this.exportData();
    });

    document.getElementById('import-data').addEventListener('click', () => {
      this.importData();
    });

    document.getElementById('clear-data').addEventListener('click', () => {
      this.clearData();
    });

    // Auto-save on input change
    document.querySelectorAll('.setting-checkbox, .setting-input').forEach(input => {
      input.addEventListener('change', () => {
        this.autoSave();
      });
    });
  }

  async loadSettings() {
    try {
      const result = await chrome.storage.local.get(['settings']);
      this.settings = result.settings || this.getDefaultSettings();
      
      // Populate form fields
      this.populateForm();
      
      // Update last updated time
      this.updateLastUpdated();
    } catch (error) {
      console.error('Error loading settings:', error);
      this.showError('Failed to load settings');
    }
  }

  getDefaultSettings() {
    return {
      autoAnalyze: true,
      notifications: true,
      syncWithCareerOS: true,
      careerOSUrl: 'http://localhost:3000',
      enabledJobBoards: {
        linkedin: true,
        indeed: true,
        glassdoor: true,
        angelList: true,
        stackOverflow: true,
        remoteCo: true,
        weWorkRemotely: true
      }
    };
  }

  populateForm() {
    // General settings
    document.getElementById('auto-analyze').checked = this.settings.autoAnalyze;
    document.getElementById('notifications').checked = this.settings.notifications;
    document.getElementById('sync-career-os').checked = this.settings.syncWithCareerOS;
    document.getElementById('career-os-url').value = this.settings.careerOSUrl;

    // Job board settings
    Object.keys(this.settings.enabledJobBoards).forEach(board => {
      const checkbox = document.getElementById(board);
      if (checkbox) {
        checkbox.checked = this.settings.enabledJobBoards[board];
      }
    });
  }

  async saveSettings() {
    try {
      // Collect form data
      this.settings.autoAnalyze = document.getElementById('auto-analyze').checked;
      this.settings.notifications = document.getElementById('notifications').checked;
      this.settings.syncWithCareerOS = document.getElementById('sync-career-os').checked;
      this.settings.careerOSUrl = document.getElementById('career-os-url').value;

      // Collect job board settings
      this.settings.enabledJobBoards = {
        linkedin: document.getElementById('linkedin').checked,
        indeed: document.getElementById('indeed').checked,
        glassdoor: document.getElementById('glassdoor').checked,
        angelList: document.getElementById('angel-list').checked,
        stackOverflow: document.getElementById('stack-overflow').checked,
        remoteCo: document.getElementById('remote-co').checked,
        weWorkRemotely: document.getElementById('we-work-remotely').checked
      };

      // Save to storage
      await chrome.storage.local.set({ settings: this.settings });
      
      this.showSuccess('Settings saved successfully!');
    } catch (error) {
      console.error('Error saving settings:', error);
      this.showError('Failed to save settings');
    }
  }

  async resetSettings() {
    if (!confirm('Are you sure you want to reset all settings to defaults?')) {
      return;
    }

    try {
      this.settings = this.getDefaultSettings();
      await chrome.storage.local.set({ settings: this.settings });
      
      this.populateForm();
      this.showSuccess('Settings reset to defaults');
    } catch (error) {
      console.error('Error resetting settings:', error);
      this.showError('Failed to reset settings');
    }
  }

  async testConnection() {
    const url = document.getElementById('career-os-url').value;
    
    if (!url) {
      this.showError('Please enter a CareerOS URL');
      return;
    }

    try {
      // Test connection to CareerOS
      const response = await fetch(`${url}/api/health`, {
        method: 'GET',
        mode: 'cors'
      });

      if (response.ok) {
        this.showSuccess('Connection successful!');
      } else {
        throw new Error('Connection failed');
      }
    } catch (error) {
      console.error('Connection test failed:', error);
      this.showError('Connection failed. Please check your URL and try again.');
    }
  }

  async updateDataStats() {
    try {
      const result = await chrome.storage.local.get(['bookmarkedJobs']);
      const jobs = result.bookmarkedJobs || [];
      
      const analyzedJobs = jobs.filter(job => job.analysis);
      
      // Update stats
      document.getElementById('job-count').textContent = jobs.length;
      document.getElementById('analyzed-count').textContent = analyzedJobs.length;
      
      // Calculate storage usage (rough estimate)
      const storageUsed = JSON.stringify(jobs).length;
      document.getElementById('storage-used').textContent = this.formatBytes(storageUsed);
    } catch (error) {
      console.error('Error updating data stats:', error);
    }
  }

  formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  async exportData() {
    try {
      const result = await chrome.storage.local.get(['bookmarkedJobs', 'settings']);
      
      const exportData = {
        version: '1.0.0',
        exportDate: new Date().toISOString(),
        bookmarkedJobs: result.bookmarkedJobs || [],
        settings: result.settings || {}
      };

      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = `career-os-data-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      this.showSuccess('Data exported successfully!');
    } catch (error) {
      console.error('Error exporting data:', error);
      this.showError('Failed to export data');
    }
  }

  async importData() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    
    input.onchange = async (e) => {
      const file = e.target.files[0];
      if (!file) return;

      try {
        const text = await file.text();
        const importData = JSON.parse(text);
        
        if (!importData.bookmarkedJobs || !Array.isArray(importData.bookmarkedJobs)) {
          throw new Error('Invalid data format');
        }

        // Import data
        await chrome.storage.local.set({
          bookmarkedJobs: importData.bookmarkedJobs,
          settings: importData.settings || this.settings
        });
        
        this.showSuccess('Data imported successfully!');
        this.updateDataStats();
      } catch (error) {
        console.error('Error importing data:', error);
        this.showError('Failed to import data. Please check the file format.');
      }
    };
    
    input.click();
  }

  async clearData() {
    if (!confirm('Are you sure you want to clear all data? This action cannot be undone.')) {
      return;
    }

    try {
      await chrome.storage.local.clear();
      this.settings = this.getDefaultSettings();
      this.populateForm();
      this.updateDataStats();
      this.showSuccess('All data cleared successfully!');
    } catch (error) {
      console.error('Error clearing data:', error);
      this.showError('Failed to clear data');
    }
  }

  async autoSave() {
    // Auto-save after a short delay
    clearTimeout(this.autoSaveTimeout);
    this.autoSaveTimeout = setTimeout(() => {
      this.saveSettings();
    }, 1000);
  }

  updateLastUpdated() {
    const lastUpdated = new Date().toLocaleDateString();
    document.getElementById('last-updated').textContent = lastUpdated;
  }

  showSuccess(message) {
    this.showNotification(message, 'success');
  }

  showError(message) {
    this.showNotification(message, 'error');
  }

  showNotification(message, type) {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    
    // Style the notification
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      padding: 12px 16px;
      border-radius: 6px;
      color: white;
      font-weight: 500;
      z-index: 1000;
      animation: slideIn 0.3s ease;
    `;
    
    if (type === 'success') {
      notification.style.background = '#10B981';
    } else {
      notification.style.background = '#EF4444';
    }
    
    // Add to page
    document.body.appendChild(notification);
    
    // Remove after 3 seconds
    setTimeout(() => {
      notification.style.animation = 'slideOut 0.3s ease';
      setTimeout(() => {
        if (notification.parentNode) {
          notification.parentNode.removeChild(notification);
        }
      }, 300);
    }, 3000);
  }
}

// Add CSS for notifications
const style = document.createElement('style');
style.textContent = `
  @keyframes slideIn {
    from {
      transform: translateX(100%);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }
  
  @keyframes slideOut {
    from {
      transform: translateX(0);
      opacity: 1;
    }
    to {
      transform: translateX(100%);
      opacity: 0;
    }
  }
`;
document.head.appendChild(style);

// Initialize the options page when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new CareerOSOptions();
});
