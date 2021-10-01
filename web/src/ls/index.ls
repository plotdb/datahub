editor = (opt={}) ->
  @opt = opt
  @root = root = ld$.find(opt.root, 0)
  @hub = new datahub.usr do
    scope: opt.scope or []
    render: (ops) ~>
      @value = json0.type.apply @value, ops
      @view.render!
  if opt.hub => opt.hub.pipe @hub
  else mhub.pipe @hub
  @value = @hub.get! or {}

  @view = new ldView do
    root: root
    action: input: do
      input: ({node}) ~>
        if opt.raw => ops = json0.diff(@value, JSON.parse(node.value))
        else ops = json0.diff(@value, {str: node.value})
        @hub.ops-out ops
    handler: do
      input: ({node}) ~>
        if opt.raw => node.value = JSON.stringify(@value, null, 2)
        else node.value = @value.str or ''
  @

init = ->
  hub = new datahub scope: <[textarea2]>
  mhub.pipe hub
  new editor name: "editor1", root: '[ld-scope=editor1]', scope: [], raw: true
  new editor name: "editor2", root: '[ld-scope=editor2]', scope: <[textarea1]>
  new editor name: "editor3", root: '[ld-scope=editor3]', hub: hub
  new editor name: "editor4", root: '[ld-scope=editor4]', hub: hub

mhub = if false => new datahub.mem!
else new sharehub {id: \test2, create: -> {textarea1: {str: "hello"}, textarea2: {str: "world"}}}
(if mhub.init => mhub.init! else Promise.resolve!)
  .then -> init!
