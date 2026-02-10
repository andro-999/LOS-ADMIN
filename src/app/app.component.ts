import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { GesLogoComponent } from './components/ges-logo/ges-logo.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet,
    //  GesLogoComponent
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  title = 'los-admin';
}
