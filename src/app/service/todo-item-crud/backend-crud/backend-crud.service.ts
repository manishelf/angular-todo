import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { ToastService } from 'angular-toastify';
import { User } from '../../../models/User';
import { UserService } from './../../user/user.service';

@Injectable({
  providedIn: 'root'
})
export class BackendCrudService {  
  backendUrl: string | null = null;


  constructor(private toaster: ToastService, private userService: UserService) { 
    userService.connected$.subscribe((status)=>{
      if(status)
      this.backendUrl = userService.backendUrl;
      else this.backendUrl = null;
    })
  }
}
