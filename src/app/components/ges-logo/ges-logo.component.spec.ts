import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GesLogoComponent } from './ges-logo.component';

describe('GesLogoComponent', () => {
  let component: GesLogoComponent;
  let fixture: ComponentFixture<GesLogoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GesLogoComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GesLogoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
