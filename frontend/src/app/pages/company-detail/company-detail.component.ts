import { ChangeDetectionStrategy, Component, DestroyRef, ElementRef, OnInit, ViewChild, computed, effect, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CompanyService } from '../../services/company.service';
import { Company, ChatMessage } from '../../models/company.model';

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

  private companyId = 0;

  constructor() {
    // Auto-save chat history to localStorage whenever it changes
    effect(() => {
      const history = this.chatHistory();
      if (this.companyId) {
        this.saveChatHistory(this.companyId, history);
      }
    });
  }

  // Signals
  company = signal<Company | null>(null);
  isLoading = signal(true);
  error = signal<string | null>(null);
  isWatched = signal(false);

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

  // Follow-up suggestion pools keyed by topic keyword
  private readonly followUpPools: Record<string, string[]> = {
    business_model: [
      'Who are the main competitors?',
      'What are the key revenue streams?',
      'What are the growth prospects?',
      'What risks does this company face?',
      'How does it compare to its rivals?'
    ],
    competitors: [
      'What is the business model?',
      'What is the market size for this sector?',
      'What is the competitive advantage?',
      'What are the growth prospects?',
      'Is this company profitable?'
    ],
    growth: [
      'What risks could limit that growth?',
      'How is the company funded?',
      'Who are the main competitors?',
      'What new markets is it targeting?',
      'What does this company do?'
    ],
    risks: [
      'How does it plan to mitigate those risks?',
      'What are the growth prospects?',
      'Who are the main investors?',
      'What is the business model?',
      'Is this company profitable?'
    ],
    funding: [
      'Is this company profitable?',
      'What is the valuation?',
      'Who are the main competitors?',
      'What are the growth prospects?',
      'What is the business model?'
    ],
    leadership: [
      'What is the company culture like?',
      'What are the growth prospects?',
      'How is the company funded?',
      'What is the business model?',
      'Who are the main competitors?'
    ],
    default: [
      'What is the business model?',
      'Who are the main competitors?',
      'What are the growth prospects?',
      'What risks does this company face?',
      'How is the company funded?',
      'Is this company profitable?',
      'What is the company culture like?'
    ]
  };

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (!id) {
      this.router.navigate(['/companies']);
      return;
    }
    this.companyId = id;
    // Restore chat immediately — visible before the company API returns
    this.chatHistory.set(this.loadChatHistory(id));
    this.isWatched.set(this.isInWatchlist(id));
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
        const followUps = this.generateFollowUps(q);
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
      localStorage.removeItem(this.chatStorageKey(this.companyId));
    }
  }

  setQuestion(text: string): void {
    this.question.set(text);
  }

  sendSuggestion(text: string): void {
    this.question.set(text);
    this.askQuestion();
  }

  private generateFollowUps(askedQuestion: string): string[] {
    const q = askedQuestion.toLowerCase();

    let pool: string[];
    if (q.includes('business model') || q.includes('revenue') || q.includes('monetize') || q.includes('make money')) {
      pool = this.followUpPools['business_model'];
    } else if (q.includes('compet') || q.includes('rival') || q.includes('alternative')) {
      pool = this.followUpPools['competitors'];
    } else if (q.includes('growth') || q.includes('future') || q.includes('prospect') || q.includes('expand')) {
      pool = this.followUpPools['growth'];
    } else if (q.includes('risk') || q.includes('challenge') || q.includes('problem') || q.includes('threat')) {
      pool = this.followUpPools['risks'];
    } else if (q.includes('fund') || q.includes('invest') || q.includes('valuat') || q.includes('ipo')) {
      pool = this.followUpPools['funding'];
    } else if (q.includes('ceo') || q.includes('founder') || q.includes('leader') || q.includes('team') || q.includes('culture')) {
      pool = this.followUpPools['leadership'];
    } else {
      pool = this.followUpPools['default'];
    }

    // Remove the question just asked from the pool, then pick 3
    const filtered = pool.filter(s => s.toLowerCase() !== askedQuestion.toLowerCase());
    return filtered.slice(0, 3);
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
    return this.sectorColors[this.company()?.sector ?? ''] ?? '#6b7280';
  }

  formatEmployees(count: number): string {
    if (count >= 1000) return `${(count / 1000).toFixed(1)}k`;
    return count.toString();
  }

  // ── Watchlist helpers ──────────────────────────────────────────────────────
  toggleWatchlist(): void {
    if (!this.companyId) return;
    
    const watchlist = this.getWatchlist();
    const index = watchlist.indexOf(this.companyId);
    
    if (index === -1) {
      watchlist.push(this.companyId);
      this.isWatched.set(true);
    } else {
      watchlist.splice(index, 1);
      this.isWatched.set(false);
    }
    
    localStorage.setItem('screener_watchlist', JSON.stringify(watchlist));
  }

  private getWatchlist(): number[] {
    try {
      const raw = localStorage.getItem('screener_watchlist');
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  private isInWatchlist(id: number): boolean {
    return this.getWatchlist().includes(id);
  }

  // ── localStorage helpers ────────────────────────────────────────────────────
  private chatStorageKey(id: number): string {
    return `screener_chat_${id}`;
  }

  private saveChatHistory(id: number, history: ChatMessage[]): void {
    try {
      localStorage.setItem(this.chatStorageKey(id), JSON.stringify(history));
    } catch {
      // localStorage may be unavailable (private browsing quota exceeded etc.)
    }
  }

  private loadChatHistory(id: number): ChatMessage[] {
    try {
      const raw = localStorage.getItem(this.chatStorageKey(id));
      if (!raw) return [];
      const parsed: Array<{ role: string; text: string; timestamp: string; suggestions?: string[] }> = JSON.parse(raw);
      return parsed.map(m => ({
        role: m.role as ChatMessage['role'],
        text: m.text,
        timestamp: new Date(m.timestamp),  // ISO string → Date
        suggestions: m.suggestions
      }));
    } catch {
      return [];
    }
  }
}
