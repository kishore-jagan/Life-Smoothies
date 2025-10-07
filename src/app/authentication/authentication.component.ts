import { Component, OnInit } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { InputIconModule } from 'primeng/inputicon';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ToastrModule, ToastrService } from 'ngx-toastr';
import { AuthService } from './auth.service';
import { SessionService } from '../users/session-service/session.service';
// import { NgForm } from '@angular/forms';
@Component({
  selector: 'app-authentication',
  imports: [ FormsModule, CommonModule,
    InputTextModule,
    PasswordModule,
    ButtonModule,
    CardModule,
    InputIconModule, RouterModule, ReactiveFormsModule, ToastrModule,],
  templateUrl: './authentication.component.html',
  styleUrl: './authentication.component.css',
  providers: [AuthService]
})
export class AuthenticationComponent implements OnInit {
  
  username: string = '';
  loginPassword: string = '';
  showPassword = false;
  isLoading = false;
  errorMsg = '';
  isSplashLoading = true;

  constructor( private toastr: ToastrService, private authService: AuthService, private router: Router, private sessionService: SessionService ) {}

  ngOnInit(): void {
    setTimeout(() => {
      this.isSplashLoading = false;
    }, 4000);
  }

  resetForms() {
    this.username = '';
    this.loginPassword = '';
  }
  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
  }

  login() {
    // 🔍 Validate input
    if (!this.username && !this.loginPassword) {
      this.toastr.error(
        '❌ All Fields Are Required, please try again.',
        'Access Denied',
        {
          positionClass: 'toast-bottom-right',
          progressBar: true,
          timeOut: 3500,
        }
      );
      return;
    }
   
    const cred = {
      user_name: this.username,
      password: this.loginPassword,
    };
   
    this.authService.login_user(this.username, this.loginPassword).subscribe({
      next: (res: any) => {
        console.log('Login success===:', res);
        this.toastr.success('Login successful', 'Success');
        
        // ✅ Save to SessionService so ACL can read permissions
        this.sessionService.setUser({
          id: res.user?.id,
          full_name: res.user?.full_name,
          user_name: res.user?.user_name,
          role: res.user?.role,
          permissions: res.user?.permissions || {},
          sessionId: String(res.sessionId || ''),
          loginTime: new Date().getTime(),
        });
    // 🔥 Start heartbeat
    // this.startHeartbeat(res.sessionId);
        console.log("start navigate");
        this.router.navigate(['/base']);
        console.log("stop navigate");
      },
   
      error: (error) => {
        const message = error.error?.message || 'Something went wrong';
   
        switch (error.status) {
          case 401:
            this.errorMsg = message;
            this.toastr.error(
              `❌ ${message}`,
              'Access Denied',
              { positionClass: 'toast-bottom-right', progressBar: true, timeOut: 3500 }
            );
            break;
   
          case 403:
            this.errorMsg = message;
           if (message.includes('not active')) {
              this.toastr.error(
                `🚫 ${message}`,
                'Access Denied',
                { positionClass: 'toast-bottom-right', progressBar: true, timeOut: 5000 }
              );
            }
            break;
   
          default:
            this.errorMsg = 'Something went wrong. Please try again.';
            this.toastr.error(
              this.errorMsg,
              `Error ${error.status}`,
              { positionClass: 'toast-bottom-right', progressBar: true, timeOut: 3500 }
            );
        }}
    });
   
    this.resetForms();
  }

}
