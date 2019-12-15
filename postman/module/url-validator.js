var assert = require('assert');

const urlValidator = (req, res, next) => {
    const { url, params } = req.body;

    try{
        assert.ok(url, 'Url не должен быть пустым!');

        const fullUrl = ((!url.match(/^[a-zA-Z]+:\/\//)))? 'http://' + url : url;
    
        const myURL = new URL(fullUrl);
    
        const newSearchParams = new URLSearchParams();
    
        for (var key in params) {
            newSearchParams.append(key, params[key]);
        }
    
        myURL.search = newSearchParams;
    
        res.locals.url = myURL;
    }catch (e) {
        res.locals.error = true;
        res.locals.errorMessage = e.message;
        return res.status(400).send(res.locals);
    }

    next();
}

export {
    urlValidator
}