
// ABOUTME: Trending discussions module for community sidebar showing top engagement posts per Blueprint 06.

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Badge } from '../../ui/badge';
import { TrendingUp, MessageCircle, ArrowUp } from 'lucide-react';

interface TrendingPost {
  id: number;
  title: string;
  content: string;
  category: string;
  reply_count: number;
  upvotes: number;
  created_at: string;
  author: {
    full_name: string | null;
  } | null;
  flair_text?: string;
  is_pinned?: boolean;
}

interface TrendingDiscussionsModuleProps {
  posts: TrendingPost[];
}

export const TrendingDiscussionsModule = ({ posts }: TrendingDiscussionsModuleProps) => {
  const navigate = useNavigate();

  if (!posts || posts.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <TrendingUp className="w-4 h-4" />
          Em Alta
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-3">
          {posts.slice(0, 5).map((post) => (
            <div
              key={post.id}
              onClick={() => navigate(`/comunidade/${post.id}`)}
              className="cursor-pointer group"
            >
              <div className="space-y-1">
                <div className="flex items-start justify-between gap-2">
                  <h4 className="text-sm font-medium group-hover:text-primary transition-colors line-clamp-2">
                    {post.title}
                  </h4>
                  {post.is_pinned && (
                    <Badge variant="secondary" className="text-xs flex-shrink-0">
                      Fixado
                    </Badge>
                  )}
                </div>
                
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <ArrowUp className="w-3 h-3" />
                    <span>{post.upvotes}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <MessageCircle className="w-3 h-3" />
                    <span>{post.reply_count}</span>
                  </div>
                  {post.author?.full_name && (
                    <span>por {post.author.full_name}</span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
