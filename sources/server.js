process.env.PORT = 5234;
// подключаем сервер
const http = require('http');
// подключаем разруливатель путей
const path = require('path');
// создаем приложение
const app = require('express')();
// создаем http сервер
const server = http.createServer(app);
// создаем сервер для сокетов
const io = require('socket.io')(server);
// подключаем базу
const low = require('lowdb');
// выбираем адаптер файловой системы
const FileSync = require('lowdb/adapters/FileSync');

// создаем файл при помощи адаптера
const adapter = new FileSync('db.json');
// создаем базу данных
const dataBase = low(adapter);

// создаем таблицу data
dataBase.defaults({ data: [] }).write();

// при http запросе на корень
app.get('/', (req, res) => {
    // отдаем файл с разруленными путями
    res.sendFile(path.join(__dirname, 'index.html'));
});

// при подключении клиента
io.on('connection', (socket) => {
    // получаем таблизу с данными
    const data = dataBase.get('data');

    // при получении события от сокета клиента
    socket.on('change', (event) => {
        // ищем элемент
        const value = data.find({ id: event.id }).value();

        // если значение есть
        if (value) {
            // обновляем
            data.find({ id: event.id }).assign(event).write();
        } else {
            // создаем
            data.push(event).write();
        }

        // отправляем клиенту
        io.emit('change', data.value());
    });

    // сразу после подключения тоже отправляем
    io.emit('change', data.value());
});

// стартуем сервер
server.listen(process.env.PORT);

// при старте сервера выводим сообщение
server.on('listening', () => {
    console.log(`Listening on ${process.env.PORT}`);
});
