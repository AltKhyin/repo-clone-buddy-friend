
// ABOUTME: Community information page displaying rules, links, and other static community content.

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { ArrowLeft, ExternalLink } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const CommunityInfoPage = () => {
  const navigate = useNavigate();

  // Static community data (this would typically come from the sidebar data)
  const communityRules = [
    'Seja respeitoso com outros membros',
    'Mantenha discussões relevantes ao tema',
    'Não faça spam ou autopromoção',
    'Use linguagem apropriada'
  ];

  const communityLinks = [
    { title: 'Guia da Comunidade', url: '/community/about' },
    { title: 'FAQ', url: '/faq' }
  ];

  return (
    <div className="container mx-auto px-4 py-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate('/comunidade')}
        >
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <h1 className="text-2xl font-bold">Informações da Comunidade</h1>
      </div>

      <div className="space-y-6">
        {/* Community Rules */}
        <Card>
          <CardHeader>
            <CardTitle>Regras da Comunidade</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {communityRules.map((rule, index) => (
                <li key={index} className="flex items-start gap-2">
                  <span className="text-primary font-semibold mt-1">•</span>
                  <span>{rule}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        {/* Useful Links */}
        <Card>
          <CardHeader>
            <CardTitle>Links Úteis</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {communityLinks.map((link, index) => (
                <a
                  key={index}
                  href={link.url}
                  className="flex items-center gap-2 text-primary hover:underline"
                >
                  <ExternalLink className="w-4 h-4" />
                  {link.title}
                </a>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Community Stats */}
        <Card>
          <CardHeader>
            <CardTitle>Estatísticas da Comunidade</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">150+</div>
                <div className="text-sm text-muted-foreground">Membros Ativos</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">25</div>
                <div className="text-sm text-muted-foreground">Discussões Hoje</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">500+</div>
                <div className="text-sm text-muted-foreground">Total de Discussões</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CommunityInfoPage;
