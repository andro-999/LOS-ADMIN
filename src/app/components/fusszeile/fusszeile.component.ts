import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-fusszeile',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './fusszeile.component.html',
    styleUrls: ['./fusszeile.component.scss']
})
export class FusszeileComponent {
    @Input() showHauptmenue = true;
    @Input() showLogout = true;

    @Output() hauptmenueClick = new EventEmitter<void>();
    @Output() logoutClick = new EventEmitter<void>();
}
