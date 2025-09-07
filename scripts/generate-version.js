#!/usr/bin/env node

// ABOUTME: Automatically generates version info using git commit hash and timestamp for cache busting

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function generateVersionInfo() {
  try {
    // Get git commit hash (short version)
    const gitHash = execSync('git rev-parse --short HEAD', { encoding: 'utf8' }).trim();
    
    // Get git branch name
    const gitBranch = execSync('git rev-parse --abbrev-ref HEAD', { encoding: 'utf8' }).trim();
    
    // Generate build timestamp
    const buildTime = new Date().toISOString();
    
    // Create version object
    const versionInfo = {
      hash: gitHash,
      branch: gitBranch,
      buildTime: buildTime,
      timestamp: Date.now()
    };
    
    // Write to version.json in public folder (accessible via fetch)
    const publicVersionPath = path.join(__dirname, '../public/version.json');
    fs.writeFileSync(publicVersionPath, JSON.stringify(versionInfo, null, 2));
    
    // Write to src folder as JS module (for build-time injection)
    const srcVersionPath = path.join(__dirname, '../src/version.ts');
    const versionModule = `// ABOUTME: Auto-generated version info - DO NOT EDIT MANUALLY
// This file is generated automatically during build process

export const VERSION_INFO = ${JSON.stringify(versionInfo, null, 2)} as const;

export const APP_VERSION = '${gitHash}';
export const BUILD_TIME = '${buildTime}';
export const BUILD_TIMESTAMP = ${Date.now()};
`;
    
    fs.writeFileSync(srcVersionPath, versionModule);
    
    console.log(`✅ Version info generated: ${gitHash} (${gitBranch}) - ${buildTime}`);
    
    return versionInfo;
    
  } catch (error) {
    console.error('❌ Failed to generate version info:', error.message);
    
    // Fallback version info
    const fallbackInfo = {
      hash: 'unknown',
      branch: 'unknown',
      buildTime: new Date().toISOString(),
      timestamp: Date.now()
    };
    
    // Still write fallback files
    const publicVersionPath = path.join(__dirname, '../public/version.json');
    const srcVersionPath = path.join(__dirname, '../src/version.ts');
    
    fs.writeFileSync(publicVersionPath, JSON.stringify(fallbackInfo, null, 2));
    fs.writeFileSync(srcVersionPath, `// ABOUTME: Auto-generated version info - DO NOT EDIT MANUALLY
export const VERSION_INFO = ${JSON.stringify(fallbackInfo, null, 2)} as const;
export const APP_VERSION = '${fallbackInfo.hash}';
export const BUILD_TIME = '${fallbackInfo.buildTime}';
export const BUILD_TIMESTAMP = ${fallbackInfo.timestamp};
`);
    
    return fallbackInfo;
  }
}

// Run immediately if called directly
if (import.meta.url === `file://${process.argv[1]}` || 
    import.meta.url.endsWith(process.argv[1]) ||
    process.argv[1].endsWith('generate-version.js')) {
  generateVersionInfo();
}

export { generateVersionInfo };