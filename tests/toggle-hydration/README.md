# Component lifecycle and keyed-handler regression tests

Install development dependencies (including the pinned Puppeteer) and run:

```sh
npm run test:regression
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

The render contract cases also cover separate bindings with identical function
source, handler arrays, keyed reorder with surviving node identity, stable
handler-name counts, deliberately out-of-order async completion, pending work
across disconnect/reconnect, app classes coexisting with readiness classes,
and optional missing stylesheets. Delayed values are explicitly released by
the test; real mouse clicks verify the resulting closures.

`npm publish` runs the local `prepublishOnly` gate: source regressions, the
production build, a nonempty package-entry check, then the same regressions
against `dist/pack.bang.js`. A failing step stops publication. The build script
also stops on a failed bundling command. No GitHub CI is required.

Use `npm publish --dry-run` to exercise that complete gate without publishing.
`npm run test:bundle` checks an already-built bundle. The older `npm test`
command remains the interactive demo server.
Initial mounting is also covered: a state update between shadow creation and
mount completion must retain the child-readiness obligation and eventually make
the parent visible. This guards missing controls during app startup.
