import { Component, OnInit, signal } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { Router } from '@angular/router';
import { BeanItemComponent } from './../bean-item/bean-item.component';
import { SocialUser, GoogleSigninButtonModule,SocialLoginModule, GoogleLoginProvider, SocialAuthService } from "@abacritt/angularx-social-login";
import { CommonModule } from '@angular/common';
import { ToastService } from 'angular-toastify';
import { TodoServiceService } from '../../service/todo-service.service';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-navbar',
  imports: [MatIconModule, BeanItemComponent, SocialLoginModule, GoogleSigninButtonModule, CommonModule],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.css'
})
export class NavbarComponent implements OnInit{
  accessToken:string | null = null;
  user: SocialUser = new SocialUser();
  loggedIn: boolean = true;

  constructor(private router: Router,  private authService: SocialAuthService, private toaster: ToastService, private todoService: TodoServiceService) { }

  ngOnInit() {
    // this.authService.authState.subscribe((user) => {
    //   this.user = user;
    //   this.loggedIn = (user != null);
      // this.authService.getAccessToken(GoogleLoginProvider.PROVIDER_ID).then((result)=>{
      //   console.log(result);
      //   console.log('result');
          
      //   fetch('https://www.googleapis.com/drive/v3/files', {
      //     headers: {
      //       Authorization: `Bearer ${result}`
      //     }
      //   })
      //   .then(response => response.json())
      //   .then(data => console.log(data));    
      // })
    // });
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

  syncNotes(): void{
    this.toaster.info("Syncing notes...");   
    this.todoService.fromBin = false; 
    this.todoService.getAll().subscribe((itemList)=>{
      this.todoService.serializeManyToJson(itemList).subscribe((json)=>{
        let blob = new Blob([json], { type: 'application/json' });
        let url = URL.createObjectURL(blob);
        let a = document.createElement('a');
        a.href = url;
        a.download = `todo-${Date.now()}.json`;
        a.click();
        URL.revokeObjectURL(url);
      });
    });
  }
  uploadNotes(): void{
    this.todoService.fromBin = false; 
    let inp = document.createElement('input');
    inp.type = 'file';
    inp.accept = '.json';
    inp.onchange = (e) => {
      let file = (e.target as HTMLInputElement).files![0];
      let reader = new FileReader();
      reader.readAsText(file);
      reader.onload = (event) => {
        let json = event.target!.result;
        if(json)
        this.todoService.deserializeManyFromJson(json.toString()).subscribe((itemList)=>{
          this.todoService.addMany(itemList);
          this.toaster.success("Notes loaded successfully");
        });
      }
    };
    inp.click();
  }
}
