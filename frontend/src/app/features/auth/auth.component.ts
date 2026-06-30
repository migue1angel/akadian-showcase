import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NavbarComponent } from '../../layout/navbar/navbar.component';
import { ErrorsAlertComponentComponent } from "@shared/components/errors-alert/errors-alert-component.component";

@Component({
  selector: 'app-auth',
  imports: [RouterOutlet, NavbarComponent, ErrorsAlertComponentComponent],
  templateUrl: './auth.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AuthComponent { }
