import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { HeaderComponent } from '../header/header.component';
import { BereicheComponent } from '../bereiche/bereiche.component';
//import { GesLogoComponent } from '../ges-logo/ges-logo.component';


@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [CommonModule, SidebarComponent, HeaderComponent, BereicheComponent],
  templateUrl: './layout.component.html',
  styleUrls: ['./layout.component.scss']
})
export class LayoutComponent {

  @Input() showNav: boolean = true;
  @Input() bereichText: string = '';

}
