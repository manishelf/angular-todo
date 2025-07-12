import { Component, signal, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FullCalendarModule } from '@fullcalendar/angular';
import {
  CalendarOptions,
  DateSelectArg,
  EventClickArg,
  EventApi,
  EventInput,
  EventAddArg,
  EventRemoveArg,
  EventChangeArg,
} from '@fullcalendar/core';
import interactionPlugin, { DateClickArg } from '@fullcalendar/interaction';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import listPlugin from '@fullcalendar/list';
import { TodoServiceService } from './../../service/todo-service.service';
import { TodoItem } from '../../models/todo-item';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';

// example found at https://github.com/fullcalendar/fullcalendar-examples
@Component({
  selector: 'app-calendar',
  standalone: true,
  imports: [CommonModule, FullCalendarModule],
  templateUrl: './calendar.component.html',
  styleUrl: './calendar.component.css',
})
export class CalendarComponent {
  calendarVisible = signal(true);
  initialEvents: EventInput[] = [];
  calendarOptions = signal<CalendarOptions>({
    plugins: [interactionPlugin, dayGridPlugin, timeGridPlugin, listPlugin],
    headerToolbar: {
      left: 'prev,next today',
      center: 'title',
      right: 'dayGridMonth,timeGridWeek,timeGridDay,listWeek',
    },
    initialView: 'dayGridMonth',
    events: (fetchInfo, successCallback, failureCallback) => {
      this.todoService.getAll().subscribe({
        next: (result) => {
          const events: EventInput[] = result.map((item) => ({
            id: item.id.toString(),
            title: item.subject,
            start: item.eventStart ? item.eventStart : item.creationTimestamp,
            end: item.eventEnd ? item.eventEnd : item.creationTimestamp,
            allDay: item.eventFullDay,
            color: ``,
          }));
          successCallback(events);
        },
        error: (error) => {
          failureCallback(error);
        },
      });
    },
    weekends: true,
    editable: true,
    selectable: true,
    droppable: true,
    selectMirror: true,
    dayMaxEvents: true,
    eventStartEditable: true,
    longPressDelay: 500,

    eventClick: this.handleEventClick.bind(this),
    eventsSet: this.handleEvents.bind(this),
    eventChange: this.handleEventChange.bind(this),
    eventRemove: this.handleEventRemove.bind(this),
    dateClick: this.handleDateSelect.bind(this),
    select: this.handleDateSelect.bind(this),
  });
  currentEvents = signal<EventApi[]>([]);

  constructor(
    private changeDetector: ChangeDetectorRef,
    private todoService: TodoServiceService,
    private router: Router
  ) {
    this.todoService.fromBin = false;
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

  handleDateSelect(selectInfo: any) {
    const title = prompt('Please enter a new title for your event');
    const calendarApi = selectInfo.view.calendar;

    calendarApi.unselect(); // clear date selection

    if (title) {
      let start = selectInfo.startStr
        ? selectInfo.startStr
        : selectInfo.dateStr;
      let end = selectInfo.endStr ? selectInfo.endStr : selectInfo.dateStr;
      const newTodoItem: Omit<TodoItem, 'id'> = {
        subject: title,
        description: '',
        creationTimestamp: start,
        updationTimestamp: new Date().toISOString(),
        completionStatus: false,
        setForReminder: true,
        eventStart: start,
        eventEnd: end,
        tags: [{ name: 'calendar event' }],
        eventFullDay: selectInfo.allDay,
      };
      this.todoService.addItem(newTodoItem).subscribe((id) => {
        calendarApi.addEvent({
          id: id.toString(),
          title,
          start: start,
          end: end,
          allDay: selectInfo.allDay,
        });
      });
    }
  }

  handleEventClick(clickInfo: EventClickArg) {
    this.todoService
      .getItemById(Number.parseInt(clickInfo.event.id))
      .subscribe((item) => {
        if (item) {
          this.router.navigate(['/edit'], { state: { item } });
        }
      });
  }


  handleEventChange(changeInfo: EventChangeArg) {
    const event = changeInfo.event;
    this.todoService.getItemById(Number(event.id)).subscribe((result) => {
      result.creationTimestamp = event.start
        ? event.start.toISOString()
        : new Date().toISOString();
      result.eventStart = event.start
        ? event.start.toISOString()
        : new Date().toISOString();
      result.eventEnd = event.end
        ? event.end.toISOString()
        : new Date().toISOString();
      result.subject = event.title;
      this.todoService.updateItem(result);
    });
  }

  handleEventRemove(removeInfo: EventRemoveArg) {
    this.todoService.deleteItemById(Number(removeInfo.event.id));
  }

  handleEvents(events: EventApi[]) {
    this.currentEvents.set(events);
    this.changeDetector.detectChanges();
  }
}
