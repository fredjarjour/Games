const grid = [
    [null, null, null, null],
    [null, null, null, null],
    [null, null, null, null],
    [null, null, null, null]
]

let score = 0;

class Square {
    constructor(value) {
        this.value = value;
    }

    combine() {
        this.value *= 2;
        update_score(this.value);
    }
}

document.addEventListener('keydown', function(event) {
    switch (event.key) {
        case "ArrowLeft":
        case "a":
        case "A":
            move(0);
            break;
        case "ArrowRight":
        case "d":
        case "D":
            move(1);
            break;
        case "ArrowUp":
        case "w":
        case "W":
            move(2);
            break;
        case "ArrowDown":
        case "s":
        case "S":
            move(3);
            break;
    }
});

function update_score(added_value) {
    score += added_value;
    
    document.getElementById("score").innerHTML = "Score: " + score;
}

function is_full() {
    for (let rowIndex = 0; rowIndex < grid.length; rowIndex++) {
        for (let index = 0; index < grid[rowIndex].length; index++) {
            if (grid[rowIndex][index] == null) {
                return false
            };
        }
    }
    return true;
}

function is_loss() {
    if (!is_full()) return false;
    
    for (let rowIndex = 0; rowIndex < grid.length; rowIndex++) {
        const row = grid[rowIndex];
        for (let index = 0; index < row.length; index++) {
            const element = row[index].value;

            if (index < row.length - 1 && row[index + 1].value === element) return false;
            if (index > 1 && row[index - 1].value === element) return false;
            if (rowIndex < grid.length - 1 && grid[rowIndex + 1][index].value === element) return false;
            if (rowIndex > 1 && grid[rowIndex - 1][index].value === element) return false;
            
        }
    }
    document.getElementById("loss").innerHTML = "Lost! Press Restart for a new game!"
    return true;
}

function pick_value() {
    if (Math.random() > 0.1) return 2;
    return 4;
}

function random_empty_index() {
    let emptyIndexes = [];
    for (let rowIndex = 0; rowIndex < grid.length; rowIndex++) {
        const row = grid[rowIndex];
        for (let index = 0; index < row.length; index++) {
            const element = row[index];
            
            if (element == null) emptyIndexes.push([rowIndex, index]);
        }
    }
    
    if (emptyIndexes.length === 0) return false;

    return emptyIndexes[Math.floor(Math.random() * emptyIndexes.length)];
}

function add_digit() {
    if (is_full()) return;
    let index = random_empty_index();
    grid[index[0]][index[1]] = new Square(pick_value());
}

function clear_buttons(clear_controls = false, clear_speed = true) {
    document.getElementById("start_btn").style.display = "none";
    document.getElementById("cpu_btn").style.display = "none";

    if (clear_speed) {
        const speeds = document.getElementsByClassName("speed");
        for (let i = 0; i < speeds.length; i++) {
            const element = speeds[i];
            element.style.display = "none";
        }
        
    }

    if (clear_controls) {
        const controls = document.getElementsByClassName("controls");
        for (let i = 0; i < controls.length; i++) {
            const element = controls[i];
            element.style.display = "none";
        }
        
    }
}

function start_game(clear_controls = false, clear_speed = true) {
clear_buttons(clear_controls, clear_speed);
    for (let i = 0; i < 2; i++) {
        add_digit();
    }


    update_grid();
}

function restart_game() {
    location.reload();
}

function update_grid() {
    for (let rowIndex = 0; rowIndex < grid.length; rowIndex++) {
        const row = grid[rowIndex];
        for (let index = 0; index < row.length; index++) {
            const element = row[index];
            const tile = document.getElementById("g" + rowIndex +  index);
            
            if (element == null) {
                tile.className = "value0";
                tile.innerHTML = "";
                continue;
            }

            if (element.value > 4096) {
                tile.className = "valuemore";
            } else {
                tile.className = "value" + element.value;
            }

            tile.innerHTML = element.value;
        }
    }
}

// 0: LEFT, 1: RIGHT, 2: UP, 3: DOWN
function move(direction) {
    let tempGrid = JSON.parse(JSON.stringify(grid));

    if (direction === 0) {
        for (let rowIndex = 0; rowIndex < grid.length; rowIndex++) {
            const row = grid[rowIndex];
            let canCombine = true;
            for (let index = 1; index < row.length; index++) {
                const element = row[index];

                if (element == null) continue;
               
                for (let innerIndex = 1; innerIndex < 4; innerIndex++) {
                    if (index - innerIndex < 0) break;

                    const otherElement = row[index - innerIndex];

                    if (otherElement == null && index - innerIndex === 0) {
                        row[index] = null;
                        row[index - innerIndex] = element;
                        break;
                    }

                    if (otherElement == null) continue;

                    if (otherElement.value != element.value || (otherElement.value == element.value && !canCombine)) {
                        // place element at the index before
                        if (innerIndex != 1) {
                            row[index] = null;
                            row[index - innerIndex + 1] = element;
                        }
                        canCombine = true;
                        break;
                    }

                    // Combine elements, cannot combine if the other one just combined
                    if (otherElement.value == element.value) {
                        otherElement.combine();
                        row[index] = null;
                        canCombine = false;
                        break;
                    }
                }
            }
        }
    } else if (direction === 1) {
        for (let rowIndex = 0; rowIndex < grid.length; rowIndex++) {
            const row = grid[rowIndex];
            let canCombine = true;
            for (let index = row.length - 1; index >= 0; index--) {
                const element = row[index];

                if (element == null) continue;
               
                for (let innerIndex = 1; innerIndex < 4; innerIndex++) {
                    if (index + innerIndex >= row.length) break;

                    const otherElement = row[index + innerIndex];

                    if (otherElement == null && index + innerIndex === row.length - 1) {
                        row[index] = null;
                        row[index + innerIndex] = element;
                        break;
                    }

                    if (otherElement == null) continue;

                    if (otherElement.value != element.value || (otherElement.value == element.value && !canCombine)) {
                        // place element at the index before
                        if (innerIndex != 1) {
                            row[index] = null;
                            row[index + innerIndex - 1] = element;
                        }
                        canCombine = true;
                        break;
                    }

                    // Combine elements, cannot combine if the other one just combined
                    if (otherElement.value == element.value) {
                        otherElement.combine();
                        row[index] = null;
                        canCombine = false;
                        break;
                    }
                }
            }
        }
    } else if (direction === 2) {
        for (let colIndex = 0; colIndex < grid[0].length; colIndex++) {
            let canCombine = true;
            for (let index = 1; index < grid.length; index++) {
                const element = grid[index][colIndex];

                if (element == null) continue;
               
                for (let innerIndex = 1; innerIndex < 4; innerIndex++) {
                    if (index - innerIndex < 0) break;

                    const otherElement = grid[index - innerIndex][colIndex];

                    if (otherElement == null && index - innerIndex === 0) {
                        grid[index][colIndex] = null;
                        grid[index - innerIndex][colIndex] = element;
                        break;
                    }

                    if (otherElement == null) continue;

                    if (otherElement.value != element.value || (otherElement.value == element.value && !canCombine)) {
                        // place element at the index before
                        if (innerIndex != 1) {
                            grid[index][colIndex] = null;
                            grid[index - innerIndex + 1][colIndex] = element;
                        }
                        canCombine = true;
                        break;
                    }

                    // Combine elements, cannot combine if the other one just combined
                    if (otherElement.value == element.value) {
                        otherElement.combine();
                        grid[index][colIndex] = null;
                        canCombine = false;
                        break;
                    }
                }
            }
        }
    } else if (direction === 3) {
        for (let colIndex = 0; colIndex < grid[0].length; colIndex++) {
            let canCombine = true;
            for (let index = grid.length - 1; index >= 0; index--) {
                const element = grid[index][colIndex];

                if (element == null) continue;
               
                for (let innerIndex = 1; innerIndex < 4; innerIndex++) {
                    if (index + innerIndex >= grid.length) break;

                    const otherElement = grid[index + innerIndex][colIndex];

                    if (otherElement == null && index + innerIndex === grid.length - 1) {
                        grid[index][colIndex] = null;
                        grid[index + innerIndex][colIndex] = element;
                        break;
                    }

                    if (otherElement == null) continue;

                    if (otherElement.value != element.value || (otherElement.value == element.value && !canCombine)) {
                        // place element at the index before
                        if (innerIndex != 1) {
                            grid[index][colIndex] = null;
                            grid[index + innerIndex - 1][colIndex] = element;
                        }
                        canCombine = true;
                        break;
                    }

                    // Combine elements, cannot combine if the other one just combined
                    if (otherElement.value == element.value) {
                        otherElement.combine();
                        grid[index][colIndex] = null;
                        canCombine = false;
                        break;
                    }
                }
            }
        }
    }
    
    if (is_loss()) return;
    
    if (compare_grids(tempGrid, grid)) return false;

    add_digit();
    
    update_grid();
    
    return true;
}

// ALGORITHM

async function sleep(sleep_time) {
    return new Promise(r => setTimeout(r, sleep_time));
}

function find_highest_corner() {
    let max_value = 0;
    let x_value = 0;
    let y_value = 2;
    for (let rowIndex = 0; rowIndex < grid.length; rowIndex++) {
        const row = grid[rowIndex];
        
        for (let index = 0; index < row.length; index++) {
            const element = row[index];
            
            if (element > max_value) {
                if (index < grid.length/2) x_value = 0;
                else x_value = 1;

                if (rowIndex < grid.length/2) y_value = 2;
                else y_value = 3;
            }
        }
    }

    return [x_value, y_value];
}

function compare_grids(grid1, grid2) {
    return JSON.stringify(grid1) === JSON.stringify(grid2);
}

async function play_game() {
    const speed = document.getElementById("speed");
    start_game(true, false);

    clear_buttons(true, false);

    for (let i = 0; i < 10; i++) {
        move(0);
        await sleep(speed.value);
        move(1);
        await sleep(speed.value);
    }

    const values = find_highest_corner();

        while (true) {
        for (let i = 0; i < values.length; i++) {
            const value = values[i];
            let changed = move(value);
            if (!changed) {
                // move back and forth
                move(((value + 1) % 2) + i * 2);
                move(value);
            }
            await sleep(speed.value);
        }
    }
}