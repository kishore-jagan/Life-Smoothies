import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { TableModule } from 'primeng/table';
import { TooltipModule } from 'primeng/tooltip';
import { TabViewModule } from 'primeng/tabview';
// import { MatTabsModule } from '@angular/material/tabs';
import { DispatchService } from '../dispatch/dispatch.service';
import { ProductionService, SmoothieProduction } from '../production/production.service';
import { StorageService, StorageItem } from '../storagehouse/storage.service';
import { DropdownModule } from 'primeng/dropdown';
import { FormsModule } from '@angular/forms';
// Styled Excel export (Plan B)
import { Workbook } from 'exceljs';
import { saveAs } from 'file-saver';

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
  imports: [TableModule, TabViewModule, CommonModule, DropdownModule, FormsModule, TooltipModule],
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
  // Aggregated totals across visible products for the footer
  materialTotals: { [key: string]: RawMaterial } = {};
  // User-entered stock overrides (kg) for predictive calculation
  stockOverrides: { [key: string]: number } = {};
  // User-entered monthly sold overrides per product
  monthlyOverrides: { [product: string]: number } = {};
  // Prediction scenario state
  predictionName: string = '';
  predictionEntries: { kind: 'material' | 'product' | 'shases'; key: string; qty: number }[] = [];
  predictionMaterialUsage: { [material: string]: number } = {}; // kg to subtract
  predictionBoxesUsage: { [product: string]: number } = {}; // boxes to subtract
  // Temp form fields (bound in template)
  predictionType: 'material' | 'product' | 'shases' = 'material';
  predictionSelectedMaterial: string = '';
  predictionSelectedProduct: string = '';
  predictionQuantity: number = 0;
  showPredictionForm: boolean = false;

  // Dropdown options computed from current state
  get materialDropdownOptions(): { label: string; value: string }[] {
    return (this.materialColumns || []).map((m) => ({ label: m, value: m }));
  }

  get productDropdownOptions(): { label: string; value: string }[] {
    return (this.currentProducts || []).map((p) => ({ label: p.product, value: p.product }));
  }

  togglePredictionForm() {
    this.showPredictionForm = !this.showPredictionForm;
  }

  // Compute impacted summaries for preview tables
  private getOverrideKeyForNormalizedMaterial(normalizedMaterialName: string): string | undefined {
    return Object.keys(this.stockOverrides).find(k => k.trim().toLowerCase() === normalizedMaterialName);
  }

  private getEffectiveStockBeforePrediction(normalizedMaterialName: string, defaultStock: number): number {
    const overrideKey = this.getOverrideKeyForNormalizedMaterial(normalizedMaterialName);
    if (overrideKey) {
      return this.getEffectiveStock(overrideKey, defaultStock);
    }
    return defaultStock;
  }

  get impactedProductsForPreview(): { product: string; usedBoxes: number; boxesBefore: number; boxesAfter: number }[] {
    // Aggregate usage per product (boxes), including shases converted
    const usage: { [product: string]: number } = {};
    for (const e of this.predictionEntries) {
      if (e.kind === 'product') {
        usage[e.key] = (usage[e.key] || 0) + Math.max(0, Number(e.qty) || 0);
      } else if (e.kind === 'shases') {
        const boxes = Math.max(0, Number(e.qty) || 0) / 15;
        usage[e.key] = (usage[e.key] || 0) + boxes;
      }
    }
    const rows: { product: string; usedBoxes: number; boxesBefore: number; boxesAfter: number }[] = [];
    Object.keys(usage).forEach((prod) => {
      const before = this.computeBaseBoxesLeft(prod);
      const after = Math.max(0, before - (usage[prod] || 0));
      rows.push({ product: prod, usedBoxes: usage[prod], boxesBefore: before, boxesAfter: after });
    });
    return rows;
  }

  get impactedMaterialsForPreview(): { material: string; usedKg: number; stockBefore: number; stockAfter: number }[] {
    // Build a temporary aggregate usage by material from entries (materials + shases→recipe)
    const matUsage: { [material: string]: number } = {};
    for (const e of this.predictionEntries) {
      if (e.kind === 'material') {
        matUsage[e.key] = (matUsage[e.key] || 0) + Math.max(0, Number(e.qty) || 0);
      } else if (e.kind === 'shases') {
        const recipe = this.recipeMap.get(e.key);
        const shases = Math.max(0, Number(e.qty) || 0);
        if (recipe && shases > 0) {
          recipe.forEach((qtyG, matName) => {
            const addKg = (Number(qtyG) || 0) * shases / 1000;
            matUsage[matName] = (matUsage[matName] || 0) + addKg;
          });
        }
      }
    }
    const rows: { material: string; usedKg: number; stockBefore: number; stockAfter: number }[] = [];
    Object.keys(matUsage).forEach((mat) => {
      const usedKg = Math.max(0, Number(matUsage[mat]) || 0);
      const normalized = mat.trim().toLowerCase();
      const defaultStock = this.stockMap.get(normalized) || 0;
      const before = this.getEffectiveStockBeforePrediction(normalized, defaultStock);
      const after = Math.max(0, before - usedKg);
      rows.push({ material: mat, usedKg, stockBefore: before, stockAfter: after });
    });
    return rows;
  }

  // Helpers to compute current effective boxesLeft for a product in the active context
  private computeBaseBoxesLeft(productName: string): number {
    const currentCategory = this.activeTab === '__ALL__' ? null : this.activeTab;
    const cottonKey = `${currentCategory ?? ''}||${productName}`;
    if (currentCategory) {
      return this.cottonMap.get(cottonKey) || 0;
    }
    let sum = 0;
    const suffix = `||${productName}`;
    this.cottonMap.forEach((val, key) => {
      if (key.endsWith(suffix)) sum += val;
    });
    return sum;
  }

  getCurrentEffectiveBoxesLeftForProduct(productName: string): number {
    const base = this.computeBaseBoxesLeft(productName);
    return this.getEffectiveBoxesLeft(productName, this.activeTab === '__ALL__' ? undefined : this.activeTab, base);
  }

  // Preview for shases input: boxes left and remaining stock per material
  get shasesPreview() {
    if (this.predictionType !== 'shases') return null;
    const product = this.predictionSelectedProduct;
    const shases = Number(this.predictionQuantity);
    if (!product || isNaN(shases) || shases <= 0) return null;
    const boxesToUse = shases / 15;
    const boxesLeftBefore = this.getCurrentEffectiveBoxesLeftForProduct(product);
    const boxesLeftAfter = Math.max(0, boxesLeftBefore - boxesToUse);
    const recipe = this.recipeMap.get(product);
    const materials: { name: string; remainingStock: number }[] = [];
    if (recipe) {
      recipe.forEach((qtyG, matName) => {
        const normalized = matName.trim().toLowerCase();
        const currentStock = this.getEffectiveStockForMaterialName(normalized, this.stockMap.get(normalized) || 0);
        const consumeKg = (qtyG * shases) / 1000; // grams per shase * shases -> grams; /1000 -> kg
        const after = Math.max(0, currentStock - consumeKg);
        materials.push({ name: matName, remainingStock: after });
      });
    }
    return { boxesLeftBefore, boxesLeftAfter, materials };
  }
  // Persisted maps to support recalculation without refetching
  private recipeMap: Map<string, Map<string, number>> = new Map(); // smoothie_name -> material -> qty per smoothie (g)
  private cottonMap: Map<string, number> = new Map(); // `${category}||${smoothie}` -> cotton count
  private stockMap: Map<string, number> = new Map(); // normalized material -> stock kg
    
  tabs: { label: string; value: string; icon: string }[] = [];
  // Month/Year filtering
  monthsOptions = [
    { label: 'Jan', value: 1 },
    { label: 'Feb', value: 2 },
    { label: 'Mar', value: 3 },
    { label: 'Apr', value: 4 },
    { label: 'May', value: 5 },
    { label: 'Jun', value: 6 },
    { label: 'Jul', value: 7 },
    { label: 'Aug', value: 8 },
    { label: 'Sep', value: 9 },
    { label: 'Oct', value: 10 },
    { label: 'Nov', value: 11 },
    { label: 'Dec', value: 12 },
  ];
  yearsOptions: { label: string; value: number }[] = [];
  selectedMonth!: number;
  selectedYear!: number;
  
  constructor(
    private dispatchService: DispatchService,
    private productionService: ProductionService,
    private storageService: StorageService
  ) {}

  ngOnInit() {
    const now = new Date();
    this.selectedMonth = now.getMonth() + 1;
    this.selectedYear = now.getFullYear();
    // Build years around current year
    const start = this.selectedYear - 3;
    const end = this.selectedYear + 1;
    this.yearsOptions = [];
    for (let y = start; y <= end; y++) {
      this.yearsOptions.push({ label: String(y), value: y });
    }
    this.initializeData();
  }

  onFilterChange() {
    this.initializeData();
  }

  private initializeData() {
    this.dispatchService.getCompletedDispatches(this.selectedMonth, this.selectedYear).subscribe((rows: any[]) => {
      // rows: [{ id, driver_name, truck_no, creation_date, item_details: [] }]
      const categories = new Set<string>();
      const data: CategoryData = {};
      // Temporary aggregator: category -> productName -> Product
      const grouped: { [cat: string]: { [productName: string]: Product } } = {};

      (rows || []).forEach((row: any) => {
        const items: any[] = Array.isArray(row.item_details)
          ? row.item_details
          : (typeof row.item_details === 'string' ? this.safeParseJSON(row.item_details) : []);

        items.forEach((it: any) => {
          const cat = String(it.category || 'Others');
          categories.add(cat);

          if (!grouped[cat]) grouped[cat] = {};

          const productName = String(it.smoothie_name || '');
          const monthly = Number(it.totalShases) || 0; // Monthly as totalShases

          // Get or create aggregated product entry
          if (!grouped[cat][productName]) {
            grouped[cat][productName] = {
              product: productName,
              monthlySold: 0,
              dailySold: 0,
              dailyBoxes: 0,
              boxesLeft: 0, // leave empty for now
              daysRemaining: 0, // leave empty for now
              materials: {}
            };
          }

          const entry = grouped[cat][productName];
          // Accumulate monthlySold for same product
          entry.monthlySold += monthly;
        });
      });

      // Fetch smoothie production to compute boxesLeft/daysRemaining and per-ingredient usage
      this.productionService.getAllSmoothieProduction().subscribe((prods: SmoothieProduction[]) => {
        // Build a recipe map: smoothie_name -> ingredient name -> per-unit qty (grams)
        this.recipeMap = new Map<string, Map<string, number>>();
        (prods || []).forEach((p) => {
          const sName = p.smoothie_name || '';
          const map = this.recipeMap.get(sName) || new Map<string, number>();
          (p.ingredients || []).forEach((ing) => {
            const ingName = (ing?.name || '').trim();
            const qty = Number(ing?.qty) || 0; // grams per smoothie
            map.set(ingName, qty);
          });
          this.recipeMap.set(sName, map);
        });

        // Aggregate cotton by category + smoothie_name
        this.cottonMap = new Map<string, number>();
        (prods || []).forEach((p) => {
          const key = `${p.category || 'Others'}||${p.smoothie_name || ''}`;
          const curr = this.cottonMap.get(key) || 0;
          this.cottonMap.set(key, curr + (Number(p.cotton) || 0));
        });

        // Fetch storage to compute material stock and daysLeft
        this.storageService.getAllStorageByDate().subscribe((storage: StorageItem[]) => {
          this.stockMap = new Map<string, number>();
          (storage || []).forEach((s) => {
            const key = (s.itemname || '').trim().toLowerCase();
            const curr = this.stockMap.get(key) || 0;
            this.stockMap.set(key, curr + (Number(s.qtykg) || 0));
          });

          // Finalize aggregated data into arrays and compute daily metrics + boxesLeft/daysRemaining + material usage/stock
          Array.from(categories).forEach((cat) => {
            const byProduct = grouped[cat] || {};
            data[cat] = Object.values(byProduct).map((p) => {
              const daily = p.monthlySold / 30;
              const dailyBoxes = daily / 15;
              const cottonKey = `${cat}||${p.product}`;
              const baseBoxesLeft = this.cottonMap.get(cottonKey) || 0;
              const boxesLeft = this.getEffectiveBoxesLeft(p.product, cat, baseBoxesLeft);
              const daysRemaining = dailyBoxes > 0 ? boxesLeft / dailyBoxes : 0;

              // Recompute per-material usage based on recipe qty * daily sold
              const recipe = this.recipeMap.get(p.product);
              const materials: { [key: string]: RawMaterial } = {};
              if (recipe) {
                recipe.forEach((qtyG, matName) => {
                  const used = qtyG * daily; // grams used per day for this material
                  const kgPerDay = used / 1000;
                  const normalized = matName.trim().toLowerCase();
                  const stock = this.getEffectiveStockForMaterialName(normalized, this.stockMap.get(normalized) || 0);
                  const daysLeft = kgPerDay > 0 ? stock / kgPerDay : 0;
                  materials[matName] = { used, kgPerDay, stock, daysLeft };
                });
              }

              return {
                ...p,
                dailySold: daily,
                dailyBoxes: dailyBoxes,
                boxesLeft,
                daysRemaining,
                materials,
              } as Product;
            });
          });

          // Set tabs from categories and prepend an 'All' tab
          const catTabs = Array.from(categories).sort().map((c) => ({ label: c, value: c, icon: '📊' }));
          this.tabs = [{ label: 'All', value: '__ALL__', icon: '🗂️' }, ...catTabs];

          this.allProductData = data;
          // Default to 'All' if available
          const defaultTab = this.tabs[0]?.value || '';
          this.activeTab = defaultTab || '';
          this.switchTab(this.activeTab);
          this.extractMaterialColumns();
          this.updateMaterialTotals();
          this.restoreTempPredictionAndApply();
        });
      });
    });
  }

  private safeParseJSON(val: any): any[] {
    try {
      const parsed = JSON.parse(val);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
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
    if (tabValue === '__ALL__') {
      // Flatten all products from all categories
      const all: Product[] = [];
      Object.values(this.allProductData).forEach(arr => all.push(...arr));
      this.currentProducts = all;
    } else {
      this.currentProducts = this.allProductData[tabValue] || [];
    }
    this.updateMaterialTotals();
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
    return product.materials[material] || { used: 0, kgPerDay: 0, stock: 0, daysLeft: 0 };
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

  // Compute aggregated totals for each material across the currently visible products
  private updateMaterialTotals() {
    const totals: { [key: string]: RawMaterial } = {};
    for (const p of this.currentProducts) {
      for (const [mat, data] of Object.entries(p.materials || {})) {
        if (!totals[mat]) {
          totals[mat] = { used: 0, kgPerDay: 0, stock: 0, daysLeft: 0 };
        }
        totals[mat].used += data.used || 0;
        totals[mat].kgPerDay += data.kgPerDay || 0;
        // Stock is global per material, take the latest non-zero if present
        if ((data.stock || 0) > 0) {
          totals[mat].stock = data.stock;
        }
      }
    }
    // Compute daysLeft based on aggregated kgPerDay
    Object.keys(totals).forEach((mat) => {
      const t = totals[mat];
      // If user provided an override, use it instead of storage stock
      const effectiveStock = this.getEffectiveStock(mat, t.stock);
      t.stock = effectiveStock;
      t.daysLeft = (t.kgPerDay || 0) > 0 ? effectiveStock / t.kgPerDay : 0;
    });
    this.materialTotals = totals;
  }

  // Helper to read totals in template safely
  getTotalMaterialData(material: string): RawMaterial {
    return this.materialTotals[material] || { used: 0, kgPerDay: 0, stock: 0, daysLeft: 0 };
  }

  // Effective stock uses user override if provided (>= 0), else the default stock
  getEffectiveStock(material: string, defaultStock: number): number {
    const ov = this.stockOverrides[material];
    if (ov === undefined || ov === null) return defaultStock;
    const num = Number(ov);
    return isNaN(num) || num < 0 ? defaultStock : num;
  }

  // Effective stock that also subtracts prediction material usage (kg)
  private getEffectiveStockForMaterialName(normalizedMaterialName: string, defaultStock: number): number {
    // Respect user overrides first (material keys in overrides are original case as shown in UI columns)
    // Try to find an override by matching case-insensitively
    let effective = defaultStock;
    const overrideKey = Object.keys(this.stockOverrides).find(k => k.trim().toLowerCase() === normalizedMaterialName);
    if (overrideKey) {
      effective = this.getEffectiveStock(overrideKey, defaultStock);
    }
    // Subtract prediction usage if present
    const predKey = Object.keys(this.predictionMaterialUsage).find(k => k.trim().toLowerCase() === normalizedMaterialName);
    if (predKey) {
      const minus = Number(this.predictionMaterialUsage[predKey]) || 0;
      effective = Math.max(0, effective - Math.max(0, minus));
    }
    return effective;
  }

  // When user changes a stock override, update the map and recompute totals
  onStockOverrideChange(material: string, value: any) {
    const num = Number(value);
    if (isNaN(num) || num < 0) {
      // Remove invalid override
      delete this.stockOverrides[material];
    } else {
      this.stockOverrides[material] = num;
    }
    this.updateMaterialTotals();
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

  // Monthly Sold override helpers
  getEffectiveMonthlySold(product: Product): number {
    const ov = this.monthlyOverrides[product.product];
    if (ov === undefined || ov === null) return product.monthlySold;
    const num = Number(ov);
    return isNaN(num) || num < 0 ? product.monthlySold : num;
  }

  onMonthlyOverrideChange(product: Product, value: any) {
    const num = Number(value);
    if (isNaN(num) || num < 0) {
      delete this.monthlyOverrides[product.product];
    } else {
      this.monthlyOverrides[product.product] = num;
    }
    this.recalcDerivedForCurrentProducts();
  }

  // Recalculate daily metrics and materials for currentProducts using overrides
  private recalcDerivedForCurrentProducts() {
    // Need active category for cotton key composition when recalculating daysRemaining
    const currentCategory = this.activeTab === '__ALL__' ? null : this.activeTab;
    this.currentProducts = this.currentProducts.map((p) => {
      const effectiveMonthly = this.getEffectiveMonthlySold(p);
      const daily = effectiveMonthly / 30;
      const dailyBoxes = daily / 15;
      // boxesLeft previously computed based on cotton; recompute daysRemaining only
      const cottonKey = `${currentCategory ?? ''}||${p.product}`;
      // If category unknown in ALL, try to sum cotton across categories for this product
      let baseBoxesLeft = 0;
      if (currentCategory) {
        baseBoxesLeft = this.cottonMap.get(cottonKey) || 0;
      } else {
        // sum all keys that end with ||product
        const suffix = `||${p.product}`;
        this.cottonMap.forEach((val, key) => {
          if (key.endsWith(suffix)) baseBoxesLeft += val;
        });
      }
      const boxesLeft = this.getEffectiveBoxesLeft(p.product, currentCategory || undefined, baseBoxesLeft);
      const daysRemaining = dailyBoxes > 0 ? boxesLeft / dailyBoxes : 0;

      // Recompute materials based on recipe and stock
      const recipe = this.recipeMap.get(p.product);
      const materials: { [key: string]: RawMaterial } = {};
      if (recipe) {
        recipe.forEach((qtyG, matName) => {
          const used = qtyG * daily; // grams/day
          const kgPerDay = used / 1000;
          const normalized = matName.trim().toLowerCase();
          const stock = this.getEffectiveStockForMaterialName(normalized, this.stockMap.get(normalized) || 0);
          const daysLeft = kgPerDay > 0 ? stock / kgPerDay : 0;
          materials[matName] = { used, kgPerDay, stock, daysLeft };
        });
      }

      return {
        ...p,
        monthlySold: effectiveMonthly,
        dailySold: daily,
        dailyBoxes: dailyBoxes,
        boxesLeft: boxesLeft,
        daysRemaining,
        materials,
      } as Product;
    });
    this.updateMaterialTotals();
  }

  // Compute effective boxes left after prediction usage per product
  private getEffectiveBoxesLeft(productName: string, category?: string, defaultBoxesLeft: number = 0): number {
    const pred = this.predictionBoxesUsage[productName] || 0;
    const effective = Math.max(0, (defaultBoxesLeft || 0) - Math.max(0, Number(pred) || 0));
    return effective;
  }

  // Prediction UI handlers
  addPredictionEntry() {
    const qty = Number(this.predictionQuantity);
    if (isNaN(qty) || qty <= 0) return;
    if (this.predictionType === 'material') {
      const key = this.predictionSelectedMaterial;
      if (!key) return;
      this.predictionEntries.push({ kind: 'material', key, qty });
    } else {
      const key = this.predictionSelectedProduct;
      if (!key) return;
      if (this.predictionType === 'product') {
        this.predictionEntries.push({ kind: 'product', key, qty });
      } else {
        // shases
        this.predictionEntries.push({ kind: 'shases', key, qty });
      }
    }
    // reset qty field for quick successive adds
    this.predictionQuantity = 0;
    this.saveTempPrediction();
  }

  removePredictionEntry(index: number) {
    if (index < 0 || index >= this.predictionEntries.length) return;
    this.predictionEntries.splice(index, 1);
    this.saveTempPrediction();
  }

  applyPrediction() {
    // Build maps from entries
    this.predictionMaterialUsage = {};
    this.predictionBoxesUsage = {};
    for (const e of this.predictionEntries) {
      if (e.kind === 'material') {
        const prev = this.predictionMaterialUsage[e.key] || 0;
        this.predictionMaterialUsage[e.key] = prev + Math.max(0, Number(e.qty) || 0);
      } else if (e.kind === 'product') {
        const prev = this.predictionBoxesUsage[e.key] || 0;
        this.predictionBoxesUsage[e.key] = prev + Math.max(0, Number(e.qty) || 0);
      } else if (e.kind === 'shases') {
        const product = e.key;
        const shases = Math.max(0, Number(e.qty) || 0);
        // Convert shases to boxes
        const boxes = shases / 15;
        const prevB = this.predictionBoxesUsage[product] || 0;
        this.predictionBoxesUsage[product] = prevB + boxes;
        // Convert shases to material kg by recipe
        const recipe = this.recipeMap.get(product);
        if (recipe) {
          recipe.forEach((qtyG, matName) => {
            const addKg = (Number(qtyG) || 0) * shases / 1000;
            const curr = this.predictionMaterialUsage[matName] || 0;
            this.predictionMaterialUsage[matName] = curr + addKg;
          });
        }
      }
    }
    this.recalcDerivedForCurrentProducts();
    this.saveTempPrediction();
  }

  clearPrediction() {
    this.predictionEntries = [];
    this.predictionMaterialUsage = {};
    this.predictionBoxesUsage = {};
    this.predictionName = '';
    this.recalcDerivedForCurrentProducts();
    this.clearTempPrediction();
  }

  // Temporary persistence for Customers entries
  private TEMP_KEY = 'ims_prediction_temp_v1';

  private saveTempPrediction() {
    try {
      const payload = {
        name: this.predictionName || '',
        entries: (this.predictionEntries || []).slice(),
      };
      localStorage.setItem(this.TEMP_KEY, JSON.stringify(payload));
    } catch {
      // ignore
    }
  }

  private clearTempPrediction() {
    try {
      localStorage.removeItem(this.TEMP_KEY);
    } catch {
      // ignore
    }
  }

  private restoreTempPredictionAndApply() {
    try {
      const raw = localStorage.getItem(this.TEMP_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      const entries = Array.isArray(parsed?.entries) ? parsed.entries : [];
      this.predictionEntries = entries;
      this.predictionName = parsed?.name || '';
      if (this.predictionEntries.length > 0) {
        this.applyPrediction();
      }
    } catch {
      // ignore
    }
  }

  // Build a tooltip string listing per-product used grams for a given material
  getMaterialBreakdownTooltip(material: string): string {
    const lines: string[] = [];
    for (const p of this.currentProducts) {
      const data = p.materials?.[material];
      if (data && (data.used || 0) > 0) {
        lines.push(`${p.product}: ${(data.used || 0).toFixed(1)} g`);
      }
    }
    if (lines.length === 0) return 'No usage';
    const total = this.getTotalMaterialData(material);
    lines.push(`\nTotal kg/day: ${(total.kgPerDay || 0).toFixed(2)}`);
    lines.push(`Stock (kg): ${(total.stock || 0).toFixed(0)}`);
    lines.push(`Days left: ${(total.daysLeft || 0).toFixed(0)}`);
    return lines.join('\n');
  }

  // Export current view to Excel (Products sheet + Totals sheet)
  exportToExcel() {
    this.exportToExcelStyled();
  }

  private exportToExcelStyled() {
    const wb = new Workbook();
    const ws = wb.addWorksheet('Overview', {
      views: [{ state: 'frozen', xSplit: 6, ySplit: 1 }]
    });

    // Build materials list (columns to the right)
    const mats = this.materialColumns.slice();

    // Column headers
    const fixedHeaders = ['Product', 'Monthly sold', 'Daily sold', 'Daily boxes', 'Boxes left', 'Days remain'];
    const headers = [...fixedHeaders, ...mats];

    ws.addRow(headers);
    // Style header
    const headerRow = ws.getRow(1);
    headerRow.font = { bold: true, color: { argb: 'FF1E293B' } };
    headerRow.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
    headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE2E8F0' } } as any;
    headerRow.border = { bottom: { style: 'thin', color: { argb: 'FF94A3B8' } } };

    // Column widths
    const widths = [28, 14, 12, 12, 12, 12, ...mats.map(() => 14)];
    widths.forEach((w, i) => { ws.getColumn(i + 1).width = w; });

    // Compose categories to export
    const categories: { label: string, rows: Product[] }[] = [];
    if (this.activeTab === '__ALL__') {
      Object.keys(this.allProductData).sort().forEach(cat => {
        categories.push({ label: cat, rows: (this.allProductData[cat] || []) });
      });
    } else {
      categories.push({ label: this.activeTab, rows: this.currentProducts });
    }

    let r = 2; // current row pointer
    const sectionFill = (argb: string): any => ({ type: 'pattern', pattern: 'solid', fgColor: { argb } });

    // Write each category block
    categories.forEach((block, idx) => {
      // Category header row (styled band)
      const catRow = ws.getRow(r);
      catRow.getCell(1).value = block.label || 'Category';
      for (let c = 1; c <= headers.length; c++) {
        const cell = catRow.getCell(c);
        cell.fill = sectionFill(idx % 2 === 0 ? 'FFF1F5F9' : 'FFF8FAFC');
        cell.font = { bold: true, color: { argb: 'FF0F172A' } };
        cell.border = { top: { style: 'thin', color: { argb: 'FFE2E8F0' } } };
      }
      r++;

      // Data rows
      block.rows.forEach(p => {
        const rowVals: (string|number)[] = [
          p.product,
          Math.round(this.getEffectiveMonthlySold(p)),
          Number(p.dailySold.toFixed(0)),
          Number(p.dailyBoxes.toFixed(0)),
          Number((p.boxesLeft || 0).toFixed(0)),
          Number((p.daysRemaining || 0).toFixed(0)),
        ];
        // Material used grams per product
        mats.forEach(m => {
          const md = p.materials?.[m];
          rowVals.push(md ? Number((md.used || 0).toFixed(0)) : 0);
        });
        ws.addRow(rowVals);
        r++;
      });

      // Spacer row between categories
      r++;
    });

    // Totals row for products (sums of monthly, daily, etc.)
    const totalsLabelRow = ws.getRow(r);
    totalsLabelRow.getCell(1).value = 'Total';
    totalsLabelRow.font = { bold: true };
    const startDataRow = 3; // first product data row after first category header
    const endDataRow = r - 2; // last data row before spacer
    if (endDataRow >= startDataRow) {
      // Sum fixed numeric columns B..F
      for (let col = 2; col <= 6; col++) {
        ws.getRow(r).getCell(col).value = { formula: `SUM(${ws.getColumn(col).letter}${startDataRow}:${ws.getColumn(col).letter}${endDataRow})` } as any;
      }
      // For materials, sum per material column across data rows
      mats.forEach((_, i) => {
        const col = 7 + i;
        ws.getRow(r).getCell(col).value = { formula: `SUM(${ws.getColumn(col).letter}${startDataRow}:${ws.getColumn(col).letter}${endDataRow})` } as any;
      });
    }
    ws.getRow(r).fill = sectionFill('FFFDE68A') as any; // yellow highlight
    r += 2;

    // Material summary table (Kg/day, Stock, Days left)
    const summaryTitles = ['Kg/day', 'Stock', 'Days left'];
    summaryTitles.forEach((title, i) => {
      const row = ws.getRow(r + i);
      row.getCell(6).value = title; // put title near right edge before materials
      row.getCell(6).font = { bold: true };
      mats.forEach((m, j) => {
        const t = this.getTotalMaterialData(m);
        let val = 0;
        if (title === 'Kg/day') val = Number((t.kgPerDay || 0).toFixed(2));
        if (title === 'Stock') val = Number((t.stock || 0).toFixed(0));
        if (title === 'Days left') val = Number((t.daysLeft || 0).toFixed(0));
        row.getCell(7 + j).value = val;
      });
    });

    // File name
    const tabName = this.activeTab === '__ALL__' ? 'All' : this.activeTab || 'Export';
    const date = new Date();
    const stamp = `${date.getFullYear()}-${(date.getMonth()+1).toString().padStart(2,'0')}-${date.getDate().toString().padStart(2,'0')}`;
    const fileName = `IMS-${tabName}-overview-${stamp}.xlsx`;

    wb.xlsx.writeBuffer().then((buffer: ArrayBuffer) => {
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      saveAs(blob, fileName);
    });
  }
}