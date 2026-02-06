import { TestBed } from '@angular/core/testing';

import { TodoItemUpdateService } from './todo-item-update.service';

describe('TodoItemUpdateService', () => {
  let service: TodoItemUpdateService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(TodoItemUpdateService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
