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
import { SessionService } from '../users/session-service/session.service';
import { DialogModule } from 'primeng/dialog';

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
    DialogModule,
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
    addedqty: 0,
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
    return `Sevenseas Warehouse_${day} ${month} ${year}`;
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
    private storageService: StorageService,
    private messageService: MessageService
  ) {}

  toggleForm() {
    this.showForm = !this.showForm;
  }

  // ---- Overview metrics (computed from current filtered list) ----
  get totalItems(): number {
    return Array.isArray(this.storageList) ? this.storageList.length : 0;
  }

  get totalQtyCotton(): number {
    if (!Array.isArray(this.storageList)) return 0;
    return this.storageList.reduce((sum, item) => {
      const qty = Number((item as any)?.qtycotton) || 0;
      return sum + qty;
    }, 0);
  }

  get lowStockCount(): number {
    if (!Array.isArray(this.storageList)) return 0;
    return this.storageList.filter((item: any) => {
      const qty = Number(item?.qtycotton) || 0;
      return qty > 0 && qty < 5;
    }).length;
  }

  get outOfStockCount(): number {
    if (!Array.isArray(this.storageList)) return 0;
    return this.storageList.filter((item: any) => {
      const qty = Number(item?.qtycotton) || 0;
      return qty === 0;
    }).length;
  }

  // Maintain original order but push out-of-stock (qtycotton == 0) items to the end
  get sortedStorageList(): StorageItem[] {
    if (!Array.isArray(this.storageList)) return [] as StorageItem[];
    // Create a shallow copy to avoid mutating the original list
    return [...this.storageList].sort((a: any, b: any) => {
      const aZero = (Number(a?.qtycotton) || 0) === 0 ? 1 : 0;
      const bZero = (Number(b?.qtycotton) || 0) === 0 ? 1 : 0;
      if (aZero > bZero) return 1; // a after b
      if (aZero < bZero) return -1; // a before b
      return 0; // keep relative order for stability
    });
  }

  ngOnInit(): void {
    this.setView(this.selectedPeriod);
    this.getStorageByDate2();

    this.cols = [
      { field: 'live', header: 'Live Date', type: 'shortDate' },
      { field: 'itemname', header: 'Item Name', type: 'text' },
      { field: 'description', header: 'Description', type: 'text' },
      { field: 'itemtype', header: 'Item Type', type: 'text' },
      { field: 'lotno', header: 'Lot No', type: 'text' },
      // { field: 'location', header: 'Location', type: 'text' },
      { field: 'productiondate', header: 'Production Date', type: 'date' },
      { field: 'expirydate', header: 'Expiry Date', type: 'date' },
      { field: 'qtycotton', header: 'Qty Carton', type: 'text' },
      { field: 'addedqty', header: 'Added Qty', type: 'text' },
      { field: 'qtykg', header: 'Qty Kg', type: 'text' },
      // { field: 'qtyg', header: 'Qty g', type: 'text' },
      // { field: 'supplier', header: 'Supplier', type: 'text' },
      // { field: 'truckno', header: 'Truck No', type: 'text' },
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

    // Normalize dates if bound as Date objects from p-datepicker
    if (item.productiondate instanceof Date) {
      item.productiondate = this.formatDateTime(new Date(item.productiondate));
    }
    if (item.expirydate instanceof Date) {
      item.expirydate = this.formatDateTime(new Date(item.expirydate));
    }

    if (
      !item.itemname ||
      !item.description ||
      !item.lotno ||
      !item.productiondate ||
      !item.expirydate ||
      !item.qtycotton 
      // !item.supplier ||
      // !item.truckno
    ) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Validation Failed',
        detail: 'Please fill in all required fields.',
      });
      return;
    }
     console.log("post storage 2 item: ", item);
    this.storageService.addStorageItem2(item).subscribe({
      next: (data) => {
        this.messageService.add({
          severity: 'success',
          summary: 'Added',
          detail: 'Storage item added successfully!',
        });
        this.storageList.unshift({ ...(data as any), addedqty: 0 });
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

  // ---- Add Qty via Dialog ----
  addQtyDialogVisible = false;
  addQtyValue: number = 0;
  addQtyRemark: string = '';
  addQtyRowRef: any = null;

  // ---- History dialog ----
  qtyHistoryVisible = false;
  qtyHistoryRows: Array<{ id: number; entity: string; entity_id: number; addedqty: number; remark?: string; user?: string; created_at: string }> = [];
  qtyHistoryLoading = false;
  qtyHistoryTitle = '';

  openAddQtyDialog(row: any) {
    this.addQtyRowRef = row;
    this.addQtyValue = 0;
    this.addQtyRemark = '';
    this.addQtyDialogVisible = true;
  }

  cancelAddQtyDialog() {
    this.addQtyDialogVisible = false;
    this.addQtyRowRef = null;
    this.addQtyValue = 0;
    this.addQtyRemark = '';
  }

  confirmAddQtyDialog() {
    const row = this.addQtyRowRef;
    const inc = Number(this.addQtyValue);
    if (!row) return;
    if (!isFinite(inc) || inc <= 0) {
      this.messageService.add({ severity: 'warn', summary: 'Invalid', detail: 'Enter a positive quantity to add.' });
      return;
    }

    const newTotal = (Number(row.qtycotton) || 0) + inc;

    const payload = { id: row.id, qtycotton: newTotal };
    this.storageService.updateStorage2Qty(payload).subscribe({
      next: (res: any) => {
        row.qtycotton = res.qtycotton ?? newTotal;
        row.qtykg = res.qtykg ?? (row.qtycotton * 10);
        row.qtyg = res.qtyg ?? (row.qtykg * 1000);
        row.addedqty = (Number(row.addedqty) || 0) + inc;
        // Log added qty
        this.storageService.addQtyLog2({
          entity: 'RAW',
          entity_id: row.id,
          addedqty: inc,
          remark: this.addQtyRemark,
          user: this.userFullName,
        }).subscribe({ next: () => {}, error: () => {} });
        this.messageService.add({ severity: 'success', summary: 'Updated', detail: 'Quantity added.' });
        this.cancelAddQtyDialog();
      },
      error: () => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to add quantity.' });
      },
    });
  }

  openQtyHistory(row: any) {
    this.qtyHistoryTitle = `${row.itemname} - RAW (ID ${row.id})`;
    this.qtyHistoryVisible = true;
    this.qtyHistoryLoading = true;
    this.storageService.getQtyLogs2('RAW', row.id).subscribe({
      next: (rows) => {
        this.qtyHistoryRows = rows || [];
        this.qtyHistoryLoading = false;
      },
      error: () => {
        this.qtyHistoryRows = [];
        this.qtyHistoryLoading = false;
      }
    });
  }
  

  transferItem(row: any) {
    // Validations similar to addStorageItem
    if (!row.transferQty || row.transferQty <= 0) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Validation Failed',
        detail: 'Please enter a valid quantity to transfer.',
      });
      return;
    }

    if (row.transferQty > row.qtycotton) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Quantity Exceeded',
        detail: `Transfer quantity (${row.transferQty}) exceeds available stock (${row.qtycotton}).`,
      });
      return;
    }

    if (!row.location || String(row.location).trim() === '') {
      this.messageService.add({
        severity: 'warn',
        summary: 'Validation Failed',
        detail: 'Please provide a location.',
      });
      return;
    }

    const payload = {
      id: row.id,
      enteredQtyCotton: row.transferQty,
      location: row.location,
    };

    this.storageService.transferLifeSmoothi2(payload).subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: 'Transferred',
          detail: 'Transfer successful!',
        });

        // Update row locally
        row.qtycotton -= row.transferQty;
        row.qtykg = row.qtycotton * 10;
        row.qtyg = row.qtycotton * 10000;

        // Reset transfer fields
        row.transferQty = null;
        row.location = '';
      },
      error: () => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Transfer failed. Please try again later.',
        });
      },
    });
  }

  formatDateTime(date: Date): string {
    // Format as local date-time to avoid UTC shifting (e.g., IST/Dubai off-by-one)
    const pad = (n: number) => String(n).padStart(2, '0');
    const y = date.getFullYear();
    const m = pad(date.getMonth() + 1);
    const d = pad(date.getDate());
    const hh = pad(date.getHours());
    const mm = pad(date.getMinutes());
    const ss = pad(date.getSeconds());
    return `${y}-${m}-${d} ${hh}:${mm}:${ss}`; // 'YYYY-MM-DD HH:mm:ss'
  }
  formatDateTime2(date: Date): string {
    return date.toISOString().slice(0, 10);
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
        this.storageList = (data || []).map((r: any) => ({ ...r, addedqty: r.addedqty ?? 0 }));
        // Fetch cumulative addedqty sums for RAW and project onto list
        this.storageService.getQtyLogsSum2('RAW').subscribe({
          next: (rows) => {
            const sumMap = new Map<number, number>();
            (rows || []).forEach((x: any) => sumMap.set(Number(x.entity_id), Number(x.total_added) || 0));
            this.storageList = this.storageList.map((r: any) => ({ ...r, addedqty: sumMap.get(r.id) ?? r.addedqty ?? 0 }));
          },
          error: () => {}
        });
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
