import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

export interface Ingredient {
  name: string;
  qty: number;
}

export interface Smoothie {
  itemname: string;
  ingredients: Ingredient[];
}

@Injectable({
  providedIn: 'root',
})
export class IngredientService {
  private apiUrl = 'http://localhost:3000/api/';
  constructor(private http: HttpClient) {}
  saveSmoothie(smoothie: Smoothie): Observable<any> {
    return this.http.post(`${this.apiUrl}postSmoothie`, smoothie);
  }

  getSmoothies(): Observable<Smoothie[]> {
    return this.http.get<Smoothie[]>(`${this.apiUrl}getSmoothies`);
  }
}
