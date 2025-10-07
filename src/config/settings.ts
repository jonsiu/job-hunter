// CareerOS Job Collector - Settings Management
// Handles user settings and configuration persistence

import { ExtensionSettings } from '../types';
import { getConfigWithOverrides, debugLog } from './environment';

export class SettingsManager {
  private static instance: SettingsManager;
  private settings: ExtensionSettings | null = null;

  private constructor() {}

  static getInstance(): SettingsManager {
    if (!SettingsManager.instance) {
      SettingsManager.instance = new SettingsManager();
    }
    return SettingsManager.instance;
  }

  // Get default settings
  getDefaultSettings(): ExtensionSettings {
    return {
      autoAnalyze: true,
      notifications: true,
      syncWithCareerOS: true,
      careerOSUrl: 'http://localhost:3000', // Will be overridden by environment config
      enabledJobBoards: {
        linkedin: true,
        indeed: true,
        glassdoor: true,
        angelList: true,
        stackOverflow: true,
        remoteCo: true,
        weWorkRemotely: true,
      },
    };
  }

  // Load settings from storage
  async loadSettings(): Promise<ExtensionSettings> {
    try {
      const result = await chrome.storage.local.get(['settings']);
      this.settings = result.settings || this.getDefaultSettings();
      
      // Merge with environment configuration
      const envConfig = await getConfigWithOverrides();
      this.settings.careerOSUrl = envConfig.careerOSUrl;
      
      debugLog('Settings loaded:', this.settings);
      return this.settings;
    } catch (error) {
      console.error('Error loading settings:', error);
      this.settings = this.getDefaultSettings();
      return this.settings;
    }
  }

  // Save settings to storage
  async saveSettings(settings: ExtensionSettings): Promise<void> {
    try {
      await chrome.storage.local.set({ settings });
      this.settings = settings;
      debugLog('Settings saved:', settings);
    } catch (error) {
      console.error('Error saving settings:', error);
      throw error;
    }
  }

  // Get current settings
  getSettings(): ExtensionSettings | null {
    return this.settings;
  }

  // Update a specific setting
  async updateSetting<K extends keyof ExtensionSettings>(
    key: K,
    value: ExtensionSettings[K]
  ): Promise<void> {
    if (!this.settings) {
      await this.loadSettings();
    }

    if (this.settings) {
      this.settings[key] = value;
      await this.saveSettings(this.settings);
    }
  }

  // Reset settings to defaults
  async resetSettings(): Promise<void> {
    const defaultSettings = this.getDefaultSettings();
    await this.saveSettings(defaultSettings);
    debugLog('Settings reset to defaults');
  }

  // Validate settings
  validateSettings(settings: ExtensionSettings): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Validate CareerOS URL
    try {
      new URL(settings.careerOSUrl);
    } catch {
      errors.push(`Invalid CareerOS URL: ${settings.careerOSUrl}`);
    }

    // Validate at least one job board is enabled
    const enabledBoards = Object.values(settings.enabledJobBoards).filter(Boolean);
    if (enabledBoards.length === 0) {
      errors.push('At least one job board must be enabled');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  // Test CareerOS connection
  async testConnection(url?: string): Promise<{ success: boolean; error?: string }> {
    const testUrl = url || this.settings?.careerOSUrl;
    
    if (!testUrl) {
      return { success: false, error: 'No URL provided' };
    }

    try {
      const response = await fetch(`${testUrl}/api/health`, {
        method: 'GET',
        mode: 'cors',
        signal: AbortSignal.timeout(5000), // 5 second timeout
      });

      if (response.ok) {
        debugLog('CareerOS connection test successful:', testUrl);
        return { success: true };
      } else {
        return { 
          success: false, 
          error: `HTTP ${response.status}: ${response.statusText}` 
        };
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      debugLog('CareerOS connection test failed:', errorMessage);
      return { success: false, error: errorMessage };
    }
  }

  // Auto-detect CareerOS URL
  async autoDetectCareerOSUrl(): Promise<string | null> {
    const possibleUrls = [
      'http://localhost:3000',
      'http://localhost:3001',
      'http://127.0.0.1:3000',
      'http://127.0.0.1:3001',
    ];

    for (const url of possibleUrls) {
      const result = await this.testConnection(url);
      if (result.success) {
        debugLog('Auto-detected CareerOS URL:', url);
        return url;
      }
    }

    return null;
  }

  // Update CareerOS URL with auto-detection
  async updateCareerOSUrlWithAutoDetection(): Promise<boolean> {
    const detectedUrl = await this.autoDetectCareerOSUrl();
    
    if (detectedUrl && this.settings) {
      await this.updateSetting('careerOSUrl', detectedUrl);
      debugLog('Updated CareerOS URL to:', detectedUrl);
      return true;
    }

    return false;
  }

  // Export settings
  async exportSettings(): Promise<string> {
    const settings = await this.loadSettings();
    return JSON.stringify(settings, null, 2);
  }

  // Import settings
  async importSettings(settingsJson: string): Promise<{ success: boolean; error?: string }> {
    try {
      const settings = JSON.parse(settingsJson) as ExtensionSettings;
      
      // Validate imported settings
      const validation = this.validateSettings(settings);
      if (!validation.isValid) {
        return { 
          success: false, 
          error: `Invalid settings: ${validation.errors.join(', ')}` 
        };
      }

      await this.saveSettings(settings);
      debugLog('Settings imported successfully');
      return { success: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return { success: false, error: errorMessage };
    }
  }
}

// Export singleton instance
export const settingsManager = SettingsManager.getInstance();
