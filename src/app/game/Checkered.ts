import { Game, GameConfig } from "./Game";

export class Checkered implements Game{
    state:string = 'NOT_PLAYING';
    paused: boolean = false;

    init(config: GameConfig): number[][] {
        const grid: number[][] = [];
        for (let y = 0; y < config.BOARD_HEIGHT; y++) {
            grid[y] = [];
            for (let x = 0; x < config.BOARD_WIDTH; x++) {
                grid[y][x] = ((x + y) % 2 == 0 )? 0 : -1;
            }
        }
        config.HOLD_FRAME = true;
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
        return grid;
    }
}