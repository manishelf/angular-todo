import { Injectable } from '@angular/core';
import { TodoItem } from '../../models/todo-item';
import { from, Observable, scheduled } from 'rxjs';
import { TodoItemUtils } from '../todo-item-crud/todo-item-utils';

@Injectable({
  providedIn: 'root',
})
export class SortService {
  constructor(private todoItemUtils: TodoItemUtils) {}

  getComparatorForType(type: any): (x: any, y: any) => number {
    // all are in ascending order
    if (type) {
      switch (Object.getPrototypeOf(type)) {
        case Number.prototype:
          return (x: number, y: number) => x - y;
        case String.prototype: 
          let numCast = Number.parseFloat(type);
          if(!Number.isNaN(numCast)){
            return (x: number, y: number) => x - y; 
          }
          return (x: string, y: string) => x.length - y.length;
        case Boolean.prototype:
          return (x: boolean, y: boolean) => (x == y ? 0 : x ? 1 : 0);
        case Date.prototype:
          return (x: Date, y: Date) => x.getTime() - y.getTime();
        case Object.prototype:
          return this.sortByReminderAndCompletionStatus;
      }
    }
    return (x: any, y: any) => {
      return 0;
    };
  }

  sortByReminderAndCompletionStatus(x: TodoItem, y: TodoItem): number {
    if (x.setForReminder || y.completionStatus) return -1;
    if (y.setForReminder || x.completionStatus) return 1;
    return 0;
  }

  sortItems(order: string[], items: TodoItem[]): Observable<TodoItem[]> {
    return new Observable<TodoItem[]>((subscriber) => {

      if(!order || order.length == 0) {
        items = items.sort(this.sortByReminderAndCompletionStatus);
        subscriber.next(items);
        subscriber.complete();
        return;
      }  
      
      let sortingFn = (x: TodoItem, y: TodoItem): number => {
        return 1;
      };

      let latest = order[1] === 'latest';
      let oldest = order[1] === 'oldest';
      if (oldest) {
        sortingFn = (x, y) => {
           return (
            new Date(x.creationTimestamp).getTime() -
            new Date(y.creationTimestamp).getTime()
          ); // time since epoch
        };
      } else if (latest) {
        sortingFn = (x, y) => {
            return (
            new Date(y.updationTimestamp).getTime() -
            new Date(x.updationTimestamp).getTime()
          );
        };
      }
      

      subscriber.next(items.sort(sortingFn));
      subscriber.complete();
      
      let ascending = order[0] !== 'desc';

      for (let prop of order) {
        if (prop === 'oldest' || prop === 'latest' || prop === 'asc' || prop === 'desc' || !prop) {
          continue;
        }
        let prevSortingFn = sortingFn; // latest or oldest or standard

        sortingFn = (x, y) => {
          let val1 = (x as any)[prop];
          let val2 = (y as any)[prop];
          if (!(val1 && val2) && x.userDefined?.data) {
            val1 = (x.userDefined?.data as any)[prop];
            val2 = (y.userDefined?.data as any)[prop];
          }
          if(val1 && val2){
            let val =  prevSortingFn(x,y) * (ascending ? (1) : (-1)) * this.getComparatorForType(val1)(val1, val2);
            return val;
          }
          return 0;
        };
      }
      
      if (order.length < 2){
        sortingFn = this.sortByReminderAndCompletionStatus;
      }

      subscriber.next(items.sort(sortingFn));
      subscriber.complete();
    });
  }
}
