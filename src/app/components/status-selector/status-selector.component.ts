import { ChangeDetectionStrategy, Component, Input, inject } from '@angular/core';
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

  public statusForm!: FormGroup;
  public isChanged: boolean = false;

  @Input() status: string | null = '';

  ngOnInit() {
    this.statusForm = new FormGroup({
      status: new FormControl(this.status),
    });

    this.statusForm.get('status')!.valueChanges.subscribe((newValue) => {
      this.isChanged = newValue !== this.status;
    });
  }

  onSubmit() {
    if (this.status !== this.statusForm.value.status) {
      this.linkedinService.updateStatus(this.statusForm.value.status).subscribe(res => {
        console.log(res);
        console.log('Submitted', this.statusForm.value);
        this.status = this.statusForm.value.status;
      });
    }
  }
}
