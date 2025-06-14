import { CommonModule } from '@angular/common';
import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { AutoComplete } from 'primeng/autocomplete';
import { MultiSelectModule } from 'primeng/multiselect';
import {
  LifesmoothieModel,
  StorageItem,
  StorageService,
} from '../storagehouse/storage.service';
import { IngredientService, Smoothie } from './ingredient.service';
import { MessageService } from 'primeng/api';
import { Toast } from 'primeng/toast';
import { HttpClient } from '@angular/common/http';
import { SelectButtonModule } from 'primeng/selectbutton';
import { DatePickerModule } from 'primeng/datepicker';

interface Ingredient {
  name: string;
  qty: number;
}

interface Column {
  field: string;
  header: string;
  type: string;
  customExportHeader?: string;
}

interface ExportColumn {
  title: string;
  dataKey: string;
}

@Component({
  selector: 'app-mainhouse',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TableModule,
    ButtonModule,
    AutoComplete,
    Toast,
    MultiSelectModule,
    SelectButtonModule,
    DatePickerModule,
  ],
  templateUrl: './mainhouse.component.html',
  styleUrl: './mainhouse.component.css',
  providers: [StorageService, MessageService],
})
export class MainhouseComponent implements OnInit {
  // imageList: string[] = [
  //   '/assets/Energy-Booster.jpg',
  //   '/assets/Pink-Dragon.jpg',
  //   '/assets/Raspberry-Love.jpg',
  //   '/assets/Strawberry-Split.jpg',
  // ];
  // currentImage: string = this.imageList[0];
  // private imageIndex: number = 0;
  // private intervalId: any;

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
  commonRack: string = '';

  cols!: Column[];
  selectedColumns!: Column[];
  globalFilterFields!: string[];
  searchQuery: string = '';

  // selectedoption: boolean = true;
  periodOptions = [
    { label: 'Date Range', value: 'date' },
    { label: 'Weekly', value: 'week' },
    { label: 'Monthly', value: 'month' },
    { label: 'Yearly', value: 'year' },
  ];
  showDate = true;
  selectedPeriod: string = 'date';
  selectedDate: Date = new Date(); // for week/month/year
  fromDateModel: Date = new Date(); // for date range
  toDateModel: Date = new Date(); // for date range
  rangeDates: Date[] = [new Date(), new Date()]; // optional initial values

  fromDate!: string;
  toDate!: string;

  exportColumns!: ExportColumn[];

  constructor(
    private lifesmoothieService: StorageService,
    private ingredientService: IngredientService,
    private messageService: MessageService,
    private http: HttpClient
  ) {}

  ngOnInit(): void {
    // this.intervalId = setInterval(() => {
    //   this.imageIndex = (this.imageIndex + 1) % this.imageList.length;
    //   this.currentImage = this.imageList[this.imageIndex];
    // }, 30000);

    this.setView(this.selectedPeriod);
    this.getLifeSmoothieByDate();

    // this.lifesmoothieService.getLifeSmoothie().subscribe((data) => {
    //   this.lifeSmoothieList = data;
    //   console.log('Life Smoothie List:', this.lifeSmoothieList);
    // });

    // this.ingredientService.getSmoothies().subscribe((data) => {
    //   this.smoothies = data;
    //   console.log('Smoothies:', this.smoothies);
    // });

    this.cols = [
      { field: 'live_date', header: 'Live Date', type: 'shortDate' },
      { field: 'item_name', header: 'Item Name', type: 'text' },
      { field: 'description', header: 'Description', type: 'text' },
      { field: 'lot_no', header: 'Lot No', type: 'text' },
      { field: 'location', header: 'Location', type: 'text' },
      { field: 'production_date', header: 'Production Date', type: 'date' },
      { field: 'expiry_date', header: 'Expiry Date', type: 'date' },
      { field: 'qty_cotton', header: 'Qty Cotton', type: 'text' },
      { field: 'qty_kg', header: 'Qty Kg', type: 'text' },
      { field: 'qty_g', header: 'Qty g', type: 'text' },
      { field: 'supplier', header: 'Supplier', type: 'text' },
      { field: 'truck_no', header: 'Truck No', type: 'text' },
    ];

    this.selectedColumns = this.cols;
    this.globalFilterFields = this.cols.map((col) => col.field);
    this.exportColumns = this.cols.map((col) => ({
      title: col.header,
      dataKey: col.field,
    }));
  }

  formatDateTime(date: Date): string {
    return date.toISOString().slice(0, 19); // 'YYYY-MM-DDTHH:mm:ss'
  }

  onSearch(query: string, dt: any): void {
    this.searchQuery = query;
    dt.filterGlobal(query, 'contains');
  }

  setView(view: string) {
    this.selectedPeriod = view;

    if (view === 'date') {
      // if (this.fromDateModel && this.toDateModel) {
      //   this.fromDate = this.formatDateTime(
      //     new Date(this.fromDateModel.setHours(0, 0, 0))
      //   );
      //   this.toDate = this.formatDateTime(
      //     new Date(this.toDateModel.setHours(23, 59, 59))
      //   );
      // }
      if (this.rangeDates && this.rangeDates.length === 2) {
        const start = this.rangeDates[0];
        const end = this.rangeDates[1];

        this.fromDate = this.formatDateTime(new Date(start.setHours(0, 0, 0)));
        this.toDate = this.formatDateTime(new Date(end.setHours(23, 59, 59)));

        this.getLifeSmoothieByDate();
      }
    } else if (view === 'week') {
      if (this.selectedDate) {
        const startOfWeek = new Date(this.selectedDate);
        startOfWeek.setHours(0, 0, 0, 0);

        const weekEndDate = this.getWeekEndDate(startOfWeek);

        this.fromDate = this.formatDateTime(startOfWeek);
        this.toDate = this.formatDateTime(weekEndDate);

        this.getLifeSmoothieByDate();
      } else {
        console.warn('No week selected');
      }
    } else if (view === 'month') {
      const d = new Date(this.selectedDate);
      const firstDay = new Date(d.getFullYear(), d.getMonth(), 1);
      const lastDay = new Date(d.getFullYear(), d.getMonth() + 1, 0);

      this.fromDate = this.formatDateTime(new Date(firstDay.setHours(0, 0, 0)));
      this.toDate = this.formatDateTime(new Date(lastDay.setHours(23, 59, 59)));
    } else if (view === 'year') {
      const d = new Date(this.selectedDate);
      const firstDay = new Date(d.getFullYear(), 0, 1);
      const lastDay = new Date(d.getFullYear(), 11, 31);

      this.fromDate = this.formatDateTime(new Date(firstDay.setHours(0, 0, 0)));
      this.toDate = this.formatDateTime(new Date(lastDay.setHours(23, 59, 59)));
    }

    this.getLifeSmoothieByDate();
  }

  getLifeSmoothieByDate() {
    if (!this.fromDate || !this.toDate) {
      console.warn('fromDate or toDate is missing');
    }

    this.lifesmoothieService
      .getLifeSmoothieDate(this.fromDate, this.toDate)
      .subscribe(
        (data) => {
          console.log('Filtered data by date:', data);
          this.lifeSmoothieList = data;
        },
        (error) => {
          console.error('Error fetching data by date:', error);
        }
      );
  }

  getWeekEndDate(startDate: Date): Date {
    let endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + 6); // Add 6 days to get the week end
    endDate.setHours(23, 59, 59, 999);
    return endDate;
  }

  highlightSearchText(value: any): string {
    if (!this.searchQuery) return value;

    const stringValue =
      value !== null && value !== undefined ? String(value) : '';
    const escapedSearchQuery = this.searchQuery.replace(
      /[-\/\\^$*+?.()|[\]{}]/g,
      '\\$&'
    );
    const regex = new RegExp(`(${escapedSearchQuery})`, 'gi');
    return stringValue.replace(regex, '<span class="highlight">$1</span>');
  }

  rowMatchesSearch(rowData: any, columns: any[]): boolean {
    if (!this.searchQuery) return false;

    const search = this.searchQuery.toLowerCase();

    return columns.some((col) => {
      const value = rowData[col.field];
      return (
        value !== null &&
        value !== undefined &&
        String(value).toLowerCase().includes(search)
      );
    });
  }

  // ngOnDestroy(): void {
  //   if (this.intervalId) {
  //     clearInterval(this.intervalId);
  //   }
  // }

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
          this.ingredientDetails = data;
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

  saveSmoothieProduction() {
    if (!this.commonQty || !this.commonRack) {
      alert('Please enter both common quantity and rack.');
      return;
    }

    const selectedItems = this.ingredientDetails.filter((d) => d.selected);

    if (selectedItems.length === 0) {
      alert('Please select at least one ingredient');
      return;
    }

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

        const actualQty = smoothieIngredient.qty;

        return {
          name: selected.item_name,
          qty: actualQty,
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

    const payload = {
      smoothie_name: this.selectedSmoothie.itemname,
      ingredients: ingredients.map((i: any) => ({ name: i.name, qty: i.qty })),
      rack: this.commonRack,
      entered_qty: this.commonQty,
      life_ids: ingredients.map((i: any) => ({ id: i.life_id, qty: i.qty })),
      singleSmoothieQty_g,
      totalQtyUsed_g,
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
          this.ingredientDetails.forEach((d) => {
            d.selected = false;
          });
        },
        error: (err) => console.error('Error saving smoothie usage', err),
      });
  }
}
