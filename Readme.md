# proxies

  Constantly evaluate lists of proxies, and get one that works.

## Example

```js
var Proxies = require('proxies');

var proxies = Proxies()
  .testEvery(ms('10s'))
  .limit(10)
  .source(require('proxynova'))
  .source(require('sources-proxyipchecker')());

proxies.get(function (err, list) {
  // list of proxies
});
```

## Sources

Here are the existing sources:
- [proxyipchecker](https://github.com/ivolo/proxies-proxyipchecker)
- [freeproxylist](https://github.com/ivolo/proxies-freeproxylist)

More sources are always welcome!

## API 

### Proxies

  Create a new `Proxies` instance.

#### .testEvery(ms)

  Refresh the proxy list every `ms`.

#### .limit(max)

  Only maintain `max` proxies.

#### .add(fn)

  Add a proxy list function.

## Licence

```
WWWWWW||WWWWWW
 W W W||W W W
      ||
    ( OO )__________
     /  |           \
    /o o|    MIT     \
    \___/||_||__||_|| *
         || ||  || ||
        _||_|| _||_||
       (__|__|(__|__|
```
