import { Component, HostListener, OnInit, Renderer2, AfterViewInit, ViewChild, ElementRef } from '@angular/core';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { NavbarComponent } from './component/navbar/navbar.component';
import { SidebarComponent } from './component/sidebar/sidebar.component';
import { AngularToastifyModule } from 'angular-toastify';
import { ScrollingModule } from '@angular/cdk/scrolling';
import { GameOfLife } from './GameOfLife';

@Component({
  selector: 'app-root',
  imports: [
  RouterOutlet,
  NavbarComponent,
  SidebarComponent,
  AngularToastifyModule,
  ScrollingModule
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent implements AfterViewInit{
  title = 'angular-todo';

  // @ViewChild('backgroundCanvas') backgroundCanvasEle!: ElementRef;

  constructor(private router : Router){
  }

  @HostListener('keydown', ['$event'])
  onKeyDown(event: KeyboardEvent): void{
    let target = (event.target as HTMLElement);
    if(target.id === 'editor-subject-input') return;
    else if(target.id === 'editor-description-input') return; // ignore incase of the editor as it has its own handling
    
    if(event.key === '[' && event.ctrlKey){
      event.preventDefault();
      this.router.navigate(['/create']);
    }else if (event.key ===']' && event.ctrlKey){
      event.preventDefault();
      this.router.navigate(['/home']);
    }
  }

  ngAfterViewInit(){
    // let canvas: HTMLCanvasElement = this.backgroundCanvasEle.nativeElement;
    // let gol = new GameOfLife(canvas);
    // gol.start();
  }
}


