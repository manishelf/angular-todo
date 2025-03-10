import { Component, OnDestroy, OnInit } from '@angular/core';
import { TodoItem } from './../../models/todo-item';
import { TodoServiceService } from './../../service/todo-service.service';
import { CommonModule } from '@angular/common';
import { TodoItemComponent } from './../../component/todo-item/todo-item.component';
import { ActivatedRoute, Params, Router, RouterLink, RouterLinkActive } from '@angular/router';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-home',
  imports: [CommonModule, TodoItemComponent, RouterLink, RouterLinkActive],
templateUrl: './home.component.html',
  styleUrl: './home.component.css'
})
export class HomeComponent implements OnInit, OnDestroy{
  itemList: TodoItem[] = [];
  fromBin: boolean;
  private todoItemsSubscription: Subscription | undefined;
  private queryParamsSubscription: Subscription | undefined;
  
  constructor(
    private todoService: TodoServiceService, 
    private router: Router, 
    private route: ActivatedRoute){
    if(this.router.url === '/bin/clear') todoService.clearBin();
    let url = this.router.url;    
    this.fromBin = (url.substring(0,5) !== '/home');    
   }

  ngOnInit(): void {    
    this.todoService.initializeItems(this.fromBin);
    this.todoItemsSubscription = this.todoService.todoItems$.subscribe(
      (itemList)=>{
        this.itemList = itemList.sort((x,y)=>{
          if(x.setForReminder||y.completionStatus) return -1;
          if(y.setForReminder||x.completionStatus) return 1;
          return 0;
        }); 
               
      },
      (error)=>{
        console.error('error fetching tasks ',error);
      }
    );

      this.queryParamsSubscription = this.route.queryParams.subscribe((params: Params) => {
      let searchQuery = params['search'];
      let tags = params['tag'];
            
      if(searchQuery || tags)
      this.todoService.searchTodos(searchQuery?searchQuery:'', tags?tags:[], this.fromBin).subscribe(
        (itemList)=>{
              this.itemList = itemList.sort((x,y)=>{
                if(x.setForReminder||y.completionStatus) return -1;
                if(y.setForReminder||x.completionStatus) return 1;
                return 0;
              });                
            },
            (error)=>{
              console.error('error fetching tasks ',error);
            }
      );
    });
  }
  ngOnDestroy(): void {
    if (this.todoItemsSubscription) {
      this.todoItemsSubscription.unsubscribe();
    }
    if (this.queryParamsSubscription) {
      this.queryParamsSubscription.unsubscribe();
    }
  }
}
