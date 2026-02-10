import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VierGridComponent } from './vier-grid.component';

describe('VierGridComponent', () => {
  let component: VierGridComponent;
  let fixture: ComponentFixture<VierGridComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VierGridComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(VierGridComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
