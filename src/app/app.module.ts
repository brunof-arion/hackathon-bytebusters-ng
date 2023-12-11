import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { GoogleLoginComponent } from './components/auth/google-login.component';
import { HttpClientModule } from '@angular/common/http';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatCardModule } from '@angular/material/card';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { UserProfileComponent } from './components/user-profile/user-profile.component';
import { StatusSelectorComponent } from './components/status-selector/status-selector.component';
@NgModule({
    declarations: [
        AppComponent,
        GoogleLoginComponent,
        StatusSelectorComponent
    ],
    providers: [],
    bootstrap: [AppComponent],
    imports: [
        BrowserModule,
        AppRoutingModule,
        HttpClientModule,
        BrowserAnimationsModule,
        FormsModule,
        ReactiveFormsModule,
        MatProgressSpinnerModule,
        MatCardModule,
        MatProgressBarModule,
        MatSelectModule,
        MatFormFieldModule,
        MatIconModule,
        MatButtonModule,
        UserProfileComponent
    ]
})
export class AppModule { }
