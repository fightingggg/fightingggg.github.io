const canvas = document.getElementById('tetris');
const context = canvas.getContext('2d');
context.scale(20, 20); 

function createMatrix(w, h) {
    const matrix = [];
    while (h--) { matrix.push(new Array(w).fill(0)); }
    return matrix;
}

function createPiece(type) {
    if (type === 'T') return [[0,0,0],[1,1,1],[0,1,0]];
    if (type === 'O') return [[2,2],[2,2]];
    if (type === 'L') return [[0,3,0],[0,3,0],[0,3,3]];
    if (type === 'J') return [[0,4,0],[0,4,0],[4,4,0]];
    if (type === 'I') return [[0,5,0,0],[0,5,0,0],[0,5,0,0],[0,5,0,0]];
    if (type === 'S') return [[0,6,6],[6,6,0],[0,0,0]];
    if (type === 'Z') return [[7,7,0],[0,7,7],[0,0,0]];
}

const colors = [ null, '#FF0D72', '#0DC2FF', '#0DFF72', '#F538FF', '#FF8E0D', '#FFE138', '#3877FF' ];

function drawMatrix(matrix, offset) {
    matrix.forEach((row, y) => {
        row.forEach((value, x) => {
            if (value !== 0) {
                context.fillStyle = colors[value];
                context.fillRect(x + offset.x, y + offset.y, 1, 1);
            }
        });
    });
}

const arena = createMatrix(12, 20);
const player = { pos: {x: 0, y: 0}, matrix: null, score: 0 };

// 💡 새롭게 추가된 그림자 위치 계산 기능!
function getGhostPos() {
    const ghost = {
        matrix: player.matrix,
        pos: { x: player.pos.x, y: player.pos.y }
    };
    // 바닥이나 다른 블록에 닿을 때까지 가상으로 내려봄
    while (!collide(arena, ghost)) {
        ghost.pos.y++;
    }
    ghost.pos.y--; // 닿았으니 한 칸 위가 진짜 떨어질 자리!
    return ghost.pos;
}

// 💡 새롭게 추가된 반투명 그림자 그리기 기능!
function drawGhost() {
    if (!player.matrix) return;
    const ghostPos = getGhostPos();
    player.matrix.forEach((row, y) => {
        row.forEach((value, x) => {
            if (value !== 0) {
                context.fillStyle = 'rgba(255, 255, 255, 0.15)'; // 반투명한 하얀색
                context.fillRect(x + ghostPos.x, y + ghostPos.y, 1, 1);
                context.lineWidth = 0.05;
                context.strokeStyle = 'rgba(255, 255, 255, 0.4)'; // 하얀색 테두리
                context.strokeRect(x + ghostPos.x, y + ghostPos.y, 1, 1);
            }
        });
    });
}

function draw() {
    context.fillStyle = '#111';
    context.fillRect(0, 0, canvas.width, canvas.height);
    drawMatrix(arena, {x: 0, y: 0});
    
    drawGhost(); // 💡 진짜 블록을 그리기 전에 그림자 먼저 바닥에 쫙 깔아줌!
    drawMatrix(player.matrix, player.pos);
}

function collide(arena, player) {
    const [m, o] = [player.matrix, player.pos];
    for (let y = 0; y < m.length; ++y) {
        for (let x = 0; x < m[y].length; ++x) {
            if (m[y][x] !== 0 && (arena[y + o.y] && arena[y + o.y][x + o.x]) !== 0) { return true; }
        }
    }
    return false;
}

function merge(arena, player) {
    player.matrix.forEach((row, y) => {
        row.forEach((value, x) => {
            if (value !== 0) arena[y + player.pos.y][x + player.pos.x] = value;
        });
    });
}

function arenaSweep() {
    let rowCount = 1;
    outer: for (let y = arena.length -1; y > 0; --y) {
        for (let x = 0; x < arena[y].length; ++x) { if (arena[y][x] === 0) continue outer; }
        const row = arena.splice(y, 1)[0].fill(0);
        arena.unshift(row);
        ++y;
        player.score += rowCount * 100;
        rowCount *= 2;
    }
}

let dropCounter = 0;
let dropInterval = 1000;
let lastTime = 0;

function playerDrop() {
    player.pos.y++;
    if (collide(arena, player)) {
        player.pos.y--; merge(arena, player); playerReset(); arenaSweep(); updateScore();
    }
    dropCounter = 0;
}

function playerHardDrop() {
    while (!collide(arena, player)) { player.pos.y++; }
    player.pos.y--; 
    merge(arena, player); playerReset(); arenaSweep(); updateScore();
    dropCounter = 0;
}

function playerMove(dir) {
    player.pos.y++; 
    if(collide(arena, player)){
        player.pos.y--;
    } else {
        player.pos.y--;
        player.pos.x += dir;
        if (collide(arena, player)) player.pos.x -= dir;
    }
}

function playerReset() {
    const pieces = 'ILJOTSZ';
    player.matrix = createPiece(pieces[pieces.length * Math.random() | 0]);
    player.pos.y = 0;
    player.pos.x = (arena[0].length / 2 | 0) - (player.matrix[0].length / 2 | 0);
    if (collide(arena, player)) { arena.forEach(row => row.fill(0)); player.score = 0; updateScore(); }
}

function playerRotate(dir) {
    const pos = player.pos.x; let offset = 1;
    rotate(player.matrix, dir);
    while (collide(arena, player)) {
        player.pos.x += offset; offset = -(offset + (offset > 0 ? 1 : -1));
        if (offset > player.matrix[0].length) { rotate(player.matrix, -dir); player.pos.x = pos; return; }
    }
}

function rotate(matrix, dir) {
    for (let y = 0; y < matrix.length; ++y) {
        for (let x = 0; x < y; ++x) { [matrix[x][y], matrix[y][x]] = [matrix[y][x], matrix[x][y]]; }
    }
    if (dir > 0) matrix.forEach(row => row.reverse()); else matrix.reverse();
}

function update(time = 0) {
    const deltaTime = time - lastTime;
    lastTime = time; dropCounter += deltaTime;
    if (dropCounter > dropInterval) playerDrop();
    draw(); requestAnimationFrame(update);
}

function updateScore() { document.getElementById('score').innerText = player.score; }

document.addEventListener('keydown', event => {
    if (event.keyCode === 37) { playerMove(-1); }
    else if (event.keyCode === 39) { playerMove(1); }
    else if (event.keyCode === 40) { playerDrop(); }
    else if (event.keyCode === 38) { playerRotate(1); }
    else if (event.keyCode === 32) { playerHardDrop(); }
    if([32, 37, 38, 39, 40].indexOf(event.keyCode) > -1) { event.preventDefault(); }
});

document.getElementById('btn-left').addEventListener('click', () => playerMove(-1));
document.getElementById('btn-right').addEventListener('click', () => playerMove(1));
document.getElementById('btn-drop').addEventListener('click', () => playerDrop());
document.getElementById('btn-rotate').addEventListener('click', () => playerRotate(1));

playerReset();
updateScore();
update();
