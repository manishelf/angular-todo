import { BehaviorSubject, debounceTime, Subscription } from "rxjs";
import { Game, GameConfig } from "./Game";

export class GameOfLife implements Game {

  state:string = 'NOT_RUNNING';
  paused = false;

  config! : GameConfig;

  CELL_STATE = {
    ALIVE: 5,
    DEAD: -1
  }

  pause(){
    this.paused = true;
    this.state = 'PAUSED';
  }

  stop(){
    this.pause();
    this.state = 'NOT_RUNNING';
  }

  play(){
    this.state = 'PLAYING';
    this.paused = false;
  }

  init(config: GameConfig): number[][]{
    let gameGrid = new Array(config.BOARD_HEIGHT);
    this.config = config;

    for(let i = 0 ; i< config.BOARD_HEIGHT ; i++){
      let row = new Array(config.BOARD_WIDTH);
      for(let j = 0; j< config.BOARD_WIDTH; j++){
        row[j] = Math.random() > config.CELL_SEED_CUTOFF ? this.CELL_STATE.ALIVE : this.CELL_STATE.DEAD;
      }
      gameGrid[i] = row;
    }

    return gameGrid;
  }

  update(lastGameGrid: number[][]){  
    let newGameGrid = [];
    let stateInFlow = false;
    let gridHeight = lastGameGrid.length;
    let gridWidth = lastGameGrid[0].length;
    for (let i = 0; i < gridHeight; i++) {
        let row  = new Array(gridWidth);
        newGameGrid.push(row);
        for (let j = 0; j < gridWidth; j++) {
          const currState = lastGameGrid[i][j];
          const neighbors = this.countNeighborsToroidal(lastGameGrid, i, j, gridWidth , gridHeight, this.CELL_STATE.ALIVE);
          let newState = currState;
          //https://en.wikipedia.org/wiki/Conway%27s_Game_of_Life
          if (currState == this.CELL_STATE.ALIVE) { 
            // Rule 1 & 3: Death by underpopulation (< 2) or overpopulation (> 3)
            if (neighbors < 2 || neighbors > 3) {
              newState = this.CELL_STATE.DEAD; // Cell dies
            }
            // Rule 2: Lives on (if neighbors is 2 or 3, newState remains true)
          } else {
            // Rule 4: Reproduction (dead cell with exactly 3 neighbors becomes alive)
            if (neighbors === 3) {
              newState = this.CELL_STATE.ALIVE; // Cell is born
            }
          }
          if (newState !== currState) {
            stateInFlow = true;
          }
          newGameGrid[i][j] = newState;
        }
    }

    if(!stateInFlow) this.pause();

    return newGameGrid;
  }

  countNeighbors(gameGrid:number[][], row: number, col: number) {
    let count = 0;
    for (let i = -1; i <= 1; i++) {
        for (let j = -1; j <= 1; j++) {
            const r = row + i;
            const c = col + j;
            if (r >= 0 && r < gameGrid.length // rows
                && c >= 0 &&
                c < gameGrid[0].length // columns
                && !(i === 0 && j === 0)) {
                 count += (gameGrid[r][c] == this.CELL_STATE.ALIVE)?1:0;
            }
        }
    }
    return count;
  }
  
  //optimization
  countNeighborsToroidal(gameGrid:number[][], r: number, c: number, W: number, H: number, ALIVE: number): number {
    let count = 0;

    // Toroidal helper calculation: (r - 1 + H) % H ensures the index wraps from 0 to H-1
    
    // Top Row Neighbors (i-1)
    let top = (r - 1 + H) % H;
    count += gameGrid[top][(c - 1 + W) % W] === ALIVE ? 1 : 0; // Top-Left
    count += gameGrid[top][c] === ALIVE ? 1 : 0;               // Top
    count += gameGrid[top][(c + 1) % W] === ALIVE ? 1 : 0;     // Top-Right

    // Middle Row Neighbors (i)
    let mid = r; 
    count += gameGrid[mid][(c - 1 + W) % W] === ALIVE ? 1 : 0; // Middle-Left
    count += gameGrid[mid][(c + 1) % W] === ALIVE ? 1 : 0;     // Middle-Right

    // Bottom Row Neighbors (i+1)
    let bottom = (r + 1) % H;
    count += gameGrid[bottom][(c - 1 + W) % W] === ALIVE ? 1 : 0; // Bottom-Left
    count += gameGrid[bottom][c] === ALIVE ? 1 : 0;              // Bottom
    count += gameGrid[bottom][(c + 1) % W] === ALIVE ? 1 : 0;    // Bottom-Right

    return count;
  }
}


