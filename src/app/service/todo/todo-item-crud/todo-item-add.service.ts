import { Injectable } from '@angular/core';
import {
  Observable,
  from,
  BehaviorSubject,
  throwError,
  switchMap,
  tap,
  subscribeOn,
} from 'rxjs';
import { TodoItem } from '../../../models/todo-item';
import { TodoItemUtils } from './todo-item-utils';
import { TodoItemUpdateService } from './todo-item-update.service';

@Injectable({
  providedIn: 'root',
})
export class TodoItemAddService {
  constructor(
    private todoItemUtils: TodoItemUtils,
    private updateService: TodoItemUpdateService
  ) {}

  addItem(db: IDBDatabase, todoItem: Omit<TodoItem, 'id'>, handleSuc = (e:Event)=>{}, handleErr = (e:Event)=>{}) {
      let request = this.todoItemUtils
        .getObjectStoreRW(db, 'todo_items')
        .add(todoItem);
      if (request) {
        request.onsuccess = (event) => {
          let target = event.target as IDBRequest;
          let id = target.result;
          let todoItemSaved: TodoItem = {
            id: id,
            ...todoItem,
          };
          this.updateService.updateTags(db, todoItemSaved);
          handleSuc(event);
        };
        request.onerror = (e)=>{console.error(e);handleErr(e);}
      }
  }

  addCustom(db: IDBDatabase, tag: string, item: any, handleSucc = (e:Event)=>{}, handleErr = (e:Event)=>{}): void {
    let request = this.todoItemUtils
      .getObjectStoreRW(db, 'custom_items')
      .add({ tag, item });
    if (request) {
      request.onsuccess = handleSucc;
      request.onerror = (e) => {console.error(e); handleErr(e);};
    }
  }
}
