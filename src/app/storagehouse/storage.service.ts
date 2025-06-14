import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

export interface StorageItem {
  id: number;
  live: string;
  itemname: string;
  description: string;
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

@Injectable({
  providedIn: 'root',
})
export class StorageService {
  private apiUrl = 'http://localhost:3000/api/';
  constructor(private http: HttpClient) {}

  addStorageItem(item: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}postStorage`, item);
  }

  addStorageItem2(item: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}postStorage2`, item);
  }
  getAllStorageItems(): Observable<StorageItem[]> {
    return this.http.get<StorageItem[]>(`${this.apiUrl}getStorage`);
  }

  getStorageByDate(
    fromDate: string,
    toDate: string
  ): Observable<StorageItem[]> {
    return this.http.get<StorageItem[]>(
      `${this.apiUrl}getStorageByDate?fromDate=${fromDate}&toDate=${toDate}`
    );
  }

  getStorageByDate2(
    fromDate: string,
    toDate: string
  ): Observable<StorageItem[]> {
    return this.http.get<StorageItem[]>(
      `${this.apiUrl}getStorageByDate2?fromDate=${fromDate}&toDate=${toDate}`
    );
  }

  // transferItem(payload: any) {
  //   return this.http.post(`${this.apiUrl}transferStorage`, payload);
  // }

  transferLifeSmoothi(payload: any) {
    return this.http.post(`${this.apiUrl}transferLifeSmoothi`, payload);
  }

  transferLifeSmoothi2(payload: any) {
    return this.http.post(`${this.apiUrl}transferLifeSmoothi2`, payload);
  }

  getLifeSmoothie(): Observable<LifesmoothieModel[]> {
    return this.http.get<LifesmoothieModel[]>(`${this.apiUrl}getLifeSmoothie`);
  }

  getLifeSmoothieDate(
    fromDate: string,
    toDate: string
  ): Observable<LifesmoothieModel[]> {
    return this.http.get<LifesmoothieModel[]>(
      `${this.apiUrl}getLifeSmoothieByDate?fromDate=${fromDate}&toDate=${toDate}`
    );
  }
}
