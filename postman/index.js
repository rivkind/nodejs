const express = require('express');
const exphbs  = require('express-handlebars');
const path = require('path');
const fetch = require('node-fetch');

const webserver = express();

webserver.engine('handlebars', exphbs());
webserver.set('view engine', 'handlebars');
webserver.set('views', path.join(__dirname, 'views'));

webserver.use(express.urlencoded({extended:true}));
webserver.use(express.json());


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


const port = 8881;

webserver.get('/index.html', function (req, res) {
    res.render('main_page',{  
        layout:'main',
    });
});

webserver.post('/getData', urlValidator, bodyValidator, async (req, res) => {
    
    const { url, fetchOption } = res.locals;
    
    try {
        await fetch(url.href, fetchOption)
                    .then( response => {
                        const headers = response.headers.raw();
                        for (var prop in headers) {
                            res.setHeader(prop, headers[prop][0]);
                        }

                        const content_type = response.headers.get('Content-Type');
                        
                        res.status(response.status);
                        if(content_type.toLowerCase() === 'application/json') {
                            return response.json();
                        } else {
                            return response.text(); 
                        }
                    })
                    .then(body => res.send(body))
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

