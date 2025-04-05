import { Component, Input, OnInit, ChangeDetectorRef } from '@angular/core';
import { TodoItem } from '../../models/todo-item';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule } from '@angular/common';
import * as marked from 'marked';
import { TodoServiceService } from '../../service/todo-service.service';
import { NavigationExtras, Router } from '@angular/router';

@Component({
  selector: 'app-todo-item',
  imports: [MatIconModule, CommonModule],
  templateUrl: './todo-item.component.html',
  styleUrl: './todo-item.component.css'
})
export class TodoItemComponent implements OnInit {
  @Input() item: TodoItem = {
    id:0,
    subject: "",
    description: "",
    tags: [],
    completionStatus: false,
    setForReminder: false,
    creationTimestamp: Date.now().toString(),
    updationTimestamp: Date.now().toString()
  };
  parsedMD: string = '';
  fromBin: boolean;
  bgColour: string = 'bg-gray-600 border-2 border-amber-400';
  tagNameList: string[] = [];
  @Input() optionsDisplayed: boolean = false;
  @Input() showTags:boolean = false;

  constructor(private todoService: TodoServiceService, private cdr: ChangeDetectorRef, private router: Router) {
    let url = this.router.url;    
    this.fromBin = (url.substring(0,5) !== '/home');
  }
  ngOnInit(): void {
    if (this.item.setForReminder) {
      this.bgColour = 'bg-gray-600 border-2 border-red-600'
    }
    if (this.item.completionStatus) {
      this.bgColour = 'bg-gray-600 border-2 border-green-700'
    }
    this.parsedMD = marked.parse(this.item.description).toString();
    this.parsedMD = this.parsedMD.replace(/\n/g, '<br>');
    this.item.tags.forEach((tag)=>{
      this.tagNameList.push(' '+tag.name+' ');
    });
  }

  onItemClick(){
    let extra : NavigationExtras = {
      state: this.item
    };
    this.router.navigate(['/edit'],extra);
  }

  onClickDelete(){
    if(!this.fromBin){
      this.todoService.deleteItem(this.item);
    }else{
      this.todoService.deleteItem(this.item, this.fromBin);
    }
  }

  onClickCompletionStatus(){
    this.item.completionStatus =! this.item.completionStatus;
    this.updateSave();
  }

  onClickSetReminder(){
    this.item.setForReminder =! this.item.setForReminder;
    this.updateSave();
  }

  private updateSave(){
    this.todoService.updateItem(this.item);
  }

  onUpdateTags(event: Event){
    let inputValue = (event.target as HTMLInputElement).value;
    this.item.tags = [];
    inputValue.split(',').forEach(
      (name)=>{
        this.item.tags.push(
          {name: name}
        )
      }
    )
  }
  onClickTags(){
    this.showTags = !this.showTags;    
    if(this.showTags==false){
      this.updateSave();
    }
  }
}
