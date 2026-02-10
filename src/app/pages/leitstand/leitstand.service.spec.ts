import { TestBed } from '@angular/core/testing';

import { LeitstandService } from './leitstand.service';

describe('LeitstandService', () => {
  let service: LeitstandService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(LeitstandService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
