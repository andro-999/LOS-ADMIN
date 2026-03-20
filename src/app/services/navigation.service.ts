import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, combineLatest } from 'rxjs';
import { map } from 'rxjs/operators';
import { NavButton } from '../components/nav-block/nav-block.component';

@Injectable({
    providedIn: 'root'
})
export class NavigationService {
    private auftraegeCount$ = new BehaviorSubject<number>(0);
    private usersCount$ = new BehaviorSubject<number>(0);
    private adminCount$ = new BehaviorSubject<number>(0);
    private inventurCount$ = new BehaviorSubject<number>(0);

    constructor() {
        // Alle Counts werden von den Komponenten aktualisiert - keine API-Calls hier
    }

    // Wird vom Leitstand aufgerufen - KEIN eigener API-Call
    updateAuftraegeCount(count: number): void {
        this.auftraegeCount$.next(count);
        console.log('NavigationService: Aufträge-Count aktualisiert:', count);
    }

    // Wird vom Inventur aufgerufen - KEIN eigener API-Call
    updateInventurCount(count: number): void {
        this.inventurCount$.next(count);
        console.log('NavigationService: Inventur-Count aktualisiert:', count);
    }

    // Wird vom Leitstand aufgerufen - KEIN eigener API-Call
    updateUserCounts(totalUsers: number, adminCount: number): void {
        this.usersCount$.next(totalUsers);
        this.adminCount$.next(adminCount);
        console.log('NavigationService: User-Count aktualisiert:', totalUsers, 'Admins:', adminCount);
    }

    getNavButtons(currentRoute: string): Observable<NavButton[]> {
        return combineLatest([
            this.auftraegeCount$,
            this.usersCount$,
            this.adminCount$,
            this.inventurCount$
        ]).pipe(
            map(([auftraege, users, admins, inventur]) => [
                {
                    label: 'Leitstand',
                    count: auftraege,
                    isActive: currentRoute === '/leitstand',
                    showCount: true,
                    route: '/leitstand'
                },
                {
                    label: 'Inventur',
                    count: 0,
                    isActive: currentRoute === '/inventur',
                    showCount: false,
                    route: '/inventur'
                },
                {
                    label: 'Benutzerverwaltung',
                    count: users,
                    isActive: currentRoute === '/benutzerverwaltung',
                    showCount: true,
                    route: '/benutzerverwaltung'
                },
                {
                    label: 'Wartung',
                    count: 0,
                    isActive: currentRoute === '/wartung',
                    showCount: false,
                    route: '/wartung'
                },
                {
                    label: 'Stellplatzverwaltung',
                    count: 0,
                    isActive: currentRoute === '/stellplatzverwaltung',
                    showCount: false,
                    route: '/stellplatzverwaltung'
                },
                {
                    label: 'ProzessManager',
                    count: 0,
                    isActive: currentRoute === '/prozessmanager',
                    showCount: false,
                    route: '/prozessmanager'
                },
                {
                    label: 'Paletten',
                    count: 0,
                    isActive: currentRoute === '/paletten',
                    showCount: false,
                    route: '/paletten'
                },
                {
                    label: 'Wareneingang',
                    count: 0,
                    isActive: currentRoute === '/wareneingang',
                    showCount: false,
                    route: '/wareneingang'
                },
                {
                    label: 'Konfiguration',
                    count: 0,
                    isActive: currentRoute === '/konfiguration',
                    showCount: false,
                    route: '/konfiguration'
                }
            ])
        );
    }

    refreshCounts(): void {
        // Alle Counts werden von den Komponenten aktualisiert - keine API-Calls hier
        console.log('NavigationService: refreshCounts() - Counts werden von Komponenten aktualisiert');
    }
}
