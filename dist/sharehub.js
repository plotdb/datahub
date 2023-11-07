(function(){
  var hub, sharehub;
  hub = typeof module != 'undefined' && module !== null ? require("./datahub") : datahub;
  sharehub = function(o){
    var watchdog, this$ = this;
    o == null && (o = {});
    this.evthdr = {};
    this.data = {};
    this.config(o);
    this._initConnect = o.initConnect != null ? o.initConnect : true;
    this._create = o.create || null;
    this._watch = o.watch || null;
    this.ews = o.ews;
    watchdog = {
      timeout: 20000,
      count: 0,
      hash: {},
      hdr: null,
      fire: function(){
        if (watchdog.hdr) {
          clearTimeout(watchdog.hdr);
          watchdog.hdr = null;
        }
        if (this$.ews && this$.ews.disconnect && this$.ews.status && this$.ews.status() === 2) {
          this$.ews.disconnect();
        }
        return watchdog.hash = {};
      },
      check: function(){
        var ref$, now, min, k, v, ref1$, this$ = this;
        ref$ = [Date.now(), -1], now = ref$[0], min = ref$[1];
        for (k in ref$ = this.hash) {
          v = ref$[k];
          if (now - v >= this.timeout) {
            return this.fire();
          }
          if (min < 0 || this.timeout - (now - v) < min) {
            min = (ref1$ = this.timeout - (now - v)) > 0 ? ref1$ : 0;
          }
        }
        if (this.hdr) {
          clearTimeout(this.hdr);
          this.hdr = null;
        }
        if (min >= 0) {
          return this.hdr = setTimeout(function(){
            return this$.check();
          }, min);
        }
      },
      track: function(){
        var tid;
        if (this$.ews && this$.ews.status && this$.ews.status() !== 2) {
          return 0;
        }
        tid = ++watchdog.count;
        watchdog.hash[tid] = Date.now();
        if (!watchdog.hdr) {
          watchdog.hdr = setTimeout(function(){
            return watchdog.check();
          }, watchdog.timeout);
        }
        return tid;
      },
      untrack: function(tid){
        var this$ = this;
        if (!tid) {
          return function(){};
        }
        return function(e){
          var ref$, ref1$;
          if (e) {
            return this$.fire();
          } else {
            return ref1$ = (ref$ = this$.hash)[tid], delete ref$[tid], ref1$;
          }
        };
      }
    };
    hub.src.call(this, import$(import$({}, o), {
      opsOut: function(ops){
        var _id, tid;
        if (this$.ews.status() !== 2) {
          return;
        }
        _id = ops._id;
        tid = watchdog.track();
        this$.doc.submitOp(JSON.parse(JSON.stringify(ops)), watchdog.untrack(tid));
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
