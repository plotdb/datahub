var form, ctrl;
form = datahub.as(function(opt){
  opt == null && (opt = {});
  this.id = opt.id || 0;
  return this;
});
import$(form.prototype, {
  doUpdate: function(v){
    var data, ret;
    data = JSON.parse(JSON.stringify(this.data));
    data["form-" + this.id] = v;
    ret = json0.diff(this.data, data);
    return this.src.opsOut(ret);
  },
  render: function(){
    return this.view.render();
  },
  init: function(arg$){
    var node, this$ = this;
    node = arg$.node;
    return this.view = new ldView({
      root: node,
      action: {
        input: {
          input: function(arg$){
            var node;
            node = arg$.node;
            return this$.doUpdate(node.value);
          }
        }
      },
      handler: {
        output: function(arg$){
          var node;
          node = arg$.node;
          return node.value = JSON.stringify(this$.data, ' ', 2);
        }
      }
    });
  }
});
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
        src: this$.src,
        id: it
      });
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
function import$(obj, src){
  var own = {}.hasOwnProperty;
  for (var key in src) if (own.call(src, key)) obj[key] = src[key];
  return obj;
}