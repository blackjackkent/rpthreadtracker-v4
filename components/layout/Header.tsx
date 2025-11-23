'use client';

import { useState } from 'react';
import Link from 'next/link';
import { User } from 'next-auth';
import { signOut } from 'next-auth/react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBars, faCirclePlus, faUser } from '@fortawesome/free-solid-svg-icons';

interface HeaderProps {
  user: User;
  onSidebarToggle: () => void;
}

export function Header({ user, onSidebarToggle }: HeaderProps) {
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isAddMenuOpen, setIsAddMenuOpen] = useState(false);

  return (
    <header className="bg-primary text-white border-b border-primary-dark sticky top-0 z-50">
      <div className="h-12 flex items-center px-3 justify-between">
        {/* Left side - Logo and sidebar toggle */}
        <div className="flex items-center gap-2">
          <button
            onClick={onSidebarToggle}
            className="p-1.5 hover:bg-primary-dark rounded transition-colors"
            aria-label="Toggle sidebar"
          >
            <FontAwesomeIcon icon={faBars} className="w-4 h-4" />
          </button>
          <Link href="/dashboard" className="text-base font-semibold hover:text-primary-light transition-colors">
            RPTHREADTRACKER
          </Link>
        </div>

        {/* Right side - Add menu and profile dropdown */}
        <div className="flex items-center gap-1.5">
          {/* Add Menu Dropdown */}
          <div className="relative">
            <button
              onClick={() => setIsAddMenuOpen(!isAddMenuOpen)}
              className="p-1.5 hover:bg-primary-dark rounded transition-colors"
              aria-label="Add menu"
            >
              <FontAwesomeIcon icon={faCirclePlus} className="w-4 h-4" />
            </button>
            {isAddMenuOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-surface border border-border rounded shadow-lg">
                <button
                  onClick={() => setIsAddMenuOpen(false)}
                  className="w-full text-left px-4 py-2 hover:bg-background transition-colors"
                >
                  Track New Thread
                </button>
                <button
                  onClick={() => setIsAddMenuOpen(false)}
                  className="w-full text-left px-4 py-2 hover:bg-background transition-colors"
                >
                  Add Character
                </button>
              </div>
            )}
          </div>

          {/* Profile Dropdown */}
          <div className="relative">
            <button
              onClick={() => setIsProfileOpen(!isProfileOpen)}
              className="p-1.5 hover:bg-primary-dark rounded transition-colors"
              aria-label="User menu"
            >
              <FontAwesomeIcon icon={faUser} className="w-4 h-4" />
            </button>
            {isProfileOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-surface border border-border rounded shadow-lg">
                <div className="px-4 py-3 border-b border-border">
                  <p className="text-sm text-text-muted text-center">Logged in as:</p>
                  <p className="font-semibold text-center">{user.name || user.email}</p>
                </div>
                <Link
                  href="/settings"
                  onClick={() => setIsProfileOpen(false)}
                  className="block px-4 py-2 hover:bg-background transition-colors"
                >
                  Account Settings
                </Link>
                <Link
                  href="/tools"
                  onClick={() => setIsProfileOpen(false)}
                  className="block px-4 py-2 hover:bg-background transition-colors"
                >
                  Tracker Tools
                </Link>
                <Link
                  href="/help"
                  onClick={() => setIsProfileOpen(false)}
                  className="block px-4 py-2 hover:bg-background transition-colors"
                >
                  Help
                </Link>
                <button
                  onClick={() => signOut({ callbackUrl: '/login' })}
                  className="w-full text-left px-4 py-2 hover:bg-background transition-colors border-t border-border"
                >
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
