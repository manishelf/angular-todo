import { TestBed } from '@angular/core/testing';

import { FilterOrReduceService } from './filter-or-reduce.service';

describe('FilterOrReduceService', () => {
  let service: FilterOrReduceService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(FilterOrReduceService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
