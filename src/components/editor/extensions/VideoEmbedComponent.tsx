// ABOUTME: React component for rendering video embeds in TipTap editor with YouTube, Vimeo, and direct video support

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { NodeViewWrapper, NodeViewProps } from '@tiptap/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  Edit3,
  Trash2,
  ExternalLink,
  Loader2,
  AlertCircle,
  Video,
  Eye,
  Settings,
} from 'lucide-react';
import { VideoUtils, VideoData } from './VideoEmbed';
import {
  getMediaMaxWidth,
  getVideoThumbnailObjectFit,
  getVideoAspectRatio,
  PLACEHOLDER_VIDEOS,
  PLACEHOLDER_DIMENSIONS,
} from '../shared/mediaConstants';

interface VideoEmbedComponentProps extends NodeViewProps {
  // Inherited from NodeViewProps: node, updateAttributes, deleteNode, etc.
  editor?: any; // TipTap editor instance
}

export const VideoEmbedComponent = React.forwardRef<HTMLDivElement, VideoEmbedComponentProps>(({
  node,
  updateAttributes,
  deleteNode,
  selected,
  editor,
}, ref) => {
  // 🎯 READ-ONLY MODE DETECTION: Check if editor is in read-only mode
  const isReadOnly = editor && !editor.isEditable;

  // 🎯 READ-ONLY FIX: Never allow editing in read-only mode
  const [isEditing, setIsEditing] = useState(
    isReadOnly ? false : (!node.attrs.src || node.attrs.placeholder)
  );
  const [videoUrl, setVideoUrl] = useState(node.attrs.src || '');
  const [isLoading, setIsLoading] = useState(node.attrs.loading || false);
  const [error, setError] = useState(node.attrs.error || null);
  const [showIframe, setShowIframe] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [autoplay, setAutoplay] = useState(node.attrs.autoplay || false);
  const [muted, setMuted] = useState(node.attrs.muted || false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Handle video URL parsing and validation
  const handleSaveUrl = useCallback(() => {
    if (!videoUrl.trim()) {
      setError('Please enter a valid video URL');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const videoData = VideoUtils.parseVideoUrl(videoUrl);

      if (!videoData) {
        setError('Unsupported video URL. Please use YouTube, Vimeo, or direct video links.');
        setIsLoading(false);
        return;
      }

      updateAttributes({
        ...videoData,
        autoplay,
        muted,
        loading: false,
        error: null,
        placeholder: false, // Convert from placeholder to real video
      });

      setError(null);
      setIsLoading(false);
      setIsEditing(false);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to process video URL';
      setError(errorMessage);
      updateAttributes({
        error: errorMessage,
        loading: false,
      });
      setIsLoading(false);
    }
  }, [videoUrl, autoplay, muted, updateAttributes]);

  // Handle embed loading
  const handleLoadEmbed = useCallback(() => {
    setShowIframe(true);
  }, []);

  // Generate embed URL with current settings
  const getEmbedUrl = useCallback(() => {
    if (!node.attrs.videoId || !node.attrs.provider) {
      console.warn('VideoEmbed: Missing video data', {
        videoId: node.attrs.videoId,
        provider: node.attrs.provider,
        src: node.attrs.src,
        allAttrs: node.attrs
      });
      return '';
    }

    const embedUrl = VideoUtils.getEmbedUrl(node.attrs.provider, node.attrs.videoId, {
      autoplay: node.attrs.autoplay,
      muted: node.attrs.muted,
    });
    
    console.log('VideoEmbed: Generated embed URL', {
      provider: node.attrs.provider,
      videoId: node.attrs.videoId,
      embedUrl,
      isReadOnly
    });
    
    return embedUrl;
  }, [node.attrs, isReadOnly]);

  // Handle settings update
  const handleSettingsUpdate = useCallback(() => {
    updateAttributes({
      autoplay,
      muted,
    });
    setShowSettings(false);
  }, [autoplay, muted, updateAttributes]);

  // Reset iframe when settings change
  useEffect(() => {
    if (showIframe && (autoplay !== node.attrs.autoplay || muted !== node.attrs.muted)) {
      setShowIframe(false);
    }
  }, [autoplay, muted, node.attrs.autoplay, node.attrs.muted, showIframe]);

  // 🎯 REMOVED: Auto-iframe logic - read-only mode should show thumbnail + play button, not iframe

  // Render editing interface
  if (isEditing) {
    return (
      <NodeViewWrapper ref={ref} className="video-embed-wrapper">
        <div className="inline-block p-4 border-2 border-dashed border-muted-foreground/25 rounded-lg bg-muted/10 max-w-2xl">
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Video size={16} />
              Insert Video
            </div>

            {/* URL Input */}
            <div className="space-y-3">
              <div>
                <Label htmlFor="video-url" className="text-sm font-medium">
                  Video URL
                </Label>
                <Input
                  id="video-url"
                  placeholder="Paste YouTube, Vimeo, or direct video URL..."
                  value={videoUrl}
                  onChange={e => setVideoUrl(e.target.value)}
                  className="mt-1"
                  onKeyDown={e => {
                    if (e.key === 'Enter') {
                      handleSaveUrl();
                    }
                  }}
                />
                <div className="text-xs text-muted-foreground mt-1">
                  Supported: YouTube, Vimeo, direct video files (.mp4, .webm, .ogg)
                </div>
              </div>

              {/* Video Settings */}
              <div className="space-y-3 p-3 border rounded bg-muted/5">
                <div className="text-sm font-medium">Video Settings</div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="autoplay" className="text-sm">
                    Autoplay video
                  </Label>
                  <Switch id="autoplay" checked={autoplay} onCheckedChange={setAutoplay} />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="muted" className="text-sm">
                    Start muted
                  </Label>
                  <Switch id="muted" checked={muted} onCheckedChange={setMuted} />
                </div>
              </div>
            </div>

            {/* Loading State */}
            {isLoading && (
              <div className="flex items-center gap-2 text-sm">
                <Loader2 size={16} className="animate-spin" />
                Processing video URL...
              </div>
            )}

            {/* Error Display */}
            {error && (
              <Alert className="py-2">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-sm">{error}</AlertDescription>
              </Alert>
            )}

            {/* Action Buttons */}
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={handleSaveUrl}
                disabled={!videoUrl.trim() || isLoading}
                className="flex-1"
              >
                {isLoading ? (
                  <Loader2 size={14} className="mr-1 animate-spin" />
                ) : (
                  <Eye size={14} className="mr-1" />
                )}
                {isLoading ? 'Processing...' : 'Embed Video'}
              </Button>

              <Button size="sm" variant="outline" onClick={deleteNode} disabled={isLoading}>
                <Trash2 size={14} />
              </Button>
            </div>

            {/* URL Examples */}
            <div className="text-xs text-muted-foreground space-y-1 border-t pt-3">
              <div className="font-medium">Example URLs:</div>
              <div>• YouTube: https://youtube.com/watch?v=dQw4w9WgXcQ</div>
              <div>• Vimeo: https://vimeo.com/123456789</div>
              <div>• Direct: https://example.com/video.mp4</div>
            </div>
          </div>
        </div>
      </NodeViewWrapper>
    );
  }

  // Render placeholder display
  if (node.attrs.placeholder && !isEditing) {
    return (
      <NodeViewWrapper ref={ref} className="video-embed-wrapper">
        <div
          className={`inline-block ${isReadOnly ? 'cursor-default' : 'cursor-pointer'} ${selected && !isReadOnly ? 'ring-2 ring-blue-500 ring-offset-2' : ''}`}
          onClick={isReadOnly ? undefined : () => setIsEditing(true)}
          data-placeholder="true"
        >
          <div className="relative border-2 border-dashed border-gray-300 rounded-lg bg-gray-900 hover:bg-gray-800 transition-colors">
            <div
              className="flex items-center justify-center"
              style={{
                width: isReadOnly ? 'auto' : PLACEHOLDER_DIMENSIONS.video.width,
                height: isReadOnly ? 'auto' : PLACEHOLDER_DIMENSIONS.video.height,
                maxWidth: isReadOnly 
                  ? 'var(--block-max-width, 100%)' 
                  : getMediaMaxWidth(node.attrs.size),
                aspectRatio: '16/9',
              }}
            >
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 bg-blue-600 rounded-full flex items-center justify-center">
                  <Video size={32} className="text-white" />
                </div>
                <span className="text-white font-medium">Click to configure video</span>
                <div className="text-gray-400 text-sm mt-2">
                  YouTube, Vimeo, or direct video link
                </div>
              </div>
            </div>
          </div>
        </div>
      </NodeViewWrapper>
    );
  }

  // Render video display
  return (
    <NodeViewWrapper ref={ref} className="video-embed-wrapper">
      <div className={`inline-block group ${selected && !isReadOnly ? 'ring-2 ring-blue-500 ring-offset-2' : ''}`}>
        <div
          className="relative bg-black rounded-lg overflow-hidden"
          style={{
            // 🎯 UNIVERSAL BLOCK-AWARE SIZING: Apply block constraints in all modes  
            width: 'auto',
            maxWidth: 'var(--block-max-width, 100%)',
            aspectRatio: getVideoAspectRatio(node.attrs.objectFit),
            minHeight: '200px', // Ensure minimum height for video display
          }}
        >
          {/* Thumbnail Preview */}
          {!showIframe && node.attrs.thumbnail && (
            <div className="relative w-full h-full">
              <img
                src={node.attrs.thumbnail}
                alt={node.attrs.title || 'Video thumbnail'}
                className="max-w-full h-auto"
                style={{
                  objectFit: getVideoThumbnailObjectFit(node.attrs.objectFit),
                  width: '100%',
                  height: '100%',
                }}
              />

              {/* Overlay */}
              <div className="absolute inset-0 bg-black/20 flex items-center justify-center group-hover:bg-black/40 transition-colors">
                <Button
                  size="lg"
                  onClick={handleLoadEmbed}
                  className="rounded-full w-16 h-16 p-0 bg-white/90 hover:bg-white text-black"
                >
                  <Play size={24} />
                </Button>
              </div>

              {/* Provider Badge */}
              <div className="absolute top-3 left-3">
                <Badge variant="secondary" className="capitalize">
                  {node.attrs.provider}
                </Badge>
              </div>

              {/* Duration Badge */}
              {node.attrs.duration && (
                <div className="absolute bottom-3 right-3">
                  <Badge variant="outline" className="bg-black/50 text-white border-white/20">
                    {node.attrs.duration}
                  </Badge>
                </div>
              )}
            </div>
          )}

          {/* Iframe Embed */}
          {showIframe && (
            <iframe
              ref={iframeRef}
              src={getEmbedUrl()}
              title={node.attrs.title || 'Video'}
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen={node.attrs.allowFullscreen}
              className="max-w-full h-auto"
              style={{
                width: '100%',
                height: '100%',
                maxWidth: 'var(--block-max-width, 100%)',
                minHeight: '200px',
              }}
            />
          )}

          {/* Error Overlay */}
          {error && (
            <div className="absolute inset-0 flex items-center justify-center bg-destructive/10 border border-destructive rounded">
              <div className="text-center text-destructive text-sm p-4">
                <AlertCircle size={24} className="mx-auto mb-2" />
                <div className="font-medium">Video Error</div>
                <div className="text-xs mt-1">{error}</div>
              </div>
            </div>
          )}

          {/* Hover Controls - Hidden in read-only mode */}
          {selected && !error && !isReadOnly && (
            <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
              <div className="flex gap-1">
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={isReadOnly ? undefined : () => setShowSettings(!showSettings)}
                  disabled={isReadOnly}
                  className="h-8 w-8 p-0 bg-black/50 hover:bg-black/70 text-white border-0"
                  title="Video settings"
                >
                  <Settings size={14} />
                </Button>

                <Button
                  size="sm"
                  variant="secondary"
                  onClick={isReadOnly ? undefined : () => setIsEditing(true)}
                  disabled={isReadOnly}
                  className="h-8 w-8 p-0 bg-black/50 hover:bg-black/70 text-white border-0"
                  title="Edit video"
                >
                  <Edit3 size={14} />
                </Button>

                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => window.open(node.attrs.src, '_blank')}
                  className="h-8 w-8 p-0 bg-black/50 hover:bg-black/70 text-white border-0"
                  title="Open original"
                >
                  <ExternalLink size={14} />
                </Button>

                <Button
                  size="sm"
                  variant="destructive"
                  onClick={isReadOnly ? undefined : deleteNode}
                  disabled={isReadOnly}
                  className="h-8 w-8 p-0"
                  title="Delete video"
                >
                  <Trash2 size={14} />
                </Button>
              </div>
            </div>
          )}

          {/* Settings Panel */}
          {showSettings && (
            <div className="absolute top-12 right-3 p-3 bg-background border rounded-lg shadow-lg min-w-48 z-10">
              <div className="space-y-3">
                <div className="text-sm font-medium">Video Settings</div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="settings-autoplay" className="text-sm">
                    Autoplay
                  </Label>
                  <Switch id="settings-autoplay" checked={autoplay} onCheckedChange={setAutoplay} />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="settings-muted" className="text-sm">
                    Muted
                  </Label>
                  <Switch id="settings-muted" checked={muted} onCheckedChange={setMuted} />
                </div>

                <div className="flex gap-2 pt-2 border-t">
                  <Button size="sm" onClick={handleSettingsUpdate} className="flex-1">
                    Apply
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setShowSettings(false)}>
                    Cancel
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Video Title */}
        {node.attrs.title && (
          <div className="text-sm text-muted-foreground mt-2 px-1">{node.attrs.title}</div>
        )}
      </div>
    </NodeViewWrapper>
  );
});

VideoEmbedComponent.displayName = 'VideoEmbedComponent';
