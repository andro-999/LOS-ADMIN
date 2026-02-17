import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface BereichNavItem {
    id: string;
    label: string;
}

@Component({
    selector: 'app-bereich-nav',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './bereich-nav.component.html',
    styleUrls: ['./bereich-nav.component.scss']
})
export class BereichNavComponent {
    @Input() items: BereichNavItem[] = [];
    @Input() currentView: string = '';
    @Output() viewChanged = new EventEmitter<string>();

    navigateToView(viewId: string): void {
        this.viewChanged.emit(viewId);
    }
}
