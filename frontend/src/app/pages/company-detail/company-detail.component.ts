import { ChangeDetectionStrategy, Component, DestroyRef, ElementRef, OnInit, ViewChild, computed, effect, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CompanyService } from '../../services/company.service';
import { Company, ChatMessage } from '../../models/company.model';
import { WatchlistService } from '../../services/watchlist.service';
import { ChatStorageService } from '../../services/chat-storage.service';
import { AiFollowUpService } from '../../services/ai-follow-up.service';
import { CompanyBrandUtil } from '../../utils/company-brand.util';
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
  private readonly watchlistService = inject(WatchlistService);
  private readonly chatStorage = inject(ChatStorageService);
  private readonly aiFollowUp = inject(AiFollowUpService);
  private readonly destroyRef = inject(DestroyRef);

  private companyId = 0;

  constructor() {
    // Auto-save chat history to localStorage whenever it changes
    effect(() => {
      const history = this.chatHistory();
      if (this.companyId) {
        this.chatStorage.saveHistory(this.companyId, history);
      }
    });
  }

  // Signals
  company = signal<Company | null>(null);
  isLoading = signal(true);
  error = signal<string | null>(null);
  useFallbackLogo = signal(false);

  // Watchlist state derived globally from the WatchlistService
  isWatched = computed(() => {
    const id = this.companyId;
    return id ? this.watchlistService.isWatched(id)() : false;
  });

  // Computed signal for simulated growth chart
  chartData = computed(() => {
    const c = this.company();
    if (!c) return { path: '', points: [], years: [] };

    const founded = c.foundedYear;
    const currentYear = 2026;
    const years = currentYear - founded;
    const employees = c.employeeCount;

    if (years <= 0) return { path: '', points: [], years: [] };

    const points: Array<{ x: number; y: number; year: number; val: number }> = [];
    const width = 500;
    const height = 150;
    const padding = 20;

    const usableWidth = width - padding * 2;
    const usableHeight = height - padding * 2;

    // Generate 5 points: start, 3 intermediate (simulated exponential-ish growth), and end
    const steps = 5;
    const yearLabels: number[] = [];

    for (let i = 0; i < steps; i++) {
      const fraction = i / (steps - 1);
      const year = Math.round(founded + fraction * years);
      
      // Simulate exponential growth curve: y = x^2 or similar
      // Normalized fraction^2 gives a nice curve
      const growthFraction = Math.pow(fraction, 1.8); 
      const val = Math.round(growthFraction * employees);

      const x = padding + fraction * usableWidth;
      // SVG y goes from top to bottom, so invert it
      const y = height - padding - (growthFraction * usableHeight);

      points.push({ x, y, year, val });
      yearLabels.push(year);
    }

    // Build SVG path
    let path = `M ${points[0].x} ${points[0].y}`;
    for (let i = 1; i < points.length; i++) {
      // Use cubic bezier for smooth curve
      const prev = points[i - 1];
      const curr = points[i];
      const cx1 = prev.x + (curr.x - prev.x) / 2;
      const cy1 = prev.y;
      const cx2 = prev.x + (curr.x - prev.x) / 2;
      const cy2 = curr.y;
      
      path += ` C ${cx1} ${cy1}, ${cx2} ${cy2}, ${curr.x} ${curr.y}`;
    }

    return { path, points, years: yearLabels };
  });

  // AI Question signals
  question = signal('');
  chatHistory = signal<ChatMessage[]>([]);
  isAiLoading = signal(false);
  aiError = signal<string | null>(null);

  @ViewChild('chatBody') private chatBodyRef?: ElementRef<HTMLDivElement>;

  get suggestedQuestions(): string[] {
    return this.aiFollowUp.defaultSuggestions;
  }

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (!id) {
      this.router.navigate(['/companies']);
      return;
    }
    this.companyId = id;
    // Restore chat immediately — visible before the company API returns
    this.chatHistory.set(this.chatStorage.loadHistory(id));
    this.loadCompany(id);
  }

  get logoUrl(): string {
    const c = this.company();
    return c ? CompanyBrandUtil.getLogoUrl(c.name) : '';
  }

  get iconType(): string {
    const c = this.company();
    return c ? CompanyBrandUtil.getIconType(c.name, c.sector) : 'building';
  }

  loadCompany(id: number): void {
    this.isLoading.set(true);
    this.error.set(null);
    this.useFallbackLogo.set(false); // Reset fallback on new load

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

  const currentHistory = this.chatHistory();

  // Add user message to history and clear input immediately
  this.chatHistory.update(history => [
    ...history,
    { role: 'user', text: q, timestamp: new Date() }
  ]);
  this.question.set('');
  this.isAiLoading.set(true);
  this.aiError.set(null);

  this.scrollChatToBottom();

  this.companyService.askQuestion(c.id, q, currentHistory)
    .pipe(takeUntilDestroyed(this.destroyRef))
    .subscribe({
      next: (res) => {
        const followUps = this.aiFollowUp.generateFollowUps(q, currentHistory);
        this.chatHistory.update(history => [
          ...history,
          { role: 'assistant', text: res.answer, timestamp: new Date(), suggestions: followUps }
        ]);
        this.isAiLoading.set(false);
        this.scrollChatToBottom();
      },
      error: () => {
        this.chatHistory.update(history => [
          ...history,
          { role: 'error', text: 'Failed to get AI response. Please check your Groq API key.', timestamp: new Date() }
        ]);
        this.isAiLoading.set(false);
        this.scrollChatToBottom();
      }
    });
}

  goBack(): void {
    this.router.navigate(['/companies']);
  }

  clearChat(): void {
    this.chatHistory.set([]);
    this.aiError.set(null);
    if (this.companyId) {
      this.chatStorage.clearHistory(this.companyId);
    }
  }

  setQuestion(text: string): void {
    this.question.set(text);
  }

  sendSuggestion(text: string): void {
    this.question.set(text);
    this.askQuestion();
  }



  private scrollChatToBottom(): void {
    setTimeout(() => {
      const el = this.chatBodyRef?.nativeElement;
      if (el) {
        el.scrollTop = el.scrollHeight;
      }
    }, 50);
  }

  get sectorColor(): string {
    const c = this.company();
    return c ? CompanyBrandUtil.getSectorColor(c.sector) : '#6b7280';
  }

  formatEmployees(count: number): string {
    if (count >= 1000) return `${(count / 1000).toFixed(1)}k`;
    return count.toString();
  }

  // ── Watchlist helpers ──────────────────────────────────────────────────────
  toggleWatchlist(): void {
    if (this.companyId) {
      this.watchlistService.toggleWatchlist(this.companyId);
    }
  }
}
