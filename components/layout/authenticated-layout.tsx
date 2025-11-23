'use client';

import { ReactNode } from 'react';

interface AuthenticatedLayoutProps {
  children: ReactNode;
}

export function AuthenticatedLayout({ children }: AuthenticatedLayoutProps) {
  return (
    <div className="app">
      {/* Header will go here */}
      <header className="bg-sidebar border-b border-border">
        <div className="h-16 flex items-center px-4">
          <h1 className="text-xl font-semibold">RPThreadTracker</h1>
        </div>
      </header>

      <div className="app-body">
        {/* Sidebar will go here */}
        <aside className="bg-sidebar border-r border-border w-64">
          <nav className="p-4">
            <p className="text-text-muted">Sidebar</p>
          </nav>
        </aside>

        {/* Main content */}
        <main className="main">
          <div className="container mx-auto p-4">{children}</div>
        </main>
      </div>

      {/* Footer will go here */}
      <footer className="bg-sidebar border-t border-border p-4">
        <p className="text-sm text-text-muted text-center">RPThreadTracker v4</p>
      </footer>
    </div>
  );
}
