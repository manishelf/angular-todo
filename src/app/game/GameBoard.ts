import { Signal, signal } from '@angular/core';
import { Game, GameConfig } from './Game';

export class GameBoard {

  gameGrid:boolean[][] = [[true, false]];

  canvas: HTMLCanvasElement;
  boardHeight: number = -1;
  boardWidth: number = -1;
  
  GAME_CONFiG: GameConfig = {
    CELL_SIZE: 5,
    STROKE_COLOR: 'BLACK',
    CELL_COLOR: 'GREEN',
    GAME_BACKGROUND: '#FFFF',
    CELL_SEED_CUTOFF: 0.85,
    FRAME_DELTA: 50,
    ALPHA: 0.1, 
  }

  allowCursorInteraction = true;
  toggleOnMouseMove = true;
  clearBackground = true;
  drawGridLines = true;
  paused = false;

  
  gameInstance: Game | null = null;
  
  tick = -1;
  private timeLapsedSinceLastFrame: number = performance.now();

  constructor(canvas: HTMLCanvasElement){ 
    this.canvas = canvas;

    window.addEventListener('resize', this.resizeCanvas.bind(this));
    this.resizeCanvas();

    canvas.onclick = this.toggleCell.bind(this);
    canvas.onwheel = (event)=>{
      if(this.allowCursorInteraction){
        if(this.GAME_CONFiG.CELL_SIZE>1){
          this.GAME_CONFiG.CELL_SIZE+=event.deltaY>0?1:-1; 
        }else{
          this.GAME_CONFiG.CELL_SIZE = 1;
        }
      }
    }
  }

  startGame(gameInstance: Game){
    if(this.gameInstance){
        this.gameInstance.stop();
    }
    this.gameInstance = gameInstance;

    let startup = this.gameInstance.init(this.boardWidth, this.boardHeight, this.GAME_CONFiG);
    if(startup.length == 0)
      startup = this.newGrid(this.boardWidth, this.boardHeight);
    this.gameGrid = startup;
    
    let ctx = this.canvas.getContext('2d');

    if(ctx){
      this.gameLoop(ctx);
    }
  }

  gameLoop(ctx: CanvasRenderingContext2D){
    requestAnimationFrame(()=>{this.gameLoop(ctx)});
    if(!this.gameInstance) return;
     
    if(!this.gameInstance.paused){
      this.tick = performance.now() - this.timeLapsedSinceLastFrame;        
      if(this.tick >= this.GAME_CONFiG.FRAME_DELTA){
        ctx.globalAlpha = this.GAME_CONFiG.ALPHA;
        
        this.drawBackground(ctx, this.boardWidth, this.boardHeight);
        
        let latestGrid = this.gameInstance.update(this.gameGrid);
        this.drawGrid(ctx, latestGrid,this.boardWidth, this.boardHeight);
        this.gameGrid = latestGrid;
        
        this.tick = 0;
        this.timeLapsedSinceLastFrame = performance.now();
      }
    }
  }

  drawBackground(ctx : CanvasRenderingContext2D , width: number, height: number){
    ctx.lineWidth = 1;
    ctx.strokeStyle = this.GAME_CONFiG.STROKE_COLOR;
    ctx.fillStyle = this.GAME_CONFiG.GAME_BACKGROUND; 
    
    width = this.getInPx(width);
    height = this.getInPx(height);
    
    if(this.clearBackground) ctx.clearRect(0,0,width,height);

    ctx.fillRect(0,0, width, height);
    
    if(!this.drawGridLines) return;

    ctx.beginPath();
    
    for(let j = 0; j < height ; j += this.GAME_CONFiG.CELL_SIZE){
      
      ctx.moveTo(0, j+0.5);
      ctx.lineTo(width, j+0.5);
    }

    for(let i = 0; i < width ; i += this.GAME_CONFiG.CELL_SIZE){
      ctx.moveTo(i+0.5, 0);
      ctx.lineTo(i+0.5, height);
    } 
    
    ctx.stroke(); 
  }

  drawGrid(ctx: CanvasRenderingContext2D, gameGrid: boolean[][], width: number, height: number){   
    ctx.fillStyle = this.GAME_CONFiG.CELL_COLOR;
    for(let i = 0 ; i< height ; i++){
      for(let j = 0; j < width; j++){        
        if(gameGrid[i][j]){
          ctx.fillRect(this.getInPx(j), this.getInPx(i), this.GAME_CONFiG.CELL_SIZE, this.GAME_CONFiG.CELL_SIZE);
        }
      }
    }  
  }

  newGrid(width: number, height: number){
    let gameGrid = [];
    for(let i = 0 ; i< height ; i++){
      let row = new Array(width);
      for(let j = 0; j< width; j++){
        row[j] = false;
      }
      gameGrid.push(row);
    }
    return gameGrid;
  }

  toggleCell(event: MouseEvent) {
    this.gameInstance?.pause();
    const rect = this.canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    
    const j = this.getInCell(x);
    const i = this.getInCell(y);
    if (i < 0 || j < 0 || i >= this.boardHeight || j >= this.boardWidth) return;

    let newGrid = this.gameGrid;
    newGrid[i][j] = !newGrid[i][j];  

    this.gameGrid = newGrid;
    setTimeout(()=>{
        this.gameInstance?.play();
    }, 1000);
  }

  getInPx(cells: number){
    return cells*this.GAME_CONFiG.CELL_SIZE;
  }

  getInCell(pixels: number){
    return Math.floor(pixels/this.GAME_CONFiG.CELL_SIZE);
  } 

  resizeCanvas(){    
    const rect = this.canvas.getBoundingClientRect();
    const newWidth = rect.width;
    const newHeight = rect.height;

    this.canvas.width = newWidth;
    this.canvas.height = newHeight;
    this.canvas.style.width = newWidth+'px';
    this.canvas.style.height = newHeight+'px';

    this.boardWidth = this.getInCell(newWidth);
    this.boardHeight = this.getInCell(newHeight);
  }
}