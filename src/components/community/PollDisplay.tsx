// ABOUTME: Professional Reddit-inspired poll display component with voting functionality and elegant styling.

import React, { useState, useMemo } from 'react';
import { Button } from '../ui/button';
import { Progress } from '../ui/progress';
import { Badge } from '../ui/badge';
import { CheckCircle, Circle, Users, Clock, BarChart3 } from 'lucide-react';
import { cn } from '../../lib/utils';
import { toast } from 'sonner';
import { useAuthStore } from '../../store/auth';
import { usePollVoteMutation } from '@packages/hooks/usePollVoteMutation';
import { formatDistanceToNow, isValid, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface PollOption {
  text: string;
  votes?: number;
  id?: string;
}

interface PollData {
  question: string;
  options: PollOption[];
  expiresAt?: string;
  total_votes?: number;
  user_vote?: string | null;
}

interface PollDisplayProps {
  pollData: PollData;
  isCompact?: boolean; // For feed view vs detail view
  allowVoting?: boolean;
  postId: number;
  className?: string;
}

export const PollDisplay = ({ 
  pollData, 
  isCompact = false, 
  allowVoting = true,
  postId,
  className 
}: PollDisplayProps) => {
  const { user } = useAuthStore();
  const pollVoteMutation = usePollVoteMutation();
  const [userVote, setUserVote] = useState<string | null>(pollData.user_vote || null);

  // Calculate total votes and percentages
  const totalVotes = useMemo(() => {
    return pollData.total_votes || pollData.options.reduce((sum, option) => sum + (option.votes || 0), 0);
  }, [pollData]);

  const optionsWithPercentages = useMemo(() => {
    return pollData.options.map((option, index) => {
      const votes = option.votes || 0;
      const percentage = totalVotes > 0 ? (votes / totalVotes) * 100 : 0;
      return {
        ...option,
        votes,
        percentage,
        index
      };
    });
  }, [pollData.options, totalVotes]);

  // Check if poll is expired
  const isExpired = useMemo(() => {
    if (!pollData.expiresAt) return false;
    try {
      const expiryDate = parseISO(pollData.expiresAt);
      return isValid(expiryDate) && expiryDate < new Date();
    } catch {
      return false;
    }
  }, [pollData.expiresAt]);

  // Format expiry time
  const timeRemaining = useMemo(() => {
    if (!pollData.expiresAt || isExpired) return null;
    try {
      const expiryDate = parseISO(pollData.expiresAt);
      if (!isValid(expiryDate)) return null;
      return formatDistanceToNow(expiryDate, { addSuffix: true, locale: ptBR });
    } catch {
      return null;
    }
  }, [pollData.expiresAt, isExpired]);

  const canVote = allowVoting && user && !isExpired && !pollVoteMutation.isPending;
  const hasVoted = userVote !== null;

  const handleVote = async (optionIndex: number) => {
    if (!canVote) {
      if (!user) {
        toast.error('Você precisa estar logado para votar');
      } else if (isExpired) {
        toast.error('Esta enquete já expirou');
      }
      return;
    }

    try {
      await pollVoteMutation.mutateAsync({
        post_id: postId,
        option_index: optionIndex
      });
      
      setUserVote(optionIndex.toString());
      toast.success('Voto registrado com sucesso!');
    } catch (error) {
      console.error('Error voting:', error);
      toast.error('Erro ao registrar voto. Tente novamente.');
    }
  };

  if (isCompact) {
    // Compact view for community feed
    return (
      <div className={cn("border border-border rounded-lg overflow-hidden", className)}>
        <div className="p-4 bg-surface/30">
          <div className="flex items-start justify-between gap-3 mb-3">
            <div className="flex-1">
              <h4 className="font-medium text-foreground leading-snug">
                {pollData.question}
              </h4>
              <div className="flex items-center gap-3 mt-2 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Users className="w-4 h-4" />
                  {totalVotes} {totalVotes === 1 ? 'voto' : 'votos'}
                </div>
                <div className="flex items-center gap-1">
                  <BarChart3 className="w-4 h-4" />
                  {pollData.options.length} opções
                </div>
                {timeRemaining && (
                  <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    {timeRemaining}
                  </div>
                )}
              </div>
            </div>
            <Badge variant={isExpired ? "destructive" : hasVoted ? "default" : "secondary"} className="text-xs">
              {isExpired ? 'Expirada' : hasVoted ? 'Votou' : 'Ativa'}
            </Badge>
          </div>

          {/* Compact options preview - show top 2 options with bars */}
          <div className="space-y-2">
            {optionsWithPercentages.slice(0, 2).map((option) => (
              <div key={option.index} className="relative">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium truncate flex-1 mr-2">{option.text}</span>
                  <span className="text-muted-foreground text-xs">
                    {option.percentage.toFixed(0)}%
                  </span>
                </div>
                <div className="mt-1">
                  <Progress value={option.percentage} className="h-1.5" />
                </div>
              </div>
            ))}
            
            {pollData.options.length > 2 && (
              <div className="text-center pt-1">
                <span className="text-xs text-muted-foreground">
                  +{pollData.options.length - 2} opções adicionais
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Full view for post detail
  return (
    <div className={cn("border border-border rounded-lg overflow-hidden", className)}>
      {/* Poll Header */}
      <div className="p-4 bg-surface/30 border-b border-border">
        <div className="flex items-start justify-between gap-3 mb-3">
          <h3 className="font-semibold text-lg text-foreground leading-tight flex-1">
            {pollData.question}
          </h3>
          <Badge variant={isExpired ? "destructive" : hasVoted ? "default" : "secondary"}>
            {isExpired ? 'Expirada' : hasVoted ? 'Votou' : 'Ativa'}
          </Badge>
        </div>
        
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <Users className="w-4 h-4" />
            {totalVotes} {totalVotes === 1 ? 'voto' : 'votos'}
          </div>
          <div className="flex items-center gap-1">
            <BarChart3 className="w-4 h-4" />
            {pollData.options.length} opções
          </div>
          {timeRemaining && (
            <div className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              Encerra {timeRemaining}
            </div>
          )}
          {isExpired && (
            <div className="flex items-center gap-1 text-destructive">
              <Clock className="w-4 h-4" />
              Expirada
            </div>
          )}
        </div>
      </div>

      {/* Poll Options */}
      <div className="p-4">
        <div className="space-y-3">
          {optionsWithPercentages.map((option) => {
            const isUserChoice = userVote === option.index.toString();
            const isLeading = option.percentage === Math.max(...optionsWithPercentages.map(o => o.percentage)) && totalVotes > 0;
            
            return (
              <div key={option.index} className="relative">
                <Button
                  variant="ghost"
                  className={cn(
                    "w-full p-3 h-auto justify-start text-left border border-border hover:border-border-hover transition-all duration-200 relative overflow-hidden",
                    isUserChoice && "border-primary bg-primary/5",
                    !canVote && "cursor-default",
                    canVote && "hover:bg-surface-muted/50"
                  )}
                  onClick={() => canVote && handleVote(option.index)}
                  disabled={pollVoteMutation.isPending}
                >
                  {/* Progress background */}
                  {hasVoted && (
                    <div 
                      className={cn(
                        "absolute inset-0 transition-all duration-500 ease-out",
                        isUserChoice ? "bg-primary/10" : "bg-surface-muted/30"
                      )}
                      style={{ width: `${option.percentage}%` }}
                    />
                  )}
                  
                  {/* Content */}
                  <div className="relative flex items-center justify-between w-full">
                    <div className="flex items-center gap-3 flex-1">
                      <div className="flex-shrink-0">
                        {hasVoted ? (
                          isUserChoice ? (
                            <CheckCircle className="w-5 h-5 text-primary" />
                          ) : (
                            <Circle className="w-5 h-5 text-muted-foreground" />
                          )
                        ) : (
                          <Circle className="w-5 h-5 text-muted-foreground" />
                        )}
                      </div>
                      <span className={cn(
                        "font-medium text-sm flex-1",
                        isUserChoice && "text-primary",
                        isLeading && hasVoted && "font-semibold"
                      )}>
                        {option.text}
                      </span>
                    </div>
                    
                    {hasVoted && (
                      <div className="flex items-center gap-2 text-sm">
                        <span className={cn(
                          "font-medium",
                          isUserChoice && "text-primary"
                        )}>
                          {option.votes} {option.votes === 1 ? 'voto' : 'votos'}
                        </span>
                        <span className={cn(
                          "font-bold min-w-[3rem] text-right",
                          isUserChoice && "text-primary",
                          isLeading && "text-foreground"
                        )}>
                          {option.percentage.toFixed(1)}%
                        </span>
                      </div>
                    )}
                  </div>
                </Button>
              </div>
            );
          })}
        </div>

        {/* Vote instruction or results summary */}
        <div className="mt-4 pt-3 border-t border-border">
          {!hasVoted && canVote && (
            <p className="text-sm text-muted-foreground text-center">
              Clique em uma opção para votar
            </p>
          )}
          {hasVoted && (
            <p className="text-sm text-muted-foreground text-center">
              Você votou em "{optionsWithPercentages.find(o => o.index.toString() === userVote)?.text}"
            </p>
          )}
          {!user && (
            <p className="text-sm text-muted-foreground text-center">
              Faça login para participar da enquete
            </p>
          )}
          {isExpired && (
            <p className="text-sm text-destructive text-center">
              Esta enquete expirou e não aceita mais votos
            </p>
          )}
        </div>
      </div>
    </div>
  );
};