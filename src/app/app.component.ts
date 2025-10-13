import { Component, HostListener, OnInit, Renderer2, AfterViewInit, ViewChild, ElementRef, AfterViewChecked } from '@angular/core';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { NavbarComponent } from './component/navbar/navbar.component';
import { SidebarComponent } from './component/sidebar/sidebar.component';
import { AngularToastifyModule } from 'angular-toastify';
import { ScrollingModule } from '@angular/cdk/scrolling';
import { GameOfLife } from './game/GameOfLife';
import { GameBoard } from './game/GameBoard';

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

  @ViewChild('backgroundCanvas') backgroundCanvasEle!: ElementRef;

  gameBoard: GameBoard | null = null;

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
    this.gameBoard = new GameBoard(canvas);
    this.themeGames();
    this.gameBoard.startGame(new GameOfLife());
    setInterval(()=>{
      this.themeGames();
    }, 500);
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

    if(this.gameBoard){
      this.gameBoard.GAME_CONFIG.CELL_COLOR = GAME_CELL_COLOR;
      this.gameBoard.GAME_CONFIG.CELL_SEED_CUTOFF = Number.parseFloat(GAME_CELL_SEED_CUTOFF);

      let lastCellSize = this.gameBoard.GAME_CONFIG.CELL_SIZE;
      this.gameBoard.GAME_CONFIG.CELL_SIZE = Number.parseFloat(GAME_CELL_SIZE);
      if(lastCellSize != this.gameBoard.GAME_CONFIG.CELL_SIZE){
        this.gameBoard.resizeCanvas(); // so that canvas is drawn based on cell size
      }

      this.gameBoard.GAME_CONFIG.FRAME_DELTA = Number.parseFloat(GAME_FRAME_DELTA);
      this.gameBoard.GAME_CONFIG.GAME_BACKGROUND = GAME_BACKGROUND;
      this.gameBoard.GAME_CONFIG.STROKE_COLOR = GAME_STROKE_COLOR;
      this.gameBoard.drawGridLines = GAME_DRAW_GRID_LINES === 'Y';

      let clearBackgroundIn = Number.parseInt(GAME_CLEAR_FRAME_EVERY) * Number.parseFloat(GAME_FRAME_DELTA);

    }
  }

  setGameClearFrame(state: boolean){
    if(this.gameBoard)
      this.gameBoard.clearBackground = state;
  }
}


