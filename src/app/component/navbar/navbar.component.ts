import { Component, OnInit } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { Router } from '@angular/router';
import { BeanItemComponent } from './../bean-item/bean-item.component';
import { SocialUser, GoogleSigninButtonModule,SocialLoginModule, GoogleLoginProvider, SocialAuthService } from "@abacritt/angularx-social-login";
import { CommonModule } from '@angular/common';
import { ToastService } from 'angular-toastify';

@Component({
  selector: 'app-navbar',
  imports: [MatIconModule, BeanItemComponent, SocialLoginModule, GoogleSigninButtonModule, CommonModule],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.css'
})
export class NavbarComponent implements OnInit{
  accessToken:string | null = null;
  user: SocialUser = new SocialUser();
  loggedIn: boolean = false;

  constructor(private router: Router,  private authService: SocialAuthService, private toaster: ToastService) { }

  ngOnInit() {
    this.authService.authState.subscribe((user) => {
      this.user = user;
      this.loggedIn = (user != null);
      fetch('https://www.googleapis.com/drive/v3/files', {
        headers: {
          Authorization: `Bearer ${this.authService.getAccessToken(GoogleLoginProvider.PROVIDER_ID)}`
        }
      })
      .then(response => response.json())
      .then(data => console.log(data));
      console.log(user +'2');
    });
  }


  searchItems(event: Event): void{
    let inputValue = (event.target as HTMLInputElement).value;
    
    let searchQuery = inputValue;
    let tagList: string[] = [];

    let input: string[] =inputValue.split('!T:');
    if(input.length==2){
      searchQuery = input[0];
      tagList = input[1].split(',');
      tagList = tagList.map((tag)=>tag.trim());
    }
    
    let url = this.router.url;
    url = url.substring(url.indexOf('/'),url.indexOf('?'))
    this.router.navigate([],{queryParams: {search: searchQuery.trim(),tag:tagList }});
  }

  syncNotes(){
    this.toaster.info("Syncing notes...");
  }
}
