import { Injectable } from '@angular/core';
import { TodoItem } from '../../models/todo-item';
import { from, Observable, scheduled } from 'rxjs';
import { TodoItemUtils } from '../todo-item-crud/todo-item-utils';

@Injectable({
  providedIn: 'root',
})
export class SortService {
  constructor(private todoItemUtils: TodoItemUtils) {
  }

  getComparatorForType(type: any): ((x:any, y:any)=>number){
    // all are in ascending order
    switch(Object.getPrototypeOf(type)){
      case Number.prototype : 
        return (x: number, y:number)=> x-y
      case String.prototype :
        return (x:string, y:string)=> x.length - y.length
      case Boolean.prototype :
        return (x: boolean, y:boolean)=> x==y?0:x?1:0
      case Date.prototype :
        return (x: Date, y: Date)=> x.getTime()-y.getTime()
      case Object.prototype:
        return this.sortByReminderAndCompletionStatus;
    }
    return (x:any, y:any)=>{return 0;}
  }

  sortByReminderAndCompletionStatus(x:TodoItem, y:TodoItem): number{
    if (x.setForReminder || y.completionStatus) return -1;
    if (y.setForReminder || x.completionStatus) return 1;
    return 0;
  }

  sortItems(order: string[], items: TodoItem[]): Observable<TodoItem[]> {
    return new Observable<TodoItem[]>((subscriber) => {
      let sortingFn = (x: TodoItem, y: TodoItem): number=>{return 0;};
      if (order[0]==='oldest') {
        sortingFn = (x, y)=>{
          return new Date(x.creationTimestamp).getTime() - new Date(y.creationTimestamp).getTime() // time since epoch
        }
      } else if (order[0] === 'latest') {
        sortingFn = (x, y)=>{
          return new Date(y.updationTimestamp).getTime() - new Date(x.updationTimestamp).getTime()
        }
      }
      for(let prop of order){
        if(prop === 'oldest' || prop === 'latest' || prop === ''){
          continue;
        }
        sortingFn = (x, y)=>{
          let val1 = (x as any)[prop];
          let val2 = (y as any)[prop];
          if((val1 && val2) && x.userDefined?.data && y.userDefined?.data){
            val1 = (x.userDefined?.data as any)[prop];
            val2 = (y.userDefined?.data as any)[prop];
            return this.getComparatorForType(prop)(val1, val2)
          }
          return 0;
        }
      }

      if(order.length === 0) 
        sortingFn = this.sortByReminderAndCompletionStatus;
      
      subscriber.next(items.sort(sortingFn));
      subscriber.complete();
    });
  }
}
