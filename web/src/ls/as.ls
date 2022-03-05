form = datahub.as (opt = {}) ->
  @id = opt.id or 0
  @

form.prototype <<< 
  ops-in: (ops) ->
    json0.type.apply @_data, ops
    @render!
  update: (v) -> 
    if @state! == \closed => return
    key = "form-#{@id}"
    /* manaually craft ops */
    
    ops = []
    if @_data and @_data[key] => ops.push {p: [key], od: @_data[key]}
    ops.push {p: [key], oi: v}
    #@ops-out ops
    @_data[key] = v
    /* auto generate ops */
    ops = json0.diff(@data, @_data)
    # we have to ignore source ops in ops-in but no ways to do this. so we revert change instead for now.
    #json0.type.apply @_data, json0.type.invert(ops)
    @ops-out ops

  render: -> @view.render!
  init: ({node}) ->
    @view = new ldview do
      root: node
      action: input: input: ({node}) ~>
        @update node.value
        @render!
      handler: output: ({node}) ~>
        node.value = JSON.stringify(@_data or {}, ' ', 2)
    @on \open, ->
      @_data = JSON.parse(JSON.stringify(@data))
      @render!
    if @state! == \opened =>
      @_data = JSON.parse(JSON.stringify(@data))
      @render!

ctrl = do
  init: ->
    @src = new datahub.mem!
    @src.ops-out [{p: 'hi', oi: 'hello'}]
    @forms = [0 to 2].map ~> new form {id: it, scope: <[test]>}
    @forms.forEach ~> @src.pipe it.hub

    @view = view = new ldView do
      root: document.body
      handler: do
        form:
          list: ~> @forms
          init: ({node,data}) -> data.init {node}

ctrl.init!
