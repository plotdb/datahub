# Data Hub

Access *scoped* data via *piped* *operational transformation*.


## Usage

after including `datahub.bundle.min.js`:

    # this is our data source.
    src = new datahub.src do
      ops-out: (ops) -> # update data src by incoming ops
      get: -> # return complete data. always return cloned data to prevent user from touching original data

    # this is our view controller
    des = new datahub.des do
      ops-in (ops): -> # update ui / widget

    # data through pipe are scoped under "my-view"
    view-hub = new datahub {scope: ["my-view"]}
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

    mhub = new datahub.mem!
    uhub = new datahub.usr {render: -> console.log('ok'); }
    mhub.pipe uhub
    document.querySelector('textarea').addEventListener \input, ->
      uhub.ops-out [
        { p: ['str',0], si: @value[@value.length - 1] }
      ]


## Wrap constructor

Instead of `userhub`, you can use `datahub.as` to wrap your constructor, thus support hub mechanism directly with your own class:

    someClass = datahub.as (opt = {}) -> @
    someClass.prototype <<< { ... }


Source hub should be passed to this constructor via `opt.src` option:

    someObj = new someClass {src: <myUpstreamHub>}


By default, datahub.as stores data in `data` member variable, and expect 2 functions. Here are the 2 functions with their default value:

    update: (ops) -> json0.type.apply @data, ops; @render!
    render: -> console.log "render is not implemented"


## Sharehub

Sharehub provides a simple interface and implementation reference for adopting ShareDB with data hub to keep edited data in database:

    uhub = new datahub.usr!
    shub = new sharehub({
      id: 'my-sharedb-doc-id'
      create: -> {} # init obj if doc not found.
    })
    shub.init!
      .then -> shub.pipe uhub

Sharehub is in a standalone JS file. include `sharehub.js` if you want to use it.


## Scoping

Passing `scope` option ( an array of strings / numbers ) into datahub constructor to filter incoming op and data based on the specified scope. For example, assume our data source keeps data in `datasrc` variable, then following hub:

    new hub({scope: ["users", "deleted"]})

will only pass ops that affect object in `datasrc.users.deleted`. Furthermore, data get from this hub will only be the subtree in `datasrc.users.deleted`.

You can pipe data source to a hub that is scoped, and pipe this scoped hub to the destination hubs that use the same subtree.


## License

MIT
