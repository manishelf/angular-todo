import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { User } from '../../models/User';
import { ToastService } from 'angular-toastify';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  
  private loggedInUser = new BehaviorSubject<User | null>(null);
  loggedInUser$ = this.loggedInUser.asObservable();

  private connected: BehaviorSubject<boolean> = new BehaviorSubject(false);
  connected$ = this.connected.asObservable();

  backendUrl: string;

  constructor(private toaster : ToastService) {
    this.backendUrl = localStorage['qtodo_backend_url'];
    if(this.backendUrl){
      this.connectToBackend();
    }
    this.connected$.subscribe((con)=>{
      if(con){
        this.toaster.info("connected to backend successfully!");
      }else{
        this.toaster.error("disconnected from backend! switched to offline mode");
      }
    });
  }

  connectToBackend(): Promise<boolean>{
    return new Promise((res,rej)=>{
      if(!this.backendUrl){
        this.backendUrl = prompt("Enter backend server url to use cross device!") || "";
      }
      
      if(this.backendUrl.trim() != ''){
        fetch(this.backendUrl+'/up').then((resp)=>{
          if(resp.ok && resp.body){
            let body = resp.body;
            let reader = body?.getReader();
            let decoder = new TextDecoder();
            reader?.read().then((readerResult)=>{
              let resp = decoder.decode(readerResult.value, {stream: !readerResult.done});
              this.toaster.info(resp);
            })
            this.connected.next(true);
            localStorage['qtodo_backend_url'] = this.backendUrl;
            res(true);
            this.signinUser();
          }
        }).catch((e)=>{
          console.error("unable to connect to "+this.backendUrl, e);
          localStorage['qtodo_backend_url'] = null;
          this.connected.next(false);
          rej(e);
        });
      }else {
        rej("Blank Url");
      }
    });
  }

  disconnectFromBackend(): Promise<boolean>{
    return new Promise((res)=>{
      this.connected.next(false);
      this.loggedInUser.next(null);
      this.backendUrl = "";
      localStorage['qtodo_backend_url'] = null;
      res(true);
    });
  }

  signinUser(){
    fetch(this.backendUrl+"/user").then((resp)=>{
      if(resp.ok && resp.body){
        let reader = resp.body.getReader();
        let decoder = new TextDecoder();
        reader?.read().then((readerResult)=>{
          let userJson = decoder.decode(readerResult.value, {stream: !readerResult.done});
          this.loggedInUser.next(JSON.parse(userJson));
        })
      }else{        
        this.loggedInUser.next(null);
      }
    }).catch((e)=>{
      this.connected.next(false);
    });
  }
}
