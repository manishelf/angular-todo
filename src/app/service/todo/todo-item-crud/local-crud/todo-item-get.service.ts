import { Injectable } from '@angular/core';
import { Observable, from, BehaviorSubject, throwError, switchMap, tap, mergeMap, toArray, max, take, of } from 'rxjs';
import { TodoItem } from '../../../../models/todo-item';
import { TodoItemUtils } from './todo-item-utils';
import { Tag } from '../../../../models/tag';

@Injectable({
  providedIn: 'root',
})
export class TodoItemGetService {
  constructor(private todoItemUtils: TodoItemUtils) {}

  getItemById(db: IDBDatabase, id: number, fromBin: boolean = false): Observable<TodoItem> {
    const storeName = fromBin ? 'deleted_todo_items' : 'todo_items';
    const store = this.todoItemUtils.getObjectStoreRO(db, storeName);
    const request = store.get(id);
    return this.todoItemUtils.createObservable<TodoItem>(request);
  }

  getItemByUUID(db: IDBDatabase, uuid: string, fromBin: boolean = false): Observable<TodoItem>{
    const storeName = fromBin ? 'deleted_todo_items' : 'todo_items';
    const store = this.todoItemUtils.getObjectStoreRO(db, storeName);
    const request = store.index('uuidIndex').get(uuid);
    return this.todoItemUtils.createObservable<TodoItem>(request);
  }

  getAllItems(db: IDBDatabase, fromBin: boolean = false): Observable<TodoItem[]> {
    const storeName = fromBin ? 'deleted_todo_items' : 'todo_items';
    const store = this.todoItemUtils.getObjectStoreRO(db, storeName);
    const request = store.getAll();
    return this.todoItemUtils.createObservable<TodoItem[]>(request);
  }

  getCustom(db: IDBDatabase, tag: string): Observable<any>{
    const store = this.todoItemUtils.getObjectStoreRO(db, 'custom_items');
    const request = store.get(tag);
    return this.todoItemUtils.createObservable<any>(request);
  }
  
  getAllCustom(db: IDBDatabase, tags: Tag[]):Observable<any[]>{
    const store = this.todoItemUtils.getObjectStoreRO(db, 'custom_items');
    return from(tags).pipe(
      mergeMap(tag=>{
        const request = store.get(tag.name);
        return this.todoItemUtils.createObservable<any>(request);
      }),
      toArray()
    );
  }

  getTagWithNameLike(db: IDBDatabase, name: string): Observable<Tag[]>{
    const store = this.todoItemUtils.getObjectStoreRO(db, 'tags_todo_items');
    const index = store.index('tagName');
    const range = IDBKeyRange.bound(name, name + '\uffff', false, false); // Prefix search
    const request = index.openCursor(range);
    return new Observable<Tag[]>((observer) => {
      const results :Tag[] = [];
      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest<IDBCursorWithValue>).result;
        if (cursor) {
          results.push(cursor.value);
          cursor.continue();
        } else {
          observer.next(results);
          observer.complete();
        }
      };
      request.onerror = (event) => {
        observer.error((event.target as IDBRequest).error);
      };
    });
  }
}
