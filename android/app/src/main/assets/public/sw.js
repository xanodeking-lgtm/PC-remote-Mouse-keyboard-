/**
 * Copyright 2018 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *     http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

// If the loader is already loaded, just stop.
if (!self.define) {
  let registry = {};

  // Used for `eval` and `importScripts` where we can't get script URL by other means.
  // In both cases, it's safe to use a global var because those functions are synchronous.
  let nextDefineUri;

  const singleRequire = (uri, parentUri) => {
    uri = new URL(uri + ".js", parentUri).href;
    return registry[uri] || (
      
        new Promise(resolve => {
          if ("document" in self) {
            const script = document.createElement("script");
            script.src = uri;
            script.onload = resolve;
            document.head.appendChild(script);
          } else {
            nextDefineUri = uri;
            importScripts(uri);
            resolve();
          }
        })
      
      .then(() => {
        let promise = registry[uri];
        if (!promise) {
          throw new Error(`Module ${uri} didn’t register its module`);
        }
        return promise;
      })
    );
  };

  self.define = (depsNames, factory) => {
    const uri = nextDefineUri || ("document" in self ? document.currentScript.src : "") || location.href;
    if (registry[uri]) {
      // Module is already loading or loaded.
      return;
    }
    let exports = {};
    const require = depUri => singleRequire(depUri, uri);
    const specialDeps = {
      module: { uri },
      exports,
      require
    };
    registry[uri] = Promise.all(depsNames.map(
      depName => specialDeps[depName] || require(depName)
    )).then(deps => {
      factory(...deps);
      return exports;
    });
  };
}
define(['./workbox-afac4cd2'], (function (workbox) { 'use strict';

  self.skipWaiting();
  workbox.clientsClaim();
  /**
   * The precacheAndRoute() method efficiently caches and responds to
   * requests for URLs in the manifest.
   * See https://goo.gl/S9QRab
   */
  workbox.precacheAndRoute([{
    "url": "registerSW.js",
    "revision": "1872c500de691dce40960bb85481de07"
  }, {
    "url": "pwa-maskable-512x512.png",
    "revision": "ab3201d168ce93798b7e170ae6463ad0"
  }, {
    "url": "pwa-512x512.png",
    "revision": "b1f4e3627c15d1e8bd9d8540f0d34e10"
  }, {
    "url": "pwa-192x192.png",
    "revision": "e1a6d7dfcc128287d486d44e36590e03"
  }, {
    "url": "index.html",
    "revision": "15d3fcb34af4f6197d7a1f8a56344860"
  }, {
    "url": "icon.svg",
    "revision": "e811845974cb065232e0929c45ee4018"
  }, {
    "url": "apple-touch-icon.png",
    "revision": "a23edcb67e938981f0accc6c8a456674"
  }, {
    "url": "assets/index-tTFJompQ.css",
    "revision": null
  }, {
    "url": "assets/index-WOEF4hG7.js",
    "revision": null
  }, {
    "url": "apple-touch-icon.png",
    "revision": "a23edcb67e938981f0accc6c8a456674"
  }, {
    "url": "icon.svg",
    "revision": "e811845974cb065232e0929c45ee4018"
  }, {
    "url": "pwa-192x192.png",
    "revision": "e1a6d7dfcc128287d486d44e36590e03"
  }, {
    "url": "pwa-512x512.png",
    "revision": "b1f4e3627c15d1e8bd9d8540f0d34e10"
  }, {
    "url": "pwa-maskable-512x512.png",
    "revision": "ab3201d168ce93798b7e170ae6463ad0"
  }, {
    "url": "manifest.webmanifest",
    "revision": "69d49093c8c15fc4f1323941dc331b40"
  }], {});
  workbox.cleanupOutdatedCaches();
  workbox.registerRoute(new workbox.NavigationRoute(workbox.createHandlerBoundToURL("index.html")));
  workbox.registerRoute(/^https:\/\/fonts\.googleapis\.com\/.*/i, new workbox.CacheFirst({
    "cacheName": "google-fonts-cache",
    plugins: [new workbox.ExpirationPlugin({
      maxEntries: 10,
      maxAgeSeconds: 31536000
    }), new workbox.CacheableResponsePlugin({
      statuses: [0, 200]
    })]
  }), 'GET');
  workbox.registerRoute(/^https:\/\/fonts\.gstatic\.com\/.*/i, new workbox.CacheFirst({
    "cacheName": "gstatic-fonts-cache",
    plugins: [new workbox.ExpirationPlugin({
      maxEntries: 10,
      maxAgeSeconds: 31536000
    }), new workbox.CacheableResponsePlugin({
      statuses: [0, 200]
    })]
  }), 'GET');

}));
