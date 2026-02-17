import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InventurComponent } from './inventur.component';

describe('InventurComponent', () => {
  let component: InventurComponent;
  let fixture: ComponentFixture<InventurComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InventurComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(InventurComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
