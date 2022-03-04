# Change Logs

## v0.2.3 (upcoming)

 - upgrade modules


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
