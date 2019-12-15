var assert = require('assert');

const bodyValidator = (req, res, next) => {
    const { body, headers, method } = req.body;

    try{
        assert((method === 'GET' || method === 'POST'), 'Запрос можно отправлять только GET или POST методом!');

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
    }catch (e) {
        res.locals.error = true;
        res.locals.errorMessage = e.message;
        return res.status(400).send(res.locals);
    }
    next();
}

export {
    bodyValidator
}