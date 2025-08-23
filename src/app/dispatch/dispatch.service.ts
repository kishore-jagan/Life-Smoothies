import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

export interface preDispatchRecord {
  id: number;
  driver_name: string;
  status: string;
  dispatch_date: string; // Use string or Date type based on your need
  items: Item[];
}

export interface Item {
  item_id: number;
  smoothie_name: string;
  transfer_qty: number;
  one_qty_g: number;
  totalShases: number;
  location: string;
  returns?: number;
}

@Injectable({
  providedIn: 'root',
})
export class DispatchService {
  private apiUrl = 'http://localhost:3000/api/';
  constructor(private http: HttpClient) {}

  preDispatch(payload: any): Observable<any> {
    return this.http.post(`${this.apiUrl}preDispatch`, payload);
  }

  getPreDispatches(): Observable<preDispatchRecord[]> {
    return this.http.get<preDispatchRecord[]>(`${this.apiUrl}getPreDispatches`);
  }

  completeDispatch(payload: any): Observable<any> {
    return this.http.post(`${this.apiUrl}completeDispatch`, payload);
  }

}
