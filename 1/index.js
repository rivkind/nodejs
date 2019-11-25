const express = require('express');
const fs = require('fs');
const bodyParser = require('body-parser');
const path = require('path');
const os = require('os');


const webserver = express();

webserver.use(express.urlencoded({extended:true}));
webserver.use(bodyParser.text());

const logFN = path.join(__dirname, '_server.log');
const voteFN = path.join(__dirname, 'vote.txt');
const port = 8881;

const logLineSync = (logFilePath,logLine) => {
    const logDT=new Date();
    let time=logDT.toLocaleDateString()+" "+logDT.toLocaleTimeString();
    let fullLogLine=time+" "+logLine;

    const logFd = fs.openSync(logFilePath, 'a+');
    fs.writeSync(logFd, fullLogLine + os.EOL);
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
    
    res.send(resVote);
});

webserver.post('/stat', (req, res) => {
    logLineSync(logFN,`[${port}] `+'post stat');

    const vote = getVote();
    const resVote = prepareData(vote,'text');
    
    res.send(resVote);

});

webserver.post('/vote', (req, res) => {

    const answerCode = req.body;
    logLineSync(logFN,`[${port}] `+'post vote. Vote = '+answerCode);
    const vote = getVote();
    
    const idx = vote.findIndex(v => v.code === answerCode)

    vote[idx].count = vote[idx].count + 1;

    postVote(vote);
    
    res.status(200).send('');
    
});

webserver.get('/mainpage', (req, res) => { 
    const form = `<div id='root'>Loading...</div><div id='result'></div>
    <script>

    let votes = [];
     

    const vote = (data) => {

        const fetchOptions={
            method: "post",
            body: data,
        };
        fetch('/vote',{method: "post", body: data})
        .then(() => getResult());
    }

    const getResult = () => {
        document.getElementById("result").innerHTML = 'Loading...';
        fetch('/stat',{method: "post"})
        .then((response) => response.json())
        .then(data => renderResult(data));
    }

    const renderVote = (data) => {
        votes = data;
        const html = data.reduce((h,d)=>{return h+'<div><button onClick=vote("'+d.code+'")>'+d.text+'</button></div>'},'');
        document.getElementById("root").innerHTML = html;
        getResult();
    }

    const renderResult = (data) => {
        
        for(let i=0; i < data.length; i++) {
            for(let j=0; j < votes.length; j++){
                if(data[i].code == votes[j].code) {
                    data[i].code = votes[j].text;
                }
            }
        }

        const htmlData = data.reduce((h,d)=>{return h+'<tr><td>'+d.code+'</td><td>'+d.count+'</td></tr>'},'');
        
        const html = "<table border='1'><tr><th>Code</th><th>Count</th></tr>"+htmlData+"</table>";
        document.getElementById("result").innerHTML = html;
    }

    window.onload = (e) => { 
        fetch('/variants')
        .then((response) => response.json())
        .then(data => renderVote(data)); 
    }
    </script>
    </body>
    </html>`;

    res.send(form);
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