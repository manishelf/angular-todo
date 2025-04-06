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
  imports: [FormsModule, CommonModule, MatIconModule]
})

export class EditorComponent {
  convertedMarkdown: string = '';
  option: string = 'MD Preview';
  tagNameList: string[] = [];
  forEdit: number = -1;
  showTags: boolean = false;
  todoItem: Omit<TodoItem, 'id'> = {
    subject: '',
    description: '',
    tags: [],
    completionStatus: false,
    setForReminder: false,
    creationTimestamp: new Date(Date.now()).toISOString(),
    updationTimestamp: new Date(Date.now()).toISOString(),
  };
  constructor(private todoServie : TodoServiceService, private router: Router){
    if(router.url === '/edit'){
      const navigation = this.router.getCurrentNavigation();
      if (navigation && navigation.extras && navigation.extras.state) {
          let itemForUpdate = navigation.extras.state as TodoItem;
          this.forEdit = itemForUpdate.id;
          this.todoItem = itemForUpdate;
          this.tagNameList = this.todoItem.tags.map(tag=>tag.name);
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
      this.convertedMarkdown = marked.parse(this.todoItem.description).toString();
      this.convertedMarkdown = this.convertedMarkdown.replace(/\n/g, '<br>');
      this.convertedMarkdown = `<h1>${this.todoItem.subject}</h1><br>`+this.convertedMarkdown;
    }
  }
  onAddClick(){
    if(this.forEdit !== -1){
      this.todoServie.updateItem({id: this.forEdit, ...this.todoItem});      
    }else{
      this.todoServie.addItem(this.todoItem);
    }
    
    this.router.navigate(['/home']);
  }

  onUpdateTags(event: Event){
    let inputValue = (event.target as HTMLInputElement).value;
    this.todoItem.tags = [];
    inputValue.split(',').forEach(
      (name)=>{
        this.todoItem.tags.push(
          {name: name}
        )
      }
    )
  }
  onClickTags(){
    this.showTags = !this.showTags;    
  }
  onReminderClick(){
    this.todoItem.setForReminder = !this.todoItem.setForReminder;
  }

  onCompletionClick(){
    this.todoItem.completionStatus =!this.todoItem.completionStatus;
  }
}
