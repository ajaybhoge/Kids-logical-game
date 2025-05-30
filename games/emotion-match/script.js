const emotions = [
    { name: 'happy', emoji: '😀', label: 'I am happy' },
    { name: 'sad', emoji: '😢', label: 'I am very sad' },
    { name: 'angry', emoji: '😡', label: 'I am angry' },
    { name: 'surprised', emoji: '😲', label: 'I am surprised' },
    { name: 'crying', emoji: '😭', label: 'I am crying' },
    { name: 'laughing', emoji: '😂', label: 'I am laughing' },
    { name: 'shy', emoji: '😊', label: 'I am shy' },
    { name: 'confused', emoji: '😕', label: 'I am confused' },
    { name: 'cool', emoji: '😎', label: 'I am cool' },
    { name: 'sleepy', emoji: '😴', label: 'I am sleepy' },
    { name: 'nervous', emoji: '😬', label: 'I am nervous' },
    { name: 'blushing', emoji: '😳', label: 'I am blushing' }
  ];

  const levels = [
    { matchCount: 2, distractors: 0, time: 0 },
    { matchCount: 3, distractors: 1, time: 0 },
    { matchCount: 3, distractors: 2, time: 20 },
    { matchCount: 4, distractors: 2, time: 20 },
    { matchCount: 4, distractors: 3, time: 15 },
    { matchCount: 5, distractors: 3, time: 15 },
    { matchCount: 6, distractors: 4, time: 12 },
    { matchCount: 6, distractors: 5, time: 10 },
    { matchCount: 7, distractors: 5, time: 10 },
    { matchCount: 8, distractors: 6, time: 8 }
  ];

  let currentLevel = 0;
  let correctEmoji = null;
  let timerId = null;
  let score = 0;

  const face = document.getElementById('emotion-face');
  const emojiOptions = document.getElementById('emoji-options');
  const levelInfo = document.getElementById('level-info');
  const timerDisplay = document.getElementById('timer');
  const restartBtn = document.getElementById('restart-btn');
  const cheer = document.getElementById('cheer');
  const scoreDisplay = document.getElementById('score');

  function shuffle(array) {
    return array.sort(() => Math.random() - 0.5);
  }

  function speak(text) {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(utterance);
    }
  }

  function startLevel(level) {
    const { matchCount, distractors, time } = levels[level];
    levelInfo.textContent = `Level ${level + 1}`;
    restartBtn.style.display = 'none';
    emojiOptions.innerHTML = '';
    timerDisplay.textContent = '';

    const selected = shuffle([...emotions]).slice(0, matchCount);
    correctEmoji = selected[Math.floor(Math.random() * selected.length)];
    face.textContent = correctEmoji.emoji;
    speak(correctEmoji.label);

    const extra = shuffle([...emotions].filter(e => !selected.includes(e))).slice(0, distractors);
    const allOptions = shuffle([...selected, ...extra]);

    allOptions.forEach(opt => {
      const btn = document.createElement('div');
      btn.textContent = opt.emoji;
      btn.className = 'emoji';
      btn.onclick = () => checkAnswer(btn, opt);
      btn.ontouchstart = () => checkAnswer(btn, opt);
      emojiOptions.appendChild(btn);
    });

    if (time > 0) {
      let remaining = time;
      timerDisplay.textContent = `Time: ${remaining}s`;
      timerId = setInterval(() => {
        remaining--;
        timerDisplay.textContent = `Time: ${remaining}s`;
        if (remaining === 0) {
          clearInterval(timerId);
          startLevel(level);
        }
      }, 1000);
    }
  }

  function checkAnswer(btn, selected) {
    if (selected.name === correctEmoji.name) {
      cheer.play();
      clearInterval(timerId);
      score += 10;
      scoreDisplay.textContent = `Score: ${score}`;
      btn.classList.add('correct');
      Array.from(emojiOptions.children).forEach(b => b.onclick = null);
      setTimeout(() => {
        currentLevel++;
        if (currentLevel < levels.length) {
          startLevel(currentLevel);
        } else {
          levelInfo.textContent = `🎉 You completed all levels!`;
          restartBtn.style.display = 'block';
          emojiOptions.innerHTML = '';
          face.textContent = '🏆';
          timerDisplay.textContent = '';
        }
      }, 2000);
    } else {
      btn.classList.add('wrong');
      setTimeout(() => {
        btn.classList.remove('wrong');
      }, 1000);
    }
  }

  restartBtn.addEventListener('click', () => {
    currentLevel = 0;
    score = 0;
    scoreDisplay.textContent = `Score: ${score}`;
    startLevel(currentLevel);
  });

  startLevel(currentLevel);