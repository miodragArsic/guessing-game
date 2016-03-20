var express = require('express');
var app = express();

app.use('/assets', express.static(__dirname + '/public/assets'));

app.all('/*', function(req, res, next) {
    res.sendFile('index.html', {
        root: __dirname + '/public'
    });
});

var server = app.listen(9005, function() {
    console.log('Guessing Game listening on port %d', server.address().port);
});