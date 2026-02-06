export interface Game {
    paused: boolean;
    state: string;
    
    init(config: GameConfig): number[][];
    stop(): void;
    play(): void;
    pause(): void;
    update(grid: number[][]): number[][];
}

export interface GameConfig{
    CELL_SIZE:number,
    BOARD_WIDTH: number,
    BOARD_HEIGHT: number,
    STROKE_COLOR:string,
    GAME_BACKGROUND: string,
    CELL_SEED_CUTOFF: number,
    FRAME_DELTA: number,
    GRID_LINES: boolean,
    HOLD_FRAME: boolean,
    CLEAR_BG_EACH_FRAME: boolean,
    ALPHA: number, 
    CELL_COLOR: string,
    CELL_COLOR_A: string,
    CELL_COLOR_B: string,
    CELL_COLOR_C: string,
    CELL_COLOR_D: string,
    CELL_COLOR_E: string,
    ALLOW_CURSOR_INTERACTION: boolean,
    TOGGLE_ON_MOUSE_MOVE: boolean,
    TOGGLE_PAUSE_ON_MOUSE_CLICK: boolean,
    TOGGLE_CELL_ON_MOUSE_CLICK: boolean,
}