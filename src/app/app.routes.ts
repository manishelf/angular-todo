import { Routes } from '@angular/router';
import { LoginComponent } from './page/login/login.component';
import { HomeComponent } from './page/home/home.component';
import { EditorComponent } from './page/editor/editor.component';
import { CalendarComponent } from './page/calendar/calendar.component';

export const routes: Routes = [
    {path:'', redirectTo:'home', pathMatch: 'full'},
    {path:'login', component: LoginComponent},
    {path:'create', component:EditorComponent},
    {path:'home', component: HomeComponent},
    {path: 'bin', component: HomeComponent},
    {path: 'bin/clear', component: HomeComponent},
    {path:'edit', component: EditorComponent},
    {path: 'calendar', component: CalendarComponent}
];
