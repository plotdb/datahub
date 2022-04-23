(function(){
  var hub, sharehub;
  hub = typeof module != 'undefined' && module !== null ? require("./datahub") : datahub;
  sharehub = function(opt){
    var this$ = this;
    opt == null && (opt = {});
    this.evthdr = {};
    this.data = {};
    this.id = opt.id || '';
    this.create = opt.create || null;
    this.ews = opt.ews;
    hub.src.call(this, import$(import$({}, opt), {
      opsOut: function(ops){
        var _id;
        _id = ops._id;
        this$.doc.submitOp(JSON.parse(JSON.stringify(ops)));
        return this$.opsIn(ops);
      },
      get: function(){
        return JSON.parse(JSON.stringify(this$.data));
      }
    }));
    return this;
  };
  sharehub.prototype = import$(import$({}, hub.src.prototype), {
    on: function(n, cb){
      var ref$;
      return ((ref$ = this.evthdr)[n] || (ref$[n] = [])).push(cb);
    },
    fire: function(n){
      var v, res$, i$, to$, ref$, len$, cb, results$ = [];
      res$ = [];
      for (i$ = 1, to$ = arguments.length; i$ < to$; ++i$) {
        res$.push(arguments[i$]);
      }
      v = res$;
      for (i$ = 0, len$ = (ref$ = this.evthdr[n] || []).length; i$ < len$; ++i$) {
        cb = ref$[i$];
        results$.push(cb.apply(this, v));
      }
      return results$;
    },
    watch: function(ops, src){
      if (src) {
        return;
      }
      if (!src) {
        this.data = json0.type.apply(this.data, ops);
      }
      return this.opsIn(ops);
    },
    init: function(){
      var this$ = this;
      return Promise.resolve().then(function(){
        var sdb;
        this$.sdb = sdb = new ews.sdbClient({
          ws: this$.ews
        });
        sdb.on('error', function(e){
          var ref$;
          if (!((ref$ = this$.evthdr).error || (ref$.error = [])).length) {
            return console.error(e.err);
          } else {
            return this$.fire('error', e.err);
          }
        });
        return sdb.get({
          id: this$.id,
          create: this$.create
            ? function(){
              return this$.create();
            }
            : function(){
              return {};
            },
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
        this$.data = doc.data;
        return {
          sdb: this$.sdb
        };
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
