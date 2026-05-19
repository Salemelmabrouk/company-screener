import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Subject, of, timer } from 'rxjs';
import { catchError, debounce, map, switchMap, tap } from 'rxjs/operators';
import { CompanyCardComponent } from '../../components/company-card/company-card.component';
import { CompanyService } from '../../services/company.service';
import { CompanyListItem, PageResponse, SectorCount } from '../../models/company.model';

interface CompanyQuery {
  page: number;
  size: number;
  search: string;
  sector: string;
}

type LoadResult =
  | { query: CompanyQuery; response: PageResponse<CompanyListItem> }
  | { query: CompanyQuery; error: unknown };

@Component({
  selector: 'app-company-list',
  standalone: true,
  imports: [CommonModule, CompanyCardComponent],
  templateUrl: './company-list.component.html',
  styleUrls: ['./company-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CompanyListComponent implements OnInit {
  private readonly companyService = inject(CompanyService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);
  private readonly loadRequests = new Subject<boolean>();
  private readonly pageCache = new Map<string, PageResponse<CompanyListItem>>();
  private readonly MAX_CACHE = 20;

  // ── Main list state ──────────────────────────────────────────────────────
  companies      = signal<CompanyListItem[]>([]);
  sectors        = signal<string[]>([]);
  searchQuery    = signal('');
  selectedSector = signal('');
  isLoading      = signal(true);
  isPageLoading  = signal(false);
  error          = signal<string | null>(null);
  page           = signal(0);
  size           = signal(12);
  totalPages     = signal(0);
  totalElements  = signal(0);

  hasActiveFilters = computed(() => !!this.searchQuery() || !!this.selectedSector());

  pages = computed(() => {
    const total   = this.totalPages();
    const current = this.page();
    const win     = 7;
    if (total <= win) return Array.from({ length: total }, (_, i) => i);
    const half  = Math.floor(win / 2);
    const start = Math.max(0, Math.min(current - half, total - win));
    return Array.from({ length: win }, (_, i) => start + i);
  });

  // ── Watchlist ────────────────────────────────────────────────────────────
  watchlist         = signal<number[]>([]);
  showWatchlistOnly = signal(false);
  watchlistItems    = signal<CompanyListItem[]>([]);
  watchlistLoading  = signal(false);

  // Companies actually shown on screen
  displayedCompanies = computed(() => {
    if (this.showWatchlistOnly()) return this.watchlistItems();
    return this.companies();
  });

  // ── Sector distribution chart ─────────────────────────────────────────────
  sectorDistribution = signal<SectorCount[]>([]);
  showChart          = signal(false);

  // Compute bar widths as % of max count
  chartBars = computed(() => {
    const data = this.sectorDistribution();
    if (!data.length) return [];
    const max = Math.max(...data.map(d => d.count));
    return data.map(d => ({
      sector: d.sector,
      count:  d.count,
      pct:    max > 0 ? Math.round((d.count / max) * 100) : 0,
    }));
  });

  ngOnInit(): void {
    this.watchlist.set(this.loadWatchlistIds());
    this.loadSectors();

    // Restore state from URL query parameters
    const params = this.route.snapshot.queryParams;
    if (params['page']) this.page.set(Number(params['page']));
    if (params['sector']) this.selectedSector.set(params['sector']);
    if (params['search']) this.searchQuery.set(params['search']);
    if (params['showWatchlist'] === 'true') {
      this.showWatchlistOnly.set(true);
      this.fetchWatchlistItems();
    }

    this.bindLoadPipeline();
    this.triggerLoad(false);
  }

  private updateQueryParams(): void {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {
        page: this.page() > 0 ? this.page() : null,
        sector: this.selectedSector() || null,
        search: this.searchQuery() || null,
        showWatchlist: this.showWatchlistOnly() ? 'true' : null,
      },
      queryParamsHandling: 'merge',
    });
  }

  // ── Navigation ────────────────────────────────────────────────────────────
  onCompanyClick(company: CompanyListItem): void {
    this.router.navigate(['/companies', company.id]);
  }

  // ── Search / filter ───────────────────────────────────────────────────────
  updateSearch(value: string): void {
    this.searchQuery.set(value);
    this.page.set(0);
    this.updateQueryParams();
    this.triggerLoad(true);   // debounced
  }

  selectSector(sector: string): void {
    this.selectedSector.set(sector);
    this.page.set(0);
    this.updateQueryParams();
    this.triggerLoad(false);
  }

  toggleSector(sector: string): void {
    this.selectSector(this.selectedSector() === sector ? '' : sector);
  }

  clearFilters(): void {
    if (!this.hasActiveFilters()) return;
    this.searchQuery.set('');
    this.selectedSector.set('');
    this.page.set(0);
    this.updateQueryParams();
    this.triggerLoad(false);
  }

  // ── Pagination ────────────────────────────────────────────────────────────
  changePage(p: number): void {
    if (p < 0 || p >= this.totalPages() || p === this.page()) return;
    this.page.set(p);
    this.updateQueryParams();
    this.triggerLoad(false);
  }

  nextPage(): void { this.changePage(this.page() + 1); }
  prevPage(): void { this.changePage(this.page() - 1); }

  loadCompanies(): void { this.triggerLoad(false); }

  // ── Watchlist ─────────────────────────────────────────────────────────────
  toggleWatchlist(id: number): void {
    const ids = [...this.watchlist()];
    const idx = ids.indexOf(id);
    if (idx === -1) ids.push(id); else ids.splice(idx, 1);
    this.watchlist.set(ids);
    this.persistWatchlist(ids);

    // Refresh watchlist items if the filter is active
    if (this.showWatchlistOnly()) {
      this.watchlistItems.update(items =>
        idx === -1
          ? [...items, ...this.companies().filter(c => c.id === id)]
          : items.filter(c => c.id !== id)
      );
    }
  }

  toggleWatchlistFilter(): void {
    const next = !this.showWatchlistOnly();
    this.showWatchlistOnly.set(next);
    this.updateQueryParams();

    if (next) this.fetchWatchlistItems();
  }

  isWatched(id: number): boolean {
    return this.watchlist().includes(id);
  }

  // ── Sector chart ──────────────────────────────────────────────────────────
  toggleChart(): void {
    const next = !this.showChart();
    this.showChart.set(next);
    if (next && !this.sectorDistribution().length) this.fetchSectorDistribution();
  }

  // ── Private helpers ───────────────────────────────────────────────────────
  private bindLoadPipeline(): void {
    this.loadRequests.pipe(
      debounce(d => d ? timer(220) : timer(0)),
      map(() => this.currentQuery()),
      tap(q  => this.prepareLoadState(q)),
      switchMap(q => {
        const cached = this.pageCache.get(this.cacheKey(q));
        if (cached) return of({ query: q, response: cached } as LoadResult);

        return this.companyService.getAllCompanies(q.page, q.size, q.search, q.sector).pipe(
          map(r  => ({ query: q, response: r }) as LoadResult),
          catchError(e => of({ query: q, error: e } as LoadResult))
        );
      }),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(result => {
      this.isLoading.set(false);
      this.isPageLoading.set(false);

      if ('error' in result) {
        this.error.set('Failed to load companies. Is the backend running?');
        return;
      }

      this.error.set(null);
      this.cachePage(result.query, result.response);
      this.applyPage(result.response);
      this.prefetchNext(result.query);
    });
  }

  private loadSectors(): void {
    this.companyService.getSectors()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({ next: s => this.sectors.set(s), error: () => {} });
  }

  private fetchWatchlistItems(): void {
    const ids = this.watchlist();
    if (!ids.length) { this.watchlistItems.set([]); return; }

    this.watchlistLoading.set(true);
    this.companyService.getAllCompaniesUnpaged()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: all => {
          this.watchlistItems.set(all.filter(c => ids.includes(c.id)));
          this.watchlistLoading.set(false);
        },
        error: () => this.watchlistLoading.set(false)
      });
  }

  private fetchSectorDistribution(): void {
    this.companyService.getSectorDistribution()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({ next: d => this.sectorDistribution.set(d), error: () => {} });
  }

  private triggerLoad(debounced: boolean): void {
    this.loadRequests.next(debounced);
  }

  private prepareLoadState(q: CompanyQuery): void {
    this.error.set(null);
    if (this.pageCache.has(this.cacheKey(q))) { this.isLoading.set(false); this.isPageLoading.set(false); return; }
    if (this.companies().length === 0) { this.isLoading.set(true); this.isPageLoading.set(false); return; }
    this.isLoading.set(false);
    this.isPageLoading.set(true);
  }

  private applyPage(r: PageResponse<CompanyListItem>): void {
    this.companies.set(r.content);
    this.totalPages.set(r.totalPages);
    this.totalElements.set(r.totalElements);
    this.page.set(r.number);
    this.size.set(r.size);
  }

  private prefetchNext(q: CompanyQuery): void {
    const next = { ...q, page: q.page + 1 };
    if (next.page >= this.totalPages() || this.pageCache.has(this.cacheKey(next))) return;
    this.companyService.getAllCompanies(next.page, next.size, next.search, next.sector)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({ next: r => this.cachePage(next, r), error: () => {} });
  }

  private currentQuery(): CompanyQuery {
    return { page: this.page(), size: this.size(), search: this.searchQuery().trim(), sector: this.selectedSector().trim() };
  }

  private cacheKey(q: CompanyQuery): string {
    return `${q.page}|${q.size}|${q.search.toLowerCase()}|${q.sector}`;
  }

  private cachePage(q: CompanyQuery, r: PageResponse<CompanyListItem>): void {
    this.pageCache.set(this.cacheKey(q), r);
    if (this.pageCache.size > this.MAX_CACHE) {
      const oldest = this.pageCache.keys().next().value;
      if (oldest) this.pageCache.delete(oldest);
    }
  }

  private loadWatchlistIds(): number[] {
    try { return JSON.parse(localStorage.getItem('screener_watchlist') ?? '[]'); } catch { return []; }
  }

  private persistWatchlist(ids: number[]): void {
    try { localStorage.setItem('screener_watchlist', JSON.stringify(ids)); } catch {}
  }
}
