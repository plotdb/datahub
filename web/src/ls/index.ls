ot-json0 = require("ot-json0")
json0-ot-diff = require("json0-ot-diff")
diff-match-patch = require("diff-match-patch")

editor = (opt={}) ->
  @opt = opt
  @root = root = ld$.find(opt.root, 0)
  @hub = new datahub.usr do
    scope: opt.scope or []
    render: (ops) ~>
      @value = @hub.get!
      @view.render!
  mhub.pipe @hub
  @value = @hub.get! or {}

  @view = new ldView do
    root: root
    action: input: do
      input: ({node}) ~>
        if opt.raw => ops = json0-ot-diff(@value, JSON.parse(node.value), diff-match-patch)
        else ops = json0-ot-diff(@value, {str: node.value}, diff-match-patch)
        @hub.ops-out ops
    handler: do
      input: ({node}) ~>
        if opt.raw => node.value = JSON.stringify(@value, null, 2)
        else node.value = @value.str or ''

  @

init = ->
  new editor root: '[ld-scope=editor1]', scope: [], raw: true
  new editor root: '[ld-scope=editor2]', scope: <[textarea1]>
  #new editor root: '[ld-scope=editor3]', scope: <[textarea2]>
  #new editor root: '[ld-scope=editor4]', scope: <[textarea2]>

mhub = if false => new datahub.mem!
else new sharehub {id: \test2, create: -> {textarea1: {str: "hello"}, textarea2: {str: "world"}}}
(if mhub.init => mhub.init! else Promise.resolve!)
  .then -> init!
