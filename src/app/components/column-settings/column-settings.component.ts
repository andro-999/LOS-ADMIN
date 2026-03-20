import { Component, Input, Output, EventEmitter, OnInit, HostListener, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIcon } from '@angular/material/icon';

export interface ColumnConfig {
    id: string;
    label: string;
    visible: boolean;
    width?: string;
}

@Component({
    selector: 'app-column-settings',
    standalone: true,
    imports: [CommonModule, FormsModule, MatIcon],
    templateUrl: './column-settings.component.html',
    styleUrls: ['./column-settings.component.scss']
})
export class ColumnSettingsComponent implements OnInit {
    @Input() columns: ColumnConfig[] = [];
    @Input() storageKey: string = 'columnSettings';
    @Output() columnsChange = new EventEmitter<ColumnConfig[]>();
    @Output() reset = new EventEmitter<void>();

    showPanel = false;

    constructor(private elementRef: ElementRef) { }

    ngOnInit(): void {
        this.loadFromStorage();
    }

    // Klick außerhalb schließt Panel
    @HostListener('document:click', ['$event'])
    onDocumentClick(event: MouseEvent): void {
        if (!this.elementRef.nativeElement.contains(event.target)) {
            this.showPanel = false;
        }
    }

    togglePanel(): void {
        this.showPanel = !this.showPanel;
    }

    toggleVisibility(col: ColumnConfig): void {
        col.visible = !col.visible;
        this.saveToStorage();
        this.columnsChange.emit(this.columns);
    }

    resetColumns(): void {
        // Nur Reihenfolge zurücksetzen, Sichtbarkeit beibehalten
        this.reset.emit();
    }

    showAll(): void {
        this.columns.forEach(col => col.visible = true);
        this.saveToStorage();
        this.columnsChange.emit(this.columns);
    }

    hideAll(): void {
        // Mindestens eine Spalte sichtbar lassen (erste)
        this.columns.forEach((col, index) => col.visible = index === 0);
        this.saveToStorage();
        this.columnsChange.emit(this.columns);
    }

    getVisibleCount(): number {
        return this.columns.filter(c => c.visible).length;
    }

    private saveToStorage(): void {
        const data = this.columns.map(c => ({ id: c.id, visible: c.visible }));
        localStorage.setItem(this.storageKey, JSON.stringify(data));
    }

    private loadFromStorage(): void {
        const saved = localStorage.getItem(this.storageKey);
        if (saved) {
            try {
                const data: { id: string; visible: boolean }[] = JSON.parse(saved);
                data.forEach(item => {
                    const col = this.columns.find(c => c.id === item.id);
                    if (col) {
                        col.visible = item.visible;
                    }
                });
                this.columnsChange.emit(this.columns);
            } catch (e) {
                console.error('Fehler beim Laden der Spalteneinstellungen:', e);
            }
        }
    }
}
