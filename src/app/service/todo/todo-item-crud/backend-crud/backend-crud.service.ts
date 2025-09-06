import { Injectable } from '@angular/core';
import { BehaviorSubject, ConnectConfig, Observable } from 'rxjs';
import { ToastService } from 'angular-toastify';
import { User } from '../../../../models/User';
import { UserService } from '../../../user/user.service';
import { ConnectionService } from '../../../connection/connection.service';
import { TodoItem } from '../../../../models/todo-item';
import { TodoItemUpdateService } from './../todo-item-update.service';
import { TodoItemAddService } from '../todo-item-add.service';
import { TodoItemGetService } from '../todo-item-get.service';

@Injectable({
  providedIn: 'root'
})
export class BackendCrudService {  
  connected = false;
  
  constructor(private toaster: ToastService, private connectionService : ConnectionService, 
    private localUpdateService: TodoItemUpdateService,
    private localAddService: TodoItemAddService,
    private localGetService: TodoItemGetService
  ) { 
    connectionService.connected$.subscribe((status)=>{
      this.connected = status;
    });
  }

  // syncAll(db$: Observable<IDBDatabase>, localItems: TodoItem[]): Promise<TodoItem[]>{
  //   return new Promise<TodoItem[]>((res, rej)=>{
  //       if(!this.connected || true) res(localItems);

  //       this.getDirty(localItems).then((dirtyItems)=>{
  //         if(dirtyItems.length == 0){
  //           res(localItems);
  //         }else{
  //           for(let item of dirtyItems){
  //             this.localUpdateService.updateItem(db$, item, (suc)=>{
  //             },(err)=>{
  //               this.localAddService.addItem(db$, item);
  //             });
  //           }
  //         }
  //       });
  //   });
  // }

  // getDirty(localItems: TodoItem[]): Promise<TodoItem[]>{
  //   return new Promise<TodoItem[]>((res)=>{
  //     let dirty:TodoItem[] = [];
  //     if(!this.connected) res(localItems);
  //     this.connectionService.axios.post('/item/merge',{itemList: localItems}).then((resp)=>{
  //       let items = resp.data.items as TodoItem[];
  //       res(items);
  //     })
  //   });
  // }

  addItem(item: Omit<TodoItem, 'id'>){
    if(!this.connected) return;

    this.connectionService.axios.post('/item/save',{itemList:[item]}).then((res)=>{
      console.log(res);
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

  updateItem(db$:Observable<IDBDatabase>,dirtyItem: TodoItem){
    if(!this.connected) return;
    this.localGetService.getItemById(db$,dirtyItem.id).subscribe(item=>{
      (dirtyItem as any).subjectBeforeUpdate = item.subject;
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
}
