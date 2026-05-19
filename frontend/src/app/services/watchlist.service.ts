import { Injectable, signal, computed } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class WatchlistService {
  private readonly STORAGE_KEY = 'screener_watchlist';
  
  // The central source of truth for watched company IDs
  private watchedIds = signal<number[]>(this.loadFromStorage());

  // Expose a readonly signal for components to consume
  readonly watchlist = this.watchedIds.asReadonly();

  // Utility computed signal to check if a specific ID is watched
  isWatched = (id: number) => computed(() => this.watchedIds().includes(id));

  toggleWatchlist(id: number): void {
    this.watchedIds.update(ids => {
      const index = ids.indexOf(id);
      const newIds = [...ids];
      
      if (index === -1) {
        newIds.push(id);
      } else {
        newIds.splice(index, 1);
      }
      
      this.saveToStorage(newIds);
      return newIds;
    });
  }

  private loadFromStorage(): number[] {
    try {
      const raw = localStorage.getItem(this.STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  private saveToStorage(ids: number[]): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(ids));
    } catch {
      // Ignore storage errors (e.g., private browsing mode)
    }
  }
}
