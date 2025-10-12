import { Game, GameConfig } from "./Game";

export class Checkered implements Game{
    state:string = 'NOT_PLAYING';
    paused: boolean = false;

    init(width: number, height: number, config: GameConfig): boolean[][] {
        return []
    }

    pause(): void {
        
    }
    play(): void {
        
    }
    stop(): void {
        
    }
    
    update(grid: boolean[][]): boolean[][] {
        return []
    }
}