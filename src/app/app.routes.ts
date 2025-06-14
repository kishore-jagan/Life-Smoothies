import { Routes } from '@angular/router';
import { AuthenticationComponent } from './authentication/authentication.component';
import { LayoutComponent } from './layout/layout.component';
import { DashboardComponent } from './dashboard/dashboard.component';
import { StoragehouseComponent } from './storagehouse/storagehouse.component';
import { MainhouseComponent } from './mainhouse/mainhouse.component';
import { ProductionComponent } from './production/production.component';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'auth',
  },
  {
    path: 'auth',
    component: AuthenticationComponent,
  },
  {
    path: 'base',
    component: LayoutComponent,
    children: [
      {
        path: 'dashboard',
        component: DashboardComponent,
      },
      {
        path: 'storagehouse',
        component: StoragehouseComponent,
      },
      {
        path: 'mainhouse',
        component: MainhouseComponent,
      },
      {
        path: 'production',
        component: ProductionComponent,
      },
      {
        path: '**',
        redirectTo: 'dashboard',
      },
    ],
  },
];
