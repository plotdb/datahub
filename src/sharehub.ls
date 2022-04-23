hub = if module? => require("./datahub") else datahub

sharehub = (opt={}) ->
  @evthdr = {}
  @data = {}
  @id = opt.id or ''
  @create = opt.create or null
  @ews = opt.ews
  hub.src.call @, {} <<< opt <<< do
    ops-out: (ops) ~>
      _id = ops._id
      # we only have to apply if we decide to make a clone of remote obj when init
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
    if src => return
    if !src => @data = json0.type.apply @data, ops
    @ops-in ops
  init: ->
    Promise.resolve!
      .then ~>
        @sdb = sdb = new ews.sdb-client ws: @ews
        #@sdb = sdb = new sharedb-wrapper url: window.location.protocol.replace(\:,''), window.location.domain
        sdb.on \error, (e) ~>
          if !@evthdr.[]error.length => console.error e.err
          else @fire \error, e.err
        sdb.get do
          id: @id
          create: if @create => (~> @create!) else (->{})
          watch: (...args) ~> @watch.apply @, args
      .then (doc) ~>
        @doc = doc
        @data = doc.data
        # we dont really need this, but then users should not touch it
        @data = JSON.parse(JSON.stringify(@doc.data))
        return {sdb: @sdb}

if module? => module.exports = sharehub
else if window? => window.sharehub = sharehub
