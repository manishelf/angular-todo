import { Game, GameConfig } from "./Game";

export class JuliaSet0_7885 implements Game {
    state: string = 'NOT_PLAYING';
    paused: boolean = false;
    config!: GameConfig;

    maxIterations = 100;
    
    // Frame counter, representing the angle 'a' in radians
    frame: number = 0; 
    
    // Constant for the C = R * e^(i*a) formula: R = 0.7885
    private JULIA_R = 0.7885;
    
    private CYCLE_TIME_MS = 10000;
    private ANIMATION_SPEED: number = 0; 
    
    private generateSetFor(JULIA_CA: number, JULIA_CB: number, config: GameConfig): number[][] {
        const { BOARD_WIDTH, BOARD_HEIGHT } = config;

        // Universal Viewing Window for Z0: [-2.0, 2.0] for the Real axis
        const X_MIN = -1.8; 
        const X_MAX = 1.8;
        const X_RANGE = X_MAX - X_MIN; 

        const BOARD_ASPECT_RATIO = BOARD_HEIGHT / BOARD_WIDTH;
        const Y_RANGE = X_RANGE * BOARD_ASPECT_RATIO;
        
        const Y_MAX = Y_RANGE / 2.0;
        const Y_MIN = -Y_MAX;
        
        const STEP_X = X_RANGE / BOARD_WIDTH;
        const STEP_Y = Y_RANGE / BOARD_HEIGHT;

        let grid = new Array(BOARD_HEIGHT);
        for (let i = 0; i < BOARD_HEIGHT; i++) {
            let row = new Array(BOARD_WIDTH);
            const b0 = Y_MAX - i * STEP_Y; // Correct vertical mapping

            for (let j = 0; j < BOARD_WIDTH; j++) {
                
                const a0 = X_MIN + j * STEP_X;
                
                // Z0 is the pixel coordinate (a0, b0)
                let a = a0; 
                let b = b0;
                
                // C is the constant from the animation path
                const ca = JULIA_CA;
                const cb = JULIA_CB;
                
                let n = 0; 

                // Core iteration: Z(n+1) = Z(n)^2 + C
                for (n = 0; n < this.maxIterations; n++) {
                    let a_squared = a * a;
                    let b_squared = b * b;
                    let two_a_b = 2 * a * b;

                    if (a_squared + b_squared > 4.0) { 
                        break;
                    }

                    a = a_squared - b_squared + ca;
                    b = two_a_b + cb;
                }
                
                let cellVal;
                if (n === this.maxIterations) {
                    cellVal = -1; 
                } else {
                    cellVal = n % 5; 
                }

                row[j] = cellVal;
            }
            grid[i] = row;
        }

        return grid;
    }

    init(config: GameConfig): number[][] {
        this.config = config;
        config.HOLD_FRAME = false;
        config.TOGGLE_PAUSE_ON_MOUSE_CLICK = true;
        config.TOGGLE_CELL_ON_MOUSE_CLICK = false;
        config.FRAME_DELTA = 10;

        this.ANIMATION_SPEED = (2 * Math.PI / this.CYCLE_TIME_MS) * config.FRAME_DELTA;
        this.frame = 0; 

        const initial_ca = this.JULIA_R * Math.cos(this.frame);
        const initial_cb = this.JULIA_R * Math.sin(this.frame);
        
        return this.generateSetFor(initial_ca, initial_cb, config);
    }
    
    update(currentGrid: number[][]): number[][] {
        if (this.paused) {
            return currentGrid;
        }
        
        this.frame += this.ANIMATION_SPEED;
        
        if (this.frame >= 2 * Math.PI) {
            this.frame -= 2 * Math.PI;
        }

        const JULIA_CA = this.JULIA_R * Math.cos(this.frame);
        const JULIA_CB = this.JULIA_R * Math.sin(this.frame);

        return this.generateSetFor(JULIA_CA, JULIA_CB, this.config);
    }
    
    pause(): void { this.paused = true; this.state = 'PAUSED'; }
    play(): void { this.paused = false; this.state = 'PLAYING'; }
    stop(): void { this.state = 'NOT_PLAYING'; }
}