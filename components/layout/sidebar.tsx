'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faGauge,
  faList,
  faPencil,
  faCheck,
  faBox,
  faCalendar,
  faUsers,
  faWrench,
  faGear,
  faCircleInfo
} from '@fortawesome/free-solid-svg-icons';
import { navigationItems } from '@/lib/navigation';

interface SidebarProps {
  isOpen: boolean;
}

const iconMap = {
  speedometer: faGauge,
  list: faList,
  pencil: faPencil,
  check: faCheck,
  drawer: faBox,
  calendar: faCalendar,
  people: faUsers,
  wrench: faWrench,
  settings: faGear,
  info: faCircleInfo,
};

export function Sidebar({ isOpen }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside
      className={`bg-sidebar border-r border-border transition-all duration-300 ${
        isOpen ? 'w-64' : 'w-0 md:w-16'
      } overflow-hidden`}
    >
      <nav className="p-4">
        <ul className="space-y-1">
          {navigationItems.map((item, index) => {
            if (item.title) {
              return (
                <li key={`title-${index}`} className={`text-text-muted text-xs font-semibold uppercase mt-4 mb-2 ${!isOpen && 'md:hidden'}`}>
                  {item.name}
                </li>
              );
            }

            const isActive = pathname === item.url || pathname?.startsWith(item.url + '/');

            return (
              <li key={item.name}>
                <Link
                  href={item.url || '#'}
                  className={`flex items-center gap-3 px-3 py-2 rounded transition-colors ${
                    isActive
                      ? 'bg-primary text-white'
                      : 'hover:bg-surface text-text'
                  } ${!isOpen && 'md:justify-center'}`}
                  title={!isOpen ? item.name : undefined}
                >
                  {item.icon && (
                    <FontAwesomeIcon
                      icon={iconMap[item.icon as keyof typeof iconMap]}
                      className="w-4 h-4 flex-shrink-0"
                    />
                  )}
                  <span className={`${!isOpen && 'md:hidden'}`}>{item.name}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
}
