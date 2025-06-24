
// ABOUTME: Recent community activity module for sidebar as specified in Blueprint 06.

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Clock } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface RecentActivity {
  id: number;
  title: string;
  created_at: string;
  Practitioners: {
    full_name: string;
  };
}

interface RecentActivityModuleProps {
  activities: RecentActivity[];
}

export const RecentActivityModule = ({ activities }: RecentActivityModuleProps) => {
  const navigate = useNavigate();

  if (!activities || activities.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Clock className="w-4 h-4" />
          Atividade Recente
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-3">
          {activities.slice(0, 3).map((activity) => (
            <div
              key={activity.id}
              onClick={() => navigate(`/comunidade/${activity.id}`)}
              className="cursor-pointer group space-y-1"
            >
              <h4 className="text-sm font-medium group-hover:text-primary transition-colors line-clamp-2">
                {activity.title}
              </h4>
              <div className="text-xs text-muted-foreground">
                <span>por {activity.Practitioners.full_name}</span>
                <span className="mx-2">•</span>
                <span>
                  {formatDistanceToNow(new Date(activity.created_at), {
                    addSuffix: true,
                    locale: ptBR
                  })}
                </span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
