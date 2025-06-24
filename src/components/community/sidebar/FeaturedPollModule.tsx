
// ABOUTME: Featured poll module for community sidebar showing weekly poll as specified in Blueprint 06.

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Button } from '../../ui/button';
import { Progress } from '../../ui/progress';
import { Vote } from 'lucide-react';

interface PollOption {
  id: number;
  option_text: string;
  vote_count: number;
}

interface FeaturedPoll {
  id: number;
  question: string;
  total_votes: number;
  PollOptions: PollOption[];
}

interface FeaturedPollModuleProps {
  poll: FeaturedPoll;
}

export const FeaturedPollModule = ({ poll }: FeaturedPollModuleProps) => {
  if (!poll) {
    return null;
  }

  const handleVote = (optionId: number) => {
    // TODO: Implement poll voting functionality
    console.log(`Vote for option ${optionId} in poll ${poll.id}`);
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Vote className="w-4 h-4" />
          Enquete da Semana
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-4">
          <h4 className="text-sm font-medium">{poll.question}</h4>
          
          <div className="space-y-3">
            {poll.PollOptions?.map((option) => {
              const percentage = poll.total_votes > 0 
                ? Math.round((option.vote_count / poll.total_votes) * 100)
                : 0;
              
              return (
                <div key={option.id} className="space-y-2">
                  <Button
                    variant="outline"
                    className="w-full text-left justify-start h-auto p-3"
                    onClick={() => handleVote(option.id)}
                  >
                    <div className="w-full">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-sm">{option.option_text}</span>
                        <span className="text-xs text-muted-foreground">
                          {percentage}%
                        </span>
                      </div>
                      <Progress value={percentage} className="h-2" />
                    </div>
                  </Button>
                </div>
              );
            })}
          </div>

          <div className="text-xs text-muted-foreground text-center">
            {poll.total_votes} votos totais
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
