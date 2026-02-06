import { Component, ElementRef, EventEmitter, Input, OnChanges, OnInit, Output, QueryList, SimpleChanges, ViewChild, ViewChildren } from '@angular/core';
import { MatIcon } from '@angular/material/icon';
import { Tag } from '../../models/tag';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TodoServiceService } from '../../service/todo/todo-service.service';

@Component({
  selector: 'app-tag-list',
  imports: [MatIcon, CommonModule, FormsModule],
  templateUrl: './tag-list.component.html',
  styleUrl: './tag-list.component.css'
})
export class TagListComponent implements OnInit, OnChanges{

  @Input('tags') tagsList: Tag[] = [];
  @Input('names') names: string[] = [];
  @Input('editable') editable = false;

  @Output() onChange: EventEmitter<Tag[]> = new EventEmitter();

  editing: number = -1;

  suggestedTag: Tag[] = [];

  constructor(private todoItemService: TodoServiceService){

  }

  ngOnInit(): void {
  }

  ngOnChanges(changes: SimpleChanges): void {
    if(this.names.length>0){
      this.names.forEach(name=>this.tagsList.push({name}));
    }
  }

  updateState(item: Tag, tagInput: HTMLElement){
    let newTagName = tagInput?.innerHTML;
    item.name = this.stripOutHtml(newTagName);
    this.tagsList = this.tagsList.filter(t=>t.name.trim() != '');
    this.tagsList.forEach(t=>t.name=t.name.trim());
    this.onChange.emit(this.tagsList);
    this.editing = -1;
  }

  addItem(){
    this.tagsList.push({
      name:"....."
    });
    this.editing = this.tagsList.length-1;
  }

  handleTagNameInput(event: Event){
    let target = event.target as HTMLDivElement;
    let tagName = target.innerHTML;
    
    this.todoItemService.
    getTagWithNameLike(this.stripOutHtml(tagName))
    .subscribe((tags)=>{
      this.suggestedTag = tags;
    });
  }

  stripOutHtml(inp: string): string {
    return inp.replaceAll(/<div>|<\/div>|<br>/g,'') || '';
  }
}
