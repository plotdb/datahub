# Data Hub

Access *scoped* data via *piped* *operational transformation*.


## Usage

    # this is our data source.
    src = new srchub do
      ops-out: (ops) -> # update data src by incoming ops
      get: -> # return complete data. always return cloned data to prevent user from touching original data

    # this is our view controller
    des = new deshub do
      ops-in (ops): -> # update ui / widget

    # data through pipe are scoped under "my-view"
    view-hub = new hub {scope: ["my-view"]}
    # ... from srchub / through view-hub / to deshub
    src.pipe view-hub .pipe des

    # notify all users (deshub) about data changed
    src.ops-in [... /* ops */ ...]

    # update data source (srchub)
    des.ops-out [... /* ops */ ...]


## Memhub, Userhub

Datahub also provides auxiliary hubs for quickly trying and testing.

 - `memhub` - data source hub. store data in memory.
 - `usrhub` - simple destination hub. constructor options:
   - render(ops): called when there are updates from data source.

A sample usage of `memhub` and `usrhub` as follows:

    mhub = new memhub!
    uhub = new usrhub {render: -> console.log('ok'); }
    mhub.pipe uhub
    document.querySelector('textarea').addEventListener \input, ->
      uhub.ops-out [
        { p: ['str',0], si: @value[@value.length - 1] }
      ]


## Sharehub

Sharehub provides a simple interface and implementation reference for adopting ShareDB with data hub to keep edited data in database:

    uhub = new usrhub!
    shub = new sharehub do
      render: -> # .. update ui ..
    shub.init({
      id: 'my-sharedb-doc-id'
    })
      .then ->
        shub.pipe uhub

Sharehub is in a standalone JS file. include `sharehub.js` if you want to use it.


## License

MIT
