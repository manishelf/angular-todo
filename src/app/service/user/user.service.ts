import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { User } from '../../models/User';
import { ToastService } from 'angular-toastify';
import { Route, Router } from '@angular/router';

@Injectable({
  providedIn: 'root',
})
export class UserService {
  loggedInUser = new BehaviorSubject<User | null>(null);
  loggedInUser$ = this.loggedInUser.asObservable();

  constructor(
    private toaster: ToastService,
    private router: Router,
  ) {
  }

  signinUser() {
    if (this.loggedInUser.value != null) {
      this.logoutUser();
    }
    this.router.navigate(['/signup']);
  }

  loginUser() {
    if (this.loggedInUser.value != null) {
      this.logoutUser();
    }
    this.router.navigate(['/login']);
  }

  logoutUser() {
    this.loggedInUser.next(null);
  }
}
