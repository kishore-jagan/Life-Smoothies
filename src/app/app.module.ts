import { NgModule } from '@angular/core';
import { AppComponent } from './app.component';
import { BrowserModule } from '@angular/platform-browser';
import { ToastrModule } from 'ngx-toastr';
import {
  BrowserAnimationsModule,
  NoopAnimationsModule,
} from '@angular/platform-browser/animations';
import { HttpClientModule } from '@angular/common/http';
import { RouterModule } from '@angular/router';

@NgModule({
  declarations: [],
  imports: [
    BrowserModule,
    RouterModule,
    BrowserModule,
    BrowserAnimationsModule,
    NoopAnimationsModule,
    ToastrModule.forRoot({}),
    HttpClientModule,
  ],
  providers: [],
  bootstrap: [],
  exports: [],
})
export class AppModule {}
