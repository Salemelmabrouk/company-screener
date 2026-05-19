import { ChangeDetectionStrategy, Component, Input, Output, EventEmitter, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CompanyBrandUtil } from '../../utils/company-brand.util';
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

  get logoUrl(): string {
    return CompanyBrandUtil.getLogoUrl(this.company.name);
  }

  get sectorColor(): string {
    return CompanyBrandUtil.getSectorColor(this.company.sector);
  }

  get iconType(): string {
    return CompanyBrandUtil.getIconType(this.company.name, this.company.sector);
  }

  formatEmployeeCount(count: number): string {
    if (count >= 1000) return `${(count / 1000).toFixed(1)}k`;
    return count.toString();
  }
}
