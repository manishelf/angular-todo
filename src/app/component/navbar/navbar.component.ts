import { AfterViewInit, Component, ElementRef, ViewChild } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { NavigationEnd, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ToastService } from 'angular-toastify';
import { TodoServiceService } from '../../service/todo-service.service';
import { filter } from 'rxjs';

@Component({
  selector: 'app-navbar',
  imports: [MatIconModule, CommonModule],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.css',
})
export class NavbarComponent implements AfterViewInit {
  accessToken: string | null = null;
  @ViewChild('searchBox') searchBox!: ElementRef;

  constructor(
    private router: Router,
    private toaster: ToastService,
    private todoService: TodoServiceService
  ) {
    this.router.events
      .pipe(filter((e) => e instanceof NavigationEnd))
      .subscribe((event) => {
        setTimeout(() => {
          this.searchBox.nativeElement.focus();
        }, 200);
      });
  }

  ngAfterViewInit(): void {
    this.searchBox.nativeElement.focus();
  }

  searchItems(event: Event): void {
    let searchQuery = (event.target as HTMLInputElement).value;

    let tagList: string[] = [];
    let input = [];
    let exact = false;
    let order = [];

    input = searchQuery.split('!DESC:');
    if (input.length == 2) {
      order.push('!DESC:');
    } else {
      input = searchQuery.split('!ASC:');
      if (input.length == 2) {
        order.push('!ASC:');
      }
    }
    if (input.length == 2) {
      console.log(input);
      let fields = input[1].substring(0, input[1].indexOf(';')).split(',');
      fields.map((field) => field.trim());
      order.push(fields);
      searchQuery = input[1].substring(input[1].indexOf(';'));
    }
    
    exact = !searchQuery.startsWith('!ALL:');
    if (!exact) {
      searchQuery = searchQuery.split('!ALL:')[1];
    }
    input = searchQuery.split('!F:');
    let searchTerms: string[] = [];
    if (input.length == 2) {
      searchQuery = input[0];
      searchTerms = input[1].split(' ');
    }

    input = searchQuery.split('!T:');
    if (input.length == 2) {
      searchQuery = input[0];
      tagList = input[1].split(',');
      tagList = tagList.map((tag) => tag.trim());
    }
    this.router.navigate([], {
      queryParams: {
        order,
        exact: exact,
        search: searchQuery.trim(),
        tag: tagList,
        has: searchTerms,
      },
    });
  }

  syncNotes(): void {
    this.toaster.info('Downloading notes...');
    this.todoService.fromBin = false;
    this.todoService.getAll().subscribe((itemList) => {
      this.todoService.serializeManyToJson(itemList).subscribe((json) => {
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
  uploadNotes(): void {
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
        if (json)
          this.todoService
            .deserializeManyFromJson(json.toString())
            .subscribe((itemList) => {
              this.todoService.addMany(itemList);
              this.toaster.success('Notes loaded successfully');
            });
      };
    };
    inp.click();
  }
}
