import { Game, GameConfig } from "./Game";

export class LineGrid implements Game{
    state:string = 'NOT_PLAYING';
    paused: boolean = false;
    config!: GameConfig;
    init(config: GameConfig): number[][] {
        this.config = config;
        const grid: number[][] = [];
        for (let y = 0; y < config.BOARD_HEIGHT; y++) {
            grid[y] = [];
            for (let x = 0; x < config.BOARD_WIDTH; x++) {
                grid[y][x] = -5; // allow existing thing
            }
        }
        config.HOLD_FRAME = true;
        config.GRID_LINES = true;
        return grid;
    }

    pause(): void {
        this.paused = true;
        this.state = 'PAUSED';
    }

    play(): void {
        this.paused = false;
        this.state = 'PLAYING';
    }

    stop(): void {
        this.state = 'NOT_PLAYING';
    }

    update(grid: number[][]): number[][] {
        // not called
        return grid;
    }
}