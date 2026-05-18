import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule, SlicePipe } from '@angular/common';
import { Company } from '../../models/company.model';

@Component({
  selector: 'app-company-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './company-card.component.html',
  styleUrls: ['./company-card.component.scss']
})
export class CompanyCardComponent {
  @Input({ required: true }) company!: Company;
  @Output() cardClick = new EventEmitter<Company>();

  readonly sectorColors: Record<string, string> = {
    'FinTech': '#6366f1',
    'Media & Entertainment': '#ec4899',
    'Automotive & Energy': '#f59e0b',
    'Travel & Hospitality': '#10b981',
    'E-Commerce': '#3b82f6',
    'Artificial Intelligence': '#8b5cf6',
    'Design & SaaS': '#06b6d4',
  };

  get sectorColor(): string {
    return this.sectorColors[this.company.sector] ?? '#6b7280';
  }

  get initials(): string {
    return this.company.name
      .split(' ')
      .slice(0, 2)
      .map(w => w[0])
      .join('')
      .toUpperCase();
  }

  formatEmployeeCount(count: number): string {
    if (count >= 1000) return `${(count / 1000).toFixed(1)}k`;
    return count.toString();
  }
}