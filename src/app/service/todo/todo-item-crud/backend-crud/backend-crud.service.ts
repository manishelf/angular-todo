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
import { SYNC_OP, todoItemState } from '../../syncWorker/sync.worker';
import { SearchService } from '../../../search/search.service';
import { TodoItemDeleteService } from '../local-crud/todo-item-delete.service';
import { TodoItemUtils } from '../local-crud/todo-item-utils';
import { Route, Router } from '@angular/router';
import { SOC_OP } from '../../../connection/socket/socket.worker';

@Injectable({
  providedIn: 'root'
})
export class BackendCrudService implements OnDestroy{  
  connected = false;  
  syncWorker: Worker;
  socketWorker: Worker | null = null;

  db: IDBDatabase | null = null;
  user: User | null = null;

  refresh$ = new BehaviorSubject<boolean>(false);

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
    
    if(this.connected){
      this.syncWorker.postMessage({
        op:SYNC_OP.INIT,
        backendUrl: this.connectionService.backendUrl,
        user
      });
      setTimeout(()=>{
        let wsWorker = this.connectionService.socketWorkers.get(user.userGroup);
        if(wsWorker){   
          wsWorker.onmessage = (message)=>{    
            let data = message.data;   
            
            if(data.op == SOC_OP.MESSAGE){
              if(data.message.type == SOC_OP.REFRESH_MERGE){                
                this.syncWorker.postMessage({
                  op:SYNC_OP.MERGE
                })
              }
            }
          }
          this.socketWorker= wsWorker;
        }        
      },2000); // allow ws to connect
    }
  }

  deserializeFromBuffToItems(buffer: ArrayBuffer): TodoItem[]{
    const textDecoder = new TextDecoder('utf-8'); 
    const jsonString = textDecoder.decode(buffer);
    return JSON.parse(jsonString)
  }

  handleSyncMessage(message: any){
    if(message.data.op === SYNC_OP.MERGE){
      console.log("Starting sync merge", Date.now());
      
      let itemsForAdd = this.deserializeFromBuffToItems(message.data.itemsForAdd);
      let itemsForUpdate = this.deserializeFromBuffToItems(message.data.itemsForUpdate);
      let itemsForDelete = this.deserializeFromBuffToItems(message.data.itemsForDelete);

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
          this.signalRefresh();
        }
      });
    }
  }

  handleColabNotif(){    
    if(this.socketWorker){      
      this.socketWorker.postMessage({
        op: SOC_OP.SEND,
        target: {
          type: "REFRESH_MERGE"
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
      this.handleColabNotif();
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
        this.handleColabNotif();
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
      this.handleColabNotif();
    }).catch((e)=>{
      console.log(e);
    });
  }

  signalRefresh(){
    this.refresh$.next(true);
    this.refresh$.next(false);
  }

  ngOnDestroy(): void {
    this.syncWorker.terminate();
  }
}
