var ecstatic = require('ecstatic')
var Router = require('routes-router')
var http = require('http')
var Emitter = require('events').EventEmitter
var defaultIndex = require('simple-html-index')

module.exports = function createServer (opts) {
  var handler = createHandler(opts)
  var server = http.createServer(handler.router)

  server.update = function (contents) {
    handler.pending = false
    handler.contents = contents
    handler.emit('update')
  }

  server.pending = function () {
    handler.pending = true
  }

  return server
}

function createHandler (opts) {
  var basedir = opts.dir || process.cwd()
  var staticHandler = ecstatic(basedir)
  var router = Router()

  var emitter = new Emitter()
  emitter.router = router
  emitter.pending = false
  emitter.contents = ''

  router.addRoute('/' + opts.entry, function (req, res) {
    if (emitter.pending) {
      emitter.once('update', function () {
        submit(req, res)
      })
    } else {
      submit(req, res)
    }
  })

  router.addRoute('/index.html', generateIndex)
  router.addRoute('/', generateIndex)
  router.addRoute('*', staticHandler)

  return emitter

  function submit (req, res) {
    res.setHeader('content-type', 'application/javascript; charset=utf-8')
    res.setHeader('content-length', emitter.contents.length)
    res.statusCode = req.statusCode || 200

    res.end(emitter.contents)
  }

  function generateIndex (req, res) {
    res.setHeader('content-type', 'text/html; charset=utf-8')
    var html = opts.defaultIndex || defaultIndex
    html({
      title: opts.title,
      entry: opts.entry
    }).pipe(res)
  }
}
