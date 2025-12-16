import { useTheme, themes } from './ThemeProvider';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Palette, Sun, Moon, Sparkles, Check } from 'lucide-react';

const themeIcons = {
  light: Sun,
  dark: Moon,
  vibrant: Sparkles,
};

export default function ThemeSwitcher({ variant = 'dropdown' }) {
  const { theme, setTheme } = useTheme();

  if (variant === 'buttons') {
    return (
      <div className="flex items-center gap-1 p-1 bg-muted rounded-lg">
        {Object.entries(themes).map(([key, value]) => {
          const Icon = themeIcons[key];
          const isActive = theme === key;
          return (
            <Button
              key={key}
              variant={isActive ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setTheme(key)}
              className={`h-8 w-8 p-0 ${isActive ? 'shadow-sm' : ''}`}
              title={value.name}
            >
              <Icon className="h-4 w-4" />
            </Button>
          );
        })}
      </div>
    );
  }

  const CurrentIcon = themeIcons[theme];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-9 w-9" data-testid="theme-switcher">
          <CurrentIcon className="h-4 w-4" />
          <span className="sr-only">Toggle theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuLabel className="flex items-center gap-2">
          <Palette className="h-4 w-4" />
          Theme
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {Object.entries(themes).map(([key, value]) => {
          const Icon = themeIcons[key];
          const isActive = theme === key;
          return (
            <DropdownMenuItem
              key={key}
              onClick={() => setTheme(key)}
              className="flex items-center justify-between cursor-pointer"
              data-testid={`theme-${key}`}
            >
              <div className="flex items-center gap-2">
                <Icon className="h-4 w-4" />
                <div>
                  <p className="font-medium">{value.name}</p>
                  <p className="text-xs text-muted-foreground">{value.description}</p>
                </div>
              </div>
              {isActive && <Check className="h-4 w-4 text-primary" />}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
