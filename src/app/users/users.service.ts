import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, BehaviorSubject, catchError, throwError } from 'rxjs';

export interface Parameter {
  id: number;
  name: string;
}

export interface ParameterCategory {
  key: 'wave' | 'wind' | 'tide' | 'current';
  value: Parameter[];
}

export interface Permission {
  page: string;
  perms: {
    R: boolean;
    W: boolean;
    E: boolean;
  };
}

export interface User {
  id: number;
  fullName: string;
  username: string;
  email: string;
  designation: string;
  role: string;
  is_admin: boolean;
  createdAt?: string;
  lastActive: string;
  hoursSpent: number;
  avatarInitials: string;
  access: Permission[];
  parameters: ParameterCategory[];
  status: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class UsersService {

  private apiUrl = 'http://localhost:3000/api';

  constructor(private http: HttpClient) { }

 // Get all users
 getAllUsers(): Observable<any[]> {
  return this.http.get<any[]>(`${this.apiUrl}/users/all`);
}

// Delete user by ID
deleteUser(id: number): Observable<any> {
  return this.http.delete(`${this.apiUrl}/users/${id}`).pipe(
    catchError((error) => throwError(() => error))
  );
}

// Get user details by ID
getUserDetails(id: number): Observable<any> {
  return this.http.get<any>(`${this.apiUrl}/users/${id}/details`);
}

// Status Update Active or InActive
updateUserStatus(id: number, status: boolean): Observable<any> {
  return this.http.put(`${this.apiUrl}/users/${id}/status`, { status }).pipe(
    catchError((error) => throwError(() => error))
  );
}

// Get currently logged-in user
getActiveUsers() {
  return this.http.get<any>(`${this.apiUrl}/currect_login`);
}

// Edit User ID
private editingUserId: number | null = null;
private tabIndexSource = new BehaviorSubject<number>(0);
activeIndex$ = this.tabIndexSource.asObservable();

// Set the ID when clicking Edit
setEditingUserId(id: number) {
  this.editingUserId = id;
}

// Get the ID when AddUserFormComponent opens
getEditingUserId(): number | null {
  return this.editingUserId;
}

// Optional: clear the ID after use
clearEditingUserId() {
  this.editingUserId = null;
}

// Change the active index after editing
setActiveIndex(index: number) {
  this.tabIndexSource.next(index);
}
}

