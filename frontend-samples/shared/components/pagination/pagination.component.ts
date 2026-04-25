import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  linkedSignal,
} from '@angular/core';
import { Router } from '@angular/router';
import { Paginator, PaginatorState } from 'primeng/paginator';

@Component({
  selector: 'app-pagination',
  imports: [Paginator],
  templateUrl: './pagination.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PaginationComponent {
  private readonly router = inject(Router);
  currentPageInput = input<number>(1);
  pages = input<number>(0);
  currentPage = linkedSignal(this.currentPageInput);
  onPageChange(event: PaginatorState) {
    this.currentPage.set(event.first! + 1);
    this.router.navigate([], {
      queryParams: {
        page: this.currentPage(),
      },
    });
  }
}
