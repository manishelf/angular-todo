import { Component, OnInit } from '@angular/core';
import { User } from '../../../models/User';
import { localUser, UserService } from '../../../service/user/user.service';
import { MatIcon } from '@angular/material/icon';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { BeanItemComponent } from '../../../component/bean-item/bean-item.component';

@Component({
  selector: 'app-profile',
  imports: [MatIcon,CommonModule, ReactiveFormsModule, BeanItemComponent],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.css'
})
export class ProfileComponent implements OnInit{

  user!: User;
  profilePicDataUrl: string = '';
  groupBannerPicDataUrl: string = ''

  form: FormGroup;

  isOwner: boolean = false;

  constructor(private userService: UserService){
    
    let formBuilder = new FormBuilder();

    const formControls: { [key: string]: FormControl } = {};
    formControls['alias'] = formBuilder.control('', Validators.required);

    let passwordRegex = "^(?=.*[A-Za-z])(?=.*\\d)(?=.*[@$!%*#?&])[A-Za-z\\d@$!%*#?&]{5,}$";
    formControls['newPassword'] = formBuilder.control('', Validators.pattern(passwordRegex));
    formControls['confirmPassword'] = formBuilder.control('', Validators.pattern(passwordRegex));
    formControls['existingPassword'] = formBuilder.control('', Validators.pattern(passwordRegex));

    this.form = formBuilder.group(formControls);
    
    userService.loggedInUser$.subscribe((user)=>{
      this.user = user;
      if(user.profilePicture){
        this.profilePicDataUrl = user.profilePicture;
      }else{
        this.profilePicDataUrl = '';
      }
      let payload = this.userService.getPayloadFromAccessToken();
      if(payload?.permissions.includes('UG_OWNER')){
        this.isOwner = true;
      }else{
        this.isOwner = false;
      }
    });
  }

  ngOnInit():void{
  }

  savePic(event:Event, type: string){
    let ele = event.target as any;
    let file = ele.files[0];
    if(file){
      let reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (e)=>{
        let url = e.target?.result;
        let dataUrl = url?.toString() || '';
        if(type == 'profile'){
          this.profilePicDataUrl = dataUrl;
        }else if(type == 'groupBanner'){
          this.groupBannerPicDataUrl = dataUrl;
        }
      }
    }
  }

  updateUserDetails(){

  }
}
