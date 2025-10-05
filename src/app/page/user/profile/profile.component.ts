import { Component, OnInit, QueryList, ViewChild, ViewChildren } from '@angular/core';
import { User } from '../../../models/User';
import { localUser, UserService } from '../../../service/user/user.service';
import { MatIcon } from '@angular/material/icon';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { BeanItemComponent } from '../../../component/bean-item/bean-item.component';
import { ManageUserPermissionsComponent } from '../../../component/manage-user-permissions/manage-user-permissions.component';
import { ConnectionService } from '../../../service/connection/connection.service';

@Component({
  selector: 'app-profile',
  imports: [ManageUserPermissionsComponent, MatIcon,CommonModule, ReactiveFormsModule, BeanItemComponent],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.css'
})
export class ProfileComponent implements OnInit{

  user!: User;
  userPermissions: string[] = [];
  profilePicDataUrl: string = '';
  form: FormGroup;

  @ViewChildren(ManageUserPermissionsComponent) userPermissionComp!: QueryList<ManageUserPermissionsComponent>;

  CAN_MANAGE_PARTICIPANT_PERMISSIONS: boolean = false;
  CAN_ENABLE_DISABLE_UG: boolean = false;
  CAN_ADD_PARTICIPANT: boolean = false;
  CAN_REMOVE_PARTICIPANT: boolean = false;
  CAN_CHANGE_UG_CONFIG: boolean = false;

  constructor(private userService: UserService, private connectionService: ConnectionService){
    
    let formBuilder = new FormBuilder();

    const formControls: { [key: string]: FormControl } = {};
    formControls['alias'] = formBuilder.control('', Validators.required);

    let passwordRegex = "^(?=.*[A-Za-z])(?=.*\\d)(?=.*[@$!%*#?&])[A-Za-z\\d@$!%*#?&]{5,}$";
    formControls['newPassword'] = formBuilder.control('', Validators.pattern(passwordRegex));
    formControls['ugDescription'] = formBuilder.control('');
    formControls['ugOpen'] = formBuilder.control(false);
    formControls['ugColab'] = formBuilder.control(false);
    
    this.form = formBuilder.group(formControls);
    
    userService.loggedInUser$.subscribe((user)=>{
      this.user = user;
      if(user.profilePicture){
        if(user.profilePicture.startsWith('/item/doc/')){
          this.connectionService.getUrlWithToken(user.profilePicture).then(url=>{this.profilePicDataUrl = url});
        }else{
          this.profilePicDataUrl = user.profilePicture;
        }
      }else{
        this.profilePicDataUrl = '';
      }
      
      let payload = this.userService.getPayloadFromAccessToken();
      this.userPermissions = payload.permissions.sort();
      let isUgOpen = payload['user_group_open'];
      let isUgColab = payload['user_group_colaboration'];

      this.form.setValue({alias: user.alias, 
        newPassword: '', ugDescription: '',
         ugOpen: isUgOpen, ugColab: isUgColab});
      

      if(this.userPermissions.includes('MANAGE_PARTICIPANT_PERMISSIONS'))
        this.CAN_MANAGE_PARTICIPANT_PERMISSIONS = true;
      if(this.userPermissions.includes('ENABLE_DISABLE_UG'))
        this.CAN_ENABLE_DISABLE_UG = true;
      if(this.userPermissions.includes('ADD_PARTICIPANT'))
        this.CAN_ADD_PARTICIPANT = true;
      if(this.userPermissions.includes('REMOVE_PARTICIPANT'))
        this.CAN_REMOVE_PARTICIPANT = true;
      if(this.userPermissions.includes('CHANGE_UG_CONFIG'))
        this.CAN_CHANGE_UG_CONFIG = true;
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
        }
      }
    }
  }

  updateUserDetails(){    
    this.connectionService.axios.post('/user/update/usergroup/details',{
      userGroupDescription: '',
      open: this.form.value.ugOpen,
      colaboration: this.form.value.ugColab
    });
    this.userPermissionComp.first.postChangeRequest();
  }
}
