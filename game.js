const canvas = document.getElementById('tetris');
const context = canvas.getContext('2d');
context.scale(20, 20); 

function createMatrix(w, h) { const m = []; while(h--) m.push(new Array(w).fill(0)); return m; }
function createPiece(t) {
    if(t==='T') return [[0,0,0],[1,1,1],[0,1,0]];
    if(t==='O') return [[2,2],[2,2]];
    if(t==='L') return [[0,3,0],[0,3,0],[0,3,3]];
    if(t==='J') return [[0,4,0],[0,4,0],[4,4,0]];
    if(t==='I') return [[0,5,0,0],[0,5,0,0],[0,5,0,0],[0,5,0,0]];
    if(t==='S') return [[0,6,6],[6,6,0],[0,0,0]];
    if(t==='Z') return [[7,7,0],[0,7,7],[0,0,0]];
}
const colors = [ null, '#FF0D72', '#0DC2FF', '#0DFF72', '#F538FF', '#FF8E0D', '#FFE138', '#3877FF' ];

const arena = createMatrix(12, 20);
const player = { pos: {x: 0, y: 0}, matrix: null, score: 0 };

function getGhostPos() {
    const ghost = { matrix: player.matrix, pos: { x: player.pos.x, y: player.pos.y } };
    while (!collide(arena, ghost)) { ghost.pos.y++; }
    ghost.pos.y--; return ghost.pos;
}

function drawGhost() {
    if (!player.matrix) return;
    const gPos = getGhostPos();
    player.matrix.forEach((row, y) => {
        row.forEach((value, x) => {
            if (value !== 0) {
                context.fillStyle = 'rgba(255,255,255,0.15)'; context.fillRect(x+gPos.x, y+gPos.y, 1, 1);
                context.strokeStyle = 'rgba(255,255,255,0.4)'; context.lineWidth = 0.05; context.strokeRect(x+gPos.x, y+gPos.y, 1, 1);
            }
        });
    });
}

function drawMatrix(matrix, offset) {
    matrix.forEach((row, y) => {
        row.forEach((value, x) => {
            if (value !== 0) { context.fillStyle = colors[value]; context.fillRect(x+offset.x, y+offset.y, 1, 1); }
        });
    });
}

function draw() {
    context.fillStyle = '#111'; context.fillRect(0, 0, canvas.width, canvas.height);
    drawMatrix(arena, {x: 0, y: 0}); drawGhost(); drawMatrix(player.matrix, player.pos);
}

function collide(arena, player) {
    const [m, o] = [player.matrix, player.pos];
    for (let y=0; y<m.length; ++y) {
        for (let x=0; x<m[y].length; ++x) {
            if (m[y][x] !== 0 && (arena[y+o.y] && arena[y+o.y][x+o.x]) !== 0) return true;
        }
    }
    return false;
}

function merge(arena, player) {
    player.matrix.forEach((row, y) => { row.forEach((value, x) => { if (value !== 0) arena[y+player.pos.y][x+player.pos.x] = value; }); });
}

function arenaSweep() {
    let rowCount = 1;
    outer: for (let y = arena.length-1; y>0; --y) {
        for (let x=0; x<arena[y].length; ++x) { if (arena[y][x] === 0) continue outer; }
        const row = arena.splice(y, 1)[0].fill(0); arena.unshift(row); ++y;
        player.score += rowCount * 100; rowCount *= 2;
    }
}

let dropCounter = 0; let dropInterval = 1000; let lastTime = 0;

function playerDrop() {
    player.pos.y++;
    if (collide(arena, player)) { player.pos.y--; merge(arena, player); playerReset(); arenaSweep(); updateScore(); }
    dropCounter = 0;
}
function playerHardDrop() {
    while (!collide(arena, player)) { player.pos.y++; }
    player.pos.y--; merge(arena, player); playerReset(); arenaSweep(); updateScore(); dropCounter = 0;
}
function playerMove(dir) {
    player.pos.x += dir; if (collide(arena, player)) player.pos.x -= dir;
}
function playerReset() {
    const p = 'ILJOTSZ'; player.matrix = createPiece(p[p.length * Math.random() | 0]);
    player.pos.y = 0; player.pos.x = (arena[0].length / 2 | 0) - (player.matrix[0].length / 2 | 0);
    if (collide(arena, player)) { arena.forEach(r => r.fill(0)); player.score = 0; updateScore(); }
}
function playerRotate(dir) {
    const pos = player.pos.x; let offset = 1; rotate(player.matrix, dir);
    while (collide(arena, player)) {
        player.pos.x += offset; offset = -(offset + (offset > 0 ? 1 : -1));
        if (offset > player.matrix[0].length) { rotate(player.matrix, -dir); player.pos.x = pos; return; }
    }
}
function rotate(matrix, dir) {
    for (let y=0; y<matrix.length; ++y) { for (let x=0; x<y; ++x) { [matrix[x][y], matrix[y][x]] = [matrix[y][x], matrix[x][y]]; } }
    if (dir > 0) matrix.forEach(r => r.reverse()); else matrix.reverse();
}

function update(time = 0) {
    const dt = time - lastTime; lastTime = time; dropCounter += dt;
    if (dropCounter > dropInterval) playerDrop();
    draw(); requestAnimationFrame(update);
}
function updateScore() { document.getElementById('score').innerText = player.score; }

// 💻 1. PC 키보드 로직
document.addEventListener('keydown', e => {
    if(e.keyCode===37){playerMove(-1);} else if(e.keyCode===39){playerMove(1);} else if(e.keyCode===40){playerDrop();} else if(e.keyCode===38){playerRotate(1);} else if(e.keyCode===32){playerHardDrop();}
    if([32,37,38,39,40].includes(e.keyCode)) e.preventDefault();
});

// 📱 2. 모바일 드래그 & 터치 로직 (새로 추가!)
let touchStartX = 0;
let touchStartY = 0;
let isDragging = false;
const dragThreshold = 25; // 25px 밀면 블록 1칸 이동

canvas.addEventListener('touchstart', (e) => {
    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
    isDragging = false;
    e.preventDefault(); // 화면 스크롤 튕김 방지
}, { passive: false });

canvas.addEventListener('touchmove', (e) => {
    if (!touchStartX || !touchStartY) return;
    let touchX = e.touches[0].clientX;
    let touchY = e.touches[0].clientY;
    let diffX = touchX - touchStartX;
    let diffY = touchY - touchStartY;

    if (Math.abs(diffX) > dragThreshold) { // 좌우 드래그
        if (diffX > 0) playerMove(1); else playerMove(-1);
        touchStartX = touchX; // 연속 이동을 위해 기준점 초기화
        isDragging = true;
    }
    if (diffY > dragThreshold) { // 아래로 드래그
        playerDrop();
        touchStartY = touchY;
        isDragging = true;
    }
    e.preventDefault();
}, { passive: false });

canvas.addEventListener('touchend', (e) => {
    // 💡 드래그 안 하고 그냥 톡! 쳤으면 모양 회전
    if (!isDragging) { playerRotate(1); }
    touchStartX = 0; touchStartY = 0;
});

// PC에서 마우스로 게임화면 클릭해도 회전되게 추가
canvas.addEventListener('click', () => { if(!isDragging) playerRotate(1); });

// 📱 3. 뚝 떨어지기 버튼
document.getElementById('btn-hard-drop').addEventListener('click', () => { playerHardDrop(); });

playerReset(); updateScore(); update();
