import { Component, inject, NgZone } from '@angular/core';
import { catchError, finalize, forkJoin, map, of, switchMap, tap } from 'rxjs';
import { LinkedInService } from './services/linkedin.service';
import { FormControl } from '@angular/forms';
import { GoogleLoginService } from './components/auth/google-login.service';
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

  positionsControl = new FormControl('');
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

  candidateEvaluatedHandler(evaluated: boolean) {
    if (evaluated) {
      this.candidateEvaluated = true;
    }
  }

  public generateMessage() {
    this.candidateEvaluated = false;
    if (this.positionsControl) {
      this.isLoading = true;
      this.loadingMessage = 'Message generation in process';
      this.linkedinService
        .getGeneratedMessage({
          position: this.positionsControl.value
            ? this.positionsControl.value
            : '',
          userEmail: this.userEmail,
          userName: this.userName,
        })
        .subscribe({
          next: (res) => {
            console.log('res previous parse', res);
            let parsedResponse = JSON.parse((res as any).content);
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
  }

  markAsContacted() {
    this.linkedinService.saveCandidate()
      .pipe(
        switchMap(savedCandidate => {
          return this.linkedinService.updateStatus('contacted')
        })
      ).subscribe((updatedCandidate: any) => {
        this.ngZone.run(() => {
          console.log(updatedCandidate, this.candidate);
          this.candidate = updatedCandidate;
          this.contacted = true;
          this.alreadyContacted = true;
        });
      })

    // this.linkedinService.updateStatus('contacted').subscribe(() => {
    //   this.linkedinService
    //     .saveCandidate()
    //     .pipe(
    //       switchMap((candidate: any) => {
    //         console.log('pre candidate');
    //         return this.linkedinService.getCandidate(
    //           this.linkedinService.createId(candidate.name)
    //         );
    //       })
    //     )
    //     .subscribe((savedCandidate: any) => {
    //       console.log('candidate saved', savedCandidate);
    //       this.ngZone.run(() => {
    //         console.log(savedCandidate, this.candidate);
    //         this.candidate = savedCandidate;
    //         this.contacted = true;
    //         this.alreadyContacted = true;
    //       });
    //     });
    // });
  }
}
