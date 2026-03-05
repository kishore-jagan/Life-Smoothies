import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { SessionService } from '../users/session-service/session.service';
import { StorageService, StorageItem, LifesmoothieModel, SmoothieProduction } from '../storagehouse/storage.service';
import { ProductionService } from '../production/production.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent implements OnInit {
  constructor(
    private sessionService: SessionService,
    private storageService: StorageService,
    private productionService: ProductionService
  ) {}

  storageList: StorageItem[] = [];
  // lifeSmoothieList: LifesmoothieModel[] = [];
  SmoothieProduction: SmoothieProduction[] = []

  get userFullName(): string {
    const user = this.sessionService.getUser();
    return user?.full_name || user?.user_name || 'User';
  }

  get userInitials(): string {
    const user = this.sessionService.getUser();
    const name = (user?.full_name || user?.user_name || '').trim();
    if (!name) return 'U';
    const parts = name.split(/\s+/);
    const first = parts[0]?.[0] ?? '';
    const second = (parts[1]?.[0] ?? parts[0]?.[1] ?? '') as string;
    const initials = (first + second).toUpperCase();
    return initials || first.toUpperCase() || 'U';
  }

  ngOnInit(): void {
    // Load storage items for totals on dashboard
    this.storageService.getAllStorageItems().subscribe({
      next: (data) => (this.storageList = data || []),
      error: () => (this.storageList = []),
    });

    this.productionService.getAllSmoothieProduction().subscribe({
      next: (data) => (this.SmoothieProduction = data || []),
      error: () => (this.SmoothieProduction = []),
    });
  }

  // ---- Overview metrics (computed from loaded list) ----
  get totalItems(): number {
    return Array.isArray(this.storageList) ? this.storageList.length : 0;
  }

  get totalItemsLife(): number {
    return Array.isArray(this.SmoothieProduction) ? this.SmoothieProduction.length : 0;
  }

  get totalQtyCotton(): number {
    if (!Array.isArray(this.storageList)) return 0;
    return this.storageList.reduce((sum, item: any) => {
      const qty = Number(item?.qtycotton) || 0;
      return sum + qty;
    }, 0);
  }

  get totalQtyCottonLife(): number {
    if (!Array.isArray(this.SmoothieProduction)) return 0;
  
    const total = this.SmoothieProduction.reduce((sum, item: any) => {
      const qty = Number(item?.cotton) || 0;
      return sum + qty;
    }, 0);
  
    console.log('🧾 Total Cotton Quantity (LifeSmoothies):', total);
    return total;
  }
  
  
}

