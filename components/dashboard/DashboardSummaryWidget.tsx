'use client';

import Link from 'next/link';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { IconDefinition } from '@fortawesome/fontawesome-svg-core';

interface DashboardSummaryWidgetProps {
  count: number;
  label: string;
  icon: IconDefinition;
  href: string;
  isLoading?: boolean;
}

export function DashboardSummaryWidget({
  count,
  label,
  icon,
  href,
  isLoading = false,
}: DashboardSummaryWidgetProps) {
  return (
    <Link
      href={href}
      className="block bg-surface border-2 border-border rounded-lg p-4 shadow-md transition-all hover:shadow-xl hover:border-primary hover:-translate-y-1 cursor-pointer"
    >
      {/* Loading indicator - top right */}
      <div className="text-right mb-2 h-6">
        {isLoading && (
          <div className="inline-block w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        )}
      </div>

      {/* Icon - hidden on small, visible on medium+ */}
      <div className="float-right text-right mb-2">
        <FontAwesomeIcon
          icon={icon}
          className="w-12 h-12 text-text-muted hidden md:block"
        />
      </div>

      {/* Count - large number */}
      <div className="text-4xl font-bold mb-1 text-primary">{count}</div>

      {/* Label - uppercase small text */}
      <div className="text-xs uppercase font-semibold text-text-muted tracking-wide">
        {label}
      </div>

      {/* Progress bar - full width with gradient */}
      <div className="mt-3 w-full h-1.5 bg-border rounded-full overflow-hidden">
        <div className="h-full w-full bg-gradient-to-r from-primary to-primary-light" />
      </div>
    </Link>
  );
}
