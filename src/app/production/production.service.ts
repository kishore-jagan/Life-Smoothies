import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

export interface Ingredient {
  name: string;
  qty: number;
  life_id: string;
}

export interface SmoothieProduction {
  id: number; // Unique identifier for the smoothie production record
  smoothie_name: string; // Name of the smoothie
  ingredients: Ingredient[]; // Array of ingredients used in the smoothie
  rack: string; // Rack associated with the production
  entered_qty: number; // The common quantity entered by the user
  one_qty_g: number; // Quantity for a single smoothie in grams
  total_qty_g: number; // Total quantity used (entered_qty * one_qty_g)
  slices: number; // Number of slices based on total quantity
  cotton: number; // Number of cottons based on slices
  created_at: string; // Timestamp for when the record was created (ISO string format)
}

export interface Driver {
  id: number;
  timestamp: string;
  driver_id: string;
  driver_name: string;
  driver_no: number;
  truck_no: string;
}

@Injectable({
  providedIn: 'root',
})
export class ProductionService {
  private apiUrl = 'http://localhost:3000/api/';
  constructor(private http: HttpClient) {}

  getSmoothieProductionByDate(
    fromDate: string,
    toDate: string
  ): Observable<SmoothieProduction[]> {
    return this.http.get<SmoothieProduction[]>(
      `${this.apiUrl}getSmoothieProductionByDate?fromDate=${fromDate}&toDate=${toDate}`
    );
  }

  getDrivers(): Observable<Driver[]> {
    return this.http.get<Driver[]>(`${this.apiUrl}getDrivers`);
  }
}
