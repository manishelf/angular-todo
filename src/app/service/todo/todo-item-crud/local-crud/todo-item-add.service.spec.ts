import { TestBed } from '@angular/core/testing';

import { TodoItemAddService } from './todo-item-add.service';

describe('TodoItemAddService', () => {
  let service: TodoItemAddService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(TodoItemAddService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
