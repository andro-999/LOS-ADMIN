import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIcon } from '@angular/material/icon';
import { CdkDragDrop, DragDropModule } from '@angular/cdk/drag-drop';
import { LeitstandService, EinlagerungTask } from '../leitstand.service';
import { UserService, User } from '../../../services/user.service';
import { ColumnSettingsComponent, ColumnConfig } from '../../../components/column-settings/column-settings.component';
import { ColumnOrderService } from '../../../services/column-order.service';

type EinlagerungColumn = ColumnConfig;

const DEFAULT_EINLAGERUNG_COLUMNS: EinlagerungColumn[] = [
    { id: 'nr', label: 'Nr.', visible: true, width: '60px' },
    { id: 'entry_number', label: 'Entry-Nr.', visible: true, width: '120px' },
    { id: 'artikelnummer', label: 'Artikel-Nr.', visible: true, width: '140px' },
    { id: 'abholort', label: 'Abholort', visible: true, width: '160px' },
    { id: 'basis_menge', label: 'Basis-Menge', visible: true, width: '120px' },
    { id: 'lagerist', label: 'Lagerist', visible: true, width: '180px' }
];

@Component({
    selector: 'app-einlagerung-auftraege',
    standalone: true,
    imports: [CommonModule, FormsModule, MatIcon, DragDropModule, ColumnSettingsComponent],
    templateUrl: './einlagerung-auftraege.component.html',
    styleUrls: ['./einlagerung-auftraege.component.scss']
})
export class EinlagerungAuftraegeComponent implements OnInit {
    einlagerungTasks: EinlagerungTask[] = [];
    isLoadingEinlagerung: boolean = false;
    availableLageristen: User[] = [];
    einlagerungColumns: EinlagerungColumn[] = DEFAULT_EINLAGERUNG_COLUMNS.map(col => ({ ...col }));

    get visibleColumnsCount(): number {
        return this.einlagerungColumns.filter(c => c.visible).length;
    }

    constructor(
        private leitstandService: LeitstandService,
        private userService: UserService,
        private columnOrderService: ColumnOrderService
    ) { }

    ngOnInit(): void {
        this.loadColumnOrder();
        this.loadEinlagerungTasks();
        this.loadLageristen();
    }

    dropColumn(event: CdkDragDrop<string[]>): void {
        this.columnOrderService.applyDrop(event, this.einlagerungColumns);
        this.saveColumnOrder();
    }

    onColumnsChange(columns: EinlagerungColumn[]): void {
        this.einlagerungColumns = columns;
    }

    resetColumnOrder(): void {
        this.einlagerungColumns = this.columnOrderService.resetOrder(
            'einlagerungColumnSettings',
            this.einlagerungColumns,
            DEFAULT_EINLAGERUNG_COLUMNS
        );
    }

    private saveColumnOrder(): void {
        this.columnOrderService.saveOrder('einlagerungColumnSettings', this.einlagerungColumns);
    }

    private loadColumnOrder(): void {
        this.columnOrderService.loadOrder('einlagerungColumnSettings', this.einlagerungColumns);
    }

    loadLageristen(): void {
        this.userService.getUsers().subscribe({
            next: (users) => {
                this.availableLageristen = users;
            }
        });
    }

    isLageristInList(lagerist: string): boolean {
        return this.availableLageristen.some(u => u.benutzer_id === lagerist);
    }

    assignLagerist(task: EinlagerungTask, lageristId: string): void {
        const oldUserId = task.lagerist || '';
        const belegnummer = String(task.entry_number);

        this.leitstandService.assignLagerist(belegnummer, oldUserId, lageristId).subscribe({
            next: (response) => {
                if (response.success) {
                    task.lagerist = lageristId;
                }
            },
            error: () => { }
        });
    }

    loadEinlagerungTasks(): void {
        this.isLoadingEinlagerung = true;
        this.leitstandService.getEinlagerungTasks().subscribe({
            next: (tasks) => {
                this.einlagerungTasks = tasks;
                this.isLoadingEinlagerung = false;
            },
            error: () => {
                this.einlagerungTasks = [];
                this.isLoadingEinlagerung = false;
            }
        });
    }
}
