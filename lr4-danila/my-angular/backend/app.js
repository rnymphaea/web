import { installBuildAdminServe } from "./runAdminServer.js";
import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import https from 'https';
import fetch from 'node-fetch';
import { Server } from "socket.io";
import { createServer } from "http";
import { fileURLToPath } from 'url';
import Rollbar from 'rollbar';
import multer from 'multer';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024,
  }
});

const rollbar = new Rollbar({
  accessToken: 'eab29d9d8a4646afb8829dae1c8c0a6e',
  captureUncaught: true,
  captureUnhandledRejections: true,
});

installBuildAdminServe();

const packageDataPath = path.join(process.cwd(), 'node_modules', 'ivanovdanila-lab3');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(rollbar.errorHandler());

app.use(express.json());

app.use((error, req, res, next) => {
  rollbar.error(error, req);
  res.status(500).json({ 
    error: 'Внутренняя ошибка сервера',
    message: error.message
  });
});

app.post('/api/loginUser', (req, res) => {
  try{
    const usersPath = path.join(packageDataPath, 'users.json');
    const usersData = JSON.parse(fs.readFileSync(usersPath, 'utf8'));
    const user = usersData.users.filter((u) => {
      if (u.email == req.body.email) {
        return true;
      }
    })[0];
    if (!user) {
      rollbar.warning('Пользователь не найден', { email: req.body.email });
      return res.status(404).json({ error: 'Пользователь не найден' });
    }
    res.json({
      "user": user
    });
  } catch(error){
    rollbar.error('Ошибка при входе пользователя', error, req);
    next(error);
  }
});

app.post('/api/deleteFriend', (req, res) => {
  try{
    const usersPath = path.join(packageDataPath, 'users.json');
    const usersData = JSON.parse(fs.readFileSync(usersPath, 'utf8'));
    for (let i = 0; i < usersData.users.length; i++) {
      if (usersData.users[i].id == req.body.userId) {
        usersData.users[i].listOfFriends = usersData.users[i].listOfFriends.filter(element => element != req.body.friendId);
        
        fs.writeFile(usersPath, JSON.stringify(usersData, null, 4), err => {
            if (err) {
              rollbar.error('Ошибка записи в файл', err, req);
              return next(err);
            }
        });
        break;
      }
    }
    res.json({
      "delete": "ok"
    });
  } catch(error){
    rollbar.error('Ошибка при удалении пользователя', error, req);
    next(error);
  }
});

app.post('/api/addFriend', (req, res) => {
  try{
    const usersPath = path.join(packageDataPath, 'users.json');
    const usersData = JSON.parse(fs.readFileSync(usersPath, 'utf8'));
    for (let i = 0; i < usersData.users.length; i++) {
      if (usersData.users[i].id == req.body.userId) {
        usersData.users[i].listOfFriends.push(req.body.friendId);
        
        fs.writeFile(usersPath, JSON.stringify(usersData, null, 4), err => {
            if (err) {
              rollbar.error('Ошибка записи в файл', err, req);
              return next(err);
            }
        });
        break;
      }
    }
    res.json({
      "add": "ok"
    });
  } catch(error){
    rollbar.error('Ошибка при добавлении пользователя', error, req);
    next(error);
  }
});

app.post('/api/addPhoto', upload.single('file'), (req, res) => {
  try {

    if (!req.file) {
      return res.status(400);
    }

    const userId = req.body.userId;
    if (!userId) {
      return res.status(400);
    }

    const imgDir = path.join(packageDataPath, 'img');
    if (!fs.existsSync(imgDir)) {
      fs.mkdirSync(imgDir, { recursive: true });
    }

    const fileExtension = path.extname(req.file.originalname);
    const fileName = `user_${userId}${fileExtension}`;
    const filePath = path.join(imgDir, fileName);

    fs.writeFileSync(filePath, req.file.buffer);

    const relativePath = path.join('img', fileName).replace(/\\/g, '/');
    const fullUrl = `${req.protocol}://${req.get('host')}/api/photos/${userId}`;

    const usersPath = path.join(packageDataPath, 'users.json');
    const usersData = JSON.parse(fs.readFileSync(usersPath, 'utf8'));
    
    for (let i = 0; i < usersData.users.length; i++) {
      if (usersData.users[i].id == userId) {
        usersData.users[i].hasPhoto = true;
        usersData.users[i].photoPath = relativePath;
        
        fs.writeFileSync(usersPath, JSON.stringify(usersData, null, 4));
        break;
      }
    }

    res.json({
      success: true,
      message: 'Фото успешно загружено',
      photoPath: relativePath,
      fullPhotoUrl: fullUrl,
      fileName: fileName
    });

  } catch (error) {
    rollbar.error('Ошибка при загрузке фото', error, req);
    res.status(500).json({ error: 'Ошибка при загрузке фото' });
  }
});

app.get('/api/photos/:userId', (req, res) => {
  try {
    const userId = req.params.userId;
    
    const usersPath = path.join(packageDataPath, 'users.json');
    const usersData = JSON.parse(fs.readFileSync(usersPath, 'utf8'));
    
    const user = usersData.users.find(u => u.id == userId);
    if (!user || !user.photoPath) {
      return res.status(404).json({ error: 'Фото не найдено' });
    }
    
    const photoPath = path.join(packageDataPath, user.photoPath);
    
    if (!fs.existsSync(photoPath)) {
      return res.status(404).json({ error: 'Файл фото не найден' });
    }
    
    const ext = path.extname(photoPath).toLowerCase();
    const mimeTypes = {
      '.png': 'image/png',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.gif': 'image/gif',
      '.webp': 'image/webp'
    };
    
    const mimeType = mimeTypes[ext] || 'image/jpeg';
    res.setHeader('Content-Type', mimeType);
    
    res.sendFile(photoPath);
    
  } catch (error) {
    console.error('Ошибка при получении фото:', error);
    rollbar.error('Ошибка при получении фото', error, req);
    res.status(500).json({ error: 'Ошибка при получении фото' });
  }
});

app.post('/api/registrationUser', (req, res) => {
  try{
    const usersPath = path.join(packageDataPath, 'users.json');
    const usersData = JSON.parse(fs.readFileSync(usersPath, 'utf8'));
    let max_id = 0;
    for (let i = 0; i < usersData.users.length; i++){
        if (usersData.users[i].email === req.body.data.email){
          return res.status(409).json({
            error: 'Пользователь с таким email уже существует',
            code: 'USER_ALREADY_EXISTS'
          });
        } 
        if (usersData.users[i].id > max_id){
            max_id = usersData.users[i].id;
        }
    }
    const newUser = {};
    newUser["id"] = max_id + 1;
    newUser["firstName"] = req.body.data.firstName;
    newUser["lastName"] = req.body.data.lastName;
    newUser["middleName"] = req.body.data.middleName;
    newUser["birthday"] = req.body.data.birthday;
    newUser["email"] = req.body.data.email;
    newUser["role"] = "user";
    newUser["status"] = "active";
    newUser["listOfFriends"] = [];
    usersData.users.push(newUser);
    fs.writeFile(usersPath, JSON.stringify(usersData, null, 4), err => {
        if (err) {
          rollbar.error('Ошибка записи в файл', err, req);
          return next(err);
        }
    });
    res.json({
      "user": newUser
    });
  } catch(error){
    rollbar.error('Ошибка при регистрации пользователя', error, req);
    next(error);
  }
});

app.get('/api/user/:id(\\d+)', (req, res) => {
  try{
    const usersPath = path.join(packageDataPath, 'users.json');
    const usersData = JSON.parse(fs.readFileSync(usersPath, 'utf8'));
    const user = usersData.users.filter((u) => {
      if (u.id == req.params.id) {
        return true;
      }
    })[0];
    if (!user) {
      rollbar.warning('Пользователь не найден', { id: req.params.id });
      return res.status(404).json({ error: 'Пользователь не найден' });
    }
    res.json({
      "user": user
    });
  } catch(error){
    rollbar.error('Ошибка при поиске пользователя', error, req);
    next(error);
  }
});

app.get('/api/getFiends/:id(\\d+)', (req, res) => {
  try{
    const usersPath = path.join(packageDataPath, 'users.json');
    const usersData = JSON.parse(fs.readFileSync(usersPath, 'utf8'));
    const user = usersData.users.filter((u) => {
        if (u.id == req.params.id) {
            return true;
        }
    })[0];
    if (!user) {
      rollbar.warning('Пользователь не найден', { id: req.params.id });
      return res.status(404).json({ error: 'Пользователь не найден' });
    }
    const friends = [];
    for (let i = 0; i < usersData.users.length; i++) {
        if (user.listOfFriends.indexOf(usersData.users[i].id) >= 0) {
            friends.push(usersData.users[i]);
        }
    }

    res.json({
        "friends": friends
    });
  } catch(error){
    rollbar.error('Ошибка при поиске друзей пользователя', error, req);
    next(error);
  }
});

app.get('/api/getUsers/:id(\\d+)', (req, res) => {
  try{
    const usersPath = path.join(packageDataPath, 'users.json');
    const usersData = JSON.parse(fs.readFileSync(usersPath, 'utf8'));
    const user = usersData.users.filter((u) => {
        if (u.id == req.params.id) {
            return true;
        }
    })[0];
    if (!user) {
      rollbar.warning('Пользователь не найден', { id: req.params.id });
      return res.status(404).json({ error: 'Пользователь не найден' });
    }
    const users = [];
    for (let i = 0; i < usersData.users.length; i++) {
        if (!(user.listOfFriends.indexOf(usersData.users[i].id) >= 0) && usersData.users[i].id != req.params.id) {
            users.push(usersData.users[i]);
        }
    }

    res.json({
        "users": users
    }); 
  } catch(error){
    rollbar.error('Ошибка при поиске пользователей', error, req);
    next(error);
  }
});

const server = createServer(app);

const io = new Server(server, {
  cors: {
    origin: ["http://localhost:4200", "http://localhost:3000"],
    methods: ["GET", "POST"],
    credentials: true
  }
});

io.on("connection", (socket) => {  
  socket.on('connChats', (data) => {
    const chatsPath = path.join(packageDataPath, 'chats.json');
    const chatsData = JSON.parse(fs.readFileSync(chatsPath, 'utf8'));
    const chats = [];
    for (let i = 0; i < chatsData.chats.length; i++) {
        if (chatsData.chats[i].id_user_src == data.from && chatsData.chats[i].id_user_dest == data.to ||
          chatsData.chats[i].id_user_src == data.to && chatsData.chats[i].id_user_dest == data.from
        ) {
            chats.push(chatsData.chats[i]);
        }
    }
    socket.emit("msg", {"chats": chats, "id_dest": data.to,"id_source": data.from});
  });

  socket.on('msg', (msg) => {

    var currentdate = new Date(); 
    var datetime = currentdate.getDate() + "/"
                    + (currentdate.getMonth()+1)  + "/" 
                    + currentdate.getFullYear() + " = "  
                    + currentdate.getHours() + ":"  
                    + currentdate.getMinutes() + ":" 
                    + currentdate.getSeconds();

    const chatsPath = path.join(packageDataPath, 'chats.json');
    const chatsData = JSON.parse(fs.readFileSync(chatsPath, 'utf8'));
    let max_id = 0;
    for (let i = 0; i < chatsData.chats.length; i++){
        if (chatsData.chats[i].id > max_id){
            max_id = chatsData.chats[i].id;
        }
    }
    console.log(datetime);
    const newMessage = {};
    newMessage["id"] = max_id + 1;
    newMessage["id_user_src"] = Number(msg.from);
    newMessage["id_user_dest"] = Number(msg.to);
    newMessage["text"] = msg.value;
    newMessage["date"] = datetime;
    chatsData.chats.push(newMessage);
    fs.writeFile(chatsPath, JSON.stringify(chatsData, null, 4), err => {
        if (err) {
            return next(err);
        }
    });
    const chats = [];
    for (let i = 0; i < chatsData.chats.length; i++) {
        if (chatsData.chats[i].id_user_src == msg.from && chatsData.chats[i].id_user_dest == msg.to ||
          chatsData.chats[i].id_user_src == msg.to && chatsData.chats[i].id_user_dest == msg.from
        ) {
            chats.push(chatsData.chats[i]);
        }
    }
    socket.emit("msg", {"chats": chats, "id_dest": msg.to, "id_source": msg.from});
    socket.broadcast.emit("msg", {"chats": chats, "id_dest": msg.to, "id_source": msg.from});
  });

  socket.on('connNews', (data) => {
    const usersPath = path.join(packageDataPath, 'users.json');
    const usersData = JSON.parse(fs.readFileSync(usersPath, 'utf8'));
    const messagesPath = path.join(packageDataPath, 'messages.json');
    const messagesData = JSON.parse(fs.readFileSync(messagesPath, 'utf8'));
    const user = usersData.users.filter((u) => {
        if (u.id == data.userId) {
            return true;
        }
    })[0];

    const messages = [];
    for (let i = 0; i < messagesData.messages.length; i++) {
        if (user.listOfFriends.indexOf(messagesData.messages[i].id_user) >= 0 || data.userId == messagesData.messages[i].id_user) {
            const friend = usersData.users.filter((u) => {
                if (u.id == messagesData.messages[i].id_user) {
                    return true;
                }
            })[0];
            messages.push({ "user": friend, "messageText": messagesData.messages[i].text });
        }
    }

    socket.emit("news", {"messages": messages, "id_src": data.userId});
  });

  socket.on('news', (data) => {
    const usersPath = path.join(packageDataPath, 'users.json');
    const usersData = JSON.parse(fs.readFileSync(usersPath, 'utf8'));
    const messagesPath = path.join(packageDataPath, 'messages.json');
    const messagesData = JSON.parse(fs.readFileSync(messagesPath, 'utf8'));
    let max_id = 0;
    for (let i = 0; i < messagesData.messages.length; i++){
        if (messagesData.messages[i].id > max_id){
            max_id = messagesData.messages[i].id;
        }
    }
    const newMessage = {};
    newMessage["id"] = max_id + 1;
    newMessage["id_user"] = Number(data.userId);
    newMessage["text"] = data.value;
    messagesData.messages.push(newMessage);
    fs.writeFile(messagesPath, JSON.stringify(messagesData, null, 4), err => {
        if (err) {
            return next(err);
        }
    });

    const user = usersData.users.filter((u) => {
        if (u.id == data.userId) {
            return true;
        }
    })[0];

    const messages = [];
    for (let i = 0; i < messagesData.messages.length; i++) {
        if (user.listOfFriends.indexOf(messagesData.messages[i].id_user) >= 0 || data.userId == messagesData.messages[i].id_user) {
            const friend = usersData.users.filter((u) => {
                if (u.id == messagesData.messages[i].id_user) {
                    return true;
                }
            })[0];
            messages.push({ "user": friend, "messageText": messagesData.messages[i].text });
        }
    }

    socket.emit("news", {"messages": messages, "id_src": data.userId});
    socket.broadcast.emit("news", {"messages": messages, "id_src": data.userId}, );
    
  });

  socket.on('disconnect', () => {
  });
});

server.listen(PORT, () => {
  console.log(`Сервер запущен на http://localhost:${PORT}`);
});