import { Component, Input, OnInit, ChangeDetectorRef, AfterViewInit, HostListener, ViewChild, ElementRef, AfterViewChecked, OnChanges } from '@angular/core';
import { TodoItem } from '../../models/todo-item';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule } from '@angular/common';
import * as marked from 'marked';
import { TodoServiceService } from '../../service/todo/todo-service.service';
import { ActivatedRoute, NavigationExtras, Route, Router } from '@angular/router';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { TagListComponent } from '../tag-list/tag-list.component';
import { Tag } from '../../models/tag';

declare var Prism : any;

@Component({
  selector: 'app-todo-item',
  imports: [MatIconModule, CommonModule, TagListComponent],
  templateUrl: './todo-item.component.html',
  styleUrl: './todo-item.component.css'
})
export class TodoItemComponent implements OnChanges, AfterViewChecked {
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
  
  borderColour: string = '';
  
  @Input() fromBin: boolean = false;
  @Input() optionsDisplayed: boolean = false;
  @Input() showTags:boolean = false;
  @Input() minimized: boolean = true;
  markdownHighlighted: boolean = false;


  constructor(private todoService: TodoServiceService, private route:ActivatedRoute, private router: Router, private sanitizer: DomSanitizer) {
  }
  
  ngOnChanges(): void {
    this.borderColour += 'type-normal ';
    if (this.item.setForReminder) {
      this.borderColour += 'type-reminder ';
    }
    if (this.item.completionStatus) {
      this.borderColour += 'type-done ';
    }
    const neverUpdated = this.item.creationTimestamp === this.item.updationTimestamp;
    this.toolTipString = neverUpdated ? 'created on - ' + new Date(this.item.creationTimestamp).toLocaleString() :
                                        'last updated on - ' + new Date(this.item.updationTimestamp).toLocaleString();

    this.todoService.fromBin = this.fromBin;
  }

  ngAfterViewChecked() {
    if(!this.minimized && !this.markdownHighlighted){
      setTimeout(()=>{Prism.highlightAll()},500);
      this.markdownHighlighted = true;
  
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
    this.todoService.updateItem(this.item);
  }

  onUpdateTags(tags: Tag[]){
    this.updateSave();
  }

  onClickDuplicate(){
    let duplicateItem: any = structuredClone(this.item);
    duplicateItem.subject+='-'+Intl.DateTimeFormat([],{
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date());
    delete duplicateItem.id;
    delete duplicateItem.userDefined.data;
    duplicateItem.creationTimestamp = new Date(Date.now()).toISOString();
    duplicateItem.updationTimestamp = new Date(Date.now()).toISOString();
    this.todoService.addItem(duplicateItem);
  }
}
