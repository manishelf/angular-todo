export interface Game {
    paused: boolean;
    state: string;
    
    init(width: number, height: number, config: GameConfig): boolean[][];
    stop(): void;
    play(): void;
    pause(): void;
    update(grid: boolean[][]): boolean[][];
}

export interface GameConfig{
    CELL_SIZE:number,
    STROKE_COLOR:string,
    CELL_COLOR: string,
    GAME_BACKGROUND: string,
    CELL_SEED_CUTOFF: number,
    FRAME_DELTA: number,
    ALPHA: number, 
}