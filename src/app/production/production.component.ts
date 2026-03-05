import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { IngredientService, Smoothie } from '../mainhouse/ingredient.service';
import {
  LifesmoothieModel,
  StorageService,
} from '../storagehouse/storage.service';
import { MessageService } from 'primeng/api';
import { AutoComplete } from 'primeng/autocomplete';
import { HttpClient } from '@angular/common/http';
import { Toast } from 'primeng/toast';
import { SelectButtonModule } from 'primeng/selectbutton';
import { DatePickerModule } from 'primeng/datepicker';
import { SessionService } from '../users/session-service/session.service';

interface Ingredient {
  name: string;
  qty: number;
}

@Component({
  selector: 'app-production',
  standalone: true,
  imports: [FormsModule, CommonModule, AutoComplete, SelectButtonModule, Toast, DatePickerModule],
  templateUrl: './production.component.html',
  styleUrl: './production.component.css',
  providers: [MessageService, StorageService],
})
export class ProductionComponent implements OnInit {
  lifeSmoothieList: LifesmoothieModel[] = [];

  smoothieName: string = '';
  itemdesc: string = '';
  smoothies: Smoothie[] = [];
  categories: string[] = [];
  selectedCategory: string = '';
  categoryOptions: { label: string; value: string }[] = [];
  // Category input and suggestions
  category: string = '';
  filteredCategories: string[] = [];
  private availableCategories: string[] = [];

  activeTab = 'choose';
  filteredItemNames: any[] = [];

  newItem: Ingredient = { name: '', qty: null as any };
  ingredients: Ingredient[] = [];

  selectedSmoothie: any = null;
  ingredientDetails: any[] = [];

  commonQty: number = null as any;
  commonWastage: number = null as any;
  curtainValue: number = null as any;
  commonRack: string = '';
  productionMode: 'sachets' | 'raw' = 'sachets';
  productionDate: Date | null = null;
  expiryDate: Date | null = null;

  calculateMessage!: number;

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

  constructor(
    private sessionService: SessionService,
    private lifesmoothieService: StorageService,
    private ingredientService: IngredientService,
    private messageService: MessageService,
    private http: HttpClient
  ) {}

  private formatDateLocal(date: Date): string {
    const pad = (n: number) => String(n).padStart(2, '0');
    const y = date.getFullYear();
    const m = pad(date.getMonth() + 1);
    const d = pad(date.getDate());
    return `${y}-${m}-${d}`; // YYYY-MM-DD
  }

  // Computed UI states
  get isAddIngredientDisabled(): boolean {
    const nameValid = !!this.newItem && !!this.newItem.name && String(this.newItem.name).trim().length > 0;
    const qtyNum = Number(this.newItem && this.newItem.qty);
    return !(nameValid && isFinite(qtyNum) && qtyNum > 0);
  }

  smoothiesByCategory(cat: string): Smoothie[] {
    const c = String(cat || '').toLowerCase();
    return this.smoothies.filter((s) => String(s.category || 'Others').toLowerCase() === c);
  }

  get displayedSmoothies(): Smoothie[] {
    if (!this.selectedCategory) return this.smoothies;
    return this.smoothiesByCategory(this.selectedCategory);
  }

  filterCategories(event: any) {
    const query = String(event.query || '').toLowerCase();
    this.filteredCategories = this.availableCategories.filter((c) => c.toLowerCase().includes(query));
  }

  get isAddSmoothieDisabled(): boolean {
    const hasName = !!this.smoothieName && String(this.smoothieName).trim().length > 0;
    const hasIngredients = Array.isArray(this.ingredients) && this.ingredients.length > 0;
    return !(hasName && hasIngredients);
  }

  get isSaveSmoothieProductionDisabled(): boolean {
    return !this.selectedSmoothie || !isFinite(Number(this.commonQty)) || Number(this.commonQty) <= 0 || !this.commonRack || String(this.commonRack).trim() === '' || !isFinite(Number(this.commonWastage)) || Number(this.commonWastage) < 0;
  }

  get isCalculateSmoothieProductionDisabled(): boolean {
    return !this.selectedSmoothie || !Array.isArray(this.selectedSmoothie.ingredients) || this.selectedSmoothie.ingredients.length === 0 || !Array.isArray(this.ingredientDetails) || this.ingredientDetails.length === 0;
  }

  ngOnInit(): void {
    this.getSmoothiess();
  }
  getSmoothiess(){
    this.lifesmoothieService.getLifeSmoothie().subscribe((data) => {
      this.lifeSmoothieList = data;
      console.log('Life Smoothie List:', this.lifeSmoothieList);
    });
  
    this.ingredientService.getSmoothies().subscribe((data) => {
      this.smoothies = data;
      console.log('Smoothies:', this.smoothies);
      // derive category suggestions from smoothie names
      const set = new Set<string>();
      this.smoothies.forEach((s) => {
        const name = s.category || '';
        let cat = name.split(/[-:]/)[0]?.trim() || '';
        if (!cat) cat = name.split(/\s+/)[0] || '';
        if (cat) set.add(cat);
      });
      this.availableCategories = Array.from(set).sort();
      // categories for grouping
      const catSet = new Set<string>();
      this.smoothies.forEach((s) => catSet.add(s.category || 'Others'));
      this.categories = Array.from(catSet).sort();
      this.categoryOptions = this.categories.map((c) => ({ label: c, value: c }));
      // Default to first category if available
      if (!this.selectedCategory && this.categories.length > 0) {
        this.selectedCategory = this.categories[0];
      }
    });

  }

  filterItemNames(event: any) {
    const query = event.query.toLowerCase();
    this.filteredItemNames = this.lifeSmoothieList
      .map((item) => item.item_name)
      .filter((name) => name?.toLowerCase().includes(query));
  }

  addIngredient() {
    if (
      this.newItem.name &&
      this.newItem.qty !== null &&
      this.newItem.qty > 0
    ) {
      this.ingredients.push({ name: this.newItem.name, qty: this.newItem.qty });
      this.newItem = { name: '', qty: null as any };
    } else {
      this.messageService.add({
        severity: 'warn',
        summary: 'Invalid Ingredient',
        detail: 'Please select an item and enter a quantity greater than 0.',
      });
    }
  }

  saveSmoothie() {
    console.log('saveSmoothie() entered', this.smoothieName);

    if (!this.smoothieName || this.ingredients.length === 0) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Validation Error',
        detail: 'Please enter a smoothie name and at least one ingredient.',
      });
      return;
    }

    const smoothieData: any = {
      itemname: this.smoothieName,
      ingredients: this.ingredients,
      category: this.category || null,
      itemdesc: this.itemdesc || null,
    };

    this.ingredientService.saveSmoothie(smoothieData).subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: 'Success',
          detail: 'Smoothie saved successfully!',
        });
        this.resetForm();
        this.getSmoothiess()
      },
      error: (err) => {
        console.error('Failed to save smoothie:', err);
        this.messageService.add({
          severity: 'error',
          summary: 'Save Failed',
          detail: 'Error saving smoothie. Please check console for details.',
        });
      },
    });
    
  }

  resetForm() {
    this.newItem = { name: '', qty: null as any };
    this.ingredients = [];
    this.smoothieName = '';
    this.itemdesc = '';
  }

  selectSmoothie(smoothie: any) {
    this.selectedSmoothie = smoothie;
    const ingredientNames = smoothie.ingredients.map((ing: any) => ing.name);

    this.http
      .post<any[]>('http://localhost:8080/api/index.php?action=getIngredientsByNames', {
        names: ingredientNames,
      })
      .subscribe({
        next: (data) => {
          this.ingredientDetails = data.map((d) => {
            const matchingSmoothieIng = smoothie.ingredients.find(
              (i: any) => i.name === d.item_name
            );

            return {
              ...d,
              original_qty: matchingSmoothieIng
                ? matchingSmoothieIng.qty
                : null,
              qty: matchingSmoothieIng ? matchingSmoothieIng.qty : null,
            };
          });

          console.log(
            'getIngredientsByNames response:',
            this.ingredientDetails
          );
        },
        error: (err) => {
          console.error('Failed to fetch ingredient details', err);
        },
      });
  }

  // hasSelectedIngredients(): boolean {
  //   return this.ingredientDetails.some((detail) => detail.selected);
  // }

  get selectedIngredients() {
    return this.ingredientDetails.filter((d) => d.selected);
  }

  updateIngredientQty(updatedIngredient: any) {
    // Find the corresponding ingredient in the selected smoothie to update the qty
    const ingredient = this.selectedSmoothie.ingredients.find(
      (ing: any) => ing.name === updatedIngredient.item_name
    );

    if (ingredient) {
      // Update the quantity for that ingredient
      ingredient.qty = updatedIngredient.qty || ingredient.qty;
    }
  }

  calculateSmoothieProductionFromRawStock() {
    if (!this.selectedSmoothie || !Array.isArray(this.selectedSmoothie.ingredients) || this.selectedSmoothie.ingredients.length === 0) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Missing Data',
        detail: 'Please select a smoothie with ingredients before calculating.',
      });
      return;
    }

    interface IngredientQty {
      name: string;
      requiredQty: number;
    }

    interface SelectedIngredient {
      name: string;
      availableQty: number;
    }

    // Get all required ingredients that are in the smoothie recipe
    const requiredIngredients: IngredientQty[] = this.selectedSmoothie.ingredients.map((ing: any) => ({
      name: ing.name,
      requiredQty: Number(ing.qty)
    }));

    console.log('Required Ingredients:', requiredIngredients);

    // Get selected ingredients with their available quantities
    const selectedIngredients: SelectedIngredient[] = this.ingredientDetails
      .filter((detail: any) => detail.selected)
      .map((detail: any) => {
        const qty = Number(detail.qty_g);
        if (qty <= 0) {
          this.messageService.add({
            severity: 'warn',
            summary: 'Invalid Quantity',
            detail: `${detail.item_name} has an invalid quantity (${qty}g). Quantity must be greater than 0.`,
          });
        }
        return {
          name: detail.item_name,
          availableQty: qty
        };
      });

    console.log('Selected Ingredients:', selectedIngredients);  
    // Check if any selected ingredients have invalid quantities
    if (selectedIngredients.some(ing => ing.availableQty <= 0)) {
      return; // Stop calculation if any selected ingredient has invalid quantity
    }

    // Check if all required ingredients are selected
    const missingIngredients = requiredIngredients.filter((reqIng: IngredientQty) => 
      !selectedIngredients.some((selIng: SelectedIngredient) => selIng.name === reqIng.name)
    );

    if (missingIngredients.length > 0) {
      const missingNames = missingIngredients.map((ing: IngredientQty) => ing.name).join(', ');
      this.messageService.add({
        severity: 'warn',
        summary: 'Missing Ingredients',
        detail: `Please select all required ingredients: ${missingNames}`,
      });
      return;
    }

    // Calculate how many smoothies can be made based on each ingredient
    const smoothieCounts = requiredIngredients.map((reqIng: IngredientQty) => {
      const selectedIng = selectedIngredients.find((selIng: SelectedIngredient) => selIng.name === reqIng.name);
      if (!selectedIng) return 0;
      
      // Calculate how many smoothies can be made with this ingredient
      return Math.floor(selectedIng.availableQty / reqIng.requiredQty);
    });

    console.log("smoothieCounts", smoothieCounts);

    const minCount = Math.min(...smoothieCounts);
    if (!isFinite(minCount)) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Cannot Calculate',
        detail: 'Some ingredients are missing required quantities. Please review inputs.',
      });
      return;
    }

    this.calculateMessage = minCount;
    this.messageService.add({
      severity: 'success',
      summary: 'Calculation Complete',
      detail: `You can produce ${this.calculateMessage} smoothies with the current stock.`,
    });
  }

  saveSmoothieProduction() {
    // Basic field validations
    if (!this.selectedSmoothie) {
      this.messageService.add({
        severity: 'warn',
        summary: 'No Smoothie Selected',
        detail: 'Select a smoothie before saving production.',
      });
      return;
    }

    if (!isFinite(Number(this.commonQty)) || Number(this.commonQty) <= 0) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Invalid Quantity',
        detail: 'Enter a valid number of sachets greater than 0.',
      });
      return;
    }

    if (!this.commonRack || String(this.commonRack).trim() === '') {
      this.messageService.add({
        severity: 'warn',
        summary: 'Rack Required',
        detail: 'Please provide a rack location.',
      });
      return;
    }

    if (!isFinite(Number(this.commonWastage)) || Number(this.commonWastage) < 0) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Invalid Wastage',
        detail: 'Wastage must be 0 or a positive number.',
      });
      return;
    }

    const selectedItems = this.ingredientDetails.filter((d) => d.selected);

    if (selectedItems.length === 0) {
      this.messageService.add({
        severity: 'warn',
        summary: 'No Ingredients Selected',
        detail: 'Select at least one ingredient to produce.',
      });
      return;
    }

    // Update ingredient quantities from the selected items
    const ingredients = selectedItems
      .map((selected) => {
        const smoothieIngredient = this.selectedSmoothie.ingredients.find(
          (i: any) => i.name === selected.item_name
        );

        if (!smoothieIngredient) {
          console.warn(
            `Ingredient ${selected.item_name} not found in smoothie`
          );
          return null;
        }

        // Here you update the qty of the selected ingredient from the ingredientDetails
        smoothieIngredient.qty = selected.qty; // Update the qty in selectedSmoothie.ingredients

        // Validate each selected ingredient qty
        const qtyNum = Number(selected.qty);
        if (!isFinite(qtyNum) || qtyNum <= 0) {
          this.messageService.add({
            severity: 'warn',
            summary: 'Invalid Ingredient Quantity',
            detail: `Please enter a positive quantity for ${selected.item_name}.`,
          });
          return null;
        }

        return {
          name: selected.item_name,
          qty: selected.qty, // Use the updated quantity here
          life_id: selected.id,
        };
      })
      .filter(Boolean);

    if (!ingredients || ingredients.length === 0) {
      // Either none were selected or validation removed them
      return;
    }

    const singleSmoothieQty_g = ingredients.reduce(
      (sum: number, ing: any) => sum + ing.qty,
      0
    );

    const totalQtyUsed_g = singleSmoothieQty_g * this.commonQty;

    const sliceQty = totalQtyUsed_g / singleSmoothieQty_g;

    // const divisor = this.productionMode === 'raw' ? 10 : 15;
    const cottonQty = Math.ceil(sliceQty / this.curtainValue);

    const totalQtyWithWastage_g = totalQtyUsed_g + this.commonWastage;

    const payload = {
      smoothie_name: this.selectedSmoothie.itemname,
      ingredients: ingredients.map((i: any) => ({ name: i.name, qty: i.qty })),
      rack: (this.commonRack && String(this.commonRack).trim() !== '') ? String(this.commonRack).trim() : null,
      wastage: this.commonWastage,
      entered_qty: this.commonQty, // ✅ Added here
      life_ids: ingredients.map((i: any) => ({ id: i.life_id, qty: i.qty })),
      category: this.selectedSmoothie?.category || null,
      itemdesc: (this.selectedSmoothie && this.selectedSmoothie.itemdesc) ? this.selectedSmoothie.itemdesc : (this.itemdesc || null),
      singleSmoothieQty_g,
      totalQtyUsed_g,
      totalQtyWithWastage_g,
      sliceQty,
      cottonQty,
      cartonvalue: this.curtainValue,
      production_date: this.productionDate ? this.formatDateLocal(this.productionDate) : null,
      expiry_date: this.expiryDate ? this.formatDateLocal(this.expiryDate) : null,
    };

    this.http
      .post('http://localhost:8080/api/index.php?action=saveSmoothieProduction', payload)
      .subscribe({
        next: () => {
          this.messageService.add({
            severity: 'success',
            summary: 'Saved',
            detail: 'Production saved successfully.',
          });
          this.commonQty = 0;
          this.commonRack = '';
          this.commonWastage = 0;
          this.productionDate = null;
          this.expiryDate = null;
          this.ingredientDetails.forEach((d) => {
            d.selected = false;
          });
        },
        error: (err) => {
          console.error('Error saving smoothie usage', err);
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Failed to save production. Please try again.',
          });
        },
      });
  }
}
