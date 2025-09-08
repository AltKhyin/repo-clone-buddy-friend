
// ABOUTME: Module component for the next edition suggestion and voting system with mobile progressive disclosure.

import React, { useState, useMemo } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Progress } from '../ui/progress';
import { Clock } from 'lucide-react';
import SuggestionPollItem from './SuggestionPollItem';
import { useSubmitSuggestionMutation } from '@packages/hooks/useSubmitSuggestionMutation';
import { useIsMobile } from '../../hooks/use-mobile';
import { useActiveCountdown, useReviewMode } from '../../../packages/hooks/useNextEditionManagement';

export interface Suggestion {
  id: number;
  title: string;
  description: string;
  upvotes: number;
  created_at: string;
  user_has_voted?: boolean;
  Practitioners: {
    full_name: string;
    avatar_url?: string;
  };
}

interface NextEditionModuleProps {
  suggestions: Suggestion[];
}

const NextEditionModule: React.FC<NextEditionModuleProps> = ({ suggestions }) => {
  const [newSuggestion, setNewSuggestion] = useState('');
  const [showAllSuggestions, setShowAllSuggestions] = useState(false);
  const submitSuggestionMutation = useSubmitSuggestionMutation();
  const isMobile = useIsMobile();
  
  // Real countdown data from database
  const { data: countdown, isLoading: countdownLoading } = useActiveCountdown();
  const { data: reviewMode } = useReviewMode();

  // Calculate real countdown and progress
  const { countdownText, progressPercentage } = useMemo(() => {
    if (!countdown) {
      return { countdownText: 'Não configurado', progressPercentage: 0 };
    }

    const now = new Date();
    const target = new Date(countdown.target_date);
    const diff = target.getTime() - now.getTime();

    if (diff <= 0) {
      return { countdownText: 'Finalizado', progressPercentage: 100 };
    }

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    // Create countdown text
    let countdownText = '';
    if (days > 0) {
      countdownText += `${days}d `;
    }
    if (hours > 0 || days > 0) {
      countdownText += `${hours}h `;
    }
    countdownText += `${minutes}min`;

    // Calculate progress using real start and end dates
    const startTime = new Date(countdown.start_date).getTime();
    const targetTime = new Date(countdown.target_date).getTime();
    const totalDuration = targetTime - startTime;
    const elapsed = now.getTime() - startTime;
    const progressPercentage = Math.max(0, Math.min(100, (elapsed / totalDuration) * 100));

    return { countdownText: countdownText.trim(), progressPercentage };
  }, [countdown]);

  // Progressive disclosure for mobile - show only top 3-5 items per DOC_8 RULE 5
  const displayedSuggestions = isMobile && !showAllSuggestions 
    ? suggestions.slice(0, 3) 
    : suggestions;

  const hasMoreSuggestions = isMobile && suggestions.length > 3;

  const handleSubmitSuggestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSuggestion.trim()) return;

    try {
      await submitSuggestionMutation.mutateAsync({
        title: newSuggestion.trim(),
        description: ''
      });
      
      setNewSuggestion('');
    } catch (error) {
      console.error('Failed to submit suggestion:', error);
    }
  };

  return (
    <div className="bg-background rounded-md p-6 border border-border shadow-md">
      <div className={`${isMobile ? 'space-y-6' : 'grid md:grid-cols-2 gap-8'}`}>
        {/* Left Column / Top Section - Suggestion Form */}
        <div className="flex flex-col justify-center space-y-6">
          <div>
            {/* Header with title and timer */}
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-foreground font-serif">Próxima Edição</h2>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock size={16} />
                <span>{countdownLoading ? 'Carregando...' : countdownText}</span>
              </div>
            </div>
            
            {/* Progress Bar */}
            <div className="mb-6">
              <Progress value={progressPercentage} className="w-full h-2" />
            </div>
          </div>

          <form onSubmit={handleSubmitSuggestion} className="space-y-4">
            <Input
              type="text"
              placeholder="Sugira um artigo ou tema para a próxima edição"
              value={newSuggestion}
              onChange={(e) => setNewSuggestion(e.target.value)}
              className="w-full bg-surface-muted"
              disabled={submitSuggestionMutation.isPending}
            />
            <Button 
              type="submit" 
              disabled={!newSuggestion.trim() || submitSuggestionMutation.isPending}
              className={`w-full bg-primary text-primary-foreground ${isMobile ? 'min-h-[44px] touch-target' : ''}`}
            >
              {submitSuggestionMutation.isPending ? 'Enviando...' : 'Enviar Sugestão'}
            </Button>
          </form>
        </div>

        {/* Right Column / Bottom Section - Voting List */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-foreground">Vote nas sugestões</h3>
          <div className={`space-y-3 ${isMobile ? 'max-h-none' : 'max-h-80 overflow-y-auto'}`}>
            {displayedSuggestions.length > 0 ? (
              <>
                {displayedSuggestions.map((suggestion) => (
                  <SuggestionPollItem key={suggestion.id} suggestion={suggestion} />
                ))}
                
                {/* Progressive disclosure button for mobile */}
                {hasMoreSuggestions && !showAllSuggestions && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowAllSuggestions(true)}
                    className={`w-full ${isMobile ? 'min-h-[44px] touch-target' : ''}`}
                  >
                    Ver todas ({suggestions.length - 3} mais)
                  </Button>
                )}
              </>
            ) : (
              <div className="text-secondary text-center py-8">
                <p className="text-sm">Nenhuma sugestão disponível no momento.</p>
                <p className="text-xs mt-2">Seja o primeiro a sugerir um tópico!</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default NextEditionModule;
