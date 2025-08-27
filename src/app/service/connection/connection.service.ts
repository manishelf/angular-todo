import { Injectable } from '@angular/core';
import { ToastService } from 'angular-toastify';
import { BehaviorSubject } from 'rxjs';

import {Axios} from 'axios';
import { UserService } from './../user/user.service';
import { Route, Router } from '@angular/router';

@Injectable({
  providedIn: 'root',
})
export class ConnectionService {
  backendUrl: string = '';

  private connected: BehaviorSubject<boolean> = new BehaviorSubject(false);
  connected$ = this.connected.asObservable();

  private accessToken: string = '';

  axios: Axios = new Axios();

  constructor(private toaster: ToastService, private userService : UserService, private router: Router) {
    this.backendUrl = localStorage['qtodo_backend_url'];
    if (this.backendUrl && this.backendUrl !== 'null') {
      this.connectToBackend().then(
        (con)=>{
          if(con) this.router.navigate(['/login']);
        }
      );
    }
    
    this.connected$.subscribe((con) => {
      if (con) {
        this.toaster.info('connected to backend successfully!');
      } else {
        this.toaster.error(
          'disconnected from backend! switched to offline mode'
        );
      }
    });
    
    this.userService.loggedInUser.subscribe(async (user)=>{
      if(user){
        this.accessToken = user.token || '';
      }else{
        if(this.accessToken != '')
        this.axios.post('/user/logout');
      }
    })

    this.axios.interceptors.request.use(async (config)=> {
        if(this.accessToken != '' && this.isTokenExpired(this.accessToken) && !config.url?.includes('/user/refresh')){
          let resp = await this.axios.get('/user/refresh');
          this.accessToken = resp.data.accessToken;
        }
        config.headers.Authorization = 'Bearer '+ this.accessToken;
        config.data = JSON.stringify(config.data);
        config.headers['Content-Type'] = 'application/json';
        config.url = this.backendUrl+config.url;
        config.withCredentials = true;
        return config;
      }, function (error) {
        console.error(error);
        return Promise.reject(error);
      },
    );

    this.axios.interceptors.response.use((resp)=>{
      if(resp.data)
        resp.data = JSON.parse(resp.data);
      if(resp.data.responseMessage){
        if(resp.status == 200)
        this.toaster.success(resp.data.responseMessage);
        else if(resp.status == 400 || resp.status == 500){
          this.toaster.error(resp.data.responseMessage);
        } else if(resp.status == 403){
          this.toaster.error('403 -> forbidden')
        }else {
          this.toaster.warn(resp.data.responseMessage);
        }
      }
      return resp;
    });
  }

  isTokenExpired(token:string) {
  try {
    const payloadBase64 = token.split('.')[1];
    let expirationTimeInSeconds = 0;
    if(payloadBase64){
      const decodedPayload = atob(payloadBase64);
      const payload = JSON.parse(decodedPayload);
      expirationTimeInSeconds = payload.exp*1000;
    }
    return expirationTimeInSeconds<Date.now();
  } catch (e) {
    console.error("Failed to decode token:", e);
    return null;
  }
}

  connectToBackend(): Promise<boolean> {
    return new Promise((res, rej) => {
      if (
        !this.backendUrl ||
        this.backendUrl == 'null' ||
        this.backendUrl.trim() == ''
      ) {
          this.backendUrl =
          prompt('Enter backend server url to use cross device!') || '';
        
          this.backendUrl = this.backendUrl.replace(/\/+$/, ''); // remove trailing /
      }

      if (
        this.backendUrl &&
        this.backendUrl != 'null' &&
        this.backendUrl.trim() != ''
      ) {
        fetch(this.backendUrl + '/up')
          .then((resp) => {
            if (resp.ok && resp.body) {
              let body = resp.body;
              let reader = body?.getReader();
              let decoder = new TextDecoder();
              reader?.read().then((readerResult) => {
                let resp = decoder.decode(readerResult.value, {
                  stream: !readerResult.done,
                });
                this.toaster.info(resp);
              });
              this.connected.next(true);
              localStorage['qtodo_backend_url'] = this.backendUrl;
              res(true);
            }
          })
          .catch((e) => {
            console.error('unable to connect to ' + this.backendUrl, e);
            localStorage['qtodo_backend_url'] = null;
            this.backendUrl = '';
            this.connected.next(false);
            rej(e);
          });
      } else {
        rej('Blank backend Url');
      }
    });
  }

  disconnectFromBackend(): Promise<boolean> {
    return new Promise((res) => {
      this.connected.next(false);
      this.backendUrl = '';
      localStorage['qtodo_backend_url'] = null;
      res(true);
    });
  }
}
