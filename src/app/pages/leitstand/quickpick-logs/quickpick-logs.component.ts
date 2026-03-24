import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIcon } from '@angular/material/icon';
import { CdkDragDrop, DragDropModule } from '@angular/cdk/drag-drop';
import { LeitstandService, QuickpickLog } from '../leitstand.service';
import { ColumnSettingsComponent, ColumnConfig } from '../../../components/column-settings/column-settings.component';
import { ColumnOrderService } from '../../../services/column-order.service';

type SortColumn = 'AU_number' | 'belegnummer' | 'artikelnummer' | 'beschreibung' | 'lagerist_rueck' | 'menge';
type SortDirection = 'asc' | 'desc';
type QuickpickColumn = ColumnConfig & { sortKey?: SortColumn };

const DEFAULT_QUICKPICK_COLUMNS: QuickpickColumn[] = [
    { id: 'nr', label: 'Nr.', visible: true, width: '60px' },
    { id: 'AU_number', label: 'AU Nr.', visible: true, width: '120px', sortKey: 'AU_number' },
    { id: 'belegnummer', label: 'Auftrags Nr.', visible: true, width: '130px', sortKey: 'belegnummer' },
    { id: 'artikelnummer', label: 'ArtikelNr.', visible: true, width: '130px', sortKey: 'artikelnummer' },
    { id: 'beschreibung', label: 'Artikel Name', visible: true, width: '220px', sortKey: 'beschreibung' },
    { id: 'lagerist_rueck', label: 'Lagerist', visible: true, width: '130px', sortKey: 'lagerist_rueck' },
    { id: 'menge', label: 'Menge', visible: true, width: '90px', sortKey: 'menge' },
    { id: 'quickpick', label: 'Quickpick', visible: true, width: '100px' }
];

@Component({
    selector: 'app-quickpick-logs',
    standalone: true,
    imports: [CommonModule, MatIcon, DragDropModule, ColumnSettingsComponent],
    templateUrl: './quickpick-logs.component.html',
    styleUrls: ['./quickpick-logs.component.scss']
})
export class QuickpickLogsComponent implements OnInit {
    quickpickLogs: QuickpickLog[] = [];
    isLoading: boolean = false;
    sortColumn: SortColumn = 'AU_number';
    sortDirection: SortDirection = 'asc';
    quickpickColumns: QuickpickColumn[] = DEFAULT_QUICKPICK_COLUMNS.map(col => ({ ...col }));

    get visibleColumnsCount(): number {
        return this.quickpickColumns.filter(c => c.visible).length;
    }

    constructor(
        private leitstandService: LeitstandService,
        private columnOrderService: ColumnOrderService
    ) { }

    ngOnInit(): void {
        this.loadColumnOrder();
        this.loadLogs();
    }

    dropColumn(event: CdkDragDrop<string[]>): void {
        this.columnOrderService.applyDrop(event, this.quickpickColumns);
        this.saveColumnOrder();
    }

    onColumnsChange(columns: QuickpickColumn[]): void {
        this.quickpickColumns = columns;
    }

    resetColumnOrder(): void {
        this.quickpickColumns = this.columnOrderService.resetOrder(
            'quickpickColumnSettings',
            this.quickpickColumns,
            DEFAULT_QUICKPICK_COLUMNS
        );
    }

    private saveColumnOrder(): void {
        this.columnOrderService.saveOrder('quickpickColumnSettings', this.quickpickColumns);
    }

    private loadColumnOrder(): void {
        this.columnOrderService.loadOrder('quickpickColumnSettings', this.quickpickColumns);
    }

    loadLogs(): void {
        this.isLoading = true;
        this.leitstandService.getQuickpickLogs().subscribe({
            next: (logs) => {
                this.quickpickLogs = logs;
                this.sortLogs();
                this.isLoading = false;
            },
            error: () => {
                this.quickpickLogs = [];
                this.isLoading = false;
            }
        });
    }

    sortBy(column: SortColumn): void {
        if (this.sortColumn === column) {
            this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
        } else {
            this.sortColumn = column;
            this.sortDirection = 'asc';
        }
        this.sortLogs();
    }

    private sortLogs(): void {
        this.quickpickLogs.sort((a, b) => {
            let valueA = a[this.sortColumn] || '';
            let valueB = b[this.sortColumn] || '';

            if (typeof valueA === 'string') {
                valueA = valueA.toLowerCase();
                valueB = (valueB as string).toLowerCase();
            }

            let comparison = 0;
            if (valueA < valueB) comparison = -1;
            if (valueA > valueB) comparison = 1;

            return this.sortDirection === 'asc' ? comparison : -comparison;
        });
    }
}
