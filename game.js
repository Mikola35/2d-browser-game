import CONFIG from './config.js';

// Добавим в начало файла переменную режима
let isTrainingMode = false;

// В начале файла добавляем новые переменные
const patrolBtn = document.getElementById('patrolBtn');
let isPatrolEnabled = false;

// В начало файла добавляем переменные
const patrolRange = document.getElementById('patrolRange');
const patrolDistance = document.getElementById('patrolDistance');
const patrolDistanceValue = document.getElementById('patrolDistanceValue');
let patrolMaxDistance = 0; // Теперь это будет вычисляемое значение

// В начале файла после других констант добавляем:
let isManualControl = true;

// Добавляем новые переменные в начало файла
const autoShootBtn = document.getElementById('autoShootBtn');
let isAutoShootEnabled = false;

// Добавляем константы для клавиш управления
const KEYS = {
    LEFT: 'ArrowLeft',
    RIGHT: 'ArrowRight',
    UP: 'ArrowUp',
    DOWN: 'ArrowDown',
    SPACE: ' ',
    ESCAPE: 'Escape'  // Добавляем клавишу ESC
};

// Добавляем состояние клавиш
const keyState = {
    [KEYS.LEFT]: false,
    [KEYS.RIGHT]: false,
    [KEYS.SPACE]: false
};

// Скорость поворота при управлении клавиатурой (радиан/кадр)
const KEYBOARD_ROTATION_SPEED = 0.02; // Уменьшили с 0.05 до 0.02 для более плавного поворота

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
const howToPlayBtn = document.getElementById('howToPlayBtn');
const instructionsScreen = document.getElementById('instructionsScreen');
const closeInstructionsBtn = document.getElementById('closeInstructionsBtn');
let isPaused = false;

// Добавляем после других переменных состояния игры
let patrolAngle = 0;
let patrolDirection = 1;
const PATROL_SPEED = 0.0005; // Снижаем скорость патрулирования
const PATROL_RANGE = Math.PI / 6; // Уменьшаем диапазон до 30 градусов

// Добавляем после других переменных состояния игры
let targetAngle = 0; // Целевой угол для плавного поворота
const ROTATION_SPEED = 0.05; // Уменьшаем скорость поворота

// Добавляем после других переменных состояния игры
let basePatrolAngle = 0; // Базовый угол для патрулирования

// В начале файла после других переменных состояния игры добавляем:
let startTime;
let gameTime = 0; // Общее время игры
let lastFrameTime; // Время последнего кадра для расчета дельты

// После других переменных состояния игры добавляем:
let targetX = 0;
let targetY = 0;
let movementKeys = {
    'KeyW': false,
    'KeyS': false,
    'KeyA': false,
    'KeyD': false
};

// Добавляем после других переменных состояния игры
let isDragging = false;

// Game state variables
let enemies = [];
let projectiles = [];
let particles = [];
let gameOver = false;
let gameWon = false;
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
    killed: 0,     // Счётчик уничтоженных врагов
    points: 0,     // Добавляем счётчик очков
    hits: 0,
    misses: 0,
    shots: 0,
    missed: 0  // Добавляем счетчик пропущенных врагов
};
let wheelSpeed = 0; // Добавляем переменную для отслеживания скорости прокрутки
let lastWheelTime = 0; // Время последней прокрутки

// Game configuration
let activeEnemyColors = []; // Массив для отслеживания текущих цветов врагов

function getRandomActiveColor() {
    // Получаем текущие активные цвета
    const currentColors = [...new Set(enemies.map(enemy => enemy.color))];
    
    // Если активных цветов меньше 3, добавляем новый цвет
    if (currentColors.length < 3) {
        // Фильтруем цвета, исключая белый цвет (первый в массиве) и уже используемые цвета
        const unusedColors = CONFIG.colors.slice(1).filter(c => !currentColors.includes(c));
        // Если есть неиспользуемые цвета, выбираем случайный
        if (unusedColors.length > 0) {
            return unusedColors[Math.floor(Math.random() * unusedColors.length)];
        }
    }
    
    // Если уже есть 3 цвета или нет новых, используем один из текущих
    return currentColors.length > 0 
        ? currentColors[Math.floor(Math.random() * currentColors.length)]
        : CONFIG.colors[1 + Math.floor(Math.random() * (CONFIG.colors.length - 1))]; // Исключаем белый цвет
}

/*
Конфигурация волн:
killsToNext - количество врагов, которых нужно убить для перехода на следующую волну
count - максимальное количество врагов на экране одновременно
speed - множитель скорости врагов (1.0 = базовая скорость)
spawnRate - частота появления врагов в миллисекундах (чем меньше, тем чаще)
*/

// Используем конфигурацию из CONFIG
const waves = CONFIG.waves;

// Добавляем константу для радиуса защитной зоны после game configuration
const DEFENSE_RADIUS = 200; // Радиус защитной зоны вокруг пушки

// После определения DEFENSE_RADIUS добавляем:
let rings = [
    { radius: DEFENSE_RADIUS - 40, active: true },
    { radius: DEFENSE_RADIUS - 20, active: true },
    { radius: DEFENSE_RADIUS, active: true },
    { radius: 60, active: true, invisible: true } // Невидимое кольцо вокруг пушки
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

// В начало файла добавляем:
const eventHandlers = new Map();

// Game classes
class Projectile {
    constructor(x, y, angle, color) {
        this.x = x;
        this.y = y;
        this.color = color;
        this.speed = CONFIG.projectile.speed; // Было 32
        this.vx = Math.sin(angle) * this.speed;
        this.vy = -Math.cos(angle) * this.speed;
        this.radius = CONFIG.projectile.radius;
        // Добавляем массив для хвоста
        this.trail = [];
        this.trailLength = CONFIG.projectile.trailLength; // Длина хвоста (количество точек)
        this.width = CONFIG.projectile.width;  // Ширина лазерного луча
        this.length = CONFIG.projectile.length; // Длина лазерного луча
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
    constructor(x, y, color, angle, speedMultiplier = 1) {
        this.x = x;
        this.y = y;
        this.color = color;
        this.size = Math.random() * (CONFIG.particles.maxSize - CONFIG.particles.minSize) + CONFIG.particles.minSize;
        
        // Используем переданный угол и множитель скорости
        const speed = (Math.random() * (CONFIG.particles.maxSpeed - CONFIG.particles.minSpeed) + 
                      CONFIG.particles.minSpeed) * speedMultiplier;
        this.vx = Math.cos(angle) * speed;
        this.vy = Math.sin(angle) * speed;
        
        this.alpha = 1;
        this.life = 1;
        this.isDead = false;
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.vy += CONFIG.particles.gravity; // Было 0.1
        this.life -= CONFIG.particles.fadeSpeed; // Было 0.02
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

        // Заменяем эти строки:
        const { padding, height } = CONFIG.debug.spawnArea;
        this.x = padding + Math.random() * (canvas.width - padding * 2);
        this.y = height; // Спавним точно в зоне спавна

        // Модифицируем скорость с учетом множителя из CONFIG.waves
        this.speed = CONFIG.waves[currentWave - 1].speed * this.speedMultiplier * 
            (sizesConfig.medium.radius / this.radius);
        // Заменяем выбор формы на более разнообразный
        this.shape = Math.floor(Math.random() * 5); // 5 разных форм вместо 6
        this.rotation = Math.random() * Math.PI * 2; // Добавляем случайный поворот
        this.spikes = 3 + Math.floor(Math.random() * 4); // От 3 до 6 шипов для звезды
        this.alpha = 0.9 + Math.random() * 0.1; // Добавляем случайную прозрачность (90-100%)
        
        // Заменяем логику выбора цвета
        this.color = getRandomActiveColor();
        
        // Добавляем вектор направления к пушке
        const dx = cannonX - this.x;
        const dy = cannonY - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        this.vx = (dx / distance) * this.speed;
        this.vy = (dy / distance) * this.speed;
        
        score.totalEnemies++;

        // Добавляем сохранение целевой позиции
        this.targetX = cannonX;
        this.targetY = cannonY;
    }

    draw() {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation);
        ctx.globalAlpha = this.alpha; // Устанавливаем прозрачность
        ctx.fillStyle = this.color;
        ctx.beginPath();

        switch(this.shape) {
            case 0: // Круг
                ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
                break;
            
            case 1: // Треугольник
                drawPolygon(0, 0, this.radius, 3);
                break;
            
            case 2: // Ромб
                ctx.moveTo(0, -this.radius);
                ctx.lineTo(this.radius, 0);
                ctx.lineTo(0, this.radius);
                ctx.lineTo(-this.radius, 0);
                break;

            case 3: // Звезда
                drawStar(0, 0, this.radius, this.radius/2, this.spikes);
                break;

            case 4: // Крест-снежинка
                for (let i = 0; i < 5; i++) {
                    const angle = (i * Math.PI * 2) / 5;
                    const thickness = this.radius / 6;
                    
                    ctx.save();
                    ctx.rotate(angle);
                    
                    // Рисуем луч креста
                    ctx.moveTo(-thickness, 0);
                    ctx.lineTo(thickness, 0);
                    ctx.lineTo(thickness, -this.radius);
                    ctx.lineTo(-thickness, -this.radius);
                    ctx.closePath();
                    
                    ctx.restore();
                }
                break;
        }

        ctx.fill();
        ctx.restore();

        // Добавляем отрисовку отладочной информации
        if (CONFIG.debug.enabled && isTrainingMode) {
            // Сохраняем контекст перед отрисовкой отладки
            ctx.save();
            
            // Рисуем пунктирную линию от врага к цели
            ctx.beginPath();
            ctx.setLineDash(CONFIG.debug.enemies.pathDash);
            ctx.strokeStyle = CONFIG.debug.enemies.pathColor + '80'; // Добавляем прозрачность
            ctx.lineWidth = 1;
            ctx.moveTo(this.x, this.y);
            ctx.lineTo(this.targetX, this.targetY);
            ctx.stroke();
            
            // Рисуем стрелку направления движения
            const angle = Math.atan2(this.vy, this.vx);
            const arrowLength = CONFIG.debug.enemies.arrowLength;
            const endX = this.x + Math.cos(angle) * arrowLength;
            const endY = this.y + Math.sin(angle) * arrowLength;
            
            // Рисуем основную линию стрелки
            ctx.beginPath();
            ctx.setLineDash([]);
            ctx.strokeStyle = CONFIG.debug.enemies.arrowColor;
            ctx.lineWidth = CONFIG.debug.enemies.arrowWidth;
            ctx.moveTo(this.x, this.y);
            ctx.lineTo(endX, endY);
            
            // Рисуем наконечник стрелки
            const headLength = arrowLength / 3;
            const headAngle = Math.PI / 6; // 30 градусов
            
            ctx.moveTo(endX, endY);
            ctx.lineTo(
                endX - headLength * Math.cos(angle - headAngle),
                endY - headLength * Math.sin(angle - headAngle)
            );
            ctx.moveTo(endX, endY);
            ctx.lineTo(
                endX - headLength * Math.cos(angle + headAngle),
                endY - headLength * Math.sin(angle + headAngle)
            );
            ctx.stroke();
            
            ctx.restore();
        }
    }

    explode(projectile = null) {
        // Если есть projectile, то это уничтожение от пули
        const particleConfig = {
            count: CONFIG.enemies.explosion.particleCount,
            speedMultiplier: CONFIG.enemies.explosion.speedMultiplier,
            angleSpread: projectile ? Math.PI / 4 : Math.PI * 2, // Угол разброса частиц
            baseAngle: projectile ? Math.atan2(projectile.vy, projectile.vx) : 0 // Направление пули
        };

        for(let i = 0; i < particleConfig.count; i++) {
            // Вычисляем угол для частицы
            let angle;
            if (projectile) {
                // При попадании пули - в направлении её полёта с небольшим разбросом
                angle = particleConfig.baseAngle - particleConfig.angleSpread/2 + 
                       Math.random() * particleConfig.angleSpread;
            } else {
                // При столкновении - во все стороны
                angle = Math.random() * Math.PI * 2;
            }

            if (particles.length < CONFIG.limits.maxParticles) {
                const particle = new Particle(
                    this.x, 
                    this.y, 
                    this.color, 
                    angle,
                    projectile ? particleConfig.speedMultiplier * 1.5 : particleConfig.speedMultiplier
                );
                particles.push(particle);
            }
        }
    }

    update() {
        // Обновляем целевую позицию
        this.targetX = cannonX;
        this.targetY = cannonY;

        // Обновляем вектор направления к текущей позиции пушки
        const dx = this.targetX - this.x;
        const dy = this.targetY - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // Обновляем скорость движения
        this.vx = (dx / distance) * this.speed;
        this.vy = (dy / distance) * this.speed;
        
        // Применяем движение
        this.x += this.vx;
        this.y += this.vy;

        const dx2 = this.x - cannonX;
        const dy2 = this.y - cannonY;
        const distanceToCenter = Math.sqrt(dx2 * dx2 + dy2 * dy2);
        
        // Проверяем столкновение с кольцами от внешнего к внутреннему
        for (let i = rings.length - 1; i >= 0; i--) {
            if (rings[i].active && distanceToCenter < rings[i].radius) {
                this.explode();
                rings[i].active = false;
                
                // Если это последнее невидимое кольцо (пушка) и не тренировочный режим
                if (i === rings.length - 1 && !isTrainingMode) {
                    // Сразу создаем части пушки и отключаем отрисовку оригинальной пушки
                    gameOver = true;
                    const pieces = [
                        new CannonPiece(cannonX, cannonY, CONFIG.colors[currentColorIndex], 'barrel'),
                        new CannonPiece(cannonX, cannonY, CONFIG.colors[currentColorIndex], 'base'),
                        new CannonPiece(cannonX, cannonY, CONFIG.colors[currentColorIndex], 'circle')
                    ];
                    cannonPieces.push(...pieces);
                    setTimeout(() => gameOver = true, 1500);
                }
                // Если все видимые кольца уничтожены, активируем последнее
                else if (!rings.slice(0, -1).some(ring => ring.active)) {
                    rings[rings.length - 1].active = true; // Активируем невидимое кольцо
                }
                
                score.missed++;
                return true;
            }
        }
        return false;
    }
}

class CannonPiece {
    constructor(x, y, color, type) {
        this.x = x;
        this.y = y;
        this.color = color;
        this.type = type; // 'base', 'barrel' или 'circle'
        this.angle = Math.random() * Math.PI * 2;
        this.speed = Math.random() * 8 + 4;
        this.rotationSpeed = (Math.random() - 0.5) * 0.2;
        this.vx = Math.cos(this.angle) * this.speed;
        this.vy = Math.sin(this.angle) * this.speed;
        this.rotation = Math.random() * Math.PI * 2;
        this.alpha = 1;
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.vy += 0.2; // Гравитация
        this.rotation += this.rotationSpeed;
        this.alpha = Math.max(0, this.alpha - 0.02);
        return this.alpha > 0;
    }

    draw() {
        ctx.save();
        ctx.globalAlpha = this.alpha;
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation);

        switch(this.type) {
            case 'base':
                ctx.fillStyle = '#888';
                ctx.beginPath();
                ctx.moveTo(-30, 0);
                ctx.lineTo(30, 0);
                ctx.lineTo(20, -20);
                ctx.lineTo(-20, -20);
                ctx.closePath();
                ctx.fill();
                break;
            case 'barrel':
                ctx.fillStyle = this.color;
                ctx.fillRect(-10, -40, 20, 40);
                break;
            case 'circle':
                ctx.fillStyle = '#666';
                ctx.beginPath();
                ctx.arc(0, 0, 27, 0, Math.PI * 2);
                ctx.fill();
                break;
        }
        ctx.restore();
    }
}

let cannonPieces = []; // Добавьте это к остальным переменным состояния игры

// Helper functions for UI
function announceWave(waveNumber) {
    waveAnnouncement.style.animation = 'none';
    waveAnnouncement.offsetHeight; // Форсируем перерасчет стилей
    waveAnnouncement.textContent = `Волна ${waveNumber}`;
    waveAnnouncement.style.animation = 'announceWave 2s ease-in-out forwards';
}

// Удаляем функцию drawDefenseLine и добавляем новую
function drawDefenseZone() {
    // Сперва рисуем область патрулирования, если она активна
    if (isPatrolEnabled && isTrainingMode) {
        const percent = parseInt(patrolDistance.value) / 100;
        const maxRange = percent * (canvas.height - DEFENSE_RADIUS) + DEFENSE_RADIUS;
        
        // Создаем градиент от пушки до maxRange
        const gradient = ctx.createRadialGradient(
            cannonX, cannonY, DEFENSE_RADIUS,
            cannonX, cannonY, maxRange
        );
        gradient.addColorStop(0.5, 'rgba(255, 255, 255, 0)');
        gradient.addColorStop(1, 'rgba(255, 255, 255, 0.05)');

        // Рисуем градиентную область
        ctx.beginPath();
        ctx.arc(cannonX, cannonY, maxRange, 0, Math.PI * 2);
        ctx.fillStyle = gradient;
        ctx.fill();
    }

    // Рисуем защитные кольца как обычно
    rings.forEach(ring => {
        if (ring.active && !ring.invisible) {
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

function formatTime(ms) {
    const seconds = Math.floor((ms / 1000) % 60);
    const minutes = Math.floor((ms / 1000 / 60) % 60);
    const hours = Math.floor(ms / 1000 / 60 / 60);
    
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

function updateStats() {
    const currentWaveConfig = waves[currentWave - 1];
    const killsNeeded = currentWaveConfig.killsToNext;
    const progress = isTrainingMode ? 
        `Прогресс волны: ${score.killsThisWave}/${killsNeeded}` : '';
    
    const currentTime = formatTime(gameTime); // Используем gameTime вместо Date.now() - startTime
    const accuracy = Math.round((score.hits / score.shots || 0) * 100);

    stats.innerHTML = `
        ${isTrainingMode ? 'Режим: Тренировка<br>' : ''}
        Длительность: ${currentTime}<br>
        Волна: ${currentWave}<br>
        ${isTrainingMode ? progress + '<br>' : ''}
        Врагов на экране: ${enemies.length}/${currentWaveConfig.count}<br>
        Уничтожено: ${score.killed}<br>
        Очки: ${score.points}<br>
        Пропущено: ${score.missed}<br>
        Выстрелов: ${score.shots}<br>
        Точность: ${accuracy}%
    `;
}

// Изменяем функцию getActiveColors
function getActiveColors() {
    // Получаем уникальный массив цветов активных врагов
    const enemyColors = [...new Set(enemies.map(enemy => enemy.color))];
    
    // Если врагов нет совсем, используем только белый цвет
    if (enemies.length === 0) {
        return [CONFIG.colors[0]]; // Возвращаем белый цвет (первый в массиве)
    }

    // Если текущий цвет не соответствует ни одному врагу на поле
    // и есть другие цвета врагов, переключаемся на первый доступный цвет врага
    if (!enemyColors.includes(CONFIG.colors[currentColorIndex]) && enemyColors.length > 0) {
        currentColorIndex = CONFIG.colors.indexOf(enemyColors[0]);
    }
    
    // Возвращаем только цвета активных врагов
    return enemyColors;
}

function createColorPanel() {
    colorPanel.innerHTML = '';
    const activeColors = getActiveColors();
    
    // Создаем цветовые опции только для активных цветов
    activeColors.forEach(color => {
        const div = document.createElement('div');
        div.className = `color-option ${color === CONFIG.colors[currentColorIndex] ? 'active' : ''}`;
        div.style.background = color;
        div.onclick = () => {
            currentColorIndex = CONFIG.colors.indexOf(color);
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
    if (!gameOver) {
        const cfg = CONFIG.cannon;
        const cannonColor = enemies.length === 0 ? 
            CONFIG.colors[0] : 
            CONFIG.colors[currentColorIndex];
        
        ctx.save();
        ctx.translate(cannonX, cannonY);
        ctx.rotate(angle);
        
        // Draw laser sight
        const lineLength = Math.max(canvas.width, canvas.height) * 2;
        ctx.beginPath();
        ctx.strokeStyle = cannonColor + '20';
        ctx.lineWidth = 2;
        ctx.moveTo(0, -cfg.baseHeight + cfg.barrelLength);
        ctx.lineTo(0, -lineLength);
        ctx.stroke();
        
        // Draw circular base
        ctx.fillStyle = cfg.colors.circle;
        ctx.beginPath();
        ctx.arc(0, 0, cfg.baseRadius, 0, Math.PI * 2);
        ctx.fill();
        
        // Draw base
        ctx.fillStyle = cfg.colors.base;
        ctx.beginPath();
        ctx.moveTo(-cfg.baseWidth/2, 0);
        ctx.lineTo(cfg.baseWidth/2, 0);
        ctx.lineTo(cfg.baseWidth/3, -cfg.baseHeight);
        ctx.lineTo(-cfg.baseWidth/3, -cfg.baseHeight);
        ctx.closePath();
        ctx.fill();

        // Draw barrel with tapering
        ctx.fillStyle = cannonColor; // Динамический цвет для ствола
        ctx.beginPath();
        ctx.moveTo(-cfg.barrelBaseWidth/2, -cfg.baseHeight);
        ctx.lineTo(cfg.barrelBaseWidth/2, -cfg.baseHeight);
        ctx.lineTo(cfg.barrelTipWidth/2, -cfg.baseHeight - cfg.barrelLength);
        ctx.lineTo(-cfg.barrelTipWidth/2, -cfg.baseHeight - cfg.barrelLength);
        ctx.closePath();
        ctx.fill();
        
        ctx.restore();
    }
}

// Game initialization and event handlers
function initializeGame() {
    if (!canvas || !colorPanel || !mainMenu || !playBtn || !stats || !waveAnnouncement || !restartBtn) {
        console.error('Required DOM elements not found');
        return;
    }

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    // Используем настройки из конфига для позиционирования пушки
    cannonX = canvas.width * CONFIG.cannon.position.x;
    cannonY = canvas.height - CONFIG.cannon.position.y - CONFIG.cannon.position.elevation;
    
    // Event listeners
    const mouseMoveHandler = (e) => {
        if (!isPatrolEnabled || !isTrainingMode) {
            const dx = e.clientX - cannonX;
            const dy = cannonY - e.clientY;
            angle = -Math.atan2(dy, dx) + Math.PI/2;
            isManualControl = true;
        }

        if (isDragging) {
            const rect = canvas.getBoundingClientRect();
            targetX = Math.min(Math.max(e.clientX - rect.left, CONFIG.cannon.movement.margin), 
                canvas.width - CONFIG.cannon.movement.margin);
            targetY = Math.min(Math.max(e.clientY - rect.top, CONFIG.cannon.movement.margin), 
                canvas.height - CONFIG.cannon.movement.margin);
        }
    };
    window.addEventListener('mousemove', mouseMoveHandler);
    eventHandlers.set('mousemove', mouseMoveHandler);
    
    // Удаляем старые обработчики mousedown и mouseup
    
    // Обновляем обработчик колесика
    const wheelHandler = (e) => {
        e.preventDefault();
        // Если включен автоогонь, игнорируем прокрутку
        if (isPatrolEnabled && isTrainingMode) return;
        
        const now = Date.now();
        const timeDelta = now - lastWheelTime;
        
        if (timeDelta < 200) {
            wheelSpeed = Math.min(20, wheelSpeed + Math.abs(e.deltaY) / 100);
        } else {
            wheelSpeed = Math.abs(e.deltaY) / 100;
        }

        setTimeout(() => {
            wheelSpeed *= 0.5;
        }, 50);

        lastWheelTime = now;
        
        const shots = Math.ceil(wheelSpeed);
        for(let i = 0; i < shots; i++) {
            shoot();
        }
    };
    window.addEventListener('wheel', wheelHandler, { passive: false }); // Добавляем этот параметр
    eventHandlers.set('wheel', wheelHandler);

    // Заменяем обработчик клика
    const clickHandler = (e) => {
        // Если клик был по ссылке, не делаем ничего
        if (e.target.tagName === 'A') {
            return;
        }
        
        e.preventDefault();
        if (e.button === 0) { // Левая кнопка мыши
            changeColor('left');
        }
    };
    window.addEventListener('click', clickHandler);
    eventHandlers.set('click', clickHandler);

    // Заменяем обработчик правой кнопки мыши
    const contextMenuHandler = (e) => {
        e.preventDefault();
        changeColor('right');
    };
    window.addEventListener('contextmenu', contextMenuHandler);
    eventHandlers.set('contextmenu', contextMenuHandler);

    // Изменяем обработчик средней кнопки мыши
    const mouseDownHandler = (e) => {
        if (e.button === 1) { // Средняя кнопка мыши
            e.preventDefault();
            isDragging = true;
            const rect = canvas.getBoundingClientRect();
            targetX = Math.min(Math.max(e.clientX - rect.left, CONFIG.cannon.movement.margin), 
                canvas.width - CONFIG.cannon.movement.margin);
            targetY = Math.min(Math.max(e.clientY - rect.top, CONFIG.cannon.movement.margin), 
                canvas.height - CONFIG.cannon.movement.margin);
        }
    };
    window.addEventListener('mousedown', mouseDownHandler);
    eventHandlers.set('mousedown', mouseDownHandler);

    const resizeHandler = () => {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        cannonX = canvas.width * CONFIG.cannon.position.x;
        cannonY = canvas.height - CONFIG.cannon.position.y - CONFIG.cannon.position.elevation;
    };
    window.addEventListener('resize', resizeHandler);
    eventHandlers.set('resize', resizeHandler);
    
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

    // Add instruction screen handlers
    howToPlayBtn.addEventListener('click', () => {
        instructionsScreen.classList.remove('hidden');
    });

    closeInstructionsBtn.addEventListener('click', () => {
        instructionsScreen.classList.add('hidden');
    });

    // Закрытие по клику вне контента
    instructionsScreen.addEventListener('click', (e) => {
        if (e.target === instructionsScreen) {
            instructionsScreen.classList.add('hidden');
        }
    });

    // Обновляем обработчик для кнопки патрулирования
    patrolBtn.addEventListener('click', () => {
        isPatrolEnabled = !isPatrolEnabled;
        isManualControl = !isPatrolEnabled;
        patrolBtn.classList.toggle('active');
        patrolRange.style.display = isPatrolEnabled ? 'flex' : 'none';

        // Инициализируем градиент при первом показе слайдера
        if (isPatrolEnabled) {
            patrolAngle = 0;
            patrolDirection = 1;
            const value = patrolDistance.value;
            const gradient = `linear-gradient(to right, rgba(255, 255, 255, 1) ${value}%, rgba(255, 255, 255, 0.2) ${value}%)`;
            patrolDistance.style.background = gradient;
        }
    });

    // Обновляем обработчик для слайдера
    patrolDistance.addEventListener('input', (e) => {
        const value = e.target.value;
        patrolDistanceValue.textContent = `${value}%`;
        // Обновляем градиент для Chrome    
        const gradient = `linear-gradient(to right, rgba(255, 255, 255, 1) ${value}%, rgba(255, 255, 255, 0.2) ${value}%)`;
        e.target.style.background = gradient;
    });

    // В функцию initializeGame добавляем обработчик после остальных обработчиков
    autoShootBtn.addEventListener('click', () => {
        isAutoShootEnabled = !isAutoShootEnabled;
        autoShootBtn.classList.toggle('active');
    });

    autoShootBtn.style.display = 'none'; // Кнопка скрыта при старте

    // Добавляем обработчики клавиатуры
    const keyDownHandler = (e) => {
        if (e.key === KEYS.ESCAPE) {
            isPaused = !isPaused;
            pauseText.style.display = isPaused ? 'block' : 'none';
            return;
        }

        if (isPaused) return;

        switch (e.key) {
            case KEYS.LEFT:
            case KEYS.RIGHT:
            case KEYS.SPACE:
                keyState[e.key] = true;
                isManualControl = true;
                break;
            case KEYS.UP:
                changeColor('left');
                break;
            case KEYS.DOWN:
                changeColor('right');
                break;
        }

        if (movementKeys.hasOwnProperty(e.code)) {
            movementKeys[e.code] = true;
        }
    };
    window.addEventListener('keydown', keyDownHandler);
    eventHandlers.set('keydown', keyDownHandler);

    const keyUpHandler = (e) => {
        if (keyState.hasOwnProperty(e.key)) {
            keyState[e.key] = false;
        }

        if (movementKeys.hasOwnProperty(e.code)) {
            movementKeys[e.code] = false;
        }
    };
    window.addEventListener('keyup', keyUpHandler);
    eventHandlers.set('keyup', keyUpHandler);

    // Добавляем обработчик отпускания кнопки мыши
    const mouseUpHandler = (e) => {
        if (e.button === 1) { // Средняя кнопка мыши
            isDragging = false;
        }
    };
    window.addEventListener('mouseup', mouseUpHandler);
    eventHandlers.set('mouseup', mouseUpHandler);
}

function startGame() {
    mainMenu.style.display = 'none';
    canvas.style.display = 'block';
    colorPanel.style.display = 'flex';
    pauseBtn.style.display = 'block'; // Показываем кнопку паузы
    homeBtn.style.display = 'block'; // Показываем кнопку возврата
    autoShootBtn.style.display = 'block'; // Показываем кнопку только в игре
    startTime = Date.now();
    lastFrameTime = startTime;
    gameTime = 0;
    score.killsThisWave = 0; // Добавляем счетчик убийств для текущей волны
    announceWave(currentWave);
    activeEnemyColors = []; // Очищаем массив активных цветов
    if (isTrainingMode) {
        waveSelector.style.display = 'flex';
        patrolBtn.classList.remove('hidden');
        patrolRange.classList.remove('hidden');
        patrolRange.style.display = 'none'; // Изначально скрыт
        autoShootBtn.classList.add('training-mode');
        autoShootBtn.classList.remove('battle-mode');
        createWaveButtons();
    } else {
        waveSelector.style.display = 'none';
        patrolBtn.classList.add('hidden');
        patrolRange.classList.add('hidden');
        autoShootBtn.classList.remove('training-mode');
        autoShootBtn.classList.add('battle-mode');
    }
    rings.forEach((ring, index) => {
        // Восстанавливаем все кольца, кроме последнего невидимого
        ring.active = index === rings.length - 1 ? false : true;
    }); // Восстанавливаем все кольца
    targetX = cannonX;
    targetY = cannonY;
    gameLoop();
}

function shoot() {
    if (projectiles.length >= CONFIG.limits.maxProjectiles) {
        return;
    }
    const now = Date.now();
    if(now - lastShot > CONFIG.cannon.shootDelay) {
        // Если нет врагов, стреляем белым цветом, иначе - текущим цветом
        const shootColor = enemies.length === 0 ? 
            CONFIG.colors[0] : // Белый цвет (первый в массиве)
            CONFIG.colors[currentColorIndex];

        projectiles.push(new Projectile(
            cannonX + Math.sin(angle) * CONFIG.cannon.barrelLength,
            cannonY - Math.cos(angle) * CONFIG.cannon.barrelLength,
            angle,
            shootColor
        ));
        score.shots++;
        lastShot = now;
    }
}

function checkCollisions() {
    // Создаем сетку для оптимизации
    const grid = new Map();
    const cellSize = 50;
    
    // Распределяем врагов по ячейкам
    enemies.forEach(enemy => {
        const cellX = Math.floor(enemy.x / cellSize);
        const cellY = Math.floor(enemy.y / cellSize);
        const key = `${cellX},${cellY}`;
        if (!grid.has(key)) {
            grid.set(key, []);
        }
        grid.get(key).push(enemy);
    });

    // Проверяем коллизии только с врагами в соседних ячейках
    projectiles.forEach((proj, i) => {
        const cellX = Math.floor(proj.x / cellSize);
        const cellY = Math.floor(proj.y / cellSize);
        
        for (let dx = -1; dx <= 1; dx++) {
            for (let dy = -1; dy <= 1; dy++) {
                const key = `${cellX + dx},${cellY + dy}`;
                const cellEnemies = grid.get(key);
                if (!cellEnemies) continue;
                
                cellEnemies.forEach((enemy, j) => {
                    const dx = proj.x - enemy.x;
                    const dy = proj.y - enemy.y;
                    const distance = Math.sqrt(dx*dx + dy*dy);
                    
                    if(distance < enemy.radius + proj.radius && proj.color === enemy.color) {
                        enemy.explode(proj); // Передаем снаряд в метод explode
                        enemies.splice(j, 1);
                        projectiles.splice(i, 1);
                        score.killed++;
                        score.points += 100 * currentWave; // Начисляем очки с учетом номера волны
                        score.hits++;
                        score.killsThisWave++; // Увеличиваем счетчик убийств текущей волны
                    }
                });
            }
        }
    });

    // Проверяем условие перехода на следующую волну
    if (score.killsThisWave >= waves[currentWave - 1].killsToNext) {
        if (currentWave < waves.length) {
            // Переход на следующую волну
            currentWave++;
            score.killsThisWave = 0;
            spawnRate = waves[currentWave - 1].spawnRate;
            announceWave(currentWave);
            if (isTrainingMode) {
                updateWaveButtons();
            }
        } else if (currentWave === waves.length) {
            if (isTrainingMode) {
                // В тренировочном режиме начинаем заново с первой волны
                currentWave = 1;
                score.killsThisWave = 0;
                spawnRate = waves[currentWave - 1].spawnRate;
                announceWave(currentWave);
                updateWaveButtons();
            } else {
                // В боевом режиме объявляем победу
                setTimeout(() => {
                    gameWon = true;
                    spawnRate = Infinity;
                }, 1000);
            }
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

// Добавляем после других вспомогательных функций
function drawDebugGrid() {
    if (!CONFIG.debug.enabled) return;

    const { grid, spawnArea } = CONFIG.debug;
    
    // Рисуем сетку
    ctx.beginPath();
    ctx.strokeStyle = grid.color;
    ctx.lineWidth = grid.lineWidth;

    // Вертикальные линии
    for (let x = 0; x < canvas.width; x += grid.size) {
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
    }

    // Горизонтальные линии
    for (let y = 0; y < canvas.height; y += grid.size) {
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
    }
    
    ctx.stroke();

    // Заменяем отрисовку зоны спавна:
    ctx.beginPath();
    ctx.strokeStyle = spawnArea.color;
    ctx.lineWidth = spawnArea.lineWidth;
    ctx.rect(
        spawnArea.padding,
        0,  // Начинаем от верха экрана
        canvas.width - spawnArea.padding * 2,
        spawnArea.height // Используем заданную высоту
    );
    ctx.stroke();

    // Показываем координаты спавна
    ctx.fillStyle = spawnArea.color;
    ctx.font = '14px Consolas';
    ctx.fillText(
        `Spawn Area (${spawnArea.padding}, 0) - (${canvas.width - spawnArea.padding}, ${spawnArea.height})`,
        spawnArea.padding,
        spawnArea.height + 20
    );
}

// Изменяем функцию gameLoop, добавляя вызов drawDebugGrid в начало отрисовки
function gameLoop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Рисуем сетку только если игра активна и не на паузе
    if(!gameOver && !gameWon && !isPaused) {
        drawDebugGrid();
    }
    
    if(!gameOver && !gameWon) {
        if (!isPaused) {
            handleKeyboardRotation(); // Добавляем обработку поворота с клавиатуры
            handleKeyboardShooting(); // Добавляем обработку стрельбы
            handlePatrol(); // Переименовали вызов
            handleAutoShoot(); // Добавляем вызов функции
            const currentTime = Date.now();
            const deltaTime = currentTime - lastFrameTime;
            gameTime += deltaTime;
            lastFrameTime = currentTime;
            // Новая логика спавна
            const currentWaveConfig = waves[currentWave - 1];
            const spawnDelay = enemies.length === 0 ? 
                currentWaveConfig.minSpawnRate : // Используем минимальную задержку если врагов нет
                currentWaveConfig.spawnRate;     // Иначе обычную задержку
            
            if (!gameWon && currentTime - lastSpawn > spawnDelay && 
               enemies.length < Math.min(currentWaveConfig.count, CONFIG.limits.maxEnemies)) {
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
            updateCannonPosition(); // Добавляем эту строку перед drawCannon
            drawCannon();
            updateStats();

            // Обновление и отрисовка частей пушки
            cannonPieces = cannonPieces.filter(piece => piece.update());
            cannonPieces.forEach(piece => piece.draw());
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
        // Убираем отладочную графику на финальных экранах
        particles.forEach(particle => particle.update());
        particles = particles.filter(particle => !particle.isDead);
        particles.forEach(particle => particle.draw());

        cannonPieces = cannonPieces.filter(piece => piece.update());
        cannonPieces.forEach(piece => piece.draw());

        // Очищаем все UI элементы
        colorPanel.style.display = 'none';
        pauseBtn.style.display = 'none';
        homeBtn.style.display = 'none';
        waveSelector.style.display = 'none';
        stats.style.display = 'none';
        autoShootBtn.style.display = 'none';

        // Показываем кнопку "Играть снова"
        restartBtn.style.display = 'block';
        restartBtn.style.top = '70%';

        ctx.textAlign = 'center';
        const duration = formatTime(gameTime);
        const accuracy = Math.round((score.hits / score.shots || 0) * 100);
        
        if(gameOver) {
            // Поражение
            ctx.fillStyle = '#FF0000';
            ctx.font = 'bold 120px Consolas';
            ctx.fillText('ПОРАЖЕНИЕ', canvas.width/2, canvas.height/2 - 100);
        } else if(gameWon && !isTrainingMode) {
            // Победа
            ctx.save();
            ctx.translate(canvas.width/2, canvas.height/2 - 100);
            const pulseScale = 1 + Math.sin(Date.now() * 0.002) * 0.1;
            ctx.scale(pulseScale, pulseScale);
            ctx.fillStyle = '#00FF00';
            ctx.font = 'bold 120px Consolas';
            ctx.fillText('ПОБЕДА!', 0, 0);
            ctx.restore();
        }

        // Отображаем статистику
        ctx.font = '24px Consolas';
        ctx.fillStyle = '#FFFFFF';
        ctx.fillText(`Длительность игры: ${duration}`, canvas.width/2, canvas.height/2);
        ctx.fillText(`Уничтожено врагов: ${score.killed}`, canvas.width/2, canvas.height/2 + 40);
        ctx.fillText(`Точность: ${accuracy}%`, canvas.width/2, canvas.height/2 + 80);
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
    const currentIndex = activeColors.indexOf(CONFIG.colors[currentColorIndex]);
    
    if (direction === 'left') {
        // Движение влево по массиву цветов
        const newIndex = (currentIndex - 1 + activeColors.length) % activeColors.length;
        currentColorIndex = CONFIG.colors.indexOf(activeColors[newIndex]);
    } else {
        // Движение вправо по массиву цветов
        const newIndex = (currentIndex + 1) % activeColors.length;
        currentColorIndex = CONFIG.colors.indexOf(activeColors[newIndex]);
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

// Обновляем функцию handleAutoFire
function handlePatrol() {
    if (!isPatrolEnabled || !isTrainingMode) return;

    const now = Date.now();
    if (now - lastShot < 100) return;

    // Находим ближайшего врага
    let closestEnemy = null;
    let minDistance = Infinity;

    enemies.forEach(enemy => {
        const dx = enemy.x - cannonX;
        const dy = cannonY - enemy.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < minDistance) {
            minDistance = distance;
            closestEnemy = enemy;
        }
    });

    // Рассчитываем максимальную дистанцию
    const percent = parseInt(patrolDistance.value) / 100;
    const maxRange = percent * (canvas.height - DEFENSE_RADIUS) + DEFENSE_RADIUS;

    if (closestEnemy && minDistance < maxRange) {
        const enemyColorIndex = CONFIG.colors.indexOf(closestEnemy.color);
        if (enemyColorIndex !== currentColorIndex) {
            currentColorIndex = enemyColorIndex;
            updateColorPanel();
        }

        const dx = closestEnemy.x - cannonX;
        const dy = cannonY - closestEnemy.y;
        targetAngle = -Math.atan2(dy, dx) + Math.PI/2;
        
        // Запоминаем текущий угол как базовый для патрулирования
        basePatrolAngle = angle;
    } else {
        // Плавное патрулирование с использованием косинуса
        targetAngle = basePatrolAngle + Math.cos(Date.now() * CONFIG.auto.patrol.speed) * CONFIG.auto.patrol.range;
    }

    // Плавный поворот к цели
    smoothRotateToTarget();

    // Стреляем только если пушка направлена на цель и есть враг
    if (closestEnemy && minDistance < maxRange && Math.abs(targetAngle - angle) < 0.1) {
        shoot();
    }
}

function smoothRotateToTarget() {
    let angleDiff = targetAngle - angle;
    
    // Нормализуем разницу углов
    while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
    while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
    
    // Добавляем плавное замедление при приближении к цели
    const rotationAmount = Math.sign(angleDiff) * Math.min(Math.abs(angleDiff), CONFIG.auto.patrol.rotationSpeed);
    
    angle += rotationAmount;
    
    // Нормализуем итоговый угол
    while (angle > Math.PI) angle -= Math.PI * 2;
    while (angle < -Math.PI) angle += Math.PI * 2;
}

// Добавляем новую функцию для автоматической стрельбы
function handleAutoShoot() {
    if (!isAutoShootEnabled || isPaused) return;

    // Находим врага, на которого указывает пушка
    let targetEnemy = null;
    let minAngleDiff = CONFIG.auto.targeting.angleThreshold;
    let minRealDistance = Infinity; // Добавляем проверку реального расстояния

    enemies.forEach(enemy => {
        const dx = enemy.x - cannonX;
        const dy = cannonY - enemy.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const enemyAngle = -Math.atan2(dy, dx) + Math.PI/2;
        let angleDiff = enemyAngle - angle;
        
        // Нормализуем разницу углов
        while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
        while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
        
        // Выбираем ближайшего врага в секторе обстрела
        if (Math.abs(angleDiff) < minAngleDiff && distance < minRealDistance) {
            targetEnemy = enemy;
            minAngleDiff = Math.abs(angleDiff);
            minRealDistance = distance;
        }
    });

    // Если нашли врага в направлении пушки, меняем цвет
    if (targetEnemy) {
        const enemyColorIndex = CONFIG.colors.indexOf(targetEnemy.color);
        if (enemyColorIndex !== currentColorIndex) {
            currentColorIndex = enemyColorIndex;
            updateColorPanel();
        }

        // Стреляем только когда цвет совпадает
        const now = Date.now();
        if (now - lastShot > CONFIG.auto.autoShoot.delay) {
            shoot();
        }
    }
}

function handleKeyboardRotation() {
    if (keyState[KEYS.LEFT]) {
        angle -= KEYBOARD_ROTATION_SPEED;
    }
    if (keyState[KEYS.RIGHT]) {
        angle += KEYBOARD_ROTATION_SPEED;
    }
}

// Добавляем функцию для обработки стрельбы с клавиатуры
function handleKeyboardShooting() {
    if (keyState[KEYS.SPACE]) {
        shoot();
    }
}

// В функции updateCannonPosition меняем W и S
function updateCannonPosition() {
    if (!gameOver && !isPaused) {
        // Обработка WASD с инвертированным W/S
        const speed = CONFIG.cannon.movement.keyboardSpeed; // Используем замедленную скорость для клавиатуры
        if (movementKeys.KeyS) targetY = Math.min(targetY + speed, canvas.height - CONFIG.cannon.movement.margin);
        if (movementKeys.KeyW) targetY = Math.max(targetY - speed, CONFIG.cannon.movement.margin);
        if (movementKeys.KeyA) targetX = Math.max(targetX - speed, CONFIG.cannon.movement.margin);
        if (movementKeys.KeyD) targetX = Math.min(targetX + speed, canvas.width - CONFIG.cannon.movement.margin);

        // Плавное перемещение к цели с использованием настроек из конфига
        const smoothing = isDragging ? 0.25 : CONFIG.cannon.movement.smoothing;
        cannonX += (targetX - cannonX) * smoothing;
        cannonY += (targetY - cannonY) * smoothing;
    }
}

// Добавляем вспомогательные функции для отрисовки фигур
function drawPolygon(x, y, radius, sides) {
    ctx.beginPath();
    for (let i = 0; i < sides; i++) {
        const angle = (i * 2 * Math.PI / sides) - Math.PI / 2;
        const px = x + radius * Math.cos(angle);
        const py = y + radius * Math.sin(angle);
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
    }
    ctx.closePath();
}

function drawStar(x, y, outerRadius, innerRadius, spikes) {
    ctx.beginPath();
    for (let i = 0; i < spikes * 2; i++) {
        const radius = i % 2 === 0 ? outerRadius : innerRadius;
        const angle = (i * Math.PI / spikes) - Math.PI / 2;
        const px = x + radius * Math.cos(angle);
        const py = y + radius * Math.sin(angle);
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
    }
    ctx.closePath();
}

// Добавляем функцию очистки обработчиков событий
function cleanup() {
    eventHandlers.forEach((handler, event) => {
        window.removeEventListener(event, handler);
    });
    eventHandlers.clear();
}