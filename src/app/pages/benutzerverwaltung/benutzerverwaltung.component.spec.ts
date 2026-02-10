import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BenutzerverwaltungComponent } from './benutzerverwaltung.component';

describe('BenutzerverwaltungComponent', () => {
  let component: BenutzerverwaltungComponent;
  let fixture: ComponentFixture<BenutzerverwaltungComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BenutzerverwaltungComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BenutzerverwaltungComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
