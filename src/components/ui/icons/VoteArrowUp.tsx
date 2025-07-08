// ABOUTME: Reddit-style upvote arrow icon with hollow and filled states for voting interfaces.

import React from 'react';

interface VoteArrowUpProps {
  filled?: boolean;
  size?: number;
  className?: string;
}

export const VoteArrowUp = ({ filled = false, size = 16, className }: VoteArrowUpProps) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M8 2L14 8H10V14H6V8H2L8 2Z"
        fill={filled ? 'currentColor' : 'none'}
        stroke="currentColor"
        strokeWidth={filled ? 0 : 1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};
