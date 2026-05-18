import { Component, inject } from '@angular/core';
import { RouterOutlet, RouterLink } from '@angular/router';
import { ThemeService } from './services/theme.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink],
  template: `
    <div class="app-wrapper">
      <header class="app-header">
        <div class="header-inner">
          <a routerLink="/companies" class="logo-link">
            <span class="logo-icon">◈</span>
            <span class="logo-text">ScreenerAI</span>
          </a>
          <nav class="header-nav">
            <a routerLink="/companies" class="nav-link">Companies</a>
            <button
              class="theme-toggle"
              (click)="themeService.toggle()"
              [title]="themeService.theme() === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'"
              [attr.aria-label]="themeService.theme() === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'"
            >
              @if (themeService.theme() === 'dark') {
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/>
                </svg>
              } @else {
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/>
                </svg>
              }
            </button>
          </nav>
        </div>
      </header>
      <main class="app-main">
        <router-outlet />
      </main>
      <footer class="app-footer">
        <span>ScreenerAI — Powered by Groq &amp; Llama 3.3</span>
      </footer>
    </div>
  `,
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  readonly themeService = inject(ThemeService);
}
