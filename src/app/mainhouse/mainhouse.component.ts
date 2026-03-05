import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { MultiSelectModule } from 'primeng/multiselect';
import { LifesmoothieModel, StorageService } from '../storagehouse/storage.service';
import { Smoothie } from './ingredient.service';
import { SelectButtonModule } from 'primeng/selectbutton';
import { DatePickerModule } from 'primeng/datepicker';
import { SessionService } from '../users/session-service/session.service';

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
    MultiSelectModule,
    SelectButtonModule,
    DatePickerModule,
  ],
  templateUrl: './mainhouse.component.html',
  styleUrl: './mainhouse.component.css',
  providers: [StorageService],
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
  selectedPeriod: string = 'month';
  selectedDate: Date = new Date(); // for week/month/year
  fromDateModel: Date = new Date(); // for date range
  toDateModel: Date = new Date(); // for date range
  rangeDates: Date[] = [new Date(), new Date()]; // optional initial values

  fromDate!: string;
  toDate!: string;

  exportColumns!: ExportColumn[];

  // Computed export filename (PrimeNG will append .csv)
  get csvFileName(): string {
    const now = new Date();
    const day = now.getDate();
    const monthNames = [
      'Jan',
      'Feb',
      'Mar',
      'Apr',
      'May',
      'Jun',
      'Jul',
      'Aug',
      'Sep',
      'Oct',
      'Nov',
      'Dec',
    ];
    const month = monthNames[now.getMonth()];
    const year = now.getFullYear();
    return `Life Smoothie_${day} ${month} ${year}`;
  }

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
  ) {}

  // ---- Overview metrics (computed from current filtered list) ----
  get totalItems(): number {
    return Array.isArray(this.lifeSmoothieList) ? this.lifeSmoothieList.length : 0;
  }

  get totalQtyCotton(): number {
    if (!Array.isArray(this.lifeSmoothieList)) return 0;
    return this.lifeSmoothieList.reduce((sum, item: any) => {
      const qty = Number(item?.qty_cotton) || 0;
      return sum + qty;
    }, 0);
  }

  get lowStockCount(): number {
    if (!Array.isArray(this.lifeSmoothieList)) return 0;
    return this.lifeSmoothieList.filter((item: any) => {
      const qty = Number(item?.qty_cotton) || 0;
      return qty > 0 && qty < 5;
    }).length;
  }

  get outOfStockCount(): number {
    if (!Array.isArray(this.lifeSmoothieList)) return 0;
    return this.lifeSmoothieList.filter((item: any) => {
      const qty = Number(item?.qty_cotton) || 0;
      return qty === 0;
    }).length;
  }

  // Maintain original order but push out-of-stock (qty_cotton == 0) items to the end
  get sortedLifeSmoothieList(): LifesmoothieModel[] {
    if (!Array.isArray(this.lifeSmoothieList)) return [] as LifesmoothieModel[];
    return [...this.lifeSmoothieList].sort((a: any, b: any) => {
      const aZero = (Number(a?.qty_cotton) || 0) === 0 ? 1 : 0;
      const bZero = (Number(b?.qty_cotton) || 0) === 0 ? 1 : 0;
      if (aZero > bZero) return 1;
      if (aZero < bZero) return -1;
      return 0;
    });
  }

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
      { field: 'qty_cotton', header: 'Qty Carton', type: 'text' },
      { field: 'qty_kg', header: 'Qty Kg', type: 'text' },
      // { field: 'qty_g', header: 'Qty g', type: 'text' },
      // { field: 'supplier', header: 'Supplier', type: 'text' },
      // { field: 'truck_no', header: 'Truck No', type: 'text' },
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
}
