import { Component, inject, NgZone } from '@angular/core';
import { catchError, finalize, forkJoin, map, of, switchMap, tap } from 'rxjs';
import { LinkedInService } from './services/linkedin.service';
import { FormControl } from '@angular/forms';
import { GoogleLoginService } from './services/google-login.service';
import { ChromeService } from './services/chrome.service';

interface ICandidate {
  company: string;
  country: string;
  id: number;
  message: string;
  name: string;
  position: string;
  status: string;
  unique_id: string;
  url: string;
  years_experience: string;
}

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent {
  title = 'angular-chrome-extension-two';
  ngZone = inject(NgZone);
  linkedinService = inject(LinkedInService);
  chromeService = inject(ChromeService);
  public loginService = inject(GoogleLoginService);

  public isLoading = false;
  public isExtensionLoading = false;

  positions = [] as string[];

  public userName = '';
  public userAvatar = '';
  public userEmail = '';
  public isLinkedinPage: boolean | null = null;
  public candidate: ICandidate = {} as ICandidate;

  public positionSelected = false;
  public loadingMessage = '';
  public evaluation: { status: boolean; message: string } = {} as {
    status: boolean;
    message: string;
  };

  public messageGenerated = false;
  public contacted = false;
  public isLogged = false;
  public candidateEvaluated: boolean | null = null;
  public alreadyContacted: boolean | null = null;

  ngOnInit() {
    // clear everything?

    this.loginService.checkSignIn().subscribe((logged) => {
      this.ngZone.run(() => {
        this.isLogged = !!logged;
      });
    });

    this.loginService.user.asObservable().subscribe((user) => {
      this.userName = `${user.given_name} ${user.family_name}`;
      this.userAvatar = user.picture;
      this.userEmail = user.email;
    });

    this.linkedinService
      .isLinkedIn()
      .pipe(
        tap(() => this.ngZone.run(() => (this.isExtensionLoading = true))),
        switchMap((isLinkedIn) => {
          if (isLinkedIn) {
            return forkJoin({
              clearedStash: this.chromeService.clearStashedProfile(),
              positions: this.linkedinService
                .getPositions()
                .pipe(
                  map((res) => (res as unknown as any[]).map((pos) => pos.name))
                ),
              candidate: this.linkedinService.contentLoadedHandler(),
            }).pipe(
              tap(({ positions, candidate }) => {
                this.candidate = candidate as ICandidate;
                this.positions = positions;
                if (candidate) {
                  console.log('run at linkedin service', candidate);
                  this.alreadyContacted = true;
                }
              }),
              map(() => isLinkedIn)
            );
          }
          return of(isLinkedIn);
        }),
        catchError((error) => {
          console.error('Error occurred:', error);
          return of(false);
        })
      )
      .subscribe((isLinkedIn) => {
        this.ngZone.run(() => {
          this.isLinkedinPage = isLinkedIn;
          this.isExtensionLoading = false;
        });
      });
  }

  loggedIn(loggedIn: boolean) {
    this.ngZone.run(() => {
      this.isLogged = loggedIn;
      // TODO: Improve logic
      this.isExtensionLoading = false;
    });
  }

  candidateEvaluatedHandler(evaluated: boolean) {
    if (evaluated) {
      this.candidateEvaluated = true;
    }
  }

  public generateMessage() {
    this.candidateEvaluated = false;
    this.isLoading = true;
    this.loadingMessage = 'Message generation in process';
    this.chromeService
      .getPositionFromStorage()
      .pipe(
        switchMap((position) => {
          return this.linkedinService.getGeneratedMessage({
            position: position,
            userEmail: this.userEmail,
            userName: this.userName,
          });
        })
      )
      .subscribe({
        next: (res) => {
          console.log(res)
          let parsedResponse = JSON.parse((res as any).content);
          this.chromeService.updateCurrentProfile({
            years_of_experience: parsedResponse.years_of_experience,
            country: parsedResponse.country,
            current_company: parsedResponse.current_company,
          });
          this.chromeService
            .getActiveTab()
            .pipe(
              finalize(() => {
                this.ngZone.run(() => {
                  this.isLoading = false;
                  this.loadingMessage = '';
                  this.messageGenerated = true;
                });
              })
            )
            .subscribe((activeTab) => {
              const { id: tabId } = activeTab;
              chrome.tabs.sendMessage(tabId!, {
                type: 'SET_MESSAGE',
                message: parsedResponse.message,
              });
            });
        },
        error: (error) => {
          // TODO: Show something to the user?
          console.error('error in generateMessage', error);
          this.isLoading = false;
          this.loadingMessage = '';
        },
      });
  }

  markAsContacted() {
    this.linkedinService
      .saveCandidate()
      .pipe(
        switchMap((savedCandidate) => {
          return this.linkedinService.updateStatus('contacted');
        })
      )
      .subscribe((updatedCandidate: any) => {
        this.ngZone.run(() => {
          this.candidate = updatedCandidate;
          this.contacted = true;
          this.alreadyContacted = true;
        });
      });
  }
}
