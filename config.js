// Настройки игровой механики
const CONFIG = {
    // Настройки пушки
    cannon: {
        shootDelay: 100,        // Минимальная задержка между выстрелами (мс)
        projectileSpeed: 32,    // Скорость снарядов
        baseHeight: 40,         // Высота основания пушки
        barrelLength: 80,       // Длина ствола
        barrelBaseWidth: 20,    // Ширина основания ствола
        barrelTipWidth: 10,     // Ширина кончика ствола
        baseRadius: 55,         // Радиус основания пушки
        position: {
            y: 100             // Отступ пушки от нижнего края (px)
        }
    },

    // Настройки снарядов
    projectile: {
        radius: 8,             // Радиус снаряда
        trailLength: 6,        // Длина следа за снарядом
        width: 4,              // Ширина лазерного луча
        length: 4              // Длина лазерного луча
    },

    // Защитные кольца
    defense: {
        radius: 200,           // Радиус защитной зоны
        rings: [
            { offset: 40 },    // Внешнее кольцо (отступ от основного радиуса)
            { offset: 20 },    // Среднее кольцо
            { offset: 0 },     // Внутреннее кольцо
            { offset: 140, invisible: true }  // Невидимое кольцо вокруг пушки
        ]
    },

    // Настройки врагов
    enemies: {
        sizes: {
            small: {
                radius: 20,
                speedMultiplier: 1.2,  // Множитель скорости для маленьких врагов
                chance: { min: 0.0, max: 0.6 }  // Шанс появления в начале и конце игры
            },
            medium: {
                radius: 25,
                speedMultiplier: 1.0,
                chance: { min: 0.2, max: 0.8 }
            },
            large: {
                radius: 30,
                speedMultiplier: 0.8,  // Большие враги медленнее
                chance: { min: 0.6, max: 0.0 }
            }
        },
        explosion: {
            particleCount: 50,  // Количество частиц при взрыве
            speedMultiplier: 1.5 // Множитель скорости частиц
        }
    },

    // Настройки волн
    waves: [
        {
            killsToNext: 10,   // Сколько врагов нужно убить для перехода
            count: 10,         // Максимум врагов на экране
            speed: 1,          // Базовая скорость врагов
            spawnRate: 1000    // Частота появления врагов (мс)
        },
        {
            killsToNext: 9,
            count: 9,
            speed: 1.5,
            spawnRate: 2000
        },
        {
            killsToNext: 7,
            count: 7,
            speed: 2,
            spawnRate: 3000
        },
        {
            killsToNext: 6,
            count: 6,
            speed: 2.5,
            spawnRate: 5000
        },
        {
            killsToNext: 5,
            count: 5,
            speed: 3,
            spawnRate: 10000
        }
    ],

    // Настройки автоматического режима
    auto: {
        patrol: {
            speed: 0.0005,     // Скорость патрулирования
            range: Math.PI / 6, // Диапазон патрулирования (30 градусов)
            rotationSpeed: 0.05 // Скорость поворота к цели
        },
        targeting: {
            angleThreshold: Math.PI / 8  // Максимальное отклонение для автострельбы (22.5 градуса)
        }
    },

    // Настройки частиц
    particles: {
        minSize: 2,           // Минимальный размер частиц
        maxSize: 5,           // Максимальный размер
        minSpeed: 2,          // Минимальная скорость
        maxSpeed: 8,          // Максимальная скорость
        gravity: 0.1,         // Сила гравитации
        fadeSpeed: 0.02       // Скорость исчезновения
    },

    // Цвета лазеров и врагов
    colors: [
        '#FF0000', // Красный
        '#00FF00', // Зеленый
        '#0000FF', // Синий
        '#FFFF00', // Желтый
        '#FF00FF', // Пурпурный
        '#00FFFF'  // Голубой
    ]
};

// Экспортируем конфигурацию
export default CONFIG;
