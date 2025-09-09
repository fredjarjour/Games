// eval.js
// Static evaluation for Duck Chess
// Considers material, piece position, mobility, and duck position

const pieceValues = {
    P: 100,
    N: 600, // Knights are more valuable in Duck Chess
    B: 300,
    R: 500,
    Q: 800,
    K: 0 // King has no value in Duck Chess
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

function evaluate(board, turn, castlingRights = window.castlingRights, enPassantTarget = window.enPassantTarget) {
    let score = 0;
    let duckPenalty = 0;
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
    score -= 5 * duckPenalty;
    return score;
}

window.evaluate = evaluate;
window._duckTransTable = {};

function naiveSearch(board, turn, castlingRights = window.castlingRights, enPassantTarget = window.enPassantTarget, depth = 1) {
    // Returns best eval after 'depth' moves (move + duck) for the given turn
    // Fast board copy function
    function fastBoardCopy(board) {
        const copy = new Array(8);
        for (let i = 0; i < 8; i++) {
            copy[i] = board[i].slice();
        }
        return copy;
    }

    function boardHash(board, turn, castlingRights, enPassantTarget, d) {
        // Compact hash: join all piece codes, plus turn, castling, enPassant, depth
        let boardStr = '';
        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                boardStr += board[r][c] ? board[r][c] : '.';
            }
        }
        // Castling rights as string
        let castlingStr = '';
        castlingStr += castlingRights.W.K ? 'K' : '';
        castlingStr += castlingRights.W.Q ? 'Q' : '';
        castlingStr += castlingRights.B.K ? 'k' : '';
        castlingStr += castlingRights.B.Q ? 'q' : '';
        // En passant as string
        let epStr = enPassantTarget ? (enPassantTarget.row + ',' + enPassantTarget.col) : '-';
        return boardStr + '|' + turn + '|' + castlingStr + '|' + epStr + '|' + d;
    }

    function search(board, turn, castlingRights, enPassantTarget, d, alpha, beta) {
        const hash = boardHash(board, turn, castlingRights, enPassantTarget, d);
        if (window._duckTransTable[hash] !== undefined) {
            return window._duckTransTable[hash];
        }
        if (d === 0) {
            const result = window.evaluate(board, turn, castlingRights, enPassantTarget);
            window._duckTransTable[hash] = result;
            return result;
        }
        let bestEval = turn === 'W' ? -Infinity : Infinity;
        const moves = [];
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const piece = board[row][col];
                if (piece && piece[0] === turn && piece !== 'duck') {
                    const legal = window.getLegalMoves(board, row, col, turn, castlingRights, enPassantTarget);
                    legal.forEach(([toRow, toCol]) => {
                        moves.push({ fromRow: row, fromCol: col, toRow, toCol });
                    });
                }
            }
        }
        // Enhanced move ordering: prioritize captures, promotions, and checks
        function moveScore(move) {
            const target = board[move.toRow][move.toCol];
            let score = 0;
            // Captures: MVV-LVA (Most Valuable Victim - Least Valuable Attacker)
            if (target && target[0] !== turn && target !== 'duck') {
                // Assign higher score for capturing more valuable pieces
                const pieceValues = { 'K': 10000, 'Q': 900, 'R': 500, 'B': 330, 'N': 320, 'P': 100 };
                score += (pieceValues[target[1]] || 0) * 10;
                const attacker = board[move.fromRow][move.fromCol];
                score -= (pieceValues[attacker[1]] || 0);
                score += 1000;
            }
            // Promotion: pawn reaches last rank
            const piece = board[move.fromRow][move.fromCol];
            if (piece && piece[1] === 'P') {
                if ((piece[0] === 'W' && move.toRow === 0) || (piece[0] === 'B' && move.toRow === 7)) score += 500;
            }
            // Simple check detection: if move puts opponent king in check
            // (Assumes getLegalMoves returns moves that can check)
            // If you have a function to detect check, use it here for bonus
            // Example: if (window.isCheck(board, move, turn)) score += 300;
            return score;
        }
        moves.sort((a, b) => moveScore(b) - moveScore(a));

        let bestMove = null;
        for (const move of moves) {
            let boardCopy = fastBoardCopy(board);
            window.makeMove(boardCopy, move.fromRow, move.fromCol, move.toRow, move.toCol, castlingRights, enPassantTarget);
            // Limit duck moves: only adjacent to pieces, or fallback to first N empty squares
            let emptySquares = [];
            for (let r = 0; r < 8; r++) {
                for (let c = 0; c < 8; c++) {
                    if (!boardCopy[r][c]) emptySquares.push([r, c]);
                }
            }
            let duckSquares = [];
            // Find all empty squares adjacent to any piece
            for (const [r, c] of emptySquares) {
                let adjacent = false;
                for (let dr = -1; dr <= 1; dr++) {
                    for (let dc = -1; dc <= 1; dc++) {
                        if (dr === 0 && dc === 0) continue;
                        let nr = r + dr, nc = c + dc;
                        if (nr >= 0 && nr < 8 && nc >= 0 && nc < 8 && boardCopy[nr][nc] && boardCopy[nr][nc] !== 'duck') {
                            adjacent = true;
                        }
                    }
                }
                if (adjacent) duckSquares.push([r, c]);
            }
            // If none found, fallback to first N empty squares
            const N = 4;
            if (duckSquares.length === 0) duckSquares = emptySquares.slice(0, N);
            if (duckSquares.length === 0) continue;
            for (const [duckRow, duckCol] of duckSquares) {
                let boardDuck = fastBoardCopy(boardCopy);
                for (let r = 0; r < 8; r++) {
                    for (let c = 0; c < 8; c++) {
                        if (boardDuck[r][c] === 'duck') boardDuck[r][c] = null;
                    }
                }
                boardDuck[duckRow][duckCol] = 'duck';
                let evalScore = search(boardDuck, turn === 'W' ? 'B' : 'W', castlingRights, enPassantTarget, d - 1, alpha, beta);
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
        window._duckTransTable[hash] = d === depth ? { bestEval, bestMove } : bestEval;
        return window._duckTransTable[hash];
    }
    const result = search(board, turn, castlingRights, enPassantTarget, depth, -Infinity, Infinity);
    return result;
}

window.naiveSearch = naiveSearch;
