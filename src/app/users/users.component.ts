import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AdduserComponent } from './adduser/adduser.component';
import { ListComponent } from './list/list.component';
import { RoleComponent } from './role/role.component';
import { UsersService } from './users.service';

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [CommonModule, FormsModule, AdduserComponent, ListComponent, RoleComponent],
  templateUrl: './users.component.html',
  styleUrl: './users.component.css'
})
export class UsersComponent {

  
  constructor(private userService: UsersService) { }

  activeIndex = 0;  // Default: Users
  searchTerm: string = '';

  setActive(index: number) {
    this.activeIndex = index;
  }

  ngOnInit() {
    this.userService.activeIndex$.subscribe(index => {
      this.activeIndex = index;
    });
  }

  onSearch() {
    // Optional: central logic for search tracking
    console.log(`Searching for "${this.searchTerm}" in section ${this.activeIndex}`);
  }

}
