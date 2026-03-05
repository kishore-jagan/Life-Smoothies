import { Injectable } from '@angular/core';

export interface UserSession {
  id: number;
  full_name?: string;
  user_name: string;
  role: string;
  permissions: Record<string, number>;
  sessionId: string;
  loginTime: number;
}

@Injectable({
  providedIn: 'root'
})
export class SessionService {

  private currentUser: UserSession | null = null;

  constructor() {
    const saved = sessionStorage.getItem('currentUser');
    // console.log('saved', saved);
    if (saved) {
      this.currentUser = JSON.parse(saved);
    }
  }

  setUser(user: UserSession) {
    this.currentUser = user;
    sessionStorage.setItem('currentUser', JSON.stringify(user));
  }

  getUser(): UserSession | null {
    return this.currentUser;
  }

  getPermissions(): Record<string, number> {
    return this.currentUser?.permissions || {};
  }

  clearUser() {
    this.currentUser = null;
    sessionStorage.removeItem('currentUser');
  }

  isLoggedIn(): boolean {
    return !!this.currentUser;
  }
}
