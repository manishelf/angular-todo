import { Injectable, Optional } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, from, BehaviorSubject, throwError, switchMap, tap, Subscriber } from 'rxjs';import { TodoItem } from './../models/todo-item';
import { TodoItemAddService } from './todo-item-crud/todo-item-add.service';
import { TodoItemUpdateService } from './todo-item-crud/todo-item-update.service';
import { TodoItemDeleteService } from './todo-item-crud/todo-item-delete.service';
import { TodoItemGetService } from './todo-item-crud/todo-item-get.service';
import { Params } from '@angular/router';
import { ToastService } from 'angular-toastify';

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
            this.toaster.error('error connecting to local idexedDB!');
            console.error('Error opening IndexedDB:', error);
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
              console.error('local db err: ',err);
              this.toaster.error('local db error: '+err.type);
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
    private getService: TodoItemGetService,
    private toaster : ToastService
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
    try{
      this.deleteService.clearBin(this.db$);
      this.toaster.success('local recycle bin cleared');
    }catch(e){
      this.toaster.error('error clearing local recycle bin');
      console.error('error clearing local recycle bin: ', e);
    }
  }
  searchTodos(subjectQuery: string, tagFilter: string[] =[]): Observable<TodoItem[]> {
    return this.getService.searchTodos(this.db$, subjectQuery, tagFilter, this.fromBin);
  }

  addItem(item: Omit<TodoItem, 'id'>): void{
    try{
      this.addService.addItem(this.db$, item);
      this.initializeItems();
      this.toaster.success('todo item added');
    }catch(e){
      this.toaster.error('error adding todo item: ');
      console.error('error adding todo item: ', e);
    }
  }
  getItemById(id: number): Observable<TodoItem>{
    return this.getService.getItemById(this.db$, id);
  }
  updateItem(item:TodoItem): void{
    try{
      this.updateService.updateItem(this.db$, item).add(()=>{
        this.initializeItems();
        this.toaster.success('todo item updated');
      });
    }catch(e){
      this.toaster.error('error updating todo item');
      console.error('error updating todo item: ', e);
    }
  }
  deleteItem(item: TodoItem): void{    
    try{
      this.deleteService.deleteItem(this.db$, item, this.fromBin);
      this.initializeItems();
      this.toaster.success('todo item deleted');
    }catch(e){
      this.toaster.error('error deleting todo item');
      console.error('error deleting todo item: ', e);
    }
  }
  deleteItemById(id: number): void{
    this.getService.getItemById(this.db$, id).subscribe((item)=>{
      this.deleteItem(item);
    });
  }

  serializeOneToJson(item:TodoItem): string{
    return `{
      "id": ${item.id?item.id:null},
      "subject": "${item.subject}",
      "description": "${item.description}",
      "tags": [${
        item.tags.map(tag => `{"id": ${tag.id?tag.id:null}, "name": "${tag.name}"}`)
      }],
      "completionStatus": ${item.completionStatus},
      "setForReminder": ${item.setForReminder},
      "creationTimestamp": "${item.creationTimestamp}",
      "updationTimestamp": "${item.updationTimestamp}",
      "eventStart": ${item.eventStart?"\""+item.eventStart+"\"":null},
      "eventEnd": ${item.eventEnd?"\""+item.eventEnd+"\"":null},
      "eventFullDay": ${item.eventFullDay?item.eventFullDay:false},
      "deleted": ${item.deleted?item.deleted:false}
    }`;
  }

  serializeManyToJson(items: TodoItem[]): Observable<string>{
    return new Observable<string>((subscriber)=>{
      subscriber.next( `{ "items": [
        ${
          items.map(item=>this.serializeOneToJson(item)+'\n')
        }]
        }`);
    })
  }

  deserializeOneFromJson(xmlString: string):TodoItem{
    let item:TodoItem = {
      id: Number.MIN_VALUE,
      subject: '',
      description: '',
      tags: [],
      completionStatus: false,
      setForReminder: false,
      creationTimestamp: '',
      updationTimestamp: '',
      eventStart: '',
      eventEnd: '',
      eventFullDay: false,
      deleted: false
    };
    try{
      item = JSON.parse(xmlString);
    }catch(e){
      console.error('error deserializing xml string to todo item', e);
      this.toaster.error('error deserializing xml string to todo item ');
    }
    return item;
  }

  deserializeManyFromJson(xmlString: string): Observable<TodoItem[]>{
    return new Observable<TodoItem[]>((Subscriber)=>{
      let items: TodoItem[] = [];
      try{
        let result = JSON.parse(xmlString);
        items = result.items
      }catch(e){
        console.error('error deserializing xml string to todo item', e);
        this.toaster.error('error deserializing xml string to todo item ');
      }
      Subscriber.next(items);
    });
  }

  addMany(items: TodoItem[]): void{
    try{
      items.forEach(item=>{
        try{
          this.addItem(item);
        }catch(e){
          try{
            this.getItemById(item.id).subscribe((existingItem)=>{
              if(existingItem){
                if(new Date(existingItem.updationTimestamp)<new Date(item.updationTimestamp)){
                  this.updateItem(item);
                  this.toaster.info('updated an existing item');
                }
              }
              else{
                this.searchTodos(item.subject).subscribe((existingItem)=>{
                  if(new Date(existingItem[0].updationTimestamp)<new Date(item.updationTimestamp)){
                    this.updateItem(item);
                    this.toaster.info('updated an existing item');
                  }
                });
              }
            });
          }catch(e){
            console.log('error adding item', e);
            this.toaster.error('error adding item');
          }
          console.log('error adding todo item', e);
        }
      });
      this.initializeItems();  
    }catch(e){
      this.toaster.error('error adding todo items');
      console.error('error adding todo items: ', e);
    }
  }
}
