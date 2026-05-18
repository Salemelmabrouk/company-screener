import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CompanyService } from '../../services/company.service';
import { Company } from '../../models/company.model';

@Component({
  selector: 'app-company-detail',
  standalone: true,
  imports: [],
  templateUrl: './company-detail.component.html',
  styleUrls: ['./company-detail.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CompanyDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly companyService = inject(CompanyService);
  private readonly destroyRef = inject(DestroyRef);

  // Signals
  company = signal<Company | null>(null);
  isLoading = signal(true);
  error = signal<string | null>(null);

  // AI Question signals
  question = signal('');
  aiAnswer = signal<string | null>(null);
  isAiLoading = signal(false);
  aiError = signal<string | null>(null);

  readonly sectorColors: Record<string, string> = {
    'FinTech': '#6366f1',
    'Media & Entertainment': '#ec4899',
    'Automotive & Energy': '#f59e0b',
    'Travel & Hospitality': '#10b981',
    'E-Commerce': '#3b82f6',
    'Artificial Intelligence': '#8b5cf6',
    'Design & SaaS': '#06b6d4',
  };

  readonly suggestedQuestions = [
    'What does this company do?',
    'Who are the main competitors?',
    'What is the business model?',
    'What are the growth prospects?'
  ];

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (!id) {
      this.router.navigate(['/companies']);
      return;
    }
    this.loadCompany(id);
  }

  get companyInitials(): string {
    const name = this.company()?.name || '';
    const parts = name.split(' ');

    const first = parts[0]?.charAt(0) || '';
    const second = parts[1]?.charAt(0) || '';

    return (first + second).toUpperCase();
  }

  loadCompany(id: number): void {
    this.isLoading.set(true);
    this.error.set(null);

    this.companyService.getCompanyById(id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data) => {
          this.company.set(data);
          this.isLoading.set(false);
        },
        error: () => {
          this.error.set('Company not found.');
          this.isLoading.set(false);
        }
      });
  }

askQuestion(): void {
  const q = this.question().trim();
  const c = this.company();
  if (!q || !c || this.isAiLoading()) return;

  this.isAiLoading.set(true);
  this.aiAnswer.set(null);
  this.aiError.set(null);

  // Store the current question for potential reference
  const currentQuestion = q;

  // Clear the input field immediately
  this.question.set('');

  this.companyService.askQuestion(c.id, currentQuestion)
    .pipe(takeUntilDestroyed(this.destroyRef))
    .subscribe({
      next: (res) => {
        this.aiAnswer.set(res.answer);
        this.isAiLoading.set(false);
      },
      error: () => {
        this.aiError.set('Failed to get AI response. Check your Groq API key.');
        this.isAiLoading.set(false);
        
        // Optional: Restore the question if there was an error
        // this.question.set(currentQuestion);
      }
    });
}

  goBack(): void {
    this.router.navigate(['/companies']);
  }

  get sectorColor(): string {
    return this.sectorColors[this.company()?.sector ?? ''] ?? '#6b7280';
  }

  formatEmployees(count: number): string {
    if (count >= 1000) return `${(count / 1000).toFixed(1)}k`;
    return count.toString();
  }
}
