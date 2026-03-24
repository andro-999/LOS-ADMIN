import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIcon } from '@angular/material/icon';
import { CdkDragDrop, DragDropModule } from '@angular/cdk/drag-drop';
import { LeitstandService, KdxRegalplatz } from '../leitstand.service';
import { ColumnSettingsComponent, ColumnConfig } from '../../../components/column-settings/column-settings.component';
import { ColumnOrderService } from '../../../services/column-order.service';

type KdxColumn = ColumnConfig;

const DEFAULT_KDX_COLUMNS: KdxColumn[] = [
    { id: 'nr', label: 'Nr.', visible: true, width: '60px' },
    { id: 'regalNr', label: 'Regalnummer', visible: true, width: '160px' },
    { id: 'besetzt', label: 'Besetzt', visible: true, width: '100px' },
    { id: 'gesperrt', label: 'Reserviert', visible: true, width: '120px' },
    { id: 'freigeben', label: 'Freigeben', visible: true, width: '180px' }
];

@Component({
    selector: 'app-kdx-bereinigung',
    standalone: true,
    imports: [CommonModule, FormsModule, MatIcon, DragDropModule, ColumnSettingsComponent],
    templateUrl: './kdx-bereinigung.component.html',
    styleUrls: ['./kdx-bereinigung.component.scss']
})
export class KdxBereinigungComponent implements OnInit {
    @Input() searchTerm: string = '';
    @Input() kdxReserviertFilter: string = '';
    @Output() filterChanged = new EventEmitter<void>();

    kdxTurmNr: number = 3;
    kdxTablarNr: number = 1;
    kdxRegalplaetze: (KdxRegalplatz & { releasing?: boolean })[] = [];
    filteredKdxRegalplaetze: (KdxRegalplatz & { releasing?: boolean })[] = [];
    isLoadingKdxBoxen: boolean = false;
    kdxColumns: KdxColumn[] = DEFAULT_KDX_COLUMNS.map(col => ({ ...col }));

    get visibleColumnsCount(): number {
        return this.kdxColumns.filter(c => c.visible).length;
    }

    constructor(
        private leitstandService: LeitstandService,
        private columnOrderService: ColumnOrderService
    ) { }

    ngOnInit(): void {
        this.loadColumnOrder();
        this.loadKdxBoxen();
    }

    dropColumn(event: CdkDragDrop<string[]>): void {
        this.columnOrderService.applyDrop(event, this.kdxColumns);
        this.saveColumnOrder();
    }

    onColumnsChange(columns: KdxColumn[]): void {
        this.kdxColumns = columns;
    }

    resetColumnOrder(): void {
        this.kdxColumns = this.columnOrderService.resetOrder(
            'kdxColumnSettings',
            this.kdxColumns,
            DEFAULT_KDX_COLUMNS
        );
    }

    private saveColumnOrder(): void {
        this.columnOrderService.saveOrder('kdxColumnSettings', this.kdxColumns);
    }

    private loadColumnOrder(): void {
        this.columnOrderService.loadOrder('kdxColumnSettings', this.kdxColumns);
    }

    loadKdxBoxen(): void {
        if (!this.kdxTurmNr || !this.kdxTablarNr) {
            return;
        }

        this.isLoadingKdxBoxen = true;
        this.kdxRegalplaetze = [];

        this.leitstandService.getKdxBoxen(this.kdxTurmNr, this.kdxTablarNr).subscribe({
            next: (response) => {
                if (response.success && response.boxen) {
                    const plaetze: (KdxRegalplatz & { releasing?: boolean })[] = [];
                    response.boxen.forEach((box) => {
                        box.rows.forEach((row) => {
                            row.forEach((cell) => {
                                plaetze.push({ ...cell, releasing: false });
                            });
                        });
                    });
                    this.kdxRegalplaetze = plaetze;
                    this.filterKdxRegalplaetze();
                }
                this.isLoadingKdxBoxen = false;
            },
            error: () => {
                this.isLoadingKdxBoxen = false;
            }
        });
    }

    filterKdxRegalplaetze(): void {
        const searchLower = this.searchTerm.toLowerCase().trim();

        this.filteredKdxRegalplaetze = this.kdxRegalplaetze.filter(platz => {
            const textMatch = !searchLower || platz.regalNr.toLowerCase().includes(searchLower);

            let reserviertMatch = true;
            if (this.kdxReserviertFilter === 'reserviert') {
                reserviertMatch = platz.gesperrt === true;
            } else if (this.kdxReserviertFilter === 'frei') {
                reserviertMatch = platz.gesperrt === false;
            }

            return textMatch && reserviertMatch;
        });
    }

    releaseRegalplatz(regalNr: string): void {
        const platz = this.kdxRegalplaetze.find(p => p.regalNr === regalNr);
        if (platz) {
            platz.releasing = true;
        }

        this.leitstandService.releaseKdxRegal(regalNr).subscribe({
            next: (response) => {
                if (response.success && platz) {
                    platz.gesperrt = false;
                    platz.releasing = false;
                    this.filterKdxRegalplaetze();
                }
            },
            error: () => {
                if (platz) {
                    platz.releasing = false;
                }
            }
        });
    }

    getReserviertCount(): number {
        return this.kdxRegalplaetze.filter(p => p.gesperrt).length;
    }
}
