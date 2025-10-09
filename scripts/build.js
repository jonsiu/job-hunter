#!/usr/bin/env node

// CareerOS Job Collector - Build Script
// Handles TypeScript compilation and environment configuration

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Environment configuration
const ENVIRONMENTS = {
  development: {
    careerOSUrl: 'http://localhost:3000',
    debug: true,
  },
  staging: {
    careerOSUrl: 'https://staging.career-os.vercel.app',
    debug: true,
  },
  production: {
    careerOSUrl: 'https://career-os.vercel.app',
    debug: false,
  },
};

// Get environment from command line or default to development
const environment = process.argv[2] || 'development';

if (!ENVIRONMENTS[environment]) {
  console.error(`Unknown environment: ${environment}`);
  console.error('Available environments: development, staging, production');
  process.exit(1);
}

console.log(`Building CareerOS Job Collector for ${environment} environment...`);

// Clean dist directory
if (fs.existsSync('dist')) {
  fs.rmSync('dist', { recursive: true });
}

// Compile TypeScript
console.log('Compiling TypeScript...');
try {
  execSync('npx tsc', { stdio: 'inherit' });
  console.log('✅ TypeScript compilation completed');
} catch (error) {
  console.error('❌ TypeScript compilation failed:', error.message);
  process.exit(1);
}

// Copy static assets
console.log('Copying static assets...');
const assetsDir = 'assets';
const distAssetsDir = 'dist/assets';

// Directories and files to exclude from copying
const excludePatterns = [
  'tests',
  '__tests__',
  'node_modules',
  'dist',
  'src',
  'scripts',
  '*.test.js',
  '*.test.ts',
  '*.spec.js',
  '*.spec.ts',
  'jest.config.js',
  'jest.setup.js',
  'tsconfig.json',
  'package.json',
  'package-lock.json'
];

if (fs.existsSync(assetsDir)) {
  if (!fs.existsSync(distAssetsDir)) {
    fs.mkdirSync(distAssetsDir, { recursive: true });
  }
  
  // Copy assets recursively with exclusions
  function copyRecursive(src, dest) {
    const stats = fs.statSync(src);
    if (stats.isDirectory()) {
      // Skip excluded directories
      if (excludePatterns.some(pattern => src.includes(pattern))) {
        return;
      }
      
      if (!fs.existsSync(dest)) {
        fs.mkdirSync(dest);
      }
      const files = fs.readdirSync(src);
      files.forEach(file => {
        const srcPath = path.join(src, file);
        const destPath = path.join(dest, file);
        
        // Skip excluded files
        if (excludePatterns.some(pattern => file.includes(pattern))) {
          return;
        }
        
        copyRecursive(srcPath, destPath);
      });
    } else {
      // Skip excluded files
      if (excludePatterns.some(pattern => src.includes(pattern))) {
        return;
      }
      fs.copyFileSync(src, dest);
    }
  }
  
  copyRecursive(assetsDir, distAssetsDir);
  console.log('✅ Assets copied');
}

// Copy manifest.json
const manifestSrc = 'src/manifest.json';
const manifestDest = 'dist/manifest.json';

if (fs.existsSync(manifestSrc)) {
  fs.copyFileSync(manifestSrc, manifestDest);
  console.log('✅ Manifest copied');
}

// Generate environment-specific configuration
console.log('Generating environment configuration...');
const config = ENVIRONMENTS[environment];

// Create environment config file
const envConfig = {
  environment,
  ...config,
  buildTime: new Date().toISOString(),
};

const envConfigPath = 'dist/config/environment.json';
const envConfigDir = path.dirname(envConfigPath);

if (!fs.existsSync(envConfigDir)) {
  fs.mkdirSync(envConfigDir, { recursive: true });
}

fs.writeFileSync(envConfigPath, JSON.stringify(envConfig, null, 2));
console.log('✅ Environment configuration generated');

// Update manifest with environment-specific settings
const manifestPath = 'dist/manifest.json';
if (fs.existsSync(manifestPath)) {
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  
  // Add environment-specific host permissions
  if (environment === 'development') {
    manifest.host_permissions.push('http://localhost:3000/*');
    manifest.host_permissions.push('http://127.0.0.1:3000/*');
  }
  
  // Update version for development builds
  if (environment === 'development') {
    manifest.version = manifest.version + '.dev';
  }
  
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
  console.log('✅ Manifest updated for environment');
}

// Create build info
const buildInfo = {
  environment,
  buildTime: new Date().toISOString(),
  version: require('../package.json').version,
  nodeVersion: process.version,
  platform: process.platform,
};

const buildInfoPath = 'dist/build-info.json';
fs.writeFileSync(buildInfoPath, JSON.stringify(buildInfo, null, 2));

console.log('🎉 Build completed successfully!');
console.log(`📁 Output directory: dist/`);
console.log(`🌍 Environment: ${environment}`);
console.log(`🔗 CareerOS URL: ${config.careerOSUrl}`);
console.log('');
console.log('To load the extension in Chrome:');
console.log('1. Open chrome://extensions/');
console.log('2. Enable "Developer mode"');
console.log('3. Click "Load unpacked"');
console.log('4. Select the "dist" directory');
