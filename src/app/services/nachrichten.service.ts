import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class NachrichtenService {
  private _sichtbar = new BehaviorSubject<boolean>(false);
  sichtbar$ = this._sichtbar.asObservable();

  constructor() { }

  toggle() {
    this._sichtbar.next(!this._sichtbar.value);
  }

  schliessen() {
    this._sichtbar.next(false);
  }
}
