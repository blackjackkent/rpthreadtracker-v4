'use client';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSearch } from '@fortawesome/free-solid-svg-icons';
import { faList, faPencil, faCheck, faCalendar } from '@fortawesome/free-solid-svg-icons';
import { DashboardSummaryWidget } from './DashboardSummaryWidget';

interface AtAGlanceProps {
  activeThreadsCount?: number;
  yourTurnCount?: number;
  theirTurnCount?: number;
  queuedCount?: number;
  isLoading?: boolean;
}

export function AtAGlance({
  activeThreadsCount = 0,
  yourTurnCount = 0,
  theirTurnCount = 0,
  queuedCount = 0,
  isLoading = false,
}: AtAGlanceProps) {
  return (
    <div className="bg-surface border border-border rounded-lg shadow-sm">
      {/* Header with accent */}
      <div className="px-4 py-3 border-b-2 border-primary bg-gradient-to-r from-primary/5 to-transparent">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <FontAwesomeIcon icon={faSearch} className="w-4 h-4 text-primary" />
          <span>At a Glance</span>
        </h2>
      </div>

      {/* Stats Grid */}
      <div className="p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <DashboardSummaryWidget
            count={activeThreadsCount}
            label="Active Threads"
            icon={faList}
            href="/threads/all"
            isLoading={isLoading}
          />
          <DashboardSummaryWidget
            count={yourTurnCount}
            label="Your Turn"
            icon={faPencil}
            href="/threads/your-turn"
            isLoading={isLoading}
          />
          <DashboardSummaryWidget
            count={theirTurnCount}
            label="Their Turn"
            icon={faCheck}
            href="/threads/their-turn"
            isLoading={isLoading}
          />
          <DashboardSummaryWidget
            count={queuedCount}
            label="Queued"
            icon={faCalendar}
            href="/threads/queued"
            isLoading={isLoading}
          />
        </div>
      </div>
    </div>
  );
}
