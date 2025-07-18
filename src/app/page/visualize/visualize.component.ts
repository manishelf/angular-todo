import { Component, OnInit } from '@angular/core';
import { FilterOrReduceService } from '../../service/filterOrReduce/filter-or-reduce.service';
import { SortService } from '../../service/sort/sort.service';
import { TodoServiceService } from '../../service/todo-service.service';
import { ActivatedRoute, Router } from '@angular/router';
import { TodoItem } from '../../models/todo-item';
import { CommonModule } from '@angular/common';
import { BehaviorSubject } from 'rxjs';
import { MatIcon } from '@angular/material/icon';

@Component({
  selector: 'app-visualize',
  imports: [CommonModule, MatIcon],
  templateUrl: './visualize.component.html',
  styleUrl: './visualize.component.css',
})
export class VisualizeComponent implements OnInit {
  itemList: TodoItem[] = [];
  reducedItemsFlat: [number, any][] = [];
  fields: string[] = [
    'id',
    'subject',
    'completionStatus',
    'setForReminder',
    'creationTimestamp',
    'updationTimestamp',
  ];

  selectedChart: string = 'table_chart';

  chartTypes = [
    'table_chart',
    'functions',
    'pie_chart',
    'show_chart',
    'bar_chart',
  ];

  sortedFields$ = new BehaviorSubject<string[]>([]);

  constructor(
    private filterOrReduceService: FilterOrReduceService,
    private sortService: SortService,
    private todoService: TodoServiceService,
    private router: Router,
    private activatedRoute: ActivatedRoute
  ) {
    this.sortedFields$.subscribe((sortOnfields) => {
      this.sortService
        .sortItems(sortOnfields, this.itemList)
        .subscribe((items) => {
          this.itemList = items;
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
      } else if (order.length > 1) {
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
                  this.itemList = items;
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
                this.itemList = items;
                this.populateItems(items);
              });
          },
          (error) => {
            console.error('error fetching tasks ', error);
          }
        );
      }
    });
  }
  populateItems(items: TodoItem[]) {
    this.itemList = items;
    this.reducedItemsFlat = this.filterOrReduceService.getReducedItems(
      this.fields,
      items
    );
  }
  toggleSortIndividual(event: Event, field: string) {
    let sortFields = this.sortedFields$.value;
    let set = new Set(sortFields);
    set.add(field);
    this.sortedFields$.next(Array.from(set));
  }

  onItemGoToClicked(event: Event, index: number) {
    this.activatedRoute.queryParams.subscribe((params) => {
      this.todoService.getItemById(index).subscribe((item) => {
        this.router.navigate(['/edit'], {
          state: { item, query: params },
        });
      });
    });
  }
}
