var express = require('express'),
  bodyParser = require('body-parser'),
  orm = require('orm'),
  swig = require('swig');
var app = express();

var database = require('./models/database')

var routes = require('./routes/routes');

app.engine('html', swig.renderFile);

app.set('view engine', 'html');
app.set('views', __dirname +  '/views');

// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }))

// parse application/json
app.use(bodyParser.json())


// Swig will cache templates for you, but you can disable
// that and use Express's caching instead, if you like:
app.set('view cache', false);
// To disable Swig's cache, do the following:
swig.setDefaults({ cache: false });
// NOTE: You should always cache templates in a production environment.
// Don't leave both of these to `false` in production!

//app.locals.variable = "something";

app.use(orm.express(database.connectionString, {
	define: function (db, models, next) {
		database.define(db, models);
		//console.log(db.models);
		//console.log(db.models.question);
		//models = db.models;

		// once we have defined all models we call "sync"
		db.sync(function (err) {
			if (err) {
		    	console.log('sync NOT ok, err:', err);
			} else {
				console.log('sync ok');
			}
		    next();
		});
	}	
}));

app.use('/', routes);
app.use('/test', routes);
app.use('/public', express.static(__dirname + '/public'));
app.use('*', routes);


/*
/// catch 404 and forwarding to error handler
app.use(function(req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

/// error handlers

// development error handler
// will print stacktrace

if (app.get('env') === 'development') {
    app.use(function(err, req, res, next) {
        res.status(err.status || 500);
        res.render('error', {
            message: err.message,
            error: err
        });
    });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
        message: err.message,
        error: {}
    });
});
*/
var server = app.listen(3000, function () {
	console.log("server running...");
});