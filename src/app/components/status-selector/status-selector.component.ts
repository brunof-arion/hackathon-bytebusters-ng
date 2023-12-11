import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';

@Component({
  selector: 'status-selector',
  templateUrl: './status-selector.component.html',
  styleUrl: './status-selector.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StatusSelectorComponent {
  public statusForm!: FormGroup;

  @Input() status: string | null = '';

  ngOnInit() {
    this.statusForm = new FormGroup({
      status: new FormControl(this.status), // You can set a default value here
    });
  }

  onSubmit() {
    console.log('Submitted');
  }
}
