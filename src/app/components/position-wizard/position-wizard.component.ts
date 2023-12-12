import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  NgZone,
  Output,
  inject,
} from '@angular/core';
import { FormControl } from '@angular/forms';
import { catchError, combineLatest, finalize, of } from 'rxjs';
import { LinkedInService } from '../../services/linkedin.service';
import { ChromeService } from '../../services/chrome.service';
import { MESSAGE } from '../../services/message';
import { GoogleLoginService } from '../../services/google-login.service';

@Component({
  selector: 'position-wizard',
  templateUrl: './position-wizard.component.html',
  styleUrl: './position-wizard.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PositionWizardComponent {
  linkedinService = inject(LinkedInService);
  chromeService = inject(ChromeService);
  loginService = inject(GoogleLoginService);
  ngZone = inject(NgZone);
  positionsControl = new FormControl('');
  @Input() public positions = [] as string[];
  @Input() public evaluation = {} as any;
  public isLoading = false;
  @Input() public loadingMessage = '';
  @Input() public messageGenerated = false;
  public positionSelected = false;

  @Output() candidateEvaluation = new EventEmitter<boolean>();

  ngOnInit() {
    const userName =
      this.loginService.user.value.given_name +
      ' ' +
      this.loginService.user.value.family_name;
    this.positionsControl.valueChanges.subscribe((selectedPosition) => {
      this.positionSelected = !!selectedPosition?.length;
      this.loadingMessage = 'Evaluating profile';
      this.ngZone.run(() => {
        this.loadingMessage = 'Evaluating profile';
        this.isLoading = true;
      });
      combineLatest([
        this.linkedinService.evaluateCandidateProfile({
          position: selectedPosition!,
          userEmail: this.loginService.user.value.email,
          userName,
        }),
        this.chromeService.sendMessage({
          type: MESSAGE.SAVE_POSITION,
          message: selectedPosition!,
        }),
      ])
        .pipe(
          catchError((error) => {
            this.candidateEvaluation.emit(false);
            return of(error);
          })
        )
        .subscribe({
          next: ([{ status, message }]) => {
            console.log('Message evaluated', message);
            this.candidateEvaluation.emit(true);
            this.ngZone.run(() => {
              this.isLoading = false;
              this.loadingMessage = '';
              this.evaluation.status = status === 'true';
              this.evaluation.message = message.content;
            });
          },
          error: (error) => {
            console.log(error);
          },
        });
    });
  }
}
