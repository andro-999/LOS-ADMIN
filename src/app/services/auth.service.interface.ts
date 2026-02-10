// auth.service.interface.ts
import { Observable, of } from 'rxjs';

export interface UserDetails {
  username: string;
  password: string;
  aktiv: string | null;
  name: string;
  rolle: string;
  JSESSIONID: string;
}

export interface EditUserResponse {
  success: boolean;
  data?: {
    JSESSIONID: string;
    username: string;
  };
  text: string;
}

export abstract class AuthServiceInterface {
  abstract login(user: UserDetails): Observable<EditUserResponse>;
  abstract logout(): void;
}
