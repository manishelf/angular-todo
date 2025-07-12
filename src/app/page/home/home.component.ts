import { Component, OnDestroy, OnInit } from '@angular/core';
import { TodoItem } from './../../models/todo-item';
import { TodoServiceService } from './../../service/todo-service.service';
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
import { last, Subscription } from 'rxjs';

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
    this.queryParamsSubscription = this.route.queryParams.subscribe(
      (params: Params) => {
        let order = params['order'] ? params['order'] : [];
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
                this.todoService.sortTodoItems(order, itemList).subscribe(items=>this.itemList = items);
              },
              (error) => {
                console.error('error fetching tasks ', error);
              }
            );
        } else {
          this.router.navigate([]);
          this.fromSearch = false;
          this.todoItemsSubscription = this.todoService.todoItems$.subscribe(
            (itemList) => {
              this.todoService.sortTodoItems(order, itemList).subscribe(items=>this.itemList = items);
            },
            (error) => {
              console.error('error fetching tasks ', error);
            }
          );
        }
      }
    );
  }

   onClickTodoItem(event: Event, id: number) {
    let targetItem = event.target as HTMLElement;

    if (targetItem.classList.contains('option')) {
      return;
    }

    this.route.queryParams.subscribe((query, todoItem = this) => {
      let item = this.itemList[id];
      if (item) {
        this.router.navigate(['/edit'], {
          state: {
            item: item,
            query: query,
          },
        });
      }
    });
  }

  private findNextItemInVerticalDirection(
    targetItem: HTMLElement,
    goingDown: boolean
  ): HTMLElement | null {
    const parent = targetItem.parentElement;
    if (!parent) return null;

    const allChildren = Array.from(parent.children) as HTMLElement[];
    if (allChildren.length === 0) return null;

    const targetRect = targetItem.getBoundingClientRect();
    const parentRect = parent.getBoundingClientRect();

    let candidates: HTMLElement[] = [];

    if (goingDown) {
      // Find elements that are below the current element
      for (const child of allChildren) {
        const childRect = child.getBoundingClientRect();
        // Check if the child is below the current item's bottom edge
        if (childRect.top > targetRect.bottom) {
          candidates.push(child);
        }
      }
      // Sort candidates by their top position (to process row by row)
      candidates.sort(
        (a, b) => a.getBoundingClientRect().top - b.getBoundingClientRect().top
      );

      // From the candidates in the next row(s), find the one horizontally closest
      let nextRowCandidates: HTMLElement[] = [];
      if (candidates.length > 0) {
        const firstCandidateTop = candidates[0].getBoundingClientRect().top;
        for (const candidate of candidates) {
          if (candidate.getBoundingClientRect().top === firstCandidateTop) {
            nextRowCandidates.push(candidate);
          } else {
            // We've moved to the next potential row
            break;
          }
        }
      }

      if (nextRowCandidates.length > 0) {
        // Find the closest horizontal match in the next row
        let bestMatch: HTMLElement | null = null;
        let minHorizontalDistance = Infinity;

        for (const candidate of nextRowCandidates) {
          const candidateRect = candidate.getBoundingClientRect();
          // Calculate overlap or distance based on horizontal position
          // A common strategy is to find the element whose center is closest to target's center
          const targetCenterX = targetRect.left + targetRect.width / 2;
          const candidateCenterX = candidateRect.left + candidateRect.width / 2;
          const distance = Math.abs(targetCenterX - candidateCenterX);

          if (distance < minHorizontalDistance) {
            minHorizontalDistance = distance;
            bestMatch = candidate;
          }
        }
        return bestMatch;
      }
    } else {
      // goingUp
      // Find elements that are above the current element
      for (const child of allChildren) {
        const childRect = child.getBoundingClientRect();
        if (childRect.bottom < targetRect.top) {
          candidates.push(child);
        }
      }
      // Sort candidates by their top position in descending order (to process row by row, backwards)
      candidates.sort(
        (a, b) => b.getBoundingClientRect().top - a.getBoundingClientRect().top
      );

      let previousRowCandidates: HTMLElement[] = [];
      if (candidates.length > 0) {
        const firstCandidateTop = candidates[0].getBoundingClientRect().top;
        for (const candidate of candidates) {
          if (candidate.getBoundingClientRect().top === firstCandidateTop) {
            previousRowCandidates.push(candidate);
          } else {
            break;
          }
        }
      }

      if (previousRowCandidates.length > 0) {
        let bestMatch: HTMLElement | null = null;
        let minHorizontalDistance = Infinity;

        for (const candidate of previousRowCandidates) {
          const candidateRect = candidate.getBoundingClientRect();
          const targetCenterX = targetRect.left + targetRect.width / 2;
          const candidateCenterX = candidateRect.left + candidateRect.width / 2;
          const distance = Math.abs(targetCenterX - candidateCenterX);

          if (distance < minHorizontalDistance) {
            minHorizontalDistance = distance;
            bestMatch = candidate;
          }
        }
        return bestMatch;
      }
    }

    return null; // No suitable element found
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

  onKeyDownTodoItem(event: KeyboardEvent) {
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
      this.onClickTodoItem(event, Number.parseInt(targetItem.id));
    }
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
