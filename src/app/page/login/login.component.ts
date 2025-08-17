import { Component, ElementRef, ViewChild } from '@angular/core';
import { UserService } from './../../service/user/user.service';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-login',
  imports: [CommonModule, RouterLink, MatIconModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent {

  asLogin:boolean = true;

  @ViewChild('emailInp') emailInpEle!: ElementRef;

  constructor(private userService: UserService, private activatedRoute: ActivatedRoute){
    activatedRoute.url.subscribe(url=>{
      if(url[0].path === 'login'){
        this.asLogin = true;
      }else{
        this.asLogin = false;
      }
    });
    setTimeout(()=>{
      this.emailInpEle.nativeElement.focus();
    },200);
  }
}
