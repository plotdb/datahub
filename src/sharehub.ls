hub = if module? => require("./datahub") else datahub

sharehub = (o={}) ->
  @evthdr = {}
  @data = {}
  @config o
  @_init-connect = if o.init-connect? => o.init-connect else true
  @_create = o.create or null
  @_watch = o.watch or null
  @ews = o.ews
  # o.settle - how long `connect` may wait for the queue to drain on reconnect
  # ( ms ). see `connect` for why this has to be bounded. 0 disables the wait
  # entirely; default 10000.
  @_settle = if o.settle? => o.settle else 10000

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
    untrack: (tid) ~>
      (e) ~>
        if tid => delete watchdog.hash[tid]
        if !e => return
        watchdog.fire!
        @fire \error, e


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
          # `whenNothingPending` waits on a condition only the server can
          # satisfy: it fires when the queue drains, and if the server stops
          # acknowledging ops it never fires at all. Waiting here indefinitely
          # protects nothing - the doc and its pendingOps survive either way,
          # and sharedb keeps retrying on its own - it only prevents the caller
          # from ever learning that the reconnect finished.
          #
          # That is not theoretical. @servebase/connector marks a reconnect in
          # progress with `_running` and clears it when `connect` settles;
          # hanging here left it set forever, so every later disconnection was
          # swallowed at `reopen`'s first line and no cover was ever summoned -
          # socket reported up, nothing retrying, ops going nowhere, and not one
          # thing on screen to say so.
          #
          # So resolve on a timeout too. Draining is the good outcome, not a
          # precondition: the caller gets told the connection is back, and it is
          # the caller's business ( `hasPending` is public ) to decide what to
          # say about a queue that is still full.
          if !@_settle => return Promise.resolve!
          ret = new Promise (res, rej) ~>
            hdr = setTimeout (~> hdr := null; res!), @_settle
            @doc.whenNothingPending ~>
              if !hdr => return
              clearTimeout hdr
              hdr := null
              res!
          # connect should only resolve if connection is good
          # while it may be good even if there are pending ops (after waited for settle sce)
          # connection might already drop during waiting, so we check it again.
          ret.then ~>
            if @doc?connection?state != \connected => return lderror.reject 1011
            if @ews.status! != 2 => return lderror.reject 1011

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
