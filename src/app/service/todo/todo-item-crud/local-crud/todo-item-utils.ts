import { Injectable } from '@angular/core';
import { Observable, from, BehaviorSubject, throwError, switchMap, tap } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class TodoItemUtils {
   getObjectStore(db: IDBDatabase, storeName: string, mode: 'readonly' | 'readwrite'):IDBObjectStore {
    return db.transaction(storeName, mode).objectStore(storeName);
  }

  getObjectStoreRW(db: IDBDatabase, storeName: string):IDBObjectStore{    
    return db.transaction(storeName, 'readwrite').objectStore(storeName);
  }
  getObjectStoreRO(db: IDBDatabase, storeName: string):IDBObjectStore{    
    return db.transaction(storeName, 'readonly').objectStore(storeName);
  }

   createObservable<T>(request: IDBRequest): Observable<T> {
    return new Observable<T>((observer) => {
      request.onsuccess = (event) => {
        const target = event.target as IDBRequest;
        observer.next(target.result as T);
        observer.complete();
      };
      request.onerror = (event) => {
        const target = event.target as IDBRequest;
        observer.error(target.error);
      };
    });
  }

  createPromise<T>(request:IDBRequest): Promise<T>{
    return new Promise<T>((res, rej)=>{
      request.onsuccess = (event) => {
        const target = event.target as IDBRequest;
        res(target.result as T);
      };
      request.onerror = (event) => {
        const target = event.target as IDBRequest;
        rej(target.error);
      };
    });
  }
}