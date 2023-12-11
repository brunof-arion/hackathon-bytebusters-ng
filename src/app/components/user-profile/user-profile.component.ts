import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

@Component({
  selector: 'app-user-profile',
  standalone: true,
  imports: [CommonModule],
  template: `<div class="card-header">
    <div
      class="header-image"
      [ngStyle]="{
        'background-image': 'url(' + userAvatar + ')',
        'background-size': 'contain'
      }"
    ></div>
    <div>
      <div class="header-title">{{ userName }}</div>
      <div class="header-subtitle">{{ userEmail }}</div>
    </div>
  </div>`,
  styleUrl: './user-profile.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UserProfileComponent {
  @Input() userAvatar: string = '';
  @Input() userName: string = '';
  @Input() userEmail: string = '';
}
