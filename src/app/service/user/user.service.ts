import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { User } from '../../models/User';
import { ToastService } from 'angular-toastify';
import { Route, Router } from '@angular/router';

export const localUser:User = {
  email: 'qtodo',
  userGroup: 'local',
  alias: 'local'
}

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
}
