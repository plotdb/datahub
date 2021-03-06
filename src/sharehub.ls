try
  hub = require("./datahub")
  json0 = require("ot-json0")
catch e
  hub = datahub
  json0 = ot-json0

sharehub = (opt={}) ->
  @evt-handler = {}
  @data = {}
  @id = opt.id or ''
  @create = opt.create or null
  hub.src.call @, {} <<< opt <<< do
    ops-out: (ops) ~>
      @data = json0.type.apply @data, ops
      @doc.submitOp JSON.parse(JSON.stringify(ops))
    get: ~> JSON.parse(JSON.stringify(@data))
  @

sharehub.prototype = {} <<< hub.src.prototype <<< do
  on: (n, cb) -> @evt-handler.[][n].push cb
  fire: (n, ...v) -> for cb in (@evt-handler[n] or []) => cb.apply @, v
  watch: (ops,src) ->
    # apply ops only if not source.
    # if we are src, it has been applied when before submitOp
    if !src => @data = json0.type.apply @data, src
    @ops-in JSON.parse(JSON.stringify(ops))
  init: ->
    Promise.resolve!
      .then ~>
        @sdb = sdb = new sharedb-wrapper url: window.location.protocol.replace(\:,''), window.location.domain
        sdb.on \error, (e) ~>
          if !@evt-handler.[]error.length => console.error e.err
          else @fire \error, e.err
        sdb.get do
          id: @id
          create: if @create => (~> @create!) else null
          watch: (...args) ~> @watch.apply @, args
      .then (doc) ~>
        @doc = doc
        @data = JSON.parse(JSON.stringify(@doc.data))
        return {sdb: @sdb}

if module? => module.exports = sharehub
else if window? => window.sharehub = sharehub
