// ABOUTME: Edge function that returns current app version info for client-side update checking

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { getCorsHeaders, handleCorsPreflightRequest } from '../_shared/cors.ts';

// Version info interface
interface AppVersionInfo {
  hash: string;
  branch: string;
  buildTime: string;
  timestamp: number;
  environment: string;
}

// Get version info from environment variables (set during deployment)
function getVersionInfo(): AppVersionInfo {
  // These environment variables should be set during deployment
  // For example, in your CI/CD pipeline or Vercel/Netlify deployment
  const hash = Deno.env.get('EVIDENS_GIT_HASH') || 'unknown';
  const branch = Deno.env.get('EVIDENS_GIT_BRANCH') || 'unknown';
  const buildTime = Deno.env.get('EVIDENS_BUILD_TIME') || new Date().toISOString();
  const timestamp = parseInt(Deno.env.get('EVIDENS_BUILD_TIMESTAMP') || '0') || Date.now();
  const environment = Deno.env.get('EVIDENS_ENVIRONMENT') || 'production';

  return {
    hash,
    branch,
    buildTime,
    timestamp,
    environment
  };
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return handleCorsPreflightRequest(req);
  }

  const origin = req.headers.get('Origin');

  try {
    // Only allow GET requests
    if (req.method !== 'GET') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        {
          status: 405,
          headers: {
            'Content-Type': 'application/json',
            ...getCorsHeaders(origin),
          },
        }
      );
    }

    // Get version information
    const versionInfo = getVersionInfo();

    // Add cache headers for short-term caching
    const headers = {
      'Content-Type': 'application/json',
      'Cache-Control': 'public, max-age=60', // Cache for 1 minute
      'ETag': `"${versionInfo.hash}-${versionInfo.timestamp}"`,
      ...getCorsHeaders(origin),
    };

    // Check if client has current version (ETag)
    const ifNoneMatch = req.headers.get('If-None-Match');
    if (ifNoneMatch === `"${versionInfo.hash}-${versionInfo.timestamp}"`) {
      return new Response(null, {
        status: 304, // Not Modified
        headers,
      });
    }

    // Return version information
    return new Response(
      JSON.stringify({
        success: true,
        data: versionInfo,
        // Additional metadata for debugging
        serverTime: new Date().toISOString(),
        requestId: crypto.randomUUID(),
      }),
      {
        status: 200,
        headers,
      }
    );

  } catch (error) {
    console.error('Error in get-app-version:', error);

    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        message: error.message,
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          ...getCorsHeaders(origin),
        },
      }
    );
  }
});