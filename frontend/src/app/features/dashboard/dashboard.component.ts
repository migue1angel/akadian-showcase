import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { AuthService } from '@core/auth/auth.service';
import { RouterLink } from '@angular/router';
import { Card } from 'primeng/card';
import { Button } from 'primeng/button';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [RouterLink, Card, Button],
  template: `
    <div class="p-6 max-w-4xl mx-auto">
      <h1 class="text-3xl font-semibold mb-6">Dashboard</h1>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <p-card header="Welcome">
          <p class="m-0">
            <strong>{{ authService.user()?.firstName }} {{ authService.user()?.lastName }}</strong>
          </p>
          <p class="m-0 text-surface-500">{{ authService.user()?.email }}</p>
          @if (authService.user()?.roles?.length) {
            <p class="mt-2 text-sm">
              Role: <span class="font-medium">{{ authService.user()!.roles[0] }}</span>
            </p>
          }
        </p-card>

        <p-card header="Quick Links">
          <div class="flex flex-col gap-3">
            <p-button label="My Profile" icon="pi pi-user" styleClass="p-button-outlined w-full" routerLink="/profile" />
            <p-button label="Payments" icon="pi pi-tag" styleClass="p-button-outlined w-full" routerLink="/payments" />
            @if (isCoordinator) {
              <p-button label="Coordinator Panel" icon="pi pi-cog" styleClass="p-button-outlined w-full" routerLink="/coordinator" />
            }
          </div>
        </p-card>
      </div>

      <div class="mt-8 p-6 rounded-xl bg-gradient-to-r from-sky-50 to-indigo-50 dark:from-sky-950/30 dark:to-indigo-950/30 border border-sky-200 dark:border-sky-800">
        <div class="flex items-start gap-4">
          <i class="pi pi-info-circle text-2xl text-sky-600 dark:text-sky-400 mt-0.5"></i>
          <div>
            <p class="m-0 text-surface-700 dark:text-surface-300 leading-relaxed">
              This version represents only a <strong class="text-sky-700 dark:text-sky-300">showcase version</strong> of the original project.
              You can find the full documentation at the GitHub repository:
            </p>
            <a href="https://github.com/user/repo" target="_blank" rel="noopener noreferrer"
               class="inline-flex items-center gap-2 mt-2 text-sky-600 dark:text-sky-400 hover:text-sky-800 dark:hover:text-sky-200 font-medium transition-colors">
              <i class="pi pi-github text-lg"></i>
              View on GitHub
            </a>
            <p class="m-0 mt-2 text-sm text-surface-500 dark:text-surface-400">
              Thanks for visiting!
            </p>
          </div>
        </div>
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class DashboardComponent {
  protected readonly authService = inject(AuthService);

  protected get isCoordinator(): boolean {
    const roles = this.authService.user()?.roles;
    return roles?.some((r) => r === 'COORDINATOR' || r === 'ADMIN') ?? false;
  }
}
