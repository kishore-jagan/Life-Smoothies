import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { MultiSelectModule } from 'primeng/multiselect';
import { MessageService } from 'primeng/api';
import { Toast } from 'primeng/toast';
import { SelectButtonModule } from 'primeng/selectbutton';
import { DatePickerModule } from 'primeng/datepicker';
import { AutoComplete } from 'primeng/autocomplete';
import * as XLSX from 'xlsx';
import {
  Driver,
  Ingredient,
  ProductionService,
  SmoothieProduction,
} from '../production/production.service';
import { DispatchService, preDispatchRecord } from './dispatch.service';
import { SessionService } from '../users/session-service/session.service';

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

// interface ProductData {
//   name: string;
//   monthlySold: number;
//   dailySold: number;
//   dailyBoxes: number;
//   boxesLeft: number;
//   daysRemaining: number | string;
// }

// interface IngredientData {
//   name: string;
//   color: string;
//   kgPerDay: number;
//   stock: number;
//   daysLeft: number | string;
// }


@Component({
  selector: 'app-dispatch',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TableModule,
    ButtonModule,
    Toast,
    MultiSelectModule,
    SelectButtonModule,
    DatePickerModule,
    AutoComplete,
  ],
  templateUrl: './dispatch.component.html',
  styleUrl: './dispatch.component.css',
  providers: [MessageService, ProductionService],
})
export class DispatchComponent implements OnInit {
  loading: boolean = false;
  // showForm = false;

  newDispatch = {
    qtycotton: null,
    driverName: '',
    location: '',
  };

  SmoothieProduction: SmoothieProduction[] = [];

  driverName: string = '';
  driversList: Driver[] = [];
  filteredDriverNames: any[] = [];

  dispatchList: any[] = [];
  preDispatchRecords: preDispatchRecord[] = [];
  filteredPreDispatchRecords: preDispatchRecord[] = [];
  completedDispatches: any[] = [];
  filteredCompletedDispatches: any[] = [];

  // Samples (completed sample dispatches)
  samplesDispatches: any[] = [];
  filteredSamplesDispatches: any[] = [];

  cols!: Column[];
  selectedColumns!: Column[];
  globalFilterFields!: string[];
  searchQuery: string = '';

  // Completed table configs
  completedCols!: Column[];
  selectedCompletedCols!: Column[];
  globalCompletedFilterFields!: string[];
  // Samples table columns
  samplesCols!: Column[];
  selectedSamplesCols!: Column[];
  globalSamplesFilterFields!: string[];
  samplesSelectedPeriod: string = 'year';
  samplesSelectedDate: Date = new Date();
  samplesRangeDates: Date[] = [new Date(), new Date()];
  samplesFromDate!: string;
  samplesToDate!: string;

  // Completed table date filter state
  completedSelectedPeriod: string = 'year';
  completedSelectedDate: Date = new Date();
  completedRangeDates: Date[] = [new Date(), new Date()];
  completedFromDate!: string;
  completedToDate!: string;

  periodOptions = [
    { label: 'Date Range', value: 'date' },
    { label: 'Weekly', value: 'week' },
    { label: 'Monthly', value: 'month' },
    { label: 'Yearly', value: 'year' },
  ];
  // showDate = true;
  selectedPeriod: string = 'month';
  selectedDate: Date = new Date(); // for week/month/year
  fromDateModel: Date = new Date(); // for date range
  toDateModel: Date = new Date(); // for date range
  rangeDates: Date[] = [new Date(), new Date()]; // optional initial values

  fromDate!: string;
  toDate!: string;

  exportColumns!: ExportColumn[];

  return: number = 0;

  // ---- Overview metrics ----
  get totalSmoothieItems(): number {
    return Array.isArray(this.SmoothieProduction) ? this.SmoothieProduction.length : 0;
  }

  get totalPreDispatchItems(): number {
    return Array.isArray(this.filteredPreDispatchRecords) ? this.filteredPreDispatchRecords.length : 0;
  }

  get totalCompletedItems(): number {
    const list = Array.isArray(this.filteredCompletedDispatches) ? this.filteredCompletedDispatches : [];
    return list.filter((d: any) => String(d?.status ?? '').toLowerCase() === 'completed').length;
  }

  get totalSampleItems(): number {
    return Array.isArray(this.filteredSamplesDispatches) ? this.filteredSamplesDispatches.length : 0;
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
    private messageService: MessageService,
    private productionService: ProductionService,
    private dispatchService: DispatchService
  ) {}

  ngOnInit(): void {
    this.loading = true;
    this.productionService.getDrivers().subscribe(
      (data) => {
        this.driversList = data;
        console.log('driversList:', this.driversList);

        this.loading = false; // Stop loading after API
      },
      (error) => {
        console.error(error);
        this.loading = false; // Also stop on error
      }
    );

    this.getPreDispatches();
    this.getCompletedDispatches();

    this.setView(this.selectedPeriod);
    // this.getSmoothieProduction();

    this.cols = [
      { field: 'category', header: 'Category', type: 'text' },
      { field: 'smoothie_name', header: 'Smoothie Name', type: 'text' },
      { field: 'rack', header: 'Rack', type: 'text' },
      { field: 'total_qty_g', header: 'Total Quantity Used (g)', type: 'text' },
      { field: 'slices', header: 'Sachets/Kg', type: 'text' },
      { field: 'cotton', header: 'Carton', type: 'text' },
      { field: 'wastage', header: 'Wastage', type: 'text' },
      // { field: 'ingredients', header: 'Ingredients', type: 'array' },
    ];

    this.selectedColumns = this.cols;
    this.globalFilterFields = this.cols.map((col) => col.field);
    this.exportColumns = this.cols.map((col) => ({
      title: col.header,
      dataKey: col.field,
    }));

    // Completed dispatches table columns
    this.completedCols = [
      // { field: 'id', header: 'ID', type: 'text' },
      { field: 'driver_name', header: 'Driver', type: 'text' },
      { field: 'truck_no', header: 'Truck No', type: 'text' },
      { field: 'creation_date', header: 'Date', type: 'shortDate' },
      // Items will be shown in a fixed last column
    ];
    this.selectedCompletedCols = this.completedCols;
    this.globalCompletedFilterFields = this.completedCols.map((c) => c.field);

    // Samples table columns
    this.samplesCols = [
      // { field: 'id', header: 'ID', type: 'text' },
      { field: 'driver_name', header: 'Samples taken by', type: 'text' },
      { field: 'truck_no', header: 'Remark', type: 'text' },
      { field: 'creation_date', header: 'Date', type: 'shortDate' },
    ];
    this.selectedSamplesCols = this.samplesCols;
    this.globalSamplesFilterFields = this.samplesCols.map((c) => c.field);

    // initialize completed date view and filter
    this.setCompletedView(this.completedSelectedPeriod);
    this.setSamplesView(this.samplesSelectedPeriod);
  }

  filterDriverNames(event: any) {
    const query = event.query.toLowerCase();
    this.filteredDriverNames = this.driversList
      .map((item) => item.driver_name)
      .filter((name) => name?.toLowerCase().includes(query));
    console.log('filteredDriverNames:', this.filteredDriverNames);
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

        this.getSmoothieProduction();
      }
    } else if (view === 'week') {
      if (this.selectedDate) {
        const startOfWeek = new Date(this.selectedDate);
        startOfWeek.setHours(0, 0, 0, 0);

        const weekEndDate = this.getWeekEndDate(startOfWeek);

        this.fromDate = this.formatDateTime(startOfWeek);
        this.toDate = this.formatDateTime(weekEndDate);

        this.getSmoothieProduction();
      } else {
        console.warn('No week selected');
      }
    } else if (view === 'month') {
      const d = new Date(this.selectedDate);
      const firstDay = new Date(d.getFullYear(), d.getMonth(), 1);
      const lastDay = new Date(d.getFullYear(), d.getMonth() + 1, 0);

      this.fromDate = this.formatDateTime(new Date(firstDay.setHours(0, 0, 0)));
      this.toDate = this.formatDateTime(new Date(lastDay.setHours(23, 59, 59)));

      this.getSmoothieProduction();
    } else if (view === 'year') {
      const d = new Date(this.selectedDate);
      const firstDay = new Date(d.getFullYear(), 0, 1);
      const lastDay = new Date(d.getFullYear(), 11, 31);

      this.fromDate = this.formatDateTime(new Date(firstDay.setHours(0, 0, 0)));
      this.toDate = this.formatDateTime(new Date(lastDay.setHours(23, 59, 59)));

      this.getSmoothieProduction();
    }
  }

  getSmoothieProduction() {
    if (!this.fromDate || !this.toDate) {
      console.warn('fromDate or toDate is missing');
    }

    this.productionService
      .getSmoothieProductionByDate(this.fromDate, this.toDate)
      .subscribe(
        (data) => {
          console.log('Filtered data by date:', data);
          this.SmoothieProduction = data;
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

    // Ensure the value is treated as a string
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

  setSamplesView(view: string) {
    this.samplesSelectedPeriod = view;
    if (view === 'date') {
      if (this.samplesRangeDates && this.samplesRangeDates.length === 2) {
        const [start, end] = this.samplesRangeDates;
        this.samplesFromDate = this.formatDateTime(new Date(start.setHours(0, 0, 0)));
        this.samplesToDate = this.formatDateTime(new Date(end.setHours(23, 59, 59)));
      }
    } else if (view === 'week') {
      const startOfWeek = new Date(this.samplesSelectedDate);
      startOfWeek.setHours(0, 0, 0, 0);
      const weekEndDate = this.getWeekEndDate(startOfWeek);
      this.samplesFromDate = this.formatDateTime(startOfWeek);
      this.samplesToDate = this.formatDateTime(weekEndDate);
    } else if (view === 'month') {
      const d = new Date(this.samplesSelectedDate);
      const firstDay = new Date(d.getFullYear(), d.getMonth(), 1);
      const lastDay = new Date(d.getFullYear(), d.getMonth() + 1, 0);
      this.samplesFromDate = this.formatDateTime(new Date(firstDay.setHours(0, 0, 0)));
      this.samplesToDate = this.formatDateTime(new Date(lastDay.setHours(23, 59, 59)));
    } else if (view === 'year') {
      const d = new Date(this.samplesSelectedDate);
      const firstDay = new Date(d.getFullYear(), 0, 1);
      const lastDay = new Date(d.getFullYear(), 11, 31);
      this.samplesFromDate = this.formatDateTime(new Date(firstDay.setHours(0, 0, 0)));
      this.samplesToDate = this.formatDateTime(new Date(lastDay.setHours(23, 59, 59)));
    }
    this.applySamplesFilter();
  }

  applySamplesFilter() {
    if (!this.samplesFromDate || !this.samplesToDate) {
      this.filteredSamplesDispatches = this.samplesDispatches.slice();
      return;
    }
    const from = new Date(this.samplesFromDate).getTime();
    const to = new Date(this.samplesToDate).getTime();
    this.filteredSamplesDispatches = this.samplesDispatches.filter((d: any) => {
      const t = new Date(d.creation_date).getTime();
      return t >= from && t <= to;
    });
  }

  addToDispatchList(row: any) {
    if (row.transferQty > 0 && row.location) {
      if (row.transferQty > row.cotton) {
        // If transferQty is greater than available qtycotton
        console.log(
          `❌ Transfer Quantity (${row.transferQty}) exceeds available Quantity (${row.cotton})`
        );

        this.messageService.add({
          severity: 'error',
          summary: 'Quantity Exceeded',
          detail: `Transfer Quantity cannot exceed available quantity (${row.cotton}).`,
          life: 3000,
        });

        return; // Exit the function to prevent adding to dispatch list
      }
      const exists = this.dispatchList.find((item) => item.id === row.id);
      if (!exists) {
        this.dispatchList.push({ ...row }); // no driverName needed

        console.log(`✅ Item with ID ${row.id} added to dispatch list.`, row);

        this.messageService.add({
          severity: 'success',
          summary: 'Added Successfully',
          detail: `Item ID ${row.id} has been added to the Dispatch List.`,
          life: 3000,
        });
      } else {
        console.log(
          `⚠️ Item with ID ${row.id} already exists in dispatch list.`
        );

        this.messageService.add({
          severity: 'warn',
          summary: 'Already Exists',
          detail: `Item ID ${row.id} is already in the Dispatch List.`,
          life: 3000,
        });
      }
    } else {
      console.log(`❌ Invalid Qty or Location for item:`, row);

      this.messageService.add({
        severity: 'error',
        summary: 'Invalid Entry',
        detail: 'Please enter a valid Quantity and Location.',
        life: 3000,
      });
    }
  }

  private pick(obj: any, keys: string[]) {
    if (!obj) return undefined;
    const headers = Object.keys(obj || {});
    for (const k of keys) {
      const found = headers.find((h) => h?.trim?.().toLowerCase() === k.toLowerCase());
      if (found !== undefined) return obj[found];
    }
    return undefined;
  }

  onImportDispatchFileChange(event: any) {
    const file: File | null = event?.target?.files?.[0] || null;
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e: any) => {
      try {
        const bstr = e?.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const rows: any[] = XLSX.utils.sheet_to_json(ws, { defval: '' });
        this.addRowsFromExcel(rows);
      } catch (err) {
        console.error('Excel import error:', err);
        this.messageService.add({
          severity: 'error',
          summary: 'Import Failed',
          detail: 'Could not read the Excel file.',
          life: 3000,
        });
      }
    };
    reader.readAsBinaryString(file);
    // reset input so same file can be selected again if needed
    try { event.target.value = null; } catch {}
  }

  private addRowsFromExcel(rows: any[]) {
    if (!Array.isArray(rows) || rows.length === 0) {
      this.messageService.add({ severity: 'warn', summary: 'No Data', detail: 'No rows found in the Excel file.', life: 3000 });
      return;
    }
    let added = 0;
    for (const r of rows) {
      const idVal = this.pick(r, ['id', 'item_id', 'Item ID']);
      const id = Number(idVal);
      const nameRaw = this.pick(r, ['smoothie_name', 'Smoothie', 'Product', 'Name']);
      const smoothieName = String(nameRaw || '').trim();
      const rackRaw = this.pick(r, ['rack', 'Rack']);
      const rack = String(rackRaw || '').trim();
      const qtyVal = this.pick(r, ['transfer_qty', 'qty', 'Quantity', 'Qty']);
      const qty = Number(qtyVal);
      const location = String(this.pick(r, ['location', 'Location']) || '').trim();
      const cartonVal = this.pick(r, ['cartonvalue', 'Carton', 'SachetsPerBox']);
      const cartonvalue = Number(cartonVal) || 15;

      if (!qty || qty <= 0 || !location) {
        continue;
      }

      let src: any = null;
      // 1) Try by Rack
      if (rack) {
        const targetRack = rack.toLowerCase();
        const candidates = (this.SmoothieProduction || []).filter((p: any) => String(p?.rack || '').trim().toLowerCase() === targetRack);
        if (candidates.length === 1) {
          src = candidates[0];
        } else if (candidates.length > 1) {
          if (smoothieName) {
            const t = smoothieName.toLowerCase();
            src = candidates.find((p: any) => String(p?.smoothie_name || '').trim().toLowerCase() === t) || candidates[0];
          } else if (!isNaN(id) && id > 0) {
            src = candidates.find((p: any) => Number(p?.id) === id) || candidates[0];
          } else {
            src = candidates[0];
          }
        }
      }
      // 2) Then by Smoothie Name
      if (!src && smoothieName) {
        const target = smoothieName.toLowerCase();
        src = (this.SmoothieProduction || []).find((p: any) => String(p?.smoothie_name || '').trim().toLowerCase() === target);
      }
      // 3) Lastly by ID
      if (!src && !isNaN(id) && id > 0) {
        src = (this.SmoothieProduction || []).find((p: any) => Number(p?.id) === id);
      }
      if (!src) {
        continue;
      }

      const available = Number(src?.cotton) || 0;
      if (qty > available) {
        // skip rows exceeding stock
        continue;
      }

      const exists = this.dispatchList.find((it: any) => Number(it?.id) === Number(src.id));
      const oneQtyG = Number(src?.one_qty_g) || 0;
      const entry = {
        ...src,
        transferQty: qty,
        location: location,
        cartonvalue: cartonvalue,
        total_qty_g: oneQtyG * qty * cartonvalue,
        totalShases: qty * cartonvalue,
      };
      if (!exists) {
        this.dispatchList.push(entry);
        added++;
      } else {
        exists.transferQty = qty;
        exists.location = location;
        exists.cartonvalue = cartonvalue;
      }
    }
    if (added > 0) {
      this.messageService.add({ severity: 'success', summary: 'Import Complete', detail: `Added ${added} item(s) to dispatch list.`, life: 3000 });
    } else {
      this.messageService.add({ severity: 'warn', summary: 'Nothing Added', detail: 'No valid rows were imported.', life: 3000 });
    }
  }

  removeRow(index: number) {
    const removedItem = this.dispatchList[index];

    if (removedItem) {
      this.dispatchList.splice(index, 1);

      console.log(`🗑️ Removed item from dispatch list:`, removedItem);

      this.messageService.add({
        severity: 'success',
        summary: 'Removed Successfully',
        detail: `Item ID ${removedItem.id} has been removed from the Dispatch List.`,
        life: 3000,
      });
    } else {
      console.log(`⚠️ No item found at index ${index} to remove.`);

      this.messageService.add({
        severity: 'warn',
        summary: 'Remove Failed',
        detail: `No item found to remove.`,
        life: 3000,
      });
    }
  }

  preDispatch() {
    if (!this.driverName) {
      this.messageService.add({
        severity: 'error',
        summary: 'Driver Required',
        detail: 'Please enter driver name',
        life: 3000,
      });
      return;
    }

    // Map the dispatch list to form the items array for insertion
    const dispatchItems = this.dispatchList.map((item) => {
      const carton = Number(item.cartonvalue) || 15;
      const qty = Number(item.transferQty) || 0;
      const oneQtyG = Number(item.one_qty_g) || 0;
      return {
        item_id: item.id, // Item ID
        category: item.category,
        smoothie_name: item.smoothie_name, // Smoothie name
        transfer_qty: qty, // Quantity
        one_qty_g: oneQtyG, // Quantity in grams
        cartonvalue: carton, // Persist carton value
        total_qty_g: oneQtyG * qty * carton,
        totalShases: qty * carton, // Calculate total sachets based on cartonvalue
        location: item.location, // Location of the item
        ingredients: item.ingredients, // Include ingredients for reference
      };
    });

    // Prepare the payload to be sent to the backend
    const payload = {
      driver_name: this.driverName,
      status: 'Pending', // Default status as Pending
      items: dispatchItems, // Items array to be inserted
    };

    console.log('Dispatching:', payload);

    // Call the preDispatch method from the service
    this.dispatchService.preDispatch(payload).subscribe(
      (response) => {
        console.log('Dispatch successful:', response);
        this.dispatchList = []; // Clear the dispatch list
        this.driverName = ''; // Reset the driver name field
        this.messageService.add({
          severity: 'success',
          summary: 'Dispatch Saved',
          detail: 'Pre-dispatch created successfully.',
          life: 3000,
        });
        this.getPreDispatches();
      },
      (error) => {
        console.error('Error during dispatch:', error);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Error during dispatch',
          life: 3000,
        });
      }
    );
  }

  getPreDispatches() {
    this.dispatchService.getPreDispatches().subscribe(
      (data) => {
        this.preDispatchRecords = data;
        // Only keep pending records for display in the pending section
        this.filteredPreDispatchRecords = (data || []).filter((d: any) =>
          String(d?.status ?? '').toLowerCase() === 'pending'
        );
        console.log('Fetched Dispatches:', this.preDispatchRecords);
        console.log('Pending Pre-Dispatches:', this.filteredPreDispatchRecords);

      },
      (error) => {
        console.error('Error fetching dispatches:', error);
      }
    );
  }

  private safeParseJSON(val: any): any[] {
    try {
      const parsed = JSON.parse(val);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  getCompletedDispatches() {
    this.dispatchService.getCompletedDispatches().subscribe(
      (data: any[]) => {
        this.completedDispatches = (data || []).map((d: any) => ({
          ...d,
          item_details: Array.isArray(d.item_details)
            ? d.item_details
            : (typeof d.item_details === 'string' ? this.safeParseJSON(d.item_details) : []),
        }));
        this.applyCompletedFilter();
        // Build samples list from completed
        this.samplesDispatches = this.completedDispatches.filter((d: any) =>
          String(d?.status ?? '').toLowerCase() === 'samples'
        );
        this.filteredSamplesDispatches = this.samplesDispatches.slice();
        this.applySamplesFilter();
      },
      (error: any) => {
        console.error('Error fetching completed dispatches:', error);
      }
    );
  }

  setCompletedView(view: string) {
    this.completedSelectedPeriod = view;
    if (view === 'date') {
      if (this.completedRangeDates && this.completedRangeDates.length === 2) {
        const start = this.completedRangeDates[0];
        const end = this.completedRangeDates[1];
        this.completedFromDate = this.formatDateTime(new Date(start.setHours(0, 0, 0)));
        this.completedToDate = this.formatDateTime(new Date(end.setHours(23, 59, 59)));
      }
    } else if (view === 'week') {
      const startOfWeek = new Date(this.completedSelectedDate);
      startOfWeek.setHours(0, 0, 0, 0);
      const weekEndDate = this.getWeekEndDate(startOfWeek);
      this.completedFromDate = this.formatDateTime(startOfWeek);
      this.completedToDate = this.formatDateTime(weekEndDate);
    } else if (view === 'month') {
      const d = new Date(this.completedSelectedDate);
      const firstDay = new Date(d.getFullYear(), d.getMonth(), 1);
      const lastDay = new Date(d.getFullYear(), d.getMonth() + 1, 0);
      this.completedFromDate = this.formatDateTime(new Date(firstDay.setHours(0, 0, 0)));
      this.completedToDate = this.formatDateTime(new Date(lastDay.setHours(23, 59, 59)));
    } else if (view === 'year') {
      const d = new Date(this.completedSelectedDate);
      const firstDay = new Date(d.getFullYear(), 0, 1);
      const lastDay = new Date(d.getFullYear(), 11, 31);
      this.completedFromDate = this.formatDateTime(new Date(firstDay.setHours(0, 0, 0)));
      this.completedToDate = this.formatDateTime(new Date(lastDay.setHours(23, 59, 59)));
    }
    this.applyCompletedFilter();
  }

  applyCompletedFilter() {
    const completedOnly = this.completedDispatches.filter(
      (d: any) => String(d?.status ?? '').toLowerCase() === 'completed'
    );
    if (!this.completedFromDate || !this.completedToDate) {
      this.filteredCompletedDispatches = completedOnly.slice();
      return;
    }
    const from = new Date(this.completedFromDate).getTime();
    const to = new Date(this.completedToDate).getTime();
    this.filteredCompletedDispatches = completedOnly.filter((d: any) => {
      const t = new Date(d.creation_date).getTime();
      return t >= from && t <= to;
    });
  }

  getTruckNoByDriverName(name: string): string {
    const driver = this.driversList.find((d) => d.driver_name === name);
    return driver?.truck_no || '';
  }

  // Save a single-row dispatch directly as a "Sample" using provided name and remark
  saveSample(row: any) {
    const qty = Number(row?.transferQty) || 0;
    const location = row?.location?.trim?.() || '';
    const name = row?.sampleName?.trim?.() || '';
    const remark = row?.sampleRemark?.trim?.() || '';
    const available = Number(row?.cotton) || 0;
    const cartonvalue = Number(row?.cartonvalue) || 15;

    if (!qty || qty <= 0) {
      this.messageService.add({
        severity: 'error',
        summary: 'Invalid Quantity',
        detail: 'Please enter a valid quantity for samples.',
        life: 3000,
      });
      return;
    }

    if (qty > available) {
      this.messageService.add({
        severity: 'error',
        summary: 'Quantity Exceeded',
        detail: `Sample qty cannot exceed available quantity (${available}).`,
        life: 3000,
      });
      return;
    }

    if (!location) {
      this.messageService.add({
        severity: 'error',
        summary: 'Location Required',
        detail: 'Please enter a location for this sample.',
        life: 3000,
      });
      return;
    }

    if (!name) {
      this.messageService.add({
        severity: 'error',
        summary: 'Name Required',
        detail: 'Please enter a name for samples.',
        life: 3000,
      });
      return;
    }

    const oneQtyG = Number(row?.one_qty_g) || 0;
    const item = {
      item_id: row.id,
      category: row.category,
      smoothie_name: row.smoothie_name,
      transfer_qty: qty,
      one_qty_g: oneQtyG,
      cartonvalue: cartonvalue,
      total_qty_g: oneQtyG * qty * cartonvalue,
      totalShases: qty * cartonvalue,
      location: location,
      ingredients: row.ingredients,
    };

    // Step 1: create a pre-dispatch with status 'Samples'
    const prePayload: any = {
      driver_name: name,
      status: 'Samples',
      items: [item],
    };

    this.dispatchService.preDispatch(prePayload).subscribe(
      (preRes) => {
        console.log('Sample preDispatch response:', preRes);
        let preId = (preRes && (preRes.id || preRes.insertId || preRes.pre_dispatch_id)) as number | undefined;
        // Try deeper common shapes
        if (!preId) preId = (preRes && (preRes.data?.id || preRes.data?.insertId || preRes.data?.pre_dispatch_id)) as number | undefined;
        if (!preId && Array.isArray(preRes) && preRes.length) preId = (preRes[0]?.id || preRes[0]?.pre_dispatch_id) as number | undefined;

        const finishWithId = (resolvedId: number) => {
          // Step 2: complete the dispatch using the created pre-dispatch id
          const completeItem = { ...item, returns: 0 };
          const completePayload = {
            pre_dispatch_id: resolvedId,
            driver_name: name,
            truck_no: remark,
            items: [completeItem],
          };

          this.dispatchService.completeDispatch(completePayload).subscribe(
            (res) => {
              console.log('Sample completeDispatch response:', res);
              this.messageService.add({
                severity: 'success',
                summary: 'Sample Saved',
                detail: 'Sample dispatch recorded successfully.',
                life: 3000,
              });
              row.sampleName = '';
              row.sampleRemark = '';
              row.transferQty = null;
              row.location = '';
              this.getPreDispatches();
              this.getCompletedDispatches();
            },
            (err) => {
              console.error('Sample completeDispatch error:', err);
              this.messageService.add({
                severity: 'error',
                summary: 'Error',
                detail: 'Failed to complete sample dispatch.',
                life: 3000,
              });
            }
          );
        };

        if (preId) {
          finishWithId(preId);
        } else {
          // Fallback: fetch pre-dispatches and infer latest matching 'Samples' record
          this.dispatchService.getPreDispatches().subscribe(
            (list) => {
              const candidates = (list || []).filter((d: any) =>
                String(d?.status ?? '').toLowerCase() === 'samples' && String(d?.driver_name ?? '') === name
              );
              // Choose the most recent candidate
              const sorted = candidates.sort((a: any, b: any) => new Date(b.dispatch_date || b.creation_date || 0).getTime() - new Date(a.dispatch_date || a.creation_date || 0).getTime());
              const match = sorted[0];
              if (match?.id) {
                finishWithId(match.id);
              } else {
                console.error('Could not infer pre-dispatch id from list:', candidates);
                this.messageService.add({
                  severity: 'error',
                  summary: 'Error',
                  detail: 'Failed to save sample: pre-dispatch id not found.',
                  life: 3000,
                });
              }
            },
            (err) => {
              console.error('Fetching pre-dispatches failed during sample flow:', err);
              this.messageService.add({
                severity: 'error',
                summary: 'Error',
                detail: 'Failed to save sample: could not verify pre-dispatch id.',
                life: 3000,
              });
            }
          );
        }
      },
      (err) => {
        console.error('Sample preDispatch error:', err);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to create sample pre-dispatch.',
          life: 3000,
        });
      }
    );
  }

  completePreDispatch(record: preDispatchRecord) {
    const truckNo = this.getTruckNoByDriverName(record.driver_name);
    if (!truckNo) {
      alert('Truck number not found for driver.');
      return;
    }

    // Ensure returns exist on each item and are not greater than transfer_qty
    const itemsWithReturns = record.items.map((it: any) => {
      const origQty = Number(it.transfer_qty) || 0;
      const ret = Math.max(Number(it.returns) || 0, 0);
      if (ret > origQty) {
        throw new Error(`Returns cannot exceed transferred qty for item ${it.item_id}`);
      }
      const adjusted = origQty - ret;
      const carton = Number(it.cartonvalue) || 15;
      return {
        ...it,
        transfer_qty: adjusted,
        cartonvalue: carton,
        totalShases: adjusted * carton,
        total_qty_g: (Number(it.one_qty_g) || 0) * adjusted * carton,
      };
    });

    const payload = {
      pre_dispatch_id: record.id,
      driver_name: record.driver_name,
      truck_no: truckNo,
      items: itemsWithReturns,
    };

    this.dispatchService.completeDispatch(payload).subscribe(
      (res) => {
        this.messageService.add({
          severity: 'success',
          summary: 'Dispatch Completed',
          detail: 'Dispatch recorded and inventory updated.',
          life: 3000,
        });
         this.getSmoothieProduction();
        this.getPreDispatches();
        this.getCompletedDispatches();
      },
      (err) => {
        console.error('Complete dispatch error:', err);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to complete dispatch.',
          life: 3000,
        });
      }
    );
  }

  private escapeCsv(value: any): string {
    if (value === null || value === undefined) {
      return '';
    }
    const str = String(value).replace(/\r?\n/g, ' ').trim();
    if (/[",\n]/.test(str)) {
      return '"' + str.replace(/"/g, '""') + '"';
    }
    return str;
  }

  private formatExportDate(value: any): string {
    const d = value ? new Date(value) : null;
    if (!d || isNaN(d.getTime())) {
      return '';
    }
    const to2 = (num: number) => num.toString().padStart(2, '0');
    return `${to2(d.getDate())}-${to2(d.getMonth() + 1)}-${d.getFullYear()} ${to2(
      d.getHours()
    )}:${to2(d.getMinutes())}`;
  }

  private formatFileDate(date: Date = new Date()): string {
    return date
      .toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      })
      .replace(/,/g, '');
  }

  exportCompletedDispatches(): void {
    if (!this.filteredCompletedDispatches?.length) {
      this.messageService.add({
        severity: 'warn',
        summary: 'No Records',
        detail: 'There are no completed dispatches to export.',
        life: 3000,
      });
      return;
    }

    const headers = [
      'Driver',
      'Truck No',
      'Date',
      'Item ID',
      'Smoothie',
      'Qty Cotton (kg)',
      'Location',
      'Returns',
    ];

    const rows: string[][] = [headers];

    this.filteredCompletedDispatches.forEach((dispatch: any) => {
      const items = Array.isArray(dispatch.item_details) && dispatch.item_details.length
        ? dispatch.item_details
        : [null];

      items.forEach((item: any) => {
        rows.push([
          this.escapeCsv(dispatch.driver_name),
          this.escapeCsv(dispatch.truck_no),
          this.escapeCsv(this.formatExportDate(dispatch.creation_date)),
          this.escapeCsv(item?.item_id ?? ''),
          this.escapeCsv(item?.smoothie_name ?? ''),
          this.escapeCsv(item?.transfer_qty ?? ''),
          this.escapeCsv(item?.location ?? ''),
          this.escapeCsv(item?.returns ?? 0),
        ]);
      });
    });

    const csvContent = rows.map((row) => row.join(',')).join('\r\n');
    const exportDateLabel = this.formatFileDate();
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `completed_dispatches_${exportDateLabel}.csv`;
    link.click();
    URL.revokeObjectURL(url);

    this.messageService.add({
      severity: 'success',
      summary: 'Export Ready',
      detail: 'Completed dispatch report downloaded with item details.',
      life: 3000,
    });
  }

  exportSamplesDispatches(): void {
    if (!this.filteredSamplesDispatches?.length) {
      this.messageService.add({
        severity: 'warn',
        summary: 'No Records',
        detail: 'There are no sample dispatches to export.',
        life: 3000,
      });
      return;
    }

    const headers = [
      'Samples taken by',
      'Remark',
      'Date',
      'Item ID',
      'Smoothie',
      'Qty Cotton (kg)',
      'Location',
      'Returns',
    ];

    const rows: string[][] = [headers];

    this.filteredSamplesDispatches.forEach((dispatch: any) => {
      const items = Array.isArray(dispatch.item_details) && dispatch.item_details.length
        ? dispatch.item_details
        : [null];

      items.forEach((item: any) => {
        rows.push([
          this.escapeCsv(dispatch.driver_name),
          this.escapeCsv(dispatch.truck_no),
          this.escapeCsv(this.formatExportDate(dispatch.creation_date)),
          this.escapeCsv(item?.item_id ?? ''),
          this.escapeCsv(item?.smoothie_name ?? ''),
          this.escapeCsv(item?.transfer_qty ?? ''),
          this.escapeCsv(item?.location ?? ''),
          this.escapeCsv(item?.returns ?? 0),
        ]);
      });
    });

    const csvContent = rows.map((row) => row.join(',')).join('\r\n');
    const exportDateLabel = this.formatFileDate();
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `sample_dispatches_${exportDateLabel}.csv`;
    link.click();
    URL.revokeObjectURL(url);

    this.messageService.add({
      severity: 'success',
      summary: 'Export Ready',
      detail: 'Sample dispatch report downloaded with item details.',
      life: 3000,
    });
  }
}
