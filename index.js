var createServer = require('./lib/server')
var createBundler = require('./lib/watchify-bundler')

var Emitter = require('events/')
var url = require('url')
var once = require('once')
var path = require('path')

module.exports = function startListening (watchify, opt) {
  opt = opt || {}
  if (!opt.host || !opt.port) {
    throw new Error('must specify port and host')
  }

  var entry = opt.entry
  var host = opt.host
  var port = opt.port

  var emitter = new Emitter()
  var server = createServer(opt)
    .on('error', function (err) {
      emitter.emit('error', err)
    })
    .listen(port, host, function () {
      var hostname = (host || 'localhost')
      var uri = 'http://' + hostname + ':' + port + '/'
      emitter.emit('connect', {
        uri: uri
      })
    })

  // create a new watchify instance
  var bundler = createBundler(watchify, opt)
    .on('update', function (contents) {
      server.update(contents)
      emitter.emit('update', entry, contents)
    })
    .on('pending', function () {
      server.pending()
      emitter.emit('pending', entry)
    })
    .on('error', emitter.emit.bind(emitter, 'error'))

  emitter.close = once(function () {
    server.close()
    bundler.close()
  })

  return emitter
}

module.exports.bundler = createBundler
module.exports.server = createServer