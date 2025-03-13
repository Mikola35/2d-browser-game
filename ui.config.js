// Конфигурация интерфейса и игрового поля
const UI_CONFIG = {
    // Настройки игрового поля
    gameField: {
        background: '#000000',
        fontFamily: 'Consolas, Monaco, monospace'
    },

    // Настройки главного меню
    mainMenu: {
        title: {
            fontSize: 96,
            color: '#FFFFFF',
            shadowColor: 'rgba(255, 255, 255, 0.7)',
            shadowBlur: 20,
            animation: {
                duration: 8, // секунды
                colors: {
                    red: '#FF0000',
                    green: '#00FF00',
                    blue: '#0000FF',
                    yellow: '#FFFF00',
                    purple: '#FF00FF'
                }
            }
        },
        buttons: {
            width: '30%',
            minWidth: 150,
            maxWidth: 300,
            fontSize: 20,
            background: 'rgba(255, 255, 255, 0.2)',
            hoverBackground: 'rgba(255, 255, 255, 0.3)',
            borderRadius: 25
        }
    },

    // Настройки интерфейса во время игры
    hud: {
        stats: {
            position: {
                top: 20,
                left: 20
            },
            fontSize: 18,
            color: '#FFFFFF',
            shadow: '0 0 10px rgba(255, 255, 255, 0.5)'
        },
        waveAnnouncement: {
            fontSize: 72,
            color: '#FFFFFF',
            shadow: '0 0 20px rgba(255, 255, 255, 0.7)',
            animation: {
                duration: 2, // секунды
                distance: '200%' // дистанция перемещения
            }
        },
        colorPanel: {
            position: {
                bottom: 20
            },
            background: 'rgba(0, 0, 0, 0.7)',
            gap: 15,
            colorSize: 35
        }
    },

    // Настройки контрольных элементов
    controls: {
        buttons: {
            height: 43,
            fontSize: 16,
            background: 'rgba(255, 255, 255, 0.2)',
            hoverBackground: 'rgba(255, 255, 255, 0.3)',
            activeBackground: 'rgba(255, 255, 255, 0.4)',
            spacing: 10 // расстояние между кнопками
        },
        sliders: {
            height: 8,
            thumbSize: 16,
            background: 'rgba(255, 255, 255, 0.2)',
            progressColor: '#FFFFFF',
            panelBackground: 'rgba(0, 0, 0, 0.7)'
        }
    },

    // Настройки экранов состояния игры
    gameStates: {
        victory: {
            fontSize: 120,
            color: '#00FF00',
            shadow: '0 0 30px rgba(0, 255, 0, 0.7)',
            stats: {
                fontSize: 24,
                color: '#FFFFFF',
                spacing: 40
            }
        },
        defeat: {
            fontSize: 120,
            color: '#FF0000',
            shadow: '0 0 30px rgba(255, 0, 0, 0.7)'
        },
        pause: {
            fontSize: 72,
            color: '#FFFFFF',
            shadow: '0 0 20px rgba(255, 255, 255, 0.7)',
            blinkDuration: 1 // секунды
        }
    },

    // Настройки инструкций
    instructions: {
        background: 'rgba(0, 0, 0, 0.95)',
        content: {
            background: 'rgba(20, 20, 20, 0.95)',
            maxWidth: 800,
            padding: 40,
            borderRadius: 10,
            title: {
                fontSize: 32,
                color: '#FFFFFF',
                shadow: '0 0 10px rgba(255, 255, 255, 0.5)'
            },
            text: {
                fontSize: 18,
                lineHeight: 1.5
            }
        }
    },

    // Авторская информация
    credits: {
        fontSize: 14,
        color: 'rgba(255, 255, 255, 0.4)',
        spacing: 20 // отступ между строками
    }
};

export default UI_CONFIG;
