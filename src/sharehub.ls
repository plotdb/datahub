hub = if module? => require("./datahub") else datahub

sharehub = (o={}) ->
  @evthdr = {}
  @data = {}
  @config o
  @_init-connect = if o.init-connect? => o.init-connect else true
  @_create = o.create or null
  @_watch = o.watch or null
  @ews = o.ews
  hub.src.call @, {} <<< o <<< do
    ops-out: (ops) ~>
      _id = ops._id
      # DATA: we only have to apply if we decide to make a clone of remote obj when init
      #@data = json0.type.apply @data, ops
      @doc.submitOp JSON.parse(JSON.stringify(ops))
      # reflect to other subtree in hub
      @ops-in ops
    get: ~> @data
  @

sharehub.prototype = {} <<< hub.src.prototype <<< do
  on: (n, cb) -> @evthdr.[][n].push cb
  fire: (n, ...v) -> for cb in (@evthdr[n] or []) => cb.apply @, v
  config: (o = {}) ->
    if o.id? => @id = o.id
    @collection = o.collection or \doc
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

  connect: (o) ->
    if o? => o = (if typeof(o) == \object => o else {id: o})
    force = if !(o?) or !(o.force?) => true else o.force
    Promise.resolve!
      .then ~> if @sdb => @sdb.ensure! else @init!
      .then ~>
        if o? => @config o
        if @doc and
           @doc.id == @id and
           @doc.collection == @collection
           and ((o.force?) and !o.force) => return
        (if @doc => @disconnect! else Promise.resolve!)
          .then ~>
            @sdb.get do
              id: @id
              collection: @collection
              create: if @_create => (~> @_create!) else (->{})
              watch: (...args) ~> @watch.apply @, args
          .then (doc) ~>
            # DATA: We pass raw data now, but if we want to clone:
            # @data = JSON.parse(JSON.stringify(doc.data))
            @ <<< doc: doc, data: doc.data
            @fire \open

  disconnect: ->
    if !@doc => return Promise.resolve!
    (res, rej) <~ new Promise _
    <~ @doc.destroy _
    @ <<< {doc: null, data: null}
    @fire \close
    res!

  init: ->
    Promise.resolve!
      .then ~>
        if @sdb => return @sdb.ensure!
        @sdb = sdb = new ews.sdb-client ws: @ews
        sdb.on \error, (e) ~>
          if !@evthdr.[]error.length => console.error e.err
          else @fire \error, e.err
        sdb.on \close, ~> @disconnect!
        if @id and @_init-connect => @connect!
      .then ~> {sdb: @sdb}

if module? => module.exports = sharehub
else if window? => window.sharehub = sharehub
