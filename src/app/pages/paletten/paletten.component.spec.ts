import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PalettenComponent } from './paletten.component';

describe('PalettenComponent', () => {
  let component: PalettenComponent;
  let fixture: ComponentFixture<PalettenComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PalettenComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PalettenComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
