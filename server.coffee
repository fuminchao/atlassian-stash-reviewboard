fs         = require('fs')
url        = require('url')
path       = require('path')
babel      = require('babel-core')
express    = require('express')
session    = require('express-session')
formatJSON = require('json-format')
cmdArgs    = require('shell-arguments')
#wwwdir     = __dirname + '/../buildtools/build'
wwwdir     = __dirname + '/www'

##
AutoPrefix = require('less-plugin-autoprefix')
AutoPrefixPlugin = new AutoPrefix { browsers: ['Android >= 4','iOS >= 8'] }
Proxy      = require('express-http-proxy')

cmdArgs.livereload = cmdArgs.livereload || 28081;
cmdArgs.port = cmdArgs.port || 28080;
cmdArgs.publicdev = cmdArgs.publicdev || 'lo0';

trap = (cfg, res, req, searchdir)->

  traps = [];
  for ext,fn of cfg
    traps.push [ext, fn]

  loopTraps = (fileNoExt, res, req)->

    if (traps.length == 0)
      res.status(404).send('Sorry, we cannot find that!').end();
      return;

    c = traps.shift()
    f = fileNoExt + '.' + c[0]

    fs.exists(f, (exists)->

      if exists
        fs.readFile(f, {encoding:'utf8'},(e, d)->c[1].call(null, d, f))
      else
        loopTraps(fileNoExt, res, req);
    );
  ;

  searchdir = searchdir || wwwdir;
  loopTraps(searchdir + url.parse(req.url).pathname.replace(/\.\w+$/,''), res, req);
;

app = express()
.use(session({
  secret: 'keyboardcatxxxxxxxxx'
  resave: false
  saveUninitialized: true
}))
.get('/js/debug.js', (req, res)->
  for ip in require('os').networkInterfaces()[cmdArgs.publicdev]
    publicIP = ip.address if ip.family == 'IPv4'

  publicIP = publicIP || 'localhost';

  res.type('text/javascript').send """
  #{req.query.fn}({
    ip:"#{publicIP}",
    host:"#{publicIP}:#{cmdArgs.port}",
    debug:true,
    livereload:"#{req.protocol}://#{publicIP}:#{cmdArgs.livereload}/livereload.js"
  });
  """
  .end();
)
.get('*.css', (req, res)->

  trap({
    css:(data)->res.type('text/css').send(data).end()
    less:(data, filename)->

      require('less')
      .render(data, {
        plugins:[AutoPrefixPlugin]
        sourceMap:/Wget/.test(req.headers['user-agent']) ? false : {sourceMapFileInline:true}
        paths:[wwwdir + '/css']
      })
      .then(
        (output)->
          res.type('text/css').send(output.css).end()
        ,
        (lessErr)->
          lessErr.filename = filename

          msg = [];
          for k,v of lessErr
            msg.push(k + ':' + v) if ! (v instanceof Function)

          res.type('text/css')
          .send( """
          body,html {
            padding:0;
            margin:0;
            overflow:hidden;
          }
          body:after {
            content:'#{msg.join(' \\a ')}';
            white-space: pre;
            background-color:red;
            color:white;
            position:absolute;
            top:0;bottom:0;left:0;right:0;
            z-index:10000000;
          }
          """).end();

      )
  }, res, req);
)
.get('*.js', (req, res)->
  trap({
    js:(data)->res.type('text/javascript').send(data).end()
    coffee:(data)->
      res
      .type('text/javascript')
      .send(require('coffee-script').compile(data))
      .end()
    es6:(data, file)->

      compileBabel = (babelSource, filename)->
        babel.transform(babelSource, {
          babelrc: true
          filename: filename
        }).code;

      try
        res.type('text/javascript').send(compileBabel(data, file))
      catch error
        res.type('text/plain').send( compileBabel('alert(`'+JSON.stringify(error,null,2).replace(/\n/g,'<br/>')+'`)' ))

      res.end()

  }, res, req)
)
.get('*.html', (req, res)->
  trap({
    html:(data)->res.type('text/html').send(data).end()
    htm:(data)->res.type('text/html').send(data).end()
    jade:(data)->

      jade = require('jade');
      renderer = jade.compile(data, {});

      res.type('text/html').send(renderer({req:req})).end();

  }, res, req);
)
.use express.static(wwwdir)

if cmdArgs.offline
  app.use('/rest/', (req, res)->
    trap({
      cson:(data)->
        obj = require('CSON').parse(data);

        latency = obj['@latency'] || 0;
        delete obj['@latency'];

        setTimeout(()->
          res.type('application/json').send(obj).end()
        ,latency);
    }, res, req, __dirname + '/offline/rest');
  );
else
  app.use('/rest/', Proxy(cmdArgs.stash,{
    forwardPath: (req, res)->
      toUrl = require('url').parse(req.url).path
      return '/rest' + toUrl

    decorateRequest: (req)->
      req.headers['accept-encoding'] = 'identity; q=1';
      req.headers['authorization'] = 'Basic ' + new Buffer(cmdArgs.username + ':' + cmdArgs.password).toString('base64');
      return req;

    intercept: (rsp, data, req, res, callback)->
      #res.setHeader('Content-Type','application/json; charset=UTF-8');
      res.setHeader('X-Request-URL',req.url);
      callback(null, data)
      ;
  }))


app.listen cmdArgs.port

require('livereload')
.createServer({
  port:cmdArgs.livereload
  exts:['html','coffee','less','babel','es6']
  applyCSSLive:false
  applyImgLive:false
})
.watch(wwwdir)
