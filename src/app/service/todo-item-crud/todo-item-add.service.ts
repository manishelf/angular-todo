import { Injectable } from '@angular/core';
import { Observable, from, BehaviorSubject, throwError, switchMap, tap } from 'rxjs';
import { TodoItem } from '../../models/todo-item';
import { TodoItemUtils } from './todo-item-utils';
import { TodoItemUpdateService } from './todo-item-update.service';

@Injectable({
  providedIn: 'root'
})
export class TodoItemAddService {

  constructor(private todoItemUtils: TodoItemUtils, private updateService: TodoItemUpdateService) { }

  addItem(db$: Observable<IDBDatabase>, todoItem:  Omit<TodoItem, 'id'>): void {    
    db$.subscribe((db)=>{
        let request = this.todoItemUtils.getObjectStoreRW(db, 'todo_items').add(todoItem);         
        if(request){
          request.onsuccess = (event)=>{
            let target = event.target as IDBRequest;
            let id = target.result;
            let todoItemSaved : TodoItem = {
              id: id,
              ...todoItem
            }  
            this.updateService.updateTags(db$, todoItemSaved);
          }
        }
    })
  }
  addCustom(db$: Observable<IDBDatabase>, tag: string, item: any): void {
    db$.subscribe(
      (db)=>{
        let request = this.todoItemUtils.getObjectStoreRW(db, 'custom_items').add({tag, item});         
        if(request){
          request.onerror = (error)=>{
            console.error("error saving to custom_items - ", error);
          }
        }
      }
    );
  }
}
