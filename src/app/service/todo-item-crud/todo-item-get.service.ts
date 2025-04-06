import { Injectable } from '@angular/core';
import { Observable, from, BehaviorSubject, throwError, switchMap, tap } from 'rxjs';
import { TodoItem } from '../../models/todo-item';
import { TodoItemUtils } from './todo-item-utils';

@Injectable({
  providedIn: 'root',
})
export class TodoItemGetService {
  constructor(private todoItemUtils: TodoItemUtils) {}

  getItemById(db$: Observable<IDBDatabase>, id: number, fromBin: boolean = false): Observable<TodoItem> {
    const storeName = fromBin ? 'deleted_todo_items' : 'todo_items';
    return db$.pipe(
      switchMap((db) => {
        const store = this.todoItemUtils.getObjectStoreRO(db, storeName);
        const request = store.get(id);
        return this.todoItemUtils.createObservable<TodoItem>(request);
      })
    );
  }

  getAllItems(db$: Observable<IDBDatabase>, fromBin: boolean = false): Observable<TodoItem[]> {
    const storeName = fromBin ? 'deleted_todo_items' : 'todo_items';
    return db$.pipe(
      switchMap((db) => {
        const store = this.todoItemUtils.getObjectStoreRO(db, storeName);
        const request = store.getAll();
        return this.todoItemUtils.createObservable<TodoItem[]>(request).pipe(
          switchMap((items) => from([items.reverse()])), // Reverse the items to keep consistent functionality
        );
      })
    );
  }

  searchTodosByQuery(
    db$: Observable<IDBDatabase>,
    subjectQuery: string,
    fromBin: boolean
  ): Observable<Set<TodoItem>> {
    const storeName = fromBin ? 'deleted_todo_items' : 'todo_items';
    return db$.pipe(
      switchMap((db) => {
        const store = this.todoItemUtils.getObjectStoreRO(db, storeName);
        const index = store.index('subjectIndex');
        const range = IDBKeyRange.bound(subjectQuery, subjectQuery + '\uffff', false, false); // Prefix search
        const request = index.openCursor(range);
        return new Observable<Set<TodoItem>>((observer) => {
          const results = new Set<TodoItem>();
          request.onsuccess = (event) => {
            const cursor = (event.target as IDBRequest<IDBCursorWithValue>).result;
            if (cursor) {
              results.add(cursor.value);
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
      })
    );
  }

  searchTodosByTags(
    db$: Observable<IDBDatabase>,
    tagsFilter: string[],
    fromBin: boolean
  ): Observable<Set<number>> { // returns ids based on tags
    const storeNames = ['tags_todo_items', fromBin ? 'deleted_todo_items' : 'todo_items'];
    return db$.pipe(
      switchMap((db) => {
        const tagStore = this.todoItemUtils.getObjectStoreRO(db, 'tags_todo_items');
        const index = tagStore.index('tagName');
        const request = index.openCursor();
        return new Observable<Set<number>>((observer) => {
          const includeItems: number[] = [];
          const excludeItems: number[] = [];
          const unfilteredItems: number[] = [];

          request.onsuccess = (event) => {
            const cursor = (event.target as IDBRequest<IDBCursorWithValue>).result;
            if (cursor) {
              const item = cursor.value;
              if (tagsFilter.includes('+' + item.name) || tagsFilter.includes(item.name)) {
                includeItems.push(...item.todo_items);
              } else if (tagsFilter.includes('-' + item.name)) {
                excludeItems.push(...item.todo_items);
              } else {
                unfilteredItems.push(...item.todo_items);
              }
              cursor.continue();
            } else {
              const uniqueTodoIds: Set<number> = new Set();
              (includeItems.length ? includeItems : unfilteredItems).forEach((id) => {
                if (!excludeItems.includes(id)) {
                  uniqueTodoIds.add(id);
                }
              });
              observer.next(uniqueTodoIds);
              observer.complete();
            }
          };
          request.onerror = (event) => {
            observer.error((event.target as IDBRequest).error);
          };
        });
      })
    );
  }

  searchTodos(
    db$: Observable<IDBDatabase>,
    subjectQuery: string,
    tagsFilter: string[],
    fromBin: boolean
  ): Observable<TodoItem[]> {
    if (subjectQuery === '' && tagsFilter.length === 0) {
      return this.getAllItems(db$, fromBin);
    }

    return new Observable<TodoItem[]>((observer) => {
      const promises: Promise<Set<TodoItem>>[] = [];

      if (subjectQuery.length > 0) {
        promises.push(
          new Promise((resolve) => {
            this.searchTodosByQuery(db$, subjectQuery, fromBin).subscribe((result) => resolve(result));
          })
        );
      }

      if (tagsFilter.length > 0) {
        promises.push(
          new Promise((resolve) => {
            this.searchTodosByTags(db$, tagsFilter, fromBin).subscribe((result) => {
              const storeName = fromBin ? 'deleted_todo_items' : 'todo_items';
              const promises: Promise<TodoItem | null>[] = Array.from(result).map((id) => {
                return new Promise((resolve) => {
                  this.getItemById(db$, id, fromBin).subscribe(
                    (item) => resolve(item),
                    () => resolve(null)
                  );
                });
              });
              Promise.all(promises).then((items) => {
                const filteredItems = items.filter((item): item is TodoItem => item !== null);
                resolve(new Set(filteredItems));
              });
            });
          })
        );
      }

      Promise.all(promises).then((results) => {
        const combinedResults = results.reduce((acc, curr) => new Set([...acc, ...curr]), new Set());
        observer.next(Array.from(combinedResults));
        observer.complete();
      });
    });
  }
}
