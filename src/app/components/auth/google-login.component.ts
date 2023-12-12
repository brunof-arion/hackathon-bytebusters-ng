import { Component, EventEmitter, Output, inject } from '@angular/core';
import { GoogleLoginService } from '../../services/google-login.service';

@Component({
  selector: 'google-auth-button',
  templateUrl: './google-login.component.html',
  styleUrl: './google-login.component.scss',
})
export class GoogleLoginComponent {
  private readonly googleLoginService: GoogleLoginService =
    inject(GoogleLoginService);

  @Output() loggedIn: EventEmitter<boolean> = new EventEmitter(false);

  signInWithGoogle() {
    this.googleLoginService
      .signInWithGoogle()
      .subscribe({
        next: (someRes) => this.loggedIn.emit(true),
        error: (error) => {
            console.error('Error logging', error);
            this.loggedIn.emit(false);
        },
      });
  }
}
