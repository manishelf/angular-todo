import { Game, GameConfig } from "./Game";

export class JuliaSet implements Game {
    state: string = 'NOT_PLAYING';
    paused: boolean = false;
    config!: GameConfig;

    maxIterations = 100;

    private JULIA_CA_BASE = -0.75; 
    private JULIA_CB_BASE = 0.0; 
    
    // Radius of the animation circle
    private ANIMATION_RADIUS = 0.3; 
    // Speed/step size for the circle (smaller number = slower rotation)
    private ANIMATION_SPEED = 0;
    CYCLE_TIME_MS = 10000;

    frame: number = 0;

    init(config: GameConfig): number[][] {
        this.config = config;
        this.ANIMATION_SPEED = (2 * Math.PI / this.CYCLE_TIME_MS) * config.FRAME_DELTA;
        config.HOLD_FRAME = false; 
        config.TOGGLE_PAUSE_ON_MOUSE_CLICK = true;
        config.TOGGLE_CELL_ON_MOUSE_CLICK = false;
        config.FRAME_DELTA = 10;
        
        // Start the animation at the initial frame 0
        const initial_ca = this.JULIA_CA_BASE + this.ANIMATION_RADIUS * Math.cos(0);
        const initial_cb = this.JULIA_CB_BASE + this.ANIMATION_RADIUS * Math.sin(0);
        return this.generateSetFor(initial_ca, initial_cb, config.BOARD_WIDTH, config.BOARD_HEIGHT);
    }

    generateSetFor(JULIA_CA: number, JULIA_CB: number, BOARD_WIDTH: number, BOARD_HEIGHT: number): number[][]{

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
            
            // Map the vertical pixel coordinate 'i' to the complex 'b' component
            // i=0 (Top) maps to Y_MAX (Positive), i=BOARD_HEIGHT (Bottom) maps to Y_MIN (Negative)
            const b0 = Y_MAX - i * STEP_Y; 

            for (let j = 0; j < BOARD_WIDTH; j++) {
                
                // Map the horizontal pixel coordinate 'j' to the complex 'a' component
                const a0 = X_MIN + j * STEP_X;
                
                // The pixel coordinate (a0, b0) is the starting point Z0.
                let a = a0; 
                let b = b0;
                
                // The constant C is fixed for the whole set.
                const ca = JULIA_CA;
                const cb = JULIA_CB;
                
                let n = 0; 

                // Core iteration: Z(n+1) = Z(n)^2 + C
                for (n = 0; n < this.maxIterations; n++) {
                    
                    let a_squared = a * a;
                    let b_squared = b * b;
                    let two_a_b = 2 * a * b;

                    // Escape check: |Z|^2 > 4.0
                    if (a_squared + b_squared > 4.0) { 
                        break;
                    }

                    // Z(n+1) = Z(n)^2 + C
                    a = a_squared - b_squared + ca; // New real part (a^2 - b^2 + ca)
                    b = two_a_b + cb;             // New imaginary part (2ab + cb)
                }
                
                let cellVal;
                if (n === this.maxIterations) {
                    // Interior of the set (stable points)
                    cellVal = -1; 
                } else {
                    cellVal = (n % 5); 
                }
                row[j] = cellVal;
            }
            grid[i] = row;
        }
        return grid;
    }

    pause(): void { this.paused = true; this.state = 'PAUSED'; }
    play(): void { this.paused = false; this.state = 'PLAYING'; }
    stop(): void { this.pause(); this.state = 'NOT_PLAYING'; }

    update(grid: number[][]): number[][] {
        // Advance the frame counter
        this.frame += this.ANIMATION_SPEED;
        
        if (this.frame >= 2 * Math.PI) {
            this.frame -= 2 * Math.PI;
        }
        
        // Calculate the new Julia constant C by moving in a circle
        const JULIA_CA = this.JULIA_CA_BASE + this.ANIMATION_RADIUS * Math.cos(this.frame);
        const JULIA_CB = this.JULIA_CB_BASE + this.ANIMATION_RADIUS * Math.sin(this.frame);

        return this.generateSetFor(JULIA_CA, JULIA_CB, this.config.BOARD_WIDTH, this.config.BOARD_HEIGHT); 
    }
}