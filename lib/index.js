
var Batch = require('batch');
var debug = require('debug')('proxies');
var defaults = require('defaults');
var Emitter = require('events').EventEmitter;
var inherit = require('util').inherits;
var ms = require('ms');
var request = require('request');

/**
 * Expose `Proxies`.
 */

module.exports = Proxies;

/**
 * Initialize a `Proxies` instance.
 */

function Proxies (options) {
  if (!(this instanceof Proxies)) return new Proxies(options);
  this.options = defaults(options, {
    refresh: ms('1m'),
    timeout: ms('20s'),
    limit: 100,
    concurrency: 10
  });

  this.sources = [];
  this.proxies = {};

  this.ready = false;
  this.refreshing = false;

  this.refreshTimer = null;
  this.resetRefreshTimer();

  this.tester = function () {
    return { method: 'GET', url: 'https://google.com' };
  };
}

/**
 * Inherit from `Emitter`.
 */

inherit(Proxies, Emitter);

/**
 * Add a source `fn` of proxy urls.
 *
 * @param {Function} fn
 * @return {Proxies}
 */

Proxies.prototype.source = function (fn) {
  this.sources.push(fn);
  return this;
};

/**
 * Set the proxy testEvery refresh time.
 *
 * @param {Number} refresh
 * @return {Proxies}
 */

Proxies.prototype.testEvery = function (refresh) {
  this.options.refresh = refresh;
  this.resetRefreshTimer();
  return this;
};

/**
 * Set the test `fn` for sources.
 *
 * @param {Function} fn
 * @return {Sources}
 */

Proxies.prototype.test = function (fn) {
  this.tester = fn;
  return this;
};

/**
 * Add a proxy.
 *
 * @param {String} proxy
 * @returns {Proxies}
 */

Proxies.prototype.add = function (proxy) {
  if (proxy in this.proxies) {
    debug('proxy %s already exists', proxy);
  } else {
    this.proxies[proxy] = {
      created: Date.now(),
      lastTested: false,
      lastSuccessful: false,
      latency: null
    };
  }
  return this;
};

/**
 * Reset the new refresh timer.
 *
 * @return {Proxies}
 */

Proxies.prototype.resetRefreshTimer = function () {
  if (this.refreshTimer) clearInterval(this.refreshTimer);
  this.refreshTimer = setInterval(this.refresh.bind(this), this.options.refresh);
  return this;
};

/**
 * Refresh the proxies.
 * @param {Function} callback
 * @return {Proxies}
 */
Proxies.prototype.refresh = function (callback) {
  var self = this;
  if (this.refreshing) return;
  this.refreshing = true;
  this.refreshProxies(function (err) {
    self.refreshing = false;
    if (callback) callback(err);
  });
  return this;
};

/**
 * Refresh all the sources, and then test all the proxies.
 *
 * @param {Function} callback
 * @return {Proxies}
 */

Proxies.prototype.refreshProxies = function (callback) {
  var self = this;
  debug('refreshing sources ..');
  this.refreshSources(function (err) {
    if (err) {
      debug('error refreshing sources %s', err);
      if (callback) callback(err);
    } else {
      debug('refreshed sources, testing proxies ..');
      self.testProxies(function (err) {
        if (err) {
          debug('error testing proxies %s', err);
          if (callback) return callback(err);
        } else {
          debug('finished testing proxies');
          var whitelist = self.filter({ maxAge: ms('1h'), latency: 30000 });
          whitelist = whitelist.splice(0, self.options.limit);
          self.trim(whitelist);
          if (callback) callback();
        }
      });
    }
  });
  return this;
};

/**
 * Refresh proxy sources.
 *
 * @param {Function} callback
 * @return {Sources}
 */

Proxies.prototype.refreshSources = function (callback) {
  var self = this;
  var batch = new Batch();
  batch.concurrency(this.options.concurrency);
  var add = this.add.bind(this);
  this.sources.forEach(function (source) {
    batch.push(function (done) {
      debug('request source %s ..', source.name);
      source(function (err, proxies) {
        if (err) {
          debug('source %s error %s', source.name, err);
          self.emit('source fetch error', err);
        }
        else {
          proxies.forEach(add);
          self.emit('source fetch', proxies);
        }
        done();
      });
    });
  });
  batch.end(callback);
  return this;
};

/**
 * Test sources.
 *
 * @param {Function} callback
 * @return {Sources}
 */

Proxies.prototype.testProxies = function (callback) {
  var self = this;
  var batch = new Batch();
  batch.concurrency(this.options.concurrency);
  Object.keys(this.proxies).forEach(function (proxy) {
    var memo = self.proxies[proxy];
    batch.push(function (done) {
      debug('testing proxy %s ..', proxy);
      var options = self.tester();
      options.proxy = proxy;
      options.timeout = self.options.timeout;
      var start = Date.now();
      request(options, function (err, res) {
        memo.lastTested = Date.now();
        if (err) {
          debug('proxy %s test error %s', proxy, err);
          self.emit('proxy test failure', proxy);
        } else if (Math.floor(res.statusCode / 100) !== 2) {
          debug('proxy %s bad status %d', proxy, res.statusCode);
          self.emit('proxy status failure', proxy);
        } else {
          memo.lastSuccessful = Date.now();
          memo.latency = Date.now() - start;
          debug('proxy %s test successful in %s ms', proxy, memo.latency);
          self.emit('proxy test success', proxy, memo);
          // we have a proxy now so we're ready
          self.ready = true;
          self.emit('ready');
        }
        done();
      });
    });
  });
  batch.end(callback);
  return this;
};

/**
 * Trim the proxies by the whitelist
 *
 * @param {Array|String} whitelist
 */

Proxies.prototype.trim = function (whitelist) {
  var self = this;
  var map = {};
  whitelist.forEach(function (proxy) { map[proxy] = true; });
  var all = Object.keys(this.proxies);
  debug('trimming proxies, keeping %d / %d proxies ..', whitelist.length, all.length);
  all.forEach(function (proxy) {
    if (!(proxy in map)) {
      debug('deleting proxy %s', proxy);
      delete self.procies[proxy];
    }
  });
  debug('trimmed proxies, %d left', this.proxies.length);
};

/**
 * Filter the proxy keys by `maxAge` and `maxLatency` and
 * sort by latency.
 * @param {Object} options
 * @return {Array|String}
 */

Proxies.prototype.filter = function (options) {
  var self = this;
  options = defaults(options, {
    maxAge: ms('60s'),
    maxLatency: 10000
  });
  var now = Date.now();

  return Object.keys(this.proxies)
    .filter(function (proxy) { // filter out not successful
      var memo = self.proxies[proxy];
      if (!memo.lastSuccessful) return false;
      return (now - memo.lastSuccessful) <= options.maxAge;
    })
    .filter(function (proxy) { // filter out bad latency
      var memo = self.proxies[proxy];
      if (!memo.latency) return false;
      return memo.latency < options.maxLatency;
    })
    .sort(function (p1, p2) { // sort by latency
      var memo1 = self.proxies[p1];
      var memo2 = self.proxies[p2];
      if (memo1.latency === memo2.latency) return 0;
      else if (memo1.latency < memo2.latency) return 1;
      else return -1;
    });
};

/**
 * Get the proxies sorted by latency.
 *
 * @param {Object} options
 * @return {Array|String}
 */

Proxies.prototype.get = function (options, callback) {
  var self = this;
  if (typeof options === 'function') {
    callback = options;
    options = {};
  }

  if (this.ready) process.nextTick(next);
  else this.once('ready', next);

  function next () { callback(null, self.filter(options)); }
};
