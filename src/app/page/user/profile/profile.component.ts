import { Component, OnInit } from '@angular/core';
import { User } from '../../../models/User';
import { UserService } from '../../../service/user/user.service';
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

  form: FormGroup;

  constructor(private userService: UserService){
    
    let formBuilder = new FormBuilder();

    const formControls: { [key: string]: FormControl } = {};
    formControls['alias'] = formBuilder.control('', Validators.required);

    let passwordRegex = "^(?=.*[A-Za-z])(?=.*\\d)(?=.*[@$!%*#?&])[A-Za-z\\d@$!%*#?&]{5,}$";
    formControls['newPassword'] = formBuilder.control('', Validators.pattern(passwordRegex));

    this.form = formBuilder.group(formControls);
    
    userService.loggedInUser$.subscribe((user)=>{
      console.log(user);
      
      this.user = user;
      if(user.profilePicture){
        this.profilePicDataUrl = user.profilePicture;
      }
      this.form.setValue({'alias':user.alias, 'newPassword':'*****'});
    });
  }

  ngOnInit():void{
    
  }

  saveProfilePic(event:Event){

  }
}
