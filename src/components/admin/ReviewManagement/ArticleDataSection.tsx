// ABOUTME: Article metadata input section for original article information with study type dropdown

import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useStudyTypesConfiguration } from '../../../../packages/hooks/useStudyTypesConfiguration';
import type { ArticleData } from '@/types';

interface ArticleDataSectionProps {
  data: ArticleData;
  onChange: (field: string, value: string) => void;
}

export const ArticleDataSection = ({ data, onChange }: ArticleDataSectionProps) => {
  const { data: studyTypes = [], isLoading: studyTypesLoading } = useStudyTypesConfiguration();

  const handleInputChange = (field: string, value: string) => {
    onChange(field, value);
  };

  return (
    <Card className="bg-surface border-border shadow-sm">
      <CardHeader className="pb-4">
        <CardTitle className="text-xl font-semibold text-foreground">
          Dados do Artigo Original
        </CardTitle>
        <CardDescription className="text-muted-foreground">
          Informações sobre o artigo científico original (quando aplicável)
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Article Title */}
        <div className="space-y-3">
          <Label htmlFor="original_article_title" className="text-sm font-medium text-foreground">Título do Artigo Original</Label>
          <Input
            id="original_article_title"
            value={data.original_article_title || ''}
            onChange={(e) => handleInputChange('original_article_title', e.target.value)}
            placeholder="Digite o título do artigo original..."
            className="w-full"
          />
        </div>

        {/* Authors */}
        <div className="space-y-3">
          <Label htmlFor="original_article_authors" className="text-sm font-medium text-foreground">Autores do Artigo</Label>
          <Input
            id="original_article_authors"
            value={data.original_article_authors || ''}
            onChange={(e) => handleInputChange('original_article_authors', e.target.value)}
            placeholder="Ex: Silva A, Santos B, Costa C..."
            className="w-full"
          />
        </div>

        {/* Publication Date */}
        <div className="space-y-3">
          <Label htmlFor="original_article_publication_date" className="text-sm font-medium text-foreground">Data de Publicação</Label>
          <Input
            id="original_article_publication_date"
            type="date"
            value={data.original_article_publication_date || ''}
            onChange={(e) => handleInputChange('original_article_publication_date', e.target.value)}
            className="w-full"
          />
        </div>

        {/* Study Type */}
        <div className="space-y-3">
          <Label htmlFor="study_type" className="text-sm font-medium text-foreground">Tipo de Estudo</Label>
          <Select 
            value={data.study_type || ''} 
            onValueChange={(value) => handleInputChange('study_type', value)}
          >
            <SelectTrigger id="study_type">
              <SelectValue placeholder="Selecionar tipo de estudo..." />
            </SelectTrigger>
            <SelectContent>
              {studyTypesLoading ? (
                <SelectItem value="loading" disabled>
                  Carregando tipos de estudo...
                </SelectItem>
              ) : studyTypes.length === 0 ? (
                <SelectItem value="empty" disabled>
                  Nenhum tipo de estudo configurado
                </SelectItem>
              ) : (
                studyTypes.map((type: string) => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
        </div>

        {/* Helper text */}
        <div className="pt-4 border-t border-border">
          <p className="text-sm text-muted-foreground">
            Estes campos são opcionais e devem ser preenchidos quando a review se refere a um artigo científico específico.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};