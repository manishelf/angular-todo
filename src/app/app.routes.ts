import { Routes } from '@angular/router';
import { HomeComponent } from './page/home/home.component';
import { EditorComponent } from './page/editor/editor.component';
import { CalendarComponent } from './page/calendar/calendar.component';
import { AboutComponent } from './page/about/about.component';
import { VisualizeComponent } from './page/visualize/visualize.component';

export const routes: Routes = [
  { path: '', redirectTo: 'home', pathMatch: 'full' },
  { path: 'create', component: EditorComponent },
  { path: 'home', component: HomeComponent },
  { path: 'bin', component: HomeComponent },
  { path: 'bin/clear', component: HomeComponent },
  { path: 'home/clear', component: HomeComponent },
  { path: 'demo', component: HomeComponent },
  { path: 'edit', component: EditorComponent, children: [
    {path: 'parent', component: EditorComponent},
    {path: 'child', component: EditorComponent}
  ]},
  { path: 'visualize', component: VisualizeComponent },
  { path: 'calendar', component: CalendarComponent },
  { path: 'about', component: AboutComponent },
];
