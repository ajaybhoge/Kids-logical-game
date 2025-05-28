const shapesArea = document.getElementById('shapesArea');
const scoreValue = document.getElementById('scoreValue');
const feedback = document.getElementById('feedback');
const timerDisplay = document.getElementById('timer');
const restartBtn = document.querySelector('.restart-btn');

const shapeTypes = ['circle', 'square', 'triangle', 'star', 'diamond', 'pentagon', 'hexagon'];

let score = 0;
let timer = 120; // 2 minutes in seconds
let timerInterval;
let gameActive = true;

function createShape(type) {
  const div = document.createElement('div');
  div.classList.add('shape', type);
  div.setAttribute('draggable', 'true');
  div.dataset.shape = type;

  // Fallback label (optional)
  div.textContent = type.charAt(0).toUpperCase();

  div.addEventListener('dragstart', dragStart);
  div.addEventListener('dragend', dragEnd);

  return div;
}

function loadShapes() {
  shapesArea.innerHTML = '';
  // create 2 shapes per type
  shapeTypes.forEach(type => {
    for(let i=0; i<2; i++) {
      const shape = createShape(type);
      shapesArea.appendChild(shape);
    }
  });
}

function dragStart(e) {
  if (!gameActive) {
    e.preventDefault();
    return;
  }
  e.dataTransfer.setData('text/plain', e.target.dataset.shape);
  e.target.classList.add('dragging');
  document.body.classList.add('dragging'); // Optional: prevent text selection while dragging
}

function dragEnd(e) {
  e.target.classList.remove('dragging');
  document.body.classList.remove('dragging');
}

function dragOver(e) {
  e.preventDefault();
  if (!gameActive) return;
  e.currentTarget.classList.add('drag-over');
}

function dragLeave(e) {
  e.currentTarget.classList.remove('drag-over');
}

function drop(e) {
  e.preventDefault();
  if (!gameActive) return;

  const draggedShape = e.dataTransfer.getData('text/plain');
  const holeShape = e.currentTarget.dataset.shape;

  e.currentTarget.classList.remove('drag-over');

  const draggedElement = [...shapesArea.children].find(
    child => child.dataset.shape === draggedShape && child.classList.contains('dragging')
  );

  if (draggedShape === holeShape) {
    // Correct drop
    score++;
    scoreValue.textContent = score;

    feedback.textContent = 'Correct! 🎉';
    feedback.classList.add('show');
    setTimeout(() => feedback.classList.remove('show'), 800);

    e.currentTarget.classList.add('correct-drop');
    setTimeout(() => e.currentTarget.classList.remove('correct-drop'), 600);

    if (draggedElement) {
      shapesArea.removeChild(draggedElement);
    }

    // Subtract 20 seconds every 8 points scored, but do NOT reset timer to 120
    if (score % 8 === 0) {
        timer = Math.max(timer - 20, 0);  // subtract 20 seconds from current timer
        updateTimerDisplay();
      
        feedback.textContent = '⏱️ Time reduced by 20 seconds!';
        feedback.classList.add('show');
        setTimeout(() => feedback.classList.remove('show'), 1200);
      
        loadShapes(); // Load new shapes without resetting score
      
        if (timer === 0) {
          endGame();
        }
      }
      

  } else {
    // Wrong drop
    feedback.textContent = 'Try again! ❌';
    feedback.classList.add('show');
    setTimeout(() => feedback.classList.remove('show'), 800);
  }
}

function updateTimerDisplay() {
  const minutes = Math.floor(timer / 60);
  const seconds = timer % 60;
  timerDisplay.textContent = `⏳ ${minutes}:${seconds.toString().padStart(2, '0')}`;
}

function countdown() {
  if (timer > 0) {
    timer--;
    updateTimerDisplay();
  } else {
    endGame();
  }
}

function endGame() {
  gameActive = false;
  feedback.textContent = `Game Over! Your score: ${score}`;
  feedback.classList.add('show');
  restartBtn.style.display = 'inline-block';
}

function startNewGame() {
  score = 0;
  timer = 120;
  gameActive = true;
  updateTimerDisplay();
  scoreValue.textContent = score;
  feedback.textContent = '';
  restartBtn.style.display = 'none';
  loadShapes();
  clearInterval(timerInterval);
  timerInterval = setInterval(countdown, 1000);
}

function setupHoles() {
  const holes = document.querySelectorAll('.hole');
  holes.forEach(hole => {
    hole.addEventListener('dragover', dragOver);
    hole.addEventListener('dragleave', dragLeave);
    hole.addEventListener('drop', drop);
  });
}

// Initialize
setupHoles();
startNewGame();

restartBtn.addEventListener('click', startNewGame);
