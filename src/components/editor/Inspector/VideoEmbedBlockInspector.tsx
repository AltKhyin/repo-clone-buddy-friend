// ABOUTME: Inspector panel for VideoEmbedBlock with YouTube/Vimeo integration and responsive controls

import React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { useEditorStore } from '@/store/editorStore';
import { SafeSwitch } from '../SafeSwitch';
import { SpacingControls, BorderControls, BackgroundControls } from './shared/UnifiedControls';
import { Video, Palette, ExternalLink, Play, Youtube, Share } from 'lucide-react';

interface VideoEmbedBlockInspectorProps {
  nodeId: string;
}

export const VideoEmbedBlockInspector: React.FC<VideoEmbedBlockInspectorProps> = ({ nodeId }) => {
  const { nodes, updateNode } = useEditorStore();

  const node = nodes.find(n => n.id === nodeId);
  if (!node || node.type !== 'videoEmbedBlock') return null;

  const data = node.data;

  const updateNodeData = (updates: Partial<typeof data>) => {
    updateNode(nodeId, {
      data: { ...data, ...updates },
    });
  };

  // Validate video URL
  const validateVideoUrl = (url: string, platform: 'youtube' | 'vimeo'): boolean => {
    if (!url) return true; // Empty URL is valid (will show empty state)

    try {
      const urlObj = new URL(url);

      if (platform === 'youtube') {
        return urlObj.hostname.includes('youtube.com') || urlObj.hostname.includes('youtu.be');
      } else if (platform === 'vimeo') {
        return urlObj.hostname.includes('vimeo.com');
      }
    } catch {
      return false;
    }

    return false;
  };

  // Extract video ID for preview
  const getVideoId = (url: string, platform: 'youtube' | 'vimeo'): string | null => {
    if (!url) return null;

    try {
      const urlObj = new URL(url);

      if (platform === 'youtube') {
        if (urlObj.hostname.includes('youtube.com')) {
          return urlObj.searchParams.get('v');
        } else if (urlObj.hostname.includes('youtu.be')) {
          return urlObj.pathname.slice(1);
        }
      } else if (platform === 'vimeo') {
        const match = url.match(/vimeo\.com\/(\d+)/);
        return match ? match[1] : null;
      }
    } catch {
      return null;
    }

    return null;
  };

  const isValidUrl = validateVideoUrl(data.url, data.platform);
  const videoId = getVideoId(data.url, data.platform);

  const handleUrlChange = (url: string) => {
    updateNodeData({ url });

    // Auto-detect platform based on URL
    if (url.includes('youtube.com') || url.includes('youtu.be')) {
      updateNodeData({ platform: 'youtube' });
    } else if (url.includes('vimeo.com')) {
      updateNodeData({ platform: 'vimeo' });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Video size={16} />
        <h3 className="font-medium">Video Embed</h3>
      </div>

      <Separator />

      {/* Video Source Section */}
      <div className="space-y-3">
        <h4 className="text-sm font-medium flex items-center gap-2">
          <Share size={14} />
          Video Source
        </h4>

        {/* Platform Selection */}
        <div className="space-y-2">
          <Label className="text-xs">Platform</Label>
          <Select
            value={data.platform}
            onValueChange={(value: 'youtube' | 'vimeo') => updateNodeData({ platform: value })}
          >
            <SelectTrigger className="h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="youtube">
                <div className="flex items-center gap-2">
                  <Youtube size={14} />
                  YouTube
                </div>
              </SelectItem>
              <SelectItem value="vimeo">
                <div className="flex items-center gap-2">
                  <Video size={14} />
                  Vimeo
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Video URL */}
        <div className="space-y-2">
          <Label htmlFor="video-url" className="text-xs">
            Video URL
          </Label>
          <div className="flex items-center gap-2">
            <Input
              id="video-url"
              type="url"
              value={data.url || ''}
              onChange={e => handleUrlChange(e.target.value)}
              placeholder={
                data.platform === 'youtube'
                  ? 'https://www.youtube.com/watch?v=...'
                  : 'https://vimeo.com/...'
              }
              className={`flex-1 h-8 text-xs ${!isValidUrl ? 'border-red-400' : ''}`}
            />
            {data.url && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => window.open(data.url, '_blank')}
                className="h-8 px-2"
                title="Open video in new tab"
              >
                <ExternalLink size={14} />
              </Button>
            )}
          </div>
          {!isValidUrl && data.url && (
            <p className="text-xs text-red-500">Please enter a valid {data.platform} URL</p>
          )}
        </div>

        {/* URL Format Help */}
        <div className="text-xs text-muted-foreground bg-muted/50 rounded px-3 py-2">
          <p className="font-medium mb-1">Supported formats:</p>
          {data.platform === 'youtube' ? (
            <div className="space-y-1">
              <p>• https://www.youtube.com/watch?v=VIDEO_ID</p>
              <p>• https://youtu.be/VIDEO_ID</p>
            </div>
          ) : (
            <div className="space-y-1">
              <p>• https://vimeo.com/VIDEO_ID</p>
            </div>
          )}
        </div>

        {/* Video Preview Info */}
        {videoId && isValidUrl && (
          <div className="text-xs bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 rounded px-3 py-2">
            <p className="font-medium">✓ Valid video detected</p>
            <p>Video ID: {videoId}</p>
          </div>
        )}

        {/* Caption */}
        <div className="space-y-2">
          <Label htmlFor="video-caption" className="text-xs">
            Caption (Optional)
          </Label>
          <Textarea
            id="video-caption"
            value={data.caption || ''}
            onChange={e => updateNodeData({ caption: e.target.value })}
            placeholder="Optional caption displayed below the video..."
            className="text-xs min-h-[60px]"
          />
        </div>
      </div>

      <Separator />

      {/* Playback Settings Section */}
      <div className="space-y-3">
        <h4 className="text-sm font-medium flex items-center gap-2">
          <Play size={14} />
          Playback Settings
        </h4>

        {/* Autoplay Toggle */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="video-autoplay" className="text-xs">
              Autoplay
            </Label>
            <SafeSwitch
              id="video-autoplay"
              checked={data.autoplay || false}
              onCheckedChange={checked => updateNodeData({ autoplay: checked })}
            />
          </div>
          <p className="text-xs text-muted-foreground">
            Note: Most browsers block autoplay for videos with sound
          </p>
        </div>
      </div>

      <Separator />

      {/* Spacing Controls */}
      <SpacingControls
        data={data}
        onChange={updateNodeData}
        enableMargin={true}
        enablePadding={true}
        compact={false}
      />

      {/* Background Controls */}
      <BackgroundControls
        data={data}
        onChange={updateNodeData}
        enableImage={false}
        compact={false}
        colorKey="backgroundColor"
        defaultColor="transparent"
      />

      {/* Border Controls */}
      <BorderControls
        data={data}
        onChange={updateNodeData}
        enableToggle={true}
        enableRadius={true}
        enableStyle={false}
        compact={false}
        widthKey="borderWidth"
        colorKey="borderColor"
        radiusKey="borderRadius"
        defaultWidth={1}
        defaultColor="#e5e7eb"
        defaultRadius={8}
        maxWidth={8}
        maxRadius={24}
      />

      {/* Responsive Embed Info */}
      <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
        <div className="flex items-start gap-2">
          <Video size={14} className="text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-xs font-medium text-blue-800 dark:text-blue-200">Responsive Embed</p>
            <p className="text-xs text-blue-600 dark:text-blue-300 mt-1">
              Videos automatically adapt to container width while maintaining 16:9 aspect ratio.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
