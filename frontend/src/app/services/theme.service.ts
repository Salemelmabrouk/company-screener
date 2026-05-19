import { Injectable, signal, effect, inject, EnvironmentInjector, runInInjectionContext } from '@angular/core';

export type Theme = 'dark' | 'light';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly STORAGE_KEY = 'screener-theme';
  private readonly injector = inject(EnvironmentInjector);

  theme = signal<Theme>(this.getInitialTheme());

  constructor() {
    // runInInjectionContext satisfies Angular 18 strict injection context requirements
    runInInjectionContext(this.injector, () => {
      effect(() => {
        const t = this.theme();
        document.documentElement.setAttribute('data-theme', t);
        try { localStorage.setItem(this.STORAGE_KEY, t); } catch {}
      });
    });
  }

  toggle(): void {
    this.theme.update(t => (t === 'dark' ? 'light' : 'dark'));
  }

  private getInitialTheme(): Theme {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY) as Theme | null;
      if (stored === 'light' || stored === 'dark') return stored;
    } catch {}
    return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
  }
}
