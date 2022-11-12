(function(){
  var hub, sharehub;
  hub = typeof module != 'undefined' && module !== null ? require("./datahub") : datahub;
  sharehub = function(o){
    var this$ = this;
    o == null && (o = {});
    this.evthdr = {};
    this.data = {};
    this.config(o);
    this._initConnect = o.initConnect != null ? o.initConnect : true;
    this._create = o.create || null;
    this._watch = o.watch || null;
    this.ews = o.ews;
    hub.src.call(this, import$(import$({}, o), {
      opsOut: function(ops){
        var _id;
        _id = ops._id;
        this$.doc.submitOp(JSON.parse(JSON.stringify(ops)));
        return this$.opsIn(ops);
      },
      get: function(){
        return this$.data;
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
    config: function(o){
      o == null && (o = {});
      if (o.id != null) {
        this.id = o.id;
      }
      return this.collection = o.collection || 'doc';
    },
    watch: function(ops, src){
      if (this._watch) {
        this._watch(ops, src);
      }
      if (src) {
        return;
      }
      return this.opsIn(ops);
    },
    connect: function(o){
      var force, this$ = this;
      if (o != null) {
        o = typeof o === 'object'
          ? o
          : {
            id: o
          };
      }
      force = !(o != null) || !(o.force != null)
        ? true
        : o.force;
      return Promise.resolve().then(function(){
        if (this$.sdb) {
          return this$.sdb.ensure();
        } else {
          return this$.init();
        }
      }).then(function(){
        if (o != null) {
          this$.config(o);
        }
        if (this$.doc && this$.doc.id === this$.id && this$.doc.collection === this$.collection && (o.force != null && !o.force)) {
          return;
        }
        return (this$.doc
          ? this$.disconnect()
          : Promise.resolve()).then(function(){
          return this$.sdb.get({
            id: this$.id,
            collection: this$.collection,
            create: this$._create
              ? function(){
                return this$._create();
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
          return this$.fire('open');
        });
      });
    },
    disconnect: function(){
      var this$ = this;
      if (!this.doc) {
        return Promise.resolve();
      }
      return new Promise(function(res, rej){
        return this$.doc.destroy(function(){
          this$.doc = null;
          this$.data = null;
          this$.fire('close');
          return res();
        });
      });
    },
    init: function(){
      var this$ = this;
      return Promise.resolve().then(function(){
        var sdb;
        if (this$.sdb) {
          return this$.sdb.ensure();
        }
        this$.sdb = sdb = new ews.sdbClient({
          ws: this$.ews
        });
        sdb.on('error', function(e){
          var ref$;
          if (!((ref$ = this$.evthdr).error || (ref$.error = [])).length) {
            throw e.err;
          } else {
            return this$.fire('error', e.err);
          }
        });
        sdb.on('close', function(){
          return this$.disconnect();
        });
        if (this$.id && this$._initConnect) {
          return this$.connect();
        }
      }).then(function(){
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
