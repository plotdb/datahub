sharehub = (opt={}) ->
  @data = {}
  @id = opt.id or ''
  srchub.call @, {} <<< opt <<< do
    ops-out: (ops) ~>
      @data = json0.type.apply @data, ops
      @doc.submitOp JSON.parse(JSON.stringify(ops))
    get: ~> JSON.parse(JSON.stringify(@data))
  @

sharehub.prototype = {} <<< srchub.prototype <<< do
  watch: (ops,opt) ->
    @ops-in JSON.parse(JSON.stringify(ops))
  init: ->
    Promise.resolve!
      .then ~>
        sdb = new sharedb-wrapper url: window.location.protocol.replace(\:,''), window.location.domain
        sdb.get id: @id, watch: (...args) ~> @watch.apply @, args
      .then (doc) ~>
        @doc = doc
        @data = JSON.parse(JSON.stringify(@doc.data))
