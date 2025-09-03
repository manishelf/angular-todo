import { Injectable } from '@angular/core';
import { Observable, from, BehaviorSubject, throwError, switchMap, tap, Subscription } from 'rxjs';
import { TodoItem } from '../../../models/todo-item';
import { TodoItemUtils } from './todo-item-utils';

@Injectable({
  providedIn: 'root'
})
export class TodoItemUpdateService {

  constructor(private todoItemUtils: TodoItemUtils) { }

  
    updateItem(db$: Observable<IDBDatabase>, todoItem: TodoItem, handleSucc = (e:Event)=>{}, handleErr = (e:Event)=>{}): Subscription {
      return db$.subscribe((db)=>{
        let request = this.todoItemUtils.getObjectStoreRW(db, 'todo_items').get(todoItem.id);
        if(request){
          request.onsuccess = (event)=>{
            let target = event.target as IDBRequest<TodoItem>;                        
            if(target.result.tags.join(',') !== todoItem.tags.join(',')){
              this.updateTags(db$, todoItem);
            }
            todoItem.updationTimestamp = new Date(Date.now()).toISOString();
            this.todoItemUtils.getObjectStoreRW(db, 'todo_items').put(todoItem);
            handleSucc(event);
          };
          request.onerror = handleErr;
        }
      });
    }
  
    updateTags(db$: Observable<IDBDatabase>, todoItem: TodoItem, handleSucc = (e:Event)=>{}, handleErr = (e:Event)=>{}): void{
      db$.subscribe(
        (db)=>{
        todoItem.tags.forEach(
            (tag)=>{
              let name = tag.name.trim();
              let request = this.todoItemUtils.getObjectStoreRO(db, 'tags_todo_items').get(name);
              if(request){
                request.onsuccess = (event)=>{
                  let target = event.target as IDBRequest;
                  if(target.result){
                    let items = target.result.todo_items;
                    items.push(todoItem.id);
                    this.todoItemUtils.getObjectStoreRW(db, 'tags_todo_items')
                        .put({name: name, todo_items : items});
                  }else{
                    this.todoItemUtils.getObjectStoreRW(db, 'tags_todo_items')
                        .add({name: name, todo_items: [todoItem.id]});
                  }
                  handleSucc(event);                  
                };
                request.onerror = handleErr;
              }
            }
          );
        }
      );
    }

    updateCustom(db$: Observable<IDBDatabase>, tag: string, item: any, handleSucc = (e:Event)=>{}, handleErr = (e:Event)=>{}): Subscription {
      return db$.subscribe((db)=>{
        let request = this.todoItemUtils.getObjectStoreRW(db, 'custom_items').get(tag);
        if(request){
          request.onsuccess = (event)=>{
            let target = event.target as IDBRequest<TodoItem>;
            this.todoItemUtils.getObjectStoreRW(db, 'custom_items').put(item);
            handleSucc(event);
          };
          request.onerror = handleErr;
        }
      });
    }

}
