import { Injectable } from '@angular/core';
import { SessionService } from '../session-service/session.service';

@Injectable({
  providedIn: 'root'
})
export class AclService {

  constructor( private sessionService: SessionService ) { }

  canRead(page: string): boolean {
    return this.hasPermission(page, 4);
  }

  canWrite(page: string): boolean {
    return this.hasPermission(page, 2);
  }

  canExecute(page: string): boolean {
    return this.hasPermission(page, 1);
  }

  private hasPermission(page: string, flag: number): boolean {
    const permissions = this.sessionService.getPermissions();
    const value = permissions[page];
    if (!value) return false;
    return (value & flag) === flag;
  }
}
