import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Subject } from 'rxjs';

export interface TestModusResponse {
    success: boolean;
    test_modus_active: boolean;
}

export interface StorageStatusResponse {
    success: boolean;
    msg: string;
}

export interface StorageActiveResponse {
    success: boolean;
    is_active: boolean;
}

export interface ChangeAllStorePutResponse {
    msg: string;
    success: boolean;
}
@Injectable({
    providedIn: 'root'
})
export class WartungService {
    private readonly baseUrl = `${environment.apiUrl}/leitstand`;

    constructor(private http: HttpClient) { }

    public varianteChanged = new Subject<{ belegnummer: string; variante: number }>();
    varianteChanged$ = this.varianteChanged.asObservable();

    /**
     * Ruft den aktuellen Testmodus-Status ab
     * GET /leitstand/get_test_modus_status
     */
    getTestModusStatus(): Observable<TestModusResponse> {
        return this.http.get<TestModusResponse>(`${this.baseUrl}/get_test_modus_status`);
    }

    /**
     * Ändert den Testmodus-Status
     * GET /leitstand/change_test_modus?new_status=true/false
     */
    changeTestModus(newStatus: boolean): Observable<TestModusResponse> {
        return this.http.get<TestModusResponse>(
            `${this.baseUrl}/change_test_modus?new_status=${newStatus}`
        );
    }

    /**
     * Ändert den Speicherstatus
     * GET /leitstand/change_storagestatus_during_orderpicking?status=true/false
     */
    changeStorageStatus(status: boolean): Observable<StorageStatusResponse> {
        return this.http.get<StorageStatusResponse>(
            `${this.baseUrl}/change_storagestatus_during_orderpicking?status=${status}`);
    }

    changeStorePutLogic(belegnummer: string, variante: 1 | 2): Observable<StorageStatusResponse> {
        //this.varianteChanged.next({ belegnummer, variante });
        return this.http.get<StorageStatusResponse>(
            `${this.baseUrl}/change_storeput_logic?belegnummer=${encodeURIComponent(belegnummer)}&neue_variante=${variante}`
        );
    }
    getStorageStatus(): Observable<StorageActiveResponse> {
        return this.http.get<StorageActiveResponse>(
            `${this.baseUrl}/get_storagestatus_during_orderpicking`
        );
    }

    changeStorePutLogicForAll(variante: 'A' | 'B'): Observable<ChangeAllStorePutResponse> {
        return this.http.get<ChangeAllStorePutResponse>(
            `${this.baseUrl}/change_storeput_logic_for_all?neue_variante=${variante}`
        );
    }

}
