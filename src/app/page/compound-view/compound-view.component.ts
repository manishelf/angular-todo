import { Component } from '@angular/core';
import { CalendarComponent } from '../calendar/calendar.component';
import { EditorComponent } from '../editor/editor.component';
import { HomeComponent } from './../home/home.component';
import { VisualizeComponent } from '../visualize/visualize.component';
import { TodoItem } from '../../models/todo-item';

@Component({
  selector: 'app-compound-view',
  imports: [HomeComponent, EditorComponent],
templateUrl: './compound-view.component.html',
  styleUrl: './compound-view.component.css'
})
export class CompoundViewComponent {

  activeItem: TodoItem|null = null;

  shouldRefreshState = false;

  activeItemUpdate(newItem: TodoItem){
    this.activeItem = newItem;
  }

  refreshChildren(event: boolean){
    this.shouldRefreshState = true;
    setTimeout(()=>{
      this.shouldRefreshState = false;
    }, 500);
  }

}
