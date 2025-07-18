import { Component, OnInit } from '@angular/core';
import { FilterOrReduceService } from '../../service/filterOrReduce/filter-or-reduce.service';
import { SortService } from '../../service/sort/sort.service';
import { TodoServiceService } from '../../service/todo-service.service';
import { ActivatedRoute, Router } from '@angular/router';
import { TodoItem } from '../../models/todo-item';
import { CommonModule } from '@angular/common';
import { BehaviorSubject } from 'rxjs';

@Component({
  selector: 'app-visualize',
  imports: [CommonModule],
  templateUrl: './visualize.component.html',
  styleUrl: './visualize.component.css',
})
export class VisualizeComponent implements OnInit {
  itemList: TodoItem[] = [];
  reducedItemFlat: [number, any][] = [];
  fields: string[] = [
    'id',
    'subject',
    'completionStatus',
    'setForReminder',
    'creationTimestamp',
    'updationTimestamp',
    'description',
  ];

  sortedFields$ = new BehaviorSubject<string[]>([]);

  constructor(
    private filterOrReduceService: FilterOrReduceService,
    private sortService: SortService,
    private todoService: TodoServiceService,
    private router: Router,
    private activatedRoute: ActivatedRoute
  ) {
    this.sortedFields$.subscribe(sortOnfields=>{
      this.sortService.sortItems(sortOnfields, this.itemList).subscribe((items) => {
        this.populateItems(items);
      });
    });
  }

  ngOnInit(): void {
    this.activatedRoute.queryParams.subscribe((params) => {
      let order = params['ord'] ? params['ord'] : [];
      let exact = params['abs'] ? params['abs'] === 'true' : false;
      let searchQuery = params['q'] ? params['q'] : '';
      let tags = params['tag'] ? params['tag'] : [];
      let searchTerms = params['has'] ? params['has'] : [];

      if (order[1] === 'latest' || order[1] === 'oldest') {
        this.fields = ['id'];
        this.fields.push(...order.splice(2));
      } else if(order.length>1) {
        this.fields = ['id'];
        this.fields.push(...order.splice(1));
      }
      if (
        order.length != 0 ||
        searchQuery !== '' ||
        tags.length > 0 ||
        searchTerms.length > 0
      ) {
        this.todoService.initializeItems();
        this.todoService
          .searchTodos(searchQuery, tags, searchTerms, exact)
          .subscribe(
            (itemList) => {
              this.todoService
                .sortTodoItems(order, itemList)
                .subscribe((items) => {
                  this.populateItems(items);
                });
            },
            (error) => {
              console.error('error fetching tasks ', error);
            }
          );
      } else {
        this.router.navigate([]);
        this.todoService.initializeItems();
        this.todoService.todoItems$.subscribe(
          (itemList) => {
            this.todoService
              .sortTodoItems(order, itemList)
              .subscribe((items) => {
                this.populateItems(items);
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
  populateItems(items: TodoItem[]) {
    this.itemList = items;
    this.reducedItemFlat = this.filterOrReduceService.getReducedItems(
      this.fields,
      items
    );
  }
  toggleSortIndividual(event: Event, field: string) {
    this.sortedFields$.next([...this.sortedFields$.value, field]);
  }

  onItemIdClicked(event: Event, index: number) {
    this.todoService.getItemById(index).subscribe((item) => {
      this.activatedRoute.queryParams.subscribe((params) => {
        this.router.navigate(['/edit'], {
          state: { item: this.itemList[index], query: params },
        });
      });
    });
  }
}
