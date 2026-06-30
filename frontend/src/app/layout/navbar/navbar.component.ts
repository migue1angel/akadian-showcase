import {
  ChangeDetectionStrategy,
  Component,
  inject,
  OnInit,
} from '@angular/core';
import { Menubar } from 'primeng/menubar';
import { Button } from 'primeng/button';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '@core/auth/auth.service';
import { MenuItem } from 'primeng/api';
import { Menu } from 'primeng/menu';

@Component({
  selector: 'app-navbar',
  imports: [Button, RouterLink, Menubar, RouterLinkActive, Menu],
  templateUrl: './navbar.component.html',
  styles: ``,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NavbarComponent implements OnInit {
  protected readonly authService = inject(AuthService);
  protected readonly router = inject(Router);
  protected items: any[] = [];
  menuItems: MenuItem[] = [];

  ngOnInit(): void {
    const userRoles =
      this.authService.user()?.roles || [];
    this.items = this.allItems.filter((item) => {
      if (!item.roles) return true;
      return item.roles.some((r) => userRoles.includes(r));
    });
    this.addOptions();
  }

  toggleDarkMode() {
    const element = document.querySelector('html');
    element?.classList.toggle('my-app-dark');
  }

  logout() {
    this.authService.logout().subscribe();
  }


  protected get themeIcon() {
    const element = document.querySelector('html');
    return element?.classList.contains('my-app-dark') ? 'sun' : 'moon';
  }

  addOptions() {
    this.menuItems.push(
      {
        label: 'Logout',
        icon: 'pi pi-sign-out',
        command: () => this.logout(),
      },
    );
  }

  protected allItems = [
    {
      label: 'Dashboard',
      path: '/dashboard',
      roles: null,
    },
    {
      label: 'Profile',
      path: '/profile',
      roles: null,
    },
    {
      label: 'Coordinator',
      path: '/coordinator/programs/list',
      roles: ['COORDINATOR', 'ADMIN'],
    },
  ];
}
