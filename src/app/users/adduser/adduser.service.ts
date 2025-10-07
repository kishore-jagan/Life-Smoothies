import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { catchError, Observable, throwError } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AdduserService {

  private apiUrl = 'http://localhost/api/index.php?action=';
  constructor(private http: HttpClient) { }

  addUser(payload: any): Observable<any> {
    return this.http.post(`${this.apiUrl}addUser`, payload).pipe(
      catchError((error) => throwError(() => error))
    );
  }

  fetchUsers(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}fetchAllUsers`);
  }

  deleteUser(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/deleteUser/${id}`);
  }

  fetchUserById(id: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/getUser/${id}`);
  }

  checkuser(user_name: any, email: any) {
    const body = { user_name, email };
    return this.http.post<any[]>(`${this.apiUrl}check`, body);
  }

  get_roles(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}getroles`);
  }

  get_counts(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}getCounts`);
  }

  updateUser(id: number, payload: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/users/${id}`, payload).pipe(
      catchError((error) => throwError(() => error))
    );
  }

  getUserById(id: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}getUserDetails&id=${id}`);
  }

  // Driver API methods
  getDrivers(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}getDrivers`);
  }

  addDriver(payload: any): Observable<any> {
    return this.http.post(`${this.apiUrl}addDriver`, payload).pipe(
      catchError((error) => throwError(() => error))
    );
  }

  updateDriver(id: number, payload: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/updateDriver/${id}`, payload).pipe(
      catchError((error) => throwError(() => error))
    );
  }

  deleteDriver(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/deleteDriver/${id}`).pipe(
      catchError((error) => throwError(() => error))
    );
  }
}
