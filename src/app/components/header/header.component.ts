import { Component, Input } from '@angular/core';
import { GesLogoComponent } from '../ges-logo/ges-logo.component';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [GesLogoComponent, CommonModule],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss'
})
export class HeaderComponent {

  @Input() showBackground = true;
  @Input() pageTitle: string = '';

}
