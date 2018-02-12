const Router = require('restify-router').Router;
const corsify = require('restify-cors-middleware')
const restify = require('restify');
const logger = require('bunyan')


//Support logging
var log = logger.createLogger({
    name: 'myapp',
    streams: [
        {
            level: 'info',
            path: 'log.log'
        }
    ]
});

const server = restify.createServer();
server.use(restify.plugins.requestLogger())

server.on('after', restify.plugins.auditLogger({
    log: log,
    event: 'after'
}))


//Support cors
const cors = corsify({ preflightMaxAge: 5, origins: ['http://localhost:8080', 'http://localhost.com:8080']})
server.pre(cors.preflight)
server.use(cors.actual)


server.use(restify.plugins.acceptParser(server.acceptable));
server.use(restify.plugins.queryParser());
server.use(restify.plugins.bodyParser());



server.use(restify.plugins.acceptParser(server.acceptable));  // Parses out the Accept header, and ensures that the server can respond to what the client asked for. You almost always want to just pass in server.acceptable here, as that's an array of content types the server knows how to respond to (with the formatters you've registered). If the request is for a non-handled type, this plugin will return an error of 406.
server.use(restify.plugins.authorizationParser());
server.use(restify.plugins.dateParser());           // Parses out the HTTP Date header (if present) and checks for clock skew (default allowed clock skew is 300s, like Kerberos). You can pass in a number, which is interpreted in seconds, to allow for clock skew.
server.use(restify.plugins.queryParser());          // Parses the HTTP query string (i.e., /foo?id=bar&name=mark). If you use this, the parsed content will always be available in req.query, additionally params are merged into req.params. You can disable by passing in mapParams: false in the options object.
server.use(restify.plugins.jsonp());                // Supports checking the query string for callback or jsonp and ensuring that the content-type is appropriately set if JSONP params are in place. There is also a default application/javascript formatter to handle this. You should set the queryParser plugin to run before this, but if you don't this plugin will still parse the query string properly.
server.use(restify.plugins.gzipResponse());         // If the client sends an accept-encoding: gzip header (or one with an appropriate q-val), then the server will automatically gzip all response data. Note that only gzip is supported, as this is most widely supported by clients in the wild.
server.use(restify.plugins.bodyParser());           // Blocks your chain on reading and parsing the HTTP request body. Switches on Content-Type and does the appropriate logic. application/json, application/x-www-form-urlencoded and multipart/form-data are currently supported.
//server.use(restify.plugins.requestLogger());        // Sets up a child bunyan logger with the current request id filled in, along with any other parameters you define.
//server.use(restify.throttle());             // Restify ships with a fairly comprehensive implementation of Token bucket, with the ability to throttle on IP (or x-forwarded-for) and username (from req.username). You define "global" request rate and burst rate, and you can define overrides for specific keys. Note that you can always place this on per-URL routes to enable different request rates to different resources (if for example, one route, like /my/slow/database is much easier to overwhlem than /my/fast/memcache).
//server.use(restify.conditionalRequest());   // You can use this handler to let clients do nice HTTP semantics with the "match" headers. Specifically, with this plugin in place, you would set res.etag=$yourhashhere, and then this plugin will do one of: return 304 (Not Modified) [and stop the handler chain], return 412 (Precondition Failed) [and stop the handler chain], Allow the request to go through the handler chain.
//server.use(restify.fullResponse());         // sets up all of the default headers for the system
server.use(restify.plugins.bodyParser());           // remaps the body content of a request to the req.params variable, allowing both GET and POST/PUT routes to use the same interface


function settings(req, res, next) {
    res.send('settings!');
    next();
}

function controls(req, res, next) {
    res.send('controls');
    next();
}

function handleError(res, err) {
    res.send('shit');
    next();
}

const adminInstance = new Router();
adminInstance.get('/settings', settings);
adminInstance.get('/controls', controls);
adminInstance.get('/test', function (req, res, next) {
    res.send(200, {
        'value': 'Hello World'
    });
    next();
});

adminInstance.post('/test', function (req, res, next) {
    res.send(200, {
        'value': 'Hello World ' + req.body.label
    });
    next();
});

adminInstance.get('/test/:id', function (req, res, next) {
    res.send(200, {
        'value': 'Hello World ' + req.params.id
    });
});


adminInstance.applyRoutes(server, '/admin');


const staticInstance = new Router();
staticInstance.get(/(?!admin)(.*)?.*/, restify.plugins.serveStatic({
    directory: './public',
    default: 'index.html'
}));

staticInstance.applyRoutes(server, '/');

server.listen(8080, function () {
    console.log('%s listening at %s', server.name, server.url);
});