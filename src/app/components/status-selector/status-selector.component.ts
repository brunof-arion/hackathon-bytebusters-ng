import { ChangeDetectionStrategy, Component, EventEmitter, Input, NgZone, Output, inject } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { LinkedInService } from '../../services/linkedin.service';

@Component({
  selector: 'status-selector',
  templateUrl: './status-selector.component.html',
  styleUrl: './status-selector.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StatusSelectorComponent {
  linkedinService = inject(LinkedInService);
  ngZone = inject(NgZone);

  public statusForm!: FormGroup;
  public isChanged: boolean = false;
  public isLoading = false;

  @Input() status: string | null = '';
  @Output() selectedStatus = new EventEmitter<string | null>();

  ngOnInit() {
    this.statusForm = new FormGroup({
      status: new FormControl(this.status),
    });

    this.statusForm.get('status')!.valueChanges.subscribe((newValue) => {
      if (!newValue) {
        this.isChanged = false;
      } else {
        this.isChanged = newValue !== this.status;
      }
    });

  }

  onSubmit() {
    if (this.status !== this.statusForm.value.status) {
      this.ngZone.run(() => {
        this.isLoading = true;
      })
      this.linkedinService.updateStatus(this.statusForm.value.status).subscribe(res => {
        this.status = this.statusForm.value.status;
        this.ngZone.run(() => {
          this.isLoading = false;
          this.isChanged = false;
          this.selectedStatus.emit(this.status);
        })
      });
    }
  }
}
