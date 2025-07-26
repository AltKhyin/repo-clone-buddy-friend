// ABOUTME: Utility functions for poll data manipulation, validation, and analytics

import { PollData, PollOption } from './PollExtension';

/**
 * Generate a unique poll ID
 */
export const generatePollId = (): string => {
  return `poll-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Generate a unique option ID
 */
export const generateOptionId = (): string => {
  return `option-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Create default poll data
 */
export const createDefaultPollData = (
  question: string = 'What is your opinion?',
  options: string[] = ['Option 1', 'Option 2']
): PollData => {
  const now = new Date().toISOString();

  const pollOptions: PollOption[] = options.map((text, index) => ({
    id: generateOptionId(),
    text,
    votes: 0,
  }));

  return {
    question,
    options: pollOptions,
    settings: {
      allowMultiple: false,
      showResults: true,
      allowAnonymous: true,
      requireLogin: false,
    },
    metadata: {
      totalVotes: 0,
      uniqueVoters: 0,
      createdAt: now,
    },
    styling: {
      questionFontSize: 18,
      questionFontWeight: 600,
      optionFontSize: 16,
      optionPadding: 12,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: '#e2e8f0',
      backgroundColor: 'transparent',
      selectedColor: '#3b82f6',
      resultBarColor: '#60a5fa',
      textAlign: 'left',
      compact: false,
    },
  };
};

/**
 * Validate poll data structure
 */
export const validatePollData = (data: any): data is PollData => {
  if (!data || typeof data !== 'object') return false;

  const { question, options, settings, metadata, styling } = data;

  // Validate question
  if (!question || typeof question !== 'string') return false;

  // Validate options
  if (!Array.isArray(options)) return false;
  if (
    !options.every(
      option =>
        option &&
        typeof option === 'object' &&
        typeof option.id === 'string' &&
        typeof option.text === 'string' &&
        typeof option.votes === 'number'
    )
  ) {
    return false;
  }

  // Validate settings (optional)
  if (settings && typeof settings !== 'object') return false;

  // Validate metadata (optional)
  if (metadata && typeof metadata !== 'object') return false;

  // Validate styling (optional)
  if (styling && typeof styling !== 'object') return false;

  return true;
};

/**
 * Normalize poll data to ensure consistency
 */
export const normalizePollData = (data: Partial<PollData>): PollData => {
  const defaultData = createDefaultPollData();

  return {
    question: data.question || defaultData.question,
    options: Array.isArray(data.options) ? data.options : defaultData.options,
    settings: {
      ...defaultData.settings,
      ...data.settings,
    },
    metadata: {
      ...defaultData.metadata,
      ...data.metadata,
    },
    styling: {
      ...defaultData.styling,
      ...data.styling,
    },
  };
};

/**
 * Calculate poll statistics
 */
export interface PollStats {
  totalVotes: number;
  uniqueVoters: number;
  participationRate: number; // if max participants known
  leadingOption: PollOption | null;
  leadingPercentage: number;
  isTie: boolean;
  distribution: {
    optionId: string;
    text: string;
    votes: number;
    percentage: number;
  }[];
  votingTrend?: {
    timestamp: string;
    cumulativeVotes: number;
  }[];
}

export const calculatePollStats = (data: PollData, maxParticipants?: number): PollStats => {
  const totalVotes =
    data.metadata.totalVotes || data.options.reduce((sum, option) => sum + option.votes, 0);
  const uniqueVoters = data.metadata.uniqueVoters || totalVotes; // Fallback if not tracked

  // Calculate distribution
  const distribution = data.options.map(option => ({
    optionId: option.id,
    text: option.text,
    votes: option.votes,
    percentage: totalVotes > 0 ? Math.round((option.votes / totalVotes) * 100) : 0,
  }));

  // Find leading option
  const maxVotes = Math.max(...data.options.map(option => option.votes));
  const leadingOptions = data.options.filter(option => option.votes === maxVotes);
  const leadingOption = leadingOptions.length === 1 ? leadingOptions[0] : null;
  const leadingPercentage = totalVotes > 0 ? Math.round((maxVotes / totalVotes) * 100) : 0;
  const isTie = leadingOptions.length > 1 && maxVotes > 0;

  // Calculate participation rate
  const participationRate = maxParticipants ? (uniqueVoters / maxParticipants) * 100 : 100;

  return {
    totalVotes,
    uniqueVoters,
    participationRate,
    leadingOption,
    leadingPercentage,
    isTie,
    distribution,
  };
};

/**
 * Add a new option to the poll
 */
export const addPollOption = (data: PollData, optionText: string): PollData => {
  const newOption: PollOption = {
    id: generateOptionId(),
    text: optionText || `Option ${data.options.length + 1}`,
    votes: 0,
  };

  return {
    ...data,
    options: [...data.options, newOption],
  };
};

/**
 * Remove an option from the poll
 */
export const removePollOption = (data: PollData, optionId: string): PollData => {
  if (data.options.length <= 1) {
    return data; // Don't allow removing the last option
  }

  const filteredOptions = data.options.filter(option => option.id !== optionId);
  const newTotalVotes = filteredOptions.reduce((sum, option) => sum + option.votes, 0);

  return {
    ...data,
    options: filteredOptions,
    metadata: {
      ...data.metadata,
      totalVotes: newTotalVotes,
    },
  };
};

/**
 * Update an option's text
 */
export const updatePollOption = (data: PollData, optionId: string, newText: string): PollData => {
  const updatedOptions = data.options.map(option =>
    option.id === optionId ? { ...option, text: newText } : option
  );

  return {
    ...data,
    options: updatedOptions,
  };
};

/**
 * Cast a vote (client-side simulation)
 */
export const castVote = (
  data: PollData,
  optionId: string,
  userId?: string,
  previousVotes: string[] = []
): { updatedData: PollData; success: boolean; error?: string } => {
  const option = data.options.find(opt => opt.id === optionId);
  if (!option) {
    return { updatedData: data, success: false, error: 'Option not found' };
  }

  let updatedOptions = [...data.options];
  let voteChange = 0;

  if (data.settings.allowMultiple) {
    // Multiple choice: toggle vote
    if (previousVotes.includes(optionId)) {
      // Remove vote
      updatedOptions = updatedOptions.map(opt =>
        opt.id === optionId ? { ...opt, votes: Math.max(0, opt.votes - 1) } : opt
      );
      voteChange = -1;
    } else {
      // Add vote
      updatedOptions = updatedOptions.map(opt =>
        opt.id === optionId ? { ...opt, votes: opt.votes + 1 } : opt
      );
      voteChange = 1;
    }
  } else {
    // Single choice: remove previous votes and add new one
    if (previousVotes.includes(optionId)) {
      // Unvote if clicking same option
      updatedOptions = updatedOptions.map(opt =>
        opt.id === optionId ? { ...opt, votes: Math.max(0, opt.votes - 1) } : opt
      );
      voteChange = -1;
    } else {
      // Remove previous votes and add new vote
      updatedOptions = updatedOptions.map(opt => {
        if (opt.id === optionId) {
          return { ...opt, votes: opt.votes + 1 };
        } else if (previousVotes.includes(opt.id)) {
          return { ...opt, votes: Math.max(0, opt.votes - 1) };
        }
        return opt;
      });
      voteChange = 1 - previousVotes.length;
    }
  }

  const newTotalVotes = Math.max(0, data.metadata.totalVotes + voteChange);

  const updatedData: PollData = {
    ...data,
    options: updatedOptions,
    metadata: {
      ...data.metadata,
      totalVotes: newTotalVotes,
      lastVoteAt: new Date().toISOString(),
    },
  };

  return { updatedData, success: true };
};

/**
 * Export poll results to CSV
 */
export const exportPollToCSV = (data: PollData): string => {
  const stats = calculatePollStats(data);

  let csv = 'Poll Results\n\n';
  csv += `Question,${data.question}\n`;
  csv += `Total Votes,${stats.totalVotes}\n`;
  csv += `Unique Voters,${stats.uniqueVoters}\n\n`;

  csv += 'Option,Votes,Percentage\n';
  stats.distribution.forEach(item => {
    csv += `"${item.text}",${item.votes},${item.percentage}%\n`;
  });

  return csv;
};

/**
 * Export poll results to JSON
 */
export const exportPollToJSON = (data: PollData): string => {
  const stats = calculatePollStats(data);

  const exportData = {
    poll: {
      question: data.question,
      settings: data.settings,
      metadata: data.metadata,
    },
    results: {
      stats,
      options: data.options,
    },
    exportedAt: new Date().toISOString(),
  };

  return JSON.stringify(exportData, null, 2);
};

/**
 * Validate vote eligibility
 */
export const validateVoteEligibility = (
  data: PollData,
  userId?: string,
  userVotes: string[] = []
): { canVote: boolean; reason?: string } => {
  // Check if poll has ended
  if (data.settings.endDate && new Date() > new Date(data.settings.endDate)) {
    return { canVote: false, reason: 'Poll has ended' };
  }

  // Check vote limit
  if (data.settings.maxVotes && data.metadata.totalVotes >= data.settings.maxVotes) {
    return { canVote: false, reason: 'Vote limit reached' };
  }

  // Check if user needs to be logged in
  if (data.settings.requireLogin && !userId) {
    return { canVote: false, reason: 'Login required to vote' };
  }

  // Check if user has already voted (for single-choice polls)
  if (!data.settings.allowMultiple && userVotes.length > 0) {
    return { canVote: true, reason: 'Can change vote' };
  }

  return { canVote: true };
};

/**
 * Get poll summary for display
 */
export const getPollSummary = (data: PollData): string => {
  const stats = calculatePollStats(data);

  if (stats.totalVotes === 0) {
    return 'No votes yet';
  }

  if (stats.isTie) {
    return `Tie with ${stats.totalVotes} votes`;
  }

  if (stats.leadingOption) {
    return `"${stats.leadingOption.text}" leading with ${stats.leadingPercentage}%`;
  }

  return `${stats.totalVotes} votes collected`;
};

/**
 * Sort poll options by different criteria
 */
export const sortPollOptions = (
  options: PollOption[],
  sortBy: 'votes' | 'text' | 'original' = 'original',
  order: 'asc' | 'desc' = 'desc'
): PollOption[] => {
  if (sortBy === 'original') {
    return [...options];
  }

  const sorted = [...options].sort((a, b) => {
    if (sortBy === 'votes') {
      return order === 'asc' ? a.votes - b.votes : b.votes - a.votes;
    } else if (sortBy === 'text') {
      const comparison = a.text.localeCompare(b.text);
      return order === 'asc' ? comparison : -comparison;
    }
    return 0;
  });

  return sorted;
};

/**
 * Check if poll is active
 */
export const isPollActive = (data: PollData): boolean => {
  if (data.settings.endDate && new Date() > new Date(data.settings.endDate)) {
    return false;
  }

  if (data.settings.maxVotes && data.metadata.totalVotes >= data.settings.maxVotes) {
    return false;
  }

  return true;
};

/**
 * Get remaining time for poll (if end date is set)
 */
export const getPollTimeRemaining = (
  data: PollData
): {
  timeRemaining: number; // milliseconds
  formatted: string;
  hasEnded: boolean;
} | null => {
  if (!data.settings.endDate) {
    return null;
  }

  const endTime = new Date(data.settings.endDate).getTime();
  const now = Date.now();
  const timeRemaining = endTime - now;
  const hasEnded = timeRemaining <= 0;

  if (hasEnded) {
    return {
      timeRemaining: 0,
      formatted: 'Poll has ended',
      hasEnded: true,
    };
  }

  // Format remaining time
  const days = Math.floor(timeRemaining / (1000 * 60 * 60 * 24));
  const hours = Math.floor((timeRemaining % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((timeRemaining % (1000 * 60 * 60)) / (1000 * 60));

  let formatted = '';
  if (days > 0) {
    formatted = `${days}d ${hours}h remaining`;
  } else if (hours > 0) {
    formatted = `${hours}h ${minutes}m remaining`;
  } else {
    formatted = `${minutes}m remaining`;
  }

  return {
    timeRemaining,
    formatted,
    hasEnded: false,
  };
};
