import { Injectable } from '@angular/core';
import { BehaviorSubject, ConnectConfig, Observable } from 'rxjs';
import { ToastService } from 'angular-toastify';
import { User } from '../../../models/User';
import { UserService } from './../../user/user.service';
import { ConnectionService } from '../../connection/connection.service';
import { TodoItem } from '../../../models/todo-item';

@Injectable({
  providedIn: 'root'
})
export class BackendCrudService {  
  connected = false;
  
  constructor(private toaster: ToastService, private connectionService : ConnectionService) { 
    connectionService.connected$.subscribe((status)=>{
      this.connected = status;
    });
  }

  getAllItems(): Observable<TodoItem[]> {
    return new Observable<TodoItem[]>((subscriber)=>{
      this.connectionService.axios.get('/item/all').then(()=>{
        
      });
    });
  }

  addItem(item: Omit<TodoItem, 'id'>){
    this.connectionService.axios.post('/item/save',item).then((res)=>{
      console.log(res);
    }).catch((e)=>{
      console.log(e);
    });
  }
}
