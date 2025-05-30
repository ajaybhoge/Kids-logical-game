let allRings = [];
let unstackedRings = [];
let stackedRings = [];
let gameComplete = false;
let audioContext;
let isAudioInitialized = false;
let isResetting = false;
let postCenter = { x: 0, y: 0 };
let totalRings = 3; // Always start with exactly 3 rings
let currentLevel = 1;
let nextRingId = 1;

// Color palettes for rings
const colorPalettes = [
    'radial-gradient(circle at 30% 30%, #FF6B6B, #E53E3E)', // Red
    'radial-gradient(circle at 30% 30%, #FFD93D, #F6D55C)', // Yellow
    'radial-gradient(circle at 30% 30%, #6BCF7F, #48BB78)', // Green
    'radial-gradient(circle at 30% 30%, #4ECDC4, #38B2AC)', // Teal
    'radial-gradient(circle at 30% 30%, #A78BFA, #8B5CF6)', // Purple
    'radial-gradient(circle at 30% 30%, #F687B3, #ED64A6)', // Pink
    'radial-gradient(circle at 30% 30%, #FF8A80, #F44336)', // Light Red
    'radial-gradient(circle at 30% 30%, #FFB74D, #FF9800)', // Orange
    'radial-gradient(circle at 30% 30%, #81C784, #4CAF50)', // Light Green
    'radial-gradient(circle at 30% 30%, #64B5F6, #2196F3)', // Blue
    'radial-gradient(circle at 30% 30%, #BA68C8, #9C27B0)', // Purple Variant
    'radial-gradient(circle at 30% 30%, #4DB6AC, #009688)', // Teal Variant
    'radial-gradient(circle at 30% 30%, #FFB300, #FFA000)', // Amber
    'radial-gradient(circle at 30% 30%, #F06292, #E91E63)', // Pink Variant
    'radial-gradient(circle at 30% 30%, #AED581, #8BC34A)', // Light Green Variant
];

// Initialize audio context with error handling
function initAudio() {
    if (!isAudioInitialized && !audioContext) {
        try {
            audioContext = new (window.AudioContext || window.webkitAudioContext)();
            if (audioContext.state === 'suspended') {
                audioContext.resume();
            }
            isAudioInitialized = true;
        } catch (e) {
            console.warn('Audio not supported in this browser');
            isAudioInitialized = false;
        }
    }
}

// Safe sound playing with error handling
function playSound(frequency, duration, type = 'sine', volume = 0.1) {
    if (!isAudioInitialized || !audioContext) return;
    
    try {
        if (audioContext.state === 'suspended') {
            audioContext.resume();
        }
        
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);
        oscillator.type = type;
        
        gainNode.gain.setValueAtTime(volume, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + duration);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + duration);
    } catch (e) {
        console.warn('Audio playback failed:', e);
    }
}

function playOopsSound() {
    playSound(200, 0.4, 'triangle', 0.08);
    setTimeout(() => playSound(150, 0.3, 'triangle', 0.06), 200);
}

function playSuccessSound(ringSize) {
    const baseFreq = 400 + (ringSize * 80);
    playSound(baseFreq, 0.3, 'sine', 0.12);
}

function playCompletionMelody() {
    const melody = [523, 659, 784, 1047, 1319];
    melody.forEach((freq, i) => {
        setTimeout(() => playSound(freq, 0.5, 'sine', 0.15), i * 150);
    });
}

function playNewRingSound() {
    playSound(800, 0.2, 'sine', 0.1);
    setTimeout(() => playSound(1000, 0.2, 'sine', 0.1), 100);
    setTimeout(() => playSound(1200, 0.2, 'sine', 0.1), 200);
}

function calculatePostCenter() {
    const post = document.getElementById('post');
    const rect = post.getBoundingClientRect();
    postCenter.x = rect.left + rect.width / 2;
    postCenter.y = rect.top + rect.height / 2;
}

function updateGameStats() {
    const ringCounter = document.getElementById('ringCounter');
    const levelCounter = document.getElementById('levelCounter');
    ringCounter.textContent = `Total Rings: ${totalRings}`;
    levelCounter.textContent = `Level: ${currentLevel}`;
}

function createNewRing(size, color, id) {
    const ring = document.createElement('div');
    ring.className = 'ring new-ring';
    ring.id = `ring${id}`;
    ring.dataset.size = size;
    
    // Add appropriate size class
    ring.classList.add(`ring-size-${Math.min(size, 9)}`);
    
    // Set background color
    ring.style.background = color;
    
    // Position rings around the post (not on it)
    // Calculate better positioning based on ring size/index
    const ringIndex = size - 1; // 0, 1, 2 for the three rings
    
    // Create specific positions for up to 3 rings initially
    const angles = [
        Math.PI * 0.2,  // Top right
        Math.PI * 0.8,  // Top left  
        Math.PI * 1.4   // Bottom
    ];
    
    // For more than 3 rings, distribute evenly
    const angle = ringIndex < 3 ? angles[ringIndex] : (Math.PI * 2 * ringIndex / totalRings);
    const minDistance = 200; // Distance from post
    const maxDistance = 280; 
    const distance = minDistance + (ringIndex * 15); // Vary distance slightly
    
    // Get ring dimensions
    const tempRing = document.createElement('div');
    tempRing.className = `ring ring-size-${Math.min(size, 9)}`;
    tempRing.style.visibility = 'hidden';
    tempRing.style.position = 'absolute';
    document.body.appendChild(tempRing);
    const ringSize = tempRing.offsetWidth;
    document.body.removeChild(tempRing);
    
    let x = postCenter.x + Math.cos(angle) * distance - ringSize / 2;
    let y = postCenter.y + Math.sin(angle) * distance - ringSize / 2;
    
    // Keep rings fully on screen with padding
    const padding = 30;
    x = Math.max(padding, Math.min(window.innerWidth - ringSize - padding, x));
    y = Math.max(padding + 120, Math.min(window.innerHeight - ringSize - padding - 100, y));
    
    ring.style.left = x + 'px';
    ring.style.top = y + 'px';
    ring.style.cursor = 'pointer';
    ring.style.zIndex = '10';
    
    document.querySelector('.game-container').appendChild(ring);
    addClickListener(ring);
    allRings.push(ring);
    unstackedRings.push(ring);
    
    return ring;
}

function createLevelRings() {
    // Clear all existing rings
    allRings.forEach(ring => {
        if (ring.parentNode) {
            ring.parentNode.removeChild(ring);
        }
    });
    
    // Reset arrays
    allRings = [];
    unstackedRings = [];
    stackedRings = [];
    
    // Always create exactly the number of rings for current level
    const ringsToCreate = totalRings;
    
    // Create rings for current level
    for (let i = 1; i <= ringsToCreate; i++) {
        const colorIndex = (i - 1) % colorPalettes.length;
        const color = colorPalettes[colorIndex];
        
        setTimeout(() => {
            createNewRing(i, color, nextRingId);
            if (i === 1) playNewRingSound(); // Play sound only for first ring
            nextRingId++;
        }, i * 200);
    }
}

function initializeGame() {
    if (isResetting) return;
    
    gameComplete = false;
    calculatePostCenter();
    
    // Ensure we start with exactly 3 rings on first level
    if (currentLevel === 1) {
        totalRings = 3;
    }
    
    // Create rings for the current level
    createLevelRings();
    updateGameStats();
}

function addClickListener(element) {
    element.removeEventListener('click', handleRingClick);
    element.addEventListener('click', handleRingClick);
}

function handleRingClick(e) {
    if (gameComplete || isResetting) return;
    
    e.preventDefault();
    e.stopPropagation();
    
    if (!isAudioInitialized) {
        initAudio();
    }
    
    const ring = e.target.closest('.ring');
    if (!ring || ring.classList.contains('stacked') || ring.classList.contains('sliding')) {
        return;
    }
    
    const ringSize = parseInt(ring.dataset.size);
    const expectedSize = stackedRings.length + 1;
    
    if (ringSize === expectedSize) {
        stackRing(ring);
    } else {
        showWrongRingError(ring);
    }
}

function showWrongRingError(ring) {
    ring.classList.add('wrong');
    
    const errorMessage = document.getElementById('errorMessage');
    errorMessage.classList.add('show');
    
    playOopsSound();
    
    setTimeout(() => {
        ring.classList.remove('wrong');
        errorMessage.classList.remove('show');
    }, 1500);
}

function stackRing(ring) {
    const ringSize = parseInt(ring.dataset.size);
    
    ring.classList.add('stacked');
    ring.classList.add('sliding');
    stackedRings.push(ring);
    
    const index = unstackedRings.indexOf(ring);
    if (index > -1) {
        unstackedRings.splice(index, 1);
    }
    
    const post = document.getElementById('post');
    const postRect = post.getBoundingClientRect();
    
    // Calculate stack position with proper spacing
    const stackHeight = stackedRings.length * 20; // Adjusted spacing
    const ringWidth = ring.offsetWidth;
    const postCenterX = postRect.left + postRect.width / 2;
    
    // Animate to stack position
    ring.style.transition = 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)';
    ring.style.left = (postCenterX - ringWidth / 2) + 'px';
    ring.style.top = (postRect.bottom - stackHeight) + 'px';
    ring.style.zIndex = 20 + stackedRings.length;
    
    playSuccessSound(ringSize);
    
    setTimeout(() => {
        ring.classList.remove('sliding');
        ring.style.transition = 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
    }, 500);
    
    // Check for completion
    if (stackedRings.length === totalRings) {
        setTimeout(celebrateCompletion, 600);
    }
}

function celebrateCompletion() {
    gameComplete = true;
    playCompletionMelody();
    
    const celebration = document.getElementById('celebration');
    celebration.classList.add('show');
    
    // Wiggle all stacked rings
    stackedRings.forEach((ring, index) => {
        setTimeout(() => {
            ring.classList.add('wiggle');
        }, index * 50);
    });
    
    createSparkles();
    
    // Progress to next level after celebration
    setTimeout(() => {
        celebration.classList.remove('show');
        
        // Remove wiggle from rings
        stackedRings.forEach(ring => {
            ring.classList.remove('wiggle');
        });
        
        // Progress to next level
        totalRings += 1; // Add one more ring each level
        currentLevel++;
        
        // Reset and start new level
        setTimeout(() => {
            initializeGame();
        }, 1000);
        
    }, 3000);
}

function createSparkles() {
    const sparkleContainer = document.querySelector('.game-container');
    
    for (let i = 0; i < 25; i++) {
        setTimeout(() => {
            const sparkle = document.createElement('div');
            sparkle.className = 'sparkle';
            
            const x = postCenter.x + (Math.random() - 0.5) * 200;
            const y = postCenter.y + (Math.random() - 0.5) * 250;
            
            sparkle.style.left = x + 'px';
            sparkle.style.top = y + 'px';
            sparkle.style.animation = 'sparkleShine 1.5s ease-out forwards';
            
            sparkleContainer.appendChild(sparkle);
            
            setTimeout(() => {
                if (sparkle.parentNode) {
                    sparkle.parentNode.removeChild(sparkle);
                }
            }, 1500);
        }, i * 50);
    }
}

function resetGame() {
    isResetting = true;
    gameComplete = false;
    totalRings = 3; // Always reset to 3 rings
    currentLevel = 1;
    nextRingId = 1;
    stackedRings = [];
    
    // Remove all rings
    allRings.forEach(ring => {
        if (ring.parentNode) {
            ring.parentNode.removeChild(ring);
        }
    });
    allRings = [];
    unstackedRings = [];
    
    // Clean up sparkles
    const sparkles = document.querySelectorAll('.sparkle');
    sparkles.forEach(sparkle => {
        if (sparkle.parentNode) {
            sparkle.parentNode.removeChild(sparkle);
        }
    });
    
    // Reset celebration
    const celebration = document.getElementById('celebration');
    celebration.classList.remove('show');
    
    setTimeout(() => {
        isResetting = false;
        initializeGame();
    }, 100);
}

// Initialize game when DOM is ready
function init() {
    setTimeout(() => {
        calculatePostCenter();
        initializeGame();
    }, 100);
}

document.addEventListener('DOMContentLoaded', init);
window.addEventListener('load', init);

// Handle window resize
window.addEventListener('resize', () => {
    setTimeout(() => {
        calculatePostCenter();
        if (!gameComplete && !isResetting) {
            // Reposition existing rings if needed
            unstackedRings.forEach((ring, index) => {
                const angle = (Math.PI * 2 * index) / unstackedRings.length;
                const distance = 200;
                let x = postCenter.x + Math.cos(angle) * distance - ring.offsetWidth / 2;
                let y = postCenter.y + Math.sin(angle) * distance - ring.offsetHeight / 2;
                
                const padding = 20;
                x = Math.max(padding, Math.min(window.innerWidth - ring.offsetWidth - padding, x));
                y = Math.max(padding + 120, Math.min(window.innerHeight - ring.offsetHeight - padding - 100, y));
                
                ring.style.left = x + 'px';
                ring.style.top = y + 'px';
            });
        }
    }, 100);
});

// Prevent context menu on long press (mobile)
document.addEventListener('contextmenu', e => e.preventDefault());