import { TestBed } from '@angular/core/testing';

import { BackendCrudService } from './backend-crud.service';

describe('BackendCrudService', () => {
  let service: BackendCrudService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(BackendCrudService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
