import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, of, tap, catchError, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Slot, SlotSearchCriteria, CreateSlotRequest, SlotMutationResponse, EditSlotRequest } from './slot.interface';

// API Response Interface
interface SlotApiResponse {
    success: boolean;
    filialcode: string;
    count: number;
    data: Slot[];
}

@Injectable({
    providedIn: 'root'
})
export class SlotService {
    private apiUrl = environment.apiUrl;

    // Cache pro FilialCode
    private slotsCache: Map<string, Slot[]> = new Map();
    private loading$ = new BehaviorSubject<boolean>(false);
    private loadingProgress$ = new BehaviorSubject<string>('');

    constructor(private http: HttpClient) { }

    get isLoading$(): Observable<boolean> {
        return this.loading$.asObservable();
    }

    get loadingProgress$Obs(): Observable<string> {
        return this.loadingProgress$.asObservable();
    }

    /**
     * Lädt alle Slots für einen FilialCode
     * Bei wiederholten Aufrufen wird der Cache verwendet
     */
    getAllSlotsByFcode(fcode: string): Observable<Slot[]> {
        const cacheKey = fcode.toUpperCase();

        // Wenn bereits gecached, sofort zurückgeben
        if (this.slotsCache.has(cacheKey)) {
            return of(this.slotsCache.get(cacheKey)!);
        }

        this.loading$.next(true);
        this.loadingProgress$.next('Lade Stellplätze...');

        return this.http.get<SlotApiResponse>(`${this.apiUrl}/slots/get_all_slots_by_fcode?fcode=${fcode}`).pipe(
            map(response => response.data || []),
            tap(slots => {
                console.log('SlotService: Received', slots.length, 'slots for', cacheKey); // DEBUG
                this.slotsCache.set(cacheKey, slots);
                this.loading$.next(false);
                this.loadingProgress$.next('');
            }),
            catchError(err => {
                this.loading$.next(false);
                this.loadingProgress$.next('');
                console.error('Fehler beim Laden der Slots:', err);
                throw err;
            })
        );
    }

    /**
     * Gibt gecachte Slots zurück (synchron)
     */
    getCachedSlots(fcode: string): Slot[] {
        const result = this.slotsCache.get(fcode.toUpperCase()) || [];
        console.log('SlotService: getCachedSlots for', fcode.toUpperCase(), '=', result.length); // DEBUG
        return result;
    }

    /**
     * Prüft ob Daten für einen FilialCode gecached sind
     */
    isCached(fcode: string): boolean {
        return this.slotsCache.has(fcode.toUpperCase());
    }

    /**
     * Sucht/Filtert im Cache nach Kriterien
     * Alle Filter werden client-seitig angewendet
     */
    searchSlots(fcode: string, criteria: SlotSearchCriteria): Slot[] {
        const slots = this.getCachedSlots(fcode);

        if (!slots.length) return [];

        return slots.filter(slot => {
            // Textsuche über alle Felder
            if (criteria.searchTerm) {
                const term = criteria.searchTerm.toLowerCase();
                const searchableText = `${slot.regalnummer} ${slot.filialcode} ${slot.artikelnummer} ${slot.nve} ${slot.pals}`.toLowerCase();
                if (!searchableText.includes(term)) return false;
            }

            // Einzelne Filter
            if (criteria.regalnummer && !slot.regalnummer.toLowerCase().includes(criteria.regalnummer.toLowerCase())) return false;
            if (criteria.filialcode && !slot.filialcode.toLowerCase().includes(criteria.filialcode.toLowerCase())) return false;
            if (criteria.artikelnummer && !slot.artikelnummer.toLowerCase().includes(criteria.artikelnummer.toLowerCase())) return false;
            if (criteria.vintageyear && !slot.vintageyear.includes(criteria.vintageyear)) return false;
            if (criteria.charge && !slot.charge.toLowerCase().includes(criteria.charge.toLowerCase())) return false;
            if (criteria.height && !slot.height.toLowerCase().includes(criteria.height.toLowerCase())) return false;
            if (criteria.width && !slot.width.toLowerCase().includes(criteria.width.toLowerCase())) return false;
            if (criteria.depth && !slot.depth.toLowerCase().includes(criteria.depth.toLowerCase())) return false;
            if (criteria.nve && !slot.nve.toLowerCase().includes(criteria.nve.toLowerCase())) return false;
            if (criteria.createdby && !slot.createdby.toLowerCase().includes(criteria.createdby.toLowerCase())) return false;
            if (criteria.createdat && !slot.createdat.includes(criteria.createdat)) return false;
            if (criteria.updatedby && !slot.updatedby.toLowerCase().includes(criteria.updatedby.toLowerCase())) return false;
            if (criteria.updatedat && !slot.updatedat.includes(criteria.updatedat)) return false;
            if (criteria.amountbase && !String(slot.amountbase).includes(criteria.amountbase)) return false;
            if (criteria.amount && !String(slot.amount).includes(criteria.amount)) return false;
            if (criteria.unit && !slot.unit.toLowerCase().includes(criteria.unit.toLowerCase())) return false;
            if (criteria.amountunit && !String(slot.amountunit).includes(criteria.amountunit)) return false;
            if (criteria.pals && !slot.pals.toLowerCase().includes(criteria.pals.toLowerCase())) return false;

            // Boolean Filter
            if (criteria.ist_kommiplatz !== null && criteria.ist_kommiplatz !== undefined && slot.ist_kommiplatz !== criteria.ist_kommiplatz) return false;
            if (criteria.locked !== null && criteria.locked !== undefined && slot.locked !== criteria.locked) return false;
            if (criteria._bio !== null && criteria._bio !== undefined && slot._bio !== criteria._bio) return false;
            if (criteria.liquor !== null && criteria.liquor !== undefined && slot.liquor !== criteria.liquor) return false;
            if (criteria.orderarticle !== null && criteria.orderarticle !== undefined && slot.orderarticle !== criteria.orderarticle) return false;
            if (criteria.tax !== null && criteria.tax !== undefined && slot.tax !== criteria.tax) return false;

            // Nur belegte Slots
            if (criteria.onlyOccupied && slot.amount === 0) return false;

            return true;
        });
    }

    /**
     * Paginiert die Ergebnisse
     */
    paginateSlots(slots: Slot[], page: number, pageSize: number): { data: Slot[], totalItems: number, totalPages: number } {
        const totalItems = slots.length;
        const totalPages = Math.ceil(totalItems / pageSize) || 1;
        const startIndex = (page - 1) * pageSize;
        const endIndex = startIndex + pageSize;

        return {
            data: slots.slice(startIndex, endIndex),
            totalItems,
            totalPages
        };
    }

    /**
     * Cache für einen FilialCode leeren
     */
    clearCache(fcode?: string): void {
        if (fcode) {
            this.slotsCache.delete(fcode.toUpperCase());
        } else {
            this.slotsCache.clear();
        }
    }

    /**
     * Cache neu laden (z.B. nach Änderungen)
     */
    refreshCache(fcode: string): Observable<Slot[]> {
        this.clearCache(fcode);
        return this.getAllSlotsByFcode(fcode);
    }

    /**
     * Löscht einen Slot anhand der Regalnummer
     * DELETE /slots/remove_slot?regalNr={regalNr}
     */
    deleteSlot(regalNr: string): Observable<SlotMutationResponse> {
        return this.http.delete<SlotMutationResponse>(
            `${this.apiUrl}/slots/remove_slot?regalNr=${encodeURIComponent(regalNr)}`
        );
    }

    /**
     * Fügt einen neuen Slot hinzu
     * POST /slots/add_slot
     */
    addSlot(slot: CreateSlotRequest): Observable<SlotMutationResponse> {
        return this.http.post<SlotMutationResponse>(
            `${this.apiUrl}/slots/add_slot`,
            slot
        );
    }

    /**
     * Bearbeitet einen bestehenden Slot
     * PUT /slots/edit_slot
     */
    editSlot(slot: EditSlotRequest): Observable<SlotMutationResponse> {
        return this.http.put<SlotMutationResponse>(
            `${this.apiUrl}/slots/edit_slot`,
            slot
        );
    }
}
