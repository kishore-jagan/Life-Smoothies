import { Routes } from '@angular/router';
import { AuthenticationComponent } from './authentication/authentication.component';
import { LayoutComponent } from './layout/layout.component';
import { DashboardComponent } from './dashboard/dashboard.component';
import { StoragehouseComponent } from './storagehouse/storagehouse.component';
import { Storagehouse2Component } from './storagehouse2/storagehouse2.component';
import { MainhouseComponent } from './mainhouse/mainhouse.component';
import { ProductionComponent } from './production/production.component';
import { DispatchComponent } from './dispatch/dispatch.component';
import { OverallTableComponent } from './overall-table/overall-table.component';
import { UsersComponent } from './users/users.component';
import { AuthGuard } from './authentication/auth.guard';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'base',
  },
  {
    path: 'auth',
    component: AuthenticationComponent,
  },
  {
    path: 'base',
    component: LayoutComponent,
    canActivate: [AuthGuard],
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
        path: 'storagehouse2',
        component: Storagehouse2Component,
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
        path: 'dispatch',
        component: DispatchComponent,
      },
      {
        path: 'overall-table',
        component: OverallTableComponent,
      },
      {
        path: 'users',
        component: UsersComponent,
      },
      {
        path: '**',
        redirectTo: 'auth',
      },
    ],
  },
];
