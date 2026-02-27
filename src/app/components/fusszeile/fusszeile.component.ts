import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
    selector: 'app-fusszeile',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './fusszeile.component.html',
    styleUrls: ['./fusszeile.component.scss']
})
export class FusszeileComponent {
    @Input() showHauptmenue = true;
    @Input() showLogout = true;

    constructor(
        private router: Router,
        private authService: AuthService
    ) { }

    onHauptmenueClick(): void {
        this.router.navigate(['/home']);
    }

    onLogoutClick(): void {
        this.authService.logout();
    }
}
