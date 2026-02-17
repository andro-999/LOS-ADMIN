import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, combineLatest } from 'rxjs';
import { map } from 'rxjs/operators';
import { UserService } from './user.service';
import { LeitstandService } from '../pages/leitstand/leitstand.service';
import { InventurService } from '../pages/inventur/inventur.service';
import { AuthService } from './auth.service';
import { NavButton } from '../components/nav-block/nav-block.component';

@Injectable({
    providedIn: 'root'
})
export class NavigationService {
    private auftraegeCount$ = new BehaviorSubject<number>(0);
    private usersCount$ = new BehaviorSubject<number>(0);
    private adminCount$ = new BehaviorSubject<number>(0);
    private inventurCount$ = new BehaviorSubject<number>(0);

    constructor(
        private userService: UserService,
        private leitstandService: LeitstandService,
        private inventurService: InventurService,
        private authService: AuthService
    ) {
        this.loadCounts();
    }

    loadCounts(): void {
        // Lade Aufträge
        this.leitstandService.getAuftraege('KOMM').subscribe({
            next: (data) => {
                this.auftraegeCount$.next(data.length);
                console.log('NavigationService: Aufträge geladen:', data.length);
            },
            error: (err) => console.error('NavigationService: Fehler beim Laden der Aufträge:', err)
        });

        // Lade Benutzer
        this.userService.getUsers().subscribe({
            next: (data) => {
                this.usersCount$.next(data.length);
                const adminCount = data.filter(user => user.rolle && user.rolle.toLowerCase().includes('admin')).length;
                this.adminCount$.next(adminCount);
                console.log('NavigationService: Benutzer geladen:', data.length, 'Admins:', adminCount);
            },
            error: (err) => console.error('NavigationService: Fehler beim Laden der Benutzer:', err)
        });

        // Lade Inventur-Aufgaben
        const userid = this.authService.getUsername() || '';
        if (userid) {
            this.inventurService.getAllTasks(userid).subscribe({
                next: (data) => {
                    this.inventurCount$.next(data.length);
                    console.log('NavigationService: Inventur-Aufgaben geladen:', data.length);
                },
                error: (err) => console.error('NavigationService: Fehler beim Laden der Inventur-Aufgaben:', err)
            });
        }
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
        this.loadCounts();
    }
}
