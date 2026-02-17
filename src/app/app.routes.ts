import { Routes } from '@angular/router';
import { LoginComponent } from './pages/login/login.component';
import { TrackingComponent } from './pages/tracking/tracking.component';
import { KonfigurationComponent } from './pages/konfiguration/konfiguration.component';
import { PalettenComponent } from './pages/paletten/paletten.component';
import { AuthService } from './services/auth.service';
import { HomeComponent } from './pages/home/home.component';
import { BenutzerverwaltungComponent } from './pages/benutzerverwaltung/benutzerverwaltung.component';
//import { LayoutComponent } from './components/layout/layout.component';
import { WartungComponent } from './pages/wartung/wartung.component';
//import { VierGridComponent } from './components/vier-grid/vier-grid.component';
import { LeitstandComponent } from './pages/leitstand/leitstand.component';
import { InventurComponent } from './pages/inventur/inventur.component';
import { StellplatzverwaltungComponent } from './pages/stellplatzverwaltung/stellplatzverwaltung.component';


export const routes: Routes = [
    { path: '', redirectTo: '/login', pathMatch: 'full' },
    { path: 'login', component: LoginComponent },
    //{ path: 'tracking', component: TrackingComponent, canActivate: [AuthService] },
    { path: 'konfiguration', component: KonfigurationComponent, canActivate: [AuthService] },
    //{ path: 'paletten', component: PalettenComponent, canActivate: [AuthService] },
    { path: 'home', component: HomeComponent },
    { path: 'benutzerverwaltung', component: BenutzerverwaltungComponent },
    { path: 'wartung', component: WartungComponent, canActivate: [AuthService] },
    { path: 'stellplatzverwaltung', component: StellplatzverwaltungComponent, canActivate: [AuthService] },
    { path: 'leitstand', component: LeitstandComponent, canActivate: [AuthService] },
    { path: 'inventur', component: InventurComponent, canActivate: [AuthService] },
    { path: '**', redirectTo: '/login' } // Wildcard route für 404
];

