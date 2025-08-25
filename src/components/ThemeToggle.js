import React from 'react';
import { Moon, SunMedium } from 'lucide-react';

const ThemeToggle = ({ isDark, toggleTheme }) => (
  <button
    onClick={toggleTheme}
    className="theme-toggle"
    aria-label="Toggle theme"
  >
    {isDark ? <SunMedium className="icon" /> : <Moon className="icon" />}
  </button>
);

export default ThemeToggle;
