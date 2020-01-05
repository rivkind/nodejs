const express = require('express');
const exphbs  = require('express-handlebars');
const bodyParser = require('body-parser');
const path = require('path');
const mysql=require("mysql");

const webserver = express();

webserver.engine('handlebars', exphbs());
webserver.set('view engine', 'handlebars');
webserver.set('views', path.join(__dirname, 'views'));
webserver.use(bodyParser.json());

const port = 8881;

const reportServerError = (error,res) => {
    res.status(500).end();
}


const connectionConfig={
    host     : 'localhost',
    user     : 'root',
    password : '1234',
};

webserver.get('/', function (req, res) {
    res.render('index',{  
        layout:'main',
    });
});

webserver.post('/query', async (req, res) => {
    connectionConfig.database = req.body.db;
    let connection=null;
    try {
        connection = mysql.createConnection(connectionConfig);
        connection.connect();
        connection.query(req.body.query, (error, results, fields) => {
            if (error) {
                reportServerError(error,res);
            } else {
                res.send(results);
            }
            connection.end();
        });
    }
    catch ( error ) {
        reportServerError(error,res);
        if ( connection )
            connection.end();
     }

});



webserver.use(
    express.static(path.resolve(__dirname,"static"))
);

webserver.listen(port, () => {
    console.log("web server running on port "+port);
});