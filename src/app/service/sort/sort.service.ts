import { Injectable } from '@angular/core';
import { TodoItem } from '../../models/todo-item';
import { from, mergeMap, Observable, of, scheduled } from 'rxjs';
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
          if (!Number.isNaN(numCast)) {
            return (x: number, y: number) => x - y;
          }
          return (x: string, y: string) => x === y ? 0 : x < y ? -1 : 1;
        case Boolean.prototype:
          return (x: boolean, y: boolean) => (x == y ? 0 : x ? 1 : -1);
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
    //if (x.setForReminder || y.completionStatus) return -1;
    //if (y.setForReminder || x.completionStatus) return 1;
    
    // Prioritize incomplete items over completed ones
    if (!x.completionStatus && y.completionStatus) return -1;
    if (x.completionStatus && !y.completionStatus) return 1;

    // If completion status is the same, prioritize items with reminders
    if (x.setForReminder && !y.setForReminder) return -1;
    if (!x.setForReminder && y.setForReminder) return 1;

    return 0;
  }
  sortItems(order: string[], items: TodoItem[], limit:number | null | undefined = Number.MAX_SAFE_INTEGER): Observable<TodoItem[]> {  
    limit = limit?limit:Number.MAX_SAFE_INTEGER;

    return new Observable<TodoItem[]>((subscriber) => {

      if (!order || order.length == 0) {
        items = items.sort(this.sortByReminderAndCompletionStatus);
        subscriber.next(items);
        subscriber.complete();
        return;
      }

      let sortingFn = (x: TodoItem, y: TodoItem): number => {
        return 1;
      };


      let ascending = order[0] !== 'desc';
      
      if(order.length==1){
        sortingFn = this.sortByReminderAndCompletionStatus;          
      }

      let lat = order[1] === 'lat';
      let old = order[1] === 'old';
      if (old) {
        sortingFn = (x, y) => {
          return (
            new Date(x.creationTimestamp).getTime() -
            new Date(y.creationTimestamp).getTime()
          ); // time since epoch
        };
      } else if (lat) {
        sortingFn = (x, y) => {
          return (
            new Date(y.updationTimestamp).getTime() -
            new Date(x.updationTimestamp).getTime()
          );
        };
      }


      for (let prop of order) {
        if (
          prop === 'old' ||
          prop === 'lat' ||
          prop === 'asc' ||
          prop === 'desc' ||
          !prop
        ) {
          continue;
        }
        let prevSortingFn = sortingFn; // latest or oldest or standard

        sortingFn = (x, y) => {
          let val1 = (x as any)[prop];
          let val2 = (y as any)[prop];
          
          if (!(val1 && val2) && x.userDefined?.data && y.userDefined?.data) {
            val1 = (x.userDefined?.data as any)[prop];
            val2 = (y.userDefined?.data as any)[prop];
          }
          if (val1 && val2) {
            let prevComp = prevSortingFn(x, y) * (ascending ? 1 : -1);
            
            let fieldComp = this.getComparatorForType(val1)(val1, val2);
            return prevComp * fieldComp ? prevComp*fieldComp : 1;
          }
          return 0;
        };
      }
      
      subscriber.next(items.sort(sortingFn));
      subscriber.complete();
    }).pipe(
       mergeMap(items=> of(items.slice(0,limit)))
    );
  }
}
