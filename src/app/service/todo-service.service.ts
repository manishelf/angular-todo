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
          const request = indexedDB.open('todo_items_db', 2335);

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
            const customItemStroe = db.createObjectStore('custom_items', {keyPath: 'tag'});

            todoItemsStore.createIndex('subjectIndex', 'subject', { unique: true});
            deletedTodoItemsStore.createIndex('subjectIndex', 'subject', { unique: true });
            tagsTodoItemStroe.createIndex('tagName','name', {unique: true});
            customItemStroe.createIndex('tagIndex', 'tag', {unique: true});
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
  deleteAll():void{
    let res = prompt(`Are you sure you want to delete all items from ${this.fromBin?'bin':'item list'}?\n [ Y | N ]`,'N');
    if(res === 'Y')
    try{
      this.getService.getAllItems(this.db$, this.fromBin).subscribe((items)=>{
        items.forEach(item=>{
          this.deleteItem(item);
        });
      }); 
      this.toaster.success('cleared all items from '+(this.fromBin?'bin':'todo list'));
    }catch(e){
      this.toaster.error('error deleting all items');
      console.error('error deleting all items: ', e);
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

  addCustom(tag: string, item: any){
    try{
      this.addService.addCustom(this.db$, tag, item);
      this.toaster.success('saved '+tag);
    }catch(e){
      this.toaster.error('error saving '+tag);
      console.error('error adding custom item', e);
    }
  }

  getItemById(id: number): Observable<TodoItem>{
    return this.getService.getItemById(this.db$, id);
  }

  getCustom(tag: string): Observable<any>{
   return this.getService.getCustom(this.db$, tag); 
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

  updateCustom(tag: string, item: any): void{
    try{
      this.updateService.updateCustom(this.db$, tag, item);
      this.toaster.success('updated '+tag);
    }catch(e){
      this.toaster.error('error updating '+tag);
      console.error('error updating '+ tag, e);
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
      "subject": "${item.subject.replace(/\"/g,"&quot;")}",
      "description": "${item.description.replace(/\"/g,"&quot;").replace(/\n/g,"<br>")}",
      "tags": [${
        item.tags.map(tag => `{"id": ${tag.id?tag.id:null}, "name": "${tag.name.replace(/\"/g,"&quot;")}"}`)
      }],
      "completionStatus": ${item.completionStatus},
      "setForReminder": ${item.setForReminder},
      "creationTimestamp": "${item.creationTimestamp}",
      "updationTimestamp": "${item.updationTimestamp}",
      "eventStart": ${item.eventStart?"\""+item.eventStart+"\"":null},
      "eventEnd": ${item.eventEnd?"\""+item.eventEnd+"\"":null},
      "eventFullDay": ${item.eventFullDay?item.eventFullDay:false},
      "deleted": ${item.deleted?item.deleted:false},
      "userDefined": ${JSON.stringify(item.userDefined)},
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

  deserializeOneFromJson(jsonString: string):TodoItem{
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
      deleted: false,
      userDefined: {tag:'', formControlSchema: {}, data: null},
    };
    try{
      item = JSON.parse(jsonString);
    }catch(e){
      console.error('error deserializing json string to todo item', e);
      this.toaster.error('error deserializing json string to todo item ');
    }
    return item;
  }

  deserializeManyFromJson(xmlString: string): Observable<TodoItem[]>{
    return new Observable<TodoItem[]>((Subscriber)=>{
      let items: TodoItem[] = [];
      try{
        let result = JSON.parse(xmlString);
        items = result.items;
      }catch(e){
        console.error('error deserializing json string to todo item', e);
        this.toaster.error('error deserializing json string to todo item ');
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
