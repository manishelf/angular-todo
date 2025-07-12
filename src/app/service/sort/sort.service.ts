import { Injectable } from '@angular/core';
import { TodoItem } from '../../models/todo-item';
import { from, Observable, scheduled } from 'rxjs';
import { TodoItemUtils } from '../todo-item-crud/todo-item-utils';

@Injectable({
  providedIn: 'root',
})
export class SortService {
  constructor(private todoItemUtils: TodoItemUtils) {}
  sortItems(order: string[], items: TodoItem[]): Observable<TodoItem[]> {
    
    return new Observable<TodoItem[]>((subscriber) => {
      let sorted: TodoItem[] = items;
      
      if (order[0] === '!ASC:') {
      } else if (order[1] === '!DESC:') {
      } else {
        sorted = items.sort((x, y) => {
          if (x.setForReminder || y.completionStatus) return -1;
          if (y.setForReminder || x.completionStatus) return 1;
          return 0;
        });
      }
      subscriber.next(sorted);
      subscriber.complete();
    });
  }
}
