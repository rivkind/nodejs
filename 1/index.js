const express = require('express');

const webserver = express(); // создаём веб-сервер

const port = 8880;

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