'use client';

import { useState } from 'react';
import { Moon, Sun } from 'lucide-react';
import { Button } from './button';
import { cn } from '@/lib/utils';
import { useTheme } from '../../components/theme-provider';

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [isRotating, setIsRotating] = useState(false);

  const toggleTheme = () => {
    // Animar el ícono
    setIsRotating(true);
    setTimeout(() => setIsRotating(false), 500);

    // Cambiar el tema usando el método proporcionado por el contexto
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleTheme}
      className={cn(
        'rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all duration-200',
        'border-none shadow-none focus:outline-none'
      )}
      aria-label={
        theme === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'
      }
    >
      {theme === 'dark' ? (
        <Moon
          className={cn(
            'h-5 w-5 transition-transform duration-200 ease-in-out',
            isRotating && 'animate-spin'
          )}
        />
      ) : (
        <Sun
          className={cn(
            'h-5 w-5 transition-transform duration-200 ease-in-out',
            isRotating && 'animate-spin'
          )}
        />
      )}
    </Button>
  );
}
