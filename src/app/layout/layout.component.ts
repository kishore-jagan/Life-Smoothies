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
import { OverallTableComponent } from '../overall-table/overall-table.component';
import { UsersComponent } from '../users/users.component';
import { AclService } from '../users/acl-service/acl.service';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [
    RouterModule,
    SidebarComponent,
    DashboardComponent,
    StoragehouseComponent,
    Storagehouse2Component,
    MainhouseComponent,
    DispatchComponent,
    ProductionComponent,
    OverallTableComponent,
    UsersComponent,
    CommonModule,
    FormsModule
  ],
  templateUrl: './layout.component.html',
  styleUrl: './layout.component.css',
})
export class LayoutComponent implements OnInit {
  selectedIndex: number = 0;
  getScreenSize() {
    return { width: window.innerWidth, height: window.innerHeight };
  }

  constructor(private toast: ToastrService, public acl: AclService) {}
  ngOnInit(): void {
    // const scren = this.getScreenSize();
    this.selectedIndex = 1;
    // this.toast.success(`width: ${scren.width}`, `height: ${scren.height}`);
  }
}
