import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ColumnConfig } from '../column-settings/column-settings.component';

@Component({
    selector: '[app-table-filter-row]',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './table-filter-row.component.html',
    styleUrls: ['./table-filter-row.component.scss']
})
export class TableFilterRowComponent implements OnChanges {
    @Input() columns: ColumnConfig[] = [];
    @Input() filters: { [key: string]: string } = {};
    @Output() filtersChange = new EventEmitter<{ [key: string]: string }>();

    // Interner State für operator-number Spalten: { colId: { op, val } }
    operatorValues: { [colId: string]: { op: string; val: string } } = {};

    ngOnChanges(changes: SimpleChanges): void {
        if (changes['filters'] || changes['columns']) {
            this.columns
                .filter(c => c.filterType === 'operator-number')
                .forEach(col => {
                    const raw = this.filters[col.id] || '';
                    if (!raw) {
                        this.operatorValues[col.id] = { op: '=', val: '' };
                    } else {
                        const idx = raw.indexOf(':');
                        this.operatorValues[col.id] = {
                            op: raw.substring(0, idx) || '=',
                            val: raw.substring(idx + 1)
                        };
                    }
                });
        }
    }

    onFilterChange(): void {
        this.filtersChange.emit({ ...this.filters });
    }

    onOperatorNumberChange(colId: string): void {
        const { op, val } = this.operatorValues[colId];
        this.filters[colId] = val ? `${op}:${val}` : '';
        this.filtersChange.emit({ ...this.filters });
    }
}
