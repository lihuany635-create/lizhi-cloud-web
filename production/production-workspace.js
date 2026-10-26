var ia = (r, m) => () => (m || (r((m = { exports: {} }).exports, m), r = null), m.exports), Bh = /* @__PURE__ */ ia(((r) => {
  function m(Z, B) {
    var X = Z.length;
    Z.push(B);
    e: for (; 0 < X; ) {
      var oe = X - 1 >>> 1, ne = Z[oe];
      if (0 < u(ne, B)) Z[oe] = B, Z[X] = ne, X = oe;
      else break e;
    }
  }
  function N(Z) {
    return Z.length === 0 ? null : Z[0];
  }
  function f(Z) {
    if (Z.length === 0) return null;
    var B = Z[0], X = Z.pop();
    if (X !== B) {
      Z[0] = X;
      e: for (var oe = 0, ne = Z.length, Ne = ne >>> 1; oe < Ne; ) {
        var p = 2 * (oe + 1) - 1, D = Z[p], G = p + 1, $ = Z[G];
        if (0 > u(D, X)) G < ne && 0 > u($, D) ? (Z[oe] = $, Z[G] = X, oe = G) : (Z[oe] = D, Z[p] = X, oe = p);
        else if (G < ne && 0 > u($, X)) Z[oe] = $, Z[G] = X, oe = G;
        else break e;
      }
    }
    return B;
  }
  function u(Z, B) {
    var X = Z.sortIndex - B.sortIndex;
    return X !== 0 ? X : Z.id - B.id;
  }
  if (r.unstable_now = void 0, typeof performance == "object" && typeof performance.now == "function") {
    var E = performance;
    r.unstable_now = function() {
      return E.now();
    };
  } else {
    var v = Date, A = v.now();
    r.unstable_now = function() {
      return v.now() - A;
    };
  }
  var w = [], _ = [], y = 1, Q = null, C = 3, te = !1, ae = !1, K = !1, F = !1, le = typeof setTimeout == "function" ? setTimeout : null, H = typeof clearTimeout == "function" ? clearTimeout : null, ie = typeof setImmediate < "u" ? setImmediate : null;
  function V(Z) {
    for (var B = N(_); B !== null; ) {
      if (B.callback === null) f(_);
      else if (B.startTime <= Z) f(_), B.sortIndex = B.expirationTime, m(w, B);
      else break;
      B = N(_);
    }
  }
  function W(Z) {
    if (K = !1, V(Z), !ae) if (N(w) !== null) ae = !0, P || (P = !0, ye());
    else {
      var B = N(_);
      B !== null && ee(W, B.startTime - Z);
    }
  }
  var P = !1, xe = -1, de = 5, J = -1;
  function j() {
    return F ? !0 : !(r.unstable_now() - J < de);
  }
  function I() {
    if (F = !1, P) {
      var Z = r.unstable_now();
      J = Z;
      var B = !0;
      try {
        e: {
          ae = !1, K && (K = !1, H(xe), xe = -1), te = !0;
          var X = C;
          try {
            t: {
              for (V(Z), Q = N(w); Q !== null && !(Q.expirationTime > Z && j()); ) {
                var oe = Q.callback;
                if (typeof oe == "function") {
                  Q.callback = null, C = Q.priorityLevel;
                  var ne = oe(Q.expirationTime <= Z);
                  if (Z = r.unstable_now(), typeof ne == "function") {
                    Q.callback = ne, V(Z), B = !0;
                    break t;
                  }
                  Q === N(w) && f(w), V(Z);
                } else f(w);
                Q = N(w);
              }
              if (Q !== null) B = !0;
              else {
                var Ne = N(_);
                Ne !== null && ee(W, Ne.startTime - Z), B = !1;
              }
            }
            break e;
          } finally {
            Q = null, C = X, te = !1;
          }
          B = void 0;
        }
      } finally {
        B ? ye() : P = !1;
      }
    }
  }
  var ye;
  if (typeof ie == "function") ye = function() {
    ie(I);
  };
  else if (typeof MessageChannel < "u") {
    var fe = new MessageChannel(), g = fe.port2;
    fe.port1.onmessage = I, ye = function() {
      g.postMessage(null);
    };
  } else ye = function() {
    le(I, 0);
  };
  function ee(Z, B) {
    xe = le(function() {
      Z(r.unstable_now());
    }, B);
  }
  r.unstable_IdlePriority = 5, r.unstable_ImmediatePriority = 1, r.unstable_LowPriority = 4, r.unstable_NormalPriority = 3, r.unstable_Profiling = null, r.unstable_UserBlockingPriority = 2, r.unstable_cancelCallback = function(Z) {
    Z.callback = null;
  }, r.unstable_forceFrameRate = function(Z) {
    0 > Z || 125 < Z ? console.error("forceFrameRate takes a positive int between 0 and 125, forcing frame rates higher than 125 fps is not supported") : de = 0 < Z ? Math.floor(1e3 / Z) : 5;
  }, r.unstable_getCurrentPriorityLevel = function() {
    return C;
  }, r.unstable_next = function(Z) {
    switch (C) {
      case 1:
      case 2:
      case 3:
        var B = 3;
        break;
      default:
        B = C;
    }
    var X = C;
    C = B;
    try {
      return Z();
    } finally {
      C = X;
    }
  }, r.unstable_requestPaint = function() {
    F = !0;
  }, r.unstable_runWithPriority = function(Z, B) {
    switch (Z) {
      case 1:
      case 2:
      case 3:
      case 4:
      case 5:
        break;
      default:
        Z = 3;
    }
    var X = C;
    C = Z;
    try {
      return B();
    } finally {
      C = X;
    }
  }, r.unstable_scheduleCallback = function(Z, B, X) {
    var oe = r.unstable_now();
    switch (typeof X == "object" && X !== null ? (X = X.delay, X = typeof X == "number" && 0 < X ? oe + X : oe) : X = oe, Z) {
      case 1:
        var ne = -1;
        break;
      case 2:
        ne = 250;
        break;
      case 5:
        ne = 1073741823;
        break;
      case 4:
        ne = 1e4;
        break;
      default:
        ne = 5e3;
    }
    return ne = X + ne, Z = {
      id: y++,
      callback: B,
      priorityLevel: Z,
      startTime: X,
      expirationTime: ne,
      sortIndex: -1
    }, X > oe ? (Z.sortIndex = X, m(_, Z), N(w) === null && Z === N(_) && (K ? (H(xe), xe = -1) : K = !0, ee(W, X - oe))) : (Z.sortIndex = ne, m(w, Z), ae || te || (ae = !0, P || (P = !0, ye()))), Z;
  }, r.unstable_shouldYield = j, r.unstable_wrapCallback = function(Z) {
    var B = C;
    return function() {
      var X = C;
      C = B;
      try {
        return Z.apply(this, arguments);
      } finally {
        C = X;
      }
    };
  };
})), Gh = /* @__PURE__ */ ia(((r, m) => {
  m.exports = Bh();
})), Yh = /* @__PURE__ */ ia(((r) => {
  var m = /* @__PURE__ */ Symbol.for("react.transitional.element"), N = /* @__PURE__ */ Symbol.for("react.portal"), f = /* @__PURE__ */ Symbol.for("react.fragment"), u = /* @__PURE__ */ Symbol.for("react.strict_mode"), E = /* @__PURE__ */ Symbol.for("react.profiler"), v = /* @__PURE__ */ Symbol.for("react.consumer"), A = /* @__PURE__ */ Symbol.for("react.context"), w = /* @__PURE__ */ Symbol.for("react.forward_ref"), _ = /* @__PURE__ */ Symbol.for("react.suspense"), y = /* @__PURE__ */ Symbol.for("react.memo"), Q = /* @__PURE__ */ Symbol.for("react.lazy"), C = /* @__PURE__ */ Symbol.for("react.activity"), te = Symbol.iterator;
  function ae(p) {
    return p === null || typeof p != "object" ? null : (p = te && p[te] || p["@@iterator"], typeof p == "function" ? p : null);
  }
  var K = {
    isMounted: function() {
      return !1;
    },
    enqueueForceUpdate: function() {
    },
    enqueueReplaceState: function() {
    },
    enqueueSetState: function() {
    }
  }, F = Object.assign, le = {};
  function H(p, D, G) {
    this.props = p, this.context = D, this.refs = le, this.updater = G || K;
  }
  H.prototype.isReactComponent = {}, H.prototype.setState = function(p, D) {
    if (typeof p != "object" && typeof p != "function" && p != null) throw Error("takes an object of state variables to update or a function which returns an object of state variables.");
    this.updater.enqueueSetState(this, p, D, "setState");
  }, H.prototype.forceUpdate = function(p) {
    this.updater.enqueueForceUpdate(this, p, "forceUpdate");
  };
  function ie() {
  }
  ie.prototype = H.prototype;
  function V(p, D, G) {
    this.props = p, this.context = D, this.refs = le, this.updater = G || K;
  }
  var W = V.prototype = new ie();
  W.constructor = V, F(W, H.prototype), W.isPureReactComponent = !0;
  var P = Array.isArray;
  function xe() {
  }
  var de = {
    H: null,
    A: null,
    T: null,
    S: null
  }, J = Object.prototype.hasOwnProperty;
  function j(p, D, G) {
    var $ = G.ref;
    return {
      $$typeof: m,
      type: p,
      key: D,
      ref: $ !== void 0 ? $ : null,
      props: G
    };
  }
  function I(p, D) {
    return j(p.type, D, p.props);
  }
  function ye(p) {
    return typeof p == "object" && p !== null && p.$$typeof === m;
  }
  function fe(p) {
    var D = {
      "=": "=0",
      ":": "=2"
    };
    return "$" + p.replace(/[=:]/g, function(G) {
      return D[G];
    });
  }
  var g = /\/+/g;
  function ee(p, D) {
    return typeof p == "object" && p !== null && p.key != null ? fe("" + p.key) : D.toString(36);
  }
  function Z(p) {
    switch (p.status) {
      case "fulfilled":
        return p.value;
      case "rejected":
        throw p.reason;
      default:
        switch (typeof p.status == "string" ? p.then(xe, xe) : (p.status = "pending", p.then(function(D) {
          p.status === "pending" && (p.status = "fulfilled", p.value = D);
        }, function(D) {
          p.status === "pending" && (p.status = "rejected", p.reason = D);
        })), p.status) {
          case "fulfilled":
            return p.value;
          case "rejected":
            throw p.reason;
        }
    }
    throw p;
  }
  function B(p, D, G, $, pe) {
    var he = typeof p;
    (he === "undefined" || he === "boolean") && (p = null);
    var re = !1;
    if (p === null) re = !0;
    else switch (he) {
      case "bigint":
      case "string":
      case "number":
        re = !0;
        break;
      case "object":
        switch (p.$$typeof) {
          case m:
          case N:
            re = !0;
            break;
          case Q:
            return re = p._init, B(re(p._payload), D, G, $, pe);
        }
    }
    if (re) return pe = pe(p), re = $ === "" ? "." + ee(p, 0) : $, P(pe) ? (G = "", re != null && (G = re.replace(g, "$&/") + "/"), B(pe, D, G, "", function(ft) {
      return ft;
    })) : pe != null && (ye(pe) && (pe = I(pe, G + (pe.key == null || p && p.key === pe.key ? "" : ("" + pe.key).replace(g, "$&/") + "/") + re)), D.push(pe)), 1;
    re = 0;
    var Re = $ === "" ? "." : $ + ":";
    if (P(p)) for (var _e = 0; _e < p.length; _e++) $ = p[_e], he = Re + ee($, _e), re += B($, D, G, he, pe);
    else if (_e = ae(p), typeof _e == "function") for (p = _e.call(p), _e = 0; !($ = p.next()).done; ) $ = $.value, he = Re + ee($, _e++), re += B($, D, G, he, pe);
    else if (he === "object") {
      if (typeof p.then == "function") return B(Z(p), D, G, $, pe);
      throw D = String(p), Error("Objects are not valid as a React child (found: " + (D === "[object Object]" ? "object with keys {" + Object.keys(p).join(", ") + "}" : D) + "). If you meant to render a collection of children, use an array instead.");
    }
    return re;
  }
  function X(p, D, G) {
    if (p == null) return p;
    var $ = [], pe = 0;
    return B(p, $, "", "", function(he) {
      return D.call(G, he, pe++);
    }), $;
  }
  function oe(p) {
    if (p._status === -1) {
      var D = p._result;
      D = D(), D.then(function(G) {
        (p._status === 0 || p._status === -1) && (p._status = 1, p._result = G);
      }, function(G) {
        (p._status === 0 || p._status === -1) && (p._status = 2, p._result = G);
      }), p._status === -1 && (p._status = 0, p._result = D);
    }
    if (p._status === 1) return p._result.default;
    throw p._result;
  }
  var ne = typeof reportError == "function" ? reportError : function(p) {
    if (typeof window == "object" && typeof window.ErrorEvent == "function") {
      var D = new window.ErrorEvent("error", {
        bubbles: !0,
        cancelable: !0,
        message: typeof p == "object" && p !== null && typeof p.message == "string" ? String(p.message) : String(p),
        error: p
      });
      if (!window.dispatchEvent(D)) return;
    } else if (typeof process == "object" && typeof process.emit == "function") {
      process.emit("uncaughtException", p);
      return;
    }
    console.error(p);
  }, Ne = {
    map: X,
    forEach: function(p, D, G) {
      X(p, function() {
        D.apply(this, arguments);
      }, G);
    },
    count: function(p) {
      var D = 0;
      return X(p, function() {
        D++;
      }), D;
    },
    toArray: function(p) {
      return X(p, function(D) {
        return D;
      }) || [];
    },
    only: function(p) {
      if (!ye(p)) throw Error("React.Children.only expected to receive a single React element child.");
      return p;
    }
  };
  r.Activity = C, r.Children = Ne, r.Component = H, r.Fragment = f, r.Profiler = E, r.PureComponent = V, r.StrictMode = u, r.Suspense = _, r.__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE = de, r.__COMPILER_RUNTIME = {
    __proto__: null,
    c: function(p) {
      return de.H.useMemoCache(p);
    }
  }, r.cache = function(p) {
    return function() {
      return p.apply(null, arguments);
    };
  }, r.cacheSignal = function() {
    return null;
  }, r.cloneElement = function(p, D, G) {
    if (p == null) throw Error("The argument must be a React element, but you passed " + p + ".");
    var $ = F({}, p.props), pe = p.key;
    if (D != null) for (he in D.key !== void 0 && (pe = "" + D.key), D) !J.call(D, he) || he === "key" || he === "__self" || he === "__source" || he === "ref" && D.ref === void 0 || ($[he] = D[he]);
    var he = arguments.length - 2;
    if (he === 1) $.children = G;
    else if (1 < he) {
      for (var re = Array(he), Re = 0; Re < he; Re++) re[Re] = arguments[Re + 2];
      $.children = re;
    }
    return j(p.type, pe, $);
  }, r.createContext = function(p) {
    return p = {
      $$typeof: A,
      _currentValue: p,
      _currentValue2: p,
      _threadCount: 0,
      Provider: null,
      Consumer: null
    }, p.Provider = p, p.Consumer = {
      $$typeof: v,
      _context: p
    }, p;
  }, r.createElement = function(p, D, G) {
    var $, pe = {}, he = null;
    if (D != null) for ($ in D.key !== void 0 && (he = "" + D.key), D) J.call(D, $) && $ !== "key" && $ !== "__self" && $ !== "__source" && (pe[$] = D[$]);
    var re = arguments.length - 2;
    if (re === 1) pe.children = G;
    else if (1 < re) {
      for (var Re = Array(re), _e = 0; _e < re; _e++) Re[_e] = arguments[_e + 2];
      pe.children = Re;
    }
    if (p && p.defaultProps) for ($ in re = p.defaultProps, re) pe[$] === void 0 && (pe[$] = re[$]);
    return j(p, he, pe);
  }, r.createRef = function() {
    return { current: null };
  }, r.forwardRef = function(p) {
    return {
      $$typeof: w,
      render: p
    };
  }, r.isValidElement = ye, r.lazy = function(p) {
    return {
      $$typeof: Q,
      _payload: {
        _status: -1,
        _result: p
      },
      _init: oe
    };
  }, r.memo = function(p, D) {
    return {
      $$typeof: y,
      type: p,
      compare: D === void 0 ? null : D
    };
  }, r.startTransition = function(p) {
    var D = de.T, G = {};
    de.T = G;
    try {
      var $ = p(), pe = de.S;
      pe !== null && pe(G, $), typeof $ == "object" && $ !== null && typeof $.then == "function" && $.then(xe, ne);
    } catch (he) {
      ne(he);
    } finally {
      D !== null && G.types !== null && (D.types = G.types), de.T = D;
    }
  }, r.unstable_useCacheRefresh = function() {
    return de.H.useCacheRefresh();
  }, r.use = function(p) {
    return de.H.use(p);
  }, r.useActionState = function(p, D, G) {
    return de.H.useActionState(p, D, G);
  }, r.useCallback = function(p, D) {
    return de.H.useCallback(p, D);
  }, r.useContext = function(p) {
    return de.H.useContext(p);
  }, r.useDebugValue = function() {
  }, r.useDeferredValue = function(p, D) {
    return de.H.useDeferredValue(p, D);
  }, r.useEffect = function(p, D) {
    return de.H.useEffect(p, D);
  }, r.useEffectEvent = function(p) {
    return de.H.useEffectEvent(p);
  }, r.useId = function() {
    return de.H.useId();
  }, r.useImperativeHandle = function(p, D, G) {
    return de.H.useImperativeHandle(p, D, G);
  }, r.useInsertionEffect = function(p, D) {
    return de.H.useInsertionEffect(p, D);
  }, r.useLayoutEffect = function(p, D) {
    return de.H.useLayoutEffect(p, D);
  }, r.useMemo = function(p, D) {
    return de.H.useMemo(p, D);
  }, r.useOptimistic = function(p, D) {
    return de.H.useOptimistic(p, D);
  }, r.useReducer = function(p, D, G) {
    return de.H.useReducer(p, D, G);
  }, r.useRef = function(p) {
    return de.H.useRef(p);
  }, r.useState = function(p) {
    return de.H.useState(p);
  }, r.useSyncExternalStore = function(p, D, G) {
    return de.H.useSyncExternalStore(p, D, G);
  }, r.useTransition = function() {
    return de.H.useTransition();
  }, r.version = "19.2.6";
})), oo = /* @__PURE__ */ ia(((r, m) => {
  m.exports = Yh();
})), Vh = /* @__PURE__ */ ia(((r) => {
  var m = oo();
  function N(_) {
    var y = "https://react.dev/errors/" + _;
    if (1 < arguments.length) {
      y += "?args[]=" + encodeURIComponent(arguments[1]);
      for (var Q = 2; Q < arguments.length; Q++) y += "&args[]=" + encodeURIComponent(arguments[Q]);
    }
    return "Minified React error #" + _ + "; visit " + y + " for the full message or use the non-minified dev environment for full errors and additional helpful warnings.";
  }
  function f() {
  }
  var u = {
    d: {
      f,
      r: function() {
        throw Error(N(522));
      },
      D: f,
      C: f,
      L: f,
      m: f,
      X: f,
      S: f,
      M: f
    },
    p: 0,
    findDOMNode: null
  }, E = /* @__PURE__ */ Symbol.for("react.portal");
  function v(_, y, Q) {
    var C = 3 < arguments.length && arguments[3] !== void 0 ? arguments[3] : null;
    return {
      $$typeof: E,
      key: C == null ? null : "" + C,
      children: _,
      containerInfo: y,
      implementation: Q
    };
  }
  var A = m.__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE;
  function w(_, y) {
    if (_ === "font") return "";
    if (typeof y == "string") return y === "use-credentials" ? y : "";
  }
  r.__DOM_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE = u, r.createPortal = function(_, y) {
    var Q = 2 < arguments.length && arguments[2] !== void 0 ? arguments[2] : null;
    if (!y || y.nodeType !== 1 && y.nodeType !== 9 && y.nodeType !== 11) throw Error(N(299));
    return v(_, y, null, Q);
  }, r.flushSync = function(_) {
    var y = A.T, Q = u.p;
    try {
      if (A.T = null, u.p = 2, _) return _();
    } finally {
      A.T = y, u.p = Q, u.d.f();
    }
  }, r.preconnect = function(_, y) {
    typeof _ == "string" && (y ? (y = y.crossOrigin, y = typeof y == "string" ? y === "use-credentials" ? y : "" : void 0) : y = null, u.d.C(_, y));
  }, r.prefetchDNS = function(_) {
    typeof _ == "string" && u.d.D(_);
  }, r.preinit = function(_, y) {
    if (typeof _ == "string" && y && typeof y.as == "string") {
      var Q = y.as, C = w(Q, y.crossOrigin), te = typeof y.integrity == "string" ? y.integrity : void 0, ae = typeof y.fetchPriority == "string" ? y.fetchPriority : void 0;
      Q === "style" ? u.d.S(_, typeof y.precedence == "string" ? y.precedence : void 0, {
        crossOrigin: C,
        integrity: te,
        fetchPriority: ae
      }) : Q === "script" && u.d.X(_, {
        crossOrigin: C,
        integrity: te,
        fetchPriority: ae,
        nonce: typeof y.nonce == "string" ? y.nonce : void 0
      });
    }
  }, r.preinitModule = function(_, y) {
    if (typeof _ == "string") if (typeof y == "object" && y !== null) {
      if (y.as == null || y.as === "script") {
        var Q = w(y.as, y.crossOrigin);
        u.d.M(_, {
          crossOrigin: Q,
          integrity: typeof y.integrity == "string" ? y.integrity : void 0,
          nonce: typeof y.nonce == "string" ? y.nonce : void 0
        });
      }
    } else y ?? u.d.M(_);
  }, r.preload = function(_, y) {
    if (typeof _ == "string" && typeof y == "object" && y !== null && typeof y.as == "string") {
      var Q = y.as, C = w(Q, y.crossOrigin);
      u.d.L(_, Q, {
        crossOrigin: C,
        integrity: typeof y.integrity == "string" ? y.integrity : void 0,
        nonce: typeof y.nonce == "string" ? y.nonce : void 0,
        type: typeof y.type == "string" ? y.type : void 0,
        fetchPriority: typeof y.fetchPriority == "string" ? y.fetchPriority : void 0,
        referrerPolicy: typeof y.referrerPolicy == "string" ? y.referrerPolicy : void 0,
        imageSrcSet: typeof y.imageSrcSet == "string" ? y.imageSrcSet : void 0,
        imageSizes: typeof y.imageSizes == "string" ? y.imageSizes : void 0,
        media: typeof y.media == "string" ? y.media : void 0
      });
    }
  }, r.preloadModule = function(_, y) {
    if (typeof _ == "string") if (y) {
      var Q = w(y.as, y.crossOrigin);
      u.d.m(_, {
        as: typeof y.as == "string" && y.as !== "script" ? y.as : void 0,
        crossOrigin: Q,
        integrity: typeof y.integrity == "string" ? y.integrity : void 0
      });
    } else u.d.m(_);
  }, r.requestFormReset = function(_) {
    u.d.r(_);
  }, r.unstable_batchedUpdates = function(_, y) {
    return _(y);
  }, r.useFormState = function(_, y, Q) {
    return A.H.useFormState(_, y, Q);
  }, r.useFormStatus = function() {
    return A.H.useHostTransitionStatus();
  }, r.version = "19.2.6";
})), Xh = /* @__PURE__ */ ia(((r, m) => {
  function N() {
    if (!(typeof __REACT_DEVTOOLS_GLOBAL_HOOK__ > "u" || typeof __REACT_DEVTOOLS_GLOBAL_HOOK__.checkDCE != "function"))
      try {
        __REACT_DEVTOOLS_GLOBAL_HOOK__.checkDCE(N);
      } catch (f) {
        console.error(f);
      }
  }
  N(), m.exports = Vh();
})), Qh = /* @__PURE__ */ ia(((r) => {
  var m = Gh(), N = oo(), f = Xh();
  function u(e) {
    var t = "https://react.dev/errors/" + e;
    if (1 < arguments.length) {
      t += "?args[]=" + encodeURIComponent(arguments[1]);
      for (var a = 2; a < arguments.length; a++) t += "&args[]=" + encodeURIComponent(arguments[a]);
    }
    return "Minified React error #" + e + "; visit " + t + " for the full message or use the non-minified dev environment for full errors and additional helpful warnings.";
  }
  function E(e) {
    return !(!e || e.nodeType !== 1 && e.nodeType !== 9 && e.nodeType !== 11);
  }
  function v(e) {
    var t = e, a = e;
    if (e.alternate) for (; t.return; ) t = t.return;
    else {
      e = t;
      do
        t = e, (t.flags & 4098) !== 0 && (a = t.return), e = t.return;
      while (e);
    }
    return t.tag === 3 ? a : null;
  }
  function A(e) {
    if (e.tag === 13) {
      var t = e.memoizedState;
      if (t === null && (e = e.alternate, e !== null && (t = e.memoizedState)), t !== null) return t.dehydrated;
    }
    return null;
  }
  function w(e) {
    if (e.tag === 31) {
      var t = e.memoizedState;
      if (t === null && (e = e.alternate, e !== null && (t = e.memoizedState)), t !== null) return t.dehydrated;
    }
    return null;
  }
  function _(e) {
    if (v(e) !== e) throw Error(u(188));
  }
  function y(e) {
    var t = e.alternate;
    if (!t) {
      if (t = v(e), t === null) throw Error(u(188));
      return t !== e ? null : e;
    }
    for (var a = e, i = t; ; ) {
      var n = a.return;
      if (n === null) break;
      var s = n.alternate;
      if (s === null) {
        if (i = n.return, i !== null) {
          a = i;
          continue;
        }
        break;
      }
      if (n.child === s.child) {
        for (s = n.child; s; ) {
          if (s === a) return _(n), e;
          if (s === i) return _(n), t;
          s = s.sibling;
        }
        throw Error(u(188));
      }
      if (a.return !== i.return) a = n, i = s;
      else {
        for (var c = !1, d = n.child; d; ) {
          if (d === a) {
            c = !0, a = n, i = s;
            break;
          }
          if (d === i) {
            c = !0, i = n, a = s;
            break;
          }
          d = d.sibling;
        }
        if (!c) {
          for (d = s.child; d; ) {
            if (d === a) {
              c = !0, a = s, i = n;
              break;
            }
            if (d === i) {
              c = !0, i = s, a = n;
              break;
            }
            d = d.sibling;
          }
          if (!c) throw Error(u(189));
        }
      }
      if (a.alternate !== i) throw Error(u(190));
    }
    if (a.tag !== 3) throw Error(u(188));
    return a.stateNode.current === a ? e : t;
  }
  function Q(e) {
    var t = e.tag;
    if (t === 5 || t === 26 || t === 27 || t === 6) return e;
    for (e = e.child; e !== null; ) {
      if (t = Q(e), t !== null) return t;
      e = e.sibling;
    }
    return null;
  }
  var C = Object.assign, te = /* @__PURE__ */ Symbol.for("react.element"), ae = /* @__PURE__ */ Symbol.for("react.transitional.element"), K = /* @__PURE__ */ Symbol.for("react.portal"), F = /* @__PURE__ */ Symbol.for("react.fragment"), le = /* @__PURE__ */ Symbol.for("react.strict_mode"), H = /* @__PURE__ */ Symbol.for("react.profiler"), ie = /* @__PURE__ */ Symbol.for("react.consumer"), V = /* @__PURE__ */ Symbol.for("react.context"), W = /* @__PURE__ */ Symbol.for("react.forward_ref"), P = /* @__PURE__ */ Symbol.for("react.suspense"), xe = /* @__PURE__ */ Symbol.for("react.suspense_list"), de = /* @__PURE__ */ Symbol.for("react.memo"), J = /* @__PURE__ */ Symbol.for("react.lazy"), j = /* @__PURE__ */ Symbol.for("react.activity"), I = /* @__PURE__ */ Symbol.for("react.memo_cache_sentinel"), ye = Symbol.iterator;
  function fe(e) {
    return e === null || typeof e != "object" ? null : (e = ye && e[ye] || e["@@iterator"], typeof e == "function" ? e : null);
  }
  var g = /* @__PURE__ */ Symbol.for("react.client.reference");
  function ee(e) {
    if (e == null) return null;
    if (typeof e == "function") return e.$$typeof === g ? null : e.displayName || e.name || null;
    if (typeof e == "string") return e;
    switch (e) {
      case F:
        return "Fragment";
      case H:
        return "Profiler";
      case le:
        return "StrictMode";
      case P:
        return "Suspense";
      case xe:
        return "SuspenseList";
      case j:
        return "Activity";
    }
    if (typeof e == "object") switch (e.$$typeof) {
      case K:
        return "Portal";
      case V:
        return e.displayName || "Context";
      case ie:
        return (e._context.displayName || "Context") + ".Consumer";
      case W:
        var t = e.render;
        return e = e.displayName, e || (e = t.displayName || t.name || "", e = e !== "" ? "ForwardRef(" + e + ")" : "ForwardRef"), e;
      case de:
        return t = e.displayName || null, t !== null ? t : ee(e.type) || "Memo";
      case J:
        t = e._payload, e = e._init;
        try {
          return ee(e(t));
        } catch {
        }
    }
    return null;
  }
  var Z = Array.isArray, B = N.__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE, X = f.__DOM_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE, oe = {
    pending: !1,
    data: null,
    method: null,
    action: null
  }, ne = [], Ne = -1;
  function p(e) {
    return { current: e };
  }
  function D(e) {
    0 > Ne || (e.current = ne[Ne], ne[Ne] = null, Ne--);
  }
  function G(e, t) {
    Ne++, ne[Ne] = e.current, e.current = t;
  }
  var $ = p(null), pe = p(null), he = p(null), re = p(null);
  function Re(e, t) {
    switch (G(he, t), G(pe, e), G($, null), t.nodeType) {
      case 9:
      case 11:
        e = (e = t.documentElement) && (e = e.namespaceURI) ? Tp(e) : 0;
        break;
      default:
        if (e = t.tagName, t = t.namespaceURI) t = Tp(t), e = Cp(t, e);
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
    D($), G($, e);
  }
  function _e() {
    D($), D(pe), D(he);
  }
  function ft(e) {
    e.memoizedState !== null && G(re, e);
    var t = $.current, a = Cp(t, e.type);
    t !== a && (G(pe, e), G($, a));
  }
  function Ie(e) {
    pe.current === e && (D($), D(pe)), re.current === e && (D(re), Wi._currentValue = oe);
  }
  var Oe, je;
  function Ze(e) {
    if (Oe === void 0) try {
      throw Error();
    } catch (a) {
      var t = a.stack.trim().match(/\n( *(at )?)/);
      Oe = t && t[1] || "", je = -1 < a.stack.indexOf(`
    at`) ? " (<anonymous>)" : -1 < a.stack.indexOf("@") ? "@unknown:0:0" : "";
    }
    return `
` + Oe + e + je;
  }
  var rt = !1;
  function o(e, t) {
    if (!e || rt) return "";
    rt = !0;
    var a = Error.prepareStackTrace;
    Error.prepareStackTrace = void 0;
    try {
      var i = { DetermineComponentFrameRoot: function() {
        try {
          if (t) {
            var Y = function() {
              throw Error();
            };
            if (Object.defineProperty(Y.prototype, "props", { set: function() {
              throw Error();
            } }), typeof Reflect == "object" && Reflect.construct) {
              try {
                Reflect.construct(Y, []);
              } catch (U) {
                var O = U;
              }
              Reflect.construct(e, [], Y);
            } else {
              try {
                Y.call();
              } catch (U) {
                O = U;
              }
              e.call(Y.prototype);
            }
          } else {
            try {
              throw Error();
            } catch (U) {
              O = U;
            }
            (Y = e()) && typeof Y.catch == "function" && Y.catch(function() {
            });
          }
        } catch (U) {
          if (U && O && typeof U.stack == "string") return [U.stack, O.stack];
        }
        return [null, null];
      } };
      i.DetermineComponentFrameRoot.displayName = "DetermineComponentFrameRoot";
      var n = Object.getOwnPropertyDescriptor(i.DetermineComponentFrameRoot, "name");
      n && n.configurable && Object.defineProperty(i.DetermineComponentFrameRoot, "name", { value: "DetermineComponentFrameRoot" });
      var s = i.DetermineComponentFrameRoot(), c = s[0], d = s[1];
      if (c && d) {
        var x = c.split(`
`), M = d.split(`
`);
        for (n = i = 0; i < x.length && !x[i].includes("DetermineComponentFrameRoot"); ) i++;
        for (; n < M.length && !M[n].includes("DetermineComponentFrameRoot"); ) n++;
        if (i === x.length || n === M.length) for (i = x.length - 1, n = M.length - 1; 1 <= i && 0 <= n && x[i] !== M[n]; ) n--;
        for (; 1 <= i && 0 <= n; i--, n--) if (x[i] !== M[n]) {
          if (i !== 1 || n !== 1) do
            if (i--, n--, 0 > n || x[i] !== M[n]) {
              var q = `
` + x[i].replace(" at new ", " at ");
              return e.displayName && q.includes("<anonymous>") && (q = q.replace("<anonymous>", e.displayName)), q;
            }
          while (1 <= i && 0 <= n);
          break;
        }
      }
    } finally {
      rt = !1, Error.prepareStackTrace = a;
    }
    return (a = e ? e.displayName || e.name : "") ? Ze(a) : "";
  }
  function R(e, t) {
    switch (e.tag) {
      case 26:
      case 27:
      case 5:
        return Ze(e.type);
      case 16:
        return Ze("Lazy");
      case 13:
        return e.child !== t && t !== null ? Ze("Suspense Fallback") : Ze("Suspense");
      case 19:
        return Ze("SuspenseList");
      case 0:
      case 15:
        return o(e.type, !1);
      case 11:
        return o(e.type.render, !1);
      case 1:
        return o(e.type, !0);
      case 31:
        return Ze("Activity");
      default:
        return "";
    }
  }
  function se(e) {
    try {
      var t = "", a = null;
      do
        t += R(e, a), a = e, e = e.return;
      while (e);
      return t;
    } catch (i) {
      return `
Error generating stack: ` + i.message + `
` + i.stack;
    }
  }
  var qe = Object.prototype.hasOwnProperty, k = m.unstable_scheduleCallback, Se = m.unstable_cancelCallback, We = m.unstable_shouldYield, Jt = m.unstable_requestPaint, et = m.unstable_now, Ja = m.unstable_getCurrentPriorityLevel, jl = m.unstable_ImmediatePriority, Ut = m.unstable_UserBlockingPriority, ea = m.unstable_NormalPriority, Ia = m.unstable_LowPriority, h = m.unstable_IdlePriority, ge = m.log, be = m.unstable_setDisableYieldValue, tt = null, Xe = null;
  function vt(e) {
    if (typeof ge == "function" && be(e), Xe && typeof Xe.setStrictMode == "function") try {
      Xe.setStrictMode(tt, e);
    } catch {
    }
  }
  var ot = Math.clz32 ? Math.clz32 : Of, rn = Math.log, yt = Math.LN2;
  function Of(e) {
    return e >>>= 0, e === 0 ? 32 : 31 - (rn(e) / yt | 0) | 0;
  }
  var on = 256, dn = 262144, un = 4194304;
  function $a(e) {
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
  function pn(e, t, a) {
    var i = e.pendingLanes;
    if (i === 0) return 0;
    var n = 0, s = e.suspendedLanes, c = e.pingedLanes;
    e = e.warmLanes;
    var d = i & 134217727;
    return d !== 0 ? (i = d & ~s, i !== 0 ? n = $a(i) : (c &= d, c !== 0 ? n = $a(c) : a || (a = d & ~e, a !== 0 && (n = $a(a))))) : (d = i & ~s, d !== 0 ? n = $a(d) : c !== 0 ? n = $a(c) : a || (a = i & ~e, a !== 0 && (n = $a(a)))), n === 0 ? 0 : t !== 0 && t !== n && (t & s) === 0 && (s = n & -n, a = t & -t, s >= a || s === 32 && (a & 4194048) !== 0) ? t : n;
  }
  function di(e, t) {
    return (e.pendingLanes & ~(e.suspendedLanes & ~e.pingedLanes) & t) === 0;
  }
  function Df(e, t) {
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
  function po() {
    var e = un;
    return un <<= 1, (un & 62914560) === 0 && (un = 4194304), e;
  }
  function Ds(e) {
    for (var t = [], a = 0; 31 > a; a++) t.push(e);
    return t;
  }
  function fn(e, t) {
    e.pendingLanes |= t, t !== 268435456 && (e.suspendedLanes = 0, e.pingedLanes = 0, e.warmLanes = 0);
  }
  function Uf(e, t, a, i, n, s) {
    var c = e.pendingLanes;
    e.pendingLanes = a, e.suspendedLanes = 0, e.pingedLanes = 0, e.warmLanes = 0, e.expiredLanes &= a, e.entangledLanes &= a, e.errorRecoveryDisabledLanes &= a, e.shellSuspendCounter = 0;
    var d = e.entanglements, x = e.expirationTimes, M = e.hiddenUpdates;
    for (a = c & ~a; 0 < a; ) {
      var q = 31 - ot(a), Y = 1 << q;
      d[q] = 0, x[q] = -1;
      var O = M[q];
      if (O !== null) for (M[q] = null, q = 0; q < O.length; q++) {
        var U = O[q];
        U !== null && (U.lane &= -536870913);
      }
      a &= ~Y;
    }
    i !== 0 && fo(e, i, 0), s !== 0 && n === 0 && e.tag !== 0 && (e.suspendedLanes |= s & ~(c & ~t));
  }
  function fo(e, t, a) {
    e.pendingLanes |= t, e.suspendedLanes &= ~t;
    var i = 31 - ot(t);
    e.entangledLanes |= t, e.entanglements[i] = e.entanglements[i] | 1073741824 | a & 261930;
  }
  function ho(e, t) {
    var a = e.entangledLanes |= t;
    for (e = e.entanglements; a; ) {
      var i = 31 - ot(a), n = 1 << i;
      n & t | e[i] & t && (e[i] |= t), a &= ~n;
    }
  }
  function mo(e, t) {
    var a = t & -t;
    return a = (a & 42) !== 0 ? 1 : xo(a), (a & (e.suspendedLanes | t)) !== 0 ? 0 : a;
  }
  function xo(e) {
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
  function Us(e) {
    return e &= -e, 2 < e ? 8 < e ? (e & 134217727) !== 0 ? 32 : 268435456 : 8 : 2;
  }
  function go() {
    var e = X.p;
    return e !== 0 ? e : (e = window.event, e === void 0 ? 32 : Fp(e.type));
  }
  function bo(e, t) {
    var a = X.p;
    try {
      return X.p = e, t();
    } finally {
      X.p = a;
    }
  }
  var wa = Math.random().toString(36).slice(2), ht = "__reactFiber$" + wa, St = "__reactProps$" + wa, ui = "__reactContainer$" + wa, Rs = "__reactEvents$" + wa, Rf = "__reactListeners$" + wa, qf = "__reactHandles$" + wa, vo = "__reactResources$" + wa, pi = "__reactMarker$" + wa;
  function qs(e) {
    delete e[ht], delete e[St], delete e[Rs], delete e[Rf], delete e[qf];
  }
  function yl(e) {
    var t = e[ht];
    if (t) return t;
    for (var a = e.parentNode; a; ) {
      if (t = a[ui] || a[ht]) {
        if (a = t.alternate, t.child !== null || a !== null && a.child !== null) for (e = Lp(e); e !== null; ) {
          if (a = e[ht]) return a;
          e = Lp(e);
        }
        return t;
      }
      e = a, a = e.parentNode;
    }
    return null;
  }
  function Sl(e) {
    if (e = e[ht] || e[ui]) {
      var t = e.tag;
      if (t === 5 || t === 6 || t === 13 || t === 31 || t === 26 || t === 27 || t === 3) return e;
    }
    return null;
  }
  function fi(e) {
    var t = e.tag;
    if (t === 5 || t === 26 || t === 27 || t === 6) return e.stateNode;
    throw Error(u(33));
  }
  function zl(e) {
    var t = e[vo];
    return t || (t = e[vo] = {
      hoistableStyles: /* @__PURE__ */ new Map(),
      hoistableScripts: /* @__PURE__ */ new Map()
    }), t;
  }
  function ut(e) {
    e[pi] = !0;
  }
  var jo = /* @__PURE__ */ new Set(), yo = {};
  function Wa(e, t) {
    Nl(e, t), Nl(e + "Capture", t);
  }
  function Nl(e, t) {
    for (yo[e] = t, e = 0; e < t.length; e++) jo.add(t[e]);
  }
  var Lf = RegExp("^[:A-Z_a-z\\u00C0-\\u00D6\\u00D8-\\u00F6\\u00F8-\\u02FF\\u0370-\\u037D\\u037F-\\u1FFF\\u200C-\\u200D\\u2070-\\u218F\\u2C00-\\u2FEF\\u3001-\\uD7FF\\uF900-\\uFDCF\\uFDF0-\\uFFFD][:A-Z_a-z\\u00C0-\\u00D6\\u00D8-\\u00F6\\u00F8-\\u02FF\\u0370-\\u037D\\u037F-\\u1FFF\\u200C-\\u200D\\u2070-\\u218F\\u2C00-\\u2FEF\\u3001-\\uD7FF\\uF900-\\uFDCF\\uFDF0-\\uFFFD\\-.0-9\\u00B7\\u0300-\\u036F\\u203F-\\u2040]*$"), So = {}, zo = {};
  function Hf(e) {
    return qe.call(zo, e) ? !0 : qe.call(So, e) ? !1 : Lf.test(e) ? zo[e] = !0 : (So[e] = !0, !1);
  }
  function hn(e, t, a) {
    if (Hf(t)) if (a === null) e.removeAttribute(t);
    else {
      switch (typeof a) {
        case "undefined":
        case "function":
        case "symbol":
          e.removeAttribute(t);
          return;
        case "boolean":
          var i = t.toLowerCase().slice(0, 5);
          if (i !== "data-" && i !== "aria-") {
            e.removeAttribute(t);
            return;
          }
      }
      e.setAttribute(t, "" + a);
    }
  }
  function mn(e, t, a) {
    if (a === null) e.removeAttribute(t);
    else {
      switch (typeof a) {
        case "undefined":
        case "function":
        case "symbol":
        case "boolean":
          e.removeAttribute(t);
          return;
      }
      e.setAttribute(t, "" + a);
    }
  }
  function na(e, t, a, i) {
    if (i === null) e.removeAttribute(a);
    else {
      switch (typeof i) {
        case "undefined":
        case "function":
        case "symbol":
        case "boolean":
          e.removeAttribute(a);
          return;
      }
      e.setAttributeNS(t, a, "" + i);
    }
  }
  function Rt(e) {
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
  function No(e) {
    var t = e.type;
    return (e = e.nodeName) && e.toLowerCase() === "input" && (t === "checkbox" || t === "radio");
  }
  function Bf(e, t, a) {
    var i = Object.getOwnPropertyDescriptor(e.constructor.prototype, t);
    if (!e.hasOwnProperty(t) && typeof i < "u" && typeof i.get == "function" && typeof i.set == "function") {
      var n = i.get, s = i.set;
      return Object.defineProperty(e, t, {
        configurable: !0,
        get: function() {
          return n.call(this);
        },
        set: function(c) {
          a = "" + c, s.call(this, c);
        }
      }), Object.defineProperty(e, t, { enumerable: i.enumerable }), {
        getValue: function() {
          return a;
        },
        setValue: function(c) {
          a = "" + c;
        },
        stopTracking: function() {
          e._valueTracker = null, delete e[t];
        }
      };
    }
  }
  function Ls(e) {
    if (!e._valueTracker) {
      var t = No(e) ? "checked" : "value";
      e._valueTracker = Bf(e, t, "" + e[t]);
    }
  }
  function wo(e) {
    if (!e) return !1;
    var t = e._valueTracker;
    if (!t) return !0;
    var a = t.getValue(), i = "";
    return e && (i = No(e) ? e.checked ? "true" : "false" : e.value), e = i, e !== a ? (t.setValue(e), !0) : !1;
  }
  function xn(e) {
    if (e = e || (typeof document < "u" ? document : void 0), typeof e > "u") return null;
    try {
      return e.activeElement || e.body;
    } catch {
      return e.body;
    }
  }
  var Gf = /[\n"\\]/g;
  function qt(e) {
    return e.replace(Gf, function(t) {
      return "\\" + t.charCodeAt(0).toString(16) + " ";
    });
  }
  function Hs(e, t, a, i, n, s, c, d) {
    e.name = "", c != null && typeof c != "function" && typeof c != "symbol" && typeof c != "boolean" ? e.type = c : e.removeAttribute("type"), t != null ? c === "number" ? (t === 0 && e.value === "" || e.value != t) && (e.value = "" + Rt(t)) : e.value !== "" + Rt(t) && (e.value = "" + Rt(t)) : c !== "submit" && c !== "reset" || e.removeAttribute("value"), t != null ? Bs(e, c, Rt(t)) : a != null ? Bs(e, c, Rt(a)) : i != null && e.removeAttribute("value"), n == null && s != null && (e.defaultChecked = !!s), n != null && (e.checked = n && typeof n != "function" && typeof n != "symbol"), d != null && typeof d != "function" && typeof d != "symbol" && typeof d != "boolean" ? e.name = "" + Rt(d) : e.removeAttribute("name");
  }
  function _o(e, t, a, i, n, s, c, d) {
    if (s != null && typeof s != "function" && typeof s != "symbol" && typeof s != "boolean" && (e.type = s), t != null || a != null) {
      if (!(s !== "submit" && s !== "reset" || t != null)) {
        Ls(e);
        return;
      }
      a = a != null ? "" + Rt(a) : "", t = t != null ? "" + Rt(t) : a, d || t === e.value || (e.value = t), e.defaultValue = t;
    }
    i = i ?? n, i = typeof i != "function" && typeof i != "symbol" && !!i, e.checked = d ? e.checked : !!i, e.defaultChecked = !!i, c != null && typeof c != "function" && typeof c != "symbol" && typeof c != "boolean" && (e.name = c), Ls(e);
  }
  function Bs(e, t, a) {
    t === "number" && xn(e.ownerDocument) === e || e.defaultValue === "" + a || (e.defaultValue = "" + a);
  }
  function wl(e, t, a, i) {
    if (e = e.options, t) {
      t = {};
      for (var n = 0; n < a.length; n++) t["$" + a[n]] = !0;
      for (a = 0; a < e.length; a++) n = t.hasOwnProperty("$" + e[a].value), e[a].selected !== n && (e[a].selected = n), n && i && (e[a].defaultSelected = !0);
    } else {
      for (a = "" + Rt(a), t = null, n = 0; n < e.length; n++) {
        if (e[n].value === a) {
          e[n].selected = !0, i && (e[n].defaultSelected = !0);
          return;
        }
        t !== null || e[n].disabled || (t = e[n]);
      }
      t !== null && (t.selected = !0);
    }
  }
  function ko(e, t, a) {
    if (t != null && (t = "" + Rt(t), t !== e.value && (e.value = t), a == null)) {
      e.defaultValue !== t && (e.defaultValue = t);
      return;
    }
    e.defaultValue = a != null ? "" + Rt(a) : "";
  }
  function Eo(e, t, a, i) {
    if (t == null) {
      if (i != null) {
        if (a != null) throw Error(u(92));
        if (Z(i)) {
          if (1 < i.length) throw Error(u(93));
          i = i[0];
        }
        a = i;
      }
      a ??= "", t = a;
    }
    a = Rt(t), e.defaultValue = a, i = e.textContent, i === a && i !== "" && i !== null && (e.value = i), Ls(e);
  }
  function _l(e, t) {
    if (t) {
      var a = e.firstChild;
      if (a && a === e.lastChild && a.nodeType === 3) {
        a.nodeValue = t;
        return;
      }
    }
    e.textContent = t;
  }
  var Yf = new Set("animationIterationCount aspectRatio borderImageOutset borderImageSlice borderImageWidth boxFlex boxFlexGroup boxOrdinalGroup columnCount columns flex flexGrow flexPositive flexShrink flexNegative flexOrder gridArea gridRow gridRowEnd gridRowSpan gridRowStart gridColumn gridColumnEnd gridColumnSpan gridColumnStart fontWeight lineClamp lineHeight opacity order orphans scale tabSize widows zIndex zoom fillOpacity floodOpacity stopOpacity strokeDasharray strokeDashoffset strokeMiterlimit strokeOpacity strokeWidth MozAnimationIterationCount MozBoxFlex MozBoxFlexGroup MozLineClamp msAnimationIterationCount msFlex msZoom msFlexGrow msFlexNegative msFlexOrder msFlexPositive msFlexShrink msGridColumn msGridColumnSpan msGridRow msGridRowSpan WebkitAnimationIterationCount WebkitBoxFlex WebKitBoxFlexGroup WebkitBoxOrdinalGroup WebkitColumnCount WebkitColumns WebkitFlex WebkitFlexGrow WebkitFlexPositive WebkitFlexShrink WebkitLineClamp".split(" "));
  function Ao(e, t, a) {
    var i = t.indexOf("--") === 0;
    a == null || typeof a == "boolean" || a === "" ? i ? e.setProperty(t, "") : t === "float" ? e.cssFloat = "" : e[t] = "" : i ? e.setProperty(t, a) : typeof a != "number" || a === 0 || Yf.has(t) ? t === "float" ? e.cssFloat = a : e[t] = ("" + a).trim() : e[t] = a + "px";
  }
  function To(e, t, a) {
    if (t != null && typeof t != "object") throw Error(u(62));
    if (e = e.style, a != null) {
      for (var i in a) !a.hasOwnProperty(i) || t != null && t.hasOwnProperty(i) || (i.indexOf("--") === 0 ? e.setProperty(i, "") : i === "float" ? e.cssFloat = "" : e[i] = "");
      for (var n in t) i = t[n], t.hasOwnProperty(n) && a[n] !== i && Ao(e, n, i);
    } else for (var s in t) t.hasOwnProperty(s) && Ao(e, s, t[s]);
  }
  function Gs(e) {
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
  var Vf = /* @__PURE__ */ new Map([
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
  ]), Xf = /^[\u0000-\u001F ]*j[\r\n\t]*a[\r\n\t]*v[\r\n\t]*a[\r\n\t]*s[\r\n\t]*c[\r\n\t]*r[\r\n\t]*i[\r\n\t]*p[\r\n\t]*t[\r\n\t]*:/i;
  function gn(e) {
    return Xf.test("" + e) ? "javascript:throw new Error('React has blocked a javascript: URL as a security precaution.')" : e;
  }
  function sa() {
  }
  var Ys = null;
  function Vs(e) {
    return e = e.target || e.srcElement || window, e.correspondingUseElement && (e = e.correspondingUseElement), e.nodeType === 3 ? e.parentNode : e;
  }
  var kl = null, El = null;
  function Co(e) {
    var t = Sl(e);
    if (t && (e = t.stateNode)) {
      var a = e[St] || null;
      e: switch (e = t.stateNode, t.type) {
        case "input":
          if (Hs(e, a.value, a.defaultValue, a.defaultValue, a.checked, a.defaultChecked, a.type, a.name), t = a.name, a.type === "radio" && t != null) {
            for (a = e; a.parentNode; ) a = a.parentNode;
            for (a = a.querySelectorAll('input[name="' + qt("" + t) + '"][type="radio"]'), t = 0; t < a.length; t++) {
              var i = a[t];
              if (i !== e && i.form === e.form) {
                var n = i[St] || null;
                if (!n) throw Error(u(90));
                Hs(i, n.value, n.defaultValue, n.defaultValue, n.checked, n.defaultChecked, n.type, n.name);
              }
            }
            for (t = 0; t < a.length; t++) i = a[t], i.form === e.form && wo(i);
          }
          break e;
        case "textarea":
          ko(e, a.value, a.defaultValue);
          break e;
        case "select":
          t = a.value, t != null && wl(e, !!a.multiple, t, !1);
      }
    }
  }
  var Xs = !1;
  function Mo(e, t, a) {
    if (Xs) return e(t, a);
    Xs = !0;
    try {
      return e(t);
    } finally {
      if (Xs = !1, (kl !== null || El !== null) && (is(), kl && (t = kl, e = El, El = kl = null, Co(t), e)))
        for (t = 0; t < e.length; t++) Co(e[t]);
    }
  }
  function hi(e, t) {
    var a = e.stateNode;
    if (a === null) return null;
    var i = a[St] || null;
    if (i === null) return null;
    a = i[t];
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
        (i = !i.disabled) || (e = e.type, i = !(e === "button" || e === "input" || e === "select" || e === "textarea")), e = !i;
        break e;
      default:
        e = !1;
    }
    if (e) return null;
    if (a && typeof a != "function") throw Error(u(231, t, typeof a));
    return a;
  }
  var ca = !(typeof window > "u" || typeof window.document > "u" || typeof window.document.createElement > "u"), Qs = !1;
  if (ca) try {
    var mi = {};
    Object.defineProperty(mi, "passive", { get: function() {
      Qs = !0;
    } }), window.addEventListener("test", mi, mi), window.removeEventListener("test", mi, mi);
  } catch {
    Qs = !1;
  }
  var _a = null, Zs = null, bn = null;
  function Oo() {
    if (bn) return bn;
    var e, t = Zs, a = t.length, i, n = "value" in _a ? _a.value : _a.textContent, s = n.length;
    for (e = 0; e < a && t[e] === n[e]; e++) ;
    var c = a - e;
    for (i = 1; i <= c && t[a - i] === n[s - i]; i++) ;
    return bn = n.slice(e, 1 < i ? 1 - i : void 0);
  }
  function vn(e) {
    var t = e.keyCode;
    return "charCode" in e ? (e = e.charCode, e === 0 && t === 13 && (e = 13)) : e = t, e === 10 && (e = 13), 32 <= e || e === 13 ? e : 0;
  }
  function jn() {
    return !0;
  }
  function Do() {
    return !1;
  }
  function zt(e) {
    function t(a, i, n, s, c) {
      this._reactName = a, this._targetInst = n, this.type = i, this.nativeEvent = s, this.target = c, this.currentTarget = null;
      for (var d in e) e.hasOwnProperty(d) && (a = e[d], this[d] = a ? a(s) : s[d]);
      return this.isDefaultPrevented = (s.defaultPrevented != null ? s.defaultPrevented : s.returnValue === !1) ? jn : Do, this.isPropagationStopped = Do, this;
    }
    return C(t.prototype, {
      preventDefault: function() {
        this.defaultPrevented = !0;
        var a = this.nativeEvent;
        a && (a.preventDefault ? a.preventDefault() : typeof a.returnValue != "unknown" && (a.returnValue = !1), this.isDefaultPrevented = jn);
      },
      stopPropagation: function() {
        var a = this.nativeEvent;
        a && (a.stopPropagation ? a.stopPropagation() : typeof a.cancelBubble != "unknown" && (a.cancelBubble = !0), this.isPropagationStopped = jn);
      },
      persist: function() {
      },
      isPersistent: jn
    }), t;
  }
  var Fa = {
    eventPhase: 0,
    bubbles: 0,
    cancelable: 0,
    timeStamp: function(e) {
      return e.timeStamp || Date.now();
    },
    defaultPrevented: 0,
    isTrusted: 0
  }, yn = zt(Fa), xi = C({}, Fa, {
    view: 0,
    detail: 0
  }), Qf = zt(xi), Ks, Js, gi, Sn = C({}, xi, {
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
    getModifierState: $s,
    button: 0,
    buttons: 0,
    relatedTarget: function(e) {
      return e.relatedTarget === void 0 ? e.fromElement === e.srcElement ? e.toElement : e.fromElement : e.relatedTarget;
    },
    movementX: function(e) {
      return "movementX" in e ? e.movementX : (e !== gi && (gi && e.type === "mousemove" ? (Ks = e.screenX - gi.screenX, Js = e.screenY - gi.screenY) : Js = Ks = 0, gi = e), Ks);
    },
    movementY: function(e) {
      return "movementY" in e ? e.movementY : Js;
    }
  }), Uo = zt(Sn), Zf = zt(C({}, Sn, { dataTransfer: 0 })), Is = zt(C({}, xi, { relatedTarget: 0 })), Kf = zt(C({}, Fa, {
    animationName: 0,
    elapsedTime: 0,
    pseudoElement: 0
  })), Jf = zt(C({}, Fa, { clipboardData: function(e) {
    return "clipboardData" in e ? e.clipboardData : window.clipboardData;
  } })), Ro = zt(C({}, Fa, { data: 0 })), If = {
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
  }, $f = {
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
  }, Wf = {
    Alt: "altKey",
    Control: "ctrlKey",
    Meta: "metaKey",
    Shift: "shiftKey"
  };
  function Ff(e) {
    var t = this.nativeEvent;
    return t.getModifierState ? t.getModifierState(e) : (e = Wf[e]) ? !!t[e] : !1;
  }
  function $s() {
    return Ff;
  }
  var Pf = zt(C({}, xi, {
    key: function(e) {
      if (e.key) {
        var t = If[e.key] || e.key;
        if (t !== "Unidentified") return t;
      }
      return e.type === "keypress" ? (e = vn(e), e === 13 ? "Enter" : String.fromCharCode(e)) : e.type === "keydown" || e.type === "keyup" ? $f[e.keyCode] || "Unidentified" : "";
    },
    code: 0,
    location: 0,
    ctrlKey: 0,
    shiftKey: 0,
    altKey: 0,
    metaKey: 0,
    repeat: 0,
    locale: 0,
    getModifierState: $s,
    charCode: function(e) {
      return e.type === "keypress" ? vn(e) : 0;
    },
    keyCode: function(e) {
      return e.type === "keydown" || e.type === "keyup" ? e.keyCode : 0;
    },
    which: function(e) {
      return e.type === "keypress" ? vn(e) : e.type === "keydown" || e.type === "keyup" ? e.keyCode : 0;
    }
  })), qo = zt(C({}, Sn, {
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
  })), e0 = zt(C({}, xi, {
    touches: 0,
    targetTouches: 0,
    changedTouches: 0,
    altKey: 0,
    metaKey: 0,
    ctrlKey: 0,
    shiftKey: 0,
    getModifierState: $s
  })), t0 = zt(C({}, Fa, {
    propertyName: 0,
    elapsedTime: 0,
    pseudoElement: 0
  })), a0 = zt(C({}, Sn, {
    deltaX: function(e) {
      return "deltaX" in e ? e.deltaX : "wheelDeltaX" in e ? -e.wheelDeltaX : 0;
    },
    deltaY: function(e) {
      return "deltaY" in e ? e.deltaY : "wheelDeltaY" in e ? -e.wheelDeltaY : "wheelDelta" in e ? -e.wheelDelta : 0;
    },
    deltaZ: 0,
    deltaMode: 0
  })), l0 = zt(C({}, Fa, {
    newState: 0,
    oldState: 0
  })), i0 = [
    9,
    13,
    27,
    32
  ], Ws = ca && "CompositionEvent" in window, bi = null;
  ca && "documentMode" in document && (bi = document.documentMode);
  var n0 = ca && "TextEvent" in window && !bi, Lo = ca && (!Ws || bi && 8 < bi && 11 >= bi), Ho = " ", Bo = !1;
  function Go(e, t) {
    switch (e) {
      case "keyup":
        return i0.indexOf(t.keyCode) !== -1;
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
  function Yo(e) {
    return e = e.detail, typeof e == "object" && "data" in e ? e.data : null;
  }
  var Al = !1;
  function s0(e, t) {
    switch (e) {
      case "compositionend":
        return Yo(t);
      case "keypress":
        return t.which !== 32 ? null : (Bo = !0, Ho);
      case "textInput":
        return e = t.data, e === Ho && Bo ? null : e;
      default:
        return null;
    }
  }
  function c0(e, t) {
    if (Al) return e === "compositionend" || !Ws && Go(e, t) ? (e = Oo(), bn = Zs = _a = null, Al = !1, e) : null;
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
        return Lo && t.locale !== "ko" ? null : t.data;
      default:
        return null;
    }
  }
  var r0 = {
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
  function Vo(e) {
    var t = e && e.nodeName && e.nodeName.toLowerCase();
    return t === "input" ? !!r0[e.type] : t === "textarea";
  }
  function Xo(e, t, a, i) {
    kl ? El ? El.push(i) : El = [i] : kl = i, t = us(t, "onChange"), 0 < t.length && (a = new yn("onChange", "change", null, a, i), e.push({
      event: a,
      listeners: t
    }));
  }
  var vi = null, ji = null;
  function o0(e) {
    zp(e, 0);
  }
  function zn(e) {
    if (wo(fi(e))) return e;
  }
  function Qo(e, t) {
    if (e === "change") return t;
  }
  var Zo = !1;
  if (ca) {
    var Fs;
    if (ca) {
      var Ps = "oninput" in document;
      if (!Ps) {
        var Ko = document.createElement("div");
        Ko.setAttribute("oninput", "return;"), Ps = typeof Ko.oninput == "function";
      }
      Fs = Ps;
    } else Fs = !1;
    Zo = Fs && (!document.documentMode || 9 < document.documentMode);
  }
  function Jo() {
    vi && (vi.detachEvent("onpropertychange", Io), ji = vi = null);
  }
  function Io(e) {
    if (e.propertyName === "value" && zn(ji)) {
      var t = [];
      Xo(t, ji, e, Vs(e)), Mo(o0, t);
    }
  }
  function d0(e, t, a) {
    e === "focusin" ? (Jo(), vi = t, ji = a, vi.attachEvent("onpropertychange", Io)) : e === "focusout" && Jo();
  }
  function u0(e) {
    if (e === "selectionchange" || e === "keyup" || e === "keydown") return zn(ji);
  }
  function p0(e, t) {
    if (e === "click") return zn(t);
  }
  function f0(e, t) {
    if (e === "input" || e === "change") return zn(t);
  }
  function h0(e, t) {
    return e === t && (e !== 0 || 1 / e === 1 / t) || e !== e && t !== t;
  }
  var At = typeof Object.is == "function" ? Object.is : h0;
  function yi(e, t) {
    if (At(e, t)) return !0;
    if (typeof e != "object" || e === null || typeof t != "object" || t === null) return !1;
    var a = Object.keys(e), i = Object.keys(t);
    if (a.length !== i.length) return !1;
    for (i = 0; i < a.length; i++) {
      var n = a[i];
      if (!qe.call(t, n) || !At(e[n], t[n])) return !1;
    }
    return !0;
  }
  function $o(e) {
    for (; e && e.firstChild; ) e = e.firstChild;
    return e;
  }
  function Wo(e, t) {
    var a = $o(e);
    e = 0;
    for (var i; a; ) {
      if (a.nodeType === 3) {
        if (i = e + a.textContent.length, e <= t && i >= t) return {
          node: a,
          offset: t - e
        };
        e = i;
      }
      e: {
        for (; a; ) {
          if (a.nextSibling) {
            a = a.nextSibling;
            break e;
          }
          a = a.parentNode;
        }
        a = void 0;
      }
      a = $o(a);
    }
  }
  function Fo(e, t) {
    return e && t ? e === t ? !0 : e && e.nodeType === 3 ? !1 : t && t.nodeType === 3 ? Fo(e, t.parentNode) : "contains" in e ? e.contains(t) : e.compareDocumentPosition ? !!(e.compareDocumentPosition(t) & 16) : !1 : !1;
  }
  function Po(e) {
    e = e != null && e.ownerDocument != null && e.ownerDocument.defaultView != null ? e.ownerDocument.defaultView : window;
    for (var t = xn(e.document); t instanceof e.HTMLIFrameElement; ) {
      try {
        var a = typeof t.contentWindow.location.href == "string";
      } catch {
        a = !1;
      }
      if (a) e = t.contentWindow;
      else break;
      t = xn(e.document);
    }
    return t;
  }
  function ec(e) {
    var t = e && e.nodeName && e.nodeName.toLowerCase();
    return t && (t === "input" && (e.type === "text" || e.type === "search" || e.type === "tel" || e.type === "url" || e.type === "password") || t === "textarea" || e.contentEditable === "true");
  }
  var m0 = ca && "documentMode" in document && 11 >= document.documentMode, Tl = null, tc = null, Si = null, ac = !1;
  function ed(e, t, a) {
    var i = a.window === a ? a.document : a.nodeType === 9 ? a : a.ownerDocument;
    ac || Tl == null || Tl !== xn(i) || (i = Tl, "selectionStart" in i && ec(i) ? i = {
      start: i.selectionStart,
      end: i.selectionEnd
    } : (i = (i.ownerDocument && i.ownerDocument.defaultView || window).getSelection(), i = {
      anchorNode: i.anchorNode,
      anchorOffset: i.anchorOffset,
      focusNode: i.focusNode,
      focusOffset: i.focusOffset
    }), Si && yi(Si, i) || (Si = i, i = us(tc, "onSelect"), 0 < i.length && (t = new yn("onSelect", "select", null, t, a), e.push({
      event: t,
      listeners: i
    }), t.target = Tl)));
  }
  function Pa(e, t) {
    var a = {};
    return a[e.toLowerCase()] = t.toLowerCase(), a["Webkit" + e] = "webkit" + t, a["Moz" + e] = "moz" + t, a;
  }
  var Cl = {
    animationend: Pa("Animation", "AnimationEnd"),
    animationiteration: Pa("Animation", "AnimationIteration"),
    animationstart: Pa("Animation", "AnimationStart"),
    transitionrun: Pa("Transition", "TransitionRun"),
    transitionstart: Pa("Transition", "TransitionStart"),
    transitioncancel: Pa("Transition", "TransitionCancel"),
    transitionend: Pa("Transition", "TransitionEnd")
  }, lc = {}, td = {};
  ca && (td = document.createElement("div").style, "AnimationEvent" in window || (delete Cl.animationend.animation, delete Cl.animationiteration.animation, delete Cl.animationstart.animation), "TransitionEvent" in window || delete Cl.transitionend.transition);
  function el(e) {
    if (lc[e]) return lc[e];
    if (!Cl[e]) return e;
    var t = Cl[e], a;
    for (a in t) if (t.hasOwnProperty(a) && a in td) return lc[e] = t[a];
    return e;
  }
  var ad = el("animationend"), ld = el("animationiteration"), id = el("animationstart"), x0 = el("transitionrun"), g0 = el("transitionstart"), b0 = el("transitioncancel"), nd = el("transitionend"), sd = /* @__PURE__ */ new Map(), ic = "abort auxClick beforeToggle cancel canPlay canPlayThrough click close contextMenu copy cut drag dragEnd dragEnter dragExit dragLeave dragOver dragStart drop durationChange emptied encrypted ended error gotPointerCapture input invalid keyDown keyPress keyUp load loadedData loadedMetadata loadStart lostPointerCapture mouseDown mouseMove mouseOut mouseOver mouseUp paste pause play playing pointerCancel pointerDown pointerMove pointerOut pointerOver pointerUp progress rateChange reset resize seeked seeking stalled submit suspend timeUpdate touchCancel touchEnd touchStart volumeChange scroll toggle touchMove waiting wheel".split(" ");
  ic.push("scrollEnd");
  function It(e, t) {
    sd.set(e, t), Wa(t, [e]);
  }
  var Nn = typeof reportError == "function" ? reportError : function(e) {
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
  }, Lt = [], Ml = 0, nc = 0;
  function wn() {
    for (var e = Ml, t = nc = Ml = 0; t < e; ) {
      var a = Lt[t];
      Lt[t++] = null;
      var i = Lt[t];
      Lt[t++] = null;
      var n = Lt[t];
      Lt[t++] = null;
      var s = Lt[t];
      if (Lt[t++] = null, i !== null && n !== null) {
        var c = i.pending;
        c === null ? n.next = n : (n.next = c.next, c.next = n), i.pending = n;
      }
      s !== 0 && cd(a, n, s);
    }
  }
  function _n(e, t, a, i) {
    Lt[Ml++] = e, Lt[Ml++] = t, Lt[Ml++] = a, Lt[Ml++] = i, nc |= i, e.lanes |= i, e = e.alternate, e !== null && (e.lanes |= i);
  }
  function sc(e, t, a, i) {
    return _n(e, t, a, i), kn(e);
  }
  function tl(e, t) {
    return _n(e, null, null, t), kn(e);
  }
  function cd(e, t, a) {
    e.lanes |= a;
    var i = e.alternate;
    i !== null && (i.lanes |= a);
    for (var n = !1, s = e.return; s !== null; ) s.childLanes |= a, i = s.alternate, i !== null && (i.childLanes |= a), s.tag === 22 && (e = s.stateNode, e === null || e._visibility & 1 || (n = !0)), e = s, s = s.return;
    return e.tag === 3 ? (s = e.stateNode, n && t !== null && (n = 31 - ot(a), e = s.hiddenUpdates, i = e[n], i === null ? e[n] = [t] : i.push(t), t.lane = a | 536870912), s) : null;
  }
  function kn(e) {
    if (50 < Xi) throw Xi = 0, mr = null, Error(u(185));
    for (var t = e.return; t !== null; ) e = t, t = e.return;
    return e.tag === 3 ? e.stateNode : null;
  }
  var Ol = {};
  function v0(e, t, a, i) {
    this.tag = e, this.key = a, this.sibling = this.child = this.return = this.stateNode = this.type = this.elementType = null, this.index = 0, this.refCleanup = this.ref = null, this.pendingProps = t, this.dependencies = this.memoizedState = this.updateQueue = this.memoizedProps = null, this.mode = i, this.subtreeFlags = this.flags = 0, this.deletions = null, this.childLanes = this.lanes = 0, this.alternate = null;
  }
  function Tt(e, t, a, i) {
    return new v0(e, t, a, i);
  }
  function cc(e) {
    return e = e.prototype, !(!e || !e.isReactComponent);
  }
  function ra(e, t) {
    var a = e.alternate;
    return a === null ? (a = Tt(e.tag, t, e.key, e.mode), a.elementType = e.elementType, a.type = e.type, a.stateNode = e.stateNode, a.alternate = e, e.alternate = a) : (a.pendingProps = t, a.type = e.type, a.flags = 0, a.subtreeFlags = 0, a.deletions = null), a.flags = e.flags & 65011712, a.childLanes = e.childLanes, a.lanes = e.lanes, a.child = e.child, a.memoizedProps = e.memoizedProps, a.memoizedState = e.memoizedState, a.updateQueue = e.updateQueue, t = e.dependencies, a.dependencies = t === null ? null : {
      lanes: t.lanes,
      firstContext: t.firstContext
    }, a.sibling = e.sibling, a.index = e.index, a.ref = e.ref, a.refCleanup = e.refCleanup, a;
  }
  function rd(e, t) {
    e.flags &= 65011714;
    var a = e.alternate;
    return a === null ? (e.childLanes = 0, e.lanes = t, e.child = null, e.subtreeFlags = 0, e.memoizedProps = null, e.memoizedState = null, e.updateQueue = null, e.dependencies = null, e.stateNode = null) : (e.childLanes = a.childLanes, e.lanes = a.lanes, e.child = a.child, e.subtreeFlags = 0, e.deletions = null, e.memoizedProps = a.memoizedProps, e.memoizedState = a.memoizedState, e.updateQueue = a.updateQueue, e.type = a.type, t = a.dependencies, e.dependencies = t === null ? null : {
      lanes: t.lanes,
      firstContext: t.firstContext
    }), e;
  }
  function En(e, t, a, i, n, s) {
    var c = 0;
    if (i = e, typeof e == "function") cc(e) && (c = 1);
    else if (typeof e == "string") c = wh(e, a, $.current) ? 26 : e === "html" || e === "head" || e === "body" ? 27 : 5;
    else e: switch (e) {
      case j:
        return e = Tt(31, a, t, n), e.elementType = j, e.lanes = s, e;
      case F:
        return al(a.children, n, s, t);
      case le:
        c = 8, n |= 24;
        break;
      case H:
        return e = Tt(12, a, t, n | 2), e.elementType = H, e.lanes = s, e;
      case P:
        return e = Tt(13, a, t, n), e.elementType = P, e.lanes = s, e;
      case xe:
        return e = Tt(19, a, t, n), e.elementType = xe, e.lanes = s, e;
      default:
        if (typeof e == "object" && e !== null) switch (e.$$typeof) {
          case V:
            c = 10;
            break e;
          case ie:
            c = 9;
            break e;
          case W:
            c = 11;
            break e;
          case de:
            c = 14;
            break e;
          case J:
            c = 16, i = null;
            break e;
        }
        c = 29, a = Error(u(130, e === null ? "null" : typeof e, "")), i = null;
    }
    return t = Tt(c, a, t, n), t.elementType = e, t.type = i, t.lanes = s, t;
  }
  function al(e, t, a, i) {
    return e = Tt(7, e, i, t), e.lanes = a, e;
  }
  function rc(e, t, a) {
    return e = Tt(6, e, null, t), e.lanes = a, e;
  }
  function od(e) {
    var t = Tt(18, null, null, 0);
    return t.stateNode = e, t;
  }
  function oc(e, t, a) {
    return t = Tt(4, e.children !== null ? e.children : [], e.key, t), t.lanes = a, t.stateNode = {
      containerInfo: e.containerInfo,
      pendingChildren: null,
      implementation: e.implementation
    }, t;
  }
  var dd = /* @__PURE__ */ new WeakMap();
  function Ht(e, t) {
    if (typeof e == "object" && e !== null) {
      var a = dd.get(e);
      return a !== void 0 ? a : (t = {
        value: e,
        source: t,
        stack: se(t)
      }, dd.set(e, t), t);
    }
    return {
      value: e,
      source: t,
      stack: se(t)
    };
  }
  var Dl = [], Ul = 0, An = null, zi = 0, Bt = [], Gt = 0, ka = null, ta = 1, aa = "";
  function oa(e, t) {
    Dl[Ul++] = zi, Dl[Ul++] = An, An = e, zi = t;
  }
  function ud(e, t, a) {
    Bt[Gt++] = ta, Bt[Gt++] = aa, Bt[Gt++] = ka, ka = e;
    var i = ta;
    e = aa;
    var n = 32 - ot(i) - 1;
    i &= ~(1 << n), a += 1;
    var s = 32 - ot(t) + n;
    if (30 < s) {
      var c = n - n % 5;
      s = (i & (1 << c) - 1).toString(32), i >>= c, n -= c, ta = 1 << 32 - ot(t) + n | a << n | i, aa = s + e;
    } else ta = 1 << s | a << n | i, aa = e;
  }
  function dc(e) {
    e.return !== null && (oa(e, 1), ud(e, 1, 0));
  }
  function uc(e) {
    for (; e === An; ) An = Dl[--Ul], Dl[Ul] = null, zi = Dl[--Ul], Dl[Ul] = null;
    for (; e === ka; ) ka = Bt[--Gt], Bt[Gt] = null, aa = Bt[--Gt], Bt[Gt] = null, ta = Bt[--Gt], Bt[Gt] = null;
  }
  function pd(e, t) {
    Bt[Gt++] = ta, Bt[Gt++] = aa, Bt[Gt++] = ka, ta = t.id, aa = t.overflow, ka = e;
  }
  var mt = null, Ke = null, Ce = !1, Ea = null, Yt = !1, pc = Error(u(519));
  function Aa(e) {
    throw Ni(Ht(Error(u(418, 1 < arguments.length && arguments[1] !== void 0 && arguments[1] ? "text" : "HTML", "")), e)), pc;
  }
  function fd(e) {
    var t = e.stateNode, a = e.type, i = e.memoizedProps;
    switch (t[ht] = e, t[St] = i, a) {
      case "dialog":
        Ee("cancel", t), Ee("close", t);
        break;
      case "iframe":
      case "object":
      case "embed":
        Ee("load", t);
        break;
      case "video":
      case "audio":
        for (a = 0; a < Zi.length; a++) Ee(Zi[a], t);
        break;
      case "source":
        Ee("error", t);
        break;
      case "img":
      case "image":
      case "link":
        Ee("error", t), Ee("load", t);
        break;
      case "details":
        Ee("toggle", t);
        break;
      case "input":
        Ee("invalid", t), _o(t, i.value, i.defaultValue, i.checked, i.defaultChecked, i.type, i.name, !0);
        break;
      case "select":
        Ee("invalid", t);
        break;
      case "textarea":
        Ee("invalid", t), Eo(t, i.value, i.defaultValue, i.children);
    }
    a = i.children, typeof a != "string" && typeof a != "number" && typeof a != "bigint" || t.textContent === "" + a || i.suppressHydrationWarning === !0 || Ep(t.textContent, a) ? (i.popover != null && (Ee("beforetoggle", t), Ee("toggle", t)), i.onScroll != null && Ee("scroll", t), i.onScrollEnd != null && Ee("scrollend", t), i.onClick != null && (t.onclick = sa), t = !0) : t = !1, t || Aa(e, !0);
  }
  function hd(e) {
    for (mt = e.return; mt; ) switch (mt.tag) {
      case 5:
      case 31:
      case 13:
        Yt = !1;
        return;
      case 27:
      case 3:
        Yt = !0;
        return;
      default:
        mt = mt.return;
    }
  }
  function Rl(e) {
    if (e !== mt) return !1;
    if (!Ce) return hd(e), Ce = !0, !1;
    var t = e.tag, a;
    if ((a = t !== 3 && t !== 27) && ((a = t === 5) && (a = e.type, a = !(a !== "form" && a !== "button") || Ar(e.type, e.memoizedProps)), a = !a), a && Ke && Aa(e), hd(e), t === 13) {
      if (e = e.memoizedState, e = e !== null ? e.dehydrated : null, !e) throw Error(u(317));
      Ke = qp(e);
    } else if (t === 31) {
      if (e = e.memoizedState, e = e !== null ? e.dehydrated : null, !e) throw Error(u(317));
      Ke = qp(e);
    } else t === 27 ? (t = Ke, Ga(e.type) ? (e = Dr, Dr = null, Ke = e) : Ke = t) : Ke = mt ? Qt(e.stateNode.nextSibling) : null;
    return !0;
  }
  function ll() {
    Ke = mt = null, Ce = !1;
  }
  function fc() {
    var e = Ea;
    return e !== null && (kt === null ? kt = e : kt.push.apply(kt, e), Ea = null), e;
  }
  function Ni(e) {
    Ea === null ? Ea = [e] : Ea.push(e);
  }
  var hc = p(null), il = null, da = null;
  function Ta(e, t, a) {
    G(hc, t._currentValue), t._currentValue = a;
  }
  function ua(e) {
    e._currentValue = hc.current, D(hc);
  }
  function mc(e, t, a) {
    for (; e !== null; ) {
      var i = e.alternate;
      if ((e.childLanes & t) !== t ? (e.childLanes |= t, i !== null && (i.childLanes |= t)) : i !== null && (i.childLanes & t) !== t && (i.childLanes |= t), e === a) break;
      e = e.return;
    }
  }
  function xc(e, t, a, i) {
    var n = e.child;
    for (n !== null && (n.return = e); n !== null; ) {
      var s = n.dependencies;
      if (s !== null) {
        var c = n.child;
        s = s.firstContext;
        e: for (; s !== null; ) {
          var d = s;
          s = n;
          for (var x = 0; x < t.length; x++) if (d.context === t[x]) {
            s.lanes |= a, d = s.alternate, d !== null && (d.lanes |= a), mc(s.return, a, e), i || (c = null);
            break e;
          }
          s = d.next;
        }
      } else if (n.tag === 18) {
        if (c = n.return, c === null) throw Error(u(341));
        c.lanes |= a, s = c.alternate, s !== null && (s.lanes |= a), mc(c, a, e), c = null;
      } else c = n.child;
      if (c !== null) c.return = n;
      else for (c = n; c !== null; ) {
        if (c === e) {
          c = null;
          break;
        }
        if (n = c.sibling, n !== null) {
          n.return = c.return, c = n;
          break;
        }
        c = c.return;
      }
      n = c;
    }
  }
  function ql(e, t, a, i) {
    e = null;
    for (var n = t, s = !1; n !== null; ) {
      if (!s) {
        if ((n.flags & 524288) !== 0) s = !0;
        else if ((n.flags & 262144) !== 0) break;
      }
      if (n.tag === 10) {
        var c = n.alternate;
        if (c === null) throw Error(u(387));
        if (c = c.memoizedProps, c !== null) {
          var d = n.type;
          At(n.pendingProps.value, c.value) || (e !== null ? e.push(d) : e = [d]);
        }
      } else if (n === re.current) {
        if (c = n.alternate, c === null) throw Error(u(387));
        c.memoizedState.memoizedState !== n.memoizedState.memoizedState && (e !== null ? e.push(Wi) : e = [Wi]);
      }
      n = n.return;
    }
    e !== null && xc(t, e, a, i), t.flags |= 262144;
  }
  function Tn(e) {
    for (e = e.firstContext; e !== null; ) {
      if (!At(e.context._currentValue, e.memoizedValue)) return !0;
      e = e.next;
    }
    return !1;
  }
  function nl(e) {
    il = e, da = null, e = e.dependencies, e !== null && (e.firstContext = null);
  }
  function xt(e) {
    return md(il, e);
  }
  function Cn(e, t) {
    return il === null && nl(e), md(e, t);
  }
  function md(e, t) {
    var a = t._currentValue;
    if (t = {
      context: t,
      memoizedValue: a,
      next: null
    }, da === null) {
      if (e === null) throw Error(u(308));
      da = t, e.dependencies = {
        lanes: 0,
        firstContext: t
      }, e.flags |= 524288;
    } else da = da.next = t;
    return a;
  }
  var j0 = typeof AbortController < "u" ? AbortController : function() {
    var e = [], t = this.signal = {
      aborted: !1,
      addEventListener: function(a, i) {
        e.push(i);
      }
    };
    this.abort = function() {
      t.aborted = !0, e.forEach(function(a) {
        return a();
      });
    };
  }, y0 = m.unstable_scheduleCallback, S0 = m.unstable_NormalPriority, it = {
    $$typeof: V,
    Consumer: null,
    Provider: null,
    _currentValue: null,
    _currentValue2: null,
    _threadCount: 0
  };
  function gc() {
    return {
      controller: new j0(),
      data: /* @__PURE__ */ new Map(),
      refCount: 0
    };
  }
  function wi(e) {
    e.refCount--, e.refCount === 0 && y0(S0, function() {
      e.controller.abort();
    });
  }
  var _i = null, bc = 0, Ll = 0, Hl = null;
  function z0(e, t) {
    if (_i === null) {
      var a = _i = [];
      bc = 0, Ll = yr(), Hl = {
        status: "pending",
        value: void 0,
        then: function(i) {
          a.push(i);
        }
      };
    }
    return bc++, t.then(xd, xd), t;
  }
  function xd() {
    if (--bc === 0 && _i !== null) {
      Hl !== null && (Hl.status = "fulfilled");
      var e = _i;
      _i = null, Ll = 0, Hl = null;
      for (var t = 0; t < e.length; t++) (0, e[t])();
    }
  }
  function N0(e, t) {
    var a = [], i = {
      status: "pending",
      value: null,
      reason: null,
      then: function(n) {
        a.push(n);
      }
    };
    return e.then(function() {
      i.status = "fulfilled", i.value = t;
      for (var n = 0; n < a.length; n++) (0, a[n])(t);
    }, function(n) {
      for (i.status = "rejected", i.reason = n, n = 0; n < a.length; n++) (0, a[n])(void 0);
    }), i;
  }
  var gd = B.S;
  B.S = function(e, t) {
    Wu = et(), typeof t == "object" && t !== null && typeof t.then == "function" && z0(e, t), gd !== null && gd(e, t);
  };
  var sl = p(null);
  function vc() {
    var e = sl.current;
    return e !== null ? e : Qe.pooledCache;
  }
  function Mn(e, t) {
    t === null ? G(sl, sl.current) : G(sl, t.pool);
  }
  function bd() {
    var e = vc();
    return e === null ? null : {
      parent: it._currentValue,
      pool: e
    };
  }
  var Bl = Error(u(460)), jc = Error(u(474)), On = Error(u(542)), Dn = { then: function() {
  } };
  function vd(e) {
    return e = e.status, e === "fulfilled" || e === "rejected";
  }
  function jd(e, t, a) {
    switch (a = e[a], a === void 0 ? e.push(t) : a !== t && (t.then(sa, sa), t = a), t.status) {
      case "fulfilled":
        return t.value;
      case "rejected":
        throw e = t.reason, Sd(e), e;
      default:
        if (typeof t.status == "string") t.then(sa, sa);
        else {
          if (e = Qe, e !== null && 100 < e.shellSuspendCounter) throw Error(u(482));
          e = t, e.status = "pending", e.then(function(i) {
            if (t.status === "pending") {
              var n = t;
              n.status = "fulfilled", n.value = i;
            }
          }, function(i) {
            if (t.status === "pending") {
              var n = t;
              n.status = "rejected", n.reason = i;
            }
          });
        }
        switch (t.status) {
          case "fulfilled":
            return t.value;
          case "rejected":
            throw e = t.reason, Sd(e), e;
        }
        throw rl = t, Bl;
    }
  }
  function cl(e) {
    try {
      var t = e._init;
      return t(e._payload);
    } catch (a) {
      throw a !== null && typeof a == "object" && typeof a.then == "function" ? (rl = a, Bl) : a;
    }
  }
  var rl = null;
  function yd() {
    if (rl === null) throw Error(u(459));
    var e = rl;
    return rl = null, e;
  }
  function Sd(e) {
    if (e === Bl || e === On) throw Error(u(483));
  }
  var Gl = null, ki = 0;
  function Un(e) {
    var t = ki;
    return ki += 1, Gl === null && (Gl = []), jd(Gl, e, t);
  }
  function Ei(e, t) {
    t = t.props.ref, e.ref = t !== void 0 ? t : null;
  }
  function Rn(e, t) {
    throw t.$$typeof === te ? Error(u(525)) : (e = Object.prototype.toString.call(t), Error(u(31, e === "[object Object]" ? "object with keys {" + Object.keys(t).join(", ") + "}" : e)));
  }
  function zd(e) {
    function t(z, b) {
      if (e) {
        var T = z.deletions;
        T === null ? (z.deletions = [b], z.flags |= 16) : T.push(b);
      }
    }
    function a(z, b) {
      if (!e) return null;
      for (; b !== null; ) t(z, b), b = b.sibling;
      return null;
    }
    function i(z) {
      for (var b = /* @__PURE__ */ new Map(); z !== null; ) z.key !== null ? b.set(z.key, z) : b.set(z.index, z), z = z.sibling;
      return b;
    }
    function n(z, b) {
      return z = ra(z, b), z.index = 0, z.sibling = null, z;
    }
    function s(z, b, T) {
      return z.index = T, e ? (T = z.alternate, T !== null ? (T = T.index, T < b ? (z.flags |= 67108866, b) : T) : (z.flags |= 67108866, b)) : (z.flags |= 1048576, b);
    }
    function c(z) {
      return e && z.alternate === null && (z.flags |= 67108866), z;
    }
    function d(z, b, T, L) {
      return b === null || b.tag !== 6 ? (b = rc(T, z.mode, L), b.return = z, b) : (b = n(b, T), b.return = z, b);
    }
    function x(z, b, T, L) {
      var me = T.type;
      return me === F ? q(z, b, T.props.children, L, T.key) : b !== null && (b.elementType === me || typeof me == "object" && me !== null && me.$$typeof === J && cl(me) === b.type) ? (b = n(b, T.props), Ei(b, T), b.return = z, b) : (b = En(T.type, T.key, T.props, null, z.mode, L), Ei(b, T), b.return = z, b);
    }
    function M(z, b, T, L) {
      return b === null || b.tag !== 4 || b.stateNode.containerInfo !== T.containerInfo || b.stateNode.implementation !== T.implementation ? (b = oc(T, z.mode, L), b.return = z, b) : (b = n(b, T.children || []), b.return = z, b);
    }
    function q(z, b, T, L, me) {
      return b === null || b.tag !== 7 ? (b = al(T, z.mode, L, me), b.return = z, b) : (b = n(b, T), b.return = z, b);
    }
    function Y(z, b, T) {
      if (typeof b == "string" && b !== "" || typeof b == "number" || typeof b == "bigint") return b = rc("" + b, z.mode, T), b.return = z, b;
      if (typeof b == "object" && b !== null) {
        switch (b.$$typeof) {
          case ae:
            return T = En(b.type, b.key, b.props, null, z.mode, T), Ei(T, b), T.return = z, T;
          case K:
            return b = oc(b, z.mode, T), b.return = z, b;
          case J:
            return b = cl(b), Y(z, b, T);
        }
        if (Z(b) || fe(b)) return b = al(b, z.mode, T, null), b.return = z, b;
        if (typeof b.then == "function") return Y(z, Un(b), T);
        if (b.$$typeof === V) return Y(z, Cn(z, b), T);
        Rn(z, b);
      }
      return null;
    }
    function O(z, b, T, L) {
      var me = b !== null ? b.key : null;
      if (typeof T == "string" && T !== "" || typeof T == "number" || typeof T == "bigint") return me !== null ? null : d(z, b, "" + T, L);
      if (typeof T == "object" && T !== null) {
        switch (T.$$typeof) {
          case ae:
            return T.key === me ? x(z, b, T, L) : null;
          case K:
            return T.key === me ? M(z, b, T, L) : null;
          case J:
            return T = cl(T), O(z, b, T, L);
        }
        if (Z(T) || fe(T)) return me !== null ? null : q(z, b, T, L, null);
        if (typeof T.then == "function") return O(z, b, Un(T), L);
        if (T.$$typeof === V) return O(z, b, Cn(z, T), L);
        Rn(z, T);
      }
      return null;
    }
    function U(z, b, T, L, me) {
      if (typeof L == "string" && L !== "" || typeof L == "number" || typeof L == "bigint") return z = z.get(T) || null, d(b, z, "" + L, me);
      if (typeof L == "object" && L !== null) {
        switch (L.$$typeof) {
          case ae:
            return z = z.get(L.key === null ? T : L.key) || null, x(b, z, L, me);
          case K:
            return z = z.get(L.key === null ? T : L.key) || null, M(b, z, L, me);
          case J:
            return L = cl(L), U(z, b, T, L, me);
        }
        if (Z(L) || fe(L)) return z = z.get(T) || null, q(b, z, L, me, null);
        if (typeof L.then == "function") return U(z, b, T, Un(L), me);
        if (L.$$typeof === V) return U(z, b, T, Cn(b, L), me);
        Rn(b, L);
      }
      return null;
    }
    function ce(z, b, T, L) {
      for (var me = null, De = null, ue = b, we = b = 0, Te = null; ue !== null && we < T.length; we++) {
        ue.index > we ? (Te = ue, ue = null) : Te = ue.sibling;
        var Ue = O(z, ue, T[we], L);
        if (Ue === null) {
          ue === null && (ue = Te);
          break;
        }
        e && ue && Ue.alternate === null && t(z, ue), b = s(Ue, b, we), De === null ? me = Ue : De.sibling = Ue, De = Ue, ue = Te;
      }
      if (we === T.length) return a(z, ue), Ce && oa(z, we), me;
      if (ue === null) {
        for (; we < T.length; we++) ue = Y(z, T[we], L), ue !== null && (b = s(ue, b, we), De === null ? me = ue : De.sibling = ue, De = ue);
        return Ce && oa(z, we), me;
      }
      for (ue = i(ue); we < T.length; we++) Te = U(ue, z, we, T[we], L), Te !== null && (e && Te.alternate !== null && ue.delete(Te.key === null ? we : Te.key), b = s(Te, b, we), De === null ? me = Te : De.sibling = Te, De = Te);
      return e && ue.forEach(function(Za) {
        return t(z, Za);
      }), Ce && oa(z, we), me;
    }
    function ve(z, b, T, L) {
      if (T == null) throw Error(u(151));
      for (var me = null, De = null, ue = b, we = b = 0, Te = null, Ue = T.next(); ue !== null && !Ue.done; we++, Ue = T.next()) {
        ue.index > we ? (Te = ue, ue = null) : Te = ue.sibling;
        var Za = O(z, ue, Ue.value, L);
        if (Za === null) {
          ue === null && (ue = Te);
          break;
        }
        e && ue && Za.alternate === null && t(z, ue), b = s(Za, b, we), De === null ? me = Za : De.sibling = Za, De = Za, ue = Te;
      }
      if (Ue.done) return a(z, ue), Ce && oa(z, we), me;
      if (ue === null) {
        for (; !Ue.done; we++, Ue = T.next()) Ue = Y(z, Ue.value, L), Ue !== null && (b = s(Ue, b, we), De === null ? me = Ue : De.sibling = Ue, De = Ue);
        return Ce && oa(z, we), me;
      }
      for (ue = i(ue); !Ue.done; we++, Ue = T.next()) Ue = U(ue, z, we, Ue.value, L), Ue !== null && (e && Ue.alternate !== null && ue.delete(Ue.key === null ? we : Ue.key), b = s(Ue, b, we), De === null ? me = Ue : De.sibling = Ue, De = Ue);
      return e && ue.forEach(function(Hh) {
        return t(z, Hh);
      }), Ce && oa(z, we), me;
    }
    function Ve(z, b, T, L) {
      if (typeof T == "object" && T !== null && T.type === F && T.key === null && (T = T.props.children), typeof T == "object" && T !== null) {
        switch (T.$$typeof) {
          case ae:
            e: {
              for (var me = T.key; b !== null; ) {
                if (b.key === me) {
                  if (me = T.type, me === F) {
                    if (b.tag === 7) {
                      a(z, b.sibling), L = n(b, T.props.children), L.return = z, z = L;
                      break e;
                    }
                  } else if (b.elementType === me || typeof me == "object" && me !== null && me.$$typeof === J && cl(me) === b.type) {
                    a(z, b.sibling), L = n(b, T.props), Ei(L, T), L.return = z, z = L;
                    break e;
                  }
                  a(z, b);
                  break;
                } else t(z, b);
                b = b.sibling;
              }
              T.type === F ? (L = al(T.props.children, z.mode, L, T.key), L.return = z, z = L) : (L = En(T.type, T.key, T.props, null, z.mode, L), Ei(L, T), L.return = z, z = L);
            }
            return c(z);
          case K:
            e: {
              for (me = T.key; b !== null; ) {
                if (b.key === me) if (b.tag === 4 && b.stateNode.containerInfo === T.containerInfo && b.stateNode.implementation === T.implementation) {
                  a(z, b.sibling), L = n(b, T.children || []), L.return = z, z = L;
                  break e;
                } else {
                  a(z, b);
                  break;
                }
                else t(z, b);
                b = b.sibling;
              }
              L = oc(T, z.mode, L), L.return = z, z = L;
            }
            return c(z);
          case J:
            return T = cl(T), Ve(z, b, T, L);
        }
        if (Z(T)) return ce(z, b, T, L);
        if (fe(T)) {
          if (me = fe(T), typeof me != "function") throw Error(u(150));
          return T = me.call(T), ve(z, b, T, L);
        }
        if (typeof T.then == "function") return Ve(z, b, Un(T), L);
        if (T.$$typeof === V) return Ve(z, b, Cn(z, T), L);
        Rn(z, T);
      }
      return typeof T == "string" && T !== "" || typeof T == "number" || typeof T == "bigint" ? (T = "" + T, b !== null && b.tag === 6 ? (a(z, b.sibling), L = n(b, T), L.return = z, z = L) : (a(z, b), L = rc(T, z.mode, L), L.return = z, z = L), c(z)) : a(z, b);
    }
    return function(z, b, T, L) {
      try {
        ki = 0;
        var me = Ve(z, b, T, L);
        return Gl = null, me;
      } catch (ue) {
        if (ue === Bl || ue === On) throw ue;
        var De = Tt(29, ue, null, z.mode);
        return De.lanes = L, De.return = z, De;
      }
    };
  }
  var ol = zd(!0), Nd = zd(!1), Ca = !1;
  function yc(e) {
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
  function Sc(e, t) {
    e = e.updateQueue, t.updateQueue === e && (t.updateQueue = {
      baseState: e.baseState,
      firstBaseUpdate: e.firstBaseUpdate,
      lastBaseUpdate: e.lastBaseUpdate,
      shared: e.shared,
      callbacks: null
    });
  }
  function dl(e) {
    return {
      lane: e,
      tag: 0,
      payload: null,
      callback: null,
      next: null
    };
  }
  function ul(e, t, a) {
    var i = e.updateQueue;
    if (i === null) return null;
    if (i = i.shared, (Le & 2) !== 0) {
      var n = i.pending;
      return n === null ? t.next = t : (t.next = n.next, n.next = t), i.pending = t, t = kn(e), cd(e, null, a), t;
    }
    return _n(e, i, t, a), kn(e);
  }
  function Ai(e, t, a) {
    if (t = t.updateQueue, t !== null && (t = t.shared, (a & 4194048) !== 0)) {
      var i = t.lanes;
      i &= e.pendingLanes, a |= i, t.lanes = a, ho(e, a);
    }
  }
  function zc(e, t) {
    var a = e.updateQueue, i = e.alternate;
    if (i !== null && (i = i.updateQueue, a === i)) {
      var n = null, s = null;
      if (a = a.firstBaseUpdate, a !== null) {
        do {
          var c = {
            lane: a.lane,
            tag: a.tag,
            payload: a.payload,
            callback: null,
            next: null
          };
          s === null ? n = s = c : s = s.next = c, a = a.next;
        } while (a !== null);
        s === null ? n = s = t : s = s.next = t;
      } else n = s = t;
      a = {
        baseState: i.baseState,
        firstBaseUpdate: n,
        lastBaseUpdate: s,
        shared: i.shared,
        callbacks: i.callbacks
      }, e.updateQueue = a;
      return;
    }
    e = a.lastBaseUpdate, e === null ? a.firstBaseUpdate = t : e.next = t, a.lastBaseUpdate = t;
  }
  var Nc = !1;
  function Ti() {
    if (Nc) {
      var e = Hl;
      if (e !== null) throw e;
    }
  }
  function Ci(e, t, a, i) {
    Nc = !1;
    var n = e.updateQueue;
    Ca = !1;
    var s = n.firstBaseUpdate, c = n.lastBaseUpdate, d = n.shared.pending;
    if (d !== null) {
      n.shared.pending = null;
      var x = d, M = x.next;
      x.next = null, c === null ? s = M : c.next = M, c = x;
      var q = e.alternate;
      q !== null && (q = q.updateQueue, d = q.lastBaseUpdate, d !== c && (d === null ? q.firstBaseUpdate = M : d.next = M, q.lastBaseUpdate = x));
    }
    if (s !== null) {
      var Y = n.baseState;
      c = 0, q = M = x = null, d = s;
      do {
        var O = d.lane & -536870913, U = O !== d.lane;
        if (U ? (Ae & O) === O : (i & O) === O) {
          O !== 0 && O === Ll && (Nc = !0), q !== null && (q = q.next = {
            lane: 0,
            tag: d.tag,
            payload: d.payload,
            callback: null,
            next: null
          });
          e: {
            var ce = e, ve = d;
            O = t;
            var Ve = a;
            switch (ve.tag) {
              case 1:
                if (ce = ve.payload, typeof ce == "function") {
                  Y = ce.call(Ve, Y, O);
                  break e;
                }
                Y = ce;
                break e;
              case 3:
                ce.flags = ce.flags & -65537 | 128;
              case 0:
                if (ce = ve.payload, O = typeof ce == "function" ? ce.call(Ve, Y, O) : ce, O == null) break e;
                Y = C({}, Y, O);
                break e;
              case 2:
                Ca = !0;
            }
          }
          O = d.callback, O !== null && (e.flags |= 64, U && (e.flags |= 8192), U = n.callbacks, U === null ? n.callbacks = [O] : U.push(O));
        } else U = {
          lane: O,
          tag: d.tag,
          payload: d.payload,
          callback: d.callback,
          next: null
        }, q === null ? (M = q = U, x = Y) : q = q.next = U, c |= O;
        if (d = d.next, d === null) {
          if (d = n.shared.pending, d === null) break;
          U = d, d = U.next, U.next = null, n.lastBaseUpdate = U, n.shared.pending = null;
        }
      } while (!0);
      q === null && (x = Y), n.baseState = x, n.firstBaseUpdate = M, n.lastBaseUpdate = q, s === null && (n.shared.lanes = 0), Ra |= c, e.lanes = c, e.memoizedState = Y;
    }
  }
  function wd(e, t) {
    if (typeof e != "function") throw Error(u(191, e));
    e.call(t);
  }
  function _d(e, t) {
    var a = e.callbacks;
    if (a !== null) for (e.callbacks = null, e = 0; e < a.length; e++) wd(a[e], t);
  }
  var Yl = p(null), qn = p(0);
  function kd(e, t) {
    e = ja, G(qn, e), G(Yl, t), ja = e | t.baseLanes;
  }
  function wc() {
    G(qn, ja), G(Yl, Yl.current);
  }
  function _c() {
    ja = qn.current, D(Yl), D(qn);
  }
  var Ct = p(null), Vt = null;
  function Ma(e) {
    var t = e.alternate;
    G(at, at.current & 1), G(Ct, e), Vt === null && (t === null || Yl.current !== null || t.memoizedState !== null) && (Vt = e);
  }
  function kc(e) {
    G(at, at.current), G(Ct, e), Vt === null && (Vt = e);
  }
  function Ed(e) {
    e.tag === 22 ? (G(at, at.current), G(Ct, e), Vt === null && (Vt = e)) : Oa(e);
  }
  function Oa() {
    G(at, at.current), G(Ct, Ct.current);
  }
  function Mt(e) {
    D(Ct), Vt === e && (Vt = null), D(at);
  }
  var at = p(0);
  function Ln(e) {
    for (var t = e; t !== null; ) {
      if (t.tag === 13) {
        var a = t.memoizedState;
        if (a !== null && (a = a.dehydrated, a === null || Mr(a) || Or(a))) return t;
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
  var pa = 0, ze = null, Ge = null, nt = null, Hn = !1, Vl = !1, pl = !1, Bn = 0, Mi = 0, Xl = null, w0 = 0;
  function Fe() {
    throw Error(u(321));
  }
  function Ec(e, t) {
    if (t === null) return !1;
    for (var a = 0; a < t.length && a < e.length; a++) if (!At(e[a], t[a])) return !1;
    return !0;
  }
  function Ac(e, t, a, i, n, s) {
    return pa = s, ze = t, t.memoizedState = null, t.updateQueue = null, t.lanes = 0, B.H = e === null || e.memoizedState === null ? uu : Xc, pl = !1, s = a(i, n), pl = !1, Vl && (s = Td(t, a, i, n)), Ad(e), s;
  }
  function Ad(e) {
    B.H = Ui;
    var t = Ge !== null && Ge.next !== null;
    if (pa = 0, nt = Ge = ze = null, Hn = !1, Mi = 0, Xl = null, t) throw Error(u(300));
    e === null || st || (e = e.dependencies, e !== null && Tn(e) && (st = !0));
  }
  function Td(e, t, a, i) {
    ze = e;
    var n = 0;
    do {
      if (Vl && (Xl = null), Mi = 0, Vl = !1, 25 <= n) throw Error(u(301));
      if (n += 1, nt = Ge = null, e.updateQueue != null) {
        var s = e.updateQueue;
        s.lastEffect = null, s.events = null, s.stores = null, s.memoCache != null && (s.memoCache.index = 0);
      }
      B.H = pu, s = t(a, i);
    } while (Vl);
    return s;
  }
  function _0() {
    var e = B.H, t = e.useState()[0];
    return t = typeof t.then == "function" ? Oi(t) : t, e = e.useState()[0], (Ge !== null ? Ge.memoizedState : null) !== e && (ze.flags |= 1024), t;
  }
  function Tc() {
    var e = Bn !== 0;
    return Bn = 0, e;
  }
  function Cc(e, t, a) {
    t.updateQueue = e.updateQueue, t.flags &= -2053, e.lanes &= ~a;
  }
  function Mc(e) {
    if (Hn) {
      for (e = e.memoizedState; e !== null; ) {
        var t = e.queue;
        t !== null && (t.pending = null), e = e.next;
      }
      Hn = !1;
    }
    pa = 0, nt = Ge = ze = null, Vl = !1, Mi = Bn = 0, Xl = null;
  }
  function jt() {
    var e = {
      memoizedState: null,
      baseState: null,
      baseQueue: null,
      queue: null,
      next: null
    };
    return nt === null ? ze.memoizedState = nt = e : nt = nt.next = e, nt;
  }
  function lt() {
    if (Ge === null) {
      var e = ze.alternate;
      e = e !== null ? e.memoizedState : null;
    } else e = Ge.next;
    var t = nt === null ? ze.memoizedState : nt.next;
    if (t !== null) nt = t, Ge = e;
    else {
      if (e === null)
        throw ze.alternate === null ? Error(u(467)) : Error(u(310));
      Ge = e, e = {
        memoizedState: Ge.memoizedState,
        baseState: Ge.baseState,
        baseQueue: Ge.baseQueue,
        queue: Ge.queue,
        next: null
      }, nt === null ? ze.memoizedState = nt = e : nt = nt.next = e;
    }
    return nt;
  }
  function Gn() {
    return {
      lastEffect: null,
      events: null,
      stores: null,
      memoCache: null
    };
  }
  function Oi(e) {
    var t = Mi;
    return Mi += 1, Xl === null && (Xl = []), e = jd(Xl, e, t), t = ze, (nt === null ? t.memoizedState : nt.next) === null && (t = t.alternate, B.H = t === null || t.memoizedState === null ? uu : Xc), e;
  }
  function Yn(e) {
    if (e !== null && typeof e == "object") {
      if (typeof e.then == "function") return Oi(e);
      if (e.$$typeof === V) return xt(e);
    }
    throw Error(u(438, String(e)));
  }
  function Oc(e) {
    var t = null, a = ze.updateQueue;
    if (a !== null && (t = a.memoCache), t == null) {
      var i = ze.alternate;
      i !== null && (i = i.updateQueue, i !== null && (i = i.memoCache, i != null && (t = {
        data: i.data.map(function(n) {
          return n.slice();
        }),
        index: 0
      })));
    }
    if (t ??= {
      data: [],
      index: 0
    }, a === null && (a = Gn(), ze.updateQueue = a), a.memoCache = t, a = t.data[t.index], a === void 0) for (a = t.data[t.index] = Array(e), i = 0; i < e; i++) a[i] = I;
    return t.index++, a;
  }
  function fa(e, t) {
    return typeof t == "function" ? t(e) : t;
  }
  function Vn(e) {
    return Dc(lt(), Ge, e);
  }
  function Dc(e, t, a) {
    var i = e.queue;
    if (i === null) throw Error(u(311));
    i.lastRenderedReducer = a;
    var n = e.baseQueue, s = i.pending;
    if (s !== null) {
      if (n !== null) {
        var c = n.next;
        n.next = s.next, s.next = c;
      }
      t.baseQueue = n = s, i.pending = null;
    }
    if (s = e.baseState, n === null) e.memoizedState = s;
    else {
      t = n.next;
      var d = c = null, x = null, M = t, q = !1;
      do {
        var Y = M.lane & -536870913;
        if (Y !== M.lane ? (Ae & Y) === Y : (pa & Y) === Y) {
          var O = M.revertLane;
          if (O === 0) x !== null && (x = x.next = {
            lane: 0,
            revertLane: 0,
            gesture: null,
            action: M.action,
            hasEagerState: M.hasEagerState,
            eagerState: M.eagerState,
            next: null
          }), Y === Ll && (q = !0);
          else if ((pa & O) === O) {
            M = M.next, O === Ll && (q = !0);
            continue;
          } else Y = {
            lane: 0,
            revertLane: M.revertLane,
            gesture: null,
            action: M.action,
            hasEagerState: M.hasEagerState,
            eagerState: M.eagerState,
            next: null
          }, x === null ? (d = x = Y, c = s) : x = x.next = Y, ze.lanes |= O, Ra |= O;
          Y = M.action, pl && a(s, Y), s = M.hasEagerState ? M.eagerState : a(s, Y);
        } else O = {
          lane: Y,
          revertLane: M.revertLane,
          gesture: M.gesture,
          action: M.action,
          hasEagerState: M.hasEagerState,
          eagerState: M.eagerState,
          next: null
        }, x === null ? (d = x = O, c = s) : x = x.next = O, ze.lanes |= Y, Ra |= Y;
        M = M.next;
      } while (M !== null && M !== t);
      if (x === null ? c = s : x.next = d, !At(s, e.memoizedState) && (st = !0, q && (a = Hl, a !== null))) throw a;
      e.memoizedState = s, e.baseState = c, e.baseQueue = x, i.lastRenderedState = s;
    }
    return n === null && (i.lanes = 0), [e.memoizedState, i.dispatch];
  }
  function Uc(e) {
    var t = lt(), a = t.queue;
    if (a === null) throw Error(u(311));
    a.lastRenderedReducer = e;
    var i = a.dispatch, n = a.pending, s = t.memoizedState;
    if (n !== null) {
      a.pending = null;
      var c = n = n.next;
      do
        s = e(s, c.action), c = c.next;
      while (c !== n);
      At(s, t.memoizedState) || (st = !0), t.memoizedState = s, t.baseQueue === null && (t.baseState = s), a.lastRenderedState = s;
    }
    return [s, i];
  }
  function Cd(e, t, a) {
    var i = ze, n = lt(), s = Ce;
    if (s) {
      if (a === void 0) throw Error(u(407));
      a = a();
    } else a = t();
    var c = !At((Ge || n).memoizedState, a);
    if (c && (n.memoizedState = a, st = !0), n = n.queue, Lc(Dd.bind(null, i, n, e), [e]), n.getSnapshot !== t || c || nt !== null && nt.memoizedState.tag & 1) {
      if (i.flags |= 2048, Ql(9, { destroy: void 0 }, Od.bind(null, i, n, a, t), null), Qe === null) throw Error(u(349));
      s || (pa & 127) !== 0 || Md(i, t, a);
    }
    return a;
  }
  function Md(e, t, a) {
    e.flags |= 16384, e = {
      getSnapshot: t,
      value: a
    }, t = ze.updateQueue, t === null ? (t = Gn(), ze.updateQueue = t, t.stores = [e]) : (a = t.stores, a === null ? t.stores = [e] : a.push(e));
  }
  function Od(e, t, a, i) {
    t.value = a, t.getSnapshot = i, Ud(t) && Rd(e);
  }
  function Dd(e, t, a) {
    return a(function() {
      Ud(t) && Rd(e);
    });
  }
  function Ud(e) {
    var t = e.getSnapshot;
    e = e.value;
    try {
      var a = t();
      return !At(e, a);
    } catch {
      return !0;
    }
  }
  function Rd(e) {
    var t = tl(e, 2);
    t !== null && Et(t, e, 2);
  }
  function Rc(e) {
    var t = jt();
    if (typeof e == "function") {
      var a = e;
      if (e = a(), pl) {
        vt(!0);
        try {
          a();
        } finally {
          vt(!1);
        }
      }
    }
    return t.memoizedState = t.baseState = e, t.queue = {
      pending: null,
      lanes: 0,
      dispatch: null,
      lastRenderedReducer: fa,
      lastRenderedState: e
    }, t;
  }
  function qd(e, t, a, i) {
    return e.baseState = a, Dc(e, Ge, typeof i == "function" ? i : fa);
  }
  function k0(e, t, a, i, n) {
    if (Zn(e)) throw Error(u(485));
    if (e = t.action, e !== null) {
      var s = {
        payload: n,
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
      B.T !== null ? a(!0) : s.isTransition = !1, i(s), a = t.pending, a === null ? (s.next = t.pending = s, Ld(t, s)) : (s.next = a.next, t.pending = a.next = s);
    }
  }
  function Ld(e, t) {
    var a = t.action, i = t.payload, n = e.state;
    if (t.isTransition) {
      var s = B.T, c = {};
      B.T = c;
      try {
        var d = a(n, i), x = B.S;
        x !== null && x(c, d), Hd(e, t, d);
      } catch (M) {
        qc(e, t, M);
      } finally {
        s !== null && c.types !== null && (s.types = c.types), B.T = s;
      }
    } else try {
      s = a(n, i), Hd(e, t, s);
    } catch (M) {
      qc(e, t, M);
    }
  }
  function Hd(e, t, a) {
    a !== null && typeof a == "object" && typeof a.then == "function" ? a.then(function(i) {
      Bd(e, t, i);
    }, function(i) {
      return qc(e, t, i);
    }) : Bd(e, t, a);
  }
  function Bd(e, t, a) {
    t.status = "fulfilled", t.value = a, Gd(t), e.state = a, t = e.pending, t !== null && (a = t.next, a === t ? e.pending = null : (a = a.next, t.next = a, Ld(e, a)));
  }
  function qc(e, t, a) {
    var i = e.pending;
    if (e.pending = null, i !== null) {
      i = i.next;
      do
        t.status = "rejected", t.reason = a, Gd(t), t = t.next;
      while (t !== i);
    }
    e.action = null;
  }
  function Gd(e) {
    e = e.listeners;
    for (var t = 0; t < e.length; t++) (0, e[t])();
  }
  function Yd(e, t) {
    return t;
  }
  function Vd(e, t) {
    if (Ce) {
      var a = Qe.formState;
      if (a !== null) {
        e: {
          var i = ze;
          if (Ce) {
            if (Ke) {
              t: {
                for (var n = Ke, s = Yt; n.nodeType !== 8; ) {
                  if (!s) {
                    n = null;
                    break t;
                  }
                  if (n = Qt(n.nextSibling), n === null) {
                    n = null;
                    break t;
                  }
                }
                s = n.data, n = s === "F!" || s === "F" ? n : null;
              }
              if (n) {
                Ke = Qt(n.nextSibling), i = n.data === "F!";
                break e;
              }
            }
            Aa(i);
          }
          i = !1;
        }
        i && (t = a[0]);
      }
    }
    return a = jt(), a.memoizedState = a.baseState = t, i = {
      pending: null,
      lanes: 0,
      dispatch: null,
      lastRenderedReducer: Yd,
      lastRenderedState: t
    }, a.queue = i, a = ru.bind(null, ze, i), i.dispatch = a, i = Rc(!1), s = Vc.bind(null, ze, !1, i.queue), i = jt(), n = {
      state: t,
      dispatch: null,
      action: e,
      pending: null
    }, i.queue = n, a = k0.bind(null, ze, n, s, a), n.dispatch = a, i.memoizedState = e, [
      t,
      a,
      !1
    ];
  }
  function Xd(e) {
    return Qd(lt(), Ge, e);
  }
  function Qd(e, t, a) {
    if (t = Dc(e, t, Yd)[0], e = Vn(fa)[0], typeof t == "object" && t !== null && typeof t.then == "function") try {
      var i = Oi(t);
    } catch (c) {
      throw c === Bl ? On : c;
    }
    else i = t;
    t = lt();
    var n = t.queue, s = n.dispatch;
    return a !== t.memoizedState && (ze.flags |= 2048, Ql(9, { destroy: void 0 }, E0.bind(null, n, a), null)), [
      i,
      s,
      e
    ];
  }
  function E0(e, t) {
    e.action = t;
  }
  function Zd(e) {
    var t = lt(), a = Ge;
    if (a !== null) return Qd(t, a, e);
    lt(), t = t.memoizedState, a = lt();
    var i = a.queue.dispatch;
    return a.memoizedState = e, [
      t,
      i,
      !1
    ];
  }
  function Ql(e, t, a, i) {
    return e = {
      tag: e,
      create: a,
      deps: i,
      inst: t,
      next: null
    }, t = ze.updateQueue, t === null && (t = Gn(), ze.updateQueue = t), a = t.lastEffect, a === null ? t.lastEffect = e.next = e : (i = a.next, a.next = e, e.next = i, t.lastEffect = e), e;
  }
  function Kd() {
    return lt().memoizedState;
  }
  function Xn(e, t, a, i) {
    var n = jt();
    ze.flags |= e, n.memoizedState = Ql(1 | t, { destroy: void 0 }, a, i === void 0 ? null : i);
  }
  function Qn(e, t, a, i) {
    var n = lt();
    i = i === void 0 ? null : i;
    var s = n.memoizedState.inst;
    Ge !== null && i !== null && Ec(i, Ge.memoizedState.deps) ? n.memoizedState = Ql(t, s, a, i) : (ze.flags |= e, n.memoizedState = Ql(1 | t, s, a, i));
  }
  function Jd(e, t) {
    Xn(8390656, 8, e, t);
  }
  function Lc(e, t) {
    Qn(2048, 8, e, t);
  }
  function A0(e) {
    ze.flags |= 4;
    var t = ze.updateQueue;
    if (t === null) t = Gn(), ze.updateQueue = t, t.events = [e];
    else {
      var a = t.events;
      a === null ? t.events = [e] : a.push(e);
    }
  }
  function Id(e) {
    var t = lt().memoizedState;
    return A0({
      ref: t,
      nextImpl: e
    }), function() {
      if ((Le & 2) !== 0) throw Error(u(440));
      return t.impl.apply(void 0, arguments);
    };
  }
  function $d(e, t) {
    return Qn(4, 2, e, t);
  }
  function Wd(e, t) {
    return Qn(4, 4, e, t);
  }
  function Fd(e, t) {
    if (typeof t == "function") {
      e = e();
      var a = t(e);
      return function() {
        typeof a == "function" ? a() : t(null);
      };
    }
    if (t != null) return e = e(), t.current = e, function() {
      t.current = null;
    };
  }
  function Pd(e, t, a) {
    a = a != null ? a.concat([e]) : null, Qn(4, 4, Fd.bind(null, t, e), a);
  }
  function Hc() {
  }
  function eu(e, t) {
    var a = lt();
    t = t === void 0 ? null : t;
    var i = a.memoizedState;
    return t !== null && Ec(t, i[1]) ? i[0] : (a.memoizedState = [e, t], e);
  }
  function tu(e, t) {
    var a = lt();
    t = t === void 0 ? null : t;
    var i = a.memoizedState;
    if (t !== null && Ec(t, i[1])) return i[0];
    if (i = e(), pl) {
      vt(!0);
      try {
        e();
      } finally {
        vt(!1);
      }
    }
    return a.memoizedState = [i, t], i;
  }
  function Bc(e, t, a) {
    return a === void 0 || (pa & 1073741824) !== 0 && (Ae & 261930) === 0 ? e.memoizedState = t : (e.memoizedState = a, e = Pu(), ze.lanes |= e, Ra |= e, a);
  }
  function au(e, t, a, i) {
    return At(a, t) ? a : Yl.current !== null ? (e = Bc(e, a, i), At(e, t) || (st = !0), e) : (pa & 42) === 0 || (pa & 1073741824) !== 0 && (Ae & 261930) === 0 ? (st = !0, e.memoizedState = a) : (e = Pu(), ze.lanes |= e, Ra |= e, t);
  }
  function lu(e, t, a, i, n) {
    var s = X.p;
    X.p = s !== 0 && 8 > s ? s : 8;
    var c = B.T, d = {};
    B.T = d, Vc(e, !1, t, a);
    try {
      var x = n(), M = B.S;
      M !== null && M(d, x), x !== null && typeof x == "object" && typeof x.then == "function" ? Di(e, t, N0(x, i), Xt(e)) : Di(e, t, i, Xt(e));
    } catch (q) {
      Di(e, t, {
        then: function() {
        },
        status: "rejected",
        reason: q
      }, Xt());
    } finally {
      X.p = s, c !== null && d.types !== null && (c.types = d.types), B.T = c;
    }
  }
  function T0() {
  }
  function Gc(e, t, a, i) {
    if (e.tag !== 5) throw Error(u(476));
    var n = iu(e).queue;
    lu(e, n, t, oe, a === null ? T0 : function() {
      return nu(e), a(i);
    });
  }
  function iu(e) {
    var t = e.memoizedState;
    if (t !== null) return t;
    t = {
      memoizedState: oe,
      baseState: oe,
      baseQueue: null,
      queue: {
        pending: null,
        lanes: 0,
        dispatch: null,
        lastRenderedReducer: fa,
        lastRenderedState: oe
      },
      next: null
    };
    var a = {};
    return t.next = {
      memoizedState: a,
      baseState: a,
      baseQueue: null,
      queue: {
        pending: null,
        lanes: 0,
        dispatch: null,
        lastRenderedReducer: fa,
        lastRenderedState: a
      },
      next: null
    }, e.memoizedState = t, e = e.alternate, e !== null && (e.memoizedState = t), t;
  }
  function nu(e) {
    var t = iu(e);
    t.next === null && (t = e.alternate.memoizedState), Di(e, t.next.queue, {}, Xt());
  }
  function Yc() {
    return xt(Wi);
  }
  function su() {
    return lt().memoizedState;
  }
  function cu() {
    return lt().memoizedState;
  }
  function C0(e) {
    for (var t = e.return; t !== null; ) {
      switch (t.tag) {
        case 24:
        case 3:
          var a = Xt();
          e = dl(a);
          var i = ul(t, e, a);
          i !== null && (Et(i, t, a), Ai(i, t, a)), t = { cache: gc() }, e.payload = t;
          return;
      }
      t = t.return;
    }
  }
  function M0(e, t, a) {
    var i = Xt();
    a = {
      lane: i,
      revertLane: 0,
      gesture: null,
      action: a,
      hasEagerState: !1,
      eagerState: null,
      next: null
    }, Zn(e) ? ou(t, a) : (a = sc(e, t, a, i), a !== null && (Et(a, e, i), du(a, t, i)));
  }
  function ru(e, t, a) {
    Di(e, t, a, Xt());
  }
  function Di(e, t, a, i) {
    var n = {
      lane: i,
      revertLane: 0,
      gesture: null,
      action: a,
      hasEagerState: !1,
      eagerState: null,
      next: null
    };
    if (Zn(e)) ou(t, n);
    else {
      var s = e.alternate;
      if (e.lanes === 0 && (s === null || s.lanes === 0) && (s = t.lastRenderedReducer, s !== null)) try {
        var c = t.lastRenderedState, d = s(c, a);
        if (n.hasEagerState = !0, n.eagerState = d, At(d, c)) return _n(e, t, n, 0), Qe === null && wn(), !1;
      } catch {
      }
      if (a = sc(e, t, n, i), a !== null) return Et(a, e, i), du(a, t, i), !0;
    }
    return !1;
  }
  function Vc(e, t, a, i) {
    if (i = {
      lane: 2,
      revertLane: yr(),
      gesture: null,
      action: i,
      hasEagerState: !1,
      eagerState: null,
      next: null
    }, Zn(e)) {
      if (t) throw Error(u(479));
    } else t = sc(e, a, i, 2), t !== null && Et(t, e, 2);
  }
  function Zn(e) {
    var t = e.alternate;
    return e === ze || t !== null && t === ze;
  }
  function ou(e, t) {
    Vl = Hn = !0;
    var a = e.pending;
    a === null ? t.next = t : (t.next = a.next, a.next = t), e.pending = t;
  }
  function du(e, t, a) {
    if ((a & 4194048) !== 0) {
      var i = t.lanes;
      i &= e.pendingLanes, a |= i, t.lanes = a, ho(e, a);
    }
  }
  var Ui = {
    readContext: xt,
    use: Yn,
    useCallback: Fe,
    useContext: Fe,
    useEffect: Fe,
    useImperativeHandle: Fe,
    useLayoutEffect: Fe,
    useInsertionEffect: Fe,
    useMemo: Fe,
    useReducer: Fe,
    useRef: Fe,
    useState: Fe,
    useDebugValue: Fe,
    useDeferredValue: Fe,
    useTransition: Fe,
    useSyncExternalStore: Fe,
    useId: Fe,
    useHostTransitionStatus: Fe,
    useFormState: Fe,
    useActionState: Fe,
    useOptimistic: Fe,
    useMemoCache: Fe,
    useCacheRefresh: Fe
  };
  Ui.useEffectEvent = Fe;
  var uu = {
    readContext: xt,
    use: Yn,
    useCallback: function(e, t) {
      return jt().memoizedState = [e, t === void 0 ? null : t], e;
    },
    useContext: xt,
    useEffect: Jd,
    useImperativeHandle: function(e, t, a) {
      a = a != null ? a.concat([e]) : null, Xn(4194308, 4, Fd.bind(null, t, e), a);
    },
    useLayoutEffect: function(e, t) {
      return Xn(4194308, 4, e, t);
    },
    useInsertionEffect: function(e, t) {
      Xn(4, 2, e, t);
    },
    useMemo: function(e, t) {
      var a = jt();
      t = t === void 0 ? null : t;
      var i = e();
      if (pl) {
        vt(!0);
        try {
          e();
        } finally {
          vt(!1);
        }
      }
      return a.memoizedState = [i, t], i;
    },
    useReducer: function(e, t, a) {
      var i = jt();
      if (a !== void 0) {
        var n = a(t);
        if (pl) {
          vt(!0);
          try {
            a(t);
          } finally {
            vt(!1);
          }
        }
      } else n = t;
      return i.memoizedState = i.baseState = n, e = {
        pending: null,
        lanes: 0,
        dispatch: null,
        lastRenderedReducer: e,
        lastRenderedState: n
      }, i.queue = e, e = e.dispatch = M0.bind(null, ze, e), [i.memoizedState, e];
    },
    useRef: function(e) {
      var t = jt();
      return e = { current: e }, t.memoizedState = e;
    },
    useState: function(e) {
      e = Rc(e);
      var t = e.queue, a = ru.bind(null, ze, t);
      return t.dispatch = a, [e.memoizedState, a];
    },
    useDebugValue: Hc,
    useDeferredValue: function(e, t) {
      return Bc(jt(), e, t);
    },
    useTransition: function() {
      var e = Rc(!1);
      return e = lu.bind(null, ze, e.queue, !0, !1), jt().memoizedState = e, [!1, e];
    },
    useSyncExternalStore: function(e, t, a) {
      var i = ze, n = jt();
      if (Ce) {
        if (a === void 0) throw Error(u(407));
        a = a();
      } else {
        if (a = t(), Qe === null) throw Error(u(349));
        (Ae & 127) !== 0 || Md(i, t, a);
      }
      n.memoizedState = a;
      var s = {
        value: a,
        getSnapshot: t
      };
      return n.queue = s, Jd(Dd.bind(null, i, s, e), [e]), i.flags |= 2048, Ql(9, { destroy: void 0 }, Od.bind(null, i, s, a, t), null), a;
    },
    useId: function() {
      var e = jt(), t = Qe.identifierPrefix;
      if (Ce) {
        var a = aa, i = ta;
        a = (i & ~(1 << 32 - ot(i) - 1)).toString(32) + a, t = "_" + t + "R_" + a, a = Bn++, 0 < a && (t += "H" + a.toString(32)), t += "_";
      } else a = w0++, t = "_" + t + "r_" + a.toString(32) + "_";
      return e.memoizedState = t;
    },
    useHostTransitionStatus: Yc,
    useFormState: Vd,
    useActionState: Vd,
    useOptimistic: function(e) {
      var t = jt();
      t.memoizedState = t.baseState = e;
      var a = {
        pending: null,
        lanes: 0,
        dispatch: null,
        lastRenderedReducer: null,
        lastRenderedState: null
      };
      return t.queue = a, t = Vc.bind(null, ze, !0, a), a.dispatch = t, [e, t];
    },
    useMemoCache: Oc,
    useCacheRefresh: function() {
      return jt().memoizedState = C0.bind(null, ze);
    },
    useEffectEvent: function(e) {
      var t = jt(), a = { impl: e };
      return t.memoizedState = a, function() {
        if ((Le & 2) !== 0) throw Error(u(440));
        return a.impl.apply(void 0, arguments);
      };
    }
  }, Xc = {
    readContext: xt,
    use: Yn,
    useCallback: eu,
    useContext: xt,
    useEffect: Lc,
    useImperativeHandle: Pd,
    useInsertionEffect: $d,
    useLayoutEffect: Wd,
    useMemo: tu,
    useReducer: Vn,
    useRef: Kd,
    useState: function() {
      return Vn(fa);
    },
    useDebugValue: Hc,
    useDeferredValue: function(e, t) {
      return au(lt(), Ge.memoizedState, e, t);
    },
    useTransition: function() {
      var e = Vn(fa)[0], t = lt().memoizedState;
      return [typeof e == "boolean" ? e : Oi(e), t];
    },
    useSyncExternalStore: Cd,
    useId: su,
    useHostTransitionStatus: Yc,
    useFormState: Xd,
    useActionState: Xd,
    useOptimistic: function(e, t) {
      return qd(lt(), Ge, e, t);
    },
    useMemoCache: Oc,
    useCacheRefresh: cu
  };
  Xc.useEffectEvent = Id;
  var pu = {
    readContext: xt,
    use: Yn,
    useCallback: eu,
    useContext: xt,
    useEffect: Lc,
    useImperativeHandle: Pd,
    useInsertionEffect: $d,
    useLayoutEffect: Wd,
    useMemo: tu,
    useReducer: Uc,
    useRef: Kd,
    useState: function() {
      return Uc(fa);
    },
    useDebugValue: Hc,
    useDeferredValue: function(e, t) {
      var a = lt();
      return Ge === null ? Bc(a, e, t) : au(a, Ge.memoizedState, e, t);
    },
    useTransition: function() {
      var e = Uc(fa)[0], t = lt().memoizedState;
      return [typeof e == "boolean" ? e : Oi(e), t];
    },
    useSyncExternalStore: Cd,
    useId: su,
    useHostTransitionStatus: Yc,
    useFormState: Zd,
    useActionState: Zd,
    useOptimistic: function(e, t) {
      var a = lt();
      return Ge !== null ? qd(a, Ge, e, t) : (a.baseState = e, [e, a.queue.dispatch]);
    },
    useMemoCache: Oc,
    useCacheRefresh: cu
  };
  pu.useEffectEvent = Id;
  function Qc(e, t, a, i) {
    t = e.memoizedState, a = a(i, t), a = a == null ? t : C({}, t, a), e.memoizedState = a, e.lanes === 0 && (e.updateQueue.baseState = a);
  }
  var Zc = {
    enqueueSetState: function(e, t, a) {
      e = e._reactInternals;
      var i = Xt(), n = dl(i);
      n.payload = t, a != null && (n.callback = a), t = ul(e, n, i), t !== null && (Et(t, e, i), Ai(t, e, i));
    },
    enqueueReplaceState: function(e, t, a) {
      e = e._reactInternals;
      var i = Xt(), n = dl(i);
      n.tag = 1, n.payload = t, a != null && (n.callback = a), t = ul(e, n, i), t !== null && (Et(t, e, i), Ai(t, e, i));
    },
    enqueueForceUpdate: function(e, t) {
      e = e._reactInternals;
      var a = Xt(), i = dl(a);
      i.tag = 2, t != null && (i.callback = t), t = ul(e, i, a), t !== null && (Et(t, e, a), Ai(t, e, a));
    }
  };
  function fu(e, t, a, i, n, s, c) {
    return e = e.stateNode, typeof e.shouldComponentUpdate == "function" ? e.shouldComponentUpdate(i, s, c) : t.prototype && t.prototype.isPureReactComponent ? !yi(a, i) || !yi(n, s) : !0;
  }
  function hu(e, t, a, i) {
    e = t.state, typeof t.componentWillReceiveProps == "function" && t.componentWillReceiveProps(a, i), typeof t.UNSAFE_componentWillReceiveProps == "function" && t.UNSAFE_componentWillReceiveProps(a, i), t.state !== e && Zc.enqueueReplaceState(t, t.state, null);
  }
  function fl(e, t) {
    var a = t;
    if ("ref" in t) {
      a = {};
      for (var i in t) i !== "ref" && (a[i] = t[i]);
    }
    if (e = e.defaultProps) {
      a === t && (a = C({}, a));
      for (var n in e) a[n] === void 0 && (a[n] = e[n]);
    }
    return a;
  }
  function O0(e) {
    Nn(e);
  }
  function D0(e) {
    console.error(e);
  }
  function U0(e) {
    Nn(e);
  }
  function Kn(e, t) {
    try {
      var a = e.onUncaughtError;
      a(t.value, { componentStack: t.stack });
    } catch (i) {
      setTimeout(function() {
        throw i;
      });
    }
  }
  function mu(e, t, a) {
    try {
      var i = e.onCaughtError;
      i(a.value, {
        componentStack: a.stack,
        errorBoundary: t.tag === 1 ? t.stateNode : null
      });
    } catch (n) {
      setTimeout(function() {
        throw n;
      });
    }
  }
  function Kc(e, t, a) {
    return a = dl(a), a.tag = 3, a.payload = { element: null }, a.callback = function() {
      Kn(e, t);
    }, a;
  }
  function xu(e) {
    return e = dl(e), e.tag = 3, e;
  }
  function gu(e, t, a, i) {
    var n = a.type.getDerivedStateFromError;
    if (typeof n == "function") {
      var s = i.value;
      e.payload = function() {
        return n(s);
      }, e.callback = function() {
        mu(t, a, i);
      };
    }
    var c = a.stateNode;
    c !== null && typeof c.componentDidCatch == "function" && (e.callback = function() {
      mu(t, a, i), typeof n != "function" && (qa === null ? qa = /* @__PURE__ */ new Set([this]) : qa.add(this));
      var d = i.stack;
      this.componentDidCatch(i.value, { componentStack: d !== null ? d : "" });
    });
  }
  function R0(e, t, a, i, n) {
    if (a.flags |= 32768, i !== null && typeof i == "object" && typeof i.then == "function") {
      if (t = a.alternate, t !== null && ql(t, a, n, !0), a = Ct.current, a !== null) {
        switch (a.tag) {
          case 31:
          case 13:
            return Vt === null ? ns() : a.alternate === null && Pe === 0 && (Pe = 3), a.flags &= -257, a.flags |= 65536, a.lanes = n, i === Dn ? a.flags |= 16384 : (t = a.updateQueue, t === null ? a.updateQueue = /* @__PURE__ */ new Set([i]) : t.add(i), br(e, i, n)), !1;
          case 22:
            return a.flags |= 65536, i === Dn ? a.flags |= 16384 : (t = a.updateQueue, t === null ? (t = {
              transitions: null,
              markerInstances: null,
              retryQueue: /* @__PURE__ */ new Set([i])
            }, a.updateQueue = t) : (a = t.retryQueue, a === null ? t.retryQueue = /* @__PURE__ */ new Set([i]) : a.add(i)), br(e, i, n)), !1;
        }
        throw Error(u(435, a.tag));
      }
      return br(e, i, n), ns(), !1;
    }
    if (Ce) return t = Ct.current, t !== null ? ((t.flags & 65536) === 0 && (t.flags |= 256), t.flags |= 65536, t.lanes = n, i !== pc && (e = Error(u(422), { cause: i }), Ni(Ht(e, a)))) : (i !== pc && (t = Error(u(423), { cause: i }), Ni(Ht(t, a))), e = e.current.alternate, e.flags |= 65536, n &= -n, e.lanes |= n, i = Ht(i, a), n = Kc(e.stateNode, i, n), zc(e, n), Pe !== 4 && (Pe = 2)), !1;
    var s = Error(u(520), { cause: i });
    if (s = Ht(s, a), Vi === null ? Vi = [s] : Vi.push(s), Pe !== 4 && (Pe = 2), t === null) return !0;
    i = Ht(i, a), a = t;
    do {
      switch (a.tag) {
        case 3:
          return a.flags |= 65536, e = n & -n, a.lanes |= e, e = Kc(a.stateNode, i, e), zc(a, e), !1;
        case 1:
          if (t = a.type, s = a.stateNode, (a.flags & 128) === 0 && (typeof t.getDerivedStateFromError == "function" || s !== null && typeof s.componentDidCatch == "function" && (qa === null || !qa.has(s)))) return a.flags |= 65536, n &= -n, a.lanes |= n, n = xu(n), gu(n, e, a, i), zc(a, n), !1;
      }
      a = a.return;
    } while (a !== null);
    return !1;
  }
  var Jc = Error(u(461)), st = !1;
  function gt(e, t, a, i) {
    t.child = e === null ? Nd(t, null, a, i) : ol(t, e.child, a, i);
  }
  function bu(e, t, a, i, n) {
    a = a.render;
    var s = t.ref;
    if ("ref" in i) {
      var c = {};
      for (var d in i) d !== "ref" && (c[d] = i[d]);
    } else c = i;
    return nl(t), i = Ac(e, t, a, c, s, n), d = Tc(), e !== null && !st ? (Cc(e, t, n), ha(e, t, n)) : (Ce && d && dc(t), t.flags |= 1, gt(e, t, i, n), t.child);
  }
  function vu(e, t, a, i, n) {
    if (e === null) {
      var s = a.type;
      return typeof s == "function" && !cc(s) && s.defaultProps === void 0 && a.compare === null ? (t.tag = 15, t.type = s, ju(e, t, s, i, n)) : (e = En(a.type, null, i, t, t.mode, n), e.ref = t.ref, e.return = t, t.child = e);
    }
    if (s = e.child, !ar(e, n)) {
      var c = s.memoizedProps;
      if (a = a.compare, a = a !== null ? a : yi, a(c, i) && e.ref === t.ref) return ha(e, t, n);
    }
    return t.flags |= 1, e = ra(s, i), e.ref = t.ref, e.return = t, t.child = e;
  }
  function ju(e, t, a, i, n) {
    if (e !== null) {
      var s = e.memoizedProps;
      if (yi(s, i) && e.ref === t.ref) if (st = !1, t.pendingProps = i = s, ar(e, n)) (e.flags & 131072) !== 0 && (st = !0);
      else return t.lanes = e.lanes, ha(e, t, n);
    }
    return Ic(e, t, a, i, n);
  }
  function yu(e, t, a, i) {
    var n = i.children, s = e !== null ? e.memoizedState : null;
    if (e === null && t.stateNode === null && (t.stateNode = {
      _visibility: 1,
      _pendingMarkers: null,
      _retryCache: null,
      _transitions: null
    }), i.mode === "hidden") {
      if ((t.flags & 128) !== 0) {
        if (s = s !== null ? s.baseLanes | a : a, e !== null) {
          for (i = t.child = e.child, n = 0; i !== null; ) n = n | i.lanes | i.childLanes, i = i.sibling;
          i = n & ~s;
        } else i = 0, t.child = null;
        return Su(e, t, s, a, i);
      }
      if ((a & 536870912) !== 0) t.memoizedState = {
        baseLanes: 0,
        cachePool: null
      }, e !== null && Mn(t, s !== null ? s.cachePool : null), s !== null ? kd(t, s) : wc(), Ed(t);
      else return i = t.lanes = 536870912, Su(e, t, s !== null ? s.baseLanes | a : a, a, i);
    } else s !== null ? (Mn(t, s.cachePool), kd(t, s), Oa(t), t.memoizedState = null) : (e !== null && Mn(t, null), wc(), Oa(t));
    return gt(e, t, n, a), t.child;
  }
  function Ri(e, t) {
    return e !== null && e.tag === 22 || t.stateNode !== null || (t.stateNode = {
      _visibility: 1,
      _pendingMarkers: null,
      _retryCache: null,
      _transitions: null
    }), t.sibling;
  }
  function Su(e, t, a, i, n) {
    var s = vc();
    return s = s === null ? null : {
      parent: it._currentValue,
      pool: s
    }, t.memoizedState = {
      baseLanes: a,
      cachePool: s
    }, e !== null && Mn(t, null), wc(), Ed(t), e !== null && ql(e, t, i, !0), t.childLanes = n, null;
  }
  function Jn(e, t) {
    return t = $n({
      mode: t.mode,
      children: t.children
    }, e.mode), t.ref = e.ref, e.child = t, t.return = e, t;
  }
  function zu(e, t, a) {
    return ol(t, e.child, null, a), e = Jn(t, t.pendingProps), e.flags |= 2, Mt(t), t.memoizedState = null, e;
  }
  function q0(e, t, a) {
    var i = t.pendingProps, n = (t.flags & 128) !== 0;
    if (t.flags &= -129, e === null) {
      if (Ce) {
        if (i.mode === "hidden") return e = Jn(t, i), t.lanes = 536870912, Ri(null, e);
        if (kc(t), (e = Ke) ? (e = Rp(e, Yt), e = e !== null && e.data === "&" ? e : null, e !== null && (t.memoizedState = {
          dehydrated: e,
          treeContext: ka !== null ? {
            id: ta,
            overflow: aa
          } : null,
          retryLane: 536870912,
          hydrationErrors: null
        }, a = od(e), a.return = t, t.child = a, mt = t, Ke = null)) : e = null, e === null) throw Aa(t);
        return t.lanes = 536870912, null;
      }
      return Jn(t, i);
    }
    var s = e.memoizedState;
    if (s !== null) {
      var c = s.dehydrated;
      if (kc(t), n) if (t.flags & 256) t.flags &= -257, t = zu(e, t, a);
      else if (t.memoizedState !== null) t.child = e.child, t.flags |= 128, t = null;
      else throw Error(u(558));
      else if (st || ql(e, t, a, !1), n = (a & e.childLanes) !== 0, st || n) {
        if (i = Qe, i !== null && (c = mo(i, a), c !== 0 && c !== s.retryLane)) throw s.retryLane = c, tl(e, c), Et(i, e, c), Jc;
        ns(), t = zu(e, t, a);
      } else e = s.treeContext, Ke = Qt(c.nextSibling), mt = t, Ce = !0, Ea = null, Yt = !1, e !== null && pd(t, e), t = Jn(t, i), t.flags |= 4096;
      return t;
    }
    return e = ra(e.child, {
      mode: i.mode,
      children: i.children
    }), e.ref = t.ref, t.child = e, e.return = t, e;
  }
  function In(e, t) {
    var a = t.ref;
    if (a === null) e !== null && e.ref !== null && (t.flags |= 4194816);
    else {
      if (typeof a != "function" && typeof a != "object") throw Error(u(284));
      (e === null || e.ref !== a) && (t.flags |= 4194816);
    }
  }
  function Ic(e, t, a, i, n) {
    return nl(t), a = Ac(e, t, a, i, void 0, n), i = Tc(), e !== null && !st ? (Cc(e, t, n), ha(e, t, n)) : (Ce && i && dc(t), t.flags |= 1, gt(e, t, a, n), t.child);
  }
  function Nu(e, t, a, i, n, s) {
    return nl(t), t.updateQueue = null, a = Td(t, i, a, n), Ad(e), i = Tc(), e !== null && !st ? (Cc(e, t, s), ha(e, t, s)) : (Ce && i && dc(t), t.flags |= 1, gt(e, t, a, s), t.child);
  }
  function wu(e, t, a, i, n) {
    if (nl(t), t.stateNode === null) {
      var s = Ol, c = a.contextType;
      typeof c == "object" && c !== null && (s = xt(c)), s = new a(i, s), t.memoizedState = s.state !== null && s.state !== void 0 ? s.state : null, s.updater = Zc, t.stateNode = s, s._reactInternals = t, s = t.stateNode, s.props = i, s.state = t.memoizedState, s.refs = {}, yc(t), c = a.contextType, s.context = typeof c == "object" && c !== null ? xt(c) : Ol, s.state = t.memoizedState, c = a.getDerivedStateFromProps, typeof c == "function" && (Qc(t, a, c, i), s.state = t.memoizedState), typeof a.getDerivedStateFromProps == "function" || typeof s.getSnapshotBeforeUpdate == "function" || typeof s.UNSAFE_componentWillMount != "function" && typeof s.componentWillMount != "function" || (c = s.state, typeof s.componentWillMount == "function" && s.componentWillMount(), typeof s.UNSAFE_componentWillMount == "function" && s.UNSAFE_componentWillMount(), c !== s.state && Zc.enqueueReplaceState(s, s.state, null), Ci(t, i, s, n), Ti(), s.state = t.memoizedState), typeof s.componentDidMount == "function" && (t.flags |= 4194308), i = !0;
    } else if (e === null) {
      s = t.stateNode;
      var d = t.memoizedProps, x = fl(a, d);
      s.props = x;
      var M = s.context, q = a.contextType;
      c = Ol, typeof q == "object" && q !== null && (c = xt(q));
      var Y = a.getDerivedStateFromProps;
      q = typeof Y == "function" || typeof s.getSnapshotBeforeUpdate == "function", d = t.pendingProps !== d, q || typeof s.UNSAFE_componentWillReceiveProps != "function" && typeof s.componentWillReceiveProps != "function" || (d || M !== c) && hu(t, s, i, c), Ca = !1;
      var O = t.memoizedState;
      s.state = O, Ci(t, i, s, n), Ti(), M = t.memoizedState, d || O !== M || Ca ? (typeof Y == "function" && (Qc(t, a, Y, i), M = t.memoizedState), (x = Ca || fu(t, a, x, i, O, M, c)) ? (q || typeof s.UNSAFE_componentWillMount != "function" && typeof s.componentWillMount != "function" || (typeof s.componentWillMount == "function" && s.componentWillMount(), typeof s.UNSAFE_componentWillMount == "function" && s.UNSAFE_componentWillMount()), typeof s.componentDidMount == "function" && (t.flags |= 4194308)) : (typeof s.componentDidMount == "function" && (t.flags |= 4194308), t.memoizedProps = i, t.memoizedState = M), s.props = i, s.state = M, s.context = c, i = x) : (typeof s.componentDidMount == "function" && (t.flags |= 4194308), i = !1);
    } else {
      s = t.stateNode, Sc(e, t), c = t.memoizedProps, q = fl(a, c), s.props = q, Y = t.pendingProps, O = s.context, M = a.contextType, x = Ol, typeof M == "object" && M !== null && (x = xt(M)), d = a.getDerivedStateFromProps, (M = typeof d == "function" || typeof s.getSnapshotBeforeUpdate == "function") || typeof s.UNSAFE_componentWillReceiveProps != "function" && typeof s.componentWillReceiveProps != "function" || (c !== Y || O !== x) && hu(t, s, i, x), Ca = !1, O = t.memoizedState, s.state = O, Ci(t, i, s, n), Ti();
      var U = t.memoizedState;
      c !== Y || O !== U || Ca || e !== null && e.dependencies !== null && Tn(e.dependencies) ? (typeof d == "function" && (Qc(t, a, d, i), U = t.memoizedState), (q = Ca || fu(t, a, q, i, O, U, x) || e !== null && e.dependencies !== null && Tn(e.dependencies)) ? (M || typeof s.UNSAFE_componentWillUpdate != "function" && typeof s.componentWillUpdate != "function" || (typeof s.componentWillUpdate == "function" && s.componentWillUpdate(i, U, x), typeof s.UNSAFE_componentWillUpdate == "function" && s.UNSAFE_componentWillUpdate(i, U, x)), typeof s.componentDidUpdate == "function" && (t.flags |= 4), typeof s.getSnapshotBeforeUpdate == "function" && (t.flags |= 1024)) : (typeof s.componentDidUpdate != "function" || c === e.memoizedProps && O === e.memoizedState || (t.flags |= 4), typeof s.getSnapshotBeforeUpdate != "function" || c === e.memoizedProps && O === e.memoizedState || (t.flags |= 1024), t.memoizedProps = i, t.memoizedState = U), s.props = i, s.state = U, s.context = x, i = q) : (typeof s.componentDidUpdate != "function" || c === e.memoizedProps && O === e.memoizedState || (t.flags |= 4), typeof s.getSnapshotBeforeUpdate != "function" || c === e.memoizedProps && O === e.memoizedState || (t.flags |= 1024), i = !1);
    }
    return s = i, In(e, t), i = (t.flags & 128) !== 0, s || i ? (s = t.stateNode, a = i && typeof a.getDerivedStateFromError != "function" ? null : s.render(), t.flags |= 1, e !== null && i ? (t.child = ol(t, e.child, null, n), t.child = ol(t, null, a, n)) : gt(e, t, a, n), t.memoizedState = s.state, e = t.child) : e = ha(e, t, n), e;
  }
  function _u(e, t, a, i) {
    return ll(), t.flags |= 256, gt(e, t, a, i), t.child;
  }
  var $c = {
    dehydrated: null,
    treeContext: null,
    retryLane: 0,
    hydrationErrors: null
  };
  function Wc(e) {
    return {
      baseLanes: e,
      cachePool: bd()
    };
  }
  function Fc(e, t, a) {
    return e = e !== null ? e.childLanes & ~a : 0, t && (e |= Dt), e;
  }
  function ku(e, t, a) {
    var i = t.pendingProps, n = !1, s = (t.flags & 128) !== 0, c;
    if ((c = s) || (c = e !== null && e.memoizedState === null ? !1 : (at.current & 2) !== 0), c && (n = !0, t.flags &= -129), c = (t.flags & 32) !== 0, t.flags &= -33, e === null) {
      if (Ce) {
        if (n ? Ma(t) : Oa(t), (e = Ke) ? (e = Rp(e, Yt), e = e !== null && e.data !== "&" ? e : null, e !== null && (t.memoizedState = {
          dehydrated: e,
          treeContext: ka !== null ? {
            id: ta,
            overflow: aa
          } : null,
          retryLane: 536870912,
          hydrationErrors: null
        }, a = od(e), a.return = t, t.child = a, mt = t, Ke = null)) : e = null, e === null) throw Aa(t);
        return Or(e) ? t.lanes = 32 : t.lanes = 536870912, null;
      }
      var d = i.children;
      return i = i.fallback, n ? (Oa(t), n = t.mode, d = $n({
        mode: "hidden",
        children: d
      }, n), i = al(i, n, a, null), d.return = t, i.return = t, d.sibling = i, t.child = d, i = t.child, i.memoizedState = Wc(a), i.childLanes = Fc(e, c, a), t.memoizedState = $c, Ri(null, i)) : (Ma(t), Pc(t, d));
    }
    var x = e.memoizedState;
    if (x !== null && (d = x.dehydrated, d !== null)) {
      if (s) t.flags & 256 ? (Ma(t), t.flags &= -257, t = er(e, t, a)) : t.memoizedState !== null ? (Oa(t), t.child = e.child, t.flags |= 128, t = null) : (Oa(t), d = i.fallback, n = t.mode, i = $n({
        mode: "visible",
        children: i.children
      }, n), d = al(d, n, a, null), d.flags |= 2, i.return = t, d.return = t, i.sibling = d, t.child = i, ol(t, e.child, null, a), i = t.child, i.memoizedState = Wc(a), i.childLanes = Fc(e, c, a), t.memoizedState = $c, t = Ri(null, i));
      else if (Ma(t), Or(d)) {
        if (c = d.nextSibling && d.nextSibling.dataset, c) var M = c.dgst;
        c = M, i = Error(u(419)), i.stack = "", i.digest = c, Ni({
          value: i,
          source: null,
          stack: null
        }), t = er(e, t, a);
      } else if (st || ql(e, t, a, !1), c = (a & e.childLanes) !== 0, st || c) {
        if (c = Qe, c !== null && (i = mo(c, a), i !== 0 && i !== x.retryLane)) throw x.retryLane = i, tl(e, i), Et(c, e, i), Jc;
        Mr(d) || ns(), t = er(e, t, a);
      } else Mr(d) ? (t.flags |= 192, t.child = e.child, t = null) : (e = x.treeContext, Ke = Qt(d.nextSibling), mt = t, Ce = !0, Ea = null, Yt = !1, e !== null && pd(t, e), t = Pc(t, i.children), t.flags |= 4096);
      return t;
    }
    return n ? (Oa(t), d = i.fallback, n = t.mode, x = e.child, M = x.sibling, i = ra(x, {
      mode: "hidden",
      children: i.children
    }), i.subtreeFlags = x.subtreeFlags & 65011712, M !== null ? d = ra(M, d) : (d = al(d, n, a, null), d.flags |= 2), d.return = t, i.return = t, i.sibling = d, t.child = i, Ri(null, i), i = t.child, d = e.child.memoizedState, d === null ? d = Wc(a) : (n = d.cachePool, n !== null ? (x = it._currentValue, n = n.parent !== x ? {
      parent: x,
      pool: x
    } : n) : n = bd(), d = {
      baseLanes: d.baseLanes | a,
      cachePool: n
    }), i.memoizedState = d, i.childLanes = Fc(e, c, a), t.memoizedState = $c, Ri(e.child, i)) : (Ma(t), a = e.child, e = a.sibling, a = ra(a, {
      mode: "visible",
      children: i.children
    }), a.return = t, a.sibling = null, e !== null && (c = t.deletions, c === null ? (t.deletions = [e], t.flags |= 16) : c.push(e)), t.child = a, t.memoizedState = null, a);
  }
  function Pc(e, t) {
    return t = $n({
      mode: "visible",
      children: t
    }, e.mode), t.return = e, e.child = t;
  }
  function $n(e, t) {
    return e = Tt(22, e, null, t), e.lanes = 0, e;
  }
  function er(e, t, a) {
    return ol(t, e.child, null, a), e = Pc(t, t.pendingProps.children), e.flags |= 2, t.memoizedState = null, e;
  }
  function Eu(e, t, a) {
    e.lanes |= t;
    var i = e.alternate;
    i !== null && (i.lanes |= t), mc(e.return, t, a);
  }
  function tr(e, t, a, i, n, s) {
    var c = e.memoizedState;
    c === null ? e.memoizedState = {
      isBackwards: t,
      rendering: null,
      renderingStartTime: 0,
      last: i,
      tail: a,
      tailMode: n,
      treeForkCount: s
    } : (c.isBackwards = t, c.rendering = null, c.renderingStartTime = 0, c.last = i, c.tail = a, c.tailMode = n, c.treeForkCount = s);
  }
  function Au(e, t, a) {
    var i = t.pendingProps, n = i.revealOrder, s = i.tail;
    i = i.children;
    var c = at.current, d = (c & 2) !== 0;
    if (d ? (c = c & 1 | 2, t.flags |= 128) : c &= 1, G(at, c), gt(e, t, i, a), i = Ce ? zi : 0, !d && e !== null && (e.flags & 128) !== 0) e: for (e = t.child; e !== null; ) {
      if (e.tag === 13) e.memoizedState !== null && Eu(e, a, t);
      else if (e.tag === 19) Eu(e, a, t);
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
    switch (n) {
      case "forwards":
        for (a = t.child, n = null; a !== null; ) e = a.alternate, e !== null && Ln(e) === null && (n = a), a = a.sibling;
        a = n, a === null ? (n = t.child, t.child = null) : (n = a.sibling, a.sibling = null), tr(t, !1, n, a, s, i);
        break;
      case "backwards":
      case "unstable_legacy-backwards":
        for (a = null, n = t.child, t.child = null; n !== null; ) {
          if (e = n.alternate, e !== null && Ln(e) === null) {
            t.child = n;
            break;
          }
          e = n.sibling, n.sibling = a, a = n, n = e;
        }
        tr(t, !0, a, null, s, i);
        break;
      case "together":
        tr(t, !1, null, null, void 0, i);
        break;
      default:
        t.memoizedState = null;
    }
    return t.child;
  }
  function ha(e, t, a) {
    if (e !== null && (t.dependencies = e.dependencies), Ra |= t.lanes, (a & t.childLanes) === 0) if (e !== null) {
      if (ql(e, t, a, !1), (a & t.childLanes) === 0) return null;
    } else return null;
    if (e !== null && t.child !== e.child) throw Error(u(153));
    if (t.child !== null) {
      for (e = t.child, a = ra(e, e.pendingProps), t.child = a, a.return = t; e.sibling !== null; ) e = e.sibling, a = a.sibling = ra(e, e.pendingProps), a.return = t;
      a.sibling = null;
    }
    return t.child;
  }
  function ar(e, t) {
    return (e.lanes & t) !== 0 ? !0 : (e = e.dependencies, !!(e !== null && Tn(e)));
  }
  function L0(e, t, a) {
    switch (t.tag) {
      case 3:
        Re(t, t.stateNode.containerInfo), Ta(t, it, e.memoizedState.cache), ll();
        break;
      case 27:
      case 5:
        ft(t);
        break;
      case 4:
        Re(t, t.stateNode.containerInfo);
        break;
      case 10:
        Ta(t, t.type, t.memoizedProps.value);
        break;
      case 31:
        if (t.memoizedState !== null) return t.flags |= 128, kc(t), null;
        break;
      case 13:
        var i = t.memoizedState;
        if (i !== null)
          return i.dehydrated !== null ? (Ma(t), t.flags |= 128, null) : (a & t.child.childLanes) !== 0 ? ku(e, t, a) : (Ma(t), e = ha(e, t, a), e !== null ? e.sibling : null);
        Ma(t);
        break;
      case 19:
        var n = (e.flags & 128) !== 0;
        if (i = (a & t.childLanes) !== 0, i || (ql(e, t, a, !1), i = (a & t.childLanes) !== 0), n) {
          if (i) return Au(e, t, a);
          t.flags |= 128;
        }
        if (n = t.memoizedState, n !== null && (n.rendering = null, n.tail = null, n.lastEffect = null), G(at, at.current), i) break;
        return null;
      case 22:
        return t.lanes = 0, yu(e, t, a, t.pendingProps);
      case 24:
        Ta(t, it, e.memoizedState.cache);
    }
    return ha(e, t, a);
  }
  function Tu(e, t, a) {
    if (e !== null) if (e.memoizedProps !== t.pendingProps) st = !0;
    else {
      if (!ar(e, a) && (t.flags & 128) === 0) return st = !1, L0(e, t, a);
      st = (e.flags & 131072) !== 0;
    }
    else st = !1, Ce && (t.flags & 1048576) !== 0 && ud(t, zi, t.index);
    switch (t.lanes = 0, t.tag) {
      case 16:
        e: {
          var i = t.pendingProps;
          if (e = cl(t.elementType), t.type = e, typeof e == "function") cc(e) ? (i = fl(e, i), t.tag = 1, t = wu(null, t, e, i, a)) : (t.tag = 0, t = Ic(null, t, e, i, a));
          else {
            if (e != null) {
              var n = e.$$typeof;
              if (n === W) {
                t.tag = 11, t = bu(null, t, e, i, a);
                break e;
              } else if (n === de) {
                t.tag = 14, t = vu(null, t, e, i, a);
                break e;
              }
            }
            throw t = ee(e) || e, Error(u(306, t, ""));
          }
        }
        return t;
      case 0:
        return Ic(e, t, t.type, t.pendingProps, a);
      case 1:
        return i = t.type, n = fl(i, t.pendingProps), wu(e, t, i, n, a);
      case 3:
        e: {
          if (Re(t, t.stateNode.containerInfo), e === null) throw Error(u(387));
          i = t.pendingProps;
          var s = t.memoizedState;
          n = s.element, Sc(e, t), Ci(t, i, null, a);
          var c = t.memoizedState;
          if (i = c.cache, Ta(t, it, i), i !== s.cache && xc(t, [it], a, !0), Ti(), i = c.element, s.isDehydrated) if (s = {
            element: i,
            isDehydrated: !1,
            cache: c.cache
          }, t.updateQueue.baseState = s, t.memoizedState = s, t.flags & 256) {
            t = _u(e, t, i, a);
            break e;
          } else if (i !== n) {
            n = Ht(Error(u(424)), t), Ni(n), t = _u(e, t, i, a);
            break e;
          } else
            for (e = t.stateNode.containerInfo, e.nodeType === 9 ? e = e.body : e = e.nodeName === "HTML" ? e.ownerDocument.body : e, Ke = Qt(e.firstChild), mt = t, Ce = !0, Ea = null, Yt = !0, a = Nd(t, null, i, a), t.child = a; a; ) a.flags = a.flags & -3 | 4096, a = a.sibling;
          else {
            if (ll(), i === n) {
              t = ha(e, t, a);
              break e;
            }
            gt(e, t, i, a);
          }
          t = t.child;
        }
        return t;
      case 26:
        return In(e, t), e === null ? (a = Yp(t.type, null, t.pendingProps, null)) ? t.memoizedState = a : Ce || (a = t.type, e = t.pendingProps, i = ps(he.current).createElement(a), i[ht] = t, i[St] = e, bt(i, a, e), ut(i), t.stateNode = i) : t.memoizedState = Yp(t.type, e.memoizedProps, t.pendingProps, e.memoizedState), null;
      case 27:
        return ft(t), e === null && Ce && (i = t.stateNode = Hp(t.type, t.pendingProps, he.current), mt = t, Yt = !0, n = Ke, Ga(t.type) ? (Dr = n, Ke = Qt(i.firstChild)) : Ke = n), gt(e, t, t.pendingProps.children, a), In(e, t), e === null && (t.flags |= 4194304), t.child;
      case 5:
        return e === null && Ce && ((n = i = Ke) && (i = ph(i, t.type, t.pendingProps, Yt), i !== null ? (t.stateNode = i, mt = t, Ke = Qt(i.firstChild), Yt = !1, n = !0) : n = !1), n || Aa(t)), ft(t), n = t.type, s = t.pendingProps, c = e !== null ? e.memoizedProps : null, i = s.children, Ar(n, s) ? i = null : c !== null && Ar(n, c) && (t.flags |= 32), t.memoizedState !== null && (n = Ac(e, t, _0, null, null, a), Wi._currentValue = n), In(e, t), gt(e, t, i, a), t.child;
      case 6:
        return e === null && Ce && ((e = a = Ke) && (a = fh(a, t.pendingProps, Yt), a !== null ? (t.stateNode = a, mt = t, Ke = null, e = !0) : e = !1), e || Aa(t)), null;
      case 13:
        return ku(e, t, a);
      case 4:
        return Re(t, t.stateNode.containerInfo), i = t.pendingProps, e === null ? t.child = ol(t, null, i, a) : gt(e, t, i, a), t.child;
      case 11:
        return bu(e, t, t.type, t.pendingProps, a);
      case 7:
        return gt(e, t, t.pendingProps, a), t.child;
      case 8:
        return gt(e, t, t.pendingProps.children, a), t.child;
      case 12:
        return gt(e, t, t.pendingProps.children, a), t.child;
      case 10:
        return i = t.pendingProps, Ta(t, t.type, i.value), gt(e, t, i.children, a), t.child;
      case 9:
        return n = t.type._context, i = t.pendingProps.children, nl(t), n = xt(n), i = i(n), t.flags |= 1, gt(e, t, i, a), t.child;
      case 14:
        return vu(e, t, t.type, t.pendingProps, a);
      case 15:
        return ju(e, t, t.type, t.pendingProps, a);
      case 19:
        return Au(e, t, a);
      case 31:
        return q0(e, t, a);
      case 22:
        return yu(e, t, a, t.pendingProps);
      case 24:
        return nl(t), i = xt(it), e === null ? (n = vc(), n === null && (n = Qe, s = gc(), n.pooledCache = s, s.refCount++, s !== null && (n.pooledCacheLanes |= a), n = s), t.memoizedState = {
          parent: i,
          cache: n
        }, yc(t), Ta(t, it, n)) : ((e.lanes & a) !== 0 && (Sc(e, t), Ci(t, null, null, a), Ti()), n = e.memoizedState, s = t.memoizedState, n.parent !== i ? (n = {
          parent: i,
          cache: i
        }, t.memoizedState = n, t.lanes === 0 && (t.memoizedState = t.updateQueue.baseState = n), Ta(t, it, i)) : (i = s.cache, Ta(t, it, i), i !== n.cache && xc(t, [it], a, !0))), gt(e, t, t.pendingProps.children, a), t.child;
      case 29:
        throw t.pendingProps;
    }
    throw Error(u(156, t.tag));
  }
  function ma(e) {
    e.flags |= 4;
  }
  function lr(e, t, a, i, n) {
    if ((t = (e.mode & 32) !== 0) && (t = !1), t) {
      if (e.flags |= 16777216, (n & 335544128) === n) if (e.stateNode.complete) e.flags |= 8192;
      else if (lp()) e.flags |= 8192;
      else throw rl = Dn, jc;
    } else e.flags &= -16777217;
  }
  function Cu(e, t) {
    if (t.type !== "stylesheet" || (t.state.loading & 4) !== 0) e.flags &= -16777217;
    else if (e.flags |= 16777216, !Kp(t)) if (lp()) e.flags |= 8192;
    else throw rl = Dn, jc;
  }
  function Wn(e, t) {
    t !== null && (e.flags |= 4), e.flags & 16384 && (t = e.tag !== 22 ? po() : 536870912, e.lanes |= t, Il |= t);
  }
  function qi(e, t) {
    if (!Ce) switch (e.tailMode) {
      case "hidden":
        t = e.tail;
        for (var a = null; t !== null; ) t.alternate !== null && (a = t), t = t.sibling;
        a === null ? e.tail = null : a.sibling = null;
        break;
      case "collapsed":
        a = e.tail;
        for (var i = null; a !== null; ) a.alternate !== null && (i = a), a = a.sibling;
        i === null ? t || e.tail === null ? e.tail = null : e.tail.sibling = null : i.sibling = null;
    }
  }
  function Je(e) {
    var t = e.alternate !== null && e.alternate.child === e.child, a = 0, i = 0;
    if (t) for (var n = e.child; n !== null; ) a |= n.lanes | n.childLanes, i |= n.subtreeFlags & 65011712, i |= n.flags & 65011712, n.return = e, n = n.sibling;
    else for (n = e.child; n !== null; ) a |= n.lanes | n.childLanes, i |= n.subtreeFlags, i |= n.flags, n.return = e, n = n.sibling;
    return e.subtreeFlags |= i, e.childLanes = a, t;
  }
  function H0(e, t, a) {
    var i = t.pendingProps;
    switch (uc(t), t.tag) {
      case 16:
      case 15:
      case 0:
      case 11:
      case 7:
      case 8:
      case 12:
      case 9:
      case 14:
        return Je(t), null;
      case 1:
        return Je(t), null;
      case 3:
        return a = t.stateNode, i = null, e !== null && (i = e.memoizedState.cache), t.memoizedState.cache !== i && (t.flags |= 2048), ua(it), _e(), a.pendingContext && (a.context = a.pendingContext, a.pendingContext = null), (e === null || e.child === null) && (Rl(t) ? ma(t) : e === null || e.memoizedState.isDehydrated && (t.flags & 256) === 0 || (t.flags |= 1024, fc())), Je(t), null;
      case 26:
        var n = t.type, s = t.memoizedState;
        return e === null ? (ma(t), s !== null ? (Je(t), Cu(t, s)) : (Je(t), lr(t, n, null, i, a))) : s ? s !== e.memoizedState ? (ma(t), Je(t), Cu(t, s)) : (Je(t), t.flags &= -16777217) : (e = e.memoizedProps, e !== i && ma(t), Je(t), lr(t, n, e, i, a)), null;
      case 27:
        if (Ie(t), a = he.current, n = t.type, e !== null && t.stateNode != null) e.memoizedProps !== i && ma(t);
        else {
          if (!i) {
            if (t.stateNode === null) throw Error(u(166));
            return Je(t), null;
          }
          e = $.current, Rl(t) ? fd(t, e) : (e = Hp(n, i, a), t.stateNode = e, ma(t));
        }
        return Je(t), null;
      case 5:
        if (Ie(t), n = t.type, e !== null && t.stateNode != null) e.memoizedProps !== i && ma(t);
        else {
          if (!i) {
            if (t.stateNode === null) throw Error(u(166));
            return Je(t), null;
          }
          if (s = $.current, Rl(t)) fd(t, s);
          else {
            var c = ps(he.current);
            switch (s) {
              case 1:
                s = c.createElementNS("http://www.w3.org/2000/svg", n);
                break;
              case 2:
                s = c.createElementNS("http://www.w3.org/1998/Math/MathML", n);
                break;
              default:
                switch (n) {
                  case "svg":
                    s = c.createElementNS("http://www.w3.org/2000/svg", n);
                    break;
                  case "math":
                    s = c.createElementNS("http://www.w3.org/1998/Math/MathML", n);
                    break;
                  case "script":
                    s = c.createElement("div"), s.innerHTML = "<script><\/script>", s = s.removeChild(s.firstChild);
                    break;
                  case "select":
                    s = typeof i.is == "string" ? c.createElement("select", { is: i.is }) : c.createElement("select"), i.multiple ? s.multiple = !0 : i.size && (s.size = i.size);
                    break;
                  default:
                    s = typeof i.is == "string" ? c.createElement(n, { is: i.is }) : c.createElement(n);
                }
            }
            s[ht] = t, s[St] = i;
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
            e: switch (bt(s, n, i), n) {
              case "button":
              case "input":
              case "select":
              case "textarea":
                i = !!i.autoFocus;
                break e;
              case "img":
                i = !0;
                break e;
              default:
                i = !1;
            }
            i && ma(t);
          }
        }
        return Je(t), lr(t, t.type, e === null ? null : e.memoizedProps, t.pendingProps, a), null;
      case 6:
        if (e && t.stateNode != null) e.memoizedProps !== i && ma(t);
        else {
          if (typeof i != "string" && t.stateNode === null) throw Error(u(166));
          if (e = he.current, Rl(t)) {
            if (e = t.stateNode, a = t.memoizedProps, i = null, n = mt, n !== null) switch (n.tag) {
              case 27:
              case 5:
                i = n.memoizedProps;
            }
            e[ht] = t, e = !!(e.nodeValue === a || i !== null && i.suppressHydrationWarning === !0 || Ep(e.nodeValue, a)), e || Aa(t, !0);
          } else e = ps(e).createTextNode(i), e[ht] = t, t.stateNode = e;
        }
        return Je(t), null;
      case 31:
        if (a = t.memoizedState, e === null || e.memoizedState !== null) {
          if (i = Rl(t), a !== null) {
            if (e === null) {
              if (!i) throw Error(u(318));
              if (e = t.memoizedState, e = e !== null ? e.dehydrated : null, !e) throw Error(u(557));
              e[ht] = t;
            } else ll(), (t.flags & 128) === 0 && (t.memoizedState = null), t.flags |= 4;
            Je(t), e = !1;
          } else a = fc(), e !== null && e.memoizedState !== null && (e.memoizedState.hydrationErrors = a), e = !0;
          if (!e)
            return t.flags & 256 ? (Mt(t), t) : (Mt(t), null);
          if ((t.flags & 128) !== 0) throw Error(u(558));
        }
        return Je(t), null;
      case 13:
        if (i = t.memoizedState, e === null || e.memoizedState !== null && e.memoizedState.dehydrated !== null) {
          if (n = Rl(t), i !== null && i.dehydrated !== null) {
            if (e === null) {
              if (!n) throw Error(u(318));
              if (n = t.memoizedState, n = n !== null ? n.dehydrated : null, !n) throw Error(u(317));
              n[ht] = t;
            } else ll(), (t.flags & 128) === 0 && (t.memoizedState = null), t.flags |= 4;
            Je(t), n = !1;
          } else n = fc(), e !== null && e.memoizedState !== null && (e.memoizedState.hydrationErrors = n), n = !0;
          if (!n)
            return t.flags & 256 ? (Mt(t), t) : (Mt(t), null);
        }
        return Mt(t), (t.flags & 128) !== 0 ? (t.lanes = a, t) : (a = i !== null, e = e !== null && e.memoizedState !== null, a && (i = t.child, n = null, i.alternate !== null && i.alternate.memoizedState !== null && i.alternate.memoizedState.cachePool !== null && (n = i.alternate.memoizedState.cachePool.pool), s = null, i.memoizedState !== null && i.memoizedState.cachePool !== null && (s = i.memoizedState.cachePool.pool), s !== n && (i.flags |= 2048)), a !== e && a && (t.child.flags |= 8192), Wn(t, t.updateQueue), Je(t), null);
      case 4:
        return _e(), e === null && Np(t.stateNode.containerInfo), Je(t), null;
      case 10:
        return ua(t.type), Je(t), null;
      case 19:
        if (D(at), i = t.memoizedState, i === null) return Je(t), null;
        if (n = (t.flags & 128) !== 0, s = i.rendering, s === null) if (n) qi(i, !1);
        else {
          if (Pe !== 0 || e !== null && (e.flags & 128) !== 0) for (e = t.child; e !== null; ) {
            if (s = Ln(e), s !== null) {
              for (t.flags |= 128, qi(i, !1), e = s.updateQueue, t.updateQueue = e, Wn(t, e), t.subtreeFlags = 0, e = a, a = t.child; a !== null; ) rd(a, e), a = a.sibling;
              return G(at, at.current & 1 | 2), Ce && oa(t, i.treeForkCount), t.child;
            }
            e = e.sibling;
          }
          i.tail !== null && et() > as && (t.flags |= 128, n = !0, qi(i, !1), t.lanes = 4194304);
        }
        else {
          if (!n) if (e = Ln(s), e !== null) {
            if (t.flags |= 128, n = !0, e = e.updateQueue, t.updateQueue = e, Wn(t, e), qi(i, !0), i.tail === null && i.tailMode === "hidden" && !s.alternate && !Ce) return Je(t), null;
          } else 2 * et() - i.renderingStartTime > as && a !== 536870912 && (t.flags |= 128, n = !0, qi(i, !1), t.lanes = 4194304);
          i.isBackwards ? (s.sibling = t.child, t.child = s) : (e = i.last, e !== null ? e.sibling = s : t.child = s, i.last = s);
        }
        return i.tail !== null ? (e = i.tail, i.rendering = e, i.tail = e.sibling, i.renderingStartTime = et(), e.sibling = null, a = at.current, G(at, n ? a & 1 | 2 : a & 1), Ce && oa(t, i.treeForkCount), e) : (Je(t), null);
      case 22:
      case 23:
        return Mt(t), _c(), i = t.memoizedState !== null, e !== null ? e.memoizedState !== null !== i && (t.flags |= 8192) : i && (t.flags |= 8192), i ? (a & 536870912) !== 0 && (t.flags & 128) === 0 && (Je(t), t.subtreeFlags & 6 && (t.flags |= 8192)) : Je(t), a = t.updateQueue, a !== null && Wn(t, a.retryQueue), a = null, e !== null && e.memoizedState !== null && e.memoizedState.cachePool !== null && (a = e.memoizedState.cachePool.pool), i = null, t.memoizedState !== null && t.memoizedState.cachePool !== null && (i = t.memoizedState.cachePool.pool), i !== a && (t.flags |= 2048), e !== null && D(sl), null;
      case 24:
        return a = null, e !== null && (a = e.memoizedState.cache), t.memoizedState.cache !== a && (t.flags |= 2048), ua(it), Je(t), null;
      case 25:
        return null;
      case 30:
        return null;
    }
    throw Error(u(156, t.tag));
  }
  function B0(e, t) {
    switch (uc(t), t.tag) {
      case 1:
        return e = t.flags, e & 65536 ? (t.flags = e & -65537 | 128, t) : null;
      case 3:
        return ua(it), _e(), e = t.flags, (e & 65536) !== 0 && (e & 128) === 0 ? (t.flags = e & -65537 | 128, t) : null;
      case 26:
      case 27:
      case 5:
        return Ie(t), null;
      case 31:
        if (t.memoizedState !== null) {
          if (Mt(t), t.alternate === null) throw Error(u(340));
          ll();
        }
        return e = t.flags, e & 65536 ? (t.flags = e & -65537 | 128, t) : null;
      case 13:
        if (Mt(t), e = t.memoizedState, e !== null && e.dehydrated !== null) {
          if (t.alternate === null) throw Error(u(340));
          ll();
        }
        return e = t.flags, e & 65536 ? (t.flags = e & -65537 | 128, t) : null;
      case 19:
        return D(at), null;
      case 4:
        return _e(), null;
      case 10:
        return ua(t.type), null;
      case 22:
      case 23:
        return Mt(t), _c(), e !== null && D(sl), e = t.flags, e & 65536 ? (t.flags = e & -65537 | 128, t) : null;
      case 24:
        return ua(it), null;
      case 25:
        return null;
      default:
        return null;
    }
  }
  function Mu(e, t) {
    switch (uc(t), t.tag) {
      case 3:
        ua(it), _e();
        break;
      case 26:
      case 27:
      case 5:
        Ie(t);
        break;
      case 4:
        _e();
        break;
      case 31:
        t.memoizedState !== null && Mt(t);
        break;
      case 13:
        Mt(t);
        break;
      case 19:
        D(at);
        break;
      case 10:
        ua(t.type);
        break;
      case 22:
      case 23:
        Mt(t), _c(), e !== null && D(sl);
        break;
      case 24:
        ua(it);
    }
  }
  function Li(e, t) {
    try {
      var a = t.updateQueue, i = a !== null ? a.lastEffect : null;
      if (i !== null) {
        var n = i.next;
        a = n;
        do {
          if ((a.tag & e) === e) {
            i = void 0;
            var s = a.create, c = a.inst;
            i = s(), c.destroy = i;
          }
          a = a.next;
        } while (a !== n);
      }
    } catch (d) {
      Be(t, t.return, d);
    }
  }
  function Da(e, t, a) {
    try {
      var i = t.updateQueue, n = i !== null ? i.lastEffect : null;
      if (n !== null) {
        var s = n.next;
        i = s;
        do {
          if ((i.tag & e) === e) {
            var c = i.inst, d = c.destroy;
            if (d !== void 0) {
              c.destroy = void 0, n = t;
              var x = a, M = d;
              try {
                M();
              } catch (q) {
                Be(n, x, q);
              }
            }
          }
          i = i.next;
        } while (i !== s);
      }
    } catch (q) {
      Be(t, t.return, q);
    }
  }
  function Ou(e) {
    var t = e.updateQueue;
    if (t !== null) {
      var a = e.stateNode;
      try {
        _d(t, a);
      } catch (i) {
        Be(e, e.return, i);
      }
    }
  }
  function Du(e, t, a) {
    a.props = fl(e.type, e.memoizedProps), a.state = e.memoizedState;
    try {
      a.componentWillUnmount();
    } catch (i) {
      Be(e, t, i);
    }
  }
  function Hi(e, t) {
    try {
      var a = e.ref;
      if (a !== null) {
        switch (e.tag) {
          case 26:
          case 27:
          case 5:
            var i = e.stateNode;
            break;
          case 30:
            i = e.stateNode;
            break;
          default:
            i = e.stateNode;
        }
        typeof a == "function" ? e.refCleanup = a(i) : a.current = i;
      }
    } catch (n) {
      Be(e, t, n);
    }
  }
  function la(e, t) {
    var a = e.ref, i = e.refCleanup;
    if (a !== null) if (typeof i == "function") try {
      i();
    } catch (n) {
      Be(e, t, n);
    } finally {
      e.refCleanup = null, e = e.alternate, e != null && (e.refCleanup = null);
    }
    else if (typeof a == "function") try {
      a(null);
    } catch (n) {
      Be(e, t, n);
    }
    else a.current = null;
  }
  function Uu(e) {
    var t = e.type, a = e.memoizedProps, i = e.stateNode;
    try {
      e: switch (t) {
        case "button":
        case "input":
        case "select":
        case "textarea":
          a.autoFocus && i.focus();
          break e;
        case "img":
          a.src ? i.src = a.src : a.srcSet && (i.srcset = a.srcSet);
      }
    } catch (n) {
      Be(e, e.return, n);
    }
  }
  function ir(e, t, a) {
    try {
      var i = e.stateNode;
      sh(i, e.type, a, t), i[St] = t;
    } catch (n) {
      Be(e, e.return, n);
    }
  }
  function Ru(e) {
    return e.tag === 5 || e.tag === 3 || e.tag === 26 || e.tag === 27 && Ga(e.type) || e.tag === 4;
  }
  function nr(e) {
    e: for (; ; ) {
      for (; e.sibling === null; ) {
        if (e.return === null || Ru(e.return)) return null;
        e = e.return;
      }
      for (e.sibling.return = e.return, e = e.sibling; e.tag !== 5 && e.tag !== 6 && e.tag !== 18; ) {
        if (e.tag === 27 && Ga(e.type) || e.flags & 2 || e.child === null || e.tag === 4) continue e;
        e.child.return = e, e = e.child;
      }
      if (!(e.flags & 2)) return e.stateNode;
    }
  }
  function sr(e, t, a) {
    var i = e.tag;
    if (i === 5 || i === 6) e = e.stateNode, t ? (a.nodeType === 9 ? a.body : a.nodeName === "HTML" ? a.ownerDocument.body : a).insertBefore(e, t) : (t = a.nodeType === 9 ? a.body : a.nodeName === "HTML" ? a.ownerDocument.body : a, t.appendChild(e), a = a._reactRootContainer, a != null || t.onclick !== null || (t.onclick = sa));
    else if (i !== 4 && (i === 27 && Ga(e.type) && (a = e.stateNode, t = null), e = e.child, e !== null)) for (sr(e, t, a), e = e.sibling; e !== null; ) sr(e, t, a), e = e.sibling;
  }
  function Fn(e, t, a) {
    var i = e.tag;
    if (i === 5 || i === 6) e = e.stateNode, t ? a.insertBefore(e, t) : a.appendChild(e);
    else if (i !== 4 && (i === 27 && Ga(e.type) && (a = e.stateNode), e = e.child, e !== null)) for (Fn(e, t, a), e = e.sibling; e !== null; ) Fn(e, t, a), e = e.sibling;
  }
  function qu(e) {
    var t = e.stateNode, a = e.memoizedProps;
    try {
      for (var i = e.type, n = t.attributes; n.length; ) t.removeAttributeNode(n[0]);
      bt(t, i, a), t[ht] = e, t[St] = a;
    } catch (s) {
      Be(e, e.return, s);
    }
  }
  var xa = !1, ct = !1, cr = !1, Lu = typeof WeakSet == "function" ? WeakSet : Set, pt = null;
  function G0(e, t) {
    if (e = e.containerInfo, kr = vs, e = Po(e), ec(e)) {
      if ("selectionStart" in e) var a = {
        start: e.selectionStart,
        end: e.selectionEnd
      };
      else e: {
        a = (a = e.ownerDocument) && a.defaultView || window;
        var i = a.getSelection && a.getSelection();
        if (i && i.rangeCount !== 0) {
          a = i.anchorNode;
          var n = i.anchorOffset, s = i.focusNode;
          i = i.focusOffset;
          try {
            a.nodeType, s.nodeType;
          } catch {
            a = null;
            break e;
          }
          var c = 0, d = -1, x = -1, M = 0, q = 0, Y = e, O = null;
          t: for (; ; ) {
            for (var U; Y !== a || n !== 0 && Y.nodeType !== 3 || (d = c + n), Y !== s || i !== 0 && Y.nodeType !== 3 || (x = c + i), Y.nodeType === 3 && (c += Y.nodeValue.length), (U = Y.firstChild) !== null; )
              O = Y, Y = U;
            for (; ; ) {
              if (Y === e) break t;
              if (O === a && ++M === n && (d = c), O === s && ++q === i && (x = c), (U = Y.nextSibling) !== null) break;
              Y = O, O = Y.parentNode;
            }
            Y = U;
          }
          a = d === -1 || x === -1 ? null : {
            start: d,
            end: x
          };
        } else a = null;
      }
      a = a || {
        start: 0,
        end: 0
      };
    } else a = null;
    for (Er = {
      focusedElem: e,
      selectionRange: a
    }, vs = !1, pt = t; pt !== null; ) if (t = pt, e = t.child, (t.subtreeFlags & 1028) !== 0 && e !== null) e.return = t, pt = e;
    else for (; pt !== null; ) {
      switch (t = pt, s = t.alternate, e = t.flags, t.tag) {
        case 0:
          if ((e & 4) !== 0 && (e = t.updateQueue, e = e !== null ? e.events : null, e !== null)) for (a = 0; a < e.length; a++) n = e[a], n.ref.impl = n.nextImpl;
          break;
        case 11:
        case 15:
          break;
        case 1:
          if ((e & 1024) !== 0 && s !== null) {
            e = void 0, a = t, n = s.memoizedProps, s = s.memoizedState, i = a.stateNode;
            try {
              var ce = fl(a.type, n);
              e = i.getSnapshotBeforeUpdate(ce, s), i.__reactInternalSnapshotBeforeUpdate = e;
            } catch (ve) {
              Be(a, a.return, ve);
            }
          }
          break;
        case 3:
          if ((e & 1024) !== 0) {
            if (e = t.stateNode.containerInfo, a = e.nodeType, a === 9) Cr(e);
            else if (a === 1) switch (e.nodeName) {
              case "HEAD":
              case "HTML":
              case "BODY":
                Cr(e);
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
          if ((e & 1024) !== 0) throw Error(u(163));
      }
      if (e = t.sibling, e !== null) {
        e.return = t.return, pt = e;
        break;
      }
      pt = t.return;
    }
  }
  function Hu(e, t, a) {
    var i = a.flags;
    switch (a.tag) {
      case 0:
      case 11:
      case 15:
        ba(e, a), i & 4 && Li(5, a);
        break;
      case 1:
        if (ba(e, a), i & 4) if (e = a.stateNode, t === null) try {
          e.componentDidMount();
        } catch (c) {
          Be(a, a.return, c);
        }
        else {
          var n = fl(a.type, t.memoizedProps);
          t = t.memoizedState;
          try {
            e.componentDidUpdate(n, t, e.__reactInternalSnapshotBeforeUpdate);
          } catch (c) {
            Be(a, a.return, c);
          }
        }
        i & 64 && Ou(a), i & 512 && Hi(a, a.return);
        break;
      case 3:
        if (ba(e, a), i & 64 && (e = a.updateQueue, e !== null)) {
          if (t = null, a.child !== null) switch (a.child.tag) {
            case 27:
            case 5:
              t = a.child.stateNode;
              break;
            case 1:
              t = a.child.stateNode;
          }
          try {
            _d(e, t);
          } catch (c) {
            Be(a, a.return, c);
          }
        }
        break;
      case 27:
        t === null && i & 4 && qu(a);
      case 26:
      case 5:
        ba(e, a), t === null && i & 4 && Uu(a), i & 512 && Hi(a, a.return);
        break;
      case 12:
        ba(e, a);
        break;
      case 31:
        ba(e, a), i & 4 && Yu(e, a);
        break;
      case 13:
        ba(e, a), i & 4 && Vu(e, a), i & 64 && (e = a.memoizedState, e !== null && (e = e.dehydrated, e !== null && (a = $0.bind(null, a), hh(e, a))));
        break;
      case 22:
        if (i = a.memoizedState !== null || xa, !i) {
          t = t !== null && t.memoizedState !== null || ct, n = xa;
          var s = ct;
          xa = i, (ct = t) && !s ? va(e, a, (a.subtreeFlags & 8772) !== 0) : ba(e, a), xa = n, ct = s;
        }
        break;
      case 30:
        break;
      default:
        ba(e, a);
    }
  }
  function Bu(e) {
    var t = e.alternate;
    t !== null && (e.alternate = null, Bu(t)), e.child = null, e.deletions = null, e.sibling = null, e.tag === 5 && (t = e.stateNode, t !== null && qs(t)), e.stateNode = null, e.return = null, e.dependencies = null, e.memoizedProps = null, e.memoizedState = null, e.pendingProps = null, e.stateNode = null, e.updateQueue = null;
  }
  var $e = null, Nt = !1;
  function ga(e, t, a) {
    for (a = a.child; a !== null; ) Gu(e, t, a), a = a.sibling;
  }
  function Gu(e, t, a) {
    if (Xe && typeof Xe.onCommitFiberUnmount == "function") try {
      Xe.onCommitFiberUnmount(tt, a);
    } catch {
    }
    switch (a.tag) {
      case 26:
        ct || la(a, t), ga(e, t, a), a.memoizedState ? a.memoizedState.count-- : a.stateNode && (a = a.stateNode, a.parentNode.removeChild(a));
        break;
      case 27:
        ct || la(a, t);
        var i = $e, n = Nt;
        Ga(a.type) && ($e = a.stateNode, Nt = !1), ga(e, t, a), Ji(a.stateNode), $e = i, Nt = n;
        break;
      case 5:
        ct || la(a, t);
      case 6:
        if (i = $e, n = Nt, $e = null, ga(e, t, a), $e = i, Nt = n, $e !== null) if (Nt) try {
          ($e.nodeType === 9 ? $e.body : $e.nodeName === "HTML" ? $e.ownerDocument.body : $e).removeChild(a.stateNode);
        } catch (s) {
          Be(a, t, s);
        }
        else try {
          $e.removeChild(a.stateNode);
        } catch (s) {
          Be(a, t, s);
        }
        break;
      case 18:
        $e !== null && (Nt ? (e = $e, Dp(e.nodeType === 9 ? e.body : e.nodeName === "HTML" ? e.ownerDocument.body : e, a.stateNode), li(e)) : Dp($e, a.stateNode));
        break;
      case 4:
        i = $e, n = Nt, $e = a.stateNode.containerInfo, Nt = !0, ga(e, t, a), $e = i, Nt = n;
        break;
      case 0:
      case 11:
      case 14:
      case 15:
        Da(2, a, t), ct || Da(4, a, t), ga(e, t, a);
        break;
      case 1:
        ct || (la(a, t), i = a.stateNode, typeof i.componentWillUnmount == "function" && Du(a, t, i)), ga(e, t, a);
        break;
      case 21:
        ga(e, t, a);
        break;
      case 22:
        ct = (i = ct) || a.memoizedState !== null, ga(e, t, a), ct = i;
        break;
      default:
        ga(e, t, a);
    }
  }
  function Yu(e, t) {
    if (t.memoizedState === null && (e = t.alternate, e !== null && (e = e.memoizedState, e !== null))) {
      e = e.dehydrated;
      try {
        li(e);
      } catch (a) {
        Be(t, t.return, a);
      }
    }
  }
  function Vu(e, t) {
    if (t.memoizedState === null && (e = t.alternate, e !== null && (e = e.memoizedState, e !== null && (e = e.dehydrated, e !== null)))) try {
      li(e);
    } catch (a) {
      Be(t, t.return, a);
    }
  }
  function Y0(e) {
    switch (e.tag) {
      case 31:
      case 13:
      case 19:
        var t = e.stateNode;
        return t === null && (t = e.stateNode = new Lu()), t;
      case 22:
        return e = e.stateNode, t = e._retryCache, t === null && (t = e._retryCache = new Lu()), t;
      default:
        throw Error(u(435, e.tag));
    }
  }
  function Pn(e, t) {
    var a = Y0(e);
    t.forEach(function(i) {
      if (!a.has(i)) {
        a.add(i);
        var n = W0.bind(null, e, i);
        i.then(n, n);
      }
    });
  }
  function wt(e, t) {
    var a = t.deletions;
    if (a !== null) for (var i = 0; i < a.length; i++) {
      var n = a[i], s = e, c = t, d = c;
      e: for (; d !== null; ) {
        switch (d.tag) {
          case 27:
            if (Ga(d.type)) {
              $e = d.stateNode, Nt = !1;
              break e;
            }
            break;
          case 5:
            $e = d.stateNode, Nt = !1;
            break e;
          case 3:
          case 4:
            $e = d.stateNode.containerInfo, Nt = !0;
            break e;
        }
        d = d.return;
      }
      if ($e === null) throw Error(u(160));
      Gu(s, c, n), $e = null, Nt = !1, s = n.alternate, s !== null && (s.return = null), n.return = null;
    }
    if (t.subtreeFlags & 13886) for (t = t.child; t !== null; ) Xu(t, e), t = t.sibling;
  }
  var $t = null;
  function Xu(e, t) {
    var a = e.alternate, i = e.flags;
    switch (e.tag) {
      case 0:
      case 11:
      case 14:
      case 15:
        wt(t, e), _t(e), i & 4 && (Da(3, e, e.return), Li(3, e), Da(5, e, e.return));
        break;
      case 1:
        wt(t, e), _t(e), i & 512 && (ct || a === null || la(a, a.return)), i & 64 && xa && (e = e.updateQueue, e !== null && (i = e.callbacks, i !== null && (a = e.shared.hiddenCallbacks, e.shared.hiddenCallbacks = a === null ? i : a.concat(i))));
        break;
      case 26:
        var n = $t;
        if (wt(t, e), _t(e), i & 512 && (ct || a === null || la(a, a.return)), i & 4) {
          var s = a !== null ? a.memoizedState : null;
          if (i = e.memoizedState, a === null) if (i === null) if (e.stateNode === null) {
            e: {
              i = e.type, a = e.memoizedProps, n = n.ownerDocument || n;
              t: switch (i) {
                case "title":
                  s = n.getElementsByTagName("title")[0], (!s || s[pi] || s[ht] || s.namespaceURI === "http://www.w3.org/2000/svg" || s.hasAttribute("itemprop")) && (s = n.createElement(i), n.head.insertBefore(s, n.querySelector("head > title"))), bt(s, i, a), s[ht] = e, ut(s), i = s;
                  break e;
                case "link":
                  var c = Qp("link", "href", n).get(i + (a.href || ""));
                  if (c) {
                    for (var d = 0; d < c.length; d++) if (s = c[d], s.getAttribute("href") === (a.href == null || a.href === "" ? null : a.href) && s.getAttribute("rel") === (a.rel == null ? null : a.rel) && s.getAttribute("title") === (a.title == null ? null : a.title) && s.getAttribute("crossorigin") === (a.crossOrigin == null ? null : a.crossOrigin)) {
                      c.splice(d, 1);
                      break t;
                    }
                  }
                  s = n.createElement(i), bt(s, i, a), n.head.appendChild(s);
                  break;
                case "meta":
                  if (c = Qp("meta", "content", n).get(i + (a.content || ""))) {
                    for (d = 0; d < c.length; d++) if (s = c[d], s.getAttribute("content") === (a.content == null ? null : "" + a.content) && s.getAttribute("name") === (a.name == null ? null : a.name) && s.getAttribute("property") === (a.property == null ? null : a.property) && s.getAttribute("http-equiv") === (a.httpEquiv == null ? null : a.httpEquiv) && s.getAttribute("charset") === (a.charSet == null ? null : a.charSet)) {
                      c.splice(d, 1);
                      break t;
                    }
                  }
                  s = n.createElement(i), bt(s, i, a), n.head.appendChild(s);
                  break;
                default:
                  throw Error(u(468, i));
              }
              s[ht] = e, ut(s), i = s;
            }
            e.stateNode = i;
          } else Zp(n, e.type, e.stateNode);
          else e.stateNode = Xp(n, i, e.memoizedProps);
          else s !== i ? (s === null ? a.stateNode !== null && (a = a.stateNode, a.parentNode.removeChild(a)) : s.count--, i === null ? Zp(n, e.type, e.stateNode) : Xp(n, i, e.memoizedProps)) : i === null && e.stateNode !== null && ir(e, e.memoizedProps, a.memoizedProps);
        }
        break;
      case 27:
        wt(t, e), _t(e), i & 512 && (ct || a === null || la(a, a.return)), a !== null && i & 4 && ir(e, e.memoizedProps, a.memoizedProps);
        break;
      case 5:
        if (wt(t, e), _t(e), i & 512 && (ct || a === null || la(a, a.return)), e.flags & 32) {
          n = e.stateNode;
          try {
            _l(n, "");
          } catch (ce) {
            Be(e, e.return, ce);
          }
        }
        i & 4 && e.stateNode != null && (n = e.memoizedProps, ir(e, n, a !== null ? a.memoizedProps : n)), i & 1024 && (cr = !0);
        break;
      case 6:
        if (wt(t, e), _t(e), i & 4) {
          if (e.stateNode === null) throw Error(u(162));
          i = e.memoizedProps, a = e.stateNode;
          try {
            a.nodeValue = i;
          } catch (ce) {
            Be(e, e.return, ce);
          }
        }
        break;
      case 3:
        if (ms = null, n = $t, $t = fs(t.containerInfo), wt(t, e), $t = n, _t(e), i & 4 && a !== null && a.memoizedState.isDehydrated) try {
          li(t.containerInfo);
        } catch (ce) {
          Be(e, e.return, ce);
        }
        cr && (cr = !1, Qu(e));
        break;
      case 4:
        i = $t, $t = fs(e.stateNode.containerInfo), wt(t, e), _t(e), $t = i;
        break;
      case 12:
        wt(t, e), _t(e);
        break;
      case 31:
        wt(t, e), _t(e), i & 4 && (i = e.updateQueue, i !== null && (e.updateQueue = null, Pn(e, i)));
        break;
      case 13:
        wt(t, e), _t(e), e.child.flags & 8192 && e.memoizedState !== null != (a !== null && a.memoizedState !== null) && (ts = et()), i & 4 && (i = e.updateQueue, i !== null && (e.updateQueue = null, Pn(e, i)));
        break;
      case 22:
        n = e.memoizedState !== null;
        var x = a !== null && a.memoizedState !== null, M = xa, q = ct;
        if (xa = M || n, ct = q || x, wt(t, e), ct = q, xa = M, _t(e), i & 8192) e: for (t = e.stateNode, t._visibility = n ? t._visibility & -2 : t._visibility | 1, n && (a === null || x || xa || ct || hl(e)), a = null, t = e; ; ) {
          if (t.tag === 5 || t.tag === 26) {
            if (a === null) {
              x = a = t;
              try {
                if (s = x.stateNode, n) c = s.style, typeof c.setProperty == "function" ? c.setProperty("display", "none", "important") : c.display = "none";
                else {
                  d = x.stateNode;
                  var Y = x.memoizedProps.style, O = Y != null && Y.hasOwnProperty("display") ? Y.display : null;
                  d.style.display = O == null || typeof O == "boolean" ? "" : ("" + O).trim();
                }
              } catch (ce) {
                Be(x, x.return, ce);
              }
            }
          } else if (t.tag === 6) {
            if (a === null) {
              x = t;
              try {
                x.stateNode.nodeValue = n ? "" : x.memoizedProps;
              } catch (ce) {
                Be(x, x.return, ce);
              }
            }
          } else if (t.tag === 18) {
            if (a === null) {
              x = t;
              try {
                var U = x.stateNode;
                n ? Up(U, !0) : Up(x.stateNode, !1);
              } catch (ce) {
                Be(x, x.return, ce);
              }
            }
          } else if ((t.tag !== 22 && t.tag !== 23 || t.memoizedState === null || t === e) && t.child !== null) {
            t.child.return = t, t = t.child;
            continue;
          }
          if (t === e) break e;
          for (; t.sibling === null; ) {
            if (t.return === null || t.return === e) break e;
            a === t && (a = null), t = t.return;
          }
          a === t && (a = null), t.sibling.return = t.return, t = t.sibling;
        }
        i & 4 && (i = e.updateQueue, i !== null && (a = i.retryQueue, a !== null && (i.retryQueue = null, Pn(e, a))));
        break;
      case 19:
        wt(t, e), _t(e), i & 4 && (i = e.updateQueue, i !== null && (e.updateQueue = null, Pn(e, i)));
        break;
      case 30:
        break;
      case 21:
        break;
      default:
        wt(t, e), _t(e);
    }
  }
  function _t(e) {
    var t = e.flags;
    if (t & 2) {
      try {
        for (var a, i = e.return; i !== null; ) {
          if (Ru(i)) {
            a = i;
            break;
          }
          i = i.return;
        }
        if (a == null) throw Error(u(160));
        switch (a.tag) {
          case 27:
            var n = a.stateNode;
            Fn(e, nr(e), n);
            break;
          case 5:
            var s = a.stateNode;
            a.flags & 32 && (_l(s, ""), a.flags &= -33), Fn(e, nr(e), s);
            break;
          case 3:
          case 4:
            var c = a.stateNode.containerInfo;
            sr(e, nr(e), c);
            break;
          default:
            throw Error(u(161));
        }
      } catch (d) {
        Be(e, e.return, d);
      }
      e.flags &= -3;
    }
    t & 4096 && (e.flags &= -4097);
  }
  function Qu(e) {
    if (e.subtreeFlags & 1024) for (e = e.child; e !== null; ) {
      var t = e;
      Qu(t), t.tag === 5 && t.flags & 1024 && t.stateNode.reset(), e = e.sibling;
    }
  }
  function ba(e, t) {
    if (t.subtreeFlags & 8772) for (t = t.child; t !== null; ) Hu(e, t.alternate, t), t = t.sibling;
  }
  function hl(e) {
    for (e = e.child; e !== null; ) {
      var t = e;
      switch (t.tag) {
        case 0:
        case 11:
        case 14:
        case 15:
          Da(4, t, t.return), hl(t);
          break;
        case 1:
          la(t, t.return);
          var a = t.stateNode;
          typeof a.componentWillUnmount == "function" && Du(t, t.return, a), hl(t);
          break;
        case 27:
          Ji(t.stateNode);
        case 26:
        case 5:
          la(t, t.return), hl(t);
          break;
        case 22:
          t.memoizedState === null && hl(t);
          break;
        case 30:
          hl(t);
          break;
        default:
          hl(t);
      }
      e = e.sibling;
    }
  }
  function va(e, t, a) {
    for (a = a && (t.subtreeFlags & 8772) !== 0, t = t.child; t !== null; ) {
      var i = t.alternate, n = e, s = t, c = s.flags;
      switch (s.tag) {
        case 0:
        case 11:
        case 15:
          va(n, s, a), Li(4, s);
          break;
        case 1:
          if (va(n, s, a), i = s, n = i.stateNode, typeof n.componentDidMount == "function") try {
            n.componentDidMount();
          } catch (M) {
            Be(i, i.return, M);
          }
          if (i = s, n = i.updateQueue, n !== null) {
            var d = i.stateNode;
            try {
              var x = n.shared.hiddenCallbacks;
              if (x !== null) for (n.shared.hiddenCallbacks = null, n = 0; n < x.length; n++) wd(x[n], d);
            } catch (M) {
              Be(i, i.return, M);
            }
          }
          a && c & 64 && Ou(s), Hi(s, s.return);
          break;
        case 27:
          qu(s);
        case 26:
        case 5:
          va(n, s, a), a && i === null && c & 4 && Uu(s), Hi(s, s.return);
          break;
        case 12:
          va(n, s, a);
          break;
        case 31:
          va(n, s, a), a && c & 4 && Yu(n, s);
          break;
        case 13:
          va(n, s, a), a && c & 4 && Vu(n, s);
          break;
        case 22:
          s.memoizedState === null && va(n, s, a), Hi(s, s.return);
          break;
        case 30:
          break;
        default:
          va(n, s, a);
      }
      t = t.sibling;
    }
  }
  function rr(e, t) {
    var a = null;
    e !== null && e.memoizedState !== null && e.memoizedState.cachePool !== null && (a = e.memoizedState.cachePool.pool), e = null, t.memoizedState !== null && t.memoizedState.cachePool !== null && (e = t.memoizedState.cachePool.pool), e !== a && (e != null && e.refCount++, a != null && wi(a));
  }
  function or(e, t) {
    e = null, t.alternate !== null && (e = t.alternate.memoizedState.cache), t = t.memoizedState.cache, t !== e && (t.refCount++, e != null && wi(e));
  }
  function Wt(e, t, a, i) {
    if (t.subtreeFlags & 10256) for (t = t.child; t !== null; ) Zu(e, t, a, i), t = t.sibling;
  }
  function Zu(e, t, a, i) {
    var n = t.flags;
    switch (t.tag) {
      case 0:
      case 11:
      case 15:
        Wt(e, t, a, i), n & 2048 && Li(9, t);
        break;
      case 1:
        Wt(e, t, a, i);
        break;
      case 3:
        Wt(e, t, a, i), n & 2048 && (e = null, t.alternate !== null && (e = t.alternate.memoizedState.cache), t = t.memoizedState.cache, t !== e && (t.refCount++, e != null && wi(e)));
        break;
      case 12:
        if (n & 2048) {
          Wt(e, t, a, i), e = t.stateNode;
          try {
            var s = t.memoizedProps, c = s.id, d = s.onPostCommit;
            typeof d == "function" && d(c, t.alternate === null ? "mount" : "update", e.passiveEffectDuration, -0);
          } catch (x) {
            Be(t, t.return, x);
          }
        } else Wt(e, t, a, i);
        break;
      case 31:
        Wt(e, t, a, i);
        break;
      case 13:
        Wt(e, t, a, i);
        break;
      case 23:
        break;
      case 22:
        s = t.stateNode, c = t.alternate, t.memoizedState !== null ? s._visibility & 2 ? Wt(e, t, a, i) : Bi(e, t) : s._visibility & 2 ? Wt(e, t, a, i) : (s._visibility |= 2, Zl(e, t, a, i, (t.subtreeFlags & 10256) !== 0 || !1)), n & 2048 && rr(c, t);
        break;
      case 24:
        Wt(e, t, a, i), n & 2048 && or(t.alternate, t);
        break;
      default:
        Wt(e, t, a, i);
    }
  }
  function Zl(e, t, a, i, n) {
    for (n = n && ((t.subtreeFlags & 10256) !== 0 || !1), t = t.child; t !== null; ) {
      var s = e, c = t, d = a, x = i, M = c.flags;
      switch (c.tag) {
        case 0:
        case 11:
        case 15:
          Zl(s, c, d, x, n), Li(8, c);
          break;
        case 23:
          break;
        case 22:
          var q = c.stateNode;
          c.memoizedState !== null ? q._visibility & 2 ? Zl(s, c, d, x, n) : Bi(s, c) : (q._visibility |= 2, Zl(s, c, d, x, n)), n && M & 2048 && rr(c.alternate, c);
          break;
        case 24:
          Zl(s, c, d, x, n), n && M & 2048 && or(c.alternate, c);
          break;
        default:
          Zl(s, c, d, x, n);
      }
      t = t.sibling;
    }
  }
  function Bi(e, t) {
    if (t.subtreeFlags & 10256) for (t = t.child; t !== null; ) {
      var a = e, i = t, n = i.flags;
      switch (i.tag) {
        case 22:
          Bi(a, i), n & 2048 && rr(i.alternate, i);
          break;
        case 24:
          Bi(a, i), n & 2048 && or(i.alternate, i);
          break;
        default:
          Bi(a, i);
      }
      t = t.sibling;
    }
  }
  var Gi = 8192;
  function Kl(e, t, a) {
    if (e.subtreeFlags & Gi) for (e = e.child; e !== null; ) Ku(e, t, a), e = e.sibling;
  }
  function Ku(e, t, a) {
    switch (e.tag) {
      case 26:
        Kl(e, t, a), e.flags & Gi && e.memoizedState !== null && _h(a, $t, e.memoizedState, e.memoizedProps);
        break;
      case 5:
        Kl(e, t, a);
        break;
      case 3:
      case 4:
        var i = $t;
        $t = fs(e.stateNode.containerInfo), Kl(e, t, a), $t = i;
        break;
      case 22:
        e.memoizedState === null && (i = e.alternate, i !== null && i.memoizedState !== null ? (i = Gi, Gi = 16777216, Kl(e, t, a), Gi = i) : Kl(e, t, a));
        break;
      default:
        Kl(e, t, a);
    }
  }
  function Ju(e) {
    var t = e.alternate;
    if (t !== null && (e = t.child, e !== null)) {
      t.child = null;
      do
        t = e.sibling, e.sibling = null, e = t;
      while (e !== null);
    }
  }
  function Yi(e) {
    var t = e.deletions;
    if ((e.flags & 16) !== 0) {
      if (t !== null) for (var a = 0; a < t.length; a++) {
        var i = t[a];
        pt = i, $u(i, e);
      }
      Ju(e);
    }
    if (e.subtreeFlags & 10256) for (e = e.child; e !== null; ) Iu(e), e = e.sibling;
  }
  function Iu(e) {
    switch (e.tag) {
      case 0:
      case 11:
      case 15:
        Yi(e), e.flags & 2048 && Da(9, e, e.return);
        break;
      case 3:
        Yi(e);
        break;
      case 12:
        Yi(e);
        break;
      case 22:
        var t = e.stateNode;
        e.memoizedState !== null && t._visibility & 2 && (e.return === null || e.return.tag !== 13) ? (t._visibility &= -3, es(e)) : Yi(e);
        break;
      default:
        Yi(e);
    }
  }
  function es(e) {
    var t = e.deletions;
    if ((e.flags & 16) !== 0) {
      if (t !== null) for (var a = 0; a < t.length; a++) {
        var i = t[a];
        pt = i, $u(i, e);
      }
      Ju(e);
    }
    for (e = e.child; e !== null; ) {
      switch (t = e, t.tag) {
        case 0:
        case 11:
        case 15:
          Da(8, t, t.return), es(t);
          break;
        case 22:
          a = t.stateNode, a._visibility & 2 && (a._visibility &= -3, es(t));
          break;
        default:
          es(t);
      }
      e = e.sibling;
    }
  }
  function $u(e, t) {
    for (; pt !== null; ) {
      var a = pt;
      switch (a.tag) {
        case 0:
        case 11:
        case 15:
          Da(8, a, t);
          break;
        case 23:
        case 22:
          if (a.memoizedState !== null && a.memoizedState.cachePool !== null) {
            var i = a.memoizedState.cachePool.pool;
            i != null && i.refCount++;
          }
          break;
        case 24:
          wi(a.memoizedState.cache);
      }
      if (i = a.child, i !== null) i.return = a, pt = i;
      else e: for (a = e; pt !== null; ) {
        i = pt;
        var n = i.sibling, s = i.return;
        if (Bu(i), i === a) {
          pt = null;
          break e;
        }
        if (n !== null) {
          n.return = s, pt = n;
          break e;
        }
        pt = s;
      }
    }
  }
  var V0 = {
    getCacheForType: function(e) {
      var t = xt(it), a = t.data.get(e);
      return a === void 0 && (a = e(), t.data.set(e, a)), a;
    },
    cacheSignal: function() {
      return xt(it).controller.signal;
    }
  }, X0 = typeof WeakMap == "function" ? WeakMap : Map, Le = 0, Qe = null, ke = null, Ae = 0, He = 0, Ot = null, Ua = !1, Jl = !1, dr = !1, ja = 0, Pe = 0, Ra = 0, ml = 0, ur = 0, Dt = 0, Il = 0, Vi = null, kt = null, pr = !1, ts = 0, Wu = 0, as = 1 / 0, ls = null, qa = null, dt = 0, La = null, $l = null, ya = 0, fr = 0, hr = null, Fu = null, Xi = 0, mr = null;
  function Xt() {
    return (Le & 2) !== 0 && Ae !== 0 ? Ae & -Ae : B.T !== null ? yr() : go();
  }
  function Pu() {
    if (Dt === 0) if ((Ae & 536870912) === 0 || Ce) {
      var e = dn;
      dn <<= 1, (dn & 3932160) === 0 && (dn = 262144), Dt = e;
    } else Dt = 536870912;
    return e = Ct.current, e !== null && (e.flags |= 32), Dt;
  }
  function Et(e, t, a) {
    (e === Qe && (He === 2 || He === 9) || e.cancelPendingCommit !== null) && (Wl(e, 0), Ha(e, Ae, Dt, !1)), fn(e, a), ((Le & 2) === 0 || e !== Qe) && (e === Qe && ((Le & 2) === 0 && (ml |= a), Pe === 4 && Ha(e, Ae, Dt, !1)), Sa(e));
  }
  function ep(e, t, a) {
    if ((Le & 6) !== 0) throw Error(u(327));
    var i = !a && (t & 127) === 0 && (t & e.expiredLanes) === 0 || di(e, t), n = i ? K0(e, t) : gr(e, t, !0), s = i;
    do {
      if (n === 0) {
        Jl && !i && Ha(e, t, 0, !1);
        break;
      } else {
        if (a = e.current.alternate, s && !Q0(a)) {
          n = gr(e, t, !1), s = !1;
          continue;
        }
        if (n === 2) {
          if (s = t, e.errorRecoveryDisabledLanes & s) var c = 0;
          else c = e.pendingLanes & -536870913, c = c !== 0 ? c : c & 536870912 ? 536870912 : 0;
          if (c !== 0) {
            t = c;
            e: {
              var d = e;
              n = Vi;
              var x = d.current.memoizedState.isDehydrated;
              if (x && (Wl(d, c).flags |= 256), c = gr(d, c, !1), c !== 2) {
                if (dr && !x) {
                  d.errorRecoveryDisabledLanes |= s, ml |= s, n = 4;
                  break e;
                }
                s = kt, kt = n, s !== null && (kt === null ? kt = s : kt.push.apply(kt, s));
              }
              n = c;
            }
            if (s = !1, n !== 2) continue;
          }
        }
        if (n === 1) {
          Wl(e, 0), Ha(e, t, 0, !0);
          break;
        }
        e: {
          switch (i = e, s = n, s) {
            case 0:
            case 1:
              throw Error(u(345));
            case 4:
              if ((t & 4194048) !== t) break;
            case 6:
              Ha(i, t, Dt, !Ua);
              break e;
            case 2:
              kt = null;
              break;
            case 3:
            case 5:
              break;
            default:
              throw Error(u(329));
          }
          if ((t & 62914560) === t && (n = ts + 300 - et(), 10 < n)) {
            if (Ha(i, t, Dt, !Ua), pn(i, 0, !0) !== 0) break e;
            ya = t, i.timeoutHandle = Mp(tp.bind(null, i, a, kt, ls, pr, t, Dt, ml, Il, Ua, s, "Throttled", -0, 0), n);
            break e;
          }
          tp(i, a, kt, ls, pr, t, Dt, ml, Il, Ua, s, null, -0, 0);
        }
      }
      break;
    } while (!0);
    Sa(e);
  }
  function tp(e, t, a, i, n, s, c, d, x, M, q, Y, O, U) {
    if (e.timeoutHandle = -1, Y = t.subtreeFlags, Y & 8192 || (Y & 16785408) === 16785408) {
      Y = {
        stylesheets: null,
        count: 0,
        imgCount: 0,
        imgBytes: 0,
        suspenseyImages: [],
        waitingForImages: !0,
        waitingForViewTransition: !1,
        unsuspend: sa
      }, Ku(t, s, Y);
      var ce = (s & 62914560) === s ? ts - et() : (s & 4194048) === s ? Wu - et() : 0;
      if (ce = kh(Y, ce), ce !== null) {
        ya = s, e.cancelPendingCommit = ce(op.bind(null, e, t, s, a, i, n, c, d, x, q, Y, null, O, U)), Ha(e, s, c, !M);
        return;
      }
    }
    op(e, t, s, a, i, n, c, d, x);
  }
  function Q0(e) {
    for (var t = e; ; ) {
      var a = t.tag;
      if ((a === 0 || a === 11 || a === 15) && t.flags & 16384 && (a = t.updateQueue, a !== null && (a = a.stores, a !== null))) for (var i = 0; i < a.length; i++) {
        var n = a[i], s = n.getSnapshot;
        n = n.value;
        try {
          if (!At(s(), n)) return !1;
        } catch {
          return !1;
        }
      }
      if (a = t.child, t.subtreeFlags & 16384 && a !== null) a.return = t, t = a;
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
  function Ha(e, t, a, i) {
    t &= ~ur, t &= ~ml, e.suspendedLanes |= t, e.pingedLanes &= ~t, i && (e.warmLanes |= t), i = e.expirationTimes;
    for (var n = t; 0 < n; ) {
      var s = 31 - ot(n), c = 1 << s;
      i[s] = -1, n &= ~c;
    }
    a !== 0 && fo(e, a, t);
  }
  function is() {
    return (Le & 6) === 0 ? (Qi(0, !1), !1) : !0;
  }
  function xr() {
    if (ke !== null) {
      if (He === 0) var e = ke.return;
      else e = ke, da = il = null, Mc(e), Gl = null, ki = 0, e = ke;
      for (; e !== null; ) Mu(e.alternate, e), e = e.return;
      ke = null;
    }
  }
  function Wl(e, t) {
    var a = e.timeoutHandle;
    a !== -1 && (e.timeoutHandle = -1, oh(a)), a = e.cancelPendingCommit, a !== null && (e.cancelPendingCommit = null, a()), ya = 0, xr(), Qe = e, ke = a = ra(e.current, null), Ae = t, He = 0, Ot = null, Ua = !1, Jl = di(e, t), dr = !1, Il = Dt = ur = ml = Ra = Pe = 0, kt = Vi = null, pr = !1, (t & 8) !== 0 && (t |= t & 32);
    var i = e.entangledLanes;
    if (i !== 0) for (e = e.entanglements, i &= t; 0 < i; ) {
      var n = 31 - ot(i), s = 1 << n;
      t |= e[n], i &= ~s;
    }
    return ja = t, wn(), a;
  }
  function ap(e, t) {
    ze = null, B.H = Ui, t === Bl || t === On ? (t = yd(), He = 3) : t === jc ? (t = yd(), He = 4) : He = t === Jc ? 8 : t !== null && typeof t == "object" && typeof t.then == "function" ? 6 : 1, Ot = t, ke === null && (Pe = 1, Kn(e, Ht(t, e.current)));
  }
  function lp() {
    var e = Ct.current;
    return e === null ? !0 : (Ae & 4194048) === Ae ? Vt === null : (Ae & 62914560) === Ae || (Ae & 536870912) !== 0 ? e === Vt : !1;
  }
  function ip() {
    var e = B.H;
    return B.H = Ui, e === null ? Ui : e;
  }
  function np() {
    var e = B.A;
    return B.A = V0, e;
  }
  function ns() {
    Pe = 4, Ua || (Ae & 4194048) !== Ae && Ct.current !== null || (Jl = !0), (Ra & 134217727) === 0 && (ml & 134217727) === 0 || Qe === null || Ha(Qe, Ae, Dt, !1);
  }
  function gr(e, t, a) {
    var i = Le;
    Le |= 2;
    var n = ip(), s = np();
    (Qe !== e || Ae !== t) && (ls = null, Wl(e, t)), t = !1;
    var c = Pe;
    e: do
      try {
        if (He !== 0 && ke !== null) {
          var d = ke, x = Ot;
          switch (He) {
            case 8:
              xr(), c = 6;
              break e;
            case 3:
            case 2:
            case 9:
            case 6:
              Ct.current === null && (t = !0);
              var M = He;
              if (He = 0, Ot = null, Fl(e, d, x, M), a && Jl) {
                c = 0;
                break e;
              }
              break;
            default:
              M = He, He = 0, Ot = null, Fl(e, d, x, M);
          }
        }
        Z0(), c = Pe;
        break;
      } catch (q) {
        ap(e, q);
      }
    while (!0);
    return t && e.shellSuspendCounter++, da = il = null, Le = i, B.H = n, B.A = s, ke === null && (Qe = null, Ae = 0, wn()), c;
  }
  function Z0() {
    for (; ke !== null; ) sp(ke);
  }
  function K0(e, t) {
    var a = Le;
    Le |= 2;
    var i = ip(), n = np();
    Qe !== e || Ae !== t ? (ls = null, as = et() + 500, Wl(e, t)) : Jl = di(e, t);
    e: do
      try {
        if (He !== 0 && ke !== null) {
          t = ke;
          var s = Ot;
          t: switch (He) {
            case 1:
              He = 0, Ot = null, Fl(e, t, s, 1);
              break;
            case 2:
            case 9:
              if (vd(s)) {
                He = 0, Ot = null, cp(t);
                break;
              }
              t = function() {
                He !== 2 && He !== 9 || Qe !== e || (He = 7), Sa(e);
              }, s.then(t, t);
              break e;
            case 3:
              He = 7;
              break e;
            case 4:
              He = 5;
              break e;
            case 7:
              vd(s) ? (He = 0, Ot = null, cp(t)) : (He = 0, Ot = null, Fl(e, t, s, 7));
              break;
            case 5:
              var c = null;
              switch (ke.tag) {
                case 26:
                  c = ke.memoizedState;
                case 5:
                case 27:
                  var d = ke;
                  if (c ? Kp(c) : d.stateNode.complete) {
                    He = 0, Ot = null;
                    var x = d.sibling;
                    if (x !== null) ke = x;
                    else {
                      var M = d.return;
                      M !== null ? (ke = M, ss(M)) : ke = null;
                    }
                    break t;
                  }
              }
              He = 0, Ot = null, Fl(e, t, s, 5);
              break;
            case 6:
              He = 0, Ot = null, Fl(e, t, s, 6);
              break;
            case 8:
              xr(), Pe = 6;
              break e;
            default:
              throw Error(u(462));
          }
        }
        J0();
        break;
      } catch (q) {
        ap(e, q);
      }
    while (!0);
    return da = il = null, B.H = i, B.A = n, Le = a, ke !== null ? 0 : (Qe = null, Ae = 0, wn(), Pe);
  }
  function J0() {
    for (; ke !== null && !We(); ) sp(ke);
  }
  function sp(e) {
    var t = Tu(e.alternate, e, ja);
    e.memoizedProps = e.pendingProps, t === null ? ss(e) : ke = t;
  }
  function cp(e) {
    var t = e, a = t.alternate;
    switch (t.tag) {
      case 15:
      case 0:
        t = Nu(a, t, t.pendingProps, t.type, void 0, Ae);
        break;
      case 11:
        t = Nu(a, t, t.pendingProps, t.type.render, t.ref, Ae);
        break;
      case 5:
        Mc(t);
      default:
        Mu(a, t), t = ke = rd(t, ja), t = Tu(a, t, ja);
    }
    e.memoizedProps = e.pendingProps, t === null ? ss(e) : ke = t;
  }
  function Fl(e, t, a, i) {
    da = il = null, Mc(t), Gl = null, ki = 0;
    var n = t.return;
    try {
      if (R0(e, n, t, a, Ae)) {
        Pe = 1, Kn(e, Ht(a, e.current)), ke = null;
        return;
      }
    } catch (s) {
      if (n !== null) throw ke = n, s;
      Pe = 1, Kn(e, Ht(a, e.current)), ke = null;
      return;
    }
    t.flags & 32768 ? (Ce || i === 1 ? e = !0 : Jl || (Ae & 536870912) !== 0 ? e = !1 : (Ua = e = !0, (i === 2 || i === 9 || i === 3 || i === 6) && (i = Ct.current, i !== null && i.tag === 13 && (i.flags |= 16384))), rp(t, e)) : ss(t);
  }
  function ss(e) {
    var t = e;
    do {
      if ((t.flags & 32768) !== 0) {
        rp(t, Ua);
        return;
      }
      e = t.return;
      var a = H0(t.alternate, t, ja);
      if (a !== null) {
        ke = a;
        return;
      }
      if (t = t.sibling, t !== null) {
        ke = t;
        return;
      }
      ke = t = e;
    } while (t !== null);
    Pe === 0 && (Pe = 5);
  }
  function rp(e, t) {
    do {
      var a = B0(e.alternate, e);
      if (a !== null) {
        a.flags &= 32767, ke = a;
        return;
      }
      if (a = e.return, a !== null && (a.flags |= 32768, a.subtreeFlags = 0, a.deletions = null), !t && (e = e.sibling, e !== null)) {
        ke = e;
        return;
      }
      ke = e = a;
    } while (e !== null);
    Pe = 6, ke = null;
  }
  function op(e, t, a, i, n, s, c, d, x) {
    e.cancelPendingCommit = null;
    do
      cs();
    while (dt !== 0);
    if ((Le & 6) !== 0) throw Error(u(327));
    if (t !== null) {
      if (t === e.current) throw Error(u(177));
      if (s = t.lanes | t.childLanes, s |= nc, Uf(e, a, s, c, d, x), e === Qe && (ke = Qe = null, Ae = 0), $l = t, La = e, ya = a, fr = s, hr = n, Fu = i, (t.subtreeFlags & 10256) !== 0 || (t.flags & 10256) !== 0 ? (e.callbackNode = null, e.callbackPriority = 0, F0(ea, function() {
        return hp(), null;
      })) : (e.callbackNode = null, e.callbackPriority = 0), i = (t.flags & 13878) !== 0, (t.subtreeFlags & 13878) !== 0 || i) {
        i = B.T, B.T = null, n = X.p, X.p = 2, c = Le, Le |= 4;
        try {
          G0(e, t, a);
        } finally {
          Le = c, X.p = n, B.T = i;
        }
      }
      dt = 1, dp(), up(), pp();
    }
  }
  function dp() {
    if (dt === 1) {
      dt = 0;
      var e = La, t = $l, a = (t.flags & 13878) !== 0;
      if ((t.subtreeFlags & 13878) !== 0 || a) {
        a = B.T, B.T = null;
        var i = X.p;
        X.p = 2;
        var n = Le;
        Le |= 4;
        try {
          Xu(t, e);
          var s = Er, c = Po(e.containerInfo), d = s.focusedElem, x = s.selectionRange;
          if (c !== d && d && d.ownerDocument && Fo(d.ownerDocument.documentElement, d)) {
            if (x !== null && ec(d)) {
              var M = x.start, q = x.end;
              if (q === void 0 && (q = M), "selectionStart" in d) d.selectionStart = M, d.selectionEnd = Math.min(q, d.value.length);
              else {
                var Y = d.ownerDocument || document, O = Y && Y.defaultView || window;
                if (O.getSelection) {
                  var U = O.getSelection(), ce = d.textContent.length, ve = Math.min(x.start, ce), Ve = x.end === void 0 ? ve : Math.min(x.end, ce);
                  !U.extend && ve > Ve && (c = Ve, Ve = ve, ve = c);
                  var z = Wo(d, ve), b = Wo(d, Ve);
                  if (z && b && (U.rangeCount !== 1 || U.anchorNode !== z.node || U.anchorOffset !== z.offset || U.focusNode !== b.node || U.focusOffset !== b.offset)) {
                    var T = Y.createRange();
                    T.setStart(z.node, z.offset), U.removeAllRanges(), ve > Ve ? (U.addRange(T), U.extend(b.node, b.offset)) : (T.setEnd(b.node, b.offset), U.addRange(T));
                  }
                }
              }
            }
            for (Y = [], U = d; U = U.parentNode; ) U.nodeType === 1 && Y.push({
              element: U,
              left: U.scrollLeft,
              top: U.scrollTop
            });
            for (typeof d.focus == "function" && d.focus(), d = 0; d < Y.length; d++) {
              var L = Y[d];
              L.element.scrollLeft = L.left, L.element.scrollTop = L.top;
            }
          }
          vs = !!kr, Er = kr = null;
        } finally {
          Le = n, X.p = i, B.T = a;
        }
      }
      e.current = t, dt = 2;
    }
  }
  function up() {
    if (dt === 2) {
      dt = 0;
      var e = La, t = $l, a = (t.flags & 8772) !== 0;
      if ((t.subtreeFlags & 8772) !== 0 || a) {
        a = B.T, B.T = null;
        var i = X.p;
        X.p = 2;
        var n = Le;
        Le |= 4;
        try {
          Hu(e, t.alternate, t);
        } finally {
          Le = n, X.p = i, B.T = a;
        }
      }
      dt = 3;
    }
  }
  function pp() {
    if (dt === 4 || dt === 3) {
      dt = 0, Jt();
      var e = La, t = $l, a = ya, i = Fu;
      (t.subtreeFlags & 10256) !== 0 || (t.flags & 10256) !== 0 ? dt = 5 : (dt = 0, $l = La = null, fp(e, e.pendingLanes));
      var n = e.pendingLanes;
      if (n === 0 && (qa = null), Us(a), t = t.stateNode, Xe && typeof Xe.onCommitFiberRoot == "function") try {
        Xe.onCommitFiberRoot(tt, t, void 0, (t.current.flags & 128) === 128);
      } catch {
      }
      if (i !== null) {
        t = B.T, n = X.p, X.p = 2, B.T = null;
        try {
          for (var s = e.onRecoverableError, c = 0; c < i.length; c++) {
            var d = i[c];
            s(d.value, { componentStack: d.stack });
          }
        } finally {
          B.T = t, X.p = n;
        }
      }
      (ya & 3) !== 0 && cs(), Sa(e), n = e.pendingLanes, (a & 261930) !== 0 && (n & 42) !== 0 ? e === mr ? Xi++ : (Xi = 0, mr = e) : Xi = 0, Qi(0, !1);
    }
  }
  function fp(e, t) {
    (e.pooledCacheLanes &= t) === 0 && (t = e.pooledCache, t != null && (e.pooledCache = null, wi(t)));
  }
  function cs() {
    return dp(), up(), pp(), hp();
  }
  function hp() {
    if (dt !== 5) return !1;
    var e = La, t = fr;
    fr = 0;
    var a = Us(ya), i = B.T, n = X.p;
    try {
      X.p = 32 > a ? 32 : a, B.T = null, a = hr, hr = null;
      var s = La, c = ya;
      if (dt = 0, $l = La = null, ya = 0, (Le & 6) !== 0) throw Error(u(331));
      var d = Le;
      if (Le |= 4, Iu(s.current), Zu(s, s.current, c, a), Le = d, Qi(0, !1), Xe && typeof Xe.onPostCommitFiberRoot == "function") try {
        Xe.onPostCommitFiberRoot(tt, s);
      } catch {
      }
      return !0;
    } finally {
      X.p = n, B.T = i, fp(e, t);
    }
  }
  function mp(e, t, a) {
    t = Ht(a, t), t = Kc(e.stateNode, t, 2), e = ul(e, t, 2), e !== null && (fn(e, 2), Sa(e));
  }
  function Be(e, t, a) {
    if (e.tag === 3) mp(e, e, a);
    else for (; t !== null; ) {
      if (t.tag === 3) {
        mp(t, e, a);
        break;
      } else if (t.tag === 1) {
        var i = t.stateNode;
        if (typeof t.type.getDerivedStateFromError == "function" || typeof i.componentDidCatch == "function" && (qa === null || !qa.has(i))) {
          e = Ht(a, e), a = xu(2), i = ul(t, a, 2), i !== null && (gu(a, i, t, e), fn(i, 2), Sa(i));
          break;
        }
      }
      t = t.return;
    }
  }
  function br(e, t, a) {
    var i = e.pingCache;
    if (i === null) {
      i = e.pingCache = new X0();
      var n = /* @__PURE__ */ new Set();
      i.set(t, n);
    } else n = i.get(t), n === void 0 && (n = /* @__PURE__ */ new Set(), i.set(t, n));
    n.has(a) || (dr = !0, n.add(a), e = I0.bind(null, e, t, a), t.then(e, e));
  }
  function I0(e, t, a) {
    var i = e.pingCache;
    i !== null && i.delete(t), e.pingedLanes |= e.suspendedLanes & a, e.warmLanes &= ~a, Qe === e && (Ae & a) === a && (Pe === 4 || Pe === 3 && (Ae & 62914560) === Ae && 300 > et() - ts ? (Le & 2) === 0 && Wl(e, 0) : ur |= a, Il === Ae && (Il = 0)), Sa(e);
  }
  function xp(e, t) {
    t === 0 && (t = po()), e = tl(e, t), e !== null && (fn(e, t), Sa(e));
  }
  function $0(e) {
    var t = e.memoizedState, a = 0;
    t !== null && (a = t.retryLane), xp(e, a);
  }
  function W0(e, t) {
    var a = 0;
    switch (e.tag) {
      case 31:
      case 13:
        var i = e.stateNode, n = e.memoizedState;
        n !== null && (a = n.retryLane);
        break;
      case 19:
        i = e.stateNode;
        break;
      case 22:
        i = e.stateNode._retryCache;
        break;
      default:
        throw Error(u(314));
    }
    i !== null && i.delete(t), xp(e, a);
  }
  function F0(e, t) {
    return k(e, t);
  }
  var rs = null, Pl = null, vr = !1, os = !1, jr = !1, Ba = 0;
  function Sa(e) {
    e !== Pl && e.next === null && (Pl === null ? rs = Pl = e : Pl = Pl.next = e), os = !0, vr || (vr = !0, eh());
  }
  function Qi(e, t) {
    if (!jr && os) {
      jr = !0;
      do
        for (var a = !1, i = rs; i !== null; ) {
          if (!t) if (e !== 0) {
            var n = i.pendingLanes;
            if (n === 0) var s = 0;
            else {
              var c = i.suspendedLanes, d = i.pingedLanes;
              s = (1 << 31 - ot(42 | e) + 1) - 1, s &= n & ~(c & ~d), s = s & 201326741 ? s & 201326741 | 1 : s ? s | 2 : 0;
            }
            s !== 0 && (a = !0, jp(i, s));
          } else s = Ae, s = pn(i, i === Qe ? s : 0, i.cancelPendingCommit !== null || i.timeoutHandle !== -1), (s & 3) === 0 || di(i, s) || (a = !0, jp(i, s));
          i = i.next;
        }
      while (a);
      jr = !1;
    }
  }
  function P0() {
    gp();
  }
  function gp() {
    os = vr = !1;
    var e = 0;
    Ba !== 0 && rh() && (e = Ba);
    for (var t = et(), a = null, i = rs; i !== null; ) {
      var n = i.next, s = bp(i, t);
      s === 0 ? (i.next = null, a === null ? rs = n : a.next = n, n === null && (Pl = a)) : (a = i, (e !== 0 || (s & 3) !== 0) && (os = !0)), i = n;
    }
    dt !== 0 && dt !== 5 || Qi(e, !1), Ba !== 0 && (Ba = 0);
  }
  function bp(e, t) {
    for (var a = e.suspendedLanes, i = e.pingedLanes, n = e.expirationTimes, s = e.pendingLanes & -62914561; 0 < s; ) {
      var c = 31 - ot(s), d = 1 << c, x = n[c];
      x === -1 ? ((d & a) === 0 || (d & i) !== 0) && (n[c] = Df(d, t)) : x <= t && (e.expiredLanes |= d), s &= ~d;
    }
    if (t = Qe, a = Ae, a = pn(e, e === t ? a : 0, e.cancelPendingCommit !== null || e.timeoutHandle !== -1), i = e.callbackNode, a === 0 || e === t && (He === 2 || He === 9) || e.cancelPendingCommit !== null) return i !== null && i !== null && Se(i), e.callbackNode = null, e.callbackPriority = 0;
    if ((a & 3) === 0 || di(e, a)) {
      if (t = a & -a, t === e.callbackPriority) return t;
      switch (i !== null && Se(i), Us(a)) {
        case 2:
        case 8:
          a = Ut;
          break;
        case 32:
          a = ea;
          break;
        case 268435456:
          a = h;
          break;
        default:
          a = ea;
      }
      return i = vp.bind(null, e), a = k(a, i), e.callbackPriority = t, e.callbackNode = a, t;
    }
    return i !== null && i !== null && Se(i), e.callbackPriority = 2, e.callbackNode = null, 2;
  }
  function vp(e, t) {
    if (dt !== 0 && dt !== 5) return e.callbackNode = null, e.callbackPriority = 0, null;
    var a = e.callbackNode;
    if (cs() && e.callbackNode !== a) return null;
    var i = Ae;
    return i = pn(e, e === Qe ? i : 0, e.cancelPendingCommit !== null || e.timeoutHandle !== -1), i === 0 ? null : (ep(e, i, t), bp(e, et()), e.callbackNode != null && e.callbackNode === a ? vp.bind(null, e) : null);
  }
  function jp(e, t) {
    if (cs()) return null;
    ep(e, t, !0);
  }
  function eh() {
    dh(function() {
      (Le & 6) !== 0 ? k(jl, P0) : gp();
    });
  }
  function yr() {
    if (Ba === 0) {
      var e = Ll;
      e === 0 && (e = on, on <<= 1, (on & 261888) === 0 && (on = 256)), Ba = e;
    }
    return Ba;
  }
  function yp(e) {
    return e == null || typeof e == "symbol" || typeof e == "boolean" ? null : typeof e == "function" ? e : gn("" + e);
  }
  function Sp(e, t) {
    var a = t.ownerDocument.createElement("input");
    return a.name = t.name, a.value = t.value, e.id && a.setAttribute("form", e.id), t.parentNode.insertBefore(a, t), e = new FormData(e), a.parentNode.removeChild(a), e;
  }
  function th(e, t, a, i, n) {
    if (t === "submit" && a && a.stateNode === n) {
      var s = yp((n[St] || null).action), c = i.submitter;
      c && (t = (t = c[St] || null) ? yp(t.formAction) : c.getAttribute("formAction"), t !== null && (s = t, c = null));
      var d = new yn("action", "action", null, i, n);
      e.push({
        event: d,
        listeners: [{
          instance: null,
          listener: function() {
            if (i.defaultPrevented) {
              if (Ba !== 0) {
                var x = c ? Sp(n, c) : new FormData(n);
                Gc(a, {
                  pending: !0,
                  data: x,
                  method: n.method,
                  action: s
                }, null, x);
              }
            } else typeof s == "function" && (d.preventDefault(), x = c ? Sp(n, c) : new FormData(n), Gc(a, {
              pending: !0,
              data: x,
              method: n.method,
              action: s
            }, s, x));
          },
          currentTarget: n
        }]
      });
    }
  }
  for (var Sr = 0; Sr < ic.length; Sr++) {
    var zr = ic[Sr];
    It(zr.toLowerCase(), "on" + (zr[0].toUpperCase() + zr.slice(1)));
  }
  It(ad, "onAnimationEnd"), It(ld, "onAnimationIteration"), It(id, "onAnimationStart"), It("dblclick", "onDoubleClick"), It("focusin", "onFocus"), It("focusout", "onBlur"), It(x0, "onTransitionRun"), It(g0, "onTransitionStart"), It(b0, "onTransitionCancel"), It(nd, "onTransitionEnd"), Nl("onMouseEnter", ["mouseout", "mouseover"]), Nl("onMouseLeave", ["mouseout", "mouseover"]), Nl("onPointerEnter", ["pointerout", "pointerover"]), Nl("onPointerLeave", ["pointerout", "pointerover"]), Wa("onChange", "change click focusin focusout input keydown keyup selectionchange".split(" ")), Wa("onSelect", "focusout contextmenu dragend focusin keydown keyup mousedown mouseup selectionchange".split(" ")), Wa("onBeforeInput", [
    "compositionend",
    "keypress",
    "textInput",
    "paste"
  ]), Wa("onCompositionEnd", "compositionend focusout keydown keypress keyup mousedown".split(" ")), Wa("onCompositionStart", "compositionstart focusout keydown keypress keyup mousedown".split(" ")), Wa("onCompositionUpdate", "compositionupdate focusout keydown keypress keyup mousedown".split(" "));
  var Zi = "abort canplay canplaythrough durationchange emptied encrypted ended error loadeddata loadedmetadata loadstart pause play playing progress ratechange resize seeked seeking stalled suspend timeupdate volumechange waiting".split(" "), ah = new Set("beforetoggle cancel close invalid load scroll scrollend toggle".split(" ").concat(Zi));
  function zp(e, t) {
    t = (t & 4) !== 0;
    for (var a = 0; a < e.length; a++) {
      var i = e[a], n = i.event;
      i = i.listeners;
      e: {
        var s = void 0;
        if (t) for (var c = i.length - 1; 0 <= c; c--) {
          var d = i[c], x = d.instance, M = d.currentTarget;
          if (d = d.listener, x !== s && n.isPropagationStopped()) break e;
          s = d, n.currentTarget = M;
          try {
            s(n);
          } catch (q) {
            Nn(q);
          }
          n.currentTarget = null, s = x;
        }
        else for (c = 0; c < i.length; c++) {
          if (d = i[c], x = d.instance, M = d.currentTarget, d = d.listener, x !== s && n.isPropagationStopped()) break e;
          s = d, n.currentTarget = M;
          try {
            s(n);
          } catch (q) {
            Nn(q);
          }
          n.currentTarget = null, s = x;
        }
      }
    }
  }
  function Ee(e, t) {
    var a = t[Rs];
    a === void 0 && (a = t[Rs] = /* @__PURE__ */ new Set());
    var i = e + "__bubble";
    a.has(i) || (wp(t, e, 2, !1), a.add(i));
  }
  function Nr(e, t, a) {
    var i = 0;
    t && (i |= 4), wp(a, e, i, t);
  }
  var ds = "_reactListening" + Math.random().toString(36).slice(2);
  function Np(e) {
    if (!e[ds]) {
      e[ds] = !0, jo.forEach(function(a) {
        a !== "selectionchange" && (ah.has(a) || Nr(a, !1, e), Nr(a, !0, e));
      });
      var t = e.nodeType === 9 ? e : e.ownerDocument;
      t === null || t[ds] || (t[ds] = !0, Nr("selectionchange", !1, t));
    }
  }
  function wp(e, t, a, i) {
    switch (Fp(t)) {
      case 2:
        var n = Mh;
        break;
      case 8:
        n = Oh;
        break;
      default:
        n = Hr;
    }
    a = n.bind(null, t, a, e), n = void 0, !Qs || t !== "touchstart" && t !== "touchmove" && t !== "wheel" || (n = !0), i ? n !== void 0 ? e.addEventListener(t, a, {
      capture: !0,
      passive: n
    }) : e.addEventListener(t, a, !0) : n !== void 0 ? e.addEventListener(t, a, { passive: n }) : e.addEventListener(t, a, !1);
  }
  function wr(e, t, a, i, n) {
    var s = i;
    if ((t & 1) === 0 && (t & 2) === 0 && i !== null) e: for (; ; ) {
      if (i === null) return;
      var c = i.tag;
      if (c === 3 || c === 4) {
        var d = i.stateNode.containerInfo;
        if (d === n) break;
        if (c === 4) for (c = i.return; c !== null; ) {
          var x = c.tag;
          if ((x === 3 || x === 4) && c.stateNode.containerInfo === n) return;
          c = c.return;
        }
        for (; d !== null; ) {
          if (c = yl(d), c === null) return;
          if (x = c.tag, x === 5 || x === 6 || x === 26 || x === 27) {
            i = s = c;
            continue e;
          }
          d = d.parentNode;
        }
      }
      i = i.return;
    }
    Mo(function() {
      var M = s, q = Vs(a), Y = [];
      e: {
        var O = sd.get(e);
        if (O !== void 0) {
          var U = yn, ce = e;
          switch (e) {
            case "keypress":
              if (vn(a) === 0) break e;
            case "keydown":
            case "keyup":
              U = Pf;
              break;
            case "focusin":
              ce = "focus", U = Is;
              break;
            case "focusout":
              ce = "blur", U = Is;
              break;
            case "beforeblur":
            case "afterblur":
              U = Is;
              break;
            case "click":
              if (a.button === 2) break e;
            case "auxclick":
            case "dblclick":
            case "mousedown":
            case "mousemove":
            case "mouseup":
            case "mouseout":
            case "mouseover":
            case "contextmenu":
              U = Uo;
              break;
            case "drag":
            case "dragend":
            case "dragenter":
            case "dragexit":
            case "dragleave":
            case "dragover":
            case "dragstart":
            case "drop":
              U = Zf;
              break;
            case "touchcancel":
            case "touchend":
            case "touchmove":
            case "touchstart":
              U = e0;
              break;
            case ad:
            case ld:
            case id:
              U = Kf;
              break;
            case nd:
              U = t0;
              break;
            case "scroll":
            case "scrollend":
              U = Qf;
              break;
            case "wheel":
              U = a0;
              break;
            case "copy":
            case "cut":
            case "paste":
              U = Jf;
              break;
            case "gotpointercapture":
            case "lostpointercapture":
            case "pointercancel":
            case "pointerdown":
            case "pointermove":
            case "pointerout":
            case "pointerover":
            case "pointerup":
              U = qo;
              break;
            case "toggle":
            case "beforetoggle":
              U = l0;
          }
          var ve = (t & 4) !== 0, Ve = !ve && (e === "scroll" || e === "scrollend"), z = ve ? O !== null ? O + "Capture" : null : O;
          ve = [];
          for (var b = M, T; b !== null; ) {
            var L = b;
            if (T = L.stateNode, L = L.tag, L !== 5 && L !== 26 && L !== 27 || T === null || z === null || (L = hi(b, z), L != null && ve.push(Ki(b, L, T))), Ve) break;
            b = b.return;
          }
          0 < ve.length && (O = new U(O, ce, null, a, q), Y.push({
            event: O,
            listeners: ve
          }));
        }
      }
      if ((t & 7) === 0) {
        e: {
          if (O = e === "mouseover" || e === "pointerover", U = e === "mouseout" || e === "pointerout", O && a !== Ys && (ce = a.relatedTarget || a.fromElement) && (yl(ce) || ce[ui])) break e;
          if ((U || O) && (O = q.window === q ? q : (O = q.ownerDocument) ? O.defaultView || O.parentWindow : window, U ? (ce = a.relatedTarget || a.toElement, U = M, ce = ce ? yl(ce) : null, ce !== null && (Ve = v(ce), ve = ce.tag, ce !== Ve || ve !== 5 && ve !== 27 && ve !== 6) && (ce = null)) : (U = null, ce = M), U !== ce)) {
            if (ve = Uo, L = "onMouseLeave", z = "onMouseEnter", b = "mouse", (e === "pointerout" || e === "pointerover") && (ve = qo, L = "onPointerLeave", z = "onPointerEnter", b = "pointer"), Ve = U == null ? O : fi(U), T = ce == null ? O : fi(ce), O = new ve(L, b + "leave", U, a, q), O.target = Ve, O.relatedTarget = T, L = null, yl(q) === M && (ve = new ve(z, b + "enter", ce, a, q), ve.target = T, ve.relatedTarget = Ve, L = ve), Ve = L, U && ce) t: {
              for (ve = lh, z = U, b = ce, T = 0, L = z; L; L = ve(L)) T++;
              L = 0;
              for (var me = b; me; me = ve(me)) L++;
              for (; 0 < T - L; ) z = ve(z), T--;
              for (; 0 < L - T; ) b = ve(b), L--;
              for (; T--; ) {
                if (z === b || b !== null && z === b.alternate) {
                  ve = z;
                  break t;
                }
                z = ve(z), b = ve(b);
              }
              ve = null;
            }
            else ve = null;
            U !== null && _p(Y, O, U, ve, !1), ce !== null && Ve !== null && _p(Y, Ve, ce, ve, !0);
          }
        }
        e: {
          if (O = M ? fi(M) : window, U = O.nodeName && O.nodeName.toLowerCase(), U === "select" || U === "input" && O.type === "file") var De = Qo;
          else if (Vo(O)) if (Zo) De = f0;
          else {
            De = u0;
            var ue = d0;
          }
          else U = O.nodeName, !U || U.toLowerCase() !== "input" || O.type !== "checkbox" && O.type !== "radio" ? M && Gs(M.elementType) && (De = Qo) : De = p0;
          if (De && (De = De(e, M))) {
            Xo(Y, De, a, q);
            break e;
          }
          ue && ue(e, O, M), e === "focusout" && M && O.type === "number" && M.memoizedProps.value != null && Bs(O, "number", O.value);
        }
        switch (ue = M ? fi(M) : window, e) {
          case "focusin":
            (Vo(ue) || ue.contentEditable === "true") && (Tl = ue, tc = M, Si = null);
            break;
          case "focusout":
            Si = tc = Tl = null;
            break;
          case "mousedown":
            ac = !0;
            break;
          case "contextmenu":
          case "mouseup":
          case "dragend":
            ac = !1, ed(Y, a, q);
            break;
          case "selectionchange":
            if (m0) break;
          case "keydown":
          case "keyup":
            ed(Y, a, q);
        }
        var we;
        if (Ws) e: {
          switch (e) {
            case "compositionstart":
              var Te = "onCompositionStart";
              break e;
            case "compositionend":
              Te = "onCompositionEnd";
              break e;
            case "compositionupdate":
              Te = "onCompositionUpdate";
              break e;
          }
          Te = void 0;
        }
        else Al ? Go(e, a) && (Te = "onCompositionEnd") : e === "keydown" && a.keyCode === 229 && (Te = "onCompositionStart");
        Te && (Lo && a.locale !== "ko" && (Al || Te !== "onCompositionStart" ? Te === "onCompositionEnd" && Al && (we = Oo()) : (_a = q, Zs = "value" in _a ? _a.value : _a.textContent, Al = !0)), ue = us(M, Te), 0 < ue.length && (Te = new Ro(Te, e, null, a, q), Y.push({
          event: Te,
          listeners: ue
        }), we ? Te.data = we : (we = Yo(a), we !== null && (Te.data = we)))), (we = n0 ? s0(e, a) : c0(e, a)) && (Te = us(M, "onBeforeInput"), 0 < Te.length && (ue = new Ro("onBeforeInput", "beforeinput", null, a, q), Y.push({
          event: ue,
          listeners: Te
        }), ue.data = we)), th(Y, e, M, a, q);
      }
      zp(Y, t);
    });
  }
  function Ki(e, t, a) {
    return {
      instance: e,
      listener: t,
      currentTarget: a
    };
  }
  function us(e, t) {
    for (var a = t + "Capture", i = []; e !== null; ) {
      var n = e, s = n.stateNode;
      if (n = n.tag, n !== 5 && n !== 26 && n !== 27 || s === null || (n = hi(e, a), n != null && i.unshift(Ki(e, n, s)), n = hi(e, t), n != null && i.push(Ki(e, n, s))), e.tag === 3) return i;
      e = e.return;
    }
    return [];
  }
  function lh(e) {
    if (e === null) return null;
    do
      e = e.return;
    while (e && e.tag !== 5 && e.tag !== 27);
    return e || null;
  }
  function _p(e, t, a, i, n) {
    for (var s = t._reactName, c = []; a !== null && a !== i; ) {
      var d = a, x = d.alternate, M = d.stateNode;
      if (d = d.tag, x !== null && x === i) break;
      d !== 5 && d !== 26 && d !== 27 || M === null || (x = M, n ? (M = hi(a, s), M != null && c.unshift(Ki(a, M, x))) : n || (M = hi(a, s), M != null && c.push(Ki(a, M, x)))), a = a.return;
    }
    c.length !== 0 && e.push({
      event: t,
      listeners: c
    });
  }
  var ih = /\r\n?/g, nh = /\u0000|\uFFFD/g;
  function kp(e) {
    return (typeof e == "string" ? e : "" + e).replace(ih, `
`).replace(nh, "");
  }
  function Ep(e, t) {
    return t = kp(t), kp(e) === t;
  }
  function Ye(e, t, a, i, n, s) {
    switch (a) {
      case "children":
        typeof i == "string" ? t === "body" || t === "textarea" && i === "" || _l(e, i) : (typeof i == "number" || typeof i == "bigint") && t !== "body" && _l(e, "" + i);
        break;
      case "className":
        mn(e, "class", i);
        break;
      case "tabIndex":
        mn(e, "tabindex", i);
        break;
      case "dir":
      case "role":
      case "viewBox":
      case "width":
      case "height":
        mn(e, a, i);
        break;
      case "style":
        To(e, i, s);
        break;
      case "data":
        if (t !== "object") {
          mn(e, "data", i);
          break;
        }
      case "src":
      case "href":
        if (i === "" && (t !== "a" || a !== "href")) {
          e.removeAttribute(a);
          break;
        }
        if (i == null || typeof i == "function" || typeof i == "symbol" || typeof i == "boolean") {
          e.removeAttribute(a);
          break;
        }
        i = gn("" + i), e.setAttribute(a, i);
        break;
      case "action":
      case "formAction":
        if (typeof i == "function") {
          e.setAttribute(a, "javascript:throw new Error('A React form was unexpectedly submitted. If you called form.submit() manually, consider using form.requestSubmit() instead. If you\\'re trying to use event.stopPropagation() in a submit event handler, consider also calling event.preventDefault().')");
          break;
        } else typeof s == "function" && (a === "formAction" ? (t !== "input" && Ye(e, t, "name", n.name, n, null), Ye(e, t, "formEncType", n.formEncType, n, null), Ye(e, t, "formMethod", n.formMethod, n, null), Ye(e, t, "formTarget", n.formTarget, n, null)) : (Ye(e, t, "encType", n.encType, n, null), Ye(e, t, "method", n.method, n, null), Ye(e, t, "target", n.target, n, null)));
        if (i == null || typeof i == "symbol" || typeof i == "boolean") {
          e.removeAttribute(a);
          break;
        }
        i = gn("" + i), e.setAttribute(a, i);
        break;
      case "onClick":
        i != null && (e.onclick = sa);
        break;
      case "onScroll":
        i != null && Ee("scroll", e);
        break;
      case "onScrollEnd":
        i != null && Ee("scrollend", e);
        break;
      case "dangerouslySetInnerHTML":
        if (i != null) {
          if (typeof i != "object" || !("__html" in i)) throw Error(u(61));
          if (a = i.__html, a != null) {
            if (n.children != null) throw Error(u(60));
            e.innerHTML = a;
          }
        }
        break;
      case "multiple":
        e.multiple = i && typeof i != "function" && typeof i != "symbol";
        break;
      case "muted":
        e.muted = i && typeof i != "function" && typeof i != "symbol";
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
        if (i == null || typeof i == "function" || typeof i == "boolean" || typeof i == "symbol") {
          e.removeAttribute("xlink:href");
          break;
        }
        a = gn("" + i), e.setAttributeNS("http://www.w3.org/1999/xlink", "xlink:href", a);
        break;
      case "contentEditable":
      case "spellCheck":
      case "draggable":
      case "value":
      case "autoReverse":
      case "externalResourcesRequired":
      case "focusable":
      case "preserveAlpha":
        i != null && typeof i != "function" && typeof i != "symbol" ? e.setAttribute(a, "" + i) : e.removeAttribute(a);
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
        i && typeof i != "function" && typeof i != "symbol" ? e.setAttribute(a, "") : e.removeAttribute(a);
        break;
      case "capture":
      case "download":
        i === !0 ? e.setAttribute(a, "") : i !== !1 && i != null && typeof i != "function" && typeof i != "symbol" ? e.setAttribute(a, i) : e.removeAttribute(a);
        break;
      case "cols":
      case "rows":
      case "size":
      case "span":
        i != null && typeof i != "function" && typeof i != "symbol" && !isNaN(i) && 1 <= i ? e.setAttribute(a, i) : e.removeAttribute(a);
        break;
      case "rowSpan":
      case "start":
        i == null || typeof i == "function" || typeof i == "symbol" || isNaN(i) ? e.removeAttribute(a) : e.setAttribute(a, i);
        break;
      case "popover":
        Ee("beforetoggle", e), Ee("toggle", e), hn(e, "popover", i);
        break;
      case "xlinkActuate":
        na(e, "http://www.w3.org/1999/xlink", "xlink:actuate", i);
        break;
      case "xlinkArcrole":
        na(e, "http://www.w3.org/1999/xlink", "xlink:arcrole", i);
        break;
      case "xlinkRole":
        na(e, "http://www.w3.org/1999/xlink", "xlink:role", i);
        break;
      case "xlinkShow":
        na(e, "http://www.w3.org/1999/xlink", "xlink:show", i);
        break;
      case "xlinkTitle":
        na(e, "http://www.w3.org/1999/xlink", "xlink:title", i);
        break;
      case "xlinkType":
        na(e, "http://www.w3.org/1999/xlink", "xlink:type", i);
        break;
      case "xmlBase":
        na(e, "http://www.w3.org/XML/1998/namespace", "xml:base", i);
        break;
      case "xmlLang":
        na(e, "http://www.w3.org/XML/1998/namespace", "xml:lang", i);
        break;
      case "xmlSpace":
        na(e, "http://www.w3.org/XML/1998/namespace", "xml:space", i);
        break;
      case "is":
        hn(e, "is", i);
        break;
      case "innerText":
      case "textContent":
        break;
      default:
        (!(2 < a.length) || a[0] !== "o" && a[0] !== "O" || a[1] !== "n" && a[1] !== "N") && (a = Vf.get(a) || a, hn(e, a, i));
    }
  }
  function _r(e, t, a, i, n, s) {
    switch (a) {
      case "style":
        To(e, i, s);
        break;
      case "dangerouslySetInnerHTML":
        if (i != null) {
          if (typeof i != "object" || !("__html" in i)) throw Error(u(61));
          if (a = i.__html, a != null) {
            if (n.children != null) throw Error(u(60));
            e.innerHTML = a;
          }
        }
        break;
      case "children":
        typeof i == "string" ? _l(e, i) : (typeof i == "number" || typeof i == "bigint") && _l(e, "" + i);
        break;
      case "onScroll":
        i != null && Ee("scroll", e);
        break;
      case "onScrollEnd":
        i != null && Ee("scrollend", e);
        break;
      case "onClick":
        i != null && (e.onclick = sa);
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
        if (!yo.hasOwnProperty(a)) e: {
          if (a[0] === "o" && a[1] === "n" && (n = a.endsWith("Capture"), t = a.slice(2, n ? a.length - 7 : void 0), s = e[St] || null, s = s != null ? s[a] : null, typeof s == "function" && e.removeEventListener(t, s, n), typeof i == "function")) {
            typeof s != "function" && s !== null && (a in e ? e[a] = null : e.hasAttribute(a) && e.removeAttribute(a)), e.addEventListener(t, i, n);
            break e;
          }
          a in e ? e[a] = i : i === !0 ? e.setAttribute(a, "") : hn(e, a, i);
        }
    }
  }
  function bt(e, t, a) {
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
        Ee("error", e), Ee("load", e);
        var i = !1, n = !1, s;
        for (s in a) if (a.hasOwnProperty(s)) {
          var c = a[s];
          if (c != null) switch (s) {
            case "src":
              i = !0;
              break;
            case "srcSet":
              n = !0;
              break;
            case "children":
            case "dangerouslySetInnerHTML":
              throw Error(u(137, t));
            default:
              Ye(e, t, s, c, a, null);
          }
        }
        n && Ye(e, t, "srcSet", a.srcSet, a, null), i && Ye(e, t, "src", a.src, a, null);
        return;
      case "input":
        Ee("invalid", e);
        var d = s = c = n = null, x = null, M = null;
        for (i in a) if (a.hasOwnProperty(i)) {
          var q = a[i];
          if (q != null) switch (i) {
            case "name":
              n = q;
              break;
            case "type":
              c = q;
              break;
            case "checked":
              x = q;
              break;
            case "defaultChecked":
              M = q;
              break;
            case "value":
              s = q;
              break;
            case "defaultValue":
              d = q;
              break;
            case "children":
            case "dangerouslySetInnerHTML":
              if (q != null) throw Error(u(137, t));
              break;
            default:
              Ye(e, t, i, q, a, null);
          }
        }
        _o(e, s, d, x, M, c, n, !1);
        return;
      case "select":
        Ee("invalid", e), i = c = s = null;
        for (n in a) if (a.hasOwnProperty(n) && (d = a[n], d != null)) switch (n) {
          case "value":
            s = d;
            break;
          case "defaultValue":
            c = d;
            break;
          case "multiple":
            i = d;
          default:
            Ye(e, t, n, d, a, null);
        }
        t = s, a = c, e.multiple = !!i, t != null ? wl(e, !!i, t, !1) : a != null && wl(e, !!i, a, !0);
        return;
      case "textarea":
        Ee("invalid", e), s = n = i = null;
        for (c in a) if (a.hasOwnProperty(c) && (d = a[c], d != null)) switch (c) {
          case "value":
            i = d;
            break;
          case "defaultValue":
            n = d;
            break;
          case "children":
            s = d;
            break;
          case "dangerouslySetInnerHTML":
            if (d != null) throw Error(u(91));
            break;
          default:
            Ye(e, t, c, d, a, null);
        }
        Eo(e, i, n, s);
        return;
      case "option":
        for (x in a) a.hasOwnProperty(x) && (i = a[x], i != null) && (x === "selected" ? e.selected = i && typeof i != "function" && typeof i != "symbol" : Ye(e, t, x, i, a, null));
        return;
      case "dialog":
        Ee("beforetoggle", e), Ee("toggle", e), Ee("cancel", e), Ee("close", e);
        break;
      case "iframe":
      case "object":
        Ee("load", e);
        break;
      case "video":
      case "audio":
        for (i = 0; i < Zi.length; i++) Ee(Zi[i], e);
        break;
      case "image":
        Ee("error", e), Ee("load", e);
        break;
      case "details":
        Ee("toggle", e);
        break;
      case "embed":
      case "source":
      case "link":
        Ee("error", e), Ee("load", e);
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
        for (M in a) if (a.hasOwnProperty(M) && (i = a[M], i != null)) switch (M) {
          case "children":
          case "dangerouslySetInnerHTML":
            throw Error(u(137, t));
          default:
            Ye(e, t, M, i, a, null);
        }
        return;
      default:
        if (Gs(t)) {
          for (q in a) a.hasOwnProperty(q) && (i = a[q], i !== void 0 && _r(e, t, q, i, a, void 0));
          return;
        }
    }
    for (d in a) a.hasOwnProperty(d) && (i = a[d], i != null && Ye(e, t, d, i, a, null));
  }
  function sh(e, t, a, i) {
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
        var n = null, s = null, c = null, d = null, x = null, M = null, q = null;
        for (U in a) {
          var Y = a[U];
          if (a.hasOwnProperty(U) && Y != null) switch (U) {
            case "checked":
              break;
            case "value":
              break;
            case "defaultValue":
              x = Y;
            default:
              i.hasOwnProperty(U) || Ye(e, t, U, null, i, Y);
          }
        }
        for (var O in i) {
          var U = i[O];
          if (Y = a[O], i.hasOwnProperty(O) && (U != null || Y != null)) switch (O) {
            case "type":
              s = U;
              break;
            case "name":
              n = U;
              break;
            case "checked":
              M = U;
              break;
            case "defaultChecked":
              q = U;
              break;
            case "value":
              c = U;
              break;
            case "defaultValue":
              d = U;
              break;
            case "children":
            case "dangerouslySetInnerHTML":
              if (U != null) throw Error(u(137, t));
              break;
            default:
              U !== Y && Ye(e, t, O, U, i, Y);
          }
        }
        Hs(e, c, d, x, M, q, s, n);
        return;
      case "select":
        U = c = d = O = null;
        for (s in a) if (x = a[s], a.hasOwnProperty(s) && x != null) switch (s) {
          case "value":
            break;
          case "multiple":
            U = x;
          default:
            i.hasOwnProperty(s) || Ye(e, t, s, null, i, x);
        }
        for (n in i) if (s = i[n], x = a[n], i.hasOwnProperty(n) && (s != null || x != null)) switch (n) {
          case "value":
            O = s;
            break;
          case "defaultValue":
            d = s;
            break;
          case "multiple":
            c = s;
          default:
            s !== x && Ye(e, t, n, s, i, x);
        }
        t = d, a = c, i = U, O != null ? wl(e, !!a, O, !1) : !!i != !!a && (t != null ? wl(e, !!a, t, !0) : wl(e, !!a, a ? [] : "", !1));
        return;
      case "textarea":
        U = O = null;
        for (d in a) if (n = a[d], a.hasOwnProperty(d) && n != null && !i.hasOwnProperty(d)) switch (d) {
          case "value":
            break;
          case "children":
            break;
          default:
            Ye(e, t, d, null, i, n);
        }
        for (c in i) if (n = i[c], s = a[c], i.hasOwnProperty(c) && (n != null || s != null)) switch (c) {
          case "value":
            O = n;
            break;
          case "defaultValue":
            U = n;
            break;
          case "children":
            break;
          case "dangerouslySetInnerHTML":
            if (n != null) throw Error(u(91));
            break;
          default:
            n !== s && Ye(e, t, c, n, i, s);
        }
        ko(e, O, U);
        return;
      case "option":
        for (var ce in a) O = a[ce], a.hasOwnProperty(ce) && O != null && !i.hasOwnProperty(ce) && (ce === "selected" ? e.selected = !1 : Ye(e, t, ce, null, i, O));
        for (x in i) O = i[x], U = a[x], i.hasOwnProperty(x) && O !== U && (O != null || U != null) && (x === "selected" ? e.selected = O && typeof O != "function" && typeof O != "symbol" : Ye(e, t, x, O, i, U));
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
        for (var ve in a) O = a[ve], a.hasOwnProperty(ve) && O != null && !i.hasOwnProperty(ve) && Ye(e, t, ve, null, i, O);
        for (M in i) if (O = i[M], U = a[M], i.hasOwnProperty(M) && O !== U && (O != null || U != null)) switch (M) {
          case "children":
          case "dangerouslySetInnerHTML":
            if (O != null) throw Error(u(137, t));
            break;
          default:
            Ye(e, t, M, O, i, U);
        }
        return;
      default:
        if (Gs(t)) {
          for (var Ve in a) O = a[Ve], a.hasOwnProperty(Ve) && O !== void 0 && !i.hasOwnProperty(Ve) && _r(e, t, Ve, void 0, i, O);
          for (q in i) O = i[q], U = a[q], !i.hasOwnProperty(q) || O === U || O === void 0 && U === void 0 || _r(e, t, q, O, i, U);
          return;
        }
    }
    for (var z in a) O = a[z], a.hasOwnProperty(z) && O != null && !i.hasOwnProperty(z) && Ye(e, t, z, null, i, O);
    for (Y in i) O = i[Y], U = a[Y], !i.hasOwnProperty(Y) || O === U || O == null && U == null || Ye(e, t, Y, O, i, U);
  }
  function Ap(e) {
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
  function ch() {
    if (typeof performance.getEntriesByType == "function") {
      for (var e = 0, t = 0, a = performance.getEntriesByType("resource"), i = 0; i < a.length; i++) {
        var n = a[i], s = n.transferSize, c = n.initiatorType, d = n.duration;
        if (s && d && Ap(c)) {
          for (c = 0, d = n.responseEnd, i += 1; i < a.length; i++) {
            var x = a[i], M = x.startTime;
            if (M > d) break;
            var q = x.transferSize, Y = x.initiatorType;
            q && Ap(Y) && (x = x.responseEnd, c += q * (x < d ? 1 : (d - M) / (x - M)));
          }
          if (--i, t += 8 * (s + c) / (n.duration / 1e3), e++, 10 < e) break;
        }
      }
      if (0 < e) return t / e / 1e6;
    }
    return navigator.connection && (e = navigator.connection.downlink, typeof e == "number") ? e : 5;
  }
  var kr = null, Er = null;
  function ps(e) {
    return e.nodeType === 9 ? e : e.ownerDocument;
  }
  function Tp(e) {
    switch (e) {
      case "http://www.w3.org/2000/svg":
        return 1;
      case "http://www.w3.org/1998/Math/MathML":
        return 2;
      default:
        return 0;
    }
  }
  function Cp(e, t) {
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
  function Ar(e, t) {
    return e === "textarea" || e === "noscript" || typeof t.children == "string" || typeof t.children == "number" || typeof t.children == "bigint" || typeof t.dangerouslySetInnerHTML == "object" && t.dangerouslySetInnerHTML !== null && t.dangerouslySetInnerHTML.__html != null;
  }
  var Tr = null;
  function rh() {
    var e = window.event;
    return e && e.type === "popstate" ? e === Tr ? !1 : (Tr = e, !0) : (Tr = null, !1);
  }
  var Mp = typeof setTimeout == "function" ? setTimeout : void 0, oh = typeof clearTimeout == "function" ? clearTimeout : void 0, Op = typeof Promise == "function" ? Promise : void 0, dh = typeof queueMicrotask == "function" ? queueMicrotask : typeof Op < "u" ? function(e) {
    return Op.resolve(null).then(e).catch(uh);
  } : Mp;
  function uh(e) {
    setTimeout(function() {
      throw e;
    });
  }
  function Ga(e) {
    return e === "head";
  }
  function Dp(e, t) {
    var a = t, i = 0;
    do {
      var n = a.nextSibling;
      if (e.removeChild(a), n && n.nodeType === 8) if (a = n.data, a === "/$" || a === "/&") {
        if (i === 0) {
          e.removeChild(n), li(t);
          return;
        }
        i--;
      } else if (a === "$" || a === "$?" || a === "$~" || a === "$!" || a === "&") i++;
      else if (a === "html") Ji(e.ownerDocument.documentElement);
      else if (a === "head") {
        a = e.ownerDocument.head, Ji(a);
        for (var s = a.firstChild; s; ) {
          var c = s.nextSibling, d = s.nodeName;
          s[pi] || d === "SCRIPT" || d === "STYLE" || d === "LINK" && s.rel.toLowerCase() === "stylesheet" || a.removeChild(s), s = c;
        }
      } else a === "body" && Ji(e.ownerDocument.body);
      a = n;
    } while (a);
    li(t);
  }
  function Up(e, t) {
    var a = e;
    e = 0;
    do {
      var i = a.nextSibling;
      if (a.nodeType === 1 ? t ? (a._stashedDisplay = a.style.display, a.style.display = "none") : (a.style.display = a._stashedDisplay || "", a.getAttribute("style") === "" && a.removeAttribute("style")) : a.nodeType === 3 && (t ? (a._stashedText = a.nodeValue, a.nodeValue = "") : a.nodeValue = a._stashedText || ""), i && i.nodeType === 8) if (a = i.data, a === "/$") {
        if (e === 0) break;
        e--;
      } else a !== "$" && a !== "$?" && a !== "$~" && a !== "$!" || e++;
      a = i;
    } while (a);
  }
  function Cr(e) {
    var t = e.firstChild;
    for (t && t.nodeType === 10 && (t = t.nextSibling); t; ) {
      var a = t;
      switch (t = t.nextSibling, a.nodeName) {
        case "HTML":
        case "HEAD":
        case "BODY":
          Cr(a), qs(a);
          continue;
        case "SCRIPT":
        case "STYLE":
          continue;
        case "LINK":
          if (a.rel.toLowerCase() === "stylesheet") continue;
      }
      e.removeChild(a);
    }
  }
  function ph(e, t, a, i) {
    for (; e.nodeType === 1; ) {
      var n = a;
      if (e.nodeName.toLowerCase() !== t.toLowerCase()) {
        if (!i && (e.nodeName !== "INPUT" || e.type !== "hidden")) break;
      } else if (i) {
        if (!e[pi]) switch (t) {
          case "meta":
            if (!e.hasAttribute("itemprop")) break;
            return e;
          case "link":
            if (s = e.getAttribute("rel"), s === "stylesheet" && e.hasAttribute("data-precedence")) break;
            if (s !== n.rel || e.getAttribute("href") !== (n.href == null || n.href === "" ? null : n.href) || e.getAttribute("crossorigin") !== (n.crossOrigin == null ? null : n.crossOrigin) || e.getAttribute("title") !== (n.title == null ? null : n.title)) break;
            return e;
          case "style":
            if (e.hasAttribute("data-precedence")) break;
            return e;
          case "script":
            if (s = e.getAttribute("src"), (s !== (n.src == null ? null : n.src) || e.getAttribute("type") !== (n.type == null ? null : n.type) || e.getAttribute("crossorigin") !== (n.crossOrigin == null ? null : n.crossOrigin)) && s && e.hasAttribute("async") && !e.hasAttribute("itemprop")) break;
            return e;
          default:
            return e;
        }
      } else if (t === "input" && e.type === "hidden") {
        var s = n.name == null ? null : "" + n.name;
        if (n.type === "hidden" && e.getAttribute("name") === s) return e;
      } else return e;
      if (e = Qt(e.nextSibling), e === null) break;
    }
    return null;
  }
  function fh(e, t, a) {
    if (t === "") return null;
    for (; e.nodeType !== 3; )
      if ((e.nodeType !== 1 || e.nodeName !== "INPUT" || e.type !== "hidden") && !a || (e = Qt(e.nextSibling), e === null)) return null;
    return e;
  }
  function Rp(e, t) {
    for (; e.nodeType !== 8; )
      if ((e.nodeType !== 1 || e.nodeName !== "INPUT" || e.type !== "hidden") && !t || (e = Qt(e.nextSibling), e === null)) return null;
    return e;
  }
  function Mr(e) {
    return e.data === "$?" || e.data === "$~";
  }
  function Or(e) {
    return e.data === "$!" || e.data === "$?" && e.ownerDocument.readyState !== "loading";
  }
  function hh(e, t) {
    var a = e.ownerDocument;
    if (e.data === "$~") e._reactRetry = t;
    else if (e.data !== "$?" || a.readyState !== "loading") t();
    else {
      var i = function() {
        t(), a.removeEventListener("DOMContentLoaded", i);
      };
      a.addEventListener("DOMContentLoaded", i), e._reactRetry = i;
    }
  }
  function Qt(e) {
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
  var Dr = null;
  function qp(e) {
    e = e.nextSibling;
    for (var t = 0; e; ) {
      if (e.nodeType === 8) {
        var a = e.data;
        if (a === "/$" || a === "/&") {
          if (t === 0) return Qt(e.nextSibling);
          t--;
        } else a !== "$" && a !== "$!" && a !== "$?" && a !== "$~" && a !== "&" || t++;
      }
      e = e.nextSibling;
    }
    return null;
  }
  function Lp(e) {
    e = e.previousSibling;
    for (var t = 0; e; ) {
      if (e.nodeType === 8) {
        var a = e.data;
        if (a === "$" || a === "$!" || a === "$?" || a === "$~" || a === "&") {
          if (t === 0) return e;
          t--;
        } else a !== "/$" && a !== "/&" || t++;
      }
      e = e.previousSibling;
    }
    return null;
  }
  function Hp(e, t, a) {
    switch (t = ps(a), e) {
      case "html":
        if (e = t.documentElement, !e) throw Error(u(452));
        return e;
      case "head":
        if (e = t.head, !e) throw Error(u(453));
        return e;
      case "body":
        if (e = t.body, !e) throw Error(u(454));
        return e;
      default:
        throw Error(u(451));
    }
  }
  function Ji(e) {
    for (var t = e.attributes; t.length; ) e.removeAttributeNode(t[0]);
    qs(e);
  }
  var Zt = /* @__PURE__ */ new Map(), Bp = /* @__PURE__ */ new Set();
  function fs(e) {
    return typeof e.getRootNode == "function" ? e.getRootNode() : e.nodeType === 9 ? e : e.ownerDocument;
  }
  var za = X.d;
  X.d = {
    f: mh,
    r: xh,
    D: gh,
    C: bh,
    L: vh,
    m: jh,
    X: Sh,
    S: yh,
    M: zh
  };
  function mh() {
    var e = za.f(), t = is();
    return e || t;
  }
  function xh(e) {
    var t = Sl(e);
    t !== null && t.tag === 5 && t.type === "form" ? nu(t) : za.r(e);
  }
  var ei = typeof document > "u" ? null : document;
  function Gp(e, t, a) {
    var i = ei;
    if (i && typeof t == "string" && t) {
      var n = qt(t);
      n = 'link[rel="' + e + '"][href="' + n + '"]', typeof a == "string" && (n += '[crossorigin="' + a + '"]'), Bp.has(n) || (Bp.add(n), e = {
        rel: e,
        crossOrigin: a,
        href: t
      }, i.querySelector(n) === null && (t = i.createElement("link"), bt(t, "link", e), ut(t), i.head.appendChild(t)));
    }
  }
  function gh(e) {
    za.D(e), Gp("dns-prefetch", e, null);
  }
  function bh(e, t) {
    za.C(e, t), Gp("preconnect", e, t);
  }
  function vh(e, t, a) {
    za.L(e, t, a);
    var i = ei;
    if (i && e && t) {
      var n = 'link[rel="preload"][as="' + qt(t) + '"]';
      t === "image" && a && a.imageSrcSet ? (n += '[imagesrcset="' + qt(a.imageSrcSet) + '"]', typeof a.imageSizes == "string" && (n += '[imagesizes="' + qt(a.imageSizes) + '"]')) : n += '[href="' + qt(e) + '"]';
      var s = n;
      switch (t) {
        case "style":
          s = ti(e);
          break;
        case "script":
          s = ai(e);
      }
      Zt.has(s) || (e = C({
        rel: "preload",
        href: t === "image" && a && a.imageSrcSet ? void 0 : e,
        as: t
      }, a), Zt.set(s, e), i.querySelector(n) !== null || t === "style" && i.querySelector(Ii(s)) || t === "script" && i.querySelector($i(s)) || (t = i.createElement("link"), bt(t, "link", e), ut(t), i.head.appendChild(t)));
    }
  }
  function jh(e, t) {
    za.m(e, t);
    var a = ei;
    if (a && e) {
      var i = t && typeof t.as == "string" ? t.as : "script", n = 'link[rel="modulepreload"][as="' + qt(i) + '"][href="' + qt(e) + '"]', s = n;
      switch (i) {
        case "audioworklet":
        case "paintworklet":
        case "serviceworker":
        case "sharedworker":
        case "worker":
        case "script":
          s = ai(e);
      }
      if (!Zt.has(s) && (e = C({
        rel: "modulepreload",
        href: e
      }, t), Zt.set(s, e), a.querySelector(n) === null)) {
        switch (i) {
          case "audioworklet":
          case "paintworklet":
          case "serviceworker":
          case "sharedworker":
          case "worker":
          case "script":
            if (a.querySelector($i(s))) return;
        }
        i = a.createElement("link"), bt(i, "link", e), ut(i), a.head.appendChild(i);
      }
    }
  }
  function yh(e, t, a) {
    za.S(e, t, a);
    var i = ei;
    if (i && e) {
      var n = zl(i).hoistableStyles, s = ti(e);
      t = t || "default";
      var c = n.get(s);
      if (!c) {
        var d = {
          loading: 0,
          preload: null
        };
        if (c = i.querySelector(Ii(s))) d.loading = 5;
        else {
          e = C({
            rel: "stylesheet",
            href: e,
            "data-precedence": t
          }, a), (a = Zt.get(s)) && Ur(e, a);
          var x = c = i.createElement("link");
          ut(x), bt(x, "link", e), x._p = new Promise(function(M, q) {
            x.onload = M, x.onerror = q;
          }), x.addEventListener("load", function() {
            d.loading |= 1;
          }), x.addEventListener("error", function() {
            d.loading |= 2;
          }), d.loading |= 4, hs(c, t, i);
        }
        c = {
          type: "stylesheet",
          instance: c,
          count: 1,
          state: d
        }, n.set(s, c);
      }
    }
  }
  function Sh(e, t) {
    za.X(e, t);
    var a = ei;
    if (a && e) {
      var i = zl(a).hoistableScripts, n = ai(e), s = i.get(n);
      s || (s = a.querySelector($i(n)), s || (e = C({
        src: e,
        async: !0
      }, t), (t = Zt.get(n)) && Rr(e, t), s = a.createElement("script"), ut(s), bt(s, "link", e), a.head.appendChild(s)), s = {
        type: "script",
        instance: s,
        count: 1,
        state: null
      }, i.set(n, s));
    }
  }
  function zh(e, t) {
    za.M(e, t);
    var a = ei;
    if (a && e) {
      var i = zl(a).hoistableScripts, n = ai(e), s = i.get(n);
      s || (s = a.querySelector($i(n)), s || (e = C({
        src: e,
        async: !0,
        type: "module"
      }, t), (t = Zt.get(n)) && Rr(e, t), s = a.createElement("script"), ut(s), bt(s, "link", e), a.head.appendChild(s)), s = {
        type: "script",
        instance: s,
        count: 1,
        state: null
      }, i.set(n, s));
    }
  }
  function Yp(e, t, a, i) {
    var n = (n = he.current) ? fs(n) : null;
    if (!n) throw Error(u(446));
    switch (e) {
      case "meta":
      case "title":
        return null;
      case "style":
        return typeof a.precedence == "string" && typeof a.href == "string" ? (t = ti(a.href), a = zl(n).hoistableStyles, i = a.get(t), i || (i = {
          type: "style",
          instance: null,
          count: 0,
          state: null
        }, a.set(t, i)), i) : {
          type: "void",
          instance: null,
          count: 0,
          state: null
        };
      case "link":
        if (a.rel === "stylesheet" && typeof a.href == "string" && typeof a.precedence == "string") {
          e = ti(a.href);
          var s = zl(n).hoistableStyles, c = s.get(e);
          if (c || (n = n.ownerDocument || n, c = {
            type: "stylesheet",
            instance: null,
            count: 0,
            state: {
              loading: 0,
              preload: null
            }
          }, s.set(e, c), (s = n.querySelector(Ii(e))) && !s._p && (c.instance = s, c.state.loading = 5), Zt.has(e) || (a = {
            rel: "preload",
            as: "style",
            href: a.href,
            crossOrigin: a.crossOrigin,
            integrity: a.integrity,
            media: a.media,
            hrefLang: a.hrefLang,
            referrerPolicy: a.referrerPolicy
          }, Zt.set(e, a), s || Nh(n, e, a, c.state))), t && i === null) throw Error(u(528, ""));
          return c;
        }
        if (t && i !== null) throw Error(u(529, ""));
        return null;
      case "script":
        return t = a.async, a = a.src, typeof a == "string" && t && typeof t != "function" && typeof t != "symbol" ? (t = ai(a), a = zl(n).hoistableScripts, i = a.get(t), i || (i = {
          type: "script",
          instance: null,
          count: 0,
          state: null
        }, a.set(t, i)), i) : {
          type: "void",
          instance: null,
          count: 0,
          state: null
        };
      default:
        throw Error(u(444, e));
    }
  }
  function ti(e) {
    return 'href="' + qt(e) + '"';
  }
  function Ii(e) {
    return 'link[rel="stylesheet"][' + e + "]";
  }
  function Vp(e) {
    return C({}, e, {
      "data-precedence": e.precedence,
      precedence: null
    });
  }
  function Nh(e, t, a, i) {
    e.querySelector('link[rel="preload"][as="style"][' + t + "]") ? i.loading = 1 : (t = e.createElement("link"), i.preload = t, t.addEventListener("load", function() {
      return i.loading |= 1;
    }), t.addEventListener("error", function() {
      return i.loading |= 2;
    }), bt(t, "link", a), ut(t), e.head.appendChild(t));
  }
  function ai(e) {
    return '[src="' + qt(e) + '"]';
  }
  function $i(e) {
    return "script[async]" + e;
  }
  function Xp(e, t, a) {
    if (t.count++, t.instance === null) switch (t.type) {
      case "style":
        var i = e.querySelector('style[data-href~="' + qt(a.href) + '"]');
        if (i) return t.instance = i, ut(i), i;
        var n = C({}, a, {
          "data-href": a.href,
          "data-precedence": a.precedence,
          href: null,
          precedence: null
        });
        return i = (e.ownerDocument || e).createElement("style"), ut(i), bt(i, "style", n), hs(i, a.precedence, e), t.instance = i;
      case "stylesheet":
        n = ti(a.href);
        var s = e.querySelector(Ii(n));
        if (s) return t.state.loading |= 4, t.instance = s, ut(s), s;
        i = Vp(a), (n = Zt.get(n)) && Ur(i, n), s = (e.ownerDocument || e).createElement("link"), ut(s);
        var c = s;
        return c._p = new Promise(function(d, x) {
          c.onload = d, c.onerror = x;
        }), bt(s, "link", i), t.state.loading |= 4, hs(s, a.precedence, e), t.instance = s;
      case "script":
        return s = ai(a.src), (n = e.querySelector($i(s))) ? (t.instance = n, ut(n), n) : (i = a, (n = Zt.get(s)) && (i = C({}, a), Rr(i, n)), e = e.ownerDocument || e, n = e.createElement("script"), ut(n), bt(n, "link", i), e.head.appendChild(n), t.instance = n);
      case "void":
        return null;
      default:
        throw Error(u(443, t.type));
    }
    else t.type === "stylesheet" && (t.state.loading & 4) === 0 && (i = t.instance, t.state.loading |= 4, hs(i, a.precedence, e));
    return t.instance;
  }
  function hs(e, t, a) {
    for (var i = a.querySelectorAll('link[rel="stylesheet"][data-precedence],style[data-precedence]'), n = i.length ? i[i.length - 1] : null, s = n, c = 0; c < i.length; c++) {
      var d = i[c];
      if (d.dataset.precedence === t) s = d;
      else if (s !== n) break;
    }
    s ? s.parentNode.insertBefore(e, s.nextSibling) : (t = a.nodeType === 9 ? a.head : a, t.insertBefore(e, t.firstChild));
  }
  function Ur(e, t) {
    e.crossOrigin ??= t.crossOrigin, e.referrerPolicy ??= t.referrerPolicy, e.title ??= t.title;
  }
  function Rr(e, t) {
    e.crossOrigin ??= t.crossOrigin, e.referrerPolicy ??= t.referrerPolicy, e.integrity ??= t.integrity;
  }
  var ms = null;
  function Qp(e, t, a) {
    if (ms === null) {
      var i = /* @__PURE__ */ new Map(), n = ms = /* @__PURE__ */ new Map();
      n.set(a, i);
    } else n = ms, i = n.get(a), i || (i = /* @__PURE__ */ new Map(), n.set(a, i));
    if (i.has(e)) return i;
    for (i.set(e, null), a = a.getElementsByTagName(e), n = 0; n < a.length; n++) {
      var s = a[n];
      if (!(s[pi] || s[ht] || e === "link" && s.getAttribute("rel") === "stylesheet") && s.namespaceURI !== "http://www.w3.org/2000/svg") {
        var c = s.getAttribute(t) || "";
        c = e + c;
        var d = i.get(c);
        d ? d.push(s) : i.set(c, [s]);
      }
    }
    return i;
  }
  function Zp(e, t, a) {
    e = e.ownerDocument || e, e.head.insertBefore(a, t === "title" ? e.querySelector("head > title") : null);
  }
  function wh(e, t, a) {
    if (a === 1 || t.itemProp != null) return !1;
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
  function Kp(e) {
    return !(e.type === "stylesheet" && (e.state.loading & 3) === 0);
  }
  function _h(e, t, a, i) {
    if (a.type === "stylesheet" && (typeof i.media != "string" || matchMedia(i.media).matches !== !1) && (a.state.loading & 4) === 0) {
      if (a.instance === null) {
        var n = ti(i.href), s = t.querySelector(Ii(n));
        if (s) {
          t = s._p, t !== null && typeof t == "object" && typeof t.then == "function" && (e.count++, e = xs.bind(e), t.then(e, e)), a.state.loading |= 4, a.instance = s, ut(s);
          return;
        }
        s = t.ownerDocument || t, i = Vp(i), (n = Zt.get(n)) && Ur(i, n), s = s.createElement("link"), ut(s);
        var c = s;
        c._p = new Promise(function(d, x) {
          c.onload = d, c.onerror = x;
        }), bt(s, "link", i), a.instance = s;
      }
      e.stylesheets === null && (e.stylesheets = /* @__PURE__ */ new Map()), e.stylesheets.set(a, t), (t = a.state.preload) && (a.state.loading & 3) === 0 && (e.count++, a = xs.bind(e), t.addEventListener("load", a), t.addEventListener("error", a));
    }
  }
  var qr = 0;
  function kh(e, t) {
    return e.stylesheets && e.count === 0 && bs(e, e.stylesheets), 0 < e.count || 0 < e.imgCount ? function(a) {
      var i = setTimeout(function() {
        if (e.stylesheets && bs(e, e.stylesheets), e.unsuspend) {
          var s = e.unsuspend;
          e.unsuspend = null, s();
        }
      }, 6e4 + t);
      0 < e.imgBytes && qr === 0 && (qr = 62500 * ch());
      var n = setTimeout(function() {
        if (e.waitingForImages = !1, e.count === 0 && (e.stylesheets && bs(e, e.stylesheets), e.unsuspend)) {
          var s = e.unsuspend;
          e.unsuspend = null, s();
        }
      }, (e.imgBytes > qr ? 50 : 800) + t);
      return e.unsuspend = a, function() {
        e.unsuspend = null, clearTimeout(i), clearTimeout(n);
      };
    } : null;
  }
  function xs() {
    if (this.count--, this.count === 0 && (this.imgCount === 0 || !this.waitingForImages)) {
      if (this.stylesheets) bs(this, this.stylesheets);
      else if (this.unsuspend) {
        var e = this.unsuspend;
        this.unsuspend = null, e();
      }
    }
  }
  var gs = null;
  function bs(e, t) {
    e.stylesheets = null, e.unsuspend !== null && (e.count++, gs = /* @__PURE__ */ new Map(), t.forEach(Eh, e), gs = null, xs.call(e));
  }
  function Eh(e, t) {
    if (!(t.state.loading & 4)) {
      var a = gs.get(e);
      if (a) var i = a.get(null);
      else {
        a = /* @__PURE__ */ new Map(), gs.set(e, a);
        for (var n = e.querySelectorAll("link[data-precedence],style[data-precedence]"), s = 0; s < n.length; s++) {
          var c = n[s];
          (c.nodeName === "LINK" || c.getAttribute("media") !== "not all") && (a.set(c.dataset.precedence, c), i = c);
        }
        i && a.set(null, i);
      }
      n = t.instance, c = n.getAttribute("data-precedence"), s = a.get(c) || i, s === i && a.set(null, n), a.set(c, n), this.count++, i = xs.bind(this), n.addEventListener("load", i), n.addEventListener("error", i), s ? s.parentNode.insertBefore(n, s.nextSibling) : (e = e.nodeType === 9 ? e.head : e, e.insertBefore(n, e.firstChild)), t.state.loading |= 4;
    }
  }
  var Wi = {
    $$typeof: V,
    Provider: null,
    Consumer: null,
    _currentValue: oe,
    _currentValue2: oe,
    _threadCount: 0
  };
  function Ah(e, t, a, i, n, s, c, d, x) {
    this.tag = 1, this.containerInfo = e, this.pingCache = this.current = this.pendingChildren = null, this.timeoutHandle = -1, this.callbackNode = this.next = this.pendingContext = this.context = this.cancelPendingCommit = null, this.callbackPriority = 0, this.expirationTimes = Ds(-1), this.entangledLanes = this.shellSuspendCounter = this.errorRecoveryDisabledLanes = this.expiredLanes = this.warmLanes = this.pingedLanes = this.suspendedLanes = this.pendingLanes = 0, this.entanglements = Ds(0), this.hiddenUpdates = Ds(null), this.identifierPrefix = i, this.onUncaughtError = n, this.onCaughtError = s, this.onRecoverableError = c, this.pooledCache = null, this.pooledCacheLanes = 0, this.formState = x, this.incompleteTransitions = /* @__PURE__ */ new Map();
  }
  function Th(e, t, a, i, n, s, c, d, x, M, q, Y) {
    return e = new Ah(e, t, a, c, x, M, q, Y, d), t = 1, s === !0 && (t |= 24), s = Tt(3, null, null, t), e.current = s, s.stateNode = e, t = gc(), t.refCount++, e.pooledCache = t, t.refCount++, s.memoizedState = {
      element: i,
      isDehydrated: a,
      cache: t
    }, yc(s), e;
  }
  function Ch(e) {
    return e ? (e = Ol, e) : Ol;
  }
  function Jp(e, t, a, i, n, s) {
    n = Ch(n), i.context === null ? i.context = n : i.pendingContext = n, i = dl(t), i.payload = { element: a }, s = s === void 0 ? null : s, s !== null && (i.callback = s), a = ul(e, i, t), a !== null && (Et(a, e, t), Ai(a, e, t));
  }
  function Ip(e, t) {
    if (e = e.memoizedState, e !== null && e.dehydrated !== null) {
      var a = e.retryLane;
      e.retryLane = a !== 0 && a < t ? a : t;
    }
  }
  function Lr(e, t) {
    Ip(e, t), (e = e.alternate) && Ip(e, t);
  }
  function $p(e) {
    if (e.tag === 13 || e.tag === 31) {
      var t = tl(e, 67108864);
      t !== null && Et(t, e, 67108864), Lr(e, 67108864);
    }
  }
  function Wp(e) {
    if (e.tag === 13 || e.tag === 31) {
      var t = Xt();
      t = xo(t);
      var a = tl(e, t);
      a !== null && Et(a, e, t), Lr(e, t);
    }
  }
  var vs = !0;
  function Mh(e, t, a, i) {
    var n = B.T;
    B.T = null;
    var s = X.p;
    try {
      X.p = 2, Hr(e, t, a, i);
    } finally {
      X.p = s, B.T = n;
    }
  }
  function Oh(e, t, a, i) {
    var n = B.T;
    B.T = null;
    var s = X.p;
    try {
      X.p = 8, Hr(e, t, a, i);
    } finally {
      X.p = s, B.T = n;
    }
  }
  function Hr(e, t, a, i) {
    if (vs) {
      var n = Br(i);
      if (n === null) wr(e, t, i, js, a), Pp(e, i);
      else if (Uh(n, e, t, a, i)) i.stopPropagation();
      else if (Pp(e, i), t & 4 && -1 < Dh.indexOf(e)) {
        for (; n !== null; ) {
          var s = Sl(n);
          if (s !== null) switch (s.tag) {
            case 3:
              if (s = s.stateNode, s.current.memoizedState.isDehydrated) {
                var c = $a(s.pendingLanes);
                if (c !== 0) {
                  var d = s;
                  for (d.pendingLanes |= 2, d.entangledLanes |= 2; c; ) {
                    var x = 1 << 31 - ot(c);
                    d.entanglements[1] |= x, c &= ~x;
                  }
                  Sa(s), (Le & 6) === 0 && (as = et() + 500, Qi(0, !1));
                }
              }
              break;
            case 31:
            case 13:
              d = tl(s, 2), d !== null && Et(d, s, 2), is(), Lr(s, 2);
          }
          if (s = Br(i), s === null && wr(e, t, i, js, a), s === n) break;
          n = s;
        }
        n !== null && i.stopPropagation();
      } else wr(e, t, i, null, a);
    }
  }
  function Br(e) {
    return e = Vs(e), Gr(e);
  }
  var js = null;
  function Gr(e) {
    if (js = null, e = yl(e), e !== null) {
      var t = v(e);
      if (t === null) e = null;
      else {
        var a = t.tag;
        if (a === 13) {
          if (e = A(t), e !== null) return e;
          e = null;
        } else if (a === 31) {
          if (e = w(t), e !== null) return e;
          e = null;
        } else if (a === 3) {
          if (t.stateNode.current.memoizedState.isDehydrated) return t.tag === 3 ? t.stateNode.containerInfo : null;
          e = null;
        } else t !== e && (e = null);
      }
    }
    return js = e, null;
  }
  function Fp(e) {
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
        switch (Ja()) {
          case jl:
            return 2;
          case Ut:
            return 8;
          case ea:
          case Ia:
            return 32;
          case h:
            return 268435456;
          default:
            return 32;
        }
      default:
        return 32;
    }
  }
  var Yr = !1, Ya = null, Va = null, Xa = null, Fi = /* @__PURE__ */ new Map(), Pi = /* @__PURE__ */ new Map(), Qa = [], Dh = "mousedown mouseup touchcancel touchend touchstart auxclick dblclick pointercancel pointerdown pointerup dragend dragstart drop compositionend compositionstart keydown keypress keyup input textInput copy cut paste click change contextmenu reset".split(" ");
  function Pp(e, t) {
    switch (e) {
      case "focusin":
      case "focusout":
        Ya = null;
        break;
      case "dragenter":
      case "dragleave":
        Va = null;
        break;
      case "mouseover":
      case "mouseout":
        Xa = null;
        break;
      case "pointerover":
      case "pointerout":
        Fi.delete(t.pointerId);
        break;
      case "gotpointercapture":
      case "lostpointercapture":
        Pi.delete(t.pointerId);
    }
  }
  function en(e, t, a, i, n, s) {
    return e === null || e.nativeEvent !== s ? (e = {
      blockedOn: t,
      domEventName: a,
      eventSystemFlags: i,
      nativeEvent: s,
      targetContainers: [n]
    }, t !== null && (t = Sl(t), t !== null && $p(t)), e) : (e.eventSystemFlags |= i, t = e.targetContainers, n !== null && t.indexOf(n) === -1 && t.push(n), e);
  }
  function Uh(e, t, a, i, n) {
    switch (t) {
      case "focusin":
        return Ya = en(Ya, e, t, a, i, n), !0;
      case "dragenter":
        return Va = en(Va, e, t, a, i, n), !0;
      case "mouseover":
        return Xa = en(Xa, e, t, a, i, n), !0;
      case "pointerover":
        var s = n.pointerId;
        return Fi.set(s, en(Fi.get(s) || null, e, t, a, i, n)), !0;
      case "gotpointercapture":
        return s = n.pointerId, Pi.set(s, en(Pi.get(s) || null, e, t, a, i, n)), !0;
    }
    return !1;
  }
  function ef(e) {
    var t = yl(e.target);
    if (t !== null) {
      var a = v(t);
      if (a !== null) {
        if (t = a.tag, t === 13) {
          if (t = A(a), t !== null) {
            e.blockedOn = t, bo(e.priority, function() {
              Wp(a);
            });
            return;
          }
        } else if (t === 31) {
          if (t = w(a), t !== null) {
            e.blockedOn = t, bo(e.priority, function() {
              Wp(a);
            });
            return;
          }
        } else if (t === 3 && a.stateNode.current.memoizedState.isDehydrated) {
          e.blockedOn = a.tag === 3 ? a.stateNode.containerInfo : null;
          return;
        }
      }
    }
    e.blockedOn = null;
  }
  function ys(e) {
    if (e.blockedOn !== null) return !1;
    for (var t = e.targetContainers; 0 < t.length; ) {
      var a = Br(e.nativeEvent);
      if (a === null) {
        a = e.nativeEvent;
        var i = new a.constructor(a.type, a);
        Ys = i, a.target.dispatchEvent(i), Ys = null;
      } else return t = Sl(a), t !== null && $p(t), e.blockedOn = a, !1;
      t.shift();
    }
    return !0;
  }
  function tf(e, t, a) {
    ys(e) && a.delete(t);
  }
  function Rh() {
    Yr = !1, Ya !== null && ys(Ya) && (Ya = null), Va !== null && ys(Va) && (Va = null), Xa !== null && ys(Xa) && (Xa = null), Fi.forEach(tf), Pi.forEach(tf);
  }
  function Ss(e, t) {
    e.blockedOn === t && (e.blockedOn = null, Yr || (Yr = !0, m.unstable_scheduleCallback(m.unstable_NormalPriority, Rh)));
  }
  var zs = null;
  function af(e) {
    zs !== e && (zs = e, m.unstable_scheduleCallback(m.unstable_NormalPriority, function() {
      zs === e && (zs = null);
      for (var t = 0; t < e.length; t += 3) {
        var a = e[t], i = e[t + 1], n = e[t + 2];
        if (typeof i != "function") {
          if (Gr(i || a) === null) continue;
          break;
        }
        var s = Sl(a);
        s !== null && (e.splice(t, 3), t -= 3, Gc(s, {
          pending: !0,
          data: n,
          method: a.method,
          action: i
        }, i, n));
      }
    }));
  }
  function li(e) {
    function t(x) {
      return Ss(x, e);
    }
    Ya !== null && Ss(Ya, e), Va !== null && Ss(Va, e), Xa !== null && Ss(Xa, e), Fi.forEach(t), Pi.forEach(t);
    for (var a = 0; a < Qa.length; a++) {
      var i = Qa[a];
      i.blockedOn === e && (i.blockedOn = null);
    }
    for (; 0 < Qa.length && (a = Qa[0], a.blockedOn === null); ) ef(a), a.blockedOn === null && Qa.shift();
    if (a = (e.ownerDocument || e).$$reactFormReplay, a != null) for (i = 0; i < a.length; i += 3) {
      var n = a[i], s = a[i + 1], c = n[St] || null;
      if (typeof s == "function") c || af(a);
      else if (c) {
        var d = null;
        if (s && s.hasAttribute("formAction")) {
          if (n = s, c = s[St] || null) d = c.formAction;
          else if (Gr(n) !== null) continue;
        } else d = c.action;
        typeof d == "function" ? a[i + 1] = d : (a.splice(i, 3), i -= 3), af(a);
      }
    }
  }
  function qh() {
    function e(s) {
      s.canIntercept && s.info === "react-transition" && s.intercept({
        handler: function() {
          return new Promise(function(c) {
            return n = c;
          });
        },
        focusReset: "manual",
        scroll: "manual"
      });
    }
    function t() {
      n !== null && (n(), n = null), i || setTimeout(a, 20);
    }
    function a() {
      if (!i && !navigation.transition) {
        var s = navigation.currentEntry;
        s && s.url != null && navigation.navigate(s.url, {
          state: s.getState(),
          info: "react-transition",
          history: "replace"
        });
      }
    }
    if (typeof navigation == "object") {
      var i = !1, n = null;
      return navigation.addEventListener("navigate", e), navigation.addEventListener("navigatesuccess", t), navigation.addEventListener("navigateerror", t), setTimeout(a, 100), function() {
        i = !0, navigation.removeEventListener("navigate", e), navigation.removeEventListener("navigatesuccess", t), navigation.removeEventListener("navigateerror", t), n !== null && (n(), n = null);
      };
    }
  }
  function Vr(e) {
    this._internalRoot = e;
  }
  Xr.prototype.render = Vr.prototype.render = function(e) {
    var t = this._internalRoot;
    if (t === null) throw Error(u(409));
    var a = t.current;
    Jp(a, Xt(), e, t, null, null);
  }, Xr.prototype.unmount = Vr.prototype.unmount = function() {
    var e = this._internalRoot;
    if (e !== null) {
      this._internalRoot = null;
      var t = e.containerInfo;
      Jp(e.current, 2, null, e, null, null), is(), t[ui] = null;
    }
  };
  function Xr(e) {
    this._internalRoot = e;
  }
  Xr.prototype.unstable_scheduleHydration = function(e) {
    if (e) {
      var t = go();
      e = {
        blockedOn: null,
        target: e,
        priority: t
      };
      for (var a = 0; a < Qa.length && t !== 0 && t < Qa[a].priority; a++) ;
      Qa.splice(a, 0, e), a === 0 && ef(e);
    }
  };
  var lf = N.version;
  if (lf !== "19.2.6") throw Error(u(527, lf, "19.2.6"));
  X.findDOMNode = function(e) {
    var t = e._reactInternals;
    if (t === void 0)
      throw typeof e.render == "function" ? Error(u(188)) : (e = Object.keys(e).join(","), Error(u(268, e)));
    return e = y(t), e = e !== null ? Q(e) : null, e = e === null ? null : e.stateNode, e;
  };
  var Lh = {
    bundleType: 0,
    version: "19.2.6",
    rendererPackageName: "react-dom",
    currentDispatcherRef: B,
    reconcilerVersion: "19.2.6"
  };
  if (typeof __REACT_DEVTOOLS_GLOBAL_HOOK__ < "u") {
    var Ns = __REACT_DEVTOOLS_GLOBAL_HOOK__;
    if (!Ns.isDisabled && Ns.supportsFiber) try {
      tt = Ns.inject(Lh), Xe = Ns;
    } catch {
    }
  }
  r.createRoot = function(e, t) {
    if (!E(e)) throw Error(u(299));
    var a = !1, i = "", n = O0, s = D0, c = U0;
    return t != null && (t.unstable_strictMode === !0 && (a = !0), t.identifierPrefix !== void 0 && (i = t.identifierPrefix), t.onUncaughtError !== void 0 && (n = t.onUncaughtError), t.onCaughtError !== void 0 && (s = t.onCaughtError), t.onRecoverableError !== void 0 && (c = t.onRecoverableError)), t = Th(e, 1, !1, null, null, a, i, null, n, s, c, qh), e[ui] = t.current, Np(e), new Vr(t);
  };
})), Zh = /* @__PURE__ */ ia(((r, m) => {
  function N() {
    if (!(typeof __REACT_DEVTOOLS_GLOBAL_HOOK__ > "u" || typeof __REACT_DEVTOOLS_GLOBAL_HOOK__.checkDCE != "function"))
      try {
        __REACT_DEVTOOLS_GLOBAL_HOOK__.checkDCE(N);
      } catch (f) {
        console.error(f);
      }
  }
  N(), m.exports = Qh();
})), zf = (...r) => r.filter((m, N, f) => !!m && m.trim() !== "" && f.indexOf(m) === N).join(" ").trim(), Kh = (r) => r.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase(), Jh = (r) => r.replace(/^([A-Z])|[\s-_]+(\w)/g, (m, N, f) => f ? f.toUpperCase() : N.toLowerCase()), nf = (r) => {
  const m = Jh(r);
  return m.charAt(0).toUpperCase() + m.slice(1);
}, Qr = {
  xmlns: "http://www.w3.org/2000/svg",
  width: 24,
  height: 24,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round",
  strokeLinejoin: "round"
}, Ih = (r) => {
  for (const m in r) if (m.startsWith("aria-") || m === "role" || m === "title") return !0;
  return !1;
}, S = oo(), $h = (0, S.createContext)({}), Wh = () => (0, S.useContext)($h), Fh = (0, S.forwardRef)(({ color: r, size: m, strokeWidth: N, absoluteStrokeWidth: f, className: u = "", children: E, iconNode: v, ...A }, w) => {
  const { size: _ = 24, strokeWidth: y = 2, absoluteStrokeWidth: Q = !1, color: C = "currentColor", className: te = "" } = Wh() ?? {}, ae = f ?? Q ? Number(N ?? y) * 24 / Number(m ?? _) : N ?? y;
  return (0, S.createElement)("svg", {
    ref: w,
    ...Qr,
    width: m ?? _ ?? Qr.width,
    height: m ?? _ ?? Qr.height,
    stroke: r ?? C,
    strokeWidth: ae,
    className: zf("lucide", te, u),
    ...!E && !Ih(A) && { "aria-hidden": "true" },
    ...A
  }, [...v.map(([K, F]) => (0, S.createElement)(K, F)), ...Array.isArray(E) ? E : [E]]);
}), Me = (r, m) => {
  const N = (0, S.forwardRef)(({ className: f, ...u }, E) => (0, S.createElement)(Fh, {
    ref: E,
    iconNode: m,
    className: zf(`lucide-${Kh(nf(r))}`, `lucide-${r}`, f),
    ...u
  }));
  return N.displayName = nf(r), N;
}, Ph = [
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
], Nf = Me("archive", Ph), em = [["path", {
  d: "m12 19-7-7 7-7",
  key: "1l729n"
}], ["path", {
  d: "M19 12H5",
  key: "x3x0zl"
}]], sf = Me("arrow-left", em), tm = [["path", {
  d: "M5 12h14",
  key: "1ays0h"
}], ["path", {
  d: "m12 5 7 7-7 7",
  key: "xquz4c"
}]], ni = Me("arrow-right", tm), am = [["path", {
  d: "M7 7h10v10",
  key: "1tivn9"
}], ["path", {
  d: "M7 17 17 7",
  key: "1vkiza"
}]], lm = Me("arrow-up-right", am), im = [["path", {
  d: "M12 5v16",
  key: "1f6ucr"
}], ["path", {
  d: "M20.001 19A2 2 0 0022 17V5a2 2 0 00-1.999-2L16 3.002A5 5 0 0012 5a5 5 0 00-4-2H4a2 2 0 00-2 2v12a2 2 0 001.999 2H8a5 5 0 014 2 5 5 0 014-2z",
  key: "1fyvmf"
}]], nm = Me("book-open", im), sm = [
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
], no = Me("box", sm), cm = [["path", {
  d: "M20 6 9 17l-5-5",
  key: "1gmf2c"
}]], ws = Me("check", cm), rm = [["path", {
  d: "m9 18 6-6-6-6",
  key: "mthhwq"
}]], cf = Me("chevron-right", rm), om = [
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
], si = Me("circle-alert", om), dm = [
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
], ci = Me("clapperboard", dm), um = [
  ["rect", {
    width: "8",
    height: "4",
    x: "8",
    y: "2",
    rx: "1",
    ry: "1",
    key: "tgr4d6"
  }],
  ["path", {
    d: "M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2",
    key: "116196"
  }],
  ["path", {
    d: "M12 11h4",
    key: "1jrz19"
  }],
  ["path", {
    d: "M12 16h4",
    key: "n85exb"
  }],
  ["path", {
    d: "M8 11h.01",
    key: "1dfujw"
  }],
  ["path", {
    d: "M8 16h.01",
    key: "18s6g9"
  }]
], pm = Me("clipboard-list", um), fm = [["circle", {
  cx: "12",
  cy: "12",
  r: "10",
  key: "1mglay"
}], ["path", {
  d: "M12 6v6h4",
  key: "135r8i"
}]], wf = Me("clock-3", fm), hm = [
  ["path", {
    d: "m18 16 4-4-4-4",
    key: "1inbqp"
  }],
  ["path", {
    d: "m6 8-4 4 4 4",
    key: "15zrgr"
  }],
  ["path", {
    d: "m14.5 4-5 16",
    key: "e7oirm"
  }]
], mm = Me("code-xml", hm), xm = [["rect", {
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
}]], _f = Me("copy", xm), gm = [
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
], Ts = Me("download", gm), bm = [
  ["path", {
    d: "M15 3h6v6",
    key: "1q9fwt"
  }],
  ["path", {
    d: "M10 14 21 3",
    key: "gplh6r"
  }],
  ["path", {
    d: "M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6",
    key: "a6xqqp"
  }]
], vm = Me("external-link", bm), jm = [
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
], bl = Me("file-check-corner", jm), ym = [
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
], Zr = Me("film", ym), Sm = [["path", {
  d: "m6 14 1.5-2.9A2 2 0 0 1 9.24 10H20a2 2 0 0 1 1.94 2.5l-1.54 6a2 2 0 0 1-1.95 1.5H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h3.9a2 2 0 0 1 1.69.9l.81 1.2a2 2 0 0 0 1.67.9H18a2 2 0 0 1 2 2v2",
  key: "usdka0"
}]], Kr = Me("folder-open", Sm), zm = [
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
], tn = Me("git-branch", zm), Nm = [
  ["path", {
    d: "M16 5h6",
    key: "1vod17"
  }],
  ["path", {
    d: "M19 2v6",
    key: "4bpg5p"
  }],
  ["path", {
    d: "M21 11.5V19a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h7.5",
    key: "1ue2ih"
  }],
  ["path", {
    d: "m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21",
    key: "1xmnt7"
  }],
  ["circle", {
    cx: "9",
    cy: "9",
    r: "2",
    key: "af1f0g"
  }]
], rf = Me("image-plus", Nm), wm = [
  ["path", {
    d: "M12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83z",
    key: "zw3jo"
  }],
  ["path", {
    d: "M2 12a1 1 0 0 0 .58.91l8.6 3.91a2 2 0 0 0 1.65 0l8.58-3.9A1 1 0 0 0 22 12",
    key: "1wduqc"
  }],
  ["path", {
    d: "M2 17a1 1 0 0 0 .58.91l8.6 3.91a2 2 0 0 0 1.65 0l8.58-3.9A1 1 0 0 0 22 17",
    key: "kqbvx6"
  }]
], _m = Me("layers", wm), km = [
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
], of = Me("layout-grid", km), Em = [
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
], Cs = Me("link-2", Em), Am = [
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
], Tm = Me("list-checks", Am), Cm = [["path", {
  d: "M21 12a9 9 0 1 1-6.219-8.56",
  key: "13zald"
}]], Jr = Me("loader-circle", Cm), Mm = [
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
], so = Me("lock-keyhole", Mm), Om = [["path", {
  d: "M22 17a2 2 0 0 1-2 2H6.828a2 2 0 0 0-1.414.586l-2.202 2.202A.71.71 0 0 1 2 21.286V5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2z",
  key: "18887p"
}]], Ir = Me("message-square", Om), Dm = [["path", {
  d: "M5 12h14",
  key: "1ays0h"
}], ["path", {
  d: "M12 5v14",
  key: "s699le"
}]], Pt = Me("plus", Dm), Um = [
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
], cn = Me("refresh-cw", Um), Rm = [["path", {
  d: "M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8",
  key: "1357e3"
}], ["path", {
  d: "M3 3v5h5",
  key: "1xhq8a"
}]], kf = Me("rotate-ccw", Rm), qm = [["path", {
  d: "m21 21-4.34-4.34",
  key: "14j7rj"
}], ["circle", {
  cx: "11",
  cy: "11",
  r: "8",
  key: "4ej97u"
}]], Ef = Me("search", qm), Lm = [["path", {
  d: "M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z",
  key: "oel41y"
}], ["path", {
  d: "m9 12 2 2 4-4",
  key: "dzmm74"
}]], gl = Me("shield-check", Lm), Hm = [
  ["path", {
    d: "M10 11v6",
    key: "nco0om"
  }],
  ["path", {
    d: "M14 11v6",
    key: "outv1u"
  }],
  ["path", {
    d: "M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6",
    key: "miytrc"
  }],
  ["path", {
    d: "M3 6h18",
    key: "d0wm0j"
  }],
  ["path", {
    d: "M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2",
    key: "e791ji"
  }]
], ri = Me("trash-2", Hm), Bm = [["path", {
  d: "M18 6 6 18",
  key: "1bl5f8"
}], ["path", {
  d: "m6 6 12 12",
  key: "d8bk6v"
}]], sn = Me("x", Bm), Gm = Zh(), Na = [
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
], Ym = class extends Error {
  status;
  constructor(r, m = 400) {
    super(r), this.status = m;
  }
}, df = (r, m = 400) => {
  throw new Ym(r, m);
};
function Ms(r) {
  return r.modelFlow ?? {
    models: [],
    issues: [],
    packs: [],
    pins: [],
    history: []
  };
}
function Vm(r, m, N) {
  const f = Ms(r).models.find((E) => E.id === m || E.key === m);
  f || df("找不到模型");
  const u = f.versions.find((E) => E.id === N);
  return u || df("找不到指定模型版本"), {
    m: f,
    v: u
  };
}
function Xm(r, m, N, f) {
  const { v: u } = Vm(r, m, N), E = u.stages[f], v = Na.findIndex((w) => w.id === f), A = [];
  return v > 0 && !u.stages[Na[v - 1].id].author && A.push("先核定 " + Na[v - 1].title), E.checks.every(Boolean) || A.push("完成本階段全部檢查"), E.evidence || A.push("填入實際產出或檢查報告位置"), (!E.summary || !E.nextStep) && A.push("填寫已做內容與接手下一步"), f === "M01" && (!u.sourceLocation || !u.sourceVersion || !u.backupLocation || !u.sha256) && A.push("補齊原檔版本、獨立備份與 SHA-256"), f === "M02" && !u.reference && A.push("補入設定及尺度來源"), v >= 3 && !u.candidateLocation && A.push("登記獨立候選 GLB"), Ms(r).issues.some((w) => w.modelId === m && w.versionId === N && w.status === "open" && (w.stageId === f || v >= 6 || w.kind === "major" && v >= 3)) && A.push("處理適用的待修或待裁定問題"), A;
}
var Qm = [
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
], Zm = [
  "唯一音軌",
  "音樂分析",
  "段落與節點",
  "鏡頭安排",
  "影格與動畫",
  "對音樂試剪",
  "支線驗收",
  "插入全片"
], Km = [
  ["已指定唯一使用音軌與版本；換音軌需重核切點"],
  ["已實際分析音樂、歌詞與節奏"],
  ["段落與重要音樂節點已標記"],
  ["鏡頭與音樂、主題、劇透範圍相符"],
  ["人物與主線一致，影格及動畫已驗收"],
  ["已按指定音軌核對切點與實際長度"],
  ["無不必要重複鏡頭，劇透範圍及情緒合適"],
  ["通過支線已插入剪輯專案，入點與出點可查"]
], Kt = [...Qm.map((r) => ({
  ...r,
  group: "main"
})), ...["op", "ed"].flatMap((r) => Zm.map((m, N) => ({
  id: r + String(N + 1).padStart(2, "0"),
  title: m,
  group: r,
  phase: r.toUpperCase() + " 支線",
  description: r === "op" ? "OP 以作品印象、人物關係及主題為主。" : "ED 以情緒收束及畫面變化為主。",
  output: m === "唯一音軌" ? "由作者在有效資料中指定音軌、版本與長度" : m,
  checks: Km[N],
  deps: N ? [r + String(N).padStart(2, "0")] : ["03"]
})))], Jm = [
  "script",
  "character",
  "scene",
  "voice",
  "op_audio",
  "ed_audio",
  "edit"
];
function oi(r) {
  return [...new Map(r.map((m) => [m.key, m])).values()];
}
function Ka(r) {
  return oi(r.filter((m) => m.status === "adopted" || m.status === "withdrawn")).filter((m) => m.status === "adopted");
}
function Im(r) {
  return {
    projectId: r.id,
    workId: r.workId,
    episode: r.episode,
    revision: r.revision,
    workflowSchema: r.workflowSchema ?? 1,
    genericChecks: Os(r).map(({ id: m, title: N, checks: f }) => ({
      id: m,
      title: N,
      checks: f
    })),
    rules: oi(r.episodeRules ?? []),
    adoptedRules: Ka(r.episodeRules ?? []),
    baselines: oi(r.baselines ?? []),
    adoptedBaselines: Ka(r.baselines ?? []),
    legacy: r.workflowLegacy ?? null,
    rule: "通用流程不含單集劇情條件。本集規則與採用清單各自保存版本，候選不取代已採用版，另一集須另行指定；檔案位置未驗看。"
  };
}
function $m(r) {
  return {
    id: r.id,
    title: r.title,
    revision: r.revision,
    updatedAt: r.updatedAt,
    sharedCount: new Set(r.sharedAssets.map((m) => m.key)).size
  };
}
var Af = class extends Error {
  status;
  constructor(r, m = 400) {
    super(r), this.status = m;
  }
};
function Os(r) {
  return Kt.filter((m) => m.group === "main" || r.branches[m.group]);
}
function Es(r, m) {
  const N = Kt.find((f) => f.id === m);
  if (!N) throw new Af("找不到階段");
  return N.deps.filter((f) => Os(r).some((u) => u.id === f) && !r.stages[f].author).map((f) => `${f} ${Kt.find((u) => u.id === f)?.title}`);
}
function Tf(r, m) {
  const N = r.stages[m], f = Es(r, m).map((E) => "先完成 " + E), u = Kt.find((E) => E.id === m).checks.length;
  return (N.checks.length < u || !N.checks.slice(0, u).every(Boolean)) && f.push("勾選全部驗收項目"), N.evidence.trim() || f.push("填入產出連結或檔案位置"), r.issues.some((E) => E.status === "open" && E.stageId === m) && f.push("處理此階段未結問題"), vl(r).problems.some((E) => E.status === "open" && (E.scope.type === "project" || E.scope.type === "stage" && E.scope.target === m || m === "12")) && f.push("處理適用範圍內的資訊矛盾或缺件"), m === "12" && (r.issues.some((E) => E.status === "open") && f.push("結清全部退修問題"), r.shots.some((E) => E.status !== "in_timeline") && f.push("總表中所有鏡頭須通過並入片"), r.shots.length || f.push("建立實際採用鏡頭與入片紀錄")), f;
}
function co(r) {
  const m = Os(r);
  return {
    id: r.id,
    workId: r.workId ?? "",
    title: r.title,
    episode: r.episode,
    revision: r.revision,
    archived: r.archived,
    updatedAt: r.updatedAt,
    completionReport: r.production?.completionReports?.at(-1) ?? null,
    approved: m.filter((N) => r.stages[N.id].author).length,
    total: m.length,
    openIssues: r.issues.filter((N) => N.status === "open").length,
    shots: r.shots.length,
    inTimeline: r.shots.filter((N) => N.status === "in_timeline").length,
    lastMcpAt: r.lastMcpAt,
    next: m.filter((N) => !r.stages[N.id].author && !Es(r, N.id).length).map((N) => ({
      id: N.id,
      title: N.title,
      reasons: Tf(r, N.id)
    }))
  };
}
function uo(r) {
  const m = vl(r), N = [...new Map((r.production?.links ?? []).map((u) => [u.shotId, u])).values()], f = [...new Map((r.production?.selections ?? []).map((u) => [u.shotId, u])).values()];
  return {
    project: co(r),
    settings: {
      rules: Ka(r.episodeRules ?? []).length,
      adopted: Ka(r.baselines ?? []).map(({ key: u, title: E, category: v, version: A, recordVersion: w, externalVersion: _ }) => ({
        key: u,
        title: E,
        category: v,
        version: A,
        recordVersion: w,
        externalVersion: _
      })),
      pending: oi(r.baselines ?? []).filter((u) => u.status === "unresolved" || u.status === "reference").map(({ key: u, title: E, status: v, note: A }) => ({
        key: u,
        title: E,
        status: v,
        note: A
      }))
    },
    registration: {
      sources: m.records.length,
      acceptedSources: m.records.filter(nn).length,
      shots: r.shots.length,
      linkedShots: N.length,
      locatedFrames: N.filter((u) => u.references.length).length,
      registeredSelections: (/* @__PURE__ */ new Set([...f.map((u) => u.shotId), ...N.filter((u) => u.adoptedOutput).map((u) => u.shotId)])).size,
      timelineRegistrations: f.filter((u) => u.editorVersion && u.inPoint && u.outPoint).length
    },
    outgoing: r.production?.handoffs?.at(-1) ?? null,
    openProblems: m.problems.filter((u) => u.status === "open"),
    lastWork: m.results.at(-1) ?? null,
    rule: "作者告知的製作完成、資料補登與素材實際檢視分開記錄。未登記的素材不推定未製作；接續整理保留來源，未對上成片的情節不得自動套用下一集。"
  };
}
var an = {
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
}, Wm = [
  "rule",
  "script",
  "character",
  "scene",
  "audio",
  "reference"
];
function vl(r) {
  return r.knowledge ?? {
    records: [],
    problems: [],
    packs: [],
    results: []
  };
}
function nn(r) {
  return r.approval?.verdict === "source_accepted" || r.status === "effective";
}
function $r(r, m) {
  return (r.production?.sections.find((N) => N.stageId === m)?.gaps ?? []).map((N, f) => {
    const u = [...r.production?.supplements ?? []].reverse().find((E) => E.stageId === m && E.gapIndex === f && E.gap === N);
    return {
      index: f,
      description: N,
      status: u ? "filled" : "open",
      record: u ? vl(r).records.find((E) => E.id === u.recordId) ?? null : null
    };
  });
}
function Fm(r, m) {
  if (r.workId && (!m || m.id !== r.workId) || m && m.id !== r.workId) throw new Af("集數與作品不相符", 400);
  const N = uo(r), f = m ? Ms(m) : null, u = (f?.models ?? []).map((v) => {
    const A = v.versions.at(-1), w = [...f?.history ?? []].reverse().find((Q) => Q.modelId === v.id && Q.versionId === A.id && Q.action === "save_model_stage"), _ = Na.find((Q) => !A.stages[Q.id].author) ?? Na[7], y = v.versions.find((Q) => Q.id === v.adoptedVersionId);
    return {
      modelId: v.id,
      key: v.key,
      title: v.title,
      versionId: A.id,
      label: A.label,
      adopted: y ? {
        versionId: y.id,
        label: y.label
      } : null,
      sourceLocation: A.sourceLocation,
      candidateLocation: A.candidateLocation,
      stageId: _.id,
      stageTitle: _.title,
      approved: Na.filter((Q) => A.stages[Q.id].author).length,
      lastWork: w ? {
        at: w.at,
        stageId: w.stageId,
        summary: A.stages[w.stageId].summary,
        evidence: A.stages[w.stageId].evidence,
        nextStep: A.stages[w.stageId].nextStep
      } : null,
      openIssues: f.issues.filter((Q) => Q.modelId === v.id && Q.versionId === A.id && Q.status === "open"),
      nextStep: w ? A.stages[w.stageId].nextStep : "尚無工作回報；先讀取模型來源與指定版本，再取得任務資料包。"
    };
  }), E = [...new Map((f?.pins ?? []).filter((v) => v.episodeId === r.id).map((v) => [[v.modelId, v.sceneIds].join("|"), v])).values()].map((v) => {
    const A = f.models.find((_) => _.id === v.modelId), w = A?.versions.find((_) => _.id === v.versionId);
    return {
      ...v,
      title: A?.title ?? v.modelId,
      label: w?.label ?? v.versionId
    };
  });
  return {
    schemaVersion: 1,
    projectId: r.id,
    episodeCode: r.episode,
    title: m?.title ?? r.title,
    projectRevision: r.revision,
    workId: m?.id ?? null,
    workRevision: m?.revision ?? null,
    episode: N,
    models: u,
    pins: E,
    issues: {
      animation: r.issues.filter((v) => v.status === "open"),
      context: N.openProblems,
      models: f?.issues.filter((v) => v.status === "open") ?? []
    },
    lastToolWrite: [r.lastMcpAt, ...(f?.history ?? []).filter((v) => v.actor === "ai").map((v) => v.at)].filter((v) => !!v).sort().at(-1) ?? null,
    policy: "此總覽唯讀，不是工作資料包。動畫與模型共用作品入口，各自保留精確版本與資料包。模型清單顯示最新登記候選，採用版及本集引用另列，禁止自動替換。作者告知完成不等於逐項素材驗看；未登記不推定未製作。執行前取得對應範圍的新資料包，實際讀取來源後才回報；不得代替作者核定。"
  };
}
var Pm = /* @__PURE__ */ ia(((r) => {
  var m = /* @__PURE__ */ Symbol.for("react.transitional.element"), N = /* @__PURE__ */ Symbol.for("react.fragment");
  function f(u, E, v) {
    var A = null;
    if (v !== void 0 && (A = "" + v), E.key !== void 0 && (A = "" + E.key), "key" in E) {
      v = {};
      for (var w in E) w !== "key" && (v[w] = E[w]);
    } else v = E;
    return E = v.ref, {
      $$typeof: m,
      type: u,
      key: A,
      ref: E !== void 0 ? E : null,
      props: v
    };
  }
  r.Fragment = N, r.jsx = f, r.jsxs = f;
})), ex = /* @__PURE__ */ ia(((r, m) => {
  m.exports = Pm();
})), l = ex(), uf = (r) => r ? new Date(r).toLocaleString("zh-TW", { timeZone: "Asia/Taipei" }) : "尚無紀錄";
function tx(r, m) {
  const N = URL.createObjectURL(new Blob([m], { type: "text/plain;charset=utf-8" })), f = document.createElement("a");
  f.href = N, f.download = r, f.click(), setTimeout(() => URL.revokeObjectURL(N), 1e3);
}
function ax({ project: r, work: m, busy: N, onNavigate: f, onModel: u }) {
  const E = Fm(r, m), [v, A] = (0, S.useState)(""), [w, _] = (0, S.useState)(""), [y, Q] = (0, S.useState)("animation"), C = E.models.find((V) => V.versionId === y), te = E.episode.lastWork, ae = E.issues.animation.length + E.issues.context.length + E.issues.models.length, K = `請使用「立之雲端庫｜動畫製作流程」工具，接手 ${E.title}／${r.episode}。先呼叫 read_animation_workspace({projectId:${JSON.stringify(r.id)}})，重新讀取伺服器最新資料，不使用本段文字中的舊 revision。
${C ? `本次範圍為模型 ${C.key}（modelId=${C.modelId}），精確版本 ${C.label}（versionId=${C.versionId}），定位階段 ${C.stageId}。workId=${m.id}。用 read_animation_models 查此版本的全部來源、問題及最近回報，確認實際任務範圍後，用 acquire_animation_model_context 取得新資料包；完成後用 update_animation_model_stage 回報。最新候選不等於已採用版。` : `本次範圍為 ${r.episode} 動畫。先讀 read_animation_episode_brief 與 read_animation_episode_settings，再依最近交接確認任務。用 preview_animation_context 檢查指定範圍，acquire_animation_context 保存資料包，以 submit_animation_work 回報。作者已告知完成的集數以資料補登為主，不因紀錄空白重做。`}
實際讀取所需素材後才執行，缺件、矛盾或過期資料包先回報受阻。寫回已做內容、產出位置與版本、未解問題及下一步。保留原檔、作者採用版本與各集固定引用，不能自行正式核定。若目前對話沒有上述工具，明確告知尚未接通，不宣稱已讀取或已回寫。`, [F, le] = (0, S.useState)(!1), H = E.episode.project.completionReport?.status === "completed", ie = [
    ...E.issues.context.map((V) => ({
      id: V.id,
      text: V.description,
      tab: "context"
    })),
    ...E.issues.animation.map((V) => ({
      id: V.id,
      text: V.reason,
      tab: "issues"
    })),
    ...E.issues.models.map((V) => ({
      id: V.id,
      text: V.reason,
      tab: "models"
    }))
  ];
  return /* @__PURE__ */ (0, l.jsxs)("section", {
    className: "home-board",
    children: [
      /* @__PURE__ */ (0, l.jsxs)("article", {
        className: "next-action",
        children: [
          /* @__PURE__ */ (0, l.jsx)("div", {
            className: "eyebrow",
            children: "接下來做什麼"
          }),
          /* @__PURE__ */ (0, l.jsx)("h2", { children: H ? "本集已完成，繼續整理製作紀錄" : te ? "接著完成上次的工作" : "從本集製作資料開始" }),
          /* @__PURE__ */ (0, l.jsx)("p", { children: te?.nextStep || (H ? "補上採用檔案與製作過程，讓下一集和下一位 AI 都能接著用。" : "先整理劇本、角色與場景參考，再開始製作。") }),
          /* @__PURE__ */ (0, l.jsxs)("div", {
            className: "context-actions",
            children: [/* @__PURE__ */ (0, l.jsxs)("button", {
              className: "btn primary",
              disabled: N,
              onClick: () => f("context"),
              children: [
                H ? "繼續整理資料" : "開啟製作資料",
                " ",
                /* @__PURE__ */ (0, l.jsx)(ni, { size: 16 })
              ]
            }), /* @__PURE__ */ (0, l.jsx)("button", {
              className: "btn",
              onClick: () => le(!F),
              "aria-expanded": F,
              children: "交給 ChatGPT 接手"
            })]
          })
        ]
      }),
      /* @__PURE__ */ (0, l.jsxs)("div", {
        className: "home-summary",
        children: [
          /* @__PURE__ */ (0, l.jsxs)("div", { children: [
            /* @__PURE__ */ (0, l.jsx)("span", { children: "本集製作" }),
            /* @__PURE__ */ (0, l.jsx)("strong", { children: H ? "已完成" : E.episode.project.completionReport?.status === "in_progress" ? "製作中" : "尚未登記" }),
            /* @__PURE__ */ (0, l.jsx)("small", { children: "依作者登記" })
          ] }),
          /* @__PURE__ */ (0, l.jsxs)("div", { children: [
            /* @__PURE__ */ (0, l.jsx)("span", { children: "未處理問題" }),
            /* @__PURE__ */ (0, l.jsxs)("strong", { children: [ae, /* @__PURE__ */ (0, l.jsx)("em", { children: " 項" })] }),
            /* @__PURE__ */ (0, l.jsx)("small", { children: "動畫、資料與模型合計" })
          ] }),
          /* @__PURE__ */ (0, l.jsxs)("button", {
            onClick: () => f("models"),
            children: [
              /* @__PURE__ */ (0, l.jsx)("span", { children: "共用模型" }),
              /* @__PURE__ */ (0, l.jsxs)("strong", { children: [E.models.length, /* @__PURE__ */ (0, l.jsx)("em", { children: " 個" })] }),
              /* @__PURE__ */ (0, l.jsx)("small", { children: "依已登記模型" })
            ]
          })
        ]
      }),
      F && /* @__PURE__ */ (0, l.jsxs)("article", {
        className: "wide-card ai-handoff",
        children: [
          /* @__PURE__ */ (0, l.jsxs)("div", {
            className: "section-title",
            children: [/* @__PURE__ */ (0, l.jsx)("h2", { children: "把這次工作交給 ChatGPT" }), /* @__PURE__ */ (0, l.jsx)("button", {
              className: "text-btn",
              onClick: () => le(!1),
              children: "收起"
            })]
          }),
          /* @__PURE__ */ (0, l.jsx)("p", { children: "在已連接工作台的對話貼上指令，AI 會先讀取最新進度。" }),
          /* @__PURE__ */ (0, l.jsxs)("label", {
            className: "form-field",
            children: ["要接手的工作", /* @__PURE__ */ (0, l.jsxs)("select", {
              value: y,
              onChange: (V) => Q(V.target.value),
              children: [/* @__PURE__ */ (0, l.jsxs)("option", {
                value: "animation",
                children: [r.episode, " 動畫與資料整理"]
              }), E.models.map((V) => /* @__PURE__ */ (0, l.jsxs)("option", {
                value: V.versionId,
                children: [
                  V.title,
                  " · ",
                  V.label
                ]
              }, V.versionId))]
            })]
          }),
          /* @__PURE__ */ (0, l.jsxs)("div", {
            className: "context-actions",
            children: [/* @__PURE__ */ (0, l.jsxs)("button", {
              className: "btn primary",
              onClick: async () => {
                try {
                  await navigator.clipboard.writeText(K), A("已複製，請貼到已連接工作台的 ChatGPT 對話。");
                } catch {
                  A("無法直接複製，請展開完整指令後手動複製。");
                }
              },
              children: [/* @__PURE__ */ (0, l.jsx)(_f, { size: 15 }), "複製接手指令"]
            }), /* @__PURE__ */ (0, l.jsx)("button", {
              className: "btn",
              onClick: () => f("chatgpt"),
              children: "查看連接方式"
            })]
          }),
          /* @__PURE__ */ (0, l.jsx)("p", {
            role: "status",
            children: v
          }),
          /* @__PURE__ */ (0, l.jsxs)("details", { children: [
            /* @__PURE__ */ (0, l.jsx)("summary", { children: "完整指令與下載" }),
            /* @__PURE__ */ (0, l.jsx)("textarea", {
              readOnly: !0,
              "aria-label": "AI 接手指令",
              rows: 8,
              value: K
            }),
            /* @__PURE__ */ (0, l.jsxs)("button", {
              className: "btn",
              onClick: () => tx(r.episode + "_AI接續指令.txt", K),
              children: [/* @__PURE__ */ (0, l.jsx)(Ts, { size: 15 }), "下載指令"]
            })
          ] }),
          /* @__PURE__ */ (0, l.jsxs)("small", { children: [
            "複製指令不會自動啟動 AI。最近寫入：",
            uf(E.lastToolWrite),
            "。"
          ] })
        ]
      }),
      /* @__PURE__ */ (0, l.jsxs)("div", {
        className: "home-columns",
        children: [/* @__PURE__ */ (0, l.jsxs)("article", {
          className: "wide-card",
          children: [/* @__PURE__ */ (0, l.jsx)("div", {
            className: "section-title",
            children: /* @__PURE__ */ (0, l.jsx)("h2", { children: "選擇要做的工作" })
          }), /* @__PURE__ */ (0, l.jsxs)("div", {
            className: "task-choices",
            children: [
              /* @__PURE__ */ (0, l.jsxs)("button", {
                onClick: () => f("main"),
                children: [
                  /* @__PURE__ */ (0, l.jsx)(bl, { size: 22 }),
                  /* @__PURE__ */ (0, l.jsxs)("span", { children: [/* @__PURE__ */ (0, l.jsx)("b", { children: "動畫製作" }), /* @__PURE__ */ (0, l.jsx)("small", { children: "主線、片頭片尾與鏡頭素材" })] }),
                  /* @__PURE__ */ (0, l.jsx)(ni, { size: 17 })
                ]
              }),
              /* @__PURE__ */ (0, l.jsxs)("button", {
                onClick: () => f("models"),
                children: [
                  /* @__PURE__ */ (0, l.jsx)(no, { size: 22 }),
                  /* @__PURE__ */ (0, l.jsxs)("span", { children: [/* @__PURE__ */ (0, l.jsx)("b", { children: "3D 模型" }), /* @__PURE__ */ (0, l.jsx)("small", { children: "模型版本、檢查與採用紀錄" })] }),
                  /* @__PURE__ */ (0, l.jsx)(ni, { size: 17 })
                ]
              }),
              /* @__PURE__ */ (0, l.jsxs)("button", {
                onClick: () => f("project"),
                children: [
                  /* @__PURE__ */ (0, l.jsx)(wf, { size: 22 }),
                  /* @__PURE__ */ (0, l.jsxs)("span", { children: [/* @__PURE__ */ (0, l.jsx)("b", { children: "作品與後續集數" }), /* @__PURE__ */ (0, l.jsx)("small", { children: "管理集數與共用參考資料" })] }),
                  /* @__PURE__ */ (0, l.jsx)(ni, { size: 17 })
                ]
              })
            ]
          })]
        }), /* @__PURE__ */ (0, l.jsxs)("article", {
          className: "wide-card attention-card",
          children: [/* @__PURE__ */ (0, l.jsxs)("div", {
            className: "section-title",
            children: [/* @__PURE__ */ (0, l.jsx)("h2", { children: "需要處理的事" }), /* @__PURE__ */ (0, l.jsxs)("span", {
              className: "muted",
              children: [ae, " 項"]
            })]
          }), ie.length ? /* @__PURE__ */ (0, l.jsxs)("div", {
            className: "attention-list",
            children: [ie.slice(0, 3).map((V) => /* @__PURE__ */ (0, l.jsxs)("button", {
              onClick: () => f(V.tab),
              children: [
                /* @__PURE__ */ (0, l.jsx)(si, { size: 17 }),
                /* @__PURE__ */ (0, l.jsx)("span", { children: V.text }),
                /* @__PURE__ */ (0, l.jsx)(ni, { size: 15 })
              ]
            }, V.id)), ie.length > 3 && /* @__PURE__ */ (0, l.jsxs)("details", { children: [/* @__PURE__ */ (0, l.jsxs)("summary", { children: [
              "其餘 ",
              ie.length - 3,
              " 項問題"
            ] }), ie.slice(3).map((V) => /* @__PURE__ */ (0, l.jsx)("button", {
              onClick: () => f(V.tab),
              children: V.text
            }, V.id))] })]
          }) : /* @__PURE__ */ (0, l.jsxs)("div", {
            className: "quiet-state",
            children: [
              /* @__PURE__ */ (0, l.jsx)(bl, { size: 28 }),
              /* @__PURE__ */ (0, l.jsx)("h3", { children: "目前沒有登記問題" }),
              /* @__PURE__ */ (0, l.jsx)("p", { children: "發現缺件或需要修改時，再加入紀錄。" })
            ]
          })]
        })]
      }),
      /* @__PURE__ */ (0, l.jsxs)("details", {
        className: "wide-card home-history",
        children: [
          /* @__PURE__ */ (0, l.jsx)("summary", { children: "最近工作與模型版本" }),
          te ? /* @__PURE__ */ (0, l.jsxs)(l.Fragment, { children: [
            /* @__PURE__ */ (0, l.jsx)("h3", { children: te.task }),
            /* @__PURE__ */ (0, l.jsx)("p", { children: te.summary }),
            te.needsReview && /* @__PURE__ */ (0, l.jsx)("p", {
              className: "resume-warning",
              children: "採用依據有更新，接手前請重新讀取。"
            }),
            /* @__PURE__ */ (0, l.jsx)("small", { children: uf(te.at) })
          ] }) : /* @__PURE__ */ (0, l.jsx)("p", { children: "尚無 AI 工作回報；這不代表沒有製作成果。" }),
          E.models.map((V) => /* @__PURE__ */ (0, l.jsxs)("div", {
            className: "home-model-row",
            children: [/* @__PURE__ */ (0, l.jsxs)("div", { children: [
              /* @__PURE__ */ (0, l.jsx)("b", { children: V.title }),
              /* @__PURE__ */ (0, l.jsxs)("p", { children: [
                "目前候選 ",
                V.label,
                " · 採用 ",
                V.adopted?.label ?? "尚未登記"
              ] }),
              /* @__PURE__ */ (0, l.jsx)("small", { children: V.nextStep })
            ] }), /* @__PURE__ */ (0, l.jsx)("button", {
              className: "btn",
              disabled: N,
              onClick: () => u({
                modelId: V.modelId,
                versionId: V.versionId,
                stageId: V.stageId
              }),
              children: "開啟版本"
            })]
          }, V.modelId)),
          /* @__PURE__ */ (0, l.jsxs)("details", { children: [
            /* @__PURE__ */ (0, l.jsxs)("summary", { children: [
              "本集固定模型引用（",
              E.pins.length,
              "）"
            ] }),
            E.pins.map((V, W) => /* @__PURE__ */ (0, l.jsxs)("p", { children: [
              V.title,
              " · ",
              V.label,
              " · ",
              V.purpose
            ] }, W)),
            /* @__PURE__ */ (0, l.jsx)("button", {
              className: "btn",
              onClick: () => f("settings"),
              children: "查看採用設定"
            })
          ] }),
          /* @__PURE__ */ (0, l.jsxs)("details", { children: [
            /* @__PURE__ */ (0, l.jsx)("summary", { children: "AI 接手識別資料" }),
            /* @__PURE__ */ (0, l.jsxs)("p", { children: ["集數 ID：", r.id] }),
            /* @__PURE__ */ (0, l.jsxs)("p", { children: ["作品 ID：", m?.id || "未歸屬"] }),
            /* @__PURE__ */ (0, l.jsxs)("p", { children: ["資料版本：", r.revision] })
          ] })
        ]
      })
    ]
  });
}
function lx({ project: r, check: m }) {
  const [N, f] = (0, S.useState)(!1), [u, E] = (0, S.useState)(""), [v, A] = (0, S.useState)(""), w = `請使用「立之雲端庫｜動畫製作流程」外掛，先呼叫 read_animation_workspace，projectId 為 ${r.id}，確認 ${r.episode} 的目前進度、採用版本、未解問題與下一步。請重新讀取最新資料，不從聊天推定完成。若本集已由作者告知完成，先做資料補登。確認範圍後取得新的工作資料包，實際讀取參考素材，最後回報已做內容、成果位置、未完成項及下一步。若本對話沒有工具，請明確告知未連接。`;
  return /* @__PURE__ */ (0, l.jsxs)("section", {
    className: "connection-simple",
    children: [/* @__PURE__ */ (0, l.jsxs)("article", {
      className: "wide-card",
      children: [
        /* @__PURE__ */ (0, l.jsx)("div", {
          className: "eyebrow",
          children: "與你共用同一份進度"
        }),
        /* @__PURE__ */ (0, l.jsx)("h2", { children: "讓 ChatGPT 讀懂並接續工作" }),
        /* @__PURE__ */ (0, l.jsx)("p", {
          className: "stage-description",
          children: "你在雲端庫管理作品；已連接的 ChatGPT 可以查資料、補紀錄、登記問題和回報成果。"
        }),
        /* @__PURE__ */ (0, l.jsxs)("ol", {
          className: "connect-steps",
          children: [
            /* @__PURE__ */ (0, l.jsxs)("li", { children: [/* @__PURE__ */ (0, l.jsx)("b", { children: "在 ChatGPT 選用流程工作台" }), /* @__PURE__ */ (0, l.jsx)("p", { children: "在對話輸入 @，選擇「立之雲端庫｜動畫製作流程」。若已安裝卻找不到，請開新對話再選。" })] }),
            /* @__PURE__ */ (0, l.jsxs)("li", { children: [/* @__PURE__ */ (0, l.jsx)("b", { children: "告訴它這次要做什麼" }), /* @__PURE__ */ (0, l.jsx)("p", { children: "複製下方指令，再補上你的任務，例如「整理這集還缺什麼」或「接手主角家的模型」。" })] }),
            /* @__PURE__ */ (0, l.jsxs)("li", { children: [/* @__PURE__ */ (0, l.jsx)("b", { children: "完成後回來看紀錄" }), /* @__PURE__ */ (0, l.jsx)("p", { children: "ChatGPT 回報後，這裡會顯示工作結果與下一步。正式採用版本由你確認。" })] })
          ]
        }),
        /* @__PURE__ */ (0, l.jsxs)("button", {
          className: "btn primary",
          onClick: async () => {
            try {
              await navigator.clipboard.writeText(w), A("已複製，請貼到選用工作台的對話。");
            } catch {
              A("請展開完整指令後手動複製。");
            }
          },
          children: [/* @__PURE__ */ (0, l.jsx)(_f, { size: 16 }), "複製本集接手指令"]
        }),
        /* @__PURE__ */ (0, l.jsx)("p", {
          role: "status",
          children: v
        }),
        /* @__PURE__ */ (0, l.jsxs)("details", { children: [/* @__PURE__ */ (0, l.jsx)("summary", { children: "查看完整指令" }), /* @__PURE__ */ (0, l.jsx)("textarea", {
          "aria-label": "本集接手指令",
          readOnly: !0,
          rows: 7,
          value: w
        })] })
      ]
    }), /* @__PURE__ */ (0, l.jsxs)("article", {
      className: "wide-card",
      children: [
        /* @__PURE__ */ (0, l.jsxs)("h2", { children: [/* @__PURE__ */ (0, l.jsx)(Cs, { size: 20 }), " 連線與最近更新"] }),
        /* @__PURE__ */ (0, l.jsx)("p", { children: "網頁連線與對話工具是兩個檢查項目；這個按鈕會檢查網頁能否讀取共用資料。" }),
        /* @__PURE__ */ (0, l.jsxs)("button", {
          className: "btn",
          disabled: N,
          onClick: async () => {
            f(!0), E("");
            try {
              await m(), E("共用資料讀取成功。對話是否已選用外掛，仍需由 ChatGPT 實際呼叫工具確認。");
            } catch (_) {
              E("讀取失敗：" + (_ instanceof Error ? _.message : String(_)));
            } finally {
              f(!1);
            }
          },
          children: [/* @__PURE__ */ (0, l.jsx)(cn, {
            size: 15,
            className: N ? "spin" : ""
          }), N ? "檢查中…" : "檢查資料連線"]
        }),
        /* @__PURE__ */ (0, l.jsx)("p", {
          role: "status",
          children: u
        }),
        /* @__PURE__ */ (0, l.jsx)("div", {
          className: "connection-state",
          children: /* @__PURE__ */ (0, l.jsxs)("div", { children: [/* @__PURE__ */ (0, l.jsx)("b", { children: r.lastMcpAt ? "已有 ChatGPT 回報紀錄" : "尚無 ChatGPT 寫入紀錄" }), /* @__PURE__ */ (0, l.jsx)("small", { children: r.lastMcpAt ? new Date(r.lastMcpAt).toLocaleString("zh-TW", { timeZone: "Asia/Taipei" }) : "首次回報後會顯示時間" })] })
        }),
        /* @__PURE__ */ (0, l.jsx)("small", { children: "這是最近寫入時間，不代表 AI 正在執行。" }),
        /* @__PURE__ */ (0, l.jsxs)("details", { children: [
          /* @__PURE__ */ (0, l.jsx)("summary", { children: "連接與權限詳情" }),
          /* @__PURE__ */ (0, l.jsx)("p", { children: "MCP：https://lizhi-animation-flow.lihuany635.chatgpt.site/mcp" }),
          /* @__PURE__ */ (0, l.jsx)("p", { children: "每次更新先讀取最新版本。AI 可補充紀錄、提出問題與回報工作；作者核定及正式採用由網頁確認。" }),
          /* @__PURE__ */ (0, l.jsx)("p", { children: "只填檔案位置不會上傳檔案；ChatGPT 必須能實際取得素材，才能檢查內容。" })
        ] })
      ]
    })]
  });
}
var pf = {
  rule: "規則／決策",
  script: "劇本／台詞",
  character: "角色",
  scene: "場景",
  audio: "聲音",
  reference: "原作／參考"
};
function ix({ project: r, busy: m, mutate: N }) {
  const [f, u] = (0, S.useState)(""), [E, v] = (0, S.useState)(""), [A, w] = (0, S.useState)(""), [_, y] = (0, S.useState)(30), [Q, C] = (0, S.useState)("main"), [te, ae] = (0, S.useState)(null), [K, F] = (0, S.useState)(""), [le, H] = (0, S.useState)(""), [ie, V] = (0, S.useState)({
    content: "",
    source: "",
    location: ""
  }), W = vl(r).records, P = r.production?.sections ?? [], xe = P.find((g) => g.stageId === f), de = W.filter(nn).length, J = $r(r, f), j = P.reduce((g, ee) => g + $r(r, ee.stageId).filter((Z) => Z.status === "open").length, 0), I = new Set(P.flatMap((g) => g.recordKeys)), ye = W.filter((g) => (!f || xe?.recordKeys.includes(g.key) || g.scope.type === "stage" && g.scope.target === f) && (!A || g.kind === A) && (!E || [
    g.title,
    g.key,
    g.content,
    g.source,
    g.scope.target
  ].join(" ").toLowerCase().includes(E.toLowerCase()))).sort((g, ee) => (g.key.startsWith("ep01_src_") ? 1 : I.has(g.key) ? 0 : 2) - (ee.key.startsWith("ep01_src_") ? 1 : I.has(ee.key) ? 0 : 2));
  async function fe(g) {
    if (ae(null), F(""), !!g)
      try {
        if (g.size > 15e5) throw new Error("資料包不可超過 1.5 MB");
        const ee = JSON.parse(await g.text());
        if (ee.schemaVersion !== 1 || ee.episode !== r.episode || !Array.isArray(ee.records) || !Array.isArray(ee.shots) || !Array.isArray(ee.sections)) throw new Error("請選擇相同集數的製作資料包");
        ae(ee);
      } catch (ee) {
        F(ee instanceof Error ? ee.message : "資料包讀取失敗");
      }
  }
  return /* @__PURE__ */ (0, l.jsxs)(l.Fragment, { children: [
    /* @__PURE__ */ (0, l.jsxs)("div", {
      className: "section-title",
      children: [/* @__PURE__ */ (0, l.jsxs)("div", { children: [
        /* @__PURE__ */ (0, l.jsx)("div", {
          className: "eyebrow",
          children: "PRODUCTION MATERIALS"
        }),
        /* @__PURE__ */ (0, l.jsx)("h2", { children: "各環節的實際製作資料" }),
        /* @__PURE__ */ (0, l.jsx)("p", { children: "原作、完整台詞、逐鏡方案與提示詞，均保留來源及版本。" })
      ] }), /* @__PURE__ */ (0, l.jsx)("button", {
        className: "btn",
        onClick: () => {
          const g = URL.createObjectURL(new Blob([JSON.stringify({
            episode: r.episode,
            production: r.production,
            records: W,
            shots: r.shots
          }, null, 2)], { type: "application/json" })), ee = document.createElement("a");
          ee.href = g, ee.download = r.episode + "_製作資料.json", ee.click(), setTimeout(() => URL.revokeObjectURL(g), 1e3);
        },
        children: "匯出製作資料"
      })]
    }),
    /* @__PURE__ */ (0, l.jsxs)("div", {
      className: "production-totals",
      children: [
        /* @__PURE__ */ (0, l.jsxs)("b", { children: [W.length, " 筆資料"] }),
        /* @__PURE__ */ (0, l.jsxs)("b", { children: [r.shots.length, " 列鏡頭規劃"] }),
        /* @__PURE__ */ (0, l.jsxs)("b", { children: [P.length, " 個階段已盤點"] }),
        /* @__PURE__ */ (0, l.jsx)("span", { children: "實際缺件依下方清單，沒有以資料筆數推算完成率。" })
      ]
    }),
    /* @__PURE__ */ (0, l.jsx)("div", {
      className: "production-acceptance",
      children: r.production?.acceptance ? /* @__PURE__ */ (0, l.jsxs)(l.Fragment, { children: [
        /* @__PURE__ */ (0, l.jsx)("span", {
          className: "status passed",
          children: "現有資料已通過"
        }),
        /* @__PURE__ */ (0, l.jsxs)("b", { children: [de, " 筆已確認收錄"] }),
        /* @__PURE__ */ (0, l.jsx)("p", { children: r.production.acceptance.note }),
        /* @__PURE__ */ (0, l.jsxs)("p", { children: [
          "補齊已開放 · ",
          j,
          " 項待補。可直接保存補充內容，不需逐筆再確認。不同來源版本保留，採用版本另行指定。"
        ] })
      ] }) : /* @__PURE__ */ (0, l.jsxs)(l.Fragment, { children: [/* @__PURE__ */ (0, l.jsx)("p", { children: "依作者確認，將已完成的資料一次通過，並開放剩餘項目直接補齊。" }), /* @__PURE__ */ (0, l.jsx)("button", {
        className: "btn primary",
        disabled: m || r.archived || !P.length,
        onClick: () => {
          N("accept_production_data", { note: "依作者2026-10-21指示：目前先不用檢核，已完成的資料直接通過；剩餘項目開放直接補齊。" });
        },
        children: "通過現有資料並開放補齊"
      })] })
    }),
    /* @__PURE__ */ (0, l.jsxs)("div", {
      className: "production-filters",
      children: [
        /* @__PURE__ */ (0, l.jsxs)("label", { children: ["搜尋實際內容", /* @__PURE__ */ (0, l.jsx)("input", {
          placeholder: "台詞、F077、G11、角色或素材名稱",
          value: E,
          onChange: (g) => {
            v(g.target.value), y(30);
          }
        })] }),
        /* @__PURE__ */ (0, l.jsxs)("label", { children: ["製作階段", /* @__PURE__ */ (0, l.jsxs)("select", {
          value: f,
          onChange: (g) => {
            u(g.target.value), y(30);
          },
          children: [/* @__PURE__ */ (0, l.jsx)("option", {
            value: "",
            children: "全部階段"
          }), Kt.map((g) => /* @__PURE__ */ (0, l.jsxs)("option", {
            value: g.id,
            children: [
              g.id,
              " ",
              g.title
            ]
          }, g.id))]
        })] }),
        /* @__PURE__ */ (0, l.jsxs)("label", { children: ["資料種類", /* @__PURE__ */ (0, l.jsxs)("select", {
          value: A,
          onChange: (g) => {
            w(g.target.value), y(30);
          },
          children: [/* @__PURE__ */ (0, l.jsx)("option", {
            value: "",
            children: "全部種類"
          }), Object.entries(pf).map(([g, ee]) => /* @__PURE__ */ (0, l.jsx)("option", {
            value: g,
            children: ee
          }, g))]
        })] })
      ]
    }),
    /* @__PURE__ */ (0, l.jsx)("div", {
      className: "context-tabs",
      "aria-label": "資料階段分組",
      children: [
        ["main", "主線 12 階段"],
        ["op", "OP 支線"],
        ["ed", "ED 支線"]
      ].map(([g, ee]) => /* @__PURE__ */ (0, l.jsx)("button", {
        className: Q === g ? "active" : "",
        onClick: () => C(g),
        children: ee
      }, g))
    }),
    /* @__PURE__ */ (0, l.jsx)("div", {
      className: "production-grid",
      children: Kt.filter((g) => g.group === Q).map((g) => {
        const ee = P.find((B) => B.stageId === g.id), Z = $r(r, g.id).filter((B) => B.status === "open").length;
        return /* @__PURE__ */ (0, l.jsxs)("button", {
          className: "production-stage " + (f === g.id ? "selected" : ""),
          onClick: () => {
            u(f === g.id ? "" : g.id), H(""), y(30);
          },
          children: [
            /* @__PURE__ */ (0, l.jsx)("small", { children: g.group === "main" ? g.id : g.group.toUpperCase() + " " + g.id.slice(2) }),
            /* @__PURE__ */ (0, l.jsx)("b", { children: g.title }),
            /* @__PURE__ */ (0, l.jsx)("span", { children: ee ? ee.recordKeys.length + " 筆相關資料" : "尚未盤點" }),
            /* @__PURE__ */ (0, l.jsx)("em", { children: ee ? Z + " 項待補" : "待補資料" })
          ]
        }, g.id);
      })
    }),
    xe && /* @__PURE__ */ (0, l.jsxs)("div", {
      className: "production-gaps",
      children: [
        /* @__PURE__ */ (0, l.jsxs)("h3", { children: [Kt.find((g) => g.id === f)?.title, " · 資料盤點"] }),
        /* @__PURE__ */ (0, l.jsx)("p", { children: xe.overview }),
        /* @__PURE__ */ (0, l.jsx)("b", { children: "補齊清單" }),
        J.length ? /* @__PURE__ */ (0, l.jsx)("div", { children: J.map((g) => /* @__PURE__ */ (0, l.jsxs)("article", {
          className: "production-gap",
          children: [
            /* @__PURE__ */ (0, l.jsx)("span", {
              className: "status " + (g.status === "filled" ? "passed" : "candidate"),
              children: g.status === "filled" ? "已補資料" : r.production?.supplementsOpen ? "開放補齊" : "待補"
            }),
            /* @__PURE__ */ (0, l.jsx)("p", { children: g.description }),
            g.record && /* @__PURE__ */ (0, l.jsxs)("details", { children: [
              /* @__PURE__ */ (0, l.jsx)("summary", { children: "查看已補內容與來源" }),
              /* @__PURE__ */ (0, l.jsx)("div", {
                className: "production-source-text",
                children: g.record.content
              }),
              /* @__PURE__ */ (0, l.jsxs)("p", { children: ["來源：", g.record.source] }),
              /* @__PURE__ */ (0, l.jsxs)("p", { children: ["素材位置：", g.record.location || "內容已記錄"] })
            ] }),
            r.production?.supplementsOpen && (le === f + ":" + g.index ? /* @__PURE__ */ (0, l.jsxs)("form", {
              className: "context-form",
              onSubmit: async (ee) => {
                ee.preventDefault(), await N("supplement_production_data", {
                  stageId: f,
                  gapIndex: g.index,
                  ...ie
                }) && (H(""), V({
                  content: "",
                  source: "",
                  location: ""
                }));
              },
              children: [
                /* @__PURE__ */ (0, l.jsxs)("label", { children: ["補齊內容", /* @__PURE__ */ (0, l.jsx)("textarea", {
                  required: !0,
                  rows: 5,
                  maxLength: 12e3,
                  value: ie.content,
                  onChange: (ee) => V({
                    ...ie,
                    content: ee.target.value
                  })
                })] }),
                /* @__PURE__ */ (0, l.jsxs)("label", { children: ["補件來源", /* @__PURE__ */ (0, l.jsx)("input", {
                  required: !0,
                  maxLength: 2e3,
                  value: ie.source,
                  onChange: (ee) => V({
                    ...ie,
                    source: ee.target.value
                  })
                })] }),
                /* @__PURE__ */ (0, l.jsxs)("label", { children: ["補件素材位置", /* @__PURE__ */ (0, l.jsx)("input", {
                  maxLength: 2e3,
                  value: ie.location,
                  onChange: (ee) => V({
                    ...ie,
                    location: ee.target.value
                  })
                })] }),
                /* @__PURE__ */ (0, l.jsxs)("div", {
                  className: "context-actions",
                  children: [/* @__PURE__ */ (0, l.jsx)("button", {
                    className: "btn",
                    type: "button",
                    onClick: () => H(""),
                    children: "取消"
                  }), /* @__PURE__ */ (0, l.jsx)("button", {
                    className: "btn primary",
                    disabled: m || r.archived,
                    children: "直接保存補齊內容"
                  })]
                })
              ]
            }) : /* @__PURE__ */ (0, l.jsx)("button", {
              className: "btn",
              disabled: m || r.archived,
              onClick: () => {
                H(f + ":" + g.index), V({
                  content: g.record?.content ?? "",
                  source: g.record?.source ?? "",
                  location: g.record?.location ?? ""
                });
              },
              children: g.status === "filled" ? "追加補充版本" : "補齊此項"
            }))
          ]
        }, g.index)) }) : /* @__PURE__ */ (0, l.jsx)("p", { children: "本次盤點未列缺件。" })
      ]
    }),
    /* @__PURE__ */ (0, l.jsxs)("p", {
      className: "muted",
      children: [
        "找到 ",
        ye.length,
        " 筆資料；展開可讀取完整內容與來源。"
      ]
    }),
    /* @__PURE__ */ (0, l.jsx)("div", {
      className: "production-records",
      children: ye.slice(0, _).map((g) => /* @__PURE__ */ (0, l.jsxs)("details", {
        className: "production-record",
        children: [
          /* @__PURE__ */ (0, l.jsxs)("summary", { children: [
            /* @__PURE__ */ (0, l.jsx)("span", {
              className: "status " + (nn(g) ? "passed" : "candidate"),
              children: g.status === "effective" ? "採用版本" : g.status === "superseded" ? "已停用" : nn(g) ? "資料已通過" : "來源資料／待確認"
            }),
            /* @__PURE__ */ (0, l.jsx)("b", { children: g.title }),
            /* @__PURE__ */ (0, l.jsxs)("small", { children: [
              pf[g.kind],
              " · ",
              g.scope.target || "本集共用"
            ] })
          ] }),
          /* @__PURE__ */ (0, l.jsxs)("code", {
            className: "context-id",
            children: [
              g.key,
              " · v",
              g.version
            ]
          }),
          /* @__PURE__ */ (0, l.jsx)("div", {
            className: "production-source-text",
            children: g.content
          }),
          /* @__PURE__ */ (0, l.jsxs)("p", {
            className: "context-source",
            children: [
              "來源：",
              g.source,
              /* @__PURE__ */ (0, l.jsx)("br", {}),
              "素材位置：",
              g.location || "內容已收錄於本資料；無外部素材位置"
            ]
          })
        ]
      }, g.id))
    }),
    ye.length > _ && /* @__PURE__ */ (0, l.jsx)("button", {
      className: "btn",
      onClick: () => y(_ + 30),
      children: "再顯示 30 筆資料"
    }),
    !W.length && /* @__PURE__ */ (0, l.jsx)("p", {
      className: "empty",
      children: "尚無製作資料。可逐筆新增，或匯入下方資料包。"
    }),
    /* @__PURE__ */ (0, l.jsxs)("details", {
      className: "production-import",
      children: [
        /* @__PURE__ */ (0, l.jsx)("summary", { children: "批次補入製作資料" }),
        /* @__PURE__ */ (0, l.jsx)("p", { children: "先顯示筆數及集數，保存後全部作為待確認來源。保留現有資料與核定狀態；重複識別鍵會拒絕匯入。" }),
        /* @__PURE__ */ (0, l.jsxs)("label", { children: ["選擇製作資料包（JSON）", /* @__PURE__ */ (0, l.jsx)("input", {
          type: "file",
          accept: "application/json,.json",
          disabled: m || r.archived,
          onChange: (g) => {
            fe(g.target.files?.[0]);
          }
        })] }),
        K && /* @__PURE__ */ (0, l.jsx)("p", {
          role: "alert",
          children: K
        }),
        te && /* @__PURE__ */ (0, l.jsxs)("div", {
          className: "inline-note",
          children: [
            /* @__PURE__ */ (0, l.jsx)("b", { children: String(te.title) }),
            /* @__PURE__ */ (0, l.jsxs)("p", { children: [
              String(te.episode),
              " · ",
              te.records.length,
              " 筆來源資料 · ",
              te.shots.length,
              " 列待製作鏡頭 · ",
              te.sections.length,
              " 個階段盤點"
            ] }),
            /* @__PURE__ */ (0, l.jsx)("button", {
              className: "btn primary",
              disabled: m || r.archived,
              onClick: async () => {
                await N("import_production_data", te) && (ae(null), u(""), v(""), w(""));
              },
              children: "保存製作資料包"
            })
          ]
        }),
        r.production?.imports.map((g) => /* @__PURE__ */ (0, l.jsxs)("p", {
          className: "muted",
          children: [
            "已補入：",
            g.title,
            " · ",
            g.records,
            " 筆資料／",
            g.shots,
            " 列鏡頭"
          ]
        }, g.id))
      ]
    })
  ] });
}
function nx({ shotId: r, selection: m, disabled: N, mutate: f }) {
  const u = [
    ["output", "實際採用檔位置"],
    ["outputVersion", "採用檔版本"],
    ["reason", "選用原因"],
    ["source", "採用依據來源"],
    ["editorVersion", "剪輯工程版本"],
    ["inPoint", "工程入點"],
    ["outPoint", "工程出點"]
  ], [E, v] = (0, S.useState)(() => Object.fromEntries(u.map(([A]) => [A, m?.[A] ?? ""])));
  return /* @__PURE__ */ (0, l.jsxs)("details", {
    className: "selection-editor",
    children: [/* @__PURE__ */ (0, l.jsx)("summary", { children: "登記採用檔與工程位置" }), /* @__PURE__ */ (0, l.jsxs)("form", {
      className: "context-form",
      onSubmit: async (A) => {
        A.preventDefault(), await f("register_shot_selection", {
          ...E,
          shotId: r,
          baseVersion: m?.version ?? 0
        });
      },
      children: [
        u.map(([A, w]) => /* @__PURE__ */ (0, l.jsxs)("label", { children: [w, /* @__PURE__ */ (0, l.jsx)("input", {
          required: [
            "output",
            "outputVersion",
            "reason",
            "source"
          ].includes(A),
          maxLength: A === "reason" ? 3e3 : 2e3,
          value: E[A],
          onChange: (_) => v({
            ...E,
            [A]: _.target.value
          })
        })] }, A)),
        /* @__PURE__ */ (0, l.jsx)("p", {
          className: "muted",
          children: "工程入出點須成對填寫。保存來源與選用版本；素材實際開啟及檢視另行記錄。"
        }),
        /* @__PURE__ */ (0, l.jsx)("button", {
          className: "btn primary",
          disabled: N,
          children: "保存採用紀錄版本"
        })
      ]
    })]
  });
}
function sx({ project: r, busy: m, mutate: N }) {
  const [f, u] = (0, S.useState)(""), [E, v] = (0, S.useState)(""), [A, w] = (0, S.useState)(""), [_, y] = (0, S.useState)(20), Q = [...new Map((r.production?.selections ?? []).map((K) => [K.shotId, K])).values()], C = [...new Map((r.production?.links ?? []).map((K) => [K.shotId, K])).values()], te = vl(r).records, ae = r.shots.filter((K) => [
    K.id,
    K.scene,
    K.description,
    K.legacyIds
  ].join(" ").toLowerCase().includes(f.toLowerCase()));
  return /* @__PURE__ */ (0, l.jsxs)(l.Fragment, { children: [
    /* @__PURE__ */ (0, l.jsx)("div", {
      className: "section-title",
      children: /* @__PURE__ */ (0, l.jsxs)("div", { children: [
        /* @__PURE__ */ (0, l.jsx)("div", {
          className: "eyebrow",
          children: "PRODUCTION LINKS"
        }),
        /* @__PURE__ */ (0, l.jsx)("h2", { children: "每個鏡頭的依據與接續" }),
        /* @__PURE__ */ (0, l.jsx)("p", { children: "串起來源文本、影格定位、動作提示、剪輯對照與音檔。對照候選保留原時間基準，實際採用檔與入片位置分別登記。" })
      ] })
    }),
    /* @__PURE__ */ (0, l.jsxs)("div", {
      className: "production-totals",
      children: [
        /* @__PURE__ */ (0, l.jsxs)("b", { children: [
          C.length,
          " / ",
          r.shots.length,
          " 列已建立關聯"
        ] }),
        /* @__PURE__ */ (0, l.jsxs)("b", { children: [C.filter((K) => K.references.length).length, " 列有影格來源定位"] }),
        /* @__PURE__ */ (0, l.jsxs)("b", { children: [(/* @__PURE__ */ new Set([...Q.map((K) => K.shotId), ...C.filter((K) => K.adoptedOutput).map((K) => K.shotId)])).size, " 列已登記採用檔"] })
      ]
    }),
    /* @__PURE__ */ (0, l.jsxs)("label", {
      className: "work-search",
      children: ["搜尋鏡頭關聯", /* @__PURE__ */ (0, l.jsx)("input", {
        value: f,
        onChange: (K) => {
          u(K.target.value), y(20);
        },
        placeholder: "F077、G11、S06 或鏡頭 ID"
      })]
    }),
    ae.slice(0, _).map((K) => {
      const F = C.find((H) => H.shotId === K.id), le = Q.find((H) => H.shotId === K.id);
      return /* @__PURE__ */ (0, l.jsxs)("details", {
        className: "production-record",
        children: [
          /* @__PURE__ */ (0, l.jsxs)("summary", { children: [/* @__PURE__ */ (0, l.jsxs)("b", { children: [
            K.id,
            " · ",
            K.legacyIds
          ] }), /* @__PURE__ */ (0, l.jsxs)("small", { children: [
            K.scene,
            " · ",
            F ? "關聯已建立" : "來源對應待補"
          ] })] }),
          /* @__PURE__ */ (0, l.jsx)("p", {
            className: "production-source-text",
            children: K.description
          }),
          F ? /* @__PURE__ */ (0, l.jsxs)(l.Fragment, { children: [
            /* @__PURE__ */ (0, l.jsxs)("div", {
              className: "production-gaps",
              children: [
                /* @__PURE__ */ (0, l.jsx)("b", { children: "接著做什麼" }),
                /* @__PURE__ */ (0, l.jsx)("p", { children: le ? "採用檔已登記；接著開啟素材並對照工程版本與入出點。" : F.nextStep }),
                /* @__PURE__ */ (0, l.jsxs)("p", { children: ["採用檔：", le?.output || F.adoptedOutput || "位置尚未登記"] }),
                /* @__PURE__ */ (0, l.jsxs)("p", { children: ["選用原因：", le?.reason || F.selectionReason || "尚未登記"] }),
                F.unknowns.length > 0 && /* @__PURE__ */ (0, l.jsx)("p", {
                  className: "muted",
                  children: "來源盤點時的缺口；新增採用登記另列於下方。"
                }),
                F.unknowns.length > 0 && /* @__PURE__ */ (0, l.jsx)("ul", { children: F.unknowns.map((H, ie) => /* @__PURE__ */ (0, l.jsx)("li", { children: H }, ie)) })
              ]
            }),
            le && /* @__PURE__ */ (0, l.jsxs)("div", {
              className: "context-mini",
              children: [
                /* @__PURE__ */ (0, l.jsxs)("b", { children: [
                  "採用登記 v",
                  le.version,
                  " · ",
                  le.outputVersion
                ] }),
                /* @__PURE__ */ (0, l.jsxs)("p", { children: ["依據：", le.source] }),
                /* @__PURE__ */ (0, l.jsxs)("p", { children: [
                  "工程：",
                  le.editorVersion || "未登記",
                  " · ",
                  le.inPoint || "未登記",
                  " → ",
                  le.outPoint || "未登記"
                ] })
              ]
            }),
            /* @__PURE__ */ (0, l.jsx)("h3", { children: "使用依據與提示詞" }),
            F.recordKeys.map((H) => {
              const ie = te.find((V) => V.key === H);
              return ie ? /* @__PURE__ */ (0, l.jsxs)("details", {
                className: "context-mini",
                children: [
                  /* @__PURE__ */ (0, l.jsx)("summary", { children: ie.title }),
                  /* @__PURE__ */ (0, l.jsxs)("code", { children: [
                    ie.key,
                    " · v",
                    ie.version
                  ] }),
                  /* @__PURE__ */ (0, l.jsx)("div", {
                    className: "production-source-text",
                    children: ie.content
                  }),
                  /* @__PURE__ */ (0, l.jsxs)("p", { children: ["來源：", ie.source] })
                ]
              }, H) : null;
            }),
            /* @__PURE__ */ (0, l.jsx)("h3", { children: "來源影格定位" }),
            F.references.length ? F.references.map((H, ie) => /* @__PURE__ */ (0, l.jsxs)("div", {
              className: "context-mini",
              children: [
                /* @__PURE__ */ (0, l.jsx)("b", { children: H.file }),
                /* @__PURE__ */ (0, l.jsxs)("p", { children: ["素材包：", H.archive] }),
                /* @__PURE__ */ (0, l.jsxs)("p", { children: ["包內位置：", H.member] }),
                /* @__PURE__ */ (0, l.jsxs)("code", {
                  className: "context-id",
                  children: ["SHA-256 ", H.sha256 || "來源未列"]
                }),
                /* @__PURE__ */ (0, l.jsx)("small", { children: "依來源索引定位；實際圖像讀取狀態另記。" })
              ]
            }, ie)) : /* @__PURE__ */ (0, l.jsx)("p", { children: "目前來源未對上此影格。" }),
            /* @__PURE__ */ (0, l.jsx)("h3", { children: "剪輯對照候選" }),
            /* @__PURE__ */ (0, l.jsx)("p", {
              className: "muted",
              children: "以下時間來自指定來源表，尚未指定為本鏡實際入片位置。"
            }),
            F.timelineCandidates.map((H, ie) => /* @__PURE__ */ (0, l.jsxs)("div", {
              className: "context-mini",
              children: [
                /* @__PURE__ */ (0, l.jsxs)("b", { children: [
                  "序號 ",
                  H.sequence,
                  " · ",
                  H.start,
                  " → ",
                  H.end
                ] }),
                /* @__PURE__ */ (0, l.jsx)("p", { children: H.text }),
                /* @__PURE__ */ (0, l.jsx)("small", { children: H.source })
              ]
            }, ie)),
            !F.timelineCandidates.length && /* @__PURE__ */ (0, l.jsx)("p", { children: "尚缺可核實的剪輯對照。" }),
            /* @__PURE__ */ (0, l.jsx)("h3", { children: "台詞與音檔對照候選" }),
            F.voiceCandidates.map((H, ie) => /* @__PURE__ */ (0, l.jsxs)("div", {
              className: "context-mini",
              children: [
                /* @__PURE__ */ (0, l.jsx)("b", { children: H.lineId }),
                /* @__PURE__ */ (0, l.jsx)("p", { children: H.file }),
                /* @__PURE__ */ (0, l.jsxs)("small", { children: [
                  H.start,
                  " → ",
                  H.end,
                  " · ",
                  H.source
                ] })
              ]
            }, ie)),
            !F.voiceCandidates.length && /* @__PURE__ */ (0, l.jsx)("p", { children: "尚未建立明確台詞對應，不依編號猜配。" })
          ] }) : /* @__PURE__ */ (0, l.jsx)("p", { children: "請補來源與實際輸出對應。" }),
          /* @__PURE__ */ (0, l.jsx)(nx, {
            shotId: K.id,
            selection: le,
            disabled: m || r.archived,
            mutate: N
          }, le?.id ?? K.id)
        ]
      }, K.id);
    }),
    ae.length > _ && /* @__PURE__ */ (0, l.jsx)("button", {
      className: "btn",
      onClick: () => y(_ + 20),
      children: "再顯示 20 列"
    }),
    /* @__PURE__ */ (0, l.jsxs)("details", {
      className: "production-import",
      children: [
        /* @__PURE__ */ (0, l.jsx)("summary", { children: "補入鏡頭製作關聯" }),
        /* @__PURE__ */ (0, l.jsx)("p", { children: "貼上包含 bundleId 與 links 清單的 JSON；所有鏡頭與資料識別鍵必須已存在。保留歷次關聯。" }),
        /* @__PURE__ */ (0, l.jsxs)("label", { children: ["鏡頭關聯 JSON", /* @__PURE__ */ (0, l.jsx)("textarea", {
          rows: 5,
          value: E,
          onChange: (K) => {
            v(K.target.value), w("");
          }
        })] }),
        A && /* @__PURE__ */ (0, l.jsx)("p", {
          role: "alert",
          children: A
        }),
        /* @__PURE__ */ (0, l.jsx)("button", {
          className: "btn primary",
          disabled: m || r.archived || !E.trim(),
          onClick: async () => {
            try {
              await N("save_production_links", JSON.parse(E)) && v("");
            } catch (K) {
              w(K instanceof Error ? K.message : "格式錯誤");
            }
          },
          children: "保存鏡頭製作關聯"
        })
      ]
    })
  ] });
}
var ln = {
  reference: "來源候選",
  adopted: "本集採用",
  withdrawn: "停止沿用",
  unresolved: "版本待補登"
}, ff = {
  script: "劇本",
  character: "角色",
  scene: "場景",
  voice: "聲線",
  op_audio: "OP音軌",
  ed_audio: "ED音軌",
  edit: "剪輯工程"
}, _s = (r) => r.split(/[,，\n]/).map((m) => m.trim()).filter(Boolean), hf = {
  key: "",
  title: "",
  content: "",
  source: "",
  note: "",
  stageIdsText: "",
  sceneIdsText: "",
  status: "reference",
  baseVersion: 0
}, mf = {
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
function Cf({ project: r, busy: m, mutate: N }) {
  const [f, u] = (0, S.useState)(!1), [E, v] = (0, S.useState)(!1), [A, w] = (0, S.useState)(hf), [_, y] = (0, S.useState)(mf), [Q, C] = (0, S.useState)(""), [te, ae] = (0, S.useState)(""), [K, F] = (0, S.useState)(""), le = Im(r), H = m || r.archived, ie = Ka(r.episodeRules ?? []), V = Ka(r.baselines ?? []), W = (j) => !Q || [j.key, j.title].join(" ").toLowerCase().includes(Q.toLowerCase());
  function P(j) {
    w({
      ...j,
      stageIdsText: j.stageIds.join(", "),
      sceneIdsText: j.sceneIds.join(", "),
      baseVersion: oi(r.episodeRules ?? []).find((I) => I.key === j.key).version
    }), u(!0);
  }
  function xe(j) {
    y({
      ...j,
      recordKey: j.snapshot?.key ?? "",
      recordVersion: j.recordVersion ?? 1,
      content: j.snapshot?.content ?? "",
      stageIdsText: j.stageIds.join(", "),
      sceneIdsText: j.sceneIds.join(", "),
      baseVersion: oi(r.baselines ?? []).find((I) => I.key === j.key).version
    }), v(!0);
  }
  async function de(j, I) {
    await N("save_episode_rule", {
      ...j,
      status: I,
      baseVersion: le.rules.find((ye) => ye.key === j.key).version
    });
  }
  async function J(j, I) {
    await N("register_episode_baseline", {
      ...j,
      status: I,
      recordKey: j.snapshot?.key ?? "",
      recordVersion: j.recordVersion,
      content: j.snapshot?.content ?? "",
      baseVersion: le.baselines.find((ye) => ye.key === j.key).version
    });
  }
  return /* @__PURE__ */ (0, l.jsxs)("section", {
    className: "episode-settings",
    children: [
      /* @__PURE__ */ (0, l.jsxs)("div", {
        className: "wide-card",
        children: [
          /* @__PURE__ */ (0, l.jsx)("div", {
            className: "eyebrow",
            children: "EPISODE RULES & BASELINES"
          }),
          /* @__PURE__ */ (0, l.jsxs)("h2", { children: [r.episode, " 規則與採用版本"] }),
          /* @__PURE__ */ (0, l.jsx)("p", { children: "通用流程保存製作方法；本集規則保存劇情與素材限制。採用清單指定來源版本，下一集另行選用。" }),
          /* @__PURE__ */ (0, l.jsxs)("div", {
            className: "production-totals",
            children: [
              /* @__PURE__ */ (0, l.jsxs)("b", { children: [ie.length, " 項本集規則已採用"] }),
              /* @__PURE__ */ (0, l.jsxs)("b", { children: [V.length, " 項來源已採用"] }),
              /* @__PURE__ */ (0, l.jsxs)("span", { children: [le.baselines.filter((j) => j.status === "unresolved").length, " 項版本待補登"] })
            ]
          }),
          /* @__PURE__ */ (0, l.jsx)("p", {
            className: "inline-note",
            children: "候選新版本保留原採用版。採用紀錄、來源收錄與素材實際檢視分開保存。"
          }),
          /* @__PURE__ */ (0, l.jsxs)("label", {
            className: "work-search",
            children: ["搜尋規則與採用項目", /* @__PURE__ */ (0, l.jsx)("input", {
              value: Q,
              onChange: (j) => C(j.target.value),
              placeholder: "規則、角色、劇本、聲線或音軌"
            })]
          }),
          /* @__PURE__ */ (0, l.jsxs)("details", { children: [/* @__PURE__ */ (0, l.jsx)("summary", { children: "通用流程檢查項目" }), le.genericChecks.map((j) => /* @__PURE__ */ (0, l.jsxs)("div", {
            className: "context-mini",
            children: [/* @__PURE__ */ (0, l.jsxs)("b", { children: [
              j.id,
              " ",
              j.title
            ] }), /* @__PURE__ */ (0, l.jsx)("ul", { children: j.checks.map((I) => /* @__PURE__ */ (0, l.jsx)("li", { children: I }, I)) })]
          }, j.id))] }),
          r.workflowLegacy && /* @__PURE__ */ (0, l.jsxs)("details", { children: [
            /* @__PURE__ */ (0, l.jsx)("summary", { children: "保留的舊版檢查表紀錄" }),
            /* @__PURE__ */ (0, l.jsx)("p", { children: "舊版單集條件及勾選狀態保留在此；本集實際適用的規則另列於下方。" }),
            r.workflowLegacy.stages.map((j) => /* @__PURE__ */ (0, l.jsxs)("div", {
              className: "context-mini",
              children: [/* @__PURE__ */ (0, l.jsxs)("b", { children: ["舊階段 ", j.stageId] }), j.labels.map((I, ye) => /* @__PURE__ */ (0, l.jsxs)("p", { children: [
                j.checks[ye] ? "已勾選" : "未勾選",
                " · ",
                I
              ] }, ye))]
            }, j.stageId))
          ] })
        ]
      }),
      /* @__PURE__ */ (0, l.jsxs)("div", {
        className: "wide-card",
        children: [
          /* @__PURE__ */ (0, l.jsxs)("div", {
            className: "section-title",
            children: [/* @__PURE__ */ (0, l.jsxs)("div", { children: [/* @__PURE__ */ (0, l.jsx)("h2", { children: "本集專用規則" }), /* @__PURE__ */ (0, l.jsx)("p", { children: "具體內容、來源、適用階段與場次，按版本保存。" })] }), /* @__PURE__ */ (0, l.jsx)("button", {
              className: "btn",
              disabled: H,
              onClick: () => {
                w(hf), u(!f);
              },
              children: "新增本集規則"
            })]
          }),
          f && /* @__PURE__ */ (0, l.jsxs)("form", {
            className: "context-form",
            onSubmit: async (j) => {
              j.preventDefault(), await N("save_episode_rule", {
                ...A,
                stageIds: _s(A.stageIdsText),
                sceneIds: _s(A.sceneIdsText)
              }) && u(!1);
            },
            children: [
              /* @__PURE__ */ (0, l.jsxs)("div", {
                className: "context-form-grid",
                children: [/* @__PURE__ */ (0, l.jsxs)("label", { children: ["規則識別鍵", /* @__PURE__ */ (0, l.jsx)("input", {
                  required: !0,
                  readOnly: !!A.baseVersion,
                  maxLength: 100,
                  value: A.key,
                  onChange: (j) => w({
                    ...A,
                    key: j.target.value
                  })
                })] }), /* @__PURE__ */ (0, l.jsxs)("label", { children: ["規則名稱", /* @__PURE__ */ (0, l.jsx)("input", {
                  required: !0,
                  maxLength: 200,
                  value: A.title,
                  onChange: (j) => w({
                    ...A,
                    title: j.target.value
                  })
                })] })]
              }),
              /* @__PURE__ */ (0, l.jsxs)("label", { children: ["規則內容", /* @__PURE__ */ (0, l.jsx)("textarea", {
                required: !0,
                rows: 4,
                maxLength: 6e3,
                value: A.content,
                onChange: (j) => w({
                  ...A,
                  content: j.target.value
                })
              })] }),
              /* @__PURE__ */ (0, l.jsxs)("label", { children: ["規則來源", /* @__PURE__ */ (0, l.jsx)("input", {
                required: !0,
                maxLength: 2e3,
                value: A.source,
                onChange: (j) => w({
                  ...A,
                  source: j.target.value
                })
              })] }),
              /* @__PURE__ */ (0, l.jsxs)("div", {
                className: "context-form-grid",
                children: [/* @__PURE__ */ (0, l.jsxs)("label", { children: ["規則適用階段", /* @__PURE__ */ (0, l.jsx)("input", {
                  value: A.stageIdsText,
                  placeholder: "逗號分隔；留空為本集共用",
                  onChange: (j) => w({
                    ...A,
                    stageIdsText: j.target.value
                  })
                })] }), /* @__PURE__ */ (0, l.jsxs)("label", { children: ["規則適用場次", /* @__PURE__ */ (0, l.jsx)("input", {
                  value: A.sceneIdsText,
                  placeholder: "逗號分隔；留空為全部場次",
                  onChange: (j) => w({
                    ...A,
                    sceneIdsText: j.target.value
                  })
                })] })]
              }),
              /* @__PURE__ */ (0, l.jsxs)("label", { children: ["規則狀態", /* @__PURE__ */ (0, l.jsx)("select", {
                value: A.status,
                onChange: (j) => w({
                  ...A,
                  status: j.target.value
                }),
                children: Object.entries(ln).map(([j, I]) => /* @__PURE__ */ (0, l.jsx)("option", {
                  value: j,
                  children: I
                }, j))
              })] }),
              /* @__PURE__ */ (0, l.jsxs)("label", { children: ["規則備註", /* @__PURE__ */ (0, l.jsx)("textarea", {
                rows: 2,
                value: A.note,
                onChange: (j) => w({
                  ...A,
                  note: j.target.value
                })
              })] }),
              /* @__PURE__ */ (0, l.jsx)("button", {
                className: "btn primary",
                disabled: H,
                children: "保存本集規則版本"
              })
            ]
          }),
          le.rules.filter(W).map((j) => {
            const I = ie.find((ye) => ye.key === j.key);
            return /* @__PURE__ */ (0, l.jsxs)("details", {
              className: "production-record",
              children: [
                /* @__PURE__ */ (0, l.jsxs)("summary", { children: [/* @__PURE__ */ (0, l.jsx)("b", { children: j.title }), /* @__PURE__ */ (0, l.jsxs)("span", { children: [
                  ln[j.status],
                  " · v",
                  j.version
                ] })] }),
                /* @__PURE__ */ (0, l.jsx)("code", { children: j.key }),
                /* @__PURE__ */ (0, l.jsx)("p", {
                  className: "production-source-text",
                  children: j.content
                }),
                /* @__PURE__ */ (0, l.jsxs)("p", { children: ["來源：", j.source] }),
                /* @__PURE__ */ (0, l.jsxs)("p", { children: [
                  "階段：",
                  j.stageIds.join("、") || "本集共用",
                  " · 場次：",
                  j.sceneIds.join("、") || "全部場次"
                ] }),
                /* @__PURE__ */ (0, l.jsx)("p", { children: j.note }),
                I && I.id !== j.id && /* @__PURE__ */ (0, l.jsxs)("div", {
                  className: "context-mini",
                  children: [
                    /* @__PURE__ */ (0, l.jsxs)("b", { children: ["仍沿用已採用 v", I.version] }),
                    /* @__PURE__ */ (0, l.jsx)("p", { children: I.content }),
                    /* @__PURE__ */ (0, l.jsxs)("small", { children: ["來源：", I.source] })
                  ]
                }),
                /* @__PURE__ */ (0, l.jsxs)("div", {
                  className: "context-actions",
                  children: [
                    /* @__PURE__ */ (0, l.jsx)("button", {
                      className: "btn",
                      disabled: H,
                      onClick: () => P(j),
                      children: "編輯規則新版本"
                    }),
                    j.status === "reference" && /* @__PURE__ */ (0, l.jsx)("button", {
                      className: "btn primary",
                      disabled: H,
                      onClick: () => {
                        de(j, "adopted");
                      },
                      children: "採用此規則"
                    }),
                    I && /* @__PURE__ */ (0, l.jsx)("button", {
                      className: "btn",
                      disabled: H,
                      onClick: () => {
                        de(I, "withdrawn");
                      },
                      children: "停止沿用規則"
                    })
                  ]
                })
              ]
            }, j.id);
          }),
          !le.rules.length && /* @__PURE__ */ (0, l.jsx)("p", { children: "本集尚未登記專用規則；不自動繼承前一集條件。" })
        ]
      }),
      /* @__PURE__ */ (0, l.jsxs)("div", {
        className: "wide-card",
        children: [
          /* @__PURE__ */ (0, l.jsxs)("div", {
            className: "section-title",
            children: [/* @__PURE__ */ (0, l.jsxs)("div", { children: [/* @__PURE__ */ (0, l.jsx)("h2", { children: "本集採用版本清單" }), /* @__PURE__ */ (0, l.jsx)("p", { children: "依角色、場景或音軌使用固定識別鍵；指定來源全文的確切版本，或登記外部來源。" })] }), /* @__PURE__ */ (0, l.jsx)("button", {
              className: "btn",
              disabled: H,
              onClick: () => {
                y(mf), v(!E);
              },
              children: "新增採用項目"
            })]
          }),
          E && /* @__PURE__ */ (0, l.jsxs)("form", {
            className: "context-form",
            onSubmit: async (j) => {
              j.preventDefault(), await N("register_episode_baseline", {
                ..._,
                stageIds: _s(_.stageIdsText),
                sceneIds: _s(_.sceneIdsText)
              }) && v(!1);
            },
            children: [
              /* @__PURE__ */ (0, l.jsxs)("div", {
                className: "context-form-grid",
                children: [
                  /* @__PURE__ */ (0, l.jsxs)("label", { children: ["採用項目識別鍵", /* @__PURE__ */ (0, l.jsx)("input", {
                    required: !0,
                    readOnly: !!_.baseVersion,
                    maxLength: 100,
                    value: _.key,
                    onChange: (j) => y({
                      ..._,
                      key: j.target.value
                    })
                  })] }),
                  /* @__PURE__ */ (0, l.jsxs)("label", { children: ["採用項目名稱", /* @__PURE__ */ (0, l.jsx)("input", {
                    required: !0,
                    maxLength: 200,
                    value: _.title,
                    onChange: (j) => y({
                      ..._,
                      title: j.target.value
                    })
                  })] }),
                  /* @__PURE__ */ (0, l.jsxs)("label", { children: ["採用種類", /* @__PURE__ */ (0, l.jsx)("select", {
                    value: _.category,
                    onChange: (j) => y({
                      ..._,
                      category: j.target.value
                    }),
                    children: Jm.map((j) => /* @__PURE__ */ (0, l.jsx)("option", {
                      value: j,
                      children: ff[j]
                    }, j))
                  })] }),
                  /* @__PURE__ */ (0, l.jsxs)("label", { children: ["採用項目狀態", /* @__PURE__ */ (0, l.jsx)("select", {
                    value: _.status,
                    onChange: (j) => y({
                      ..._,
                      status: j.target.value
                    }),
                    children: Object.entries(ln).map(([j, I]) => /* @__PURE__ */ (0, l.jsx)("option", {
                      value: j,
                      children: I
                    }, j))
                  })] }),
                  /* @__PURE__ */ (0, l.jsxs)("label", { children: ["已有來源識別鍵", /* @__PURE__ */ (0, l.jsx)("input", {
                    value: _.recordKey,
                    maxLength: 120,
                    onChange: (j) => y({
                      ..._,
                      recordKey: j.target.value
                    }),
                    placeholder: "從製作資料取得；外部來源可留空"
                  })] }),
                  /* @__PURE__ */ (0, l.jsxs)("label", { children: ["來源紀錄版本", /* @__PURE__ */ (0, l.jsx)("input", {
                    type: "number",
                    min: 1,
                    value: _.recordVersion,
                    onChange: (j) => y({
                      ..._,
                      recordVersion: Number(j.target.value)
                    })
                  })] })
                ]
              }),
              !_.recordKey && /* @__PURE__ */ (0, l.jsxs)("label", { children: ["外部來源內容", /* @__PURE__ */ (0, l.jsx)("textarea", {
                rows: 4,
                required: _.status === "reference" || _.status === "adopted",
                value: _.content,
                maxLength: 12e3,
                onChange: (j) => y({
                  ..._,
                  content: j.target.value
                })
              })] }),
              /* @__PURE__ */ (0, l.jsxs)("label", { children: ["採用依據來源", /* @__PURE__ */ (0, l.jsx)("input", {
                required: !0,
                maxLength: 2e3,
                value: _.source,
                onChange: (j) => y({
                  ..._,
                  source: j.target.value
                })
              })] }),
              /* @__PURE__ */ (0, l.jsxs)("div", {
                className: "context-form-grid",
                children: [
                  /* @__PURE__ */ (0, l.jsxs)("label", { children: ["外部檔案版本", /* @__PURE__ */ (0, l.jsx)("input", {
                    value: _.externalVersion,
                    maxLength: 200,
                    onChange: (j) => y({
                      ..._,
                      externalVersion: j.target.value
                    })
                  })] }),
                  /* @__PURE__ */ (0, l.jsxs)("label", { children: ["來源檔案位置", /* @__PURE__ */ (0, l.jsx)("input", {
                    value: _.location,
                    maxLength: 2e3,
                    onChange: (j) => y({
                      ..._,
                      location: j.target.value
                    })
                  })] }),
                  /* @__PURE__ */ (0, l.jsxs)("label", { children: ["採用適用階段", /* @__PURE__ */ (0, l.jsx)("input", {
                    value: _.stageIdsText,
                    placeholder: "OP／ED自動限制於各自支線",
                    onChange: (j) => y({
                      ..._,
                      stageIdsText: j.target.value
                    })
                  })] }),
                  /* @__PURE__ */ (0, l.jsxs)("label", { children: ["採用適用場次", /* @__PURE__ */ (0, l.jsx)("input", {
                    value: _.sceneIdsText,
                    onChange: (j) => y({
                      ..._,
                      sceneIdsText: j.target.value
                    })
                  })] })
                ]
              }),
              /* @__PURE__ */ (0, l.jsxs)("label", { children: ["選用原因或待補說明", /* @__PURE__ */ (0, l.jsx)("textarea", {
                required: _.status === "unresolved",
                rows: 3,
                maxLength: 3e3,
                value: _.note,
                onChange: (j) => y({
                  ..._,
                  note: j.target.value
                })
              })] }),
              /* @__PURE__ */ (0, l.jsx)("button", {
                className: "btn primary",
                disabled: H,
                children: "保存採用項目版本"
              })
            ]
          }),
          le.baselines.filter(W).map((j) => {
            const I = V.find((ye) => ye.key === j.key);
            return /* @__PURE__ */ (0, l.jsxs)("details", {
              className: "production-record",
              children: [
                /* @__PURE__ */ (0, l.jsxs)("summary", { children: [/* @__PURE__ */ (0, l.jsxs)("b", { children: [
                  ff[j.category],
                  "｜",
                  j.title
                ] }), /* @__PURE__ */ (0, l.jsxs)("span", { children: [
                  ln[j.status],
                  " · v",
                  j.version
                ] })] }),
                /* @__PURE__ */ (0, l.jsx)("code", { children: j.key }),
                /* @__PURE__ */ (0, l.jsx)("p", { children: j.note }),
                /* @__PURE__ */ (0, l.jsxs)("p", { children: ["來源：", j.source] }),
                /* @__PURE__ */ (0, l.jsxs)("p", { children: [
                  "來源版本：",
                  j.snapshot ? `${j.snapshot.key} · v${j.recordVersion}` : "尚未指定",
                  j.externalVersion ? " · " + j.externalVersion : ""
                ] }),
                /* @__PURE__ */ (0, l.jsxs)("p", { children: ["檔案位置：", j.location || "待補登可讀取位置"] }),
                /* @__PURE__ */ (0, l.jsxs)("p", { children: [
                  "階段：",
                  j.stageIds.join("、") || "本集共用",
                  " · 場次：",
                  j.sceneIds.join("、") || "全部場次"
                ] }),
                j.snapshot && /* @__PURE__ */ (0, l.jsxs)("details", { children: [/* @__PURE__ */ (0, l.jsx)("summary", { children: "查看此來源版本全文" }), /* @__PURE__ */ (0, l.jsx)("p", {
                  className: "production-source-text",
                  children: j.snapshot.content
                })] }),
                I && I.id !== j.id && /* @__PURE__ */ (0, l.jsxs)("div", {
                  className: "context-mini",
                  children: [/* @__PURE__ */ (0, l.jsxs)("b", { children: [
                    "仍沿用已採用 v",
                    I.version,
                    "：",
                    I.title
                  ] }), /* @__PURE__ */ (0, l.jsxs)("p", { children: [
                    I.externalVersion || I.snapshot?.key,
                    " · ",
                    I.source
                  ] })]
                }),
                /* @__PURE__ */ (0, l.jsxs)("div", {
                  className: "context-actions",
                  children: [
                    /* @__PURE__ */ (0, l.jsx)("button", {
                      className: "btn",
                      disabled: H,
                      onClick: () => xe(j),
                      children: "編輯採用項目新版本"
                    }),
                    j.status === "reference" && j.snapshot && /* @__PURE__ */ (0, l.jsx)("button", {
                      className: "btn primary",
                      disabled: H,
                      onClick: () => {
                        J(j, "adopted");
                      },
                      children: "採用此來源版本"
                    }),
                    I && /* @__PURE__ */ (0, l.jsx)("button", {
                      className: "btn",
                      disabled: H,
                      onClick: () => {
                        J(I, "withdrawn");
                      },
                      children: "停止沿用此項目"
                    })
                  ]
                })
              ]
            }, j.id);
          }),
          !le.baselines.length && /* @__PURE__ */ (0, l.jsx)("p", { children: "尚未指定本集採用版本。共用來源可按需連結後再選用。" }),
          /* @__PURE__ */ (0, l.jsxs)("details", {
            className: "production-import",
            children: [
              /* @__PURE__ */ (0, l.jsx)("summary", { children: "批次補登本集設定" }),
              /* @__PURE__ */ (0, l.jsx)("p", { children: "包含 rules 與 baselines 清單；保留版本及來源，採用與候選分開。" }),
              /* @__PURE__ */ (0, l.jsxs)("label", { children: ["本集設定 JSON", /* @__PURE__ */ (0, l.jsx)("textarea", {
                rows: 5,
                value: te,
                onChange: (j) => {
                  ae(j.target.value), F("");
                }
              })] }),
              K && /* @__PURE__ */ (0, l.jsx)("p", {
                role: "alert",
                children: K
              }),
              /* @__PURE__ */ (0, l.jsx)("button", {
                className: "btn primary",
                disabled: H || !te.trim(),
                onClick: async () => {
                  try {
                    await N("import_episode_settings", JSON.parse(te)) && ae("");
                  } catch (j) {
                    F(j instanceof Error ? j.message : "格式錯誤");
                  }
                },
                children: "保存本集設定清單"
              })
            ]
          }),
          /* @__PURE__ */ (0, l.jsxs)("details", { children: [/* @__PURE__ */ (0, l.jsx)("summary", { children: "設定歷史版本" }), [...r.episodeRules ?? [], ...r.baselines ?? []].map((j) => /* @__PURE__ */ (0, l.jsxs)("p", { children: [
            j.key,
            " v",
            j.version,
            " · ",
            ln[j.status],
            " · ",
            j.at,
            " · ",
            j.by
          ] }, j.id))] })
        ]
      })
    ]
  });
}
var Wr = {
  rule: "規則／決策",
  script: "劇本",
  character: "角色",
  scene: "場景",
  audio: "聲音／音軌",
  reference: "原作／參考素材"
}, xf = {
  original: "原文明示",
  adaptation: "動畫改編",
  author_decision: "作者決定",
  ai_proposal: "AI 建議"
}, ro = {
  project: "本集共用",
  stage: "指定階段",
  scene: "指定場次",
  shot: "指定鏡頭"
}, Fr = (r) => ro[r.type] + (r.target ? " · " + r.target : ""), Pr = {
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
function cx(r, m) {
  const N = URL.createObjectURL(new Blob([JSON.stringify(m, null, 2)], { type: "application/json" })), f = document.createElement("a");
  f.href = N, f.download = r, f.click(), setTimeout(() => URL.revokeObjectURL(N), 1e3);
}
function rx({ project: r, mutate: m, busy: N }) {
  const f = vl(r), [u, E] = (0, S.useState)("materials"), [v, A] = (0, S.useState)(!1), [w, _] = (0, S.useState)(Pr), [y, Q] = (0, S.useState)(!1), [C, te] = (0, S.useState)({
    type: "conflict",
    scopeType: "project",
    target: "",
    description: ""
  }), [ae, K] = (0, S.useState)("production"), [F, le] = (0, S.useState)(""), [H, ie] = (0, S.useState)(""), [V, W] = (0, S.useState)(""), [P, xe] = (0, S.useState)(""), [de, J] = (0, S.useState)(""), [j, I] = (0, S.useState)(""), [ye, fe] = (0, S.useState)(""), [g, ee] = (0, S.useState)(""), [Z, B] = (0, S.useState)(""), [X, oe] = (0, S.useState)(""), [ne, Ne] = (0, S.useState)(""), [p, D] = (0, S.useState)(""), [G, $] = (0, S.useState)(""), [pe, he] = (0, S.useState)({}), re = f.packs.find((o) => o.id === g) ?? f.packs.at(-1), Re = f.records.filter((o) => o.status === "effective"), _e = f.records.filter((o) => o.status === "proposed" && !nn(o)), ft = f.problems.filter((o) => o.status === "open"), Ie = [
    [
      "materials",
      "製作資料",
      f.records.length
    ],
    [
      "links",
      "製作關聯",
      new Set((r.production?.links ?? []).map((o) => o.shotId)).size
    ],
    [
      "settings",
      "本集採用",
      Ka(r.baselines ?? []).length
    ],
    [
      "baseline",
      "直接核定來源",
      Re.length
    ],
    [
      "proposals",
      "待確認提案",
      _e.length
    ],
    [
      "problems",
      "矛盾與缺件",
      ft.length
    ],
    [
      "packet",
      "工作資料包",
      f.packs.length
    ],
    [
      "handoff",
      "工作接續",
      f.results.length
    ]
  ], Oe = N || r.archived;
  async function je(o) {
    o.preventDefault(), await m("propose_record", {
      ...w,
      scope: {
        type: w.scopeType,
        target: w.target
      }
    }) && (A(!1), _(Pr), E("proposals"));
  }
  function Ze(o) {
    const R = f.records.find((se) => se.id === o);
    _({
      key: R.key,
      title: R.title,
      kind: R.kind,
      origin: "author_decision",
      content: R.content,
      source: "",
      location: R.location,
      scopeType: R.scope.type,
      target: R.scope.target,
      supersedesId: R.id
    }), A(!0);
  }
  function rt(o) {
    return /* @__PURE__ */ (0, l.jsxs)(l.Fragment, { children: [
      /* @__PURE__ */ (0, l.jsxs)("div", {
        className: "context-pack-head",
        children: [
          /* @__PURE__ */ (0, l.jsx)("span", {
            className: "status " + (o.readiness === "ready" ? "passed" : "needs_revision"),
            children: o.readiness === "ready" ? o.purpose === "documentation" ? "可整理資料 · 保留來源差異" : "紀錄齊備 · 素材待實際讀取" : "受阻 · 先處理缺件與矛盾"
          }),
          /* @__PURE__ */ (0, l.jsx)("span", {
            className: "status " + (o.projectRevision === r.revision ? "passed" : "needs_revision"),
            children: o.projectRevision === r.revision ? "目前版本" : "已過期，需重新取得"
          }),
          /* @__PURE__ */ (0, l.jsx)("button", {
            className: "btn",
            onClick: () => cx("AI_工作資料包_" + o.id + ".json", o),
            children: "下載資料包 JSON"
          })
        ]
      }),
      /* @__PURE__ */ (0, l.jsx)("p", {
        className: "context-task",
        children: o.task
      }),
      /* @__PURE__ */ (0, l.jsxs)("p", {
        className: "muted",
        children: [
          "範圍：",
          [
            o.episode,
            o.scope.stageId,
            o.scope.sceneId,
            o.scope.shotId
          ].filter(Boolean).join(" ／ "),
          " · 專案版本 ",
          o.projectRevision
        ]
      }),
      /* @__PURE__ */ (0, l.jsx)("code", {
        className: "context-id",
        children: o.id
      }),
      o.blockers.length > 0 && /* @__PURE__ */ (0, l.jsx)("div", {
        className: "context-blockers",
        children: o.blockers.map((R, se) => /* @__PURE__ */ (0, l.jsx)("p", { children: R.replace(/缺少有效資料種類：(\w+)/g, (qe, k) => "缺少有效資料種類：" + (Wr[k] || k)) }, se))
      }),
      /* @__PURE__ */ (0, l.jsx)("h3", { children: o.purpose === "documentation" ? "本次指定來源（整理用途）" : "本次有效依據" }),
      o.records.length ? o.records.map((R) => /* @__PURE__ */ (0, l.jsxs)("article", {
        className: "context-mini",
        children: [
          /* @__PURE__ */ (0, l.jsxs)("b", { children: [
            R.title,
            " · v",
            R.version
          ] }),
          /* @__PURE__ */ (0, l.jsxs)("small", { children: [
            R.key,
            " · ",
            Fr(R.scope)
          ] }),
          /* @__PURE__ */ (0, l.jsx)("p", { children: R.content }),
          /* @__PURE__ */ (0, l.jsxs)("small", { children: ["來源：", R.source] }),
          /* @__PURE__ */ (0, l.jsxs)("small", { children: ["素材位置：", R.location || "內容已記錄；未登記外部檔案"] })
        ]
      }, R.id)) : /* @__PURE__ */ (0, l.jsx)("p", {
        className: "muted",
        children: "尚無有效資料，AI 應回報受阻。"
      }),
      /* @__PURE__ */ (0, l.jsxs)("details", { children: [/* @__PURE__ */ (0, l.jsxs)("summary", { children: [
        "禁止混用的版本／待確認提案（",
        o.excluded.length,
        "）"
      ] }), o.excluded.map((R) => /* @__PURE__ */ (0, l.jsxs)("p", { children: [
        R.title,
        " · ",
        R.status,
        " · ",
        R.id
      ] }, R.id))] }),
      /* @__PURE__ */ (0, l.jsxs)("details", { children: [/* @__PURE__ */ (0, l.jsx)("summary", { children: "完整資料契約與素材清單" }), /* @__PURE__ */ (0, l.jsx)("pre", { children: JSON.stringify({
        contract: o.contract,
        manifest: o.manifest,
        adoptedBaselines: o.adoptedBaselines,
        episodeRules: o.episodeRules,
        priorHandoff: o.priorHandoff
      }, null, 2) })] })
    ] });
  }
  return /* @__PURE__ */ (0, l.jsxs)("section", {
    className: "ai-workspace",
    children: [
      /* @__PURE__ */ (0, l.jsx)("nav", {
        className: "section-nav",
        "aria-label": "資料與交接",
        children: Ie.filter(([o]) => [
          "materials",
          "links",
          "handoff",
          "problems"
        ].includes(o)).map(([o, R, se]) => /* @__PURE__ */ (0, l.jsxs)("button", {
          className: u === o ? "active" : "",
          onClick: () => E(o),
          children: [
            {
              materials: "製作資料",
              links: "鏡頭對應",
              handoff: "工作紀錄",
              problems: "缺件與疑問"
            }[o],
            " ",
            /* @__PURE__ */ (0, l.jsx)("span", { children: se })
          ]
        }, o))
      }),
      /* @__PURE__ */ (0, l.jsxs)("details", {
        className: "advanced-tools",
        children: [
          /* @__PURE__ */ (0, l.jsx)("summary", { children: "進階：採用設定、資料提案與 AI 工作資料包" }),
          /* @__PURE__ */ (0, l.jsx)("div", {
            className: "context-tabs",
            children: Ie.filter(([o]) => ![
              "materials",
              "links",
              "handoff",
              "problems"
            ].includes(o)).map(([o, R, se]) => /* @__PURE__ */ (0, l.jsxs)("button", {
              className: u === o ? "active" : "",
              onClick: () => E(o),
              children: [
                R,
                " · ",
                se
              ]
            }, o))
          }),
          /* @__PURE__ */ (0, l.jsx)("p", { children: "AI 接手時會讀取指定版本；一般查資料不需要手動建立資料包。" })
        ]
      }),
      /* @__PURE__ */ (0, l.jsx)("div", {
        className: u === "settings" ? "" : "wide-card",
        children: u === "settings" ? /* @__PURE__ */ (0, l.jsx)(Cf, {
          project: r,
          busy: N,
          mutate: m
        }) : u === "links" ? /* @__PURE__ */ (0, l.jsx)(sx, {
          project: r,
          busy: N,
          mutate: m
        }) : u === "materials" ? /* @__PURE__ */ (0, l.jsx)(ix, {
          project: r,
          busy: N,
          mutate: m
        }) : ["baseline", "proposals"].includes(u) ? /* @__PURE__ */ (0, l.jsxs)(l.Fragment, { children: [
          /* @__PURE__ */ (0, l.jsxs)("div", {
            className: "section-title",
            children: [/* @__PURE__ */ (0, l.jsxs)("div", { children: [/* @__PURE__ */ (0, l.jsx)("h2", { children: u === "baseline" ? "目前有效資料" : "待作者確認的提案" }), /* @__PURE__ */ (0, l.jsx)("p", { children: "識別鍵固定，修改建立新版本；來源與適用範圍必填。" })] }), /* @__PURE__ */ (0, l.jsx)("button", {
              className: "btn primary",
              disabled: Oe,
              onClick: () => {
                _(Pr), A(!v);
              },
              children: "新增資料提案"
            })]
          }),
          v && /* @__PURE__ */ (0, l.jsxs)("form", {
            className: "context-form",
            onSubmit: je,
            children: [
              /* @__PURE__ */ (0, l.jsxs)("div", {
                className: "context-form-grid",
                children: [
                  /* @__PURE__ */ (0, l.jsxs)("label", { children: ["固定識別鍵", /* @__PURE__ */ (0, l.jsx)("input", {
                    required: !0,
                    maxLength: 120,
                    placeholder: "例如 mother_position 或 script_main",
                    value: w.key,
                    readOnly: !!w.supersedesId,
                    onChange: (o) => _({
                      ...w,
                      key: o.target.value
                    })
                  })] }),
                  /* @__PURE__ */ (0, l.jsxs)("label", { children: ["資料名稱", /* @__PURE__ */ (0, l.jsx)("input", {
                    required: !0,
                    maxLength: 200,
                    value: w.title,
                    onChange: (o) => _({
                      ...w,
                      title: o.target.value
                    })
                  })] }),
                  /* @__PURE__ */ (0, l.jsxs)("label", { children: ["資料種類", /* @__PURE__ */ (0, l.jsx)("select", {
                    value: w.kind,
                    onChange: (o) => _({
                      ...w,
                      kind: o.target.value
                    }),
                    children: Wm.map((o) => /* @__PURE__ */ (0, l.jsx)("option", {
                      value: o,
                      children: Wr[o]
                    }, o))
                  })] }),
                  /* @__PURE__ */ (0, l.jsxs)("label", { children: ["內容性質", /* @__PURE__ */ (0, l.jsx)("select", {
                    value: w.origin,
                    onChange: (o) => _({
                      ...w,
                      origin: o.target.value
                    }),
                    children: Object.entries(xf).map(([o, R]) => /* @__PURE__ */ (0, l.jsx)("option", {
                      value: o,
                      children: R
                    }, o))
                  })] }),
                  /* @__PURE__ */ (0, l.jsxs)("label", { children: ["適用範圍", /* @__PURE__ */ (0, l.jsx)("select", {
                    value: w.scopeType,
                    disabled: !!w.supersedesId,
                    onChange: (o) => _({
                      ...w,
                      scopeType: o.target.value,
                      target: ""
                    }),
                    children: Object.entries(ro).map(([o, R]) => /* @__PURE__ */ (0, l.jsx)("option", {
                      value: o,
                      children: R
                    }, o))
                  })] }),
                  /* @__PURE__ */ (0, l.jsxs)("label", { children: ["範圍 ID", /* @__PURE__ */ (0, l.jsx)("input", {
                    required: w.scopeType !== "project",
                    disabled: w.scopeType === "project" || !!w.supersedesId,
                    placeholder: "例如 S06、01 或鏡頭 ID",
                    value: w.target,
                    onChange: (o) => _({
                      ...w,
                      target: o.target.value
                    })
                  })] })
                ]
              }),
              /* @__PURE__ */ (0, l.jsxs)("label", { children: ["內容", /* @__PURE__ */ (0, l.jsx)("textarea", {
                required: !0,
                rows: 5,
                maxLength: 12e3,
                value: w.content,
                onChange: (o) => _({
                  ...w,
                  content: o.target.value
                })
              })] }),
              /* @__PURE__ */ (0, l.jsxs)("label", { children: ["來源依據", /* @__PURE__ */ (0, l.jsx)("input", {
                required: !0,
                maxLength: 2e3,
                placeholder: "原作章節、作者修改要求、檔案名稱與段落等",
                value: w.source,
                onChange: (o) => _({
                  ...w,
                  source: o.target.value
                })
              })] }),
              /* @__PURE__ */ (0, l.jsxs)("label", { children: ["素材位置（選填）", /* @__PURE__ */ (0, l.jsx)("input", {
                maxLength: 2e3,
                placeholder: "可取得的檔案位置或連結；填入不等於已讀取",
                value: w.location,
                onChange: (o) => _({
                  ...w,
                  location: o.target.value
                })
              })] }),
              w.supersedesId && /* @__PURE__ */ (0, l.jsxs)("p", {
                className: "muted",
                children: [
                  "明確取代：",
                  w.supersedesId,
                  "。作者確認前，舊版仍然有效。"
                ]
              }),
              /* @__PURE__ */ (0, l.jsxs)("div", {
                className: "context-actions",
                children: [/* @__PURE__ */ (0, l.jsx)("button", {
                  className: "btn",
                  type: "button",
                  onClick: () => A(!1),
                  children: "取消"
                }), /* @__PURE__ */ (0, l.jsx)("button", {
                  className: "btn primary",
                  disabled: Oe,
                  children: "保存為待確認提案"
                })]
              })
            ]
          }),
          /* @__PURE__ */ (0, l.jsx)("div", {
            className: "context-records",
            children: (u === "baseline" ? Re : _e).map((o) => /* @__PURE__ */ (0, l.jsxs)("article", {
              className: "context-record",
              children: [
                /* @__PURE__ */ (0, l.jsxs)("div", {
                  className: "issue-top",
                  children: [/* @__PURE__ */ (0, l.jsx)("span", {
                    className: "status " + (o.status === "effective" ? "passed" : "candidate"),
                    children: o.status === "effective" ? "作者已確認" : "待確認"
                  }), /* @__PURE__ */ (0, l.jsxs)("b", { children: [
                    o.title,
                    " · v",
                    o.version
                  ] })]
                }),
                /* @__PURE__ */ (0, l.jsxs)("small", { children: [
                  Wr[o.kind],
                  " ／ ",
                  xf[o.origin],
                  " ／ ",
                  Fr(o.scope)
                ] }),
                /* @__PURE__ */ (0, l.jsxs)("code", {
                  className: "context-id",
                  children: [
                    o.key,
                    " · ",
                    o.id
                  ]
                }),
                /* @__PURE__ */ (0, l.jsx)("p", { children: o.content }),
                /* @__PURE__ */ (0, l.jsxs)("div", {
                  className: "context-source",
                  children: [
                    "來源：",
                    o.source,
                    o.location && /* @__PURE__ */ (0, l.jsxs)("p", { children: ["素材位置：", o.location] })
                  ]
                }),
                o.supersedesId && /* @__PURE__ */ (0, l.jsxs)("small", { children: ["取代目標：", o.supersedesId] }),
                o.approval && /* @__PURE__ */ (0, l.jsxs)("small", { children: ["確認者：", o.approval.by] }),
                /* @__PURE__ */ (0, l.jsx)("div", {
                  className: "context-actions",
                  children: o.status === "proposed" ? /* @__PURE__ */ (0, l.jsx)("button", {
                    className: "btn primary",
                    disabled: Oe,
                    onClick: () => {
                      m("activate_record", { recordId: o.id });
                    },
                    children: "作者確認為有效資料"
                  }) : /* @__PURE__ */ (0, l.jsx)("button", {
                    className: "btn",
                    disabled: Oe,
                    onClick: () => Ze(o.id),
                    children: "提出修改版本"
                  })
                })
              ]
            }, o.id))
          }),
          !(u === "baseline" ? Re : _e).length && !v && /* @__PURE__ */ (0, l.jsxs)("div", {
            className: "empty",
            children: [/* @__PURE__ */ (0, l.jsx)("h3", { children: u === "baseline" ? "尚無有效資料" : "目前沒有待確認提案" }), /* @__PURE__ */ (0, l.jsx)("p", { children: "先登記來源、內容與範圍，再由作者確認。" })]
          }),
          /* @__PURE__ */ (0, l.jsxs)("details", { children: [/* @__PURE__ */ (0, l.jsxs)("summary", { children: [
            "已被取代的歷史版本（",
            f.records.filter((o) => o.status === "superseded").length,
            "）"
          ] }), f.records.filter((o) => o.status === "superseded").map((o) => /* @__PURE__ */ (0, l.jsxs)("article", {
            className: "context-mini",
            children: [
              /* @__PURE__ */ (0, l.jsxs)("b", { children: [
                o.title,
                " v",
                o.version,
                " · 已停用"
              ] }),
              /* @__PURE__ */ (0, l.jsx)("p", { children: o.content }),
              /* @__PURE__ */ (0, l.jsxs)("small", { children: [
                o.id,
                " → ",
                o.supersededBy
              ] })
            ]
          }, o.id))] })
        ] }) : u === "problems" ? /* @__PURE__ */ (0, l.jsxs)(l.Fragment, { children: [
          /* @__PURE__ */ (0, l.jsxs)("div", {
            className: "section-title",
            children: [/* @__PURE__ */ (0, l.jsxs)("div", { children: [/* @__PURE__ */ (0, l.jsx)("h2", { children: "矛盾、缺件與待裁定事項" }), /* @__PURE__ */ (0, l.jsx)("p", { children: "相關任務在問題處理前回報受阻，AI 不自行裁定。" })] }), /* @__PURE__ */ (0, l.jsx)("button", {
              className: "btn",
              disabled: Oe,
              onClick: () => Q(!y),
              children: "登記矛盾或缺件"
            })]
          }),
          y && /* @__PURE__ */ (0, l.jsxs)("form", {
            className: "context-form",
            onSubmit: async (o) => {
              o.preventDefault(), await m("add_knowledge_problem", {
                type: C.type,
                scope: {
                  type: C.scopeType,
                  target: C.target
                },
                description: C.description,
                recordIds: []
              }) && (Q(!1), te({
                ...C,
                description: ""
              }));
            },
            children: [
              /* @__PURE__ */ (0, l.jsxs)("div", {
                className: "context-form-grid",
                children: [
                  /* @__PURE__ */ (0, l.jsxs)("label", { children: ["問題種類", /* @__PURE__ */ (0, l.jsxs)("select", {
                    value: C.type,
                    onChange: (o) => te({
                      ...C,
                      type: o.target.value
                    }),
                    children: [/* @__PURE__ */ (0, l.jsx)("option", {
                      value: "conflict",
                      children: "資訊矛盾"
                    }), /* @__PURE__ */ (0, l.jsx)("option", {
                      value: "missing",
                      children: "資料缺件"
                    })]
                  })] }),
                  /* @__PURE__ */ (0, l.jsxs)("label", { children: ["範圍", /* @__PURE__ */ (0, l.jsx)("select", {
                    value: C.scopeType,
                    onChange: (o) => te({
                      ...C,
                      scopeType: o.target.value,
                      target: ""
                    }),
                    children: Object.entries(ro).map(([o, R]) => /* @__PURE__ */ (0, l.jsx)("option", {
                      value: o,
                      children: R
                    }, o))
                  })] }),
                  /* @__PURE__ */ (0, l.jsxs)("label", { children: ["範圍 ID", /* @__PURE__ */ (0, l.jsx)("input", {
                    required: C.scopeType !== "project",
                    disabled: C.scopeType === "project",
                    value: C.target,
                    onChange: (o) => te({
                      ...C,
                      target: o.target.value
                    })
                  })] })
                ]
              }),
              /* @__PURE__ */ (0, l.jsxs)("label", { children: ["問題與缺少的依據", /* @__PURE__ */ (0, l.jsx)("textarea", {
                required: !0,
                rows: 4,
                value: C.description,
                onChange: (o) => te({
                  ...C,
                  description: o.target.value
                })
              })] }),
              /* @__PURE__ */ (0, l.jsx)("button", {
                className: "btn primary",
                disabled: Oe,
                children: "保存待處理問題"
              })
            ]
          }),
          f.problems.map((o) => /* @__PURE__ */ (0, l.jsxs)("article", {
            className: "context-record",
            children: [
              /* @__PURE__ */ (0, l.jsxs)("div", {
                className: "issue-top",
                children: [/* @__PURE__ */ (0, l.jsxs)("span", {
                  className: "status " + (o.status === "open" ? "needs_revision" : "passed"),
                  children: [
                    o.type === "conflict" ? "資訊矛盾" : "資料缺件",
                    " · ",
                    o.status === "open" ? "待處理" : "作者已處理"
                  ]
                }), /* @__PURE__ */ (0, l.jsx)("small", { children: Fr(o.scope) })]
              }),
              /* @__PURE__ */ (0, l.jsx)("p", { children: o.description }),
              o.resolution && /* @__PURE__ */ (0, l.jsxs)("p", { children: ["處理結果：", o.resolution] }),
              o.status === "open" && (j === o.id ? /* @__PURE__ */ (0, l.jsxs)("form", {
                onSubmit: async (R) => {
                  R.preventDefault(), await m("resolve_knowledge_problem", {
                    problemId: o.id,
                    resolution: ye
                  }) && (I(""), fe(""));
                },
                children: [
                  /* @__PURE__ */ (0, l.jsxs)("label", {
                    className: "form-field",
                    children: ["作者裁定／補件結果", /* @__PURE__ */ (0, l.jsx)("textarea", {
                      required: !0,
                      rows: 3,
                      value: ye,
                      onChange: (R) => fe(R.target.value)
                    })]
                  }),
                  /* @__PURE__ */ (0, l.jsx)("p", {
                    className: "muted",
                    children: "若涉及設定變更，請另外確認新資料版本；問題結案不會自動修改有效資料。"
                  }),
                  /* @__PURE__ */ (0, l.jsx)("button", {
                    className: "btn primary",
                    disabled: Oe,
                    children: "作者確認處理完成"
                  })
                ]
              }) : /* @__PURE__ */ (0, l.jsx)("button", {
                className: "btn",
                disabled: Oe,
                onClick: () => {
                  I(o.id), fe("");
                },
                children: "填寫作者處理結果"
              }))
            ]
          }, o.id)),
          !f.problems.length && /* @__PURE__ */ (0, l.jsx)("p", {
            className: "muted",
            children: "目前沒有登記矛盾或缺件。資料包仍會檢查必要資料種類。"
          })
        ] }) : u === "packet" ? /* @__PURE__ */ (0, l.jsxs)(l.Fragment, { children: [
          /* @__PURE__ */ (0, l.jsx)("div", {
            className: "section-title",
            children: /* @__PURE__ */ (0, l.jsxs)("div", { children: [/* @__PURE__ */ (0, l.jsx)("h2", { children: "指定任務的工作資料包" }), /* @__PURE__ */ (0, l.jsx)("p", { children: "保存當下版本；任何更新後均需重新取得，避免沿用舊依據。" })] })
          }),
          /* @__PURE__ */ (0, l.jsxs)("form", {
            className: "context-form",
            onSubmit: async (o) => {
              o.preventDefault();
              const R = await m("create_context_pack", {
                task: H,
                stageId: V,
                sceneId: P,
                shotId: de,
                purpose: ae,
                recordKeys: ae === "documentation" ? F.split(/[,，\n]/).map((se) => se.trim()).filter(Boolean) : void 0
              });
              R && ee(vl(R).packs.at(-1).id);
            },
            children: [
              /* @__PURE__ */ (0, l.jsxs)("label", { children: ["工作用途", /* @__PURE__ */ (0, l.jsxs)("select", {
                value: ae,
                onChange: (o) => K(o.target.value),
                children: [/* @__PURE__ */ (0, l.jsx)("option", {
                  value: "production",
                  children: "素材製作／檢視"
                }), /* @__PURE__ */ (0, l.jsx)("option", {
                  value: "documentation",
                  children: "資料整理／補登"
                })]
              })] }),
              ae === "documentation" && /* @__PURE__ */ (0, l.jsxs)("label", { children: ["本次來源識別鍵", /* @__PURE__ */ (0, l.jsx)("textarea", {
                required: !0,
                rows: 2,
                value: F,
                onChange: (o) => le(o.target.value),
                placeholder: "以逗號分隔，最多20筆；可從製作資料或鏡頭關聯取得"
              })] }),
              /* @__PURE__ */ (0, l.jsxs)("label", { children: ["本次任務", /* @__PURE__ */ (0, l.jsx)("textarea", {
                required: !0,
                rows: 2,
                maxLength: 2e3,
                placeholder: "例如：檢查 S06 指定鏡頭的母親座位與場景一致性",
                value: H,
                onChange: (o) => ie(o.target.value)
              })] }),
              /* @__PURE__ */ (0, l.jsxs)("div", {
                className: "context-form-grid",
                children: [
                  /* @__PURE__ */ (0, l.jsxs)("label", { children: ["階段 ID（選填）", /* @__PURE__ */ (0, l.jsx)("input", {
                    placeholder: "例如 08、op01",
                    value: V,
                    onChange: (o) => W(o.target.value)
                  })] }),
                  /* @__PURE__ */ (0, l.jsxs)("label", { children: ["場次 ID（選填）", /* @__PURE__ */ (0, l.jsx)("input", {
                    placeholder: "例如 S06",
                    value: P,
                    onChange: (o) => xe(o.target.value)
                  })] }),
                  /* @__PURE__ */ (0, l.jsxs)("label", { children: ["鏡頭 ID（選填）", /* @__PURE__ */ (0, l.jsx)("input", {
                    placeholder: "素材總表的固定鏡頭 ID",
                    value: de,
                    onChange: (o) => J(o.target.value)
                  })] })
                ]
              }),
              /* @__PURE__ */ (0, l.jsx)("button", {
                className: "btn primary",
                disabled: Oe,
                children: "建立並保存資料包"
              })
            ]
          }),
          re ? /* @__PURE__ */ (0, l.jsx)("div", {
            className: "context-pack",
            children: rt(re)
          }) : /* @__PURE__ */ (0, l.jsx)("p", {
            className: "muted",
            children: "尚未建立資料包。AI 可透過 acquire_animation_context 取得同一份資料。"
          }),
          re?.purpose === "documentation" && re.projectRevision === r.revision && /* @__PURE__ */ (0, l.jsxs)("details", { children: [/* @__PURE__ */ (0, l.jsx)("summary", { children: "回報本次資料整理結果" }), /* @__PURE__ */ (0, l.jsxs)("form", {
            className: "context-form",
            onSubmit: async (o) => {
              o.preventDefault(), await m("submit_ai_work", {
                contextPackId: re.id,
                resultId: crypto.randomUUID(),
                status: "completed",
                summary: Z,
                nextStep: X,
                recordIds: re.records.map((R) => R.id),
                observations: re.records.map((R) => ({
                  recordId: R.id,
                  version: R.version,
                  note: pe[R.id] ?? ""
                })),
                artifacts: [{
                  location: ne,
                  version: p,
                  description: G
                }]
              });
            },
            children: [
              /* @__PURE__ */ (0, l.jsxs)("label", { children: ["本次完成內容", /* @__PURE__ */ (0, l.jsx)("textarea", {
                required: !0,
                rows: 3,
                value: Z,
                onChange: (o) => B(o.target.value)
              })] }),
              /* @__PURE__ */ (0, l.jsxs)("label", { children: ["下一位 AI 接手動作", /* @__PURE__ */ (0, l.jsx)("textarea", {
                required: !0,
                rows: 3,
                value: X,
                onChange: (o) => oe(o.target.value)
              })] }),
              re.records.map((o) => /* @__PURE__ */ (0, l.jsxs)("label", { children: [
                "實際閱讀依據｜",
                o.title,
                /* @__PURE__ */ (0, l.jsx)("textarea", {
                  required: !0,
                  rows: 2,
                  maxLength: 3e3,
                  value: pe[o.id] ?? "",
                  onChange: (R) => he({
                    ...pe,
                    [o.id]: R.target.value
                  })
                })
              ] }, o.id)),
              /* @__PURE__ */ (0, l.jsxs)("label", { children: ["整理成果位置", /* @__PURE__ */ (0, l.jsx)("input", {
                required: !0,
                maxLength: 2e3,
                value: ne,
                onChange: (o) => Ne(o.target.value)
              })] }),
              /* @__PURE__ */ (0, l.jsxs)("label", { children: ["整理成果版本", /* @__PURE__ */ (0, l.jsx)("input", {
                required: !0,
                maxLength: 100,
                value: p,
                onChange: (o) => D(o.target.value)
              })] }),
              /* @__PURE__ */ (0, l.jsxs)("label", { children: ["整理成果說明", /* @__PURE__ */ (0, l.jsx)("input", {
                required: !0,
                maxLength: 2e3,
                value: G,
                onChange: (o) => $(o.target.value)
              })] }),
              /* @__PURE__ */ (0, l.jsx)("button", {
                className: "btn primary",
                disabled: Oe,
                children: "保存資料整理結果"
              })
            ]
          })] }),
          f.packs.length > 1 && /* @__PURE__ */ (0, l.jsxs)("details", { children: [/* @__PURE__ */ (0, l.jsxs)("summary", { children: [
            "先前資料包（",
            f.packs.length - 1,
            "）"
          ] }), [...f.packs].reverse().map((o) => /* @__PURE__ */ (0, l.jsxs)("button", {
            className: "text-btn",
            onClick: () => ee(o.id),
            children: [
              o.task,
              " · 版本 ",
              o.projectRevision
            ]
          }, o.id))] })
        ] }) : /* @__PURE__ */ (0, l.jsxs)(l.Fragment, { children: [
          /* @__PURE__ */ (0, l.jsx)("div", {
            className: "section-title",
            children: /* @__PURE__ */ (0, l.jsxs)("div", { children: [/* @__PURE__ */ (0, l.jsx)("h2", { children: "AI 工作接續紀錄" }), /* @__PURE__ */ (0, l.jsx)("p", { children: "依資料包回寫使用版本、實際閱讀自述、成果位置與下一步。" })] })
          }),
          [...f.results].reverse().map((o) => /* @__PURE__ */ (0, l.jsxs)("article", {
            className: "context-record",
            children: [
              /* @__PURE__ */ (0, l.jsxs)("div", {
                className: "issue-top",
                children: [/* @__PURE__ */ (0, l.jsx)("span", {
                  className: "status " + (o.needsReview ? "needs_revision" : o.status === "blocked" ? "todo" : "candidate"),
                  children: o.needsReview ? f.packs.find((R) => R.id === o.packId)?.purpose === "documentation" ? "採用設定已更新，接手前讀取新版本" : "依據已變更，需重驗" : o.status === "completed" ? f.packs.find((R) => R.id === o.packId)?.purpose === "documentation" ? "資料整理完成" : "AI 回報完成，待作者驗收" : o.status === "partial" ? "部分完成" : "受阻"
                }), /* @__PURE__ */ (0, l.jsx)("b", { children: o.task })]
              }),
              /* @__PURE__ */ (0, l.jsx)("p", { children: o.summary }),
              /* @__PURE__ */ (0, l.jsxs)("div", {
                className: "context-source",
                children: [/* @__PURE__ */ (0, l.jsx)("b", { children: "下一步" }), /* @__PURE__ */ (0, l.jsx)("p", { children: o.nextStep })]
              }),
              o.needsReview && /* @__PURE__ */ (0, l.jsx)("p", {
                className: "red-text",
                children: o.reviewReason
              }),
              o.artifacts.map((R, se) => /* @__PURE__ */ (0, l.jsxs)("p", { children: [
                R.description,
                " · ",
                R.version,
                /* @__PURE__ */ (0, l.jsx)("code", {
                  className: "context-id",
                  children: R.location
                })
              ] }, se)),
              /* @__PURE__ */ (0, l.jsxs)("details", { children: [/* @__PURE__ */ (0, l.jsx)("summary", { children: "使用版本與閱讀自述" }), /* @__PURE__ */ (0, l.jsx)("pre", { children: JSON.stringify({
                packId: o.packId,
                recordIds: o.recordIds,
                observations: o.observations
              }, null, 2) })] })
            ]
          }, o.id)),
          !f.results.length && /* @__PURE__ */ (0, l.jsxs)("div", {
            className: "empty",
            children: [/* @__PURE__ */ (0, l.jsx)("h3", { children: "等待 AI 回報工作" }), /* @__PURE__ */ (0, l.jsx)("p", { children: "工具 submit_animation_work 會保存結果與交接內容。" })]
          })
        ] })
      })
    ]
  });
}
var Mf = [
  ["coverage", "原作與改編範圍"],
  ["endingState", "本集結尾狀態"],
  ["characters", "人物狀態與關係"],
  ["revealed", "已揭露資訊與邊界"],
  ["unresolved", "尚未確定的內容"],
  ["carryRules", "後續集數沿用規則"],
  ["nextSteps", "下一步與接手順序"],
  ["sources", "來源與版本說明"]
], gf = {
  title: "",
  coverage: "",
  endingState: "",
  characters: "",
  revealed: "",
  unresolved: "",
  carryRules: "",
  nextSteps: "",
  sources: ""
}, ox = {
  completed: "作者告知已完成",
  in_progress: "作者告知製作中",
  not_started: "作者告知尚未開始"
};
function eo({ h: r, target: m }) {
  return /* @__PURE__ */ (0, l.jsxs)("div", {
    className: "handoff-body",
    children: [
      /* @__PURE__ */ (0, l.jsxs)("h3", { children: [
        r.title,
        " · v",
        r.version
      ] }),
      /* @__PURE__ */ (0, l.jsxs)("p", {
        className: "inline-note",
        children: [
          "來源整理 → ",
          m,
          "。內容按所列版本交接；尚未對上成片的部分保留疑點，不自動變成下一集採用設定。"
        ]
      }),
      Mf.map(([N, f]) => /* @__PURE__ */ (0, l.jsxs)("div", {
        className: "context-mini",
        children: [/* @__PURE__ */ (0, l.jsx)("b", { children: f }), /* @__PURE__ */ (0, l.jsx)("p", {
          className: "production-source-text",
          children: r[N]
        })]
      }, N)),
      /* @__PURE__ */ (0, l.jsxs)("details", { children: [
        /* @__PURE__ */ (0, l.jsx)("summary", { children: "來源識別鍵與版本紀錄" }),
        /* @__PURE__ */ (0, l.jsx)("p", { children: r.sourceKeys.join("、") }),
        /* @__PURE__ */ (0, l.jsxs)("small", { children: [
          r.at,
          " · ",
          r.by,
          " · ",
          r.id
        ] })
      ] })
    ]
  });
}
function dx({ project: r, episodes: m, busy: N, mutate: f }) {
  const u = r.production?.completionReports?.at(-1), E = r.production?.handoffs?.at(-1), v = m.filter((J) => J.workId === r.workId && J.id !== r.id), [A, w] = (0, S.useState)("completed"), [_, y] = (0, S.useState)(""), [Q, C] = (0, S.useState)(""), [te, ae] = (0, S.useState)(""), [K, F] = (0, S.useState)(gf), [le, H] = (0, S.useState)(""), [ie, V] = (0, S.useState)([]), [W, P] = (0, S.useState)("");
  (0, S.useEffect)(() => {
    w(u?.status ?? "completed"), y(u?.note ?? ""), C(u?.source ?? ""), ae(E?.toEpisodeId ?? ""), F(E ?? gf), H(E?.sourceKeys.join(", ") ?? "");
  }, [
    r.id,
    u?.at,
    E?.id
  ]), (0, S.useEffect)(() => {
    let J = !0;
    return V([]), fetch("/api/projects?id=" + encodeURIComponent(r.id) + "&view=brief", { cache: "no-store" }).then(async (j) => {
      const I = await j.json();
      if (!j.ok) throw new Error(I.error ?? "接續資料讀取失敗");
      J && (V(I.incoming), P(""));
    }).catch((j) => {
      J && P(j.message);
    }), () => {
      J = !1;
    };
  }, [r.id, r.revision]);
  const xe = uo(r).registration, de = N || r.archived;
  return /* @__PURE__ */ (0, l.jsxs)("section", {
    className: "wide-card episode-brief",
    children: [
      /* @__PURE__ */ (0, l.jsx)("div", {
        className: "eyebrow",
        children: "EPISODE HANDOFF"
      }),
      /* @__PURE__ */ (0, l.jsxs)("h2", { children: [r.episode, " 狀態與接續"] }),
      /* @__PURE__ */ (0, l.jsxs)("div", {
        className: "production-totals",
        children: [
          /* @__PURE__ */ (0, l.jsx)("b", { children: u ? ox[u.status] : "製作狀態尚未登記" }),
          /* @__PURE__ */ (0, l.jsxs)("span", { children: [
            xe.acceptedSources,
            " / ",
            xe.sources,
            " 筆來源已收錄"
          ] }),
          /* @__PURE__ */ (0, l.jsxs)("span", { children: [
            xe.linkedShots,
            " / ",
            xe.shots,
            " 列鏡頭有關聯"
          ] }),
          /* @__PURE__ */ (0, l.jsxs)("span", { children: [xe.registeredSelections, " 列已登記採用檔"] })
        ]
      }),
      u && /* @__PURE__ */ (0, l.jsxs)(l.Fragment, { children: [/* @__PURE__ */ (0, l.jsx)("p", { children: u.note }), /* @__PURE__ */ (0, l.jsxs)("small", { children: ["作者告知依據：", u.source] })] }),
      /* @__PURE__ */ (0, l.jsx)("p", {
        className: "inline-note",
        children: "製作完成、資料補登及素材實際檢視各自記錄。未登記檔案位置不等於尚未製作。"
      }),
      /* @__PURE__ */ (0, l.jsxs)("details", { children: [/* @__PURE__ */ (0, l.jsx)("summary", { children: "補登本集製作狀態" }), /* @__PURE__ */ (0, l.jsxs)("form", {
        className: "context-form",
        onSubmit: async (J) => {
          J.preventDefault(), await f("report_episode_completion", {
            status: A,
            note: _,
            source: Q
          });
        },
        children: [
          /* @__PURE__ */ (0, l.jsxs)("label", { children: ["作者告知的製作狀態", /* @__PURE__ */ (0, l.jsxs)("select", {
            value: A,
            onChange: (J) => w(J.target.value),
            children: [
              /* @__PURE__ */ (0, l.jsx)("option", {
                value: "completed",
                children: "已完成"
              }),
              /* @__PURE__ */ (0, l.jsx)("option", {
                value: "in_progress",
                children: "製作中"
              }),
              /* @__PURE__ */ (0, l.jsx)("option", {
                value: "not_started",
                children: "尚未開始"
              })
            ]
          })] }),
          /* @__PURE__ */ (0, l.jsxs)("label", { children: ["作者說明", /* @__PURE__ */ (0, l.jsx)("textarea", {
            required: !0,
            rows: 3,
            maxLength: 3e3,
            value: _,
            onChange: (J) => y(J.target.value)
          })] }),
          /* @__PURE__ */ (0, l.jsxs)("label", { children: ["告知來源", /* @__PURE__ */ (0, l.jsx)("input", {
            required: !0,
            maxLength: 2e3,
            value: Q,
            onChange: (J) => C(J.target.value)
          })] }),
          /* @__PURE__ */ (0, l.jsx)("button", {
            className: "btn primary",
            disabled: de,
            children: "保存作者告知狀態"
          })
        ]
      })] }),
      W && /* @__PURE__ */ (0, l.jsx)("p", {
        role: "alert",
        children: W
      }),
      ie.map((J) => /* @__PURE__ */ (0, l.jsxs)("details", {
        className: "production-record",
        children: [/* @__PURE__ */ (0, l.jsxs)("summary", { children: [/* @__PURE__ */ (0, l.jsxs)("b", { children: [
          "來自 ",
          J.fromEpisode,
          " 的接續資料"
        ] }), /* @__PURE__ */ (0, l.jsxs)("span", { children: [
          "v",
          J.handoff.version,
          " · 來源集數紀錄版本 ",
          J.fromRevision
        ] })] }), /* @__PURE__ */ (0, l.jsx)(eo, {
          h: J.handoff,
          target: r.episode
        })]
      }, J.handoff.id)),
      E ? /* @__PURE__ */ (0, l.jsxs)("details", {
        className: "production-record",
        children: [/* @__PURE__ */ (0, l.jsxs)("summary", { children: [/* @__PURE__ */ (0, l.jsxs)("b", { children: ["交接至 ", m.find((J) => J.id === E.toEpisodeId)?.episode ?? "指定集數"] }), /* @__PURE__ */ (0, l.jsxs)("span", { children: ["接續資料 v", E.version] })] }), /* @__PURE__ */ (0, l.jsx)(eo, {
          h: E,
          target: m.find((J) => J.id === E.toEpisodeId)?.episode ?? "指定集數"
        })]
      }) : /* @__PURE__ */ (0, l.jsx)("p", {
        className: "muted",
        children: "尚未保存本集對後續集數的交接資料。"
      }),
      /* @__PURE__ */ (0, l.jsxs)("details", { children: [/* @__PURE__ */ (0, l.jsx)("summary", { children: E ? "更新接續資料版本" : "補登跨集接續資料" }), v.length ? /* @__PURE__ */ (0, l.jsxs)("form", {
        className: "context-form",
        onSubmit: async (J) => {
          J.preventDefault(), await f("save_episode_handoff", {
            ...K,
            toEpisodeId: te || v[0].id,
            baseVersion: E?.version ?? 0,
            sourceKeys: le.split(/[,，\n]/).map((j) => j.trim()).filter(Boolean)
          });
        },
        children: [
          /* @__PURE__ */ (0, l.jsxs)("label", { children: ["接續目標集數", /* @__PURE__ */ (0, l.jsx)("select", {
            value: te || v[0].id,
            onChange: (J) => ae(J.target.value),
            children: v.map((J) => /* @__PURE__ */ (0, l.jsxs)("option", {
              value: J.id,
              children: [
                J.episode,
                " · ",
                J.title
              ]
            }, J.id))
          })] }),
          /* @__PURE__ */ (0, l.jsxs)("label", { children: ["接續資料名稱", /* @__PURE__ */ (0, l.jsx)("input", {
            required: !0,
            maxLength: 200,
            value: K.title,
            onChange: (J) => F({
              ...K,
              title: J.target.value
            })
          })] }),
          Mf.map(([J, j]) => /* @__PURE__ */ (0, l.jsxs)("label", { children: [j, /* @__PURE__ */ (0, l.jsx)("textarea", {
            required: !0,
            rows: 3,
            maxLength: 6e3,
            value: K[J],
            onChange: (I) => F({
              ...K,
              [J]: I.target.value
            })
          })] }, J)),
          /* @__PURE__ */ (0, l.jsxs)("label", { children: ["來源識別鍵（逗號分隔）", /* @__PURE__ */ (0, l.jsx)("textarea", {
            rows: 2,
            value: le,
            onChange: (J) => H(J.target.value)
          })] }),
          /* @__PURE__ */ (0, l.jsx)("button", {
            className: "btn primary",
            disabled: de,
            children: "保存接續資料版本"
          })
        ]
      }) : /* @__PURE__ */ (0, l.jsx)("p", { children: "先在作品專案新增下一集，再建立交接。" })] }),
      (r.production?.handoffs?.length ?? 0) > 1 && /* @__PURE__ */ (0, l.jsxs)("details", { children: [/* @__PURE__ */ (0, l.jsxs)("summary", { children: [
        "先前接續版本（",
        r.production.handoffs.length - 1,
        "）"
      ] }), r.production.handoffs.slice(0, -1).map((J) => /* @__PURE__ */ (0, l.jsx)(eo, {
        h: J,
        target: m.find((j) => j.id === J.toEpisodeId)?.episode ?? J.toEpisodeId
      }, J.id))] }),
      /* @__PURE__ */ (0, l.jsxs)("details", { children: [
        /* @__PURE__ */ (0, l.jsx)("summary", { children: "AI 接手順序與資料登記" }),
        /* @__PURE__ */ (0, l.jsxs)("ol", { children: [
          /* @__PURE__ */ (0, l.jsx)("li", { children: "讀取作品、集數及本集摘要，先辨識作者告知狀態與資料缺口。" }),
          /* @__PURE__ */ (0, l.jsx)("li", { children: "讀取前集交接、查找指定鏡頭關聯，再按識別鍵取得完整來源。" }),
          /* @__PURE__ */ (0, l.jsx)("li", { children: "整理資料時明確選取來源，使用「資料整理」工作資料包；不同版本及未定事項分開記錄。" }),
          /* @__PURE__ */ (0, l.jsx)("li", { children: "製作或改動素材時另取有效採用設定的「素材製作」資料包。" }),
          /* @__PURE__ */ (0, l.jsx)("li", { children: "回報本次讀過的來源版本、實際成果位置與下一步，讓後續 AI 能接手。" })
        ] }),
        /* @__PURE__ */ (0, l.jsx)("p", { children: "素材定位包含來源檔、候選、採用檔與剪輯工程；時間軸保留各自原點，取得工程前不自行換算。" })
      ] })
    ]
  });
}
var to = {
  key: "",
  title: "",
  kind: "reference",
  content: "",
  source: "",
  location: "",
  baseVersion: void 0
};
function ux({ work: r, episode: m, episodes: N, busy: f, onWorkAction: u, onSelectEpisode: E, onPin: v, mutate: A }) {
  const [w, _] = (0, S.useState)(m.title.split("｜")[0]), [y, Q] = (0, S.useState)(""), [C, te] = (0, S.useState)(""), [ae, K] = (0, S.useState)(""), [F, le] = (0, S.useState)(""), [H, ie] = (0, S.useState)(""), [V, W] = (0, S.useState)(to), [P, xe] = (0, S.useState)(!1);
  if (!r) return /* @__PURE__ */ (0, l.jsxs)("section", {
    className: "wide-card",
    children: [
      /* @__PURE__ */ (0, l.jsx)("div", {
        className: "eyebrow",
        children: "SERIES PROJECT"
      }),
      /* @__PURE__ */ (0, l.jsx)("h2", { children: "將這集整理到作品專案" }),
      /* @__PURE__ */ (0, l.jsx)("p", { children: "現有集數保留資料、鏡頭、版本與通過狀態。作品專案集中存放原作及跨集參考，後續每集各有自己的製作流程。" }),
      /* @__PURE__ */ (0, l.jsxs)("form", {
        className: "context-form",
        onSubmit: async (g) => {
          g.preventDefault(), await u("convert_episode", {
            title: w,
            episodeId: m.id,
            episodeRevision: m.revision
          });
        },
        children: [/* @__PURE__ */ (0, l.jsxs)("label", { children: ["作品專案名稱", /* @__PURE__ */ (0, l.jsx)("input", {
          required: !0,
          maxLength: 200,
          value: w,
          onChange: (g) => _(g.target.value)
        })] }), /* @__PURE__ */ (0, l.jsx)("button", {
          className: "btn primary",
          disabled: f,
          children: "建立作品專案並保留本集"
        })]
      })
    ]
  });
  const de = N.filter((g) => g.workId === r.id).sort((g, ee) => g.episode.localeCompare(ee.episode, void 0, { numeric: !0 })), J = Math.max(0, ...de.map((g) => Number(g.episode.replace(/^EP/i, "")) || 0)) + 1, j = "EP" + String(J).padStart(2, "0"), I = [...new Map(r.sharedAssets.map((g) => [g.key, g])).values()], ye = I.filter((g) => !ae || [
    g.key,
    g.title,
    g.content,
    g.source
  ].join(" ").toLowerCase().includes(ae.toLowerCase()));
  function fe(g) {
    W({
      key: g.key,
      title: g.title,
      kind: g.kind,
      content: g.content,
      source: g.source,
      location: g.location,
      baseVersion: g.version
    }), xe(!0);
  }
  return /* @__PURE__ */ (0, l.jsxs)("section", {
    className: "work-dashboard",
    children: [
      /* @__PURE__ */ (0, l.jsxs)("div", {
        className: "wide-card",
        children: [
          /* @__PURE__ */ (0, l.jsx)("div", {
            className: "eyebrow",
            children: "SERIES PROJECT"
          }),
          /* @__PURE__ */ (0, l.jsx)("h2", { children: r.title }),
          /* @__PURE__ */ (0, l.jsx)("p", { children: "作品專案 → 集數 → 場次與鏡頭。小說卷次、章次與動畫集數分別記錄。" }),
          /* @__PURE__ */ (0, l.jsxs)("div", {
            className: "production-totals",
            children: [
              /* @__PURE__ */ (0, l.jsxs)("b", { children: [de.length, " 集"] }),
              /* @__PURE__ */ (0, l.jsxs)("b", { children: [I.length, " 項共用來源"] }),
              /* @__PURE__ */ (0, l.jsx)("span", { children: "各集保留自己的劇本、進度與採用版本。" })
            ]
          }),
          /* @__PURE__ */ (0, l.jsx)("div", {
            className: "episode-grid",
            children: de.map((g) => /* @__PURE__ */ (0, l.jsxs)("button", {
              className: "episode-card " + (g.id === m.id ? "selected" : ""),
              disabled: f,
              onClick: () => E(g.id),
              children: [
                /* @__PURE__ */ (0, l.jsx)("small", { children: g.episode }),
                /* @__PURE__ */ (0, l.jsx)("b", { children: g.title }),
                /* @__PURE__ */ (0, l.jsxs)("span", { children: [
                  g.shots,
                  " 列鏡頭 · ",
                  g.id === m.id ? "目前集數" : "開啟本集",
                  g.completionReport?.status === "completed" ? " · 作者告知完成" : ""
                ] })
              ]
            }, g.id))
          }),
          /* @__PURE__ */ (0, l.jsxs)("details", { children: [/* @__PURE__ */ (0, l.jsx)("summary", { children: "新增後續集數" }), /* @__PURE__ */ (0, l.jsxs)("form", {
            className: "context-form",
            onSubmit: async (g) => {
              g.preventDefault(), await u("create_episode", {
                episode: y || j,
                title: C || `${y || j} 製作資料`
              }) && (Q(""), te(""));
            },
            children: [
              /* @__PURE__ */ (0, l.jsxs)("div", {
                className: "context-form-grid",
                children: [/* @__PURE__ */ (0, l.jsxs)("label", { children: ["新集數", /* @__PURE__ */ (0, l.jsx)("input", {
                  required: !0,
                  pattern: "[Ee][Pp][0-9]{2,4}",
                  value: y || j,
                  onChange: (g) => Q(g.target.value),
                  placeholder: "EP02"
                })] }), /* @__PURE__ */ (0, l.jsxs)("label", { children: ["本集名稱", /* @__PURE__ */ (0, l.jsx)("input", {
                  maxLength: 200,
                  value: C,
                  onChange: (g) => te(g.target.value),
                  placeholder: `${y || j} 製作資料`
                })] })]
              }),
              /* @__PURE__ */ (0, l.jsx)("p", {
                className: "muted",
                children: "建立空白流程；EP01 的劇情、鏡頭及完成狀態不會複製到下一集。"
              }),
              /* @__PURE__ */ (0, l.jsx)("button", {
                className: "btn primary",
                disabled: f,
                children: "建立新集數"
              })
            ]
          })] })
        ]
      }),
      /* @__PURE__ */ (0, l.jsx)(dx, {
        project: m,
        episodes: N,
        busy: f,
        mutate: A
      }),
      /* @__PURE__ */ (0, l.jsxs)("div", {
        className: "wide-card",
        children: [
          /* @__PURE__ */ (0, l.jsxs)("div", {
            className: "section-title",
            children: [/* @__PURE__ */ (0, l.jsxs)("div", { children: [/* @__PURE__ */ (0, l.jsx)("h2", { children: "作品共用資料" }), /* @__PURE__ */ (0, l.jsx)("p", { children: "原作、角色、場景、世界設定及聲線參考。連結到集數時保存指定版本，之後更新共用資料仍保留各集原先使用的版本。" })] }), /* @__PURE__ */ (0, l.jsx)("button", {
              className: "btn",
              disabled: f,
              onClick: () => {
                W(to), xe(!P);
              },
              children: "新增共用參考"
            })]
          }),
          P && /* @__PURE__ */ (0, l.jsxs)("form", {
            className: "context-form",
            onSubmit: async (g) => {
              g.preventDefault(), await u("save_shared_asset", V) && (xe(!1), W(to));
            },
            children: [
              /* @__PURE__ */ (0, l.jsxs)("div", {
                className: "context-form-grid",
                children: [
                  /* @__PURE__ */ (0, l.jsxs)("label", { children: ["共用識別鍵", /* @__PURE__ */ (0, l.jsx)("input", {
                    required: !0,
                    readOnly: V.baseVersion !== void 0,
                    maxLength: 110,
                    value: V.key,
                    onChange: (g) => W({
                      ...V,
                      key: g.target.value
                    })
                  })] }),
                  /* @__PURE__ */ (0, l.jsxs)("label", { children: ["共用名稱", /* @__PURE__ */ (0, l.jsx)("input", {
                    required: !0,
                    maxLength: 200,
                    value: V.title,
                    onChange: (g) => W({
                      ...V,
                      title: g.target.value
                    })
                  })] }),
                  /* @__PURE__ */ (0, l.jsxs)("label", { children: ["資料種類", /* @__PURE__ */ (0, l.jsx)("select", {
                    value: V.kind,
                    onChange: (g) => W({
                      ...V,
                      kind: g.target.value
                    }),
                    children: [
                      ["reference", "原作／參考"],
                      ["character", "角色"],
                      ["scene", "場景"],
                      ["rule", "世界設定／規則"],
                      ["audio", "聲線／聲音"],
                      ["script", "文本"]
                    ].map(([g, ee]) => /* @__PURE__ */ (0, l.jsx)("option", {
                      value: g,
                      children: ee
                    }, g))
                  })] })
                ]
              }),
              /* @__PURE__ */ (0, l.jsxs)("label", { children: ["完整內容", /* @__PURE__ */ (0, l.jsx)("textarea", {
                required: !0,
                rows: 7,
                maxLength: 12e3,
                value: V.content,
                onChange: (g) => W({
                  ...V,
                  content: g.target.value
                })
              })] }),
              /* @__PURE__ */ (0, l.jsxs)("label", { children: ["來源", /* @__PURE__ */ (0, l.jsx)("input", {
                required: !0,
                maxLength: 2e3,
                value: V.source,
                onChange: (g) => W({
                  ...V,
                  source: g.target.value
                })
              })] }),
              /* @__PURE__ */ (0, l.jsxs)("label", { children: ["素材位置", /* @__PURE__ */ (0, l.jsx)("input", {
                maxLength: 2e3,
                value: V.location,
                onChange: (g) => W({
                  ...V,
                  location: g.target.value
                })
              })] }),
              /* @__PURE__ */ (0, l.jsx)("button", {
                className: "btn primary",
                disabled: f,
                children: V.baseVersion ? "保存新版本" : "保存共用來源"
              })
            ]
          }),
          /* @__PURE__ */ (0, l.jsxs)("label", {
            className: "work-search",
            children: ["搜尋共用資料", /* @__PURE__ */ (0, l.jsx)("input", {
              placeholder: "原作章名、角色、場景或設定",
              value: ae,
              onChange: (g) => K(g.target.value)
            })]
          }),
          /* @__PURE__ */ (0, l.jsxs)("p", {
            className: "muted",
            children: [
              ye.length,
              " 項來源；目前連結目標為 ",
              m.episode,
              "。"
            ]
          }),
          ye.slice(0, 60).map((g) => /* @__PURE__ */ (0, l.jsxs)("details", {
            className: "production-record",
            children: [
              /* @__PURE__ */ (0, l.jsxs)("summary", { children: [/* @__PURE__ */ (0, l.jsx)("b", { children: g.title }), /* @__PURE__ */ (0, l.jsxs)("span", {
                className: "status candidate",
                children: ["共用參考 v", g.version]
              })] }),
              /* @__PURE__ */ (0, l.jsx)("code", {
                className: "context-id",
                children: g.key
              }),
              /* @__PURE__ */ (0, l.jsx)("div", {
                className: "production-source-text",
                children: g.content
              }),
              /* @__PURE__ */ (0, l.jsxs)("p", { children: ["來源：", g.source] }),
              /* @__PURE__ */ (0, l.jsxs)("p", { children: ["素材位置：", g.location || "文字已收錄"] }),
              g.originEpisodeId && /* @__PURE__ */ (0, l.jsxs)("p", {
                className: "muted",
                children: [
                  "保留來源集數：",
                  N.find((ee) => ee.id === g.originEpisodeId)?.episode ?? g.originEpisodeId,
                  "；按本集需求選用。"
                ]
              }),
              /* @__PURE__ */ (0, l.jsxs)("div", {
                className: "context-actions",
                children: [/* @__PURE__ */ (0, l.jsx)("button", {
                  className: "btn",
                  disabled: f || !!m.sharedPins?.some((ee) => ee.assetId === g.id),
                  onClick: () => {
                    v(g.id);
                  },
                  children: m.sharedPins?.some((ee) => ee.assetId === g.id) ? `${m.episode} 已連結此版本` : `連結此版本至 ${m.episode}`
                }), /* @__PURE__ */ (0, l.jsx)("button", {
                  className: "btn",
                  disabled: f,
                  onClick: () => fe(g),
                  children: "建立新版本"
                })]
              }),
              (m.sharedPins?.filter((ee) => ee.assetKey === g.key).at(-1)?.version ?? g.version) < g.version && /* @__PURE__ */ (0, l.jsx)("p", {
                className: "inline-note",
                children: "本集仍連結較舊版本，沿用內容保持不變；需要時再連結新版本。"
              })
            ]
          }, g.id)),
          /* @__PURE__ */ (0, l.jsxs)("details", {
            className: "production-import",
            children: [
              /* @__PURE__ */ (0, l.jsx)("summary", { children: "批次補入作品共用來源" }),
              /* @__PURE__ */ (0, l.jsx)("p", { children: "貼上包含 assets 清單的 JSON。每項須有 key、title、kind、content、source；識別鍵重複時拒絕覆寫。" }),
              /* @__PURE__ */ (0, l.jsxs)("label", { children: ["作品來源 JSON", /* @__PURE__ */ (0, l.jsx)("textarea", {
                rows: 5,
                value: F,
                onChange: (g) => {
                  le(g.target.value), ie("");
                }
              })] }),
              H && /* @__PURE__ */ (0, l.jsx)("p", {
                role: "alert",
                children: H
              }),
              /* @__PURE__ */ (0, l.jsx)("button", {
                className: "btn primary",
                disabled: f || !F.trim(),
                onClick: async () => {
                  try {
                    const g = JSON.parse(F);
                    if (!Array.isArray(g.assets)) throw new Error("缺少 assets 清單");
                    await u("import_shared_assets", { assets: g.assets }) && le("");
                  } catch (g) {
                    ie(g instanceof Error ? g.message : "格式錯誤");
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
var bf = {
  key: "",
  title: "",
  world: "real",
  label: "v2_candidate",
  sourceLocation: "",
  sourceVersion: "",
  backupLocation: "",
  sha256: "",
  reference: ""
}, px = {
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
function fx({ initialSelection: r, work: m, episode: N, episodes: f, busy: u, onAction: E, onProject: v, onDirty: A }) {
  const [w, _] = (0, S.useState)(r?.modelId ?? ""), [y, Q] = (0, S.useState)(r?.versionId ?? ""), [C, te] = (0, S.useState)(r?.stageId ?? "M01"), [ae, K] = (0, S.useState)(null), [F, le] = (0, S.useState)(bf), [H, ie] = (0, S.useState)(""), V = m ? Ms(m) : null, W = V?.models.find((k) => k.id === w) ?? V?.models[0], P = W?.versions.find((k) => k.id === y) ?? W?.versions.at(-1), xe = P?.stages[C], de = Na.find((k) => k.id === C);
  function J(k) {
    ft(k), A(k);
  }
  const [j, I] = (0, S.useState)([]), [ye, fe] = (0, S.useState)(""), [g, ee] = (0, S.useState)(""), [Z, B] = (0, S.useState)(""), [X, oe] = (0, S.useState)(""), [ne, Ne] = (0, S.useState)(""), [p, D] = (0, S.useState)("technical"), [G, $] = (0, S.useState)({}), [pe, he] = (0, S.useState)(""), [re, Re] = (0, S.useState)(""), [_e, ft] = (0, S.useState)(!1);
  (0, S.useEffect)(() => {
    xe && (I(xe.checks), fe(xe.evidence), ee(xe.summary), B(xe.nextStep), oe(P.candidateLocation), J(!1));
  }, [xe, P]), (0, S.useEffect)(() => {
    if (!_e) return;
    const k = (Se) => Se.preventDefault();
    return window.addEventListener("beforeunload", k), () => window.removeEventListener("beforeunload", k);
  }, [_e]);
  function Ie(k) {
    _e && !window.confirm("有未儲存模型紀錄，要放棄修改嗎？") || (J(!1), ie(""), k());
  }
  async function Oe(k, Se) {
    ie("");
    const We = await E(k, Se);
    return We && J(!1), We;
  }
  function je() {
    !W || !P || (le({
      key: W.key,
      title: W.title,
      world: W.world,
      label: "v" + (P.number + 2) + "_candidate",
      sourceLocation: P.sourceLocation,
      sourceVersion: P.sourceVersion,
      backupLocation: P.backupLocation,
      sha256: P.sha256,
      reference: P.reference
    }), K("version"));
  }
  if (!m) return /* @__PURE__ */ (0, l.jsxs)("section", {
    className: "wide-card",
    children: [
      /* @__PURE__ */ (0, l.jsx)("h2", { children: "3D 模型製作流程" }),
      /* @__PURE__ */ (0, l.jsx)("p", {
        className: "stage-description",
        children: "模型屬於作品共用資產。先把本集整理到作品專案，即可登記模型及候選版本，供後續各集引用。"
      }),
      /* @__PURE__ */ (0, l.jsxs)("button", {
        className: "btn primary",
        onClick: v,
        children: ["前往作品專案 ", /* @__PURE__ */ (0, l.jsx)(ni, { size: 15 })]
      })
    ]
  });
  const Ze = V.issues.filter((k) => k.modelId === W?.id && k.versionId === P?.id), rt = Ze.filter((k) => k.status === "open"), o = !!P?.stages.M08.author, R = W && P ? Xm(m, W.id, P.id, C) : [], se = V.pins.filter((k) => k.episodeId === N.id), qe = new Map(se.map((k) => [[k.modelId, k.sceneIds].join("|"), k]));
  return /* @__PURE__ */ (0, l.jsxs)("section", {
    className: "model-workspace",
    children: [
      /* @__PURE__ */ (0, l.jsxs)("div", {
        className: "wide-card model-heading",
        children: [/* @__PURE__ */ (0, l.jsxs)("div", {
          className: "section-title",
          children: [/* @__PURE__ */ (0, l.jsxs)("div", { children: [
            /* @__PURE__ */ (0, l.jsx)("div", {
              className: "eyebrow",
              children: "WORK-LEVEL 3D ASSETS"
            }),
            /* @__PURE__ */ (0, l.jsxs)("h2", { children: [/* @__PURE__ */ (0, l.jsx)(no, { size: 23 }), "模型製作與完善"] }),
            /* @__PURE__ */ (0, l.jsxs)("p", { children: [m.title, " · 各模型、各候選及各集引用分開記錄。"] })
          ] }), /* @__PURE__ */ (0, l.jsxs)("button", {
            className: "btn primary",
            disabled: u,
            onClick: () => Ie(() => {
              le(bf), K("register");
            }),
            children: [/* @__PURE__ */ (0, l.jsx)(Pt, { size: 15 }), "登記模型"]
          })]
        }), /* @__PURE__ */ (0, l.jsxs)("div", {
          className: "model-principles",
          children: [
            /* @__PURE__ */ (0, l.jsxs)("span", { children: [/* @__PURE__ */ (0, l.jsx)(bl, { size: 15 }), "先讀原檔與設定"] }),
            /* @__PURE__ */ (0, l.jsxs)("span", { children: [/* @__PURE__ */ (0, l.jsx)(so, { size: 15 }), "保留原檔及版本"] }),
            /* @__PURE__ */ (0, l.jsxs)("span", { children: [/* @__PURE__ */ (0, l.jsx)(gl, { size: 15 }), "技術、視覺與採用分開"] })
          ]
        })]
      }),
      ae && /* @__PURE__ */ (0, l.jsxs)("form", {
        className: "wide-card context-form model-register",
        onSubmit: async (k) => {
          k.preventDefault();
          const Se = await Oe(ae === "register" ? "register_model" : "create_model_version", {
            ...F,
            modelId: W?.id
          });
          if (Se) {
            const We = ae === "register" ? Se.work.modelFlow?.models.at(-1) : Se.work.modelFlow?.models.find((Jt) => Jt.id === W?.id);
            K(null), _(We?.id ?? ""), Q(We?.versions.at(-1)?.id ?? ""), te("M01");
          }
        },
        children: [
          /* @__PURE__ */ (0, l.jsxs)("div", {
            className: "section-title",
            children: [/* @__PURE__ */ (0, l.jsx)("h3", { children: ae === "register" ? "登記模型來源" : "建立新候選版本" }), /* @__PURE__ */ (0, l.jsx)("button", {
              className: "text-btn",
              type: "button",
              onClick: () => K(null),
              children: "關閉"
            })]
          }),
          /* @__PURE__ */ (0, l.jsxs)("div", {
            className: "context-form-grid",
            children: [
              ae === "register" && /* @__PURE__ */ (0, l.jsxs)(l.Fragment, { children: [
                /* @__PURE__ */ (0, l.jsxs)("label", { children: ["模型固定識別鍵 *", /* @__PURE__ */ (0, l.jsx)("input", {
                  required: !0,
                  maxLength: 100,
                  value: F.key,
                  placeholder: "RG-REAL-01",
                  onChange: (k) => le({
                    ...F,
                    key: k.target.value
                  })
                })] }),
                /* @__PURE__ */ (0, l.jsxs)("label", { children: ["模型名稱 *", /* @__PURE__ */ (0, l.jsx)("input", {
                  required: !0,
                  maxLength: 200,
                  value: F.title,
                  placeholder: "現實主角家",
                  onChange: (k) => le({
                    ...F,
                    title: k.target.value
                  })
                })] }),
                /* @__PURE__ */ (0, l.jsxs)("label", { children: ["世界／場景分類", /* @__PURE__ */ (0, l.jsxs)("select", {
                  value: F.world,
                  onChange: (k) => le({
                    ...F,
                    world: k.target.value
                  }),
                  children: [
                    /* @__PURE__ */ (0, l.jsx)("option", {
                      value: "real",
                      children: "現實"
                    }),
                    /* @__PURE__ */ (0, l.jsx)("option", {
                      value: "game",
                      children: "遊戲"
                    }),
                    /* @__PURE__ */ (0, l.jsx)("option", {
                      value: "other",
                      children: "其他"
                    })
                  ]
                })] })
              ] }),
              /* @__PURE__ */ (0, l.jsxs)("label", { children: ["本次候選標籤 *", /* @__PURE__ */ (0, l.jsx)("input", {
                required: !0,
                maxLength: 100,
                value: F.label,
                onChange: (k) => le({
                  ...F,
                  label: k.target.value
                })
              })] }),
              [
                ["sourceLocation", "正式來源 GLB 位置 *"],
                ["sourceVersion", "來源版本／清單版本 *"],
                ["backupLocation", "原檔備份位置"],
                ["sha256", "原檔 SHA-256（實際計算值）"]
              ].map(([k, Se]) => /* @__PURE__ */ (0, l.jsxs)("label", { children: [Se, /* @__PURE__ */ (0, l.jsx)("input", {
                required: k === "sourceLocation" || k === "sourceVersion",
                maxLength: k === "sha256" ? 64 : 2e3,
                pattern: k === "sha256" ? "[a-fA-F0-9]{64}" : void 0,
                value: F[k],
                onChange: (We) => le({
                  ...F,
                  [k]: We.target.value
                })
              })] }, k))
            ]
          }),
          /* @__PURE__ */ (0, l.jsxs)("label", { children: ["設定與尺度來源／不可改動項目", /* @__PURE__ */ (0, l.jsx)("textarea", {
            rows: 4,
            maxLength: 12e3,
            value: F.reference,
            onChange: (k) => le({
              ...F,
              reference: k.target.value
            }),
            placeholder: "設計書與平面圖版本、固定節點／家具 ID、單位、重大變更待核定項。"
          })] }),
          /* @__PURE__ */ (0, l.jsx)("p", {
            className: "muted",
            children: "來源會隨此版本保存。待補欄位可先留空，但原檔、備份與雜湊不齊時不能通過盤點；更正來源請另建版本。登記資料不會修改或上傳模型檔案。"
          }),
          /* @__PURE__ */ (0, l.jsx)("button", {
            className: "btn primary",
            disabled: u,
            children: "保存模型來源與空白流程"
          })
        ]
      }),
      !W || !P ? /* @__PURE__ */ (0, l.jsxs)("div", {
        className: "wide-card empty",
        children: [
          /* @__PURE__ */ (0, l.jsx)(no, { size: 36 }),
          /* @__PURE__ */ (0, l.jsx)("h3", { children: "從實際模型來源開始" }),
          /* @__PURE__ */ (0, l.jsx)("p", { children: "登記正式 GLB、來源版本與設定依據，再逐階段留下產出及接續工作。" })
        ]
      }) : /* @__PURE__ */ (0, l.jsxs)(l.Fragment, { children: [
        /* @__PURE__ */ (0, l.jsxs)("div", {
          className: "wide-card",
          children: [
            /* @__PURE__ */ (0, l.jsxs)("div", {
              className: "model-selectors",
              children: [
                /* @__PURE__ */ (0, l.jsxs)("label", { children: ["模型", /* @__PURE__ */ (0, l.jsx)("select", {
                  value: W.id,
                  disabled: u,
                  onChange: (k) => Ie(() => {
                    _(k.target.value), Q(""), te("M01");
                  }),
                  children: V.models.map((k) => /* @__PURE__ */ (0, l.jsxs)("option", {
                    value: k.id,
                    children: [
                      k.key,
                      " · ",
                      k.title
                    ]
                  }, k.id))
                })] }),
                /* @__PURE__ */ (0, l.jsxs)("label", { children: ["精確版本", /* @__PURE__ */ (0, l.jsx)("select", {
                  value: P.id,
                  disabled: u,
                  onChange: (k) => Ie(() => Q(k.target.value)),
                  children: W.versions.map((k) => /* @__PURE__ */ (0, l.jsxs)("option", {
                    value: k.id,
                    children: [
                      "v",
                      k.number,
                      " · ",
                      k.label,
                      k.stages.M08.author ? "（曾採用）" : "",
                      W.adoptedVersionId === k.id ? "／目前採用" : ""
                    ]
                  }, k.id))
                })] }),
                /* @__PURE__ */ (0, l.jsxs)("button", {
                  className: "btn",
                  disabled: u,
                  onClick: () => Ie(je),
                  children: [/* @__PURE__ */ (0, l.jsx)(Pt, { size: 14 }), "另建候選版本"]
                })
              ]
            }),
            /* @__PURE__ */ (0, l.jsxs)("div", {
              className: "production-totals",
              children: [
                /* @__PURE__ */ (0, l.jsxs)("b", { children: [Na.filter((k) => P.stages[k.id].author).length, " / 8 階段核定"] }),
                /* @__PURE__ */ (0, l.jsxs)("b", { children: [rt.length, " 項待修或待裁定"] }),
                /* @__PURE__ */ (0, l.jsxs)("span", { children: [
                  W.world === "real" ? "現實場景" : W.world === "game" ? "遊戲場景" : "其他模型",
                  " · ",
                  o ? "此採用版本保持不變" : "候選製作中"
                ] })
              ]
            }),
            /* @__PURE__ */ (0, l.jsxs)("details", { children: [/* @__PURE__ */ (0, l.jsx)("summary", { children: "此版本來源與設定" }), /* @__PURE__ */ (0, l.jsxs)("dl", {
              className: "model-sources",
              children: [
                /* @__PURE__ */ (0, l.jsx)("dt", { children: "模型來源" }),
                /* @__PURE__ */ (0, l.jsxs)("dd", { children: [
                  P.sourceLocation,
                  " · ",
                  P.sourceVersion
                ] }),
                /* @__PURE__ */ (0, l.jsx)("dt", { children: "原檔備份" }),
                /* @__PURE__ */ (0, l.jsx)("dd", { children: P.backupLocation || "待補" }),
                /* @__PURE__ */ (0, l.jsx)("dt", { children: "SHA-256" }),
                /* @__PURE__ */ (0, l.jsx)("dd", { children: P.sha256 || "待實際計算" }),
                /* @__PURE__ */ (0, l.jsx)("dt", { children: "設定與尺度" }),
                /* @__PURE__ */ (0, l.jsx)("dd", { children: P.reference || "待補" }),
                /* @__PURE__ */ (0, l.jsx)("dt", { children: "候選 GLB" }),
                /* @__PURE__ */ (0, l.jsx)("dd", { children: P.candidateLocation || "尚未登記" })
              ]
            })] })
          ]
        }),
        /* @__PURE__ */ (0, l.jsx)("div", {
          className: "model-stage-grid",
          children: Na.map((k, Se) => /* @__PURE__ */ (0, l.jsxs)("button", {
            disabled: u,
            className: "model-step " + (C === k.id ? "selected" : "") + (P.stages[k.id].author ? " passed" : ""),
            onClick: () => Ie(() => te(k.id)),
            children: [
              /* @__PURE__ */ (0, l.jsx)("small", { children: k.id }),
              /* @__PURE__ */ (0, l.jsx)("b", { children: k.title }),
              /* @__PURE__ */ (0, l.jsx)("span", { children: P.stages[k.id].author ? "作者已確認" : P.stages[k.id].status === "needs_revision" ? "待修正" : P.stages[k.id].status === "candidate" ? "已有工作回報" : "待製作" })
            ]
          }, k.id))
        }),
        /* @__PURE__ */ (0, l.jsxs)("div", {
          className: "wide-card model-stage-detail",
          children: [
            /* @__PURE__ */ (0, l.jsxs)("div", {
              className: "section-title",
              children: [/* @__PURE__ */ (0, l.jsxs)("div", { children: [/* @__PURE__ */ (0, l.jsxs)("div", {
                className: "eyebrow",
                children: [
                  de.id,
                  " · ",
                  W.title,
                  " · ",
                  P.label
                ]
              }), /* @__PURE__ */ (0, l.jsx)("h2", { children: de.title })] }), /* @__PURE__ */ (0, l.jsx)("span", {
                className: "status " + (xe.author ? "passed" : xe.status === "needs_revision" ? "needs_revision" : "candidate"),
                children: xe.author ? "作者已確認" : xe.status === "todo" ? "待製作" : "待確認工作"
              })]
            }),
            /* @__PURE__ */ (0, l.jsxs)("div", {
              className: "output-box",
              children: [/* @__PURE__ */ (0, l.jsx)(bl, { size: 19 }), /* @__PURE__ */ (0, l.jsxs)("div", { children: [/* @__PURE__ */ (0, l.jsx)("strong", { children: "應留下的產出" }), /* @__PURE__ */ (0, l.jsx)("p", { children: de.output })] })]
            }),
            /* @__PURE__ */ (0, l.jsxs)("form", {
              className: "context-form",
              onSubmit: async (k) => {
                k.preventDefault(), await Oe("save_model_stage", {
                  modelId: W.id,
                  versionId: P.id,
                  stageId: C,
                  checks: j,
                  evidence: ye,
                  summary: g,
                  nextStep: Z,
                  candidateLocation: X
                });
              },
              children: [
                /* @__PURE__ */ (0, l.jsx)("div", {
                  className: "checklist",
                  children: de.checks.map((k, Se) => /* @__PURE__ */ (0, l.jsxs)("label", { children: [/* @__PURE__ */ (0, l.jsx)("input", {
                    type: "checkbox",
                    disabled: u || o,
                    checked: j[Se] ?? !1,
                    onChange: (We) => {
                      I((Jt) => Jt.map((et, Ja) => Ja === Se ? We.target.checked : et)), J(!0);
                    }
                  }), /* @__PURE__ */ (0, l.jsx)("span", { children: k })] }, k))
                }),
                C === "M04" && /* @__PURE__ */ (0, l.jsxs)("label", { children: ["本次獨立候選 GLB", /* @__PURE__ */ (0, l.jsx)("input", {
                  disabled: u || o,
                  maxLength: 2e3,
                  value: X,
                  placeholder: ".../reality-home_v2_candidate.glb",
                  onChange: (k) => {
                    oe(k.target.value), J(!0);
                  }
                })] }),
                /* @__PURE__ */ (0, l.jsxs)("label", { children: ["實際產出／檢查依據位置", /* @__PURE__ */ (0, l.jsx)("textarea", {
                  rows: 2,
                  disabled: u || o,
                  value: ye,
                  onChange: (k) => {
                    fe(k.target.value), J(!0);
                  },
                  placeholder: "原檔盤點報告、逐物件差異、檢查結果或指定鏡位截圖；附來源版本。"
                })] }),
                /* @__PURE__ */ (0, l.jsxs)("label", { children: ["本次實際做了什麼 *", /* @__PURE__ */ (0, l.jsx)("textarea", {
                  required: !0,
                  rows: 3,
                  maxLength: 6e3,
                  disabled: u || o,
                  value: g,
                  onChange: (k) => {
                    ee(k.target.value), J(!0);
                  },
                  placeholder: "具體節點／物件、改動、檢查方式、尚未完成項。"
                })] }),
                /* @__PURE__ */ (0, l.jsxs)("label", { children: ["下一位 AI 從哪裡繼續 *", /* @__PURE__ */ (0, l.jsx)("textarea", {
                  required: !0,
                  rows: 3,
                  maxLength: 6e3,
                  disabled: u || o,
                  value: Z,
                  onChange: (k) => {
                    B(k.target.value), J(!0);
                  },
                  placeholder: "指定版本、檔案位置、先讀資料、下一個物件或鏡位，以及受阻原因。"
                })] }),
                /* @__PURE__ */ (0, l.jsxs)("div", {
                  className: "context-actions",
                  children: [/* @__PURE__ */ (0, l.jsxs)("button", {
                    className: "btn",
                    disabled: u || o || !_e,
                    children: ["保存候選工作紀錄", _e ? " *" : ""]
                  }), /* @__PURE__ */ (0, l.jsxs)("button", {
                    type: "button",
                    className: "btn primary",
                    disabled: u || o || _e || R.length > 0 || !!xe.author,
                    onClick: () => {
                      Oe(C === "M08" ? "adopt_model_version" : "approve_model_stage", {
                        modelId: W.id,
                        versionId: P.id,
                        stageId: C,
                        note: "作者確認指定候選版本與適用範圍"
                      });
                    },
                    children: [/* @__PURE__ */ (0, l.jsx)(gl, { size: 15 }), C === "M08" ? "作者登記採用此版本" : "作者確認本階段"]
                  })]
                }),
                /* @__PURE__ */ (0, l.jsx)("p", {
                  className: "muted",
                  children: o ? "已採用版本及舊集引用保持不變；需要修改請另建候選。" : _e ? "請先保存工作紀錄，再確認。" : R.length ? "待補：" + R.join("；") : "檢查條件已齊，請核對實際成果後確認。"
                }),
                C === "M08" && /* @__PURE__ */ (0, l.jsx)("p", {
                  className: "inline-note",
                  children: "採用僅保存作者選擇，不會覆寫或部署正式 GLB。實際替換正式模型須另行明確授權。"
                })
              ]
            })
          ]
        }),
        /* @__PURE__ */ (0, l.jsxs)("div", {
          className: "wide-card",
          children: [
            /* @__PURE__ */ (0, l.jsx)("div", {
              className: "section-title",
              children: /* @__PURE__ */ (0, l.jsxs)("div", { children: [/* @__PURE__ */ (0, l.jsx)("h2", { children: "技術問題、視覺問題與重大變更" }), /* @__PURE__ */ (0, l.jsx)("p", { children: "重大建築變更、世界觀衝突與正式設定異動保留作者裁定。" })] })
            }),
            /* @__PURE__ */ (0, l.jsxs)("form", {
              className: "context-form",
              onSubmit: async (k) => {
                k.preventDefault(), await Oe("report_model_issue", {
                  modelId: W.id,
                  versionId: P.id,
                  stageId: C,
                  kind: p,
                  reason: ne
                }) && Ne("");
              },
              children: [
                /* @__PURE__ */ (0, l.jsxs)("div", {
                  className: "context-form-grid",
                  children: [/* @__PURE__ */ (0, l.jsxs)("label", { children: ["問題分類", /* @__PURE__ */ (0, l.jsxs)("select", {
                    value: p,
                    onChange: (k) => D(k.target.value),
                    children: [
                      /* @__PURE__ */ (0, l.jsx)("option", {
                        value: "technical",
                        children: "技術檢查問題"
                      }),
                      /* @__PURE__ */ (0, l.jsx)("option", {
                        value: "visual",
                        children: "AI／人工視覺問題"
                      }),
                      /* @__PURE__ */ (0, l.jsx)("option", {
                        value: "major",
                        children: "重大變更待作者裁定"
                      })
                    ]
                  })] }), /* @__PURE__ */ (0, l.jsxs)("label", { children: ["所屬階段", /* @__PURE__ */ (0, l.jsx)("input", {
                    readOnly: !0,
                    value: de.id + " " + de.title
                  })] })]
                }),
                /* @__PURE__ */ (0, l.jsxs)("label", { children: ["具體原因", /* @__PURE__ */ (0, l.jsx)("textarea", {
                  required: !0,
                  rows: 2,
                  maxLength: 6e3,
                  value: ne,
                  onChange: (k) => Ne(k.target.value)
                })] }),
                /* @__PURE__ */ (0, l.jsxs)("button", {
                  className: "btn",
                  disabled: u || !ne.trim(),
                  children: [/* @__PURE__ */ (0, l.jsx)(si, { size: 15 }), "登記問題"]
                })
              ]
            }),
            Ze.map((k) => /* @__PURE__ */ (0, l.jsxs)("article", {
              className: "context-record",
              children: [
                /* @__PURE__ */ (0, l.jsxs)("div", {
                  className: "issue-top",
                  children: [/* @__PURE__ */ (0, l.jsx)("span", {
                    className: "status " + (k.status === "open" ? "needs_revision" : "passed"),
                    children: k.status === "open" ? "待處理" : "作者已複核"
                  }), /* @__PURE__ */ (0, l.jsxs)("b", { children: [
                    k.stageId,
                    " · ",
                    k.kind === "major" ? "重大變更" : k.kind === "technical" ? "技術" : "視覺"
                  ] })]
                }),
                /* @__PURE__ */ (0, l.jsx)("p", { children: k.reason }),
                /* @__PURE__ */ (0, l.jsxs)("small", { children: [
                  k.by,
                  " · ",
                  new Date(k.at).toLocaleString("zh-TW", { timeZone: "Asia/Taipei" })
                ] }),
                k.status === "open" ? /* @__PURE__ */ (0, l.jsxs)("form", {
                  className: "context-form",
                  onSubmit: async (Se) => {
                    Se.preventDefault(), await Oe("resolve_model_issue", {
                      modelId: W.id,
                      versionId: P.id,
                      issueId: k.id,
                      resolution: G[k.id] ?? ""
                    });
                  },
                  children: [/* @__PURE__ */ (0, l.jsxs)("label", { children: ["作者修正複核／裁定結果", /* @__PURE__ */ (0, l.jsx)("textarea", {
                    required: !0,
                    rows: 2,
                    maxLength: 6e3,
                    value: G[k.id] ?? "",
                    onChange: (Se) => $({
                      ...G,
                      [k.id]: Se.target.value
                    })
                  })] }), /* @__PURE__ */ (0, l.jsx)("button", {
                    className: "btn",
                    disabled: u,
                    children: "作者確認處理結果"
                  })]
                }) : /* @__PURE__ */ (0, l.jsxs)("p", { children: ["處理結果：", k.resolution] })
              ]
            }, k.id))
          ]
        }),
        /* @__PURE__ */ (0, l.jsxs)("div", {
          className: "wide-card",
          children: [
            /* @__PURE__ */ (0, l.jsx)("div", {
              className: "section-title",
              children: /* @__PURE__ */ (0, l.jsxs)("div", { children: [/* @__PURE__ */ (0, l.jsxs)("h2", { children: [/* @__PURE__ */ (0, l.jsx)(Cs, { size: 19 }), "各集固定版本引用"] }), /* @__PURE__ */ (0, l.jsxs)("p", { children: [
                "目前集數：",
                N.episode,
                "。新候選不會自動替換 EP01 或其他集的模型來源。"
              ] })] })
            }),
            o && /* @__PURE__ */ (0, l.jsxs)("form", {
              className: "context-form",
              onSubmit: async (k) => {
                k.preventDefault(), await Oe("pin_model_version", {
                  modelId: W.id,
                  versionId: P.id,
                  episodeId: N.id,
                  purpose: pe,
                  sceneIds: re
                }) && (he(""), Re(""));
              },
              children: [/* @__PURE__ */ (0, l.jsxs)("div", {
                className: "context-form-grid",
                children: [/* @__PURE__ */ (0, l.jsxs)("label", { children: ["引用場次（選填）", /* @__PURE__ */ (0, l.jsx)("input", {
                  value: re,
                  maxLength: 1e3,
                  placeholder: "S06、S07",
                  onChange: (k) => Re(k.target.value)
                })] }), /* @__PURE__ */ (0, l.jsxs)("label", { children: ["本集用途 *", /* @__PURE__ */ (0, l.jsx)("input", {
                  required: !0,
                  value: pe,
                  maxLength: 2e3,
                  placeholder: "固定樓梯、餐桌與走道位置",
                  onChange: (k) => he(k.target.value)
                })] })]
              }), /* @__PURE__ */ (0, l.jsxs)("button", {
                className: "btn",
                disabled: u || rt.length > 0,
                children: ["將此採用版本引用至 ", N.episode]
              })]
            }),
            se.length ? /* @__PURE__ */ (0, l.jsx)("div", {
              className: "model-pins",
              children: se.map((k, Se) => {
                const We = V.models.find((et) => et.id === k.modelId), Jt = We?.versions.find((et) => et.id === k.versionId);
                return /* @__PURE__ */ (0, l.jsxs)("article", { children: [
                  /* @__PURE__ */ (0, l.jsxs)("b", { children: [
                    We?.title,
                    " · ",
                    Jt?.label
                  ] }),
                  " ",
                  /* @__PURE__ */ (0, l.jsx)("span", {
                    className: "status " + (qe.get([k.modelId, k.sceneIds].join("|")) === k ? "passed" : "todo"),
                    children: qe.get([k.modelId, k.sceneIds].join("|")) === k ? "本集現行引用" : "歷史引用"
                  }),
                  /* @__PURE__ */ (0, l.jsxs)("p", { children: [
                    k.sceneIds || "本集",
                    " ／ ",
                    k.purpose
                  ] }),
                  /* @__PURE__ */ (0, l.jsx)("code", { children: Jt?.candidateLocation })
                ] }, Se);
              })
            }) : /* @__PURE__ */ (0, l.jsx)("p", {
              className: "muted",
              children: "本集尚未登記採用的模型版本。請先完成作者採用，再記錄引用。"
            })
          ]
        }),
        /* @__PURE__ */ (0, l.jsxs)("details", {
          className: "wide-card",
          children: [/* @__PURE__ */ (0, l.jsxs)("summary", { children: [
            "模型製作與 AI 接續紀錄（",
            V.history.filter((k) => k.modelId === W.id).length,
            "）"
          ] }), [...V.history].reverse().filter((k) => k.modelId === W.id).slice(0, 60).map((k, Se) => /* @__PURE__ */ (0, l.jsxs)("article", {
            className: "context-mini",
            children: [
              /* @__PURE__ */ (0, l.jsxs)("b", { children: [
                px[k.action] ?? k.action,
                " · ",
                k.stageId,
                " · ",
                W.versions.find((We) => We.id === k.versionId)?.label
              ] }),
              /* @__PURE__ */ (0, l.jsx)("p", { children: k.detail }),
              /* @__PURE__ */ (0, l.jsxs)("small", { children: [
                k.actor === "ai" ? "AI" : "作者",
                " · ",
                k.by,
                " · ",
                new Date(k.at).toLocaleString("zh-TW", { timeZone: "Asia/Taipei" })
              ] })
            ]
          }, Se))]
        })
      ] }),
      H && /* @__PURE__ */ (0, l.jsx)("p", {
        role: "alert",
        children: H
      })
    ]
  });
}
var ao = "https://lihuany635-create.github.io/lizhi-cloud-web/?open=animationflow", lo = {
  todo: "待製作",
  candidate: "候選待驗收",
  passed: "已通過",
  in_timeline: "已入片",
  needs_revision: "待修正"
}, vf = [
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
function ii(r) {
  return r ? new Date(r).toLocaleString("zh-TW", {
    timeZone: "Asia/Taipei",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  }) : "尚無紀錄";
}
function hx(r, m, N = "application/json") {
  const f = URL.createObjectURL(new Blob([m], { type: N })), u = document.createElement("a");
  u.href = f, u.download = r, u.click(), setTimeout(() => URL.revokeObjectURL(f), 1e3);
}
function mx({ nativeTransport: r, initialWorkId: m, initialTab: N = "resume", onDirtyChange: f } = {}) {
  const [u, E] = (0, S.useState)([]), [v, A] = (0, S.useState)(null), [w, _] = (0, S.useState)(N), [y, Q] = (0, S.useState)("01"), [C, te] = (0, S.useState)(null), [ae, K] = (0, S.useState)([]), [F, le] = (0, S.useState)(!0), [H, ie] = (0, S.useState)(!1), [V, W] = (0, S.useState)(""), [P, xe] = (0, S.useState)(""), [de, J] = (0, S.useState)(!1), [j, I] = (0, S.useState)([]), [ye, fe] = (0, S.useState)(""), [g, ee] = (0, S.useState)(""), [Z, B] = (0, S.useState)(!1), [X, oe] = (0, S.useState)(null), [ne, Ne] = (0, S.useState)({}), [p, D] = (0, S.useState)(""), [G, $] = (0, S.useState)(!1), [pe, he] = (0, S.useState)(null), re = (0, S.useRef)(0), Re = (0, S.useRef)(""), _e = (0, S.useRef)(!1);
  (0, S.useEffect)(() => {
    _e.current = Z, f?.(Z);
  }, [Z, f]);
  const ft = (0, S.useCallback)((h) => {
    Re.current = h.id, A(h), te((ge) => ge?.id === h.workId ? ge : null), E((ge) => [co(h), ...ge.filter((be) => be.id !== h.id)]), B(!1);
  }, []);
  async function Ie(h, ge, be = "projects") {
    const tt = r ? await r(be, h, ge) : await fetch("/api/" + be + h, {
      cache: "no-store",
      ...ge ? {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(ge)
      } : {}
    });
    if (tt.status === 401)
      throw J(!0), new Error("請先登入流程工作台");
    if (!tt.headers.get("content-type")?.includes("application/json"))
      throw J(!0), new Error("請開啟工作台並使用 ChatGPT 登入");
    const Xe = await tt.json();
    if (!tt.ok) throw new Error(Xe.error || "讀取失敗");
    return J(!1), Xe;
  }
  const Oe = (0, S.useCallback)(async (h) => {
    const ge = ++re.current;
    h && h !== Re.current && (Re.current = h, le(!0));
    try {
      const [be, tt] = await Promise.all([Ie(""), Ie("", void 0, "works")]), Xe = m ? be.filter((yt) => yt.workId === m) : be, vt = h || Re.current || Xe.find((yt) => !yt.archived && yt.workId && yt.episode === "EP01")?.id || Xe.find((yt) => !yt.archived && yt.workId)?.id || Xe.find((yt) => !yt.archived)?.id;
      let ot = null, rn = null;
      if (vt && (ot = await Ie("?id=" + encodeURIComponent(vt)), ot.workId && (rn = (await Ie("?id=" + encodeURIComponent(ot.workId), void 0, "works")).work)), ge !== re.current) return;
      W(""), E(Xe), K(m ? tt.filter((yt) => yt.id === m) : tt), _e.current || (ot ? ft(ot) : A(null), te(rn));
    } catch (be) {
      ge === re.current && W(be.message);
    } finally {
      ge === re.current && le(!1);
    }
  }, [ft, m]);
  (0, S.useEffect)(() => {
    const h = new URLSearchParams(window.location.search).get("view");
    !m && h && [
      "resume",
      "project",
      "models",
      "context"
    ].includes(h) && _(h);
  }, []), (0, S.useEffect)(() => {
    Oe();
  }, [Oe]), (0, S.useEffect)(() => {
    const h = setInterval(() => {
      !Z && !X && !H && Oe(Re.current || void 0);
    }, 2e4);
    return () => clearInterval(h);
  }, [
    Z,
    X,
    H,
    v?.id,
    Oe
  ]), (0, S.useEffect)(() => {
    const h = v?.stages[y];
    h && (I(h.checks), fe(h.evidence), ee(h.note), B(!1));
  }, [v, y]), (0, S.useEffect)(() => {
    if (!Z) return;
    const h = (ge) => {
      ge.preventDefault();
    };
    return window.addEventListener("beforeunload", h), () => window.removeEventListener("beforeunload", h);
  }, [Z]), (0, S.useEffect)(() => {
    if (!P) return;
    const h = setTimeout(() => xe(""), 4500);
    return () => clearTimeout(h);
  }, [P]);
  async function je(h, ge = {}) {
    if (v) {
      re.current++, ie(!0), W("");
      try {
        const be = await Ie("", {
          projectId: v.id,
          revision: v.revision,
          action: h,
          args: ge
        });
        return ft(be), be.archived && $(!0), xe("已儲存至雲端"), be;
      } catch (be) {
        W(be.message);
      } finally {
        ie(!1);
      }
    }
  }
  async function Ze(h, ge) {
    re.current++, ie(!0), W("");
    try {
      const be = await Ie("", [
        "convert_episode",
        "create_work",
        "create_episode"
      ].includes(h) ? {
        action: h,
        ...ge,
        workId: C?.id,
        revision: C?.revision
      } : {
        action: h,
        workId: C?.id,
        revision: C?.revision,
        args: ge
      }, "works");
      return te(be.work), K((tt) => [{
        ...$m(be.work),
        episodeCount: be.episodes.length
      }, ...tt.filter((Xe) => Xe.id !== be.work.id)]), E((tt) => [...be.episodes, ...tt.filter((Xe) => !be.episodes.some((vt) => vt.id === Xe.id))]), be.episode && ft(be.episode), xe("作品專案已儲存"), be;
    } catch (be) {
      if (W(be.message), h === "create_episode") throw be;
    } finally {
      ie(!1);
    }
  }
  function rt(h) {
    Z && !window.confirm("此階段有未儲存修改，要放棄修改嗎？") || (B(!1), h());
  }
  function o(h) {
    rt(() => Q(h));
  }
  function R(h) {
    rt(() => {
      _(h), [
        "main",
        "op",
        "ed"
      ].includes(h) && Q(Kt.find((ge) => ge.group === h).id);
    });
  }
  async function se(h) {
    h.preventDefault(), ie(!0), W("");
    try {
      X === "create" ? (C ? await Ze("create_episode", {
        title: ne.title || "製作資料",
        episode: ne.episode || "EP01"
      }) : ft(await Ie("", {
        action: "create_project",
        title: ne.title || "現實遊戲",
        episode: ne.episode || "EP01"
      })), _("main"), Q("01"), oe(null), xe("專案已建立，全部階段待確認")) : X === "shot" ? await je("save_shot", ne) && oe(null) : X === "issue" ? await je("add_issue", ne) && oe(null) : X === "resolve" ? await je("resolve_issue", ne) && oe(null) : X === "archive" && await je(v?.archived ? "restore" : "archive") && oe(null);
    } catch (ge) {
      W(ge.message);
    } finally {
      ie(!1);
    }
  }
  const qe = v ? co(v) : null, k = Kt.find((h) => h.id === y), Se = v?.stages[y], We = v ? Tf(v, y) : [], Jt = v ? Es(v, y) : [], et = Kt.filter((h) => h.group === w), Ja = v?.issues.filter((h) => h.status === "open") || [], jl = v?.production?.completionReports?.at(-1), Ut = jl?.status === "completed", ea = v ? uo(v).registration : null, Ia = [
    [
      "resume",
      "工作首頁",
      ci
    ],
    [
      "project",
      "作品與集數",
      tn
    ],
    [
      "models",
      "3D 模型",
      of
    ],
    [
      "settings",
      "採用設定",
      bl
    ],
    [
      "context",
      "資料與交接",
      ci
    ],
    [
      "main",
      "動畫製作",
      Tm
    ],
    [
      "op",
      "片頭 OP",
      Zr
    ],
    [
      "ed",
      "片尾 ED",
      tn
    ],
    [
      "shots",
      "鏡頭與素材",
      of
    ],
    [
      "issues",
      "待修問題",
      si
    ],
    [
      "chatgpt",
      "AI 協作",
      Ir
    ],
    [
      "history",
      "異動紀錄",
      wf
    ]
  ];
  return /* @__PURE__ */ (0, l.jsxs)("div", {
    className: "workspace",
    children: [
      /* @__PURE__ */ (0, l.jsxs)("aside", {
        className: "sidebar",
        children: [
          /* @__PURE__ */ (0, l.jsxs)("a", {
            className: "brand",
            href: ao,
            target: "_top",
            children: [/* @__PURE__ */ (0, l.jsx)("span", {
              className: "brandmark",
              children: "立"
            }), /* @__PURE__ */ (0, l.jsxs)("div", { children: [/* @__PURE__ */ (0, l.jsx)("strong", { children: "立之雲端庫" }), /* @__PURE__ */ (0, l.jsx)("small", { children: "PRODUCTION WORKSPACE" })] })]
          }),
          /* @__PURE__ */ (0, l.jsx)("div", {
            className: "side-label",
            children: "作品專案"
          }),
          /* @__PURE__ */ (0, l.jsxs)("div", {
            className: "project-switch",
            children: [/* @__PURE__ */ (0, l.jsx)(tn, { size: 19 }), /* @__PURE__ */ (0, l.jsxs)("select", {
              disabled: H || F,
              "aria-label": "切換作品專案",
              value: C?.id || "",
              onChange: (h) => rt(() => {
                const ge = u.find((be) => (be.workId || "") === h.target.value && !be.archived);
                ge && Oe(ge.id), he(null), _("resume");
              }),
              children: [/* @__PURE__ */ (0, l.jsx)("option", {
                value: "",
                children: "未歸屬單集"
              }), ae.map((h) => /* @__PURE__ */ (0, l.jsxs)("option", {
                value: h.id,
                children: [
                  h.title,
                  " · ",
                  h.episodeCount,
                  " 集"
                ]
              }, h.id))]
            })]
          }),
          /* @__PURE__ */ (0, l.jsx)("div", {
            className: "side-label",
            children: "集數"
          }),
          /* @__PURE__ */ (0, l.jsxs)("div", {
            className: "project-switch",
            children: [/* @__PURE__ */ (0, l.jsx)(ci, { size: 19 }), /* @__PURE__ */ (0, l.jsxs)("select", {
              disabled: H || F,
              "aria-label": "切換集數",
              value: v?.id || "",
              onChange: (h) => rt(() => {
                Oe(h.target.value);
              }),
              children: [/* @__PURE__ */ (0, l.jsx)("option", {
                value: "",
                disabled: !0,
                children: "選擇集數"
              }), u.filter((h) => (h.workId || "") === (C?.id || "") && (G || !h.archived)).map((h) => /* @__PURE__ */ (0, l.jsxs)("option", {
                value: h.id,
                children: [
                  h.episode,
                  " · ",
                  h.title,
                  h.archived ? "（已封存）" : ""
                ]
              }, h.id))]
            })]
          }),
          /* @__PURE__ */ (0, l.jsxs)("button", {
            className: "new-project",
            onClick: () => rt(() => {
              Ne({
                title: "製作資料",
                episode: "EP" + String(Math.max(0, ...u.map((h) => Number(h.episode.replace(/^EP/i, "")) || 0)) + 1).padStart(2, "0")
              }), oe("create");
            }),
            children: [/* @__PURE__ */ (0, l.jsx)(Pt, { size: 15 }), "建立其他單集"]
          }),
          /* @__PURE__ */ (0, l.jsx)("nav", {
            "aria-label": "主要功能",
            children: Ia.filter(([h]) => [
              "resume",
              "main",
              "models",
              "context",
              "chatgpt"
            ].includes(h)).map(([h, ge, be]) => /* @__PURE__ */ (0, l.jsxs)("button", {
              "aria-current": w === h ? "page" : void 0,
              className: "nav-item " + (w === h || h === "main" && [
                "op",
                "ed",
                "shots",
                "issues"
              ].includes(w) ? "active" : ""),
              onClick: () => R(h),
              children: [/* @__PURE__ */ (0, l.jsx)(be, { size: 18 }), /* @__PURE__ */ (0, l.jsx)("span", { children: ge })]
            }, h))
          }),
          /* @__PURE__ */ (0, l.jsxs)("details", {
            className: "nav-more",
            open: [
              "project",
              "settings",
              "history"
            ].includes(w) || void 0,
            children: [/* @__PURE__ */ (0, l.jsx)("summary", { children: "專案管理" }), Ia.filter(([h]) => [
              "project",
              "settings",
              "history"
            ].includes(h)).map(([h, ge, be]) => /* @__PURE__ */ (0, l.jsxs)("button", {
              className: "nav-item " + (w === h ? "active" : ""),
              onClick: () => R(h),
              children: [/* @__PURE__ */ (0, l.jsx)(be, { size: 17 }), ge]
            }, h))]
          }),
          /* @__PURE__ */ (0, l.jsxs)("div", {
            className: "side-bottom",
            children: [/* @__PURE__ */ (0, l.jsxs)("label", {
              className: "archive-toggle",
              children: [/* @__PURE__ */ (0, l.jsx)("input", {
                type: "checkbox",
                checked: G,
                onChange: (h) => $(h.target.checked)
              }), "顯示已封存專案"]
            }), /* @__PURE__ */ (0, l.jsxs)("a", {
              href: ao,
              target: "_top",
              children: ["返回立之雲端庫 ", /* @__PURE__ */ (0, l.jsx)(lm, { size: 14 })]
            })]
          })
        ]
      }),
      /* @__PURE__ */ (0, l.jsxs)("main", {
        className: "main",
        children: [/* @__PURE__ */ (0, l.jsxs)("header", {
          className: "topbar",
          children: [/* @__PURE__ */ (0, l.jsxs)("div", {
            className: "breadcrumb",
            children: [
              "製作工作台 ",
              /* @__PURE__ */ (0, l.jsx)(cf, { size: 14 }),
              /* @__PURE__ */ (0, l.jsx)("span", { children: Ia.find((h) => h[0] === w)?.[1] })
            ]
          }), /* @__PURE__ */ (0, l.jsxs)("div", {
            className: "top-actions",
            children: [/* @__PURE__ */ (0, l.jsxs)("span", {
              className: "cloud-indicator",
              children: [/* @__PURE__ */ (0, l.jsx)("i", {}), r ? "雲端庫帳號 · 共用進度" : "私有雲端進度"]
            }), /* @__PURE__ */ (0, l.jsx)("button", {
              className: "icon-btn",
              title: "重新讀取雲端進度",
              "aria-label": "重新讀取雲端進度",
              disabled: H || F,
              onClick: () => rt(() => {
                Oe(v?.id);
              }),
              children: /* @__PURE__ */ (0, l.jsx)(cn, {
                size: 17,
                className: F ? "spin" : ""
              })
            })]
          })]
        }), /* @__PURE__ */ (0, l.jsxs)("div", {
          className: "page-content",
          children: [
            V && /* @__PURE__ */ (0, l.jsxs)("div", {
              className: "error-banner",
              role: "alert",
              children: [
                /* @__PURE__ */ (0, l.jsx)(si, { size: 18 }),
                /* @__PURE__ */ (0, l.jsx)("span", { children: V }),
                de && /* @__PURE__ */ (0, l.jsx)("a", {
                  href: r ? ao : "/signin-with-chatgpt?return_to=" + encodeURIComponent("/?view=" + w),
                  target: "_top",
                  children: r ? "重新登入雲端庫" : "登入工作台 ↗"
                }),
                /* @__PURE__ */ (0, l.jsx)("button", {
                  "aria-label": "關閉訊息",
                  onClick: () => W(""),
                  children: /* @__PURE__ */ (0, l.jsx)(sn, { size: 16 })
                })
              ]
            }),
            /* @__PURE__ */ (0, l.jsxs)("div", {
              className: "page-heading",
              children: [/* @__PURE__ */ (0, l.jsxs)("div", { children: [
                /* @__PURE__ */ (0, l.jsx)("div", {
                  className: "eyebrow",
                  children: "製作工作台"
                }),
                /* @__PURE__ */ (0, l.jsx)("h1", { children: Ia.find((h) => h[0] === w)?.[1] }),
                /* @__PURE__ */ (0, l.jsx)("p", { children: w === "resume" ? "查看進度，選一件事接著做。" : w === "models" ? "選擇模型與版本，記錄這次完成的工作。" : w === "context" ? "查找製作資料，保留每次工作的交接。" : "目前選取的作品與集數如下。" })
              ] }), /* @__PURE__ */ (0, l.jsx)("div", {
                className: "heading-actions",
                children: v && /* @__PURE__ */ (0, l.jsxs)(l.Fragment, { children: [/* @__PURE__ */ (0, l.jsxs)("button", {
                  className: "btn",
                  onClick: () => hx(v.title + "_" + v.episode + "_流程備份.json", JSON.stringify(v, null, 2)),
                  children: [/* @__PURE__ */ (0, l.jsx)(Ts, { size: 15 }), "匯出紀錄"]
                }), /* @__PURE__ */ (0, l.jsx)("button", {
                  className: "icon-btn bordered",
                  title: v.archived ? "還原專案" : "封存專案",
                  "aria-label": v.archived ? "還原專案" : "封存專案",
                  onClick: () => {
                    Ne({}), oe("archive");
                  },
                  children: v.archived ? /* @__PURE__ */ (0, l.jsx)(kf, { size: 17 }) : /* @__PURE__ */ (0, l.jsx)(Nf, { size: 17 })
                })] })
              })]
            }),
            F ? /* @__PURE__ */ (0, l.jsxs)("div", {
              className: "empty",
              children: [/* @__PURE__ */ (0, l.jsx)(Jr, {
                className: "spin",
                size: 26
              }), /* @__PURE__ */ (0, l.jsx)("h3", { children: "讀取製作進度" })]
            }) : v ? /* @__PURE__ */ (0, l.jsxs)(l.Fragment, { children: [
              /* @__PURE__ */ (0, l.jsxs)("section", {
                className: "project-banner",
                children: [/* @__PURE__ */ (0, l.jsxs)("div", {
                  className: "project-title",
                  children: [/* @__PURE__ */ (0, l.jsx)("span", {
                    className: "episode",
                    children: v.episode
                  }), /* @__PURE__ */ (0, l.jsxs)("div", { children: [/* @__PURE__ */ (0, l.jsxs)("h2", { children: [C ? C.title + " · " + v.episode : v.title, v.archived && /* @__PURE__ */ (0, l.jsx)("span", {
                    className: "status todo",
                    children: "已封存"
                  })] }), /* @__PURE__ */ (0, l.jsxs)("p", { children: [
                    "更新於 ",
                    ii(v.updatedAt),
                    " ",
                    /* @__PURE__ */ (0, l.jsx)("span", { children: "·" }),
                    " 紀錄版本 ",
                    v.revision
                  ] })] })]
                }), /* @__PURE__ */ (0, l.jsxs)("div", {
                  className: "project-progress",
                  children: [/* @__PURE__ */ (0, l.jsxs)("div", { children: [/* @__PURE__ */ (0, l.jsx)("span", { children: "本集製作狀態" }), /* @__PURE__ */ (0, l.jsx)("strong", { children: Ut ? "作者告知已完成" : jl?.status === "in_progress" ? "作者告知製作中" : jl?.status === "not_started" ? "作者告知尚未開始" : "尚未登記" })] }), /* @__PURE__ */ (0, l.jsx)("small", { children: Ut ? "目前進行資料補登與來源對應" : "依本集作者告知紀錄顯示" })]
                })]
              }),
              w !== "resume" && /* @__PURE__ */ (0, l.jsxs)("details", {
                className: "registration-detail",
                children: [
                  /* @__PURE__ */ (0, l.jsx)("summary", { children: "查看資料登記統計" }),
                  /* @__PURE__ */ (0, l.jsxs)("div", {
                    className: "metrics",
                    children: [
                      /* @__PURE__ */ (0, l.jsxs)("div", { children: [/* @__PURE__ */ (0, l.jsx)("span", {
                        className: "metric-icon green",
                        children: /* @__PURE__ */ (0, l.jsx)(gl, { size: 20 })
                      }), /* @__PURE__ */ (0, l.jsxs)("div", { children: [/* @__PURE__ */ (0, l.jsxs)("b", { children: [ea.acceptedSources, /* @__PURE__ */ (0, l.jsxs)("em", { children: [" / ", ea.sources] })] }), /* @__PURE__ */ (0, l.jsx)("small", { children: "來源已確認收錄" })] })] }),
                      /* @__PURE__ */ (0, l.jsxs)("div", { children: [/* @__PURE__ */ (0, l.jsx)("span", {
                        className: "metric-icon blue",
                        children: /* @__PURE__ */ (0, l.jsx)(Zr, { size: 20 })
                      }), /* @__PURE__ */ (0, l.jsxs)("div", { children: [/* @__PURE__ */ (0, l.jsxs)("b", { children: [ea.linkedShots, /* @__PURE__ */ (0, l.jsxs)("em", { children: [" / ", ea.shots] })] }), /* @__PURE__ */ (0, l.jsx)("small", { children: "鏡頭來源關聯" })] })] }),
                      /* @__PURE__ */ (0, l.jsxs)("div", { children: [/* @__PURE__ */ (0, l.jsx)("span", {
                        className: "metric-icon amber",
                        children: /* @__PURE__ */ (0, l.jsx)(bl, { size: 20 })
                      }), /* @__PURE__ */ (0, l.jsxs)("div", { children: [/* @__PURE__ */ (0, l.jsx)("b", { children: ea.registeredSelections || "待補登" }), /* @__PURE__ */ (0, l.jsx)("small", { children: "實際採用檔紀錄" })] })] }),
                      /* @__PURE__ */ (0, l.jsxs)("div", { children: [/* @__PURE__ */ (0, l.jsx)("span", {
                        className: "metric-icon red",
                        children: /* @__PURE__ */ (0, l.jsx)(si, { size: 20 })
                      }), /* @__PURE__ */ (0, l.jsxs)("div", { children: [/* @__PURE__ */ (0, l.jsx)("b", { children: Ja.length }), /* @__PURE__ */ (0, l.jsx)("small", { children: "已登記退修問題" })] })] })
                    ]
                  }),
                  /* @__PURE__ */ (0, l.jsxs)("details", {
                    className: "registration-detail",
                    children: [/* @__PURE__ */ (0, l.jsx)("summary", { children: "逐項檢視與入片登記" }), /* @__PURE__ */ (0, l.jsxs)("p", { children: [
                      qe.approved,
                      " / ",
                      qe.total,
                      " 階段已登記逐項核定；",
                      qe.inTimeline,
                      " / ",
                      qe.shots,
                      " 列鏡頭已登記工程入出點。",
                      Ut ? "本集已按作者告知完成登記；以上為資料紀錄覆蓋情形，不代表製作完成比例。" : "作者告知、逐項檢視與資料收錄分別保存。"
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
              ].includes(w) && /* @__PURE__ */ (0, l.jsx)("nav", {
                className: "section-nav",
                "aria-label": "動畫製作內容",
                children: Ia.filter(([h]) => [
                  "main",
                  "op",
                  "ed",
                  "shots",
                  "issues"
                ].includes(h)).map(([h, ge]) => /* @__PURE__ */ (0, l.jsxs)("button", {
                  className: w === h ? "active" : "",
                  "aria-current": w === h ? "page" : void 0,
                  onClick: () => R(h),
                  children: [ge, h === "issues" && Ja.length > 0 ? " · " + Ja.length : ""]
                }, h))
              }),
              w === "resume" ? /* @__PURE__ */ (0, l.jsx)(ax, {
                project: v,
                work: C,
                busy: H,
                onNavigate: R,
                onModel: (h) => {
                  he(h), R("models");
                }
              }) : w === "project" ? /* @__PURE__ */ (0, l.jsx)(ux, {
                work: C,
                episode: v,
                episodes: u,
                busy: H,
                onWorkAction: Ze,
                onSelectEpisode: (h) => rt(() => {
                  Oe(h);
                }),
                onPin: (h) => je("pin_shared_reference", { assetId: h }),
                mutate: je
              }, v.id) : w === "models" ? /* @__PURE__ */ (0, l.jsx)(fx, {
                initialSelection: pe,
                work: C,
                episode: v,
                episodes: u,
                busy: H,
                onAction: Ze,
                onProject: () => R("project"),
                onDirty: B
              }, (C?.id || v.id) + JSON.stringify(pe)) : w === "settings" ? /* @__PURE__ */ (0, l.jsx)(Cf, {
                project: v,
                busy: H,
                mutate: je
              }, v.id) : w === "context" ? /* @__PURE__ */ (0, l.jsx)(rx, {
                project: v,
                mutate: je,
                busy: H
              }, v.id) : [
                "main",
                "op",
                "ed"
              ].includes(w) ? /* @__PURE__ */ (0, l.jsxs)(l.Fragment, { children: [
                /* @__PURE__ */ (0, l.jsxs)("div", {
                  className: "section-title",
                  children: [
                    /* @__PURE__ */ (0, l.jsx)("h2", { children: w === "main" ? "主線製作流程" : w.toUpperCase() + " 獨立製作支線" }),
                    /* @__PURE__ */ (0, l.jsx)("span", { children: w === "main" ? "每階段留下產出，再進行驗收" : "完成支線後接回全片驗收" }),
                    w !== "main" && /* @__PURE__ */ (0, l.jsxs)("label", {
                      className: "branch-toggle",
                      children: [/* @__PURE__ */ (0, l.jsx)("input", {
                        type: "checkbox",
                        checked: v.branches[w],
                        disabled: H || v.archived,
                        onChange: (h) => {
                          je("set_branches", {
                            ...v.branches,
                            [w]: h.target.checked
                          });
                        }
                      }), "納入本集"]
                    })
                  ]
                }),
                w !== "main" && !v.branches[w] ? /* @__PURE__ */ (0, l.jsxs)("div", {
                  className: "empty",
                  children: [
                    /* @__PURE__ */ (0, l.jsx)(tn, { size: 30 }),
                    /* @__PURE__ */ (0, l.jsxs)("h3", { children: ["本集未納入 ", w.toUpperCase()] }),
                    /* @__PURE__ */ (0, l.jsx)("p", { children: "重新勾選「納入本集」即可保留並繼續原有紀錄。" })
                  ]
                }) : /* @__PURE__ */ (0, l.jsxs)("div", {
                  className: "flow-layout",
                  children: [/* @__PURE__ */ (0, l.jsxs)("div", {
                    className: "stage-list",
                    children: [et.map((h, ge) => {
                      const be = v.stages[h.id], tt = Es(v, h.id).length > 0;
                      return /* @__PURE__ */ (0, l.jsxs)("button", {
                        className: "stage-item " + (y === h.id ? "selected" : "") + (be.author ? " completed" : ""),
                        onClick: () => o(h.id),
                        children: [
                          /* @__PURE__ */ (0, l.jsx)("span", {
                            className: "stage-number " + (be.author ? "done" : ""),
                            children: be.author ? /* @__PURE__ */ (0, l.jsx)(ws, { size: 17 }) : w === "main" ? h.id : String(ge + 1).padStart(2, "0")
                          }),
                          /* @__PURE__ */ (0, l.jsxs)("div", { children: [
                            /* @__PURE__ */ (0, l.jsx)("small", { children: h.phase }),
                            /* @__PURE__ */ (0, l.jsx)("strong", { children: h.title }),
                            /* @__PURE__ */ (0, l.jsx)("span", {
                              className: "stage-label " + (be.status === "needs_revision" ? "red-text" : ""),
                              children: Ut && !be.author && be.status === "todo" ? "已完成 · 待補登" : tt && !be.author ? /* @__PURE__ */ (0, l.jsxs)(l.Fragment, { children: [/* @__PURE__ */ (0, l.jsx)(so, { size: 11 }), "待前階段核定"] }) : lo[be.status]
                            })
                          ] }),
                          /* @__PURE__ */ (0, l.jsx)(cf, { size: 15 })
                        ]
                      }, h.id);
                    }), /* @__PURE__ */ (0, l.jsxs)("div", {
                      className: "legend",
                      children: [/* @__PURE__ */ (0, l.jsxs)("span", { children: [/* @__PURE__ */ (0, l.jsx)("i", { className: "legend-dot green-dot" }), "正式核定"] }), /* @__PURE__ */ (0, l.jsxs)("span", { children: [/* @__PURE__ */ (0, l.jsx)("i", { className: "legend-dot gray-dot" }), "待確認"] })]
                    })]
                  }), /* @__PURE__ */ (0, l.jsxs)("section", {
                    className: "detail-card",
                    children: [
                      /* @__PURE__ */ (0, l.jsxs)("div", {
                        className: "detail-top",
                        children: [/* @__PURE__ */ (0, l.jsxs)("div", { children: [/* @__PURE__ */ (0, l.jsx)("span", {
                          className: "eyebrow",
                          children: w === "main" ? "STAGE " + y : w.toUpperCase() + " · " + y.slice(2)
                        }), /* @__PURE__ */ (0, l.jsx)("h2", { children: k.title })] }), /* @__PURE__ */ (0, l.jsx)("span", {
                          className: "status " + Se.status,
                          children: Ut && Se.status === "todo" ? "已完成 · 明細待補登" : lo[Se.status]
                        })]
                      }),
                      /* @__PURE__ */ (0, l.jsx)("p", {
                        className: "stage-description",
                        children: k.description
                      }),
                      Jt.length > 0 && /* @__PURE__ */ (0, l.jsxs)("div", {
                        className: "gate-notice",
                        children: [/* @__PURE__ */ (0, l.jsx)(so, { size: 16 }), /* @__PURE__ */ (0, l.jsxs)("span", { children: [
                          Ut ? "逐項紀錄尚缺：" : "正式核定前，需先完成：",
                          Jt.join("、"),
                          "。可直接補登產出依據。"
                        ] })]
                      }),
                      /* @__PURE__ */ (0, l.jsxs)("div", {
                        className: "output-box",
                        children: [/* @__PURE__ */ (0, l.jsx)(bl, { size: 19 }), /* @__PURE__ */ (0, l.jsxs)("div", { children: [/* @__PURE__ */ (0, l.jsx)("strong", { children: "本階段產出" }), /* @__PURE__ */ (0, l.jsx)("p", { children: k.output })] })]
                      }),
                      Ka(v.episodeRules ?? []).filter((h) => !h.stageIds.length || h.stageIds.includes(y)).map((h) => /* @__PURE__ */ (0, l.jsxs)("div", {
                        className: "context-mini",
                        children: [
                          /* @__PURE__ */ (0, l.jsxs)("b", { children: [
                            "本集採用規則 · ",
                            h.title,
                            " v",
                            h.version
                          ] }),
                          /* @__PURE__ */ (0, l.jsx)("p", { children: h.content }),
                          /* @__PURE__ */ (0, l.jsxs)("small", { children: [
                            "場次：",
                            h.sceneIds.join("、") || "全部",
                            " · 來源：",
                            h.source
                          ] })
                        ]
                      }, h.id)),
                      /* @__PURE__ */ (0, l.jsxs)("div", {
                        className: "checklist-heading",
                        children: [/* @__PURE__ */ (0, l.jsx)("h3", { children: Ut ? "逐項檢視紀錄" : "驗收確認" }), /* @__PURE__ */ (0, l.jsxs)("span", { children: [
                          j.filter(Boolean).length,
                          " / ",
                          j.length
                        ] })]
                      }),
                      /* @__PURE__ */ (0, l.jsx)("div", {
                        className: "checklist",
                        children: k.checks.map((h, ge) => /* @__PURE__ */ (0, l.jsxs)("label", {
                          className: j[ge] ? "checked" : "",
                          children: [/* @__PURE__ */ (0, l.jsx)("input", {
                            type: "checkbox",
                            checked: j[ge] || !1,
                            disabled: H || v.archived,
                            onChange: (be) => {
                              I((tt) => tt.map((Xe, vt) => vt === ge ? be.target.checked : Xe)), B(!0);
                            }
                          }), /* @__PURE__ */ (0, l.jsx)("span", { children: h })]
                        }, ge))
                      }),
                      /* @__PURE__ */ (0, l.jsxs)("label", {
                        className: "field-label",
                        htmlFor: "evidence",
                        children: [
                          /* @__PURE__ */ (0, l.jsx)(Cs, { size: 15 }),
                          "產出依據與位置 ",
                          /* @__PURE__ */ (0, l.jsx)("span", { children: "必填" })
                        ]
                      }),
                      /* @__PURE__ */ (0, l.jsx)("textarea", {
                        id: "evidence",
                        rows: 3,
                        placeholder: "貼上成果連結、檔案位置與參考版本；每行一筆。",
                        value: ye,
                        disabled: v.archived,
                        onChange: (h) => {
                          fe(h.target.value), B(!0);
                        }
                      }),
                      /* @__PURE__ */ (0, l.jsx)("small", {
                        className: "field-help",
                        children: "記錄位置方便追查；素材須實際開啟檢查後才能確認。"
                      }),
                      /* @__PURE__ */ (0, l.jsx)("label", {
                        className: "field-label",
                        htmlFor: "note",
                        children: "製作備註"
                      }),
                      /* @__PURE__ */ (0, l.jsx)("textarea", {
                        id: "note",
                        rows: 3,
                        placeholder: "記錄製作內容、修正方式與前後鏡頭的銜接。",
                        value: g,
                        disabled: v.archived,
                        onChange: (h) => {
                          ee(h.target.value), B(!0);
                        }
                      }),
                      /* @__PURE__ */ (0, l.jsxs)("div", {
                        className: "reviews",
                        children: [/* @__PURE__ */ (0, l.jsxs)("div", { children: [/* @__PURE__ */ (0, l.jsxs)("span", {
                          className: "review-title",
                          children: [/* @__PURE__ */ (0, l.jsx)(Ir, { size: 15 }), "AI 初驗"]
                        }), Se.ai ? /* @__PURE__ */ (0, l.jsxs)(l.Fragment, { children: [
                          /* @__PURE__ */ (0, l.jsx)("b", {
                            className: Se.ai.verdict === "pass" ? "green-text" : "red-text",
                            children: Se.ai.verdict === "pass" ? "初驗通過" : "需修正"
                          }),
                          /* @__PURE__ */ (0, l.jsx)("p", { children: Se.ai.note }),
                          /* @__PURE__ */ (0, l.jsxs)("small", { children: [
                            ii(Se.ai.at),
                            " · ",
                            Se.ai.by
                          ] })
                        ] }) : /* @__PURE__ */ (0, l.jsx)("p", {
                          className: "muted",
                          children: "尚未收到 AI 初驗"
                        })] }), /* @__PURE__ */ (0, l.jsxs)("div", { children: [/* @__PURE__ */ (0, l.jsxs)("span", {
                          className: "review-title",
                          children: [/* @__PURE__ */ (0, l.jsx)(gl, { size: 15 }), "作者正式核定"]
                        }), Se.author ? /* @__PURE__ */ (0, l.jsxs)(l.Fragment, { children: [
                          /* @__PURE__ */ (0, l.jsx)("b", {
                            className: "green-text",
                            children: "已核定"
                          }),
                          /* @__PURE__ */ (0, l.jsx)("p", { children: Se.author.note || "已確認本階段成果與驗收條件" }),
                          /* @__PURE__ */ (0, l.jsxs)("small", { children: [
                            ii(Se.author.at),
                            " · ",
                            Se.author.by
                          ] })
                        ] }) : /* @__PURE__ */ (0, l.jsx)("p", {
                          className: "muted",
                          children: Ut ? "作者已告知本集完成；逐項檢視依據尚待補登。" : "尚未登記逐項確認"
                        })] })]
                      }),
                      /* @__PURE__ */ (0, l.jsxs)("div", {
                        className: "detail-actions",
                        children: [/* @__PURE__ */ (0, l.jsxs)("button", {
                          className: "text-btn danger-text",
                          disabled: H || v.archived,
                          onClick: () => {
                            Ne({
                              stageId: y,
                              reason: "",
                              shotId: ""
                            }), oe("issue");
                          },
                          children: [/* @__PURE__ */ (0, l.jsx)(si, { size: 15 }), "記錄退修"]
                        }), /* @__PURE__ */ (0, l.jsxs)("div", { children: [/* @__PURE__ */ (0, l.jsxs)("button", {
                          className: "btn",
                          disabled: H || v.archived || !Z,
                          onClick: () => {
                            je("save_stage", {
                              stageId: y,
                              checks: j,
                              evidence: ye,
                              note: g
                            });
                          },
                          children: [
                            H ? /* @__PURE__ */ (0, l.jsx)(Jr, {
                              size: 15,
                              className: "spin"
                            }) : null,
                            "儲存草稿",
                            Z ? " *" : ""
                          ]
                        }), /* @__PURE__ */ (0, l.jsxs)("button", {
                          className: "btn primary",
                          disabled: H || v.archived || Z || We.length > 0 || !!Se.author,
                          onClick: () => {
                            je("approve_stage", {
                              stageId: y,
                              note: "作者已核對產出與全部驗收條件"
                            });
                          },
                          children: [/* @__PURE__ */ (0, l.jsx)(gl, { size: 15 }), Se.author ? "已正式核定" : "作者確認通過"]
                        })] })]
                      }),
                      !Se.author && /* @__PURE__ */ (0, l.jsx)("div", {
                        className: "gate-reasons",
                        children: Ut ? "本集維持作者告知完成；此處保存逐項檢視依據，不要求重新確認整集。" : Z ? "先儲存修改，再確認通過。" : We.length ? "待完成：" + We.join("；") : "已符合檢查條件，請實際檢視成果後確認通過。"
                      })
                    ]
                  }, y)]
                }),
                w === "main" && /* @__PURE__ */ (0, l.jsxs)("div", {
                  className: "principle",
                  children: [/* @__PURE__ */ (0, l.jsx)(tn, { size: 19 }), /* @__PURE__ */ (0, l.jsxs)("div", { children: [/* @__PURE__ */ (0, l.jsx)("b", { children: "發現問題，就回到造成問題的環節。" }), /* @__PURE__ */ (0, l.jsx)("p", { children: "更新已核定的製作依據時，相關下游階段會標為待修正。AI 初驗與作者核定各自留存。" })] })]
                }),
                /* @__PURE__ */ (0, l.jsxs)("details", {
                  className: "manual-rules",
                  children: [/* @__PURE__ */ (0, l.jsx)("summary", { children: "歷史製作經驗（不作為目前有效設定）" }), /* @__PURE__ */ (0, l.jsxs)("div", {
                    className: "manual-rule-content",
                    children: [
                      /* @__PURE__ */ (0, l.jsx)("h3", { children: "場景定位" }),
                      an.scenePosition.map((h) => /* @__PURE__ */ (0, l.jsx)("p", { children: h }, h)),
                      /* @__PURE__ */ (0, l.jsx)("h3", { children: "生圖提示詞順序" }),
                      /* @__PURE__ */ (0, l.jsx)("p", { children: an.imagePrompt }),
                      /* @__PURE__ */ (0, l.jsx)("h3", { children: "影片提示詞順序" }),
                      /* @__PURE__ */ (0, l.jsx)("p", { children: an.videoPrompt }),
                      /* @__PURE__ */ (0, l.jsx)("h3", { children: "失敗時回查" }),
                      an.repairs.map((h) => /* @__PURE__ */ (0, l.jsx)("p", { children: h }, h)),
                      /* @__PURE__ */ (0, l.jsx)("h3", { children: "本集專用條件" }),
                      /* @__PURE__ */ (0, l.jsx)("p", { children: "請從「本集規則與採用」取得指定版本；前一集的劇情條件不自動沿用。" }),
                      /* @__PURE__ */ (0, l.jsx)("h3", { children: "素材編號" }),
                      /* @__PURE__ */ (0, l.jsx)("p", { children: "每集保留自己的素材編號與明確對照，不依編號相近猜配。" }),
                      /* @__PURE__ */ (0, l.jsxs)("p", { children: ["後續檔名範例：", an.filenames.map((h) => h.replace("EP01", v.episode)).join("、")] })
                    ]
                  })]
                })
              ] }) : w === "shots" ? /* @__PURE__ */ (0, l.jsxs)("section", {
                className: "wide-card",
                children: [
                  /* @__PURE__ */ (0, l.jsxs)("div", {
                    className: "section-title",
                    children: [/* @__PURE__ */ (0, l.jsxs)("div", { children: [/* @__PURE__ */ (0, l.jsx)("h2", { children: "製作素材總表" }), /* @__PURE__ */ (0, l.jsx)("p", { children: "依鏡頭串起參考版本、素材位置、舊編號與成片時間。" })] }), /* @__PURE__ */ (0, l.jsxs)("button", {
                      className: "btn primary",
                      disabled: v.archived,
                      onClick: () => {
                        Ne({}), oe("shot");
                      },
                      children: [/* @__PURE__ */ (0, l.jsx)(Pt, { size: 16 }), "新增鏡頭"]
                    })]
                  }),
                  /* @__PURE__ */ (0, l.jsxs)("div", {
                    className: "search",
                    children: [/* @__PURE__ */ (0, l.jsx)(Ef, { size: 16 }), /* @__PURE__ */ (0, l.jsx)("input", {
                      "aria-label": "搜尋鏡頭",
                      placeholder: "搜尋場次、鏡頭 ID 或舊編號…",
                      value: p,
                      onChange: (h) => D(h.target.value)
                    })]
                  }),
                  v.shots.length ? /* @__PURE__ */ (0, l.jsx)("div", {
                    className: "table-scroll",
                    children: /* @__PURE__ */ (0, l.jsxs)("table", { children: [/* @__PURE__ */ (0, l.jsx)("thead", { children: /* @__PURE__ */ (0, l.jsxs)("tr", { children: [
                      /* @__PURE__ */ (0, l.jsx)("th", { children: "鏡頭／場次" }),
                      /* @__PURE__ */ (0, l.jsx)("th", { children: "內容與編號對照" }),
                      /* @__PURE__ */ (0, l.jsx)("th", { children: "參考版本" }),
                      /* @__PURE__ */ (0, l.jsx)("th", { children: "採用／剪輯版本" }),
                      /* @__PURE__ */ (0, l.jsx)("th", { children: "狀態" }),
                      /* @__PURE__ */ (0, l.jsx)("th", { children: "操作" })
                    ] }) }), /* @__PURE__ */ (0, l.jsx)("tbody", { children: v.shots.filter((h) => [
                      h.id,
                      h.scene,
                      h.description,
                      h.legacyIds
                    ].join(" ").includes(p)).map((h) => /* @__PURE__ */ (0, l.jsxs)("tr", { children: [
                      /* @__PURE__ */ (0, l.jsxs)("td", { children: [/* @__PURE__ */ (0, l.jsx)("b", { children: h.id }), /* @__PURE__ */ (0, l.jsx)("small", { children: h.scene })] }),
                      /* @__PURE__ */ (0, l.jsxs)("td", { children: [h.description, /* @__PURE__ */ (0, l.jsxs)("small", { children: [
                        h.legacyIds || "未填舊編號",
                        " · ",
                        h.versions.length + 1,
                        " 次紀錄"
                      ] })] }),
                      /* @__PURE__ */ (0, l.jsxs)("td", { children: [/* @__PURE__ */ (0, l.jsxs)("small", { children: ["劇本 ", h.scriptVersion || "—"] }), /* @__PURE__ */ (0, l.jsxs)("small", { children: [
                        "角色 ",
                        h.characterVersion || "—",
                        "／場景 ",
                        h.sceneVersion || "—"
                      ] })] }),
                      /* @__PURE__ */ (0, l.jsxs)("td", { children: [h.adoptedVersion || "尚未採用", /* @__PURE__ */ (0, l.jsxs)("small", { children: [
                        h.editorVersion || "—",
                        " · ",
                        h.inPoint || "—",
                        " → ",
                        h.outPoint || "—"
                      ] })] }),
                      /* @__PURE__ */ (0, l.jsx)("td", { children: /* @__PURE__ */ (0, l.jsx)("span", {
                        className: "status " + h.status,
                        children: lo[h.status]
                      }) }),
                      /* @__PURE__ */ (0, l.jsx)("td", { children: /* @__PURE__ */ (0, l.jsxs)("div", {
                        className: "table-actions",
                        children: [/* @__PURE__ */ (0, l.jsx)("button", {
                          className: "text-btn",
                          disabled: v.archived,
                          onClick: () => {
                            Ne(Object.fromEntries(vf.map(([ge]) => [ge, h[ge]]))), oe("shot");
                          },
                          children: "查看／編輯"
                        }), h.author ? h.status !== "in_timeline" ? /* @__PURE__ */ (0, l.jsx)("button", {
                          className: "text-btn",
                          disabled: H || v.archived,
                          onClick: () => {
                            je("timeline_shot", { shotId: h.id });
                          },
                          children: "確認已入片"
                        }) : null : /* @__PURE__ */ (0, l.jsx)("button", {
                          className: "text-btn",
                          disabled: H || v.archived,
                          onClick: () => {
                            je("approve_shot", { shotId: h.id });
                          },
                          children: "核定素材"
                        })]
                      }) })
                    ] }, h.id)) })] })
                  }) : /* @__PURE__ */ (0, l.jsxs)("div", {
                    className: "empty",
                    children: [
                      /* @__PURE__ */ (0, l.jsx)(Zr, { size: 32 }),
                      /* @__PURE__ */ (0, l.jsx)("h3", { children: "先建立一個實際鏡頭" }),
                      /* @__PURE__ */ (0, l.jsx)("p", { children: "不同來源的鏡號與素材編號填入對照欄，保留原始名稱。" })
                    ]
                  }),
                  /* @__PURE__ */ (0, l.jsx)("div", {
                    className: "inline-note",
                    children: "新版本會保留前次紀錄；填寫檔案位置不會上傳或覆寫原始素材。鏡頭更新後須重新核定。"
                  })
                ]
              }) : w === "issues" ? /* @__PURE__ */ (0, l.jsxs)("section", {
                className: "wide-card",
                children: [/* @__PURE__ */ (0, l.jsxs)("div", {
                  className: "section-title",
                  children: [/* @__PURE__ */ (0, l.jsxs)("div", { children: [/* @__PURE__ */ (0, l.jsx)("h2", { children: "退修與複核" }), /* @__PURE__ */ (0, l.jsx)("p", { children: "保留原因、受影響階段及修正結果。" })] }), /* @__PURE__ */ (0, l.jsxs)("button", {
                    className: "btn",
                    disabled: v.archived,
                    onClick: () => {
                      Ne({
                        stageId: "08",
                        reason: "",
                        shotId: ""
                      }), oe("issue");
                    },
                    children: [/* @__PURE__ */ (0, l.jsx)(Pt, { size: 16 }), "新增問題"]
                  })]
                }), v.issues.length ? /* @__PURE__ */ (0, l.jsx)("div", {
                  className: "issue-list",
                  children: [...v.issues].reverse().map((h) => /* @__PURE__ */ (0, l.jsxs)("article", {
                    className: "issue-card",
                    children: [
                      /* @__PURE__ */ (0, l.jsxs)("div", {
                        className: "issue-top",
                        children: [
                          /* @__PURE__ */ (0, l.jsx)("span", {
                            className: "status " + (h.status === "open" ? "needs_revision" : "passed"),
                            children: h.status === "open" ? "待修正" : "已複核結案"
                          }),
                          /* @__PURE__ */ (0, l.jsxs)("b", { children: [
                            h.stageId,
                            " ",
                            Kt.find((ge) => ge.id === h.stageId)?.title,
                            " ",
                            h.shotId ? "／" + h.shotId : ""
                          ] }),
                          /* @__PURE__ */ (0, l.jsx)("time", { children: ii(h.at) })
                        ]
                      }),
                      /* @__PURE__ */ (0, l.jsx)("p", { children: h.reason }),
                      /* @__PURE__ */ (0, l.jsx)("small", { children: h.by }),
                      h.resolution && /* @__PURE__ */ (0, l.jsxs)("div", {
                        className: "resolution",
                        children: [/* @__PURE__ */ (0, l.jsx)(ws, { size: 15 }), h.resolution]
                      }),
                      h.status === "open" && /* @__PURE__ */ (0, l.jsx)("button", {
                        className: "btn",
                        disabled: v.archived,
                        onClick: () => {
                          Ne({
                            issueId: h.id,
                            resolution: ""
                          }), oe("resolve");
                        },
                        children: "填寫修正並複核"
                      })
                    ]
                  }, h.id))
                }) : /* @__PURE__ */ (0, l.jsxs)("div", {
                  className: "empty",
                  children: [
                    /* @__PURE__ */ (0, l.jsx)(ws, { size: 32 }),
                    /* @__PURE__ */ (0, l.jsx)("h3", { children: "目前沒有退修問題" }),
                    /* @__PURE__ */ (0, l.jsx)("p", { children: "發現問題時，請指定造成問題的階段。" })
                  ]
                })]
              }) : w === "chatgpt" ? /* @__PURE__ */ (0, l.jsx)(lx, {
                project: v,
                check: () => Ie("")
              }) : /* @__PURE__ */ (0, l.jsxs)("section", {
                className: "wide-card",
                children: [/* @__PURE__ */ (0, l.jsxs)("div", {
                  className: "section-title",
                  children: [/* @__PURE__ */ (0, l.jsxs)("div", { children: [/* @__PURE__ */ (0, l.jsx)("h2", { children: "製作異動紀錄" }), /* @__PURE__ */ (0, l.jsx)("p", { children: "作者與 ChatGPT 的更新分別標記，依時間保留。" })] }), /* @__PURE__ */ (0, l.jsxs)("span", {
                    className: "muted",
                    children: [v.audit.length, " 筆"]
                  })]
                }), /* @__PURE__ */ (0, l.jsx)("div", {
                  className: "audit-list",
                  children: [...v.audit].reverse().map((h, ge) => /* @__PURE__ */ (0, l.jsxs)("div", { children: [
                    /* @__PURE__ */ (0, l.jsx)("span", {
                      className: "audit-icon " + (h.actor === "ai" ? "ai" : ""),
                      children: h.actor === "ai" ? /* @__PURE__ */ (0, l.jsx)(Ir, { size: 17 }) : /* @__PURE__ */ (0, l.jsx)(gl, { size: 17 })
                    }),
                    /* @__PURE__ */ (0, l.jsxs)("div", { children: [/* @__PURE__ */ (0, l.jsxs)("b", { children: [
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
                      }[h.action] || h.action,
                      " ",
                      /* @__PURE__ */ (0, l.jsx)("span", { children: h.detail })
                    ] }), /* @__PURE__ */ (0, l.jsx)("small", { children: h.by })] }),
                    /* @__PURE__ */ (0, l.jsx)("time", { children: ii(h.at) })
                  ] }, ge))
                })]
              })
            ] }) : /* @__PURE__ */ (0, l.jsxs)("div", {
              className: "onboarding",
              children: [
                /* @__PURE__ */ (0, l.jsx)("div", {
                  className: "onboarding-icon",
                  children: /* @__PURE__ */ (0, l.jsx)(ci, { size: 34 })
                }),
                /* @__PURE__ */ (0, l.jsx)("div", {
                  className: "eyebrow",
                  children: "從製作依據開始"
                }),
                /* @__PURE__ */ (0, l.jsx)("h2", { children: "把動畫製作，串成可確認的流程。" }),
                /* @__PURE__ */ (0, l.jsxs)("p", { children: [
                  "十二個主線階段、OP 與 ED 支線，搭配素材對照與退修紀錄。",
                  /* @__PURE__ */ (0, l.jsx)("br", {}),
                  "ChatGPT 與你共用進度，正式驗收由你確認。"
                ] }),
                /* @__PURE__ */ (0, l.jsxs)("button", {
                  className: "btn primary",
                  onClick: () => {
                    Ne({
                      title: "現實遊戲",
                      episode: "EP01"
                    }), oe("create");
                  },
                  children: [/* @__PURE__ */ (0, l.jsx)(Pt, { size: 17 }), "建立第一個製作專案"]
                }),
                /* @__PURE__ */ (0, l.jsx)("div", {
                  className: "onboarding-grid",
                  children: Kt.filter((h) => h.group === "main").map((h) => /* @__PURE__ */ (0, l.jsxs)("div", { children: [/* @__PURE__ */ (0, l.jsx)("span", { children: h.id }), h.title] }, h.id))
                }),
                /* @__PURE__ */ (0, l.jsx)("small", { children: "建立時全部階段為待製作；請依實際成果補入完成紀錄。" })
              ]
            }),
            /* @__PURE__ */ (0, l.jsxs)("footer", { children: ["製作工作台 ", /* @__PURE__ */ (0, l.jsx)("span", { children: "工作紀錄自動保存版本 · v5.0" })] })
          ]
        })]
      }),
      P && /* @__PURE__ */ (0, l.jsxs)("div", {
        className: "toast",
        role: "status",
        children: [/* @__PURE__ */ (0, l.jsx)(ws, { size: 17 }), P]
      }),
      X && /* @__PURE__ */ (0, l.jsx)("div", {
        className: "modal-backdrop",
        onMouseDown: (h) => {
          h.target === h.currentTarget && !H && oe(null);
        },
        children: /* @__PURE__ */ (0, l.jsxs)("section", {
          className: "modal " + (X === "shot" ? "large" : ""),
          role: "dialog",
          "aria-modal": "true",
          "aria-label": X === "create" ? "建立製作專案" : X === "shot" ? "鏡頭素材紀錄" : "製作確認",
          children: [/* @__PURE__ */ (0, l.jsxs)("div", {
            className: "modal-head",
            children: [/* @__PURE__ */ (0, l.jsx)("h2", { children: X === "create" ? "建立製作專案" : X === "shot" ? "鏡頭素材紀錄" : X === "issue" ? "記錄退修問題" : X === "resolve" ? "修正與複核結果" : v?.archived ? "還原專案" : "封存專案" }), /* @__PURE__ */ (0, l.jsx)("button", {
              className: "icon-btn",
              "aria-label": "關閉視窗",
              disabled: H,
              onClick: () => oe(null),
              children: /* @__PURE__ */ (0, l.jsx)(sn, { size: 21 })
            })]
          }), /* @__PURE__ */ (0, l.jsxs)("form", {
            onSubmit: se,
            children: [
              X === "create" ? /* @__PURE__ */ (0, l.jsxs)(l.Fragment, { children: [/* @__PURE__ */ (0, l.jsx)("p", {
                className: "muted",
                children: "依手冊建立完整流程，從待製作開始記錄。"
              }), [["title", "專案名稱"], ["episode", "集數"]].map(([h, ge]) => /* @__PURE__ */ (0, l.jsxs)("label", {
                className: "form-field",
                children: [ge, /* @__PURE__ */ (0, l.jsx)("input", {
                  required: !0,
                  maxLength: h === "title" ? 200 : 60,
                  value: ne[h] || "",
                  onChange: (be) => Ne({
                    ...ne,
                    [h]: be.target.value
                  })
                })]
              }, h))] }) : X === "shot" ? /* @__PURE__ */ (0, l.jsxs)(l.Fragment, { children: [
                /* @__PURE__ */ (0, l.jsx)("p", {
                  className: "muted",
                  children: "修改既有鏡頭請使用相同 ID。系統保留前次紀錄，並要求重新驗收。"
                }),
                /* @__PURE__ */ (0, l.jsx)("div", {
                  className: "shot-form",
                  children: vf.map(([h, ge]) => /* @__PURE__ */ (0, l.jsxs)("label", {
                    className: "form-field",
                    children: [ge, /* @__PURE__ */ (0, l.jsx)("input", {
                      required: [
                        "id",
                        "scene",
                        "description"
                      ].includes(h),
                      maxLength: h === "id" ? 100 : 12e3,
                      value: ne[h] || "",
                      placeholder: h === "id" ? "如 EP01_S06_SH03" : "",
                      onChange: (be) => Ne({
                        ...ne,
                        [h]: be.target.value
                      })
                    })]
                  }, h))
                }),
                v?.shots.find((h) => h.id === ne.id)?.versions.length ? /* @__PURE__ */ (0, l.jsxs)("details", { children: [/* @__PURE__ */ (0, l.jsx)("summary", { children: "查看保留的舊版本" }), v.shots.find((h) => h.id === ne.id).versions.map((h, ge) => /* @__PURE__ */ (0, l.jsxs)("pre", { children: [
                  ii(h.at),
                  " · ",
                  h.by,
                  `
`,
                  JSON.stringify(h.data, null, 2)
                ] }, ge))] }) : null
              ] }) : X === "issue" ? /* @__PURE__ */ (0, l.jsxs)(l.Fragment, { children: [
                /* @__PURE__ */ (0, l.jsxs)("label", {
                  className: "form-field",
                  children: ["回查階段", /* @__PURE__ */ (0, l.jsx)("select", {
                    value: ne.stageId || "08",
                    onChange: (h) => Ne({
                      ...ne,
                      stageId: h.target.value
                    }),
                    children: Os(v).map((h) => /* @__PURE__ */ (0, l.jsxs)("option", {
                      value: h.id,
                      children: [
                        h.id,
                        " ",
                        h.title
                      ]
                    }, h.id))
                  })]
                }),
                /* @__PURE__ */ (0, l.jsxs)("label", {
                  className: "form-field",
                  children: ["受影響鏡頭（選填）", /* @__PURE__ */ (0, l.jsxs)("select", {
                    value: ne.shotId || "",
                    onChange: (h) => Ne({
                      ...ne,
                      shotId: h.target.value
                    }),
                    children: [/* @__PURE__ */ (0, l.jsx)("option", {
                      value: "",
                      children: "整個階段"
                    }), v.shots.map((h) => /* @__PURE__ */ (0, l.jsx)("option", { children: h.id }, h.id))]
                  })]
                }),
                /* @__PURE__ */ (0, l.jsxs)("label", {
                  className: "form-field",
                  children: ["具體問題與回查原因", /* @__PURE__ */ (0, l.jsx)("textarea", {
                    required: !0,
                    rows: 5,
                    value: ne.reason || "",
                    onChange: (h) => Ne({
                      ...ne,
                      reason: h.target.value
                    })
                  })]
                }),
                /* @__PURE__ */ (0, l.jsx)("p", {
                  className: "muted",
                  children: "此階段與受影響的下游核定將標為待修正，修正後重新驗收。"
                })
              ] }) : X === "resolve" ? /* @__PURE__ */ (0, l.jsxs)("label", {
                className: "form-field",
                children: ["已修正內容與複核依據", /* @__PURE__ */ (0, l.jsx)("textarea", {
                  required: !0,
                  rows: 6,
                  value: ne.resolution || "",
                  onChange: (h) => Ne({
                    ...ne,
                    resolution: h.target.value
                  })
                })]
              }) : /* @__PURE__ */ (0, l.jsxs)("p", { children: ["專案", v?.archived ? "還原後可繼續製作。" : "封存後會保留全部進度與紀錄，可隨時還原。"] }),
              V && /* @__PURE__ */ (0, l.jsx)("div", {
                className: "modal-error",
                role: "alert",
                children: V
              }),
              /* @__PURE__ */ (0, l.jsxs)("div", {
                className: "modal-actions",
                children: [/* @__PURE__ */ (0, l.jsx)("button", {
                  type: "button",
                  className: "btn",
                  disabled: H,
                  onClick: () => oe(null),
                  children: "取消"
                }), /* @__PURE__ */ (0, l.jsxs)("button", {
                  type: "submit",
                  className: "btn primary",
                  disabled: H,
                  children: [H ? /* @__PURE__ */ (0, l.jsx)(Jr, {
                    className: "spin",
                    size: 16
                  }) : null, X === "create" ? "建立專案" : X === "archive" ? v?.archived ? "還原專案" : "確認封存" : "儲存紀錄"]
                })]
              })
            ]
          })]
        })
      })
    ]
  });
}
var xl = {
  handbook: {
    title: "AI 員工守則",
    version: "v1.0",
    path: "docs/AI_EMPLOYEE_HANDBOOK_v1.0.md",
    summary: "所有 AI 接手專案前必讀：先查工作台、依權限執行、用證據驗證、留下可接續紀錄。",
    highlights: [
      "「繼續」應接續已有任務，不重新規劃",
      "送出指令不等於完成，無證據不得標 PASS",
      "留下完成事項、測試範圍、阻礙與下一步"
    ]
  },
  interview: {
    title: "App 開發需求訪談規範與問題模板",
    version: "v1.0",
    path: "docs/APP_REQUIREMENTS_INTERVIEW_v1.0.md",
    summary: "要開發新 App、網站或工具，先訪談使用者，再產出可核對的需求確認單。",
    highlights: [
      "先問用途、使用者、平台、流程與第一版重點",
      "逐輪追問資料、AI 權限、成本、離線和驗收",
      "36 個標準問題；依回答選問，不重問已確定事項"
    ]
  }
};
function jf(r) {
  return new URL(r, new URL("./", window.location.href)).href;
}
function xx(r) {
  const m = r.split(/\r?\n/), N = [];
  let f = !1, u = [];
  for (let E = 0; E < m.length; E++) {
    const v = m[E].trimEnd(), A = v.trim();
    if (A.startsWith("```")) {
      f && (N.push(/* @__PURE__ */ (0, l.jsx)("pre", {
        className: "essentials-code",
        children: u.join(`
`)
      }, "code" + E)), u = []), f = !f;
      continue;
    }
    if (f) {
      u.push(v);
      continue;
    }
    if (!A) continue;
    if (/^---+$/.test(A)) {
      N.push(/* @__PURE__ */ (0, l.jsx)("hr", {}, E));
      continue;
    }
    const w = A.match(/^(#{1,3})\s+(.+)$/);
    if (w) {
      const Q = w[2];
      N.push(w[1].length === 1 ? /* @__PURE__ */ (0, l.jsx)("h2", { children: Q }, E) : w[1].length === 2 ? /* @__PURE__ */ (0, l.jsx)("h3", { children: Q }, E) : /* @__PURE__ */ (0, l.jsx)("h4", { children: Q }, E));
      continue;
    }
    if (A.startsWith("|")) {
      let Q = [v], C = E + 1;
      for (; C < m.length && m[C].trim().startsWith("|"); ) Q.push(m[C++]);
      N.push(/* @__PURE__ */ (0, l.jsx)("pre", {
        className: "essentials-code",
        children: Q.join(`
`)
      }, E)), E = C - 1;
      continue;
    }
    if (A.startsWith(">")) {
      N.push(/* @__PURE__ */ (0, l.jsx)("blockquote", { children: A.replace(/^>\s?/, "") }, E));
      continue;
    }
    const _ = A.match(/^[-*]\s+(.+)$/), y = A.match(/^(\d+)\.\s+(.+)$/);
    if (_ || y) {
      N.push(/* @__PURE__ */ (0, l.jsxs)("p", {
        className: "essentials-list",
        children: [y ? y[1] + ". " : "• ", _ ? _[1] : y?.[2]]
      }, E));
      continue;
    }
    N.push(/* @__PURE__ */ (0, l.jsx)("p", { children: A }, E));
  }
  return N;
}
function gx() {
  const [r, m] = (0, S.useState)("handbook"), [N, f] = (0, S.useState)({}), [u, E] = (0, S.useState)({});
  (0, S.useEffect)(() => {
    const A = new AbortController();
    return Object.keys(xl).forEach(async (w) => {
      try {
        const _ = await fetch(jf(xl[w].path), {
          credentials: "same-origin",
          cache: "no-store",
          signal: A.signal
        });
        if (!_.ok) throw new Error("HTTP " + _.status);
        const y = await _.text();
        if (!y.includes(w === "handbook" ? "LIZHI-AI-RULES" : "LIZHI-APP-INTAKE")) throw new Error("文件版本或內容不符");
        A.signal.aborted || f((Q) => ({
          ...Q,
          [w]: y
        }));
      } catch (_) {
        A.signal.aborted || E((y) => ({
          ...y,
          [w]: "目前無法載入全文（" + _.message + "），請使用下方原始文件連結。"
        }));
      }
    }), () => A.abort();
  }, []);
  const v = xl[r];
  return /* @__PURE__ */ (0, l.jsxs)("section", {
    className: "essentials-root",
    "aria-label": "員工必知",
    children: [
      /* @__PURE__ */ (0, l.jsx)("div", {
        className: "page-heading",
        children: /* @__PURE__ */ (0, l.jsxs)("div", { children: [
          /* @__PURE__ */ (0, l.jsx)("div", {
            className: "eyebrow",
            children: "立之雲端庫 · 共用規範"
          }),
          /* @__PURE__ */ (0, l.jsx)("h1", { children: "員工必知" }),
          /* @__PURE__ */ (0, l.jsx)("p", { children: "讓每位接手工作的 AI 使用相同規範。文件存放在 GitHub，更新須保留版本；正式工作前仍須由 AI 實際讀取。" })
        ] })
      }),
      /* @__PURE__ */ (0, l.jsx)("div", {
        className: "essentials-grid",
        children: Object.keys(xl).map((A) => /* @__PURE__ */ (0, l.jsxs)("button", {
          type: "button",
          className: "essentials-card " + (r === A ? "selected" : ""),
          onClick: () => m(A),
          "aria-pressed": r === A,
          children: [A === "handbook" ? /* @__PURE__ */ (0, l.jsx)(gl, { size: 23 }) : /* @__PURE__ */ (0, l.jsx)(pm, { size: 23 }), /* @__PURE__ */ (0, l.jsxs)("span", { children: [/* @__PURE__ */ (0, l.jsx)("b", { children: xl[A].title }), /* @__PURE__ */ (0, l.jsxs)("small", { children: [
            xl[A].version,
            " · ",
            xl[A].summary
          ] })] })]
        }, A))
      }),
      /* @__PURE__ */ (0, l.jsxs)("article", {
        className: "wide-card essentials-document",
        children: [
          /* @__PURE__ */ (0, l.jsxs)("div", {
            className: "section-title",
            children: [/* @__PURE__ */ (0, l.jsxs)("div", { children: [/* @__PURE__ */ (0, l.jsxs)("h2", { children: [/* @__PURE__ */ (0, l.jsx)(nm, { size: 19 }), v.title] }), /* @__PURE__ */ (0, l.jsxs)("p", { children: [
              "文件編號：",
              r === "handbook" ? "LIZHI-AI-RULES" : "LIZHI-APP-INTAKE",
              " · ",
              v.version
            ] })] }), /* @__PURE__ */ (0, l.jsxs)("a", {
              className: "btn",
              href: jf(v.path),
              target: "_blank",
              rel: "noopener noreferrer",
              children: [/* @__PURE__ */ (0, l.jsx)(vm, { size: 14 }), "開啟原始文件"]
            })]
          }),
          /* @__PURE__ */ (0, l.jsx)("div", {
            className: "essentials-highlights",
            children: v.highlights.map((A) => /* @__PURE__ */ (0, l.jsxs)("p", { children: ["✓ ", A] }, A))
          }),
          u[r] && /* @__PURE__ */ (0, l.jsx)("p", {
            role: "status",
            className: "essentials-warning",
            children: u[r]
          }),
          N[r] ? /* @__PURE__ */ (0, l.jsx)("div", {
            className: "essentials-fulltext",
            children: xx(N[r])
          }) : !u[r] && /* @__PURE__ */ (0, l.jsx)("p", {
            className: "muted",
            children: "正在讀取正式文件全文…"
          })
        ]
      }),
      /* @__PURE__ */ (0, l.jsx)("p", {
        className: "muted",
        children: "此頁是規則查閱入口，不代表所有外部 AI 都已自動收到或遵守。個別 AI 須在接手任務時自行讀取並驗證版本。"
      })
    ]
  });
}
async function bx(r, m = () => window.open("about:blank", "_blank")) {
  const N = m();
  if (!N) throw Error("瀏覽器阻擋了原圖視窗，請允許此網站開啟新視窗後再試。");
  N.opener = null;
  try {
    N.location.replace(await r());
  } catch (f) {
    throw N.close(), f;
  }
}
var ks = {
  animation: "動畫製作",
  model: "3D 模型",
  software: "軟體開發",
  general: "一般專案"
}, yf = [
  "PLANNED",
  "IN_PROGRESS",
  "PASS",
  "FAIL",
  "BLOCKED",
  "NOT_TESTED"
], Ex = 10 * 1024 * 1024, vx = [
  "image/jpeg",
  "image/png",
  "image/webp"
];
function jx({ image: r, access: m, onEdit: N, onTrash: f, disabled: u, record: E }) {
  const [v, A] = (0, S.useState)(""), [w, _] = (0, S.useState)(""), [y, Q] = (0, S.useState)(!1);
  (0, S.useEffect)(() => {
    let te = !0;
    return m(r.id).then((ae) => {
      te && A(ae);
    }).catch((ae) => {
      te && _(ae.message);
    }), () => {
      te = !1;
    };
  }, [r.id, m]);
  async function C(te = !1) {
    Q(!0);
    try {
      if (!te) {
        await bx(() => m(r.id));
        return;
      }
      const ae = await m(r.id), K = await fetch(ae);
      if (!K.ok) throw Error("原圖下載失敗");
      const F = URL.createObjectURL(await K.blob()), le = document.createElement("a");
      le.href = F, le.download = r.name, le.click(), setTimeout(() => URL.revokeObjectURL(F), 1e3);
    } catch (ae) {
      _(ae.message);
    } finally {
      Q(!1);
    }
  }
  return /* @__PURE__ */ (0, l.jsxs)("article", {
    className: "project-image-card",
    children: [/* @__PURE__ */ (0, l.jsx)("button", {
      className: "project-image-preview",
      disabled: !v || y,
      onClick: () => {
        C();
      },
      "aria-label": "查看原圖：" + r.name,
      children: v ? /* @__PURE__ */ (0, l.jsx)("img", {
        loading: "lazy",
        src: v,
        alt: r.description || r.name,
        onError: () => _("圖片連結可能已過期，請按重新載入")
      }) : /* @__PURE__ */ (0, l.jsx)("span", { children: "讀取圖片…" })
    }), /* @__PURE__ */ (0, l.jsxs)("div", {
      className: "project-image-info",
      children: [
        /* @__PURE__ */ (0, l.jsx)("b", { children: r.name }),
        /* @__PURE__ */ (0, l.jsx)("p", { children: r.description || "尚未填寫說明" }),
        r.recordId && /* @__PURE__ */ (0, l.jsxs)("small", { children: [/* @__PURE__ */ (0, l.jsx)(Cs, { size: 12 }), E ? "紀錄：" + E.summary : "原連結紀錄目前未列於此版本"] }),
        /* @__PURE__ */ (0, l.jsxs)("small", { children: [
          (r.size / 1024 / 1024).toFixed(2),
          " MB · ",
          new Date(r.at).toLocaleDateString("zh-TW", { timeZone: "Asia/Taipei" })
        ] }),
        w && /* @__PURE__ */ (0, l.jsx)("p", {
          className: "red-text",
          role: "alert",
          children: w
        }),
        /* @__PURE__ */ (0, l.jsxs)("div", {
          className: "project-image-actions",
          children: [
            /* @__PURE__ */ (0, l.jsx)("button", {
              className: "text-btn",
              disabled: u,
              onClick: N,
              children: "說明／連結紀錄"
            }),
            /* @__PURE__ */ (0, l.jsx)("button", {
              className: "icon-btn",
              disabled: y,
              onClick: () => {
                C(!0);
              },
              "aria-label": "下載：" + r.name,
              children: /* @__PURE__ */ (0, l.jsx)(Ts, { size: 16 })
            }),
            /* @__PURE__ */ (0, l.jsx)("button", {
              className: "icon-btn danger",
              disabled: y || u,
              onClick: f,
              "aria-label": "刪除圖片：" + r.name,
              children: /* @__PURE__ */ (0, l.jsx)(ri, { size: 16 })
            })
          ]
        })
      ]
    })]
  });
}
function yx({ project: r, transport: m, onTrash: N, onSaved: f, onDirty: u, onBusy: E, recordFilter: v }) {
  const [A, w] = (0, S.useState)(!1), [_, y] = (0, S.useState)([]), [Q, C] = (0, S.useState)(""), [te, ae] = (0, S.useState)(v ?? ""), [K, F] = (0, S.useState)(""), [le, H] = (0, S.useState)(""), [ie, V] = (0, S.useState)(""), [W, P] = (0, S.useState)(!1), [xe, de] = (0, S.useState)(0), [J, j] = (0, S.useState)(null), [I, ye] = (0, S.useState)(v ?? ""), fe = (0, S.useRef)(null), g = (0, S.useRef)(r.revision);
  (0, S.useEffect)(() => {
    g.current = r.revision;
  }, [r.revision]), (0, S.useEffect)(() => (u(A || !!J), () => u(!1)), [
    A,
    J,
    u
  ]), (0, S.useEffect)(() => {
    if (!A && !J) return;
    const p = (D) => D.preventDefault();
    return window.addEventListener("beforeunload", p), () => window.removeEventListener("beforeunload", p);
  }, [A, J]);
  const ee = (0, S.useCallback)(async (p, D) => {
    const G = m ? await m("images", p, D) : await fetch("/api/images" + p, {
      cache: "no-store",
      ...D ? {
        method: "POST",
        ...D instanceof FormData ? { body: D } : {
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(D)
        }
      } : {}
    }), $ = await G.json();
    if (!G.ok) throw Error($.error || "圖片操作失敗");
    return $;
  }, [m]), Z = (0, S.useCallback)(async (p) => (await ee("?projectId=" + encodeURIComponent(r.id) + "&imageId=" + encodeURIComponent(p))).url, [
    ee,
    r.id,
    xe
  ]);
  function B(p) {
    if (!p) return;
    H("");
    const D = [];
    for (const G of Array.from(p)) {
      if (!vx.includes(G.type)) {
        H("只接受 JPG、PNG、WebP；其他格式請先轉換。");
        continue;
      }
      if (!G.size || G.size > 10485760) {
        H("每張圖片上限 10 MB；過大的圖片未加入。");
        continue;
      }
      D.push({
        file: G,
        key: crypto.randomUUID(),
        status: "waiting",
        error: ""
      });
    }
    y((G) => [...G, ...D]);
  }
  async function X() {
    P(!0), E(!0), H("");
    let p = !1;
    try {
      for (const D of _.filter((G) => G.status !== "saved")) {
        y(($) => $.map((pe) => pe.key === D.key ? {
          ...pe,
          status: "uploading",
          error: ""
        } : pe));
        const G = new FormData();
        for (const [$, pe] of Object.entries({
          projectId: r.id,
          revision: String(g.current),
          key: D.key,
          description: Q,
          recordId: te,
          stageId: K
        })) G.set($, pe);
        G.set("file", D.file, D.file.name);
        try {
          const $ = await ee("", G);
          g.current = $.revision, f($), y((pe) => pe.map((he) => he.key === D.key ? {
            ...he,
            status: "saved"
          } : he));
        } catch ($) {
          p = !0, y((pe) => pe.map((he) => he.key === D.key ? {
            ...he,
            status: "failed",
            error: $.message
          } : he)), H($.message);
          break;
        }
      }
      p || (V("圖片已存入此專案"), w(!1), y([]), C(""), de((D) => D + 1));
    } finally {
      P(!1), E(!1);
    }
  }
  async function oe(p) {
    if (p.preventDefault(), !!J) {
      P(!0), E(!0), H("");
      try {
        f(await ee("", {
          action: "update",
          projectId: r.id,
          revision: r.revision,
          key: crypto.randomUUID(),
          imageId: J.id,
          description: Q,
          recordId: te,
          stageId: K
        })), j(null), V("圖片說明與紀錄連結已保存");
      } catch (D) {
        H(D.message);
      } finally {
        P(!1), E(!1);
      }
    }
  }
  const ne = /* @__PURE__ */ (0, l.jsxs)(l.Fragment, { children: [/* @__PURE__ */ (0, l.jsx)("option", {
    value: "",
    children: "不連結紀錄"
  }), [...r.records].reverse().map((p) => /* @__PURE__ */ (0, l.jsx)("option", {
    value: p.id,
    children: p.summary.slice(0, 85)
  }, p.id))] }), Ne = r.images.filter((p) => !I || p.recordId === I);
  return /* @__PURE__ */ (0, l.jsxs)("section", {
    className: "wide-card project-images",
    children: [
      /* @__PURE__ */ (0, l.jsxs)("div", {
        className: "section-title",
        children: [/* @__PURE__ */ (0, l.jsxs)("div", { children: [/* @__PURE__ */ (0, l.jsx)("h2", { children: "專案圖片" }), /* @__PURE__ */ (0, l.jsx)("p", { children: "保存照片、參考圖與製作截圖，搭配說明和工作紀錄。" })] }), /* @__PURE__ */ (0, l.jsxs)("div", {
          className: "heading-actions",
          children: [/* @__PURE__ */ (0, l.jsx)("button", {
            className: "icon-btn bordered",
            disabled: W,
            "aria-label": "重新載入圖片",
            onClick: () => de((p) => p + 1),
            children: /* @__PURE__ */ (0, l.jsx)(cn, { size: 16 })
          }), /* @__PURE__ */ (0, l.jsxs)("button", {
            className: "btn primary",
            disabled: r.archived || W,
            onClick: () => {
              w(!0), j(null), C(""), ae(I), F(""), y([]), H("");
            },
            children: [/* @__PURE__ */ (0, l.jsx)(rf, { size: 17 }), "匯入圖片"]
          })]
        })]
      }),
      /* @__PURE__ */ (0, l.jsxs)("label", {
        className: "form-field",
        children: ["依工作紀錄查看", /* @__PURE__ */ (0, l.jsxs)("select", {
          "aria-label": "依工作紀錄查看圖片",
          value: I,
          onChange: (p) => ye(p.target.value),
          children: [/* @__PURE__ */ (0, l.jsx)("option", {
            value: "",
            children: "全部圖片"
          }), [...r.records].reverse().map((p) => /* @__PURE__ */ (0, l.jsx)("option", {
            value: p.id,
            children: p.summary.slice(0, 85)
          }, p.id))]
        })]
      }),
      ie && /* @__PURE__ */ (0, l.jsx)("p", {
        role: "status",
        className: "green-text",
        children: ie
      }),
      Ne.length ? /* @__PURE__ */ (0, l.jsx)("div", {
        className: "project-image-grid",
        children: Ne.map((p) => /* @__PURE__ */ (0, l.jsx)(jx, {
          image: p,
          access: Z,
          disabled: W || A || !!J,
          onTrash: () => N(p.id),
          record: r.records.find((D) => D.id === p.recordId),
          onEdit: () => {
            r.archived || (j(p), C(p.description), ae(p.recordId), F(p.stageId), H(""));
          }
        }, p.id + ":" + xe))
      }) : /* @__PURE__ */ (0, l.jsxs)("div", {
        className: "empty",
        children: [
          /* @__PURE__ */ (0, l.jsx)(rf, { size: 30 }),
          /* @__PURE__ */ (0, l.jsx)("h3", { children: I ? "這筆紀錄還沒有圖片" : "先匯入一張圖片" }),
          /* @__PURE__ */ (0, l.jsx)("p", { children: "支援 JPG、PNG、WebP，每張最多 10 MB。圖片原檔私有保存，重新整理後仍可查看。" })
        ]
      }),
      (A || J) && /* @__PURE__ */ (0, l.jsx)("div", {
        className: "modal-backdrop",
        children: /* @__PURE__ */ (0, l.jsxs)("section", {
          className: "modal",
          role: "dialog",
          "aria-modal": "true",
          "aria-label": A ? "匯入專案圖片" : "圖片說明與紀錄",
          children: [/* @__PURE__ */ (0, l.jsxs)("div", {
            className: "modal-head",
            children: [/* @__PURE__ */ (0, l.jsx)("h2", { children: A ? "匯入圖片" : "圖片說明與紀錄" }), /* @__PURE__ */ (0, l.jsx)("button", {
              className: "icon-btn",
              "aria-label": "關閉圖片表單",
              disabled: W,
              onClick: () => {
                window.confirm("放棄尚未儲存的表單？已成功上傳的圖片會保留。") && (w(!1), j(null));
              },
              children: /* @__PURE__ */ (0, l.jsx)(sn, { size: 20 })
            })]
          }), /* @__PURE__ */ (0, l.jsxs)("form", {
            onSubmit: (p) => {
              A ? (p.preventDefault(), X()) : oe(p);
            },
            children: [
              A && /* @__PURE__ */ (0, l.jsxs)(l.Fragment, { children: [
                /* @__PURE__ */ (0, l.jsxs)("label", {
                  className: "image-dropzone",
                  children: ["選擇圖片（可多選）", /* @__PURE__ */ (0, l.jsx)("input", {
                    ref: fe,
                    type: "file",
                    accept: "image/jpeg,image/png,image/webp",
                    multiple: !0,
                    disabled: W,
                    onChange: (p) => {
                      B(p.target.files), p.target.value = "";
                    }
                  })]
                }),
                /* @__PURE__ */ (0, l.jsx)("p", {
                  className: "muted",
                  children: "原檔保留，每張上限 10 MB。依序上傳；失敗時已完成的圖片仍會保存。"
                }),
                /* @__PURE__ */ (0, l.jsx)("ul", {
                  className: "image-upload-list",
                  children: _.map((p) => /* @__PURE__ */ (0, l.jsxs)("li", { children: [
                    /* @__PURE__ */ (0, l.jsx)("span", { children: p.file.name }),
                    /* @__PURE__ */ (0, l.jsx)("small", { children: {
                      waiting: "等待上傳",
                      uploading: "上傳中…",
                      saved: "已保存",
                      failed: "未完成"
                    }[p.status] }),
                    p.error && /* @__PURE__ */ (0, l.jsx)("p", {
                      role: "alert",
                      children: p.error
                    })
                  ] }, p.key))
                })
              ] }),
              /* @__PURE__ */ (0, l.jsxs)("label", {
                className: "form-field",
                children: [
                  "圖片說明",
                  A && _.length > 1 ? "（套用本次圖片）" : "",
                  /* @__PURE__ */ (0, l.jsx)("textarea", {
                    rows: 3,
                    maxLength: 3e3,
                    value: Q,
                    disabled: W,
                    onChange: (p) => C(p.target.value)
                  })
                ]
              }),
              /* @__PURE__ */ (0, l.jsxs)("label", {
                className: "form-field",
                children: ["連結工作紀錄", /* @__PURE__ */ (0, l.jsx)("select", {
                  value: te,
                  disabled: W,
                  onChange: (p) => ae(p.target.value),
                  children: ne
                })]
              }),
              /* @__PURE__ */ (0, l.jsxs)("label", {
                className: "form-field",
                children: ["所屬階段", /* @__PURE__ */ (0, l.jsxs)("select", {
                  value: K,
                  disabled: W,
                  onChange: (p) => F(p.target.value),
                  children: [/* @__PURE__ */ (0, l.jsx)("option", {
                    value: "",
                    children: "不指定階段"
                  }), r.stages.map((p) => /* @__PURE__ */ (0, l.jsxs)("option", {
                    value: p.id,
                    children: [
                      p.key,
                      " · ",
                      p.title
                    ]
                  }, p.id))]
                })]
              }),
              le && /* @__PURE__ */ (0, l.jsx)("p", {
                className: "modal-error",
                role: "alert",
                children: le
              }),
              /* @__PURE__ */ (0, l.jsxs)("div", {
                className: "modal-actions",
                children: [le && /* @__PURE__ */ (0, l.jsx)("button", {
                  className: "btn",
                  disabled: W,
                  type: "button",
                  onClick: async () => {
                    const p = m ? await m("workspace", "?view=managed&id=" + r.id) : await fetch("/api/workspace?view=managed&id=" + r.id);
                    if (p.ok) {
                      const D = await p.json();
                      g.current = D.revision, f(D), H("");
                    }
                  },
                  children: "重新讀取專案"
                }), /* @__PURE__ */ (0, l.jsx)("button", {
                  className: "btn primary",
                  disabled: W || A && !_.some((p) => p.status !== "saved"),
                  type: "submit",
                  children: W ? "保存中…" : A ? "上傳並保存" : "保存說明"
                })]
              })
            ]
          })]
        })
      })
    ]
  });
}
var Sx = {
  project: "專案",
  record: "工作紀錄",
  image: "圖片"
};
function zx({ request: r, onChange: m }) {
  const [N, f] = (0, S.useState)(null), [u, E] = (0, S.useState)(!1), [v, A] = (0, S.useState)(""), [w, _] = (0, S.useState)("");
  async function y() {
    E(!0);
    try {
      f(await r("trash", "")), A("");
    } catch (C) {
      A(C.message);
    } finally {
      E(!1);
    }
  }
  (0, S.useEffect)(() => {
    y();
  }, [r]);
  async function Q(C, te) {
    let ae = "";
    if (!(te === "purge" && (ae = window.prompt("永久刪除「" + C.title + "」後無法從工作台還原。既有備份與異動歷史仍保留。請輸入「永久刪除」確認。") ?? "", ae !== "永久刪除"))) {
      E(!0), A("");
      try {
        f(await r("trash", "", {
          action: te,
          trashId: C.id,
          projectId: C.projectId,
          projectRevision: C.projectRevision,
          revision: N?.revision,
          key: crypto.randomUUID(),
          confirm: ae
        })), _(te === "restore" ? "已還原，原有資料已保留" : "已永久刪除此項目"), m();
      } catch (K) {
        A(K.message);
        try {
          f(await r("trash", ""));
        } catch {
        }
      } finally {
        E(!1);
      }
    }
  }
  return /* @__PURE__ */ (0, l.jsxs)("section", {
    className: "wide-card recycle-bin",
    children: [
      /* @__PURE__ */ (0, l.jsxs)("div", {
        className: "section-title",
        children: [/* @__PURE__ */ (0, l.jsxs)("div", { children: [/* @__PURE__ */ (0, l.jsxs)("h1", { children: [/* @__PURE__ */ (0, l.jsx)(ri, { size: 24 }), "垃圾桶"] }), /* @__PURE__ */ (0, l.jsx)("p", { children: "刪除的專案、圖片和紀錄會先留在這裡，可以還原。永久刪除需再次確認。" })] }), /* @__PURE__ */ (0, l.jsxs)("button", {
          className: "btn",
          disabled: u,
          onClick: () => {
            y();
          },
          children: [/* @__PURE__ */ (0, l.jsx)(cn, { size: 16 }), "重新整理"]
        })]
      }),
      v && /* @__PURE__ */ (0, l.jsx)("p", {
        role: "alert",
        className: "modal-error",
        children: v
      }),
      w && /* @__PURE__ */ (0, l.jsx)("p", {
        role: "status",
        children: w
      }),
      N && !N.items.length && /* @__PURE__ */ (0, l.jsx)("div", {
        className: "empty",
        children: "垃圾桶是空的。"
      }),
      !N && !v && /* @__PURE__ */ (0, l.jsx)("p", { children: "讀取中…" }),
      N?.items.map((C) => /* @__PURE__ */ (0, l.jsxs)("article", {
        className: "journal-card",
        children: [
          /* @__PURE__ */ (0, l.jsx)("span", {
            className: "status",
            children: Sx[C.kind]
          }),
          /* @__PURE__ */ (0, l.jsx)("h3", { children: C.title }),
          /* @__PURE__ */ (0, l.jsxs)("p", { children: [
            C.projectName,
            " · ",
            new Date(C.at).toLocaleString("zh-TW", { timeZone: "Asia/Taipei" })
          ] }),
          C.parentDeleted && /* @__PURE__ */ (0, l.jsx)("p", {
            className: "muted",
            children: "請先還原所屬專案，再處理此項目。"
          }),
          C.purging && /* @__PURE__ */ (0, l.jsx)("p", {
            role: "status",
            children: "原圖永久刪除清理尚未完成；可以重試清理，無法還原。"
          }),
          !C.canPurge && /* @__PURE__ */ (0, l.jsx)("p", {
            className: "muted",
            children: "此專案連結動畫專業資料，或仍有圖片／垃圾桶項目。請保留於垃圾桶，或還原後先整理內容。"
          }),
          /* @__PURE__ */ (0, l.jsxs)("div", {
            className: "heading-actions",
            children: [/* @__PURE__ */ (0, l.jsxs)("button", {
              className: "btn",
              disabled: u || C.parentDeleted || C.purging,
              onClick: () => {
                Q(C, "restore");
              },
              children: [/* @__PURE__ */ (0, l.jsx)(kf, { size: 16 }), "還原"]
            }), /* @__PURE__ */ (0, l.jsxs)("button", {
              className: "btn danger",
              disabled: u || C.parentDeleted || !C.canPurge,
              onClick: () => {
                Q(C, "purge");
              },
              children: [/* @__PURE__ */ (0, l.jsx)(ri, { size: 16 }), C.purging ? "重試永久刪除" : "永久刪除"]
            })]
          })
        ]
      }, C.id))
    ]
  });
}
var Ft = {
  PLANNED: "規劃中",
  IN_PROGRESS: "進行中",
  PASS: "通過（有證據）",
  FAIL: "未通過",
  BLOCKED: "受阻",
  NOT_TESTED: "未測／待驗證",
  planning: "規劃中",
  in_progress: "進行中",
  blocked: "受阻",
  completed: "已完成",
  archived: "已封存",
  actual: "實際執行",
  simulation: "模擬測試",
  document: "文件檢查",
  not_run: "尚未執行"
}, io = (r) => new Date(r).toLocaleString("zh-TW", {
  timeZone: "Asia/Taipei",
  month: "numeric",
  day: "numeric",
  hour: "2-digit",
  minute: "2-digit"
});
function Sf({ url: r, children: m }) {
  return /^https?:\/\//i.test(r) ? /* @__PURE__ */ (0, l.jsxs)("a", {
    href: r,
    target: "_blank",
    rel: "noopener noreferrer",
    children: [m, " ↗"]
  }) : /* @__PURE__ */ (0, l.jsxs)("span", { children: [m, /* @__PURE__ */ (0, l.jsx)("small", {
    className: "preserve-text",
    children: r
  })] });
}
function Nx({ nativeTransport: r } = {}) {
  const [m, N] = (0, S.useState)([]), [f, u] = (0, S.useState)(null), [E, v] = (0, S.useState)("overview"), [A, w] = (0, S.useState)(""), [_, y] = (0, S.useState)("resume"), [Q, C] = (0, S.useState)(""), [te, ae] = (0, S.useState)(!0), [K, F] = (0, S.useState)(!1), [le, H] = (0, S.useState)(""), [ie, V] = (0, S.useState)(""), [W, P] = (0, S.useState)(""), [xe, de] = (0, S.useState)(!1), [J, j] = (0, S.useState)(!1), [I, ye] = (0, S.useState)(""), [fe, g] = (0, S.useState)({}), [ee, Z] = (0, S.useState)(!1), [B, X] = (0, S.useState)(!1), oe = (0, S.useRef)(""), ne = (0, S.useRef)(0), Ne = (0, S.useRef)(""), p = (0, S.useRef)(!1);
  Ne.current = I;
  const D = (0, S.useCallback)((o) => {
    p.current = o;
  }, []), G = (0, S.useCallback)(async (o, R, se) => {
    const qe = r ? await r(o, R, se) : await fetch("/api/" + o + R, {
      cache: "no-store",
      ...se ? {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(se)
      } : {}
    });
    if (!qe.headers.get("content-type")?.includes("application/json")) throw Error("請先登入立之雲端庫");
    const k = await qe.json();
    if (!qe.ok) throw Error(k.error || "讀取失敗");
    return k;
  }, [r]), $ = (0, S.useCallback)(async (o = oe.current) => {
    const R = ++ne.current;
    try {
      const se = await G("workspace", "?view=managed"), qe = o ? await G("workspace", "?view=managed&id=" + encodeURIComponent(o)) : null;
      if (R !== ne.current) return;
      N(se), Ne.current || u(qe), H("");
    } catch (se) {
      R === ne.current && H(se.message);
    } finally {
      R === ne.current && ae(!1);
    }
  }, [G]);
  (0, S.useEffect)(() => {
    $();
    const o = setInterval(() => {
      !Ne.current && !p.current && $();
    }, 3e4);
    return () => clearInterval(o);
  }, [$]), (0, S.useEffect)(() => {
    if (!I) return;
    const o = (R) => R.preventDefault();
    return window.addEventListener("beforeunload", o), () => window.removeEventListener("beforeunload", o);
  }, [I]), (0, S.useEffect)(() => {
    if (!ie) return;
    const o = setTimeout(() => V(""), 4500);
    return () => clearTimeout(o);
  }, [ie]);
  async function pe(o) {
    oe.current = o, u(null), ae(!0), v("overview"), Z(!1), await $(o);
  }
  function he() {
    p.current && !window.confirm("有尚未保存的圖片表單，確定離開？") || (p.current = !1, oe.current = "", ne.current++, u(null), w(""), Z(!1), X(!1), $(""));
  }
  function re(o, R = {}) {
    H(""), g({
      key: crypto.randomUUID(),
      type: "software",
      status: o === "record" ? "NOT_TESTED" : "PLANNED",
      mode: "not_run",
      stageId: f?.stages[0]?.id ?? "",
      evidenceIds: [],
      sourceIds: [],
      ...R
    }), ye(o);
  }
  async function Re(o, R) {
    if (!(!f && o !== "createManagedProject")) {
      ne.current++, F(!0);
      try {
        const se = await G("workspace", "", {
          action: o,
          id: f?.id,
          revision: f?.revision,
          args: R
        });
        return oe.current = se.id, u(se), ye(""), Ne.current = "", V("已保存並讀回最新專案"), await $(se.id), se;
      } catch (se) {
        H(se.message);
      } finally {
        F(!1);
      }
    }
  }
  async function _e(o, R) {
    if (!(!f || K) && !(p.current && !window.confirm("有尚未儲存的修改，確定放棄？")) && window.confirm("將此" + {
      project: "專案",
      record: "紀錄",
      image: "圖片"
    }[o] + "移到垃圾桶？之後可以還原。")) {
      p.current = !1, F(!0), ne.current++;
      try {
        const se = await G("trash", "");
        await G("trash", "", {
          action: "trash",
          kind: o,
          projectId: f.id,
          targetId: R,
          projectRevision: f.revision,
          revision: se.revision,
          key: crypto.randomUUID()
        }), o === "project" && (oe.current = "", u(null), X(!0)), await $(oe.current), V("已移到垃圾桶，可隨時還原");
      } catch (se) {
        H(se.message);
      } finally {
        F(!1);
      }
    }
  }
  async function ft(o) {
    o.preventDefault(), await Re({
      create: "createManagedProject",
      stage: "createProjectStage",
      task: fe.taskId ? "updateProjectTask" : "createProjectTask",
      record: "appendWorkRecord",
      artifact: "registerProjectArtifact",
      source: "registerProjectSource",
      issue: "reportProjectIssue",
      resolve: "resolveProjectIssue",
      edit: "updateManagedProject",
      restore: "restoreProjectBackup"
    }[I], {
      ...fe,
      ...I === "stage" ? { stageKey: fe.stageKey || fe.key } : I === "task" ? { taskKey: fe.taskKey || fe.key } : I === "artifact" ? { artifactKey: fe.artifactKey || fe.key } : I === "source" ? { sourceKey: fe.sourceKey || fe.key } : I === "issue" ? { issueKey: fe.issueKey || fe.key } : {}
    });
  }
  async function Ie() {
    if (f) {
      F(!0);
      try {
        const o = await G("workspace", "?view=managed&id=" + f.id);
        let R = null;
        if (f.animation) {
          const k = await G("works", "?id=" + f.animation.workId), Se = [];
          for (const We of f.animation.episodes) Se.push(await G("projects", "?id=" + We.id));
          R = {
            work: k.work,
            episodes: Se
          };
        }
        const se = URL.createObjectURL(new Blob([JSON.stringify({
          schemaVersion: 2,
          exportedAt: (/* @__PURE__ */ new Date()).toISOString(),
          project: o,
          animation: R
        }, null, 2)], { type: "application/json" })), qe = document.createElement("a");
        qe.href = se, qe.download = f.title.replace(/[\\/:*?"<>|]/g, "_") + "_專案備份.json", qe.click(), setTimeout(() => URL.revokeObjectURL(se), 1e3);
      } catch (o) {
        H(o.message);
      } finally {
        F(!1);
      }
    }
  }
  function Oe(o) {
    f?.workId && (y(o), w(f.workId));
  }
  function je(o, R, se = !1, qe = !1) {
    return /* @__PURE__ */ (0, l.jsxs)("label", {
      className: "form-field",
      children: [R, qe ? /* @__PURE__ */ (0, l.jsx)("textarea", {
        rows: 3,
        required: se,
        maxLength: o === "snapshot" ? 6e4 : 12e3,
        value: fe[o] ?? "",
        onChange: (k) => g({
          ...fe,
          [o]: k.target.value
        })
      }) : /* @__PURE__ */ (0, l.jsx)("input", {
        required: se,
        maxLength: o === "sha256" ? 64 : 2e3,
        value: fe[o] ?? "",
        onChange: (k) => g({
          ...fe,
          [o]: k.target.value
        })
      })]
    }, o);
  }
  function Ze(o, R, se) {
    return /* @__PURE__ */ (0, l.jsxs)("label", {
      className: "form-field",
      children: [R, /* @__PURE__ */ (0, l.jsx)("select", {
        value: fe[o] ?? "",
        onChange: (qe) => g({
          ...fe,
          [o]: qe.target.value,
          ...o === "stageId" ? { taskId: "" } : {}
        }),
        children: se.map(([qe, k]) => /* @__PURE__ */ (0, l.jsx)("option", {
          value: qe,
          children: k
        }, qe))
      })]
    });
  }
  function rt(o, R) {
    return /* @__PURE__ */ (0, l.jsxs)("fieldset", {
      className: "proof-picker",
      children: [/* @__PURE__ */ (0, l.jsx)("legend", { children: o === "evidenceIds" ? "成果證據" : "已讀來源" }), R.length ? R.map((se) => /* @__PURE__ */ (0, l.jsxs)("label", { children: [/* @__PURE__ */ (0, l.jsx)("input", {
        type: "checkbox",
        checked: (fe[o] ?? []).includes(se.id),
        onChange: (qe) => g({
          ...fe,
          [o]: qe.target.checked ? [...fe[o] ?? [], se.id] : (fe[o] ?? []).filter((k) => k !== se.id)
        })
      }), se.title] }, se.id)) : /* @__PURE__ */ (0, l.jsx)("small", { children: "先在成果分頁登記，僅貼連結不能作為已檢查證據。" })]
    });
  }
  return A && !ee ? /* @__PURE__ */ (0, l.jsxs)(l.Fragment, { children: [/* @__PURE__ */ (0, l.jsxs)("div", {
    className: "project-return",
    children: [/* @__PURE__ */ (0, l.jsxs)("button", {
      className: "text-btn",
      onClick: () => {
        p.current && !window.confirm("有未儲存的動畫或模型修改，確定離開？") || (p.current = !1, w(""), $());
      },
      children: [
        /* @__PURE__ */ (0, l.jsx)(sf, { size: 16 }),
        "返回 ",
        f?.title ?? "專案清單"
      ]
    }), /* @__PURE__ */ (0, l.jsx)("button", {
      className: "text-btn",
      onClick: () => {
        p.current && !window.confirm("有未儲存的動畫或模型修改，確定開啟員工必知？") || (p.current = !1, Z(!0));
      },
      children: "員工必知"
    })]
  }), /* @__PURE__ */ (0, l.jsx)(mx, {
    nativeTransport: r,
    initialWorkId: A === "legacy" ? void 0 : A,
    initialTab: _,
    onDirtyChange: D
  }, A + _)] }) : /* @__PURE__ */ (0, l.jsxs)("div", {
    className: "project-hub",
    children: [
      /* @__PURE__ */ (0, l.jsxs)("header", {
        className: "hub-header",
        children: [
          /* @__PURE__ */ (0, l.jsxs)("div", {
            className: "hub-brand",
            children: [/* @__PURE__ */ (0, l.jsx)(Kr, { size: 22 }), /* @__PURE__ */ (0, l.jsx)("b", { children: "製作工作台" })]
          }),
          /* @__PURE__ */ (0, l.jsxs)("button", {
            className: "btn",
            disabled: K || !!I,
            "aria-pressed": B,
            onClick: () => {
              p.current && !window.confirm("有未儲存修改，確定開啟垃圾桶？") || (p.current = !1, X((o) => !o), Z(!1));
            },
            children: [/* @__PURE__ */ (0, l.jsx)(ri, { size: 16 }), "垃圾桶"]
          }),
          /* @__PURE__ */ (0, l.jsx)("button", {
            className: "btn" + (ee ? " primary" : ""),
            type: "button",
            "aria-pressed": ee,
            onClick: () => {
              X(!1), Z((o) => !o);
            },
            children: "員工必知"
          }),
          /* @__PURE__ */ (0, l.jsx)("button", {
            className: "icon-btn",
            "aria-label": "重新整理",
            disabled: te || K || !!I,
            onClick: () => {
              $();
            },
            children: /* @__PURE__ */ (0, l.jsx)(cn, { size: 18 })
          })
        ]
      }),
      /* @__PURE__ */ (0, l.jsxs)("main", {
        className: "hub-main",
        children: [
          le && /* @__PURE__ */ (0, l.jsxs)("div", {
            role: "alert",
            className: "error-banner",
            children: [le, /* @__PURE__ */ (0, l.jsx)("button", {
              "aria-label": "關閉錯誤",
              onClick: () => H(""),
              children: /* @__PURE__ */ (0, l.jsx)(sn, { size: 16 })
            })]
          }),
          oe.current && /* @__PURE__ */ (0, l.jsxs)("button", {
            className: "text-btn hub-back",
            disabled: K,
            onClick: he,
            children: [/* @__PURE__ */ (0, l.jsx)(sf, { size: 16 }), "我的專案"]
          }),
          B ? /* @__PURE__ */ (0, l.jsx)(zx, {
            request: G,
            onChange: () => {
              $();
            }
          }) : ee ? /* @__PURE__ */ (0, l.jsx)(gx, {}) : te ? /* @__PURE__ */ (0, l.jsx)("div", {
            className: "empty",
            children: "讀取專案中…"
          }) : f ? /* @__PURE__ */ (0, l.jsxs)(l.Fragment, { children: [
            /* @__PURE__ */ (0, l.jsxs)("div", {
              className: "page-heading",
              children: [/* @__PURE__ */ (0, l.jsxs)("div", { children: [
                /* @__PURE__ */ (0, l.jsxs)("div", {
                  className: "eyebrow",
                  children: [
                    ks[f.kind],
                    " · ",
                    Ft[f.status]
                  ]
                }),
                /* @__PURE__ */ (0, l.jsx)("h1", { children: f.title }),
                /* @__PURE__ */ (0, l.jsx)("p", { children: f.objective || "先填寫這個專案的目標。" })
              ] }), /* @__PURE__ */ (0, l.jsxs)("div", {
                className: "heading-actions",
                children: [
                  /* @__PURE__ */ (0, l.jsxs)("button", {
                    className: "btn",
                    disabled: K,
                    onClick: () => {
                      Ie();
                    },
                    children: [/* @__PURE__ */ (0, l.jsx)(Ts, { size: 15 }), "匯出備份"]
                  }),
                  /* @__PURE__ */ (0, l.jsx)("button", {
                    className: "icon-btn bordered",
                    "aria-label": f.archived ? "還原專案" : "封存專案",
                    title: f.archived ? "還原專案" : "封存專案",
                    disabled: K,
                    onClick: () => {
                      Re("updateManagedProject", {
                        key: crypto.randomUUID(),
                        status: f.archived ? "in_progress" : "archived"
                      });
                    },
                    children: /* @__PURE__ */ (0, l.jsx)(Nf, { size: 17 })
                  }),
                  /* @__PURE__ */ (0, l.jsxs)("button", {
                    className: "btn danger",
                    disabled: K,
                    onClick: () => {
                      _e("project", f.id);
                    },
                    children: [/* @__PURE__ */ (0, l.jsx)(ri, { size: 16 }), "刪除專案"]
                  })
                ]
              })]
            }),
            /* @__PURE__ */ (0, l.jsx)("nav", {
              className: "hub-tabs",
              "aria-label": "專案內容",
              children: [
                ["overview", "總覽"],
                ["stages", "階段"],
                ["records", "紀錄"],
                ["images", "圖片"],
                ["artifacts", "成果"],
                ["issues", "問題"]
              ].map(([o, R]) => /* @__PURE__ */ (0, l.jsxs)("button", {
                className: E === o ? "active" : "",
                "aria-current": E === o ? "page" : void 0,
                disabled: K,
                onClick: () => {
                  p.current && !window.confirm("有尚未儲存的圖片表單，確定切換？") || (p.current = !1, C(""), v(o));
                },
                children: [R, o === "issues" && f.issues.some((se) => se.status === "open") ? " · " + f.issues.filter((se) => se.status === "open").length : ""]
              }, o))
            }),
            E === "overview" ? /* @__PURE__ */ (0, l.jsxs)(l.Fragment, { children: [
              /* @__PURE__ */ (0, l.jsxs)("section", {
                className: "handoff-card",
                children: [
                  /* @__PURE__ */ (0, l.jsxs)("div", {
                    className: "eyebrow",
                    children: ["目前階段 · ", f.handoff.currentStage?.title ?? "尚未設定"]
                  }),
                  /* @__PURE__ */ (0, l.jsx)("h2", { children: f.handoff.nextActions[0] ?? "先建立任務或記錄本次工作" }),
                  /* @__PURE__ */ (0, l.jsx)("p", { children: f.handoff.lastWork?.summary ?? "尚無通用工作紀錄。" }),
                  f.handoff.lastWork && /* @__PURE__ */ (0, l.jsxs)("span", {
                    className: "status",
                    children: [
                      Ft[f.handoff.lastWork.status],
                      " · ",
                      Ft[f.handoff.lastWork.mode]
                    ]
                  }),
                  /* @__PURE__ */ (0, l.jsx)("div", {
                    style: { marginTop: 18 },
                    children: /* @__PURE__ */ (0, l.jsxs)("button", {
                      className: "btn primary",
                      disabled: f.archived,
                      onClick: () => re("record"),
                      children: [/* @__PURE__ */ (0, l.jsx)(Pt, { size: 16 }), "記錄這次工作"]
                    })
                  })
                ]
              }),
              f.animation && /* @__PURE__ */ (0, l.jsxs)("div", {
                className: "hub-module-grid",
                children: [/* @__PURE__ */ (0, l.jsxs)("button", {
                  className: "module-card",
                  onClick: () => Oe("resume"),
                  children: [
                    /* @__PURE__ */ (0, l.jsx)(ci, { size: 26 }),
                    /* @__PURE__ */ (0, l.jsx)("h3", { children: "動畫製作" }),
                    /* @__PURE__ */ (0, l.jsxs)("p", { children: [f.animation.episodes.length, " 集 · 劇本、鏡頭、影格、OP／ED"] }),
                    /* @__PURE__ */ (0, l.jsx)("span", { children: "開啟動畫流程 →" })
                  ]
                }), /* @__PURE__ */ (0, l.jsxs)("button", {
                  className: "module-card",
                  onClick: () => Oe("models"),
                  children: [
                    /* @__PURE__ */ (0, l.jsx)(_m, { size: 26 }),
                    /* @__PURE__ */ (0, l.jsx)("h3", { children: "3D 模型" }),
                    /* @__PURE__ */ (0, l.jsxs)("p", { children: [f.animation.modelCount, " 個模型 · 來源、版本與驗收"] }),
                    /* @__PURE__ */ (0, l.jsx)("span", { children: "開啟模型流程 →" })
                  ]
                })]
              }),
              /* @__PURE__ */ (0, l.jsxs)("section", {
                className: "wide-card",
                children: [
                  /* @__PURE__ */ (0, l.jsxs)("div", {
                    className: "section-title",
                    children: [/* @__PURE__ */ (0, l.jsx)("h2", { children: "接手摘要" }), /* @__PURE__ */ (0, l.jsx)("button", {
                      className: "text-btn",
                      disabled: f.archived,
                      onClick: () => re("edit", {
                        name: f.title,
                        description: f.objective,
                        status: f.status
                      }),
                      children: "編輯專案"
                    })]
                  }),
                  /* @__PURE__ */ (0, l.jsxs)("p", { children: [
                    f.managedTasks.filter((o) => o.status !== "PASS").length,
                    " 項工作未完成 · ",
                    f.issues.filter((o) => o.status === "open").length,
                    " 項問題"
                  ] }),
                  /* @__PURE__ */ (0, l.jsx)("h3", { children: "操作限制" }),
                  f.restrictions.map((o, R) => /* @__PURE__ */ (0, l.jsx)("p", {
                    className: "muted",
                    children: o
                  }, R)),
                  /* @__PURE__ */ (0, l.jsxs)("details", { children: [
                    /* @__PURE__ */ (0, l.jsx)("summary", { children: "進階資訊與 AI 交接資料" }),
                    /* @__PURE__ */ (0, l.jsxs)("p", { children: [
                      "紀錄版本 ",
                      f.revision,
                      " · 更新於 ",
                      io(f.updatedAt)
                    ] }),
                    /* @__PURE__ */ (0, l.jsx)("pre", {
                      className: "hub-json",
                      children: JSON.stringify(f.handoff, null, 2)
                    }),
                    /* @__PURE__ */ (0, l.jsx)("h3", { children: "異動紀錄" }),
                    [...f.history].reverse().map((o, R) => /* @__PURE__ */ (0, l.jsxs)("p", {
                      className: "muted",
                      children: [
                        io(o.at),
                        " · ",
                        o.by,
                        " · ",
                        o.action
                      ]
                    }, R)),
                    /* @__PURE__ */ (0, l.jsxs)("label", {
                      className: "form-field",
                      children: ["回復本專案的通用資料備份", /* @__PURE__ */ (0, l.jsx)("input", {
                        type: "file",
                        accept: "application/json,.json",
                        disabled: K,
                        onChange: async (o) => {
                          try {
                            const R = o.target.files?.[0];
                            if (!R) return;
                            if (R.size > 24e6) throw Error("備份過大");
                            const se = JSON.parse(await R.text());
                            if (se.schemaVersion !== 2 || se.project?.id !== f.id) throw Error("請選取此專案的 v2 備份");
                            re("restore", { backup: se.project });
                          } catch (R) {
                            H(R.message);
                          }
                          o.target.value = "";
                        }
                      })]
                    })
                  ] })
                ]
              })
            ] }) : E === "stages" ? /* @__PURE__ */ (0, l.jsxs)(l.Fragment, { children: [/* @__PURE__ */ (0, l.jsxs)("div", {
              className: "section-title",
              children: [/* @__PURE__ */ (0, l.jsx)("h2", { children: "階段與工作項目" }), /* @__PURE__ */ (0, l.jsxs)("button", {
                className: "btn",
                disabled: f.archived,
                onClick: () => re("stage"),
                children: [/* @__PURE__ */ (0, l.jsx)(Pt, { size: 16 }), "新增階段"]
              })]
            }), f.stages.map((o) => /* @__PURE__ */ (0, l.jsxs)("section", {
              className: "wide-card stage-work-card",
              children: [/* @__PURE__ */ (0, l.jsxs)("div", {
                className: "section-title",
                children: [/* @__PURE__ */ (0, l.jsxs)("div", { children: [/* @__PURE__ */ (0, l.jsxs)("h3", { children: [
                  o.key,
                  " · ",
                  o.title
                ] }), /* @__PURE__ */ (0, l.jsx)("span", {
                  className: "status",
                  children: Ft[o.status]
                })] }), /* @__PURE__ */ (0, l.jsx)("button", {
                  className: "text-btn",
                  disabled: f.archived,
                  onClick: () => re("task", { stageId: o.id }),
                  children: "新增工作"
                })]
              }), f.managedTasks.filter((R) => R.stageId === o.id).map((R) => /* @__PURE__ */ (0, l.jsxs)("article", {
                className: "task-card",
                children: [
                  /* @__PURE__ */ (0, l.jsxs)("div", { children: [
                    /* @__PURE__ */ (0, l.jsx)("b", { children: R.title }),
                    /* @__PURE__ */ (0, l.jsx)("small", { children: Ft[R.status] }),
                    R.nextAction && /* @__PURE__ */ (0, l.jsxs)("p", { children: ["下一步：", R.nextAction] })
                  ] }),
                  /* @__PURE__ */ (0, l.jsx)("button", {
                    className: "text-btn",
                    disabled: f.archived,
                    onClick: () => re("record", {
                      stageId: o.id,
                      taskId: R.id,
                      summary: R.title
                    }),
                    children: "回報"
                  }),
                  /* @__PURE__ */ (0, l.jsx)("button", {
                    className: "text-btn",
                    disabled: f.archived,
                    onClick: () => re("task", {
                      ...R,
                      key: crypto.randomUUID(),
                      taskId: R.id
                    }),
                    children: "編輯"
                  })
                ]
              }, R.id))]
            }, o.id))] }) : E === "records" ? /* @__PURE__ */ (0, l.jsxs)("section", {
              className: "wide-card",
              children: [
                /* @__PURE__ */ (0, l.jsxs)("div", {
                  className: "section-title",
                  children: [/* @__PURE__ */ (0, l.jsxs)("div", { children: [/* @__PURE__ */ (0, l.jsx)("h2", { children: "執行紀錄" }), /* @__PURE__ */ (0, l.jsx)("p", { children: "計畫、模擬與實測分開保存；沒有證據不會轉成 PASS。" })] }), /* @__PURE__ */ (0, l.jsxs)("button", {
                    className: "btn primary",
                    disabled: f.archived,
                    onClick: () => re("record"),
                    children: [/* @__PURE__ */ (0, l.jsx)(Pt, { size: 16 }), "新增紀錄"]
                  })]
                }),
                !f.records.length && /* @__PURE__ */ (0, l.jsx)("div", {
                  className: "empty",
                  children: "還沒有工作紀錄。"
                }),
                [...f.records].reverse().map((o) => /* @__PURE__ */ (0, l.jsxs)("article", {
                  className: "journal-card",
                  children: [
                    /* @__PURE__ */ (0, l.jsxs)("div", {
                      className: "journal-meta",
                      children: [
                        /* @__PURE__ */ (0, l.jsx)("span", {
                          className: "result-badge " + o.status.toLowerCase(),
                          children: Ft[o.status]
                        }),
                        /* @__PURE__ */ (0, l.jsxs)("span", { children: [
                          Ft[o.mode],
                          " · ",
                          o.scope
                        ] }),
                        /* @__PURE__ */ (0, l.jsxs)("small", { children: [
                          io(o.at),
                          " · ",
                          o.by
                        ] })
                      ]
                    }),
                    /* @__PURE__ */ (0, l.jsx)("h3", { children: o.summary }),
                    /* @__PURE__ */ (0, l.jsxs)("dl", { children: [
                      /* @__PURE__ */ (0, l.jsx)("dt", { children: "方法與結果" }),
                      /* @__PURE__ */ (0, l.jsxs)("dd", { children: [
                        o.method,
                        `
`,
                        o.result
                      ] }),
                      /* @__PURE__ */ (0, l.jsx)("dt", { children: "證據" }),
                      /* @__PURE__ */ (0, l.jsx)("dd", { children: [...o.evidenceIds.map((R) => f.artifacts.find((se) => se.id === R)?.title), ...o.sourceIds.map((R) => f.sources.find((se) => se.id === R)?.title)].filter(Boolean).join("、") || "未附可核對證據" }),
                      /* @__PURE__ */ (0, l.jsx)("dt", { children: "下一步" }),
                      /* @__PURE__ */ (0, l.jsx)("dd", { children: o.nextStep }),
                      o.limitations && /* @__PURE__ */ (0, l.jsxs)(l.Fragment, { children: [/* @__PURE__ */ (0, l.jsx)("dt", { children: "限制" }), /* @__PURE__ */ (0, l.jsx)("dd", { children: o.limitations })] })
                    ] }),
                    /* @__PURE__ */ (0, l.jsxs)("button", {
                      className: "text-btn danger",
                      disabled: K,
                      onClick: () => {
                        _e("record", o.id);
                      },
                      children: [/* @__PURE__ */ (0, l.jsx)(ri, { size: 15 }), "刪除紀錄"]
                    }),
                    /* @__PURE__ */ (0, l.jsxs)("button", {
                      className: "text-btn",
                      onClick: () => {
                        C(o.id), v("images");
                      },
                      children: ["圖片 · ", f.images.filter((R) => R.recordId === o.id).length]
                    }),
                    o.requestedStatus !== o.status && /* @__PURE__ */ (0, l.jsxs)("p", {
                      className: "modal-error",
                      children: [
                        "原回報 ",
                        o.requestedStatus,
                        "；",
                        o.validationNote
                      ]
                    })
                  ]
                }, o.id))
              ]
            }) : E === "images" ? /* @__PURE__ */ (0, l.jsx)(yx, {
              project: f,
              transport: r,
              onTrash: (o) => {
                _e("image", o);
              },
              recordFilter: Q,
              onDirty: D,
              onBusy: F,
              onSaved: (o) => {
                ne.current++, u(o);
              }
            }, f.id + Q) : E === "artifacts" ? /* @__PURE__ */ (0, l.jsxs)("section", {
              className: "wide-card",
              children: [
                /* @__PURE__ */ (0, l.jsxs)("div", {
                  className: "section-title",
                  children: [/* @__PURE__ */ (0, l.jsx)("h2", { children: "成果與來源" }), /* @__PURE__ */ (0, l.jsxs)("div", {
                    className: "heading-actions",
                    children: [/* @__PURE__ */ (0, l.jsx)("button", {
                      className: "btn",
                      disabled: f.archived,
                      onClick: () => re("source"),
                      children: "登記來源"
                    }), /* @__PURE__ */ (0, l.jsxs)("button", {
                      className: "btn primary",
                      disabled: f.archived,
                      onClick: () => re("artifact"),
                      children: [/* @__PURE__ */ (0, l.jsx)(Pt, { size: 16 }), "登記成果"]
                    })]
                  })]
                }),
                !f.artifacts.length && /* @__PURE__ */ (0, l.jsx)("p", {
                  className: "muted",
                  children: "尚無成果；檔案位置只是引用，需檢查內容及雜湊才能作為 PASS 證據。"
                }),
                f.artifacts.map((o) => /* @__PURE__ */ (0, l.jsxs)("article", {
                  className: "journal-card",
                  children: [
                    /* @__PURE__ */ (0, l.jsx)("h3", { children: /* @__PURE__ */ (0, l.jsx)(Sf, {
                      url: o.location,
                      children: o.title
                    }) }),
                    /* @__PURE__ */ (0, l.jsxs)("p", { children: [
                      o.version,
                      " · ",
                      o.availability === "inspected" ? "已檢查（執行者回報）" : "僅登記位置"
                    ] }),
                    /* @__PURE__ */ (0, l.jsx)("p", {
                      className: "preserve-text",
                      children: o.inspection
                    }),
                    /* @__PURE__ */ (0, l.jsxs)("details", { children: [/* @__PURE__ */ (0, l.jsx)("summary", { children: "版本與雜湊" }), /* @__PURE__ */ (0, l.jsx)("code", { children: o.sha256 || "未提供" })] })
                  ]
                }, o.id)),
                /* @__PURE__ */ (0, l.jsx)("h3", { children: "資料來源" }),
                f.sources.map((o) => /* @__PURE__ */ (0, l.jsxs)("article", {
                  className: "journal-card",
                  children: [
                    /* @__PURE__ */ (0, l.jsx)("b", { children: /* @__PURE__ */ (0, l.jsx)(Sf, {
                      url: o.location,
                      children: o.title
                    }) }),
                    /* @__PURE__ */ (0, l.jsxs)("p", { children: [
                      o.readStatus === "read" ? "已讀內容快照" : "未讀，只登記連結",
                      " · ",
                      o.version
                    ] }),
                    /* @__PURE__ */ (0, l.jsx)("p", { children: o.observation }),
                    /* @__PURE__ */ (0, l.jsxs)("details", { children: [
                      /* @__PURE__ */ (0, l.jsx)("summary", { children: "查看保存的來源內容" }),
                      /* @__PURE__ */ (0, l.jsx)("pre", {
                        className: "hub-json",
                        children: o.snapshot || "尚未讀取"
                      }),
                      /* @__PURE__ */ (0, l.jsx)("code", { children: o.sha256 })
                    ] })
                  ]
                }, o.id))
              ]
            }) : /* @__PURE__ */ (0, l.jsxs)("section", {
              className: "wide-card",
              children: [
                /* @__PURE__ */ (0, l.jsxs)("div", {
                  className: "section-title",
                  children: [/* @__PURE__ */ (0, l.jsx)("h2", { children: "問題與阻礙" }), /* @__PURE__ */ (0, l.jsx)("button", {
                    className: "btn primary",
                    disabled: f.archived,
                    onClick: () => re("issue"),
                    children: "新增問題"
                  })]
                }),
                !f.issues.length && /* @__PURE__ */ (0, l.jsx)("div", {
                  className: "empty",
                  children: "尚未登記問題。"
                }),
                f.issues.map((o) => /* @__PURE__ */ (0, l.jsxs)("article", {
                  className: "journal-card",
                  children: [
                    /* @__PURE__ */ (0, l.jsx)("span", {
                      className: "status",
                      children: o.status === "open" ? "待處理" : "已記錄解法"
                    }),
                    /* @__PURE__ */ (0, l.jsx)("h3", { children: o.title }),
                    /* @__PURE__ */ (0, l.jsx)("p", {
                      className: "preserve-text",
                      children: o.detail
                    }),
                    o.resolution && /* @__PURE__ */ (0, l.jsx)("p", {
                      className: "preserve-text",
                      children: o.resolution
                    }),
                    o.status === "open" && /* @__PURE__ */ (0, l.jsx)("button", {
                      className: "btn",
                      disabled: f.archived,
                      onClick: () => re("resolve", { issueId: o.id }),
                      children: "填寫處理結果"
                    })
                  ]
                }, o.id))
              ]
            })
          ] }) : /* @__PURE__ */ (0, l.jsxs)(l.Fragment, { children: [/* @__PURE__ */ (0, l.jsxs)("div", {
            className: "page-heading",
            children: [/* @__PURE__ */ (0, l.jsxs)("div", { children: [
              /* @__PURE__ */ (0, l.jsx)("div", {
                className: "eyebrow",
                children: "立之雲端庫"
              }),
              /* @__PURE__ */ (0, l.jsx)("h1", { children: J ? "專案範本" : "我的專案" }),
              /* @__PURE__ */ (0, l.jsx)("p", { children: "把目標、過程和成果放在同一個專案裡。" })
            ] }), /* @__PURE__ */ (0, l.jsxs)("div", {
              className: "heading-actions",
              children: [/* @__PURE__ */ (0, l.jsx)("button", {
                className: "btn",
                onClick: () => j(!J),
                children: J ? "我的專案" : "專案範本"
              }), /* @__PURE__ */ (0, l.jsxs)("button", {
                className: "btn primary",
                onClick: () => re("create"),
                children: [/* @__PURE__ */ (0, l.jsx)(Pt, { size: 17 }), "建立專案"]
              })]
            })]
          }), J ? /* @__PURE__ */ (0, l.jsx)("div", {
            className: "hub-project-grid",
            children: Object.entries(ks).map(([o, R]) => /* @__PURE__ */ (0, l.jsxs)("button", {
              className: "hub-project-card",
              onClick: () => re("create", { type: o }),
              children: [
                /* @__PURE__ */ (0, l.jsx)(Kr, { size: 24 }),
                /* @__PURE__ */ (0, l.jsx)("h2", { children: R }),
                /* @__PURE__ */ (0, l.jsx)("p", { children: o === "animation" ? "集數、共用模型與既有動畫專業流程。" : o === "model" ? "八個模型工作階段，保存來源、候選、檢查與交接。" : o === "software" ? "需求、設計、實作、測試、發布與維護。" : "自訂階段、任務、工作紀錄及交付。" }),
                /* @__PURE__ */ (0, l.jsx)("span", { children: "使用範本 →" })
              ]
            }, o))
          }) : /* @__PURE__ */ (0, l.jsxs)(l.Fragment, { children: [
            /* @__PURE__ */ (0, l.jsxs)("div", {
              className: "hub-filter",
              children: [/* @__PURE__ */ (0, l.jsxs)("label", {
                className: "search",
                children: [/* @__PURE__ */ (0, l.jsx)(Ef, { size: 16 }), /* @__PURE__ */ (0, l.jsx)("input", {
                  "aria-label": "搜尋專案",
                  placeholder: "搜尋專案",
                  value: W,
                  onChange: (o) => P(o.target.value)
                })]
              }), /* @__PURE__ */ (0, l.jsxs)("label", { children: [/* @__PURE__ */ (0, l.jsx)("input", {
                type: "checkbox",
                checked: xe,
                onChange: (o) => de(o.target.checked)
              }), " 顯示封存"] })]
            }),
            /* @__PURE__ */ (0, l.jsx)("div", {
              className: "hub-project-grid",
              children: m.filter((o) => (xe || !o.archived) && o.name.toLowerCase().includes(W.toLowerCase())).map((o) => /* @__PURE__ */ (0, l.jsxs)("button", {
                className: "hub-project-card",
                onClick: () => {
                  pe(o.id);
                },
                children: [
                  /* @__PURE__ */ (0, l.jsxs)("div", {
                    className: "project-card-top",
                    children: [o.type === "animation" ? /* @__PURE__ */ (0, l.jsx)(ci, { size: 24 }) : o.type === "software" ? /* @__PURE__ */ (0, l.jsx)(mm, { size: 24 }) : /* @__PURE__ */ (0, l.jsx)(Kr, { size: 24 }), /* @__PURE__ */ (0, l.jsx)("span", { children: ks[o.type] })]
                  }),
                  /* @__PURE__ */ (0, l.jsx)("h2", { children: o.name }),
                  /* @__PURE__ */ (0, l.jsxs)("p", { children: ["目前階段：", o.currentStage] }),
                  /* @__PURE__ */ (0, l.jsxs)("div", {
                    className: "project-card-next",
                    children: [
                      /* @__PURE__ */ (0, l.jsx)("small", { children: "最近工作" }),
                      /* @__PURE__ */ (0, l.jsx)("strong", { children: o.recentWork }),
                      /* @__PURE__ */ (0, l.jsx)("small", { children: "下一個待辦" }),
                      /* @__PURE__ */ (0, l.jsx)("strong", { children: o.nextAction })
                    ]
                  }),
                  /* @__PURE__ */ (0, l.jsxs)("div", {
                    className: "project-card-bottom",
                    children: [/* @__PURE__ */ (0, l.jsx)("span", {}), /* @__PURE__ */ (0, l.jsx)("span", { children: "開啟專案 →" })]
                  })
                ]
              }, o.id))
            }),
            !m.length && /* @__PURE__ */ (0, l.jsx)("div", {
              className: "empty",
              children: "尚無專案，請建立第一個專案。"
            }),
            /* @__PURE__ */ (0, l.jsxs)("details", {
              className: "hub-help",
              children: [/* @__PURE__ */ (0, l.jsx)("summary", { children: "舊版獨立單集紀錄" }), /* @__PURE__ */ (0, l.jsx)("button", {
                className: "text-btn",
                onClick: () => {
                  y("resume"), w("legacy");
                },
                children: "開啟舊版單集清單 →"
              })]
            })
          ] })] })
        ]
      }),
      /* @__PURE__ */ (0, l.jsx)("footer", {
        className: "hub-footer",
        children: "製作工作台 · v7.0"
      }),
      ie && /* @__PURE__ */ (0, l.jsx)("div", {
        role: "status",
        className: "toast",
        children: ie
      }),
      I && /* @__PURE__ */ (0, l.jsx)("div", {
        className: "modal-backdrop",
        children: /* @__PURE__ */ (0, l.jsxs)("section", {
          className: "modal",
          role: "dialog",
          "aria-modal": "true",
          "aria-label": "專案資料表單",
          children: [/* @__PURE__ */ (0, l.jsxs)("div", {
            className: "modal-head",
            children: [/* @__PURE__ */ (0, l.jsx)("h2", { children: {
              create: "建立專案",
              stage: "新增階段",
              task: "工作項目",
              record: "工作紀錄",
              artifact: "登記成果",
              source: "登記來源",
              issue: "登記問題",
              resolve: "問題處理",
              edit: "專案設定",
              restore: "回復備份"
            }[I] }), /* @__PURE__ */ (0, l.jsx)("button", {
              className: "icon-btn",
              "aria-label": "關閉表單",
              disabled: K,
              onClick: () => {
                window.confirm("確定放棄尚未儲存的表單？") && ye("");
              },
              children: /* @__PURE__ */ (0, l.jsx)(sn, { size: 20 })
            })]
          }), /* @__PURE__ */ (0, l.jsxs)("form", {
            onSubmit: ft,
            children: [
              I === "create" ? /* @__PURE__ */ (0, l.jsxs)(l.Fragment, { children: [
                Ze("type", "專案類型", Object.entries(ks)),
                je("name", "專案名稱", !0),
                je("description", "專案目標", !1, !0)
              ] }) : I === "stage" ? /* @__PURE__ */ (0, l.jsxs)(l.Fragment, { children: [je("stageKey", "階段編號（例如 M0）", !0), je("title", "階段名稱", !0)] }) : I === "edit" ? /* @__PURE__ */ (0, l.jsxs)(l.Fragment, { children: [
                f?.kind !== "animation" && je("name", "專案名稱", !0),
                je("description", "專案目標", !1, !0),
                Ze("status", "專案狀態", Object.entries(Ft).filter(([o]) => [
                  "planning",
                  "in_progress",
                  "blocked",
                  "completed"
                ].includes(o)))
              ] }) : I === "restore" ? /* @__PURE__ */ (0, l.jsx)("p", { children: "以新版本回復此專案的通用資料，保留回復前內容與異動紀錄。動畫及模型專業資料維持現況。" }) : I === "resolve" ? je("resolution", "處理方式與依據", !0, !0) : /* @__PURE__ */ (0, l.jsxs)(l.Fragment, { children: [[
                "task",
                "record",
                "issue",
                "artifact"
              ].includes(I) && Ze("stageId", "階段", [...I === "artifact" || I === "issue" ? [["", "不指定階段"]] : [], ...(f?.stages ?? []).map((o) => [o.id, o.key + " · " + o.title])]), I === "task" ? /* @__PURE__ */ (0, l.jsxs)(l.Fragment, { children: [
                je("title", "工作項目", !0),
                Ze("status", "目前狀態", yf.map((o) => [o, Ft[o]])),
                je("nextAction", "下一步", !1, !0),
                /* @__PURE__ */ (0, l.jsx)("p", {
                  className: "muted",
                  children: "選擇 PASS 仍需有此任務的測試紀錄及證據，否則保存為待驗證。"
                })
              ] }) : I === "record" ? /* @__PURE__ */ (0, l.jsxs)(l.Fragment, { children: [
                Ze("taskId", "對應工作", [["", "整個階段"], ...(f?.managedTasks ?? []).filter((o) => o.stageId === fe.stageId).map((o) => [o.id, o.title])]),
                Ze("status", "回報結果", yf.map((o) => [o, Ft[o]])),
                Ze("mode", "這次如何執行", [
                  "actual",
                  "simulation",
                  "document",
                  "not_run"
                ].map((o) => [o, Ft[o]])),
                je("scope", "測試／工作範圍（例如 ezdxf 或模擬 MCP）", !0),
                je("summary", "這次實際做了什麼", !0, !0),
                je("method", "檢查方法", !1, !0),
                je("result", "檢查結果", !1, !0),
                rt("evidenceIds", f?.artifacts ?? []),
                rt("sourceIds", f?.sources ?? []),
                je("limitations", "限制與未完成項目", !1, !0),
                je("nextStep", "下一位接手要做什麼", !0, !0),
                /* @__PURE__ */ (0, l.jsx)("p", {
                  className: "muted",
                  children: "無有效證據的 PASS 回報會保存為 NOT_TESTED；模擬通過不代表實機通過。"
                })
              ] }) : I === "artifact" ? /* @__PURE__ */ (0, l.jsxs)(l.Fragment, { children: [
                je("title", "成果名稱", !0),
                je("location", "成果檔案位置", !0),
                je("version", "成果版本"),
                Ze("availability", "檢查情形", [["reference", "只登記位置"], ["inspected", "已檢查內容"]]),
                je("sha256", "SHA-256", fe.availability === "inspected"),
                je("inspection", "實際檢查內容", fe.availability === "inspected", !0)
              ] }) : I === "source" ? /* @__PURE__ */ (0, l.jsxs)(l.Fragment, { children: [
                je("title", "來源名稱", !0),
                je("location", "來源位置", !0),
                je("version", "來源版本"),
                Ze("readStatus", "閱讀情形", [["reference", "未讀，只登記連結"], ["read", "已讀取內容"]]),
                je("snapshot", "讀取內容快照", fe.readStatus === "read", !0),
                je("sha256", "內容 SHA-256", fe.readStatus === "read"),
                je("observation", "閱讀觀察", fe.readStatus === "read", !0)
              ] }) : /* @__PURE__ */ (0, l.jsxs)(l.Fragment, { children: [je("title", "問題名稱", !0), je("detail", "問題、影響及缺少的條件", !0, !0)] })] }),
              le && /* @__PURE__ */ (0, l.jsx)("p", {
                className: "modal-error",
                role: "alert",
                children: le
              }),
              /* @__PURE__ */ (0, l.jsx)("div", {
                className: "modal-actions",
                children: /* @__PURE__ */ (0, l.jsx)("button", {
                  type: "submit",
                  className: "btn primary",
                  disabled: K,
                  children: K ? "儲存中…" : I === "restore" ? "回復成新版本" : "儲存並讀回"
                })
              })
            ]
          })]
        })
      })
    ]
  });
}
var wx = `
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

/* Project workspace */
.project-hub{min-height:80vh;background:var(--bg);color:var(--ink)}.hub-header{display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid var(--border);padding:18px 5%;background:white}.hub-brand{display:flex;align-items:center;gap:10px;color:var(--green);font-size:18px}.hub-main{max-width:1180px;margin:auto;padding:40px 32px}.hub-main h1{font-size:32px}.hub-back{margin-bottom:20px}.hub-filter{display:flex;align-items:center;gap:20px;margin-bottom:24px}.hub-filter .search{flex:1;margin:0;max-width:500px}.hub-filter>label:last-child{color:#62736b;font-size:12px}.hub-project-grid,.hub-module-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:22px}.hub-project-card,.module-card{font:inherit;text-align:left;color:inherit;background:white;border:1px solid var(--border);border-radius:16px;padding:26px;cursor:pointer;min-width:0;transition:border-color .15s,box-shadow .15s}.hub-project-card:hover,.module-card:hover{border-color:var(--green);box-shadow:0 5px 20px #2148360b}.project-card-top{display:flex;align-items:center;justify-content:space-between;color:var(--green);gap:15px}.project-card-top span{font-size:12px;background:var(--mint);border-radius:30px;padding:4px 12px}.hub-project-card h2{font-size:23px;margin:22px 0 8px}.hub-project-card p{color:#65766e;line-height:1.7;margin:0 0 18px;overflow-wrap:anywhere}.project-card-next{border-top:1px solid var(--border);padding:18px 0;margin-top:18px;display:grid;gap:5px}.project-card-next small{color:#76867e}.project-card-next strong{font-weight:500;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}.project-card-bottom{display:flex;justify-content:space-between;gap:12px;font-size:12px;color:#65766e}.project-card-bottom span:last-child{color:var(--green)}.hub-help{font-size:12px;color:#76867e;margin:25px 0}.hub-tabs{display:flex;gap:5px;border-bottom:1px solid var(--border);margin-bottom:24px;overflow:auto}.hub-tabs button{font:inherit;border:0;background:none;padding:12px 20px;white-space:nowrap;color:#687a70;border-bottom:2px solid transparent}.hub-tabs button.active{color:var(--green);border-bottom-color:var(--green);font-weight:700}.handoff-card{padding:28px;border:1px solid #d8e6dc;border-radius:16px;background:#edf4ef;margin-bottom:22px}.handoff-card h2{font-size:21px;white-space:pre-wrap;overflow-wrap:anywhere;margin:10px 0}.handoff-card p{white-space:pre-wrap;color:#52675a;margin-bottom:22px}.hub-module-grid{margin:0 0 22px}.module-card h3{font-size:19px;margin:12px 0 6px}.module-card p{color:#65766e;font-size:13px}.module-card span{display:block;color:var(--green);font-size:13px;margin-top:18px}.phase-chips{display:flex;flex-wrap:wrap;gap:8px;margin:12px 0}.phase-chips span{padding:5px 10px;border-radius:6px;background:var(--mint);color:var(--green);font-size:12px}.journal-card{padding:24px 0;border-top:1px solid var(--border);overflow-wrap:anywhere}.journal-card h3{white-space:pre-wrap;font-size:16px;margin:15px 0}.journal-meta{display:flex;align-items:center;gap:12px;flex-wrap:wrap}.journal-meta small{color:#74857b}.journal-card dl{margin:0;display:grid;grid-template-columns:100px minmax(0,1fr);gap:10px;font-size:13px}.journal-card dt{color:#74857b}.journal-card dd{margin:0;white-space:pre-wrap}.task-card{display:flex;align-items:flex-start;gap:14px;padding:20px 0;border-top:1px solid var(--border)}.task-card>div{flex:1;min-width:0}.task-card small{display:block;color:#74857b}.task-card p{white-space:pre-wrap;overflow-wrap:anywhere;font-size:13px}.hub-footer{padding:24px;text-align:center;color:#84928a;font-size:11px}.project-return{display:flex;justify-content:space-between;align-items:center;padding:12px 22px;border-bottom:1px solid var(--border);background:#edf4ef}.project-return span{font-size:12px;color:#65766e}.preserve-text{white-space:pre-wrap;overflow-wrap:anywhere}.project-hub .modal{max-height:85dvh;overflow-y:auto}.project-hub button:focus-visible{outline:2px solid var(--green);outline-offset:3px}@media(max-width:650px){.hub-main{padding:26px 16px}.hub-main h1{font-size:27px}.hub-project-grid,.hub-module-grid{grid-template-columns:1fr;gap:16px}.hub-project-card,.module-card{padding:22px}.hub-filter{align-items:stretch;flex-direction:column;gap:10px}.hub-header{padding:15px 18px}.hub-main .page-heading{gap:16px;flex-wrap:wrap}.hub-tabs button{padding:12px 15px}.project-return span{display:none}.journal-card dl{grid-template-columns:1fr;gap:5px}.journal-card dd{margin-bottom:8px}.handoff-card{padding:22px}.hub-project-card h2{margin-top:18px}}
.hub-json{white-space:pre-wrap;overflow-wrap:anywhere;word-break:break-word;max-height:450px;overflow-y:auto;font-size:12px;background:#f5f7f5;padding:16px;border-radius:8px}.hub-main code{overflow-wrap:anywhere;word-break:break-all}.stage-work-card{margin-bottom:18px}.result-badge{display:inline-block;border-radius:20px;padding:4px 10px;font-size:12px;background:#eef1ef;color:#5b6d61}.result-badge.pass{background:#e2f0e5;color:#28633b}.result-badge.fail,.result-badge.blocked{background:#fbe9e4;color:#a04433}.result-badge.not_tested{background:#fff1d5;color:#805c21}.proof-picker{border:1px solid var(--border);border-radius:8px;padding:12px;margin:14px 0}.proof-picker label{display:flex;gap:8px;margin:7px 0;font-size:12px}.proof-picker legend{font-size:13px}.hub-main details{margin-top:16px}.hub-main summary{cursor:pointer;color:var(--green)}.project-hub .modal code{overflow-wrap:anywhere}.hub-main .task-card{flex-wrap:wrap}.hub-main .task-card>div{min-width:160px}@media(max-width:650px){.hub-main .wide-card{padding:20px 16px}.hub-main .section-title{gap:12px;flex-wrap:wrap}.hub-main .heading-actions{gap:8px;flex-wrap:wrap}.hub-main .hub-tabs{gap:0}.hub-main .hub-tabs button{padding:12px 13px}.hub-main .journal-meta{font-size:12px}.project-hub .modal-backdrop{padding:12px}.project-hub .modal{width:100%;max-height:90dvh}}


/* Employee Essentials: shared policy documents, read-only and project-independent */
.essentials-root{display:grid;gap:20px}.essentials-root .page-heading{margin-bottom:0}.essentials-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}.essentials-card{display:flex;align-items:flex-start;gap:12px;width:100%;border:1px solid var(--border);background:#fff;padding:19px;border-radius:10px;text-align:left;color:var(--ink);cursor:pointer}.essentials-card svg{flex:none;color:var(--green)}.essentials-card.selected{border-color:var(--green);background:#f0f7f2}.essentials-card b{display:block;font-size:14px}.essentials-card small{display:block;color:var(--muted);font-size:11px;line-height:1.8;margin-top:7px}.essentials-document .section-title h2{display:flex;align-items:center;gap:9px;flex-wrap:wrap}.essentials-document .section-title .btn{display:inline-flex;align-items:center;gap:5px;text-decoration:none}.essentials-highlights{display:grid;gap:6px;background:#f6f9f5;padding:15px 18px;border-radius:8px;margin:16px 0;color:#456b50}.essentials-highlights p{font-size:12px;margin:0}.essentials-fulltext{max-height:65dvh;overflow-y:auto;border:1px solid var(--border);padding:18px 23px;border-radius:8px;background:#fdfefd;line-height:1.85;overflow-wrap:anywhere}.essentials-fulltext h2{font-size:19px;margin:20px 0 12px}.essentials-fulltext h3{font-size:16px;margin:19px 0 10px}.essentials-fulltext h4{font-size:13px;margin:15px 0 8px}.essentials-fulltext p,.essentials-fulltext blockquote{font-size:12px;margin:8px 0;white-space:pre-wrap}.essentials-fulltext blockquote{border-left:3px solid var(--green);padding-left:12px;color:var(--muted)}.essentials-fulltext hr{border:0;border-top:1px solid var(--border);margin:20px 0}.essentials-code{white-space:pre-wrap;overflow-x:auto;word-break:break-word;background:#eef3ef;padding:14px;border-radius:7px;font-size:11px}.essentials-list{padding-left:8px}.essentials-warning{color:#a16a37;background:#fff9ea;padding:13px;border-radius:7px}@media(max-width:650px){.essentials-grid{grid-template-columns:1fr}.essentials-card{padding:14px}.essentials-document{padding:15px}.essentials-fulltext{padding:14px;max-height:70dvh}.hub-header .btn{font-size:11px}}
.project-image-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:18px;margin-top:22px}.project-image-card{border:1px solid var(--border);border-radius:12px;overflow:hidden;min-width:0;background:#fff}.project-image-preview{border:0;background:#f0f3f0;width:100%;height:190px;display:grid;place-items:center;padding:0;cursor:zoom-in;color:var(--muted)}.project-image-preview img{width:100%;height:100%;object-fit:contain}.project-image-info{padding:15px}.project-image-info>b{display:block;font-size:13px;overflow-wrap:anywhere}.project-image-info p{white-space:pre-wrap;overflow-wrap:anywhere;font-size:13px;margin:8px 0}.project-image-info small{display:block;font-size:11px;color:#718176;margin:7px 0;overflow-wrap:anywhere;max-height:4em;overflow:hidden}.project-image-info small svg{display:inline;vertical-align:middle;margin-right:5px}.project-image-actions{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-top:10px}.image-dropzone{display:block;border:1px dashed #759982;border-radius:12px;padding:25px;background:#f5f8f5;font-weight:600}.image-dropzone input{display:block;max-width:100%;margin-top:14px;font-size:13px}.image-upload-list{list-style:none;margin:14px 0;padding:0;max-height:190px;overflow-y:auto}.image-upload-list li{padding:10px 0;border-bottom:1px solid var(--border);font-size:13px;overflow-wrap:anywhere}.image-upload-list li small{display:block;color:#6b7f71}.image-upload-list p{color:#a04433;margin:4px 0}.project-images>.form-field{max-width:500px}.hub-tabs{flex-wrap:wrap}@media(max-width:900px){.project-image-grid{grid-template-columns:repeat(2,minmax(0,1fr))}}@media(max-width:600px){.project-image-grid{grid-template-columns:1fr}.project-image-preview{height:240px}.image-dropzone{padding:18px}.project-images .section-title .heading-actions{width:100%;justify-content:flex-end}}

/* Reversible workbench deletion */
.danger{color:#b43737!important}.btn.danger{border-color:#d6a4a4}.recycle-bin h1{display:flex;align-items:center;gap:10px}.recycle-bin .heading-actions{flex-wrap:wrap}.hub-header{flex-wrap:wrap}

:host{display:block;--bg:#f7f8fa;--ink:#23322e;--muted:#85908b;--green:#326552;--border:#e4e9e6;--mint:#edf4ef;--font:'Noto Sans TC','Microsoft JhengHei',system-ui,sans-serif;color:var(--ink);font:14px/1.6 var(--font);background:var(--bg)}.native-production{min-width:0}.workspace{display:grid;grid-template-columns:230px minmax(0,1fr);min-height:calc(100dvh - 70px)}.sidebar{position:sticky;inset:auto;top:0;width:auto;height:calc(100dvh - 70px);overflow-y:auto;padding-top:20px}.brand{display:none}.main{margin-left:0!important}.topbar{height:48px}.page-content{padding:24px}.cloud-indicator{font-size:11px}.sidebar nav{max-height:none}.side-bottom{padding-top:20px}@media(max-width:850px){.workspace{grid-template-columns:185px minmax(0,1fr)}.page-content{padding:20px}}@media(max-width:600px){.workspace{display:block}.sidebar{position:relative;height:auto;padding:12px 16px 0}.main{margin:0}.topbar{display:none}.page-content{padding:20px 16px}.page-heading{margin-top:0}.page-heading p{max-width:none;font-size:12px}.sidebar .new-project{margin-bottom:6px}h1{font-size:24px}}`, _x = "https://hrdzywkihfqggiwjgavi.supabase.co/functions/v1/lizhi-production", As = /* @__PURE__ */ new WeakMap(), kx = async (r, m, N) => {
  const f = window.LizhiAuth;
  if (!f?.client) throw new Error("請先登入立之雲端庫");
  const { data: u, error: E } = await f.client.auth.getSession();
  if (E || !u.session?.access_token) throw new Error("登入已失效，請重新登入雲端庫");
  return fetch(_x + "/" + r + m, {
    cache: "no-store",
    headers: {
      Authorization: "Bearer " + u.session.access_token,
      apikey: window.LIZHI_SUPABASE_PUBLISHABLE_KEY,
      ...N && !(N instanceof FormData) ? { "Content-Type": "application/json" } : {}
    },
    ...N ? {
      method: "POST",
      body: N instanceof FormData ? N : JSON.stringify(N)
    } : {}
  });
};
function Ax(r) {
  if (As.has(r)) return;
  const m = r.attachShadow({ mode: "open" }), N = document.createElement("style");
  N.textContent = wx, m.append(N);
  const f = document.createElement("div");
  f.className = "native-production", m.append(f);
  const u = (0, Gm.createRoot)(f);
  As.set(r, u), u.render(/* @__PURE__ */ (0, l.jsx)(Nx, { nativeTransport: kx }));
}
function Tx(r) {
  As.get(r)?.unmount(), As.delete(r);
}
export {
  Ax as mount,
  Tx as unmount
};
