import { Component, OnInit } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { InputIconModule } from 'primeng/inputicon';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
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
    InputIconModule, RouterModule, ReactiveFormsModule, ToastModule],
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

  constructor( private messageService: MessageService, private authService: AuthService, private router: Router, private sessionService: SessionService ) {}

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
    if (!this.username?.trim() || !this.loginPassword?.trim()) {
      this.messageService.add({
        severity: 'error',
        summary: 'Access Denied',
        detail: '❌ All Fields Are Required, please try again.',
        life: 3500
      });
      return;
    }

    const cred = {
      user_name: this.username,
      password: this.loginPassword,
    };

    this.authService.login_user(this.username, this.loginPassword).subscribe({
      next: (res: any) => {
        console.log('Login success===:', res);
        this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Login successful', life: 3000 });
        
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
            this.messageService.add({ severity: 'error', summary: 'Access Denied', detail: `❌ ${message}`, life: 3500 });
            break;

          case 403:
            this.errorMsg = message;
            if (message.includes('not active')) {
              this.messageService.add({ severity: 'error', summary: 'Access Denied', detail: `🚫 ${message}`, life: 5000 });
            }
            break;

          default:
            this.errorMsg = 'Something went wrong. Please try again.';
            this.messageService.add({ severity: 'error', summary: `Error ${error.status}` , detail: this.errorMsg, life: 3500 });
        }
      }
    });

    this.resetForms();
  }


}
