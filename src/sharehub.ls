hub = if module? => require("./datahub") else datahub

sharehub = (o={}) ->
  @evthdr = {}
  @data = {}
  @config o
  @_init-connect = if o.init-connect? => o.init-connect else true
  @_create = o.create or null
  @_watch = o.watch or null
  @ews = o.ews

  watchdog =
    timeout: 13000
    count: 0, hash: {}, hdr: null
    fire: ~>
      if watchdog.hdr =>
        clearTimeout watchdog.hdr
        watchdog.hdr = null
      if @ews and @ews.disconnect and @ews.status and @ews.status! == 2 => @ews.disconnect!
      watchdog.hash = {}
    check: ->
      [now, min] = [Date.now!, -1]
      for k,v of @hash =>
        if (now - v) >= @timeout => return @fire!
        if min < 0 or (@timeout - (now - v)) < min => min = ((@timeout - (now - v)) >? 0)
      if @hdr =>
        clearTimeout @hdr
        @hdr = null
      if min >= 0 => @hdr = setTimeout (~>@check!), min
    track: ~>
      if @ews and @ews.status and @ews.status! != 2 => return 0
      tid = ++watchdog.count
      watchdog.hash[tid] = Date.now!
      if !watchdog.hdr => watchdog.hdr = setTimeout((~>watchdog.check!), watchdog.timeout)
      return tid
    untrack: (tid) ->
      if !tid => return (->)
      (e) ~> if e => @fire! else delete @hash[tid]

  hub.src.call @, {} <<< o <<< do
    ops-out: (ops) ~>
      _id = ops._id
      # NOTE: we used to do this:
      #     if @ews.status! != 2 => return
      # this online check is no longer needed - when offline, submitOp queues ops
      # into sharedb doc's pendingOps and they are flushed after reconnect.
      # watchdog.track already returns 0 (untracked) when offline,
      # which is correct since there is no ack to wait for.
      # DATA: we only have to apply if we decide to make a clone of remote obj when init
      #@data = json0.type.apply @data, ops
      tid = watchdog.track!
      @doc.submitOp JSON.parse(JSON.stringify(ops)), watchdog.untrack(tid)
      # reflect to other subtree in hub
      @ops-in ops
    get: ~> @data
  @

sharehub.prototype = {} <<< hub.src.prototype <<< do
  on: (n, cb) -> @evthdr.[][n].push cb
  fire: (n, ...v) -> for cb in (@evthdr[n] or []) => cb.apply @, v
  config: (o = {}) ->
    if o.id? => @id = o.id
    @collection = o.collection or \doc
  watch: (ops, src) ->
    # apply ops only if not source.
    # if we are src, it has been applied when before submitOp
    # we already ops-in when ops-out for local event.
    # this is necessary since we have to track origin hub by _id
    if @_watch => @_watch ops, src
    if src => return
    # DATA: We have to apply if we clone data when connecting.
    #if !src => @data = json0.type.apply @data, ops
    @ops-in ops

  connect: (o) ->
    if o? => o = (if typeof(o) == \object => o else {id: o})
    force = !!(o? and o.force)
    Promise.resolve!
      .then ~> if @sdb => @sdb.ensure! else @init!
      .then ~>
        if o? => @config o
        # same doc: it survived disconnection with pendingOps intact.
        # after bindToSocket (done in sdb.ensure), sharedb resubscribes
        # (catch-up by version) and flushes pending / inflight ops
        # (deduped by src/seq on server) by itself.
        # here we only wait until local and remote converge.
        # pass {force: true} to explicitly discard the doc and refetch.
        if !force and
           @doc and
           @doc.id == @id and
           @doc.collection == @collection =>
          return new Promise (res) ~> @doc.whenNothingPending res
        (if @doc => @disconnect! else Promise.resolve!)
          .then ~>
            @sdb.get do
              id: @id
              collection: @collection
              create: if @_create => (~> @_create!) else (->{})
              watch: (...args) ~> @watch.apply @, args
          .then (doc) ~>
            # DATA: We pass raw data now, but if we want to clone:
            # @data = JSON.parse(JSON.stringify(doc.data))
            @ <<< doc: doc, data: doc.data
            @fire \open

  disconnect: ->
    if !@doc => return Promise.resolve!
    (res, rej) <~ new Promise _
    <~ @doc.destroy _
    @ <<< {doc: null, data: null}
    @fire \close
    res!

  init: ->
    Promise.resolve!
      .then ~>
        if @sdb => return @sdb.ensure!
        @sdb = sdb = new ews.sdb-client ws: @ews
        sdb.on \error, (e) ~>
          if !@evthdr.[]error.length => throw e.err
          else @fire \error, e.err
        # NOTE: we used to `@disconnect!` here, which destroys doc along with
        # its pendingOps - any offline edit was lost. doc must survive
        # disconnection; sharedb resyncs it after reconnect (bindToSocket).
        sdb.on \close, ~> @fire \suspend
        if @id and @_init-connect => @connect!
      .then ~> {sdb: @sdb}

if module? => module.exports = sharehub
else if window? => window.sharehub = sharehub
