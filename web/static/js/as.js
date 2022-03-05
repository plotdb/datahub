var form, ref$, ctrl;
form = datahub.as(function(opt){
  opt == null && (opt = {});
  this.id = opt.id || 0;
  return this;
});
ref$ = form.prototype;
ref$.opsIn = function(ops){
  json0.type.apply(this._data, ops);
  return this.render();
};
ref$.update = function(v){
  var key, ops;
  if (this.state() === 'closed') {
    return;
  }
  key = "form-" + this.id;
  /* manaually craft ops */
  ops = [];
  if (this._data && this._data[key]) {
    ops.push({
      p: [key],
      od: this._data[key]
    });
  }
  ops.push({
    p: [key],
    oi: v
  });
  this._data[key] = v;
  /* auto generate ops */
  ops = json0.diff(this.data, this._data);
  return this.opsOut(ops);
};
ref$.render = function(){
  return this.view.render();
};
ref$.init = function(arg$){
  var node, this$ = this;
  node = arg$.node;
  this.view = new ldview({
    root: node,
    action: {
      input: {
        input: function(arg$){
          var node;
          node = arg$.node;
          this$.update(node.value);
          return this$.render();
        }
      }
    },
    handler: {
      output: function(arg$){
        var node;
        node = arg$.node;
        return node.value = JSON.stringify(this$._data || {}, ' ', 2);
      }
    }
  });
  this.on('open', function(){
    this._data = JSON.parse(JSON.stringify(this.data));
    return this.render();
  });
  if (this.state() === 'opened') {
    this._data = JSON.parse(JSON.stringify(this.data));
    return this.render();
  }
};
ctrl = {
  init: function(){
    var view, this$ = this;
    this.src = new datahub.mem();
    this.src.opsOut([{
      p: 'hi',
      oi: 'hello'
    }]);
    this.forms = [0, 1, 2].map(function(it){
      return new form({
        id: it,
        scope: ['test']
      });
    });
    this.forms.forEach(function(it){
      return this$.src.pipe(it.hub);
    });
    return this.view = view = new ldView({
      root: document.body,
      handler: {
        form: {
          list: function(){
            return this$.forms;
          },
          init: function(arg$){
            var node, data;
            node = arg$.node, data = arg$.data;
            return data.init({
              node: node
            });
          }
        }
      }
    });
  }
};
ctrl.init();