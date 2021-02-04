form = datahub.as (opt={}) -> 
  @id = opt.id or 0
  @

form.prototype <<< do
  do-update: (v) -> 
    data = JSON.parse(JSON.stringify(@data))
    data["form-#{@id}"] = v
    ret = json0.diff @data, data
    @src.ops-out ret
  render: -> @view.render!
  init: ({node}) ->
    @view = new ldView do
      root: node
      action: input: input: ({node}) ~> @do-update node.value
      handler: output: ({node}) ~> node.value = JSON.stringify(@data, ' ', 2)

ctrl = do
  init: ->
    @src = new datahub.mem!
    @src.ops-out [{p: 'hi', oi: 'hello'}]
    @forms = [0 to 2].map ~> new form {src: @src, id: it}

    @view = view = new ldView do
      root: document.body
      handler: do
        form:
          list: ~> @forms
          init: ({node,data}) -> data.init {node}

ctrl.init!
