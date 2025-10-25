(function(){
  var _datahub, _json0, tabhub, inlineProxise, ref$;
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
  inlineProxise = function(func, lc){
    var f, ref$;
    lc == null && (lc = {});
    return f = (ref$ = function(){
      func();
      return new Promise(function(res, rej){
        return lc.res = res, lc.rej = rej, lc;
      });
    }, ref$.resolve = function(){
      return lc.res();
    }, ref$);
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
    ((ref$ = this._.proxise)[key$ = opt.action] || (ref$[key$] = [])).push(ret = inlineProxise(func));
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
      if (byAction && this$._.proxise[byAction]) {
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
