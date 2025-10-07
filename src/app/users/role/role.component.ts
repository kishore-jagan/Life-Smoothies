import { CommonModule } from '@angular/common';
import { Component, Input, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MultiSelect, MultiSelectModule } from 'primeng/multiselect';
import { Role, RoleService } from './role.service';

@Component({
  selector: 'app-role',
  imports: [CommonModule, FormsModule, MultiSelectModule],
  templateUrl: './role.component.html',
  styleUrl: './role.component.css'
})
export class RoleComponent implements OnInit{

  @Input() search: string = '';

  roles: Role[] = [];
  pages = ['Dashboard', 'Storage House', 'Life Smoothie House', 'Production', 'Dispatch', 'Forecast', 'User Management'];

  // Permissions matrix for each page (Read, Write, Execute)
  allPermissions = this.pages.flatMap(page => [
    { label: `${page} - Read`, value: { page, bit: 4 } },     // 100
    { label: `${page} - Write`, value: { page, bit: 2 } },    // 010
    { label: `${page} - Execute`, value: { page, bit: 1 } }   // 001
  ]);

  newRole: Role = {
    name: '',
    description: '',
    permissions: {}
  };
  editingRoleId: number | null = null;

  constructor(private roleService: RoleService) { }

  ngOnInit() {
    this.loadRoles();
  }

  loadRoles() {
    this.roleService.getRoles().subscribe(data => this.roles = data);
  }

  getPermissionLabels(value: number): string[] {
    const labels: string[] = [];
    if (value & 4) labels.push("R");
    if (value & 2) labels.push("W");
    if (value & 1) labels.push("E");
    return labels;
  }

  saveRole() {
    const formattedPermissions: { [key: string]: number } = {};

    this.newRole.permissionsArray?.forEach((perm: any) => {
      const page = perm.page || perm.value?.page;
      const bit = perm.bit || perm.value?.bit;
      if (!page) return;

      if (!formattedPermissions[page]) {
        formattedPermissions[page] = 0;
      }
      formattedPermissions[page] |= bit;
    });

    const payload = {
      name: this.newRole.name,
      description: this.newRole.description,
      permissions: formattedPermissions
    };

    if (this.editingRoleId) {

      this.roleService.updateRole(this.editingRoleId, payload).subscribe(
        (res) => {
          console.log("Role updated successfully", res);
          this.loadRoles();
          this.resetForm();
        },
        (err) => console.error("Error updating role", err)
      );
    } 
    
    else {

      this.roleService.addRole(payload).subscribe(
        (res) => {
          console.log("Role added successfully", res);
          this.loadRoles();
          this.resetForm();
        },
        (err) => console.error("Error adding role", err)
      );
    }
  }

  editRole(role: Role) {
    if (role.name === 'mode') {
      console.log('Admin cannot be edited');
    }else{
      this.newRole = {
        id: role.id,
        name: role.name,
        description: role.description,
        permissions: role.permissions,
        permissionsArray: this.mapPermissionsToArray(role.permissions) // convert back for UI
      };
      this.editingRoleId = role.id!;
    }
  }

  resetForm() {
    this.newRole = { name: '', description: '', permissions: {} };
    this.editingRoleId = null;
  }

private mapPermissionsToArray(permissions: { [key: string]: number }) {
  const permsArray: any[] = [];
  for (const [page, bits] of Object.entries(permissions || {})) {
    if (bits & 4) {
      permsArray.push({ label: `${page} - Read`, value: { page, bit: 4 } });
    }
    if (bits & 2) {
      permsArray.push({ label: `${page} - Write`, value: { page, bit: 2 } });
    }
    if (bits & 1) {
      permsArray.push({ label: `${page} - Execute`, value: { page, bit: 1 } });
    }
  }
  return permsArray;
}

  deleteRole(roleId: number) {
    if (!confirm('Are you sure you want to delete this role?')) {
      return;
    }

    if (roleId === 1) {
      console.log('Admin cannot be deleted');
    }else{
      this.roleService.deleteRole(roleId).subscribe({
        next: (res: any) => {
          console.log("Role deleted successfully", res);
  
          // Refresh your roles list after deletion
          this.loadRoles();
        },
        error: (err: any) => {
          console.error("Error deleting role", err);
        }
      });
    }
  }
}
