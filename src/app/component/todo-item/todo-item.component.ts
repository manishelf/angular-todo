import { Component, Input, OnInit, ChangeDetectorRef, AfterViewInit, HostListener, ViewChild, ElementRef } from '@angular/core';
import { TodoItem } from '../../models/todo-item';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule } from '@angular/common';
import * as marked from 'marked';
import { TodoServiceService } from '../../service/todo-service.service';
import { ActivatedRoute, NavigationExtras, Route, Router } from '@angular/router';

import Prism from 'prismjs';
import 'prismjs/plugins/autoloader/prism-autoloader';
import 'prismjs/themes/prism-tomorrow.css';

@Component({
  selector: 'app-todo-item',
  imports: [MatIconModule, CommonModule],
  templateUrl: './todo-item.component.html',
  styleUrl: './todo-item.component.css'
})
export class TodoItemComponent implements OnInit, AfterViewInit {
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

  toolTipString: string = '';
  parsedMD: string = '';
  @Input('fromBin') fromBin: boolean = false;
  
  bgColour: string = 'bg-gray-600 border-1 border-e-2 border-s-2 ';
  tagNameList: string[] = [];
  
  @Input() optionsDisplayed: boolean = false;
  @Input() showTags:boolean = false;
  @Input() minimized: boolean = true;

  constructor(private todoService: TodoServiceService, private route:ActivatedRoute, private router: Router) {
    this.todoService.fromBin = this.fromBin;
    Prism.plugins['autoloader'].languages_path = 'https://cdn.jsdelivr.net/npm/prismjs@1.14.0/components/';
  }
  ngOnInit(): void {
    this.bgColour += 'border-amber-300';
    if (this.item.setForReminder) {
      this.bgColour += ' '+'border-rose-500';
    }
    if (this.item.completionStatus) {
      this.bgColour += ' '+'border-lime-500';
    }


    this.parsedMD = marked.parse(this.item.description).toString();
    this.parsedMD = this.parsedMD.replace(/\n\n/g, '<br>');
    let code = this.parsedMD.match(/<code class="language-(\w+)">([\s\S]*?)<\/code>/g) || this.parsedMD.match(/<code>([\s\S]*?)<\/code>/);
    if (code) {
      for (let i = 0; i < code.length; i++) {
        let snippet = code[i];
        this.parsedMD = this.parsedMD.replace(snippet,  snippet.replace(/<br>/g,'\n').replace(/&lt;br&gt;/g, '<br>'));
      }
    }

    this.item.tags.forEach((tag)=>{
      this.tagNameList.push(' '+tag.name+' ');
    });
    const neverUpdated = this.item.creationTimestamp === this.item.updationTimestamp;
    this.toolTipString = neverUpdated ? 'created on - ' + this.item.creationTimestamp :
                                        'last updated on - ' + this.item.updationTimestamp;
  }

  ngAfterViewInit() {
    setTimeout(()=>{Prism.highlightAll(); 
           }, 1000);
  } 

  onClickDelete(){
    this.todoService.deleteItem(this.item);
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
    this.item.updationTimestamp = new Date(Date.now()).toISOString();
    this.todoService.updateItem(this.item);
  }

  onUpdateTags(event: Event){
    let inputValue = (event.target as HTMLInputElement).value;
    this.item.tags = [];
    inputValue.split(',').forEach(
      (name)=>{
        this.item.tags.push(
          {name: name.trim()}
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

  onClickDuplicate(){
    this.item.subject+='-'+Intl.DateTimeFormat([],{
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date());
    let duplicateItem: Omit<TodoItem,'id'> = {
      subject: this.item.subject,
      description: this.item.description,
      tags: this.item.tags,
      completionStatus: this.item.completionStatus,
      setForReminder: this.item.setForReminder,
      creationTimestamp: new Date(Date.now()).toISOString(),
      updationTimestamp: new Date(Date.now()).toISOString(),
      userDefined: this.item.userDefined,
    };
    this.todoService.addItem(duplicateItem);
  }
}
