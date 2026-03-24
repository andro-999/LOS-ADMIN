import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIcon } from '@angular/material/icon';
import { CdkDragDrop, DragDropModule } from '@angular/cdk/drag-drop';
import { InventurService, InventurTask } from '../../inventur/inventur.service';
import { AuthService } from '../../../services/auth.service';
import { ColumnSettingsComponent, ColumnConfig } from '../../../components/column-settings/column-settings.component';
import { ColumnOrderService } from '../../../services/column-order.service';

type InventurColumn = ColumnConfig;

const DEFAULT_INVENTUR_COLUMNS: InventurColumn[] = [
    { id: 'nr', label: 'Nr.', visible: true, width: '60px' },
    { id: 'pid', label: 'Prozess-ID', visible: true, width: '140px' },
    { id: 'regalArea', label: 'Regalbereich', visible: true, width: '150px' },
    { id: 'fCode', label: 'Lager', visible: true, width: '100px' },
    { id: 'status', label: 'Status', visible: true, width: '120px' },
    { id: 'initiatorUserId', label: 'Initiator', visible: true, width: '130px' },
    { id: 'executorUserId', label: 'Bearbeiter', visible: true, width: '130px' },
    { id: 'createdAt', label: 'Erstellt am', visible: true, width: '170px' }
];

@Component({
    selector: 'app-inventur-aufgaben',
    standalone: true,
    imports: [CommonModule, MatIcon, DragDropModule, ColumnSettingsComponent],
    templateUrl: './inventur-aufgaben.component.html',
    styleUrls: ['./inventur-aufgaben.component.scss']
})
export class InventurAufgabenComponent implements OnInit {
    inventurTasks: InventurTask[] = [];
    isLoadingInventur: boolean = false;
    inventurColumns: InventurColumn[] = DEFAULT_INVENTUR_COLUMNS.map(col => ({ ...col }));

    get visibleColumnsCount(): number {
        return this.inventurColumns.filter(c => c.visible).length;
    }

    constructor(
        private inventurService: InventurService,
        private authService: AuthService,
        private columnOrderService: ColumnOrderService
    ) { }

    ngOnInit(): void {
        this.loadColumnOrder();
        this.loadInventurTasks();
    }

    dropColumn(event: CdkDragDrop<string[]>): void {
        this.columnOrderService.applyDrop(event, this.inventurColumns);
        this.saveColumnOrder();
    }

    onColumnsChange(columns: InventurColumn[]): void {
        this.inventurColumns = columns;
    }

    resetColumnOrder(): void {
        this.inventurColumns = this.columnOrderService.resetOrder(
            'inventurColumnSettings',
            this.inventurColumns,
            DEFAULT_INVENTUR_COLUMNS
        );
    }

    private saveColumnOrder(): void {
        this.columnOrderService.saveOrder('inventurColumnSettings', this.inventurColumns);
    }

    private loadColumnOrder(): void {
        this.columnOrderService.loadOrder('inventurColumnSettings', this.inventurColumns);
    }

    loadInventurTasks(): void {
        const userid = this.authService.getUsername() || '';
        if (!userid) {
            return;
        }

        this.isLoadingInventur = true;
        this.inventurService.getAllTasks(userid).subscribe({
            next: (tasks) => {
                this.inventurTasks = tasks;
                this.isLoadingInventur = false;
            },
            error: () => {
                this.inventurTasks = [];
                this.isLoadingInventur = false;
            }
        });
    }
}
