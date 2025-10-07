// CareerOS Job Collector - Environment Configuration
// Handles different environments (development, staging, production)

export interface EnvironmentConfig {
  careerOSUrl: string;
  apiEndpoint: string;
  environment: 'development' | 'staging' | 'production';
  debug: boolean;
  features: {
    autoAnalyze: boolean;
    notifications: boolean;
    syncWithCareerOS: boolean;
    advancedAnalysis: boolean;
  };
}

// Environment detection
function detectEnvironment(): 'development' | 'staging' | 'production' {
  // Check if we're in development mode
  if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.getManifest) {
    const manifest = chrome.runtime.getManifest();
    // Development extensions typically have version like "1.0.0" or "0.0.1"
    // Production extensions have more structured versions
    if (manifest.version.includes('dev') || manifest.version.includes('local')) {
      return 'development';
    }
  }

  // Check for localhost in any stored URLs
  if (typeof chrome !== 'undefined' && chrome.storage) {
    // This is async, so we'll handle it in the config getter
    return 'development'; // Default to development for now
  }

  return 'production';
}

// Configuration for different environments
const configs: Record<string, EnvironmentConfig> = {
  development: {
    careerOSUrl: 'http://localhost:3000',
    apiEndpoint: 'http://localhost:3000/api',
    environment: 'development',
    debug: true,
    features: {
      autoAnalyze: true,
      notifications: true,
      syncWithCareerOS: true,
      advancedAnalysis: true,
    },
  },
  staging: {
    careerOSUrl: 'https://staging.career-os.vercel.app',
    apiEndpoint: 'https://staging.career-os.vercel.app/api',
    environment: 'staging',
    debug: true,
    features: {
      autoAnalyze: true,
      notifications: true,
      syncWithCareerOS: true,
      advancedAnalysis: true,
    },
  },
  production: {
    careerOSUrl: 'https://career-os.vercel.app',
    apiEndpoint: 'https://career-os.vercel.app/api',
    environment: 'production',
    debug: false,
    features: {
      autoAnalyze: true,
      notifications: true,
      syncWithCareerOS: true,
      advancedAnalysis: true,
    },
  },
};

// Get configuration based on environment
export function getConfig(): EnvironmentConfig {
  const env = detectEnvironment();
  return configs[env];
}

// Get configuration with user overrides
export async function getConfigWithOverrides(): Promise<EnvironmentConfig> {
  const baseConfig = getConfig();
  
  // Check for user-defined settings
  if (typeof chrome !== 'undefined' && chrome.storage) {
    try {
      const result = await chrome.storage.local.get(['settings']);
      const userSettings = result.settings;
      
      if (userSettings && userSettings.careerOSUrl) {
        // User has overridden the CareerOS URL
        return {
          ...baseConfig,
          careerOSUrl: userSettings.careerOSUrl,
          apiEndpoint: `${userSettings.careerOSUrl}/api`,
        };
      }
    } catch (error) {
      console.warn('Could not load user settings, using default config:', error);
    }
  }
  
  return baseConfig;
}

// Environment-specific feature flags
export function isFeatureEnabled(feature: keyof EnvironmentConfig['features']): boolean {
  const config = getConfig();
  return config.features[feature];
}

// Debug logging
export function debugLog(message: string, ...args: any[]): void {
  const config = getConfig();
  if (config.debug) {
    console.log(`[CareerOS Extension] ${message}`, ...args);
  }
}

// Environment validation
export function validateEnvironment(): { isValid: boolean; errors: string[] } {
  const config = getConfig();
  const errors: string[] = [];

  // Validate CareerOS URL
  try {
    new URL(config.careerOSUrl);
  } catch {
    errors.push(`Invalid CareerOS URL: ${config.careerOSUrl}`);
  }

  // Validate API endpoint
  try {
    new URL(config.apiEndpoint);
  } catch {
    errors.push(`Invalid API endpoint: ${config.apiEndpoint}`);
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

// Auto-detect CareerOS URL (for development)
export async function autoDetectCareerOSUrl(): Promise<string | null> {
  const possibleUrls = [
    'http://localhost:3000',
    'http://localhost:3001',
    'http://127.0.0.1:3000',
    'http://127.0.0.1:3001',
  ];

  for (const url of possibleUrls) {
    try {
      const response = await fetch(`${url}/api/health`, {
        method: 'GET',
        mode: 'cors',
        signal: AbortSignal.timeout(2000), // 2 second timeout
      });
      
      if (response.ok) {
        debugLog(`Auto-detected CareerOS at: ${url}`);
        return url;
      }
    } catch (error) {
      // Continue to next URL
      debugLog(`Failed to connect to ${url}:`, error);
    }
  }

  return null;
}

// Update configuration with auto-detected URL
export async function updateConfigWithAutoDetection(): Promise<EnvironmentConfig> {
  const config = getConfig();
  
  // Only auto-detect in development
  if (config.environment === 'development') {
    const detectedUrl = await autoDetectCareerOSUrl();
    if (detectedUrl) {
      return {
        ...config,
        careerOSUrl: detectedUrl,
        apiEndpoint: `${detectedUrl}/api`,
      };
    }
  }
  
  return config;
}
