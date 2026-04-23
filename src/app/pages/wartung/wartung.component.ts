import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { HeaderComponent } from '../../components/header/header.component';
import { FusszeileComponent } from '../../components/fusszeile/fusszeile.component';
import { NavBlockComponent, NavButton } from '../../components/nav-block/nav-block.component';
import { NavigationService } from '../../services/navigation.service';
import { WartungService, StorageStatusResponse, StorageActiveResponse } from '../../services/wartung.service';
import { LeitstandService } from '../leitstand/leitstand.service';
import { MatIcon } from '@angular/material/icon';
import { FormsModule } from '@angular/forms';

@Component({
    selector: 'app-wartung',
    standalone: true,
    imports: [
        CommonModule,
        HeaderComponent,
        FusszeileComponent,
        NavBlockComponent,
        MatIcon,
        FormsModule

    ],
    templateUrl: './wartung.component.html',
    styleUrls: ['./wartung.component.scss']
})
export class WartungComponent {
    navButtons: NavButton[] = [];

    // Wartungsmodus
    wartungsModus: boolean = false;

    // Testmodus
    testModus: boolean = false;
    testErgebnis: string = '';
    testErfolg: boolean = false;

    // Storagemodus
    storageModus: boolean = false;
    storageErgebnis: string = '';
    storageErfolg: boolean = false;
    storageIsActive: boolean = false;
    varianteACount: number = 0;
    varianteBCount: number = 0;

    constructor(
        private router: Router,
        private authService: AuthService,
        private navigationService: NavigationService,
        private wartungService: WartungService,
        private leitstandService: LeitstandService
    ) { }

    ngOnInit(): void {
        this.loadNavigation();
        this.loadTestModusStatus();
        this.loadStorageStatus();
        this.loadVarianteCounts();
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

    loadTestModusStatus(): void {
        this.wartungService.getTestModusStatus().subscribe({
            next: (response) => {
                if (response.success) {
                    this.testModus = response.test_modus_active;
                }
            },
            error: (err) => {
                console.error('Fehler beim Laden des Testmodus-Status:', err);
            }
        });
    }

    loadNavigation(): void {
        this.navigationService.getNavButtons('/wartung').subscribe(
            buttons => this.navButtons = buttons
        );
    }

    // Wartungsmodus Methoden
    toggleWartungsModus(): void {
        this.wartungsModus = !this.wartungsModus;
        console.log('Wartungsmodus:', this.wartungsModus ? 'aktiviert' : 'deaktiviert');
        // TODO: API-Aufruf für Wartungsmodus
    }

    clearCache(): void {
        console.log('Cache wird geleert...');
        // TODO: API-Aufruf für Cache leeren
        alert('Cache wurde geleert.');
    }

    restartServices(): void {
        if (confirm('Möchten Sie wirklich alle Services neu starten?')) {
            console.log('Services werden neu gestartet...');
            // TODO: API-Aufruf für Services neu starten
            alert('Services wurden neu gestartet.');
        }
    }

    syncDatabase(): void {
        console.log('Datenbank wird synchronisiert...');
        // TODO: API-Aufruf für Datenbank-Synchronisation
        alert('Datenbank-Synchronisation gestartet.');
    }

    // Testmodus Methoden
    toggleTestModus(): void {
        const newStatus = !this.testModus;
        this.wartungService.changeTestModus(newStatus).subscribe({
            next: (response) => {
                if (response.success) {
                    this.testModus = response.test_modus_active;
                    this.testErgebnis = '';
                    console.log('Testmodus:', this.testModus ? 'aktiviert' : 'deaktiviert');
                } else {
                    this.testErgebnis = 'Fehler beim Ändern des Testmodus';
                    this.testErfolg = false;
                }
            },
            error: (err) => {
                console.error('Fehler beim Ändern des Testmodus:', err);
                this.testErgebnis = 'Fehler beim Ändern des Testmodus';
                this.testErfolg = false;
            }
        });
    }

    runApiTest(): void {
        console.log('API-Test wird ausgeführt...');
        // TODO: API-Aufruf für API-Test
        this.testErgebnis = 'API-Verbindung erfolgreich hergestellt.';
        this.testErfolg = true;
    }

    runDatabaseTest(): void {
        console.log('Datenbank-Test wird ausgeführt...');
        // TODO: API-Aufruf für Datenbank-Test
        this.testErgebnis = 'Datenbank-Verbindung erfolgreich.';
        this.testErfolg = true;
    }

    runSystemTest(): void {
        console.log('System-Diagnose wird ausgeführt...');
        // TODO: API-Aufruf für System-Diagnose
        this.testErgebnis = 'System-Diagnose abgeschlossen. Alle Komponenten funktionieren.';
        this.testErfolg = true;
    }
    loadVarianteCounts(): void {
        this.leitstandService.getAuftraege('KOMM').subscribe({
            next: (auftraege) => {
                const open = auftraege.filter(a => !a.erledigt);
                this.varianteACount = open.filter(a => (a.einlagerungslogik_variante ?? 1) === 1).length;
                this.varianteBCount = open.filter(a => a.einlagerungslogik_variante === 2).length;
            },
            error: () => { }
        });
    }

    changeAllToVariante(variante: 'A' | 'B'): void {
        this.wartungService.changeStorePutLogicForAll(variante).subscribe({
            next: (response) => {
                this.storageErgebnis = response.msg;
                this.storageErfolg = response.success;
                if (response.success) {
                    this.loadVarianteCounts();
                }
            },
            error: () => {
                this.storageErgebnis = `Fehler beim Setzen von Variante ${variante}.`;
                this.storageErfolg = false;
            }
        });
    }




    storageOff(): void {
        this.wartungService.changeStorageStatus(false).subscribe({
            next: (response) => {
                this.storageErgebnis = response.msg;
                this.storageErfolg = response.success;
                if (response.success) this.storageIsActive = false;
            },
            error: () => {
                this.storageErgebnis = 'Fehler beim Deaktivieren der Einlagerung.';
                this.storageErfolg = false;
            }
        })
        console.log('Einlagerung wird deaktiviert...');
        // // TODO: API-Aufruf für Einlagerungsvariante deaktivieren
        // this.storageErgebnis = 'Einlagerung wurde deaktiviert.';
        // this.storageErfolg = true;
    }
    storageOn(): void {
        this.wartungService.changeStorageStatus(true).subscribe({
            next: (response) => {
                this.storageErgebnis = response.msg;
                this.storageErfolg = response.success;
                if (response.success) this.storageIsActive = true;

            },
            error: () => {
                this.storageErgebnis = 'Fehler beim Aktivieren der Einlagerung.';
                this.storageErfolg = false;
            }
        });

        console.log('Einlagerung wird aktiviert...');
        // TODO: API-Aufruf für Einlagerungsvariante aktivieren
        // this.storageErgebnis = 'Einlagerung wurde aktiviert.';
        // this.storageErfolg = true;


    }

    navigateToHome(): void {
        this.router.navigate(['/home']);
    }

    logout(): void {
        localStorage.removeItem('username');
        this.authService.logout();
        this.router.navigate(['/login']);
    }
}
