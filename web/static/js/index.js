var json0, json0OtDiff, diffMatchPatch, editor, init, mhub;
json0 = require("ot-json0");
json0OtDiff = require("json0-ot-diff");
diffMatchPatch = require("diff-match-patch");
editor = function(opt){
  var root, this$ = this;
  opt == null && (opt = {});
  this.opt = opt;
  this.root = root = ld$.find(opt.root, 0);
  this.value = {};
  this.hub = new usrhub({
    scope: ['textarea'],
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
          ops = json0OtDiff(this$.value, {
            str: node.value
          }, diffMatchPatch);
          return this$.hub.opsOut(ops);
        }
      }
    },
    handler: {
      input: function(arg$){
        var node;
        node = arg$.node;
        return node.value = this$.value.str || '';
      }
    }
  });
  return this;
};
init = function(){
  new editor({
    root: '[ld-scope=editor1]'
  });
  return new editor({
    root: '[ld-scope=editor2]'
  });
};
mhub = false
  ? new memhub()
  : new sharehub({
    id: 'sample'
  });
(mhub.init
  ? mhub.init()
  : Promise.resolve()).then(function(){
  return init();
});