import { Component, OnInit } from '@angular/core';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { ToastrModule, ToastrService } from 'ngx-toastr';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { DashboardComponent } from '../dashboard/dashboard.component';
import { StoragehouseComponent } from '../storagehouse/storagehouse.component';
import { MainhouseComponent } from '../mainhouse/mainhouse.component';
import { DispatchComponent } from '../dispatch/dispatch.component';
import { ProductionComponent } from '../production/production.component';
import { Storagehouse2Component } from '../storagehouse2/storagehouse2.component';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [
    ToastrModule,
    RouterModule,
    SidebarComponent,
    DashboardComponent,
    StoragehouseComponent,
    Storagehouse2Component,
    MainhouseComponent,
    DispatchComponent,
    ProductionComponent,
  ],
  templateUrl: './layout.component.html',
  styleUrl: './layout.component.css',
})
export class LayoutComponent implements OnInit {
  selectedIndex: number = 0;
  getScreenSize() {
    return { width: window.innerWidth, height: window.innerHeight };
  }

  constructor(private toast: ToastrService) {}
  ngOnInit(): void {
    // const scren = this.getScreenSize();
    this.selectedIndex = 0;
    // this.toast.success(`width: ${scren.width}`, `height: ${scren.height}`);
  }
}
