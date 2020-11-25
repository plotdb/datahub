// Generated by LiveScript 1.6.0
(function(){
  var hub, sharehub;
  hub = typeof require != 'undefined' && require !== null ? require("./datahub") : datahub;
  sharehub = function(opt){
    var this$ = this;
    opt == null && (opt = {});
    this.data = {};
    this.id = opt.id || '';
    hub.src.call(this, import$(import$({}, opt), {
      opsOut: function(ops){
        this$.data = json0.type.apply(this$.data, ops);
        return this$.doc.submitOp(JSON.parse(JSON.stringify(ops)));
      },
      get: function(){
        return JSON.parse(JSON.stringify(this$.data));
      }
    }));
    return this;
  };
  sharehub.prototype = import$(import$({}, hub.src.prototype), {
    watch: function(ops, opt){
      return this.opsIn(JSON.parse(JSON.stringify(ops)));
    },
    init: function(){
      var this$ = this;
      return Promise.resolve().then(function(){
        var sdb;
        sdb = new sharedbWrapper({
          url: window.location.protocol.replace(':', '')
        }, window.location.domain);
        return sdb.get({
          id: this$.id,
          watch: function(){
            var args, res$, i$, to$;
            res$ = [];
            for (i$ = 0, to$ = arguments.length; i$ < to$; ++i$) {
              res$.push(arguments[i$]);
            }
            args = res$;
            return this$.watch.apply(this$, args);
          }
        });
      }).then(function(doc){
        this$.doc = doc;
        return this$.data = JSON.parse(JSON.stringify(this$.doc.data));
      });
    }
  });
  if (typeof module != 'undefined' && module !== null) {
    module.exports = sharehub;
  } else if (typeof window != 'undefined' && window !== null) {
    window.sharehub = sharehub;
  }
  function import$(obj, src){
    var own = {}.hasOwnProperty;
    for (var key in src) if (own.call(src, key)) obj[key] = src[key];
    return obj;
  }
}).call(this);
