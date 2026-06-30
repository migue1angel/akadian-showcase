import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { ProgramsHttpService } from '../../services/programs-http.service';
import { ColumnModel } from '@core/models/column.model';
import { TableModule } from "primeng/table";
import { Button } from "primeng/button";
import { Menu } from 'primeng/menu';
import { ConfirmDialog } from 'primeng/confirmdialog';
import { ConfirmationService, MessageService } from 'primeng/api';
import { Router } from '@angular/router';
import { ProgramItem } from '../../interfaces/program-item.interface';
import { NotificationService } from '@core/services/ui/notification.service';
import { Panel } from 'primeng/panel';

@Component({
  selector: 'app-program-list',
  imports: [
    TableModule,
    Button,
    Menu,
    ConfirmDialog,
    Panel,
  ],
  providers: [ConfirmationService, MessageService],
  templateUrl: './program-list.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class ProgramListComponent {
  private readonly programsHttpService = inject(ProgramsHttpService);
  private readonly customMessageService = inject(NotificationService);
  private readonly confirmationService = inject(ConfirmationService);
  private readonly router = inject(Router);

  protected selectedItem = signal<ProgramItem | null>(null);

  protected programsResource = this.programsHttpService.programsListResource;

  cols: ColumnModel[] = [
    {field: 'name', header: 'Name'},
    {field: 'totalClasses', header: 'Total Classes'},
    {field: 'totalUnits', header: 'Total Units'},
    {field: 'level', header: 'Level'},
    {field: 'isActive', header: 'Is Active'},
  ];

  actionButtons = [
    {
      label: 'Edit',
      command: () => {
        if (!this.selectedItem()?.id) return;
        void this.router.navigate(['/coordinator/programs/edit', this.selectedItem()!.id]);
      },
    },
    {
      label: 'Delete',
      command: () => {
        if (!this.selectedItem()?.id) return;
        this.onDelete(this.selectedItem());
      },
    },
  ];

  onDelete(row: any): void {
    this.confirmationService.confirm({
      message: `Are you sure you want to delete "${row.name}"?`,
      header: 'Confirm delete',
      rejectButtonStyleClass: 'p-button-secondary',
      accept: () => {
        this.programsHttpService.delete(row.id).subscribe({
          next: () => {
            this.customMessageService.showSuccess(
              'Program deleted successfully'
            );
            this.programsHttpService.reloadProgramsList();
          },
          error: () => {
            this.customMessageService.showError('Could not delete program');
          },
        });
      },
    });
  }
}
