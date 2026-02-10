import { TestBed } from '@angular/core/testing';

import { NachrichtenService } from './nachrichten.service';

describe('NachrichtenService', () => {
  let service: NachrichtenService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(NachrichtenService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
