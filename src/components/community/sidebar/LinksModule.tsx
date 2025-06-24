
// ABOUTME: Useful links module for community sidebar as specified in Blueprint 06.

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { ExternalLink } from 'lucide-react';

interface Link {
  title: string;
  url: string;
}

interface LinksModuleProps {
  links: Link[];
}

export const LinksModule = ({ links }: LinksModuleProps) => {
  if (!links || links.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium">Links Úteis</CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-2">
          {links.map((link, index) => (
            <a
              key={index}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <span>{link.title}</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
