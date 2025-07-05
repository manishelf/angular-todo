import { Component, HostListener, OnInit, Renderer2 } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { NavbarComponent } from './component/navbar/navbar.component';
import { SidebarComponent } from './component/sidebar/sidebar.component';
import { AngularToastifyModule } from 'angular-toastify';

@Component({
  selector: 'app-root',
  imports: [
  RouterOutlet,
  NavbarComponent,
  SidebarComponent,
  AngularToastifyModule,
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent{
  title = 'angular-todo';

  constructor(private router : Router){
  }

  @HostListener('keydown', ['$event'])
  onKeyDown(event: KeyboardEvent): void{
    if(event.key === 'N' && event.ctrlKey){
      event.preventDefault();
      this.router.navigate(['/create']);
    }else if (event.key ==='H' && event.ctrlKey){
      event.preventDefault();
      this.router.navigate(['/home']);
    }
  }
}
