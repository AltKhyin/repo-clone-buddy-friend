// ABOUTME: Reddit-style Countdown section for event countdowns with real-time updates

import React from 'react';
import { Clock, Calendar, Timer, AlertCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { RedditSidebarCard, RedditSidebarDivider } from './RedditSidebarCard';
import type {
  CommunitySidebarSection,
  CommunitySidebarData,
} from '../../../../packages/hooks/useCommunityManagementQuery';

interface CountdownSectionProps {
  section: CommunitySidebarSection;
  sidebarData: CommunitySidebarData;
}

interface TimeUnit {
  value: number;
  label: string;
  shortLabel: string;
}

const CountdownDisplay = ({
  targetDate,
  format = 'detailed',
  showLabels = true,
}: {
  targetDate: string;
  format?: 'detailed' | 'compact' | 'simple';
  showLabels?: boolean;
}) => {
  const [timeLeft, setTimeLeft] = React.useState<TimeUnit[]>([]);
  const [isExpired, setIsExpired] = React.useState(false);

  React.useEffect(() => {
    const calculateTimeLeft = () => {
      const difference = new Date(targetDate).getTime() - new Date().getTime();

      if (difference <= 0) {
        setIsExpired(true);
        return [];
      }

      const timeUnits: TimeUnit[] = [
        {
          value: Math.floor(difference / (1000 * 60 * 60 * 24)),
          label: 'dias',
          shortLabel: 'd',
        },
        {
          value: Math.floor((difference / (1000 * 60 * 60)) % 24),
          label: 'horas',
          shortLabel: 'h',
        },
        {
          value: Math.floor((difference / 1000 / 60) % 60),
          label: 'minutos',
          shortLabel: 'm',
        },
        {
          value: Math.floor((difference / 1000) % 60),
          label: 'segundos',
          shortLabel: 's',
        },
      ];

      return timeUnits.filter(unit => unit.value > 0);
    };

    const timer = setInterval(() => {
      const newTimeLeft = calculateTimeLeft();
      setTimeLeft(newTimeLeft);
    }, 1000);

    // Calculate initial time
    const initialTimeLeft = calculateTimeLeft();
    setTimeLeft(initialTimeLeft);

    return () => clearInterval(timer);
  }, [targetDate]);

  if (isExpired) {
    return (
      <div className="text-center py-4">
        <AlertCircle className="h-8 w-8 text-gray-400 mx-auto mb-2" />
        <div className="text-sm text-gray-500 dark:text-gray-400">Evento finalizado</div>
      </div>
    );
  }

  if (timeLeft.length === 0) {
    return (
      <div className="text-center py-4">
        <Timer className="h-8 w-8 text-blue-500 mx-auto mb-2 animate-pulse" />
        <div className="text-sm text-gray-500 dark:text-gray-400">Carregando...</div>
      </div>
    );
  }

  const renderDetailed = () => (
    <div className="grid grid-cols-2 gap-2">
      {timeLeft.slice(0, 4).map((unit, index) => (
        <div key={unit.label} className="text-center">
          <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-2">
            <div className="text-lg font-bold text-gray-900 dark:text-gray-100">
              {unit.value.toString().padStart(2, '0')}
            </div>
            {showLabels && (
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">{unit.label}</div>
            )}
          </div>
        </div>
      ))}
    </div>
  );

  const renderCompact = () => (
    <div className="flex items-center justify-center gap-1 text-lg font-mono">
      {timeLeft.slice(0, 3).map((unit, index) => (
        <React.Fragment key={unit.label}>
          <span className="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded text-gray-900 dark:text-gray-100">
            {unit.value.toString().padStart(2, '0')}
          </span>
          {showLabels && (
            <span className="text-xs text-gray-500 dark:text-gray-400 mx-1">{unit.shortLabel}</span>
          )}
          {index < Math.min(timeLeft.length, 3) - 1 && (
            <span className="text-gray-400 mx-1">:</span>
          )}
        </React.Fragment>
      ))}
    </div>
  );

  const renderSimple = () => (
    <div className="text-center">
      <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
        {timeLeft[0]?.value || 0}
      </div>
      {showLabels && (
        <div className="text-sm text-gray-500 dark:text-gray-400">
          {timeLeft[0]?.label || 'dias'}
        </div>
      )}
    </div>
  );

  switch (format) {
    case 'compact':
      return renderCompact();
    case 'simple':
      return renderSimple();
    default:
      return renderDetailed();
  }
};

const CountdownItem = ({ countdown }: { countdown: any }) => {
  const formatEventDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getUrgencyColor = (targetDate: string) => {
    const difference = new Date(targetDate).getTime() - new Date().getTime();
    const hoursLeft = difference / (1000 * 60 * 60);

    if (hoursLeft <= 24) return 'text-red-600 dark:text-red-400';
    if (hoursLeft <= 72) return 'text-orange-600 dark:text-orange-400';
    return 'text-blue-600 dark:text-blue-400';
  };

  return (
    <div className="space-y-3">
      {/* Countdown Header */}
      <div className="flex items-center gap-2">
        <Calendar className={`h-4 w-4 ${getUrgencyColor(countdown.target_date)}`} />
        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-sm text-gray-900 dark:text-gray-100 truncate">
            {countdown.title}
          </h4>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            {formatEventDate(countdown.target_date)}
          </p>
        </div>
      </div>

      {/* Countdown Display */}
      <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-3">
        <CountdownDisplay
          targetDate={countdown.target_date}
          format={countdown.display_format || 'detailed'}
          showLabels={countdown.show_labels !== false}
        />
      </div>

      {/* Countdown Description */}
      {countdown.description && (
        <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
          {countdown.description}
        </p>
      )}

      {/* Event Type Badge */}
      {countdown.event_type && (
        <div className="flex justify-center">
          <Badge variant="outline" className="text-xs">
            {countdown.event_type}
          </Badge>
        </div>
      )}
    </div>
  );
};

export const CountdownSection = ({ section, sidebarData }: CountdownSectionProps) => {
  const content = section.content || {};
  const computedData = section.computed_data || {};

  const showMultipleCountdowns = content.show_multiple_countdowns || false;
  const maxCountdowns = content.max_countdowns || 1;

  // Mock countdown data - in real implementation, this would come from computed_data
  const countdowns = computedData.countdowns || [
    {
      id: '1',
      title: 'Próxima Edição da Revista',
      description: 'Submissão de artigos para a próxima edição da revista EVIDENS.',
      target_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
      display_format: 'detailed',
      show_labels: true,
      event_type: 'Deadline',
      is_active: true,
      completion_message: 'Período de submissão encerrado!',
    },
    {
      id: '2',
      title: 'Webinar Mensal',
      description: 'Próximo webinar sobre evidências em medicina.',
      target_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(), // 14 days from now
      display_format: 'compact',
      show_labels: true,
      event_type: 'Evento',
      is_active: true,
      completion_message: 'Webinar em andamento!',
    },
  ];

  // Filter active countdowns and limit based on configuration
  const activeCountdowns = countdowns
    .filter(countdown => countdown.is_active)
    .slice(0, showMultipleCountdowns ? maxCountdowns : 1);

  if (activeCountdowns.length === 0) {
    return null;
  }

  return (
    <RedditSidebarCard title={section.title}>
      <div className="space-y-4">
        {/* Countdown Header */}
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
            {activeCountdowns.length} {activeCountdowns.length === 1 ? 'evento' : 'eventos'}{' '}
            programados
          </span>
        </div>

        {/* Countdowns List */}
        <div className="space-y-4">
          {activeCountdowns.map((countdown, index) => (
            <React.Fragment key={countdown.id}>
              <CountdownItem countdown={countdown} />
              {index < activeCountdowns.length - 1 && <RedditSidebarDivider />}
            </React.Fragment>
          ))}
        </div>

        {/* Footer Info */}
        {countdowns.length > maxCountdowns && showMultipleCountdowns && (
          <>
            <RedditSidebarDivider />
            <div className="text-center">
              <button className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium">
                Ver todos os eventos ({countdowns.length - maxCountdowns} mais)
              </button>
            </div>
          </>
        )}
      </div>
    </RedditSidebarCard>
  );
};
