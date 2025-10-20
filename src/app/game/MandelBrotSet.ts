import { Game, GameConfig } from "./Game";

export class MandelBrotSet implements Game{
    state:string = 'NOT_PLAYING';
    paused: boolean = false;
    config!: GameConfig;

    maxIterations = 100;

    init1(config: GameConfig): number[][]{
        // does not map the imaginary plane so does not work
        let grid = new Array(config.BOARD_HEIGHT);
        for(let i = 0; i < config.BOARD_HEIGHT; i++){
            let row = new Array(config.BOARD_WIDTH);
            for(let j = 0; j < config.BOARD_WIDTH; j++){
                let a = i;
                let b = j;
                let ca = a;
                let cb = b;
                let n = 0;
                for(n = 0 ; n<this.maxIterations; n++){
                    //https://en.wikipedia.org/wiki/Mandelbrot_set
                    //https://editor.p5js.org/codingtrain/sketches/KsV1wWLqd
                    let aa = a * a - b * b; // (a+ib)(a-ib)
                    let bb = 2 * a * b;
                    a = aa + ca;
                    b = bb + cb;
                    if (a * a + b * b > 16) {
                        break;
                    }
                }
                let cellVal = -5;
                cellVal = Math.floor((n / this.maxIterations) * 5); // 0 - 5
                if(n == this.maxIterations){
                    cellVal = -1; // background
                }
                row[j] = cellVal;
            }
            grid[i] = row;
        }
        this.config = config;
        config.HOLD_FRAME = true;
        return grid;
    }

    init(config: GameConfig): number[][] {
        this.config = config;
        config.HOLD_FRAME = true; 
        
        const { BOARD_WIDTH, BOARD_HEIGHT } = config;
        const BOARD_ASPECT_RATIO = BOARD_HEIGHT / BOARD_WIDTH;
        const X_MIN = -2.5;
        const X_MAX = 1.0;
        const X_RANGE = X_MAX - X_MIN;
        
        const Y_RANGE = X_RANGE * BOARD_ASPECT_RATIO;
        // The Mandelbrot set is centered on the imaginary axis (c_b = 0).
        const Y_MAX = Y_RANGE / 2.0;
        const Y_MIN = -Y_MAX;
        
        // Calculate the range and step for mapping coordinates to the complex plane
        const STEP_X = X_RANGE / BOARD_WIDTH;
        const STEP_Y = Y_RANGE / BOARD_HEIGHT;
        /**
            ca​ (Real Part) → ca = X_MIN + j * STEP_X;
            cb​ (Imaginary Part) → cb = Y_MIN + i * STEP_Y;
         */
        let grid = new Array(BOARD_HEIGHT);
        for (let i = 0; i < BOARD_WIDTH; i++) {
            let row = new Array(BOARD_WIDTH);
            
            // Map the vertical pixel coordinate 'i' to the complex 'b' component (imaginary part)
            const cb = Y_MIN + i * STEP_Y; 

            for (let j = 0; j < BOARD_WIDTH; j++) {
                
                // Map the horizontal pixel coordinate 'j' to the complex 'a' component (real part)
                const ca = X_MIN + j * STEP_X;
                
                // Z = a + ib, C = ca + i cb
                let a = 0.0; // Start with Z0 = 0
                let b = 0.0;
                let n = 0; 

                // This is the core Mandelbrot iteration: Z(n+1) = Z(n)^2 + C
                for (n = 0; n < this.maxIterations; n++) {
                    // Z^2 = (a + ib)^2 = (a^2 - b^2) + i (2ab)
                    let a_squared = a * a;
                    let b_squared = b * b;
                    let two_a_b = 2 * a * b;

                    // Check for magnitude greater than 2 (or magnitude squared > 4)
                    // (a^2 + b^2 > 4) is mathematically sufficient for escape. 
                    // 16 is also acceptable but 4 is the minimal bound.
                    if (a_squared + b_squared > 4.0) { 
                        break;
                    }

                    // Z(n+1) = Z(n)^2 + C
                    a = a_squared - b_squared + ca; // New real part
                    b = two_a_b + cb;             // New imaginary part
                }
                
                let cellVal;
                if (n === this.maxIterations) {
                    cellVal = -1; 
                } else {
                    cellVal = ( n % 5 ) ; 
                }

                row[j] = cellVal;
            }
            grid[i] = row;
        }
        console.log(grid);
        
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