import { Injectable } from '@angular/core';
import { CanActivate, Router, ActivatedRouteSnapshot } from '@angular/router';
import { AclService } from '../users/acl-service/acl.service';
import { SessionService } from '../users/session-service/session.service';

@Injectable({
  providedIn: 'root',
})
export class AuthGuard implements CanActivate {
  constructor(
    private router: Router,
    private acl: AclService,
    private sessionService: SessionService
  ) {}

  canActivate(route: ActivatedRouteSnapshot): boolean {
    if (!this.sessionService.isLoggedIn()) {
      this.router.navigate(['/auth']);
      return false;
    }

    const path = route.routeConfig?.path;
    if (path && !this.acl.canRead(this.mapPathToPage(path))) {
      this.router.navigate(['/base']);
      return false;
    }

    return true;
  }

  private mapPathToPage(path: string): string {
    const map: any = {
      'base': 'Dashboard',
      // 'admin': 'Data Health',
    };
    return map[path] || path;
  }

}