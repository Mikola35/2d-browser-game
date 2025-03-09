// Добавим в начало файла переменную режима
let isTrainingMode = false;

// Get DOM elements
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const restartBtn = document.getElementById('restartBtn');
const colorPanel = document.getElementById('colorPanel');
const mainMenu = document.getElementById('mainMenu');
const playBtn = document.getElementById('playBtn');
const stats = document.getElementById('stats');
const waveAnnouncement = document.getElementById('waveAnnouncement');
const pauseBtn = document.getElementById('pauseBtn');
const pauseText = document.getElementById('pauseText');
const waveSelector = document.getElementById('waveSelector');
const homeBtn = document.getElementById('homeBtn');
let isPaused = false;

// Game state variables
let enemies = [];
let projectiles = [];
let particles = [];
let gameOver = false;
let gameWon = false;
let startTime;
let spawnRate = 3000;
let lastSpawn = 0;
let angle = 0;
let lastShot = 0;
let currentColorIndex = 0;
let currentWave = 1;
let waveStartTime;
let cannonX;
let cannonY;
let score = {
    totalEnemies: 0,
    killed: 0,
    hits: 0,
    misses: 0,
    shots: 0,
    missed: 0  // Добавляем счетчик пропущенных врагов
};
let wheelSpeed = 0; // Добавляем переменную для отслеживания скорости прокрутки
let lastWheelTime = 0; // Время последней прокрутки

// Game configuration
const colors = ['#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF', '#00FFFF'];
let activeEnemyColors = []; // Массив для отслеживания текущих цветов врагов

function getRandomActiveColor() {
    // Получаем текущие активные цвета
    const currentColors = [...new Set(enemies.map(enemy => enemy.color))];
    
    // Если активных цветов меньше 3, добавляем новый цвет
    if (currentColors.length < 3) {
        // Фильтруем цвета, которые еще не используются
        const unusedColors = colors.filter(c => !currentColors.includes(c));
        // Если есть неиспользуемые цвета, выбираем случайный
        if (unusedColors.length > 0) {
            return unusedColors[Math.floor(Math.random() * unusedColors.length)];
        }
    }
    
    // Если уже есть 3 цвета или нет новых, используем один из текущих
    return currentColors.length > 0 
        ? currentColors[Math.floor(Math.random() * currentColors.length)]
        : colors[Math.floor(Math.random() * colors.length)];
}

const waves = [
    {killsToNext: 15, count: 20, speed: 1, spawnRate: 3000},   // Нужно убить 15 врагов
    {killsToNext: 25, count: 30, speed: 1.5, spawnRate: 2500}, // Нужно убить 25 врагов
    {killsToNext: 35, count: 40, speed: 2, spawnRate: 2000},   // Нужно убить 35 врагов
    {killsToNext: 45, count: 50, speed: 2.5, spawnRate: 1500}, // Нужно убить 45 врагов
    {killsToNext: 55, count: 60, speed: 3, spawnRate: 1000}    // Нужно убить 55 врагов
];

// Добавляем константу для радиуса защитной зоны после game configuration
const DEFENSE_RADIUS = 200; // Радиус защитной зоны вокруг пушки

// После определения DEFENSE_RADIUS добавляем:
let rings = [
    { radius: DEFENSE_RADIUS - 40, active: true },
    { radius: DEFENSE_RADIUS - 20, active: true },
    { radius: DEFENSE_RADIUS, active: true }
];

// Добавляем настройки для контроля баланса
const ENEMY_CONFIG = {
    sizes: {
        small: { radius: 20, chance: { min: 0.0, max: 0.6 } },  // шанс от 0% до 60%
        medium: { radius: 25, chance: { min: 0.2, max: 0.8 } }, // шанс от 20% до 80%
        large: { radius: 30, chance: { min: 0.6, max: 0.0 } }   // шанс от 60% до 0%
    },
    speedMultiplier: 1.0 // Множитель скорости для маленьких врагов
};

// Game classes
class Projectile {
    constructor(x, y, angle, color) {
        this.x = x;
        this.y = y;
        this.color = color;
        this.speed = 48;
        this.vx = Math.sin(angle) * this.speed;
        this.vy = -Math.cos(angle) * this.speed;
        this.radius = 8;
        // Добавляем массив для хвоста
        this.trail = [];
        this.trailLength = 4; // Длина хвоста (количество точек)
        this.width = 6;  // Ширина лазерного луча
        this.length = 24; // Длина лазерного луча
    }

    update() {
        // Добавляем текущую позицию в начало массива
        this.trail.unshift({ x: this.x, y: this.y });
        
        // Ограничиваем длину хвоста
        if (this.trail.length > this.trailLength) {
            this.trail.pop();
        }

        this.x += this.vx;
        this.y += this.vy;
    }

    draw() {
        // Сохраняем текущее состояние контекста
        ctx.save();
        
        // Поворачиваем контекст для всего объекта (и хвоста, и пули)
        ctx.translate(this.x, this.y);
        ctx.rotate(Math.atan2(this.vy, this.vx));
        
        // Рисуем хвост
        this.trail.forEach((point, index) => {
            const alpha = 1 - (index / this.trailLength);
            const trailWidth = this.width * (1 - index / this.trailLength);
            
            // Вычисляем позицию относительно текущей позиции пули
            const dx = point.x - this.x;
            const dy = point.y - this.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            ctx.beginPath();
            ctx.fillStyle = `${this.color}${Math.floor(alpha * 255).toString(16).padStart(2, '0')}`;
            // Рисуем прямоугольник для каждого сегмента хвоста
            ctx.fillRect(-distance, -trailWidth/2, distance, trailWidth);
        });
        
        // Рисуем саму пулю
        ctx.fillStyle = this.color;
        ctx.fillRect(-this.length/2, -this.width/2, this.length, this.width);
        
        ctx.restore();
    }
}

class Particle {
    constructor(x, y, color) {
        this.x = x;
        this.y = y;
        this.color = color;
        this.size = Math.random() * 3 + 2;
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 6 + 2;
        this.vx = Math.cos(angle) * speed;
        this.vy = Math.sin(angle) * speed;
        this.alpha = 1;
        this.life = 1;
        this.isDead = false; // добавляем флаг для корректного удаления
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.vy += 0.1;
        this.life -= 0.02;
        this.alpha = this.life;
        
        if (this.life <= 0) {
            this.isDead = true;
        }
    }

    draw() {
        ctx.save();
        ctx.globalAlpha = this.alpha;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.fill();
        ctx.restore();
    }
}

class Enemy {
    constructor() {
        const sizesConfig = ENEMY_CONFIG.sizes;
        
        // Вычисляем шансы появления разных размеров в зависимости от волны
        const waveProgress = (currentWave - 1) / (waves.length - 1); // от 0 до 1
        
        // Интерполируем шансы между минимальными и максимальными значениями
        const smallChance = sizesConfig.small.chance.min + 
            (sizesConfig.small.chance.max - sizesConfig.small.chance.min) * waveProgress;
        const largeChance = sizesConfig.large.chance.min + 
            (sizesConfig.large.chance.max - sizesConfig.large.chance.min) * waveProgress;
        const mediumChance = 1 - smallChance - largeChance;
        
        // Выбираем размер на основе вычисленных шансов
        const roll = Math.random();
        if (roll < smallChance) {
            this.radius = sizesConfig.small.radius;
            // Маленькие враги двигаются быстрее
            this.speedMultiplier = ENEMY_CONFIG.speedMultiplier;
        } else if (roll < smallChance + mediumChance) {
            this.radius = sizesConfig.medium.radius;
            this.speedMultiplier = 1;
        } else {
            this.radius = sizesConfig.large.radius;
            this.speedMultiplier = 0.8; // Большие враги медленнее
        }

        this.x = Math.random() * (canvas.width - 2 * this.radius) + this.radius;
        this.y = -this.radius;
        // Модифицируем скорость с учетом множителя
        this.speed = waves[currentWave - 1].speed * this.speedMultiplier * 
            (sizesConfig.medium.radius / this.radius);
        this.shape = Math.floor(Math.random() * 4); // 0: круг, 1: квадрат, 2: треугольник, 3: ромб
        
        // Заменяем логику выбора цвета
        this.color = getRandomActiveColor();
        
        // Добавляем вектор направления к пушке
        const dx = cannonX - this.x;
        const dy = cannonY - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        this.vx = (dx / distance) * this.speed;
        this.vy = (dy / distance) * this.speed;
        
        score.totalEnemies++;
    }

    draw() {
        ctx.fillStyle = this.color;
        ctx.beginPath();

        switch(this.shape) {
            case 0: // Круг
                ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
                break;
            
            case 1: // Квадрат
                ctx.rect(this.x - this.radius, this.y - this.radius, 
                        this.radius * 2, this.radius * 2);
                break;
            
            case 2: // Треугольник
                ctx.moveTo(this.x, this.y - this.radius);
                ctx.lineTo(this.x + this.radius, this.y + this.radius);
                ctx.lineTo(this.x - this.radius, this.y + this.radius);
                break;
            
            case 3: // Ромб
                ctx.moveTo(this.x, this.y - this.radius);
                ctx.lineTo(this.x + this.radius, this.y);
                ctx.lineTo(this.x, this.y + this.radius);
                ctx.lineTo(this.x - this.radius, this.y);
                break;
        }

        ctx.closePath();
        ctx.fill();
    }

    explode() {
        // Увеличиваем количество частиц для более заметного взрыва
        for(let i = 0; i < 50; i++) {
            const particle = new Particle(this.x, this.y, this.color);
            // Добавляем большую скорость частицам
            particle.vx *= 1.5;
            particle.vy *= 1.5;
            particles.push(particle);
        }
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;

        const dx = this.x - cannonX;
        const dy = this.y - cannonY;
        const distanceToCenter = Math.sqrt(dx * dx + dy * dy);
        
        // Проверяем столкновение с кольцами от внешнего к внутреннему
        for (let i = rings.length - 1; i >= 0; i--) {
            if (rings[i].active && distanceToCenter < rings[i].radius) {
                this.explode();
                rings[i].active = false;
                
                // Если все кольца уничтожены
                if (!rings.some(ring => ring.active)) {
                    if (!isTrainingMode) {
                        gameOver = true;
                    }
                }
                
                score.missed++;
                return true;
            }
        }
        return false;
    }
}

// Helper functions for UI
function announceWave(waveNumber) {
    waveAnnouncement.textContent = `Волна ${waveNumber}`;
    waveAnnouncement.style.opacity = '1';
    setTimeout(() => {
        waveAnnouncement.style.opacity = '0';
    }, 2000);
}

// Удаляем функцию drawDefenseLine и добавляем новую
function drawDefenseZone() {
    rings.forEach(ring => {
        if (ring.active) {
            ctx.beginPath();
            ctx.arc(cannonX, cannonY, ring.radius, 0, Math.PI * 2);
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
            ctx.lineWidth = 2;
            ctx.setLineDash([10, 10]);
            ctx.stroke();
            ctx.setLineDash([]);
        }
    });
}

function updateStats() {
    const currentWaveConfig = waves[currentWave - 1];
    const killsNeeded = currentWaveConfig.killsToNext;
    const progress = isTrainingMode ? 
        `Прогресс волны: ${score.killsThisWave}/${killsNeeded}` : '';

    stats.innerHTML = `
        ${isTrainingMode ? 'Режим: Тренировка<br>' : ''}
        Волна: ${currentWave}<br>
        ${isTrainingMode ? progress + '<br>' : ''}
        Очки: ${score.killed}<br>
        Точность: ${Math.round((score.hits / score.shots || 0) * 100)}%<br>
        Пропущено: ${score.missed}
    `;
}

function getActiveColors() {
    // Если врагов нет, возвращаем все доступные цвета
    // Иначе только те цвета, которые есть у активных врагов
    return enemies.length > 0 
        ? [...new Set(enemies.map(enemy => enemy.color))] 
        : colors;
}

function createColorPanel() {
    colorPanel.innerHTML = '';
    const activeColors = getActiveColors();
    
    // Если текущий цвет больше не активен, переключаемся на первый доступный
    if (!activeColors.includes(colors[currentColorIndex])) {
        currentColorIndex = colors.indexOf(activeColors[0]);
    }
    
    activeColors.forEach(color => {
        const div = document.createElement('div');
        div.className = `color-option ${color === colors[currentColorIndex] ? 'active' : ''}`;
        div.style.background = color;
        div.onclick = () => {
            currentColorIndex = colors.indexOf(color);
            updateColorPanel();
        };
        colorPanel.appendChild(div);
    });
}

function updateColorPanel() {
    document.querySelectorAll('.color-option').forEach((div, index) => {
        div.className = `color-option ${index === currentColorIndex ? 'active' : ''}`;
    });
}

function drawCannon() {
    const baseWidth = 60;
    const baseHeight = 40;
    const barrelLength = 60;
    const barrelWidth = 20;
    
    ctx.save();
    ctx.translate(cannonX, cannonY);
    ctx.rotate(angle);
    
    // Draw laser sight first (under the cannon)
    const lineLength = Math.max(canvas.width, canvas.height) * 2; // Достаточно длинная линия
    ctx.beginPath();
    ctx.strokeStyle = colors[currentColorIndex] + '40'; // 25% opacity
    ctx.lineWidth = 2;
    ctx.moveTo(0, -baseHeight - barrelLength);
    ctx.lineTo(0, -lineLength);
    ctx.stroke();
    
    // Draw base
    ctx.fillStyle = '#888';
    ctx.beginPath();
    ctx.moveTo(-baseWidth/2, 0);
    ctx.lineTo(baseWidth/2, 0);
    ctx.lineTo(baseWidth/3, -baseHeight);
    ctx.lineTo(-baseWidth/3, -baseHeight);
    ctx.closePath();
    ctx.fill();

    // Draw barrel
    ctx.fillStyle = colors[currentColorIndex];
    ctx.beginPath();
    ctx.moveTo(-barrelWidth/2, -baseHeight);
    ctx.lineTo(barrelWidth/2, -baseHeight);
    ctx.lineTo(barrelWidth/2, -baseHeight - barrelLength);
    ctx.lineTo(-barrelWidth/2, -baseHeight - barrelLength);
    ctx.closePath();
    ctx.fill();
    
    ctx.restore();
}

// Game initialization and event handlers
function initializeGame() {
    if (!canvas || !colorPanel || !mainMenu || !playBtn || !stats || !waveAnnouncement || !restartBtn) {
        console.error('Required DOM elements not found');
        return;
    }

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    cannonX = canvas.width / 2;
    cannonY = canvas.height - 100;
    
    // Event listeners
    window.addEventListener('mousemove', (e) => {
        const dx = e.clientX - cannonX;
        const dy = cannonY - e.clientY;
        angle = -Math.atan2(dy, dx) + Math.PI/2;
    });
    
    // Удаляем старые обработчики mousedown и mouseup
    
    // Обновляем обработчик колесика
    window.addEventListener('wheel', (e) => {
        e.preventDefault();
        const now = Date.now();
        const timeDelta = now - lastWheelTime;
        
        // Рассчитываем скорость прокрутки
        if (timeDelta < 200) { // Если прокрутка была недавно
            wheelSpeed = Math.min(20, wheelSpeed + Math.abs(e.deltaY) / 100);
        } else {
            wheelSpeed = Math.abs(e.deltaY) / 100;
        }

        // Сбрасываем скорость через некоторое время
        setTimeout(() => {
            wheelSpeed *= 0.5;
        }, 50);

        lastWheelTime = now;
        
        // Стреляем количество раз пропорционально скорости
        const shots = Math.ceil(wheelSpeed);
        for(let i = 0; i < shots; i++) {
            shoot();
        }
    });

    // Добавляем обработчик левой кнопки мыши для смены цвета влево
    window.addEventListener('click', (e) => {
        e.preventDefault();
        if (e.button === 0) { // Левая кнопка мыши
            changeColor('left');
        }
    });

    // Изменяем обработчик правой кнопки для смены цвета вправо
    window.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        changeColor('right');
    });
    
    window.addEventListener('resize', () => {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        cannonX = canvas.width / 2;
        cannonY = canvas.height - 100;
    });
    
    createColorPanel();
    
    // Add click handler for play button
    playBtn.addEventListener('click', startGame);
    restartBtn.addEventListener('click', () => {
        location.reload();
    });

    const trainingBtn = document.getElementById('trainingBtn');
    trainingBtn.addEventListener('click', () => {
        isTrainingMode = true;
        startGame();
    });
    
    playBtn.addEventListener('click', () => {
        isTrainingMode = false;
        startGame();
    });

    pauseBtn.addEventListener('click', () => {
        isPaused = !isPaused;
        pauseText.style.display = isPaused ? 'block' : 'none';
    });

    homeBtn.addEventListener('click', () => {
        location.reload(); // Перезагружаем страницу для возврата в главное меню
    });
}

function startGame() {
    mainMenu.style.display = 'none';
    canvas.style.display = 'block';
    colorPanel.style.display = 'flex';
    pauseBtn.style.display = 'block'; // Показываем кнопку паузы
    homeBtn.style.display = 'block'; // Показываем кнопку возврата
    startTime = Date.now();
    score.killsThisWave = 0; // Добавляем счетчик убийств для текущей волны
    announceWave(currentWave);
    activeEnemyColors = []; // Очищаем массив активных цветов
    if (isTrainingMode) {
        waveSelector.style.display = 'flex';
        createWaveButtons();
    } else {
        waveSelector.style.display = 'none';
    }
    rings.forEach(ring => ring.active = true); // Восстанавливаем все кольца
    gameLoop();
}

function shoot() {
    const now = Date.now();
    // Было: минимальная задержка 50мс, базовая задержка 250мс
    // Сделаем минимальную задержку 10мс, базовую 100мс
    const minDelay = Math.max(10, 100 - wheelSpeed * 10);
    
    if(now - lastShot > minDelay) {
        projectiles.push(new Projectile(
            cannonX + Math.sin(angle) * 60,
            cannonY - Math.cos(angle) * 60,
            angle,
            colors[currentColorIndex]
        ));
        score.shots++;
        lastShot = now;
    }
}

function checkCollisions() {
    for(let i = projectiles.length - 1; i >= 0; i--) {
        const proj = projectiles[i];
        
        for(let j = enemies.length - 1; j >= 0; j--) {
            const enemy = enemies[j];
            const dx = proj.x - enemy.x;
            const dy = proj.y - enemy.y;
            const distance = Math.sqrt(dx*dx + dy*dy);
            
            if(distance < enemy.radius + proj.radius && proj.color === enemy.color) {
                enemy.explode();
                enemies.splice(j, 1);
                projectiles.splice(i, 1);
                score.killed++;
                score.hits++;
                score.killsThisWave++; // Увеличиваем счетчик убийств текущей волны
                break;
            }
        }
    }

    // Проверяем условие перехода на следующую волну для обоих режимов
    if (score.killsThisWave >= waves[currentWave - 1].killsToNext) {
        if (currentWave < waves.length) {
            currentWave++;
            score.killsThisWave = 0;
            spawnRate = waves[currentWave - 1].spawnRate;
            announceWave(currentWave);
            if (isTrainingMode) {
                updateWaveButtons(); // Обновляем активную кнопку
            }
        } else if (enemies.length === 0) {
            // Победа в любом режиме после прохождения всех волн
            gameWon = true;
        } else if (isTrainingMode) {
            currentWave = 1;
            score.killsThisWave = 0;
            spawnRate = waves[currentWave - 1].spawnRate;
            announceWave(currentWave);
            updateWaveButtons(); // Обновляем активную кнопку при возврате к первой волне
        }
    }

    // После удаления всех врагов обновляем список активных цветов
    if (enemies.length === 0) {
        activeEnemyColors = [];
    } else {
        // Обновляем список активных цветов на основе оставшихся врагов
        activeEnemyColors = [...new Set(enemies.map(enemy => enemy.color))];
    }
}

// Добавляем новую функцию для обновления кнопок волн
function updateWaveButtons() {
    document.querySelectorAll('.wave-button').forEach((btn, i) => {
        btn.className = `wave-button ${i + 1 === currentWave ? 'active' : ''}`;
    });
}

function gameLoop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    if(!gameOver && !gameWon) {
        if (!isPaused) {
            const currentTime = Date.now();
            // Изменяем условие спавна врагов
            if((currentTime - lastSpawn > waves[currentWave - 1].spawnRate && 
               (isTrainingMode || enemies.length < waves[currentWave - 1].count)) || 
               enemies.length < 2) { // Добавляем проверку на минимум 2 врага
                enemies.push(new Enemy());
                lastSpawn = currentTime;
            }
            
            // Сначала обновляем все частицы
            particles.forEach(particle => {
                particle.update();
            });
            
            // Затем фильтруем мертвые частицы
            particles = particles.filter(particle => !particle.isDead);
            
            // И только после этого отрисовываем оставшиеся
            particles.forEach(particle => {
                particle.draw();
            });

            enemies.forEach((enemy, index) => {
                if (enemy.update()) {
                    enemies.splice(index, 1); // Удаляем врага, если он пересек зону
                }
                enemy.draw();
            });
            
            projectiles = projectiles.filter(proj => 
                proj.x > 0 && proj.x < canvas.width && 
                proj.y > 0 && proj.y < canvas.height
            );
            
            projectiles.forEach(proj => {
                proj.update();
                proj.draw();
            });
            
            // Обновляем цветовую панель после обновления врагов
            createColorPanel();
            
            checkCollisions();
            drawDefenseZone(); // Заменяем drawDefenseLine на drawDefenseZone
            drawCannon();
            updateStats();
        } else {
            particles.forEach(particle => particle.draw());
            enemies.forEach(enemy => enemy.draw());
            projectiles.forEach(proj => proj.draw());
            createColorPanel();
            drawDefenseZone(); // Заменяем drawDefenseLine на drawDefenseZone
            drawCannon();
            updateStats();
        }
    } else {
        // Очищаем все UI элементы
        colorPanel.style.display = 'none';
        pauseBtn.style.display = 'none';
        homeBtn.style.display = 'none'; // Скрываем кнопку возврата
        waveSelector.style.display = 'none';
        stats.style.display = 'none';

        ctx.fillStyle = gameWon ? '#00FF00' : '#FF0000';
        ctx.font = '48px Arial';
        ctx.textAlign = 'center';
        if(gameOver) {
            ctx.fillText('Игра окончена!', canvas.width/2, canvas.height/2);
        } else if(gameWon) {
            ctx.fillText('Игра пройдена!', canvas.width/2, canvas.height/2);
        }
        restartBtn.style.display = 'block';
    }
    
    requestAnimationFrame(gameLoop);
}

// Initialize the game when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    if (!ctx) {
        console.error('Could not get canvas context');
    } else {
        initializeGame();
    }
});

function changeColor(direction) {
    const activeColors = getActiveColors();
    const currentIndex = activeColors.indexOf(colors[currentColorIndex]);
    
    if (direction === 'left') {
        // Движение влево по массиву цветов
        const newIndex = (currentIndex - 1 + activeColors.length) % activeColors.length;
        currentColorIndex = colors.indexOf(activeColors[newIndex]);
    } else {
        // Движение вправо по массиву цветов
        const newIndex = (currentIndex + 1) % activeColors.length;
        currentColorIndex = colors.indexOf(activeColors[newIndex]);
    }
    updateColorPanel();
}

// Добавляем функцию создания кнопок выбора волн
function createWaveButtons() {
    waveSelector.innerHTML = '';
    waves.forEach((_, index) => {
        const button = document.createElement('button');
        button.className = `wave-button ${currentWave === index + 1 ? 'active' : ''}`;
        button.textContent = `Волна ${index + 1}`;
        button.onclick = () => {
            if (isTrainingMode) {
                currentWave = index + 1;
                score.killsThisWave = 0;
                spawnRate = waves[currentWave - 1].spawnRate;
                announceWave(currentWave);
                // Обновляем активный класс у кнопок
                document.querySelectorAll('.wave-button').forEach((btn, i) => {
                    btn.className = `wave-button ${i + 1 === currentWave ? 'active' : ''}`;
                });
            }
        };
        waveSelector.appendChild(button);
    });
}