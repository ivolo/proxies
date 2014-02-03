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
- [proxyipchecker](https://github.com/ivolo/proxies-proxyipchecker) - free
- [freeproxylist](https://github.com/ivolo/proxies-freeproxylist) - free
- [webknox](https://github.com/ivolo/proxies-webknox) - paid

More sources are always welcome! A great way to find public proxy text files is via this [secret google search](https://www.google.com/search?q=%2B%C3%A2%E2%82%AC%C2%9D%3A8080%C3%A2%E2%82%AC%C2%B3+%2B%C3%A2%E2%82%AC%C2%9D%3A3128%C3%A2%E2%82%AC%C2%B3+%2B%C3%A2%E2%82%AC%C2%9D%3A80%C3%A2%E2%82%AC%C2%B3+filetype%3Atxt#aq=f&aqi=&aql=&q=%2B%E2%80%9D:8080%E2%80%B3+%2B%E2%80%9D%3A3128%E2%80%B3+%2B%E2%80%9D%3A80%E2%80%B3+filetype%3Atxt). 

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
