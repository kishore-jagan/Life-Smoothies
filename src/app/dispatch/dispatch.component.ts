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

    cols!: Column[];
    selectedColumns!: Column[];
    globalFilterFields!: string[];
    searchQuery: string = '';

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

      this.setView(this.selectedPeriod);
      // this.getSmoothieProduction();

      this.cols = [
        { field: 'smoothie_name', header: 'Smoothie Name', type: 'text' },
        { field: 'total_qty_g', header: 'Total Quantity Used (g)', type: 'text' },
        { field: 'rack', header: 'Rack', type: 'text' },
        { field: 'slices', header: 'Slices', type: 'text' },
        { field: 'cotton', header: 'Cotton', type: 'text' },
        { field: 'created_at', header: 'Creation Date', type: 'date' },
        // { field: 'ingredients', header: 'Ingredients', type: 'array' },
      ];

      this.selectedColumns = this.cols;
      this.globalFilterFields = this.cols.map((col) => col.field);
      this.exportColumns = this.cols.map((col) => ({
        title: col.header,
        dataKey: col.field,
      }));
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
        smoothie_name: item.smoothie_name, // Smoothie name
        transfer_qty: item.transferQty, // Quantity
        one_qty_g: item.one_qty_g, // Quantity in grams
        totalShases: item.transferQty * 15, // Calculate total shakes
        location: item.location, // Location of the item
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
          console.log('Fetched Dispatches:', this.preDispatchRecords);
        },
        (error) => {
          console.error('Error fetching dispatches:', error);
        }
      );
    }

    getTruckNoByDriverName(name: string): string {
      const driver = this.driversList.find(d => d.driver_name === name);
      return driver?.truck_no || '';
    }

    completePreDispatch(record: preDispatchRecord) {
      const truckNo = this.getTruckNoByDriverName(record.driver_name);
      if (!truckNo) {
        alert('Truck number not found for driver.');
        return;
      }

      // Ensure returns exist on each item and are not greater than transfer_qty
      const itemsWithReturns = record.items.map((it: any) => {
        const ret = Number(it.returns) || 0;
        if (ret > it.transfer_qty) {
          throw new Error(`Returns cannot exceed transferred qty for item ${it.item_id}`);
        }
        return { ...it, returns: ret };
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
