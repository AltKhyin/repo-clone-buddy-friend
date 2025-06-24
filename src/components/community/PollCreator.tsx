
// ABOUTME: Interactive poll creation component for community posts with dynamic options and validation.

import React, { useState } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Label } from '../ui/label';
import { Plus, X, Calendar } from 'lucide-react';
import { cn } from '../../lib/utils';

interface PollOption {
  id: string;
  text: string;
}

interface PollData {
  question: string;
  options: PollOption[];
  expiresAt?: string;
}

interface PollCreatorProps {
  value?: PollData | null;
  onChange: (pollData: PollData | null) => void;
  onRemove: () => void;
}

export const PollCreator = ({ value, onChange, onRemove }: PollCreatorProps) => {
  const [question, setQuestion] = useState(value?.question || '');
  const [options, setOptions] = useState<PollOption[]>(
    value?.options || [
      { id: '1', text: '' },
      { id: '2', text: '' }
    ]
  );
  const [expiresAt, setExpiresAt] = useState(value?.expiresAt || '');

  const updatePollData = (newQuestion?: string, newOptions?: PollOption[], newExpiresAt?: string) => {
    const updatedQuestion = newQuestion !== undefined ? newQuestion : question;
    const updatedOptions = newOptions || options;
    const updatedExpiresAt = newExpiresAt !== undefined ? newExpiresAt : expiresAt;

    onChange({
      question: updatedQuestion,
      options: updatedOptions,
      expiresAt: updatedExpiresAt || undefined
    });
  };

  const handleQuestionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newQuestion = e.target.value;
    setQuestion(newQuestion);
    updatePollData(newQuestion);
  };

  const handleOptionChange = (id: string, text: string) => {
    const newOptions = options.map(option => 
      option.id === id ? { ...option, text } : option
    );
    setOptions(newOptions);
    updatePollData(undefined, newOptions);
  };

  const addOption = () => {
    if (options.length >= 6) return; // Max 6 options
    
    const newOption: PollOption = {
      id: Date.now().toString(),
      text: ''
    };
    const newOptions = [...options, newOption];
    setOptions(newOptions);
    updatePollData(undefined, newOptions);
  };

  const removeOption = (id: string) => {
    if (options.length <= 2) return; // Min 2 options
    
    const newOptions = options.filter(option => option.id !== id);
    setOptions(newOptions);
    updatePollData(undefined, newOptions);
  };

  const handleExpiresAtChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newExpiresAt = e.target.value;
    setExpiresAt(newExpiresAt);
    updatePollData(undefined, undefined, newExpiresAt);
  };

  const isValid = question.trim() && options.filter(opt => opt.text.trim()).length >= 2;

  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Criar Enquete</CardTitle>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onRemove}
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Poll Question */}
        <div className="space-y-2">
          <Label htmlFor="poll-question">Pergunta da Enquete *</Label>
          <Input
            id="poll-question"
            placeholder="Qual é a sua pergunta?"
            value={question}
            onChange={handleQuestionChange}
            className={cn(!question.trim() && "border-destructive")}
          />
        </div>

        {/* Poll Options */}
        <div className="space-y-3">
          <Label>Opções da Enquete</Label>
          {options.map((option, index) => (
            <div key={option.id} className="flex gap-2">
              <div className="flex-1">
                <Input
                  placeholder={`Opção ${index + 1}`}
                  value={option.text}
                  onChange={(e) => handleOptionChange(option.id, e.target.value)}
                />
              </div>
              {options.length > 2 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeOption(option.id)}
                >
                  <X className="w-4 h-4" />
                </Button>
              )}
            </div>
          ))}
          
          {options.length < 6 && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addOption}
              className="w-full"
            >
              <Plus className="w-4 h-4 mr-2" />
              Adicionar Opção
            </Button>
          )}
        </div>

        {/* Expiration Date */}
        <div className="space-y-2">
          <Label htmlFor="poll-expires">Data de Expiração (Opcional)</Label>
          <div className="relative">
            <Calendar className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
            <Input
              id="poll-expires"
              type="datetime-local"
              value={expiresAt}
              onChange={handleExpiresAtChange}
              min={new Date().toISOString().slice(0, 16)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Validation Message */}
        {!isValid && (
          <p className="text-sm text-destructive">
            A enquete deve ter uma pergunta e pelo menos 2 opções preenchidas.
          </p>
        )}
      </CardContent>
    </Card>
  );
};
