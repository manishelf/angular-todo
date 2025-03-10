import { Component } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { Router } from '@angular/router';
import { BeanItemComponent } from './../bean-item/bean-item.component';

@Component({
  selector: 'app-navbar',
  imports: [MatIconModule, BeanItemComponent],
templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.css'
})
export class NavbarComponent {

  constructor(private router: Router){}

  searchItems(event: Event): void{
    let inputValue = (event.target as HTMLInputElement).value;
    
    let searchQuery = inputValue;
    let tagList: string[] = [];

    let input: string[] =inputValue.split('!Tags:');
    if(input.length==2){
      searchQuery = input[0];
      tagList = input[1].split(',');
      tagList = tagList.map((tag)=>tag.trim());
    }
    
    let url = this.router.url;
    url = url.substring(url.indexOf('/'),url.indexOf('?'))
    this.router.navigate([],{queryParams: {search: searchQuery.trim(),tag:tagList }});
  }
}
