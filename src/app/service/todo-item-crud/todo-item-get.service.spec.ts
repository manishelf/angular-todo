import { TestBed } from '@angular/core/testing';

import { TodoItemGetService } from './todo-item-get.service';

describe('TodoItemGetService', () => {
  let service: TodoItemGetService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(TodoItemGetService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
