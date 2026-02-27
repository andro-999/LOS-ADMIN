import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface BereichNavSubItem {
    id: string;
    label: string;
}

export interface BereichNavItem {
    id: string;
    label: string;
    hasDropdown?: boolean;
    subItems?: BereichNavSubItem[];
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
    @Input() openDropdownId: string | null = null; // Welches Dropdown ist offen
    @Output() viewChanged = new EventEmitter<string>();
    @Output() subViewChanged = new EventEmitter<string>();

    navigateToView(viewId: string): void {
        this.viewChanged.emit(viewId);
    }

    selectSubItem(subItemId: string): void {
        this.subViewChanged.emit(subItemId);
    }

    isSubItemActive(item: BereichNavItem): boolean {
        if (!item.subItems) return false;
        return item.subItems.some(sub => sub.id === this.currentView);
    }
}
