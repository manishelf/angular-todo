import { Routes } from '@angular/router';
import { HomeComponent } from './page/home/home.component';
import { EditorComponent } from './page/editor/editor.component';
import { CalendarComponent } from './page/calendar/calendar.component';
import { AboutComponent } from './page/about/about.component';
import { VisualizeComponent } from './page/visualize/visualize.component';
import { LoginComponent } from './page/login/login.component';
import { ProfileComponent } from './page/user/profile/profile.component';
import { BinComponent } from './page/bin/bin.component';

export const routes: Routes = [
  { path: '', redirectTo: 'home', pathMatch: 'full' },
  { path: 'create', component: EditorComponent },
  { path: 'home', component: HomeComponent , children: [
    { path: 'clear', component: HomeComponent },
  ]},
  { path: 'bin', component: BinComponent, children:[
    { path: 'clear', component: BinComponent }
  ] },
  { path: 'demo', component: HomeComponent },
  { path: 'edit', component: EditorComponent, children: [
    {path: 'parent', component: EditorComponent},
    {path: 'child', component: EditorComponent}
  ]},
  { path: 'visualize', component: VisualizeComponent },
  { path: 'calendar', component: CalendarComponent },
  { path: 'about', component: AboutComponent },
  { path: 'login', component: LoginComponent},
  { path: 'signup', component: LoginComponent},
  { path: 'user/profile', component: ProfileComponent},
];
