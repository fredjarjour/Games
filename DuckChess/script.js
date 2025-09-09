const board = document.getElementById('chessboard');


let currentPieces = [
	['BR','BN','BB','BQ','BK','BB','BN','BR'],
	['BP','BP','BP','BP','BP','BP','BP','BP'],
	[null,null,null,null,null,null,null,null],
	[null,null,null,'duck',null,null,null,null],
	[null,null,null,null,null,null,null,null],
	[null,null,null,null,null,null,null,null],
	['WP','WP','WP','WP','WP','WP','WP','WP'],
	['WR','WN','WB','WQ','WK','WB','WN','WR']
];

let currentTurn = 'W'; // 'W' for White, 'B' for Black
let selectedSquare = null;
let legalMoves = [];
let duckMoveMode = false;
let promotionPending = null;
let promotionOptions = ['Q', 'R', 'B', 'N'];

function showPromotionSelect(color, row, col) {
	let selectDiv = document.getElementById('promotion-select');
	if (!selectDiv) {
		selectDiv = document.createElement('div');
		selectDiv.id = 'promotion-select';
		selectDiv.style.textAlign = 'center';
		selectDiv.style.margin = '20px';
		document.body.appendChild(selectDiv);
	}
	selectDiv.innerHTML = '<span>Promote pawn to: </span>';
	const select = document.createElement('select');
	promotionOptions.forEach(opt => {
		const option = document.createElement('option');
		option.value = opt;
		option.text = opt;
		select.appendChild(option);
	});
	selectDiv.appendChild(select);
	const btn = document.createElement('button');
	btn.textContent = 'Promote';
	btn.onclick = function() {
		const piece = color + select.value;
		currentPieces[row][col] = piece;
		promotionPending = null;
		selectDiv.remove();
		UpdateBoard(currentPieces);
	};
	selectDiv.appendChild(btn);
}

function UpdateBoard(pieces, highlightMoves = []) {
	board.innerHTML = '';
	let duckHighlight = duckMoveMode
		? (() => {
			let arr = [];
			for (let r = 0; r < 8; r++) {
				for (let c = 0; c < 8; c++) {
					if (!pieces[r][c]) arr.push([r, c]);
				}
			}
			return arr;
		})()
		: [];
	for (let row = 0; row < 8; row++) {
		for (let col = 0; col < 8; col++) {
			const square = document.createElement('div');
			square.classList.add('square');
			if ((row + col) % 2 === 0) {
				square.classList.add('light');
			} else {
				square.classList.add('dark');
			}

			// Highlight legal moves or duck moves
			if (
				highlightMoves.some(([r, c]) => r === row && c === col) ||
				duckHighlight.some(([r, c]) => r === row && c === col)
			) {
				square.style.boxShadow = '0 0 0 10px yellow inset';
			}

			// Add piece image if present
			const piece = pieces[row][col];
			if (piece) {
				const img = document.createElement('img');
				img.src = `imgs/${piece}.png`;
				img.alt = piece;
				img.style.width = '100px';
				img.style.height = '100px';
				img.style.display = 'block';
				img.style.margin = 'auto';
				square.appendChild(img);
			}

			// Add click handler
			square.addEventListener('click', () => {
				if (promotionPending) return;
				if (duckMoveMode) {
                    if (!piece) {
                        // Move duck to this square
						for (let r = 0; r < 8; r++) {
                            for (let c = 0; c < 8; c++) {
                                if (currentPieces[r][c] === 'duck') {
                                    currentPieces[r][c] = null;
								}
							}
						}
						currentPieces[row][col] = 'duck';
						duckMoveMode = false;
						UpdateBoard(currentPieces);
					}
					return;
				}
                if (currentTurn === 'B') return; // Prevent user moves during bot's turn
				if (!selectedSquare) {
					// Select a piece
					if (piece && piece !== 'duck') {
						selectedSquare = { row, col };
						legalMoves = window.getLegalMoves(currentPieces, row, col, currentTurn);
						UpdateBoard(currentPieces, legalMoves);
					}
				} else {
					// Try to move to this square
					if (legalMoves.some(([r, c]) => r === row && c === col)) {
						currentPieces = JSON.parse(JSON.stringify(currentPieces)); // Deep copy
						window.makeMove(currentPieces, selectedSquare.row, selectedSquare.col, row, col);
						// Check for promotion
						const movedPiece = currentPieces[row][col];
						if (movedPiece && movedPiece[1] === 'P' && ((movedPiece[0] === 'W' && row === 0) || (movedPiece[0] === 'B' && row === 7))) {
							promotionPending = { color: movedPiece[0], row, col };
							showPromotionSelect(movedPiece[0], row, col);
							return;
						}
						selectedSquare = null;
						legalMoves = [];
						currentTurn = currentTurn === 'W' ? 'B' : 'W'; // Switch turn
						duckMoveMode = true;
						UpdateBoard(currentPieces);
					} else {
						// Deselect if clicked elsewhere
						selectedSquare = null;
						legalMoves = [];
						UpdateBoard(currentPieces);
					}
				}
			});

			board.appendChild(square);
		}
	}
}

// Web Worker integration for bot search
let duckWorker = null;
function botPlayIfNeeded() {
	const botDepth = 3; // Change this value to increase bot search depth
	if (currentTurn === 'B' && !duckMoveMode && !promotionPending) {
		if (!duckWorker) {
			duckWorker = new Worker('duckWorker.js');
			duckWorker.onmessage = function(e) {
				const { result, profiling } = e.data;
				if (profiling) {
					// Print profiling summary from worker
					console.log('DuckChess bot profiling summary (worker):');
					for (const key in profiling) {
						let val = profiling[key];
						if (typeof val === 'number') val = val.toFixed(2);
						console.log('  ' + key + ':', val);
					}
				}
				if (result && result.move) {
					// Apply bot move and duck move
					window.makeMove(currentPieces, result.move.fromRow, result.move.fromCol, result.move.toRow, result.move.toCol, window.castlingRights, window.enPassantTarget);
					for (let r = 0; r < 8; r++) {
						for (let c = 0; c < 8; c++) {
							if (currentPieces[r][c] === 'duck') currentPieces[r][c] = null;
						}
					}
					currentPieces[result.duckRow][result.duckCol] = 'duck';
				}
				currentTurn = 'W';
				duckMoveMode = false;
				UpdateBoard(currentPieces);
			};
		}
		// Send board state to worker
		duckWorker.postMessage({
			board: currentPieces,
			turn: 'B',
			castlingRights: window.castlingRights,
			enPassantTarget: window.enPassantTarget,
			depth: botDepth
		});
	}
}

function showEval() {
	let evalDiv = document.getElementById('eval-display');
	if (!evalDiv) {
		evalDiv = document.createElement('div');
		evalDiv.id = 'eval-display';
		evalDiv.style.marginLeft = '30px';
		evalDiv.style.fontSize = '1.3em';
		evalDiv.style.fontWeight = 'bold';
		board.parentNode.insertBefore(evalDiv, board.nextSibling);
	}
	const score = window.evaluate(currentPieces, currentTurn);
	let text = `Eval: ${score > 0 ? '+' : ''}${score.toFixed(1)}`;
	if (score > 0) text += ' (White better)';
	else if (score < 0) text += ' (Black better)';
	else text += ' (Equal)';
	evalDiv.textContent = text;
}

function checkGameEnd() {
	let whiteKing = false, blackKing = false;
	for (let r = 0; r < 8; r++) {
		for (let c = 0; c < 8; c++) {
			if (currentPieces[r][c] === 'WK') whiteKing = true;
			if (currentPieces[r][c] === 'BK') blackKing = true;
		}
	}
	if (!whiteKing || !blackKing) {
		setTimeout(() => {
			if (!whiteKing && !blackKing) {
				alert('Draw! Both kings captured.');
			} else if (!whiteKing) {
				alert('Black wins!');
			} else if (!blackKing) {
				alert('White wins!');
			}
			location.reload();
		}, 100);
	}
}

// Only patch UpdateBoard once and call botPlayIfNeeded once per update
const origUpdateBoard = UpdateBoard;
UpdateBoard = function(pieces, highlightMoves = []) {
	origUpdateBoard(pieces, highlightMoves);
	showEval && showEval();
	checkGameEnd && checkGameEnd();
	if (typeof botPlayIfNeeded === 'function') botPlayIfNeeded();
}

// Initial board setup
const initialPieces = [
	['BR','BN','BB','BQ','BK','BB','BN','BR'],
	['BP','BP','BP','BP','BP','BP','BP','BP'],
	[null,null,null,null,null,null,null,null],
	[null,null,null,'duck',null,null,null,null],
	[null,null,null,null,null,null,null,null],
	[null,null,null,null,null,null,null,null],
	['WP','WP','WP','WP','WP','WP','WP','WP'],
	['WR','WN','WB','WQ','WK','WB','WN','WR']
];

UpdateBoard(initialPieces);
