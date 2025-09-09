// --- King in check detection ---
function findKing(board, color) {
    for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
            if (board[r][c] === color + 'K') return [r, c];
        }
    }
    return null;
}

function isSquareAttacked(board, row, col, attackerColor, castlingRights, enPassantTarget) {
    // For each piece of attackerColor, see if it can move to (row, col)
    for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
            const piece = board[r][c];
            if (piece && piece[0] === attackerColor && piece !== 'duck') {
                const moves = getLegalMoves(board, r, c, attackerColor, castlingRights, enPassantTarget);
                for (const [mr, mc] of moves) {
                    if (mr === row && mc === col) return true;
                }
            }
        }
    }
    return false;
}

function isKingInCheck(board, color, castlingRights, enPassantTarget) {
    const kingPos = findKing(board, color);
    if (!kingPos) return true; // King missing = checkmate
    const [kr, kc] = kingPos;
    const opponent = color === 'W' ? 'B' : 'W';
    return isSquareAttacked(board, kr, kc, opponent, castlingRights, enPassantTarget);
}
// duckWorker.js
// Web Worker for DuckChess bot search

// Import dependencies (copy relevant code from eval.js, chessLogic.js)
// For demo, we include only naiveSearch and dependencies


// --- Piece values and position bonuses ---
const pieceValues = {
    P: 100,
    N: 600,
    B: 300,
    R: 500,
    Q: 800,
    K: 0
};
const positionBonus = {
    P: [
        [0, 0, 0, 0, 0, 0, 0, 0],
        [5, 10, 10, -20, -20, 10, 10, 5],
        [5, -5, -10, 0, 0, -10, -5, 5],
        [0, 0, 0, 20, 20, 0, 0, 0],
        [5, 5, 10, 25, 25, 10, 5, 5],
        [10, 10, 20, 30, 30, 20, 10, 10],
        [50, 50, 50, 50, 50, 50, 50, 50],
        [0, 0, 0, 0, 0, 0, 0, 0]
    ],
    N: [
        [-50, -40, -30, -30, -30, -30, -40, -50],
        [-40, -20, 0, 0, 0, 0, -20, -40],
        [-30, 0, 10, 15, 15, 10, 0, -30],
        [-30, 5, 15, 20, 20, 15, 5, -30],
        [-30, 0, 15, 20, 20, 15, 0, -30],
        [-30, 5, 10, 15, 15, 10, 5, -30],
        [-40, -20, 0, 5, 5, 0, -20, -40],
        [-50, -40, -30, -30, -30, -30, -40, -50]
    ],
    B: [
        [-20, -10, -10, -10, -10, -10, -10, -20],
        [-10, 0, 0, 0, 0, 0, 0, -10],
        [-10, 0, 5, 10, 10, 5, 0, -10],
        [-10, 5, 5, 10, 10, 5, 5, -10],
        [-10, 0, 10, 10, 10, 10, 0, -10],
        [-10, 10, 10, 10, 10, 10, 10, -10],
        [-10, 5, 0, 0, 0, 0, 5, -10],
        [-20, -10, -10, -10, -10, -10, -10, -20]
    ],
    R: [
        [0, 0, 0, 5, 5, 0, 0, 0],
        [-5, 0, 0, 0, 0, 0, 0, -5],
        [-5, 0, 0, 0, 0, 0, 0, -5],
        [-5, 0, 0, 0, 0, 0, 0, -5],
        [-5, 0, 0, 0, 0, 0, 0, -5],
        [-5, 0, 0, 0, 0, 0, 0, -5],
        [5, 10, 10, 10, 10, 10, 10, 5],
        [0, 0, 0, 0, 0, 0, 0, 0]
    ],
    Q: [
        [-20, -10, -10, -5, -5, -10, -10, -20],
        [-10, 0, 0, 0, 0, 0, 0, -10],
        [-10, 0, 5, 5, 5, 5, 0, -10],
        [-5, 0, 5, 5, 5, 5, 0, -5],
        [0, 0, 5, 5, 5, 5, 0, -5],
        [-10, 5, 5, 5, 5, 5, 0, -10],
        [-10, 0, 5, 0, 0, 0, 0, -10],
        [-20, -10, -10, -5, -5, -10, -10, -20]
    ]
};

function evaluate(board, turn, castlingRights, enPassantTarget) {
    let score = 0;
    for (let row = 0; row < 8; row++) {
        for (let col = 0; col < 8; col++) {
            const piece = board[row][col];
            if (!piece || piece === 'duck') continue;
            const color = piece[0];
            const type = piece[1];
            let value = pieceValues[type] || 0;
            let posBonus = positionBonus[type] ? positionBonus[type][row][col] : 0;
            if (color === 'W') {
                score += value + posBonus;
            } else {
                score -= value + posBonus;
            }
        }
    }
    return score;
}


// Flat board representation and fast copy
function flattenBoard(board) {
    // Converts 2D board to flat array
    const flat = new Array(64);
    for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
            flat[r * 8 + c] = board[r][c];
        }
    }
    return flat;
}
function unflattenBoard(flat) {
    // Converts flat array back to 2D board
    const board = new Array(8);
    for (let r = 0; r < 8; r++) {
        board[r] = new Array(8);
        for (let c = 0; c < 8; c++) {
            board[r][c] = flat[r * 8 + c];
        }
    }
    return board;
}
function fastBoardCopy(board) {
    // Always return a deep 2D copy
    if (Array.isArray(board) && board.length === 64) {
        // Convert flat to 2D and deep copy
        const twoD = unflattenBoard(board);
        const copy = new Array(8);
        for (let i = 0; i < 8; i++) copy[i] = twoD[i].slice();
        return copy;
    }
    // If already 2D
    const copy = new Array(8);
    for (let i = 0; i < 8; i++) copy[i] = board[i].slice();
    return copy;
}

// --- Move generation and board logic ---
// Returns true if placing the duck at (row, col) changes any piece's mobility for the given color
function isDuckMoveRelevant(board, row, col, color, castlingRights, enPassantTarget) {
    // Place duck
    board[row][col] = 'duck';
    let changed = false;
    for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
            const piece = board[r][c];
            if (piece && piece !== 'duck' && piece[0] === color) {
                // Get moves before and after duck placement
                const movesBefore = getLegalMoves(board, r, c, color, castlingRights, enPassantTarget).length;
                board[row][col] = null;
                const movesAfter = getLegalMoves(board, r, c, color, castlingRights, enPassantTarget).length;
                board[row][col] = 'duck';
                if (movesBefore !== movesAfter) {
                    changed = true;
                    break;
                }
            }
        }
        if (changed) break;
    }
    board[row][col] = null;
    return changed;
}
const directions = {
    P: [[-1, 0]],
    N: [
        [-2, -1], [-2, 1], [-1, -2], [-1, 2],
        [1, -2], [1, 2], [2, -1], [2, 1]
    ],
    B: [[-1, -1], [-1, 1], [1, -1], [1, 1]],
    R: [[-1, 0], [1, 0], [0, -1], [0, 1]],
    Q: [[-1, -1], [-1, 1], [1, -1], [1, 1], [-1, 0], [1, 0], [0, -1], [0, 1]],
    K: [[-1, -1], [-1, 1], [1, -1], [1, 1], [-1, 0], [1, 0], [0, -1], [0, 1]]
};
function inBounds(row, col) {
    return row >= 0 && row < 8 && col >= 0 && col < 8;
}
function getLegalMoves(board, row, col, turn, castlingRights, enPassantTarget) {
    const piece = board[row][col];
    if (!piece || piece === 'duck') return [];
    const color = piece[0];
    if (color !== turn) return [];
    const type = piece[1];
    let moves = [];
    if (type === 'P') {
        const dir = color === 'W' ? -1 : 1;
        const startRow = color === 'W' ? 6 : 1;
        if (inBounds(row + dir, col) && !board[row + dir][col]) {
            moves.push([row + dir, col]);
            if (row === startRow && !board[row + 2 * dir][col]) {
                moves.push([row + 2 * dir, col]);
            }
        }
        for (let dc of [-1, 1]) {
            if (inBounds(row + dir, col + dc)) {
                const target = board[row + dir][col + dc];
                if (target && target[0] !== color && target !== 'duck') {
                    moves.push([row + dir, col + dc]);
                }
            }
        }
        if (enPassantTarget) {
            if (Math.abs(enPassantTarget.col - col) === 1 &&
                enPassantTarget.row === row + dir &&
                row === (color === 'W' ? 3 : 4)) {
                moves.push([enPassantTarget.row, enPassantTarget.col]);
            }
        }
    } else if (type === 'N') {
        for (let [dr, dc] of directions.N) {
            const nr = row + dr, nc = col + dc;
            if (inBounds(nr, nc)) {
                const target = board[nr][nc];
                if (!target || (target[0] !== color && target !== 'duck')) {
                    moves.push([nr, nc]);
                }
            }
        }
    } else if (type === 'K') {
        for (let [dr, dc] of directions.K) {
            const nr = row + dr, nc = col + dc;
            if (inBounds(nr, nc)) {
                const target = board[nr][nc];
                if (!target || (target[0] !== color && target !== 'duck')) {
                    moves.push([nr, nc]);
                }
            }
        }
        if (color === 'W' && row === 7 && col === 4) {
            if (castlingRights.W.K &&
                board[7][5] === null && board[7][6] === null &&
                board[7][7] === 'WR') {
                moves.push([7, 6]);
            }
            if (castlingRights.W.Q &&
                board[7][3] === null && board[7][2] === null && board[7][1] === null &&
                board[7][0] === 'WR') {
                moves.push([7, 2]);
            }
        }
        if (color === 'B' && row === 0 && col === 4) {
            if (castlingRights.B.K &&
                board[0][5] === null && board[0][6] === null &&
                board[0][7] === 'BR') {
                moves.push([0, 6]);
            }
            if (castlingRights.B.Q &&
                board[0][3] === null && board[0][2] === null && board[0][1] === null &&
                board[0][0] === 'BR') {
                moves.push([0, 2]);
            }
        }
    } else {
        const dirs = directions[type];
        for (let [dr, dc] of dirs) {
            let nr = row + dr, nc = col + dc;
            while (inBounds(nr, nc)) {
                const target = board[nr][nc];
                if (!target) {
                    moves.push([nr, nc]);
                } else {
                    if (target[0] !== color && target !== 'duck') {
                        moves.push([nr, nc]);
                    }
                    break;
                }
                nr += dr;
                nc += dc;
            }
        }
    }
    return moves;
}
function makeMove(board, fromRow, fromCol, toRow, toCol, castlingRights, enPassantTarget) {
    const piece = board[fromRow][fromCol];
    if (piece && piece[1] === 'K' && Math.abs(toCol - fromCol) === 2) {
        if (toCol === 6) {
            board[toRow][5] = board[toRow][7];
            board[toRow][7] = null;
        }
        if (toCol === 2) {
            board[toRow][3] = board[toRow][0];
            board[toRow][0] = null;
        }
        if (piece[0] === 'W') {
            castlingRights.W.K = false;
            castlingRights.W.Q = false;
        } else {
            castlingRights.B.K = false;
            castlingRights.B.Q = false;
        }
    }
    if (piece && piece[1] === 'K') {
        if (piece[0] === 'W') {
            castlingRights.W.K = false;
            castlingRights.W.Q = false;
        } else {
            castlingRights.B.K = false;
            castlingRights.B.Q = false;
        }
    }
    if (piece && piece[1] === 'R') {
        if (piece[0] === 'W') {
            if (fromRow === 7 && fromCol === 0) castlingRights.W.Q = false;
            if (fromRow === 7 && fromCol === 7) castlingRights.W.K = false;
        } else {
            if (fromRow === 0 && fromCol === 0) castlingRights.B.Q = false;
            if (fromRow === 0 && fromCol === 7) castlingRights.B.K = false;
        }
    }
    if (piece && piece[1] === 'P' && enPassantTarget && toRow === enPassantTarget.row && toCol === enPassantTarget.col) {
        const dir = piece[0] === 'W' ? 1 : -1;
        board[toRow + dir][toCol] = null;
    }
    if (piece && piece[1] === 'P' && Math.abs(toRow - fromRow) === 2) {
        enPassantTarget = { row: (fromRow + toRow) / 2, col: fromCol };
    } else {
        enPassantTarget = null;
    }
    board[toRow][toCol] = piece;
    board[fromRow][fromCol] = null;
    return board;
}

// --- Bot search (naiveSearch) ---

// Global transposition table
if (!self._duckTransTable) self._duckTransTable = {};

function naiveSearch(board, turn, castlingRights, enPassantTarget, depth) {
    let transTable = self._duckTransTable;
    let profiling = {
        eval: 0,
        movegen: 0,
        boardcopy: 0,
        duckcopy: 0,
        search: 0,
        total: 0
    };
    // Zobrist-like hash for board position
    const zobristTable = (() => {
        if (self._zobristTable) return self._zobristTable;
        const table = [];
        const pieces = ['WP','WN','WB','WR','WQ','WK','BP','BN','BB','BR','BQ','BK','duck'];
        for (let i = 0; i < 8 * 8; i++) {
            table[i] = {};
            for (const p of pieces) {
                table[i][p] = Math.floor(Math.random() * 1e9);
            }
        }
        self._zobristTable = table;
        return table;
    })();
    function boardHash(board, turn, castlingRights, enPassantTarget, d) {
        let h = 0;
        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                const piece = board[r][c];
                if (piece) {
                    h ^= zobristTable[r * 8 + c][piece];
                }
            }
        }
        // Add turn
        h ^= turn === 'W' ? 123456789 : 987654321;
        // Add castling rights
        if (castlingRights.W.K) h ^= 111;
        if (castlingRights.W.Q) h ^= 222;
        if (castlingRights.B.K) h ^= 333;
        if (castlingRights.B.Q) h ^= 444;
        // Add en passant
        if (enPassantTarget) h ^= (enPassantTarget.row * 8 + enPassantTarget.col) * 17;
        // Add depth
        h ^= d * 31;
        return h;
    }
    function search(board, turn, castlingRights, enPassantTarget, d, alpha, beta) {
        const hash = boardHash(board, turn, castlingRights, enPassantTarget, d);
        if (transTable[hash] !== undefined) {
            return transTable[hash];
        }
        if (d === 0) {
            const t0 = performance.now();
            const result = evaluate(board, turn, castlingRights, enPassantTarget);
            profiling.eval += performance.now() - t0;
            transTable[hash] = result;
            return result;
        }
        let bestEval = turn === 'W' ? -Infinity : Infinity;
        const tMovegen0 = performance.now();
        const moves = [];
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const piece = board[row][col];
                if (piece && piece[0] === turn && piece !== 'duck') {
                    const legal = getLegalMoves(board, row, col, turn, castlingRights, enPassantTarget);
                    for (const [toRow, toCol] of legal) {
                        // Make move on a copy
                        let boardCopy = fastBoardCopy(board);
                        let crCopy = JSON.parse(JSON.stringify(castlingRights));
                        let epCopy = enPassantTarget ? { ...enPassantTarget } : null;
                        makeMove(boardCopy, row, col, toRow, toCol, crCopy, epCopy);
                        // Remove any duck
                        for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++) if (boardCopy[r][c] === 'duck') boardCopy[r][c] = null;
                        // If king is in check after move, skip
                        if (isKingInCheck(boardCopy, turn, crCopy, epCopy)) continue;
                        moves.push({ fromRow: row, fromCol: col, toRow, toCol });
                    }
                }
            }
        }
        profiling.movegen += performance.now() - tMovegen0;
        function moveScore(move) {
            const target = board[move.toRow][move.toCol];
            const piece = board[move.fromRow][move.fromCol];
            let score = 0;
            if (target && target[0] !== turn && target !== 'duck') {
                const victimValue = pieceValues[target[1]] || 0;
                const attackerValue = pieceValues[piece[1]] || 0;
                score += 10000 + victimValue - attackerValue;
            }
            if (piece && piece[1] === 'P') {
                if ((piece[0] === 'W' && move.toRow === 0) || (piece[0] === 'B' && move.toRow === 7)) score += 5000;
            }
            if (move.toRow >= 2 && move.toRow <= 5 && move.toCol >= 2 && move.toCol <= 5) score += 100;
            return score;
        }
        moves.sort((a, b) => moveScore(b) - moveScore(a));
        let bestMove = null;
        for (const move of moves) {
            const tBoardCopy0 = performance.now();
            let boardCopy = fastBoardCopy(board);
            profiling.boardcopy += performance.now() - tBoardCopy0;
            let crCopy = JSON.parse(JSON.stringify(castlingRights));
            let epCopy = enPassantTarget ? { ...enPassantTarget } : null;
            makeMove(boardCopy, move.fromRow, move.fromCol, move.toRow, move.toCol, crCopy, epCopy);
            let emptySquares = [];
            for (let r = 0; r < 8; r++) {
                for (let c = 0; c < 8; c++) {
                    if (!boardCopy[r][c]) emptySquares.push([r, c]);
                }
            }
            let duckSquares = [];
            let opponent = turn === 'W' ? 'B' : 'W';
            for (const [r, c] of emptySquares) {
                let adjacentOpponent = false;
                for (let dr = -1; dr <= 1; dr++) {
                    for (let dc = -1; dc <= 1; dc++) {
                        if (dr === 0 && dc === 0) continue;
                        let nr = r + dr, nc = c + dc;
                        if (nr >= 0 && nr < 8 && nc >= 0 && nc < 8) {
                            let adjPiece = boardCopy[nr][nc];
                            if (adjPiece && adjPiece !== 'duck' && adjPiece[0] === opponent) {
                                adjacentOpponent = true;
                            }
                        }
                    }
                }
                if (adjacentOpponent) duckSquares.push([r, c]);
            }
            const N = 4;
            if (duckSquares.length === 0) {
                for (const [r, c] of emptySquares) {
                    let adjacentAny = false;
                    for (let dr = -1; dr <= 1; dr++) {
                        for (let dc = -1; dc <= 1; dc++) {
                            if (dr === 0 && dc === 0) continue;
                            let nr = r + dr, nc = c + dc;
                            if (nr >= 0 && nr < 8 && nc >= 0 && nc < 8 && boardCopy[nr][nc] && boardCopy[nr][nc] !== 'duck') {
                                adjacentAny = true;
                            }
                        }
                    }
                    if (adjacentAny) duckSquares.push([r, c]);
                }
            }
            if (duckSquares.length === 0) duckSquares = emptySquares.slice(0, N);
            if (duckSquares.length === 0) continue;

            // Only consider duck placements that do NOT leave our king in check
            let legalDuckSquares = [];
            for (const [duckRow, duckCol] of duckSquares) {
                const tDuckCopy0 = performance.now();
                let boardDuck = fastBoardCopy(boardCopy);
                profiling.duckcopy += performance.now() - tDuckCopy0;
                for (let r = 0; r < 8; r++) {
                    for (let c = 0; c < 8; c++) {
                        if (boardDuck[r][c] === 'duck') boardDuck[r][c] = null;
                    }
                }
                boardDuck[duckRow][duckCol] = 'duck';
                let crDuck = JSON.parse(JSON.stringify(crCopy));
                let epDuck = epCopy ? { ...epCopy } : null;
                // If our king is in check after duck placement, skip this duck placement
                if (isKingInCheck(boardDuck, turn, crDuck, epDuck)) continue;
                legalDuckSquares.push([duckRow, duckCol]);
            }
            if (legalDuckSquares.length === 0) continue; // No legal duck placements for this move

            for (const [duckRow, duckCol] of legalDuckSquares) {
                const tDuckCopy0 = performance.now();
                let boardDuck = fastBoardCopy(boardCopy);
                profiling.duckcopy += performance.now() - tDuckCopy0;
                for (let r = 0; r < 8; r++) {
                    for (let c = 0; c < 8; c++) {
                        if (boardDuck[r][c] === 'duck') boardDuck[r][c] = null;
                    }
                }
                boardDuck[duckRow][duckCol] = 'duck';
                let crDuck = JSON.parse(JSON.stringify(crCopy));
                let epDuck = epCopy ? { ...epCopy } : null;
                const tSearch0 = performance.now();
                let evalScore = search(boardDuck, turn === 'W' ? 'B' : 'W', crDuck, epDuck, d - 1, alpha, beta);
                profiling.search += performance.now() - tSearch0;
                if (turn === 'W') {
                    if (evalScore > bestEval) {
                        bestEval = evalScore;
                        bestMove = { move, duckRow, duckCol };
                    }
                    alpha = Math.max(alpha, bestEval);
                    if (beta <= alpha) break;
                } else {
                    if (evalScore < bestEval) {
                        bestEval = evalScore;
                        bestMove = { move, duckRow, duckCol };
                    }
                    beta = Math.min(beta, bestEval);
                    if (beta <= alpha) break;
                }
            }
        }
        transTable[hash] = d === depth ? { bestEval, bestMove } : bestEval;
        return transTable[hash];
    }
    const tTotal0 = performance.now();
    const result = search(board, turn, castlingRights, enPassantTarget, depth, -Infinity, Infinity);
    profiling.total = performance.now() - tTotal0;
    return { bestMove: result.bestMove, profiling };
}

self.onmessage = function(e) {
    const { board, turn, castlingRights, enPassantTarget, depth } = e.data;
    console.log('[DuckWorker] Searching at depth ', depth);
    // Ensure board is 2D and deep copy
    let boardCopy = board;
    if (Array.isArray(boardCopy) && boardCopy.length === 64) {
        boardCopy = unflattenBoard(boardCopy);
    }
    boardCopy = fastBoardCopy(boardCopy);
    const crCopy = JSON.parse(JSON.stringify(castlingRights));
    const epCopy = enPassantTarget ? { ...enPassantTarget } : null;
    const result = naiveSearch(boardCopy, turn, crCopy, epCopy, depth);
    self.postMessage({ result: result.bestMove, profiling: result.profiling });
};

// You will need to copy:
// - pieceValues, positionBonus
// - evaluate
// - fastBoardCopy
// - naiveSearch (with transposition table, move ordering, duck move limiting)
// - getLegalMoves, makeMove, inBounds (from chessLogic.js)
// And any other dependencies used by naiveSearch
