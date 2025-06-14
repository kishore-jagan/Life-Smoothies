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
import { Toast } from 'ngx-toastr';
import { SelectButtonModule } from 'primeng/selectbutton';

interface Ingredient {
  name: string;
  qty: number;
}

@Component({
  selector: 'app-production',
  imports: [FormsModule, CommonModule, AutoComplete, SelectButtonModule, Toast],
  templateUrl: './production.component.html',
  styleUrl: './production.component.css',
  providers: [MessageService, StorageService],
})
export class ProductionComponent implements OnInit {
  lifeSmoothieList: LifesmoothieModel[] = [];

  smoothieName: string = '';
  smoothies: Smoothie[] = [];

  activeTab = 'choose';
  filteredItemNames: any[] = [];

  newItem: Ingredient = { name: '', qty: null as any };
  ingredients: Ingredient[] = [];

  selectedSmoothie: any = null;
  ingredientDetails: any[] = [];

  commonQty: number = 0;
  commonWastage: number = 0;
  commonRack: string = '';

  calculateMessage!: number;

  constructor(
    private lifesmoothieService: StorageService,
    private ingredientService: IngredientService,
    private messageService: MessageService,
    private http: HttpClient
  ) {}

  ngOnInit(): void {
    this.lifesmoothieService.getLifeSmoothie().subscribe((data) => {
      this.lifeSmoothieList = data;
      console.log('Life Smoothie List:', this.lifeSmoothieList);
    });

    this.ingredientService.getSmoothies().subscribe((data) => {
      this.smoothies = data;
      console.log('Smoothies:', this.smoothies);
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

    const smoothieData = {
      itemname: this.smoothieName,
      ingredients: this.ingredients,
    };

    this.ingredientService.saveSmoothie(smoothieData).subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: 'Success',
          detail: 'Smoothie saved successfully!',
        });
        this.resetForm();
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
  }

  selectSmoothie(smoothie: any) {
    this.selectedSmoothie = smoothie;
    const ingredientNames = smoothie.ingredients.map((ing: any) => ing.name);

    this.http
      .post<any[]>('http://localhost:3000/api/getIngredientsByNames', {
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
    if (!this.selectedSmoothie || !this.selectedSmoothie.ingredients) {
      alert('No smoothie selected or ingredients missing.');
      return;
    }

    const smoothieCounts = this.ingredientDetails.map((rawItem: any) => {
      const matchingSmoothieIng = this.selectedSmoothie.ingredients.find(
        (i: any) => i.name === rawItem.item_name
      );

      if (!matchingSmoothieIng) {
        console.warn(
          `Ingredient ${rawItem.item_name} not in selected smoothie`
        );
        return Infinity;
      }

      const requiredQty = parseFloat(matchingSmoothieIng.qty); // grams per smoothie
      const availableQty = parseFloat(rawItem.qty_g); // grams in stock

      if (!requiredQty || !availableQty) return Infinity;

      return Math.floor(availableQty / requiredQty);
    });

    this.calculateMessage = Math.min(...smoothieCounts);
    alert(
      `You can produce ${this.calculateMessage} smoothies with the current stock.`
    );
  }

  saveSmoothieProduction() {
    if (!this.commonQty || !this.commonRack || !this.commonWastage) {
      alert('Please enter quantity, Wastage and rack.');
      return;
    }

    const selectedItems = this.ingredientDetails.filter((d) => d.selected);

    if (selectedItems.length === 0) {
      alert('Please select at least one ingredient');
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

        return {
          name: selected.item_name,
          qty: selected.qty, // Use the updated quantity here
          life_id: selected.id,
        };
      })
      .filter(Boolean);

    const singleSmoothieQty_g = ingredients.reduce(
      (sum: number, ing: any) => sum + ing.qty,
      0
    );

    const totalQtyUsed_g = singleSmoothieQty_g * this.commonQty;

    const sliceQty = totalQtyUsed_g / singleSmoothieQty_g;

    const cottonQty = sliceQty / 15;

    const totalQtyWithWastage_g = totalQtyUsed_g + this.commonWastage;

    const payload = {
      smoothie_name: this.selectedSmoothie.itemname,
      ingredients: ingredients.map((i: any) => ({ name: i.name, qty: i.qty })),
      rack: this.commonRack,
      wastage: this.commonWastage,
      entered_qty: this.commonQty, // ✅ Added here
      life_ids: ingredients.map((i: any) => ({ id: i.life_id, qty: i.qty })),
      singleSmoothieQty_g,
      totalQtyUsed_g,
      totalQtyWithWastage_g,
      sliceQty,
      cottonQty,
    };

    this.http
      .post('http://localhost:3000/api/saveSmoothieProduction', payload)
      .subscribe({
        next: () => {
          alert('Saved successfully!');
          this.commonQty = 0;
          this.commonRack = '';
          this.commonWastage = 0;
          this.ingredientDetails.forEach((d) => {
            d.selected = false;
          });
        },
        error: (err) => console.error('Error saving smoothie usage', err),
      });
  }
}
