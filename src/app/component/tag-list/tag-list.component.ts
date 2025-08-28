import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { MatIcon } from '@angular/material/icon';
import { Tag } from '../../models/tag';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-tag-list',
  imports: [MatIcon, CommonModule, FormsModule],
  templateUrl: './tag-list.component.html',
  styleUrl: './tag-list.component.css'
})
export class TagListComponent implements OnInit{

  @Input('tags') tagsList!: Tag[];
  @Input('editable') editable = false;

  @Output() onChange: EventEmitter<Tag[]> = new EventEmitter();

  editing: number = -1;

  ngOnInit(): void {
  }

  updateState(item: Tag, tagInput: HTMLElement){
    let newTagName = tagInput?.innerHTML.replaceAll(/<div>|<\/div>|<br>/g,'') || '';
    item.name = newTagName;
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
}
