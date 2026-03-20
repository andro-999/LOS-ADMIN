import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIcon } from '@angular/material/icon';
import { LeitstandService, QuickpickLog } from '../leitstand.service';

type SortColumn = 'belegnummer' | 'artikelnummer' | 'beschreibung' | 'menge';
type SortDirection = 'asc' | 'desc';

@Component({
    selector: 'app-quickpick-logs',
    standalone: true,
    imports: [CommonModule, MatIcon],
    templateUrl: './quickpick-logs.component.html',
    styleUrls: ['./quickpick-logs.component.scss']
})
export class QuickpickLogsComponent implements OnInit {
    quickpickLogs: QuickpickLog[] = [];
    isLoading: boolean = false;
    sortColumn: SortColumn = 'belegnummer';
    sortDirection: SortDirection = 'asc';

    constructor(private leitstandService: LeitstandService) { }

    ngOnInit(): void {
        this.loadLogs();
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
            let valueA = a[this.sortColumn];
            let valueB = b[this.sortColumn];

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
