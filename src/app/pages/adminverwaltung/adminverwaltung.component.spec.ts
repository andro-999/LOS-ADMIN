import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdminverwaltungComponent } from './adminverwaltung.component';

describe('AdminverwaltungComponent', () => {
  let component: AdminverwaltungComponent;
  let fixture: ComponentFixture<AdminverwaltungComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminverwaltungComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AdminverwaltungComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
