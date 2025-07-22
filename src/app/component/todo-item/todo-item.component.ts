import { Component, Input, OnInit, ChangeDetectorRef, AfterViewInit, HostListener, ViewChild, ElementRef, AfterViewChecked } from '@angular/core';
import { TodoItem } from '../../models/todo-item';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule } from '@angular/common';
import * as marked from 'marked';
import { TodoServiceService } from '../../service/todo-service.service';
import { ActivatedRoute, NavigationExtras, Route, Router } from '@angular/router';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

declare var Prism : any;

@Component({
  selector: 'app-todo-item',
  imports: [MatIconModule, CommonModule],
  templateUrl: './todo-item.component.html',
  styleUrl: './todo-item.component.css'
})
export class TodoItemComponent implements OnInit, AfterViewChecked {
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
  parsedMD: SafeHtml = '';
  
  bgColour: string = 'bg-gray-600 border-1 border-e-2 border-s-2 ';
  tagNameList: string[] = [];
  
  @Input() fromBin: boolean = false;
  @Input() optionsDisplayed: boolean = false;
  @Input() showTags:boolean = false;
  @Input() minimized: boolean = true;
  markdownHighlighted: boolean = false;


  constructor(private todoService: TodoServiceService, private route:ActivatedRoute, private router: Router, private sanitizer: DomSanitizer) {
  }
  ngOnInit(): void {
    this.bgColour += 'border-amber-300';
    if (this.item.setForReminder) {
      this.bgColour += ' '+'border-rose-500';
    }
    if (this.item.completionStatus) {
      this.bgColour += ' '+'border-lime-500';
    }

    let markdown = marked.parse(this.item.description).toString();
    markdown = markdown.replace(/\n\n/g, '<br>');
    let code = markdown.match(/<code class="language-(\w+)">([\s\S]*?)<\/code>/g) || markdown.match(/<code>([\s\S]*?)<\/code>/);
    if (code) {
      for (let i = 0; i < code.length; i++) {
        let snippet = code[i];
        markdown = markdown.replace(snippet,  snippet.replace(/<br>/g,'\n').replace(/&lt;br&gt;/g, '<br>'));
      }
    }
    this.parsedMD = this.sanitizer.bypassSecurityTrustHtml(markdown);

    this.item.tags.forEach((tag)=>{
      this.tagNameList.push(' '+tag.name+' ');
    });
    const neverUpdated = this.item.creationTimestamp === this.item.updationTimestamp;
    this.toolTipString = neverUpdated ? 'created on - ' + this.item.creationTimestamp :
                                        'last updated on - ' + this.item.updationTimestamp;

    this.todoService.fromBin = this.fromBin;
  }

  ngAfterViewChecked() {
    if(!this.minimized && !this.markdownHighlighted){
      setTimeout(()=>{Prism.highlightAll()},500);
      this.markdownHighlighted = true;
    } 
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
