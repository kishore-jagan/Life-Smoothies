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
  category?: string | null;
  itemdesc?: string | null;
}

@Injectable({
  providedIn: 'root',
})
export class IngredientService {
  private apiUrl = 'http://localhost:8080/api/index.php?action=';
  constructor(private http: HttpClient) {}
  saveSmoothie(smoothie: Smoothie): Observable<any> {
    return this.http.post(`${this.apiUrl}postSmoothie`, smoothie);
  }

  getSmoothies(): Observable<Smoothie[]> {
    return this.http.get<Smoothie[]>(`${this.apiUrl}getSmoothies`);
  }
}
