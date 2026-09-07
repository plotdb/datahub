# Change Logs

## v0.7.1

 - sharehub: `connect` no longer waits forever for the queue to drain on reconnect. when the target doc is unchanged it waits on `whenNothingPending`, a condition only the server can satisfy - if the server stops acknowledging ops it never fires, and `connect` never settles. callers that track a reconnect in progress ( e.g. `@servebase/connector`'s `_running` ) were left stuck with no way out, swallowing every later disconnection. the wait is now bounded by the new `settle` option ( ms, default 10000; 0 to skip the wait ); on timeout `connect` resolves with the doc and its pendingOps untouched, and sharedb keeps retrying by itself.
 - datahub: `addon` creates string fields with `oi: ""` instead of `{}`. the `si` branch was guarded by an index this loop never reaches, so `si` ops onto a missing field got an object to insert into and `apply` failed with "s1.slice is not a function".
 - datahub: `addon` no longer queues a node twice when two ops share a missing ancestor - the duplicate wiped the subtree the first op had just built, and ops on separate branches failed with "Cannot read properties of undefined".


## v0.7.0

 - **BREAKING** ( behavioral; api signatures unchanged ):
   - `open` is no longer fired when reconnecting to the same doc - the doc survives and converges instead. ui that re-initializes from `get()` on every `open` will silently stop doing so; listen to `suspend`, or pass `{force: true}` to restore the old discard-and-refetch behavior.
   - `close` is no longer fired on socket close ( only on explicit `disconnect` ). listen to `suspend` for connection loss.
   - `get()` no longer returns null while disconnected - the doc ( and its data ) stays alive. code using null-check as offline detection will not trigger anymore.
 - sharehub: keep sharedb doc alive across disconnection, so offline edits are no longer lost:
   - `ops-out` no longer drops ops when websocket is disconnected ( reverts v0.5.8 ). `submitOp` queues ops into sharedb doc's pendingOps and they are flushed after reconnect.
   - socket close no longer destroys the doc ( changes v0.5.3 "always disconnect if sdb-client closed" ). a `suspend` event is fired instead; the doc resyncs by itself after reconnect.
   - `connect`: when target doc is unchanged, wait until local and remote converge ( `whenNothingPending` ) instead of destroy + refetch. `force` now defaults to false; pass `{force: true}` explicitly for the old discard-and-refetch behavior.
 - requires `@plotdb/ews` >= 0.2.0 ( persistent sharedb connection ).
 - upgrade dependencies


## v0.6.0

 - add tabhub
 - upgrade dependencies
 - add `index.js` for hub bundles


## v0.5.9

 - make watchdog timeout shorter


## v0.5.8

 - prevent sending `submitOps` if websocket is disconnected


## v0.5.7

 - fix typo


## v0.5.6

 - monitor ops state and disconnect if submitop fails


## v0.5.5

 - sharehub: fix bug: error should be thrown if no handler registered.


## v0.5.4

 - sharehub
   - fix bug: when get, we should return original data instead of a copied one


## v0.5.3

 - sharehub
   - reuse internal sdb-client object so we dont have to re-create the entire object
   - always disconnect if sdb-client closed.
   - use `config` to update `id` and `collection` so we can re-config it anytime
   - accept `config` instead of only `id` in connect, and make it optional to make reconnect easier
   - support `force` option in connect to provide "only reconnect if not availabel mechanism"
     - but by default, `force` is always enabled.
   - provide `close` and `open` event so user can know when to get the whole data again
   - auto init or ensure socket connection in `connect` to make it fool-proof


## v0.5.2

 - add `connect` and `disconnect` API in `sharehub` for hub reusin for reconnection
 - add `init-connect` option in `sharehub`
 - tweak doc / comment about data cloning - we now dont suggest clone data internally by default


## v0.5.1

 - fix bug: memhub and usrhub should not clone data to prevent data inconsistency


## v0.5.0

 - support `watch` option in `sharehub`
 - dont clone data in hub. Let user be responsible to keep it untouched.


## v0.4.0

 - use @plotdb/ews in sharehub
 - remove browserify js since we don't really need it
 - fix bug: `_id` is gone when pipe back from source.


## v0.3.0

 - upgrade modules
 - add `state` for tracking data source status
 - track local ops to prevent from duplicated update
 - add `state` api and `open` and `close` events to reflect source hub status.
 - always clone ops in `ops-in` to prevent path interference between hubs
 - rewrite `datahub.as` to limit exposed interface and to simply usage
 - fix bug:
   - incorrect `subscriber` option handling
   - `get` failed if `src` is not yet set.


## v0.2.2

 - add `--no-bf` option in buliding to prevent browserify from using `browser` field in package.json
   - seems `browser-pack-flat` doesnt work well with browserified file
 - upgrade `@plotdb/json0`


## v0.2.1

 - release with compact directory structure


## v0.2.0

 - upgrade modules
 - patch test code to make it work with upgraded modules
 - add `main` and `browser` field in `package.json`.
 - remove livescript header in generated js


## v0.1.2

 - remove dependency to `ot-json0`.
 - use `terser` to support es code minification


## v0.1.1

 - remove `serialize` and `deserialize` function in `datahub.as`.


## v0.1.0

 - upgrade modules
 - add `datahub.as` interface wrapper


## v0.0.6

 - remove postinstall script to prevent npm install failure


## v0.0.5

 - suppor doc creation base object in sharehub
 - add warning when something been piped twice. remove `adopt` since we should keep track of source.
 - bug fix: append obj creation op only if object doesn't exists (instead of check if value is true )
 - bug fix: localize should clone ops. also fix localize logic.
 - bug fix: we should apply changes to sharehub data when receiving incoming ops, but only if it's not source.


## v0.0.4

 - build bundle js for datahub and sharehub
 - support both bare mode and bundle mode.


## v0.0.3

 - build all source without -bare option.
 - scope local variable and export `datahub`, `sharehub` only .

## v0.0.2

 - change npm package namespace from @loadingio to @plotdb
