ot-json0 = require("ot-json0")
json0-ot-diff = require("json0-ot-diff")
diff-match-patch = require("diff-match-patch")

editor = (opt={}) ->
  @opt = opt
  @root = root = ld$.find(opt.root, 0)
  @value = {}
  @hub = new datahub.usr do
    scope: <[textarea]>
    render: (ops) ~>
      @value = @hub.get!
      @view.render!
  mhub.pipe @hub
  @value = @hub.get! or {}

  @view = new ldView do
    root: root
    action: input: do
      input: ({node}) ~>
        ops = json0-ot-diff(@value, {str: node.value}, diff-match-patch)
        @hub.ops-out ops
    handler: do
      input: ({node}) ~> node.value = @value.str or ''

  @

init = ->
  new editor root: '[ld-scope=editor1]' 
  new editor root: '[ld-scope=editor2]' 

mhub = if false => new datahub.mem!
else new sharehub {id: \sample}
(if mhub.init => mhub.init! else Promise.resolve!)
  .then -> init!
