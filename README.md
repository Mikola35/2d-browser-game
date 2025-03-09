# Спектральный защитник

Браузерная игра, где игрок управляет цветной пушкой и защищается от приближающихся врагов разных цветов.

## Геймплей

- Уничтожайте врагов, стреляя в них лазером соответствующего цвета
- Защищайте три кольца от приближающихся врагов
- Пройдите 5 волн с увеличивающейся сложностью
- Используйте колесико мыши для стрельбы
- Переключайте цвета левой и правой кнопками мыши

## Установка и запуск

1. Клонируйте репозиторий:
```bash
git clone <url-репозитория>
```

2. Установите зависимости:
```bash
npm install
```

3. Запустите игру:
   - Для разработки (с live reload):
   ```bash
   npm run dev
   ```
   - Для production:
   ```bash
   npm run prod
   ```

## Установка на сервер

### Требования к серверу
- Ubuntu 20.04 или новее
- Node.js 14+ и npm
- Nginx
- PM2 для управления процессом

### Пошаговая инструкция

1. Установите необходимые зависимости:
```bash
# Обновление системы
sudo apt update && sudo apt upgrade

# Установка Node.js и npm
curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -
sudo apt install -y nodejs

# Установка Nginx
sudo apt install nginx

# Установка PM2 глобально
sudo npm install -g pm2
```

2. Настройте Nginx:
```bash
# Создайте конфигурацию сайта
sudo nano /etc/nginx/sites-available/spectrum-defender

# Вставьте следующую конфигурацию:
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}

# Создайте символическую ссылку
sudo ln -s /etc/nginx/sites-available/spectrum-defender /etc/nginx/sites-enabled/

# Проверьте конфигурацию и перезапустите Nginx
sudo nginx -t
sudo systemctl restart nginx
```

3. Настройте SSL (по желанию):
```bash
# Установите Certbot
sudo apt install certbot python3-certbot-nginx

# Получите SSL сертификат
sudo certbot --nginx -d your-domain.com
```

4. Разверните игру:
```bash
# Создайте директорию для игры
sudo mkdir -p /var/www/spectrum-defender
cd /var/www/spectrum-defender

# Склонируйте репозиторий
git clone <url-репозитория> .

# Установите зависимости
npm install --production

# Запустите через PM2
pm2 start ecosystem.config.js

# Сохраните процесс для автозапуска
pm2 save
pm2 startup
```

### Обновление игры

1. Войдите в директорию проекта:
```bash
cd /var/www/spectrum-defender
```

2. Обновите код:
```bash
git pull
npm install --production
```

3. Перезапустите приложение:
```bash
pm2 reload spectrum-defender
```

### Мониторинг

- Просмотр логов: `pm2 logs spectrum-defender`
- Статус приложения: `pm2 status`
- Мониторинг в реальном времени: `pm2 monit`
- Nginx логи: 
  ```bash
  sudo tail -f /var/log/nginx/access.log
  sudo tail -f /var/log/nginx/error.log
  ```

### Устранение неполадок

1. Проверьте статус сервисов:
```bash
sudo systemctl status nginx
pm2 status
```

2. Проверьте порты:
```bash
sudo netstat -tulpn | grep -E ':80|:443|:3000'
```

3. Проверьте логи:
```bash
pm2 logs spectrum-defender --lines 100
sudo journalctl -u nginx -n 100
```

## Публикация на GitHub Pages

1. Создайте репозиторий на GitHub

2. Настройте GitHub Pages:
   - Перейдите в Settings > Pages
   - В разделе "Source" выберите "Deploy from a branch"
   - Выберите ветку "gh-pages" и папку "/(root)"
   - Нажмите "Save"

3. Опубликуйте игру:
```bash
# Привяжите репозиторий
git remote add origin <url-репозитория>

# Отправьте код в GitHub
git push -u origin main

# Опубликуйте на GitHub Pages
npm run deploy
```

Игра будет доступна по адресу: `https://<ваш-username>.github.io/<название-репозитория>/`

## Технологии

- HTML5 Canvas для отрисовки
- Vanilla JavaScript для логики
- CSS для стилей и анимаций

## Режимы игры

- **Обычный режим**: Пройдите все волны, защищая кольца
- **Тренировочный режим**: Практикуйтесь без риска проиграть

## Лицензия

MIT License - подробности в файле [LICENSE](LICENSE)