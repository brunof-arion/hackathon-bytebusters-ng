import { Component, inject, NgZone } from '@angular/core';
import { combineLatest, finalize } from 'rxjs';
import { LinkedInService } from './services/linkedin.service';
import { FormControl } from '@angular/forms';
import { GoogleLoginService } from './components/auth/google-login.service';
import { ChromeService } from './services/chrome.service';
import { MESSAGE } from './services/message';

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

  positionsControl = new FormControl('');
  positions = [] as string[];

  public userName = '';
  public userAvatar = '';
  public userEmail = '';
  public isLinkedinPage = false;

  public positionSelected = false;
  public loadingMessage = '';
  public evaluation: { status: boolean; message: string } = {} as {
    status: boolean;
    message: string;
  };

  public messageGenerated = false;
  public contacted = false;
  public isLogged = false;

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

    this.linkedinService.isLinkedin$.subscribe((isLinkedin) => {
      this.ngZone.run(() => {
        this.isLinkedinPage = !!isLinkedin;
      });
    });

    this.positionsControl.valueChanges.subscribe((selectedPosition) => {
      this.positionSelected = !!selectedPosition?.length;
      this.loadingMessage = 'Evaluating profile';
      this.isLoading = true;
      combineLatest([
        this.linkedinService.evaluateCandidateProfile({
          position: selectedPosition!,
          userEmail: this.userEmail,
          userName: this.userName,
        }),
        this.chromeService.sendMessage({
          type: MESSAGE.SAVE_POSITION,
          message: selectedPosition!,
        }),
      ])
        .pipe(
          finalize(() => {
            this.ngZone.run(() => {
              this.isLoading = false;
              this.loadingMessage = '';
            });
          })
        )
        .subscribe(([{ status, message }]) => {
          console.log('Message evaluated', message);
          this.ngZone.run(() => {
            this.evaluation.status = status === 'true';
            this.evaluation.message = message.content;
          });
        });
    });

    this.linkedinService.contentLoadedHandler().subscribe((res) => {
      if (res === null) {
        this.chromeService.getProfileFromLinkedin().subscribe((res) => {
          console.log('candidate saved:', res);
        });
      } else {
        console.log('get candidate from db:', res);
      }
    });

    this.linkedinService.getPositions().subscribe((res) => {
      this.positions = (res as unknown as any[]).map(
        (pos) => pos.name
      ) as unknown as string[];
    });

    this.chromeService.getProfileFromStorage().subscribe();
  }

  public generateMessage() {
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
    this.linkedinService.updateStatus('contacted').subscribe(() => {
      this.ngZone.run(() => {
        this.contacted = true;
      });
      this.linkedinService.saveCandidate().subscribe((res) => {
        console.log('candidate saved', res);
      });
    });
  }
}
