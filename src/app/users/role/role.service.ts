import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

export interface Role {
  id?: number;
  name: string;
  description: string;
  permissions: { [key: string]: number }; // e.g., { 'Home': 7, 'Dashboard': 6 }
  permissionsArray?: any[];
  user_count?: number;
}

export interface SimpleRole {
  id: number;
  name: string;
}

@Injectable({
  providedIn: 'root'
})
export class RoleService {

  private apiUrl = 'http://localhost/api/index.php?action=';

  constructor(private http: HttpClient) { }

  getRoles(): Observable<Role[]> {
    return this.http.get<Role[]>(`${this.apiUrl}fetchRole`);
  }

  addRole(role: Role): Observable<Role> {
    return this.http.post<Role>(`${this.apiUrl}addRole`, role);
  }

  updateRole(id: number, role: Role): Observable<Role> {
    return this.http.put<Role>(`${this.apiUrl}updateRole&id=${id}`, role);
  }

  deleteRole(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}deleteRole&id=${id}`);
  }
}
