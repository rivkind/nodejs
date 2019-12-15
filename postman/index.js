const express = require('express');
const exphbs  = require('express-handlebars');
const path = require('path');
const bodyParser = require('body-parser');
const fetch = require('node-fetch');

import { urlValidator } from "./module/url-validator";
import { bodyValidator } from "./module/body-validator";
import { getTemplate, saveTemplate, removeTemplate } from "./module/template";

const webserver = express();

webserver.engine('handlebars', exphbs());
webserver.set('view engine', 'handlebars');
webserver.set('views', path.join(__dirname, 'views'));

webserver.use(express.urlencoded({extended:true}));
webserver.use(express.json());
webserver.use(bodyParser.text());

const port = 8881;

webserver.get('/index.html', function (req, res) {
    res.render('main_page',{  
        layout:'main',
    });
});


webserver.post('/saveTemplate', async (req, res) => {
    const templates = await getTemplate();

    await saveTemplate(templates, req.body);
    
    res.status(200).send('');
});

webserver.post('/getTemplates', async (req, res) => {
    const templates = await getTemplate();
    
    res.status(200).send(templates);
});

webserver.post('/removeTemplates', async (req, res) => {
    const templates = await getTemplate();

    const newTemplates = await removeTemplate(templates, req.body);

    res.status(200).send(newTemplates);
});

webserver.post('/getData', urlValidator, bodyValidator, async (req, res) => {
    
    const { url, fetchOption } = res.locals;
    
    let answer={};
    
    try {
        await fetch(url.href, fetchOption)
                    .then( response => {
                        
                        answer.headers = response.headers.raw();
                        answer.statusText = response.statusText;
                        answer.status = response.status;
                        
                        const content_type = response.headers.get('Content-Type').toLowerCase();
                        
                        return (content_type.includes('application/json'))? response.json() : response.text();

                    }).then(body => {
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

