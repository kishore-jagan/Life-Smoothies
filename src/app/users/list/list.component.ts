import { CommonModule } from '@angular/common';
import { Component, OnInit, Input } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { MenuModule } from 'primeng/menu';
import { SelectModule } from 'primeng/select';
import { TooltipModule } from 'primeng/tooltip';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';

import { DialogService, DynamicDialogRef } from 'primeng/dynamicdialog';
import { ConfirmationService, MessageService } from 'primeng/api';
import { RoleService, SimpleRole } from '../role/role.service';
import { ParameterCategory, User, UsersService } from '../users.service';
import { AdduserService } from '../adduser/adduser.service';
import { PopupComponent } from '../popup/popup.component';

@Component({
  selector: 'app-list',
  imports: [CommonModule, FormsModule, TableModule, ButtonModule, MenuModule, SelectModule, TooltipModule, ToastModule, ConfirmDialogModule],
  providers: [DialogService, ConfirmationService, MessageService],
  templateUrl: './list.component.html',
  styleUrl: './list.component.css'
})
export class ListComponent implements OnInit {
  
  ref: DynamicDialogRef | undefined;

  users: any[] = [];
  roles: SimpleRole[] = [];
  selectedRole: string = 'All';
  filteredUsers: any[] = [];
  activeIndex: number = 0;
  activeUsers: number = 0;
  inactiveUsers: number = 0;
  totalUsers: number = 0;
  totalRoles: number = 0;
  logedUsers: any;


  @Input() search = '';

  constructor(
    private dialogService: DialogService,
    private usersService: UsersService,
    private confirmationService: ConfirmationService,
    private messageService: MessageService,
    private roleService: RoleService,
    private userService: UsersService,
    private AdduserService: AdduserService

  ) { }

  ngOnInit(): void {
    this.loadUsers();
    this.loadRoles();
    this.getTotalCount();
    this.getlogin();
  }

  getTotalCount() {
    this.AdduserService.get_counts().subscribe({
      next: (res: any) => {
        console.log("Counts response:", res);
        this.activeUsers = res.active_users;
        this.inactiveUsers = res.inactive_users;
        this.totalUsers = res.total_users;
        this.totalRoles = res.total_roles;
      },
      error: (err) => {
        console.error("Error fetching counts:", err);
      }
    });
  }

  loadUsers() {
    this.usersService.getAllUsers().subscribe({
      next: (data) => {
        // Adapt backend field names to your UI
        this.users = data.map(u => ({
          id: u.user_id,
          name: u.full_name,
          username: u.user_name,
          email: u.email,
          role: u.role_name,
          designation: u.designation,
          status: u.status === true ? 'Active' : 'Inactive',
          lastActive: u.login_time ? new Date(u.login_time).toLocaleString() : 'N/A'
        }));
        this.applyFilter();
      },
      error: (err) => {
        console.error('Failed to load users:', err);
      }
    });
  }

  loadRoles() {
    this.roleService.getRoles().subscribe((res: any) => {
      this.roles = res.map((r: any) => ({ id: r.id, name: r.name }));
      this.roles.unshift({ id: 0, name: 'All' }); // UI entry
      // keep 'All' selected by default
      this.selectedRole = 'All';
      this.applyFilter();
    });
  }

  // call this whenever users or selectedRole changes
  applyFilter(): void {
    if (!this.selectedRole || this.selectedRole === 'All') {
      this.filteredUsers = this.users.slice();
    } else {
      this.filteredUsers = this.users.filter(u => u.role === this.selectedRole);
    }
  }

  filterByRole(): void {
    this.applyFilter();
  }

  viewUser(user: any) {
    this.usersService.getUserDetails(user.id).subscribe({
      next: (data) => {
        this.ref = this.dialogService.open(PopupComponent, {
          header: `User Details`,
          width: '60vw',
          data: { user: this.adaptUser(data) }
        });
        this.ref.onClose.subscribe(() => {
          this.loadUsers();
          this.getTotalCount();
          this.getlogin();
        });
      },
      error: (err) => {
        console.error("Failed to load user details:", err);
      }
    });
  }

  getlogin() {
    this.usersService.getActiveUsers().subscribe({
      next: (res) => {
        this.logedUsers = res;
        console.log("Active users:", res);
      },
      error: (err) => {
        console.error("Failed to load active users:", err);
      }
    });
  }

  private safeParse(value: any): any {
    if (!value) return [];
    if (typeof value === 'string') {
      try {
        return JSON.parse(value);
      } catch {
        return [];
      }
    }
    return value;
  }

  private adaptUser(u: any): User {
    const rawParams = this.safeParse(u.parameters);

    return {
      id: u.id,
      fullName: u.full_name,
      username: u.user_name,
      email: u.email,
      designation: u.designation,
      role: u.role_name,
      is_admin: u.is_admin,
      lastActive: u.login_time ? new Date(u.login_time).toLocaleString() : "N/A",
      hoursSpent: u.active_hours || 0,
      avatarInitials: u.full_name ? u.full_name.charAt(0) : "?",
      access: this.parsePermissions(u.role_permissions),
      parameters: this.groupParameters(rawParams),
      status: !!u.status
    };
  }

  private groupParameters(rawParams: any): ParameterCategory[] {
    const categories: ParameterCategory[] = [
      { key: 'wave', value: [] },
      { key: 'wind', value: [] },
      { key: 'tide', value: [] },
      { key: 'current', value: [] }
    ];

    if (rawParams && typeof rawParams === 'object') {
      for (const key of Object.keys(rawParams)) {
        const target = categories.find(c => c.key === key.toLowerCase());
        if (target) {
          target.value = rawParams[key];
        }
      }
    }
    return categories;
  }

  // parse role permissions JSON into [{page, perms:{R,W,E}}]
  private parsePermissions(raw: any) {
    if (!raw) return [];
    try {
      const perms = typeof raw === "string" ? JSON.parse(raw) : raw;
      return Object.entries(perms).map(([page, mask]: any) => ({
        page,
        perms: {
          R: (mask & 4) !== 0,
          W: (mask & 2) !== 0,
          E: (mask & 1) !== 0
        }
      }));
    } catch {
      return [];
    }
  }

  editUser(u: User) {
    console.log('EDIT user', u.id);
    this.userService.setEditingUserId(Number(u.id));
    this.userService.setActiveIndex(2);
  }

  deleteUser(user: any) {
    this.confirmationService.confirm({
      message: `Are you sure you want to delete <b>${user.name}</b>?`,
      header: 'Confirm Delete',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        this.usersService.deleteUser(user.id).subscribe({
          next: () => {
            this.loadUsers();
            this.messageService.add({ severity: 'success', summary: 'Deleted', detail: 'User deleted successfully' });
            this.users = this.users.filter(u => u.id !== user.id);
          },
          error: (err) => {
            console.error('Delete failed', err);
            this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to delete user' });
          }
        });
      }
    });
  }
}
