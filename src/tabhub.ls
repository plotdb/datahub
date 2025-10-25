_datahub = if module? => require("./datahub") else datahub
_json0 = if module? and require? => require("@plotdb/json0") else json0

# to accept incoming data, use: hub.as-des ops-in: (ops) -> ...
tabhub = (opt = {}) ->
  _datahub.src.call @, {} <<< opt <<< do
    ops-out: (ops) ~>
      _json0.type.apply @_.bc.data!, ops
      @_.bc.send {ops, action: \ops-out}
    get: ~> @_.bc.data!
  @_ <<< bc: new tabhub.broadcaster {data: opt.initial-data, name: opt.channel-name, hub: @}
  @

tabhub.prototype = {} <<< _datahub.src.prototype <<< do
  connect: -> @_.bc.init!

tabhub.broadcaster = (opt = {}) ->
  @_ =
    id: if suuid? => suuid! else Math.random!toString 36 .substring 2
    proxise: {}
    channel: new BroadcastChannel "@plotdb/datahub:#{opt.name or 'default-channel'}"
    data: opt.data or {}
    hub: opt.hub
  @

tabhub.broadcaster.prototype = Object.create(Object.prototype) <<<
  data: -> if arguments.length => @_.data = it else @_.data
  request: (opt = {}) ->
    func = if !opt.timeout => (->)
    else (({action,timeout}) ~> ~> setTimeout (~> @_.proxise[][action].splice(0).map (p) -> p.resolve!), timeout) opt
    @_.proxise[][opt.action].push ret = proxise func
    @_.channel.postMessage(opt <<< {src: @_.id})
    return ret!
  hub: -> @_.hub
  send: (opt = {}) -> @_.channel.postMessage(opt <<< {src: @_.id})
  resolve: ({action}) -> (@_.proxise[action] or []).splice(0).map (p) -> p.resolve!
  init: ->
    @_.channel.onmessage = (evt) ~>
      {data, ops, action, by-action, src} = evt.data or {}
      if action == \ops-out =>
        json0.type.apply @data!, ops
        @hub!ops-in ops
      else if action == \ops-in =>
        json0.type.apply @data!, ops
        @hub!ops-in ops
      else if action == \request-data =>
        @send {data: @data!, action: \data-requested, by-action: action, des: src}
      else if action == \data-requested =>
        @data data
      if by-action and broadcaster.proxise[by-action] =>
        @resolve {action: by-action}
    @request {action: \request-data, timeout: 100}

if module? => module.exports = tabhub
else if window? => window.tabhub = tabhub
