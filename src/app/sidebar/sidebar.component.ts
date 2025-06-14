import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { LayoutComponent } from '../layout/layout.component';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.css',
})
export class SidebarComponent implements OnInit {
  selectedIndex: number = 5;
  // No option selected by default
  constructor(private lay: LayoutComponent) {}
  // Method to set the selected index
  selectOption(index: number) {
    this.lay.selectedIndex = index;
    this.selectedIndex = this.lay.selectedIndex;
  }
  ngOnInit(): void {
    this.selectOption(4);
  }
}
