import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private apiUrl = 'http://192.168.0.15/api/index.php?action=';

  constructor(private http: HttpClient) {}

  login_user(user_name: string, password: string) {
    const cred = { user_name, password };
    return this.http.post<any>(`${this.apiUrl}login`, cred);
  }
}
