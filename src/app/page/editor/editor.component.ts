import { Component, HostListener } from '@angular/core';
import * as marked from 'marked';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';  
import {MatIconModule} from '@angular/material/icon'
import { BeanItemComponent } from '../../component/bean-item/bean-item.component';
import { TodoServiceService } from './../../service/todo-service.service';
import { TodoItem } from '../../models/todo-item';
import { Router } from '@angular/router';
import { Tag } from '../../models/tag';

@Component({
  selector: 'app-markdown-editor',
  templateUrl: './editor.component.html',
  styleUrls: ['./editor.component.css'],
  imports: [FormsModule, CommonModule, MatIconModule, BeanItemComponent]
})
export class EditorComponent {
  markdownText: string = '';
  convertedMarkdown: string = '';
  option: string = 'MD Preview';
  title: string = '';
  setForReminder: boolean = false;
  completionStatus: boolean = false;
  tagList: Tag[] = [];
  tagNameList: string[] = [];
  forEdit: boolean = false;
  showTags: boolean = false;
  toUpdate: TodoItem|null = null;
  constructor(private todoServie : TodoServiceService, private router: Router){
    if(router.url === '/edit'){
      this.forEdit = true;
      const navigation = this.router.getCurrentNavigation();
      if (navigation && navigation.extras && navigation.extras.state) {
          this.toUpdate = navigation.extras.state as TodoItem;
          this.title = this.toUpdate.subject;
          this.markdownText = this.toUpdate.description;
          this.completionStatus = this.toUpdate.completionStatus;
          this.setForReminder = this.toUpdate.completionStatus;
          this.tagList = this.toUpdate.tags;
          this.tagNameList = this.tagList.map(tag=>tag.name);
      }else{
        router.navigate(['/home']);
      }
    }
  }

  @HostListener('keydown', ['$event'])
  handleKeydown(event: KeyboardEvent): void {
    if (event.key === 'Tab' && event.target instanceof HTMLTextAreaElement) {
      event.preventDefault();

      const target = event.target as HTMLTextAreaElement;
      const start = target.selectionStart;
      const end = target.selectionEnd;

      target.value = target.value.substring(0, start) + '\t' + target.value.substring(end);

      target.selectionStart = target.selectionEnd = start + 1;
    }else if(event.key === 'Enter' && event.target instanceof HTMLInputElement){
      event.preventDefault();
      this.onAddClick();
    }
  }
  @HostListener('input', ['$event.target'])
  onInput(target: HTMLTextAreaElement): void {
    target.style.height = 'auto';
    target.style.height = target.scrollHeight + 'px';
  }

  onOptionClick() {
    this.option = this.option === 'MD Preview' ? 'Editor' : 'MD Preview';
    if(this.option === 'Editor'){
      this.convertedMarkdown = marked.parse(this.markdownText).toString();
      this.convertedMarkdown = this.convertedMarkdown.replace(/\n/g, '<br>');
      this.convertedMarkdown = `<h1>${this.title}</h1><br>`+this.convertedMarkdown;
    }
  }
  onAddClick(){
    const item: Omit<TodoItem, 'id'> = {
      subject: this.title,
      description: this.markdownText,
      tags: this.tagList,
      completionStatus: this.completionStatus,
      setForReminder: this.setForReminder,
      creationTimestamp: new Date(Date.now()).toISOString(),
      updationTimestamp: new Date(Date.now()).toISOString(),
    }
    if(this.forEdit){
      if(this.toUpdate){
        this.toUpdate.updationTimestamp = new Date(Date.now()).toISOString();
        this.toUpdate.subject = this.title;
        this.toUpdate.description = this.markdownText;
        this.toUpdate.tags= this.tagList,
        this.toUpdate.completionStatus= this.completionStatus,
        this.toUpdate.setForReminder= this.setForReminder,
        this.todoServie.updateItem(this.toUpdate);
      }
    }else{
      this.todoServie.addItem(item);
    }
    
    this.router.navigate(['/home']);
  }

  onUpdateTags(event: Event){
    let inputValue = (event.target as HTMLInputElement).value;
    this.tagList = [];
    inputValue.split(',').forEach(
      (name)=>{
        this.tagList.push(
          {name: name}
        )
      }
    )
  }
  onClickTags(){
    this.showTags = !this.showTags;    
  }
  onReminderClick(){
    this.setForReminder = !this.setForReminder;
  }

  onCompletionClick(){
    this.completionStatus =!this.completionStatus;
  }
}
