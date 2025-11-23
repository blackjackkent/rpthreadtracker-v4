'use client';

import { ReactNode, useState } from 'react';
import { User } from 'next-auth';
import { Header } from './header';
import { Sidebar } from './sidebar';
import { Footer } from './footer';

interface AuthenticatedLayoutProps {
  children: ReactNode;
  user: User;
}

export function AuthenticatedLayout({ children, user }: AuthenticatedLayoutProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  return (
    <div className="app">
      <Header user={user} onSidebarToggle={() => setIsSidebarOpen(!isSidebarOpen)} />

      <div className="app-body">
        <Sidebar isOpen={isSidebarOpen} />

        <main className="main">
          <div className="container mx-auto p-4">{children}</div>
        </main>
      </div>

      <Footer />
    </div>
  );
}
