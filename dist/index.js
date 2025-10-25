(function(){
  var _json0, datahub, hub, srchub, deshub, memhub, usrhub, hif, ref$, as;
  _json0 = (typeof module != 'undefined' && module !== null) && (typeof require != 'undefined' && require !== null) ? require("@plotdb/json0") : json0;
  datahub = hub = function(opt){
    var this$ = this;
    opt == null && (opt = {});
    this.opt = opt;
    this._id = (datahub._id++) + "/" + Math.random().toString(36).substring(2);
    this._ = {
      evthdr: {},
      src: null,
      scope: opt.scope || [],
      subscriber: []
    };
    if (opt.src) {
      opt.src.pipe(this);
    }
    (opt.subscriber || []).map(function(h){
      return this$.pipe(h);
    });
    this._.state = 'closed';
    this.on('open', function(){
      this$._.subscriber.map(function(h){
        if (h.fire) {
          return h.fire('open');
        }
      });
      return this$._.state = 'opened';
    });
    this.on('close', function(){
      this$._.subscriber.map(function(h){
        if (h.fire) {
          return h.fire('close');
        }
      });
      return this$._.state = 'closed';
    });
    return this;
  };
  datahub.prototype = import$(Object.create(Object.prototype), {
    on: function(n, cb){
      var this$ = this;
      return (Array.isArray(n)
        ? n
        : [n]).map(function(n){
        var ref$;
        return ((ref$ = this$._.evthdr)[n] || (ref$[n] = [])).push(cb);
      });
    },
    fire: function(n){
      var v, res$, i$, to$, ref$, len$, cb, results$ = [];
      res$ = [];
      for (i$ = 1, to$ = arguments.length; i$ < to$; ++i$) {
        res$.push(arguments[i$]);
      }
      v = res$;
      for (i$ = 0, len$ = (ref$ = this._.evthdr[n] || []).length; i$ < len$; ++i$) {
        cb = ref$[i$];
        results$.push(cb.apply(this, v));
      }
      return results$;
    },
    state: function(s){
      var os;
      if (!(s != null)) {
        return this._.state;
      }
      os = this._.state;
      this._.state = s;
      if (os !== s) {
        return this.fire(s === 'opened' ? 'open' : 'close');
      }
    },
    asSrc: function(o){
      var this$ = this;
      return this._.src = {
        get: o.get || function(){},
        opsOut: function(ops){
          return o.opsOut(this$.addon(ops)) || function(){}(this$.addon(ops));
        }
      };
    },
    asDes: function(o){
      return this._.subscriber = [{
        opsIn: o.opsIn || function(){}
      }];
    },
    pipe: function(h){
      if (h._.src) {
        console.warn("a hub is connected with multiple source. cut the previous source anyway.");
        h._.src.cut(h);
      }
      this._.subscriber.push(h);
      h._.src = this;
      if (this._.state === 'opened') {
        h.fire('open');
      }
      return h;
    },
    cut: function(h){
      var idx;
      if (!~(idx = this._.subscriber.indexOf(h))) {
        return;
      }
      this._.subscriber.splice(idx, 1);
      return h.src = null;
    },
    opsIn: function(ops){
      var _id, localize, this$ = this;
      if (ops._id === this._id) {
        return;
      }
      _id = ops._id;
      localize = function(p, s){
        var i$, to$, i;
        for (i$ = 0, to$ = s.length; i$ < to$; ++i$) {
          i = i$;
          if (p[i] !== s[i]) {
            return;
          }
        }
        return p.slice(i + 1);
      };
      if (this._.scope) {
        ops = ops.map(function(it){
          var ref$;
          return ref$ = import$({}, it), ref$.p = localize(it.p, this$._.scope), ref$;
        });
      }
      ops = ops.filter(function(it){
        return it.p != null && it.p.length;
      });
      ops._id = _id;
      if (ops.length) {
        return this._.subscriber.map(function(it){
          return it.opsIn(ops);
        });
      }
    },
    opsOut: function(ops){
      var this$ = this;
      if (!ops._id) {
        ops._id = this._id;
      }
      if (this._.scope) {
        ops.map(function(it){
          return it.p = this$._.scope.concat(it.p);
        });
      }
      return this._.src.opsOut(ops);
    },
    addon: function(ops){
      var _id, opsAddon, data;
      _id = ops._id;
      opsAddon = [];
      data = this.get();
      ops.map(function(op){
        var d, p, i$, to$, i, results$ = [];
        d = data;
        p = [];
        for (i$ = 0, to$ = op.p.length - 1; i$ < to$; ++i$) {
          i = i$;
          p.push(op.p[i]);
          if (!(d[op.p[i]] != null)) {
            opsAddon.push(import$({
              p: JSON.parse(JSON.stringify(p))
            }, i === op.p.length - 1 && op.si
              ? {
                si: ""
              }
              : {
                oi: {}
              }));
          }
          results$.push(d = d[op.p[i]] || {});
        }
        return results$;
      });
      ops = opsAddon.concat(ops);
      ops._id = _id;
      return ops;
    },
    get: function(){
      var d, i$, ref$, len$, n;
      if (!this._.src) {
        return null;
      }
      d = this._.src.get();
      for (i$ = 0, len$ = (ref$ = this._.scope).length; i$ < len$; ++i$) {
        n = ref$[i$];
        if (!d) {
          return null;
        }
        d = d[n];
      }
      return d;
    }
  });
  srchub = function(opt){
    opt == null && (opt = {});
    datahub.call(this, opt);
    this.asSrc({
      opsOut: opt.opsOut || function(){},
      get: opt.get || function(){}
    });
    return this;
  };
  srchub.prototype = import$({}, datahub.prototype);
  deshub = function(opt){
    opt == null && (opt = {});
    datahub.call(this, opt);
    this.asDes({
      opsIn: opt.opsIn
    }) || function(){};
    return this;
  };
  deshub.prototype = import$(Object.create(Object.prototype), datahub.prototype);
  memhub = function(opt){
    var this$ = this;
    opt == null && (opt = {});
    this._data = {};
    srchub.call(this, import$(import$({}, opt), {
      opsOut: function(ops){
        this$._data = _json0.type.apply(this$._data, ops);
        return this$.opsIn(ops);
      },
      get: function(){
        return this$._data;
      }
    }));
    this._.state = 'opened';
    return this;
  };
  memhub.prototype = import$({}, srchub.prototype);
  usrhub = function(opt){
    var this$ = this;
    opt == null && (opt = {});
    deshub.call(this, import$(import$({}, opt), {
      opsIn: function(ops){
        this$._data = this$.get() || {};
        return opt.render(ops);
      }
    }));
    return this;
  };
  usrhub.prototype = import$({}, deshub.prototype);
  hif = function(o){
    var hub, this$ = this;
    o == null && (o = {});
    this._evthdr = {};
    this.data = {};
    this.hub = hub = new datahub.des({
      scope: o.scope || [],
      opsIn: function(ops){
        _json0.type.apply(this$.data, ops);
        return this$.opsIn(ops);
      }
    });
    hub.on('open', function(){
      return this$.fire('open');
    });
    hub.on('close', function(){
      return this$.fire('close');
    });
    this.opsOut = function(ops){
      return hub.opsOut(ops);
    };
    this.get = function(){
      return this$.hub.get() || {};
    };
    this.on('open', function(){
      return this$.data = this$.get();
    });
    return this;
  };
  hif.prototype = (ref$ = Object.create(Object.prototype), ref$.state = function(){
    return this.hub.state();
  }, ref$.opsIn = function(ops){}, ref$.on = function(n, cb){
    var this$ = this;
    return (Array.isArray(n)
      ? n
      : [n]).map(function(n){
      var ref$;
      return ((ref$ = this$._evthdr)[n] || (ref$[n] = [])).push(cb);
    });
  }, ref$.fire = function(n){
    var v, res$, i$, to$, ref$, len$, cb, results$ = [];
    res$ = [];
    for (i$ = 1, to$ = arguments.length; i$ < to$; ++i$) {
      res$.push(arguments[i$]);
    }
    v = res$;
    for (i$ = 0, len$ = (ref$ = this._evthdr[n] || []).length; i$ < len$; ++i$) {
      cb = ref$[i$];
      results$.push(cb.apply(this, v));
    }
    return results$;
  }, ref$);
  as = function(func){
    var ret;
    func.prototype = Object.create(Object.prototype);
    ret = function(){
      var args, res$, i$, to$, obj;
      res$ = [];
      for (i$ = 0, to$ = arguments.length; i$ < to$; ++i$) {
        res$.push(arguments[i$]);
      }
      args = res$;
      obj = Reflect.construct(hif, args, ret);
      func.apply(obj, args);
      return obj;
    };
    Object.setPrototypeOf(ret.prototype, hif.prototype);
    return ret;
  };
  hub.src = srchub;
  hub.des = deshub;
  hub.mem = memhub;
  hub.usr = usrhub;
  hub.as = as;
  hub._id = 0;
  if (typeof module != 'undefined' && module !== null) {
    module.exports = hub;
  } else if (typeof window != 'undefined' && window !== null) {
    window.datahub = hub;
  }
  function import$(obj, src){
    var own = {}.hasOwnProperty;
    for (var key in src) if (own.call(src, key)) obj[key] = src[key];
    return obj;
  }
}).call(this);
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
      timeout: 13000,
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
(function(){
  var _datahub, _json0, tabhub, ref$;
  _datahub = typeof module != 'undefined' && module !== null ? require("./datahub") : datahub;
  _json0 = (typeof module != 'undefined' && module !== null) && (typeof require != 'undefined' && require !== null) ? require("@plotdb/json0") : json0;
  tabhub = function(opt){
    var this$ = this;
    opt == null && (opt = {});
    _datahub.src.call(this, import$(import$({}, opt), {
      opsOut: function(ops){
        _json0.type.apply(this$._.bc.data(), ops);
        return this$._.bc.send({
          ops: ops,
          action: 'ops-out'
        });
      },
      get: function(){
        return this$._.bc.data();
      }
    }));
    this._.bc = new tabhub.broadcaster({
      data: opt.initialData,
      name: opt.channelName,
      hub: this
    });
    return this;
  };
  tabhub.prototype = import$(import$({}, _datahub.src.prototype), {
    connect: function(){
      return this._.bc.init();
    }
  });
  tabhub.broadcaster = function(opt){
    opt == null && (opt = {});
    this._ = {
      id: typeof suuid != 'undefined' && suuid !== null
        ? suuid()
        : Math.random().toString(36).substring(2),
      proxise: {},
      channel: new BroadcastChannel("@plotdb/datahub:" + (opt.name || 'default-channel')),
      data: opt.data || {},
      hub: opt.hub
    };
    return this;
  };
  tabhub.broadcaster.prototype = (ref$ = Object.create(Object.prototype), ref$.data = function(it){
    if (arguments.length) {
      return this._.data = it;
    } else {
      return this._.data;
    }
  }, ref$.request = function(opt){
    var func, ref$, key$, ret, this$ = this;
    opt == null && (opt = {});
    func = !opt.timeout
      ? function(){}
      : function(arg$){
        var action, timeout;
        action = arg$.action, timeout = arg$.timeout;
        return function(){
          return setTimeout(function(){
            var ref$;
            return ((ref$ = this$._.proxise)[action] || (ref$[action] = [])).splice(0).map(function(p){
              return p.resolve();
            });
          }, timeout);
        };
      }(opt);
    ((ref$ = this._.proxise)[key$ = opt.action] || (ref$[key$] = [])).push(ret = proxise(func));
    this._.channel.postMessage((opt.src = this._.id, opt));
    return ret();
  }, ref$.hub = function(){
    return this._.hub;
  }, ref$.send = function(opt){
    opt == null && (opt = {});
    return this._.channel.postMessage((opt.src = this._.id, opt));
  }, ref$.resolve = function(arg$){
    var action;
    action = arg$.action;
    return (this._.proxise[action] || []).splice(0).map(function(p){
      return p.resolve();
    });
  }, ref$.init = function(){
    var this$ = this;
    this._.channel.onmessage = function(evt){
      var ref$, data, ops, action, byAction, src;
      ref$ = evt.data || {}, data = ref$.data, ops = ref$.ops, action = ref$.action, byAction = ref$.byAction, src = ref$.src;
      if (action === 'ops-out') {
        json0.type.apply(this$.data(), ops);
        this$.hub().opsIn(ops);
      } else if (action === 'ops-in') {
        json0.type.apply(this$.data(), ops);
        this$.hub().opsIn(ops);
      } else if (action === 'request-data') {
        this$.send({
          data: this$.data(),
          action: 'data-requested',
          byAction: action,
          des: src
        });
      } else if (action === 'data-requested') {
        this$.data(data);
      }
      if (byAction && broadcaster.proxise[byAction]) {
        return this$.resolve({
          action: byAction
        });
      }
    };
    return this.request({
      action: 'request-data',
      timeout: 100
    });
  }, ref$);
  if (typeof module != 'undefined' && module !== null) {
    module.exports = tabhub;
  } else if (typeof window != 'undefined' && window !== null) {
    window.tabhub = tabhub;
  }
  function import$(obj, src){
    var own = {}.hasOwnProperty;
    for (var key in src) if (own.call(src, key)) obj[key] = src[key];
    return obj;
  }
}).call(this);
