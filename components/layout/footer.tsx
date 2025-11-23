'use client';

import { useState, useEffect } from 'react';

export function Footer() {
  const currentYear = new Date().getFullYear();
  const [isDarkTheme, setIsDarkTheme] = useState(true);

  useEffect(() => {
    // Check localStorage for theme preference on mount
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'light') {
      setIsDarkTheme(false);
      document.body.classList.add('light-theme');
    }
  }, []);

  const toggleTheme = () => {
    const newTheme = !isDarkTheme;
    setIsDarkTheme(newTheme);

    if (newTheme) {
      // Dark theme
      document.body.classList.remove('light-theme');
      localStorage.setItem('theme', 'dark');
    } else {
      // Light theme
      document.body.classList.add('light-theme');
      localStorage.setItem('theme', 'light');
    }
  };

  return (
    <footer className="bg-sidebar border-t border-border p-4">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-2 text-sm text-text-muted">
        <div className="text-center sm:text-left">
          <a
            href="http://www.rpthreadtracker.com"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-primary transition-colors"
          >
            RPThreadTracker
          </a>
          {' '}&copy; {currentYear}{' '}
          <a
            href="http://blackjack-software.com"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-primary transition-colors"
          >
            Blackjack Software
          </a>
        </div>

        <div className="flex items-center gap-4">
          <div>
            Switch to{' '}
            <button
              type="button"
              onClick={toggleTheme}
              className="hover:text-primary transition-colors underline"
            >
              {isDarkTheme ? 'light theme' : 'dark theme'}
            </button>
          </div>
          <div>
            Support on{' '}
            <a
              href="https://www.patreon.com/bePatron?u=4797959"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-primary transition-colors"
            >
              Patreon
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
