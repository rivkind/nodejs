const express = require('express');
const exphbs  = require('express-handlebars');
const path = require('path');
const bodyParser = require('body-parser');
const fetch = require('node-fetch');
const fs = require('fs').promises;

const webserver = express();


webserver.engine('handlebars', exphbs());
webserver.set('view engine', 'handlebars');
webserver.set('views', path.join(__dirname, 'views'));

webserver.use(express.urlencoded({extended:true}));
webserver.use(express.json());
webserver.use(bodyParser.text());


const urlValidator = (req, res, next) => {
    const { url, params } = req.body;

    const fullUrl = ((!url.match(/^[a-zA-Z]+:\/\//)))? 'http://' + url : url;

    const myURL = new URL(fullUrl);

    const newSearchParams = new URLSearchParams();

    for (var key in params) {
        newSearchParams.append(key, params[key]);
    }

    myURL.search = newSearchParams;

    res.locals.url = myURL;

    next();
}

const bodyValidator = (req, res, next) => {
    const { body, headers, method } = req.body;

    let fullBody = body;
        
    for (var key in headers) {
        if(key.toLowerCase() === 'content-type' && headers[key].toLowerCase() === 'application/json'){
            fullBody = JSON.stringify(body);
        }
    }

    res.locals.fetchOption = (method === "POST")
    ? 
    { method, headers, body: fullBody }
    :
    { headers }

    next();
}
const templateFN = path.join(__dirname, 'template.txt');

const port = 8881;

webserver.get('/index.html', function (req, res) {
    res.render('main_page',{  
        layout:'main',
    });
});

const getTemplate = async () => {
    const data = await fs.readFile(templateFN, "utf8");
    
    return JSON.parse(data);
}

webserver.post('/saveTemplate', async (req, res) => {
    const templates = await getTemplate();
    
    templates.push(req.body);
    const dataJSON = JSON.stringify(templates);

    await fs.writeFile(templateFN, dataJSON)

    res.status(200).send('');
});

webserver.post('/getTemplates', async (req, res) => {
    const templates = await getTemplate();
    

    res.status(200).send(templates);
});

webserver.post('/removeTemplates', async (req, res) => {
    const templates = await getTemplate();

    const t = templates.filter((template,i)=>(i!==+req.body));

    const dataJSON = JSON.stringify(t);

    await fs.writeFile(templateFN, dataJSON)
    
    res.status(200).send(t);
});

webserver.post('/getData', urlValidator, bodyValidator, async (req, res) => {
    
    const { url, fetchOption } = res.locals;
    
    let answer={};
    
    try {
        
        await fetch(url.href, fetchOption)
                    .then( response => {
                        
                        answer.headers = response.headers.raw();
                        
                        const content_type = response.headers.get('Content-Type').toLowerCase();
                        
                        answer.statusText = response.statusText;
                        answer.status = response.status;

                        const r = (content_type.includes('application/json'))? response.json() : response.text();

                        return r;

                    })
                    .then(body => {
                        answer.body = body; 
                        res.status(200).send(answer); 
                    })
                    .catch((err) => {
                        throw Error(err); 
                    });
    }catch (e) {
        res.status(404).send(e);
    }
});



webserver.use(
    express.static(path.resolve(__dirname,"static"))
);

webserver.listen(port,()=>{
    console.log("web server running on port "+port);
});

