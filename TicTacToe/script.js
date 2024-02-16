const grid = [0,0,0,0,0,0,0,0,0];

let playerTurn = true;

function cpuStart() {
  document.getElementById("cpustart").innerHTML = "";
  playerTurn = false;

  result = findBestMove(grid);

  prediction = result[0];
  index = result[1];

  document.getElementById("result").innerHTML = "Prediction: " + prediction;

  grid[index] = 1;
  document.getElementById("g" + index).innerHTML = "O";

  if (isWin(grid)) {
    document.getElementById("result").innerHTML = "Computer Wins! Refresh to restart";
  } else if (isDraw(grid)) {
    document.getElementById("result").innerHTML = "Draw! Refresh to restart";
  }

  playerTurn = true;
}

function clickGrid(index) {
  document.getElementById("cpustart").innerHTML = "";
  if (!playerTurn) return;

  grid[index] = -1;
  document.getElementById("g" + index).innerHTML = "X";
  playerTurn = false;

  if (isWin(grid)) {
    document.getElementById("result").innerHTML = "Player Wins! Refresh to restart";
    return;
  } else if (isDraw(grid)) {
    document.getElementById("result").innerHTML = "Draw! Refresh to restart";
    return;
  }

  result = findBestMove(grid);

  prediction = result[0];
  index = result[1];

  document.getElementById("result").innerHTML = "Prediction: " + prediction;

  grid[index] = 1;
  document.getElementById("g" + index).innerHTML = "O";

  if (isWin(grid)) {
    document.getElementById("result").innerHTML = "Computer Wins! Refresh to restart";
    return;
  } else if (isDraw(grid)) {
    document.getElementById("result").innerHTML = "Draw! Refresh to restart";
    return;
  }

  playerTurn = true;
}

function isSame(grid,idx1,idx2,idx3) {
  return grid[idx1] == grid[idx2] && grid[idx2] == grid[idx3] && grid[idx1] != 0;
}

function isWin(grid) {
  // Horizontal
  if (isSame(grid,0,1,2) || isSame(grid,3,4,5) || isSame(grid,6,7,8)) return true;

  // Vertical
  if (isSame(grid,0,3,6) || isSame(grid,1,4,7) || isSame(grid,2,5,8)) return true;

  // Diagonal
  if (isSame(grid,0,4,8) || isSame(grid,2,4,6)) return true;

  return false;
}

function isDraw(grid) {
  // Assumes there is no win
  return !grid.includes(0);
}

function playMove(grid, index, value) {
  let newGrid = [...grid];
  newGrid[index] = value;
  return newGrid;
}


// Search

// myTurn is 1 for yes, -1 for no
function findBestMove(grid, myTurn = 1) {
  // Win on the previous turn
  if (isWin(grid)) return [-myTurn, -1];

  // Draw
  if (!grid.includes(0)) return [0, -1];

  let draws = [];
  let wins = [];

  for (let index = 0; index < grid.length; index++) {
    const element = grid[index];

    if (element != 0) continue;

    let result = findBestMove(playMove(grid, index, myTurn), -myTurn);

    if (result[0] == 0) {
      draws.push(index);
    } else if (result[0] == myTurn) {
      wins.push(index);
    }
  }

  if (wins.length > 0) return [myTurn, wins[0]];

  if (draws.length > 0) return [0, draws[0]];

  return [-myTurn, grid.indexOf(0)];
}