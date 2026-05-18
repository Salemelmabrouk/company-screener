import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CompanyService } from '../../services/company.service';
import { Company } from '../../models/company.model';
import { CompanyCardComponent } from '../../components/company-card/company-card.component';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-company-list',
  standalone: true,
imports: [
  CommonModule,
  FormsModule,
  CompanyCardComponent
],
  templateUrl: './company-list.component.html',
  styleUrls: ['./company-list.component.scss']
})
export class CompanyListComponent implements OnInit {
  private readonly companyService = inject(CompanyService);
  private readonly router = inject(Router);

  // Signals
  companies = signal<Company[]>([]);
  searchQuery = signal<string>('');
  selectedSector = signal<string>('');
  isLoading = signal<boolean>(true);
  error = signal<string | null>(null);

    page = signal(0);
  size = signal(12);
  totalPages = signal(0);

  // Computed: unique sectors from loaded companies
  sectors = computed(() => {
    const all = this.companies().map(c => c.sector);
    return ['', ...new Set(all)].sort();
  });

  // Computed: filtered companies based on search + sector
  filteredCompanies = computed(() => {
    const q = this.searchQuery().toLowerCase().trim();
    const sector = this.selectedSector();

    return this.companies().filter(company => {
      const matchesSearch = !q ||
        company.name.toLowerCase().includes(q) ||
        company.sector.toLowerCase().includes(q) ||
        company.country.toLowerCase().includes(q);
      const matchesSector = !sector || company.sector === sector;
      return matchesSearch && matchesSector;
    });
  });

  ngOnInit(): void {
    this.loadCompanies();
  }

 
loadCompanies(): void {
  this.isLoading.set(true);
  this.error.set(null);

  this.companyService.getAllCompanies(
    this.page(),
    this.size()
  ).subscribe({
    next: (res) => {
      this.companies.set(res.content);
      this.totalPages.set(res.totalPages);
      this.isLoading.set(false);
    },
    error: (err) => {
      this.error.set('Failed to load companies. Is the backend running?');
      this.isLoading.set(false);
      console.error(err);
    }
  });
}
getPages(): number[] {
  return Array.from({ length: this.totalPages() }, (_, i) => i);
}

changePage(newPage: number): void {
  if (newPage < 0 || newPage >= this.totalPages()) return;

  this.page.set(newPage);
  this.loadCompanies();
}

nextPage(): void {
  if (this.page() < this.totalPages() - 1) {
    this.page.update(p => p + 1);
    this.loadCompanies();
  }
}

prevPage(): void {
  if (this.page() > 0) {
    this.page.update(p => p - 1);
    this.loadCompanies();
  }
}
  onCompanyClick(company: Company): void {
    this.router.navigate(['/companies', company.id]);
  }

  clearFilters(): void {
    this.searchQuery.set('');
    this.selectedSector.set('');
  }

  get hasActiveFilters(): boolean {
    return !!this.searchQuery() || !!this.selectedSector();
  }

  // Sector distribution for display
  sectorCounts = computed(() => {
    const counts: Record<string, number> = {};
    this.companies().forEach(c => {
      counts[c.sector] = (counts[c.sector] || 0) + 1;
    });
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .map(([sector, count]) => ({ sector, count }));
  });
}
