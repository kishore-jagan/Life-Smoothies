import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { TableModule } from 'primeng/table';
import { MatTabsModule } from '@angular/material/tabs';

export interface RawMaterial {
  used:number,
  kgPerDay: number;
  stock: number;
  daysLeft: number;
}

export interface Product {
  product: string;
  monthlySold: number;
  dailySold: number;
  dailyBoxes: number;
  boxesLeft: number;
  daysRemaining: number;
  materials: {
    [key: string]: RawMaterial;
  };
}

export interface CategoryData {
  [category: string]: Product[];
}

@Component({
  selector: 'app-overall-table',
  standalone: true,
  imports: [TableModule, CommonModule, MatTabsModule],
  templateUrl: './overall-table.component.html',
  styleUrls: ['./overall-table.component.css']
})
export class OverallTableComponent implements OnInit {
  selectedIndex: number = 0;
  allProductData: CategoryData = {};
  currentProducts: Product[] = [];
  materialColumns: string[] = [];
  maxMaterialUsage: { [key: string]: number } = {};
  activeTab: string = 'Smoothies';
  
  tabs = [
    { label: 'Smoothies', value: 'Smoothies', icon: '🥤' },
    { label: 'Shakes', value: 'Shakes', icon: '🥛' },
    { label: 'Bowls', value: 'Bowls', icon: '🥣' },
    { label: 'Ramadan', value: 'Ramadan', icon: '🌙' },
    { label: 'Heyylife', value: 'Heyylife', icon: '💚' }
  ];
  
  ngOnInit() {
    this.initializeData();
    this.extractMaterialColumns();
    this.switchTab('Smoothies');
  }

  private initializeData() {
    this.allProductData = {
      'Smoothies': [
        {
          product: 'Superfruit Smoothie Mix',
          monthlySold: 450,
          dailySold: 15,
          dailyBoxes: 3,
          boxesLeft: 25,
          daysRemaining: 8,
          materials: {
            'Acai': {used:211, kgPerDay: 313.5, stock: 48250, daysLeft: 154 },
            'Aloe Vera': { used:211,kgPerDay: 85.2, stock: 1200, daysLeft: 14 },
            'Banana': {used:211, kgPerDay: 225.0, stock: 5400, daysLeft: 24 },
            'Pineapple': {used:211, kgPerDay: 180.7, stock: 0, daysLeft: 0 },
            'Mango': {used:211, kgPerDay: 142.3, stock: 3200, daysLeft: 22 },
            'Coconut': { used:211,kgPerDay: 95.5, stock: 1850, daysLeft: 19 },
            'Spirulina': { used:211,kgPerDay: 12.8, stock: 450, daysLeft: 35 },
            'Acaie': {used:211, kgPerDay: 313.5, stock: 48250, daysLeft: 154 },
            'Aloe Verae': { used:211,kgPerDay: 85.2, stock: 1200, daysLeft: 14 },
            'Bananae': {used:211, kgPerDay: 225.0, stock: 5400, daysLeft: 24 },
            'Pineapplee': {used:211, kgPerDay: 180.7, stock: 0, daysLeft: 0 },
            'Mangeo': {used:211, kgPerDay: 142.3, stock: 3200, daysLeft: 22 },
            'Coconeut': { used:211,kgPerDay: 95.5, stock: 1850, daysLeft: 19 },
            'Spiruelina': { used:211,kgPerDay: 12.8, stock: 450, daysLeft: 35 }
          }
        },
        {
          product: 'Green Power Smoothie',
          monthlySold: 320,
          dailySold: 12,
          dailyBoxes: 2,
          boxesLeft: 18,
          daysRemaining: 15,
          materials: {
            'Acai': {used:211, kgPerDay: 125.4, stock: 48250, daysLeft: 384 },
            'Aloe Vera': {used:211, kgPerDay: 198.6, stock: 1200, daysLeft: 6 },
            'Banana': { used:211,kgPerDay: 165.0, stock: 5400, daysLeft: 32 },
            'Pineapple': { used:211,kgPerDay: 0, stock: 0, daysLeft: 0 },
            'Mango': {used:211, kgPerDay: 88.9, stock: 3200, daysLeft: 36 },
            'Coconut': { used:211,kgPerDay: 45.2, stock: 1850, daysLeft: 41 },
            'Spirulina': {used:211, kgPerDay: 78.5, stock: 450, daysLeft: 5 },
            'Acaie': {used:211, kgPerDay: 313.5, stock: 48250, daysLeft: 154 },
            'Aloe Verae': { used:211,kgPerDay: 85.2, stock: 1200, daysLeft: 14 },
            'Bananae': {used:211, kgPerDay: 225.0, stock: 5400, daysLeft: 24 },
            'Pineapplee': {used:211, kgPerDay: 180.7, stock: 0, daysLeft: 0 },
            'Mangeo': {used:211, kgPerDay: 142.3, stock: 3200, daysLeft: 22 },
            'Coconeut': { used:211,kgPerDay: 95.5, stock: 1850, daysLeft: 19 },
            'Spiruelina': { used:211,kgPerDay: 12.8, stock: 450, daysLeft: 35 }
          }
        },
        {
          product: 'Tropical Paradise Blend',
          monthlySold: 280,
          dailySold: 10,
          dailyBoxes: 4,
          boxesLeft: 35,
          daysRemaining: 9,
          materials: {
            'Acai': {used:211, kgPerDay: 95.7, stock: 48250, daysLeft: 504 },
            'Aloe Vera': {used:211, kgPerDay: 52.3, stock: 1200, daysLeft: 22 },
            'Banana': { used:211,kgPerDay: 189.4, stock: 5400, daysLeft: 28 },
            'Pineapple': {used:211, kgPerDay: 267.8, stock: 0, daysLeft: 0 },
            'Mango': {used:211, kgPerDay: 201.5, stock: 3200, daysLeft: 15 },
            'Coconut': { used:211,kgPerDay: 134.2, stock: 1850, daysLeft: 13 },
            'Spirulina': {used:211, kgPerDay: 25.1, stock: 450, daysLeft: 17 },
            'Acaie': {used:211, kgPerDay: 313.5, stock: 48250, daysLeft: 154 },
            'Aloe Verae': { used:211,kgPerDay: 85.2, stock: 1200, daysLeft: 14 },
            'Bananae': {used:211, kgPerDay: 225.0, stock: 5400, daysLeft: 24 },
            'Pineapplee': {used:211, kgPerDay: 180.7, stock: 0, daysLeft: 0 },
            'Mangeo': {used:211, kgPerDay: 142.3, stock: 3200, daysLeft: 22 },
            'Coconeut': { used:211,kgPerDay: 95.5, stock: 1850, daysLeft: 19 },
            'Spiruelina': { used:211,kgPerDay: 12.8, stock: 450, daysLeft: 35 }
          }
        }
      ],
      'Shakes': [
        {
          product: 'Protein Power Shake',
          monthlySold: 380,
          dailySold: 13,
          dailyBoxes: 3,
          boxesLeft: 8,
          daysRemaining: 6,
          materials: {
            'Acai': {used:211, kgPerDay: 156.8, stock: 48250, daysLeft: 307 },
            'Aloe Vera': {used:211, kgPerDay: 72.4, stock: 1200, daysLeft: 16 },
            'Banana': {used:211, kgPerDay: 298.7, stock: 5400, daysLeft: 18 },
            'Pineapple': {used:211, kgPerDay: 89.3, stock: 0, daysLeft: 0 },
            'Mango': {used:211, kgPerDay: 134.6, stock: 3200, daysLeft: 23 },
            'Coconut': {used:211, kgPerDay: 187.9, stock: 1850, daysLeft: 9 },
            'Spirulina': { used:211,kgPerDay: 45.7, stock: 450, daysLeft: 9 },
            'Acaie': {used:211, kgPerDay: 313.5, stock: 48250, daysLeft: 154 },
            'Aloe Verae': { used:211,kgPerDay: 85.2, stock: 1200, daysLeft: 14 },
            'Bananae': {used:211, kgPerDay: 225.0, stock: 5400, daysLeft: 24 },
            'Pineapplee': {used:211, kgPerDay: 180.7, stock: 0, daysLeft: 0 },
            'Mangeo': {used:211, kgPerDay: 142.3, stock: 3200, daysLeft: 22 },
            'Coconeut': { used:211,kgPerDay: 95.5, stock: 1850, daysLeft: 19 },
            'Spiruelina': { used:211,kgPerDay: 12.8, stock: 450, daysLeft: 35 }
          }
        },
        {
          product: 'Vanilla Dream Shake',
          monthlySold: 220,
          dailySold: 8,
          dailyBoxes: 2,
          boxesLeft: 22,
          daysRemaining: 11,
          materials: {
            'Acai': { used:211,kgPerDay: 67.2, stock: 48250, daysLeft: 718 },
            'Aloe Vera': {used:211, kgPerDay: 123.8, stock: 1200, daysLeft: 9 },
            'Banana': {used:211, kgPerDay: 156.3, stock: 5400, daysLeft: 34 },
            'Pineapple': {used:211, kgPerDay: 78.1, stock: 0, daysLeft: 0 },
            'Mango': {used:211, kgPerDay: 98.4, stock: 3200, daysLeft: 32 },
            'Coconut': {used:211, kgPerDay: 145.7, stock: 1850, daysLeft: 12 },
            'Spirulina': {used:211, kgPerDay: 34.9, stock: 450, daysLeft: 12 },
            'Acaie': {used:211, kgPerDay: 313.5, stock: 48250, daysLeft: 154 },
            'Aloe Verae': { used:211,kgPerDay: 85.2, stock: 1200, daysLeft: 14 },
            'Bananae': {used:211, kgPerDay: 225.0, stock: 5400, daysLeft: 24 },
            'Pineapplee': {used:211, kgPerDay: 180.7, stock: 0, daysLeft: 0 },
            'Mangeo': {used:211, kgPerDay: 142.3, stock: 3200, daysLeft: 22 },
            'Coconeut': { used:211,kgPerDay: 95.5, stock: 1850, daysLeft: 19 },
            'Spiruelina': { used:211,kgPerDay: 12.8, stock: 450, daysLeft: 35 }
          }
        }
      ],
      'Bowls': [
        {
          product: 'Acai Power Bowl',
          monthlySold: 350,
          dailySold: 12,
          dailyBoxes: 3,
          boxesLeft: 45,
          daysRemaining: 15,
          materials: {
            'Acai': {used:211, kgPerDay: 425.7, stock: 48250, daysLeft: 113 },
            'Aloe Vera': {used:211, kgPerDay: 63.2, stock: 1200, daysLeft: 18 },
            'Banana': {used:211, kgPerDay: 287.4, stock: 5400, daysLeft: 18 },
            'Pineapple': {used:211, kgPerDay: 156.9, stock: 0, daysLeft: 0 },
            'Mango': {used:211, kgPerDay: 198.3, stock: 3200, daysLeft: 16 },
            'Coconut': {used:211, kgPerDay: 234.8, stock: 1850, daysLeft: 7 },
            'Spirulina': {used:211, kgPerDay: 89.1, stock: 450, daysLeft: 5 },
            'Acaie': {used:211, kgPerDay: 313.5, stock: 48250, daysLeft: 154 },
            'Aloe Verae': { used:211,kgPerDay: 85.2, stock: 1200, daysLeft: 14 },
            'Bananae': {used:211, kgPerDay: 225.0, stock: 5400, daysLeft: 24 },
            'Pineapplee': {used:211, kgPerDay: 180.7, stock: 0, daysLeft: 0 },
            'Mangeo': {used:211, kgPerDay: 142.3, stock: 3200, daysLeft: 22 },
            'Coconeut': { used:211,kgPerDay: 95.5, stock: 1850, daysLeft: 19 },
            'Spiruelina': { used:211,kgPerDay: 12.8, stock: 450, daysLeft: 35 }
          }
        },
        {
          product: 'Green Goddess Bowl',
          monthlySold: 180,
          dailySold: 6,
          dailyBoxes: 2,
          boxesLeft: 12,
          daysRemaining: 6,
          materials: {
            'Acai': {used:211, kgPerDay: 89.4, stock: 48250, daysLeft: 540 },
            'Aloe Vera': {used:211, kgPerDay: 167.8, stock: 1200, daysLeft: 7 },
            'Banana': {used:211, kgPerDay: 203.7, stock: 5400, daysLeft: 26 },
            'Pineapple': {used:211, kgPerDay: 134.2, stock: 0, daysLeft: 0 },
            'Mango': {used:211, kgPerDay: 98.6, stock: 3200, daysLeft: 32 },
            'Coconut': {used:211, kgPerDay: 156.3, stock: 1850, daysLeft: 11 },
            'Spirulina': {used:211, kgPerDay: 125.7, stock: 450, daysLeft: 3 },
            'Acaie': {used:211, kgPerDay: 313.5, stock: 48250, daysLeft: 154 },
            'Aloe Verae': { used:211,kgPerDay: 85.2, stock: 1200, daysLeft: 14 },
            'Bananae': {used:211, kgPerDay: 225.0, stock: 5400, daysLeft: 24 },
            'Pineapplee': {used:211, kgPerDay: 180.7, stock: 0, daysLeft: 0 },
            'Mangeo': {used:211, kgPerDay: 142.3, stock: 3200, daysLeft: 22 },
            'Coconeut': { used:211,kgPerDay: 95.5, stock: 1850, daysLeft: 19 },
            'Spiruelina': { used:211,kgPerDay: 12.8, stock: 450, daysLeft: 35 }
          }
        }
      ],
      'Ramadan': [
        {
          product: 'Iftar Energy Blend',
          monthlySold: 420,
          dailySold: 14,
          dailyBoxes: 4,
          boxesLeft: 28,
          daysRemaining: 7,
          materials: {
            'Acai': {used:211, kgPerDay: 267.3, stock: 48250, daysLeft: 180 },
            'Aloe Vera': {used:211, kgPerDay: 145.6, stock: 1200, daysLeft: 8 },
            'Banana': {used:211, kgPerDay: 334.8, stock: 5400, daysLeft: 16 },
            'Pineapple': {used:211, kgPerDay: 198.7, stock: 0, daysLeft: 0 },
            'Mango': { used:211,kgPerDay: 256.4, stock: 3200, daysLeft: 12 },
            'Coconut': {used:211, kgPerDay: 189.2, stock: 1850, daysLeft: 9 },
            'Spirulina': {used:211, kgPerDay: 67.8, stock: 450, daysLeft: 6 },
            'Acaie': {used:211, kgPerDay: 313.5, stock: 48250, daysLeft: 154 },
            'Aloe Verae': { used:211,kgPerDay: 85.2, stock: 1200, daysLeft: 14 },
            'Bananae': {used:211, kgPerDay: 225.0, stock: 5400, daysLeft: 24 },
            'Pineapplee': {used:211, kgPerDay: 180.7, stock: 0, daysLeft: 0 },
            'Mangeo': {used:211, kgPerDay: 142.3, stock: 3200, daysLeft: 22 },
            'Coconeut': { used:211,kgPerDay: 95.5, stock: 1850, daysLeft: 19 },
            'Spiruelina': { used:211,kgPerDay: 12.8, stock: 450, daysLeft: 35 }
          }
        },
        {
          product: 'Suhoor Vitality Mix',
          monthlySold: 290,
          dailySold: 10,
          dailyBoxes: 2,
          boxesLeft: 15,
          daysRemaining: 8,
          materials: {
            'Acai': {used:211, kgPerDay: 178.9, stock: 48250, daysLeft: 269 },
            'Aloe Vera': { used:211,kgPerDay: 98.4, stock: 1200, daysLeft: 12 },
            'Banana': { used:211,kgPerDay: 245.7, stock: 5400, daysLeft: 21 },
            'Pineapple': {used:211, kgPerDay: 123.6, stock: 0, daysLeft: 0 },
            'Mango': {used:211, kgPerDay: 167.3, stock: 3200, daysLeft: 19 },
            'Coconut': { used:211,kgPerDay: 134.5, stock: 1850, daysLeft: 13 },
            'Spirulina': {used:211, kgPerDay: 56.2, stock: 450, daysLeft: 8 },
            'Acaie': {used:211, kgPerDay: 313.5, stock: 48250, daysLeft: 154 },
            'Aloe Verae': { used:211,kgPerDay: 85.2, stock: 1200, daysLeft: 14 },
            'Bananae': {used:211, kgPerDay: 225.0, stock: 5400, daysLeft: 24 },
            'Pineapplee': {used:211, kgPerDay: 180.7, stock: 0, daysLeft: 0 },
            'Mangeo': {used:211, kgPerDay: 142.3, stock: 3200, daysLeft: 22 },
            'Coconeut': { used:211,kgPerDay: 95.5, stock: 1850, daysLeft: 19 },
            'Spiruelina': { used:211,kgPerDay: 12.8, stock: 450, daysLeft: 35 }
          }
        }
      ],
      'Heyylife': [
        {
          product: 'Life Balance Formula',
          monthlySold: 310,
          dailySold: 11,
          dailyBoxes: 3,
          boxesLeft: 33,
          daysRemaining: 10,
          materials: {
            'Acai': {used:211, kgPerDay: 198.4, stock: 48250, daysLeft: 243 },
            'Aloe Vera': {used:211, kgPerDay: 134.7, stock: 1200, daysLeft: 8 },
            'Banana': {used:211, kgPerDay: 267.8, stock: 5400, daysLeft: 20 },
            'Pineapple': {used:211, kgPerDay: 145.3, stock: 0, daysLeft: 0 },
            'Mango': {used:211, kgPerDay: 189.6, stock: 3200, daysLeft: 16 },
            'Coconut': {used:211, kgPerDay: 156.9, stock: 1850, daysLeft: 11 },
            'Spirulina': { used:211,kgPerDay: 78.3, stock: 450, daysLeft: 5 },
            'Acaie': {used:211, kgPerDay: 313.5, stock: 48250, daysLeft: 154 },
            'Aloe Verae': { used:211,kgPerDay: 85.2, stock: 1200, daysLeft: 14 },
            'Bananae': {used:211, kgPerDay: 225.0, stock: 5400, daysLeft: 24 },
            'Pineapplee': {used:211, kgPerDay: 180.7, stock: 0, daysLeft: 0 },
            'Mangeo': {used:211, kgPerDay: 142.3, stock: 3200, daysLeft: 22 },
            'Coconeut': { used:211,kgPerDay: 95.5, stock: 1850, daysLeft: 19 },
            'Spiruelina': { used:211,kgPerDay: 12.8, stock: 450, daysLeft: 35 }
          }
        },
        {
          product: 'Wellness Complete Plus',
          monthlySold: 250,
          dailySold: 9,
          dailyBoxes: 2,
          boxesLeft: 18,
          daysRemaining: 9,
          materials: {
            'Acai': {used:211, kgPerDay: 145.2, stock: 48250, daysLeft: 332 },
            'Aloe Vera': {used:211, kgPerDay: 167.4, stock: 1200, daysLeft: 7 },
            'Banana': {used:211, kgPerDay: 198.7, stock: 5400, daysLeft: 27 },
            'Pineapple': {used:211, kgPerDay: 89.3, stock: 0, daysLeft: 0 },
            'Mango': {used:211, kgPerDay: 134.8, stock: 3200, daysLeft: 23 },
            'Coconut': {used:211, kgPerDay: 123.6, stock: 1850, daysLeft: 14 },
            'Spirulina': {used:211, kgPerDay: 67.9, stock: 450, daysLeft: 6 },
            'Acaie': {used:211, kgPerDay: 313.5, stock: 48250, daysLeft: 154 },
            'Aloe Verae': { used:211,kgPerDay: 85.2, stock: 1200, daysLeft: 14 },
            'Bananae': {used:211, kgPerDay: 225.0, stock: 5400, daysLeft: 24 },
            'Pineapplee': {used:211, kgPerDay: 180.7, stock: 0, daysLeft: 0 },
            'Mangeo': {used:211, kgPerDay: 142.3, stock: 3200, daysLeft: 22 },
            'Coconeut': { used:211,kgPerDay: 95.5, stock: 1850, daysLeft: 19 },
            'Spiruelina': { used:211,kgPerDay: 12.8, stock: 450, daysLeft: 35 }
          }
        }
      ]
    };
  }

  private extractMaterialColumns() {
    const materialSet = new Set<string>();
    Object.values(this.allProductData).forEach(products => {
      products.forEach(product => {
        Object.keys(product.materials).forEach(material => {
          materialSet.add(material);
        });
      });
    });
    this.materialColumns = Array.from(materialSet).sort();
  }

  switchTab(tabValue: string) {
    this.activeTab = tabValue;

    this.currentProducts = this.allProductData[tabValue] || [];
  }

  // Status and styling methods
  getDaysRemainingClass(daysRemaining: number): string {
    return daysRemaining < 10 ? 'days-critical' : '';
  }

  getBoxesLeftClass(boxesLeft: number, dailyBoxes: number): string {
    return boxesLeft < dailyBoxes ? 'boxes-warning' : '';
  }

  getRowClass(product: Product): string {
    if (product.daysRemaining < 10 || product.boxesLeft < product.dailyBoxes) {
      return product.daysRemaining < 7 ? 'row-critical' : 'row-warning';
    }
    return '';
  }

  getStatusClass(product: Product): string {
    if (product.daysRemaining < 7) return 'status-critical';
    if (product.daysRemaining < 10 || product.boxesLeft < product.dailyBoxes) return 'status-warning';
    return 'status-healthy';
  }

  getStatusText(product: Product): string {
    if (product.daysRemaining < 7) return 'Critical';
    if (product.daysRemaining < 10 || product.boxesLeft < product.dailyBoxes) return 'Low Stock';
    return 'Healthy';
  }

  getStockIndicatorClass(boxesLeft: number, dailyBoxes: number): string {
    return boxesLeft < dailyBoxes ? 'stock-low' : 'stock-healthy';
  }

  getStockStatus(boxesLeft: number, dailyBoxes: number): string {
    return boxesLeft < dailyBoxes ? 'Low' : 'Good';
  }

  getUrgencyClass(daysRemaining: number): string {
    if (daysRemaining < 7) return 'urgency-high';
    if (daysRemaining < 10) return 'urgency-medium';
    return 'urgency-low';
  }

  getMaterialData(product: Product, material: string): RawMaterial {
    return product.materials[material] || { kgPerDay: 0, stock: 0, daysLeft: 0 };
  }

  getMaterialDaysClass(daysLeft: number): string {
    return daysLeft < 10 ? 'material-days-critical' : '';
  }

  getMaterialStockClass(stock: number): string {
    return stock === 0 ? 'material-stock-zero' : '';
  }

  getMaterialKgClass(kgPerDay: number): string {
    return kgPerDay === 0 ? 'material-kg-zero' : '';
  }

  // Dashboard statistics
  getTotalMonthlySales(): number {
    return this.currentProducts.reduce((total, product) => total + product.monthlySold, 0);
  }

  getCriticalProducts(): number {
    return this.currentProducts.filter(product => 
      product.daysRemaining < 10 || product.boxesLeft < product.dailyBoxes
    ).length;
  }

  getActiveTabIcon(): string {
    const tab = this.tabs.find(t => t.value === this.activeTab);
    return tab?.icon || '📊';
  }
}