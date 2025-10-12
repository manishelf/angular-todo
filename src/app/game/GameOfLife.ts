import { BehaviorSubject, debounceTime, Subscription } from "rxjs";
import { Game, GameConfig } from "./Game";

export class GameOfLife implements Game {

  state:string = 'NOT_RUNNING';
  paused = false;

  config! : GameConfig;
  
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

  init(width: number, height: number, config: GameConfig): boolean[][]{
    let gameGrid = [];
    this.config = config;
    
    for(let i = 0 ; i< height ; i++){
      let row = new Array(width);
      for(let j = 0; j< width; j++){
        row[j] = Math.random() > config.CELL_SEED_CUTOFF;
      }
      gameGrid.push(row);
    }
    return gameGrid;
  }

  update(lastGameGrid: boolean[][]){
    let newGameGrid = [];
    let stateInFlow = false;
    let gridHeight = lastGameGrid.length;
    let gridWidth = lastGameGrid[0].length;
    for (let i = 0; i < gridHeight; i++) {
        let row  = new Array(gridHeight);
        newGameGrid.push(row);
        for (let j = 0; j < gridWidth; j++) {
          const currState = lastGameGrid[i][j];
          const neighbors = this.countNeighbors(lastGameGrid, i, j);
          let newState = currState; 
          //https://en.wikipedia.org/wiki/Conway%27s_Game_of_Life
          if (currState) {
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
          if (newState !== currState) {
            stateInFlow = true;
          }
          newGameGrid[i][j] = newState;
        }
    }
    
    if(!stateInFlow) this.pause();

    return newGameGrid;  
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
}