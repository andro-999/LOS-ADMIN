import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { map, tap, catchError } from 'rxjs/operators';

export interface CreateInventurSlotRequest {
    initiatorid: string;
    turmNr: number;
    tablarNr: number;
    boxNr?: number;
    column?: number;
    row?: number;
}

export interface ProzessId {
    pid: number;
    definitionkey: string;
    businesskey: string;
    pstate: string;
    variables: {
        fCode: string;
        regalNr: string;
        stockId: string;
        articleId: string;
        createdAt: string;
        regalArea: string;
        executorUserId: string;
        initiatorUserId: string;
    };
}

export interface InventurTaskData {
    InitiatorUserId: string;
    regalnummern: string[];
    task_type: string;
    prozessId: ProzessId;
}

export interface InventurTaskResponse {
    data: InventurTaskData;
    success: boolean;
}

// Interface für get_all_tasks Response
export interface InventurTask {
    pid: number;
    definitionkey: string;
    businesskey: string;
    pstate: string;
    variables: {
        fCode: string;
        regalNr: string;
        stockId: string;
        articleId: string;
        createdAt: string;
        regalArea: string;
        executorUserId: string;
        initiatorUserId: string;
    };
}

export interface InventurTasksResponse {
    data: InventurTask[];
    success: boolean;
}

// Bestandskontrolle Interfaces
export interface BestandskontrolleRequest {
    initiatorid: string;
    artikelnummer: string;
}

export interface BestandskontrolleResponse {
    initiatorUserId: string;
    success: boolean;
    stockId: string;
    pid: number;
    task_type: string;
    artikelnummer: string;
    freieRegalnummern: string;
}
export interface InventurResponse {
    success?: boolean;
    tasks?: InventurTask[];
    data?: InventurTask[];
    // Falls die Struktur anders ist
    [key: string]: any;
}

@Injectable({
    providedIn: 'root'
})
export class InventurService {
    private readonly baseUrl = 'http://bsc-s-webserver.bsc-intern.de:8080';
    private readonly kdxInventurUrl = `${this.baseUrl}/kdx_inventur/admin`;
    private readonly kdxInventurBaseUrl = `${this.baseUrl}/kdx_inventur`;

    constructor(private http: HttpClient) { }

    /**
     * Erstellt eine Inventur-Aufgabe für einen bestimmten Slot.
     * Turm Nr. und Tablar Nr. sind Pflichtfelder.
     * Box Nr., Spalte und Zeile sind optional.
     */
    createInventurSlot(request: CreateInventurSlotRequest): Observable<InventurTaskResponse> {
        let params = new HttpParams()
            .set('initiatorid', request.initiatorid)
            .set('turmNr', request.turmNr.toString())
            .set('tablarNr', request.tablarNr.toString());

        // Optionale Parameter nur hinzufügen wenn gesetzt
        if (request.boxNr !== undefined && request.boxNr !== null) {
            params = params.set('boxNr', request.boxNr.toString());
        }
        if (request.column !== undefined && request.column !== null) {
            params = params.set('column', request.column.toString());
        }
        if (request.row !== undefined && request.row !== null) {
            params = params.set('row', request.row.toString());
        }

        return this.http.get<InventurTaskResponse>(
            `${this.kdxInventurUrl}/create_inventur_slotnr`,
            {
                params,
                headers: new HttpHeaders({ 'accept': '*/*' })
            }
        ).pipe(
            tap(response => {
                console.log('Inventur-Aufgabe erstellt:', response);
            }),
            catchError((error) => {
                console.error('Fehler beim Erstellen der Inventur-Aufgabe:', error);
                return throwError(() => new Error('Inventur-Aufgabe konnte nicht erstellt werden.'));
            })
        );
    }

    /**
     * Ermittelt den Inventur-Typ basierend auf den ausgefüllten Feldern.
     */
    getInventurTyp(hasBox: boolean, hasColumn: boolean, hasRow: boolean): string {
        if (hasRow && hasColumn) {
            return 'Fach-Inventur (Platz)';
        }
        if (hasColumn) {
            return 'Spalten-Inventur';
        }
        if (hasRow) {
            return 'Zeilen-Inventur';
        }
        if (hasBox) {
            return 'Box-Inventur';
        }
        return 'Tablar-Inventur';
    }

    /**
     * Holt alle Inventur-Aufgaben für einen Benutzer.
     */
    getAllTasks(userid: string): Observable<InventurTask[]> {
        const params = new HttpParams().set('userid', userid);

        return this.http.get<InventurResponse>(
            `${this.kdxInventurBaseUrl}/get_all_tasks`,
            {
                params,
                headers: new HttpHeaders({ 'accept': '*/*' })
            }
        ).pipe(
            map(response => {
                // Flexibler Umgang mit verschiedenen Response-Strukturen
                if (Array.isArray(response)) {
                    return response;
                }
                if (response.data && Array.isArray(response.data)) {
                    return response.data;
                }
                if (response.tasks && Array.isArray(response.tasks)) {
                    return response.tasks;
                }
                console.warn('Unerwartete Response-Struktur:', response);
                return [];
            }),
            tap(tasks => {
                console.log('Inventur-Aufgaben geladen:', tasks.length);
            }),
            catchError((error) => {
                console.error('Fehler beim Laden der Inventur-Aufgaben:', error);
                return throwError(() => new Error('Inventur-Aufgaben konnten nicht geladen werden.'));
            })
        );
    }

    /**
     * Erstellt eine Bestandskontrolle für eine bestimmte Artikelnummer.
     */
    createBestandskontrolle(request: BestandskontrolleRequest): Observable<BestandskontrolleResponse> {
        const params = new HttpParams()
            .set('initiatorid', request.initiatorid)
            .set('artikelnummer', request.artikelnummer);

        return this.http.get<BestandskontrolleResponse>(
            `${this.kdxInventurUrl}/create_inventur_articlenr`,
            {
                params,
                headers: new HttpHeaders({ 'accept': '*/*' })
            }
        ).pipe(
            tap(response => {
                console.log('Bestandskontrolle erstellt:', response);
            }),
            catchError((error) => {
                console.error('Fehler beim Erstellen der Bestandskontrolle:', error);
                return throwError(() => new Error('Bestandskontrolle konnte nicht erstellt werden.'));
            })
        );
    }
}
