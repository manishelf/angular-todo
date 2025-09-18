import { Injectable, OnDestroy } from '@angular/core';
import { BehaviorSubject, ConnectConfig, debounceTime, Observable } from 'rxjs';
import { ToastService } from 'angular-toastify';
import { User } from '../../../../models/User';
import { UserService } from '../../../user/user.service';
import { ConnectionService } from '../../../connection/connection.service';
import { TodoItem } from '../../../../models/todo-item';
import { TodoItemUpdateService } from '../local-crud/todo-item-update.service';
import { TodoItemAddService } from '../local-crud/todo-item-add.service';
import { TodoItemGetService } from '../local-crud/todo-item-get.service';
import { OP, todoItemState } from '../../syncWorker/sync.worker';
import { SearchService } from '../../../search/search.service';
import { TodoItemDeleteService } from '../local-crud/todo-item-delete.service';
import { TodoItemUtils } from '../local-crud/todo-item-utils';
import { Route, Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class BackendCrudService implements OnDestroy{  
  connected = false;  
  syncWorker: Worker;

  db: IDBDatabase | null = null;
  user: User | null = null;

  constructor(private toaster: ToastService, 
    private connectionService : ConnectionService, 
    private localUpdateService: TodoItemUpdateService,
    private localAddService: TodoItemAddService,
    private localDeleteService: TodoItemDeleteService,
    private dbUtils: TodoItemUtils,
    private localSearchService: SearchService,
    private localGetService: TodoItemGetService,
    private router: Router,
  ) { 
    this.syncWorker = new Worker(new URL('../../syncWorker/sync.worker.ts', import.meta.url));

    this.syncWorker.onerror=(err)=>{
      this.toaster.error('Unable to sync with backend!');
      console.error(err);
    };

    this.syncWorker.onmessageerror=(err)=>{
      this.toaster.error('sync operation failed!');
      console.error(err);
    }
    
    this.syncWorker.onmessage = (message)=>{
      this.handleSyncMessage(message);
    };

    connectionService.connected$.subscribe((status)=>{
      this.connected = status;
    });
  }

  init(db: IDBDatabase, user: User){
    this.db = db;
    this.user = user;
    
    if(this.connected)
    this.syncWorker.postMessage({
      op:OP.INIT,
      backendUrl: this.connectionService.backendUrl,
      user
    });
  }

  handleSyncMessage(message: any){
    if(message.data.op === OP.MERGE){
      let itemsForAdd = message.data.itemsForAdd;
      let itemsForUpdate = message.data.itemsForUpdate;
      let itemsForDelete = message.data.itemsForDelete;
      let done = new BehaviorSubject<boolean>(false);
      
      
      itemsForAdd.forEach((item: Omit<TodoItem, 'id'>)=>{
        if(this.db){
          this.localAddService.addItem(this.db, item,()=>{
            done.next(true);
          });
        }
      });
      
      itemsForUpdate.forEach((forUpdate: TodoItem) => {
        if(this.db)
        this.localGetService.getItemByUUID(this.db, forUpdate.uuid).subscribe((item)=>{
          forUpdate.id = item.id;
          if(this.db && new Date(item.updationTimestamp).getTime() < new Date(forUpdate.updationTimestamp).getTime()){
            this.localUpdateService.updateItem(this.db, forUpdate,()=>{
              done.next(true);
            });
          }
        });
      });
      itemsForDelete.forEach((item: todoItemState)=>{
        if(this.db)
          this.localGetService.getItemByUUID(this.db, item.uuid).subscribe((item)=>{
          if(this.db){
            this.localDeleteService.deleteItem(this.db, item);
            done.next(true);
          }
        });
      });

      done.pipe(debounceTime(100)).subscribe((s)=>{
        if(s){
          this.toaster.success('Synced items with backend!');
          this.toaster.info('auto refresh in 5 seconds');
          this.router.navigate(['/edit']); //forces reload
        }
      });
    }
  }

  getAll(): Promise<TodoItem[]>{
    if(!this.connected) return Promise.resolve([]);

    return new Promise((res,rej)=>{
      this.connectionService.axios.get('/item/all').then((result)=>{
          res(result.data.items);
      }).catch((e)=>rej(e));
    })
  }

  addItem(item: Omit<TodoItem, 'id'>){
    if(!this.connected) return;

    console.log('sending add', Date.now());
    console.log('todo item', item.updationTimestamp);
    this.connectionService.axios.post('/item/save',{itemList:[item]}).then((res)=>{
      console.log(res);
      console.log('recieved response', Date.now());
    }).catch((e)=>{
      console.log(e);
    });
  }

  updateManyItems(items:TodoItem[]): Promise<any>{
    if(!this.connected) return new Promise<void>((res)=>res());
    
    return new Promise((resolve,reject)=>{
      this.connectionService.axios.patch('/item/update', {itemList:items}).then((resp)=>{
        console.log(resp);
        resolve(resp);
      }).catch((e)=>{
        console.log(e);
        reject(e);
      });
    });
  }

  updateItem(db: IDBDatabase,dirtyItem: TodoItem){
    if(!this.connected) return;
    this.localGetService.getItemById(db,dirtyItem.id).subscribe(item=>{
      this.updateManyItems([dirtyItem]); 
      console.log(item);
    });
  }

  deleteItem(item: TodoItem){
    if(!this.connected) return;
    this.connectionService.axios.post('/item/delete',{itemList:[item]}).then((res)=>{
      console.log(res);
    }).catch((e)=>{
      console.log(e);
    });
  }

  ngOnDestroy(): void {
    this.syncWorker.terminate();
  }
}
