var editor, init, mhub;
editor = function(opt){
  var root, this$ = this;
  opt == null && (opt = {});
  this.opt = opt;
  this.root = root = ld$.find(opt.root, 0);
  this.hub = new datahub.usr({
    scope: opt.scope || [],
    render: function(ops){
      this$.value = json0.type.apply(this$.value, ops);
      return this$.view.render();
    }
  });
  if (opt.hub) {
    opt.hub.pipe(this.hub);
  } else {
    mhub.pipe(this.hub);
  }
  this.value = this.hub.get() || {};
  this.view = new ldView({
    root: root,
    action: {
      input: {
        input: function(arg$){
          var node, ops;
          node = arg$.node;
          if (opt.raw) {
            ops = json0.diff(this$.value, JSON.parse(node.value));
          } else {
            ops = json0.diff(this$.value, {
              str: node.value
            });
          }
          return this$.hub.opsOut(ops);
        }
      }
    },
    handler: {
      input: function(arg$){
        var node;
        node = arg$.node;
        if (opt.raw) {
          return node.value = JSON.stringify(this$.value, null, 2);
        } else {
          return node.value = this$.value.str || '';
        }
      }
    }
  });
  return this;
};
init = function(){
  var hub;
  hub = new datahub({
    scope: ['textarea2']
  });
  mhub.pipe(hub);
  new editor({
    name: "editor1",
    root: '[ld-scope=editor1]',
    scope: [],
    raw: true
  });
  new editor({
    name: "editor2",
    root: '[ld-scope=editor2]',
    scope: ['textarea1']
  });
  new editor({
    name: "editor3",
    root: '[ld-scope=editor3]',
    hub: hub
  });
  return new editor({
    name: "editor4",
    root: '[ld-scope=editor4]',
    hub: hub
  });
};
mhub = false
  ? new datahub.mem()
  : new sharehub({
    id: 'test2',
    create: function(){
      return {
        textarea1: {
          str: "hello"
        },
        textarea2: {
          str: "world"
        }
      };
    }
  });
(mhub.init
  ? mhub.init()
  : Promise.resolve()).then(function(){
  return init();
});