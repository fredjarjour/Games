const grid = [
  [0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0]
];

let playerTurn = true;
const maxDepthValue = 10;

function clickMaxDepth() {
  document.getElementById("depth").value = maxDepthValue;
}

function changeDepth() {
  document.getElementById("maxDepth").checked = false;
}

function endGame() {
  addWinningSquares();

  document.getElementById("reset").style.display = "block";
}

function addWinningSquares() {
  // Horizontal
  for (let index = 0; index < grid.length; index++) {
    const row = grid[index];

    for (let item = 0; item < row.length-3; item++) {
      if (row[item] === 0) continue;
      
      if (row[item] === row[item + 1] && row[item] === row[item + 2] && row[item] ===  row[item + 3]) {
        for (let i = 0; i < 4; i++) {
          document.getElementById("g" + getGridIndex(item + i, index)).classList.add("winning");
        }
        return;
      }
    }
  }

  // Vertical
  for (let index = 0; index < grid[0].length; index++) {
    for (let rowIndex = 0; rowIndex < grid.length - 3; rowIndex++) {
      const row = grid[rowIndex];
      const element = row[index];
      
      if (element === 0) continue;

      if (element === grid[rowIndex + 1][index] && element === grid[rowIndex + 2][index] && element === grid[rowIndex + 3][index]) {
        for (let i = 0; i < 4; i++) {
          document.getElementById("g" + getGridIndex(index, rowIndex + i)).classList.add("winning");
        }
        return;
      }
    }
  }

  // Diagonals going down (we stop early to have bottom boudary)
  for (let index = 0; index < grid.length - 3; index++) {
    const row = grid[index];

    for (let item = 0; item < row.length; item++) {
      const element = row[item];

      if (element === 0) continue;
      
      // Diagonal going down-left
      if (item >= 3) {
        if (element === grid[index + 1][item - 1] && element === grid[index + 2][item - 2] && element === grid[index + 3][item - 3]) {
          for (let i = 0; i < 4; i++) {
            document.getElementById("g" + getGridIndex(item - i, index + i)).classList.add("winning");
          }
          return;
        }
      }

      // Diagonal going down-right
      if (item <= 3) {
        if (element === grid[index + 1][item + 1] && element === grid[index + 2][item + 2] && element === grid[index + 3][item + 3]) {
          for (let i = 0; i < 4; i++) {
            document.getElementById("g" + getGridIndex(item + i, index + i)).classList.add("winning");
          }
          return;
        }
      }
    }
  }

  return false;
}

function cpuMove(depth) {
  playerTurn = false;

  const start = Date.now();
  result = findBestMove(grid, depth);
  const millis = Date.now() - start;

  prediction = result[0];
  index = result[1];
  let vertIndex = getVerticalIndex(grid, index);

  grid[vertIndex][index] = 1;

  document.getElementById("result").innerHTML = "Prediction: " + prediction + " (depth " + depth + ", " + (millis/1000) +"s)";

  document.getElementById("g" + getGridIndex(index, vertIndex)).classList.add("cpu");

  playerTurn = true;
}

function playerMove(index) {
  if (!playerTurn) return;

  let vertIndex = getVerticalIndex(grid, index);
  grid[vertIndex][index] = -1;
  document.getElementById("g" + getGridIndex(index, vertIndex)).classList.add("player");
}

function checkEnd(player) {
  if (isWin(grid)) {
    document.getElementById("result").innerHTML = player + " Wins! Refresh to restart";
    endGame();
    return true;
  } else if (isDraw(grid)) {
    document.getElementById("result").innerHTML = "Draw! Refresh to restart";
    endGame();
    return true;
  }

  return false;
}

function clickGrid(index) {
  if (getVerticalIndex(grid, index) == grid.length) return;

  playerMove(index);
  playerTurn = false;

  if (checkEnd("Player")) return;

  const maxDepth = document.getElementById("maxDepth").checked;
  let depth;

  if (maxDepth) depth = maxDepthValue;
  else depth = document.getElementById("depth").value;

  cpuMove(depth);

  if (checkEnd("Computer")) return;
  
  playerTurn = true;
}

function getVerticalIndex(grid, index) {
  if (grid[0][index] != 0) return grid.length;

  for (let i = 0; i < grid.length; i++) {
    const row = grid[i];
    
    if (row[index] != 0) {
      return i - 1;
    }
  }
  return grid.length - 1;
}

function getGridIndex(index, vertIndex) {
  return vertIndex * grid[0].length + index
}

function isWin(grid) {
  const checkHorizontal = grid[grid.length - 1].filter(x => x !== 0).length >= 4;
  const checkVertical = grid[grid.length - 4].includes(1) || grid[grid.length - 4].includes(-1);

  // Horizontal
  if (checkHorizontal) {
    for (let index = 0; index < grid.length; index++) {
      const row = grid[index];
  
      for (let item = 0; item < row.length-3; item++) {
        if (row[item] === 0) continue;
        
        if (row[item] === row[item + 1] && row[item] === row[item + 2] && row[item] ===  row[item + 3]) return true;
      }
    }
  }

  // Vertical
  if (checkVertical) {
    for (let index = 0; index < grid[0].length; index++) {
      for (let rowIndex = 0; rowIndex < grid.length - 3; rowIndex++) {
        const row = grid[rowIndex];
        const element = row[index];
        
        if (element === 0) continue;
  
        if (element === grid[rowIndex + 1][index] && element === grid[rowIndex + 2][index] && element === grid[rowIndex + 3][index]) return true;
      }
    }
  }  

  // Diagonals going down (we stop early to have bottom boudary)
  if (checkHorizontal && checkVertical) {
    for (let index = 0; index < grid.length - 3; index++) {
      const row = grid[index];
  
      for (let item = 0; item < row.length; item++) {
        const element = row[item];
  
        if (element === 0) continue;
        
        // Diagonal going down-left
        if (item >= 3) {
          if (element === grid[index + 1][item - 1] && element === grid[index + 2][item - 2] && element === grid[index + 3][item - 3]) return true;
        }
  
        // Diagonal going down-right
        if (item <= 3) {
          if (element === grid[index + 1][item + 1] && element === grid[index + 2][item + 2] && element === grid[index + 3][item + 3]) return true;
        }
      }
    }
  }

  return false;
}

function isDraw(grid) {
  // Assumes there is no win
  for (let i = 0; i < grid.length; i++) {
    const row = grid[i];
    
    if (row.includes(0)) return false;
  }
  return true;
}

function playMove(grid, index, value) {
  let newGrid = grid.map((row) => [...row]);
  let vertIndex = getVerticalIndex(newGrid, index);
  newGrid[vertIndex][index] = value;
  return newGrid;
}

function getRandomIndex(grid) {
  let nums = [0,1,2,3,4,5,6].sort(() => Math.random() - 0.5);

  for (let i = 0; i < nums.length; i++) {
    if (getVerticalIndex(grid, nums[i]) < grid.length) return nums[i];
  }
}

// Search
let cache = new Map();

// myTurn is 1 for yes, -1 for no
function findBestMove(grid, depth = 3, myTurn = 1, alpha = Number.NEGATIVE_INFINITY, beta = Number.POSITIVE_INFINITY) {
  const key = JSON.stringify(grid);

  if (cache.has(key) && cache.get(key)[1] >= depth) return cache.get(key)[0];

  // Win on the previous turn
  if (isWin(grid)) {
    cache.set(key, [[-myTurn * 100, -1], Number.POSITIVE_INFINITY]);
    return [-myTurn * 100, -1];
  }
  
  // Draw
  if (isDraw(grid)) {
    cache.set(key, [[0, -1], Number.POSITIVE_INFINITY]);
    return [0, -1];
  }

  if (depth === 0) return [staticEval(grid), -1]; // Do not store this in cache

  if (myTurn === 1) {
    let value = Number.NEGATIVE_INFINITY;
    let bestMove = null;
    for (let index = 0; index < grid[0].length; index++) {
      if (getVerticalIndex(grid, index) === grid.length) continue;

      let result = findBestMove(playMove(grid, index, myTurn), depth - 1, -myTurn, alpha, beta)[0];

      if (result > value) {
        value = result;
        bestMove = index;
      }

      if (value > beta) break;
      alpha = Math.max(alpha, value);
    }

    return [value, bestMove];
  } else {
    let value = Number.POSITIVE_INFINITY;
    let bestMove = null;
    for (let index = 0; index < grid[0].length; index++) {
      if (getVerticalIndex(grid, index) === grid.length) continue;

      let result = findBestMove(playMove(grid, index, myTurn), depth - 1, -myTurn, alpha, beta)[0];

      if (result[0] === -myTurn * 100) return [-myTurn * 100, index];

      if (result < value) {
        value = result;
        bestMove = index;
      }

      if (value < alpha) break;
      beta = Math.min(beta, value);
    }
    cache.set(key, [[value, bestMove], depth]);
    return [value, bestMove];
  }
}

const values = [
  [3, 4, 5, 7, 5, 4, 3],
  [4, 6, 8, 10, 8, 6, 4],
  [5, 8, 11, 13, 11, 8, 5], 
  [5, 8, 11, 13, 11, 8, 5],
  [4, 6, 8, 10, 8, 6, 4],
  [3, 4, 5, 7, 5, 4, 3]
];

// Function to evaluate potential winning moves (threats) and player connectivity
function getScores(grid) {
  let positionValues = 0;
  let playerThreats = 0;
  let playerConnectivity = 0;
  let opponentWinningPositions = 0;

  // Check horizontally and vertically for threats and connectivity
  for (let y = 0; y < grid.length; y++) {
    for (let x = 0; x < grid[y].length; x++) {
      // Positional value
      positionValues += grid[y][x] * values[y][x];

      // Horizontal check
      if (x <= grid[y].length - 4) {
        const horizontalLine = grid[y].slice(x, x + 4);
        const horizontalPlayerCount = horizontalLine.filter(cell => cell === 1).length;
        const horizontalOpponentCount = horizontalLine.filter(cell => cell === -1).length;
        if (horizontalPlayerCount === 3 && !horizontalLine.includes(-1)) playerThreats++;
        if (horizontalPlayerCount >= 2 && horizontalOpponentCount === 0) playerConnectivity++;
        if (horizontalOpponentCount === 3 && !horizontalLine.includes(1)) opponentWinningPositions++;
      }

      // Vertical check
      if (y <= grid.length - 4) {
        const verticalLine = [grid[y][x], grid[y + 1][x], grid[y + 2][x], grid[y + 3][x]];
        const verticalPlayerCount = verticalLine.filter(cell => cell === 1).length;
        const verticalOpponentCount = verticalLine.filter(cell => cell === -1).length;
        if (verticalPlayerCount === 3 && !verticalLine.includes(-1)) playerThreats++;
        if (verticalPlayerCount >= 2 && verticalOpponentCount === 0) playerConnectivity++;
        if (verticalOpponentCount === 3 && !verticalLine.includes(1)) opponentWinningPositions++;
      }
    }
  }

  return [positionValues, playerThreats, playerConnectivity, opponentWinningPositions];
}

// Weights
const positionsWeight = 0.1;
const threatsWeight = 2;
const connectivityWeight = 1.2;
const blockadesWeight = 1.5;

function staticEval(grid) {
  let total = 0;

  const [positions, threats, connectivity, blockades] = getScores(grid);

  total += positions * positionsWeight;
  total += threats * threatsWeight;
  total += connectivity * connectivityWeight;
  total += blockades * blockadesWeight;

  return total;
}

function reset() {
  location.reload();
}