
var assert = require('assert');
var ms = require('ms');
var Proxies = require('..');
var ProxyIPChecker = require('proxies-proxyipchecker');
var proxynova = require('proxynova');
var Scraper = require('scraper');

describe('proxies', function () {
  this.timeout(120000); // sourcing and testing can take a while

  before(function (done) {
    var self = this;
    Scraper(function (err, scraper) {
      if (err) return done(err);
      self.proxyipchecker = ProxyIPChecker(scraper);
      done();
    });
  });

  it('should be able to get a working proxy', function (done) {
    var proxies = Proxies()
      .testEvery(ms('10s'))
      .source(proxynova)
      .source(this.proxyipchecker);

    proxies.get(function (err, proxies) {
      if (err) return done(err);
      assert(Array.isArray(proxies));
      assert(proxies.length > 0);
      done();
    });
  });
});