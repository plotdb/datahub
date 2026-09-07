_json0 = if module? and require? => require("@plotdb/json0") else json0

datahub = hub = (opt = {}) ->
  @opt = opt
  # _id: used to identify the ops origin ( to prevent from ops-in to the origin )
  @_id = "#{datahub._id++}/#{Math.random!toString(36)substring(2)}"
  @_ =
    evthdr: {}
    src: null # source hub to feed this hub
    scope: opt.scope or [] # filter op and data to this scope
    subscriber: [] # hubs be feeded by this hub
  # tree-like structure - single source, multi-subscriber
  if opt.src => opt.src.pipe @
  (opt.subscriber or []).map (h) ~> @pipe h
  # indicate if a hub is active. ( either closed or opened )
  @_.state = \closed
  @on \open, ~>
    # subscribers in deshub isn't a hub and thus without fire method
    # so we have to make sure it exists before using it
    @_.subscriber.map (h) -> if h.fire => h.fire \open
    # we don't use `state("opened")` here because it causes infinite loop
    @_.state = \opened
  @on \close, ~>
    @_.subscriber.map (h) -> if h.fire => h.fire \close
    @_.state = \closed
  @

datahub.prototype = Object.create(Object.prototype) <<< do
  on: (n, cb) -> (if Array.isArray(n) => n else [n]).map (n) ~> @_.evthdr.[][n].push cb
  fire: (n, ...v) -> for cb in (@_.evthdr[n] or []) => cb.apply @, v
  state: (s) ->
    if !(s?) => return @_.state
    os = @_.state
    @_.state = s
    if os != s => @fire (if s == \opened => \open else \close)

  # this hub acts as data source. overwrite ops-out, get
  as-src: (o) ->
    @_.src = do
      get: o.get or (->)
      ops-out: (ops) ~> (o.ops-out or (->)) @addon ops

  # this hub acts as dest hub. overwrite ops-in
  as-des: (o) ->
    @_.subscriber = [{ops-in: o.ops-in or (->)}]

  # pipe data to subhub as one of subscriber
  pipe: (h) ->
    if h._.src =>
      console.warn "a hub is connected with multiple source. cut the previous source anyway."
      h._.src.cut h
    @_.subscriber.push h
    h._.src = @
    if @_.state == \opened => h.fire \open
    return h

  # cut the pipe from this to subscriber
  cut: (h) ->
    if !~(idx = @_.subscriber.indexOf h) => return
    @_.subscriber.splice idx, 1
    h.src = null

  # src -> des: tell des data is updating
  ops-in: (ops) ->
    if ops._id == @_id => return
    _id = ops._id
    # we may not need clone but _id has to be fetched before clone
    # since JSON stringify wont keep _id because ops is an array
    #ops = JSON.parse(JSON.stringify(ops))
    localize = (p, s) ->
      for i from 0 til s.length => if p[i] != s[i] => return
      p.slice i + 1
    if @_.scope => ops = ops.map ~> {} <<< it <<< p: localize(it.p, @_.scope)
    ops = ops.filter -> it.p? and it.p.length
    ops._id = _id
    if ops.length => @_.subscriber.map -> it.ops-in ops

  # des -> src: tell src to update data
  ops-out: (ops) ->
    if !ops._id => ops._id = @_id
    if @_.scope => ops.map ~> it.p = @_.scope ++ it.p
    @_.src.ops-out ops

  # prepend op to create node for ops accessing non-existed path
  addon: (ops) ->
    _id = ops._id
    ops-addon = []
    data = @get!
    # paths we already queued a node for. `data` is not updated as we go, so
    # without this two ops sharing a missing ancestor each queue their own
    # `{oi: {}}` for it - and the second one wipes the intermediate node the
    # first one just built. the real op then lands on a path that no longer
    # exists and `apply` throws.
    created = {}
    ops.map (op) ~>
      d = data
      p = []
      # TODO support creation of different types. an array element still gets
      # created as `{oi: {}}`, which `apply` rejects ( "Referenced element not
      # an object" ) - it needs `li`. only objects and, below, strings work.
      for i from 0 til op.p.length - 1 =>
        p.push op.p[i]
        key = p.join '\u0000'
        if !(d[op.p[i]]?) and !created[key] =>
          created[key] = true
          # `length - 2` is the last turn of this loop, and what it creates
          # differs by op kind. for `oi` / `od` the path is
          # `[...ancestors, key]`, so the last turn builds the container the
          # target sits in - an object. for `si` / `sd` the path is
          # `[...ancestors, field, position]`: the final segment is a character
          # offset, not a key, so the last turn builds the string ITSELF.
          #
          # two bugs used to live here. the index was tested against
          # `length - 1`, which this loop never reaches, so the branch was dead
          # and string fields were created as `{}` - `apply` then failed with
          # "s1.slice is not a function". and the branch it guarded created the
          # node with `si: ""`, which is not a creation primitive at all: `si`
          # inserts into a string that already exists and needs a position at
          # the end of its path, so `apply` rejects it with "component missing
          # position field". `oi` is the primitive that brings a key into
          # existence; `oi: ""` gives it the empty string.
          #
          # NOTE both branches emit an `oi` with no `od`, so a concurrent write
          # to the same path transforms this whole op sequence away silently.
          # that is inherent to creating a node we believe is absent, not new
          # here - but it means `addon` is only safe where the caller's snapshot
          # is the same one the ops were derived from.
          ops-addon.push {
            p: JSON.parse(JSON.stringify(p))
          } <<< if i == op.p.length - 2 and op.si => (oi: "") else (oi: {})
        # `?` rather than `or`, purely so both tests use the same notion of
        # "present". no behaviour depends on it: a falsy-but-present node
        # ( '', 0 ) cannot have children, so it never appears mid-path in a
        # valid op. consistency, not a fix.
        d = if d[op.p[i]]? => d[op.p[i]] else {}
    ops = ops-addon ++ ops
    ops._id = _id
    return ops

  # query data from source
  get: ->
    if !@_.src => return null
    d = @_.src.get!
    for n in @_.scope =>
      if !d => return null
      d = d[n]
    return d

srchub = (opt={}) ->
  datahub.call @, opt
  @as-src do
    ops-out: opt.ops-out or (->)
    # raw data is returned. user should clone returned data if to use.
    get: opt.get or (->)
  @
srchub.prototype = {} <<< datahub.prototype

deshub = (opt={}) ->
  datahub.call @, opt
  @as-des ops-in: opt.ops-in or (->)
  @
deshub.prototype = Object.create(Object.prototype) <<< datahub.prototype

memhub = (opt = {}) ->
  @_data = {}
  srchub.call @, {} <<< opt <<< do
    ops-out: (ops) ~>
      @_data = _json0.type.apply @_data, ops
      @ops-in ops
    get: ~> @_data
  @_.state = \opened
  @

memhub.prototype = {} <<< srchub.prototype

usrhub = (opt = {}) ->
  deshub.call @, {} <<< opt <<< do
    ops-in: (ops) ~>
      @_data = @get! or {}
      opt.render ops
  @
usrhub.prototype = {} <<< deshub.prototype

hif = (o={}) ->
  @_evthdr = {}
  @data = {}
  @hub = hub = new datahub.des do
    scope: o.scope or []
    ops-in: (ops) ~>
      _json0.type.apply @data, ops
      @ops-in ops
  hub.on \open, ~> @fire \open
  hub.on \close, ~> @fire \close
  @ops-out = (ops) ~> hub.ops-out ops
  @get = ~> @hub.get! or {}
  @on \open, ~> @data = @get!
  @

hif.prototype = Object.create(Object.prototype) <<<
  state: -> @hub.state!
  ops-in: (ops) ->
  on: (n, cb) -> (if Array.isArray(n) => n else [n]).map (n) ~> @_evthdr.[][n].push cb
  fire: (n, ...v) -> for cb in (@_evthdr[n] or []) => cb.apply @, v

as = (func) ->
  func.prototype = Object.create(Object.prototype)
  ret = (...args) ->
    obj = Reflect.construct hif, args, ret
    func.apply obj, args
    obj
  Object.setPrototypeOf(ret.prototype, hif.prototype)
  return ret

hub <<< {src: srchub, des: deshub, mem: memhub, usr: usrhub, as, _id: 0}

if module? => module.exports = hub
else if window? => window.datahub = hub
