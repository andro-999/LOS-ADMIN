import { Component, OnInit, OnDestroy, Input, Output, EventEmitter, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIcon } from '@angular/material/icon';
import { CdkDragDrop, DragDropModule } from '@angular/cdk/drag-drop';
import { LeitstandService, Auftrag, Position, GroupedPosition, EmptyKommiPosition } from '../leitstand.service';
import { User, UserService } from '../../../services/user.service';
import { DisabledWhenErledigtDirective } from '../../../directives/disabled-when-erledigt.directive';
import { NavigationService } from '../../../services/navigation.service';
import { ColumnSettingsComponent, ColumnConfig } from '../../../components/column-settings/column-settings.component';
import { TableFilterRowComponent } from '../../../components/table-filter-row/table-filter-row.component';
import { DateInputComponent } from '../../../components/date-input/date-input.component';
import { ColumnOrderService } from '../../../services/column-order.service';
import { Subscription } from 'rxjs';
import { WartungService } from '../../../services/wartung.service';

export type KommiColumn = ColumnConfig;

const DEFAULT_KOMMI_COLUMNS: KommiColumn[] = [
    { id: 'nr', label: 'Nr.', visible: true, width: '20px', filterType: 'none' },
    { id: 'auftragsnummer', label: 'Source Nr.', visible: true, width: '50px', filterType: 'text', filterPlaceholder: 'Source Nr.' },
    { id: 'belegnummer', label: 'Document Nr.', visible: true, width: '70px', filterType: 'text', filterPlaceholder: 'Doc. Nr.' },
    { id: 'tournummer', label: 'Tourcode', visible: true, width: '50px', filterType: 'text', filterPlaceholder: 'Tour' },
    { id: 'bruttogewicht', label: 'Bruttogewicht', visible: true, width: '100px', filterType: 'operator-number', filterPlaceholder: 'kg' },
    { id: 'lieferdatum', label: 'Lieferdatum', visible: true, width: '100px', filterType: 'text', filterPlaceholder: 'z.B. 120526' },
    { id: 'menge', label: 'Menge', visible: true, width: '80px', filterType: 'text', filterPlaceholder: 'Menge' },
    { id: 'pickMenge', label: 'Pick Menge', visible: true, width: '80px', filterType: 'text', filterPlaceholder: 'Pick' },
    { id: 'debitor', label: 'Name', visible: true, width: '500px', filterType: 'text', filterPlaceholder: 'Name' },
    { id: 'palettenanzahl', label: 'Paletten', visible: true, width: '50px', filterType: 'none' },
    { id: 'packhilfen', label: 'Packhilfen', visible: true, width: '50px', filterType: 'none' },
    { id: 'nachschub', label: 'Nachschub', visible: true, width: '50px', filterType: 'text', filterPlaceholder: 'Menge' },
    { id: 'staplerkomm', label: 'Stapler komm', visible: true, width: '50px', filterType: 'none' },
    { id: 'lagerist', label: 'Lagerist', visible: true, width: '100px', filterType: 'text', filterPlaceholder: 'Lagerist' },
    {
        id: 'status', label: 'Status', visible: true, width: '40px', filterType: 'select',
        filterOptions: [
            { value: '', label: 'Alle' },
            { value: 'offen', label: 'Offen' },
            { value: 'gestartet', label: 'Gestartet' },
            { value: 'erledigt', label: 'Erledigt' }
        ]
    },
    {
        id: 'prioritaet', label: 'Priorität', visible: true, width: '40px', filterType: 'select',
        filterOptions: [{ value: '', label: 'Alle' }]
    },
    { id: 'loeschen', label: 'Löschen', visible: true, width: '40px', filterType: 'none' },
    { id: 'blockieren', label: 'Blockieren', visible: true, width: '40px', filterType: 'none' },
    {
        id: 'gesperrt', label: 'Alle Positionen bereit', visible: true, width: '40px', filterType: 'select',
        filterOptions: [
            { value: '', label: 'Alle' },
            { value: 'gesperrt', label: 'Gesperrt' },
            { value: 'nicht-gesperrt', label: 'Bereit' }
        ]
    },
    {
        id: 'einlagerungsvariante', label: 'EinVar', title: 'Einlagerungsvariante', visible: true, width: '70px', filterType: 'select',
        filterOptions: [
            { value: '', label: 'Alle' },
            { value: '1', label: 'A' },
            { value: '2', label: 'B' }
        ]
    }
];

@Component({
    selector: 'app-kommi-auftraege',
    standalone: true,
    imports: [CommonModule, FormsModule, MatIcon, DragDropModule, ColumnSettingsComponent, DisabledWhenErledigtDirective, DateInputComponent, TableFilterRowComponent],
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
    lieferdatumBis: string = '';
    columnFilters: { [key: string]: string } = {
        auftragsnummer: '', belegnummer: '', tournummer: '', bruttogewicht: '',
        lieferdatum: '', menge: '', pickMenge: '', debitor: '', nachschub: '',
        lagerist: '', status: '', prioritaet: '', gesperrt: '', einlagerungsvariante: ''
    };
    private varianteSub?: Subscription;

    get visibleColumnsCount(): number {
        return this.kommiColumns.filter(c => c.visible).length;
    }

    constructor(
        private leitstandService: LeitstandService,
        private userService: UserService,
        private navigationService: NavigationService,
        private columnOrderService: ColumnOrderService,
        private wartungService: WartungService,
        private cdr: ChangeDetectorRef
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
        const f = this.columnFilters;

        this.filteredAuftraege = this.auftraege.filter(auftrag => {
            const lieferdatumStr = auftrag.lieferdatum
                ? new Date(auftrag.lieferdatum).toISOString().split('T')[0]
                : '';

            // Header-Filter: Lieferdatum bis (Bereich)
            if (this.lieferdatumBis && lieferdatumStr > this.lieferdatumBis) return false;

            // Spaltenfilter: Lieferdatum exakt (Tag) – flexible Texteingabe wie DateInputComponent
            if (f['lieferdatum']) {
                const parsed = this.parseDateInput(f['lieferdatum']);
                if (parsed && lieferdatumStr !== parsed) return false;
            }

            // Text-Spaltenfilter
            if (f['auftragsnummer'] && !auftrag.auftragsnummer?.toLowerCase().includes(f['auftragsnummer'].toLowerCase())) return false;
            if (f['belegnummer'] && !auftrag.belegnummer?.toLowerCase().includes(f['belegnummer'].toLowerCase())) return false;
            if (f['tournummer'] && !auftrag.tourcode?.toLowerCase().includes(f['tournummer'].toLowerCase())) return false;
            if (f['bruttogewicht']) {
                const idx = f['bruttogewicht'].indexOf(':');
                if (idx !== -1) {
                    const op = f['bruttogewicht'].substring(0, idx);
                    const filterVal = parseFloat(f['bruttogewicht'].substring(idx + 1));
                    if (!isNaN(filterVal) && auftrag.bruttoGewicht != null) {
                        // bruttoGewicht kann als deutsches Zahlenformat vorliegen (z.B. "3,000" = 3.0)
                        const raw = typeof auftrag.bruttoGewicht === 'number'
                            ? auftrag.bruttoGewicht
                            : parseFloat(String(auftrag.bruttoGewicht).replace(',', '.'));
                        // Wenn Wert nicht parsierbar → Zeile nicht ausschließen
                        if (!isNaN(raw)) {
                            if (op === '<' && !(raw < filterVal)) return false;
                            if (op === '=' && !(raw === filterVal)) return false;
                            if (op === '>' && !(raw > filterVal)) return false;
                        }
                    }
                }
            }
            if (f['debitor'] && !auftrag.kunde?.toLowerCase().includes(f['debitor'].toLowerCase())) return false;
            if (f['lagerist'] && !auftrag.lagerist?.toLowerCase().includes(f['lagerist'].toLowerCase())) return false;
            if (f['menge'] && !this.getAuftragMenge(auftrag).toString().includes(f['menge'])) return false;
            if (f['pickMenge'] && !this.getAuftragPickMenge(auftrag).toString().includes(f['pickMenge'])) return false;
            if (f['nachschub'] && !this.getNachschubMenge(auftrag).toString().includes(f['nachschub'])) return false;

            // Select-Spaltenfilter
            if (f['status'] && this.getAuftragStatus(auftrag) !== f['status']) return false;
            if (f['prioritaet'] && auftrag.prioritaet?.toString() !== f['prioritaet']) return false;
            if (f['gesperrt']) {
                const gesperrt = this.isGesperrt(auftrag);
                if (f['gesperrt'] === 'gesperrt' && !gesperrt) return false;
                if (f['gesperrt'] === 'nicht-gesperrt' && gesperrt) return false;
            }
            if (f['einlagerungsvariante'] && (auftrag.einlagerungslogik_variante ?? 1).toString() !== f['einlagerungsvariante']) return false;

            return true;
        });
    }

    onColumnFiltersChange(filters: { [key: string]: string }): void {
        this.columnFilters = filters;
        this.filterAuftraege();
    }

    clearAllFilters(): void {
        this.lieferdatumBis = '';
        Object.keys(this.columnFilters).forEach(k => this.columnFilters[k] = '');
        this.filterAuftraege();
    }

    refreshData(): void {
        this.loadAuftraege();
        this.loadEmptyPositions();
    }

    /** Parst flexible Datumseingabe in YYYY-MM-DD (gleiche Logik wie DateInputComponent).
     *  Unterstützt: 120526 (DDMMYY), 12052026 (DDMMYYYY), 1205 (DDMM = aktuelles Jahr) */
    private parseDateInput(raw: string): string | null {
        if (!raw || raw.trim() === '') return null;
        const digits = raw.replace(/\D/g, '');
        let day: number, month: number, year: number;
        if (digits.length === 8) {
            day = parseInt(digits.substring(0, 2), 10);
            month = parseInt(digits.substring(2, 4), 10);
            year = parseInt(digits.substring(4, 8), 10);
        } else if (digits.length === 6) {
            day = parseInt(digits.substring(0, 2), 10);
            month = parseInt(digits.substring(2, 4), 10);
            const yy = parseInt(digits.substring(4, 6), 10);
            year = yy < 50 ? 2000 + yy : 1900 + yy;
        } else if (digits.length === 4) {
            day = parseInt(digits.substring(0, 2), 10);
            month = parseInt(digits.substring(2, 4), 10);
            year = new Date().getFullYear();
        } else {
            return null;
        }
        if (month < 1 || month > 12 || day < 1 || day > 31) return null;
        const date = new Date(year, month - 1, day);
        if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) return null;
        return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    }

    updateAvailablePriorities(): void {
        const priorities = new Set<number>();
        this.auftraege.forEach(auftrag => {
            if (auftrag.prioritaet !== null && auftrag.prioritaet !== undefined) {
                priorities.add(auftrag.prioritaet);
            }
        });
        this.availablePriorities = Array.from(priorities).sort((a, b) => a - b);

        // Priorität-Spaltenfilter dynamisch mit vorhandenen Werten befüllen
        const prioCol = this.kommiColumns.find(c => c.id === 'prioritaet');
        if (prioCol) {
            prioCol.filterOptions = [
                { value: '', label: 'Alle' },
                ...this.availablePriorities.map(p => ({ value: String(p), label: String(p) }))
            ];
        }
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

        const oldPrio = auftrag.prioritaet;

        this.leitstandService.changePrio(belegnummer, newPrio).subscribe({
            next: (response) => {
                if (response.success) {
                    auftrag.prioritaet = newPrio;
                    this.updateAvailablePriorities();
                } else {
                    auftrag.prioritaet = undefined;
                    this.cdr.detectChanges();
                    auftrag.prioritaet = oldPrio;
                    this.cdr.detectChanges();
                }
            },
            error: () => {
                auftrag.prioritaet = undefined;
                this.cdr.detectChanges();
                auftrag.prioritaet = oldPrio;
                this.cdr.detectChanges();
            }
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
