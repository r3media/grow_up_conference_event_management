import { createContext, useContext, useEffect, useState } from 'react';

const ThemeContext = createContext({
  theme: 'vibrant',
  setTheme: () => {},
});

export const themes = {
  light: {
    name: 'Light',
    description: 'Clean modern light theme',
    icon: '☀️'
  },
  dark: {
    name: 'Dark',
    description: 'Easy on the eyes dark theme',
    icon: '🌙'
  },
  vibrant: {
    name: 'Vibrant',
    description: 'Colorful and energetic theme',
    icon: '🎨'
  }
};

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => {
    // Get from localStorage or default to vibrant
    const saved = localStorage.getItem('theme');
    return saved && themes[saved] ? saved : 'vibrant';
  });

  useEffect(() => {
    const root = document.documentElement;
    
    // Remove all theme classes
    root.classList.remove('light', 'dark', 'vibrant');
    
    // Add the current theme class
    root.classList.add(theme);
    
    // Save to localStorage
    localStorage.setItem('theme', theme);
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, themes }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
