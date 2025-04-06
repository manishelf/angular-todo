import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { SocialUser, GoogleSigninButtonModule,SocialLoginModule, GoogleLoginProvider, SocialAuthService } from "@abacritt/angularx-social-login";

@Injectable({
  providedIn: 'root'
})
export class UserServiceService {

  private userEmailSubject = new BehaviorSubject<string | null>(null);
  private userAuthTokenSubject = new BehaviorSubject<string | null>(null);
  private isLoggedInSubject = new BehaviorSubject<boolean | null>(false);
  private themeSubject = new BehaviorSubject<string | null>(null);

  accessToken:string | null = null;
  user: SocialUser = new SocialUser();
  loggedIn: boolean = false;
  
  // $ is a common convention to indicate that a variable holds a observable

  setUserEmail(email: string | null): void{
    this.userEmailSubject.next(email);
  }

  getUserEmail(): string | null {
    return this.userEmailSubject.getValue();
  }

  setIsLoggedIn(status: boolean | null): void{
    this.isLoggedInSubject.next(status);
  }

  getIsLoggedIn(): boolean | null {
    return this.isLoggedInSubject.getValue();
  }

  setUserAuthToken(token: string | null): void{
    this.userAuthTokenSubject.next(token);
  }

  getUserAuthToken(): string | null {
    return this.userAuthTokenSubject.getValue();
  }
}
