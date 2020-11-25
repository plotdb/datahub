var otJson0, json0OtDiff, diffMatchPatch, editor, init, mhub;
otJson0 = require("ot-json0");
json0OtDiff = require("json0-ot-diff");
diffMatchPatch = require("diff-match-patch");
editor = function(opt){
  var root, this$ = this;
  opt == null && (opt = {});
  this.opt = opt;
  this.root = root = ld$.find(opt.root, 0);
  this.hub = new datahub.usr({
    scope: opt.scope || [],
    render: function(ops){
      this$.value = this$.hub.get();
      return this$.view.render();
    }
  });
  mhub.pipe(this.hub);
  this.value = this.hub.get() || {};
  this.view = new ldView({
    root: root,
    action: {
      input: {
        input: function(arg$){
          var node, ops;
          node = arg$.node;
          if (opt.raw) {
            ops = json0OtDiff(this$.value, JSON.parse(node.value), diffMatchPatch);
          } else {
            ops = json0OtDiff(this$.value, {
              str: node.value
            }, diffMatchPatch);
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
  new editor({
    root: '[ld-scope=editor1]',
    scope: [],
    raw: true
  });
  return new editor({
    root: '[ld-scope=editor2]',
    scope: ['textarea1']
  });
};
mhub = false
  ? new datahub.mem()
  : new sharehub({
    id: 'sample'
  });
(mhub.init
  ? mhub.init()
  : Promise.resolve()).then(function(){
  return init();
});