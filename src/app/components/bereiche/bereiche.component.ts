import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';


@Component({
  selector: 'app-bereiche',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './bereiche.component.html',
  styleUrls: ['./bereiche.component.scss']
})
export class BereicheComponent {
  @Input() bereichText!: string;
}
