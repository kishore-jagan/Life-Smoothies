import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { InputIconModule } from 'primeng/inputicon';

@Component({
  selector: 'app-authentication',
  imports: [ FormsModule,
    InputTextModule,
    PasswordModule,
    ButtonModule,
    CardModule,
    InputIconModule],
  templateUrl: './authentication.component.html',
  styleUrl: './authentication.component.css'
})
export class AuthenticationComponent {
  
  isSignUp = false;

  toggleSignUp() {
    this.isSignUp = !this.isSignUp;
  }

}
