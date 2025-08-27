import { Component, ElementRef, ViewChild } from '@angular/core';
import { UserService } from './../../service/user/user.service';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { FormBuilder, FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { ConnectionService } from '../../service/connection/connection.service';
import { User } from '../../models/User';
import { ToastService } from 'angular-toastify';

@Component({
  selector: 'app-login',
  imports: [CommonModule, RouterLink, MatIconModule, FormsModule, ReactiveFormsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent {

  asLogin:boolean = true;

  @ViewChild('emailInp') emailInpEle!: ElementRef;
  @ViewChild('profilePicEle') profilePicEle!: ElementRef;

  userGroupList: string[] = ['qtodo'];

  profilePicDataUrl: string | null = null;

  formGroup: FormGroup;

  firstName: string = "";

  lastName: string = "";

  rememberMe: boolean = true;


  constructor(private userService: UserService,
     private activatedRoute: ActivatedRoute, 
     private router: Router,
     private connectionService: ConnectionService,
     private formBuilder: FormBuilder,
     private toaster: ToastService
    ){
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
    connectionService.axios.get('/user/usergroups').then((resp)=>{
      this.userGroupList.push(...resp.data?.body);
    });
    const formControls: { [key: string]: FormControl} = {
      "email":this.formBuilder.control(
        "",Validators.email
      ),
      "password": this.formBuilder.control(
        "",Validators.pattern("^(?=.*[A-Za-z])(?=.*\\d)(?=.*[@$!%*#?&])[A-Za-z\\d@$!%*#?&]{5,}$")
      ),
      "usergroup": this.formBuilder.control(
        "qtodo"
      ),
    };
    this.formGroup = this.formBuilder.group(formControls);

    this.connectionService.connectToBackend().catch((e)=>{
      this.router.navigate(['/home']);
    });
  }

  async onSubmitClick(){
      if(!this.formGroup.valid){
        let errors = new Map();
        let control = this.formGroup?.get('email');
        errors.set('email', control?.errors);
        control = this.formGroup.get('password');
        errors.set('password', control?.errors);
        control = this.formGroup.get('rememberMe');
        errors.set('rememberMe', control?.errors);
        errors.forEach((val,key)=>{
          if(val)
          this.toaster.error(key+'->'+JSON.stringify(val));
        })
        return;
      }
    let data = this.formGroup.value;
    let user: User = {
      firstName: this.firstName,
      lastName: this.lastName,
      email: data['email'],
      password: data['password'],
      userGroup: data['usergroup'],
      profilePicture: ''
    }


    if(this.profilePicDataUrl){
      const base64String = btoa(this.profilePicDataUrl);
      user.profilePicture = base64String;
    }

    user.email = (user.email as string).toLowerCase();

    let action = this.asLogin ? '/login':'/signup';

    this.connectionService.axios.post('/user'+action,
      user
    ).then((resp)=>{
      if(resp.status != 200) return;
      user.token = resp.data?.accessToken;
      user.profilePicture = this.profilePicDataUrl || '';
      if(this.asLogin){
        user.token = resp.data?.userDetails.accessToken;
        user.firstName = resp.data?.userDetails.firstName; 
        user.lastName = resp.data?.userDetails.lastName;
        if(resp.data?.userDetails.profilePicture)
        user.profilePicture = atob(resp.data?.userDetails.profilePicture);
      }
      user.password = "";
      let recentLogins = localStorage["recentLogins"];
      if(!recentLogins || recentLogins == 'null'){
        recentLogins = '{"qtodo/local":{"email":"qtodo","userGroup":"local"}}';
      }
        
      recentLogins = JSON.parse(recentLogins);
      if(this.rememberMe){
        if(user != null && user.email && user.userGroup){
          recentLogins[user.email+'/'+user.userGroup]=user;
        } 
      }else{
        recentLogins['anon/anon']={email:'anon', userGroup:'anon'}
      }
      localStorage["recentLogins"] = JSON.stringify(recentLogins);       

      this.userService.loggedInUser.next(user);
      this.router.navigate(['/home']);
    }).catch((e)=>{
      console.error(e);
    });
  }

  addUserGroup(){
    let usergroup = (prompt('Enter your group title') || '');
    this.userGroupList.push(usergroup);
    let val = this.formGroup.value;
    val['usergroup']= usergroup;
    this.formGroup.setValue(val);
  }

  selectImageFile(){
    this.profilePicEle.nativeElement.click();
  }

  saveProfilePic(event: Event){
    let ele = event.target as any;
    let file = ele.files[0];
    if(file){
      let reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (e)=>{
        let url = e.target?.result;
        this.profilePicDataUrl = url?.toString() || null;
      }
    }
  }
}
