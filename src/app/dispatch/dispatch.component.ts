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
import {
  Driver,
  Ingredient,
  ProductionService,
  SmoothieProduction,
} from '../production/production.service';
import { DispatchService, preDispatchRecord } from './dispatch.service';

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
  // Samples table configs
  samplesCols!: Column[];
  selectedSamplesCols!: Column[];
  globalSamplesFilterFields!: string[];

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
  selectedPeriod: string = 'year';
  selectedDate: Date = new Date(); // for week/month/year
  fromDateModel: Date = new Date(); // for date range
  toDateModel: Date = new Date(); // for date range
  rangeDates: Date[] = [new Date(), new Date()]; // optional initial values

  fromDate!: string;
  toDate!: string;

  exportColumns!: ExportColumn[];

  return: number = 0;



  // smoothiesData: ProductData[] = [
  //   { name: 'Smoothie 1', monthlySold: 43000, dailySold: 1433, dailyBoxes: 96, boxesLeft: 4288, daysRemaining: 45 },
  //   { name: 'Smoothie 2', monthlySold: 8000, dailySold: 267, dailyBoxes: 18, boxesLeft: 392, daysRemaining: 22 },
  //   { name: 'Smoothie 2 BATEEL 140G', monthlySold: 0, dailySold: 0, dailyBoxes: 0, boxesLeft: 51, daysRemaining: 8 },
  //   { name: 'Smoothie 3', monthlySold: 26000, dailySold: 867, dailyBoxes: 58, boxesLeft: 962, daysRemaining: 17 },
  //   // ... add all other smoothie rows
  // ];

  // shakesData: ProductData[] = [
  //   { name: 'Vanilla', monthlySold: 12200, dailySold: 407, dailyBoxes: 27, boxesLeft: 466, daysRemaining: 17 },
  //   { name: 'Vegan Vanilla', monthlySold: 300, dailySold: 10, dailyBoxes: 1, boxesLeft: 0, daysRemaining: 0 },
  //   { name: 'Vegan Banana', monthlySold: 500, dailySold: 17, dailyBoxes: 1, boxesLeft: 74, daysRemaining: 67 },
  //   // ... add all other shake rows
  // ];

  // bowlsData: ProductData[] = [
  //   { name: 'Dragon Fruit and Banana', monthlySold: 130, dailySold: 4, dailyBoxes: 0, boxesLeft: 105, daysRemaining: 363 },
  //   { name: 'Acai Berry and Banana', monthlySold: 900, dailySold: 30, dailyBoxes: 2, boxesLeft: 15, daysRemaining: 12 },
  //   { name: 'Mango and Banana', monthlySold: 160, dailySold: 5, dailyBoxes: 0, boxesLeft: 45, daysRemaining: 0 }
  // ];

  //  ingredientData: IngredientData[] = [
  //   { name: 'Acai', color: '#8b5cf6', kgPerDay: 32.2, stock: 3550, daysLeft: 110 },
  //   { name: 'Acai with Guarana', color: '#ef4444', kgPerDay: 0, stock: 0, daysLeft: 8  },
  //   { name: 'Aloe vera', color: '#a3e635', kgPerDay: 2.7, stock: 0, daysLeft: 0 },
  //   { name: 'Avocado', color: '#15803d', kgPerDay: 11.1, stock: 390, daysLeft: 35 },
  //   { name: 'Banana', color: '#fde047', kgPerDay: 313.5, stock: 48250, daysLeft: 154 },
  //   { name: 'Baobab', color: '#f9a8d4', kgPerDay: 0.7, stock: 670, daysLeft: 985 },
  //   { name: 'Beetroot', color: '#ec4899', kgPerDay: 7.6, stock: 620, daysLeft: 82 },
  //   { name: 'Blackberry', color: '#000000', kgPerDay: 6.1, stock: 5282, daysLeft: 861 },
  //   { name: 'Blackcurant', color: '#4b5563', kgPerDay: 5.3, stock: 786, daysLeft: 147 }
  // ];


  

  constructor(
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
      { field: 'slices', header: 'Slices', type: 'text' },
      { field: 'cotton', header: 'Cotton', type: 'text' },
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
      { field: 'id', header: 'ID', type: 'text' },
      { field: 'driver_name', header: 'Driver', type: 'text' },
      { field: 'truck_no', header: 'Truck No', type: 'text' },
      { field: 'creation_date', header: 'Date', type: 'shortDate' },
      // Items will be shown in a fixed last column
    ];
    this.selectedCompletedCols = this.completedCols;
    this.globalCompletedFilterFields = this.completedCols.map((c) => c.field);

    // Samples table columns
    this.samplesCols = [
      { field: 'id', header: 'ID', type: 'text' },
      { field: 'driver_name', header: 'Driver', type: 'text' },
      { field: 'truck_no', header: 'Remark/Truck No', type: 'text' },
      { field: 'creation_date', header: 'Date', type: 'shortDate' },
    ];
    this.selectedSamplesCols = this.samplesCols;
    this.globalSamplesFilterFields = this.samplesCols.map((c) => c.field);

    // initialize completed date view and filter
    this.setCompletedView(this.completedSelectedPeriod);
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
      alert('Please enter driver name');
      return;
    }

    // Map the dispatch list to form the items array for insertion
    const dispatchItems = this.dispatchList.map((item) => ({
      item_id: item.id, // Item ID
      category: item.category,
      smoothie_name: item.smoothie_name, // Smoothie name
      transfer_qty: item.transferQty, // Quantity
      one_qty_g: item.one_qty_g, // Quantity in grams
      total_qty_g: (Number(item.one_qty_g) || 0) * (Number(item.transferQty) || 0) * 15,
      totalShases: item.transferQty * 15, // Calculate total shakes
      location: item.location, // Location of the item
      ingredients: item.ingredients, // Include ingredients for reference
    }));

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
        alert('Dispatch successful');
      },
      (error) => {
        console.error('Error during dispatch:', error);
        alert('Error during dispatch');
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
    if (!this.completedFromDate || !this.completedToDate) {
      this.filteredCompletedDispatches = this.completedDispatches.slice();
      return;
    }
    const from = new Date(this.completedFromDate).getTime();
    const to = new Date(this.completedToDate).getTime();
    this.filteredCompletedDispatches = this.completedDispatches.filter((d: any) => {
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
      total_qty_g: oneQtyG * qty * 15,
      totalShases: qty * 15,
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
      return {
        ...it,
        transfer_qty: adjusted,
        totalShases: adjusted * 15,
        total_qty_g: (Number(it.one_qty_g) || 0) * adjusted * 15,
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
}
