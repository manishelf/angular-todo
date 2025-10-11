import { Component, HostListener, OnInit, Renderer2, AfterViewInit, ViewChild, ElementRef, AfterViewChecked } from '@angular/core';
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
export class AppComponent implements AfterViewInit, AfterViewChecked{
  title = 'angular-todo';

  @ViewChild('backgroundCanvas') backgroundCanvasEle!: ElementRef;

  gol: GameOfLife | null = null;

  gameSleepTimer:number = -1;

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
    let canvas: HTMLCanvasElement = this.backgroundCanvasEle.nativeElement;
    this.gol = new GameOfLife(canvas); 
    this.gol.start();
  }

  ngAfterViewChecked(): void {
    this.themeGames(); 
  }

  themeGames(){
    let currentTheme = getComputedStyle(document.documentElement);   
    let GAME_BACKGROUND = currentTheme.getPropertyValue('--game-background');
    let GAME_STROKE_COLOR = currentTheme.getPropertyValue('--game-stroke-color');
    let GAME_CELL_SEED_CUTOFF = currentTheme.getPropertyValue('--game-cell-seed-cutoff');
    let GAME_CELL_SIZE = currentTheme.getPropertyValue('--game-cell-size');
    let GAME_CELL_COLOR = currentTheme.getPropertyValue('--game-cell-color');
    let GAME_FRAME_DELTA = currentTheme.getPropertyValue('--game-frame-delta');
    let GAME_CLEAR_FRAME_EVERY = currentTheme.getPropertyPriority('--game-frame-clear-every');
    let GAME_DRAW_GRID_LINES = currentTheme.getPropertyPriority('--game-draw-grid-lines');

    if(this.gol){
      this.gol.GAME_CONFiG.CELL_COLOR = GAME_CELL_COLOR;
      this.gol.GAME_CONFiG.CELL_SEED_CUTOFF = Number.parseFloat(GAME_CELL_SEED_CUTOFF);
      this.gol.GAME_CONFiG.CELL_SIZE = Number.parseFloat(GAME_CELL_SIZE);
      this.gol.GAME_CONFiG.FRAME_DELTA = Number.parseFloat(GAME_FRAME_DELTA);
      this.gol.GAME_CONFiG.GAME_BACKGROUND = GAME_BACKGROUND;
      this.gol.GAME_CONFiG.STROKE_COLOR = GAME_STROKE_COLOR;
      this.gol.drawGridLines = GAME_DRAW_GRID_LINES === 'Y';

      let clearBackgroundIn = Number.parseInt(GAME_CLEAR_FRAME_EVERY) * Number.parseFloat(GAME_CLEAR_FRAME_EVERY);
    }
  }

  setGameClearFrame(state: boolean){
    if(this.gol)
    this.gol.clearBackground = state;
    if(this.gameSleepTimer != -1){
      clearTimeout(this.gameSleepTimer)  
    }else{
      this.startGame();
    }
    this.gameSleepTimer = setTimeout(()=>{
      this.gameSleep();
    }, 1000*60*2); // 2 min
  }

  gameSleep(){
    this.gol?.pause();
    this.gameSleepTimer = -1;
  }

  startGame(){
    if(this.gol)
    this.gol.start();
  }
}


