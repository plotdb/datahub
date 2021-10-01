datahub = hub = (opt = {}) ->
  @opt = opt
  @scope = opt.scope or [] # filter op and data to this scope
  # tree-like structure - single source, multi-subscriber
  if opt.src => opt.src.pipe @
  @subscriber = []
  (opt.subscriber or []).map ~> @pipe.push it
  @

datahub.prototype = Object.create(Object.prototype) <<< do
  # this hub acts as data source. overwrite ops-out, get
  as-src: (o = {}) ->
    @src = do
      get: o.get or (->)
      ops-out: (ops) ~> (o.ops-out or (->)) @addon ops

  # this hub acts as dest hub. overwrite ops-in
  as-des: (o) -> @subscriber = [{ops-in: o.ops-in or (->)}]

  # pipe data to subhub ( as subscriber )
  pipe: ->
    if it.src =>
      console.warn "a hub is connected with multiple source. cut the previous source anyway."
      it.src.cut it
    @subscriber.push it; it.src = @; return it

  # cut the pipe from this to subscriber
  cut: -> if ~(idx = @subscriber.indexOf it) =>
    @subscriber.splice idx, 1
    it.src = null

  # src -> des: tell des data is updating
  ops-in: (ops) ->
    localize = (p, s) ->
      for i from 0 til s.length => if p[i] != s[i] => return
      p.slice i + 1
    if @scope => ops = ops.map ~> {} <<< it <<< p: localize(it.p, @scope)
    ops = ops.filter -> it.p?
    if ops.length => @subscriber.map -> it.ops-in ops

  # des -> src: tell src to update data
  ops-out: (ops) ->
    if @scope => ops.map ~> it.p = @scope ++ it.p
    @src.ops-out ops

  # prepend op to create node for ops accessing non-existed path
  addon: (ops) ->
    ops-addon = []
    data = @get!
    ops.map (op) ~>
      d = data
      p = []
      # TODO support creationg of different type object
      for i from 0 til op.p.length - 1 =>
        p.push op.p[i]
        if !(d[op.p[i]]?) =>
          ops-addon.push {
            p: JSON.parse(JSON.stringify(p))
          } <<< if i == op.p.length - 1 and op.si => (si: "") else (oi: {})
        d = d[op.p[i]] or {}
    ops = ops-addon ++ ops
    return ops

  # get data from source
  get: ->
    d = @src.get!
    for n in @scope =>
      if !d => return null
      d = d[n]
    return d

srchub = (opt={}) ->
  datahub.call @, opt
  @as-src do
    ops-out: opt.ops-out or (->)
    # should always return cloned data otherwise user might touch the original data
    get: opt.get or (->)
  @
srchub.prototype = {} <<< datahub.prototype

deshub = (opt={}) ->
  datahub.call @, opt
  @as-des ops-in: opt.ops-in or (->)
  @
deshub.prototype = {} <<< datahub.prototype

memhub = (opt = {}) ->
  @data = {}
  srchub.call @, {} <<< opt <<< do
    ops-out: (ops) ~>
      @data = json0.type.apply @data, ops
      @ops-in ops
    get: ~> JSON.parse(JSON.stringify(@data))
  @
memhub.prototype = {} <<< srchub.prototype

usrhub = (opt = {}) ->
  deshub.call @, {} <<< opt <<< do
    ops-in: (ops) ~>
      if !@data => @data = (@get! or {})
      else json0.type.apply @data, ops
      opt.render ops
  @
usrhub.prototype = {} <<< deshub.prototype


hubif = (opt={}) ->
  @src = opt.src
  @src.pipe ( @hub = new datahub.des { ops-in: (ops) ~> @update ops } )
  @data = @hub.get!
  @

hubif.prototype = Object.create(Object.prototype) <<< do
  # seems not useful. hide them for now
  # serialize: -> return @data
  # deserialize: -> @data = it; @render!
  update: (ops) ->
    json0.type.apply @data, ops
    @render!
  render: -> console.log "render is not implemented"

as = (func) ->
  func.prototype = Object.create(Object.prototype)
  ret = (...args) ->
    obj = Reflect.construct hubif, args, ret
    func.apply obj, args
    obj
  Object.setPrototypeOf(ret.prototype, hubif.prototype)
  return ret


hub <<< {src: srchub, des: deshub, mem: memhub, usr: usrhub, as}

if module? => module.exports = hub
else if window? => window.datahub = hub
