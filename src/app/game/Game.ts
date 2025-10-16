export interface Game {
    paused: boolean;
    state: string;
    
    init(width: number, height: number, config: GameConfig): number[][];
    stop(): void;
    play(): void;
    pause(): void;
    update(grid: number[][]): number[][];
}

export interface GameConfig{
    CELL_SIZE:number,
    STROKE_COLOR:string,
    GAME_BACKGROUND: string,
    CELL_SEED_CUTOFF: number,
    FRAME_DELTA: number,
    ALPHA: number, 
    CELL_COLOR: string,
    CELL_COLOR_A: string,
    CELL_COLOR_B: string,
    CELL_COLOR_C: string,
    CELL_COLOR_D: string,
    CELL_COLOR_E: string,
}