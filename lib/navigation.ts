export interface NavItem {
  name: string;
  url?: string;
  icon?: string;
  title?: boolean;
}

export const navigationItems: NavItem[] = [
  {
    name: 'Dashboard',
    url: '/dashboard',
    icon: 'speedometer'
  },
  {
    title: true,
    name: 'Threads'
  },
  {
    name: 'All Threads',
    url: '/threads/all',
    icon: 'list'
  },
  {
    name: 'Your Turn',
    url: '/threads/your-turn',
    icon: 'pencil'
  },
  {
    name: 'Their Turn',
    url: '/threads/their-turn',
    icon: 'check'
  },
  {
    name: 'Archived',
    url: '/threads/archived',
    icon: 'drawer'
  },
  {
    name: 'Queued',
    url: '/threads/queued',
    icon: 'calendar'
  },
  {
    title: true,
    name: 'Manage'
  },
  {
    name: 'Characters',
    url: '/manage-characters',
    icon: 'people'
  },
  {
    name: 'Tools',
    url: '/tools',
    icon: 'wrench'
  },
  {
    name: 'Settings',
    url: '/settings',
    icon: 'settings'
  },
  {
    name: 'Help',
    url: '/help',
    icon: 'info'
  }
];
