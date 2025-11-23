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
      className={`bg-sidebar-light border-r border-sidebar-border transition-all duration-300 ${
        isOpen ? 'w-48' : 'w-0 md:w-14'
      } overflow-hidden`}
    >
      <nav className="p-3">
        <ul className="space-y-1">
          {navigationItems.map((item, index) => {
            if (item.title) {
              return (
                <li key={`title-${index}`} className={`text-sidebar-text-muted text-[10px] font-semibold uppercase mt-3 mb-1.5 ${!isOpen && 'md:hidden'}`}>
                  {item.name}
                </li>
              );
            }

            const isActive = pathname === item.url || pathname?.startsWith(item.url + '/');

            return (
              <li key={item.name}>
                <Link
                  href={item.url || '#'}
                  className={`flex items-center gap-2 px-2.5 py-1.5 rounded transition-colors text-sm ${
                    isActive
                      ? 'bg-primary text-white'
                      : 'hover:bg-sidebar-hover text-sidebar-text-muted'
                  } ${!isOpen && 'md:justify-center'}`}
                  title={!isOpen ? item.name : undefined}
                >
                  {item.icon && (
                    <FontAwesomeIcon
                      icon={iconMap[item.icon as keyof typeof iconMap]}
                      className="w-3.5 h-3.5 flex-shrink-0"
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
