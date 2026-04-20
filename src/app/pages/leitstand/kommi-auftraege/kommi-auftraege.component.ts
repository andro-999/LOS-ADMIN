import { Component, OnInit, OnDestroy, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIcon } from '@angular/material/icon';
import { CdkDragDrop, DragDropModule } from '@angular/cdk/drag-drop';
import { LeitstandService, Auftrag, Position, GroupedPosition, EmptyKommiPosition } from '../leitstand.service';
import { User, UserService } from '../../../services/user.service';
import { DisabledWhenErledigtDirective } from '../../../directives/disabled-when-erledigt.directive';
import { NavigationService } from '../../../services/navigation.service';
import { ColumnSettingsComponent, ColumnConfig } from '../../../components/column-settings/column-settings.component';
import { ColumnOrderService } from '../../../services/column-order.service';
import { Subscription } from 'rxjs';
import { WartungService } from '../../../services/wartung.service';

export type KommiColumn = ColumnConfig;

const DEFAULT_KOMMI_COLUMNS: KommiColumn[] = [
    { id: 'nr', label: 'Nr.', visible: true, width: '20px' },
    { id: 'auftragsnummer', label: 'Source Nr.', visible: true, width: '50px' },
    { id: 'belegnummer', label: 'Document Nr.', visible: true, width: '70px' },
    { id: 'tournummer', label: 'Tourcode', visible: true, width: '50px' },
    { id: 'bruttogewicht', label: 'Bruttogewicht', visible: true, width: '100px' },
    { id: 'lieferdatum', label: 'Lieferdatum', visible: true, width: '100px' },
    { id: 'menge', label: 'Menge', visible: true, width: '80px' },
    { id: 'pickMenge', label: 'Pick Menge', visible: true, width: '80px' },
    { id: 'debitor', label: 'Name', visible: true, width: '500px' },
    { id: 'palettenanzahl', label: 'Paletten', visible: true, width: '50px' },
    { id: 'packhilfen', label: 'Packhilfen', visible: true, width: '50px' },
    { id: 'nachschub', label: 'Nachschub', visible: true, width: '50px' },
    { id: 'staplerkomm', label: 'Stapler komm', visible: true, width: '50px' },
    { id: 'lagerist', label: 'Lagerist', visible: true, width: '100px' },
    { id: 'status', label: 'Status', visible: true, width: '40px' },
    { id: 'prioritaet', label: 'Priorität', visible: true, width: '40px' },
    { id: 'loeschen', label: 'Löschen', visible: true, width: '40px' },
    { id: 'blockieren', label: 'Blockieren', visible: true, width: '40px' },
    { id: 'gesperrt', label: 'Alle Positionen bereit', visible: true, width: '40px' },
    { id: 'einlagerungsvariante', label: 'EinVar', title: 'Einlagerungsvariante', visible: true, width: '70px' }
];

@Component({
    selector: 'app-kommi-auftraege',
    standalone: true,
    imports: [CommonModule, FormsModule, MatIcon, DragDropModule, ColumnSettingsComponent, DisabledWhenErledigtDirective],
    templateUrl: './kommi-auftraege.component.html',
    styleUrls: ['./kommi-auftraege.component.scss']
})
export class KommiAuftraegeComponent implements OnInit, OnDestroy {
    @Input() searchTerm: string = '';
    @Input() selectedPriority: string = '';
    @Input() selectedStatus: string = '';
    @Input() selectedGesperrt: string = '';
    @Output() auftraegeCountChanged = new EventEmitter<number>();

    auftraege: Auftrag[] = [];
    filteredAuftraege: Auftrag[] = [];
    availableLageristen: User[] = [];
    availablePriorities: number[] = [];

    kommiColumns: KommiColumn[] = DEFAULT_KOMMI_COLUMNS.map(col => ({ ...col }));
    prioOptions: number[] = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    emptyPositionsMap: { [belegnummer: string]: EmptyKommiPosition[] } = {};

    expandedAuftrag: string | null = null;
    expandedLevel: 1 | 2 = 1;
    selectedAuftrag: Auftrag | null = null;
    selectedRowIndex: number = 0;

    storageIsActive: boolean = false;
    private varianteSub?: Subscription;

    get visibleColumnsCount(): number {
        return this.kommiColumns.filter(c => c.visible).length;
    }

    constructor(
        private leitstandService: LeitstandService,
        private userService: UserService,
        private navigationService: NavigationService,
        private columnOrderService: ColumnOrderService,
        private wartungService: WartungService
    ) { }

    ngOnInit(): void {
        this.loadColumnOrder();
        this.loadAuftraege();
        this.loadLageristen();
        this.loadEmptyPositions();
        this.loadStorageStatus();

        this.varianteSub = this.wartungService.varianteChanged$.subscribe(({ belegnummer, variante }) => {
            const auftrag = this.auftraege.find(a => a.belegnummer === belegnummer);
            if (auftrag) {
                auftrag.einlagerungslogik_variante = variante;
            }
        });
    }

    ngOnDestroy(): void {
        this.varianteSub?.unsubscribe();
    }

    loadEmptyPositions(): void {
        this.leitstandService.getEmptyKommiPositions().subscribe({
            next: (map) => { this.emptyPositionsMap = map; },
            error: () => { this.emptyPositionsMap = {}; }
        });
    }

    isGesperrt(auftrag: Auftrag): boolean {
        return (this.emptyPositionsMap[auftrag.belegnummer!]?.length ?? 0) > 0;
    }

    getFehlendePosForAuftrag(auftrag: Auftrag): EmptyKommiPosition[] {
        return this.emptyPositionsMap[auftrag.belegnummer!] ?? [];
    }

    getNachschubMenge(auftrag: Auftrag): number {
        return this.getFehlendePosForAuftrag(auftrag)
            .reduce((sum, pos) => sum + (pos.zu_liefern ?? 0), 0);
    }

    loadAuftraege(): void {
        this.leitstandService.getAuftraege('KOMM').subscribe({
            next: (auftraege: Auftrag[]) => {
                this.auftraege = auftraege
                    .map((auftrag, index) => ({ ...auftrag, id: index + 1 }))
                    .sort((a, b) => (a.belegnummer || '').localeCompare(b.belegnummer || ''));

                this.filteredAuftraege = [...this.auftraege];
                if (this.filteredAuftraege.length > 0) {
                    this.selectRow(0);
                }
                this.updateAvailablePriorities();
                this.auftraegeCountChanged.emit(this.auftraege.length);
                this.navigationService.updateAuftraegeCount(this.auftraege.length);
            },
            error: () => {
                this.auftraege = [];
                this.filteredAuftraege = [];
            }
        });
    }

    loadLageristen(): void {
        this.userService.getUsers().subscribe({
            next: (users) => {
                this.availableLageristen = users;
            },
            error: () => { }
        });
    }

    filterAuftraege(): void {
        const searchLower = this.searchTerm.toLowerCase().trim();

        this.filteredAuftraege = this.auftraege.filter(auftrag => {
            let lieferdatumStr = '';
            if (auftrag.lieferdatum) {
                const date = new Date(auftrag.lieferdatum);
                lieferdatumStr = date.toISOString().split('T')[0];
            }

            const textMatch = !searchLower || (
                auftrag.belegnummer?.toLowerCase().includes(searchLower) ||
                auftrag.auftragsnummer?.toLowerCase().includes(searchLower) ||
                auftrag.kunde?.toLowerCase().includes(searchLower) ||
                lieferdatumStr.includes(searchLower) ||
                (auftrag.plz && auftrag.plz.toLowerCase().includes(searchLower))
            );

            const priorityMatch = !this.selectedPriority ||
                auftrag.prioritaet?.toString() === this.selectedPriority;

            const auftragStatus = this.getAuftragStatus(auftrag);
            const statusMatch = !this.selectedStatus || auftragStatus === this.selectedStatus;

            const gesperrtMatch = !this.selectedGesperrt ||
                (this.selectedGesperrt === 'gesperrt' && this.isGesperrt(auftrag)) ||
                (this.selectedGesperrt === 'nicht-gesperrt' && !this.isGesperrt(auftrag));

            return textMatch && priorityMatch && statusMatch && gesperrtMatch;
        });
    }

    updateAvailablePriorities(): void {
        const priorities = new Set<number>();
        this.auftraege.forEach(auftrag => {
            if (auftrag.prioritaet !== null && auftrag.prioritaet !== undefined) {
                priorities.add(auftrag.prioritaet);
            }
        });
        this.availablePriorities = Array.from(priorities).sort((a, b) => a - b);
    }

    // Spalten-Management
    dropColumn(event: CdkDragDrop<string[]>): void {
        this.columnOrderService.applyDrop(event, this.kommiColumns);
        this.saveColumnOrder();
    }

    private saveColumnOrder(): void {
        this.columnOrderService.saveOrder('kommiColumnSettings', this.kommiColumns);
    }

    private loadColumnOrder(): void {
        this.columnOrderService.loadOrder('kommiColumnSettings', this.kommiColumns);
    }

    resetColumnOrder(): void {
        this.kommiColumns = this.columnOrderService.resetOrder('kommiColumnSettings', this.kommiColumns, DEFAULT_KOMMI_COLUMNS);
    }

    onColumnsChange(columns: KommiColumn[]): void {
        this.kommiColumns = columns;
    }

    // Status-Methoden
    getAuftragStatus(auftrag: Auftrag): 'offen' | 'gestartet' | 'erledigt' {
        return this.leitstandService.getAuftragStatus(auftrag);
    }

    isAuftragErledigt(auftrag: Auftrag): boolean {
        return this.leitstandService.isAuftragErledigt(auftrag);
    }

    isAuftragGestartet(auftrag: Auftrag): boolean {
        return this.leitstandService.isAuftragGestartet(auftrag);
    }

    isAuftragBlocked(auftrag: Auftrag): boolean {
        return auftrag.blocked === true;
    }

    isLageristInList(lagerist: string): boolean {
        return this.availableLageristen.some(u => u.benutzer_id === lagerist);
    }

    // Mengen-Methoden
    getAuftragMenge(auftrag: Auftrag): number {
        return this.leitstandService.getAuftragMenge(auftrag);
    }

    getAuftragPickMenge(auftrag: Auftrag): number {
        return this.leitstandService.getAuftragPickMenge(auftrag);
    }

    getPalettenAnzahl(auftrag: Auftrag): number {
        return this.leitstandService.getPalettenAnzahl(auftrag);
    }

    getPackhilfenAnzahl(auftrag: Auftrag): number {
        return this.leitstandService.getPackhilfenAnzahl(auftrag);
    }

    getGroupedPositions(auftrag: Auftrag): GroupedPosition[] {
        return this.leitstandService.getGroupedPositions(auftrag);
    }

    getPositionFortschritt(position: Position | GroupedPosition): string {
        return this.leitstandService.getPositionFortschritt(position);
    }

    getAFS(auftrag: Auftrag): { comp: number; notSt: number; total: number; percent: number } {
        return this.leitstandService.getAuftragFortschritt(auftrag);
    }

    // Aktionen
    selectRow(index: number): void {
        this.selectedRowIndex = index;
        if (this.filteredAuftraege[index]) {
            this.selectedAuftrag = this.filteredAuftraege[index];
        }
    }

    toggleAuftragExpand(auftrag: Auftrag, event: Event): void {
        event.stopPropagation();
        if (this.expandedAuftrag === auftrag.belegnummer) {
            this.expandedAuftrag = null;
            this.expandedLevel = 1;
            this.selectedAuftrag = null;
        } else {
            this.expandedAuftrag = auftrag.belegnummer || null;
            this.expandedLevel = 1;
            this.selectedAuftrag = auftrag;
        }
    }

    toggleDetailLevel(): void {
        this.expandedLevel = this.expandedLevel === 1 ? 2 : 1;
    }

    isAuftragExpanded(auftrag: Auftrag): boolean {
        return this.expandedAuftrag === auftrag.belegnummer;
    }

    changePrio(auftrag: Auftrag, newPrio: number): void {
        const belegnummer = auftrag.belegnummer;
        if (!belegnummer || auftrag.prioritaet === newPrio) return;

        this.leitstandService.changePrio(belegnummer, newPrio).subscribe({
            next: (response) => {
                if (response.success) {
                    auftrag.prioritaet = newPrio;
                    this.updateAvailablePriorities();
                }
            },
            error: () => { }
        });
    }

    blockAuftrag(auftrag: Auftrag): void {
        const belegnummer = auftrag.belegnummer;
        if (!belegnummer) return;

        this.leitstandService.blockKommiTask(belegnummer).subscribe({
            next: (response) => {
                if (response.success) {
                    auftrag.blocked = true;
                }
            },
            error: () => { }
        });
    }

    unblockAuftrag(auftrag: Auftrag): void {
        const belegnummer = auftrag.belegnummer;
        if (!belegnummer) return;

        this.leitstandService.releaseKommiTask(belegnummer).subscribe({
            next: (response) => {
                if (response.success) {
                    auftrag.blocked = false;
                }
            },
            error: () => { }
        });
    }

    deleteAuftrag(belegnummer?: string): void {
        if (!belegnummer) return;

        if (confirm(`Möchten Sie den Auftrag ${belegnummer} wirklich löschen?`)) {
            this.leitstandService.deleteTask(belegnummer).subscribe({
                next: (response) => {
                    if (response.success) {
                        this.auftraege = this.auftraege.filter(a => a.belegnummer !== belegnummer);
                        this.filteredAuftraege = this.filteredAuftraege.filter(a => a.belegnummer !== belegnummer);
                        this.auftraegeCountChanged.emit(this.auftraege.length);
                        this.navigationService.updateAuftraegeCount(this.auftraege.length);
                    }
                },
                error: () => { }
            });
        }
    }

    assignLagerist(belegnummer: string | undefined, lageristId: string): void {
        if (!belegnummer) return;

        const auftrag = this.auftraege.find(a => a.belegnummer === belegnummer);
        const oldUserId = auftrag?.lagerist || '';

        this.leitstandService.assignLagerist(belegnummer, oldUserId, lageristId).subscribe({
            next: (response) => {
                if (response.success && auftrag) {
                    auftrag.lagerist = lageristId;
                }
            },
            error: () => { }
        });
    }

    loadStorageStatus(): void {
        this.wartungService.getStorageStatus().subscribe({
            next: (response) => {
                if (response.success) {
                    this.storageIsActive = response.is_active;
                }
            },
            error: () => { }
        });
    }

    toggleStorageStatus(): void {
        this.wartungService.changeStorageStatus(!this.storageIsActive).subscribe({
            next: (response) => {
                if (response.success) {
                    this.storageIsActive = !this.storageIsActive;
                }
            },
            error: () => { }
        });
    }

    changeEinlagerungsVariante(auftrag: Auftrag, variante: 1 | 2): void {
        if (!auftrag.belegnummer) return;
        this.wartungService.changeStorePutLogic(auftrag.belegnummer, variante).subscribe({
            next: (response) => {
                if (response.success) {
                    auftrag.einlagerungslogik_variante = variante;
                }
            },
            error: () => { }
        });
    }
}
