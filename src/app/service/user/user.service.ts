import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { User } from '../../models/User';
import { ToastService } from 'angular-toastify';
import { Route, Router } from '@angular/router';
import { localUser } from '../consts';

@Injectable({
  providedIn: 'root',
})
export class UserService {
  loggedInUser = new BehaviorSubject<User>(localUser);
  loggedInUser$ = this.loggedInUser.asObservable();

  constructor(
    private toaster: ToastService,
    private router: Router,
  ) {
    
  }

  signinUser() {
    if (this.loggedInUser.value != null) {
      this.softLogoutUser();
    }
    this.router.navigate(['/signup']);
  }

  loginUser() {
    if (this.loggedInUser.value != null) {
      this.softLogoutUser();
    }
    this.router.navigate(['/login']);
  }

  softLogoutUser() {
    this.loggedInUser.next(localUser);
  }

  getPayloadFromAccessToken(): any{
    const payloadBase64 = (this.loggedInUser.value.token || '').split('.')[1];
    if(payloadBase64){
      const decodedPayload = atob(payloadBase64);
      const payload = JSON.parse(decodedPayload);
      return payload;
    }
    return null;
  }

  isThisCurrentUser(user: User): boolean{
    let currentUser = this.loggedInUser.value;
    return (currentUser.email === user.email)
    && (currentUser.userGroup === user.userGroup);      
  }
}
