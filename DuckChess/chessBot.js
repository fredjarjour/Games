// chessBot.js
// Basic Duck Chess bot that plays as black and picks a random legal move

function fastBoardCopy(board) {
    const copy = new Array(8);
    for (let i = 0; i < 8; i++) {
        copy[i] = board[i].slice();
    }
    return copy;
}

function getAllLegalMoves(board, turn, castlingRights = window.castlingRights, enPassantTarget = window.enPassantTarget) {
    let moves = [];
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
    return moves;
}


function botPlayMove(board, castlingRights = window.castlingRights, enPassantTarget = window.enPassantTarget) {
    const moves = getAllLegalMoves(board, 'B', castlingRights, enPassantTarget);
    if (moves.length === 0) return false;
    let safeMoves = [];
    let checkmateMoves = [];
    for (const move of moves) {
        // Make a copy of the board and castling rights
        let boardCopy = fastBoardCopy(board);
        let crCopy = JSON.parse(JSON.stringify(castlingRights));
        window.makeMove(boardCopy, move.fromRow, move.fromCol, move.toRow, move.toCol, crCopy, enPassantTarget);
        // Remove duck for now (botDuckMove will handle it)
        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                if (boardCopy[r][c] === 'duck') boardCopy[r][c] = null;
            }
        }
        // If move leaves king in check, skip
        if (window.isKingInCheck(boardCopy, 'B')) continue;
        // If move checkmates white, prioritize
        if (window.isCheckmate(boardCopy, 'W', crCopy, enPassantTarget)) {
            checkmateMoves.push(move);
        } else {
            safeMoves.push(move);
        }
    }
    let chosenMove = null;
    if (checkmateMoves.length > 0) {
        chosenMove = checkmateMoves[Math.floor(Math.random() * checkmateMoves.length)];
    } else if (safeMoves.length > 0) {
        chosenMove = safeMoves[Math.floor(Math.random() * safeMoves.length)];
    } else {
        // No safe moves, pick any move (will lose)
        chosenMove = moves[Math.floor(Math.random() * moves.length)];
    }
    window.makeMove(board, chosenMove.fromRow, chosenMove.fromCol, chosenMove.toRow, chosenMove.toCol, castlingRights, enPassantTarget);
    return true;
}

function botDuckMove(board) {
    // Find all empty squares
    let emptySquares = [];
    for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
            if (!board[r][c]) emptySquares.push([r, c]);
        }
    }
    if (emptySquares.length === 0) return false;
    const [row, col] = emptySquares[Math.floor(Math.random() * emptySquares.length)];
    for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
            if (board[r][c] === 'duck') board[r][c] = null;
        }
    }
    board[row][col] = 'duck';
    return true;
}

function botPlayBestMove(board, castlingRights = window.castlingRights, enPassantTarget = window.enPassantTarget) {
    const moves = getAllLegalMoves(board, 'B', castlingRights, enPassantTarget);
    if (moves.length === 0) return false;
    let bestEval = Infinity;
    let bestMove = null;
    for (const move of moves) {
        // Make a copy of the board
        let boardCopy = fastBoardCopy(board);
        window.makeMove(boardCopy, move.fromRow, move.fromCol, move.toRow, move.toCol, castlingRights, enPassantTarget);
        // Try all duck moves
        let emptySquares = [];
        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                if (!boardCopy[r][c]) emptySquares.push([r, c]);
            }
        }
        if (emptySquares.length === 0) continue;
        for (const [duckRow, duckCol] of emptySquares) {
            // Move duck
            let boardDuck = fastBoardCopy(boardCopy);
            for (let r = 0; r < 8; r++) {
                for (let c = 0; c < 8; c++) {
                    if (boardDuck[r][c] === 'duck') boardDuck[r][c] = null;
                }
            }
            boardDuck[duckRow][duckCol] = 'duck';
            // Evaluate
            let evalScore = window.evaluate(boardDuck, 'W', castlingRights, enPassantTarget);
            if (evalScore < bestEval) {
                bestEval = evalScore;
                bestMove = { move, duckRow, duckCol };
            }
        }
    }
    if (bestMove) {
        window.makeMove(board, bestMove.move.fromRow, bestMove.move.fromCol, bestMove.move.toRow, bestMove.move.toCol, castlingRights, enPassantTarget);
        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                if (board[r][c] === 'duck') board[r][c] = null;
            }
        }
        board[bestMove.duckRow][bestMove.duckCol] = 'duck';
        return true;
    }
    return false;
}

function botPlayNaiveMove(board, castlingRights = window.castlingRights, enPassantTarget = window.enPassantTarget, depth = 1) {
    const result = window.naiveSearch(board, 'B', castlingRights, enPassantTarget, depth);
    if (!result.bestMove) return false;
    const { move, duckRow, duckCol } = result.bestMove;
    window.makeMove(board, move.fromRow, move.fromCol, move.toRow, move.toCol, castlingRights, enPassantTarget);
    for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
            if (board[r][c] === 'duck') board[r][c] = null;
        }
    }
    board[duckRow][duckCol] = 'duck';
    return true;
}

window.botPlayMove = botPlayMove;
window.botDuckMove = botDuckMove;
window.botPlayBestMove = botPlayBestMove;
window.botPlayNaiveMove = botPlayNaiveMove;
