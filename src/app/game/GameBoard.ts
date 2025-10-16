import { Signal, signal } from '@angular/core';
import { Game, GameConfig } from './Game';

export class GameBoard {

  gameGrid:number[][] = [[-1]];

  canvas: HTMLCanvasElement;
  boardHeight: number = 1;
  boardWidth: number = 1;

  GAME_CONFIG: GameConfig = {
    CELL_SIZE: 5,
    STROKE_COLOR: 'BLACK',
    GAME_BACKGROUND: '#FFFF',
    CELL_SEED_CUTOFF: 0.85,
    FRAME_DELTA: 50,
    ALPHA: 0.5,
    CELL_COLOR: 'RED',
    CELL_COLOR_A: 'GREEN',
    CELL_COLOR_B: 'BLUE',
    CELL_COLOR_C: 'YELLOW',
    CELL_COLOR_D: 'MAGENTA',
    CELL_COLOR_E: 'CYAN'
  }

  allowCursorInteraction = true;
  toggleOnMouseMove = true;
  clearBackground = true;
  drawGridLines = true;
  paused = false;

  private previousFrameData: Uint8ClampedArray | null = null; 

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
        if(this.GAME_CONFIG.CELL_SIZE>1){
          this.GAME_CONFIG.CELL_SIZE+=event.deltaY>0?1:-1;
        }else{
          this.GAME_CONFIG.CELL_SIZE = 1;
        }
      }
    }
  }

  startGame(gameInstance: Game){
    if(this.gameInstance){
        this.gameInstance.stop();
    }
    this.gameInstance = gameInstance;

    let startup = this.gameInstance.init(this.boardWidth, this.boardHeight, this.GAME_CONFIG);
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
      if(this.tick >= this.GAME_CONFIG.FRAME_DELTA){
        ctx.globalAlpha = this.GAME_CONFIG.ALPHA;

        this.drawBackground(ctx, this.boardWidth, this.boardHeight);

        if(this.gameGrid && this.gameGrid.length > 0 && this.gameGrid[0].length>0){
          let latestGrid = this.gameInstance.update(this.gameGrid);
          this.drawGrid(ctx, latestGrid,this.boardWidth, this.boardHeight);
          this.gameGrid = latestGrid;
        }
        this.tick = 0;
        this.timeLapsedSinceLastFrame = performance.now();
      }
    }
  }

  drawBackground(ctx : CanvasRenderingContext2D , width: number, height: number){
    ctx.lineWidth = 1;
    ctx.strokeStyle = this.GAME_CONFIG.STROKE_COLOR;
    ctx.fillStyle = this.GAME_CONFIG.GAME_BACKGROUND;

    width = this.getInPx(width);
    height = this.getInPx(height);

    if(this.clearBackground){
      ctx.clearRect(0,0,width,height);
      this.previousFrameData = ctx.createImageData(width, height).data;
    }  

    ctx.fillRect(0,0, width, height);

    if(!this.drawGridLines) return;

    ctx.beginPath();

    for(let j = 0; j < height ; j += this.GAME_CONFIG.CELL_SIZE){
      ctx.moveTo(0, j+0.5);
      ctx.lineTo(width, j+0.5);
    }

    for(let i = 0; i < width ; i += this.GAME_CONFIG.CELL_SIZE){
      ctx.moveTo(i+0.5, 0);
      ctx.lineTo(i+0.5, height);
    }

    ctx.stroke();
  }

  drawGrid(ctx: CanvasRenderingContext2D, gameGrid: number[][], width: number, height: number){
    let frame = this.generateFrame(ctx, gameGrid, width, height);
    ctx.putImageData(frame, 0, 0);
  }

  generateFrame(ctx: CanvasRenderingContext2D, gameGrid: number[][], width: number, height: number){
    width = this.getInPx(width);
    height = this.getInPx(height);
    
    let imageBuffer: ImageData;
    if (this.previousFrameData) {
        // Reuse the existing buffer structure if available
        imageBuffer = new ImageData(this.previousFrameData, width, height);
    } else {
        // Create a new one on first run
        imageBuffer = ctx.createImageData(width, height);
    }
    const data = imageBuffer.data;

    for (let i = 3; i < data.length; i += 4) {
        data[i] *= (1 - this.GAME_CONFIG.ALPHA); 
    }

    for (let i = 0; i < height; i++) {
      for (let j = 0; j < width; j++) {
        let cellValue = gameGrid[this.getInCell(i)][this.getInCell(j)];
        const index = (i * width + j) * 4;
        let [r, g, b, a] = this.getColorForCell(cellValue);

        if(r == -1 && g == -1 && b == -1) continue;

        data[index] = r;  
        data[index + 1] = g;   
        data[index + 2] = b;  
        data[index + 3] = 255;
      }
    }
    this.previousFrameData = data;
    return imageBuffer
  }

  getColorForCell(cellValue: number){
    switch(cellValue){
      case -1: return this.hexToRgb(this.GAME_CONFIG.GAME_BACKGROUND);
      case 0: return this.hexToRgb(this.GAME_CONFIG.CELL_COLOR);
      case 1: return this.hexToRgb(this.GAME_CONFIG.CELL_COLOR_A);
      case 2: return this.hexToRgb(this.GAME_CONFIG.CELL_COLOR_B);
      case 3: return this.hexToRgb(this.GAME_CONFIG.CELL_COLOR_C);
      case 4: return this.hexToRgb(this.GAME_CONFIG.CELL_COLOR_D);
      case 5: return this.hexToRgb(this.GAME_CONFIG.CELL_COLOR_E);
      default: return [-1, -1, -1];
    }
  }

  hexToRgb(hex: string) {
    let cleanedHex = hex.replace(/^#/, '');

    // 2. Handle 3-digit shorthand (e.g., #f00 -> #ff0000)
    if (cleanedHex.length === 3) {
        cleanedHex = cleanedHex
            .split('')
            .map((char: string) => char + char) // double each character
            .join('');
    }

    const r = parseInt(cleanedHex.substring(0, 2), 16);
    const g = parseInt(cleanedHex.substring(2, 4), 16);
    const b = parseInt(cleanedHex.substring(4, 6), 16);
    
    return [r,g,b];
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
    newGrid[i][j] = 5 - newGrid[i][j]; // 0 is default

    this.gameGrid = newGrid;
    setTimeout(()=>{
        this.gameInstance?.play();
    }, 1000);
  }

  getInPx(cells: number){
    return cells*this.GAME_CONFIG.CELL_SIZE;
  }

  getInCell(pixels: number){
    return Math.floor(pixels/this.GAME_CONFIG.CELL_SIZE);
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
