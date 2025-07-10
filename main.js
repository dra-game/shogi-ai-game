    let board = [];  // 盤面の状態
    let currentTurn = 'player';   // 現在の手番
    let selectedPiece = null;   // 選択中の駒
    let playerCaptured = [];    // プレイヤーの持ち駒
    let aiCaptured = [];    // AIの持ち駒
    let selectedCapturedPiece = null;   // 選択中の持ち駒
    let validMoves = [];    // 移動可能な場所リスト

    function initializeBoard() {
      board = [
        [
          { type: '銀', owner: 'ai' },
          { type: '金', owner: 'ai' },
          { type: '王', owner: 'ai' },
          { type: '金', owner: 'ai' },
          { type: '銀', owner: 'ai' }
        ],
        [null, null, null, null, null],
        [null, null, null, null, null],
        [null, null, null, null, null],
        [
          { type: '銀', owner: 'player' },
          { type: '金', owner: 'player' },
          { type: '王', owner: 'player' },
          { type: '金', owner: 'player' },
          { type: '銀', owner: 'player' }
        ]
      ];
      renderBoard();
      renderCapturedPieces();
    }

    let difficulty = 'normal'; // 初期値

    function setDifficulty(level) {
      difficulty = level;
    }


    
    function renderBoard() {
     const boardElement = document.getElementById('board');
     boardElement.innerHTML = '';
     for (let row = 0; row < 5; row++) {
        for (let col = 0; col < 5; col++) {
            const cell = document.createElement('div');
            cell.className = 'cell';
            cell.onclick = () => handleCellClick(row, col);
            // 選択中の駒の色を変える
            if (selectedPiece && selectedPiece[0] === row && selectedPiece[1] === col) {
                cell.classList.add('selected');
            }
            // 移動可能な場所に色を付ける
            if (validMoves.includes(`${row},${col}`)) {
                cell.classList.add('highlight');
            }

            const piece = board[row][col];
            if (piece) {
                const pieceClass = `piece-${piece.type === '王' ? 'ou' : piece.type === '金' ? 'kin' : 'gin'}`;
                const ownerClass = piece.owner === 'ai' ? 'ai-piece' : 'player-piece';
                cell.classList.add(ownerClass, pieceClass);
            }

            boardElement.appendChild(cell);
        }
     }
    }

    //　持ち駒の表示
    function renderCapturedPieces() {
      // プレイヤーの持ち駒表示
      const playerArea = document.getElementById('playerCaptured');
      playerArea.innerHTML = '';
      playerCaptured.forEach((type, index) => {
        const piece = document.createElement('div');
        piece.className = `captured-piece captured-${type === '王' ? 'ou' : type === '金' ? 'kin' : 'gin'}`;
        if (selectedCapturedPiece && selectedCapturedPiece.index === index) {
          piece.classList.add('captured-selected');
        }
        piece.onclick = () => {
          selectedCapturedPiece = { type, index };
          selectedPiece = null;
          validMoves = [];
          renderBoard();
          renderCapturedPieces();
        };
        playerArea.appendChild(piece);
      });

      // AIの持ち駒表示
      const aiArea = document.getElementById('aiCaptured');
      aiArea.innerHTML = '';
      aiCaptured.forEach((type) => {
        const piece = document.createElement('div');
        piece.className = `captured-piece captured-${type === '王' ? 'ou' : type === '金' ? 'kin' : 'gin'} ai-piece`;
        aiArea.appendChild(piece);
      });
    }


    // プレイヤーの駒の移動がルール上有効か判定
    function isValidMove(fromRow, fromCol, toRow, toCol) {
      const piece = board[fromRow][fromCol];
      if (!piece || piece.owner !== 'player') return false;

      const dRow = toRow - fromRow;
      const dCol = toCol - fromCol;
      const target = board[toRow]?.[toCol];
      if (target && target.owner === 'player') return false;

      // 駒ごとの移動方向パターン
      const directions = {
        '王': [[-1,-1],[-1,0],[-1,1],[0,-1],[0,1],[1,-1],[1,0],[1,1]],
        '金': [[-1,-1],[-1,0],[-1,1],[0,-1],[0,1],[1,0]],
        '銀': [[-1,-1],[-1,0],[-1,1],[1,-1],[1,1]]
      };
      // 移動差分が許される方向か判定
      return directions[piece.type]?.some(([dr, dc]) => dr === dRow && dc === dCol);
    }

    function isValidAIMove(fromRow, fromCol, toRow, toCol) {
      const piece = board[fromRow][fromCol];
      if (!piece || piece.owner !== 'ai') return false;

      const dRow = toRow - fromRow;
      const dCol = toCol - fromCol;
      const target = board[toRow]?.[toCol];
      if (target && target.owner === 'ai') return false;

      const directions = {
        '王': [[-1,-1],[-1,0],[-1,1],[0,-1],[0,1],[1,-1],[1,0],[1,1]],
        '金': [[1,-1],[1,0],[1,1],[0,-1],[0,1],[-1,0]],
        '銀': [[1,-1],[1,0],[1,1],[-1,-1],[-1,1]]
      };

      return directions[piece.type]?.some(([dr, dc]) => dr === dRow && dc === dCol);
    }

    // 盤面のマスの位置価値（中央に近いほど高い）
    function positionValue(row, col) {
      const center = 2;
      const distance = Math.abs(center - row) + Math.abs(center - col);
      return 5 - distance;
    }

    // 持ち駒の価値を合計。AIの持ち駒は加算、プレイヤーの持ち駒は減算
    function capturedValue(pieces, owner) {
      const pieceValues = { '王': 1000, '金': 30, '銀': 20 };
      return pieces.reduce((sum, type) => {
        const value = pieceValues[type] || 0;
        return sum + (owner === 'ai' ? value : -value);
      }, 0);
    }

    // 現在の盤面と持ち駒から総合評価値を計算
    function evaluateBoard(boardState, playerCap, aiCap) {
      const pieceValues = { '王': 1000, '金': 30, '銀': 20 };
      let score = 0;
      for (let row = 0; row < 5; row++) {
        for (let col = 0; col < 5; col++) {
          const piece = boardState[row][col];
          if (piece) {
            const value = pieceValues[piece.type] || 0;
            const posValue = positionValue(row, col);
            const totalValue = value + posValue;
            score += piece.owner === 'ai' ? totalValue : -totalValue;
          }
        }
      }
      score += capturedValue(aiCap, 'ai');
      score += capturedValue(playerCap, 'player');
      return score;
    }

    // AIのターンに呼び出され、難易度に応じて手を指す
    function aiMove() {
      if (currentTurn !== 'ai') return;

      if (difficulty === 'normal') {
        aiMoveNormal();
      } else {
        aiMoveHard();
      }
    }

    // AIの「ふつう」難易度の手を決定し実行する関数
    function aiMoveNormal() {
      if (currentTurn !== 'ai') return;

      let bestScore = -Infinity;
      let bestMove = null;


      // 盤上のAIの駒すべてを調べる
      for (let row = 0; row < 5; row++) {
        for (let col = 0; col < 5; col++) {
          const piece = board[row][col];
          if (piece && piece.owner === 'ai') {
            const directions = {
              '王': [[-1,-1],[-1,0],[-1,1],[0,-1],[0,1],[1,-1],[1,0],[1,1]],
              '金': [[1,-1],[1,0],[1,1],[0,-1],[0,1],[-1,0]],
              '銀': [[1,-1],[1,0],[1,1],[-1,-1],[-1,1]]
            }[piece.type];

            // 移動可能な方向ごとに次の位置を計算し、有効な手か判定
            for (const [dr, dc] of directions) {
              const newRow = row + dr;
              const newCol = col + dc;
              if (
                newRow >= 0 && newRow < 5 &&
                newCol >= 0 && newCol < 5 &&
                isValidAIMove(row, col, newRow, newCol)
              ) {

                // 仮想的に盤面をコピーして手を試す
                const tempBoard = JSON.parse(JSON.stringify(board));
                const tempPlayerCaptured = [...playerCaptured];
                const tempAICaptured = [...aiCaptured];

                // 相手駒を取る場合は持ち駒に追加
                const target = tempBoard[newRow][newCol];
                if (target && target.owner === 'player') {
                  tempAICaptured.push(target.type);
                }

                // 駒を移動
                tempBoard[newRow][newCol] = tempBoard[row][col];
                tempBoard[row][col] = null;

                // 盤面評価値を計算し、最高評価の手を記憶
                const score = evaluateBoard(tempBoard, tempPlayerCaptured, tempAICaptured);
                if (score > bestScore) {
                  bestScore = score;
                  bestMove = { from: [row, col], to: [newRow, newCol] };
                }
              }
            }
          }
        }
      }

      // 持ち駒の打ち手もチェック
      for (let i = 0; i < aiCaptured.length; i++) {
        const type = aiCaptured[i];
        for (let row = 0; row < 5; row++) {
          for (let col = 0; col < 5; col++) {
            if (board[row][col] === null) {
              const tempBoard = JSON.parse(JSON.stringify(board));
              const tempPlayerCaptured = [...playerCaptured];
              const tempAICaptured = [...aiCaptured];
              tempBoard[row][col] = { type, owner: 'ai' };
              tempAICaptured.splice(i, 1);

              const score = evaluateBoard(tempBoard, tempPlayerCaptured, tempAICaptured);

              if (score > bestScore) {
                bestScore = score;
                bestMove = { drop: true, type, position: [row, col], index: i };
              }
            }
          }
        }
      }

      // 有効な手がなければ終了
      if (!bestMove) return;

      // 手の実行
      if (bestMove.drop) {
        const [row, col] = bestMove.position;
        board[row][col] = { type: bestMove.type, owner: 'ai' };
        aiCaptured.splice(bestMove.index, 1);
      } else {
        const [fromRow, fromCol] = bestMove.from;
        const [toRow, toCol] = bestMove.to;
        const movingPiece = board[fromRow][fromCol];
        const target = board[toRow][toCol];

        // 駒を取ったら持ち駒に追加
        if (target && target.owner === 'player') {
          aiCaptured.push(target.type);
        }

        board[toRow][toCol] = movingPiece;
        board[fromRow][fromCol] = null;
      }

      currentTurn = 'player';
      renderBoard();
      renderCapturedPieces();
      checkGameOver();
    }

    // 指定されたプレイヤーのすべての合法手を生成する関数
    function generateAllMoves(owner, board, capturedPieces) {
      const moves = [];

      // 駒ごとの移動方向を定義
      const directions = {
        '王': [[-1,-1],[-1,0],[-1,1],[0,-1],[0,1],[1,-1],[1,0],[1,1]],
        '金': owner === 'ai'
          ? [[1,-1],[1,0],[1,1],[0,-1],[0,1],[-1,0]]
          : [[-1,-1],[-1,0],[-1,1],[0,-1],[0,1],[1,0]],
        '銀': owner === 'ai'
          ? [[1,-1],[1,0],[1,1],[-1,-1],[-1,1]]
          : [[-1,-1],[-1,0],[-1,1],[1,-1],[1,1]]
      };

      // 盤上の駒の移動手を生成
      for (let row = 0; row < 5; row++) {
        for (let col = 0; col < 5; col++) {
          const piece = board[row][col];
          if (piece && piece.owner === owner) {
            const pieceDirs = directions[piece.type];
            for (const [dr, dc] of pieceDirs) {
              const newRow = row + dr;
              const newCol = col + dc;
              if (
                newRow >= 0 && newRow < 5 &&
                newCol >= 0 && newCol < 5
              ) {
                const target = board[newRow][newCol];
                // 味方の駒でなければ移動可能
                if (!target || target.owner !== owner) {
                  moves.push({
                    type: 'move',
                    from: [row, col],
                    to: [newRow, newCol]
                  });
                }
              }
            }
          }
        }
      }

      // 持ち駒の打ち手をすべて生成する
      for (let i = 0; i < capturedPieces.length; i++) {
        const type = capturedPieces[i];
        for (let row = 0; row < 5; row++) {
          for (let col = 0; col < 5; col++) {
            if (board[row][col] === null) {
              moves.push({
                type: 'drop',   // 打つ手
                pieceType: type,  // 駒の種類
                position: [row, col],
                index: i    // 持ち駒配列のインデックス
              });
            }
          }
        }
      }

      return moves;   // 生成したすべての手を返す
    }


    // 手を適用したあとの新しい盤面と持ち駒を返す関数
    function applyMove(move, board, playerCaptured, aiCaptured) {
      // 盤面や持ち駒をコピー（変更を元に戻せるように）
      const newBoard = JSON.parse(JSON.stringify(board));
      const newPlayerCaptured = [...playerCaptured];
      const newAICaptured = [...aiCaptured];

      if (move.type === 'move') {
        const [fromRow, fromCol] = move.from;
        const [toRow, toCol] = move.to;
        const movingPiece = newBoard[fromRow][fromCol];
        const target = newBoard[toRow][toCol];

        // 駒を取ったら持ち駒に追加
        if (target && target.owner !== movingPiece.owner) {
          if (movingPiece.owner === 'ai') {
            newAICaptured.push(target.type);
          } else {
            newPlayerCaptured.push(target.type);
          }
        }

        // 駒を移動
        newBoard[toRow][toCol] = movingPiece;
        newBoard[fromRow][fromCol] = null;

      } else if (move.type === 'drop') {
        const [row, col] = move.position;
        const pieceType = move.pieceType;
        const owner = pieceType === '王' ? 'ai' : move.owner || 'ai'; 

        // 持ち駒を盤上に置く
        newBoard[row][col] = { type: pieceType, owner };

        // 持ち駒から除外
        if (owner === 'ai') {
          newAICaptured.splice(move.index, 1);
        } else {
          newPlayerCaptured.splice(move.index, 1);
        }
      }

      return {
        newBoard,
        newPlayerCaptured,
        newAICaptured
      };
    }

    // AIの難しいレベルの思考（簡単な1手読み）
    // AIの手をすべて試し、次にプレイヤーが最善を指した時の最悪評価を最大化する手を選ぶ
    function aiMoveHard() {
      if (currentTurn !== 'ai') return;

      let bestScore = -Infinity;
      let bestMove = null;

      // AIのすべての合法手を取得
      const aiMoves = generateAllMoves('ai', board, aiCaptured);

      for (const move of aiMoves) {
        // AIの手を適用した盤面を生成
        const { newBoard, newPlayerCaptured, newAICaptured } = applyMove(move, board, playerCaptured, aiCaptured);

        // プレイヤーのすべての合法手を生成
        const playerMoves = generateAllMoves('player', newBoard, newPlayerCaptured);
        let worstScore = Infinity;

        // プレイヤーの各手に対して評価値を計算し、最悪のスコア（AIにとって最悪）を求める
        for (const pMove of playerMoves) {
          const { newBoard: pBoard, newPlayerCaptured: pCap, newAICaptured: aCap } = applyMove(pMove, newBoard, newPlayerCaptured, newAICaptured);
          const score = evaluateBoard(pBoard, pCap, aCap);
          if (score < worstScore) {
            worstScore = score;
          }
        }

        // 最悪のスコアが今までより良ければ手を更新
        if (worstScore > bestScore) {
          bestScore = worstScore;
          bestMove = move;
        }
      }

      if (!bestMove) return;

      // 手の実行
      if (bestMove.type === 'move') {
        const [fromRow, fromCol] = bestMove.from;
        const [toRow, toCol] = bestMove.to;
        const movingPiece = board[fromRow][fromCol];
        const target = board[toRow][toCol];

        if (target && target.owner === 'player') {
          aiCaptured.push(target.type);
        }

        board[toRow][toCol] = movingPiece;
        board[fromRow][fromCol] = null;

      } else if (bestMove.type === 'drop') {
        const [row, col] = bestMove.position;
        board[row][col] = { type: bestMove.pieceType, owner: 'ai' };
        aiCaptured.splice(bestMove.index, 1);
      }

      currentTurn = 'player';
      renderBoard();
      renderCapturedPieces();
      checkGameOver();
    }

    // プレイヤーがセルをクリックした時の処理
    function handleCellClick(row, col) {
      if (currentTurn !== 'player') return;
      const targetPiece = board[row][col];

      // 持ち駒から盤上に打つ場合
      if (selectedCapturedPiece && targetPiece === null) {
        board[row][col] = { type: selectedCapturedPiece.type, owner: 'player' };
        playerCaptured.splice(selectedCapturedPiece.index, 1);
        selectedCapturedPiece = null;
        validMoves = [];
        currentTurn = 'ai';
        renderBoard();
        renderCapturedPieces();
        setTimeout(aiMove, 500);
        return;
      }

      if (selectedPiece) {
        const [selRow, selCol] = selectedPiece;
        const movingPiece = board[selRow][selCol];

        // 選択駒を指定先に動かせるか判定
        if (isValidMove(selRow, selCol, row, col)) {
          // 相手駒を取る場合は持ち駒に追加
          if (targetPiece && targetPiece.owner === 'ai') {
            playerCaptured.push(targetPiece.type);
          }
          board[row][col] = movingPiece;
          board[selRow][selCol] = null;
          selectedPiece = null;
          validMoves = [];
          currentTurn = 'ai';
          renderBoard();
          renderCapturedPieces();
          checkGameOver();
          setTimeout(aiMove, 500);
        } else {
          // 無効な移動なら選択解除
          selectedPiece = null;
          validMoves = [];
          renderBoard();
        }
      } else if (targetPiece && targetPiece.owner === 'player') {
        // プレイヤーの駒を選択した場合、有効な移動先を計算して表示
        selectedPiece = [row, col];
        selectedCapturedPiece = null;
        validMoves = [];

        for (let r = 0; r < 5; r++) {
          for (let c = 0; c < 5; c++) {
            if (isValidMove(row, col, r, c)) {
              validMoves.push(`${r},${c}`);
            }
          }
        }

        renderBoard();
      }
    }

    // ゲーム終了判定（王が取られたかどうか）
    function checkGameOver() {
      let playerKingExists = false;
      let aiKingExists = false;

      for (let row = 0; row < 5; row++) {
        for (let col = 0; col < 5; col++) {
          const piece = board[row][col];
          if (piece && piece.type === '王') {
            if (piece.owner === 'player') playerKingExists = true;
            if (piece.owner === 'ai') aiKingExists = true;
          }
        }
      }

      if (!playerKingExists) {
        alert('AIの勝ちです！');
        currentTurn = 'none';
      } else if (!aiKingExists) {
        alert('プレイヤーの勝ちです！');
        currentTurn = 'none';
      }
    }

    // ページ読み込み時に盤面初期化
    window.onload = () => {
      initializeBoard();
    };
