# 0.0.6

 - remove postinstall script to prevent npm install failure


# 0.0.5

 - suppor doc creation base object in sharehub
 - add warning when something been piped twice. remove `adopt` since we should keep track of source.
 - bug fix: append obj creation op only if object doesn't exists (instead of check if value is true )
 - bug fix: localize should clone ops. also fix localize logic.
 - bug fix: we should apply changes to sharehub data when receiving incoming ops, but only if it's not source.


# 0.0.4

 - build bundle js for datahub and sharehub
 - support both bare mode and bundle mode.


# 0.0.3

 - build all source without -bare option.
 - scope local variable and export `datahub`, `sharehub` only .

# 0.0.2

 - change npm package namespace from @loadingio to @plotdb
