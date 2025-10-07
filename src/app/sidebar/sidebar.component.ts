import { CommonModule } from '@angular/common';
import { Component, HostListener, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { LayoutComponent } from '../layout/layout.component';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { SessionService } from '../users/session-service/session.service';
import { FormsModule } from '@angular/forms';
import { AclService } from '../users/acl-service/acl.service';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, HttpClientModule, FormsModule],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.css',
})
export class SidebarComponent implements OnInit {
  selectedIndex: number = 0;
  
  constructor(private lay: LayoutComponent, private router: Router, private http: HttpClient, private sessionService: SessionService, public acl: AclService) {}
  
  // Method to set the selected index
  selectOption(index: number) {
    this.lay.selectedIndex = index;
    this.selectedIndex = this.lay.selectedIndex;
  }
  ngOnInit(): void {
    this.selectOption(0);
  }


  logout() {
    console.log("bye");
    const sessionId = this.sessionService.getUser()?.sessionId;
 console.log('ksbdkjsabdkjasbdjkasbdjksbd',sessionId);
    if (sessionId) {
      this.http.post('http://localhost:3000/api/logout', { sessionId }).subscribe({
        next: () => {
          console.log("Logout successful");
          // this.toastr.success("You have been logged out", "Success");
        },
        error: (err) => {
          console.error("Logout error:", err);
        },
        complete: () => {
          // ✅ Clear only from SessionService (no need for localStorage cleanup)
          // this.stopHeartbeat(); // 🔥 Stop heartbeat
          this.sessionService.clearUser();
          this.router.navigate(['/auth']);
        },
      });
    } else {
      this.router.navigate(['/auth']);
    }
  }
 
@HostListener('window:beforeunload', ['$event'])
unloadHandler(event: Event) {
  const navEntries = performance.getEntriesByType("navigation") as PerformanceNavigationTiming[];
  const navType = navEntries[0]?.type;
 
  // Only logout if it's not a refresh, normal navigation, or back/forward
  if (navType !== 'reload' && navType !== 'navigate' && navType !== 'back_forward') {
    this.logout();
  }
}

}
