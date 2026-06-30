import {
  ChangeDetectionStrategy,
  Component,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CataloguesService } from '@core/services/catalogues.service';
import { LoadingService } from '@core/services/ui/loading.service';
import { SpinnerComponent } from '@shared/components/spinner/spinner.component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, SpinnerComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App implements OnInit {
  protected readonly layoutService = inject(LoadingService);
  private readonly catalogueService = inject(CataloguesService);
  ngOnInit(): void {
    this.catalogueService.loadCatalogues();  
  }
  protected readonly title = signal('Akadian Academy');
}
