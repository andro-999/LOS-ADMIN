import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BereicheComponent } from './bereiche.component';

describe('BereicheComponent', () => {
  let component: BereicheComponent;
  let fixture: ComponentFixture<BereicheComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BereicheComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BereicheComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
