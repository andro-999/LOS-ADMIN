import { Routes } from '@angular/router';
import { LoginComponent } from './pages/login/login.component';
import { TrackingComponent } from './pages/tracking/tracking.component';
import { KonfigurationComponent } from './pages/konfiguration/konfiguration.component';
import { PalettenComponent } from './pages/paletten/paletten.component';
import { AuthService } from './services/auth.service';
import { HomeComponent } from './pages/home/home.component';
import { BenutzerverwaltungComponent } from './pages/benutzerverwaltung/benutzerverwaltung.component';
//import { LayoutComponent } from './components/layout/layout.component';
import { AdminverwaltungComponent } from './pages/adminverwaltung/adminverwaltung.component';
import { VierGridComponent } from './components/vier-grid/vier-grid.component';
import { LeitstandComponent } from './pages/leitstand/leitstand.component';


export const routes: Routes = [
    { path: '', redirectTo: '/login', pathMatch: 'full' },
    { path: 'login', component: LoginComponent },
    //{ path: 'tracking', component: TrackingComponent, canActivate: [AuthService] },
    //{ path: 'konfiguration', component: KonfigurationComponent, canActivate: [AuthService] },
    //{ path: 'paletten', component: PalettenComponent, canActivate: [AuthService] },
    { path: 'home', component: HomeComponent },
    //{ path: 'benutzerverwaltung', component: BenutzerverwaltungComponent },
    //{ path: 'adminverwaltung', component: AdminverwaltungComponent, canActivate: [AuthService] },
    //{ path: 'vier-grid', component: VierGridComponent },
    { path: 'leitstand/auftrag-loeschen', component: LeitstandComponent, canActivate: [AuthService] },
    { path: 'leitstand/position-loeschen', component: LeitstandComponent, canActivate: [AuthService] },
    { path: 'leitstand/prioritaet-aendern', component: LeitstandComponent, canActivate: [AuthService] },
    { path: 'leitstand/auftrag-blockieren', component: LeitstandComponent, canActivate: [AuthService] },
    //{ path: 'leitstand', redirectTo: '/leitstand/auftrag-loeschen', pathMatch: 'full' },
    { path: 'leitstand', component: LeitstandComponent, canActivate: [AuthService] },
    { path: '**', redirectTo: '/login' } // Wildcard route für 404
];

