import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CardModule } from 'primeng/card';
import { CheckboxModule } from 'primeng/checkbox';
import { InputTextModule } from 'primeng/inputtext';
// removed: MultiSelectModule (parameters UI)
import { PasswordModule } from 'primeng/password';
import { SelectModule } from 'primeng/select';
// removed: ChipModule (parameters UI)
import { ButtonModule } from 'primeng/button';
import { RippleModule } from 'primeng/ripple';
import { RouterModule } from '@angular/router';
// removed: TagModule (no longer used)
import { ToastrService } from 'ngx-toastr';

import { AdduserService } from './adduser.service';
import { UsersService } from '../users.service';

// removed: ParameterCategory and parameter-related types
@Component({
  selector: 'app-adduser',
  imports: [CommonModule, FormsModule, InputTextModule, PasswordModule, SelectModule, CheckboxModule, CardModule, ButtonModule, RippleModule, RouterModule],
  templateUrl: './adduser.component.html',
  styleUrl: './adduser.component.css'
})
export class AdduserComponent implements OnInit {

  username_exists = false;
  email_exists = false;
  activeUsers: number = 0;
  inactiveUsers: number = 0;
  totalUsers: number = 0;
  totalRoles: number = 0;
  isEditMode: boolean = false;    // flag to check edit mode
  editUserId: number = 0;
  user = {
    fullName: '',
    user_name: '',
    email: '',
    designation: '',
    role: '',
    status: '',
    password: '',
    confirmPassword: ''
  };

  // Driver related properties
  isDriverEditMode: boolean = false;
  editDriverId: number = 0;
  isLoadingDrivers: boolean = false;
  drivers: any[] = [];
  driver = {
    driver_id: '',
    driver_name: '',
    truck_no: ''
  };


  roles: any[] = [];
  statuses = [
    { name: 'Active', value: '1' },
    { name: 'Inactive', value: '0' },
  ];
  roleName(): string {
    const rol = this.roles.filter(item => item.value === this.user.role);
    console.log("afafaf", rol);
    return rol[0].name;
  }
  StatusName(): string {
    const rol = this.statuses.filter(item => item.value === this.user.status);
    console.log("afafaf", rol);
    return rol[0].name;
  }
  constructor(
    private toastr: ToastrService,
    private AdduserService: AdduserService,
    private UserlistService: UsersService
  ) { }
  // removed: selectedParametersList (parameters not used)

  formErrors: { [key: string]: string } = {};
  driverErrors: { [key: string]: string } = {};

  validateField(field: string) {
    switch (field) {
      case 'fullName':
        if (this.user.fullName && this.user.fullName.length < 5) {
          this.formErrors['fullName'] = "Full Name must be 5 to 15 characters.";
        } else {
          this.formErrors['fullName'] = "";
        }
        break;

      case 'username':
        if (this.username_exists) {
          this.formErrors['username'] = "User already exists.";
        } else if (!this.user.user_name || this.user.user_name.length < 5 || this.user.user_name.length > 15) {
          this.formErrors['username'] = "Username must be 5 to 15 characters.";
        } else {
          this.formErrors['username'] = "";
        }

        break;

      case 'email':
        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!this.user.email || !emailPattern.test(this.user.email)) {
          this.formErrors['email'] = "Please enter a valid email address.";
        } else if (this.email_exists) {
          this.formErrors['email'] = "email already exist.";

        } else {
          this.formErrors['email'] = "";
        }
        break;

      case 'password':
        const passwordPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{7,15}$/;
        if (!this.user.password || !passwordPattern.test(this.user.password)) {
          this.formErrors['password'] = "Password must be 7–15 chars, include uppercase, lowercase, number & symbol.";
        } else {
          this.formErrors['password'] = "";
        }
        break;

      case 'confirmPassword':
        if (this.user.password !== this.user.confirmPassword) {
          this.formErrors['confirmPassword '] = "Confirm Password must match Password.";
        } else {
          this.formErrors['confirmPassword '] = "";
        }
        break;
    }
    // this.checkusername()
  }

  validateDriverField(field: string) {
    switch (field) {
      case 'driver_id':
        if (!this.driver.driver_id || this.driver.driver_id.trim().length === 0) {
          this.driverErrors['driver_id'] = "Driver ID is required.";
        } else {
          this.driverErrors['driver_id'] = "";
        }
        break;

      case 'driver_name':
        if (!this.driver.driver_name || this.driver.driver_name.trim().length < 2) {
          this.driverErrors['driver_name'] = "Driver name must be at least 2 characters.";
        } else {
          this.driverErrors['driver_name'] = "";
        }
        break;

      case 'truck_no':
        if (!this.driver.truck_no || this.driver.truck_no.trim().length === 0) {
          this.driverErrors['truck_no'] = "Truck number is required.";
        } else {
          this.driverErrors['truck_no'] = "";
        }
        break;
    }
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
  checkusername(field: string) {
    const user_name = this.user.user_name;
    const email = this.user.email;
    console.log(user_name, email);
    this.AdduserService.checkuser(user_name, email).subscribe({
      next: (res: any) => {
        console.log('responsecheck', res);
        console.log('responsecheck', res);
        // if(res.usernameExists == true){
        //   this.formErrors['username'] = "user already ===";
        // }else{

        // }
        this.username_exists = res.usernameExists === true;
        this.email_exists = res.emailExists === true;
        this.validateField(field);
        // if(this.email_exists ){this.validateField(field);}
      },
      error: (err) => {
        console.error('Error', err);
        alert('Failed to load data from server');
      },
    });
  }
  // removed: colorMap and getColor (parameters UI removed)


  // removed: categories, parametersByCategory, originalOrder

  // Selected parameters per category
  // selectedParameters:any = {
  //   wave: [],
  //   current: [],
  //   wind: [],
  //   tide: []
  // };

  ngOnInit() {
    this.getuserbyID();
    this.getroles();
    this.getTotalCount();
    this.loadDrivers();
  }

  getuserbyID() {
    const id = this.UserlistService.getEditingUserId();
    if (id) {
      this.isEditMode = true;
      this.editUserId = id;

      // Call API to get user details
    this.AdduserService.getUserById(id).subscribe(apiUser => {
        console.log("byu", apiUser)
        this.user.fullName = apiUser.full_name;
        this.user.user_name = apiUser.user_name;
        this.user.email = apiUser.email;
        this.user.designation = apiUser.designation;
        this.user.role = apiUser.role_id;
        this.user.status = apiUser.status ? "1" : "0";
        // parameters removed from UI; ignore any parameters from API
        this.UserlistService.clearEditingUserId();
      });
    }
  }
  onSubmit() {
    if (this.isEditMode && this.editUserId) {
      this.updateUser();
    } else {
      this.addUser();
    }
  }

  getroles() {
    this.AdduserService.get_roles()
      .subscribe({
        next: (res) => {
          // assign to roles array for dropdown
          this.roles = res.map(r => ({
            name: r.name, // display name in dropdown
            value: r.id        // actual value bound to ngModel
          }));
          console.log('Roles loaded:', this.roles);
        },
      })
  }
  addUser() {
    if (this.user.password !== this.user.confirmPassword) {
      return;
    }
    if (this.user.user_name && this.user.email && this.user.password) {
      const payload = {
        full_name: this.user.fullName,
        user_name: this.user.user_name,
        password: this.user.password,
        email: this.user.email,
        designation: this.user.designation,
        role_id: this.user.role,
        status: this.user.status
      };

      this.AdduserService.addUser(payload)
        .subscribe({
          next: (res) => {
            console.log('Data sent to server:', res);
            this.toastr.success('Data successfully sent to server!', 'Success');
            this.resetForm();
            this.formErrors = {};
          },
          error: (err) => {
            if (err.status === 201) {
              console.warn('Created');
              this.toastr.success('Form submitted successfully!', 'Success');
              this.resetForm();
            } else {
              console.error('API error:', err);
              this.toastr.error(
                'Something went wrong while sending data to the server',
                'Validation Error'
              );
            }
          },
        });
      // this.signin()
    } else {
      this.toastr.error('All Fields Are Required', 'Validation Error');
    }

  }
  updateUser() {
    if (this.user.password && this.user.password !== this.user.confirmPassword) {
      this.toastr.error('Passwords do not match', 'Validation Error');
      return;
    }

    if (this.user.user_name && this.user.email) {
      const payload: any = {
        full_name: this.user.fullName,
        user_name: this.user.user_name,
        email: this.user.email,
        designation: this.user.designation,
        role_id: this.user.role,
        status: this.user.status
      };
      console.log("role", payload)

      // only send password if user entered a new one
      if (this.user.password) {
        payload.password = this.user.password;
      }

      this.AdduserService.updateUser(this.editUserId, payload)   // pass the id here
        .subscribe({
          next: (res) => {
            console.log('User updated:', res);
            this.toastr.success('User updated successfully!', 'Success');
          },
          error: (err) => {
            console.error('API error:', err);
            this.toastr.error(
              'Something went wrong while updating the user',
              'Update Error'
            );
          },
        });
    } else {
      this.toastr.error('Username and Email are required', 'Validation Error');
    }
    this.isEditMode=false;
    this.UserlistService.setActiveIndex(0);
  }

  resetForm() {
    this.user = {
      fullName: '',
      user_name: '',
      email: '',
      designation: '',
      role: '',
      status: '',
      password: '',
      confirmPassword: ''
    };
    // removed: parameter resets
  }

  // removed: selectedParameters, parameterMessages, updateSelectedMessage

  // Driver methods
  loadDrivers() {
    this.isLoadingDrivers = true;
    this.AdduserService.getDrivers().subscribe({
      next: (res: any) => {
        this.drivers = res;
        this.isLoadingDrivers = false;
      },
      error: (err) => {
        console.error('Error loading drivers:', err);
        this.isLoadingDrivers = false;
        this.toastr.error('Failed to load drivers', 'Error');
      }
    });
  }

  onDriverSubmit() {
    // Validate all fields
    this.validateDriverField('driver_id');
    this.validateDriverField('driver_name');
    this.validateDriverField('truck_no');

    // Check if there are any errors
    const hasErrors = Object.values(this.driverErrors).some(error => error !== '');
    if (hasErrors) {
      this.toastr.error('Please fix the validation errors', 'Validation Error');
      return;
    }

    if (this.isDriverEditMode && this.editDriverId) {
      this.updateDriver();
    } else {
      this.addDriver();
    }
  }

  addDriver() {
    const payload = {
      driver_id: this.driver.driver_id,
      driver_name: this.driver.driver_name,
      truck_no: this.driver.truck_no
    };

    this.AdduserService.addDriver(payload).subscribe({
      next: (res) => {
        console.log('Driver added:', res);
        this.toastr.success('Driver added successfully!', 'Success');
        this.resetDriverForm();
        this.loadDrivers();
      },
      error: (err) => {
        console.error('Error adding driver:', err);
        this.toastr.error('Failed to add driver', 'Error');
      }
    });
  }

  updateDriver() {
    const payload = {
      driver_id: this.driver.driver_id,
      driver_name: this.driver.driver_name,
      truck_no: this.driver.truck_no
    };

    this.AdduserService.updateDriver(this.editDriverId, payload).subscribe({
      next: (res) => {
        console.log('Driver updated:', res);
        this.toastr.success('Driver updated successfully!', 'Success');
        this.resetDriverForm();
        this.loadDrivers();
      },
      error: (err) => {
        console.error('Error updating driver:', err);
        this.toastr.error('Failed to update driver', 'Error');
      }
    });
  }

  editDriver(driver: any) {
    this.isDriverEditMode = true;
    this.editDriverId = driver.id;
    this.driver = {
      driver_id: driver.driver_id,
      driver_name: driver.driver_name,
      truck_no: driver.truck_no
    };
  }

  deleteDriver(driverId: number) {
    if (confirm('Are you sure you want to delete this driver?')) {
      this.AdduserService.deleteDriver(driverId).subscribe({
        next: (res) => {
          console.log('Driver deleted:', res);
          this.toastr.success('Driver deleted successfully!', 'Success');
          this.loadDrivers();
        },
        error: (err) => {
          console.error('Error deleting driver:', err);
          this.toastr.error('Failed to delete driver', 'Error');
        }
      });
    }
  }

  resetDriverForm() {
    this.driver = {
      driver_id: '',
      driver_name: '',
      truck_no: ''
    };
    this.driverErrors = {};
    this.isDriverEditMode = false;
    this.editDriverId = 0;
  }

}
