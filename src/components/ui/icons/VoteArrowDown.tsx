// ABOUTME: Reddit-style downvote arrow icon with hollow and filled states for voting interfaces.

import React from 'react';

interface VoteArrowDownProps {
  filled?: boolean;
  size?: number;
  className?: string;
}

export const VoteArrowDown = ({ filled = false, size = 16, className }: VoteArrowDownProps) => {
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
        d="M8 14L2 8H6V2H10V8H14L8 14Z"
        fill={filled ? 'currentColor' : 'none'}
        stroke="currentColor"
        strokeWidth={filled ? 0 : 1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};
