import { Signal, signal } from '@angular/core';
import { Game, GameConfig } from './Game';

export class GameBoard {

  gameGrid:number[][] = [[-1]];

  canvas: HTMLCanvasElement;

  GAME_CONFIG: GameConfig = {
    CELL_SIZE: 5,
    BOARD_WIDTH: 5,
    BOARD_HEIGHT: 5,
    STROKE_COLOR: 'BLACK',
    GAME_BACKGROUND: '#FFFF',
    CELL_SEED_CUTOFF: 0.85,
    FRAME_DELTA: 50,
    GRID_LINES: true,
    HOLD_FRAME: false,
    CLEAR_BG_EACH_FRAME: false,
    ALPHA: 0.5,
    CELL_COLOR: 'RED',
    CELL_COLOR_A: 'GREEN',
    CELL_COLOR_B: 'BLUE',
    CELL_COLOR_C: 'YELLOW',
    CELL_COLOR_D: 'MAGENTA',
    CELL_COLOR_E: 'CYAN',
    ALLOW_CURSOR_INTERACTION: false,
    TOGGLE_ON_MOUSE_MOVE: true,
    TOGGLE_PAUSE_ON_MOUSE_CLICK: true,
    TOGGLE_CELL_ON_MOUSE_CLICK: true
  }

  paused = false;

  private previousFrameData: Uint8ClampedArray | null = null; 

  gameInstance: Game | null = null;

  cameraOffsetX: number = 0; 
  cameraOffsetY: number = 0;

  tick = -1;
  private timeLapsedSinceLastFrame: number = performance.now();

  private pauseTimer = -1;
  constructor(canvas: HTMLCanvasElement){
    this.canvas = canvas;

    window.addEventListener('resize', this.resizeCanvas.bind(this));
    this.resizeCanvas();

    canvas.onclick = this.toggleCell.bind(this);
    canvas.onwheel = this.handleMouseZoom.bind(this); 
  }

  startGame(gameInstance: Game){
    if(this.gameInstance){
        this.gameInstance.stop();
    }
    this.gameInstance = gameInstance;

    let startup = this.gameInstance.init(this.GAME_CONFIG);
    if(startup.length == 0)
      startup = this.newGrid(this.GAME_CONFIG.BOARD_WIDTH, this.GAME_CONFIG.BOARD_HEIGHT);
    this.gameGrid = startup;

    let ctx = this.canvas.getContext('2d');

    if(ctx){
      this.gameLoop(ctx);
    }
  }

  gameLoop(ctx: CanvasRenderingContext2D){
    requestAnimationFrame(()=>{this.gameLoop(ctx)});
    if(!this.gameInstance) return;

    if(this.GAME_CONFIG.ALLOW_CURSOR_INTERACTION){
      this.canvas.classList.add('z-2');
      this.canvas.classList.remove('z-0');
      // does not create duplicates and setting css property does not work here
    }else{
      this.canvas.classList.add('z-0');
      this.canvas.classList.remove('z-2');
    }

    if(!this.gameInstance.paused || this.GAME_CONFIG.HOLD_FRAME){
      this.tick = performance.now() - this.timeLapsedSinceLastFrame; 
      if(this.tick >= this.GAME_CONFIG.FRAME_DELTA){
        const logicStartTime = performance.now();
        ctx.globalAlpha = this.GAME_CONFIG.ALPHA;

        // this.drawBackground(ctx, this.GAME_CONFIG.BOARD_WIDTH, this.GAME_CONFIG.BOARD_HEIGHT);

        if(this.gameGrid && 
          this.gameGrid.length == this.GAME_CONFIG.BOARD_HEIGHT && 
          this.gameGrid[0].length == this.GAME_CONFIG.BOARD_WIDTH){
          let latestGrid;
          if(!this.GAME_CONFIG.HOLD_FRAME){
            latestGrid = this.gameInstance.update(this.gameGrid);
          }else{
            latestGrid = this.gameGrid;
          }
          this.drawGrid(ctx, latestGrid, this.GAME_CONFIG.BOARD_WIDTH, this.GAME_CONFIG.BOARD_HEIGHT);
          this.gameGrid = latestGrid;
        }else{
          this.gameGrid = this.newGrid(this.GAME_CONFIG.BOARD_WIDTH, this.GAME_CONFIG.BOARD_HEIGHT);
        }

        const logicEndTime = performance.now();
        const FPT = logicEndTime - logicStartTime;
        const FPSL = (1000)/FPT;
        
        const fpsText = `FPSL: ${Math.round(FPSL)} tick: ${Math.round(this.tick)}`;
        // console.log(fpsText);

        this.tick = 0;
        this.timeLapsedSinceLastFrame = performance.now();
      }
    }    
  }

  drawGrid(ctx: CanvasRenderingContext2D, gameGrid: number[][], width: number, height: number){
    let frame = this.generateFrame(ctx, gameGrid, width, height);
    ctx.putImageData(frame, 0, 0);
  }

  // drawBackground(ctx : CanvasRenderingContext2D , width: number, height: number){
   
  //   if(this.GAME_CONFIG.CLEAR_BG_EACH_FRAME){
  //     ctx.fillStyle = this.GAME_CONFIG.GAME_BACKGROUND;
  //     ctx.clearRect(0,0,width,height);
  //     this.previousFrameData = ctx.createImageData(width, height).data;
  //     ctx.fillRect(0,0, width, height);
  //   }  

  //   if(!this.GAME_CONFIG.GRID_LINES) return;
    
  //   requestAnimationFrame(()=>{
  //     ctx.lineWidth = 1;
  //     ctx.strokeStyle = this.GAME_CONFIG.STROKE_COLOR;
      
  //     width = this.getInPx(width);
  //     height = this.getInPx(height);
 
  //     ctx.beginPath();

  //     for(let j = 0; j < height ; j += this.GAME_CONFIG.CELL_SIZE){
  //       ctx.moveTo(0, j+0.5);
  //       ctx.lineTo(width, j+0.5);
  //     }

  //     for(let i = 0; i < width ; i += this.GAME_CONFIG.CELL_SIZE){
  //       ctx.moveTo(i+0.5, 0);
  //       ctx.lineTo(i+0.5, height);
  //     }

  //     ctx.stroke();
  //   });
  // }

  // generateFrame1(ctx: CanvasRenderingContext2D, gameGrid: number[][], width: number, height: number){
  //   width = this.getInPx(width);
  //   height = this.getInPx(height);
    
  //   let imageBuffer: ImageData;
  //   if (this.previousFrameData) {
  //       // Reuse the existing buffer structure if available
  //       imageBuffer = new ImageData(this.previousFrameData, width, height);
  //   } else {
  //       // Create a new one on first run
  //       imageBuffer = ctx.createImageData(width, height);
  //   }
  //   const data = imageBuffer.data;

  //   for (let i = 3; i < data.length; i += 4) {
  //       data[i] *= (1 - this.GAME_CONFIG.ALPHA); 
  //   }

  //   for (let i = 0; i < height; i++) {
  //     for (let j = 0; j < width; j++) {
  //       let cellValue = gameGrid[this.getInCell(i)][this.getInCell(j)];
  //       const index = (i * width + j) * 4;
  //       let [r, g, b, a] = this.getColorForCell(cellValue);

  //       if(r == -1 && g == -1 && b == -1) continue;

  //       data[index] = r;  
  //       data[index + 1] = g;   
  //       data[index + 2] = b;  
  //       data[index + 3] = 255;
  //     }
  //   }
  //   this.previousFrameData = data;
  //   return imageBuffer
  // }

  // generateFrame2(ctx: CanvasRenderingContext2D, gameGrid: number[][], width: number, height: number) {
  //     const pixelWidth = this.getInPx(width);
  //     const pixelHeight = this.getInPx(height);

  //     let imageBuffer;
  //     if (this.previousFrameData && this.previousFrameData.length === pixelWidth * pixelHeight * 4) {
  //         imageBuffer = new ImageData(this.previousFrameData.slice(), pixelWidth, pixelHeight);
  //     } else {
  //         imageBuffer = ctx.createImageData(pixelWidth, pixelHeight);
  //         this.previousFrameData = imageBuffer.data;
  //     }

  //     const data = imageBuffer.data;
  //     const alphaFactor = 1 - this.GAME_CONFIG.ALPHA;

  //     const gridCellHeight = gameGrid.length;
  //     const gridCellWidth = gameGrid[0].length; 

  //     for (let cellY = 0; cellY < gridCellHeight; cellY++) {
  //         for (let cellX = 0; cellX < gridCellWidth; cellX++) {
  //             const cellValue = gameGrid[cellY][cellX];
  //             const [r, g, b] = this.getColorForCell(cellValue);
              
  //             // optimization 
  //             const startPixelY = this.getInPx(cellY); 
  //             const endPixelY = startPixelY + this.getInPx(1); 
  //             const startPixelX = this.getInPx(cellX);
  //             const endPixelX = startPixelX + this.getInPx(1);

  //             if (r !== -1 || g !== -1 || b !== -1) {
  //                 for (let i = startPixelY; i < endPixelY && i < pixelHeight; i++) {
  //                     for (let j = startPixelX; j < endPixelX && j < pixelWidth; j++) {
  //                         const index = (i * pixelWidth + j) * 4;

  //                         data[index + 3] *= alphaFactor;

  //                         data[index] = r;
  //                         data[index + 1] = g;
  //                         data[index + 2] = b;
  //                         data[index + 3] = 255;
  //                     }
  //                 }
  //             } else if(!this.GAME_CONFIG.CLEAR_BG_EACH_FRAME){
  //               // fade for transparent / inactive
  //                   for (let i = startPixelY; i < endPixelY && i < pixelHeight; i++) {
  //                     for (let j = startPixelX; j < endPixelX && j < pixelWidth; j++) {
  //                         const index = (i * pixelWidth + j) * 4;
  //                         data[index + 3] *= alphaFactor;
  //                     }
  //                 }
  //             }
  //         }
  //     }

  //     return imageBuffer;
  // }

  generateFrame(ctx: CanvasRenderingContext2D, gameGrid: number[][], width: number, height: number) {
      const pixelWidth = this.getInPx(width);
      const pixelHeight = this.getInPx(height);

      let imageBuffer: ImageData;
      let data: Uint8ClampedArray;
      const alphaFactor = 1 - this.GAME_CONFIG.ALPHA;
      const [bgR, bgG, bgB] = this.hexToRgb(this.GAME_CONFIG.GAME_BACKGROUND);
      const [lineR, lineG, lineB] = this.hexToRgb(this.GAME_CONFIG.STROKE_COLOR);

      if (this.previousFrameData && this.previousFrameData.length === pixelWidth * pixelHeight * 4 && !this.GAME_CONFIG.CLEAR_BG_EACH_FRAME) {
          imageBuffer = new ImageData(this.previousFrameData.slice(), pixelWidth, pixelHeight);
          data = imageBuffer.data;

          for (let i = 0; i < data.length; i += 4) {
              data[i + 3] *= alphaFactor;
          }
      } else {
          imageBuffer = ctx.createImageData(pixelWidth, pixelHeight);
          data = imageBuffer.data;
          
          for (let i = 0; i < data.length; i += 4) {
              data[i] = bgR;     
              data[i + 1] = bgG;  
              data[i + 2] = bgB;  
              data[i + 3] = 255;  
          }
      }

      if (this.GAME_CONFIG.GRID_LINES) {
          for (let i = 0; i < pixelWidth; i++) {
              for (let j = 0; j < pixelHeight; j++) {
                  
                  if (j % this.GAME_CONFIG.CELL_SIZE === 0 || 
                      i % this.GAME_CONFIG.CELL_SIZE === 0) {
                      
                      const index = (j * pixelWidth + i) * 4;
                      data[index] = lineR;
                      data[index + 1] = lineG;
                      data[index + 2] = lineB;
                      data[index + 3] = 255; 
                  }
              }
          }
      }

      for (let cellY = 0; cellY < this.GAME_CONFIG.BOARD_HEIGHT; cellY++) {
          for (let cellX = 0; cellX < this.GAME_CONFIG.BOARD_WIDTH; cellX++) {
              const cellValue = gameGrid[cellY][cellX];
              const [r, g, b] = this.getColorForCell(cellValue);
              
              // Only draw non-background cells
              if (r !== -1 || g !== -1 || b !== -1) {
                  const startPixelY = this.getInPx(cellY); 
                  const endPixelY = startPixelY + this.getInPx(1); 
                  const startPixelX = this.getInPx(cellX);
                  const endPixelX = startPixelX + this.getInPx(1);

                  for (let i = startPixelY; i < endPixelY && i < pixelHeight; i++) {
                      for (let j = startPixelX; j < endPixelX && j < pixelWidth; j++) {
                          // Skip if the pixel is part of a drawn grid line, 
                          if (this.GAME_CONFIG.GRID_LINES && 
                              (i % this.GAME_CONFIG.CELL_SIZE === 0 || j % this.GAME_CONFIG.CELL_SIZE === 0)) {
                              continue;
                          }
                          
                          const index = (i * pixelWidth + j) * 4;
                          
                          data[index] = r;
                          data[index + 1] = g;
                          data[index + 2] = b;
                          data[index + 3] = 255; 
                      }
                  }
              }
          }
      }

      this.previousFrameData = data.slice();
      return imageBuffer;
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
        row[j] = 0;
      }
      gameGrid.push(row);
    }
    return gameGrid;
  }

  toggleCell(event: MouseEvent) {

    if(!this.GAME_CONFIG.ALLOW_CURSOR_INTERACTION) return;

    if(this.GAME_CONFIG.TOGGLE_PAUSE_ON_MOUSE_CLICK){
      if(this.gameInstance?.paused){
        this.gameInstance.play();
      }else{
        this.gameInstance?.pause()
      }
    }
    
    if(!this.GAME_CONFIG.TOGGLE_CELL_ON_MOUSE_CLICK) return;
    
    const rect = this.canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    const j = this.getInCell(x);
    const i = this.getInCell(y);
    if (i < 0 || j < 0 || i >= this.GAME_CONFIG.BOARD_HEIGHT || j >= this.GAME_CONFIG.BOARD_WIDTH) return;

    let newGrid = this.gameGrid;
    let cellValue = newGrid[i][j];
    newGrid[i][j] = 5 - cellValue
    if(cellValue < -1){
      newGrid[i][j] = 5; // 0 is default
    }

    const MAX_COLOR_VALUE = 5;
    const MIN_COLOR_VALUE = 0;
    const BACKGROUND_VALUE = -1;

    if (cellValue == MAX_COLOR_VALUE) {
      newGrid[i][j] = BACKGROUND_VALUE; 
    } else if (cellValue > BACKGROUND_VALUE && cellValue < MAX_COLOR_VALUE) {
      newGrid[i][j] = cellValue + 1;
    } else if (cellValue == BACKGROUND_VALUE){
      newGrid[i][j] = MAX_COLOR_VALUE;
    } else {
      newGrid[i][j] = BACKGROUND_VALUE;
    }
    
    this.gameGrid = newGrid;
    this.pauseForDuration(2500);
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
    
    this.GAME_CONFIG.BOARD_WIDTH = this.getInCell(newWidth);
    this.GAME_CONFIG.BOARD_HEIGHT = this.getInCell(newHeight);
    
    if(this.GAME_CONFIG.HOLD_FRAME && this.gameInstance){
      this.startGame(this.gameInstance);
    }
  }

  handleMouseZoom(event: WheelEvent){
    if (!this.GAME_CONFIG.ALLOW_CURSOR_INTERACTION) return;
    event.preventDefault(); // Stop the page from scrolling

    const oldCellSize = this.GAME_CONFIG.CELL_SIZE;
    let newCellSize = oldCellSize;

    if (event.deltaY < 0) {
        newCellSize = Math.min(oldCellSize + 1, 50); // Zoom in, max size 50
    } else if (event.deltaY > 0) {
        newCellSize = Math.max(oldCellSize - 1, 1);  // Zoom out, min size 1
    }
    
    if (newCellSize === oldCellSize) return;
    
    const rect = this.canvas.getBoundingClientRect();
    const cursorX = event.clientX - rect.left;
    const cursorY = event.clientY - rect.top;

    const virtualCursorX = cursorX - this.cameraOffsetX;
    const virtualCursorY = cursorY - this.cameraOffsetY;

    const scaleFactor = newCellSize / oldCellSize;

    this.GAME_CONFIG.CELL_SIZE = newCellSize;

    this.cameraOffsetX = cursorX - (virtualCursorX * scaleFactor);
    this.cameraOffsetY = cursorY - (virtualCursorY * scaleFactor);
  }

  pauseForDuration(durationMs: number = 10000) {
    if (!this.gameInstance) return;

    this.gameInstance.pause(); 
    this.GAME_CONFIG.HOLD_FRAME = true;
    clearTimeout(this.pauseTimer);
    this.pauseTimer = setTimeout(() => {
        this.gameInstance?.play(); 
        this.GAME_CONFIG.HOLD_FRAME = false;
    }, durationMs); 
  }
}
