// ABOUTME: Edge function for fetching link preview metadata with Open Graph support.

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { corsHeaders, handleCorsPreflightRequest } from '../_shared/cors.ts';
import { createSuccessResponse, createErrorResponse } from '../_shared/api-helpers.ts';
import { checkRateLimit, rateLimitHeaders, RateLimitError } from '../_shared/rate-limit.ts';

interface LinkPreviewRequest {
  url: string;
}

interface LinkPreviewData {
  url: string;
  title?: string;
  description?: string;
  image?: string;
  siteName?: string;
  domain: string;
  favicon?: string;
  author?: string;
  publishedTime?: string;
}

interface LinkPreviewResponse {
  success: boolean;
  preview?: LinkPreviewData;
  error?: string;
}

// Extract Open Graph and meta data from HTML
function extractMetadata(html: string, url: string): LinkPreviewData {
  const urlObj = new URL(url);
  const domain = urlObj.hostname;

  // Simple regex-based extraction (more reliable than DOM parsing in Deno)
  const ogTitle = html.match(
    /<meta[^>]*property=["']og:title["'][^>]*content=["']([^"']*?)["']/i
  )?.[1];
  const title = ogTitle || html.match(/<title[^>]*>([^<]*?)<\/title>/i)?.[1];

  const ogDescription = html.match(
    /<meta[^>]*property=["']og:description["'][^>]*content=["']([^"']*?)["']/i
  )?.[1];
  const metaDescription = html.match(
    /<meta[^>]*name=["']description["'][^>]*content=["']([^"']*?)["']/i
  )?.[1];
  const description = ogDescription || metaDescription;

  const ogImage = html.match(
    /<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']*?)["']/i
  )?.[1];
  const ogSiteName = html.match(
    /<meta[^>]*property=["']og:site_name["'][^>]*content=["']([^"']*?)["']/i
  )?.[1];
  const ogAuthor =
    html.match(
      /<meta[^>]*property=["']og:article:author["'][^>]*content=["']([^"']*?)["']/i
    )?.[1] || html.match(/<meta[^>]*name=["']author["'][^>]*content=["']([^"']*?)["']/i)?.[1];
  const ogPublished = html.match(
    /<meta[^>]*property=["']og:article:published_time["'][^>]*content=["']([^"']*?)["']/i
  )?.[1];

  // Extract favicon
  const favicon =
    html.match(/<link[^>]*rel=["'](?:icon|shortcut icon)["'][^>]*href=["']([^"']*?)["']/i)?.[1] ||
    html.match(/<link[^>]*href=["']([^"']*?)["'][^>]*rel=["'](?:icon|shortcut icon)["']/i)?.[1];

  // Resolve relative URLs
  const resolveUrl = (relativeUrl: string | undefined): string | undefined => {
    if (!relativeUrl) return undefined;
    try {
      return new URL(relativeUrl, url).href;
    } catch {
      return relativeUrl.startsWith('http') ? relativeUrl : undefined;
    }
  };

  return {
    url,
    domain,
    title: title?.trim(),
    description: description?.trim(),
    image: resolveUrl(ogImage),
    siteName: ogSiteName?.trim(),
    favicon: resolveUrl(favicon),
    author: ogAuthor?.trim(),
    publishedTime: ogPublished?.trim(),
  };
}

serve(async req => {
  // STEP 1: CORS Preflight Handling
  if (req.method === 'OPTIONS') {
    return handleCorsPreflightRequest();
  }

  try {
    // STEP 2: Rate Limiting (more permissive for link previews)
    const rateLimitResult = await checkRateLimit(req, { windowMs: 60000, maxRequests: 30 });
    if (!rateLimitResult.success) {
      throw RateLimitError;
    }

    // STEP 3: Input Validation
    const body: LinkPreviewRequest = await req.json();

    if (!body.url || typeof body.url !== 'string') {
      throw new Error('VALIDATION_FAILED: URL is required');
    }

    let url: URL;
    try {
      url = new URL(body.url);
    } catch {
      throw new Error('VALIDATION_FAILED: Invalid URL format');
    }

    if (url.protocol !== 'http:' && url.protocol !== 'https:') {
      throw new Error('VALIDATION_FAILED: Only HTTP and HTTPS URLs are supported');
    }

    // STEP 4: Fetch URL with proper headers
    console.log(`Fetching URL: ${url.href}`);

    const fetchResponse = await fetch(url.href, {
      method: 'GET',
      headers: {
        'User-Agent': 'EVIDENS-LinkBot/1.0 (+https://evidens.health)',
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'pt-BR,pt;q=0.9,en;q=0.8',
        'Accept-Encoding': 'gzip, deflate',
        'Cache-Control': 'no-cache',
        Pragma: 'no-cache',
      },
      // Add reasonable timeout
      signal: AbortSignal.timeout(10000), // 10 second timeout
    });

    if (!fetchResponse.ok) {
      throw new Error(`Failed to fetch URL (${fetchResponse.status})`);
    }

    const contentType = fetchResponse.headers.get('content-type') || '';
    if (!contentType.includes('text/html')) {
      throw new Error('URL does not return HTML content');
    }

    // STEP 5: Extract metadata
    const html = await fetchResponse.text();
    const preview = extractMetadata(html, url.href);

    // STEP 6: Validate extracted data
    if (!preview.title && !preview.description) {
      throw new Error('No meaningful metadata found');
    }

    const response: LinkPreviewResponse = {
      success: true,
      preview,
    };

    console.log(`Successfully extracted metadata for: ${url.href}`);
    console.log(`Title: ${preview.title}`);
    console.log(`Description: ${preview.description}`);
    console.log(`Image: ${preview.image}`);

    // STEP 7: Success Response
    return createSuccessResponse(response, rateLimitHeaders(rateLimitResult));
  } catch (error) {
    // STEP 8: Error Handling
    console.error('Error in get-link-preview:', error);

    // Provide user-friendly error messages
    let userMessage = 'Não foi possível obter o preview do link';

    if (error instanceof Error) {
      if (error.message.includes('Failed to fetch URL (403)')) {
        userMessage = 'O site não permite acesso automático (403 Forbidden)';
      } else if (error.message.includes('Failed to fetch URL (404)')) {
        userMessage = 'Link não encontrado (404)';
      } else if (error.message.includes('Failed to fetch URL')) {
        userMessage = 'Não foi possível acessar o link';
      } else if (error.message.includes('timeout')) {
        userMessage = 'Tempo limite excedido ao acessar o link';
      } else if (error.message.includes('No meaningful metadata')) {
        userMessage = 'O link não possui informações de preview';
      } else if (error.message.includes('does not return HTML')) {
        userMessage = 'O link não aponta para uma página web';
      }
    }

    const errorResponse: LinkPreviewResponse = {
      success: false,
      error: userMessage,
    };

    return createSuccessResponse(errorResponse, rateLimitHeaders(rateLimitResult));
  }
});
