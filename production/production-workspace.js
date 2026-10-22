var Pt = (u, v) => () => (v || (u((v = { exports: {} }).exports, v), u = null), v.exports), _h = /* @__PURE__ */ Pt(((u) => {
  function v(Y, O) {
    var V = Y.length;
    Y.push(O);
    e: for (; 0 < V; ) {
      var je = V - 1 >>> 1, Ee = Y[je];
      if (0 < o(Ee, O)) Y[je] = O, Y[V] = Ee, V = je;
      else break e;
    }
  }
  function w(Y) {
    return Y.length === 0 ? null : Y[0];
  }
  function r(Y) {
    if (Y.length === 0) return null;
    var O = Y[0], V = Y.pop();
    if (V !== O) {
      Y[0] = V;
      e: for (var je = 0, Ee = Y.length, Ie = Ee >>> 1; je < Ie; ) {
        var m = 2 * (je + 1) - 1, U = Y[m], X = m + 1, $ = Y[X];
        if (0 > o(U, V)) X < Ee && 0 > o($, U) ? (Y[je] = $, Y[X] = V, je = X) : (Y[je] = U, Y[m] = V, je = m);
        else if (X < Ee && 0 > o($, V)) Y[je] = $, Y[X] = V, je = X;
        else break e;
      }
    }
    return O;
  }
  function o(Y, O) {
    var V = Y.sortIndex - O.sortIndex;
    return V !== 0 ? V : Y.id - O.id;
  }
  if (u.unstable_now = void 0, typeof performance == "object" && typeof performance.now == "function") {
    var T = performance;
    u.unstable_now = function() {
      return T.now();
    };
  } else {
    var G = Date, k = G.now();
    u.unstable_now = function() {
      return G.now() - k;
    };
  }
  var H = [], _ = [], E = 1, Z = null, B = 3, ne = !1, ue = !1, L = !1, I = !1, q = typeof setTimeout == "function" ? setTimeout : null, K = typeof clearTimeout == "function" ? clearTimeout : null, de = typeof setImmediate < "u" ? setImmediate : null;
  function W(Y) {
    for (var O = w(_); O !== null; ) {
      if (O.callback === null) r(_);
      else if (O.startTime <= Y) r(_), O.sortIndex = O.expirationTime, v(H, O);
      else break;
      O = w(_);
    }
  }
  function te(Y) {
    if (L = !1, W(Y), !ue) if (w(H) !== null) ue = !0, F || (F = !0, be());
    else {
      var O = w(_);
      O !== null && Q(te, O.startTime - Y);
    }
  }
  var F = !1, fe = -1, ie = 5, J = -1;
  function b() {
    return I ? !0 : !(u.unstable_now() - J < ie);
  }
  function le() {
    if (I = !1, F) {
      var Y = u.unstable_now();
      J = Y;
      var O = !0;
      try {
        e: {
          ue = !1, L && (L = !1, K(fe), fe = -1), ne = !0;
          var V = B;
          try {
            t: {
              for (W(Y), Z = w(H); Z !== null && !(Z.expirationTime > Y && b()); ) {
                var je = Z.callback;
                if (typeof je == "function") {
                  Z.callback = null, B = Z.priorityLevel;
                  var Ee = je(Z.expirationTime <= Y);
                  if (Y = u.unstable_now(), typeof Ee == "function") {
                    Z.callback = Ee, W(Y), O = !0;
                    break t;
                  }
                  Z === w(H) && r(H), W(Y);
                } else r(H);
                Z = w(H);
              }
              if (Z !== null) O = !0;
              else {
                var Ie = w(_);
                Ie !== null && Q(te, Ie.startTime - Y), O = !1;
              }
            }
            break e;
          } finally {
            Z = null, B = V, ne = !1;
          }
          O = void 0;
        }
      } finally {
        O ? be() : F = !1;
      }
    }
  }
  var be;
  if (typeof de == "function") be = function() {
    de(le);
  };
  else if (typeof MessageChannel < "u") {
    var Te = new MessageChannel(), x = Te.port2;
    Te.port1.onmessage = le, be = function() {
      x.postMessage(null);
    };
  } else be = function() {
    q(le, 0);
  };
  function Q(Y, O) {
    fe = q(function() {
      Y(u.unstable_now());
    }, O);
  }
  u.unstable_IdlePriority = 5, u.unstable_ImmediatePriority = 1, u.unstable_LowPriority = 4, u.unstable_NormalPriority = 3, u.unstable_Profiling = null, u.unstable_UserBlockingPriority = 2, u.unstable_cancelCallback = function(Y) {
    Y.callback = null;
  }, u.unstable_forceFrameRate = function(Y) {
    0 > Y || 125 < Y ? console.error("forceFrameRate takes a positive int between 0 and 125, forcing frame rates higher than 125 fps is not supported") : ie = 0 < Y ? Math.floor(1e3 / Y) : 5;
  }, u.unstable_getCurrentPriorityLevel = function() {
    return B;
  }, u.unstable_next = function(Y) {
    switch (B) {
      case 1:
      case 2:
      case 3:
        var O = 3;
        break;
      default:
        O = B;
    }
    var V = B;
    B = O;
    try {
      return Y();
    } finally {
      B = V;
    }
  }, u.unstable_requestPaint = function() {
    I = !0;
  }, u.unstable_runWithPriority = function(Y, O) {
    switch (Y) {
      case 1:
      case 2:
      case 3:
      case 4:
      case 5:
        break;
      default:
        Y = 3;
    }
    var V = B;
    B = Y;
    try {
      return O();
    } finally {
      B = V;
    }
  }, u.unstable_scheduleCallback = function(Y, O, V) {
    var je = u.unstable_now();
    switch (typeof V == "object" && V !== null ? (V = V.delay, V = typeof V == "number" && 0 < V ? je + V : je) : V = je, Y) {
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
    return Ee = V + Ee, Y = {
      id: E++,
      callback: O,
      priorityLevel: Y,
      startTime: V,
      expirationTime: Ee,
      sortIndex: -1
    }, V > je ? (Y.sortIndex = V, v(_, Y), w(H) === null && Y === w(_) && (L ? (K(fe), fe = -1) : L = !0, Q(te, V - je))) : (Y.sortIndex = Ee, v(H, Y), ue || ne || (ue = !0, F || (F = !0, be()))), Y;
  }, u.unstable_shouldYield = b, u.unstable_wrapCallback = function(Y) {
    var O = B;
    return function() {
      var V = B;
      B = O;
      try {
        return Y.apply(this, arguments);
      } finally {
        B = V;
      }
    };
  };
})), Eh = /* @__PURE__ */ Pt(((u, v) => {
  v.exports = _h();
})), Th = /* @__PURE__ */ Pt(((u) => {
  var v = /* @__PURE__ */ Symbol.for("react.transitional.element"), w = /* @__PURE__ */ Symbol.for("react.portal"), r = /* @__PURE__ */ Symbol.for("react.fragment"), o = /* @__PURE__ */ Symbol.for("react.strict_mode"), T = /* @__PURE__ */ Symbol.for("react.profiler"), G = /* @__PURE__ */ Symbol.for("react.consumer"), k = /* @__PURE__ */ Symbol.for("react.context"), H = /* @__PURE__ */ Symbol.for("react.forward_ref"), _ = /* @__PURE__ */ Symbol.for("react.suspense"), E = /* @__PURE__ */ Symbol.for("react.memo"), Z = /* @__PURE__ */ Symbol.for("react.lazy"), B = /* @__PURE__ */ Symbol.for("react.activity"), ne = Symbol.iterator;
  function ue(m) {
    return m === null || typeof m != "object" ? null : (m = ne && m[ne] || m["@@iterator"], typeof m == "function" ? m : null);
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
  }, I = Object.assign, q = {};
  function K(m, U, X) {
    this.props = m, this.context = U, this.refs = q, this.updater = X || L;
  }
  K.prototype.isReactComponent = {}, K.prototype.setState = function(m, U) {
    if (typeof m != "object" && typeof m != "function" && m != null) throw Error("takes an object of state variables to update or a function which returns an object of state variables.");
    this.updater.enqueueSetState(this, m, U, "setState");
  }, K.prototype.forceUpdate = function(m) {
    this.updater.enqueueForceUpdate(this, m, "forceUpdate");
  };
  function de() {
  }
  de.prototype = K.prototype;
  function W(m, U, X) {
    this.props = m, this.context = U, this.refs = q, this.updater = X || L;
  }
  var te = W.prototype = new de();
  te.constructor = W, I(te, K.prototype), te.isPureReactComponent = !0;
  var F = Array.isArray;
  function fe() {
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
  function le(m, U) {
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
  function Y(m) {
    switch (m.status) {
      case "fulfilled":
        return m.value;
      case "rejected":
        throw m.reason;
      default:
        switch (typeof m.status == "string" ? m.then(fe, fe) : (m.status = "pending", m.then(function(U) {
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
  function O(m, U, X, $, re) {
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
          case w:
            he = !0;
            break;
          case Z:
            return he = m._init, O(he(m._payload), U, X, $, re);
        }
    }
    if (he) return re = re(m), he = $ === "" ? "." + Q(m, 0) : $, F(re) ? (X = "", he != null && (X = he.replace(x, "$&/") + "/"), O(re, U, X, "", function(Ze) {
      return Ze;
    })) : re != null && (be(re) && (re = le(re, X + (re.key == null || m && m.key === re.key ? "" : ("" + re.key).replace(x, "$&/") + "/") + he)), U.push(re)), 1;
    he = 0;
    var Me = $ === "" ? "." : $ + ":";
    if (F(m)) for (var xe = 0; xe < m.length; xe++) $ = m[xe], me = Me + Q($, xe), he += O($, U, X, me, re);
    else if (xe = ue(m), typeof xe == "function") for (m = xe.call(m), xe = 0; !($ = m.next()).done; ) $ = $.value, me = Me + Q($, xe++), he += O($, U, X, me, re);
    else if (me === "object") {
      if (typeof m.then == "function") return O(Y(m), U, X, $, re);
      throw U = String(m), Error("Objects are not valid as a React child (found: " + (U === "[object Object]" ? "object with keys {" + Object.keys(m).join(", ") + "}" : U) + "). If you meant to render a collection of children, use an array instead.");
    }
    return he;
  }
  function V(m, U, X) {
    if (m == null) return m;
    var $ = [], re = 0;
    return O(m, $, "", "", function(me) {
      return U.call(X, me, re++);
    }), $;
  }
  function je(m) {
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
  }, Ie = {
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
  u.Activity = B, u.Children = Ie, u.Component = K, u.Fragment = r, u.Profiler = T, u.PureComponent = W, u.StrictMode = o, u.Suspense = _, u.__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE = ie, u.__COMPILER_RUNTIME = {
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
    var $ = I({}, m.props), re = m.key;
    if (U != null) for (me in U.key !== void 0 && (re = "" + U.key), U) !J.call(U, me) || me === "key" || me === "__self" || me === "__source" || me === "ref" && U.ref === void 0 || ($[me] = U[me]);
    var me = arguments.length - 2;
    if (me === 1) $.children = X;
    else if (1 < me) {
      for (var he = Array(me), Me = 0; Me < me; Me++) he[Me] = arguments[Me + 2];
      $.children = he;
    }
    return b(m.type, re, $);
  }, u.createContext = function(m) {
    return m = {
      $$typeof: k,
      _currentValue: m,
      _currentValue2: m,
      _threadCount: 0,
      Provider: null,
      Consumer: null
    }, m.Provider = m, m.Consumer = {
      $$typeof: G,
      _context: m
    }, m;
  }, u.createElement = function(m, U, X) {
    var $, re = {}, me = null;
    if (U != null) for ($ in U.key !== void 0 && (me = "" + U.key), U) J.call(U, $) && $ !== "key" && $ !== "__self" && $ !== "__source" && (re[$] = U[$]);
    var he = arguments.length - 2;
    if (he === 1) re.children = X;
    else if (1 < he) {
      for (var Me = Array(he), xe = 0; xe < he; xe++) Me[xe] = arguments[xe + 2];
      re.children = Me;
    }
    if (m && m.defaultProps) for ($ in he = m.defaultProps, he) re[$] === void 0 && (re[$] = he[$]);
    return b(m, me, re);
  }, u.createRef = function() {
    return { current: null };
  }, u.forwardRef = function(m) {
    return {
      $$typeof: H,
      render: m
    };
  }, u.isValidElement = be, u.lazy = function(m) {
    return {
      $$typeof: Z,
      _payload: {
        _status: -1,
        _result: m
      },
      _init: je
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
      var $ = m(), re = ie.S;
      re !== null && re(X, $), typeof $ == "object" && $ !== null && typeof $.then == "function" && $.then(fe, Ee);
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
})), Pu = /* @__PURE__ */ Pt(((u, v) => {
  v.exports = Th();
})), Ah = /* @__PURE__ */ Pt(((u) => {
  var v = Pu();
  function w(_) {
    var E = "https://react.dev/errors/" + _;
    if (1 < arguments.length) {
      E += "?args[]=" + encodeURIComponent(arguments[1]);
      for (var Z = 2; Z < arguments.length; Z++) E += "&args[]=" + encodeURIComponent(arguments[Z]);
    }
    return "Minified React error #" + _ + "; visit " + E + " for the full message or use the non-minified dev environment for full errors and additional helpful warnings.";
  }
  function r() {
  }
  var o = {
    d: {
      f: r,
      r: function() {
        throw Error(w(522));
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
  }, T = /* @__PURE__ */ Symbol.for("react.portal");
  function G(_, E, Z) {
    var B = 3 < arguments.length && arguments[3] !== void 0 ? arguments[3] : null;
    return {
      $$typeof: T,
      key: B == null ? null : "" + B,
      children: _,
      containerInfo: E,
      implementation: Z
    };
  }
  var k = v.__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE;
  function H(_, E) {
    if (_ === "font") return "";
    if (typeof E == "string") return E === "use-credentials" ? E : "";
  }
  u.__DOM_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE = o, u.createPortal = function(_, E) {
    var Z = 2 < arguments.length && arguments[2] !== void 0 ? arguments[2] : null;
    if (!E || E.nodeType !== 1 && E.nodeType !== 9 && E.nodeType !== 11) throw Error(w(299));
    return G(_, E, null, Z);
  }, u.flushSync = function(_) {
    var E = k.T, Z = o.p;
    try {
      if (k.T = null, o.p = 2, _) return _();
    } finally {
      k.T = E, o.p = Z, o.d.f();
    }
  }, u.preconnect = function(_, E) {
    typeof _ == "string" && (E ? (E = E.crossOrigin, E = typeof E == "string" ? E === "use-credentials" ? E : "" : void 0) : E = null, o.d.C(_, E));
  }, u.prefetchDNS = function(_) {
    typeof _ == "string" && o.d.D(_);
  }, u.preinit = function(_, E) {
    if (typeof _ == "string" && E && typeof E.as == "string") {
      var Z = E.as, B = H(Z, E.crossOrigin), ne = typeof E.integrity == "string" ? E.integrity : void 0, ue = typeof E.fetchPriority == "string" ? E.fetchPriority : void 0;
      Z === "style" ? o.d.S(_, typeof E.precedence == "string" ? E.precedence : void 0, {
        crossOrigin: B,
        integrity: ne,
        fetchPriority: ue
      }) : Z === "script" && o.d.X(_, {
        crossOrigin: B,
        integrity: ne,
        fetchPriority: ue,
        nonce: typeof E.nonce == "string" ? E.nonce : void 0
      });
    }
  }, u.preinitModule = function(_, E) {
    if (typeof _ == "string") if (typeof E == "object" && E !== null) {
      if (E.as == null || E.as === "script") {
        var Z = H(E.as, E.crossOrigin);
        o.d.M(_, {
          crossOrigin: Z,
          integrity: typeof E.integrity == "string" ? E.integrity : void 0,
          nonce: typeof E.nonce == "string" ? E.nonce : void 0
        });
      }
    } else E ?? o.d.M(_);
  }, u.preload = function(_, E) {
    if (typeof _ == "string" && typeof E == "object" && E !== null && typeof E.as == "string") {
      var Z = E.as, B = H(Z, E.crossOrigin);
      o.d.L(_, Z, {
        crossOrigin: B,
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
      var Z = H(E.as, E.crossOrigin);
      o.d.m(_, {
        as: typeof E.as == "string" && E.as !== "script" ? E.as : void 0,
        crossOrigin: Z,
        integrity: typeof E.integrity == "string" ? E.integrity : void 0
      });
    } else o.d.m(_);
  }, u.requestFormReset = function(_) {
    o.d.r(_);
  }, u.unstable_batchedUpdates = function(_, E) {
    return _(E);
  }, u.useFormState = function(_, E, Z) {
    return k.H.useFormState(_, E, Z);
  }, u.useFormStatus = function() {
    return k.H.useHostTransitionStatus();
  }, u.version = "19.2.6";
})), wh = /* @__PURE__ */ Pt(((u, v) => {
  function w() {
    if (!(typeof __REACT_DEVTOOLS_GLOBAL_HOOK__ > "u" || typeof __REACT_DEVTOOLS_GLOBAL_HOOK__.checkDCE != "function"))
      try {
        __REACT_DEVTOOLS_GLOBAL_HOOK__.checkDCE(w);
      } catch (r) {
        console.error(r);
      }
  }
  w(), v.exports = Ah();
})), Ch = /* @__PURE__ */ Pt(((u) => {
  var v = Eh(), w = Pu(), r = wh();
  function o(e) {
    var t = "https://react.dev/errors/" + e;
    if (1 < arguments.length) {
      t += "?args[]=" + encodeURIComponent(arguments[1]);
      for (var l = 2; l < arguments.length; l++) t += "&args[]=" + encodeURIComponent(arguments[l]);
    }
    return "Minified React error #" + e + "; visit " + t + " for the full message or use the non-minified dev environment for full errors and additional helpful warnings.";
  }
  function T(e) {
    return !(!e || e.nodeType !== 1 && e.nodeType !== 9 && e.nodeType !== 11);
  }
  function G(e) {
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
  function H(e) {
    if (e.tag === 31) {
      var t = e.memoizedState;
      if (t === null && (e = e.alternate, e !== null && (t = e.memoizedState)), t !== null) return t.dehydrated;
    }
    return null;
  }
  function _(e) {
    if (G(e) !== e) throw Error(o(188));
  }
  function E(e) {
    var t = e.alternate;
    if (!t) {
      if (t = G(e), t === null) throw Error(o(188));
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
        throw Error(o(188));
      }
      if (l.return !== a.return) l = i, a = s;
      else {
        for (var c = !1, d = i.child; d; ) {
          if (d === l) {
            c = !0, l = i, a = s;
            break;
          }
          if (d === a) {
            c = !0, a = i, l = s;
            break;
          }
          d = d.sibling;
        }
        if (!c) {
          for (d = s.child; d; ) {
            if (d === l) {
              c = !0, l = s, a = i;
              break;
            }
            if (d === a) {
              c = !0, a = s, l = i;
              break;
            }
            d = d.sibling;
          }
          if (!c) throw Error(o(189));
        }
      }
      if (l.alternate !== a) throw Error(o(190));
    }
    if (l.tag !== 3) throw Error(o(188));
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
  var B = Object.assign, ne = /* @__PURE__ */ Symbol.for("react.element"), ue = /* @__PURE__ */ Symbol.for("react.transitional.element"), L = /* @__PURE__ */ Symbol.for("react.portal"), I = /* @__PURE__ */ Symbol.for("react.fragment"), q = /* @__PURE__ */ Symbol.for("react.strict_mode"), K = /* @__PURE__ */ Symbol.for("react.profiler"), de = /* @__PURE__ */ Symbol.for("react.consumer"), W = /* @__PURE__ */ Symbol.for("react.context"), te = /* @__PURE__ */ Symbol.for("react.forward_ref"), F = /* @__PURE__ */ Symbol.for("react.suspense"), fe = /* @__PURE__ */ Symbol.for("react.suspense_list"), ie = /* @__PURE__ */ Symbol.for("react.memo"), J = /* @__PURE__ */ Symbol.for("react.lazy"), b = /* @__PURE__ */ Symbol.for("react.activity"), le = /* @__PURE__ */ Symbol.for("react.memo_cache_sentinel"), be = Symbol.iterator;
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
      case q:
        return "StrictMode";
      case F:
        return "Suspense";
      case fe:
        return "SuspenseList";
      case b:
        return "Activity";
    }
    if (typeof e == "object") switch (e.$$typeof) {
      case L:
        return "Portal";
      case W:
        return e.displayName || "Context";
      case de:
        return (e._context.displayName || "Context") + ".Consumer";
      case te:
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
  var Y = Array.isArray, O = w.__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE, V = r.__DOM_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE, je = {
    pending: !1,
    data: null,
    method: null,
    action: null
  }, Ee = [], Ie = -1;
  function m(e) {
    return { current: e };
  }
  function U(e) {
    0 > Ie || (e.current = Ee[Ie], Ee[Ie] = null, Ie--);
  }
  function X(e, t) {
    Ie++, Ee[Ie] = e.current, e.current = t;
  }
  var $ = m(null), re = m(null), me = m(null), he = m(null);
  function Me(e, t) {
    switch (X(me, t), X(re, e), X($, null), t.nodeType) {
      case 9:
      case 11:
        e = (e = t.documentElement) && (e = e.namespaceURI) ? yf(e) : 0;
        break;
      default:
        if (e = t.tagName, t = t.namespaceURI) t = yf(t), e = Sf(t, e);
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
    U($), U(re), U(me);
  }
  function Ze(e) {
    e.memoizedState !== null && X(he, e);
    var t = $.current, l = Sf(t, e.type);
    t !== l && (X(re, e), X($, l));
  }
  function pt(e) {
    re.current === e && (U($), U(re)), he.current === e && (U(he), Zn._currentValue = je);
  }
  var De, yl;
  function st(e) {
    if (De === void 0) try {
      throw Error();
    } catch (l) {
      var t = l.stack.trim().match(/\n( *(at )?)/);
      De = t && t[1] || "", yl = -1 < l.stack.indexOf(`
    at`) ? " (<anonymous>)" : -1 < l.stack.indexOf("@") ? "@unknown:0:0" : "";
    }
    return `
` + De + e + yl;
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
                var z = A;
              }
              Reflect.construct(e, [], R);
            } else {
              try {
                R.call();
              } catch (A) {
                z = A;
              }
              e.call(R.prototype);
            }
          } else {
            try {
              throw Error();
            } catch (A) {
              z = A;
            }
            (R = e()) && typeof R.catch == "function" && R.catch(function() {
            });
          }
        } catch (A) {
          if (A && z && typeof A.stack == "string") return [A.stack, z.stack];
        }
        return [null, null];
      } };
      a.DetermineComponentFrameRoot.displayName = "DetermineComponentFrameRoot";
      var i = Object.getOwnPropertyDescriptor(a.DetermineComponentFrameRoot, "name");
      i && i.configurable && Object.defineProperty(a.DetermineComponentFrameRoot, "name", { value: "DetermineComponentFrameRoot" });
      var s = a.DetermineComponentFrameRoot(), c = s[0], d = s[1];
      if (c && d) {
        var p = c.split(`
`), S = d.split(`
`);
        for (i = a = 0; a < p.length && !p[a].includes("DetermineComponentFrameRoot"); ) a++;
        for (; i < S.length && !S[i].includes("DetermineComponentFrameRoot"); ) i++;
        if (a === p.length || i === S.length) for (a = p.length - 1, i = S.length - 1; 1 <= a && 0 <= i && p[a] !== S[i]; ) i--;
        for (; 1 <= a && 0 <= i; a--, i--) if (p[a] !== S[i]) {
          if (a !== 1 || i !== 1) do
            if (a--, i--, 0 > i || p[a] !== S[i]) {
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
    return (l = e ? e.displayName || e.name : "") ? st(l) : "";
  }
  function P(e, t) {
    switch (e.tag) {
      case 26:
      case 27:
      case 5:
        return st(e.type);
      case 16:
        return st("Lazy");
      case 13:
        return e.child !== t && t !== null ? st("Suspense Fallback") : st("Suspense");
      case 19:
        return st("SuspenseList");
      case 0:
      case 15:
        return h(e.type, !1);
      case 11:
        return h(e.type.render, !1);
      case 1:
        return h(e.type, !0);
      case 31:
        return st("Activity");
      default:
        return "";
    }
  }
  function Ae(e) {
    try {
      var t = "", l = null;
      do
        t += P(e, l), l = e, e = e.return;
      while (e);
      return t;
    } catch (a) {
      return `
Error generating stack: ` + a.message + `
` + a.stack;
    }
  }
  var Xt = Object.prototype.hasOwnProperty, N = v.unstable_scheduleCallback, Le = v.unstable_cancelCallback, Fe = v.unstable_shouldYield, Ot = v.unstable_requestPaint, ke = v.unstable_now, el = v.unstable_getCurrentPriorityLevel, an = v.unstable_ImmediatePriority, f = v.unstable_UserBlockingPriority, ce = v.unstable_NormalPriority, pe = v.unstable_LowPriority, ct = v.unstable_IdlePriority, zt = v.log, Qt = v.unstable_setDisableYieldValue, Sl = null, ht = null;
  function zl(e) {
    if (typeof zt == "function" && Qt(e), ht && typeof ht.setStrictMode == "function") try {
      ht.setStrictMode(Sl, e);
    } catch {
    }
  }
  var Nt = Math.clz32 ? Math.clz32 : vp, xp = Math.log, gp = Math.LN2;
  function vp(e) {
    return e >>>= 0, e === 0 ? 32 : 31 - (xp(e) / gp | 0) | 0;
  }
  var ai = 256, ni = 262144, ii = 4194304;
  function Kl(e) {
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
  function si(e, t, l) {
    var a = e.pendingLanes;
    if (a === 0) return 0;
    var i = 0, s = e.suspendedLanes, c = e.pingedLanes;
    e = e.warmLanes;
    var d = a & 134217727;
    return d !== 0 ? (a = d & ~s, a !== 0 ? i = Kl(a) : (c &= d, c !== 0 ? i = Kl(c) : l || (l = d & ~e, l !== 0 && (i = Kl(l))))) : (d = a & ~s, d !== 0 ? i = Kl(d) : c !== 0 ? i = Kl(c) : l || (l = a & ~e, l !== 0 && (i = Kl(l)))), i === 0 ? 0 : t !== 0 && t !== i && (t & s) === 0 && (s = i & -i, l = t & -t, s >= l || s === 32 && (l & 4194048) !== 0) ? t : i;
  }
  function nn(e, t) {
    return (e.pendingLanes & ~(e.suspendedLanes & ~e.pingedLanes) & t) === 0;
  }
  function bp(e, t) {
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
  function td() {
    var e = ii;
    return ii <<= 1, (ii & 62914560) === 0 && (ii = 4194304), e;
  }
  function _s(e) {
    for (var t = [], l = 0; 31 > l; l++) t.push(e);
    return t;
  }
  function ci(e, t) {
    e.pendingLanes |= t, t !== 268435456 && (e.suspendedLanes = 0, e.pingedLanes = 0, e.warmLanes = 0);
  }
  function jp(e, t, l, a, i, s) {
    var c = e.pendingLanes;
    e.pendingLanes = l, e.suspendedLanes = 0, e.pingedLanes = 0, e.warmLanes = 0, e.expiredLanes &= l, e.entangledLanes &= l, e.errorRecoveryDisabledLanes &= l, e.shellSuspendCounter = 0;
    var d = e.entanglements, p = e.expirationTimes, S = e.hiddenUpdates;
    for (l = c & ~l; 0 < l; ) {
      var C = 31 - Nt(l), R = 1 << C;
      d[C] = 0, p[C] = -1;
      var z = S[C];
      if (z !== null) for (S[C] = null, C = 0; C < z.length; C++) {
        var A = z[C];
        A !== null && (A.lane &= -536870913);
      }
      l &= ~R;
    }
    a !== 0 && ld(e, a, 0), s !== 0 && i === 0 && e.tag !== 0 && (e.suspendedLanes |= s & ~(c & ~t));
  }
  function ld(e, t, l) {
    e.pendingLanes |= t, e.suspendedLanes &= ~t;
    var a = 31 - Nt(t);
    e.entangledLanes |= t, e.entanglements[a] = e.entanglements[a] | 1073741824 | l & 261930;
  }
  function ad(e, t) {
    var l = e.entangledLanes |= t;
    for (e = e.entanglements; l; ) {
      var a = 31 - Nt(l), i = 1 << a;
      i & t | e[a] & t && (e[a] |= t), l &= ~i;
    }
  }
  function nd(e, t) {
    var l = t & -t;
    return l = (l & 42) !== 0 ? 1 : id(l), (l & (e.suspendedLanes | t)) !== 0 ? 0 : l;
  }
  function id(e) {
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
  function Es(e) {
    return e &= -e, 2 < e ? 8 < e ? (e & 134217727) !== 0 ? 32 : 268435456 : 8 : 2;
  }
  function sd() {
    var e = V.p;
    return e !== 0 ? e : (e = window.event, e === void 0 ? 32 : Vf(e.type));
  }
  function cd(e, t) {
    var l = V.p;
    try {
      return V.p = e, t();
    } finally {
      V.p = l;
    }
  }
  var Nl = Math.random().toString(36).slice(2), ut = "__reactFiber$" + Nl, xt = "__reactProps$" + Nl, sn = "__reactContainer$" + Nl, Ts = "__reactEvents$" + Nl, yp = "__reactListeners$" + Nl, Sp = "__reactHandles$" + Nl, ud = "__reactResources$" + Nl, cn = "__reactMarker$" + Nl;
  function As(e) {
    delete e[ut], delete e[xt], delete e[Ts], delete e[yp], delete e[Sp];
  }
  function ga(e) {
    var t = e[ut];
    if (t) return t;
    for (var l = e.parentNode; l; ) {
      if (t = l[sn] || l[ut]) {
        if (l = t.alternate, t.child !== null || l !== null && l.child !== null) for (e = wf(e); e !== null; ) {
          if (l = e[ut]) return l;
          e = wf(e);
        }
        return t;
      }
      e = l, l = e.parentNode;
    }
    return null;
  }
  function va(e) {
    if (e = e[ut] || e[sn]) {
      var t = e.tag;
      if (t === 5 || t === 6 || t === 13 || t === 31 || t === 26 || t === 27 || t === 3) return e;
    }
    return null;
  }
  function un(e) {
    var t = e.tag;
    if (t === 5 || t === 26 || t === 27 || t === 6) return e.stateNode;
    throw Error(o(33));
  }
  function ba(e) {
    var t = e[ud];
    return t || (t = e[ud] = {
      hoistableStyles: /* @__PURE__ */ new Map(),
      hoistableScripts: /* @__PURE__ */ new Map()
    }), t;
  }
  function nt(e) {
    e[cn] = !0;
  }
  var dd = /* @__PURE__ */ new Set(), od = {};
  function Jl(e, t) {
    ja(e, t), ja(e + "Capture", t);
  }
  function ja(e, t) {
    for (od[e] = t, e = 0; e < t.length; e++) dd.add(t[e]);
  }
  var zp = RegExp("^[:A-Z_a-z\\u00C0-\\u00D6\\u00D8-\\u00F6\\u00F8-\\u02FF\\u0370-\\u037D\\u037F-\\u1FFF\\u200C-\\u200D\\u2070-\\u218F\\u2C00-\\u2FEF\\u3001-\\uD7FF\\uF900-\\uFDCF\\uFDF0-\\uFFFD][:A-Z_a-z\\u00C0-\\u00D6\\u00D8-\\u00F6\\u00F8-\\u02FF\\u0370-\\u037D\\u037F-\\u1FFF\\u200C-\\u200D\\u2070-\\u218F\\u2C00-\\u2FEF\\u3001-\\uD7FF\\uF900-\\uFDCF\\uFDF0-\\uFFFD\\-.0-9\\u00B7\\u0300-\\u036F\\u203F-\\u2040]*$"), rd = {}, fd = {};
  function Np(e) {
    return Xt.call(fd, e) ? !0 : Xt.call(rd, e) ? !1 : zp.test(e) ? fd[e] = !0 : (rd[e] = !0, !1);
  }
  function ui(e, t, l) {
    if (Np(t)) if (l === null) e.removeAttribute(t);
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
  function di(e, t, l) {
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
  function Mt(e) {
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
  function pd(e) {
    var t = e.type;
    return (e = e.nodeName) && e.toLowerCase() === "input" && (t === "checkbox" || t === "radio");
  }
  function _p(e, t, l) {
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
  function ws(e) {
    if (!e._valueTracker) {
      var t = pd(e) ? "checked" : "value";
      e._valueTracker = _p(e, t, "" + e[t]);
    }
  }
  function hd(e) {
    if (!e) return !1;
    var t = e._valueTracker;
    if (!t) return !0;
    var l = t.getValue(), a = "";
    return e && (a = pd(e) ? e.checked ? "true" : "false" : e.value), e = a, e !== l ? (t.setValue(e), !0) : !1;
  }
  function oi(e) {
    if (e = e || (typeof document < "u" ? document : void 0), typeof e > "u") return null;
    try {
      return e.activeElement || e.body;
    } catch {
      return e.body;
    }
  }
  var Ep = /[\n"\\]/g;
  function Dt(e) {
    return e.replace(Ep, function(t) {
      return "\\" + t.charCodeAt(0).toString(16) + " ";
    });
  }
  function Cs(e, t, l, a, i, s, c, d) {
    e.name = "", c != null && typeof c != "function" && typeof c != "symbol" && typeof c != "boolean" ? e.type = c : e.removeAttribute("type"), t != null ? c === "number" ? (t === 0 && e.value === "" || e.value != t) && (e.value = "" + Mt(t)) : e.value !== "" + Mt(t) && (e.value = "" + Mt(t)) : c !== "submit" && c !== "reset" || e.removeAttribute("value"), t != null ? Os(e, c, Mt(t)) : l != null ? Os(e, c, Mt(l)) : a != null && e.removeAttribute("value"), i == null && s != null && (e.defaultChecked = !!s), i != null && (e.checked = i && typeof i != "function" && typeof i != "symbol"), d != null && typeof d != "function" && typeof d != "symbol" && typeof d != "boolean" ? e.name = "" + Mt(d) : e.removeAttribute("name");
  }
  function md(e, t, l, a, i, s, c, d) {
    if (s != null && typeof s != "function" && typeof s != "symbol" && typeof s != "boolean" && (e.type = s), t != null || l != null) {
      if (!(s !== "submit" && s !== "reset" || t != null)) {
        ws(e);
        return;
      }
      l = l != null ? "" + Mt(l) : "", t = t != null ? "" + Mt(t) : l, d || t === e.value || (e.value = t), e.defaultValue = t;
    }
    a = a ?? i, a = typeof a != "function" && typeof a != "symbol" && !!a, e.checked = d ? e.checked : !!a, e.defaultChecked = !!a, c != null && typeof c != "function" && typeof c != "symbol" && typeof c != "boolean" && (e.name = c), ws(e);
  }
  function Os(e, t, l) {
    t === "number" && oi(e.ownerDocument) === e || e.defaultValue === "" + l || (e.defaultValue = "" + l);
  }
  function ya(e, t, l, a) {
    if (e = e.options, t) {
      t = {};
      for (var i = 0; i < l.length; i++) t["$" + l[i]] = !0;
      for (l = 0; l < e.length; l++) i = t.hasOwnProperty("$" + e[l].value), e[l].selected !== i && (e[l].selected = i), i && a && (e[l].defaultSelected = !0);
    } else {
      for (l = "" + Mt(l), t = null, i = 0; i < e.length; i++) {
        if (e[i].value === l) {
          e[i].selected = !0, a && (e[i].defaultSelected = !0);
          return;
        }
        t !== null || e[i].disabled || (t = e[i]);
      }
      t !== null && (t.selected = !0);
    }
  }
  function xd(e, t, l) {
    if (t != null && (t = "" + Mt(t), t !== e.value && (e.value = t), l == null)) {
      e.defaultValue !== t && (e.defaultValue = t);
      return;
    }
    e.defaultValue = l != null ? "" + Mt(l) : "";
  }
  function gd(e, t, l, a) {
    if (t == null) {
      if (a != null) {
        if (l != null) throw Error(o(92));
        if (Y(a)) {
          if (1 < a.length) throw Error(o(93));
          a = a[0];
        }
        l = a;
      }
      l ??= "", t = l;
    }
    l = Mt(t), e.defaultValue = l, a = e.textContent, a === l && a !== "" && a !== null && (e.value = a), ws(e);
  }
  function Sa(e, t) {
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
  function vd(e, t, l) {
    var a = t.indexOf("--") === 0;
    l == null || typeof l == "boolean" || l === "" ? a ? e.setProperty(t, "") : t === "float" ? e.cssFloat = "" : e[t] = "" : a ? e.setProperty(t, l) : typeof l != "number" || l === 0 || Tp.has(t) ? t === "float" ? e.cssFloat = l : e[t] = ("" + l).trim() : e[t] = l + "px";
  }
  function bd(e, t, l) {
    if (t != null && typeof t != "object") throw Error(o(62));
    if (e = e.style, l != null) {
      for (var a in l) !l.hasOwnProperty(a) || t != null && t.hasOwnProperty(a) || (a.indexOf("--") === 0 ? e.setProperty(a, "") : a === "float" ? e.cssFloat = "" : e[a] = "");
      for (var i in t) a = t[i], t.hasOwnProperty(i) && l[i] !== a && vd(e, i, a);
    } else for (var s in t) t.hasOwnProperty(s) && vd(e, s, t[s]);
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
  ]), wp = /^[\u0000-\u001F ]*j[\r\n\t]*a[\r\n\t]*v[\r\n\t]*a[\r\n\t]*s[\r\n\t]*c[\r\n\t]*r[\r\n\t]*i[\r\n\t]*p[\r\n\t]*t[\r\n\t]*:/i;
  function ri(e) {
    return wp.test("" + e) ? "javascript:throw new Error('React has blocked a javascript: URL as a security precaution.')" : e;
  }
  function ll() {
  }
  var Ds = null;
  function ks(e) {
    return e = e.target || e.srcElement || window, e.correspondingUseElement && (e = e.correspondingUseElement), e.nodeType === 3 ? e.parentNode : e;
  }
  var za = null, Na = null;
  function jd(e) {
    var t = va(e);
    if (t && (e = t.stateNode)) {
      var l = e[xt] || null;
      e: switch (e = t.stateNode, t.type) {
        case "input":
          if (Cs(e, l.value, l.defaultValue, l.defaultValue, l.checked, l.defaultChecked, l.type, l.name), t = l.name, l.type === "radio" && t != null) {
            for (l = e; l.parentNode; ) l = l.parentNode;
            for (l = l.querySelectorAll('input[name="' + Dt("" + t) + '"][type="radio"]'), t = 0; t < l.length; t++) {
              var a = l[t];
              if (a !== e && a.form === e.form) {
                var i = a[xt] || null;
                if (!i) throw Error(o(90));
                Cs(a, i.value, i.defaultValue, i.defaultValue, i.checked, i.defaultChecked, i.type, i.name);
              }
            }
            for (t = 0; t < l.length; t++) a = l[t], a.form === e.form && hd(a);
          }
          break e;
        case "textarea":
          xd(e, l.value, l.defaultValue);
          break e;
        case "select":
          t = l.value, t != null && ya(e, !!l.multiple, t, !1);
      }
    }
  }
  var Us = !1;
  function yd(e, t, l) {
    if (Us) return e(t, l);
    Us = !0;
    try {
      return e(t);
    } finally {
      if (Us = !1, (za !== null || Na !== null) && (Fi(), za && (t = za, e = Na, Na = za = null, jd(t), e)))
        for (t = 0; t < e.length; t++) jd(e[t]);
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
    if (l && typeof l != "function") throw Error(o(231, t, typeof l));
    return l;
  }
  var al = !(typeof window > "u" || typeof window.document > "u" || typeof window.document.createElement > "u"), Rs = !1;
  if (al) try {
    var on = {};
    Object.defineProperty(on, "passive", { get: function() {
      Rs = !0;
    } }), window.addEventListener("test", on, on), window.removeEventListener("test", on, on);
  } catch {
    Rs = !1;
  }
  var _l = null, qs = null, fi = null;
  function Sd() {
    if (fi) return fi;
    var e, t = qs, l = t.length, a, i = "value" in _l ? _l.value : _l.textContent, s = i.length;
    for (e = 0; e < l && t[e] === i[e]; e++) ;
    var c = l - e;
    for (a = 1; a <= c && t[l - a] === i[s - a]; a++) ;
    return fi = i.slice(e, 1 < a ? 1 - a : void 0);
  }
  function pi(e) {
    var t = e.keyCode;
    return "charCode" in e ? (e = e.charCode, e === 0 && t === 13 && (e = 13)) : e = t, e === 10 && (e = 13), 32 <= e || e === 13 ? e : 0;
  }
  function hi() {
    return !0;
  }
  function zd() {
    return !1;
  }
  function gt(e) {
    function t(l, a, i, s, c) {
      this._reactName = l, this._targetInst = i, this.type = a, this.nativeEvent = s, this.target = c, this.currentTarget = null;
      for (var d in e) e.hasOwnProperty(d) && (l = e[d], this[d] = l ? l(s) : s[d]);
      return this.isDefaultPrevented = (s.defaultPrevented != null ? s.defaultPrevented : s.returnValue === !1) ? hi : zd, this.isPropagationStopped = zd, this;
    }
    return B(t.prototype, {
      preventDefault: function() {
        this.defaultPrevented = !0;
        var l = this.nativeEvent;
        l && (l.preventDefault ? l.preventDefault() : typeof l.returnValue != "unknown" && (l.returnValue = !1), this.isDefaultPrevented = hi);
      },
      stopPropagation: function() {
        var l = this.nativeEvent;
        l && (l.stopPropagation ? l.stopPropagation() : typeof l.cancelBubble != "unknown" && (l.cancelBubble = !0), this.isPropagationStopped = hi);
      },
      persist: function() {
      },
      isPersistent: hi
    }), t;
  }
  var Il = {
    eventPhase: 0,
    bubbles: 0,
    cancelable: 0,
    timeStamp: function(e) {
      return e.timeStamp || Date.now();
    },
    defaultPrevented: 0,
    isTrusted: 0
  }, mi = gt(Il), rn = B({}, Il, {
    view: 0,
    detail: 0
  }), Cp = gt(rn), Hs, Bs, fn, xi = B({}, rn, {
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
    getModifierState: Ys,
    button: 0,
    buttons: 0,
    relatedTarget: function(e) {
      return e.relatedTarget === void 0 ? e.fromElement === e.srcElement ? e.toElement : e.fromElement : e.relatedTarget;
    },
    movementX: function(e) {
      return "movementX" in e ? e.movementX : (e !== fn && (fn && e.type === "mousemove" ? (Hs = e.screenX - fn.screenX, Bs = e.screenY - fn.screenY) : Bs = Hs = 0, fn = e), Hs);
    },
    movementY: function(e) {
      return "movementY" in e ? e.movementY : Bs;
    }
  }), Nd = gt(xi), Op = gt(B({}, xi, { dataTransfer: 0 })), Ls = gt(B({}, rn, { relatedTarget: 0 })), Mp = gt(B({}, Il, {
    animationName: 0,
    elapsedTime: 0,
    pseudoElement: 0
  })), Dp = gt(B({}, Il, { clipboardData: function(e) {
    return "clipboardData" in e ? e.clipboardData : window.clipboardData;
  } })), _d = gt(B({}, Il, { data: 0 })), kp = {
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
  }, Up = {
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
  }, Rp = {
    Alt: "altKey",
    Control: "ctrlKey",
    Meta: "metaKey",
    Shift: "shiftKey"
  };
  function qp(e) {
    var t = this.nativeEvent;
    return t.getModifierState ? t.getModifierState(e) : (e = Rp[e]) ? !!t[e] : !1;
  }
  function Ys() {
    return qp;
  }
  var Hp = gt(B({}, rn, {
    key: function(e) {
      if (e.key) {
        var t = kp[e.key] || e.key;
        if (t !== "Unidentified") return t;
      }
      return e.type === "keypress" ? (e = pi(e), e === 13 ? "Enter" : String.fromCharCode(e)) : e.type === "keydown" || e.type === "keyup" ? Up[e.keyCode] || "Unidentified" : "";
    },
    code: 0,
    location: 0,
    ctrlKey: 0,
    shiftKey: 0,
    altKey: 0,
    metaKey: 0,
    repeat: 0,
    locale: 0,
    getModifierState: Ys,
    charCode: function(e) {
      return e.type === "keypress" ? pi(e) : 0;
    },
    keyCode: function(e) {
      return e.type === "keydown" || e.type === "keyup" ? e.keyCode : 0;
    },
    which: function(e) {
      return e.type === "keypress" ? pi(e) : e.type === "keydown" || e.type === "keyup" ? e.keyCode : 0;
    }
  })), Ed = gt(B({}, xi, {
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
  })), Bp = gt(B({}, rn, {
    touches: 0,
    targetTouches: 0,
    changedTouches: 0,
    altKey: 0,
    metaKey: 0,
    ctrlKey: 0,
    shiftKey: 0,
    getModifierState: Ys
  })), Lp = gt(B({}, Il, {
    propertyName: 0,
    elapsedTime: 0,
    pseudoElement: 0
  })), Yp = gt(B({}, xi, {
    deltaX: function(e) {
      return "deltaX" in e ? e.deltaX : "wheelDeltaX" in e ? -e.wheelDeltaX : 0;
    },
    deltaY: function(e) {
      return "deltaY" in e ? e.deltaY : "wheelDeltaY" in e ? -e.wheelDeltaY : "wheelDelta" in e ? -e.wheelDelta : 0;
    },
    deltaZ: 0,
    deltaMode: 0
  })), Gp = gt(B({}, Il, {
    newState: 0,
    oldState: 0
  })), Vp = [
    9,
    13,
    27,
    32
  ], Gs = al && "CompositionEvent" in window, pn = null;
  al && "documentMode" in document && (pn = document.documentMode);
  var Xp = al && "TextEvent" in window && !pn, Td = al && (!Gs || pn && 8 < pn && 11 >= pn), Ad = " ", wd = !1;
  function Cd(e, t) {
    switch (e) {
      case "keyup":
        return Vp.indexOf(t.keyCode) !== -1;
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
  function Od(e) {
    return e = e.detail, typeof e == "object" && "data" in e ? e.data : null;
  }
  var _a = !1;
  function Qp(e, t) {
    switch (e) {
      case "compositionend":
        return Od(t);
      case "keypress":
        return t.which !== 32 ? null : (wd = !0, Ad);
      case "textInput":
        return e = t.data, e === Ad && wd ? null : e;
      default:
        return null;
    }
  }
  function Zp(e, t) {
    if (_a) return e === "compositionend" || !Gs && Cd(e, t) ? (e = Sd(), fi = qs = _l = null, _a = !1, e) : null;
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
        return Td && t.locale !== "ko" ? null : t.data;
      default:
        return null;
    }
  }
  var Kp = {
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
  function Md(e) {
    var t = e && e.nodeName && e.nodeName.toLowerCase();
    return t === "input" ? !!Kp[e.type] : t === "textarea";
  }
  function Dd(e, t, l, a) {
    za ? Na ? Na.push(a) : Na = [a] : za = a, t = is(t, "onChange"), 0 < t.length && (l = new mi("onChange", "change", null, l, a), e.push({
      event: l,
      listeners: t
    }));
  }
  var hn = null, mn = null;
  function Jp(e) {
    hf(e, 0);
  }
  function gi(e) {
    if (hd(un(e))) return e;
  }
  function kd(e, t) {
    if (e === "change") return t;
  }
  var Ud = !1;
  if (al) {
    var Vs;
    if (al) {
      var Xs = "oninput" in document;
      if (!Xs) {
        var Rd = document.createElement("div");
        Rd.setAttribute("oninput", "return;"), Xs = typeof Rd.oninput == "function";
      }
      Vs = Xs;
    } else Vs = !1;
    Ud = Vs && (!document.documentMode || 9 < document.documentMode);
  }
  function qd() {
    hn && (hn.detachEvent("onpropertychange", Hd), mn = hn = null);
  }
  function Hd(e) {
    if (e.propertyName === "value" && gi(mn)) {
      var t = [];
      Dd(t, mn, e, ks(e)), yd(Jp, t);
    }
  }
  function Ip(e, t, l) {
    e === "focusin" ? (qd(), hn = t, mn = l, hn.attachEvent("onpropertychange", Hd)) : e === "focusout" && qd();
  }
  function $p(e) {
    if (e === "selectionchange" || e === "keyup" || e === "keydown") return gi(mn);
  }
  function Wp(e, t) {
    if (e === "click") return gi(t);
  }
  function Fp(e, t) {
    if (e === "input" || e === "change") return gi(t);
  }
  function Pp(e, t) {
    return e === t && (e !== 0 || 1 / e === 1 / t) || e !== e && t !== t;
  }
  var _t = typeof Object.is == "function" ? Object.is : Pp;
  function xn(e, t) {
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
  function Bd(e) {
    for (; e && e.firstChild; ) e = e.firstChild;
    return e;
  }
  function Ld(e, t) {
    var l = Bd(e);
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
      l = Bd(l);
    }
  }
  function Yd(e, t) {
    return e && t ? e === t ? !0 : e && e.nodeType === 3 ? !1 : t && t.nodeType === 3 ? Yd(e, t.parentNode) : "contains" in e ? e.contains(t) : e.compareDocumentPosition ? !!(e.compareDocumentPosition(t) & 16) : !1 : !1;
  }
  function Gd(e) {
    e = e != null && e.ownerDocument != null && e.ownerDocument.defaultView != null ? e.ownerDocument.defaultView : window;
    for (var t = oi(e.document); t instanceof e.HTMLIFrameElement; ) {
      try {
        var l = typeof t.contentWindow.location.href == "string";
      } catch {
        l = !1;
      }
      if (l) e = t.contentWindow;
      else break;
      t = oi(e.document);
    }
    return t;
  }
  function Qs(e) {
    var t = e && e.nodeName && e.nodeName.toLowerCase();
    return t && (t === "input" && (e.type === "text" || e.type === "search" || e.type === "tel" || e.type === "url" || e.type === "password") || t === "textarea" || e.contentEditable === "true");
  }
  var e0 = al && "documentMode" in document && 11 >= document.documentMode, Ea = null, Zs = null, gn = null, Ks = !1;
  function Vd(e, t, l) {
    var a = l.window === l ? l.document : l.nodeType === 9 ? l : l.ownerDocument;
    Ks || Ea == null || Ea !== oi(a) || (a = Ea, "selectionStart" in a && Qs(a) ? a = {
      start: a.selectionStart,
      end: a.selectionEnd
    } : (a = (a.ownerDocument && a.ownerDocument.defaultView || window).getSelection(), a = {
      anchorNode: a.anchorNode,
      anchorOffset: a.anchorOffset,
      focusNode: a.focusNode,
      focusOffset: a.focusOffset
    }), gn && xn(gn, a) || (gn = a, a = is(Zs, "onSelect"), 0 < a.length && (t = new mi("onSelect", "select", null, t, l), e.push({
      event: t,
      listeners: a
    }), t.target = Ea)));
  }
  function $l(e, t) {
    var l = {};
    return l[e.toLowerCase()] = t.toLowerCase(), l["Webkit" + e] = "webkit" + t, l["Moz" + e] = "moz" + t, l;
  }
  var Ta = {
    animationend: $l("Animation", "AnimationEnd"),
    animationiteration: $l("Animation", "AnimationIteration"),
    animationstart: $l("Animation", "AnimationStart"),
    transitionrun: $l("Transition", "TransitionRun"),
    transitionstart: $l("Transition", "TransitionStart"),
    transitioncancel: $l("Transition", "TransitionCancel"),
    transitionend: $l("Transition", "TransitionEnd")
  }, Js = {}, Xd = {};
  al && (Xd = document.createElement("div").style, "AnimationEvent" in window || (delete Ta.animationend.animation, delete Ta.animationiteration.animation, delete Ta.animationstart.animation), "TransitionEvent" in window || delete Ta.transitionend.transition);
  function Wl(e) {
    if (Js[e]) return Js[e];
    if (!Ta[e]) return e;
    var t = Ta[e], l;
    for (l in t) if (t.hasOwnProperty(l) && l in Xd) return Js[e] = t[l];
    return e;
  }
  var Qd = Wl("animationend"), Zd = Wl("animationiteration"), Kd = Wl("animationstart"), t0 = Wl("transitionrun"), l0 = Wl("transitionstart"), a0 = Wl("transitioncancel"), Jd = Wl("transitionend"), Id = /* @__PURE__ */ new Map(), Is = "abort auxClick beforeToggle cancel canPlay canPlayThrough click close contextMenu copy cut drag dragEnd dragEnter dragExit dragLeave dragOver dragStart drop durationChange emptied encrypted ended error gotPointerCapture input invalid keyDown keyPress keyUp load loadedData loadedMetadata loadStart lostPointerCapture mouseDown mouseMove mouseOut mouseOver mouseUp paste pause play playing pointerCancel pointerDown pointerMove pointerOut pointerOver pointerUp progress rateChange reset resize seeked seeking stalled submit suspend timeUpdate touchCancel touchEnd touchStart volumeChange scroll toggle touchMove waiting wheel".split(" ");
  Is.push("scrollEnd");
  function Zt(e, t) {
    Id.set(e, t), Jl(t, [e]);
  }
  var vi = typeof reportError == "function" ? reportError : function(e) {
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
  }, kt = [], Aa = 0, $s = 0;
  function bi() {
    for (var e = Aa, t = $s = Aa = 0; t < e; ) {
      var l = kt[t];
      kt[t++] = null;
      var a = kt[t];
      kt[t++] = null;
      var i = kt[t];
      kt[t++] = null;
      var s = kt[t];
      if (kt[t++] = null, a !== null && i !== null) {
        var c = a.pending;
        c === null ? i.next = i : (i.next = c.next, c.next = i), a.pending = i;
      }
      s !== 0 && $d(l, i, s);
    }
  }
  function ji(e, t, l, a) {
    kt[Aa++] = e, kt[Aa++] = t, kt[Aa++] = l, kt[Aa++] = a, $s |= a, e.lanes |= a, e = e.alternate, e !== null && (e.lanes |= a);
  }
  function Ws(e, t, l, a) {
    return ji(e, t, l, a), yi(e);
  }
  function Fl(e, t) {
    return ji(e, null, null, t), yi(e);
  }
  function $d(e, t, l) {
    e.lanes |= l;
    var a = e.alternate;
    a !== null && (a.lanes |= l);
    for (var i = !1, s = e.return; s !== null; ) s.childLanes |= l, a = s.alternate, a !== null && (a.childLanes |= l), s.tag === 22 && (e = s.stateNode, e === null || e._visibility & 1 || (i = !0)), e = s, s = s.return;
    return e.tag === 3 ? (s = e.stateNode, i && t !== null && (i = 31 - Nt(l), e = s.hiddenUpdates, a = e[i], a === null ? e[i] = [t] : a.push(t), t.lane = l | 536870912), s) : null;
  }
  function yi(e) {
    if (50 < Bn) throw Bn = 0, su = null, Error(o(185));
    for (var t = e.return; t !== null; ) e = t, t = e.return;
    return e.tag === 3 ? e.stateNode : null;
  }
  var wa = {};
  function n0(e, t, l, a) {
    this.tag = e, this.key = l, this.sibling = this.child = this.return = this.stateNode = this.type = this.elementType = null, this.index = 0, this.refCleanup = this.ref = null, this.pendingProps = t, this.dependencies = this.memoizedState = this.updateQueue = this.memoizedProps = null, this.mode = a, this.subtreeFlags = this.flags = 0, this.deletions = null, this.childLanes = this.lanes = 0, this.alternate = null;
  }
  function Et(e, t, l, a) {
    return new n0(e, t, l, a);
  }
  function Fs(e) {
    return e = e.prototype, !(!e || !e.isReactComponent);
  }
  function nl(e, t) {
    var l = e.alternate;
    return l === null ? (l = Et(e.tag, t, e.key, e.mode), l.elementType = e.elementType, l.type = e.type, l.stateNode = e.stateNode, l.alternate = e, e.alternate = l) : (l.pendingProps = t, l.type = e.type, l.flags = 0, l.subtreeFlags = 0, l.deletions = null), l.flags = e.flags & 65011712, l.childLanes = e.childLanes, l.lanes = e.lanes, l.child = e.child, l.memoizedProps = e.memoizedProps, l.memoizedState = e.memoizedState, l.updateQueue = e.updateQueue, t = e.dependencies, l.dependencies = t === null ? null : {
      lanes: t.lanes,
      firstContext: t.firstContext
    }, l.sibling = e.sibling, l.index = e.index, l.ref = e.ref, l.refCleanup = e.refCleanup, l;
  }
  function Wd(e, t) {
    e.flags &= 65011714;
    var l = e.alternate;
    return l === null ? (e.childLanes = 0, e.lanes = t, e.child = null, e.subtreeFlags = 0, e.memoizedProps = null, e.memoizedState = null, e.updateQueue = null, e.dependencies = null, e.stateNode = null) : (e.childLanes = l.childLanes, e.lanes = l.lanes, e.child = l.child, e.subtreeFlags = 0, e.deletions = null, e.memoizedProps = l.memoizedProps, e.memoizedState = l.memoizedState, e.updateQueue = l.updateQueue, e.type = l.type, t = l.dependencies, e.dependencies = t === null ? null : {
      lanes: t.lanes,
      firstContext: t.firstContext
    }), e;
  }
  function Si(e, t, l, a, i, s) {
    var c = 0;
    if (a = e, typeof e == "function") Fs(e) && (c = 1);
    else if (typeof e == "string") c = oh(e, l, $.current) ? 26 : e === "html" || e === "head" || e === "body" ? 27 : 5;
    else e: switch (e) {
      case b:
        return e = Et(31, l, t, i), e.elementType = b, e.lanes = s, e;
      case I:
        return Pl(l.children, i, s, t);
      case q:
        c = 8, i |= 24;
        break;
      case K:
        return e = Et(12, l, t, i | 2), e.elementType = K, e.lanes = s, e;
      case F:
        return e = Et(13, l, t, i), e.elementType = F, e.lanes = s, e;
      case fe:
        return e = Et(19, l, t, i), e.elementType = fe, e.lanes = s, e;
      default:
        if (typeof e == "object" && e !== null) switch (e.$$typeof) {
          case W:
            c = 10;
            break e;
          case de:
            c = 9;
            break e;
          case te:
            c = 11;
            break e;
          case ie:
            c = 14;
            break e;
          case J:
            c = 16, a = null;
            break e;
        }
        c = 29, l = Error(o(130, e === null ? "null" : typeof e, "")), a = null;
    }
    return t = Et(c, l, t, i), t.elementType = e, t.type = a, t.lanes = s, t;
  }
  function Pl(e, t, l, a) {
    return e = Et(7, e, a, t), e.lanes = l, e;
  }
  function Ps(e, t, l) {
    return e = Et(6, e, null, t), e.lanes = l, e;
  }
  function Fd(e) {
    var t = Et(18, null, null, 0);
    return t.stateNode = e, t;
  }
  function ec(e, t, l) {
    return t = Et(4, e.children !== null ? e.children : [], e.key, t), t.lanes = l, t.stateNode = {
      containerInfo: e.containerInfo,
      pendingChildren: null,
      implementation: e.implementation
    }, t;
  }
  var Pd = /* @__PURE__ */ new WeakMap();
  function Ut(e, t) {
    if (typeof e == "object" && e !== null) {
      var l = Pd.get(e);
      return l !== void 0 ? l : (t = {
        value: e,
        source: t,
        stack: Ae(t)
      }, Pd.set(e, t), t);
    }
    return {
      value: e,
      source: t,
      stack: Ae(t)
    };
  }
  var Ca = [], Oa = 0, zi = null, vn = 0, Rt = [], qt = 0, El = null, $t = 1, Wt = "";
  function il(e, t) {
    Ca[Oa++] = vn, Ca[Oa++] = zi, zi = e, vn = t;
  }
  function eo(e, t, l) {
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
  function tc(e) {
    e.return !== null && (il(e, 1), eo(e, 1, 0));
  }
  function lc(e) {
    for (; e === zi; ) zi = Ca[--Oa], Ca[Oa] = null, vn = Ca[--Oa], Ca[Oa] = null;
    for (; e === El; ) El = Rt[--qt], Rt[qt] = null, Wt = Rt[--qt], Rt[qt] = null, $t = Rt[--qt], Rt[qt] = null;
  }
  function to(e, t) {
    Rt[qt++] = $t, Rt[qt++] = Wt, Rt[qt++] = El, $t = t.id, Wt = t.overflow, El = e;
  }
  var dt = null, Ve = null, _e = !1, Tl = null, Ht = !1, ac = Error(o(519));
  function Al(e) {
    throw bn(Ut(Error(o(418, 1 < arguments.length && arguments[1] !== void 0 && arguments[1] ? "text" : "HTML", "")), e)), ac;
  }
  function lo(e) {
    var t = e.stateNode, l = e.type, a = e.memoizedProps;
    switch (t[ut] = e, t[xt] = a, l) {
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
        Se("invalid", t), md(t, a.value, a.defaultValue, a.checked, a.defaultChecked, a.type, a.name, !0);
        break;
      case "select":
        Se("invalid", t);
        break;
      case "textarea":
        Se("invalid", t), gd(t, a.value, a.defaultValue, a.children);
    }
    l = a.children, typeof l != "string" && typeof l != "number" && typeof l != "bigint" || t.textContent === "" + l || a.suppressHydrationWarning === !0 || bf(t.textContent, l) ? (a.popover != null && (Se("beforetoggle", t), Se("toggle", t)), a.onScroll != null && Se("scroll", t), a.onScrollEnd != null && Se("scrollend", t), a.onClick != null && (t.onclick = ll), t = !0) : t = !1, t || Al(e, !0);
  }
  function ao(e) {
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
    if (!_e) return ao(e), _e = !0, !1;
    var t = e.tag, l;
    if ((l = t !== 3 && t !== 27) && ((l = t === 5) && (l = e.type, l = !(l !== "form" && l !== "button") || ju(e.type, e.memoizedProps)), l = !l), l && Ve && Al(e), ao(e), t === 13) {
      if (e = e.memoizedState, e = e !== null ? e.dehydrated : null, !e) throw Error(o(317));
      Ve = Af(e);
    } else if (t === 31) {
      if (e = e.memoizedState, e = e !== null ? e.dehydrated : null, !e) throw Error(o(317));
      Ve = Af(e);
    } else t === 27 ? (t = Ve, Ll(e.type) ? (e = _u, _u = null, Ve = e) : Ve = t) : Ve = dt ? Yt(e.stateNode.nextSibling) : null;
    return !0;
  }
  function ea() {
    Ve = dt = null, _e = !1;
  }
  function nc() {
    var e = Tl;
    return e !== null && (yt === null ? yt = e : yt.push.apply(yt, e), Tl = null), e;
  }
  function bn(e) {
    Tl === null ? Tl = [e] : Tl.push(e);
  }
  var ic = m(null), ta = null, sl = null;
  function wl(e, t, l) {
    X(ic, t._currentValue), t._currentValue = l;
  }
  function cl(e) {
    e._currentValue = ic.current, U(ic);
  }
  function sc(e, t, l) {
    for (; e !== null; ) {
      var a = e.alternate;
      if ((e.childLanes & t) !== t ? (e.childLanes |= t, a !== null && (a.childLanes |= t)) : a !== null && (a.childLanes & t) !== t && (a.childLanes |= t), e === l) break;
      e = e.return;
    }
  }
  function cc(e, t, l, a) {
    var i = e.child;
    for (i !== null && (i.return = e); i !== null; ) {
      var s = i.dependencies;
      if (s !== null) {
        var c = i.child;
        s = s.firstContext;
        e: for (; s !== null; ) {
          var d = s;
          s = i;
          for (var p = 0; p < t.length; p++) if (d.context === t[p]) {
            s.lanes |= l, d = s.alternate, d !== null && (d.lanes |= l), sc(s.return, l, e), a || (c = null);
            break e;
          }
          s = d.next;
        }
      } else if (i.tag === 18) {
        if (c = i.return, c === null) throw Error(o(341));
        c.lanes |= l, s = c.alternate, s !== null && (s.lanes |= l), sc(c, l, e), c = null;
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
  function Da(e, t, l, a) {
    e = null;
    for (var i = t, s = !1; i !== null; ) {
      if (!s) {
        if ((i.flags & 524288) !== 0) s = !0;
        else if ((i.flags & 262144) !== 0) break;
      }
      if (i.tag === 10) {
        var c = i.alternate;
        if (c === null) throw Error(o(387));
        if (c = c.memoizedProps, c !== null) {
          var d = i.type;
          _t(i.pendingProps.value, c.value) || (e !== null ? e.push(d) : e = [d]);
        }
      } else if (i === he.current) {
        if (c = i.alternate, c === null) throw Error(o(387));
        c.memoizedState.memoizedState !== i.memoizedState.memoizedState && (e !== null ? e.push(Zn) : e = [Zn]);
      }
      i = i.return;
    }
    e !== null && cc(t, e, l, a), t.flags |= 262144;
  }
  function Ni(e) {
    for (e = e.firstContext; e !== null; ) {
      if (!_t(e.context._currentValue, e.memoizedValue)) return !0;
      e = e.next;
    }
    return !1;
  }
  function la(e) {
    ta = e, sl = null, e = e.dependencies, e !== null && (e.firstContext = null);
  }
  function ot(e) {
    return no(ta, e);
  }
  function _i(e, t) {
    return ta === null && la(e), no(e, t);
  }
  function no(e, t) {
    var l = t._currentValue;
    if (t = {
      context: t,
      memoizedValue: l,
      next: null
    }, sl === null) {
      if (e === null) throw Error(o(308));
      sl = t, e.dependencies = {
        lanes: 0,
        firstContext: t
      }, e.flags |= 524288;
    } else sl = sl.next = t;
    return l;
  }
  var i0 = typeof AbortController < "u" ? AbortController : function() {
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
  }, s0 = v.unstable_scheduleCallback, c0 = v.unstable_NormalPriority, Pe = {
    $$typeof: W,
    Consumer: null,
    Provider: null,
    _currentValue: null,
    _currentValue2: null,
    _threadCount: 0
  };
  function uc() {
    return {
      controller: new i0(),
      data: /* @__PURE__ */ new Map(),
      refCount: 0
    };
  }
  function jn(e) {
    e.refCount--, e.refCount === 0 && s0(c0, function() {
      e.controller.abort();
    });
  }
  var yn = null, dc = 0, ka = 0, Ua = null;
  function u0(e, t) {
    if (yn === null) {
      var l = yn = [];
      dc = 0, ka = fu(), Ua = {
        status: "pending",
        value: void 0,
        then: function(a) {
          l.push(a);
        }
      };
    }
    return dc++, t.then(io, io), t;
  }
  function io() {
    if (--dc === 0 && yn !== null) {
      Ua !== null && (Ua.status = "fulfilled");
      var e = yn;
      yn = null, ka = 0, Ua = null;
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
  var so = O.S;
  O.S = function(e, t) {
    Yr = ke(), typeof t == "object" && t !== null && typeof t.then == "function" && u0(e, t), so !== null && so(e, t);
  };
  var aa = m(null);
  function oc() {
    var e = aa.current;
    return e !== null ? e : Ye.pooledCache;
  }
  function Ei(e, t) {
    t === null ? X(aa, aa.current) : X(aa, t.pool);
  }
  function co() {
    var e = oc();
    return e === null ? null : {
      parent: Pe._currentValue,
      pool: e
    };
  }
  var Ra = Error(o(460)), rc = Error(o(474)), Ti = Error(o(542)), Ai = { then: function() {
  } };
  function uo(e) {
    return e = e.status, e === "fulfilled" || e === "rejected";
  }
  function oo(e, t, l) {
    switch (l = e[l], l === void 0 ? e.push(t) : l !== t && (t.then(ll, ll), t = l), t.status) {
      case "fulfilled":
        return t.value;
      case "rejected":
        throw e = t.reason, fo(e), e;
      default:
        if (typeof t.status == "string") t.then(ll, ll);
        else {
          if (e = Ye, e !== null && 100 < e.shellSuspendCounter) throw Error(o(482));
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
            throw e = t.reason, fo(e), e;
        }
        throw ia = t, Ra;
    }
  }
  function na(e) {
    try {
      var t = e._init;
      return t(e._payload);
    } catch (l) {
      throw l !== null && typeof l == "object" && typeof l.then == "function" ? (ia = l, Ra) : l;
    }
  }
  var ia = null;
  function ro() {
    if (ia === null) throw Error(o(459));
    var e = ia;
    return ia = null, e;
  }
  function fo(e) {
    if (e === Ra || e === Ti) throw Error(o(483));
  }
  var qa = null, Sn = 0;
  function wi(e) {
    var t = Sn;
    return Sn += 1, qa === null && (qa = []), oo(qa, e, t);
  }
  function zn(e, t) {
    t = t.props.ref, e.ref = t !== void 0 ? t : null;
  }
  function Ci(e, t) {
    throw t.$$typeof === ne ? Error(o(525)) : (e = Object.prototype.toString.call(t), Error(o(31, e === "[object Object]" ? "object with keys {" + Object.keys(t).join(", ") + "}" : e)));
  }
  function po(e) {
    function t(j, g) {
      if (e) {
        var y = j.deletions;
        y === null ? (j.deletions = [g], j.flags |= 16) : y.push(g);
      }
    }
    function l(j, g) {
      if (!e) return null;
      for (; g !== null; ) t(j, g), g = g.sibling;
      return null;
    }
    function a(j) {
      for (var g = /* @__PURE__ */ new Map(); j !== null; ) j.key !== null ? g.set(j.key, j) : g.set(j.index, j), j = j.sibling;
      return g;
    }
    function i(j, g) {
      return j = nl(j, g), j.index = 0, j.sibling = null, j;
    }
    function s(j, g, y) {
      return j.index = y, e ? (y = j.alternate, y !== null ? (y = y.index, y < g ? (j.flags |= 67108866, g) : y) : (j.flags |= 67108866, g)) : (j.flags |= 1048576, g);
    }
    function c(j) {
      return e && j.alternate === null && (j.flags |= 67108866), j;
    }
    function d(j, g, y, D) {
      return g === null || g.tag !== 6 ? (g = Ps(y, j.mode, D), g.return = j, g) : (g = i(g, y), g.return = j, g);
    }
    function p(j, g, y, D) {
      var se = y.type;
      return se === I ? C(j, g, y.props.children, D, y.key) : g !== null && (g.elementType === se || typeof se == "object" && se !== null && se.$$typeof === J && na(se) === g.type) ? (g = i(g, y.props), zn(g, y), g.return = j, g) : (g = Si(y.type, y.key, y.props, null, j.mode, D), zn(g, y), g.return = j, g);
    }
    function S(j, g, y, D) {
      return g === null || g.tag !== 4 || g.stateNode.containerInfo !== y.containerInfo || g.stateNode.implementation !== y.implementation ? (g = ec(y, j.mode, D), g.return = j, g) : (g = i(g, y.children || []), g.return = j, g);
    }
    function C(j, g, y, D, se) {
      return g === null || g.tag !== 7 ? (g = Pl(y, j.mode, D, se), g.return = j, g) : (g = i(g, y), g.return = j, g);
    }
    function R(j, g, y) {
      if (typeof g == "string" && g !== "" || typeof g == "number" || typeof g == "bigint") return g = Ps("" + g, j.mode, y), g.return = j, g;
      if (typeof g == "object" && g !== null) {
        switch (g.$$typeof) {
          case ue:
            return y = Si(g.type, g.key, g.props, null, j.mode, y), zn(y, g), y.return = j, y;
          case L:
            return g = ec(g, j.mode, y), g.return = j, g;
          case J:
            return g = na(g), R(j, g, y);
        }
        if (Y(g) || Te(g)) return g = Pl(g, j.mode, y, null), g.return = j, g;
        if (typeof g.then == "function") return R(j, wi(g), y);
        if (g.$$typeof === W) return R(j, _i(j, g), y);
        Ci(j, g);
      }
      return null;
    }
    function z(j, g, y, D) {
      var se = g !== null ? g.key : null;
      if (typeof y == "string" && y !== "" || typeof y == "number" || typeof y == "bigint") return se !== null ? null : d(j, g, "" + y, D);
      if (typeof y == "object" && y !== null) {
        switch (y.$$typeof) {
          case ue:
            return y.key === se ? p(j, g, y, D) : null;
          case L:
            return y.key === se ? S(j, g, y, D) : null;
          case J:
            return y = na(y), z(j, g, y, D);
        }
        if (Y(y) || Te(y)) return se !== null ? null : C(j, g, y, D, null);
        if (typeof y.then == "function") return z(j, g, wi(y), D);
        if (y.$$typeof === W) return z(j, g, _i(j, y), D);
        Ci(j, y);
      }
      return null;
    }
    function A(j, g, y, D, se) {
      if (typeof D == "string" && D !== "" || typeof D == "number" || typeof D == "bigint") return j = j.get(y) || null, d(g, j, "" + D, se);
      if (typeof D == "object" && D !== null) {
        switch (D.$$typeof) {
          case ue:
            return j = j.get(D.key === null ? y : D.key) || null, p(g, j, D, se);
          case L:
            return j = j.get(D.key === null ? y : D.key) || null, S(g, j, D, se);
          case J:
            return D = na(D), A(j, g, y, D, se);
        }
        if (Y(D) || Te(D)) return j = j.get(y) || null, C(g, j, D, se, null);
        if (typeof D.then == "function") return A(j, g, y, wi(D), se);
        if (D.$$typeof === W) return A(j, g, y, _i(g, D), se);
        Ci(g, D);
      }
      return null;
    }
    function ee(j, g, y, D) {
      for (var se = null, we = null, ae = g, ve = g = 0, Ne = null; ae !== null && ve < y.length; ve++) {
        ae.index > ve ? (Ne = ae, ae = null) : Ne = ae.sibling;
        var Ce = z(j, ae, y[ve], D);
        if (Ce === null) {
          ae === null && (ae = Ne);
          break;
        }
        e && ae && Ce.alternate === null && t(j, ae), g = s(Ce, g, ve), we === null ? se = Ce : we.sibling = Ce, we = Ce, ae = Ne;
      }
      if (ve === y.length) return l(j, ae), _e && il(j, ve), se;
      if (ae === null) {
        for (; ve < y.length; ve++) ae = R(j, y[ve], D), ae !== null && (g = s(ae, g, ve), we === null ? se = ae : we.sibling = ae, we = ae);
        return _e && il(j, ve), se;
      }
      for (ae = a(ae); ve < y.length; ve++) Ne = A(ae, j, ve, y[ve], D), Ne !== null && (e && Ne.alternate !== null && ae.delete(Ne.key === null ? ve : Ne.key), g = s(Ne, g, ve), we === null ? se = Ne : we.sibling = Ne, we = Ne);
      return e && ae.forEach(function(Ql) {
        return t(j, Ql);
      }), _e && il(j, ve), se;
    }
    function oe(j, g, y, D) {
      if (y == null) throw Error(o(151));
      for (var se = null, we = null, ae = g, ve = g = 0, Ne = null, Ce = y.next(); ae !== null && !Ce.done; ve++, Ce = y.next()) {
        ae.index > ve ? (Ne = ae, ae = null) : Ne = ae.sibling;
        var Ql = z(j, ae, Ce.value, D);
        if (Ql === null) {
          ae === null && (ae = Ne);
          break;
        }
        e && ae && Ql.alternate === null && t(j, ae), g = s(Ql, g, ve), we === null ? se = Ql : we.sibling = Ql, we = Ql, ae = Ne;
      }
      if (Ce.done) return l(j, ae), _e && il(j, ve), se;
      if (ae === null) {
        for (; !Ce.done; ve++, Ce = y.next()) Ce = R(j, Ce.value, D), Ce !== null && (g = s(Ce, g, ve), we === null ? se = Ce : we.sibling = Ce, we = Ce);
        return _e && il(j, ve), se;
      }
      for (ae = a(ae); !Ce.done; ve++, Ce = y.next()) Ce = A(ae, j, ve, Ce.value, D), Ce !== null && (e && Ce.alternate !== null && ae.delete(Ce.key === null ? ve : Ce.key), g = s(Ce, g, ve), we === null ? se = Ce : we.sibling = Ce, we = Ce);
      return e && ae.forEach(function(Nh) {
        return t(j, Nh);
      }), _e && il(j, ve), se;
    }
    function Be(j, g, y, D) {
      if (typeof y == "object" && y !== null && y.type === I && y.key === null && (y = y.props.children), typeof y == "object" && y !== null) {
        switch (y.$$typeof) {
          case ue:
            e: {
              for (var se = y.key; g !== null; ) {
                if (g.key === se) {
                  if (se = y.type, se === I) {
                    if (g.tag === 7) {
                      l(j, g.sibling), D = i(g, y.props.children), D.return = j, j = D;
                      break e;
                    }
                  } else if (g.elementType === se || typeof se == "object" && se !== null && se.$$typeof === J && na(se) === g.type) {
                    l(j, g.sibling), D = i(g, y.props), zn(D, y), D.return = j, j = D;
                    break e;
                  }
                  l(j, g);
                  break;
                } else t(j, g);
                g = g.sibling;
              }
              y.type === I ? (D = Pl(y.props.children, j.mode, D, y.key), D.return = j, j = D) : (D = Si(y.type, y.key, y.props, null, j.mode, D), zn(D, y), D.return = j, j = D);
            }
            return c(j);
          case L:
            e: {
              for (se = y.key; g !== null; ) {
                if (g.key === se) if (g.tag === 4 && g.stateNode.containerInfo === y.containerInfo && g.stateNode.implementation === y.implementation) {
                  l(j, g.sibling), D = i(g, y.children || []), D.return = j, j = D;
                  break e;
                } else {
                  l(j, g);
                  break;
                }
                else t(j, g);
                g = g.sibling;
              }
              D = ec(y, j.mode, D), D.return = j, j = D;
            }
            return c(j);
          case J:
            return y = na(y), Be(j, g, y, D);
        }
        if (Y(y)) return ee(j, g, y, D);
        if (Te(y)) {
          if (se = Te(y), typeof se != "function") throw Error(o(150));
          return y = se.call(y), oe(j, g, y, D);
        }
        if (typeof y.then == "function") return Be(j, g, wi(y), D);
        if (y.$$typeof === W) return Be(j, g, _i(j, y), D);
        Ci(j, y);
      }
      return typeof y == "string" && y !== "" || typeof y == "number" || typeof y == "bigint" ? (y = "" + y, g !== null && g.tag === 6 ? (l(j, g.sibling), D = i(g, y), D.return = j, j = D) : (l(j, g), D = Ps(y, j.mode, D), D.return = j, j = D), c(j)) : l(j, g);
    }
    return function(j, g, y, D) {
      try {
        Sn = 0;
        var se = Be(j, g, y, D);
        return qa = null, se;
      } catch (ae) {
        if (ae === Ra || ae === Ti) throw ae;
        var we = Et(29, ae, null, j.mode);
        return we.lanes = D, we.return = j, we;
      }
    };
  }
  var sa = po(!0), ho = po(!1), Cl = !1;
  function fc(e) {
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
  function pc(e, t) {
    e = e.updateQueue, t.updateQueue === e && (t.updateQueue = {
      baseState: e.baseState,
      firstBaseUpdate: e.firstBaseUpdate,
      lastBaseUpdate: e.lastBaseUpdate,
      shared: e.shared,
      callbacks: null
    });
  }
  function ca(e) {
    return {
      lane: e,
      tag: 0,
      payload: null,
      callback: null,
      next: null
    };
  }
  function ua(e, t, l) {
    var a = e.updateQueue;
    if (a === null) return null;
    if (a = a.shared, (Oe & 2) !== 0) {
      var i = a.pending;
      return i === null ? t.next = t : (t.next = i.next, i.next = t), a.pending = t, t = yi(e), $d(e, null, l), t;
    }
    return ji(e, a, t, l), yi(e);
  }
  function Nn(e, t, l) {
    if (t = t.updateQueue, t !== null && (t = t.shared, (l & 4194048) !== 0)) {
      var a = t.lanes;
      a &= e.pendingLanes, l |= a, t.lanes = l, ad(e, l);
    }
  }
  function hc(e, t) {
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
  var mc = !1;
  function _n() {
    if (mc) {
      var e = Ua;
      if (e !== null) throw e;
    }
  }
  function En(e, t, l, a) {
    mc = !1;
    var i = e.updateQueue;
    Cl = !1;
    var s = i.firstBaseUpdate, c = i.lastBaseUpdate, d = i.shared.pending;
    if (d !== null) {
      i.shared.pending = null;
      var p = d, S = p.next;
      p.next = null, c === null ? s = S : c.next = S, c = p;
      var C = e.alternate;
      C !== null && (C = C.updateQueue, d = C.lastBaseUpdate, d !== c && (d === null ? C.firstBaseUpdate = S : d.next = S, C.lastBaseUpdate = p));
    }
    if (s !== null) {
      var R = i.baseState;
      c = 0, C = S = p = null, d = s;
      do {
        var z = d.lane & -536870913, A = z !== d.lane;
        if (A ? (ze & z) === z : (a & z) === z) {
          z !== 0 && z === ka && (mc = !0), C !== null && (C = C.next = {
            lane: 0,
            tag: d.tag,
            payload: d.payload,
            callback: null,
            next: null
          });
          e: {
            var ee = e, oe = d;
            z = t;
            var Be = l;
            switch (oe.tag) {
              case 1:
                if (ee = oe.payload, typeof ee == "function") {
                  R = ee.call(Be, R, z);
                  break e;
                }
                R = ee;
                break e;
              case 3:
                ee.flags = ee.flags & -65537 | 128;
              case 0:
                if (ee = oe.payload, z = typeof ee == "function" ? ee.call(Be, R, z) : ee, z == null) break e;
                R = B({}, R, z);
                break e;
              case 2:
                Cl = !0;
            }
          }
          z = d.callback, z !== null && (e.flags |= 64, A && (e.flags |= 8192), A = i.callbacks, A === null ? i.callbacks = [z] : A.push(z));
        } else A = {
          lane: z,
          tag: d.tag,
          payload: d.payload,
          callback: d.callback,
          next: null
        }, C === null ? (S = C = A, p = R) : C = C.next = A, c |= z;
        if (d = d.next, d === null) {
          if (d = i.shared.pending, d === null) break;
          A = d, d = A.next, A.next = null, i.lastBaseUpdate = A, i.shared.pending = null;
        }
      } while (!0);
      C === null && (p = R), i.baseState = p, i.firstBaseUpdate = S, i.lastBaseUpdate = C, s === null && (i.shared.lanes = 0), Ul |= c, e.lanes = c, e.memoizedState = R;
    }
  }
  function mo(e, t) {
    if (typeof e != "function") throw Error(o(191, e));
    e.call(t);
  }
  function xo(e, t) {
    var l = e.callbacks;
    if (l !== null) for (e.callbacks = null, e = 0; e < l.length; e++) mo(l[e], t);
  }
  var Ha = m(null), Oi = m(0);
  function go(e, t) {
    e = xl, X(Oi, e), X(Ha, t), xl = e | t.baseLanes;
  }
  function xc() {
    X(Oi, xl), X(Ha, Ha.current);
  }
  function gc() {
    xl = Oi.current, U(Ha), U(Oi);
  }
  var Tt = m(null), Bt = null;
  function Ol(e) {
    var t = e.alternate;
    X($e, $e.current & 1), X(Tt, e), Bt === null && (t === null || Ha.current !== null || t.memoizedState !== null) && (Bt = e);
  }
  function vc(e) {
    X($e, $e.current), X(Tt, e), Bt === null && (Bt = e);
  }
  function vo(e) {
    e.tag === 22 ? (X($e, $e.current), X(Tt, e), Bt === null && (Bt = e)) : Ml(e);
  }
  function Ml() {
    X($e, $e.current), X(Tt, Tt.current);
  }
  function At(e) {
    U(Tt), Bt === e && (Bt = null), U($e);
  }
  var $e = m(0);
  function Mi(e) {
    for (var t = e; t !== null; ) {
      if (t.tag === 13) {
        var l = t.memoizedState;
        if (l !== null && (l = l.dehydrated, l === null || zu(l) || Nu(l))) return t;
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
  var ul = 0, ge = null, qe = null, et = null, Di = !1, Ba = !1, da = !1, ki = 0, Tn = 0, La = null, o0 = 0;
  function Ke() {
    throw Error(o(321));
  }
  function bc(e, t) {
    if (t === null) return !1;
    for (var l = 0; l < t.length && l < e.length; l++) if (!_t(e[l], t[l])) return !1;
    return !0;
  }
  function jc(e, t, l, a, i, s) {
    return ul = s, ge = t, t.memoizedState = null, t.updateQueue = null, t.lanes = 0, O.H = e === null || e.memoizedState === null ? tr : Uc, da = !1, s = l(a, i), da = !1, Ba && (s = jo(t, l, a, i)), bo(e), s;
  }
  function bo(e) {
    O.H = Cn;
    var t = qe !== null && qe.next !== null;
    if (ul = 0, et = qe = ge = null, Di = !1, Tn = 0, La = null, t) throw Error(o(300));
    e === null || tt || (e = e.dependencies, e !== null && Ni(e) && (tt = !0));
  }
  function jo(e, t, l, a) {
    ge = e;
    var i = 0;
    do {
      if (Ba && (La = null), Tn = 0, Ba = !1, 25 <= i) throw Error(o(301));
      if (i += 1, et = qe = null, e.updateQueue != null) {
        var s = e.updateQueue;
        s.lastEffect = null, s.events = null, s.stores = null, s.memoCache != null && (s.memoCache.index = 0);
      }
      O.H = lr, s = t(l, a);
    } while (Ba);
    return s;
  }
  function r0() {
    var e = O.H, t = e.useState()[0];
    return t = typeof t.then == "function" ? An(t) : t, e = e.useState()[0], (qe !== null ? qe.memoizedState : null) !== e && (ge.flags |= 1024), t;
  }
  function yc() {
    var e = ki !== 0;
    return ki = 0, e;
  }
  function Sc(e, t, l) {
    t.updateQueue = e.updateQueue, t.flags &= -2053, e.lanes &= ~l;
  }
  function zc(e) {
    if (Di) {
      for (e = e.memoizedState; e !== null; ) {
        var t = e.queue;
        t !== null && (t.pending = null), e = e.next;
      }
      Di = !1;
    }
    ul = 0, et = qe = ge = null, Ba = !1, Tn = ki = 0, La = null;
  }
  function mt() {
    var e = {
      memoizedState: null,
      baseState: null,
      baseQueue: null,
      queue: null,
      next: null
    };
    return et === null ? ge.memoizedState = et = e : et = et.next = e, et;
  }
  function We() {
    if (qe === null) {
      var e = ge.alternate;
      e = e !== null ? e.memoizedState : null;
    } else e = qe.next;
    var t = et === null ? ge.memoizedState : et.next;
    if (t !== null) et = t, qe = e;
    else {
      if (e === null)
        throw ge.alternate === null ? Error(o(467)) : Error(o(310));
      qe = e, e = {
        memoizedState: qe.memoizedState,
        baseState: qe.baseState,
        baseQueue: qe.baseQueue,
        queue: qe.queue,
        next: null
      }, et === null ? ge.memoizedState = et = e : et = et.next = e;
    }
    return et;
  }
  function Ui() {
    return {
      lastEffect: null,
      events: null,
      stores: null,
      memoCache: null
    };
  }
  function An(e) {
    var t = Tn;
    return Tn += 1, La === null && (La = []), e = oo(La, e, t), t = ge, (et === null ? t.memoizedState : et.next) === null && (t = t.alternate, O.H = t === null || t.memoizedState === null ? tr : Uc), e;
  }
  function Ri(e) {
    if (e !== null && typeof e == "object") {
      if (typeof e.then == "function") return An(e);
      if (e.$$typeof === W) return ot(e);
    }
    throw Error(o(438, String(e)));
  }
  function Nc(e) {
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
    }, l === null && (l = Ui(), ge.updateQueue = l), l.memoCache = t, l = t.data[t.index], l === void 0) for (l = t.data[t.index] = Array(e), a = 0; a < e; a++) l[a] = le;
    return t.index++, l;
  }
  function dl(e, t) {
    return typeof t == "function" ? t(e) : t;
  }
  function qi(e) {
    return _c(We(), qe, e);
  }
  function _c(e, t, l) {
    var a = e.queue;
    if (a === null) throw Error(o(311));
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
      var d = c = null, p = null, S = t, C = !1;
      do {
        var R = S.lane & -536870913;
        if (R !== S.lane ? (ze & R) === R : (ul & R) === R) {
          var z = S.revertLane;
          if (z === 0) p !== null && (p = p.next = {
            lane: 0,
            revertLane: 0,
            gesture: null,
            action: S.action,
            hasEagerState: S.hasEagerState,
            eagerState: S.eagerState,
            next: null
          }), R === ka && (C = !0);
          else if ((ul & z) === z) {
            S = S.next, z === ka && (C = !0);
            continue;
          } else R = {
            lane: 0,
            revertLane: S.revertLane,
            gesture: null,
            action: S.action,
            hasEagerState: S.hasEagerState,
            eagerState: S.eagerState,
            next: null
          }, p === null ? (d = p = R, c = s) : p = p.next = R, ge.lanes |= z, Ul |= z;
          R = S.action, da && l(s, R), s = S.hasEagerState ? S.eagerState : l(s, R);
        } else z = {
          lane: R,
          revertLane: S.revertLane,
          gesture: S.gesture,
          action: S.action,
          hasEagerState: S.hasEagerState,
          eagerState: S.eagerState,
          next: null
        }, p === null ? (d = p = z, c = s) : p = p.next = z, ge.lanes |= R, Ul |= R;
        S = S.next;
      } while (S !== null && S !== t);
      if (p === null ? c = s : p.next = d, !_t(s, e.memoizedState) && (tt = !0, C && (l = Ua, l !== null))) throw l;
      e.memoizedState = s, e.baseState = c, e.baseQueue = p, a.lastRenderedState = s;
    }
    return i === null && (a.lanes = 0), [e.memoizedState, a.dispatch];
  }
  function Ec(e) {
    var t = We(), l = t.queue;
    if (l === null) throw Error(o(311));
    l.lastRenderedReducer = e;
    var a = l.dispatch, i = l.pending, s = t.memoizedState;
    if (i !== null) {
      l.pending = null;
      var c = i = i.next;
      do
        s = e(s, c.action), c = c.next;
      while (c !== i);
      _t(s, t.memoizedState) || (tt = !0), t.memoizedState = s, t.baseQueue === null && (t.baseState = s), l.lastRenderedState = s;
    }
    return [s, a];
  }
  function yo(e, t, l) {
    var a = ge, i = We(), s = _e;
    if (s) {
      if (l === void 0) throw Error(o(407));
      l = l();
    } else l = t();
    var c = !_t((qe || i).memoizedState, l);
    if (c && (i.memoizedState = l, tt = !0), i = i.queue, wc(No.bind(null, a, i, e), [e]), i.getSnapshot !== t || c || et !== null && et.memoizedState.tag & 1) {
      if (a.flags |= 2048, Ya(9, { destroy: void 0 }, zo.bind(null, a, i, l, t), null), Ye === null) throw Error(o(349));
      s || (ul & 127) !== 0 || So(a, t, l);
    }
    return l;
  }
  function So(e, t, l) {
    e.flags |= 16384, e = {
      getSnapshot: t,
      value: l
    }, t = ge.updateQueue, t === null ? (t = Ui(), ge.updateQueue = t, t.stores = [e]) : (l = t.stores, l === null ? t.stores = [e] : l.push(e));
  }
  function zo(e, t, l, a) {
    t.value = l, t.getSnapshot = a, _o(t) && Eo(e);
  }
  function No(e, t, l) {
    return l(function() {
      _o(t) && Eo(e);
    });
  }
  function _o(e) {
    var t = e.getSnapshot;
    e = e.value;
    try {
      var l = t();
      return !_t(e, l);
    } catch {
      return !0;
    }
  }
  function Eo(e) {
    var t = Fl(e, 2);
    t !== null && St(t, e, 2);
  }
  function Tc(e) {
    var t = mt();
    if (typeof e == "function") {
      var l = e;
      if (e = l(), da) {
        zl(!0);
        try {
          l();
        } finally {
          zl(!1);
        }
      }
    }
    return t.memoizedState = t.baseState = e, t.queue = {
      pending: null,
      lanes: 0,
      dispatch: null,
      lastRenderedReducer: dl,
      lastRenderedState: e
    }, t;
  }
  function To(e, t, l, a) {
    return e.baseState = l, _c(e, qe, typeof a == "function" ? a : dl);
  }
  function f0(e, t, l, a, i) {
    if (Li(e)) throw Error(o(485));
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
      O.T !== null ? l(!0) : s.isTransition = !1, a(s), l = t.pending, l === null ? (s.next = t.pending = s, Ao(t, s)) : (s.next = l.next, t.pending = l.next = s);
    }
  }
  function Ao(e, t) {
    var l = t.action, a = t.payload, i = e.state;
    if (t.isTransition) {
      var s = O.T, c = {};
      O.T = c;
      try {
        var d = l(i, a), p = O.S;
        p !== null && p(c, d), wo(e, t, d);
      } catch (S) {
        Ac(e, t, S);
      } finally {
        s !== null && c.types !== null && (s.types = c.types), O.T = s;
      }
    } else try {
      s = l(i, a), wo(e, t, s);
    } catch (S) {
      Ac(e, t, S);
    }
  }
  function wo(e, t, l) {
    l !== null && typeof l == "object" && typeof l.then == "function" ? l.then(function(a) {
      Co(e, t, a);
    }, function(a) {
      return Ac(e, t, a);
    }) : Co(e, t, l);
  }
  function Co(e, t, l) {
    t.status = "fulfilled", t.value = l, Oo(t), e.state = l, t = e.pending, t !== null && (l = t.next, l === t ? e.pending = null : (l = l.next, t.next = l, Ao(e, l)));
  }
  function Ac(e, t, l) {
    var a = e.pending;
    if (e.pending = null, a !== null) {
      a = a.next;
      do
        t.status = "rejected", t.reason = l, Oo(t), t = t.next;
      while (t !== a);
    }
    e.action = null;
  }
  function Oo(e) {
    e = e.listeners;
    for (var t = 0; t < e.length; t++) (0, e[t])();
  }
  function Mo(e, t) {
    return t;
  }
  function Do(e, t) {
    if (_e) {
      var l = Ye.formState;
      if (l !== null) {
        e: {
          var a = ge;
          if (_e) {
            if (Ve) {
              t: {
                for (var i = Ve, s = Ht; i.nodeType !== 8; ) {
                  if (!s) {
                    i = null;
                    break t;
                  }
                  if (i = Yt(i.nextSibling), i === null) {
                    i = null;
                    break t;
                  }
                }
                s = i.data, i = s === "F!" || s === "F" ? i : null;
              }
              if (i) {
                Ve = Yt(i.nextSibling), a = i.data === "F!";
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
      lastRenderedReducer: Mo,
      lastRenderedState: t
    }, l.queue = a, l = Fo.bind(null, ge, a), a.dispatch = l, a = Tc(!1), s = kc.bind(null, ge, !1, a.queue), a = mt(), i = {
      state: t,
      dispatch: null,
      action: e,
      pending: null
    }, a.queue = i, l = f0.bind(null, ge, i, s, l), i.dispatch = l, a.memoizedState = e, [
      t,
      l,
      !1
    ];
  }
  function ko(e) {
    return Uo(We(), qe, e);
  }
  function Uo(e, t, l) {
    if (t = _c(e, t, Mo)[0], e = qi(dl)[0], typeof t == "object" && t !== null && typeof t.then == "function") try {
      var a = An(t);
    } catch (c) {
      throw c === Ra ? Ti : c;
    }
    else a = t;
    t = We();
    var i = t.queue, s = i.dispatch;
    return l !== t.memoizedState && (ge.flags |= 2048, Ya(9, { destroy: void 0 }, p0.bind(null, i, l), null)), [
      a,
      s,
      e
    ];
  }
  function p0(e, t) {
    e.action = t;
  }
  function Ro(e) {
    var t = We(), l = qe;
    if (l !== null) return Uo(t, l, e);
    We(), t = t.memoizedState, l = We();
    var a = l.queue.dispatch;
    return l.memoizedState = e, [
      t,
      a,
      !1
    ];
  }
  function Ya(e, t, l, a) {
    return e = {
      tag: e,
      create: l,
      deps: a,
      inst: t,
      next: null
    }, t = ge.updateQueue, t === null && (t = Ui(), ge.updateQueue = t), l = t.lastEffect, l === null ? t.lastEffect = e.next = e : (a = l.next, l.next = e, e.next = a, t.lastEffect = e), e;
  }
  function qo() {
    return We().memoizedState;
  }
  function Hi(e, t, l, a) {
    var i = mt();
    ge.flags |= e, i.memoizedState = Ya(1 | t, { destroy: void 0 }, l, a === void 0 ? null : a);
  }
  function Bi(e, t, l, a) {
    var i = We();
    a = a === void 0 ? null : a;
    var s = i.memoizedState.inst;
    qe !== null && a !== null && bc(a, qe.memoizedState.deps) ? i.memoizedState = Ya(t, s, l, a) : (ge.flags |= e, i.memoizedState = Ya(1 | t, s, l, a));
  }
  function Ho(e, t) {
    Hi(8390656, 8, e, t);
  }
  function wc(e, t) {
    Bi(2048, 8, e, t);
  }
  function h0(e) {
    ge.flags |= 4;
    var t = ge.updateQueue;
    if (t === null) t = Ui(), ge.updateQueue = t, t.events = [e];
    else {
      var l = t.events;
      l === null ? t.events = [e] : l.push(e);
    }
  }
  function Bo(e) {
    var t = We().memoizedState;
    return h0({
      ref: t,
      nextImpl: e
    }), function() {
      if ((Oe & 2) !== 0) throw Error(o(440));
      return t.impl.apply(void 0, arguments);
    };
  }
  function Lo(e, t) {
    return Bi(4, 2, e, t);
  }
  function Yo(e, t) {
    return Bi(4, 4, e, t);
  }
  function Go(e, t) {
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
  function Vo(e, t, l) {
    l = l != null ? l.concat([e]) : null, Bi(4, 4, Go.bind(null, t, e), l);
  }
  function Cc() {
  }
  function Xo(e, t) {
    var l = We();
    t = t === void 0 ? null : t;
    var a = l.memoizedState;
    return t !== null && bc(t, a[1]) ? a[0] : (l.memoizedState = [e, t], e);
  }
  function Qo(e, t) {
    var l = We();
    t = t === void 0 ? null : t;
    var a = l.memoizedState;
    if (t !== null && bc(t, a[1])) return a[0];
    if (a = e(), da) {
      zl(!0);
      try {
        e();
      } finally {
        zl(!1);
      }
    }
    return l.memoizedState = [a, t], a;
  }
  function Oc(e, t, l) {
    return l === void 0 || (ul & 1073741824) !== 0 && (ze & 261930) === 0 ? e.memoizedState = t : (e.memoizedState = l, e = Vr(), ge.lanes |= e, Ul |= e, l);
  }
  function Zo(e, t, l, a) {
    return _t(l, t) ? l : Ha.current !== null ? (e = Oc(e, l, a), _t(e, t) || (tt = !0), e) : (ul & 42) === 0 || (ul & 1073741824) !== 0 && (ze & 261930) === 0 ? (tt = !0, e.memoizedState = l) : (e = Vr(), ge.lanes |= e, Ul |= e, t);
  }
  function Ko(e, t, l, a, i) {
    var s = V.p;
    V.p = s !== 0 && 8 > s ? s : 8;
    var c = O.T, d = {};
    O.T = d, kc(e, !1, t, l);
    try {
      var p = i(), S = O.S;
      S !== null && S(d, p), p !== null && typeof p == "object" && typeof p.then == "function" ? wn(e, t, d0(p, a), Lt(e)) : wn(e, t, a, Lt(e));
    } catch (C) {
      wn(e, t, {
        then: function() {
        },
        status: "rejected",
        reason: C
      }, Lt());
    } finally {
      V.p = s, c !== null && d.types !== null && (c.types = d.types), O.T = c;
    }
  }
  function m0() {
  }
  function Mc(e, t, l, a) {
    if (e.tag !== 5) throw Error(o(476));
    var i = Jo(e).queue;
    Ko(e, i, t, je, l === null ? m0 : function() {
      return Io(e), l(a);
    });
  }
  function Jo(e) {
    var t = e.memoizedState;
    if (t !== null) return t;
    t = {
      memoizedState: je,
      baseState: je,
      baseQueue: null,
      queue: {
        pending: null,
        lanes: 0,
        dispatch: null,
        lastRenderedReducer: dl,
        lastRenderedState: je
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
        lastRenderedReducer: dl,
        lastRenderedState: l
      },
      next: null
    }, e.memoizedState = t, e = e.alternate, e !== null && (e.memoizedState = t), t;
  }
  function Io(e) {
    var t = Jo(e);
    t.next === null && (t = e.alternate.memoizedState), wn(e, t.next.queue, {}, Lt());
  }
  function Dc() {
    return ot(Zn);
  }
  function $o() {
    return We().memoizedState;
  }
  function Wo() {
    return We().memoizedState;
  }
  function x0(e) {
    for (var t = e.return; t !== null; ) {
      switch (t.tag) {
        case 24:
        case 3:
          var l = Lt();
          e = ca(l);
          var a = ua(t, e, l);
          a !== null && (St(a, t, l), Nn(a, t, l)), t = { cache: uc() }, e.payload = t;
          return;
      }
      t = t.return;
    }
  }
  function g0(e, t, l) {
    var a = Lt();
    l = {
      lane: a,
      revertLane: 0,
      gesture: null,
      action: l,
      hasEagerState: !1,
      eagerState: null,
      next: null
    }, Li(e) ? Po(t, l) : (l = Ws(e, t, l, a), l !== null && (St(l, e, a), er(l, t, a)));
  }
  function Fo(e, t, l) {
    wn(e, t, l, Lt());
  }
  function wn(e, t, l, a) {
    var i = {
      lane: a,
      revertLane: 0,
      gesture: null,
      action: l,
      hasEagerState: !1,
      eagerState: null,
      next: null
    };
    if (Li(e)) Po(t, i);
    else {
      var s = e.alternate;
      if (e.lanes === 0 && (s === null || s.lanes === 0) && (s = t.lastRenderedReducer, s !== null)) try {
        var c = t.lastRenderedState, d = s(c, l);
        if (i.hasEagerState = !0, i.eagerState = d, _t(d, c)) return ji(e, t, i, 0), Ye === null && bi(), !1;
      } catch {
      }
      if (l = Ws(e, t, i, a), l !== null) return St(l, e, a), er(l, t, a), !0;
    }
    return !1;
  }
  function kc(e, t, l, a) {
    if (a = {
      lane: 2,
      revertLane: fu(),
      gesture: null,
      action: a,
      hasEagerState: !1,
      eagerState: null,
      next: null
    }, Li(e)) {
      if (t) throw Error(o(479));
    } else t = Ws(e, l, a, 2), t !== null && St(t, e, 2);
  }
  function Li(e) {
    var t = e.alternate;
    return e === ge || t !== null && t === ge;
  }
  function Po(e, t) {
    Ba = Di = !0;
    var l = e.pending;
    l === null ? t.next = t : (t.next = l.next, l.next = t), e.pending = t;
  }
  function er(e, t, l) {
    if ((l & 4194048) !== 0) {
      var a = t.lanes;
      a &= e.pendingLanes, l |= a, t.lanes = l, ad(e, l);
    }
  }
  var Cn = {
    readContext: ot,
    use: Ri,
    useCallback: Ke,
    useContext: Ke,
    useEffect: Ke,
    useImperativeHandle: Ke,
    useLayoutEffect: Ke,
    useInsertionEffect: Ke,
    useMemo: Ke,
    useReducer: Ke,
    useRef: Ke,
    useState: Ke,
    useDebugValue: Ke,
    useDeferredValue: Ke,
    useTransition: Ke,
    useSyncExternalStore: Ke,
    useId: Ke,
    useHostTransitionStatus: Ke,
    useFormState: Ke,
    useActionState: Ke,
    useOptimistic: Ke,
    useMemoCache: Ke,
    useCacheRefresh: Ke
  };
  Cn.useEffectEvent = Ke;
  var tr = {
    readContext: ot,
    use: Ri,
    useCallback: function(e, t) {
      return mt().memoizedState = [e, t === void 0 ? null : t], e;
    },
    useContext: ot,
    useEffect: Ho,
    useImperativeHandle: function(e, t, l) {
      l = l != null ? l.concat([e]) : null, Hi(4194308, 4, Go.bind(null, t, e), l);
    },
    useLayoutEffect: function(e, t) {
      return Hi(4194308, 4, e, t);
    },
    useInsertionEffect: function(e, t) {
      Hi(4, 2, e, t);
    },
    useMemo: function(e, t) {
      var l = mt();
      t = t === void 0 ? null : t;
      var a = e();
      if (da) {
        zl(!0);
        try {
          e();
        } finally {
          zl(!1);
        }
      }
      return l.memoizedState = [a, t], a;
    },
    useReducer: function(e, t, l) {
      var a = mt();
      if (l !== void 0) {
        var i = l(t);
        if (da) {
          zl(!0);
          try {
            l(t);
          } finally {
            zl(!1);
          }
        }
      } else i = t;
      return a.memoizedState = a.baseState = i, e = {
        pending: null,
        lanes: 0,
        dispatch: null,
        lastRenderedReducer: e,
        lastRenderedState: i
      }, a.queue = e, e = e.dispatch = g0.bind(null, ge, e), [a.memoizedState, e];
    },
    useRef: function(e) {
      var t = mt();
      return e = { current: e }, t.memoizedState = e;
    },
    useState: function(e) {
      e = Tc(e);
      var t = e.queue, l = Fo.bind(null, ge, t);
      return t.dispatch = l, [e.memoizedState, l];
    },
    useDebugValue: Cc,
    useDeferredValue: function(e, t) {
      return Oc(mt(), e, t);
    },
    useTransition: function() {
      var e = Tc(!1);
      return e = Ko.bind(null, ge, e.queue, !0, !1), mt().memoizedState = e, [!1, e];
    },
    useSyncExternalStore: function(e, t, l) {
      var a = ge, i = mt();
      if (_e) {
        if (l === void 0) throw Error(o(407));
        l = l();
      } else {
        if (l = t(), Ye === null) throw Error(o(349));
        (ze & 127) !== 0 || So(a, t, l);
      }
      i.memoizedState = l;
      var s = {
        value: l,
        getSnapshot: t
      };
      return i.queue = s, Ho(No.bind(null, a, s, e), [e]), a.flags |= 2048, Ya(9, { destroy: void 0 }, zo.bind(null, a, s, l, t), null), l;
    },
    useId: function() {
      var e = mt(), t = Ye.identifierPrefix;
      if (_e) {
        var l = Wt, a = $t;
        l = (a & ~(1 << 32 - Nt(a) - 1)).toString(32) + l, t = "_" + t + "R_" + l, l = ki++, 0 < l && (t += "H" + l.toString(32)), t += "_";
      } else l = o0++, t = "_" + t + "r_" + l.toString(32) + "_";
      return e.memoizedState = t;
    },
    useHostTransitionStatus: Dc,
    useFormState: Do,
    useActionState: Do,
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
    useMemoCache: Nc,
    useCacheRefresh: function() {
      return mt().memoizedState = x0.bind(null, ge);
    },
    useEffectEvent: function(e) {
      var t = mt(), l = { impl: e };
      return t.memoizedState = l, function() {
        if ((Oe & 2) !== 0) throw Error(o(440));
        return l.impl.apply(void 0, arguments);
      };
    }
  }, Uc = {
    readContext: ot,
    use: Ri,
    useCallback: Xo,
    useContext: ot,
    useEffect: wc,
    useImperativeHandle: Vo,
    useInsertionEffect: Lo,
    useLayoutEffect: Yo,
    useMemo: Qo,
    useReducer: qi,
    useRef: qo,
    useState: function() {
      return qi(dl);
    },
    useDebugValue: Cc,
    useDeferredValue: function(e, t) {
      return Zo(We(), qe.memoizedState, e, t);
    },
    useTransition: function() {
      var e = qi(dl)[0], t = We().memoizedState;
      return [typeof e == "boolean" ? e : An(e), t];
    },
    useSyncExternalStore: yo,
    useId: $o,
    useHostTransitionStatus: Dc,
    useFormState: ko,
    useActionState: ko,
    useOptimistic: function(e, t) {
      return To(We(), qe, e, t);
    },
    useMemoCache: Nc,
    useCacheRefresh: Wo
  };
  Uc.useEffectEvent = Bo;
  var lr = {
    readContext: ot,
    use: Ri,
    useCallback: Xo,
    useContext: ot,
    useEffect: wc,
    useImperativeHandle: Vo,
    useInsertionEffect: Lo,
    useLayoutEffect: Yo,
    useMemo: Qo,
    useReducer: Ec,
    useRef: qo,
    useState: function() {
      return Ec(dl);
    },
    useDebugValue: Cc,
    useDeferredValue: function(e, t) {
      var l = We();
      return qe === null ? Oc(l, e, t) : Zo(l, qe.memoizedState, e, t);
    },
    useTransition: function() {
      var e = Ec(dl)[0], t = We().memoizedState;
      return [typeof e == "boolean" ? e : An(e), t];
    },
    useSyncExternalStore: yo,
    useId: $o,
    useHostTransitionStatus: Dc,
    useFormState: Ro,
    useActionState: Ro,
    useOptimistic: function(e, t) {
      var l = We();
      return qe !== null ? To(l, qe, e, t) : (l.baseState = e, [e, l.queue.dispatch]);
    },
    useMemoCache: Nc,
    useCacheRefresh: Wo
  };
  lr.useEffectEvent = Bo;
  function Rc(e, t, l, a) {
    t = e.memoizedState, l = l(a, t), l = l == null ? t : B({}, t, l), e.memoizedState = l, e.lanes === 0 && (e.updateQueue.baseState = l);
  }
  var qc = {
    enqueueSetState: function(e, t, l) {
      e = e._reactInternals;
      var a = Lt(), i = ca(a);
      i.payload = t, l != null && (i.callback = l), t = ua(e, i, a), t !== null && (St(t, e, a), Nn(t, e, a));
    },
    enqueueReplaceState: function(e, t, l) {
      e = e._reactInternals;
      var a = Lt(), i = ca(a);
      i.tag = 1, i.payload = t, l != null && (i.callback = l), t = ua(e, i, a), t !== null && (St(t, e, a), Nn(t, e, a));
    },
    enqueueForceUpdate: function(e, t) {
      e = e._reactInternals;
      var l = Lt(), a = ca(l);
      a.tag = 2, t != null && (a.callback = t), t = ua(e, a, l), t !== null && (St(t, e, l), Nn(t, e, l));
    }
  };
  function ar(e, t, l, a, i, s, c) {
    return e = e.stateNode, typeof e.shouldComponentUpdate == "function" ? e.shouldComponentUpdate(a, s, c) : t.prototype && t.prototype.isPureReactComponent ? !xn(l, a) || !xn(i, s) : !0;
  }
  function nr(e, t, l, a) {
    e = t.state, typeof t.componentWillReceiveProps == "function" && t.componentWillReceiveProps(l, a), typeof t.UNSAFE_componentWillReceiveProps == "function" && t.UNSAFE_componentWillReceiveProps(l, a), t.state !== e && qc.enqueueReplaceState(t, t.state, null);
  }
  function oa(e, t) {
    var l = t;
    if ("ref" in t) {
      l = {};
      for (var a in t) a !== "ref" && (l[a] = t[a]);
    }
    if (e = e.defaultProps) {
      l === t && (l = B({}, l));
      for (var i in e) l[i] === void 0 && (l[i] = e[i]);
    }
    return l;
  }
  function v0(e) {
    vi(e);
  }
  function b0(e) {
    console.error(e);
  }
  function j0(e) {
    vi(e);
  }
  function Yi(e, t) {
    try {
      var l = e.onUncaughtError;
      l(t.value, { componentStack: t.stack });
    } catch (a) {
      setTimeout(function() {
        throw a;
      });
    }
  }
  function ir(e, t, l) {
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
  function Hc(e, t, l) {
    return l = ca(l), l.tag = 3, l.payload = { element: null }, l.callback = function() {
      Yi(e, t);
    }, l;
  }
  function sr(e) {
    return e = ca(e), e.tag = 3, e;
  }
  function cr(e, t, l, a) {
    var i = l.type.getDerivedStateFromError;
    if (typeof i == "function") {
      var s = a.value;
      e.payload = function() {
        return i(s);
      }, e.callback = function() {
        ir(t, l, a);
      };
    }
    var c = l.stateNode;
    c !== null && typeof c.componentDidCatch == "function" && (e.callback = function() {
      ir(t, l, a), typeof i != "function" && (Rl === null ? Rl = /* @__PURE__ */ new Set([this]) : Rl.add(this));
      var d = a.stack;
      this.componentDidCatch(a.value, { componentStack: d !== null ? d : "" });
    });
  }
  function y0(e, t, l, a, i) {
    if (l.flags |= 32768, a !== null && typeof a == "object" && typeof a.then == "function") {
      if (t = l.alternate, t !== null && Da(t, l, i, !0), l = Tt.current, l !== null) {
        switch (l.tag) {
          case 31:
          case 13:
            return Bt === null ? Pi() : l.alternate === null && Je === 0 && (Je = 3), l.flags &= -257, l.flags |= 65536, l.lanes = i, a === Ai ? l.flags |= 16384 : (t = l.updateQueue, t === null ? l.updateQueue = /* @__PURE__ */ new Set([a]) : t.add(a), du(e, a, i)), !1;
          case 22:
            return l.flags |= 65536, a === Ai ? l.flags |= 16384 : (t = l.updateQueue, t === null ? (t = {
              transitions: null,
              markerInstances: null,
              retryQueue: /* @__PURE__ */ new Set([a])
            }, l.updateQueue = t) : (l = t.retryQueue, l === null ? t.retryQueue = /* @__PURE__ */ new Set([a]) : l.add(a)), du(e, a, i)), !1;
        }
        throw Error(o(435, l.tag));
      }
      return du(e, a, i), Pi(), !1;
    }
    if (_e) return t = Tt.current, t !== null ? ((t.flags & 65536) === 0 && (t.flags |= 256), t.flags |= 65536, t.lanes = i, a !== ac && (e = Error(o(422), { cause: a }), bn(Ut(e, l)))) : (a !== ac && (t = Error(o(423), { cause: a }), bn(Ut(t, l))), e = e.current.alternate, e.flags |= 65536, i &= -i, e.lanes |= i, a = Ut(a, l), i = Hc(e.stateNode, a, i), hc(e, i), Je !== 4 && (Je = 2)), !1;
    var s = Error(o(520), { cause: a });
    if (s = Ut(s, l), Hn === null ? Hn = [s] : Hn.push(s), Je !== 4 && (Je = 2), t === null) return !0;
    a = Ut(a, l), l = t;
    do {
      switch (l.tag) {
        case 3:
          return l.flags |= 65536, e = i & -i, l.lanes |= e, e = Hc(l.stateNode, a, e), hc(l, e), !1;
        case 1:
          if (t = l.type, s = l.stateNode, (l.flags & 128) === 0 && (typeof t.getDerivedStateFromError == "function" || s !== null && typeof s.componentDidCatch == "function" && (Rl === null || !Rl.has(s)))) return l.flags |= 65536, i &= -i, l.lanes |= i, i = sr(i), cr(i, e, l, a), hc(l, i), !1;
      }
      l = l.return;
    } while (l !== null);
    return !1;
  }
  var Bc = Error(o(461)), tt = !1;
  function rt(e, t, l, a) {
    t.child = e === null ? ho(t, null, l, a) : sa(t, e.child, l, a);
  }
  function ur(e, t, l, a, i) {
    l = l.render;
    var s = t.ref;
    if ("ref" in a) {
      var c = {};
      for (var d in a) d !== "ref" && (c[d] = a[d]);
    } else c = a;
    return la(t), a = jc(e, t, l, c, s, i), d = yc(), e !== null && !tt ? (Sc(e, t, i), ol(e, t, i)) : (_e && d && tc(t), t.flags |= 1, rt(e, t, a, i), t.child);
  }
  function dr(e, t, l, a, i) {
    if (e === null) {
      var s = l.type;
      return typeof s == "function" && !Fs(s) && s.defaultProps === void 0 && l.compare === null ? (t.tag = 15, t.type = s, or(e, t, s, a, i)) : (e = Si(l.type, null, a, t, t.mode, i), e.ref = t.ref, e.return = t, t.child = e);
    }
    if (s = e.child, !Kc(e, i)) {
      var c = s.memoizedProps;
      if (l = l.compare, l = l !== null ? l : xn, l(c, a) && e.ref === t.ref) return ol(e, t, i);
    }
    return t.flags |= 1, e = nl(s, a), e.ref = t.ref, e.return = t, t.child = e;
  }
  function or(e, t, l, a, i) {
    if (e !== null) {
      var s = e.memoizedProps;
      if (xn(s, a) && e.ref === t.ref) if (tt = !1, t.pendingProps = a = s, Kc(e, i)) (e.flags & 131072) !== 0 && (tt = !0);
      else return t.lanes = e.lanes, ol(e, t, i);
    }
    return Lc(e, t, l, a, i);
  }
  function rr(e, t, l, a) {
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
        return fr(e, t, s, l, a);
      }
      if ((l & 536870912) !== 0) t.memoizedState = {
        baseLanes: 0,
        cachePool: null
      }, e !== null && Ei(t, s !== null ? s.cachePool : null), s !== null ? go(t, s) : xc(), vo(t);
      else return a = t.lanes = 536870912, fr(e, t, s !== null ? s.baseLanes | l : l, l, a);
    } else s !== null ? (Ei(t, s.cachePool), go(t, s), Ml(t), t.memoizedState = null) : (e !== null && Ei(t, null), xc(), Ml(t));
    return rt(e, t, i, l), t.child;
  }
  function On(e, t) {
    return e !== null && e.tag === 22 || t.stateNode !== null || (t.stateNode = {
      _visibility: 1,
      _pendingMarkers: null,
      _retryCache: null,
      _transitions: null
    }), t.sibling;
  }
  function fr(e, t, l, a, i) {
    var s = oc();
    return s = s === null ? null : {
      parent: Pe._currentValue,
      pool: s
    }, t.memoizedState = {
      baseLanes: l,
      cachePool: s
    }, e !== null && Ei(t, null), xc(), vo(t), e !== null && Da(e, t, a, !0), t.childLanes = i, null;
  }
  function Gi(e, t) {
    return t = Xi({
      mode: t.mode,
      children: t.children
    }, e.mode), t.ref = e.ref, e.child = t, t.return = e, t;
  }
  function pr(e, t, l) {
    return sa(t, e.child, null, l), e = Gi(t, t.pendingProps), e.flags |= 2, At(t), t.memoizedState = null, e;
  }
  function S0(e, t, l) {
    var a = t.pendingProps, i = (t.flags & 128) !== 0;
    if (t.flags &= -129, e === null) {
      if (_e) {
        if (a.mode === "hidden") return e = Gi(t, a), t.lanes = 536870912, On(null, e);
        if (vc(t), (e = Ve) ? (e = Tf(e, Ht), e = e !== null && e.data === "&" ? e : null, e !== null && (t.memoizedState = {
          dehydrated: e,
          treeContext: El !== null ? {
            id: $t,
            overflow: Wt
          } : null,
          retryLane: 536870912,
          hydrationErrors: null
        }, l = Fd(e), l.return = t, t.child = l, dt = t, Ve = null)) : e = null, e === null) throw Al(t);
        return t.lanes = 536870912, null;
      }
      return Gi(t, a);
    }
    var s = e.memoizedState;
    if (s !== null) {
      var c = s.dehydrated;
      if (vc(t), i) if (t.flags & 256) t.flags &= -257, t = pr(e, t, l);
      else if (t.memoizedState !== null) t.child = e.child, t.flags |= 128, t = null;
      else throw Error(o(558));
      else if (tt || Da(e, t, l, !1), i = (l & e.childLanes) !== 0, tt || i) {
        if (a = Ye, a !== null && (c = nd(a, l), c !== 0 && c !== s.retryLane)) throw s.retryLane = c, Fl(e, c), St(a, e, c), Bc;
        Pi(), t = pr(e, t, l);
      } else e = s.treeContext, Ve = Yt(c.nextSibling), dt = t, _e = !0, Tl = null, Ht = !1, e !== null && to(t, e), t = Gi(t, a), t.flags |= 4096;
      return t;
    }
    return e = nl(e.child, {
      mode: a.mode,
      children: a.children
    }), e.ref = t.ref, t.child = e, e.return = t, e;
  }
  function Vi(e, t) {
    var l = t.ref;
    if (l === null) e !== null && e.ref !== null && (t.flags |= 4194816);
    else {
      if (typeof l != "function" && typeof l != "object") throw Error(o(284));
      (e === null || e.ref !== l) && (t.flags |= 4194816);
    }
  }
  function Lc(e, t, l, a, i) {
    return la(t), l = jc(e, t, l, a, void 0, i), a = yc(), e !== null && !tt ? (Sc(e, t, i), ol(e, t, i)) : (_e && a && tc(t), t.flags |= 1, rt(e, t, l, i), t.child);
  }
  function hr(e, t, l, a, i, s) {
    return la(t), t.updateQueue = null, l = jo(t, a, l, i), bo(e), a = yc(), e !== null && !tt ? (Sc(e, t, s), ol(e, t, s)) : (_e && a && tc(t), t.flags |= 1, rt(e, t, l, s), t.child);
  }
  function mr(e, t, l, a, i) {
    if (la(t), t.stateNode === null) {
      var s = wa, c = l.contextType;
      typeof c == "object" && c !== null && (s = ot(c)), s = new l(a, s), t.memoizedState = s.state !== null && s.state !== void 0 ? s.state : null, s.updater = qc, t.stateNode = s, s._reactInternals = t, s = t.stateNode, s.props = a, s.state = t.memoizedState, s.refs = {}, fc(t), c = l.contextType, s.context = typeof c == "object" && c !== null ? ot(c) : wa, s.state = t.memoizedState, c = l.getDerivedStateFromProps, typeof c == "function" && (Rc(t, l, c, a), s.state = t.memoizedState), typeof l.getDerivedStateFromProps == "function" || typeof s.getSnapshotBeforeUpdate == "function" || typeof s.UNSAFE_componentWillMount != "function" && typeof s.componentWillMount != "function" || (c = s.state, typeof s.componentWillMount == "function" && s.componentWillMount(), typeof s.UNSAFE_componentWillMount == "function" && s.UNSAFE_componentWillMount(), c !== s.state && qc.enqueueReplaceState(s, s.state, null), En(t, a, s, i), _n(), s.state = t.memoizedState), typeof s.componentDidMount == "function" && (t.flags |= 4194308), a = !0;
    } else if (e === null) {
      s = t.stateNode;
      var d = t.memoizedProps, p = oa(l, d);
      s.props = p;
      var S = s.context, C = l.contextType;
      c = wa, typeof C == "object" && C !== null && (c = ot(C));
      var R = l.getDerivedStateFromProps;
      C = typeof R == "function" || typeof s.getSnapshotBeforeUpdate == "function", d = t.pendingProps !== d, C || typeof s.UNSAFE_componentWillReceiveProps != "function" && typeof s.componentWillReceiveProps != "function" || (d || S !== c) && nr(t, s, a, c), Cl = !1;
      var z = t.memoizedState;
      s.state = z, En(t, a, s, i), _n(), S = t.memoizedState, d || z !== S || Cl ? (typeof R == "function" && (Rc(t, l, R, a), S = t.memoizedState), (p = Cl || ar(t, l, p, a, z, S, c)) ? (C || typeof s.UNSAFE_componentWillMount != "function" && typeof s.componentWillMount != "function" || (typeof s.componentWillMount == "function" && s.componentWillMount(), typeof s.UNSAFE_componentWillMount == "function" && s.UNSAFE_componentWillMount()), typeof s.componentDidMount == "function" && (t.flags |= 4194308)) : (typeof s.componentDidMount == "function" && (t.flags |= 4194308), t.memoizedProps = a, t.memoizedState = S), s.props = a, s.state = S, s.context = c, a = p) : (typeof s.componentDidMount == "function" && (t.flags |= 4194308), a = !1);
    } else {
      s = t.stateNode, pc(e, t), c = t.memoizedProps, C = oa(l, c), s.props = C, R = t.pendingProps, z = s.context, S = l.contextType, p = wa, typeof S == "object" && S !== null && (p = ot(S)), d = l.getDerivedStateFromProps, (S = typeof d == "function" || typeof s.getSnapshotBeforeUpdate == "function") || typeof s.UNSAFE_componentWillReceiveProps != "function" && typeof s.componentWillReceiveProps != "function" || (c !== R || z !== p) && nr(t, s, a, p), Cl = !1, z = t.memoizedState, s.state = z, En(t, a, s, i), _n();
      var A = t.memoizedState;
      c !== R || z !== A || Cl || e !== null && e.dependencies !== null && Ni(e.dependencies) ? (typeof d == "function" && (Rc(t, l, d, a), A = t.memoizedState), (C = Cl || ar(t, l, C, a, z, A, p) || e !== null && e.dependencies !== null && Ni(e.dependencies)) ? (S || typeof s.UNSAFE_componentWillUpdate != "function" && typeof s.componentWillUpdate != "function" || (typeof s.componentWillUpdate == "function" && s.componentWillUpdate(a, A, p), typeof s.UNSAFE_componentWillUpdate == "function" && s.UNSAFE_componentWillUpdate(a, A, p)), typeof s.componentDidUpdate == "function" && (t.flags |= 4), typeof s.getSnapshotBeforeUpdate == "function" && (t.flags |= 1024)) : (typeof s.componentDidUpdate != "function" || c === e.memoizedProps && z === e.memoizedState || (t.flags |= 4), typeof s.getSnapshotBeforeUpdate != "function" || c === e.memoizedProps && z === e.memoizedState || (t.flags |= 1024), t.memoizedProps = a, t.memoizedState = A), s.props = a, s.state = A, s.context = p, a = C) : (typeof s.componentDidUpdate != "function" || c === e.memoizedProps && z === e.memoizedState || (t.flags |= 4), typeof s.getSnapshotBeforeUpdate != "function" || c === e.memoizedProps && z === e.memoizedState || (t.flags |= 1024), a = !1);
    }
    return s = a, Vi(e, t), a = (t.flags & 128) !== 0, s || a ? (s = t.stateNode, l = a && typeof l.getDerivedStateFromError != "function" ? null : s.render(), t.flags |= 1, e !== null && a ? (t.child = sa(t, e.child, null, i), t.child = sa(t, null, l, i)) : rt(e, t, l, i), t.memoizedState = s.state, e = t.child) : e = ol(e, t, i), e;
  }
  function xr(e, t, l, a) {
    return ea(), t.flags |= 256, rt(e, t, l, a), t.child;
  }
  var Yc = {
    dehydrated: null,
    treeContext: null,
    retryLane: 0,
    hydrationErrors: null
  };
  function Gc(e) {
    return {
      baseLanes: e,
      cachePool: co()
    };
  }
  function Vc(e, t, l) {
    return e = e !== null ? e.childLanes & ~l : 0, t && (e |= Ct), e;
  }
  function gr(e, t, l) {
    var a = t.pendingProps, i = !1, s = (t.flags & 128) !== 0, c;
    if ((c = s) || (c = e !== null && e.memoizedState === null ? !1 : ($e.current & 2) !== 0), c && (i = !0, t.flags &= -129), c = (t.flags & 32) !== 0, t.flags &= -33, e === null) {
      if (_e) {
        if (i ? Ol(t) : Ml(t), (e = Ve) ? (e = Tf(e, Ht), e = e !== null && e.data !== "&" ? e : null, e !== null && (t.memoizedState = {
          dehydrated: e,
          treeContext: El !== null ? {
            id: $t,
            overflow: Wt
          } : null,
          retryLane: 536870912,
          hydrationErrors: null
        }, l = Fd(e), l.return = t, t.child = l, dt = t, Ve = null)) : e = null, e === null) throw Al(t);
        return Nu(e) ? t.lanes = 32 : t.lanes = 536870912, null;
      }
      var d = a.children;
      return a = a.fallback, i ? (Ml(t), i = t.mode, d = Xi({
        mode: "hidden",
        children: d
      }, i), a = Pl(a, i, l, null), d.return = t, a.return = t, d.sibling = a, t.child = d, a = t.child, a.memoizedState = Gc(l), a.childLanes = Vc(e, c, l), t.memoizedState = Yc, On(null, a)) : (Ol(t), Xc(t, d));
    }
    var p = e.memoizedState;
    if (p !== null && (d = p.dehydrated, d !== null)) {
      if (s) t.flags & 256 ? (Ol(t), t.flags &= -257, t = Qc(e, t, l)) : t.memoizedState !== null ? (Ml(t), t.child = e.child, t.flags |= 128, t = null) : (Ml(t), d = a.fallback, i = t.mode, a = Xi({
        mode: "visible",
        children: a.children
      }, i), d = Pl(d, i, l, null), d.flags |= 2, a.return = t, d.return = t, a.sibling = d, t.child = a, sa(t, e.child, null, l), a = t.child, a.memoizedState = Gc(l), a.childLanes = Vc(e, c, l), t.memoizedState = Yc, t = On(null, a));
      else if (Ol(t), Nu(d)) {
        if (c = d.nextSibling && d.nextSibling.dataset, c) var S = c.dgst;
        c = S, a = Error(o(419)), a.stack = "", a.digest = c, bn({
          value: a,
          source: null,
          stack: null
        }), t = Qc(e, t, l);
      } else if (tt || Da(e, t, l, !1), c = (l & e.childLanes) !== 0, tt || c) {
        if (c = Ye, c !== null && (a = nd(c, l), a !== 0 && a !== p.retryLane)) throw p.retryLane = a, Fl(e, a), St(c, e, a), Bc;
        zu(d) || Pi(), t = Qc(e, t, l);
      } else zu(d) ? (t.flags |= 192, t.child = e.child, t = null) : (e = p.treeContext, Ve = Yt(d.nextSibling), dt = t, _e = !0, Tl = null, Ht = !1, e !== null && to(t, e), t = Xc(t, a.children), t.flags |= 4096);
      return t;
    }
    return i ? (Ml(t), d = a.fallback, i = t.mode, p = e.child, S = p.sibling, a = nl(p, {
      mode: "hidden",
      children: a.children
    }), a.subtreeFlags = p.subtreeFlags & 65011712, S !== null ? d = nl(S, d) : (d = Pl(d, i, l, null), d.flags |= 2), d.return = t, a.return = t, a.sibling = d, t.child = a, On(null, a), a = t.child, d = e.child.memoizedState, d === null ? d = Gc(l) : (i = d.cachePool, i !== null ? (p = Pe._currentValue, i = i.parent !== p ? {
      parent: p,
      pool: p
    } : i) : i = co(), d = {
      baseLanes: d.baseLanes | l,
      cachePool: i
    }), a.memoizedState = d, a.childLanes = Vc(e, c, l), t.memoizedState = Yc, On(e.child, a)) : (Ol(t), l = e.child, e = l.sibling, l = nl(l, {
      mode: "visible",
      children: a.children
    }), l.return = t, l.sibling = null, e !== null && (c = t.deletions, c === null ? (t.deletions = [e], t.flags |= 16) : c.push(e)), t.child = l, t.memoizedState = null, l);
  }
  function Xc(e, t) {
    return t = Xi({
      mode: "visible",
      children: t
    }, e.mode), t.return = e, e.child = t;
  }
  function Xi(e, t) {
    return e = Et(22, e, null, t), e.lanes = 0, e;
  }
  function Qc(e, t, l) {
    return sa(t, e.child, null, l), e = Xc(t, t.pendingProps.children), e.flags |= 2, t.memoizedState = null, e;
  }
  function vr(e, t, l) {
    e.lanes |= t;
    var a = e.alternate;
    a !== null && (a.lanes |= t), sc(e.return, t, l);
  }
  function Zc(e, t, l, a, i, s) {
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
  function br(e, t, l) {
    var a = t.pendingProps, i = a.revealOrder, s = a.tail;
    a = a.children;
    var c = $e.current, d = (c & 2) !== 0;
    if (d ? (c = c & 1 | 2, t.flags |= 128) : c &= 1, X($e, c), rt(e, t, a, l), a = _e ? vn : 0, !d && e !== null && (e.flags & 128) !== 0) e: for (e = t.child; e !== null; ) {
      if (e.tag === 13) e.memoizedState !== null && vr(e, l, t);
      else if (e.tag === 19) vr(e, l, t);
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
        for (l = t.child, i = null; l !== null; ) e = l.alternate, e !== null && Mi(e) === null && (i = l), l = l.sibling;
        l = i, l === null ? (i = t.child, t.child = null) : (i = l.sibling, l.sibling = null), Zc(t, !1, i, l, s, a);
        break;
      case "backwards":
      case "unstable_legacy-backwards":
        for (l = null, i = t.child, t.child = null; i !== null; ) {
          if (e = i.alternate, e !== null && Mi(e) === null) {
            t.child = i;
            break;
          }
          e = i.sibling, i.sibling = l, l = i, i = e;
        }
        Zc(t, !0, l, null, s, a);
        break;
      case "together":
        Zc(t, !1, null, null, void 0, a);
        break;
      default:
        t.memoizedState = null;
    }
    return t.child;
  }
  function ol(e, t, l) {
    if (e !== null && (t.dependencies = e.dependencies), Ul |= t.lanes, (l & t.childLanes) === 0) if (e !== null) {
      if (Da(e, t, l, !1), (l & t.childLanes) === 0) return null;
    } else return null;
    if (e !== null && t.child !== e.child) throw Error(o(153));
    if (t.child !== null) {
      for (e = t.child, l = nl(e, e.pendingProps), t.child = l, l.return = t; e.sibling !== null; ) e = e.sibling, l = l.sibling = nl(e, e.pendingProps), l.return = t;
      l.sibling = null;
    }
    return t.child;
  }
  function Kc(e, t) {
    return (e.lanes & t) !== 0 ? !0 : (e = e.dependencies, !!(e !== null && Ni(e)));
  }
  function z0(e, t, l) {
    switch (t.tag) {
      case 3:
        Me(t, t.stateNode.containerInfo), wl(t, Pe, e.memoizedState.cache), ea();
        break;
      case 27:
      case 5:
        Ze(t);
        break;
      case 4:
        Me(t, t.stateNode.containerInfo);
        break;
      case 10:
        wl(t, t.type, t.memoizedProps.value);
        break;
      case 31:
        if (t.memoizedState !== null) return t.flags |= 128, vc(t), null;
        break;
      case 13:
        var a = t.memoizedState;
        if (a !== null)
          return a.dehydrated !== null ? (Ol(t), t.flags |= 128, null) : (l & t.child.childLanes) !== 0 ? gr(e, t, l) : (Ol(t), e = ol(e, t, l), e !== null ? e.sibling : null);
        Ol(t);
        break;
      case 19:
        var i = (e.flags & 128) !== 0;
        if (a = (l & t.childLanes) !== 0, a || (Da(e, t, l, !1), a = (l & t.childLanes) !== 0), i) {
          if (a) return br(e, t, l);
          t.flags |= 128;
        }
        if (i = t.memoizedState, i !== null && (i.rendering = null, i.tail = null, i.lastEffect = null), X($e, $e.current), a) break;
        return null;
      case 22:
        return t.lanes = 0, rr(e, t, l, t.pendingProps);
      case 24:
        wl(t, Pe, e.memoizedState.cache);
    }
    return ol(e, t, l);
  }
  function jr(e, t, l) {
    if (e !== null) if (e.memoizedProps !== t.pendingProps) tt = !0;
    else {
      if (!Kc(e, l) && (t.flags & 128) === 0) return tt = !1, z0(e, t, l);
      tt = (e.flags & 131072) !== 0;
    }
    else tt = !1, _e && (t.flags & 1048576) !== 0 && eo(t, vn, t.index);
    switch (t.lanes = 0, t.tag) {
      case 16:
        e: {
          var a = t.pendingProps;
          if (e = na(t.elementType), t.type = e, typeof e == "function") Fs(e) ? (a = oa(e, a), t.tag = 1, t = mr(null, t, e, a, l)) : (t.tag = 0, t = Lc(null, t, e, a, l));
          else {
            if (e != null) {
              var i = e.$$typeof;
              if (i === te) {
                t.tag = 11, t = ur(null, t, e, a, l);
                break e;
              } else if (i === ie) {
                t.tag = 14, t = dr(null, t, e, a, l);
                break e;
              }
            }
            throw t = Q(e) || e, Error(o(306, t, ""));
          }
        }
        return t;
      case 0:
        return Lc(e, t, t.type, t.pendingProps, l);
      case 1:
        return a = t.type, i = oa(a, t.pendingProps), mr(e, t, a, i, l);
      case 3:
        e: {
          if (Me(t, t.stateNode.containerInfo), e === null) throw Error(o(387));
          a = t.pendingProps;
          var s = t.memoizedState;
          i = s.element, pc(e, t), En(t, a, null, l);
          var c = t.memoizedState;
          if (a = c.cache, wl(t, Pe, a), a !== s.cache && cc(t, [Pe], l, !0), _n(), a = c.element, s.isDehydrated) if (s = {
            element: a,
            isDehydrated: !1,
            cache: c.cache
          }, t.updateQueue.baseState = s, t.memoizedState = s, t.flags & 256) {
            t = xr(e, t, a, l);
            break e;
          } else if (a !== i) {
            i = Ut(Error(o(424)), t), bn(i), t = xr(e, t, a, l);
            break e;
          } else
            for (e = t.stateNode.containerInfo, e.nodeType === 9 ? e = e.body : e = e.nodeName === "HTML" ? e.ownerDocument.body : e, Ve = Yt(e.firstChild), dt = t, _e = !0, Tl = null, Ht = !0, l = ho(t, null, a, l), t.child = l; l; ) l.flags = l.flags & -3 | 4096, l = l.sibling;
          else {
            if (ea(), a === i) {
              t = ol(e, t, l);
              break e;
            }
            rt(e, t, a, l);
          }
          t = t.child;
        }
        return t;
      case 26:
        return Vi(e, t), e === null ? (l = Df(t.type, null, t.pendingProps, null)) ? t.memoizedState = l : _e || (l = t.type, e = t.pendingProps, a = ss(me.current).createElement(l), a[ut] = t, a[xt] = e, ft(a, l, e), nt(a), t.stateNode = a) : t.memoizedState = Df(t.type, e.memoizedProps, t.pendingProps, e.memoizedState), null;
      case 27:
        return Ze(t), e === null && _e && (a = t.stateNode = Cf(t.type, t.pendingProps, me.current), dt = t, Ht = !0, i = Ve, Ll(t.type) ? (_u = i, Ve = Yt(a.firstChild)) : Ve = i), rt(e, t, t.pendingProps.children, l), Vi(e, t), e === null && (t.flags |= 4194304), t.child;
      case 5:
        return e === null && _e && ((i = a = Ve) && (a = W0(a, t.type, t.pendingProps, Ht), a !== null ? (t.stateNode = a, dt = t, Ve = Yt(a.firstChild), Ht = !1, i = !0) : i = !1), i || Al(t)), Ze(t), i = t.type, s = t.pendingProps, c = e !== null ? e.memoizedProps : null, a = s.children, ju(i, s) ? a = null : c !== null && ju(i, c) && (t.flags |= 32), t.memoizedState !== null && (i = jc(e, t, r0, null, null, l), Zn._currentValue = i), Vi(e, t), rt(e, t, a, l), t.child;
      case 6:
        return e === null && _e && ((e = l = Ve) && (l = F0(l, t.pendingProps, Ht), l !== null ? (t.stateNode = l, dt = t, Ve = null, e = !0) : e = !1), e || Al(t)), null;
      case 13:
        return gr(e, t, l);
      case 4:
        return Me(t, t.stateNode.containerInfo), a = t.pendingProps, e === null ? t.child = sa(t, null, a, l) : rt(e, t, a, l), t.child;
      case 11:
        return ur(e, t, t.type, t.pendingProps, l);
      case 7:
        return rt(e, t, t.pendingProps, l), t.child;
      case 8:
        return rt(e, t, t.pendingProps.children, l), t.child;
      case 12:
        return rt(e, t, t.pendingProps.children, l), t.child;
      case 10:
        return a = t.pendingProps, wl(t, t.type, a.value), rt(e, t, a.children, l), t.child;
      case 9:
        return i = t.type._context, a = t.pendingProps.children, la(t), i = ot(i), a = a(i), t.flags |= 1, rt(e, t, a, l), t.child;
      case 14:
        return dr(e, t, t.type, t.pendingProps, l);
      case 15:
        return or(e, t, t.type, t.pendingProps, l);
      case 19:
        return br(e, t, l);
      case 31:
        return S0(e, t, l);
      case 22:
        return rr(e, t, l, t.pendingProps);
      case 24:
        return la(t), a = ot(Pe), e === null ? (i = oc(), i === null && (i = Ye, s = uc(), i.pooledCache = s, s.refCount++, s !== null && (i.pooledCacheLanes |= l), i = s), t.memoizedState = {
          parent: a,
          cache: i
        }, fc(t), wl(t, Pe, i)) : ((e.lanes & l) !== 0 && (pc(e, t), En(t, null, null, l), _n()), i = e.memoizedState, s = t.memoizedState, i.parent !== a ? (i = {
          parent: a,
          cache: a
        }, t.memoizedState = i, t.lanes === 0 && (t.memoizedState = t.updateQueue.baseState = i), wl(t, Pe, a)) : (a = s.cache, wl(t, Pe, a), a !== i.cache && cc(t, [Pe], l, !0))), rt(e, t, t.pendingProps.children, l), t.child;
      case 29:
        throw t.pendingProps;
    }
    throw Error(o(156, t.tag));
  }
  function rl(e) {
    e.flags |= 4;
  }
  function Jc(e, t, l, a, i) {
    if ((t = (e.mode & 32) !== 0) && (t = !1), t) {
      if (e.flags |= 16777216, (i & 335544128) === i) if (e.stateNode.complete) e.flags |= 8192;
      else if (Kr()) e.flags |= 8192;
      else throw ia = Ai, rc;
    } else e.flags &= -16777217;
  }
  function yr(e, t) {
    if (t.type !== "stylesheet" || (t.state.loading & 4) !== 0) e.flags &= -16777217;
    else if (e.flags |= 16777216, !Hf(t)) if (Kr()) e.flags |= 8192;
    else throw ia = Ai, rc;
  }
  function Qi(e, t) {
    t !== null && (e.flags |= 4), e.flags & 16384 && (t = e.tag !== 22 ? td() : 536870912, e.lanes |= t, Qa |= t);
  }
  function Mn(e, t) {
    if (!_e) switch (e.tailMode) {
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
  function N0(e, t, l) {
    var a = t.pendingProps;
    switch (lc(t), t.tag) {
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
        return l = t.stateNode, a = null, e !== null && (a = e.memoizedState.cache), t.memoizedState.cache !== a && (t.flags |= 2048), cl(Pe), xe(), l.pendingContext && (l.context = l.pendingContext, l.pendingContext = null), (e === null || e.child === null) && (Ma(t) ? rl(t) : e === null || e.memoizedState.isDehydrated && (t.flags & 256) === 0 || (t.flags |= 1024, nc())), Xe(t), null;
      case 26:
        var i = t.type, s = t.memoizedState;
        return e === null ? (rl(t), s !== null ? (Xe(t), yr(t, s)) : (Xe(t), Jc(t, i, null, a, l))) : s ? s !== e.memoizedState ? (rl(t), Xe(t), yr(t, s)) : (Xe(t), t.flags &= -16777217) : (e = e.memoizedProps, e !== a && rl(t), Xe(t), Jc(t, i, e, a, l)), null;
      case 27:
        if (pt(t), l = me.current, i = t.type, e !== null && t.stateNode != null) e.memoizedProps !== a && rl(t);
        else {
          if (!a) {
            if (t.stateNode === null) throw Error(o(166));
            return Xe(t), null;
          }
          e = $.current, Ma(t) ? lo(t, e) : (e = Cf(i, a, l), t.stateNode = e, rl(t));
        }
        return Xe(t), null;
      case 5:
        if (pt(t), i = t.type, e !== null && t.stateNode != null) e.memoizedProps !== a && rl(t);
        else {
          if (!a) {
            if (t.stateNode === null) throw Error(o(166));
            return Xe(t), null;
          }
          if (s = $.current, Ma(t)) lo(t, s);
          else {
            var c = ss(me.current);
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
            s[ut] = t, s[xt] = a;
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
            e: switch (ft(s, i, a), i) {
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
        return Xe(t), Jc(t, t.type, e === null ? null : e.memoizedProps, t.pendingProps, l), null;
      case 6:
        if (e && t.stateNode != null) e.memoizedProps !== a && rl(t);
        else {
          if (typeof a != "string" && t.stateNode === null) throw Error(o(166));
          if (e = me.current, Ma(t)) {
            if (e = t.stateNode, l = t.memoizedProps, a = null, i = dt, i !== null) switch (i.tag) {
              case 27:
              case 5:
                a = i.memoizedProps;
            }
            e[ut] = t, e = !!(e.nodeValue === l || a !== null && a.suppressHydrationWarning === !0 || bf(e.nodeValue, l)), e || Al(t, !0);
          } else e = ss(e).createTextNode(a), e[ut] = t, t.stateNode = e;
        }
        return Xe(t), null;
      case 31:
        if (l = t.memoizedState, e === null || e.memoizedState !== null) {
          if (a = Ma(t), l !== null) {
            if (e === null) {
              if (!a) throw Error(o(318));
              if (e = t.memoizedState, e = e !== null ? e.dehydrated : null, !e) throw Error(o(557));
              e[ut] = t;
            } else ea(), (t.flags & 128) === 0 && (t.memoizedState = null), t.flags |= 4;
            Xe(t), e = !1;
          } else l = nc(), e !== null && e.memoizedState !== null && (e.memoizedState.hydrationErrors = l), e = !0;
          if (!e)
            return t.flags & 256 ? (At(t), t) : (At(t), null);
          if ((t.flags & 128) !== 0) throw Error(o(558));
        }
        return Xe(t), null;
      case 13:
        if (a = t.memoizedState, e === null || e.memoizedState !== null && e.memoizedState.dehydrated !== null) {
          if (i = Ma(t), a !== null && a.dehydrated !== null) {
            if (e === null) {
              if (!i) throw Error(o(318));
              if (i = t.memoizedState, i = i !== null ? i.dehydrated : null, !i) throw Error(o(317));
              i[ut] = t;
            } else ea(), (t.flags & 128) === 0 && (t.memoizedState = null), t.flags |= 4;
            Xe(t), i = !1;
          } else i = nc(), e !== null && e.memoizedState !== null && (e.memoizedState.hydrationErrors = i), i = !0;
          if (!i)
            return t.flags & 256 ? (At(t), t) : (At(t), null);
        }
        return At(t), (t.flags & 128) !== 0 ? (t.lanes = l, t) : (l = a !== null, e = e !== null && e.memoizedState !== null, l && (a = t.child, i = null, a.alternate !== null && a.alternate.memoizedState !== null && a.alternate.memoizedState.cachePool !== null && (i = a.alternate.memoizedState.cachePool.pool), s = null, a.memoizedState !== null && a.memoizedState.cachePool !== null && (s = a.memoizedState.cachePool.pool), s !== i && (a.flags |= 2048)), l !== e && l && (t.child.flags |= 8192), Qi(t, t.updateQueue), Xe(t), null);
      case 4:
        return xe(), e === null && mf(t.stateNode.containerInfo), Xe(t), null;
      case 10:
        return cl(t.type), Xe(t), null;
      case 19:
        if (U($e), a = t.memoizedState, a === null) return Xe(t), null;
        if (i = (t.flags & 128) !== 0, s = a.rendering, s === null) if (i) Mn(a, !1);
        else {
          if (Je !== 0 || e !== null && (e.flags & 128) !== 0) for (e = t.child; e !== null; ) {
            if (s = Mi(e), s !== null) {
              for (t.flags |= 128, Mn(a, !1), e = s.updateQueue, t.updateQueue = e, Qi(t, e), t.subtreeFlags = 0, e = l, l = t.child; l !== null; ) Wd(l, e), l = l.sibling;
              return X($e, $e.current & 1 | 2), _e && il(t, a.treeForkCount), t.child;
            }
            e = e.sibling;
          }
          a.tail !== null && ke() > $i && (t.flags |= 128, i = !0, Mn(a, !1), t.lanes = 4194304);
        }
        else {
          if (!i) if (e = Mi(s), e !== null) {
            if (t.flags |= 128, i = !0, e = e.updateQueue, t.updateQueue = e, Qi(t, e), Mn(a, !0), a.tail === null && a.tailMode === "hidden" && !s.alternate && !_e) return Xe(t), null;
          } else 2 * ke() - a.renderingStartTime > $i && l !== 536870912 && (t.flags |= 128, i = !0, Mn(a, !1), t.lanes = 4194304);
          a.isBackwards ? (s.sibling = t.child, t.child = s) : (e = a.last, e !== null ? e.sibling = s : t.child = s, a.last = s);
        }
        return a.tail !== null ? (e = a.tail, a.rendering = e, a.tail = e.sibling, a.renderingStartTime = ke(), e.sibling = null, l = $e.current, X($e, i ? l & 1 | 2 : l & 1), _e && il(t, a.treeForkCount), e) : (Xe(t), null);
      case 22:
      case 23:
        return At(t), gc(), a = t.memoizedState !== null, e !== null ? e.memoizedState !== null !== a && (t.flags |= 8192) : a && (t.flags |= 8192), a ? (l & 536870912) !== 0 && (t.flags & 128) === 0 && (Xe(t), t.subtreeFlags & 6 && (t.flags |= 8192)) : Xe(t), l = t.updateQueue, l !== null && Qi(t, l.retryQueue), l = null, e !== null && e.memoizedState !== null && e.memoizedState.cachePool !== null && (l = e.memoizedState.cachePool.pool), a = null, t.memoizedState !== null && t.memoizedState.cachePool !== null && (a = t.memoizedState.cachePool.pool), a !== l && (t.flags |= 2048), e !== null && U(aa), null;
      case 24:
        return l = null, e !== null && (l = e.memoizedState.cache), t.memoizedState.cache !== l && (t.flags |= 2048), cl(Pe), Xe(t), null;
      case 25:
        return null;
      case 30:
        return null;
    }
    throw Error(o(156, t.tag));
  }
  function _0(e, t) {
    switch (lc(t), t.tag) {
      case 1:
        return e = t.flags, e & 65536 ? (t.flags = e & -65537 | 128, t) : null;
      case 3:
        return cl(Pe), xe(), e = t.flags, (e & 65536) !== 0 && (e & 128) === 0 ? (t.flags = e & -65537 | 128, t) : null;
      case 26:
      case 27:
      case 5:
        return pt(t), null;
      case 31:
        if (t.memoizedState !== null) {
          if (At(t), t.alternate === null) throw Error(o(340));
          ea();
        }
        return e = t.flags, e & 65536 ? (t.flags = e & -65537 | 128, t) : null;
      case 13:
        if (At(t), e = t.memoizedState, e !== null && e.dehydrated !== null) {
          if (t.alternate === null) throw Error(o(340));
          ea();
        }
        return e = t.flags, e & 65536 ? (t.flags = e & -65537 | 128, t) : null;
      case 19:
        return U($e), null;
      case 4:
        return xe(), null;
      case 10:
        return cl(t.type), null;
      case 22:
      case 23:
        return At(t), gc(), e !== null && U(aa), e = t.flags, e & 65536 ? (t.flags = e & -65537 | 128, t) : null;
      case 24:
        return cl(Pe), null;
      case 25:
        return null;
      default:
        return null;
    }
  }
  function Sr(e, t) {
    switch (lc(t), t.tag) {
      case 3:
        cl(Pe), xe();
        break;
      case 26:
      case 27:
      case 5:
        pt(t);
        break;
      case 4:
        xe();
        break;
      case 31:
        t.memoizedState !== null && At(t);
        break;
      case 13:
        At(t);
        break;
      case 19:
        U($e);
        break;
      case 10:
        cl(t.type);
        break;
      case 22:
      case 23:
        At(t), gc(), e !== null && U(aa);
        break;
      case 24:
        cl(Pe);
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
    } catch (d) {
      Re(t, t.return, d);
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
            var c = a.inst, d = c.destroy;
            if (d !== void 0) {
              c.destroy = void 0, i = t;
              var p = l, S = d;
              try {
                S();
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
  function zr(e) {
    var t = e.updateQueue;
    if (t !== null) {
      var l = e.stateNode;
      try {
        xo(t, l);
      } catch (a) {
        Re(e, e.return, a);
      }
    }
  }
  function Nr(e, t, l) {
    l.props = oa(e.type, e.memoizedProps), l.state = e.memoizedState;
    try {
      l.componentWillUnmount();
    } catch (a) {
      Re(e, t, a);
    }
  }
  function kn(e, t) {
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
  function _r(e) {
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
  function Ic(e, t, l) {
    try {
      var a = e.stateNode;
      Q0(a, e.type, l, t), a[xt] = t;
    } catch (i) {
      Re(e, e.return, i);
    }
  }
  function Er(e) {
    return e.tag === 5 || e.tag === 3 || e.tag === 26 || e.tag === 27 && Ll(e.type) || e.tag === 4;
  }
  function $c(e) {
    e: for (; ; ) {
      for (; e.sibling === null; ) {
        if (e.return === null || Er(e.return)) return null;
        e = e.return;
      }
      for (e.sibling.return = e.return, e = e.sibling; e.tag !== 5 && e.tag !== 6 && e.tag !== 18; ) {
        if (e.tag === 27 && Ll(e.type) || e.flags & 2 || e.child === null || e.tag === 4) continue e;
        e.child.return = e, e = e.child;
      }
      if (!(e.flags & 2)) return e.stateNode;
    }
  }
  function Wc(e, t, l) {
    var a = e.tag;
    if (a === 5 || a === 6) e = e.stateNode, t ? (l.nodeType === 9 ? l.body : l.nodeName === "HTML" ? l.ownerDocument.body : l).insertBefore(e, t) : (t = l.nodeType === 9 ? l.body : l.nodeName === "HTML" ? l.ownerDocument.body : l, t.appendChild(e), l = l._reactRootContainer, l != null || t.onclick !== null || (t.onclick = ll));
    else if (a !== 4 && (a === 27 && Ll(e.type) && (l = e.stateNode, t = null), e = e.child, e !== null)) for (Wc(e, t, l), e = e.sibling; e !== null; ) Wc(e, t, l), e = e.sibling;
  }
  function Zi(e, t, l) {
    var a = e.tag;
    if (a === 5 || a === 6) e = e.stateNode, t ? l.insertBefore(e, t) : l.appendChild(e);
    else if (a !== 4 && (a === 27 && Ll(e.type) && (l = e.stateNode), e = e.child, e !== null)) for (Zi(e, t, l), e = e.sibling; e !== null; ) Zi(e, t, l), e = e.sibling;
  }
  function Tr(e) {
    var t = e.stateNode, l = e.memoizedProps;
    try {
      for (var a = e.type, i = t.attributes; i.length; ) t.removeAttributeNode(i[0]);
      ft(t, a, l), t[ut] = e, t[xt] = l;
    } catch (s) {
      Re(e, e.return, s);
    }
  }
  var fl = !1, lt = !1, Fc = !1, Ar = typeof WeakSet == "function" ? WeakSet : Set, it = null;
  function E0(e, t) {
    if (e = e.containerInfo, vu = ps, e = Gd(e), Qs(e)) {
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
          var c = 0, d = -1, p = -1, S = 0, C = 0, R = e, z = null;
          t: for (; ; ) {
            for (var A; R !== l || i !== 0 && R.nodeType !== 3 || (d = c + i), R !== s || a !== 0 && R.nodeType !== 3 || (p = c + a), R.nodeType === 3 && (c += R.nodeValue.length), (A = R.firstChild) !== null; )
              z = R, R = A;
            for (; ; ) {
              if (R === e) break t;
              if (z === l && ++S === i && (d = c), z === s && ++C === a && (p = c), (A = R.nextSibling) !== null) break;
              R = z, z = R.parentNode;
            }
            R = A;
          }
          l = d === -1 || p === -1 ? null : {
            start: d,
            end: p
          };
        } else l = null;
      }
      l = l || {
        start: 0,
        end: 0
      };
    } else l = null;
    for (bu = {
      focusedElem: e,
      selectionRange: l
    }, ps = !1, it = t; it !== null; ) if (t = it, e = t.child, (t.subtreeFlags & 1028) !== 0 && e !== null) e.return = t, it = e;
    else for (; it !== null; ) {
      switch (t = it, s = t.alternate, e = t.flags, t.tag) {
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
              var ee = oa(l.type, i);
              e = a.getSnapshotBeforeUpdate(ee, s), a.__reactInternalSnapshotBeforeUpdate = e;
            } catch (oe) {
              Re(l, l.return, oe);
            }
          }
          break;
        case 3:
          if ((e & 1024) !== 0) {
            if (e = t.stateNode.containerInfo, l = e.nodeType, l === 9) Su(e);
            else if (l === 1) switch (e.nodeName) {
              case "HEAD":
              case "HTML":
              case "BODY":
                Su(e);
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
          if ((e & 1024) !== 0) throw Error(o(163));
      }
      if (e = t.sibling, e !== null) {
        e.return = t.return, it = e;
        break;
      }
      it = t.return;
    }
  }
  function wr(e, t, l) {
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
          var i = oa(l.type, t.memoizedProps);
          t = t.memoizedState;
          try {
            e.componentDidUpdate(i, t, e.__reactInternalSnapshotBeforeUpdate);
          } catch (c) {
            Re(l, l.return, c);
          }
        }
        a & 64 && zr(l), a & 512 && kn(l, l.return);
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
            xo(e, t);
          } catch (c) {
            Re(l, l.return, c);
          }
        }
        break;
      case 27:
        t === null && a & 4 && Tr(l);
      case 26:
      case 5:
        hl(e, l), t === null && a & 4 && _r(l), a & 512 && kn(l, l.return);
        break;
      case 12:
        hl(e, l);
        break;
      case 31:
        hl(e, l), a & 4 && Mr(e, l);
        break;
      case 13:
        hl(e, l), a & 4 && Dr(e, l), a & 64 && (e = l.memoizedState, e !== null && (e = e.dehydrated, e !== null && (l = U0.bind(null, l), P0(e, l))));
        break;
      case 22:
        if (a = l.memoizedState !== null || fl, !a) {
          t = t !== null && t.memoizedState !== null || lt, i = fl;
          var s = lt;
          fl = a, (lt = t) && !s ? ml(e, l, (l.subtreeFlags & 8772) !== 0) : hl(e, l), fl = i, lt = s;
        }
        break;
      case 30:
        break;
      default:
        hl(e, l);
    }
  }
  function Cr(e) {
    var t = e.alternate;
    t !== null && (e.alternate = null, Cr(t)), e.child = null, e.deletions = null, e.sibling = null, e.tag === 5 && (t = e.stateNode, t !== null && As(t)), e.stateNode = null, e.return = null, e.dependencies = null, e.memoizedProps = null, e.memoizedState = null, e.pendingProps = null, e.stateNode = null, e.updateQueue = null;
  }
  var Qe = null, vt = !1;
  function pl(e, t, l) {
    for (l = l.child; l !== null; ) Or(e, t, l), l = l.sibling;
  }
  function Or(e, t, l) {
    if (ht && typeof ht.onCommitFiberUnmount == "function") try {
      ht.onCommitFiberUnmount(Sl, l);
    } catch {
    }
    switch (l.tag) {
      case 26:
        lt || Ft(l, t), pl(e, t, l), l.memoizedState ? l.memoizedState.count-- : l.stateNode && (l = l.stateNode, l.parentNode.removeChild(l));
        break;
      case 27:
        lt || Ft(l, t);
        var a = Qe, i = vt;
        Ll(l.type) && (Qe = l.stateNode, vt = !1), pl(e, t, l), Vn(l.stateNode), Qe = a, vt = i;
        break;
      case 5:
        lt || Ft(l, t);
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
        Qe !== null && (vt ? (e = Qe, _f(e.nodeType === 9 ? e.body : e.nodeName === "HTML" ? e.ownerDocument.body : e, l.stateNode), Pa(e)) : _f(Qe, l.stateNode));
        break;
      case 4:
        a = Qe, i = vt, Qe = l.stateNode.containerInfo, vt = !0, pl(e, t, l), Qe = a, vt = i;
        break;
      case 0:
      case 11:
      case 14:
      case 15:
        Dl(2, l, t), lt || Dl(4, l, t), pl(e, t, l);
        break;
      case 1:
        lt || (Ft(l, t), a = l.stateNode, typeof a.componentWillUnmount == "function" && Nr(l, t, a)), pl(e, t, l);
        break;
      case 21:
        pl(e, t, l);
        break;
      case 22:
        lt = (a = lt) || l.memoizedState !== null, pl(e, t, l), lt = a;
        break;
      default:
        pl(e, t, l);
    }
  }
  function Mr(e, t) {
    if (t.memoizedState === null && (e = t.alternate, e !== null && (e = e.memoizedState, e !== null))) {
      e = e.dehydrated;
      try {
        Pa(e);
      } catch (l) {
        Re(t, t.return, l);
      }
    }
  }
  function Dr(e, t) {
    if (t.memoizedState === null && (e = t.alternate, e !== null && (e = e.memoizedState, e !== null && (e = e.dehydrated, e !== null)))) try {
      Pa(e);
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
        return t === null && (t = e.stateNode = new Ar()), t;
      case 22:
        return e = e.stateNode, t = e._retryCache, t === null && (t = e._retryCache = new Ar()), t;
      default:
        throw Error(o(435, e.tag));
    }
  }
  function Ki(e, t) {
    var l = T0(e);
    t.forEach(function(a) {
      if (!l.has(a)) {
        l.add(a);
        var i = R0.bind(null, e, a);
        a.then(i, i);
      }
    });
  }
  function bt(e, t) {
    var l = t.deletions;
    if (l !== null) for (var a = 0; a < l.length; a++) {
      var i = l[a], s = e, c = t, d = c;
      e: for (; d !== null; ) {
        switch (d.tag) {
          case 27:
            if (Ll(d.type)) {
              Qe = d.stateNode, vt = !1;
              break e;
            }
            break;
          case 5:
            Qe = d.stateNode, vt = !1;
            break e;
          case 3:
          case 4:
            Qe = d.stateNode.containerInfo, vt = !0;
            break e;
        }
        d = d.return;
      }
      if (Qe === null) throw Error(o(160));
      Or(s, c, i), Qe = null, vt = !1, s = i.alternate, s !== null && (s.return = null), i.return = null;
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
        bt(t, e), jt(e), a & 4 && (Dl(3, e, e.return), Dn(3, e), Dl(5, e, e.return));
        break;
      case 1:
        bt(t, e), jt(e), a & 512 && (lt || l === null || Ft(l, l.return)), a & 64 && fl && (e = e.updateQueue, e !== null && (a = e.callbacks, a !== null && (l = e.shared.hiddenCallbacks, e.shared.hiddenCallbacks = l === null ? a : l.concat(a))));
        break;
      case 26:
        var i = Kt;
        if (bt(t, e), jt(e), a & 512 && (lt || l === null || Ft(l, l.return)), a & 4) {
          var s = l !== null ? l.memoizedState : null;
          if (a = e.memoizedState, l === null) if (a === null) if (e.stateNode === null) {
            e: {
              a = e.type, l = e.memoizedProps, i = i.ownerDocument || i;
              t: switch (a) {
                case "title":
                  s = i.getElementsByTagName("title")[0], (!s || s[cn] || s[ut] || s.namespaceURI === "http://www.w3.org/2000/svg" || s.hasAttribute("itemprop")) && (s = i.createElement(a), i.head.insertBefore(s, i.querySelector("head > title"))), ft(s, a, l), s[ut] = e, nt(s), a = s;
                  break e;
                case "link":
                  var c = Rf("link", "href", i).get(a + (l.href || ""));
                  if (c) {
                    for (var d = 0; d < c.length; d++) if (s = c[d], s.getAttribute("href") === (l.href == null || l.href === "" ? null : l.href) && s.getAttribute("rel") === (l.rel == null ? null : l.rel) && s.getAttribute("title") === (l.title == null ? null : l.title) && s.getAttribute("crossorigin") === (l.crossOrigin == null ? null : l.crossOrigin)) {
                      c.splice(d, 1);
                      break t;
                    }
                  }
                  s = i.createElement(a), ft(s, a, l), i.head.appendChild(s);
                  break;
                case "meta":
                  if (c = Rf("meta", "content", i).get(a + (l.content || ""))) {
                    for (d = 0; d < c.length; d++) if (s = c[d], s.getAttribute("content") === (l.content == null ? null : "" + l.content) && s.getAttribute("name") === (l.name == null ? null : l.name) && s.getAttribute("property") === (l.property == null ? null : l.property) && s.getAttribute("http-equiv") === (l.httpEquiv == null ? null : l.httpEquiv) && s.getAttribute("charset") === (l.charSet == null ? null : l.charSet)) {
                      c.splice(d, 1);
                      break t;
                    }
                  }
                  s = i.createElement(a), ft(s, a, l), i.head.appendChild(s);
                  break;
                default:
                  throw Error(o(468, a));
              }
              s[ut] = e, nt(s), a = s;
            }
            e.stateNode = a;
          } else qf(i, e.type, e.stateNode);
          else e.stateNode = Uf(i, a, e.memoizedProps);
          else s !== a ? (s === null ? l.stateNode !== null && (l = l.stateNode, l.parentNode.removeChild(l)) : s.count--, a === null ? qf(i, e.type, e.stateNode) : Uf(i, a, e.memoizedProps)) : a === null && e.stateNode !== null && Ic(e, e.memoizedProps, l.memoizedProps);
        }
        break;
      case 27:
        bt(t, e), jt(e), a & 512 && (lt || l === null || Ft(l, l.return)), l !== null && a & 4 && Ic(e, e.memoizedProps, l.memoizedProps);
        break;
      case 5:
        if (bt(t, e), jt(e), a & 512 && (lt || l === null || Ft(l, l.return)), e.flags & 32) {
          i = e.stateNode;
          try {
            Sa(i, "");
          } catch (ee) {
            Re(e, e.return, ee);
          }
        }
        a & 4 && e.stateNode != null && (i = e.memoizedProps, Ic(e, i, l !== null ? l.memoizedProps : i)), a & 1024 && (Fc = !0);
        break;
      case 6:
        if (bt(t, e), jt(e), a & 4) {
          if (e.stateNode === null) throw Error(o(162));
          a = e.memoizedProps, l = e.stateNode;
          try {
            l.nodeValue = a;
          } catch (ee) {
            Re(e, e.return, ee);
          }
        }
        break;
      case 3:
        if (ds = null, i = Kt, Kt = cs(t.containerInfo), bt(t, e), Kt = i, jt(e), a & 4 && l !== null && l.memoizedState.isDehydrated) try {
          Pa(t.containerInfo);
        } catch (ee) {
          Re(e, e.return, ee);
        }
        Fc && (Fc = !1, Ur(e));
        break;
      case 4:
        a = Kt, Kt = cs(e.stateNode.containerInfo), bt(t, e), jt(e), Kt = a;
        break;
      case 12:
        bt(t, e), jt(e);
        break;
      case 31:
        bt(t, e), jt(e), a & 4 && (a = e.updateQueue, a !== null && (e.updateQueue = null, Ki(e, a)));
        break;
      case 13:
        bt(t, e), jt(e), e.child.flags & 8192 && e.memoizedState !== null != (l !== null && l.memoizedState !== null) && (Ii = ke()), a & 4 && (a = e.updateQueue, a !== null && (e.updateQueue = null, Ki(e, a)));
        break;
      case 22:
        i = e.memoizedState !== null;
        var p = l !== null && l.memoizedState !== null, S = fl, C = lt;
        if (fl = S || i, lt = C || p, bt(t, e), lt = C, fl = S, jt(e), a & 8192) e: for (t = e.stateNode, t._visibility = i ? t._visibility & -2 : t._visibility | 1, i && (l === null || p || fl || lt || ra(e)), l = null, t = e; ; ) {
          if (t.tag === 5 || t.tag === 26) {
            if (l === null) {
              p = l = t;
              try {
                if (s = p.stateNode, i) c = s.style, typeof c.setProperty == "function" ? c.setProperty("display", "none", "important") : c.display = "none";
                else {
                  d = p.stateNode;
                  var R = p.memoizedProps.style, z = R != null && R.hasOwnProperty("display") ? R.display : null;
                  d.style.display = z == null || typeof z == "boolean" ? "" : ("" + z).trim();
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
                i ? Ef(A, !0) : Ef(p.stateNode, !1);
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
        a & 4 && (a = e.updateQueue, a !== null && (l = a.retryQueue, l !== null && (a.retryQueue = null, Ki(e, l))));
        break;
      case 19:
        bt(t, e), jt(e), a & 4 && (a = e.updateQueue, a !== null && (e.updateQueue = null, Ki(e, a)));
        break;
      case 30:
        break;
      case 21:
        break;
      default:
        bt(t, e), jt(e);
    }
  }
  function jt(e) {
    var t = e.flags;
    if (t & 2) {
      try {
        for (var l, a = e.return; a !== null; ) {
          if (Er(a)) {
            l = a;
            break;
          }
          a = a.return;
        }
        if (l == null) throw Error(o(160));
        switch (l.tag) {
          case 27:
            var i = l.stateNode;
            Zi(e, $c(e), i);
            break;
          case 5:
            var s = l.stateNode;
            l.flags & 32 && (Sa(s, ""), l.flags &= -33), Zi(e, $c(e), s);
            break;
          case 3:
          case 4:
            var c = l.stateNode.containerInfo;
            Wc(e, $c(e), c);
            break;
          default:
            throw Error(o(161));
        }
      } catch (d) {
        Re(e, e.return, d);
      }
      e.flags &= -3;
    }
    t & 4096 && (e.flags &= -4097);
  }
  function Ur(e) {
    if (e.subtreeFlags & 1024) for (e = e.child; e !== null; ) {
      var t = e;
      Ur(t), t.tag === 5 && t.flags & 1024 && t.stateNode.reset(), e = e.sibling;
    }
  }
  function hl(e, t) {
    if (t.subtreeFlags & 8772) for (t = t.child; t !== null; ) wr(e, t.alternate, t), t = t.sibling;
  }
  function ra(e) {
    for (e = e.child; e !== null; ) {
      var t = e;
      switch (t.tag) {
        case 0:
        case 11:
        case 14:
        case 15:
          Dl(4, t, t.return), ra(t);
          break;
        case 1:
          Ft(t, t.return);
          var l = t.stateNode;
          typeof l.componentWillUnmount == "function" && Nr(t, t.return, l), ra(t);
          break;
        case 27:
          Vn(t.stateNode);
        case 26:
        case 5:
          Ft(t, t.return), ra(t);
          break;
        case 22:
          t.memoizedState === null && ra(t);
          break;
        case 30:
          ra(t);
          break;
        default:
          ra(t);
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
          } catch (S) {
            Re(a, a.return, S);
          }
          if (a = s, i = a.updateQueue, i !== null) {
            var d = a.stateNode;
            try {
              var p = i.shared.hiddenCallbacks;
              if (p !== null) for (i.shared.hiddenCallbacks = null, i = 0; i < p.length; i++) mo(p[i], d);
            } catch (S) {
              Re(a, a.return, S);
            }
          }
          l && c & 64 && zr(s), kn(s, s.return);
          break;
        case 27:
          Tr(s);
        case 26:
        case 5:
          ml(i, s, l), l && a === null && c & 4 && _r(s), kn(s, s.return);
          break;
        case 12:
          ml(i, s, l);
          break;
        case 31:
          ml(i, s, l), l && c & 4 && Mr(i, s);
          break;
        case 13:
          ml(i, s, l), l && c & 4 && Dr(i, s);
          break;
        case 22:
          s.memoizedState === null && ml(i, s, l), kn(s, s.return);
          break;
        case 30:
          break;
        default:
          ml(i, s, l);
      }
      t = t.sibling;
    }
  }
  function Pc(e, t) {
    var l = null;
    e !== null && e.memoizedState !== null && e.memoizedState.cachePool !== null && (l = e.memoizedState.cachePool.pool), e = null, t.memoizedState !== null && t.memoizedState.cachePool !== null && (e = t.memoizedState.cachePool.pool), e !== l && (e != null && e.refCount++, l != null && jn(l));
  }
  function eu(e, t) {
    e = null, t.alternate !== null && (e = t.alternate.memoizedState.cache), t = t.memoizedState.cache, t !== e && (t.refCount++, e != null && jn(e));
  }
  function Jt(e, t, l, a) {
    if (t.subtreeFlags & 10256) for (t = t.child; t !== null; ) Rr(e, t, l, a), t = t.sibling;
  }
  function Rr(e, t, l, a) {
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
            var s = t.memoizedProps, c = s.id, d = s.onPostCommit;
            typeof d == "function" && d(c, t.alternate === null ? "mount" : "update", e.passiveEffectDuration, -0);
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
        s = t.stateNode, c = t.alternate, t.memoizedState !== null ? s._visibility & 2 ? Jt(e, t, l, a) : Un(e, t) : s._visibility & 2 ? Jt(e, t, l, a) : (s._visibility |= 2, Ga(e, t, l, a, (t.subtreeFlags & 10256) !== 0 || !1)), i & 2048 && Pc(c, t);
        break;
      case 24:
        Jt(e, t, l, a), i & 2048 && eu(t.alternate, t);
        break;
      default:
        Jt(e, t, l, a);
    }
  }
  function Ga(e, t, l, a, i) {
    for (i = i && ((t.subtreeFlags & 10256) !== 0 || !1), t = t.child; t !== null; ) {
      var s = e, c = t, d = l, p = a, S = c.flags;
      switch (c.tag) {
        case 0:
        case 11:
        case 15:
          Ga(s, c, d, p, i), Dn(8, c);
          break;
        case 23:
          break;
        case 22:
          var C = c.stateNode;
          c.memoizedState !== null ? C._visibility & 2 ? Ga(s, c, d, p, i) : Un(s, c) : (C._visibility |= 2, Ga(s, c, d, p, i)), i && S & 2048 && Pc(c.alternate, c);
          break;
        case 24:
          Ga(s, c, d, p, i), i && S & 2048 && eu(c.alternate, c);
          break;
        default:
          Ga(s, c, d, p, i);
      }
      t = t.sibling;
    }
  }
  function Un(e, t) {
    if (t.subtreeFlags & 10256) for (t = t.child; t !== null; ) {
      var l = e, a = t, i = a.flags;
      switch (a.tag) {
        case 22:
          Un(l, a), i & 2048 && Pc(a.alternate, a);
          break;
        case 24:
          Un(l, a), i & 2048 && eu(a.alternate, a);
          break;
        default:
          Un(l, a);
      }
      t = t.sibling;
    }
  }
  var Rn = 8192;
  function Va(e, t, l) {
    if (e.subtreeFlags & Rn) for (e = e.child; e !== null; ) qr(e, t, l), e = e.sibling;
  }
  function qr(e, t, l) {
    switch (e.tag) {
      case 26:
        Va(e, t, l), e.flags & Rn && e.memoizedState !== null && rh(l, Kt, e.memoizedState, e.memoizedProps);
        break;
      case 5:
        Va(e, t, l);
        break;
      case 3:
      case 4:
        var a = Kt;
        Kt = cs(e.stateNode.containerInfo), Va(e, t, l), Kt = a;
        break;
      case 22:
        e.memoizedState === null && (a = e.alternate, a !== null && a.memoizedState !== null ? (a = Rn, Rn = 16777216, Va(e, t, l), Rn = a) : Va(e, t, l));
        break;
      default:
        Va(e, t, l);
    }
  }
  function Hr(e) {
    var t = e.alternate;
    if (t !== null && (e = t.child, e !== null)) {
      t.child = null;
      do
        t = e.sibling, e.sibling = null, e = t;
      while (e !== null);
    }
  }
  function qn(e) {
    var t = e.deletions;
    if ((e.flags & 16) !== 0) {
      if (t !== null) for (var l = 0; l < t.length; l++) {
        var a = t[l];
        it = a, Lr(a, e);
      }
      Hr(e);
    }
    if (e.subtreeFlags & 10256) for (e = e.child; e !== null; ) Br(e), e = e.sibling;
  }
  function Br(e) {
    switch (e.tag) {
      case 0:
      case 11:
      case 15:
        qn(e), e.flags & 2048 && Dl(9, e, e.return);
        break;
      case 3:
        qn(e);
        break;
      case 12:
        qn(e);
        break;
      case 22:
        var t = e.stateNode;
        e.memoizedState !== null && t._visibility & 2 && (e.return === null || e.return.tag !== 13) ? (t._visibility &= -3, Ji(e)) : qn(e);
        break;
      default:
        qn(e);
    }
  }
  function Ji(e) {
    var t = e.deletions;
    if ((e.flags & 16) !== 0) {
      if (t !== null) for (var l = 0; l < t.length; l++) {
        var a = t[l];
        it = a, Lr(a, e);
      }
      Hr(e);
    }
    for (e = e.child; e !== null; ) {
      switch (t = e, t.tag) {
        case 0:
        case 11:
        case 15:
          Dl(8, t, t.return), Ji(t);
          break;
        case 22:
          l = t.stateNode, l._visibility & 2 && (l._visibility &= -3, Ji(t));
          break;
        default:
          Ji(t);
      }
      e = e.sibling;
    }
  }
  function Lr(e, t) {
    for (; it !== null; ) {
      var l = it;
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
      if (a = l.child, a !== null) a.return = l, it = a;
      else e: for (l = e; it !== null; ) {
        a = it;
        var i = a.sibling, s = a.return;
        if (Cr(a), a === l) {
          it = null;
          break e;
        }
        if (i !== null) {
          i.return = s, it = i;
          break e;
        }
        it = s;
      }
    }
  }
  var A0 = {
    getCacheForType: function(e) {
      var t = ot(Pe), l = t.data.get(e);
      return l === void 0 && (l = e(), t.data.set(e, l)), l;
    },
    cacheSignal: function() {
      return ot(Pe).controller.signal;
    }
  }, w0 = typeof WeakMap == "function" ? WeakMap : Map, Oe = 0, Ye = null, ye = null, ze = 0, Ue = 0, wt = null, kl = !1, Xa = !1, tu = !1, xl = 0, Je = 0, Ul = 0, fa = 0, lu = 0, Ct = 0, Qa = 0, Hn = null, yt = null, au = !1, Ii = 0, Yr = 0, $i = 1 / 0, Wi = null, Rl = null, at = 0, ql = null, Za = null, gl = 0, nu = 0, iu = null, Gr = null, Bn = 0, su = null;
  function Lt() {
    return (Oe & 2) !== 0 && ze !== 0 ? ze & -ze : O.T !== null ? fu() : sd();
  }
  function Vr() {
    if (Ct === 0) if ((ze & 536870912) === 0 || _e) {
      var e = ni;
      ni <<= 1, (ni & 3932160) === 0 && (ni = 262144), Ct = e;
    } else Ct = 536870912;
    return e = Tt.current, e !== null && (e.flags |= 32), Ct;
  }
  function St(e, t, l) {
    (e === Ye && (Ue === 2 || Ue === 9) || e.cancelPendingCommit !== null) && (Ka(e, 0), Hl(e, ze, Ct, !1)), ci(e, l), ((Oe & 2) === 0 || e !== Ye) && (e === Ye && ((Oe & 2) === 0 && (fa |= l), Je === 4 && Hl(e, ze, Ct, !1)), vl(e));
  }
  function Xr(e, t, l) {
    if ((Oe & 6) !== 0) throw Error(o(327));
    var a = !l && (t & 127) === 0 && (t & e.expiredLanes) === 0 || nn(e, t), i = a ? M0(e, t) : uu(e, t, !0), s = a;
    do {
      if (i === 0) {
        Xa && !a && Hl(e, t, 0, !1);
        break;
      } else {
        if (l = e.current.alternate, s && !C0(l)) {
          i = uu(e, t, !1), s = !1;
          continue;
        }
        if (i === 2) {
          if (s = t, e.errorRecoveryDisabledLanes & s) var c = 0;
          else c = e.pendingLanes & -536870913, c = c !== 0 ? c : c & 536870912 ? 536870912 : 0;
          if (c !== 0) {
            t = c;
            e: {
              var d = e;
              i = Hn;
              var p = d.current.memoizedState.isDehydrated;
              if (p && (Ka(d, c).flags |= 256), c = uu(d, c, !1), c !== 2) {
                if (tu && !p) {
                  d.errorRecoveryDisabledLanes |= s, fa |= s, i = 4;
                  break e;
                }
                s = yt, yt = i, s !== null && (yt === null ? yt = s : yt.push.apply(yt, s));
              }
              i = c;
            }
            if (s = !1, i !== 2) continue;
          }
        }
        if (i === 1) {
          Ka(e, 0), Hl(e, t, 0, !0);
          break;
        }
        e: {
          switch (a = e, s = i, s) {
            case 0:
            case 1:
              throw Error(o(345));
            case 4:
              if ((t & 4194048) !== t) break;
            case 6:
              Hl(a, t, Ct, !kl);
              break e;
            case 2:
              yt = null;
              break;
            case 3:
            case 5:
              break;
            default:
              throw Error(o(329));
          }
          if ((t & 62914560) === t && (i = Ii + 300 - ke(), 10 < i)) {
            if (Hl(a, t, Ct, !kl), si(a, 0, !0) !== 0) break e;
            gl = t, a.timeoutHandle = zf(Qr.bind(null, a, l, yt, Wi, au, t, Ct, fa, Qa, kl, s, "Throttled", -0, 0), i);
            break e;
          }
          Qr(a, l, yt, Wi, au, t, Ct, fa, Qa, kl, s, null, -0, 0);
        }
      }
      break;
    } while (!0);
    vl(e);
  }
  function Qr(e, t, l, a, i, s, c, d, p, S, C, R, z, A) {
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
      }, qr(t, s, R);
      var ee = (s & 62914560) === s ? Ii - ke() : (s & 4194048) === s ? Yr - ke() : 0;
      if (ee = fh(R, ee), ee !== null) {
        gl = s, e.cancelPendingCommit = ee(Pr.bind(null, e, t, s, l, a, i, c, d, p, C, R, null, z, A)), Hl(e, s, c, !S);
        return;
      }
    }
    Pr(e, t, s, l, a, i, c, d, p);
  }
  function C0(e) {
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
  function Hl(e, t, l, a) {
    t &= ~lu, t &= ~fa, e.suspendedLanes |= t, e.pingedLanes &= ~t, a && (e.warmLanes |= t), a = e.expirationTimes;
    for (var i = t; 0 < i; ) {
      var s = 31 - Nt(i), c = 1 << s;
      a[s] = -1, i &= ~c;
    }
    l !== 0 && ld(e, l, t);
  }
  function Fi() {
    return (Oe & 6) === 0 ? (Ln(0, !1), !1) : !0;
  }
  function cu() {
    if (ye !== null) {
      if (Ue === 0) var e = ye.return;
      else e = ye, sl = ta = null, zc(e), qa = null, Sn = 0, e = ye;
      for (; e !== null; ) Sr(e.alternate, e), e = e.return;
      ye = null;
    }
  }
  function Ka(e, t) {
    var l = e.timeoutHandle;
    l !== -1 && (e.timeoutHandle = -1, J0(l)), l = e.cancelPendingCommit, l !== null && (e.cancelPendingCommit = null, l()), gl = 0, cu(), Ye = e, ye = l = nl(e.current, null), ze = t, Ue = 0, wt = null, kl = !1, Xa = nn(e, t), tu = !1, Qa = Ct = lu = fa = Ul = Je = 0, yt = Hn = null, au = !1, (t & 8) !== 0 && (t |= t & 32);
    var a = e.entangledLanes;
    if (a !== 0) for (e = e.entanglements, a &= t; 0 < a; ) {
      var i = 31 - Nt(a), s = 1 << i;
      t |= e[i], a &= ~s;
    }
    return xl = t, bi(), l;
  }
  function Zr(e, t) {
    ge = null, O.H = Cn, t === Ra || t === Ti ? (t = ro(), Ue = 3) : t === rc ? (t = ro(), Ue = 4) : Ue = t === Bc ? 8 : t !== null && typeof t == "object" && typeof t.then == "function" ? 6 : 1, wt = t, ye === null && (Je = 1, Yi(e, Ut(t, e.current)));
  }
  function Kr() {
    var e = Tt.current;
    return e === null ? !0 : (ze & 4194048) === ze ? Bt === null : (ze & 62914560) === ze || (ze & 536870912) !== 0 ? e === Bt : !1;
  }
  function Jr() {
    var e = O.H;
    return O.H = Cn, e === null ? Cn : e;
  }
  function Ir() {
    var e = O.A;
    return O.A = A0, e;
  }
  function Pi() {
    Je = 4, kl || (ze & 4194048) !== ze && Tt.current !== null || (Xa = !0), (Ul & 134217727) === 0 && (fa & 134217727) === 0 || Ye === null || Hl(Ye, ze, Ct, !1);
  }
  function uu(e, t, l) {
    var a = Oe;
    Oe |= 2;
    var i = Jr(), s = Ir();
    (Ye !== e || ze !== t) && (Wi = null, Ka(e, t)), t = !1;
    var c = Je;
    e: do
      try {
        if (Ue !== 0 && ye !== null) {
          var d = ye, p = wt;
          switch (Ue) {
            case 8:
              cu(), c = 6;
              break e;
            case 3:
            case 2:
            case 9:
            case 6:
              Tt.current === null && (t = !0);
              var S = Ue;
              if (Ue = 0, wt = null, Ja(e, d, p, S), l && Xa) {
                c = 0;
                break e;
              }
              break;
            default:
              S = Ue, Ue = 0, wt = null, Ja(e, d, p, S);
          }
        }
        O0(), c = Je;
        break;
      } catch (C) {
        Zr(e, C);
      }
    while (!0);
    return t && e.shellSuspendCounter++, sl = ta = null, Oe = a, O.H = i, O.A = s, ye === null && (Ye = null, ze = 0, bi()), c;
  }
  function O0() {
    for (; ye !== null; ) $r(ye);
  }
  function M0(e, t) {
    var l = Oe;
    Oe |= 2;
    var a = Jr(), i = Ir();
    Ye !== e || ze !== t ? (Wi = null, $i = ke() + 500, Ka(e, t)) : Xa = nn(e, t);
    e: do
      try {
        if (Ue !== 0 && ye !== null) {
          t = ye;
          var s = wt;
          t: switch (Ue) {
            case 1:
              Ue = 0, wt = null, Ja(e, t, s, 1);
              break;
            case 2:
            case 9:
              if (uo(s)) {
                Ue = 0, wt = null, Wr(t);
                break;
              }
              t = function() {
                Ue !== 2 && Ue !== 9 || Ye !== e || (Ue = 7), vl(e);
              }, s.then(t, t);
              break e;
            case 3:
              Ue = 7;
              break e;
            case 4:
              Ue = 5;
              break e;
            case 7:
              uo(s) ? (Ue = 0, wt = null, Wr(t)) : (Ue = 0, wt = null, Ja(e, t, s, 7));
              break;
            case 5:
              var c = null;
              switch (ye.tag) {
                case 26:
                  c = ye.memoizedState;
                case 5:
                case 27:
                  var d = ye;
                  if (c ? Hf(c) : d.stateNode.complete) {
                    Ue = 0, wt = null;
                    var p = d.sibling;
                    if (p !== null) ye = p;
                    else {
                      var S = d.return;
                      S !== null ? (ye = S, es(S)) : ye = null;
                    }
                    break t;
                  }
              }
              Ue = 0, wt = null, Ja(e, t, s, 5);
              break;
            case 6:
              Ue = 0, wt = null, Ja(e, t, s, 6);
              break;
            case 8:
              cu(), Je = 6;
              break e;
            default:
              throw Error(o(462));
          }
        }
        D0();
        break;
      } catch (C) {
        Zr(e, C);
      }
    while (!0);
    return sl = ta = null, O.H = a, O.A = i, Oe = l, ye !== null ? 0 : (Ye = null, ze = 0, bi(), Je);
  }
  function D0() {
    for (; ye !== null && !Fe(); ) $r(ye);
  }
  function $r(e) {
    var t = jr(e.alternate, e, xl);
    e.memoizedProps = e.pendingProps, t === null ? es(e) : ye = t;
  }
  function Wr(e) {
    var t = e, l = t.alternate;
    switch (t.tag) {
      case 15:
      case 0:
        t = hr(l, t, t.pendingProps, t.type, void 0, ze);
        break;
      case 11:
        t = hr(l, t, t.pendingProps, t.type.render, t.ref, ze);
        break;
      case 5:
        zc(t);
      default:
        Sr(l, t), t = ye = Wd(t, xl), t = jr(l, t, xl);
    }
    e.memoizedProps = e.pendingProps, t === null ? es(e) : ye = t;
  }
  function Ja(e, t, l, a) {
    sl = ta = null, zc(t), qa = null, Sn = 0;
    var i = t.return;
    try {
      if (y0(e, i, t, l, ze)) {
        Je = 1, Yi(e, Ut(l, e.current)), ye = null;
        return;
      }
    } catch (s) {
      if (i !== null) throw ye = i, s;
      Je = 1, Yi(e, Ut(l, e.current)), ye = null;
      return;
    }
    t.flags & 32768 ? (_e || a === 1 ? e = !0 : Xa || (ze & 536870912) !== 0 ? e = !1 : (kl = e = !0, (a === 2 || a === 9 || a === 3 || a === 6) && (a = Tt.current, a !== null && a.tag === 13 && (a.flags |= 16384))), Fr(t, e)) : es(t);
  }
  function es(e) {
    var t = e;
    do {
      if ((t.flags & 32768) !== 0) {
        Fr(t, kl);
        return;
      }
      e = t.return;
      var l = N0(t.alternate, t, xl);
      if (l !== null) {
        ye = l;
        return;
      }
      if (t = t.sibling, t !== null) {
        ye = t;
        return;
      }
      ye = t = e;
    } while (t !== null);
    Je === 0 && (Je = 5);
  }
  function Fr(e, t) {
    do {
      var l = _0(e.alternate, e);
      if (l !== null) {
        l.flags &= 32767, ye = l;
        return;
      }
      if (l = e.return, l !== null && (l.flags |= 32768, l.subtreeFlags = 0, l.deletions = null), !t && (e = e.sibling, e !== null)) {
        ye = e;
        return;
      }
      ye = e = l;
    } while (e !== null);
    Je = 6, ye = null;
  }
  function Pr(e, t, l, a, i, s, c, d, p) {
    e.cancelPendingCommit = null;
    do
      ts();
    while (at !== 0);
    if ((Oe & 6) !== 0) throw Error(o(327));
    if (t !== null) {
      if (t === e.current) throw Error(o(177));
      if (s = t.lanes | t.childLanes, s |= $s, jp(e, l, s, c, d, p), e === Ye && (ye = Ye = null, ze = 0), Za = t, ql = e, gl = l, nu = s, iu = i, Gr = a, (t.subtreeFlags & 10256) !== 0 || (t.flags & 10256) !== 0 ? (e.callbackNode = null, e.callbackPriority = 0, q0(ce, function() {
        return nf(), null;
      })) : (e.callbackNode = null, e.callbackPriority = 0), a = (t.flags & 13878) !== 0, (t.subtreeFlags & 13878) !== 0 || a) {
        a = O.T, O.T = null, i = V.p, V.p = 2, c = Oe, Oe |= 4;
        try {
          E0(e, t, l);
        } finally {
          Oe = c, V.p = i, O.T = a;
        }
      }
      at = 1, ef(), tf(), lf();
    }
  }
  function ef() {
    if (at === 1) {
      at = 0;
      var e = ql, t = Za, l = (t.flags & 13878) !== 0;
      if ((t.subtreeFlags & 13878) !== 0 || l) {
        l = O.T, O.T = null;
        var a = V.p;
        V.p = 2;
        var i = Oe;
        Oe |= 4;
        try {
          kr(t, e);
          var s = bu, c = Gd(e.containerInfo), d = s.focusedElem, p = s.selectionRange;
          if (c !== d && d && d.ownerDocument && Yd(d.ownerDocument.documentElement, d)) {
            if (p !== null && Qs(d)) {
              var S = p.start, C = p.end;
              if (C === void 0 && (C = S), "selectionStart" in d) d.selectionStart = S, d.selectionEnd = Math.min(C, d.value.length);
              else {
                var R = d.ownerDocument || document, z = R && R.defaultView || window;
                if (z.getSelection) {
                  var A = z.getSelection(), ee = d.textContent.length, oe = Math.min(p.start, ee), Be = p.end === void 0 ? oe : Math.min(p.end, ee);
                  !A.extend && oe > Be && (c = Be, Be = oe, oe = c);
                  var j = Ld(d, oe), g = Ld(d, Be);
                  if (j && g && (A.rangeCount !== 1 || A.anchorNode !== j.node || A.anchorOffset !== j.offset || A.focusNode !== g.node || A.focusOffset !== g.offset)) {
                    var y = R.createRange();
                    y.setStart(j.node, j.offset), A.removeAllRanges(), oe > Be ? (A.addRange(y), A.extend(g.node, g.offset)) : (y.setEnd(g.node, g.offset), A.addRange(y));
                  }
                }
              }
            }
            for (R = [], A = d; A = A.parentNode; ) A.nodeType === 1 && R.push({
              element: A,
              left: A.scrollLeft,
              top: A.scrollTop
            });
            for (typeof d.focus == "function" && d.focus(), d = 0; d < R.length; d++) {
              var D = R[d];
              D.element.scrollLeft = D.left, D.element.scrollTop = D.top;
            }
          }
          ps = !!vu, bu = vu = null;
        } finally {
          Oe = i, V.p = a, O.T = l;
        }
      }
      e.current = t, at = 2;
    }
  }
  function tf() {
    if (at === 2) {
      at = 0;
      var e = ql, t = Za, l = (t.flags & 8772) !== 0;
      if ((t.subtreeFlags & 8772) !== 0 || l) {
        l = O.T, O.T = null;
        var a = V.p;
        V.p = 2;
        var i = Oe;
        Oe |= 4;
        try {
          wr(e, t.alternate, t);
        } finally {
          Oe = i, V.p = a, O.T = l;
        }
      }
      at = 3;
    }
  }
  function lf() {
    if (at === 4 || at === 3) {
      at = 0, Ot();
      var e = ql, t = Za, l = gl, a = Gr;
      (t.subtreeFlags & 10256) !== 0 || (t.flags & 10256) !== 0 ? at = 5 : (at = 0, Za = ql = null, af(e, e.pendingLanes));
      var i = e.pendingLanes;
      if (i === 0 && (Rl = null), Es(l), t = t.stateNode, ht && typeof ht.onCommitFiberRoot == "function") try {
        ht.onCommitFiberRoot(Sl, t, void 0, (t.current.flags & 128) === 128);
      } catch {
      }
      if (a !== null) {
        t = O.T, i = V.p, V.p = 2, O.T = null;
        try {
          for (var s = e.onRecoverableError, c = 0; c < a.length; c++) {
            var d = a[c];
            s(d.value, { componentStack: d.stack });
          }
        } finally {
          O.T = t, V.p = i;
        }
      }
      (gl & 3) !== 0 && ts(), vl(e), i = e.pendingLanes, (l & 261930) !== 0 && (i & 42) !== 0 ? e === su ? Bn++ : (Bn = 0, su = e) : Bn = 0, Ln(0, !1);
    }
  }
  function af(e, t) {
    (e.pooledCacheLanes &= t) === 0 && (t = e.pooledCache, t != null && (e.pooledCache = null, jn(t)));
  }
  function ts() {
    return ef(), tf(), lf(), nf();
  }
  function nf() {
    if (at !== 5) return !1;
    var e = ql, t = nu;
    nu = 0;
    var l = Es(gl), a = O.T, i = V.p;
    try {
      V.p = 32 > l ? 32 : l, O.T = null, l = iu, iu = null;
      var s = ql, c = gl;
      if (at = 0, Za = ql = null, gl = 0, (Oe & 6) !== 0) throw Error(o(331));
      var d = Oe;
      if (Oe |= 4, Br(s.current), Rr(s, s.current, c, l), Oe = d, Ln(0, !1), ht && typeof ht.onPostCommitFiberRoot == "function") try {
        ht.onPostCommitFiberRoot(Sl, s);
      } catch {
      }
      return !0;
    } finally {
      V.p = i, O.T = a, af(e, t);
    }
  }
  function sf(e, t, l) {
    t = Ut(l, t), t = Hc(e.stateNode, t, 2), e = ua(e, t, 2), e !== null && (ci(e, 2), vl(e));
  }
  function Re(e, t, l) {
    if (e.tag === 3) sf(e, e, l);
    else for (; t !== null; ) {
      if (t.tag === 3) {
        sf(t, e, l);
        break;
      } else if (t.tag === 1) {
        var a = t.stateNode;
        if (typeof t.type.getDerivedStateFromError == "function" || typeof a.componentDidCatch == "function" && (Rl === null || !Rl.has(a))) {
          e = Ut(l, e), l = sr(2), a = ua(t, l, 2), a !== null && (cr(l, a, t, e), ci(a, 2), vl(a));
          break;
        }
      }
      t = t.return;
    }
  }
  function du(e, t, l) {
    var a = e.pingCache;
    if (a === null) {
      a = e.pingCache = new w0();
      var i = /* @__PURE__ */ new Set();
      a.set(t, i);
    } else i = a.get(t), i === void 0 && (i = /* @__PURE__ */ new Set(), a.set(t, i));
    i.has(l) || (tu = !0, i.add(l), e = k0.bind(null, e, t, l), t.then(e, e));
  }
  function k0(e, t, l) {
    var a = e.pingCache;
    a !== null && a.delete(t), e.pingedLanes |= e.suspendedLanes & l, e.warmLanes &= ~l, Ye === e && (ze & l) === l && (Je === 4 || Je === 3 && (ze & 62914560) === ze && 300 > ke() - Ii ? (Oe & 2) === 0 && Ka(e, 0) : lu |= l, Qa === ze && (Qa = 0)), vl(e);
  }
  function cf(e, t) {
    t === 0 && (t = td()), e = Fl(e, t), e !== null && (ci(e, t), vl(e));
  }
  function U0(e) {
    var t = e.memoizedState, l = 0;
    t !== null && (l = t.retryLane), cf(e, l);
  }
  function R0(e, t) {
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
        throw Error(o(314));
    }
    a !== null && a.delete(t), cf(e, l);
  }
  function q0(e, t) {
    return N(e, t);
  }
  var ls = null, Ia = null, ou = !1, as = !1, ru = !1, Bl = 0;
  function vl(e) {
    e !== Ia && e.next === null && (Ia === null ? ls = Ia = e : Ia = Ia.next = e), as = !0, ou || (ou = !0, B0());
  }
  function Ln(e, t) {
    if (!ru && as) {
      ru = !0;
      do
        for (var l = !1, a = ls; a !== null; ) {
          if (!t) if (e !== 0) {
            var i = a.pendingLanes;
            if (i === 0) var s = 0;
            else {
              var c = a.suspendedLanes, d = a.pingedLanes;
              s = (1 << 31 - Nt(42 | e) + 1) - 1, s &= i & ~(c & ~d), s = s & 201326741 ? s & 201326741 | 1 : s ? s | 2 : 0;
            }
            s !== 0 && (l = !0, rf(a, s));
          } else s = ze, s = si(a, a === Ye ? s : 0, a.cancelPendingCommit !== null || a.timeoutHandle !== -1), (s & 3) === 0 || nn(a, s) || (l = !0, rf(a, s));
          a = a.next;
        }
      while (l);
      ru = !1;
    }
  }
  function H0() {
    uf();
  }
  function uf() {
    as = ou = !1;
    var e = 0;
    Bl !== 0 && K0() && (e = Bl);
    for (var t = ke(), l = null, a = ls; a !== null; ) {
      var i = a.next, s = df(a, t);
      s === 0 ? (a.next = null, l === null ? ls = i : l.next = i, i === null && (Ia = l)) : (l = a, (e !== 0 || (s & 3) !== 0) && (as = !0)), a = i;
    }
    at !== 0 && at !== 5 || Ln(e, !1), Bl !== 0 && (Bl = 0);
  }
  function df(e, t) {
    for (var l = e.suspendedLanes, a = e.pingedLanes, i = e.expirationTimes, s = e.pendingLanes & -62914561; 0 < s; ) {
      var c = 31 - Nt(s), d = 1 << c, p = i[c];
      p === -1 ? ((d & l) === 0 || (d & a) !== 0) && (i[c] = bp(d, t)) : p <= t && (e.expiredLanes |= d), s &= ~d;
    }
    if (t = Ye, l = ze, l = si(e, e === t ? l : 0, e.cancelPendingCommit !== null || e.timeoutHandle !== -1), a = e.callbackNode, l === 0 || e === t && (Ue === 2 || Ue === 9) || e.cancelPendingCommit !== null) return a !== null && a !== null && Le(a), e.callbackNode = null, e.callbackPriority = 0;
    if ((l & 3) === 0 || nn(e, l)) {
      if (t = l & -l, t === e.callbackPriority) return t;
      switch (a !== null && Le(a), Es(l)) {
        case 2:
        case 8:
          l = f;
          break;
        case 32:
          l = ce;
          break;
        case 268435456:
          l = ct;
          break;
        default:
          l = ce;
      }
      return a = of.bind(null, e), l = N(l, a), e.callbackPriority = t, e.callbackNode = l, t;
    }
    return a !== null && a !== null && Le(a), e.callbackPriority = 2, e.callbackNode = null, 2;
  }
  function of(e, t) {
    if (at !== 0 && at !== 5) return e.callbackNode = null, e.callbackPriority = 0, null;
    var l = e.callbackNode;
    if (ts() && e.callbackNode !== l) return null;
    var a = ze;
    return a = si(e, e === Ye ? a : 0, e.cancelPendingCommit !== null || e.timeoutHandle !== -1), a === 0 ? null : (Xr(e, a, t), df(e, ke()), e.callbackNode != null && e.callbackNode === l ? of.bind(null, e) : null);
  }
  function rf(e, t) {
    if (ts()) return null;
    Xr(e, t, !0);
  }
  function B0() {
    I0(function() {
      (Oe & 6) !== 0 ? N(an, H0) : uf();
    });
  }
  function fu() {
    if (Bl === 0) {
      var e = ka;
      e === 0 && (e = ai, ai <<= 1, (ai & 261888) === 0 && (ai = 256)), Bl = e;
    }
    return Bl;
  }
  function ff(e) {
    return e == null || typeof e == "symbol" || typeof e == "boolean" ? null : typeof e == "function" ? e : ri("" + e);
  }
  function pf(e, t) {
    var l = t.ownerDocument.createElement("input");
    return l.name = t.name, l.value = t.value, e.id && l.setAttribute("form", e.id), t.parentNode.insertBefore(l, t), e = new FormData(e), l.parentNode.removeChild(l), e;
  }
  function L0(e, t, l, a, i) {
    if (t === "submit" && l && l.stateNode === i) {
      var s = ff((i[xt] || null).action), c = a.submitter;
      c && (t = (t = c[xt] || null) ? ff(t.formAction) : c.getAttribute("formAction"), t !== null && (s = t, c = null));
      var d = new mi("action", "action", null, a, i);
      e.push({
        event: d,
        listeners: [{
          instance: null,
          listener: function() {
            if (a.defaultPrevented) {
              if (Bl !== 0) {
                var p = c ? pf(i, c) : new FormData(i);
                Mc(l, {
                  pending: !0,
                  data: p,
                  method: i.method,
                  action: s
                }, null, p);
              }
            } else typeof s == "function" && (d.preventDefault(), p = c ? pf(i, c) : new FormData(i), Mc(l, {
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
  for (var pu = 0; pu < Is.length; pu++) {
    var hu = Is[pu];
    Zt(hu.toLowerCase(), "on" + (hu[0].toUpperCase() + hu.slice(1)));
  }
  Zt(Qd, "onAnimationEnd"), Zt(Zd, "onAnimationIteration"), Zt(Kd, "onAnimationStart"), Zt("dblclick", "onDoubleClick"), Zt("focusin", "onFocus"), Zt("focusout", "onBlur"), Zt(t0, "onTransitionRun"), Zt(l0, "onTransitionStart"), Zt(a0, "onTransitionCancel"), Zt(Jd, "onTransitionEnd"), ja("onMouseEnter", ["mouseout", "mouseover"]), ja("onMouseLeave", ["mouseout", "mouseover"]), ja("onPointerEnter", ["pointerout", "pointerover"]), ja("onPointerLeave", ["pointerout", "pointerover"]), Jl("onChange", "change click focusin focusout input keydown keyup selectionchange".split(" ")), Jl("onSelect", "focusout contextmenu dragend focusin keydown keyup mousedown mouseup selectionchange".split(" ")), Jl("onBeforeInput", [
    "compositionend",
    "keypress",
    "textInput",
    "paste"
  ]), Jl("onCompositionEnd", "compositionend focusout keydown keypress keyup mousedown".split(" ")), Jl("onCompositionStart", "compositionstart focusout keydown keypress keyup mousedown".split(" ")), Jl("onCompositionUpdate", "compositionupdate focusout keydown keypress keyup mousedown".split(" "));
  var Yn = "abort canplay canplaythrough durationchange emptied encrypted ended error loadeddata loadedmetadata loadstart pause play playing progress ratechange resize seeked seeking stalled suspend timeupdate volumechange waiting".split(" "), Y0 = new Set("beforetoggle cancel close invalid load scroll scrollend toggle".split(" ").concat(Yn));
  function hf(e, t) {
    t = (t & 4) !== 0;
    for (var l = 0; l < e.length; l++) {
      var a = e[l], i = a.event;
      a = a.listeners;
      e: {
        var s = void 0;
        if (t) for (var c = a.length - 1; 0 <= c; c--) {
          var d = a[c], p = d.instance, S = d.currentTarget;
          if (d = d.listener, p !== s && i.isPropagationStopped()) break e;
          s = d, i.currentTarget = S;
          try {
            s(i);
          } catch (C) {
            vi(C);
          }
          i.currentTarget = null, s = p;
        }
        else for (c = 0; c < a.length; c++) {
          if (d = a[c], p = d.instance, S = d.currentTarget, d = d.listener, p !== s && i.isPropagationStopped()) break e;
          s = d, i.currentTarget = S;
          try {
            s(i);
          } catch (C) {
            vi(C);
          }
          i.currentTarget = null, s = p;
        }
      }
    }
  }
  function Se(e, t) {
    var l = t[Ts];
    l === void 0 && (l = t[Ts] = /* @__PURE__ */ new Set());
    var a = e + "__bubble";
    l.has(a) || (xf(t, e, 2, !1), l.add(a));
  }
  function mu(e, t, l) {
    var a = 0;
    t && (a |= 4), xf(l, e, a, t);
  }
  var ns = "_reactListening" + Math.random().toString(36).slice(2);
  function mf(e) {
    if (!e[ns]) {
      e[ns] = !0, dd.forEach(function(l) {
        l !== "selectionchange" && (Y0.has(l) || mu(l, !1, e), mu(l, !0, e));
      });
      var t = e.nodeType === 9 ? e : e.ownerDocument;
      t === null || t[ns] || (t[ns] = !0, mu("selectionchange", !1, t));
    }
  }
  function xf(e, t, l, a) {
    switch (Vf(t)) {
      case 2:
        var i = gh;
        break;
      case 8:
        i = vh;
        break;
      default:
        i = Cu;
    }
    l = i.bind(null, t, l, e), i = void 0, !Rs || t !== "touchstart" && t !== "touchmove" && t !== "wheel" || (i = !0), a ? i !== void 0 ? e.addEventListener(t, l, {
      capture: !0,
      passive: i
    }) : e.addEventListener(t, l, !0) : i !== void 0 ? e.addEventListener(t, l, { passive: i }) : e.addEventListener(t, l, !1);
  }
  function xu(e, t, l, a, i) {
    var s = a;
    if ((t & 1) === 0 && (t & 2) === 0 && a !== null) e: for (; ; ) {
      if (a === null) return;
      var c = a.tag;
      if (c === 3 || c === 4) {
        var d = a.stateNode.containerInfo;
        if (d === i) break;
        if (c === 4) for (c = a.return; c !== null; ) {
          var p = c.tag;
          if ((p === 3 || p === 4) && c.stateNode.containerInfo === i) return;
          c = c.return;
        }
        for (; d !== null; ) {
          if (c = ga(d), c === null) return;
          if (p = c.tag, p === 5 || p === 6 || p === 26 || p === 27) {
            a = s = c;
            continue e;
          }
          d = d.parentNode;
        }
      }
      a = a.return;
    }
    yd(function() {
      var S = s, C = ks(l), R = [];
      e: {
        var z = Id.get(e);
        if (z !== void 0) {
          var A = mi, ee = e;
          switch (e) {
            case "keypress":
              if (pi(l) === 0) break e;
            case "keydown":
            case "keyup":
              A = Hp;
              break;
            case "focusin":
              ee = "focus", A = Ls;
              break;
            case "focusout":
              ee = "blur", A = Ls;
              break;
            case "beforeblur":
            case "afterblur":
              A = Ls;
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
              A = Nd;
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
              A = Bp;
              break;
            case Qd:
            case Zd:
            case Kd:
              A = Mp;
              break;
            case Jd:
              A = Lp;
              break;
            case "scroll":
            case "scrollend":
              A = Cp;
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
              A = Ed;
              break;
            case "toggle":
            case "beforetoggle":
              A = Gp;
          }
          var oe = (t & 4) !== 0, Be = !oe && (e === "scroll" || e === "scrollend"), j = oe ? z !== null ? z + "Capture" : null : z;
          oe = [];
          for (var g = S, y; g !== null; ) {
            var D = g;
            if (y = D.stateNode, D = D.tag, D !== 5 && D !== 26 && D !== 27 || y === null || j === null || (D = dn(g, j), D != null && oe.push(Gn(g, D, y))), Be) break;
            g = g.return;
          }
          0 < oe.length && (z = new A(z, ee, null, l, C), R.push({
            event: z,
            listeners: oe
          }));
        }
      }
      if ((t & 7) === 0) {
        e: {
          if (z = e === "mouseover" || e === "pointerover", A = e === "mouseout" || e === "pointerout", z && l !== Ds && (ee = l.relatedTarget || l.fromElement) && (ga(ee) || ee[sn])) break e;
          if ((A || z) && (z = C.window === C ? C : (z = C.ownerDocument) ? z.defaultView || z.parentWindow : window, A ? (ee = l.relatedTarget || l.toElement, A = S, ee = ee ? ga(ee) : null, ee !== null && (Be = G(ee), oe = ee.tag, ee !== Be || oe !== 5 && oe !== 27 && oe !== 6) && (ee = null)) : (A = null, ee = S), A !== ee)) {
            if (oe = Nd, D = "onMouseLeave", j = "onMouseEnter", g = "mouse", (e === "pointerout" || e === "pointerover") && (oe = Ed, D = "onPointerLeave", j = "onPointerEnter", g = "pointer"), Be = A == null ? z : un(A), y = ee == null ? z : un(ee), z = new oe(D, g + "leave", A, l, C), z.target = Be, z.relatedTarget = y, D = null, ga(C) === S && (oe = new oe(j, g + "enter", ee, l, C), oe.target = y, oe.relatedTarget = Be, D = oe), Be = D, A && ee) t: {
              for (oe = G0, j = A, g = ee, y = 0, D = j; D; D = oe(D)) y++;
              D = 0;
              for (var se = g; se; se = oe(se)) D++;
              for (; 0 < y - D; ) j = oe(j), y--;
              for (; 0 < D - y; ) g = oe(g), D--;
              for (; y--; ) {
                if (j === g || g !== null && j === g.alternate) {
                  oe = j;
                  break t;
                }
                j = oe(j), g = oe(g);
              }
              oe = null;
            }
            else oe = null;
            A !== null && gf(R, z, A, oe, !1), ee !== null && Be !== null && gf(R, Be, ee, oe, !0);
          }
        }
        e: {
          if (z = S ? un(S) : window, A = z.nodeName && z.nodeName.toLowerCase(), A === "select" || A === "input" && z.type === "file") var we = kd;
          else if (Md(z)) if (Ud) we = Fp;
          else {
            we = $p;
            var ae = Ip;
          }
          else A = z.nodeName, !A || A.toLowerCase() !== "input" || z.type !== "checkbox" && z.type !== "radio" ? S && Ms(S.elementType) && (we = kd) : we = Wp;
          if (we && (we = we(e, S))) {
            Dd(R, we, l, C);
            break e;
          }
          ae && ae(e, z, S), e === "focusout" && S && z.type === "number" && S.memoizedProps.value != null && Os(z, "number", z.value);
        }
        switch (ae = S ? un(S) : window, e) {
          case "focusin":
            (Md(ae) || ae.contentEditable === "true") && (Ea = ae, Zs = S, gn = null);
            break;
          case "focusout":
            gn = Zs = Ea = null;
            break;
          case "mousedown":
            Ks = !0;
            break;
          case "contextmenu":
          case "mouseup":
          case "dragend":
            Ks = !1, Vd(R, l, C);
            break;
          case "selectionchange":
            if (e0) break;
          case "keydown":
          case "keyup":
            Vd(R, l, C);
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
        else _a ? Cd(e, l) && (Ne = "onCompositionEnd") : e === "keydown" && l.keyCode === 229 && (Ne = "onCompositionStart");
        Ne && (Td && l.locale !== "ko" && (_a || Ne !== "onCompositionStart" ? Ne === "onCompositionEnd" && _a && (ve = Sd()) : (_l = C, qs = "value" in _l ? _l.value : _l.textContent, _a = !0)), ae = is(S, Ne), 0 < ae.length && (Ne = new _d(Ne, e, null, l, C), R.push({
          event: Ne,
          listeners: ae
        }), ve ? Ne.data = ve : (ve = Od(l), ve !== null && (Ne.data = ve)))), (ve = Xp ? Qp(e, l) : Zp(e, l)) && (Ne = is(S, "onBeforeInput"), 0 < Ne.length && (ae = new _d("onBeforeInput", "beforeinput", null, l, C), R.push({
          event: ae,
          listeners: Ne
        }), ae.data = ve)), L0(R, e, S, l, C);
      }
      hf(R, t);
    });
  }
  function Gn(e, t, l) {
    return {
      instance: e,
      listener: t,
      currentTarget: l
    };
  }
  function is(e, t) {
    for (var l = t + "Capture", a = []; e !== null; ) {
      var i = e, s = i.stateNode;
      if (i = i.tag, i !== 5 && i !== 26 && i !== 27 || s === null || (i = dn(e, l), i != null && a.unshift(Gn(e, i, s)), i = dn(e, t), i != null && a.push(Gn(e, i, s))), e.tag === 3) return a;
      e = e.return;
    }
    return [];
  }
  function G0(e) {
    if (e === null) return null;
    do
      e = e.return;
    while (e && e.tag !== 5 && e.tag !== 27);
    return e || null;
  }
  function gf(e, t, l, a, i) {
    for (var s = t._reactName, c = []; l !== null && l !== a; ) {
      var d = l, p = d.alternate, S = d.stateNode;
      if (d = d.tag, p !== null && p === a) break;
      d !== 5 && d !== 26 && d !== 27 || S === null || (p = S, i ? (S = dn(l, s), S != null && c.unshift(Gn(l, S, p))) : i || (S = dn(l, s), S != null && c.push(Gn(l, S, p)))), l = l.return;
    }
    c.length !== 0 && e.push({
      event: t,
      listeners: c
    });
  }
  var V0 = /\r\n?/g, X0 = /\u0000|\uFFFD/g;
  function vf(e) {
    return (typeof e == "string" ? e : "" + e).replace(V0, `
`).replace(X0, "");
  }
  function bf(e, t) {
    return t = vf(t), vf(e) === t;
  }
  function He(e, t, l, a, i, s) {
    switch (l) {
      case "children":
        typeof a == "string" ? t === "body" || t === "textarea" && a === "" || Sa(e, a) : (typeof a == "number" || typeof a == "bigint") && t !== "body" && Sa(e, "" + a);
        break;
      case "className":
        di(e, "class", a);
        break;
      case "tabIndex":
        di(e, "tabindex", a);
        break;
      case "dir":
      case "role":
      case "viewBox":
      case "width":
      case "height":
        di(e, l, a);
        break;
      case "style":
        bd(e, a, s);
        break;
      case "data":
        if (t !== "object") {
          di(e, "data", a);
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
        a = ri("" + a), e.setAttribute(l, a);
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
        a = ri("" + a), e.setAttribute(l, a);
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
          if (typeof a != "object" || !("__html" in a)) throw Error(o(61));
          if (l = a.__html, l != null) {
            if (i.children != null) throw Error(o(60));
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
        l = ri("" + a), e.setAttributeNS("http://www.w3.org/1999/xlink", "xlink:href", l);
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
        Se("beforetoggle", e), Se("toggle", e), ui(e, "popover", a);
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
        ui(e, "is", a);
        break;
      case "innerText":
      case "textContent":
        break;
      default:
        (!(2 < l.length) || l[0] !== "o" && l[0] !== "O" || l[1] !== "n" && l[1] !== "N") && (l = Ap.get(l) || l, ui(e, l, a));
    }
  }
  function gu(e, t, l, a, i, s) {
    switch (l) {
      case "style":
        bd(e, a, s);
        break;
      case "dangerouslySetInnerHTML":
        if (a != null) {
          if (typeof a != "object" || !("__html" in a)) throw Error(o(61));
          if (l = a.__html, l != null) {
            if (i.children != null) throw Error(o(60));
            e.innerHTML = l;
          }
        }
        break;
      case "children":
        typeof a == "string" ? Sa(e, a) : (typeof a == "number" || typeof a == "bigint") && Sa(e, "" + a);
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
        if (!od.hasOwnProperty(l)) e: {
          if (l[0] === "o" && l[1] === "n" && (i = l.endsWith("Capture"), t = l.slice(2, i ? l.length - 7 : void 0), s = e[xt] || null, s = s != null ? s[l] : null, typeof s == "function" && e.removeEventListener(t, s, i), typeof a == "function")) {
            typeof s != "function" && s !== null && (l in e ? e[l] = null : e.hasAttribute(l) && e.removeAttribute(l)), e.addEventListener(t, a, i);
            break e;
          }
          l in e ? e[l] = a : a === !0 ? e.setAttribute(l, "") : ui(e, l, a);
        }
    }
  }
  function ft(e, t, l) {
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
              throw Error(o(137, t));
            default:
              He(e, t, s, c, l, null);
          }
        }
        i && He(e, t, "srcSet", l.srcSet, l, null), a && He(e, t, "src", l.src, l, null);
        return;
      case "input":
        Se("invalid", e);
        var d = s = c = i = null, p = null, S = null;
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
              S = C;
              break;
            case "value":
              s = C;
              break;
            case "defaultValue":
              d = C;
              break;
            case "children":
            case "dangerouslySetInnerHTML":
              if (C != null) throw Error(o(137, t));
              break;
            default:
              He(e, t, a, C, l, null);
          }
        }
        md(e, s, d, p, S, c, i, !1);
        return;
      case "select":
        Se("invalid", e), a = c = s = null;
        for (i in l) if (l.hasOwnProperty(i) && (d = l[i], d != null)) switch (i) {
          case "value":
            s = d;
            break;
          case "defaultValue":
            c = d;
            break;
          case "multiple":
            a = d;
          default:
            He(e, t, i, d, l, null);
        }
        t = s, l = c, e.multiple = !!a, t != null ? ya(e, !!a, t, !1) : l != null && ya(e, !!a, l, !0);
        return;
      case "textarea":
        Se("invalid", e), s = i = a = null;
        for (c in l) if (l.hasOwnProperty(c) && (d = l[c], d != null)) switch (c) {
          case "value":
            a = d;
            break;
          case "defaultValue":
            i = d;
            break;
          case "children":
            s = d;
            break;
          case "dangerouslySetInnerHTML":
            if (d != null) throw Error(o(91));
            break;
          default:
            He(e, t, c, d, l, null);
        }
        gd(e, a, i, s);
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
        for (S in l) if (l.hasOwnProperty(S) && (a = l[S], a != null)) switch (S) {
          case "children":
          case "dangerouslySetInnerHTML":
            throw Error(o(137, t));
          default:
            He(e, t, S, a, l, null);
        }
        return;
      default:
        if (Ms(t)) {
          for (C in l) l.hasOwnProperty(C) && (a = l[C], a !== void 0 && gu(e, t, C, a, l, void 0));
          return;
        }
    }
    for (d in l) l.hasOwnProperty(d) && (a = l[d], a != null && He(e, t, d, a, l, null));
  }
  function Q0(e, t, l, a) {
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
        var i = null, s = null, c = null, d = null, p = null, S = null, C = null;
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
        for (var z in a) {
          var A = a[z];
          if (R = l[z], a.hasOwnProperty(z) && (A != null || R != null)) switch (z) {
            case "type":
              s = A;
              break;
            case "name":
              i = A;
              break;
            case "checked":
              S = A;
              break;
            case "defaultChecked":
              C = A;
              break;
            case "value":
              c = A;
              break;
            case "defaultValue":
              d = A;
              break;
            case "children":
            case "dangerouslySetInnerHTML":
              if (A != null) throw Error(o(137, t));
              break;
            default:
              A !== R && He(e, t, z, A, a, R);
          }
        }
        Cs(e, c, d, p, S, C, s, i);
        return;
      case "select":
        A = c = d = z = null;
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
            z = s;
            break;
          case "defaultValue":
            d = s;
            break;
          case "multiple":
            c = s;
          default:
            s !== p && He(e, t, i, s, a, p);
        }
        t = d, l = c, a = A, z != null ? ya(e, !!l, z, !1) : !!a != !!l && (t != null ? ya(e, !!l, t, !0) : ya(e, !!l, l ? [] : "", !1));
        return;
      case "textarea":
        A = z = null;
        for (d in l) if (i = l[d], l.hasOwnProperty(d) && i != null && !a.hasOwnProperty(d)) switch (d) {
          case "value":
            break;
          case "children":
            break;
          default:
            He(e, t, d, null, a, i);
        }
        for (c in a) if (i = a[c], s = l[c], a.hasOwnProperty(c) && (i != null || s != null)) switch (c) {
          case "value":
            z = i;
            break;
          case "defaultValue":
            A = i;
            break;
          case "children":
            break;
          case "dangerouslySetInnerHTML":
            if (i != null) throw Error(o(91));
            break;
          default:
            i !== s && He(e, t, c, i, a, s);
        }
        xd(e, z, A);
        return;
      case "option":
        for (var ee in l) z = l[ee], l.hasOwnProperty(ee) && z != null && !a.hasOwnProperty(ee) && (ee === "selected" ? e.selected = !1 : He(e, t, ee, null, a, z));
        for (p in a) z = a[p], A = l[p], a.hasOwnProperty(p) && z !== A && (z != null || A != null) && (p === "selected" ? e.selected = z && typeof z != "function" && typeof z != "symbol" : He(e, t, p, z, a, A));
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
        for (var oe in l) z = l[oe], l.hasOwnProperty(oe) && z != null && !a.hasOwnProperty(oe) && He(e, t, oe, null, a, z);
        for (S in a) if (z = a[S], A = l[S], a.hasOwnProperty(S) && z !== A && (z != null || A != null)) switch (S) {
          case "children":
          case "dangerouslySetInnerHTML":
            if (z != null) throw Error(o(137, t));
            break;
          default:
            He(e, t, S, z, a, A);
        }
        return;
      default:
        if (Ms(t)) {
          for (var Be in l) z = l[Be], l.hasOwnProperty(Be) && z !== void 0 && !a.hasOwnProperty(Be) && gu(e, t, Be, void 0, a, z);
          for (C in a) z = a[C], A = l[C], !a.hasOwnProperty(C) || z === A || z === void 0 && A === void 0 || gu(e, t, C, z, a, A);
          return;
        }
    }
    for (var j in l) z = l[j], l.hasOwnProperty(j) && z != null && !a.hasOwnProperty(j) && He(e, t, j, null, a, z);
    for (R in a) z = a[R], A = l[R], !a.hasOwnProperty(R) || z === A || z == null && A == null || He(e, t, R, z, a, A);
  }
  function jf(e) {
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
  function Z0() {
    if (typeof performance.getEntriesByType == "function") {
      for (var e = 0, t = 0, l = performance.getEntriesByType("resource"), a = 0; a < l.length; a++) {
        var i = l[a], s = i.transferSize, c = i.initiatorType, d = i.duration;
        if (s && d && jf(c)) {
          for (c = 0, d = i.responseEnd, a += 1; a < l.length; a++) {
            var p = l[a], S = p.startTime;
            if (S > d) break;
            var C = p.transferSize, R = p.initiatorType;
            C && jf(R) && (p = p.responseEnd, c += C * (p < d ? 1 : (d - S) / (p - S)));
          }
          if (--a, t += 8 * (s + c) / (i.duration / 1e3), e++, 10 < e) break;
        }
      }
      if (0 < e) return t / e / 1e6;
    }
    return navigator.connection && (e = navigator.connection.downlink, typeof e == "number") ? e : 5;
  }
  var vu = null, bu = null;
  function ss(e) {
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
  function Sf(e, t) {
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
  function ju(e, t) {
    return e === "textarea" || e === "noscript" || typeof t.children == "string" || typeof t.children == "number" || typeof t.children == "bigint" || typeof t.dangerouslySetInnerHTML == "object" && t.dangerouslySetInnerHTML !== null && t.dangerouslySetInnerHTML.__html != null;
  }
  var yu = null;
  function K0() {
    var e = window.event;
    return e && e.type === "popstate" ? e === yu ? !1 : (yu = e, !0) : (yu = null, !1);
  }
  var zf = typeof setTimeout == "function" ? setTimeout : void 0, J0 = typeof clearTimeout == "function" ? clearTimeout : void 0, Nf = typeof Promise == "function" ? Promise : void 0, I0 = typeof queueMicrotask == "function" ? queueMicrotask : typeof Nf < "u" ? function(e) {
    return Nf.resolve(null).then(e).catch($0);
  } : zf;
  function $0(e) {
    setTimeout(function() {
      throw e;
    });
  }
  function Ll(e) {
    return e === "head";
  }
  function _f(e, t) {
    var l = t, a = 0;
    do {
      var i = l.nextSibling;
      if (e.removeChild(l), i && i.nodeType === 8) if (l = i.data, l === "/$" || l === "/&") {
        if (a === 0) {
          e.removeChild(i), Pa(t);
          return;
        }
        a--;
      } else if (l === "$" || l === "$?" || l === "$~" || l === "$!" || l === "&") a++;
      else if (l === "html") Vn(e.ownerDocument.documentElement);
      else if (l === "head") {
        l = e.ownerDocument.head, Vn(l);
        for (var s = l.firstChild; s; ) {
          var c = s.nextSibling, d = s.nodeName;
          s[cn] || d === "SCRIPT" || d === "STYLE" || d === "LINK" && s.rel.toLowerCase() === "stylesheet" || l.removeChild(s), s = c;
        }
      } else l === "body" && Vn(e.ownerDocument.body);
      l = i;
    } while (l);
    Pa(t);
  }
  function Ef(e, t) {
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
  function Su(e) {
    var t = e.firstChild;
    for (t && t.nodeType === 10 && (t = t.nextSibling); t; ) {
      var l = t;
      switch (t = t.nextSibling, l.nodeName) {
        case "HTML":
        case "HEAD":
        case "BODY":
          Su(l), As(l);
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
  function W0(e, t, l, a) {
    for (; e.nodeType === 1; ) {
      var i = l;
      if (e.nodeName.toLowerCase() !== t.toLowerCase()) {
        if (!a && (e.nodeName !== "INPUT" || e.type !== "hidden")) break;
      } else if (a) {
        if (!e[cn]) switch (t) {
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
      if (e = Yt(e.nextSibling), e === null) break;
    }
    return null;
  }
  function F0(e, t, l) {
    if (t === "") return null;
    for (; e.nodeType !== 3; )
      if ((e.nodeType !== 1 || e.nodeName !== "INPUT" || e.type !== "hidden") && !l || (e = Yt(e.nextSibling), e === null)) return null;
    return e;
  }
  function Tf(e, t) {
    for (; e.nodeType !== 8; )
      if ((e.nodeType !== 1 || e.nodeName !== "INPUT" || e.type !== "hidden") && !t || (e = Yt(e.nextSibling), e === null)) return null;
    return e;
  }
  function zu(e) {
    return e.data === "$?" || e.data === "$~";
  }
  function Nu(e) {
    return e.data === "$!" || e.data === "$?" && e.ownerDocument.readyState !== "loading";
  }
  function P0(e, t) {
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
  function Yt(e) {
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
  var _u = null;
  function Af(e) {
    e = e.nextSibling;
    for (var t = 0; e; ) {
      if (e.nodeType === 8) {
        var l = e.data;
        if (l === "/$" || l === "/&") {
          if (t === 0) return Yt(e.nextSibling);
          t--;
        } else l !== "$" && l !== "$!" && l !== "$?" && l !== "$~" && l !== "&" || t++;
      }
      e = e.nextSibling;
    }
    return null;
  }
  function wf(e) {
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
  function Cf(e, t, l) {
    switch (t = ss(l), e) {
      case "html":
        if (e = t.documentElement, !e) throw Error(o(452));
        return e;
      case "head":
        if (e = t.head, !e) throw Error(o(453));
        return e;
      case "body":
        if (e = t.body, !e) throw Error(o(454));
        return e;
      default:
        throw Error(o(451));
    }
  }
  function Vn(e) {
    for (var t = e.attributes; t.length; ) e.removeAttributeNode(t[0]);
    As(e);
  }
  var Gt = /* @__PURE__ */ new Map(), Of = /* @__PURE__ */ new Set();
  function cs(e) {
    return typeof e.getRootNode == "function" ? e.getRootNode() : e.nodeType === 9 ? e : e.ownerDocument;
  }
  var bl = V.d;
  V.d = {
    f: eh,
    r: th,
    D: lh,
    C: ah,
    L: nh,
    m: ih,
    X: ch,
    S: sh,
    M: uh
  };
  function eh() {
    var e = bl.f(), t = Fi();
    return e || t;
  }
  function th(e) {
    var t = va(e);
    t !== null && t.tag === 5 && t.type === "form" ? Io(t) : bl.r(e);
  }
  var $a = typeof document > "u" ? null : document;
  function Mf(e, t, l) {
    var a = $a;
    if (a && typeof t == "string" && t) {
      var i = Dt(t);
      i = 'link[rel="' + e + '"][href="' + i + '"]', typeof l == "string" && (i += '[crossorigin="' + l + '"]'), Of.has(i) || (Of.add(i), e = {
        rel: e,
        crossOrigin: l,
        href: t
      }, a.querySelector(i) === null && (t = a.createElement("link"), ft(t, "link", e), nt(t), a.head.appendChild(t)));
    }
  }
  function lh(e) {
    bl.D(e), Mf("dns-prefetch", e, null);
  }
  function ah(e, t) {
    bl.C(e, t), Mf("preconnect", e, t);
  }
  function nh(e, t, l) {
    bl.L(e, t, l);
    var a = $a;
    if (a && e && t) {
      var i = 'link[rel="preload"][as="' + Dt(t) + '"]';
      t === "image" && l && l.imageSrcSet ? (i += '[imagesrcset="' + Dt(l.imageSrcSet) + '"]', typeof l.imageSizes == "string" && (i += '[imagesizes="' + Dt(l.imageSizes) + '"]')) : i += '[href="' + Dt(e) + '"]';
      var s = i;
      switch (t) {
        case "style":
          s = Wa(e);
          break;
        case "script":
          s = Fa(e);
      }
      Gt.has(s) || (e = B({
        rel: "preload",
        href: t === "image" && l && l.imageSrcSet ? void 0 : e,
        as: t
      }, l), Gt.set(s, e), a.querySelector(i) !== null || t === "style" && a.querySelector(Xn(s)) || t === "script" && a.querySelector(Qn(s)) || (t = a.createElement("link"), ft(t, "link", e), nt(t), a.head.appendChild(t)));
    }
  }
  function ih(e, t) {
    bl.m(e, t);
    var l = $a;
    if (l && e) {
      var a = t && typeof t.as == "string" ? t.as : "script", i = 'link[rel="modulepreload"][as="' + Dt(a) + '"][href="' + Dt(e) + '"]', s = i;
      switch (a) {
        case "audioworklet":
        case "paintworklet":
        case "serviceworker":
        case "sharedworker":
        case "worker":
        case "script":
          s = Fa(e);
      }
      if (!Gt.has(s) && (e = B({
        rel: "modulepreload",
        href: e
      }, t), Gt.set(s, e), l.querySelector(i) === null)) {
        switch (a) {
          case "audioworklet":
          case "paintworklet":
          case "serviceworker":
          case "sharedworker":
          case "worker":
          case "script":
            if (l.querySelector(Qn(s))) return;
        }
        a = l.createElement("link"), ft(a, "link", e), nt(a), l.head.appendChild(a);
      }
    }
  }
  function sh(e, t, l) {
    bl.S(e, t, l);
    var a = $a;
    if (a && e) {
      var i = ba(a).hoistableStyles, s = Wa(e);
      t = t || "default";
      var c = i.get(s);
      if (!c) {
        var d = {
          loading: 0,
          preload: null
        };
        if (c = a.querySelector(Xn(s))) d.loading = 5;
        else {
          e = B({
            rel: "stylesheet",
            href: e,
            "data-precedence": t
          }, l), (l = Gt.get(s)) && Eu(e, l);
          var p = c = a.createElement("link");
          nt(p), ft(p, "link", e), p._p = new Promise(function(S, C) {
            p.onload = S, p.onerror = C;
          }), p.addEventListener("load", function() {
            d.loading |= 1;
          }), p.addEventListener("error", function() {
            d.loading |= 2;
          }), d.loading |= 4, us(c, t, a);
        }
        c = {
          type: "stylesheet",
          instance: c,
          count: 1,
          state: d
        }, i.set(s, c);
      }
    }
  }
  function ch(e, t) {
    bl.X(e, t);
    var l = $a;
    if (l && e) {
      var a = ba(l).hoistableScripts, i = Fa(e), s = a.get(i);
      s || (s = l.querySelector(Qn(i)), s || (e = B({
        src: e,
        async: !0
      }, t), (t = Gt.get(i)) && Tu(e, t), s = l.createElement("script"), nt(s), ft(s, "link", e), l.head.appendChild(s)), s = {
        type: "script",
        instance: s,
        count: 1,
        state: null
      }, a.set(i, s));
    }
  }
  function uh(e, t) {
    bl.M(e, t);
    var l = $a;
    if (l && e) {
      var a = ba(l).hoistableScripts, i = Fa(e), s = a.get(i);
      s || (s = l.querySelector(Qn(i)), s || (e = B({
        src: e,
        async: !0,
        type: "module"
      }, t), (t = Gt.get(i)) && Tu(e, t), s = l.createElement("script"), nt(s), ft(s, "link", e), l.head.appendChild(s)), s = {
        type: "script",
        instance: s,
        count: 1,
        state: null
      }, a.set(i, s));
    }
  }
  function Df(e, t, l, a) {
    var i = (i = me.current) ? cs(i) : null;
    if (!i) throw Error(o(446));
    switch (e) {
      case "meta":
      case "title":
        return null;
      case "style":
        return typeof l.precedence == "string" && typeof l.href == "string" ? (t = Wa(l.href), l = ba(i).hoistableStyles, a = l.get(t), a || (a = {
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
          e = Wa(l.href);
          var s = ba(i).hoistableStyles, c = s.get(e);
          if (c || (i = i.ownerDocument || i, c = {
            type: "stylesheet",
            instance: null,
            count: 0,
            state: {
              loading: 0,
              preload: null
            }
          }, s.set(e, c), (s = i.querySelector(Xn(e))) && !s._p && (c.instance = s, c.state.loading = 5), Gt.has(e) || (l = {
            rel: "preload",
            as: "style",
            href: l.href,
            crossOrigin: l.crossOrigin,
            integrity: l.integrity,
            media: l.media,
            hrefLang: l.hrefLang,
            referrerPolicy: l.referrerPolicy
          }, Gt.set(e, l), s || dh(i, e, l, c.state))), t && a === null) throw Error(o(528, ""));
          return c;
        }
        if (t && a !== null) throw Error(o(529, ""));
        return null;
      case "script":
        return t = l.async, l = l.src, typeof l == "string" && t && typeof t != "function" && typeof t != "symbol" ? (t = Fa(l), l = ba(i).hoistableScripts, a = l.get(t), a || (a = {
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
        throw Error(o(444, e));
    }
  }
  function Wa(e) {
    return 'href="' + Dt(e) + '"';
  }
  function Xn(e) {
    return 'link[rel="stylesheet"][' + e + "]";
  }
  function kf(e) {
    return B({}, e, {
      "data-precedence": e.precedence,
      precedence: null
    });
  }
  function dh(e, t, l, a) {
    e.querySelector('link[rel="preload"][as="style"][' + t + "]") ? a.loading = 1 : (t = e.createElement("link"), a.preload = t, t.addEventListener("load", function() {
      return a.loading |= 1;
    }), t.addEventListener("error", function() {
      return a.loading |= 2;
    }), ft(t, "link", l), nt(t), e.head.appendChild(t));
  }
  function Fa(e) {
    return '[src="' + Dt(e) + '"]';
  }
  function Qn(e) {
    return "script[async]" + e;
  }
  function Uf(e, t, l) {
    if (t.count++, t.instance === null) switch (t.type) {
      case "style":
        var a = e.querySelector('style[data-href~="' + Dt(l.href) + '"]');
        if (a) return t.instance = a, nt(a), a;
        var i = B({}, l, {
          "data-href": l.href,
          "data-precedence": l.precedence,
          href: null,
          precedence: null
        });
        return a = (e.ownerDocument || e).createElement("style"), nt(a), ft(a, "style", i), us(a, l.precedence, e), t.instance = a;
      case "stylesheet":
        i = Wa(l.href);
        var s = e.querySelector(Xn(i));
        if (s) return t.state.loading |= 4, t.instance = s, nt(s), s;
        a = kf(l), (i = Gt.get(i)) && Eu(a, i), s = (e.ownerDocument || e).createElement("link"), nt(s);
        var c = s;
        return c._p = new Promise(function(d, p) {
          c.onload = d, c.onerror = p;
        }), ft(s, "link", a), t.state.loading |= 4, us(s, l.precedence, e), t.instance = s;
      case "script":
        return s = Fa(l.src), (i = e.querySelector(Qn(s))) ? (t.instance = i, nt(i), i) : (a = l, (i = Gt.get(s)) && (a = B({}, l), Tu(a, i)), e = e.ownerDocument || e, i = e.createElement("script"), nt(i), ft(i, "link", a), e.head.appendChild(i), t.instance = i);
      case "void":
        return null;
      default:
        throw Error(o(443, t.type));
    }
    else t.type === "stylesheet" && (t.state.loading & 4) === 0 && (a = t.instance, t.state.loading |= 4, us(a, l.precedence, e));
    return t.instance;
  }
  function us(e, t, l) {
    for (var a = l.querySelectorAll('link[rel="stylesheet"][data-precedence],style[data-precedence]'), i = a.length ? a[a.length - 1] : null, s = i, c = 0; c < a.length; c++) {
      var d = a[c];
      if (d.dataset.precedence === t) s = d;
      else if (s !== i) break;
    }
    s ? s.parentNode.insertBefore(e, s.nextSibling) : (t = l.nodeType === 9 ? l.head : l, t.insertBefore(e, t.firstChild));
  }
  function Eu(e, t) {
    e.crossOrigin ??= t.crossOrigin, e.referrerPolicy ??= t.referrerPolicy, e.title ??= t.title;
  }
  function Tu(e, t) {
    e.crossOrigin ??= t.crossOrigin, e.referrerPolicy ??= t.referrerPolicy, e.integrity ??= t.integrity;
  }
  var ds = null;
  function Rf(e, t, l) {
    if (ds === null) {
      var a = /* @__PURE__ */ new Map(), i = ds = /* @__PURE__ */ new Map();
      i.set(l, a);
    } else i = ds, a = i.get(l), a || (a = /* @__PURE__ */ new Map(), i.set(l, a));
    if (a.has(e)) return a;
    for (a.set(e, null), l = l.getElementsByTagName(e), i = 0; i < l.length; i++) {
      var s = l[i];
      if (!(s[cn] || s[ut] || e === "link" && s.getAttribute("rel") === "stylesheet") && s.namespaceURI !== "http://www.w3.org/2000/svg") {
        var c = s.getAttribute(t) || "";
        c = e + c;
        var d = a.get(c);
        d ? d.push(s) : a.set(c, [s]);
      }
    }
    return a;
  }
  function qf(e, t, l) {
    e = e.ownerDocument || e, e.head.insertBefore(l, t === "title" ? e.querySelector("head > title") : null);
  }
  function oh(e, t, l) {
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
  function Hf(e) {
    return !(e.type === "stylesheet" && (e.state.loading & 3) === 0);
  }
  function rh(e, t, l, a) {
    if (l.type === "stylesheet" && (typeof a.media != "string" || matchMedia(a.media).matches !== !1) && (l.state.loading & 4) === 0) {
      if (l.instance === null) {
        var i = Wa(a.href), s = t.querySelector(Xn(i));
        if (s) {
          t = s._p, t !== null && typeof t == "object" && typeof t.then == "function" && (e.count++, e = os.bind(e), t.then(e, e)), l.state.loading |= 4, l.instance = s, nt(s);
          return;
        }
        s = t.ownerDocument || t, a = kf(a), (i = Gt.get(i)) && Eu(a, i), s = s.createElement("link"), nt(s);
        var c = s;
        c._p = new Promise(function(d, p) {
          c.onload = d, c.onerror = p;
        }), ft(s, "link", a), l.instance = s;
      }
      e.stylesheets === null && (e.stylesheets = /* @__PURE__ */ new Map()), e.stylesheets.set(l, t), (t = l.state.preload) && (l.state.loading & 3) === 0 && (e.count++, l = os.bind(e), t.addEventListener("load", l), t.addEventListener("error", l));
    }
  }
  var Au = 0;
  function fh(e, t) {
    return e.stylesheets && e.count === 0 && fs(e, e.stylesheets), 0 < e.count || 0 < e.imgCount ? function(l) {
      var a = setTimeout(function() {
        if (e.stylesheets && fs(e, e.stylesheets), e.unsuspend) {
          var s = e.unsuspend;
          e.unsuspend = null, s();
        }
      }, 6e4 + t);
      0 < e.imgBytes && Au === 0 && (Au = 62500 * Z0());
      var i = setTimeout(function() {
        if (e.waitingForImages = !1, e.count === 0 && (e.stylesheets && fs(e, e.stylesheets), e.unsuspend)) {
          var s = e.unsuspend;
          e.unsuspend = null, s();
        }
      }, (e.imgBytes > Au ? 50 : 800) + t);
      return e.unsuspend = l, function() {
        e.unsuspend = null, clearTimeout(a), clearTimeout(i);
      };
    } : null;
  }
  function os() {
    if (this.count--, this.count === 0 && (this.imgCount === 0 || !this.waitingForImages)) {
      if (this.stylesheets) fs(this, this.stylesheets);
      else if (this.unsuspend) {
        var e = this.unsuspend;
        this.unsuspend = null, e();
      }
    }
  }
  var rs = null;
  function fs(e, t) {
    e.stylesheets = null, e.unsuspend !== null && (e.count++, rs = /* @__PURE__ */ new Map(), t.forEach(ph, e), rs = null, os.call(e));
  }
  function ph(e, t) {
    if (!(t.state.loading & 4)) {
      var l = rs.get(e);
      if (l) var a = l.get(null);
      else {
        l = /* @__PURE__ */ new Map(), rs.set(e, l);
        for (var i = e.querySelectorAll("link[data-precedence],style[data-precedence]"), s = 0; s < i.length; s++) {
          var c = i[s];
          (c.nodeName === "LINK" || c.getAttribute("media") !== "not all") && (l.set(c.dataset.precedence, c), a = c);
        }
        a && l.set(null, a);
      }
      i = t.instance, c = i.getAttribute("data-precedence"), s = l.get(c) || a, s === a && l.set(null, i), l.set(c, i), this.count++, a = os.bind(this), i.addEventListener("load", a), i.addEventListener("error", a), s ? s.parentNode.insertBefore(i, s.nextSibling) : (e = e.nodeType === 9 ? e.head : e, e.insertBefore(i, e.firstChild)), t.state.loading |= 4;
    }
  }
  var Zn = {
    $$typeof: W,
    Provider: null,
    Consumer: null,
    _currentValue: je,
    _currentValue2: je,
    _threadCount: 0
  };
  function hh(e, t, l, a, i, s, c, d, p) {
    this.tag = 1, this.containerInfo = e, this.pingCache = this.current = this.pendingChildren = null, this.timeoutHandle = -1, this.callbackNode = this.next = this.pendingContext = this.context = this.cancelPendingCommit = null, this.callbackPriority = 0, this.expirationTimes = _s(-1), this.entangledLanes = this.shellSuspendCounter = this.errorRecoveryDisabledLanes = this.expiredLanes = this.warmLanes = this.pingedLanes = this.suspendedLanes = this.pendingLanes = 0, this.entanglements = _s(0), this.hiddenUpdates = _s(null), this.identifierPrefix = a, this.onUncaughtError = i, this.onCaughtError = s, this.onRecoverableError = c, this.pooledCache = null, this.pooledCacheLanes = 0, this.formState = p, this.incompleteTransitions = /* @__PURE__ */ new Map();
  }
  function mh(e, t, l, a, i, s, c, d, p, S, C, R) {
    return e = new hh(e, t, l, c, p, S, C, R, d), t = 1, s === !0 && (t |= 24), s = Et(3, null, null, t), e.current = s, s.stateNode = e, t = uc(), t.refCount++, e.pooledCache = t, t.refCount++, s.memoizedState = {
      element: a,
      isDehydrated: l,
      cache: t
    }, fc(s), e;
  }
  function xh(e) {
    return e ? (e = wa, e) : wa;
  }
  function Bf(e, t, l, a, i, s) {
    i = xh(i), a.context === null ? a.context = i : a.pendingContext = i, a = ca(t), a.payload = { element: l }, s = s === void 0 ? null : s, s !== null && (a.callback = s), l = ua(e, a, t), l !== null && (St(l, e, t), Nn(l, e, t));
  }
  function Lf(e, t) {
    if (e = e.memoizedState, e !== null && e.dehydrated !== null) {
      var l = e.retryLane;
      e.retryLane = l !== 0 && l < t ? l : t;
    }
  }
  function wu(e, t) {
    Lf(e, t), (e = e.alternate) && Lf(e, t);
  }
  function Yf(e) {
    if (e.tag === 13 || e.tag === 31) {
      var t = Fl(e, 67108864);
      t !== null && St(t, e, 67108864), wu(e, 67108864);
    }
  }
  function Gf(e) {
    if (e.tag === 13 || e.tag === 31) {
      var t = Lt();
      t = id(t);
      var l = Fl(e, t);
      l !== null && St(l, e, t), wu(e, t);
    }
  }
  var ps = !0;
  function gh(e, t, l, a) {
    var i = O.T;
    O.T = null;
    var s = V.p;
    try {
      V.p = 2, Cu(e, t, l, a);
    } finally {
      V.p = s, O.T = i;
    }
  }
  function vh(e, t, l, a) {
    var i = O.T;
    O.T = null;
    var s = V.p;
    try {
      V.p = 8, Cu(e, t, l, a);
    } finally {
      V.p = s, O.T = i;
    }
  }
  function Cu(e, t, l, a) {
    if (ps) {
      var i = Ou(a);
      if (i === null) xu(e, t, a, hs, l), Xf(e, a);
      else if (jh(i, e, t, l, a)) a.stopPropagation();
      else if (Xf(e, a), t & 4 && -1 < bh.indexOf(e)) {
        for (; i !== null; ) {
          var s = va(i);
          if (s !== null) switch (s.tag) {
            case 3:
              if (s = s.stateNode, s.current.memoizedState.isDehydrated) {
                var c = Kl(s.pendingLanes);
                if (c !== 0) {
                  var d = s;
                  for (d.pendingLanes |= 2, d.entangledLanes |= 2; c; ) {
                    var p = 1 << 31 - Nt(c);
                    d.entanglements[1] |= p, c &= ~p;
                  }
                  vl(s), (Oe & 6) === 0 && ($i = ke() + 500, Ln(0, !1));
                }
              }
              break;
            case 31:
            case 13:
              d = Fl(s, 2), d !== null && St(d, s, 2), Fi(), wu(s, 2);
          }
          if (s = Ou(a), s === null && xu(e, t, a, hs, l), s === i) break;
          i = s;
        }
        i !== null && a.stopPropagation();
      } else xu(e, t, a, null, l);
    }
  }
  function Ou(e) {
    return e = ks(e), Mu(e);
  }
  var hs = null;
  function Mu(e) {
    if (hs = null, e = ga(e), e !== null) {
      var t = G(e);
      if (t === null) e = null;
      else {
        var l = t.tag;
        if (l === 13) {
          if (e = k(t), e !== null) return e;
          e = null;
        } else if (l === 31) {
          if (e = H(t), e !== null) return e;
          e = null;
        } else if (l === 3) {
          if (t.stateNode.current.memoizedState.isDehydrated) return t.tag === 3 ? t.stateNode.containerInfo : null;
          e = null;
        } else t !== e && (e = null);
      }
    }
    return hs = e, null;
  }
  function Vf(e) {
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
          case an:
            return 2;
          case f:
            return 8;
          case ce:
          case pe:
            return 32;
          case ct:
            return 268435456;
          default:
            return 32;
        }
      default:
        return 32;
    }
  }
  var Du = !1, Yl = null, Gl = null, Vl = null, Kn = /* @__PURE__ */ new Map(), Jn = /* @__PURE__ */ new Map(), Xl = [], bh = "mousedown mouseup touchcancel touchend touchstart auxclick dblclick pointercancel pointerdown pointerup dragend dragstart drop compositionend compositionstart keydown keypress keyup input textInput copy cut paste click change contextmenu reset".split(" ");
  function Xf(e, t) {
    switch (e) {
      case "focusin":
      case "focusout":
        Yl = null;
        break;
      case "dragenter":
      case "dragleave":
        Gl = null;
        break;
      case "mouseover":
      case "mouseout":
        Vl = null;
        break;
      case "pointerover":
      case "pointerout":
        Kn.delete(t.pointerId);
        break;
      case "gotpointercapture":
      case "lostpointercapture":
        Jn.delete(t.pointerId);
    }
  }
  function In(e, t, l, a, i, s) {
    return e === null || e.nativeEvent !== s ? (e = {
      blockedOn: t,
      domEventName: l,
      eventSystemFlags: a,
      nativeEvent: s,
      targetContainers: [i]
    }, t !== null && (t = va(t), t !== null && Yf(t)), e) : (e.eventSystemFlags |= a, t = e.targetContainers, i !== null && t.indexOf(i) === -1 && t.push(i), e);
  }
  function jh(e, t, l, a, i) {
    switch (t) {
      case "focusin":
        return Yl = In(Yl, e, t, l, a, i), !0;
      case "dragenter":
        return Gl = In(Gl, e, t, l, a, i), !0;
      case "mouseover":
        return Vl = In(Vl, e, t, l, a, i), !0;
      case "pointerover":
        var s = i.pointerId;
        return Kn.set(s, In(Kn.get(s) || null, e, t, l, a, i)), !0;
      case "gotpointercapture":
        return s = i.pointerId, Jn.set(s, In(Jn.get(s) || null, e, t, l, a, i)), !0;
    }
    return !1;
  }
  function Qf(e) {
    var t = ga(e.target);
    if (t !== null) {
      var l = G(t);
      if (l !== null) {
        if (t = l.tag, t === 13) {
          if (t = k(l), t !== null) {
            e.blockedOn = t, cd(e.priority, function() {
              Gf(l);
            });
            return;
          }
        } else if (t === 31) {
          if (t = H(l), t !== null) {
            e.blockedOn = t, cd(e.priority, function() {
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
  function ms(e) {
    if (e.blockedOn !== null) return !1;
    for (var t = e.targetContainers; 0 < t.length; ) {
      var l = Ou(e.nativeEvent);
      if (l === null) {
        l = e.nativeEvent;
        var a = new l.constructor(l.type, l);
        Ds = a, l.target.dispatchEvent(a), Ds = null;
      } else return t = va(l), t !== null && Yf(t), e.blockedOn = l, !1;
      t.shift();
    }
    return !0;
  }
  function Zf(e, t, l) {
    ms(e) && l.delete(t);
  }
  function yh() {
    Du = !1, Yl !== null && ms(Yl) && (Yl = null), Gl !== null && ms(Gl) && (Gl = null), Vl !== null && ms(Vl) && (Vl = null), Kn.forEach(Zf), Jn.forEach(Zf);
  }
  function xs(e, t) {
    e.blockedOn === t && (e.blockedOn = null, Du || (Du = !0, v.unstable_scheduleCallback(v.unstable_NormalPriority, yh)));
  }
  var gs = null;
  function Kf(e) {
    gs !== e && (gs = e, v.unstable_scheduleCallback(v.unstable_NormalPriority, function() {
      gs === e && (gs = null);
      for (var t = 0; t < e.length; t += 3) {
        var l = e[t], a = e[t + 1], i = e[t + 2];
        if (typeof a != "function") {
          if (Mu(a || l) === null) continue;
          break;
        }
        var s = va(l);
        s !== null && (e.splice(t, 3), t -= 3, Mc(s, {
          pending: !0,
          data: i,
          method: l.method,
          action: a
        }, a, i));
      }
    }));
  }
  function Pa(e) {
    function t(p) {
      return xs(p, e);
    }
    Yl !== null && xs(Yl, e), Gl !== null && xs(Gl, e), Vl !== null && xs(Vl, e), Kn.forEach(t), Jn.forEach(t);
    for (var l = 0; l < Xl.length; l++) {
      var a = Xl[l];
      a.blockedOn === e && (a.blockedOn = null);
    }
    for (; 0 < Xl.length && (l = Xl[0], l.blockedOn === null); ) Qf(l), l.blockedOn === null && Xl.shift();
    if (l = (e.ownerDocument || e).$$reactFormReplay, l != null) for (a = 0; a < l.length; a += 3) {
      var i = l[a], s = l[a + 1], c = i[xt] || null;
      if (typeof s == "function") c || Kf(l);
      else if (c) {
        var d = null;
        if (s && s.hasAttribute("formAction")) {
          if (i = s, c = s[xt] || null) d = c.formAction;
          else if (Mu(i) !== null) continue;
        } else d = c.action;
        typeof d == "function" ? l[a + 1] = d : (l.splice(a, 3), a -= 3), Kf(l);
      }
    }
  }
  function Sh() {
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
  Uu.prototype.render = ku.prototype.render = function(e) {
    var t = this._internalRoot;
    if (t === null) throw Error(o(409));
    var l = t.current;
    Bf(l, Lt(), e, t, null, null);
  }, Uu.prototype.unmount = ku.prototype.unmount = function() {
    var e = this._internalRoot;
    if (e !== null) {
      this._internalRoot = null;
      var t = e.containerInfo;
      Bf(e.current, 2, null, e, null, null), Fi(), t[sn] = null;
    }
  };
  function Uu(e) {
    this._internalRoot = e;
  }
  Uu.prototype.unstable_scheduleHydration = function(e) {
    if (e) {
      var t = sd();
      e = {
        blockedOn: null,
        target: e,
        priority: t
      };
      for (var l = 0; l < Xl.length && t !== 0 && t < Xl[l].priority; l++) ;
      Xl.splice(l, 0, e), l === 0 && Qf(e);
    }
  };
  var Jf = w.version;
  if (Jf !== "19.2.6") throw Error(o(527, Jf, "19.2.6"));
  V.findDOMNode = function(e) {
    var t = e._reactInternals;
    if (t === void 0)
      throw typeof e.render == "function" ? Error(o(188)) : (e = Object.keys(e).join(","), Error(o(268, e)));
    return e = E(t), e = e !== null ? Z(e) : null, e = e === null ? null : e.stateNode, e;
  };
  var zh = {
    bundleType: 0,
    version: "19.2.6",
    rendererPackageName: "react-dom",
    currentDispatcherRef: O,
    reconcilerVersion: "19.2.6"
  };
  if (typeof __REACT_DEVTOOLS_GLOBAL_HOOK__ < "u") {
    var vs = __REACT_DEVTOOLS_GLOBAL_HOOK__;
    if (!vs.isDisabled && vs.supportsFiber) try {
      Sl = vs.inject(zh), ht = vs;
    } catch {
    }
  }
  u.createRoot = function(e, t) {
    if (!T(e)) throw Error(o(299));
    var l = !1, a = "", i = v0, s = b0, c = j0;
    return t != null && (t.unstable_strictMode === !0 && (l = !0), t.identifierPrefix !== void 0 && (a = t.identifierPrefix), t.onUncaughtError !== void 0 && (i = t.onUncaughtError), t.onCaughtError !== void 0 && (s = t.onCaughtError), t.onRecoverableError !== void 0 && (c = t.onRecoverableError)), t = mh(e, 1, !1, null, null, l, a, null, i, s, c, Sh), e[sn] = t.current, mf(e), new ku(t);
  };
})), Oh = /* @__PURE__ */ Pt(((u, v) => {
  function w() {
    if (!(typeof __REACT_DEVTOOLS_GLOBAL_HOOK__ > "u" || typeof __REACT_DEVTOOLS_GLOBAL_HOOK__.checkDCE != "function"))
      try {
        __REACT_DEVTOOLS_GLOBAL_HOOK__.checkDCE(w);
      } catch (r) {
        console.error(r);
      }
  }
  w(), v.exports = Ch();
})), op = (...u) => u.filter((v, w, r) => !!v && v.trim() !== "" && r.indexOf(v) === w).join(" ").trim(), Mh = (u) => u.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase(), Dh = (u) => u.replace(/^([A-Z])|[\s-_]+(\w)/g, (v, w, r) => r ? r.toUpperCase() : w.toLowerCase()), If = (u) => {
  const v = Dh(u);
  return v.charAt(0).toUpperCase() + v.slice(1);
}, Ru = {
  xmlns: "http://www.w3.org/2000/svg",
  width: 24,
  height: 24,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round",
  strokeLinejoin: "round"
}, kh = (u) => {
  for (const v in u) if (v.startsWith("aria-") || v === "role" || v === "title") return !0;
  return !1;
}, M = Pu(), Uh = (0, M.createContext)({}), Rh = () => (0, M.useContext)(Uh), qh = (0, M.forwardRef)(({ color: u, size: v, strokeWidth: w, absoluteStrokeWidth: r, className: o = "", children: T, iconNode: G, ...k }, H) => {
  const { size: _ = 24, strokeWidth: E = 2, absoluteStrokeWidth: Z = !1, color: B = "currentColor", className: ne = "" } = Rh() ?? {}, ue = r ?? Z ? Number(w ?? E) * 24 / Number(v ?? _) : w ?? E;
  return (0, M.createElement)("svg", {
    ref: H,
    ...Ru,
    width: v ?? _ ?? Ru.width,
    height: v ?? _ ?? Ru.height,
    stroke: u ?? B,
    strokeWidth: ue,
    className: op("lucide", ne, o),
    ...!T && !kh(k) && { "aria-hidden": "true" },
    ...k
  }, [...G.map(([L, I]) => (0, M.createElement)(L, I)), ...Array.isArray(T) ? T : [T]]);
}), Ge = (u, v) => {
  const w = (0, M.forwardRef)(({ className: r, ...o }, T) => (0, M.createElement)(qh, {
    ref: T,
    iconNode: v,
    className: op(`lucide-${Mh(If(u))}`, `lucide-${u}`, r),
    ...o
  }));
  return w.displayName = If(u), w;
}, Hh = [
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
], Bh = Ge("archive", Hh), Lh = [["path", {
  d: "M5 12h14",
  key: "1ays0h"
}], ["path", {
  d: "m12 5 7 7-7 7",
  key: "xquz4c"
}]], ti = Ge("arrow-right", Lh), Yh = [["path", {
  d: "M7 7h10v10",
  key: "1tivn9"
}], ["path", {
  d: "M7 17 17 7",
  key: "1vkiza"
}]], Gh = Ge("arrow-up-right", Yh), Vh = [
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
], Ku = Ge("box", Vh), Xh = [["path", {
  d: "M20 6 9 17l-5-5",
  key: "1gmf2c"
}]], $n = Ge("check", Xh), Qh = [["path", {
  d: "m9 18 6-6-6-6",
  key: "mthhwq"
}]], $f = Ge("chevron-right", Qh), Zh = [
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
], en = Ge("circle-alert", Zh), Kh = [
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
], Wn = Ge("clapperboard", Kh), Jh = [["circle", {
  cx: "12",
  cy: "12",
  r: "10",
  key: "1mglay"
}], ["path", {
  d: "M12 6v6h4",
  key: "135r8i"
}]], rp = Ge("clock-3", Jh), Ih = [["rect", {
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
}]], $h = Ge("copy", Ih), Wh = [
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
], Ju = Ge("download", Wh), Fh = [
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
], ma = Ge("file-check-corner", Fh), Ph = [
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
], qu = Ge("film", Ph), em = [
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
], Fn = Ge("git-branch", em), tm = [
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
], Wf = Ge("layout-grid", tm), lm = [
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
], Iu = Ge("link-2", lm), am = [
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
], nm = Ge("list-checks", am), im = [["path", {
  d: "M21 12a9 9 0 1 1-6.219-8.56",
  key: "13zald"
}]], Hu = Ge("loader-circle", im), sm = [
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
], $u = Ge("lock-keyhole", sm), cm = [["path", {
  d: "M22 17a2 2 0 0 1-2 2H6.828a2 2 0 0 0-1.414.586l-2.202 2.202A.71.71 0 0 1 2 21.286V5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2z",
  key: "18887p"
}]], bs = Ge("message-square", cm), um = [["path", {
  d: "M5 12h14",
  key: "1ays0h"
}], ["path", {
  d: "M12 5v14",
  key: "s699le"
}]], tn = Ge("plus", um), dm = [
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
], om = Ge("refresh-cw", dm), rm = [["path", {
  d: "M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8",
  key: "1357e3"
}], ["path", {
  d: "M3 3v5h5",
  key: "1xhq8a"
}]], fm = Ge("rotate-ccw", rm), pm = [["path", {
  d: "m21 21-4.34-4.34",
  key: "14j7rj"
}], ["circle", {
  cx: "11",
  cy: "11",
  r: "8",
  key: "4ej97u"
}]], hm = Ge("search", pm), mm = [["path", {
  d: "M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z",
  key: "oel41y"
}], ["path", {
  d: "m9 12 2 2 4-4",
  key: "dzmm74"
}]], ha = Ge("shield-check", mm), xm = [["path", {
  d: "M18 6 6 18",
  key: "1bl5f8"
}], ["path", {
  d: "m6 6 12 12",
  key: "d8bk6v"
}]], Ff = Ge("x", xm), gm = Oh(), jl = [
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
], vm = class extends Error {
  constructor(u, v = 400) {
    super(u), this.status = v;
  }
}, Pf = (u, v = 400) => {
  throw new vm(u, v);
};
function zs(u) {
  return u.modelFlow ?? {
    models: [],
    issues: [],
    packs: [],
    pins: [],
    history: []
  };
}
function bm(u, v, w) {
  const r = zs(u).models.find((T) => T.id === v || T.key === v);
  r || Pf("找不到模型");
  const o = r.versions.find((T) => T.id === w);
  return o || Pf("找不到指定模型版本"), {
    m: r,
    v: o
  };
}
function jm(u, v, w, r) {
  const { v: o } = bm(u, v, w), T = o.stages[r], G = jl.findIndex((H) => H.id === r), k = [];
  return G > 0 && !o.stages[jl[G - 1].id].author && k.push("先核定 " + jl[G - 1].title), T.checks.every(Boolean) || k.push("完成本階段全部檢查"), T.evidence || k.push("填入實際產出或檢查報告位置"), (!T.summary || !T.nextStep) && k.push("填寫已做內容與接手下一步"), r === "M01" && (!o.sourceLocation || !o.sourceVersion || !o.backupLocation || !o.sha256) && k.push("補齊原檔版本、獨立備份與 SHA-256"), r === "M02" && !o.reference && k.push("補入設定及尺度來源"), G >= 3 && !o.candidateLocation && k.push("登記獨立候選 GLB"), zs(u).issues.some((H) => H.modelId === v && H.versionId === w && H.status === "open" && (H.stageId === r || G >= 6 || H.kind === "major" && G >= 3)) && k.push("處理適用的待修或待裁定問題"), k;
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
], Sm = [
  "唯一音軌",
  "音樂分析",
  "段落與節點",
  "鏡頭安排",
  "影格與動畫",
  "對音樂試剪",
  "支線驗收",
  "插入全片"
], zm = [
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
})), ...["op", "ed"].flatMap((u) => Sm.map((v, w) => ({
  id: u + String(w + 1).padStart(2, "0"),
  title: v,
  group: u,
  phase: u.toUpperCase() + " 支線",
  description: u === "op" ? "OP 以作品印象、人物關係及主題為主。" : "ED 以情緒收束及畫面變化為主。",
  output: v === "唯一音軌" ? "由作者在有效資料中指定音軌、版本與長度" : v,
  checks: zm[w],
  deps: w ? [u + String(w).padStart(2, "0")] : ["03"]
})))], Nm = [
  "script",
  "character",
  "scene",
  "voice",
  "op_audio",
  "ed_audio",
  "edit"
];
function ln(u) {
  return [...new Map(u.map((v) => [v.key, v])).values()];
}
function Zl(u) {
  return ln(u.filter((v) => v.status === "adopted" || v.status === "withdrawn")).filter((v) => v.status === "adopted");
}
function _m(u) {
  return {
    projectId: u.id,
    workId: u.workId,
    episode: u.episode,
    revision: u.revision,
    workflowSchema: u.workflowSchema ?? 1,
    genericChecks: Ns(u).map(({ id: v, title: w, checks: r }) => ({
      id: v,
      title: w,
      checks: r
    })),
    rules: ln(u.episodeRules ?? []),
    adoptedRules: Zl(u.episodeRules ?? []),
    baselines: ln(u.baselines ?? []),
    adoptedBaselines: Zl(u.baselines ?? []),
    legacy: u.workflowLegacy ?? null,
    rule: "通用流程不含單集劇情條件。本集規則與採用清單各自保存版本，候選不取代已採用版，另一集須另行指定；檔案位置未驗看。"
  };
}
function Em(u) {
  return {
    id: u.id,
    title: u.title,
    revision: u.revision,
    updatedAt: u.updatedAt,
    sharedCount: new Set(u.sharedAssets.map((v) => v.key)).size
  };
}
var fp = class extends Error {
  constructor(u, v = 400) {
    super(u), this.status = v;
  }
};
function Ns(u) {
  return Vt.filter((v) => v.group === "main" || u.branches[v.group]);
}
function ys(u, v) {
  const w = Vt.find((r) => r.id === v);
  if (!w) throw new fp("找不到階段");
  return w.deps.filter((r) => Ns(u).some((o) => o.id === r) && !u.stages[r].author).map((r) => `${r} ${Vt.find((o) => o.id === r)?.title}`);
}
function pp(u, v) {
  const w = u.stages[v], r = ys(u, v).map((T) => "先完成 " + T), o = Vt.find((T) => T.id === v).checks.length;
  return (w.checks.length < o || !w.checks.slice(0, o).every(Boolean)) && r.push("勾選全部驗收項目"), w.evidence.trim() || r.push("填入產出連結或檔案位置"), u.issues.some((T) => T.status === "open" && T.stageId === v) && r.push("處理此階段未結問題"), xa(u).problems.some((T) => T.status === "open" && (T.scope.type === "project" || T.scope.type === "stage" && T.scope.target === v || v === "12")) && r.push("處理適用範圍內的資訊矛盾或缺件"), v === "12" && (u.issues.some((T) => T.status === "open") && r.push("結清全部退修問題"), u.shots.some((T) => T.status !== "in_timeline") && r.push("總表中所有鏡頭須通過並入片"), u.shots.length || r.push("建立實際採用鏡頭與入片紀錄")), r;
}
function Wu(u) {
  const v = Ns(u);
  return {
    id: u.id,
    workId: u.workId ?? "",
    title: u.title,
    episode: u.episode,
    revision: u.revision,
    archived: u.archived,
    updatedAt: u.updatedAt,
    completionReport: u.production?.completionReports?.at(-1) ?? null,
    approved: v.filter((w) => u.stages[w.id].author).length,
    total: v.length,
    openIssues: u.issues.filter((w) => w.status === "open").length,
    shots: u.shots.length,
    inTimeline: u.shots.filter((w) => w.status === "in_timeline").length,
    lastMcpAt: u.lastMcpAt,
    next: v.filter((w) => !u.stages[w.id].author && !ys(u, w.id).length).map((w) => ({
      id: w.id,
      title: w.title,
      reasons: pp(u, w.id)
    }))
  };
}
function ed(u) {
  const v = xa(u), w = [...new Map((u.production?.links ?? []).map((o) => [o.shotId, o])).values()], r = [...new Map((u.production?.selections ?? []).map((o) => [o.shotId, o])).values()];
  return {
    project: Wu(u),
    settings: {
      rules: Zl(u.episodeRules ?? []).length,
      adopted: Zl(u.baselines ?? []).map(({ key: o, title: T, category: G, version: k, recordVersion: H, externalVersion: _ }) => ({
        key: o,
        title: T,
        category: G,
        version: k,
        recordVersion: H,
        externalVersion: _
      })),
      pending: ln(u.baselines ?? []).filter((o) => o.status === "unresolved" || o.status === "reference").map(({ key: o, title: T, status: G, note: k }) => ({
        key: o,
        title: T,
        status: G,
        note: k
      }))
    },
    registration: {
      sources: v.records.length,
      acceptedSources: v.records.filter(li).length,
      shots: u.shots.length,
      linkedShots: w.length,
      locatedFrames: w.filter((o) => o.references.length).length,
      registeredSelections: (/* @__PURE__ */ new Set([...r.map((o) => o.shotId), ...w.filter((o) => o.adoptedOutput).map((o) => o.shotId)])).size,
      timelineRegistrations: r.filter((o) => o.editorVersion && o.inPoint && o.outPoint).length
    },
    outgoing: u.production?.handoffs?.at(-1) ?? null,
    openProblems: v.problems.filter((o) => o.status === "open"),
    lastWork: v.results.at(-1) ?? null,
    rule: "作者告知的製作完成、資料補登與素材實際檢視分開記錄。未登記的素材不推定未製作；接續整理保留來源，未對上成片的情節不得自動套用下一集。"
  };
}
var Pn = {
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
}, Tm = [
  "rule",
  "script",
  "character",
  "scene",
  "audio",
  "reference"
];
function xa(u) {
  return u.knowledge ?? {
    records: [],
    problems: [],
    packs: [],
    results: []
  };
}
function li(u) {
  return u.approval?.verdict === "source_accepted" || u.status === "effective";
}
function Bu(u, v) {
  return (u.production?.sections.find((w) => w.stageId === v)?.gaps ?? []).map((w, r) => {
    const o = [...u.production?.supplements ?? []].reverse().find((T) => T.stageId === v && T.gapIndex === r && T.gap === w);
    return {
      index: r,
      description: w,
      status: o ? "filled" : "open",
      record: o ? xa(u).records.find((T) => T.id === o.recordId) ?? null : null
    };
  });
}
function Am(u, v) {
  if (u.workId && (!v || v.id !== u.workId) || v && v.id !== u.workId) throw new fp("集數與作品不相符", 400);
  const w = ed(u), r = v ? zs(v) : null, o = (r?.models ?? []).map((G) => {
    const k = G.versions.at(-1), H = [...r?.history ?? []].reverse().find((Z) => Z.modelId === G.id && Z.versionId === k.id && Z.action === "save_model_stage"), _ = jl.find((Z) => !k.stages[Z.id].author) ?? jl[7], E = G.versions.find((Z) => Z.id === G.adoptedVersionId);
    return {
      modelId: G.id,
      key: G.key,
      title: G.title,
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
      approved: jl.filter((Z) => k.stages[Z.id].author).length,
      lastWork: H ? {
        at: H.at,
        stageId: H.stageId,
        summary: k.stages[H.stageId].summary,
        evidence: k.stages[H.stageId].evidence,
        nextStep: k.stages[H.stageId].nextStep
      } : null,
      openIssues: r.issues.filter((Z) => Z.modelId === G.id && Z.versionId === k.id && Z.status === "open"),
      nextStep: H ? k.stages[H.stageId].nextStep : "尚無工作回報；先讀取模型來源與指定版本，再取得任務資料包。"
    };
  }), T = [...new Map((r?.pins ?? []).filter((G) => G.episodeId === u.id).map((G) => [[G.modelId, G.sceneIds].join("|"), G])).values()].map((G) => {
    const k = r.models.find((_) => _.id === G.modelId), H = k?.versions.find((_) => _.id === G.versionId);
    return {
      ...G,
      title: k?.title ?? G.modelId,
      label: H?.label ?? G.versionId
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
    episode: w,
    models: o,
    pins: T,
    issues: {
      animation: u.issues.filter((G) => G.status === "open"),
      context: w.openProblems,
      models: r?.issues.filter((G) => G.status === "open") ?? []
    },
    lastToolWrite: [u.lastMcpAt, ...(r?.history ?? []).filter((G) => G.actor === "ai").map((G) => G.at)].filter((G) => !!G).sort().at(-1) ?? null,
    policy: "此總覽唯讀，不是工作資料包。動畫與模型共用作品入口，各自保留精確版本與資料包。模型清單顯示最新登記候選，採用版及本集引用另列，禁止自動替換。作者告知完成不等於逐項素材驗看；未登記不推定未製作。執行前取得對應範圍的新資料包，實際讀取來源後才回報；不得代替作者核定。"
  };
}
var wm = /* @__PURE__ */ Pt(((u) => {
  var v = /* @__PURE__ */ Symbol.for("react.transitional.element"), w = /* @__PURE__ */ Symbol.for("react.fragment");
  function r(o, T, G) {
    var k = null;
    if (G !== void 0 && (k = "" + G), T.key !== void 0 && (k = "" + T.key), "key" in T) {
      G = {};
      for (var H in T) H !== "key" && (G[H] = T[H]);
    } else G = T;
    return T = G.ref, {
      $$typeof: v,
      type: o,
      key: k,
      ref: T !== void 0 ? T : null,
      props: G
    };
  }
  u.Fragment = w, u.jsx = r, u.jsxs = r;
})), Cm = /* @__PURE__ */ Pt(((u, v) => {
  v.exports = wm();
})), n = Cm(), ep = (u) => u ? new Date(u).toLocaleString("zh-TW", { timeZone: "Asia/Taipei" }) : "尚無紀錄";
function Om(u, v) {
  const w = URL.createObjectURL(new Blob([v], { type: "text/plain;charset=utf-8" })), r = document.createElement("a");
  r.href = w, r.download = u, r.click(), setTimeout(() => URL.revokeObjectURL(w), 1e3);
}
function Mm({ project: u, work: v, busy: w, onNavigate: r, onModel: o }) {
  const T = Am(u, v), [G, k] = (0, M.useState)(""), [H, _] = (0, M.useState)(""), [E, Z] = (0, M.useState)("animation"), B = T.models.find((q) => q.versionId === E), ne = T.episode.lastWork, ue = T.issues.animation.length + T.issues.context.length + T.issues.models.length, L = `請使用「立之雲端庫｜動畫製作流程」工具，接手 ${T.title}／${u.episode}。先呼叫 read_animation_workspace({projectId:${JSON.stringify(u.id)}})，重新讀取伺服器最新資料，不使用本段文字中的舊 revision。
${B ? `本次範圍為模型 ${B.key}（modelId=${B.modelId}），精確版本 ${B.label}（versionId=${B.versionId}），定位階段 ${B.stageId}。workId=${v.id}。用 read_animation_models 查此版本的全部來源、問題及最近回報，確認實際任務範圍後，用 acquire_animation_model_context 取得新資料包；完成後用 update_animation_model_stage 回報。最新候選不等於已採用版。` : `本次範圍為 ${u.episode} 動畫。先讀 read_animation_episode_brief 與 read_animation_episode_settings，再依最近交接確認任務。用 preview_animation_context 檢查指定範圍，acquire_animation_context 保存資料包，以 submit_animation_work 回報。作者已告知完成的集數以資料補登為主，不因紀錄空白重做。`}
實際讀取所需素材後才執行，缺件、矛盾或過期資料包先回報受阻。寫回已做內容、產出位置與版本、未解問題及下一步。保留原檔、作者採用版本與各集固定引用，不能自行正式核定。若目前對話沒有上述工具，明確告知尚未接通，不宣稱已讀取或已回寫。`, I = T.models.filter((q) => [
    q.key,
    q.title,
    q.label
  ].join(" ").toLowerCase().includes(H.toLowerCase()));
  return /* @__PURE__ */ (0, n.jsxs)("section", {
    className: "resume-board",
    children: [
      /* @__PURE__ */ (0, n.jsxs)("div", {
        className: "wide-card resume-start",
        children: [/* @__PURE__ */ (0, n.jsxs)("div", { children: [
          /* @__PURE__ */ (0, n.jsx)("div", {
            className: "eyebrow",
            children: "CONTINUE PRODUCTION"
          }),
          /* @__PURE__ */ (0, n.jsx)("h2", { children: "先確認脈絡，再接續工作" }),
          /* @__PURE__ */ (0, n.jsx)("p", { children: "一個作品，同時追蹤動畫與共用模型。下列內容來自已保存紀錄。" })
        ] }), /* @__PURE__ */ (0, n.jsxs)("div", {
          className: "resume-stats",
          children: [
            /* @__PURE__ */ (0, n.jsxs)("span", { children: [
              /* @__PURE__ */ (0, n.jsx)(Ku, { size: 17 }),
              T.models.length,
              " 個模型"
            ] }),
            /* @__PURE__ */ (0, n.jsxs)("span", { children: [
              /* @__PURE__ */ (0, n.jsx)(en, { size: 17 }),
              ue,
              " 項未結問題"
            ] }),
            /* @__PURE__ */ (0, n.jsxs)("span", { children: [
              /* @__PURE__ */ (0, n.jsx)(rp, { size: 17 }),
              "最近工具寫入：",
              ep(T.lastToolWrite)
            ] })
          ]
        })]
      }),
      /* @__PURE__ */ (0, n.jsxs)("div", {
        className: "resume-two",
        children: [/* @__PURE__ */ (0, n.jsxs)("article", {
          className: "wide-card resume-current",
          children: [
            /* @__PURE__ */ (0, n.jsxs)("div", {
              className: "section-title",
              children: [/* @__PURE__ */ (0, n.jsx)("h2", { children: "本集動畫接續" }), /* @__PURE__ */ (0, n.jsx)("span", {
                className: "status candidate",
                children: T.episode.project.completionReport?.status === "completed" ? "作者告知已完成" : "依實際紀錄接手"
              })]
            }),
            ne ? /* @__PURE__ */ (0, n.jsxs)(n.Fragment, { children: [
              /* @__PURE__ */ (0, n.jsx)("h3", { children: ne.task }),
              /* @__PURE__ */ (0, n.jsx)("p", {
                className: "resume-text",
                children: ne.summary
              }),
              ne.needsReview && /* @__PURE__ */ (0, n.jsxs)("p", {
                className: "resume-warning",
                children: ["採用依據已更新：", ne.reviewReason]
              }),
              /* @__PURE__ */ (0, n.jsxs)("div", {
                className: "resume-next",
                children: [/* @__PURE__ */ (0, n.jsx)("b", { children: "下一步" }), /* @__PURE__ */ (0, n.jsx)("p", { children: ne.nextStep })]
              }),
              /* @__PURE__ */ (0, n.jsxs)("small", { children: ["上次回報：", ep(ne.at)] })
            ] }) : /* @__PURE__ */ (0, n.jsxs)("div", {
              className: "resume-next",
              children: [/* @__PURE__ */ (0, n.jsx)("b", { children: "尚無 AI 工作回報" }), /* @__PURE__ */ (0, n.jsx)("p", { children: "先讀本集資料與採用設定，再確認接手範圍。紀錄空白不代表素材尚未製作。" })]
            }),
            /* @__PURE__ */ (0, n.jsxs)("button", {
              className: "btn",
              disabled: w,
              onClick: () => r("context"),
              children: ["開啟動畫資料與工作包 ", /* @__PURE__ */ (0, n.jsx)(ti, { size: 15 })]
            })
          ]
        }), /* @__PURE__ */ (0, n.jsxs)("article", {
          className: "wide-card resume-instruction",
          children: [
            /* @__PURE__ */ (0, n.jsx)("h2", { children: "把工作交給下一個 AI" }),
            /* @__PURE__ */ (0, n.jsx)("p", { children: "選定範圍，取得可直接貼進對話的接續指令。" }),
            /* @__PURE__ */ (0, n.jsxs)("label", {
              className: "form-field",
              children: ["本次接手範圍", /* @__PURE__ */ (0, n.jsxs)("select", {
                value: E,
                onChange: (q) => Z(q.target.value),
                children: [/* @__PURE__ */ (0, n.jsxs)("option", {
                  value: "animation",
                  children: [u.episode, " 動畫／資料補登"]
                }), T.models.map((q) => /* @__PURE__ */ (0, n.jsxs)("option", {
                  value: q.versionId,
                  children: [
                    q.title,
                    " · ",
                    q.label
                  ]
                }, q.versionId))]
              })]
            }),
            /* @__PURE__ */ (0, n.jsxs)("div", {
              className: "context-actions",
              children: [/* @__PURE__ */ (0, n.jsxs)("button", {
                className: "btn primary",
                onClick: async () => {
                  try {
                    await navigator.clipboard.writeText(L), k("接續指令已複製");
                  } catch {
                    k("無法直接複製，請下載指令或展開後手動複製。");
                  }
                },
                children: [/* @__PURE__ */ (0, n.jsx)($h, { size: 15 }), "複製接續指令"]
              }), /* @__PURE__ */ (0, n.jsxs)("button", {
                className: "btn",
                onClick: () => Om(u.episode + "_AI接續指令.txt", L),
                children: [/* @__PURE__ */ (0, n.jsx)(Ju, { size: 15 }), "下載指令"]
              })]
            }),
            /* @__PURE__ */ (0, n.jsx)("p", {
              role: "status",
              children: G
            }),
            /* @__PURE__ */ (0, n.jsxs)("details", { children: [/* @__PURE__ */ (0, n.jsx)("summary", { children: "檢視完整指令" }), /* @__PURE__ */ (0, n.jsx)("textarea", {
              readOnly: !0,
              "aria-label": "AI 接續指令",
              rows: 10,
              value: L
            })] }),
            /* @__PURE__ */ (0, n.jsx)("p", {
              className: "muted",
              children: "複製指令不會自動連接對話。需在對話選用工作台外掛；上方時間只表示歷史寫入，不表示 AI 正在執行。"
            })
          ]
        })]
      }),
      /* @__PURE__ */ (0, n.jsxs)("article", {
        className: "wide-card",
        children: [/* @__PURE__ */ (0, n.jsxs)("div", {
          className: "section-title",
          children: [/* @__PURE__ */ (0, n.jsxs)("div", { children: [/* @__PURE__ */ (0, n.jsx)("h2", { children: "模型接續清單" }), /* @__PURE__ */ (0, n.jsx)("p", { children: "顯示每個模型最新登記版本；作者採用版與本集引用獨立保存。" })] }), /* @__PURE__ */ (0, n.jsxs)("button", {
            className: "btn",
            disabled: w,
            onClick: () => r(v ? "models" : "project"),
            children: [
              v ? "管理模型與版本" : "整理為作品專案",
              " ",
              /* @__PURE__ */ (0, n.jsx)(ti, { size: 15 })
            ]
          })]
        }), T.models.length ? /* @__PURE__ */ (0, n.jsxs)(n.Fragment, { children: [
          /* @__PURE__ */ (0, n.jsxs)("label", {
            className: "work-search",
            children: ["搜尋模型", /* @__PURE__ */ (0, n.jsx)("input", {
              value: H,
              onChange: (q) => _(q.target.value),
              placeholder: "名稱、固定識別鍵或版本"
            })]
          }),
          /* @__PURE__ */ (0, n.jsx)("div", {
            className: "resume-models",
            children: I.map((q) => /* @__PURE__ */ (0, n.jsxs)("article", {
              className: "resume-model",
              children: [
                /* @__PURE__ */ (0, n.jsxs)("div", {
                  className: "issue-top",
                  children: [/* @__PURE__ */ (0, n.jsx)("b", { children: q.title }), /* @__PURE__ */ (0, n.jsx)("span", {
                    className: "status candidate",
                    children: q.label
                  })]
                }),
                /* @__PURE__ */ (0, n.jsxs)("small", { children: [
                  q.key,
                  " · ",
                  q.approved,
                  "/8 階段核定"
                ] }),
                /* @__PURE__ */ (0, n.jsxs)("p", { children: ["作者目前採用：", /* @__PURE__ */ (0, n.jsx)("b", { children: q.adopted?.label ?? "尚未登記" })] }),
                /* @__PURE__ */ (0, n.jsxs)("p", { children: [
                  "定位階段：",
                  q.stageId,
                  " ",
                  q.stageTitle
                ] }),
                q.lastWork ? /* @__PURE__ */ (0, n.jsxs)(n.Fragment, { children: [/* @__PURE__ */ (0, n.jsxs)("p", {
                  className: "resume-text",
                  children: ["最近已做：", q.lastWork.summary]
                }), /* @__PURE__ */ (0, n.jsx)("code", {
                  className: "context-id",
                  children: q.lastWork.evidence || "尚未登記產出位置"
                })] }) : /* @__PURE__ */ (0, n.jsx)("p", {
                  className: "muted",
                  children: "此版本尚無工作回報。"
                }),
                /* @__PURE__ */ (0, n.jsxs)("div", {
                  className: "resume-next",
                  children: [/* @__PURE__ */ (0, n.jsx)("b", { children: "接手下一步" }), /* @__PURE__ */ (0, n.jsx)("p", { children: q.nextStep })]
                }),
                q.openIssues.length > 0 && /* @__PURE__ */ (0, n.jsxs)("p", {
                  className: "resume-warning",
                  children: [
                    "此版本有 ",
                    q.openIssues.length,
                    " 項未結問題"
                  ]
                }),
                /* @__PURE__ */ (0, n.jsxs)("button", {
                  className: "btn",
                  disabled: w,
                  onClick: () => o({
                    modelId: q.modelId,
                    versionId: q.versionId,
                    stageId: q.stageId
                  }),
                  children: ["接續此精確版本 ", /* @__PURE__ */ (0, n.jsx)(ti, { size: 15 })]
                })
              ]
            }, q.modelId))
          }),
          !I.length && /* @__PURE__ */ (0, n.jsx)("p", { children: "沒有符合的模型。" })
        ] }) : /* @__PURE__ */ (0, n.jsx)("p", {
          className: "muted",
          children: "尚未登記模型來源。先在作品內登記既有 GLB、精確版本及參考資料，才會出現在此處。"
        })]
      }),
      /* @__PURE__ */ (0, n.jsxs)("div", {
        className: "resume-two",
        children: [/* @__PURE__ */ (0, n.jsxs)("article", {
          className: "wide-card",
          children: [/* @__PURE__ */ (0, n.jsx)("h2", { children: "未解問題集中檢視" }), ue === 0 ? /* @__PURE__ */ (0, n.jsx)("p", {
            className: "muted",
            children: "目前沒有登記未結問題；這不代表所有素材已檢驗。"
          }) : /* @__PURE__ */ (0, n.jsxs)("div", {
            className: "resume-problems",
            children: [
              T.issues.context.map((q) => /* @__PURE__ */ (0, n.jsxs)("button", {
                onClick: () => r("context"),
                children: [/* @__PURE__ */ (0, n.jsxs)("span", { children: ["資料矛盾／缺件 · ", q.scope.target || u.episode] }), /* @__PURE__ */ (0, n.jsx)("b", { children: q.description })]
              }, q.id)),
              T.issues.animation.map((q) => /* @__PURE__ */ (0, n.jsxs)("button", {
                onClick: () => r("issues"),
                children: [/* @__PURE__ */ (0, n.jsxs)("span", { children: [
                  "動畫 · ",
                  q.stageId,
                  " ",
                  q.shotId
                ] }), /* @__PURE__ */ (0, n.jsx)("b", { children: q.reason })]
              }, q.id)),
              T.issues.models.map((q) => {
                const K = v?.modelFlow?.models.find((W) => W.id === q.modelId), de = K?.versions.find((W) => W.id === q.versionId);
                return /* @__PURE__ */ (0, n.jsxs)("button", {
                  onClick: () => o({
                    modelId: q.modelId,
                    versionId: q.versionId,
                    stageId: q.stageId
                  }),
                  children: [/* @__PURE__ */ (0, n.jsxs)("span", { children: [
                    "模型 · ",
                    K?.title,
                    " · ",
                    de?.label,
                    " · ",
                    q.stageId
                  ] }), /* @__PURE__ */ (0, n.jsx)("b", { children: q.reason })]
                }, q.id);
              })
            ]
          })]
        }), /* @__PURE__ */ (0, n.jsxs)("article", {
          className: "wide-card",
          children: [
            /* @__PURE__ */ (0, n.jsxs)("h2", { children: [/* @__PURE__ */ (0, n.jsx)(ma, { size: 19 }), "本集固定模型引用"] }),
            T.pins.length ? T.pins.map((q, K) => /* @__PURE__ */ (0, n.jsxs)("div", {
              className: "context-mini",
              children: [/* @__PURE__ */ (0, n.jsxs)("b", { children: [
                q.title,
                " · ",
                q.label
              ] }), /* @__PURE__ */ (0, n.jsxs)("p", { children: [
                q.sceneIds || u.episode,
                " · ",
                q.purpose
              ] })]
            }, K)) : /* @__PURE__ */ (0, n.jsx)("p", {
              className: "muted",
              children: "尚未登記本集引用。新的模型候選不會自動替換本集版本。"
            }),
            /* @__PURE__ */ (0, n.jsxs)("button", {
              className: "btn",
              onClick: () => r("settings"),
              children: ["查看本集其他採用設定 ", /* @__PURE__ */ (0, n.jsx)(ti, { size: 15 })]
            })
          ]
        })]
      })
    ]
  });
}
var tp = {
  rule: "規則／決策",
  script: "劇本／台詞",
  character: "角色",
  scene: "場景",
  audio: "聲音",
  reference: "原作／參考"
};
function Dm({ project: u, busy: v, mutate: w }) {
  const [r, o] = (0, M.useState)(""), [T, G] = (0, M.useState)(""), [k, H] = (0, M.useState)(""), [_, E] = (0, M.useState)(30), [Z, B] = (0, M.useState)("main"), [ne, ue] = (0, M.useState)(null), [L, I] = (0, M.useState)(""), [q, K] = (0, M.useState)(""), [de, W] = (0, M.useState)({
    content: "",
    source: "",
    location: ""
  }), te = xa(u).records, F = u.production?.sections ?? [], fe = F.find((x) => x.stageId === r), ie = te.filter(li).length, J = Bu(u, r), b = F.reduce((x, Q) => x + Bu(u, Q.stageId).filter((Y) => Y.status === "open").length, 0), le = new Set(F.flatMap((x) => x.recordKeys)), be = te.filter((x) => (!r || fe?.recordKeys.includes(x.key) || x.scope.type === "stage" && x.scope.target === r) && (!k || x.kind === k) && (!T || [
    x.title,
    x.key,
    x.content,
    x.source,
    x.scope.target
  ].join(" ").toLowerCase().includes(T.toLowerCase()))).sort((x, Q) => (x.key.startsWith("ep01_src_") ? 1 : le.has(x.key) ? 0 : 2) - (Q.key.startsWith("ep01_src_") ? 1 : le.has(Q.key) ? 0 : 2));
  async function Te(x) {
    if (ue(null), I(""), !!x)
      try {
        if (x.size > 15e5) throw new Error("資料包不可超過 1.5 MB");
        const Q = JSON.parse(await x.text());
        if (Q.schemaVersion !== 1 || Q.episode !== u.episode || !Array.isArray(Q.records) || !Array.isArray(Q.shots) || !Array.isArray(Q.sections)) throw new Error("請選擇相同集數的製作資料包");
        ue(Q);
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
            records: te,
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
        /* @__PURE__ */ (0, n.jsxs)("b", { children: [te.length, " 筆資料"] }),
        /* @__PURE__ */ (0, n.jsxs)("b", { children: [u.shots.length, " 列鏡頭規劃"] }),
        /* @__PURE__ */ (0, n.jsxs)("b", { children: [F.length, " 個階段已盤點"] }),
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
        disabled: v || u.archived || !F.length,
        onClick: () => {
          w("accept_production_data", { note: "依作者2026-10-21指示：目前先不用檢核，已完成的資料直接通過；剩餘項目開放直接補齊。" });
        },
        children: "通過現有資料並開放補齊"
      })] })
    }),
    /* @__PURE__ */ (0, n.jsxs)("div", {
      className: "production-filters",
      children: [
        /* @__PURE__ */ (0, n.jsxs)("label", { children: ["搜尋實際內容", /* @__PURE__ */ (0, n.jsx)("input", {
          placeholder: "台詞、F077、G11、角色或素材名稱",
          value: T,
          onChange: (x) => {
            G(x.target.value), E(30);
          }
        })] }),
        /* @__PURE__ */ (0, n.jsxs)("label", { children: ["製作階段", /* @__PURE__ */ (0, n.jsxs)("select", {
          value: r,
          onChange: (x) => {
            o(x.target.value), E(30);
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
            H(x.target.value), E(30);
          },
          children: [/* @__PURE__ */ (0, n.jsx)("option", {
            value: "",
            children: "全部種類"
          }), Object.entries(tp).map(([x, Q]) => /* @__PURE__ */ (0, n.jsx)("option", {
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
        onClick: () => B(x),
        children: Q
      }, x))
    }),
    /* @__PURE__ */ (0, n.jsx)("div", {
      className: "production-grid",
      children: Vt.filter((x) => x.group === Z).map((x) => {
        const Q = F.find((O) => O.stageId === x.id), Y = Bu(u, x.id).filter((O) => O.status === "open").length;
        return /* @__PURE__ */ (0, n.jsxs)("button", {
          className: "production-stage " + (r === x.id ? "selected" : ""),
          onClick: () => {
            o(r === x.id ? "" : x.id), K(""), E(30);
          },
          children: [
            /* @__PURE__ */ (0, n.jsx)("small", { children: x.group === "main" ? x.id : x.group.toUpperCase() + " " + x.id.slice(2) }),
            /* @__PURE__ */ (0, n.jsx)("b", { children: x.title }),
            /* @__PURE__ */ (0, n.jsx)("span", { children: Q ? Q.recordKeys.length + " 筆相關資料" : "尚未盤點" }),
            /* @__PURE__ */ (0, n.jsx)("em", { children: Q ? Y + " 項待補" : "待補資料" })
          ]
        }, x.id);
      })
    }),
    fe && /* @__PURE__ */ (0, n.jsxs)("div", {
      className: "production-gaps",
      children: [
        /* @__PURE__ */ (0, n.jsxs)("h3", { children: [Vt.find((x) => x.id === r)?.title, " · 資料盤點"] }),
        /* @__PURE__ */ (0, n.jsx)("p", { children: fe.overview }),
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
            u.production?.supplementsOpen && (q === r + ":" + x.index ? /* @__PURE__ */ (0, n.jsxs)("form", {
              className: "context-form",
              onSubmit: async (Q) => {
                Q.preventDefault(), await w("supplement_production_data", {
                  stageId: r,
                  gapIndex: x.index,
                  ...de
                }) && (K(""), W({
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
                  value: de.content,
                  onChange: (Q) => W({
                    ...de,
                    content: Q.target.value
                  })
                })] }),
                /* @__PURE__ */ (0, n.jsxs)("label", { children: ["補件來源", /* @__PURE__ */ (0, n.jsx)("input", {
                  required: !0,
                  maxLength: 2e3,
                  value: de.source,
                  onChange: (Q) => W({
                    ...de,
                    source: Q.target.value
                  })
                })] }),
                /* @__PURE__ */ (0, n.jsxs)("label", { children: ["補件素材位置", /* @__PURE__ */ (0, n.jsx)("input", {
                  maxLength: 2e3,
                  value: de.location,
                  onChange: (Q) => W({
                    ...de,
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
                K(r + ":" + x.index), W({
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
              className: "status " + (li(x) ? "passed" : "candidate"),
              children: x.status === "effective" ? "採用版本" : x.status === "superseded" ? "已停用" : li(x) ? "資料已通過" : "來源資料／待確認"
            }),
            /* @__PURE__ */ (0, n.jsx)("b", { children: x.title }),
            /* @__PURE__ */ (0, n.jsxs)("small", { children: [
              tp[x.kind],
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
    !te.length && /* @__PURE__ */ (0, n.jsx)("p", {
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
        ne && /* @__PURE__ */ (0, n.jsxs)("div", {
          className: "inline-note",
          children: [
            /* @__PURE__ */ (0, n.jsx)("b", { children: String(ne.title) }),
            /* @__PURE__ */ (0, n.jsxs)("p", { children: [
              String(ne.episode),
              " · ",
              ne.records.length,
              " 筆來源資料 · ",
              ne.shots.length,
              " 列待製作鏡頭 · ",
              ne.sections.length,
              " 個階段盤點"
            ] }),
            /* @__PURE__ */ (0, n.jsx)("button", {
              className: "btn primary",
              disabled: v || u.archived,
              onClick: async () => {
                await w("import_production_data", ne) && (ue(null), o(""), G(""), H(""));
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
function km({ shotId: u, selection: v, disabled: w, mutate: r }) {
  const o = [
    ["output", "實際採用檔位置"],
    ["outputVersion", "採用檔版本"],
    ["reason", "選用原因"],
    ["source", "採用依據來源"],
    ["editorVersion", "剪輯工程版本"],
    ["inPoint", "工程入點"],
    ["outPoint", "工程出點"]
  ], [T, G] = (0, M.useState)(() => Object.fromEntries(o.map(([k]) => [k, v?.[k] ?? ""])));
  return /* @__PURE__ */ (0, n.jsxs)("details", {
    className: "selection-editor",
    children: [/* @__PURE__ */ (0, n.jsx)("summary", { children: "登記採用檔與工程位置" }), /* @__PURE__ */ (0, n.jsxs)("form", {
      className: "context-form",
      onSubmit: async (k) => {
        k.preventDefault(), await r("register_shot_selection", {
          ...T,
          shotId: u,
          baseVersion: v?.version ?? 0
        });
      },
      children: [
        o.map(([k, H]) => /* @__PURE__ */ (0, n.jsxs)("label", { children: [H, /* @__PURE__ */ (0, n.jsx)("input", {
          required: [
            "output",
            "outputVersion",
            "reason",
            "source"
          ].includes(k),
          maxLength: k === "reason" ? 3e3 : 2e3,
          value: T[k],
          onChange: (_) => G({
            ...T,
            [k]: _.target.value
          })
        })] }, k)),
        /* @__PURE__ */ (0, n.jsx)("p", {
          className: "muted",
          children: "工程入出點須成對填寫。保存來源與選用版本；素材實際開啟及檢視另行記錄。"
        }),
        /* @__PURE__ */ (0, n.jsx)("button", {
          className: "btn primary",
          disabled: w,
          children: "保存採用紀錄版本"
        })
      ]
    })]
  });
}
function Um({ project: u, busy: v, mutate: w }) {
  const [r, o] = (0, M.useState)(""), [T, G] = (0, M.useState)(""), [k, H] = (0, M.useState)(""), [_, E] = (0, M.useState)(20), Z = [...new Map((u.production?.selections ?? []).map((L) => [L.shotId, L])).values()], B = [...new Map((u.production?.links ?? []).map((L) => [L.shotId, L])).values()], ne = xa(u).records, ue = u.shots.filter((L) => [
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
          B.length,
          " / ",
          u.shots.length,
          " 列已建立關聯"
        ] }),
        /* @__PURE__ */ (0, n.jsxs)("b", { children: [B.filter((L) => L.references.length).length, " 列有影格來源定位"] }),
        /* @__PURE__ */ (0, n.jsxs)("b", { children: [(/* @__PURE__ */ new Set([...Z.map((L) => L.shotId), ...B.filter((L) => L.adoptedOutput).map((L) => L.shotId)])).size, " 列已登記採用檔"] })
      ]
    }),
    /* @__PURE__ */ (0, n.jsxs)("label", {
      className: "work-search",
      children: ["搜尋鏡頭關聯", /* @__PURE__ */ (0, n.jsx)("input", {
        value: r,
        onChange: (L) => {
          o(L.target.value), E(20);
        },
        placeholder: "F077、G11、S06 或鏡頭 ID"
      })]
    }),
    ue.slice(0, _).map((L) => {
      const I = B.find((K) => K.shotId === L.id), q = Z.find((K) => K.shotId === L.id);
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
                /* @__PURE__ */ (0, n.jsx)("p", { children: q ? "採用檔已登記；接著開啟素材並對照工程版本與入出點。" : I.nextStep }),
                /* @__PURE__ */ (0, n.jsxs)("p", { children: ["採用檔：", q?.output || I.adoptedOutput || "位置尚未登記"] }),
                /* @__PURE__ */ (0, n.jsxs)("p", { children: ["選用原因：", q?.reason || I.selectionReason || "尚未登記"] }),
                I.unknowns.length > 0 && /* @__PURE__ */ (0, n.jsx)("p", {
                  className: "muted",
                  children: "來源盤點時的缺口；新增採用登記另列於下方。"
                }),
                I.unknowns.length > 0 && /* @__PURE__ */ (0, n.jsx)("ul", { children: I.unknowns.map((K, de) => /* @__PURE__ */ (0, n.jsx)("li", { children: K }, de)) })
              ]
            }),
            q && /* @__PURE__ */ (0, n.jsxs)("div", {
              className: "context-mini",
              children: [
                /* @__PURE__ */ (0, n.jsxs)("b", { children: [
                  "採用登記 v",
                  q.version,
                  " · ",
                  q.outputVersion
                ] }),
                /* @__PURE__ */ (0, n.jsxs)("p", { children: ["依據：", q.source] }),
                /* @__PURE__ */ (0, n.jsxs)("p", { children: [
                  "工程：",
                  q.editorVersion || "未登記",
                  " · ",
                  q.inPoint || "未登記",
                  " → ",
                  q.outPoint || "未登記"
                ] })
              ]
            }),
            /* @__PURE__ */ (0, n.jsx)("h3", { children: "使用依據與提示詞" }),
            I.recordKeys.map((K) => {
              const de = ne.find((W) => W.key === K);
              return de ? /* @__PURE__ */ (0, n.jsxs)("details", {
                className: "context-mini",
                children: [
                  /* @__PURE__ */ (0, n.jsx)("summary", { children: de.title }),
                  /* @__PURE__ */ (0, n.jsxs)("code", { children: [
                    de.key,
                    " · v",
                    de.version
                  ] }),
                  /* @__PURE__ */ (0, n.jsx)("div", {
                    className: "production-source-text",
                    children: de.content
                  }),
                  /* @__PURE__ */ (0, n.jsxs)("p", { children: ["來源：", de.source] })
                ]
              }, K) : null;
            }),
            /* @__PURE__ */ (0, n.jsx)("h3", { children: "來源影格定位" }),
            I.references.length ? I.references.map((K, de) => /* @__PURE__ */ (0, n.jsxs)("div", {
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
            }, de)) : /* @__PURE__ */ (0, n.jsx)("p", { children: "目前來源未對上此影格。" }),
            /* @__PURE__ */ (0, n.jsx)("h3", { children: "剪輯對照候選" }),
            /* @__PURE__ */ (0, n.jsx)("p", {
              className: "muted",
              children: "以下時間來自指定來源表，尚未指定為本鏡實際入片位置。"
            }),
            I.timelineCandidates.map((K, de) => /* @__PURE__ */ (0, n.jsxs)("div", {
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
            }, de)),
            !I.timelineCandidates.length && /* @__PURE__ */ (0, n.jsx)("p", { children: "尚缺可核實的剪輯對照。" }),
            /* @__PURE__ */ (0, n.jsx)("h3", { children: "台詞與音檔對照候選" }),
            I.voiceCandidates.map((K, de) => /* @__PURE__ */ (0, n.jsxs)("div", {
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
            }, de)),
            !I.voiceCandidates.length && /* @__PURE__ */ (0, n.jsx)("p", { children: "尚未建立明確台詞對應，不依編號猜配。" })
          ] }) : /* @__PURE__ */ (0, n.jsx)("p", { children: "請補來源與實際輸出對應。" }),
          /* @__PURE__ */ (0, n.jsx)(km, {
            shotId: L.id,
            selection: q,
            disabled: v || u.archived,
            mutate: w
          }, q?.id ?? L.id)
        ]
      }, L.id);
    }),
    ue.length > _ && /* @__PURE__ */ (0, n.jsx)("button", {
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
          value: T,
          onChange: (L) => {
            G(L.target.value), H("");
          }
        })] }),
        k && /* @__PURE__ */ (0, n.jsx)("p", {
          role: "alert",
          children: k
        }),
        /* @__PURE__ */ (0, n.jsx)("button", {
          className: "btn primary",
          disabled: v || u.archived || !T.trim(),
          onClick: async () => {
            try {
              await w("save_production_links", JSON.parse(T)) && G("");
            } catch (L) {
              H(L instanceof Error ? L.message : "格式錯誤");
            }
          },
          children: "保存鏡頭製作關聯"
        })
      ]
    })
  ] });
}
var ei = {
  reference: "來源候選",
  adopted: "本集採用",
  withdrawn: "停止沿用",
  unresolved: "版本待補登"
}, lp = {
  script: "劇本",
  character: "角色",
  scene: "場景",
  voice: "聲線",
  op_audio: "OP音軌",
  ed_audio: "ED音軌",
  edit: "剪輯工程"
}, js = (u) => u.split(/[,，\n]/).map((v) => v.trim()).filter(Boolean), ap = {
  key: "",
  title: "",
  content: "",
  source: "",
  note: "",
  stageIdsText: "",
  sceneIdsText: "",
  status: "reference",
  baseVersion: 0
}, np = {
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
function hp({ project: u, busy: v, mutate: w }) {
  const [r, o] = (0, M.useState)(!1), [T, G] = (0, M.useState)(!1), [k, H] = (0, M.useState)(ap), [_, E] = (0, M.useState)(np), [Z, B] = (0, M.useState)(""), [ne, ue] = (0, M.useState)(""), [L, I] = (0, M.useState)(""), q = _m(u), K = v || u.archived, de = Zl(u.episodeRules ?? []), W = Zl(u.baselines ?? []), te = (b) => !Z || [b.key, b.title].join(" ").toLowerCase().includes(Z.toLowerCase());
  function F(b) {
    H({
      ...b,
      stageIdsText: b.stageIds.join(", "),
      sceneIdsText: b.sceneIds.join(", "),
      baseVersion: ln(u.episodeRules ?? []).find((le) => le.key === b.key).version
    }), o(!0);
  }
  function fe(b) {
    E({
      ...b,
      recordKey: b.snapshot?.key ?? "",
      recordVersion: b.recordVersion ?? 1,
      content: b.snapshot?.content ?? "",
      stageIdsText: b.stageIds.join(", "),
      sceneIdsText: b.sceneIds.join(", "),
      baseVersion: ln(u.baselines ?? []).find((le) => le.key === b.key).version
    }), G(!0);
  }
  async function ie(b, le) {
    await w("save_episode_rule", {
      ...b,
      status: le,
      baseVersion: q.rules.find((be) => be.key === b.key).version
    });
  }
  async function J(b, le) {
    await w("register_episode_baseline", {
      ...b,
      status: le,
      recordKey: b.snapshot?.key ?? "",
      recordVersion: b.recordVersion,
      content: b.snapshot?.content ?? "",
      baseVersion: q.baselines.find((be) => be.key === b.key).version
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
              /* @__PURE__ */ (0, n.jsxs)("b", { children: [de.length, " 項本集規則已採用"] }),
              /* @__PURE__ */ (0, n.jsxs)("b", { children: [W.length, " 項來源已採用"] }),
              /* @__PURE__ */ (0, n.jsxs)("span", { children: [q.baselines.filter((b) => b.status === "unresolved").length, " 項版本待補登"] })
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
              onChange: (b) => B(b.target.value),
              placeholder: "規則、角色、劇本、聲線或音軌"
            })]
          }),
          /* @__PURE__ */ (0, n.jsxs)("details", { children: [/* @__PURE__ */ (0, n.jsx)("summary", { children: "通用流程檢查項目" }), q.genericChecks.map((b) => /* @__PURE__ */ (0, n.jsxs)("div", {
            className: "context-mini",
            children: [/* @__PURE__ */ (0, n.jsxs)("b", { children: [
              b.id,
              " ",
              b.title
            ] }), /* @__PURE__ */ (0, n.jsx)("ul", { children: b.checks.map((le) => /* @__PURE__ */ (0, n.jsx)("li", { children: le }, le)) })]
          }, b.id))] }),
          u.workflowLegacy && /* @__PURE__ */ (0, n.jsxs)("details", { children: [
            /* @__PURE__ */ (0, n.jsx)("summary", { children: "保留的舊版檢查表紀錄" }),
            /* @__PURE__ */ (0, n.jsx)("p", { children: "舊版單集條件及勾選狀態保留在此；本集實際適用的規則另列於下方。" }),
            u.workflowLegacy.stages.map((b) => /* @__PURE__ */ (0, n.jsxs)("div", {
              className: "context-mini",
              children: [/* @__PURE__ */ (0, n.jsxs)("b", { children: ["舊階段 ", b.stageId] }), b.labels.map((le, be) => /* @__PURE__ */ (0, n.jsxs)("p", { children: [
                b.checks[be] ? "已勾選" : "未勾選",
                " · ",
                le
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
                H(ap), o(!r);
              },
              children: "新增本集規則"
            })]
          }),
          r && /* @__PURE__ */ (0, n.jsxs)("form", {
            className: "context-form",
            onSubmit: async (b) => {
              b.preventDefault(), await w("save_episode_rule", {
                ...k,
                stageIds: js(k.stageIdsText),
                sceneIds: js(k.sceneIdsText)
              }) && o(!1);
            },
            children: [
              /* @__PURE__ */ (0, n.jsxs)("div", {
                className: "context-form-grid",
                children: [/* @__PURE__ */ (0, n.jsxs)("label", { children: ["規則識別鍵", /* @__PURE__ */ (0, n.jsx)("input", {
                  required: !0,
                  readOnly: !!k.baseVersion,
                  maxLength: 100,
                  value: k.key,
                  onChange: (b) => H({
                    ...k,
                    key: b.target.value
                  })
                })] }), /* @__PURE__ */ (0, n.jsxs)("label", { children: ["規則名稱", /* @__PURE__ */ (0, n.jsx)("input", {
                  required: !0,
                  maxLength: 200,
                  value: k.title,
                  onChange: (b) => H({
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
                onChange: (b) => H({
                  ...k,
                  content: b.target.value
                })
              })] }),
              /* @__PURE__ */ (0, n.jsxs)("label", { children: ["規則來源", /* @__PURE__ */ (0, n.jsx)("input", {
                required: !0,
                maxLength: 2e3,
                value: k.source,
                onChange: (b) => H({
                  ...k,
                  source: b.target.value
                })
              })] }),
              /* @__PURE__ */ (0, n.jsxs)("div", {
                className: "context-form-grid",
                children: [/* @__PURE__ */ (0, n.jsxs)("label", { children: ["規則適用階段", /* @__PURE__ */ (0, n.jsx)("input", {
                  value: k.stageIdsText,
                  placeholder: "逗號分隔；留空為本集共用",
                  onChange: (b) => H({
                    ...k,
                    stageIdsText: b.target.value
                  })
                })] }), /* @__PURE__ */ (0, n.jsxs)("label", { children: ["規則適用場次", /* @__PURE__ */ (0, n.jsx)("input", {
                  value: k.sceneIdsText,
                  placeholder: "逗號分隔；留空為全部場次",
                  onChange: (b) => H({
                    ...k,
                    sceneIdsText: b.target.value
                  })
                })] })]
              }),
              /* @__PURE__ */ (0, n.jsxs)("label", { children: ["規則狀態", /* @__PURE__ */ (0, n.jsx)("select", {
                value: k.status,
                onChange: (b) => H({
                  ...k,
                  status: b.target.value
                }),
                children: Object.entries(ei).map(([b, le]) => /* @__PURE__ */ (0, n.jsx)("option", {
                  value: b,
                  children: le
                }, b))
              })] }),
              /* @__PURE__ */ (0, n.jsxs)("label", { children: ["規則備註", /* @__PURE__ */ (0, n.jsx)("textarea", {
                rows: 2,
                value: k.note,
                onChange: (b) => H({
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
          q.rules.filter(te).map((b) => {
            const le = de.find((be) => be.key === b.key);
            return /* @__PURE__ */ (0, n.jsxs)("details", {
              className: "production-record",
              children: [
                /* @__PURE__ */ (0, n.jsxs)("summary", { children: [/* @__PURE__ */ (0, n.jsx)("b", { children: b.title }), /* @__PURE__ */ (0, n.jsxs)("span", { children: [
                  ei[b.status],
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
                le && le.id !== b.id && /* @__PURE__ */ (0, n.jsxs)("div", {
                  className: "context-mini",
                  children: [
                    /* @__PURE__ */ (0, n.jsxs)("b", { children: ["仍沿用已採用 v", le.version] }),
                    /* @__PURE__ */ (0, n.jsx)("p", { children: le.content }),
                    /* @__PURE__ */ (0, n.jsxs)("small", { children: ["來源：", le.source] })
                  ]
                }),
                /* @__PURE__ */ (0, n.jsxs)("div", {
                  className: "context-actions",
                  children: [
                    /* @__PURE__ */ (0, n.jsx)("button", {
                      className: "btn",
                      disabled: K,
                      onClick: () => F(b),
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
                    le && /* @__PURE__ */ (0, n.jsx)("button", {
                      className: "btn",
                      disabled: K,
                      onClick: () => {
                        ie(le, "withdrawn");
                      },
                      children: "停止沿用規則"
                    })
                  ]
                })
              ]
            }, b.id);
          }),
          !q.rules.length && /* @__PURE__ */ (0, n.jsx)("p", { children: "本集尚未登記專用規則；不自動繼承前一集條件。" })
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
                E(np), G(!T);
              },
              children: "新增採用項目"
            })]
          }),
          T && /* @__PURE__ */ (0, n.jsxs)("form", {
            className: "context-form",
            onSubmit: async (b) => {
              b.preventDefault(), await w("register_episode_baseline", {
                ..._,
                stageIds: js(_.stageIdsText),
                sceneIds: js(_.sceneIdsText)
              }) && G(!1);
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
                    children: Nm.map((b) => /* @__PURE__ */ (0, n.jsx)("option", {
                      value: b,
                      children: lp[b]
                    }, b))
                  })] }),
                  /* @__PURE__ */ (0, n.jsxs)("label", { children: ["採用項目狀態", /* @__PURE__ */ (0, n.jsx)("select", {
                    value: _.status,
                    onChange: (b) => E({
                      ..._,
                      status: b.target.value
                    }),
                    children: Object.entries(ei).map(([b, le]) => /* @__PURE__ */ (0, n.jsx)("option", {
                      value: b,
                      children: le
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
          q.baselines.filter(te).map((b) => {
            const le = W.find((be) => be.key === b.key);
            return /* @__PURE__ */ (0, n.jsxs)("details", {
              className: "production-record",
              children: [
                /* @__PURE__ */ (0, n.jsxs)("summary", { children: [/* @__PURE__ */ (0, n.jsxs)("b", { children: [
                  lp[b.category],
                  "｜",
                  b.title
                ] }), /* @__PURE__ */ (0, n.jsxs)("span", { children: [
                  ei[b.status],
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
                le && le.id !== b.id && /* @__PURE__ */ (0, n.jsxs)("div", {
                  className: "context-mini",
                  children: [/* @__PURE__ */ (0, n.jsxs)("b", { children: [
                    "仍沿用已採用 v",
                    le.version,
                    "：",
                    le.title
                  ] }), /* @__PURE__ */ (0, n.jsxs)("p", { children: [
                    le.externalVersion || le.snapshot?.key,
                    " · ",
                    le.source
                  ] })]
                }),
                /* @__PURE__ */ (0, n.jsxs)("div", {
                  className: "context-actions",
                  children: [
                    /* @__PURE__ */ (0, n.jsx)("button", {
                      className: "btn",
                      disabled: K,
                      onClick: () => fe(b),
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
                    le && /* @__PURE__ */ (0, n.jsx)("button", {
                      className: "btn",
                      disabled: K,
                      onClick: () => {
                        J(le, "withdrawn");
                      },
                      children: "停止沿用此項目"
                    })
                  ]
                })
              ]
            }, b.id);
          }),
          !q.baselines.length && /* @__PURE__ */ (0, n.jsx)("p", { children: "尚未指定本集採用版本。共用來源可按需連結後再選用。" }),
          /* @__PURE__ */ (0, n.jsxs)("details", {
            className: "production-import",
            children: [
              /* @__PURE__ */ (0, n.jsx)("summary", { children: "批次補登本集設定" }),
              /* @__PURE__ */ (0, n.jsx)("p", { children: "包含 rules 與 baselines 清單；保留版本及來源，採用與候選分開。" }),
              /* @__PURE__ */ (0, n.jsxs)("label", { children: ["本集設定 JSON", /* @__PURE__ */ (0, n.jsx)("textarea", {
                rows: 5,
                value: ne,
                onChange: (b) => {
                  ue(b.target.value), I("");
                }
              })] }),
              L && /* @__PURE__ */ (0, n.jsx)("p", {
                role: "alert",
                children: L
              }),
              /* @__PURE__ */ (0, n.jsx)("button", {
                className: "btn primary",
                disabled: K || !ne.trim(),
                onClick: async () => {
                  try {
                    await w("import_episode_settings", JSON.parse(ne)) && ue("");
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
            ei[b.status],
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
}, ip = {
  original: "原文明示",
  adaptation: "動畫改編",
  author_decision: "作者決定",
  ai_proposal: "AI 建議"
}, Fu = {
  project: "本集共用",
  stage: "指定階段",
  scene: "指定場次",
  shot: "指定鏡頭"
}, Yu = (u) => Fu[u.type] + (u.target ? " · " + u.target : ""), Gu = {
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
  const w = URL.createObjectURL(new Blob([JSON.stringify(v, null, 2)], { type: "application/json" })), r = document.createElement("a");
  r.href = w, r.download = u, r.click(), setTimeout(() => URL.revokeObjectURL(w), 1e3);
}
function qm({ project: u, mutate: v, busy: w }) {
  const r = xa(u), [o, T] = (0, M.useState)("materials"), [G, k] = (0, M.useState)(!1), [H, _] = (0, M.useState)(Gu), [E, Z] = (0, M.useState)(!1), [B, ne] = (0, M.useState)({
    type: "conflict",
    scopeType: "project",
    target: "",
    description: ""
  }), [ue, L] = (0, M.useState)("production"), [I, q] = (0, M.useState)(""), [K, de] = (0, M.useState)(""), [W, te] = (0, M.useState)(""), [F, fe] = (0, M.useState)(""), [ie, J] = (0, M.useState)(""), [b, le] = (0, M.useState)(""), [be, Te] = (0, M.useState)(""), [x, Q] = (0, M.useState)(""), [Y, O] = (0, M.useState)(""), [V, je] = (0, M.useState)(""), [Ee, Ie] = (0, M.useState)(""), [m, U] = (0, M.useState)(""), [X, $] = (0, M.useState)(""), [re, me] = (0, M.useState)({}), he = r.packs.find((h) => h.id === x) ?? r.packs.at(-1), Me = r.records.filter((h) => h.status === "effective"), xe = r.records.filter((h) => h.status === "proposed" && !li(h)), Ze = r.problems.filter((h) => h.status === "open"), pt = [
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
      Zl(u.baselines ?? []).length
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
  ], De = w || u.archived;
  async function yl(h) {
    h.preventDefault(), await v("propose_record", {
      ...H,
      scope: {
        type: H.scopeType,
        target: H.target
      }
    }) && (k(!1), _(Gu), T("proposals"));
  }
  function st(h) {
    const P = r.records.find((Ae) => Ae.id === h);
    _({
      key: P.key,
      title: P.title,
      kind: P.kind,
      origin: "author_decision",
      content: P.content,
      source: "",
      location: P.location,
      scopeType: P.scope.type,
      target: P.scope.target,
      supersedesId: P.id
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
        children: h.blockers.map((P, Ae) => /* @__PURE__ */ (0, n.jsx)("p", { children: P.replace(/缺少有效資料種類：(\w+)/g, (Xt, N) => "缺少有效資料種類：" + (Lu[N] || N)) }, Ae))
      }),
      /* @__PURE__ */ (0, n.jsx)("h3", { children: h.purpose === "documentation" ? "本次指定來源（整理用途）" : "本次有效依據" }),
      h.records.length ? h.records.map((P) => /* @__PURE__ */ (0, n.jsxs)("article", {
        className: "context-mini",
        children: [
          /* @__PURE__ */ (0, n.jsxs)("b", { children: [
            P.title,
            " · v",
            P.version
          ] }),
          /* @__PURE__ */ (0, n.jsxs)("small", { children: [
            P.key,
            " · ",
            Yu(P.scope)
          ] }),
          /* @__PURE__ */ (0, n.jsx)("p", { children: P.content }),
          /* @__PURE__ */ (0, n.jsxs)("small", { children: ["來源：", P.source] }),
          /* @__PURE__ */ (0, n.jsxs)("small", { children: ["素材位置：", P.location || "內容已記錄；未登記外部檔案"] })
        ]
      }, P.id)) : /* @__PURE__ */ (0, n.jsx)("p", {
        className: "muted",
        children: "尚無有效資料，AI 應回報受阻。"
      }),
      /* @__PURE__ */ (0, n.jsxs)("details", { children: [/* @__PURE__ */ (0, n.jsxs)("summary", { children: [
        "禁止混用的版本／待確認提案（",
        h.excluded.length,
        "）"
      ] }), h.excluded.map((P) => /* @__PURE__ */ (0, n.jsxs)("p", { children: [
        P.title,
        " · ",
        P.status,
        " · ",
        P.id
      ] }, P.id))] }),
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
      /* @__PURE__ */ (0, n.jsxs)("div", {
        className: "wide-card context-intro",
        children: [
          /* @__PURE__ */ (0, n.jsx)("div", {
            className: "eyebrow",
            children: "AI PRODUCTION CONTEXT · v4.2"
          }),
          /* @__PURE__ */ (0, n.jsx)("h2", { children: "讓每個製作環節，都有可查用的資料。" }),
          /* @__PURE__ */ (0, n.jsx)("p", { children: "依階段查找原作、劇本、角色場景、分鏡、提示詞與聲音剪輯資料。來源版本與缺件清楚標示，已通過的來源可直接補充；製作時依指定採用版本取得工作資料包。" }),
          /* @__PURE__ */ (0, n.jsxs)("div", {
            className: "context-flow",
            children: [
              /* @__PURE__ */ (0, n.jsx)("span", { children: "資料收錄通過" }),
              /* @__PURE__ */ (0, n.jsx)("span", { children: "取得工作資料包" }),
              /* @__PURE__ */ (0, n.jsx)("span", { children: "實際讀取素材" }),
              /* @__PURE__ */ (0, n.jsx)("span", { children: "回報工作與接續" })
            ]
          }),
          /* @__PURE__ */ (0, n.jsx)("div", {
            className: "inline-note",
            children: "資料收錄與採用版本分開；舊稿、替代候選與正式素材保留各自來源，避免混用。"
          })
        ]
      }),
      /* @__PURE__ */ (0, n.jsx)("div", {
        className: "context-tabs",
        role: "tablist",
        "aria-label": "AI 工作中心",
        children: pt.map(([h, P, Ae]) => /* @__PURE__ */ (0, n.jsxs)("button", {
          role: "tab",
          "aria-selected": o === h,
          className: o === h ? "active" : "",
          onClick: () => T(h),
          children: [P, /* @__PURE__ */ (0, n.jsx)("span", { children: Ae })]
        }, h))
      }),
      /* @__PURE__ */ (0, n.jsx)("div", {
        className: o === "settings" ? "" : "wide-card",
        children: o === "settings" ? /* @__PURE__ */ (0, n.jsx)(hp, {
          project: u,
          busy: w,
          mutate: v
        }) : o === "links" ? /* @__PURE__ */ (0, n.jsx)(Um, {
          project: u,
          busy: w,
          mutate: v
        }) : o === "materials" ? /* @__PURE__ */ (0, n.jsx)(Dm, {
          project: u,
          busy: w,
          mutate: v
        }) : ["baseline", "proposals"].includes(o) ? /* @__PURE__ */ (0, n.jsxs)(n.Fragment, { children: [
          /* @__PURE__ */ (0, n.jsxs)("div", {
            className: "section-title",
            children: [/* @__PURE__ */ (0, n.jsxs)("div", { children: [/* @__PURE__ */ (0, n.jsx)("h2", { children: o === "baseline" ? "目前有效資料" : "待作者確認的提案" }), /* @__PURE__ */ (0, n.jsx)("p", { children: "識別鍵固定，修改建立新版本；來源與適用範圍必填。" })] }), /* @__PURE__ */ (0, n.jsx)("button", {
              className: "btn primary",
              disabled: De,
              onClick: () => {
                _(Gu), k(!G);
              },
              children: "新增資料提案"
            })]
          }),
          G && /* @__PURE__ */ (0, n.jsxs)("form", {
            className: "context-form",
            onSubmit: yl,
            children: [
              /* @__PURE__ */ (0, n.jsxs)("div", {
                className: "context-form-grid",
                children: [
                  /* @__PURE__ */ (0, n.jsxs)("label", { children: ["固定識別鍵", /* @__PURE__ */ (0, n.jsx)("input", {
                    required: !0,
                    maxLength: 120,
                    placeholder: "例如 mother_position 或 script_main",
                    value: H.key,
                    readOnly: !!H.supersedesId,
                    onChange: (h) => _({
                      ...H,
                      key: h.target.value
                    })
                  })] }),
                  /* @__PURE__ */ (0, n.jsxs)("label", { children: ["資料名稱", /* @__PURE__ */ (0, n.jsx)("input", {
                    required: !0,
                    maxLength: 200,
                    value: H.title,
                    onChange: (h) => _({
                      ...H,
                      title: h.target.value
                    })
                  })] }),
                  /* @__PURE__ */ (0, n.jsxs)("label", { children: ["資料種類", /* @__PURE__ */ (0, n.jsx)("select", {
                    value: H.kind,
                    onChange: (h) => _({
                      ...H,
                      kind: h.target.value
                    }),
                    children: Tm.map((h) => /* @__PURE__ */ (0, n.jsx)("option", {
                      value: h,
                      children: Lu[h]
                    }, h))
                  })] }),
                  /* @__PURE__ */ (0, n.jsxs)("label", { children: ["內容性質", /* @__PURE__ */ (0, n.jsx)("select", {
                    value: H.origin,
                    onChange: (h) => _({
                      ...H,
                      origin: h.target.value
                    }),
                    children: Object.entries(ip).map(([h, P]) => /* @__PURE__ */ (0, n.jsx)("option", {
                      value: h,
                      children: P
                    }, h))
                  })] }),
                  /* @__PURE__ */ (0, n.jsxs)("label", { children: ["適用範圍", /* @__PURE__ */ (0, n.jsx)("select", {
                    value: H.scopeType,
                    disabled: !!H.supersedesId,
                    onChange: (h) => _({
                      ...H,
                      scopeType: h.target.value,
                      target: ""
                    }),
                    children: Object.entries(Fu).map(([h, P]) => /* @__PURE__ */ (0, n.jsx)("option", {
                      value: h,
                      children: P
                    }, h))
                  })] }),
                  /* @__PURE__ */ (0, n.jsxs)("label", { children: ["範圍 ID", /* @__PURE__ */ (0, n.jsx)("input", {
                    required: H.scopeType !== "project",
                    disabled: H.scopeType === "project" || !!H.supersedesId,
                    placeholder: "例如 S06、01 或鏡頭 ID",
                    value: H.target,
                    onChange: (h) => _({
                      ...H,
                      target: h.target.value
                    })
                  })] })
                ]
              }),
              /* @__PURE__ */ (0, n.jsxs)("label", { children: ["內容", /* @__PURE__ */ (0, n.jsx)("textarea", {
                required: !0,
                rows: 5,
                maxLength: 12e3,
                value: H.content,
                onChange: (h) => _({
                  ...H,
                  content: h.target.value
                })
              })] }),
              /* @__PURE__ */ (0, n.jsxs)("label", { children: ["來源依據", /* @__PURE__ */ (0, n.jsx)("input", {
                required: !0,
                maxLength: 2e3,
                placeholder: "原作章節、作者修改要求、檔案名稱與段落等",
                value: H.source,
                onChange: (h) => _({
                  ...H,
                  source: h.target.value
                })
              })] }),
              /* @__PURE__ */ (0, n.jsxs)("label", { children: ["素材位置（選填）", /* @__PURE__ */ (0, n.jsx)("input", {
                maxLength: 2e3,
                placeholder: "可取得的檔案位置或連結；填入不等於已讀取",
                value: H.location,
                onChange: (h) => _({
                  ...H,
                  location: h.target.value
                })
              })] }),
              H.supersedesId && /* @__PURE__ */ (0, n.jsxs)("p", {
                className: "muted",
                children: [
                  "明確取代：",
                  H.supersedesId,
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
                  disabled: De,
                  children: "保存為待確認提案"
                })]
              })
            ]
          }),
          /* @__PURE__ */ (0, n.jsx)("div", {
            className: "context-records",
            children: (o === "baseline" ? Me : xe).map((h) => /* @__PURE__ */ (0, n.jsxs)("article", {
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
                  ip[h.origin],
                  " ／ ",
                  Yu(h.scope)
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
                    disabled: De,
                    onClick: () => {
                      v("activate_record", { recordId: h.id });
                    },
                    children: "作者確認為有效資料"
                  }) : /* @__PURE__ */ (0, n.jsx)("button", {
                    className: "btn",
                    disabled: De,
                    onClick: () => st(h.id),
                    children: "提出修改版本"
                  })
                })
              ]
            }, h.id))
          }),
          !(o === "baseline" ? Me : xe).length && !G && /* @__PURE__ */ (0, n.jsxs)("div", {
            className: "empty",
            children: [/* @__PURE__ */ (0, n.jsx)("h3", { children: o === "baseline" ? "尚無有效資料" : "目前沒有待確認提案" }), /* @__PURE__ */ (0, n.jsx)("p", { children: "先登記來源、內容與範圍，再由作者確認。" })]
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
        ] }) : o === "problems" ? /* @__PURE__ */ (0, n.jsxs)(n.Fragment, { children: [
          /* @__PURE__ */ (0, n.jsxs)("div", {
            className: "section-title",
            children: [/* @__PURE__ */ (0, n.jsxs)("div", { children: [/* @__PURE__ */ (0, n.jsx)("h2", { children: "矛盾、缺件與待裁定事項" }), /* @__PURE__ */ (0, n.jsx)("p", { children: "相關任務在問題處理前回報受阻，AI 不自行裁定。" })] }), /* @__PURE__ */ (0, n.jsx)("button", {
              className: "btn",
              disabled: De,
              onClick: () => Z(!E),
              children: "登記矛盾或缺件"
            })]
          }),
          E && /* @__PURE__ */ (0, n.jsxs)("form", {
            className: "context-form",
            onSubmit: async (h) => {
              h.preventDefault(), await v("add_knowledge_problem", {
                type: B.type,
                scope: {
                  type: B.scopeType,
                  target: B.target
                },
                description: B.description,
                recordIds: []
              }) && (Z(!1), ne({
                ...B,
                description: ""
              }));
            },
            children: [
              /* @__PURE__ */ (0, n.jsxs)("div", {
                className: "context-form-grid",
                children: [
                  /* @__PURE__ */ (0, n.jsxs)("label", { children: ["問題種類", /* @__PURE__ */ (0, n.jsxs)("select", {
                    value: B.type,
                    onChange: (h) => ne({
                      ...B,
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
                    value: B.scopeType,
                    onChange: (h) => ne({
                      ...B,
                      scopeType: h.target.value,
                      target: ""
                    }),
                    children: Object.entries(Fu).map(([h, P]) => /* @__PURE__ */ (0, n.jsx)("option", {
                      value: h,
                      children: P
                    }, h))
                  })] }),
                  /* @__PURE__ */ (0, n.jsxs)("label", { children: ["範圍 ID", /* @__PURE__ */ (0, n.jsx)("input", {
                    required: B.scopeType !== "project",
                    disabled: B.scopeType === "project",
                    value: B.target,
                    onChange: (h) => ne({
                      ...B,
                      target: h.target.value
                    })
                  })] })
                ]
              }),
              /* @__PURE__ */ (0, n.jsxs)("label", { children: ["問題與缺少的依據", /* @__PURE__ */ (0, n.jsx)("textarea", {
                required: !0,
                rows: 4,
                value: B.description,
                onChange: (h) => ne({
                  ...B,
                  description: h.target.value
                })
              })] }),
              /* @__PURE__ */ (0, n.jsx)("button", {
                className: "btn primary",
                disabled: De,
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
                }), /* @__PURE__ */ (0, n.jsx)("small", { children: Yu(h.scope) })]
              }),
              /* @__PURE__ */ (0, n.jsx)("p", { children: h.description }),
              h.resolution && /* @__PURE__ */ (0, n.jsxs)("p", { children: ["處理結果：", h.resolution] }),
              h.status === "open" && (b === h.id ? /* @__PURE__ */ (0, n.jsxs)("form", {
                onSubmit: async (P) => {
                  P.preventDefault(), await v("resolve_knowledge_problem", {
                    problemId: h.id,
                    resolution: be
                  }) && (le(""), Te(""));
                },
                children: [
                  /* @__PURE__ */ (0, n.jsxs)("label", {
                    className: "form-field",
                    children: ["作者裁定／補件結果", /* @__PURE__ */ (0, n.jsx)("textarea", {
                      required: !0,
                      rows: 3,
                      value: be,
                      onChange: (P) => Te(P.target.value)
                    })]
                  }),
                  /* @__PURE__ */ (0, n.jsx)("p", {
                    className: "muted",
                    children: "若涉及設定變更，請另外確認新資料版本；問題結案不會自動修改有效資料。"
                  }),
                  /* @__PURE__ */ (0, n.jsx)("button", {
                    className: "btn primary",
                    disabled: De,
                    children: "作者確認處理完成"
                  })
                ]
              }) : /* @__PURE__ */ (0, n.jsx)("button", {
                className: "btn",
                disabled: De,
                onClick: () => {
                  le(h.id), Te("");
                },
                children: "填寫作者處理結果"
              }))
            ]
          }, h.id)),
          !r.problems.length && /* @__PURE__ */ (0, n.jsx)("p", {
            className: "muted",
            children: "目前沒有登記矛盾或缺件。資料包仍會檢查必要資料種類。"
          })
        ] }) : o === "packet" ? /* @__PURE__ */ (0, n.jsxs)(n.Fragment, { children: [
          /* @__PURE__ */ (0, n.jsx)("div", {
            className: "section-title",
            children: /* @__PURE__ */ (0, n.jsxs)("div", { children: [/* @__PURE__ */ (0, n.jsx)("h2", { children: "指定任務的工作資料包" }), /* @__PURE__ */ (0, n.jsx)("p", { children: "保存當下版本；任何更新後均需重新取得，避免沿用舊依據。" })] })
          }),
          /* @__PURE__ */ (0, n.jsxs)("form", {
            className: "context-form",
            onSubmit: async (h) => {
              h.preventDefault();
              const P = await v("create_context_pack", {
                task: K,
                stageId: W,
                sceneId: F,
                shotId: ie,
                purpose: ue,
                recordKeys: ue === "documentation" ? I.split(/[,，\n]/).map((Ae) => Ae.trim()).filter(Boolean) : void 0
              });
              P && Q(xa(P).packs.at(-1).id);
            },
            children: [
              /* @__PURE__ */ (0, n.jsxs)("label", { children: ["工作用途", /* @__PURE__ */ (0, n.jsxs)("select", {
                value: ue,
                onChange: (h) => L(h.target.value),
                children: [/* @__PURE__ */ (0, n.jsx)("option", {
                  value: "production",
                  children: "素材製作／檢視"
                }), /* @__PURE__ */ (0, n.jsx)("option", {
                  value: "documentation",
                  children: "資料整理／補登"
                })]
              })] }),
              ue === "documentation" && /* @__PURE__ */ (0, n.jsxs)("label", { children: ["本次來源識別鍵", /* @__PURE__ */ (0, n.jsx)("textarea", {
                required: !0,
                rows: 2,
                value: I,
                onChange: (h) => q(h.target.value),
                placeholder: "以逗號分隔，最多20筆；可從製作資料或鏡頭關聯取得"
              })] }),
              /* @__PURE__ */ (0, n.jsxs)("label", { children: ["本次任務", /* @__PURE__ */ (0, n.jsx)("textarea", {
                required: !0,
                rows: 2,
                maxLength: 2e3,
                placeholder: "例如：檢查 S06 指定鏡頭的母親座位與場景一致性",
                value: K,
                onChange: (h) => de(h.target.value)
              })] }),
              /* @__PURE__ */ (0, n.jsxs)("div", {
                className: "context-form-grid",
                children: [
                  /* @__PURE__ */ (0, n.jsxs)("label", { children: ["階段 ID（選填）", /* @__PURE__ */ (0, n.jsx)("input", {
                    placeholder: "例如 08、op01",
                    value: W,
                    onChange: (h) => te(h.target.value)
                  })] }),
                  /* @__PURE__ */ (0, n.jsxs)("label", { children: ["場次 ID（選填）", /* @__PURE__ */ (0, n.jsx)("input", {
                    placeholder: "例如 S06",
                    value: F,
                    onChange: (h) => fe(h.target.value)
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
                disabled: De,
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
                summary: Y,
                nextStep: V,
                recordIds: he.records.map((P) => P.id),
                observations: he.records.map((P) => ({
                  recordId: P.id,
                  version: P.version,
                  note: re[P.id] ?? ""
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
                value: Y,
                onChange: (h) => O(h.target.value)
              })] }),
              /* @__PURE__ */ (0, n.jsxs)("label", { children: ["下一位 AI 接手動作", /* @__PURE__ */ (0, n.jsx)("textarea", {
                required: !0,
                rows: 3,
                value: V,
                onChange: (h) => je(h.target.value)
              })] }),
              he.records.map((h) => /* @__PURE__ */ (0, n.jsxs)("label", { children: [
                "實際閱讀依據｜",
                h.title,
                /* @__PURE__ */ (0, n.jsx)("textarea", {
                  required: !0,
                  rows: 2,
                  maxLength: 3e3,
                  value: re[h.id] ?? "",
                  onChange: (P) => me({
                    ...re,
                    [h.id]: P.target.value
                  })
                })
              ] }, h.id)),
              /* @__PURE__ */ (0, n.jsxs)("label", { children: ["整理成果位置", /* @__PURE__ */ (0, n.jsx)("input", {
                required: !0,
                maxLength: 2e3,
                value: Ee,
                onChange: (h) => Ie(h.target.value)
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
                disabled: De,
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
                  children: h.needsReview ? r.packs.find((P) => P.id === h.packId)?.purpose === "documentation" ? "採用設定已更新，接手前讀取新版本" : "依據已變更，需重驗" : h.status === "completed" ? r.packs.find((P) => P.id === h.packId)?.purpose === "documentation" ? "資料整理完成" : "AI 回報完成，待作者驗收" : h.status === "partial" ? "部分完成" : "受阻"
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
              h.artifacts.map((P, Ae) => /* @__PURE__ */ (0, n.jsxs)("p", { children: [
                P.description,
                " · ",
                P.version,
                /* @__PURE__ */ (0, n.jsx)("code", {
                  className: "context-id",
                  children: P.location
                })
              ] }, Ae)),
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
var mp = [
  ["coverage", "原作與改編範圍"],
  ["endingState", "本集結尾狀態"],
  ["characters", "人物狀態與關係"],
  ["revealed", "已揭露資訊與邊界"],
  ["unresolved", "尚未確定的內容"],
  ["carryRules", "後續集數沿用規則"],
  ["nextSteps", "下一步與接手順序"],
  ["sources", "來源與版本說明"]
], sp = {
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
      mp.map(([w, r]) => /* @__PURE__ */ (0, n.jsxs)("div", {
        className: "context-mini",
        children: [/* @__PURE__ */ (0, n.jsx)("b", { children: r }), /* @__PURE__ */ (0, n.jsx)("p", {
          className: "production-source-text",
          children: u[w]
        })]
      }, w)),
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
function Bm({ project: u, episodes: v, busy: w, mutate: r }) {
  const o = u.production?.completionReports?.at(-1), T = u.production?.handoffs?.at(-1), G = v.filter((J) => J.workId === u.workId && J.id !== u.id), [k, H] = (0, M.useState)("completed"), [_, E] = (0, M.useState)(""), [Z, B] = (0, M.useState)(""), [ne, ue] = (0, M.useState)(""), [L, I] = (0, M.useState)(sp), [q, K] = (0, M.useState)(""), [de, W] = (0, M.useState)([]), [te, F] = (0, M.useState)("");
  (0, M.useEffect)(() => {
    H(o?.status ?? "completed"), E(o?.note ?? ""), B(o?.source ?? ""), ue(T?.toEpisodeId ?? ""), I(T ?? sp), K(T?.sourceKeys.join(", ") ?? "");
  }, [
    u.id,
    o?.at,
    T?.id
  ]), (0, M.useEffect)(() => {
    let J = !0;
    return W([]), fetch("/api/projects?id=" + encodeURIComponent(u.id) + "&view=brief", { cache: "no-store" }).then(async (b) => {
      const le = await b.json();
      if (!b.ok) throw new Error(le.error ?? "接續資料讀取失敗");
      J && (W(le.incoming), F(""));
    }).catch((b) => {
      J && F(b.message);
    }), () => {
      J = !1;
    };
  }, [u.id, u.revision]);
  const fe = ed(u).registration, ie = w || u.archived;
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
          /* @__PURE__ */ (0, n.jsx)("b", { children: o ? Hm[o.status] : "製作狀態尚未登記" }),
          /* @__PURE__ */ (0, n.jsxs)("span", { children: [
            fe.acceptedSources,
            " / ",
            fe.sources,
            " 筆來源已收錄"
          ] }),
          /* @__PURE__ */ (0, n.jsxs)("span", { children: [
            fe.linkedShots,
            " / ",
            fe.shots,
            " 列鏡頭有關聯"
          ] }),
          /* @__PURE__ */ (0, n.jsxs)("span", { children: [fe.registeredSelections, " 列已登記採用檔"] })
        ]
      }),
      o && /* @__PURE__ */ (0, n.jsxs)(n.Fragment, { children: [/* @__PURE__ */ (0, n.jsx)("p", { children: o.note }), /* @__PURE__ */ (0, n.jsxs)("small", { children: ["作者告知依據：", o.source] })] }),
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
            onChange: (J) => H(J.target.value),
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
            onChange: (J) => B(J.target.value)
          })] }),
          /* @__PURE__ */ (0, n.jsx)("button", {
            className: "btn primary",
            disabled: ie,
            children: "保存作者告知狀態"
          })
        ]
      })] }),
      te && /* @__PURE__ */ (0, n.jsx)("p", {
        role: "alert",
        children: te
      }),
      de.map((J) => /* @__PURE__ */ (0, n.jsxs)("details", {
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
      T ? /* @__PURE__ */ (0, n.jsxs)("details", {
        className: "production-record",
        children: [/* @__PURE__ */ (0, n.jsxs)("summary", { children: [/* @__PURE__ */ (0, n.jsxs)("b", { children: ["交接至 ", v.find((J) => J.id === T.toEpisodeId)?.episode ?? "指定集數"] }), /* @__PURE__ */ (0, n.jsxs)("span", { children: ["接續資料 v", T.version] })] }), /* @__PURE__ */ (0, n.jsx)(Vu, {
          h: T,
          target: v.find((J) => J.id === T.toEpisodeId)?.episode ?? "指定集數"
        })]
      }) : /* @__PURE__ */ (0, n.jsx)("p", {
        className: "muted",
        children: "尚未保存本集對後續集數的交接資料。"
      }),
      /* @__PURE__ */ (0, n.jsxs)("details", { children: [/* @__PURE__ */ (0, n.jsx)("summary", { children: T ? "更新接續資料版本" : "補登跨集接續資料" }), G.length ? /* @__PURE__ */ (0, n.jsxs)("form", {
        className: "context-form",
        onSubmit: async (J) => {
          J.preventDefault(), await r("save_episode_handoff", {
            ...L,
            toEpisodeId: ne || G[0].id,
            baseVersion: T?.version ?? 0,
            sourceKeys: q.split(/[,，\n]/).map((b) => b.trim()).filter(Boolean)
          });
        },
        children: [
          /* @__PURE__ */ (0, n.jsxs)("label", { children: ["接續目標集數", /* @__PURE__ */ (0, n.jsx)("select", {
            value: ne || G[0].id,
            onChange: (J) => ue(J.target.value),
            children: G.map((J) => /* @__PURE__ */ (0, n.jsxs)("option", {
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
          mp.map(([J, b]) => /* @__PURE__ */ (0, n.jsxs)("label", { children: [b, /* @__PURE__ */ (0, n.jsx)("textarea", {
            required: !0,
            rows: 3,
            maxLength: 6e3,
            value: L[J],
            onChange: (le) => I({
              ...L,
              [J]: le.target.value
            })
          })] }, J)),
          /* @__PURE__ */ (0, n.jsxs)("label", { children: ["來源識別鍵（逗號分隔）", /* @__PURE__ */ (0, n.jsx)("textarea", {
            rows: 2,
            value: q,
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
function Lm({ work: u, episode: v, episodes: w, busy: r, onWorkAction: o, onSelectEpisode: T, onPin: G, mutate: k }) {
  const [H, _] = (0, M.useState)(v.title.split("｜")[0]), [E, Z] = (0, M.useState)(""), [B, ne] = (0, M.useState)(""), [ue, L] = (0, M.useState)(""), [I, q] = (0, M.useState)(""), [K, de] = (0, M.useState)(""), [W, te] = (0, M.useState)(Xu), [F, fe] = (0, M.useState)(!1);
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
          x.preventDefault(), await o("convert_episode", {
            title: H,
            episodeId: v.id,
            episodeRevision: v.revision
          });
        },
        children: [/* @__PURE__ */ (0, n.jsxs)("label", { children: ["作品專案名稱", /* @__PURE__ */ (0, n.jsx)("input", {
          required: !0,
          maxLength: 200,
          value: H,
          onChange: (x) => _(x.target.value)
        })] }), /* @__PURE__ */ (0, n.jsx)("button", {
          className: "btn primary",
          disabled: r,
          children: "建立作品專案並保留本集"
        })]
      })
    ]
  });
  const ie = w.filter((x) => x.workId === u.id).sort((x, Q) => x.episode.localeCompare(Q.episode, void 0, { numeric: !0 })), J = Math.max(0, ...ie.map((x) => Number(x.episode.replace(/^EP/i, "")) || 0)) + 1, b = "EP" + String(J).padStart(2, "0"), le = [...new Map(u.sharedAssets.map((x) => [x.key, x])).values()], be = le.filter((x) => !ue || [
    x.key,
    x.title,
    x.content,
    x.source
  ].join(" ").toLowerCase().includes(ue.toLowerCase()));
  function Te(x) {
    te({
      key: x.key,
      title: x.title,
      kind: x.kind,
      content: x.content,
      source: x.source,
      location: x.location,
      baseVersion: x.version
    }), fe(!0);
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
              /* @__PURE__ */ (0, n.jsxs)("b", { children: [le.length, " 項共用來源"] }),
              /* @__PURE__ */ (0, n.jsx)("span", { children: "各集保留自己的劇本、進度與採用版本。" })
            ]
          }),
          /* @__PURE__ */ (0, n.jsx)("div", {
            className: "episode-grid",
            children: ie.map((x) => /* @__PURE__ */ (0, n.jsxs)("button", {
              className: "episode-card " + (x.id === v.id ? "selected" : ""),
              disabled: r,
              onClick: () => T(x.id),
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
              x.preventDefault(), await o("create_episode", {
                episode: E || b,
                title: B || `${E || b} 製作資料`
              }) && (Z(""), ne(""));
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
                  value: B,
                  onChange: (x) => ne(x.target.value),
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
        episodes: w,
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
                te(Xu), fe(!F);
              },
              children: "新增共用參考"
            })]
          }),
          F && /* @__PURE__ */ (0, n.jsxs)("form", {
            className: "context-form",
            onSubmit: async (x) => {
              x.preventDefault(), await o("save_shared_asset", W) && (fe(!1), te(Xu));
            },
            children: [
              /* @__PURE__ */ (0, n.jsxs)("div", {
                className: "context-form-grid",
                children: [
                  /* @__PURE__ */ (0, n.jsxs)("label", { children: ["共用識別鍵", /* @__PURE__ */ (0, n.jsx)("input", {
                    required: !0,
                    readOnly: W.baseVersion !== void 0,
                    maxLength: 110,
                    value: W.key,
                    onChange: (x) => te({
                      ...W,
                      key: x.target.value
                    })
                  })] }),
                  /* @__PURE__ */ (0, n.jsxs)("label", { children: ["共用名稱", /* @__PURE__ */ (0, n.jsx)("input", {
                    required: !0,
                    maxLength: 200,
                    value: W.title,
                    onChange: (x) => te({
                      ...W,
                      title: x.target.value
                    })
                  })] }),
                  /* @__PURE__ */ (0, n.jsxs)("label", { children: ["資料種類", /* @__PURE__ */ (0, n.jsx)("select", {
                    value: W.kind,
                    onChange: (x) => te({
                      ...W,
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
                value: W.content,
                onChange: (x) => te({
                  ...W,
                  content: x.target.value
                })
              })] }),
              /* @__PURE__ */ (0, n.jsxs)("label", { children: ["來源", /* @__PURE__ */ (0, n.jsx)("input", {
                required: !0,
                maxLength: 2e3,
                value: W.source,
                onChange: (x) => te({
                  ...W,
                  source: x.target.value
                })
              })] }),
              /* @__PURE__ */ (0, n.jsxs)("label", { children: ["素材位置", /* @__PURE__ */ (0, n.jsx)("input", {
                maxLength: 2e3,
                value: W.location,
                onChange: (x) => te({
                  ...W,
                  location: x.target.value
                })
              })] }),
              /* @__PURE__ */ (0, n.jsx)("button", {
                className: "btn primary",
                disabled: r,
                children: W.baseVersion ? "保存新版本" : "保存共用來源"
              })
            ]
          }),
          /* @__PURE__ */ (0, n.jsxs)("label", {
            className: "work-search",
            children: ["搜尋共用資料", /* @__PURE__ */ (0, n.jsx)("input", {
              placeholder: "原作章名、角色、場景或設定",
              value: ue,
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
                  w.find((Q) => Q.id === x.originEpisodeId)?.episode ?? x.originEpisodeId,
                  "；按本集需求選用。"
                ]
              }),
              /* @__PURE__ */ (0, n.jsxs)("div", {
                className: "context-actions",
                children: [/* @__PURE__ */ (0, n.jsx)("button", {
                  className: "btn",
                  disabled: r || !!v.sharedPins?.some((Q) => Q.assetId === x.id),
                  onClick: () => {
                    G(x.id);
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
                  q(x.target.value), de("");
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
                    await o("import_shared_assets", { assets: x.assets }) && q("");
                  } catch (x) {
                    de(x instanceof Error ? x.message : "格式錯誤");
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
var cp = {
  key: "",
  title: "",
  world: "real",
  label: "v2_candidate",
  sourceLocation: "",
  sourceVersion: "",
  backupLocation: "",
  sha256: "",
  reference: ""
}, Ym = {
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
function Gm({ initialSelection: u, work: v, episode: w, episodes: r, busy: o, onAction: T, onProject: G, onDirty: k }) {
  const [H, _] = (0, M.useState)(u?.modelId ?? ""), [E, Z] = (0, M.useState)(u?.versionId ?? ""), [B, ne] = (0, M.useState)(u?.stageId ?? "M01"), [ue, L] = (0, M.useState)(null), [I, q] = (0, M.useState)(cp), [K, de] = (0, M.useState)(""), W = v ? zs(v) : null, te = W?.models.find((N) => N.id === H) ?? W?.models[0], F = te?.versions.find((N) => N.id === E) ?? te?.versions.at(-1), fe = F?.stages[B], ie = jl.find((N) => N.id === B);
  function J(N) {
    Ze(N), k(N);
  }
  const [b, le] = (0, M.useState)([]), [be, Te] = (0, M.useState)(""), [x, Q] = (0, M.useState)(""), [Y, O] = (0, M.useState)(""), [V, je] = (0, M.useState)(""), [Ee, Ie] = (0, M.useState)(""), [m, U] = (0, M.useState)("technical"), [X, $] = (0, M.useState)({}), [re, me] = (0, M.useState)(""), [he, Me] = (0, M.useState)(""), [xe, Ze] = (0, M.useState)(!1);
  (0, M.useEffect)(() => {
    fe && (le(fe.checks), Te(fe.evidence), Q(fe.summary), O(fe.nextStep), je(F.candidateLocation), J(!1));
  }, [fe, F]), (0, M.useEffect)(() => {
    if (!xe) return;
    const N = (Le) => Le.preventDefault();
    return window.addEventListener("beforeunload", N), () => window.removeEventListener("beforeunload", N);
  }, [xe]);
  function pt(N) {
    xe && !window.confirm("有未儲存模型紀錄，要放棄修改嗎？") || (J(!1), de(""), N());
  }
  async function De(N, Le) {
    de("");
    const Fe = await T(N, Le);
    return Fe && J(!1), Fe;
  }
  function yl() {
    !te || !F || (q({
      key: te.key,
      title: te.title,
      world: te.world,
      label: "v" + (F.number + 2) + "_candidate",
      sourceLocation: F.sourceLocation,
      sourceVersion: F.sourceVersion,
      backupLocation: F.backupLocation,
      sha256: F.sha256,
      reference: F.reference
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
        onClick: G,
        children: ["前往作品專案 ", /* @__PURE__ */ (0, n.jsx)(ti, { size: 15 })]
      })
    ]
  });
  const st = W.issues.filter((N) => N.modelId === te?.id && N.versionId === F?.id), It = st.filter((N) => N.status === "open"), h = !!F?.stages.M08.author, P = te && F ? jm(v, te.id, F.id, B) : [], Ae = W.pins.filter((N) => N.episodeId === w.id), Xt = new Map(Ae.map((N) => [[N.modelId, N.sceneIds].join("|"), N]));
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
            disabled: o,
            onClick: () => pt(() => {
              q(cp), L("register");
            }),
            children: [/* @__PURE__ */ (0, n.jsx)(tn, { size: 15 }), "登記模型"]
          })]
        }), /* @__PURE__ */ (0, n.jsxs)("div", {
          className: "model-principles",
          children: [
            /* @__PURE__ */ (0, n.jsxs)("span", { children: [/* @__PURE__ */ (0, n.jsx)(ma, { size: 15 }), "先讀原檔與設定"] }),
            /* @__PURE__ */ (0, n.jsxs)("span", { children: [/* @__PURE__ */ (0, n.jsx)($u, { size: 15 }), "保留原檔及版本"] }),
            /* @__PURE__ */ (0, n.jsxs)("span", { children: [/* @__PURE__ */ (0, n.jsx)(ha, { size: 15 }), "技術、視覺與採用分開"] })
          ]
        })]
      }),
      ue && /* @__PURE__ */ (0, n.jsxs)("form", {
        className: "wide-card context-form model-register",
        onSubmit: async (N) => {
          N.preventDefault();
          const Le = await De(ue === "register" ? "register_model" : "create_model_version", {
            ...I,
            modelId: te?.id
          });
          if (Le) {
            const Fe = ue === "register" ? Le.work.modelFlow?.models.at(-1) : Le.work.modelFlow?.models.find((Ot) => Ot.id === te?.id);
            L(null), _(Fe?.id ?? ""), Z(Fe?.versions.at(-1)?.id ?? ""), ne("M01");
          }
        },
        children: [
          /* @__PURE__ */ (0, n.jsxs)("div", {
            className: "section-title",
            children: [/* @__PURE__ */ (0, n.jsx)("h3", { children: ue === "register" ? "登記模型來源" : "建立新候選版本" }), /* @__PURE__ */ (0, n.jsx)("button", {
              className: "text-btn",
              type: "button",
              onClick: () => L(null),
              children: "關閉"
            })]
          }),
          /* @__PURE__ */ (0, n.jsxs)("div", {
            className: "context-form-grid",
            children: [
              ue === "register" && /* @__PURE__ */ (0, n.jsxs)(n.Fragment, { children: [
                /* @__PURE__ */ (0, n.jsxs)("label", { children: ["模型固定識別鍵 *", /* @__PURE__ */ (0, n.jsx)("input", {
                  required: !0,
                  maxLength: 100,
                  value: I.key,
                  placeholder: "RG-REAL-01",
                  onChange: (N) => q({
                    ...I,
                    key: N.target.value
                  })
                })] }),
                /* @__PURE__ */ (0, n.jsxs)("label", { children: ["模型名稱 *", /* @__PURE__ */ (0, n.jsx)("input", {
                  required: !0,
                  maxLength: 200,
                  value: I.title,
                  placeholder: "現實主角家",
                  onChange: (N) => q({
                    ...I,
                    title: N.target.value
                  })
                })] }),
                /* @__PURE__ */ (0, n.jsxs)("label", { children: ["世界／場景分類", /* @__PURE__ */ (0, n.jsxs)("select", {
                  value: I.world,
                  onChange: (N) => q({
                    ...I,
                    world: N.target.value
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
                onChange: (N) => q({
                  ...I,
                  label: N.target.value
                })
              })] }),
              [
                ["sourceLocation", "正式來源 GLB 位置 *"],
                ["sourceVersion", "來源版本／清單版本 *"],
                ["backupLocation", "原檔備份位置"],
                ["sha256", "原檔 SHA-256（實際計算值）"]
              ].map(([N, Le]) => /* @__PURE__ */ (0, n.jsxs)("label", { children: [Le, /* @__PURE__ */ (0, n.jsx)("input", {
                required: N === "sourceLocation" || N === "sourceVersion",
                maxLength: N === "sha256" ? 64 : 2e3,
                pattern: N === "sha256" ? "[a-fA-F0-9]{64}" : void 0,
                value: I[N],
                onChange: (Fe) => q({
                  ...I,
                  [N]: Fe.target.value
                })
              })] }, N))
            ]
          }),
          /* @__PURE__ */ (0, n.jsxs)("label", { children: ["設定與尺度來源／不可改動項目", /* @__PURE__ */ (0, n.jsx)("textarea", {
            rows: 4,
            maxLength: 12e3,
            value: I.reference,
            onChange: (N) => q({
              ...I,
              reference: N.target.value
            }),
            placeholder: "設計書與平面圖版本、固定節點／家具 ID、單位、重大變更待核定項。"
          })] }),
          /* @__PURE__ */ (0, n.jsx)("p", {
            className: "muted",
            children: "來源會隨此版本保存。待補欄位可先留空，但原檔、備份與雜湊不齊時不能通過盤點；更正來源請另建版本。登記資料不會修改或上傳模型檔案。"
          }),
          /* @__PURE__ */ (0, n.jsx)("button", {
            className: "btn primary",
            disabled: o,
            children: "保存模型來源與空白流程"
          })
        ]
      }),
      !te || !F ? /* @__PURE__ */ (0, n.jsxs)("div", {
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
                  value: te.id,
                  disabled: o,
                  onChange: (N) => pt(() => {
                    _(N.target.value), Z(""), ne("M01");
                  }),
                  children: W.models.map((N) => /* @__PURE__ */ (0, n.jsxs)("option", {
                    value: N.id,
                    children: [
                      N.key,
                      " · ",
                      N.title
                    ]
                  }, N.id))
                })] }),
                /* @__PURE__ */ (0, n.jsxs)("label", { children: ["精確版本", /* @__PURE__ */ (0, n.jsx)("select", {
                  value: F.id,
                  disabled: o,
                  onChange: (N) => pt(() => Z(N.target.value)),
                  children: te.versions.map((N) => /* @__PURE__ */ (0, n.jsxs)("option", {
                    value: N.id,
                    children: [
                      "v",
                      N.number,
                      " · ",
                      N.label,
                      N.stages.M08.author ? "（曾採用）" : "",
                      te.adoptedVersionId === N.id ? "／目前採用" : ""
                    ]
                  }, N.id))
                })] }),
                /* @__PURE__ */ (0, n.jsxs)("button", {
                  className: "btn",
                  disabled: o,
                  onClick: () => pt(yl),
                  children: [/* @__PURE__ */ (0, n.jsx)(tn, { size: 14 }), "另建候選版本"]
                })
              ]
            }),
            /* @__PURE__ */ (0, n.jsxs)("div", {
              className: "production-totals",
              children: [
                /* @__PURE__ */ (0, n.jsxs)("b", { children: [jl.filter((N) => F.stages[N.id].author).length, " / 8 階段核定"] }),
                /* @__PURE__ */ (0, n.jsxs)("b", { children: [It.length, " 項待修或待裁定"] }),
                /* @__PURE__ */ (0, n.jsxs)("span", { children: [
                  te.world === "real" ? "現實場景" : te.world === "game" ? "遊戲場景" : "其他模型",
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
                  F.sourceLocation,
                  " · ",
                  F.sourceVersion
                ] }),
                /* @__PURE__ */ (0, n.jsx)("dt", { children: "原檔備份" }),
                /* @__PURE__ */ (0, n.jsx)("dd", { children: F.backupLocation || "待補" }),
                /* @__PURE__ */ (0, n.jsx)("dt", { children: "SHA-256" }),
                /* @__PURE__ */ (0, n.jsx)("dd", { children: F.sha256 || "待實際計算" }),
                /* @__PURE__ */ (0, n.jsx)("dt", { children: "設定與尺度" }),
                /* @__PURE__ */ (0, n.jsx)("dd", { children: F.reference || "待補" }),
                /* @__PURE__ */ (0, n.jsx)("dt", { children: "候選 GLB" }),
                /* @__PURE__ */ (0, n.jsx)("dd", { children: F.candidateLocation || "尚未登記" })
              ]
            })] })
          ]
        }),
        /* @__PURE__ */ (0, n.jsx)("div", {
          className: "model-stage-grid",
          children: jl.map((N, Le) => /* @__PURE__ */ (0, n.jsxs)("button", {
            disabled: o,
            className: "model-step " + (B === N.id ? "selected" : "") + (F.stages[N.id].author ? " passed" : ""),
            onClick: () => pt(() => ne(N.id)),
            children: [
              /* @__PURE__ */ (0, n.jsx)("small", { children: N.id }),
              /* @__PURE__ */ (0, n.jsx)("b", { children: N.title }),
              /* @__PURE__ */ (0, n.jsx)("span", { children: F.stages[N.id].author ? "作者已確認" : F.stages[N.id].status === "needs_revision" ? "待修正" : F.stages[N.id].status === "candidate" ? "已有工作回報" : "待製作" })
            ]
          }, N.id))
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
                  te.title,
                  " · ",
                  F.label
                ]
              }), /* @__PURE__ */ (0, n.jsx)("h2", { children: ie.title })] }), /* @__PURE__ */ (0, n.jsx)("span", {
                className: "status " + (fe.author ? "passed" : fe.status === "needs_revision" ? "needs_revision" : "candidate"),
                children: fe.author ? "作者已確認" : fe.status === "todo" ? "待製作" : "待確認工作"
              })]
            }),
            /* @__PURE__ */ (0, n.jsxs)("div", {
              className: "output-box",
              children: [/* @__PURE__ */ (0, n.jsx)(ma, { size: 19 }), /* @__PURE__ */ (0, n.jsxs)("div", { children: [/* @__PURE__ */ (0, n.jsx)("strong", { children: "應留下的產出" }), /* @__PURE__ */ (0, n.jsx)("p", { children: ie.output })] })]
            }),
            /* @__PURE__ */ (0, n.jsxs)("form", {
              className: "context-form",
              onSubmit: async (N) => {
                N.preventDefault(), await De("save_model_stage", {
                  modelId: te.id,
                  versionId: F.id,
                  stageId: B,
                  checks: b,
                  evidence: be,
                  summary: x,
                  nextStep: Y,
                  candidateLocation: V
                });
              },
              children: [
                /* @__PURE__ */ (0, n.jsx)("div", {
                  className: "checklist",
                  children: ie.checks.map((N, Le) => /* @__PURE__ */ (0, n.jsxs)("label", { children: [/* @__PURE__ */ (0, n.jsx)("input", {
                    type: "checkbox",
                    disabled: o || h,
                    checked: b[Le] ?? !1,
                    onChange: (Fe) => {
                      le((Ot) => Ot.map((ke, el) => el === Le ? Fe.target.checked : ke)), J(!0);
                    }
                  }), /* @__PURE__ */ (0, n.jsx)("span", { children: N })] }, N))
                }),
                B === "M04" && /* @__PURE__ */ (0, n.jsxs)("label", { children: ["本次獨立候選 GLB", /* @__PURE__ */ (0, n.jsx)("input", {
                  disabled: o || h,
                  maxLength: 2e3,
                  value: V,
                  placeholder: ".../reality-home_v2_candidate.glb",
                  onChange: (N) => {
                    je(N.target.value), J(!0);
                  }
                })] }),
                /* @__PURE__ */ (0, n.jsxs)("label", { children: ["實際產出／檢查依據位置", /* @__PURE__ */ (0, n.jsx)("textarea", {
                  rows: 2,
                  disabled: o || h,
                  value: be,
                  onChange: (N) => {
                    Te(N.target.value), J(!0);
                  },
                  placeholder: "原檔盤點報告、逐物件差異、檢查結果或指定鏡位截圖；附來源版本。"
                })] }),
                /* @__PURE__ */ (0, n.jsxs)("label", { children: ["本次實際做了什麼 *", /* @__PURE__ */ (0, n.jsx)("textarea", {
                  required: !0,
                  rows: 3,
                  maxLength: 6e3,
                  disabled: o || h,
                  value: x,
                  onChange: (N) => {
                    Q(N.target.value), J(!0);
                  },
                  placeholder: "具體節點／物件、改動、檢查方式、尚未完成項。"
                })] }),
                /* @__PURE__ */ (0, n.jsxs)("label", { children: ["下一位 AI 從哪裡繼續 *", /* @__PURE__ */ (0, n.jsx)("textarea", {
                  required: !0,
                  rows: 3,
                  maxLength: 6e3,
                  disabled: o || h,
                  value: Y,
                  onChange: (N) => {
                    O(N.target.value), J(!0);
                  },
                  placeholder: "指定版本、檔案位置、先讀資料、下一個物件或鏡位，以及受阻原因。"
                })] }),
                /* @__PURE__ */ (0, n.jsxs)("div", {
                  className: "context-actions",
                  children: [/* @__PURE__ */ (0, n.jsxs)("button", {
                    className: "btn",
                    disabled: o || h || !xe,
                    children: ["保存候選工作紀錄", xe ? " *" : ""]
                  }), /* @__PURE__ */ (0, n.jsxs)("button", {
                    type: "button",
                    className: "btn primary",
                    disabled: o || h || xe || P.length > 0 || !!fe.author,
                    onClick: () => {
                      De(B === "M08" ? "adopt_model_version" : "approve_model_stage", {
                        modelId: te.id,
                        versionId: F.id,
                        stageId: B,
                        note: "作者確認指定候選版本與適用範圍"
                      });
                    },
                    children: [/* @__PURE__ */ (0, n.jsx)(ha, { size: 15 }), B === "M08" ? "作者登記採用此版本" : "作者確認本階段"]
                  })]
                }),
                /* @__PURE__ */ (0, n.jsx)("p", {
                  className: "muted",
                  children: h ? "已採用版本及舊集引用保持不變；需要修改請另建候選。" : xe ? "請先保存工作紀錄，再確認。" : P.length ? "待補：" + P.join("；") : "檢查條件已齊，請核對實際成果後確認。"
                }),
                B === "M08" && /* @__PURE__ */ (0, n.jsx)("p", {
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
              onSubmit: async (N) => {
                N.preventDefault(), await De("report_model_issue", {
                  modelId: te.id,
                  versionId: F.id,
                  stageId: B,
                  kind: m,
                  reason: Ee
                }) && Ie("");
              },
              children: [
                /* @__PURE__ */ (0, n.jsxs)("div", {
                  className: "context-form-grid",
                  children: [/* @__PURE__ */ (0, n.jsxs)("label", { children: ["問題分類", /* @__PURE__ */ (0, n.jsxs)("select", {
                    value: m,
                    onChange: (N) => U(N.target.value),
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
                  onChange: (N) => Ie(N.target.value)
                })] }),
                /* @__PURE__ */ (0, n.jsxs)("button", {
                  className: "btn",
                  disabled: o || !Ee.trim(),
                  children: [/* @__PURE__ */ (0, n.jsx)(en, { size: 15 }), "登記問題"]
                })
              ]
            }),
            st.map((N) => /* @__PURE__ */ (0, n.jsxs)("article", {
              className: "context-record",
              children: [
                /* @__PURE__ */ (0, n.jsxs)("div", {
                  className: "issue-top",
                  children: [/* @__PURE__ */ (0, n.jsx)("span", {
                    className: "status " + (N.status === "open" ? "needs_revision" : "passed"),
                    children: N.status === "open" ? "待處理" : "作者已複核"
                  }), /* @__PURE__ */ (0, n.jsxs)("b", { children: [
                    N.stageId,
                    " · ",
                    N.kind === "major" ? "重大變更" : N.kind === "technical" ? "技術" : "視覺"
                  ] })]
                }),
                /* @__PURE__ */ (0, n.jsx)("p", { children: N.reason }),
                /* @__PURE__ */ (0, n.jsxs)("small", { children: [
                  N.by,
                  " · ",
                  new Date(N.at).toLocaleString("zh-TW", { timeZone: "Asia/Taipei" })
                ] }),
                N.status === "open" ? /* @__PURE__ */ (0, n.jsxs)("form", {
                  className: "context-form",
                  onSubmit: async (Le) => {
                    Le.preventDefault(), await De("resolve_model_issue", {
                      modelId: te.id,
                      versionId: F.id,
                      issueId: N.id,
                      resolution: X[N.id] ?? ""
                    });
                  },
                  children: [/* @__PURE__ */ (0, n.jsxs)("label", { children: ["作者修正複核／裁定結果", /* @__PURE__ */ (0, n.jsx)("textarea", {
                    required: !0,
                    rows: 2,
                    maxLength: 6e3,
                    value: X[N.id] ?? "",
                    onChange: (Le) => $({
                      ...X,
                      [N.id]: Le.target.value
                    })
                  })] }), /* @__PURE__ */ (0, n.jsx)("button", {
                    className: "btn",
                    disabled: o,
                    children: "作者確認處理結果"
                  })]
                }) : /* @__PURE__ */ (0, n.jsxs)("p", { children: ["處理結果：", N.resolution] })
              ]
            }, N.id))
          ]
        }),
        /* @__PURE__ */ (0, n.jsxs)("div", {
          className: "wide-card",
          children: [
            /* @__PURE__ */ (0, n.jsx)("div", {
              className: "section-title",
              children: /* @__PURE__ */ (0, n.jsxs)("div", { children: [/* @__PURE__ */ (0, n.jsxs)("h2", { children: [/* @__PURE__ */ (0, n.jsx)(Iu, { size: 19 }), "各集固定版本引用"] }), /* @__PURE__ */ (0, n.jsxs)("p", { children: [
                "目前集數：",
                w.episode,
                "。新候選不會自動替換 EP01 或其他集的模型來源。"
              ] })] })
            }),
            h && /* @__PURE__ */ (0, n.jsxs)("form", {
              className: "context-form",
              onSubmit: async (N) => {
                N.preventDefault(), await De("pin_model_version", {
                  modelId: te.id,
                  versionId: F.id,
                  episodeId: w.id,
                  purpose: re,
                  sceneIds: he
                }) && (me(""), Me(""));
              },
              children: [/* @__PURE__ */ (0, n.jsxs)("div", {
                className: "context-form-grid",
                children: [/* @__PURE__ */ (0, n.jsxs)("label", { children: ["引用場次（選填）", /* @__PURE__ */ (0, n.jsx)("input", {
                  value: he,
                  maxLength: 1e3,
                  placeholder: "S06、S07",
                  onChange: (N) => Me(N.target.value)
                })] }), /* @__PURE__ */ (0, n.jsxs)("label", { children: ["本集用途 *", /* @__PURE__ */ (0, n.jsx)("input", {
                  required: !0,
                  value: re,
                  maxLength: 2e3,
                  placeholder: "固定樓梯、餐桌與走道位置",
                  onChange: (N) => me(N.target.value)
                })] })]
              }), /* @__PURE__ */ (0, n.jsxs)("button", {
                className: "btn",
                disabled: o || It.length > 0,
                children: ["將此採用版本引用至 ", w.episode]
              })]
            }),
            Ae.length ? /* @__PURE__ */ (0, n.jsx)("div", {
              className: "model-pins",
              children: Ae.map((N, Le) => {
                const Fe = W.models.find((ke) => ke.id === N.modelId), Ot = Fe?.versions.find((ke) => ke.id === N.versionId);
                return /* @__PURE__ */ (0, n.jsxs)("article", { children: [
                  /* @__PURE__ */ (0, n.jsxs)("b", { children: [
                    Fe?.title,
                    " · ",
                    Ot?.label
                  ] }),
                  " ",
                  /* @__PURE__ */ (0, n.jsx)("span", {
                    className: "status " + (Xt.get([N.modelId, N.sceneIds].join("|")) === N ? "passed" : "todo"),
                    children: Xt.get([N.modelId, N.sceneIds].join("|")) === N ? "本集現行引用" : "歷史引用"
                  }),
                  /* @__PURE__ */ (0, n.jsxs)("p", { children: [
                    N.sceneIds || "本集",
                    " ／ ",
                    N.purpose
                  ] }),
                  /* @__PURE__ */ (0, n.jsx)("code", { children: Ot?.candidateLocation })
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
            W.history.filter((N) => N.modelId === te.id).length,
            "）"
          ] }), [...W.history].reverse().filter((N) => N.modelId === te.id).slice(0, 60).map((N, Le) => /* @__PURE__ */ (0, n.jsxs)("article", {
            className: "context-mini",
            children: [
              /* @__PURE__ */ (0, n.jsxs)("b", { children: [
                Ym[N.action] ?? N.action,
                " · ",
                N.stageId,
                " · ",
                te.versions.find((Fe) => Fe.id === N.versionId)?.label
              ] }),
              /* @__PURE__ */ (0, n.jsx)("p", { children: N.detail }),
              /* @__PURE__ */ (0, n.jsxs)("small", { children: [
                N.actor === "ai" ? "AI" : "作者",
                " · ",
                N.by,
                " · ",
                new Date(N.at).toLocaleString("zh-TW", { timeZone: "Asia/Taipei" })
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
}, up = [
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
function pa(u) {
  return u ? new Date(u).toLocaleString("zh-TW", {
    timeZone: "Asia/Taipei",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  }) : "尚無紀錄";
}
function dp(u, v, w = "application/json") {
  const r = URL.createObjectURL(new Blob([v], { type: w })), o = document.createElement("a");
  o.href = r, o.download = u, o.click(), setTimeout(() => URL.revokeObjectURL(r), 1e3);
}
function Vm({ nativeTransport: u } = {}) {
  const [v, w] = (0, M.useState)([]), [r, o] = (0, M.useState)(null), [T, G] = (0, M.useState)("resume"), [k, H] = (0, M.useState)("01"), [_, E] = (0, M.useState)(null), [Z, B] = (0, M.useState)([]), [ne, ue] = (0, M.useState)(!0), [L, I] = (0, M.useState)(!1), [q, K] = (0, M.useState)(""), [de, W] = (0, M.useState)(""), [te, F] = (0, M.useState)(!1), [fe, ie] = (0, M.useState)([]), [J, b] = (0, M.useState)(""), [le, be] = (0, M.useState)(""), [Te, x] = (0, M.useState)(!1), [Q, Y] = (0, M.useState)(null), [O, V] = (0, M.useState)({}), [je, Ee] = (0, M.useState)(""), [Ie, m] = (0, M.useState)(!1), [U, X] = (0, M.useState)(null), $ = (0, M.useRef)(0), re = (0, M.useRef)(""), me = (0, M.useRef)(!1);
  (0, M.useEffect)(() => {
    me.current = Te;
  }, [Te]);
  const he = (0, M.useCallback)((f) => {
    re.current = f.id, o(f), E((ce) => ce?.id === f.workId ? ce : null), w((ce) => [Wu(f), ...ce.filter((pe) => pe.id !== f.id)]), x(!1);
  }, []);
  async function Me(f, ce, pe = "projects") {
    const ct = u ? await u(pe, f, ce) : await fetch("/api/" + pe + f, {
      cache: "no-store",
      ...ce ? {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(ce)
      } : {}
    });
    if (ct.status === 401)
      throw F(!0), new Error("請先登入流程工作台");
    if (!ct.headers.get("content-type")?.includes("application/json"))
      throw F(!0), new Error("請開啟工作台並使用 ChatGPT 登入");
    const zt = await ct.json();
    if (!ct.ok) throw new Error(zt.error || "讀取失敗");
    return F(!1), zt;
  }
  const xe = (0, M.useCallback)(async (f) => {
    const ce = ++$.current;
    f && f !== re.current && (re.current = f, ue(!0));
    try {
      const [pe, ct] = await Promise.all([Me(""), Me("", void 0, "works")]), zt = f || re.current || pe.find((ht) => !ht.archived)?.id;
      let Qt = null, Sl = null;
      if (zt && (Qt = await Me("?id=" + encodeURIComponent(zt)), Qt.workId && (Sl = (await Me("?id=" + encodeURIComponent(Qt.workId), void 0, "works")).work)), ce !== $.current) return;
      K(""), w(pe), B(ct), me.current || (Qt ? he(Qt) : o(null), E(Sl));
    } catch (pe) {
      ce === $.current && K(pe.message);
    } finally {
      ce === $.current && ue(!1);
    }
  }, [he]);
  (0, M.useEffect)(() => {
    const f = new URLSearchParams(window.location.search).get("view");
    f && [
      "resume",
      "project",
      "models",
      "context"
    ].includes(f) && G(f);
  }, []), (0, M.useEffect)(() => {
    xe();
  }, [xe]), (0, M.useEffect)(() => {
    const f = setInterval(() => {
      !Te && !Q && !L && xe(re.current || void 0);
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
    const f = (ce) => {
      ce.preventDefault();
    };
    return window.addEventListener("beforeunload", f), () => window.removeEventListener("beforeunload", f);
  }, [Te]), (0, M.useEffect)(() => {
    if (!de) return;
    const f = setTimeout(() => W(""), 4500);
    return () => clearTimeout(f);
  }, [de]);
  async function Ze(f, ce = {}) {
    if (r) {
      $.current++, I(!0), K("");
      try {
        const pe = await Me("", {
          projectId: r.id,
          revision: r.revision,
          action: f,
          args: ce
        });
        return he(pe), pe.archived && m(!0), W("已儲存至雲端"), pe;
      } catch (pe) {
        K(pe.message);
      } finally {
        I(!1);
      }
    }
  }
  async function pt(f, ce) {
    $.current++, I(!0), K("");
    try {
      const pe = await Me("", [
        "convert_episode",
        "create_work",
        "create_episode"
      ].includes(f) ? {
        action: f,
        ...ce,
        workId: _?.id,
        revision: _?.revision
      } : {
        action: f,
        workId: _?.id,
        revision: _?.revision,
        args: ce
      }, "works");
      return E(pe.work), B((ct) => [{
        ...Em(pe.work),
        episodeCount: pe.episodes.length
      }, ...ct.filter((zt) => zt.id !== pe.work.id)]), w((ct) => [...pe.episodes, ...ct.filter((zt) => !pe.episodes.some((Qt) => Qt.id === zt.id))]), pe.episode && he(pe.episode), W("作品專案已儲存"), pe;
    } catch (pe) {
      K(pe.message);
    } finally {
      I(!1);
    }
  }
  function De(f) {
    Te && !window.confirm("此階段有未儲存修改，要放棄修改嗎？") || (x(!1), f());
  }
  function yl(f) {
    De(() => H(f));
  }
  function st(f) {
    De(() => {
      G(f), [
        "main",
        "op",
        "ed"
      ].includes(f) && H(Vt.find((ce) => ce.group === f).id);
    });
  }
  async function It(f) {
    f.preventDefault(), I(!0), K("");
    try {
      Q === "create" ? (he(await Me("", {
        action: "create_project",
        title: O.title || "現實遊戲",
        episode: O.episode || "EP01"
      })), G("main"), H("01"), Y(null), W("專案已建立，全部階段待確認")) : Q === "shot" ? await Ze("save_shot", O) && Y(null) : Q === "issue" ? await Ze("add_issue", O) && Y(null) : Q === "resolve" ? await Ze("resolve_issue", O) && Y(null) : Q === "archive" && await Ze(r?.archived ? "restore" : "archive") && Y(null);
    } catch (ce) {
      K(ce.message);
    } finally {
      I(!1);
    }
  }
  const h = r ? Wu(r) : null, P = Vt.find((f) => f.id === k), Ae = r?.stages[k], Xt = r ? pp(r, k) : [], N = r ? ys(r, k) : [], Le = Vt.filter((f) => f.group === T), Fe = r?.issues.filter((f) => f.status === "open") || [], Ot = r?.production?.completionReports?.at(-1), ke = Ot?.status === "completed", el = r ? ed(r).registration : null, an = [
    [
      "resume",
      "接手總覽",
      Wn
    ],
    [
      "project",
      "作品專案",
      Fn
    ],
    [
      "models",
      "模型流程",
      Wf
    ],
    [
      "settings",
      "本集規則與採用",
      ma
    ],
    [
      "context",
      "AI 工作中心",
      Wn
    ],
    [
      "main",
      "主線流程",
      nm
    ],
    [
      "op",
      "OP 支線",
      qu
    ],
    [
      "ed",
      "ED 支線",
      Fn
    ],
    [
      "shots",
      "素材總表",
      Wf
    ],
    [
      "issues",
      "退修紀錄",
      en
    ],
    [
      "chatgpt",
      "ChatGPT 協作",
      bs
    ],
    [
      "history",
      "異動紀錄",
      rp
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
            children: [/* @__PURE__ */ (0, n.jsx)(Fn, { size: 19 }), /* @__PURE__ */ (0, n.jsxs)("select", {
              disabled: L || ne,
              "aria-label": "切換作品專案",
              value: _?.id || "",
              onChange: (f) => De(() => {
                const ce = v.find((pe) => (pe.workId || "") === f.target.value && !pe.archived);
                ce && xe(ce.id), X(null), G("resume");
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
            children: [/* @__PURE__ */ (0, n.jsx)(Wn, { size: 19 }), /* @__PURE__ */ (0, n.jsxs)("select", {
              disabled: L || ne,
              "aria-label": "切換集數",
              value: r?.id || "",
              onChange: (f) => De(() => {
                xe(f.target.value);
              }),
              children: [/* @__PURE__ */ (0, n.jsx)("option", {
                value: "",
                disabled: !0,
                children: "選擇集數"
              }), v.filter((f) => (f.workId || "") === (_?.id || "") && (Ie || !f.archived)).map((f) => /* @__PURE__ */ (0, n.jsxs)("option", {
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
            onClick: () => De(() => {
              V({
                title: "現實遊戲",
                episode: "EP01"
              }), Y("create");
            }),
            children: [/* @__PURE__ */ (0, n.jsx)(tn, { size: 15 }), "建立其他單集"]
          }),
          /* @__PURE__ */ (0, n.jsx)("nav", { children: an.map(([f, ce, pe]) => /* @__PURE__ */ (0, n.jsxs)("button", {
            className: "nav-item " + (T === f ? "active" : ""),
            onClick: () => st(f),
            children: [
              /* @__PURE__ */ (0, n.jsx)(pe, { size: 18 }),
              /* @__PURE__ */ (0, n.jsx)("span", { children: ce }),
              f === "issues" && Fe.length > 0 ? /* @__PURE__ */ (0, n.jsx)("b", {
                className: "count",
                children: Fe.length
              }) : f === "chatgpt" ? /* @__PURE__ */ (0, n.jsx)("span", {
                className: "new-tag",
                children: "MCP"
              }) : null
            ]
          }, f)) }),
          /* @__PURE__ */ (0, n.jsxs)("div", {
            className: "side-bottom",
            children: [
              /* @__PURE__ */ (0, n.jsxs)("div", {
                className: "manual-mini",
                children: [/* @__PURE__ */ (0, n.jsx)(ma, { size: 20 }), /* @__PURE__ */ (0, n.jsxs)("div", { children: [/* @__PURE__ */ (0, n.jsx)("b", { children: "依製作手冊 v1.0" }), /* @__PURE__ */ (0, n.jsx)("span", { children: "十二階段 · 驗收後再前進" })] })]
              }),
              /* @__PURE__ */ (0, n.jsxs)("label", {
                className: "archive-toggle",
                children: [/* @__PURE__ */ (0, n.jsx)("input", {
                  type: "checkbox",
                  checked: Ie,
                  onChange: (f) => m(f.target.checked)
                }), "顯示已封存專案"]
              }),
              /* @__PURE__ */ (0, n.jsxs)("a", {
                href: Qu,
                target: "_top",
                children: ["返回立之雲端庫 ", /* @__PURE__ */ (0, n.jsx)(Gh, { size: 14 })]
              })
            ]
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
              /* @__PURE__ */ (0, n.jsx)($f, { size: 14 }),
              /* @__PURE__ */ (0, n.jsx)("span", { children: an.find((f) => f[0] === T)?.[1] })
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
              disabled: L || ne,
              onClick: () => De(() => {
                xe(r?.id);
              }),
              children: /* @__PURE__ */ (0, n.jsx)(om, {
                size: 17,
                className: ne ? "spin" : ""
              })
            })]
          })]
        }), /* @__PURE__ */ (0, n.jsxs)("div", {
          className: "page-content",
          children: [
            q && /* @__PURE__ */ (0, n.jsxs)("div", {
              className: "error-banner",
              role: "alert",
              children: [
                /* @__PURE__ */ (0, n.jsx)(en, { size: 18 }),
                /* @__PURE__ */ (0, n.jsx)("span", { children: q }),
                te && /* @__PURE__ */ (0, n.jsx)("a", {
                  href: u ? Qu : "/signin-with-chatgpt?return_to=" + encodeURIComponent("/?view=" + T),
                  target: "_top",
                  children: u ? "重新登入雲端庫" : "登入工作台 ↗"
                }),
                /* @__PURE__ */ (0, n.jsx)("button", {
                  "aria-label": "關閉訊息",
                  onClick: () => K(""),
                  children: /* @__PURE__ */ (0, n.jsx)(Ff, { size: 16 })
                })
              ]
            }),
            /* @__PURE__ */ (0, n.jsxs)("div", {
              className: "page-heading",
              children: [/* @__PURE__ */ (0, n.jsxs)("div", { children: [
                /* @__PURE__ */ (0, n.jsx)("div", {
                  className: "eyebrow",
                  children: "PRODUCTION CHECKPOINTS"
                }),
                /* @__PURE__ */ (0, n.jsxs)("h1", { children: ["製作工作台", /* @__PURE__ */ (0, n.jsx)("span", {
                  className: "version",
                  children: "v4.4"
                })] }),
                /* @__PURE__ */ (0, n.jsx)("p", { children: "動畫與模型共用作品脈絡；先讀交接，再依精確版本執行。" })
              ] }), /* @__PURE__ */ (0, n.jsx)("div", {
                className: "heading-actions",
                children: r && /* @__PURE__ */ (0, n.jsxs)(n.Fragment, { children: [/* @__PURE__ */ (0, n.jsxs)("button", {
                  className: "btn",
                  onClick: () => dp(r.title + "_" + r.episode + "_流程備份.json", JSON.stringify(r, null, 2)),
                  children: [/* @__PURE__ */ (0, n.jsx)(Ju, { size: 15 }), "匯出紀錄"]
                }), /* @__PURE__ */ (0, n.jsx)("button", {
                  className: "icon-btn bordered",
                  title: r.archived ? "還原專案" : "封存專案",
                  "aria-label": r.archived ? "還原專案" : "封存專案",
                  onClick: () => {
                    V({}), Y("archive");
                  },
                  children: r.archived ? /* @__PURE__ */ (0, n.jsx)(fm, { size: 17 }) : /* @__PURE__ */ (0, n.jsx)(Bh, { size: 17 })
                })] })
              })]
            }),
            ne ? /* @__PURE__ */ (0, n.jsxs)("div", {
              className: "empty",
              children: [/* @__PURE__ */ (0, n.jsx)(Hu, {
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
                    pa(r.updatedAt),
                    " ",
                    /* @__PURE__ */ (0, n.jsx)("span", { children: "·" }),
                    " 紀錄版本 ",
                    r.revision
                  ] })] })]
                }), /* @__PURE__ */ (0, n.jsxs)("div", {
                  className: "project-progress",
                  children: [/* @__PURE__ */ (0, n.jsxs)("div", { children: [/* @__PURE__ */ (0, n.jsx)("span", { children: "本集製作狀態" }), /* @__PURE__ */ (0, n.jsx)("strong", { children: ke ? "作者告知已完成" : Ot?.status === "in_progress" ? "作者告知製作中" : Ot?.status === "not_started" ? "作者告知尚未開始" : "尚未登記" })] }), /* @__PURE__ */ (0, n.jsx)("small", { children: ke ? "目前進行資料補登與來源對應" : "依本集作者告知紀錄顯示" })]
                })]
              }),
              T !== "resume" && /* @__PURE__ */ (0, n.jsxs)(n.Fragment, { children: [/* @__PURE__ */ (0, n.jsxs)("div", {
                className: "metrics",
                children: [
                  /* @__PURE__ */ (0, n.jsxs)("div", { children: [/* @__PURE__ */ (0, n.jsx)("span", {
                    className: "metric-icon green",
                    children: /* @__PURE__ */ (0, n.jsx)(ha, { size: 20 })
                  }), /* @__PURE__ */ (0, n.jsxs)("div", { children: [/* @__PURE__ */ (0, n.jsxs)("b", { children: [el.acceptedSources, /* @__PURE__ */ (0, n.jsxs)("em", { children: [" / ", el.sources] })] }), /* @__PURE__ */ (0, n.jsx)("small", { children: "來源已確認收錄" })] })] }),
                  /* @__PURE__ */ (0, n.jsxs)("div", { children: [/* @__PURE__ */ (0, n.jsx)("span", {
                    className: "metric-icon blue",
                    children: /* @__PURE__ */ (0, n.jsx)(qu, { size: 20 })
                  }), /* @__PURE__ */ (0, n.jsxs)("div", { children: [/* @__PURE__ */ (0, n.jsxs)("b", { children: [el.linkedShots, /* @__PURE__ */ (0, n.jsxs)("em", { children: [" / ", el.shots] })] }), /* @__PURE__ */ (0, n.jsx)("small", { children: "鏡頭來源關聯" })] })] }),
                  /* @__PURE__ */ (0, n.jsxs)("div", { children: [/* @__PURE__ */ (0, n.jsx)("span", {
                    className: "metric-icon amber",
                    children: /* @__PURE__ */ (0, n.jsx)(ma, { size: 20 })
                  }), /* @__PURE__ */ (0, n.jsxs)("div", { children: [/* @__PURE__ */ (0, n.jsx)("b", { children: el.registeredSelections || "待補登" }), /* @__PURE__ */ (0, n.jsx)("small", { children: "實際採用檔紀錄" })] })] }),
                  /* @__PURE__ */ (0, n.jsxs)("div", { children: [/* @__PURE__ */ (0, n.jsx)("span", {
                    className: "metric-icon red",
                    children: /* @__PURE__ */ (0, n.jsx)(en, { size: 20 })
                  }), /* @__PURE__ */ (0, n.jsxs)("div", { children: [/* @__PURE__ */ (0, n.jsx)("b", { children: Fe.length }), /* @__PURE__ */ (0, n.jsx)("small", { children: "已登記退修問題" })] })] })
                ]
              }), /* @__PURE__ */ (0, n.jsxs)("details", {
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
                  ke ? "本集已按作者告知完成登記；以上為資料紀錄覆蓋情形，不代表製作完成比例。" : "作者告知、逐項檢視與資料收錄分別保存。"
                ] })]
              })] }),
              T === "resume" ? /* @__PURE__ */ (0, n.jsx)(Mm, {
                project: r,
                work: _,
                busy: L,
                onNavigate: st,
                onModel: (f) => {
                  X(f), st("models");
                }
              }) : T === "project" ? /* @__PURE__ */ (0, n.jsx)(Lm, {
                work: _,
                episode: r,
                episodes: v,
                busy: L,
                onWorkAction: pt,
                onSelectEpisode: (f) => De(() => {
                  xe(f);
                }),
                onPin: (f) => Ze("pin_shared_reference", { assetId: f }),
                mutate: Ze
              }, r.id) : T === "models" ? /* @__PURE__ */ (0, n.jsx)(Gm, {
                initialSelection: U,
                work: _,
                episode: r,
                episodes: v,
                busy: L,
                onAction: pt,
                onProject: () => st("project"),
                onDirty: x
              }, (_?.id || r.id) + JSON.stringify(U)) : T === "settings" ? /* @__PURE__ */ (0, n.jsx)(hp, {
                project: r,
                busy: L,
                mutate: Ze
              }, r.id) : T === "context" ? /* @__PURE__ */ (0, n.jsx)(qm, {
                project: r,
                mutate: Ze,
                busy: L
              }, r.id) : [
                "main",
                "op",
                "ed"
              ].includes(T) ? /* @__PURE__ */ (0, n.jsxs)(n.Fragment, { children: [
                /* @__PURE__ */ (0, n.jsxs)("div", {
                  className: "section-title",
                  children: [
                    /* @__PURE__ */ (0, n.jsx)("h2", { children: T === "main" ? "主線製作流程" : T.toUpperCase() + " 獨立製作支線" }),
                    /* @__PURE__ */ (0, n.jsx)("span", { children: T === "main" ? "每階段留下產出，再進行驗收" : "完成支線後接回全片驗收" }),
                    T !== "main" && /* @__PURE__ */ (0, n.jsxs)("label", {
                      className: "branch-toggle",
                      children: [/* @__PURE__ */ (0, n.jsx)("input", {
                        type: "checkbox",
                        checked: r.branches[T],
                        disabled: L || r.archived,
                        onChange: (f) => {
                          Ze("set_branches", {
                            ...r.branches,
                            [T]: f.target.checked
                          });
                        }
                      }), "納入本集"]
                    })
                  ]
                }),
                T !== "main" && !r.branches[T] ? /* @__PURE__ */ (0, n.jsxs)("div", {
                  className: "empty",
                  children: [
                    /* @__PURE__ */ (0, n.jsx)(Fn, { size: 30 }),
                    /* @__PURE__ */ (0, n.jsxs)("h3", { children: ["本集未納入 ", T.toUpperCase()] }),
                    /* @__PURE__ */ (0, n.jsx)("p", { children: "重新勾選「納入本集」即可保留並繼續原有紀錄。" })
                  ]
                }) : /* @__PURE__ */ (0, n.jsxs)("div", {
                  className: "flow-layout",
                  children: [/* @__PURE__ */ (0, n.jsxs)("div", {
                    className: "stage-list",
                    children: [Le.map((f, ce) => {
                      const pe = r.stages[f.id], ct = ys(r, f.id).length > 0;
                      return /* @__PURE__ */ (0, n.jsxs)("button", {
                        className: "stage-item " + (k === f.id ? "selected" : "") + (pe.author ? " completed" : ""),
                        onClick: () => yl(f.id),
                        children: [
                          /* @__PURE__ */ (0, n.jsx)("span", {
                            className: "stage-number " + (pe.author ? "done" : ""),
                            children: pe.author ? /* @__PURE__ */ (0, n.jsx)($n, { size: 17 }) : T === "main" ? f.id : String(ce + 1).padStart(2, "0")
                          }),
                          /* @__PURE__ */ (0, n.jsxs)("div", { children: [
                            /* @__PURE__ */ (0, n.jsx)("small", { children: f.phase }),
                            /* @__PURE__ */ (0, n.jsx)("strong", { children: f.title }),
                            /* @__PURE__ */ (0, n.jsx)("span", {
                              className: "stage-label " + (pe.status === "needs_revision" ? "red-text" : ""),
                              children: ke && !pe.author && pe.status === "todo" ? "已完成 · 待補登" : ct && !pe.author ? /* @__PURE__ */ (0, n.jsxs)(n.Fragment, { children: [/* @__PURE__ */ (0, n.jsx)($u, { size: 11 }), "待前階段核定"] }) : Zu[pe.status]
                            })
                          ] }),
                          /* @__PURE__ */ (0, n.jsx)($f, { size: 15 })
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
                          children: T === "main" ? "STAGE " + k : T.toUpperCase() + " · " + k.slice(2)
                        }), /* @__PURE__ */ (0, n.jsx)("h2", { children: P.title })] }), /* @__PURE__ */ (0, n.jsx)("span", {
                          className: "status " + Ae.status,
                          children: ke && Ae.status === "todo" ? "已完成 · 明細待補登" : Zu[Ae.status]
                        })]
                      }),
                      /* @__PURE__ */ (0, n.jsx)("p", {
                        className: "stage-description",
                        children: P.description
                      }),
                      N.length > 0 && /* @__PURE__ */ (0, n.jsxs)("div", {
                        className: "gate-notice",
                        children: [/* @__PURE__ */ (0, n.jsx)($u, { size: 16 }), /* @__PURE__ */ (0, n.jsxs)("span", { children: [
                          ke ? "逐項紀錄尚缺：" : "正式核定前，需先完成：",
                          N.join("、"),
                          "。可直接補登產出依據。"
                        ] })]
                      }),
                      /* @__PURE__ */ (0, n.jsxs)("div", {
                        className: "output-box",
                        children: [/* @__PURE__ */ (0, n.jsx)(ma, { size: 19 }), /* @__PURE__ */ (0, n.jsxs)("div", { children: [/* @__PURE__ */ (0, n.jsx)("strong", { children: "本階段產出" }), /* @__PURE__ */ (0, n.jsx)("p", { children: P.output })] })]
                      }),
                      Zl(r.episodeRules ?? []).filter((f) => !f.stageIds.length || f.stageIds.includes(k)).map((f) => /* @__PURE__ */ (0, n.jsxs)("div", {
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
                        children: [/* @__PURE__ */ (0, n.jsx)("h3", { children: ke ? "逐項檢視紀錄" : "驗收確認" }), /* @__PURE__ */ (0, n.jsxs)("span", { children: [
                          fe.filter(Boolean).length,
                          " / ",
                          fe.length
                        ] })]
                      }),
                      /* @__PURE__ */ (0, n.jsx)("div", {
                        className: "checklist",
                        children: P.checks.map((f, ce) => /* @__PURE__ */ (0, n.jsxs)("label", {
                          className: fe[ce] ? "checked" : "",
                          children: [/* @__PURE__ */ (0, n.jsx)("input", {
                            type: "checkbox",
                            checked: fe[ce] || !1,
                            disabled: L || r.archived,
                            onChange: (pe) => {
                              ie((ct) => ct.map((zt, Qt) => Qt === ce ? pe.target.checked : zt)), x(!0);
                            }
                          }), /* @__PURE__ */ (0, n.jsx)("span", { children: f })]
                        }, ce))
                      }),
                      /* @__PURE__ */ (0, n.jsxs)("label", {
                        className: "field-label",
                        htmlFor: "evidence",
                        children: [
                          /* @__PURE__ */ (0, n.jsx)(Iu, { size: 15 }),
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
                        value: le,
                        disabled: r.archived,
                        onChange: (f) => {
                          be(f.target.value), x(!0);
                        }
                      }),
                      /* @__PURE__ */ (0, n.jsxs)("div", {
                        className: "reviews",
                        children: [/* @__PURE__ */ (0, n.jsxs)("div", { children: [/* @__PURE__ */ (0, n.jsxs)("span", {
                          className: "review-title",
                          children: [/* @__PURE__ */ (0, n.jsx)(bs, { size: 15 }), "AI 初驗"]
                        }), Ae.ai ? /* @__PURE__ */ (0, n.jsxs)(n.Fragment, { children: [
                          /* @__PURE__ */ (0, n.jsx)("b", {
                            className: Ae.ai.verdict === "pass" ? "green-text" : "red-text",
                            children: Ae.ai.verdict === "pass" ? "初驗通過" : "需修正"
                          }),
                          /* @__PURE__ */ (0, n.jsx)("p", { children: Ae.ai.note }),
                          /* @__PURE__ */ (0, n.jsxs)("small", { children: [
                            pa(Ae.ai.at),
                            " · ",
                            Ae.ai.by
                          ] })
                        ] }) : /* @__PURE__ */ (0, n.jsx)("p", {
                          className: "muted",
                          children: "尚未收到 AI 初驗"
                        })] }), /* @__PURE__ */ (0, n.jsxs)("div", { children: [/* @__PURE__ */ (0, n.jsxs)("span", {
                          className: "review-title",
                          children: [/* @__PURE__ */ (0, n.jsx)(ha, { size: 15 }), "作者正式核定"]
                        }), Ae.author ? /* @__PURE__ */ (0, n.jsxs)(n.Fragment, { children: [
                          /* @__PURE__ */ (0, n.jsx)("b", {
                            className: "green-text",
                            children: "已核定"
                          }),
                          /* @__PURE__ */ (0, n.jsx)("p", { children: Ae.author.note || "已確認本階段成果與驗收條件" }),
                          /* @__PURE__ */ (0, n.jsxs)("small", { children: [
                            pa(Ae.author.at),
                            " · ",
                            Ae.author.by
                          ] })
                        ] }) : /* @__PURE__ */ (0, n.jsx)("p", {
                          className: "muted",
                          children: ke ? "作者已告知本集完成；逐項檢視依據尚待補登。" : "尚未登記逐項確認"
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
                            }), Y("issue");
                          },
                          children: [/* @__PURE__ */ (0, n.jsx)(en, { size: 15 }), "記錄退修"]
                        }), /* @__PURE__ */ (0, n.jsxs)("div", { children: [/* @__PURE__ */ (0, n.jsxs)("button", {
                          className: "btn",
                          disabled: L || r.archived || !Te,
                          onClick: () => {
                            Ze("save_stage", {
                              stageId: k,
                              checks: fe,
                              evidence: J,
                              note: le
                            });
                          },
                          children: [
                            L ? /* @__PURE__ */ (0, n.jsx)(Hu, {
                              size: 15,
                              className: "spin"
                            }) : null,
                            "儲存草稿",
                            Te ? " *" : ""
                          ]
                        }), /* @__PURE__ */ (0, n.jsxs)("button", {
                          className: "btn primary",
                          disabled: L || r.archived || Te || Xt.length > 0 || !!Ae.author,
                          onClick: () => {
                            Ze("approve_stage", {
                              stageId: k,
                              note: "作者已核對產出與全部驗收條件"
                            });
                          },
                          children: [/* @__PURE__ */ (0, n.jsx)(ha, { size: 15 }), Ae.author ? "已正式核定" : "作者確認通過"]
                        })] })]
                      }),
                      !Ae.author && /* @__PURE__ */ (0, n.jsx)("div", {
                        className: "gate-reasons",
                        children: ke ? "本集維持作者告知完成；此處保存逐項檢視依據，不要求重新確認整集。" : Te ? "先儲存修改，再確認通過。" : Xt.length ? "待完成：" + Xt.join("；") : "已符合檢查條件，請實際檢視成果後確認通過。"
                      })
                    ]
                  }, k)]
                }),
                T === "main" && /* @__PURE__ */ (0, n.jsxs)("div", {
                  className: "principle",
                  children: [/* @__PURE__ */ (0, n.jsx)(Fn, { size: 19 }), /* @__PURE__ */ (0, n.jsxs)("div", { children: [/* @__PURE__ */ (0, n.jsx)("b", { children: "發現問題，就回到造成問題的環節。" }), /* @__PURE__ */ (0, n.jsx)("p", { children: "更新已核定的製作依據時，相關下游階段會標為待修正。AI 初驗與作者核定各自留存。" })] })]
                }),
                /* @__PURE__ */ (0, n.jsxs)("details", {
                  className: "manual-rules",
                  children: [/* @__PURE__ */ (0, n.jsx)("summary", { children: "歷史製作經驗（不作為目前有效設定）" }), /* @__PURE__ */ (0, n.jsxs)("div", {
                    className: "manual-rule-content",
                    children: [
                      /* @__PURE__ */ (0, n.jsx)("h3", { children: "場景定位" }),
                      Pn.scenePosition.map((f) => /* @__PURE__ */ (0, n.jsx)("p", { children: f }, f)),
                      /* @__PURE__ */ (0, n.jsx)("h3", { children: "生圖提示詞順序" }),
                      /* @__PURE__ */ (0, n.jsx)("p", { children: Pn.imagePrompt }),
                      /* @__PURE__ */ (0, n.jsx)("h3", { children: "影片提示詞順序" }),
                      /* @__PURE__ */ (0, n.jsx)("p", { children: Pn.videoPrompt }),
                      /* @__PURE__ */ (0, n.jsx)("h3", { children: "失敗時回查" }),
                      Pn.repairs.map((f) => /* @__PURE__ */ (0, n.jsx)("p", { children: f }, f)),
                      /* @__PURE__ */ (0, n.jsx)("h3", { children: "本集專用條件" }),
                      /* @__PURE__ */ (0, n.jsx)("p", { children: "請從「本集規則與採用」取得指定版本；前一集的劇情條件不自動沿用。" }),
                      /* @__PURE__ */ (0, n.jsx)("h3", { children: "素材編號" }),
                      /* @__PURE__ */ (0, n.jsx)("p", { children: "每集保留自己的素材編號與明確對照，不依編號相近猜配。" }),
                      /* @__PURE__ */ (0, n.jsxs)("p", { children: ["後續檔名範例：", Pn.filenames.map((f) => f.replace("EP01", r.episode)).join("、")] })
                    ]
                  })]
                })
              ] }) : T === "shots" ? /* @__PURE__ */ (0, n.jsxs)("section", {
                className: "wide-card",
                children: [
                  /* @__PURE__ */ (0, n.jsxs)("div", {
                    className: "section-title",
                    children: [/* @__PURE__ */ (0, n.jsxs)("div", { children: [/* @__PURE__ */ (0, n.jsx)("h2", { children: "製作素材總表" }), /* @__PURE__ */ (0, n.jsx)("p", { children: "依鏡頭串起參考版本、素材位置、舊編號與成片時間。" })] }), /* @__PURE__ */ (0, n.jsxs)("button", {
                      className: "btn primary",
                      disabled: r.archived,
                      onClick: () => {
                        V({}), Y("shot");
                      },
                      children: [/* @__PURE__ */ (0, n.jsx)(tn, { size: 16 }), "新增鏡頭"]
                    })]
                  }),
                  /* @__PURE__ */ (0, n.jsxs)("div", {
                    className: "search",
                    children: [/* @__PURE__ */ (0, n.jsx)(hm, { size: 16 }), /* @__PURE__ */ (0, n.jsx)("input", {
                      "aria-label": "搜尋鏡頭",
                      placeholder: "搜尋場次、鏡頭 ID 或舊編號…",
                      value: je,
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
                    ].join(" ").includes(je)).map((f) => /* @__PURE__ */ (0, n.jsxs)("tr", { children: [
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
                            V(Object.fromEntries(up.map(([ce]) => [ce, f[ce]]))), Y("shot");
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
                      /* @__PURE__ */ (0, n.jsx)(qu, { size: 32 }),
                      /* @__PURE__ */ (0, n.jsx)("h3", { children: "先建立一個實際鏡頭" }),
                      /* @__PURE__ */ (0, n.jsx)("p", { children: "不同來源的鏡號與素材編號填入對照欄，保留原始名稱。" })
                    ]
                  }),
                  /* @__PURE__ */ (0, n.jsx)("div", {
                    className: "inline-note",
                    children: "新版本會保留前次紀錄；填寫檔案位置不會上傳或覆寫原始素材。鏡頭更新後須重新核定。"
                  })
                ]
              }) : T === "issues" ? /* @__PURE__ */ (0, n.jsxs)("section", {
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
                      }), Y("issue");
                    },
                    children: [/* @__PURE__ */ (0, n.jsx)(tn, { size: 16 }), "新增問題"]
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
                            Vt.find((ce) => ce.id === f.stageId)?.title,
                            " ",
                            f.shotId ? "／" + f.shotId : ""
                          ] }),
                          /* @__PURE__ */ (0, n.jsx)("time", { children: pa(f.at) })
                        ]
                      }),
                      /* @__PURE__ */ (0, n.jsx)("p", { children: f.reason }),
                      /* @__PURE__ */ (0, n.jsx)("small", { children: f.by }),
                      f.resolution && /* @__PURE__ */ (0, n.jsxs)("div", {
                        className: "resolution",
                        children: [/* @__PURE__ */ (0, n.jsx)($n, { size: 15 }), f.resolution]
                      }),
                      f.status === "open" && /* @__PURE__ */ (0, n.jsx)("button", {
                        className: "btn",
                        disabled: r.archived,
                        onClick: () => {
                          V({
                            issueId: f.id,
                            resolution: ""
                          }), Y("resolve");
                        },
                        children: "填寫修正並複核"
                      })
                    ]
                  }, f.id))
                }) : /* @__PURE__ */ (0, n.jsxs)("div", {
                  className: "empty",
                  children: [
                    /* @__PURE__ */ (0, n.jsx)($n, { size: 32 }),
                    /* @__PURE__ */ (0, n.jsx)("h3", { children: "目前沒有退修問題" }),
                    /* @__PURE__ */ (0, n.jsx)("p", { children: "發現問題時，請指定造成問題的階段。" })
                  ]
                })]
              }) : T === "chatgpt" ? /* @__PURE__ */ (0, n.jsxs)("section", {
                className: "connection-layout",
                children: [/* @__PURE__ */ (0, n.jsxs)("div", {
                  className: "wide-card",
                  children: [
                    /* @__PURE__ */ (0, n.jsxs)("div", {
                      className: "connection-symbol",
                      children: [
                        /* @__PURE__ */ (0, n.jsx)(bs, { size: 28 }),
                        /* @__PURE__ */ (0, n.jsx)(Iu, { size: 20 }),
                        /* @__PURE__ */ (0, n.jsx)(Wn, { size: 28 })
                      ]
                    }),
                    /* @__PURE__ */ (0, n.jsx)("div", {
                      className: "eyebrow",
                      children: "CHATGPT × 立之雲端庫"
                    }),
                    /* @__PURE__ */ (0, n.jsx)("h2", { children: "讓對話接上製作進度。" }),
                    /* @__PURE__ */ (0, n.jsx)("p", {
                      className: "stage-description",
                      children: "AI 先取得指定任務的有效資料包，實際讀取參考素材，再以相同資料包與版本回報。資訊矛盾、缺件或資料包過期時，停止受影響的工作。"
                    }),
                    /* @__PURE__ */ (0, n.jsxs)("div", {
                      className: "connection-state",
                      children: [/* @__PURE__ */ (0, n.jsx)("i", { className: r.lastMcpAt ? "online-dot" : "gray-dot" }), /* @__PURE__ */ (0, n.jsxs)("div", { children: [/* @__PURE__ */ (0, n.jsx)("b", { children: r.lastMcpAt ? "已收到 ChatGPT 工具寫入" : "等待第一次工具寫入" }), /* @__PURE__ */ (0, n.jsxs)("small", { children: ["最近一次：", pa(r.lastMcpAt)] })] })]
                    }),
                    /* @__PURE__ */ (0, n.jsxs)("ol", {
                      className: "connect-steps",
                      children: [
                        /* @__PURE__ */ (0, n.jsxs)("li", { children: [/* @__PURE__ */ (0, n.jsx)("b", { children: "啟用流程工作台的外掛" }), /* @__PURE__ */ (0, n.jsx)("p", { children: "前往 ChatGPT「外掛／Plugins」→ 個人 → 你建立的外掛，找到「立之雲端庫｜動畫製作流程」，選擇安裝或連接。" })] }),
                        /* @__PURE__ */ (0, n.jsxs)("li", { children: [/* @__PURE__ */ (0, n.jsx)("b", { children: "在對話中選用它" }), /* @__PURE__ */ (0, n.jsx)("p", { children: "開啟新對話，輸入 @ 選取工作台。若沒有顯示工具，重新開啟對話後再試。" })] }),
                        /* @__PURE__ */ (0, n.jsxs)("li", { children: [/* @__PURE__ */ (0, n.jsx)("b", { children: "先取得資料包，再執行與回報" }), /* @__PURE__ */ (0, n.jsx)("p", { children: "先 preview_animation_context，再 acquire_animation_context；完成後 submit_animation_work。資料生效、矛盾裁定與正式核定由作者確認。" })] })
                      ]
                    }),
                    /* @__PURE__ */ (0, n.jsxs)("button", {
                      className: "btn primary",
                      onClick: () => {
                        dp("ChatGPT_流程接續指令.txt", `請使用「立之雲端庫｜動畫製作流程」工具，先讀取專案 ${r.id}（${r.title} ${r.episode}）的進度，使用 preview_animation_context 檢查本次任務範圍，再用 acquire_animation_context 取得保存的有效資料包。僅 records 是有效依據；excluded 與歷史手冊不可當現行設定。needs_input 時先回報受阻。實際讀取全部素材後執行，以資料包 id 與 revision 使用 submit_animation_work 回報成果、閱讀依據與下一步。資料包過期必須重新取得。不得從舊聊天推定完成；AI 不得代替作者確認資料生效或正式核定。`, "text/plain;charset=utf-8");
                      },
                      children: [/* @__PURE__ */ (0, n.jsx)(Ju, { size: 16 }), "下載對話接續指令"]
                    })
                  ]
                }), /* @__PURE__ */ (0, n.jsxs)("div", {
                  className: "wide-card capability-card",
                  children: [
                    /* @__PURE__ */ (0, n.jsx)("h3", { children: "ChatGPT 能做的事" }),
                    [
                      "查看階段、驗收依據與未結問題",
                      "建立製作專案與鏡頭資料",
                      "回報產出、參考版本及初驗結果",
                      "提出退修，保留原因與異動紀錄"
                    ].map((f) => /* @__PURE__ */ (0, n.jsxs)("p", { children: [/* @__PURE__ */ (0, n.jsx)($n, { size: 16 }), f] }, f)),
                    /* @__PURE__ */ (0, n.jsxs)("div", {
                      className: "author-only",
                      children: [
                        /* @__PURE__ */ (0, n.jsx)(ha, { size: 21 }),
                        /* @__PURE__ */ (0, n.jsx)("b", { children: "由你正式確認" }),
                        /* @__PURE__ */ (0, n.jsx)("p", { children: "作者核定、問題結案、鏡頭入片與專案封存。" })
                      ]
                    }),
                    /* @__PURE__ */ (0, n.jsx)("small", { children: "此工作台提供流程與紀錄協作。貼上素材位置後，仍須確保 ChatGPT 能實際取得素材，才能檢查影像或聲音。" })
                  ]
                })]
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
                  children: [...r.audit].reverse().map((f, ce) => /* @__PURE__ */ (0, n.jsxs)("div", { children: [
                    /* @__PURE__ */ (0, n.jsx)("span", {
                      className: "audit-icon " + (f.actor === "ai" ? "ai" : ""),
                      children: f.actor === "ai" ? /* @__PURE__ */ (0, n.jsx)(bs, { size: 17 }) : /* @__PURE__ */ (0, n.jsx)(ha, { size: 17 })
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
                    /* @__PURE__ */ (0, n.jsx)("time", { children: pa(f.at) })
                  ] }, ce))
                })]
              })
            ] }) : /* @__PURE__ */ (0, n.jsxs)("div", {
              className: "onboarding",
              children: [
                /* @__PURE__ */ (0, n.jsx)("div", {
                  className: "onboarding-icon",
                  children: /* @__PURE__ */ (0, n.jsx)(Wn, { size: 34 })
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
                    }), Y("create");
                  },
                  children: [/* @__PURE__ */ (0, n.jsx)(tn, { size: 17 }), "建立第一個製作專案"]
                }),
                /* @__PURE__ */ (0, n.jsx)("div", {
                  className: "onboarding-grid",
                  children: Vt.filter((f) => f.group === "main").map((f) => /* @__PURE__ */ (0, n.jsxs)("div", { children: [/* @__PURE__ */ (0, n.jsx)("span", { children: f.id }), f.title] }, f.id))
                }),
                /* @__PURE__ */ (0, n.jsx)("small", { children: "建立時全部階段為待製作；請依實際成果補入完成紀錄。" })
              ]
            }),
            /* @__PURE__ */ (0, n.jsxs)("footer", { children: ["《現實遊戲》動畫製作流程手冊 v1.0 · 2026.10.19 ", /* @__PURE__ */ (0, n.jsx)("span", { children: "候選成果 → AI 初驗 → 作者核定 → 入片與交付" })] })
          ]
        })]
      }),
      de && /* @__PURE__ */ (0, n.jsxs)("div", {
        className: "toast",
        role: "status",
        children: [/* @__PURE__ */ (0, n.jsx)($n, { size: 17 }), de]
      }),
      Q && /* @__PURE__ */ (0, n.jsx)("div", {
        className: "modal-backdrop",
        onMouseDown: (f) => {
          f.target === f.currentTarget && !L && Y(null);
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
              onClick: () => Y(null),
              children: /* @__PURE__ */ (0, n.jsx)(Ff, { size: 21 })
            })]
          }), /* @__PURE__ */ (0, n.jsxs)("form", {
            onSubmit: It,
            children: [
              Q === "create" ? /* @__PURE__ */ (0, n.jsxs)(n.Fragment, { children: [/* @__PURE__ */ (0, n.jsx)("p", {
                className: "muted",
                children: "依手冊建立完整流程，從待製作開始記錄。"
              }), [["title", "專案名稱"], ["episode", "集數"]].map(([f, ce]) => /* @__PURE__ */ (0, n.jsxs)("label", {
                className: "form-field",
                children: [ce, /* @__PURE__ */ (0, n.jsx)("input", {
                  required: !0,
                  maxLength: f === "title" ? 200 : 60,
                  value: O[f] || "",
                  onChange: (pe) => V({
                    ...O,
                    [f]: pe.target.value
                  })
                })]
              }, f))] }) : Q === "shot" ? /* @__PURE__ */ (0, n.jsxs)(n.Fragment, { children: [
                /* @__PURE__ */ (0, n.jsx)("p", {
                  className: "muted",
                  children: "修改既有鏡頭請使用相同 ID。系統保留前次紀錄，並要求重新驗收。"
                }),
                /* @__PURE__ */ (0, n.jsx)("div", {
                  className: "shot-form",
                  children: up.map(([f, ce]) => /* @__PURE__ */ (0, n.jsxs)("label", {
                    className: "form-field",
                    children: [ce, /* @__PURE__ */ (0, n.jsx)("input", {
                      required: [
                        "id",
                        "scene",
                        "description"
                      ].includes(f),
                      maxLength: f === "id" ? 100 : 12e3,
                      value: O[f] || "",
                      placeholder: f === "id" ? "如 EP01_S06_SH03" : "",
                      onChange: (pe) => V({
                        ...O,
                        [f]: pe.target.value
                      })
                    })]
                  }, f))
                }),
                r?.shots.find((f) => f.id === O.id)?.versions.length ? /* @__PURE__ */ (0, n.jsxs)("details", { children: [/* @__PURE__ */ (0, n.jsx)("summary", { children: "查看保留的舊版本" }), r.shots.find((f) => f.id === O.id).versions.map((f, ce) => /* @__PURE__ */ (0, n.jsxs)("pre", { children: [
                  pa(f.at),
                  " · ",
                  f.by,
                  `
`,
                  JSON.stringify(f.data, null, 2)
                ] }, ce))] }) : null
              ] }) : Q === "issue" ? /* @__PURE__ */ (0, n.jsxs)(n.Fragment, { children: [
                /* @__PURE__ */ (0, n.jsxs)("label", {
                  className: "form-field",
                  children: ["回查階段", /* @__PURE__ */ (0, n.jsx)("select", {
                    value: O.stageId || "08",
                    onChange: (f) => V({
                      ...O,
                      stageId: f.target.value
                    }),
                    children: Ns(r).map((f) => /* @__PURE__ */ (0, n.jsxs)("option", {
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
              q && /* @__PURE__ */ (0, n.jsx)("div", {
                className: "modal-error",
                role: "alert",
                children: q
              }),
              /* @__PURE__ */ (0, n.jsxs)("div", {
                className: "modal-actions",
                children: [/* @__PURE__ */ (0, n.jsx)("button", {
                  type: "button",
                  className: "btn",
                  disabled: L,
                  onClick: () => Y(null),
                  children: "取消"
                }), /* @__PURE__ */ (0, n.jsxs)("button", {
                  type: "submit",
                  className: "btn primary",
                  disabled: L,
                  children: [L ? /* @__PURE__ */ (0, n.jsx)(Hu, {
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
var Xm = `
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

:host{display:block;--bg:#f7f8fa;--ink:#23322e;--muted:#85908b;--green:#326552;--border:#e4e9e6;--mint:#edf4ef;--font:'Noto Sans TC','Microsoft JhengHei',system-ui,sans-serif;color:var(--ink);font:14px/1.6 var(--font);background:var(--bg)}.native-production{min-width:0}.workspace{display:grid;grid-template-columns:230px minmax(0,1fr);min-height:calc(100dvh - 70px)}.sidebar{position:sticky;inset:auto;top:0;width:auto;height:calc(100dvh - 70px);overflow-y:auto;padding-top:20px}.brand{display:none}.main{margin-left:0!important}.topbar{height:48px}.page-content{padding:24px}.cloud-indicator{font-size:11px}.sidebar nav{max-height:none}.side-bottom{padding-top:20px}@media(max-width:850px){.workspace{grid-template-columns:185px minmax(0,1fr)}.page-content{padding:20px}}@media(max-width:600px){.workspace{display:block}.sidebar{position:relative;height:auto;padding:12px 16px 0}.main{margin:0}.topbar{display:none}.page-content{padding:20px 16px}.page-heading{margin-top:0}.page-heading p{max-width:none;font-size:12px}.sidebar .new-project{margin-bottom:6px}h1{font-size:24px}}`, Qm = "https://hrdzywkihfqggiwjgavi.supabase.co/functions/v1/lizhi-production", Ss = /* @__PURE__ */ new WeakMap(), Zm = async (u, v, w) => {
  const r = window.LizhiAuth;
  if (!r?.client) throw new Error("請先登入立之雲端庫");
  const { data: o, error: T } = await r.client.auth.getSession();
  if (T || !o.session?.access_token) throw new Error("登入已失效，請重新登入雲端庫");
  return fetch(Qm + "/" + u + v, {
    cache: "no-store",
    headers: {
      Authorization: "Bearer " + o.session.access_token,
      apikey: window.LIZHI_SUPABASE_PUBLISHABLE_KEY,
      ...w ? { "Content-Type": "application/json" } : {}
    },
    ...w ? {
      method: "POST",
      body: JSON.stringify(w)
    } : {}
  });
};
function Km(u) {
  if (Ss.has(u)) return;
  const v = u.attachShadow({ mode: "open" }), w = document.createElement("style");
  w.textContent = Xm, v.append(w);
  const r = document.createElement("div");
  r.className = "native-production", v.append(r);
  const o = (0, gm.createRoot)(r);
  Ss.set(u, o), o.render(/* @__PURE__ */ (0, n.jsx)(Vm, { nativeTransport: Zm }));
}
function Jm(u) {
  Ss.get(u)?.unmount(), Ss.delete(u);
}
export {
  Km as mount,
  Jm as unmount
};
