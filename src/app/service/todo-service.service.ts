import { Injectable, OnDestroy, Optional } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, from, BehaviorSubject, throwError, switchMap, tap } from 'rxjs';import { TodoItem } from './../models/todo-item';
import { UserServiceService } from './user-service.service';

@Injectable({
  providedIn: 'root'
})
export class TodoServiceService implements OnDestroy{

  apiUrl = 'http://localhost:8080';

  private db: IDBDatabase | null = null;
  private dbSubject = new BehaviorSubject<IDBDatabase | undefined>(undefined);
  private fromBin: boolean = false;

  public db$: Observable<IDBDatabase> = this.dbSubject.asObservable().pipe(
    switchMap((db) => {
      if (db) {
        return from(Promise.resolve(db));
      } else {
        return new Observable<IDBDatabase>((subscriber) => {
          const request = indexedDB.open('todo_items_db', 1);

          request.onerror = (error) => {
            subscriber.error(error);
          };

          request.onupgradeneeded = (event) => {
            this.db = (event.target as IDBOpenDBRequest).result;
            const todoItemsStore = this.db.createObjectStore('todo_items', { keyPath: 'id', autoIncrement: true });
            const deletedTodoItemsStore = this.db.createObjectStore('deleted_todo_items', { keyPath: 'id', autoIncrement: true });
            const tagsTodoItemStroe = this.db.createObjectStore('tags_todo_items', { keyPath: 'name' });

            todoItemsStore.createIndex('subjectIndex', 'subject', { unique: true});
            deletedTodoItemsStore.createIndex('subjectIndex', 'subject', { unique: true });
            tagsTodoItemStroe.createIndex('tagName','name', {unique: true});
          }

          request.onsuccess = (event) => {
            this.db = (event.target as IDBOpenDBRequest).result;
            if (this.db) {
              this.db.onerror = (err) => {
                console.error(err);
              };
              this.dbSubject.next(this.db); // Emit the database
              subscriber.next(this.db);
              subscriber.complete();
            } else {
              subscriber.error('IndexedDB database is undefined after success.');
            }
          };
        });
      }
    })
  );

  
  private todoItemsSubject = new BehaviorSubject<TodoItem[]>([]);
  todoItems$ = this.todoItemsSubject.asObservable(); 

  constructor(private http: HttpClient, private userservice: UserServiceService) {
      this.db$.subscribe({
        error: (error) => console.error('Database error', error)
      });
  }
  
  initializeItems(fromBin: boolean): void {
    this.fromBin = fromBin;
    this.getAllItemsForPage(1, fromBin).subscribe((items) => {
      this.todoItemsSubject.next(items);
    });
  }

  getAllItemsForPage(pageNo: Number, fromBin?: boolean): Observable<TodoItem[]> {
    if (this.userservice.getIsLoggedIn()) {
      return this.http.get<TodoItem[]>(`${this.apiUrl}/${(fromBin)?'':'/bin/'}todo-items`);
    } else {
    return this.db$.pipe(
      switchMap((db) => {
          return new Observable<TodoItem[]>((subscriber) => {
            let storeName = (fromBin)? 'deleted_todo_items':'todo_items';
            const txn = db.transaction(storeName, 'readonly');
            const store = txn.objectStore(storeName);
            const request = store.getAll();

            if (!request) {
              subscriber.error('Could not create getAll request');
              return;
            }

            request.onsuccess = (event: Event) => {
              const target = event.target as IDBRequest<TodoItem[]>;
              subscriber.next(target.result.reverse());
              subscriber.complete();
            };

            request.onerror = (event: Event) => {
              const target = event.target as IDBRequest;
              subscriber.error(target.error);
            };
          });
        })
      );
    }
  }

  getItemById(id: number, fromBin?: boolean): Observable<TodoItem>{
    return this.db$.pipe(
      switchMap((db) => {
        return new Observable<TodoItem>((observer)=>{
          let store = fromBin? 'deleted_todo_items': 'todo_items'; 
          let txn = db.transaction(store, "readonly");
          let request = txn.objectStore(store).get(id);
          request.onsuccess = (result)=>{
            let target = result.target as IDBRequest;
            if(target)
              observer.next(target.result);
            observer.complete();
          }
        });
      }));
  }

  addItem(todoItem:  Omit<TodoItem, 'id'>): void {
    if(this.db){
      const txnTodo = this.db?.transaction(['todo_items',], 'readwrite');
      let request = txnTodo?.objectStore('todo_items').add(todoItem); 
      if(request){
        request.onsuccess = (event)=>{
          let target = event.target as IDBRequest;
          let id = target.result;
          let todoItemSaved : TodoItem = {
            id: id,
            ...todoItem
          }  
          this.updateTags(todoItemSaved);
        }
      }
  }

    if(this.userservice.getIsLoggedIn())
      this.http.post<TodoItem>(`${this.apiUrl}/todo-items`, todoItem);
    
    this.updateItemList();
  }

  updateItem(todoItem: TodoItem): void {
    const txn = this.db?.transaction(['todo_items'],'readwrite');
    let request = txn?.objectStore('todo_items').get(todoItem.id);
    if(request){
      request.onsuccess = (event)=>{
        let target = event.target as IDBRequest<TodoItem>;
        if(target.result.tags.join(',') !== todoItem.tags.join(',')){
          this.updateTags(todoItem);
        }
        const txn = this.db?.transaction(['todo_items'],'readwrite');
        txn?.objectStore('todo_items').put(todoItem);
        this.updateItemList();
      }
    }
    
    if(this.userservice.getIsLoggedIn())
      this.http.patch<TodoItem>(`${this.apiUrl}/todo-items/${todoItem.id}`, todoItem); 
  }

  private updateTags(todoItem: TodoItem): void{
    const txnTags = this.db?.transaction(['tags_todo_items',], 'readwrite');
    let storeTags = txnTags?.objectStore('tags_todo_items')
    todoItem.tags.forEach(
      (tag)=>{
        let name = tag.name.trim();
        let request = storeTags?.get(name);
        if(request){
          request.onsuccess = (event)=>{
            let target = event.target as IDBRequest;
            if(target.result){
              let items = target.result.todo_items;
              items.push(todoItem.id);
              storeTags?.put({name: name, todo_items : items});
            }else{
              const txnTags = this.db?.transaction(['tags_todo_items',], 'readwrite');
              let storeTags = txnTags?.objectStore('tags_todo_items');
              storeTags?.add({name: name, todo_items: [todoItem.id]});
            }                  
          }
        }
      }
    );
  }

  deleteItem(todoItem: TodoItem, fromBin?: boolean): void { 
    let txn = this.db?.transaction(['todo_items','deleted_todo_items'],'readwrite');
    if(!fromBin){
      txn?.objectStore('todo_items').delete(todoItem.id);
      txn?.objectStore('deleted_todo_items').add(todoItem);
    }else{
      txn?.objectStore('deleted_todo_items').delete(todoItem.id);
    }
    // there is no handling for deleting from tags_todo_items
    // TODO later
    if(this.userservice.getIsLoggedIn())
      this.http.delete<void>(`${this.apiUrl}/todo-items/${todoItem.id}`);
    
    this.updateItemList();
  }
  deleteItemById(id: number, fromBin?: boolean):void{
    let txn = this.db?.transaction(['todo_items'],'readwrite');
    if(!fromBin){
      txn?.objectStore('todo_items').delete(id);
    }else{
    }
    if(this.userservice.getIsLoggedIn())
      this.http.delete<void>(`${this.apiUrl}/todo-items/${id}`);
    this.updateItemList();
  }

  private searchTodosByQuery(subjectQuery: string, fromBin:boolean): Observable<Set<TodoItem>> {
    return this.db$.pipe(
      switchMap((db) => {
        return new Observable<Set<TodoItem>>((observer) => {
          let itemStore = !fromBin?'todo_items':'deleted_todo_items';
          const transaction = db.transaction(itemStore, 'readonly');
          const store = transaction.objectStore(itemStore);
          const index = store.index('subjectIndex');
          const searchQueryResults: Set<TodoItem> = new Set();

          const request = index.openCursor(IDBKeyRange.bound(subjectQuery, subjectQuery + '\uffff', false, false)); //prefix search
          
          request.onsuccess = (event) => {
            const cursor = (event.target as IDBRequest<IDBCursorWithValue>).result;
            if (cursor) {
              const item = cursor.value;
              searchQueryResults.add(item);
              cursor.continue();
            } else {
              observer.next(searchQueryResults);
              observer.complete();
            }
          };
          request.onerror = (event) => {
            observer.error((event.target as IDBRequest).error);
          };
        })
      }));
  }

  private searchTodosByTags(tagsFilter: string[] = [], fromBin:boolean): Observable<Set<number>>{
    return this.db$.pipe(
      switchMap((db) => {
        return new Observable<Set<number>>((observer) => {
          let itemStore = !fromBin?'todo_items':'deleted_todo_items';
          let txn = db.transaction([itemStore, 'tags_todo_items'],'readonly');
          let tagStore = txn.objectStore('tags_todo_items');
          let index = tagStore?.index("tagName");
          const includeItems: number[] = [];
          const excludeItems : number[] = [];
          const unfilteredItems : number[] = [];
          let request = index?.openCursor();
          request.onsuccess = (event) => {
            const cursor = (event.target as IDBRequest<IDBCursorWithValue>).result;
            if (cursor) {
              const item = cursor.value;              
              if(item){
                if((tagsFilter.includes('+'+item.name)||tagsFilter.includes(item.name))){
                  includeItems.push(...item.todo_items);                  
                }
                else if(tagsFilter.includes('-'+item.name)){
                  excludeItems.push(...item.todo_items);
                }else{
                  unfilteredItems.push(...item.todo_items);
                }
              }
              cursor.continue();
            } else {
              let uniqueTodoIds: Set<number> = new Set(); 
              if(includeItems.length!=0){
                includeItems.forEach(id=>{
                  if(!excludeItems.includes(id))
                    uniqueTodoIds.add(id);
                });
              }else{
                if(excludeItems.length!=0){
                  unfilteredItems.forEach(id=>{
                    if(!excludeItems.includes(id))
                      uniqueTodoIds.add(id);
                  });
                }
              }        
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


  searchTodos(subjectQuery: string, tagsFilter: string[] = [], fromBin:boolean): Observable<TodoItem[]> {
    if(subjectQuery==='' && tagsFilter.length==0) return this.getAllItemsForPage(1, fromBin);

    if(this.userservice.getIsLoggedIn()){
       return this.http.post<TodoItem[]>(`${this.apiUrl}/todo-items/search`, {searchQuery: subjectQuery, tags: tagsFilter});
   }
    return new Observable<TodoItem[]>((observer)=>{
      const promises: Promise<Set<TodoItem>>[] = [];
      if(subjectQuery.length!=0){
        promises.push(new Promise((resolve)=>{
          this.searchTodosByQuery(subjectQuery, fromBin).subscribe(
            (result)=>{
              resolve(result);
            }
          );
        }));
      }
      if(tagsFilter.length!=0){
        promises.push(new Promise((resolve)=>{
          this.searchTodosByTags(tagsFilter, fromBin).subscribe(
            (result)=>{
              let itemStore = !fromBin?'todo_items':'deleted_todo_items';
              let txn = this.db?.transaction([itemStore],'readonly');
              let store = txn?.objectStore(itemStore);
              let promises: Promise<TodoItem|null>[] = [];
              result.forEach((id)=>{
                promises.push(new Promise((resolve)=>{
                  let request = store?.get(id);
                  if(request){
                    request.onsuccess = (event)=>{
                      let target = event.target as IDBRequest;
                      if(target.result) {
                        resolve(target.result); 
                      }
                      else resolve(null);
                    }
                  }else{
                    resolve(null);
                  }
                }));
              });

              Promise.all(promises).then((result)=>{
                let filteredResult: Set<TodoItem> = new Set();
                result.forEach(item=>{
                  if(item) filteredResult.add(item);
                });
                resolve(filteredResult);
              })
            }
          );
        }));
      }
      Promise.all(promises).then((results)=>{
        if(results.length==2){
          let s1 = results[0];
          let s2 = results[1];
          let list: TodoItem[] =[];
          s1.forEach(item1=>{
            s2.forEach(item2=>{
              if(item1.subject===item2.subject) list.push(item2);
            })
          });
          observer.next(list);
        }
        else if(results.length==1){
          let list: TodoItem[] = [];
          results[0].forEach(item=>list.push(item));
          observer.next(list);
        }else observer.next([]);
        
        observer.complete();
      });
    });
  }

  private updateItemList(): void {
   this.initializeItems(this.fromBin);
  }
  
  clearBin(){
    let txn = this.db?.transaction(['todo_items','deleted_todo_items'],'readwrite');
    txn?.objectStore('deleted_todo_items').clear();
    if(this.userservice.getIsLoggedIn())
      this.http.delete<void>(`${this.apiUrl}/todo-items/all`);
  }

  ngOnDestroy(){
    if(this.dbSubject) this.dbSubject.unsubscribe();
    if(this.todoItemsSubject) this.todoItemsSubject.unsubscribe();
  }

}
