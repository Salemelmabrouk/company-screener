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
import { Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Subject, of, timer } from 'rxjs';
import { catchError, debounce, map, switchMap, tap } from 'rxjs/operators';
import { CompanyCardComponent } from '../../components/company-card/company-card.component';
import { CompanyService } from '../../services/company.service';
import { CompanyListItem, PageResponse } from '../../models/company.model';

interface CompanyQuery {
  page: number;
  size: number;
  search: string;
  sector: string;
}

interface LoadTrigger {
  debounce: boolean;
}

type LoadResult =
  | { query: CompanyQuery; response: PageResponse<CompanyListItem> }
  | { query: CompanyQuery; error: unknown };

@Component({
  selector: 'app-company-list',
  standalone: true,
  imports: [
    CommonModule,
    CompanyCardComponent
  ],
  templateUrl: './company-list.component.html',
  styleUrls: ['./company-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CompanyListComponent implements OnInit {
  private readonly companyService = inject(CompanyService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly loadRequests = new Subject<LoadTrigger>();
  private readonly pageCache = new Map<string, PageResponse<CompanyListItem>>();
  private readonly maxCacheEntries = 20;

  companies = signal<CompanyListItem[]>([]);
  sectors = signal<string[]>([]);
  searchQuery = signal('');
  selectedSector = signal('');
  isLoading = signal(true);
  isPageLoading = signal(false);
  error = signal<string | null>(null);

  page = signal(0);
  size = signal(12);
  totalPages = signal(0);
  totalElements = signal(0);

  hasActiveFilters = computed(() => !!this.searchQuery() || !!this.selectedSector());

  pages = computed(() => {
    const total = this.totalPages();
    const current = this.page();
    const windowSize = 7;

    if (total <= windowSize) {
      return Array.from({ length: total }, (_, i) => i);
    }

    const half = Math.floor(windowSize / 2);
    const start = Math.max(0, Math.min(current - half, total - windowSize));
    return Array.from({ length: windowSize }, (_, i) => start + i);
  });

  ngOnInit(): void {
    this.loadSectors();
    this.bindCompanyLoads();
    this.requestLoad(false);
  }

  loadCompanies(): void {
    this.requestLoad(false);
  }

  updateSearch(value: string): void {
    this.searchQuery.set(value);
    this.page.set(0);
    this.requestLoad(true);
  }

  selectSector(sector: string): void {
    this.selectedSector.set(sector);
    this.page.set(0);
    this.requestLoad(false);
  }

  toggleSector(sector: string): void {
    this.selectSector(this.selectedSector() === sector ? '' : sector);
  }

  changePage(newPage: number): void {
    if (newPage < 0 || newPage >= this.totalPages() || newPage === this.page()) {
      return;
    }

    this.page.set(newPage);
    this.requestLoad(false);
  }

  nextPage(): void {
    this.changePage(this.page() + 1);
  }

  prevPage(): void {
    this.changePage(this.page() - 1);
  }

  onCompanyClick(company: CompanyListItem): void {
    this.router.navigate(['/companies', company.id]);
  }

  clearFilters(): void {
    if (!this.hasActiveFilters()) {
      return;
    }

    this.searchQuery.set('');
    this.selectedSector.set('');
    this.page.set(0);
    this.requestLoad(false);
  }

  private bindCompanyLoads(): void {
    this.loadRequests.pipe(
      debounce(trigger => trigger.debounce ? timer(220) : timer(0)),
      map(() => this.currentQuery()),
      tap(query => this.prepareLoadingState(query)),
      switchMap(query => {
        const cached = this.pageCache.get(this.cacheKey(query));

        if (cached) {
          return of({ query, response: cached } satisfies LoadResult);
        }

        return this.companyService
          .getAllCompanies(query.page, query.size, query.search, query.sector)
          .pipe(
            map(response => ({ query, response }) satisfies LoadResult),
            catchError(error => of({ query, error } satisfies LoadResult))
          );
      }),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(result => {
      this.isLoading.set(false);
      this.isPageLoading.set(false);

      if ('error' in result) {
        this.error.set('Failed to load companies. Is the backend running?');
        console.error(result.error);
        return;
      }

      this.error.set(null);
      this.rememberPage(result.query, result.response);
      this.applyPage(result.response);
      this.prefetchNextPage(result.query);
    });
  }

  private loadSectors(): void {
    this.companyService.getSectors()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: sectors => this.sectors.set(sectors),
        error: err => console.error('Failed to load sectors', err)
      });
  }

  private requestLoad(debounce: boolean): void {
    this.loadRequests.next({ debounce });
  }

  private prepareLoadingState(query: CompanyQuery): void {
    this.error.set(null);

    if (this.pageCache.has(this.cacheKey(query))) {
      this.isLoading.set(false);
      this.isPageLoading.set(false);
      return;
    }

    if (this.companies().length === 0) {
      this.isLoading.set(true);
      this.isPageLoading.set(false);
      return;
    }

    this.isLoading.set(false);
    this.isPageLoading.set(true);
  }

  private applyPage(response: PageResponse<CompanyListItem>): void {
    this.companies.set(response.content);
    this.totalPages.set(response.totalPages);
    this.totalElements.set(response.totalElements);
    this.page.set(response.number);
    this.size.set(response.size);
  }

  private prefetchNextPage(query: CompanyQuery): void {
    const nextPage = query.page + 1;

    if (nextPage >= this.totalPages()) {
      return;
    }

    const nextQuery = { ...query, page: nextPage };
    const key = this.cacheKey(nextQuery);

    if (this.pageCache.has(key)) {
      return;
    }

    this.companyService
      .getAllCompanies(nextQuery.page, nextQuery.size, nextQuery.search, nextQuery.sector)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: response => this.rememberPage(nextQuery, response),
        error: () => undefined
      });
  }

  private currentQuery(): CompanyQuery {
    return {
      page: this.page(),
      size: this.size(),
      search: this.searchQuery().trim(),
      sector: this.selectedSector().trim()
    };
  }

  private cacheKey(query: CompanyQuery): string {
    return [
      query.page,
      query.size,
      query.search.toLocaleLowerCase(),
      query.sector
    ].join('|');
  }

  private rememberPage(query: CompanyQuery, response: PageResponse<CompanyListItem>): void {
    this.pageCache.set(this.cacheKey(query), response);

    if (this.pageCache.size <= this.maxCacheEntries) {
      return;
    }

    const oldestKey = this.pageCache.keys().next().value;
    if (oldestKey) {
      this.pageCache.delete(oldestKey);
    }
  }
}
