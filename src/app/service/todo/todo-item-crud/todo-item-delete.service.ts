import { Injectable } from '@angular/core';
import { TodoItem } from '../../../models/todo-item';
import { Observable, switchMap } from 'rxjs';
import { TodoItemUtils } from './todo-item-utils';

@Injectable({
  providedIn: 'root'
})
export class TodoItemDeleteService {

  constructor(private todoItemUtils: TodoItemUtils) { }
  
  deleteItem(db:IDBDatabase, item: TodoItem, fromBin?: boolean):void{
    if(!fromBin){
      item.deleted = true;
      this.todoItemUtils.getObjectStoreRW(db, 'deleted_todo_items').add(item);
      this.todoItemUtils.getObjectStoreRW(db, 'todo_items').delete(item.id);
    }else{
      this.todoItemUtils.getObjectStoreRW(db, 'deleted_todo_items').delete(item.id);
    }
  }
}
