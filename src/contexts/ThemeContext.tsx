import React, { createContext, useContext, useEffect, useState } from 'react';

export interface Theme {
  id: string;
  name: string;
  description: string;
  colors: {
    background: string;
    foreground: string;
    card: string;
    cardForeground: string;
    popover: string;
    popoverForeground: string;
    primary: string;
    primaryForeground: string;
    primaryHover: string;
    secondary: string;
    secondaryForeground: string;
    muted: string;
    mutedForeground: string;
    accent: string;
    accentForeground: string;
    success: string;
    successForeground: string;
    warning: string;
    warningForeground: string;
    destructive: string;
    destructiveForeground: string;
    border: string;
    input: string;
    ring: string;
    gradientPrimary: string;
    gradientCard: string;
    gradientSuccess: string;
    gradientWarning: string;
  };
}

export const themes: Theme[] = [
  {
    id: 'default',
    name: 'Professional Blue',
    description: 'Clean and professional blue theme',
    colors: {
      background: '220 20% 98%',
      foreground: '220 15% 15%',
      card: '0 0% 100%',
      cardForeground: '220 15% 15%',
      popover: '0 0% 100%',
      popoverForeground: '220 15% 15%',
      primary: '230 60% 55%',
      primaryForeground: '0 0% 100%',
      primaryHover: '230 60% 50%',
      secondary: '220 15% 96%',
      secondaryForeground: '220 15% 15%',
      muted: '220 15% 95%',
      mutedForeground: '220 10% 55%',
      accent: '265 70% 65%',
      accentForeground: '0 0% 100%',
      success: '140 60% 50%',
      successForeground: '0 0% 100%',
      warning: '35 90% 60%',
      warningForeground: '0 0% 100%',
      destructive: '0 84% 60%',
      destructiveForeground: '0 0% 100%',
      border: '220 15% 90%',
      input: '220 15% 95%',
      ring: '230 60% 55%',
      gradientPrimary: 'linear-gradient(135deg, hsl(230 60% 55%), hsl(265 70% 65%))',
      gradientCard: 'linear-gradient(145deg, hsl(0 0% 100%), hsl(220 15% 98%))',
      gradientSuccess: 'linear-gradient(135deg, hsl(140 60% 50%), hsl(160 50% 45%))',
      gradientWarning: 'linear-gradient(135deg, hsl(35 90% 60%), hsl(25 85% 55%))'
    }
  },
  {
    id: 'emerald',
    name: 'Emerald Garden',
    description: 'Fresh and nature-inspired green theme',
    colors: {
      background: '138 20% 97%',
      foreground: '138 15% 15%',
      card: '0 0% 100%',
      cardForeground: '138 15% 15%',
      popover: '0 0% 100%',
      popoverForeground: '138 15% 15%',
      primary: '160 84% 39%',
      primaryForeground: '0 0% 100%',
      primaryHover: '160 84% 35%',
      secondary: '138 15% 96%',
      secondaryForeground: '138 15% 15%',
      muted: '138 15% 95%',
      mutedForeground: '138 10% 55%',
      accent: '142 76% 36%',
      accentForeground: '0 0% 100%',
      success: '120 60% 50%',
      successForeground: '0 0% 100%',
      warning: '35 90% 60%',
      warningForeground: '0 0% 100%',
      destructive: '0 84% 60%',
      destructiveForeground: '0 0% 100%',
      border: '138 15% 90%',
      input: '138 15% 95%',
      ring: '160 84% 39%',
      gradientPrimary: 'linear-gradient(135deg, hsl(160 84% 39%), hsl(142 76% 36%))',
      gradientCard: 'linear-gradient(145deg, hsl(0 0% 100%), hsl(138 15% 98%))',
      gradientSuccess: 'linear-gradient(135deg, hsl(120 60% 50%), hsl(140 50% 45%))',
      gradientWarning: 'linear-gradient(135deg, hsl(35 90% 60%), hsl(25 85% 55%))'
    }
  },
  {
    id: 'sunset',
    name: 'Sunset Orange',
    description: 'Warm and energetic orange theme',
    colors: {
      background: '25 20% 97%',
      foreground: '25 15% 15%',
      card: '0 0% 100%',
      cardForeground: '25 15% 15%',
      popover: '0 0% 100%',
      popoverForeground: '25 15% 15%',
      primary: '20 91% 48%',
      primaryForeground: '0 0% 100%',
      primaryHover: '20 91% 44%',
      secondary: '25 15% 96%',
      secondaryForeground: '25 15% 15%',
      muted: '25 15% 95%',
      mutedForeground: '25 10% 55%',
      accent: '12 76% 61%',
      accentForeground: '0 0% 100%',
      success: '140 60% 50%',
      successForeground: '0 0% 100%',
      warning: '45 93% 47%',
      warningForeground: '0 0% 100%',
      destructive: '0 84% 60%',
      destructiveForeground: '0 0% 100%',
      border: '25 15% 90%',
      input: '25 15% 95%',
      ring: '20 91% 48%',
      gradientPrimary: 'linear-gradient(135deg, hsl(20 91% 48%), hsl(12 76% 61%))',
      gradientCard: 'linear-gradient(145deg, hsl(0 0% 100%), hsl(25 15% 98%))',
      gradientSuccess: 'linear-gradient(135deg, hsl(140 60% 50%), hsl(160 50% 45%))',
      gradientWarning: 'linear-gradient(135deg, hsl(45 93% 47%), hsl(35 85% 55%))'
    }
  },
  {
    id: 'ocean',
    name: 'Ocean Deep',
    description: 'Calming and sophisticated teal theme',
    colors: {
      background: '195 20% 97%',
      foreground: '195 15% 15%',
      card: '0 0% 100%',
      cardForeground: '195 15% 15%',
      popover: '0 0% 100%',
      popoverForeground: '195 15% 15%',
      primary: '194 100% 27%',
      primaryForeground: '0 0% 100%',
      primaryHover: '194 100% 23%',
      secondary: '195 15% 96%',
      secondaryForeground: '195 15% 15%',
      muted: '195 15% 95%',
      mutedForeground: '195 10% 55%',
      accent: '175 60% 33%',
      accentForeground: '0 0% 100%',
      success: '140 60% 50%',
      successForeground: '0 0% 100%',
      warning: '35 90% 60%',
      warningForeground: '0 0% 100%',
      destructive: '0 84% 60%',
      destructiveForeground: '0 0% 100%',
      border: '195 15% 90%',
      input: '195 15% 95%',
      ring: '194 100% 27%',
      gradientPrimary: 'linear-gradient(135deg, hsl(194 100% 27%), hsl(175 60% 33%))',
      gradientCard: 'linear-gradient(145deg, hsl(0 0% 100%), hsl(195 15% 98%))',
      gradientSuccess: 'linear-gradient(135deg, hsl(140 60% 50%), hsl(160 50% 45%))',
      gradientWarning: 'linear-gradient(135deg, hsl(35 90% 60%), hsl(25 85% 55%))'
    }
  },
  {
    id: 'purple',
    name: 'Royal Purple',
    description: 'Elegant and luxurious purple theme',
    colors: {
      background: '280 20% 97%',
      foreground: '280 15% 15%',
      card: '0 0% 100%',
      cardForeground: '280 15% 15%',
      popover: '0 0% 100%',
      popoverForeground: '280 15% 15%',
      primary: '271 91% 65%',
      primaryForeground: '0 0% 100%',
      primaryHover: '271 91% 61%',
      secondary: '280 15% 96%',
      secondaryForeground: '280 15% 15%',
      muted: '280 15% 95%',
      mutedForeground: '280 10% 55%',
      accent: '283 67% 55%',
      accentForeground: '0 0% 100%',
      success: '140 60% 50%',
      successForeground: '0 0% 100%',
      warning: '35 90% 60%',
      warningForeground: '0 0% 100%',
      destructive: '0 84% 60%',
      destructiveForeground: '0 0% 100%',
      border: '280 15% 90%',
      input: '280 15% 95%',
      ring: '271 91% 65%',
      gradientPrimary: 'linear-gradient(135deg, hsl(271 91% 65%), hsl(283 67% 55%))',
      gradientCard: 'linear-gradient(145deg, hsl(0 0% 100%), hsl(280 15% 98%))',
      gradientSuccess: 'linear-gradient(135deg, hsl(140 60% 50%), hsl(160 50% 45%))',
      gradientWarning: 'linear-gradient(135deg, hsl(35 90% 60%), hsl(25 85% 55%))'
    }
  },
  {
    id: 'rose',
    name: 'Rose Garden',
    description: 'Soft and romantic pink theme',
    colors: {
      background: '340 20% 97%',
      foreground: '340 15% 15%',
      card: '0 0% 100%',
      cardForeground: '340 15% 15%',
      popover: '0 0% 100%',
      popoverForeground: '340 15% 15%',
      primary: '330 81% 60%',
      primaryForeground: '0 0% 100%',
      primaryHover: '330 81% 56%',
      secondary: '340 15% 96%',
      secondaryForeground: '340 15% 15%',
      muted: '340 15% 95%',
      mutedForeground: '340 10% 55%',
      accent: '336 84% 57%',
      accentForeground: '0 0% 100%',
      success: '140 60% 50%',
      successForeground: '0 0% 100%',
      warning: '35 90% 60%',
      warningForeground: '0 0% 100%',
      destructive: '0 84% 60%',
      destructiveForeground: '0 0% 100%',
      border: '340 15% 90%',
      input: '340 15% 95%',
      ring: '330 81% 60%',
      gradientPrimary: 'linear-gradient(135deg, hsl(330 81% 60%), hsl(336 84% 57%))',
      gradientCard: 'linear-gradient(145deg, hsl(0 0% 100%), hsl(340 15% 98%))',
      gradientSuccess: 'linear-gradient(135deg, hsl(140 60% 50%), hsl(160 50% 45%))',
      gradientWarning: 'linear-gradient(135deg, hsl(35 90% 60%), hsl(25 85% 55%))'
    }
  },
  {
    id: 'midnight',
    name: 'Midnight Dark',
    description: 'Sleek and modern dark theme',
    colors: {
      background: '220 13% 9%',
      foreground: '220 13% 91%',
      card: '220 13% 11%',
      cardForeground: '220 13% 91%',
      popover: '220 13% 11%',
      popoverForeground: '220 13% 91%',
      primary: '217 91% 60%',
      primaryForeground: '220 13% 9%',
      primaryHover: '217 91% 56%',
      secondary: '220 13% 15%',
      secondaryForeground: '220 13% 91%',
      muted: '220 13% 15%',
      mutedForeground: '220 5% 65%',
      accent: '229 84% 5%',
      accentForeground: '220 13% 91%',
      success: '140 60% 50%',
      successForeground: '0 0% 100%',
      warning: '35 90% 60%',
      warningForeground: '0 0% 100%',
      destructive: '0 84% 60%',
      destructiveForeground: '0 0% 100%',
      border: '220 13% 20%',
      input: '220 13% 15%',
      ring: '217 91% 60%',
      gradientPrimary: 'linear-gradient(135deg, hsl(217 91% 60%), hsl(229 84% 5%))',
      gradientCard: 'linear-gradient(145deg, hsl(220 13% 11%), hsl(220 13% 13%))',
      gradientSuccess: 'linear-gradient(135deg, hsl(140 60% 50%), hsl(160 50% 45%))',
      gradientWarning: 'linear-gradient(135deg, hsl(35 90% 60%), hsl(25 85% 55%))'
    }
  },
  {
    id: 'warm',
    name: 'Warm Sepia',
    description: 'Cozy and vintage-inspired warm theme',
    colors: {
      background: '33 20% 95%',
      foreground: '33 15% 20%',
      card: '33 25% 98%',
      cardForeground: '33 15% 20%',
      popover: '33 25% 98%',
      popoverForeground: '33 15% 20%',
      primary: '25 76% 31%',
      primaryForeground: '0 0% 100%',
      primaryHover: '25 76% 27%',
      secondary: '33 15% 92%',
      secondaryForeground: '33 15% 20%',
      muted: '33 15% 90%',
      mutedForeground: '33 10% 50%',
      accent: '36 64% 57%',
      accentForeground: '0 0% 100%',
      success: '140 60% 50%',
      successForeground: '0 0% 100%',
      warning: '43 96% 56%',
      warningForeground: '0 0% 100%',
      destructive: '0 84% 60%',
      destructiveForeground: '0 0% 100%',
      border: '33 15% 85%',
      input: '33 15% 90%',
      ring: '25 76% 31%',
      gradientPrimary: 'linear-gradient(135deg, hsl(25 76% 31%), hsl(36 64% 57%))',
      gradientCard: 'linear-gradient(145deg, hsl(33 25% 98%), hsl(33 15% 95%))',
      gradientSuccess: 'linear-gradient(135deg, hsl(140 60% 50%), hsl(160 50% 45%))',
      gradientWarning: 'linear-gradient(135deg, hsl(43 96% 56%), hsl(35 85% 55%))'
    }
  }
];

interface ThemeContextType {
  currentTheme: Theme;
  setTheme: (themeId: string) => void;
  themes: Theme[];
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

interface ThemeProviderProps {
  children: React.ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const [currentTheme, setCurrentTheme] = useState<Theme>(themes[0]);

  const setTheme = (themeId: string) => {
    const theme = themes.find(t => t.id === themeId);
    if (theme) {
      setCurrentTheme(theme);
      localStorage.setItem('selectedTheme', themeId);
      applyTheme(theme);
    }
  };

  const applyTheme = (theme: Theme) => {
    const root = document.documentElement;
    Object.entries(theme.colors).forEach(([key, value]) => {
      const cssVarName = key.replace(/([A-Z])/g, '-$1').toLowerCase();
      root.style.setProperty(`--${cssVarName}`, value);
    });
  };

  useEffect(() => {
    const savedThemeId = localStorage.getItem('selectedTheme');
    if (savedThemeId) {
      const savedTheme = themes.find(t => t.id === savedThemeId);
      if (savedTheme) {
        setCurrentTheme(savedTheme);
        applyTheme(savedTheme);
      }
    } else {
      applyTheme(currentTheme);
    }
  }, []);

  return (
    <ThemeContext.Provider value={{ currentTheme, setTheme, themes }}>
      {children}
    </ThemeContext.Provider>
  );
};