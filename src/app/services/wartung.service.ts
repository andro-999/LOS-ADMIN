import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface TestModusResponse {
    success: boolean;
    test_modus_active: boolean;
}

@Injectable({
    providedIn: 'root'
})
export class WartungService {
    private readonly baseUrl = `${environment.apiUrl}/leitstand`;

    constructor(private http: HttpClient) { }

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
}
