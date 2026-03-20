import { Component, OnInit, Inject, AfterViewInit, ViewChild, ElementRef } from '@angular/core';
import { Router } from '@angular/router';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { AuthServiceInterface } from '../../services/auth.service.interface';
import { HttpClient } from '@angular/common/http';
import { UserDetails, EditUserResponse } from '../../services/auth.service.interface';
import { HeaderComponent } from "../../components/header/header.component";
// import { SidebarComponent } from '../../components/sidebar/sidebar.component';
// import { BereicheComponent } from '../../components/bereiche/bereiche.component';
import { LayoutComponent } from '../../components/layout/layout.component';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    HeaderComponent//,
    // SidebarComponent,
    // BereicheComponent,
    //LayoutComponent
  ],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
  providers: [
    { provide: AuthServiceInterface, useExisting: AuthService }
  ]
})
export class LoginComponent implements OnInit, AfterViewInit {

  @ViewChild('nameInput', { static: false }) private nameInput?: ElementRef<HTMLInputElement>;
  @ViewChild('passwordInput', { static: false }) private passwordInput?: ElementRef<HTMLInputElement>;


  // FIX: Korrekte FormGroup Deklaration
  loginForm: FormGroup = new FormGroup({
    email: new FormControl(''),
    password: new FormControl('')
  });

  constructor(
    @Inject(AuthServiceInterface) private authentificationService: AuthServiceInterface,
    private router: Router,
    private http: HttpClient
  ) { }

  ngOnInit(): void {
    console.log('LoginComponent ngOnInit aufgerufen');

    // FIX: Nur prüfen ob bereits eingeloggt, nicht ausloggen
    const jsessionid = localStorage.getItem('JSESSIONID');
    if (jsessionid) {
      console.log('Bereits eingeloggt, umleiten zu /home');
      this.router.navigate(['/home']);
    } else {
      console.log('Nicht eingeloggt, auf Login-Seite bleiben');
    }
  }

  ngAfterViewInit(): void {
    // kleines delay, damit Material DOM-Komponenten gerendert sind
    setTimeout(() => {
      try {
        this.nameInput?.nativeElement.focus();
        try { this.nameInput?.nativeElement.select(); } catch { }
      } catch { }
    }, 50);
  }

  // Enter im Name-Feld: Springe zum Passwort-Feld (verhindert vorzeitiges Submit durch Scanner)
  onNameKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter') {
      event.preventDefault();
      setTimeout(() => {
        this.passwordInput?.nativeElement?.focus();
      }, 0);
    }
  }

  // Enter im Passwort-Feld: Submit ausführen
  onPasswordKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter') {
      this.login();
    }
  }

  // checkSession(): void {
  //   const jsessionid = localStorage.getItem('JSESSIONID')
  //   if (!jsessionid)
  //     this.authentificationService.logout()
  //   //throw new Error('Method not implemented.');
  // }

  login(): void {
    console.log('Login-Methode aufgerufen');

    const email = this.loginForm.value.email;
    const password = this.loginForm.value.password;

    if (!email || !password) {
      alert('Bitte füllen Sie alle Felder aus');
      return;
    }

    const userDetails: UserDetails = {
      username: email,
      password: password,
      aktiv: '',
      name: '',
      rolle: '',
      JSESSIONID: ''
    };

    this.authentificationService.login(userDetails).subscribe({
      next: (response: EditUserResponse) => {
        console.log('Serverantwort:', response);
        if (response.success) {
          userDetails.JSESSIONID = response.data?.JSESSIONID || '';
          localStorage.setItem('JSESSIONID', userDetails.JSESSIONID);
          localStorage.setItem('username', userDetails.username);
          this.router.navigate(["/home"]);
        } else {
          alert('Login fehlgeschlagen: ' + response.text);
          this.loginForm.reset();
        }
      },
      error: (error) => {
        console.error('Login-Fehler:', error);
        alert('Verbindungsfehler beim Login');
      }
    });
  }
}
