import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-nav-btn',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './nav-btn.component.html',
  styleUrls: ['./nav-btn.component.scss']
})
export class NavBtnComponent {
  @Input() label: string = '';
  @Input() count: number = 0;
  @Input() isActive: boolean = false;
  @Input() showCount: boolean = true;
  @Output() clicked = new EventEmitter<void>();

  onClick(): void {
    this.clicked.emit();
  }
}
