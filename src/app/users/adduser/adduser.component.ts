import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CardModule } from 'primeng/card';
import { CheckboxModule } from 'primeng/checkbox';
import { InputTextModule } from 'primeng/inputtext';
import { MultiSelectModule } from 'primeng/multiselect';
import { PasswordModule } from 'primeng/password';
import { SelectModule } from 'primeng/select';
import { ChipModule } from 'primeng/chip';
import { ButtonModule } from 'primeng/button';
import { RippleModule } from 'primeng/ripple';
import { RouterModule } from '@angular/router';
import { TagModule } from 'primeng/tag';
import { ToastrService } from 'ngx-toastr';

import { AdduserService } from './adduser.service';
import { UsersService } from '../users.service';

type ParameterCategory = 'wave' | 'current' | 'wind' | 'tide';
@Component({
  selector: 'app-adduser',
  imports: [CommonModule, FormsModule, InputTextModule, PasswordModule, SelectModule, CheckboxModule, CardModule, MultiSelectModule, ChipModule, TagModule, ButtonModule, RippleModule, RouterModule],
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
  get selectedParametersList(): string[] {
    return Object.values(this.selectedParameters || {}).flat();
  }

  formErrors: { [key: string]: string } = {};

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
  colorMap: Record<string, string> = {
    wave: 'bg-gradient-to-r from-blue-500 to-purple-500',
    wind: 'bg-gradient-to-r from-green-400 to-teal-500',
    current: 'bg-gradient-to-r from-orange-400 to-pink-500',
    tide: 'bg-gradient-to-r from-purple-400 to-indigo-500'
  };

  getColor(param: string): string {
    return this.colorMap[param.toLowerCase()] || 'bg-gray-400';
  }


  readonly categories: ParameterCategory[] = ['wave', 'current', 'wind', 'tide'];

  parametersByCategory: Record<ParameterCategory, { name: string; value: string }[]> = {
    wave: [
      { name: 'Significant Wave Height', value: 'SWH' },
      { name: 'Mean Wave Period', value: 'MWP' },
      { name: 'Peak Wave Period', value: 'PWP' },
      { name: 'Primary Sweel Wave', value: 'PSW' },
      { name: 'Secondary Sweel Wave', value: 'SSW' },
      { name: 'Primary Sweel Period', value: 'PSP' },
      { name: 'Secondary Sweel Period', value: 'SSP' },
      { name: 'Primary Sweel Direction', value: 'PSD' },
      { name: 'Secondary Sweel Direction', value: 'SSD' },
      { name: 'Wind Wave Height', value: 'WWH' },
      { name: 'Wind Wave Period', value: 'WWP' },
      { name: 'Wind Wave Direction', value: 'WWD' },
      { name: 'Wave Direction', value: 'WD' }
    ],
    current: [
      { name: 'Current Speed', value: 'CS' },
      { name: 'Current Direction', value: 'CD' },
      { name: 'Pressure', value: 'PRE' },
      { name: 'Temperature', value: 'TEMP' },
      { name: 'Battery', value: 'BAT' }
    ],
    wind: [
      { name: 'Wind Speed', value: 'WS' },
      { name: 'Wind Direction', value: 'WD' },
      { name: 'Wind Gust', value: 'WG' }
    ],
    tide: [
      { name: 'Water Level', value: 'TH' }
    ]
  };
  originalOrder = (a: any, b: any): number => {
    return 0; // no sorting, keep original order
  };

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
        this.selectedParameters = apiUser.parameters;
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
        status: this.user.status,
        parameters: this.selectedParameters,   // ✅ wave/current/wind/tide

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
        status: this.user.status,
        parameters: this.selectedParameters
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
    this.selectedParameters.wave = [];
    this.selectedParameters.current = [];
    this.selectedParameters.wind = [];
    this.selectedParameters.tide = [];

  }

  selectedParameters: Record<ParameterCategory, any[]> = {
    wave: [],
    current: [],
    wind: [],
    tide: []
  };

  parameterMessages: Record<ParameterCategory, string> = {
    wave: '',
    current: '',
    wind: '',
    tide: ''
  };
  updateSelectedMessage(category: ParameterCategory) {
    const selected = this.selectedParameters[category] || [];
    if (selected.length > 0) {
      this.parameterMessages[category] = selected.map((p: any) => p.name).join(', ');
    } else {
      this.parameterMessages[category] = '';
    }
  }

}
