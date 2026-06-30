import { ChangeDetectionStrategy, Component } from '@angular/core';
import { SidebarComponent } from '../../shared/components/sidebar/sidebar.component';
import { RouterOutlet } from '@angular/router';
import { SidebarItem } from '@shared/interfaces/sidebar-item.model';

@Component({
  selector: 'app-coordinator',
  imports: [SidebarComponent, RouterOutlet],
  templateUrl: './coordinator.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CoordinatorComponent {
  items: SidebarItem[] = [
    {
      label: 'Programs',
      icon: 'file-edit',
      path: '/coordinator/programs',
      subItems: [
        {
          label: 'Program List',
          path: 'list',
        },
        {
          label: 'New Program',
          path: 'new',
        },
      ],
    },
  ];
}
