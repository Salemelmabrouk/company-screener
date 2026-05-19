import { ChangeDetectionStrategy, Component, Input, Output, EventEmitter, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CompanyListItem } from '../../models/company.model';

@Component({
  selector: 'app-company-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './company-card.component.html',
  styleUrls: ['./company-card.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CompanyCardComponent {
  private _company!: CompanyListItem;
  @Input({ required: true }) set company(val: CompanyListItem) {
    this._company = val;
    this.useFallbackLogo.set(false);
  }
  get company(): CompanyListItem { return this._company; }

  @Output() cardClick = new EventEmitter<CompanyListItem>();

  useFallbackLogo = signal(false);

  readonly companyDomains: Record<string, string> = {
    'Stripe': 'stripe.com', 'Spotify': 'spotify.com', 'Tesla': 'tesla.com',
    'Airbnb': 'airbnb.com', 'Shopify': 'shopify.com', 'OpenAI': 'openai.com',
    'Klarna': 'klarna.com', 'Canva': 'canva.com', 'Google': 'google.com',
    'Microsoft': 'microsoft.com', 'Apple': 'apple.com', 'Amazon': 'amazon.com',
    'Meta': 'meta.com', 'PayPal': 'paypal.com', 'Revolut': 'revolut.com',
    'Salesforce': 'salesforce.com', 'Notion': 'notion.so', 'Atlassian': 'atlassian.com',
    'Nvidia': 'nvidia.com', 'Palantir': 'palantir.com', 'Databricks': 'databricks.com',
    'SAP': 'sap.com', 'Figma': 'figma.com', 'Discord': 'discord.com',
    'GitHub': 'github.com', 'LinkedIn': 'linkedin.com', 'Uber': 'uber.com',
    'Bolt': 'bolt.eu', 'Booking.com': 'booking.com', 'Snowflake': 'snowflake.com'
  };

  readonly sectorColors: Record<string, string> = {
    'FinTech': '#6366f1',
    'Media & Entertainment': '#ec4899',
    'Automotive & Energy': '#f59e0b',
    'Travel & Hospitality': '#10b981',
    'E-Commerce': '#3b82f6',
    'Artificial Intelligence': '#8b5cf6',
    'Design & SaaS': '#06b6d4',
  };

  get logoUrl(): string {
    const domain = this.companyDomains[this.company.name];
    if (domain) {
      return `https://www.google.com/s2/favicons?domain=${domain}&sz=128`;
    }
    // Fallback to a generic domain if not in map (e.g., name.com)
    return `https://www.google.com/s2/favicons?domain=${this.company.name.toLowerCase().replace(/ /g, '')}.com&sz=128`;
  }

  get sectorColor(): string {
    return this.sectorColors[this.company.sector] ?? '#6b7280';
  }

  get iconType(): string {
    const name = this.company.name.toLowerCase();
    const sector = this.company.sector;

    if (name.includes('snowflake')) return 'snowflake';
    if (name.includes('stripe') || name.includes('paypal') || name.includes('revolut') || name.includes('klarna')) return 'credit-card';
    if (name.includes('discord')) return 'message-square';
    if (name.includes('spotify')) return 'music';
    if (name.includes('amazon') || name.includes('shopify')) return 'shopping-bag';
    
    // Fallback by sector
    if (sector === 'FinTech') return 'credit-card';
    if (sector === 'Technology' || sector === 'Artificial Intelligence' || sector === 'Semiconductors') return 'cpu';
    if (sector === 'Communication') return 'message-square';
    if (sector === 'E-Commerce' || sector === 'E-Commerce & Cloud') return 'shopping-bag';
    if (sector === 'Design & SaaS' || sector === 'Design Software' || sector === 'Productivity') return 'layers';
    
    return 'building'; // Ultimate fallback
  }

  formatEmployeeCount(count: number): string {
    if (count >= 1000) return `${(count / 1000).toFixed(1)}k`;
    return count.toString();
  }
}
