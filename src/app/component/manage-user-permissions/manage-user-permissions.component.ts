import { Component, Input } from '@angular/core';
import { ConnectionService } from '../../service/connection/connection.service';
import { User } from '../../models/User';
import { CommonModule } from '@angular/common';
import { BeanItemComponent } from '../bean-item/bean-item.component';
import { MatIconModule } from '@angular/material/icon';
import { UserService } from '../../service/user/user.service';
import { TagListComponent } from '../tag-list/tag-list.component';
import { Tag } from '../../models/tag';

@Component({
  selector: 'app-manage-user-permissions',
  imports: [CommonModule, BeanItemComponent, MatIconModule, TagListComponent],
templateUrl: './manage-user-permissions.component.html',
})
export class ManageUserPermissionsComponent {

  @Input('managePermissions') CAN_MANAGE_PARTICIPANT_PERMISSONS: boolean = false;
  @Input('addParticipants') CAN_ADD_PARTICIPANT: boolean = false;
  @Input('deleteParticipants') CAN_DELETE_PARTICIAPANT: boolean = false;
  @Input('minimized') minimized: boolean = false;

  userList: User[] = [];
  
  permissionChangeReq:any[] = [];

  isUgColab: boolean = false;

  constructor(private connectionService: ConnectionService, private userService: UserService){
    this.userService.loggedInUser$.subscribe((loggedInUser)=>{

      let payload = this.userService.getPayloadFromAccessToken();
      if(payload){
        this.isUgColab = payload['user_group_colaboration'];
      }
      
      this.getUsersInThisUG().then(resp=>{
        console.log(resp.data.body);
        
      this.userList = resp.data.body;
      this.userList?.forEach((user)=>{
        this.getProfileUrlForUser(user.profilePicture).then((url)=>{
          user.profilePicture = url;
        });
      }); 
    });
  });
  }

  getUsersInThisUG(){
    return this.connectionService.axios.get('/user/participant/users/all');
  }
  
  async getProfileUrlForUser(profilePicUrl: string | undefined){
    if(profilePicUrl){
      if(profilePicUrl.startsWith('/item/doc/')){
        return await this.connectionService.getUrlWithToken(profilePicUrl);
      }else{
        return profilePicUrl;
      }
    }else{
      return '';
    }
  }

  updatePermissionsForUser(perm: Tag[], user: User){
    let existing = user.permissions;
    let forUpdate = perm.map(p=>p.name);

    const forUpdateSet = new Set(forUpdate);
    const existingSet = new Set(existing);
    const removed = existing?.filter(e => !forUpdateSet.has(e)) || [];
    const added = forUpdate.filter(u => !existingSet.has(u));
    
    this.permissionChangeReq.push(...this.getPermissionUpdateReq(user.email, removed, added));
  }

  postChangeRequest(){
    if(this.permissionChangeReq.length>0)
    this.connectionService.axios.post('/user/update/participant/permissions',this.permissionChangeReq);    
  }

  private getPermissionUpdateReq(userEmail: string, removed: string[], added: string[]){
    let req: any[] = [];
    removed.forEach(p=>{
      req.push({
        userEmail,
        userPermission: p,
        enabled: false,
      });
    });
    added.forEach(p=>{
      req.push({
        userEmail,
        userPermission: p,
        enabled: true,
      });
    });
    return req;
  }
}
