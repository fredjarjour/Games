// Returns true if the king of the given color is in check
function isKingInCheck(board, color) {
    // Find king position
    let kingRow = -1, kingCol = -1;
    for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
            if (board[r][c] === color + 'K') {
                kingRow = r;
                kingCol = c;
            }
        }
    }
    if (kingRow === -1) return false; // King not found (should not happen)
    // Check if any enemy piece attacks the king
    const enemy = color === 'W' ? 'B' : 'W';
    for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
            const piece = board[r][c];
            if (piece && piece[0] === enemy && piece !== 'duck') {
                const moves = window.getLegalMoves(board, r, c, enemy);
                for (const [toRow, toCol] of moves) {
                    if (toRow === kingRow && toCol === kingCol) {
                        return true;
                    }
                }
            }
        }
    }
    return false;
}

// Returns true if the given color is checkmated
function isCheckmate(board, color, castlingRights = window.castlingRights, enPassantTarget = window.enPassantTarget) {
    if (!isKingInCheck(board, color)) return false;
    // If no legal move gets out of check, it's checkmate
    for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
            const piece = board[r][c];
            if (piece && piece[0] === color && piece !== 'duck') {
                const moves = window.getLegalMoves(board, r, c, color, castlingRights, enPassantTarget);
                for (const [toRow, toCol] of moves) {
                    // Make the move on a copy
                    let boardCopy = [];
                    for (let i = 0; i < 8; i++) boardCopy[i] = board[i].slice();
                    window.makeMove(boardCopy, r, c, toRow, toCol, JSON.parse(JSON.stringify(castlingRights)), enPassantTarget);
                    if (!isKingInCheck(boardCopy, color)) {
                        return false;
                    }
                }
            }
        }
    }
    return true;
}
// chessLogic.js
// Basic rules for Duck Chess (no check/checkmate)

// Piece movement directions
const directions = {
    P: [[-1, 0]], // Pawn (white moves up)
    N: [
        [-2, -1], [-2, 1], [-1, -2], [-1, 2],
        [1, -2], [1, 2], [2, -1], [2, 1]
    ], // Knight
    B: [[-1, -1], [-1, 1], [1, -1], [1, 1]], // Bishop
    R: [[-1, 0], [1, 0], [0, -1], [0, 1]], // Rook
    Q: [[-1, -1], [-1, 1], [1, -1], [1, 1], [-1, 0], [1, 0], [0, -1], [0, 1]], // Queen
    K: [[-1, -1], [-1, 1], [1, -1], [1, 1], [-1, 0], [1, 0], [0, -1], [0, 1]] // King
};

// Utility to check board bounds
function inBounds(row, col) {
    return row >= 0 && row < 8 && col >= 0 && col < 8;
}

// Castling rights: { W: { K: true, Q: true }, B: { K: true, Q: true } }
window.castlingRights = {
    W: { K: true, Q: true },
    B: { K: true, Q: true }
};

// En passant target: { row: number, col: number } or null
window.enPassantTarget = null;

// Get all legal moves for a piece at (row, col)
// Color is 'W' or 'B'
function getLegalMoves(board, row, col, turn, castlingRights = window.castlingRights, enPassantTarget = window.enPassantTarget) {
    const piece = board[row][col];
    if (!piece || piece === 'duck') return [];
    const color = piece[0];
    if (color !== turn) return []; // Ensure piece matches the player's color
    const type = piece[1];
    let moves = [];

    if (type === 'P') {
        // Pawns move differently for black/white
        const dir = color === 'W' ? -1 : 1;
        const startRow = color === 'W' ? 6 : 1;
        // Forward move
        if (inBounds(row + dir, col) && !board[row + dir][col]) {
            moves.push([row + dir, col]);
            // Double move from start
            if (row === startRow && !board[row + 2 * dir][col]) {
                moves.push([row + 2 * dir, col]);
            }
        }
        // Captures
        for (let dc of [-1, 1]) {
            if (inBounds(row + dir, col + dc)) {
                const target = board[row + dir][col + dc];
                if (target && target[0] !== color && target !== 'duck') {
                    moves.push([row + dir, col + dc]);
                }
            }
        }
        // En passant
        if (enPassantTarget) {
            if (Math.abs(enPassantTarget.col - col) === 1 &&
                enPassantTarget.row === row + dir &&
                row === (color === 'W' ? 3 : 4)) {
                // Only allow en passant if pawn is on correct rank
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
        // Castling (no check logic)
        if (color === 'W' && row === 7 && col === 4) {
            // King-side
            if (castlingRights.W.K &&
                board[7][5] === null && board[7][6] === null &&
                board[7][7] === 'WR') {
                moves.push([7, 6]); // King moves to g1
            }
            // Queen-side
            if (castlingRights.W.Q &&
                board[7][3] === null && board[7][2] === null && board[7][1] === null &&
                board[7][0] === 'WR') {
                moves.push([7, 2]); // King moves to c1
            }
        }
        if (color === 'B' && row === 0 && col === 4) {
            // King-side
            if (castlingRights.B.K &&
                board[0][5] === null && board[0][6] === null &&
                board[0][7] === 'BR') {
                moves.push([0, 6]); // King moves to g8
            }
            // Queen-side
            if (castlingRights.B.Q &&
                board[0][3] === null && board[0][2] === null && board[0][1] === null &&
                board[0][0] === 'BR') {
                moves.push([0, 2]); // King moves to c8
            }
        }
    } else {
        // Sliding pieces: B, R, Q
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

// Move a piece on the board
function makeMove(board, fromRow, fromCol, toRow, toCol, castlingRights = window.castlingRights, enPassantTarget = window.enPassantTarget) {
    const piece = board[fromRow][fromCol];
    // Castling move
    if (piece && piece[1] === 'K' && Math.abs(toCol - fromCol) === 2) {
        // King-side
        if (toCol === 6) {
            board[toRow][5] = board[toRow][7]; // Move rook
            board[toRow][7] = null;
        }
        // Queen-side
        if (toCol === 2) {
            board[toRow][3] = board[toRow][0]; // Move rook
            board[toRow][0] = null;
        }
        // Remove castling rights
        if (piece[0] === 'W') {
            castlingRights.W.K = false;
            castlingRights.W.Q = false;
        } else {
            castlingRights.B.K = false;
            castlingRights.B.Q = false;
        }
    }
    // Remove castling rights if king moves
    if (piece && piece[1] === 'K') {
        if (piece[0] === 'W') {
            castlingRights.W.K = false;
            castlingRights.W.Q = false;
        } else {
            castlingRights.B.K = false;
            castlingRights.B.Q = false;
        }
    }
    // Remove castling rights if rook moves
    if (piece && piece[1] === 'R') {
        if (piece[0] === 'W') {
            if (fromRow === 7 && fromCol === 0) castlingRights.W.Q = false;
            if (fromRow === 7 && fromCol === 7) castlingRights.W.K = false;
        } else {
            if (fromRow === 0 && fromCol === 0) castlingRights.B.Q = false;
            if (fromRow === 0 && fromCol === 7) castlingRights.B.K = false;
        }
    }
    // En passant capture
    if (piece && piece[1] === 'P' && enPassantTarget && toRow === enPassantTarget.row && toCol === enPassantTarget.col) {
        // Remove captured pawn
        const dir = piece[0] === 'W' ? 1 : -1;
        board[toRow + dir][toCol] = null;
    }
    // Set en passant target
    if (piece && piece[1] === 'P' && Math.abs(toRow - fromRow) === 2) {
        window.enPassantTarget = { row: (fromRow + toRow) / 2, col: fromCol };
    } else {
        window.enPassantTarget = null;
    }
    // Promotion: UI will handle
    board[toRow][toCol] = piece;
    board[fromRow][fromCol] = null;
    return board;
}

// Returns true if placing the duck at (row, col) changes any piece's mobility
function isDuckMoveRelevant(board, row, col) {
    // Place duck
    board[row][col] = 'duck';
    let changed = false;
    // Check if any piece's legal moves change
    for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
            const piece = board[r][c];
            if (piece && piece !== 'duck') {
                const movesBefore = window.getLegalMoves(board, r, c, piece[0]).length;
                board[row][col] = null;
                const movesAfter = window.getLegalMoves(board, r, c, piece[0]).length;
                board[row][col] = 'duck';
                if (movesBefore !== movesAfter) {
                    changed = true;
                    break;
                }
            }
        }
        if (changed) break;
    }
    // Remove duck
    board[row][col] = null;
    return changed;
}

// Export functions for use in other scripts
window.getLegalMoves = getLegalMoves;
window.makeMove = makeMove;
window.inBounds = inBounds;
window.isDuckMoveRelevant = isDuckMoveRelevant;
window.isKingInCheck = isKingInCheck;
window.isCheckmate = isCheckmate;
