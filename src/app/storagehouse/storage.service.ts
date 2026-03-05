import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

export interface StorageItem {
  id: number;
  live: string;
  itemname: string;
  description: string;
  itemtype?: string;
  lotno: string;
  productiondate: string;
  expirydate: string;
  qtycotton: number;
  qtykg: number;
  qtyg: number;
  supplier: string;
  truckno: string;
  location: string;
}

export interface LifesmoothieModel {
  id: number;
  live: string;
  item_name: string;
  description: string;
  lot_no: string;
  production_date: string;
  expiry_date: string;
  qty_cotton: number;
  qty_kg: number;
  qty_g: number;
  supplier: string;
  truck_no: string;
  location: string;
}

export interface SmoothieProduction {
  id: number; // Unique identifier for the smoothie production record
  category: string;
  smoothie_name: string; // Name of the smoothie
  ingredients: Ingredient[]; // Array of ingredients used in the smoothie
  rack: string; // Rack associated with the production
  entered_qty: number; // The common quantity entered by the user
  one_qty_g: number; // Quantity for a single smoothie in grams
  total_qty_g: number; // Total quantity used (entered_qty * one_qty_g)
  slices: number; // Number of slices based on total quantity
  cotton: number; // Number of cottons based on slices
  created_at: string; // Timestamp for when the record was created (ISO string format)
  itemdesc?: string; // Description saved with production
  production_date?: string;
  expiry_date?: string;
}

export interface Ingredient {
  name: string;
  qty: number;
  life_id: string;
}

@Injectable({
  providedIn: 'root',
})
export class StorageService {
  private apiUrl = 'http://localhost:8080/api/index.php?action=';
  constructor(private http: HttpClient) {}

  addStorageItem(item: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}postStorage`, item);
  }

  addStorageItem2(item: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}postStorage2`, item);
  }
  getAllStorageItems(): Observable<StorageItem[]> {
    return this.http.get<StorageItem[]>(`${this.apiUrl}getStorageByDate`);
  }

  getStorageByDate(
    fromDate: string,
    toDate: string
  ): Observable<StorageItem[]> {
    return this.http.get<StorageItem[]>(
      `${this.apiUrl}getStorageByDate&fromDate=${fromDate}&toDate=${toDate}`
    );
  }

  // Fetch all storage items without date filtering
  getAllStorageByDate(): Observable<StorageItem[]> {
    return this.http.get<StorageItem[]>(`${this.apiUrl}getStorageByDate`);
  }

  getStorageByDate2(
    fromDate: string,
    toDate: string
  ): Observable<StorageItem[]> {
    return this.http.get<StorageItem[]>(
      `${this.apiUrl}getStorageByDate2&fromDate=${fromDate}&toDate=${toDate}`
    );
  }


  getLifeSmoothieDate(
    fromDate: string,
    toDate: string
  ): Observable<LifesmoothieModel[]> {
    return this.http.get<LifesmoothieModel[]>(
      `${this.apiUrl}getLifeSmoothieByDate&fromDate=${fromDate}&toDate=${toDate}`
    );
  }

  // Also expose full list (used elsewhere)
  getLifeSmoothie(): Observable<LifesmoothieModel[]> {
    return this.http.get<LifesmoothieModel[]>(`${this.apiUrl}getLifeSmoothie`);
  }

  getSmoothieProductionByDate(
    fromDate: string,
    toDate: string
  ): Observable<SmoothieProduction[]> {
    return this.http.get<SmoothieProduction[]>(
      `${this.apiUrl}getSmoothieProductionByDate&fromDate=${fromDate}&toDate=${toDate}`
    );
  }    

  // transfer
  transferLifeSmoothi(payload: any) {
    return this.http.post(`${this.apiUrl}transferLifeSmoothi`, payload);
  }

  transferLifeSmoothi2(payload: any) {
    return this.http.post(`${this.apiUrl}transferLifeSmoothi2`, payload);
  }    

  // Inline edit: update qty for RAW storage item
  updateStorageQty(payload: { id: number; qtycotton: number }): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}updateStorageQty`, payload);
  }

  // Inline edit: update qty for Storage2 item
  updateStorage2Qty(payload: { id: number; qtycotton: number }): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}updateStorage2Qty`, payload);
  }

  // Inline edit: update cotton for FP (smoothie_production) with recomputations server-side
  updateSmoothieCotton(payload: { id: number; cotton: number }): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}updateSmoothieCotton`, payload);
  }

  // Log added quantity with remark
  addQtyLog(payload: { entity: string; entity_id: number; addedqty: number; remark?: string; user?: string }): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}addQtyLog`, payload);
  }

  // Fetch latest addedqty logs per entity_id for entity ('RAW' | 'FP')
  getQtyLogsLatest(entity: string): Observable<Array<{ id: number; entity: string; entity_id: number; addedqty: number; remark?: string; user?: string; created_at: string }>> {
    return this.http.get<Array<{ id: number; entity: string; entity_id: number; addedqty: number; remark?: string; user?: string; created_at: string }>>(
      `${this.apiUrl}getQtyLogsLatest&entity=${encodeURIComponent(entity)}`
    );
  }

  // Fetch cumulative addedqty per entity_id for entity ('RAW' | 'FP')
  getQtyLogsSum(entity: string): Observable<Array<{ entity: string; entity_id: number; total_added: number }>> {
    return this.http.get<Array<{ entity: string; entity_id: number; total_added: number }>>(
      `${this.apiUrl}getQtyLogsSum&entity=${encodeURIComponent(entity)}`
    );
  }

  // Fetch all logs by entity and entity_id
  getQtyLogs(entity: string, entityId: number): Observable<Array<{ id: number; entity: string; entity_id: number; addedqty: number; remark?: string; user?: string; created_at: string }>> {
    return this.http.get<Array<{ id: number; entity: string; entity_id: number; addedqty: number; remark?: string; user?: string; created_at: string }>>(
      `${this.apiUrl}getQtyLogs&entity=${encodeURIComponent(entity)}&entity_id=${entityId}`
    );
  }




  // Log 2 added quantity with remark
  addQtyLog2(payload: { entity: string; entity_id: number; addedqty: number; remark?: string; user?: string }): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}addQtyLog2`, payload);
  }

  // Fetch latest addedqty logs per entity_id for entity ('RAW' | 'FP')
  getQtyLogsLatest2(entity: string): Observable<Array<{ id: number; entity: string; entity_id: number; addedqty: number; remark?: string; user?: string; created_at: string }>> {
    return this.http.get<Array<{ id: number; entity: string; entity_id: number; addedqty: number; remark?: string; user?: string; created_at: string }>>(
      `${this.apiUrl}getQtyLogsLatest2&entity=${encodeURIComponent(entity)}`
    );
  }

  // Fetch cumulative addedqty per entity_id for entity ('RAW' | 'FP')
  getQtyLogsSum2(entity: string): Observable<Array<{ entity: string; entity_id: number; total_added: number }>> {
    return this.http.get<Array<{ entity: string; entity_id: number; total_added: number }>>(
      `${this.apiUrl}getQtyLogsSum2&entity=${encodeURIComponent(entity)}`
    );
  }

  // Fetch all logs by entity and entity_id
  getQtyLogs2(entity: string, entityId: number): Observable<Array<{ id: number; entity: string; entity_id: number; addedqty: number; remark?: string; user?: string; created_at: string }>> {
    return this.http.get<Array<{ id: number; entity: string; entity_id: number; addedqty: number; remark?: string; user?: string; created_at: string }>>(
      `${this.apiUrl}getQtyLogs2&entity=${encodeURIComponent(entity)}&entity_id=${entityId}`
    );
  }
}
