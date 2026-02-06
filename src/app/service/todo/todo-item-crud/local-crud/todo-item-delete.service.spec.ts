import { TestBed } from '@angular/core/testing';

import { TodoItemDeleteService } from './todo-item-delete.service';

describe('TodoItemDeleteService', () => {
  let service: TodoItemDeleteService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(TodoItemDeleteService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
