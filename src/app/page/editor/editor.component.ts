import { AfterViewChecked, AfterViewInit, Component, ElementRef, HostListener, ViewChild } from '@angular/core';
import * as marked from 'marked';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon'
import { BeanItemComponent } from '../../component/bean-item/bean-item.component';
import { TodoServiceService } from './../../service/todo-service.service';
import { TodoItem } from '../../models/todo-item';
import { Router } from '@angular/router';
import { Tag } from '../../models/tag';
import Prism from 'prismjs';
import { UserDefinedType } from '../../models/userdefined-type';
@Component({
  selector: 'app-markdown-editor',
  templateUrl: './editor.component.html',
  styleUrls: ['./editor.component.css'],
  imports: [FormsModule, CommonModule, MatIconModule]
})

export class EditorComponent implements AfterViewInit {
  @ViewChild('subjectTxt') subjectTxt! : ElementRef;
  
  convertedMarkdown: string = '';
  option: string = 'MD Preview';
  tagNameList: string[] = [];
  forEdit: number = -1;
  showTags: boolean = false;
  customTypesVisible: boolean = false;
  customTypes: UserDefinedType[] = [
    {name : "type1", content : ["id", "name"]},
    {name : "type2", content : ["age", "marks"]}
  ];
  todoItem: Omit<TodoItem, 'id'> = {
    subject: '',
    description: '',
    tags: [],
    completionStatus: false,
    setForReminder: false,
    creationTimestamp: new Date(Date.now()).toISOString(),
    updationTimestamp: new Date(Date.now()).toISOString(),
  };

  constructor(private todoServie: TodoServiceService, private router: Router) {
    if (router.url === '/edit') {
      const navigation = this.router.getCurrentNavigation();
      if (navigation && navigation.extras && navigation.extras.state) {
        let itemForUpdate = navigation.extras.state as TodoItem;
        this.forEdit = itemForUpdate.id;
        this.todoItem = itemForUpdate;
        this.todoItem.description = this.todoItem.description.replace(/<br>/g, '\n');
        this.tagNameList = this.todoItem.tags.map(tag => tag.name);
      } else {
        router.navigate(['/home']);
      }
    }
    Prism.plugins['autoloader'].languages_path = 'https://cdn.jsdelivr.net/npm/prismjs@1.14.0/components/';
  }

  ngAfterViewInit(): void {
    this.subjectTxt.nativeElement.focus();
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
    } else if (event.key === 'Enter' && event.target instanceof HTMLInputElement) {
      event.preventDefault();
      this.onAddClick();
    } else if (event.key === 'Enter' && event.target instanceof HTMLTextAreaElement) {
      this.onEventForResize(event);
    } else if(event.key === 's' && event.ctrlKey){
      event.preventDefault();
      this.onAddClick();
    }
  }
  @HostListener('focusin', ['$event'])
  onEventForResize(event: Event): void {
    const target = event.target as HTMLTextAreaElement;
    target.style.height = 'auto';
    target.style.height = target.scrollHeight + 'px';
    target.nextElementSibling?.scrollIntoView(true);
  }


  onOptionClick() {
    this.option = this.option === 'MD Preview' ? 'Editor' : 'MD Preview';
    if (this.option === 'Editor') {
      this.convertedMarkdown = marked.parse(this.todoItem.description).toString();
      this.convertedMarkdown = this.convertedMarkdown.replaceAll('\n','<br>');

      let code = this.convertedMarkdown.match(/<code class="language-(\w+)">([\s\S]*?)<\/code>/g) || this.convertedMarkdown.match(/<code>([\s\S]*?)<\/code>/);
      if (code) {
        for (let i = 0; i < code.length; i++) {
          let snippet = code[i];
          this.convertedMarkdown = this.convertedMarkdown.replace(snippet, snippet.replace(/<br>/g, '\n'));
        }
        setTimeout(() => {
          Prism.highlightAll(); 
        }, 100);
      }
      if(this.todoItem.subject.trim().length != 0){
        this.convertedMarkdown = `<u class="text-3xl">${this.todoItem.subject}</u><br>` + this.convertedMarkdown;
      }
    }
  }
  onAddClick() {
    if (this.forEdit !== -1) {
      this.todoServie.updateItem({ id: this.forEdit, ...this.todoItem });
    } else {
      this.todoServie.addItem(this.todoItem);
    }
    this.router.navigate(['/home']);
  }

  onUpdateTags(event: Event) {
    let inputValue = (event.target as HTMLInputElement).value;
    this.todoItem.tags = [];
    inputValue.split(',').forEach(
      (name) => {
        this.todoItem.tags.push(
          { name: name }
        )
      }
    )
  }

  onClickUserTypeAdd(){

  }

  onClickTags() {
    this.showTags = !this.showTags;
  }
  onReminderClick() {
    this.todoItem.setForReminder = !this.todoItem.setForReminder;
  }

  onCompletionClick() {
    this.todoItem.completionStatus = !this.todoItem.completionStatus;
  } 
}
