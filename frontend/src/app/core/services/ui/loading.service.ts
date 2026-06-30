import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class LoadingService {
  public showLoading = signal<boolean>(false);
  private readonly activeRequests = signal<number>(0);
  private readonly manualLoading = signal<boolean>(false);
  private loadingTimeout: any = null;

  showSpinner() {
    this.manualLoading.set(true);
    this.showLoading.set(true);
  }

  hideSpinner() {
    this.manualLoading.set(false);
    if (this.activeRequests() === 0) {
      this.showLoading.set(false);
    }
  }

  startRequest() {
    this.activeRequests.update((count) => count + 1);

    if (!this.loadingTimeout && this.activeRequests() === 1) {
      this.loadingTimeout = setTimeout(() => {
        if (this.activeRequests() > 0) {
          this.showLoading.set(true);
        }
      }, 300);
    }
  }

  endRequest() {
    this.activeRequests.update((count) => Math.max(0, count - 1));

    if (this.activeRequests() === 0) {
      if (this.loadingTimeout) {
        clearTimeout(this.loadingTimeout);
        this.loadingTimeout = null;
      }
      if (!this.manualLoading()) {
        this.showLoading.set(false);
      }
    }
  }

  resetLoading() {
    this.activeRequests.set(0);
    this.manualLoading.set(false);
    if (this.loadingTimeout) {
      clearTimeout(this.loadingTimeout);
      this.loadingTimeout = null;
    }
    this.showLoading.set(false);
  }
}
