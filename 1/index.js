const express = require('express');
const fs = require('fs');
const bodyParser = require('body-parser');
const path = require('path');
const sha256 = require('js-sha256');
const querystring = require('querystring');


const webserver = express();

webserver.use(express.urlencoded({extended:true}));
webserver.use(bodyParser.text());

const voteFN = path.join(__dirname, 'vote.txt');
const resultFN = path.join(__dirname, 'result.txt');
const port = 8881;


const getResult = () => {
    return JSON.parse(fs.readFileSync(resultFN, "utf8"));
}

const getHtml = (data) => {
    const htmlData = `<table border='1'>
                        <tr><th>Code</th><th>Count</th></tr>
                        ${data.map( d => `<tr><td>${d.code}</td><td>${d.count}</td></tr>` ).join("")}
                    </table>`;
    return htmlData;
}

const getXML = (data) => {
    const XMLData = `<?xml version="1.0" encoding="utf-8"?>
                        <result>
                            ${data.map( d => `<vote>
                                                <code>${d.code}</code>
                                                <count>${d.count}</count>
                                            </vote>` ).join("")}
                        </result>`;
    
                
    return XMLData;
}

const mimeJSON = "application/json";
const mimeXML = "application/xml";
const mimeHTML = "text/html";



webserver.post('/export', (req, res) => {
    const exprt = req.body.export;
    const result = getResult();

    if(exprt === mimeJSON) {
        res.setHeader("Content-Disposition", 'attachment; filename="result.json"');
        res.setHeader("Content-Type", mimeJSON);
        data = result;
    } else if(exprt === mimeXML) {
        res.setHeader("Content-Disposition", 'attachment; filename="result.xml"');
        res.setHeader("Content-Type", mimeXML);
        data = getXML(result);
    } else {
        res.setHeader("Content-Disposition", 'attachment; filename="result.html"');
        res.setHeader("Content-Type", mimeHTML);
        data = getHtml(result);
    }
    
    res.send(data);
});

webserver.get('/variants', (req, res) => {
    const vote = JSON.parse(fs.readFileSync(voteFN, "utf8"));
    
    res.send(vote);
});

webserver.get('/stat', (req, res) => {
    const result = getResult();
    
    let data;

    const clientAccept=req.headers.accept;
    if ( clientAccept === mimeJSON ) {
        res.setHeader("Content-Type", mimeJSON);
        data = result;
    } else if ( clientAccept === mimeXML ) {

        data = getXML(result);
        res.setHeader("Content-Type", mimeXML);
    } else {
        data = getHtml(result);
        res.setHeader("Content-Type", mimeHTML);
    }
    const ETag = sha256(data);
    const ifNoneMatch=req.header("If-None-Match");

    if ( ifNoneMatch && (ifNoneMatch === ETag) ) {
        res.status(304).end();
    }else{
        res.setHeader("ETag",ETag);
        res.setHeader("Cache-Control","public, max-age=0");
        res.send(data);
    }
});

webserver.post('/vote', (req, res) => {

    const answerCode = req.body;
    const result = getResult();
    
    const idx = result.findIndex(v => v.code === answerCode)

    result[idx].count = result[idx].count + 1;

    const dataJSON = JSON.stringify(result);

    fs.writeFileSync(resultFN, dataJSON)

    res.status(200).send('');
    
});

webserver.use(
    "/mainpage",
    express.static(path.resolve(__dirname,"..","template","vote.html"))
);

webserver.get("/mainpage/*", (req, res) => { 
    const originalUrlDecoded=querystring.unescape(req.originalUrl);
    
    const filePath=path.resolve(__dirname,"..","vote",originalUrlDecoded.substring(10));

    try {
        const stats=fs.statSync(filePath);
        if ( stats.isFile() ) {
            
            if ( /\.html$/.test(filePath) )
                res.setHeader("Content-Type", "text/html");
            if ( /\.js$/.test(filePath) )
                res.setHeader("Content-Type", "application/javascript");

            const fileStream=fs.createReadStream(filePath);
            fileStream.pipe(res);
        }   
        else {
            console.log("запрошена папка",filePath);
            res.status(403).end();
        }
    }
    catch ( err ) {
        res.status(404).end();
    }

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

webserver.listen(port,()=>{
    console.log("web server running on port "+port);
});
