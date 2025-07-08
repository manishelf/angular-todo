import { Component, OnDestroy, OnInit } from '@angular/core';
import { TodoItem } from './../../models/todo-item';
import { TodoServiceService } from './../../service/todo-service.service';
import { CommonModule } from '@angular/common';
import { TodoItemComponent } from './../../component/todo-item/todo-item.component';
import {
  ActivatedRoute,
  Params,
  Router,
  RouterLink,
  RouterLinkActive,
} from '@angular/router';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-home',
  imports: [CommonModule, TodoItemComponent, RouterLink, RouterLinkActive],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css',
})
export class HomeComponent implements OnInit, OnDestroy {
  itemList: TodoItem[] = [];
  fromBin: boolean = false;
  fromSearch: boolean = false;
  private todoItemsSubscription: Subscription | undefined;
  private queryParamsSubscription: Subscription | undefined;

  constructor(
    private todoService: TodoServiceService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    let url = this.router.url;
    if (url === '/bin/clear') {
      todoService.fromBin = true;
      todoService.deleteAll();
    } else if (url === '/home/clear') {
      todoService.fromBin = false;
      todoService.deleteAll();
    } else if(url === '/demo'){
      let confirm = prompt('Download sample todo items? [Y|N]');
      if(confirm==='Y'){
         fetch('/todo-demo-items.json') 
          .then(response => {
              if (!response.ok) {
                console.error('failed to load the demo items', response);
              }
              return response.json();
            })
            .then(data => {
              this.todoService.addMany(data.items);
            });
      }
    }
    this.fromBin = url.substring(0, 5) !== '/home';
    this.todoService.fromBin = this.fromBin;
  }

  ngOnInit(): void {
    this.todoService.initializeItems();
    this.queryParamsSubscription = this.route.queryParams.subscribe(
      (params: Params) => {
        let exact = params['exact'] ? params['exact'] === 'true' : false;
        let searchQuery = params['search'] ? params['search'] : '';
        let tags = params['tag'] ? params['tag'] : [];
        let searchTerms = params['has'] ? params['has'] : [];
        if (searchQuery !== '' || tags.length > 0 || searchTerms.length > 0) {
          this.todoService
            .searchTodos(searchQuery, tags, searchTerms, exact)
            .subscribe(
              (itemList) => {
                this.fromSearch = true;
                this.itemList = itemList.sort((x, y) => {
                  if (x.setForReminder || y.completionStatus) return -1;
                  if (y.setForReminder || x.completionStatus) return 1;
                  return 0;
                });
              },
              (error) => {
                console.error('error fetching tasks ', error);
              }
            );
        } else {
          this.router.navigate(['/home']); // no re-render here. only url is changed. nothing else happens
          this.fromSearch=false;
          this.todoItemsSubscription = this.todoService.todoItems$.subscribe(
            (itemList) => {
              this.itemList = itemList.sort((x, y) => {
                if (x.setForReminder || y.completionStatus) return -1;
                if (y.setForReminder || x.completionStatus) return 1;
                return 0;
              });
            },
            (error) => {
              console.error('error fetching tasks ', error);
            }
          );
        }
      }
    );
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
