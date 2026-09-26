# Component lifecycle and keyed-handler regression tests

Run with an installed Puppeteer and its Chrome:

```sh
node --test tests/toggle-hydration/toggle-hydration.test.js
```

For a sibling BrowserBox development installation, set `PUPPETEER_MODULE` to its
resolved Puppeteer module file URL and `PUPPETEER_EXECUTABLE_PATH` to the local
Chrome executable. The test no longer assumes a particular user's absolute path.

The keyed list reproduces BrowserBox's tab behavior: after closing A, B's captured
index must update from 1 to 0. Version 17.0.0 instead removes C when B is clicked.
Both a single function and an array of handlers must use the latest captured
values while retaining the existing DOM and handler method names. Separate tests
exercise overlapping updates, survivor identity, and disconnect/reconnect events.
The lifecycle assertion observes real elements; debug `[TD]` logs were removed
from the framework before these tests were updated.
