var Pt = (u, v) => () => (v || (u((v = { exports: {} }).exports, v), u = null), v.exports), wh = /* @__PURE__ */ Pt(((u) => {
  function v(G, O) {
    var V = G.length;
    G.push(O);
    e: for (; 0 < V; ) {
      var ye = V - 1 >>> 1, Ee = G[ye];
      if (0 < d(Ee, O)) G[ye] = O, G[V] = Ee, V = ye;
      else break e;
    }
  }
  function T(G) {
    return G.length === 0 ? null : G[0];
  }
  function r(G) {
    if (G.length === 0) return null;
    var O = G[0], V = G.pop();
    if (V !== O) {
      G[0] = V;
      e: for (var ye = 0, Ee = G.length, $e = Ee >>> 1; ye < $e; ) {
        var m = 2 * (ye + 1) - 1, U = G[m], X = m + 1, $ = G[X];
        if (0 > d(U, V)) X < Ee && 0 > d($, U) ? (G[ye] = $, G[X] = V, ye = X) : (G[ye] = U, G[m] = V, ye = m);
        else if (X < Ee && 0 > d($, V)) G[ye] = $, G[X] = V, ye = X;
        else break e;
      }
    }
    return O;
  }
  function d(G, O) {
    var V = G.sortIndex - O.sortIndex;
    return V !== 0 ? V : G.id - O.id;
  }
  if (u.unstable_now = void 0, typeof performance == "object" && typeof performance.now == "function") {
    var j = performance;
    u.unstable_now = function() {
      return j.now();
    };
  } else {
    var Y = Date, k = Y.now();
    u.unstable_now = function() {
      return Y.now() - k;
    };
  }
  var q = [], _ = [], E = 1, Z = null, H = 3, ae = !1, de = !1, L = !1, I = !1, ne = typeof setTimeout == "function" ? setTimeout : null, K = typeof clearTimeout == "function" ? clearTimeout : null, ce = typeof setImmediate < "u" ? setImmediate : null;
  function B(G) {
    for (var O = T(_); O !== null; ) {
      if (O.callback === null) r(_);
      else if (O.startTime <= G) r(_), O.sortIndex = O.expirationTime, v(q, O);
      else break;
      O = T(_);
    }
  }
  function P(G) {
    if (L = !1, B(G), !de) if (T(q) !== null) de = !0, W || (W = !0, be());
    else {
      var O = T(_);
      O !== null && Q(P, O.startTime - G);
    }
  }
  var W = !1, pe = -1, ie = 5, J = -1;
  function b() {
    return I ? !0 : !(u.unstable_now() - J < ie);
  }
  function te() {
    if (I = !1, W) {
      var G = u.unstable_now();
      J = G;
      var O = !0;
      try {
        e: {
          de = !1, L && (L = !1, K(pe), pe = -1), ae = !0;
          var V = H;
          try {
            t: {
              for (B(G), Z = T(q); Z !== null && !(Z.expirationTime > G && b()); ) {
                var ye = Z.callback;
                if (typeof ye == "function") {
                  Z.callback = null, H = Z.priorityLevel;
                  var Ee = ye(Z.expirationTime <= G);
                  if (G = u.unstable_now(), typeof Ee == "function") {
                    Z.callback = Ee, B(G), O = !0;
                    break t;
                  }
                  Z === T(q) && r(q), B(G);
                } else r(q);
                Z = T(q);
              }
              if (Z !== null) O = !0;
              else {
                var $e = T(_);
                $e !== null && Q(P, $e.startTime - G), O = !1;
              }
            }
            break e;
          } finally {
            Z = null, H = V, ae = !1;
          }
          O = void 0;
        }
      } finally {
        O ? be() : W = !1;
      }
    }
  }
  var be;
  if (typeof ce == "function") be = function() {
    ce(te);
  };
  else if (typeof MessageChannel < "u") {
    var Te = new MessageChannel(), x = Te.port2;
    Te.port1.onmessage = te, be = function() {
      x.postMessage(null);
    };
  } else be = function() {
    ne(te, 0);
  };
  function Q(G, O) {
    pe = ne(function() {
      G(u.unstable_now());
    }, O);
  }
  u.unstable_IdlePriority = 5, u.unstable_ImmediatePriority = 1, u.unstable_LowPriority = 4, u.unstable_NormalPriority = 3, u.unstable_Profiling = null, u.unstable_UserBlockingPriority = 2, u.unstable_cancelCallback = function(G) {
    G.callback = null;
  }, u.unstable_forceFrameRate = function(G) {
    0 > G || 125 < G ? console.error("forceFrameRate takes a positive int between 0 and 125, forcing frame rates higher than 125 fps is not supported") : ie = 0 < G ? Math.floor(1e3 / G) : 5;
  }, u.unstable_getCurrentPriorityLevel = function() {
    return H;
  }, u.unstable_next = function(G) {
    switch (H) {
      case 1:
      case 2:
      case 3:
        var O = 3;
        break;
      default:
        O = H;
    }
    var V = H;
    H = O;
    try {
      return G();
    } finally {
      H = V;
    }
  }, u.unstable_requestPaint = function() {
    I = !0;
  }, u.unstable_runWithPriority = function(G, O) {
    switch (G) {
      case 1:
      case 2:
      case 3:
      case 4:
      case 5:
        break;
      default:
        G = 3;
    }
    var V = H;
    H = G;
    try {
      return O();
    } finally {
      H = V;
    }
  }, u.unstable_scheduleCallback = function(G, O, V) {
    var ye = u.unstable_now();
    switch (typeof V == "object" && V !== null ? (V = V.delay, V = typeof V == "number" && 0 < V ? ye + V : ye) : V = ye, G) {
      case 1:
        var Ee = -1;
        break;
      case 2:
        Ee = 250;
        break;
      case 5:
        Ee = 1073741823;
        break;
      case 4:
        Ee = 1e4;
        break;
      default:
        Ee = 5e3;
    }
    return Ee = V + Ee, G = {
      id: E++,
      callback: O,
      priorityLevel: G,
      startTime: V,
      expirationTime: Ee,
      sortIndex: -1
    }, V > ye ? (G.sortIndex = V, v(_, G), T(q) === null && G === T(_) && (L ? (K(pe), pe = -1) : L = !0, Q(P, V - ye))) : (G.sortIndex = Ee, v(q, G), de || ae || (de = !0, W || (W = !0, be()))), G;
  }, u.unstable_shouldYield = b, u.unstable_wrapCallback = function(G) {
    var O = H;
    return function() {
      var V = H;
      H = O;
      try {
        return G.apply(this, arguments);
      } finally {
        H = V;
      }
    };
  };
})), Eh = /* @__PURE__ */ Pt(((u, v) => {
  v.exports = wh();
})), Th = /* @__PURE__ */ Pt(((u) => {
  var v = /* @__PURE__ */ Symbol.for("react.transitional.element"), T = /* @__PURE__ */ Symbol.for("react.portal"), r = /* @__PURE__ */ Symbol.for("react.fragment"), d = /* @__PURE__ */ Symbol.for("react.strict_mode"), j = /* @__PURE__ */ Symbol.for("react.profiler"), Y = /* @__PURE__ */ Symbol.for("react.consumer"), k = /* @__PURE__ */ Symbol.for("react.context"), q = /* @__PURE__ */ Symbol.for("react.forward_ref"), _ = /* @__PURE__ */ Symbol.for("react.suspense"), E = /* @__PURE__ */ Symbol.for("react.memo"), Z = /* @__PURE__ */ Symbol.for("react.lazy"), H = /* @__PURE__ */ Symbol.for("react.activity"), ae = Symbol.iterator;
  function de(m) {
    return m === null || typeof m != "object" ? null : (m = ae && m[ae] || m["@@iterator"], typeof m == "function" ? m : null);
  }
  var L = {
    isMounted: function() {
      return !1;
    },
    enqueueForceUpdate: function() {
    },
    enqueueReplaceState: function() {
    },
    enqueueSetState: function() {
    }
  }, I = Object.assign, ne = {};
  function K(m, U, X) {
    this.props = m, this.context = U, this.refs = ne, this.updater = X || L;
  }
  K.prototype.isReactComponent = {}, K.prototype.setState = function(m, U) {
    if (typeof m != "object" && typeof m != "function" && m != null) throw Error("takes an object of state variables to update or a function which returns an object of state variables.");
    this.updater.enqueueSetState(this, m, U, "setState");
  }, K.prototype.forceUpdate = function(m) {
    this.updater.enqueueForceUpdate(this, m, "forceUpdate");
  };
  function ce() {
  }
  ce.prototype = K.prototype;
  function B(m, U, X) {
    this.props = m, this.context = U, this.refs = ne, this.updater = X || L;
  }
  var P = B.prototype = new ce();
  P.constructor = B, I(P, K.prototype), P.isPureReactComponent = !0;
  var W = Array.isArray;
  function pe() {
  }
  var ie = {
    H: null,
    A: null,
    T: null,
    S: null
  }, J = Object.prototype.hasOwnProperty;
  function b(m, U, X) {
    var $ = X.ref;
    return {
      $$typeof: v,
      type: m,
      key: U,
      ref: $ !== void 0 ? $ : null,
      props: X
    };
  }
  function te(m, U) {
    return b(m.type, U, m.props);
  }
  function be(m) {
    return typeof m == "object" && m !== null && m.$$typeof === v;
  }
  function Te(m) {
    var U = {
      "=": "=0",
      ":": "=2"
    };
    return "$" + m.replace(/[=:]/g, function(X) {
      return U[X];
    });
  }
  var x = /\/+/g;
  function Q(m, U) {
    return typeof m == "object" && m !== null && m.key != null ? Te("" + m.key) : U.toString(36);
  }
  function G(m) {
    switch (m.status) {
      case "fulfilled":
        return m.value;
      case "rejected":
        throw m.reason;
      default:
        switch (typeof m.status == "string" ? m.then(pe, pe) : (m.status = "pending", m.then(function(U) {
          m.status === "pending" && (m.status = "fulfilled", m.value = U);
        }, function(U) {
          m.status === "pending" && (m.status = "rejected", m.reason = U);
        })), m.status) {
          case "fulfilled":
            return m.value;
          case "rejected":
            throw m.reason;
        }
    }
    throw m;
  }
  function O(m, U, X, $, fe) {
    var me = typeof m;
    (me === "undefined" || me === "boolean") && (m = null);
    var he = !1;
    if (m === null) he = !0;
    else switch (me) {
      case "bigint":
      case "string":
      case "number":
        he = !0;
        break;
      case "object":
        switch (m.$$typeof) {
          case v:
          case T:
            he = !0;
            break;
          case Z:
            return he = m._init, O(he(m._payload), U, X, $, fe);
        }
    }
    if (he) return fe = fe(m), he = $ === "" ? "." + Q(m, 0) : $, W(fe) ? (X = "", he != null && (X = he.replace(x, "$&/") + "/"), O(fe, U, X, "", function(Ze) {
      return Ze;
    })) : fe != null && (be(fe) && (fe = te(fe, X + (fe.key == null || m && m.key === fe.key ? "" : ("" + fe.key).replace(x, "$&/") + "/") + he)), U.push(fe)), 1;
    he = 0;
    var Me = $ === "" ? "." : $ + ":";
    if (W(m)) for (var xe = 0; xe < m.length; xe++) $ = m[xe], me = Me + Q($, xe), he += O($, U, X, me, fe);
    else if (xe = de(m), typeof xe == "function") for (m = xe.call(m), xe = 0; !($ = m.next()).done; ) $ = $.value, me = Me + Q($, xe++), he += O($, U, X, me, fe);
    else if (me === "object") {
      if (typeof m.then == "function") return O(G(m), U, X, $, fe);
      throw U = String(m), Error("Objects are not valid as a React child (found: " + (U === "[object Object]" ? "object with keys {" + Object.keys(m).join(", ") + "}" : U) + "). If you meant to render a collection of children, use an array instead.");
    }
    return he;
  }
  function V(m, U, X) {
    if (m == null) return m;
    var $ = [], fe = 0;
    return O(m, $, "", "", function(me) {
      return U.call(X, me, fe++);
    }), $;
  }
  function ye(m) {
    if (m._status === -1) {
      var U = m._result;
      U = U(), U.then(function(X) {
        (m._status === 0 || m._status === -1) && (m._status = 1, m._result = X);
      }, function(X) {
        (m._status === 0 || m._status === -1) && (m._status = 2, m._result = X);
      }), m._status === -1 && (m._status = 0, m._result = U);
    }
    if (m._status === 1) return m._result.default;
    throw m._result;
  }
  var Ee = typeof reportError == "function" ? reportError : function(m) {
    if (typeof window == "object" && typeof window.ErrorEvent == "function") {
      var U = new window.ErrorEvent("error", {
        bubbles: !0,
        cancelable: !0,
        message: typeof m == "object" && m !== null && typeof m.message == "string" ? String(m.message) : String(m),
        error: m
      });
      if (!window.dispatchEvent(U)) return;
    } else if (typeof process == "object" && typeof process.emit == "function") {
      process.emit("uncaughtException", m);
      return;
    }
    console.error(m);
  }, $e = {
    map: V,
    forEach: function(m, U, X) {
      V(m, function() {
        U.apply(this, arguments);
      }, X);
    },
    count: function(m) {
      var U = 0;
      return V(m, function() {
        U++;
      }), U;
    },
    toArray: function(m) {
      return V(m, function(U) {
        return U;
      }) || [];
    },
    only: function(m) {
      if (!be(m)) throw Error("React.Children.only expected to receive a single React element child.");
      return m;
    }
  };
  u.Activity = H, u.Children = $e, u.Component = K, u.Fragment = r, u.Profiler = j, u.PureComponent = B, u.StrictMode = d, u.Suspense = _, u.__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE = ie, u.__COMPILER_RUNTIME = {
    __proto__: null,
    c: function(m) {
      return ie.H.useMemoCache(m);
    }
  }, u.cache = function(m) {
    return function() {
      return m.apply(null, arguments);
    };
  }, u.cacheSignal = function() {
    return null;
  }, u.cloneElement = function(m, U, X) {
    if (m == null) throw Error("The argument must be a React element, but you passed " + m + ".");
    var $ = I({}, m.props), fe = m.key;
    if (U != null) for (me in U.key !== void 0 && (fe = "" + U.key), U) !J.call(U, me) || me === "key" || me === "__self" || me === "__source" || me === "ref" && U.ref === void 0 || ($[me] = U[me]);
    var me = arguments.length - 2;
    if (me === 1) $.children = X;
    else if (1 < me) {
      for (var he = Array(me), Me = 0; Me < me; Me++) he[Me] = arguments[Me + 2];
      $.children = he;
    }
    return b(m.type, fe, $);
  }, u.createContext = function(m) {
    return m = {
      $$typeof: k,
      _currentValue: m,
      _currentValue2: m,
      _threadCount: 0,
      Provider: null,
      Consumer: null
    }, m.Provider = m, m.Consumer = {
      $$typeof: Y,
      _context: m
    }, m;
  }, u.createElement = function(m, U, X) {
    var $, fe = {}, me = null;
    if (U != null) for ($ in U.key !== void 0 && (me = "" + U.key), U) J.call(U, $) && $ !== "key" && $ !== "__self" && $ !== "__source" && (fe[$] = U[$]);
    var he = arguments.length - 2;
    if (he === 1) fe.children = X;
    else if (1 < he) {
      for (var Me = Array(he), xe = 0; xe < he; xe++) Me[xe] = arguments[xe + 2];
      fe.children = Me;
    }
    if (m && m.defaultProps) for ($ in he = m.defaultProps, he) fe[$] === void 0 && (fe[$] = he[$]);
    return b(m, me, fe);
  }, u.createRef = function() {
    return { current: null };
  }, u.forwardRef = function(m) {
    return {
      $$typeof: q,
      render: m
    };
  }, u.isValidElement = be, u.lazy = function(m) {
    return {
      $$typeof: Z,
      _payload: {
        _status: -1,
        _result: m
      },
      _init: ye
    };
  }, u.memo = function(m, U) {
    return {
      $$typeof: E,
      type: m,
      compare: U === void 0 ? null : U
    };
  }, u.startTransition = function(m) {
    var U = ie.T, X = {};
    ie.T = X;
    try {
      var $ = m(), fe = ie.S;
      fe !== null && fe(X, $), typeof $ == "object" && $ !== null && typeof $.then == "function" && $.then(pe, Ee);
    } catch (me) {
      Ee(me);
    } finally {
      U !== null && X.types !== null && (U.types = X.types), ie.T = U;
    }
  }, u.unstable_useCacheRefresh = function() {
    return ie.H.useCacheRefresh();
  }, u.use = function(m) {
    return ie.H.use(m);
  }, u.useActionState = function(m, U, X) {
    return ie.H.useActionState(m, U, X);
  }, u.useCallback = function(m, U) {
    return ie.H.useCallback(m, U);
  }, u.useContext = function(m) {
    return ie.H.useContext(m);
  }, u.useDebugValue = function() {
  }, u.useDeferredValue = function(m, U) {
    return ie.H.useDeferredValue(m, U);
  }, u.useEffect = function(m, U) {
    return ie.H.useEffect(m, U);
  }, u.useEffectEvent = function(m) {
    return ie.H.useEffectEvent(m);
  }, u.useId = function() {
    return ie.H.useId();
  }, u.useImperativeHandle = function(m, U, X) {
    return ie.H.useImperativeHandle(m, U, X);
  }, u.useInsertionEffect = function(m, U) {
    return ie.H.useInsertionEffect(m, U);
  }, u.useLayoutEffect = function(m, U) {
    return ie.H.useLayoutEffect(m, U);
  }, u.useMemo = function(m, U) {
    return ie.H.useMemo(m, U);
  }, u.useOptimistic = function(m, U) {
    return ie.H.useOptimistic(m, U);
  }, u.useReducer = function(m, U, X) {
    return ie.H.useReducer(m, U, X);
  }, u.useRef = function(m) {
    return ie.H.useRef(m);
  }, u.useState = function(m) {
    return ie.H.useState(m);
  }, u.useSyncExternalStore = function(m, U, X) {
    return ie.H.useSyncExternalStore(m, U, X);
  }, u.useTransition = function() {
    return ie.H.useTransition();
  }, u.version = "19.2.6";
})), Wu = /* @__PURE__ */ Pt(((u, v) => {
  v.exports = Th();
})), Ah = /* @__PURE__ */ Pt(((u) => {
  var v = Wu();
  function T(_) {
    var E = "https://react.dev/errors/" + _;
    if (1 < arguments.length) {
      E += "?args[]=" + encodeURIComponent(arguments[1]);
      for (var Z = 2; Z < arguments.length; Z++) E += "&args[]=" + encodeURIComponent(arguments[Z]);
    }
    return "Minified React error #" + _ + "; visit " + E + " for the full message or use the non-minified dev environment for full errors and additional helpful warnings.";
  }
  function r() {
  }
  var d = {
    d: {
      f: r,
      r: function() {
        throw Error(T(522));
      },
      D: r,
      C: r,
      L: r,
      m: r,
      X: r,
      S: r,
      M: r
    },
    p: 0,
    findDOMNode: null
  }, j = /* @__PURE__ */ Symbol.for("react.portal");
  function Y(_, E, Z) {
    var H = 3 < arguments.length && arguments[3] !== void 0 ? arguments[3] : null;
    return {
      $$typeof: j,
      key: H == null ? null : "" + H,
      children: _,
      containerInfo: E,
      implementation: Z
    };
  }
  var k = v.__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE;
  function q(_, E) {
    if (_ === "font") return "";
    if (typeof E == "string") return E === "use-credentials" ? E : "";
  }
  u.__DOM_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE = d, u.createPortal = function(_, E) {
    var Z = 2 < arguments.length && arguments[2] !== void 0 ? arguments[2] : null;
    if (!E || E.nodeType !== 1 && E.nodeType !== 9 && E.nodeType !== 11) throw Error(T(299));
    return Y(_, E, null, Z);
  }, u.flushSync = function(_) {
    var E = k.T, Z = d.p;
    try {
      if (k.T = null, d.p = 2, _) return _();
    } finally {
      k.T = E, d.p = Z, d.d.f();
    }
  }, u.preconnect = function(_, E) {
    typeof _ == "string" && (E ? (E = E.crossOrigin, E = typeof E == "string" ? E === "use-credentials" ? E : "" : void 0) : E = null, d.d.C(_, E));
  }, u.prefetchDNS = function(_) {
    typeof _ == "string" && d.d.D(_);
  }, u.preinit = function(_, E) {
    if (typeof _ == "string" && E && typeof E.as == "string") {
      var Z = E.as, H = q(Z, E.crossOrigin), ae = typeof E.integrity == "string" ? E.integrity : void 0, de = typeof E.fetchPriority == "string" ? E.fetchPriority : void 0;
      Z === "style" ? d.d.S(_, typeof E.precedence == "string" ? E.precedence : void 0, {
        crossOrigin: H,
        integrity: ae,
        fetchPriority: de
      }) : Z === "script" && d.d.X(_, {
        crossOrigin: H,
        integrity: ae,
        fetchPriority: de,
        nonce: typeof E.nonce == "string" ? E.nonce : void 0
      });
    }
  }, u.preinitModule = function(_, E) {
    if (typeof _ == "string") if (typeof E == "object" && E !== null) {
      if (E.as == null || E.as === "script") {
        var Z = q(E.as, E.crossOrigin);
        d.d.M(_, {
          crossOrigin: Z,
          integrity: typeof E.integrity == "string" ? E.integrity : void 0,
          nonce: typeof E.nonce == "string" ? E.nonce : void 0
        });
      }
    } else E ?? d.d.M(_);
  }, u.preload = function(_, E) {
    if (typeof _ == "string" && typeof E == "object" && E !== null && typeof E.as == "string") {
      var Z = E.as, H = q(Z, E.crossOrigin);
      d.d.L(_, Z, {
        crossOrigin: H,
        integrity: typeof E.integrity == "string" ? E.integrity : void 0,
        nonce: typeof E.nonce == "string" ? E.nonce : void 0,
        type: typeof E.type == "string" ? E.type : void 0,
        fetchPriority: typeof E.fetchPriority == "string" ? E.fetchPriority : void 0,
        referrerPolicy: typeof E.referrerPolicy == "string" ? E.referrerPolicy : void 0,
        imageSrcSet: typeof E.imageSrcSet == "string" ? E.imageSrcSet : void 0,
        imageSizes: typeof E.imageSizes == "string" ? E.imageSizes : void 0,
        media: typeof E.media == "string" ? E.media : void 0
      });
    }
  }, u.preloadModule = function(_, E) {
    if (typeof _ == "string") if (E) {
      var Z = q(E.as, E.crossOrigin);
      d.d.m(_, {
        as: typeof E.as == "string" && E.as !== "script" ? E.as : void 0,
        crossOrigin: Z,
        integrity: typeof E.integrity == "string" ? E.integrity : void 0
      });
    } else d.d.m(_);
  }, u.requestFormReset = function(_) {
    d.d.r(_);
  }, u.unstable_batchedUpdates = function(_, E) {
    return _(E);
  }, u.useFormState = function(_, E, Z) {
    return k.H.useFormState(_, E, Z);
  }, u.useFormStatus = function() {
    return k.H.useHostTransitionStatus();
  }, u.version = "19.2.6";
})), Ch = /* @__PURE__ */ Pt(((u, v) => {
  function T() {
    if (!(typeof __REACT_DEVTOOLS_GLOBAL_HOOK__ > "u" || typeof __REACT_DEVTOOLS_GLOBAL_HOOK__.checkDCE != "function"))
      try {
        __REACT_DEVTOOLS_GLOBAL_HOOK__.checkDCE(T);
      } catch (r) {
        console.error(r);
      }
  }
  T(), v.exports = Ah();
})), Mh = /* @__PURE__ */ Pt(((u) => {
  var v = Eh(), T = Wu(), r = Ch();
  function d(e) {
    var t = "https://react.dev/errors/" + e;
    if (1 < arguments.length) {
      t += "?args[]=" + encodeURIComponent(arguments[1]);
      for (var l = 2; l < arguments.length; l++) t += "&args[]=" + encodeURIComponent(arguments[l]);
    }
    return "Minified React error #" + e + "; visit " + t + " for the full message or use the non-minified dev environment for full errors and additional helpful warnings.";
  }
  function j(e) {
    return !(!e || e.nodeType !== 1 && e.nodeType !== 9 && e.nodeType !== 11);
  }
  function Y(e) {
    var t = e, l = e;
    if (e.alternate) for (; t.return; ) t = t.return;
    else {
      e = t;
      do
        t = e, (t.flags & 4098) !== 0 && (l = t.return), e = t.return;
      while (e);
    }
    return t.tag === 3 ? l : null;
  }
  function k(e) {
    if (e.tag === 13) {
      var t = e.memoizedState;
      if (t === null && (e = e.alternate, e !== null && (t = e.memoizedState)), t !== null) return t.dehydrated;
    }
    return null;
  }
  function q(e) {
    if (e.tag === 31) {
      var t = e.memoizedState;
      if (t === null && (e = e.alternate, e !== null && (t = e.memoizedState)), t !== null) return t.dehydrated;
    }
    return null;
  }
  function _(e) {
    if (Y(e) !== e) throw Error(d(188));
  }
  function E(e) {
    var t = e.alternate;
    if (!t) {
      if (t = Y(e), t === null) throw Error(d(188));
      return t !== e ? null : e;
    }
    for (var l = e, a = t; ; ) {
      var i = l.return;
      if (i === null) break;
      var s = i.alternate;
      if (s === null) {
        if (a = i.return, a !== null) {
          l = a;
          continue;
        }
        break;
      }
      if (i.child === s.child) {
        for (s = i.child; s; ) {
          if (s === l) return _(i), e;
          if (s === a) return _(i), t;
          s = s.sibling;
        }
        throw Error(d(188));
      }
      if (l.return !== a.return) l = i, a = s;
      else {
        for (var c = !1, o = i.child; o; ) {
          if (o === l) {
            c = !0, l = i, a = s;
            break;
          }
          if (o === a) {
            c = !0, a = i, l = s;
            break;
          }
          o = o.sibling;
        }
        if (!c) {
          for (o = s.child; o; ) {
            if (o === l) {
              c = !0, l = s, a = i;
              break;
            }
            if (o === a) {
              c = !0, a = s, l = i;
              break;
            }
            o = o.sibling;
          }
          if (!c) throw Error(d(189));
        }
      }
      if (l.alternate !== a) throw Error(d(190));
    }
    if (l.tag !== 3) throw Error(d(188));
    return l.stateNode.current === l ? e : t;
  }
  function Z(e) {
    var t = e.tag;
    if (t === 5 || t === 26 || t === 27 || t === 6) return e;
    for (e = e.child; e !== null; ) {
      if (t = Z(e), t !== null) return t;
      e = e.sibling;
    }
    return null;
  }
  var H = Object.assign, ae = /* @__PURE__ */ Symbol.for("react.element"), de = /* @__PURE__ */ Symbol.for("react.transitional.element"), L = /* @__PURE__ */ Symbol.for("react.portal"), I = /* @__PURE__ */ Symbol.for("react.fragment"), ne = /* @__PURE__ */ Symbol.for("react.strict_mode"), K = /* @__PURE__ */ Symbol.for("react.profiler"), ce = /* @__PURE__ */ Symbol.for("react.consumer"), B = /* @__PURE__ */ Symbol.for("react.context"), P = /* @__PURE__ */ Symbol.for("react.forward_ref"), W = /* @__PURE__ */ Symbol.for("react.suspense"), pe = /* @__PURE__ */ Symbol.for("react.suspense_list"), ie = /* @__PURE__ */ Symbol.for("react.memo"), J = /* @__PURE__ */ Symbol.for("react.lazy"), b = /* @__PURE__ */ Symbol.for("react.activity"), te = /* @__PURE__ */ Symbol.for("react.memo_cache_sentinel"), be = Symbol.iterator;
  function Te(e) {
    return e === null || typeof e != "object" ? null : (e = be && e[be] || e["@@iterator"], typeof e == "function" ? e : null);
  }
  var x = /* @__PURE__ */ Symbol.for("react.client.reference");
  function Q(e) {
    if (e == null) return null;
    if (typeof e == "function") return e.$$typeof === x ? null : e.displayName || e.name || null;
    if (typeof e == "string") return e;
    switch (e) {
      case I:
        return "Fragment";
      case K:
        return "Profiler";
      case ne:
        return "StrictMode";
      case W:
        return "Suspense";
      case pe:
        return "SuspenseList";
      case b:
        return "Activity";
    }
    if (typeof e == "object") switch (e.$$typeof) {
      case L:
        return "Portal";
      case B:
        return e.displayName || "Context";
      case ce:
        return (e._context.displayName || "Context") + ".Consumer";
      case P:
        var t = e.render;
        return e = e.displayName, e || (e = t.displayName || t.name || "", e = e !== "" ? "ForwardRef(" + e + ")" : "ForwardRef"), e;
      case ie:
        return t = e.displayName || null, t !== null ? t : Q(e.type) || "Memo";
      case J:
        t = e._payload, e = e._init;
        try {
          return Q(e(t));
        } catch {
        }
    }
    return null;
  }
  var G = Array.isArray, O = T.__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE, V = r.__DOM_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE, ye = {
    pending: !1,
    data: null,
    method: null,
    action: null
  }, Ee = [], $e = -1;
  function m(e) {
    return { current: e };
  }
  function U(e) {
    0 > $e || (e.current = Ee[$e], Ee[$e] = null, $e--);
  }
  function X(e, t) {
    $e++, Ee[$e] = e.current, e.current = t;
  }
  var $ = m(null), fe = m(null), me = m(null), he = m(null);
  function Me(e, t) {
    switch (X(me, t), X(fe, e), X($, null), t.nodeType) {
      case 9:
      case 11:
        e = (e = t.documentElement) && (e = e.namespaceURI) ? yf(e) : 0;
        break;
      default:
        if (e = t.tagName, t = t.namespaceURI) t = yf(t), e = jf(t, e);
        else switch (e) {
          case "svg":
            e = 1;
            break;
          case "math":
            e = 2;
            break;
          default:
            e = 0;
        }
    }
    U($), X($, e);
  }
  function xe() {
    U($), U(fe), U(me);
  }
  function Ze(e) {
    e.memoizedState !== null && X(he, e);
    var t = $.current, l = jf(t, e.type);
    t !== l && (X(fe, e), X($, l));
  }
  function ht(e) {
    fe.current === e && (U($), U(fe)), he.current === e && (U(he), Kn._currentValue = ye);
  }
  var ke, jl;
  function nt(e) {
    if (ke === void 0) try {
      throw Error();
    } catch (l) {
      var t = l.stack.trim().match(/\n( *(at )?)/);
      ke = t && t[1] || "", jl = -1 < l.stack.indexOf(`
    at`) ? " (<anonymous>)" : -1 < l.stack.indexOf("@") ? "@unknown:0:0" : "";
    }
    return `
` + ke + e + jl;
  }
  var It = !1;
  function h(e, t) {
    if (!e || It) return "";
    It = !0;
    var l = Error.prepareStackTrace;
    Error.prepareStackTrace = void 0;
    try {
      var a = { DetermineComponentFrameRoot: function() {
        try {
          if (t) {
            var R = function() {
              throw Error();
            };
            if (Object.defineProperty(R.prototype, "props", { set: function() {
              throw Error();
            } }), typeof Reflect == "object" && Reflect.construct) {
              try {
                Reflect.construct(R, []);
              } catch (A) {
                var N = A;
              }
              Reflect.construct(e, [], R);
            } else {
              try {
                R.call();
              } catch (A) {
                N = A;
              }
              e.call(R.prototype);
            }
          } else {
            try {
              throw Error();
            } catch (A) {
              N = A;
            }
            (R = e()) && typeof R.catch == "function" && R.catch(function() {
            });
          }
        } catch (A) {
          if (A && N && typeof A.stack == "string") return [A.stack, N.stack];
        }
        return [null, null];
      } };
      a.DetermineComponentFrameRoot.displayName = "DetermineComponentFrameRoot";
      var i = Object.getOwnPropertyDescriptor(a.DetermineComponentFrameRoot, "name");
      i && i.configurable && Object.defineProperty(a.DetermineComponentFrameRoot, "name", { value: "DetermineComponentFrameRoot" });
      var s = a.DetermineComponentFrameRoot(), c = s[0], o = s[1];
      if (c && o) {
        var p = c.split(`
`), z = o.split(`
`);
        for (i = a = 0; a < p.length && !p[a].includes("DetermineComponentFrameRoot"); ) a++;
        for (; i < z.length && !z[i].includes("DetermineComponentFrameRoot"); ) i++;
        if (a === p.length || i === z.length) for (a = p.length - 1, i = z.length - 1; 1 <= a && 0 <= i && p[a] !== z[i]; ) i--;
        for (; 1 <= a && 0 <= i; a--, i--) if (p[a] !== z[i]) {
          if (a !== 1 || i !== 1) do
            if (a--, i--, 0 > i || p[a] !== z[i]) {
              var C = `
` + p[a].replace(" at new ", " at ");
              return e.displayName && C.includes("<anonymous>") && (C = C.replace("<anonymous>", e.displayName)), C;
            }
          while (1 <= a && 0 <= i);
          break;
        }
      }
    } finally {
      It = !1, Error.prepareStackTrace = l;
    }
    return (l = e ? e.displayName || e.name : "") ? nt(l) : "";
  }
  function F(e, t) {
    switch (e.tag) {
      case 26:
      case 27:
      case 5:
        return nt(e.type);
      case 16:
        return nt("Lazy");
      case 13:
        return e.child !== t && t !== null ? nt("Suspense Fallback") : nt("Suspense");
      case 19:
        return nt("SuspenseList");
      case 0:
      case 15:
        return h(e.type, !1);
      case 11:
        return h(e.type.render, !1);
      case 1:
        return h(e.type, !0);
      case 31:
        return nt("Activity");
      default:
        return "";
    }
  }
  function _e(e) {
    try {
      var t = "", l = null;
      do
        t += F(e, l), l = e, e = e.return;
      while (e);
      return t;
    } catch (a) {
      return `
Error generating stack: ` + a.message + `
` + a.stack;
    }
  }
  var Xt = Object.prototype.hasOwnProperty, w = v.unstable_scheduleCallback, Le = v.unstable_cancelCallback, Pe = v.unstable_shouldYield, Mt = v.unstable_requestPaint, De = v.unstable_now, el = v.unstable_getCurrentPriorityLevel, Sl = v.unstable_ImmediatePriority, f = v.unstable_UserBlockingPriority, se = v.unstable_NormalPriority, oe = v.unstable_LowPriority, ut = v.unstable_IdlePriority, zt = v.log, Qt = v.unstable_setDisableYieldValue, zl = null, Ke = null;
  function Nl(e) {
    if (typeof zt == "function" && Qt(e), Ke && typeof Ke.setStrictMode == "function") try {
      Ke.setStrictMode(zl, e);
    } catch {
    }
  }
  var Nt = Math.clz32 ? Math.clz32 : bp, gp = Math.log, vp = Math.LN2;
  function bp(e) {
    return e >>>= 0, e === 0 ? 32 : 31 - (gp(e) / vp | 0) | 0;
  }
  var ti = 256, li = 262144, ai = 4194304;
  function Jl(e) {
    var t = e & 42;
    if (t !== 0) return t;
    switch (e & -e) {
      case 1:
        return 1;
      case 2:
        return 2;
      case 4:
        return 4;
      case 8:
        return 8;
      case 16:
        return 16;
      case 32:
        return 32;
      case 64:
        return 64;
      case 128:
        return 128;
      case 256:
      case 512:
      case 1024:
      case 2048:
      case 4096:
      case 8192:
      case 16384:
      case 32768:
      case 65536:
      case 131072:
        return e & 261888;
      case 262144:
      case 524288:
      case 1048576:
      case 2097152:
        return e & 3932160;
      case 4194304:
      case 8388608:
      case 16777216:
      case 33554432:
        return e & 62914560;
      case 67108864:
        return 67108864;
      case 134217728:
        return 134217728;
      case 268435456:
        return 268435456;
      case 536870912:
        return 536870912;
      case 1073741824:
        return 0;
      default:
        return e;
    }
  }
  function ni(e, t, l) {
    var a = e.pendingLanes;
    if (a === 0) return 0;
    var i = 0, s = e.suspendedLanes, c = e.pingedLanes;
    e = e.warmLanes;
    var o = a & 134217727;
    return o !== 0 ? (a = o & ~s, a !== 0 ? i = Jl(a) : (c &= o, c !== 0 ? i = Jl(c) : l || (l = o & ~e, l !== 0 && (i = Jl(l))))) : (o = a & ~s, o !== 0 ? i = Jl(o) : c !== 0 ? i = Jl(c) : l || (l = a & ~e, l !== 0 && (i = Jl(l)))), i === 0 ? 0 : t !== 0 && t !== i && (t & s) === 0 && (s = i & -i, l = t & -t, s >= l || s === 32 && (l & 4194048) !== 0) ? t : i;
  }
  function sn(e, t) {
    return (e.pendingLanes & ~(e.suspendedLanes & ~e.pingedLanes) & t) === 0;
  }
  function yp(e, t) {
    switch (e) {
      case 1:
      case 2:
      case 4:
      case 8:
      case 64:
        return t + 250;
      case 16:
      case 32:
      case 128:
      case 256:
      case 512:
      case 1024:
      case 2048:
      case 4096:
      case 8192:
      case 16384:
      case 32768:
      case 65536:
      case 131072:
      case 262144:
      case 524288:
      case 1048576:
      case 2097152:
        return t + 5e3;
      case 4194304:
      case 8388608:
      case 16777216:
      case 33554432:
        return -1;
      case 67108864:
      case 134217728:
      case 268435456:
      case 536870912:
      case 1073741824:
        return -1;
      default:
        return -1;
    }
  }
  function eo() {
    var e = ai;
    return ai <<= 1, (ai & 62914560) === 0 && (ai = 4194304), e;
  }
  function Ns(e) {
    for (var t = [], l = 0; 31 > l; l++) t.push(e);
    return t;
  }
  function ii(e, t) {
    e.pendingLanes |= t, t !== 268435456 && (e.suspendedLanes = 0, e.pingedLanes = 0, e.warmLanes = 0);
  }
  function jp(e, t, l, a, i, s) {
    var c = e.pendingLanes;
    e.pendingLanes = l, e.suspendedLanes = 0, e.pingedLanes = 0, e.warmLanes = 0, e.expiredLanes &= l, e.entangledLanes &= l, e.errorRecoveryDisabledLanes &= l, e.shellSuspendCounter = 0;
    var o = e.entanglements, p = e.expirationTimes, z = e.hiddenUpdates;
    for (l = c & ~l; 0 < l; ) {
      var C = 31 - Nt(l), R = 1 << C;
      o[C] = 0, p[C] = -1;
      var N = z[C];
      if (N !== null) for (z[C] = null, C = 0; C < N.length; C++) {
        var A = N[C];
        A !== null && (A.lane &= -536870913);
      }
      l &= ~R;
    }
    a !== 0 && to(e, a, 0), s !== 0 && i === 0 && e.tag !== 0 && (e.suspendedLanes |= s & ~(c & ~t));
  }
  function to(e, t, l) {
    e.pendingLanes |= t, e.suspendedLanes &= ~t;
    var a = 31 - Nt(t);
    e.entangledLanes |= t, e.entanglements[a] = e.entanglements[a] | 1073741824 | l & 261930;
  }
  function lo(e, t) {
    var l = e.entangledLanes |= t;
    for (e = e.entanglements; l; ) {
      var a = 31 - Nt(l), i = 1 << a;
      i & t | e[a] & t && (e[a] |= t), l &= ~i;
    }
  }
  function ao(e, t) {
    var l = t & -t;
    return l = (l & 42) !== 0 ? 1 : no(l), (l & (e.suspendedLanes | t)) !== 0 ? 0 : l;
  }
  function no(e) {
    switch (e) {
      case 2:
        e = 1;
        break;
      case 8:
        e = 4;
        break;
      case 32:
        e = 16;
        break;
      case 256:
      case 512:
      case 1024:
      case 2048:
      case 4096:
      case 8192:
      case 16384:
      case 32768:
      case 65536:
      case 131072:
      case 262144:
      case 524288:
      case 1048576:
      case 2097152:
      case 4194304:
      case 8388608:
      case 16777216:
      case 33554432:
        e = 128;
        break;
      case 268435456:
        e = 134217728;
        break;
      default:
        e = 0;
    }
    return e;
  }
  function _s(e) {
    return e &= -e, 2 < e ? 8 < e ? (e & 134217727) !== 0 ? 32 : 268435456 : 8 : 2;
  }
  function io() {
    var e = V.p;
    return e !== 0 ? e : (e = window.event, e === void 0 ? 32 : Yf(e.type));
  }
  function so(e, t) {
    var l = V.p;
    try {
      return V.p = e, t();
    } finally {
      V.p = l;
    }
  }
  var _l = Math.random().toString(36).slice(2), ot = "__reactFiber$" + _l, xt = "__reactProps$" + _l, cn = "__reactContainer$" + _l, ws = "__reactEvents$" + _l, Sp = "__reactListeners$" + _l, zp = "__reactHandles$" + _l, co = "__reactResources$" + _l, un = "__reactMarker$" + _l;
  function Es(e) {
    delete e[ot], delete e[xt], delete e[ws], delete e[Sp], delete e[zp];
  }
  function xa(e) {
    var t = e[ot];
    if (t) return t;
    for (var l = e.parentNode; l; ) {
      if (t = l[cn] || l[ot]) {
        if (l = t.alternate, t.child !== null || l !== null && l.child !== null) for (e = Tf(e); e !== null; ) {
          if (l = e[ot]) return l;
          e = Tf(e);
        }
        return t;
      }
      e = l, l = e.parentNode;
    }
    return null;
  }
  function ga(e) {
    if (e = e[ot] || e[cn]) {
      var t = e.tag;
      if (t === 5 || t === 6 || t === 13 || t === 31 || t === 26 || t === 27 || t === 3) return e;
    }
    return null;
  }
  function on(e) {
    var t = e.tag;
    if (t === 5 || t === 26 || t === 27 || t === 6) return e.stateNode;
    throw Error(d(33));
  }
  function va(e) {
    var t = e[co];
    return t || (t = e[co] = {
      hoistableStyles: /* @__PURE__ */ new Map(),
      hoistableScripts: /* @__PURE__ */ new Map()
    }), t;
  }
  function st(e) {
    e[un] = !0;
  }
  var uo = /* @__PURE__ */ new Set(), oo = {};
  function Il(e, t) {
    ba(e, t), ba(e + "Capture", t);
  }
  function ba(e, t) {
    for (oo[e] = t, e = 0; e < t.length; e++) uo.add(t[e]);
  }
  var Np = RegExp("^[:A-Z_a-z\\u00C0-\\u00D6\\u00D8-\\u00F6\\u00F8-\\u02FF\\u0370-\\u037D\\u037F-\\u1FFF\\u200C-\\u200D\\u2070-\\u218F\\u2C00-\\u2FEF\\u3001-\\uD7FF\\uF900-\\uFDCF\\uFDF0-\\uFFFD][:A-Z_a-z\\u00C0-\\u00D6\\u00D8-\\u00F6\\u00F8-\\u02FF\\u0370-\\u037D\\u037F-\\u1FFF\\u200C-\\u200D\\u2070-\\u218F\\u2C00-\\u2FEF\\u3001-\\uD7FF\\uF900-\\uFDCF\\uFDF0-\\uFFFD\\-.0-9\\u00B7\\u0300-\\u036F\\u203F-\\u2040]*$"), ro = {}, fo = {};
  function _p(e) {
    return Xt.call(fo, e) ? !0 : Xt.call(ro, e) ? !1 : Np.test(e) ? fo[e] = !0 : (ro[e] = !0, !1);
  }
  function si(e, t, l) {
    if (_p(t)) if (l === null) e.removeAttribute(t);
    else {
      switch (typeof l) {
        case "undefined":
        case "function":
        case "symbol":
          e.removeAttribute(t);
          return;
        case "boolean":
          var a = t.toLowerCase().slice(0, 5);
          if (a !== "data-" && a !== "aria-") {
            e.removeAttribute(t);
            return;
          }
      }
      e.setAttribute(t, "" + l);
    }
  }
  function ci(e, t, l) {
    if (l === null) e.removeAttribute(t);
    else {
      switch (typeof l) {
        case "undefined":
        case "function":
        case "symbol":
        case "boolean":
          e.removeAttribute(t);
          return;
      }
      e.setAttribute(t, "" + l);
    }
  }
  function tl(e, t, l, a) {
    if (a === null) e.removeAttribute(l);
    else {
      switch (typeof a) {
        case "undefined":
        case "function":
        case "symbol":
        case "boolean":
          e.removeAttribute(l);
          return;
      }
      e.setAttributeNS(t, l, "" + a);
    }
  }
  function Ot(e) {
    switch (typeof e) {
      case "bigint":
      case "boolean":
      case "number":
      case "string":
      case "undefined":
        return e;
      case "object":
        return e;
      default:
        return "";
    }
  }
  function po(e) {
    var t = e.type;
    return (e = e.nodeName) && e.toLowerCase() === "input" && (t === "checkbox" || t === "radio");
  }
  function wp(e, t, l) {
    var a = Object.getOwnPropertyDescriptor(e.constructor.prototype, t);
    if (!e.hasOwnProperty(t) && typeof a < "u" && typeof a.get == "function" && typeof a.set == "function") {
      var i = a.get, s = a.set;
      return Object.defineProperty(e, t, {
        configurable: !0,
        get: function() {
          return i.call(this);
        },
        set: function(c) {
          l = "" + c, s.call(this, c);
        }
      }), Object.defineProperty(e, t, { enumerable: a.enumerable }), {
        getValue: function() {
          return l;
        },
        setValue: function(c) {
          l = "" + c;
        },
        stopTracking: function() {
          e._valueTracker = null, delete e[t];
        }
      };
    }
  }
  function Ts(e) {
    if (!e._valueTracker) {
      var t = po(e) ? "checked" : "value";
      e._valueTracker = wp(e, t, "" + e[t]);
    }
  }
  function ho(e) {
    if (!e) return !1;
    var t = e._valueTracker;
    if (!t) return !0;
    var l = t.getValue(), a = "";
    return e && (a = po(e) ? e.checked ? "true" : "false" : e.value), e = a, e !== l ? (t.setValue(e), !0) : !1;
  }
  function ui(e) {
    if (e = e || (typeof document < "u" ? document : void 0), typeof e > "u") return null;
    try {
      return e.activeElement || e.body;
    } catch {
      return e.body;
    }
  }
  var Ep = /[\n"\\]/g;
  function kt(e) {
    return e.replace(Ep, function(t) {
      return "\\" + t.charCodeAt(0).toString(16) + " ";
    });
  }
  function As(e, t, l, a, i, s, c, o) {
    e.name = "", c != null && typeof c != "function" && typeof c != "symbol" && typeof c != "boolean" ? e.type = c : e.removeAttribute("type"), t != null ? c === "number" ? (t === 0 && e.value === "" || e.value != t) && (e.value = "" + Ot(t)) : e.value !== "" + Ot(t) && (e.value = "" + Ot(t)) : c !== "submit" && c !== "reset" || e.removeAttribute("value"), t != null ? Cs(e, c, Ot(t)) : l != null ? Cs(e, c, Ot(l)) : a != null && e.removeAttribute("value"), i == null && s != null && (e.defaultChecked = !!s), i != null && (e.checked = i && typeof i != "function" && typeof i != "symbol"), o != null && typeof o != "function" && typeof o != "symbol" && typeof o != "boolean" ? e.name = "" + Ot(o) : e.removeAttribute("name");
  }
  function mo(e, t, l, a, i, s, c, o) {
    if (s != null && typeof s != "function" && typeof s != "symbol" && typeof s != "boolean" && (e.type = s), t != null || l != null) {
      if (!(s !== "submit" && s !== "reset" || t != null)) {
        Ts(e);
        return;
      }
      l = l != null ? "" + Ot(l) : "", t = t != null ? "" + Ot(t) : l, o || t === e.value || (e.value = t), e.defaultValue = t;
    }
    a = a ?? i, a = typeof a != "function" && typeof a != "symbol" && !!a, e.checked = o ? e.checked : !!a, e.defaultChecked = !!a, c != null && typeof c != "function" && typeof c != "symbol" && typeof c != "boolean" && (e.name = c), Ts(e);
  }
  function Cs(e, t, l) {
    t === "number" && ui(e.ownerDocument) === e || e.defaultValue === "" + l || (e.defaultValue = "" + l);
  }
  function ya(e, t, l, a) {
    if (e = e.options, t) {
      t = {};
      for (var i = 0; i < l.length; i++) t["$" + l[i]] = !0;
      for (l = 0; l < e.length; l++) i = t.hasOwnProperty("$" + e[l].value), e[l].selected !== i && (e[l].selected = i), i && a && (e[l].defaultSelected = !0);
    } else {
      for (l = "" + Ot(l), t = null, i = 0; i < e.length; i++) {
        if (e[i].value === l) {
          e[i].selected = !0, a && (e[i].defaultSelected = !0);
          return;
        }
        t !== null || e[i].disabled || (t = e[i]);
      }
      t !== null && (t.selected = !0);
    }
  }
  function xo(e, t, l) {
    if (t != null && (t = "" + Ot(t), t !== e.value && (e.value = t), l == null)) {
      e.defaultValue !== t && (e.defaultValue = t);
      return;
    }
    e.defaultValue = l != null ? "" + Ot(l) : "";
  }
  function go(e, t, l, a) {
    if (t == null) {
      if (a != null) {
        if (l != null) throw Error(d(92));
        if (G(a)) {
          if (1 < a.length) throw Error(d(93));
          a = a[0];
        }
        l = a;
      }
      l ??= "", t = l;
    }
    l = Ot(t), e.defaultValue = l, a = e.textContent, a === l && a !== "" && a !== null && (e.value = a), Ts(e);
  }
  function ja(e, t) {
    if (t) {
      var l = e.firstChild;
      if (l && l === e.lastChild && l.nodeType === 3) {
        l.nodeValue = t;
        return;
      }
    }
    e.textContent = t;
  }
  var Tp = new Set("animationIterationCount aspectRatio borderImageOutset borderImageSlice borderImageWidth boxFlex boxFlexGroup boxOrdinalGroup columnCount columns flex flexGrow flexPositive flexShrink flexNegative flexOrder gridArea gridRow gridRowEnd gridRowSpan gridRowStart gridColumn gridColumnEnd gridColumnSpan gridColumnStart fontWeight lineClamp lineHeight opacity order orphans scale tabSize widows zIndex zoom fillOpacity floodOpacity stopOpacity strokeDasharray strokeDashoffset strokeMiterlimit strokeOpacity strokeWidth MozAnimationIterationCount MozBoxFlex MozBoxFlexGroup MozLineClamp msAnimationIterationCount msFlex msZoom msFlexGrow msFlexNegative msFlexOrder msFlexPositive msFlexShrink msGridColumn msGridColumnSpan msGridRow msGridRowSpan WebkitAnimationIterationCount WebkitBoxFlex WebKitBoxFlexGroup WebkitBoxOrdinalGroup WebkitColumnCount WebkitColumns WebkitFlex WebkitFlexGrow WebkitFlexPositive WebkitFlexShrink WebkitLineClamp".split(" "));
  function vo(e, t, l) {
    var a = t.indexOf("--") === 0;
    l == null || typeof l == "boolean" || l === "" ? a ? e.setProperty(t, "") : t === "float" ? e.cssFloat = "" : e[t] = "" : a ? e.setProperty(t, l) : typeof l != "number" || l === 0 || Tp.has(t) ? t === "float" ? e.cssFloat = l : e[t] = ("" + l).trim() : e[t] = l + "px";
  }
  function bo(e, t, l) {
    if (t != null && typeof t != "object") throw Error(d(62));
    if (e = e.style, l != null) {
      for (var a in l) !l.hasOwnProperty(a) || t != null && t.hasOwnProperty(a) || (a.indexOf("--") === 0 ? e.setProperty(a, "") : a === "float" ? e.cssFloat = "" : e[a] = "");
      for (var i in t) a = t[i], t.hasOwnProperty(i) && l[i] !== a && vo(e, i, a);
    } else for (var s in t) t.hasOwnProperty(s) && vo(e, s, t[s]);
  }
  function Ms(e) {
    if (e.indexOf("-") === -1) return !1;
    switch (e) {
      case "annotation-xml":
      case "color-profile":
      case "font-face":
      case "font-face-src":
      case "font-face-uri":
      case "font-face-format":
      case "font-face-name":
      case "missing-glyph":
        return !1;
      default:
        return !0;
    }
  }
  var Ap = /* @__PURE__ */ new Map([
    ["acceptCharset", "accept-charset"],
    ["htmlFor", "for"],
    ["httpEquiv", "http-equiv"],
    ["crossOrigin", "crossorigin"],
    ["accentHeight", "accent-height"],
    ["alignmentBaseline", "alignment-baseline"],
    ["arabicForm", "arabic-form"],
    ["baselineShift", "baseline-shift"],
    ["capHeight", "cap-height"],
    ["clipPath", "clip-path"],
    ["clipRule", "clip-rule"],
    ["colorInterpolation", "color-interpolation"],
    ["colorInterpolationFilters", "color-interpolation-filters"],
    ["colorProfile", "color-profile"],
    ["colorRendering", "color-rendering"],
    ["dominantBaseline", "dominant-baseline"],
    ["enableBackground", "enable-background"],
    ["fillOpacity", "fill-opacity"],
    ["fillRule", "fill-rule"],
    ["floodColor", "flood-color"],
    ["floodOpacity", "flood-opacity"],
    ["fontFamily", "font-family"],
    ["fontSize", "font-size"],
    ["fontSizeAdjust", "font-size-adjust"],
    ["fontStretch", "font-stretch"],
    ["fontStyle", "font-style"],
    ["fontVariant", "font-variant"],
    ["fontWeight", "font-weight"],
    ["glyphName", "glyph-name"],
    ["glyphOrientationHorizontal", "glyph-orientation-horizontal"],
    ["glyphOrientationVertical", "glyph-orientation-vertical"],
    ["horizAdvX", "horiz-adv-x"],
    ["horizOriginX", "horiz-origin-x"],
    ["imageRendering", "image-rendering"],
    ["letterSpacing", "letter-spacing"],
    ["lightingColor", "lighting-color"],
    ["markerEnd", "marker-end"],
    ["markerMid", "marker-mid"],
    ["markerStart", "marker-start"],
    ["overlinePosition", "overline-position"],
    ["overlineThickness", "overline-thickness"],
    ["paintOrder", "paint-order"],
    ["panose-1", "panose-1"],
    ["pointerEvents", "pointer-events"],
    ["renderingIntent", "rendering-intent"],
    ["shapeRendering", "shape-rendering"],
    ["stopColor", "stop-color"],
    ["stopOpacity", "stop-opacity"],
    ["strikethroughPosition", "strikethrough-position"],
    ["strikethroughThickness", "strikethrough-thickness"],
    ["strokeDasharray", "stroke-dasharray"],
    ["strokeDashoffset", "stroke-dashoffset"],
    ["strokeLinecap", "stroke-linecap"],
    ["strokeLinejoin", "stroke-linejoin"],
    ["strokeMiterlimit", "stroke-miterlimit"],
    ["strokeOpacity", "stroke-opacity"],
    ["strokeWidth", "stroke-width"],
    ["textAnchor", "text-anchor"],
    ["textDecoration", "text-decoration"],
    ["textRendering", "text-rendering"],
    ["transformOrigin", "transform-origin"],
    ["underlinePosition", "underline-position"],
    ["underlineThickness", "underline-thickness"],
    ["unicodeBidi", "unicode-bidi"],
    ["unicodeRange", "unicode-range"],
    ["unitsPerEm", "units-per-em"],
    ["vAlphabetic", "v-alphabetic"],
    ["vHanging", "v-hanging"],
    ["vIdeographic", "v-ideographic"],
    ["vMathematical", "v-mathematical"],
    ["vectorEffect", "vector-effect"],
    ["vertAdvY", "vert-adv-y"],
    ["vertOriginX", "vert-origin-x"],
    ["vertOriginY", "vert-origin-y"],
    ["wordSpacing", "word-spacing"],
    ["writingMode", "writing-mode"],
    ["xmlnsXlink", "xmlns:xlink"],
    ["xHeight", "x-height"]
  ]), Cp = /^[\u0000-\u001F ]*j[\r\n\t]*a[\r\n\t]*v[\r\n\t]*a[\r\n\t]*s[\r\n\t]*c[\r\n\t]*r[\r\n\t]*i[\r\n\t]*p[\r\n\t]*t[\r\n\t]*:/i;
  function oi(e) {
    return Cp.test("" + e) ? "javascript:throw new Error('React has blocked a javascript: URL as a security precaution.')" : e;
  }
  function ll() {
  }
  var Os = null;
  function ks(e) {
    return e = e.target || e.srcElement || window, e.correspondingUseElement && (e = e.correspondingUseElement), e.nodeType === 3 ? e.parentNode : e;
  }
  var Sa = null, za = null;
  function yo(e) {
    var t = ga(e);
    if (t && (e = t.stateNode)) {
      var l = e[xt] || null;
      e: switch (e = t.stateNode, t.type) {
        case "input":
          if (As(e, l.value, l.defaultValue, l.defaultValue, l.checked, l.defaultChecked, l.type, l.name), t = l.name, l.type === "radio" && t != null) {
            for (l = e; l.parentNode; ) l = l.parentNode;
            for (l = l.querySelectorAll('input[name="' + kt("" + t) + '"][type="radio"]'), t = 0; t < l.length; t++) {
              var a = l[t];
              if (a !== e && a.form === e.form) {
                var i = a[xt] || null;
                if (!i) throw Error(d(90));
                As(a, i.value, i.defaultValue, i.defaultValue, i.checked, i.defaultChecked, i.type, i.name);
              }
            }
            for (t = 0; t < l.length; t++) a = l[t], a.form === e.form && ho(a);
          }
          break e;
        case "textarea":
          xo(e, l.value, l.defaultValue);
          break e;
        case "select":
          t = l.value, t != null && ya(e, !!l.multiple, t, !1);
      }
    }
  }
  var Ds = !1;
  function jo(e, t, l) {
    if (Ds) return e(t, l);
    Ds = !0;
    try {
      return e(t);
    } finally {
      if (Ds = !1, (Sa !== null || za !== null) && ($i(), Sa && (t = Sa, e = za, za = Sa = null, yo(t), e)))
        for (t = 0; t < e.length; t++) yo(e[t]);
    }
  }
  function dn(e, t) {
    var l = e.stateNode;
    if (l === null) return null;
    var a = l[xt] || null;
    if (a === null) return null;
    l = a[t];
    e: switch (t) {
      case "onClick":
      case "onClickCapture":
      case "onDoubleClick":
      case "onDoubleClickCapture":
      case "onMouseDown":
      case "onMouseDownCapture":
      case "onMouseMove":
      case "onMouseMoveCapture":
      case "onMouseUp":
      case "onMouseUpCapture":
      case "onMouseEnter":
        (a = !a.disabled) || (e = e.type, a = !(e === "button" || e === "input" || e === "select" || e === "textarea")), e = !a;
        break e;
      default:
        e = !1;
    }
    if (e) return null;
    if (l && typeof l != "function") throw Error(d(231, t, typeof l));
    return l;
  }
  var al = !(typeof window > "u" || typeof window.document > "u" || typeof window.document.createElement > "u"), Us = !1;
  if (al) try {
    var rn = {};
    Object.defineProperty(rn, "passive", { get: function() {
      Us = !0;
    } }), window.addEventListener("test", rn, rn), window.removeEventListener("test", rn, rn);
  } catch {
    Us = !1;
  }
  var wl = null, Rs = null, di = null;
  function So() {
    if (di) return di;
    var e, t = Rs, l = t.length, a, i = "value" in wl ? wl.value : wl.textContent, s = i.length;
    for (e = 0; e < l && t[e] === i[e]; e++) ;
    var c = l - e;
    for (a = 1; a <= c && t[l - a] === i[s - a]; a++) ;
    return di = i.slice(e, 1 < a ? 1 - a : void 0);
  }
  function ri(e) {
    var t = e.keyCode;
    return "charCode" in e ? (e = e.charCode, e === 0 && t === 13 && (e = 13)) : e = t, e === 10 && (e = 13), 32 <= e || e === 13 ? e : 0;
  }
  function fi() {
    return !0;
  }
  function zo() {
    return !1;
  }
  function gt(e) {
    function t(l, a, i, s, c) {
      this._reactName = l, this._targetInst = i, this.type = a, this.nativeEvent = s, this.target = c, this.currentTarget = null;
      for (var o in e) e.hasOwnProperty(o) && (l = e[o], this[o] = l ? l(s) : s[o]);
      return this.isDefaultPrevented = (s.defaultPrevented != null ? s.defaultPrevented : s.returnValue === !1) ? fi : zo, this.isPropagationStopped = zo, this;
    }
    return H(t.prototype, {
      preventDefault: function() {
        this.defaultPrevented = !0;
        var l = this.nativeEvent;
        l && (l.preventDefault ? l.preventDefault() : typeof l.returnValue != "unknown" && (l.returnValue = !1), this.isDefaultPrevented = fi);
      },
      stopPropagation: function() {
        var l = this.nativeEvent;
        l && (l.stopPropagation ? l.stopPropagation() : typeof l.cancelBubble != "unknown" && (l.cancelBubble = !0), this.isPropagationStopped = fi);
      },
      persist: function() {
      },
      isPersistent: fi
    }), t;
  }
  var $l = {
    eventPhase: 0,
    bubbles: 0,
    cancelable: 0,
    timeStamp: function(e) {
      return e.timeStamp || Date.now();
    },
    defaultPrevented: 0,
    isTrusted: 0
  }, pi = gt($l), fn = H({}, $l, {
    view: 0,
    detail: 0
  }), Mp = gt(fn), qs, Hs, pn, hi = H({}, fn, {
    screenX: 0,
    screenY: 0,
    clientX: 0,
    clientY: 0,
    pageX: 0,
    pageY: 0,
    ctrlKey: 0,
    shiftKey: 0,
    altKey: 0,
    metaKey: 0,
    getModifierState: Ls,
    button: 0,
    buttons: 0,
    relatedTarget: function(e) {
      return e.relatedTarget === void 0 ? e.fromElement === e.srcElement ? e.toElement : e.fromElement : e.relatedTarget;
    },
    movementX: function(e) {
      return "movementX" in e ? e.movementX : (e !== pn && (pn && e.type === "mousemove" ? (qs = e.screenX - pn.screenX, Hs = e.screenY - pn.screenY) : Hs = qs = 0, pn = e), qs);
    },
    movementY: function(e) {
      return "movementY" in e ? e.movementY : Hs;
    }
  }), No = gt(hi), Op = gt(H({}, hi, { dataTransfer: 0 })), Bs = gt(H({}, fn, { relatedTarget: 0 })), kp = gt(H({}, $l, {
    animationName: 0,
    elapsedTime: 0,
    pseudoElement: 0
  })), Dp = gt(H({}, $l, { clipboardData: function(e) {
    return "clipboardData" in e ? e.clipboardData : window.clipboardData;
  } })), _o = gt(H({}, $l, { data: 0 })), Up = {
    Esc: "Escape",
    Spacebar: " ",
    Left: "ArrowLeft",
    Up: "ArrowUp",
    Right: "ArrowRight",
    Down: "ArrowDown",
    Del: "Delete",
    Win: "OS",
    Menu: "ContextMenu",
    Apps: "ContextMenu",
    Scroll: "ScrollLock",
    MozPrintableKey: "Unidentified"
  }, Rp = {
    8: "Backspace",
    9: "Tab",
    12: "Clear",
    13: "Enter",
    16: "Shift",
    17: "Control",
    18: "Alt",
    19: "Pause",
    20: "CapsLock",
    27: "Escape",
    32: " ",
    33: "PageUp",
    34: "PageDown",
    35: "End",
    36: "Home",
    37: "ArrowLeft",
    38: "ArrowUp",
    39: "ArrowRight",
    40: "ArrowDown",
    45: "Insert",
    46: "Delete",
    112: "F1",
    113: "F2",
    114: "F3",
    115: "F4",
    116: "F5",
    117: "F6",
    118: "F7",
    119: "F8",
    120: "F9",
    121: "F10",
    122: "F11",
    123: "F12",
    144: "NumLock",
    145: "ScrollLock",
    224: "Meta"
  }, qp = {
    Alt: "altKey",
    Control: "ctrlKey",
    Meta: "metaKey",
    Shift: "shiftKey"
  };
  function Hp(e) {
    var t = this.nativeEvent;
    return t.getModifierState ? t.getModifierState(e) : (e = qp[e]) ? !!t[e] : !1;
  }
  function Ls() {
    return Hp;
  }
  var Bp = gt(H({}, fn, {
    key: function(e) {
      if (e.key) {
        var t = Up[e.key] || e.key;
        if (t !== "Unidentified") return t;
      }
      return e.type === "keypress" ? (e = ri(e), e === 13 ? "Enter" : String.fromCharCode(e)) : e.type === "keydown" || e.type === "keyup" ? Rp[e.keyCode] || "Unidentified" : "";
    },
    code: 0,
    location: 0,
    ctrlKey: 0,
    shiftKey: 0,
    altKey: 0,
    metaKey: 0,
    repeat: 0,
    locale: 0,
    getModifierState: Ls,
    charCode: function(e) {
      return e.type === "keypress" ? ri(e) : 0;
    },
    keyCode: function(e) {
      return e.type === "keydown" || e.type === "keyup" ? e.keyCode : 0;
    },
    which: function(e) {
      return e.type === "keypress" ? ri(e) : e.type === "keydown" || e.type === "keyup" ? e.keyCode : 0;
    }
  })), wo = gt(H({}, hi, {
    pointerId: 0,
    width: 0,
    height: 0,
    pressure: 0,
    tangentialPressure: 0,
    tiltX: 0,
    tiltY: 0,
    twist: 0,
    pointerType: 0,
    isPrimary: 0
  })), Lp = gt(H({}, fn, {
    touches: 0,
    targetTouches: 0,
    changedTouches: 0,
    altKey: 0,
    metaKey: 0,
    ctrlKey: 0,
    shiftKey: 0,
    getModifierState: Ls
  })), Gp = gt(H({}, $l, {
    propertyName: 0,
    elapsedTime: 0,
    pseudoElement: 0
  })), Yp = gt(H({}, hi, {
    deltaX: function(e) {
      return "deltaX" in e ? e.deltaX : "wheelDeltaX" in e ? -e.wheelDeltaX : 0;
    },
    deltaY: function(e) {
      return "deltaY" in e ? e.deltaY : "wheelDeltaY" in e ? -e.wheelDeltaY : "wheelDelta" in e ? -e.wheelDelta : 0;
    },
    deltaZ: 0,
    deltaMode: 0
  })), Vp = gt(H({}, $l, {
    newState: 0,
    oldState: 0
  })), Xp = [
    9,
    13,
    27,
    32
  ], Gs = al && "CompositionEvent" in window, hn = null;
  al && "documentMode" in document && (hn = document.documentMode);
  var Qp = al && "TextEvent" in window && !hn, Eo = al && (!Gs || hn && 8 < hn && 11 >= hn), To = " ", Ao = !1;
  function Co(e, t) {
    switch (e) {
      case "keyup":
        return Xp.indexOf(t.keyCode) !== -1;
      case "keydown":
        return t.keyCode !== 229;
      case "keypress":
      case "mousedown":
      case "focusout":
        return !0;
      default:
        return !1;
    }
  }
  function Mo(e) {
    return e = e.detail, typeof e == "object" && "data" in e ? e.data : null;
  }
  var Na = !1;
  function Zp(e, t) {
    switch (e) {
      case "compositionend":
        return Mo(t);
      case "keypress":
        return t.which !== 32 ? null : (Ao = !0, To);
      case "textInput":
        return e = t.data, e === To && Ao ? null : e;
      default:
        return null;
    }
  }
  function Kp(e, t) {
    if (Na) return e === "compositionend" || !Gs && Co(e, t) ? (e = So(), di = Rs = wl = null, Na = !1, e) : null;
    switch (e) {
      case "paste":
        return null;
      case "keypress":
        if (!(t.ctrlKey || t.altKey || t.metaKey) || t.ctrlKey && t.altKey) {
          if (t.char && 1 < t.char.length) return t.char;
          if (t.which) return String.fromCharCode(t.which);
        }
        return null;
      case "compositionend":
        return Eo && t.locale !== "ko" ? null : t.data;
      default:
        return null;
    }
  }
  var Jp = {
    color: !0,
    date: !0,
    datetime: !0,
    "datetime-local": !0,
    email: !0,
    month: !0,
    number: !0,
    password: !0,
    range: !0,
    search: !0,
    tel: !0,
    text: !0,
    time: !0,
    url: !0,
    week: !0
  };
  function Oo(e) {
    var t = e && e.nodeName && e.nodeName.toLowerCase();
    return t === "input" ? !!Jp[e.type] : t === "textarea";
  }
  function ko(e, t, l, a) {
    Sa ? za ? za.push(a) : za = [a] : Sa = a, t = as(t, "onChange"), 0 < t.length && (l = new pi("onChange", "change", null, l, a), e.push({
      event: l,
      listeners: t
    }));
  }
  var mn = null, xn = null;
  function Ip(e) {
    pf(e, 0);
  }
  function mi(e) {
    if (ho(on(e))) return e;
  }
  function Do(e, t) {
    if (e === "change") return t;
  }
  var Uo = !1;
  if (al) {
    var Ys;
    if (al) {
      var Vs = "oninput" in document;
      if (!Vs) {
        var Ro = document.createElement("div");
        Ro.setAttribute("oninput", "return;"), Vs = typeof Ro.oninput == "function";
      }
      Ys = Vs;
    } else Ys = !1;
    Uo = Ys && (!document.documentMode || 9 < document.documentMode);
  }
  function qo() {
    mn && (mn.detachEvent("onpropertychange", Ho), xn = mn = null);
  }
  function Ho(e) {
    if (e.propertyName === "value" && mi(xn)) {
      var t = [];
      ko(t, xn, e, ks(e)), jo(Ip, t);
    }
  }
  function $p(e, t, l) {
    e === "focusin" ? (qo(), mn = t, xn = l, mn.attachEvent("onpropertychange", Ho)) : e === "focusout" && qo();
  }
  function Wp(e) {
    if (e === "selectionchange" || e === "keyup" || e === "keydown") return mi(xn);
  }
  function Fp(e, t) {
    if (e === "click") return mi(t);
  }
  function Pp(e, t) {
    if (e === "input" || e === "change") return mi(t);
  }
  function e0(e, t) {
    return e === t && (e !== 0 || 1 / e === 1 / t) || e !== e && t !== t;
  }
  var _t = typeof Object.is == "function" ? Object.is : e0;
  function gn(e, t) {
    if (_t(e, t)) return !0;
    if (typeof e != "object" || e === null || typeof t != "object" || t === null) return !1;
    var l = Object.keys(e), a = Object.keys(t);
    if (l.length !== a.length) return !1;
    for (a = 0; a < l.length; a++) {
      var i = l[a];
      if (!Xt.call(t, i) || !_t(e[i], t[i])) return !1;
    }
    return !0;
  }
  function Bo(e) {
    for (; e && e.firstChild; ) e = e.firstChild;
    return e;
  }
  function Lo(e, t) {
    var l = Bo(e);
    e = 0;
    for (var a; l; ) {
      if (l.nodeType === 3) {
        if (a = e + l.textContent.length, e <= t && a >= t) return {
          node: l,
          offset: t - e
        };
        e = a;
      }
      e: {
        for (; l; ) {
          if (l.nextSibling) {
            l = l.nextSibling;
            break e;
          }
          l = l.parentNode;
        }
        l = void 0;
      }
      l = Bo(l);
    }
  }
  function Go(e, t) {
    return e && t ? e === t ? !0 : e && e.nodeType === 3 ? !1 : t && t.nodeType === 3 ? Go(e, t.parentNode) : "contains" in e ? e.contains(t) : e.compareDocumentPosition ? !!(e.compareDocumentPosition(t) & 16) : !1 : !1;
  }
  function Yo(e) {
    e = e != null && e.ownerDocument != null && e.ownerDocument.defaultView != null ? e.ownerDocument.defaultView : window;
    for (var t = ui(e.document); t instanceof e.HTMLIFrameElement; ) {
      try {
        var l = typeof t.contentWindow.location.href == "string";
      } catch {
        l = !1;
      }
      if (l) e = t.contentWindow;
      else break;
      t = ui(e.document);
    }
    return t;
  }
  function Xs(e) {
    var t = e && e.nodeName && e.nodeName.toLowerCase();
    return t && (t === "input" && (e.type === "text" || e.type === "search" || e.type === "tel" || e.type === "url" || e.type === "password") || t === "textarea" || e.contentEditable === "true");
  }
  var t0 = al && "documentMode" in document && 11 >= document.documentMode, _a = null, Qs = null, vn = null, Zs = !1;
  function Vo(e, t, l) {
    var a = l.window === l ? l.document : l.nodeType === 9 ? l : l.ownerDocument;
    Zs || _a == null || _a !== ui(a) || (a = _a, "selectionStart" in a && Xs(a) ? a = {
      start: a.selectionStart,
      end: a.selectionEnd
    } : (a = (a.ownerDocument && a.ownerDocument.defaultView || window).getSelection(), a = {
      anchorNode: a.anchorNode,
      anchorOffset: a.anchorOffset,
      focusNode: a.focusNode,
      focusOffset: a.focusOffset
    }), vn && gn(vn, a) || (vn = a, a = as(Qs, "onSelect"), 0 < a.length && (t = new pi("onSelect", "select", null, t, l), e.push({
      event: t,
      listeners: a
    }), t.target = _a)));
  }
  function Wl(e, t) {
    var l = {};
    return l[e.toLowerCase()] = t.toLowerCase(), l["Webkit" + e] = "webkit" + t, l["Moz" + e] = "moz" + t, l;
  }
  var wa = {
    animationend: Wl("Animation", "AnimationEnd"),
    animationiteration: Wl("Animation", "AnimationIteration"),
    animationstart: Wl("Animation", "AnimationStart"),
    transitionrun: Wl("Transition", "TransitionRun"),
    transitionstart: Wl("Transition", "TransitionStart"),
    transitioncancel: Wl("Transition", "TransitionCancel"),
    transitionend: Wl("Transition", "TransitionEnd")
  }, Ks = {}, Xo = {};
  al && (Xo = document.createElement("div").style, "AnimationEvent" in window || (delete wa.animationend.animation, delete wa.animationiteration.animation, delete wa.animationstart.animation), "TransitionEvent" in window || delete wa.transitionend.transition);
  function Fl(e) {
    if (Ks[e]) return Ks[e];
    if (!wa[e]) return e;
    var t = wa[e], l;
    for (l in t) if (t.hasOwnProperty(l) && l in Xo) return Ks[e] = t[l];
    return e;
  }
  var Qo = Fl("animationend"), Zo = Fl("animationiteration"), Ko = Fl("animationstart"), l0 = Fl("transitionrun"), a0 = Fl("transitionstart"), n0 = Fl("transitioncancel"), Jo = Fl("transitionend"), Io = /* @__PURE__ */ new Map(), Js = "abort auxClick beforeToggle cancel canPlay canPlayThrough click close contextMenu copy cut drag dragEnd dragEnter dragExit dragLeave dragOver dragStart drop durationChange emptied encrypted ended error gotPointerCapture input invalid keyDown keyPress keyUp load loadedData loadedMetadata loadStart lostPointerCapture mouseDown mouseMove mouseOut mouseOver mouseUp paste pause play playing pointerCancel pointerDown pointerMove pointerOut pointerOver pointerUp progress rateChange reset resize seeked seeking stalled submit suspend timeUpdate touchCancel touchEnd touchStart volumeChange scroll toggle touchMove waiting wheel".split(" ");
  Js.push("scrollEnd");
  function Zt(e, t) {
    Io.set(e, t), Il(t, [e]);
  }
  var xi = typeof reportError == "function" ? reportError : function(e) {
    if (typeof window == "object" && typeof window.ErrorEvent == "function") {
      var t = new window.ErrorEvent("error", {
        bubbles: !0,
        cancelable: !0,
        message: typeof e == "object" && e !== null && typeof e.message == "string" ? String(e.message) : String(e),
        error: e
      });
      if (!window.dispatchEvent(t)) return;
    } else if (typeof process == "object" && typeof process.emit == "function") {
      process.emit("uncaughtException", e);
      return;
    }
    console.error(e);
  }, Dt = [], Ea = 0, Is = 0;
  function gi() {
    for (var e = Ea, t = Is = Ea = 0; t < e; ) {
      var l = Dt[t];
      Dt[t++] = null;
      var a = Dt[t];
      Dt[t++] = null;
      var i = Dt[t];
      Dt[t++] = null;
      var s = Dt[t];
      if (Dt[t++] = null, a !== null && i !== null) {
        var c = a.pending;
        c === null ? i.next = i : (i.next = c.next, c.next = i), a.pending = i;
      }
      s !== 0 && $o(l, i, s);
    }
  }
  function vi(e, t, l, a) {
    Dt[Ea++] = e, Dt[Ea++] = t, Dt[Ea++] = l, Dt[Ea++] = a, Is |= a, e.lanes |= a, e = e.alternate, e !== null && (e.lanes |= a);
  }
  function $s(e, t, l, a) {
    return vi(e, t, l, a), bi(e);
  }
  function Pl(e, t) {
    return vi(e, null, null, t), bi(e);
  }
  function $o(e, t, l) {
    e.lanes |= l;
    var a = e.alternate;
    a !== null && (a.lanes |= l);
    for (var i = !1, s = e.return; s !== null; ) s.childLanes |= l, a = s.alternate, a !== null && (a.childLanes |= l), s.tag === 22 && (e = s.stateNode, e === null || e._visibility & 1 || (i = !0)), e = s, s = s.return;
    return e.tag === 3 ? (s = e.stateNode, i && t !== null && (i = 31 - Nt(l), e = s.hiddenUpdates, a = e[i], a === null ? e[i] = [t] : a.push(t), t.lane = l | 536870912), s) : null;
  }
  function bi(e) {
    if (50 < Ln) throw Ln = 0, iu = null, Error(d(185));
    for (var t = e.return; t !== null; ) e = t, t = e.return;
    return e.tag === 3 ? e.stateNode : null;
  }
  var Ta = {};
  function i0(e, t, l, a) {
    this.tag = e, this.key = l, this.sibling = this.child = this.return = this.stateNode = this.type = this.elementType = null, this.index = 0, this.refCleanup = this.ref = null, this.pendingProps = t, this.dependencies = this.memoizedState = this.updateQueue = this.memoizedProps = null, this.mode = a, this.subtreeFlags = this.flags = 0, this.deletions = null, this.childLanes = this.lanes = 0, this.alternate = null;
  }
  function wt(e, t, l, a) {
    return new i0(e, t, l, a);
  }
  function Ws(e) {
    return e = e.prototype, !(!e || !e.isReactComponent);
  }
  function nl(e, t) {
    var l = e.alternate;
    return l === null ? (l = wt(e.tag, t, e.key, e.mode), l.elementType = e.elementType, l.type = e.type, l.stateNode = e.stateNode, l.alternate = e, e.alternate = l) : (l.pendingProps = t, l.type = e.type, l.flags = 0, l.subtreeFlags = 0, l.deletions = null), l.flags = e.flags & 65011712, l.childLanes = e.childLanes, l.lanes = e.lanes, l.child = e.child, l.memoizedProps = e.memoizedProps, l.memoizedState = e.memoizedState, l.updateQueue = e.updateQueue, t = e.dependencies, l.dependencies = t === null ? null : {
      lanes: t.lanes,
      firstContext: t.firstContext
    }, l.sibling = e.sibling, l.index = e.index, l.ref = e.ref, l.refCleanup = e.refCleanup, l;
  }
  function Wo(e, t) {
    e.flags &= 65011714;
    var l = e.alternate;
    return l === null ? (e.childLanes = 0, e.lanes = t, e.child = null, e.subtreeFlags = 0, e.memoizedProps = null, e.memoizedState = null, e.updateQueue = null, e.dependencies = null, e.stateNode = null) : (e.childLanes = l.childLanes, e.lanes = l.lanes, e.child = l.child, e.subtreeFlags = 0, e.deletions = null, e.memoizedProps = l.memoizedProps, e.memoizedState = l.memoizedState, e.updateQueue = l.updateQueue, e.type = l.type, t = l.dependencies, e.dependencies = t === null ? null : {
      lanes: t.lanes,
      firstContext: t.firstContext
    }), e;
  }
  function yi(e, t, l, a, i, s) {
    var c = 0;
    if (a = e, typeof e == "function") Ws(e) && (c = 1);
    else if (typeof e == "string") c = rh(e, l, $.current) ? 26 : e === "html" || e === "head" || e === "body" ? 27 : 5;
    else e: switch (e) {
      case b:
        return e = wt(31, l, t, i), e.elementType = b, e.lanes = s, e;
      case I:
        return ea(l.children, i, s, t);
      case ne:
        c = 8, i |= 24;
        break;
      case K:
        return e = wt(12, l, t, i | 2), e.elementType = K, e.lanes = s, e;
      case W:
        return e = wt(13, l, t, i), e.elementType = W, e.lanes = s, e;
      case pe:
        return e = wt(19, l, t, i), e.elementType = pe, e.lanes = s, e;
      default:
        if (typeof e == "object" && e !== null) switch (e.$$typeof) {
          case B:
            c = 10;
            break e;
          case ce:
            c = 9;
            break e;
          case P:
            c = 11;
            break e;
          case ie:
            c = 14;
            break e;
          case J:
            c = 16, a = null;
            break e;
        }
        c = 29, l = Error(d(130, e === null ? "null" : typeof e, "")), a = null;
    }
    return t = wt(c, l, t, i), t.elementType = e, t.type = a, t.lanes = s, t;
  }
  function ea(e, t, l, a) {
    return e = wt(7, e, a, t), e.lanes = l, e;
  }
  function Fs(e, t, l) {
    return e = wt(6, e, null, t), e.lanes = l, e;
  }
  function Fo(e) {
    var t = wt(18, null, null, 0);
    return t.stateNode = e, t;
  }
  function Ps(e, t, l) {
    return t = wt(4, e.children !== null ? e.children : [], e.key, t), t.lanes = l, t.stateNode = {
      containerInfo: e.containerInfo,
      pendingChildren: null,
      implementation: e.implementation
    }, t;
  }
  var Po = /* @__PURE__ */ new WeakMap();
  function Ut(e, t) {
    if (typeof e == "object" && e !== null) {
      var l = Po.get(e);
      return l !== void 0 ? l : (t = {
        value: e,
        source: t,
        stack: _e(t)
      }, Po.set(e, t), t);
    }
    return {
      value: e,
      source: t,
      stack: _e(t)
    };
  }
  var Aa = [], Ca = 0, ji = null, bn = 0, Rt = [], qt = 0, El = null, $t = 1, Wt = "";
  function il(e, t) {
    Aa[Ca++] = bn, Aa[Ca++] = ji, ji = e, bn = t;
  }
  function ed(e, t, l) {
    Rt[qt++] = $t, Rt[qt++] = Wt, Rt[qt++] = El, El = e;
    var a = $t;
    e = Wt;
    var i = 32 - Nt(a) - 1;
    a &= ~(1 << i), l += 1;
    var s = 32 - Nt(t) + i;
    if (30 < s) {
      var c = i - i % 5;
      s = (a & (1 << c) - 1).toString(32), a >>= c, i -= c, $t = 1 << 32 - Nt(t) + i | l << i | a, Wt = s + e;
    } else $t = 1 << s | l << i | a, Wt = e;
  }
  function ec(e) {
    e.return !== null && (il(e, 1), ed(e, 1, 0));
  }
  function tc(e) {
    for (; e === ji; ) ji = Aa[--Ca], Aa[Ca] = null, bn = Aa[--Ca], Aa[Ca] = null;
    for (; e === El; ) El = Rt[--qt], Rt[qt] = null, Wt = Rt[--qt], Rt[qt] = null, $t = Rt[--qt], Rt[qt] = null;
  }
  function td(e, t) {
    Rt[qt++] = $t, Rt[qt++] = Wt, Rt[qt++] = El, $t = t.id, Wt = t.overflow, El = e;
  }
  var dt = null, Ve = null, we = !1, Tl = null, Ht = !1, lc = Error(d(519));
  function Al(e) {
    throw yn(Ut(Error(d(418, 1 < arguments.length && arguments[1] !== void 0 && arguments[1] ? "text" : "HTML", "")), e)), lc;
  }
  function ld(e) {
    var t = e.stateNode, l = e.type, a = e.memoizedProps;
    switch (t[ot] = e, t[xt] = a, l) {
      case "dialog":
        Se("cancel", t), Se("close", t);
        break;
      case "iframe":
      case "object":
      case "embed":
        Se("load", t);
        break;
      case "video":
      case "audio":
        for (l = 0; l < Yn.length; l++) Se(Yn[l], t);
        break;
      case "source":
        Se("error", t);
        break;
      case "img":
      case "image":
      case "link":
        Se("error", t), Se("load", t);
        break;
      case "details":
        Se("toggle", t);
        break;
      case "input":
        Se("invalid", t), mo(t, a.value, a.defaultValue, a.checked, a.defaultChecked, a.type, a.name, !0);
        break;
      case "select":
        Se("invalid", t);
        break;
      case "textarea":
        Se("invalid", t), go(t, a.value, a.defaultValue, a.children);
    }
    l = a.children, typeof l != "string" && typeof l != "number" && typeof l != "bigint" || t.textContent === "" + l || a.suppressHydrationWarning === !0 || vf(t.textContent, l) ? (a.popover != null && (Se("beforetoggle", t), Se("toggle", t)), a.onScroll != null && Se("scroll", t), a.onScrollEnd != null && Se("scrollend", t), a.onClick != null && (t.onclick = ll), t = !0) : t = !1, t || Al(e, !0);
  }
  function ad(e) {
    for (dt = e.return; dt; ) switch (dt.tag) {
      case 5:
      case 31:
      case 13:
        Ht = !1;
        return;
      case 27:
      case 3:
        Ht = !0;
        return;
      default:
        dt = dt.return;
    }
  }
  function Ma(e) {
    if (e !== dt) return !1;
    if (!we) return ad(e), we = !0, !1;
    var t = e.tag, l;
    if ((l = t !== 3 && t !== 27) && ((l = t === 5) && (l = e.type, l = !(l !== "form" && l !== "button") || bu(e.type, e.memoizedProps)), l = !l), l && Ve && Al(e), ad(e), t === 13) {
      if (e = e.memoizedState, e = e !== null ? e.dehydrated : null, !e) throw Error(d(317));
      Ve = Ef(e);
    } else if (t === 31) {
      if (e = e.memoizedState, e = e !== null ? e.dehydrated : null, !e) throw Error(d(317));
      Ve = Ef(e);
    } else t === 27 ? (t = Ve, Gl(e.type) ? (e = Nu, Nu = null, Ve = e) : Ve = t) : Ve = dt ? Gt(e.stateNode.nextSibling) : null;
    return !0;
  }
  function ta() {
    Ve = dt = null, we = !1;
  }
  function ac() {
    var e = Tl;
    return e !== null && (jt === null ? jt = e : jt.push.apply(jt, e), Tl = null), e;
  }
  function yn(e) {
    Tl === null ? Tl = [e] : Tl.push(e);
  }
  var nc = m(null), la = null, sl = null;
  function Cl(e, t, l) {
    X(nc, t._currentValue), t._currentValue = l;
  }
  function cl(e) {
    e._currentValue = nc.current, U(nc);
  }
  function ic(e, t, l) {
    for (; e !== null; ) {
      var a = e.alternate;
      if ((e.childLanes & t) !== t ? (e.childLanes |= t, a !== null && (a.childLanes |= t)) : a !== null && (a.childLanes & t) !== t && (a.childLanes |= t), e === l) break;
      e = e.return;
    }
  }
  function sc(e, t, l, a) {
    var i = e.child;
    for (i !== null && (i.return = e); i !== null; ) {
      var s = i.dependencies;
      if (s !== null) {
        var c = i.child;
        s = s.firstContext;
        e: for (; s !== null; ) {
          var o = s;
          s = i;
          for (var p = 0; p < t.length; p++) if (o.context === t[p]) {
            s.lanes |= l, o = s.alternate, o !== null && (o.lanes |= l), ic(s.return, l, e), a || (c = null);
            break e;
          }
          s = o.next;
        }
      } else if (i.tag === 18) {
        if (c = i.return, c === null) throw Error(d(341));
        c.lanes |= l, s = c.alternate, s !== null && (s.lanes |= l), ic(c, l, e), c = null;
      } else c = i.child;
      if (c !== null) c.return = i;
      else for (c = i; c !== null; ) {
        if (c === e) {
          c = null;
          break;
        }
        if (i = c.sibling, i !== null) {
          i.return = c.return, c = i;
          break;
        }
        c = c.return;
      }
      i = c;
    }
  }
  function Oa(e, t, l, a) {
    e = null;
    for (var i = t, s = !1; i !== null; ) {
      if (!s) {
        if ((i.flags & 524288) !== 0) s = !0;
        else if ((i.flags & 262144) !== 0) break;
      }
      if (i.tag === 10) {
        var c = i.alternate;
        if (c === null) throw Error(d(387));
        if (c = c.memoizedProps, c !== null) {
          var o = i.type;
          _t(i.pendingProps.value, c.value) || (e !== null ? e.push(o) : e = [o]);
        }
      } else if (i === he.current) {
        if (c = i.alternate, c === null) throw Error(d(387));
        c.memoizedState.memoizedState !== i.memoizedState.memoizedState && (e !== null ? e.push(Kn) : e = [Kn]);
      }
      i = i.return;
    }
    e !== null && sc(t, e, l, a), t.flags |= 262144;
  }
  function Si(e) {
    for (e = e.firstContext; e !== null; ) {
      if (!_t(e.context._currentValue, e.memoizedValue)) return !0;
      e = e.next;
    }
    return !1;
  }
  function aa(e) {
    la = e, sl = null, e = e.dependencies, e !== null && (e.firstContext = null);
  }
  function rt(e) {
    return nd(la, e);
  }
  function zi(e, t) {
    return la === null && aa(e), nd(e, t);
  }
  function nd(e, t) {
    var l = t._currentValue;
    if (t = {
      context: t,
      memoizedValue: l,
      next: null
    }, sl === null) {
      if (e === null) throw Error(d(308));
      sl = t, e.dependencies = {
        lanes: 0,
        firstContext: t
      }, e.flags |= 524288;
    } else sl = sl.next = t;
    return l;
  }
  var s0 = typeof AbortController < "u" ? AbortController : function() {
    var e = [], t = this.signal = {
      aborted: !1,
      addEventListener: function(l, a) {
        e.push(a);
      }
    };
    this.abort = function() {
      t.aborted = !0, e.forEach(function(l) {
        return l();
      });
    };
  }, c0 = v.unstable_scheduleCallback, u0 = v.unstable_NormalPriority, et = {
    $$typeof: B,
    Consumer: null,
    Provider: null,
    _currentValue: null,
    _currentValue2: null,
    _threadCount: 0
  };
  function cc() {
    return {
      controller: new s0(),
      data: /* @__PURE__ */ new Map(),
      refCount: 0
    };
  }
  function jn(e) {
    e.refCount--, e.refCount === 0 && c0(u0, function() {
      e.controller.abort();
    });
  }
  var Sn = null, uc = 0, ka = 0, Da = null;
  function o0(e, t) {
    if (Sn === null) {
      var l = Sn = [];
      uc = 0, ka = ru(), Da = {
        status: "pending",
        value: void 0,
        then: function(a) {
          l.push(a);
        }
      };
    }
    return uc++, t.then(id, id), t;
  }
  function id() {
    if (--uc === 0 && Sn !== null) {
      Da !== null && (Da.status = "fulfilled");
      var e = Sn;
      Sn = null, ka = 0, Da = null;
      for (var t = 0; t < e.length; t++) (0, e[t])();
    }
  }
  function d0(e, t) {
    var l = [], a = {
      status: "pending",
      value: null,
      reason: null,
      then: function(i) {
        l.push(i);
      }
    };
    return e.then(function() {
      a.status = "fulfilled", a.value = t;
      for (var i = 0; i < l.length; i++) (0, l[i])(t);
    }, function(i) {
      for (a.status = "rejected", a.reason = i, i = 0; i < l.length; i++) (0, l[i])(void 0);
    }), a;
  }
  var sd = O.S;
  O.S = function(e, t) {
    Lr = De(), typeof t == "object" && t !== null && typeof t.then == "function" && o0(e, t), sd !== null && sd(e, t);
  };
  var na = m(null);
  function oc() {
    var e = na.current;
    return e !== null ? e : Ge.pooledCache;
  }
  function Ni(e, t) {
    t === null ? X(na, na.current) : X(na, t.pool);
  }
  function cd() {
    var e = oc();
    return e === null ? null : {
      parent: et._currentValue,
      pool: e
    };
  }
  var Ua = Error(d(460)), dc = Error(d(474)), _i = Error(d(542)), wi = { then: function() {
  } };
  function ud(e) {
    return e = e.status, e === "fulfilled" || e === "rejected";
  }
  function od(e, t, l) {
    switch (l = e[l], l === void 0 ? e.push(t) : l !== t && (t.then(ll, ll), t = l), t.status) {
      case "fulfilled":
        return t.value;
      case "rejected":
        throw e = t.reason, rd(e), e;
      default:
        if (typeof t.status == "string") t.then(ll, ll);
        else {
          if (e = Ge, e !== null && 100 < e.shellSuspendCounter) throw Error(d(482));
          e = t, e.status = "pending", e.then(function(a) {
            if (t.status === "pending") {
              var i = t;
              i.status = "fulfilled", i.value = a;
            }
          }, function(a) {
            if (t.status === "pending") {
              var i = t;
              i.status = "rejected", i.reason = a;
            }
          });
        }
        switch (t.status) {
          case "fulfilled":
            return t.value;
          case "rejected":
            throw e = t.reason, rd(e), e;
        }
        throw sa = t, Ua;
    }
  }
  function ia(e) {
    try {
      var t = e._init;
      return t(e._payload);
    } catch (l) {
      throw l !== null && typeof l == "object" && typeof l.then == "function" ? (sa = l, Ua) : l;
    }
  }
  var sa = null;
  function dd() {
    if (sa === null) throw Error(d(459));
    var e = sa;
    return sa = null, e;
  }
  function rd(e) {
    if (e === Ua || e === _i) throw Error(d(483));
  }
  var Ra = null, zn = 0;
  function Ei(e) {
    var t = zn;
    return zn += 1, Ra === null && (Ra = []), od(Ra, e, t);
  }
  function Nn(e, t) {
    t = t.props.ref, e.ref = t !== void 0 ? t : null;
  }
  function Ti(e, t) {
    throw t.$$typeof === ae ? Error(d(525)) : (e = Object.prototype.toString.call(t), Error(d(31, e === "[object Object]" ? "object with keys {" + Object.keys(t).join(", ") + "}" : e)));
  }
  function fd(e) {
    function t(y, g) {
      if (e) {
        var S = y.deletions;
        S === null ? (y.deletions = [g], y.flags |= 16) : S.push(g);
      }
    }
    function l(y, g) {
      if (!e) return null;
      for (; g !== null; ) t(y, g), g = g.sibling;
      return null;
    }
    function a(y) {
      for (var g = /* @__PURE__ */ new Map(); y !== null; ) y.key !== null ? g.set(y.key, y) : g.set(y.index, y), y = y.sibling;
      return g;
    }
    function i(y, g) {
      return y = nl(y, g), y.index = 0, y.sibling = null, y;
    }
    function s(y, g, S) {
      return y.index = S, e ? (S = y.alternate, S !== null ? (S = S.index, S < g ? (y.flags |= 67108866, g) : S) : (y.flags |= 67108866, g)) : (y.flags |= 1048576, g);
    }
    function c(y) {
      return e && y.alternate === null && (y.flags |= 67108866), y;
    }
    function o(y, g, S, D) {
      return g === null || g.tag !== 6 ? (g = Fs(S, y.mode, D), g.return = y, g) : (g = i(g, S), g.return = y, g);
    }
    function p(y, g, S, D) {
      var ue = S.type;
      return ue === I ? C(y, g, S.props.children, D, S.key) : g !== null && (g.elementType === ue || typeof ue == "object" && ue !== null && ue.$$typeof === J && ia(ue) === g.type) ? (g = i(g, S.props), Nn(g, S), g.return = y, g) : (g = yi(S.type, S.key, S.props, null, y.mode, D), Nn(g, S), g.return = y, g);
    }
    function z(y, g, S, D) {
      return g === null || g.tag !== 4 || g.stateNode.containerInfo !== S.containerInfo || g.stateNode.implementation !== S.implementation ? (g = Ps(S, y.mode, D), g.return = y, g) : (g = i(g, S.children || []), g.return = y, g);
    }
    function C(y, g, S, D, ue) {
      return g === null || g.tag !== 7 ? (g = ea(S, y.mode, D, ue), g.return = y, g) : (g = i(g, S), g.return = y, g);
    }
    function R(y, g, S) {
      if (typeof g == "string" && g !== "" || typeof g == "number" || typeof g == "bigint") return g = Fs("" + g, y.mode, S), g.return = y, g;
      if (typeof g == "object" && g !== null) {
        switch (g.$$typeof) {
          case de:
            return S = yi(g.type, g.key, g.props, null, y.mode, S), Nn(S, g), S.return = y, S;
          case L:
            return g = Ps(g, y.mode, S), g.return = y, g;
          case J:
            return g = ia(g), R(y, g, S);
        }
        if (G(g) || Te(g)) return g = ea(g, y.mode, S, null), g.return = y, g;
        if (typeof g.then == "function") return R(y, Ei(g), S);
        if (g.$$typeof === B) return R(y, zi(y, g), S);
        Ti(y, g);
      }
      return null;
    }
    function N(y, g, S, D) {
      var ue = g !== null ? g.key : null;
      if (typeof S == "string" && S !== "" || typeof S == "number" || typeof S == "bigint") return ue !== null ? null : o(y, g, "" + S, D);
      if (typeof S == "object" && S !== null) {
        switch (S.$$typeof) {
          case de:
            return S.key === ue ? p(y, g, S, D) : null;
          case L:
            return S.key === ue ? z(y, g, S, D) : null;
          case J:
            return S = ia(S), N(y, g, S, D);
        }
        if (G(S) || Te(S)) return ue !== null ? null : C(y, g, S, D, null);
        if (typeof S.then == "function") return N(y, g, Ei(S), D);
        if (S.$$typeof === B) return N(y, g, zi(y, S), D);
        Ti(y, S);
      }
      return null;
    }
    function A(y, g, S, D, ue) {
      if (typeof D == "string" && D !== "" || typeof D == "number" || typeof D == "bigint") return y = y.get(S) || null, o(g, y, "" + D, ue);
      if (typeof D == "object" && D !== null) {
        switch (D.$$typeof) {
          case de:
            return y = y.get(D.key === null ? S : D.key) || null, p(g, y, D, ue);
          case L:
            return y = y.get(D.key === null ? S : D.key) || null, z(g, y, D, ue);
          case J:
            return D = ia(D), A(y, g, S, D, ue);
        }
        if (G(D) || Te(D)) return y = y.get(S) || null, C(g, y, D, ue, null);
        if (typeof D.then == "function") return A(y, g, S, Ei(D), ue);
        if (D.$$typeof === B) return A(y, g, S, zi(g, D), ue);
        Ti(g, D);
      }
      return null;
    }
    function ee(y, g, S, D) {
      for (var ue = null, Ae = null, le = g, ve = g = 0, Ne = null; le !== null && ve < S.length; ve++) {
        le.index > ve ? (Ne = le, le = null) : Ne = le.sibling;
        var Ce = N(y, le, S[ve], D);
        if (Ce === null) {
          le === null && (le = Ne);
          break;
        }
        e && le && Ce.alternate === null && t(y, le), g = s(Ce, g, ve), Ae === null ? ue = Ce : Ae.sibling = Ce, Ae = Ce, le = Ne;
      }
      if (ve === S.length) return l(y, le), we && il(y, ve), ue;
      if (le === null) {
        for (; ve < S.length; ve++) le = R(y, S[ve], D), le !== null && (g = s(le, g, ve), Ae === null ? ue = le : Ae.sibling = le, Ae = le);
        return we && il(y, ve), ue;
      }
      for (le = a(le); ve < S.length; ve++) Ne = A(le, y, ve, S[ve], D), Ne !== null && (e && Ne.alternate !== null && le.delete(Ne.key === null ? ve : Ne.key), g = s(Ne, g, ve), Ae === null ? ue = Ne : Ae.sibling = Ne, Ae = Ne);
      return e && le.forEach(function(Zl) {
        return t(y, Zl);
      }), we && il(y, ve), ue;
    }
    function re(y, g, S, D) {
      if (S == null) throw Error(d(151));
      for (var ue = null, Ae = null, le = g, ve = g = 0, Ne = null, Ce = S.next(); le !== null && !Ce.done; ve++, Ce = S.next()) {
        le.index > ve ? (Ne = le, le = null) : Ne = le.sibling;
        var Zl = N(y, le, Ce.value, D);
        if (Zl === null) {
          le === null && (le = Ne);
          break;
        }
        e && le && Zl.alternate === null && t(y, le), g = s(Zl, g, ve), Ae === null ? ue = Zl : Ae.sibling = Zl, Ae = Zl, le = Ne;
      }
      if (Ce.done) return l(y, le), we && il(y, ve), ue;
      if (le === null) {
        for (; !Ce.done; ve++, Ce = S.next()) Ce = R(y, Ce.value, D), Ce !== null && (g = s(Ce, g, ve), Ae === null ? ue = Ce : Ae.sibling = Ce, Ae = Ce);
        return we && il(y, ve), ue;
      }
      for (le = a(le); !Ce.done; ve++, Ce = S.next()) Ce = A(le, y, ve, Ce.value, D), Ce !== null && (e && Ce.alternate !== null && le.delete(Ce.key === null ? ve : Ce.key), g = s(Ce, g, ve), Ae === null ? ue = Ce : Ae.sibling = Ce, Ae = Ce);
      return e && le.forEach(function(_h) {
        return t(y, _h);
      }), we && il(y, ve), ue;
    }
    function Be(y, g, S, D) {
      if (typeof S == "object" && S !== null && S.type === I && S.key === null && (S = S.props.children), typeof S == "object" && S !== null) {
        switch (S.$$typeof) {
          case de:
            e: {
              for (var ue = S.key; g !== null; ) {
                if (g.key === ue) {
                  if (ue = S.type, ue === I) {
                    if (g.tag === 7) {
                      l(y, g.sibling), D = i(g, S.props.children), D.return = y, y = D;
                      break e;
                    }
                  } else if (g.elementType === ue || typeof ue == "object" && ue !== null && ue.$$typeof === J && ia(ue) === g.type) {
                    l(y, g.sibling), D = i(g, S.props), Nn(D, S), D.return = y, y = D;
                    break e;
                  }
                  l(y, g);
                  break;
                } else t(y, g);
                g = g.sibling;
              }
              S.type === I ? (D = ea(S.props.children, y.mode, D, S.key), D.return = y, y = D) : (D = yi(S.type, S.key, S.props, null, y.mode, D), Nn(D, S), D.return = y, y = D);
            }
            return c(y);
          case L:
            e: {
              for (ue = S.key; g !== null; ) {
                if (g.key === ue) if (g.tag === 4 && g.stateNode.containerInfo === S.containerInfo && g.stateNode.implementation === S.implementation) {
                  l(y, g.sibling), D = i(g, S.children || []), D.return = y, y = D;
                  break e;
                } else {
                  l(y, g);
                  break;
                }
                else t(y, g);
                g = g.sibling;
              }
              D = Ps(S, y.mode, D), D.return = y, y = D;
            }
            return c(y);
          case J:
            return S = ia(S), Be(y, g, S, D);
        }
        if (G(S)) return ee(y, g, S, D);
        if (Te(S)) {
          if (ue = Te(S), typeof ue != "function") throw Error(d(150));
          return S = ue.call(S), re(y, g, S, D);
        }
        if (typeof S.then == "function") return Be(y, g, Ei(S), D);
        if (S.$$typeof === B) return Be(y, g, zi(y, S), D);
        Ti(y, S);
      }
      return typeof S == "string" && S !== "" || typeof S == "number" || typeof S == "bigint" ? (S = "" + S, g !== null && g.tag === 6 ? (l(y, g.sibling), D = i(g, S), D.return = y, y = D) : (l(y, g), D = Fs(S, y.mode, D), D.return = y, y = D), c(y)) : l(y, g);
    }
    return function(y, g, S, D) {
      try {
        zn = 0;
        var ue = Be(y, g, S, D);
        return Ra = null, ue;
      } catch (le) {
        if (le === Ua || le === _i) throw le;
        var Ae = wt(29, le, null, y.mode);
        return Ae.lanes = D, Ae.return = y, Ae;
      }
    };
  }
  var ca = fd(!0), pd = fd(!1), Ml = !1;
  function rc(e) {
    e.updateQueue = {
      baseState: e.memoizedState,
      firstBaseUpdate: null,
      lastBaseUpdate: null,
      shared: {
        pending: null,
        lanes: 0,
        hiddenCallbacks: null
      },
      callbacks: null
    };
  }
  function fc(e, t) {
    e = e.updateQueue, t.updateQueue === e && (t.updateQueue = {
      baseState: e.baseState,
      firstBaseUpdate: e.firstBaseUpdate,
      lastBaseUpdate: e.lastBaseUpdate,
      shared: e.shared,
      callbacks: null
    });
  }
  function ua(e) {
    return {
      lane: e,
      tag: 0,
      payload: null,
      callback: null,
      next: null
    };
  }
  function oa(e, t, l) {
    var a = e.updateQueue;
    if (a === null) return null;
    if (a = a.shared, (Oe & 2) !== 0) {
      var i = a.pending;
      return i === null ? t.next = t : (t.next = i.next, i.next = t), a.pending = t, t = bi(e), $o(e, null, l), t;
    }
    return vi(e, a, t, l), bi(e);
  }
  function _n(e, t, l) {
    if (t = t.updateQueue, t !== null && (t = t.shared, (l & 4194048) !== 0)) {
      var a = t.lanes;
      a &= e.pendingLanes, l |= a, t.lanes = l, lo(e, l);
    }
  }
  function pc(e, t) {
    var l = e.updateQueue, a = e.alternate;
    if (a !== null && (a = a.updateQueue, l === a)) {
      var i = null, s = null;
      if (l = l.firstBaseUpdate, l !== null) {
        do {
          var c = {
            lane: l.lane,
            tag: l.tag,
            payload: l.payload,
            callback: null,
            next: null
          };
          s === null ? i = s = c : s = s.next = c, l = l.next;
        } while (l !== null);
        s === null ? i = s = t : s = s.next = t;
      } else i = s = t;
      l = {
        baseState: a.baseState,
        firstBaseUpdate: i,
        lastBaseUpdate: s,
        shared: a.shared,
        callbacks: a.callbacks
      }, e.updateQueue = l;
      return;
    }
    e = l.lastBaseUpdate, e === null ? l.firstBaseUpdate = t : e.next = t, l.lastBaseUpdate = t;
  }
  var hc = !1;
  function wn() {
    if (hc) {
      var e = Da;
      if (e !== null) throw e;
    }
  }
  function En(e, t, l, a) {
    hc = !1;
    var i = e.updateQueue;
    Ml = !1;
    var s = i.firstBaseUpdate, c = i.lastBaseUpdate, o = i.shared.pending;
    if (o !== null) {
      i.shared.pending = null;
      var p = o, z = p.next;
      p.next = null, c === null ? s = z : c.next = z, c = p;
      var C = e.alternate;
      C !== null && (C = C.updateQueue, o = C.lastBaseUpdate, o !== c && (o === null ? C.firstBaseUpdate = z : o.next = z, C.lastBaseUpdate = p));
    }
    if (s !== null) {
      var R = i.baseState;
      c = 0, C = z = p = null, o = s;
      do {
        var N = o.lane & -536870913, A = N !== o.lane;
        if (A ? (ze & N) === N : (a & N) === N) {
          N !== 0 && N === ka && (hc = !0), C !== null && (C = C.next = {
            lane: 0,
            tag: o.tag,
            payload: o.payload,
            callback: null,
            next: null
          });
          e: {
            var ee = e, re = o;
            N = t;
            var Be = l;
            switch (re.tag) {
              case 1:
                if (ee = re.payload, typeof ee == "function") {
                  R = ee.call(Be, R, N);
                  break e;
                }
                R = ee;
                break e;
              case 3:
                ee.flags = ee.flags & -65537 | 128;
              case 0:
                if (ee = re.payload, N = typeof ee == "function" ? ee.call(Be, R, N) : ee, N == null) break e;
                R = H({}, R, N);
                break e;
              case 2:
                Ml = !0;
            }
          }
          N = o.callback, N !== null && (e.flags |= 64, A && (e.flags |= 8192), A = i.callbacks, A === null ? i.callbacks = [N] : A.push(N));
        } else A = {
          lane: N,
          tag: o.tag,
          payload: o.payload,
          callback: o.callback,
          next: null
        }, C === null ? (z = C = A, p = R) : C = C.next = A, c |= N;
        if (o = o.next, o === null) {
          if (o = i.shared.pending, o === null) break;
          A = o, o = A.next, A.next = null, i.lastBaseUpdate = A, i.shared.pending = null;
        }
      } while (!0);
      C === null && (p = R), i.baseState = p, i.firstBaseUpdate = z, i.lastBaseUpdate = C, s === null && (i.shared.lanes = 0), Rl |= c, e.lanes = c, e.memoizedState = R;
    }
  }
  function hd(e, t) {
    if (typeof e != "function") throw Error(d(191, e));
    e.call(t);
  }
  function md(e, t) {
    var l = e.callbacks;
    if (l !== null) for (e.callbacks = null, e = 0; e < l.length; e++) hd(l[e], t);
  }
  var qa = m(null), Ai = m(0);
  function xd(e, t) {
    e = xl, X(Ai, e), X(qa, t), xl = e | t.baseLanes;
  }
  function mc() {
    X(Ai, xl), X(qa, qa.current);
  }
  function xc() {
    xl = Ai.current, U(qa), U(Ai);
  }
  var Et = m(null), Bt = null;
  function Ol(e) {
    var t = e.alternate;
    X(We, We.current & 1), X(Et, e), Bt === null && (t === null || qa.current !== null || t.memoizedState !== null) && (Bt = e);
  }
  function gc(e) {
    X(We, We.current), X(Et, e), Bt === null && (Bt = e);
  }
  function gd(e) {
    e.tag === 22 ? (X(We, We.current), X(Et, e), Bt === null && (Bt = e)) : kl(e);
  }
  function kl() {
    X(We, We.current), X(Et, Et.current);
  }
  function Tt(e) {
    U(Et), Bt === e && (Bt = null), U(We);
  }
  var We = m(0);
  function Ci(e) {
    for (var t = e; t !== null; ) {
      if (t.tag === 13) {
        var l = t.memoizedState;
        if (l !== null && (l = l.dehydrated, l === null || Su(l) || zu(l))) return t;
      } else if (t.tag === 19 && (t.memoizedProps.revealOrder === "forwards" || t.memoizedProps.revealOrder === "backwards" || t.memoizedProps.revealOrder === "unstable_legacy-backwards" || t.memoizedProps.revealOrder === "together")) {
        if ((t.flags & 128) !== 0) return t;
      } else if (t.child !== null) {
        t.child.return = t, t = t.child;
        continue;
      }
      if (t === e) break;
      for (; t.sibling === null; ) {
        if (t.return === null || t.return === e) return null;
        t = t.return;
      }
      t.sibling.return = t.return, t = t.sibling;
    }
    return null;
  }
  var ul = 0, ge = null, qe = null, tt = null, Mi = !1, Ha = !1, da = !1, Oi = 0, Tn = 0, Ba = null, r0 = 0;
  function Je() {
    throw Error(d(321));
  }
  function vc(e, t) {
    if (t === null) return !1;
    for (var l = 0; l < t.length && l < e.length; l++) if (!_t(e[l], t[l])) return !1;
    return !0;
  }
  function bc(e, t, l, a, i, s) {
    return ul = s, ge = t, t.memoizedState = null, t.updateQueue = null, t.lanes = 0, O.H = e === null || e.memoizedState === null ? er : Dc, da = !1, s = l(a, i), da = !1, Ha && (s = bd(t, l, a, i)), vd(e), s;
  }
  function vd(e) {
    O.H = Mn;
    var t = qe !== null && qe.next !== null;
    if (ul = 0, tt = qe = ge = null, Mi = !1, Tn = 0, Ba = null, t) throw Error(d(300));
    e === null || lt || (e = e.dependencies, e !== null && Si(e) && (lt = !0));
  }
  function bd(e, t, l, a) {
    ge = e;
    var i = 0;
    do {
      if (Ha && (Ba = null), Tn = 0, Ha = !1, 25 <= i) throw Error(d(301));
      if (i += 1, tt = qe = null, e.updateQueue != null) {
        var s = e.updateQueue;
        s.lastEffect = null, s.events = null, s.stores = null, s.memoCache != null && (s.memoCache.index = 0);
      }
      O.H = tr, s = t(l, a);
    } while (Ha);
    return s;
  }
  function f0() {
    var e = O.H, t = e.useState()[0];
    return t = typeof t.then == "function" ? An(t) : t, e = e.useState()[0], (qe !== null ? qe.memoizedState : null) !== e && (ge.flags |= 1024), t;
  }
  function yc() {
    var e = Oi !== 0;
    return Oi = 0, e;
  }
  function jc(e, t, l) {
    t.updateQueue = e.updateQueue, t.flags &= -2053, e.lanes &= ~l;
  }
  function Sc(e) {
    if (Mi) {
      for (e = e.memoizedState; e !== null; ) {
        var t = e.queue;
        t !== null && (t.pending = null), e = e.next;
      }
      Mi = !1;
    }
    ul = 0, tt = qe = ge = null, Ha = !1, Tn = Oi = 0, Ba = null;
  }
  function mt() {
    var e = {
      memoizedState: null,
      baseState: null,
      baseQueue: null,
      queue: null,
      next: null
    };
    return tt === null ? ge.memoizedState = tt = e : tt = tt.next = e, tt;
  }
  function Fe() {
    if (qe === null) {
      var e = ge.alternate;
      e = e !== null ? e.memoizedState : null;
    } else e = qe.next;
    var t = tt === null ? ge.memoizedState : tt.next;
    if (t !== null) tt = t, qe = e;
    else {
      if (e === null)
        throw ge.alternate === null ? Error(d(467)) : Error(d(310));
      qe = e, e = {
        memoizedState: qe.memoizedState,
        baseState: qe.baseState,
        baseQueue: qe.baseQueue,
        queue: qe.queue,
        next: null
      }, tt === null ? ge.memoizedState = tt = e : tt = tt.next = e;
    }
    return tt;
  }
  function ki() {
    return {
      lastEffect: null,
      events: null,
      stores: null,
      memoCache: null
    };
  }
  function An(e) {
    var t = Tn;
    return Tn += 1, Ba === null && (Ba = []), e = od(Ba, e, t), t = ge, (tt === null ? t.memoizedState : tt.next) === null && (t = t.alternate, O.H = t === null || t.memoizedState === null ? er : Dc), e;
  }
  function Di(e) {
    if (e !== null && typeof e == "object") {
      if (typeof e.then == "function") return An(e);
      if (e.$$typeof === B) return rt(e);
    }
    throw Error(d(438, String(e)));
  }
  function zc(e) {
    var t = null, l = ge.updateQueue;
    if (l !== null && (t = l.memoCache), t == null) {
      var a = ge.alternate;
      a !== null && (a = a.updateQueue, a !== null && (a = a.memoCache, a != null && (t = {
        data: a.data.map(function(i) {
          return i.slice();
        }),
        index: 0
      })));
    }
    if (t ??= {
      data: [],
      index: 0
    }, l === null && (l = ki(), ge.updateQueue = l), l.memoCache = t, l = t.data[t.index], l === void 0) for (l = t.data[t.index] = Array(e), a = 0; a < e; a++) l[a] = te;
    return t.index++, l;
  }
  function ol(e, t) {
    return typeof t == "function" ? t(e) : t;
  }
  function Ui(e) {
    return Nc(Fe(), qe, e);
  }
  function Nc(e, t, l) {
    var a = e.queue;
    if (a === null) throw Error(d(311));
    a.lastRenderedReducer = l;
    var i = e.baseQueue, s = a.pending;
    if (s !== null) {
      if (i !== null) {
        var c = i.next;
        i.next = s.next, s.next = c;
      }
      t.baseQueue = i = s, a.pending = null;
    }
    if (s = e.baseState, i === null) e.memoizedState = s;
    else {
      t = i.next;
      var o = c = null, p = null, z = t, C = !1;
      do {
        var R = z.lane & -536870913;
        if (R !== z.lane ? (ze & R) === R : (ul & R) === R) {
          var N = z.revertLane;
          if (N === 0) p !== null && (p = p.next = {
            lane: 0,
            revertLane: 0,
            gesture: null,
            action: z.action,
            hasEagerState: z.hasEagerState,
            eagerState: z.eagerState,
            next: null
          }), R === ka && (C = !0);
          else if ((ul & N) === N) {
            z = z.next, N === ka && (C = !0);
            continue;
          } else R = {
            lane: 0,
            revertLane: z.revertLane,
            gesture: null,
            action: z.action,
            hasEagerState: z.hasEagerState,
            eagerState: z.eagerState,
            next: null
          }, p === null ? (o = p = R, c = s) : p = p.next = R, ge.lanes |= N, Rl |= N;
          R = z.action, da && l(s, R), s = z.hasEagerState ? z.eagerState : l(s, R);
        } else N = {
          lane: R,
          revertLane: z.revertLane,
          gesture: z.gesture,
          action: z.action,
          hasEagerState: z.hasEagerState,
          eagerState: z.eagerState,
          next: null
        }, p === null ? (o = p = N, c = s) : p = p.next = N, ge.lanes |= R, Rl |= R;
        z = z.next;
      } while (z !== null && z !== t);
      if (p === null ? c = s : p.next = o, !_t(s, e.memoizedState) && (lt = !0, C && (l = Da, l !== null))) throw l;
      e.memoizedState = s, e.baseState = c, e.baseQueue = p, a.lastRenderedState = s;
    }
    return i === null && (a.lanes = 0), [e.memoizedState, a.dispatch];
  }
  function _c(e) {
    var t = Fe(), l = t.queue;
    if (l === null) throw Error(d(311));
    l.lastRenderedReducer = e;
    var a = l.dispatch, i = l.pending, s = t.memoizedState;
    if (i !== null) {
      l.pending = null;
      var c = i = i.next;
      do
        s = e(s, c.action), c = c.next;
      while (c !== i);
      _t(s, t.memoizedState) || (lt = !0), t.memoizedState = s, t.baseQueue === null && (t.baseState = s), l.lastRenderedState = s;
    }
    return [s, a];
  }
  function yd(e, t, l) {
    var a = ge, i = Fe(), s = we;
    if (s) {
      if (l === void 0) throw Error(d(407));
      l = l();
    } else l = t();
    var c = !_t((qe || i).memoizedState, l);
    if (c && (i.memoizedState = l, lt = !0), i = i.queue, Tc(zd.bind(null, a, i, e), [e]), i.getSnapshot !== t || c || tt !== null && tt.memoizedState.tag & 1) {
      if (a.flags |= 2048, La(9, { destroy: void 0 }, Sd.bind(null, a, i, l, t), null), Ge === null) throw Error(d(349));
      s || (ul & 127) !== 0 || jd(a, t, l);
    }
    return l;
  }
  function jd(e, t, l) {
    e.flags |= 16384, e = {
      getSnapshot: t,
      value: l
    }, t = ge.updateQueue, t === null ? (t = ki(), ge.updateQueue = t, t.stores = [e]) : (l = t.stores, l === null ? t.stores = [e] : l.push(e));
  }
  function Sd(e, t, l, a) {
    t.value = l, t.getSnapshot = a, Nd(t) && _d(e);
  }
  function zd(e, t, l) {
    return l(function() {
      Nd(t) && _d(e);
    });
  }
  function Nd(e) {
    var t = e.getSnapshot;
    e = e.value;
    try {
      var l = t();
      return !_t(e, l);
    } catch {
      return !0;
    }
  }
  function _d(e) {
    var t = Pl(e, 2);
    t !== null && St(t, e, 2);
  }
  function wc(e) {
    var t = mt();
    if (typeof e == "function") {
      var l = e;
      if (e = l(), da) {
        Nl(!0);
        try {
          l();
        } finally {
          Nl(!1);
        }
      }
    }
    return t.memoizedState = t.baseState = e, t.queue = {
      pending: null,
      lanes: 0,
      dispatch: null,
      lastRenderedReducer: ol,
      lastRenderedState: e
    }, t;
  }
  function wd(e, t, l, a) {
    return e.baseState = l, Nc(e, qe, typeof a == "function" ? a : ol);
  }
  function p0(e, t, l, a, i) {
    if (Hi(e)) throw Error(d(485));
    if (e = t.action, e !== null) {
      var s = {
        payload: i,
        action: e,
        next: null,
        isTransition: !0,
        status: "pending",
        value: null,
        reason: null,
        listeners: [],
        then: function(c) {
          s.listeners.push(c);
        }
      };
      O.T !== null ? l(!0) : s.isTransition = !1, a(s), l = t.pending, l === null ? (s.next = t.pending = s, Ed(t, s)) : (s.next = l.next, t.pending = l.next = s);
    }
  }
  function Ed(e, t) {
    var l = t.action, a = t.payload, i = e.state;
    if (t.isTransition) {
      var s = O.T, c = {};
      O.T = c;
      try {
        var o = l(i, a), p = O.S;
        p !== null && p(c, o), Td(e, t, o);
      } catch (z) {
        Ec(e, t, z);
      } finally {
        s !== null && c.types !== null && (s.types = c.types), O.T = s;
      }
    } else try {
      s = l(i, a), Td(e, t, s);
    } catch (z) {
      Ec(e, t, z);
    }
  }
  function Td(e, t, l) {
    l !== null && typeof l == "object" && typeof l.then == "function" ? l.then(function(a) {
      Ad(e, t, a);
    }, function(a) {
      return Ec(e, t, a);
    }) : Ad(e, t, l);
  }
  function Ad(e, t, l) {
    t.status = "fulfilled", t.value = l, Cd(t), e.state = l, t = e.pending, t !== null && (l = t.next, l === t ? e.pending = null : (l = l.next, t.next = l, Ed(e, l)));
  }
  function Ec(e, t, l) {
    var a = e.pending;
    if (e.pending = null, a !== null) {
      a = a.next;
      do
        t.status = "rejected", t.reason = l, Cd(t), t = t.next;
      while (t !== a);
    }
    e.action = null;
  }
  function Cd(e) {
    e = e.listeners;
    for (var t = 0; t < e.length; t++) (0, e[t])();
  }
  function Md(e, t) {
    return t;
  }
  function Od(e, t) {
    if (we) {
      var l = Ge.formState;
      if (l !== null) {
        e: {
          var a = ge;
          if (we) {
            if (Ve) {
              t: {
                for (var i = Ve, s = Ht; i.nodeType !== 8; ) {
                  if (!s) {
                    i = null;
                    break t;
                  }
                  if (i = Gt(i.nextSibling), i === null) {
                    i = null;
                    break t;
                  }
                }
                s = i.data, i = s === "F!" || s === "F" ? i : null;
              }
              if (i) {
                Ve = Gt(i.nextSibling), a = i.data === "F!";
                break e;
              }
            }
            Al(a);
          }
          a = !1;
        }
        a && (t = l[0]);
      }
    }
    return l = mt(), l.memoizedState = l.baseState = t, a = {
      pending: null,
      lanes: 0,
      dispatch: null,
      lastRenderedReducer: Md,
      lastRenderedState: t
    }, l.queue = a, l = Wd.bind(null, ge, a), a.dispatch = l, a = wc(!1), s = kc.bind(null, ge, !1, a.queue), a = mt(), i = {
      state: t,
      dispatch: null,
      action: e,
      pending: null
    }, a.queue = i, l = p0.bind(null, ge, i, s, l), i.dispatch = l, a.memoizedState = e, [
      t,
      l,
      !1
    ];
  }
  function kd(e) {
    return Dd(Fe(), qe, e);
  }
  function Dd(e, t, l) {
    if (t = Nc(e, t, Md)[0], e = Ui(ol)[0], typeof t == "object" && t !== null && typeof t.then == "function") try {
      var a = An(t);
    } catch (c) {
      throw c === Ua ? _i : c;
    }
    else a = t;
    t = Fe();
    var i = t.queue, s = i.dispatch;
    return l !== t.memoizedState && (ge.flags |= 2048, La(9, { destroy: void 0 }, h0.bind(null, i, l), null)), [
      a,
      s,
      e
    ];
  }
  function h0(e, t) {
    e.action = t;
  }
  function Ud(e) {
    var t = Fe(), l = qe;
    if (l !== null) return Dd(t, l, e);
    Fe(), t = t.memoizedState, l = Fe();
    var a = l.queue.dispatch;
    return l.memoizedState = e, [
      t,
      a,
      !1
    ];
  }
  function La(e, t, l, a) {
    return e = {
      tag: e,
      create: l,
      deps: a,
      inst: t,
      next: null
    }, t = ge.updateQueue, t === null && (t = ki(), ge.updateQueue = t), l = t.lastEffect, l === null ? t.lastEffect = e.next = e : (a = l.next, l.next = e, e.next = a, t.lastEffect = e), e;
  }
  function Rd() {
    return Fe().memoizedState;
  }
  function Ri(e, t, l, a) {
    var i = mt();
    ge.flags |= e, i.memoizedState = La(1 | t, { destroy: void 0 }, l, a === void 0 ? null : a);
  }
  function qi(e, t, l, a) {
    var i = Fe();
    a = a === void 0 ? null : a;
    var s = i.memoizedState.inst;
    qe !== null && a !== null && vc(a, qe.memoizedState.deps) ? i.memoizedState = La(t, s, l, a) : (ge.flags |= e, i.memoizedState = La(1 | t, s, l, a));
  }
  function qd(e, t) {
    Ri(8390656, 8, e, t);
  }
  function Tc(e, t) {
    qi(2048, 8, e, t);
  }
  function m0(e) {
    ge.flags |= 4;
    var t = ge.updateQueue;
    if (t === null) t = ki(), ge.updateQueue = t, t.events = [e];
    else {
      var l = t.events;
      l === null ? t.events = [e] : l.push(e);
    }
  }
  function Hd(e) {
    var t = Fe().memoizedState;
    return m0({
      ref: t,
      nextImpl: e
    }), function() {
      if ((Oe & 2) !== 0) throw Error(d(440));
      return t.impl.apply(void 0, arguments);
    };
  }
  function Bd(e, t) {
    return qi(4, 2, e, t);
  }
  function Ld(e, t) {
    return qi(4, 4, e, t);
  }
  function Gd(e, t) {
    if (typeof t == "function") {
      e = e();
      var l = t(e);
      return function() {
        typeof l == "function" ? l() : t(null);
      };
    }
    if (t != null) return e = e(), t.current = e, function() {
      t.current = null;
    };
  }
  function Yd(e, t, l) {
    l = l != null ? l.concat([e]) : null, qi(4, 4, Gd.bind(null, t, e), l);
  }
  function Ac() {
  }
  function Vd(e, t) {
    var l = Fe();
    t = t === void 0 ? null : t;
    var a = l.memoizedState;
    return t !== null && vc(t, a[1]) ? a[0] : (l.memoizedState = [e, t], e);
  }
  function Xd(e, t) {
    var l = Fe();
    t = t === void 0 ? null : t;
    var a = l.memoizedState;
    if (t !== null && vc(t, a[1])) return a[0];
    if (a = e(), da) {
      Nl(!0);
      try {
        e();
      } finally {
        Nl(!1);
      }
    }
    return l.memoizedState = [a, t], a;
  }
  function Cc(e, t, l) {
    return l === void 0 || (ul & 1073741824) !== 0 && (ze & 261930) === 0 ? e.memoizedState = t : (e.memoizedState = l, e = Yr(), ge.lanes |= e, Rl |= e, l);
  }
  function Qd(e, t, l, a) {
    return _t(l, t) ? l : qa.current !== null ? (e = Cc(e, l, a), _t(e, t) || (lt = !0), e) : (ul & 42) === 0 || (ul & 1073741824) !== 0 && (ze & 261930) === 0 ? (lt = !0, e.memoizedState = l) : (e = Yr(), ge.lanes |= e, Rl |= e, t);
  }
  function Zd(e, t, l, a, i) {
    var s = V.p;
    V.p = s !== 0 && 8 > s ? s : 8;
    var c = O.T, o = {};
    O.T = o, kc(e, !1, t, l);
    try {
      var p = i(), z = O.S;
      z !== null && z(o, p), p !== null && typeof p == "object" && typeof p.then == "function" ? Cn(e, t, d0(p, a), Lt(e)) : Cn(e, t, a, Lt(e));
    } catch (C) {
      Cn(e, t, {
        then: function() {
        },
        status: "rejected",
        reason: C
      }, Lt());
    } finally {
      V.p = s, c !== null && o.types !== null && (c.types = o.types), O.T = c;
    }
  }
  function x0() {
  }
  function Mc(e, t, l, a) {
    if (e.tag !== 5) throw Error(d(476));
    var i = Kd(e).queue;
    Zd(e, i, t, ye, l === null ? x0 : function() {
      return Jd(e), l(a);
    });
  }
  function Kd(e) {
    var t = e.memoizedState;
    if (t !== null) return t;
    t = {
      memoizedState: ye,
      baseState: ye,
      baseQueue: null,
      queue: {
        pending: null,
        lanes: 0,
        dispatch: null,
        lastRenderedReducer: ol,
        lastRenderedState: ye
      },
      next: null
    };
    var l = {};
    return t.next = {
      memoizedState: l,
      baseState: l,
      baseQueue: null,
      queue: {
        pending: null,
        lanes: 0,
        dispatch: null,
        lastRenderedReducer: ol,
        lastRenderedState: l
      },
      next: null
    }, e.memoizedState = t, e = e.alternate, e !== null && (e.memoizedState = t), t;
  }
  function Jd(e) {
    var t = Kd(e);
    t.next === null && (t = e.alternate.memoizedState), Cn(e, t.next.queue, {}, Lt());
  }
  function Oc() {
    return rt(Kn);
  }
  function Id() {
    return Fe().memoizedState;
  }
  function $d() {
    return Fe().memoizedState;
  }
  function g0(e) {
    for (var t = e.return; t !== null; ) {
      switch (t.tag) {
        case 24:
        case 3:
          var l = Lt();
          e = ua(l);
          var a = oa(t, e, l);
          a !== null && (St(a, t, l), _n(a, t, l)), t = { cache: cc() }, e.payload = t;
          return;
      }
      t = t.return;
    }
  }
  function v0(e, t, l) {
    var a = Lt();
    l = {
      lane: a,
      revertLane: 0,
      gesture: null,
      action: l,
      hasEagerState: !1,
      eagerState: null,
      next: null
    }, Hi(e) ? Fd(t, l) : (l = $s(e, t, l, a), l !== null && (St(l, e, a), Pd(l, t, a)));
  }
  function Wd(e, t, l) {
    Cn(e, t, l, Lt());
  }
  function Cn(e, t, l, a) {
    var i = {
      lane: a,
      revertLane: 0,
      gesture: null,
      action: l,
      hasEagerState: !1,
      eagerState: null,
      next: null
    };
    if (Hi(e)) Fd(t, i);
    else {
      var s = e.alternate;
      if (e.lanes === 0 && (s === null || s.lanes === 0) && (s = t.lastRenderedReducer, s !== null)) try {
        var c = t.lastRenderedState, o = s(c, l);
        if (i.hasEagerState = !0, i.eagerState = o, _t(o, c)) return vi(e, t, i, 0), Ge === null && gi(), !1;
      } catch {
      }
      if (l = $s(e, t, i, a), l !== null) return St(l, e, a), Pd(l, t, a), !0;
    }
    return !1;
  }
  function kc(e, t, l, a) {
    if (a = {
      lane: 2,
      revertLane: ru(),
      gesture: null,
      action: a,
      hasEagerState: !1,
      eagerState: null,
      next: null
    }, Hi(e)) {
      if (t) throw Error(d(479));
    } else t = $s(e, l, a, 2), t !== null && St(t, e, 2);
  }
  function Hi(e) {
    var t = e.alternate;
    return e === ge || t !== null && t === ge;
  }
  function Fd(e, t) {
    Ha = Mi = !0;
    var l = e.pending;
    l === null ? t.next = t : (t.next = l.next, l.next = t), e.pending = t;
  }
  function Pd(e, t, l) {
    if ((l & 4194048) !== 0) {
      var a = t.lanes;
      a &= e.pendingLanes, l |= a, t.lanes = l, lo(e, l);
    }
  }
  var Mn = {
    readContext: rt,
    use: Di,
    useCallback: Je,
    useContext: Je,
    useEffect: Je,
    useImperativeHandle: Je,
    useLayoutEffect: Je,
    useInsertionEffect: Je,
    useMemo: Je,
    useReducer: Je,
    useRef: Je,
    useState: Je,
    useDebugValue: Je,
    useDeferredValue: Je,
    useTransition: Je,
    useSyncExternalStore: Je,
    useId: Je,
    useHostTransitionStatus: Je,
    useFormState: Je,
    useActionState: Je,
    useOptimistic: Je,
    useMemoCache: Je,
    useCacheRefresh: Je
  };
  Mn.useEffectEvent = Je;
  var er = {
    readContext: rt,
    use: Di,
    useCallback: function(e, t) {
      return mt().memoizedState = [e, t === void 0 ? null : t], e;
    },
    useContext: rt,
    useEffect: qd,
    useImperativeHandle: function(e, t, l) {
      l = l != null ? l.concat([e]) : null, Ri(4194308, 4, Gd.bind(null, t, e), l);
    },
    useLayoutEffect: function(e, t) {
      return Ri(4194308, 4, e, t);
    },
    useInsertionEffect: function(e, t) {
      Ri(4, 2, e, t);
    },
    useMemo: function(e, t) {
      var l = mt();
      t = t === void 0 ? null : t;
      var a = e();
      if (da) {
        Nl(!0);
        try {
          e();
        } finally {
          Nl(!1);
        }
      }
      return l.memoizedState = [a, t], a;
    },
    useReducer: function(e, t, l) {
      var a = mt();
      if (l !== void 0) {
        var i = l(t);
        if (da) {
          Nl(!0);
          try {
            l(t);
          } finally {
            Nl(!1);
          }
        }
      } else i = t;
      return a.memoizedState = a.baseState = i, e = {
        pending: null,
        lanes: 0,
        dispatch: null,
        lastRenderedReducer: e,
        lastRenderedState: i
      }, a.queue = e, e = e.dispatch = v0.bind(null, ge, e), [a.memoizedState, e];
    },
    useRef: function(e) {
      var t = mt();
      return e = { current: e }, t.memoizedState = e;
    },
    useState: function(e) {
      e = wc(e);
      var t = e.queue, l = Wd.bind(null, ge, t);
      return t.dispatch = l, [e.memoizedState, l];
    },
    useDebugValue: Ac,
    useDeferredValue: function(e, t) {
      return Cc(mt(), e, t);
    },
    useTransition: function() {
      var e = wc(!1);
      return e = Zd.bind(null, ge, e.queue, !0, !1), mt().memoizedState = e, [!1, e];
    },
    useSyncExternalStore: function(e, t, l) {
      var a = ge, i = mt();
      if (we) {
        if (l === void 0) throw Error(d(407));
        l = l();
      } else {
        if (l = t(), Ge === null) throw Error(d(349));
        (ze & 127) !== 0 || jd(a, t, l);
      }
      i.memoizedState = l;
      var s = {
        value: l,
        getSnapshot: t
      };
      return i.queue = s, qd(zd.bind(null, a, s, e), [e]), a.flags |= 2048, La(9, { destroy: void 0 }, Sd.bind(null, a, s, l, t), null), l;
    },
    useId: function() {
      var e = mt(), t = Ge.identifierPrefix;
      if (we) {
        var l = Wt, a = $t;
        l = (a & ~(1 << 32 - Nt(a) - 1)).toString(32) + l, t = "_" + t + "R_" + l, l = Oi++, 0 < l && (t += "H" + l.toString(32)), t += "_";
      } else l = r0++, t = "_" + t + "r_" + l.toString(32) + "_";
      return e.memoizedState = t;
    },
    useHostTransitionStatus: Oc,
    useFormState: Od,
    useActionState: Od,
    useOptimistic: function(e) {
      var t = mt();
      t.memoizedState = t.baseState = e;
      var l = {
        pending: null,
        lanes: 0,
        dispatch: null,
        lastRenderedReducer: null,
        lastRenderedState: null
      };
      return t.queue = l, t = kc.bind(null, ge, !0, l), l.dispatch = t, [e, t];
    },
    useMemoCache: zc,
    useCacheRefresh: function() {
      return mt().memoizedState = g0.bind(null, ge);
    },
    useEffectEvent: function(e) {
      var t = mt(), l = { impl: e };
      return t.memoizedState = l, function() {
        if ((Oe & 2) !== 0) throw Error(d(440));
        return l.impl.apply(void 0, arguments);
      };
    }
  }, Dc = {
    readContext: rt,
    use: Di,
    useCallback: Vd,
    useContext: rt,
    useEffect: Tc,
    useImperativeHandle: Yd,
    useInsertionEffect: Bd,
    useLayoutEffect: Ld,
    useMemo: Xd,
    useReducer: Ui,
    useRef: Rd,
    useState: function() {
      return Ui(ol);
    },
    useDebugValue: Ac,
    useDeferredValue: function(e, t) {
      return Qd(Fe(), qe.memoizedState, e, t);
    },
    useTransition: function() {
      var e = Ui(ol)[0], t = Fe().memoizedState;
      return [typeof e == "boolean" ? e : An(e), t];
    },
    useSyncExternalStore: yd,
    useId: Id,
    useHostTransitionStatus: Oc,
    useFormState: kd,
    useActionState: kd,
    useOptimistic: function(e, t) {
      return wd(Fe(), qe, e, t);
    },
    useMemoCache: zc,
    useCacheRefresh: $d
  };
  Dc.useEffectEvent = Hd;
  var tr = {
    readContext: rt,
    use: Di,
    useCallback: Vd,
    useContext: rt,
    useEffect: Tc,
    useImperativeHandle: Yd,
    useInsertionEffect: Bd,
    useLayoutEffect: Ld,
    useMemo: Xd,
    useReducer: _c,
    useRef: Rd,
    useState: function() {
      return _c(ol);
    },
    useDebugValue: Ac,
    useDeferredValue: function(e, t) {
      var l = Fe();
      return qe === null ? Cc(l, e, t) : Qd(l, qe.memoizedState, e, t);
    },
    useTransition: function() {
      var e = _c(ol)[0], t = Fe().memoizedState;
      return [typeof e == "boolean" ? e : An(e), t];
    },
    useSyncExternalStore: yd,
    useId: Id,
    useHostTransitionStatus: Oc,
    useFormState: Ud,
    useActionState: Ud,
    useOptimistic: function(e, t) {
      var l = Fe();
      return qe !== null ? wd(l, qe, e, t) : (l.baseState = e, [e, l.queue.dispatch]);
    },
    useMemoCache: zc,
    useCacheRefresh: $d
  };
  tr.useEffectEvent = Hd;
  function Uc(e, t, l, a) {
    t = e.memoizedState, l = l(a, t), l = l == null ? t : H({}, t, l), e.memoizedState = l, e.lanes === 0 && (e.updateQueue.baseState = l);
  }
  var Rc = {
    enqueueSetState: function(e, t, l) {
      e = e._reactInternals;
      var a = Lt(), i = ua(a);
      i.payload = t, l != null && (i.callback = l), t = oa(e, i, a), t !== null && (St(t, e, a), _n(t, e, a));
    },
    enqueueReplaceState: function(e, t, l) {
      e = e._reactInternals;
      var a = Lt(), i = ua(a);
      i.tag = 1, i.payload = t, l != null && (i.callback = l), t = oa(e, i, a), t !== null && (St(t, e, a), _n(t, e, a));
    },
    enqueueForceUpdate: function(e, t) {
      e = e._reactInternals;
      var l = Lt(), a = ua(l);
      a.tag = 2, t != null && (a.callback = t), t = oa(e, a, l), t !== null && (St(t, e, l), _n(t, e, l));
    }
  };
  function lr(e, t, l, a, i, s, c) {
    return e = e.stateNode, typeof e.shouldComponentUpdate == "function" ? e.shouldComponentUpdate(a, s, c) : t.prototype && t.prototype.isPureReactComponent ? !gn(l, a) || !gn(i, s) : !0;
  }
  function ar(e, t, l, a) {
    e = t.state, typeof t.componentWillReceiveProps == "function" && t.componentWillReceiveProps(l, a), typeof t.UNSAFE_componentWillReceiveProps == "function" && t.UNSAFE_componentWillReceiveProps(l, a), t.state !== e && Rc.enqueueReplaceState(t, t.state, null);
  }
  function ra(e, t) {
    var l = t;
    if ("ref" in t) {
      l = {};
      for (var a in t) a !== "ref" && (l[a] = t[a]);
    }
    if (e = e.defaultProps) {
      l === t && (l = H({}, l));
      for (var i in e) l[i] === void 0 && (l[i] = e[i]);
    }
    return l;
  }
  function b0(e) {
    xi(e);
  }
  function y0(e) {
    console.error(e);
  }
  function j0(e) {
    xi(e);
  }
  function Bi(e, t) {
    try {
      var l = e.onUncaughtError;
      l(t.value, { componentStack: t.stack });
    } catch (a) {
      setTimeout(function() {
        throw a;
      });
    }
  }
  function nr(e, t, l) {
    try {
      var a = e.onCaughtError;
      a(l.value, {
        componentStack: l.stack,
        errorBoundary: t.tag === 1 ? t.stateNode : null
      });
    } catch (i) {
      setTimeout(function() {
        throw i;
      });
    }
  }
  function qc(e, t, l) {
    return l = ua(l), l.tag = 3, l.payload = { element: null }, l.callback = function() {
      Bi(e, t);
    }, l;
  }
  function ir(e) {
    return e = ua(e), e.tag = 3, e;
  }
  function sr(e, t, l, a) {
    var i = l.type.getDerivedStateFromError;
    if (typeof i == "function") {
      var s = a.value;
      e.payload = function() {
        return i(s);
      }, e.callback = function() {
        nr(t, l, a);
      };
    }
    var c = l.stateNode;
    c !== null && typeof c.componentDidCatch == "function" && (e.callback = function() {
      nr(t, l, a), typeof i != "function" && (ql === null ? ql = /* @__PURE__ */ new Set([this]) : ql.add(this));
      var o = a.stack;
      this.componentDidCatch(a.value, { componentStack: o !== null ? o : "" });
    });
  }
  function S0(e, t, l, a, i) {
    if (l.flags |= 32768, a !== null && typeof a == "object" && typeof a.then == "function") {
      if (t = l.alternate, t !== null && Oa(t, l, i, !0), l = Et.current, l !== null) {
        switch (l.tag) {
          case 31:
          case 13:
            return Bt === null ? Wi() : l.alternate === null && Ie === 0 && (Ie = 3), l.flags &= -257, l.flags |= 65536, l.lanes = i, a === wi ? l.flags |= 16384 : (t = l.updateQueue, t === null ? l.updateQueue = /* @__PURE__ */ new Set([a]) : t.add(a), uu(e, a, i)), !1;
          case 22:
            return l.flags |= 65536, a === wi ? l.flags |= 16384 : (t = l.updateQueue, t === null ? (t = {
              transitions: null,
              markerInstances: null,
              retryQueue: /* @__PURE__ */ new Set([a])
            }, l.updateQueue = t) : (l = t.retryQueue, l === null ? t.retryQueue = /* @__PURE__ */ new Set([a]) : l.add(a)), uu(e, a, i)), !1;
        }
        throw Error(d(435, l.tag));
      }
      return uu(e, a, i), Wi(), !1;
    }
    if (we) return t = Et.current, t !== null ? ((t.flags & 65536) === 0 && (t.flags |= 256), t.flags |= 65536, t.lanes = i, a !== lc && (e = Error(d(422), { cause: a }), yn(Ut(e, l)))) : (a !== lc && (t = Error(d(423), { cause: a }), yn(Ut(t, l))), e = e.current.alternate, e.flags |= 65536, i &= -i, e.lanes |= i, a = Ut(a, l), i = qc(e.stateNode, a, i), pc(e, i), Ie !== 4 && (Ie = 2)), !1;
    var s = Error(d(520), { cause: a });
    if (s = Ut(s, l), Bn === null ? Bn = [s] : Bn.push(s), Ie !== 4 && (Ie = 2), t === null) return !0;
    a = Ut(a, l), l = t;
    do {
      switch (l.tag) {
        case 3:
          return l.flags |= 65536, e = i & -i, l.lanes |= e, e = qc(l.stateNode, a, e), pc(l, e), !1;
        case 1:
          if (t = l.type, s = l.stateNode, (l.flags & 128) === 0 && (typeof t.getDerivedStateFromError == "function" || s !== null && typeof s.componentDidCatch == "function" && (ql === null || !ql.has(s)))) return l.flags |= 65536, i &= -i, l.lanes |= i, i = ir(i), sr(i, e, l, a), pc(l, i), !1;
      }
      l = l.return;
    } while (l !== null);
    return !1;
  }
  var Hc = Error(d(461)), lt = !1;
  function ft(e, t, l, a) {
    t.child = e === null ? pd(t, null, l, a) : ca(t, e.child, l, a);
  }
  function cr(e, t, l, a, i) {
    l = l.render;
    var s = t.ref;
    if ("ref" in a) {
      var c = {};
      for (var o in a) o !== "ref" && (c[o] = a[o]);
    } else c = a;
    return aa(t), a = bc(e, t, l, c, s, i), o = yc(), e !== null && !lt ? (jc(e, t, i), dl(e, t, i)) : (we && o && ec(t), t.flags |= 1, ft(e, t, a, i), t.child);
  }
  function ur(e, t, l, a, i) {
    if (e === null) {
      var s = l.type;
      return typeof s == "function" && !Ws(s) && s.defaultProps === void 0 && l.compare === null ? (t.tag = 15, t.type = s, or(e, t, s, a, i)) : (e = yi(l.type, null, a, t, t.mode, i), e.ref = t.ref, e.return = t, t.child = e);
    }
    if (s = e.child, !Zc(e, i)) {
      var c = s.memoizedProps;
      if (l = l.compare, l = l !== null ? l : gn, l(c, a) && e.ref === t.ref) return dl(e, t, i);
    }
    return t.flags |= 1, e = nl(s, a), e.ref = t.ref, e.return = t, t.child = e;
  }
  function or(e, t, l, a, i) {
    if (e !== null) {
      var s = e.memoizedProps;
      if (gn(s, a) && e.ref === t.ref) if (lt = !1, t.pendingProps = a = s, Zc(e, i)) (e.flags & 131072) !== 0 && (lt = !0);
      else return t.lanes = e.lanes, dl(e, t, i);
    }
    return Bc(e, t, l, a, i);
  }
  function dr(e, t, l, a) {
    var i = a.children, s = e !== null ? e.memoizedState : null;
    if (e === null && t.stateNode === null && (t.stateNode = {
      _visibility: 1,
      _pendingMarkers: null,
      _retryCache: null,
      _transitions: null
    }), a.mode === "hidden") {
      if ((t.flags & 128) !== 0) {
        if (s = s !== null ? s.baseLanes | l : l, e !== null) {
          for (a = t.child = e.child, i = 0; a !== null; ) i = i | a.lanes | a.childLanes, a = a.sibling;
          a = i & ~s;
        } else a = 0, t.child = null;
        return rr(e, t, s, l, a);
      }
      if ((l & 536870912) !== 0) t.memoizedState = {
        baseLanes: 0,
        cachePool: null
      }, e !== null && Ni(t, s !== null ? s.cachePool : null), s !== null ? xd(t, s) : mc(), gd(t);
      else return a = t.lanes = 536870912, rr(e, t, s !== null ? s.baseLanes | l : l, l, a);
    } else s !== null ? (Ni(t, s.cachePool), xd(t, s), kl(t), t.memoizedState = null) : (e !== null && Ni(t, null), mc(), kl(t));
    return ft(e, t, i, l), t.child;
  }
  function On(e, t) {
    return e !== null && e.tag === 22 || t.stateNode !== null || (t.stateNode = {
      _visibility: 1,
      _pendingMarkers: null,
      _retryCache: null,
      _transitions: null
    }), t.sibling;
  }
  function rr(e, t, l, a, i) {
    var s = oc();
    return s = s === null ? null : {
      parent: et._currentValue,
      pool: s
    }, t.memoizedState = {
      baseLanes: l,
      cachePool: s
    }, e !== null && Ni(t, null), mc(), gd(t), e !== null && Oa(e, t, a, !0), t.childLanes = i, null;
  }
  function Li(e, t) {
    return t = Yi({
      mode: t.mode,
      children: t.children
    }, e.mode), t.ref = e.ref, e.child = t, t.return = e, t;
  }
  function fr(e, t, l) {
    return ca(t, e.child, null, l), e = Li(t, t.pendingProps), e.flags |= 2, Tt(t), t.memoizedState = null, e;
  }
  function z0(e, t, l) {
    var a = t.pendingProps, i = (t.flags & 128) !== 0;
    if (t.flags &= -129, e === null) {
      if (we) {
        if (a.mode === "hidden") return e = Li(t, a), t.lanes = 536870912, On(null, e);
        if (gc(t), (e = Ve) ? (e = wf(e, Ht), e = e !== null && e.data === "&" ? e : null, e !== null && (t.memoizedState = {
          dehydrated: e,
          treeContext: El !== null ? {
            id: $t,
            overflow: Wt
          } : null,
          retryLane: 536870912,
          hydrationErrors: null
        }, l = Fo(e), l.return = t, t.child = l, dt = t, Ve = null)) : e = null, e === null) throw Al(t);
        return t.lanes = 536870912, null;
      }
      return Li(t, a);
    }
    var s = e.memoizedState;
    if (s !== null) {
      var c = s.dehydrated;
      if (gc(t), i) if (t.flags & 256) t.flags &= -257, t = fr(e, t, l);
      else if (t.memoizedState !== null) t.child = e.child, t.flags |= 128, t = null;
      else throw Error(d(558));
      else if (lt || Oa(e, t, l, !1), i = (l & e.childLanes) !== 0, lt || i) {
        if (a = Ge, a !== null && (c = ao(a, l), c !== 0 && c !== s.retryLane)) throw s.retryLane = c, Pl(e, c), St(a, e, c), Hc;
        Wi(), t = fr(e, t, l);
      } else e = s.treeContext, Ve = Gt(c.nextSibling), dt = t, we = !0, Tl = null, Ht = !1, e !== null && td(t, e), t = Li(t, a), t.flags |= 4096;
      return t;
    }
    return e = nl(e.child, {
      mode: a.mode,
      children: a.children
    }), e.ref = t.ref, t.child = e, e.return = t, e;
  }
  function Gi(e, t) {
    var l = t.ref;
    if (l === null) e !== null && e.ref !== null && (t.flags |= 4194816);
    else {
      if (typeof l != "function" && typeof l != "object") throw Error(d(284));
      (e === null || e.ref !== l) && (t.flags |= 4194816);
    }
  }
  function Bc(e, t, l, a, i) {
    return aa(t), l = bc(e, t, l, a, void 0, i), a = yc(), e !== null && !lt ? (jc(e, t, i), dl(e, t, i)) : (we && a && ec(t), t.flags |= 1, ft(e, t, l, i), t.child);
  }
  function pr(e, t, l, a, i, s) {
    return aa(t), t.updateQueue = null, l = bd(t, a, l, i), vd(e), a = yc(), e !== null && !lt ? (jc(e, t, s), dl(e, t, s)) : (we && a && ec(t), t.flags |= 1, ft(e, t, l, s), t.child);
  }
  function hr(e, t, l, a, i) {
    if (aa(t), t.stateNode === null) {
      var s = Ta, c = l.contextType;
      typeof c == "object" && c !== null && (s = rt(c)), s = new l(a, s), t.memoizedState = s.state !== null && s.state !== void 0 ? s.state : null, s.updater = Rc, t.stateNode = s, s._reactInternals = t, s = t.stateNode, s.props = a, s.state = t.memoizedState, s.refs = {}, rc(t), c = l.contextType, s.context = typeof c == "object" && c !== null ? rt(c) : Ta, s.state = t.memoizedState, c = l.getDerivedStateFromProps, typeof c == "function" && (Uc(t, l, c, a), s.state = t.memoizedState), typeof l.getDerivedStateFromProps == "function" || typeof s.getSnapshotBeforeUpdate == "function" || typeof s.UNSAFE_componentWillMount != "function" && typeof s.componentWillMount != "function" || (c = s.state, typeof s.componentWillMount == "function" && s.componentWillMount(), typeof s.UNSAFE_componentWillMount == "function" && s.UNSAFE_componentWillMount(), c !== s.state && Rc.enqueueReplaceState(s, s.state, null), En(t, a, s, i), wn(), s.state = t.memoizedState), typeof s.componentDidMount == "function" && (t.flags |= 4194308), a = !0;
    } else if (e === null) {
      s = t.stateNode;
      var o = t.memoizedProps, p = ra(l, o);
      s.props = p;
      var z = s.context, C = l.contextType;
      c = Ta, typeof C == "object" && C !== null && (c = rt(C));
      var R = l.getDerivedStateFromProps;
      C = typeof R == "function" || typeof s.getSnapshotBeforeUpdate == "function", o = t.pendingProps !== o, C || typeof s.UNSAFE_componentWillReceiveProps != "function" && typeof s.componentWillReceiveProps != "function" || (o || z !== c) && ar(t, s, a, c), Ml = !1;
      var N = t.memoizedState;
      s.state = N, En(t, a, s, i), wn(), z = t.memoizedState, o || N !== z || Ml ? (typeof R == "function" && (Uc(t, l, R, a), z = t.memoizedState), (p = Ml || lr(t, l, p, a, N, z, c)) ? (C || typeof s.UNSAFE_componentWillMount != "function" && typeof s.componentWillMount != "function" || (typeof s.componentWillMount == "function" && s.componentWillMount(), typeof s.UNSAFE_componentWillMount == "function" && s.UNSAFE_componentWillMount()), typeof s.componentDidMount == "function" && (t.flags |= 4194308)) : (typeof s.componentDidMount == "function" && (t.flags |= 4194308), t.memoizedProps = a, t.memoizedState = z), s.props = a, s.state = z, s.context = c, a = p) : (typeof s.componentDidMount == "function" && (t.flags |= 4194308), a = !1);
    } else {
      s = t.stateNode, fc(e, t), c = t.memoizedProps, C = ra(l, c), s.props = C, R = t.pendingProps, N = s.context, z = l.contextType, p = Ta, typeof z == "object" && z !== null && (p = rt(z)), o = l.getDerivedStateFromProps, (z = typeof o == "function" || typeof s.getSnapshotBeforeUpdate == "function") || typeof s.UNSAFE_componentWillReceiveProps != "function" && typeof s.componentWillReceiveProps != "function" || (c !== R || N !== p) && ar(t, s, a, p), Ml = !1, N = t.memoizedState, s.state = N, En(t, a, s, i), wn();
      var A = t.memoizedState;
      c !== R || N !== A || Ml || e !== null && e.dependencies !== null && Si(e.dependencies) ? (typeof o == "function" && (Uc(t, l, o, a), A = t.memoizedState), (C = Ml || lr(t, l, C, a, N, A, p) || e !== null && e.dependencies !== null && Si(e.dependencies)) ? (z || typeof s.UNSAFE_componentWillUpdate != "function" && typeof s.componentWillUpdate != "function" || (typeof s.componentWillUpdate == "function" && s.componentWillUpdate(a, A, p), typeof s.UNSAFE_componentWillUpdate == "function" && s.UNSAFE_componentWillUpdate(a, A, p)), typeof s.componentDidUpdate == "function" && (t.flags |= 4), typeof s.getSnapshotBeforeUpdate == "function" && (t.flags |= 1024)) : (typeof s.componentDidUpdate != "function" || c === e.memoizedProps && N === e.memoizedState || (t.flags |= 4), typeof s.getSnapshotBeforeUpdate != "function" || c === e.memoizedProps && N === e.memoizedState || (t.flags |= 1024), t.memoizedProps = a, t.memoizedState = A), s.props = a, s.state = A, s.context = p, a = C) : (typeof s.componentDidUpdate != "function" || c === e.memoizedProps && N === e.memoizedState || (t.flags |= 4), typeof s.getSnapshotBeforeUpdate != "function" || c === e.memoizedProps && N === e.memoizedState || (t.flags |= 1024), a = !1);
    }
    return s = a, Gi(e, t), a = (t.flags & 128) !== 0, s || a ? (s = t.stateNode, l = a && typeof l.getDerivedStateFromError != "function" ? null : s.render(), t.flags |= 1, e !== null && a ? (t.child = ca(t, e.child, null, i), t.child = ca(t, null, l, i)) : ft(e, t, l, i), t.memoizedState = s.state, e = t.child) : e = dl(e, t, i), e;
  }
  function mr(e, t, l, a) {
    return ta(), t.flags |= 256, ft(e, t, l, a), t.child;
  }
  var Lc = {
    dehydrated: null,
    treeContext: null,
    retryLane: 0,
    hydrationErrors: null
  };
  function Gc(e) {
    return {
      baseLanes: e,
      cachePool: cd()
    };
  }
  function Yc(e, t, l) {
    return e = e !== null ? e.childLanes & ~l : 0, t && (e |= Ct), e;
  }
  function xr(e, t, l) {
    var a = t.pendingProps, i = !1, s = (t.flags & 128) !== 0, c;
    if ((c = s) || (c = e !== null && e.memoizedState === null ? !1 : (We.current & 2) !== 0), c && (i = !0, t.flags &= -129), c = (t.flags & 32) !== 0, t.flags &= -33, e === null) {
      if (we) {
        if (i ? Ol(t) : kl(t), (e = Ve) ? (e = wf(e, Ht), e = e !== null && e.data !== "&" ? e : null, e !== null && (t.memoizedState = {
          dehydrated: e,
          treeContext: El !== null ? {
            id: $t,
            overflow: Wt
          } : null,
          retryLane: 536870912,
          hydrationErrors: null
        }, l = Fo(e), l.return = t, t.child = l, dt = t, Ve = null)) : e = null, e === null) throw Al(t);
        return zu(e) ? t.lanes = 32 : t.lanes = 536870912, null;
      }
      var o = a.children;
      return a = a.fallback, i ? (kl(t), i = t.mode, o = Yi({
        mode: "hidden",
        children: o
      }, i), a = ea(a, i, l, null), o.return = t, a.return = t, o.sibling = a, t.child = o, a = t.child, a.memoizedState = Gc(l), a.childLanes = Yc(e, c, l), t.memoizedState = Lc, On(null, a)) : (Ol(t), Vc(t, o));
    }
    var p = e.memoizedState;
    if (p !== null && (o = p.dehydrated, o !== null)) {
      if (s) t.flags & 256 ? (Ol(t), t.flags &= -257, t = Xc(e, t, l)) : t.memoizedState !== null ? (kl(t), t.child = e.child, t.flags |= 128, t = null) : (kl(t), o = a.fallback, i = t.mode, a = Yi({
        mode: "visible",
        children: a.children
      }, i), o = ea(o, i, l, null), o.flags |= 2, a.return = t, o.return = t, a.sibling = o, t.child = a, ca(t, e.child, null, l), a = t.child, a.memoizedState = Gc(l), a.childLanes = Yc(e, c, l), t.memoizedState = Lc, t = On(null, a));
      else if (Ol(t), zu(o)) {
        if (c = o.nextSibling && o.nextSibling.dataset, c) var z = c.dgst;
        c = z, a = Error(d(419)), a.stack = "", a.digest = c, yn({
          value: a,
          source: null,
          stack: null
        }), t = Xc(e, t, l);
      } else if (lt || Oa(e, t, l, !1), c = (l & e.childLanes) !== 0, lt || c) {
        if (c = Ge, c !== null && (a = ao(c, l), a !== 0 && a !== p.retryLane)) throw p.retryLane = a, Pl(e, a), St(c, e, a), Hc;
        Su(o) || Wi(), t = Xc(e, t, l);
      } else Su(o) ? (t.flags |= 192, t.child = e.child, t = null) : (e = p.treeContext, Ve = Gt(o.nextSibling), dt = t, we = !0, Tl = null, Ht = !1, e !== null && td(t, e), t = Vc(t, a.children), t.flags |= 4096);
      return t;
    }
    return i ? (kl(t), o = a.fallback, i = t.mode, p = e.child, z = p.sibling, a = nl(p, {
      mode: "hidden",
      children: a.children
    }), a.subtreeFlags = p.subtreeFlags & 65011712, z !== null ? o = nl(z, o) : (o = ea(o, i, l, null), o.flags |= 2), o.return = t, a.return = t, a.sibling = o, t.child = a, On(null, a), a = t.child, o = e.child.memoizedState, o === null ? o = Gc(l) : (i = o.cachePool, i !== null ? (p = et._currentValue, i = i.parent !== p ? {
      parent: p,
      pool: p
    } : i) : i = cd(), o = {
      baseLanes: o.baseLanes | l,
      cachePool: i
    }), a.memoizedState = o, a.childLanes = Yc(e, c, l), t.memoizedState = Lc, On(e.child, a)) : (Ol(t), l = e.child, e = l.sibling, l = nl(l, {
      mode: "visible",
      children: a.children
    }), l.return = t, l.sibling = null, e !== null && (c = t.deletions, c === null ? (t.deletions = [e], t.flags |= 16) : c.push(e)), t.child = l, t.memoizedState = null, l);
  }
  function Vc(e, t) {
    return t = Yi({
      mode: "visible",
      children: t
    }, e.mode), t.return = e, e.child = t;
  }
  function Yi(e, t) {
    return e = wt(22, e, null, t), e.lanes = 0, e;
  }
  function Xc(e, t, l) {
    return ca(t, e.child, null, l), e = Vc(t, t.pendingProps.children), e.flags |= 2, t.memoizedState = null, e;
  }
  function gr(e, t, l) {
    e.lanes |= t;
    var a = e.alternate;
    a !== null && (a.lanes |= t), ic(e.return, t, l);
  }
  function Qc(e, t, l, a, i, s) {
    var c = e.memoizedState;
    c === null ? e.memoizedState = {
      isBackwards: t,
      rendering: null,
      renderingStartTime: 0,
      last: a,
      tail: l,
      tailMode: i,
      treeForkCount: s
    } : (c.isBackwards = t, c.rendering = null, c.renderingStartTime = 0, c.last = a, c.tail = l, c.tailMode = i, c.treeForkCount = s);
  }
  function vr(e, t, l) {
    var a = t.pendingProps, i = a.revealOrder, s = a.tail;
    a = a.children;
    var c = We.current, o = (c & 2) !== 0;
    if (o ? (c = c & 1 | 2, t.flags |= 128) : c &= 1, X(We, c), ft(e, t, a, l), a = we ? bn : 0, !o && e !== null && (e.flags & 128) !== 0) e: for (e = t.child; e !== null; ) {
      if (e.tag === 13) e.memoizedState !== null && gr(e, l, t);
      else if (e.tag === 19) gr(e, l, t);
      else if (e.child !== null) {
        e.child.return = e, e = e.child;
        continue;
      }
      if (e === t) break e;
      for (; e.sibling === null; ) {
        if (e.return === null || e.return === t) break e;
        e = e.return;
      }
      e.sibling.return = e.return, e = e.sibling;
    }
    switch (i) {
      case "forwards":
        for (l = t.child, i = null; l !== null; ) e = l.alternate, e !== null && Ci(e) === null && (i = l), l = l.sibling;
        l = i, l === null ? (i = t.child, t.child = null) : (i = l.sibling, l.sibling = null), Qc(t, !1, i, l, s, a);
        break;
      case "backwards":
      case "unstable_legacy-backwards":
        for (l = null, i = t.child, t.child = null; i !== null; ) {
          if (e = i.alternate, e !== null && Ci(e) === null) {
            t.child = i;
            break;
          }
          e = i.sibling, i.sibling = l, l = i, i = e;
        }
        Qc(t, !0, l, null, s, a);
        break;
      case "together":
        Qc(t, !1, null, null, void 0, a);
        break;
      default:
        t.memoizedState = null;
    }
    return t.child;
  }
  function dl(e, t, l) {
    if (e !== null && (t.dependencies = e.dependencies), Rl |= t.lanes, (l & t.childLanes) === 0) if (e !== null) {
      if (Oa(e, t, l, !1), (l & t.childLanes) === 0) return null;
    } else return null;
    if (e !== null && t.child !== e.child) throw Error(d(153));
    if (t.child !== null) {
      for (e = t.child, l = nl(e, e.pendingProps), t.child = l, l.return = t; e.sibling !== null; ) e = e.sibling, l = l.sibling = nl(e, e.pendingProps), l.return = t;
      l.sibling = null;
    }
    return t.child;
  }
  function Zc(e, t) {
    return (e.lanes & t) !== 0 ? !0 : (e = e.dependencies, !!(e !== null && Si(e)));
  }
  function N0(e, t, l) {
    switch (t.tag) {
      case 3:
        Me(t, t.stateNode.containerInfo), Cl(t, et, e.memoizedState.cache), ta();
        break;
      case 27:
      case 5:
        Ze(t);
        break;
      case 4:
        Me(t, t.stateNode.containerInfo);
        break;
      case 10:
        Cl(t, t.type, t.memoizedProps.value);
        break;
      case 31:
        if (t.memoizedState !== null) return t.flags |= 128, gc(t), null;
        break;
      case 13:
        var a = t.memoizedState;
        if (a !== null)
          return a.dehydrated !== null ? (Ol(t), t.flags |= 128, null) : (l & t.child.childLanes) !== 0 ? xr(e, t, l) : (Ol(t), e = dl(e, t, l), e !== null ? e.sibling : null);
        Ol(t);
        break;
      case 19:
        var i = (e.flags & 128) !== 0;
        if (a = (l & t.childLanes) !== 0, a || (Oa(e, t, l, !1), a = (l & t.childLanes) !== 0), i) {
          if (a) return vr(e, t, l);
          t.flags |= 128;
        }
        if (i = t.memoizedState, i !== null && (i.rendering = null, i.tail = null, i.lastEffect = null), X(We, We.current), a) break;
        return null;
      case 22:
        return t.lanes = 0, dr(e, t, l, t.pendingProps);
      case 24:
        Cl(t, et, e.memoizedState.cache);
    }
    return dl(e, t, l);
  }
  function br(e, t, l) {
    if (e !== null) if (e.memoizedProps !== t.pendingProps) lt = !0;
    else {
      if (!Zc(e, l) && (t.flags & 128) === 0) return lt = !1, N0(e, t, l);
      lt = (e.flags & 131072) !== 0;
    }
    else lt = !1, we && (t.flags & 1048576) !== 0 && ed(t, bn, t.index);
    switch (t.lanes = 0, t.tag) {
      case 16:
        e: {
          var a = t.pendingProps;
          if (e = ia(t.elementType), t.type = e, typeof e == "function") Ws(e) ? (a = ra(e, a), t.tag = 1, t = hr(null, t, e, a, l)) : (t.tag = 0, t = Bc(null, t, e, a, l));
          else {
            if (e != null) {
              var i = e.$$typeof;
              if (i === P) {
                t.tag = 11, t = cr(null, t, e, a, l);
                break e;
              } else if (i === ie) {
                t.tag = 14, t = ur(null, t, e, a, l);
                break e;
              }
            }
            throw t = Q(e) || e, Error(d(306, t, ""));
          }
        }
        return t;
      case 0:
        return Bc(e, t, t.type, t.pendingProps, l);
      case 1:
        return a = t.type, i = ra(a, t.pendingProps), hr(e, t, a, i, l);
      case 3:
        e: {
          if (Me(t, t.stateNode.containerInfo), e === null) throw Error(d(387));
          a = t.pendingProps;
          var s = t.memoizedState;
          i = s.element, fc(e, t), En(t, a, null, l);
          var c = t.memoizedState;
          if (a = c.cache, Cl(t, et, a), a !== s.cache && sc(t, [et], l, !0), wn(), a = c.element, s.isDehydrated) if (s = {
            element: a,
            isDehydrated: !1,
            cache: c.cache
          }, t.updateQueue.baseState = s, t.memoizedState = s, t.flags & 256) {
            t = mr(e, t, a, l);
            break e;
          } else if (a !== i) {
            i = Ut(Error(d(424)), t), yn(i), t = mr(e, t, a, l);
            break e;
          } else
            for (e = t.stateNode.containerInfo, e.nodeType === 9 ? e = e.body : e = e.nodeName === "HTML" ? e.ownerDocument.body : e, Ve = Gt(e.firstChild), dt = t, we = !0, Tl = null, Ht = !0, l = pd(t, null, a, l), t.child = l; l; ) l.flags = l.flags & -3 | 4096, l = l.sibling;
          else {
            if (ta(), a === i) {
              t = dl(e, t, l);
              break e;
            }
            ft(e, t, a, l);
          }
          t = t.child;
        }
        return t;
      case 26:
        return Gi(e, t), e === null ? (l = Of(t.type, null, t.pendingProps, null)) ? t.memoizedState = l : we || (l = t.type, e = t.pendingProps, a = ns(me.current).createElement(l), a[ot] = t, a[xt] = e, pt(a, l, e), st(a), t.stateNode = a) : t.memoizedState = Of(t.type, e.memoizedProps, t.pendingProps, e.memoizedState), null;
      case 27:
        return Ze(t), e === null && we && (a = t.stateNode = Af(t.type, t.pendingProps, me.current), dt = t, Ht = !0, i = Ve, Gl(t.type) ? (Nu = i, Ve = Gt(a.firstChild)) : Ve = i), ft(e, t, t.pendingProps.children, l), Gi(e, t), e === null && (t.flags |= 4194304), t.child;
      case 5:
        return e === null && we && ((i = a = Ve) && (a = F0(a, t.type, t.pendingProps, Ht), a !== null ? (t.stateNode = a, dt = t, Ve = Gt(a.firstChild), Ht = !1, i = !0) : i = !1), i || Al(t)), Ze(t), i = t.type, s = t.pendingProps, c = e !== null ? e.memoizedProps : null, a = s.children, bu(i, s) ? a = null : c !== null && bu(i, c) && (t.flags |= 32), t.memoizedState !== null && (i = bc(e, t, f0, null, null, l), Kn._currentValue = i), Gi(e, t), ft(e, t, a, l), t.child;
      case 6:
        return e === null && we && ((e = l = Ve) && (l = P0(l, t.pendingProps, Ht), l !== null ? (t.stateNode = l, dt = t, Ve = null, e = !0) : e = !1), e || Al(t)), null;
      case 13:
        return xr(e, t, l);
      case 4:
        return Me(t, t.stateNode.containerInfo), a = t.pendingProps, e === null ? t.child = ca(t, null, a, l) : ft(e, t, a, l), t.child;
      case 11:
        return cr(e, t, t.type, t.pendingProps, l);
      case 7:
        return ft(e, t, t.pendingProps, l), t.child;
      case 8:
        return ft(e, t, t.pendingProps.children, l), t.child;
      case 12:
        return ft(e, t, t.pendingProps.children, l), t.child;
      case 10:
        return a = t.pendingProps, Cl(t, t.type, a.value), ft(e, t, a.children, l), t.child;
      case 9:
        return i = t.type._context, a = t.pendingProps.children, aa(t), i = rt(i), a = a(i), t.flags |= 1, ft(e, t, a, l), t.child;
      case 14:
        return ur(e, t, t.type, t.pendingProps, l);
      case 15:
        return or(e, t, t.type, t.pendingProps, l);
      case 19:
        return vr(e, t, l);
      case 31:
        return z0(e, t, l);
      case 22:
        return dr(e, t, l, t.pendingProps);
      case 24:
        return aa(t), a = rt(et), e === null ? (i = oc(), i === null && (i = Ge, s = cc(), i.pooledCache = s, s.refCount++, s !== null && (i.pooledCacheLanes |= l), i = s), t.memoizedState = {
          parent: a,
          cache: i
        }, rc(t), Cl(t, et, i)) : ((e.lanes & l) !== 0 && (fc(e, t), En(t, null, null, l), wn()), i = e.memoizedState, s = t.memoizedState, i.parent !== a ? (i = {
          parent: a,
          cache: a
        }, t.memoizedState = i, t.lanes === 0 && (t.memoizedState = t.updateQueue.baseState = i), Cl(t, et, a)) : (a = s.cache, Cl(t, et, a), a !== i.cache && sc(t, [et], l, !0))), ft(e, t, t.pendingProps.children, l), t.child;
      case 29:
        throw t.pendingProps;
    }
    throw Error(d(156, t.tag));
  }
  function rl(e) {
    e.flags |= 4;
  }
  function Kc(e, t, l, a, i) {
    if ((t = (e.mode & 32) !== 0) && (t = !1), t) {
      if (e.flags |= 16777216, (i & 335544128) === i) if (e.stateNode.complete) e.flags |= 8192;
      else if (Zr()) e.flags |= 8192;
      else throw sa = wi, dc;
    } else e.flags &= -16777217;
  }
  function yr(e, t) {
    if (t.type !== "stylesheet" || (t.state.loading & 4) !== 0) e.flags &= -16777217;
    else if (e.flags |= 16777216, !qf(t)) if (Zr()) e.flags |= 8192;
    else throw sa = wi, dc;
  }
  function Vi(e, t) {
    t !== null && (e.flags |= 4), e.flags & 16384 && (t = e.tag !== 22 ? eo() : 536870912, e.lanes |= t, Xa |= t);
  }
  function kn(e, t) {
    if (!we) switch (e.tailMode) {
      case "hidden":
        t = e.tail;
        for (var l = null; t !== null; ) t.alternate !== null && (l = t), t = t.sibling;
        l === null ? e.tail = null : l.sibling = null;
        break;
      case "collapsed":
        l = e.tail;
        for (var a = null; l !== null; ) l.alternate !== null && (a = l), l = l.sibling;
        a === null ? t || e.tail === null ? e.tail = null : e.tail.sibling = null : a.sibling = null;
    }
  }
  function Xe(e) {
    var t = e.alternate !== null && e.alternate.child === e.child, l = 0, a = 0;
    if (t) for (var i = e.child; i !== null; ) l |= i.lanes | i.childLanes, a |= i.subtreeFlags & 65011712, a |= i.flags & 65011712, i.return = e, i = i.sibling;
    else for (i = e.child; i !== null; ) l |= i.lanes | i.childLanes, a |= i.subtreeFlags, a |= i.flags, i.return = e, i = i.sibling;
    return e.subtreeFlags |= a, e.childLanes = l, t;
  }
  function _0(e, t, l) {
    var a = t.pendingProps;
    switch (tc(t), t.tag) {
      case 16:
      case 15:
      case 0:
      case 11:
      case 7:
      case 8:
      case 12:
      case 9:
      case 14:
        return Xe(t), null;
      case 1:
        return Xe(t), null;
      case 3:
        return l = t.stateNode, a = null, e !== null && (a = e.memoizedState.cache), t.memoizedState.cache !== a && (t.flags |= 2048), cl(et), xe(), l.pendingContext && (l.context = l.pendingContext, l.pendingContext = null), (e === null || e.child === null) && (Ma(t) ? rl(t) : e === null || e.memoizedState.isDehydrated && (t.flags & 256) === 0 || (t.flags |= 1024, ac())), Xe(t), null;
      case 26:
        var i = t.type, s = t.memoizedState;
        return e === null ? (rl(t), s !== null ? (Xe(t), yr(t, s)) : (Xe(t), Kc(t, i, null, a, l))) : s ? s !== e.memoizedState ? (rl(t), Xe(t), yr(t, s)) : (Xe(t), t.flags &= -16777217) : (e = e.memoizedProps, e !== a && rl(t), Xe(t), Kc(t, i, e, a, l)), null;
      case 27:
        if (ht(t), l = me.current, i = t.type, e !== null && t.stateNode != null) e.memoizedProps !== a && rl(t);
        else {
          if (!a) {
            if (t.stateNode === null) throw Error(d(166));
            return Xe(t), null;
          }
          e = $.current, Ma(t) ? ld(t, e) : (e = Af(i, a, l), t.stateNode = e, rl(t));
        }
        return Xe(t), null;
      case 5:
        if (ht(t), i = t.type, e !== null && t.stateNode != null) e.memoizedProps !== a && rl(t);
        else {
          if (!a) {
            if (t.stateNode === null) throw Error(d(166));
            return Xe(t), null;
          }
          if (s = $.current, Ma(t)) ld(t, s);
          else {
            var c = ns(me.current);
            switch (s) {
              case 1:
                s = c.createElementNS("http://www.w3.org/2000/svg", i);
                break;
              case 2:
                s = c.createElementNS("http://www.w3.org/1998/Math/MathML", i);
                break;
              default:
                switch (i) {
                  case "svg":
                    s = c.createElementNS("http://www.w3.org/2000/svg", i);
                    break;
                  case "math":
                    s = c.createElementNS("http://www.w3.org/1998/Math/MathML", i);
                    break;
                  case "script":
                    s = c.createElement("div"), s.innerHTML = "<script><\/script>", s = s.removeChild(s.firstChild);
                    break;
                  case "select":
                    s = typeof a.is == "string" ? c.createElement("select", { is: a.is }) : c.createElement("select"), a.multiple ? s.multiple = !0 : a.size && (s.size = a.size);
                    break;
                  default:
                    s = typeof a.is == "string" ? c.createElement(i, { is: a.is }) : c.createElement(i);
                }
            }
            s[ot] = t, s[xt] = a;
            e: for (c = t.child; c !== null; ) {
              if (c.tag === 5 || c.tag === 6) s.appendChild(c.stateNode);
              else if (c.tag !== 4 && c.tag !== 27 && c.child !== null) {
                c.child.return = c, c = c.child;
                continue;
              }
              if (c === t) break e;
              for (; c.sibling === null; ) {
                if (c.return === null || c.return === t) break e;
                c = c.return;
              }
              c.sibling.return = c.return, c = c.sibling;
            }
            t.stateNode = s;
            e: switch (pt(s, i, a), i) {
              case "button":
              case "input":
              case "select":
              case "textarea":
                a = !!a.autoFocus;
                break e;
              case "img":
                a = !0;
                break e;
              default:
                a = !1;
            }
            a && rl(t);
          }
        }
        return Xe(t), Kc(t, t.type, e === null ? null : e.memoizedProps, t.pendingProps, l), null;
      case 6:
        if (e && t.stateNode != null) e.memoizedProps !== a && rl(t);
        else {
          if (typeof a != "string" && t.stateNode === null) throw Error(d(166));
          if (e = me.current, Ma(t)) {
            if (e = t.stateNode, l = t.memoizedProps, a = null, i = dt, i !== null) switch (i.tag) {
              case 27:
              case 5:
                a = i.memoizedProps;
            }
            e[ot] = t, e = !!(e.nodeValue === l || a !== null && a.suppressHydrationWarning === !0 || vf(e.nodeValue, l)), e || Al(t, !0);
          } else e = ns(e).createTextNode(a), e[ot] = t, t.stateNode = e;
        }
        return Xe(t), null;
      case 31:
        if (l = t.memoizedState, e === null || e.memoizedState !== null) {
          if (a = Ma(t), l !== null) {
            if (e === null) {
              if (!a) throw Error(d(318));
              if (e = t.memoizedState, e = e !== null ? e.dehydrated : null, !e) throw Error(d(557));
              e[ot] = t;
            } else ta(), (t.flags & 128) === 0 && (t.memoizedState = null), t.flags |= 4;
            Xe(t), e = !1;
          } else l = ac(), e !== null && e.memoizedState !== null && (e.memoizedState.hydrationErrors = l), e = !0;
          if (!e)
            return t.flags & 256 ? (Tt(t), t) : (Tt(t), null);
          if ((t.flags & 128) !== 0) throw Error(d(558));
        }
        return Xe(t), null;
      case 13:
        if (a = t.memoizedState, e === null || e.memoizedState !== null && e.memoizedState.dehydrated !== null) {
          if (i = Ma(t), a !== null && a.dehydrated !== null) {
            if (e === null) {
              if (!i) throw Error(d(318));
              if (i = t.memoizedState, i = i !== null ? i.dehydrated : null, !i) throw Error(d(317));
              i[ot] = t;
            } else ta(), (t.flags & 128) === 0 && (t.memoizedState = null), t.flags |= 4;
            Xe(t), i = !1;
          } else i = ac(), e !== null && e.memoizedState !== null && (e.memoizedState.hydrationErrors = i), i = !0;
          if (!i)
            return t.flags & 256 ? (Tt(t), t) : (Tt(t), null);
        }
        return Tt(t), (t.flags & 128) !== 0 ? (t.lanes = l, t) : (l = a !== null, e = e !== null && e.memoizedState !== null, l && (a = t.child, i = null, a.alternate !== null && a.alternate.memoizedState !== null && a.alternate.memoizedState.cachePool !== null && (i = a.alternate.memoizedState.cachePool.pool), s = null, a.memoizedState !== null && a.memoizedState.cachePool !== null && (s = a.memoizedState.cachePool.pool), s !== i && (a.flags |= 2048)), l !== e && l && (t.child.flags |= 8192), Vi(t, t.updateQueue), Xe(t), null);
      case 4:
        return xe(), e === null && hf(t.stateNode.containerInfo), Xe(t), null;
      case 10:
        return cl(t.type), Xe(t), null;
      case 19:
        if (U(We), a = t.memoizedState, a === null) return Xe(t), null;
        if (i = (t.flags & 128) !== 0, s = a.rendering, s === null) if (i) kn(a, !1);
        else {
          if (Ie !== 0 || e !== null && (e.flags & 128) !== 0) for (e = t.child; e !== null; ) {
            if (s = Ci(e), s !== null) {
              for (t.flags |= 128, kn(a, !1), e = s.updateQueue, t.updateQueue = e, Vi(t, e), t.subtreeFlags = 0, e = l, l = t.child; l !== null; ) Wo(l, e), l = l.sibling;
              return X(We, We.current & 1 | 2), we && il(t, a.treeForkCount), t.child;
            }
            e = e.sibling;
          }
          a.tail !== null && De() > Ji && (t.flags |= 128, i = !0, kn(a, !1), t.lanes = 4194304);
        }
        else {
          if (!i) if (e = Ci(s), e !== null) {
            if (t.flags |= 128, i = !0, e = e.updateQueue, t.updateQueue = e, Vi(t, e), kn(a, !0), a.tail === null && a.tailMode === "hidden" && !s.alternate && !we) return Xe(t), null;
          } else 2 * De() - a.renderingStartTime > Ji && l !== 536870912 && (t.flags |= 128, i = !0, kn(a, !1), t.lanes = 4194304);
          a.isBackwards ? (s.sibling = t.child, t.child = s) : (e = a.last, e !== null ? e.sibling = s : t.child = s, a.last = s);
        }
        return a.tail !== null ? (e = a.tail, a.rendering = e, a.tail = e.sibling, a.renderingStartTime = De(), e.sibling = null, l = We.current, X(We, i ? l & 1 | 2 : l & 1), we && il(t, a.treeForkCount), e) : (Xe(t), null);
      case 22:
      case 23:
        return Tt(t), xc(), a = t.memoizedState !== null, e !== null ? e.memoizedState !== null !== a && (t.flags |= 8192) : a && (t.flags |= 8192), a ? (l & 536870912) !== 0 && (t.flags & 128) === 0 && (Xe(t), t.subtreeFlags & 6 && (t.flags |= 8192)) : Xe(t), l = t.updateQueue, l !== null && Vi(t, l.retryQueue), l = null, e !== null && e.memoizedState !== null && e.memoizedState.cachePool !== null && (l = e.memoizedState.cachePool.pool), a = null, t.memoizedState !== null && t.memoizedState.cachePool !== null && (a = t.memoizedState.cachePool.pool), a !== l && (t.flags |= 2048), e !== null && U(na), null;
      case 24:
        return l = null, e !== null && (l = e.memoizedState.cache), t.memoizedState.cache !== l && (t.flags |= 2048), cl(et), Xe(t), null;
      case 25:
        return null;
      case 30:
        return null;
    }
    throw Error(d(156, t.tag));
  }
  function w0(e, t) {
    switch (tc(t), t.tag) {
      case 1:
        return e = t.flags, e & 65536 ? (t.flags = e & -65537 | 128, t) : null;
      case 3:
        return cl(et), xe(), e = t.flags, (e & 65536) !== 0 && (e & 128) === 0 ? (t.flags = e & -65537 | 128, t) : null;
      case 26:
      case 27:
      case 5:
        return ht(t), null;
      case 31:
        if (t.memoizedState !== null) {
          if (Tt(t), t.alternate === null) throw Error(d(340));
          ta();
        }
        return e = t.flags, e & 65536 ? (t.flags = e & -65537 | 128, t) : null;
      case 13:
        if (Tt(t), e = t.memoizedState, e !== null && e.dehydrated !== null) {
          if (t.alternate === null) throw Error(d(340));
          ta();
        }
        return e = t.flags, e & 65536 ? (t.flags = e & -65537 | 128, t) : null;
      case 19:
        return U(We), null;
      case 4:
        return xe(), null;
      case 10:
        return cl(t.type), null;
      case 22:
      case 23:
        return Tt(t), xc(), e !== null && U(na), e = t.flags, e & 65536 ? (t.flags = e & -65537 | 128, t) : null;
      case 24:
        return cl(et), null;
      case 25:
        return null;
      default:
        return null;
    }
  }
  function jr(e, t) {
    switch (tc(t), t.tag) {
      case 3:
        cl(et), xe();
        break;
      case 26:
      case 27:
      case 5:
        ht(t);
        break;
      case 4:
        xe();
        break;
      case 31:
        t.memoizedState !== null && Tt(t);
        break;
      case 13:
        Tt(t);
        break;
      case 19:
        U(We);
        break;
      case 10:
        cl(t.type);
        break;
      case 22:
      case 23:
        Tt(t), xc(), e !== null && U(na);
        break;
      case 24:
        cl(et);
    }
  }
  function Dn(e, t) {
    try {
      var l = t.updateQueue, a = l !== null ? l.lastEffect : null;
      if (a !== null) {
        var i = a.next;
        l = i;
        do {
          if ((l.tag & e) === e) {
            a = void 0;
            var s = l.create, c = l.inst;
            a = s(), c.destroy = a;
          }
          l = l.next;
        } while (l !== i);
      }
    } catch (o) {
      Re(t, t.return, o);
    }
  }
  function Dl(e, t, l) {
    try {
      var a = t.updateQueue, i = a !== null ? a.lastEffect : null;
      if (i !== null) {
        var s = i.next;
        a = s;
        do {
          if ((a.tag & e) === e) {
            var c = a.inst, o = c.destroy;
            if (o !== void 0) {
              c.destroy = void 0, i = t;
              var p = l, z = o;
              try {
                z();
              } catch (C) {
                Re(i, p, C);
              }
            }
          }
          a = a.next;
        } while (a !== s);
      }
    } catch (C) {
      Re(t, t.return, C);
    }
  }
  function Sr(e) {
    var t = e.updateQueue;
    if (t !== null) {
      var l = e.stateNode;
      try {
        md(t, l);
      } catch (a) {
        Re(e, e.return, a);
      }
    }
  }
  function zr(e, t, l) {
    l.props = ra(e.type, e.memoizedProps), l.state = e.memoizedState;
    try {
      l.componentWillUnmount();
    } catch (a) {
      Re(e, t, a);
    }
  }
  function Un(e, t) {
    try {
      var l = e.ref;
      if (l !== null) {
        switch (e.tag) {
          case 26:
          case 27:
          case 5:
            var a = e.stateNode;
            break;
          case 30:
            a = e.stateNode;
            break;
          default:
            a = e.stateNode;
        }
        typeof l == "function" ? e.refCleanup = l(a) : l.current = a;
      }
    } catch (i) {
      Re(e, t, i);
    }
  }
  function Ft(e, t) {
    var l = e.ref, a = e.refCleanup;
    if (l !== null) if (typeof a == "function") try {
      a();
    } catch (i) {
      Re(e, t, i);
    } finally {
      e.refCleanup = null, e = e.alternate, e != null && (e.refCleanup = null);
    }
    else if (typeof l == "function") try {
      l(null);
    } catch (i) {
      Re(e, t, i);
    }
    else l.current = null;
  }
  function Nr(e) {
    var t = e.type, l = e.memoizedProps, a = e.stateNode;
    try {
      e: switch (t) {
        case "button":
        case "input":
        case "select":
        case "textarea":
          l.autoFocus && a.focus();
          break e;
        case "img":
          l.src ? a.src = l.src : l.srcSet && (a.srcset = l.srcSet);
      }
    } catch (i) {
      Re(e, e.return, i);
    }
  }
  function Jc(e, t, l) {
    try {
      var a = e.stateNode;
      Z0(a, e.type, l, t), a[xt] = t;
    } catch (i) {
      Re(e, e.return, i);
    }
  }
  function _r(e) {
    return e.tag === 5 || e.tag === 3 || e.tag === 26 || e.tag === 27 && Gl(e.type) || e.tag === 4;
  }
  function Ic(e) {
    e: for (; ; ) {
      for (; e.sibling === null; ) {
        if (e.return === null || _r(e.return)) return null;
        e = e.return;
      }
      for (e.sibling.return = e.return, e = e.sibling; e.tag !== 5 && e.tag !== 6 && e.tag !== 18; ) {
        if (e.tag === 27 && Gl(e.type) || e.flags & 2 || e.child === null || e.tag === 4) continue e;
        e.child.return = e, e = e.child;
      }
      if (!(e.flags & 2)) return e.stateNode;
    }
  }
  function $c(e, t, l) {
    var a = e.tag;
    if (a === 5 || a === 6) e = e.stateNode, t ? (l.nodeType === 9 ? l.body : l.nodeName === "HTML" ? l.ownerDocument.body : l).insertBefore(e, t) : (t = l.nodeType === 9 ? l.body : l.nodeName === "HTML" ? l.ownerDocument.body : l, t.appendChild(e), l = l._reactRootContainer, l != null || t.onclick !== null || (t.onclick = ll));
    else if (a !== 4 && (a === 27 && Gl(e.type) && (l = e.stateNode, t = null), e = e.child, e !== null)) for ($c(e, t, l), e = e.sibling; e !== null; ) $c(e, t, l), e = e.sibling;
  }
  function Xi(e, t, l) {
    var a = e.tag;
    if (a === 5 || a === 6) e = e.stateNode, t ? l.insertBefore(e, t) : l.appendChild(e);
    else if (a !== 4 && (a === 27 && Gl(e.type) && (l = e.stateNode), e = e.child, e !== null)) for (Xi(e, t, l), e = e.sibling; e !== null; ) Xi(e, t, l), e = e.sibling;
  }
  function wr(e) {
    var t = e.stateNode, l = e.memoizedProps;
    try {
      for (var a = e.type, i = t.attributes; i.length; ) t.removeAttributeNode(i[0]);
      pt(t, a, l), t[ot] = e, t[xt] = l;
    } catch (s) {
      Re(e, e.return, s);
    }
  }
  var fl = !1, at = !1, Wc = !1, Er = typeof WeakSet == "function" ? WeakSet : Set, ct = null;
  function E0(e, t) {
    if (e = e.containerInfo, gu = rs, e = Yo(e), Xs(e)) {
      if ("selectionStart" in e) var l = {
        start: e.selectionStart,
        end: e.selectionEnd
      };
      else e: {
        l = (l = e.ownerDocument) && l.defaultView || window;
        var a = l.getSelection && l.getSelection();
        if (a && a.rangeCount !== 0) {
          l = a.anchorNode;
          var i = a.anchorOffset, s = a.focusNode;
          a = a.focusOffset;
          try {
            l.nodeType, s.nodeType;
          } catch {
            l = null;
            break e;
          }
          var c = 0, o = -1, p = -1, z = 0, C = 0, R = e, N = null;
          t: for (; ; ) {
            for (var A; R !== l || i !== 0 && R.nodeType !== 3 || (o = c + i), R !== s || a !== 0 && R.nodeType !== 3 || (p = c + a), R.nodeType === 3 && (c += R.nodeValue.length), (A = R.firstChild) !== null; )
              N = R, R = A;
            for (; ; ) {
              if (R === e) break t;
              if (N === l && ++z === i && (o = c), N === s && ++C === a && (p = c), (A = R.nextSibling) !== null) break;
              R = N, N = R.parentNode;
            }
            R = A;
          }
          l = o === -1 || p === -1 ? null : {
            start: o,
            end: p
          };
        } else l = null;
      }
      l = l || {
        start: 0,
        end: 0
      };
    } else l = null;
    for (vu = {
      focusedElem: e,
      selectionRange: l
    }, rs = !1, ct = t; ct !== null; ) if (t = ct, e = t.child, (t.subtreeFlags & 1028) !== 0 && e !== null) e.return = t, ct = e;
    else for (; ct !== null; ) {
      switch (t = ct, s = t.alternate, e = t.flags, t.tag) {
        case 0:
          if ((e & 4) !== 0 && (e = t.updateQueue, e = e !== null ? e.events : null, e !== null)) for (l = 0; l < e.length; l++) i = e[l], i.ref.impl = i.nextImpl;
          break;
        case 11:
        case 15:
          break;
        case 1:
          if ((e & 1024) !== 0 && s !== null) {
            e = void 0, l = t, i = s.memoizedProps, s = s.memoizedState, a = l.stateNode;
            try {
              var ee = ra(l.type, i);
              e = a.getSnapshotBeforeUpdate(ee, s), a.__reactInternalSnapshotBeforeUpdate = e;
            } catch (re) {
              Re(l, l.return, re);
            }
          }
          break;
        case 3:
          if ((e & 1024) !== 0) {
            if (e = t.stateNode.containerInfo, l = e.nodeType, l === 9) ju(e);
            else if (l === 1) switch (e.nodeName) {
              case "HEAD":
              case "HTML":
              case "BODY":
                ju(e);
                break;
              default:
                e.textContent = "";
            }
          }
          break;
        case 5:
        case 26:
        case 27:
        case 6:
        case 4:
        case 17:
          break;
        default:
          if ((e & 1024) !== 0) throw Error(d(163));
      }
      if (e = t.sibling, e !== null) {
        e.return = t.return, ct = e;
        break;
      }
      ct = t.return;
    }
  }
  function Tr(e, t, l) {
    var a = l.flags;
    switch (l.tag) {
      case 0:
      case 11:
      case 15:
        hl(e, l), a & 4 && Dn(5, l);
        break;
      case 1:
        if (hl(e, l), a & 4) if (e = l.stateNode, t === null) try {
          e.componentDidMount();
        } catch (c) {
          Re(l, l.return, c);
        }
        else {
          var i = ra(l.type, t.memoizedProps);
          t = t.memoizedState;
          try {
            e.componentDidUpdate(i, t, e.__reactInternalSnapshotBeforeUpdate);
          } catch (c) {
            Re(l, l.return, c);
          }
        }
        a & 64 && Sr(l), a & 512 && Un(l, l.return);
        break;
      case 3:
        if (hl(e, l), a & 64 && (e = l.updateQueue, e !== null)) {
          if (t = null, l.child !== null) switch (l.child.tag) {
            case 27:
            case 5:
              t = l.child.stateNode;
              break;
            case 1:
              t = l.child.stateNode;
          }
          try {
            md(e, t);
          } catch (c) {
            Re(l, l.return, c);
          }
        }
        break;
      case 27:
        t === null && a & 4 && wr(l);
      case 26:
      case 5:
        hl(e, l), t === null && a & 4 && Nr(l), a & 512 && Un(l, l.return);
        break;
      case 12:
        hl(e, l);
        break;
      case 31:
        hl(e, l), a & 4 && Mr(e, l);
        break;
      case 13:
        hl(e, l), a & 4 && Or(e, l), a & 64 && (e = l.memoizedState, e !== null && (e = e.dehydrated, e !== null && (l = R0.bind(null, l), eh(e, l))));
        break;
      case 22:
        if (a = l.memoizedState !== null || fl, !a) {
          t = t !== null && t.memoizedState !== null || at, i = fl;
          var s = at;
          fl = a, (at = t) && !s ? ml(e, l, (l.subtreeFlags & 8772) !== 0) : hl(e, l), fl = i, at = s;
        }
        break;
      case 30:
        break;
      default:
        hl(e, l);
    }
  }
  function Ar(e) {
    var t = e.alternate;
    t !== null && (e.alternate = null, Ar(t)), e.child = null, e.deletions = null, e.sibling = null, e.tag === 5 && (t = e.stateNode, t !== null && Es(t)), e.stateNode = null, e.return = null, e.dependencies = null, e.memoizedProps = null, e.memoizedState = null, e.pendingProps = null, e.stateNode = null, e.updateQueue = null;
  }
  var Qe = null, vt = !1;
  function pl(e, t, l) {
    for (l = l.child; l !== null; ) Cr(e, t, l), l = l.sibling;
  }
  function Cr(e, t, l) {
    if (Ke && typeof Ke.onCommitFiberUnmount == "function") try {
      Ke.onCommitFiberUnmount(zl, l);
    } catch {
    }
    switch (l.tag) {
      case 26:
        at || Ft(l, t), pl(e, t, l), l.memoizedState ? l.memoizedState.count-- : l.stateNode && (l = l.stateNode, l.parentNode.removeChild(l));
        break;
      case 27:
        at || Ft(l, t);
        var a = Qe, i = vt;
        Gl(l.type) && (Qe = l.stateNode, vt = !1), pl(e, t, l), Xn(l.stateNode), Qe = a, vt = i;
        break;
      case 5:
        at || Ft(l, t);
      case 6:
        if (a = Qe, i = vt, Qe = null, pl(e, t, l), Qe = a, vt = i, Qe !== null) if (vt) try {
          (Qe.nodeType === 9 ? Qe.body : Qe.nodeName === "HTML" ? Qe.ownerDocument.body : Qe).removeChild(l.stateNode);
        } catch (s) {
          Re(l, t, s);
        }
        else try {
          Qe.removeChild(l.stateNode);
        } catch (s) {
          Re(l, t, s);
        }
        break;
      case 18:
        Qe !== null && (vt ? (e = Qe, Nf(e.nodeType === 9 ? e.body : e.nodeName === "HTML" ? e.ownerDocument.body : e, l.stateNode), Fa(e)) : Nf(Qe, l.stateNode));
        break;
      case 4:
        a = Qe, i = vt, Qe = l.stateNode.containerInfo, vt = !0, pl(e, t, l), Qe = a, vt = i;
        break;
      case 0:
      case 11:
      case 14:
      case 15:
        Dl(2, l, t), at || Dl(4, l, t), pl(e, t, l);
        break;
      case 1:
        at || (Ft(l, t), a = l.stateNode, typeof a.componentWillUnmount == "function" && zr(l, t, a)), pl(e, t, l);
        break;
      case 21:
        pl(e, t, l);
        break;
      case 22:
        at = (a = at) || l.memoizedState !== null, pl(e, t, l), at = a;
        break;
      default:
        pl(e, t, l);
    }
  }
  function Mr(e, t) {
    if (t.memoizedState === null && (e = t.alternate, e !== null && (e = e.memoizedState, e !== null))) {
      e = e.dehydrated;
      try {
        Fa(e);
      } catch (l) {
        Re(t, t.return, l);
      }
    }
  }
  function Or(e, t) {
    if (t.memoizedState === null && (e = t.alternate, e !== null && (e = e.memoizedState, e !== null && (e = e.dehydrated, e !== null)))) try {
      Fa(e);
    } catch (l) {
      Re(t, t.return, l);
    }
  }
  function T0(e) {
    switch (e.tag) {
      case 31:
      case 13:
      case 19:
        var t = e.stateNode;
        return t === null && (t = e.stateNode = new Er()), t;
      case 22:
        return e = e.stateNode, t = e._retryCache, t === null && (t = e._retryCache = new Er()), t;
      default:
        throw Error(d(435, e.tag));
    }
  }
  function Qi(e, t) {
    var l = T0(e);
    t.forEach(function(a) {
      if (!l.has(a)) {
        l.add(a);
        var i = q0.bind(null, e, a);
        a.then(i, i);
      }
    });
  }
  function bt(e, t) {
    var l = t.deletions;
    if (l !== null) for (var a = 0; a < l.length; a++) {
      var i = l[a], s = e, c = t, o = c;
      e: for (; o !== null; ) {
        switch (o.tag) {
          case 27:
            if (Gl(o.type)) {
              Qe = o.stateNode, vt = !1;
              break e;
            }
            break;
          case 5:
            Qe = o.stateNode, vt = !1;
            break e;
          case 3:
          case 4:
            Qe = o.stateNode.containerInfo, vt = !0;
            break e;
        }
        o = o.return;
      }
      if (Qe === null) throw Error(d(160));
      Cr(s, c, i), Qe = null, vt = !1, s = i.alternate, s !== null && (s.return = null), i.return = null;
    }
    if (t.subtreeFlags & 13886) for (t = t.child; t !== null; ) kr(t, e), t = t.sibling;
  }
  var Kt = null;
  function kr(e, t) {
    var l = e.alternate, a = e.flags;
    switch (e.tag) {
      case 0:
      case 11:
      case 14:
      case 15:
        bt(t, e), yt(e), a & 4 && (Dl(3, e, e.return), Dn(3, e), Dl(5, e, e.return));
        break;
      case 1:
        bt(t, e), yt(e), a & 512 && (at || l === null || Ft(l, l.return)), a & 64 && fl && (e = e.updateQueue, e !== null && (a = e.callbacks, a !== null && (l = e.shared.hiddenCallbacks, e.shared.hiddenCallbacks = l === null ? a : l.concat(a))));
        break;
      case 26:
        var i = Kt;
        if (bt(t, e), yt(e), a & 512 && (at || l === null || Ft(l, l.return)), a & 4) {
          var s = l !== null ? l.memoizedState : null;
          if (a = e.memoizedState, l === null) if (a === null) if (e.stateNode === null) {
            e: {
              a = e.type, l = e.memoizedProps, i = i.ownerDocument || i;
              t: switch (a) {
                case "title":
                  s = i.getElementsByTagName("title")[0], (!s || s[un] || s[ot] || s.namespaceURI === "http://www.w3.org/2000/svg" || s.hasAttribute("itemprop")) && (s = i.createElement(a), i.head.insertBefore(s, i.querySelector("head > title"))), pt(s, a, l), s[ot] = e, st(s), a = s;
                  break e;
                case "link":
                  var c = Uf("link", "href", i).get(a + (l.href || ""));
                  if (c) {
                    for (var o = 0; o < c.length; o++) if (s = c[o], s.getAttribute("href") === (l.href == null || l.href === "" ? null : l.href) && s.getAttribute("rel") === (l.rel == null ? null : l.rel) && s.getAttribute("title") === (l.title == null ? null : l.title) && s.getAttribute("crossorigin") === (l.crossOrigin == null ? null : l.crossOrigin)) {
                      c.splice(o, 1);
                      break t;
                    }
                  }
                  s = i.createElement(a), pt(s, a, l), i.head.appendChild(s);
                  break;
                case "meta":
                  if (c = Uf("meta", "content", i).get(a + (l.content || ""))) {
                    for (o = 0; o < c.length; o++) if (s = c[o], s.getAttribute("content") === (l.content == null ? null : "" + l.content) && s.getAttribute("name") === (l.name == null ? null : l.name) && s.getAttribute("property") === (l.property == null ? null : l.property) && s.getAttribute("http-equiv") === (l.httpEquiv == null ? null : l.httpEquiv) && s.getAttribute("charset") === (l.charSet == null ? null : l.charSet)) {
                      c.splice(o, 1);
                      break t;
                    }
                  }
                  s = i.createElement(a), pt(s, a, l), i.head.appendChild(s);
                  break;
                default:
                  throw Error(d(468, a));
              }
              s[ot] = e, st(s), a = s;
            }
            e.stateNode = a;
          } else Rf(i, e.type, e.stateNode);
          else e.stateNode = Df(i, a, e.memoizedProps);
          else s !== a ? (s === null ? l.stateNode !== null && (l = l.stateNode, l.parentNode.removeChild(l)) : s.count--, a === null ? Rf(i, e.type, e.stateNode) : Df(i, a, e.memoizedProps)) : a === null && e.stateNode !== null && Jc(e, e.memoizedProps, l.memoizedProps);
        }
        break;
      case 27:
        bt(t, e), yt(e), a & 512 && (at || l === null || Ft(l, l.return)), l !== null && a & 4 && Jc(e, e.memoizedProps, l.memoizedProps);
        break;
      case 5:
        if (bt(t, e), yt(e), a & 512 && (at || l === null || Ft(l, l.return)), e.flags & 32) {
          i = e.stateNode;
          try {
            ja(i, "");
          } catch (ee) {
            Re(e, e.return, ee);
          }
        }
        a & 4 && e.stateNode != null && (i = e.memoizedProps, Jc(e, i, l !== null ? l.memoizedProps : i)), a & 1024 && (Wc = !0);
        break;
      case 6:
        if (bt(t, e), yt(e), a & 4) {
          if (e.stateNode === null) throw Error(d(162));
          a = e.memoizedProps, l = e.stateNode;
          try {
            l.nodeValue = a;
          } catch (ee) {
            Re(e, e.return, ee);
          }
        }
        break;
      case 3:
        if (cs = null, i = Kt, Kt = is(t.containerInfo), bt(t, e), Kt = i, yt(e), a & 4 && l !== null && l.memoizedState.isDehydrated) try {
          Fa(t.containerInfo);
        } catch (ee) {
          Re(e, e.return, ee);
        }
        Wc && (Wc = !1, Dr(e));
        break;
      case 4:
        a = Kt, Kt = is(e.stateNode.containerInfo), bt(t, e), yt(e), Kt = a;
        break;
      case 12:
        bt(t, e), yt(e);
        break;
      case 31:
        bt(t, e), yt(e), a & 4 && (a = e.updateQueue, a !== null && (e.updateQueue = null, Qi(e, a)));
        break;
      case 13:
        bt(t, e), yt(e), e.child.flags & 8192 && e.memoizedState !== null != (l !== null && l.memoizedState !== null) && (Ki = De()), a & 4 && (a = e.updateQueue, a !== null && (e.updateQueue = null, Qi(e, a)));
        break;
      case 22:
        i = e.memoizedState !== null;
        var p = l !== null && l.memoizedState !== null, z = fl, C = at;
        if (fl = z || i, at = C || p, bt(t, e), at = C, fl = z, yt(e), a & 8192) e: for (t = e.stateNode, t._visibility = i ? t._visibility & -2 : t._visibility | 1, i && (l === null || p || fl || at || fa(e)), l = null, t = e; ; ) {
          if (t.tag === 5 || t.tag === 26) {
            if (l === null) {
              p = l = t;
              try {
                if (s = p.stateNode, i) c = s.style, typeof c.setProperty == "function" ? c.setProperty("display", "none", "important") : c.display = "none";
                else {
                  o = p.stateNode;
                  var R = p.memoizedProps.style, N = R != null && R.hasOwnProperty("display") ? R.display : null;
                  o.style.display = N == null || typeof N == "boolean" ? "" : ("" + N).trim();
                }
              } catch (ee) {
                Re(p, p.return, ee);
              }
            }
          } else if (t.tag === 6) {
            if (l === null) {
              p = t;
              try {
                p.stateNode.nodeValue = i ? "" : p.memoizedProps;
              } catch (ee) {
                Re(p, p.return, ee);
              }
            }
          } else if (t.tag === 18) {
            if (l === null) {
              p = t;
              try {
                var A = p.stateNode;
                i ? _f(A, !0) : _f(p.stateNode, !1);
              } catch (ee) {
                Re(p, p.return, ee);
              }
            }
          } else if ((t.tag !== 22 && t.tag !== 23 || t.memoizedState === null || t === e) && t.child !== null) {
            t.child.return = t, t = t.child;
            continue;
          }
          if (t === e) break e;
          for (; t.sibling === null; ) {
            if (t.return === null || t.return === e) break e;
            l === t && (l = null), t = t.return;
          }
          l === t && (l = null), t.sibling.return = t.return, t = t.sibling;
        }
        a & 4 && (a = e.updateQueue, a !== null && (l = a.retryQueue, l !== null && (a.retryQueue = null, Qi(e, l))));
        break;
      case 19:
        bt(t, e), yt(e), a & 4 && (a = e.updateQueue, a !== null && (e.updateQueue = null, Qi(e, a)));
        break;
      case 30:
        break;
      case 21:
        break;
      default:
        bt(t, e), yt(e);
    }
  }
  function yt(e) {
    var t = e.flags;
    if (t & 2) {
      try {
        for (var l, a = e.return; a !== null; ) {
          if (_r(a)) {
            l = a;
            break;
          }
          a = a.return;
        }
        if (l == null) throw Error(d(160));
        switch (l.tag) {
          case 27:
            var i = l.stateNode;
            Xi(e, Ic(e), i);
            break;
          case 5:
            var s = l.stateNode;
            l.flags & 32 && (ja(s, ""), l.flags &= -33), Xi(e, Ic(e), s);
            break;
          case 3:
          case 4:
            var c = l.stateNode.containerInfo;
            $c(e, Ic(e), c);
            break;
          default:
            throw Error(d(161));
        }
      } catch (o) {
        Re(e, e.return, o);
      }
      e.flags &= -3;
    }
    t & 4096 && (e.flags &= -4097);
  }
  function Dr(e) {
    if (e.subtreeFlags & 1024) for (e = e.child; e !== null; ) {
      var t = e;
      Dr(t), t.tag === 5 && t.flags & 1024 && t.stateNode.reset(), e = e.sibling;
    }
  }
  function hl(e, t) {
    if (t.subtreeFlags & 8772) for (t = t.child; t !== null; ) Tr(e, t.alternate, t), t = t.sibling;
  }
  function fa(e) {
    for (e = e.child; e !== null; ) {
      var t = e;
      switch (t.tag) {
        case 0:
        case 11:
        case 14:
        case 15:
          Dl(4, t, t.return), fa(t);
          break;
        case 1:
          Ft(t, t.return);
          var l = t.stateNode;
          typeof l.componentWillUnmount == "function" && zr(t, t.return, l), fa(t);
          break;
        case 27:
          Xn(t.stateNode);
        case 26:
        case 5:
          Ft(t, t.return), fa(t);
          break;
        case 22:
          t.memoizedState === null && fa(t);
          break;
        case 30:
          fa(t);
          break;
        default:
          fa(t);
      }
      e = e.sibling;
    }
  }
  function ml(e, t, l) {
    for (l = l && (t.subtreeFlags & 8772) !== 0, t = t.child; t !== null; ) {
      var a = t.alternate, i = e, s = t, c = s.flags;
      switch (s.tag) {
        case 0:
        case 11:
        case 15:
          ml(i, s, l), Dn(4, s);
          break;
        case 1:
          if (ml(i, s, l), a = s, i = a.stateNode, typeof i.componentDidMount == "function") try {
            i.componentDidMount();
          } catch (z) {
            Re(a, a.return, z);
          }
          if (a = s, i = a.updateQueue, i !== null) {
            var o = a.stateNode;
            try {
              var p = i.shared.hiddenCallbacks;
              if (p !== null) for (i.shared.hiddenCallbacks = null, i = 0; i < p.length; i++) hd(p[i], o);
            } catch (z) {
              Re(a, a.return, z);
            }
          }
          l && c & 64 && Sr(s), Un(s, s.return);
          break;
        case 27:
          wr(s);
        case 26:
        case 5:
          ml(i, s, l), l && a === null && c & 4 && Nr(s), Un(s, s.return);
          break;
        case 12:
          ml(i, s, l);
          break;
        case 31:
          ml(i, s, l), l && c & 4 && Mr(i, s);
          break;
        case 13:
          ml(i, s, l), l && c & 4 && Or(i, s);
          break;
        case 22:
          s.memoizedState === null && ml(i, s, l), Un(s, s.return);
          break;
        case 30:
          break;
        default:
          ml(i, s, l);
      }
      t = t.sibling;
    }
  }
  function Fc(e, t) {
    var l = null;
    e !== null && e.memoizedState !== null && e.memoizedState.cachePool !== null && (l = e.memoizedState.cachePool.pool), e = null, t.memoizedState !== null && t.memoizedState.cachePool !== null && (e = t.memoizedState.cachePool.pool), e !== l && (e != null && e.refCount++, l != null && jn(l));
  }
  function Pc(e, t) {
    e = null, t.alternate !== null && (e = t.alternate.memoizedState.cache), t = t.memoizedState.cache, t !== e && (t.refCount++, e != null && jn(e));
  }
  function Jt(e, t, l, a) {
    if (t.subtreeFlags & 10256) for (t = t.child; t !== null; ) Ur(e, t, l, a), t = t.sibling;
  }
  function Ur(e, t, l, a) {
    var i = t.flags;
    switch (t.tag) {
      case 0:
      case 11:
      case 15:
        Jt(e, t, l, a), i & 2048 && Dn(9, t);
        break;
      case 1:
        Jt(e, t, l, a);
        break;
      case 3:
        Jt(e, t, l, a), i & 2048 && (e = null, t.alternate !== null && (e = t.alternate.memoizedState.cache), t = t.memoizedState.cache, t !== e && (t.refCount++, e != null && jn(e)));
        break;
      case 12:
        if (i & 2048) {
          Jt(e, t, l, a), e = t.stateNode;
          try {
            var s = t.memoizedProps, c = s.id, o = s.onPostCommit;
            typeof o == "function" && o(c, t.alternate === null ? "mount" : "update", e.passiveEffectDuration, -0);
          } catch (p) {
            Re(t, t.return, p);
          }
        } else Jt(e, t, l, a);
        break;
      case 31:
        Jt(e, t, l, a);
        break;
      case 13:
        Jt(e, t, l, a);
        break;
      case 23:
        break;
      case 22:
        s = t.stateNode, c = t.alternate, t.memoizedState !== null ? s._visibility & 2 ? Jt(e, t, l, a) : Rn(e, t) : s._visibility & 2 ? Jt(e, t, l, a) : (s._visibility |= 2, Ga(e, t, l, a, (t.subtreeFlags & 10256) !== 0 || !1)), i & 2048 && Fc(c, t);
        break;
      case 24:
        Jt(e, t, l, a), i & 2048 && Pc(t.alternate, t);
        break;
      default:
        Jt(e, t, l, a);
    }
  }
  function Ga(e, t, l, a, i) {
    for (i = i && ((t.subtreeFlags & 10256) !== 0 || !1), t = t.child; t !== null; ) {
      var s = e, c = t, o = l, p = a, z = c.flags;
      switch (c.tag) {
        case 0:
        case 11:
        case 15:
          Ga(s, c, o, p, i), Dn(8, c);
          break;
        case 23:
          break;
        case 22:
          var C = c.stateNode;
          c.memoizedState !== null ? C._visibility & 2 ? Ga(s, c, o, p, i) : Rn(s, c) : (C._visibility |= 2, Ga(s, c, o, p, i)), i && z & 2048 && Fc(c.alternate, c);
          break;
        case 24:
          Ga(s, c, o, p, i), i && z & 2048 && Pc(c.alternate, c);
          break;
        default:
          Ga(s, c, o, p, i);
      }
      t = t.sibling;
    }
  }
  function Rn(e, t) {
    if (t.subtreeFlags & 10256) for (t = t.child; t !== null; ) {
      var l = e, a = t, i = a.flags;
      switch (a.tag) {
        case 22:
          Rn(l, a), i & 2048 && Fc(a.alternate, a);
          break;
        case 24:
          Rn(l, a), i & 2048 && Pc(a.alternate, a);
          break;
        default:
          Rn(l, a);
      }
      t = t.sibling;
    }
  }
  var qn = 8192;
  function Ya(e, t, l) {
    if (e.subtreeFlags & qn) for (e = e.child; e !== null; ) Rr(e, t, l), e = e.sibling;
  }
  function Rr(e, t, l) {
    switch (e.tag) {
      case 26:
        Ya(e, t, l), e.flags & qn && e.memoizedState !== null && fh(l, Kt, e.memoizedState, e.memoizedProps);
        break;
      case 5:
        Ya(e, t, l);
        break;
      case 3:
      case 4:
        var a = Kt;
        Kt = is(e.stateNode.containerInfo), Ya(e, t, l), Kt = a;
        break;
      case 22:
        e.memoizedState === null && (a = e.alternate, a !== null && a.memoizedState !== null ? (a = qn, qn = 16777216, Ya(e, t, l), qn = a) : Ya(e, t, l));
        break;
      default:
        Ya(e, t, l);
    }
  }
  function qr(e) {
    var t = e.alternate;
    if (t !== null && (e = t.child, e !== null)) {
      t.child = null;
      do
        t = e.sibling, e.sibling = null, e = t;
      while (e !== null);
    }
  }
  function Hn(e) {
    var t = e.deletions;
    if ((e.flags & 16) !== 0) {
      if (t !== null) for (var l = 0; l < t.length; l++) {
        var a = t[l];
        ct = a, Br(a, e);
      }
      qr(e);
    }
    if (e.subtreeFlags & 10256) for (e = e.child; e !== null; ) Hr(e), e = e.sibling;
  }
  function Hr(e) {
    switch (e.tag) {
      case 0:
      case 11:
      case 15:
        Hn(e), e.flags & 2048 && Dl(9, e, e.return);
        break;
      case 3:
        Hn(e);
        break;
      case 12:
        Hn(e);
        break;
      case 22:
        var t = e.stateNode;
        e.memoizedState !== null && t._visibility & 2 && (e.return === null || e.return.tag !== 13) ? (t._visibility &= -3, Zi(e)) : Hn(e);
        break;
      default:
        Hn(e);
    }
  }
  function Zi(e) {
    var t = e.deletions;
    if ((e.flags & 16) !== 0) {
      if (t !== null) for (var l = 0; l < t.length; l++) {
        var a = t[l];
        ct = a, Br(a, e);
      }
      qr(e);
    }
    for (e = e.child; e !== null; ) {
      switch (t = e, t.tag) {
        case 0:
        case 11:
        case 15:
          Dl(8, t, t.return), Zi(t);
          break;
        case 22:
          l = t.stateNode, l._visibility & 2 && (l._visibility &= -3, Zi(t));
          break;
        default:
          Zi(t);
      }
      e = e.sibling;
    }
  }
  function Br(e, t) {
    for (; ct !== null; ) {
      var l = ct;
      switch (l.tag) {
        case 0:
        case 11:
        case 15:
          Dl(8, l, t);
          break;
        case 23:
        case 22:
          if (l.memoizedState !== null && l.memoizedState.cachePool !== null) {
            var a = l.memoizedState.cachePool.pool;
            a != null && a.refCount++;
          }
          break;
        case 24:
          jn(l.memoizedState.cache);
      }
      if (a = l.child, a !== null) a.return = l, ct = a;
      else e: for (l = e; ct !== null; ) {
        a = ct;
        var i = a.sibling, s = a.return;
        if (Ar(a), a === l) {
          ct = null;
          break e;
        }
        if (i !== null) {
          i.return = s, ct = i;
          break e;
        }
        ct = s;
      }
    }
  }
  var A0 = {
    getCacheForType: function(e) {
      var t = rt(et), l = t.data.get(e);
      return l === void 0 && (l = e(), t.data.set(e, l)), l;
    },
    cacheSignal: function() {
      return rt(et).controller.signal;
    }
  }, C0 = typeof WeakMap == "function" ? WeakMap : Map, Oe = 0, Ge = null, je = null, ze = 0, Ue = 0, At = null, Ul = !1, Va = !1, eu = !1, xl = 0, Ie = 0, Rl = 0, pa = 0, tu = 0, Ct = 0, Xa = 0, Bn = null, jt = null, lu = !1, Ki = 0, Lr = 0, Ji = 1 / 0, Ii = null, ql = null, it = 0, Hl = null, Qa = null, gl = 0, au = 0, nu = null, Gr = null, Ln = 0, iu = null;
  function Lt() {
    return (Oe & 2) !== 0 && ze !== 0 ? ze & -ze : O.T !== null ? ru() : io();
  }
  function Yr() {
    if (Ct === 0) if ((ze & 536870912) === 0 || we) {
      var e = li;
      li <<= 1, (li & 3932160) === 0 && (li = 262144), Ct = e;
    } else Ct = 536870912;
    return e = Et.current, e !== null && (e.flags |= 32), Ct;
  }
  function St(e, t, l) {
    (e === Ge && (Ue === 2 || Ue === 9) || e.cancelPendingCommit !== null) && (Za(e, 0), Bl(e, ze, Ct, !1)), ii(e, l), ((Oe & 2) === 0 || e !== Ge) && (e === Ge && ((Oe & 2) === 0 && (pa |= l), Ie === 4 && Bl(e, ze, Ct, !1)), vl(e));
  }
  function Vr(e, t, l) {
    if ((Oe & 6) !== 0) throw Error(d(327));
    var a = !l && (t & 127) === 0 && (t & e.expiredLanes) === 0 || sn(e, t), i = a ? k0(e, t) : cu(e, t, !0), s = a;
    do {
      if (i === 0) {
        Va && !a && Bl(e, t, 0, !1);
        break;
      } else {
        if (l = e.current.alternate, s && !M0(l)) {
          i = cu(e, t, !1), s = !1;
          continue;
        }
        if (i === 2) {
          if (s = t, e.errorRecoveryDisabledLanes & s) var c = 0;
          else c = e.pendingLanes & -536870913, c = c !== 0 ? c : c & 536870912 ? 536870912 : 0;
          if (c !== 0) {
            t = c;
            e: {
              var o = e;
              i = Bn;
              var p = o.current.memoizedState.isDehydrated;
              if (p && (Za(o, c).flags |= 256), c = cu(o, c, !1), c !== 2) {
                if (eu && !p) {
                  o.errorRecoveryDisabledLanes |= s, pa |= s, i = 4;
                  break e;
                }
                s = jt, jt = i, s !== null && (jt === null ? jt = s : jt.push.apply(jt, s));
              }
              i = c;
            }
            if (s = !1, i !== 2) continue;
          }
        }
        if (i === 1) {
          Za(e, 0), Bl(e, t, 0, !0);
          break;
        }
        e: {
          switch (a = e, s = i, s) {
            case 0:
            case 1:
              throw Error(d(345));
            case 4:
              if ((t & 4194048) !== t) break;
            case 6:
              Bl(a, t, Ct, !Ul);
              break e;
            case 2:
              jt = null;
              break;
            case 3:
            case 5:
              break;
            default:
              throw Error(d(329));
          }
          if ((t & 62914560) === t && (i = Ki + 300 - De(), 10 < i)) {
            if (Bl(a, t, Ct, !Ul), ni(a, 0, !0) !== 0) break e;
            gl = t, a.timeoutHandle = Sf(Xr.bind(null, a, l, jt, Ii, lu, t, Ct, pa, Xa, Ul, s, "Throttled", -0, 0), i);
            break e;
          }
          Xr(a, l, jt, Ii, lu, t, Ct, pa, Xa, Ul, s, null, -0, 0);
        }
      }
      break;
    } while (!0);
    vl(e);
  }
  function Xr(e, t, l, a, i, s, c, o, p, z, C, R, N, A) {
    if (e.timeoutHandle = -1, R = t.subtreeFlags, R & 8192 || (R & 16785408) === 16785408) {
      R = {
        stylesheets: null,
        count: 0,
        imgCount: 0,
        imgBytes: 0,
        suspenseyImages: [],
        waitingForImages: !0,
        waitingForViewTransition: !1,
        unsuspend: ll
      }, Rr(t, s, R);
      var ee = (s & 62914560) === s ? Ki - De() : (s & 4194048) === s ? Lr - De() : 0;
      if (ee = ph(R, ee), ee !== null) {
        gl = s, e.cancelPendingCommit = ee(Fr.bind(null, e, t, s, l, a, i, c, o, p, C, R, null, N, A)), Bl(e, s, c, !z);
        return;
      }
    }
    Fr(e, t, s, l, a, i, c, o, p);
  }
  function M0(e) {
    for (var t = e; ; ) {
      var l = t.tag;
      if ((l === 0 || l === 11 || l === 15) && t.flags & 16384 && (l = t.updateQueue, l !== null && (l = l.stores, l !== null))) for (var a = 0; a < l.length; a++) {
        var i = l[a], s = i.getSnapshot;
        i = i.value;
        try {
          if (!_t(s(), i)) return !1;
        } catch {
          return !1;
        }
      }
      if (l = t.child, t.subtreeFlags & 16384 && l !== null) l.return = t, t = l;
      else {
        if (t === e) break;
        for (; t.sibling === null; ) {
          if (t.return === null || t.return === e) return !0;
          t = t.return;
        }
        t.sibling.return = t.return, t = t.sibling;
      }
    }
    return !0;
  }
  function Bl(e, t, l, a) {
    t &= ~tu, t &= ~pa, e.suspendedLanes |= t, e.pingedLanes &= ~t, a && (e.warmLanes |= t), a = e.expirationTimes;
    for (var i = t; 0 < i; ) {
      var s = 31 - Nt(i), c = 1 << s;
      a[s] = -1, i &= ~c;
    }
    l !== 0 && to(e, l, t);
  }
  function $i() {
    return (Oe & 6) === 0 ? (Gn(0, !1), !1) : !0;
  }
  function su() {
    if (je !== null) {
      if (Ue === 0) var e = je.return;
      else e = je, sl = la = null, Sc(e), Ra = null, zn = 0, e = je;
      for (; e !== null; ) jr(e.alternate, e), e = e.return;
      je = null;
    }
  }
  function Za(e, t) {
    var l = e.timeoutHandle;
    l !== -1 && (e.timeoutHandle = -1, I0(l)), l = e.cancelPendingCommit, l !== null && (e.cancelPendingCommit = null, l()), gl = 0, su(), Ge = e, je = l = nl(e.current, null), ze = t, Ue = 0, At = null, Ul = !1, Va = sn(e, t), eu = !1, Xa = Ct = tu = pa = Rl = Ie = 0, jt = Bn = null, lu = !1, (t & 8) !== 0 && (t |= t & 32);
    var a = e.entangledLanes;
    if (a !== 0) for (e = e.entanglements, a &= t; 0 < a; ) {
      var i = 31 - Nt(a), s = 1 << i;
      t |= e[i], a &= ~s;
    }
    return xl = t, gi(), l;
  }
  function Qr(e, t) {
    ge = null, O.H = Mn, t === Ua || t === _i ? (t = dd(), Ue = 3) : t === dc ? (t = dd(), Ue = 4) : Ue = t === Hc ? 8 : t !== null && typeof t == "object" && typeof t.then == "function" ? 6 : 1, At = t, je === null && (Ie = 1, Bi(e, Ut(t, e.current)));
  }
  function Zr() {
    var e = Et.current;
    return e === null ? !0 : (ze & 4194048) === ze ? Bt === null : (ze & 62914560) === ze || (ze & 536870912) !== 0 ? e === Bt : !1;
  }
  function Kr() {
    var e = O.H;
    return O.H = Mn, e === null ? Mn : e;
  }
  function Jr() {
    var e = O.A;
    return O.A = A0, e;
  }
  function Wi() {
    Ie = 4, Ul || (ze & 4194048) !== ze && Et.current !== null || (Va = !0), (Rl & 134217727) === 0 && (pa & 134217727) === 0 || Ge === null || Bl(Ge, ze, Ct, !1);
  }
  function cu(e, t, l) {
    var a = Oe;
    Oe |= 2;
    var i = Kr(), s = Jr();
    (Ge !== e || ze !== t) && (Ii = null, Za(e, t)), t = !1;
    var c = Ie;
    e: do
      try {
        if (Ue !== 0 && je !== null) {
          var o = je, p = At;
          switch (Ue) {
            case 8:
              su(), c = 6;
              break e;
            case 3:
            case 2:
            case 9:
            case 6:
              Et.current === null && (t = !0);
              var z = Ue;
              if (Ue = 0, At = null, Ka(e, o, p, z), l && Va) {
                c = 0;
                break e;
              }
              break;
            default:
              z = Ue, Ue = 0, At = null, Ka(e, o, p, z);
          }
        }
        O0(), c = Ie;
        break;
      } catch (C) {
        Qr(e, C);
      }
    while (!0);
    return t && e.shellSuspendCounter++, sl = la = null, Oe = a, O.H = i, O.A = s, je === null && (Ge = null, ze = 0, gi()), c;
  }
  function O0() {
    for (; je !== null; ) Ir(je);
  }
  function k0(e, t) {
    var l = Oe;
    Oe |= 2;
    var a = Kr(), i = Jr();
    Ge !== e || ze !== t ? (Ii = null, Ji = De() + 500, Za(e, t)) : Va = sn(e, t);
    e: do
      try {
        if (Ue !== 0 && je !== null) {
          t = je;
          var s = At;
          t: switch (Ue) {
            case 1:
              Ue = 0, At = null, Ka(e, t, s, 1);
              break;
            case 2:
            case 9:
              if (ud(s)) {
                Ue = 0, At = null, $r(t);
                break;
              }
              t = function() {
                Ue !== 2 && Ue !== 9 || Ge !== e || (Ue = 7), vl(e);
              }, s.then(t, t);
              break e;
            case 3:
              Ue = 7;
              break e;
            case 4:
              Ue = 5;
              break e;
            case 7:
              ud(s) ? (Ue = 0, At = null, $r(t)) : (Ue = 0, At = null, Ka(e, t, s, 7));
              break;
            case 5:
              var c = null;
              switch (je.tag) {
                case 26:
                  c = je.memoizedState;
                case 5:
                case 27:
                  var o = je;
                  if (c ? qf(c) : o.stateNode.complete) {
                    Ue = 0, At = null;
                    var p = o.sibling;
                    if (p !== null) je = p;
                    else {
                      var z = o.return;
                      z !== null ? (je = z, Fi(z)) : je = null;
                    }
                    break t;
                  }
              }
              Ue = 0, At = null, Ka(e, t, s, 5);
              break;
            case 6:
              Ue = 0, At = null, Ka(e, t, s, 6);
              break;
            case 8:
              su(), Ie = 6;
              break e;
            default:
              throw Error(d(462));
          }
        }
        D0();
        break;
      } catch (C) {
        Qr(e, C);
      }
    while (!0);
    return sl = la = null, O.H = a, O.A = i, Oe = l, je !== null ? 0 : (Ge = null, ze = 0, gi(), Ie);
  }
  function D0() {
    for (; je !== null && !Pe(); ) Ir(je);
  }
  function Ir(e) {
    var t = br(e.alternate, e, xl);
    e.memoizedProps = e.pendingProps, t === null ? Fi(e) : je = t;
  }
  function $r(e) {
    var t = e, l = t.alternate;
    switch (t.tag) {
      case 15:
      case 0:
        t = pr(l, t, t.pendingProps, t.type, void 0, ze);
        break;
      case 11:
        t = pr(l, t, t.pendingProps, t.type.render, t.ref, ze);
        break;
      case 5:
        Sc(t);
      default:
        jr(l, t), t = je = Wo(t, xl), t = br(l, t, xl);
    }
    e.memoizedProps = e.pendingProps, t === null ? Fi(e) : je = t;
  }
  function Ka(e, t, l, a) {
    sl = la = null, Sc(t), Ra = null, zn = 0;
    var i = t.return;
    try {
      if (S0(e, i, t, l, ze)) {
        Ie = 1, Bi(e, Ut(l, e.current)), je = null;
        return;
      }
    } catch (s) {
      if (i !== null) throw je = i, s;
      Ie = 1, Bi(e, Ut(l, e.current)), je = null;
      return;
    }
    t.flags & 32768 ? (we || a === 1 ? e = !0 : Va || (ze & 536870912) !== 0 ? e = !1 : (Ul = e = !0, (a === 2 || a === 9 || a === 3 || a === 6) && (a = Et.current, a !== null && a.tag === 13 && (a.flags |= 16384))), Wr(t, e)) : Fi(t);
  }
  function Fi(e) {
    var t = e;
    do {
      if ((t.flags & 32768) !== 0) {
        Wr(t, Ul);
        return;
      }
      e = t.return;
      var l = _0(t.alternate, t, xl);
      if (l !== null) {
        je = l;
        return;
      }
      if (t = t.sibling, t !== null) {
        je = t;
        return;
      }
      je = t = e;
    } while (t !== null);
    Ie === 0 && (Ie = 5);
  }
  function Wr(e, t) {
    do {
      var l = w0(e.alternate, e);
      if (l !== null) {
        l.flags &= 32767, je = l;
        return;
      }
      if (l = e.return, l !== null && (l.flags |= 32768, l.subtreeFlags = 0, l.deletions = null), !t && (e = e.sibling, e !== null)) {
        je = e;
        return;
      }
      je = e = l;
    } while (e !== null);
    Ie = 6, je = null;
  }
  function Fr(e, t, l, a, i, s, c, o, p) {
    e.cancelPendingCommit = null;
    do
      Pi();
    while (it !== 0);
    if ((Oe & 6) !== 0) throw Error(d(327));
    if (t !== null) {
      if (t === e.current) throw Error(d(177));
      if (s = t.lanes | t.childLanes, s |= Is, jp(e, l, s, c, o, p), e === Ge && (je = Ge = null, ze = 0), Qa = t, Hl = e, gl = l, au = s, nu = i, Gr = a, (t.subtreeFlags & 10256) !== 0 || (t.flags & 10256) !== 0 ? (e.callbackNode = null, e.callbackPriority = 0, H0(se, function() {
        return af(), null;
      })) : (e.callbackNode = null, e.callbackPriority = 0), a = (t.flags & 13878) !== 0, (t.subtreeFlags & 13878) !== 0 || a) {
        a = O.T, O.T = null, i = V.p, V.p = 2, c = Oe, Oe |= 4;
        try {
          E0(e, t, l);
        } finally {
          Oe = c, V.p = i, O.T = a;
        }
      }
      it = 1, Pr(), ef(), tf();
    }
  }
  function Pr() {
    if (it === 1) {
      it = 0;
      var e = Hl, t = Qa, l = (t.flags & 13878) !== 0;
      if ((t.subtreeFlags & 13878) !== 0 || l) {
        l = O.T, O.T = null;
        var a = V.p;
        V.p = 2;
        var i = Oe;
        Oe |= 4;
        try {
          kr(t, e);
          var s = vu, c = Yo(e.containerInfo), o = s.focusedElem, p = s.selectionRange;
          if (c !== o && o && o.ownerDocument && Go(o.ownerDocument.documentElement, o)) {
            if (p !== null && Xs(o)) {
              var z = p.start, C = p.end;
              if (C === void 0 && (C = z), "selectionStart" in o) o.selectionStart = z, o.selectionEnd = Math.min(C, o.value.length);
              else {
                var R = o.ownerDocument || document, N = R && R.defaultView || window;
                if (N.getSelection) {
                  var A = N.getSelection(), ee = o.textContent.length, re = Math.min(p.start, ee), Be = p.end === void 0 ? re : Math.min(p.end, ee);
                  !A.extend && re > Be && (c = Be, Be = re, re = c);
                  var y = Lo(o, re), g = Lo(o, Be);
                  if (y && g && (A.rangeCount !== 1 || A.anchorNode !== y.node || A.anchorOffset !== y.offset || A.focusNode !== g.node || A.focusOffset !== g.offset)) {
                    var S = R.createRange();
                    S.setStart(y.node, y.offset), A.removeAllRanges(), re > Be ? (A.addRange(S), A.extend(g.node, g.offset)) : (S.setEnd(g.node, g.offset), A.addRange(S));
                  }
                }
              }
            }
            for (R = [], A = o; A = A.parentNode; ) A.nodeType === 1 && R.push({
              element: A,
              left: A.scrollLeft,
              top: A.scrollTop
            });
            for (typeof o.focus == "function" && o.focus(), o = 0; o < R.length; o++) {
              var D = R[o];
              D.element.scrollLeft = D.left, D.element.scrollTop = D.top;
            }
          }
          rs = !!gu, vu = gu = null;
        } finally {
          Oe = i, V.p = a, O.T = l;
        }
      }
      e.current = t, it = 2;
    }
  }
  function ef() {
    if (it === 2) {
      it = 0;
      var e = Hl, t = Qa, l = (t.flags & 8772) !== 0;
      if ((t.subtreeFlags & 8772) !== 0 || l) {
        l = O.T, O.T = null;
        var a = V.p;
        V.p = 2;
        var i = Oe;
        Oe |= 4;
        try {
          Tr(e, t.alternate, t);
        } finally {
          Oe = i, V.p = a, O.T = l;
        }
      }
      it = 3;
    }
  }
  function tf() {
    if (it === 4 || it === 3) {
      it = 0, Mt();
      var e = Hl, t = Qa, l = gl, a = Gr;
      (t.subtreeFlags & 10256) !== 0 || (t.flags & 10256) !== 0 ? it = 5 : (it = 0, Qa = Hl = null, lf(e, e.pendingLanes));
      var i = e.pendingLanes;
      if (i === 0 && (ql = null), _s(l), t = t.stateNode, Ke && typeof Ke.onCommitFiberRoot == "function") try {
        Ke.onCommitFiberRoot(zl, t, void 0, (t.current.flags & 128) === 128);
      } catch {
      }
      if (a !== null) {
        t = O.T, i = V.p, V.p = 2, O.T = null;
        try {
          for (var s = e.onRecoverableError, c = 0; c < a.length; c++) {
            var o = a[c];
            s(o.value, { componentStack: o.stack });
          }
        } finally {
          O.T = t, V.p = i;
        }
      }
      (gl & 3) !== 0 && Pi(), vl(e), i = e.pendingLanes, (l & 261930) !== 0 && (i & 42) !== 0 ? e === iu ? Ln++ : (Ln = 0, iu = e) : Ln = 0, Gn(0, !1);
    }
  }
  function lf(e, t) {
    (e.pooledCacheLanes &= t) === 0 && (t = e.pooledCache, t != null && (e.pooledCache = null, jn(t)));
  }
  function Pi() {
    return Pr(), ef(), tf(), af();
  }
  function af() {
    if (it !== 5) return !1;
    var e = Hl, t = au;
    au = 0;
    var l = _s(gl), a = O.T, i = V.p;
    try {
      V.p = 32 > l ? 32 : l, O.T = null, l = nu, nu = null;
      var s = Hl, c = gl;
      if (it = 0, Qa = Hl = null, gl = 0, (Oe & 6) !== 0) throw Error(d(331));
      var o = Oe;
      if (Oe |= 4, Hr(s.current), Ur(s, s.current, c, l), Oe = o, Gn(0, !1), Ke && typeof Ke.onPostCommitFiberRoot == "function") try {
        Ke.onPostCommitFiberRoot(zl, s);
      } catch {
      }
      return !0;
    } finally {
      V.p = i, O.T = a, lf(e, t);
    }
  }
  function nf(e, t, l) {
    t = Ut(l, t), t = qc(e.stateNode, t, 2), e = oa(e, t, 2), e !== null && (ii(e, 2), vl(e));
  }
  function Re(e, t, l) {
    if (e.tag === 3) nf(e, e, l);
    else for (; t !== null; ) {
      if (t.tag === 3) {
        nf(t, e, l);
        break;
      } else if (t.tag === 1) {
        var a = t.stateNode;
        if (typeof t.type.getDerivedStateFromError == "function" || typeof a.componentDidCatch == "function" && (ql === null || !ql.has(a))) {
          e = Ut(l, e), l = ir(2), a = oa(t, l, 2), a !== null && (sr(l, a, t, e), ii(a, 2), vl(a));
          break;
        }
      }
      t = t.return;
    }
  }
  function uu(e, t, l) {
    var a = e.pingCache;
    if (a === null) {
      a = e.pingCache = new C0();
      var i = /* @__PURE__ */ new Set();
      a.set(t, i);
    } else i = a.get(t), i === void 0 && (i = /* @__PURE__ */ new Set(), a.set(t, i));
    i.has(l) || (eu = !0, i.add(l), e = U0.bind(null, e, t, l), t.then(e, e));
  }
  function U0(e, t, l) {
    var a = e.pingCache;
    a !== null && a.delete(t), e.pingedLanes |= e.suspendedLanes & l, e.warmLanes &= ~l, Ge === e && (ze & l) === l && (Ie === 4 || Ie === 3 && (ze & 62914560) === ze && 300 > De() - Ki ? (Oe & 2) === 0 && Za(e, 0) : tu |= l, Xa === ze && (Xa = 0)), vl(e);
  }
  function sf(e, t) {
    t === 0 && (t = eo()), e = Pl(e, t), e !== null && (ii(e, t), vl(e));
  }
  function R0(e) {
    var t = e.memoizedState, l = 0;
    t !== null && (l = t.retryLane), sf(e, l);
  }
  function q0(e, t) {
    var l = 0;
    switch (e.tag) {
      case 31:
      case 13:
        var a = e.stateNode, i = e.memoizedState;
        i !== null && (l = i.retryLane);
        break;
      case 19:
        a = e.stateNode;
        break;
      case 22:
        a = e.stateNode._retryCache;
        break;
      default:
        throw Error(d(314));
    }
    a !== null && a.delete(t), sf(e, l);
  }
  function H0(e, t) {
    return w(e, t);
  }
  var es = null, Ja = null, ou = !1, ts = !1, du = !1, Ll = 0;
  function vl(e) {
    e !== Ja && e.next === null && (Ja === null ? es = Ja = e : Ja = Ja.next = e), ts = !0, ou || (ou = !0, L0());
  }
  function Gn(e, t) {
    if (!du && ts) {
      du = !0;
      do
        for (var l = !1, a = es; a !== null; ) {
          if (!t) if (e !== 0) {
            var i = a.pendingLanes;
            if (i === 0) var s = 0;
            else {
              var c = a.suspendedLanes, o = a.pingedLanes;
              s = (1 << 31 - Nt(42 | e) + 1) - 1, s &= i & ~(c & ~o), s = s & 201326741 ? s & 201326741 | 1 : s ? s | 2 : 0;
            }
            s !== 0 && (l = !0, df(a, s));
          } else s = ze, s = ni(a, a === Ge ? s : 0, a.cancelPendingCommit !== null || a.timeoutHandle !== -1), (s & 3) === 0 || sn(a, s) || (l = !0, df(a, s));
          a = a.next;
        }
      while (l);
      du = !1;
    }
  }
  function B0() {
    cf();
  }
  function cf() {
    ts = ou = !1;
    var e = 0;
    Ll !== 0 && J0() && (e = Ll);
    for (var t = De(), l = null, a = es; a !== null; ) {
      var i = a.next, s = uf(a, t);
      s === 0 ? (a.next = null, l === null ? es = i : l.next = i, i === null && (Ja = l)) : (l = a, (e !== 0 || (s & 3) !== 0) && (ts = !0)), a = i;
    }
    it !== 0 && it !== 5 || Gn(e, !1), Ll !== 0 && (Ll = 0);
  }
  function uf(e, t) {
    for (var l = e.suspendedLanes, a = e.pingedLanes, i = e.expirationTimes, s = e.pendingLanes & -62914561; 0 < s; ) {
      var c = 31 - Nt(s), o = 1 << c, p = i[c];
      p === -1 ? ((o & l) === 0 || (o & a) !== 0) && (i[c] = yp(o, t)) : p <= t && (e.expiredLanes |= o), s &= ~o;
    }
    if (t = Ge, l = ze, l = ni(e, e === t ? l : 0, e.cancelPendingCommit !== null || e.timeoutHandle !== -1), a = e.callbackNode, l === 0 || e === t && (Ue === 2 || Ue === 9) || e.cancelPendingCommit !== null) return a !== null && a !== null && Le(a), e.callbackNode = null, e.callbackPriority = 0;
    if ((l & 3) === 0 || sn(e, l)) {
      if (t = l & -l, t === e.callbackPriority) return t;
      switch (a !== null && Le(a), _s(l)) {
        case 2:
        case 8:
          l = f;
          break;
        case 32:
          l = se;
          break;
        case 268435456:
          l = ut;
          break;
        default:
          l = se;
      }
      return a = of.bind(null, e), l = w(l, a), e.callbackPriority = t, e.callbackNode = l, t;
    }
    return a !== null && a !== null && Le(a), e.callbackPriority = 2, e.callbackNode = null, 2;
  }
  function of(e, t) {
    if (it !== 0 && it !== 5) return e.callbackNode = null, e.callbackPriority = 0, null;
    var l = e.callbackNode;
    if (Pi() && e.callbackNode !== l) return null;
    var a = ze;
    return a = ni(e, e === Ge ? a : 0, e.cancelPendingCommit !== null || e.timeoutHandle !== -1), a === 0 ? null : (Vr(e, a, t), uf(e, De()), e.callbackNode != null && e.callbackNode === l ? of.bind(null, e) : null);
  }
  function df(e, t) {
    if (Pi()) return null;
    Vr(e, t, !0);
  }
  function L0() {
    $0(function() {
      (Oe & 6) !== 0 ? w(Sl, B0) : cf();
    });
  }
  function ru() {
    if (Ll === 0) {
      var e = ka;
      e === 0 && (e = ti, ti <<= 1, (ti & 261888) === 0 && (ti = 256)), Ll = e;
    }
    return Ll;
  }
  function rf(e) {
    return e == null || typeof e == "symbol" || typeof e == "boolean" ? null : typeof e == "function" ? e : oi("" + e);
  }
  function ff(e, t) {
    var l = t.ownerDocument.createElement("input");
    return l.name = t.name, l.value = t.value, e.id && l.setAttribute("form", e.id), t.parentNode.insertBefore(l, t), e = new FormData(e), l.parentNode.removeChild(l), e;
  }
  function G0(e, t, l, a, i) {
    if (t === "submit" && l && l.stateNode === i) {
      var s = rf((i[xt] || null).action), c = a.submitter;
      c && (t = (t = c[xt] || null) ? rf(t.formAction) : c.getAttribute("formAction"), t !== null && (s = t, c = null));
      var o = new pi("action", "action", null, a, i);
      e.push({
        event: o,
        listeners: [{
          instance: null,
          listener: function() {
            if (a.defaultPrevented) {
              if (Ll !== 0) {
                var p = c ? ff(i, c) : new FormData(i);
                Mc(l, {
                  pending: !0,
                  data: p,
                  method: i.method,
                  action: s
                }, null, p);
              }
            } else typeof s == "function" && (o.preventDefault(), p = c ? ff(i, c) : new FormData(i), Mc(l, {
              pending: !0,
              data: p,
              method: i.method,
              action: s
            }, s, p));
          },
          currentTarget: i
        }]
      });
    }
  }
  for (var fu = 0; fu < Js.length; fu++) {
    var pu = Js[fu];
    Zt(pu.toLowerCase(), "on" + (pu[0].toUpperCase() + pu.slice(1)));
  }
  Zt(Qo, "onAnimationEnd"), Zt(Zo, "onAnimationIteration"), Zt(Ko, "onAnimationStart"), Zt("dblclick", "onDoubleClick"), Zt("focusin", "onFocus"), Zt("focusout", "onBlur"), Zt(l0, "onTransitionRun"), Zt(a0, "onTransitionStart"), Zt(n0, "onTransitionCancel"), Zt(Jo, "onTransitionEnd"), ba("onMouseEnter", ["mouseout", "mouseover"]), ba("onMouseLeave", ["mouseout", "mouseover"]), ba("onPointerEnter", ["pointerout", "pointerover"]), ba("onPointerLeave", ["pointerout", "pointerover"]), Il("onChange", "change click focusin focusout input keydown keyup selectionchange".split(" ")), Il("onSelect", "focusout contextmenu dragend focusin keydown keyup mousedown mouseup selectionchange".split(" ")), Il("onBeforeInput", [
    "compositionend",
    "keypress",
    "textInput",
    "paste"
  ]), Il("onCompositionEnd", "compositionend focusout keydown keypress keyup mousedown".split(" ")), Il("onCompositionStart", "compositionstart focusout keydown keypress keyup mousedown".split(" ")), Il("onCompositionUpdate", "compositionupdate focusout keydown keypress keyup mousedown".split(" "));
  var Yn = "abort canplay canplaythrough durationchange emptied encrypted ended error loadeddata loadedmetadata loadstart pause play playing progress ratechange resize seeked seeking stalled suspend timeupdate volumechange waiting".split(" "), Y0 = new Set("beforetoggle cancel close invalid load scroll scrollend toggle".split(" ").concat(Yn));
  function pf(e, t) {
    t = (t & 4) !== 0;
    for (var l = 0; l < e.length; l++) {
      var a = e[l], i = a.event;
      a = a.listeners;
      e: {
        var s = void 0;
        if (t) for (var c = a.length - 1; 0 <= c; c--) {
          var o = a[c], p = o.instance, z = o.currentTarget;
          if (o = o.listener, p !== s && i.isPropagationStopped()) break e;
          s = o, i.currentTarget = z;
          try {
            s(i);
          } catch (C) {
            xi(C);
          }
          i.currentTarget = null, s = p;
        }
        else for (c = 0; c < a.length; c++) {
          if (o = a[c], p = o.instance, z = o.currentTarget, o = o.listener, p !== s && i.isPropagationStopped()) break e;
          s = o, i.currentTarget = z;
          try {
            s(i);
          } catch (C) {
            xi(C);
          }
          i.currentTarget = null, s = p;
        }
      }
    }
  }
  function Se(e, t) {
    var l = t[ws];
    l === void 0 && (l = t[ws] = /* @__PURE__ */ new Set());
    var a = e + "__bubble";
    l.has(a) || (mf(t, e, 2, !1), l.add(a));
  }
  function hu(e, t, l) {
    var a = 0;
    t && (a |= 4), mf(l, e, a, t);
  }
  var ls = "_reactListening" + Math.random().toString(36).slice(2);
  function hf(e) {
    if (!e[ls]) {
      e[ls] = !0, uo.forEach(function(l) {
        l !== "selectionchange" && (Y0.has(l) || hu(l, !1, e), hu(l, !0, e));
      });
      var t = e.nodeType === 9 ? e : e.ownerDocument;
      t === null || t[ls] || (t[ls] = !0, hu("selectionchange", !1, t));
    }
  }
  function mf(e, t, l, a) {
    switch (Yf(t)) {
      case 2:
        var i = vh;
        break;
      case 8:
        i = bh;
        break;
      default:
        i = Au;
    }
    l = i.bind(null, t, l, e), i = void 0, !Us || t !== "touchstart" && t !== "touchmove" && t !== "wheel" || (i = !0), a ? i !== void 0 ? e.addEventListener(t, l, {
      capture: !0,
      passive: i
    }) : e.addEventListener(t, l, !0) : i !== void 0 ? e.addEventListener(t, l, { passive: i }) : e.addEventListener(t, l, !1);
  }
  function mu(e, t, l, a, i) {
    var s = a;
    if ((t & 1) === 0 && (t & 2) === 0 && a !== null) e: for (; ; ) {
      if (a === null) return;
      var c = a.tag;
      if (c === 3 || c === 4) {
        var o = a.stateNode.containerInfo;
        if (o === i) break;
        if (c === 4) for (c = a.return; c !== null; ) {
          var p = c.tag;
          if ((p === 3 || p === 4) && c.stateNode.containerInfo === i) return;
          c = c.return;
        }
        for (; o !== null; ) {
          if (c = xa(o), c === null) return;
          if (p = c.tag, p === 5 || p === 6 || p === 26 || p === 27) {
            a = s = c;
            continue e;
          }
          o = o.parentNode;
        }
      }
      a = a.return;
    }
    jo(function() {
      var z = s, C = ks(l), R = [];
      e: {
        var N = Io.get(e);
        if (N !== void 0) {
          var A = pi, ee = e;
          switch (e) {
            case "keypress":
              if (ri(l) === 0) break e;
            case "keydown":
            case "keyup":
              A = Bp;
              break;
            case "focusin":
              ee = "focus", A = Bs;
              break;
            case "focusout":
              ee = "blur", A = Bs;
              break;
            case "beforeblur":
            case "afterblur":
              A = Bs;
              break;
            case "click":
              if (l.button === 2) break e;
            case "auxclick":
            case "dblclick":
            case "mousedown":
            case "mousemove":
            case "mouseup":
            case "mouseout":
            case "mouseover":
            case "contextmenu":
              A = No;
              break;
            case "drag":
            case "dragend":
            case "dragenter":
            case "dragexit":
            case "dragleave":
            case "dragover":
            case "dragstart":
            case "drop":
              A = Op;
              break;
            case "touchcancel":
            case "touchend":
            case "touchmove":
            case "touchstart":
              A = Lp;
              break;
            case Qo:
            case Zo:
            case Ko:
              A = kp;
              break;
            case Jo:
              A = Gp;
              break;
            case "scroll":
            case "scrollend":
              A = Mp;
              break;
            case "wheel":
              A = Yp;
              break;
            case "copy":
            case "cut":
            case "paste":
              A = Dp;
              break;
            case "gotpointercapture":
            case "lostpointercapture":
            case "pointercancel":
            case "pointerdown":
            case "pointermove":
            case "pointerout":
            case "pointerover":
            case "pointerup":
              A = wo;
              break;
            case "toggle":
            case "beforetoggle":
              A = Vp;
          }
          var re = (t & 4) !== 0, Be = !re && (e === "scroll" || e === "scrollend"), y = re ? N !== null ? N + "Capture" : null : N;
          re = [];
          for (var g = z, S; g !== null; ) {
            var D = g;
            if (S = D.stateNode, D = D.tag, D !== 5 && D !== 26 && D !== 27 || S === null || y === null || (D = dn(g, y), D != null && re.push(Vn(g, D, S))), Be) break;
            g = g.return;
          }
          0 < re.length && (N = new A(N, ee, null, l, C), R.push({
            event: N,
            listeners: re
          }));
        }
      }
      if ((t & 7) === 0) {
        e: {
          if (N = e === "mouseover" || e === "pointerover", A = e === "mouseout" || e === "pointerout", N && l !== Os && (ee = l.relatedTarget || l.fromElement) && (xa(ee) || ee[cn])) break e;
          if ((A || N) && (N = C.window === C ? C : (N = C.ownerDocument) ? N.defaultView || N.parentWindow : window, A ? (ee = l.relatedTarget || l.toElement, A = z, ee = ee ? xa(ee) : null, ee !== null && (Be = Y(ee), re = ee.tag, ee !== Be || re !== 5 && re !== 27 && re !== 6) && (ee = null)) : (A = null, ee = z), A !== ee)) {
            if (re = No, D = "onMouseLeave", y = "onMouseEnter", g = "mouse", (e === "pointerout" || e === "pointerover") && (re = wo, D = "onPointerLeave", y = "onPointerEnter", g = "pointer"), Be = A == null ? N : on(A), S = ee == null ? N : on(ee), N = new re(D, g + "leave", A, l, C), N.target = Be, N.relatedTarget = S, D = null, xa(C) === z && (re = new re(y, g + "enter", ee, l, C), re.target = S, re.relatedTarget = Be, D = re), Be = D, A && ee) t: {
              for (re = V0, y = A, g = ee, S = 0, D = y; D; D = re(D)) S++;
              D = 0;
              for (var ue = g; ue; ue = re(ue)) D++;
              for (; 0 < S - D; ) y = re(y), S--;
              for (; 0 < D - S; ) g = re(g), D--;
              for (; S--; ) {
                if (y === g || g !== null && y === g.alternate) {
                  re = y;
                  break t;
                }
                y = re(y), g = re(g);
              }
              re = null;
            }
            else re = null;
            A !== null && xf(R, N, A, re, !1), ee !== null && Be !== null && xf(R, Be, ee, re, !0);
          }
        }
        e: {
          if (N = z ? on(z) : window, A = N.nodeName && N.nodeName.toLowerCase(), A === "select" || A === "input" && N.type === "file") var Ae = Do;
          else if (Oo(N)) if (Uo) Ae = Pp;
          else {
            Ae = Wp;
            var le = $p;
          }
          else A = N.nodeName, !A || A.toLowerCase() !== "input" || N.type !== "checkbox" && N.type !== "radio" ? z && Ms(z.elementType) && (Ae = Do) : Ae = Fp;
          if (Ae && (Ae = Ae(e, z))) {
            ko(R, Ae, l, C);
            break e;
          }
          le && le(e, N, z), e === "focusout" && z && N.type === "number" && z.memoizedProps.value != null && Cs(N, "number", N.value);
        }
        switch (le = z ? on(z) : window, e) {
          case "focusin":
            (Oo(le) || le.contentEditable === "true") && (_a = le, Qs = z, vn = null);
            break;
          case "focusout":
            vn = Qs = _a = null;
            break;
          case "mousedown":
            Zs = !0;
            break;
          case "contextmenu":
          case "mouseup":
          case "dragend":
            Zs = !1, Vo(R, l, C);
            break;
          case "selectionchange":
            if (t0) break;
          case "keydown":
          case "keyup":
            Vo(R, l, C);
        }
        var ve;
        if (Gs) e: {
          switch (e) {
            case "compositionstart":
              var Ne = "onCompositionStart";
              break e;
            case "compositionend":
              Ne = "onCompositionEnd";
              break e;
            case "compositionupdate":
              Ne = "onCompositionUpdate";
              break e;
          }
          Ne = void 0;
        }
        else Na ? Co(e, l) && (Ne = "onCompositionEnd") : e === "keydown" && l.keyCode === 229 && (Ne = "onCompositionStart");
        Ne && (Eo && l.locale !== "ko" && (Na || Ne !== "onCompositionStart" ? Ne === "onCompositionEnd" && Na && (ve = So()) : (wl = C, Rs = "value" in wl ? wl.value : wl.textContent, Na = !0)), le = as(z, Ne), 0 < le.length && (Ne = new _o(Ne, e, null, l, C), R.push({
          event: Ne,
          listeners: le
        }), ve ? Ne.data = ve : (ve = Mo(l), ve !== null && (Ne.data = ve)))), (ve = Qp ? Zp(e, l) : Kp(e, l)) && (Ne = as(z, "onBeforeInput"), 0 < Ne.length && (le = new _o("onBeforeInput", "beforeinput", null, l, C), R.push({
          event: le,
          listeners: Ne
        }), le.data = ve)), G0(R, e, z, l, C);
      }
      pf(R, t);
    });
  }
  function Vn(e, t, l) {
    return {
      instance: e,
      listener: t,
      currentTarget: l
    };
  }
  function as(e, t) {
    for (var l = t + "Capture", a = []; e !== null; ) {
      var i = e, s = i.stateNode;
      if (i = i.tag, i !== 5 && i !== 26 && i !== 27 || s === null || (i = dn(e, l), i != null && a.unshift(Vn(e, i, s)), i = dn(e, t), i != null && a.push(Vn(e, i, s))), e.tag === 3) return a;
      e = e.return;
    }
    return [];
  }
  function V0(e) {
    if (e === null) return null;
    do
      e = e.return;
    while (e && e.tag !== 5 && e.tag !== 27);
    return e || null;
  }
  function xf(e, t, l, a, i) {
    for (var s = t._reactName, c = []; l !== null && l !== a; ) {
      var o = l, p = o.alternate, z = o.stateNode;
      if (o = o.tag, p !== null && p === a) break;
      o !== 5 && o !== 26 && o !== 27 || z === null || (p = z, i ? (z = dn(l, s), z != null && c.unshift(Vn(l, z, p))) : i || (z = dn(l, s), z != null && c.push(Vn(l, z, p)))), l = l.return;
    }
    c.length !== 0 && e.push({
      event: t,
      listeners: c
    });
  }
  var X0 = /\r\n?/g, Q0 = /\u0000|\uFFFD/g;
  function gf(e) {
    return (typeof e == "string" ? e : "" + e).replace(X0, `
`).replace(Q0, "");
  }
  function vf(e, t) {
    return t = gf(t), gf(e) === t;
  }
  function He(e, t, l, a, i, s) {
    switch (l) {
      case "children":
        typeof a == "string" ? t === "body" || t === "textarea" && a === "" || ja(e, a) : (typeof a == "number" || typeof a == "bigint") && t !== "body" && ja(e, "" + a);
        break;
      case "className":
        ci(e, "class", a);
        break;
      case "tabIndex":
        ci(e, "tabindex", a);
        break;
      case "dir":
      case "role":
      case "viewBox":
      case "width":
      case "height":
        ci(e, l, a);
        break;
      case "style":
        bo(e, a, s);
        break;
      case "data":
        if (t !== "object") {
          ci(e, "data", a);
          break;
        }
      case "src":
      case "href":
        if (a === "" && (t !== "a" || l !== "href")) {
          e.removeAttribute(l);
          break;
        }
        if (a == null || typeof a == "function" || typeof a == "symbol" || typeof a == "boolean") {
          e.removeAttribute(l);
          break;
        }
        a = oi("" + a), e.setAttribute(l, a);
        break;
      case "action":
      case "formAction":
        if (typeof a == "function") {
          e.setAttribute(l, "javascript:throw new Error('A React form was unexpectedly submitted. If you called form.submit() manually, consider using form.requestSubmit() instead. If you\\'re trying to use event.stopPropagation() in a submit event handler, consider also calling event.preventDefault().')");
          break;
        } else typeof s == "function" && (l === "formAction" ? (t !== "input" && He(e, t, "name", i.name, i, null), He(e, t, "formEncType", i.formEncType, i, null), He(e, t, "formMethod", i.formMethod, i, null), He(e, t, "formTarget", i.formTarget, i, null)) : (He(e, t, "encType", i.encType, i, null), He(e, t, "method", i.method, i, null), He(e, t, "target", i.target, i, null)));
        if (a == null || typeof a == "symbol" || typeof a == "boolean") {
          e.removeAttribute(l);
          break;
        }
        a = oi("" + a), e.setAttribute(l, a);
        break;
      case "onClick":
        a != null && (e.onclick = ll);
        break;
      case "onScroll":
        a != null && Se("scroll", e);
        break;
      case "onScrollEnd":
        a != null && Se("scrollend", e);
        break;
      case "dangerouslySetInnerHTML":
        if (a != null) {
          if (typeof a != "object" || !("__html" in a)) throw Error(d(61));
          if (l = a.__html, l != null) {
            if (i.children != null) throw Error(d(60));
            e.innerHTML = l;
          }
        }
        break;
      case "multiple":
        e.multiple = a && typeof a != "function" && typeof a != "symbol";
        break;
      case "muted":
        e.muted = a && typeof a != "function" && typeof a != "symbol";
        break;
      case "suppressContentEditableWarning":
      case "suppressHydrationWarning":
      case "defaultValue":
      case "defaultChecked":
      case "innerHTML":
      case "ref":
        break;
      case "autoFocus":
        break;
      case "xlinkHref":
        if (a == null || typeof a == "function" || typeof a == "boolean" || typeof a == "symbol") {
          e.removeAttribute("xlink:href");
          break;
        }
        l = oi("" + a), e.setAttributeNS("http://www.w3.org/1999/xlink", "xlink:href", l);
        break;
      case "contentEditable":
      case "spellCheck":
      case "draggable":
      case "value":
      case "autoReverse":
      case "externalResourcesRequired":
      case "focusable":
      case "preserveAlpha":
        a != null && typeof a != "function" && typeof a != "symbol" ? e.setAttribute(l, "" + a) : e.removeAttribute(l);
        break;
      case "inert":
      case "allowFullScreen":
      case "async":
      case "autoPlay":
      case "controls":
      case "default":
      case "defer":
      case "disabled":
      case "disablePictureInPicture":
      case "disableRemotePlayback":
      case "formNoValidate":
      case "hidden":
      case "loop":
      case "noModule":
      case "noValidate":
      case "open":
      case "playsInline":
      case "readOnly":
      case "required":
      case "reversed":
      case "scoped":
      case "seamless":
      case "itemScope":
        a && typeof a != "function" && typeof a != "symbol" ? e.setAttribute(l, "") : e.removeAttribute(l);
        break;
      case "capture":
      case "download":
        a === !0 ? e.setAttribute(l, "") : a !== !1 && a != null && typeof a != "function" && typeof a != "symbol" ? e.setAttribute(l, a) : e.removeAttribute(l);
        break;
      case "cols":
      case "rows":
      case "size":
      case "span":
        a != null && typeof a != "function" && typeof a != "symbol" && !isNaN(a) && 1 <= a ? e.setAttribute(l, a) : e.removeAttribute(l);
        break;
      case "rowSpan":
      case "start":
        a == null || typeof a == "function" || typeof a == "symbol" || isNaN(a) ? e.removeAttribute(l) : e.setAttribute(l, a);
        break;
      case "popover":
        Se("beforetoggle", e), Se("toggle", e), si(e, "popover", a);
        break;
      case "xlinkActuate":
        tl(e, "http://www.w3.org/1999/xlink", "xlink:actuate", a);
        break;
      case "xlinkArcrole":
        tl(e, "http://www.w3.org/1999/xlink", "xlink:arcrole", a);
        break;
      case "xlinkRole":
        tl(e, "http://www.w3.org/1999/xlink", "xlink:role", a);
        break;
      case "xlinkShow":
        tl(e, "http://www.w3.org/1999/xlink", "xlink:show", a);
        break;
      case "xlinkTitle":
        tl(e, "http://www.w3.org/1999/xlink", "xlink:title", a);
        break;
      case "xlinkType":
        tl(e, "http://www.w3.org/1999/xlink", "xlink:type", a);
        break;
      case "xmlBase":
        tl(e, "http://www.w3.org/XML/1998/namespace", "xml:base", a);
        break;
      case "xmlLang":
        tl(e, "http://www.w3.org/XML/1998/namespace", "xml:lang", a);
        break;
      case "xmlSpace":
        tl(e, "http://www.w3.org/XML/1998/namespace", "xml:space", a);
        break;
      case "is":
        si(e, "is", a);
        break;
      case "innerText":
      case "textContent":
        break;
      default:
        (!(2 < l.length) || l[0] !== "o" && l[0] !== "O" || l[1] !== "n" && l[1] !== "N") && (l = Ap.get(l) || l, si(e, l, a));
    }
  }
  function xu(e, t, l, a, i, s) {
    switch (l) {
      case "style":
        bo(e, a, s);
        break;
      case "dangerouslySetInnerHTML":
        if (a != null) {
          if (typeof a != "object" || !("__html" in a)) throw Error(d(61));
          if (l = a.__html, l != null) {
            if (i.children != null) throw Error(d(60));
            e.innerHTML = l;
          }
        }
        break;
      case "children":
        typeof a == "string" ? ja(e, a) : (typeof a == "number" || typeof a == "bigint") && ja(e, "" + a);
        break;
      case "onScroll":
        a != null && Se("scroll", e);
        break;
      case "onScrollEnd":
        a != null && Se("scrollend", e);
        break;
      case "onClick":
        a != null && (e.onclick = ll);
        break;
      case "suppressContentEditableWarning":
      case "suppressHydrationWarning":
      case "innerHTML":
      case "ref":
        break;
      case "innerText":
      case "textContent":
        break;
      default:
        if (!oo.hasOwnProperty(l)) e: {
          if (l[0] === "o" && l[1] === "n" && (i = l.endsWith("Capture"), t = l.slice(2, i ? l.length - 7 : void 0), s = e[xt] || null, s = s != null ? s[l] : null, typeof s == "function" && e.removeEventListener(t, s, i), typeof a == "function")) {
            typeof s != "function" && s !== null && (l in e ? e[l] = null : e.hasAttribute(l) && e.removeAttribute(l)), e.addEventListener(t, a, i);
            break e;
          }
          l in e ? e[l] = a : a === !0 ? e.setAttribute(l, "") : si(e, l, a);
        }
    }
  }
  function pt(e, t, l) {
    switch (t) {
      case "div":
      case "span":
      case "svg":
      case "path":
      case "a":
      case "g":
      case "p":
      case "li":
        break;
      case "img":
        Se("error", e), Se("load", e);
        var a = !1, i = !1, s;
        for (s in l) if (l.hasOwnProperty(s)) {
          var c = l[s];
          if (c != null) switch (s) {
            case "src":
              a = !0;
              break;
            case "srcSet":
              i = !0;
              break;
            case "children":
            case "dangerouslySetInnerHTML":
              throw Error(d(137, t));
            default:
              He(e, t, s, c, l, null);
          }
        }
        i && He(e, t, "srcSet", l.srcSet, l, null), a && He(e, t, "src", l.src, l, null);
        return;
      case "input":
        Se("invalid", e);
        var o = s = c = i = null, p = null, z = null;
        for (a in l) if (l.hasOwnProperty(a)) {
          var C = l[a];
          if (C != null) switch (a) {
            case "name":
              i = C;
              break;
            case "type":
              c = C;
              break;
            case "checked":
              p = C;
              break;
            case "defaultChecked":
              z = C;
              break;
            case "value":
              s = C;
              break;
            case "defaultValue":
              o = C;
              break;
            case "children":
            case "dangerouslySetInnerHTML":
              if (C != null) throw Error(d(137, t));
              break;
            default:
              He(e, t, a, C, l, null);
          }
        }
        mo(e, s, o, p, z, c, i, !1);
        return;
      case "select":
        Se("invalid", e), a = c = s = null;
        for (i in l) if (l.hasOwnProperty(i) && (o = l[i], o != null)) switch (i) {
          case "value":
            s = o;
            break;
          case "defaultValue":
            c = o;
            break;
          case "multiple":
            a = o;
          default:
            He(e, t, i, o, l, null);
        }
        t = s, l = c, e.multiple = !!a, t != null ? ya(e, !!a, t, !1) : l != null && ya(e, !!a, l, !0);
        return;
      case "textarea":
        Se("invalid", e), s = i = a = null;
        for (c in l) if (l.hasOwnProperty(c) && (o = l[c], o != null)) switch (c) {
          case "value":
            a = o;
            break;
          case "defaultValue":
            i = o;
            break;
          case "children":
            s = o;
            break;
          case "dangerouslySetInnerHTML":
            if (o != null) throw Error(d(91));
            break;
          default:
            He(e, t, c, o, l, null);
        }
        go(e, a, i, s);
        return;
      case "option":
        for (p in l) l.hasOwnProperty(p) && (a = l[p], a != null) && (p === "selected" ? e.selected = a && typeof a != "function" && typeof a != "symbol" : He(e, t, p, a, l, null));
        return;
      case "dialog":
        Se("beforetoggle", e), Se("toggle", e), Se("cancel", e), Se("close", e);
        break;
      case "iframe":
      case "object":
        Se("load", e);
        break;
      case "video":
      case "audio":
        for (a = 0; a < Yn.length; a++) Se(Yn[a], e);
        break;
      case "image":
        Se("error", e), Se("load", e);
        break;
      case "details":
        Se("toggle", e);
        break;
      case "embed":
      case "source":
      case "link":
        Se("error", e), Se("load", e);
      case "area":
      case "base":
      case "br":
      case "col":
      case "hr":
      case "keygen":
      case "meta":
      case "param":
      case "track":
      case "wbr":
      case "menuitem":
        for (z in l) if (l.hasOwnProperty(z) && (a = l[z], a != null)) switch (z) {
          case "children":
          case "dangerouslySetInnerHTML":
            throw Error(d(137, t));
          default:
            He(e, t, z, a, l, null);
        }
        return;
      default:
        if (Ms(t)) {
          for (C in l) l.hasOwnProperty(C) && (a = l[C], a !== void 0 && xu(e, t, C, a, l, void 0));
          return;
        }
    }
    for (o in l) l.hasOwnProperty(o) && (a = l[o], a != null && He(e, t, o, a, l, null));
  }
  function Z0(e, t, l, a) {
    switch (t) {
      case "div":
      case "span":
      case "svg":
      case "path":
      case "a":
      case "g":
      case "p":
      case "li":
        break;
      case "input":
        var i = null, s = null, c = null, o = null, p = null, z = null, C = null;
        for (A in l) {
          var R = l[A];
          if (l.hasOwnProperty(A) && R != null) switch (A) {
            case "checked":
              break;
            case "value":
              break;
            case "defaultValue":
              p = R;
            default:
              a.hasOwnProperty(A) || He(e, t, A, null, a, R);
          }
        }
        for (var N in a) {
          var A = a[N];
          if (R = l[N], a.hasOwnProperty(N) && (A != null || R != null)) switch (N) {
            case "type":
              s = A;
              break;
            case "name":
              i = A;
              break;
            case "checked":
              z = A;
              break;
            case "defaultChecked":
              C = A;
              break;
            case "value":
              c = A;
              break;
            case "defaultValue":
              o = A;
              break;
            case "children":
            case "dangerouslySetInnerHTML":
              if (A != null) throw Error(d(137, t));
              break;
            default:
              A !== R && He(e, t, N, A, a, R);
          }
        }
        As(e, c, o, p, z, C, s, i);
        return;
      case "select":
        A = c = o = N = null;
        for (s in l) if (p = l[s], l.hasOwnProperty(s) && p != null) switch (s) {
          case "value":
            break;
          case "multiple":
            A = p;
          default:
            a.hasOwnProperty(s) || He(e, t, s, null, a, p);
        }
        for (i in a) if (s = a[i], p = l[i], a.hasOwnProperty(i) && (s != null || p != null)) switch (i) {
          case "value":
            N = s;
            break;
          case "defaultValue":
            o = s;
            break;
          case "multiple":
            c = s;
          default:
            s !== p && He(e, t, i, s, a, p);
        }
        t = o, l = c, a = A, N != null ? ya(e, !!l, N, !1) : !!a != !!l && (t != null ? ya(e, !!l, t, !0) : ya(e, !!l, l ? [] : "", !1));
        return;
      case "textarea":
        A = N = null;
        for (o in l) if (i = l[o], l.hasOwnProperty(o) && i != null && !a.hasOwnProperty(o)) switch (o) {
          case "value":
            break;
          case "children":
            break;
          default:
            He(e, t, o, null, a, i);
        }
        for (c in a) if (i = a[c], s = l[c], a.hasOwnProperty(c) && (i != null || s != null)) switch (c) {
          case "value":
            N = i;
            break;
          case "defaultValue":
            A = i;
            break;
          case "children":
            break;
          case "dangerouslySetInnerHTML":
            if (i != null) throw Error(d(91));
            break;
          default:
            i !== s && He(e, t, c, i, a, s);
        }
        xo(e, N, A);
        return;
      case "option":
        for (var ee in l) N = l[ee], l.hasOwnProperty(ee) && N != null && !a.hasOwnProperty(ee) && (ee === "selected" ? e.selected = !1 : He(e, t, ee, null, a, N));
        for (p in a) N = a[p], A = l[p], a.hasOwnProperty(p) && N !== A && (N != null || A != null) && (p === "selected" ? e.selected = N && typeof N != "function" && typeof N != "symbol" : He(e, t, p, N, a, A));
        return;
      case "img":
      case "link":
      case "area":
      case "base":
      case "br":
      case "col":
      case "embed":
      case "hr":
      case "keygen":
      case "meta":
      case "param":
      case "source":
      case "track":
      case "wbr":
      case "menuitem":
        for (var re in l) N = l[re], l.hasOwnProperty(re) && N != null && !a.hasOwnProperty(re) && He(e, t, re, null, a, N);
        for (z in a) if (N = a[z], A = l[z], a.hasOwnProperty(z) && N !== A && (N != null || A != null)) switch (z) {
          case "children":
          case "dangerouslySetInnerHTML":
            if (N != null) throw Error(d(137, t));
            break;
          default:
            He(e, t, z, N, a, A);
        }
        return;
      default:
        if (Ms(t)) {
          for (var Be in l) N = l[Be], l.hasOwnProperty(Be) && N !== void 0 && !a.hasOwnProperty(Be) && xu(e, t, Be, void 0, a, N);
          for (C in a) N = a[C], A = l[C], !a.hasOwnProperty(C) || N === A || N === void 0 && A === void 0 || xu(e, t, C, N, a, A);
          return;
        }
    }
    for (var y in l) N = l[y], l.hasOwnProperty(y) && N != null && !a.hasOwnProperty(y) && He(e, t, y, null, a, N);
    for (R in a) N = a[R], A = l[R], !a.hasOwnProperty(R) || N === A || N == null && A == null || He(e, t, R, N, a, A);
  }
  function bf(e) {
    switch (e) {
      case "css":
      case "script":
      case "font":
      case "img":
      case "image":
      case "input":
      case "link":
        return !0;
      default:
        return !1;
    }
  }
  function K0() {
    if (typeof performance.getEntriesByType == "function") {
      for (var e = 0, t = 0, l = performance.getEntriesByType("resource"), a = 0; a < l.length; a++) {
        var i = l[a], s = i.transferSize, c = i.initiatorType, o = i.duration;
        if (s && o && bf(c)) {
          for (c = 0, o = i.responseEnd, a += 1; a < l.length; a++) {
            var p = l[a], z = p.startTime;
            if (z > o) break;
            var C = p.transferSize, R = p.initiatorType;
            C && bf(R) && (p = p.responseEnd, c += C * (p < o ? 1 : (o - z) / (p - z)));
          }
          if (--a, t += 8 * (s + c) / (i.duration / 1e3), e++, 10 < e) break;
        }
      }
      if (0 < e) return t / e / 1e6;
    }
    return navigator.connection && (e = navigator.connection.downlink, typeof e == "number") ? e : 5;
  }
  var gu = null, vu = null;
  function ns(e) {
    return e.nodeType === 9 ? e : e.ownerDocument;
  }
  function yf(e) {
    switch (e) {
      case "http://www.w3.org/2000/svg":
        return 1;
      case "http://www.w3.org/1998/Math/MathML":
        return 2;
      default:
        return 0;
    }
  }
  function jf(e, t) {
    if (e === 0) switch (t) {
      case "svg":
        return 1;
      case "math":
        return 2;
      default:
        return 0;
    }
    return e === 1 && t === "foreignObject" ? 0 : e;
  }
  function bu(e, t) {
    return e === "textarea" || e === "noscript" || typeof t.children == "string" || typeof t.children == "number" || typeof t.children == "bigint" || typeof t.dangerouslySetInnerHTML == "object" && t.dangerouslySetInnerHTML !== null && t.dangerouslySetInnerHTML.__html != null;
  }
  var yu = null;
  function J0() {
    var e = window.event;
    return e && e.type === "popstate" ? e === yu ? !1 : (yu = e, !0) : (yu = null, !1);
  }
  var Sf = typeof setTimeout == "function" ? setTimeout : void 0, I0 = typeof clearTimeout == "function" ? clearTimeout : void 0, zf = typeof Promise == "function" ? Promise : void 0, $0 = typeof queueMicrotask == "function" ? queueMicrotask : typeof zf < "u" ? function(e) {
    return zf.resolve(null).then(e).catch(W0);
  } : Sf;
  function W0(e) {
    setTimeout(function() {
      throw e;
    });
  }
  function Gl(e) {
    return e === "head";
  }
  function Nf(e, t) {
    var l = t, a = 0;
    do {
      var i = l.nextSibling;
      if (e.removeChild(l), i && i.nodeType === 8) if (l = i.data, l === "/$" || l === "/&") {
        if (a === 0) {
          e.removeChild(i), Fa(t);
          return;
        }
        a--;
      } else if (l === "$" || l === "$?" || l === "$~" || l === "$!" || l === "&") a++;
      else if (l === "html") Xn(e.ownerDocument.documentElement);
      else if (l === "head") {
        l = e.ownerDocument.head, Xn(l);
        for (var s = l.firstChild; s; ) {
          var c = s.nextSibling, o = s.nodeName;
          s[un] || o === "SCRIPT" || o === "STYLE" || o === "LINK" && s.rel.toLowerCase() === "stylesheet" || l.removeChild(s), s = c;
        }
      } else l === "body" && Xn(e.ownerDocument.body);
      l = i;
    } while (l);
    Fa(t);
  }
  function _f(e, t) {
    var l = e;
    e = 0;
    do {
      var a = l.nextSibling;
      if (l.nodeType === 1 ? t ? (l._stashedDisplay = l.style.display, l.style.display = "none") : (l.style.display = l._stashedDisplay || "", l.getAttribute("style") === "" && l.removeAttribute("style")) : l.nodeType === 3 && (t ? (l._stashedText = l.nodeValue, l.nodeValue = "") : l.nodeValue = l._stashedText || ""), a && a.nodeType === 8) if (l = a.data, l === "/$") {
        if (e === 0) break;
        e--;
      } else l !== "$" && l !== "$?" && l !== "$~" && l !== "$!" || e++;
      l = a;
    } while (l);
  }
  function ju(e) {
    var t = e.firstChild;
    for (t && t.nodeType === 10 && (t = t.nextSibling); t; ) {
      var l = t;
      switch (t = t.nextSibling, l.nodeName) {
        case "HTML":
        case "HEAD":
        case "BODY":
          ju(l), Es(l);
          continue;
        case "SCRIPT":
        case "STYLE":
          continue;
        case "LINK":
          if (l.rel.toLowerCase() === "stylesheet") continue;
      }
      e.removeChild(l);
    }
  }
  function F0(e, t, l, a) {
    for (; e.nodeType === 1; ) {
      var i = l;
      if (e.nodeName.toLowerCase() !== t.toLowerCase()) {
        if (!a && (e.nodeName !== "INPUT" || e.type !== "hidden")) break;
      } else if (a) {
        if (!e[un]) switch (t) {
          case "meta":
            if (!e.hasAttribute("itemprop")) break;
            return e;
          case "link":
            if (s = e.getAttribute("rel"), s === "stylesheet" && e.hasAttribute("data-precedence")) break;
            if (s !== i.rel || e.getAttribute("href") !== (i.href == null || i.href === "" ? null : i.href) || e.getAttribute("crossorigin") !== (i.crossOrigin == null ? null : i.crossOrigin) || e.getAttribute("title") !== (i.title == null ? null : i.title)) break;
            return e;
          case "style":
            if (e.hasAttribute("data-precedence")) break;
            return e;
          case "script":
            if (s = e.getAttribute("src"), (s !== (i.src == null ? null : i.src) || e.getAttribute("type") !== (i.type == null ? null : i.type) || e.getAttribute("crossorigin") !== (i.crossOrigin == null ? null : i.crossOrigin)) && s && e.hasAttribute("async") && !e.hasAttribute("itemprop")) break;
            return e;
          default:
            return e;
        }
      } else if (t === "input" && e.type === "hidden") {
        var s = i.name == null ? null : "" + i.name;
        if (i.type === "hidden" && e.getAttribute("name") === s) return e;
      } else return e;
      if (e = Gt(e.nextSibling), e === null) break;
    }
    return null;
  }
  function P0(e, t, l) {
    if (t === "") return null;
    for (; e.nodeType !== 3; )
      if ((e.nodeType !== 1 || e.nodeName !== "INPUT" || e.type !== "hidden") && !l || (e = Gt(e.nextSibling), e === null)) return null;
    return e;
  }
  function wf(e, t) {
    for (; e.nodeType !== 8; )
      if ((e.nodeType !== 1 || e.nodeName !== "INPUT" || e.type !== "hidden") && !t || (e = Gt(e.nextSibling), e === null)) return null;
    return e;
  }
  function Su(e) {
    return e.data === "$?" || e.data === "$~";
  }
  function zu(e) {
    return e.data === "$!" || e.data === "$?" && e.ownerDocument.readyState !== "loading";
  }
  function eh(e, t) {
    var l = e.ownerDocument;
    if (e.data === "$~") e._reactRetry = t;
    else if (e.data !== "$?" || l.readyState !== "loading") t();
    else {
      var a = function() {
        t(), l.removeEventListener("DOMContentLoaded", a);
      };
      l.addEventListener("DOMContentLoaded", a), e._reactRetry = a;
    }
  }
  function Gt(e) {
    for (; e != null; e = e.nextSibling) {
      var t = e.nodeType;
      if (t === 1 || t === 3) break;
      if (t === 8) {
        if (t = e.data, t === "$" || t === "$!" || t === "$?" || t === "$~" || t === "&" || t === "F!" || t === "F") break;
        if (t === "/$" || t === "/&") return null;
      }
    }
    return e;
  }
  var Nu = null;
  function Ef(e) {
    e = e.nextSibling;
    for (var t = 0; e; ) {
      if (e.nodeType === 8) {
        var l = e.data;
        if (l === "/$" || l === "/&") {
          if (t === 0) return Gt(e.nextSibling);
          t--;
        } else l !== "$" && l !== "$!" && l !== "$?" && l !== "$~" && l !== "&" || t++;
      }
      e = e.nextSibling;
    }
    return null;
  }
  function Tf(e) {
    e = e.previousSibling;
    for (var t = 0; e; ) {
      if (e.nodeType === 8) {
        var l = e.data;
        if (l === "$" || l === "$!" || l === "$?" || l === "$~" || l === "&") {
          if (t === 0) return e;
          t--;
        } else l !== "/$" && l !== "/&" || t++;
      }
      e = e.previousSibling;
    }
    return null;
  }
  function Af(e, t, l) {
    switch (t = ns(l), e) {
      case "html":
        if (e = t.documentElement, !e) throw Error(d(452));
        return e;
      case "head":
        if (e = t.head, !e) throw Error(d(453));
        return e;
      case "body":
        if (e = t.body, !e) throw Error(d(454));
        return e;
      default:
        throw Error(d(451));
    }
  }
  function Xn(e) {
    for (var t = e.attributes; t.length; ) e.removeAttributeNode(t[0]);
    Es(e);
  }
  var Yt = /* @__PURE__ */ new Map(), Cf = /* @__PURE__ */ new Set();
  function is(e) {
    return typeof e.getRootNode == "function" ? e.getRootNode() : e.nodeType === 9 ? e : e.ownerDocument;
  }
  var bl = V.d;
  V.d = {
    f: th,
    r: lh,
    D: ah,
    C: nh,
    L: ih,
    m: sh,
    X: uh,
    S: ch,
    M: oh
  };
  function th() {
    var e = bl.f(), t = $i();
    return e || t;
  }
  function lh(e) {
    var t = ga(e);
    t !== null && t.tag === 5 && t.type === "form" ? Jd(t) : bl.r(e);
  }
  var Ia = typeof document > "u" ? null : document;
  function Mf(e, t, l) {
    var a = Ia;
    if (a && typeof t == "string" && t) {
      var i = kt(t);
      i = 'link[rel="' + e + '"][href="' + i + '"]', typeof l == "string" && (i += '[crossorigin="' + l + '"]'), Cf.has(i) || (Cf.add(i), e = {
        rel: e,
        crossOrigin: l,
        href: t
      }, a.querySelector(i) === null && (t = a.createElement("link"), pt(t, "link", e), st(t), a.head.appendChild(t)));
    }
  }
  function ah(e) {
    bl.D(e), Mf("dns-prefetch", e, null);
  }
  function nh(e, t) {
    bl.C(e, t), Mf("preconnect", e, t);
  }
  function ih(e, t, l) {
    bl.L(e, t, l);
    var a = Ia;
    if (a && e && t) {
      var i = 'link[rel="preload"][as="' + kt(t) + '"]';
      t === "image" && l && l.imageSrcSet ? (i += '[imagesrcset="' + kt(l.imageSrcSet) + '"]', typeof l.imageSizes == "string" && (i += '[imagesizes="' + kt(l.imageSizes) + '"]')) : i += '[href="' + kt(e) + '"]';
      var s = i;
      switch (t) {
        case "style":
          s = $a(e);
          break;
        case "script":
          s = Wa(e);
      }
      Yt.has(s) || (e = H({
        rel: "preload",
        href: t === "image" && l && l.imageSrcSet ? void 0 : e,
        as: t
      }, l), Yt.set(s, e), a.querySelector(i) !== null || t === "style" && a.querySelector(Qn(s)) || t === "script" && a.querySelector(Zn(s)) || (t = a.createElement("link"), pt(t, "link", e), st(t), a.head.appendChild(t)));
    }
  }
  function sh(e, t) {
    bl.m(e, t);
    var l = Ia;
    if (l && e) {
      var a = t && typeof t.as == "string" ? t.as : "script", i = 'link[rel="modulepreload"][as="' + kt(a) + '"][href="' + kt(e) + '"]', s = i;
      switch (a) {
        case "audioworklet":
        case "paintworklet":
        case "serviceworker":
        case "sharedworker":
        case "worker":
        case "script":
          s = Wa(e);
      }
      if (!Yt.has(s) && (e = H({
        rel: "modulepreload",
        href: e
      }, t), Yt.set(s, e), l.querySelector(i) === null)) {
        switch (a) {
          case "audioworklet":
          case "paintworklet":
          case "serviceworker":
          case "sharedworker":
          case "worker":
          case "script":
            if (l.querySelector(Zn(s))) return;
        }
        a = l.createElement("link"), pt(a, "link", e), st(a), l.head.appendChild(a);
      }
    }
  }
  function ch(e, t, l) {
    bl.S(e, t, l);
    var a = Ia;
    if (a && e) {
      var i = va(a).hoistableStyles, s = $a(e);
      t = t || "default";
      var c = i.get(s);
      if (!c) {
        var o = {
          loading: 0,
          preload: null
        };
        if (c = a.querySelector(Qn(s))) o.loading = 5;
        else {
          e = H({
            rel: "stylesheet",
            href: e,
            "data-precedence": t
          }, l), (l = Yt.get(s)) && _u(e, l);
          var p = c = a.createElement("link");
          st(p), pt(p, "link", e), p._p = new Promise(function(z, C) {
            p.onload = z, p.onerror = C;
          }), p.addEventListener("load", function() {
            o.loading |= 1;
          }), p.addEventListener("error", function() {
            o.loading |= 2;
          }), o.loading |= 4, ss(c, t, a);
        }
        c = {
          type: "stylesheet",
          instance: c,
          count: 1,
          state: o
        }, i.set(s, c);
      }
    }
  }
  function uh(e, t) {
    bl.X(e, t);
    var l = Ia;
    if (l && e) {
      var a = va(l).hoistableScripts, i = Wa(e), s = a.get(i);
      s || (s = l.querySelector(Zn(i)), s || (e = H({
        src: e,
        async: !0
      }, t), (t = Yt.get(i)) && wu(e, t), s = l.createElement("script"), st(s), pt(s, "link", e), l.head.appendChild(s)), s = {
        type: "script",
        instance: s,
        count: 1,
        state: null
      }, a.set(i, s));
    }
  }
  function oh(e, t) {
    bl.M(e, t);
    var l = Ia;
    if (l && e) {
      var a = va(l).hoistableScripts, i = Wa(e), s = a.get(i);
      s || (s = l.querySelector(Zn(i)), s || (e = H({
        src: e,
        async: !0,
        type: "module"
      }, t), (t = Yt.get(i)) && wu(e, t), s = l.createElement("script"), st(s), pt(s, "link", e), l.head.appendChild(s)), s = {
        type: "script",
        instance: s,
        count: 1,
        state: null
      }, a.set(i, s));
    }
  }
  function Of(e, t, l, a) {
    var i = (i = me.current) ? is(i) : null;
    if (!i) throw Error(d(446));
    switch (e) {
      case "meta":
      case "title":
        return null;
      case "style":
        return typeof l.precedence == "string" && typeof l.href == "string" ? (t = $a(l.href), l = va(i).hoistableStyles, a = l.get(t), a || (a = {
          type: "style",
          instance: null,
          count: 0,
          state: null
        }, l.set(t, a)), a) : {
          type: "void",
          instance: null,
          count: 0,
          state: null
        };
      case "link":
        if (l.rel === "stylesheet" && typeof l.href == "string" && typeof l.precedence == "string") {
          e = $a(l.href);
          var s = va(i).hoistableStyles, c = s.get(e);
          if (c || (i = i.ownerDocument || i, c = {
            type: "stylesheet",
            instance: null,
            count: 0,
            state: {
              loading: 0,
              preload: null
            }
          }, s.set(e, c), (s = i.querySelector(Qn(e))) && !s._p && (c.instance = s, c.state.loading = 5), Yt.has(e) || (l = {
            rel: "preload",
            as: "style",
            href: l.href,
            crossOrigin: l.crossOrigin,
            integrity: l.integrity,
            media: l.media,
            hrefLang: l.hrefLang,
            referrerPolicy: l.referrerPolicy
          }, Yt.set(e, l), s || dh(i, e, l, c.state))), t && a === null) throw Error(d(528, ""));
          return c;
        }
        if (t && a !== null) throw Error(d(529, ""));
        return null;
      case "script":
        return t = l.async, l = l.src, typeof l == "string" && t && typeof t != "function" && typeof t != "symbol" ? (t = Wa(l), l = va(i).hoistableScripts, a = l.get(t), a || (a = {
          type: "script",
          instance: null,
          count: 0,
          state: null
        }, l.set(t, a)), a) : {
          type: "void",
          instance: null,
          count: 0,
          state: null
        };
      default:
        throw Error(d(444, e));
    }
  }
  function $a(e) {
    return 'href="' + kt(e) + '"';
  }
  function Qn(e) {
    return 'link[rel="stylesheet"][' + e + "]";
  }
  function kf(e) {
    return H({}, e, {
      "data-precedence": e.precedence,
      precedence: null
    });
  }
  function dh(e, t, l, a) {
    e.querySelector('link[rel="preload"][as="style"][' + t + "]") ? a.loading = 1 : (t = e.createElement("link"), a.preload = t, t.addEventListener("load", function() {
      return a.loading |= 1;
    }), t.addEventListener("error", function() {
      return a.loading |= 2;
    }), pt(t, "link", l), st(t), e.head.appendChild(t));
  }
  function Wa(e) {
    return '[src="' + kt(e) + '"]';
  }
  function Zn(e) {
    return "script[async]" + e;
  }
  function Df(e, t, l) {
    if (t.count++, t.instance === null) switch (t.type) {
      case "style":
        var a = e.querySelector('style[data-href~="' + kt(l.href) + '"]');
        if (a) return t.instance = a, st(a), a;
        var i = H({}, l, {
          "data-href": l.href,
          "data-precedence": l.precedence,
          href: null,
          precedence: null
        });
        return a = (e.ownerDocument || e).createElement("style"), st(a), pt(a, "style", i), ss(a, l.precedence, e), t.instance = a;
      case "stylesheet":
        i = $a(l.href);
        var s = e.querySelector(Qn(i));
        if (s) return t.state.loading |= 4, t.instance = s, st(s), s;
        a = kf(l), (i = Yt.get(i)) && _u(a, i), s = (e.ownerDocument || e).createElement("link"), st(s);
        var c = s;
        return c._p = new Promise(function(o, p) {
          c.onload = o, c.onerror = p;
        }), pt(s, "link", a), t.state.loading |= 4, ss(s, l.precedence, e), t.instance = s;
      case "script":
        return s = Wa(l.src), (i = e.querySelector(Zn(s))) ? (t.instance = i, st(i), i) : (a = l, (i = Yt.get(s)) && (a = H({}, l), wu(a, i)), e = e.ownerDocument || e, i = e.createElement("script"), st(i), pt(i, "link", a), e.head.appendChild(i), t.instance = i);
      case "void":
        return null;
      default:
        throw Error(d(443, t.type));
    }
    else t.type === "stylesheet" && (t.state.loading & 4) === 0 && (a = t.instance, t.state.loading |= 4, ss(a, l.precedence, e));
    return t.instance;
  }
  function ss(e, t, l) {
    for (var a = l.querySelectorAll('link[rel="stylesheet"][data-precedence],style[data-precedence]'), i = a.length ? a[a.length - 1] : null, s = i, c = 0; c < a.length; c++) {
      var o = a[c];
      if (o.dataset.precedence === t) s = o;
      else if (s !== i) break;
    }
    s ? s.parentNode.insertBefore(e, s.nextSibling) : (t = l.nodeType === 9 ? l.head : l, t.insertBefore(e, t.firstChild));
  }
  function _u(e, t) {
    e.crossOrigin ??= t.crossOrigin, e.referrerPolicy ??= t.referrerPolicy, e.title ??= t.title;
  }
  function wu(e, t) {
    e.crossOrigin ??= t.crossOrigin, e.referrerPolicy ??= t.referrerPolicy, e.integrity ??= t.integrity;
  }
  var cs = null;
  function Uf(e, t, l) {
    if (cs === null) {
      var a = /* @__PURE__ */ new Map(), i = cs = /* @__PURE__ */ new Map();
      i.set(l, a);
    } else i = cs, a = i.get(l), a || (a = /* @__PURE__ */ new Map(), i.set(l, a));
    if (a.has(e)) return a;
    for (a.set(e, null), l = l.getElementsByTagName(e), i = 0; i < l.length; i++) {
      var s = l[i];
      if (!(s[un] || s[ot] || e === "link" && s.getAttribute("rel") === "stylesheet") && s.namespaceURI !== "http://www.w3.org/2000/svg") {
        var c = s.getAttribute(t) || "";
        c = e + c;
        var o = a.get(c);
        o ? o.push(s) : a.set(c, [s]);
      }
    }
    return a;
  }
  function Rf(e, t, l) {
    e = e.ownerDocument || e, e.head.insertBefore(l, t === "title" ? e.querySelector("head > title") : null);
  }
  function rh(e, t, l) {
    if (l === 1 || t.itemProp != null) return !1;
    switch (e) {
      case "meta":
      case "title":
        return !0;
      case "style":
        if (typeof t.precedence != "string" || typeof t.href != "string" || t.href === "") break;
        return !0;
      case "link":
        if (typeof t.rel != "string" || typeof t.href != "string" || t.href === "" || t.onLoad || t.onError) break;
        return t.rel === "stylesheet" ? (e = t.disabled, typeof t.precedence == "string" && e == null) : !0;
      case "script":
        if (t.async && typeof t.async != "function" && typeof t.async != "symbol" && !t.onLoad && !t.onError && t.src && typeof t.src == "string") return !0;
    }
    return !1;
  }
  function qf(e) {
    return !(e.type === "stylesheet" && (e.state.loading & 3) === 0);
  }
  function fh(e, t, l, a) {
    if (l.type === "stylesheet" && (typeof a.media != "string" || matchMedia(a.media).matches !== !1) && (l.state.loading & 4) === 0) {
      if (l.instance === null) {
        var i = $a(a.href), s = t.querySelector(Qn(i));
        if (s) {
          t = s._p, t !== null && typeof t == "object" && typeof t.then == "function" && (e.count++, e = us.bind(e), t.then(e, e)), l.state.loading |= 4, l.instance = s, st(s);
          return;
        }
        s = t.ownerDocument || t, a = kf(a), (i = Yt.get(i)) && _u(a, i), s = s.createElement("link"), st(s);
        var c = s;
        c._p = new Promise(function(o, p) {
          c.onload = o, c.onerror = p;
        }), pt(s, "link", a), l.instance = s;
      }
      e.stylesheets === null && (e.stylesheets = /* @__PURE__ */ new Map()), e.stylesheets.set(l, t), (t = l.state.preload) && (l.state.loading & 3) === 0 && (e.count++, l = us.bind(e), t.addEventListener("load", l), t.addEventListener("error", l));
    }
  }
  var Eu = 0;
  function ph(e, t) {
    return e.stylesheets && e.count === 0 && ds(e, e.stylesheets), 0 < e.count || 0 < e.imgCount ? function(l) {
      var a = setTimeout(function() {
        if (e.stylesheets && ds(e, e.stylesheets), e.unsuspend) {
          var s = e.unsuspend;
          e.unsuspend = null, s();
        }
      }, 6e4 + t);
      0 < e.imgBytes && Eu === 0 && (Eu = 62500 * K0());
      var i = setTimeout(function() {
        if (e.waitingForImages = !1, e.count === 0 && (e.stylesheets && ds(e, e.stylesheets), e.unsuspend)) {
          var s = e.unsuspend;
          e.unsuspend = null, s();
        }
      }, (e.imgBytes > Eu ? 50 : 800) + t);
      return e.unsuspend = l, function() {
        e.unsuspend = null, clearTimeout(a), clearTimeout(i);
      };
    } : null;
  }
  function us() {
    if (this.count--, this.count === 0 && (this.imgCount === 0 || !this.waitingForImages)) {
      if (this.stylesheets) ds(this, this.stylesheets);
      else if (this.unsuspend) {
        var e = this.unsuspend;
        this.unsuspend = null, e();
      }
    }
  }
  var os = null;
  function ds(e, t) {
    e.stylesheets = null, e.unsuspend !== null && (e.count++, os = /* @__PURE__ */ new Map(), t.forEach(hh, e), os = null, us.call(e));
  }
  function hh(e, t) {
    if (!(t.state.loading & 4)) {
      var l = os.get(e);
      if (l) var a = l.get(null);
      else {
        l = /* @__PURE__ */ new Map(), os.set(e, l);
        for (var i = e.querySelectorAll("link[data-precedence],style[data-precedence]"), s = 0; s < i.length; s++) {
          var c = i[s];
          (c.nodeName === "LINK" || c.getAttribute("media") !== "not all") && (l.set(c.dataset.precedence, c), a = c);
        }
        a && l.set(null, a);
      }
      i = t.instance, c = i.getAttribute("data-precedence"), s = l.get(c) || a, s === a && l.set(null, i), l.set(c, i), this.count++, a = us.bind(this), i.addEventListener("load", a), i.addEventListener("error", a), s ? s.parentNode.insertBefore(i, s.nextSibling) : (e = e.nodeType === 9 ? e.head : e, e.insertBefore(i, e.firstChild)), t.state.loading |= 4;
    }
  }
  var Kn = {
    $$typeof: B,
    Provider: null,
    Consumer: null,
    _currentValue: ye,
    _currentValue2: ye,
    _threadCount: 0
  };
  function mh(e, t, l, a, i, s, c, o, p) {
    this.tag = 1, this.containerInfo = e, this.pingCache = this.current = this.pendingChildren = null, this.timeoutHandle = -1, this.callbackNode = this.next = this.pendingContext = this.context = this.cancelPendingCommit = null, this.callbackPriority = 0, this.expirationTimes = Ns(-1), this.entangledLanes = this.shellSuspendCounter = this.errorRecoveryDisabledLanes = this.expiredLanes = this.warmLanes = this.pingedLanes = this.suspendedLanes = this.pendingLanes = 0, this.entanglements = Ns(0), this.hiddenUpdates = Ns(null), this.identifierPrefix = a, this.onUncaughtError = i, this.onCaughtError = s, this.onRecoverableError = c, this.pooledCache = null, this.pooledCacheLanes = 0, this.formState = p, this.incompleteTransitions = /* @__PURE__ */ new Map();
  }
  function xh(e, t, l, a, i, s, c, o, p, z, C, R) {
    return e = new mh(e, t, l, c, p, z, C, R, o), t = 1, s === !0 && (t |= 24), s = wt(3, null, null, t), e.current = s, s.stateNode = e, t = cc(), t.refCount++, e.pooledCache = t, t.refCount++, s.memoizedState = {
      element: a,
      isDehydrated: l,
      cache: t
    }, rc(s), e;
  }
  function gh(e) {
    return e ? (e = Ta, e) : Ta;
  }
  function Hf(e, t, l, a, i, s) {
    i = gh(i), a.context === null ? a.context = i : a.pendingContext = i, a = ua(t), a.payload = { element: l }, s = s === void 0 ? null : s, s !== null && (a.callback = s), l = oa(e, a, t), l !== null && (St(l, e, t), _n(l, e, t));
  }
  function Bf(e, t) {
    if (e = e.memoizedState, e !== null && e.dehydrated !== null) {
      var l = e.retryLane;
      e.retryLane = l !== 0 && l < t ? l : t;
    }
  }
  function Tu(e, t) {
    Bf(e, t), (e = e.alternate) && Bf(e, t);
  }
  function Lf(e) {
    if (e.tag === 13 || e.tag === 31) {
      var t = Pl(e, 67108864);
      t !== null && St(t, e, 67108864), Tu(e, 67108864);
    }
  }
  function Gf(e) {
    if (e.tag === 13 || e.tag === 31) {
      var t = Lt();
      t = no(t);
      var l = Pl(e, t);
      l !== null && St(l, e, t), Tu(e, t);
    }
  }
  var rs = !0;
  function vh(e, t, l, a) {
    var i = O.T;
    O.T = null;
    var s = V.p;
    try {
      V.p = 2, Au(e, t, l, a);
    } finally {
      V.p = s, O.T = i;
    }
  }
  function bh(e, t, l, a) {
    var i = O.T;
    O.T = null;
    var s = V.p;
    try {
      V.p = 8, Au(e, t, l, a);
    } finally {
      V.p = s, O.T = i;
    }
  }
  function Au(e, t, l, a) {
    if (rs) {
      var i = Cu(a);
      if (i === null) mu(e, t, a, fs, l), Vf(e, a);
      else if (jh(i, e, t, l, a)) a.stopPropagation();
      else if (Vf(e, a), t & 4 && -1 < yh.indexOf(e)) {
        for (; i !== null; ) {
          var s = ga(i);
          if (s !== null) switch (s.tag) {
            case 3:
              if (s = s.stateNode, s.current.memoizedState.isDehydrated) {
                var c = Jl(s.pendingLanes);
                if (c !== 0) {
                  var o = s;
                  for (o.pendingLanes |= 2, o.entangledLanes |= 2; c; ) {
                    var p = 1 << 31 - Nt(c);
                    o.entanglements[1] |= p, c &= ~p;
                  }
                  vl(s), (Oe & 6) === 0 && (Ji = De() + 500, Gn(0, !1));
                }
              }
              break;
            case 31:
            case 13:
              o = Pl(s, 2), o !== null && St(o, s, 2), $i(), Tu(s, 2);
          }
          if (s = Cu(a), s === null && mu(e, t, a, fs, l), s === i) break;
          i = s;
        }
        i !== null && a.stopPropagation();
      } else mu(e, t, a, null, l);
    }
  }
  function Cu(e) {
    return e = ks(e), Mu(e);
  }
  var fs = null;
  function Mu(e) {
    if (fs = null, e = xa(e), e !== null) {
      var t = Y(e);
      if (t === null) e = null;
      else {
        var l = t.tag;
        if (l === 13) {
          if (e = k(t), e !== null) return e;
          e = null;
        } else if (l === 31) {
          if (e = q(t), e !== null) return e;
          e = null;
        } else if (l === 3) {
          if (t.stateNode.current.memoizedState.isDehydrated) return t.tag === 3 ? t.stateNode.containerInfo : null;
          e = null;
        } else t !== e && (e = null);
      }
    }
    return fs = e, null;
  }
  function Yf(e) {
    switch (e) {
      case "beforetoggle":
      case "cancel":
      case "click":
      case "close":
      case "contextmenu":
      case "copy":
      case "cut":
      case "auxclick":
      case "dblclick":
      case "dragend":
      case "dragstart":
      case "drop":
      case "focusin":
      case "focusout":
      case "input":
      case "invalid":
      case "keydown":
      case "keypress":
      case "keyup":
      case "mousedown":
      case "mouseup":
      case "paste":
      case "pause":
      case "play":
      case "pointercancel":
      case "pointerdown":
      case "pointerup":
      case "ratechange":
      case "reset":
      case "resize":
      case "seeked":
      case "submit":
      case "toggle":
      case "touchcancel":
      case "touchend":
      case "touchstart":
      case "volumechange":
      case "change":
      case "selectionchange":
      case "textInput":
      case "compositionstart":
      case "compositionend":
      case "compositionupdate":
      case "beforeblur":
      case "afterblur":
      case "beforeinput":
      case "blur":
      case "fullscreenchange":
      case "focus":
      case "hashchange":
      case "popstate":
      case "select":
      case "selectstart":
        return 2;
      case "drag":
      case "dragenter":
      case "dragexit":
      case "dragleave":
      case "dragover":
      case "mousemove":
      case "mouseout":
      case "mouseover":
      case "pointermove":
      case "pointerout":
      case "pointerover":
      case "scroll":
      case "touchmove":
      case "wheel":
      case "mouseenter":
      case "mouseleave":
      case "pointerenter":
      case "pointerleave":
        return 8;
      case "message":
        switch (el()) {
          case Sl:
            return 2;
          case f:
            return 8;
          case se:
          case oe:
            return 32;
          case ut:
            return 268435456;
          default:
            return 32;
        }
      default:
        return 32;
    }
  }
  var Ou = !1, Yl = null, Vl = null, Xl = null, Jn = /* @__PURE__ */ new Map(), In = /* @__PURE__ */ new Map(), Ql = [], yh = "mousedown mouseup touchcancel touchend touchstart auxclick dblclick pointercancel pointerdown pointerup dragend dragstart drop compositionend compositionstart keydown keypress keyup input textInput copy cut paste click change contextmenu reset".split(" ");
  function Vf(e, t) {
    switch (e) {
      case "focusin":
      case "focusout":
        Yl = null;
        break;
      case "dragenter":
      case "dragleave":
        Vl = null;
        break;
      case "mouseover":
      case "mouseout":
        Xl = null;
        break;
      case "pointerover":
      case "pointerout":
        Jn.delete(t.pointerId);
        break;
      case "gotpointercapture":
      case "lostpointercapture":
        In.delete(t.pointerId);
    }
  }
  function $n(e, t, l, a, i, s) {
    return e === null || e.nativeEvent !== s ? (e = {
      blockedOn: t,
      domEventName: l,
      eventSystemFlags: a,
      nativeEvent: s,
      targetContainers: [i]
    }, t !== null && (t = ga(t), t !== null && Lf(t)), e) : (e.eventSystemFlags |= a, t = e.targetContainers, i !== null && t.indexOf(i) === -1 && t.push(i), e);
  }
  function jh(e, t, l, a, i) {
    switch (t) {
      case "focusin":
        return Yl = $n(Yl, e, t, l, a, i), !0;
      case "dragenter":
        return Vl = $n(Vl, e, t, l, a, i), !0;
      case "mouseover":
        return Xl = $n(Xl, e, t, l, a, i), !0;
      case "pointerover":
        var s = i.pointerId;
        return Jn.set(s, $n(Jn.get(s) || null, e, t, l, a, i)), !0;
      case "gotpointercapture":
        return s = i.pointerId, In.set(s, $n(In.get(s) || null, e, t, l, a, i)), !0;
    }
    return !1;
  }
  function Xf(e) {
    var t = xa(e.target);
    if (t !== null) {
      var l = Y(t);
      if (l !== null) {
        if (t = l.tag, t === 13) {
          if (t = k(l), t !== null) {
            e.blockedOn = t, so(e.priority, function() {
              Gf(l);
            });
            return;
          }
        } else if (t === 31) {
          if (t = q(l), t !== null) {
            e.blockedOn = t, so(e.priority, function() {
              Gf(l);
            });
            return;
          }
        } else if (t === 3 && l.stateNode.current.memoizedState.isDehydrated) {
          e.blockedOn = l.tag === 3 ? l.stateNode.containerInfo : null;
          return;
        }
      }
    }
    e.blockedOn = null;
  }
  function ps(e) {
    if (e.blockedOn !== null) return !1;
    for (var t = e.targetContainers; 0 < t.length; ) {
      var l = Cu(e.nativeEvent);
      if (l === null) {
        l = e.nativeEvent;
        var a = new l.constructor(l.type, l);
        Os = a, l.target.dispatchEvent(a), Os = null;
      } else return t = ga(l), t !== null && Lf(t), e.blockedOn = l, !1;
      t.shift();
    }
    return !0;
  }
  function Qf(e, t, l) {
    ps(e) && l.delete(t);
  }
  function Sh() {
    Ou = !1, Yl !== null && ps(Yl) && (Yl = null), Vl !== null && ps(Vl) && (Vl = null), Xl !== null && ps(Xl) && (Xl = null), Jn.forEach(Qf), In.forEach(Qf);
  }
  function hs(e, t) {
    e.blockedOn === t && (e.blockedOn = null, Ou || (Ou = !0, v.unstable_scheduleCallback(v.unstable_NormalPriority, Sh)));
  }
  var ms = null;
  function Zf(e) {
    ms !== e && (ms = e, v.unstable_scheduleCallback(v.unstable_NormalPriority, function() {
      ms === e && (ms = null);
      for (var t = 0; t < e.length; t += 3) {
        var l = e[t], a = e[t + 1], i = e[t + 2];
        if (typeof a != "function") {
          if (Mu(a || l) === null) continue;
          break;
        }
        var s = ga(l);
        s !== null && (e.splice(t, 3), t -= 3, Mc(s, {
          pending: !0,
          data: i,
          method: l.method,
          action: a
        }, a, i));
      }
    }));
  }
  function Fa(e) {
    function t(p) {
      return hs(p, e);
    }
    Yl !== null && hs(Yl, e), Vl !== null && hs(Vl, e), Xl !== null && hs(Xl, e), Jn.forEach(t), In.forEach(t);
    for (var l = 0; l < Ql.length; l++) {
      var a = Ql[l];
      a.blockedOn === e && (a.blockedOn = null);
    }
    for (; 0 < Ql.length && (l = Ql[0], l.blockedOn === null); ) Xf(l), l.blockedOn === null && Ql.shift();
    if (l = (e.ownerDocument || e).$$reactFormReplay, l != null) for (a = 0; a < l.length; a += 3) {
      var i = l[a], s = l[a + 1], c = i[xt] || null;
      if (typeof s == "function") c || Zf(l);
      else if (c) {
        var o = null;
        if (s && s.hasAttribute("formAction")) {
          if (i = s, c = s[xt] || null) o = c.formAction;
          else if (Mu(i) !== null) continue;
        } else o = c.action;
        typeof o == "function" ? l[a + 1] = o : (l.splice(a, 3), a -= 3), Zf(l);
      }
    }
  }
  function zh() {
    function e(s) {
      s.canIntercept && s.info === "react-transition" && s.intercept({
        handler: function() {
          return new Promise(function(c) {
            return i = c;
          });
        },
        focusReset: "manual",
        scroll: "manual"
      });
    }
    function t() {
      i !== null && (i(), i = null), a || setTimeout(l, 20);
    }
    function l() {
      if (!a && !navigation.transition) {
        var s = navigation.currentEntry;
        s && s.url != null && navigation.navigate(s.url, {
          state: s.getState(),
          info: "react-transition",
          history: "replace"
        });
      }
    }
    if (typeof navigation == "object") {
      var a = !1, i = null;
      return navigation.addEventListener("navigate", e), navigation.addEventListener("navigatesuccess", t), navigation.addEventListener("navigateerror", t), setTimeout(l, 100), function() {
        a = !0, navigation.removeEventListener("navigate", e), navigation.removeEventListener("navigatesuccess", t), navigation.removeEventListener("navigateerror", t), i !== null && (i(), i = null);
      };
    }
  }
  function ku(e) {
    this._internalRoot = e;
  }
  Du.prototype.render = ku.prototype.render = function(e) {
    var t = this._internalRoot;
    if (t === null) throw Error(d(409));
    var l = t.current;
    Hf(l, Lt(), e, t, null, null);
  }, Du.prototype.unmount = ku.prototype.unmount = function() {
    var e = this._internalRoot;
    if (e !== null) {
      this._internalRoot = null;
      var t = e.containerInfo;
      Hf(e.current, 2, null, e, null, null), $i(), t[cn] = null;
    }
  };
  function Du(e) {
    this._internalRoot = e;
  }
  Du.prototype.unstable_scheduleHydration = function(e) {
    if (e) {
      var t = io();
      e = {
        blockedOn: null,
        target: e,
        priority: t
      };
      for (var l = 0; l < Ql.length && t !== 0 && t < Ql[l].priority; l++) ;
      Ql.splice(l, 0, e), l === 0 && Xf(e);
    }
  };
  var Kf = T.version;
  if (Kf !== "19.2.6") throw Error(d(527, Kf, "19.2.6"));
  V.findDOMNode = function(e) {
    var t = e._reactInternals;
    if (t === void 0)
      throw typeof e.render == "function" ? Error(d(188)) : (e = Object.keys(e).join(","), Error(d(268, e)));
    return e = E(t), e = e !== null ? Z(e) : null, e = e === null ? null : e.stateNode, e;
  };
  var Nh = {
    bundleType: 0,
    version: "19.2.6",
    rendererPackageName: "react-dom",
    currentDispatcherRef: O,
    reconcilerVersion: "19.2.6"
  };
  if (typeof __REACT_DEVTOOLS_GLOBAL_HOOK__ < "u") {
    var xs = __REACT_DEVTOOLS_GLOBAL_HOOK__;
    if (!xs.isDisabled && xs.supportsFiber) try {
      zl = xs.inject(Nh), Ke = xs;
    } catch {
    }
  }
  u.createRoot = function(e, t) {
    if (!j(e)) throw Error(d(299));
    var l = !1, a = "", i = b0, s = y0, c = j0;
    return t != null && (t.unstable_strictMode === !0 && (l = !0), t.identifierPrefix !== void 0 && (a = t.identifierPrefix), t.onUncaughtError !== void 0 && (i = t.onUncaughtError), t.onCaughtError !== void 0 && (s = t.onCaughtError), t.onRecoverableError !== void 0 && (c = t.onRecoverableError)), t = xh(e, 1, !1, null, null, l, a, null, i, s, c, zh), e[cn] = t.current, hf(e), new ku(t);
  };
})), Oh = /* @__PURE__ */ Pt(((u, v) => {
  function T() {
    if (!(typeof __REACT_DEVTOOLS_GLOBAL_HOOK__ > "u" || typeof __REACT_DEVTOOLS_GLOBAL_HOOK__.checkDCE != "function"))
      try {
        __REACT_DEVTOOLS_GLOBAL_HOOK__.checkDCE(T);
      } catch (r) {
        console.error(r);
      }
  }
  T(), v.exports = Mh();
})), up = (...u) => u.filter((v, T, r) => !!v && v.trim() !== "" && r.indexOf(v) === T).join(" ").trim(), kh = (u) => u.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase(), Dh = (u) => u.replace(/^([A-Z])|[\s-_]+(\w)/g, (v, T, r) => r ? r.toUpperCase() : T.toLowerCase()), Jf = (u) => {
  const v = Dh(u);
  return v.charAt(0).toUpperCase() + v.slice(1);
}, Uu = {
  xmlns: "http://www.w3.org/2000/svg",
  width: 24,
  height: 24,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round",
  strokeLinejoin: "round"
}, Uh = (u) => {
  for (const v in u) if (v.startsWith("aria-") || v === "role" || v === "title") return !0;
  return !1;
}, M = Wu(), Rh = (0, M.createContext)({}), qh = () => (0, M.useContext)(Rh), Hh = (0, M.forwardRef)(({ color: u, size: v, strokeWidth: T, absoluteStrokeWidth: r, className: d = "", children: j, iconNode: Y, ...k }, q) => {
  const { size: _ = 24, strokeWidth: E = 2, absoluteStrokeWidth: Z = !1, color: H = "currentColor", className: ae = "" } = qh() ?? {}, de = r ?? Z ? Number(T ?? E) * 24 / Number(v ?? _) : T ?? E;
  return (0, M.createElement)("svg", {
    ref: q,
    ...Uu,
    width: v ?? _ ?? Uu.width,
    height: v ?? _ ?? Uu.height,
    stroke: u ?? H,
    strokeWidth: de,
    className: up("lucide", ae, d),
    ...!j && !Uh(k) && { "aria-hidden": "true" },
    ...k
  }, [...Y.map(([L, I]) => (0, M.createElement)(L, I)), ...Array.isArray(j) ? j : [j]]);
}), Ye = (u, v) => {
  const T = (0, M.forwardRef)(({ className: r, ...d }, j) => (0, M.createElement)(Hh, {
    ref: j,
    iconNode: v,
    className: up(`lucide-${kh(Jf(u))}`, `lucide-${u}`, r),
    ...d
  }));
  return T.displayName = Jf(u), T;
}, Bh = [
  ["rect", {
    width: "20",
    height: "5",
    x: "2",
    y: "3",
    rx: "1",
    key: "1wp1u1"
  }],
  ["path", {
    d: "M4 8v11a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8",
    key: "1s80jp"
  }],
  ["path", {
    d: "M10 12h4",
    key: "a56b0p"
  }]
], Lh = Ye("archive", Bh), Gh = [["path", {
  d: "M5 12h14",
  key: "1ays0h"
}], ["path", {
  d: "m12 5 7 7-7 7",
  key: "xquz4c"
}]], en = Ye("arrow-right", Gh), Yh = [["path", {
  d: "M7 7h10v10",
  key: "1tivn9"
}], ["path", {
  d: "M7 17 17 7",
  key: "1vkiza"
}]], Vh = Ye("arrow-up-right", Yh), Xh = [
  ["path", {
    d: "M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z",
    key: "hh9hay"
  }],
  ["path", {
    d: "m3.3 7 8.7 5 8.7-5",
    key: "g66t2b"
  }],
  ["path", {
    d: "M12 22V12",
    key: "d0xqtd"
  }]
], Ku = Ye("box", Xh), Qh = [["path", {
  d: "M20 6 9 17l-5-5",
  key: "1gmf2c"
}]], gs = Ye("check", Qh), Zh = [["path", {
  d: "m9 18 6-6-6-6",
  key: "mthhwq"
}]], If = Ye("chevron-right", Zh), Kh = [
  ["circle", {
    cx: "12",
    cy: "12",
    r: "10",
    key: "1mglay"
  }],
  ["line", {
    x1: "12",
    x2: "12",
    y1: "8",
    y2: "12",
    key: "1pkeuh"
  }],
  ["line", {
    x1: "12",
    x2: "12.01",
    y1: "16",
    y2: "16",
    key: "4dfq90"
  }]
], tn = Ye("circle-alert", Kh), Jh = [
  ["path", {
    d: "m12.296 3.464 3.02 3.956",
    key: "qash78"
  }],
  ["path", {
    d: "M20.2 6 3 11l-.9-2.4c-.3-1.1.3-2.2 1.3-2.5l13.5-4c1.1-.3 2.2.3 2.5 1.3z",
    key: "1h7j8b"
  }],
  ["path", {
    d: "M3 11h18v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z",
    key: "4lm6w1"
  }],
  ["path", {
    d: "m6.18 5.276 3.1 3.899",
    key: "zjj9t3"
  }]
], vs = Ye("clapperboard", Jh), Ih = [["circle", {
  cx: "12",
  cy: "12",
  r: "10",
  key: "1mglay"
}], ["path", {
  d: "M12 6v6h4",
  key: "135r8i"
}]], op = Ye("clock-3", Ih), $h = [["rect", {
  width: "14",
  height: "14",
  x: "8",
  y: "8",
  rx: "2",
  ry: "2",
  key: "17jyea"
}], ["path", {
  d: "M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2",
  key: "zix9uf"
}]], dp = Ye("copy", $h), Wh = [
  ["path", {
    d: "M12 15V3",
    key: "m9g1x1"
  }],
  ["path", {
    d: "M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4",
    key: "ih7n3h"
  }],
  ["path", {
    d: "m7 10 5 5 5-5",
    key: "brsn70"
  }]
], rp = Ye("download", Wh), Fh = [
  ["path", {
    d: "M10.5 22H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h8a2.4 2.4 0 0 1 1.706.706l3.588 3.588A2.4 2.4 0 0 1 20 8v6",
    key: "g5mvt7"
  }],
  ["path", {
    d: "M14 2v5a1 1 0 0 0 1 1h5",
    key: "wfsgrz"
  }],
  ["path", {
    d: "m14 20 2 2 4-4",
    key: "15kota"
  }]
], ha = Ye("file-check-corner", Fh), Ph = [
  ["rect", {
    width: "18",
    height: "18",
    x: "3",
    y: "3",
    rx: "2",
    key: "afitv7"
  }],
  ["path", {
    d: "M7 3v18",
    key: "bbkbws"
  }],
  ["path", {
    d: "M3 7.5h4",
    key: "zfgn84"
  }],
  ["path", {
    d: "M3 12h18",
    key: "1i2n21"
  }],
  ["path", {
    d: "M3 16.5h4",
    key: "1230mu"
  }],
  ["path", {
    d: "M17 3v18",
    key: "in4fa5"
  }],
  ["path", {
    d: "M17 7.5h4",
    key: "myr1c1"
  }],
  ["path", {
    d: "M17 16.5h4",
    key: "go4c1d"
  }]
], Ru = Ye("film", Ph), em = [
  ["path", {
    d: "M15 6a9 9 0 0 0-9 9V3",
    key: "1cii5b"
  }],
  ["circle", {
    cx: "18",
    cy: "6",
    r: "3",
    key: "1h7g24"
  }],
  ["circle", {
    cx: "6",
    cy: "18",
    r: "3",
    key: "fqmcym"
  }]
], Wn = Ye("git-branch", em), tm = [
  ["rect", {
    width: "7",
    height: "7",
    x: "3",
    y: "3",
    rx: "1",
    key: "1g98yp"
  }],
  ["rect", {
    width: "7",
    height: "7",
    x: "14",
    y: "3",
    rx: "1",
    key: "6d4xhi"
  }],
  ["rect", {
    width: "7",
    height: "7",
    x: "14",
    y: "14",
    rx: "1",
    key: "nxv5o0"
  }],
  ["rect", {
    width: "7",
    height: "7",
    x: "3",
    y: "14",
    rx: "1",
    key: "1bb6yr"
  }]
], $f = Ye("layout-grid", tm), lm = [
  ["path", {
    d: "M9 17H7A5 5 0 0 1 7 7h2",
    key: "8i5ue5"
  }],
  ["path", {
    d: "M15 7h2a5 5 0 1 1 0 10h-2",
    key: "1b9ql8"
  }],
  ["line", {
    x1: "8",
    x2: "16",
    y1: "12",
    y2: "12",
    key: "1jonct"
  }]
], Fu = Ye("link-2", lm), am = [
  ["path", {
    d: "M13 5h8",
    key: "a7qcls"
  }],
  ["path", {
    d: "M13 12h8",
    key: "h98zly"
  }],
  ["path", {
    d: "M13 19h8",
    key: "c3s6r1"
  }],
  ["path", {
    d: "m3 17 2 2 4-4",
    key: "1jhpwq"
  }],
  ["path", {
    d: "m3 7 2 2 4-4",
    key: "1obspn"
  }]
], nm = Ye("list-checks", am), im = [["path", {
  d: "M21 12a9 9 0 1 1-6.219-8.56",
  key: "13zald"
}]], qu = Ye("loader-circle", im), sm = [
  ["circle", {
    cx: "12",
    cy: "16",
    r: "1",
    key: "1au0dj"
  }],
  ["rect", {
    x: "3",
    y: "10",
    width: "18",
    height: "12",
    rx: "2",
    key: "6s8ecr"
  }],
  ["path", {
    d: "M7 10V7a5 5 0 0 1 10 0v3",
    key: "1pqi11"
  }]
], Ju = Ye("lock-keyhole", sm), cm = [["path", {
  d: "M22 17a2 2 0 0 1-2 2H6.828a2 2 0 0 0-1.414.586l-2.202 2.202A.71.71 0 0 1 2 21.286V5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2z",
  key: "18887p"
}]], Hu = Ye("message-square", cm), um = [["path", {
  d: "M5 12h14",
  key: "1ays0h"
}], ["path", {
  d: "M12 5v14",
  key: "s699le"
}]], ln = Ye("plus", um), om = [
  ["path", {
    d: "M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8",
    key: "v9h5vc"
  }],
  ["path", {
    d: "M21 3v5h-5",
    key: "1q7to0"
  }],
  ["path", {
    d: "M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16",
    key: "3uifl3"
  }],
  ["path", {
    d: "M8 16H3v5",
    key: "1cv678"
  }]
], fp = Ye("refresh-cw", om), dm = [["path", {
  d: "M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8",
  key: "1357e3"
}], ["path", {
  d: "M3 3v5h5",
  key: "1xhq8a"
}]], rm = Ye("rotate-ccw", dm), fm = [["path", {
  d: "m21 21-4.34-4.34",
  key: "14j7rj"
}], ["circle", {
  cx: "11",
  cy: "11",
  r: "8",
  key: "4ej97u"
}]], pm = Ye("search", fm), hm = [["path", {
  d: "M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z",
  key: "oel41y"
}], ["path", {
  d: "m9 12 2 2 4-4",
  key: "dzmm74"
}]], an = Ye("shield-check", hm), mm = [["path", {
  d: "M18 6 6 18",
  key: "1bl5f8"
}], ["path", {
  d: "m6 6 12 12",
  key: "d8bk6v"
}]], Wf = Ye("x", mm), xm = Oh(), yl = [
  {
    id: "M01",
    title: "原檔盤點與備份",
    output: "正式模型位置、原始版本、備份、檔案雜湊與盤點紀錄",
    checks: [
      "已實際讀取指定模型，核對節點、尺寸、座標軸與單位",
      "正式來源、備份及版本可追查，原檔保留",
      "舊模型名稱與現行清單已分清，未混用場景"
    ]
  },
  {
    id: "M02",
    title: "設定與空間依據",
    output: "平面、尺度、物件 ID、不可改動項目及來源版本",
    checks: [
      "建築外殼、劇情內部、生活層與鏡位需求已分列",
      "米制尺寸、家具編號、門窗樓梯與通道有依據",
      "現實／遊戲場景分清，未定設定明確保留"
    ]
  },
  {
    id: "M03",
    title: "補件與差異規劃",
    output: "保留、改善、新增、未定的逐物件清單",
    checks: [
      "逐項比對既有模型，規格不等於全部新增",
      "每項補件有節點或區域、來源與差異說明",
      "重大建築變更與世界觀衝突已另列待裁定"
    ]
  },
  {
    id: "M04",
    title: "建模與候選輸出",
    output: "獨立候選 GLB、加工紀錄與使用工具版本",
    checks: [
      "候選另存新檔，未覆寫正式來源及備份",
      "新增或修改物件保留穩定 ID 與差異紀錄",
      "未完成項目、加工工具及可接續位置已記錄"
    ]
  },
  {
    id: "M05",
    title: "技術檢查",
    output: "載入、幾何、動線、材質與效能檢查報告",
    checks: [
      "候選 GLB 已實際載入，材質與外部資源可用",
      "節點、尺寸、門窗樓梯、通行路徑與明顯穿模已檢查",
      "面數、材質數、檔案大小及目標裝置效能已記錄"
    ]
  },
  {
    id: "M06",
    title: "鏡位與視覺檢查",
    output: "指定鏡位截圖、位置、lookAt、FOV 與視覺問題",
    checks: [
      "已實際檢視指定鏡位，保存畫面與版本",
      "攝影機位置、lookAt、FOV、遮擋與時段可重現",
      "未以剪接或鏡位掩蓋幾何衝突，場景一致性已核對"
    ]
  },
  {
    id: "M07",
    title: "修正與複核",
    output: "問題修正對照、複核結果及剩餘限制",
    checks: [
      "技術問題與 AI 視覺問題分開記錄並複核",
      "修正後重新載入並檢查受影響的前後鏡位",
      "剩餘限制、未定項與採用範圍清楚"
    ]
  },
  {
    id: "M08",
    title: "交接與採用紀錄",
    output: "候選版本、差異、檢查報告、下一步及作者採用紀錄",
    checks: [
      "原檔、備份、候選與報告位置均可追查",
      "下一位 AI 能知道已做內容、待做內容與接手位置",
      "作者已確認採用的候選版本及適用範圍"
    ]
  }
], gm = class extends Error {
  constructor(u, v = 400) {
    super(u), this.status = v;
  }
}, Ff = (u, v = 400) => {
  throw new gm(u, v);
};
function Ss(u) {
  return u.modelFlow ?? {
    models: [],
    issues: [],
    packs: [],
    pins: [],
    history: []
  };
}
function vm(u, v, T) {
  const r = Ss(u).models.find((j) => j.id === v || j.key === v);
  r || Ff("找不到模型");
  const d = r.versions.find((j) => j.id === T);
  return d || Ff("找不到指定模型版本"), {
    m: r,
    v: d
  };
}
function bm(u, v, T, r) {
  const { v: d } = vm(u, v, T), j = d.stages[r], Y = yl.findIndex((q) => q.id === r), k = [];
  return Y > 0 && !d.stages[yl[Y - 1].id].author && k.push("先核定 " + yl[Y - 1].title), j.checks.every(Boolean) || k.push("完成本階段全部檢查"), j.evidence || k.push("填入實際產出或檢查報告位置"), (!j.summary || !j.nextStep) && k.push("填寫已做內容與接手下一步"), r === "M01" && (!d.sourceLocation || !d.sourceVersion || !d.backupLocation || !d.sha256) && k.push("補齊原檔版本、獨立備份與 SHA-256"), r === "M02" && !d.reference && k.push("補入設定及尺度來源"), Y >= 3 && !d.candidateLocation && k.push("登記獨立候選 GLB"), Ss(u).issues.some((q) => q.modelId === v && q.versionId === T && q.status === "open" && (q.stageId === r || Y >= 6 || q.kind === "major" && Y >= 3)) && k.push("處理適用的待修或待裁定問題"), k;
}
var ym = [
  {
    id: "01",
    title: "原作整理",
    phase: "前期準備",
    description: "整理事件因果、人物動機及世界規則，分開記錄原文明示、動畫新增及待裁定內容。",
    output: "原作摘要、人物與設定清單、來源章節",
    checks: [
      "已標明來源章節，區分小說卷次與動畫集數",
      "已整理事件因果、人物動機與世界規則",
      "原作內容、動畫新增與待裁定事項分開記錄"
    ],
    deps: []
  },
  {
    id: "02",
    title: "單集改編",
    phase: "前期準備",
    description: "確認本集主線、開場吸引點、情緒轉折及片尾停點。",
    output: "單集大綱與增刪說明",
    checks: [
      "本集範圍、開頭與結尾明確",
      "增刪戲份能補足因果或角色動機",
      "未讀小說的觀眾仍能理解事件與選擇"
    ],
    deps: ["01"]
  },
  {
    id: "03",
    title: "分場劇本",
    phase: "前期準備",
    description: "依場所、時間與事件拆成場次，寫出可見動作、對白、旁白、畫面文字及轉場。",
    output: "完整劇本、分角色台詞與暫定時間",
    checks: [
      "場次、動作、對白、旁白、畫面文字與轉場完整",
      "重要資訊在畫面或聲音中清楚呈現",
      "劇本版本明確，時間標為估算並待試錄確認"
    ],
    deps: ["02"]
  },
  {
    id: "04",
    title: "角色定稿",
    phase: "前期準備",
    description: "固定正側面、體型、髮色、服裝與道具，分開標記現實、遊戲、回憶與換裝。",
    output: "角色參考圖與狀態說明",
    checks: [
      "正側面、體型、髮色、服裝與道具已核對",
      "現實、遊戲、回憶與換裝狀態分開標記",
      "相鄰鏡頭維持辨識與體型，鏡像也一致"
    ],
    deps: ["03"]
  },
  {
    id: "05",
    title: "場景定稿",
    phase: "前期準備",
    description: "依固定方向的平面圖定位家具、門窗、樓梯及通道，再建立各機位母圖。",
    output: "平面圖、家具編號位置表、機位母圖",
    checks: [
      "平面方向、物件固定編號、位置與朝向明確",
      "通道與動線合理，換機位仍位於同一空間",
      "平面左右與畫面左右分開描述",
      "正式場景移除圓圈編號，已對照平面與母圖"
    ],
    deps: ["03"]
  },
  {
    id: "06",
    title: "分鏡拆解",
    phase: "前期準備",
    description: "逐鏡列出景別、機位、動作、聲音、長度及起始與結束狀態。",
    output: "鏡頭表、影格清單、生圖需求",
    checks: [
      "每鏡有固定 ID、景別、機位及起訖狀態",
      "聲音與動作能跨鏡連續，切鏡有敘事需要",
      "本集使用的各套鏡號與素材編號已建立明確對照"
    ],
    deps: ["04", "05"]
  },
  {
    id: "07",
    title: "配音試排",
    phase: "素材製作",
    description: "為台詞建立固定 ID，先試錄關鍵對話、系統說明與片尾，再依完整句群安排語氣及停頓。",
    output: "配音稿、試錄音檔、實錄時長",
    checks: [
      "台詞 ID、角色聲線與試錄音檔可對應",
      "完整句群保留語氣與停頓，不靠加速朗讀遷就鏡頭",
      "依實錄時長調整資訊量或畫面長度"
    ],
    deps: ["06"]
  },
  {
    id: "08",
    title: "關鍵影格生成",
    phase: "素材製作",
    description: "沿用相同版本角色及場景參考，交代構圖、位置、動作狀態及不可改動項目。",
    output: "起始影格、必要結束影格、候選版本",
    checks: [
      "每次任務保留參考版本、提示詞與候選輸出",
      "人物、家具、光線、手勢、道具已檢查",
      "前後圖能銜接，不合格先修圖"
    ],
    deps: ["06", "07"]
  },
  {
    id: "09",
    title: "動畫生成",
    phase: "素材製作",
    description: "依通過影格編寫影片提示詞，交代主要動作、先後、鏡頭運動與結束姿勢。",
    output: "動畫片段、使用設定、來源紀錄",
    checks: [
      "使用已通過的影格並記錄影片設定及來源",
      "已連續播放檢查手部、接觸、步伐及物件變形",
      "背景無不合理漂移，起訖動作可銜接"
    ],
    deps: ["08"]
  },
  {
    id: "10",
    title: "配音與剪輯",
    phase: "剪輯後製",
    description: "挑選正式乾聲版本，依完整句意排列鏡頭，保留聆聽反應與必要停頓。",
    output: "有正式配音的主線粗剪",
    checks: [
      "正式乾聲、採用版本與台詞 ID 可對應",
      "字頭字尾完整，不反覆循環嘴形",
      "已清除被替換的舊人聲，無雙重聲線"
    ],
    deps: ["09", "07"]
  },
  {
    id: "11",
    title: "聲音與字幕",
    phase: "剪輯後製",
    description: "依序鋪環境底聲、動作音、系統音、配樂、字幕與介面字，保留分軌。",
    output: "聲畫完整試映版、可修改剪輯專案",
    checks: [
      "對白清楚且未被音樂蓋過，環境底聲連續",
      "動作與系統音對準事件，按鍵聲不重複",
      "對白、音效、音樂分軌，原始乾聲保留",
      "字幕、姓名、介面與片尾文字逐項校對"
    ],
    deps: ["10"]
  },
  {
    id: "12",
    title: "全片驗收",
    phase: "正式交付",
    description: "連續觀看故事，逐段檢查聲畫及連續性，依鏡頭 ID 記錄問題並複核修正。",
    output: "正式成片、驗收表、剪輯專案及交付備份",
    checks: [
      "未讀原作也能理解，事件因果、人物動機、道具來源與世界規則一致",
      "角色、家具、手部、道具與現實／遊戲狀態連續",
      "台詞清楚完整，無疊音、突兀斷音或音樂遮蔽",
      "字幕、姓名、介面、片尾及最新揭露範圍正確",
      "正式輸出已完整播放，比例與音量正確",
      "剪輯專案、採用素材、問題與驗收紀錄已備份"
    ],
    deps: [
      "11",
      "op08",
      "ed08"
    ]
  }
], jm = [
  "唯一音軌",
  "音樂分析",
  "段落與節點",
  "鏡頭安排",
  "影格與動畫",
  "對音樂試剪",
  "支線驗收",
  "插入全片"
], Sm = [
  ["已指定唯一使用音軌與版本；換音軌需重核切點"],
  ["已實際分析音樂、歌詞與節奏"],
  ["段落與重要音樂節點已標記"],
  ["鏡頭與音樂、主題、劇透範圍相符"],
  ["人物與主線一致，影格及動畫已驗收"],
  ["已按指定音軌核對切點與實際長度"],
  ["無不必要重複鏡頭，劇透範圍及情緒合適"],
  ["通過支線已插入剪輯專案，入點與出點可查"]
], Vt = [...ym.map((u) => ({
  ...u,
  group: "main"
})), ...["op", "ed"].flatMap((u) => jm.map((v, T) => ({
  id: u + String(T + 1).padStart(2, "0"),
  title: v,
  group: u,
  phase: u.toUpperCase() + " 支線",
  description: u === "op" ? "OP 以作品印象、人物關係及主題為主。" : "ED 以情緒收束及畫面變化為主。",
  output: v === "唯一音軌" ? "由作者在有效資料中指定音軌、版本與長度" : v,
  checks: Sm[T],
  deps: T ? [u + String(T).padStart(2, "0")] : ["03"]
})))], zm = [
  "script",
  "character",
  "scene",
  "voice",
  "op_audio",
  "ed_audio",
  "edit"
];
function nn(u) {
  return [...new Map(u.map((v) => [v.key, v])).values()];
}
function Kl(u) {
  return nn(u.filter((v) => v.status === "adopted" || v.status === "withdrawn")).filter((v) => v.status === "adopted");
}
function Nm(u) {
  return {
    projectId: u.id,
    workId: u.workId,
    episode: u.episode,
    revision: u.revision,
    workflowSchema: u.workflowSchema ?? 1,
    genericChecks: zs(u).map(({ id: v, title: T, checks: r }) => ({
      id: v,
      title: T,
      checks: r
    })),
    rules: nn(u.episodeRules ?? []),
    adoptedRules: Kl(u.episodeRules ?? []),
    baselines: nn(u.baselines ?? []),
    adoptedBaselines: Kl(u.baselines ?? []),
    legacy: u.workflowLegacy ?? null,
    rule: "通用流程不含單集劇情條件。本集規則與採用清單各自保存版本，候選不取代已採用版，另一集須另行指定；檔案位置未驗看。"
  };
}
function _m(u) {
  return {
    id: u.id,
    title: u.title,
    revision: u.revision,
    updatedAt: u.updatedAt,
    sharedCount: new Set(u.sharedAssets.map((v) => v.key)).size
  };
}
var pp = class extends Error {
  constructor(u, v = 400) {
    super(u), this.status = v;
  }
};
function zs(u) {
  return Vt.filter((v) => v.group === "main" || u.branches[v.group]);
}
function ys(u, v) {
  const T = Vt.find((r) => r.id === v);
  if (!T) throw new pp("找不到階段");
  return T.deps.filter((r) => zs(u).some((d) => d.id === r) && !u.stages[r].author).map((r) => `${r} ${Vt.find((d) => d.id === r)?.title}`);
}
function hp(u, v) {
  const T = u.stages[v], r = ys(u, v).map((j) => "先完成 " + j), d = Vt.find((j) => j.id === v).checks.length;
  return (T.checks.length < d || !T.checks.slice(0, d).every(Boolean)) && r.push("勾選全部驗收項目"), T.evidence.trim() || r.push("填入產出連結或檔案位置"), u.issues.some((j) => j.status === "open" && j.stageId === v) && r.push("處理此階段未結問題"), ma(u).problems.some((j) => j.status === "open" && (j.scope.type === "project" || j.scope.type === "stage" && j.scope.target === v || v === "12")) && r.push("處理適用範圍內的資訊矛盾或缺件"), v === "12" && (u.issues.some((j) => j.status === "open") && r.push("結清全部退修問題"), u.shots.some((j) => j.status !== "in_timeline") && r.push("總表中所有鏡頭須通過並入片"), u.shots.length || r.push("建立實際採用鏡頭與入片紀錄")), r;
}
function Iu(u) {
  const v = zs(u);
  return {
    id: u.id,
    workId: u.workId ?? "",
    title: u.title,
    episode: u.episode,
    revision: u.revision,
    archived: u.archived,
    updatedAt: u.updatedAt,
    completionReport: u.production?.completionReports?.at(-1) ?? null,
    approved: v.filter((T) => u.stages[T.id].author).length,
    total: v.length,
    openIssues: u.issues.filter((T) => T.status === "open").length,
    shots: u.shots.length,
    inTimeline: u.shots.filter((T) => T.status === "in_timeline").length,
    lastMcpAt: u.lastMcpAt,
    next: v.filter((T) => !u.stages[T.id].author && !ys(u, T.id).length).map((T) => ({
      id: T.id,
      title: T.title,
      reasons: hp(u, T.id)
    }))
  };
}
function Pu(u) {
  const v = ma(u), T = [...new Map((u.production?.links ?? []).map((d) => [d.shotId, d])).values()], r = [...new Map((u.production?.selections ?? []).map((d) => [d.shotId, d])).values()];
  return {
    project: Iu(u),
    settings: {
      rules: Kl(u.episodeRules ?? []).length,
      adopted: Kl(u.baselines ?? []).map(({ key: d, title: j, category: Y, version: k, recordVersion: q, externalVersion: _ }) => ({
        key: d,
        title: j,
        category: Y,
        version: k,
        recordVersion: q,
        externalVersion: _
      })),
      pending: nn(u.baselines ?? []).filter((d) => d.status === "unresolved" || d.status === "reference").map(({ key: d, title: j, status: Y, note: k }) => ({
        key: d,
        title: j,
        status: Y,
        note: k
      }))
    },
    registration: {
      sources: v.records.length,
      acceptedSources: v.records.filter(ei).length,
      shots: u.shots.length,
      linkedShots: T.length,
      locatedFrames: T.filter((d) => d.references.length).length,
      registeredSelections: (/* @__PURE__ */ new Set([...r.map((d) => d.shotId), ...T.filter((d) => d.adoptedOutput).map((d) => d.shotId)])).size,
      timelineRegistrations: r.filter((d) => d.editorVersion && d.inPoint && d.outPoint).length
    },
    outgoing: u.production?.handoffs?.at(-1) ?? null,
    openProblems: v.problems.filter((d) => d.status === "open"),
    lastWork: v.results.at(-1) ?? null,
    rule: "作者告知的製作完成、資料補登與素材實際檢視分開記錄。未登記的素材不推定未製作；接續整理保留來源，未對上成片的情節不得自動套用下一集。"
  };
}
var Fn = {
  source: "現實遊戲_動畫製作流程手冊_v1.0_20261019.docx",
  scenePosition: [
    "固定平面方向；門窗與樓梯所在側清楚記錄",
    "每個家具與固定構件使用固定編號，換機位不換編號",
    "記錄區域、朝向、與牆面及其他物件距離",
    "記錄可行走通道、起身轉向及上樓動線",
    "相機平面位置、朝向、景別及可見物件明確"
  ],
  imagePrompt: "來源參考 → 場景與機位 → 人物及服裝 → 物件相對位置 → 此刻動作 → 光線與風格 → 不可改動項目",
  videoPrompt: "起始／結束影格 → 主要動作 → 動作先後 → 相機是否移動 → 結束姿勢 → 保持不變的背景與物件",
  repairs: [
    "家具換位：回查場景平面與母圖",
    "人物變瘦或髮色錯：回查角色及狀態參考",
    "手勢不自然：拆小動作或修正起始／結束影格",
    "背景漂移：先降低鏡頭運動，再檢查影格及生成結果"
  ],
  ep01: [
    "現實主角與鏡像保持既定體型，髮色依核定狀態",
    "父母餐桌位置與菜色連續，樓梯及通道依固定基準",
    "頸環在現實身體上；進入遊戲意識空間後消失",
    "啟動先讓介面疊在現實房間，再轉黑暗",
    "先呈現想修好看的外觀意圖，再出現限制警告",
    "繼續試玩仍帶自我安慰，不能提前演成心理問題已解決",
    "片尾命名、系統資訊與揭露範圍以最新核定劇本為準",
    "OP：90 秒、OP-C01～C24，指定 _2026-10-13T061654.mp4，加入現實朋友",
    "ED：90 秒、ED-C01～C12，指定 Sustained_Shimmer_2026-10-13T124248.mp4，夜轉天亮後慢步離開並減少重複鏡頭",
    "翔吾本人與內心旁白沿用同一角色聲線，以表演及後製區分；保留貝西與開頭電腦內兩個聲音"
  ],
  numbering: "舊版 94 段、新版 S01～S10、F 影格、S01 的 R 擷取圖及配音 A 段不是同一套編號；一鏡可用多張影格，單張影格也可重用。",
  filenames: [
    "EP01_S06_SH03_start_v01.png",
    "EP01_S06_SH03_video_v02.mp4",
    "EP01_S06_SH03_VO01_take01.wav"
  ]
}, wm = [
  "rule",
  "script",
  "character",
  "scene",
  "audio",
  "reference"
];
function ma(u) {
  return u.knowledge ?? {
    records: [],
    problems: [],
    packs: [],
    results: []
  };
}
function ei(u) {
  return u.approval?.verdict === "source_accepted" || u.status === "effective";
}
function Bu(u, v) {
  return (u.production?.sections.find((T) => T.stageId === v)?.gaps ?? []).map((T, r) => {
    const d = [...u.production?.supplements ?? []].reverse().find((j) => j.stageId === v && j.gapIndex === r && j.gap === T);
    return {
      index: r,
      description: T,
      status: d ? "filled" : "open",
      record: d ? ma(u).records.find((j) => j.id === d.recordId) ?? null : null
    };
  });
}
function Em(u, v) {
  if (u.workId && (!v || v.id !== u.workId) || v && v.id !== u.workId) throw new pp("集數與作品不相符", 400);
  const T = Pu(u), r = v ? Ss(v) : null, d = (r?.models ?? []).map((Y) => {
    const k = Y.versions.at(-1), q = [...r?.history ?? []].reverse().find((Z) => Z.modelId === Y.id && Z.versionId === k.id && Z.action === "save_model_stage"), _ = yl.find((Z) => !k.stages[Z.id].author) ?? yl[7], E = Y.versions.find((Z) => Z.id === Y.adoptedVersionId);
    return {
      modelId: Y.id,
      key: Y.key,
      title: Y.title,
      versionId: k.id,
      label: k.label,
      adopted: E ? {
        versionId: E.id,
        label: E.label
      } : null,
      sourceLocation: k.sourceLocation,
      candidateLocation: k.candidateLocation,
      stageId: _.id,
      stageTitle: _.title,
      approved: yl.filter((Z) => k.stages[Z.id].author).length,
      lastWork: q ? {
        at: q.at,
        stageId: q.stageId,
        summary: k.stages[q.stageId].summary,
        evidence: k.stages[q.stageId].evidence,
        nextStep: k.stages[q.stageId].nextStep
      } : null,
      openIssues: r.issues.filter((Z) => Z.modelId === Y.id && Z.versionId === k.id && Z.status === "open"),
      nextStep: q ? k.stages[q.stageId].nextStep : "尚無工作回報；先讀取模型來源與指定版本，再取得任務資料包。"
    };
  }), j = [...new Map((r?.pins ?? []).filter((Y) => Y.episodeId === u.id).map((Y) => [[Y.modelId, Y.sceneIds].join("|"), Y])).values()].map((Y) => {
    const k = r.models.find((_) => _.id === Y.modelId), q = k?.versions.find((_) => _.id === Y.versionId);
    return {
      ...Y,
      title: k?.title ?? Y.modelId,
      label: q?.label ?? Y.versionId
    };
  });
  return {
    schemaVersion: 1,
    projectId: u.id,
    episodeCode: u.episode,
    title: v?.title ?? u.title,
    projectRevision: u.revision,
    workId: v?.id ?? null,
    workRevision: v?.revision ?? null,
    episode: T,
    models: d,
    pins: j,
    issues: {
      animation: u.issues.filter((Y) => Y.status === "open"),
      context: T.openProblems,
      models: r?.issues.filter((Y) => Y.status === "open") ?? []
    },
    lastToolWrite: [u.lastMcpAt, ...(r?.history ?? []).filter((Y) => Y.actor === "ai").map((Y) => Y.at)].filter((Y) => !!Y).sort().at(-1) ?? null,
    policy: "此總覽唯讀，不是工作資料包。動畫與模型共用作品入口，各自保留精確版本與資料包。模型清單顯示最新登記候選，採用版及本集引用另列，禁止自動替換。作者告知完成不等於逐項素材驗看；未登記不推定未製作。執行前取得對應範圍的新資料包，實際讀取來源後才回報；不得代替作者核定。"
  };
}
var Tm = /* @__PURE__ */ Pt(((u) => {
  var v = /* @__PURE__ */ Symbol.for("react.transitional.element"), T = /* @__PURE__ */ Symbol.for("react.fragment");
  function r(d, j, Y) {
    var k = null;
    if (Y !== void 0 && (k = "" + Y), j.key !== void 0 && (k = "" + j.key), "key" in j) {
      Y = {};
      for (var q in j) q !== "key" && (Y[q] = j[q]);
    } else Y = j;
    return j = Y.ref, {
      $$typeof: v,
      type: d,
      key: k,
      ref: j !== void 0 ? j : null,
      props: Y
    };
  }
  u.Fragment = T, u.jsx = r, u.jsxs = r;
})), Am = /* @__PURE__ */ Pt(((u, v) => {
  v.exports = Tm();
})), n = Am(), Pf = (u) => u ? new Date(u).toLocaleString("zh-TW", { timeZone: "Asia/Taipei" }) : "尚無紀錄";
function Cm(u, v) {
  const T = URL.createObjectURL(new Blob([v], { type: "text/plain;charset=utf-8" })), r = document.createElement("a");
  r.href = T, r.download = u, r.click(), setTimeout(() => URL.revokeObjectURL(T), 1e3);
}
function Mm({ project: u, work: v, busy: T, onNavigate: r, onModel: d }) {
  const j = Em(u, v), [Y, k] = (0, M.useState)(""), [q, _] = (0, M.useState)(""), [E, Z] = (0, M.useState)("animation"), H = j.models.find((B) => B.versionId === E), ae = j.episode.lastWork, de = j.issues.animation.length + j.issues.context.length + j.issues.models.length, L = `請使用「立之雲端庫｜動畫製作流程」工具，接手 ${j.title}／${u.episode}。先呼叫 read_animation_workspace({projectId:${JSON.stringify(u.id)}})，重新讀取伺服器最新資料，不使用本段文字中的舊 revision。
${H ? `本次範圍為模型 ${H.key}（modelId=${H.modelId}），精確版本 ${H.label}（versionId=${H.versionId}），定位階段 ${H.stageId}。workId=${v.id}。用 read_animation_models 查此版本的全部來源、問題及最近回報，確認實際任務範圍後，用 acquire_animation_model_context 取得新資料包；完成後用 update_animation_model_stage 回報。最新候選不等於已採用版。` : `本次範圍為 ${u.episode} 動畫。先讀 read_animation_episode_brief 與 read_animation_episode_settings，再依最近交接確認任務。用 preview_animation_context 檢查指定範圍，acquire_animation_context 保存資料包，以 submit_animation_work 回報。作者已告知完成的集數以資料補登為主，不因紀錄空白重做。`}
實際讀取所需素材後才執行，缺件、矛盾或過期資料包先回報受阻。寫回已做內容、產出位置與版本、未解問題及下一步。保留原檔、作者採用版本與各集固定引用，不能自行正式核定。若目前對話沒有上述工具，明確告知尚未接通，不宣稱已讀取或已回寫。`, [I, ne] = (0, M.useState)(!1), K = j.episode.project.completionReport?.status === "completed", ce = [
    ...j.issues.context.map((B) => ({
      id: B.id,
      text: B.description,
      tab: "context"
    })),
    ...j.issues.animation.map((B) => ({
      id: B.id,
      text: B.reason,
      tab: "issues"
    })),
    ...j.issues.models.map((B) => ({
      id: B.id,
      text: B.reason,
      tab: "models"
    }))
  ];
  return /* @__PURE__ */ (0, n.jsxs)("section", {
    className: "home-board",
    children: [
      /* @__PURE__ */ (0, n.jsxs)("article", {
        className: "next-action",
        children: [
          /* @__PURE__ */ (0, n.jsx)("div", {
            className: "eyebrow",
            children: "接下來做什麼"
          }),
          /* @__PURE__ */ (0, n.jsx)("h2", { children: K ? "本集已完成，繼續整理製作紀錄" : ae ? "接著完成上次的工作" : "從本集製作資料開始" }),
          /* @__PURE__ */ (0, n.jsx)("p", { children: ae?.nextStep || (K ? "補上採用檔案與製作過程，讓下一集和下一位 AI 都能接著用。" : "先整理劇本、角色與場景參考，再開始製作。") }),
          /* @__PURE__ */ (0, n.jsxs)("div", {
            className: "context-actions",
            children: [/* @__PURE__ */ (0, n.jsxs)("button", {
              className: "btn primary",
              disabled: T,
              onClick: () => r("context"),
              children: [
                K ? "繼續整理資料" : "開啟製作資料",
                " ",
                /* @__PURE__ */ (0, n.jsx)(en, { size: 16 })
              ]
            }), /* @__PURE__ */ (0, n.jsx)("button", {
              className: "btn",
              onClick: () => ne(!I),
              "aria-expanded": I,
              children: "交給 ChatGPT 接手"
            })]
          })
        ]
      }),
      /* @__PURE__ */ (0, n.jsxs)("div", {
        className: "home-summary",
        children: [
          /* @__PURE__ */ (0, n.jsxs)("div", { children: [
            /* @__PURE__ */ (0, n.jsx)("span", { children: "本集製作" }),
            /* @__PURE__ */ (0, n.jsx)("strong", { children: K ? "已完成" : j.episode.project.completionReport?.status === "in_progress" ? "製作中" : "尚未登記" }),
            /* @__PURE__ */ (0, n.jsx)("small", { children: "依作者登記" })
          ] }),
          /* @__PURE__ */ (0, n.jsxs)("div", { children: [
            /* @__PURE__ */ (0, n.jsx)("span", { children: "未處理問題" }),
            /* @__PURE__ */ (0, n.jsxs)("strong", { children: [de, /* @__PURE__ */ (0, n.jsx)("em", { children: " 項" })] }),
            /* @__PURE__ */ (0, n.jsx)("small", { children: "動畫、資料與模型合計" })
          ] }),
          /* @__PURE__ */ (0, n.jsxs)("button", {
            onClick: () => r("models"),
            children: [
              /* @__PURE__ */ (0, n.jsx)("span", { children: "共用模型" }),
              /* @__PURE__ */ (0, n.jsxs)("strong", { children: [j.models.length, /* @__PURE__ */ (0, n.jsx)("em", { children: " 個" })] }),
              /* @__PURE__ */ (0, n.jsx)("small", { children: "依已登記模型" })
            ]
          })
        ]
      }),
      I && /* @__PURE__ */ (0, n.jsxs)("article", {
        className: "wide-card ai-handoff",
        children: [
          /* @__PURE__ */ (0, n.jsxs)("div", {
            className: "section-title",
            children: [/* @__PURE__ */ (0, n.jsx)("h2", { children: "把這次工作交給 ChatGPT" }), /* @__PURE__ */ (0, n.jsx)("button", {
              className: "text-btn",
              onClick: () => ne(!1),
              children: "收起"
            })]
          }),
          /* @__PURE__ */ (0, n.jsx)("p", { children: "在已連接工作台的對話貼上指令，AI 會先讀取最新進度。" }),
          /* @__PURE__ */ (0, n.jsxs)("label", {
            className: "form-field",
            children: ["要接手的工作", /* @__PURE__ */ (0, n.jsxs)("select", {
              value: E,
              onChange: (B) => Z(B.target.value),
              children: [/* @__PURE__ */ (0, n.jsxs)("option", {
                value: "animation",
                children: [u.episode, " 動畫與資料整理"]
              }), j.models.map((B) => /* @__PURE__ */ (0, n.jsxs)("option", {
                value: B.versionId,
                children: [
                  B.title,
                  " · ",
                  B.label
                ]
              }, B.versionId))]
            })]
          }),
          /* @__PURE__ */ (0, n.jsxs)("div", {
            className: "context-actions",
            children: [/* @__PURE__ */ (0, n.jsxs)("button", {
              className: "btn primary",
              onClick: async () => {
                try {
                  await navigator.clipboard.writeText(L), k("已複製，請貼到已連接工作台的 ChatGPT 對話。");
                } catch {
                  k("無法直接複製，請展開完整指令後手動複製。");
                }
              },
              children: [/* @__PURE__ */ (0, n.jsx)(dp, { size: 15 }), "複製接手指令"]
            }), /* @__PURE__ */ (0, n.jsx)("button", {
              className: "btn",
              onClick: () => r("chatgpt"),
              children: "查看連接方式"
            })]
          }),
          /* @__PURE__ */ (0, n.jsx)("p", {
            role: "status",
            children: Y
          }),
          /* @__PURE__ */ (0, n.jsxs)("details", { children: [
            /* @__PURE__ */ (0, n.jsx)("summary", { children: "完整指令與下載" }),
            /* @__PURE__ */ (0, n.jsx)("textarea", {
              readOnly: !0,
              "aria-label": "AI 接手指令",
              rows: 8,
              value: L
            }),
            /* @__PURE__ */ (0, n.jsxs)("button", {
              className: "btn",
              onClick: () => Cm(u.episode + "_AI接續指令.txt", L),
              children: [/* @__PURE__ */ (0, n.jsx)(rp, { size: 15 }), "下載指令"]
            })
          ] }),
          /* @__PURE__ */ (0, n.jsxs)("small", { children: [
            "複製指令不會自動啟動 AI。最近寫入：",
            Pf(j.lastToolWrite),
            "。"
          ] })
        ]
      }),
      /* @__PURE__ */ (0, n.jsxs)("div", {
        className: "home-columns",
        children: [/* @__PURE__ */ (0, n.jsxs)("article", {
          className: "wide-card",
          children: [/* @__PURE__ */ (0, n.jsx)("div", {
            className: "section-title",
            children: /* @__PURE__ */ (0, n.jsx)("h2", { children: "選擇要做的工作" })
          }), /* @__PURE__ */ (0, n.jsxs)("div", {
            className: "task-choices",
            children: [
              /* @__PURE__ */ (0, n.jsxs)("button", {
                onClick: () => r("main"),
                children: [
                  /* @__PURE__ */ (0, n.jsx)(ha, { size: 22 }),
                  /* @__PURE__ */ (0, n.jsxs)("span", { children: [/* @__PURE__ */ (0, n.jsx)("b", { children: "動畫製作" }), /* @__PURE__ */ (0, n.jsx)("small", { children: "主線、片頭片尾與鏡頭素材" })] }),
                  /* @__PURE__ */ (0, n.jsx)(en, { size: 17 })
                ]
              }),
              /* @__PURE__ */ (0, n.jsxs)("button", {
                onClick: () => r("models"),
                children: [
                  /* @__PURE__ */ (0, n.jsx)(Ku, { size: 22 }),
                  /* @__PURE__ */ (0, n.jsxs)("span", { children: [/* @__PURE__ */ (0, n.jsx)("b", { children: "3D 模型" }), /* @__PURE__ */ (0, n.jsx)("small", { children: "模型版本、檢查與採用紀錄" })] }),
                  /* @__PURE__ */ (0, n.jsx)(en, { size: 17 })
                ]
              }),
              /* @__PURE__ */ (0, n.jsxs)("button", {
                onClick: () => r("project"),
                children: [
                  /* @__PURE__ */ (0, n.jsx)(op, { size: 22 }),
                  /* @__PURE__ */ (0, n.jsxs)("span", { children: [/* @__PURE__ */ (0, n.jsx)("b", { children: "作品與後續集數" }), /* @__PURE__ */ (0, n.jsx)("small", { children: "管理集數與共用參考資料" })] }),
                  /* @__PURE__ */ (0, n.jsx)(en, { size: 17 })
                ]
              })
            ]
          })]
        }), /* @__PURE__ */ (0, n.jsxs)("article", {
          className: "wide-card attention-card",
          children: [/* @__PURE__ */ (0, n.jsxs)("div", {
            className: "section-title",
            children: [/* @__PURE__ */ (0, n.jsx)("h2", { children: "需要處理的事" }), /* @__PURE__ */ (0, n.jsxs)("span", {
              className: "muted",
              children: [de, " 項"]
            })]
          }), ce.length ? /* @__PURE__ */ (0, n.jsxs)("div", {
            className: "attention-list",
            children: [ce.slice(0, 3).map((B) => /* @__PURE__ */ (0, n.jsxs)("button", {
              onClick: () => r(B.tab),
              children: [
                /* @__PURE__ */ (0, n.jsx)(tn, { size: 17 }),
                /* @__PURE__ */ (0, n.jsx)("span", { children: B.text }),
                /* @__PURE__ */ (0, n.jsx)(en, { size: 15 })
              ]
            }, B.id)), ce.length > 3 && /* @__PURE__ */ (0, n.jsxs)("details", { children: [/* @__PURE__ */ (0, n.jsxs)("summary", { children: [
              "其餘 ",
              ce.length - 3,
              " 項問題"
            ] }), ce.slice(3).map((B) => /* @__PURE__ */ (0, n.jsx)("button", {
              onClick: () => r(B.tab),
              children: B.text
            }, B.id))] })]
          }) : /* @__PURE__ */ (0, n.jsxs)("div", {
            className: "quiet-state",
            children: [
              /* @__PURE__ */ (0, n.jsx)(ha, { size: 28 }),
              /* @__PURE__ */ (0, n.jsx)("h3", { children: "目前沒有登記問題" }),
              /* @__PURE__ */ (0, n.jsx)("p", { children: "發現缺件或需要修改時，再加入紀錄。" })
            ]
          })]
        })]
      }),
      /* @__PURE__ */ (0, n.jsxs)("details", {
        className: "wide-card home-history",
        children: [
          /* @__PURE__ */ (0, n.jsx)("summary", { children: "最近工作與模型版本" }),
          ae ? /* @__PURE__ */ (0, n.jsxs)(n.Fragment, { children: [
            /* @__PURE__ */ (0, n.jsx)("h3", { children: ae.task }),
            /* @__PURE__ */ (0, n.jsx)("p", { children: ae.summary }),
            ae.needsReview && /* @__PURE__ */ (0, n.jsx)("p", {
              className: "resume-warning",
              children: "採用依據有更新，接手前請重新讀取。"
            }),
            /* @__PURE__ */ (0, n.jsx)("small", { children: Pf(ae.at) })
          ] }) : /* @__PURE__ */ (0, n.jsx)("p", { children: "尚無 AI 工作回報；這不代表沒有製作成果。" }),
          j.models.map((B) => /* @__PURE__ */ (0, n.jsxs)("div", {
            className: "home-model-row",
            children: [/* @__PURE__ */ (0, n.jsxs)("div", { children: [
              /* @__PURE__ */ (0, n.jsx)("b", { children: B.title }),
              /* @__PURE__ */ (0, n.jsxs)("p", { children: [
                "目前候選 ",
                B.label,
                " · 採用 ",
                B.adopted?.label ?? "尚未登記"
              ] }),
              /* @__PURE__ */ (0, n.jsx)("small", { children: B.nextStep })
            ] }), /* @__PURE__ */ (0, n.jsx)("button", {
              className: "btn",
              disabled: T,
              onClick: () => d({
                modelId: B.modelId,
                versionId: B.versionId,
                stageId: B.stageId
              }),
              children: "開啟版本"
            })]
          }, B.modelId)),
          /* @__PURE__ */ (0, n.jsxs)("details", { children: [
            /* @__PURE__ */ (0, n.jsxs)("summary", { children: [
              "本集固定模型引用（",
              j.pins.length,
              "）"
            ] }),
            j.pins.map((B, P) => /* @__PURE__ */ (0, n.jsxs)("p", { children: [
              B.title,
              " · ",
              B.label,
              " · ",
              B.purpose
            ] }, P)),
            /* @__PURE__ */ (0, n.jsx)("button", {
              className: "btn",
              onClick: () => r("settings"),
              children: "查看採用設定"
            })
          ] }),
          /* @__PURE__ */ (0, n.jsxs)("details", { children: [
            /* @__PURE__ */ (0, n.jsx)("summary", { children: "AI 接手識別資料" }),
            /* @__PURE__ */ (0, n.jsxs)("p", { children: ["集數 ID：", u.id] }),
            /* @__PURE__ */ (0, n.jsxs)("p", { children: ["作品 ID：", v?.id || "未歸屬"] }),
            /* @__PURE__ */ (0, n.jsxs)("p", { children: ["資料版本：", u.revision] })
          ] })
        ]
      })
    ]
  });
}
function Om({ project: u, check: v }) {
  const [T, r] = (0, M.useState)(!1), [d, j] = (0, M.useState)(""), [Y, k] = (0, M.useState)(""), q = `請使用「立之雲端庫｜動畫製作流程」外掛，先呼叫 read_animation_workspace，projectId 為 ${u.id}，確認 ${u.episode} 的目前進度、採用版本、未解問題與下一步。請重新讀取最新資料，不從聊天推定完成。若本集已由作者告知完成，先做資料補登。確認範圍後取得新的工作資料包，實際讀取參考素材，最後回報已做內容、成果位置、未完成項及下一步。若本對話沒有工具，請明確告知未連接。`;
  return /* @__PURE__ */ (0, n.jsxs)("section", {
    className: "connection-simple",
    children: [/* @__PURE__ */ (0, n.jsxs)("article", {
      className: "wide-card",
      children: [
        /* @__PURE__ */ (0, n.jsx)("div", {
          className: "eyebrow",
          children: "與你共用同一份進度"
        }),
        /* @__PURE__ */ (0, n.jsx)("h2", { children: "讓 ChatGPT 讀懂並接續工作" }),
        /* @__PURE__ */ (0, n.jsx)("p", {
          className: "stage-description",
          children: "你在雲端庫管理作品；已連接的 ChatGPT 可以查資料、補紀錄、登記問題和回報成果。"
        }),
        /* @__PURE__ */ (0, n.jsxs)("ol", {
          className: "connect-steps",
          children: [
            /* @__PURE__ */ (0, n.jsxs)("li", { children: [/* @__PURE__ */ (0, n.jsx)("b", { children: "在 ChatGPT 選用流程工作台" }), /* @__PURE__ */ (0, n.jsx)("p", { children: "在對話輸入 @，選擇「立之雲端庫｜動畫製作流程」。若已安裝卻找不到，請開新對話再選。" })] }),
            /* @__PURE__ */ (0, n.jsxs)("li", { children: [/* @__PURE__ */ (0, n.jsx)("b", { children: "告訴它這次要做什麼" }), /* @__PURE__ */ (0, n.jsx)("p", { children: "複製下方指令，再補上你的任務，例如「整理這集還缺什麼」或「接手主角家的模型」。" })] }),
            /* @__PURE__ */ (0, n.jsxs)("li", { children: [/* @__PURE__ */ (0, n.jsx)("b", { children: "完成後回來看紀錄" }), /* @__PURE__ */ (0, n.jsx)("p", { children: "ChatGPT 回報後，這裡會顯示工作結果與下一步。正式採用版本由你確認。" })] })
          ]
        }),
        /* @__PURE__ */ (0, n.jsxs)("button", {
          className: "btn primary",
          onClick: async () => {
            try {
              await navigator.clipboard.writeText(q), k("已複製，請貼到選用工作台的對話。");
            } catch {
              k("請展開完整指令後手動複製。");
            }
          },
          children: [/* @__PURE__ */ (0, n.jsx)(dp, { size: 16 }), "複製本集接手指令"]
        }),
        /* @__PURE__ */ (0, n.jsx)("p", {
          role: "status",
          children: Y
        }),
        /* @__PURE__ */ (0, n.jsxs)("details", { children: [/* @__PURE__ */ (0, n.jsx)("summary", { children: "查看完整指令" }), /* @__PURE__ */ (0, n.jsx)("textarea", {
          "aria-label": "本集接手指令",
          readOnly: !0,
          rows: 7,
          value: q
        })] })
      ]
    }), /* @__PURE__ */ (0, n.jsxs)("article", {
      className: "wide-card",
      children: [
        /* @__PURE__ */ (0, n.jsxs)("h2", { children: [/* @__PURE__ */ (0, n.jsx)(Fu, { size: 20 }), " 連線與最近更新"] }),
        /* @__PURE__ */ (0, n.jsx)("p", { children: "網頁連線與對話工具是兩個檢查項目；這個按鈕會檢查網頁能否讀取共用資料。" }),
        /* @__PURE__ */ (0, n.jsxs)("button", {
          className: "btn",
          disabled: T,
          onClick: async () => {
            r(!0), j("");
            try {
              await v(), j("共用資料讀取成功。對話是否已選用外掛，仍需由 ChatGPT 實際呼叫工具確認。");
            } catch (_) {
              j("讀取失敗：" + (_ instanceof Error ? _.message : String(_)));
            } finally {
              r(!1);
            }
          },
          children: [/* @__PURE__ */ (0, n.jsx)(fp, {
            size: 15,
            className: T ? "spin" : ""
          }), T ? "檢查中…" : "檢查資料連線"]
        }),
        /* @__PURE__ */ (0, n.jsx)("p", {
          role: "status",
          children: d
        }),
        /* @__PURE__ */ (0, n.jsx)("div", {
          className: "connection-state",
          children: /* @__PURE__ */ (0, n.jsxs)("div", { children: [/* @__PURE__ */ (0, n.jsx)("b", { children: u.lastMcpAt ? "已有 ChatGPT 回報紀錄" : "尚無 ChatGPT 寫入紀錄" }), /* @__PURE__ */ (0, n.jsx)("small", { children: u.lastMcpAt ? new Date(u.lastMcpAt).toLocaleString("zh-TW", { timeZone: "Asia/Taipei" }) : "首次回報後會顯示時間" })] })
        }),
        /* @__PURE__ */ (0, n.jsx)("small", { children: "這是最近寫入時間，不代表 AI 正在執行。" }),
        /* @__PURE__ */ (0, n.jsxs)("details", { children: [
          /* @__PURE__ */ (0, n.jsx)("summary", { children: "連接與權限詳情" }),
          /* @__PURE__ */ (0, n.jsx)("p", { children: "MCP：https://lizhi-animation-flow.lihuany635.chatgpt.site/mcp" }),
          /* @__PURE__ */ (0, n.jsx)("p", { children: "每次更新先讀取最新版本。AI 可補充紀錄、提出問題與回報工作；作者核定及正式採用由網頁確認。" }),
          /* @__PURE__ */ (0, n.jsx)("p", { children: "只填檔案位置不會上傳檔案；ChatGPT 必須能實際取得素材，才能檢查內容。" })
        ] })
      ]
    })]
  });
}
var ep = {
  rule: "規則／決策",
  script: "劇本／台詞",
  character: "角色",
  scene: "場景",
  audio: "聲音",
  reference: "原作／參考"
};
function km({ project: u, busy: v, mutate: T }) {
  const [r, d] = (0, M.useState)(""), [j, Y] = (0, M.useState)(""), [k, q] = (0, M.useState)(""), [_, E] = (0, M.useState)(30), [Z, H] = (0, M.useState)("main"), [ae, de] = (0, M.useState)(null), [L, I] = (0, M.useState)(""), [ne, K] = (0, M.useState)(""), [ce, B] = (0, M.useState)({
    content: "",
    source: "",
    location: ""
  }), P = ma(u).records, W = u.production?.sections ?? [], pe = W.find((x) => x.stageId === r), ie = P.filter(ei).length, J = Bu(u, r), b = W.reduce((x, Q) => x + Bu(u, Q.stageId).filter((G) => G.status === "open").length, 0), te = new Set(W.flatMap((x) => x.recordKeys)), be = P.filter((x) => (!r || pe?.recordKeys.includes(x.key) || x.scope.type === "stage" && x.scope.target === r) && (!k || x.kind === k) && (!j || [
    x.title,
    x.key,
    x.content,
    x.source,
    x.scope.target
  ].join(" ").toLowerCase().includes(j.toLowerCase()))).sort((x, Q) => (x.key.startsWith("ep01_src_") ? 1 : te.has(x.key) ? 0 : 2) - (Q.key.startsWith("ep01_src_") ? 1 : te.has(Q.key) ? 0 : 2));
  async function Te(x) {
    if (de(null), I(""), !!x)
      try {
        if (x.size > 15e5) throw new Error("資料包不可超過 1.5 MB");
        const Q = JSON.parse(await x.text());
        if (Q.schemaVersion !== 1 || Q.episode !== u.episode || !Array.isArray(Q.records) || !Array.isArray(Q.shots) || !Array.isArray(Q.sections)) throw new Error("請選擇相同集數的製作資料包");
        de(Q);
      } catch (Q) {
        I(Q instanceof Error ? Q.message : "資料包讀取失敗");
      }
  }
  return /* @__PURE__ */ (0, n.jsxs)(n.Fragment, { children: [
    /* @__PURE__ */ (0, n.jsxs)("div", {
      className: "section-title",
      children: [/* @__PURE__ */ (0, n.jsxs)("div", { children: [
        /* @__PURE__ */ (0, n.jsx)("div", {
          className: "eyebrow",
          children: "PRODUCTION MATERIALS"
        }),
        /* @__PURE__ */ (0, n.jsx)("h2", { children: "各環節的實際製作資料" }),
        /* @__PURE__ */ (0, n.jsx)("p", { children: "原作、完整台詞、逐鏡方案與提示詞，均保留來源及版本。" })
      ] }), /* @__PURE__ */ (0, n.jsx)("button", {
        className: "btn",
        onClick: () => {
          const x = URL.createObjectURL(new Blob([JSON.stringify({
            episode: u.episode,
            production: u.production,
            records: P,
            shots: u.shots
          }, null, 2)], { type: "application/json" })), Q = document.createElement("a");
          Q.href = x, Q.download = u.episode + "_製作資料.json", Q.click(), setTimeout(() => URL.revokeObjectURL(x), 1e3);
        },
        children: "匯出製作資料"
      })]
    }),
    /* @__PURE__ */ (0, n.jsxs)("div", {
      className: "production-totals",
      children: [
        /* @__PURE__ */ (0, n.jsxs)("b", { children: [P.length, " 筆資料"] }),
        /* @__PURE__ */ (0, n.jsxs)("b", { children: [u.shots.length, " 列鏡頭規劃"] }),
        /* @__PURE__ */ (0, n.jsxs)("b", { children: [W.length, " 個階段已盤點"] }),
        /* @__PURE__ */ (0, n.jsx)("span", { children: "實際缺件依下方清單，沒有以資料筆數推算完成率。" })
      ]
    }),
    /* @__PURE__ */ (0, n.jsx)("div", {
      className: "production-acceptance",
      children: u.production?.acceptance ? /* @__PURE__ */ (0, n.jsxs)(n.Fragment, { children: [
        /* @__PURE__ */ (0, n.jsx)("span", {
          className: "status passed",
          children: "現有資料已通過"
        }),
        /* @__PURE__ */ (0, n.jsxs)("b", { children: [ie, " 筆已確認收錄"] }),
        /* @__PURE__ */ (0, n.jsx)("p", { children: u.production.acceptance.note }),
        /* @__PURE__ */ (0, n.jsxs)("p", { children: [
          "補齊已開放 · ",
          b,
          " 項待補。可直接保存補充內容，不需逐筆再確認。不同來源版本保留，採用版本另行指定。"
        ] })
      ] }) : /* @__PURE__ */ (0, n.jsxs)(n.Fragment, { children: [/* @__PURE__ */ (0, n.jsx)("p", { children: "依作者確認，將已完成的資料一次通過，並開放剩餘項目直接補齊。" }), /* @__PURE__ */ (0, n.jsx)("button", {
        className: "btn primary",
        disabled: v || u.archived || !W.length,
        onClick: () => {
          T("accept_production_data", { note: "依作者2026-10-21指示：目前先不用檢核，已完成的資料直接通過；剩餘項目開放直接補齊。" });
        },
        children: "通過現有資料並開放補齊"
      })] })
    }),
    /* @__PURE__ */ (0, n.jsxs)("div", {
      className: "production-filters",
      children: [
        /* @__PURE__ */ (0, n.jsxs)("label", { children: ["搜尋實際內容", /* @__PURE__ */ (0, n.jsx)("input", {
          placeholder: "台詞、F077、G11、角色或素材名稱",
          value: j,
          onChange: (x) => {
            Y(x.target.value), E(30);
          }
        })] }),
        /* @__PURE__ */ (0, n.jsxs)("label", { children: ["製作階段", /* @__PURE__ */ (0, n.jsxs)("select", {
          value: r,
          onChange: (x) => {
            d(x.target.value), E(30);
          },
          children: [/* @__PURE__ */ (0, n.jsx)("option", {
            value: "",
            children: "全部階段"
          }), Vt.map((x) => /* @__PURE__ */ (0, n.jsxs)("option", {
            value: x.id,
            children: [
              x.id,
              " ",
              x.title
            ]
          }, x.id))]
        })] }),
        /* @__PURE__ */ (0, n.jsxs)("label", { children: ["資料種類", /* @__PURE__ */ (0, n.jsxs)("select", {
          value: k,
          onChange: (x) => {
            q(x.target.value), E(30);
          },
          children: [/* @__PURE__ */ (0, n.jsx)("option", {
            value: "",
            children: "全部種類"
          }), Object.entries(ep).map(([x, Q]) => /* @__PURE__ */ (0, n.jsx)("option", {
            value: x,
            children: Q
          }, x))]
        })] })
      ]
    }),
    /* @__PURE__ */ (0, n.jsx)("div", {
      className: "context-tabs",
      "aria-label": "資料階段分組",
      children: [
        ["main", "主線 12 階段"],
        ["op", "OP 支線"],
        ["ed", "ED 支線"]
      ].map(([x, Q]) => /* @__PURE__ */ (0, n.jsx)("button", {
        className: Z === x ? "active" : "",
        onClick: () => H(x),
        children: Q
      }, x))
    }),
    /* @__PURE__ */ (0, n.jsx)("div", {
      className: "production-grid",
      children: Vt.filter((x) => x.group === Z).map((x) => {
        const Q = W.find((O) => O.stageId === x.id), G = Bu(u, x.id).filter((O) => O.status === "open").length;
        return /* @__PURE__ */ (0, n.jsxs)("button", {
          className: "production-stage " + (r === x.id ? "selected" : ""),
          onClick: () => {
            d(r === x.id ? "" : x.id), K(""), E(30);
          },
          children: [
            /* @__PURE__ */ (0, n.jsx)("small", { children: x.group === "main" ? x.id : x.group.toUpperCase() + " " + x.id.slice(2) }),
            /* @__PURE__ */ (0, n.jsx)("b", { children: x.title }),
            /* @__PURE__ */ (0, n.jsx)("span", { children: Q ? Q.recordKeys.length + " 筆相關資料" : "尚未盤點" }),
            /* @__PURE__ */ (0, n.jsx)("em", { children: Q ? G + " 項待補" : "待補資料" })
          ]
        }, x.id);
      })
    }),
    pe && /* @__PURE__ */ (0, n.jsxs)("div", {
      className: "production-gaps",
      children: [
        /* @__PURE__ */ (0, n.jsxs)("h3", { children: [Vt.find((x) => x.id === r)?.title, " · 資料盤點"] }),
        /* @__PURE__ */ (0, n.jsx)("p", { children: pe.overview }),
        /* @__PURE__ */ (0, n.jsx)("b", { children: "補齊清單" }),
        J.length ? /* @__PURE__ */ (0, n.jsx)("div", { children: J.map((x) => /* @__PURE__ */ (0, n.jsxs)("article", {
          className: "production-gap",
          children: [
            /* @__PURE__ */ (0, n.jsx)("span", {
              className: "status " + (x.status === "filled" ? "passed" : "candidate"),
              children: x.status === "filled" ? "已補資料" : u.production?.supplementsOpen ? "開放補齊" : "待補"
            }),
            /* @__PURE__ */ (0, n.jsx)("p", { children: x.description }),
            x.record && /* @__PURE__ */ (0, n.jsxs)("details", { children: [
              /* @__PURE__ */ (0, n.jsx)("summary", { children: "查看已補內容與來源" }),
              /* @__PURE__ */ (0, n.jsx)("div", {
                className: "production-source-text",
                children: x.record.content
              }),
              /* @__PURE__ */ (0, n.jsxs)("p", { children: ["來源：", x.record.source] }),
              /* @__PURE__ */ (0, n.jsxs)("p", { children: ["素材位置：", x.record.location || "內容已記錄"] })
            ] }),
            u.production?.supplementsOpen && (ne === r + ":" + x.index ? /* @__PURE__ */ (0, n.jsxs)("form", {
              className: "context-form",
              onSubmit: async (Q) => {
                Q.preventDefault(), await T("supplement_production_data", {
                  stageId: r,
                  gapIndex: x.index,
                  ...ce
                }) && (K(""), B({
                  content: "",
                  source: "",
                  location: ""
                }));
              },
              children: [
                /* @__PURE__ */ (0, n.jsxs)("label", { children: ["補齊內容", /* @__PURE__ */ (0, n.jsx)("textarea", {
                  required: !0,
                  rows: 5,
                  maxLength: 12e3,
                  value: ce.content,
                  onChange: (Q) => B({
                    ...ce,
                    content: Q.target.value
                  })
                })] }),
                /* @__PURE__ */ (0, n.jsxs)("label", { children: ["補件來源", /* @__PURE__ */ (0, n.jsx)("input", {
                  required: !0,
                  maxLength: 2e3,
                  value: ce.source,
                  onChange: (Q) => B({
                    ...ce,
                    source: Q.target.value
                  })
                })] }),
                /* @__PURE__ */ (0, n.jsxs)("label", { children: ["補件素材位置", /* @__PURE__ */ (0, n.jsx)("input", {
                  maxLength: 2e3,
                  value: ce.location,
                  onChange: (Q) => B({
                    ...ce,
                    location: Q.target.value
                  })
                })] }),
                /* @__PURE__ */ (0, n.jsxs)("div", {
                  className: "context-actions",
                  children: [/* @__PURE__ */ (0, n.jsx)("button", {
                    className: "btn",
                    type: "button",
                    onClick: () => K(""),
                    children: "取消"
                  }), /* @__PURE__ */ (0, n.jsx)("button", {
                    className: "btn primary",
                    disabled: v || u.archived,
                    children: "直接保存補齊內容"
                  })]
                })
              ]
            }) : /* @__PURE__ */ (0, n.jsx)("button", {
              className: "btn",
              disabled: v || u.archived,
              onClick: () => {
                K(r + ":" + x.index), B({
                  content: x.record?.content ?? "",
                  source: x.record?.source ?? "",
                  location: x.record?.location ?? ""
                });
              },
              children: x.status === "filled" ? "追加補充版本" : "補齊此項"
            }))
          ]
        }, x.index)) }) : /* @__PURE__ */ (0, n.jsx)("p", { children: "本次盤點未列缺件。" })
      ]
    }),
    /* @__PURE__ */ (0, n.jsxs)("p", {
      className: "muted",
      children: [
        "找到 ",
        be.length,
        " 筆資料；展開可讀取完整內容與來源。"
      ]
    }),
    /* @__PURE__ */ (0, n.jsx)("div", {
      className: "production-records",
      children: be.slice(0, _).map((x) => /* @__PURE__ */ (0, n.jsxs)("details", {
        className: "production-record",
        children: [
          /* @__PURE__ */ (0, n.jsxs)("summary", { children: [
            /* @__PURE__ */ (0, n.jsx)("span", {
              className: "status " + (ei(x) ? "passed" : "candidate"),
              children: x.status === "effective" ? "採用版本" : x.status === "superseded" ? "已停用" : ei(x) ? "資料已通過" : "來源資料／待確認"
            }),
            /* @__PURE__ */ (0, n.jsx)("b", { children: x.title }),
            /* @__PURE__ */ (0, n.jsxs)("small", { children: [
              ep[x.kind],
              " · ",
              x.scope.target || "本集共用"
            ] })
          ] }),
          /* @__PURE__ */ (0, n.jsxs)("code", {
            className: "context-id",
            children: [
              x.key,
              " · v",
              x.version
            ]
          }),
          /* @__PURE__ */ (0, n.jsx)("div", {
            className: "production-source-text",
            children: x.content
          }),
          /* @__PURE__ */ (0, n.jsxs)("p", {
            className: "context-source",
            children: [
              "來源：",
              x.source,
              /* @__PURE__ */ (0, n.jsx)("br", {}),
              "素材位置：",
              x.location || "內容已收錄於本資料；無外部素材位置"
            ]
          })
        ]
      }, x.id))
    }),
    be.length > _ && /* @__PURE__ */ (0, n.jsx)("button", {
      className: "btn",
      onClick: () => E(_ + 30),
      children: "再顯示 30 筆資料"
    }),
    !P.length && /* @__PURE__ */ (0, n.jsx)("p", {
      className: "empty",
      children: "尚無製作資料。可逐筆新增，或匯入下方資料包。"
    }),
    /* @__PURE__ */ (0, n.jsxs)("details", {
      className: "production-import",
      children: [
        /* @__PURE__ */ (0, n.jsx)("summary", { children: "批次補入製作資料" }),
        /* @__PURE__ */ (0, n.jsx)("p", { children: "先顯示筆數及集數，保存後全部作為待確認來源。保留現有資料與核定狀態；重複識別鍵會拒絕匯入。" }),
        /* @__PURE__ */ (0, n.jsxs)("label", { children: ["選擇製作資料包（JSON）", /* @__PURE__ */ (0, n.jsx)("input", {
          type: "file",
          accept: "application/json,.json",
          disabled: v || u.archived,
          onChange: (x) => {
            Te(x.target.files?.[0]);
          }
        })] }),
        L && /* @__PURE__ */ (0, n.jsx)("p", {
          role: "alert",
          children: L
        }),
        ae && /* @__PURE__ */ (0, n.jsxs)("div", {
          className: "inline-note",
          children: [
            /* @__PURE__ */ (0, n.jsx)("b", { children: String(ae.title) }),
            /* @__PURE__ */ (0, n.jsxs)("p", { children: [
              String(ae.episode),
              " · ",
              ae.records.length,
              " 筆來源資料 · ",
              ae.shots.length,
              " 列待製作鏡頭 · ",
              ae.sections.length,
              " 個階段盤點"
            ] }),
            /* @__PURE__ */ (0, n.jsx)("button", {
              className: "btn primary",
              disabled: v || u.archived,
              onClick: async () => {
                await T("import_production_data", ae) && (de(null), d(""), Y(""), q(""));
              },
              children: "保存製作資料包"
            })
          ]
        }),
        u.production?.imports.map((x) => /* @__PURE__ */ (0, n.jsxs)("p", {
          className: "muted",
          children: [
            "已補入：",
            x.title,
            " · ",
            x.records,
            " 筆資料／",
            x.shots,
            " 列鏡頭"
          ]
        }, x.id))
      ]
    })
  ] });
}
function Dm({ shotId: u, selection: v, disabled: T, mutate: r }) {
  const d = [
    ["output", "實際採用檔位置"],
    ["outputVersion", "採用檔版本"],
    ["reason", "選用原因"],
    ["source", "採用依據來源"],
    ["editorVersion", "剪輯工程版本"],
    ["inPoint", "工程入點"],
    ["outPoint", "工程出點"]
  ], [j, Y] = (0, M.useState)(() => Object.fromEntries(d.map(([k]) => [k, v?.[k] ?? ""])));
  return /* @__PURE__ */ (0, n.jsxs)("details", {
    className: "selection-editor",
    children: [/* @__PURE__ */ (0, n.jsx)("summary", { children: "登記採用檔與工程位置" }), /* @__PURE__ */ (0, n.jsxs)("form", {
      className: "context-form",
      onSubmit: async (k) => {
        k.preventDefault(), await r("register_shot_selection", {
          ...j,
          shotId: u,
          baseVersion: v?.version ?? 0
        });
      },
      children: [
        d.map(([k, q]) => /* @__PURE__ */ (0, n.jsxs)("label", { children: [q, /* @__PURE__ */ (0, n.jsx)("input", {
          required: [
            "output",
            "outputVersion",
            "reason",
            "source"
          ].includes(k),
          maxLength: k === "reason" ? 3e3 : 2e3,
          value: j[k],
          onChange: (_) => Y({
            ...j,
            [k]: _.target.value
          })
        })] }, k)),
        /* @__PURE__ */ (0, n.jsx)("p", {
          className: "muted",
          children: "工程入出點須成對填寫。保存來源與選用版本；素材實際開啟及檢視另行記錄。"
        }),
        /* @__PURE__ */ (0, n.jsx)("button", {
          className: "btn primary",
          disabled: T,
          children: "保存採用紀錄版本"
        })
      ]
    })]
  });
}
function Um({ project: u, busy: v, mutate: T }) {
  const [r, d] = (0, M.useState)(""), [j, Y] = (0, M.useState)(""), [k, q] = (0, M.useState)(""), [_, E] = (0, M.useState)(20), Z = [...new Map((u.production?.selections ?? []).map((L) => [L.shotId, L])).values()], H = [...new Map((u.production?.links ?? []).map((L) => [L.shotId, L])).values()], ae = ma(u).records, de = u.shots.filter((L) => [
    L.id,
    L.scene,
    L.description,
    L.legacyIds
  ].join(" ").toLowerCase().includes(r.toLowerCase()));
  return /* @__PURE__ */ (0, n.jsxs)(n.Fragment, { children: [
    /* @__PURE__ */ (0, n.jsx)("div", {
      className: "section-title",
      children: /* @__PURE__ */ (0, n.jsxs)("div", { children: [
        /* @__PURE__ */ (0, n.jsx)("div", {
          className: "eyebrow",
          children: "PRODUCTION LINKS"
        }),
        /* @__PURE__ */ (0, n.jsx)("h2", { children: "每個鏡頭的依據與接續" }),
        /* @__PURE__ */ (0, n.jsx)("p", { children: "串起來源文本、影格定位、動作提示、剪輯對照與音檔。對照候選保留原時間基準，實際採用檔與入片位置分別登記。" })
      ] })
    }),
    /* @__PURE__ */ (0, n.jsxs)("div", {
      className: "production-totals",
      children: [
        /* @__PURE__ */ (0, n.jsxs)("b", { children: [
          H.length,
          " / ",
          u.shots.length,
          " 列已建立關聯"
        ] }),
        /* @__PURE__ */ (0, n.jsxs)("b", { children: [H.filter((L) => L.references.length).length, " 列有影格來源定位"] }),
        /* @__PURE__ */ (0, n.jsxs)("b", { children: [(/* @__PURE__ */ new Set([...Z.map((L) => L.shotId), ...H.filter((L) => L.adoptedOutput).map((L) => L.shotId)])).size, " 列已登記採用檔"] })
      ]
    }),
    /* @__PURE__ */ (0, n.jsxs)("label", {
      className: "work-search",
      children: ["搜尋鏡頭關聯", /* @__PURE__ */ (0, n.jsx)("input", {
        value: r,
        onChange: (L) => {
          d(L.target.value), E(20);
        },
        placeholder: "F077、G11、S06 或鏡頭 ID"
      })]
    }),
    de.slice(0, _).map((L) => {
      const I = H.find((K) => K.shotId === L.id), ne = Z.find((K) => K.shotId === L.id);
      return /* @__PURE__ */ (0, n.jsxs)("details", {
        className: "production-record",
        children: [
          /* @__PURE__ */ (0, n.jsxs)("summary", { children: [/* @__PURE__ */ (0, n.jsxs)("b", { children: [
            L.id,
            " · ",
            L.legacyIds
          ] }), /* @__PURE__ */ (0, n.jsxs)("small", { children: [
            L.scene,
            " · ",
            I ? "關聯已建立" : "來源對應待補"
          ] })] }),
          /* @__PURE__ */ (0, n.jsx)("p", {
            className: "production-source-text",
            children: L.description
          }),
          I ? /* @__PURE__ */ (0, n.jsxs)(n.Fragment, { children: [
            /* @__PURE__ */ (0, n.jsxs)("div", {
              className: "production-gaps",
              children: [
                /* @__PURE__ */ (0, n.jsx)("b", { children: "接著做什麼" }),
                /* @__PURE__ */ (0, n.jsx)("p", { children: ne ? "採用檔已登記；接著開啟素材並對照工程版本與入出點。" : I.nextStep }),
                /* @__PURE__ */ (0, n.jsxs)("p", { children: ["採用檔：", ne?.output || I.adoptedOutput || "位置尚未登記"] }),
                /* @__PURE__ */ (0, n.jsxs)("p", { children: ["選用原因：", ne?.reason || I.selectionReason || "尚未登記"] }),
                I.unknowns.length > 0 && /* @__PURE__ */ (0, n.jsx)("p", {
                  className: "muted",
                  children: "來源盤點時的缺口；新增採用登記另列於下方。"
                }),
                I.unknowns.length > 0 && /* @__PURE__ */ (0, n.jsx)("ul", { children: I.unknowns.map((K, ce) => /* @__PURE__ */ (0, n.jsx)("li", { children: K }, ce)) })
              ]
            }),
            ne && /* @__PURE__ */ (0, n.jsxs)("div", {
              className: "context-mini",
              children: [
                /* @__PURE__ */ (0, n.jsxs)("b", { children: [
                  "採用登記 v",
                  ne.version,
                  " · ",
                  ne.outputVersion
                ] }),
                /* @__PURE__ */ (0, n.jsxs)("p", { children: ["依據：", ne.source] }),
                /* @__PURE__ */ (0, n.jsxs)("p", { children: [
                  "工程：",
                  ne.editorVersion || "未登記",
                  " · ",
                  ne.inPoint || "未登記",
                  " → ",
                  ne.outPoint || "未登記"
                ] })
              ]
            }),
            /* @__PURE__ */ (0, n.jsx)("h3", { children: "使用依據與提示詞" }),
            I.recordKeys.map((K) => {
              const ce = ae.find((B) => B.key === K);
              return ce ? /* @__PURE__ */ (0, n.jsxs)("details", {
                className: "context-mini",
                children: [
                  /* @__PURE__ */ (0, n.jsx)("summary", { children: ce.title }),
                  /* @__PURE__ */ (0, n.jsxs)("code", { children: [
                    ce.key,
                    " · v",
                    ce.version
                  ] }),
                  /* @__PURE__ */ (0, n.jsx)("div", {
                    className: "production-source-text",
                    children: ce.content
                  }),
                  /* @__PURE__ */ (0, n.jsxs)("p", { children: ["來源：", ce.source] })
                ]
              }, K) : null;
            }),
            /* @__PURE__ */ (0, n.jsx)("h3", { children: "來源影格定位" }),
            I.references.length ? I.references.map((K, ce) => /* @__PURE__ */ (0, n.jsxs)("div", {
              className: "context-mini",
              children: [
                /* @__PURE__ */ (0, n.jsx)("b", { children: K.file }),
                /* @__PURE__ */ (0, n.jsxs)("p", { children: ["素材包：", K.archive] }),
                /* @__PURE__ */ (0, n.jsxs)("p", { children: ["包內位置：", K.member] }),
                /* @__PURE__ */ (0, n.jsxs)("code", {
                  className: "context-id",
                  children: ["SHA-256 ", K.sha256 || "來源未列"]
                }),
                /* @__PURE__ */ (0, n.jsx)("small", { children: "依來源索引定位；實際圖像讀取狀態另記。" })
              ]
            }, ce)) : /* @__PURE__ */ (0, n.jsx)("p", { children: "目前來源未對上此影格。" }),
            /* @__PURE__ */ (0, n.jsx)("h3", { children: "剪輯對照候選" }),
            /* @__PURE__ */ (0, n.jsx)("p", {
              className: "muted",
              children: "以下時間來自指定來源表，尚未指定為本鏡實際入片位置。"
            }),
            I.timelineCandidates.map((K, ce) => /* @__PURE__ */ (0, n.jsxs)("div", {
              className: "context-mini",
              children: [
                /* @__PURE__ */ (0, n.jsxs)("b", { children: [
                  "序號 ",
                  K.sequence,
                  " · ",
                  K.start,
                  " → ",
                  K.end
                ] }),
                /* @__PURE__ */ (0, n.jsx)("p", { children: K.text }),
                /* @__PURE__ */ (0, n.jsx)("small", { children: K.source })
              ]
            }, ce)),
            !I.timelineCandidates.length && /* @__PURE__ */ (0, n.jsx)("p", { children: "尚缺可核實的剪輯對照。" }),
            /* @__PURE__ */ (0, n.jsx)("h3", { children: "台詞與音檔對照候選" }),
            I.voiceCandidates.map((K, ce) => /* @__PURE__ */ (0, n.jsxs)("div", {
              className: "context-mini",
              children: [
                /* @__PURE__ */ (0, n.jsx)("b", { children: K.lineId }),
                /* @__PURE__ */ (0, n.jsx)("p", { children: K.file }),
                /* @__PURE__ */ (0, n.jsxs)("small", { children: [
                  K.start,
                  " → ",
                  K.end,
                  " · ",
                  K.source
                ] })
              ]
            }, ce)),
            !I.voiceCandidates.length && /* @__PURE__ */ (0, n.jsx)("p", { children: "尚未建立明確台詞對應，不依編號猜配。" })
          ] }) : /* @__PURE__ */ (0, n.jsx)("p", { children: "請補來源與實際輸出對應。" }),
          /* @__PURE__ */ (0, n.jsx)(Dm, {
            shotId: L.id,
            selection: ne,
            disabled: v || u.archived,
            mutate: T
          }, ne?.id ?? L.id)
        ]
      }, L.id);
    }),
    de.length > _ && /* @__PURE__ */ (0, n.jsx)("button", {
      className: "btn",
      onClick: () => E(_ + 20),
      children: "再顯示 20 列"
    }),
    /* @__PURE__ */ (0, n.jsxs)("details", {
      className: "production-import",
      children: [
        /* @__PURE__ */ (0, n.jsx)("summary", { children: "補入鏡頭製作關聯" }),
        /* @__PURE__ */ (0, n.jsx)("p", { children: "貼上包含 bundleId 與 links 清單的 JSON；所有鏡頭與資料識別鍵必須已存在。保留歷次關聯。" }),
        /* @__PURE__ */ (0, n.jsxs)("label", { children: ["鏡頭關聯 JSON", /* @__PURE__ */ (0, n.jsx)("textarea", {
          rows: 5,
          value: j,
          onChange: (L) => {
            Y(L.target.value), q("");
          }
        })] }),
        k && /* @__PURE__ */ (0, n.jsx)("p", {
          role: "alert",
          children: k
        }),
        /* @__PURE__ */ (0, n.jsx)("button", {
          className: "btn primary",
          disabled: v || u.archived || !j.trim(),
          onClick: async () => {
            try {
              await T("save_production_links", JSON.parse(j)) && Y("");
            } catch (L) {
              q(L instanceof Error ? L.message : "格式錯誤");
            }
          },
          children: "保存鏡頭製作關聯"
        })
      ]
    })
  ] });
}
var Pn = {
  reference: "來源候選",
  adopted: "本集採用",
  withdrawn: "停止沿用",
  unresolved: "版本待補登"
}, tp = {
  script: "劇本",
  character: "角色",
  scene: "場景",
  voice: "聲線",
  op_audio: "OP音軌",
  ed_audio: "ED音軌",
  edit: "剪輯工程"
}, bs = (u) => u.split(/[,，\n]/).map((v) => v.trim()).filter(Boolean), lp = {
  key: "",
  title: "",
  content: "",
  source: "",
  note: "",
  stageIdsText: "",
  sceneIdsText: "",
  status: "reference",
  baseVersion: 0
}, ap = {
  key: "",
  title: "",
  category: "script",
  recordKey: "",
  recordVersion: 1,
  content: "",
  externalVersion: "",
  source: "",
  location: "",
  note: "",
  stageIdsText: "",
  sceneIdsText: "",
  status: "reference",
  baseVersion: 0
};
function mp({ project: u, busy: v, mutate: T }) {
  const [r, d] = (0, M.useState)(!1), [j, Y] = (0, M.useState)(!1), [k, q] = (0, M.useState)(lp), [_, E] = (0, M.useState)(ap), [Z, H] = (0, M.useState)(""), [ae, de] = (0, M.useState)(""), [L, I] = (0, M.useState)(""), ne = Nm(u), K = v || u.archived, ce = Kl(u.episodeRules ?? []), B = Kl(u.baselines ?? []), P = (b) => !Z || [b.key, b.title].join(" ").toLowerCase().includes(Z.toLowerCase());
  function W(b) {
    q({
      ...b,
      stageIdsText: b.stageIds.join(", "),
      sceneIdsText: b.sceneIds.join(", "),
      baseVersion: nn(u.episodeRules ?? []).find((te) => te.key === b.key).version
    }), d(!0);
  }
  function pe(b) {
    E({
      ...b,
      recordKey: b.snapshot?.key ?? "",
      recordVersion: b.recordVersion ?? 1,
      content: b.snapshot?.content ?? "",
      stageIdsText: b.stageIds.join(", "),
      sceneIdsText: b.sceneIds.join(", "),
      baseVersion: nn(u.baselines ?? []).find((te) => te.key === b.key).version
    }), Y(!0);
  }
  async function ie(b, te) {
    await T("save_episode_rule", {
      ...b,
      status: te,
      baseVersion: ne.rules.find((be) => be.key === b.key).version
    });
  }
  async function J(b, te) {
    await T("register_episode_baseline", {
      ...b,
      status: te,
      recordKey: b.snapshot?.key ?? "",
      recordVersion: b.recordVersion,
      content: b.snapshot?.content ?? "",
      baseVersion: ne.baselines.find((be) => be.key === b.key).version
    });
  }
  return /* @__PURE__ */ (0, n.jsxs)("section", {
    className: "episode-settings",
    children: [
      /* @__PURE__ */ (0, n.jsxs)("div", {
        className: "wide-card",
        children: [
          /* @__PURE__ */ (0, n.jsx)("div", {
            className: "eyebrow",
            children: "EPISODE RULES & BASELINES"
          }),
          /* @__PURE__ */ (0, n.jsxs)("h2", { children: [u.episode, " 規則與採用版本"] }),
          /* @__PURE__ */ (0, n.jsx)("p", { children: "通用流程保存製作方法；本集規則保存劇情與素材限制。採用清單指定來源版本，下一集另行選用。" }),
          /* @__PURE__ */ (0, n.jsxs)("div", {
            className: "production-totals",
            children: [
              /* @__PURE__ */ (0, n.jsxs)("b", { children: [ce.length, " 項本集規則已採用"] }),
              /* @__PURE__ */ (0, n.jsxs)("b", { children: [B.length, " 項來源已採用"] }),
              /* @__PURE__ */ (0, n.jsxs)("span", { children: [ne.baselines.filter((b) => b.status === "unresolved").length, " 項版本待補登"] })
            ]
          }),
          /* @__PURE__ */ (0, n.jsx)("p", {
            className: "inline-note",
            children: "候選新版本保留原採用版。採用紀錄、來源收錄與素材實際檢視分開保存。"
          }),
          /* @__PURE__ */ (0, n.jsxs)("label", {
            className: "work-search",
            children: ["搜尋規則與採用項目", /* @__PURE__ */ (0, n.jsx)("input", {
              value: Z,
              onChange: (b) => H(b.target.value),
              placeholder: "規則、角色、劇本、聲線或音軌"
            })]
          }),
          /* @__PURE__ */ (0, n.jsxs)("details", { children: [/* @__PURE__ */ (0, n.jsx)("summary", { children: "通用流程檢查項目" }), ne.genericChecks.map((b) => /* @__PURE__ */ (0, n.jsxs)("div", {
            className: "context-mini",
            children: [/* @__PURE__ */ (0, n.jsxs)("b", { children: [
              b.id,
              " ",
              b.title
            ] }), /* @__PURE__ */ (0, n.jsx)("ul", { children: b.checks.map((te) => /* @__PURE__ */ (0, n.jsx)("li", { children: te }, te)) })]
          }, b.id))] }),
          u.workflowLegacy && /* @__PURE__ */ (0, n.jsxs)("details", { children: [
            /* @__PURE__ */ (0, n.jsx)("summary", { children: "保留的舊版檢查表紀錄" }),
            /* @__PURE__ */ (0, n.jsx)("p", { children: "舊版單集條件及勾選狀態保留在此；本集實際適用的規則另列於下方。" }),
            u.workflowLegacy.stages.map((b) => /* @__PURE__ */ (0, n.jsxs)("div", {
              className: "context-mini",
              children: [/* @__PURE__ */ (0, n.jsxs)("b", { children: ["舊階段 ", b.stageId] }), b.labels.map((te, be) => /* @__PURE__ */ (0, n.jsxs)("p", { children: [
                b.checks[be] ? "已勾選" : "未勾選",
                " · ",
                te
              ] }, be))]
            }, b.stageId))
          ] })
        ]
      }),
      /* @__PURE__ */ (0, n.jsxs)("div", {
        className: "wide-card",
        children: [
          /* @__PURE__ */ (0, n.jsxs)("div", {
            className: "section-title",
            children: [/* @__PURE__ */ (0, n.jsxs)("div", { children: [/* @__PURE__ */ (0, n.jsx)("h2", { children: "本集專用規則" }), /* @__PURE__ */ (0, n.jsx)("p", { children: "具體內容、來源、適用階段與場次，按版本保存。" })] }), /* @__PURE__ */ (0, n.jsx)("button", {
              className: "btn",
              disabled: K,
              onClick: () => {
                q(lp), d(!r);
              },
              children: "新增本集規則"
            })]
          }),
          r && /* @__PURE__ */ (0, n.jsxs)("form", {
            className: "context-form",
            onSubmit: async (b) => {
              b.preventDefault(), await T("save_episode_rule", {
                ...k,
                stageIds: bs(k.stageIdsText),
                sceneIds: bs(k.sceneIdsText)
              }) && d(!1);
            },
            children: [
              /* @__PURE__ */ (0, n.jsxs)("div", {
                className: "context-form-grid",
                children: [/* @__PURE__ */ (0, n.jsxs)("label", { children: ["規則識別鍵", /* @__PURE__ */ (0, n.jsx)("input", {
                  required: !0,
                  readOnly: !!k.baseVersion,
                  maxLength: 100,
                  value: k.key,
                  onChange: (b) => q({
                    ...k,
                    key: b.target.value
                  })
                })] }), /* @__PURE__ */ (0, n.jsxs)("label", { children: ["規則名稱", /* @__PURE__ */ (0, n.jsx)("input", {
                  required: !0,
                  maxLength: 200,
                  value: k.title,
                  onChange: (b) => q({
                    ...k,
                    title: b.target.value
                  })
                })] })]
              }),
              /* @__PURE__ */ (0, n.jsxs)("label", { children: ["規則內容", /* @__PURE__ */ (0, n.jsx)("textarea", {
                required: !0,
                rows: 4,
                maxLength: 6e3,
                value: k.content,
                onChange: (b) => q({
                  ...k,
                  content: b.target.value
                })
              })] }),
              /* @__PURE__ */ (0, n.jsxs)("label", { children: ["規則來源", /* @__PURE__ */ (0, n.jsx)("input", {
                required: !0,
                maxLength: 2e3,
                value: k.source,
                onChange: (b) => q({
                  ...k,
                  source: b.target.value
                })
              })] }),
              /* @__PURE__ */ (0, n.jsxs)("div", {
                className: "context-form-grid",
                children: [/* @__PURE__ */ (0, n.jsxs)("label", { children: ["規則適用階段", /* @__PURE__ */ (0, n.jsx)("input", {
                  value: k.stageIdsText,
                  placeholder: "逗號分隔；留空為本集共用",
                  onChange: (b) => q({
                    ...k,
                    stageIdsText: b.target.value
                  })
                })] }), /* @__PURE__ */ (0, n.jsxs)("label", { children: ["規則適用場次", /* @__PURE__ */ (0, n.jsx)("input", {
                  value: k.sceneIdsText,
                  placeholder: "逗號分隔；留空為全部場次",
                  onChange: (b) => q({
                    ...k,
                    sceneIdsText: b.target.value
                  })
                })] })]
              }),
              /* @__PURE__ */ (0, n.jsxs)("label", { children: ["規則狀態", /* @__PURE__ */ (0, n.jsx)("select", {
                value: k.status,
                onChange: (b) => q({
                  ...k,
                  status: b.target.value
                }),
                children: Object.entries(Pn).map(([b, te]) => /* @__PURE__ */ (0, n.jsx)("option", {
                  value: b,
                  children: te
                }, b))
              })] }),
              /* @__PURE__ */ (0, n.jsxs)("label", { children: ["規則備註", /* @__PURE__ */ (0, n.jsx)("textarea", {
                rows: 2,
                value: k.note,
                onChange: (b) => q({
                  ...k,
                  note: b.target.value
                })
              })] }),
              /* @__PURE__ */ (0, n.jsx)("button", {
                className: "btn primary",
                disabled: K,
                children: "保存本集規則版本"
              })
            ]
          }),
          ne.rules.filter(P).map((b) => {
            const te = ce.find((be) => be.key === b.key);
            return /* @__PURE__ */ (0, n.jsxs)("details", {
              className: "production-record",
              children: [
                /* @__PURE__ */ (0, n.jsxs)("summary", { children: [/* @__PURE__ */ (0, n.jsx)("b", { children: b.title }), /* @__PURE__ */ (0, n.jsxs)("span", { children: [
                  Pn[b.status],
                  " · v",
                  b.version
                ] })] }),
                /* @__PURE__ */ (0, n.jsx)("code", { children: b.key }),
                /* @__PURE__ */ (0, n.jsx)("p", {
                  className: "production-source-text",
                  children: b.content
                }),
                /* @__PURE__ */ (0, n.jsxs)("p", { children: ["來源：", b.source] }),
                /* @__PURE__ */ (0, n.jsxs)("p", { children: [
                  "階段：",
                  b.stageIds.join("、") || "本集共用",
                  " · 場次：",
                  b.sceneIds.join("、") || "全部場次"
                ] }),
                /* @__PURE__ */ (0, n.jsx)("p", { children: b.note }),
                te && te.id !== b.id && /* @__PURE__ */ (0, n.jsxs)("div", {
                  className: "context-mini",
                  children: [
                    /* @__PURE__ */ (0, n.jsxs)("b", { children: ["仍沿用已採用 v", te.version] }),
                    /* @__PURE__ */ (0, n.jsx)("p", { children: te.content }),
                    /* @__PURE__ */ (0, n.jsxs)("small", { children: ["來源：", te.source] })
                  ]
                }),
                /* @__PURE__ */ (0, n.jsxs)("div", {
                  className: "context-actions",
                  children: [
                    /* @__PURE__ */ (0, n.jsx)("button", {
                      className: "btn",
                      disabled: K,
                      onClick: () => W(b),
                      children: "編輯規則新版本"
                    }),
                    b.status === "reference" && /* @__PURE__ */ (0, n.jsx)("button", {
                      className: "btn primary",
                      disabled: K,
                      onClick: () => {
                        ie(b, "adopted");
                      },
                      children: "採用此規則"
                    }),
                    te && /* @__PURE__ */ (0, n.jsx)("button", {
                      className: "btn",
                      disabled: K,
                      onClick: () => {
                        ie(te, "withdrawn");
                      },
                      children: "停止沿用規則"
                    })
                  ]
                })
              ]
            }, b.id);
          }),
          !ne.rules.length && /* @__PURE__ */ (0, n.jsx)("p", { children: "本集尚未登記專用規則；不自動繼承前一集條件。" })
        ]
      }),
      /* @__PURE__ */ (0, n.jsxs)("div", {
        className: "wide-card",
        children: [
          /* @__PURE__ */ (0, n.jsxs)("div", {
            className: "section-title",
            children: [/* @__PURE__ */ (0, n.jsxs)("div", { children: [/* @__PURE__ */ (0, n.jsx)("h2", { children: "本集採用版本清單" }), /* @__PURE__ */ (0, n.jsx)("p", { children: "依角色、場景或音軌使用固定識別鍵；指定來源全文的確切版本，或登記外部來源。" })] }), /* @__PURE__ */ (0, n.jsx)("button", {
              className: "btn",
              disabled: K,
              onClick: () => {
                E(ap), Y(!j);
              },
              children: "新增採用項目"
            })]
          }),
          j && /* @__PURE__ */ (0, n.jsxs)("form", {
            className: "context-form",
            onSubmit: async (b) => {
              b.preventDefault(), await T("register_episode_baseline", {
                ..._,
                stageIds: bs(_.stageIdsText),
                sceneIds: bs(_.sceneIdsText)
              }) && Y(!1);
            },
            children: [
              /* @__PURE__ */ (0, n.jsxs)("div", {
                className: "context-form-grid",
                children: [
                  /* @__PURE__ */ (0, n.jsxs)("label", { children: ["採用項目識別鍵", /* @__PURE__ */ (0, n.jsx)("input", {
                    required: !0,
                    readOnly: !!_.baseVersion,
                    maxLength: 100,
                    value: _.key,
                    onChange: (b) => E({
                      ..._,
                      key: b.target.value
                    })
                  })] }),
                  /* @__PURE__ */ (0, n.jsxs)("label", { children: ["採用項目名稱", /* @__PURE__ */ (0, n.jsx)("input", {
                    required: !0,
                    maxLength: 200,
                    value: _.title,
                    onChange: (b) => E({
                      ..._,
                      title: b.target.value
                    })
                  })] }),
                  /* @__PURE__ */ (0, n.jsxs)("label", { children: ["採用種類", /* @__PURE__ */ (0, n.jsx)("select", {
                    value: _.category,
                    onChange: (b) => E({
                      ..._,
                      category: b.target.value
                    }),
                    children: zm.map((b) => /* @__PURE__ */ (0, n.jsx)("option", {
                      value: b,
                      children: tp[b]
                    }, b))
                  })] }),
                  /* @__PURE__ */ (0, n.jsxs)("label", { children: ["採用項目狀態", /* @__PURE__ */ (0, n.jsx)("select", {
                    value: _.status,
                    onChange: (b) => E({
                      ..._,
                      status: b.target.value
                    }),
                    children: Object.entries(Pn).map(([b, te]) => /* @__PURE__ */ (0, n.jsx)("option", {
                      value: b,
                      children: te
                    }, b))
                  })] }),
                  /* @__PURE__ */ (0, n.jsxs)("label", { children: ["已有來源識別鍵", /* @__PURE__ */ (0, n.jsx)("input", {
                    value: _.recordKey,
                    maxLength: 120,
                    onChange: (b) => E({
                      ..._,
                      recordKey: b.target.value
                    }),
                    placeholder: "從製作資料取得；外部來源可留空"
                  })] }),
                  /* @__PURE__ */ (0, n.jsxs)("label", { children: ["來源紀錄版本", /* @__PURE__ */ (0, n.jsx)("input", {
                    type: "number",
                    min: 1,
                    value: _.recordVersion,
                    onChange: (b) => E({
                      ..._,
                      recordVersion: Number(b.target.value)
                    })
                  })] })
                ]
              }),
              !_.recordKey && /* @__PURE__ */ (0, n.jsxs)("label", { children: ["外部來源內容", /* @__PURE__ */ (0, n.jsx)("textarea", {
                rows: 4,
                required: _.status === "reference" || _.status === "adopted",
                value: _.content,
                maxLength: 12e3,
                onChange: (b) => E({
                  ..._,
                  content: b.target.value
                })
              })] }),
              /* @__PURE__ */ (0, n.jsxs)("label", { children: ["採用依據來源", /* @__PURE__ */ (0, n.jsx)("input", {
                required: !0,
                maxLength: 2e3,
                value: _.source,
                onChange: (b) => E({
                  ..._,
                  source: b.target.value
                })
              })] }),
              /* @__PURE__ */ (0, n.jsxs)("div", {
                className: "context-form-grid",
                children: [
                  /* @__PURE__ */ (0, n.jsxs)("label", { children: ["外部檔案版本", /* @__PURE__ */ (0, n.jsx)("input", {
                    value: _.externalVersion,
                    maxLength: 200,
                    onChange: (b) => E({
                      ..._,
                      externalVersion: b.target.value
                    })
                  })] }),
                  /* @__PURE__ */ (0, n.jsxs)("label", { children: ["來源檔案位置", /* @__PURE__ */ (0, n.jsx)("input", {
                    value: _.location,
                    maxLength: 2e3,
                    onChange: (b) => E({
                      ..._,
                      location: b.target.value
                    })
                  })] }),
                  /* @__PURE__ */ (0, n.jsxs)("label", { children: ["採用適用階段", /* @__PURE__ */ (0, n.jsx)("input", {
                    value: _.stageIdsText,
                    placeholder: "OP／ED自動限制於各自支線",
                    onChange: (b) => E({
                      ..._,
                      stageIdsText: b.target.value
                    })
                  })] }),
                  /* @__PURE__ */ (0, n.jsxs)("label", { children: ["採用適用場次", /* @__PURE__ */ (0, n.jsx)("input", {
                    value: _.sceneIdsText,
                    onChange: (b) => E({
                      ..._,
                      sceneIdsText: b.target.value
                    })
                  })] })
                ]
              }),
              /* @__PURE__ */ (0, n.jsxs)("label", { children: ["選用原因或待補說明", /* @__PURE__ */ (0, n.jsx)("textarea", {
                required: _.status === "unresolved",
                rows: 3,
                maxLength: 3e3,
                value: _.note,
                onChange: (b) => E({
                  ..._,
                  note: b.target.value
                })
              })] }),
              /* @__PURE__ */ (0, n.jsx)("button", {
                className: "btn primary",
                disabled: K,
                children: "保存採用項目版本"
              })
            ]
          }),
          ne.baselines.filter(P).map((b) => {
            const te = B.find((be) => be.key === b.key);
            return /* @__PURE__ */ (0, n.jsxs)("details", {
              className: "production-record",
              children: [
                /* @__PURE__ */ (0, n.jsxs)("summary", { children: [/* @__PURE__ */ (0, n.jsxs)("b", { children: [
                  tp[b.category],
                  "｜",
                  b.title
                ] }), /* @__PURE__ */ (0, n.jsxs)("span", { children: [
                  Pn[b.status],
                  " · v",
                  b.version
                ] })] }),
                /* @__PURE__ */ (0, n.jsx)("code", { children: b.key }),
                /* @__PURE__ */ (0, n.jsx)("p", { children: b.note }),
                /* @__PURE__ */ (0, n.jsxs)("p", { children: ["來源：", b.source] }),
                /* @__PURE__ */ (0, n.jsxs)("p", { children: [
                  "來源版本：",
                  b.snapshot ? `${b.snapshot.key} · v${b.recordVersion}` : "尚未指定",
                  b.externalVersion ? " · " + b.externalVersion : ""
                ] }),
                /* @__PURE__ */ (0, n.jsxs)("p", { children: ["檔案位置：", b.location || "待補登可讀取位置"] }),
                /* @__PURE__ */ (0, n.jsxs)("p", { children: [
                  "階段：",
                  b.stageIds.join("、") || "本集共用",
                  " · 場次：",
                  b.sceneIds.join("、") || "全部場次"
                ] }),
                b.snapshot && /* @__PURE__ */ (0, n.jsxs)("details", { children: [/* @__PURE__ */ (0, n.jsx)("summary", { children: "查看此來源版本全文" }), /* @__PURE__ */ (0, n.jsx)("p", {
                  className: "production-source-text",
                  children: b.snapshot.content
                })] }),
                te && te.id !== b.id && /* @__PURE__ */ (0, n.jsxs)("div", {
                  className: "context-mini",
                  children: [/* @__PURE__ */ (0, n.jsxs)("b", { children: [
                    "仍沿用已採用 v",
                    te.version,
                    "：",
                    te.title
                  ] }), /* @__PURE__ */ (0, n.jsxs)("p", { children: [
                    te.externalVersion || te.snapshot?.key,
                    " · ",
                    te.source
                  ] })]
                }),
                /* @__PURE__ */ (0, n.jsxs)("div", {
                  className: "context-actions",
                  children: [
                    /* @__PURE__ */ (0, n.jsx)("button", {
                      className: "btn",
                      disabled: K,
                      onClick: () => pe(b),
                      children: "編輯採用項目新版本"
                    }),
                    b.status === "reference" && b.snapshot && /* @__PURE__ */ (0, n.jsx)("button", {
                      className: "btn primary",
                      disabled: K,
                      onClick: () => {
                        J(b, "adopted");
                      },
                      children: "採用此來源版本"
                    }),
                    te && /* @__PURE__ */ (0, n.jsx)("button", {
                      className: "btn",
                      disabled: K,
                      onClick: () => {
                        J(te, "withdrawn");
                      },
                      children: "停止沿用此項目"
                    })
                  ]
                })
              ]
            }, b.id);
          }),
          !ne.baselines.length && /* @__PURE__ */ (0, n.jsx)("p", { children: "尚未指定本集採用版本。共用來源可按需連結後再選用。" }),
          /* @__PURE__ */ (0, n.jsxs)("details", {
            className: "production-import",
            children: [
              /* @__PURE__ */ (0, n.jsx)("summary", { children: "批次補登本集設定" }),
              /* @__PURE__ */ (0, n.jsx)("p", { children: "包含 rules 與 baselines 清單；保留版本及來源，採用與候選分開。" }),
              /* @__PURE__ */ (0, n.jsxs)("label", { children: ["本集設定 JSON", /* @__PURE__ */ (0, n.jsx)("textarea", {
                rows: 5,
                value: ae,
                onChange: (b) => {
                  de(b.target.value), I("");
                }
              })] }),
              L && /* @__PURE__ */ (0, n.jsx)("p", {
                role: "alert",
                children: L
              }),
              /* @__PURE__ */ (0, n.jsx)("button", {
                className: "btn primary",
                disabled: K || !ae.trim(),
                onClick: async () => {
                  try {
                    await T("import_episode_settings", JSON.parse(ae)) && de("");
                  } catch (b) {
                    I(b instanceof Error ? b.message : "格式錯誤");
                  }
                },
                children: "保存本集設定清單"
              })
            ]
          }),
          /* @__PURE__ */ (0, n.jsxs)("details", { children: [/* @__PURE__ */ (0, n.jsx)("summary", { children: "設定歷史版本" }), [...u.episodeRules ?? [], ...u.baselines ?? []].map((b) => /* @__PURE__ */ (0, n.jsxs)("p", { children: [
            b.key,
            " v",
            b.version,
            " · ",
            Pn[b.status],
            " · ",
            b.at,
            " · ",
            b.by
          ] }, b.id))] })
        ]
      })
    ]
  });
}
var Lu = {
  rule: "規則／決策",
  script: "劇本",
  character: "角色",
  scene: "場景",
  audio: "聲音／音軌",
  reference: "原作／參考素材"
}, np = {
  original: "原文明示",
  adaptation: "動畫改編",
  author_decision: "作者決定",
  ai_proposal: "AI 建議"
}, $u = {
  project: "本集共用",
  stage: "指定階段",
  scene: "指定場次",
  shot: "指定鏡頭"
}, Gu = (u) => $u[u.type] + (u.target ? " · " + u.target : ""), Yu = {
  key: "",
  title: "",
  kind: "rule",
  origin: "author_decision",
  content: "",
  source: "",
  location: "",
  scopeType: "project",
  target: "",
  supersedesId: ""
};
function Rm(u, v) {
  const T = URL.createObjectURL(new Blob([JSON.stringify(v, null, 2)], { type: "application/json" })), r = document.createElement("a");
  r.href = T, r.download = u, r.click(), setTimeout(() => URL.revokeObjectURL(T), 1e3);
}
function qm({ project: u, mutate: v, busy: T }) {
  const r = ma(u), [d, j] = (0, M.useState)("materials"), [Y, k] = (0, M.useState)(!1), [q, _] = (0, M.useState)(Yu), [E, Z] = (0, M.useState)(!1), [H, ae] = (0, M.useState)({
    type: "conflict",
    scopeType: "project",
    target: "",
    description: ""
  }), [de, L] = (0, M.useState)("production"), [I, ne] = (0, M.useState)(""), [K, ce] = (0, M.useState)(""), [B, P] = (0, M.useState)(""), [W, pe] = (0, M.useState)(""), [ie, J] = (0, M.useState)(""), [b, te] = (0, M.useState)(""), [be, Te] = (0, M.useState)(""), [x, Q] = (0, M.useState)(""), [G, O] = (0, M.useState)(""), [V, ye] = (0, M.useState)(""), [Ee, $e] = (0, M.useState)(""), [m, U] = (0, M.useState)(""), [X, $] = (0, M.useState)(""), [fe, me] = (0, M.useState)({}), he = r.packs.find((h) => h.id === x) ?? r.packs.at(-1), Me = r.records.filter((h) => h.status === "effective"), xe = r.records.filter((h) => h.status === "proposed" && !ei(h)), Ze = r.problems.filter((h) => h.status === "open"), ht = [
    [
      "materials",
      "製作資料",
      r.records.length
    ],
    [
      "links",
      "製作關聯",
      new Set((u.production?.links ?? []).map((h) => h.shotId)).size
    ],
    [
      "settings",
      "本集採用",
      Kl(u.baselines ?? []).length
    ],
    [
      "baseline",
      "直接核定來源",
      Me.length
    ],
    [
      "proposals",
      "待確認提案",
      xe.length
    ],
    [
      "problems",
      "矛盾與缺件",
      Ze.length
    ],
    [
      "packet",
      "工作資料包",
      r.packs.length
    ],
    [
      "handoff",
      "工作接續",
      r.results.length
    ]
  ], ke = T || u.archived;
  async function jl(h) {
    h.preventDefault(), await v("propose_record", {
      ...q,
      scope: {
        type: q.scopeType,
        target: q.target
      }
    }) && (k(!1), _(Yu), j("proposals"));
  }
  function nt(h) {
    const F = r.records.find((_e) => _e.id === h);
    _({
      key: F.key,
      title: F.title,
      kind: F.kind,
      origin: "author_decision",
      content: F.content,
      source: "",
      location: F.location,
      scopeType: F.scope.type,
      target: F.scope.target,
      supersedesId: F.id
    }), k(!0);
  }
  function It(h) {
    return /* @__PURE__ */ (0, n.jsxs)(n.Fragment, { children: [
      /* @__PURE__ */ (0, n.jsxs)("div", {
        className: "context-pack-head",
        children: [
          /* @__PURE__ */ (0, n.jsx)("span", {
            className: "status " + (h.readiness === "ready" ? "passed" : "needs_revision"),
            children: h.readiness === "ready" ? h.purpose === "documentation" ? "可整理資料 · 保留來源差異" : "紀錄齊備 · 素材待實際讀取" : "受阻 · 先處理缺件與矛盾"
          }),
          /* @__PURE__ */ (0, n.jsx)("span", {
            className: "status " + (h.projectRevision === u.revision ? "passed" : "needs_revision"),
            children: h.projectRevision === u.revision ? "目前版本" : "已過期，需重新取得"
          }),
          /* @__PURE__ */ (0, n.jsx)("button", {
            className: "btn",
            onClick: () => Rm("AI_工作資料包_" + h.id + ".json", h),
            children: "下載資料包 JSON"
          })
        ]
      }),
      /* @__PURE__ */ (0, n.jsx)("p", {
        className: "context-task",
        children: h.task
      }),
      /* @__PURE__ */ (0, n.jsxs)("p", {
        className: "muted",
        children: [
          "範圍：",
          [
            h.episode,
            h.scope.stageId,
            h.scope.sceneId,
            h.scope.shotId
          ].filter(Boolean).join(" ／ "),
          " · 專案版本 ",
          h.projectRevision
        ]
      }),
      /* @__PURE__ */ (0, n.jsx)("code", {
        className: "context-id",
        children: h.id
      }),
      h.blockers.length > 0 && /* @__PURE__ */ (0, n.jsx)("div", {
        className: "context-blockers",
        children: h.blockers.map((F, _e) => /* @__PURE__ */ (0, n.jsx)("p", { children: F.replace(/缺少有效資料種類：(\w+)/g, (Xt, w) => "缺少有效資料種類：" + (Lu[w] || w)) }, _e))
      }),
      /* @__PURE__ */ (0, n.jsx)("h3", { children: h.purpose === "documentation" ? "本次指定來源（整理用途）" : "本次有效依據" }),
      h.records.length ? h.records.map((F) => /* @__PURE__ */ (0, n.jsxs)("article", {
        className: "context-mini",
        children: [
          /* @__PURE__ */ (0, n.jsxs)("b", { children: [
            F.title,
            " · v",
            F.version
          ] }),
          /* @__PURE__ */ (0, n.jsxs)("small", { children: [
            F.key,
            " · ",
            Gu(F.scope)
          ] }),
          /* @__PURE__ */ (0, n.jsx)("p", { children: F.content }),
          /* @__PURE__ */ (0, n.jsxs)("small", { children: ["來源：", F.source] }),
          /* @__PURE__ */ (0, n.jsxs)("small", { children: ["素材位置：", F.location || "內容已記錄；未登記外部檔案"] })
        ]
      }, F.id)) : /* @__PURE__ */ (0, n.jsx)("p", {
        className: "muted",
        children: "尚無有效資料，AI 應回報受阻。"
      }),
      /* @__PURE__ */ (0, n.jsxs)("details", { children: [/* @__PURE__ */ (0, n.jsxs)("summary", { children: [
        "禁止混用的版本／待確認提案（",
        h.excluded.length,
        "）"
      ] }), h.excluded.map((F) => /* @__PURE__ */ (0, n.jsxs)("p", { children: [
        F.title,
        " · ",
        F.status,
        " · ",
        F.id
      ] }, F.id))] }),
      /* @__PURE__ */ (0, n.jsxs)("details", { children: [/* @__PURE__ */ (0, n.jsx)("summary", { children: "完整資料契約與素材清單" }), /* @__PURE__ */ (0, n.jsx)("pre", { children: JSON.stringify({
        contract: h.contract,
        manifest: h.manifest,
        adoptedBaselines: h.adoptedBaselines,
        episodeRules: h.episodeRules,
        priorHandoff: h.priorHandoff
      }, null, 2) })] })
    ] });
  }
  return /* @__PURE__ */ (0, n.jsxs)("section", {
    className: "ai-workspace",
    children: [
      /* @__PURE__ */ (0, n.jsx)("nav", {
        className: "section-nav",
        "aria-label": "資料與交接",
        children: ht.filter(([h]) => [
          "materials",
          "links",
          "handoff",
          "problems"
        ].includes(h)).map(([h, F, _e]) => /* @__PURE__ */ (0, n.jsxs)("button", {
          className: d === h ? "active" : "",
          onClick: () => j(h),
          children: [
            {
              materials: "製作資料",
              links: "鏡頭對應",
              handoff: "工作紀錄",
              problems: "缺件與疑問"
            }[h],
            " ",
            /* @__PURE__ */ (0, n.jsx)("span", { children: _e })
          ]
        }, h))
      }),
      /* @__PURE__ */ (0, n.jsxs)("details", {
        className: "advanced-tools",
        children: [
          /* @__PURE__ */ (0, n.jsx)("summary", { children: "進階：採用設定、資料提案與 AI 工作資料包" }),
          /* @__PURE__ */ (0, n.jsx)("div", {
            className: "context-tabs",
            children: ht.filter(([h]) => ![
              "materials",
              "links",
              "handoff",
              "problems"
            ].includes(h)).map(([h, F, _e]) => /* @__PURE__ */ (0, n.jsxs)("button", {
              className: d === h ? "active" : "",
              onClick: () => j(h),
              children: [
                F,
                " · ",
                _e
              ]
            }, h))
          }),
          /* @__PURE__ */ (0, n.jsx)("p", { children: "AI 接手時會讀取指定版本；一般查資料不需要手動建立資料包。" })
        ]
      }),
      /* @__PURE__ */ (0, n.jsx)("div", {
        className: d === "settings" ? "" : "wide-card",
        children: d === "settings" ? /* @__PURE__ */ (0, n.jsx)(mp, {
          project: u,
          busy: T,
          mutate: v
        }) : d === "links" ? /* @__PURE__ */ (0, n.jsx)(Um, {
          project: u,
          busy: T,
          mutate: v
        }) : d === "materials" ? /* @__PURE__ */ (0, n.jsx)(km, {
          project: u,
          busy: T,
          mutate: v
        }) : ["baseline", "proposals"].includes(d) ? /* @__PURE__ */ (0, n.jsxs)(n.Fragment, { children: [
          /* @__PURE__ */ (0, n.jsxs)("div", {
            className: "section-title",
            children: [/* @__PURE__ */ (0, n.jsxs)("div", { children: [/* @__PURE__ */ (0, n.jsx)("h2", { children: d === "baseline" ? "目前有效資料" : "待作者確認的提案" }), /* @__PURE__ */ (0, n.jsx)("p", { children: "識別鍵固定，修改建立新版本；來源與適用範圍必填。" })] }), /* @__PURE__ */ (0, n.jsx)("button", {
              className: "btn primary",
              disabled: ke,
              onClick: () => {
                _(Yu), k(!Y);
              },
              children: "新增資料提案"
            })]
          }),
          Y && /* @__PURE__ */ (0, n.jsxs)("form", {
            className: "context-form",
            onSubmit: jl,
            children: [
              /* @__PURE__ */ (0, n.jsxs)("div", {
                className: "context-form-grid",
                children: [
                  /* @__PURE__ */ (0, n.jsxs)("label", { children: ["固定識別鍵", /* @__PURE__ */ (0, n.jsx)("input", {
                    required: !0,
                    maxLength: 120,
                    placeholder: "例如 mother_position 或 script_main",
                    value: q.key,
                    readOnly: !!q.supersedesId,
                    onChange: (h) => _({
                      ...q,
                      key: h.target.value
                    })
                  })] }),
                  /* @__PURE__ */ (0, n.jsxs)("label", { children: ["資料名稱", /* @__PURE__ */ (0, n.jsx)("input", {
                    required: !0,
                    maxLength: 200,
                    value: q.title,
                    onChange: (h) => _({
                      ...q,
                      title: h.target.value
                    })
                  })] }),
                  /* @__PURE__ */ (0, n.jsxs)("label", { children: ["資料種類", /* @__PURE__ */ (0, n.jsx)("select", {
                    value: q.kind,
                    onChange: (h) => _({
                      ...q,
                      kind: h.target.value
                    }),
                    children: wm.map((h) => /* @__PURE__ */ (0, n.jsx)("option", {
                      value: h,
                      children: Lu[h]
                    }, h))
                  })] }),
                  /* @__PURE__ */ (0, n.jsxs)("label", { children: ["內容性質", /* @__PURE__ */ (0, n.jsx)("select", {
                    value: q.origin,
                    onChange: (h) => _({
                      ...q,
                      origin: h.target.value
                    }),
                    children: Object.entries(np).map(([h, F]) => /* @__PURE__ */ (0, n.jsx)("option", {
                      value: h,
                      children: F
                    }, h))
                  })] }),
                  /* @__PURE__ */ (0, n.jsxs)("label", { children: ["適用範圍", /* @__PURE__ */ (0, n.jsx)("select", {
                    value: q.scopeType,
                    disabled: !!q.supersedesId,
                    onChange: (h) => _({
                      ...q,
                      scopeType: h.target.value,
                      target: ""
                    }),
                    children: Object.entries($u).map(([h, F]) => /* @__PURE__ */ (0, n.jsx)("option", {
                      value: h,
                      children: F
                    }, h))
                  })] }),
                  /* @__PURE__ */ (0, n.jsxs)("label", { children: ["範圍 ID", /* @__PURE__ */ (0, n.jsx)("input", {
                    required: q.scopeType !== "project",
                    disabled: q.scopeType === "project" || !!q.supersedesId,
                    placeholder: "例如 S06、01 或鏡頭 ID",
                    value: q.target,
                    onChange: (h) => _({
                      ...q,
                      target: h.target.value
                    })
                  })] })
                ]
              }),
              /* @__PURE__ */ (0, n.jsxs)("label", { children: ["內容", /* @__PURE__ */ (0, n.jsx)("textarea", {
                required: !0,
                rows: 5,
                maxLength: 12e3,
                value: q.content,
                onChange: (h) => _({
                  ...q,
                  content: h.target.value
                })
              })] }),
              /* @__PURE__ */ (0, n.jsxs)("label", { children: ["來源依據", /* @__PURE__ */ (0, n.jsx)("input", {
                required: !0,
                maxLength: 2e3,
                placeholder: "原作章節、作者修改要求、檔案名稱與段落等",
                value: q.source,
                onChange: (h) => _({
                  ...q,
                  source: h.target.value
                })
              })] }),
              /* @__PURE__ */ (0, n.jsxs)("label", { children: ["素材位置（選填）", /* @__PURE__ */ (0, n.jsx)("input", {
                maxLength: 2e3,
                placeholder: "可取得的檔案位置或連結；填入不等於已讀取",
                value: q.location,
                onChange: (h) => _({
                  ...q,
                  location: h.target.value
                })
              })] }),
              q.supersedesId && /* @__PURE__ */ (0, n.jsxs)("p", {
                className: "muted",
                children: [
                  "明確取代：",
                  q.supersedesId,
                  "。作者確認前，舊版仍然有效。"
                ]
              }),
              /* @__PURE__ */ (0, n.jsxs)("div", {
                className: "context-actions",
                children: [/* @__PURE__ */ (0, n.jsx)("button", {
                  className: "btn",
                  type: "button",
                  onClick: () => k(!1),
                  children: "取消"
                }), /* @__PURE__ */ (0, n.jsx)("button", {
                  className: "btn primary",
                  disabled: ke,
                  children: "保存為待確認提案"
                })]
              })
            ]
          }),
          /* @__PURE__ */ (0, n.jsx)("div", {
            className: "context-records",
            children: (d === "baseline" ? Me : xe).map((h) => /* @__PURE__ */ (0, n.jsxs)("article", {
              className: "context-record",
              children: [
                /* @__PURE__ */ (0, n.jsxs)("div", {
                  className: "issue-top",
                  children: [/* @__PURE__ */ (0, n.jsx)("span", {
                    className: "status " + (h.status === "effective" ? "passed" : "candidate"),
                    children: h.status === "effective" ? "作者已確認" : "待確認"
                  }), /* @__PURE__ */ (0, n.jsxs)("b", { children: [
                    h.title,
                    " · v",
                    h.version
                  ] })]
                }),
                /* @__PURE__ */ (0, n.jsxs)("small", { children: [
                  Lu[h.kind],
                  " ／ ",
                  np[h.origin],
                  " ／ ",
                  Gu(h.scope)
                ] }),
                /* @__PURE__ */ (0, n.jsxs)("code", {
                  className: "context-id",
                  children: [
                    h.key,
                    " · ",
                    h.id
                  ]
                }),
                /* @__PURE__ */ (0, n.jsx)("p", { children: h.content }),
                /* @__PURE__ */ (0, n.jsxs)("div", {
                  className: "context-source",
                  children: [
                    "來源：",
                    h.source,
                    h.location && /* @__PURE__ */ (0, n.jsxs)("p", { children: ["素材位置：", h.location] })
                  ]
                }),
                h.supersedesId && /* @__PURE__ */ (0, n.jsxs)("small", { children: ["取代目標：", h.supersedesId] }),
                h.approval && /* @__PURE__ */ (0, n.jsxs)("small", { children: ["確認者：", h.approval.by] }),
                /* @__PURE__ */ (0, n.jsx)("div", {
                  className: "context-actions",
                  children: h.status === "proposed" ? /* @__PURE__ */ (0, n.jsx)("button", {
                    className: "btn primary",
                    disabled: ke,
                    onClick: () => {
                      v("activate_record", { recordId: h.id });
                    },
                    children: "作者確認為有效資料"
                  }) : /* @__PURE__ */ (0, n.jsx)("button", {
                    className: "btn",
                    disabled: ke,
                    onClick: () => nt(h.id),
                    children: "提出修改版本"
                  })
                })
              ]
            }, h.id))
          }),
          !(d === "baseline" ? Me : xe).length && !Y && /* @__PURE__ */ (0, n.jsxs)("div", {
            className: "empty",
            children: [/* @__PURE__ */ (0, n.jsx)("h3", { children: d === "baseline" ? "尚無有效資料" : "目前沒有待確認提案" }), /* @__PURE__ */ (0, n.jsx)("p", { children: "先登記來源、內容與範圍，再由作者確認。" })]
          }),
          /* @__PURE__ */ (0, n.jsxs)("details", { children: [/* @__PURE__ */ (0, n.jsxs)("summary", { children: [
            "已被取代的歷史版本（",
            r.records.filter((h) => h.status === "superseded").length,
            "）"
          ] }), r.records.filter((h) => h.status === "superseded").map((h) => /* @__PURE__ */ (0, n.jsxs)("article", {
            className: "context-mini",
            children: [
              /* @__PURE__ */ (0, n.jsxs)("b", { children: [
                h.title,
                " v",
                h.version,
                " · 已停用"
              ] }),
              /* @__PURE__ */ (0, n.jsx)("p", { children: h.content }),
              /* @__PURE__ */ (0, n.jsxs)("small", { children: [
                h.id,
                " → ",
                h.supersededBy
              ] })
            ]
          }, h.id))] })
        ] }) : d === "problems" ? /* @__PURE__ */ (0, n.jsxs)(n.Fragment, { children: [
          /* @__PURE__ */ (0, n.jsxs)("div", {
            className: "section-title",
            children: [/* @__PURE__ */ (0, n.jsxs)("div", { children: [/* @__PURE__ */ (0, n.jsx)("h2", { children: "矛盾、缺件與待裁定事項" }), /* @__PURE__ */ (0, n.jsx)("p", { children: "相關任務在問題處理前回報受阻，AI 不自行裁定。" })] }), /* @__PURE__ */ (0, n.jsx)("button", {
              className: "btn",
              disabled: ke,
              onClick: () => Z(!E),
              children: "登記矛盾或缺件"
            })]
          }),
          E && /* @__PURE__ */ (0, n.jsxs)("form", {
            className: "context-form",
            onSubmit: async (h) => {
              h.preventDefault(), await v("add_knowledge_problem", {
                type: H.type,
                scope: {
                  type: H.scopeType,
                  target: H.target
                },
                description: H.description,
                recordIds: []
              }) && (Z(!1), ae({
                ...H,
                description: ""
              }));
            },
            children: [
              /* @__PURE__ */ (0, n.jsxs)("div", {
                className: "context-form-grid",
                children: [
                  /* @__PURE__ */ (0, n.jsxs)("label", { children: ["問題種類", /* @__PURE__ */ (0, n.jsxs)("select", {
                    value: H.type,
                    onChange: (h) => ae({
                      ...H,
                      type: h.target.value
                    }),
                    children: [/* @__PURE__ */ (0, n.jsx)("option", {
                      value: "conflict",
                      children: "資訊矛盾"
                    }), /* @__PURE__ */ (0, n.jsx)("option", {
                      value: "missing",
                      children: "資料缺件"
                    })]
                  })] }),
                  /* @__PURE__ */ (0, n.jsxs)("label", { children: ["範圍", /* @__PURE__ */ (0, n.jsx)("select", {
                    value: H.scopeType,
                    onChange: (h) => ae({
                      ...H,
                      scopeType: h.target.value,
                      target: ""
                    }),
                    children: Object.entries($u).map(([h, F]) => /* @__PURE__ */ (0, n.jsx)("option", {
                      value: h,
                      children: F
                    }, h))
                  })] }),
                  /* @__PURE__ */ (0, n.jsxs)("label", { children: ["範圍 ID", /* @__PURE__ */ (0, n.jsx)("input", {
                    required: H.scopeType !== "project",
                    disabled: H.scopeType === "project",
                    value: H.target,
                    onChange: (h) => ae({
                      ...H,
                      target: h.target.value
                    })
                  })] })
                ]
              }),
              /* @__PURE__ */ (0, n.jsxs)("label", { children: ["問題與缺少的依據", /* @__PURE__ */ (0, n.jsx)("textarea", {
                required: !0,
                rows: 4,
                value: H.description,
                onChange: (h) => ae({
                  ...H,
                  description: h.target.value
                })
              })] }),
              /* @__PURE__ */ (0, n.jsx)("button", {
                className: "btn primary",
                disabled: ke,
                children: "保存待處理問題"
              })
            ]
          }),
          r.problems.map((h) => /* @__PURE__ */ (0, n.jsxs)("article", {
            className: "context-record",
            children: [
              /* @__PURE__ */ (0, n.jsxs)("div", {
                className: "issue-top",
                children: [/* @__PURE__ */ (0, n.jsxs)("span", {
                  className: "status " + (h.status === "open" ? "needs_revision" : "passed"),
                  children: [
                    h.type === "conflict" ? "資訊矛盾" : "資料缺件",
                    " · ",
                    h.status === "open" ? "待處理" : "作者已處理"
                  ]
                }), /* @__PURE__ */ (0, n.jsx)("small", { children: Gu(h.scope) })]
              }),
              /* @__PURE__ */ (0, n.jsx)("p", { children: h.description }),
              h.resolution && /* @__PURE__ */ (0, n.jsxs)("p", { children: ["處理結果：", h.resolution] }),
              h.status === "open" && (b === h.id ? /* @__PURE__ */ (0, n.jsxs)("form", {
                onSubmit: async (F) => {
                  F.preventDefault(), await v("resolve_knowledge_problem", {
                    problemId: h.id,
                    resolution: be
                  }) && (te(""), Te(""));
                },
                children: [
                  /* @__PURE__ */ (0, n.jsxs)("label", {
                    className: "form-field",
                    children: ["作者裁定／補件結果", /* @__PURE__ */ (0, n.jsx)("textarea", {
                      required: !0,
                      rows: 3,
                      value: be,
                      onChange: (F) => Te(F.target.value)
                    })]
                  }),
                  /* @__PURE__ */ (0, n.jsx)("p", {
                    className: "muted",
                    children: "若涉及設定變更，請另外確認新資料版本；問題結案不會自動修改有效資料。"
                  }),
                  /* @__PURE__ */ (0, n.jsx)("button", {
                    className: "btn primary",
                    disabled: ke,
                    children: "作者確認處理完成"
                  })
                ]
              }) : /* @__PURE__ */ (0, n.jsx)("button", {
                className: "btn",
                disabled: ke,
                onClick: () => {
                  te(h.id), Te("");
                },
                children: "填寫作者處理結果"
              }))
            ]
          }, h.id)),
          !r.problems.length && /* @__PURE__ */ (0, n.jsx)("p", {
            className: "muted",
            children: "目前沒有登記矛盾或缺件。資料包仍會檢查必要資料種類。"
          })
        ] }) : d === "packet" ? /* @__PURE__ */ (0, n.jsxs)(n.Fragment, { children: [
          /* @__PURE__ */ (0, n.jsx)("div", {
            className: "section-title",
            children: /* @__PURE__ */ (0, n.jsxs)("div", { children: [/* @__PURE__ */ (0, n.jsx)("h2", { children: "指定任務的工作資料包" }), /* @__PURE__ */ (0, n.jsx)("p", { children: "保存當下版本；任何更新後均需重新取得，避免沿用舊依據。" })] })
          }),
          /* @__PURE__ */ (0, n.jsxs)("form", {
            className: "context-form",
            onSubmit: async (h) => {
              h.preventDefault();
              const F = await v("create_context_pack", {
                task: K,
                stageId: B,
                sceneId: W,
                shotId: ie,
                purpose: de,
                recordKeys: de === "documentation" ? I.split(/[,，\n]/).map((_e) => _e.trim()).filter(Boolean) : void 0
              });
              F && Q(ma(F).packs.at(-1).id);
            },
            children: [
              /* @__PURE__ */ (0, n.jsxs)("label", { children: ["工作用途", /* @__PURE__ */ (0, n.jsxs)("select", {
                value: de,
                onChange: (h) => L(h.target.value),
                children: [/* @__PURE__ */ (0, n.jsx)("option", {
                  value: "production",
                  children: "素材製作／檢視"
                }), /* @__PURE__ */ (0, n.jsx)("option", {
                  value: "documentation",
                  children: "資料整理／補登"
                })]
              })] }),
              de === "documentation" && /* @__PURE__ */ (0, n.jsxs)("label", { children: ["本次來源識別鍵", /* @__PURE__ */ (0, n.jsx)("textarea", {
                required: !0,
                rows: 2,
                value: I,
                onChange: (h) => ne(h.target.value),
                placeholder: "以逗號分隔，最多20筆；可從製作資料或鏡頭關聯取得"
              })] }),
              /* @__PURE__ */ (0, n.jsxs)("label", { children: ["本次任務", /* @__PURE__ */ (0, n.jsx)("textarea", {
                required: !0,
                rows: 2,
                maxLength: 2e3,
                placeholder: "例如：檢查 S06 指定鏡頭的母親座位與場景一致性",
                value: K,
                onChange: (h) => ce(h.target.value)
              })] }),
              /* @__PURE__ */ (0, n.jsxs)("div", {
                className: "context-form-grid",
                children: [
                  /* @__PURE__ */ (0, n.jsxs)("label", { children: ["階段 ID（選填）", /* @__PURE__ */ (0, n.jsx)("input", {
                    placeholder: "例如 08、op01",
                    value: B,
                    onChange: (h) => P(h.target.value)
                  })] }),
                  /* @__PURE__ */ (0, n.jsxs)("label", { children: ["場次 ID（選填）", /* @__PURE__ */ (0, n.jsx)("input", {
                    placeholder: "例如 S06",
                    value: W,
                    onChange: (h) => pe(h.target.value)
                  })] }),
                  /* @__PURE__ */ (0, n.jsxs)("label", { children: ["鏡頭 ID（選填）", /* @__PURE__ */ (0, n.jsx)("input", {
                    placeholder: "素材總表的固定鏡頭 ID",
                    value: ie,
                    onChange: (h) => J(h.target.value)
                  })] })
                ]
              }),
              /* @__PURE__ */ (0, n.jsx)("button", {
                className: "btn primary",
                disabled: ke,
                children: "建立並保存資料包"
              })
            ]
          }),
          he ? /* @__PURE__ */ (0, n.jsx)("div", {
            className: "context-pack",
            children: It(he)
          }) : /* @__PURE__ */ (0, n.jsx)("p", {
            className: "muted",
            children: "尚未建立資料包。AI 可透過 acquire_animation_context 取得同一份資料。"
          }),
          he?.purpose === "documentation" && he.projectRevision === u.revision && /* @__PURE__ */ (0, n.jsxs)("details", { children: [/* @__PURE__ */ (0, n.jsx)("summary", { children: "回報本次資料整理結果" }), /* @__PURE__ */ (0, n.jsxs)("form", {
            className: "context-form",
            onSubmit: async (h) => {
              h.preventDefault(), await v("submit_ai_work", {
                contextPackId: he.id,
                resultId: crypto.randomUUID(),
                status: "completed",
                summary: G,
                nextStep: V,
                recordIds: he.records.map((F) => F.id),
                observations: he.records.map((F) => ({
                  recordId: F.id,
                  version: F.version,
                  note: fe[F.id] ?? ""
                })),
                artifacts: [{
                  location: Ee,
                  version: m,
                  description: X
                }]
              });
            },
            children: [
              /* @__PURE__ */ (0, n.jsxs)("label", { children: ["本次完成內容", /* @__PURE__ */ (0, n.jsx)("textarea", {
                required: !0,
                rows: 3,
                value: G,
                onChange: (h) => O(h.target.value)
              })] }),
              /* @__PURE__ */ (0, n.jsxs)("label", { children: ["下一位 AI 接手動作", /* @__PURE__ */ (0, n.jsx)("textarea", {
                required: !0,
                rows: 3,
                value: V,
                onChange: (h) => ye(h.target.value)
              })] }),
              he.records.map((h) => /* @__PURE__ */ (0, n.jsxs)("label", { children: [
                "實際閱讀依據｜",
                h.title,
                /* @__PURE__ */ (0, n.jsx)("textarea", {
                  required: !0,
                  rows: 2,
                  maxLength: 3e3,
                  value: fe[h.id] ?? "",
                  onChange: (F) => me({
                    ...fe,
                    [h.id]: F.target.value
                  })
                })
              ] }, h.id)),
              /* @__PURE__ */ (0, n.jsxs)("label", { children: ["整理成果位置", /* @__PURE__ */ (0, n.jsx)("input", {
                required: !0,
                maxLength: 2e3,
                value: Ee,
                onChange: (h) => $e(h.target.value)
              })] }),
              /* @__PURE__ */ (0, n.jsxs)("label", { children: ["整理成果版本", /* @__PURE__ */ (0, n.jsx)("input", {
                required: !0,
                maxLength: 100,
                value: m,
                onChange: (h) => U(h.target.value)
              })] }),
              /* @__PURE__ */ (0, n.jsxs)("label", { children: ["整理成果說明", /* @__PURE__ */ (0, n.jsx)("input", {
                required: !0,
                maxLength: 2e3,
                value: X,
                onChange: (h) => $(h.target.value)
              })] }),
              /* @__PURE__ */ (0, n.jsx)("button", {
                className: "btn primary",
                disabled: ke,
                children: "保存資料整理結果"
              })
            ]
          })] }),
          r.packs.length > 1 && /* @__PURE__ */ (0, n.jsxs)("details", { children: [/* @__PURE__ */ (0, n.jsxs)("summary", { children: [
            "先前資料包（",
            r.packs.length - 1,
            "）"
          ] }), [...r.packs].reverse().map((h) => /* @__PURE__ */ (0, n.jsxs)("button", {
            className: "text-btn",
            onClick: () => Q(h.id),
            children: [
              h.task,
              " · 版本 ",
              h.projectRevision
            ]
          }, h.id))] })
        ] }) : /* @__PURE__ */ (0, n.jsxs)(n.Fragment, { children: [
          /* @__PURE__ */ (0, n.jsx)("div", {
            className: "section-title",
            children: /* @__PURE__ */ (0, n.jsxs)("div", { children: [/* @__PURE__ */ (0, n.jsx)("h2", { children: "AI 工作接續紀錄" }), /* @__PURE__ */ (0, n.jsx)("p", { children: "依資料包回寫使用版本、實際閱讀自述、成果位置與下一步。" })] })
          }),
          [...r.results].reverse().map((h) => /* @__PURE__ */ (0, n.jsxs)("article", {
            className: "context-record",
            children: [
              /* @__PURE__ */ (0, n.jsxs)("div", {
                className: "issue-top",
                children: [/* @__PURE__ */ (0, n.jsx)("span", {
                  className: "status " + (h.needsReview ? "needs_revision" : h.status === "blocked" ? "todo" : "candidate"),
                  children: h.needsReview ? r.packs.find((F) => F.id === h.packId)?.purpose === "documentation" ? "採用設定已更新，接手前讀取新版本" : "依據已變更，需重驗" : h.status === "completed" ? r.packs.find((F) => F.id === h.packId)?.purpose === "documentation" ? "資料整理完成" : "AI 回報完成，待作者驗收" : h.status === "partial" ? "部分完成" : "受阻"
                }), /* @__PURE__ */ (0, n.jsx)("b", { children: h.task })]
              }),
              /* @__PURE__ */ (0, n.jsx)("p", { children: h.summary }),
              /* @__PURE__ */ (0, n.jsxs)("div", {
                className: "context-source",
                children: [/* @__PURE__ */ (0, n.jsx)("b", { children: "下一步" }), /* @__PURE__ */ (0, n.jsx)("p", { children: h.nextStep })]
              }),
              h.needsReview && /* @__PURE__ */ (0, n.jsx)("p", {
                className: "red-text",
                children: h.reviewReason
              }),
              h.artifacts.map((F, _e) => /* @__PURE__ */ (0, n.jsxs)("p", { children: [
                F.description,
                " · ",
                F.version,
                /* @__PURE__ */ (0, n.jsx)("code", {
                  className: "context-id",
                  children: F.location
                })
              ] }, _e)),
              /* @__PURE__ */ (0, n.jsxs)("details", { children: [/* @__PURE__ */ (0, n.jsx)("summary", { children: "使用版本與閱讀自述" }), /* @__PURE__ */ (0, n.jsx)("pre", { children: JSON.stringify({
                packId: h.packId,
                recordIds: h.recordIds,
                observations: h.observations
              }, null, 2) })] })
            ]
          }, h.id)),
          !r.results.length && /* @__PURE__ */ (0, n.jsxs)("div", {
            className: "empty",
            children: [/* @__PURE__ */ (0, n.jsx)("h3", { children: "等待 AI 回報工作" }), /* @__PURE__ */ (0, n.jsx)("p", { children: "工具 submit_animation_work 會保存結果與交接內容。" })]
          })
        ] })
      })
    ]
  });
}
var xp = [
  ["coverage", "原作與改編範圍"],
  ["endingState", "本集結尾狀態"],
  ["characters", "人物狀態與關係"],
  ["revealed", "已揭露資訊與邊界"],
  ["unresolved", "尚未確定的內容"],
  ["carryRules", "後續集數沿用規則"],
  ["nextSteps", "下一步與接手順序"],
  ["sources", "來源與版本說明"]
], ip = {
  title: "",
  coverage: "",
  endingState: "",
  characters: "",
  revealed: "",
  unresolved: "",
  carryRules: "",
  nextSteps: "",
  sources: ""
}, Hm = {
  completed: "作者告知已完成",
  in_progress: "作者告知製作中",
  not_started: "作者告知尚未開始"
};
function Vu({ h: u, target: v }) {
  return /* @__PURE__ */ (0, n.jsxs)("div", {
    className: "handoff-body",
    children: [
      /* @__PURE__ */ (0, n.jsxs)("h3", { children: [
        u.title,
        " · v",
        u.version
      ] }),
      /* @__PURE__ */ (0, n.jsxs)("p", {
        className: "inline-note",
        children: [
          "來源整理 → ",
          v,
          "。內容按所列版本交接；尚未對上成片的部分保留疑點，不自動變成下一集採用設定。"
        ]
      }),
      xp.map(([T, r]) => /* @__PURE__ */ (0, n.jsxs)("div", {
        className: "context-mini",
        children: [/* @__PURE__ */ (0, n.jsx)("b", { children: r }), /* @__PURE__ */ (0, n.jsx)("p", {
          className: "production-source-text",
          children: u[T]
        })]
      }, T)),
      /* @__PURE__ */ (0, n.jsxs)("details", { children: [
        /* @__PURE__ */ (0, n.jsx)("summary", { children: "來源識別鍵與版本紀錄" }),
        /* @__PURE__ */ (0, n.jsx)("p", { children: u.sourceKeys.join("、") }),
        /* @__PURE__ */ (0, n.jsxs)("small", { children: [
          u.at,
          " · ",
          u.by,
          " · ",
          u.id
        ] })
      ] })
    ]
  });
}
function Bm({ project: u, episodes: v, busy: T, mutate: r }) {
  const d = u.production?.completionReports?.at(-1), j = u.production?.handoffs?.at(-1), Y = v.filter((J) => J.workId === u.workId && J.id !== u.id), [k, q] = (0, M.useState)("completed"), [_, E] = (0, M.useState)(""), [Z, H] = (0, M.useState)(""), [ae, de] = (0, M.useState)(""), [L, I] = (0, M.useState)(ip), [ne, K] = (0, M.useState)(""), [ce, B] = (0, M.useState)([]), [P, W] = (0, M.useState)("");
  (0, M.useEffect)(() => {
    q(d?.status ?? "completed"), E(d?.note ?? ""), H(d?.source ?? ""), de(j?.toEpisodeId ?? ""), I(j ?? ip), K(j?.sourceKeys.join(", ") ?? "");
  }, [
    u.id,
    d?.at,
    j?.id
  ]), (0, M.useEffect)(() => {
    let J = !0;
    return B([]), fetch("/api/projects?id=" + encodeURIComponent(u.id) + "&view=brief", { cache: "no-store" }).then(async (b) => {
      const te = await b.json();
      if (!b.ok) throw new Error(te.error ?? "接續資料讀取失敗");
      J && (B(te.incoming), W(""));
    }).catch((b) => {
      J && W(b.message);
    }), () => {
      J = !1;
    };
  }, [u.id, u.revision]);
  const pe = Pu(u).registration, ie = T || u.archived;
  return /* @__PURE__ */ (0, n.jsxs)("section", {
    className: "wide-card episode-brief",
    children: [
      /* @__PURE__ */ (0, n.jsx)("div", {
        className: "eyebrow",
        children: "EPISODE HANDOFF"
      }),
      /* @__PURE__ */ (0, n.jsxs)("h2", { children: [u.episode, " 狀態與接續"] }),
      /* @__PURE__ */ (0, n.jsxs)("div", {
        className: "production-totals",
        children: [
          /* @__PURE__ */ (0, n.jsx)("b", { children: d ? Hm[d.status] : "製作狀態尚未登記" }),
          /* @__PURE__ */ (0, n.jsxs)("span", { children: [
            pe.acceptedSources,
            " / ",
            pe.sources,
            " 筆來源已收錄"
          ] }),
          /* @__PURE__ */ (0, n.jsxs)("span", { children: [
            pe.linkedShots,
            " / ",
            pe.shots,
            " 列鏡頭有關聯"
          ] }),
          /* @__PURE__ */ (0, n.jsxs)("span", { children: [pe.registeredSelections, " 列已登記採用檔"] })
        ]
      }),
      d && /* @__PURE__ */ (0, n.jsxs)(n.Fragment, { children: [/* @__PURE__ */ (0, n.jsx)("p", { children: d.note }), /* @__PURE__ */ (0, n.jsxs)("small", { children: ["作者告知依據：", d.source] })] }),
      /* @__PURE__ */ (0, n.jsx)("p", {
        className: "inline-note",
        children: "製作完成、資料補登及素材實際檢視各自記錄。未登記檔案位置不等於尚未製作。"
      }),
      /* @__PURE__ */ (0, n.jsxs)("details", { children: [/* @__PURE__ */ (0, n.jsx)("summary", { children: "補登本集製作狀態" }), /* @__PURE__ */ (0, n.jsxs)("form", {
        className: "context-form",
        onSubmit: async (J) => {
          J.preventDefault(), await r("report_episode_completion", {
            status: k,
            note: _,
            source: Z
          });
        },
        children: [
          /* @__PURE__ */ (0, n.jsxs)("label", { children: ["作者告知的製作狀態", /* @__PURE__ */ (0, n.jsxs)("select", {
            value: k,
            onChange: (J) => q(J.target.value),
            children: [
              /* @__PURE__ */ (0, n.jsx)("option", {
                value: "completed",
                children: "已完成"
              }),
              /* @__PURE__ */ (0, n.jsx)("option", {
                value: "in_progress",
                children: "製作中"
              }),
              /* @__PURE__ */ (0, n.jsx)("option", {
                value: "not_started",
                children: "尚未開始"
              })
            ]
          })] }),
          /* @__PURE__ */ (0, n.jsxs)("label", { children: ["作者說明", /* @__PURE__ */ (0, n.jsx)("textarea", {
            required: !0,
            rows: 3,
            maxLength: 3e3,
            value: _,
            onChange: (J) => E(J.target.value)
          })] }),
          /* @__PURE__ */ (0, n.jsxs)("label", { children: ["告知來源", /* @__PURE__ */ (0, n.jsx)("input", {
            required: !0,
            maxLength: 2e3,
            value: Z,
            onChange: (J) => H(J.target.value)
          })] }),
          /* @__PURE__ */ (0, n.jsx)("button", {
            className: "btn primary",
            disabled: ie,
            children: "保存作者告知狀態"
          })
        ]
      })] }),
      P && /* @__PURE__ */ (0, n.jsx)("p", {
        role: "alert",
        children: P
      }),
      ce.map((J) => /* @__PURE__ */ (0, n.jsxs)("details", {
        className: "production-record",
        children: [/* @__PURE__ */ (0, n.jsxs)("summary", { children: [/* @__PURE__ */ (0, n.jsxs)("b", { children: [
          "來自 ",
          J.fromEpisode,
          " 的接續資料"
        ] }), /* @__PURE__ */ (0, n.jsxs)("span", { children: [
          "v",
          J.handoff.version,
          " · 來源集數紀錄版本 ",
          J.fromRevision
        ] })] }), /* @__PURE__ */ (0, n.jsx)(Vu, {
          h: J.handoff,
          target: u.episode
        })]
      }, J.handoff.id)),
      j ? /* @__PURE__ */ (0, n.jsxs)("details", {
        className: "production-record",
        children: [/* @__PURE__ */ (0, n.jsxs)("summary", { children: [/* @__PURE__ */ (0, n.jsxs)("b", { children: ["交接至 ", v.find((J) => J.id === j.toEpisodeId)?.episode ?? "指定集數"] }), /* @__PURE__ */ (0, n.jsxs)("span", { children: ["接續資料 v", j.version] })] }), /* @__PURE__ */ (0, n.jsx)(Vu, {
          h: j,
          target: v.find((J) => J.id === j.toEpisodeId)?.episode ?? "指定集數"
        })]
      }) : /* @__PURE__ */ (0, n.jsx)("p", {
        className: "muted",
        children: "尚未保存本集對後續集數的交接資料。"
      }),
      /* @__PURE__ */ (0, n.jsxs)("details", { children: [/* @__PURE__ */ (0, n.jsx)("summary", { children: j ? "更新接續資料版本" : "補登跨集接續資料" }), Y.length ? /* @__PURE__ */ (0, n.jsxs)("form", {
        className: "context-form",
        onSubmit: async (J) => {
          J.preventDefault(), await r("save_episode_handoff", {
            ...L,
            toEpisodeId: ae || Y[0].id,
            baseVersion: j?.version ?? 0,
            sourceKeys: ne.split(/[,，\n]/).map((b) => b.trim()).filter(Boolean)
          });
        },
        children: [
          /* @__PURE__ */ (0, n.jsxs)("label", { children: ["接續目標集數", /* @__PURE__ */ (0, n.jsx)("select", {
            value: ae || Y[0].id,
            onChange: (J) => de(J.target.value),
            children: Y.map((J) => /* @__PURE__ */ (0, n.jsxs)("option", {
              value: J.id,
              children: [
                J.episode,
                " · ",
                J.title
              ]
            }, J.id))
          })] }),
          /* @__PURE__ */ (0, n.jsxs)("label", { children: ["接續資料名稱", /* @__PURE__ */ (0, n.jsx)("input", {
            required: !0,
            maxLength: 200,
            value: L.title,
            onChange: (J) => I({
              ...L,
              title: J.target.value
            })
          })] }),
          xp.map(([J, b]) => /* @__PURE__ */ (0, n.jsxs)("label", { children: [b, /* @__PURE__ */ (0, n.jsx)("textarea", {
            required: !0,
            rows: 3,
            maxLength: 6e3,
            value: L[J],
            onChange: (te) => I({
              ...L,
              [J]: te.target.value
            })
          })] }, J)),
          /* @__PURE__ */ (0, n.jsxs)("label", { children: ["來源識別鍵（逗號分隔）", /* @__PURE__ */ (0, n.jsx)("textarea", {
            rows: 2,
            value: ne,
            onChange: (J) => K(J.target.value)
          })] }),
          /* @__PURE__ */ (0, n.jsx)("button", {
            className: "btn primary",
            disabled: ie,
            children: "保存接續資料版本"
          })
        ]
      }) : /* @__PURE__ */ (0, n.jsx)("p", { children: "先在作品專案新增下一集，再建立交接。" })] }),
      (u.production?.handoffs?.length ?? 0) > 1 && /* @__PURE__ */ (0, n.jsxs)("details", { children: [/* @__PURE__ */ (0, n.jsxs)("summary", { children: [
        "先前接續版本（",
        u.production.handoffs.length - 1,
        "）"
      ] }), u.production.handoffs.slice(0, -1).map((J) => /* @__PURE__ */ (0, n.jsx)(Vu, {
        h: J,
        target: v.find((b) => b.id === J.toEpisodeId)?.episode ?? J.toEpisodeId
      }, J.id))] }),
      /* @__PURE__ */ (0, n.jsxs)("details", { children: [
        /* @__PURE__ */ (0, n.jsx)("summary", { children: "AI 接手順序與資料登記" }),
        /* @__PURE__ */ (0, n.jsxs)("ol", { children: [
          /* @__PURE__ */ (0, n.jsx)("li", { children: "讀取作品、集數及本集摘要，先辨識作者告知狀態與資料缺口。" }),
          /* @__PURE__ */ (0, n.jsx)("li", { children: "讀取前集交接、查找指定鏡頭關聯，再按識別鍵取得完整來源。" }),
          /* @__PURE__ */ (0, n.jsx)("li", { children: "整理資料時明確選取來源，使用「資料整理」工作資料包；不同版本及未定事項分開記錄。" }),
          /* @__PURE__ */ (0, n.jsx)("li", { children: "製作或改動素材時另取有效採用設定的「素材製作」資料包。" }),
          /* @__PURE__ */ (0, n.jsx)("li", { children: "回報本次讀過的來源版本、實際成果位置與下一步，讓後續 AI 能接手。" })
        ] }),
        /* @__PURE__ */ (0, n.jsx)("p", { children: "素材定位包含來源檔、候選、採用檔與剪輯工程；時間軸保留各自原點，取得工程前不自行換算。" })
      ] })
    ]
  });
}
var Xu = {
  key: "",
  title: "",
  kind: "reference",
  content: "",
  source: "",
  location: "",
  baseVersion: void 0
};
function Lm({ work: u, episode: v, episodes: T, busy: r, onWorkAction: d, onSelectEpisode: j, onPin: Y, mutate: k }) {
  const [q, _] = (0, M.useState)(v.title.split("｜")[0]), [E, Z] = (0, M.useState)(""), [H, ae] = (0, M.useState)(""), [de, L] = (0, M.useState)(""), [I, ne] = (0, M.useState)(""), [K, ce] = (0, M.useState)(""), [B, P] = (0, M.useState)(Xu), [W, pe] = (0, M.useState)(!1);
  if (!u) return /* @__PURE__ */ (0, n.jsxs)("section", {
    className: "wide-card",
    children: [
      /* @__PURE__ */ (0, n.jsx)("div", {
        className: "eyebrow",
        children: "SERIES PROJECT"
      }),
      /* @__PURE__ */ (0, n.jsx)("h2", { children: "將這集整理到作品專案" }),
      /* @__PURE__ */ (0, n.jsx)("p", { children: "現有集數保留資料、鏡頭、版本與通過狀態。作品專案集中存放原作及跨集參考，後續每集各有自己的製作流程。" }),
      /* @__PURE__ */ (0, n.jsxs)("form", {
        className: "context-form",
        onSubmit: async (x) => {
          x.preventDefault(), await d("convert_episode", {
            title: q,
            episodeId: v.id,
            episodeRevision: v.revision
          });
        },
        children: [/* @__PURE__ */ (0, n.jsxs)("label", { children: ["作品專案名稱", /* @__PURE__ */ (0, n.jsx)("input", {
          required: !0,
          maxLength: 200,
          value: q,
          onChange: (x) => _(x.target.value)
        })] }), /* @__PURE__ */ (0, n.jsx)("button", {
          className: "btn primary",
          disabled: r,
          children: "建立作品專案並保留本集"
        })]
      })
    ]
  });
  const ie = T.filter((x) => x.workId === u.id).sort((x, Q) => x.episode.localeCompare(Q.episode, void 0, { numeric: !0 })), J = Math.max(0, ...ie.map((x) => Number(x.episode.replace(/^EP/i, "")) || 0)) + 1, b = "EP" + String(J).padStart(2, "0"), te = [...new Map(u.sharedAssets.map((x) => [x.key, x])).values()], be = te.filter((x) => !de || [
    x.key,
    x.title,
    x.content,
    x.source
  ].join(" ").toLowerCase().includes(de.toLowerCase()));
  function Te(x) {
    P({
      key: x.key,
      title: x.title,
      kind: x.kind,
      content: x.content,
      source: x.source,
      location: x.location,
      baseVersion: x.version
    }), pe(!0);
  }
  return /* @__PURE__ */ (0, n.jsxs)("section", {
    className: "work-dashboard",
    children: [
      /* @__PURE__ */ (0, n.jsxs)("div", {
        className: "wide-card",
        children: [
          /* @__PURE__ */ (0, n.jsx)("div", {
            className: "eyebrow",
            children: "SERIES PROJECT"
          }),
          /* @__PURE__ */ (0, n.jsx)("h2", { children: u.title }),
          /* @__PURE__ */ (0, n.jsx)("p", { children: "作品專案 → 集數 → 場次與鏡頭。小說卷次、章次與動畫集數分別記錄。" }),
          /* @__PURE__ */ (0, n.jsxs)("div", {
            className: "production-totals",
            children: [
              /* @__PURE__ */ (0, n.jsxs)("b", { children: [ie.length, " 集"] }),
              /* @__PURE__ */ (0, n.jsxs)("b", { children: [te.length, " 項共用來源"] }),
              /* @__PURE__ */ (0, n.jsx)("span", { children: "各集保留自己的劇本、進度與採用版本。" })
            ]
          }),
          /* @__PURE__ */ (0, n.jsx)("div", {
            className: "episode-grid",
            children: ie.map((x) => /* @__PURE__ */ (0, n.jsxs)("button", {
              className: "episode-card " + (x.id === v.id ? "selected" : ""),
              disabled: r,
              onClick: () => j(x.id),
              children: [
                /* @__PURE__ */ (0, n.jsx)("small", { children: x.episode }),
                /* @__PURE__ */ (0, n.jsx)("b", { children: x.title }),
                /* @__PURE__ */ (0, n.jsxs)("span", { children: [
                  x.shots,
                  " 列鏡頭 · ",
                  x.id === v.id ? "目前集數" : "開啟本集",
                  x.completionReport?.status === "completed" ? " · 作者告知完成" : ""
                ] })
              ]
            }, x.id))
          }),
          /* @__PURE__ */ (0, n.jsxs)("details", { children: [/* @__PURE__ */ (0, n.jsx)("summary", { children: "新增後續集數" }), /* @__PURE__ */ (0, n.jsxs)("form", {
            className: "context-form",
            onSubmit: async (x) => {
              x.preventDefault(), await d("create_episode", {
                episode: E || b,
                title: H || `${E || b} 製作資料`
              }) && (Z(""), ae(""));
            },
            children: [
              /* @__PURE__ */ (0, n.jsxs)("div", {
                className: "context-form-grid",
                children: [/* @__PURE__ */ (0, n.jsxs)("label", { children: ["新集數", /* @__PURE__ */ (0, n.jsx)("input", {
                  required: !0,
                  pattern: "[Ee][Pp][0-9]{2,4}",
                  value: E || b,
                  onChange: (x) => Z(x.target.value),
                  placeholder: "EP02"
                })] }), /* @__PURE__ */ (0, n.jsxs)("label", { children: ["本集名稱", /* @__PURE__ */ (0, n.jsx)("input", {
                  maxLength: 200,
                  value: H,
                  onChange: (x) => ae(x.target.value),
                  placeholder: `${E || b} 製作資料`
                })] })]
              }),
              /* @__PURE__ */ (0, n.jsx)("p", {
                className: "muted",
                children: "建立空白流程；EP01 的劇情、鏡頭及完成狀態不會複製到下一集。"
              }),
              /* @__PURE__ */ (0, n.jsx)("button", {
                className: "btn primary",
                disabled: r,
                children: "建立新集數"
              })
            ]
          })] })
        ]
      }),
      /* @__PURE__ */ (0, n.jsx)(Bm, {
        project: v,
        episodes: T,
        busy: r,
        mutate: k
      }),
      /* @__PURE__ */ (0, n.jsxs)("div", {
        className: "wide-card",
        children: [
          /* @__PURE__ */ (0, n.jsxs)("div", {
            className: "section-title",
            children: [/* @__PURE__ */ (0, n.jsxs)("div", { children: [/* @__PURE__ */ (0, n.jsx)("h2", { children: "作品共用資料" }), /* @__PURE__ */ (0, n.jsx)("p", { children: "原作、角色、場景、世界設定及聲線參考。連結到集數時保存指定版本，之後更新共用資料仍保留各集原先使用的版本。" })] }), /* @__PURE__ */ (0, n.jsx)("button", {
              className: "btn",
              disabled: r,
              onClick: () => {
                P(Xu), pe(!W);
              },
              children: "新增共用參考"
            })]
          }),
          W && /* @__PURE__ */ (0, n.jsxs)("form", {
            className: "context-form",
            onSubmit: async (x) => {
              x.preventDefault(), await d("save_shared_asset", B) && (pe(!1), P(Xu));
            },
            children: [
              /* @__PURE__ */ (0, n.jsxs)("div", {
                className: "context-form-grid",
                children: [
                  /* @__PURE__ */ (0, n.jsxs)("label", { children: ["共用識別鍵", /* @__PURE__ */ (0, n.jsx)("input", {
                    required: !0,
                    readOnly: B.baseVersion !== void 0,
                    maxLength: 110,
                    value: B.key,
                    onChange: (x) => P({
                      ...B,
                      key: x.target.value
                    })
                  })] }),
                  /* @__PURE__ */ (0, n.jsxs)("label", { children: ["共用名稱", /* @__PURE__ */ (0, n.jsx)("input", {
                    required: !0,
                    maxLength: 200,
                    value: B.title,
                    onChange: (x) => P({
                      ...B,
                      title: x.target.value
                    })
                  })] }),
                  /* @__PURE__ */ (0, n.jsxs)("label", { children: ["資料種類", /* @__PURE__ */ (0, n.jsx)("select", {
                    value: B.kind,
                    onChange: (x) => P({
                      ...B,
                      kind: x.target.value
                    }),
                    children: [
                      ["reference", "原作／參考"],
                      ["character", "角色"],
                      ["scene", "場景"],
                      ["rule", "世界設定／規則"],
                      ["audio", "聲線／聲音"],
                      ["script", "文本"]
                    ].map(([x, Q]) => /* @__PURE__ */ (0, n.jsx)("option", {
                      value: x,
                      children: Q
                    }, x))
                  })] })
                ]
              }),
              /* @__PURE__ */ (0, n.jsxs)("label", { children: ["完整內容", /* @__PURE__ */ (0, n.jsx)("textarea", {
                required: !0,
                rows: 7,
                maxLength: 12e3,
                value: B.content,
                onChange: (x) => P({
                  ...B,
                  content: x.target.value
                })
              })] }),
              /* @__PURE__ */ (0, n.jsxs)("label", { children: ["來源", /* @__PURE__ */ (0, n.jsx)("input", {
                required: !0,
                maxLength: 2e3,
                value: B.source,
                onChange: (x) => P({
                  ...B,
                  source: x.target.value
                })
              })] }),
              /* @__PURE__ */ (0, n.jsxs)("label", { children: ["素材位置", /* @__PURE__ */ (0, n.jsx)("input", {
                maxLength: 2e3,
                value: B.location,
                onChange: (x) => P({
                  ...B,
                  location: x.target.value
                })
              })] }),
              /* @__PURE__ */ (0, n.jsx)("button", {
                className: "btn primary",
                disabled: r,
                children: B.baseVersion ? "保存新版本" : "保存共用來源"
              })
            ]
          }),
          /* @__PURE__ */ (0, n.jsxs)("label", {
            className: "work-search",
            children: ["搜尋共用資料", /* @__PURE__ */ (0, n.jsx)("input", {
              placeholder: "原作章名、角色、場景或設定",
              value: de,
              onChange: (x) => L(x.target.value)
            })]
          }),
          /* @__PURE__ */ (0, n.jsxs)("p", {
            className: "muted",
            children: [
              be.length,
              " 項來源；目前連結目標為 ",
              v.episode,
              "。"
            ]
          }),
          be.slice(0, 60).map((x) => /* @__PURE__ */ (0, n.jsxs)("details", {
            className: "production-record",
            children: [
              /* @__PURE__ */ (0, n.jsxs)("summary", { children: [/* @__PURE__ */ (0, n.jsx)("b", { children: x.title }), /* @__PURE__ */ (0, n.jsxs)("span", {
                className: "status candidate",
                children: ["共用參考 v", x.version]
              })] }),
              /* @__PURE__ */ (0, n.jsx)("code", {
                className: "context-id",
                children: x.key
              }),
              /* @__PURE__ */ (0, n.jsx)("div", {
                className: "production-source-text",
                children: x.content
              }),
              /* @__PURE__ */ (0, n.jsxs)("p", { children: ["來源：", x.source] }),
              /* @__PURE__ */ (0, n.jsxs)("p", { children: ["素材位置：", x.location || "文字已收錄"] }),
              x.originEpisodeId && /* @__PURE__ */ (0, n.jsxs)("p", {
                className: "muted",
                children: [
                  "保留來源集數：",
                  T.find((Q) => Q.id === x.originEpisodeId)?.episode ?? x.originEpisodeId,
                  "；按本集需求選用。"
                ]
              }),
              /* @__PURE__ */ (0, n.jsxs)("div", {
                className: "context-actions",
                children: [/* @__PURE__ */ (0, n.jsx)("button", {
                  className: "btn",
                  disabled: r || !!v.sharedPins?.some((Q) => Q.assetId === x.id),
                  onClick: () => {
                    Y(x.id);
                  },
                  children: v.sharedPins?.some((Q) => Q.assetId === x.id) ? `${v.episode} 已連結此版本` : `連結此版本至 ${v.episode}`
                }), /* @__PURE__ */ (0, n.jsx)("button", {
                  className: "btn",
                  disabled: r,
                  onClick: () => Te(x),
                  children: "建立新版本"
                })]
              }),
              (v.sharedPins?.filter((Q) => Q.assetKey === x.key).at(-1)?.version ?? x.version) < x.version && /* @__PURE__ */ (0, n.jsx)("p", {
                className: "inline-note",
                children: "本集仍連結較舊版本，沿用內容保持不變；需要時再連結新版本。"
              })
            ]
          }, x.id)),
          /* @__PURE__ */ (0, n.jsxs)("details", {
            className: "production-import",
            children: [
              /* @__PURE__ */ (0, n.jsx)("summary", { children: "批次補入作品共用來源" }),
              /* @__PURE__ */ (0, n.jsx)("p", { children: "貼上包含 assets 清單的 JSON。每項須有 key、title、kind、content、source；識別鍵重複時拒絕覆寫。" }),
              /* @__PURE__ */ (0, n.jsxs)("label", { children: ["作品來源 JSON", /* @__PURE__ */ (0, n.jsx)("textarea", {
                rows: 5,
                value: I,
                onChange: (x) => {
                  ne(x.target.value), ce("");
                }
              })] }),
              K && /* @__PURE__ */ (0, n.jsx)("p", {
                role: "alert",
                children: K
              }),
              /* @__PURE__ */ (0, n.jsx)("button", {
                className: "btn primary",
                disabled: r || !I.trim(),
                onClick: async () => {
                  try {
                    const x = JSON.parse(I);
                    if (!Array.isArray(x.assets)) throw new Error("缺少 assets 清單");
                    await d("import_shared_assets", { assets: x.assets }) && ne("");
                  } catch (x) {
                    ce(x instanceof Error ? x.message : "格式錯誤");
                  }
                },
                children: "保存作品共用來源"
              })
            ]
          })
        ]
      })
    ]
  });
}
var sp = {
  key: "",
  title: "",
  world: "real",
  label: "v2_candidate",
  sourceLocation: "",
  sourceVersion: "",
  backupLocation: "",
  sha256: "",
  reference: ""
}, Gm = {
  register_model: "登記模型來源",
  create_model_version: "建立新候選版本",
  save_model_stage: "回報階段工作",
  approve_model_stage: "作者核定階段",
  acquire_model_context: "取得模型工作資料包",
  report_model_issue: "新增模型問題",
  resolve_model_issue: "作者複核或裁定",
  adopt_model_version: "作者登記採用版本",
  pin_model_version: "本集引用模型版本"
};
function Ym({ initialSelection: u, work: v, episode: T, episodes: r, busy: d, onAction: j, onProject: Y, onDirty: k }) {
  const [q, _] = (0, M.useState)(u?.modelId ?? ""), [E, Z] = (0, M.useState)(u?.versionId ?? ""), [H, ae] = (0, M.useState)(u?.stageId ?? "M01"), [de, L] = (0, M.useState)(null), [I, ne] = (0, M.useState)(sp), [K, ce] = (0, M.useState)(""), B = v ? Ss(v) : null, P = B?.models.find((w) => w.id === q) ?? B?.models[0], W = P?.versions.find((w) => w.id === E) ?? P?.versions.at(-1), pe = W?.stages[H], ie = yl.find((w) => w.id === H);
  function J(w) {
    Ze(w), k(w);
  }
  const [b, te] = (0, M.useState)([]), [be, Te] = (0, M.useState)(""), [x, Q] = (0, M.useState)(""), [G, O] = (0, M.useState)(""), [V, ye] = (0, M.useState)(""), [Ee, $e] = (0, M.useState)(""), [m, U] = (0, M.useState)("technical"), [X, $] = (0, M.useState)({}), [fe, me] = (0, M.useState)(""), [he, Me] = (0, M.useState)(""), [xe, Ze] = (0, M.useState)(!1);
  (0, M.useEffect)(() => {
    pe && (te(pe.checks), Te(pe.evidence), Q(pe.summary), O(pe.nextStep), ye(W.candidateLocation), J(!1));
  }, [pe, W]), (0, M.useEffect)(() => {
    if (!xe) return;
    const w = (Le) => Le.preventDefault();
    return window.addEventListener("beforeunload", w), () => window.removeEventListener("beforeunload", w);
  }, [xe]);
  function ht(w) {
    xe && !window.confirm("有未儲存模型紀錄，要放棄修改嗎？") || (J(!1), ce(""), w());
  }
  async function ke(w, Le) {
    ce("");
    const Pe = await j(w, Le);
    return Pe && J(!1), Pe;
  }
  function jl() {
    !P || !W || (ne({
      key: P.key,
      title: P.title,
      world: P.world,
      label: "v" + (W.number + 2) + "_candidate",
      sourceLocation: W.sourceLocation,
      sourceVersion: W.sourceVersion,
      backupLocation: W.backupLocation,
      sha256: W.sha256,
      reference: W.reference
    }), L("version"));
  }
  if (!v) return /* @__PURE__ */ (0, n.jsxs)("section", {
    className: "wide-card",
    children: [
      /* @__PURE__ */ (0, n.jsx)("h2", { children: "3D 模型製作流程" }),
      /* @__PURE__ */ (0, n.jsx)("p", {
        className: "stage-description",
        children: "模型屬於作品共用資產。先把本集整理到作品專案，即可登記模型及候選版本，供後續各集引用。"
      }),
      /* @__PURE__ */ (0, n.jsxs)("button", {
        className: "btn primary",
        onClick: Y,
        children: ["前往作品專案 ", /* @__PURE__ */ (0, n.jsx)(en, { size: 15 })]
      })
    ]
  });
  const nt = B.issues.filter((w) => w.modelId === P?.id && w.versionId === W?.id), It = nt.filter((w) => w.status === "open"), h = !!W?.stages.M08.author, F = P && W ? bm(v, P.id, W.id, H) : [], _e = B.pins.filter((w) => w.episodeId === T.id), Xt = new Map(_e.map((w) => [[w.modelId, w.sceneIds].join("|"), w]));
  return /* @__PURE__ */ (0, n.jsxs)("section", {
    className: "model-workspace",
    children: [
      /* @__PURE__ */ (0, n.jsxs)("div", {
        className: "wide-card model-heading",
        children: [/* @__PURE__ */ (0, n.jsxs)("div", {
          className: "section-title",
          children: [/* @__PURE__ */ (0, n.jsxs)("div", { children: [
            /* @__PURE__ */ (0, n.jsx)("div", {
              className: "eyebrow",
              children: "WORK-LEVEL 3D ASSETS"
            }),
            /* @__PURE__ */ (0, n.jsxs)("h2", { children: [/* @__PURE__ */ (0, n.jsx)(Ku, { size: 23 }), "模型製作與完善"] }),
            /* @__PURE__ */ (0, n.jsxs)("p", { children: [v.title, " · 各模型、各候選及各集引用分開記錄。"] })
          ] }), /* @__PURE__ */ (0, n.jsxs)("button", {
            className: "btn primary",
            disabled: d,
            onClick: () => ht(() => {
              ne(sp), L("register");
            }),
            children: [/* @__PURE__ */ (0, n.jsx)(ln, { size: 15 }), "登記模型"]
          })]
        }), /* @__PURE__ */ (0, n.jsxs)("div", {
          className: "model-principles",
          children: [
            /* @__PURE__ */ (0, n.jsxs)("span", { children: [/* @__PURE__ */ (0, n.jsx)(ha, { size: 15 }), "先讀原檔與設定"] }),
            /* @__PURE__ */ (0, n.jsxs)("span", { children: [/* @__PURE__ */ (0, n.jsx)(Ju, { size: 15 }), "保留原檔及版本"] }),
            /* @__PURE__ */ (0, n.jsxs)("span", { children: [/* @__PURE__ */ (0, n.jsx)(an, { size: 15 }), "技術、視覺與採用分開"] })
          ]
        })]
      }),
      de && /* @__PURE__ */ (0, n.jsxs)("form", {
        className: "wide-card context-form model-register",
        onSubmit: async (w) => {
          w.preventDefault();
          const Le = await ke(de === "register" ? "register_model" : "create_model_version", {
            ...I,
            modelId: P?.id
          });
          if (Le) {
            const Pe = de === "register" ? Le.work.modelFlow?.models.at(-1) : Le.work.modelFlow?.models.find((Mt) => Mt.id === P?.id);
            L(null), _(Pe?.id ?? ""), Z(Pe?.versions.at(-1)?.id ?? ""), ae("M01");
          }
        },
        children: [
          /* @__PURE__ */ (0, n.jsxs)("div", {
            className: "section-title",
            children: [/* @__PURE__ */ (0, n.jsx)("h3", { children: de === "register" ? "登記模型來源" : "建立新候選版本" }), /* @__PURE__ */ (0, n.jsx)("button", {
              className: "text-btn",
              type: "button",
              onClick: () => L(null),
              children: "關閉"
            })]
          }),
          /* @__PURE__ */ (0, n.jsxs)("div", {
            className: "context-form-grid",
            children: [
              de === "register" && /* @__PURE__ */ (0, n.jsxs)(n.Fragment, { children: [
                /* @__PURE__ */ (0, n.jsxs)("label", { children: ["模型固定識別鍵 *", /* @__PURE__ */ (0, n.jsx)("input", {
                  required: !0,
                  maxLength: 100,
                  value: I.key,
                  placeholder: "RG-REAL-01",
                  onChange: (w) => ne({
                    ...I,
                    key: w.target.value
                  })
                })] }),
                /* @__PURE__ */ (0, n.jsxs)("label", { children: ["模型名稱 *", /* @__PURE__ */ (0, n.jsx)("input", {
                  required: !0,
                  maxLength: 200,
                  value: I.title,
                  placeholder: "現實主角家",
                  onChange: (w) => ne({
                    ...I,
                    title: w.target.value
                  })
                })] }),
                /* @__PURE__ */ (0, n.jsxs)("label", { children: ["世界／場景分類", /* @__PURE__ */ (0, n.jsxs)("select", {
                  value: I.world,
                  onChange: (w) => ne({
                    ...I,
                    world: w.target.value
                  }),
                  children: [
                    /* @__PURE__ */ (0, n.jsx)("option", {
                      value: "real",
                      children: "現實"
                    }),
                    /* @__PURE__ */ (0, n.jsx)("option", {
                      value: "game",
                      children: "遊戲"
                    }),
                    /* @__PURE__ */ (0, n.jsx)("option", {
                      value: "other",
                      children: "其他"
                    })
                  ]
                })] })
              ] }),
              /* @__PURE__ */ (0, n.jsxs)("label", { children: ["本次候選標籤 *", /* @__PURE__ */ (0, n.jsx)("input", {
                required: !0,
                maxLength: 100,
                value: I.label,
                onChange: (w) => ne({
                  ...I,
                  label: w.target.value
                })
              })] }),
              [
                ["sourceLocation", "正式來源 GLB 位置 *"],
                ["sourceVersion", "來源版本／清單版本 *"],
                ["backupLocation", "原檔備份位置"],
                ["sha256", "原檔 SHA-256（實際計算值）"]
              ].map(([w, Le]) => /* @__PURE__ */ (0, n.jsxs)("label", { children: [Le, /* @__PURE__ */ (0, n.jsx)("input", {
                required: w === "sourceLocation" || w === "sourceVersion",
                maxLength: w === "sha256" ? 64 : 2e3,
                pattern: w === "sha256" ? "[a-fA-F0-9]{64}" : void 0,
                value: I[w],
                onChange: (Pe) => ne({
                  ...I,
                  [w]: Pe.target.value
                })
              })] }, w))
            ]
          }),
          /* @__PURE__ */ (0, n.jsxs)("label", { children: ["設定與尺度來源／不可改動項目", /* @__PURE__ */ (0, n.jsx)("textarea", {
            rows: 4,
            maxLength: 12e3,
            value: I.reference,
            onChange: (w) => ne({
              ...I,
              reference: w.target.value
            }),
            placeholder: "設計書與平面圖版本、固定節點／家具 ID、單位、重大變更待核定項。"
          })] }),
          /* @__PURE__ */ (0, n.jsx)("p", {
            className: "muted",
            children: "來源會隨此版本保存。待補欄位可先留空，但原檔、備份與雜湊不齊時不能通過盤點；更正來源請另建版本。登記資料不會修改或上傳模型檔案。"
          }),
          /* @__PURE__ */ (0, n.jsx)("button", {
            className: "btn primary",
            disabled: d,
            children: "保存模型來源與空白流程"
          })
        ]
      }),
      !P || !W ? /* @__PURE__ */ (0, n.jsxs)("div", {
        className: "wide-card empty",
        children: [
          /* @__PURE__ */ (0, n.jsx)(Ku, { size: 36 }),
          /* @__PURE__ */ (0, n.jsx)("h3", { children: "從實際模型來源開始" }),
          /* @__PURE__ */ (0, n.jsx)("p", { children: "登記正式 GLB、來源版本與設定依據，再逐階段留下產出及接續工作。" })
        ]
      }) : /* @__PURE__ */ (0, n.jsxs)(n.Fragment, { children: [
        /* @__PURE__ */ (0, n.jsxs)("div", {
          className: "wide-card",
          children: [
            /* @__PURE__ */ (0, n.jsxs)("div", {
              className: "model-selectors",
              children: [
                /* @__PURE__ */ (0, n.jsxs)("label", { children: ["模型", /* @__PURE__ */ (0, n.jsx)("select", {
                  value: P.id,
                  disabled: d,
                  onChange: (w) => ht(() => {
                    _(w.target.value), Z(""), ae("M01");
                  }),
                  children: B.models.map((w) => /* @__PURE__ */ (0, n.jsxs)("option", {
                    value: w.id,
                    children: [
                      w.key,
                      " · ",
                      w.title
                    ]
                  }, w.id))
                })] }),
                /* @__PURE__ */ (0, n.jsxs)("label", { children: ["精確版本", /* @__PURE__ */ (0, n.jsx)("select", {
                  value: W.id,
                  disabled: d,
                  onChange: (w) => ht(() => Z(w.target.value)),
                  children: P.versions.map((w) => /* @__PURE__ */ (0, n.jsxs)("option", {
                    value: w.id,
                    children: [
                      "v",
                      w.number,
                      " · ",
                      w.label,
                      w.stages.M08.author ? "（曾採用）" : "",
                      P.adoptedVersionId === w.id ? "／目前採用" : ""
                    ]
                  }, w.id))
                })] }),
                /* @__PURE__ */ (0, n.jsxs)("button", {
                  className: "btn",
                  disabled: d,
                  onClick: () => ht(jl),
                  children: [/* @__PURE__ */ (0, n.jsx)(ln, { size: 14 }), "另建候選版本"]
                })
              ]
            }),
            /* @__PURE__ */ (0, n.jsxs)("div", {
              className: "production-totals",
              children: [
                /* @__PURE__ */ (0, n.jsxs)("b", { children: [yl.filter((w) => W.stages[w.id].author).length, " / 8 階段核定"] }),
                /* @__PURE__ */ (0, n.jsxs)("b", { children: [It.length, " 項待修或待裁定"] }),
                /* @__PURE__ */ (0, n.jsxs)("span", { children: [
                  P.world === "real" ? "現實場景" : P.world === "game" ? "遊戲場景" : "其他模型",
                  " · ",
                  h ? "此採用版本保持不變" : "候選製作中"
                ] })
              ]
            }),
            /* @__PURE__ */ (0, n.jsxs)("details", { children: [/* @__PURE__ */ (0, n.jsx)("summary", { children: "此版本來源與設定" }), /* @__PURE__ */ (0, n.jsxs)("dl", {
              className: "model-sources",
              children: [
                /* @__PURE__ */ (0, n.jsx)("dt", { children: "模型來源" }),
                /* @__PURE__ */ (0, n.jsxs)("dd", { children: [
                  W.sourceLocation,
                  " · ",
                  W.sourceVersion
                ] }),
                /* @__PURE__ */ (0, n.jsx)("dt", { children: "原檔備份" }),
                /* @__PURE__ */ (0, n.jsx)("dd", { children: W.backupLocation || "待補" }),
                /* @__PURE__ */ (0, n.jsx)("dt", { children: "SHA-256" }),
                /* @__PURE__ */ (0, n.jsx)("dd", { children: W.sha256 || "待實際計算" }),
                /* @__PURE__ */ (0, n.jsx)("dt", { children: "設定與尺度" }),
                /* @__PURE__ */ (0, n.jsx)("dd", { children: W.reference || "待補" }),
                /* @__PURE__ */ (0, n.jsx)("dt", { children: "候選 GLB" }),
                /* @__PURE__ */ (0, n.jsx)("dd", { children: W.candidateLocation || "尚未登記" })
              ]
            })] })
          ]
        }),
        /* @__PURE__ */ (0, n.jsx)("div", {
          className: "model-stage-grid",
          children: yl.map((w, Le) => /* @__PURE__ */ (0, n.jsxs)("button", {
            disabled: d,
            className: "model-step " + (H === w.id ? "selected" : "") + (W.stages[w.id].author ? " passed" : ""),
            onClick: () => ht(() => ae(w.id)),
            children: [
              /* @__PURE__ */ (0, n.jsx)("small", { children: w.id }),
              /* @__PURE__ */ (0, n.jsx)("b", { children: w.title }),
              /* @__PURE__ */ (0, n.jsx)("span", { children: W.stages[w.id].author ? "作者已確認" : W.stages[w.id].status === "needs_revision" ? "待修正" : W.stages[w.id].status === "candidate" ? "已有工作回報" : "待製作" })
            ]
          }, w.id))
        }),
        /* @__PURE__ */ (0, n.jsxs)("div", {
          className: "wide-card model-stage-detail",
          children: [
            /* @__PURE__ */ (0, n.jsxs)("div", {
              className: "section-title",
              children: [/* @__PURE__ */ (0, n.jsxs)("div", { children: [/* @__PURE__ */ (0, n.jsxs)("div", {
                className: "eyebrow",
                children: [
                  ie.id,
                  " · ",
                  P.title,
                  " · ",
                  W.label
                ]
              }), /* @__PURE__ */ (0, n.jsx)("h2", { children: ie.title })] }), /* @__PURE__ */ (0, n.jsx)("span", {
                className: "status " + (pe.author ? "passed" : pe.status === "needs_revision" ? "needs_revision" : "candidate"),
                children: pe.author ? "作者已確認" : pe.status === "todo" ? "待製作" : "待確認工作"
              })]
            }),
            /* @__PURE__ */ (0, n.jsxs)("div", {
              className: "output-box",
              children: [/* @__PURE__ */ (0, n.jsx)(ha, { size: 19 }), /* @__PURE__ */ (0, n.jsxs)("div", { children: [/* @__PURE__ */ (0, n.jsx)("strong", { children: "應留下的產出" }), /* @__PURE__ */ (0, n.jsx)("p", { children: ie.output })] })]
            }),
            /* @__PURE__ */ (0, n.jsxs)("form", {
              className: "context-form",
              onSubmit: async (w) => {
                w.preventDefault(), await ke("save_model_stage", {
                  modelId: P.id,
                  versionId: W.id,
                  stageId: H,
                  checks: b,
                  evidence: be,
                  summary: x,
                  nextStep: G,
                  candidateLocation: V
                });
              },
              children: [
                /* @__PURE__ */ (0, n.jsx)("div", {
                  className: "checklist",
                  children: ie.checks.map((w, Le) => /* @__PURE__ */ (0, n.jsxs)("label", { children: [/* @__PURE__ */ (0, n.jsx)("input", {
                    type: "checkbox",
                    disabled: d || h,
                    checked: b[Le] ?? !1,
                    onChange: (Pe) => {
                      te((Mt) => Mt.map((De, el) => el === Le ? Pe.target.checked : De)), J(!0);
                    }
                  }), /* @__PURE__ */ (0, n.jsx)("span", { children: w })] }, w))
                }),
                H === "M04" && /* @__PURE__ */ (0, n.jsxs)("label", { children: ["本次獨立候選 GLB", /* @__PURE__ */ (0, n.jsx)("input", {
                  disabled: d || h,
                  maxLength: 2e3,
                  value: V,
                  placeholder: ".../reality-home_v2_candidate.glb",
                  onChange: (w) => {
                    ye(w.target.value), J(!0);
                  }
                })] }),
                /* @__PURE__ */ (0, n.jsxs)("label", { children: ["實際產出／檢查依據位置", /* @__PURE__ */ (0, n.jsx)("textarea", {
                  rows: 2,
                  disabled: d || h,
                  value: be,
                  onChange: (w) => {
                    Te(w.target.value), J(!0);
                  },
                  placeholder: "原檔盤點報告、逐物件差異、檢查結果或指定鏡位截圖；附來源版本。"
                })] }),
                /* @__PURE__ */ (0, n.jsxs)("label", { children: ["本次實際做了什麼 *", /* @__PURE__ */ (0, n.jsx)("textarea", {
                  required: !0,
                  rows: 3,
                  maxLength: 6e3,
                  disabled: d || h,
                  value: x,
                  onChange: (w) => {
                    Q(w.target.value), J(!0);
                  },
                  placeholder: "具體節點／物件、改動、檢查方式、尚未完成項。"
                })] }),
                /* @__PURE__ */ (0, n.jsxs)("label", { children: ["下一位 AI 從哪裡繼續 *", /* @__PURE__ */ (0, n.jsx)("textarea", {
                  required: !0,
                  rows: 3,
                  maxLength: 6e3,
                  disabled: d || h,
                  value: G,
                  onChange: (w) => {
                    O(w.target.value), J(!0);
                  },
                  placeholder: "指定版本、檔案位置、先讀資料、下一個物件或鏡位，以及受阻原因。"
                })] }),
                /* @__PURE__ */ (0, n.jsxs)("div", {
                  className: "context-actions",
                  children: [/* @__PURE__ */ (0, n.jsxs)("button", {
                    className: "btn",
                    disabled: d || h || !xe,
                    children: ["保存候選工作紀錄", xe ? " *" : ""]
                  }), /* @__PURE__ */ (0, n.jsxs)("button", {
                    type: "button",
                    className: "btn primary",
                    disabled: d || h || xe || F.length > 0 || !!pe.author,
                    onClick: () => {
                      ke(H === "M08" ? "adopt_model_version" : "approve_model_stage", {
                        modelId: P.id,
                        versionId: W.id,
                        stageId: H,
                        note: "作者確認指定候選版本與適用範圍"
                      });
                    },
                    children: [/* @__PURE__ */ (0, n.jsx)(an, { size: 15 }), H === "M08" ? "作者登記採用此版本" : "作者確認本階段"]
                  })]
                }),
                /* @__PURE__ */ (0, n.jsx)("p", {
                  className: "muted",
                  children: h ? "已採用版本及舊集引用保持不變；需要修改請另建候選。" : xe ? "請先保存工作紀錄，再確認。" : F.length ? "待補：" + F.join("；") : "檢查條件已齊，請核對實際成果後確認。"
                }),
                H === "M08" && /* @__PURE__ */ (0, n.jsx)("p", {
                  className: "inline-note",
                  children: "採用僅保存作者選擇，不會覆寫或部署正式 GLB。實際替換正式模型須另行明確授權。"
                })
              ]
            })
          ]
        }),
        /* @__PURE__ */ (0, n.jsxs)("div", {
          className: "wide-card",
          children: [
            /* @__PURE__ */ (0, n.jsx)("div", {
              className: "section-title",
              children: /* @__PURE__ */ (0, n.jsxs)("div", { children: [/* @__PURE__ */ (0, n.jsx)("h2", { children: "技術問題、視覺問題與重大變更" }), /* @__PURE__ */ (0, n.jsx)("p", { children: "重大建築變更、世界觀衝突與正式設定異動保留作者裁定。" })] })
            }),
            /* @__PURE__ */ (0, n.jsxs)("form", {
              className: "context-form",
              onSubmit: async (w) => {
                w.preventDefault(), await ke("report_model_issue", {
                  modelId: P.id,
                  versionId: W.id,
                  stageId: H,
                  kind: m,
                  reason: Ee
                }) && $e("");
              },
              children: [
                /* @__PURE__ */ (0, n.jsxs)("div", {
                  className: "context-form-grid",
                  children: [/* @__PURE__ */ (0, n.jsxs)("label", { children: ["問題分類", /* @__PURE__ */ (0, n.jsxs)("select", {
                    value: m,
                    onChange: (w) => U(w.target.value),
                    children: [
                      /* @__PURE__ */ (0, n.jsx)("option", {
                        value: "technical",
                        children: "技術檢查問題"
                      }),
                      /* @__PURE__ */ (0, n.jsx)("option", {
                        value: "visual",
                        children: "AI／人工視覺問題"
                      }),
                      /* @__PURE__ */ (0, n.jsx)("option", {
                        value: "major",
                        children: "重大變更待作者裁定"
                      })
                    ]
                  })] }), /* @__PURE__ */ (0, n.jsxs)("label", { children: ["所屬階段", /* @__PURE__ */ (0, n.jsx)("input", {
                    readOnly: !0,
                    value: ie.id + " " + ie.title
                  })] })]
                }),
                /* @__PURE__ */ (0, n.jsxs)("label", { children: ["具體原因", /* @__PURE__ */ (0, n.jsx)("textarea", {
                  required: !0,
                  rows: 2,
                  maxLength: 6e3,
                  value: Ee,
                  onChange: (w) => $e(w.target.value)
                })] }),
                /* @__PURE__ */ (0, n.jsxs)("button", {
                  className: "btn",
                  disabled: d || !Ee.trim(),
                  children: [/* @__PURE__ */ (0, n.jsx)(tn, { size: 15 }), "登記問題"]
                })
              ]
            }),
            nt.map((w) => /* @__PURE__ */ (0, n.jsxs)("article", {
              className: "context-record",
              children: [
                /* @__PURE__ */ (0, n.jsxs)("div", {
                  className: "issue-top",
                  children: [/* @__PURE__ */ (0, n.jsx)("span", {
                    className: "status " + (w.status === "open" ? "needs_revision" : "passed"),
                    children: w.status === "open" ? "待處理" : "作者已複核"
                  }), /* @__PURE__ */ (0, n.jsxs)("b", { children: [
                    w.stageId,
                    " · ",
                    w.kind === "major" ? "重大變更" : w.kind === "technical" ? "技術" : "視覺"
                  ] })]
                }),
                /* @__PURE__ */ (0, n.jsx)("p", { children: w.reason }),
                /* @__PURE__ */ (0, n.jsxs)("small", { children: [
                  w.by,
                  " · ",
                  new Date(w.at).toLocaleString("zh-TW", { timeZone: "Asia/Taipei" })
                ] }),
                w.status === "open" ? /* @__PURE__ */ (0, n.jsxs)("form", {
                  className: "context-form",
                  onSubmit: async (Le) => {
                    Le.preventDefault(), await ke("resolve_model_issue", {
                      modelId: P.id,
                      versionId: W.id,
                      issueId: w.id,
                      resolution: X[w.id] ?? ""
                    });
                  },
                  children: [/* @__PURE__ */ (0, n.jsxs)("label", { children: ["作者修正複核／裁定結果", /* @__PURE__ */ (0, n.jsx)("textarea", {
                    required: !0,
                    rows: 2,
                    maxLength: 6e3,
                    value: X[w.id] ?? "",
                    onChange: (Le) => $({
                      ...X,
                      [w.id]: Le.target.value
                    })
                  })] }), /* @__PURE__ */ (0, n.jsx)("button", {
                    className: "btn",
                    disabled: d,
                    children: "作者確認處理結果"
                  })]
                }) : /* @__PURE__ */ (0, n.jsxs)("p", { children: ["處理結果：", w.resolution] })
              ]
            }, w.id))
          ]
        }),
        /* @__PURE__ */ (0, n.jsxs)("div", {
          className: "wide-card",
          children: [
            /* @__PURE__ */ (0, n.jsx)("div", {
              className: "section-title",
              children: /* @__PURE__ */ (0, n.jsxs)("div", { children: [/* @__PURE__ */ (0, n.jsxs)("h2", { children: [/* @__PURE__ */ (0, n.jsx)(Fu, { size: 19 }), "各集固定版本引用"] }), /* @__PURE__ */ (0, n.jsxs)("p", { children: [
                "目前集數：",
                T.episode,
                "。新候選不會自動替換 EP01 或其他集的模型來源。"
              ] })] })
            }),
            h && /* @__PURE__ */ (0, n.jsxs)("form", {
              className: "context-form",
              onSubmit: async (w) => {
                w.preventDefault(), await ke("pin_model_version", {
                  modelId: P.id,
                  versionId: W.id,
                  episodeId: T.id,
                  purpose: fe,
                  sceneIds: he
                }) && (me(""), Me(""));
              },
              children: [/* @__PURE__ */ (0, n.jsxs)("div", {
                className: "context-form-grid",
                children: [/* @__PURE__ */ (0, n.jsxs)("label", { children: ["引用場次（選填）", /* @__PURE__ */ (0, n.jsx)("input", {
                  value: he,
                  maxLength: 1e3,
                  placeholder: "S06、S07",
                  onChange: (w) => Me(w.target.value)
                })] }), /* @__PURE__ */ (0, n.jsxs)("label", { children: ["本集用途 *", /* @__PURE__ */ (0, n.jsx)("input", {
                  required: !0,
                  value: fe,
                  maxLength: 2e3,
                  placeholder: "固定樓梯、餐桌與走道位置",
                  onChange: (w) => me(w.target.value)
                })] })]
              }), /* @__PURE__ */ (0, n.jsxs)("button", {
                className: "btn",
                disabled: d || It.length > 0,
                children: ["將此採用版本引用至 ", T.episode]
              })]
            }),
            _e.length ? /* @__PURE__ */ (0, n.jsx)("div", {
              className: "model-pins",
              children: _e.map((w, Le) => {
                const Pe = B.models.find((De) => De.id === w.modelId), Mt = Pe?.versions.find((De) => De.id === w.versionId);
                return /* @__PURE__ */ (0, n.jsxs)("article", { children: [
                  /* @__PURE__ */ (0, n.jsxs)("b", { children: [
                    Pe?.title,
                    " · ",
                    Mt?.label
                  ] }),
                  " ",
                  /* @__PURE__ */ (0, n.jsx)("span", {
                    className: "status " + (Xt.get([w.modelId, w.sceneIds].join("|")) === w ? "passed" : "todo"),
                    children: Xt.get([w.modelId, w.sceneIds].join("|")) === w ? "本集現行引用" : "歷史引用"
                  }),
                  /* @__PURE__ */ (0, n.jsxs)("p", { children: [
                    w.sceneIds || "本集",
                    " ／ ",
                    w.purpose
                  ] }),
                  /* @__PURE__ */ (0, n.jsx)("code", { children: Mt?.candidateLocation })
                ] }, Le);
              })
            }) : /* @__PURE__ */ (0, n.jsx)("p", {
              className: "muted",
              children: "本集尚未登記採用的模型版本。請先完成作者採用，再記錄引用。"
            })
          ]
        }),
        /* @__PURE__ */ (0, n.jsxs)("details", {
          className: "wide-card",
          children: [/* @__PURE__ */ (0, n.jsxs)("summary", { children: [
            "模型製作與 AI 接續紀錄（",
            B.history.filter((w) => w.modelId === P.id).length,
            "）"
          ] }), [...B.history].reverse().filter((w) => w.modelId === P.id).slice(0, 60).map((w, Le) => /* @__PURE__ */ (0, n.jsxs)("article", {
            className: "context-mini",
            children: [
              /* @__PURE__ */ (0, n.jsxs)("b", { children: [
                Gm[w.action] ?? w.action,
                " · ",
                w.stageId,
                " · ",
                P.versions.find((Pe) => Pe.id === w.versionId)?.label
              ] }),
              /* @__PURE__ */ (0, n.jsx)("p", { children: w.detail }),
              /* @__PURE__ */ (0, n.jsxs)("small", { children: [
                w.actor === "ai" ? "AI" : "作者",
                " · ",
                w.by,
                " · ",
                new Date(w.at).toLocaleString("zh-TW", { timeZone: "Asia/Taipei" })
              ] })
            ]
          }, Le))]
        })
      ] }),
      K && /* @__PURE__ */ (0, n.jsx)("p", {
        role: "alert",
        children: K
      })
    ]
  });
}
var Qu = "https://lihuany635-create.github.io/lizhi-cloud-web/?open=animationflow", Zu = {
  todo: "待製作",
  candidate: "候選待驗收",
  passed: "已通過",
  in_timeline: "已入片",
  needs_revision: "待修正"
}, cp = [
  ["id", "鏡頭 ID *"],
  ["scene", "場次 *"],
  ["description", "鏡頭描述 *"],
  ["legacyIds", "鏡號／素材編號對照"],
  ["scriptVersion", "劇本版本"],
  ["characterVersion", "角色參考版本"],
  ["sceneVersion", "場景參考版本"],
  ["start", "起始圖位置"],
  ["end", "結束圖位置"],
  ["video", "影片位置"],
  ["voiceId", "配音 ID"],
  ["filePath", "實際檔案位置"],
  ["estimatedDuration", "預估長度（秒）"],
  ["actualDuration", "實際長度（秒）"],
  ["inPoint", "成片入點"],
  ["outPoint", "成片出點"],
  ["candidateVersion", "候選版本"],
  ["adoptedVersion", "採用版本"],
  ["editorVersion", "剪輯專案版本"],
  ["issues", "待修問題／清空代表已修正"]
];
function Pa(u) {
  return u ? new Date(u).toLocaleString("zh-TW", {
    timeZone: "Asia/Taipei",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  }) : "尚無紀錄";
}
function Vm(u, v, T = "application/json") {
  const r = URL.createObjectURL(new Blob([v], { type: T })), d = document.createElement("a");
  d.href = r, d.download = u, d.click(), setTimeout(() => URL.revokeObjectURL(r), 1e3);
}
function Xm({ nativeTransport: u } = {}) {
  const [v, T] = (0, M.useState)([]), [r, d] = (0, M.useState)(null), [j, Y] = (0, M.useState)("resume"), [k, q] = (0, M.useState)("01"), [_, E] = (0, M.useState)(null), [Z, H] = (0, M.useState)([]), [ae, de] = (0, M.useState)(!0), [L, I] = (0, M.useState)(!1), [ne, K] = (0, M.useState)(""), [ce, B] = (0, M.useState)(""), [P, W] = (0, M.useState)(!1), [pe, ie] = (0, M.useState)([]), [J, b] = (0, M.useState)(""), [te, be] = (0, M.useState)(""), [Te, x] = (0, M.useState)(!1), [Q, G] = (0, M.useState)(null), [O, V] = (0, M.useState)({}), [ye, Ee] = (0, M.useState)(""), [$e, m] = (0, M.useState)(!1), [U, X] = (0, M.useState)(null), $ = (0, M.useRef)(0), fe = (0, M.useRef)(""), me = (0, M.useRef)(!1);
  (0, M.useEffect)(() => {
    me.current = Te;
  }, [Te]);
  const he = (0, M.useCallback)((f) => {
    fe.current = f.id, d(f), E((se) => se?.id === f.workId ? se : null), T((se) => [Iu(f), ...se.filter((oe) => oe.id !== f.id)]), x(!1);
  }, []);
  async function Me(f, se, oe = "projects") {
    const ut = u ? await u(oe, f, se) : await fetch("/api/" + oe + f, {
      cache: "no-store",
      ...se ? {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(se)
      } : {}
    });
    if (ut.status === 401)
      throw W(!0), new Error("請先登入流程工作台");
    if (!ut.headers.get("content-type")?.includes("application/json"))
      throw W(!0), new Error("請開啟工作台並使用 ChatGPT 登入");
    const zt = await ut.json();
    if (!ut.ok) throw new Error(zt.error || "讀取失敗");
    return W(!1), zt;
  }
  const xe = (0, M.useCallback)(async (f) => {
    const se = ++$.current;
    f && f !== fe.current && (fe.current = f, de(!0));
    try {
      const [oe, ut] = await Promise.all([Me(""), Me("", void 0, "works")]), zt = f || fe.current || oe.find((Ke) => !Ke.archived && Ke.workId && Ke.episode === "EP01")?.id || oe.find((Ke) => !Ke.archived && Ke.workId)?.id || oe.find((Ke) => !Ke.archived)?.id;
      let Qt = null, zl = null;
      if (zt && (Qt = await Me("?id=" + encodeURIComponent(zt)), Qt.workId && (zl = (await Me("?id=" + encodeURIComponent(Qt.workId), void 0, "works")).work)), se !== $.current) return;
      K(""), T(oe), H(ut), me.current || (Qt ? he(Qt) : d(null), E(zl));
    } catch (oe) {
      se === $.current && K(oe.message);
    } finally {
      se === $.current && de(!1);
    }
  }, [he]);
  (0, M.useEffect)(() => {
    const f = new URLSearchParams(window.location.search).get("view");
    f && [
      "resume",
      "project",
      "models",
      "context"
    ].includes(f) && Y(f);
  }, []), (0, M.useEffect)(() => {
    xe();
  }, [xe]), (0, M.useEffect)(() => {
    const f = setInterval(() => {
      !Te && !Q && !L && xe(fe.current || void 0);
    }, 2e4);
    return () => clearInterval(f);
  }, [
    Te,
    Q,
    L,
    r?.id,
    xe
  ]), (0, M.useEffect)(() => {
    const f = r?.stages[k];
    f && (ie(f.checks), b(f.evidence), be(f.note), x(!1));
  }, [r, k]), (0, M.useEffect)(() => {
    if (!Te) return;
    const f = (se) => {
      se.preventDefault();
    };
    return window.addEventListener("beforeunload", f), () => window.removeEventListener("beforeunload", f);
  }, [Te]), (0, M.useEffect)(() => {
    if (!ce) return;
    const f = setTimeout(() => B(""), 4500);
    return () => clearTimeout(f);
  }, [ce]);
  async function Ze(f, se = {}) {
    if (r) {
      $.current++, I(!0), K("");
      try {
        const oe = await Me("", {
          projectId: r.id,
          revision: r.revision,
          action: f,
          args: se
        });
        return he(oe), oe.archived && m(!0), B("已儲存至雲端"), oe;
      } catch (oe) {
        K(oe.message);
      } finally {
        I(!1);
      }
    }
  }
  async function ht(f, se) {
    $.current++, I(!0), K("");
    try {
      const oe = await Me("", [
        "convert_episode",
        "create_work",
        "create_episode"
      ].includes(f) ? {
        action: f,
        ...se,
        workId: _?.id,
        revision: _?.revision
      } : {
        action: f,
        workId: _?.id,
        revision: _?.revision,
        args: se
      }, "works");
      return E(oe.work), H((ut) => [{
        ..._m(oe.work),
        episodeCount: oe.episodes.length
      }, ...ut.filter((zt) => zt.id !== oe.work.id)]), T((ut) => [...oe.episodes, ...ut.filter((zt) => !oe.episodes.some((Qt) => Qt.id === zt.id))]), oe.episode && he(oe.episode), B("作品專案已儲存"), oe;
    } catch (oe) {
      K(oe.message);
    } finally {
      I(!1);
    }
  }
  function ke(f) {
    Te && !window.confirm("此階段有未儲存修改，要放棄修改嗎？") || (x(!1), f());
  }
  function jl(f) {
    ke(() => q(f));
  }
  function nt(f) {
    ke(() => {
      Y(f), [
        "main",
        "op",
        "ed"
      ].includes(f) && q(Vt.find((se) => se.group === f).id);
    });
  }
  async function It(f) {
    f.preventDefault(), I(!0), K("");
    try {
      Q === "create" ? (he(await Me("", {
        action: "create_project",
        title: O.title || "現實遊戲",
        episode: O.episode || "EP01"
      })), Y("main"), q("01"), G(null), B("專案已建立，全部階段待確認")) : Q === "shot" ? await Ze("save_shot", O) && G(null) : Q === "issue" ? await Ze("add_issue", O) && G(null) : Q === "resolve" ? await Ze("resolve_issue", O) && G(null) : Q === "archive" && await Ze(r?.archived ? "restore" : "archive") && G(null);
    } catch (se) {
      K(se.message);
    } finally {
      I(!1);
    }
  }
  const h = r ? Iu(r) : null, F = Vt.find((f) => f.id === k), _e = r?.stages[k], Xt = r ? hp(r, k) : [], w = r ? ys(r, k) : [], Le = Vt.filter((f) => f.group === j), Pe = r?.issues.filter((f) => f.status === "open") || [], Mt = r?.production?.completionReports?.at(-1), De = Mt?.status === "completed", el = r ? Pu(r).registration : null, Sl = [
    [
      "resume",
      "工作首頁",
      vs
    ],
    [
      "project",
      "作品與集數",
      Wn
    ],
    [
      "models",
      "3D 模型",
      $f
    ],
    [
      "settings",
      "採用設定",
      ha
    ],
    [
      "context",
      "資料與交接",
      vs
    ],
    [
      "main",
      "動畫製作",
      nm
    ],
    [
      "op",
      "片頭 OP",
      Ru
    ],
    [
      "ed",
      "片尾 ED",
      Wn
    ],
    [
      "shots",
      "鏡頭與素材",
      $f
    ],
    [
      "issues",
      "待修問題",
      tn
    ],
    [
      "chatgpt",
      "AI 協作",
      Hu
    ],
    [
      "history",
      "異動紀錄",
      op
    ]
  ];
  return /* @__PURE__ */ (0, n.jsxs)("div", {
    className: "workspace",
    children: [
      /* @__PURE__ */ (0, n.jsxs)("aside", {
        className: "sidebar",
        children: [
          /* @__PURE__ */ (0, n.jsxs)("a", {
            className: "brand",
            href: Qu,
            target: "_top",
            children: [/* @__PURE__ */ (0, n.jsx)("span", {
              className: "brandmark",
              children: "立"
            }), /* @__PURE__ */ (0, n.jsxs)("div", { children: [/* @__PURE__ */ (0, n.jsx)("strong", { children: "立之雲端庫" }), /* @__PURE__ */ (0, n.jsx)("small", { children: "PRODUCTION WORKSPACE" })] })]
          }),
          /* @__PURE__ */ (0, n.jsx)("div", {
            className: "side-label",
            children: "作品專案"
          }),
          /* @__PURE__ */ (0, n.jsxs)("div", {
            className: "project-switch",
            children: [/* @__PURE__ */ (0, n.jsx)(Wn, { size: 19 }), /* @__PURE__ */ (0, n.jsxs)("select", {
              disabled: L || ae,
              "aria-label": "切換作品專案",
              value: _?.id || "",
              onChange: (f) => ke(() => {
                const se = v.find((oe) => (oe.workId || "") === f.target.value && !oe.archived);
                se && xe(se.id), X(null), Y("resume");
              }),
              children: [/* @__PURE__ */ (0, n.jsx)("option", {
                value: "",
                children: "未歸屬單集"
              }), Z.map((f) => /* @__PURE__ */ (0, n.jsxs)("option", {
                value: f.id,
                children: [
                  f.title,
                  " · ",
                  f.episodeCount,
                  " 集"
                ]
              }, f.id))]
            })]
          }),
          /* @__PURE__ */ (0, n.jsx)("div", {
            className: "side-label",
            children: "集數"
          }),
          /* @__PURE__ */ (0, n.jsxs)("div", {
            className: "project-switch",
            children: [/* @__PURE__ */ (0, n.jsx)(vs, { size: 19 }), /* @__PURE__ */ (0, n.jsxs)("select", {
              disabled: L || ae,
              "aria-label": "切換集數",
              value: r?.id || "",
              onChange: (f) => ke(() => {
                xe(f.target.value);
              }),
              children: [/* @__PURE__ */ (0, n.jsx)("option", {
                value: "",
                disabled: !0,
                children: "選擇集數"
              }), v.filter((f) => (f.workId || "") === (_?.id || "") && ($e || !f.archived)).map((f) => /* @__PURE__ */ (0, n.jsxs)("option", {
                value: f.id,
                children: [
                  f.episode,
                  " · ",
                  f.title,
                  f.archived ? "（已封存）" : ""
                ]
              }, f.id))]
            })]
          }),
          /* @__PURE__ */ (0, n.jsxs)("button", {
            className: "new-project",
            onClick: () => ke(() => {
              V({
                title: "現實遊戲",
                episode: "EP01"
              }), G("create");
            }),
            children: [/* @__PURE__ */ (0, n.jsx)(ln, { size: 15 }), "建立其他單集"]
          }),
          /* @__PURE__ */ (0, n.jsx)("nav", {
            "aria-label": "主要功能",
            children: Sl.filter(([f]) => [
              "resume",
              "main",
              "models",
              "context",
              "chatgpt"
            ].includes(f)).map(([f, se, oe]) => /* @__PURE__ */ (0, n.jsxs)("button", {
              "aria-current": j === f ? "page" : void 0,
              className: "nav-item " + (j === f || f === "main" && [
                "op",
                "ed",
                "shots",
                "issues"
              ].includes(j) ? "active" : ""),
              onClick: () => nt(f),
              children: [/* @__PURE__ */ (0, n.jsx)(oe, { size: 18 }), /* @__PURE__ */ (0, n.jsx)("span", { children: se })]
            }, f))
          }),
          /* @__PURE__ */ (0, n.jsxs)("details", {
            className: "nav-more",
            open: [
              "project",
              "settings",
              "history"
            ].includes(j) || void 0,
            children: [/* @__PURE__ */ (0, n.jsx)("summary", { children: "專案管理" }), Sl.filter(([f]) => [
              "project",
              "settings",
              "history"
            ].includes(f)).map(([f, se, oe]) => /* @__PURE__ */ (0, n.jsxs)("button", {
              className: "nav-item " + (j === f ? "active" : ""),
              onClick: () => nt(f),
              children: [/* @__PURE__ */ (0, n.jsx)(oe, { size: 17 }), se]
            }, f))]
          }),
          /* @__PURE__ */ (0, n.jsxs)("div", {
            className: "side-bottom",
            children: [/* @__PURE__ */ (0, n.jsxs)("label", {
              className: "archive-toggle",
              children: [/* @__PURE__ */ (0, n.jsx)("input", {
                type: "checkbox",
                checked: $e,
                onChange: (f) => m(f.target.checked)
              }), "顯示已封存專案"]
            }), /* @__PURE__ */ (0, n.jsxs)("a", {
              href: Qu,
              target: "_top",
              children: ["返回立之雲端庫 ", /* @__PURE__ */ (0, n.jsx)(Vh, { size: 14 })]
            })]
          })
        ]
      }),
      /* @__PURE__ */ (0, n.jsxs)("main", {
        className: "main",
        children: [/* @__PURE__ */ (0, n.jsxs)("header", {
          className: "topbar",
          children: [/* @__PURE__ */ (0, n.jsxs)("div", {
            className: "breadcrumb",
            children: [
              "製作工作台 ",
              /* @__PURE__ */ (0, n.jsx)(If, { size: 14 }),
              /* @__PURE__ */ (0, n.jsx)("span", { children: Sl.find((f) => f[0] === j)?.[1] })
            ]
          }), /* @__PURE__ */ (0, n.jsxs)("div", {
            className: "top-actions",
            children: [/* @__PURE__ */ (0, n.jsxs)("span", {
              className: "cloud-indicator",
              children: [/* @__PURE__ */ (0, n.jsx)("i", {}), u ? "雲端庫帳號 · 共用進度" : "私有雲端進度"]
            }), /* @__PURE__ */ (0, n.jsx)("button", {
              className: "icon-btn",
              title: "重新讀取雲端進度",
              "aria-label": "重新讀取雲端進度",
              disabled: L || ae,
              onClick: () => ke(() => {
                xe(r?.id);
              }),
              children: /* @__PURE__ */ (0, n.jsx)(fp, {
                size: 17,
                className: ae ? "spin" : ""
              })
            })]
          })]
        }), /* @__PURE__ */ (0, n.jsxs)("div", {
          className: "page-content",
          children: [
            ne && /* @__PURE__ */ (0, n.jsxs)("div", {
              className: "error-banner",
              role: "alert",
              children: [
                /* @__PURE__ */ (0, n.jsx)(tn, { size: 18 }),
                /* @__PURE__ */ (0, n.jsx)("span", { children: ne }),
                P && /* @__PURE__ */ (0, n.jsx)("a", {
                  href: u ? Qu : "/signin-with-chatgpt?return_to=" + encodeURIComponent("/?view=" + j),
                  target: "_top",
                  children: u ? "重新登入雲端庫" : "登入工作台 ↗"
                }),
                /* @__PURE__ */ (0, n.jsx)("button", {
                  "aria-label": "關閉訊息",
                  onClick: () => K(""),
                  children: /* @__PURE__ */ (0, n.jsx)(Wf, { size: 16 })
                })
              ]
            }),
            /* @__PURE__ */ (0, n.jsxs)("div", {
              className: "page-heading",
              children: [/* @__PURE__ */ (0, n.jsxs)("div", { children: [
                /* @__PURE__ */ (0, n.jsx)("div", {
                  className: "eyebrow",
                  children: "製作工作台"
                }),
                /* @__PURE__ */ (0, n.jsx)("h1", { children: Sl.find((f) => f[0] === j)?.[1] }),
                /* @__PURE__ */ (0, n.jsx)("p", { children: j === "resume" ? "查看進度，選一件事接著做。" : j === "models" ? "選擇模型與版本，記錄這次完成的工作。" : j === "context" ? "查找製作資料，保留每次工作的交接。" : "目前選取的作品與集數如下。" })
              ] }), /* @__PURE__ */ (0, n.jsx)("div", {
                className: "heading-actions",
                children: r && /* @__PURE__ */ (0, n.jsxs)(n.Fragment, { children: [/* @__PURE__ */ (0, n.jsxs)("button", {
                  className: "btn",
                  onClick: () => Vm(r.title + "_" + r.episode + "_流程備份.json", JSON.stringify(r, null, 2)),
                  children: [/* @__PURE__ */ (0, n.jsx)(rp, { size: 15 }), "匯出紀錄"]
                }), /* @__PURE__ */ (0, n.jsx)("button", {
                  className: "icon-btn bordered",
                  title: r.archived ? "還原專案" : "封存專案",
                  "aria-label": r.archived ? "還原專案" : "封存專案",
                  onClick: () => {
                    V({}), G("archive");
                  },
                  children: r.archived ? /* @__PURE__ */ (0, n.jsx)(rm, { size: 17 }) : /* @__PURE__ */ (0, n.jsx)(Lh, { size: 17 })
                })] })
              })]
            }),
            ae ? /* @__PURE__ */ (0, n.jsxs)("div", {
              className: "empty",
              children: [/* @__PURE__ */ (0, n.jsx)(qu, {
                className: "spin",
                size: 26
              }), /* @__PURE__ */ (0, n.jsx)("h3", { children: "讀取製作進度" })]
            }) : r ? /* @__PURE__ */ (0, n.jsxs)(n.Fragment, { children: [
              /* @__PURE__ */ (0, n.jsxs)("section", {
                className: "project-banner",
                children: [/* @__PURE__ */ (0, n.jsxs)("div", {
                  className: "project-title",
                  children: [/* @__PURE__ */ (0, n.jsx)("span", {
                    className: "episode",
                    children: r.episode
                  }), /* @__PURE__ */ (0, n.jsxs)("div", { children: [/* @__PURE__ */ (0, n.jsxs)("h2", { children: [_ ? _.title + " · " + r.episode : r.title, r.archived && /* @__PURE__ */ (0, n.jsx)("span", {
                    className: "status todo",
                    children: "已封存"
                  })] }), /* @__PURE__ */ (0, n.jsxs)("p", { children: [
                    "更新於 ",
                    Pa(r.updatedAt),
                    " ",
                    /* @__PURE__ */ (0, n.jsx)("span", { children: "·" }),
                    " 紀錄版本 ",
                    r.revision
                  ] })] })]
                }), /* @__PURE__ */ (0, n.jsxs)("div", {
                  className: "project-progress",
                  children: [/* @__PURE__ */ (0, n.jsxs)("div", { children: [/* @__PURE__ */ (0, n.jsx)("span", { children: "本集製作狀態" }), /* @__PURE__ */ (0, n.jsx)("strong", { children: De ? "作者告知已完成" : Mt?.status === "in_progress" ? "作者告知製作中" : Mt?.status === "not_started" ? "作者告知尚未開始" : "尚未登記" })] }), /* @__PURE__ */ (0, n.jsx)("small", { children: De ? "目前進行資料補登與來源對應" : "依本集作者告知紀錄顯示" })]
                })]
              }),
              j !== "resume" && /* @__PURE__ */ (0, n.jsxs)("details", {
                className: "registration-detail",
                children: [
                  /* @__PURE__ */ (0, n.jsx)("summary", { children: "查看資料登記統計" }),
                  /* @__PURE__ */ (0, n.jsxs)("div", {
                    className: "metrics",
                    children: [
                      /* @__PURE__ */ (0, n.jsxs)("div", { children: [/* @__PURE__ */ (0, n.jsx)("span", {
                        className: "metric-icon green",
                        children: /* @__PURE__ */ (0, n.jsx)(an, { size: 20 })
                      }), /* @__PURE__ */ (0, n.jsxs)("div", { children: [/* @__PURE__ */ (0, n.jsxs)("b", { children: [el.acceptedSources, /* @__PURE__ */ (0, n.jsxs)("em", { children: [" / ", el.sources] })] }), /* @__PURE__ */ (0, n.jsx)("small", { children: "來源已確認收錄" })] })] }),
                      /* @__PURE__ */ (0, n.jsxs)("div", { children: [/* @__PURE__ */ (0, n.jsx)("span", {
                        className: "metric-icon blue",
                        children: /* @__PURE__ */ (0, n.jsx)(Ru, { size: 20 })
                      }), /* @__PURE__ */ (0, n.jsxs)("div", { children: [/* @__PURE__ */ (0, n.jsxs)("b", { children: [el.linkedShots, /* @__PURE__ */ (0, n.jsxs)("em", { children: [" / ", el.shots] })] }), /* @__PURE__ */ (0, n.jsx)("small", { children: "鏡頭來源關聯" })] })] }),
                      /* @__PURE__ */ (0, n.jsxs)("div", { children: [/* @__PURE__ */ (0, n.jsx)("span", {
                        className: "metric-icon amber",
                        children: /* @__PURE__ */ (0, n.jsx)(ha, { size: 20 })
                      }), /* @__PURE__ */ (0, n.jsxs)("div", { children: [/* @__PURE__ */ (0, n.jsx)("b", { children: el.registeredSelections || "待補登" }), /* @__PURE__ */ (0, n.jsx)("small", { children: "實際採用檔紀錄" })] })] }),
                      /* @__PURE__ */ (0, n.jsxs)("div", { children: [/* @__PURE__ */ (0, n.jsx)("span", {
                        className: "metric-icon red",
                        children: /* @__PURE__ */ (0, n.jsx)(tn, { size: 20 })
                      }), /* @__PURE__ */ (0, n.jsxs)("div", { children: [/* @__PURE__ */ (0, n.jsx)("b", { children: Pe.length }), /* @__PURE__ */ (0, n.jsx)("small", { children: "已登記退修問題" })] })] })
                    ]
                  }),
                  /* @__PURE__ */ (0, n.jsxs)("details", {
                    className: "registration-detail",
                    children: [/* @__PURE__ */ (0, n.jsx)("summary", { children: "逐項檢視與入片登記" }), /* @__PURE__ */ (0, n.jsxs)("p", { children: [
                      h.approved,
                      " / ",
                      h.total,
                      " 階段已登記逐項核定；",
                      h.inTimeline,
                      " / ",
                      h.shots,
                      " 列鏡頭已登記工程入出點。",
                      De ? "本集已按作者告知完成登記；以上為資料紀錄覆蓋情形，不代表製作完成比例。" : "作者告知、逐項檢視與資料收錄分別保存。"
                    ] })]
                  })
                ]
              }),
              [
                "main",
                "op",
                "ed",
                "shots",
                "issues"
              ].includes(j) && /* @__PURE__ */ (0, n.jsx)("nav", {
                className: "section-nav",
                "aria-label": "動畫製作內容",
                children: Sl.filter(([f]) => [
                  "main",
                  "op",
                  "ed",
                  "shots",
                  "issues"
                ].includes(f)).map(([f, se]) => /* @__PURE__ */ (0, n.jsxs)("button", {
                  className: j === f ? "active" : "",
                  "aria-current": j === f ? "page" : void 0,
                  onClick: () => nt(f),
                  children: [se, f === "issues" && Pe.length > 0 ? " · " + Pe.length : ""]
                }, f))
              }),
              j === "resume" ? /* @__PURE__ */ (0, n.jsx)(Mm, {
                project: r,
                work: _,
                busy: L,
                onNavigate: nt,
                onModel: (f) => {
                  X(f), nt("models");
                }
              }) : j === "project" ? /* @__PURE__ */ (0, n.jsx)(Lm, {
                work: _,
                episode: r,
                episodes: v,
                busy: L,
                onWorkAction: ht,
                onSelectEpisode: (f) => ke(() => {
                  xe(f);
                }),
                onPin: (f) => Ze("pin_shared_reference", { assetId: f }),
                mutate: Ze
              }, r.id) : j === "models" ? /* @__PURE__ */ (0, n.jsx)(Ym, {
                initialSelection: U,
                work: _,
                episode: r,
                episodes: v,
                busy: L,
                onAction: ht,
                onProject: () => nt("project"),
                onDirty: x
              }, (_?.id || r.id) + JSON.stringify(U)) : j === "settings" ? /* @__PURE__ */ (0, n.jsx)(mp, {
                project: r,
                busy: L,
                mutate: Ze
              }, r.id) : j === "context" ? /* @__PURE__ */ (0, n.jsx)(qm, {
                project: r,
                mutate: Ze,
                busy: L
              }, r.id) : [
                "main",
                "op",
                "ed"
              ].includes(j) ? /* @__PURE__ */ (0, n.jsxs)(n.Fragment, { children: [
                /* @__PURE__ */ (0, n.jsxs)("div", {
                  className: "section-title",
                  children: [
                    /* @__PURE__ */ (0, n.jsx)("h2", { children: j === "main" ? "主線製作流程" : j.toUpperCase() + " 獨立製作支線" }),
                    /* @__PURE__ */ (0, n.jsx)("span", { children: j === "main" ? "每階段留下產出，再進行驗收" : "完成支線後接回全片驗收" }),
                    j !== "main" && /* @__PURE__ */ (0, n.jsxs)("label", {
                      className: "branch-toggle",
                      children: [/* @__PURE__ */ (0, n.jsx)("input", {
                        type: "checkbox",
                        checked: r.branches[j],
                        disabled: L || r.archived,
                        onChange: (f) => {
                          Ze("set_branches", {
                            ...r.branches,
                            [j]: f.target.checked
                          });
                        }
                      }), "納入本集"]
                    })
                  ]
                }),
                j !== "main" && !r.branches[j] ? /* @__PURE__ */ (0, n.jsxs)("div", {
                  className: "empty",
                  children: [
                    /* @__PURE__ */ (0, n.jsx)(Wn, { size: 30 }),
                    /* @__PURE__ */ (0, n.jsxs)("h3", { children: ["本集未納入 ", j.toUpperCase()] }),
                    /* @__PURE__ */ (0, n.jsx)("p", { children: "重新勾選「納入本集」即可保留並繼續原有紀錄。" })
                  ]
                }) : /* @__PURE__ */ (0, n.jsxs)("div", {
                  className: "flow-layout",
                  children: [/* @__PURE__ */ (0, n.jsxs)("div", {
                    className: "stage-list",
                    children: [Le.map((f, se) => {
                      const oe = r.stages[f.id], ut = ys(r, f.id).length > 0;
                      return /* @__PURE__ */ (0, n.jsxs)("button", {
                        className: "stage-item " + (k === f.id ? "selected" : "") + (oe.author ? " completed" : ""),
                        onClick: () => jl(f.id),
                        children: [
                          /* @__PURE__ */ (0, n.jsx)("span", {
                            className: "stage-number " + (oe.author ? "done" : ""),
                            children: oe.author ? /* @__PURE__ */ (0, n.jsx)(gs, { size: 17 }) : j === "main" ? f.id : String(se + 1).padStart(2, "0")
                          }),
                          /* @__PURE__ */ (0, n.jsxs)("div", { children: [
                            /* @__PURE__ */ (0, n.jsx)("small", { children: f.phase }),
                            /* @__PURE__ */ (0, n.jsx)("strong", { children: f.title }),
                            /* @__PURE__ */ (0, n.jsx)("span", {
                              className: "stage-label " + (oe.status === "needs_revision" ? "red-text" : ""),
                              children: De && !oe.author && oe.status === "todo" ? "已完成 · 待補登" : ut && !oe.author ? /* @__PURE__ */ (0, n.jsxs)(n.Fragment, { children: [/* @__PURE__ */ (0, n.jsx)(Ju, { size: 11 }), "待前階段核定"] }) : Zu[oe.status]
                            })
                          ] }),
                          /* @__PURE__ */ (0, n.jsx)(If, { size: 15 })
                        ]
                      }, f.id);
                    }), /* @__PURE__ */ (0, n.jsxs)("div", {
                      className: "legend",
                      children: [/* @__PURE__ */ (0, n.jsxs)("span", { children: [/* @__PURE__ */ (0, n.jsx)("i", { className: "legend-dot green-dot" }), "正式核定"] }), /* @__PURE__ */ (0, n.jsxs)("span", { children: [/* @__PURE__ */ (0, n.jsx)("i", { className: "legend-dot gray-dot" }), "待確認"] })]
                    })]
                  }), /* @__PURE__ */ (0, n.jsxs)("section", {
                    className: "detail-card",
                    children: [
                      /* @__PURE__ */ (0, n.jsxs)("div", {
                        className: "detail-top",
                        children: [/* @__PURE__ */ (0, n.jsxs)("div", { children: [/* @__PURE__ */ (0, n.jsx)("span", {
                          className: "eyebrow",
                          children: j === "main" ? "STAGE " + k : j.toUpperCase() + " · " + k.slice(2)
                        }), /* @__PURE__ */ (0, n.jsx)("h2", { children: F.title })] }), /* @__PURE__ */ (0, n.jsx)("span", {
                          className: "status " + _e.status,
                          children: De && _e.status === "todo" ? "已完成 · 明細待補登" : Zu[_e.status]
                        })]
                      }),
                      /* @__PURE__ */ (0, n.jsx)("p", {
                        className: "stage-description",
                        children: F.description
                      }),
                      w.length > 0 && /* @__PURE__ */ (0, n.jsxs)("div", {
                        className: "gate-notice",
                        children: [/* @__PURE__ */ (0, n.jsx)(Ju, { size: 16 }), /* @__PURE__ */ (0, n.jsxs)("span", { children: [
                          De ? "逐項紀錄尚缺：" : "正式核定前，需先完成：",
                          w.join("、"),
                          "。可直接補登產出依據。"
                        ] })]
                      }),
                      /* @__PURE__ */ (0, n.jsxs)("div", {
                        className: "output-box",
                        children: [/* @__PURE__ */ (0, n.jsx)(ha, { size: 19 }), /* @__PURE__ */ (0, n.jsxs)("div", { children: [/* @__PURE__ */ (0, n.jsx)("strong", { children: "本階段產出" }), /* @__PURE__ */ (0, n.jsx)("p", { children: F.output })] })]
                      }),
                      Kl(r.episodeRules ?? []).filter((f) => !f.stageIds.length || f.stageIds.includes(k)).map((f) => /* @__PURE__ */ (0, n.jsxs)("div", {
                        className: "context-mini",
                        children: [
                          /* @__PURE__ */ (0, n.jsxs)("b", { children: [
                            "本集採用規則 · ",
                            f.title,
                            " v",
                            f.version
                          ] }),
                          /* @__PURE__ */ (0, n.jsx)("p", { children: f.content }),
                          /* @__PURE__ */ (0, n.jsxs)("small", { children: [
                            "場次：",
                            f.sceneIds.join("、") || "全部",
                            " · 來源：",
                            f.source
                          ] })
                        ]
                      }, f.id)),
                      /* @__PURE__ */ (0, n.jsxs)("div", {
                        className: "checklist-heading",
                        children: [/* @__PURE__ */ (0, n.jsx)("h3", { children: De ? "逐項檢視紀錄" : "驗收確認" }), /* @__PURE__ */ (0, n.jsxs)("span", { children: [
                          pe.filter(Boolean).length,
                          " / ",
                          pe.length
                        ] })]
                      }),
                      /* @__PURE__ */ (0, n.jsx)("div", {
                        className: "checklist",
                        children: F.checks.map((f, se) => /* @__PURE__ */ (0, n.jsxs)("label", {
                          className: pe[se] ? "checked" : "",
                          children: [/* @__PURE__ */ (0, n.jsx)("input", {
                            type: "checkbox",
                            checked: pe[se] || !1,
                            disabled: L || r.archived,
                            onChange: (oe) => {
                              ie((ut) => ut.map((zt, Qt) => Qt === se ? oe.target.checked : zt)), x(!0);
                            }
                          }), /* @__PURE__ */ (0, n.jsx)("span", { children: f })]
                        }, se))
                      }),
                      /* @__PURE__ */ (0, n.jsxs)("label", {
                        className: "field-label",
                        htmlFor: "evidence",
                        children: [
                          /* @__PURE__ */ (0, n.jsx)(Fu, { size: 15 }),
                          "產出依據與位置 ",
                          /* @__PURE__ */ (0, n.jsx)("span", { children: "必填" })
                        ]
                      }),
                      /* @__PURE__ */ (0, n.jsx)("textarea", {
                        id: "evidence",
                        rows: 3,
                        placeholder: "貼上成果連結、檔案位置與參考版本；每行一筆。",
                        value: J,
                        disabled: r.archived,
                        onChange: (f) => {
                          b(f.target.value), x(!0);
                        }
                      }),
                      /* @__PURE__ */ (0, n.jsx)("small", {
                        className: "field-help",
                        children: "記錄位置方便追查；素材須實際開啟檢查後才能確認。"
                      }),
                      /* @__PURE__ */ (0, n.jsx)("label", {
                        className: "field-label",
                        htmlFor: "note",
                        children: "製作備註"
                      }),
                      /* @__PURE__ */ (0, n.jsx)("textarea", {
                        id: "note",
                        rows: 3,
                        placeholder: "記錄製作內容、修正方式與前後鏡頭的銜接。",
                        value: te,
                        disabled: r.archived,
                        onChange: (f) => {
                          be(f.target.value), x(!0);
                        }
                      }),
                      /* @__PURE__ */ (0, n.jsxs)("div", {
                        className: "reviews",
                        children: [/* @__PURE__ */ (0, n.jsxs)("div", { children: [/* @__PURE__ */ (0, n.jsxs)("span", {
                          className: "review-title",
                          children: [/* @__PURE__ */ (0, n.jsx)(Hu, { size: 15 }), "AI 初驗"]
                        }), _e.ai ? /* @__PURE__ */ (0, n.jsxs)(n.Fragment, { children: [
                          /* @__PURE__ */ (0, n.jsx)("b", {
                            className: _e.ai.verdict === "pass" ? "green-text" : "red-text",
                            children: _e.ai.verdict === "pass" ? "初驗通過" : "需修正"
                          }),
                          /* @__PURE__ */ (0, n.jsx)("p", { children: _e.ai.note }),
                          /* @__PURE__ */ (0, n.jsxs)("small", { children: [
                            Pa(_e.ai.at),
                            " · ",
                            _e.ai.by
                          ] })
                        ] }) : /* @__PURE__ */ (0, n.jsx)("p", {
                          className: "muted",
                          children: "尚未收到 AI 初驗"
                        })] }), /* @__PURE__ */ (0, n.jsxs)("div", { children: [/* @__PURE__ */ (0, n.jsxs)("span", {
                          className: "review-title",
                          children: [/* @__PURE__ */ (0, n.jsx)(an, { size: 15 }), "作者正式核定"]
                        }), _e.author ? /* @__PURE__ */ (0, n.jsxs)(n.Fragment, { children: [
                          /* @__PURE__ */ (0, n.jsx)("b", {
                            className: "green-text",
                            children: "已核定"
                          }),
                          /* @__PURE__ */ (0, n.jsx)("p", { children: _e.author.note || "已確認本階段成果與驗收條件" }),
                          /* @__PURE__ */ (0, n.jsxs)("small", { children: [
                            Pa(_e.author.at),
                            " · ",
                            _e.author.by
                          ] })
                        ] }) : /* @__PURE__ */ (0, n.jsx)("p", {
                          className: "muted",
                          children: De ? "作者已告知本集完成；逐項檢視依據尚待補登。" : "尚未登記逐項確認"
                        })] })]
                      }),
                      /* @__PURE__ */ (0, n.jsxs)("div", {
                        className: "detail-actions",
                        children: [/* @__PURE__ */ (0, n.jsxs)("button", {
                          className: "text-btn danger-text",
                          disabled: L || r.archived,
                          onClick: () => {
                            V({
                              stageId: k,
                              reason: "",
                              shotId: ""
                            }), G("issue");
                          },
                          children: [/* @__PURE__ */ (0, n.jsx)(tn, { size: 15 }), "記錄退修"]
                        }), /* @__PURE__ */ (0, n.jsxs)("div", { children: [/* @__PURE__ */ (0, n.jsxs)("button", {
                          className: "btn",
                          disabled: L || r.archived || !Te,
                          onClick: () => {
                            Ze("save_stage", {
                              stageId: k,
                              checks: pe,
                              evidence: J,
                              note: te
                            });
                          },
                          children: [
                            L ? /* @__PURE__ */ (0, n.jsx)(qu, {
                              size: 15,
                              className: "spin"
                            }) : null,
                            "儲存草稿",
                            Te ? " *" : ""
                          ]
                        }), /* @__PURE__ */ (0, n.jsxs)("button", {
                          className: "btn primary",
                          disabled: L || r.archived || Te || Xt.length > 0 || !!_e.author,
                          onClick: () => {
                            Ze("approve_stage", {
                              stageId: k,
                              note: "作者已核對產出與全部驗收條件"
                            });
                          },
                          children: [/* @__PURE__ */ (0, n.jsx)(an, { size: 15 }), _e.author ? "已正式核定" : "作者確認通過"]
                        })] })]
                      }),
                      !_e.author && /* @__PURE__ */ (0, n.jsx)("div", {
                        className: "gate-reasons",
                        children: De ? "本集維持作者告知完成；此處保存逐項檢視依據，不要求重新確認整集。" : Te ? "先儲存修改，再確認通過。" : Xt.length ? "待完成：" + Xt.join("；") : "已符合檢查條件，請實際檢視成果後確認通過。"
                      })
                    ]
                  }, k)]
                }),
                j === "main" && /* @__PURE__ */ (0, n.jsxs)("div", {
                  className: "principle",
                  children: [/* @__PURE__ */ (0, n.jsx)(Wn, { size: 19 }), /* @__PURE__ */ (0, n.jsxs)("div", { children: [/* @__PURE__ */ (0, n.jsx)("b", { children: "發現問題，就回到造成問題的環節。" }), /* @__PURE__ */ (0, n.jsx)("p", { children: "更新已核定的製作依據時，相關下游階段會標為待修正。AI 初驗與作者核定各自留存。" })] })]
                }),
                /* @__PURE__ */ (0, n.jsxs)("details", {
                  className: "manual-rules",
                  children: [/* @__PURE__ */ (0, n.jsx)("summary", { children: "歷史製作經驗（不作為目前有效設定）" }), /* @__PURE__ */ (0, n.jsxs)("div", {
                    className: "manual-rule-content",
                    children: [
                      /* @__PURE__ */ (0, n.jsx)("h3", { children: "場景定位" }),
                      Fn.scenePosition.map((f) => /* @__PURE__ */ (0, n.jsx)("p", { children: f }, f)),
                      /* @__PURE__ */ (0, n.jsx)("h3", { children: "生圖提示詞順序" }),
                      /* @__PURE__ */ (0, n.jsx)("p", { children: Fn.imagePrompt }),
                      /* @__PURE__ */ (0, n.jsx)("h3", { children: "影片提示詞順序" }),
                      /* @__PURE__ */ (0, n.jsx)("p", { children: Fn.videoPrompt }),
                      /* @__PURE__ */ (0, n.jsx)("h3", { children: "失敗時回查" }),
                      Fn.repairs.map((f) => /* @__PURE__ */ (0, n.jsx)("p", { children: f }, f)),
                      /* @__PURE__ */ (0, n.jsx)("h3", { children: "本集專用條件" }),
                      /* @__PURE__ */ (0, n.jsx)("p", { children: "請從「本集規則與採用」取得指定版本；前一集的劇情條件不自動沿用。" }),
                      /* @__PURE__ */ (0, n.jsx)("h3", { children: "素材編號" }),
                      /* @__PURE__ */ (0, n.jsx)("p", { children: "每集保留自己的素材編號與明確對照，不依編號相近猜配。" }),
                      /* @__PURE__ */ (0, n.jsxs)("p", { children: ["後續檔名範例：", Fn.filenames.map((f) => f.replace("EP01", r.episode)).join("、")] })
                    ]
                  })]
                })
              ] }) : j === "shots" ? /* @__PURE__ */ (0, n.jsxs)("section", {
                className: "wide-card",
                children: [
                  /* @__PURE__ */ (0, n.jsxs)("div", {
                    className: "section-title",
                    children: [/* @__PURE__ */ (0, n.jsxs)("div", { children: [/* @__PURE__ */ (0, n.jsx)("h2", { children: "製作素材總表" }), /* @__PURE__ */ (0, n.jsx)("p", { children: "依鏡頭串起參考版本、素材位置、舊編號與成片時間。" })] }), /* @__PURE__ */ (0, n.jsxs)("button", {
                      className: "btn primary",
                      disabled: r.archived,
                      onClick: () => {
                        V({}), G("shot");
                      },
                      children: [/* @__PURE__ */ (0, n.jsx)(ln, { size: 16 }), "新增鏡頭"]
                    })]
                  }),
                  /* @__PURE__ */ (0, n.jsxs)("div", {
                    className: "search",
                    children: [/* @__PURE__ */ (0, n.jsx)(pm, { size: 16 }), /* @__PURE__ */ (0, n.jsx)("input", {
                      "aria-label": "搜尋鏡頭",
                      placeholder: "搜尋場次、鏡頭 ID 或舊編號…",
                      value: ye,
                      onChange: (f) => Ee(f.target.value)
                    })]
                  }),
                  r.shots.length ? /* @__PURE__ */ (0, n.jsx)("div", {
                    className: "table-scroll",
                    children: /* @__PURE__ */ (0, n.jsxs)("table", { children: [/* @__PURE__ */ (0, n.jsx)("thead", { children: /* @__PURE__ */ (0, n.jsxs)("tr", { children: [
                      /* @__PURE__ */ (0, n.jsx)("th", { children: "鏡頭／場次" }),
                      /* @__PURE__ */ (0, n.jsx)("th", { children: "內容與編號對照" }),
                      /* @__PURE__ */ (0, n.jsx)("th", { children: "參考版本" }),
                      /* @__PURE__ */ (0, n.jsx)("th", { children: "採用／剪輯版本" }),
                      /* @__PURE__ */ (0, n.jsx)("th", { children: "狀態" }),
                      /* @__PURE__ */ (0, n.jsx)("th", { children: "操作" })
                    ] }) }), /* @__PURE__ */ (0, n.jsx)("tbody", { children: r.shots.filter((f) => [
                      f.id,
                      f.scene,
                      f.description,
                      f.legacyIds
                    ].join(" ").includes(ye)).map((f) => /* @__PURE__ */ (0, n.jsxs)("tr", { children: [
                      /* @__PURE__ */ (0, n.jsxs)("td", { children: [/* @__PURE__ */ (0, n.jsx)("b", { children: f.id }), /* @__PURE__ */ (0, n.jsx)("small", { children: f.scene })] }),
                      /* @__PURE__ */ (0, n.jsxs)("td", { children: [f.description, /* @__PURE__ */ (0, n.jsxs)("small", { children: [
                        f.legacyIds || "未填舊編號",
                        " · ",
                        f.versions.length + 1,
                        " 次紀錄"
                      ] })] }),
                      /* @__PURE__ */ (0, n.jsxs)("td", { children: [/* @__PURE__ */ (0, n.jsxs)("small", { children: ["劇本 ", f.scriptVersion || "—"] }), /* @__PURE__ */ (0, n.jsxs)("small", { children: [
                        "角色 ",
                        f.characterVersion || "—",
                        "／場景 ",
                        f.sceneVersion || "—"
                      ] })] }),
                      /* @__PURE__ */ (0, n.jsxs)("td", { children: [f.adoptedVersion || "尚未採用", /* @__PURE__ */ (0, n.jsxs)("small", { children: [
                        f.editorVersion || "—",
                        " · ",
                        f.inPoint || "—",
                        " → ",
                        f.outPoint || "—"
                      ] })] }),
                      /* @__PURE__ */ (0, n.jsx)("td", { children: /* @__PURE__ */ (0, n.jsx)("span", {
                        className: "status " + f.status,
                        children: Zu[f.status]
                      }) }),
                      /* @__PURE__ */ (0, n.jsx)("td", { children: /* @__PURE__ */ (0, n.jsxs)("div", {
                        className: "table-actions",
                        children: [/* @__PURE__ */ (0, n.jsx)("button", {
                          className: "text-btn",
                          disabled: r.archived,
                          onClick: () => {
                            V(Object.fromEntries(cp.map(([se]) => [se, f[se]]))), G("shot");
                          },
                          children: "查看／編輯"
                        }), f.author ? f.status !== "in_timeline" ? /* @__PURE__ */ (0, n.jsx)("button", {
                          className: "text-btn",
                          disabled: L || r.archived,
                          onClick: () => {
                            Ze("timeline_shot", { shotId: f.id });
                          },
                          children: "確認已入片"
                        }) : null : /* @__PURE__ */ (0, n.jsx)("button", {
                          className: "text-btn",
                          disabled: L || r.archived,
                          onClick: () => {
                            Ze("approve_shot", { shotId: f.id });
                          },
                          children: "核定素材"
                        })]
                      }) })
                    ] }, f.id)) })] })
                  }) : /* @__PURE__ */ (0, n.jsxs)("div", {
                    className: "empty",
                    children: [
                      /* @__PURE__ */ (0, n.jsx)(Ru, { size: 32 }),
                      /* @__PURE__ */ (0, n.jsx)("h3", { children: "先建立一個實際鏡頭" }),
                      /* @__PURE__ */ (0, n.jsx)("p", { children: "不同來源的鏡號與素材編號填入對照欄，保留原始名稱。" })
                    ]
                  }),
                  /* @__PURE__ */ (0, n.jsx)("div", {
                    className: "inline-note",
                    children: "新版本會保留前次紀錄；填寫檔案位置不會上傳或覆寫原始素材。鏡頭更新後須重新核定。"
                  })
                ]
              }) : j === "issues" ? /* @__PURE__ */ (0, n.jsxs)("section", {
                className: "wide-card",
                children: [/* @__PURE__ */ (0, n.jsxs)("div", {
                  className: "section-title",
                  children: [/* @__PURE__ */ (0, n.jsxs)("div", { children: [/* @__PURE__ */ (0, n.jsx)("h2", { children: "退修與複核" }), /* @__PURE__ */ (0, n.jsx)("p", { children: "保留原因、受影響階段及修正結果。" })] }), /* @__PURE__ */ (0, n.jsxs)("button", {
                    className: "btn",
                    disabled: r.archived,
                    onClick: () => {
                      V({
                        stageId: "08",
                        reason: "",
                        shotId: ""
                      }), G("issue");
                    },
                    children: [/* @__PURE__ */ (0, n.jsx)(ln, { size: 16 }), "新增問題"]
                  })]
                }), r.issues.length ? /* @__PURE__ */ (0, n.jsx)("div", {
                  className: "issue-list",
                  children: [...r.issues].reverse().map((f) => /* @__PURE__ */ (0, n.jsxs)("article", {
                    className: "issue-card",
                    children: [
                      /* @__PURE__ */ (0, n.jsxs)("div", {
                        className: "issue-top",
                        children: [
                          /* @__PURE__ */ (0, n.jsx)("span", {
                            className: "status " + (f.status === "open" ? "needs_revision" : "passed"),
                            children: f.status === "open" ? "待修正" : "已複核結案"
                          }),
                          /* @__PURE__ */ (0, n.jsxs)("b", { children: [
                            f.stageId,
                            " ",
                            Vt.find((se) => se.id === f.stageId)?.title,
                            " ",
                            f.shotId ? "／" + f.shotId : ""
                          ] }),
                          /* @__PURE__ */ (0, n.jsx)("time", { children: Pa(f.at) })
                        ]
                      }),
                      /* @__PURE__ */ (0, n.jsx)("p", { children: f.reason }),
                      /* @__PURE__ */ (0, n.jsx)("small", { children: f.by }),
                      f.resolution && /* @__PURE__ */ (0, n.jsxs)("div", {
                        className: "resolution",
                        children: [/* @__PURE__ */ (0, n.jsx)(gs, { size: 15 }), f.resolution]
                      }),
                      f.status === "open" && /* @__PURE__ */ (0, n.jsx)("button", {
                        className: "btn",
                        disabled: r.archived,
                        onClick: () => {
                          V({
                            issueId: f.id,
                            resolution: ""
                          }), G("resolve");
                        },
                        children: "填寫修正並複核"
                      })
                    ]
                  }, f.id))
                }) : /* @__PURE__ */ (0, n.jsxs)("div", {
                  className: "empty",
                  children: [
                    /* @__PURE__ */ (0, n.jsx)(gs, { size: 32 }),
                    /* @__PURE__ */ (0, n.jsx)("h3", { children: "目前沒有退修問題" }),
                    /* @__PURE__ */ (0, n.jsx)("p", { children: "發現問題時，請指定造成問題的階段。" })
                  ]
                })]
              }) : j === "chatgpt" ? /* @__PURE__ */ (0, n.jsx)(Om, {
                project: r,
                check: () => Me("")
              }) : /* @__PURE__ */ (0, n.jsxs)("section", {
                className: "wide-card",
                children: [/* @__PURE__ */ (0, n.jsxs)("div", {
                  className: "section-title",
                  children: [/* @__PURE__ */ (0, n.jsxs)("div", { children: [/* @__PURE__ */ (0, n.jsx)("h2", { children: "製作異動紀錄" }), /* @__PURE__ */ (0, n.jsx)("p", { children: "作者與 ChatGPT 的更新分別標記，依時間保留。" })] }), /* @__PURE__ */ (0, n.jsxs)("span", {
                    className: "muted",
                    children: [r.audit.length, " 筆"]
                  })]
                }), /* @__PURE__ */ (0, n.jsx)("div", {
                  className: "audit-list",
                  children: [...r.audit].reverse().map((f, se) => /* @__PURE__ */ (0, n.jsxs)("div", { children: [
                    /* @__PURE__ */ (0, n.jsx)("span", {
                      className: "audit-icon " + (f.actor === "ai" ? "ai" : ""),
                      children: f.actor === "ai" ? /* @__PURE__ */ (0, n.jsx)(Hu, { size: 17 }) : /* @__PURE__ */ (0, n.jsx)(an, { size: 17 })
                    }),
                    /* @__PURE__ */ (0, n.jsxs)("div", { children: [/* @__PURE__ */ (0, n.jsxs)("b", { children: [
                      {
                        create_project: "建立製作專案",
                        save_stage: "更新階段產出",
                        approve_stage: "作者正式核定",
                        ai_review: "AI 初驗",
                        add_issue: "記錄退修問題",
                        resolve_issue: "修正複核結案",
                        save_shot: "更新鏡頭素材",
                        approve_shot: "核定鏡頭素材",
                        timeline_shot: "確認鏡頭入片",
                        set_branches: "更新支線範圍",
                        archive: "封存專案",
                        restore: "還原專案"
                      }[f.action] || f.action,
                      " ",
                      /* @__PURE__ */ (0, n.jsx)("span", { children: f.detail })
                    ] }), /* @__PURE__ */ (0, n.jsx)("small", { children: f.by })] }),
                    /* @__PURE__ */ (0, n.jsx)("time", { children: Pa(f.at) })
                  ] }, se))
                })]
              })
            ] }) : /* @__PURE__ */ (0, n.jsxs)("div", {
              className: "onboarding",
              children: [
                /* @__PURE__ */ (0, n.jsx)("div", {
                  className: "onboarding-icon",
                  children: /* @__PURE__ */ (0, n.jsx)(vs, { size: 34 })
                }),
                /* @__PURE__ */ (0, n.jsx)("div", {
                  className: "eyebrow",
                  children: "從製作依據開始"
                }),
                /* @__PURE__ */ (0, n.jsx)("h2", { children: "把動畫製作，串成可確認的流程。" }),
                /* @__PURE__ */ (0, n.jsxs)("p", { children: [
                  "十二個主線階段、OP 與 ED 支線，搭配素材對照與退修紀錄。",
                  /* @__PURE__ */ (0, n.jsx)("br", {}),
                  "ChatGPT 與你共用進度，正式驗收由你確認。"
                ] }),
                /* @__PURE__ */ (0, n.jsxs)("button", {
                  className: "btn primary",
                  onClick: () => {
                    V({
                      title: "現實遊戲",
                      episode: "EP01"
                    }), G("create");
                  },
                  children: [/* @__PURE__ */ (0, n.jsx)(ln, { size: 17 }), "建立第一個製作專案"]
                }),
                /* @__PURE__ */ (0, n.jsx)("div", {
                  className: "onboarding-grid",
                  children: Vt.filter((f) => f.group === "main").map((f) => /* @__PURE__ */ (0, n.jsxs)("div", { children: [/* @__PURE__ */ (0, n.jsx)("span", { children: f.id }), f.title] }, f.id))
                }),
                /* @__PURE__ */ (0, n.jsx)("small", { children: "建立時全部階段為待製作；請依實際成果補入完成紀錄。" })
              ]
            }),
            /* @__PURE__ */ (0, n.jsxs)("footer", { children: ["製作工作台 ", /* @__PURE__ */ (0, n.jsx)("span", { children: "工作紀錄自動保存版本 · v5.0" })] })
          ]
        })]
      }),
      ce && /* @__PURE__ */ (0, n.jsxs)("div", {
        className: "toast",
        role: "status",
        children: [/* @__PURE__ */ (0, n.jsx)(gs, { size: 17 }), ce]
      }),
      Q && /* @__PURE__ */ (0, n.jsx)("div", {
        className: "modal-backdrop",
        onMouseDown: (f) => {
          f.target === f.currentTarget && !L && G(null);
        },
        children: /* @__PURE__ */ (0, n.jsxs)("section", {
          className: "modal " + (Q === "shot" ? "large" : ""),
          role: "dialog",
          "aria-modal": "true",
          "aria-label": Q === "create" ? "建立製作專案" : Q === "shot" ? "鏡頭素材紀錄" : "製作確認",
          children: [/* @__PURE__ */ (0, n.jsxs)("div", {
            className: "modal-head",
            children: [/* @__PURE__ */ (0, n.jsx)("h2", { children: Q === "create" ? "建立製作專案" : Q === "shot" ? "鏡頭素材紀錄" : Q === "issue" ? "記錄退修問題" : Q === "resolve" ? "修正與複核結果" : r?.archived ? "還原專案" : "封存專案" }), /* @__PURE__ */ (0, n.jsx)("button", {
              className: "icon-btn",
              "aria-label": "關閉視窗",
              disabled: L,
              onClick: () => G(null),
              children: /* @__PURE__ */ (0, n.jsx)(Wf, { size: 21 })
            })]
          }), /* @__PURE__ */ (0, n.jsxs)("form", {
            onSubmit: It,
            children: [
              Q === "create" ? /* @__PURE__ */ (0, n.jsxs)(n.Fragment, { children: [/* @__PURE__ */ (0, n.jsx)("p", {
                className: "muted",
                children: "依手冊建立完整流程，從待製作開始記錄。"
              }), [["title", "專案名稱"], ["episode", "集數"]].map(([f, se]) => /* @__PURE__ */ (0, n.jsxs)("label", {
                className: "form-field",
                children: [se, /* @__PURE__ */ (0, n.jsx)("input", {
                  required: !0,
                  maxLength: f === "title" ? 200 : 60,
                  value: O[f] || "",
                  onChange: (oe) => V({
                    ...O,
                    [f]: oe.target.value
                  })
                })]
              }, f))] }) : Q === "shot" ? /* @__PURE__ */ (0, n.jsxs)(n.Fragment, { children: [
                /* @__PURE__ */ (0, n.jsx)("p", {
                  className: "muted",
                  children: "修改既有鏡頭請使用相同 ID。系統保留前次紀錄，並要求重新驗收。"
                }),
                /* @__PURE__ */ (0, n.jsx)("div", {
                  className: "shot-form",
                  children: cp.map(([f, se]) => /* @__PURE__ */ (0, n.jsxs)("label", {
                    className: "form-field",
                    children: [se, /* @__PURE__ */ (0, n.jsx)("input", {
                      required: [
                        "id",
                        "scene",
                        "description"
                      ].includes(f),
                      maxLength: f === "id" ? 100 : 12e3,
                      value: O[f] || "",
                      placeholder: f === "id" ? "如 EP01_S06_SH03" : "",
                      onChange: (oe) => V({
                        ...O,
                        [f]: oe.target.value
                      })
                    })]
                  }, f))
                }),
                r?.shots.find((f) => f.id === O.id)?.versions.length ? /* @__PURE__ */ (0, n.jsxs)("details", { children: [/* @__PURE__ */ (0, n.jsx)("summary", { children: "查看保留的舊版本" }), r.shots.find((f) => f.id === O.id).versions.map((f, se) => /* @__PURE__ */ (0, n.jsxs)("pre", { children: [
                  Pa(f.at),
                  " · ",
                  f.by,
                  `
`,
                  JSON.stringify(f.data, null, 2)
                ] }, se))] }) : null
              ] }) : Q === "issue" ? /* @__PURE__ */ (0, n.jsxs)(n.Fragment, { children: [
                /* @__PURE__ */ (0, n.jsxs)("label", {
                  className: "form-field",
                  children: ["回查階段", /* @__PURE__ */ (0, n.jsx)("select", {
                    value: O.stageId || "08",
                    onChange: (f) => V({
                      ...O,
                      stageId: f.target.value
                    }),
                    children: zs(r).map((f) => /* @__PURE__ */ (0, n.jsxs)("option", {
                      value: f.id,
                      children: [
                        f.id,
                        " ",
                        f.title
                      ]
                    }, f.id))
                  })]
                }),
                /* @__PURE__ */ (0, n.jsxs)("label", {
                  className: "form-field",
                  children: ["受影響鏡頭（選填）", /* @__PURE__ */ (0, n.jsxs)("select", {
                    value: O.shotId || "",
                    onChange: (f) => V({
                      ...O,
                      shotId: f.target.value
                    }),
                    children: [/* @__PURE__ */ (0, n.jsx)("option", {
                      value: "",
                      children: "整個階段"
                    }), r.shots.map((f) => /* @__PURE__ */ (0, n.jsx)("option", { children: f.id }, f.id))]
                  })]
                }),
                /* @__PURE__ */ (0, n.jsxs)("label", {
                  className: "form-field",
                  children: ["具體問題與回查原因", /* @__PURE__ */ (0, n.jsx)("textarea", {
                    required: !0,
                    rows: 5,
                    value: O.reason || "",
                    onChange: (f) => V({
                      ...O,
                      reason: f.target.value
                    })
                  })]
                }),
                /* @__PURE__ */ (0, n.jsx)("p", {
                  className: "muted",
                  children: "此階段與受影響的下游核定將標為待修正，修正後重新驗收。"
                })
              ] }) : Q === "resolve" ? /* @__PURE__ */ (0, n.jsxs)("label", {
                className: "form-field",
                children: ["已修正內容與複核依據", /* @__PURE__ */ (0, n.jsx)("textarea", {
                  required: !0,
                  rows: 6,
                  value: O.resolution || "",
                  onChange: (f) => V({
                    ...O,
                    resolution: f.target.value
                  })
                })]
              }) : /* @__PURE__ */ (0, n.jsxs)("p", { children: ["專案", r?.archived ? "還原後可繼續製作。" : "封存後會保留全部進度與紀錄，可隨時還原。"] }),
              ne && /* @__PURE__ */ (0, n.jsx)("div", {
                className: "modal-error",
                role: "alert",
                children: ne
              }),
              /* @__PURE__ */ (0, n.jsxs)("div", {
                className: "modal-actions",
                children: [/* @__PURE__ */ (0, n.jsx)("button", {
                  type: "button",
                  className: "btn",
                  disabled: L,
                  onClick: () => G(null),
                  children: "取消"
                }), /* @__PURE__ */ (0, n.jsxs)("button", {
                  type: "submit",
                  className: "btn primary",
                  disabled: L,
                  children: [L ? /* @__PURE__ */ (0, n.jsx)(qu, {
                    className: "spin",
                    size: 16
                  }) : null, Q === "create" ? "建立專案" : Q === "archive" ? r?.archived ? "還原專案" : "確認封存" : "儲存紀錄"]
                })]
              })
            ]
          })]
        })
      })
    ]
  });
}
var Qm = `
:host{--bg:#f7f8fa;--ink:#23322e;--muted:#85908b;--green:#326552;--border:#e4e9e6;--mint:#edf4ef;--font:'Noto Sans TC','PingFang TC','Microsoft JhengHei',system-ui,sans-serif}
*{box-sizing:border-box}body{margin:0;color:var(--ink);background:var(--bg);font-family:var(--font);font-size:14px;line-height:1.6}button,input,textarea,select{font:inherit}button,a,input,textarea,select{-webkit-tap-highlight-color:transparent}button{cursor:pointer}button:disabled{cursor:default;opacity:.45}a{color:inherit;text-decoration:none}button{border:0}input,textarea,select{color:var(--ink)}textarea{resize:vertical}button:focus-visible,a:focus-visible{outline:3px solid #9abfae;outline-offset:3px}input:focus,textarea:focus,select:focus{outline:2px solid #92b5a3;outline-offset:1px}h1,h2,h3,p{margin:0}h1,h2,h3{font-weight:650;letter-spacing:.01em}small{font-size:11px}.workspace{display:flex;min-height:100vh}.sidebar{width:244px;background:#fff;border-right:1px solid var(--border);position:fixed;inset:0 auto 0 0;display:flex;flex-direction:column;padding:27px 18px 20px;z-index:15}.brand{display:flex;gap:12px;align-items:center;padding:0 8px 35px}.brandmark{height:39px;width:39px;display:grid;place-items:center;border-radius:11px;background:#315b49;color:white;font-family:serif;font-size:25px}.brand strong{display:block;font-size:17px;letter-spacing:.07em}.brand small{display:block;font-size:8px;color:#8a968e;letter-spacing:.12em;margin-top:2px}.side-label{font-size:10px;color:#909b96;letter-spacing:.12em;padding:0 12px 12px}.project-switch{display:flex;align-items:center;gap:9px;border:1px solid var(--border);border-radius:8px;padding:9px;color:#557062;margin:0 4px}.project-switch select{font-size:12px;min-width:0;width:100%;border:0;background:transparent;outline:none}.new-project{display:flex;justify-content:center;align-items:center;gap:6px;color:#62786b;background:transparent;padding:11px;font-size:11px;margin-bottom:22px}nav{display:grid;gap:6px}.nav-item{display:flex;align-items:center;gap:12px;width:100%;padding:13px 13px;background:transparent;text-align:left;border-radius:7px;color:#708078;font-size:12px}.nav-item.active{color:#315d48;background:#edf3ef;font-weight:650}.nav-item.active:before{content:'';position:absolute;left:0;width:3px;height:24px;background:#4d7a61;border-radius:0 3px 3px 0}.count{margin-left:auto;background:#f8e6e0;color:#b77457;border-radius:4px;min-width:20px;text-align:center;font-size:10px}.new-tag{margin-left:auto;font-size:8px;background:#e9edea;padding:1px 5px;border-radius:4px}.side-bottom{margin-top:auto;padding:28px 9px 0}.manual-mini{display:flex;gap:10px;padding:14px 0 20px;border-bottom:1px solid var(--border);color:#7d8a82}.manual-mini b,.manual-mini span{display:block;font-size:11px}.manual-mini span{font-size:10px;margin-top:4px;color:#9da59f}.archive-toggle{display:flex;gap:7px;align-items:center;font-size:10px;color:#8b968f;margin:15px 0}.side-bottom a{font-size:11px;display:flex;gap:6px;align-items:center;color:#819087}.main{margin-left:244px;min-width:0;flex:1}.topbar{height:67px;background:#fff;border-bottom:1px solid var(--border);display:flex;justify-content:space-between;align-items:center;padding:0 38px}.breadcrumb{display:flex;align-items:center;gap:12px;font-size:11px;color:#8a958e}.breadcrumb span{color:#4f6257}.top-actions{display:flex;gap:19px;align-items:center}.cloud-indicator{display:flex;gap:7px;align-items:center;font-size:10px;color:#7e8e84}.cloud-indicator i{width:5px;height:5px;background:#6c987c;border-radius:50%}.icon-btn{background:transparent;display:grid;place-items:center;padding:8px;color:#73857a;border-radius:6px}.icon-btn:hover{background:#edf2ef}.page-content{max-width:1540px;margin:auto;padding:35px 38px 18px}.page-heading{display:flex;align-items:center;justify-content:space-between;margin-bottom:27px;gap:20px}.eyebrow{font-size:9px;font-weight:600;letter-spacing:.16em;color:#829186;margin-bottom:7px}h1{font-size:27px;display:flex;gap:10px;align-items:center;line-height:1.5}.version{font-size:9px;font-weight:500;letter-spacing:.01em;background:#e9edeb;color:#849389;border-radius:4px;padding:2px 6px}.page-heading p{font-size:11px;color:#8d9690;margin-top:5px}.heading-actions{display:flex;gap:8px}.btn{display:inline-flex;align-items:center;justify-content:center;gap:7px;border:1px solid #dce4de;border-radius:6px;background:#fff;padding:9px 13px;color:#62766a;font-size:11px;white-space:nowrap}.btn:hover{border-color:#87a393;background:#f9fbf9}.btn.primary{background:#365f4c;color:#fff;border-color:#365f4c}.btn.primary:hover{background:#244e3a}.btn.primary:disabled{background:#637c6d}.bordered{border:1px solid var(--border);background:#fff}.project-banner{border:1px solid #dae6de;background:linear-gradient(112deg,#f1f6f2,#eaf2ec);border-radius:10px;display:flex;justify-content:space-between;align-items:center;padding:24px 29px;margin-bottom:19px;gap:28px}.project-title{display:flex;gap:17px;align-items:center}.episode{height:47px;width:51px;background:white;border:1px solid #d9e5dc;display:grid;place-items:center;border-radius:8px;font-size:12px;font-weight:700;color:#587762;flex-shrink:0}.project-title h2{font-size:21px;display:flex;gap:10px;align-items:center}.project-title p{font-size:10px;color:#8b9a8f;margin-top:5px}.project-title p span{margin:0 7px}.project-progress{width:200px;flex-shrink:0}.project-progress>div:first-child{display:flex;justify-content:space-between;align-items:center}.project-progress span{font-size:10px;color:#718978}.project-progress b{font-size:23px;color:#476d55;font-weight:500}.project-progress b small{font-size:11px}.progress-track{height:4px;background:#dce8df;border-radius:9px;margin:5px 0}.progress-track i{display:block;height:4px;background:#71967c;border-radius:9px;transition:width .3s}.project-progress>small{display:block;text-align:right;color:#93a497;font-size:9px}.metrics{display:grid;grid-template-columns:repeat(4,1fr);gap:13px;margin-bottom:31px}.metrics>div{display:flex;gap:14px;align-items:center;background:#fff;border:1px solid var(--border);border-radius:8px;padding:17px 18px}.metric-icon{height:37px;width:37px;border-radius:9px;display:grid;place-items:center}.green{color:#5d8569;background:#edf4ef}.amber{color:#b49b6a;background:#faf5e9}.red{color:#bd8a79;background:#fbefeb}.blue{color:#849bb2;background:#eef3f7}.metrics b{font-size:23px;font-weight:550;line-height:1}.metrics em{font-size:11px;font-style:normal;font-weight:400;color:#b2b9b3}.metrics small{display:block;color:#8e9a92;font-size:10px;margin-top:5px}.section-title{display:flex;align-items:center;gap:13px;margin-bottom:17px}.section-title h2{font-size:15px}.section-title>span{font-size:10px;color:#9ca49e}.section-title p{font-size:11px;color:#98a098;margin-top:5px}.section-title>.btn{margin-left:auto}.branch-toggle{margin-left:auto;font-size:11px;display:flex;align-items:center;gap:6px;color:#617669}.flow-layout{display:grid;grid-template-columns:237px 1fr;gap:22px;align-items:start}.stage-list{background:#fff;border:1px solid var(--border);border-radius:9px;padding:11px}.stage-item{display:flex;gap:12px;align-items:center;padding:12px 10px;border-radius:7px;background:transparent;width:100%;text-align:left;position:relative}.stage-item:after{content:'';position:absolute;left:25px;bottom:-7px;height:18px;width:1px;background:#e6ebe7}.stage-item:last-of-type:after{display:none}.stage-item.selected{background:#edf4ef}.stage-item:hover{background:#f4f7f5}.stage-number{display:grid;place-items:center;flex-shrink:0;width:30px;height:30px;border:1px solid #e3e9e4;background:#fafbf9;color:#a2aca4;border-radius:50%;font-size:10px;position:relative;z-index:1}.stage-item.selected .stage-number{background:#487158;border-color:#487158;color:white}.stage-number.done{background:#e3efe6;color:#60846b;border-color:#e3efe6}.stage-item>div{flex:1}.stage-item small{font-size:8px;color:#a9b2ab;display:block}.stage-item strong{font-size:12px;display:block;font-weight:550;margin:1px 0}.stage-label{font-size:8px;color:#a2ada4;display:flex;gap:4px;align-items:center}.stage-item>svg{color:#bac7bd}.stage-item.selected strong{color:#3a674b}.legend{display:flex;justify-content:center;gap:16px;font-size:9px;color:#a5afa7;border-top:1px solid var(--border);padding:13px 0 3px;margin-top:10px}.legend span{display:flex;align-items:center;gap:5px}.legend-dot{width:5px;height:5px;border-radius:50%}.green-dot{background:#7c9d84}.gray-dot{background:#c3cbc5}.detail-card{background:#fff;border:1px solid var(--border);border-radius:9px;padding:27px 29px}.detail-top{display:flex;justify-content:space-between;align-items:center;margin-bottom:10px}.detail-top h2{font-size:23px}.status{display:inline-flex;align-items:center;white-space:nowrap;padding:3px 9px;border-radius:4px;font-size:9px;line-height:1.7}.status.todo{background:#f0f2ef;color:#95a095}.status.candidate{background:#fbf4e3;color:#ac935c}.status.passed,.status.in_timeline{background:#e8f2e9;color:#587d61}.status.needs_revision{background:#faebe5;color:#b47762}.stage-description{color:#89968c;font-size:11px;line-height:1.9;margin:10px 0 21px}.gate-notice{display:flex;gap:9px;align-items:flex-start;font-size:10px;color:#a68e61;background:#fbf7ed;border:1px solid #eee6d3;border-radius:6px;padding:10px 12px;margin-bottom:19px}.gate-notice svg{flex-shrink:0;margin-top:1px}.output-box{display:flex;gap:12px;background:#f5f8f5;border:1px solid #e8ede6;border-radius:7px;padding:15px;margin-bottom:26px;color:#6f8975}.output-box strong{font-size:11px;font-weight:550}.output-box p{font-size:10px;color:#91a08f;margin-top:4px}.checklist-heading{display:flex;justify-content:space-between;margin-bottom:10px}.checklist-heading h3{font-size:12px}.checklist-heading span{font-size:10px;color:#92a08f}.checklist{margin-bottom:24px;display:grid;gap:8px}.checklist label{display:flex;gap:10px;align-items:flex-start;cursor:pointer;padding:11px 12px;background:#fff;border:1px solid #e7ebe6;border-radius:6px;color:#7b8b7e;font-size:11px;line-height:1.8}.checklist label.checked{background:#f5f9f5;border-color:#cedfcf;color:#53705a}input[type=checkbox]{accent-color:#5f896c;width:14px;height:14px;flex-shrink:0;margin:3px 0 0}.field-label{font-size:11px;display:flex;align-items:center;gap:5px;margin:18px 0 8px;color:#607566}.field-label span{font-size:8px;color:#a6b0a6;margin-left:auto}textarea{display:block;width:100%;border:1px solid #e2e8e1;border-radius:6px;padding:11px 12px;font-size:11px;line-height:1.8;background:#fdfefd;min-height:65px}.field-help{display:block;font-size:9px;color:#a0aca1;margin-top:5px}.reviews{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:23px}.reviews>div{background:#fafbf9;border:1px solid #ecf0e9;border-radius:6px;padding:12px}.review-title{display:flex;align-items:center;gap:6px;font-size:10px;color:#7e9180;margin-bottom:9px}.reviews b{font-size:10px}.reviews p{font-size:10px;white-space:pre-wrap;margin-top:5px;word-break:break-word}.reviews small{display:block;font-size:8px;color:#a6b1a5;margin-top:5px}.muted{color:#9aa69a;font-size:11px}.green-text{color:#5b865e}.red-text,.danger-text{color:#b37a65!important}.detail-actions{margin-top:25px;display:flex;justify-content:space-between;gap:10px;align-items:center;padding-top:19px;border-top:1px solid var(--border)}.detail-actions>div{display:flex;gap:7px}.text-btn{display:inline-flex;align-items:center;gap:5px;padding:5px 0;font-size:10px;color:#6f8b73;background:transparent;white-space:nowrap}.gate-reasons{font-size:9px;line-height:1.9;color:#a3afa3;margin-top:12px;text-align:right}.principle{display:flex;align-items:center;gap:12px;background:#eef2ee;border:1px solid #e2e9df;border-radius:8px;padding:17px 20px;margin-top:21px;color:#7c907d}.principle b{font-size:11px;font-weight:550}.principle p{font-size:9px;color:#9aaa98;margin-top:3px}footer{font-size:8px;color:#abb4aa;margin:26px 0 0;display:flex;justify-content:space-between;gap:10px}footer span{font-size:8px}.empty{display:flex;align-items:center;justify-content:center;flex-direction:column;gap:9px;padding:65px 15px;color:#9eafa0;text-align:center}.empty h3{font-size:16px;color:#718975}.empty p{font-size:11px;color:#a4afa5}.onboarding{background:#fff;border:1px solid var(--border);border-radius:12px;text-align:center;padding:50px 25px}.onboarding-icon{background:#edf4ef;border:1px solid #dce8df;color:#5d8067;height:73px;width:73px;margin:0 auto 25px;border-radius:18px;display:grid;place-items:center}.onboarding h2{font-size:25px;margin-bottom:14px}.onboarding>p{color:#91a091;font-size:12px;line-height:2;margin-bottom:24px}.onboarding-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;max-width:730px;margin:35px auto 22px;text-align:left}.onboarding-grid>div{border:1px solid #e8ede7;background:#fbfcfa;border-radius:7px;padding:12px;color:#7b907e;font-size:11px;display:flex;gap:9px}.onboarding-grid span{color:#b3c0b1;font-size:10px}.onboarding>small{color:#aab4a6;font-size:10px}.wide-card{background:#fff;border:1px solid var(--border);border-radius:9px;padding:26px}.wide-card h2{font-size:19px}.search{display:flex;gap:10px;align-items:center;background:#f8faf7;border:1px solid #e6ece2;border-radius:7px;padding:9px 12px;color:#9aad96;margin-bottom:20px;max-width:400px}.search input{border:0;background:transparent;font-size:11px;width:100%;outline:none}.table-scroll{overflow-x:auto}table{width:100%;border-collapse:collapse;font-size:10px;text-align:left}th{font-size:9px;color:#a3b29c;letter-spacing:.05em;background:#f7faf5;font-weight:500;padding:12px 9px;border-bottom:1px solid #e6ece1}td{padding:16px 9px;border-bottom:1px solid #edf0ea;min-width:90px;max-width:260px}td small{display:block;color:#a8b2a2;font-size:8px;margin-top:4px}td b{font-size:11px}td .table-actions{display:flex;flex-direction:column;gap:4px;align-items:flex-start}.inline-note{font-size:10px;color:#a3b09c;border-top:1px solid var(--border);padding-top:16px;margin-top:17px}.issue-list{display:grid;gap:12px}.issue-card{border:1px solid var(--border);border-radius:7px;padding:18px}.issue-top{display:flex;gap:10px;align-items:center;flex-wrap:wrap}.issue-top b{font-size:11px}.issue-top time{margin-left:auto;font-size:9px;color:#a8b09f}.issue-card>p{font-size:12px;margin:14px 0;white-space:pre-wrap}.issue-card>small{font-size:9px;color:#a1b09c}.issue-card>.btn{display:block;margin-top:12px}.resolution{display:flex;gap:8px;color:#6d8e67;background:#f3f8ef;font-size:11px;padding:12px;margin-top:12px;white-space:pre-wrap}.audit-list>div{display:flex;gap:14px;padding:17px 0;border-bottom:1px solid var(--border);align-items:center}.audit-icon{width:33px;height:33px;border-radius:50%;display:grid;place-items:center;flex-shrink:0;background:#eef4ea;color:#7e9d72}.audit-icon.ai{background:#eef1fa;color:#8798b8}.audit-list b{font-size:11px}.audit-list b span{color:#8aa17d;margin-left:8px}.audit-list small{display:block;font-size:9px;color:#9cac94;margin-top:4px}.audit-list time{margin-left:auto;font-size:9px;color:#a7b29f;white-space:nowrap}.connection-layout{display:grid;grid-template-columns:1.6fr 1fr;gap:20px;align-items:start}.connection-symbol{display:flex;align-items:center;gap:20px;color:#73926b;padding:15px 0 30px}.connection-symbol svg:nth-child(2){color:#c3cfc0}.connection-state{display:flex;align-items:center;gap:12px;background:#f5f8f2;border:1px solid #e7ece1;padding:16px;border-radius:7px;margin:20px 0}.connection-state i{width:7px;height:7px;border-radius:50%}.online-dot{background:#709f62}.connection-state b{font-size:11px}.connection-state small{display:block;color:#a2b095;margin-top:4px;font-size:9px}.connect-steps{padding-left:22px;margin:25px 0;color:#7f9873}.connect-steps li{padding-left:9px;margin-bottom:20px}.connect-steps b{font-size:12px}.connect-steps p{font-size:10px;color:#a0ae97;line-height:1.9;margin-top:5px}.capability-card h3{font-size:13px;margin-bottom:22px}.capability-card>p{display:flex;align-items:center;gap:10px;font-size:11px;color:#8da180;margin:15px 0}.capability-card>p svg{color:#99b48b;flex-shrink:0}.author-only{border-top:1px solid var(--border);padding-top:22px;margin-top:25px;color:#779568}.author-only b{display:block;font-size:12px;margin:10px 0 6px}.author-only p{font-size:11px;color:#a1b294}.capability-card>small{display:block;color:#aebaa5;font-size:10px;margin-top:25px;line-height:1.9}.error-banner{display:flex;gap:10px;align-items:center;background:#fbede8;color:#ac745d;padding:12px 15px;border:1px solid #f0d8ca;border-radius:7px;margin-bottom:18px;font-size:12px}.error-banner>button{margin-left:auto;background:none;color:inherit}.error-banner a{text-decoration:underline;font-weight:bold}.toast{position:fixed;bottom:27px;left:calc(50% + 80px);transform:translateX(-50%);border:1px solid #d5e6cc;background:#f4fbef;box-shadow:0 5px 30px #37502b15;color:#6e955b;display:flex;gap:9px;align-items:center;padding:13px 22px;border-radius:9px;font-size:12px;z-index:55}.modal-backdrop{position:fixed;inset:0;background:#20332255;backdrop-filter:blur(3px);z-index:50;display:flex;align-items:center;justify-content:center;padding:20px}.modal{width:460px;max-height:90vh;overflow:auto;background:#fff;border-radius:12px;padding:25px;box-shadow:0 20px 90px #182e2340}.modal.large{width:800px}.modal-head{display:flex;justify-content:space-between;align-items:center;margin-bottom:15px}.modal-head h2{font-size:19px}.form-field{display:flex;flex-direction:column;gap:7px;font-size:11px;color:#7f9672;margin-top:16px}.form-field input,.form-field select{width:100%;padding:10px 12px;border:1px solid #dee8d8;border-radius:6px;background:#fcfefa;font-size:12px}.form-field textarea{font-size:12px}.shot-form{display:grid;grid-template-columns:1fr 1fr;gap:0 17px}.modal-actions{display:flex;justify-content:flex-end;gap:8px;border-top:1px solid var(--border);padding-top:20px;margin-top:25px}.modal-error{color:#b7735e;background:#fbefe7;padding:10px;border-radius:5px;font-size:11px;margin-top:15px}details{font-size:11px;margin-top:20px;color:#7d9570}pre{font-size:10px;white-space:pre-wrap;word-break:break-all;padding:10px;background:#f7faf4}.spin{animation:spin 1s linear infinite}@keyframes spin{to{transform:rotate(360deg)}}
@media(min-width:1500px){.page-content{padding-top:40px}.detail-card{padding:30px 36px}.stage-item{padding-top:13px;padding-bottom:13px}}
@media(max-width:1150px){.sidebar{width:210px;padding-left:12px;padding-right:12px}.main{margin-left:210px}.page-content{padding:26px 24px 15px}.topbar{padding:0 24px}.flow-layout{grid-template-columns:205px 1fr;gap:16px}.detail-card{padding:23px 20px}.metrics>div{padding:14px 12px;gap:10px}.metrics b{font-size:20px}.metric-icon{width:30px;height:30px}.detail-actions{flex-wrap:wrap}.detail-actions>div{margin-left:auto}.connection-layout{grid-template-columns:1fr}}
@media(max-width:850px){.sidebar{width:180px;padding:23px 10px}.brand{padding:0 6px 27px;gap:8px}.brand strong{font-size:13px}.brand small{font-size:6px}.brandmark{height:32px;width:32px;font-size:20px}.main{margin-left:180px}.flow-layout{grid-template-columns:1fr}.stage-list{display:grid;grid-template-columns:repeat(3,1fr);gap:4px}.stage-item{padding:7px;gap:6px}.stage-item small{display:none}.stage-item strong{font-size:10px}.stage-item>svg{display:none}.stage-item:after{display:none}.stage-number{width:24px;height:24px;font-size:9px}.stage-label{font-size:7px}.legend{display:none}.stage-item.selected{box-shadow:inset 0 0 0 1px #b1c9b4}.project-progress{width:135px}.metrics{grid-template-columns:repeat(2,1fr);gap:9px}.metrics>div{padding:15px}.project-title h2{font-size:18px}.project-banner{padding:20px}.project-title{gap:11px}.project-title p{font-size:8px}.project-title p span{margin:0 4px}.onboarding-grid{grid-template-columns:repeat(3,1fr)}footer span{display:none}.heading-actions{align-self:flex-end}.page-heading{gap:10px}h1{font-size:23px}.heading-actions>.btn{font-size:10px;padding:8px 9px}}
@media(max-width:600px){.workspace{display:block}.sidebar{position:relative;width:100%;padding:14px 16px 0;border-right:none;border-bottom:1px solid var(--border)}.brand{padding:0 0 13px}.brand strong{font-size:15px}.brand small{font-size:7px}.brandmark{height:33px;width:33px}.side-label,.side-bottom{display:none}.project-switch{position:absolute;top:16px;right:15px;max-width:165px;margin:0;padding:7px}.project-switch>svg{display:none}.new-project{position:absolute;right:13px;top:50px;margin:0;padding:5px;font-size:9px}nav{display:flex;gap:6px;overflow-x:auto;padding:10px 0 11px;scrollbar-width:none}.nav-item{white-space:nowrap;width:auto;flex-shrink:0;padding:9px 11px;gap:6px;font-size:11px}.nav-item>svg{width:14px}.nav-item.active:before,.new-tag{display:none}.main{margin-left:0}.topbar{height:43px;padding:0 17px}.breadcrumb{font-size:9px;gap:6px}.top-actions{gap:7px}.cloud-indicator{font-size:8px}.page-content{padding:23px 16px 15px}.page-heading{align-items:center;margin-bottom:21px}.eyebrow{font-size:8px;letter-spacing:.11em}h1{font-size:23px;gap:7px}.page-heading p{font-size:10px;max-width:200px}.heading-actions{align-self:center}.heading-actions .btn{font-size:0;gap:0;padding:8px}.heading-actions .btn svg{width:16px}.heading-actions .icon-btn{padding:7px}.project-banner{padding:16px;gap:15px}.episode{height:39px;width:42px;font-size:10px}.project-title h2{font-size:17px}.project-title p{font-size:8px}.project-progress{width:90px}.project-progress span{font-size:8px}.project-progress b{font-size:20px}.project-progress>small{font-size:7px}.metrics{gap:9px;margin-bottom:25px}.metrics>div{padding:13px;gap:11px}.metrics b{font-size:23px}.metrics small{font-size:9px}.metrics em{font-size:10px}.section-title{flex-wrap:wrap;gap:6px;margin-bottom:12px}.section-title h2{font-size:14px}.section-title>span{font-size:8px}.stage-list{padding:8px;grid-template-columns:repeat(3,1fr);gap:5px}.stage-item{padding:8px 4px;gap:5px}.stage-number{width:21px;height:21px;font-size:8px}.stage-item strong{font-size:9px}.stage-label{font-size:6px;letter-spacing:-.02em}.stage-label svg{width:8px}.flow-layout{gap:16px}.detail-card{padding:22px 18px}.detail-top h2{font-size:22px}.stage-description{font-size:11px}.gate-notice{font-size:9px}.checklist label{font-size:11px;line-height:1.9;padding:10px;gap:8px}.output-box{padding:12px}.output-box p{font-size:10px}.checklist-heading h3,.field-label{font-size:12px}textarea{font-size:12px}.reviews{gap:8px}.reviews>div{padding:10px}.review-title{font-size:9px;gap:4px}.reviews p{font-size:9px}.detail-actions{gap:15px}.detail-actions>div{width:100%;justify-content:flex-end}.detail-actions .btn{font-size:10px;padding:9px 11px}.gate-reasons{font-size:8px}.principle{padding:14px;align-items:flex-start}.principle svg{flex-shrink:0;margin-top:3px}.principle p{font-size:9px;line-height:1.9}.principle b{font-size:10px}footer{font-size:7px;margin-top:23px}.onboarding{padding:35px 18px}.onboarding h2{font-size:21px}.onboarding>p{font-size:11px}.onboarding-grid{grid-template-columns:repeat(2,1fr);gap:7px}.onboarding-grid>div{font-size:10px;padding:10px;gap:7px}.onboarding>small{font-size:9px}.onboarding .btn{font-size:12px;padding:12px 20px}.wide-card{padding:19px 16px}.wide-card .section-title{gap:10px}.wide-card .section-title p{font-size:10px}.wide-card h2{font-size:18px}.wide-card .section-title>.btn{margin-left:0}.connection-layout{gap:15px}.connection-symbol{padding-top:7px}.connect-steps p{font-size:11px}.modal{padding:21px;width:100%;max-height:88vh}.modal-backdrop{padding:12px}.shot-form{grid-template-columns:1fr}.form-field{font-size:12px}.form-field input{font-size:14px}.form-field textarea{font-size:14px}.toast{left:50%;bottom:20px;white-space:nowrap;font-size:11px;padding:12px 17px}.audit-list time{font-size:8px}.audit-list b{font-size:10px}.audit-list small{font-size:8px}.audit-icon{width:28px;height:28px}.audit-list>div{gap:8px}.issue-card{padding:13px}.issue-top time{margin-left:0}.issue-card>p{font-size:11px}.error-banner{font-size:10px;flex-wrap:wrap}.error-banner svg{flex-shrink:0}}
.manual-rules{background:#fff;border:1px solid var(--border);border-radius:8px;padding:15px 20px;margin-top:16px;color:#7d9377;font-size:11px}.manual-rules summary{cursor:pointer}.manual-rule-content{padding-top:10px;font-size:11px;line-height:1.9;color:#8e9e84}.manual-rule-content h3{font-size:12px;color:#6c8760;margin:19px 0 8px}.manual-rule-content p{margin:5px 0;overflow-wrap:anywhere}
/* Keep supporting copy readable on desktop and phone. */
.page-heading p,.stage-description,.output-box p,.field-help,.gate-reasons,.inline-note,.onboarding>p,.onboarding>small,.connect-steps p,.capability-card>small,.manual-rule-content,.section-title p{color:#738274}.stage-description,.checklist label,.output-box p,.field-label,textarea,.onboarding>p,.connect-steps p,.manual-rule-content{font-size:12px}.reviews p,.review-title{font-size:11px}.stage-item small{color:#7a8b7c}.stage-label{color:#788e7c;font-size:9px}.stage-item strong{font-size:13px}.onboarding-grid>div{font-size:12px}.muted{color:#7e8d7b}.project-title p{color:#758c7a}.wide-card .inline-note{line-height:1.9}.stage-description{line-height:2}.field-help{font-size:10px}.gate-reasons{font-size:10px}.manual-mini span{color:#7d8b7d}.stage-item.selected .stage-label{color:#6d8b72}.onboarding>small{font-size:11px}footer{color:#849180}.capability-card>p{color:#71856a;font-size:12px}.author-only p{color:#7e9276}.connection-state small{color:#7b9272}.reviews small{color:#82967c}
@media(max-width:600px){.stage-item strong{font-size:10px}.stage-label{font-size:7px}.stage-description,.checklist label,.output-box p,.field-label,textarea,.connect-steps p,.manual-rule-content{font-size:12px}.onboarding-grid>div{font-size:11px}.onboarding>small{font-size:10px}.gate-reasons{font-size:10px}}
.ai-workspace{display:grid;gap:18px}.context-intro h2{font-size:23px}.context-intro>p{color:#677c70;line-height:1.9;margin-top:10px;max-width:850px}.context-flow{display:flex;flex-wrap:wrap;gap:9px;margin:20px 0}.context-flow span{padding:8px 13px;background:#eff5f0;border-radius:6px;color:#42634e;font-size:12px}.context-tabs{display:flex;flex-wrap:wrap;gap:8px}.context-tabs button{display:flex;gap:9px;align-items:center;background:white;border:1px solid var(--border);padding:10px 15px;border-radius:7px;color:#667d70;font-size:12px}.context-tabs button.active{background:#355f4c;color:white;border-color:#355f4c}.context-tabs span{opacity:.7;font-size:11px}.context-form{padding:20px;background:#f7faf7;border:1px solid #dde8df;border-radius:8px;margin:18px 0;display:grid;gap:14px}.context-form-grid{display:grid;grid-template-columns:1fr 1fr;gap:14px}.context-form label{display:grid;gap:6px;font-size:12px;color:#587364}.context-form input,.context-form select{background:white;border:1px solid #d6e0d8;border-radius:5px;padding:10px;width:100%;min-width:0;font-size:12px}.context-form>.btn{justify-self:end}.context-records{display:grid;gap:15px}.context-record{border:1px solid var(--border);border-radius:8px;padding:19px;margin:14px 0;overflow-wrap:anywhere}.context-record>p,.context-mini>p{white-space:pre-wrap;margin:12px 0;color:#40584b}.context-record small,.context-mini small{display:block;color:#7d8d82}.context-source{background:#f5f8f5;border-radius:5px;padding:10px 12px;margin:12px 0;font-size:12px;color:#687c6e;white-space:pre-wrap;overflow-wrap:anywhere}.context-id{display:block;color:#7e9084;font-size:10px;overflow-wrap:anywhere;margin:7px 0}.context-actions{display:flex;justify-content:flex-end;gap:8px;margin-top:14px}.context-pack{border:1px solid #dce8de;padding:20px;border-radius:8px;margin-top:22px}.context-pack-head{display:flex;gap:9px;flex-wrap:wrap;align-items:center}.context-pack-head .btn{margin-left:auto}.context-task{font-size:17px;font-weight:600;margin:16px 0 7px}.context-pack h3{margin:23px 0 12px;font-size:14px}.context-blockers{background:#fff3eb;color:#a66f51;padding:13px;border-radius:6px;margin:15px 0;font-size:12px}.context-mini{border-top:1px solid var(--border);padding:13px 0;font-size:12px}.context-mini b{color:#41634d}.context-pack details .text-btn{display:block}.ai-workspace .wide-card{min-width:0}.sidebar nav{max-height:60vh;overflow:auto}.nav-item{flex-shrink:0}
@media(max-width:600px){.context-intro h2{font-size:20px}.context-intro>p{font-size:12px}.context-form{padding:13px}.context-form-grid{grid-template-columns:1fr}.context-tabs{gap:5px}.context-tabs button{font-size:11px;padding:9px}.context-flow span{font-size:10px;padding:6px 9px}.context-pack{padding:13px}.context-record{padding:14px}.context-pack-head .btn{margin-left:0}.sidebar nav{max-height:none}}
.production-totals{display:flex;gap:18px;flex-wrap:wrap;padding:18px 0;border-bottom:1px solid var(--line)}.production-totals span{color:#78736c;font-size:13px}.production-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:9px;margin:22px 0}.production-stage{text-align:left;padding:14px;border:1px solid #e4e0d6;border-radius:12px;background:#faf9f6;display:grid;gap:5px;color:#383e37;cursor:pointer}.production-stage small{color:#7a806d}.production-stage span,.production-stage em{font-size:12px;font-style:normal}.production-stage em{color:#987442}.production-stage.selected{border-color:#697851;background:#edf0e5}.production-gaps{padding:20px;background:#fbf6e9;border-radius:12px;margin-bottom:24px}.production-gaps li{margin:8px 0;line-height:1.7}.production-filters{display:grid;grid-template-columns:2fr 1fr 1fr;gap:14px;margin:25px 0 12px}.production-filters label,.production-import label{display:grid;gap:8px;font-size:13px}.production-filters input,.production-filters select{width:100%;padding:12px;border:1px solid #ddd9cf;border-radius:8px;background:white;color:#333}.production-record{border:1px solid #e4e0d6;border-radius:10px;padding:15px;margin:10px 0}.production-record summary{display:flex;align-items:center;gap:10px;cursor:pointer;flex-wrap:wrap}.production-record summary small{margin-left:auto;color:#78736c}.production-source-text{white-space:pre-wrap;overflow-wrap:anywhere;line-height:1.9;padding:16px 0;font-size:14px}.production-import{border-top:1px solid #ddd9cf;padding-top:22px;margin-top:30px}.production-import summary{cursor:pointer;font-weight:600}.production-import input{padding:14px 0}.production-import p{line-height:1.8}.context-tabs{flex-wrap:wrap}@media(max-width:800px){.production-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.production-filters{grid-template-columns:1fr}.production-record summary small{margin-left:0}}
.production-acceptance{margin:20px 0;padding:20px;background:#edf2e6;border:1px solid #d6dfca;border-radius:12px;line-height:1.8}.production-acceptance>b{margin-left:12px}.production-acceptance p{margin:8px 0}.production-gap{padding:16px 0;border-bottom:1px solid #e5ddca}.production-gap:last-child{border:0}.production-gap p{line-height:1.8}.production-gap .context-form{background:#fffdf8}.production-gap details{margin:12px 0}
.work-dashboard{display:grid;gap:22px}.episode-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:14px;margin:24px 0}.episode-card{display:grid;gap:10px;background:#faf9f6;border:1px solid #e2dfd5;padding:20px;border-radius:12px;text-align:left;cursor:pointer;color:#303b32}.episode-card.selected{border-color:#69846e;background:#edf3e8}.episode-card small{color:#6b8068;letter-spacing:.08em}.episode-card span{font-size:12px;color:#797d74}.work-search{display:grid;gap:10px;font-size:13px;margin:22px 0}.work-search input{border:1px solid #deded4;background:#fff;border-radius:8px;padding:13px}.work-dashboard summary{cursor:pointer}.production-import textarea{width:100%;border:1px solid #dcded2;border-radius:10px;padding:12px;margin:12px 0;resize:vertical;font-family:inherit}.work-dashboard .production-record summary{display:flex;gap:12px;align-items:center}.sidebar>.side-label:not(:first-of-type){margin-top:14px}@media(max-width:800px){.episode-grid{grid-template-columns:1fr}}
.registration-detail{margin:-4px 0 22px;padding:12px 18px;background:#f3f6f4;border:1px solid var(--line);border-radius:12px;color:var(--muted);font-size:12px}.registration-detail summary{cursor:pointer}.episode-brief>small{display:block;margin-bottom:12px}.episode-brief details{margin:14px 0}.episode-brief summary{cursor:pointer}.handoff-body{padding:12px 0}.handoff-body p{white-space:pre-wrap;line-height:1.85}.project-progress strong{color:var(--green);font-size:16px}.episode-brief ol{padding-left:22px;line-height:1.9}.selection-editor{border:1px solid var(--line);padding:18px;border-radius:12px;margin:14px 0}
.episode-settings{display:grid;gap:22px}.episode-settings details{margin:14px 0}.episode-settings summary{cursor:pointer}.episode-settings .production-record>p{line-height:1.85}.episode-settings .context-form input[type=number]{width:100%}
/* Work-level 3D modeling pipeline. */
.model-workspace{display:grid;gap:18px}.model-heading h2,.model-stage-detail h2,.model-workspace .section-title h2{display:flex;align-items:center;gap:9px}.model-principles{display:flex;gap:20px;flex-wrap:wrap;font-size:11px;color:#647f6b;padding-top:8px}.model-principles span{display:flex;gap:6px;align-items:center}.model-selectors{display:flex;gap:15px;align-items:flex-end;flex-wrap:wrap}.model-selectors label{display:grid;gap:6px;font-size:11px;color:#6d8272;flex:1;min-width:180px}.model-selectors select{background:#fbfdf9;border:1px solid #dce7d8;border-radius:6px;padding:9px;font-size:12px;width:100%}.model-stage-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:9px}.model-step{border:1px solid #e0e8df;background:#fff;padding:14px;border-radius:8px;text-align:left;color:#6f8270}.model-step small{font-size:9px;color:#94a68e;display:block}.model-step b{font-size:12px;display:block;margin:4px 0}.model-step span{font-size:9px;color:#84987e}.model-step.selected{background:#eef5eb;border-color:#8fac83;box-shadow:inset 0 0 0 1px #b8cdb0}.model-step.passed b{color:#47753b}.model-sources{display:grid;grid-template-columns:100px 1fr;gap:9px;font-size:11px;margin-top:18px}.model-sources dt{color:#7c9273}.model-sources dd{margin:0;color:#5c7255;white-space:pre-wrap;overflow-wrap:anywhere}.model-register .section-title .text-btn{margin-left:auto}.model-register .context-form-grid{margin-top:0}.model-pins{display:grid;gap:10px}.model-pins article{padding:12px;border:1px solid #e2ebdb;border-radius:6px;background:#fafdf7}.model-pins b{font-size:12px}.model-pins p{font-size:11px;color:#7d9471;margin:5px 0}.model-pins code{font-size:10px;overflow-wrap:anywhere;display:block}.model-workspace .context-record small{overflow-wrap:anywhere}.model-workspace .context-form textarea{font-size:12px}.model-stage-detail .checklist{margin-bottom:0}.model-workspace .wide-card>p{line-height:1.9}.model-stage-detail .context-actions{flex-wrap:wrap}
@media(max-width:600px){.model-stage-grid{grid-template-columns:repeat(2,1fr)}.model-step{padding:11px}.model-step b{font-size:12px}.model-principles{gap:8px 14px;font-size:10px}.model-selectors{display:grid;grid-template-columns:1fr;gap:12px}.model-selectors label{min-width:0}.model-sources{grid-template-columns:1fr;gap:5px}.model-sources dd{margin-bottom:10px}.model-heading .section-title{align-items:flex-start}.model-workspace .context-form input,.model-workspace .context-form textarea,.model-selectors select{font-size:14px}}

/* Unified production handoff: an operational view shared by humans and agents. */
.resume-board{display:grid;gap:22px}.resume-board h2{display:flex;align-items:center;gap:8px}.resume-start h2{font-size:25px}.resume-start p,.resume-board .section-title p{line-height:1.8}.resume-stats{display:flex;flex-wrap:wrap;gap:12px 24px;margin-top:20px;font-size:13px;color:#66755e}.resume-stats span{display:flex;align-items:center;gap:7px}.resume-two{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:22px}.resume-current,.resume-instruction{display:flex;flex-direction:column;align-items:stretch;gap:14px}.resume-board p{margin:5px 0;line-height:1.8;overflow-wrap:anywhere}.resume-text{white-space:pre-wrap}.resume-next{padding:15px;border-left:3px solid #718967;background:#f0f4eb;border-radius:0 8px 8px 0}.resume-next p{white-space:pre-wrap;font-size:14px}.resume-warning{color:#946026;background:#fff6df;padding:10px;border-radius:7px}.resume-models{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16px}.resume-model{display:grid;align-content:start;gap:10px;border:1px solid #dedfd4;border-radius:12px;padding:20px}.resume-model .btn{justify-self:start}.resume-problems{display:grid;gap:10px;max-height:500px;overflow:auto}.resume-problems button{display:grid;gap:7px;text-align:left;background:#fcf7eb;border:1px solid #e4ddca;border-radius:8px;padding:14px;color:#4b473b;cursor:pointer}.resume-problems button span{font-size:12px;color:#857553}.resume-problems button b{font-weight:500;font-size:14px;white-space:pre-wrap;overflow-wrap:anywhere}.resume-board textarea{width:100%;margin-top:12px;font-size:14px;line-height:1.7}.resume-board .btn{min-height:44px}.resume-board small{font-size:12px;color:#777c70}.resume-board .form-field select{width:100%;padding:12px;border:1px solid #dedfd4;border-radius:8px;background:white;font:inherit}.resume-instruction .muted{font-size:12px}.resume-current>.btn{margin-top:auto;align-self:start}
@media(max-width:900px){.resume-two,.resume-models{grid-template-columns:1fr}}@media(max-width:600px){.sidebar .side-label{display:block;margin:10px 0 5px}.sidebar .project-switch{position:static;max-width:none;width:100%;margin:0 0 8px;padding:9px 12px}.sidebar .project-switch select{font-size:14px}.sidebar .new-project{position:static;font-size:12px;padding:8px;margin-top:4px}.sidebar nav{margin-top:8px}.resume-board{gap:16px}.resume-two{gap:16px}.resume-model{padding:16px}.resume-start h2{font-size:21px}.resume-board p,.resume-board .section-title p,.resume-next p{font-size:14px}.resume-board .btn{font-size:13px}.resume-stats{display:grid;gap:10px;font-size:12px}.resume-board .wide-card h2{font-size:18px}.resume-board .form-field select{font-size:16px}.resume-board .context-actions{flex-wrap:wrap}.resume-model .btn{width:100%;justify-content:center}}
/* v5: everyday tasks first; detailed records are disclosed on demand. */
:host{--muted:#62746a;--bg:#f4f6f3;--green:#275b46}
.sidebar{overflow-y:auto}.sidebar nav{flex-shrink:0}.side-label{font-size:11px;padding:10px 8px 6px}.new-project{margin-bottom:16px}.nav-item{font-size:14px;min-height:45px}.nav-more{margin-top:14px;border-top:1px solid var(--border);padding-top:12px}.nav-more>summary{cursor:pointer;font-size:13px;padding:9px;color:#526b5b}.page-content{max-width:1440px;margin:auto}.page-heading{margin-bottom:24px}.page-heading h1{font-size:30px}.page-heading p{font-size:14px}.project-banner{padding:18px 24px;margin-bottom:24px}.project-title h2{font-size:17px}.project-progress{font-size:13px}.eyebrow{letter-spacing:.08em}.wide-card{border-radius:14px}.registration-detail{margin:0 0 18px}.registration-detail>.metrics{margin:18px 0}.section-nav{display:flex;flex-wrap:wrap;gap:6px;background:#e9eee8;padding:5px;border-radius:10px;margin:0 0 20px}.section-nav button{background:transparent;padding:9px 15px;border-radius:7px;color:#52655a;font-size:14px}.section-nav button.active{background:#fff;color:#234e3b;box-shadow:0 1px 4px #243b2910;font-weight:650}.advanced-tools{margin-bottom:20px;padding:10px 15px;border:1px solid var(--border);border-radius:9px;color:#596c60}.advanced-tools summary{cursor:pointer}.advanced-tools .context-tabs{margin-top:14px}.home-board{display:grid;gap:22px}.next-action{padding:30px 34px;border-radius:16px;background:#e6efe5;border:1px solid #d3e1d2}.next-action h2{font-size:26px;line-height:1.5;margin:8px 0 12px;color:#234e3b}.next-action>p{font-size:15px;line-height:1.9;max-width:780px;white-space:pre-line;overflow-wrap:anywhere}.next-action .context-actions{margin-top:22px}.home-summary{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));background:#fff;border:1px solid var(--border);border-radius:13px;padding:20px 0}.home-summary>div,.home-summary>button{display:flex;flex-direction:column;align-items:flex-start;padding:0 26px;background:transparent;text-align:left;color:var(--ink);border-right:1px solid var(--border)}.home-summary>:last-child{border:0}.home-summary span{font-size:13px;color:#67786b}.home-summary strong{font-size:25px;font-weight:650;margin:4px 0}.home-summary em{font-style:normal;font-size:13px;font-weight:400}.home-summary small{font-size:12px;color:#748176}.home-columns{display:grid;grid-template-columns:1.15fr 1fr;gap:22px}.home-columns .wide-card{padding:25px}.home-board h2{font-size:19px}.home-board .next-action h2{font-size:26px}.task-choices{display:grid;margin-top:12px}.task-choices>button{display:flex;gap:15px;align-items:center;text-align:left;background:white;padding:18px 0;color:#305a43;border-bottom:1px solid var(--border)}.task-choices>button:last-child{border:0}.task-choices span{flex:1}.task-choices b{display:block;font-size:15px;color:var(--ink)}.task-choices small{display:block;margin-top:4px;font-size:13px;color:#6c7a70}.task-choices>button:hover{background:#f5f8f3}.quiet-state{padding:28px 0 18px;color:#6c816f}.quiet-state h3{font-size:16px;margin-top:12px}.quiet-state p{font-size:13px;margin-top:8px}.attention-list button{display:flex;align-items:start;gap:10px;width:100%;text-align:left;padding:14px 0;background:transparent;color:#695d46;border-bottom:1px solid #ecefe8}.attention-list button>span{flex:1;display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden}.attention-list svg{flex-shrink:0;margin-top:3px}.home-history>summary{cursor:pointer;font-weight:600}.home-history>p,.home-history>h3{margin-top:16px}.home-history details{margin-top:18px}.home-history p{overflow-wrap:anywhere}.home-model-row{display:flex;align-items:center;justify-content:space-between;gap:20px;padding:18px 0;border-bottom:1px solid var(--border)}.home-model-row p{margin:4px 0}.ai-handoff p{margin:10px 0}.ai-handoff textarea{width:100%;margin:12px 0}.btn{min-height:40px;font-size:13px}.context-tabs button{font-size:13px}.wide-card>p{line-height:1.8}.sidebar .brand{padding-bottom:18px}
@media(max-width:900px){.home-columns{grid-template-columns:1fr}.next-action{padding:24px}.home-summary>div,.home-summary>button{padding:0 18px}}
@media(max-width:600px){.sidebar{height:auto;position:relative;padding:16px!important}.sidebar nav{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));overflow:visible;gap:3px;margin:14px 0 0}.sidebar .nav-item{flex-direction:column;justify-content:center;gap:6px;padding:9px 2px;font-size:11px;min-height:61px}.nav-item.active:before{display:none}.sidebar .nav-more{margin-top:5px;padding-top:0}.sidebar .nav-more[open]{display:block}.sidebar .nav-more .nav-item{display:inline-flex;min-height:38px;padding:8px 12px}.sidebar .side-bottom{display:none}.sidebar .new-project{display:none}.page-heading h1{font-size:24px}.page-heading{align-items:center}.heading-actions .btn{font-size:11px;padding:8px}.project-banner{padding:15px;margin-bottom:18px;gap:12px;align-items:start}.project-title h2{font-size:16px}.project-progress{width:auto;text-align:left}.project-progress small{display:none}.home-board{gap:16px}.next-action{padding:22px}.home-board .next-action h2{font-size:22px}.next-action>p{font-size:14px}.home-summary{padding:16px 0}.home-summary>div,.home-summary>button{padding:0 12px}.home-summary strong{font-size:21px}.home-summary small{font-size:10px}.home-summary span{font-size:12px}.home-columns .wide-card{padding:20px}.section-nav{gap:3px}.section-nav button{font-size:12px;padding:8px 10px}.context-actions{flex-wrap:wrap}.home-model-row{align-items:start;flex-direction:column}.project-title p{font-size:11px}.page-content{padding:20px 16px}.home-board .wide-card{min-width:0}.home-board .home-summary{min-width:0}}
.connection-simple{display:grid;grid-template-columns:minmax(0,1.3fr) minmax(0,1fr);gap:22px}.connection-simple h2{font-size:20px}.connection-simple p{margin:12px 0;line-height:1.85}.connection-simple details{margin-top:22px}.connection-simple textarea{width:100%;margin-top:14px}.connection-simple details p{overflow-wrap:anywhere}.connection-simple .btn{margin-top:12px}@media(max-width:850px){.connection-simple{grid-template-columns:1fr}}

:host{display:block;--bg:#f7f8fa;--ink:#23322e;--muted:#85908b;--green:#326552;--border:#e4e9e6;--mint:#edf4ef;--font:'Noto Sans TC','Microsoft JhengHei',system-ui,sans-serif;color:var(--ink);font:14px/1.6 var(--font);background:var(--bg)}.native-production{min-width:0}.workspace{display:grid;grid-template-columns:230px minmax(0,1fr);min-height:calc(100dvh - 70px)}.sidebar{position:sticky;inset:auto;top:0;width:auto;height:calc(100dvh - 70px);overflow-y:auto;padding-top:20px}.brand{display:none}.main{margin-left:0!important}.topbar{height:48px}.page-content{padding:24px}.cloud-indicator{font-size:11px}.sidebar nav{max-height:none}.side-bottom{padding-top:20px}@media(max-width:850px){.workspace{grid-template-columns:185px minmax(0,1fr)}.page-content{padding:20px}}@media(max-width:600px){.workspace{display:block}.sidebar{position:relative;height:auto;padding:12px 16px 0}.main{margin:0}.topbar{display:none}.page-content{padding:20px 16px}.page-heading{margin-top:0}.page-heading p{max-width:none;font-size:12px}.sidebar .new-project{margin-bottom:6px}h1{font-size:24px}}`, Zm = "https://hrdzywkihfqggiwjgavi.supabase.co/functions/v1/lizhi-production", js = /* @__PURE__ */ new WeakMap(), Km = async (u, v, T) => {
  const r = window.LizhiAuth;
  if (!r?.client) throw new Error("請先登入立之雲端庫");
  const { data: d, error: j } = await r.client.auth.getSession();
  if (j || !d.session?.access_token) throw new Error("登入已失效，請重新登入雲端庫");
  return fetch(Zm + "/" + u + v, {
    cache: "no-store",
    headers: {
      Authorization: "Bearer " + d.session.access_token,
      apikey: window.LIZHI_SUPABASE_PUBLISHABLE_KEY,
      ...T ? { "Content-Type": "application/json" } : {}
    },
    ...T ? {
      method: "POST",
      body: JSON.stringify(T)
    } : {}
  });
};
function Jm(u) {
  if (js.has(u)) return;
  const v = u.attachShadow({ mode: "open" }), T = document.createElement("style");
  T.textContent = Qm, v.append(T);
  const r = document.createElement("div");
  r.className = "native-production", v.append(r);
  const d = (0, xm.createRoot)(r);
  js.set(u, d), d.render(/* @__PURE__ */ (0, n.jsx)(Xm, { nativeTransport: Km }));
}
function Im(u) {
  js.get(u)?.unmount(), js.delete(u);
}
export {
  Jm as mount,
  Im as unmount
};
