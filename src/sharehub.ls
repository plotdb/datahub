hub = if module? => require("./datahub") else datahub

sharehub = (opt={}) ->
  @evthdr = {}
  @data = {}
  @id = opt.id or ''
  @_init-connect = if opt.init-connect? => opt.init-connect else true
  @_create = opt.create or null
  @_watch = opt.watch or null
  @ews = opt.ews
  hub.src.call @, {} <<< opt <<< do
    ops-out: (ops) ~>
      _id = ops._id
      # DATA: we only have to apply if we decide to make a clone of remote obj when init
      #@data = json0.type.apply @data, ops
      @doc.submitOp JSON.parse(JSON.stringify(ops))
      # reflect to other subtree in hub
      @ops-in ops
    get: ~> JSON.parse(JSON.stringify(@data))
  @

sharehub.prototype = {} <<< hub.src.prototype <<< do
  on: (n, cb) -> @evthdr.[][n].push cb
  fire: (n, ...v) -> for cb in (@evthdr[n] or []) => cb.apply @, v
  watch: (ops, src) ->
    # apply ops only if not source.
    # if we are src, it has been applied when before submitOp
    # we already ops-in when ops-out for local event.
    # this is necessary since we have to track origin hub by _id
    if @_watch => @_watch ops, src
    if src => return
    # DATA: We have to apply if we clone data when connecting.
    #if !src => @data = json0.type.apply @data, ops
    @ops-in ops

  connect: (id) ->
    p = if @sdb => Promise.resolve!
    else @init!
    p
      .then ~>
        @sdb.get do
          id: id or @id
          create: if @_create => (~> @_create!) else (->{})
          watch: (...args) ~> @watch.apply @, args
      .then (doc) ~>
        # DATA: We pass raw data now, but if we want to clone:
        # @data = JSON.parse(JSON.stringify(doc.data))
        @ <<< doc: doc, data: doc.data

  disconnect: ->
    if !@doc => return Promise.resolve!
    (res, rej) <~ new Promise _
    <~ @doc.destroy _
    @ <<< {doc: null, data: null}
    res!

  init: ->
    Promise.resolve!
      .then ~>
        @sdb = sdb = new ews.sdb-client ws: @ews
        sdb.on \error, (e) ~>
          if !@evthdr.[]error.length => console.error e.err
          else @fire \error, e.err
        if @id and @_init-connect => @connect!
      .then ~> {sdb: @sdb}

if module? => module.exports = sharehub
else if window? => window.sharehub = sharehub
