/* to be removed */
sharehub = (opt={}) ->
  @data = {}
  @

sharehub.prototype = Object.create(Object.prototype) <<< do
  pipe: -> @hub.pipe it; it.adopt @hub
  cut: -> @hub.pipe cut
  watch: (ops) ->
    @hub.ops-in JSON.parse(JSON.stringify(ops))
  init: ->
    @ldld = ldld = new ldLoader {class-name: 'full ldld'}
    ldld.on!
    sdb = new sharedb-wrapper url: window.location.protocol.replace(\:,''), window.location.domain
    sdb.get id: \sample, watch: ~>@watch it
      .then (doc) ~>
        @doc = doc
        @data = JSON.parse(JSON.stringify(@doc.data))
        @hub = new hub!
        @hub.get = ~> return @data
        @hub.ops-out = (ops) ~>
          ops-addon = []
          ops.map (op) ~>
            d = @data
            p = []
            for i from 0 til op.p.length - 1 =>
              p.push op.p[i]
              if !d[op.p[i]] =>
                ops-addon.push do
                  p: JSON.parse(JSON.stringify(p))
                  oi: {} # Array?
              d = d[op.p[i]] or {}
          ops = ops-addon ++ ops
          ops = JSON.parse(JSON.stringify(ops))
          @data = json0.type.apply @data, ops
          @doc.submitOp ops

      .then ->
        ldld.off!
