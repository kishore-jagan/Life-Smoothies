import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ToggleButtonModule } from 'primeng/togglebutton';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { User, UsersService } from '../users.service';
import { DynamicDialogConfig, DynamicDialogRef } from 'primeng/dynamicdialog';

@Component({
  selector: 'app-popup',
  imports: [CommonModule, ToggleButtonModule, FormsModule, ToggleSwitchModule],
  templateUrl: './popup.component.html',
  styleUrl: './popup.component.css'
})
export class PopupComponent {

  @Input() user!: User;
  
  constructor(public ref: DynamicDialogRef, public config: DynamicDialogConfig, private usersService: UsersService) {
    this.user = this.config.data.user;
  }

  closeDialog() {
    this.ref.close();
  }

toggleStatus(event: any) {
  const newStatus = event.checked; // true or false

  this.usersService.updateUserStatus(this.user.id, newStatus).subscribe({
    next: (res) => {
      this.user.status = newStatus;
      console.log("User status updated:", res);
    },
    error: (err) => {
      console.error("Failed to update user status:", err);
    }
  });
}

}
