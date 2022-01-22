(function(){
  var _json0, datahub, hub, srchub, deshub, memhub, usrhub, hubif, as;
  _json0 = typeof module != 'undefined' && module !== null ? require("@plotdb/json0") : json0;
  datahub = hub = function(opt){
    var this$ = this;
    opt == null && (opt = {});
    this.opt = opt;
    this.scope = opt.scope || [];
    if (opt.src) {
      opt.src.pipe(this);
    }
    this.subscriber = [];
    (opt.subscriber || []).map(function(it){
      return this$.pipe.push(it);
    });
    return this;
  };
  datahub.prototype = import$(Object.create(Object.prototype), {
    asSrc: function(o){
      var this$ = this;
      o == null && (o = {});
      return this.src = {
        get: o.get || function(){},
        opsOut: function(ops){
          return o.opsOut(this$.addon(ops)) || function(){}(this$.addon(ops));
        }
      };
    },
    asDes: function(o){
      return this.subscriber = [{
        opsIn: o.opsIn || function(){}
      }];
    },
    pipe: function(it){
      if (it.src) {
        console.warn("a hub is connected with multiple source. cut the previous source anyway.");
        it.src.cut(it);
      }
      this.subscriber.push(it);
      it.src = this;
      return it;
    },
    cut: function(it){
      var idx;
      if (~(idx = this.subscriber.indexOf(it))) {
        this.subscriber.splice(idx, 1);
        return it.src = null;
      }
    },
    opsIn: function(ops){
      var localize, this$ = this;
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
      if (this.scope) {
        ops = ops.map(function(it){
          var ref$;
          return ref$ = import$({}, it), ref$.p = localize(it.p, this$.scope), ref$;
        });
      }
      ops = ops.filter(function(it){
        return it.p != null;
      });
      if (ops.length) {
        return this.subscriber.map(function(it){
          return it.opsIn(ops);
        });
      }
    },
    opsOut: function(ops){
      var this$ = this;
      if (this.scope) {
        ops.map(function(it){
          return it.p = this$.scope.concat(it.p);
        });
      }
      return this.src.opsOut(ops);
    },
    addon: function(ops){
      var opsAddon, data;
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
      return ops;
    },
    get: function(){
      var d, i$, ref$, len$, n;
      d = this.src.get();
      for (i$ = 0, len$ = (ref$ = this.scope).length; i$ < len$; ++i$) {
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
  deshub.prototype = import$({}, datahub.prototype);
  memhub = function(opt){
    var this$ = this;
    opt == null && (opt = {});
    this.data = {};
    srchub.call(this, import$(import$({}, opt), {
      opsOut: function(ops){
        this$.data = _json0.type.apply(this$.data, ops);
        return this$.opsIn(ops);
      },
      get: function(){
        return JSON.parse(JSON.stringify(this$.data));
      }
    }));
    return this;
  };
  memhub.prototype = import$({}, srchub.prototype);
  usrhub = function(opt){
    var this$ = this;
    opt == null && (opt = {});
    deshub.call(this, import$(import$({}, opt), {
      opsIn: function(ops){
        if (!this$.data) {
          this$.data = this$.get() || {};
        } else {
          _json0.type.apply(this$.data, ops);
        }
        return opt.render(ops);
      }
    }));
    return this;
  };
  usrhub.prototype = import$({}, deshub.prototype);
  hubif = function(opt){
    var this$ = this;
    opt == null && (opt = {});
    this.src = opt.src;
    this.src.pipe(this.hub = new datahub.des({
      opsIn: function(ops){
        return this$.update(ops);
      }
    }));
    this.data = this.hub.get();
    return this;
  };
  hubif.prototype = import$(Object.create(Object.prototype), {
    update: function(ops){
      _json0.type.apply(this.data, ops);
      return this.render();
    },
    render: function(){
      return console.log("render is not implemented");
    }
  });
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
      obj = Reflect.construct(hubif, args, ret);
      func.apply(obj, args);
      return obj;
    };
    Object.setPrototypeOf(ret.prototype, hubif.prototype);
    return ret;
  };
  hub.src = srchub;
  hub.des = deshub;
  hub.mem = memhub;
  hub.usr = usrhub;
  hub.as = as;
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
