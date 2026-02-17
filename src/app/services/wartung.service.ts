import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface TestModusResponse {
    success: boolean;
    test_modus_active: boolean;
}

@Injectable({
    providedIn: 'root'
})
export class WartungService {
    private readonly baseUrl = 'http://bsc-s-webserver.bsc-intern.de:8080/leitstand';

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
