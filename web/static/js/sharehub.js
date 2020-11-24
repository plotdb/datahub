/* to be removed */
var sharehub;
sharehub = function(opt){
  opt == null && (opt = {});
  this.data = {};
  return this;
};
sharehub.prototype = import$(Object.create(Object.prototype), {
  pipe: function(it){
    this.hub.pipe(it);
    return it.adopt(this.hub);
  },
  cut: function(){
    return this.hub.pipe(cut);
  },
  watch: function(ops){
    return this.hub.opsIn(JSON.parse(JSON.stringify(ops)));
  },
  init: function(){
    var ldld, sdb, this$ = this;
    this.ldld = ldld = new ldLoader({
      className: 'full ldld'
    });
    ldld.on();
    sdb = new sharedbWrapper({
      url: window.location.protocol.replace(':', '')
    }, window.location.domain);
    return sdb.get({
      id: 'sample',
      watch: function(it){
        return this$.watch(it);
      }
    }).then(function(doc){
      this$.doc = doc;
      this$.data = JSON.parse(JSON.stringify(this$.doc.data));
      this$.hub = new hub();
      this$.hub.get = function(){
        return this$.data;
      };
      return this$.hub.opsOut = function(ops){
        var opsAddon;
        opsAddon = [];
        ops.map(function(op){
          var d, p, i$, to$, i, results$ = [];
          d = this$.data;
          p = [];
          for (i$ = 0, to$ = op.p.length - 1; i$ < to$; ++i$) {
            i = i$;
            p.push(op.p[i]);
            if (!d[op.p[i]]) {
              opsAddon.push({
                p: JSON.parse(JSON.stringify(p)),
                oi: {}
              });
            }
            results$.push(d = d[op.p[i]] || {});
          }
          return results$;
        });
        ops = opsAddon.concat(ops);
        ops = JSON.parse(JSON.stringify(ops));
        this$.data = json0.type.apply(this$.data, ops);
        return this$.doc.submitOp(ops);
      };
    }).then(function(){
      return ldld.off();
    });
  }
});
function import$(obj, src){
  var own = {}.hasOwnProperty;
  for (var key in src) if (own.call(src, key)) obj[key] = src[key];
  return obj;
}