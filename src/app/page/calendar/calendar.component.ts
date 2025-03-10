import { Component , signal, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FullCalendarModule } from '@fullcalendar/angular';
import { CalendarOptions, DateSelectArg, EventClickArg, EventApi, EventInput, EventAddArg, EventRemoveArg, EventChangeArg } from '@fullcalendar/core';
import interactionPlugin from '@fullcalendar/interaction';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import listPlugin from '@fullcalendar/list';
import { TodoServiceService } from './../../service/todo-service.service';
import { TodoItem } from '../../models/todo-item';

// example found at https://github.com/fullcalendar/fullcalendar-examples
@Component({
  selector: 'app-calendar',
  standalone: true,
  imports: [CommonModule, FullCalendarModule],
templateUrl: './calendar.component.html',
  styleUrl: './calendar.component.css'
})
export class CalendarComponent {
  calendarVisible = signal(true);
  initialEvents: EventInput[] = [];
  calendarOptions = signal<CalendarOptions>({
    plugins: [
      interactionPlugin,
      dayGridPlugin,
      timeGridPlugin,
      listPlugin,
    ],
    headerToolbar: {
      left: 'prev,next today',
      center: 'title',
      right: 'dayGridMonth,timeGridWeek,timeGridDay,listWeek'
    },
    initialView: 'dayGridMonth',
    events: (fetchInfo, successCallback, failureCallback) => {
      this.todoService.getAllItemsForPage(1, false).subscribe({
        next: (result) => {
          const events: EventInput[] = result.map(item => ({
            id: item.id.toString(),
            title: item.subject,
            start: item.eventStart? item.eventStart: item.creationTimestamp,
            end: item.eventEnd? item.eventEnd: item.creationTimestamp,
            allDay: item.eventFullDay
          }));
          successCallback(events);
        },
        error: (error) => {
          failureCallback(error);
        }
      });
    },
    weekends: true,
    editable: true,
    selectable: true,
    selectMirror: true,
    dayMaxEvents: true,
    select: this.handleDateSelect.bind(this),
    eventClick: this.handleEventClick.bind(this),
    eventsSet: this.handleEvents.bind(this),
    eventAdd: this.handleEventAdd.bind(this),
    eventChange: this.handleEventChange.bind(this),
    eventRemove: this.handleEventRemove.bind(this),
  });
  currentEvents = signal<EventApi[]>([]);

  constructor(private changeDetector: ChangeDetectorRef, private todoService: TodoServiceService) {
  }

  handleCalendarToggle() {
    this.calendarVisible.update((bool) => !bool);
  }

  handleWeekendsToggle() {
    this.calendarOptions.update((options) => ({
      ...options,
      weekends: !options.weekends,
    }));
  }

  handleDateSelect(selectInfo: DateSelectArg) {
    const title = prompt('Please enter a new title for your event');
    const calendarApi = selectInfo.view.calendar;

    calendarApi.unselect(); // clear date selection

    if (title) {
      calendarApi.addEvent({
        id: '0',
        title,
        start: selectInfo.startStr,
        end: selectInfo.endStr,
        allDay: selectInfo.allDay
      });
      const newTodoItem: Omit<TodoItem,'id'> = {
        subject: title,
        description: '',
        creationTimestamp: selectInfo.startStr,
        updationTimestamp: new Date().toISOString(),
        completionStatus: false,
        setForReminder: true,
        eventStart: selectInfo.startStr,
        eventEnd: selectInfo.endStr,
        tags: [{name: 'calendar event'}],
        eventFullDay: selectInfo.allDay
      };
      this.todoService.addItem(newTodoItem);
    }
  }

  
  handleEventClick(clickInfo: EventClickArg) {
    if (confirm(`Are you sure you want to delete the event '${clickInfo.event.title}'`)) {
      clickInfo.event.remove();
    }
  }
  
  handleEventAdd(addInfo: EventAddArg) {
    const event = addInfo.event;
    const newTodoItem: TodoItem = {
      id: Number(event.id),
      subject: event.title,
      description: '',
      creationTimestamp: event.startStr,
      updationTimestamp: new Date().toISOString(),
      completionStatus: false,
      setForReminder: true,
      eventStart: event.startStr,
      eventEnd: event.endStr,
      tags: [{name: 'calendar event'}],
      eventFullDay: event.allDay,
    };
    this.todoService.addItem(newTodoItem);
  }
  
  handleEventChange(changeInfo: EventChangeArg){
    const event = changeInfo.event;
    this.todoService.getItemById(Number(event.id), false).subscribe((result)=>{
      result.creationTimestamp= event.start?event.start.toISOString():new Date().toISOString();
      result.eventStart = event.start?event.start.toISOString():new Date().toISOString();
      result.eventEnd = event.end?event.end.toISOString():new Date().toISOString();
      result.subject = event.title;
      this.todoService.updateItem(result);
    });
  }

  handleEventRemove(removeInfo: EventRemoveArg){
    this.todoService.deleteItemById(Number(removeInfo.event.id), false);
  }

  handleEvents(events: EventApi[]) {
    this.currentEvents.set(events);
    this.changeDetector.detectChanges();
  }
}
