import { Component, HostListener, OnInit, Renderer2, AfterViewInit, ViewChild, ElementRef, AfterViewChecked } from '@angular/core';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { NavbarComponent } from './component/navbar/navbar.component';
import { SidebarComponent } from './component/sidebar/sidebar.component';
import { AngularToastifyModule } from 'angular-toastify';
import { ScrollingModule } from '@angular/cdk/scrolling';
import { GameOfLife } from './game/GameOfLife';
import { GameBoard } from './game/GameBoard';
import { Checkered } from './game/Checkered';
import { LineGrid } from './game/LineGrid';
import { MandelBrotSet } from './game/MandelBrotSet';
import { JuliaSet } from './game/JuliaSet';
import { Game } from './game/Game';
import { JuliaSet0_7885 } from './game/JuliaSet0_7885';
import { Arkanoid } from './game/Arkanoid';

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

  currentGameInstanceName: string = '';

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
    }else if(event.key === 'l' && event.altKey){
      if(this.gameBoard){
        this.gameBoard.GAME_CONFIG.ALLOW_CURSOR_INTERACTION = !this.gameBoard.GAME_CONFIG.ALLOW_CURSOR_INTERACTION;
      }
    }
  }

  ngAfterViewInit(){
    
    let gameBackground = localStorage['background'];    
    
    
    this.currentGameInstanceName = gameBackground;
    
    let canvas: HTMLCanvasElement = this.backgroundCanvasEle.nativeElement;
    this.gameBoard = new GameBoard(canvas);
    
    let gameInstance = this.getGameInstance(gameBackground);
    if(!gameInstance) return;
    

    this.themeGames(this.gameBoard);
    
    this.gameBoard.startGame(gameBackground);
    
    setInterval(()=>{
      if(!this.gameBoard?.GAME_CONFIG.ALLOW_CURSOR_INTERACTION)
      this.themeGames(this.gameBoard);
    }, 500);
  }

  getGameInstance(game: string): Game | null{
    switch(game){
      case "GameOfLife": return new GameOfLife();
      case "JuliaSet": return new JuliaSet();
      case "JuliaSet0_7885": return new JuliaSet0_7885();
      case "MandelBrotSet": return new MandelBrotSet();
      case "Arkanoid": return new Arkanoid(); 
      case "LineGrid": return new LineGrid();
      case "Checkered": return new Checkered();
      default: return null;
    }
  }

  themeGames(gameBoard: GameBoard | null){
    if(!gameBoard) return;

    let currentTheme = getComputedStyle(document.documentElement);
    let GAME_BACKGROUND = currentTheme.getPropertyValue('--game-background');
    let GAME_STROKE_COLOR = currentTheme.getPropertyValue('--game-stroke-color');
    let GAME_CELL_SEED_CUTOFF = currentTheme.getPropertyValue('--game-cell-seed-cutoff');
    let GAME_CELL_SIZE = currentTheme.getPropertyValue('--game-cell-size');
    let GAME_CELL_COLOR = currentTheme.getPropertyValue('--game-cell-color');
    let GAME_FRAME_DELTA = currentTheme.getPropertyValue('--game-frame-delta');
    let GAME_CLEAR_FRAME_EVERY = currentTheme.getPropertyPriority('--game-frame-clear-every');
    let GAME_DRAW_GRID_LINES = currentTheme.getPropertyPriority('--game-draw-grid-lines');

    let GAME_CELL_COLOR_A = currentTheme.getPropertyValue('--game-cell-color-a');
    let GAME_CELL_COLOR_B = currentTheme.getPropertyValue('--game-cell-color-b');
    let GAME_CELL_COLOR_C = currentTheme.getPropertyValue('--game-cell-color-c');
    let GAME_CELL_COLOR_D = currentTheme.getPropertyValue('--game-cell-color-d');
    let GAME_CELL_COLOR_E = currentTheme.getPropertyValue('--game-cell-color-e');


    gameBoard.GAME_CONFIG.CELL_COLOR = GAME_CELL_COLOR;
    gameBoard.GAME_CONFIG.CELL_SEED_CUTOFF = Number.parseFloat(GAME_CELL_SEED_CUTOFF);

    let lastCellSize = gameBoard.GAME_CONFIG.CELL_SIZE;
    gameBoard.GAME_CONFIG.CELL_SIZE = Number.parseFloat(GAME_CELL_SIZE);
    if(lastCellSize != gameBoard.GAME_CONFIG.CELL_SIZE){
      gameBoard.resizeCanvas(); // so that canvas is drawn based on cell size
    }

    gameBoard.GAME_CONFIG.FRAME_DELTA = Number.parseFloat(GAME_FRAME_DELTA);
    gameBoard.GAME_CONFIG.GAME_BACKGROUND = GAME_BACKGROUND;
    gameBoard.GAME_CONFIG.STROKE_COLOR = GAME_STROKE_COLOR;
    gameBoard.GAME_CONFIG.GRID_LINES = GAME_DRAW_GRID_LINES === 'Y';

    gameBoard.GAME_CONFIG.CELL_COLOR_A = GAME_CELL_COLOR_A;
    gameBoard.GAME_CONFIG.CELL_COLOR_B = GAME_CELL_COLOR_B;
    gameBoard.GAME_CONFIG.CELL_COLOR_C = GAME_CELL_COLOR_C;
    gameBoard.GAME_CONFIG.CELL_COLOR_D = GAME_CELL_COLOR_D;
    gameBoard.GAME_CONFIG.CELL_COLOR_E = GAME_CELL_COLOR_E;
    let clearBackgroundIn = Number.parseInt(GAME_CLEAR_FRAME_EVERY) * Number.parseFloat(GAME_FRAME_DELTA);

    let gameBackgroud = localStorage['background'];
    
    if(gameBackgroud != this.currentGameInstanceName){
      let newInstace = this.getGameInstance(gameBackgroud);
      if(newInstace){
        this.gameBoard?.startGame(newInstace);
        this.currentGameInstanceName = gameBackgroud;
      }
    }
  }
}


