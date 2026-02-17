import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { HeaderComponent } from '../../components/header/header.component';
import { FusszeileComponent } from '../../components/fusszeile/fusszeile.component';
import { NavBlockComponent, NavButton } from '../../components/nav-block/nav-block.component';
import { NavigationService } from '../../services/navigation.service';
import { WartungService } from '../../services/wartung.service';
import { MatIcon } from '@angular/material/icon';

@Component({
    selector: 'app-wartung',
    standalone: true,
    imports: [
        CommonModule,
        HeaderComponent,
        FusszeileComponent,
        NavBlockComponent,
        MatIcon
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

    constructor(
        private router: Router,
        private authService: AuthService,
        private navigationService: NavigationService,
        private wartungService: WartungService
    ) { }

    ngOnInit(): void {
        this.loadNavigation();
        this.loadTestModusStatus();
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

    navigateToHome(): void {
        this.router.navigate(['/home']);
    }

    logout(): void {
        localStorage.removeItem('username');
        this.authService.logout();
        this.router.navigate(['/login']);
    }
}
