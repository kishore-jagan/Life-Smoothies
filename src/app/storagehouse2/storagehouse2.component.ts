import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { MultiSelectModule } from 'primeng/multiselect';
// import { StorageItem, StorageService } from './storage.service';
import { MessageService } from 'primeng/api';
import { Toast } from 'primeng/toast';
import { SelectButtonModule } from 'primeng/selectbutton';
import { DatePickerModule } from 'primeng/datepicker';
import { StorageItem, StorageService } from '../storagehouse/storage.service';

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
  selector: 'app-storagehouse2',
  imports: [
    CommonModule,
    FormsModule,
    TableModule,
    ButtonModule,
    Toast,
    MultiSelectModule,
    SelectButtonModule,
    DatePickerModule,
  ],
  templateUrl: './storagehouse2.component.html',
  styleUrl: './storagehouse2.component.css',
  providers: [StorageService, MessageService],
})
export class Storagehouse2Component implements OnInit {
  showForm = false;
  newItem: any = {
    // live: '',
    itemname: '',
    description: '',
    lotno: '',
    productiondate: '',
    expirydate: '',
    qtycotton: 0,
    // qtykg: 0,
    // qtyg: 0,
    supplier: '',
    truckno: '',
    transferqty: 0,
    location: '',
  };

  storageList: StorageItem[] = [];

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
    private storageService: StorageService,
    private messageService: MessageService
  ) {}

  toggleForm() {
    this.showForm = !this.showForm;
  }

  ngOnInit(): void {
    this.setView(this.selectedPeriod);
    this.getStorageByDate2();

    this.cols = [
      { field: 'live', header: 'Live Date', type: 'shortDate' },
      { field: 'itemname', header: 'Item Name', type: 'text' },
      { field: 'description', header: 'Description', type: 'text' },
      { field: 'lotno', header: 'Lot No', type: 'text' },
      // { field: 'location', header: 'Location', type: 'text' },
      { field: 'productiondate', header: 'Production Date', type: 'date' },
      { field: 'expirydate', header: 'Expiry Date', type: 'date' },
      { field: 'qtycotton', header: 'Qty Cotton', type: 'text' },
      { field: 'qtykg', header: 'Qty Kg', type: 'text' },
      { field: 'qtyg', header: 'Qty g', type: 'text' },
      { field: 'supplier', header: 'Supplier', type: 'text' },
      { field: 'truckno', header: 'Truck No', type: 'text' },
    ];

    this.selectedColumns = this.cols;
    this.globalFilterFields = this.cols.map((col) => col.field);
    this.exportColumns = this.cols.map((col) => ({
      title: col.header,
      dataKey: col.field,
    }));
  }

  addStorageItem() {
    const item = this.newItem;

    if (
      !item.itemname ||
      !item.description ||
      !item.lotno ||
      !item.productiondate ||
      !item.expirydate ||
      !item.qtycotton ||
      !item.supplier ||
      !item.truckno
    ) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Validation Failed',
        detail: 'Please fill in all required fields.',
      });
      return;
    }

    this.storageService.addStorageItem2(item).subscribe({
      next: (data) => {
        this.messageService.add({
          severity: 'success',
          summary: 'Added',
          detail: 'Storage item added successfully!',
        });
        this.storageList.unshift(data);
        this.newItem = {}; // Clear form
      },
      error: (err) => {
        if (err.error?.error === 'Lot No already exists') {
          this.messageService.add({
            severity: 'error',
            summary: 'Duplicate Lot No',
            detail: 'Lot number already exists. Please enter a unique one.',
          });
        } else {
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Failed to insert item. Try again later.',
          });
        }
      },
    });
  }

  transferItem(row: any) {
    if (!row.transferQty || row.transferQty <= 0) {
      alert('Please enter a valid quantity');
      return;
    }

    if (row.transferQty > row.qtycotton) {
      alert('Transfer quantity exceeds available stock');
      return;
    }

    const payload = {
      id: row.id,
      enteredQtyCotton: row.transferQty,
      location: row.location || 'Default Warehouse',
    };

    this.storageService.transferLifeSmoothi2(payload).subscribe({
      next: () => {
        alert('Transfer successful');

        // Update row locally
        row.qtycotton -= row.transferQty;
        row.qtykg = row.qtycotton * 10;
        row.qtyg = row.qtycotton * 10000;

        // Reset transfer fields
        row.transferQty = null;
        row.location = '';
      },
      error: () => {
        alert('Transfer failed');
      },
    });
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

        this.getStorageByDate2();
      }
    } else if (view === 'week') {
      if (this.selectedDate) {
        const startOfWeek = new Date(this.selectedDate);
        startOfWeek.setHours(0, 0, 0, 0);

        const weekEndDate = this.getWeekEndDate(startOfWeek);

        this.fromDate = this.formatDateTime(startOfWeek);
        this.toDate = this.formatDateTime(weekEndDate);

        this.getStorageByDate2();
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

    this.getStorageByDate2();
  }

  getStorageByDate2() {
    if (!this.fromDate || !this.toDate) {
      console.warn('fromDate or toDate is missing');
    }

    this.storageService.getStorageByDate2(this.fromDate, this.toDate).subscribe(
      (data) => {
        console.log('Filtered data by date:', data);
        this.storageList = data;
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
}
