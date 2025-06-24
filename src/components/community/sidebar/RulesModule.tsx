
// ABOUTME: Community rules display module for sidebar as specified in Blueprint 06.

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';

interface RulesModuleProps {
  rules: string[];
}

export const RulesModule = ({ rules }: RulesModuleProps) => {
  if (!rules || rules.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium">Regras da Comunidade</CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <ol className="space-y-2 text-sm text-muted-foreground">
          {rules.map((rule, index) => (
            <li key={index} className="flex gap-2">
              <span className="text-xs font-medium text-primary">{index + 1}.</span>
              <span>{rule}</span>
            </li>
          ))}
        </ol>
      </CardContent>
    </Card>
  );
};
