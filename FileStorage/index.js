const express = require('express');
const bodyParser = require('body-parser');
const exphbs  = require('express-handlebars');
const path = require('path');
const busboy = require('connect-busboy');
const fs = require('fs');
const { getFiles, saveFiles, removeFile } = require("./middleware/files-db");

const webserver = express();

const server = require('http').createServer(webserver);
const io = require('socket.io')(server);
webserver.io = io;

webserver.engine('handlebars', exphbs());
webserver.set('view engine', 'handlebars');
webserver.set('views', path.join(__dirname, 'views'));

webserver.use(express.urlencoded({extended:true}));
webserver.use(express.json());
webserver.use(busboy());
webserver.use(bodyParser.text());
const uploadPath = path.join(__dirname, 'uploads'); 


const port = 8881;

webserver.get('/index.html', function (req, res) {
    res.render('upload_page',{  
        layout:'main',
    });
});

webserver.post('/upload', (req, res) => {
    const name = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    req.pipe(req.busboy); // Pipe it trough busboy
    const all = +req.headers["content-length"];
    const data = {};
    req.busboy.on('field', function(fieldname, val) {
        data[fieldname] = val;
    });
    req.busboy.on('file', (fieldname, file, filename, mimetype) => {

        data.originalname = filename;
        data.filename = name;
        console.log(`Upload of '${filename}' started`);

        const fstream = fs.createWriteStream(path.join(uploadPath, name));
        file.pipe(fstream);
        let total = 0;

        file.on('data', function(data) {
            total += data.length;
            req.app.io.to(req.query.id).emit('progress', (100*total/all));
        });

        file.on('end', () => {
            console.log(`Upload of '${filename}' finished`);
        });
    });
    
    req.busboy.on('finish', async () => {
        console.log('Done parsing form!');
        const files = await getFiles();
        await saveFiles(files, data);
        req.app.io.to(req.query.id).emit('finished', true);
        req.app.io.emit('new file', true);
        res.status(200).send('');
        
    });
});

webserver.post('/getFiles', async (req, res) => {
    const files = await getFiles();
    
    res.status(200).send(files);
});

webserver.get('/download/:name', async (req, res) => {
    const files = await getFiles();
    const f = files.find(file=>file.originalname === req.params.name);
    if(f) {
        res.setHeader("Content-Disposition","attachment");
        res.download(path.resolve(__dirname,"uploads",f.filename), f.originalname);
    }else {
        res.status(404).send('');
    }
    
});

webserver.delete('/removeFile/:name', async (req, res) => {
    const files = await getFiles();

    const { name } = req.params;
    
    const newFiles = await removeFile(files, name);
    req.app.io.emit('new file', true);
    res.status(200).send(newFiles);
});

webserver.use(
    express.static(path.resolve(__dirname,"static"))
);


io.sockets.on('connection', (socket) => {

    socket.emit('news', { hello: 'world' });
  
    console.log(`connect user ${socket.conn.id}`);

    socket.join(socket.conn.id);
    socket.emit('welcome', socket.conn.id);
    
    socket.on('to ping', function (data) {
        io.to(data.my).emit('to pong');
    });
    socket.on('disconnect', () => {
      console.log(`disconnect user ${socket.conn.id}`);
    });
});

server.listen(port, () => {
    console.log("web server running on port "+port);
});