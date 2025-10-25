hub = new tabhub channel-name: 'tabhub-test', initial-data: content: "some simple text"
<- hub.connect!then _
hub.as-des ops-in: -> view.render \textarea

view = new ldview do
  root: document.body
  action: change: textarea: ({node}) ->
    ops = json0.diff hub.get!, {content: node.value}
    hub.ops-out ops
  handler: textarea: ({node}) ->
    node.value = hub.get!content
