import { Injectable } from '@angular/core';
import { Observable, from, BehaviorSubject, throwError, switchMap, tap, mergeMap, toArray, max } from 'rxjs';
import { TodoItem } from '../../models/todo-item';
import { TodoItemUtils } from './todo-item-utils';
import { Tag } from '../../models/tag';

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

  getCustom(db$: Observable<IDBDatabase>, tag: string): Observable<any>{
    return db$.pipe(
      switchMap((db) => {
        const store = this.todoItemUtils.getObjectStoreRO(db, 'custom_items');
        const request = store.get(tag);
        return this.todoItemUtils.createObservable<any>(request);
      })
    );
  }
  getAllCustom(db$: Observable<IDBDatabase>, tags: string[]):Observable<any[]>{
    return db$.pipe(
      switchMap((db)=>{
        const store = this.todoItemUtils.getObjectStoreRO(db, 'custom_items');
        return from(tags).pipe(
          mergeMap(tag=>{
            const request = store.get(tag);
            return this.todoItemUtils.createObservable<any>(request);
          }),
          toArray()
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
    fromBin: boolean,
    exact = true,
  ): Observable<Set<TodoItem>> { // returns ids based on tags if unfiltered | items otherwise
    const storeNames = ['tags_todo_items', fromBin ? 'deleted_todo_items' : 'todo_items'];
    return db$.pipe(
      switchMap((db) => {
        const tagStore = this.todoItemUtils.getObjectStoreRO(db, 'tags_todo_items');
        const index = tagStore.index('tagName');
        const request = index.openCursor();
        return new Observable<Set<TodoItem>>((observer) => {
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
              const uniqueTodoItems: Set<TodoItem> = new Set();
              (includeItems.length ? includeItems : unfilteredItems).forEach((id) => {
                if (!excludeItems.includes(id)) {
                  uniqueTodoIds.add(id);
                }
              });
              let itemsPromises = [];
              for(let id of uniqueTodoIds){
                let promise = new Promise<TodoItem>(
                  (resolve)=>this.getItemById(db$, id, fromBin).subscribe((item)=>resolve(item))
                );
                itemsPromises.push(promise);
              }
              Promise.all(itemsPromises).then((items)=>{
                for(let item of items){
                  if(exact){
                    let isResult = true;
                    for(let tag of tagsFilter){
                      let tagList = item.tags.map(tag=>tag.name);
                      let includes = tagList.includes(tag) || tagList.includes(tag.substring(1));
                      isResult= isResult && ((tag.startsWith('+') && includes) || (tag.startsWith('-') && !includes) || includes);
                    }
                    if(isResult)
                      uniqueTodoItems.add(item);
                  }
                  else{
                    uniqueTodoItems.add(item);
                  }
                }
                observer.next(uniqueTodoItems);
                observer.complete();
              });
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
    searchTerms: string[],
    fromBin: boolean,
    exact: boolean = true,
  ): Observable<TodoItem[]> {
    if ((subjectQuery === '!ALL:' || subjectQuery === '') && tagsFilter.length === 0 && searchTerms.length === 0) {
      return this.getAllItems(db$, fromBin);
    }

    return new Observable<TodoItem[]>((observer) => {
      const promises: Promise<Set<TodoItem>>[] = [];

      if (subjectQuery.length > 0) {
        promises.push(
          new Promise((resolve) => {
            this.searchTodosByQuery(db$, subjectQuery, fromBin).subscribe((result) => resolve(result)); // prefix search
          })
        );
      }

      if (tagsFilter.length > 0) {
        promises.push(
          new Promise((resolve) => {
            this.searchTodosByTags(db$, tagsFilter, fromBin, exact).subscribe((result) => resolve(result));
          })
        );
      }

      if(searchTerms.length > 0){
        promises.push(
          new Promise((resolve)=>{
            this.getAllItems(db$, fromBin).subscribe(
              (items)=>{
                const escapedTokens = searchTerms.map((term)=>term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
                const pattern = new RegExp(`\\b(${exact?escapedTokens:escapedTokens.join('|')})\\b`, 'i');
                let result = new Set<TodoItem>();
                
                for(let i = 0; i<items.length; i++){
                  //let matchSubject = pattern.test(items[i].subject);
                  //let matchDescription = pattern.test(items[i].description);
                  //let matchUserData = pattern.test(JSON.stringify(items[i].userDefined?.data));
                  //if(matchSubject || matchDescription || matchUserData){
                  //result.add(items[i]);
                  //}
                  let matchSome = pattern.test(JSON.stringify(items[i]));
                  if(matchSome){
                    result.add(items[i]);
                  }
                }
                resolve(result);
              }
            );
          })
        );
      }

      Promise.all(promises).then((results) => {
        if(!exact){ // cumulate results
          const combinedResults = results.reduce((acc, curr) => new Set([...acc, ...curr]), new Set()); 
          observer.next(Array.from(combinedResults));
          observer.complete();
        }else{ //exact results
          let filteredResults:TodoItem[] = [];
          let flatList = [];
          let maxListSize = 0;
          for(let resultSet of results){ // could be worse O(n3)
            let list = Array.from(resultSet);
            list.sort((item1, item2)=>item1.id-item2.id);
            maxListSize = maxListSize<list.length?list.length:maxListSize;
            flatList.push(list);
          }
          for(let i = 0; i<maxListSize; i++){
            let isResult = true;
            let currentId = flatList[0][i].id;
            for(let list of flatList){
              if(list[i].id !== currentId){
                isResult = false;
                break;
              }
            }
            if(isResult) filteredResults.push(flatList[0][i]);
          }
          observer.next(filteredResults);
          observer.complete();
        }
       });
    });
  }
}
