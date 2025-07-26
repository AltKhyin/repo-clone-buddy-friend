// ABOUTME: Hook for handling drag & drop and paste operations for media files in Rich Block

import { useCallback, useEffect } from 'react';
import { Editor } from '@tiptap/react';
import { supabase } from '@/integrations/supabase/client';
import { VideoUtils } from '@/components/editor/extensions/VideoEmbed';

interface UseMediaDropHandlerProps {
  editor: Editor | null;
  onUploadStart?: () => void;
  onUploadProgress?: (progress: number) => void;
  onUploadComplete?: (url: string) => void;
  onUploadError?: (error: string) => void;
}

interface UploadedFile {
  file: File;
  url?: string;
  error?: string;
}

export const useMediaDropHandler = ({
  editor,
  onUploadStart,
  onUploadProgress,
  onUploadComplete,
  onUploadError,
}: UseMediaDropHandlerProps) => {
  // File validation
  const validateFile = useCallback((file: File): string | null => {
    // Check file type
    if (!file.type.startsWith('image/') && !file.type.startsWith('video/')) {
      return 'Only image and video files are supported';
    }

    // Check file size (50MB limit for videos, 10MB for images)
    const maxSize = file.type.startsWith('video/') ? 50 * 1024 * 1024 : 10 * 1024 * 1024;
    if (file.size > maxSize) {
      const maxSizeMB = file.type.startsWith('video/') ? '50MB' : '10MB';
      return `File must be smaller than ${maxSizeMB}`;
    }

    // Check supported formats
    const supportedImageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
    const supportedVideoTypes = ['video/mp4', 'video/webm', 'video/ogg'];

    if (file.type.startsWith('image/') && !supportedImageTypes.includes(file.type)) {
      return 'Supported image formats: JPEG, PNG, WebP, GIF';
    }

    if (file.type.startsWith('video/') && !supportedVideoTypes.includes(file.type)) {
      return 'Supported video formats: MP4, WebM, OGG';
    }

    return null;
  }, []);

  // Generate unique filename
  const generateFileName = useCallback((originalName: string, type: 'image' | 'video'): string => {
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(2, 15);
    const extension = originalName.split('.').pop();
    return `${type}s/${timestamp}-${randomId}.${extension}`;
  }, []);

  // Upload file to Supabase
  const uploadFileToSupabase = useCallback(
    async (file: File): Promise<string> => {
      const isVideo = file.type.startsWith('video/');
      const fileName = generateFileName(file.name, isVideo ? 'video' : 'image');
      const bucket = isVideo ? 'review-videos' : 'review-images';

      onUploadStart?.();

      try {
        // Upload with progress tracking
        const { data, error } = await supabase.storage.from(bucket).upload(fileName, file, {
          cacheControl: '3600',
          upsert: false,
          contentType: file.type,
        });

        if (error) {
          throw new Error(error.message || 'Failed to upload file');
        }

        // Get public URL
        const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(fileName);

        if (!urlData?.publicUrl) {
          throw new Error('Failed to get file URL');
        }

        onUploadComplete?.(urlData.publicUrl);
        return urlData.publicUrl;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Upload failed';
        onUploadError?.(errorMessage);
        throw error;
      }
    },
    [generateFileName, onUploadStart, onUploadComplete, onUploadError]
  );

  // Handle file insertion into editor
  const insertFile = useCallback(
    async (file: File) => {
      if (!editor) return;

      const validationError = validateFile(file);
      if (validationError) {
        onUploadError?.(validationError);
        return;
      }

      const isImage = file.type.startsWith('image/');
      const isVideo = file.type.startsWith('video/');

      if (isImage) {
        // Create temporary blob URL for immediate preview
        const blobUrl = URL.createObjectURL(file);

        // Insert image with loading state
        editor.commands.setInlineImage({
          src: blobUrl,
          alt: file.name,
          uploading: true,
        });

        try {
          // Upload to Supabase and update with final URL
          const finalUrl = await uploadFileToSupabase(file);

          // Find the image node and update it
          const { state } = editor;
          const { selection } = state;

          // Update the image with final URL
          editor.commands.setInlineImage({
            src: finalUrl,
            alt: file.name,
            uploading: false,
          });

          // Clean up blob URL
          URL.revokeObjectURL(blobUrl);
        } catch (error) {
          // Remove the failed image
          editor.commands.deleteSelection();
          onUploadError?.(error instanceof Error ? error.message : 'Upload failed');
        }
      } else if (isVideo) {
        // Handle video insertion
        try {
          const videoUrl = await uploadFileToSupabase(file);

          // Insert video as HTML
          editor.commands.insertContent(
            `<video controls style="max-width: 100%; height: auto;">
            <source src="${videoUrl}" type="${file.type}">
            Your browser does not support the video tag.
          </video>`
          );
        } catch (error) {
          onUploadError?.(error instanceof Error ? error.message : 'Video upload failed');
        }
      }
    },
    [editor, validateFile, uploadFileToSupabase, onUploadError]
  );

  // Handle multiple files
  const insertFiles = useCallback(
    async (files: FileList | File[]) => {
      const fileArray = Array.from(files);

      for (const file of fileArray) {
        await insertFile(file);
      }
    },
    [insertFile]
  );

  // Handle paste events
  const handlePaste = useCallback(
    (event: ClipboardEvent) => {
      if (!editor?.isFocused) return;

      const items = event.clipboardData?.items;
      if (!items) return;

      const files: File[] = [];
      const imageUrls: string[] = [];
      const videoUrls: string[] = [];

      // Check for files
      for (const item of Array.from(items)) {
        if (item.kind === 'file') {
          const file = item.getAsFile();
          if (file && (file.type.startsWith('image/') || file.type.startsWith('video/'))) {
            files.push(file);
          }
        } else if (item.kind === 'string' && item.type === 'text/plain') {
          // Check for image and video URLs
          item.getAsString(text => {
            const trimmedText = text.trim();

            // Check for video URLs (YouTube, Vimeo, direct video)
            if (
              VideoUtils.isYouTubeUrl(trimmedText) ||
              VideoUtils.isVimeoUrl(trimmedText) ||
              VideoUtils.isDirectVideoUrl(trimmedText)
            ) {
              videoUrls.push(trimmedText);
            } else {
              // Check for image URLs
              const imageUrlRegex = /^https?:\/\/.*\.(jpg|jpeg|png|gif|webp|svg)(\?.*)?$/i;
              if (imageUrlRegex.test(trimmedText)) {
                imageUrls.push(trimmedText);
              }
            }
          });
        }
      }

      // Insert files if any
      if (files.length > 0) {
        event.preventDefault();
        insertFiles(files);
        return;
      }

      // Insert image URLs if any
      if (imageUrls.length > 0) {
        event.preventDefault();
        imageUrls.forEach(url => {
          editor.commands.setInlineImage({
            src: url,
            alt: 'Pasted image',
          });
        });
      }

      // Insert video URLs if any
      if (videoUrls.length > 0) {
        event.preventDefault();
        videoUrls.forEach(url => {
          const videoData = VideoUtils.parseVideoUrl(url);
          if (videoData) {
            editor.commands.setVideoEmbed(videoData);
          }
        });
      }
    },
    [editor, insertFiles]
  );

  // Handle drop events
  const handleDrop = useCallback(
    (event: DragEvent) => {
      if (!editor?.isFocused) return;

      const files = event.dataTransfer?.files;
      if (!files || files.length === 0) return;

      const mediaFiles = Array.from(files).filter(
        file => file.type.startsWith('image/') || file.type.startsWith('video/')
      );

      if (mediaFiles.length > 0) {
        event.preventDefault();
        insertFiles(mediaFiles);
      }
    },
    [editor, insertFiles]
  );

  // Attach event listeners
  useEffect(() => {
    if (!editor) return;

    const editorElement = editor.view.dom;

    editorElement.addEventListener('paste', handlePaste);
    editorElement.addEventListener('drop', handleDrop);
    editorElement.addEventListener('dragover', e => e.preventDefault());

    return () => {
      editorElement.removeEventListener('paste', handlePaste);
      editorElement.removeEventListener('drop', handleDrop);
      editorElement.removeEventListener('dragover', e => e.preventDefault());
    };
  }, [editor, handlePaste, handleDrop]);

  return {
    insertFile,
    insertFiles,
    validateFile,
    uploadFileToSupabase,
  };
};
