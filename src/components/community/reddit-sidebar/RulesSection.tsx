// ABOUTME: Reddit-style Rules section for community guidelines and rules

import React from 'react';
import { RedditSidebarCard } from './RedditSidebarCard';
import type {
  CommunitySidebarSection,
  CommunitySidebarData,
} from '../../../../packages/hooks/useCommunityManagementQuery';

interface RulesSectionProps {
  section: CommunitySidebarSection;
  sidebarData: CommunitySidebarData;
  isLast?: boolean;
}

const RuleItem = ({ rule, index }: { rule: string; index: number }) => {
  const [isExpanded, setIsExpanded] = React.useState(false);
  const isLongRule = rule.length > 100;
  const displayRule = isLongRule && !isExpanded ? `${rule.slice(0, 100)}...` : rule;

  return (
    <div className="py-2 border-b border-reddit-divider last:border-b-0">
      <div className="flex items-start gap-2">
        <span className="text-sm font-medium text-reddit-text-secondary min-w-0">{index + 1}.</span>
        <div className="flex-1">
          <p className="text-sm text-reddit-text-primary leading-relaxed">{displayRule}</p>
          {isLongRule && (
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-xs text-reddit-text-secondary hover:text-reddit-text-primary mt-1"
            >
              {isExpanded ? 'Ver menos' : 'Ver mais'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export const RulesSection = ({ section, sidebarData, isLast }: RulesSectionProps) => {
  const content = section.content || {};
  const rules = content.rules || [];

  if (!rules || rules.length === 0) {
    return null;
  }

  return (
    <RedditSidebarCard title={section.title} isLast={isLast}>
      <div className="space-y-0">
        {rules.map((rule: string, index: number) => (
          <RuleItem key={index} rule={rule} index={index} />
        ))}
      </div>
    </RedditSidebarCard>
  );
};
