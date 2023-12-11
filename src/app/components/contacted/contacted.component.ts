import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

@Component({
  selector: 'contacted',
  templateUrl: './contacted.component.html',
  styleUrl: './contacted.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ContactedComponent {
  @Input() public status!: string;

}
