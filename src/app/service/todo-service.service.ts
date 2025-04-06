import { Injectable, Optional } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, from, BehaviorSubject, throwError, switchMap, tap } from 'rxjs';import { TodoItem } from './../models/todo-item';
import { TodoItemAddService } from './todo-item-crud/todo-item-add.service';
import { TodoItemUpdateService } from './todo-item-crud/todo-item-update.service';
import { TodoItemDeleteService } from './todo-item-crud/todo-item-delete.service';
import { TodoItemGetService } from './todo-item-crud/todo-item-get.service';
import { Params } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class TodoServiceService{
  fromBin: boolean = false;
  public db$: Observable<IDBDatabase> =  new Observable<IDBDatabase>(
    (subscriber) => {
          const request = indexedDB.open('todo_items_db', 1);

          request.onerror = (error) => {
            subscriber.error(error);
          };

          request.onupgradeneeded = (event) => {
            let db = (event.target as IDBOpenDBRequest).result;
            const todoItemsStore = db.createObjectStore('todo_items', { keyPath: 'id', autoIncrement: true });
            const deletedTodoItemsStore = db.createObjectStore('deleted_todo_items', { keyPath: 'id', autoIncrement: true });
            const tagsTodoItemStroe = db.createObjectStore('tags_todo_items', { keyPath: 'name' });

            todoItemsStore.createIndex('subjectIndex', 'subject', { unique: true});
            deletedTodoItemsStore.createIndex('subjectIndex', 'subject', { unique: true });
            tagsTodoItemStroe.createIndex('tagName','name', {unique: true});
          }

          request.onsuccess = (event) => {
            let db = (event.target as IDBOpenDBRequest).result;
            db.onerror = (err) => {
              console.error(err);
            };
            subscriber.next(db);
            subscriber.complete();
          };
    });
  
  private todoItemsSubject = new BehaviorSubject<TodoItem[]>([]);
  todoItems$ = this.todoItemsSubject.asObservable(); 
  

  constructor(private http: HttpClient, 
    private addService: TodoItemAddService,
    private updateService: TodoItemUpdateService,
    private deleteService: TodoItemDeleteService,
    private getService: TodoItemGetService
  ) {
  }
  
  initializeItems(): void {
    this.getService.getAllItems(this.db$, this.fromBin).subscribe((items) => {
      this.todoItemsSubject.next(items);
    });
  }
  
  getAll(): Observable<TodoItem[]> {
    return this.getService.getAllItems(this.db$, this.fromBin);
  }

  clearBin(): void{
    this.deleteService.clearBin(this.db$);
  }
  searchTodos(subjectQuery: string, tagFilter: string[] =[]): Observable<TodoItem[]> {
    return this.getService.searchTodos(this.db$, subjectQuery, tagFilter, this.fromBin);
  }

  addItem(item: Omit<TodoItem, 'id'>): void{
    this.addService.addItem(this.db$, item);
    this.initializeItems();
  }
  getItemById(id: number): Observable<TodoItem>{
    return this.getService.getItemById(this.db$, id);
  }
  updateItem(item:TodoItem): void{
    this.updateService.updateItem(this.db$, item).add(()=>{
      this.initializeItems();
    });
  }
  deleteItem(item: TodoItem): void{    
    this.deleteService.deleteItem(this.db$, item, this.fromBin);
    this.initializeItems();
  }
  deleteItemById(id: number): void{
    this.getService.getItemById(this.db$, id).subscribe((item)=>{
      this.deleteItem(item);
    });
  }

}
