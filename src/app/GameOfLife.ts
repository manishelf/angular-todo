import { BehaviorSubject, debounceTime, Subscription } from "rxjs";

export class GameOfLife {
  constructor(private canvas: HTMLCanvasElement){ 
    window.addEventListener('resize', this.resizeCanvas.bind(this));
    this.resizeCanvas();

    // canvas.onclick = this.toggleCellStart.bind(this);
    // canvas.onmousemove = this.toggleCell.bind(this); 
    canvas.onclick = this.toggleCell.bind(this);

    canvas.onwheel = (event)=>{
      if(this.allowCursorInteraction){
        if(this.GAME_CONFiG.CELL_SIZE>1){
          this.GAME_CONFiG.CELL_SIZE+=event.deltaY>0?1:-1; 
        }else{
          this.GAME_CONFiG.CELL_SIZE = 1;
        }
        this.clear();
        this.start();
      }
    }
  }
  
  GAME_CONFiG = {
    CELL_SIZE: 5,
    STROKE_COLOR: 'BLACK',
    CELL_COLOR: 'GREEN',
    GAME_BACKGROUND: '#FFF9',
    CELL_SEED_CUTOFF: 0.85,
    FRAME_DELTA: 50,
    ALPHA: 0.1, 
  }

  gameGrid$: BehaviorSubject<boolean[][]>= new BehaviorSubject([[true,false]]);

  timerId: number = -1;

  allowCursorInteraction = true;

  toggleOnMouseMove = true;

  paused = false;

  drawGridLines = true;

  subscription!: Subscription;

  clearBackground = true;

  pause(){
    this.paused = true;
    this.subscription.unsubscribe();
  }

  start(){
    let ctx = this.canvas.getContext('2d');
    if(!ctx) return;
    
    ctx.globalAlpha = this.GAME_CONFiG.ALPHA;

    let gameGrid = this.newGrid(this.canvas.width, this.canvas.height);
    
    this.gameGrid$.next(gameGrid);
    
    this.subscription = this.gameGrid$.pipe(debounceTime(this.GAME_CONFiG.FRAME_DELTA)).subscribe(gameGrid=>{      
      try{
        this.drawBackground(ctx, this.canvas.width, this.canvas.height); 
        this.drawGrid(ctx, gameGrid, this.canvas.width, this.canvas.height);
        this.updateGrid(ctx, gameGrid, this.canvas.width, this.canvas.height);
      }catch {
        this.clear();
        this.start();
      }
    });
  }

  clear(){
    let currCutoff = this.GAME_CONFiG.CELL_SEED_CUTOFF;
    this.GAME_CONFiG.CELL_SEED_CUTOFF = 1.1;
    this.pause();
    this.start();
    this.pause();
    this.paused = false;
    this.GAME_CONFiG.CELL_SEED_CUTOFF = currCutoff;
  }

  newGrid(width: number, height: number){
    let gameGrid = [];
    for(let i = 0 ; i< this.getInCell(height) ; i++){
      let row = new Array(this.getInCell(width));
      for(let j = 0; j< this.getInCell(width); j++){
        row[j] = Math.random() > this.GAME_CONFiG.CELL_SEED_CUTOFF;
      }
      gameGrid.push(row);
    }
    return gameGrid;
  }

  drawGrid(ctx: CanvasRenderingContext2D, gameGrid: boolean[][], width: number, height: number){
   ctx.fillStyle=this.GAME_CONFiG.CELL_COLOR;   
   
   for(let i = 0 ; i< this.getInCell(height) ; i++){
      for(let j = 0; j< this.getInCell(width); j++){        
        if(gameGrid[i][j]){
          ctx.fillRect(this.getInPx(j)+0.5, this.getInPx(i)+0.5, this.GAME_CONFiG.CELL_SIZE-0.5, this.GAME_CONFiG.CELL_SIZE-0.5);
        }
      }
    }     
  }

  drawBackground(ctx : CanvasRenderingContext2D , width: number, height: number){
    if(!ctx) return;
    
    ctx.lineWidth = 1;
    ctx.strokeStyle = this.GAME_CONFiG.STROKE_COLOR;
    ctx.fillStyle = this.GAME_CONFiG.GAME_BACKGROUND; 
    
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

  updateGrid(ctx: CanvasRenderingContext2D, lastGameGrid: boolean[][], width: number, height: number){
    let stateInFlow = false;
    let newGameGrid = [];
    for (let i = 0; i < this.getInCell(height); i++) {
        let row  = new Array(this.getInCell(width));
        newGameGrid.push(row);
        for (let j = 0; j < this.getInCell(width); j++) {
          const isAlive = lastGameGrid[i][j];
          const neighbors = this.countNeighbors(lastGameGrid, i, j);
          let newState = isAlive; 
          //https://en.wikipedia.org/wiki/Conway%27s_Game_of_Life
          if (isAlive) {
            // Rule 1 & 3: Death by underpopulation (< 2) or overpopulation (> 3)
            if (neighbors < 2 || neighbors > 3) {
              newState = false; // Cell dies
            }
            // Rule 2: Lives on (if neighbors is 2 or 3, newState remains true)
          } else {
            // Rule 4: Reproduction (dead cell with exactly 3 neighbors becomes alive)
            if (neighbors === 3) {
              newState = true; // Cell is born
            }
          }

          newGameGrid[i][j] = newState;

          if (newState !== isAlive) {
            stateInFlow = true;
          }
        }
    }

    
    if(stateInFlow && !this.paused){ 
      this.gameGrid$.next(newGameGrid);
    }
  }

  countNeighbors(gameGrid:boolean[][], row: number, col: number) {
    let count = 0;    
    for (let i = -1; i <= 1; i++) {
        for (let j = -1; j <= 1; j++) {
            const r = row + i;
            const c = col + j;
            if (r >= 0 && r < gameGrid.length // rows
                && c >= 0 &&
                c < gameGrid[0].length // columns
                && !(i === 0 && j === 0)) {
                 count += gameGrid[r][c]?1:0;
            }
        }
    }
    return count;
  }

  toggleCellStart(event: Event){
    if(this.allowCursorInteraction){
      this.toggleOnMouseMove = !this.toggleOnMouseMove;
    }
  }

  toggleCell(event: MouseEvent) {
    if(!this.toggleOnMouseMove) return;

    const rect = this.canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    
    const j = this.getInCell(x);
    const i = this.getInCell(y);
    
    let newGrid = this.gameGrid$.value;
    newGrid[i][j] = !newGrid[i][j];

    this.gameGrid$.next(newGrid);
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
    
    let newGrid = this.newGrid(this.canvas.width, this.canvas.height);
    this.gameGrid$.next(newGrid);
  }
}