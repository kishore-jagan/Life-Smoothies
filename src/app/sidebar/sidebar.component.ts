import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { LayoutComponent } from '../layout/layout.component';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.css',
})
export class SidebarComponent implements OnInit {
  selectedIndex: number = 0;
  
  constructor(private lay: LayoutComponent, private router: Router) {}
  
  // Method to set the selected index
  selectOption(index: number) {
    this.lay.selectedIndex = index;
    this.selectedIndex = this.lay.selectedIndex;
  }
  
  // Logout functionality
  logout() {
    // Clear any stored user data
    localStorage.removeItem('userToken');
    localStorage.removeItem('userData');
    sessionStorage.clear();
    
    // Navigate to login page
    this.router.navigate(['/login']);
  }
  
  ngOnInit(): void {
    this.selectOption(0);
  }
}
