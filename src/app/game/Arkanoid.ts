// Arkanoid Game Logic with Multi-Color Bricks and Moving Paddle

import { Game, GameConfig } from "./Game";

export class Arkanoid implements Game {
    state: string = "NOT_RUNNING";
    paused = false;
    config!: GameConfig;

    // Cell IDs for rendering (updated for multi-color bricks)
    CELL = {
        EMPTY: -1,
        BRICK_1: 2, // Color 1
        BRICK_2: 3, // Color 2
        BRICK_3: 4, // Color 3
        BALL: 0,
        PADDLE: 7,
    };

    // Game objects
    ballX = 0;
    ballY = 0;
    ballDX = 1;
    ballDY = -1;
    ballSize = 2;

    paddleX = 0;
    paddleY = 0;
    paddleWidth = 8;
    paddleHeight = 2;
    paddleDX = 1; // Paddle auto-moves

    brickWidth = 6;
    brickHeight = 2;
    brickGap = 1;
    
    // Bricks array now stores number (color ID, 0 for destroyed) instead of boolean
    bricks: number[][] = []; 

    pause() {
        this.paused = true;
        this.state = "PAUSED";
    }

    stop() {
        this.pause();
        this.state = "NOT_RUNNING";
    }

    play() {
        this.state = "PLAYING";
        this.paused = false;
    }

    init(config: GameConfig): number[][] {
        this.config = config;
        this.state = "PLAYING";

        const width = config.BOARD_WIDTH;
        const height = config.BOARD_HEIGHT;

        // === Bricks setup: Multi-Color Initialization (Randomized) ===
        const maxRows = 5; 
        const brickCols = Math.floor(width / (this.brickWidth + this.brickGap));
        const brickRows = Math.min(maxRows, Math.floor(height / 6));

        this.bricks = [];
        for (let r = 0; r < brickRows; r++) {
            const row: number[] = [];
            for (let c = 0; c < brickCols; c++) {
                // Assign a completely random color ID for this specific brick (2, 3, or 4)
                const brickType = Math.floor(Math.random() * 3) + this.CELL.BRICK_1;
                row.push(brickType);
            }
            this.bricks.push(row);
        }

        // --- Original Paddle/Ball Setup ---
        // NOTE: This paddleY calculation (height - 3) may need adjustment if your renderer isn't showing the bottom row.
        this.paddleY = config.BOARD_HEIGHT - this.paddleHeight - 1;
        this.paddleX = Math.floor(config.BOARD_WIDTH / 2 - this.paddleWidth / 2);
        this.paddleDX = 1; // Paddle initial direction

        this.ballX = this.paddleX + Math.floor(this.paddleWidth / 2) - 2;
        this.ballY = this.paddleY - this.ballSize;
        this.ballDX = 1;
        this.ballDY = -1;

        return this.makeGrid();
    }

    makeGrid(): number[][] {
        const width = this.config.BOARD_WIDTH;
        const height = this.config.BOARD_HEIGHT;
        const grid = Array.from({ length: height }, () => Array(width).fill(this.CELL.EMPTY));

        // Draw multi-color bricks
        for (let row = 0; row < this.bricks.length; row++) {
            for (let col = 0; col < this.bricks[row].length; col++) {
                const brickValue = this.bricks[row][col];
                if (brickValue <= 0) continue; // Skip if brick is destroyed (value 0)
                
                const startY = row * (this.brickHeight + this.brickGap) + 2;
                const startX = col * (this.brickWidth + this.brickGap);
                
                for (let dy = 0; dy < this.brickHeight; dy++) {
                    for (let dx = 0; dx < this.brickWidth; dx++) {
                        const gx = startX + dx;
                        const gy = startY + dy;
                        if (gx < width && gy < height) grid[gy][gx] = brickValue; // Use the specific color ID
                    }
                }
            }
        }
        
        // Draw paddle
        for (let dy = 0; dy < this.paddleHeight; dy++) {
            for (let dx = 0; dx < this.paddleWidth; dx++) {
                const gx = this.paddleX + dx;
                const gy = this.paddleY + dy;
                if (gx >= 0 && gx < width && gy >= 0 && gy < height)
                    grid[gy][gx] = this.CELL.PADDLE;
            }
        }

        // Draw ball
        for (let dy = 0; dy < this.ballSize; dy++) {
            for (let dx = 0; dx < this.ballSize; dx++) {
                const gx = this.ballX + dx;
                const gy = this.ballY + dy;
                if (gx >= 0 && gx < width && gy >= 0 && gy < height)
                    grid[gy][gx] = this.CELL.BALL;
            }
        }

        return grid;
    }

    update(_lastGrid: number[][]): number[][] {
        if (this.paused || this.state !== "PLAYING") return this.makeGrid();

        const width = this.config.BOARD_WIDTH;
        const height = this.config.BOARD_HEIGHT;

        let nextX = this.ballX + this.ballDX;
        let nextY = this.ballY + this.ballDY;

        // === Wall collisions (Ball) ===
        if (nextX < 0 || nextX + this.ballSize > width) {
            this.ballDX *= -1;
            nextX = this.ballX + this.ballDX;
        }

        if (nextY < 0) {
            this.ballDY *= -1;
            nextY = this.ballY + this.ballDY;
        }

        // === Paddle collision (Ball) ===
        const paddleTop = this.paddleY;
        const paddleBottom = this.paddleY + this.paddleHeight;
        const paddleLeft = this.paddleX;
        const paddleRight = this.paddleX + this.paddleWidth;

        const ballBottom = nextY + this.ballSize;
        const ballRight = nextX + this.ballSize;

        const hitPaddle =
            ballBottom >= paddleTop &&
            nextY <= paddleBottom &&
            ballRight >= paddleLeft &&
            nextX <= paddleRight;

        if (hitPaddle) {
            this.ballDY = -Math.abs(this.ballDY); // bounce upward
            // Add horizontal deflection based on hit position
            const hitPoint = (nextX + this.ballSize / 2) - (paddleLeft + this.paddleWidth / 2);
            this.ballDX = hitPoint < 0 ? -1 : 1;
            nextY = this.paddleY - this.ballSize - 1;
        }

        // === Brick collision (Ball) ===
        const brickRows = this.bricks.length;
        for (let row = 0; row < brickRows; row++) {
            for (let col = 0; col < this.bricks[row].length; col++) {
                if (this.bricks[row][col] <= 0) continue; // Check for destroyed brick (value 0)

                // Note: The '+ 2' is based on how you draw the bricks in makeGrid
                const brickX = col * (this.brickWidth + this.brickGap);
                const brickY = row * (this.brickHeight + this.brickGap) + 2; 

                const overlapX =
                    nextX < brickX + this.brickWidth && nextX + this.ballSize > brickX;
                const overlapY =
                    nextY < brickY + this.brickHeight && nextY + this.ballSize > brickY;

                if (overlapX && overlapY) {
                    this.bricks[row][col] = 0; // Destroy brick (set to 0)

                    // Simple bounce
                    this.ballDY *= -1;
                    nextY = this.ballY + this.ballDY;
                }
            }
        }

        // === Floor collision (Ball ) ===
        if (nextY + this.ballSize >= height) {
            this.ballDY = -1;
            nextY = height - this.ballSize - 1;
        }

        // === Apply Ball Movement ===
        this.ballX = Math.max(0, Math.min(width - this.ballSize, nextX));
        this.ballY = Math.max(0, Math.min(height - this.ballSize, nextY));

        // --- PADDLE MOVEMENT ---
        
        // Calculate the paddle's next position
        let nextPaddleX = this.paddleX + this.paddleDX;

        // Check for wall collision and reverse direction
        if (nextPaddleX + this.paddleWidth > width || nextPaddleX < 0) {
            this.paddleDX *= -1; // Reverse direction
            nextPaddleX = this.paddleX + this.paddleDX; // Recalculate based on new direction
        }
        
        // Apply movement, ensuring it stays within bounds
        this.paddleX = Math.max(0, Math.min(width - this.paddleWidth, nextPaddleX));
        // ---------------------------

        return this.makeGrid();
    }
}
