const express = require('express');
const fs = require('fs');
const path = require('path');
const os = require('os');


const webserver = express();

webserver.use(express.urlencoded({extended:true}));
webserver.use(express.json()); // мидлварь, умеющая обрабатывать тело запроса в формате JSON

const logFN = path.join(__dirname, '_server.log');
const voteFN = path.join(__dirname, 'vote.txt');
const port = 8881;

const logLineSync = (logFilePath,logLine) => {
    const logDT=new Date();
    let time=logDT.toLocaleDateString()+" "+logDT.toLocaleTimeString();
    let fullLogLine=time+" "+logLine;

    const logFd = fs.openSync(logFilePath, 'a+'); // и это же сообщение добавляем в лог-файл
    fs.writeSync(logFd, fullLogLine + os.EOL); // os.EOL - это символ конца строки, он разный для разных ОС
    fs.closeSync(logFd);
}

const getVote = () => {
    return JSON.parse(fs.readFileSync(voteFN, "utf8"));
}

const postVote = (data) => {

    const dataJSON = JSON.stringify(data);

    fs.writeFileSync(voteFN, dataJSON)

}

const prepareData = (data, prop) => {
    return data.map(d=>{
        d[prop]=undefined;
        return ({...d});
    });
}

webserver.get('/variants', (req, res) => {
    logLineSync(logFN,`[${port}] `+'get variants');

    const vote = getVote();
    const resVote = prepareData(vote,'count');
    
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.send(resVote);
});

webserver.post('/stat', (req, res) => {
    logLineSync(logFN,`[${port}] `+'post stat');

    const vote = getVote();
    const resVote = prepareData(vote,'text');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.send(resVote);

});

webserver.options('/vote', (req, res) => {
    // console.log('option',req.body); 
    logLineSync(logFN,`[${port}] `+"post vote preflight called");
    res.setHeader("Access-Control-Allow-Origin","*");
    res.setHeader("Access-Control-Allow-Headers","Content-Type");
    res.send(""); 
});


webserver.post('/vote', (req, res) => {

    console.log(req.body);
    const answerCode = req.body.vote;
    logLineSync(logFN,`[${port}] `+'post vote. Vote = '+answerCode);
    const vote = getVote();
    if(answerCode) {
        const idx = vote.findIndex(v => v.code === answerCode)

        vote[idx].count = vote[idx].count + 1;
    
        postVote(vote);
    }
    
    
    

    
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.send(vote);
    
});

webserver.get('/', (req, res) => { 
    
    let errorText = '';
    let successText = '';

    let username = req.query.name || '';
    let password = req.query.password;

    
    
    if(req.originalUrl !== '/'){
        username = username.trim();
        password = password.trim();
        if(username !== '' && password === 'admin'){
            successText = `<div style='color:green'>Username="${username}", password="${password}"</div>`;
        }else{
            errorText = `<div style='color:red'>Wrong username or password!</div>`; 
        }
    }

    const form = `<form method='get' action='/'>
                    <div><input name='name' type='text' placeholder='username' value='${username}' /></div>
                    <div><input name='password' type='password' placeholder='password' /></div>
                    ${errorText}
                    <div><input type='submit' value='Отправить' /></div>
                </form>
                ${successText}`;

    

    res.send(form);
});

webserver.listen(port);
console.log("web server running on port "+port);