import { Injectable } from '@angular/core';
import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { ColumnConfig } from '../components/column-settings/column-settings.component';

@Injectable({
    providedIn: 'root'
})
export class ColumnOrderService {
    applyDrop(event: CdkDragDrop<string[]>, columns: ColumnConfig[]): void {
        const visibleColumns = columns.filter(c => c.visible);
        const draggedColumn = visibleColumns[event.previousIndex];
        const targetColumn = visibleColumns[event.currentIndex];

        if (!draggedColumn || !targetColumn) {
            return;
        }

        const realPreviousIndex = columns.findIndex(c => c.id === draggedColumn.id);
        const realCurrentIndex = columns.findIndex(c => c.id === targetColumn.id);
        moveItemInArray(columns, realPreviousIndex, realCurrentIndex);
    }

    saveOrder(storageKey: string, columns: ColumnConfig[]): void {
        localStorage.setItem(`${storageKey}_order`, JSON.stringify(columns.map(c => c.id)));
    }

    loadOrder(storageKey: string, columns: ColumnConfig[]): void {
        const saved = localStorage.getItem(`${storageKey}_order`);
        if (!saved) {
            return;
        }

        try {
            const order = JSON.parse(saved) as string[];
            columns.sort((a, b) => {
                const indexA = order.indexOf(a.id);
                const indexB = order.indexOf(b.id);
                if (indexA === -1) return 1;
                if (indexB === -1) return -1;
                return indexA - indexB;
            });
        } catch {
            // Ignore invalid localStorage content
        }
    }

    resetOrder<T extends ColumnConfig>(storageKey: string, current: T[], defaults: T[]): T[] {
        localStorage.removeItem(`${storageKey}_order`);
        const visibilityMap = new Map(current.map(c => [c.id, c.visible]));

        return defaults.map(col => ({
            ...col,
            visible: visibilityMap.get(col.id) ?? true
        }));
    }
}
