import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'companies',
    pathMatch: 'full'
  },
  {
    path: 'companies',
    loadComponent: () =>
      import('./pages/company-list/company-list.component').then(m => m.CompanyListComponent)
  },
  {
    path: 'companies/:id',
    loadComponent: () =>
      import('./pages/company-detail/company-detail.component').then(m => m.CompanyDetailComponent)
  },
  {
    path: '**',
    redirectTo: 'companies'
  }
];
