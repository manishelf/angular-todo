import { Component, OnDestroy, OnInit, HostListener } from '@angular/core';
import { TodoItem } from './../../models/todo-item';
import { TodoServiceService } from '../../service/todo/todo-service.service';
import { CommonModule } from '@angular/common';
import { TodoItemComponent } from './../../component/todo-item/todo-item.component';
import {
  ActivatedRoute,
  NavigationExtras,
  Params,
  Router,
  RouterLink,
  RouterLinkActive,
} from '@angular/router';
import { last, Observable, of, Subscription, switchMap } from 'rxjs';
import { EditorComponent } from '../editor/editor.component';

@Component({
  selector: 'app-home',
  imports: [CommonModule, TodoItemComponent, RouterLink, RouterLinkActive, EditorComponent],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css',
})
export class HomeComponent implements OnInit, OnDestroy {
  itemList$: Observable<TodoItem[]> = of([])
  fromBin: boolean = false;

  private queryParamSubscription!: Subscription;

  constructor(
    private todoService: TodoServiceService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    let url = this.router.url;
    
    if (url === '/bin/clear') {
      todoService.fromBin = true;
      todoService.deleteAll();
      this.router.navigate(['/bin']);
    } else if (url === '/home/clear') {
      todoService.fromBin = false;
      todoService.deleteAll();
      this.router.navigate(['/home']);
    } else if (url === '/demo') {
      let confirm = prompt('Download sample todo items? [Y|N]');
      if (confirm === 'Y') {
        fetch('/todo-demo-items.json')
          .then((response) => {
            if (!response.ok) {
              console.error('failed to load the demo items', response);
            }
            return response.json();
          })
          .then((data) => {
            this.todoService.addMany(data.items);
            this.router.navigate(['/home']);
          });
      }
    }
    this.fromBin = url.substring(0, 4) === '/bin';
    this.todoService.fromBin = this.fromBin;
  }

  ngOnInit(): void {
    this.todoService.initializeItems();
    
    this.queryParamSubscription = this.route.queryParams.subscribe(
      (params: Params) => {
        let order = params['ord'] ? params['ord'] : [];
        let exact = params['abs'] ? params['abs'] === 'true' : false;
        let searchQuery = params['q'] ? params['q'] : '';
        let tags = params['tag'] ? params['tag'] : [];
        let searchTerms = params['has'] ? params['has'] : [];
        let limit = params['lim'] ? params['lim'] : null;

        if (limit || order.length != 0 || searchQuery !== '' || tags.length > 0 || searchTerms.length > 0) {
          this.todoService
            .searchTodos(searchQuery, tags, searchTerms, exact)
            .pipe(
              switchMap((itemList) => {
                return this.todoService.sortTodoItems(order, itemList, limit);
              })
            );
        } else {
          this.router.navigate([]);
          this.itemList$ = this.todoService.todoItems$.pipe(
            switchMap((itemList) => {
              return this.todoService.sortTodoItems(order, itemList)
            })
          );
        }
      }
    );
  }

   onClickTodoItem(event: Event, item: TodoItem) {
    let targetItem = event.target as HTMLElement;
   
    let sel = window.getSelection();
    if (targetItem.classList.contains('option') || (sel && sel.toString().length>0)) {
      return;
    }

    this.route.queryParams.subscribe((query, todoItem = this) => {
      if (item) {
        this.router.navigate(['/edit'], {
          state: {
            item,
            query,
          },
        });
      }
    });
  }

  // my impl unreliable and maybe incorrect.
  private verticalFocusTravel(targetItem: HTMLElement, down: boolean = false) {
    let parentWidth =
      targetItem.parentElement?.getBoundingClientRect().width || 0;
    let parentLeft =
      targetItem.parentElement?.getBoundingClientRect().left || 0;
    let targetLeft = targetItem.getBoundingClientRect().left;
    let targetRight = targetItem.getBoundingClientRect().right;

    let count = 0;
    let width = down ? targetLeft : targetRight;
    let curr = targetItem;
    let nextEle = targetItem;

    while (count < 10000) {
      // while true could and did go to infinity
      let currWidth = curr?.getBoundingClientRect().width;
      width += down ? currWidth : -1 * currWidth;
      curr = (
        down ? curr?.nextElementSibling : curr?.previousElementSibling
      ) as HTMLElement;
      count++;
      if (curr === null) {
        if (down) {
          let first = targetItem.parentElement
            ?.firstElementChild as HTMLElement;
          first?.focus();
          first?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        } else {
          let last = targetItem.parentElement?.lastElementChild as HTMLElement;
          last?.focus();
          last?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }

      nextEle = (
        down ? nextEle?.nextElementSibling : nextEle?.previousElementSibling
      ) as HTMLElement;

      let nextWidth = nextEle?.getBoundingClientRect().width;
      let nextLeft = nextEle?.getBoundingClientRect().left;
      let nextRight = nextEle?.getBoundingClientRect().right;

      if (
        down &&
        width >= parentWidth &&
        (nextLeft >= targetLeft * 0.9 || nextRight >= targetRight * 0.9)
      )
        break;
      
      // where does this 100 come from? :' and why is it needed for this to work correctly? magic number?
      if (
        !down &&
        width <= parentLeft + 100 &&      
        (nextLeft <= targetLeft * 1.1 || nextRight <= targetRight * 1.1)
      )
        break;
    }

    nextEle?.focus();
    nextEle?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  onKeyDownTodoItem(event: KeyboardEvent, item: TodoItem) {
    let leftDirKey = ['ArrowLeft', 'a', 'h'];
    let rightDirKey = ['ArrowRight', 'd', 'l'];
    let upDirKey = ['ArrowUp', 'w', 'j'];
    let downDirKey = ['ArrowDown', 's', 'k'];

    let targetItem = event.target as HTMLElement;

    if (leftDirKey.includes(event.key)) {
      if (targetItem.previousElementSibling) {
        (targetItem.previousElementSibling as HTMLElement).focus();
      } else {
        (targetItem.parentElement?.lastElementChild as HTMLElement)?.focus();
      }
    } else if (rightDirKey.includes(event.key)) {
      if (targetItem.nextElementSibling) {
        (targetItem.nextElementSibling as HTMLElement).focus();
      } else {
        (targetItem.parentElement?.firstElementChild as HTMLElement)?.focus();
      }
    } else if (upDirKey.includes(event.key)) {
      this.verticalFocusTravel(targetItem, false);
    } else if (downDirKey.includes(event.key)) {
      this.verticalFocusTravel(targetItem, true);
    } else if (event.key === 'Enter') {
      this.onClickTodoItem(event, item);
    }
  }
  ngOnDestroy(): void {
    if (this.queryParamSubscription) {
      this.queryParamSubscription.unsubscribe();
    }
  }

  //called on each view check
  //to optimize rendering
  trackById(i: number, item: any): number{
    return item.id;
  }
}
