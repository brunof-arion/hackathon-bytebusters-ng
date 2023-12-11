import { Component, inject } from '@angular/core';
import { GoogleLoginService } from './google-login.service';
import { HttpClient } from '@angular/common/http';

@Component({
    selector: 'google-auth-button',
    templateUrl: './google-login.component.html',
    styleUrl: './google-login.component.scss',
})
export class GoogleLoginComponent {
    private readonly googleLoginService: GoogleLoginService = inject(GoogleLoginService)
    title = 'angular-chrome-extension';
    redirectUri = 'https://labgffphkfnohdddeldjdngdhabjiakp.chromiumapp.org';

    signInWithGoogle() {
        this.googleLoginService
            .signInWithGoogle()
            .subscribe(someRes => console.log({ someRes }));
    }

}
