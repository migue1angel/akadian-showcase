import { ChangeDetectionStrategy, Component, inject, signal, viewChild } from '@angular/core';
import { ProfileComponent as AuthProfileComponent } from '@features/auth/components/profile/profile.component';
import { Button } from 'primeng/button';
import { NotificationService } from '@core/services/ui/notification.service';
import { UsersHttpService } from '@features/auth/services/users-http.service';
import { AuthService } from '@core/auth/auth.service';

@Component({
  selector: 'app-profile-page',
  standalone: true,
  imports: [AuthProfileComponent, Button],
  template: `
    <div class="p-6 max-w-4xl mx-auto">
      <h1 class="text-3xl font-semibold mb-6">My Profile</h1>
      <app-profile #profileForm (outputProfile)="onProfileChange($event)" />
      <div class="flex justify-end mt-4">
        <p-button
          label="Save Changes"
          icon="pi pi-check"
          [loading]="saving()"
          (click)="saveProfile()"
        />
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class ProfileComponent {
  private readonly usersHttpService = inject(UsersHttpService);
  private readonly authService = inject(AuthService);
  private readonly notificationService = inject(NotificationService);

  protected readonly profileForm = viewChild(AuthProfileComponent);
  protected readonly saving = signal(false);
  private pendingChanges: { firstName: string; lastName: string } | null = null;

  onProfileChange(data: { firstName: string; lastName: string }): void {
    this.pendingChanges = data;
  }

  saveProfile(): void {
    if (!this.pendingChanges) return;

    this.saving.set(true);
    this.usersHttpService.updateProfile(this.pendingChanges).subscribe({
      next: () => {
        this.saving.set(false);
        this.notificationService.showSuccess('Profile updated successfully');
        this.authService.refreshUserProfile();
      },
      error: (error) => {
        this.saving.set(false);
        this.notificationService.showError(
          error.error?.message || 'Failed to update profile',
        );
      },
    });
  }
}
