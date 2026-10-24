var la = (r, m) => () => (m || (r((m = { exports: {} }).exports, m), r = null), m.exports), Dh = /* @__PURE__ */ la(((r) => {
  function m(V, R) {
    var Y = V.length;
    V.push(R);
    e: for (; 0 < Y; ) {
      var pe = Y - 1 >>> 1, ue = V[pe];
      if (0 < d(ue, R)) V[pe] = R, V[Y] = ue, Y = pe;
      else break e;
    }
  }
  function C(V) {
    return V.length === 0 ? null : V[0];
  }
  function p(V) {
    if (V.length === 0) return null;
    var R = V[0], Y = V.pop();
    if (Y !== R) {
      V[0] = Y;
      e: for (var pe = 0, ue = V.length, Ae = ue >>> 1; pe < Ae; ) {
        var x = 2 * (pe + 1) - 1, H = V[x], Z = x + 1, ee = V[Z];
        if (0 > d(H, Y)) Z < ue && 0 > d(ee, H) ? (V[pe] = ee, V[Z] = Y, pe = Z) : (V[pe] = H, V[x] = Y, pe = x);
        else if (Z < ue && 0 > d(ee, Y)) V[pe] = ee, V[Z] = Y, pe = Z;
        else break e;
      }
    }
    return R;
  }
  function d(V, R) {
    var Y = V.sortIndex - R.sortIndex;
    return Y !== 0 ? Y : V.id - R.id;
  }
  if (r.unstable_now = void 0, typeof performance == "object" && typeof performance.now == "function") {
    var M = performance;
    r.unstable_now = function() {
      return M.now();
    };
  } else {
    var y = Date, L = y.now();
    r.unstable_now = function() {
      return y.now() - L;
    };
  }
  var T = [], k = [], z = 1, K = null, U = 3, ie = !1, fe = !1, J = !1, I = !1, oe = typeof setTimeout == "function" ? setTimeout : null, Q = typeof clearTimeout == "function" ? clearTimeout : null, de = typeof setImmediate < "u" ? setImmediate : null;
  function G(V) {
    for (var R = C(k); R !== null; ) {
      if (R.callback === null) p(k);
      else if (R.startTime <= V) p(k), R.sortIndex = R.expirationTime, m(T, R);
      else break;
      R = C(k);
    }
  }
  function W(V) {
    if (J = !1, G(V), !fe) if (C(T) !== null) fe = !0, P || (P = !0, ve());
    else {
      var R = C(k);
      R !== null && F(W, R.startTime - V);
    }
  }
  var P = !1, ae = -1, ce = 5, X = -1;
  function b() {
    return I ? !0 : !(r.unstable_now() - X < ce);
  }
  function le() {
    if (I = !1, P) {
      var V = r.unstable_now();
      X = V;
      var R = !0;
      try {
        e: {
          fe = !1, J && (J = !1, Q(ae), ae = -1), ie = !0;
          var Y = U;
          try {
            t: {
              for (G(V), K = C(T); K !== null && !(K.expirationTime > V && b()); ) {
                var pe = K.callback;
                if (typeof pe == "function") {
                  K.callback = null, U = K.priorityLevel;
                  var ue = pe(K.expirationTime <= V);
                  if (V = r.unstable_now(), typeof ue == "function") {
                    K.callback = ue, G(V), R = !0;
                    break t;
                  }
                  K === C(T) && p(T), G(V);
                } else p(T);
                K = C(T);
              }
              if (K !== null) R = !0;
              else {
                var Ae = C(k);
                Ae !== null && F(W, Ae.startTime - V), R = !1;
              }
            }
            break e;
          } finally {
            K = null, U = Y, ie = !1;
          }
          R = void 0;
        }
      } finally {
        R ? ve() : P = !1;
      }
    }
  }
  var ve;
  if (typeof de == "function") ve = function() {
    de(le);
  };
  else if (typeof MessageChannel < "u") {
    var Me = new MessageChannel(), g = Me.port2;
    Me.port1.onmessage = le, ve = function() {
      g.postMessage(null);
    };
  } else ve = function() {
    oe(le, 0);
  };
  function F(V, R) {
    ae = oe(function() {
      V(r.unstable_now());
    }, R);
  }
  r.unstable_IdlePriority = 5, r.unstable_ImmediatePriority = 1, r.unstable_LowPriority = 4, r.unstable_NormalPriority = 3, r.unstable_Profiling = null, r.unstable_UserBlockingPriority = 2, r.unstable_cancelCallback = function(V) {
    V.callback = null;
  }, r.unstable_forceFrameRate = function(V) {
    0 > V || 125 < V ? console.error("forceFrameRate takes a positive int between 0 and 125, forcing frame rates higher than 125 fps is not supported") : ce = 0 < V ? Math.floor(1e3 / V) : 5;
  }, r.unstable_getCurrentPriorityLevel = function() {
    return U;
  }, r.unstable_next = function(V) {
    switch (U) {
      case 1:
      case 2:
      case 3:
        var R = 3;
        break;
      default:
        R = U;
    }
    var Y = U;
    U = R;
    try {
      return V();
    } finally {
      U = Y;
    }
  }, r.unstable_requestPaint = function() {
    I = !0;
  }, r.unstable_runWithPriority = function(V, R) {
    switch (V) {
      case 1:
      case 2:
      case 3:
      case 4:
      case 5:
        break;
      default:
        V = 3;
    }
    var Y = U;
    U = V;
    try {
      return R();
    } finally {
      U = Y;
    }
  }, r.unstable_scheduleCallback = function(V, R, Y) {
    var pe = r.unstable_now();
    switch (typeof Y == "object" && Y !== null ? (Y = Y.delay, Y = typeof Y == "number" && 0 < Y ? pe + Y : pe) : Y = pe, V) {
      case 1:
        var ue = -1;
        break;
      case 2:
        ue = 250;
        break;
      case 5:
        ue = 1073741823;
        break;
      case 4:
        ue = 1e4;
        break;
      default:
        ue = 5e3;
    }
    return ue = Y + ue, V = {
      id: z++,
      callback: R,
      priorityLevel: V,
      startTime: Y,
      expirationTime: ue,
      sortIndex: -1
    }, Y > pe ? (V.sortIndex = Y, m(k, V), C(T) === null && V === C(k) && (J ? (Q(ae), ae = -1) : J = !0, F(W, Y - pe))) : (V.sortIndex = ue, m(T, V), fe || ie || (fe = !0, P || (P = !0, ve()))), V;
  }, r.unstable_shouldYield = b, r.unstable_wrapCallback = function(V) {
    var R = U;
    return function() {
      var Y = U;
      U = R;
      try {
        return V.apply(this, arguments);
      } finally {
        U = Y;
      }
    };
  };
})), Uh = /* @__PURE__ */ la(((r, m) => {
  m.exports = Dh();
})), Rh = /* @__PURE__ */ la(((r) => {
  var m = /* @__PURE__ */ Symbol.for("react.transitional.element"), C = /* @__PURE__ */ Symbol.for("react.portal"), p = /* @__PURE__ */ Symbol.for("react.fragment"), d = /* @__PURE__ */ Symbol.for("react.strict_mode"), M = /* @__PURE__ */ Symbol.for("react.profiler"), y = /* @__PURE__ */ Symbol.for("react.consumer"), L = /* @__PURE__ */ Symbol.for("react.context"), T = /* @__PURE__ */ Symbol.for("react.forward_ref"), k = /* @__PURE__ */ Symbol.for("react.suspense"), z = /* @__PURE__ */ Symbol.for("react.memo"), K = /* @__PURE__ */ Symbol.for("react.lazy"), U = /* @__PURE__ */ Symbol.for("react.activity"), ie = Symbol.iterator;
  function fe(x) {
    return x === null || typeof x != "object" ? null : (x = ie && x[ie] || x["@@iterator"], typeof x == "function" ? x : null);
  }
  var J = {
    isMounted: function() {
      return !1;
    },
    enqueueForceUpdate: function() {
    },
    enqueueReplaceState: function() {
    },
    enqueueSetState: function() {
    }
  }, I = Object.assign, oe = {};
  function Q(x, H, Z) {
    this.props = x, this.context = H, this.refs = oe, this.updater = Z || J;
  }
  Q.prototype.isReactComponent = {}, Q.prototype.setState = function(x, H) {
    if (typeof x != "object" && typeof x != "function" && x != null) throw Error("takes an object of state variables to update or a function which returns an object of state variables.");
    this.updater.enqueueSetState(this, x, H, "setState");
  }, Q.prototype.forceUpdate = function(x) {
    this.updater.enqueueForceUpdate(this, x, "forceUpdate");
  };
  function de() {
  }
  de.prototype = Q.prototype;
  function G(x, H, Z) {
    this.props = x, this.context = H, this.refs = oe, this.updater = Z || J;
  }
  var W = G.prototype = new de();
  W.constructor = G, I(W, Q.prototype), W.isPureReactComponent = !0;
  var P = Array.isArray;
  function ae() {
  }
  var ce = {
    H: null,
    A: null,
    T: null,
    S: null
  }, X = Object.prototype.hasOwnProperty;
  function b(x, H, Z) {
    var ee = Z.ref;
    return {
      $$typeof: m,
      type: x,
      key: H,
      ref: ee !== void 0 ? ee : null,
      props: Z
    };
  }
  function le(x, H) {
    return b(x.type, H, x.props);
  }
  function ve(x) {
    return typeof x == "object" && x !== null && x.$$typeof === m;
  }
  function Me(x) {
    var H = {
      "=": "=0",
      ":": "=2"
    };
    return "$" + x.replace(/[=:]/g, function(Z) {
      return H[Z];
    });
  }
  var g = /\/+/g;
  function F(x, H) {
    return typeof x == "object" && x !== null && x.key != null ? Me("" + x.key) : H.toString(36);
  }
  function V(x) {
    switch (x.status) {
      case "fulfilled":
        return x.value;
      case "rejected":
        throw x.reason;
      default:
        switch (typeof x.status == "string" ? x.then(ae, ae) : (x.status = "pending", x.then(function(H) {
          x.status === "pending" && (x.status = "fulfilled", x.value = H);
        }, function(H) {
          x.status === "pending" && (x.status = "rejected", x.reason = H);
        })), x.status) {
          case "fulfilled":
            return x.value;
          case "rejected":
            throw x.reason;
        }
    }
    throw x;
  }
  function R(x, H, Z, ee, S) {
    var $ = typeof x;
    ($ === "undefined" || $ === "boolean") && (x = null);
    var se = !1;
    if (x === null) se = !0;
    else switch ($) {
      case "bigint":
      case "string":
      case "number":
        se = !0;
        break;
      case "object":
        switch (x.$$typeof) {
          case m:
          case C:
            se = !0;
            break;
          case K:
            return se = x._init, R(se(x._payload), H, Z, ee, S);
        }
    }
    if (se) return S = S(x), se = ee === "" ? "." + F(x, 0) : ee, P(S) ? (Z = "", se != null && (Z = se.replace(g, "$&/") + "/"), R(S, H, Z, "", function(Je) {
      return Je;
    })) : S != null && (ve(S) && (S = le(S, Z + (S.key == null || x && x.key === S.key ? "" : ("" + S.key).replace(g, "$&/") + "/") + se)), H.push(S)), 1;
    se = 0;
    var ze = ee === "" ? "." : ee + ":";
    if (P(x)) for (var ye = 0; ye < x.length; ye++) ee = x[ye], $ = ze + F(ee, ye), se += R(ee, H, Z, $, S);
    else if (ye = fe(x), typeof ye == "function") for (x = ye.call(x), ye = 0; !(ee = x.next()).done; ) ee = ee.value, $ = ze + F(ee, ye++), se += R(ee, H, Z, $, S);
    else if ($ === "object") {
      if (typeof x.then == "function") return R(V(x), H, Z, ee, S);
      throw H = String(x), Error("Objects are not valid as a React child (found: " + (H === "[object Object]" ? "object with keys {" + Object.keys(x).join(", ") + "}" : H) + "). If you meant to render a collection of children, use an array instead.");
    }
    return se;
  }
  function Y(x, H, Z) {
    if (x == null) return x;
    var ee = [], S = 0;
    return R(x, ee, "", "", function($) {
      return H.call(Z, $, S++);
    }), ee;
  }
  function pe(x) {
    if (x._status === -1) {
      var H = x._result;
      H = H(), H.then(function(Z) {
        (x._status === 0 || x._status === -1) && (x._status = 1, x._result = Z);
      }, function(Z) {
        (x._status === 0 || x._status === -1) && (x._status = 2, x._result = Z);
      }), x._status === -1 && (x._status = 0, x._result = H);
    }
    if (x._status === 1) return x._result.default;
    throw x._result;
  }
  var ue = typeof reportError == "function" ? reportError : function(x) {
    if (typeof window == "object" && typeof window.ErrorEvent == "function") {
      var H = new window.ErrorEvent("error", {
        bubbles: !0,
        cancelable: !0,
        message: typeof x == "object" && x !== null && typeof x.message == "string" ? String(x.message) : String(x),
        error: x
      });
      if (!window.dispatchEvent(H)) return;
    } else if (typeof process == "object" && typeof process.emit == "function") {
      process.emit("uncaughtException", x);
      return;
    }
    console.error(x);
  }, Ae = {
    map: Y,
    forEach: function(x, H, Z) {
      Y(x, function() {
        H.apply(this, arguments);
      }, Z);
    },
    count: function(x) {
      var H = 0;
      return Y(x, function() {
        H++;
      }), H;
    },
    toArray: function(x) {
      return Y(x, function(H) {
        return H;
      }) || [];
    },
    only: function(x) {
      if (!ve(x)) throw Error("React.Children.only expected to receive a single React element child.");
      return x;
    }
  };
  r.Activity = U, r.Children = Ae, r.Component = Q, r.Fragment = p, r.Profiler = M, r.PureComponent = G, r.StrictMode = d, r.Suspense = k, r.__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE = ce, r.__COMPILER_RUNTIME = {
    __proto__: null,
    c: function(x) {
      return ce.H.useMemoCache(x);
    }
  }, r.cache = function(x) {
    return function() {
      return x.apply(null, arguments);
    };
  }, r.cacheSignal = function() {
    return null;
  }, r.cloneElement = function(x, H, Z) {
    if (x == null) throw Error("The argument must be a React element, but you passed " + x + ".");
    var ee = I({}, x.props), S = x.key;
    if (H != null) for ($ in H.key !== void 0 && (S = "" + H.key), H) !X.call(H, $) || $ === "key" || $ === "__self" || $ === "__source" || $ === "ref" && H.ref === void 0 || (ee[$] = H[$]);
    var $ = arguments.length - 2;
    if ($ === 1) ee.children = Z;
    else if (1 < $) {
      for (var se = Array($), ze = 0; ze < $; ze++) se[ze] = arguments[ze + 2];
      ee.children = se;
    }
    return b(x.type, S, ee);
  }, r.createContext = function(x) {
    return x = {
      $$typeof: L,
      _currentValue: x,
      _currentValue2: x,
      _threadCount: 0,
      Provider: null,
      Consumer: null
    }, x.Provider = x, x.Consumer = {
      $$typeof: y,
      _context: x
    }, x;
  }, r.createElement = function(x, H, Z) {
    var ee, S = {}, $ = null;
    if (H != null) for (ee in H.key !== void 0 && ($ = "" + H.key), H) X.call(H, ee) && ee !== "key" && ee !== "__self" && ee !== "__source" && (S[ee] = H[ee]);
    var se = arguments.length - 2;
    if (se === 1) S.children = Z;
    else if (1 < se) {
      for (var ze = Array(se), ye = 0; ye < se; ye++) ze[ye] = arguments[ye + 2];
      S.children = ze;
    }
    if (x && x.defaultProps) for (ee in se = x.defaultProps, se) S[ee] === void 0 && (S[ee] = se[ee]);
    return b(x, $, S);
  }, r.createRef = function() {
    return { current: null };
  }, r.forwardRef = function(x) {
    return {
      $$typeof: T,
      render: x
    };
  }, r.isValidElement = ve, r.lazy = function(x) {
    return {
      $$typeof: K,
      _payload: {
        _status: -1,
        _result: x
      },
      _init: pe
    };
  }, r.memo = function(x, H) {
    return {
      $$typeof: z,
      type: x,
      compare: H === void 0 ? null : H
    };
  }, r.startTransition = function(x) {
    var H = ce.T, Z = {};
    ce.T = Z;
    try {
      var ee = x(), S = ce.S;
      S !== null && S(Z, ee), typeof ee == "object" && ee !== null && typeof ee.then == "function" && ee.then(ae, ue);
    } catch ($) {
      ue($);
    } finally {
      H !== null && Z.types !== null && (H.types = Z.types), ce.T = H;
    }
  }, r.unstable_useCacheRefresh = function() {
    return ce.H.useCacheRefresh();
  }, r.use = function(x) {
    return ce.H.use(x);
  }, r.useActionState = function(x, H, Z) {
    return ce.H.useActionState(x, H, Z);
  }, r.useCallback = function(x, H) {
    return ce.H.useCallback(x, H);
  }, r.useContext = function(x) {
    return ce.H.useContext(x);
  }, r.useDebugValue = function() {
  }, r.useDeferredValue = function(x, H) {
    return ce.H.useDeferredValue(x, H);
  }, r.useEffect = function(x, H) {
    return ce.H.useEffect(x, H);
  }, r.useEffectEvent = function(x) {
    return ce.H.useEffectEvent(x);
  }, r.useId = function() {
    return ce.H.useId();
  }, r.useImperativeHandle = function(x, H, Z) {
    return ce.H.useImperativeHandle(x, H, Z);
  }, r.useInsertionEffect = function(x, H) {
    return ce.H.useInsertionEffect(x, H);
  }, r.useLayoutEffect = function(x, H) {
    return ce.H.useLayoutEffect(x, H);
  }, r.useMemo = function(x, H) {
    return ce.H.useMemo(x, H);
  }, r.useOptimistic = function(x, H) {
    return ce.H.useOptimistic(x, H);
  }, r.useReducer = function(x, H, Z) {
    return ce.H.useReducer(x, H, Z);
  }, r.useRef = function(x) {
    return ce.H.useRef(x);
  }, r.useState = function(x) {
    return ce.H.useState(x);
  }, r.useSyncExternalStore = function(x, H, Z) {
    return ce.H.useSyncExternalStore(x, H, Z);
  }, r.useTransition = function() {
    return ce.H.useTransition();
  }, r.version = "19.2.6";
})), no = /* @__PURE__ */ la(((r, m) => {
  m.exports = Rh();
})), qh = /* @__PURE__ */ la(((r) => {
  var m = no();
  function C(k) {
    var z = "https://react.dev/errors/" + k;
    if (1 < arguments.length) {
      z += "?args[]=" + encodeURIComponent(arguments[1]);
      for (var K = 2; K < arguments.length; K++) z += "&args[]=" + encodeURIComponent(arguments[K]);
    }
    return "Minified React error #" + k + "; visit " + z + " for the full message or use the non-minified dev environment for full errors and additional helpful warnings.";
  }
  function p() {
  }
  var d = {
    d: {
      f: p,
      r: function() {
        throw Error(C(522));
      },
      D: p,
      C: p,
      L: p,
      m: p,
      X: p,
      S: p,
      M: p
    },
    p: 0,
    findDOMNode: null
  }, M = /* @__PURE__ */ Symbol.for("react.portal");
  function y(k, z, K) {
    var U = 3 < arguments.length && arguments[3] !== void 0 ? arguments[3] : null;
    return {
      $$typeof: M,
      key: U == null ? null : "" + U,
      children: k,
      containerInfo: z,
      implementation: K
    };
  }
  var L = m.__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE;
  function T(k, z) {
    if (k === "font") return "";
    if (typeof z == "string") return z === "use-credentials" ? z : "";
  }
  r.__DOM_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE = d, r.createPortal = function(k, z) {
    var K = 2 < arguments.length && arguments[2] !== void 0 ? arguments[2] : null;
    if (!z || z.nodeType !== 1 && z.nodeType !== 9 && z.nodeType !== 11) throw Error(C(299));
    return y(k, z, null, K);
  }, r.flushSync = function(k) {
    var z = L.T, K = d.p;
    try {
      if (L.T = null, d.p = 2, k) return k();
    } finally {
      L.T = z, d.p = K, d.d.f();
    }
  }, r.preconnect = function(k, z) {
    typeof k == "string" && (z ? (z = z.crossOrigin, z = typeof z == "string" ? z === "use-credentials" ? z : "" : void 0) : z = null, d.d.C(k, z));
  }, r.prefetchDNS = function(k) {
    typeof k == "string" && d.d.D(k);
  }, r.preinit = function(k, z) {
    if (typeof k == "string" && z && typeof z.as == "string") {
      var K = z.as, U = T(K, z.crossOrigin), ie = typeof z.integrity == "string" ? z.integrity : void 0, fe = typeof z.fetchPriority == "string" ? z.fetchPriority : void 0;
      K === "style" ? d.d.S(k, typeof z.precedence == "string" ? z.precedence : void 0, {
        crossOrigin: U,
        integrity: ie,
        fetchPriority: fe
      }) : K === "script" && d.d.X(k, {
        crossOrigin: U,
        integrity: ie,
        fetchPriority: fe,
        nonce: typeof z.nonce == "string" ? z.nonce : void 0
      });
    }
  }, r.preinitModule = function(k, z) {
    if (typeof k == "string") if (typeof z == "object" && z !== null) {
      if (z.as == null || z.as === "script") {
        var K = T(z.as, z.crossOrigin);
        d.d.M(k, {
          crossOrigin: K,
          integrity: typeof z.integrity == "string" ? z.integrity : void 0,
          nonce: typeof z.nonce == "string" ? z.nonce : void 0
        });
      }
    } else z ?? d.d.M(k);
  }, r.preload = function(k, z) {
    if (typeof k == "string" && typeof z == "object" && z !== null && typeof z.as == "string") {
      var K = z.as, U = T(K, z.crossOrigin);
      d.d.L(k, K, {
        crossOrigin: U,
        integrity: typeof z.integrity == "string" ? z.integrity : void 0,
        nonce: typeof z.nonce == "string" ? z.nonce : void 0,
        type: typeof z.type == "string" ? z.type : void 0,
        fetchPriority: typeof z.fetchPriority == "string" ? z.fetchPriority : void 0,
        referrerPolicy: typeof z.referrerPolicy == "string" ? z.referrerPolicy : void 0,
        imageSrcSet: typeof z.imageSrcSet == "string" ? z.imageSrcSet : void 0,
        imageSizes: typeof z.imageSizes == "string" ? z.imageSizes : void 0,
        media: typeof z.media == "string" ? z.media : void 0
      });
    }
  }, r.preloadModule = function(k, z) {
    if (typeof k == "string") if (z) {
      var K = T(z.as, z.crossOrigin);
      d.d.m(k, {
        as: typeof z.as == "string" && z.as !== "script" ? z.as : void 0,
        crossOrigin: K,
        integrity: typeof z.integrity == "string" ? z.integrity : void 0
      });
    } else d.d.m(k);
  }, r.requestFormReset = function(k) {
    d.d.r(k);
  }, r.unstable_batchedUpdates = function(k, z) {
    return k(z);
  }, r.useFormState = function(k, z, K) {
    return L.H.useFormState(k, z, K);
  }, r.useFormStatus = function() {
    return L.H.useHostTransitionStatus();
  }, r.version = "19.2.6";
})), Hh = /* @__PURE__ */ la(((r, m) => {
  function C() {
    if (!(typeof __REACT_DEVTOOLS_GLOBAL_HOOK__ > "u" || typeof __REACT_DEVTOOLS_GLOBAL_HOOK__.checkDCE != "function"))
      try {
        __REACT_DEVTOOLS_GLOBAL_HOOK__.checkDCE(C);
      } catch (p) {
        console.error(p);
      }
  }
  C(), m.exports = qh();
})), Lh = /* @__PURE__ */ la(((r) => {
  var m = Uh(), C = no(), p = Hh();
  function d(e) {
    var t = "https://react.dev/errors/" + e;
    if (1 < arguments.length) {
      t += "?args[]=" + encodeURIComponent(arguments[1]);
      for (var a = 2; a < arguments.length; a++) t += "&args[]=" + encodeURIComponent(arguments[a]);
    }
    return "Minified React error #" + e + "; visit " + t + " for the full message or use the non-minified dev environment for full errors and additional helpful warnings.";
  }
  function M(e) {
    return !(!e || e.nodeType !== 1 && e.nodeType !== 9 && e.nodeType !== 11);
  }
  function y(e) {
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
  function L(e) {
    if (e.tag === 13) {
      var t = e.memoizedState;
      if (t === null && (e = e.alternate, e !== null && (t = e.memoizedState)), t !== null) return t.dehydrated;
    }
    return null;
  }
  function T(e) {
    if (e.tag === 31) {
      var t = e.memoizedState;
      if (t === null && (e = e.alternate, e !== null && (t = e.memoizedState)), t !== null) return t.dehydrated;
    }
    return null;
  }
  function k(e) {
    if (y(e) !== e) throw Error(d(188));
  }
  function z(e) {
    var t = e.alternate;
    if (!t) {
      if (t = y(e), t === null) throw Error(d(188));
      return t !== e ? null : e;
    }
    for (var a = e, l = t; ; ) {
      var i = a.return;
      if (i === null) break;
      var s = i.alternate;
      if (s === null) {
        if (l = i.return, l !== null) {
          a = l;
          continue;
        }
        break;
      }
      if (i.child === s.child) {
        for (s = i.child; s; ) {
          if (s === a) return k(i), e;
          if (s === l) return k(i), t;
          s = s.sibling;
        }
        throw Error(d(188));
      }
      if (a.return !== l.return) a = i, l = s;
      else {
        for (var c = !1, o = i.child; o; ) {
          if (o === a) {
            c = !0, a = i, l = s;
            break;
          }
          if (o === l) {
            c = !0, l = i, a = s;
            break;
          }
          o = o.sibling;
        }
        if (!c) {
          for (o = s.child; o; ) {
            if (o === a) {
              c = !0, a = s, l = i;
              break;
            }
            if (o === l) {
              c = !0, l = s, a = i;
              break;
            }
            o = o.sibling;
          }
          if (!c) throw Error(d(189));
        }
      }
      if (a.alternate !== l) throw Error(d(190));
    }
    if (a.tag !== 3) throw Error(d(188));
    return a.stateNode.current === a ? e : t;
  }
  function K(e) {
    var t = e.tag;
    if (t === 5 || t === 26 || t === 27 || t === 6) return e;
    for (e = e.child; e !== null; ) {
      if (t = K(e), t !== null) return t;
      e = e.sibling;
    }
    return null;
  }
  var U = Object.assign, ie = /* @__PURE__ */ Symbol.for("react.element"), fe = /* @__PURE__ */ Symbol.for("react.transitional.element"), J = /* @__PURE__ */ Symbol.for("react.portal"), I = /* @__PURE__ */ Symbol.for("react.fragment"), oe = /* @__PURE__ */ Symbol.for("react.strict_mode"), Q = /* @__PURE__ */ Symbol.for("react.profiler"), de = /* @__PURE__ */ Symbol.for("react.consumer"), G = /* @__PURE__ */ Symbol.for("react.context"), W = /* @__PURE__ */ Symbol.for("react.forward_ref"), P = /* @__PURE__ */ Symbol.for("react.suspense"), ae = /* @__PURE__ */ Symbol.for("react.suspense_list"), ce = /* @__PURE__ */ Symbol.for("react.memo"), X = /* @__PURE__ */ Symbol.for("react.lazy"), b = /* @__PURE__ */ Symbol.for("react.activity"), le = /* @__PURE__ */ Symbol.for("react.memo_cache_sentinel"), ve = Symbol.iterator;
  function Me(e) {
    return e === null || typeof e != "object" ? null : (e = ve && e[ve] || e["@@iterator"], typeof e == "function" ? e : null);
  }
  var g = /* @__PURE__ */ Symbol.for("react.client.reference");
  function F(e) {
    if (e == null) return null;
    if (typeof e == "function") return e.$$typeof === g ? null : e.displayName || e.name || null;
    if (typeof e == "string") return e;
    switch (e) {
      case I:
        return "Fragment";
      case Q:
        return "Profiler";
      case oe:
        return "StrictMode";
      case P:
        return "Suspense";
      case ae:
        return "SuspenseList";
      case b:
        return "Activity";
    }
    if (typeof e == "object") switch (e.$$typeof) {
      case J:
        return "Portal";
      case G:
        return e.displayName || "Context";
      case de:
        return (e._context.displayName || "Context") + ".Consumer";
      case W:
        var t = e.render;
        return e = e.displayName, e || (e = t.displayName || t.name || "", e = e !== "" ? "ForwardRef(" + e + ")" : "ForwardRef"), e;
      case ce:
        return t = e.displayName || null, t !== null ? t : F(e.type) || "Memo";
      case X:
        t = e._payload, e = e._init;
        try {
          return F(e(t));
        } catch {
        }
    }
    return null;
  }
  var V = Array.isArray, R = C.__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE, Y = p.__DOM_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE, pe = {
    pending: !1,
    data: null,
    method: null,
    action: null
  }, ue = [], Ae = -1;
  function x(e) {
    return { current: e };
  }
  function H(e) {
    0 > Ae || (e.current = ue[Ae], ue[Ae] = null, Ae--);
  }
  function Z(e, t) {
    Ae++, ue[Ae] = e.current, e.current = t;
  }
  var ee = x(null), S = x(null), $ = x(null), se = x(null);
  function ze(e, t) {
    switch (Z($, t), Z(S, e), Z(ee, null), t.nodeType) {
      case 9:
      case 11:
        e = (e = t.documentElement) && (e = e.namespaceURI) ? Af(e) : 0;
        break;
      default:
        if (e = t.tagName, t = t.namespaceURI) t = Af(t), e = kf(t, e);
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
    H(ee), Z(ee, e);
  }
  function ye() {
    H(ee), H(S), H($);
  }
  function Je(e) {
    e.memoizedState !== null && Z(se, e);
    var t = ee.current, a = kf(t, e.type);
    t !== a && (Z(S, e), Z(ee, a));
  }
  function Ge(e) {
    S.current === e && (H(ee), H(S)), se.current === e && (H(se), In._currentValue = pe);
  }
  var we, Xe;
  function xt(e) {
    if (we === void 0) try {
      throw Error();
    } catch (a) {
      var t = a.stack.trim().match(/\n( *(at )?)/);
      we = t && t[1] || "", Xe = -1 < a.stack.indexOf(`
    at`) ? " (<anonymous>)" : -1 < a.stack.indexOf("@") ? "@unknown:0:0" : "";
    }
    return `
` + we + e + Xe;
  }
  var gt = !1;
  function h(e, t) {
    if (!e || gt) return "";
    gt = !0;
    var a = Error.prepareStackTrace;
    Error.prepareStackTrace = void 0;
    try {
      var l = { DetermineComponentFrameRoot: function() {
        try {
          if (t) {
            var B = function() {
              throw Error();
            };
            if (Object.defineProperty(B.prototype, "props", { set: function() {
              throw Error();
            } }), typeof Reflect == "object" && Reflect.construct) {
              try {
                Reflect.construct(B, []);
              } catch (O) {
                var w = O;
              }
              Reflect.construct(e, [], B);
            } else {
              try {
                B.call();
              } catch (O) {
                w = O;
              }
              e.call(B.prototype);
            }
          } else {
            try {
              throw Error();
            } catch (O) {
              w = O;
            }
            (B = e()) && typeof B.catch == "function" && B.catch(function() {
            });
          }
        } catch (O) {
          if (O && w && typeof O.stack == "string") return [O.stack, w.stack];
        }
        return [null, null];
      } };
      l.DetermineComponentFrameRoot.displayName = "DetermineComponentFrameRoot";
      var i = Object.getOwnPropertyDescriptor(l.DetermineComponentFrameRoot, "name");
      i && i.configurable && Object.defineProperty(l.DetermineComponentFrameRoot, "name", { value: "DetermineComponentFrameRoot" });
      var s = l.DetermineComponentFrameRoot(), c = s[0], o = s[1];
      if (c && o) {
        var f = c.split(`
`), _ = o.split(`
`);
        for (i = l = 0; l < f.length && !f[l].includes("DetermineComponentFrameRoot"); ) l++;
        for (; i < _.length && !_[i].includes("DetermineComponentFrameRoot"); ) i++;
        if (l === f.length || i === _.length) for (l = f.length - 1, i = _.length - 1; 1 <= l && 0 <= i && f[l] !== _[i]; ) i--;
        for (; 1 <= l && 0 <= i; l--, i--) if (f[l] !== _[i]) {
          if (l !== 1 || i !== 1) do
            if (l--, i--, 0 > i || f[l] !== _[i]) {
              var D = `
` + f[l].replace(" at new ", " at ");
              return e.displayName && D.includes("<anonymous>") && (D = D.replace("<anonymous>", e.displayName)), D;
            }
          while (1 <= l && 0 <= i);
          break;
        }
      }
    } finally {
      gt = !1, Error.prepareStackTrace = a;
    }
    return (a = e ? e.displayName || e.name : "") ? xt(a) : "";
  }
  function te(e, t) {
    switch (e.tag) {
      case 26:
      case 27:
      case 5:
        return xt(e.type);
      case 16:
        return xt("Lazy");
      case 13:
        return e.child !== t && t !== null ? xt("Suspense Fallback") : xt("Suspense");
      case 19:
        return xt("SuspenseList");
      case 0:
      case 15:
        return h(e.type, !1);
      case 11:
        return h(e.type.render, !1);
      case 1:
        return h(e.type, !0);
      case 31:
        return xt("Activity");
      default:
        return "";
    }
  }
  function tt(e) {
    try {
      var t = "", a = null;
      do
        t += te(e, a), a = e, e = e.return;
      while (e);
      return t;
    } catch (l) {
      return `
Error generating stack: ` + l.message + `
` + l.stack;
    }
  }
  var Dt = Object.prototype.hasOwnProperty, E = m.unstable_scheduleCallback, be = m.unstable_cancelCallback, at = m.unstable_shouldYield, Jt = m.unstable_requestPaint, We = m.unstable_now, Ka = m.unstable_getCurrentPriorityLevel, gl = m.unstable_ImmediatePriority, Ut = m.unstable_UserBlockingPriority, Ft = m.unstable_NormalPriority, Ja = m.unstable_LowPriority, u = m.unstable_IdlePriority, me = m.log, xe = m.unstable_setDisableYieldValue, Fe = null, Ye = null;
  function vt(e) {
    if (typeof me == "function" && xe(e), Ye && typeof Ye.setStrictMode == "function") try {
      Ye.setStrictMode(Fe, e);
    } catch {
    }
  }
  var ct = Math.clz32 ? Math.clz32 : Ep, li = Math.log, jt = Math.LN2;
  function Ep(e) {
    return e >>>= 0, e === 0 ? 32 : 31 - (li(e) / jt | 0) | 0;
  }
  var ni = 256, ii = 262144, si = 4194304;
  function Ia(e) {
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
  function ci(e, t, a) {
    var l = e.pendingLanes;
    if (l === 0) return 0;
    var i = 0, s = e.suspendedLanes, c = e.pingedLanes;
    e = e.warmLanes;
    var o = l & 134217727;
    return o !== 0 ? (l = o & ~s, l !== 0 ? i = Ia(l) : (c &= o, c !== 0 ? i = Ia(c) : a || (a = o & ~e, a !== 0 && (i = Ia(a))))) : (o = l & ~s, o !== 0 ? i = Ia(o) : c !== 0 ? i = Ia(c) : a || (a = l & ~e, a !== 0 && (i = Ia(a)))), i === 0 ? 0 : t !== 0 && t !== i && (t & s) === 0 && (s = i & -i, a = t & -t, s >= a || s === 32 && (a & 4194048) !== 0) ? t : i;
  }
  function rn(e, t) {
    return (e.pendingLanes & ~(e.suspendedLanes & ~e.pingedLanes) & t) === 0;
  }
  function Tp(e, t) {
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
  function oo() {
    var e = si;
    return si <<= 1, (si & 62914560) === 0 && (si = 4194304), e;
  }
  function Es(e) {
    for (var t = [], a = 0; 31 > a; a++) t.push(e);
    return t;
  }
  function ri(e, t) {
    e.pendingLanes |= t, t !== 268435456 && (e.suspendedLanes = 0, e.pingedLanes = 0, e.warmLanes = 0);
  }
  function Ap(e, t, a, l, i, s) {
    var c = e.pendingLanes;
    e.pendingLanes = a, e.suspendedLanes = 0, e.pingedLanes = 0, e.warmLanes = 0, e.expiredLanes &= a, e.entangledLanes &= a, e.errorRecoveryDisabledLanes &= a, e.shellSuspendCounter = 0;
    var o = e.entanglements, f = e.expirationTimes, _ = e.hiddenUpdates;
    for (a = c & ~a; 0 < a; ) {
      var D = 31 - ct(a), B = 1 << D;
      o[D] = 0, f[D] = -1;
      var w = _[D];
      if (w !== null) for (_[D] = null, D = 0; D < w.length; D++) {
        var O = w[D];
        O !== null && (O.lane &= -536870913);
      }
      a &= ~B;
    }
    l !== 0 && uo(e, l, 0), s !== 0 && i === 0 && e.tag !== 0 && (e.suspendedLanes |= s & ~(c & ~t));
  }
  function uo(e, t, a) {
    e.pendingLanes |= t, e.suspendedLanes &= ~t;
    var l = 31 - ct(t);
    e.entangledLanes |= t, e.entanglements[l] = e.entanglements[l] | 1073741824 | a & 261930;
  }
  function fo(e, t) {
    var a = e.entangledLanes |= t;
    for (e = e.entanglements; a; ) {
      var l = 31 - ct(a), i = 1 << l;
      i & t | e[l] & t && (e[l] |= t), a &= ~i;
    }
  }
  function po(e, t) {
    var a = t & -t;
    return a = (a & 42) !== 0 ? 1 : ho(a), (a & (e.suspendedLanes | t)) !== 0 ? 0 : a;
  }
  function ho(e) {
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
  function Ts(e) {
    return e &= -e, 2 < e ? 8 < e ? (e & 134217727) !== 0 ? 32 : 268435456 : 8 : 2;
  }
  function mo() {
    var e = Y.p;
    return e !== 0 ? e : (e = window.event, e === void 0 ? 32 : Wf(e.type));
  }
  function xo(e, t) {
    var a = Y.p;
    try {
      return Y.p = e, t();
    } finally {
      Y.p = a;
    }
  }
  var Na = Math.random().toString(36).slice(2), ut = "__reactFiber$" + Na, yt = "__reactProps$" + Na, on = "__reactContainer$" + Na, As = "__reactEvents$" + Na, kp = "__reactListeners$" + Na, Cp = "__reactHandles$" + Na, go = "__reactResources$" + Na, dn = "__reactMarker$" + Na;
  function ks(e) {
    delete e[ut], delete e[yt], delete e[As], delete e[kp], delete e[Cp];
  }
  function vl(e) {
    var t = e[ut];
    if (t) return t;
    for (var a = e.parentNode; a; ) {
      if (t = a[on] || a[ut]) {
        if (a = t.alternate, t.child !== null || a !== null && a.child !== null) for (e = qf(e); e !== null; ) {
          if (a = e[ut]) return a;
          e = qf(e);
        }
        return t;
      }
      e = a, a = e.parentNode;
    }
    return null;
  }
  function bl(e) {
    if (e = e[ut] || e[on]) {
      var t = e.tag;
      if (t === 5 || t === 6 || t === 13 || t === 31 || t === 26 || t === 27 || t === 3) return e;
    }
    return null;
  }
  function un(e) {
    var t = e.tag;
    if (t === 5 || t === 26 || t === 27 || t === 6) return e.stateNode;
    throw Error(d(33));
  }
  function jl(e) {
    var t = e[go];
    return t || (t = e[go] = {
      hoistableStyles: /* @__PURE__ */ new Map(),
      hoistableScripts: /* @__PURE__ */ new Map()
    }), t;
  }
  function ot(e) {
    e[dn] = !0;
  }
  var vo = /* @__PURE__ */ new Set(), bo = {};
  function $a(e, t) {
    yl(e, t), yl(e + "Capture", t);
  }
  function yl(e, t) {
    for (bo[e] = t, e = 0; e < t.length; e++) vo.add(t[e]);
  }
  var Op = RegExp("^[:A-Z_a-z\\u00C0-\\u00D6\\u00D8-\\u00F6\\u00F8-\\u02FF\\u0370-\\u037D\\u037F-\\u1FFF\\u200C-\\u200D\\u2070-\\u218F\\u2C00-\\u2FEF\\u3001-\\uD7FF\\uF900-\\uFDCF\\uFDF0-\\uFFFD][:A-Z_a-z\\u00C0-\\u00D6\\u00D8-\\u00F6\\u00F8-\\u02FF\\u0370-\\u037D\\u037F-\\u1FFF\\u200C-\\u200D\\u2070-\\u218F\\u2C00-\\u2FEF\\u3001-\\uD7FF\\uF900-\\uFDCF\\uFDF0-\\uFFFD\\-.0-9\\u00B7\\u0300-\\u036F\\u203F-\\u2040]*$"), jo = {}, yo = {};
  function Mp(e) {
    return Dt.call(yo, e) ? !0 : Dt.call(jo, e) ? !1 : Op.test(e) ? yo[e] = !0 : (jo[e] = !0, !1);
  }
  function oi(e, t, a) {
    if (Mp(t)) if (a === null) e.removeAttribute(t);
    else {
      switch (typeof a) {
        case "undefined":
        case "function":
        case "symbol":
          e.removeAttribute(t);
          return;
        case "boolean":
          var l = t.toLowerCase().slice(0, 5);
          if (l !== "data-" && l !== "aria-") {
            e.removeAttribute(t);
            return;
          }
      }
      e.setAttribute(t, "" + a);
    }
  }
  function di(e, t, a) {
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
  function na(e, t, a, l) {
    if (l === null) e.removeAttribute(a);
    else {
      switch (typeof l) {
        case "undefined":
        case "function":
        case "symbol":
        case "boolean":
          e.removeAttribute(a);
          return;
      }
      e.setAttributeNS(t, a, "" + l);
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
  function So(e) {
    var t = e.type;
    return (e = e.nodeName) && e.toLowerCase() === "input" && (t === "checkbox" || t === "radio");
  }
  function Dp(e, t, a) {
    var l = Object.getOwnPropertyDescriptor(e.constructor.prototype, t);
    if (!e.hasOwnProperty(t) && typeof l < "u" && typeof l.get == "function" && typeof l.set == "function") {
      var i = l.get, s = l.set;
      return Object.defineProperty(e, t, {
        configurable: !0,
        get: function() {
          return i.call(this);
        },
        set: function(c) {
          a = "" + c, s.call(this, c);
        }
      }), Object.defineProperty(e, t, { enumerable: l.enumerable }), {
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
  function Cs(e) {
    if (!e._valueTracker) {
      var t = So(e) ? "checked" : "value";
      e._valueTracker = Dp(e, t, "" + e[t]);
    }
  }
  function zo(e) {
    if (!e) return !1;
    var t = e._valueTracker;
    if (!t) return !0;
    var a = t.getValue(), l = "";
    return e && (l = So(e) ? e.checked ? "true" : "false" : e.value), e = l, e !== a ? (t.setValue(e), !0) : !1;
  }
  function ui(e) {
    if (e = e || (typeof document < "u" ? document : void 0), typeof e > "u") return null;
    try {
      return e.activeElement || e.body;
    } catch {
      return e.body;
    }
  }
  var Up = /[\n"\\]/g;
  function qt(e) {
    return e.replace(Up, function(t) {
      return "\\" + t.charCodeAt(0).toString(16) + " ";
    });
  }
  function Os(e, t, a, l, i, s, c, o) {
    e.name = "", c != null && typeof c != "function" && typeof c != "symbol" && typeof c != "boolean" ? e.type = c : e.removeAttribute("type"), t != null ? c === "number" ? (t === 0 && e.value === "" || e.value != t) && (e.value = "" + Rt(t)) : e.value !== "" + Rt(t) && (e.value = "" + Rt(t)) : c !== "submit" && c !== "reset" || e.removeAttribute("value"), t != null ? Ms(e, c, Rt(t)) : a != null ? Ms(e, c, Rt(a)) : l != null && e.removeAttribute("value"), i == null && s != null && (e.defaultChecked = !!s), i != null && (e.checked = i && typeof i != "function" && typeof i != "symbol"), o != null && typeof o != "function" && typeof o != "symbol" && typeof o != "boolean" ? e.name = "" + Rt(o) : e.removeAttribute("name");
  }
  function No(e, t, a, l, i, s, c, o) {
    if (s != null && typeof s != "function" && typeof s != "symbol" && typeof s != "boolean" && (e.type = s), t != null || a != null) {
      if (!(s !== "submit" && s !== "reset" || t != null)) {
        Cs(e);
        return;
      }
      a = a != null ? "" + Rt(a) : "", t = t != null ? "" + Rt(t) : a, o || t === e.value || (e.value = t), e.defaultValue = t;
    }
    l = l ?? i, l = typeof l != "function" && typeof l != "symbol" && !!l, e.checked = o ? e.checked : !!l, e.defaultChecked = !!l, c != null && typeof c != "function" && typeof c != "symbol" && typeof c != "boolean" && (e.name = c), Cs(e);
  }
  function Ms(e, t, a) {
    t === "number" && ui(e.ownerDocument) === e || e.defaultValue === "" + a || (e.defaultValue = "" + a);
  }
  function Sl(e, t, a, l) {
    if (e = e.options, t) {
      t = {};
      for (var i = 0; i < a.length; i++) t["$" + a[i]] = !0;
      for (a = 0; a < e.length; a++) i = t.hasOwnProperty("$" + e[a].value), e[a].selected !== i && (e[a].selected = i), i && l && (e[a].defaultSelected = !0);
    } else {
      for (a = "" + Rt(a), t = null, i = 0; i < e.length; i++) {
        if (e[i].value === a) {
          e[i].selected = !0, l && (e[i].defaultSelected = !0);
          return;
        }
        t !== null || e[i].disabled || (t = e[i]);
      }
      t !== null && (t.selected = !0);
    }
  }
  function _o(e, t, a) {
    if (t != null && (t = "" + Rt(t), t !== e.value && (e.value = t), a == null)) {
      e.defaultValue !== t && (e.defaultValue = t);
      return;
    }
    e.defaultValue = a != null ? "" + Rt(a) : "";
  }
  function wo(e, t, a, l) {
    if (t == null) {
      if (l != null) {
        if (a != null) throw Error(d(92));
        if (V(l)) {
          if (1 < l.length) throw Error(d(93));
          l = l[0];
        }
        a = l;
      }
      a ??= "", t = a;
    }
    a = Rt(t), e.defaultValue = a, l = e.textContent, l === a && l !== "" && l !== null && (e.value = l), Cs(e);
  }
  function zl(e, t) {
    if (t) {
      var a = e.firstChild;
      if (a && a === e.lastChild && a.nodeType === 3) {
        a.nodeValue = t;
        return;
      }
    }
    e.textContent = t;
  }
  var Rp = new Set("animationIterationCount aspectRatio borderImageOutset borderImageSlice borderImageWidth boxFlex boxFlexGroup boxOrdinalGroup columnCount columns flex flexGrow flexPositive flexShrink flexNegative flexOrder gridArea gridRow gridRowEnd gridRowSpan gridRowStart gridColumn gridColumnEnd gridColumnSpan gridColumnStart fontWeight lineClamp lineHeight opacity order orphans scale tabSize widows zIndex zoom fillOpacity floodOpacity stopOpacity strokeDasharray strokeDashoffset strokeMiterlimit strokeOpacity strokeWidth MozAnimationIterationCount MozBoxFlex MozBoxFlexGroup MozLineClamp msAnimationIterationCount msFlex msZoom msFlexGrow msFlexNegative msFlexOrder msFlexPositive msFlexShrink msGridColumn msGridColumnSpan msGridRow msGridRowSpan WebkitAnimationIterationCount WebkitBoxFlex WebKitBoxFlexGroup WebkitBoxOrdinalGroup WebkitColumnCount WebkitColumns WebkitFlex WebkitFlexGrow WebkitFlexPositive WebkitFlexShrink WebkitLineClamp".split(" "));
  function Eo(e, t, a) {
    var l = t.indexOf("--") === 0;
    a == null || typeof a == "boolean" || a === "" ? l ? e.setProperty(t, "") : t === "float" ? e.cssFloat = "" : e[t] = "" : l ? e.setProperty(t, a) : typeof a != "number" || a === 0 || Rp.has(t) ? t === "float" ? e.cssFloat = a : e[t] = ("" + a).trim() : e[t] = a + "px";
  }
  function To(e, t, a) {
    if (t != null && typeof t != "object") throw Error(d(62));
    if (e = e.style, a != null) {
      for (var l in a) !a.hasOwnProperty(l) || t != null && t.hasOwnProperty(l) || (l.indexOf("--") === 0 ? e.setProperty(l, "") : l === "float" ? e.cssFloat = "" : e[l] = "");
      for (var i in t) l = t[i], t.hasOwnProperty(i) && a[i] !== l && Eo(e, i, l);
    } else for (var s in t) t.hasOwnProperty(s) && Eo(e, s, t[s]);
  }
  function Ds(e) {
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
  var qp = /* @__PURE__ */ new Map([
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
  ]), Hp = /^[\u0000-\u001F ]*j[\r\n\t]*a[\r\n\t]*v[\r\n\t]*a[\r\n\t]*s[\r\n\t]*c[\r\n\t]*r[\r\n\t]*i[\r\n\t]*p[\r\n\t]*t[\r\n\t]*:/i;
  function fi(e) {
    return Hp.test("" + e) ? "javascript:throw new Error('React has blocked a javascript: URL as a security precaution.')" : e;
  }
  function ia() {
  }
  var Us = null;
  function Rs(e) {
    return e = e.target || e.srcElement || window, e.correspondingUseElement && (e = e.correspondingUseElement), e.nodeType === 3 ? e.parentNode : e;
  }
  var Nl = null, _l = null;
  function Ao(e) {
    var t = bl(e);
    if (t && (e = t.stateNode)) {
      var a = e[yt] || null;
      e: switch (e = t.stateNode, t.type) {
        case "input":
          if (Os(e, a.value, a.defaultValue, a.defaultValue, a.checked, a.defaultChecked, a.type, a.name), t = a.name, a.type === "radio" && t != null) {
            for (a = e; a.parentNode; ) a = a.parentNode;
            for (a = a.querySelectorAll('input[name="' + qt("" + t) + '"][type="radio"]'), t = 0; t < a.length; t++) {
              var l = a[t];
              if (l !== e && l.form === e.form) {
                var i = l[yt] || null;
                if (!i) throw Error(d(90));
                Os(l, i.value, i.defaultValue, i.defaultValue, i.checked, i.defaultChecked, i.type, i.name);
              }
            }
            for (t = 0; t < a.length; t++) l = a[t], l.form === e.form && zo(l);
          }
          break e;
        case "textarea":
          _o(e, a.value, a.defaultValue);
          break e;
        case "select":
          t = a.value, t != null && Sl(e, !!a.multiple, t, !1);
      }
    }
  }
  var qs = !1;
  function ko(e, t, a) {
    if (qs) return e(t, a);
    qs = !0;
    try {
      return e(t);
    } finally {
      if (qs = !1, (Nl !== null || _l !== null) && (Pi(), Nl && (t = Nl, e = _l, _l = Nl = null, Ao(t), e)))
        for (t = 0; t < e.length; t++) Ao(e[t]);
    }
  }
  function fn(e, t) {
    var a = e.stateNode;
    if (a === null) return null;
    var l = a[yt] || null;
    if (l === null) return null;
    a = l[t];
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
        (l = !l.disabled) || (e = e.type, l = !(e === "button" || e === "input" || e === "select" || e === "textarea")), e = !l;
        break e;
      default:
        e = !1;
    }
    if (e) return null;
    if (a && typeof a != "function") throw Error(d(231, t, typeof a));
    return a;
  }
  var sa = !(typeof window > "u" || typeof window.document > "u" || typeof window.document.createElement > "u"), Hs = !1;
  if (sa) try {
    var pn = {};
    Object.defineProperty(pn, "passive", { get: function() {
      Hs = !0;
    } }), window.addEventListener("test", pn, pn), window.removeEventListener("test", pn, pn);
  } catch {
    Hs = !1;
  }
  var _a = null, Ls = null, pi = null;
  function Co() {
    if (pi) return pi;
    var e, t = Ls, a = t.length, l, i = "value" in _a ? _a.value : _a.textContent, s = i.length;
    for (e = 0; e < a && t[e] === i[e]; e++) ;
    var c = a - e;
    for (l = 1; l <= c && t[a - l] === i[s - l]; l++) ;
    return pi = i.slice(e, 1 < l ? 1 - l : void 0);
  }
  function hi(e) {
    var t = e.keyCode;
    return "charCode" in e ? (e = e.charCode, e === 0 && t === 13 && (e = 13)) : e = t, e === 10 && (e = 13), 32 <= e || e === 13 ? e : 0;
  }
  function mi() {
    return !0;
  }
  function Oo() {
    return !1;
  }
  function St(e) {
    function t(a, l, i, s, c) {
      this._reactName = a, this._targetInst = i, this.type = l, this.nativeEvent = s, this.target = c, this.currentTarget = null;
      for (var o in e) e.hasOwnProperty(o) && (a = e[o], this[o] = a ? a(s) : s[o]);
      return this.isDefaultPrevented = (s.defaultPrevented != null ? s.defaultPrevented : s.returnValue === !1) ? mi : Oo, this.isPropagationStopped = Oo, this;
    }
    return U(t.prototype, {
      preventDefault: function() {
        this.defaultPrevented = !0;
        var a = this.nativeEvent;
        a && (a.preventDefault ? a.preventDefault() : typeof a.returnValue != "unknown" && (a.returnValue = !1), this.isDefaultPrevented = mi);
      },
      stopPropagation: function() {
        var a = this.nativeEvent;
        a && (a.stopPropagation ? a.stopPropagation() : typeof a.cancelBubble != "unknown" && (a.cancelBubble = !0), this.isPropagationStopped = mi);
      },
      persist: function() {
      },
      isPersistent: mi
    }), t;
  }
  var Wa = {
    eventPhase: 0,
    bubbles: 0,
    cancelable: 0,
    timeStamp: function(e) {
      return e.timeStamp || Date.now();
    },
    defaultPrevented: 0,
    isTrusted: 0
  }, xi = St(Wa), hn = U({}, Wa, {
    view: 0,
    detail: 0
  }), Lp = St(hn), Bs, Gs, mn, gi = U({}, hn, {
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
    getModifierState: Vs,
    button: 0,
    buttons: 0,
    relatedTarget: function(e) {
      return e.relatedTarget === void 0 ? e.fromElement === e.srcElement ? e.toElement : e.fromElement : e.relatedTarget;
    },
    movementX: function(e) {
      return "movementX" in e ? e.movementX : (e !== mn && (mn && e.type === "mousemove" ? (Bs = e.screenX - mn.screenX, Gs = e.screenY - mn.screenY) : Gs = Bs = 0, mn = e), Bs);
    },
    movementY: function(e) {
      return "movementY" in e ? e.movementY : Gs;
    }
  }), Mo = St(gi), Bp = St(U({}, gi, { dataTransfer: 0 })), Ys = St(U({}, hn, { relatedTarget: 0 })), Gp = St(U({}, Wa, {
    animationName: 0,
    elapsedTime: 0,
    pseudoElement: 0
  })), Yp = St(U({}, Wa, { clipboardData: function(e) {
    return "clipboardData" in e ? e.clipboardData : window.clipboardData;
  } })), Do = St(U({}, Wa, { data: 0 })), Vp = {
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
  }, Xp = {
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
  }, Qp = {
    Alt: "altKey",
    Control: "ctrlKey",
    Meta: "metaKey",
    Shift: "shiftKey"
  };
  function Zp(e) {
    var t = this.nativeEvent;
    return t.getModifierState ? t.getModifierState(e) : (e = Qp[e]) ? !!t[e] : !1;
  }
  function Vs() {
    return Zp;
  }
  var Kp = St(U({}, hn, {
    key: function(e) {
      if (e.key) {
        var t = Vp[e.key] || e.key;
        if (t !== "Unidentified") return t;
      }
      return e.type === "keypress" ? (e = hi(e), e === 13 ? "Enter" : String.fromCharCode(e)) : e.type === "keydown" || e.type === "keyup" ? Xp[e.keyCode] || "Unidentified" : "";
    },
    code: 0,
    location: 0,
    ctrlKey: 0,
    shiftKey: 0,
    altKey: 0,
    metaKey: 0,
    repeat: 0,
    locale: 0,
    getModifierState: Vs,
    charCode: function(e) {
      return e.type === "keypress" ? hi(e) : 0;
    },
    keyCode: function(e) {
      return e.type === "keydown" || e.type === "keyup" ? e.keyCode : 0;
    },
    which: function(e) {
      return e.type === "keypress" ? hi(e) : e.type === "keydown" || e.type === "keyup" ? e.keyCode : 0;
    }
  })), Uo = St(U({}, gi, {
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
  })), Jp = St(U({}, hn, {
    touches: 0,
    targetTouches: 0,
    changedTouches: 0,
    altKey: 0,
    metaKey: 0,
    ctrlKey: 0,
    shiftKey: 0,
    getModifierState: Vs
  })), Ip = St(U({}, Wa, {
    propertyName: 0,
    elapsedTime: 0,
    pseudoElement: 0
  })), $p = St(U({}, gi, {
    deltaX: function(e) {
      return "deltaX" in e ? e.deltaX : "wheelDeltaX" in e ? -e.wheelDeltaX : 0;
    },
    deltaY: function(e) {
      return "deltaY" in e ? e.deltaY : "wheelDeltaY" in e ? -e.wheelDeltaY : "wheelDelta" in e ? -e.wheelDelta : 0;
    },
    deltaZ: 0,
    deltaMode: 0
  })), Wp = St(U({}, Wa, {
    newState: 0,
    oldState: 0
  })), Fp = [
    9,
    13,
    27,
    32
  ], Xs = sa && "CompositionEvent" in window, xn = null;
  sa && "documentMode" in document && (xn = document.documentMode);
  var Pp = sa && "TextEvent" in window && !xn, Ro = sa && (!Xs || xn && 8 < xn && 11 >= xn), qo = " ", Ho = !1;
  function Lo(e, t) {
    switch (e) {
      case "keyup":
        return Fp.indexOf(t.keyCode) !== -1;
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
  function Bo(e) {
    return e = e.detail, typeof e == "object" && "data" in e ? e.data : null;
  }
  var wl = !1;
  function e0(e, t) {
    switch (e) {
      case "compositionend":
        return Bo(t);
      case "keypress":
        return t.which !== 32 ? null : (Ho = !0, qo);
      case "textInput":
        return e = t.data, e === qo && Ho ? null : e;
      default:
        return null;
    }
  }
  function t0(e, t) {
    if (wl) return e === "compositionend" || !Xs && Lo(e, t) ? (e = Co(), pi = Ls = _a = null, wl = !1, e) : null;
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
        return Ro && t.locale !== "ko" ? null : t.data;
      default:
        return null;
    }
  }
  var a0 = {
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
  function Go(e) {
    var t = e && e.nodeName && e.nodeName.toLowerCase();
    return t === "input" ? !!a0[e.type] : t === "textarea";
  }
  function Yo(e, t, a, l) {
    Nl ? _l ? _l.push(l) : _l = [l] : Nl = l, t = ss(t, "onChange"), 0 < t.length && (a = new xi("onChange", "change", null, a, l), e.push({
      event: a,
      listeners: t
    }));
  }
  var gn = null, vn = null;
  function l0(e) {
    Sf(e, 0);
  }
  function vi(e) {
    if (zo(un(e))) return e;
  }
  function Vo(e, t) {
    if (e === "change") return t;
  }
  var Xo = !1;
  if (sa) {
    var Qs;
    if (sa) {
      var Zs = "oninput" in document;
      if (!Zs) {
        var Qo = document.createElement("div");
        Qo.setAttribute("oninput", "return;"), Zs = typeof Qo.oninput == "function";
      }
      Qs = Zs;
    } else Qs = !1;
    Xo = Qs && (!document.documentMode || 9 < document.documentMode);
  }
  function Zo() {
    gn && (gn.detachEvent("onpropertychange", Ko), vn = gn = null);
  }
  function Ko(e) {
    if (e.propertyName === "value" && vi(vn)) {
      var t = [];
      Yo(t, vn, e, Rs(e)), ko(l0, t);
    }
  }
  function n0(e, t, a) {
    e === "focusin" ? (Zo(), gn = t, vn = a, gn.attachEvent("onpropertychange", Ko)) : e === "focusout" && Zo();
  }
  function i0(e) {
    if (e === "selectionchange" || e === "keyup" || e === "keydown") return vi(vn);
  }
  function s0(e, t) {
    if (e === "click") return vi(t);
  }
  function c0(e, t) {
    if (e === "input" || e === "change") return vi(t);
  }
  function r0(e, t) {
    return e === t && (e !== 0 || 1 / e === 1 / t) || e !== e && t !== t;
  }
  var Tt = typeof Object.is == "function" ? Object.is : r0;
  function bn(e, t) {
    if (Tt(e, t)) return !0;
    if (typeof e != "object" || e === null || typeof t != "object" || t === null) return !1;
    var a = Object.keys(e), l = Object.keys(t);
    if (a.length !== l.length) return !1;
    for (l = 0; l < a.length; l++) {
      var i = a[l];
      if (!Dt.call(t, i) || !Tt(e[i], t[i])) return !1;
    }
    return !0;
  }
  function Jo(e) {
    for (; e && e.firstChild; ) e = e.firstChild;
    return e;
  }
  function Io(e, t) {
    var a = Jo(e);
    e = 0;
    for (var l; a; ) {
      if (a.nodeType === 3) {
        if (l = e + a.textContent.length, e <= t && l >= t) return {
          node: a,
          offset: t - e
        };
        e = l;
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
      a = Jo(a);
    }
  }
  function $o(e, t) {
    return e && t ? e === t ? !0 : e && e.nodeType === 3 ? !1 : t && t.nodeType === 3 ? $o(e, t.parentNode) : "contains" in e ? e.contains(t) : e.compareDocumentPosition ? !!(e.compareDocumentPosition(t) & 16) : !1 : !1;
  }
  function Wo(e) {
    e = e != null && e.ownerDocument != null && e.ownerDocument.defaultView != null ? e.ownerDocument.defaultView : window;
    for (var t = ui(e.document); t instanceof e.HTMLIFrameElement; ) {
      try {
        var a = typeof t.contentWindow.location.href == "string";
      } catch {
        a = !1;
      }
      if (a) e = t.contentWindow;
      else break;
      t = ui(e.document);
    }
    return t;
  }
  function Ks(e) {
    var t = e && e.nodeName && e.nodeName.toLowerCase();
    return t && (t === "input" && (e.type === "text" || e.type === "search" || e.type === "tel" || e.type === "url" || e.type === "password") || t === "textarea" || e.contentEditable === "true");
  }
  var o0 = sa && "documentMode" in document && 11 >= document.documentMode, El = null, Js = null, jn = null, Is = !1;
  function Fo(e, t, a) {
    var l = a.window === a ? a.document : a.nodeType === 9 ? a : a.ownerDocument;
    Is || El == null || El !== ui(l) || (l = El, "selectionStart" in l && Ks(l) ? l = {
      start: l.selectionStart,
      end: l.selectionEnd
    } : (l = (l.ownerDocument && l.ownerDocument.defaultView || window).getSelection(), l = {
      anchorNode: l.anchorNode,
      anchorOffset: l.anchorOffset,
      focusNode: l.focusNode,
      focusOffset: l.focusOffset
    }), jn && bn(jn, l) || (jn = l, l = ss(Js, "onSelect"), 0 < l.length && (t = new xi("onSelect", "select", null, t, a), e.push({
      event: t,
      listeners: l
    }), t.target = El)));
  }
  function Fa(e, t) {
    var a = {};
    return a[e.toLowerCase()] = t.toLowerCase(), a["Webkit" + e] = "webkit" + t, a["Moz" + e] = "moz" + t, a;
  }
  var Tl = {
    animationend: Fa("Animation", "AnimationEnd"),
    animationiteration: Fa("Animation", "AnimationIteration"),
    animationstart: Fa("Animation", "AnimationStart"),
    transitionrun: Fa("Transition", "TransitionRun"),
    transitionstart: Fa("Transition", "TransitionStart"),
    transitioncancel: Fa("Transition", "TransitionCancel"),
    transitionend: Fa("Transition", "TransitionEnd")
  }, $s = {}, Po = {};
  sa && (Po = document.createElement("div").style, "AnimationEvent" in window || (delete Tl.animationend.animation, delete Tl.animationiteration.animation, delete Tl.animationstart.animation), "TransitionEvent" in window || delete Tl.transitionend.transition);
  function Pa(e) {
    if ($s[e]) return $s[e];
    if (!Tl[e]) return e;
    var t = Tl[e], a;
    for (a in t) if (t.hasOwnProperty(a) && a in Po) return $s[e] = t[a];
    return e;
  }
  var ed = Pa("animationend"), td = Pa("animationiteration"), ad = Pa("animationstart"), d0 = Pa("transitionrun"), u0 = Pa("transitionstart"), f0 = Pa("transitioncancel"), ld = Pa("transitionend"), nd = /* @__PURE__ */ new Map(), Ws = "abort auxClick beforeToggle cancel canPlay canPlayThrough click close contextMenu copy cut drag dragEnd dragEnter dragExit dragLeave dragOver dragStart drop durationChange emptied encrypted ended error gotPointerCapture input invalid keyDown keyPress keyUp load loadedData loadedMetadata loadStart lostPointerCapture mouseDown mouseMove mouseOut mouseOver mouseUp paste pause play playing pointerCancel pointerDown pointerMove pointerOut pointerOver pointerUp progress rateChange reset resize seeked seeking stalled submit suspend timeUpdate touchCancel touchEnd touchStart volumeChange scroll toggle touchMove waiting wheel".split(" ");
  Ws.push("scrollEnd");
  function It(e, t) {
    nd.set(e, t), $a(t, [e]);
  }
  var bi = typeof reportError == "function" ? reportError : function(e) {
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
  }, Ht = [], Al = 0, Fs = 0;
  function ji() {
    for (var e = Al, t = Fs = Al = 0; t < e; ) {
      var a = Ht[t];
      Ht[t++] = null;
      var l = Ht[t];
      Ht[t++] = null;
      var i = Ht[t];
      Ht[t++] = null;
      var s = Ht[t];
      if (Ht[t++] = null, l !== null && i !== null) {
        var c = l.pending;
        c === null ? i.next = i : (i.next = c.next, c.next = i), l.pending = i;
      }
      s !== 0 && id(a, i, s);
    }
  }
  function yi(e, t, a, l) {
    Ht[Al++] = e, Ht[Al++] = t, Ht[Al++] = a, Ht[Al++] = l, Fs |= l, e.lanes |= l, e = e.alternate, e !== null && (e.lanes |= l);
  }
  function Ps(e, t, a, l) {
    return yi(e, t, a, l), Si(e);
  }
  function el(e, t) {
    return yi(e, null, null, t), Si(e);
  }
  function id(e, t, a) {
    e.lanes |= a;
    var l = e.alternate;
    l !== null && (l.lanes |= a);
    for (var i = !1, s = e.return; s !== null; ) s.childLanes |= a, l = s.alternate, l !== null && (l.childLanes |= a), s.tag === 22 && (e = s.stateNode, e === null || e._visibility & 1 || (i = !0)), e = s, s = s.return;
    return e.tag === 3 ? (s = e.stateNode, i && t !== null && (i = 31 - ct(a), e = s.hiddenUpdates, l = e[i], l === null ? e[i] = [t] : l.push(t), t.lane = a | 536870912), s) : null;
  }
  function Si(e) {
    if (50 < Yn) throw Yn = 0, rr = null, Error(d(185));
    for (var t = e.return; t !== null; ) e = t, t = e.return;
    return e.tag === 3 ? e.stateNode : null;
  }
  var kl = {};
  function p0(e, t, a, l) {
    this.tag = e, this.key = a, this.sibling = this.child = this.return = this.stateNode = this.type = this.elementType = null, this.index = 0, this.refCleanup = this.ref = null, this.pendingProps = t, this.dependencies = this.memoizedState = this.updateQueue = this.memoizedProps = null, this.mode = l, this.subtreeFlags = this.flags = 0, this.deletions = null, this.childLanes = this.lanes = 0, this.alternate = null;
  }
  function At(e, t, a, l) {
    return new p0(e, t, a, l);
  }
  function ec(e) {
    return e = e.prototype, !(!e || !e.isReactComponent);
  }
  function ca(e, t) {
    var a = e.alternate;
    return a === null ? (a = At(e.tag, t, e.key, e.mode), a.elementType = e.elementType, a.type = e.type, a.stateNode = e.stateNode, a.alternate = e, e.alternate = a) : (a.pendingProps = t, a.type = e.type, a.flags = 0, a.subtreeFlags = 0, a.deletions = null), a.flags = e.flags & 65011712, a.childLanes = e.childLanes, a.lanes = e.lanes, a.child = e.child, a.memoizedProps = e.memoizedProps, a.memoizedState = e.memoizedState, a.updateQueue = e.updateQueue, t = e.dependencies, a.dependencies = t === null ? null : {
      lanes: t.lanes,
      firstContext: t.firstContext
    }, a.sibling = e.sibling, a.index = e.index, a.ref = e.ref, a.refCleanup = e.refCleanup, a;
  }
  function sd(e, t) {
    e.flags &= 65011714;
    var a = e.alternate;
    return a === null ? (e.childLanes = 0, e.lanes = t, e.child = null, e.subtreeFlags = 0, e.memoizedProps = null, e.memoizedState = null, e.updateQueue = null, e.dependencies = null, e.stateNode = null) : (e.childLanes = a.childLanes, e.lanes = a.lanes, e.child = a.child, e.subtreeFlags = 0, e.deletions = null, e.memoizedProps = a.memoizedProps, e.memoizedState = a.memoizedState, e.updateQueue = a.updateQueue, e.type = a.type, t = a.dependencies, e.dependencies = t === null ? null : {
      lanes: t.lanes,
      firstContext: t.firstContext
    }), e;
  }
  function zi(e, t, a, l, i, s) {
    var c = 0;
    if (l = e, typeof e == "function") ec(e) && (c = 1);
    else if (typeof e == "string") c = bh(e, a, ee.current) ? 26 : e === "html" || e === "head" || e === "body" ? 27 : 5;
    else e: switch (e) {
      case b:
        return e = At(31, a, t, i), e.elementType = b, e.lanes = s, e;
      case I:
        return tl(a.children, i, s, t);
      case oe:
        c = 8, i |= 24;
        break;
      case Q:
        return e = At(12, a, t, i | 2), e.elementType = Q, e.lanes = s, e;
      case P:
        return e = At(13, a, t, i), e.elementType = P, e.lanes = s, e;
      case ae:
        return e = At(19, a, t, i), e.elementType = ae, e.lanes = s, e;
      default:
        if (typeof e == "object" && e !== null) switch (e.$$typeof) {
          case G:
            c = 10;
            break e;
          case de:
            c = 9;
            break e;
          case W:
            c = 11;
            break e;
          case ce:
            c = 14;
            break e;
          case X:
            c = 16, l = null;
            break e;
        }
        c = 29, a = Error(d(130, e === null ? "null" : typeof e, "")), l = null;
    }
    return t = At(c, a, t, i), t.elementType = e, t.type = l, t.lanes = s, t;
  }
  function tl(e, t, a, l) {
    return e = At(7, e, l, t), e.lanes = a, e;
  }
  function tc(e, t, a) {
    return e = At(6, e, null, t), e.lanes = a, e;
  }
  function cd(e) {
    var t = At(18, null, null, 0);
    return t.stateNode = e, t;
  }
  function ac(e, t, a) {
    return t = At(4, e.children !== null ? e.children : [], e.key, t), t.lanes = a, t.stateNode = {
      containerInfo: e.containerInfo,
      pendingChildren: null,
      implementation: e.implementation
    }, t;
  }
  var rd = /* @__PURE__ */ new WeakMap();
  function Lt(e, t) {
    if (typeof e == "object" && e !== null) {
      var a = rd.get(e);
      return a !== void 0 ? a : (t = {
        value: e,
        source: t,
        stack: tt(t)
      }, rd.set(e, t), t);
    }
    return {
      value: e,
      source: t,
      stack: tt(t)
    };
  }
  var Cl = [], Ol = 0, Ni = null, yn = 0, Bt = [], Gt = 0, wa = null, Pt = 1, ea = "";
  function ra(e, t) {
    Cl[Ol++] = yn, Cl[Ol++] = Ni, Ni = e, yn = t;
  }
  function od(e, t, a) {
    Bt[Gt++] = Pt, Bt[Gt++] = ea, Bt[Gt++] = wa, wa = e;
    var l = Pt;
    e = ea;
    var i = 32 - ct(l) - 1;
    l &= ~(1 << i), a += 1;
    var s = 32 - ct(t) + i;
    if (30 < s) {
      var c = i - i % 5;
      s = (l & (1 << c) - 1).toString(32), l >>= c, i -= c, Pt = 1 << 32 - ct(t) + i | a << i | l, ea = s + e;
    } else Pt = 1 << s | a << i | l, ea = e;
  }
  function lc(e) {
    e.return !== null && (ra(e, 1), od(e, 1, 0));
  }
  function nc(e) {
    for (; e === Ni; ) Ni = Cl[--Ol], Cl[Ol] = null, yn = Cl[--Ol], Cl[Ol] = null;
    for (; e === wa; ) wa = Bt[--Gt], Bt[Gt] = null, ea = Bt[--Gt], Bt[Gt] = null, Pt = Bt[--Gt], Bt[Gt] = null;
  }
  function dd(e, t) {
    Bt[Gt++] = Pt, Bt[Gt++] = ea, Bt[Gt++] = wa, Pt = t.id, ea = t.overflow, wa = e;
  }
  var ft = null, Qe = null, ke = !1, Ea = null, Yt = !1, ic = Error(d(519));
  function Ta(e) {
    throw Sn(Lt(Error(d(418, 1 < arguments.length && arguments[1] !== void 0 && arguments[1] ? "text" : "HTML", "")), e)), ic;
  }
  function ud(e) {
    var t = e.stateNode, a = e.type, l = e.memoizedProps;
    switch (t[ut] = e, t[yt] = l, a) {
      case "dialog":
        _e("cancel", t), _e("close", t);
        break;
      case "iframe":
      case "object":
      case "embed":
        _e("load", t);
        break;
      case "video":
      case "audio":
        for (a = 0; a < Xn.length; a++) _e(Xn[a], t);
        break;
      case "source":
        _e("error", t);
        break;
      case "img":
      case "image":
      case "link":
        _e("error", t), _e("load", t);
        break;
      case "details":
        _e("toggle", t);
        break;
      case "input":
        _e("invalid", t), No(t, l.value, l.defaultValue, l.checked, l.defaultChecked, l.type, l.name, !0);
        break;
      case "select":
        _e("invalid", t);
        break;
      case "textarea":
        _e("invalid", t), wo(t, l.value, l.defaultValue, l.children);
    }
    a = l.children, typeof a != "string" && typeof a != "number" && typeof a != "bigint" || t.textContent === "" + a || l.suppressHydrationWarning === !0 || Ef(t.textContent, a) ? (l.popover != null && (_e("beforetoggle", t), _e("toggle", t)), l.onScroll != null && _e("scroll", t), l.onScrollEnd != null && _e("scrollend", t), l.onClick != null && (t.onclick = ia), t = !0) : t = !1, t || Ta(e, !0);
  }
  function fd(e) {
    for (ft = e.return; ft; ) switch (ft.tag) {
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
        ft = ft.return;
    }
  }
  function Ml(e) {
    if (e !== ft) return !1;
    if (!ke) return fd(e), ke = !0, !1;
    var t = e.tag, a;
    if ((a = t !== 3 && t !== 27) && ((a = t === 5) && (a = e.type, a = !(a !== "form" && a !== "button") || Sr(e.type, e.memoizedProps)), a = !a), a && Qe && Ta(e), fd(e), t === 13) {
      if (e = e.memoizedState, e = e !== null ? e.dehydrated : null, !e) throw Error(d(317));
      Qe = Rf(e);
    } else if (t === 31) {
      if (e = e.memoizedState, e = e !== null ? e.dehydrated : null, !e) throw Error(d(317));
      Qe = Rf(e);
    } else t === 27 ? (t = Qe, Ba(e.type) ? (e = Er, Er = null, Qe = e) : Qe = t) : Qe = ft ? Qt(e.stateNode.nextSibling) : null;
    return !0;
  }
  function al() {
    Qe = ft = null, ke = !1;
  }
  function sc() {
    var e = Ea;
    return e !== null && (wt === null ? wt = e : wt.push.apply(wt, e), Ea = null), e;
  }
  function Sn(e) {
    Ea === null ? Ea = [e] : Ea.push(e);
  }
  var cc = x(null), ll = null, oa = null;
  function Aa(e, t, a) {
    Z(cc, t._currentValue), t._currentValue = a;
  }
  function da(e) {
    e._currentValue = cc.current, H(cc);
  }
  function rc(e, t, a) {
    for (; e !== null; ) {
      var l = e.alternate;
      if ((e.childLanes & t) !== t ? (e.childLanes |= t, l !== null && (l.childLanes |= t)) : l !== null && (l.childLanes & t) !== t && (l.childLanes |= t), e === a) break;
      e = e.return;
    }
  }
  function oc(e, t, a, l) {
    var i = e.child;
    for (i !== null && (i.return = e); i !== null; ) {
      var s = i.dependencies;
      if (s !== null) {
        var c = i.child;
        s = s.firstContext;
        e: for (; s !== null; ) {
          var o = s;
          s = i;
          for (var f = 0; f < t.length; f++) if (o.context === t[f]) {
            s.lanes |= a, o = s.alternate, o !== null && (o.lanes |= a), rc(s.return, a, e), l || (c = null);
            break e;
          }
          s = o.next;
        }
      } else if (i.tag === 18) {
        if (c = i.return, c === null) throw Error(d(341));
        c.lanes |= a, s = c.alternate, s !== null && (s.lanes |= a), rc(c, a, e), c = null;
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
  function Dl(e, t, a, l) {
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
          Tt(i.pendingProps.value, c.value) || (e !== null ? e.push(o) : e = [o]);
        }
      } else if (i === se.current) {
        if (c = i.alternate, c === null) throw Error(d(387));
        c.memoizedState.memoizedState !== i.memoizedState.memoizedState && (e !== null ? e.push(In) : e = [In]);
      }
      i = i.return;
    }
    e !== null && oc(t, e, a, l), t.flags |= 262144;
  }
  function _i(e) {
    for (e = e.firstContext; e !== null; ) {
      if (!Tt(e.context._currentValue, e.memoizedValue)) return !0;
      e = e.next;
    }
    return !1;
  }
  function nl(e) {
    ll = e, oa = null, e = e.dependencies, e !== null && (e.firstContext = null);
  }
  function pt(e) {
    return pd(ll, e);
  }
  function wi(e, t) {
    return ll === null && nl(e), pd(e, t);
  }
  function pd(e, t) {
    var a = t._currentValue;
    if (t = {
      context: t,
      memoizedValue: a,
      next: null
    }, oa === null) {
      if (e === null) throw Error(d(308));
      oa = t, e.dependencies = {
        lanes: 0,
        firstContext: t
      }, e.flags |= 524288;
    } else oa = oa.next = t;
    return a;
  }
  var h0 = typeof AbortController < "u" ? AbortController : function() {
    var e = [], t = this.signal = {
      aborted: !1,
      addEventListener: function(a, l) {
        e.push(l);
      }
    };
    this.abort = function() {
      t.aborted = !0, e.forEach(function(a) {
        return a();
      });
    };
  }, m0 = m.unstable_scheduleCallback, x0 = m.unstable_NormalPriority, lt = {
    $$typeof: G,
    Consumer: null,
    Provider: null,
    _currentValue: null,
    _currentValue2: null,
    _threadCount: 0
  };
  function dc() {
    return {
      controller: new h0(),
      data: /* @__PURE__ */ new Map(),
      refCount: 0
    };
  }
  function zn(e) {
    e.refCount--, e.refCount === 0 && m0(x0, function() {
      e.controller.abort();
    });
  }
  var Nn = null, uc = 0, Ul = 0, Rl = null;
  function g0(e, t) {
    if (Nn === null) {
      var a = Nn = [];
      uc = 0, Ul = hr(), Rl = {
        status: "pending",
        value: void 0,
        then: function(l) {
          a.push(l);
        }
      };
    }
    return uc++, t.then(hd, hd), t;
  }
  function hd() {
    if (--uc === 0 && Nn !== null) {
      Rl !== null && (Rl.status = "fulfilled");
      var e = Nn;
      Nn = null, Ul = 0, Rl = null;
      for (var t = 0; t < e.length; t++) (0, e[t])();
    }
  }
  function v0(e, t) {
    var a = [], l = {
      status: "pending",
      value: null,
      reason: null,
      then: function(i) {
        a.push(i);
      }
    };
    return e.then(function() {
      l.status = "fulfilled", l.value = t;
      for (var i = 0; i < a.length; i++) (0, a[i])(t);
    }, function(i) {
      for (l.status = "rejected", l.reason = i, i = 0; i < a.length; i++) (0, a[i])(void 0);
    }), l;
  }
  var md = R.S;
  R.S = function(e, t) {
    Iu = We(), typeof t == "object" && t !== null && typeof t.then == "function" && g0(e, t), md !== null && md(e, t);
  };
  var il = x(null);
  function fc() {
    var e = il.current;
    return e !== null ? e : Ve.pooledCache;
  }
  function Ei(e, t) {
    t === null ? Z(il, il.current) : Z(il, t.pool);
  }
  function xd() {
    var e = fc();
    return e === null ? null : {
      parent: lt._currentValue,
      pool: e
    };
  }
  var ql = Error(d(460)), pc = Error(d(474)), Ti = Error(d(542)), Ai = { then: function() {
  } };
  function gd(e) {
    return e = e.status, e === "fulfilled" || e === "rejected";
  }
  function vd(e, t, a) {
    switch (a = e[a], a === void 0 ? e.push(t) : a !== t && (t.then(ia, ia), t = a), t.status) {
      case "fulfilled":
        return t.value;
      case "rejected":
        throw e = t.reason, jd(e), e;
      default:
        if (typeof t.status == "string") t.then(ia, ia);
        else {
          if (e = Ve, e !== null && 100 < e.shellSuspendCounter) throw Error(d(482));
          e = t, e.status = "pending", e.then(function(l) {
            if (t.status === "pending") {
              var i = t;
              i.status = "fulfilled", i.value = l;
            }
          }, function(l) {
            if (t.status === "pending") {
              var i = t;
              i.status = "rejected", i.reason = l;
            }
          });
        }
        switch (t.status) {
          case "fulfilled":
            return t.value;
          case "rejected":
            throw e = t.reason, jd(e), e;
        }
        throw cl = t, ql;
    }
  }
  function sl(e) {
    try {
      var t = e._init;
      return t(e._payload);
    } catch (a) {
      throw a !== null && typeof a == "object" && typeof a.then == "function" ? (cl = a, ql) : a;
    }
  }
  var cl = null;
  function bd() {
    if (cl === null) throw Error(d(459));
    var e = cl;
    return cl = null, e;
  }
  function jd(e) {
    if (e === ql || e === Ti) throw Error(d(483));
  }
  var Hl = null, _n = 0;
  function ki(e) {
    var t = _n;
    return _n += 1, Hl === null && (Hl = []), vd(Hl, e, t);
  }
  function wn(e, t) {
    t = t.props.ref, e.ref = t !== void 0 ? t : null;
  }
  function Ci(e, t) {
    throw t.$$typeof === ie ? Error(d(525)) : (e = Object.prototype.toString.call(t), Error(d(31, e === "[object Object]" ? "object with keys {" + Object.keys(t).join(", ") + "}" : e)));
  }
  function yd(e) {
    function t(j, v) {
      if (e) {
        var N = j.deletions;
        N === null ? (j.deletions = [v], j.flags |= 16) : N.push(v);
      }
    }
    function a(j, v) {
      if (!e) return null;
      for (; v !== null; ) t(j, v), v = v.sibling;
      return null;
    }
    function l(j) {
      for (var v = /* @__PURE__ */ new Map(); j !== null; ) j.key !== null ? v.set(j.key, j) : v.set(j.index, j), j = j.sibling;
      return v;
    }
    function i(j, v) {
      return j = ca(j, v), j.index = 0, j.sibling = null, j;
    }
    function s(j, v, N) {
      return j.index = N, e ? (N = j.alternate, N !== null ? (N = N.index, N < v ? (j.flags |= 67108866, v) : N) : (j.flags |= 67108866, v)) : (j.flags |= 1048576, v);
    }
    function c(j) {
      return e && j.alternate === null && (j.flags |= 67108866), j;
    }
    function o(j, v, N, q) {
      return v === null || v.tag !== 6 ? (v = tc(N, j.mode, q), v.return = j, v) : (v = i(v, N), v.return = j, v);
    }
    function f(j, v, N, q) {
      var he = N.type;
      return he === I ? D(j, v, N.props.children, q, N.key) : v !== null && (v.elementType === he || typeof he == "object" && he !== null && he.$$typeof === X && sl(he) === v.type) ? (v = i(v, N.props), wn(v, N), v.return = j, v) : (v = zi(N.type, N.key, N.props, null, j.mode, q), wn(v, N), v.return = j, v);
    }
    function _(j, v, N, q) {
      return v === null || v.tag !== 4 || v.stateNode.containerInfo !== N.containerInfo || v.stateNode.implementation !== N.implementation ? (v = ac(N, j.mode, q), v.return = j, v) : (v = i(v, N.children || []), v.return = j, v);
    }
    function D(j, v, N, q, he) {
      return v === null || v.tag !== 7 ? (v = tl(N, j.mode, q, he), v.return = j, v) : (v = i(v, N), v.return = j, v);
    }
    function B(j, v, N) {
      if (typeof v == "string" && v !== "" || typeof v == "number" || typeof v == "bigint") return v = tc("" + v, j.mode, N), v.return = j, v;
      if (typeof v == "object" && v !== null) {
        switch (v.$$typeof) {
          case fe:
            return N = zi(v.type, v.key, v.props, null, j.mode, N), wn(N, v), N.return = j, N;
          case J:
            return v = ac(v, j.mode, N), v.return = j, v;
          case X:
            return v = sl(v), B(j, v, N);
        }
        if (V(v) || Me(v)) return v = tl(v, j.mode, N, null), v.return = j, v;
        if (typeof v.then == "function") return B(j, ki(v), N);
        if (v.$$typeof === G) return B(j, wi(j, v), N);
        Ci(j, v);
      }
      return null;
    }
    function w(j, v, N, q) {
      var he = v !== null ? v.key : null;
      if (typeof N == "string" && N !== "" || typeof N == "number" || typeof N == "bigint") return he !== null ? null : o(j, v, "" + N, q);
      if (typeof N == "object" && N !== null) {
        switch (N.$$typeof) {
          case fe:
            return N.key === he ? f(j, v, N, q) : null;
          case J:
            return N.key === he ? _(j, v, N, q) : null;
          case X:
            return N = sl(N), w(j, v, N, q);
        }
        if (V(N) || Me(N)) return he !== null ? null : D(j, v, N, q, null);
        if (typeof N.then == "function") return w(j, v, ki(N), q);
        if (N.$$typeof === G) return w(j, v, wi(j, N), q);
        Ci(j, N);
      }
      return null;
    }
    function O(j, v, N, q, he) {
      if (typeof q == "string" && q !== "" || typeof q == "number" || typeof q == "bigint") return j = j.get(N) || null, o(v, j, "" + q, he);
      if (typeof q == "object" && q !== null) {
        switch (q.$$typeof) {
          case fe:
            return j = j.get(q.key === null ? N : q.key) || null, f(v, j, q, he);
          case J:
            return j = j.get(q.key === null ? N : q.key) || null, _(v, j, q, he);
          case X:
            return q = sl(q), O(j, v, N, q, he);
        }
        if (V(q) || Me(q)) return j = j.get(N) || null, D(v, j, q, he, null);
        if (typeof q.then == "function") return O(j, v, N, ki(q), he);
        if (q.$$typeof === G) return O(j, v, N, wi(v, q), he);
        Ci(v, q);
      }
      return null;
    }
    function ne(j, v, N, q) {
      for (var he = null, Ce = null, re = v, Se = v = 0, Te = null; re !== null && Se < N.length; Se++) {
        re.index > Se ? (Te = re, re = null) : Te = re.sibling;
        var Oe = w(j, re, N[Se], q);
        if (Oe === null) {
          re === null && (re = Te);
          break;
        }
        e && re && Oe.alternate === null && t(j, re), v = s(Oe, v, Se), Ce === null ? he = Oe : Ce.sibling = Oe, Ce = Oe, re = Te;
      }
      if (Se === N.length) return a(j, re), ke && ra(j, Se), he;
      if (re === null) {
        for (; Se < N.length; Se++) re = B(j, N[Se], q), re !== null && (v = s(re, v, Se), Ce === null ? he = re : Ce.sibling = re, Ce = re);
        return ke && ra(j, Se), he;
      }
      for (re = l(re); Se < N.length; Se++) Te = O(re, j, Se, N[Se], q), Te !== null && (e && Te.alternate !== null && re.delete(Te.key === null ? Se : Te.key), v = s(Te, v, Se), Ce === null ? he = Te : Ce.sibling = Te, Ce = Te);
      return e && re.forEach(function(Qa) {
        return t(j, Qa);
      }), ke && ra(j, Se), he;
    }
    function ge(j, v, N, q) {
      if (N == null) throw Error(d(151));
      for (var he = null, Ce = null, re = v, Se = v = 0, Te = null, Oe = N.next(); re !== null && !Oe.done; Se++, Oe = N.next()) {
        re.index > Se ? (Te = re, re = null) : Te = re.sibling;
        var Qa = w(j, re, Oe.value, q);
        if (Qa === null) {
          re === null && (re = Te);
          break;
        }
        e && re && Qa.alternate === null && t(j, re), v = s(Qa, v, Se), Ce === null ? he = Qa : Ce.sibling = Qa, Ce = Qa, re = Te;
      }
      if (Oe.done) return a(j, re), ke && ra(j, Se), he;
      if (re === null) {
        for (; !Oe.done; Se++, Oe = N.next()) Oe = B(j, Oe.value, q), Oe !== null && (v = s(Oe, v, Se), Ce === null ? he = Oe : Ce.sibling = Oe, Ce = Oe);
        return ke && ra(j, Se), he;
      }
      for (re = l(re); !Oe.done; Se++, Oe = N.next()) Oe = O(re, j, Se, Oe.value, q), Oe !== null && (e && Oe.alternate !== null && re.delete(Oe.key === null ? Se : Oe.key), v = s(Oe, v, Se), Ce === null ? he = Oe : Ce.sibling = Oe, Ce = Oe);
      return e && re.forEach(function(Mh) {
        return t(j, Mh);
      }), ke && ra(j, Se), he;
    }
    function Be(j, v, N, q) {
      if (typeof N == "object" && N !== null && N.type === I && N.key === null && (N = N.props.children), typeof N == "object" && N !== null) {
        switch (N.$$typeof) {
          case fe:
            e: {
              for (var he = N.key; v !== null; ) {
                if (v.key === he) {
                  if (he = N.type, he === I) {
                    if (v.tag === 7) {
                      a(j, v.sibling), q = i(v, N.props.children), q.return = j, j = q;
                      break e;
                    }
                  } else if (v.elementType === he || typeof he == "object" && he !== null && he.$$typeof === X && sl(he) === v.type) {
                    a(j, v.sibling), q = i(v, N.props), wn(q, N), q.return = j, j = q;
                    break e;
                  }
                  a(j, v);
                  break;
                } else t(j, v);
                v = v.sibling;
              }
              N.type === I ? (q = tl(N.props.children, j.mode, q, N.key), q.return = j, j = q) : (q = zi(N.type, N.key, N.props, null, j.mode, q), wn(q, N), q.return = j, j = q);
            }
            return c(j);
          case J:
            e: {
              for (he = N.key; v !== null; ) {
                if (v.key === he) if (v.tag === 4 && v.stateNode.containerInfo === N.containerInfo && v.stateNode.implementation === N.implementation) {
                  a(j, v.sibling), q = i(v, N.children || []), q.return = j, j = q;
                  break e;
                } else {
                  a(j, v);
                  break;
                }
                else t(j, v);
                v = v.sibling;
              }
              q = ac(N, j.mode, q), q.return = j, j = q;
            }
            return c(j);
          case X:
            return N = sl(N), Be(j, v, N, q);
        }
        if (V(N)) return ne(j, v, N, q);
        if (Me(N)) {
          if (he = Me(N), typeof he != "function") throw Error(d(150));
          return N = he.call(N), ge(j, v, N, q);
        }
        if (typeof N.then == "function") return Be(j, v, ki(N), q);
        if (N.$$typeof === G) return Be(j, v, wi(j, N), q);
        Ci(j, N);
      }
      return typeof N == "string" && N !== "" || typeof N == "number" || typeof N == "bigint" ? (N = "" + N, v !== null && v.tag === 6 ? (a(j, v.sibling), q = i(v, N), q.return = j, j = q) : (a(j, v), q = tc(N, j.mode, q), q.return = j, j = q), c(j)) : a(j, v);
    }
    return function(j, v, N, q) {
      try {
        _n = 0;
        var he = Be(j, v, N, q);
        return Hl = null, he;
      } catch (re) {
        if (re === ql || re === Ti) throw re;
        var Ce = At(29, re, null, j.mode);
        return Ce.lanes = q, Ce.return = j, Ce;
      }
    };
  }
  var rl = yd(!0), Sd = yd(!1), ka = !1;
  function hc(e) {
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
  function mc(e, t) {
    e = e.updateQueue, t.updateQueue === e && (t.updateQueue = {
      baseState: e.baseState,
      firstBaseUpdate: e.firstBaseUpdate,
      lastBaseUpdate: e.lastBaseUpdate,
      shared: e.shared,
      callbacks: null
    });
  }
  function ol(e) {
    return {
      lane: e,
      tag: 0,
      payload: null,
      callback: null,
      next: null
    };
  }
  function dl(e, t, a) {
    var l = e.updateQueue;
    if (l === null) return null;
    if (l = l.shared, (De & 2) !== 0) {
      var i = l.pending;
      return i === null ? t.next = t : (t.next = i.next, i.next = t), l.pending = t, t = Si(e), id(e, null, a), t;
    }
    return yi(e, l, t, a), Si(e);
  }
  function En(e, t, a) {
    if (t = t.updateQueue, t !== null && (t = t.shared, (a & 4194048) !== 0)) {
      var l = t.lanes;
      l &= e.pendingLanes, a |= l, t.lanes = a, fo(e, a);
    }
  }
  function xc(e, t) {
    var a = e.updateQueue, l = e.alternate;
    if (l !== null && (l = l.updateQueue, a === l)) {
      var i = null, s = null;
      if (a = a.firstBaseUpdate, a !== null) {
        do {
          var c = {
            lane: a.lane,
            tag: a.tag,
            payload: a.payload,
            callback: null,
            next: null
          };
          s === null ? i = s = c : s = s.next = c, a = a.next;
        } while (a !== null);
        s === null ? i = s = t : s = s.next = t;
      } else i = s = t;
      a = {
        baseState: l.baseState,
        firstBaseUpdate: i,
        lastBaseUpdate: s,
        shared: l.shared,
        callbacks: l.callbacks
      }, e.updateQueue = a;
      return;
    }
    e = a.lastBaseUpdate, e === null ? a.firstBaseUpdate = t : e.next = t, a.lastBaseUpdate = t;
  }
  var gc = !1;
  function Tn() {
    if (gc) {
      var e = Rl;
      if (e !== null) throw e;
    }
  }
  function An(e, t, a, l) {
    gc = !1;
    var i = e.updateQueue;
    ka = !1;
    var s = i.firstBaseUpdate, c = i.lastBaseUpdate, o = i.shared.pending;
    if (o !== null) {
      i.shared.pending = null;
      var f = o, _ = f.next;
      f.next = null, c === null ? s = _ : c.next = _, c = f;
      var D = e.alternate;
      D !== null && (D = D.updateQueue, o = D.lastBaseUpdate, o !== c && (o === null ? D.firstBaseUpdate = _ : o.next = _, D.lastBaseUpdate = f));
    }
    if (s !== null) {
      var B = i.baseState;
      c = 0, D = _ = f = null, o = s;
      do {
        var w = o.lane & -536870913, O = w !== o.lane;
        if (O ? (Ee & w) === w : (l & w) === w) {
          w !== 0 && w === Ul && (gc = !0), D !== null && (D = D.next = {
            lane: 0,
            tag: o.tag,
            payload: o.payload,
            callback: null,
            next: null
          });
          e: {
            var ne = e, ge = o;
            w = t;
            var Be = a;
            switch (ge.tag) {
              case 1:
                if (ne = ge.payload, typeof ne == "function") {
                  B = ne.call(Be, B, w);
                  break e;
                }
                B = ne;
                break e;
              case 3:
                ne.flags = ne.flags & -65537 | 128;
              case 0:
                if (ne = ge.payload, w = typeof ne == "function" ? ne.call(Be, B, w) : ne, w == null) break e;
                B = U({}, B, w);
                break e;
              case 2:
                ka = !0;
            }
          }
          w = o.callback, w !== null && (e.flags |= 64, O && (e.flags |= 8192), O = i.callbacks, O === null ? i.callbacks = [w] : O.push(w));
        } else O = {
          lane: w,
          tag: o.tag,
          payload: o.payload,
          callback: o.callback,
          next: null
        }, D === null ? (_ = D = O, f = B) : D = D.next = O, c |= w;
        if (o = o.next, o === null) {
          if (o = i.shared.pending, o === null) break;
          O = o, o = O.next, O.next = null, i.lastBaseUpdate = O, i.shared.pending = null;
        }
      } while (!0);
      D === null && (f = B), i.baseState = f, i.firstBaseUpdate = _, i.lastBaseUpdate = D, s === null && (i.shared.lanes = 0), Ua |= c, e.lanes = c, e.memoizedState = B;
    }
  }
  function zd(e, t) {
    if (typeof e != "function") throw Error(d(191, e));
    e.call(t);
  }
  function Nd(e, t) {
    var a = e.callbacks;
    if (a !== null) for (e.callbacks = null, e = 0; e < a.length; e++) zd(a[e], t);
  }
  var Ll = x(null), Oi = x(0);
  function _d(e, t) {
    e = ba, Z(Oi, e), Z(Ll, t), ba = e | t.baseLanes;
  }
  function vc() {
    Z(Oi, ba), Z(Ll, Ll.current);
  }
  function bc() {
    ba = Oi.current, H(Ll), H(Oi);
  }
  var kt = x(null), Vt = null;
  function Ca(e) {
    var t = e.alternate;
    Z(Pe, Pe.current & 1), Z(kt, e), Vt === null && (t === null || Ll.current !== null || t.memoizedState !== null) && (Vt = e);
  }
  function jc(e) {
    Z(Pe, Pe.current), Z(kt, e), Vt === null && (Vt = e);
  }
  function wd(e) {
    e.tag === 22 ? (Z(Pe, Pe.current), Z(kt, e), Vt === null && (Vt = e)) : Oa(e);
  }
  function Oa() {
    Z(Pe, Pe.current), Z(kt, kt.current);
  }
  function Ct(e) {
    H(kt), Vt === e && (Vt = null), H(Pe);
  }
  var Pe = x(0);
  function Mi(e) {
    for (var t = e; t !== null; ) {
      if (t.tag === 13) {
        var a = t.memoizedState;
        if (a !== null && (a = a.dehydrated, a === null || _r(a) || wr(a))) return t;
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
  var ua = 0, je = null, He = null, nt = null, Di = !1, Bl = !1, ul = !1, Ui = 0, kn = 0, Gl = null, b0 = 0;
  function Ie() {
    throw Error(d(321));
  }
  function yc(e, t) {
    if (t === null) return !1;
    for (var a = 0; a < t.length && a < e.length; a++) if (!Tt(e[a], t[a])) return !1;
    return !0;
  }
  function Sc(e, t, a, l, i, s) {
    return ua = s, je = t, t.memoizedState = null, t.updateQueue = null, t.lanes = 0, R.H = e === null || e.memoizedState === null ? ou : qc, ul = !1, s = a(l, i), ul = !1, Bl && (s = Td(t, a, l, i)), Ed(e), s;
  }
  function Ed(e) {
    R.H = Mn;
    var t = He !== null && He.next !== null;
    if (ua = 0, nt = He = je = null, Di = !1, kn = 0, Gl = null, t) throw Error(d(300));
    e === null || it || (e = e.dependencies, e !== null && _i(e) && (it = !0));
  }
  function Td(e, t, a, l) {
    je = e;
    var i = 0;
    do {
      if (Bl && (Gl = null), kn = 0, Bl = !1, 25 <= i) throw Error(d(301));
      if (i += 1, nt = He = null, e.updateQueue != null) {
        var s = e.updateQueue;
        s.lastEffect = null, s.events = null, s.stores = null, s.memoCache != null && (s.memoCache.index = 0);
      }
      R.H = du, s = t(a, l);
    } while (Bl);
    return s;
  }
  function j0() {
    var e = R.H, t = e.useState()[0];
    return t = typeof t.then == "function" ? Cn(t) : t, e = e.useState()[0], (He !== null ? He.memoizedState : null) !== e && (je.flags |= 1024), t;
  }
  function zc() {
    var e = Ui !== 0;
    return Ui = 0, e;
  }
  function Nc(e, t, a) {
    t.updateQueue = e.updateQueue, t.flags &= -2053, e.lanes &= ~a;
  }
  function _c(e) {
    if (Di) {
      for (e = e.memoizedState; e !== null; ) {
        var t = e.queue;
        t !== null && (t.pending = null), e = e.next;
      }
      Di = !1;
    }
    ua = 0, nt = He = je = null, Bl = !1, kn = Ui = 0, Gl = null;
  }
  function bt() {
    var e = {
      memoizedState: null,
      baseState: null,
      baseQueue: null,
      queue: null,
      next: null
    };
    return nt === null ? je.memoizedState = nt = e : nt = nt.next = e, nt;
  }
  function et() {
    if (He === null) {
      var e = je.alternate;
      e = e !== null ? e.memoizedState : null;
    } else e = He.next;
    var t = nt === null ? je.memoizedState : nt.next;
    if (t !== null) nt = t, He = e;
    else {
      if (e === null)
        throw je.alternate === null ? Error(d(467)) : Error(d(310));
      He = e, e = {
        memoizedState: He.memoizedState,
        baseState: He.baseState,
        baseQueue: He.baseQueue,
        queue: He.queue,
        next: null
      }, nt === null ? je.memoizedState = nt = e : nt = nt.next = e;
    }
    return nt;
  }
  function Ri() {
    return {
      lastEffect: null,
      events: null,
      stores: null,
      memoCache: null
    };
  }
  function Cn(e) {
    var t = kn;
    return kn += 1, Gl === null && (Gl = []), e = vd(Gl, e, t), t = je, (nt === null ? t.memoizedState : nt.next) === null && (t = t.alternate, R.H = t === null || t.memoizedState === null ? ou : qc), e;
  }
  function qi(e) {
    if (e !== null && typeof e == "object") {
      if (typeof e.then == "function") return Cn(e);
      if (e.$$typeof === G) return pt(e);
    }
    throw Error(d(438, String(e)));
  }
  function wc(e) {
    var t = null, a = je.updateQueue;
    if (a !== null && (t = a.memoCache), t == null) {
      var l = je.alternate;
      l !== null && (l = l.updateQueue, l !== null && (l = l.memoCache, l != null && (t = {
        data: l.data.map(function(i) {
          return i.slice();
        }),
        index: 0
      })));
    }
    if (t ??= {
      data: [],
      index: 0
    }, a === null && (a = Ri(), je.updateQueue = a), a.memoCache = t, a = t.data[t.index], a === void 0) for (a = t.data[t.index] = Array(e), l = 0; l < e; l++) a[l] = le;
    return t.index++, a;
  }
  function fa(e, t) {
    return typeof t == "function" ? t(e) : t;
  }
  function Hi(e) {
    return Ec(et(), He, e);
  }
  function Ec(e, t, a) {
    var l = e.queue;
    if (l === null) throw Error(d(311));
    l.lastRenderedReducer = a;
    var i = e.baseQueue, s = l.pending;
    if (s !== null) {
      if (i !== null) {
        var c = i.next;
        i.next = s.next, s.next = c;
      }
      t.baseQueue = i = s, l.pending = null;
    }
    if (s = e.baseState, i === null) e.memoizedState = s;
    else {
      t = i.next;
      var o = c = null, f = null, _ = t, D = !1;
      do {
        var B = _.lane & -536870913;
        if (B !== _.lane ? (Ee & B) === B : (ua & B) === B) {
          var w = _.revertLane;
          if (w === 0) f !== null && (f = f.next = {
            lane: 0,
            revertLane: 0,
            gesture: null,
            action: _.action,
            hasEagerState: _.hasEagerState,
            eagerState: _.eagerState,
            next: null
          }), B === Ul && (D = !0);
          else if ((ua & w) === w) {
            _ = _.next, w === Ul && (D = !0);
            continue;
          } else B = {
            lane: 0,
            revertLane: _.revertLane,
            gesture: null,
            action: _.action,
            hasEagerState: _.hasEagerState,
            eagerState: _.eagerState,
            next: null
          }, f === null ? (o = f = B, c = s) : f = f.next = B, je.lanes |= w, Ua |= w;
          B = _.action, ul && a(s, B), s = _.hasEagerState ? _.eagerState : a(s, B);
        } else w = {
          lane: B,
          revertLane: _.revertLane,
          gesture: _.gesture,
          action: _.action,
          hasEagerState: _.hasEagerState,
          eagerState: _.eagerState,
          next: null
        }, f === null ? (o = f = w, c = s) : f = f.next = w, je.lanes |= B, Ua |= B;
        _ = _.next;
      } while (_ !== null && _ !== t);
      if (f === null ? c = s : f.next = o, !Tt(s, e.memoizedState) && (it = !0, D && (a = Rl, a !== null))) throw a;
      e.memoizedState = s, e.baseState = c, e.baseQueue = f, l.lastRenderedState = s;
    }
    return i === null && (l.lanes = 0), [e.memoizedState, l.dispatch];
  }
  function Tc(e) {
    var t = et(), a = t.queue;
    if (a === null) throw Error(d(311));
    a.lastRenderedReducer = e;
    var l = a.dispatch, i = a.pending, s = t.memoizedState;
    if (i !== null) {
      a.pending = null;
      var c = i = i.next;
      do
        s = e(s, c.action), c = c.next;
      while (c !== i);
      Tt(s, t.memoizedState) || (it = !0), t.memoizedState = s, t.baseQueue === null && (t.baseState = s), a.lastRenderedState = s;
    }
    return [s, l];
  }
  function Ad(e, t, a) {
    var l = je, i = et(), s = ke;
    if (s) {
      if (a === void 0) throw Error(d(407));
      a = a();
    } else a = t();
    var c = !Tt((He || i).memoizedState, a);
    if (c && (i.memoizedState = a, it = !0), i = i.queue, Cc(Od.bind(null, l, i, e), [e]), i.getSnapshot !== t || c || nt !== null && nt.memoizedState.tag & 1) {
      if (l.flags |= 2048, Yl(9, { destroy: void 0 }, Cd.bind(null, l, i, a, t), null), Ve === null) throw Error(d(349));
      s || (ua & 127) !== 0 || kd(l, t, a);
    }
    return a;
  }
  function kd(e, t, a) {
    e.flags |= 16384, e = {
      getSnapshot: t,
      value: a
    }, t = je.updateQueue, t === null ? (t = Ri(), je.updateQueue = t, t.stores = [e]) : (a = t.stores, a === null ? t.stores = [e] : a.push(e));
  }
  function Cd(e, t, a, l) {
    t.value = a, t.getSnapshot = l, Md(t) && Dd(e);
  }
  function Od(e, t, a) {
    return a(function() {
      Md(t) && Dd(e);
    });
  }
  function Md(e) {
    var t = e.getSnapshot;
    e = e.value;
    try {
      var a = t();
      return !Tt(e, a);
    } catch {
      return !0;
    }
  }
  function Dd(e) {
    var t = el(e, 2);
    t !== null && Et(t, e, 2);
  }
  function Ac(e) {
    var t = bt();
    if (typeof e == "function") {
      var a = e;
      if (e = a(), ul) {
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
  function Ud(e, t, a, l) {
    return e.baseState = a, Ec(e, He, typeof l == "function" ? l : fa);
  }
  function y0(e, t, a, l, i) {
    if (Gi(e)) throw Error(d(485));
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
      R.T !== null ? a(!0) : s.isTransition = !1, l(s), a = t.pending, a === null ? (s.next = t.pending = s, Rd(t, s)) : (s.next = a.next, t.pending = a.next = s);
    }
  }
  function Rd(e, t) {
    var a = t.action, l = t.payload, i = e.state;
    if (t.isTransition) {
      var s = R.T, c = {};
      R.T = c;
      try {
        var o = a(i, l), f = R.S;
        f !== null && f(c, o), qd(e, t, o);
      } catch (_) {
        kc(e, t, _);
      } finally {
        s !== null && c.types !== null && (s.types = c.types), R.T = s;
      }
    } else try {
      s = a(i, l), qd(e, t, s);
    } catch (_) {
      kc(e, t, _);
    }
  }
  function qd(e, t, a) {
    a !== null && typeof a == "object" && typeof a.then == "function" ? a.then(function(l) {
      Hd(e, t, l);
    }, function(l) {
      return kc(e, t, l);
    }) : Hd(e, t, a);
  }
  function Hd(e, t, a) {
    t.status = "fulfilled", t.value = a, Ld(t), e.state = a, t = e.pending, t !== null && (a = t.next, a === t ? e.pending = null : (a = a.next, t.next = a, Rd(e, a)));
  }
  function kc(e, t, a) {
    var l = e.pending;
    if (e.pending = null, l !== null) {
      l = l.next;
      do
        t.status = "rejected", t.reason = a, Ld(t), t = t.next;
      while (t !== l);
    }
    e.action = null;
  }
  function Ld(e) {
    e = e.listeners;
    for (var t = 0; t < e.length; t++) (0, e[t])();
  }
  function Bd(e, t) {
    return t;
  }
  function Gd(e, t) {
    if (ke) {
      var a = Ve.formState;
      if (a !== null) {
        e: {
          var l = je;
          if (ke) {
            if (Qe) {
              t: {
                for (var i = Qe, s = Yt; i.nodeType !== 8; ) {
                  if (!s) {
                    i = null;
                    break t;
                  }
                  if (i = Qt(i.nextSibling), i === null) {
                    i = null;
                    break t;
                  }
                }
                s = i.data, i = s === "F!" || s === "F" ? i : null;
              }
              if (i) {
                Qe = Qt(i.nextSibling), l = i.data === "F!";
                break e;
              }
            }
            Ta(l);
          }
          l = !1;
        }
        l && (t = a[0]);
      }
    }
    return a = bt(), a.memoizedState = a.baseState = t, l = {
      pending: null,
      lanes: 0,
      dispatch: null,
      lastRenderedReducer: Bd,
      lastRenderedState: t
    }, a.queue = l, a = su.bind(null, je, l), l.dispatch = a, l = Ac(!1), s = Rc.bind(null, je, !1, l.queue), l = bt(), i = {
      state: t,
      dispatch: null,
      action: e,
      pending: null
    }, l.queue = i, a = y0.bind(null, je, i, s, a), i.dispatch = a, l.memoizedState = e, [
      t,
      a,
      !1
    ];
  }
  function Yd(e) {
    return Vd(et(), He, e);
  }
  function Vd(e, t, a) {
    if (t = Ec(e, t, Bd)[0], e = Hi(fa)[0], typeof t == "object" && t !== null && typeof t.then == "function") try {
      var l = Cn(t);
    } catch (c) {
      throw c === ql ? Ti : c;
    }
    else l = t;
    t = et();
    var i = t.queue, s = i.dispatch;
    return a !== t.memoizedState && (je.flags |= 2048, Yl(9, { destroy: void 0 }, S0.bind(null, i, a), null)), [
      l,
      s,
      e
    ];
  }
  function S0(e, t) {
    e.action = t;
  }
  function Xd(e) {
    var t = et(), a = He;
    if (a !== null) return Vd(t, a, e);
    et(), t = t.memoizedState, a = et();
    var l = a.queue.dispatch;
    return a.memoizedState = e, [
      t,
      l,
      !1
    ];
  }
  function Yl(e, t, a, l) {
    return e = {
      tag: e,
      create: a,
      deps: l,
      inst: t,
      next: null
    }, t = je.updateQueue, t === null && (t = Ri(), je.updateQueue = t), a = t.lastEffect, a === null ? t.lastEffect = e.next = e : (l = a.next, a.next = e, e.next = l, t.lastEffect = e), e;
  }
  function Qd() {
    return et().memoizedState;
  }
  function Li(e, t, a, l) {
    var i = bt();
    je.flags |= e, i.memoizedState = Yl(1 | t, { destroy: void 0 }, a, l === void 0 ? null : l);
  }
  function Bi(e, t, a, l) {
    var i = et();
    l = l === void 0 ? null : l;
    var s = i.memoizedState.inst;
    He !== null && l !== null && yc(l, He.memoizedState.deps) ? i.memoizedState = Yl(t, s, a, l) : (je.flags |= e, i.memoizedState = Yl(1 | t, s, a, l));
  }
  function Zd(e, t) {
    Li(8390656, 8, e, t);
  }
  function Cc(e, t) {
    Bi(2048, 8, e, t);
  }
  function z0(e) {
    je.flags |= 4;
    var t = je.updateQueue;
    if (t === null) t = Ri(), je.updateQueue = t, t.events = [e];
    else {
      var a = t.events;
      a === null ? t.events = [e] : a.push(e);
    }
  }
  function Kd(e) {
    var t = et().memoizedState;
    return z0({
      ref: t,
      nextImpl: e
    }), function() {
      if ((De & 2) !== 0) throw Error(d(440));
      return t.impl.apply(void 0, arguments);
    };
  }
  function Jd(e, t) {
    return Bi(4, 2, e, t);
  }
  function Id(e, t) {
    return Bi(4, 4, e, t);
  }
  function $d(e, t) {
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
  function Wd(e, t, a) {
    a = a != null ? a.concat([e]) : null, Bi(4, 4, $d.bind(null, t, e), a);
  }
  function Oc() {
  }
  function Fd(e, t) {
    var a = et();
    t = t === void 0 ? null : t;
    var l = a.memoizedState;
    return t !== null && yc(t, l[1]) ? l[0] : (a.memoizedState = [e, t], e);
  }
  function Pd(e, t) {
    var a = et();
    t = t === void 0 ? null : t;
    var l = a.memoizedState;
    if (t !== null && yc(t, l[1])) return l[0];
    if (l = e(), ul) {
      vt(!0);
      try {
        e();
      } finally {
        vt(!1);
      }
    }
    return a.memoizedState = [l, t], l;
  }
  function Mc(e, t, a) {
    return a === void 0 || (ua & 1073741824) !== 0 && (Ee & 261930) === 0 ? e.memoizedState = t : (e.memoizedState = a, e = Wu(), je.lanes |= e, Ua |= e, a);
  }
  function eu(e, t, a, l) {
    return Tt(a, t) ? a : Ll.current !== null ? (e = Mc(e, a, l), Tt(e, t) || (it = !0), e) : (ua & 42) === 0 || (ua & 1073741824) !== 0 && (Ee & 261930) === 0 ? (it = !0, e.memoizedState = a) : (e = Wu(), je.lanes |= e, Ua |= e, t);
  }
  function tu(e, t, a, l, i) {
    var s = Y.p;
    Y.p = s !== 0 && 8 > s ? s : 8;
    var c = R.T, o = {};
    R.T = o, Rc(e, !1, t, a);
    try {
      var f = i(), _ = R.S;
      _ !== null && _(o, f), f !== null && typeof f == "object" && typeof f.then == "function" ? On(e, t, v0(f, l), Xt(e)) : On(e, t, l, Xt(e));
    } catch (D) {
      On(e, t, {
        then: function() {
        },
        status: "rejected",
        reason: D
      }, Xt());
    } finally {
      Y.p = s, c !== null && o.types !== null && (c.types = o.types), R.T = c;
    }
  }
  function N0() {
  }
  function Dc(e, t, a, l) {
    if (e.tag !== 5) throw Error(d(476));
    var i = au(e).queue;
    tu(e, i, t, pe, a === null ? N0 : function() {
      return lu(e), a(l);
    });
  }
  function au(e) {
    var t = e.memoizedState;
    if (t !== null) return t;
    t = {
      memoizedState: pe,
      baseState: pe,
      baseQueue: null,
      queue: {
        pending: null,
        lanes: 0,
        dispatch: null,
        lastRenderedReducer: fa,
        lastRenderedState: pe
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
  function lu(e) {
    var t = au(e);
    t.next === null && (t = e.alternate.memoizedState), On(e, t.next.queue, {}, Xt());
  }
  function Uc() {
    return pt(In);
  }
  function nu() {
    return et().memoizedState;
  }
  function iu() {
    return et().memoizedState;
  }
  function _0(e) {
    for (var t = e.return; t !== null; ) {
      switch (t.tag) {
        case 24:
        case 3:
          var a = Xt();
          e = ol(a);
          var l = dl(t, e, a);
          l !== null && (Et(l, t, a), En(l, t, a)), t = { cache: dc() }, e.payload = t;
          return;
      }
      t = t.return;
    }
  }
  function w0(e, t, a) {
    var l = Xt();
    a = {
      lane: l,
      revertLane: 0,
      gesture: null,
      action: a,
      hasEagerState: !1,
      eagerState: null,
      next: null
    }, Gi(e) ? cu(t, a) : (a = Ps(e, t, a, l), a !== null && (Et(a, e, l), ru(a, t, l)));
  }
  function su(e, t, a) {
    On(e, t, a, Xt());
  }
  function On(e, t, a, l) {
    var i = {
      lane: l,
      revertLane: 0,
      gesture: null,
      action: a,
      hasEagerState: !1,
      eagerState: null,
      next: null
    };
    if (Gi(e)) cu(t, i);
    else {
      var s = e.alternate;
      if (e.lanes === 0 && (s === null || s.lanes === 0) && (s = t.lastRenderedReducer, s !== null)) try {
        var c = t.lastRenderedState, o = s(c, a);
        if (i.hasEagerState = !0, i.eagerState = o, Tt(o, c)) return yi(e, t, i, 0), Ve === null && ji(), !1;
      } catch {
      }
      if (a = Ps(e, t, i, l), a !== null) return Et(a, e, l), ru(a, t, l), !0;
    }
    return !1;
  }
  function Rc(e, t, a, l) {
    if (l = {
      lane: 2,
      revertLane: hr(),
      gesture: null,
      action: l,
      hasEagerState: !1,
      eagerState: null,
      next: null
    }, Gi(e)) {
      if (t) throw Error(d(479));
    } else t = Ps(e, a, l, 2), t !== null && Et(t, e, 2);
  }
  function Gi(e) {
    var t = e.alternate;
    return e === je || t !== null && t === je;
  }
  function cu(e, t) {
    Bl = Di = !0;
    var a = e.pending;
    a === null ? t.next = t : (t.next = a.next, a.next = t), e.pending = t;
  }
  function ru(e, t, a) {
    if ((a & 4194048) !== 0) {
      var l = t.lanes;
      l &= e.pendingLanes, a |= l, t.lanes = a, fo(e, a);
    }
  }
  var Mn = {
    readContext: pt,
    use: qi,
    useCallback: Ie,
    useContext: Ie,
    useEffect: Ie,
    useImperativeHandle: Ie,
    useLayoutEffect: Ie,
    useInsertionEffect: Ie,
    useMemo: Ie,
    useReducer: Ie,
    useRef: Ie,
    useState: Ie,
    useDebugValue: Ie,
    useDeferredValue: Ie,
    useTransition: Ie,
    useSyncExternalStore: Ie,
    useId: Ie,
    useHostTransitionStatus: Ie,
    useFormState: Ie,
    useActionState: Ie,
    useOptimistic: Ie,
    useMemoCache: Ie,
    useCacheRefresh: Ie
  };
  Mn.useEffectEvent = Ie;
  var ou = {
    readContext: pt,
    use: qi,
    useCallback: function(e, t) {
      return bt().memoizedState = [e, t === void 0 ? null : t], e;
    },
    useContext: pt,
    useEffect: Zd,
    useImperativeHandle: function(e, t, a) {
      a = a != null ? a.concat([e]) : null, Li(4194308, 4, $d.bind(null, t, e), a);
    },
    useLayoutEffect: function(e, t) {
      return Li(4194308, 4, e, t);
    },
    useInsertionEffect: function(e, t) {
      Li(4, 2, e, t);
    },
    useMemo: function(e, t) {
      var a = bt();
      t = t === void 0 ? null : t;
      var l = e();
      if (ul) {
        vt(!0);
        try {
          e();
        } finally {
          vt(!1);
        }
      }
      return a.memoizedState = [l, t], l;
    },
    useReducer: function(e, t, a) {
      var l = bt();
      if (a !== void 0) {
        var i = a(t);
        if (ul) {
          vt(!0);
          try {
            a(t);
          } finally {
            vt(!1);
          }
        }
      } else i = t;
      return l.memoizedState = l.baseState = i, e = {
        pending: null,
        lanes: 0,
        dispatch: null,
        lastRenderedReducer: e,
        lastRenderedState: i
      }, l.queue = e, e = e.dispatch = w0.bind(null, je, e), [l.memoizedState, e];
    },
    useRef: function(e) {
      var t = bt();
      return e = { current: e }, t.memoizedState = e;
    },
    useState: function(e) {
      e = Ac(e);
      var t = e.queue, a = su.bind(null, je, t);
      return t.dispatch = a, [e.memoizedState, a];
    },
    useDebugValue: Oc,
    useDeferredValue: function(e, t) {
      return Mc(bt(), e, t);
    },
    useTransition: function() {
      var e = Ac(!1);
      return e = tu.bind(null, je, e.queue, !0, !1), bt().memoizedState = e, [!1, e];
    },
    useSyncExternalStore: function(e, t, a) {
      var l = je, i = bt();
      if (ke) {
        if (a === void 0) throw Error(d(407));
        a = a();
      } else {
        if (a = t(), Ve === null) throw Error(d(349));
        (Ee & 127) !== 0 || kd(l, t, a);
      }
      i.memoizedState = a;
      var s = {
        value: a,
        getSnapshot: t
      };
      return i.queue = s, Zd(Od.bind(null, l, s, e), [e]), l.flags |= 2048, Yl(9, { destroy: void 0 }, Cd.bind(null, l, s, a, t), null), a;
    },
    useId: function() {
      var e = bt(), t = Ve.identifierPrefix;
      if (ke) {
        var a = ea, l = Pt;
        a = (l & ~(1 << 32 - ct(l) - 1)).toString(32) + a, t = "_" + t + "R_" + a, a = Ui++, 0 < a && (t += "H" + a.toString(32)), t += "_";
      } else a = b0++, t = "_" + t + "r_" + a.toString(32) + "_";
      return e.memoizedState = t;
    },
    useHostTransitionStatus: Uc,
    useFormState: Gd,
    useActionState: Gd,
    useOptimistic: function(e) {
      var t = bt();
      t.memoizedState = t.baseState = e;
      var a = {
        pending: null,
        lanes: 0,
        dispatch: null,
        lastRenderedReducer: null,
        lastRenderedState: null
      };
      return t.queue = a, t = Rc.bind(null, je, !0, a), a.dispatch = t, [e, t];
    },
    useMemoCache: wc,
    useCacheRefresh: function() {
      return bt().memoizedState = _0.bind(null, je);
    },
    useEffectEvent: function(e) {
      var t = bt(), a = { impl: e };
      return t.memoizedState = a, function() {
        if ((De & 2) !== 0) throw Error(d(440));
        return a.impl.apply(void 0, arguments);
      };
    }
  }, qc = {
    readContext: pt,
    use: qi,
    useCallback: Fd,
    useContext: pt,
    useEffect: Cc,
    useImperativeHandle: Wd,
    useInsertionEffect: Jd,
    useLayoutEffect: Id,
    useMemo: Pd,
    useReducer: Hi,
    useRef: Qd,
    useState: function() {
      return Hi(fa);
    },
    useDebugValue: Oc,
    useDeferredValue: function(e, t) {
      return eu(et(), He.memoizedState, e, t);
    },
    useTransition: function() {
      var e = Hi(fa)[0], t = et().memoizedState;
      return [typeof e == "boolean" ? e : Cn(e), t];
    },
    useSyncExternalStore: Ad,
    useId: nu,
    useHostTransitionStatus: Uc,
    useFormState: Yd,
    useActionState: Yd,
    useOptimistic: function(e, t) {
      return Ud(et(), He, e, t);
    },
    useMemoCache: wc,
    useCacheRefresh: iu
  };
  qc.useEffectEvent = Kd;
  var du = {
    readContext: pt,
    use: qi,
    useCallback: Fd,
    useContext: pt,
    useEffect: Cc,
    useImperativeHandle: Wd,
    useInsertionEffect: Jd,
    useLayoutEffect: Id,
    useMemo: Pd,
    useReducer: Tc,
    useRef: Qd,
    useState: function() {
      return Tc(fa);
    },
    useDebugValue: Oc,
    useDeferredValue: function(e, t) {
      var a = et();
      return He === null ? Mc(a, e, t) : eu(a, He.memoizedState, e, t);
    },
    useTransition: function() {
      var e = Tc(fa)[0], t = et().memoizedState;
      return [typeof e == "boolean" ? e : Cn(e), t];
    },
    useSyncExternalStore: Ad,
    useId: nu,
    useHostTransitionStatus: Uc,
    useFormState: Xd,
    useActionState: Xd,
    useOptimistic: function(e, t) {
      var a = et();
      return He !== null ? Ud(a, He, e, t) : (a.baseState = e, [e, a.queue.dispatch]);
    },
    useMemoCache: wc,
    useCacheRefresh: iu
  };
  du.useEffectEvent = Kd;
  function Hc(e, t, a, l) {
    t = e.memoizedState, a = a(l, t), a = a == null ? t : U({}, t, a), e.memoizedState = a, e.lanes === 0 && (e.updateQueue.baseState = a);
  }
  var Lc = {
    enqueueSetState: function(e, t, a) {
      e = e._reactInternals;
      var l = Xt(), i = ol(l);
      i.payload = t, a != null && (i.callback = a), t = dl(e, i, l), t !== null && (Et(t, e, l), En(t, e, l));
    },
    enqueueReplaceState: function(e, t, a) {
      e = e._reactInternals;
      var l = Xt(), i = ol(l);
      i.tag = 1, i.payload = t, a != null && (i.callback = a), t = dl(e, i, l), t !== null && (Et(t, e, l), En(t, e, l));
    },
    enqueueForceUpdate: function(e, t) {
      e = e._reactInternals;
      var a = Xt(), l = ol(a);
      l.tag = 2, t != null && (l.callback = t), t = dl(e, l, a), t !== null && (Et(t, e, a), En(t, e, a));
    }
  };
  function uu(e, t, a, l, i, s, c) {
    return e = e.stateNode, typeof e.shouldComponentUpdate == "function" ? e.shouldComponentUpdate(l, s, c) : t.prototype && t.prototype.isPureReactComponent ? !bn(a, l) || !bn(i, s) : !0;
  }
  function fu(e, t, a, l) {
    e = t.state, typeof t.componentWillReceiveProps == "function" && t.componentWillReceiveProps(a, l), typeof t.UNSAFE_componentWillReceiveProps == "function" && t.UNSAFE_componentWillReceiveProps(a, l), t.state !== e && Lc.enqueueReplaceState(t, t.state, null);
  }
  function fl(e, t) {
    var a = t;
    if ("ref" in t) {
      a = {};
      for (var l in t) l !== "ref" && (a[l] = t[l]);
    }
    if (e = e.defaultProps) {
      a === t && (a = U({}, a));
      for (var i in e) a[i] === void 0 && (a[i] = e[i]);
    }
    return a;
  }
  function E0(e) {
    bi(e);
  }
  function T0(e) {
    console.error(e);
  }
  function A0(e) {
    bi(e);
  }
  function Yi(e, t) {
    try {
      var a = e.onUncaughtError;
      a(t.value, { componentStack: t.stack });
    } catch (l) {
      setTimeout(function() {
        throw l;
      });
    }
  }
  function pu(e, t, a) {
    try {
      var l = e.onCaughtError;
      l(a.value, {
        componentStack: a.stack,
        errorBoundary: t.tag === 1 ? t.stateNode : null
      });
    } catch (i) {
      setTimeout(function() {
        throw i;
      });
    }
  }
  function Bc(e, t, a) {
    return a = ol(a), a.tag = 3, a.payload = { element: null }, a.callback = function() {
      Yi(e, t);
    }, a;
  }
  function hu(e) {
    return e = ol(e), e.tag = 3, e;
  }
  function mu(e, t, a, l) {
    var i = a.type.getDerivedStateFromError;
    if (typeof i == "function") {
      var s = l.value;
      e.payload = function() {
        return i(s);
      }, e.callback = function() {
        pu(t, a, l);
      };
    }
    var c = a.stateNode;
    c !== null && typeof c.componentDidCatch == "function" && (e.callback = function() {
      pu(t, a, l), typeof i != "function" && (Ra === null ? Ra = /* @__PURE__ */ new Set([this]) : Ra.add(this));
      var o = l.stack;
      this.componentDidCatch(l.value, { componentStack: o !== null ? o : "" });
    });
  }
  function k0(e, t, a, l, i) {
    if (a.flags |= 32768, l !== null && typeof l == "object" && typeof l.then == "function") {
      if (t = a.alternate, t !== null && Dl(t, a, i, !0), a = kt.current, a !== null) {
        switch (a.tag) {
          case 31:
          case 13:
            return Vt === null ? es() : a.alternate === null && $e === 0 && ($e = 3), a.flags &= -257, a.flags |= 65536, a.lanes = i, l === Ai ? a.flags |= 16384 : (t = a.updateQueue, t === null ? a.updateQueue = /* @__PURE__ */ new Set([l]) : t.add(l), ur(e, l, i)), !1;
          case 22:
            return a.flags |= 65536, l === Ai ? a.flags |= 16384 : (t = a.updateQueue, t === null ? (t = {
              transitions: null,
              markerInstances: null,
              retryQueue: /* @__PURE__ */ new Set([l])
            }, a.updateQueue = t) : (a = t.retryQueue, a === null ? t.retryQueue = /* @__PURE__ */ new Set([l]) : a.add(l)), ur(e, l, i)), !1;
        }
        throw Error(d(435, a.tag));
      }
      return ur(e, l, i), es(), !1;
    }
    if (ke) return t = kt.current, t !== null ? ((t.flags & 65536) === 0 && (t.flags |= 256), t.flags |= 65536, t.lanes = i, l !== ic && (e = Error(d(422), { cause: l }), Sn(Lt(e, a)))) : (l !== ic && (t = Error(d(423), { cause: l }), Sn(Lt(t, a))), e = e.current.alternate, e.flags |= 65536, i &= -i, e.lanes |= i, l = Lt(l, a), i = Bc(e.stateNode, l, i), xc(e, i), $e !== 4 && ($e = 2)), !1;
    var s = Error(d(520), { cause: l });
    if (s = Lt(s, a), Gn === null ? Gn = [s] : Gn.push(s), $e !== 4 && ($e = 2), t === null) return !0;
    l = Lt(l, a), a = t;
    do {
      switch (a.tag) {
        case 3:
          return a.flags |= 65536, e = i & -i, a.lanes |= e, e = Bc(a.stateNode, l, e), xc(a, e), !1;
        case 1:
          if (t = a.type, s = a.stateNode, (a.flags & 128) === 0 && (typeof t.getDerivedStateFromError == "function" || s !== null && typeof s.componentDidCatch == "function" && (Ra === null || !Ra.has(s)))) return a.flags |= 65536, i &= -i, a.lanes |= i, i = hu(i), mu(i, e, a, l), xc(a, i), !1;
      }
      a = a.return;
    } while (a !== null);
    return !1;
  }
  var Gc = Error(d(461)), it = !1;
  function ht(e, t, a, l) {
    t.child = e === null ? Sd(t, null, a, l) : rl(t, e.child, a, l);
  }
  function xu(e, t, a, l, i) {
    a = a.render;
    var s = t.ref;
    if ("ref" in l) {
      var c = {};
      for (var o in l) o !== "ref" && (c[o] = l[o]);
    } else c = l;
    return nl(t), l = Sc(e, t, a, c, s, i), o = zc(), e !== null && !it ? (Nc(e, t, i), pa(e, t, i)) : (ke && o && lc(t), t.flags |= 1, ht(e, t, l, i), t.child);
  }
  function gu(e, t, a, l, i) {
    if (e === null) {
      var s = a.type;
      return typeof s == "function" && !ec(s) && s.defaultProps === void 0 && a.compare === null ? (t.tag = 15, t.type = s, vu(e, t, s, l, i)) : (e = zi(a.type, null, l, t, t.mode, i), e.ref = t.ref, e.return = t, t.child = e);
    }
    if (s = e.child, !Ic(e, i)) {
      var c = s.memoizedProps;
      if (a = a.compare, a = a !== null ? a : bn, a(c, l) && e.ref === t.ref) return pa(e, t, i);
    }
    return t.flags |= 1, e = ca(s, l), e.ref = t.ref, e.return = t, t.child = e;
  }
  function vu(e, t, a, l, i) {
    if (e !== null) {
      var s = e.memoizedProps;
      if (bn(s, l) && e.ref === t.ref) if (it = !1, t.pendingProps = l = s, Ic(e, i)) (e.flags & 131072) !== 0 && (it = !0);
      else return t.lanes = e.lanes, pa(e, t, i);
    }
    return Yc(e, t, a, l, i);
  }
  function bu(e, t, a, l) {
    var i = l.children, s = e !== null ? e.memoizedState : null;
    if (e === null && t.stateNode === null && (t.stateNode = {
      _visibility: 1,
      _pendingMarkers: null,
      _retryCache: null,
      _transitions: null
    }), l.mode === "hidden") {
      if ((t.flags & 128) !== 0) {
        if (s = s !== null ? s.baseLanes | a : a, e !== null) {
          for (l = t.child = e.child, i = 0; l !== null; ) i = i | l.lanes | l.childLanes, l = l.sibling;
          l = i & ~s;
        } else l = 0, t.child = null;
        return ju(e, t, s, a, l);
      }
      if ((a & 536870912) !== 0) t.memoizedState = {
        baseLanes: 0,
        cachePool: null
      }, e !== null && Ei(t, s !== null ? s.cachePool : null), s !== null ? _d(t, s) : vc(), wd(t);
      else return l = t.lanes = 536870912, ju(e, t, s !== null ? s.baseLanes | a : a, a, l);
    } else s !== null ? (Ei(t, s.cachePool), _d(t, s), Oa(t), t.memoizedState = null) : (e !== null && Ei(t, null), vc(), Oa(t));
    return ht(e, t, i, a), t.child;
  }
  function Dn(e, t) {
    return e !== null && e.tag === 22 || t.stateNode !== null || (t.stateNode = {
      _visibility: 1,
      _pendingMarkers: null,
      _retryCache: null,
      _transitions: null
    }), t.sibling;
  }
  function ju(e, t, a, l, i) {
    var s = fc();
    return s = s === null ? null : {
      parent: lt._currentValue,
      pool: s
    }, t.memoizedState = {
      baseLanes: a,
      cachePool: s
    }, e !== null && Ei(t, null), vc(), wd(t), e !== null && Dl(e, t, l, !0), t.childLanes = i, null;
  }
  function Vi(e, t) {
    return t = Qi({
      mode: t.mode,
      children: t.children
    }, e.mode), t.ref = e.ref, e.child = t, t.return = e, t;
  }
  function yu(e, t, a) {
    return rl(t, e.child, null, a), e = Vi(t, t.pendingProps), e.flags |= 2, Ct(t), t.memoizedState = null, e;
  }
  function C0(e, t, a) {
    var l = t.pendingProps, i = (t.flags & 128) !== 0;
    if (t.flags &= -129, e === null) {
      if (ke) {
        if (l.mode === "hidden") return e = Vi(t, l), t.lanes = 536870912, Dn(null, e);
        if (jc(t), (e = Qe) ? (e = Uf(e, Yt), e = e !== null && e.data === "&" ? e : null, e !== null && (t.memoizedState = {
          dehydrated: e,
          treeContext: wa !== null ? {
            id: Pt,
            overflow: ea
          } : null,
          retryLane: 536870912,
          hydrationErrors: null
        }, a = cd(e), a.return = t, t.child = a, ft = t, Qe = null)) : e = null, e === null) throw Ta(t);
        return t.lanes = 536870912, null;
      }
      return Vi(t, l);
    }
    var s = e.memoizedState;
    if (s !== null) {
      var c = s.dehydrated;
      if (jc(t), i) if (t.flags & 256) t.flags &= -257, t = yu(e, t, a);
      else if (t.memoizedState !== null) t.child = e.child, t.flags |= 128, t = null;
      else throw Error(d(558));
      else if (it || Dl(e, t, a, !1), i = (a & e.childLanes) !== 0, it || i) {
        if (l = Ve, l !== null && (c = po(l, a), c !== 0 && c !== s.retryLane)) throw s.retryLane = c, el(e, c), Et(l, e, c), Gc;
        es(), t = yu(e, t, a);
      } else e = s.treeContext, Qe = Qt(c.nextSibling), ft = t, ke = !0, Ea = null, Yt = !1, e !== null && dd(t, e), t = Vi(t, l), t.flags |= 4096;
      return t;
    }
    return e = ca(e.child, {
      mode: l.mode,
      children: l.children
    }), e.ref = t.ref, t.child = e, e.return = t, e;
  }
  function Xi(e, t) {
    var a = t.ref;
    if (a === null) e !== null && e.ref !== null && (t.flags |= 4194816);
    else {
      if (typeof a != "function" && typeof a != "object") throw Error(d(284));
      (e === null || e.ref !== a) && (t.flags |= 4194816);
    }
  }
  function Yc(e, t, a, l, i) {
    return nl(t), a = Sc(e, t, a, l, void 0, i), l = zc(), e !== null && !it ? (Nc(e, t, i), pa(e, t, i)) : (ke && l && lc(t), t.flags |= 1, ht(e, t, a, i), t.child);
  }
  function Su(e, t, a, l, i, s) {
    return nl(t), t.updateQueue = null, a = Td(t, l, a, i), Ed(e), l = zc(), e !== null && !it ? (Nc(e, t, s), pa(e, t, s)) : (ke && l && lc(t), t.flags |= 1, ht(e, t, a, s), t.child);
  }
  function zu(e, t, a, l, i) {
    if (nl(t), t.stateNode === null) {
      var s = kl, c = a.contextType;
      typeof c == "object" && c !== null && (s = pt(c)), s = new a(l, s), t.memoizedState = s.state !== null && s.state !== void 0 ? s.state : null, s.updater = Lc, t.stateNode = s, s._reactInternals = t, s = t.stateNode, s.props = l, s.state = t.memoizedState, s.refs = {}, hc(t), c = a.contextType, s.context = typeof c == "object" && c !== null ? pt(c) : kl, s.state = t.memoizedState, c = a.getDerivedStateFromProps, typeof c == "function" && (Hc(t, a, c, l), s.state = t.memoizedState), typeof a.getDerivedStateFromProps == "function" || typeof s.getSnapshotBeforeUpdate == "function" || typeof s.UNSAFE_componentWillMount != "function" && typeof s.componentWillMount != "function" || (c = s.state, typeof s.componentWillMount == "function" && s.componentWillMount(), typeof s.UNSAFE_componentWillMount == "function" && s.UNSAFE_componentWillMount(), c !== s.state && Lc.enqueueReplaceState(s, s.state, null), An(t, l, s, i), Tn(), s.state = t.memoizedState), typeof s.componentDidMount == "function" && (t.flags |= 4194308), l = !0;
    } else if (e === null) {
      s = t.stateNode;
      var o = t.memoizedProps, f = fl(a, o);
      s.props = f;
      var _ = s.context, D = a.contextType;
      c = kl, typeof D == "object" && D !== null && (c = pt(D));
      var B = a.getDerivedStateFromProps;
      D = typeof B == "function" || typeof s.getSnapshotBeforeUpdate == "function", o = t.pendingProps !== o, D || typeof s.UNSAFE_componentWillReceiveProps != "function" && typeof s.componentWillReceiveProps != "function" || (o || _ !== c) && fu(t, s, l, c), ka = !1;
      var w = t.memoizedState;
      s.state = w, An(t, l, s, i), Tn(), _ = t.memoizedState, o || w !== _ || ka ? (typeof B == "function" && (Hc(t, a, B, l), _ = t.memoizedState), (f = ka || uu(t, a, f, l, w, _, c)) ? (D || typeof s.UNSAFE_componentWillMount != "function" && typeof s.componentWillMount != "function" || (typeof s.componentWillMount == "function" && s.componentWillMount(), typeof s.UNSAFE_componentWillMount == "function" && s.UNSAFE_componentWillMount()), typeof s.componentDidMount == "function" && (t.flags |= 4194308)) : (typeof s.componentDidMount == "function" && (t.flags |= 4194308), t.memoizedProps = l, t.memoizedState = _), s.props = l, s.state = _, s.context = c, l = f) : (typeof s.componentDidMount == "function" && (t.flags |= 4194308), l = !1);
    } else {
      s = t.stateNode, mc(e, t), c = t.memoizedProps, D = fl(a, c), s.props = D, B = t.pendingProps, w = s.context, _ = a.contextType, f = kl, typeof _ == "object" && _ !== null && (f = pt(_)), o = a.getDerivedStateFromProps, (_ = typeof o == "function" || typeof s.getSnapshotBeforeUpdate == "function") || typeof s.UNSAFE_componentWillReceiveProps != "function" && typeof s.componentWillReceiveProps != "function" || (c !== B || w !== f) && fu(t, s, l, f), ka = !1, w = t.memoizedState, s.state = w, An(t, l, s, i), Tn();
      var O = t.memoizedState;
      c !== B || w !== O || ka || e !== null && e.dependencies !== null && _i(e.dependencies) ? (typeof o == "function" && (Hc(t, a, o, l), O = t.memoizedState), (D = ka || uu(t, a, D, l, w, O, f) || e !== null && e.dependencies !== null && _i(e.dependencies)) ? (_ || typeof s.UNSAFE_componentWillUpdate != "function" && typeof s.componentWillUpdate != "function" || (typeof s.componentWillUpdate == "function" && s.componentWillUpdate(l, O, f), typeof s.UNSAFE_componentWillUpdate == "function" && s.UNSAFE_componentWillUpdate(l, O, f)), typeof s.componentDidUpdate == "function" && (t.flags |= 4), typeof s.getSnapshotBeforeUpdate == "function" && (t.flags |= 1024)) : (typeof s.componentDidUpdate != "function" || c === e.memoizedProps && w === e.memoizedState || (t.flags |= 4), typeof s.getSnapshotBeforeUpdate != "function" || c === e.memoizedProps && w === e.memoizedState || (t.flags |= 1024), t.memoizedProps = l, t.memoizedState = O), s.props = l, s.state = O, s.context = f, l = D) : (typeof s.componentDidUpdate != "function" || c === e.memoizedProps && w === e.memoizedState || (t.flags |= 4), typeof s.getSnapshotBeforeUpdate != "function" || c === e.memoizedProps && w === e.memoizedState || (t.flags |= 1024), l = !1);
    }
    return s = l, Xi(e, t), l = (t.flags & 128) !== 0, s || l ? (s = t.stateNode, a = l && typeof a.getDerivedStateFromError != "function" ? null : s.render(), t.flags |= 1, e !== null && l ? (t.child = rl(t, e.child, null, i), t.child = rl(t, null, a, i)) : ht(e, t, a, i), t.memoizedState = s.state, e = t.child) : e = pa(e, t, i), e;
  }
  function Nu(e, t, a, l) {
    return al(), t.flags |= 256, ht(e, t, a, l), t.child;
  }
  var Vc = {
    dehydrated: null,
    treeContext: null,
    retryLane: 0,
    hydrationErrors: null
  };
  function Xc(e) {
    return {
      baseLanes: e,
      cachePool: xd()
    };
  }
  function Qc(e, t, a) {
    return e = e !== null ? e.childLanes & ~a : 0, t && (e |= Mt), e;
  }
  function _u(e, t, a) {
    var l = t.pendingProps, i = !1, s = (t.flags & 128) !== 0, c;
    if ((c = s) || (c = e !== null && e.memoizedState === null ? !1 : (Pe.current & 2) !== 0), c && (i = !0, t.flags &= -129), c = (t.flags & 32) !== 0, t.flags &= -33, e === null) {
      if (ke) {
        if (i ? Ca(t) : Oa(t), (e = Qe) ? (e = Uf(e, Yt), e = e !== null && e.data !== "&" ? e : null, e !== null && (t.memoizedState = {
          dehydrated: e,
          treeContext: wa !== null ? {
            id: Pt,
            overflow: ea
          } : null,
          retryLane: 536870912,
          hydrationErrors: null
        }, a = cd(e), a.return = t, t.child = a, ft = t, Qe = null)) : e = null, e === null) throw Ta(t);
        return wr(e) ? t.lanes = 32 : t.lanes = 536870912, null;
      }
      var o = l.children;
      return l = l.fallback, i ? (Oa(t), i = t.mode, o = Qi({
        mode: "hidden",
        children: o
      }, i), l = tl(l, i, a, null), o.return = t, l.return = t, o.sibling = l, t.child = o, l = t.child, l.memoizedState = Xc(a), l.childLanes = Qc(e, c, a), t.memoizedState = Vc, Dn(null, l)) : (Ca(t), Zc(t, o));
    }
    var f = e.memoizedState;
    if (f !== null && (o = f.dehydrated, o !== null)) {
      if (s) t.flags & 256 ? (Ca(t), t.flags &= -257, t = Kc(e, t, a)) : t.memoizedState !== null ? (Oa(t), t.child = e.child, t.flags |= 128, t = null) : (Oa(t), o = l.fallback, i = t.mode, l = Qi({
        mode: "visible",
        children: l.children
      }, i), o = tl(o, i, a, null), o.flags |= 2, l.return = t, o.return = t, l.sibling = o, t.child = l, rl(t, e.child, null, a), l = t.child, l.memoizedState = Xc(a), l.childLanes = Qc(e, c, a), t.memoizedState = Vc, t = Dn(null, l));
      else if (Ca(t), wr(o)) {
        if (c = o.nextSibling && o.nextSibling.dataset, c) var _ = c.dgst;
        c = _, l = Error(d(419)), l.stack = "", l.digest = c, Sn({
          value: l,
          source: null,
          stack: null
        }), t = Kc(e, t, a);
      } else if (it || Dl(e, t, a, !1), c = (a & e.childLanes) !== 0, it || c) {
        if (c = Ve, c !== null && (l = po(c, a), l !== 0 && l !== f.retryLane)) throw f.retryLane = l, el(e, l), Et(c, e, l), Gc;
        _r(o) || es(), t = Kc(e, t, a);
      } else _r(o) ? (t.flags |= 192, t.child = e.child, t = null) : (e = f.treeContext, Qe = Qt(o.nextSibling), ft = t, ke = !0, Ea = null, Yt = !1, e !== null && dd(t, e), t = Zc(t, l.children), t.flags |= 4096);
      return t;
    }
    return i ? (Oa(t), o = l.fallback, i = t.mode, f = e.child, _ = f.sibling, l = ca(f, {
      mode: "hidden",
      children: l.children
    }), l.subtreeFlags = f.subtreeFlags & 65011712, _ !== null ? o = ca(_, o) : (o = tl(o, i, a, null), o.flags |= 2), o.return = t, l.return = t, l.sibling = o, t.child = l, Dn(null, l), l = t.child, o = e.child.memoizedState, o === null ? o = Xc(a) : (i = o.cachePool, i !== null ? (f = lt._currentValue, i = i.parent !== f ? {
      parent: f,
      pool: f
    } : i) : i = xd(), o = {
      baseLanes: o.baseLanes | a,
      cachePool: i
    }), l.memoizedState = o, l.childLanes = Qc(e, c, a), t.memoizedState = Vc, Dn(e.child, l)) : (Ca(t), a = e.child, e = a.sibling, a = ca(a, {
      mode: "visible",
      children: l.children
    }), a.return = t, a.sibling = null, e !== null && (c = t.deletions, c === null ? (t.deletions = [e], t.flags |= 16) : c.push(e)), t.child = a, t.memoizedState = null, a);
  }
  function Zc(e, t) {
    return t = Qi({
      mode: "visible",
      children: t
    }, e.mode), t.return = e, e.child = t;
  }
  function Qi(e, t) {
    return e = At(22, e, null, t), e.lanes = 0, e;
  }
  function Kc(e, t, a) {
    return rl(t, e.child, null, a), e = Zc(t, t.pendingProps.children), e.flags |= 2, t.memoizedState = null, e;
  }
  function wu(e, t, a) {
    e.lanes |= t;
    var l = e.alternate;
    l !== null && (l.lanes |= t), rc(e.return, t, a);
  }
  function Jc(e, t, a, l, i, s) {
    var c = e.memoizedState;
    c === null ? e.memoizedState = {
      isBackwards: t,
      rendering: null,
      renderingStartTime: 0,
      last: l,
      tail: a,
      tailMode: i,
      treeForkCount: s
    } : (c.isBackwards = t, c.rendering = null, c.renderingStartTime = 0, c.last = l, c.tail = a, c.tailMode = i, c.treeForkCount = s);
  }
  function Eu(e, t, a) {
    var l = t.pendingProps, i = l.revealOrder, s = l.tail;
    l = l.children;
    var c = Pe.current, o = (c & 2) !== 0;
    if (o ? (c = c & 1 | 2, t.flags |= 128) : c &= 1, Z(Pe, c), ht(e, t, l, a), l = ke ? yn : 0, !o && e !== null && (e.flags & 128) !== 0) e: for (e = t.child; e !== null; ) {
      if (e.tag === 13) e.memoizedState !== null && wu(e, a, t);
      else if (e.tag === 19) wu(e, a, t);
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
        for (a = t.child, i = null; a !== null; ) e = a.alternate, e !== null && Mi(e) === null && (i = a), a = a.sibling;
        a = i, a === null ? (i = t.child, t.child = null) : (i = a.sibling, a.sibling = null), Jc(t, !1, i, a, s, l);
        break;
      case "backwards":
      case "unstable_legacy-backwards":
        for (a = null, i = t.child, t.child = null; i !== null; ) {
          if (e = i.alternate, e !== null && Mi(e) === null) {
            t.child = i;
            break;
          }
          e = i.sibling, i.sibling = a, a = i, i = e;
        }
        Jc(t, !0, a, null, s, l);
        break;
      case "together":
        Jc(t, !1, null, null, void 0, l);
        break;
      default:
        t.memoizedState = null;
    }
    return t.child;
  }
  function pa(e, t, a) {
    if (e !== null && (t.dependencies = e.dependencies), Ua |= t.lanes, (a & t.childLanes) === 0) if (e !== null) {
      if (Dl(e, t, a, !1), (a & t.childLanes) === 0) return null;
    } else return null;
    if (e !== null && t.child !== e.child) throw Error(d(153));
    if (t.child !== null) {
      for (e = t.child, a = ca(e, e.pendingProps), t.child = a, a.return = t; e.sibling !== null; ) e = e.sibling, a = a.sibling = ca(e, e.pendingProps), a.return = t;
      a.sibling = null;
    }
    return t.child;
  }
  function Ic(e, t) {
    return (e.lanes & t) !== 0 ? !0 : (e = e.dependencies, !!(e !== null && _i(e)));
  }
  function O0(e, t, a) {
    switch (t.tag) {
      case 3:
        ze(t, t.stateNode.containerInfo), Aa(t, lt, e.memoizedState.cache), al();
        break;
      case 27:
      case 5:
        Je(t);
        break;
      case 4:
        ze(t, t.stateNode.containerInfo);
        break;
      case 10:
        Aa(t, t.type, t.memoizedProps.value);
        break;
      case 31:
        if (t.memoizedState !== null) return t.flags |= 128, jc(t), null;
        break;
      case 13:
        var l = t.memoizedState;
        if (l !== null)
          return l.dehydrated !== null ? (Ca(t), t.flags |= 128, null) : (a & t.child.childLanes) !== 0 ? _u(e, t, a) : (Ca(t), e = pa(e, t, a), e !== null ? e.sibling : null);
        Ca(t);
        break;
      case 19:
        var i = (e.flags & 128) !== 0;
        if (l = (a & t.childLanes) !== 0, l || (Dl(e, t, a, !1), l = (a & t.childLanes) !== 0), i) {
          if (l) return Eu(e, t, a);
          t.flags |= 128;
        }
        if (i = t.memoizedState, i !== null && (i.rendering = null, i.tail = null, i.lastEffect = null), Z(Pe, Pe.current), l) break;
        return null;
      case 22:
        return t.lanes = 0, bu(e, t, a, t.pendingProps);
      case 24:
        Aa(t, lt, e.memoizedState.cache);
    }
    return pa(e, t, a);
  }
  function Tu(e, t, a) {
    if (e !== null) if (e.memoizedProps !== t.pendingProps) it = !0;
    else {
      if (!Ic(e, a) && (t.flags & 128) === 0) return it = !1, O0(e, t, a);
      it = (e.flags & 131072) !== 0;
    }
    else it = !1, ke && (t.flags & 1048576) !== 0 && od(t, yn, t.index);
    switch (t.lanes = 0, t.tag) {
      case 16:
        e: {
          var l = t.pendingProps;
          if (e = sl(t.elementType), t.type = e, typeof e == "function") ec(e) ? (l = fl(e, l), t.tag = 1, t = zu(null, t, e, l, a)) : (t.tag = 0, t = Yc(null, t, e, l, a));
          else {
            if (e != null) {
              var i = e.$$typeof;
              if (i === W) {
                t.tag = 11, t = xu(null, t, e, l, a);
                break e;
              } else if (i === ce) {
                t.tag = 14, t = gu(null, t, e, l, a);
                break e;
              }
            }
            throw t = F(e) || e, Error(d(306, t, ""));
          }
        }
        return t;
      case 0:
        return Yc(e, t, t.type, t.pendingProps, a);
      case 1:
        return l = t.type, i = fl(l, t.pendingProps), zu(e, t, l, i, a);
      case 3:
        e: {
          if (ze(t, t.stateNode.containerInfo), e === null) throw Error(d(387));
          l = t.pendingProps;
          var s = t.memoizedState;
          i = s.element, mc(e, t), An(t, l, null, a);
          var c = t.memoizedState;
          if (l = c.cache, Aa(t, lt, l), l !== s.cache && oc(t, [lt], a, !0), Tn(), l = c.element, s.isDehydrated) if (s = {
            element: l,
            isDehydrated: !1,
            cache: c.cache
          }, t.updateQueue.baseState = s, t.memoizedState = s, t.flags & 256) {
            t = Nu(e, t, l, a);
            break e;
          } else if (l !== i) {
            i = Lt(Error(d(424)), t), Sn(i), t = Nu(e, t, l, a);
            break e;
          } else
            for (e = t.stateNode.containerInfo, e.nodeType === 9 ? e = e.body : e = e.nodeName === "HTML" ? e.ownerDocument.body : e, Qe = Qt(e.firstChild), ft = t, ke = !0, Ea = null, Yt = !0, a = Sd(t, null, l, a), t.child = a; a; ) a.flags = a.flags & -3 | 4096, a = a.sibling;
          else {
            if (al(), l === i) {
              t = pa(e, t, a);
              break e;
            }
            ht(e, t, l, a);
          }
          t = t.child;
        }
        return t;
      case 26:
        return Xi(e, t), e === null ? (a = Gf(t.type, null, t.pendingProps, null)) ? t.memoizedState = a : ke || (a = t.type, e = t.pendingProps, l = cs($.current).createElement(a), l[ut] = t, l[yt] = e, mt(l, a, e), ot(l), t.stateNode = l) : t.memoizedState = Gf(t.type, e.memoizedProps, t.pendingProps, e.memoizedState), null;
      case 27:
        return Je(t), e === null && ke && (l = t.stateNode = Hf(t.type, t.pendingProps, $.current), ft = t, Yt = !0, i = Qe, Ba(t.type) ? (Er = i, Qe = Qt(l.firstChild)) : Qe = i), ht(e, t, t.pendingProps.children, a), Xi(e, t), e === null && (t.flags |= 4194304), t.child;
      case 5:
        return e === null && ke && ((i = l = Qe) && (l = sh(l, t.type, t.pendingProps, Yt), l !== null ? (t.stateNode = l, ft = t, Qe = Qt(l.firstChild), Yt = !1, i = !0) : i = !1), i || Ta(t)), Je(t), i = t.type, s = t.pendingProps, c = e !== null ? e.memoizedProps : null, l = s.children, Sr(i, s) ? l = null : c !== null && Sr(i, c) && (t.flags |= 32), t.memoizedState !== null && (i = Sc(e, t, j0, null, null, a), In._currentValue = i), Xi(e, t), ht(e, t, l, a), t.child;
      case 6:
        return e === null && ke && ((e = a = Qe) && (a = ch(a, t.pendingProps, Yt), a !== null ? (t.stateNode = a, ft = t, Qe = null, e = !0) : e = !1), e || Ta(t)), null;
      case 13:
        return _u(e, t, a);
      case 4:
        return ze(t, t.stateNode.containerInfo), l = t.pendingProps, e === null ? t.child = rl(t, null, l, a) : ht(e, t, l, a), t.child;
      case 11:
        return xu(e, t, t.type, t.pendingProps, a);
      case 7:
        return ht(e, t, t.pendingProps, a), t.child;
      case 8:
        return ht(e, t, t.pendingProps.children, a), t.child;
      case 12:
        return ht(e, t, t.pendingProps.children, a), t.child;
      case 10:
        return l = t.pendingProps, Aa(t, t.type, l.value), ht(e, t, l.children, a), t.child;
      case 9:
        return i = t.type._context, l = t.pendingProps.children, nl(t), i = pt(i), l = l(i), t.flags |= 1, ht(e, t, l, a), t.child;
      case 14:
        return gu(e, t, t.type, t.pendingProps, a);
      case 15:
        return vu(e, t, t.type, t.pendingProps, a);
      case 19:
        return Eu(e, t, a);
      case 31:
        return C0(e, t, a);
      case 22:
        return bu(e, t, a, t.pendingProps);
      case 24:
        return nl(t), l = pt(lt), e === null ? (i = fc(), i === null && (i = Ve, s = dc(), i.pooledCache = s, s.refCount++, s !== null && (i.pooledCacheLanes |= a), i = s), t.memoizedState = {
          parent: l,
          cache: i
        }, hc(t), Aa(t, lt, i)) : ((e.lanes & a) !== 0 && (mc(e, t), An(t, null, null, a), Tn()), i = e.memoizedState, s = t.memoizedState, i.parent !== l ? (i = {
          parent: l,
          cache: l
        }, t.memoizedState = i, t.lanes === 0 && (t.memoizedState = t.updateQueue.baseState = i), Aa(t, lt, l)) : (l = s.cache, Aa(t, lt, l), l !== i.cache && oc(t, [lt], a, !0))), ht(e, t, t.pendingProps.children, a), t.child;
      case 29:
        throw t.pendingProps;
    }
    throw Error(d(156, t.tag));
  }
  function ha(e) {
    e.flags |= 4;
  }
  function $c(e, t, a, l, i) {
    if ((t = (e.mode & 32) !== 0) && (t = !1), t) {
      if (e.flags |= 16777216, (i & 335544128) === i) if (e.stateNode.complete) e.flags |= 8192;
      else if (tf()) e.flags |= 8192;
      else throw cl = Ai, pc;
    } else e.flags &= -16777217;
  }
  function Au(e, t) {
    if (t.type !== "stylesheet" || (t.state.loading & 4) !== 0) e.flags &= -16777217;
    else if (e.flags |= 16777216, !Zf(t)) if (tf()) e.flags |= 8192;
    else throw cl = Ai, pc;
  }
  function Zi(e, t) {
    t !== null && (e.flags |= 4), e.flags & 16384 && (t = e.tag !== 22 ? oo() : 536870912, e.lanes |= t, Zl |= t);
  }
  function Un(e, t) {
    if (!ke) switch (e.tailMode) {
      case "hidden":
        t = e.tail;
        for (var a = null; t !== null; ) t.alternate !== null && (a = t), t = t.sibling;
        a === null ? e.tail = null : a.sibling = null;
        break;
      case "collapsed":
        a = e.tail;
        for (var l = null; a !== null; ) a.alternate !== null && (l = a), a = a.sibling;
        l === null ? t || e.tail === null ? e.tail = null : e.tail.sibling = null : l.sibling = null;
    }
  }
  function Ze(e) {
    var t = e.alternate !== null && e.alternate.child === e.child, a = 0, l = 0;
    if (t) for (var i = e.child; i !== null; ) a |= i.lanes | i.childLanes, l |= i.subtreeFlags & 65011712, l |= i.flags & 65011712, i.return = e, i = i.sibling;
    else for (i = e.child; i !== null; ) a |= i.lanes | i.childLanes, l |= i.subtreeFlags, l |= i.flags, i.return = e, i = i.sibling;
    return e.subtreeFlags |= l, e.childLanes = a, t;
  }
  function M0(e, t, a) {
    var l = t.pendingProps;
    switch (nc(t), t.tag) {
      case 16:
      case 15:
      case 0:
      case 11:
      case 7:
      case 8:
      case 12:
      case 9:
      case 14:
        return Ze(t), null;
      case 1:
        return Ze(t), null;
      case 3:
        return a = t.stateNode, l = null, e !== null && (l = e.memoizedState.cache), t.memoizedState.cache !== l && (t.flags |= 2048), da(lt), ye(), a.pendingContext && (a.context = a.pendingContext, a.pendingContext = null), (e === null || e.child === null) && (Ml(t) ? ha(t) : e === null || e.memoizedState.isDehydrated && (t.flags & 256) === 0 || (t.flags |= 1024, sc())), Ze(t), null;
      case 26:
        var i = t.type, s = t.memoizedState;
        return e === null ? (ha(t), s !== null ? (Ze(t), Au(t, s)) : (Ze(t), $c(t, i, null, l, a))) : s ? s !== e.memoizedState ? (ha(t), Ze(t), Au(t, s)) : (Ze(t), t.flags &= -16777217) : (e = e.memoizedProps, e !== l && ha(t), Ze(t), $c(t, i, e, l, a)), null;
      case 27:
        if (Ge(t), a = $.current, i = t.type, e !== null && t.stateNode != null) e.memoizedProps !== l && ha(t);
        else {
          if (!l) {
            if (t.stateNode === null) throw Error(d(166));
            return Ze(t), null;
          }
          e = ee.current, Ml(t) ? ud(t, e) : (e = Hf(i, l, a), t.stateNode = e, ha(t));
        }
        return Ze(t), null;
      case 5:
        if (Ge(t), i = t.type, e !== null && t.stateNode != null) e.memoizedProps !== l && ha(t);
        else {
          if (!l) {
            if (t.stateNode === null) throw Error(d(166));
            return Ze(t), null;
          }
          if (s = ee.current, Ml(t)) ud(t, s);
          else {
            var c = cs($.current);
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
                    s = typeof l.is == "string" ? c.createElement("select", { is: l.is }) : c.createElement("select"), l.multiple ? s.multiple = !0 : l.size && (s.size = l.size);
                    break;
                  default:
                    s = typeof l.is == "string" ? c.createElement(i, { is: l.is }) : c.createElement(i);
                }
            }
            s[ut] = t, s[yt] = l;
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
            e: switch (mt(s, i, l), i) {
              case "button":
              case "input":
              case "select":
              case "textarea":
                l = !!l.autoFocus;
                break e;
              case "img":
                l = !0;
                break e;
              default:
                l = !1;
            }
            l && ha(t);
          }
        }
        return Ze(t), $c(t, t.type, e === null ? null : e.memoizedProps, t.pendingProps, a), null;
      case 6:
        if (e && t.stateNode != null) e.memoizedProps !== l && ha(t);
        else {
          if (typeof l != "string" && t.stateNode === null) throw Error(d(166));
          if (e = $.current, Ml(t)) {
            if (e = t.stateNode, a = t.memoizedProps, l = null, i = ft, i !== null) switch (i.tag) {
              case 27:
              case 5:
                l = i.memoizedProps;
            }
            e[ut] = t, e = !!(e.nodeValue === a || l !== null && l.suppressHydrationWarning === !0 || Ef(e.nodeValue, a)), e || Ta(t, !0);
          } else e = cs(e).createTextNode(l), e[ut] = t, t.stateNode = e;
        }
        return Ze(t), null;
      case 31:
        if (a = t.memoizedState, e === null || e.memoizedState !== null) {
          if (l = Ml(t), a !== null) {
            if (e === null) {
              if (!l) throw Error(d(318));
              if (e = t.memoizedState, e = e !== null ? e.dehydrated : null, !e) throw Error(d(557));
              e[ut] = t;
            } else al(), (t.flags & 128) === 0 && (t.memoizedState = null), t.flags |= 4;
            Ze(t), e = !1;
          } else a = sc(), e !== null && e.memoizedState !== null && (e.memoizedState.hydrationErrors = a), e = !0;
          if (!e)
            return t.flags & 256 ? (Ct(t), t) : (Ct(t), null);
          if ((t.flags & 128) !== 0) throw Error(d(558));
        }
        return Ze(t), null;
      case 13:
        if (l = t.memoizedState, e === null || e.memoizedState !== null && e.memoizedState.dehydrated !== null) {
          if (i = Ml(t), l !== null && l.dehydrated !== null) {
            if (e === null) {
              if (!i) throw Error(d(318));
              if (i = t.memoizedState, i = i !== null ? i.dehydrated : null, !i) throw Error(d(317));
              i[ut] = t;
            } else al(), (t.flags & 128) === 0 && (t.memoizedState = null), t.flags |= 4;
            Ze(t), i = !1;
          } else i = sc(), e !== null && e.memoizedState !== null && (e.memoizedState.hydrationErrors = i), i = !0;
          if (!i)
            return t.flags & 256 ? (Ct(t), t) : (Ct(t), null);
        }
        return Ct(t), (t.flags & 128) !== 0 ? (t.lanes = a, t) : (a = l !== null, e = e !== null && e.memoizedState !== null, a && (l = t.child, i = null, l.alternate !== null && l.alternate.memoizedState !== null && l.alternate.memoizedState.cachePool !== null && (i = l.alternate.memoizedState.cachePool.pool), s = null, l.memoizedState !== null && l.memoizedState.cachePool !== null && (s = l.memoizedState.cachePool.pool), s !== i && (l.flags |= 2048)), a !== e && a && (t.child.flags |= 8192), Zi(t, t.updateQueue), Ze(t), null);
      case 4:
        return ye(), e === null && zf(t.stateNode.containerInfo), Ze(t), null;
      case 10:
        return da(t.type), Ze(t), null;
      case 19:
        if (H(Pe), l = t.memoizedState, l === null) return Ze(t), null;
        if (i = (t.flags & 128) !== 0, s = l.rendering, s === null) if (i) Un(l, !1);
        else {
          if ($e !== 0 || e !== null && (e.flags & 128) !== 0) for (e = t.child; e !== null; ) {
            if (s = Mi(e), s !== null) {
              for (t.flags |= 128, Un(l, !1), e = s.updateQueue, t.updateQueue = e, Zi(t, e), t.subtreeFlags = 0, e = a, a = t.child; a !== null; ) sd(a, e), a = a.sibling;
              return Z(Pe, Pe.current & 1 | 2), ke && ra(t, l.treeForkCount), t.child;
            }
            e = e.sibling;
          }
          l.tail !== null && We() > Wi && (t.flags |= 128, i = !0, Un(l, !1), t.lanes = 4194304);
        }
        else {
          if (!i) if (e = Mi(s), e !== null) {
            if (t.flags |= 128, i = !0, e = e.updateQueue, t.updateQueue = e, Zi(t, e), Un(l, !0), l.tail === null && l.tailMode === "hidden" && !s.alternate && !ke) return Ze(t), null;
          } else 2 * We() - l.renderingStartTime > Wi && a !== 536870912 && (t.flags |= 128, i = !0, Un(l, !1), t.lanes = 4194304);
          l.isBackwards ? (s.sibling = t.child, t.child = s) : (e = l.last, e !== null ? e.sibling = s : t.child = s, l.last = s);
        }
        return l.tail !== null ? (e = l.tail, l.rendering = e, l.tail = e.sibling, l.renderingStartTime = We(), e.sibling = null, a = Pe.current, Z(Pe, i ? a & 1 | 2 : a & 1), ke && ra(t, l.treeForkCount), e) : (Ze(t), null);
      case 22:
      case 23:
        return Ct(t), bc(), l = t.memoizedState !== null, e !== null ? e.memoizedState !== null !== l && (t.flags |= 8192) : l && (t.flags |= 8192), l ? (a & 536870912) !== 0 && (t.flags & 128) === 0 && (Ze(t), t.subtreeFlags & 6 && (t.flags |= 8192)) : Ze(t), a = t.updateQueue, a !== null && Zi(t, a.retryQueue), a = null, e !== null && e.memoizedState !== null && e.memoizedState.cachePool !== null && (a = e.memoizedState.cachePool.pool), l = null, t.memoizedState !== null && t.memoizedState.cachePool !== null && (l = t.memoizedState.cachePool.pool), l !== a && (t.flags |= 2048), e !== null && H(il), null;
      case 24:
        return a = null, e !== null && (a = e.memoizedState.cache), t.memoizedState.cache !== a && (t.flags |= 2048), da(lt), Ze(t), null;
      case 25:
        return null;
      case 30:
        return null;
    }
    throw Error(d(156, t.tag));
  }
  function D0(e, t) {
    switch (nc(t), t.tag) {
      case 1:
        return e = t.flags, e & 65536 ? (t.flags = e & -65537 | 128, t) : null;
      case 3:
        return da(lt), ye(), e = t.flags, (e & 65536) !== 0 && (e & 128) === 0 ? (t.flags = e & -65537 | 128, t) : null;
      case 26:
      case 27:
      case 5:
        return Ge(t), null;
      case 31:
        if (t.memoizedState !== null) {
          if (Ct(t), t.alternate === null) throw Error(d(340));
          al();
        }
        return e = t.flags, e & 65536 ? (t.flags = e & -65537 | 128, t) : null;
      case 13:
        if (Ct(t), e = t.memoizedState, e !== null && e.dehydrated !== null) {
          if (t.alternate === null) throw Error(d(340));
          al();
        }
        return e = t.flags, e & 65536 ? (t.flags = e & -65537 | 128, t) : null;
      case 19:
        return H(Pe), null;
      case 4:
        return ye(), null;
      case 10:
        return da(t.type), null;
      case 22:
      case 23:
        return Ct(t), bc(), e !== null && H(il), e = t.flags, e & 65536 ? (t.flags = e & -65537 | 128, t) : null;
      case 24:
        return da(lt), null;
      case 25:
        return null;
      default:
        return null;
    }
  }
  function ku(e, t) {
    switch (nc(t), t.tag) {
      case 3:
        da(lt), ye();
        break;
      case 26:
      case 27:
      case 5:
        Ge(t);
        break;
      case 4:
        ye();
        break;
      case 31:
        t.memoizedState !== null && Ct(t);
        break;
      case 13:
        Ct(t);
        break;
      case 19:
        H(Pe);
        break;
      case 10:
        da(t.type);
        break;
      case 22:
      case 23:
        Ct(t), bc(), e !== null && H(il);
        break;
      case 24:
        da(lt);
    }
  }
  function Rn(e, t) {
    try {
      var a = t.updateQueue, l = a !== null ? a.lastEffect : null;
      if (l !== null) {
        var i = l.next;
        a = i;
        do {
          if ((a.tag & e) === e) {
            l = void 0;
            var s = a.create, c = a.inst;
            l = s(), c.destroy = l;
          }
          a = a.next;
        } while (a !== i);
      }
    } catch (o) {
      qe(t, t.return, o);
    }
  }
  function Ma(e, t, a) {
    try {
      var l = t.updateQueue, i = l !== null ? l.lastEffect : null;
      if (i !== null) {
        var s = i.next;
        l = s;
        do {
          if ((l.tag & e) === e) {
            var c = l.inst, o = c.destroy;
            if (o !== void 0) {
              c.destroy = void 0, i = t;
              var f = a, _ = o;
              try {
                _();
              } catch (D) {
                qe(i, f, D);
              }
            }
          }
          l = l.next;
        } while (l !== s);
      }
    } catch (D) {
      qe(t, t.return, D);
    }
  }
  function Cu(e) {
    var t = e.updateQueue;
    if (t !== null) {
      var a = e.stateNode;
      try {
        Nd(t, a);
      } catch (l) {
        qe(e, e.return, l);
      }
    }
  }
  function Ou(e, t, a) {
    a.props = fl(e.type, e.memoizedProps), a.state = e.memoizedState;
    try {
      a.componentWillUnmount();
    } catch (l) {
      qe(e, t, l);
    }
  }
  function qn(e, t) {
    try {
      var a = e.ref;
      if (a !== null) {
        switch (e.tag) {
          case 26:
          case 27:
          case 5:
            var l = e.stateNode;
            break;
          case 30:
            l = e.stateNode;
            break;
          default:
            l = e.stateNode;
        }
        typeof a == "function" ? e.refCleanup = a(l) : a.current = l;
      }
    } catch (i) {
      qe(e, t, i);
    }
  }
  function ta(e, t) {
    var a = e.ref, l = e.refCleanup;
    if (a !== null) if (typeof l == "function") try {
      l();
    } catch (i) {
      qe(e, t, i);
    } finally {
      e.refCleanup = null, e = e.alternate, e != null && (e.refCleanup = null);
    }
    else if (typeof a == "function") try {
      a(null);
    } catch (i) {
      qe(e, t, i);
    }
    else a.current = null;
  }
  function Mu(e) {
    var t = e.type, a = e.memoizedProps, l = e.stateNode;
    try {
      e: switch (t) {
        case "button":
        case "input":
        case "select":
        case "textarea":
          a.autoFocus && l.focus();
          break e;
        case "img":
          a.src ? l.src = a.src : a.srcSet && (l.srcset = a.srcSet);
      }
    } catch (i) {
      qe(e, e.return, i);
    }
  }
  function Wc(e, t, a) {
    try {
      var l = e.stateNode;
      eh(l, e.type, a, t), l[yt] = t;
    } catch (i) {
      qe(e, e.return, i);
    }
  }
  function Du(e) {
    return e.tag === 5 || e.tag === 3 || e.tag === 26 || e.tag === 27 && Ba(e.type) || e.tag === 4;
  }
  function Fc(e) {
    e: for (; ; ) {
      for (; e.sibling === null; ) {
        if (e.return === null || Du(e.return)) return null;
        e = e.return;
      }
      for (e.sibling.return = e.return, e = e.sibling; e.tag !== 5 && e.tag !== 6 && e.tag !== 18; ) {
        if (e.tag === 27 && Ba(e.type) || e.flags & 2 || e.child === null || e.tag === 4) continue e;
        e.child.return = e, e = e.child;
      }
      if (!(e.flags & 2)) return e.stateNode;
    }
  }
  function Pc(e, t, a) {
    var l = e.tag;
    if (l === 5 || l === 6) e = e.stateNode, t ? (a.nodeType === 9 ? a.body : a.nodeName === "HTML" ? a.ownerDocument.body : a).insertBefore(e, t) : (t = a.nodeType === 9 ? a.body : a.nodeName === "HTML" ? a.ownerDocument.body : a, t.appendChild(e), a = a._reactRootContainer, a != null || t.onclick !== null || (t.onclick = ia));
    else if (l !== 4 && (l === 27 && Ba(e.type) && (a = e.stateNode, t = null), e = e.child, e !== null)) for (Pc(e, t, a), e = e.sibling; e !== null; ) Pc(e, t, a), e = e.sibling;
  }
  function Ki(e, t, a) {
    var l = e.tag;
    if (l === 5 || l === 6) e = e.stateNode, t ? a.insertBefore(e, t) : a.appendChild(e);
    else if (l !== 4 && (l === 27 && Ba(e.type) && (a = e.stateNode), e = e.child, e !== null)) for (Ki(e, t, a), e = e.sibling; e !== null; ) Ki(e, t, a), e = e.sibling;
  }
  function Uu(e) {
    var t = e.stateNode, a = e.memoizedProps;
    try {
      for (var l = e.type, i = t.attributes; i.length; ) t.removeAttributeNode(i[0]);
      mt(t, l, a), t[ut] = e, t[yt] = a;
    } catch (s) {
      qe(e, e.return, s);
    }
  }
  var ma = !1, st = !1, er = !1, Ru = typeof WeakSet == "function" ? WeakSet : Set, dt = null;
  function U0(e, t) {
    if (e = e.containerInfo, jr = hs, e = Wo(e), Ks(e)) {
      if ("selectionStart" in e) var a = {
        start: e.selectionStart,
        end: e.selectionEnd
      };
      else e: {
        a = (a = e.ownerDocument) && a.defaultView || window;
        var l = a.getSelection && a.getSelection();
        if (l && l.rangeCount !== 0) {
          a = l.anchorNode;
          var i = l.anchorOffset, s = l.focusNode;
          l = l.focusOffset;
          try {
            a.nodeType, s.nodeType;
          } catch {
            a = null;
            break e;
          }
          var c = 0, o = -1, f = -1, _ = 0, D = 0, B = e, w = null;
          t: for (; ; ) {
            for (var O; B !== a || i !== 0 && B.nodeType !== 3 || (o = c + i), B !== s || l !== 0 && B.nodeType !== 3 || (f = c + l), B.nodeType === 3 && (c += B.nodeValue.length), (O = B.firstChild) !== null; )
              w = B, B = O;
            for (; ; ) {
              if (B === e) break t;
              if (w === a && ++_ === i && (o = c), w === s && ++D === l && (f = c), (O = B.nextSibling) !== null) break;
              B = w, w = B.parentNode;
            }
            B = O;
          }
          a = o === -1 || f === -1 ? null : {
            start: o,
            end: f
          };
        } else a = null;
      }
      a = a || {
        start: 0,
        end: 0
      };
    } else a = null;
    for (yr = {
      focusedElem: e,
      selectionRange: a
    }, hs = !1, dt = t; dt !== null; ) if (t = dt, e = t.child, (t.subtreeFlags & 1028) !== 0 && e !== null) e.return = t, dt = e;
    else for (; dt !== null; ) {
      switch (t = dt, s = t.alternate, e = t.flags, t.tag) {
        case 0:
          if ((e & 4) !== 0 && (e = t.updateQueue, e = e !== null ? e.events : null, e !== null)) for (a = 0; a < e.length; a++) i = e[a], i.ref.impl = i.nextImpl;
          break;
        case 11:
        case 15:
          break;
        case 1:
          if ((e & 1024) !== 0 && s !== null) {
            e = void 0, a = t, i = s.memoizedProps, s = s.memoizedState, l = a.stateNode;
            try {
              var ne = fl(a.type, i);
              e = l.getSnapshotBeforeUpdate(ne, s), l.__reactInternalSnapshotBeforeUpdate = e;
            } catch (ge) {
              qe(a, a.return, ge);
            }
          }
          break;
        case 3:
          if ((e & 1024) !== 0) {
            if (e = t.stateNode.containerInfo, a = e.nodeType, a === 9) Nr(e);
            else if (a === 1) switch (e.nodeName) {
              case "HEAD":
              case "HTML":
              case "BODY":
                Nr(e);
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
        e.return = t.return, dt = e;
        break;
      }
      dt = t.return;
    }
  }
  function qu(e, t, a) {
    var l = a.flags;
    switch (a.tag) {
      case 0:
      case 11:
      case 15:
        ga(e, a), l & 4 && Rn(5, a);
        break;
      case 1:
        if (ga(e, a), l & 4) if (e = a.stateNode, t === null) try {
          e.componentDidMount();
        } catch (c) {
          qe(a, a.return, c);
        }
        else {
          var i = fl(a.type, t.memoizedProps);
          t = t.memoizedState;
          try {
            e.componentDidUpdate(i, t, e.__reactInternalSnapshotBeforeUpdate);
          } catch (c) {
            qe(a, a.return, c);
          }
        }
        l & 64 && Cu(a), l & 512 && qn(a, a.return);
        break;
      case 3:
        if (ga(e, a), l & 64 && (e = a.updateQueue, e !== null)) {
          if (t = null, a.child !== null) switch (a.child.tag) {
            case 27:
            case 5:
              t = a.child.stateNode;
              break;
            case 1:
              t = a.child.stateNode;
          }
          try {
            Nd(e, t);
          } catch (c) {
            qe(a, a.return, c);
          }
        }
        break;
      case 27:
        t === null && l & 4 && Uu(a);
      case 26:
      case 5:
        ga(e, a), t === null && l & 4 && Mu(a), l & 512 && qn(a, a.return);
        break;
      case 12:
        ga(e, a);
        break;
      case 31:
        ga(e, a), l & 4 && Bu(e, a);
        break;
      case 13:
        ga(e, a), l & 4 && Gu(e, a), l & 64 && (e = a.memoizedState, e !== null && (e = e.dehydrated, e !== null && (a = X0.bind(null, a), rh(e, a))));
        break;
      case 22:
        if (l = a.memoizedState !== null || ma, !l) {
          t = t !== null && t.memoizedState !== null || st, i = ma;
          var s = st;
          ma = l, (st = t) && !s ? va(e, a, (a.subtreeFlags & 8772) !== 0) : ga(e, a), ma = i, st = s;
        }
        break;
      case 30:
        break;
      default:
        ga(e, a);
    }
  }
  function Hu(e) {
    var t = e.alternate;
    t !== null && (e.alternate = null, Hu(t)), e.child = null, e.deletions = null, e.sibling = null, e.tag === 5 && (t = e.stateNode, t !== null && ks(t)), e.stateNode = null, e.return = null, e.dependencies = null, e.memoizedProps = null, e.memoizedState = null, e.pendingProps = null, e.stateNode = null, e.updateQueue = null;
  }
  var Ke = null, zt = !1;
  function xa(e, t, a) {
    for (a = a.child; a !== null; ) Lu(e, t, a), a = a.sibling;
  }
  function Lu(e, t, a) {
    if (Ye && typeof Ye.onCommitFiberUnmount == "function") try {
      Ye.onCommitFiberUnmount(Fe, a);
    } catch {
    }
    switch (a.tag) {
      case 26:
        st || ta(a, t), xa(e, t, a), a.memoizedState ? a.memoizedState.count-- : a.stateNode && (a = a.stateNode, a.parentNode.removeChild(a));
        break;
      case 27:
        st || ta(a, t);
        var l = Ke, i = zt;
        Ba(a.type) && (Ke = a.stateNode, zt = !1), xa(e, t, a), Zn(a.stateNode), Ke = l, zt = i;
        break;
      case 5:
        st || ta(a, t);
      case 6:
        if (l = Ke, i = zt, Ke = null, xa(e, t, a), Ke = l, zt = i, Ke !== null) if (zt) try {
          (Ke.nodeType === 9 ? Ke.body : Ke.nodeName === "HTML" ? Ke.ownerDocument.body : Ke).removeChild(a.stateNode);
        } catch (s) {
          qe(a, t, s);
        }
        else try {
          Ke.removeChild(a.stateNode);
        } catch (s) {
          qe(a, t, s);
        }
        break;
      case 18:
        Ke !== null && (zt ? (e = Ke, Mf(e.nodeType === 9 ? e.body : e.nodeName === "HTML" ? e.ownerDocument.body : e, a.stateNode), en(e)) : Mf(Ke, a.stateNode));
        break;
      case 4:
        l = Ke, i = zt, Ke = a.stateNode.containerInfo, zt = !0, xa(e, t, a), Ke = l, zt = i;
        break;
      case 0:
      case 11:
      case 14:
      case 15:
        Ma(2, a, t), st || Ma(4, a, t), xa(e, t, a);
        break;
      case 1:
        st || (ta(a, t), l = a.stateNode, typeof l.componentWillUnmount == "function" && Ou(a, t, l)), xa(e, t, a);
        break;
      case 21:
        xa(e, t, a);
        break;
      case 22:
        st = (l = st) || a.memoizedState !== null, xa(e, t, a), st = l;
        break;
      default:
        xa(e, t, a);
    }
  }
  function Bu(e, t) {
    if (t.memoizedState === null && (e = t.alternate, e !== null && (e = e.memoizedState, e !== null))) {
      e = e.dehydrated;
      try {
        en(e);
      } catch (a) {
        qe(t, t.return, a);
      }
    }
  }
  function Gu(e, t) {
    if (t.memoizedState === null && (e = t.alternate, e !== null && (e = e.memoizedState, e !== null && (e = e.dehydrated, e !== null)))) try {
      en(e);
    } catch (a) {
      qe(t, t.return, a);
    }
  }
  function R0(e) {
    switch (e.tag) {
      case 31:
      case 13:
      case 19:
        var t = e.stateNode;
        return t === null && (t = e.stateNode = new Ru()), t;
      case 22:
        return e = e.stateNode, t = e._retryCache, t === null && (t = e._retryCache = new Ru()), t;
      default:
        throw Error(d(435, e.tag));
    }
  }
  function Ji(e, t) {
    var a = R0(e);
    t.forEach(function(l) {
      if (!a.has(l)) {
        a.add(l);
        var i = Q0.bind(null, e, l);
        l.then(i, i);
      }
    });
  }
  function Nt(e, t) {
    var a = t.deletions;
    if (a !== null) for (var l = 0; l < a.length; l++) {
      var i = a[l], s = e, c = t, o = c;
      e: for (; o !== null; ) {
        switch (o.tag) {
          case 27:
            if (Ba(o.type)) {
              Ke = o.stateNode, zt = !1;
              break e;
            }
            break;
          case 5:
            Ke = o.stateNode, zt = !1;
            break e;
          case 3:
          case 4:
            Ke = o.stateNode.containerInfo, zt = !0;
            break e;
        }
        o = o.return;
      }
      if (Ke === null) throw Error(d(160));
      Lu(s, c, i), Ke = null, zt = !1, s = i.alternate, s !== null && (s.return = null), i.return = null;
    }
    if (t.subtreeFlags & 13886) for (t = t.child; t !== null; ) Yu(t, e), t = t.sibling;
  }
  var $t = null;
  function Yu(e, t) {
    var a = e.alternate, l = e.flags;
    switch (e.tag) {
      case 0:
      case 11:
      case 14:
      case 15:
        Nt(t, e), _t(e), l & 4 && (Ma(3, e, e.return), Rn(3, e), Ma(5, e, e.return));
        break;
      case 1:
        Nt(t, e), _t(e), l & 512 && (st || a === null || ta(a, a.return)), l & 64 && ma && (e = e.updateQueue, e !== null && (l = e.callbacks, l !== null && (a = e.shared.hiddenCallbacks, e.shared.hiddenCallbacks = a === null ? l : a.concat(l))));
        break;
      case 26:
        var i = $t;
        if (Nt(t, e), _t(e), l & 512 && (st || a === null || ta(a, a.return)), l & 4) {
          var s = a !== null ? a.memoizedState : null;
          if (l = e.memoizedState, a === null) if (l === null) if (e.stateNode === null) {
            e: {
              l = e.type, a = e.memoizedProps, i = i.ownerDocument || i;
              t: switch (l) {
                case "title":
                  s = i.getElementsByTagName("title")[0], (!s || s[dn] || s[ut] || s.namespaceURI === "http://www.w3.org/2000/svg" || s.hasAttribute("itemprop")) && (s = i.createElement(l), i.head.insertBefore(s, i.querySelector("head > title"))), mt(s, l, a), s[ut] = e, ot(s), l = s;
                  break e;
                case "link":
                  var c = Xf("link", "href", i).get(l + (a.href || ""));
                  if (c) {
                    for (var o = 0; o < c.length; o++) if (s = c[o], s.getAttribute("href") === (a.href == null || a.href === "" ? null : a.href) && s.getAttribute("rel") === (a.rel == null ? null : a.rel) && s.getAttribute("title") === (a.title == null ? null : a.title) && s.getAttribute("crossorigin") === (a.crossOrigin == null ? null : a.crossOrigin)) {
                      c.splice(o, 1);
                      break t;
                    }
                  }
                  s = i.createElement(l), mt(s, l, a), i.head.appendChild(s);
                  break;
                case "meta":
                  if (c = Xf("meta", "content", i).get(l + (a.content || ""))) {
                    for (o = 0; o < c.length; o++) if (s = c[o], s.getAttribute("content") === (a.content == null ? null : "" + a.content) && s.getAttribute("name") === (a.name == null ? null : a.name) && s.getAttribute("property") === (a.property == null ? null : a.property) && s.getAttribute("http-equiv") === (a.httpEquiv == null ? null : a.httpEquiv) && s.getAttribute("charset") === (a.charSet == null ? null : a.charSet)) {
                      c.splice(o, 1);
                      break t;
                    }
                  }
                  s = i.createElement(l), mt(s, l, a), i.head.appendChild(s);
                  break;
                default:
                  throw Error(d(468, l));
              }
              s[ut] = e, ot(s), l = s;
            }
            e.stateNode = l;
          } else Qf(i, e.type, e.stateNode);
          else e.stateNode = Vf(i, l, e.memoizedProps);
          else s !== l ? (s === null ? a.stateNode !== null && (a = a.stateNode, a.parentNode.removeChild(a)) : s.count--, l === null ? Qf(i, e.type, e.stateNode) : Vf(i, l, e.memoizedProps)) : l === null && e.stateNode !== null && Wc(e, e.memoizedProps, a.memoizedProps);
        }
        break;
      case 27:
        Nt(t, e), _t(e), l & 512 && (st || a === null || ta(a, a.return)), a !== null && l & 4 && Wc(e, e.memoizedProps, a.memoizedProps);
        break;
      case 5:
        if (Nt(t, e), _t(e), l & 512 && (st || a === null || ta(a, a.return)), e.flags & 32) {
          i = e.stateNode;
          try {
            zl(i, "");
          } catch (ne) {
            qe(e, e.return, ne);
          }
        }
        l & 4 && e.stateNode != null && (i = e.memoizedProps, Wc(e, i, a !== null ? a.memoizedProps : i)), l & 1024 && (er = !0);
        break;
      case 6:
        if (Nt(t, e), _t(e), l & 4) {
          if (e.stateNode === null) throw Error(d(162));
          l = e.memoizedProps, a = e.stateNode;
          try {
            a.nodeValue = l;
          } catch (ne) {
            qe(e, e.return, ne);
          }
        }
        break;
      case 3:
        if (ds = null, i = $t, $t = rs(t.containerInfo), Nt(t, e), $t = i, _t(e), l & 4 && a !== null && a.memoizedState.isDehydrated) try {
          en(t.containerInfo);
        } catch (ne) {
          qe(e, e.return, ne);
        }
        er && (er = !1, Vu(e));
        break;
      case 4:
        l = $t, $t = rs(e.stateNode.containerInfo), Nt(t, e), _t(e), $t = l;
        break;
      case 12:
        Nt(t, e), _t(e);
        break;
      case 31:
        Nt(t, e), _t(e), l & 4 && (l = e.updateQueue, l !== null && (e.updateQueue = null, Ji(e, l)));
        break;
      case 13:
        Nt(t, e), _t(e), e.child.flags & 8192 && e.memoizedState !== null != (a !== null && a.memoizedState !== null) && ($i = We()), l & 4 && (l = e.updateQueue, l !== null && (e.updateQueue = null, Ji(e, l)));
        break;
      case 22:
        i = e.memoizedState !== null;
        var f = a !== null && a.memoizedState !== null, _ = ma, D = st;
        if (ma = _ || i, st = D || f, Nt(t, e), st = D, ma = _, _t(e), l & 8192) e: for (t = e.stateNode, t._visibility = i ? t._visibility & -2 : t._visibility | 1, i && (a === null || f || ma || st || pl(e)), a = null, t = e; ; ) {
          if (t.tag === 5 || t.tag === 26) {
            if (a === null) {
              f = a = t;
              try {
                if (s = f.stateNode, i) c = s.style, typeof c.setProperty == "function" ? c.setProperty("display", "none", "important") : c.display = "none";
                else {
                  o = f.stateNode;
                  var B = f.memoizedProps.style, w = B != null && B.hasOwnProperty("display") ? B.display : null;
                  o.style.display = w == null || typeof w == "boolean" ? "" : ("" + w).trim();
                }
              } catch (ne) {
                qe(f, f.return, ne);
              }
            }
          } else if (t.tag === 6) {
            if (a === null) {
              f = t;
              try {
                f.stateNode.nodeValue = i ? "" : f.memoizedProps;
              } catch (ne) {
                qe(f, f.return, ne);
              }
            }
          } else if (t.tag === 18) {
            if (a === null) {
              f = t;
              try {
                var O = f.stateNode;
                i ? Df(O, !0) : Df(f.stateNode, !1);
              } catch (ne) {
                qe(f, f.return, ne);
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
        l & 4 && (l = e.updateQueue, l !== null && (a = l.retryQueue, a !== null && (l.retryQueue = null, Ji(e, a))));
        break;
      case 19:
        Nt(t, e), _t(e), l & 4 && (l = e.updateQueue, l !== null && (e.updateQueue = null, Ji(e, l)));
        break;
      case 30:
        break;
      case 21:
        break;
      default:
        Nt(t, e), _t(e);
    }
  }
  function _t(e) {
    var t = e.flags;
    if (t & 2) {
      try {
        for (var a, l = e.return; l !== null; ) {
          if (Du(l)) {
            a = l;
            break;
          }
          l = l.return;
        }
        if (a == null) throw Error(d(160));
        switch (a.tag) {
          case 27:
            var i = a.stateNode;
            Ki(e, Fc(e), i);
            break;
          case 5:
            var s = a.stateNode;
            a.flags & 32 && (zl(s, ""), a.flags &= -33), Ki(e, Fc(e), s);
            break;
          case 3:
          case 4:
            var c = a.stateNode.containerInfo;
            Pc(e, Fc(e), c);
            break;
          default:
            throw Error(d(161));
        }
      } catch (o) {
        qe(e, e.return, o);
      }
      e.flags &= -3;
    }
    t & 4096 && (e.flags &= -4097);
  }
  function Vu(e) {
    if (e.subtreeFlags & 1024) for (e = e.child; e !== null; ) {
      var t = e;
      Vu(t), t.tag === 5 && t.flags & 1024 && t.stateNode.reset(), e = e.sibling;
    }
  }
  function ga(e, t) {
    if (t.subtreeFlags & 8772) for (t = t.child; t !== null; ) qu(e, t.alternate, t), t = t.sibling;
  }
  function pl(e) {
    for (e = e.child; e !== null; ) {
      var t = e;
      switch (t.tag) {
        case 0:
        case 11:
        case 14:
        case 15:
          Ma(4, t, t.return), pl(t);
          break;
        case 1:
          ta(t, t.return);
          var a = t.stateNode;
          typeof a.componentWillUnmount == "function" && Ou(t, t.return, a), pl(t);
          break;
        case 27:
          Zn(t.stateNode);
        case 26:
        case 5:
          ta(t, t.return), pl(t);
          break;
        case 22:
          t.memoizedState === null && pl(t);
          break;
        case 30:
          pl(t);
          break;
        default:
          pl(t);
      }
      e = e.sibling;
    }
  }
  function va(e, t, a) {
    for (a = a && (t.subtreeFlags & 8772) !== 0, t = t.child; t !== null; ) {
      var l = t.alternate, i = e, s = t, c = s.flags;
      switch (s.tag) {
        case 0:
        case 11:
        case 15:
          va(i, s, a), Rn(4, s);
          break;
        case 1:
          if (va(i, s, a), l = s, i = l.stateNode, typeof i.componentDidMount == "function") try {
            i.componentDidMount();
          } catch (_) {
            qe(l, l.return, _);
          }
          if (l = s, i = l.updateQueue, i !== null) {
            var o = l.stateNode;
            try {
              var f = i.shared.hiddenCallbacks;
              if (f !== null) for (i.shared.hiddenCallbacks = null, i = 0; i < f.length; i++) zd(f[i], o);
            } catch (_) {
              qe(l, l.return, _);
            }
          }
          a && c & 64 && Cu(s), qn(s, s.return);
          break;
        case 27:
          Uu(s);
        case 26:
        case 5:
          va(i, s, a), a && l === null && c & 4 && Mu(s), qn(s, s.return);
          break;
        case 12:
          va(i, s, a);
          break;
        case 31:
          va(i, s, a), a && c & 4 && Bu(i, s);
          break;
        case 13:
          va(i, s, a), a && c & 4 && Gu(i, s);
          break;
        case 22:
          s.memoizedState === null && va(i, s, a), qn(s, s.return);
          break;
        case 30:
          break;
        default:
          va(i, s, a);
      }
      t = t.sibling;
    }
  }
  function tr(e, t) {
    var a = null;
    e !== null && e.memoizedState !== null && e.memoizedState.cachePool !== null && (a = e.memoizedState.cachePool.pool), e = null, t.memoizedState !== null && t.memoizedState.cachePool !== null && (e = t.memoizedState.cachePool.pool), e !== a && (e != null && e.refCount++, a != null && zn(a));
  }
  function ar(e, t) {
    e = null, t.alternate !== null && (e = t.alternate.memoizedState.cache), t = t.memoizedState.cache, t !== e && (t.refCount++, e != null && zn(e));
  }
  function Wt(e, t, a, l) {
    if (t.subtreeFlags & 10256) for (t = t.child; t !== null; ) Xu(e, t, a, l), t = t.sibling;
  }
  function Xu(e, t, a, l) {
    var i = t.flags;
    switch (t.tag) {
      case 0:
      case 11:
      case 15:
        Wt(e, t, a, l), i & 2048 && Rn(9, t);
        break;
      case 1:
        Wt(e, t, a, l);
        break;
      case 3:
        Wt(e, t, a, l), i & 2048 && (e = null, t.alternate !== null && (e = t.alternate.memoizedState.cache), t = t.memoizedState.cache, t !== e && (t.refCount++, e != null && zn(e)));
        break;
      case 12:
        if (i & 2048) {
          Wt(e, t, a, l), e = t.stateNode;
          try {
            var s = t.memoizedProps, c = s.id, o = s.onPostCommit;
            typeof o == "function" && o(c, t.alternate === null ? "mount" : "update", e.passiveEffectDuration, -0);
          } catch (f) {
            qe(t, t.return, f);
          }
        } else Wt(e, t, a, l);
        break;
      case 31:
        Wt(e, t, a, l);
        break;
      case 13:
        Wt(e, t, a, l);
        break;
      case 23:
        break;
      case 22:
        s = t.stateNode, c = t.alternate, t.memoizedState !== null ? s._visibility & 2 ? Wt(e, t, a, l) : Hn(e, t) : s._visibility & 2 ? Wt(e, t, a, l) : (s._visibility |= 2, Vl(e, t, a, l, (t.subtreeFlags & 10256) !== 0 || !1)), i & 2048 && tr(c, t);
        break;
      case 24:
        Wt(e, t, a, l), i & 2048 && ar(t.alternate, t);
        break;
      default:
        Wt(e, t, a, l);
    }
  }
  function Vl(e, t, a, l, i) {
    for (i = i && ((t.subtreeFlags & 10256) !== 0 || !1), t = t.child; t !== null; ) {
      var s = e, c = t, o = a, f = l, _ = c.flags;
      switch (c.tag) {
        case 0:
        case 11:
        case 15:
          Vl(s, c, o, f, i), Rn(8, c);
          break;
        case 23:
          break;
        case 22:
          var D = c.stateNode;
          c.memoizedState !== null ? D._visibility & 2 ? Vl(s, c, o, f, i) : Hn(s, c) : (D._visibility |= 2, Vl(s, c, o, f, i)), i && _ & 2048 && tr(c.alternate, c);
          break;
        case 24:
          Vl(s, c, o, f, i), i && _ & 2048 && ar(c.alternate, c);
          break;
        default:
          Vl(s, c, o, f, i);
      }
      t = t.sibling;
    }
  }
  function Hn(e, t) {
    if (t.subtreeFlags & 10256) for (t = t.child; t !== null; ) {
      var a = e, l = t, i = l.flags;
      switch (l.tag) {
        case 22:
          Hn(a, l), i & 2048 && tr(l.alternate, l);
          break;
        case 24:
          Hn(a, l), i & 2048 && ar(l.alternate, l);
          break;
        default:
          Hn(a, l);
      }
      t = t.sibling;
    }
  }
  var Ln = 8192;
  function Xl(e, t, a) {
    if (e.subtreeFlags & Ln) for (e = e.child; e !== null; ) Qu(e, t, a), e = e.sibling;
  }
  function Qu(e, t, a) {
    switch (e.tag) {
      case 26:
        Xl(e, t, a), e.flags & Ln && e.memoizedState !== null && jh(a, $t, e.memoizedState, e.memoizedProps);
        break;
      case 5:
        Xl(e, t, a);
        break;
      case 3:
      case 4:
        var l = $t;
        $t = rs(e.stateNode.containerInfo), Xl(e, t, a), $t = l;
        break;
      case 22:
        e.memoizedState === null && (l = e.alternate, l !== null && l.memoizedState !== null ? (l = Ln, Ln = 16777216, Xl(e, t, a), Ln = l) : Xl(e, t, a));
        break;
      default:
        Xl(e, t, a);
    }
  }
  function Zu(e) {
    var t = e.alternate;
    if (t !== null && (e = t.child, e !== null)) {
      t.child = null;
      do
        t = e.sibling, e.sibling = null, e = t;
      while (e !== null);
    }
  }
  function Bn(e) {
    var t = e.deletions;
    if ((e.flags & 16) !== 0) {
      if (t !== null) for (var a = 0; a < t.length; a++) {
        var l = t[a];
        dt = l, Ju(l, e);
      }
      Zu(e);
    }
    if (e.subtreeFlags & 10256) for (e = e.child; e !== null; ) Ku(e), e = e.sibling;
  }
  function Ku(e) {
    switch (e.tag) {
      case 0:
      case 11:
      case 15:
        Bn(e), e.flags & 2048 && Ma(9, e, e.return);
        break;
      case 3:
        Bn(e);
        break;
      case 12:
        Bn(e);
        break;
      case 22:
        var t = e.stateNode;
        e.memoizedState !== null && t._visibility & 2 && (e.return === null || e.return.tag !== 13) ? (t._visibility &= -3, Ii(e)) : Bn(e);
        break;
      default:
        Bn(e);
    }
  }
  function Ii(e) {
    var t = e.deletions;
    if ((e.flags & 16) !== 0) {
      if (t !== null) for (var a = 0; a < t.length; a++) {
        var l = t[a];
        dt = l, Ju(l, e);
      }
      Zu(e);
    }
    for (e = e.child; e !== null; ) {
      switch (t = e, t.tag) {
        case 0:
        case 11:
        case 15:
          Ma(8, t, t.return), Ii(t);
          break;
        case 22:
          a = t.stateNode, a._visibility & 2 && (a._visibility &= -3, Ii(t));
          break;
        default:
          Ii(t);
      }
      e = e.sibling;
    }
  }
  function Ju(e, t) {
    for (; dt !== null; ) {
      var a = dt;
      switch (a.tag) {
        case 0:
        case 11:
        case 15:
          Ma(8, a, t);
          break;
        case 23:
        case 22:
          if (a.memoizedState !== null && a.memoizedState.cachePool !== null) {
            var l = a.memoizedState.cachePool.pool;
            l != null && l.refCount++;
          }
          break;
        case 24:
          zn(a.memoizedState.cache);
      }
      if (l = a.child, l !== null) l.return = a, dt = l;
      else e: for (a = e; dt !== null; ) {
        l = dt;
        var i = l.sibling, s = l.return;
        if (Hu(l), l === a) {
          dt = null;
          break e;
        }
        if (i !== null) {
          i.return = s, dt = i;
          break e;
        }
        dt = s;
      }
    }
  }
  var q0 = {
    getCacheForType: function(e) {
      var t = pt(lt), a = t.data.get(e);
      return a === void 0 && (a = e(), t.data.set(e, a)), a;
    },
    cacheSignal: function() {
      return pt(lt).controller.signal;
    }
  }, H0 = typeof WeakMap == "function" ? WeakMap : Map, De = 0, Ve = null, Ne = null, Ee = 0, Re = 0, Ot = null, Da = !1, Ql = !1, lr = !1, ba = 0, $e = 0, Ua = 0, hl = 0, nr = 0, Mt = 0, Zl = 0, Gn = null, wt = null, ir = !1, $i = 0, Iu = 0, Wi = 1 / 0, Fi = null, Ra = null, rt = 0, qa = null, Kl = null, ja = 0, sr = 0, cr = null, $u = null, Yn = 0, rr = null;
  function Xt() {
    return (De & 2) !== 0 && Ee !== 0 ? Ee & -Ee : R.T !== null ? hr() : mo();
  }
  function Wu() {
    if (Mt === 0) if ((Ee & 536870912) === 0 || ke) {
      var e = ii;
      ii <<= 1, (ii & 3932160) === 0 && (ii = 262144), Mt = e;
    } else Mt = 536870912;
    return e = kt.current, e !== null && (e.flags |= 32), Mt;
  }
  function Et(e, t, a) {
    (e === Ve && (Re === 2 || Re === 9) || e.cancelPendingCommit !== null) && (Jl(e, 0), Ha(e, Ee, Mt, !1)), ri(e, a), ((De & 2) === 0 || e !== Ve) && (e === Ve && ((De & 2) === 0 && (hl |= a), $e === 4 && Ha(e, Ee, Mt, !1)), ya(e));
  }
  function Fu(e, t, a) {
    if ((De & 6) !== 0) throw Error(d(327));
    var l = !a && (t & 127) === 0 && (t & e.expiredLanes) === 0 || rn(e, t), i = l ? G0(e, t) : dr(e, t, !0), s = l;
    do {
      if (i === 0) {
        Ql && !l && Ha(e, t, 0, !1);
        break;
      } else {
        if (a = e.current.alternate, s && !L0(a)) {
          i = dr(e, t, !1), s = !1;
          continue;
        }
        if (i === 2) {
          if (s = t, e.errorRecoveryDisabledLanes & s) var c = 0;
          else c = e.pendingLanes & -536870913, c = c !== 0 ? c : c & 536870912 ? 536870912 : 0;
          if (c !== 0) {
            t = c;
            e: {
              var o = e;
              i = Gn;
              var f = o.current.memoizedState.isDehydrated;
              if (f && (Jl(o, c).flags |= 256), c = dr(o, c, !1), c !== 2) {
                if (lr && !f) {
                  o.errorRecoveryDisabledLanes |= s, hl |= s, i = 4;
                  break e;
                }
                s = wt, wt = i, s !== null && (wt === null ? wt = s : wt.push.apply(wt, s));
              }
              i = c;
            }
            if (s = !1, i !== 2) continue;
          }
        }
        if (i === 1) {
          Jl(e, 0), Ha(e, t, 0, !0);
          break;
        }
        e: {
          switch (l = e, s = i, s) {
            case 0:
            case 1:
              throw Error(d(345));
            case 4:
              if ((t & 4194048) !== t) break;
            case 6:
              Ha(l, t, Mt, !Da);
              break e;
            case 2:
              wt = null;
              break;
            case 3:
            case 5:
              break;
            default:
              throw Error(d(329));
          }
          if ((t & 62914560) === t && (i = $i + 300 - We(), 10 < i)) {
            if (Ha(l, t, Mt, !Da), ci(l, 0, !0) !== 0) break e;
            ja = t, l.timeoutHandle = Cf(Pu.bind(null, l, a, wt, Fi, ir, t, Mt, hl, Zl, Da, s, "Throttled", -0, 0), i);
            break e;
          }
          Pu(l, a, wt, Fi, ir, t, Mt, hl, Zl, Da, s, null, -0, 0);
        }
      }
      break;
    } while (!0);
    ya(e);
  }
  function Pu(e, t, a, l, i, s, c, o, f, _, D, B, w, O) {
    if (e.timeoutHandle = -1, B = t.subtreeFlags, B & 8192 || (B & 16785408) === 16785408) {
      B = {
        stylesheets: null,
        count: 0,
        imgCount: 0,
        imgBytes: 0,
        suspenseyImages: [],
        waitingForImages: !0,
        waitingForViewTransition: !1,
        unsuspend: ia
      }, Qu(t, s, B);
      var ne = (s & 62914560) === s ? $i - We() : (s & 4194048) === s ? Iu - We() : 0;
      if (ne = yh(B, ne), ne !== null) {
        ja = s, e.cancelPendingCommit = ne(rf.bind(null, e, t, s, a, l, i, c, o, f, D, B, null, w, O)), Ha(e, s, c, !_);
        return;
      }
    }
    rf(e, t, s, a, l, i, c, o, f);
  }
  function L0(e) {
    for (var t = e; ; ) {
      var a = t.tag;
      if ((a === 0 || a === 11 || a === 15) && t.flags & 16384 && (a = t.updateQueue, a !== null && (a = a.stores, a !== null))) for (var l = 0; l < a.length; l++) {
        var i = a[l], s = i.getSnapshot;
        i = i.value;
        try {
          if (!Tt(s(), i)) return !1;
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
  function Ha(e, t, a, l) {
    t &= ~nr, t &= ~hl, e.suspendedLanes |= t, e.pingedLanes &= ~t, l && (e.warmLanes |= t), l = e.expirationTimes;
    for (var i = t; 0 < i; ) {
      var s = 31 - ct(i), c = 1 << s;
      l[s] = -1, i &= ~c;
    }
    a !== 0 && uo(e, a, t);
  }
  function Pi() {
    return (De & 6) === 0 ? (Vn(0, !1), !1) : !0;
  }
  function or() {
    if (Ne !== null) {
      if (Re === 0) var e = Ne.return;
      else e = Ne, oa = ll = null, _c(e), Hl = null, _n = 0, e = Ne;
      for (; e !== null; ) ku(e.alternate, e), e = e.return;
      Ne = null;
    }
  }
  function Jl(e, t) {
    var a = e.timeoutHandle;
    a !== -1 && (e.timeoutHandle = -1, lh(a)), a = e.cancelPendingCommit, a !== null && (e.cancelPendingCommit = null, a()), ja = 0, or(), Ve = e, Ne = a = ca(e.current, null), Ee = t, Re = 0, Ot = null, Da = !1, Ql = rn(e, t), lr = !1, Zl = Mt = nr = hl = Ua = $e = 0, wt = Gn = null, ir = !1, (t & 8) !== 0 && (t |= t & 32);
    var l = e.entangledLanes;
    if (l !== 0) for (e = e.entanglements, l &= t; 0 < l; ) {
      var i = 31 - ct(l), s = 1 << i;
      t |= e[i], l &= ~s;
    }
    return ba = t, ji(), a;
  }
  function ef(e, t) {
    je = null, R.H = Mn, t === ql || t === Ti ? (t = bd(), Re = 3) : t === pc ? (t = bd(), Re = 4) : Re = t === Gc ? 8 : t !== null && typeof t == "object" && typeof t.then == "function" ? 6 : 1, Ot = t, Ne === null && ($e = 1, Yi(e, Lt(t, e.current)));
  }
  function tf() {
    var e = kt.current;
    return e === null ? !0 : (Ee & 4194048) === Ee ? Vt === null : (Ee & 62914560) === Ee || (Ee & 536870912) !== 0 ? e === Vt : !1;
  }
  function af() {
    var e = R.H;
    return R.H = Mn, e === null ? Mn : e;
  }
  function lf() {
    var e = R.A;
    return R.A = q0, e;
  }
  function es() {
    $e = 4, Da || (Ee & 4194048) !== Ee && kt.current !== null || (Ql = !0), (Ua & 134217727) === 0 && (hl & 134217727) === 0 || Ve === null || Ha(Ve, Ee, Mt, !1);
  }
  function dr(e, t, a) {
    var l = De;
    De |= 2;
    var i = af(), s = lf();
    (Ve !== e || Ee !== t) && (Fi = null, Jl(e, t)), t = !1;
    var c = $e;
    e: do
      try {
        if (Re !== 0 && Ne !== null) {
          var o = Ne, f = Ot;
          switch (Re) {
            case 8:
              or(), c = 6;
              break e;
            case 3:
            case 2:
            case 9:
            case 6:
              kt.current === null && (t = !0);
              var _ = Re;
              if (Re = 0, Ot = null, Il(e, o, f, _), a && Ql) {
                c = 0;
                break e;
              }
              break;
            default:
              _ = Re, Re = 0, Ot = null, Il(e, o, f, _);
          }
        }
        B0(), c = $e;
        break;
      } catch (D) {
        ef(e, D);
      }
    while (!0);
    return t && e.shellSuspendCounter++, oa = ll = null, De = l, R.H = i, R.A = s, Ne === null && (Ve = null, Ee = 0, ji()), c;
  }
  function B0() {
    for (; Ne !== null; ) nf(Ne);
  }
  function G0(e, t) {
    var a = De;
    De |= 2;
    var l = af(), i = lf();
    Ve !== e || Ee !== t ? (Fi = null, Wi = We() + 500, Jl(e, t)) : Ql = rn(e, t);
    e: do
      try {
        if (Re !== 0 && Ne !== null) {
          t = Ne;
          var s = Ot;
          t: switch (Re) {
            case 1:
              Re = 0, Ot = null, Il(e, t, s, 1);
              break;
            case 2:
            case 9:
              if (gd(s)) {
                Re = 0, Ot = null, sf(t);
                break;
              }
              t = function() {
                Re !== 2 && Re !== 9 || Ve !== e || (Re = 7), ya(e);
              }, s.then(t, t);
              break e;
            case 3:
              Re = 7;
              break e;
            case 4:
              Re = 5;
              break e;
            case 7:
              gd(s) ? (Re = 0, Ot = null, sf(t)) : (Re = 0, Ot = null, Il(e, t, s, 7));
              break;
            case 5:
              var c = null;
              switch (Ne.tag) {
                case 26:
                  c = Ne.memoizedState;
                case 5:
                case 27:
                  var o = Ne;
                  if (c ? Zf(c) : o.stateNode.complete) {
                    Re = 0, Ot = null;
                    var f = o.sibling;
                    if (f !== null) Ne = f;
                    else {
                      var _ = o.return;
                      _ !== null ? (Ne = _, ts(_)) : Ne = null;
                    }
                    break t;
                  }
              }
              Re = 0, Ot = null, Il(e, t, s, 5);
              break;
            case 6:
              Re = 0, Ot = null, Il(e, t, s, 6);
              break;
            case 8:
              or(), $e = 6;
              break e;
            default:
              throw Error(d(462));
          }
        }
        Y0();
        break;
      } catch (D) {
        ef(e, D);
      }
    while (!0);
    return oa = ll = null, R.H = l, R.A = i, De = a, Ne !== null ? 0 : (Ve = null, Ee = 0, ji(), $e);
  }
  function Y0() {
    for (; Ne !== null && !at(); ) nf(Ne);
  }
  function nf(e) {
    var t = Tu(e.alternate, e, ba);
    e.memoizedProps = e.pendingProps, t === null ? ts(e) : Ne = t;
  }
  function sf(e) {
    var t = e, a = t.alternate;
    switch (t.tag) {
      case 15:
      case 0:
        t = Su(a, t, t.pendingProps, t.type, void 0, Ee);
        break;
      case 11:
        t = Su(a, t, t.pendingProps, t.type.render, t.ref, Ee);
        break;
      case 5:
        _c(t);
      default:
        ku(a, t), t = Ne = sd(t, ba), t = Tu(a, t, ba);
    }
    e.memoizedProps = e.pendingProps, t === null ? ts(e) : Ne = t;
  }
  function Il(e, t, a, l) {
    oa = ll = null, _c(t), Hl = null, _n = 0;
    var i = t.return;
    try {
      if (k0(e, i, t, a, Ee)) {
        $e = 1, Yi(e, Lt(a, e.current)), Ne = null;
        return;
      }
    } catch (s) {
      if (i !== null) throw Ne = i, s;
      $e = 1, Yi(e, Lt(a, e.current)), Ne = null;
      return;
    }
    t.flags & 32768 ? (ke || l === 1 ? e = !0 : Ql || (Ee & 536870912) !== 0 ? e = !1 : (Da = e = !0, (l === 2 || l === 9 || l === 3 || l === 6) && (l = kt.current, l !== null && l.tag === 13 && (l.flags |= 16384))), cf(t, e)) : ts(t);
  }
  function ts(e) {
    var t = e;
    do {
      if ((t.flags & 32768) !== 0) {
        cf(t, Da);
        return;
      }
      e = t.return;
      var a = M0(t.alternate, t, ba);
      if (a !== null) {
        Ne = a;
        return;
      }
      if (t = t.sibling, t !== null) {
        Ne = t;
        return;
      }
      Ne = t = e;
    } while (t !== null);
    $e === 0 && ($e = 5);
  }
  function cf(e, t) {
    do {
      var a = D0(e.alternate, e);
      if (a !== null) {
        a.flags &= 32767, Ne = a;
        return;
      }
      if (a = e.return, a !== null && (a.flags |= 32768, a.subtreeFlags = 0, a.deletions = null), !t && (e = e.sibling, e !== null)) {
        Ne = e;
        return;
      }
      Ne = e = a;
    } while (e !== null);
    $e = 6, Ne = null;
  }
  function rf(e, t, a, l, i, s, c, o, f) {
    e.cancelPendingCommit = null;
    do
      as();
    while (rt !== 0);
    if ((De & 6) !== 0) throw Error(d(327));
    if (t !== null) {
      if (t === e.current) throw Error(d(177));
      if (s = t.lanes | t.childLanes, s |= Fs, Ap(e, a, s, c, o, f), e === Ve && (Ne = Ve = null, Ee = 0), Kl = t, qa = e, ja = a, sr = s, cr = i, $u = l, (t.subtreeFlags & 10256) !== 0 || (t.flags & 10256) !== 0 ? (e.callbackNode = null, e.callbackPriority = 0, Z0(Ft, function() {
        return pf(), null;
      })) : (e.callbackNode = null, e.callbackPriority = 0), l = (t.flags & 13878) !== 0, (t.subtreeFlags & 13878) !== 0 || l) {
        l = R.T, R.T = null, i = Y.p, Y.p = 2, c = De, De |= 4;
        try {
          U0(e, t, a);
        } finally {
          De = c, Y.p = i, R.T = l;
        }
      }
      rt = 1, of(), df(), uf();
    }
  }
  function of() {
    if (rt === 1) {
      rt = 0;
      var e = qa, t = Kl, a = (t.flags & 13878) !== 0;
      if ((t.subtreeFlags & 13878) !== 0 || a) {
        a = R.T, R.T = null;
        var l = Y.p;
        Y.p = 2;
        var i = De;
        De |= 4;
        try {
          Yu(t, e);
          var s = yr, c = Wo(e.containerInfo), o = s.focusedElem, f = s.selectionRange;
          if (c !== o && o && o.ownerDocument && $o(o.ownerDocument.documentElement, o)) {
            if (f !== null && Ks(o)) {
              var _ = f.start, D = f.end;
              if (D === void 0 && (D = _), "selectionStart" in o) o.selectionStart = _, o.selectionEnd = Math.min(D, o.value.length);
              else {
                var B = o.ownerDocument || document, w = B && B.defaultView || window;
                if (w.getSelection) {
                  var O = w.getSelection(), ne = o.textContent.length, ge = Math.min(f.start, ne), Be = f.end === void 0 ? ge : Math.min(f.end, ne);
                  !O.extend && ge > Be && (c = Be, Be = ge, ge = c);
                  var j = Io(o, ge), v = Io(o, Be);
                  if (j && v && (O.rangeCount !== 1 || O.anchorNode !== j.node || O.anchorOffset !== j.offset || O.focusNode !== v.node || O.focusOffset !== v.offset)) {
                    var N = B.createRange();
                    N.setStart(j.node, j.offset), O.removeAllRanges(), ge > Be ? (O.addRange(N), O.extend(v.node, v.offset)) : (N.setEnd(v.node, v.offset), O.addRange(N));
                  }
                }
              }
            }
            for (B = [], O = o; O = O.parentNode; ) O.nodeType === 1 && B.push({
              element: O,
              left: O.scrollLeft,
              top: O.scrollTop
            });
            for (typeof o.focus == "function" && o.focus(), o = 0; o < B.length; o++) {
              var q = B[o];
              q.element.scrollLeft = q.left, q.element.scrollTop = q.top;
            }
          }
          hs = !!jr, yr = jr = null;
        } finally {
          De = i, Y.p = l, R.T = a;
        }
      }
      e.current = t, rt = 2;
    }
  }
  function df() {
    if (rt === 2) {
      rt = 0;
      var e = qa, t = Kl, a = (t.flags & 8772) !== 0;
      if ((t.subtreeFlags & 8772) !== 0 || a) {
        a = R.T, R.T = null;
        var l = Y.p;
        Y.p = 2;
        var i = De;
        De |= 4;
        try {
          qu(e, t.alternate, t);
        } finally {
          De = i, Y.p = l, R.T = a;
        }
      }
      rt = 3;
    }
  }
  function uf() {
    if (rt === 4 || rt === 3) {
      rt = 0, Jt();
      var e = qa, t = Kl, a = ja, l = $u;
      (t.subtreeFlags & 10256) !== 0 || (t.flags & 10256) !== 0 ? rt = 5 : (rt = 0, Kl = qa = null, ff(e, e.pendingLanes));
      var i = e.pendingLanes;
      if (i === 0 && (Ra = null), Ts(a), t = t.stateNode, Ye && typeof Ye.onCommitFiberRoot == "function") try {
        Ye.onCommitFiberRoot(Fe, t, void 0, (t.current.flags & 128) === 128);
      } catch {
      }
      if (l !== null) {
        t = R.T, i = Y.p, Y.p = 2, R.T = null;
        try {
          for (var s = e.onRecoverableError, c = 0; c < l.length; c++) {
            var o = l[c];
            s(o.value, { componentStack: o.stack });
          }
        } finally {
          R.T = t, Y.p = i;
        }
      }
      (ja & 3) !== 0 && as(), ya(e), i = e.pendingLanes, (a & 261930) !== 0 && (i & 42) !== 0 ? e === rr ? Yn++ : (Yn = 0, rr = e) : Yn = 0, Vn(0, !1);
    }
  }
  function ff(e, t) {
    (e.pooledCacheLanes &= t) === 0 && (t = e.pooledCache, t != null && (e.pooledCache = null, zn(t)));
  }
  function as() {
    return of(), df(), uf(), pf();
  }
  function pf() {
    if (rt !== 5) return !1;
    var e = qa, t = sr;
    sr = 0;
    var a = Ts(ja), l = R.T, i = Y.p;
    try {
      Y.p = 32 > a ? 32 : a, R.T = null, a = cr, cr = null;
      var s = qa, c = ja;
      if (rt = 0, Kl = qa = null, ja = 0, (De & 6) !== 0) throw Error(d(331));
      var o = De;
      if (De |= 4, Ku(s.current), Xu(s, s.current, c, a), De = o, Vn(0, !1), Ye && typeof Ye.onPostCommitFiberRoot == "function") try {
        Ye.onPostCommitFiberRoot(Fe, s);
      } catch {
      }
      return !0;
    } finally {
      Y.p = i, R.T = l, ff(e, t);
    }
  }
  function hf(e, t, a) {
    t = Lt(a, t), t = Bc(e.stateNode, t, 2), e = dl(e, t, 2), e !== null && (ri(e, 2), ya(e));
  }
  function qe(e, t, a) {
    if (e.tag === 3) hf(e, e, a);
    else for (; t !== null; ) {
      if (t.tag === 3) {
        hf(t, e, a);
        break;
      } else if (t.tag === 1) {
        var l = t.stateNode;
        if (typeof t.type.getDerivedStateFromError == "function" || typeof l.componentDidCatch == "function" && (Ra === null || !Ra.has(l))) {
          e = Lt(a, e), a = hu(2), l = dl(t, a, 2), l !== null && (mu(a, l, t, e), ri(l, 2), ya(l));
          break;
        }
      }
      t = t.return;
    }
  }
  function ur(e, t, a) {
    var l = e.pingCache;
    if (l === null) {
      l = e.pingCache = new H0();
      var i = /* @__PURE__ */ new Set();
      l.set(t, i);
    } else i = l.get(t), i === void 0 && (i = /* @__PURE__ */ new Set(), l.set(t, i));
    i.has(a) || (lr = !0, i.add(a), e = V0.bind(null, e, t, a), t.then(e, e));
  }
  function V0(e, t, a) {
    var l = e.pingCache;
    l !== null && l.delete(t), e.pingedLanes |= e.suspendedLanes & a, e.warmLanes &= ~a, Ve === e && (Ee & a) === a && ($e === 4 || $e === 3 && (Ee & 62914560) === Ee && 300 > We() - $i ? (De & 2) === 0 && Jl(e, 0) : nr |= a, Zl === Ee && (Zl = 0)), ya(e);
  }
  function mf(e, t) {
    t === 0 && (t = oo()), e = el(e, t), e !== null && (ri(e, t), ya(e));
  }
  function X0(e) {
    var t = e.memoizedState, a = 0;
    t !== null && (a = t.retryLane), mf(e, a);
  }
  function Q0(e, t) {
    var a = 0;
    switch (e.tag) {
      case 31:
      case 13:
        var l = e.stateNode, i = e.memoizedState;
        i !== null && (a = i.retryLane);
        break;
      case 19:
        l = e.stateNode;
        break;
      case 22:
        l = e.stateNode._retryCache;
        break;
      default:
        throw Error(d(314));
    }
    l !== null && l.delete(t), mf(e, a);
  }
  function Z0(e, t) {
    return E(e, t);
  }
  var ls = null, $l = null, fr = !1, ns = !1, pr = !1, La = 0;
  function ya(e) {
    e !== $l && e.next === null && ($l === null ? ls = $l = e : $l = $l.next = e), ns = !0, fr || (fr = !0, J0());
  }
  function Vn(e, t) {
    if (!pr && ns) {
      pr = !0;
      do
        for (var a = !1, l = ls; l !== null; ) {
          if (!t) if (e !== 0) {
            var i = l.pendingLanes;
            if (i === 0) var s = 0;
            else {
              var c = l.suspendedLanes, o = l.pingedLanes;
              s = (1 << 31 - ct(42 | e) + 1) - 1, s &= i & ~(c & ~o), s = s & 201326741 ? s & 201326741 | 1 : s ? s | 2 : 0;
            }
            s !== 0 && (a = !0, bf(l, s));
          } else s = Ee, s = ci(l, l === Ve ? s : 0, l.cancelPendingCommit !== null || l.timeoutHandle !== -1), (s & 3) === 0 || rn(l, s) || (a = !0, bf(l, s));
          l = l.next;
        }
      while (a);
      pr = !1;
    }
  }
  function K0() {
    xf();
  }
  function xf() {
    ns = fr = !1;
    var e = 0;
    La !== 0 && ah() && (e = La);
    for (var t = We(), a = null, l = ls; l !== null; ) {
      var i = l.next, s = gf(l, t);
      s === 0 ? (l.next = null, a === null ? ls = i : a.next = i, i === null && ($l = a)) : (a = l, (e !== 0 || (s & 3) !== 0) && (ns = !0)), l = i;
    }
    rt !== 0 && rt !== 5 || Vn(e, !1), La !== 0 && (La = 0);
  }
  function gf(e, t) {
    for (var a = e.suspendedLanes, l = e.pingedLanes, i = e.expirationTimes, s = e.pendingLanes & -62914561; 0 < s; ) {
      var c = 31 - ct(s), o = 1 << c, f = i[c];
      f === -1 ? ((o & a) === 0 || (o & l) !== 0) && (i[c] = Tp(o, t)) : f <= t && (e.expiredLanes |= o), s &= ~o;
    }
    if (t = Ve, a = Ee, a = ci(e, e === t ? a : 0, e.cancelPendingCommit !== null || e.timeoutHandle !== -1), l = e.callbackNode, a === 0 || e === t && (Re === 2 || Re === 9) || e.cancelPendingCommit !== null) return l !== null && l !== null && be(l), e.callbackNode = null, e.callbackPriority = 0;
    if ((a & 3) === 0 || rn(e, a)) {
      if (t = a & -a, t === e.callbackPriority) return t;
      switch (l !== null && be(l), Ts(a)) {
        case 2:
        case 8:
          a = Ut;
          break;
        case 32:
          a = Ft;
          break;
        case 268435456:
          a = u;
          break;
        default:
          a = Ft;
      }
      return l = vf.bind(null, e), a = E(a, l), e.callbackPriority = t, e.callbackNode = a, t;
    }
    return l !== null && l !== null && be(l), e.callbackPriority = 2, e.callbackNode = null, 2;
  }
  function vf(e, t) {
    if (rt !== 0 && rt !== 5) return e.callbackNode = null, e.callbackPriority = 0, null;
    var a = e.callbackNode;
    if (as() && e.callbackNode !== a) return null;
    var l = Ee;
    return l = ci(e, e === Ve ? l : 0, e.cancelPendingCommit !== null || e.timeoutHandle !== -1), l === 0 ? null : (Fu(e, l, t), gf(e, We()), e.callbackNode != null && e.callbackNode === a ? vf.bind(null, e) : null);
  }
  function bf(e, t) {
    if (as()) return null;
    Fu(e, t, !0);
  }
  function J0() {
    nh(function() {
      (De & 6) !== 0 ? E(gl, K0) : xf();
    });
  }
  function hr() {
    if (La === 0) {
      var e = Ul;
      e === 0 && (e = ni, ni <<= 1, (ni & 261888) === 0 && (ni = 256)), La = e;
    }
    return La;
  }
  function jf(e) {
    return e == null || typeof e == "symbol" || typeof e == "boolean" ? null : typeof e == "function" ? e : fi("" + e);
  }
  function yf(e, t) {
    var a = t.ownerDocument.createElement("input");
    return a.name = t.name, a.value = t.value, e.id && a.setAttribute("form", e.id), t.parentNode.insertBefore(a, t), e = new FormData(e), a.parentNode.removeChild(a), e;
  }
  function I0(e, t, a, l, i) {
    if (t === "submit" && a && a.stateNode === i) {
      var s = jf((i[yt] || null).action), c = l.submitter;
      c && (t = (t = c[yt] || null) ? jf(t.formAction) : c.getAttribute("formAction"), t !== null && (s = t, c = null));
      var o = new xi("action", "action", null, l, i);
      e.push({
        event: o,
        listeners: [{
          instance: null,
          listener: function() {
            if (l.defaultPrevented) {
              if (La !== 0) {
                var f = c ? yf(i, c) : new FormData(i);
                Dc(a, {
                  pending: !0,
                  data: f,
                  method: i.method,
                  action: s
                }, null, f);
              }
            } else typeof s == "function" && (o.preventDefault(), f = c ? yf(i, c) : new FormData(i), Dc(a, {
              pending: !0,
              data: f,
              method: i.method,
              action: s
            }, s, f));
          },
          currentTarget: i
        }]
      });
    }
  }
  for (var mr = 0; mr < Ws.length; mr++) {
    var xr = Ws[mr];
    It(xr.toLowerCase(), "on" + (xr[0].toUpperCase() + xr.slice(1)));
  }
  It(ed, "onAnimationEnd"), It(td, "onAnimationIteration"), It(ad, "onAnimationStart"), It("dblclick", "onDoubleClick"), It("focusin", "onFocus"), It("focusout", "onBlur"), It(d0, "onTransitionRun"), It(u0, "onTransitionStart"), It(f0, "onTransitionCancel"), It(ld, "onTransitionEnd"), yl("onMouseEnter", ["mouseout", "mouseover"]), yl("onMouseLeave", ["mouseout", "mouseover"]), yl("onPointerEnter", ["pointerout", "pointerover"]), yl("onPointerLeave", ["pointerout", "pointerover"]), $a("onChange", "change click focusin focusout input keydown keyup selectionchange".split(" ")), $a("onSelect", "focusout contextmenu dragend focusin keydown keyup mousedown mouseup selectionchange".split(" ")), $a("onBeforeInput", [
    "compositionend",
    "keypress",
    "textInput",
    "paste"
  ]), $a("onCompositionEnd", "compositionend focusout keydown keypress keyup mousedown".split(" ")), $a("onCompositionStart", "compositionstart focusout keydown keypress keyup mousedown".split(" ")), $a("onCompositionUpdate", "compositionupdate focusout keydown keypress keyup mousedown".split(" "));
  var Xn = "abort canplay canplaythrough durationchange emptied encrypted ended error loadeddata loadedmetadata loadstart pause play playing progress ratechange resize seeked seeking stalled suspend timeupdate volumechange waiting".split(" "), $0 = new Set("beforetoggle cancel close invalid load scroll scrollend toggle".split(" ").concat(Xn));
  function Sf(e, t) {
    t = (t & 4) !== 0;
    for (var a = 0; a < e.length; a++) {
      var l = e[a], i = l.event;
      l = l.listeners;
      e: {
        var s = void 0;
        if (t) for (var c = l.length - 1; 0 <= c; c--) {
          var o = l[c], f = o.instance, _ = o.currentTarget;
          if (o = o.listener, f !== s && i.isPropagationStopped()) break e;
          s = o, i.currentTarget = _;
          try {
            s(i);
          } catch (D) {
            bi(D);
          }
          i.currentTarget = null, s = f;
        }
        else for (c = 0; c < l.length; c++) {
          if (o = l[c], f = o.instance, _ = o.currentTarget, o = o.listener, f !== s && i.isPropagationStopped()) break e;
          s = o, i.currentTarget = _;
          try {
            s(i);
          } catch (D) {
            bi(D);
          }
          i.currentTarget = null, s = f;
        }
      }
    }
  }
  function _e(e, t) {
    var a = t[As];
    a === void 0 && (a = t[As] = /* @__PURE__ */ new Set());
    var l = e + "__bubble";
    a.has(l) || (Nf(t, e, 2, !1), a.add(l));
  }
  function gr(e, t, a) {
    var l = 0;
    t && (l |= 4), Nf(a, e, l, t);
  }
  var is = "_reactListening" + Math.random().toString(36).slice(2);
  function zf(e) {
    if (!e[is]) {
      e[is] = !0, vo.forEach(function(a) {
        a !== "selectionchange" && ($0.has(a) || gr(a, !1, e), gr(a, !0, e));
      });
      var t = e.nodeType === 9 ? e : e.ownerDocument;
      t === null || t[is] || (t[is] = !0, gr("selectionchange", !1, t));
    }
  }
  function Nf(e, t, a, l) {
    switch (Wf(t)) {
      case 2:
        var i = wh;
        break;
      case 8:
        i = Eh;
        break;
      default:
        i = Or;
    }
    a = i.bind(null, t, a, e), i = void 0, !Hs || t !== "touchstart" && t !== "touchmove" && t !== "wheel" || (i = !0), l ? i !== void 0 ? e.addEventListener(t, a, {
      capture: !0,
      passive: i
    }) : e.addEventListener(t, a, !0) : i !== void 0 ? e.addEventListener(t, a, { passive: i }) : e.addEventListener(t, a, !1);
  }
  function vr(e, t, a, l, i) {
    var s = l;
    if ((t & 1) === 0 && (t & 2) === 0 && l !== null) e: for (; ; ) {
      if (l === null) return;
      var c = l.tag;
      if (c === 3 || c === 4) {
        var o = l.stateNode.containerInfo;
        if (o === i) break;
        if (c === 4) for (c = l.return; c !== null; ) {
          var f = c.tag;
          if ((f === 3 || f === 4) && c.stateNode.containerInfo === i) return;
          c = c.return;
        }
        for (; o !== null; ) {
          if (c = vl(o), c === null) return;
          if (f = c.tag, f === 5 || f === 6 || f === 26 || f === 27) {
            l = s = c;
            continue e;
          }
          o = o.parentNode;
        }
      }
      l = l.return;
    }
    ko(function() {
      var _ = s, D = Rs(a), B = [];
      e: {
        var w = nd.get(e);
        if (w !== void 0) {
          var O = xi, ne = e;
          switch (e) {
            case "keypress":
              if (hi(a) === 0) break e;
            case "keydown":
            case "keyup":
              O = Kp;
              break;
            case "focusin":
              ne = "focus", O = Ys;
              break;
            case "focusout":
              ne = "blur", O = Ys;
              break;
            case "beforeblur":
            case "afterblur":
              O = Ys;
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
              O = Mo;
              break;
            case "drag":
            case "dragend":
            case "dragenter":
            case "dragexit":
            case "dragleave":
            case "dragover":
            case "dragstart":
            case "drop":
              O = Bp;
              break;
            case "touchcancel":
            case "touchend":
            case "touchmove":
            case "touchstart":
              O = Jp;
              break;
            case ed:
            case td:
            case ad:
              O = Gp;
              break;
            case ld:
              O = Ip;
              break;
            case "scroll":
            case "scrollend":
              O = Lp;
              break;
            case "wheel":
              O = $p;
              break;
            case "copy":
            case "cut":
            case "paste":
              O = Yp;
              break;
            case "gotpointercapture":
            case "lostpointercapture":
            case "pointercancel":
            case "pointerdown":
            case "pointermove":
            case "pointerout":
            case "pointerover":
            case "pointerup":
              O = Uo;
              break;
            case "toggle":
            case "beforetoggle":
              O = Wp;
          }
          var ge = (t & 4) !== 0, Be = !ge && (e === "scroll" || e === "scrollend"), j = ge ? w !== null ? w + "Capture" : null : w;
          ge = [];
          for (var v = _, N; v !== null; ) {
            var q = v;
            if (N = q.stateNode, q = q.tag, q !== 5 && q !== 26 && q !== 27 || N === null || j === null || (q = fn(v, j), q != null && ge.push(Qn(v, q, N))), Be) break;
            v = v.return;
          }
          0 < ge.length && (w = new O(w, ne, null, a, D), B.push({
            event: w,
            listeners: ge
          }));
        }
      }
      if ((t & 7) === 0) {
        e: {
          if (w = e === "mouseover" || e === "pointerover", O = e === "mouseout" || e === "pointerout", w && a !== Us && (ne = a.relatedTarget || a.fromElement) && (vl(ne) || ne[on])) break e;
          if ((O || w) && (w = D.window === D ? D : (w = D.ownerDocument) ? w.defaultView || w.parentWindow : window, O ? (ne = a.relatedTarget || a.toElement, O = _, ne = ne ? vl(ne) : null, ne !== null && (Be = y(ne), ge = ne.tag, ne !== Be || ge !== 5 && ge !== 27 && ge !== 6) && (ne = null)) : (O = null, ne = _), O !== ne)) {
            if (ge = Mo, q = "onMouseLeave", j = "onMouseEnter", v = "mouse", (e === "pointerout" || e === "pointerover") && (ge = Uo, q = "onPointerLeave", j = "onPointerEnter", v = "pointer"), Be = O == null ? w : un(O), N = ne == null ? w : un(ne), w = new ge(q, v + "leave", O, a, D), w.target = Be, w.relatedTarget = N, q = null, vl(D) === _ && (ge = new ge(j, v + "enter", ne, a, D), ge.target = N, ge.relatedTarget = Be, q = ge), Be = q, O && ne) t: {
              for (ge = W0, j = O, v = ne, N = 0, q = j; q; q = ge(q)) N++;
              q = 0;
              for (var he = v; he; he = ge(he)) q++;
              for (; 0 < N - q; ) j = ge(j), N--;
              for (; 0 < q - N; ) v = ge(v), q--;
              for (; N--; ) {
                if (j === v || v !== null && j === v.alternate) {
                  ge = j;
                  break t;
                }
                j = ge(j), v = ge(v);
              }
              ge = null;
            }
            else ge = null;
            O !== null && _f(B, w, O, ge, !1), ne !== null && Be !== null && _f(B, Be, ne, ge, !0);
          }
        }
        e: {
          if (w = _ ? un(_) : window, O = w.nodeName && w.nodeName.toLowerCase(), O === "select" || O === "input" && w.type === "file") var Ce = Vo;
          else if (Go(w)) if (Xo) Ce = c0;
          else {
            Ce = i0;
            var re = n0;
          }
          else O = w.nodeName, !O || O.toLowerCase() !== "input" || w.type !== "checkbox" && w.type !== "radio" ? _ && Ds(_.elementType) && (Ce = Vo) : Ce = s0;
          if (Ce && (Ce = Ce(e, _))) {
            Yo(B, Ce, a, D);
            break e;
          }
          re && re(e, w, _), e === "focusout" && _ && w.type === "number" && _.memoizedProps.value != null && Ms(w, "number", w.value);
        }
        switch (re = _ ? un(_) : window, e) {
          case "focusin":
            (Go(re) || re.contentEditable === "true") && (El = re, Js = _, jn = null);
            break;
          case "focusout":
            jn = Js = El = null;
            break;
          case "mousedown":
            Is = !0;
            break;
          case "contextmenu":
          case "mouseup":
          case "dragend":
            Is = !1, Fo(B, a, D);
            break;
          case "selectionchange":
            if (o0) break;
          case "keydown":
          case "keyup":
            Fo(B, a, D);
        }
        var Se;
        if (Xs) e: {
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
        else wl ? Lo(e, a) && (Te = "onCompositionEnd") : e === "keydown" && a.keyCode === 229 && (Te = "onCompositionStart");
        Te && (Ro && a.locale !== "ko" && (wl || Te !== "onCompositionStart" ? Te === "onCompositionEnd" && wl && (Se = Co()) : (_a = D, Ls = "value" in _a ? _a.value : _a.textContent, wl = !0)), re = ss(_, Te), 0 < re.length && (Te = new Do(Te, e, null, a, D), B.push({
          event: Te,
          listeners: re
        }), Se ? Te.data = Se : (Se = Bo(a), Se !== null && (Te.data = Se)))), (Se = Pp ? e0(e, a) : t0(e, a)) && (Te = ss(_, "onBeforeInput"), 0 < Te.length && (re = new Do("onBeforeInput", "beforeinput", null, a, D), B.push({
          event: re,
          listeners: Te
        }), re.data = Se)), I0(B, e, _, a, D);
      }
      Sf(B, t);
    });
  }
  function Qn(e, t, a) {
    return {
      instance: e,
      listener: t,
      currentTarget: a
    };
  }
  function ss(e, t) {
    for (var a = t + "Capture", l = []; e !== null; ) {
      var i = e, s = i.stateNode;
      if (i = i.tag, i !== 5 && i !== 26 && i !== 27 || s === null || (i = fn(e, a), i != null && l.unshift(Qn(e, i, s)), i = fn(e, t), i != null && l.push(Qn(e, i, s))), e.tag === 3) return l;
      e = e.return;
    }
    return [];
  }
  function W0(e) {
    if (e === null) return null;
    do
      e = e.return;
    while (e && e.tag !== 5 && e.tag !== 27);
    return e || null;
  }
  function _f(e, t, a, l, i) {
    for (var s = t._reactName, c = []; a !== null && a !== l; ) {
      var o = a, f = o.alternate, _ = o.stateNode;
      if (o = o.tag, f !== null && f === l) break;
      o !== 5 && o !== 26 && o !== 27 || _ === null || (f = _, i ? (_ = fn(a, s), _ != null && c.unshift(Qn(a, _, f))) : i || (_ = fn(a, s), _ != null && c.push(Qn(a, _, f)))), a = a.return;
    }
    c.length !== 0 && e.push({
      event: t,
      listeners: c
    });
  }
  var F0 = /\r\n?/g, P0 = /\u0000|\uFFFD/g;
  function wf(e) {
    return (typeof e == "string" ? e : "" + e).replace(F0, `
`).replace(P0, "");
  }
  function Ef(e, t) {
    return t = wf(t), wf(e) === t;
  }
  function Le(e, t, a, l, i, s) {
    switch (a) {
      case "children":
        typeof l == "string" ? t === "body" || t === "textarea" && l === "" || zl(e, l) : (typeof l == "number" || typeof l == "bigint") && t !== "body" && zl(e, "" + l);
        break;
      case "className":
        di(e, "class", l);
        break;
      case "tabIndex":
        di(e, "tabindex", l);
        break;
      case "dir":
      case "role":
      case "viewBox":
      case "width":
      case "height":
        di(e, a, l);
        break;
      case "style":
        To(e, l, s);
        break;
      case "data":
        if (t !== "object") {
          di(e, "data", l);
          break;
        }
      case "src":
      case "href":
        if (l === "" && (t !== "a" || a !== "href")) {
          e.removeAttribute(a);
          break;
        }
        if (l == null || typeof l == "function" || typeof l == "symbol" || typeof l == "boolean") {
          e.removeAttribute(a);
          break;
        }
        l = fi("" + l), e.setAttribute(a, l);
        break;
      case "action":
      case "formAction":
        if (typeof l == "function") {
          e.setAttribute(a, "javascript:throw new Error('A React form was unexpectedly submitted. If you called form.submit() manually, consider using form.requestSubmit() instead. If you\\'re trying to use event.stopPropagation() in a submit event handler, consider also calling event.preventDefault().')");
          break;
        } else typeof s == "function" && (a === "formAction" ? (t !== "input" && Le(e, t, "name", i.name, i, null), Le(e, t, "formEncType", i.formEncType, i, null), Le(e, t, "formMethod", i.formMethod, i, null), Le(e, t, "formTarget", i.formTarget, i, null)) : (Le(e, t, "encType", i.encType, i, null), Le(e, t, "method", i.method, i, null), Le(e, t, "target", i.target, i, null)));
        if (l == null || typeof l == "symbol" || typeof l == "boolean") {
          e.removeAttribute(a);
          break;
        }
        l = fi("" + l), e.setAttribute(a, l);
        break;
      case "onClick":
        l != null && (e.onclick = ia);
        break;
      case "onScroll":
        l != null && _e("scroll", e);
        break;
      case "onScrollEnd":
        l != null && _e("scrollend", e);
        break;
      case "dangerouslySetInnerHTML":
        if (l != null) {
          if (typeof l != "object" || !("__html" in l)) throw Error(d(61));
          if (a = l.__html, a != null) {
            if (i.children != null) throw Error(d(60));
            e.innerHTML = a;
          }
        }
        break;
      case "multiple":
        e.multiple = l && typeof l != "function" && typeof l != "symbol";
        break;
      case "muted":
        e.muted = l && typeof l != "function" && typeof l != "symbol";
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
        if (l == null || typeof l == "function" || typeof l == "boolean" || typeof l == "symbol") {
          e.removeAttribute("xlink:href");
          break;
        }
        a = fi("" + l), e.setAttributeNS("http://www.w3.org/1999/xlink", "xlink:href", a);
        break;
      case "contentEditable":
      case "spellCheck":
      case "draggable":
      case "value":
      case "autoReverse":
      case "externalResourcesRequired":
      case "focusable":
      case "preserveAlpha":
        l != null && typeof l != "function" && typeof l != "symbol" ? e.setAttribute(a, "" + l) : e.removeAttribute(a);
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
        l && typeof l != "function" && typeof l != "symbol" ? e.setAttribute(a, "") : e.removeAttribute(a);
        break;
      case "capture":
      case "download":
        l === !0 ? e.setAttribute(a, "") : l !== !1 && l != null && typeof l != "function" && typeof l != "symbol" ? e.setAttribute(a, l) : e.removeAttribute(a);
        break;
      case "cols":
      case "rows":
      case "size":
      case "span":
        l != null && typeof l != "function" && typeof l != "symbol" && !isNaN(l) && 1 <= l ? e.setAttribute(a, l) : e.removeAttribute(a);
        break;
      case "rowSpan":
      case "start":
        l == null || typeof l == "function" || typeof l == "symbol" || isNaN(l) ? e.removeAttribute(a) : e.setAttribute(a, l);
        break;
      case "popover":
        _e("beforetoggle", e), _e("toggle", e), oi(e, "popover", l);
        break;
      case "xlinkActuate":
        na(e, "http://www.w3.org/1999/xlink", "xlink:actuate", l);
        break;
      case "xlinkArcrole":
        na(e, "http://www.w3.org/1999/xlink", "xlink:arcrole", l);
        break;
      case "xlinkRole":
        na(e, "http://www.w3.org/1999/xlink", "xlink:role", l);
        break;
      case "xlinkShow":
        na(e, "http://www.w3.org/1999/xlink", "xlink:show", l);
        break;
      case "xlinkTitle":
        na(e, "http://www.w3.org/1999/xlink", "xlink:title", l);
        break;
      case "xlinkType":
        na(e, "http://www.w3.org/1999/xlink", "xlink:type", l);
        break;
      case "xmlBase":
        na(e, "http://www.w3.org/XML/1998/namespace", "xml:base", l);
        break;
      case "xmlLang":
        na(e, "http://www.w3.org/XML/1998/namespace", "xml:lang", l);
        break;
      case "xmlSpace":
        na(e, "http://www.w3.org/XML/1998/namespace", "xml:space", l);
        break;
      case "is":
        oi(e, "is", l);
        break;
      case "innerText":
      case "textContent":
        break;
      default:
        (!(2 < a.length) || a[0] !== "o" && a[0] !== "O" || a[1] !== "n" && a[1] !== "N") && (a = qp.get(a) || a, oi(e, a, l));
    }
  }
  function br(e, t, a, l, i, s) {
    switch (a) {
      case "style":
        To(e, l, s);
        break;
      case "dangerouslySetInnerHTML":
        if (l != null) {
          if (typeof l != "object" || !("__html" in l)) throw Error(d(61));
          if (a = l.__html, a != null) {
            if (i.children != null) throw Error(d(60));
            e.innerHTML = a;
          }
        }
        break;
      case "children":
        typeof l == "string" ? zl(e, l) : (typeof l == "number" || typeof l == "bigint") && zl(e, "" + l);
        break;
      case "onScroll":
        l != null && _e("scroll", e);
        break;
      case "onScrollEnd":
        l != null && _e("scrollend", e);
        break;
      case "onClick":
        l != null && (e.onclick = ia);
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
        if (!bo.hasOwnProperty(a)) e: {
          if (a[0] === "o" && a[1] === "n" && (i = a.endsWith("Capture"), t = a.slice(2, i ? a.length - 7 : void 0), s = e[yt] || null, s = s != null ? s[a] : null, typeof s == "function" && e.removeEventListener(t, s, i), typeof l == "function")) {
            typeof s != "function" && s !== null && (a in e ? e[a] = null : e.hasAttribute(a) && e.removeAttribute(a)), e.addEventListener(t, l, i);
            break e;
          }
          a in e ? e[a] = l : l === !0 ? e.setAttribute(a, "") : oi(e, a, l);
        }
    }
  }
  function mt(e, t, a) {
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
        _e("error", e), _e("load", e);
        var l = !1, i = !1, s;
        for (s in a) if (a.hasOwnProperty(s)) {
          var c = a[s];
          if (c != null) switch (s) {
            case "src":
              l = !0;
              break;
            case "srcSet":
              i = !0;
              break;
            case "children":
            case "dangerouslySetInnerHTML":
              throw Error(d(137, t));
            default:
              Le(e, t, s, c, a, null);
          }
        }
        i && Le(e, t, "srcSet", a.srcSet, a, null), l && Le(e, t, "src", a.src, a, null);
        return;
      case "input":
        _e("invalid", e);
        var o = s = c = i = null, f = null, _ = null;
        for (l in a) if (a.hasOwnProperty(l)) {
          var D = a[l];
          if (D != null) switch (l) {
            case "name":
              i = D;
              break;
            case "type":
              c = D;
              break;
            case "checked":
              f = D;
              break;
            case "defaultChecked":
              _ = D;
              break;
            case "value":
              s = D;
              break;
            case "defaultValue":
              o = D;
              break;
            case "children":
            case "dangerouslySetInnerHTML":
              if (D != null) throw Error(d(137, t));
              break;
            default:
              Le(e, t, l, D, a, null);
          }
        }
        No(e, s, o, f, _, c, i, !1);
        return;
      case "select":
        _e("invalid", e), l = c = s = null;
        for (i in a) if (a.hasOwnProperty(i) && (o = a[i], o != null)) switch (i) {
          case "value":
            s = o;
            break;
          case "defaultValue":
            c = o;
            break;
          case "multiple":
            l = o;
          default:
            Le(e, t, i, o, a, null);
        }
        t = s, a = c, e.multiple = !!l, t != null ? Sl(e, !!l, t, !1) : a != null && Sl(e, !!l, a, !0);
        return;
      case "textarea":
        _e("invalid", e), s = i = l = null;
        for (c in a) if (a.hasOwnProperty(c) && (o = a[c], o != null)) switch (c) {
          case "value":
            l = o;
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
            Le(e, t, c, o, a, null);
        }
        wo(e, l, i, s);
        return;
      case "option":
        for (f in a) a.hasOwnProperty(f) && (l = a[f], l != null) && (f === "selected" ? e.selected = l && typeof l != "function" && typeof l != "symbol" : Le(e, t, f, l, a, null));
        return;
      case "dialog":
        _e("beforetoggle", e), _e("toggle", e), _e("cancel", e), _e("close", e);
        break;
      case "iframe":
      case "object":
        _e("load", e);
        break;
      case "video":
      case "audio":
        for (l = 0; l < Xn.length; l++) _e(Xn[l], e);
        break;
      case "image":
        _e("error", e), _e("load", e);
        break;
      case "details":
        _e("toggle", e);
        break;
      case "embed":
      case "source":
      case "link":
        _e("error", e), _e("load", e);
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
        for (_ in a) if (a.hasOwnProperty(_) && (l = a[_], l != null)) switch (_) {
          case "children":
          case "dangerouslySetInnerHTML":
            throw Error(d(137, t));
          default:
            Le(e, t, _, l, a, null);
        }
        return;
      default:
        if (Ds(t)) {
          for (D in a) a.hasOwnProperty(D) && (l = a[D], l !== void 0 && br(e, t, D, l, a, void 0));
          return;
        }
    }
    for (o in a) a.hasOwnProperty(o) && (l = a[o], l != null && Le(e, t, o, l, a, null));
  }
  function eh(e, t, a, l) {
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
        var i = null, s = null, c = null, o = null, f = null, _ = null, D = null;
        for (O in a) {
          var B = a[O];
          if (a.hasOwnProperty(O) && B != null) switch (O) {
            case "checked":
              break;
            case "value":
              break;
            case "defaultValue":
              f = B;
            default:
              l.hasOwnProperty(O) || Le(e, t, O, null, l, B);
          }
        }
        for (var w in l) {
          var O = l[w];
          if (B = a[w], l.hasOwnProperty(w) && (O != null || B != null)) switch (w) {
            case "type":
              s = O;
              break;
            case "name":
              i = O;
              break;
            case "checked":
              _ = O;
              break;
            case "defaultChecked":
              D = O;
              break;
            case "value":
              c = O;
              break;
            case "defaultValue":
              o = O;
              break;
            case "children":
            case "dangerouslySetInnerHTML":
              if (O != null) throw Error(d(137, t));
              break;
            default:
              O !== B && Le(e, t, w, O, l, B);
          }
        }
        Os(e, c, o, f, _, D, s, i);
        return;
      case "select":
        O = c = o = w = null;
        for (s in a) if (f = a[s], a.hasOwnProperty(s) && f != null) switch (s) {
          case "value":
            break;
          case "multiple":
            O = f;
          default:
            l.hasOwnProperty(s) || Le(e, t, s, null, l, f);
        }
        for (i in l) if (s = l[i], f = a[i], l.hasOwnProperty(i) && (s != null || f != null)) switch (i) {
          case "value":
            w = s;
            break;
          case "defaultValue":
            o = s;
            break;
          case "multiple":
            c = s;
          default:
            s !== f && Le(e, t, i, s, l, f);
        }
        t = o, a = c, l = O, w != null ? Sl(e, !!a, w, !1) : !!l != !!a && (t != null ? Sl(e, !!a, t, !0) : Sl(e, !!a, a ? [] : "", !1));
        return;
      case "textarea":
        O = w = null;
        for (o in a) if (i = a[o], a.hasOwnProperty(o) && i != null && !l.hasOwnProperty(o)) switch (o) {
          case "value":
            break;
          case "children":
            break;
          default:
            Le(e, t, o, null, l, i);
        }
        for (c in l) if (i = l[c], s = a[c], l.hasOwnProperty(c) && (i != null || s != null)) switch (c) {
          case "value":
            w = i;
            break;
          case "defaultValue":
            O = i;
            break;
          case "children":
            break;
          case "dangerouslySetInnerHTML":
            if (i != null) throw Error(d(91));
            break;
          default:
            i !== s && Le(e, t, c, i, l, s);
        }
        _o(e, w, O);
        return;
      case "option":
        for (var ne in a) w = a[ne], a.hasOwnProperty(ne) && w != null && !l.hasOwnProperty(ne) && (ne === "selected" ? e.selected = !1 : Le(e, t, ne, null, l, w));
        for (f in l) w = l[f], O = a[f], l.hasOwnProperty(f) && w !== O && (w != null || O != null) && (f === "selected" ? e.selected = w && typeof w != "function" && typeof w != "symbol" : Le(e, t, f, w, l, O));
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
        for (var ge in a) w = a[ge], a.hasOwnProperty(ge) && w != null && !l.hasOwnProperty(ge) && Le(e, t, ge, null, l, w);
        for (_ in l) if (w = l[_], O = a[_], l.hasOwnProperty(_) && w !== O && (w != null || O != null)) switch (_) {
          case "children":
          case "dangerouslySetInnerHTML":
            if (w != null) throw Error(d(137, t));
            break;
          default:
            Le(e, t, _, w, l, O);
        }
        return;
      default:
        if (Ds(t)) {
          for (var Be in a) w = a[Be], a.hasOwnProperty(Be) && w !== void 0 && !l.hasOwnProperty(Be) && br(e, t, Be, void 0, l, w);
          for (D in l) w = l[D], O = a[D], !l.hasOwnProperty(D) || w === O || w === void 0 && O === void 0 || br(e, t, D, w, l, O);
          return;
        }
    }
    for (var j in a) w = a[j], a.hasOwnProperty(j) && w != null && !l.hasOwnProperty(j) && Le(e, t, j, null, l, w);
    for (B in l) w = l[B], O = a[B], !l.hasOwnProperty(B) || w === O || w == null && O == null || Le(e, t, B, w, l, O);
  }
  function Tf(e) {
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
  function th() {
    if (typeof performance.getEntriesByType == "function") {
      for (var e = 0, t = 0, a = performance.getEntriesByType("resource"), l = 0; l < a.length; l++) {
        var i = a[l], s = i.transferSize, c = i.initiatorType, o = i.duration;
        if (s && o && Tf(c)) {
          for (c = 0, o = i.responseEnd, l += 1; l < a.length; l++) {
            var f = a[l], _ = f.startTime;
            if (_ > o) break;
            var D = f.transferSize, B = f.initiatorType;
            D && Tf(B) && (f = f.responseEnd, c += D * (f < o ? 1 : (o - _) / (f - _)));
          }
          if (--l, t += 8 * (s + c) / (i.duration / 1e3), e++, 10 < e) break;
        }
      }
      if (0 < e) return t / e / 1e6;
    }
    return navigator.connection && (e = navigator.connection.downlink, typeof e == "number") ? e : 5;
  }
  var jr = null, yr = null;
  function cs(e) {
    return e.nodeType === 9 ? e : e.ownerDocument;
  }
  function Af(e) {
    switch (e) {
      case "http://www.w3.org/2000/svg":
        return 1;
      case "http://www.w3.org/1998/Math/MathML":
        return 2;
      default:
        return 0;
    }
  }
  function kf(e, t) {
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
  function Sr(e, t) {
    return e === "textarea" || e === "noscript" || typeof t.children == "string" || typeof t.children == "number" || typeof t.children == "bigint" || typeof t.dangerouslySetInnerHTML == "object" && t.dangerouslySetInnerHTML !== null && t.dangerouslySetInnerHTML.__html != null;
  }
  var zr = null;
  function ah() {
    var e = window.event;
    return e && e.type === "popstate" ? e === zr ? !1 : (zr = e, !0) : (zr = null, !1);
  }
  var Cf = typeof setTimeout == "function" ? setTimeout : void 0, lh = typeof clearTimeout == "function" ? clearTimeout : void 0, Of = typeof Promise == "function" ? Promise : void 0, nh = typeof queueMicrotask == "function" ? queueMicrotask : typeof Of < "u" ? function(e) {
    return Of.resolve(null).then(e).catch(ih);
  } : Cf;
  function ih(e) {
    setTimeout(function() {
      throw e;
    });
  }
  function Ba(e) {
    return e === "head";
  }
  function Mf(e, t) {
    var a = t, l = 0;
    do {
      var i = a.nextSibling;
      if (e.removeChild(a), i && i.nodeType === 8) if (a = i.data, a === "/$" || a === "/&") {
        if (l === 0) {
          e.removeChild(i), en(t);
          return;
        }
        l--;
      } else if (a === "$" || a === "$?" || a === "$~" || a === "$!" || a === "&") l++;
      else if (a === "html") Zn(e.ownerDocument.documentElement);
      else if (a === "head") {
        a = e.ownerDocument.head, Zn(a);
        for (var s = a.firstChild; s; ) {
          var c = s.nextSibling, o = s.nodeName;
          s[dn] || o === "SCRIPT" || o === "STYLE" || o === "LINK" && s.rel.toLowerCase() === "stylesheet" || a.removeChild(s), s = c;
        }
      } else a === "body" && Zn(e.ownerDocument.body);
      a = i;
    } while (a);
    en(t);
  }
  function Df(e, t) {
    var a = e;
    e = 0;
    do {
      var l = a.nextSibling;
      if (a.nodeType === 1 ? t ? (a._stashedDisplay = a.style.display, a.style.display = "none") : (a.style.display = a._stashedDisplay || "", a.getAttribute("style") === "" && a.removeAttribute("style")) : a.nodeType === 3 && (t ? (a._stashedText = a.nodeValue, a.nodeValue = "") : a.nodeValue = a._stashedText || ""), l && l.nodeType === 8) if (a = l.data, a === "/$") {
        if (e === 0) break;
        e--;
      } else a !== "$" && a !== "$?" && a !== "$~" && a !== "$!" || e++;
      a = l;
    } while (a);
  }
  function Nr(e) {
    var t = e.firstChild;
    for (t && t.nodeType === 10 && (t = t.nextSibling); t; ) {
      var a = t;
      switch (t = t.nextSibling, a.nodeName) {
        case "HTML":
        case "HEAD":
        case "BODY":
          Nr(a), ks(a);
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
  function sh(e, t, a, l) {
    for (; e.nodeType === 1; ) {
      var i = a;
      if (e.nodeName.toLowerCase() !== t.toLowerCase()) {
        if (!l && (e.nodeName !== "INPUT" || e.type !== "hidden")) break;
      } else if (l) {
        if (!e[dn]) switch (t) {
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
      if (e = Qt(e.nextSibling), e === null) break;
    }
    return null;
  }
  function ch(e, t, a) {
    if (t === "") return null;
    for (; e.nodeType !== 3; )
      if ((e.nodeType !== 1 || e.nodeName !== "INPUT" || e.type !== "hidden") && !a || (e = Qt(e.nextSibling), e === null)) return null;
    return e;
  }
  function Uf(e, t) {
    for (; e.nodeType !== 8; )
      if ((e.nodeType !== 1 || e.nodeName !== "INPUT" || e.type !== "hidden") && !t || (e = Qt(e.nextSibling), e === null)) return null;
    return e;
  }
  function _r(e) {
    return e.data === "$?" || e.data === "$~";
  }
  function wr(e) {
    return e.data === "$!" || e.data === "$?" && e.ownerDocument.readyState !== "loading";
  }
  function rh(e, t) {
    var a = e.ownerDocument;
    if (e.data === "$~") e._reactRetry = t;
    else if (e.data !== "$?" || a.readyState !== "loading") t();
    else {
      var l = function() {
        t(), a.removeEventListener("DOMContentLoaded", l);
      };
      a.addEventListener("DOMContentLoaded", l), e._reactRetry = l;
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
  var Er = null;
  function Rf(e) {
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
  function qf(e) {
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
  function Hf(e, t, a) {
    switch (t = cs(a), e) {
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
  function Zn(e) {
    for (var t = e.attributes; t.length; ) e.removeAttributeNode(t[0]);
    ks(e);
  }
  var Zt = /* @__PURE__ */ new Map(), Lf = /* @__PURE__ */ new Set();
  function rs(e) {
    return typeof e.getRootNode == "function" ? e.getRootNode() : e.nodeType === 9 ? e : e.ownerDocument;
  }
  var Sa = Y.d;
  Y.d = {
    f: oh,
    r: dh,
    D: uh,
    C: fh,
    L: ph,
    m: hh,
    X: xh,
    S: mh,
    M: gh
  };
  function oh() {
    var e = Sa.f(), t = Pi();
    return e || t;
  }
  function dh(e) {
    var t = bl(e);
    t !== null && t.tag === 5 && t.type === "form" ? lu(t) : Sa.r(e);
  }
  var Wl = typeof document > "u" ? null : document;
  function Bf(e, t, a) {
    var l = Wl;
    if (l && typeof t == "string" && t) {
      var i = qt(t);
      i = 'link[rel="' + e + '"][href="' + i + '"]', typeof a == "string" && (i += '[crossorigin="' + a + '"]'), Lf.has(i) || (Lf.add(i), e = {
        rel: e,
        crossOrigin: a,
        href: t
      }, l.querySelector(i) === null && (t = l.createElement("link"), mt(t, "link", e), ot(t), l.head.appendChild(t)));
    }
  }
  function uh(e) {
    Sa.D(e), Bf("dns-prefetch", e, null);
  }
  function fh(e, t) {
    Sa.C(e, t), Bf("preconnect", e, t);
  }
  function ph(e, t, a) {
    Sa.L(e, t, a);
    var l = Wl;
    if (l && e && t) {
      var i = 'link[rel="preload"][as="' + qt(t) + '"]';
      t === "image" && a && a.imageSrcSet ? (i += '[imagesrcset="' + qt(a.imageSrcSet) + '"]', typeof a.imageSizes == "string" && (i += '[imagesizes="' + qt(a.imageSizes) + '"]')) : i += '[href="' + qt(e) + '"]';
      var s = i;
      switch (t) {
        case "style":
          s = Fl(e);
          break;
        case "script":
          s = Pl(e);
      }
      Zt.has(s) || (e = U({
        rel: "preload",
        href: t === "image" && a && a.imageSrcSet ? void 0 : e,
        as: t
      }, a), Zt.set(s, e), l.querySelector(i) !== null || t === "style" && l.querySelector(Kn(s)) || t === "script" && l.querySelector(Jn(s)) || (t = l.createElement("link"), mt(t, "link", e), ot(t), l.head.appendChild(t)));
    }
  }
  function hh(e, t) {
    Sa.m(e, t);
    var a = Wl;
    if (a && e) {
      var l = t && typeof t.as == "string" ? t.as : "script", i = 'link[rel="modulepreload"][as="' + qt(l) + '"][href="' + qt(e) + '"]', s = i;
      switch (l) {
        case "audioworklet":
        case "paintworklet":
        case "serviceworker":
        case "sharedworker":
        case "worker":
        case "script":
          s = Pl(e);
      }
      if (!Zt.has(s) && (e = U({
        rel: "modulepreload",
        href: e
      }, t), Zt.set(s, e), a.querySelector(i) === null)) {
        switch (l) {
          case "audioworklet":
          case "paintworklet":
          case "serviceworker":
          case "sharedworker":
          case "worker":
          case "script":
            if (a.querySelector(Jn(s))) return;
        }
        l = a.createElement("link"), mt(l, "link", e), ot(l), a.head.appendChild(l);
      }
    }
  }
  function mh(e, t, a) {
    Sa.S(e, t, a);
    var l = Wl;
    if (l && e) {
      var i = jl(l).hoistableStyles, s = Fl(e);
      t = t || "default";
      var c = i.get(s);
      if (!c) {
        var o = {
          loading: 0,
          preload: null
        };
        if (c = l.querySelector(Kn(s))) o.loading = 5;
        else {
          e = U({
            rel: "stylesheet",
            href: e,
            "data-precedence": t
          }, a), (a = Zt.get(s)) && Tr(e, a);
          var f = c = l.createElement("link");
          ot(f), mt(f, "link", e), f._p = new Promise(function(_, D) {
            f.onload = _, f.onerror = D;
          }), f.addEventListener("load", function() {
            o.loading |= 1;
          }), f.addEventListener("error", function() {
            o.loading |= 2;
          }), o.loading |= 4, os(c, t, l);
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
  function xh(e, t) {
    Sa.X(e, t);
    var a = Wl;
    if (a && e) {
      var l = jl(a).hoistableScripts, i = Pl(e), s = l.get(i);
      s || (s = a.querySelector(Jn(i)), s || (e = U({
        src: e,
        async: !0
      }, t), (t = Zt.get(i)) && Ar(e, t), s = a.createElement("script"), ot(s), mt(s, "link", e), a.head.appendChild(s)), s = {
        type: "script",
        instance: s,
        count: 1,
        state: null
      }, l.set(i, s));
    }
  }
  function gh(e, t) {
    Sa.M(e, t);
    var a = Wl;
    if (a && e) {
      var l = jl(a).hoistableScripts, i = Pl(e), s = l.get(i);
      s || (s = a.querySelector(Jn(i)), s || (e = U({
        src: e,
        async: !0,
        type: "module"
      }, t), (t = Zt.get(i)) && Ar(e, t), s = a.createElement("script"), ot(s), mt(s, "link", e), a.head.appendChild(s)), s = {
        type: "script",
        instance: s,
        count: 1,
        state: null
      }, l.set(i, s));
    }
  }
  function Gf(e, t, a, l) {
    var i = (i = $.current) ? rs(i) : null;
    if (!i) throw Error(d(446));
    switch (e) {
      case "meta":
      case "title":
        return null;
      case "style":
        return typeof a.precedence == "string" && typeof a.href == "string" ? (t = Fl(a.href), a = jl(i).hoistableStyles, l = a.get(t), l || (l = {
          type: "style",
          instance: null,
          count: 0,
          state: null
        }, a.set(t, l)), l) : {
          type: "void",
          instance: null,
          count: 0,
          state: null
        };
      case "link":
        if (a.rel === "stylesheet" && typeof a.href == "string" && typeof a.precedence == "string") {
          e = Fl(a.href);
          var s = jl(i).hoistableStyles, c = s.get(e);
          if (c || (i = i.ownerDocument || i, c = {
            type: "stylesheet",
            instance: null,
            count: 0,
            state: {
              loading: 0,
              preload: null
            }
          }, s.set(e, c), (s = i.querySelector(Kn(e))) && !s._p && (c.instance = s, c.state.loading = 5), Zt.has(e) || (a = {
            rel: "preload",
            as: "style",
            href: a.href,
            crossOrigin: a.crossOrigin,
            integrity: a.integrity,
            media: a.media,
            hrefLang: a.hrefLang,
            referrerPolicy: a.referrerPolicy
          }, Zt.set(e, a), s || vh(i, e, a, c.state))), t && l === null) throw Error(d(528, ""));
          return c;
        }
        if (t && l !== null) throw Error(d(529, ""));
        return null;
      case "script":
        return t = a.async, a = a.src, typeof a == "string" && t && typeof t != "function" && typeof t != "symbol" ? (t = Pl(a), a = jl(i).hoistableScripts, l = a.get(t), l || (l = {
          type: "script",
          instance: null,
          count: 0,
          state: null
        }, a.set(t, l)), l) : {
          type: "void",
          instance: null,
          count: 0,
          state: null
        };
      default:
        throw Error(d(444, e));
    }
  }
  function Fl(e) {
    return 'href="' + qt(e) + '"';
  }
  function Kn(e) {
    return 'link[rel="stylesheet"][' + e + "]";
  }
  function Yf(e) {
    return U({}, e, {
      "data-precedence": e.precedence,
      precedence: null
    });
  }
  function vh(e, t, a, l) {
    e.querySelector('link[rel="preload"][as="style"][' + t + "]") ? l.loading = 1 : (t = e.createElement("link"), l.preload = t, t.addEventListener("load", function() {
      return l.loading |= 1;
    }), t.addEventListener("error", function() {
      return l.loading |= 2;
    }), mt(t, "link", a), ot(t), e.head.appendChild(t));
  }
  function Pl(e) {
    return '[src="' + qt(e) + '"]';
  }
  function Jn(e) {
    return "script[async]" + e;
  }
  function Vf(e, t, a) {
    if (t.count++, t.instance === null) switch (t.type) {
      case "style":
        var l = e.querySelector('style[data-href~="' + qt(a.href) + '"]');
        if (l) return t.instance = l, ot(l), l;
        var i = U({}, a, {
          "data-href": a.href,
          "data-precedence": a.precedence,
          href: null,
          precedence: null
        });
        return l = (e.ownerDocument || e).createElement("style"), ot(l), mt(l, "style", i), os(l, a.precedence, e), t.instance = l;
      case "stylesheet":
        i = Fl(a.href);
        var s = e.querySelector(Kn(i));
        if (s) return t.state.loading |= 4, t.instance = s, ot(s), s;
        l = Yf(a), (i = Zt.get(i)) && Tr(l, i), s = (e.ownerDocument || e).createElement("link"), ot(s);
        var c = s;
        return c._p = new Promise(function(o, f) {
          c.onload = o, c.onerror = f;
        }), mt(s, "link", l), t.state.loading |= 4, os(s, a.precedence, e), t.instance = s;
      case "script":
        return s = Pl(a.src), (i = e.querySelector(Jn(s))) ? (t.instance = i, ot(i), i) : (l = a, (i = Zt.get(s)) && (l = U({}, a), Ar(l, i)), e = e.ownerDocument || e, i = e.createElement("script"), ot(i), mt(i, "link", l), e.head.appendChild(i), t.instance = i);
      case "void":
        return null;
      default:
        throw Error(d(443, t.type));
    }
    else t.type === "stylesheet" && (t.state.loading & 4) === 0 && (l = t.instance, t.state.loading |= 4, os(l, a.precedence, e));
    return t.instance;
  }
  function os(e, t, a) {
    for (var l = a.querySelectorAll('link[rel="stylesheet"][data-precedence],style[data-precedence]'), i = l.length ? l[l.length - 1] : null, s = i, c = 0; c < l.length; c++) {
      var o = l[c];
      if (o.dataset.precedence === t) s = o;
      else if (s !== i) break;
    }
    s ? s.parentNode.insertBefore(e, s.nextSibling) : (t = a.nodeType === 9 ? a.head : a, t.insertBefore(e, t.firstChild));
  }
  function Tr(e, t) {
    e.crossOrigin ??= t.crossOrigin, e.referrerPolicy ??= t.referrerPolicy, e.title ??= t.title;
  }
  function Ar(e, t) {
    e.crossOrigin ??= t.crossOrigin, e.referrerPolicy ??= t.referrerPolicy, e.integrity ??= t.integrity;
  }
  var ds = null;
  function Xf(e, t, a) {
    if (ds === null) {
      var l = /* @__PURE__ */ new Map(), i = ds = /* @__PURE__ */ new Map();
      i.set(a, l);
    } else i = ds, l = i.get(a), l || (l = /* @__PURE__ */ new Map(), i.set(a, l));
    if (l.has(e)) return l;
    for (l.set(e, null), a = a.getElementsByTagName(e), i = 0; i < a.length; i++) {
      var s = a[i];
      if (!(s[dn] || s[ut] || e === "link" && s.getAttribute("rel") === "stylesheet") && s.namespaceURI !== "http://www.w3.org/2000/svg") {
        var c = s.getAttribute(t) || "";
        c = e + c;
        var o = l.get(c);
        o ? o.push(s) : l.set(c, [s]);
      }
    }
    return l;
  }
  function Qf(e, t, a) {
    e = e.ownerDocument || e, e.head.insertBefore(a, t === "title" ? e.querySelector("head > title") : null);
  }
  function bh(e, t, a) {
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
  function Zf(e) {
    return !(e.type === "stylesheet" && (e.state.loading & 3) === 0);
  }
  function jh(e, t, a, l) {
    if (a.type === "stylesheet" && (typeof l.media != "string" || matchMedia(l.media).matches !== !1) && (a.state.loading & 4) === 0) {
      if (a.instance === null) {
        var i = Fl(l.href), s = t.querySelector(Kn(i));
        if (s) {
          t = s._p, t !== null && typeof t == "object" && typeof t.then == "function" && (e.count++, e = us.bind(e), t.then(e, e)), a.state.loading |= 4, a.instance = s, ot(s);
          return;
        }
        s = t.ownerDocument || t, l = Yf(l), (i = Zt.get(i)) && Tr(l, i), s = s.createElement("link"), ot(s);
        var c = s;
        c._p = new Promise(function(o, f) {
          c.onload = o, c.onerror = f;
        }), mt(s, "link", l), a.instance = s;
      }
      e.stylesheets === null && (e.stylesheets = /* @__PURE__ */ new Map()), e.stylesheets.set(a, t), (t = a.state.preload) && (a.state.loading & 3) === 0 && (e.count++, a = us.bind(e), t.addEventListener("load", a), t.addEventListener("error", a));
    }
  }
  var kr = 0;
  function yh(e, t) {
    return e.stylesheets && e.count === 0 && ps(e, e.stylesheets), 0 < e.count || 0 < e.imgCount ? function(a) {
      var l = setTimeout(function() {
        if (e.stylesheets && ps(e, e.stylesheets), e.unsuspend) {
          var s = e.unsuspend;
          e.unsuspend = null, s();
        }
      }, 6e4 + t);
      0 < e.imgBytes && kr === 0 && (kr = 62500 * th());
      var i = setTimeout(function() {
        if (e.waitingForImages = !1, e.count === 0 && (e.stylesheets && ps(e, e.stylesheets), e.unsuspend)) {
          var s = e.unsuspend;
          e.unsuspend = null, s();
        }
      }, (e.imgBytes > kr ? 50 : 800) + t);
      return e.unsuspend = a, function() {
        e.unsuspend = null, clearTimeout(l), clearTimeout(i);
      };
    } : null;
  }
  function us() {
    if (this.count--, this.count === 0 && (this.imgCount === 0 || !this.waitingForImages)) {
      if (this.stylesheets) ps(this, this.stylesheets);
      else if (this.unsuspend) {
        var e = this.unsuspend;
        this.unsuspend = null, e();
      }
    }
  }
  var fs = null;
  function ps(e, t) {
    e.stylesheets = null, e.unsuspend !== null && (e.count++, fs = /* @__PURE__ */ new Map(), t.forEach(Sh, e), fs = null, us.call(e));
  }
  function Sh(e, t) {
    if (!(t.state.loading & 4)) {
      var a = fs.get(e);
      if (a) var l = a.get(null);
      else {
        a = /* @__PURE__ */ new Map(), fs.set(e, a);
        for (var i = e.querySelectorAll("link[data-precedence],style[data-precedence]"), s = 0; s < i.length; s++) {
          var c = i[s];
          (c.nodeName === "LINK" || c.getAttribute("media") !== "not all") && (a.set(c.dataset.precedence, c), l = c);
        }
        l && a.set(null, l);
      }
      i = t.instance, c = i.getAttribute("data-precedence"), s = a.get(c) || l, s === l && a.set(null, i), a.set(c, i), this.count++, l = us.bind(this), i.addEventListener("load", l), i.addEventListener("error", l), s ? s.parentNode.insertBefore(i, s.nextSibling) : (e = e.nodeType === 9 ? e.head : e, e.insertBefore(i, e.firstChild)), t.state.loading |= 4;
    }
  }
  var In = {
    $$typeof: G,
    Provider: null,
    Consumer: null,
    _currentValue: pe,
    _currentValue2: pe,
    _threadCount: 0
  };
  function zh(e, t, a, l, i, s, c, o, f) {
    this.tag = 1, this.containerInfo = e, this.pingCache = this.current = this.pendingChildren = null, this.timeoutHandle = -1, this.callbackNode = this.next = this.pendingContext = this.context = this.cancelPendingCommit = null, this.callbackPriority = 0, this.expirationTimes = Es(-1), this.entangledLanes = this.shellSuspendCounter = this.errorRecoveryDisabledLanes = this.expiredLanes = this.warmLanes = this.pingedLanes = this.suspendedLanes = this.pendingLanes = 0, this.entanglements = Es(0), this.hiddenUpdates = Es(null), this.identifierPrefix = l, this.onUncaughtError = i, this.onCaughtError = s, this.onRecoverableError = c, this.pooledCache = null, this.pooledCacheLanes = 0, this.formState = f, this.incompleteTransitions = /* @__PURE__ */ new Map();
  }
  function Nh(e, t, a, l, i, s, c, o, f, _, D, B) {
    return e = new zh(e, t, a, c, f, _, D, B, o), t = 1, s === !0 && (t |= 24), s = At(3, null, null, t), e.current = s, s.stateNode = e, t = dc(), t.refCount++, e.pooledCache = t, t.refCount++, s.memoizedState = {
      element: l,
      isDehydrated: a,
      cache: t
    }, hc(s), e;
  }
  function _h(e) {
    return e ? (e = kl, e) : kl;
  }
  function Kf(e, t, a, l, i, s) {
    i = _h(i), l.context === null ? l.context = i : l.pendingContext = i, l = ol(t), l.payload = { element: a }, s = s === void 0 ? null : s, s !== null && (l.callback = s), a = dl(e, l, t), a !== null && (Et(a, e, t), En(a, e, t));
  }
  function Jf(e, t) {
    if (e = e.memoizedState, e !== null && e.dehydrated !== null) {
      var a = e.retryLane;
      e.retryLane = a !== 0 && a < t ? a : t;
    }
  }
  function Cr(e, t) {
    Jf(e, t), (e = e.alternate) && Jf(e, t);
  }
  function If(e) {
    if (e.tag === 13 || e.tag === 31) {
      var t = el(e, 67108864);
      t !== null && Et(t, e, 67108864), Cr(e, 67108864);
    }
  }
  function $f(e) {
    if (e.tag === 13 || e.tag === 31) {
      var t = Xt();
      t = ho(t);
      var a = el(e, t);
      a !== null && Et(a, e, t), Cr(e, t);
    }
  }
  var hs = !0;
  function wh(e, t, a, l) {
    var i = R.T;
    R.T = null;
    var s = Y.p;
    try {
      Y.p = 2, Or(e, t, a, l);
    } finally {
      Y.p = s, R.T = i;
    }
  }
  function Eh(e, t, a, l) {
    var i = R.T;
    R.T = null;
    var s = Y.p;
    try {
      Y.p = 8, Or(e, t, a, l);
    } finally {
      Y.p = s, R.T = i;
    }
  }
  function Or(e, t, a, l) {
    if (hs) {
      var i = Mr(l);
      if (i === null) vr(e, t, l, ms, a), Ff(e, l);
      else if (Ah(i, e, t, a, l)) l.stopPropagation();
      else if (Ff(e, l), t & 4 && -1 < Th.indexOf(e)) {
        for (; i !== null; ) {
          var s = bl(i);
          if (s !== null) switch (s.tag) {
            case 3:
              if (s = s.stateNode, s.current.memoizedState.isDehydrated) {
                var c = Ia(s.pendingLanes);
                if (c !== 0) {
                  var o = s;
                  for (o.pendingLanes |= 2, o.entangledLanes |= 2; c; ) {
                    var f = 1 << 31 - ct(c);
                    o.entanglements[1] |= f, c &= ~f;
                  }
                  ya(s), (De & 6) === 0 && (Wi = We() + 500, Vn(0, !1));
                }
              }
              break;
            case 31:
            case 13:
              o = el(s, 2), o !== null && Et(o, s, 2), Pi(), Cr(s, 2);
          }
          if (s = Mr(l), s === null && vr(e, t, l, ms, a), s === i) break;
          i = s;
        }
        i !== null && l.stopPropagation();
      } else vr(e, t, l, null, a);
    }
  }
  function Mr(e) {
    return e = Rs(e), Dr(e);
  }
  var ms = null;
  function Dr(e) {
    if (ms = null, e = vl(e), e !== null) {
      var t = y(e);
      if (t === null) e = null;
      else {
        var a = t.tag;
        if (a === 13) {
          if (e = L(t), e !== null) return e;
          e = null;
        } else if (a === 31) {
          if (e = T(t), e !== null) return e;
          e = null;
        } else if (a === 3) {
          if (t.stateNode.current.memoizedState.isDehydrated) return t.tag === 3 ? t.stateNode.containerInfo : null;
          e = null;
        } else t !== e && (e = null);
      }
    }
    return ms = e, null;
  }
  function Wf(e) {
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
        switch (Ka()) {
          case gl:
            return 2;
          case Ut:
            return 8;
          case Ft:
          case Ja:
            return 32;
          case u:
            return 268435456;
          default:
            return 32;
        }
      default:
        return 32;
    }
  }
  var Ur = !1, Ga = null, Ya = null, Va = null, $n = /* @__PURE__ */ new Map(), Wn = /* @__PURE__ */ new Map(), Xa = [], Th = "mousedown mouseup touchcancel touchend touchstart auxclick dblclick pointercancel pointerdown pointerup dragend dragstart drop compositionend compositionstart keydown keypress keyup input textInput copy cut paste click change contextmenu reset".split(" ");
  function Ff(e, t) {
    switch (e) {
      case "focusin":
      case "focusout":
        Ga = null;
        break;
      case "dragenter":
      case "dragleave":
        Ya = null;
        break;
      case "mouseover":
      case "mouseout":
        Va = null;
        break;
      case "pointerover":
      case "pointerout":
        $n.delete(t.pointerId);
        break;
      case "gotpointercapture":
      case "lostpointercapture":
        Wn.delete(t.pointerId);
    }
  }
  function Fn(e, t, a, l, i, s) {
    return e === null || e.nativeEvent !== s ? (e = {
      blockedOn: t,
      domEventName: a,
      eventSystemFlags: l,
      nativeEvent: s,
      targetContainers: [i]
    }, t !== null && (t = bl(t), t !== null && If(t)), e) : (e.eventSystemFlags |= l, t = e.targetContainers, i !== null && t.indexOf(i) === -1 && t.push(i), e);
  }
  function Ah(e, t, a, l, i) {
    switch (t) {
      case "focusin":
        return Ga = Fn(Ga, e, t, a, l, i), !0;
      case "dragenter":
        return Ya = Fn(Ya, e, t, a, l, i), !0;
      case "mouseover":
        return Va = Fn(Va, e, t, a, l, i), !0;
      case "pointerover":
        var s = i.pointerId;
        return $n.set(s, Fn($n.get(s) || null, e, t, a, l, i)), !0;
      case "gotpointercapture":
        return s = i.pointerId, Wn.set(s, Fn(Wn.get(s) || null, e, t, a, l, i)), !0;
    }
    return !1;
  }
  function Pf(e) {
    var t = vl(e.target);
    if (t !== null) {
      var a = y(t);
      if (a !== null) {
        if (t = a.tag, t === 13) {
          if (t = L(a), t !== null) {
            e.blockedOn = t, xo(e.priority, function() {
              $f(a);
            });
            return;
          }
        } else if (t === 31) {
          if (t = T(a), t !== null) {
            e.blockedOn = t, xo(e.priority, function() {
              $f(a);
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
  function xs(e) {
    if (e.blockedOn !== null) return !1;
    for (var t = e.targetContainers; 0 < t.length; ) {
      var a = Mr(e.nativeEvent);
      if (a === null) {
        a = e.nativeEvent;
        var l = new a.constructor(a.type, a);
        Us = l, a.target.dispatchEvent(l), Us = null;
      } else return t = bl(a), t !== null && If(t), e.blockedOn = a, !1;
      t.shift();
    }
    return !0;
  }
  function ep(e, t, a) {
    xs(e) && a.delete(t);
  }
  function kh() {
    Ur = !1, Ga !== null && xs(Ga) && (Ga = null), Ya !== null && xs(Ya) && (Ya = null), Va !== null && xs(Va) && (Va = null), $n.forEach(ep), Wn.forEach(ep);
  }
  function gs(e, t) {
    e.blockedOn === t && (e.blockedOn = null, Ur || (Ur = !0, m.unstable_scheduleCallback(m.unstable_NormalPriority, kh)));
  }
  var vs = null;
  function tp(e) {
    vs !== e && (vs = e, m.unstable_scheduleCallback(m.unstable_NormalPriority, function() {
      vs === e && (vs = null);
      for (var t = 0; t < e.length; t += 3) {
        var a = e[t], l = e[t + 1], i = e[t + 2];
        if (typeof l != "function") {
          if (Dr(l || a) === null) continue;
          break;
        }
        var s = bl(a);
        s !== null && (e.splice(t, 3), t -= 3, Dc(s, {
          pending: !0,
          data: i,
          method: a.method,
          action: l
        }, l, i));
      }
    }));
  }
  function en(e) {
    function t(f) {
      return gs(f, e);
    }
    Ga !== null && gs(Ga, e), Ya !== null && gs(Ya, e), Va !== null && gs(Va, e), $n.forEach(t), Wn.forEach(t);
    for (var a = 0; a < Xa.length; a++) {
      var l = Xa[a];
      l.blockedOn === e && (l.blockedOn = null);
    }
    for (; 0 < Xa.length && (a = Xa[0], a.blockedOn === null); ) Pf(a), a.blockedOn === null && Xa.shift();
    if (a = (e.ownerDocument || e).$$reactFormReplay, a != null) for (l = 0; l < a.length; l += 3) {
      var i = a[l], s = a[l + 1], c = i[yt] || null;
      if (typeof s == "function") c || tp(a);
      else if (c) {
        var o = null;
        if (s && s.hasAttribute("formAction")) {
          if (i = s, c = s[yt] || null) o = c.formAction;
          else if (Dr(i) !== null) continue;
        } else o = c.action;
        typeof o == "function" ? a[l + 1] = o : (a.splice(l, 3), l -= 3), tp(a);
      }
    }
  }
  function Ch() {
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
      i !== null && (i(), i = null), l || setTimeout(a, 20);
    }
    function a() {
      if (!l && !navigation.transition) {
        var s = navigation.currentEntry;
        s && s.url != null && navigation.navigate(s.url, {
          state: s.getState(),
          info: "react-transition",
          history: "replace"
        });
      }
    }
    if (typeof navigation == "object") {
      var l = !1, i = null;
      return navigation.addEventListener("navigate", e), navigation.addEventListener("navigatesuccess", t), navigation.addEventListener("navigateerror", t), setTimeout(a, 100), function() {
        l = !0, navigation.removeEventListener("navigate", e), navigation.removeEventListener("navigatesuccess", t), navigation.removeEventListener("navigateerror", t), i !== null && (i(), i = null);
      };
    }
  }
  function Rr(e) {
    this._internalRoot = e;
  }
  qr.prototype.render = Rr.prototype.render = function(e) {
    var t = this._internalRoot;
    if (t === null) throw Error(d(409));
    var a = t.current;
    Kf(a, Xt(), e, t, null, null);
  }, qr.prototype.unmount = Rr.prototype.unmount = function() {
    var e = this._internalRoot;
    if (e !== null) {
      this._internalRoot = null;
      var t = e.containerInfo;
      Kf(e.current, 2, null, e, null, null), Pi(), t[on] = null;
    }
  };
  function qr(e) {
    this._internalRoot = e;
  }
  qr.prototype.unstable_scheduleHydration = function(e) {
    if (e) {
      var t = mo();
      e = {
        blockedOn: null,
        target: e,
        priority: t
      };
      for (var a = 0; a < Xa.length && t !== 0 && t < Xa[a].priority; a++) ;
      Xa.splice(a, 0, e), a === 0 && Pf(e);
    }
  };
  var ap = C.version;
  if (ap !== "19.2.6") throw Error(d(527, ap, "19.2.6"));
  Y.findDOMNode = function(e) {
    var t = e._reactInternals;
    if (t === void 0)
      throw typeof e.render == "function" ? Error(d(188)) : (e = Object.keys(e).join(","), Error(d(268, e)));
    return e = z(t), e = e !== null ? K(e) : null, e = e === null ? null : e.stateNode, e;
  };
  var Oh = {
    bundleType: 0,
    version: "19.2.6",
    rendererPackageName: "react-dom",
    currentDispatcherRef: R,
    reconcilerVersion: "19.2.6"
  };
  if (typeof __REACT_DEVTOOLS_GLOBAL_HOOK__ < "u") {
    var bs = __REACT_DEVTOOLS_GLOBAL_HOOK__;
    if (!bs.isDisabled && bs.supportsFiber) try {
      Fe = bs.inject(Oh), Ye = bs;
    } catch {
    }
  }
  r.createRoot = function(e, t) {
    if (!M(e)) throw Error(d(299));
    var a = !1, l = "", i = E0, s = T0, c = A0;
    return t != null && (t.unstable_strictMode === !0 && (a = !0), t.identifierPrefix !== void 0 && (l = t.identifierPrefix), t.onUncaughtError !== void 0 && (i = t.onUncaughtError), t.onCaughtError !== void 0 && (s = t.onCaughtError), t.onRecoverableError !== void 0 && (c = t.onRecoverableError)), t = Nh(e, 1, !1, null, null, a, l, null, i, s, c, Ch), e[on] = t.current, zf(e), new Rr(t);
  };
})), Bh = /* @__PURE__ */ la(((r, m) => {
  function C() {
    if (!(typeof __REACT_DEVTOOLS_GLOBAL_HOOK__ > "u" || typeof __REACT_DEVTOOLS_GLOBAL_HOOK__.checkDCE != "function"))
      try {
        __REACT_DEVTOOLS_GLOBAL_HOOK__.checkDCE(C);
      } catch (p) {
        console.error(p);
      }
  }
  C(), m.exports = Lh();
})), vp = (...r) => r.filter((m, C, p) => !!m && m.trim() !== "" && p.indexOf(m) === C).join(" ").trim(), Gh = (r) => r.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase(), Yh = (r) => r.replace(/^([A-Z])|[\s-_]+(\w)/g, (m, C, p) => p ? p.toUpperCase() : C.toLowerCase()), lp = (r) => {
  const m = Yh(r);
  return m.charAt(0).toUpperCase() + m.slice(1);
}, Hr = {
  xmlns: "http://www.w3.org/2000/svg",
  width: 24,
  height: 24,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round",
  strokeLinejoin: "round"
}, Vh = (r) => {
  for (const m in r) if (m.startsWith("aria-") || m === "role" || m === "title") return !0;
  return !1;
}, A = no(), Xh = (0, A.createContext)({}), Qh = () => (0, A.useContext)(Xh), Zh = (0, A.forwardRef)(({ color: r, size: m, strokeWidth: C, absoluteStrokeWidth: p, className: d = "", children: M, iconNode: y, ...L }, T) => {
  const { size: k = 24, strokeWidth: z = 2, absoluteStrokeWidth: K = !1, color: U = "currentColor", className: ie = "" } = Qh() ?? {}, fe = p ?? K ? Number(C ?? z) * 24 / Number(m ?? k) : C ?? z;
  return (0, A.createElement)("svg", {
    ref: T,
    ...Hr,
    width: m ?? k ?? Hr.width,
    height: m ?? k ?? Hr.height,
    stroke: r ?? U,
    strokeWidth: fe,
    className: vp("lucide", ie, d),
    ...!M && !Vh(L) && { "aria-hidden": "true" },
    ...L
  }, [...y.map(([J, I]) => (0, A.createElement)(J, I)), ...Array.isArray(M) ? M : [M]]);
}), Ue = (r, m) => {
  const C = (0, A.forwardRef)(({ className: p, ...d }, M) => (0, A.createElement)(Zh, {
    ref: M,
    iconNode: m,
    className: vp(`lucide-${Gh(lp(r))}`, `lucide-${r}`, p),
    ...d
  }));
  return C.displayName = lp(r), C;
}, Kh = [
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
], bp = Ue("archive", Kh), Jh = [["path", {
  d: "m12 19-7-7 7-7",
  key: "1l729n"
}], ["path", {
  d: "M19 12H5",
  key: "x3x0zl"
}]], np = Ue("arrow-left", Jh), Ih = [["path", {
  d: "M5 12h14",
  key: "1ays0h"
}], ["path", {
  d: "m12 5 7 7-7 7",
  key: "xquz4c"
}]], an = Ue("arrow-right", Ih), $h = [["path", {
  d: "M7 7h10v10",
  key: "1tivn9"
}], ["path", {
  d: "M7 17 17 7",
  key: "1vkiza"
}]], Wh = Ue("arrow-up-right", $h), Fh = [
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
], eo = Ue("box", Fh), Ph = [["path", {
  d: "M20 6 9 17l-5-5",
  key: "1gmf2c"
}]], js = Ue("check", Ph), em = [["path", {
  d: "m9 18 6-6-6-6",
  key: "mthhwq"
}]], ip = Ue("chevron-right", em), tm = [
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
], ln = Ue("circle-alert", tm), am = [["circle", {
  cx: "12",
  cy: "12",
  r: "10",
  key: "1mglay"
}], ["path", {
  d: "m9 12 2 2 4-4",
  key: "dzmm74"
}]], lm = Ue("circle-check", am), nm = [
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
], nn = Ue("clapperboard", nm), im = [["circle", {
  cx: "12",
  cy: "12",
  r: "10",
  key: "1mglay"
}], ["path", {
  d: "M12 6v6h4",
  key: "135r8i"
}]], jp = Ue("clock-3", im), sm = [
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
], cm = Ue("code-xml", sm), rm = [["rect", {
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
}]], yp = Ue("copy", rm), om = [
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
], io = Ue("download", om), dm = [
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
], ml = Ue("file-check-corner", dm), um = [
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
], Lr = Ue("film", um), fm = [["path", {
  d: "m6 14 1.5-2.9A2 2 0 0 1 9.24 10H20a2 2 0 0 1 1.94 2.5l-1.54 6a2 2 0 0 1-1.95 1.5H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h3.9a2 2 0 0 1 1.69.9l.81 1.2a2 2 0 0 0 1.67.9H18a2 2 0 0 1 2 2v2",
  key: "usdka0"
}]], Br = Ue("folder-open", fm), pm = [
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
], Pn = Ue("git-branch", pm), hm = [
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
], mm = Ue("layers", hm), xm = [
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
], sp = Ue("layout-grid", xm), gm = [
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
], so = Ue("link-2", gm), vm = [
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
], bm = Ue("list-checks", vm), jm = [["path", {
  d: "M21 12a9 9 0 1 1-6.219-8.56",
  key: "13zald"
}]], Gr = Ue("loader-circle", jm), ym = [
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
], to = Ue("lock-keyhole", ym), Sm = [["path", {
  d: "M22 17a2 2 0 0 1-2 2H6.828a2 2 0 0 0-1.414.586l-2.202 2.202A.71.71 0 0 1 2 21.286V5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2z",
  key: "18887p"
}]], Yr = Ue("message-square", Sm), zm = [["path", {
  d: "M5 12h14",
  key: "1ays0h"
}], ["path", {
  d: "M12 5v14",
  key: "s699le"
}]], aa = Ue("plus", zm), Nm = [
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
], co = Ue("refresh-cw", Nm), _m = [["path", {
  d: "M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8",
  key: "1357e3"
}], ["path", {
  d: "M3 3v5h5",
  key: "1xhq8a"
}]], wm = Ue("rotate-ccw", _m), Em = [["path", {
  d: "m21 21-4.34-4.34",
  key: "14j7rj"
}], ["circle", {
  cx: "11",
  cy: "11",
  r: "8",
  key: "4ej97u"
}]], Sp = Ue("search", Em), Tm = [["path", {
  d: "M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z",
  key: "oel41y"
}], ["path", {
  d: "m9 12 2 2 4-4",
  key: "dzmm74"
}]], sn = Ue("shield-check", Tm), Am = [["path", {
  d: "M18 6 6 18",
  key: "1bl5f8"
}], ["path", {
  d: "m6 6 12 12",
  key: "d8bk6v"
}]], Ss = Ue("x", Am), km = Bh(), za = [
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
], Cm = class extends Error {
  constructor(r, m = 400) {
    super(r), this.status = m;
  }
}, cp = (r, m = 400) => {
  throw new Cm(r, m);
};
function _s(r) {
  return r.modelFlow ?? {
    models: [],
    issues: [],
    packs: [],
    pins: [],
    history: []
  };
}
function Om(r, m, C) {
  const p = _s(r).models.find((M) => M.id === m || M.key === m);
  p || cp("找不到模型");
  const d = p.versions.find((M) => M.id === C);
  return d || cp("找不到指定模型版本"), {
    m: p,
    v: d
  };
}
function Mm(r, m, C, p) {
  const { v: d } = Om(r, m, C), M = d.stages[p], y = za.findIndex((T) => T.id === p), L = [];
  return y > 0 && !d.stages[za[y - 1].id].author && L.push("先核定 " + za[y - 1].title), M.checks.every(Boolean) || L.push("完成本階段全部檢查"), M.evidence || L.push("填入實際產出或檢查報告位置"), (!M.summary || !M.nextStep) && L.push("填寫已做內容與接手下一步"), p === "M01" && (!d.sourceLocation || !d.sourceVersion || !d.backupLocation || !d.sha256) && L.push("補齊原檔版本、獨立備份與 SHA-256"), p === "M02" && !d.reference && L.push("補入設定及尺度來源"), y >= 3 && !d.candidateLocation && L.push("登記獨立候選 GLB"), _s(r).issues.some((T) => T.modelId === m && T.versionId === C && T.status === "open" && (T.stageId === p || y >= 6 || T.kind === "major" && y >= 3)) && L.push("處理適用的待修或待裁定問題"), L;
}
var Dm = [
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
], Um = [
  "唯一音軌",
  "音樂分析",
  "段落與節點",
  "鏡頭安排",
  "影格與動畫",
  "對音樂試剪",
  "支線驗收",
  "插入全片"
], Rm = [
  ["已指定唯一使用音軌與版本；換音軌需重核切點"],
  ["已實際分析音樂、歌詞與節奏"],
  ["段落與重要音樂節點已標記"],
  ["鏡頭與音樂、主題、劇透範圍相符"],
  ["人物與主線一致，影格及動畫已驗收"],
  ["已按指定音軌核對切點與實際長度"],
  ["無不必要重複鏡頭，劇透範圍及情緒合適"],
  ["通過支線已插入剪輯專案，入點與出點可查"]
], Kt = [...Dm.map((r) => ({
  ...r,
  group: "main"
})), ...["op", "ed"].flatMap((r) => Um.map((m, C) => ({
  id: r + String(C + 1).padStart(2, "0"),
  title: m,
  group: r,
  phase: r.toUpperCase() + " 支線",
  description: r === "op" ? "OP 以作品印象、人物關係及主題為主。" : "ED 以情緒收束及畫面變化為主。",
  output: m === "唯一音軌" ? "由作者在有效資料中指定音軌、版本與長度" : m,
  checks: Rm[C],
  deps: C ? [r + String(C).padStart(2, "0")] : ["03"]
})))], qm = [
  "script",
  "character",
  "scene",
  "voice",
  "op_audio",
  "ed_audio",
  "edit"
];
function cn(r) {
  return [...new Map(r.map((m) => [m.key, m])).values()];
}
function Za(r) {
  return cn(r.filter((m) => m.status === "adopted" || m.status === "withdrawn")).filter((m) => m.status === "adopted");
}
function Hm(r) {
  return {
    projectId: r.id,
    workId: r.workId,
    episode: r.episode,
    revision: r.revision,
    workflowSchema: r.workflowSchema ?? 1,
    genericChecks: ws(r).map(({ id: m, title: C, checks: p }) => ({
      id: m,
      title: C,
      checks: p
    })),
    rules: cn(r.episodeRules ?? []),
    adoptedRules: Za(r.episodeRules ?? []),
    baselines: cn(r.baselines ?? []),
    adoptedBaselines: Za(r.baselines ?? []),
    legacy: r.workflowLegacy ?? null,
    rule: "通用流程不含單集劇情條件。本集規則與採用清單各自保存版本，候選不取代已採用版，另一集須另行指定；檔案位置未驗看。"
  };
}
function Lm(r) {
  return {
    id: r.id,
    title: r.title,
    revision: r.revision,
    updatedAt: r.updatedAt,
    sharedCount: new Set(r.sharedAssets.map((m) => m.key)).size
  };
}
var zp = class extends Error {
  constructor(r, m = 400) {
    super(r), this.status = m;
  }
};
function ws(r) {
  return Kt.filter((m) => m.group === "main" || r.branches[m.group]);
}
function zs(r, m) {
  const C = Kt.find((p) => p.id === m);
  if (!C) throw new zp("找不到階段");
  return C.deps.filter((p) => ws(r).some((d) => d.id === p) && !r.stages[p].author).map((p) => `${p} ${Kt.find((d) => d.id === p)?.title}`);
}
function Np(r, m) {
  const C = r.stages[m], p = zs(r, m).map((M) => "先完成 " + M), d = Kt.find((M) => M.id === m).checks.length;
  return (C.checks.length < d || !C.checks.slice(0, d).every(Boolean)) && p.push("勾選全部驗收項目"), C.evidence.trim() || p.push("填入產出連結或檔案位置"), r.issues.some((M) => M.status === "open" && M.stageId === m) && p.push("處理此階段未結問題"), xl(r).problems.some((M) => M.status === "open" && (M.scope.type === "project" || M.scope.type === "stage" && M.scope.target === m || m === "12")) && p.push("處理適用範圍內的資訊矛盾或缺件"), m === "12" && (r.issues.some((M) => M.status === "open") && p.push("結清全部退修問題"), r.shots.some((M) => M.status !== "in_timeline") && p.push("總表中所有鏡頭須通過並入片"), r.shots.length || p.push("建立實際採用鏡頭與入片紀錄")), p;
}
function ao(r) {
  const m = ws(r);
  return {
    id: r.id,
    workId: r.workId ?? "",
    title: r.title,
    episode: r.episode,
    revision: r.revision,
    archived: r.archived,
    updatedAt: r.updatedAt,
    completionReport: r.production?.completionReports?.at(-1) ?? null,
    approved: m.filter((C) => r.stages[C.id].author).length,
    total: m.length,
    openIssues: r.issues.filter((C) => C.status === "open").length,
    shots: r.shots.length,
    inTimeline: r.shots.filter((C) => C.status === "in_timeline").length,
    lastMcpAt: r.lastMcpAt,
    next: m.filter((C) => !r.stages[C.id].author && !zs(r, C.id).length).map((C) => ({
      id: C.id,
      title: C.title,
      reasons: Np(r, C.id)
    }))
  };
}
function ro(r) {
  const m = xl(r), C = [...new Map((r.production?.links ?? []).map((d) => [d.shotId, d])).values()], p = [...new Map((r.production?.selections ?? []).map((d) => [d.shotId, d])).values()];
  return {
    project: ao(r),
    settings: {
      rules: Za(r.episodeRules ?? []).length,
      adopted: Za(r.baselines ?? []).map(({ key: d, title: M, category: y, version: L, recordVersion: T, externalVersion: k }) => ({
        key: d,
        title: M,
        category: y,
        version: L,
        recordVersion: T,
        externalVersion: k
      })),
      pending: cn(r.baselines ?? []).filter((d) => d.status === "unresolved" || d.status === "reference").map(({ key: d, title: M, status: y, note: L }) => ({
        key: d,
        title: M,
        status: y,
        note: L
      }))
    },
    registration: {
      sources: m.records.length,
      acceptedSources: m.records.filter(ai).length,
      shots: r.shots.length,
      linkedShots: C.length,
      locatedFrames: C.filter((d) => d.references.length).length,
      registeredSelections: (/* @__PURE__ */ new Set([...p.map((d) => d.shotId), ...C.filter((d) => d.adoptedOutput).map((d) => d.shotId)])).size,
      timelineRegistrations: p.filter((d) => d.editorVersion && d.inPoint && d.outPoint).length
    },
    outgoing: r.production?.handoffs?.at(-1) ?? null,
    openProblems: m.problems.filter((d) => d.status === "open"),
    lastWork: m.results.at(-1) ?? null,
    rule: "作者告知的製作完成、資料補登與素材實際檢視分開記錄。未登記的素材不推定未製作；接續整理保留來源，未對上成片的情節不得自動套用下一集。"
  };
}
var ei = {
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
}, Bm = [
  "rule",
  "script",
  "character",
  "scene",
  "audio",
  "reference"
];
function xl(r) {
  return r.knowledge ?? {
    records: [],
    problems: [],
    packs: [],
    results: []
  };
}
function ai(r) {
  return r.approval?.verdict === "source_accepted" || r.status === "effective";
}
function Vr(r, m) {
  return (r.production?.sections.find((C) => C.stageId === m)?.gaps ?? []).map((C, p) => {
    const d = [...r.production?.supplements ?? []].reverse().find((M) => M.stageId === m && M.gapIndex === p && M.gap === C);
    return {
      index: p,
      description: C,
      status: d ? "filled" : "open",
      record: d ? xl(r).records.find((M) => M.id === d.recordId) ?? null : null
    };
  });
}
function Gm(r, m) {
  if (r.workId && (!m || m.id !== r.workId) || m && m.id !== r.workId) throw new zp("集數與作品不相符", 400);
  const C = ro(r), p = m ? _s(m) : null, d = (p?.models ?? []).map((y) => {
    const L = y.versions.at(-1), T = [...p?.history ?? []].reverse().find((K) => K.modelId === y.id && K.versionId === L.id && K.action === "save_model_stage"), k = za.find((K) => !L.stages[K.id].author) ?? za[7], z = y.versions.find((K) => K.id === y.adoptedVersionId);
    return {
      modelId: y.id,
      key: y.key,
      title: y.title,
      versionId: L.id,
      label: L.label,
      adopted: z ? {
        versionId: z.id,
        label: z.label
      } : null,
      sourceLocation: L.sourceLocation,
      candidateLocation: L.candidateLocation,
      stageId: k.id,
      stageTitle: k.title,
      approved: za.filter((K) => L.stages[K.id].author).length,
      lastWork: T ? {
        at: T.at,
        stageId: T.stageId,
        summary: L.stages[T.stageId].summary,
        evidence: L.stages[T.stageId].evidence,
        nextStep: L.stages[T.stageId].nextStep
      } : null,
      openIssues: p.issues.filter((K) => K.modelId === y.id && K.versionId === L.id && K.status === "open"),
      nextStep: T ? L.stages[T.stageId].nextStep : "尚無工作回報；先讀取模型來源與指定版本，再取得任務資料包。"
    };
  }), M = [...new Map((p?.pins ?? []).filter((y) => y.episodeId === r.id).map((y) => [[y.modelId, y.sceneIds].join("|"), y])).values()].map((y) => {
    const L = p.models.find((k) => k.id === y.modelId), T = L?.versions.find((k) => k.id === y.versionId);
    return {
      ...y,
      title: L?.title ?? y.modelId,
      label: T?.label ?? y.versionId
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
    episode: C,
    models: d,
    pins: M,
    issues: {
      animation: r.issues.filter((y) => y.status === "open"),
      context: C.openProblems,
      models: p?.issues.filter((y) => y.status === "open") ?? []
    },
    lastToolWrite: [r.lastMcpAt, ...(p?.history ?? []).filter((y) => y.actor === "ai").map((y) => y.at)].filter((y) => !!y).sort().at(-1) ?? null,
    policy: "此總覽唯讀，不是工作資料包。動畫與模型共用作品入口，各自保留精確版本與資料包。模型清單顯示最新登記候選，採用版及本集引用另列，禁止自動替換。作者告知完成不等於逐項素材驗看；未登記不推定未製作。執行前取得對應範圍的新資料包，實際讀取來源後才回報；不得代替作者核定。"
  };
}
var Ym = /* @__PURE__ */ la(((r) => {
  var m = /* @__PURE__ */ Symbol.for("react.transitional.element"), C = /* @__PURE__ */ Symbol.for("react.fragment");
  function p(d, M, y) {
    var L = null;
    if (y !== void 0 && (L = "" + y), M.key !== void 0 && (L = "" + M.key), "key" in M) {
      y = {};
      for (var T in M) T !== "key" && (y[T] = M[T]);
    } else y = M;
    return M = y.ref, {
      $$typeof: m,
      type: d,
      key: L,
      ref: M !== void 0 ? M : null,
      props: y
    };
  }
  r.Fragment = C, r.jsx = p, r.jsxs = p;
})), Vm = /* @__PURE__ */ la(((r, m) => {
  m.exports = Ym();
})), n = Vm(), rp = (r) => r ? new Date(r).toLocaleString("zh-TW", { timeZone: "Asia/Taipei" }) : "尚無紀錄";
function Xm(r, m) {
  const C = URL.createObjectURL(new Blob([m], { type: "text/plain;charset=utf-8" })), p = document.createElement("a");
  p.href = C, p.download = r, p.click(), setTimeout(() => URL.revokeObjectURL(C), 1e3);
}
function Qm({ project: r, work: m, busy: C, onNavigate: p, onModel: d }) {
  const M = Gm(r, m), [y, L] = (0, A.useState)(""), [T, k] = (0, A.useState)(""), [z, K] = (0, A.useState)("animation"), U = M.models.find((G) => G.versionId === z), ie = M.episode.lastWork, fe = M.issues.animation.length + M.issues.context.length + M.issues.models.length, J = `請使用「立之雲端庫｜動畫製作流程」工具，接手 ${M.title}／${r.episode}。先呼叫 read_animation_workspace({projectId:${JSON.stringify(r.id)}})，重新讀取伺服器最新資料，不使用本段文字中的舊 revision。
${U ? `本次範圍為模型 ${U.key}（modelId=${U.modelId}），精確版本 ${U.label}（versionId=${U.versionId}），定位階段 ${U.stageId}。workId=${m.id}。用 read_animation_models 查此版本的全部來源、問題及最近回報，確認實際任務範圍後，用 acquire_animation_model_context 取得新資料包；完成後用 update_animation_model_stage 回報。最新候選不等於已採用版。` : `本次範圍為 ${r.episode} 動畫。先讀 read_animation_episode_brief 與 read_animation_episode_settings，再依最近交接確認任務。用 preview_animation_context 檢查指定範圍，acquire_animation_context 保存資料包，以 submit_animation_work 回報。作者已告知完成的集數以資料補登為主，不因紀錄空白重做。`}
實際讀取所需素材後才執行，缺件、矛盾或過期資料包先回報受阻。寫回已做內容、產出位置與版本、未解問題及下一步。保留原檔、作者採用版本與各集固定引用，不能自行正式核定。若目前對話沒有上述工具，明確告知尚未接通，不宣稱已讀取或已回寫。`, [I, oe] = (0, A.useState)(!1), Q = M.episode.project.completionReport?.status === "completed", de = [
    ...M.issues.context.map((G) => ({
      id: G.id,
      text: G.description,
      tab: "context"
    })),
    ...M.issues.animation.map((G) => ({
      id: G.id,
      text: G.reason,
      tab: "issues"
    })),
    ...M.issues.models.map((G) => ({
      id: G.id,
      text: G.reason,
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
          /* @__PURE__ */ (0, n.jsx)("h2", { children: Q ? "本集已完成，繼續整理製作紀錄" : ie ? "接著完成上次的工作" : "從本集製作資料開始" }),
          /* @__PURE__ */ (0, n.jsx)("p", { children: ie?.nextStep || (Q ? "補上採用檔案與製作過程，讓下一集和下一位 AI 都能接著用。" : "先整理劇本、角色與場景參考，再開始製作。") }),
          /* @__PURE__ */ (0, n.jsxs)("div", {
            className: "context-actions",
            children: [/* @__PURE__ */ (0, n.jsxs)("button", {
              className: "btn primary",
              disabled: C,
              onClick: () => p("context"),
              children: [
                Q ? "繼續整理資料" : "開啟製作資料",
                " ",
                /* @__PURE__ */ (0, n.jsx)(an, { size: 16 })
              ]
            }), /* @__PURE__ */ (0, n.jsx)("button", {
              className: "btn",
              onClick: () => oe(!I),
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
            /* @__PURE__ */ (0, n.jsx)("strong", { children: Q ? "已完成" : M.episode.project.completionReport?.status === "in_progress" ? "製作中" : "尚未登記" }),
            /* @__PURE__ */ (0, n.jsx)("small", { children: "依作者登記" })
          ] }),
          /* @__PURE__ */ (0, n.jsxs)("div", { children: [
            /* @__PURE__ */ (0, n.jsx)("span", { children: "未處理問題" }),
            /* @__PURE__ */ (0, n.jsxs)("strong", { children: [fe, /* @__PURE__ */ (0, n.jsx)("em", { children: " 項" })] }),
            /* @__PURE__ */ (0, n.jsx)("small", { children: "動畫、資料與模型合計" })
          ] }),
          /* @__PURE__ */ (0, n.jsxs)("button", {
            onClick: () => p("models"),
            children: [
              /* @__PURE__ */ (0, n.jsx)("span", { children: "共用模型" }),
              /* @__PURE__ */ (0, n.jsxs)("strong", { children: [M.models.length, /* @__PURE__ */ (0, n.jsx)("em", { children: " 個" })] }),
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
              onClick: () => oe(!1),
              children: "收起"
            })]
          }),
          /* @__PURE__ */ (0, n.jsx)("p", { children: "在已連接工作台的對話貼上指令，AI 會先讀取最新進度。" }),
          /* @__PURE__ */ (0, n.jsxs)("label", {
            className: "form-field",
            children: ["要接手的工作", /* @__PURE__ */ (0, n.jsxs)("select", {
              value: z,
              onChange: (G) => K(G.target.value),
              children: [/* @__PURE__ */ (0, n.jsxs)("option", {
                value: "animation",
                children: [r.episode, " 動畫與資料整理"]
              }), M.models.map((G) => /* @__PURE__ */ (0, n.jsxs)("option", {
                value: G.versionId,
                children: [
                  G.title,
                  " · ",
                  G.label
                ]
              }, G.versionId))]
            })]
          }),
          /* @__PURE__ */ (0, n.jsxs)("div", {
            className: "context-actions",
            children: [/* @__PURE__ */ (0, n.jsxs)("button", {
              className: "btn primary",
              onClick: async () => {
                try {
                  await navigator.clipboard.writeText(J), L("已複製，請貼到已連接工作台的 ChatGPT 對話。");
                } catch {
                  L("無法直接複製，請展開完整指令後手動複製。");
                }
              },
              children: [/* @__PURE__ */ (0, n.jsx)(yp, { size: 15 }), "複製接手指令"]
            }), /* @__PURE__ */ (0, n.jsx)("button", {
              className: "btn",
              onClick: () => p("chatgpt"),
              children: "查看連接方式"
            })]
          }),
          /* @__PURE__ */ (0, n.jsx)("p", {
            role: "status",
            children: y
          }),
          /* @__PURE__ */ (0, n.jsxs)("details", { children: [
            /* @__PURE__ */ (0, n.jsx)("summary", { children: "完整指令與下載" }),
            /* @__PURE__ */ (0, n.jsx)("textarea", {
              readOnly: !0,
              "aria-label": "AI 接手指令",
              rows: 8,
              value: J
            }),
            /* @__PURE__ */ (0, n.jsxs)("button", {
              className: "btn",
              onClick: () => Xm(r.episode + "_AI接續指令.txt", J),
              children: [/* @__PURE__ */ (0, n.jsx)(io, { size: 15 }), "下載指令"]
            })
          ] }),
          /* @__PURE__ */ (0, n.jsxs)("small", { children: [
            "複製指令不會自動啟動 AI。最近寫入：",
            rp(M.lastToolWrite),
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
                onClick: () => p("main"),
                children: [
                  /* @__PURE__ */ (0, n.jsx)(ml, { size: 22 }),
                  /* @__PURE__ */ (0, n.jsxs)("span", { children: [/* @__PURE__ */ (0, n.jsx)("b", { children: "動畫製作" }), /* @__PURE__ */ (0, n.jsx)("small", { children: "主線、片頭片尾與鏡頭素材" })] }),
                  /* @__PURE__ */ (0, n.jsx)(an, { size: 17 })
                ]
              }),
              /* @__PURE__ */ (0, n.jsxs)("button", {
                onClick: () => p("models"),
                children: [
                  /* @__PURE__ */ (0, n.jsx)(eo, { size: 22 }),
                  /* @__PURE__ */ (0, n.jsxs)("span", { children: [/* @__PURE__ */ (0, n.jsx)("b", { children: "3D 模型" }), /* @__PURE__ */ (0, n.jsx)("small", { children: "模型版本、檢查與採用紀錄" })] }),
                  /* @__PURE__ */ (0, n.jsx)(an, { size: 17 })
                ]
              }),
              /* @__PURE__ */ (0, n.jsxs)("button", {
                onClick: () => p("project"),
                children: [
                  /* @__PURE__ */ (0, n.jsx)(jp, { size: 22 }),
                  /* @__PURE__ */ (0, n.jsxs)("span", { children: [/* @__PURE__ */ (0, n.jsx)("b", { children: "作品與後續集數" }), /* @__PURE__ */ (0, n.jsx)("small", { children: "管理集數與共用參考資料" })] }),
                  /* @__PURE__ */ (0, n.jsx)(an, { size: 17 })
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
              children: [fe, " 項"]
            })]
          }), de.length ? /* @__PURE__ */ (0, n.jsxs)("div", {
            className: "attention-list",
            children: [de.slice(0, 3).map((G) => /* @__PURE__ */ (0, n.jsxs)("button", {
              onClick: () => p(G.tab),
              children: [
                /* @__PURE__ */ (0, n.jsx)(ln, { size: 17 }),
                /* @__PURE__ */ (0, n.jsx)("span", { children: G.text }),
                /* @__PURE__ */ (0, n.jsx)(an, { size: 15 })
              ]
            }, G.id)), de.length > 3 && /* @__PURE__ */ (0, n.jsxs)("details", { children: [/* @__PURE__ */ (0, n.jsxs)("summary", { children: [
              "其餘 ",
              de.length - 3,
              " 項問題"
            ] }), de.slice(3).map((G) => /* @__PURE__ */ (0, n.jsx)("button", {
              onClick: () => p(G.tab),
              children: G.text
            }, G.id))] })]
          }) : /* @__PURE__ */ (0, n.jsxs)("div", {
            className: "quiet-state",
            children: [
              /* @__PURE__ */ (0, n.jsx)(ml, { size: 28 }),
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
          ie ? /* @__PURE__ */ (0, n.jsxs)(n.Fragment, { children: [
            /* @__PURE__ */ (0, n.jsx)("h3", { children: ie.task }),
            /* @__PURE__ */ (0, n.jsx)("p", { children: ie.summary }),
            ie.needsReview && /* @__PURE__ */ (0, n.jsx)("p", {
              className: "resume-warning",
              children: "採用依據有更新，接手前請重新讀取。"
            }),
            /* @__PURE__ */ (0, n.jsx)("small", { children: rp(ie.at) })
          ] }) : /* @__PURE__ */ (0, n.jsx)("p", { children: "尚無 AI 工作回報；這不代表沒有製作成果。" }),
          M.models.map((G) => /* @__PURE__ */ (0, n.jsxs)("div", {
            className: "home-model-row",
            children: [/* @__PURE__ */ (0, n.jsxs)("div", { children: [
              /* @__PURE__ */ (0, n.jsx)("b", { children: G.title }),
              /* @__PURE__ */ (0, n.jsxs)("p", { children: [
                "目前候選 ",
                G.label,
                " · 採用 ",
                G.adopted?.label ?? "尚未登記"
              ] }),
              /* @__PURE__ */ (0, n.jsx)("small", { children: G.nextStep })
            ] }), /* @__PURE__ */ (0, n.jsx)("button", {
              className: "btn",
              disabled: C,
              onClick: () => d({
                modelId: G.modelId,
                versionId: G.versionId,
                stageId: G.stageId
              }),
              children: "開啟版本"
            })]
          }, G.modelId)),
          /* @__PURE__ */ (0, n.jsxs)("details", { children: [
            /* @__PURE__ */ (0, n.jsxs)("summary", { children: [
              "本集固定模型引用（",
              M.pins.length,
              "）"
            ] }),
            M.pins.map((G, W) => /* @__PURE__ */ (0, n.jsxs)("p", { children: [
              G.title,
              " · ",
              G.label,
              " · ",
              G.purpose
            ] }, W)),
            /* @__PURE__ */ (0, n.jsx)("button", {
              className: "btn",
              onClick: () => p("settings"),
              children: "查看採用設定"
            })
          ] }),
          /* @__PURE__ */ (0, n.jsxs)("details", { children: [
            /* @__PURE__ */ (0, n.jsx)("summary", { children: "AI 接手識別資料" }),
            /* @__PURE__ */ (0, n.jsxs)("p", { children: ["集數 ID：", r.id] }),
            /* @__PURE__ */ (0, n.jsxs)("p", { children: ["作品 ID：", m?.id || "未歸屬"] }),
            /* @__PURE__ */ (0, n.jsxs)("p", { children: ["資料版本：", r.revision] })
          ] })
        ]
      })
    ]
  });
}
function Zm({ project: r, check: m }) {
  const [C, p] = (0, A.useState)(!1), [d, M] = (0, A.useState)(""), [y, L] = (0, A.useState)(""), T = `請使用「立之雲端庫｜動畫製作流程」外掛，先呼叫 read_animation_workspace，projectId 為 ${r.id}，確認 ${r.episode} 的目前進度、採用版本、未解問題與下一步。請重新讀取最新資料，不從聊天推定完成。若本集已由作者告知完成，先做資料補登。確認範圍後取得新的工作資料包，實際讀取參考素材，最後回報已做內容、成果位置、未完成項及下一步。若本對話沒有工具，請明確告知未連接。`;
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
              await navigator.clipboard.writeText(T), L("已複製，請貼到選用工作台的對話。");
            } catch {
              L("請展開完整指令後手動複製。");
            }
          },
          children: [/* @__PURE__ */ (0, n.jsx)(yp, { size: 16 }), "複製本集接手指令"]
        }),
        /* @__PURE__ */ (0, n.jsx)("p", {
          role: "status",
          children: y
        }),
        /* @__PURE__ */ (0, n.jsxs)("details", { children: [/* @__PURE__ */ (0, n.jsx)("summary", { children: "查看完整指令" }), /* @__PURE__ */ (0, n.jsx)("textarea", {
          "aria-label": "本集接手指令",
          readOnly: !0,
          rows: 7,
          value: T
        })] })
      ]
    }), /* @__PURE__ */ (0, n.jsxs)("article", {
      className: "wide-card",
      children: [
        /* @__PURE__ */ (0, n.jsxs)("h2", { children: [/* @__PURE__ */ (0, n.jsx)(so, { size: 20 }), " 連線與最近更新"] }),
        /* @__PURE__ */ (0, n.jsx)("p", { children: "網頁連線與對話工具是兩個檢查項目；這個按鈕會檢查網頁能否讀取共用資料。" }),
        /* @__PURE__ */ (0, n.jsxs)("button", {
          className: "btn",
          disabled: C,
          onClick: async () => {
            p(!0), M("");
            try {
              await m(), M("共用資料讀取成功。對話是否已選用外掛，仍需由 ChatGPT 實際呼叫工具確認。");
            } catch (k) {
              M("讀取失敗：" + (k instanceof Error ? k.message : String(k)));
            } finally {
              p(!1);
            }
          },
          children: [/* @__PURE__ */ (0, n.jsx)(co, {
            size: 15,
            className: C ? "spin" : ""
          }), C ? "檢查中…" : "檢查資料連線"]
        }),
        /* @__PURE__ */ (0, n.jsx)("p", {
          role: "status",
          children: d
        }),
        /* @__PURE__ */ (0, n.jsx)("div", {
          className: "connection-state",
          children: /* @__PURE__ */ (0, n.jsxs)("div", { children: [/* @__PURE__ */ (0, n.jsx)("b", { children: r.lastMcpAt ? "已有 ChatGPT 回報紀錄" : "尚無 ChatGPT 寫入紀錄" }), /* @__PURE__ */ (0, n.jsx)("small", { children: r.lastMcpAt ? new Date(r.lastMcpAt).toLocaleString("zh-TW", { timeZone: "Asia/Taipei" }) : "首次回報後會顯示時間" })] })
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
var op = {
  rule: "規則／決策",
  script: "劇本／台詞",
  character: "角色",
  scene: "場景",
  audio: "聲音",
  reference: "原作／參考"
};
function Km({ project: r, busy: m, mutate: C }) {
  const [p, d] = (0, A.useState)(""), [M, y] = (0, A.useState)(""), [L, T] = (0, A.useState)(""), [k, z] = (0, A.useState)(30), [K, U] = (0, A.useState)("main"), [ie, fe] = (0, A.useState)(null), [J, I] = (0, A.useState)(""), [oe, Q] = (0, A.useState)(""), [de, G] = (0, A.useState)({
    content: "",
    source: "",
    location: ""
  }), W = xl(r).records, P = r.production?.sections ?? [], ae = P.find((g) => g.stageId === p), ce = W.filter(ai).length, X = Vr(r, p), b = P.reduce((g, F) => g + Vr(r, F.stageId).filter((V) => V.status === "open").length, 0), le = new Set(P.flatMap((g) => g.recordKeys)), ve = W.filter((g) => (!p || ae?.recordKeys.includes(g.key) || g.scope.type === "stage" && g.scope.target === p) && (!L || g.kind === L) && (!M || [
    g.title,
    g.key,
    g.content,
    g.source,
    g.scope.target
  ].join(" ").toLowerCase().includes(M.toLowerCase()))).sort((g, F) => (g.key.startsWith("ep01_src_") ? 1 : le.has(g.key) ? 0 : 2) - (F.key.startsWith("ep01_src_") ? 1 : le.has(F.key) ? 0 : 2));
  async function Me(g) {
    if (fe(null), I(""), !!g)
      try {
        if (g.size > 15e5) throw new Error("資料包不可超過 1.5 MB");
        const F = JSON.parse(await g.text());
        if (F.schemaVersion !== 1 || F.episode !== r.episode || !Array.isArray(F.records) || !Array.isArray(F.shots) || !Array.isArray(F.sections)) throw new Error("請選擇相同集數的製作資料包");
        fe(F);
      } catch (F) {
        I(F instanceof Error ? F.message : "資料包讀取失敗");
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
          const g = URL.createObjectURL(new Blob([JSON.stringify({
            episode: r.episode,
            production: r.production,
            records: W,
            shots: r.shots
          }, null, 2)], { type: "application/json" })), F = document.createElement("a");
          F.href = g, F.download = r.episode + "_製作資料.json", F.click(), setTimeout(() => URL.revokeObjectURL(g), 1e3);
        },
        children: "匯出製作資料"
      })]
    }),
    /* @__PURE__ */ (0, n.jsxs)("div", {
      className: "production-totals",
      children: [
        /* @__PURE__ */ (0, n.jsxs)("b", { children: [W.length, " 筆資料"] }),
        /* @__PURE__ */ (0, n.jsxs)("b", { children: [r.shots.length, " 列鏡頭規劃"] }),
        /* @__PURE__ */ (0, n.jsxs)("b", { children: [P.length, " 個階段已盤點"] }),
        /* @__PURE__ */ (0, n.jsx)("span", { children: "實際缺件依下方清單，沒有以資料筆數推算完成率。" })
      ]
    }),
    /* @__PURE__ */ (0, n.jsx)("div", {
      className: "production-acceptance",
      children: r.production?.acceptance ? /* @__PURE__ */ (0, n.jsxs)(n.Fragment, { children: [
        /* @__PURE__ */ (0, n.jsx)("span", {
          className: "status passed",
          children: "現有資料已通過"
        }),
        /* @__PURE__ */ (0, n.jsxs)("b", { children: [ce, " 筆已確認收錄"] }),
        /* @__PURE__ */ (0, n.jsx)("p", { children: r.production.acceptance.note }),
        /* @__PURE__ */ (0, n.jsxs)("p", { children: [
          "補齊已開放 · ",
          b,
          " 項待補。可直接保存補充內容，不需逐筆再確認。不同來源版本保留，採用版本另行指定。"
        ] })
      ] }) : /* @__PURE__ */ (0, n.jsxs)(n.Fragment, { children: [/* @__PURE__ */ (0, n.jsx)("p", { children: "依作者確認，將已完成的資料一次通過，並開放剩餘項目直接補齊。" }), /* @__PURE__ */ (0, n.jsx)("button", {
        className: "btn primary",
        disabled: m || r.archived || !P.length,
        onClick: () => {
          C("accept_production_data", { note: "依作者2026-10-21指示：目前先不用檢核，已完成的資料直接通過；剩餘項目開放直接補齊。" });
        },
        children: "通過現有資料並開放補齊"
      })] })
    }),
    /* @__PURE__ */ (0, n.jsxs)("div", {
      className: "production-filters",
      children: [
        /* @__PURE__ */ (0, n.jsxs)("label", { children: ["搜尋實際內容", /* @__PURE__ */ (0, n.jsx)("input", {
          placeholder: "台詞、F077、G11、角色或素材名稱",
          value: M,
          onChange: (g) => {
            y(g.target.value), z(30);
          }
        })] }),
        /* @__PURE__ */ (0, n.jsxs)("label", { children: ["製作階段", /* @__PURE__ */ (0, n.jsxs)("select", {
          value: p,
          onChange: (g) => {
            d(g.target.value), z(30);
          },
          children: [/* @__PURE__ */ (0, n.jsx)("option", {
            value: "",
            children: "全部階段"
          }), Kt.map((g) => /* @__PURE__ */ (0, n.jsxs)("option", {
            value: g.id,
            children: [
              g.id,
              " ",
              g.title
            ]
          }, g.id))]
        })] }),
        /* @__PURE__ */ (0, n.jsxs)("label", { children: ["資料種類", /* @__PURE__ */ (0, n.jsxs)("select", {
          value: L,
          onChange: (g) => {
            T(g.target.value), z(30);
          },
          children: [/* @__PURE__ */ (0, n.jsx)("option", {
            value: "",
            children: "全部種類"
          }), Object.entries(op).map(([g, F]) => /* @__PURE__ */ (0, n.jsx)("option", {
            value: g,
            children: F
          }, g))]
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
      ].map(([g, F]) => /* @__PURE__ */ (0, n.jsx)("button", {
        className: K === g ? "active" : "",
        onClick: () => U(g),
        children: F
      }, g))
    }),
    /* @__PURE__ */ (0, n.jsx)("div", {
      className: "production-grid",
      children: Kt.filter((g) => g.group === K).map((g) => {
        const F = P.find((R) => R.stageId === g.id), V = Vr(r, g.id).filter((R) => R.status === "open").length;
        return /* @__PURE__ */ (0, n.jsxs)("button", {
          className: "production-stage " + (p === g.id ? "selected" : ""),
          onClick: () => {
            d(p === g.id ? "" : g.id), Q(""), z(30);
          },
          children: [
            /* @__PURE__ */ (0, n.jsx)("small", { children: g.group === "main" ? g.id : g.group.toUpperCase() + " " + g.id.slice(2) }),
            /* @__PURE__ */ (0, n.jsx)("b", { children: g.title }),
            /* @__PURE__ */ (0, n.jsx)("span", { children: F ? F.recordKeys.length + " 筆相關資料" : "尚未盤點" }),
            /* @__PURE__ */ (0, n.jsx)("em", { children: F ? V + " 項待補" : "待補資料" })
          ]
        }, g.id);
      })
    }),
    ae && /* @__PURE__ */ (0, n.jsxs)("div", {
      className: "production-gaps",
      children: [
        /* @__PURE__ */ (0, n.jsxs)("h3", { children: [Kt.find((g) => g.id === p)?.title, " · 資料盤點"] }),
        /* @__PURE__ */ (0, n.jsx)("p", { children: ae.overview }),
        /* @__PURE__ */ (0, n.jsx)("b", { children: "補齊清單" }),
        X.length ? /* @__PURE__ */ (0, n.jsx)("div", { children: X.map((g) => /* @__PURE__ */ (0, n.jsxs)("article", {
          className: "production-gap",
          children: [
            /* @__PURE__ */ (0, n.jsx)("span", {
              className: "status " + (g.status === "filled" ? "passed" : "candidate"),
              children: g.status === "filled" ? "已補資料" : r.production?.supplementsOpen ? "開放補齊" : "待補"
            }),
            /* @__PURE__ */ (0, n.jsx)("p", { children: g.description }),
            g.record && /* @__PURE__ */ (0, n.jsxs)("details", { children: [
              /* @__PURE__ */ (0, n.jsx)("summary", { children: "查看已補內容與來源" }),
              /* @__PURE__ */ (0, n.jsx)("div", {
                className: "production-source-text",
                children: g.record.content
              }),
              /* @__PURE__ */ (0, n.jsxs)("p", { children: ["來源：", g.record.source] }),
              /* @__PURE__ */ (0, n.jsxs)("p", { children: ["素材位置：", g.record.location || "內容已記錄"] })
            ] }),
            r.production?.supplementsOpen && (oe === p + ":" + g.index ? /* @__PURE__ */ (0, n.jsxs)("form", {
              className: "context-form",
              onSubmit: async (F) => {
                F.preventDefault(), await C("supplement_production_data", {
                  stageId: p,
                  gapIndex: g.index,
                  ...de
                }) && (Q(""), G({
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
                  onChange: (F) => G({
                    ...de,
                    content: F.target.value
                  })
                })] }),
                /* @__PURE__ */ (0, n.jsxs)("label", { children: ["補件來源", /* @__PURE__ */ (0, n.jsx)("input", {
                  required: !0,
                  maxLength: 2e3,
                  value: de.source,
                  onChange: (F) => G({
                    ...de,
                    source: F.target.value
                  })
                })] }),
                /* @__PURE__ */ (0, n.jsxs)("label", { children: ["補件素材位置", /* @__PURE__ */ (0, n.jsx)("input", {
                  maxLength: 2e3,
                  value: de.location,
                  onChange: (F) => G({
                    ...de,
                    location: F.target.value
                  })
                })] }),
                /* @__PURE__ */ (0, n.jsxs)("div", {
                  className: "context-actions",
                  children: [/* @__PURE__ */ (0, n.jsx)("button", {
                    className: "btn",
                    type: "button",
                    onClick: () => Q(""),
                    children: "取消"
                  }), /* @__PURE__ */ (0, n.jsx)("button", {
                    className: "btn primary",
                    disabled: m || r.archived,
                    children: "直接保存補齊內容"
                  })]
                })
              ]
            }) : /* @__PURE__ */ (0, n.jsx)("button", {
              className: "btn",
              disabled: m || r.archived,
              onClick: () => {
                Q(p + ":" + g.index), G({
                  content: g.record?.content ?? "",
                  source: g.record?.source ?? "",
                  location: g.record?.location ?? ""
                });
              },
              children: g.status === "filled" ? "追加補充版本" : "補齊此項"
            }))
          ]
        }, g.index)) }) : /* @__PURE__ */ (0, n.jsx)("p", { children: "本次盤點未列缺件。" })
      ]
    }),
    /* @__PURE__ */ (0, n.jsxs)("p", {
      className: "muted",
      children: [
        "找到 ",
        ve.length,
        " 筆資料；展開可讀取完整內容與來源。"
      ]
    }),
    /* @__PURE__ */ (0, n.jsx)("div", {
      className: "production-records",
      children: ve.slice(0, k).map((g) => /* @__PURE__ */ (0, n.jsxs)("details", {
        className: "production-record",
        children: [
          /* @__PURE__ */ (0, n.jsxs)("summary", { children: [
            /* @__PURE__ */ (0, n.jsx)("span", {
              className: "status " + (ai(g) ? "passed" : "candidate"),
              children: g.status === "effective" ? "採用版本" : g.status === "superseded" ? "已停用" : ai(g) ? "資料已通過" : "來源資料／待確認"
            }),
            /* @__PURE__ */ (0, n.jsx)("b", { children: g.title }),
            /* @__PURE__ */ (0, n.jsxs)("small", { children: [
              op[g.kind],
              " · ",
              g.scope.target || "本集共用"
            ] })
          ] }),
          /* @__PURE__ */ (0, n.jsxs)("code", {
            className: "context-id",
            children: [
              g.key,
              " · v",
              g.version
            ]
          }),
          /* @__PURE__ */ (0, n.jsx)("div", {
            className: "production-source-text",
            children: g.content
          }),
          /* @__PURE__ */ (0, n.jsxs)("p", {
            className: "context-source",
            children: [
              "來源：",
              g.source,
              /* @__PURE__ */ (0, n.jsx)("br", {}),
              "素材位置：",
              g.location || "內容已收錄於本資料；無外部素材位置"
            ]
          })
        ]
      }, g.id))
    }),
    ve.length > k && /* @__PURE__ */ (0, n.jsx)("button", {
      className: "btn",
      onClick: () => z(k + 30),
      children: "再顯示 30 筆資料"
    }),
    !W.length && /* @__PURE__ */ (0, n.jsx)("p", {
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
          disabled: m || r.archived,
          onChange: (g) => {
            Me(g.target.files?.[0]);
          }
        })] }),
        J && /* @__PURE__ */ (0, n.jsx)("p", {
          role: "alert",
          children: J
        }),
        ie && /* @__PURE__ */ (0, n.jsxs)("div", {
          className: "inline-note",
          children: [
            /* @__PURE__ */ (0, n.jsx)("b", { children: String(ie.title) }),
            /* @__PURE__ */ (0, n.jsxs)("p", { children: [
              String(ie.episode),
              " · ",
              ie.records.length,
              " 筆來源資料 · ",
              ie.shots.length,
              " 列待製作鏡頭 · ",
              ie.sections.length,
              " 個階段盤點"
            ] }),
            /* @__PURE__ */ (0, n.jsx)("button", {
              className: "btn primary",
              disabled: m || r.archived,
              onClick: async () => {
                await C("import_production_data", ie) && (fe(null), d(""), y(""), T(""));
              },
              children: "保存製作資料包"
            })
          ]
        }),
        r.production?.imports.map((g) => /* @__PURE__ */ (0, n.jsxs)("p", {
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
function Jm({ shotId: r, selection: m, disabled: C, mutate: p }) {
  const d = [
    ["output", "實際採用檔位置"],
    ["outputVersion", "採用檔版本"],
    ["reason", "選用原因"],
    ["source", "採用依據來源"],
    ["editorVersion", "剪輯工程版本"],
    ["inPoint", "工程入點"],
    ["outPoint", "工程出點"]
  ], [M, y] = (0, A.useState)(() => Object.fromEntries(d.map(([L]) => [L, m?.[L] ?? ""])));
  return /* @__PURE__ */ (0, n.jsxs)("details", {
    className: "selection-editor",
    children: [/* @__PURE__ */ (0, n.jsx)("summary", { children: "登記採用檔與工程位置" }), /* @__PURE__ */ (0, n.jsxs)("form", {
      className: "context-form",
      onSubmit: async (L) => {
        L.preventDefault(), await p("register_shot_selection", {
          ...M,
          shotId: r,
          baseVersion: m?.version ?? 0
        });
      },
      children: [
        d.map(([L, T]) => /* @__PURE__ */ (0, n.jsxs)("label", { children: [T, /* @__PURE__ */ (0, n.jsx)("input", {
          required: [
            "output",
            "outputVersion",
            "reason",
            "source"
          ].includes(L),
          maxLength: L === "reason" ? 3e3 : 2e3,
          value: M[L],
          onChange: (k) => y({
            ...M,
            [L]: k.target.value
          })
        })] }, L)),
        /* @__PURE__ */ (0, n.jsx)("p", {
          className: "muted",
          children: "工程入出點須成對填寫。保存來源與選用版本；素材實際開啟及檢視另行記錄。"
        }),
        /* @__PURE__ */ (0, n.jsx)("button", {
          className: "btn primary",
          disabled: C,
          children: "保存採用紀錄版本"
        })
      ]
    })]
  });
}
function Im({ project: r, busy: m, mutate: C }) {
  const [p, d] = (0, A.useState)(""), [M, y] = (0, A.useState)(""), [L, T] = (0, A.useState)(""), [k, z] = (0, A.useState)(20), K = [...new Map((r.production?.selections ?? []).map((J) => [J.shotId, J])).values()], U = [...new Map((r.production?.links ?? []).map((J) => [J.shotId, J])).values()], ie = xl(r).records, fe = r.shots.filter((J) => [
    J.id,
    J.scene,
    J.description,
    J.legacyIds
  ].join(" ").toLowerCase().includes(p.toLowerCase()));
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
          U.length,
          " / ",
          r.shots.length,
          " 列已建立關聯"
        ] }),
        /* @__PURE__ */ (0, n.jsxs)("b", { children: [U.filter((J) => J.references.length).length, " 列有影格來源定位"] }),
        /* @__PURE__ */ (0, n.jsxs)("b", { children: [(/* @__PURE__ */ new Set([...K.map((J) => J.shotId), ...U.filter((J) => J.adoptedOutput).map((J) => J.shotId)])).size, " 列已登記採用檔"] })
      ]
    }),
    /* @__PURE__ */ (0, n.jsxs)("label", {
      className: "work-search",
      children: ["搜尋鏡頭關聯", /* @__PURE__ */ (0, n.jsx)("input", {
        value: p,
        onChange: (J) => {
          d(J.target.value), z(20);
        },
        placeholder: "F077、G11、S06 或鏡頭 ID"
      })]
    }),
    fe.slice(0, k).map((J) => {
      const I = U.find((Q) => Q.shotId === J.id), oe = K.find((Q) => Q.shotId === J.id);
      return /* @__PURE__ */ (0, n.jsxs)("details", {
        className: "production-record",
        children: [
          /* @__PURE__ */ (0, n.jsxs)("summary", { children: [/* @__PURE__ */ (0, n.jsxs)("b", { children: [
            J.id,
            " · ",
            J.legacyIds
          ] }), /* @__PURE__ */ (0, n.jsxs)("small", { children: [
            J.scene,
            " · ",
            I ? "關聯已建立" : "來源對應待補"
          ] })] }),
          /* @__PURE__ */ (0, n.jsx)("p", {
            className: "production-source-text",
            children: J.description
          }),
          I ? /* @__PURE__ */ (0, n.jsxs)(n.Fragment, { children: [
            /* @__PURE__ */ (0, n.jsxs)("div", {
              className: "production-gaps",
              children: [
                /* @__PURE__ */ (0, n.jsx)("b", { children: "接著做什麼" }),
                /* @__PURE__ */ (0, n.jsx)("p", { children: oe ? "採用檔已登記；接著開啟素材並對照工程版本與入出點。" : I.nextStep }),
                /* @__PURE__ */ (0, n.jsxs)("p", { children: ["採用檔：", oe?.output || I.adoptedOutput || "位置尚未登記"] }),
                /* @__PURE__ */ (0, n.jsxs)("p", { children: ["選用原因：", oe?.reason || I.selectionReason || "尚未登記"] }),
                I.unknowns.length > 0 && /* @__PURE__ */ (0, n.jsx)("p", {
                  className: "muted",
                  children: "來源盤點時的缺口；新增採用登記另列於下方。"
                }),
                I.unknowns.length > 0 && /* @__PURE__ */ (0, n.jsx)("ul", { children: I.unknowns.map((Q, de) => /* @__PURE__ */ (0, n.jsx)("li", { children: Q }, de)) })
              ]
            }),
            oe && /* @__PURE__ */ (0, n.jsxs)("div", {
              className: "context-mini",
              children: [
                /* @__PURE__ */ (0, n.jsxs)("b", { children: [
                  "採用登記 v",
                  oe.version,
                  " · ",
                  oe.outputVersion
                ] }),
                /* @__PURE__ */ (0, n.jsxs)("p", { children: ["依據：", oe.source] }),
                /* @__PURE__ */ (0, n.jsxs)("p", { children: [
                  "工程：",
                  oe.editorVersion || "未登記",
                  " · ",
                  oe.inPoint || "未登記",
                  " → ",
                  oe.outPoint || "未登記"
                ] })
              ]
            }),
            /* @__PURE__ */ (0, n.jsx)("h3", { children: "使用依據與提示詞" }),
            I.recordKeys.map((Q) => {
              const de = ie.find((G) => G.key === Q);
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
              }, Q) : null;
            }),
            /* @__PURE__ */ (0, n.jsx)("h3", { children: "來源影格定位" }),
            I.references.length ? I.references.map((Q, de) => /* @__PURE__ */ (0, n.jsxs)("div", {
              className: "context-mini",
              children: [
                /* @__PURE__ */ (0, n.jsx)("b", { children: Q.file }),
                /* @__PURE__ */ (0, n.jsxs)("p", { children: ["素材包：", Q.archive] }),
                /* @__PURE__ */ (0, n.jsxs)("p", { children: ["包內位置：", Q.member] }),
                /* @__PURE__ */ (0, n.jsxs)("code", {
                  className: "context-id",
                  children: ["SHA-256 ", Q.sha256 || "來源未列"]
                }),
                /* @__PURE__ */ (0, n.jsx)("small", { children: "依來源索引定位；實際圖像讀取狀態另記。" })
              ]
            }, de)) : /* @__PURE__ */ (0, n.jsx)("p", { children: "目前來源未對上此影格。" }),
            /* @__PURE__ */ (0, n.jsx)("h3", { children: "剪輯對照候選" }),
            /* @__PURE__ */ (0, n.jsx)("p", {
              className: "muted",
              children: "以下時間來自指定來源表，尚未指定為本鏡實際入片位置。"
            }),
            I.timelineCandidates.map((Q, de) => /* @__PURE__ */ (0, n.jsxs)("div", {
              className: "context-mini",
              children: [
                /* @__PURE__ */ (0, n.jsxs)("b", { children: [
                  "序號 ",
                  Q.sequence,
                  " · ",
                  Q.start,
                  " → ",
                  Q.end
                ] }),
                /* @__PURE__ */ (0, n.jsx)("p", { children: Q.text }),
                /* @__PURE__ */ (0, n.jsx)("small", { children: Q.source })
              ]
            }, de)),
            !I.timelineCandidates.length && /* @__PURE__ */ (0, n.jsx)("p", { children: "尚缺可核實的剪輯對照。" }),
            /* @__PURE__ */ (0, n.jsx)("h3", { children: "台詞與音檔對照候選" }),
            I.voiceCandidates.map((Q, de) => /* @__PURE__ */ (0, n.jsxs)("div", {
              className: "context-mini",
              children: [
                /* @__PURE__ */ (0, n.jsx)("b", { children: Q.lineId }),
                /* @__PURE__ */ (0, n.jsx)("p", { children: Q.file }),
                /* @__PURE__ */ (0, n.jsxs)("small", { children: [
                  Q.start,
                  " → ",
                  Q.end,
                  " · ",
                  Q.source
                ] })
              ]
            }, de)),
            !I.voiceCandidates.length && /* @__PURE__ */ (0, n.jsx)("p", { children: "尚未建立明確台詞對應，不依編號猜配。" })
          ] }) : /* @__PURE__ */ (0, n.jsx)("p", { children: "請補來源與實際輸出對應。" }),
          /* @__PURE__ */ (0, n.jsx)(Jm, {
            shotId: J.id,
            selection: oe,
            disabled: m || r.archived,
            mutate: C
          }, oe?.id ?? J.id)
        ]
      }, J.id);
    }),
    fe.length > k && /* @__PURE__ */ (0, n.jsx)("button", {
      className: "btn",
      onClick: () => z(k + 20),
      children: "再顯示 20 列"
    }),
    /* @__PURE__ */ (0, n.jsxs)("details", {
      className: "production-import",
      children: [
        /* @__PURE__ */ (0, n.jsx)("summary", { children: "補入鏡頭製作關聯" }),
        /* @__PURE__ */ (0, n.jsx)("p", { children: "貼上包含 bundleId 與 links 清單的 JSON；所有鏡頭與資料識別鍵必須已存在。保留歷次關聯。" }),
        /* @__PURE__ */ (0, n.jsxs)("label", { children: ["鏡頭關聯 JSON", /* @__PURE__ */ (0, n.jsx)("textarea", {
          rows: 5,
          value: M,
          onChange: (J) => {
            y(J.target.value), T("");
          }
        })] }),
        L && /* @__PURE__ */ (0, n.jsx)("p", {
          role: "alert",
          children: L
        }),
        /* @__PURE__ */ (0, n.jsx)("button", {
          className: "btn primary",
          disabled: m || r.archived || !M.trim(),
          onClick: async () => {
            try {
              await C("save_production_links", JSON.parse(M)) && y("");
            } catch (J) {
              T(J instanceof Error ? J.message : "格式錯誤");
            }
          },
          children: "保存鏡頭製作關聯"
        })
      ]
    })
  ] });
}
var ti = {
  reference: "來源候選",
  adopted: "本集採用",
  withdrawn: "停止沿用",
  unresolved: "版本待補登"
}, dp = {
  script: "劇本",
  character: "角色",
  scene: "場景",
  voice: "聲線",
  op_audio: "OP音軌",
  ed_audio: "ED音軌",
  edit: "剪輯工程"
}, ys = (r) => r.split(/[,，\n]/).map((m) => m.trim()).filter(Boolean), up = {
  key: "",
  title: "",
  content: "",
  source: "",
  note: "",
  stageIdsText: "",
  sceneIdsText: "",
  status: "reference",
  baseVersion: 0
}, fp = {
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
function _p({ project: r, busy: m, mutate: C }) {
  const [p, d] = (0, A.useState)(!1), [M, y] = (0, A.useState)(!1), [L, T] = (0, A.useState)(up), [k, z] = (0, A.useState)(fp), [K, U] = (0, A.useState)(""), [ie, fe] = (0, A.useState)(""), [J, I] = (0, A.useState)(""), oe = Hm(r), Q = m || r.archived, de = Za(r.episodeRules ?? []), G = Za(r.baselines ?? []), W = (b) => !K || [b.key, b.title].join(" ").toLowerCase().includes(K.toLowerCase());
  function P(b) {
    T({
      ...b,
      stageIdsText: b.stageIds.join(", "),
      sceneIdsText: b.sceneIds.join(", "),
      baseVersion: cn(r.episodeRules ?? []).find((le) => le.key === b.key).version
    }), d(!0);
  }
  function ae(b) {
    z({
      ...b,
      recordKey: b.snapshot?.key ?? "",
      recordVersion: b.recordVersion ?? 1,
      content: b.snapshot?.content ?? "",
      stageIdsText: b.stageIds.join(", "),
      sceneIdsText: b.sceneIds.join(", "),
      baseVersion: cn(r.baselines ?? []).find((le) => le.key === b.key).version
    }), y(!0);
  }
  async function ce(b, le) {
    await C("save_episode_rule", {
      ...b,
      status: le,
      baseVersion: oe.rules.find((ve) => ve.key === b.key).version
    });
  }
  async function X(b, le) {
    await C("register_episode_baseline", {
      ...b,
      status: le,
      recordKey: b.snapshot?.key ?? "",
      recordVersion: b.recordVersion,
      content: b.snapshot?.content ?? "",
      baseVersion: oe.baselines.find((ve) => ve.key === b.key).version
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
          /* @__PURE__ */ (0, n.jsxs)("h2", { children: [r.episode, " 規則與採用版本"] }),
          /* @__PURE__ */ (0, n.jsx)("p", { children: "通用流程保存製作方法；本集規則保存劇情與素材限制。採用清單指定來源版本，下一集另行選用。" }),
          /* @__PURE__ */ (0, n.jsxs)("div", {
            className: "production-totals",
            children: [
              /* @__PURE__ */ (0, n.jsxs)("b", { children: [de.length, " 項本集規則已採用"] }),
              /* @__PURE__ */ (0, n.jsxs)("b", { children: [G.length, " 項來源已採用"] }),
              /* @__PURE__ */ (0, n.jsxs)("span", { children: [oe.baselines.filter((b) => b.status === "unresolved").length, " 項版本待補登"] })
            ]
          }),
          /* @__PURE__ */ (0, n.jsx)("p", {
            className: "inline-note",
            children: "候選新版本保留原採用版。採用紀錄、來源收錄與素材實際檢視分開保存。"
          }),
          /* @__PURE__ */ (0, n.jsxs)("label", {
            className: "work-search",
            children: ["搜尋規則與採用項目", /* @__PURE__ */ (0, n.jsx)("input", {
              value: K,
              onChange: (b) => U(b.target.value),
              placeholder: "規則、角色、劇本、聲線或音軌"
            })]
          }),
          /* @__PURE__ */ (0, n.jsxs)("details", { children: [/* @__PURE__ */ (0, n.jsx)("summary", { children: "通用流程檢查項目" }), oe.genericChecks.map((b) => /* @__PURE__ */ (0, n.jsxs)("div", {
            className: "context-mini",
            children: [/* @__PURE__ */ (0, n.jsxs)("b", { children: [
              b.id,
              " ",
              b.title
            ] }), /* @__PURE__ */ (0, n.jsx)("ul", { children: b.checks.map((le) => /* @__PURE__ */ (0, n.jsx)("li", { children: le }, le)) })]
          }, b.id))] }),
          r.workflowLegacy && /* @__PURE__ */ (0, n.jsxs)("details", { children: [
            /* @__PURE__ */ (0, n.jsx)("summary", { children: "保留的舊版檢查表紀錄" }),
            /* @__PURE__ */ (0, n.jsx)("p", { children: "舊版單集條件及勾選狀態保留在此；本集實際適用的規則另列於下方。" }),
            r.workflowLegacy.stages.map((b) => /* @__PURE__ */ (0, n.jsxs)("div", {
              className: "context-mini",
              children: [/* @__PURE__ */ (0, n.jsxs)("b", { children: ["舊階段 ", b.stageId] }), b.labels.map((le, ve) => /* @__PURE__ */ (0, n.jsxs)("p", { children: [
                b.checks[ve] ? "已勾選" : "未勾選",
                " · ",
                le
              ] }, ve))]
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
              disabled: Q,
              onClick: () => {
                T(up), d(!p);
              },
              children: "新增本集規則"
            })]
          }),
          p && /* @__PURE__ */ (0, n.jsxs)("form", {
            className: "context-form",
            onSubmit: async (b) => {
              b.preventDefault(), await C("save_episode_rule", {
                ...L,
                stageIds: ys(L.stageIdsText),
                sceneIds: ys(L.sceneIdsText)
              }) && d(!1);
            },
            children: [
              /* @__PURE__ */ (0, n.jsxs)("div", {
                className: "context-form-grid",
                children: [/* @__PURE__ */ (0, n.jsxs)("label", { children: ["規則識別鍵", /* @__PURE__ */ (0, n.jsx)("input", {
                  required: !0,
                  readOnly: !!L.baseVersion,
                  maxLength: 100,
                  value: L.key,
                  onChange: (b) => T({
                    ...L,
                    key: b.target.value
                  })
                })] }), /* @__PURE__ */ (0, n.jsxs)("label", { children: ["規則名稱", /* @__PURE__ */ (0, n.jsx)("input", {
                  required: !0,
                  maxLength: 200,
                  value: L.title,
                  onChange: (b) => T({
                    ...L,
                    title: b.target.value
                  })
                })] })]
              }),
              /* @__PURE__ */ (0, n.jsxs)("label", { children: ["規則內容", /* @__PURE__ */ (0, n.jsx)("textarea", {
                required: !0,
                rows: 4,
                maxLength: 6e3,
                value: L.content,
                onChange: (b) => T({
                  ...L,
                  content: b.target.value
                })
              })] }),
              /* @__PURE__ */ (0, n.jsxs)("label", { children: ["規則來源", /* @__PURE__ */ (0, n.jsx)("input", {
                required: !0,
                maxLength: 2e3,
                value: L.source,
                onChange: (b) => T({
                  ...L,
                  source: b.target.value
                })
              })] }),
              /* @__PURE__ */ (0, n.jsxs)("div", {
                className: "context-form-grid",
                children: [/* @__PURE__ */ (0, n.jsxs)("label", { children: ["規則適用階段", /* @__PURE__ */ (0, n.jsx)("input", {
                  value: L.stageIdsText,
                  placeholder: "逗號分隔；留空為本集共用",
                  onChange: (b) => T({
                    ...L,
                    stageIdsText: b.target.value
                  })
                })] }), /* @__PURE__ */ (0, n.jsxs)("label", { children: ["規則適用場次", /* @__PURE__ */ (0, n.jsx)("input", {
                  value: L.sceneIdsText,
                  placeholder: "逗號分隔；留空為全部場次",
                  onChange: (b) => T({
                    ...L,
                    sceneIdsText: b.target.value
                  })
                })] })]
              }),
              /* @__PURE__ */ (0, n.jsxs)("label", { children: ["規則狀態", /* @__PURE__ */ (0, n.jsx)("select", {
                value: L.status,
                onChange: (b) => T({
                  ...L,
                  status: b.target.value
                }),
                children: Object.entries(ti).map(([b, le]) => /* @__PURE__ */ (0, n.jsx)("option", {
                  value: b,
                  children: le
                }, b))
              })] }),
              /* @__PURE__ */ (0, n.jsxs)("label", { children: ["規則備註", /* @__PURE__ */ (0, n.jsx)("textarea", {
                rows: 2,
                value: L.note,
                onChange: (b) => T({
                  ...L,
                  note: b.target.value
                })
              })] }),
              /* @__PURE__ */ (0, n.jsx)("button", {
                className: "btn primary",
                disabled: Q,
                children: "保存本集規則版本"
              })
            ]
          }),
          oe.rules.filter(W).map((b) => {
            const le = de.find((ve) => ve.key === b.key);
            return /* @__PURE__ */ (0, n.jsxs)("details", {
              className: "production-record",
              children: [
                /* @__PURE__ */ (0, n.jsxs)("summary", { children: [/* @__PURE__ */ (0, n.jsx)("b", { children: b.title }), /* @__PURE__ */ (0, n.jsxs)("span", { children: [
                  ti[b.status],
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
                      disabled: Q,
                      onClick: () => P(b),
                      children: "編輯規則新版本"
                    }),
                    b.status === "reference" && /* @__PURE__ */ (0, n.jsx)("button", {
                      className: "btn primary",
                      disabled: Q,
                      onClick: () => {
                        ce(b, "adopted");
                      },
                      children: "採用此規則"
                    }),
                    le && /* @__PURE__ */ (0, n.jsx)("button", {
                      className: "btn",
                      disabled: Q,
                      onClick: () => {
                        ce(le, "withdrawn");
                      },
                      children: "停止沿用規則"
                    })
                  ]
                })
              ]
            }, b.id);
          }),
          !oe.rules.length && /* @__PURE__ */ (0, n.jsx)("p", { children: "本集尚未登記專用規則；不自動繼承前一集條件。" })
        ]
      }),
      /* @__PURE__ */ (0, n.jsxs)("div", {
        className: "wide-card",
        children: [
          /* @__PURE__ */ (0, n.jsxs)("div", {
            className: "section-title",
            children: [/* @__PURE__ */ (0, n.jsxs)("div", { children: [/* @__PURE__ */ (0, n.jsx)("h2", { children: "本集採用版本清單" }), /* @__PURE__ */ (0, n.jsx)("p", { children: "依角色、場景或音軌使用固定識別鍵；指定來源全文的確切版本，或登記外部來源。" })] }), /* @__PURE__ */ (0, n.jsx)("button", {
              className: "btn",
              disabled: Q,
              onClick: () => {
                z(fp), y(!M);
              },
              children: "新增採用項目"
            })]
          }),
          M && /* @__PURE__ */ (0, n.jsxs)("form", {
            className: "context-form",
            onSubmit: async (b) => {
              b.preventDefault(), await C("register_episode_baseline", {
                ...k,
                stageIds: ys(k.stageIdsText),
                sceneIds: ys(k.sceneIdsText)
              }) && y(!1);
            },
            children: [
              /* @__PURE__ */ (0, n.jsxs)("div", {
                className: "context-form-grid",
                children: [
                  /* @__PURE__ */ (0, n.jsxs)("label", { children: ["採用項目識別鍵", /* @__PURE__ */ (0, n.jsx)("input", {
                    required: !0,
                    readOnly: !!k.baseVersion,
                    maxLength: 100,
                    value: k.key,
                    onChange: (b) => z({
                      ...k,
                      key: b.target.value
                    })
                  })] }),
                  /* @__PURE__ */ (0, n.jsxs)("label", { children: ["採用項目名稱", /* @__PURE__ */ (0, n.jsx)("input", {
                    required: !0,
                    maxLength: 200,
                    value: k.title,
                    onChange: (b) => z({
                      ...k,
                      title: b.target.value
                    })
                  })] }),
                  /* @__PURE__ */ (0, n.jsxs)("label", { children: ["採用種類", /* @__PURE__ */ (0, n.jsx)("select", {
                    value: k.category,
                    onChange: (b) => z({
                      ...k,
                      category: b.target.value
                    }),
                    children: qm.map((b) => /* @__PURE__ */ (0, n.jsx)("option", {
                      value: b,
                      children: dp[b]
                    }, b))
                  })] }),
                  /* @__PURE__ */ (0, n.jsxs)("label", { children: ["採用項目狀態", /* @__PURE__ */ (0, n.jsx)("select", {
                    value: k.status,
                    onChange: (b) => z({
                      ...k,
                      status: b.target.value
                    }),
                    children: Object.entries(ti).map(([b, le]) => /* @__PURE__ */ (0, n.jsx)("option", {
                      value: b,
                      children: le
                    }, b))
                  })] }),
                  /* @__PURE__ */ (0, n.jsxs)("label", { children: ["已有來源識別鍵", /* @__PURE__ */ (0, n.jsx)("input", {
                    value: k.recordKey,
                    maxLength: 120,
                    onChange: (b) => z({
                      ...k,
                      recordKey: b.target.value
                    }),
                    placeholder: "從製作資料取得；外部來源可留空"
                  })] }),
                  /* @__PURE__ */ (0, n.jsxs)("label", { children: ["來源紀錄版本", /* @__PURE__ */ (0, n.jsx)("input", {
                    type: "number",
                    min: 1,
                    value: k.recordVersion,
                    onChange: (b) => z({
                      ...k,
                      recordVersion: Number(b.target.value)
                    })
                  })] })
                ]
              }),
              !k.recordKey && /* @__PURE__ */ (0, n.jsxs)("label", { children: ["外部來源內容", /* @__PURE__ */ (0, n.jsx)("textarea", {
                rows: 4,
                required: k.status === "reference" || k.status === "adopted",
                value: k.content,
                maxLength: 12e3,
                onChange: (b) => z({
                  ...k,
                  content: b.target.value
                })
              })] }),
              /* @__PURE__ */ (0, n.jsxs)("label", { children: ["採用依據來源", /* @__PURE__ */ (0, n.jsx)("input", {
                required: !0,
                maxLength: 2e3,
                value: k.source,
                onChange: (b) => z({
                  ...k,
                  source: b.target.value
                })
              })] }),
              /* @__PURE__ */ (0, n.jsxs)("div", {
                className: "context-form-grid",
                children: [
                  /* @__PURE__ */ (0, n.jsxs)("label", { children: ["外部檔案版本", /* @__PURE__ */ (0, n.jsx)("input", {
                    value: k.externalVersion,
                    maxLength: 200,
                    onChange: (b) => z({
                      ...k,
                      externalVersion: b.target.value
                    })
                  })] }),
                  /* @__PURE__ */ (0, n.jsxs)("label", { children: ["來源檔案位置", /* @__PURE__ */ (0, n.jsx)("input", {
                    value: k.location,
                    maxLength: 2e3,
                    onChange: (b) => z({
                      ...k,
                      location: b.target.value
                    })
                  })] }),
                  /* @__PURE__ */ (0, n.jsxs)("label", { children: ["採用適用階段", /* @__PURE__ */ (0, n.jsx)("input", {
                    value: k.stageIdsText,
                    placeholder: "OP／ED自動限制於各自支線",
                    onChange: (b) => z({
                      ...k,
                      stageIdsText: b.target.value
                    })
                  })] }),
                  /* @__PURE__ */ (0, n.jsxs)("label", { children: ["採用適用場次", /* @__PURE__ */ (0, n.jsx)("input", {
                    value: k.sceneIdsText,
                    onChange: (b) => z({
                      ...k,
                      sceneIdsText: b.target.value
                    })
                  })] })
                ]
              }),
              /* @__PURE__ */ (0, n.jsxs)("label", { children: ["選用原因或待補說明", /* @__PURE__ */ (0, n.jsx)("textarea", {
                required: k.status === "unresolved",
                rows: 3,
                maxLength: 3e3,
                value: k.note,
                onChange: (b) => z({
                  ...k,
                  note: b.target.value
                })
              })] }),
              /* @__PURE__ */ (0, n.jsx)("button", {
                className: "btn primary",
                disabled: Q,
                children: "保存採用項目版本"
              })
            ]
          }),
          oe.baselines.filter(W).map((b) => {
            const le = G.find((ve) => ve.key === b.key);
            return /* @__PURE__ */ (0, n.jsxs)("details", {
              className: "production-record",
              children: [
                /* @__PURE__ */ (0, n.jsxs)("summary", { children: [/* @__PURE__ */ (0, n.jsxs)("b", { children: [
                  dp[b.category],
                  "｜",
                  b.title
                ] }), /* @__PURE__ */ (0, n.jsxs)("span", { children: [
                  ti[b.status],
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
                      disabled: Q,
                      onClick: () => ae(b),
                      children: "編輯採用項目新版本"
                    }),
                    b.status === "reference" && b.snapshot && /* @__PURE__ */ (0, n.jsx)("button", {
                      className: "btn primary",
                      disabled: Q,
                      onClick: () => {
                        X(b, "adopted");
                      },
                      children: "採用此來源版本"
                    }),
                    le && /* @__PURE__ */ (0, n.jsx)("button", {
                      className: "btn",
                      disabled: Q,
                      onClick: () => {
                        X(le, "withdrawn");
                      },
                      children: "停止沿用此項目"
                    })
                  ]
                })
              ]
            }, b.id);
          }),
          !oe.baselines.length && /* @__PURE__ */ (0, n.jsx)("p", { children: "尚未指定本集採用版本。共用來源可按需連結後再選用。" }),
          /* @__PURE__ */ (0, n.jsxs)("details", {
            className: "production-import",
            children: [
              /* @__PURE__ */ (0, n.jsx)("summary", { children: "批次補登本集設定" }),
              /* @__PURE__ */ (0, n.jsx)("p", { children: "包含 rules 與 baselines 清單；保留版本及來源，採用與候選分開。" }),
              /* @__PURE__ */ (0, n.jsxs)("label", { children: ["本集設定 JSON", /* @__PURE__ */ (0, n.jsx)("textarea", {
                rows: 5,
                value: ie,
                onChange: (b) => {
                  fe(b.target.value), I("");
                }
              })] }),
              J && /* @__PURE__ */ (0, n.jsx)("p", {
                role: "alert",
                children: J
              }),
              /* @__PURE__ */ (0, n.jsx)("button", {
                className: "btn primary",
                disabled: Q || !ie.trim(),
                onClick: async () => {
                  try {
                    await C("import_episode_settings", JSON.parse(ie)) && fe("");
                  } catch (b) {
                    I(b instanceof Error ? b.message : "格式錯誤");
                  }
                },
                children: "保存本集設定清單"
              })
            ]
          }),
          /* @__PURE__ */ (0, n.jsxs)("details", { children: [/* @__PURE__ */ (0, n.jsx)("summary", { children: "設定歷史版本" }), [...r.episodeRules ?? [], ...r.baselines ?? []].map((b) => /* @__PURE__ */ (0, n.jsxs)("p", { children: [
            b.key,
            " v",
            b.version,
            " · ",
            ti[b.status],
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
var Xr = {
  rule: "規則／決策",
  script: "劇本",
  character: "角色",
  scene: "場景",
  audio: "聲音／音軌",
  reference: "原作／參考素材"
}, pp = {
  original: "原文明示",
  adaptation: "動畫改編",
  author_decision: "作者決定",
  ai_proposal: "AI 建議"
}, lo = {
  project: "本集共用",
  stage: "指定階段",
  scene: "指定場次",
  shot: "指定鏡頭"
}, Qr = (r) => lo[r.type] + (r.target ? " · " + r.target : ""), Zr = {
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
function $m(r, m) {
  const C = URL.createObjectURL(new Blob([JSON.stringify(m, null, 2)], { type: "application/json" })), p = document.createElement("a");
  p.href = C, p.download = r, p.click(), setTimeout(() => URL.revokeObjectURL(C), 1e3);
}
function Wm({ project: r, mutate: m, busy: C }) {
  const p = xl(r), [d, M] = (0, A.useState)("materials"), [y, L] = (0, A.useState)(!1), [T, k] = (0, A.useState)(Zr), [z, K] = (0, A.useState)(!1), [U, ie] = (0, A.useState)({
    type: "conflict",
    scopeType: "project",
    target: "",
    description: ""
  }), [fe, J] = (0, A.useState)("production"), [I, oe] = (0, A.useState)(""), [Q, de] = (0, A.useState)(""), [G, W] = (0, A.useState)(""), [P, ae] = (0, A.useState)(""), [ce, X] = (0, A.useState)(""), [b, le] = (0, A.useState)(""), [ve, Me] = (0, A.useState)(""), [g, F] = (0, A.useState)(""), [V, R] = (0, A.useState)(""), [Y, pe] = (0, A.useState)(""), [ue, Ae] = (0, A.useState)(""), [x, H] = (0, A.useState)(""), [Z, ee] = (0, A.useState)(""), [S, $] = (0, A.useState)({}), se = p.packs.find((h) => h.id === g) ?? p.packs.at(-1), ze = p.records.filter((h) => h.status === "effective"), ye = p.records.filter((h) => h.status === "proposed" && !ai(h)), Je = p.problems.filter((h) => h.status === "open"), Ge = [
    [
      "materials",
      "製作資料",
      p.records.length
    ],
    [
      "links",
      "製作關聯",
      new Set((r.production?.links ?? []).map((h) => h.shotId)).size
    ],
    [
      "settings",
      "本集採用",
      Za(r.baselines ?? []).length
    ],
    [
      "baseline",
      "直接核定來源",
      ze.length
    ],
    [
      "proposals",
      "待確認提案",
      ye.length
    ],
    [
      "problems",
      "矛盾與缺件",
      Je.length
    ],
    [
      "packet",
      "工作資料包",
      p.packs.length
    ],
    [
      "handoff",
      "工作接續",
      p.results.length
    ]
  ], we = C || r.archived;
  async function Xe(h) {
    h.preventDefault(), await m("propose_record", {
      ...T,
      scope: {
        type: T.scopeType,
        target: T.target
      }
    }) && (L(!1), k(Zr), M("proposals"));
  }
  function xt(h) {
    const te = p.records.find((tt) => tt.id === h);
    k({
      key: te.key,
      title: te.title,
      kind: te.kind,
      origin: "author_decision",
      content: te.content,
      source: "",
      location: te.location,
      scopeType: te.scope.type,
      target: te.scope.target,
      supersedesId: te.id
    }), L(!0);
  }
  function gt(h) {
    return /* @__PURE__ */ (0, n.jsxs)(n.Fragment, { children: [
      /* @__PURE__ */ (0, n.jsxs)("div", {
        className: "context-pack-head",
        children: [
          /* @__PURE__ */ (0, n.jsx)("span", {
            className: "status " + (h.readiness === "ready" ? "passed" : "needs_revision"),
            children: h.readiness === "ready" ? h.purpose === "documentation" ? "可整理資料 · 保留來源差異" : "紀錄齊備 · 素材待實際讀取" : "受阻 · 先處理缺件與矛盾"
          }),
          /* @__PURE__ */ (0, n.jsx)("span", {
            className: "status " + (h.projectRevision === r.revision ? "passed" : "needs_revision"),
            children: h.projectRevision === r.revision ? "目前版本" : "已過期，需重新取得"
          }),
          /* @__PURE__ */ (0, n.jsx)("button", {
            className: "btn",
            onClick: () => $m("AI_工作資料包_" + h.id + ".json", h),
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
        children: h.blockers.map((te, tt) => /* @__PURE__ */ (0, n.jsx)("p", { children: te.replace(/缺少有效資料種類：(\w+)/g, (Dt, E) => "缺少有效資料種類：" + (Xr[E] || E)) }, tt))
      }),
      /* @__PURE__ */ (0, n.jsx)("h3", { children: h.purpose === "documentation" ? "本次指定來源（整理用途）" : "本次有效依據" }),
      h.records.length ? h.records.map((te) => /* @__PURE__ */ (0, n.jsxs)("article", {
        className: "context-mini",
        children: [
          /* @__PURE__ */ (0, n.jsxs)("b", { children: [
            te.title,
            " · v",
            te.version
          ] }),
          /* @__PURE__ */ (0, n.jsxs)("small", { children: [
            te.key,
            " · ",
            Qr(te.scope)
          ] }),
          /* @__PURE__ */ (0, n.jsx)("p", { children: te.content }),
          /* @__PURE__ */ (0, n.jsxs)("small", { children: ["來源：", te.source] }),
          /* @__PURE__ */ (0, n.jsxs)("small", { children: ["素材位置：", te.location || "內容已記錄；未登記外部檔案"] })
        ]
      }, te.id)) : /* @__PURE__ */ (0, n.jsx)("p", {
        className: "muted",
        children: "尚無有效資料，AI 應回報受阻。"
      }),
      /* @__PURE__ */ (0, n.jsxs)("details", { children: [/* @__PURE__ */ (0, n.jsxs)("summary", { children: [
        "禁止混用的版本／待確認提案（",
        h.excluded.length,
        "）"
      ] }), h.excluded.map((te) => /* @__PURE__ */ (0, n.jsxs)("p", { children: [
        te.title,
        " · ",
        te.status,
        " · ",
        te.id
      ] }, te.id))] }),
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
        children: Ge.filter(([h]) => [
          "materials",
          "links",
          "handoff",
          "problems"
        ].includes(h)).map(([h, te, tt]) => /* @__PURE__ */ (0, n.jsxs)("button", {
          className: d === h ? "active" : "",
          onClick: () => M(h),
          children: [
            {
              materials: "製作資料",
              links: "鏡頭對應",
              handoff: "工作紀錄",
              problems: "缺件與疑問"
            }[h],
            " ",
            /* @__PURE__ */ (0, n.jsx)("span", { children: tt })
          ]
        }, h))
      }),
      /* @__PURE__ */ (0, n.jsxs)("details", {
        className: "advanced-tools",
        children: [
          /* @__PURE__ */ (0, n.jsx)("summary", { children: "進階：採用設定、資料提案與 AI 工作資料包" }),
          /* @__PURE__ */ (0, n.jsx)("div", {
            className: "context-tabs",
            children: Ge.filter(([h]) => ![
              "materials",
              "links",
              "handoff",
              "problems"
            ].includes(h)).map(([h, te, tt]) => /* @__PURE__ */ (0, n.jsxs)("button", {
              className: d === h ? "active" : "",
              onClick: () => M(h),
              children: [
                te,
                " · ",
                tt
              ]
            }, h))
          }),
          /* @__PURE__ */ (0, n.jsx)("p", { children: "AI 接手時會讀取指定版本；一般查資料不需要手動建立資料包。" })
        ]
      }),
      /* @__PURE__ */ (0, n.jsx)("div", {
        className: d === "settings" ? "" : "wide-card",
        children: d === "settings" ? /* @__PURE__ */ (0, n.jsx)(_p, {
          project: r,
          busy: C,
          mutate: m
        }) : d === "links" ? /* @__PURE__ */ (0, n.jsx)(Im, {
          project: r,
          busy: C,
          mutate: m
        }) : d === "materials" ? /* @__PURE__ */ (0, n.jsx)(Km, {
          project: r,
          busy: C,
          mutate: m
        }) : ["baseline", "proposals"].includes(d) ? /* @__PURE__ */ (0, n.jsxs)(n.Fragment, { children: [
          /* @__PURE__ */ (0, n.jsxs)("div", {
            className: "section-title",
            children: [/* @__PURE__ */ (0, n.jsxs)("div", { children: [/* @__PURE__ */ (0, n.jsx)("h2", { children: d === "baseline" ? "目前有效資料" : "待作者確認的提案" }), /* @__PURE__ */ (0, n.jsx)("p", { children: "識別鍵固定，修改建立新版本；來源與適用範圍必填。" })] }), /* @__PURE__ */ (0, n.jsx)("button", {
              className: "btn primary",
              disabled: we,
              onClick: () => {
                k(Zr), L(!y);
              },
              children: "新增資料提案"
            })]
          }),
          y && /* @__PURE__ */ (0, n.jsxs)("form", {
            className: "context-form",
            onSubmit: Xe,
            children: [
              /* @__PURE__ */ (0, n.jsxs)("div", {
                className: "context-form-grid",
                children: [
                  /* @__PURE__ */ (0, n.jsxs)("label", { children: ["固定識別鍵", /* @__PURE__ */ (0, n.jsx)("input", {
                    required: !0,
                    maxLength: 120,
                    placeholder: "例如 mother_position 或 script_main",
                    value: T.key,
                    readOnly: !!T.supersedesId,
                    onChange: (h) => k({
                      ...T,
                      key: h.target.value
                    })
                  })] }),
                  /* @__PURE__ */ (0, n.jsxs)("label", { children: ["資料名稱", /* @__PURE__ */ (0, n.jsx)("input", {
                    required: !0,
                    maxLength: 200,
                    value: T.title,
                    onChange: (h) => k({
                      ...T,
                      title: h.target.value
                    })
                  })] }),
                  /* @__PURE__ */ (0, n.jsxs)("label", { children: ["資料種類", /* @__PURE__ */ (0, n.jsx)("select", {
                    value: T.kind,
                    onChange: (h) => k({
                      ...T,
                      kind: h.target.value
                    }),
                    children: Bm.map((h) => /* @__PURE__ */ (0, n.jsx)("option", {
                      value: h,
                      children: Xr[h]
                    }, h))
                  })] }),
                  /* @__PURE__ */ (0, n.jsxs)("label", { children: ["內容性質", /* @__PURE__ */ (0, n.jsx)("select", {
                    value: T.origin,
                    onChange: (h) => k({
                      ...T,
                      origin: h.target.value
                    }),
                    children: Object.entries(pp).map(([h, te]) => /* @__PURE__ */ (0, n.jsx)("option", {
                      value: h,
                      children: te
                    }, h))
                  })] }),
                  /* @__PURE__ */ (0, n.jsxs)("label", { children: ["適用範圍", /* @__PURE__ */ (0, n.jsx)("select", {
                    value: T.scopeType,
                    disabled: !!T.supersedesId,
                    onChange: (h) => k({
                      ...T,
                      scopeType: h.target.value,
                      target: ""
                    }),
                    children: Object.entries(lo).map(([h, te]) => /* @__PURE__ */ (0, n.jsx)("option", {
                      value: h,
                      children: te
                    }, h))
                  })] }),
                  /* @__PURE__ */ (0, n.jsxs)("label", { children: ["範圍 ID", /* @__PURE__ */ (0, n.jsx)("input", {
                    required: T.scopeType !== "project",
                    disabled: T.scopeType === "project" || !!T.supersedesId,
                    placeholder: "例如 S06、01 或鏡頭 ID",
                    value: T.target,
                    onChange: (h) => k({
                      ...T,
                      target: h.target.value
                    })
                  })] })
                ]
              }),
              /* @__PURE__ */ (0, n.jsxs)("label", { children: ["內容", /* @__PURE__ */ (0, n.jsx)("textarea", {
                required: !0,
                rows: 5,
                maxLength: 12e3,
                value: T.content,
                onChange: (h) => k({
                  ...T,
                  content: h.target.value
                })
              })] }),
              /* @__PURE__ */ (0, n.jsxs)("label", { children: ["來源依據", /* @__PURE__ */ (0, n.jsx)("input", {
                required: !0,
                maxLength: 2e3,
                placeholder: "原作章節、作者修改要求、檔案名稱與段落等",
                value: T.source,
                onChange: (h) => k({
                  ...T,
                  source: h.target.value
                })
              })] }),
              /* @__PURE__ */ (0, n.jsxs)("label", { children: ["素材位置（選填）", /* @__PURE__ */ (0, n.jsx)("input", {
                maxLength: 2e3,
                placeholder: "可取得的檔案位置或連結；填入不等於已讀取",
                value: T.location,
                onChange: (h) => k({
                  ...T,
                  location: h.target.value
                })
              })] }),
              T.supersedesId && /* @__PURE__ */ (0, n.jsxs)("p", {
                className: "muted",
                children: [
                  "明確取代：",
                  T.supersedesId,
                  "。作者確認前，舊版仍然有效。"
                ]
              }),
              /* @__PURE__ */ (0, n.jsxs)("div", {
                className: "context-actions",
                children: [/* @__PURE__ */ (0, n.jsx)("button", {
                  className: "btn",
                  type: "button",
                  onClick: () => L(!1),
                  children: "取消"
                }), /* @__PURE__ */ (0, n.jsx)("button", {
                  className: "btn primary",
                  disabled: we,
                  children: "保存為待確認提案"
                })]
              })
            ]
          }),
          /* @__PURE__ */ (0, n.jsx)("div", {
            className: "context-records",
            children: (d === "baseline" ? ze : ye).map((h) => /* @__PURE__ */ (0, n.jsxs)("article", {
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
                  Xr[h.kind],
                  " ／ ",
                  pp[h.origin],
                  " ／ ",
                  Qr(h.scope)
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
                    disabled: we,
                    onClick: () => {
                      m("activate_record", { recordId: h.id });
                    },
                    children: "作者確認為有效資料"
                  }) : /* @__PURE__ */ (0, n.jsx)("button", {
                    className: "btn",
                    disabled: we,
                    onClick: () => xt(h.id),
                    children: "提出修改版本"
                  })
                })
              ]
            }, h.id))
          }),
          !(d === "baseline" ? ze : ye).length && !y && /* @__PURE__ */ (0, n.jsxs)("div", {
            className: "empty",
            children: [/* @__PURE__ */ (0, n.jsx)("h3", { children: d === "baseline" ? "尚無有效資料" : "目前沒有待確認提案" }), /* @__PURE__ */ (0, n.jsx)("p", { children: "先登記來源、內容與範圍，再由作者確認。" })]
          }),
          /* @__PURE__ */ (0, n.jsxs)("details", { children: [/* @__PURE__ */ (0, n.jsxs)("summary", { children: [
            "已被取代的歷史版本（",
            p.records.filter((h) => h.status === "superseded").length,
            "）"
          ] }), p.records.filter((h) => h.status === "superseded").map((h) => /* @__PURE__ */ (0, n.jsxs)("article", {
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
              disabled: we,
              onClick: () => K(!z),
              children: "登記矛盾或缺件"
            })]
          }),
          z && /* @__PURE__ */ (0, n.jsxs)("form", {
            className: "context-form",
            onSubmit: async (h) => {
              h.preventDefault(), await m("add_knowledge_problem", {
                type: U.type,
                scope: {
                  type: U.scopeType,
                  target: U.target
                },
                description: U.description,
                recordIds: []
              }) && (K(!1), ie({
                ...U,
                description: ""
              }));
            },
            children: [
              /* @__PURE__ */ (0, n.jsxs)("div", {
                className: "context-form-grid",
                children: [
                  /* @__PURE__ */ (0, n.jsxs)("label", { children: ["問題種類", /* @__PURE__ */ (0, n.jsxs)("select", {
                    value: U.type,
                    onChange: (h) => ie({
                      ...U,
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
                    value: U.scopeType,
                    onChange: (h) => ie({
                      ...U,
                      scopeType: h.target.value,
                      target: ""
                    }),
                    children: Object.entries(lo).map(([h, te]) => /* @__PURE__ */ (0, n.jsx)("option", {
                      value: h,
                      children: te
                    }, h))
                  })] }),
                  /* @__PURE__ */ (0, n.jsxs)("label", { children: ["範圍 ID", /* @__PURE__ */ (0, n.jsx)("input", {
                    required: U.scopeType !== "project",
                    disabled: U.scopeType === "project",
                    value: U.target,
                    onChange: (h) => ie({
                      ...U,
                      target: h.target.value
                    })
                  })] })
                ]
              }),
              /* @__PURE__ */ (0, n.jsxs)("label", { children: ["問題與缺少的依據", /* @__PURE__ */ (0, n.jsx)("textarea", {
                required: !0,
                rows: 4,
                value: U.description,
                onChange: (h) => ie({
                  ...U,
                  description: h.target.value
                })
              })] }),
              /* @__PURE__ */ (0, n.jsx)("button", {
                className: "btn primary",
                disabled: we,
                children: "保存待處理問題"
              })
            ]
          }),
          p.problems.map((h) => /* @__PURE__ */ (0, n.jsxs)("article", {
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
                }), /* @__PURE__ */ (0, n.jsx)("small", { children: Qr(h.scope) })]
              }),
              /* @__PURE__ */ (0, n.jsx)("p", { children: h.description }),
              h.resolution && /* @__PURE__ */ (0, n.jsxs)("p", { children: ["處理結果：", h.resolution] }),
              h.status === "open" && (b === h.id ? /* @__PURE__ */ (0, n.jsxs)("form", {
                onSubmit: async (te) => {
                  te.preventDefault(), await m("resolve_knowledge_problem", {
                    problemId: h.id,
                    resolution: ve
                  }) && (le(""), Me(""));
                },
                children: [
                  /* @__PURE__ */ (0, n.jsxs)("label", {
                    className: "form-field",
                    children: ["作者裁定／補件結果", /* @__PURE__ */ (0, n.jsx)("textarea", {
                      required: !0,
                      rows: 3,
                      value: ve,
                      onChange: (te) => Me(te.target.value)
                    })]
                  }),
                  /* @__PURE__ */ (0, n.jsx)("p", {
                    className: "muted",
                    children: "若涉及設定變更，請另外確認新資料版本；問題結案不會自動修改有效資料。"
                  }),
                  /* @__PURE__ */ (0, n.jsx)("button", {
                    className: "btn primary",
                    disabled: we,
                    children: "作者確認處理完成"
                  })
                ]
              }) : /* @__PURE__ */ (0, n.jsx)("button", {
                className: "btn",
                disabled: we,
                onClick: () => {
                  le(h.id), Me("");
                },
                children: "填寫作者處理結果"
              }))
            ]
          }, h.id)),
          !p.problems.length && /* @__PURE__ */ (0, n.jsx)("p", {
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
              const te = await m("create_context_pack", {
                task: Q,
                stageId: G,
                sceneId: P,
                shotId: ce,
                purpose: fe,
                recordKeys: fe === "documentation" ? I.split(/[,，\n]/).map((tt) => tt.trim()).filter(Boolean) : void 0
              });
              te && F(xl(te).packs.at(-1).id);
            },
            children: [
              /* @__PURE__ */ (0, n.jsxs)("label", { children: ["工作用途", /* @__PURE__ */ (0, n.jsxs)("select", {
                value: fe,
                onChange: (h) => J(h.target.value),
                children: [/* @__PURE__ */ (0, n.jsx)("option", {
                  value: "production",
                  children: "素材製作／檢視"
                }), /* @__PURE__ */ (0, n.jsx)("option", {
                  value: "documentation",
                  children: "資料整理／補登"
                })]
              })] }),
              fe === "documentation" && /* @__PURE__ */ (0, n.jsxs)("label", { children: ["本次來源識別鍵", /* @__PURE__ */ (0, n.jsx)("textarea", {
                required: !0,
                rows: 2,
                value: I,
                onChange: (h) => oe(h.target.value),
                placeholder: "以逗號分隔，最多20筆；可從製作資料或鏡頭關聯取得"
              })] }),
              /* @__PURE__ */ (0, n.jsxs)("label", { children: ["本次任務", /* @__PURE__ */ (0, n.jsx)("textarea", {
                required: !0,
                rows: 2,
                maxLength: 2e3,
                placeholder: "例如：檢查 S06 指定鏡頭的母親座位與場景一致性",
                value: Q,
                onChange: (h) => de(h.target.value)
              })] }),
              /* @__PURE__ */ (0, n.jsxs)("div", {
                className: "context-form-grid",
                children: [
                  /* @__PURE__ */ (0, n.jsxs)("label", { children: ["階段 ID（選填）", /* @__PURE__ */ (0, n.jsx)("input", {
                    placeholder: "例如 08、op01",
                    value: G,
                    onChange: (h) => W(h.target.value)
                  })] }),
                  /* @__PURE__ */ (0, n.jsxs)("label", { children: ["場次 ID（選填）", /* @__PURE__ */ (0, n.jsx)("input", {
                    placeholder: "例如 S06",
                    value: P,
                    onChange: (h) => ae(h.target.value)
                  })] }),
                  /* @__PURE__ */ (0, n.jsxs)("label", { children: ["鏡頭 ID（選填）", /* @__PURE__ */ (0, n.jsx)("input", {
                    placeholder: "素材總表的固定鏡頭 ID",
                    value: ce,
                    onChange: (h) => X(h.target.value)
                  })] })
                ]
              }),
              /* @__PURE__ */ (0, n.jsx)("button", {
                className: "btn primary",
                disabled: we,
                children: "建立並保存資料包"
              })
            ]
          }),
          se ? /* @__PURE__ */ (0, n.jsx)("div", {
            className: "context-pack",
            children: gt(se)
          }) : /* @__PURE__ */ (0, n.jsx)("p", {
            className: "muted",
            children: "尚未建立資料包。AI 可透過 acquire_animation_context 取得同一份資料。"
          }),
          se?.purpose === "documentation" && se.projectRevision === r.revision && /* @__PURE__ */ (0, n.jsxs)("details", { children: [/* @__PURE__ */ (0, n.jsx)("summary", { children: "回報本次資料整理結果" }), /* @__PURE__ */ (0, n.jsxs)("form", {
            className: "context-form",
            onSubmit: async (h) => {
              h.preventDefault(), await m("submit_ai_work", {
                contextPackId: se.id,
                resultId: crypto.randomUUID(),
                status: "completed",
                summary: V,
                nextStep: Y,
                recordIds: se.records.map((te) => te.id),
                observations: se.records.map((te) => ({
                  recordId: te.id,
                  version: te.version,
                  note: S[te.id] ?? ""
                })),
                artifacts: [{
                  location: ue,
                  version: x,
                  description: Z
                }]
              });
            },
            children: [
              /* @__PURE__ */ (0, n.jsxs)("label", { children: ["本次完成內容", /* @__PURE__ */ (0, n.jsx)("textarea", {
                required: !0,
                rows: 3,
                value: V,
                onChange: (h) => R(h.target.value)
              })] }),
              /* @__PURE__ */ (0, n.jsxs)("label", { children: ["下一位 AI 接手動作", /* @__PURE__ */ (0, n.jsx)("textarea", {
                required: !0,
                rows: 3,
                value: Y,
                onChange: (h) => pe(h.target.value)
              })] }),
              se.records.map((h) => /* @__PURE__ */ (0, n.jsxs)("label", { children: [
                "實際閱讀依據｜",
                h.title,
                /* @__PURE__ */ (0, n.jsx)("textarea", {
                  required: !0,
                  rows: 2,
                  maxLength: 3e3,
                  value: S[h.id] ?? "",
                  onChange: (te) => $({
                    ...S,
                    [h.id]: te.target.value
                  })
                })
              ] }, h.id)),
              /* @__PURE__ */ (0, n.jsxs)("label", { children: ["整理成果位置", /* @__PURE__ */ (0, n.jsx)("input", {
                required: !0,
                maxLength: 2e3,
                value: ue,
                onChange: (h) => Ae(h.target.value)
              })] }),
              /* @__PURE__ */ (0, n.jsxs)("label", { children: ["整理成果版本", /* @__PURE__ */ (0, n.jsx)("input", {
                required: !0,
                maxLength: 100,
                value: x,
                onChange: (h) => H(h.target.value)
              })] }),
              /* @__PURE__ */ (0, n.jsxs)("label", { children: ["整理成果說明", /* @__PURE__ */ (0, n.jsx)("input", {
                required: !0,
                maxLength: 2e3,
                value: Z,
                onChange: (h) => ee(h.target.value)
              })] }),
              /* @__PURE__ */ (0, n.jsx)("button", {
                className: "btn primary",
                disabled: we,
                children: "保存資料整理結果"
              })
            ]
          })] }),
          p.packs.length > 1 && /* @__PURE__ */ (0, n.jsxs)("details", { children: [/* @__PURE__ */ (0, n.jsxs)("summary", { children: [
            "先前資料包（",
            p.packs.length - 1,
            "）"
          ] }), [...p.packs].reverse().map((h) => /* @__PURE__ */ (0, n.jsxs)("button", {
            className: "text-btn",
            onClick: () => F(h.id),
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
          [...p.results].reverse().map((h) => /* @__PURE__ */ (0, n.jsxs)("article", {
            className: "context-record",
            children: [
              /* @__PURE__ */ (0, n.jsxs)("div", {
                className: "issue-top",
                children: [/* @__PURE__ */ (0, n.jsx)("span", {
                  className: "status " + (h.needsReview ? "needs_revision" : h.status === "blocked" ? "todo" : "candidate"),
                  children: h.needsReview ? p.packs.find((te) => te.id === h.packId)?.purpose === "documentation" ? "採用設定已更新，接手前讀取新版本" : "依據已變更，需重驗" : h.status === "completed" ? p.packs.find((te) => te.id === h.packId)?.purpose === "documentation" ? "資料整理完成" : "AI 回報完成，待作者驗收" : h.status === "partial" ? "部分完成" : "受阻"
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
              h.artifacts.map((te, tt) => /* @__PURE__ */ (0, n.jsxs)("p", { children: [
                te.description,
                " · ",
                te.version,
                /* @__PURE__ */ (0, n.jsx)("code", {
                  className: "context-id",
                  children: te.location
                })
              ] }, tt)),
              /* @__PURE__ */ (0, n.jsxs)("details", { children: [/* @__PURE__ */ (0, n.jsx)("summary", { children: "使用版本與閱讀自述" }), /* @__PURE__ */ (0, n.jsx)("pre", { children: JSON.stringify({
                packId: h.packId,
                recordIds: h.recordIds,
                observations: h.observations
              }, null, 2) })] })
            ]
          }, h.id)),
          !p.results.length && /* @__PURE__ */ (0, n.jsxs)("div", {
            className: "empty",
            children: [/* @__PURE__ */ (0, n.jsx)("h3", { children: "等待 AI 回報工作" }), /* @__PURE__ */ (0, n.jsx)("p", { children: "工具 submit_animation_work 會保存結果與交接內容。" })]
          })
        ] })
      })
    ]
  });
}
var wp = [
  ["coverage", "原作與改編範圍"],
  ["endingState", "本集結尾狀態"],
  ["characters", "人物狀態與關係"],
  ["revealed", "已揭露資訊與邊界"],
  ["unresolved", "尚未確定的內容"],
  ["carryRules", "後續集數沿用規則"],
  ["nextSteps", "下一步與接手順序"],
  ["sources", "來源與版本說明"]
], hp = {
  title: "",
  coverage: "",
  endingState: "",
  characters: "",
  revealed: "",
  unresolved: "",
  carryRules: "",
  nextSteps: "",
  sources: ""
}, Fm = {
  completed: "作者告知已完成",
  in_progress: "作者告知製作中",
  not_started: "作者告知尚未開始"
};
function Kr({ h: r, target: m }) {
  return /* @__PURE__ */ (0, n.jsxs)("div", {
    className: "handoff-body",
    children: [
      /* @__PURE__ */ (0, n.jsxs)("h3", { children: [
        r.title,
        " · v",
        r.version
      ] }),
      /* @__PURE__ */ (0, n.jsxs)("p", {
        className: "inline-note",
        children: [
          "來源整理 → ",
          m,
          "。內容按所列版本交接；尚未對上成片的部分保留疑點，不自動變成下一集採用設定。"
        ]
      }),
      wp.map(([C, p]) => /* @__PURE__ */ (0, n.jsxs)("div", {
        className: "context-mini",
        children: [/* @__PURE__ */ (0, n.jsx)("b", { children: p }), /* @__PURE__ */ (0, n.jsx)("p", {
          className: "production-source-text",
          children: r[C]
        })]
      }, C)),
      /* @__PURE__ */ (0, n.jsxs)("details", { children: [
        /* @__PURE__ */ (0, n.jsx)("summary", { children: "來源識別鍵與版本紀錄" }),
        /* @__PURE__ */ (0, n.jsx)("p", { children: r.sourceKeys.join("、") }),
        /* @__PURE__ */ (0, n.jsxs)("small", { children: [
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
function Pm({ project: r, episodes: m, busy: C, mutate: p }) {
  const d = r.production?.completionReports?.at(-1), M = r.production?.handoffs?.at(-1), y = m.filter((X) => X.workId === r.workId && X.id !== r.id), [L, T] = (0, A.useState)("completed"), [k, z] = (0, A.useState)(""), [K, U] = (0, A.useState)(""), [ie, fe] = (0, A.useState)(""), [J, I] = (0, A.useState)(hp), [oe, Q] = (0, A.useState)(""), [de, G] = (0, A.useState)([]), [W, P] = (0, A.useState)("");
  (0, A.useEffect)(() => {
    T(d?.status ?? "completed"), z(d?.note ?? ""), U(d?.source ?? ""), fe(M?.toEpisodeId ?? ""), I(M ?? hp), Q(M?.sourceKeys.join(", ") ?? "");
  }, [
    r.id,
    d?.at,
    M?.id
  ]), (0, A.useEffect)(() => {
    let X = !0;
    return G([]), fetch("/api/projects?id=" + encodeURIComponent(r.id) + "&view=brief", { cache: "no-store" }).then(async (b) => {
      const le = await b.json();
      if (!b.ok) throw new Error(le.error ?? "接續資料讀取失敗");
      X && (G(le.incoming), P(""));
    }).catch((b) => {
      X && P(b.message);
    }), () => {
      X = !1;
    };
  }, [r.id, r.revision]);
  const ae = ro(r).registration, ce = C || r.archived;
  return /* @__PURE__ */ (0, n.jsxs)("section", {
    className: "wide-card episode-brief",
    children: [
      /* @__PURE__ */ (0, n.jsx)("div", {
        className: "eyebrow",
        children: "EPISODE HANDOFF"
      }),
      /* @__PURE__ */ (0, n.jsxs)("h2", { children: [r.episode, " 狀態與接續"] }),
      /* @__PURE__ */ (0, n.jsxs)("div", {
        className: "production-totals",
        children: [
          /* @__PURE__ */ (0, n.jsx)("b", { children: d ? Fm[d.status] : "製作狀態尚未登記" }),
          /* @__PURE__ */ (0, n.jsxs)("span", { children: [
            ae.acceptedSources,
            " / ",
            ae.sources,
            " 筆來源已收錄"
          ] }),
          /* @__PURE__ */ (0, n.jsxs)("span", { children: [
            ae.linkedShots,
            " / ",
            ae.shots,
            " 列鏡頭有關聯"
          ] }),
          /* @__PURE__ */ (0, n.jsxs)("span", { children: [ae.registeredSelections, " 列已登記採用檔"] })
        ]
      }),
      d && /* @__PURE__ */ (0, n.jsxs)(n.Fragment, { children: [/* @__PURE__ */ (0, n.jsx)("p", { children: d.note }), /* @__PURE__ */ (0, n.jsxs)("small", { children: ["作者告知依據：", d.source] })] }),
      /* @__PURE__ */ (0, n.jsx)("p", {
        className: "inline-note",
        children: "製作完成、資料補登及素材實際檢視各自記錄。未登記檔案位置不等於尚未製作。"
      }),
      /* @__PURE__ */ (0, n.jsxs)("details", { children: [/* @__PURE__ */ (0, n.jsx)("summary", { children: "補登本集製作狀態" }), /* @__PURE__ */ (0, n.jsxs)("form", {
        className: "context-form",
        onSubmit: async (X) => {
          X.preventDefault(), await p("report_episode_completion", {
            status: L,
            note: k,
            source: K
          });
        },
        children: [
          /* @__PURE__ */ (0, n.jsxs)("label", { children: ["作者告知的製作狀態", /* @__PURE__ */ (0, n.jsxs)("select", {
            value: L,
            onChange: (X) => T(X.target.value),
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
            value: k,
            onChange: (X) => z(X.target.value)
          })] }),
          /* @__PURE__ */ (0, n.jsxs)("label", { children: ["告知來源", /* @__PURE__ */ (0, n.jsx)("input", {
            required: !0,
            maxLength: 2e3,
            value: K,
            onChange: (X) => U(X.target.value)
          })] }),
          /* @__PURE__ */ (0, n.jsx)("button", {
            className: "btn primary",
            disabled: ce,
            children: "保存作者告知狀態"
          })
        ]
      })] }),
      W && /* @__PURE__ */ (0, n.jsx)("p", {
        role: "alert",
        children: W
      }),
      de.map((X) => /* @__PURE__ */ (0, n.jsxs)("details", {
        className: "production-record",
        children: [/* @__PURE__ */ (0, n.jsxs)("summary", { children: [/* @__PURE__ */ (0, n.jsxs)("b", { children: [
          "來自 ",
          X.fromEpisode,
          " 的接續資料"
        ] }), /* @__PURE__ */ (0, n.jsxs)("span", { children: [
          "v",
          X.handoff.version,
          " · 來源集數紀錄版本 ",
          X.fromRevision
        ] })] }), /* @__PURE__ */ (0, n.jsx)(Kr, {
          h: X.handoff,
          target: r.episode
        })]
      }, X.handoff.id)),
      M ? /* @__PURE__ */ (0, n.jsxs)("details", {
        className: "production-record",
        children: [/* @__PURE__ */ (0, n.jsxs)("summary", { children: [/* @__PURE__ */ (0, n.jsxs)("b", { children: ["交接至 ", m.find((X) => X.id === M.toEpisodeId)?.episode ?? "指定集數"] }), /* @__PURE__ */ (0, n.jsxs)("span", { children: ["接續資料 v", M.version] })] }), /* @__PURE__ */ (0, n.jsx)(Kr, {
          h: M,
          target: m.find((X) => X.id === M.toEpisodeId)?.episode ?? "指定集數"
        })]
      }) : /* @__PURE__ */ (0, n.jsx)("p", {
        className: "muted",
        children: "尚未保存本集對後續集數的交接資料。"
      }),
      /* @__PURE__ */ (0, n.jsxs)("details", { children: [/* @__PURE__ */ (0, n.jsx)("summary", { children: M ? "更新接續資料版本" : "補登跨集接續資料" }), y.length ? /* @__PURE__ */ (0, n.jsxs)("form", {
        className: "context-form",
        onSubmit: async (X) => {
          X.preventDefault(), await p("save_episode_handoff", {
            ...J,
            toEpisodeId: ie || y[0].id,
            baseVersion: M?.version ?? 0,
            sourceKeys: oe.split(/[,，\n]/).map((b) => b.trim()).filter(Boolean)
          });
        },
        children: [
          /* @__PURE__ */ (0, n.jsxs)("label", { children: ["接續目標集數", /* @__PURE__ */ (0, n.jsx)("select", {
            value: ie || y[0].id,
            onChange: (X) => fe(X.target.value),
            children: y.map((X) => /* @__PURE__ */ (0, n.jsxs)("option", {
              value: X.id,
              children: [
                X.episode,
                " · ",
                X.title
              ]
            }, X.id))
          })] }),
          /* @__PURE__ */ (0, n.jsxs)("label", { children: ["接續資料名稱", /* @__PURE__ */ (0, n.jsx)("input", {
            required: !0,
            maxLength: 200,
            value: J.title,
            onChange: (X) => I({
              ...J,
              title: X.target.value
            })
          })] }),
          wp.map(([X, b]) => /* @__PURE__ */ (0, n.jsxs)("label", { children: [b, /* @__PURE__ */ (0, n.jsx)("textarea", {
            required: !0,
            rows: 3,
            maxLength: 6e3,
            value: J[X],
            onChange: (le) => I({
              ...J,
              [X]: le.target.value
            })
          })] }, X)),
          /* @__PURE__ */ (0, n.jsxs)("label", { children: ["來源識別鍵（逗號分隔）", /* @__PURE__ */ (0, n.jsx)("textarea", {
            rows: 2,
            value: oe,
            onChange: (X) => Q(X.target.value)
          })] }),
          /* @__PURE__ */ (0, n.jsx)("button", {
            className: "btn primary",
            disabled: ce,
            children: "保存接續資料版本"
          })
        ]
      }) : /* @__PURE__ */ (0, n.jsx)("p", { children: "先在作品專案新增下一集，再建立交接。" })] }),
      (r.production?.handoffs?.length ?? 0) > 1 && /* @__PURE__ */ (0, n.jsxs)("details", { children: [/* @__PURE__ */ (0, n.jsxs)("summary", { children: [
        "先前接續版本（",
        r.production.handoffs.length - 1,
        "）"
      ] }), r.production.handoffs.slice(0, -1).map((X) => /* @__PURE__ */ (0, n.jsx)(Kr, {
        h: X,
        target: m.find((b) => b.id === X.toEpisodeId)?.episode ?? X.toEpisodeId
      }, X.id))] }),
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
var Jr = {
  key: "",
  title: "",
  kind: "reference",
  content: "",
  source: "",
  location: "",
  baseVersion: void 0
};
function ex({ work: r, episode: m, episodes: C, busy: p, onWorkAction: d, onSelectEpisode: M, onPin: y, mutate: L }) {
  const [T, k] = (0, A.useState)(m.title.split("｜")[0]), [z, K] = (0, A.useState)(""), [U, ie] = (0, A.useState)(""), [fe, J] = (0, A.useState)(""), [I, oe] = (0, A.useState)(""), [Q, de] = (0, A.useState)(""), [G, W] = (0, A.useState)(Jr), [P, ae] = (0, A.useState)(!1);
  if (!r) return /* @__PURE__ */ (0, n.jsxs)("section", {
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
        onSubmit: async (g) => {
          g.preventDefault(), await d("convert_episode", {
            title: T,
            episodeId: m.id,
            episodeRevision: m.revision
          });
        },
        children: [/* @__PURE__ */ (0, n.jsxs)("label", { children: ["作品專案名稱", /* @__PURE__ */ (0, n.jsx)("input", {
          required: !0,
          maxLength: 200,
          value: T,
          onChange: (g) => k(g.target.value)
        })] }), /* @__PURE__ */ (0, n.jsx)("button", {
          className: "btn primary",
          disabled: p,
          children: "建立作品專案並保留本集"
        })]
      })
    ]
  });
  const ce = C.filter((g) => g.workId === r.id).sort((g, F) => g.episode.localeCompare(F.episode, void 0, { numeric: !0 })), X = Math.max(0, ...ce.map((g) => Number(g.episode.replace(/^EP/i, "")) || 0)) + 1, b = "EP" + String(X).padStart(2, "0"), le = [...new Map(r.sharedAssets.map((g) => [g.key, g])).values()], ve = le.filter((g) => !fe || [
    g.key,
    g.title,
    g.content,
    g.source
  ].join(" ").toLowerCase().includes(fe.toLowerCase()));
  function Me(g) {
    W({
      key: g.key,
      title: g.title,
      kind: g.kind,
      content: g.content,
      source: g.source,
      location: g.location,
      baseVersion: g.version
    }), ae(!0);
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
          /* @__PURE__ */ (0, n.jsx)("h2", { children: r.title }),
          /* @__PURE__ */ (0, n.jsx)("p", { children: "作品專案 → 集數 → 場次與鏡頭。小說卷次、章次與動畫集數分別記錄。" }),
          /* @__PURE__ */ (0, n.jsxs)("div", {
            className: "production-totals",
            children: [
              /* @__PURE__ */ (0, n.jsxs)("b", { children: [ce.length, " 集"] }),
              /* @__PURE__ */ (0, n.jsxs)("b", { children: [le.length, " 項共用來源"] }),
              /* @__PURE__ */ (0, n.jsx)("span", { children: "各集保留自己的劇本、進度與採用版本。" })
            ]
          }),
          /* @__PURE__ */ (0, n.jsx)("div", {
            className: "episode-grid",
            children: ce.map((g) => /* @__PURE__ */ (0, n.jsxs)("button", {
              className: "episode-card " + (g.id === m.id ? "selected" : ""),
              disabled: p,
              onClick: () => M(g.id),
              children: [
                /* @__PURE__ */ (0, n.jsx)("small", { children: g.episode }),
                /* @__PURE__ */ (0, n.jsx)("b", { children: g.title }),
                /* @__PURE__ */ (0, n.jsxs)("span", { children: [
                  g.shots,
                  " 列鏡頭 · ",
                  g.id === m.id ? "目前集數" : "開啟本集",
                  g.completionReport?.status === "completed" ? " · 作者告知完成" : ""
                ] })
              ]
            }, g.id))
          }),
          /* @__PURE__ */ (0, n.jsxs)("details", { children: [/* @__PURE__ */ (0, n.jsx)("summary", { children: "新增後續集數" }), /* @__PURE__ */ (0, n.jsxs)("form", {
            className: "context-form",
            onSubmit: async (g) => {
              g.preventDefault(), await d("create_episode", {
                episode: z || b,
                title: U || `${z || b} 製作資料`
              }) && (K(""), ie(""));
            },
            children: [
              /* @__PURE__ */ (0, n.jsxs)("div", {
                className: "context-form-grid",
                children: [/* @__PURE__ */ (0, n.jsxs)("label", { children: ["新集數", /* @__PURE__ */ (0, n.jsx)("input", {
                  required: !0,
                  pattern: "[Ee][Pp][0-9]{2,4}",
                  value: z || b,
                  onChange: (g) => K(g.target.value),
                  placeholder: "EP02"
                })] }), /* @__PURE__ */ (0, n.jsxs)("label", { children: ["本集名稱", /* @__PURE__ */ (0, n.jsx)("input", {
                  maxLength: 200,
                  value: U,
                  onChange: (g) => ie(g.target.value),
                  placeholder: `${z || b} 製作資料`
                })] })]
              }),
              /* @__PURE__ */ (0, n.jsx)("p", {
                className: "muted",
                children: "建立空白流程；EP01 的劇情、鏡頭及完成狀態不會複製到下一集。"
              }),
              /* @__PURE__ */ (0, n.jsx)("button", {
                className: "btn primary",
                disabled: p,
                children: "建立新集數"
              })
            ]
          })] })
        ]
      }),
      /* @__PURE__ */ (0, n.jsx)(Pm, {
        project: m,
        episodes: C,
        busy: p,
        mutate: L
      }),
      /* @__PURE__ */ (0, n.jsxs)("div", {
        className: "wide-card",
        children: [
          /* @__PURE__ */ (0, n.jsxs)("div", {
            className: "section-title",
            children: [/* @__PURE__ */ (0, n.jsxs)("div", { children: [/* @__PURE__ */ (0, n.jsx)("h2", { children: "作品共用資料" }), /* @__PURE__ */ (0, n.jsx)("p", { children: "原作、角色、場景、世界設定及聲線參考。連結到集數時保存指定版本，之後更新共用資料仍保留各集原先使用的版本。" })] }), /* @__PURE__ */ (0, n.jsx)("button", {
              className: "btn",
              disabled: p,
              onClick: () => {
                W(Jr), ae(!P);
              },
              children: "新增共用參考"
            })]
          }),
          P && /* @__PURE__ */ (0, n.jsxs)("form", {
            className: "context-form",
            onSubmit: async (g) => {
              g.preventDefault(), await d("save_shared_asset", G) && (ae(!1), W(Jr));
            },
            children: [
              /* @__PURE__ */ (0, n.jsxs)("div", {
                className: "context-form-grid",
                children: [
                  /* @__PURE__ */ (0, n.jsxs)("label", { children: ["共用識別鍵", /* @__PURE__ */ (0, n.jsx)("input", {
                    required: !0,
                    readOnly: G.baseVersion !== void 0,
                    maxLength: 110,
                    value: G.key,
                    onChange: (g) => W({
                      ...G,
                      key: g.target.value
                    })
                  })] }),
                  /* @__PURE__ */ (0, n.jsxs)("label", { children: ["共用名稱", /* @__PURE__ */ (0, n.jsx)("input", {
                    required: !0,
                    maxLength: 200,
                    value: G.title,
                    onChange: (g) => W({
                      ...G,
                      title: g.target.value
                    })
                  })] }),
                  /* @__PURE__ */ (0, n.jsxs)("label", { children: ["資料種類", /* @__PURE__ */ (0, n.jsx)("select", {
                    value: G.kind,
                    onChange: (g) => W({
                      ...G,
                      kind: g.target.value
                    }),
                    children: [
                      ["reference", "原作／參考"],
                      ["character", "角色"],
                      ["scene", "場景"],
                      ["rule", "世界設定／規則"],
                      ["audio", "聲線／聲音"],
                      ["script", "文本"]
                    ].map(([g, F]) => /* @__PURE__ */ (0, n.jsx)("option", {
                      value: g,
                      children: F
                    }, g))
                  })] })
                ]
              }),
              /* @__PURE__ */ (0, n.jsxs)("label", { children: ["完整內容", /* @__PURE__ */ (0, n.jsx)("textarea", {
                required: !0,
                rows: 7,
                maxLength: 12e3,
                value: G.content,
                onChange: (g) => W({
                  ...G,
                  content: g.target.value
                })
              })] }),
              /* @__PURE__ */ (0, n.jsxs)("label", { children: ["來源", /* @__PURE__ */ (0, n.jsx)("input", {
                required: !0,
                maxLength: 2e3,
                value: G.source,
                onChange: (g) => W({
                  ...G,
                  source: g.target.value
                })
              })] }),
              /* @__PURE__ */ (0, n.jsxs)("label", { children: ["素材位置", /* @__PURE__ */ (0, n.jsx)("input", {
                maxLength: 2e3,
                value: G.location,
                onChange: (g) => W({
                  ...G,
                  location: g.target.value
                })
              })] }),
              /* @__PURE__ */ (0, n.jsx)("button", {
                className: "btn primary",
                disabled: p,
                children: G.baseVersion ? "保存新版本" : "保存共用來源"
              })
            ]
          }),
          /* @__PURE__ */ (0, n.jsxs)("label", {
            className: "work-search",
            children: ["搜尋共用資料", /* @__PURE__ */ (0, n.jsx)("input", {
              placeholder: "原作章名、角色、場景或設定",
              value: fe,
              onChange: (g) => J(g.target.value)
            })]
          }),
          /* @__PURE__ */ (0, n.jsxs)("p", {
            className: "muted",
            children: [
              ve.length,
              " 項來源；目前連結目標為 ",
              m.episode,
              "。"
            ]
          }),
          ve.slice(0, 60).map((g) => /* @__PURE__ */ (0, n.jsxs)("details", {
            className: "production-record",
            children: [
              /* @__PURE__ */ (0, n.jsxs)("summary", { children: [/* @__PURE__ */ (0, n.jsx)("b", { children: g.title }), /* @__PURE__ */ (0, n.jsxs)("span", {
                className: "status candidate",
                children: ["共用參考 v", g.version]
              })] }),
              /* @__PURE__ */ (0, n.jsx)("code", {
                className: "context-id",
                children: g.key
              }),
              /* @__PURE__ */ (0, n.jsx)("div", {
                className: "production-source-text",
                children: g.content
              }),
              /* @__PURE__ */ (0, n.jsxs)("p", { children: ["來源：", g.source] }),
              /* @__PURE__ */ (0, n.jsxs)("p", { children: ["素材位置：", g.location || "文字已收錄"] }),
              g.originEpisodeId && /* @__PURE__ */ (0, n.jsxs)("p", {
                className: "muted",
                children: [
                  "保留來源集數：",
                  C.find((F) => F.id === g.originEpisodeId)?.episode ?? g.originEpisodeId,
                  "；按本集需求選用。"
                ]
              }),
              /* @__PURE__ */ (0, n.jsxs)("div", {
                className: "context-actions",
                children: [/* @__PURE__ */ (0, n.jsx)("button", {
                  className: "btn",
                  disabled: p || !!m.sharedPins?.some((F) => F.assetId === g.id),
                  onClick: () => {
                    y(g.id);
                  },
                  children: m.sharedPins?.some((F) => F.assetId === g.id) ? `${m.episode} 已連結此版本` : `連結此版本至 ${m.episode}`
                }), /* @__PURE__ */ (0, n.jsx)("button", {
                  className: "btn",
                  disabled: p,
                  onClick: () => Me(g),
                  children: "建立新版本"
                })]
              }),
              (m.sharedPins?.filter((F) => F.assetKey === g.key).at(-1)?.version ?? g.version) < g.version && /* @__PURE__ */ (0, n.jsx)("p", {
                className: "inline-note",
                children: "本集仍連結較舊版本，沿用內容保持不變；需要時再連結新版本。"
              })
            ]
          }, g.id)),
          /* @__PURE__ */ (0, n.jsxs)("details", {
            className: "production-import",
            children: [
              /* @__PURE__ */ (0, n.jsx)("summary", { children: "批次補入作品共用來源" }),
              /* @__PURE__ */ (0, n.jsx)("p", { children: "貼上包含 assets 清單的 JSON。每項須有 key、title、kind、content、source；識別鍵重複時拒絕覆寫。" }),
              /* @__PURE__ */ (0, n.jsxs)("label", { children: ["作品來源 JSON", /* @__PURE__ */ (0, n.jsx)("textarea", {
                rows: 5,
                value: I,
                onChange: (g) => {
                  oe(g.target.value), de("");
                }
              })] }),
              Q && /* @__PURE__ */ (0, n.jsx)("p", {
                role: "alert",
                children: Q
              }),
              /* @__PURE__ */ (0, n.jsx)("button", {
                className: "btn primary",
                disabled: p || !I.trim(),
                onClick: async () => {
                  try {
                    const g = JSON.parse(I);
                    if (!Array.isArray(g.assets)) throw new Error("缺少 assets 清單");
                    await d("import_shared_assets", { assets: g.assets }) && oe("");
                  } catch (g) {
                    de(g instanceof Error ? g.message : "格式錯誤");
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
var mp = {
  key: "",
  title: "",
  world: "real",
  label: "v2_candidate",
  sourceLocation: "",
  sourceVersion: "",
  backupLocation: "",
  sha256: "",
  reference: ""
}, tx = {
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
function ax({ initialSelection: r, work: m, episode: C, episodes: p, busy: d, onAction: M, onProject: y, onDirty: L }) {
  const [T, k] = (0, A.useState)(r?.modelId ?? ""), [z, K] = (0, A.useState)(r?.versionId ?? ""), [U, ie] = (0, A.useState)(r?.stageId ?? "M01"), [fe, J] = (0, A.useState)(null), [I, oe] = (0, A.useState)(mp), [Q, de] = (0, A.useState)(""), G = m ? _s(m) : null, W = G?.models.find((E) => E.id === T) ?? G?.models[0], P = W?.versions.find((E) => E.id === z) ?? W?.versions.at(-1), ae = P?.stages[U], ce = za.find((E) => E.id === U);
  function X(E) {
    Je(E), L(E);
  }
  const [b, le] = (0, A.useState)([]), [ve, Me] = (0, A.useState)(""), [g, F] = (0, A.useState)(""), [V, R] = (0, A.useState)(""), [Y, pe] = (0, A.useState)(""), [ue, Ae] = (0, A.useState)(""), [x, H] = (0, A.useState)("technical"), [Z, ee] = (0, A.useState)({}), [S, $] = (0, A.useState)(""), [se, ze] = (0, A.useState)(""), [ye, Je] = (0, A.useState)(!1);
  (0, A.useEffect)(() => {
    ae && (le(ae.checks), Me(ae.evidence), F(ae.summary), R(ae.nextStep), pe(P.candidateLocation), X(!1));
  }, [ae, P]), (0, A.useEffect)(() => {
    if (!ye) return;
    const E = (be) => be.preventDefault();
    return window.addEventListener("beforeunload", E), () => window.removeEventListener("beforeunload", E);
  }, [ye]);
  function Ge(E) {
    ye && !window.confirm("有未儲存模型紀錄，要放棄修改嗎？") || (X(!1), de(""), E());
  }
  async function we(E, be) {
    de("");
    const at = await M(E, be);
    return at && X(!1), at;
  }
  function Xe() {
    !W || !P || (oe({
      key: W.key,
      title: W.title,
      world: W.world,
      label: "v" + (P.number + 2) + "_candidate",
      sourceLocation: P.sourceLocation,
      sourceVersion: P.sourceVersion,
      backupLocation: P.backupLocation,
      sha256: P.sha256,
      reference: P.reference
    }), J("version"));
  }
  if (!m) return /* @__PURE__ */ (0, n.jsxs)("section", {
    className: "wide-card",
    children: [
      /* @__PURE__ */ (0, n.jsx)("h2", { children: "3D 模型製作流程" }),
      /* @__PURE__ */ (0, n.jsx)("p", {
        className: "stage-description",
        children: "模型屬於作品共用資產。先把本集整理到作品專案，即可登記模型及候選版本，供後續各集引用。"
      }),
      /* @__PURE__ */ (0, n.jsxs)("button", {
        className: "btn primary",
        onClick: y,
        children: ["前往作品專案 ", /* @__PURE__ */ (0, n.jsx)(an, { size: 15 })]
      })
    ]
  });
  const xt = G.issues.filter((E) => E.modelId === W?.id && E.versionId === P?.id), gt = xt.filter((E) => E.status === "open"), h = !!P?.stages.M08.author, te = W && P ? Mm(m, W.id, P.id, U) : [], tt = G.pins.filter((E) => E.episodeId === C.id), Dt = new Map(tt.map((E) => [[E.modelId, E.sceneIds].join("|"), E]));
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
            /* @__PURE__ */ (0, n.jsxs)("h2", { children: [/* @__PURE__ */ (0, n.jsx)(eo, { size: 23 }), "模型製作與完善"] }),
            /* @__PURE__ */ (0, n.jsxs)("p", { children: [m.title, " · 各模型、各候選及各集引用分開記錄。"] })
          ] }), /* @__PURE__ */ (0, n.jsxs)("button", {
            className: "btn primary",
            disabled: d,
            onClick: () => Ge(() => {
              oe(mp), J("register");
            }),
            children: [/* @__PURE__ */ (0, n.jsx)(aa, { size: 15 }), "登記模型"]
          })]
        }), /* @__PURE__ */ (0, n.jsxs)("div", {
          className: "model-principles",
          children: [
            /* @__PURE__ */ (0, n.jsxs)("span", { children: [/* @__PURE__ */ (0, n.jsx)(ml, { size: 15 }), "先讀原檔與設定"] }),
            /* @__PURE__ */ (0, n.jsxs)("span", { children: [/* @__PURE__ */ (0, n.jsx)(to, { size: 15 }), "保留原檔及版本"] }),
            /* @__PURE__ */ (0, n.jsxs)("span", { children: [/* @__PURE__ */ (0, n.jsx)(sn, { size: 15 }), "技術、視覺與採用分開"] })
          ]
        })]
      }),
      fe && /* @__PURE__ */ (0, n.jsxs)("form", {
        className: "wide-card context-form model-register",
        onSubmit: async (E) => {
          E.preventDefault();
          const be = await we(fe === "register" ? "register_model" : "create_model_version", {
            ...I,
            modelId: W?.id
          });
          if (be) {
            const at = fe === "register" ? be.work.modelFlow?.models.at(-1) : be.work.modelFlow?.models.find((Jt) => Jt.id === W?.id);
            J(null), k(at?.id ?? ""), K(at?.versions.at(-1)?.id ?? ""), ie("M01");
          }
        },
        children: [
          /* @__PURE__ */ (0, n.jsxs)("div", {
            className: "section-title",
            children: [/* @__PURE__ */ (0, n.jsx)("h3", { children: fe === "register" ? "登記模型來源" : "建立新候選版本" }), /* @__PURE__ */ (0, n.jsx)("button", {
              className: "text-btn",
              type: "button",
              onClick: () => J(null),
              children: "關閉"
            })]
          }),
          /* @__PURE__ */ (0, n.jsxs)("div", {
            className: "context-form-grid",
            children: [
              fe === "register" && /* @__PURE__ */ (0, n.jsxs)(n.Fragment, { children: [
                /* @__PURE__ */ (0, n.jsxs)("label", { children: ["模型固定識別鍵 *", /* @__PURE__ */ (0, n.jsx)("input", {
                  required: !0,
                  maxLength: 100,
                  value: I.key,
                  placeholder: "RG-REAL-01",
                  onChange: (E) => oe({
                    ...I,
                    key: E.target.value
                  })
                })] }),
                /* @__PURE__ */ (0, n.jsxs)("label", { children: ["模型名稱 *", /* @__PURE__ */ (0, n.jsx)("input", {
                  required: !0,
                  maxLength: 200,
                  value: I.title,
                  placeholder: "現實主角家",
                  onChange: (E) => oe({
                    ...I,
                    title: E.target.value
                  })
                })] }),
                /* @__PURE__ */ (0, n.jsxs)("label", { children: ["世界／場景分類", /* @__PURE__ */ (0, n.jsxs)("select", {
                  value: I.world,
                  onChange: (E) => oe({
                    ...I,
                    world: E.target.value
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
                onChange: (E) => oe({
                  ...I,
                  label: E.target.value
                })
              })] }),
              [
                ["sourceLocation", "正式來源 GLB 位置 *"],
                ["sourceVersion", "來源版本／清單版本 *"],
                ["backupLocation", "原檔備份位置"],
                ["sha256", "原檔 SHA-256（實際計算值）"]
              ].map(([E, be]) => /* @__PURE__ */ (0, n.jsxs)("label", { children: [be, /* @__PURE__ */ (0, n.jsx)("input", {
                required: E === "sourceLocation" || E === "sourceVersion",
                maxLength: E === "sha256" ? 64 : 2e3,
                pattern: E === "sha256" ? "[a-fA-F0-9]{64}" : void 0,
                value: I[E],
                onChange: (at) => oe({
                  ...I,
                  [E]: at.target.value
                })
              })] }, E))
            ]
          }),
          /* @__PURE__ */ (0, n.jsxs)("label", { children: ["設定與尺度來源／不可改動項目", /* @__PURE__ */ (0, n.jsx)("textarea", {
            rows: 4,
            maxLength: 12e3,
            value: I.reference,
            onChange: (E) => oe({
              ...I,
              reference: E.target.value
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
      !W || !P ? /* @__PURE__ */ (0, n.jsxs)("div", {
        className: "wide-card empty",
        children: [
          /* @__PURE__ */ (0, n.jsx)(eo, { size: 36 }),
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
                  value: W.id,
                  disabled: d,
                  onChange: (E) => Ge(() => {
                    k(E.target.value), K(""), ie("M01");
                  }),
                  children: G.models.map((E) => /* @__PURE__ */ (0, n.jsxs)("option", {
                    value: E.id,
                    children: [
                      E.key,
                      " · ",
                      E.title
                    ]
                  }, E.id))
                })] }),
                /* @__PURE__ */ (0, n.jsxs)("label", { children: ["精確版本", /* @__PURE__ */ (0, n.jsx)("select", {
                  value: P.id,
                  disabled: d,
                  onChange: (E) => Ge(() => K(E.target.value)),
                  children: W.versions.map((E) => /* @__PURE__ */ (0, n.jsxs)("option", {
                    value: E.id,
                    children: [
                      "v",
                      E.number,
                      " · ",
                      E.label,
                      E.stages.M08.author ? "（曾採用）" : "",
                      W.adoptedVersionId === E.id ? "／目前採用" : ""
                    ]
                  }, E.id))
                })] }),
                /* @__PURE__ */ (0, n.jsxs)("button", {
                  className: "btn",
                  disabled: d,
                  onClick: () => Ge(Xe),
                  children: [/* @__PURE__ */ (0, n.jsx)(aa, { size: 14 }), "另建候選版本"]
                })
              ]
            }),
            /* @__PURE__ */ (0, n.jsxs)("div", {
              className: "production-totals",
              children: [
                /* @__PURE__ */ (0, n.jsxs)("b", { children: [za.filter((E) => P.stages[E.id].author).length, " / 8 階段核定"] }),
                /* @__PURE__ */ (0, n.jsxs)("b", { children: [gt.length, " 項待修或待裁定"] }),
                /* @__PURE__ */ (0, n.jsxs)("span", { children: [
                  W.world === "real" ? "現實場景" : W.world === "game" ? "遊戲場景" : "其他模型",
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
                  P.sourceLocation,
                  " · ",
                  P.sourceVersion
                ] }),
                /* @__PURE__ */ (0, n.jsx)("dt", { children: "原檔備份" }),
                /* @__PURE__ */ (0, n.jsx)("dd", { children: P.backupLocation || "待補" }),
                /* @__PURE__ */ (0, n.jsx)("dt", { children: "SHA-256" }),
                /* @__PURE__ */ (0, n.jsx)("dd", { children: P.sha256 || "待實際計算" }),
                /* @__PURE__ */ (0, n.jsx)("dt", { children: "設定與尺度" }),
                /* @__PURE__ */ (0, n.jsx)("dd", { children: P.reference || "待補" }),
                /* @__PURE__ */ (0, n.jsx)("dt", { children: "候選 GLB" }),
                /* @__PURE__ */ (0, n.jsx)("dd", { children: P.candidateLocation || "尚未登記" })
              ]
            })] })
          ]
        }),
        /* @__PURE__ */ (0, n.jsx)("div", {
          className: "model-stage-grid",
          children: za.map((E, be) => /* @__PURE__ */ (0, n.jsxs)("button", {
            disabled: d,
            className: "model-step " + (U === E.id ? "selected" : "") + (P.stages[E.id].author ? " passed" : ""),
            onClick: () => Ge(() => ie(E.id)),
            children: [
              /* @__PURE__ */ (0, n.jsx)("small", { children: E.id }),
              /* @__PURE__ */ (0, n.jsx)("b", { children: E.title }),
              /* @__PURE__ */ (0, n.jsx)("span", { children: P.stages[E.id].author ? "作者已確認" : P.stages[E.id].status === "needs_revision" ? "待修正" : P.stages[E.id].status === "candidate" ? "已有工作回報" : "待製作" })
            ]
          }, E.id))
        }),
        /* @__PURE__ */ (0, n.jsxs)("div", {
          className: "wide-card model-stage-detail",
          children: [
            /* @__PURE__ */ (0, n.jsxs)("div", {
              className: "section-title",
              children: [/* @__PURE__ */ (0, n.jsxs)("div", { children: [/* @__PURE__ */ (0, n.jsxs)("div", {
                className: "eyebrow",
                children: [
                  ce.id,
                  " · ",
                  W.title,
                  " · ",
                  P.label
                ]
              }), /* @__PURE__ */ (0, n.jsx)("h2", { children: ce.title })] }), /* @__PURE__ */ (0, n.jsx)("span", {
                className: "status " + (ae.author ? "passed" : ae.status === "needs_revision" ? "needs_revision" : "candidate"),
                children: ae.author ? "作者已確認" : ae.status === "todo" ? "待製作" : "待確認工作"
              })]
            }),
            /* @__PURE__ */ (0, n.jsxs)("div", {
              className: "output-box",
              children: [/* @__PURE__ */ (0, n.jsx)(ml, { size: 19 }), /* @__PURE__ */ (0, n.jsxs)("div", { children: [/* @__PURE__ */ (0, n.jsx)("strong", { children: "應留下的產出" }), /* @__PURE__ */ (0, n.jsx)("p", { children: ce.output })] })]
            }),
            /* @__PURE__ */ (0, n.jsxs)("form", {
              className: "context-form",
              onSubmit: async (E) => {
                E.preventDefault(), await we("save_model_stage", {
                  modelId: W.id,
                  versionId: P.id,
                  stageId: U,
                  checks: b,
                  evidence: ve,
                  summary: g,
                  nextStep: V,
                  candidateLocation: Y
                });
              },
              children: [
                /* @__PURE__ */ (0, n.jsx)("div", {
                  className: "checklist",
                  children: ce.checks.map((E, be) => /* @__PURE__ */ (0, n.jsxs)("label", { children: [/* @__PURE__ */ (0, n.jsx)("input", {
                    type: "checkbox",
                    disabled: d || h,
                    checked: b[be] ?? !1,
                    onChange: (at) => {
                      le((Jt) => Jt.map((We, Ka) => Ka === be ? at.target.checked : We)), X(!0);
                    }
                  }), /* @__PURE__ */ (0, n.jsx)("span", { children: E })] }, E))
                }),
                U === "M04" && /* @__PURE__ */ (0, n.jsxs)("label", { children: ["本次獨立候選 GLB", /* @__PURE__ */ (0, n.jsx)("input", {
                  disabled: d || h,
                  maxLength: 2e3,
                  value: Y,
                  placeholder: ".../reality-home_v2_candidate.glb",
                  onChange: (E) => {
                    pe(E.target.value), X(!0);
                  }
                })] }),
                /* @__PURE__ */ (0, n.jsxs)("label", { children: ["實際產出／檢查依據位置", /* @__PURE__ */ (0, n.jsx)("textarea", {
                  rows: 2,
                  disabled: d || h,
                  value: ve,
                  onChange: (E) => {
                    Me(E.target.value), X(!0);
                  },
                  placeholder: "原檔盤點報告、逐物件差異、檢查結果或指定鏡位截圖；附來源版本。"
                })] }),
                /* @__PURE__ */ (0, n.jsxs)("label", { children: ["本次實際做了什麼 *", /* @__PURE__ */ (0, n.jsx)("textarea", {
                  required: !0,
                  rows: 3,
                  maxLength: 6e3,
                  disabled: d || h,
                  value: g,
                  onChange: (E) => {
                    F(E.target.value), X(!0);
                  },
                  placeholder: "具體節點／物件、改動、檢查方式、尚未完成項。"
                })] }),
                /* @__PURE__ */ (0, n.jsxs)("label", { children: ["下一位 AI 從哪裡繼續 *", /* @__PURE__ */ (0, n.jsx)("textarea", {
                  required: !0,
                  rows: 3,
                  maxLength: 6e3,
                  disabled: d || h,
                  value: V,
                  onChange: (E) => {
                    R(E.target.value), X(!0);
                  },
                  placeholder: "指定版本、檔案位置、先讀資料、下一個物件或鏡位，以及受阻原因。"
                })] }),
                /* @__PURE__ */ (0, n.jsxs)("div", {
                  className: "context-actions",
                  children: [/* @__PURE__ */ (0, n.jsxs)("button", {
                    className: "btn",
                    disabled: d || h || !ye,
                    children: ["保存候選工作紀錄", ye ? " *" : ""]
                  }), /* @__PURE__ */ (0, n.jsxs)("button", {
                    type: "button",
                    className: "btn primary",
                    disabled: d || h || ye || te.length > 0 || !!ae.author,
                    onClick: () => {
                      we(U === "M08" ? "adopt_model_version" : "approve_model_stage", {
                        modelId: W.id,
                        versionId: P.id,
                        stageId: U,
                        note: "作者確認指定候選版本與適用範圍"
                      });
                    },
                    children: [/* @__PURE__ */ (0, n.jsx)(sn, { size: 15 }), U === "M08" ? "作者登記採用此版本" : "作者確認本階段"]
                  })]
                }),
                /* @__PURE__ */ (0, n.jsx)("p", {
                  className: "muted",
                  children: h ? "已採用版本及舊集引用保持不變；需要修改請另建候選。" : ye ? "請先保存工作紀錄，再確認。" : te.length ? "待補：" + te.join("；") : "檢查條件已齊，請核對實際成果後確認。"
                }),
                U === "M08" && /* @__PURE__ */ (0, n.jsx)("p", {
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
              onSubmit: async (E) => {
                E.preventDefault(), await we("report_model_issue", {
                  modelId: W.id,
                  versionId: P.id,
                  stageId: U,
                  kind: x,
                  reason: ue
                }) && Ae("");
              },
              children: [
                /* @__PURE__ */ (0, n.jsxs)("div", {
                  className: "context-form-grid",
                  children: [/* @__PURE__ */ (0, n.jsxs)("label", { children: ["問題分類", /* @__PURE__ */ (0, n.jsxs)("select", {
                    value: x,
                    onChange: (E) => H(E.target.value),
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
                    value: ce.id + " " + ce.title
                  })] })]
                }),
                /* @__PURE__ */ (0, n.jsxs)("label", { children: ["具體原因", /* @__PURE__ */ (0, n.jsx)("textarea", {
                  required: !0,
                  rows: 2,
                  maxLength: 6e3,
                  value: ue,
                  onChange: (E) => Ae(E.target.value)
                })] }),
                /* @__PURE__ */ (0, n.jsxs)("button", {
                  className: "btn",
                  disabled: d || !ue.trim(),
                  children: [/* @__PURE__ */ (0, n.jsx)(ln, { size: 15 }), "登記問題"]
                })
              ]
            }),
            xt.map((E) => /* @__PURE__ */ (0, n.jsxs)("article", {
              className: "context-record",
              children: [
                /* @__PURE__ */ (0, n.jsxs)("div", {
                  className: "issue-top",
                  children: [/* @__PURE__ */ (0, n.jsx)("span", {
                    className: "status " + (E.status === "open" ? "needs_revision" : "passed"),
                    children: E.status === "open" ? "待處理" : "作者已複核"
                  }), /* @__PURE__ */ (0, n.jsxs)("b", { children: [
                    E.stageId,
                    " · ",
                    E.kind === "major" ? "重大變更" : E.kind === "technical" ? "技術" : "視覺"
                  ] })]
                }),
                /* @__PURE__ */ (0, n.jsx)("p", { children: E.reason }),
                /* @__PURE__ */ (0, n.jsxs)("small", { children: [
                  E.by,
                  " · ",
                  new Date(E.at).toLocaleString("zh-TW", { timeZone: "Asia/Taipei" })
                ] }),
                E.status === "open" ? /* @__PURE__ */ (0, n.jsxs)("form", {
                  className: "context-form",
                  onSubmit: async (be) => {
                    be.preventDefault(), await we("resolve_model_issue", {
                      modelId: W.id,
                      versionId: P.id,
                      issueId: E.id,
                      resolution: Z[E.id] ?? ""
                    });
                  },
                  children: [/* @__PURE__ */ (0, n.jsxs)("label", { children: ["作者修正複核／裁定結果", /* @__PURE__ */ (0, n.jsx)("textarea", {
                    required: !0,
                    rows: 2,
                    maxLength: 6e3,
                    value: Z[E.id] ?? "",
                    onChange: (be) => ee({
                      ...Z,
                      [E.id]: be.target.value
                    })
                  })] }), /* @__PURE__ */ (0, n.jsx)("button", {
                    className: "btn",
                    disabled: d,
                    children: "作者確認處理結果"
                  })]
                }) : /* @__PURE__ */ (0, n.jsxs)("p", { children: ["處理結果：", E.resolution] })
              ]
            }, E.id))
          ]
        }),
        /* @__PURE__ */ (0, n.jsxs)("div", {
          className: "wide-card",
          children: [
            /* @__PURE__ */ (0, n.jsx)("div", {
              className: "section-title",
              children: /* @__PURE__ */ (0, n.jsxs)("div", { children: [/* @__PURE__ */ (0, n.jsxs)("h2", { children: [/* @__PURE__ */ (0, n.jsx)(so, { size: 19 }), "各集固定版本引用"] }), /* @__PURE__ */ (0, n.jsxs)("p", { children: [
                "目前集數：",
                C.episode,
                "。新候選不會自動替換 EP01 或其他集的模型來源。"
              ] })] })
            }),
            h && /* @__PURE__ */ (0, n.jsxs)("form", {
              className: "context-form",
              onSubmit: async (E) => {
                E.preventDefault(), await we("pin_model_version", {
                  modelId: W.id,
                  versionId: P.id,
                  episodeId: C.id,
                  purpose: S,
                  sceneIds: se
                }) && ($(""), ze(""));
              },
              children: [/* @__PURE__ */ (0, n.jsxs)("div", {
                className: "context-form-grid",
                children: [/* @__PURE__ */ (0, n.jsxs)("label", { children: ["引用場次（選填）", /* @__PURE__ */ (0, n.jsx)("input", {
                  value: se,
                  maxLength: 1e3,
                  placeholder: "S06、S07",
                  onChange: (E) => ze(E.target.value)
                })] }), /* @__PURE__ */ (0, n.jsxs)("label", { children: ["本集用途 *", /* @__PURE__ */ (0, n.jsx)("input", {
                  required: !0,
                  value: S,
                  maxLength: 2e3,
                  placeholder: "固定樓梯、餐桌與走道位置",
                  onChange: (E) => $(E.target.value)
                })] })]
              }), /* @__PURE__ */ (0, n.jsxs)("button", {
                className: "btn",
                disabled: d || gt.length > 0,
                children: ["將此採用版本引用至 ", C.episode]
              })]
            }),
            tt.length ? /* @__PURE__ */ (0, n.jsx)("div", {
              className: "model-pins",
              children: tt.map((E, be) => {
                const at = G.models.find((We) => We.id === E.modelId), Jt = at?.versions.find((We) => We.id === E.versionId);
                return /* @__PURE__ */ (0, n.jsxs)("article", { children: [
                  /* @__PURE__ */ (0, n.jsxs)("b", { children: [
                    at?.title,
                    " · ",
                    Jt?.label
                  ] }),
                  " ",
                  /* @__PURE__ */ (0, n.jsx)("span", {
                    className: "status " + (Dt.get([E.modelId, E.sceneIds].join("|")) === E ? "passed" : "todo"),
                    children: Dt.get([E.modelId, E.sceneIds].join("|")) === E ? "本集現行引用" : "歷史引用"
                  }),
                  /* @__PURE__ */ (0, n.jsxs)("p", { children: [
                    E.sceneIds || "本集",
                    " ／ ",
                    E.purpose
                  ] }),
                  /* @__PURE__ */ (0, n.jsx)("code", { children: Jt?.candidateLocation })
                ] }, be);
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
            G.history.filter((E) => E.modelId === W.id).length,
            "）"
          ] }), [...G.history].reverse().filter((E) => E.modelId === W.id).slice(0, 60).map((E, be) => /* @__PURE__ */ (0, n.jsxs)("article", {
            className: "context-mini",
            children: [
              /* @__PURE__ */ (0, n.jsxs)("b", { children: [
                tx[E.action] ?? E.action,
                " · ",
                E.stageId,
                " · ",
                W.versions.find((at) => at.id === E.versionId)?.label
              ] }),
              /* @__PURE__ */ (0, n.jsx)("p", { children: E.detail }),
              /* @__PURE__ */ (0, n.jsxs)("small", { children: [
                E.actor === "ai" ? "AI" : "作者",
                " · ",
                E.by,
                " · ",
                new Date(E.at).toLocaleString("zh-TW", { timeZone: "Asia/Taipei" })
              ] })
            ]
          }, be))]
        })
      ] }),
      Q && /* @__PURE__ */ (0, n.jsx)("p", {
        role: "alert",
        children: Q
      })
    ]
  });
}
var Ir = "https://lihuany635-create.github.io/lizhi-cloud-web/?open=animationflow", $r = {
  todo: "待製作",
  candidate: "候選待驗收",
  passed: "已通過",
  in_timeline: "已入片",
  needs_revision: "待修正"
}, xp = [
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
function tn(r) {
  return r ? new Date(r).toLocaleString("zh-TW", {
    timeZone: "Asia/Taipei",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  }) : "尚無紀錄";
}
function lx(r, m, C = "application/json") {
  const p = URL.createObjectURL(new Blob([m], { type: C })), d = document.createElement("a");
  d.href = p, d.download = r, d.click(), setTimeout(() => URL.revokeObjectURL(p), 1e3);
}
function nx({ nativeTransport: r, initialWorkId: m, initialTab: C = "resume", onDirtyChange: p } = {}) {
  const [d, M] = (0, A.useState)([]), [y, L] = (0, A.useState)(null), [T, k] = (0, A.useState)(C), [z, K] = (0, A.useState)("01"), [U, ie] = (0, A.useState)(null), [fe, J] = (0, A.useState)([]), [I, oe] = (0, A.useState)(!0), [Q, de] = (0, A.useState)(!1), [G, W] = (0, A.useState)(""), [P, ae] = (0, A.useState)(""), [ce, X] = (0, A.useState)(!1), [b, le] = (0, A.useState)([]), [ve, Me] = (0, A.useState)(""), [g, F] = (0, A.useState)(""), [V, R] = (0, A.useState)(!1), [Y, pe] = (0, A.useState)(null), [ue, Ae] = (0, A.useState)({}), [x, H] = (0, A.useState)(""), [Z, ee] = (0, A.useState)(!1), [S, $] = (0, A.useState)(null), se = (0, A.useRef)(0), ze = (0, A.useRef)(""), ye = (0, A.useRef)(!1);
  (0, A.useEffect)(() => {
    ye.current = V, p?.(V);
  }, [V, p]);
  const Je = (0, A.useCallback)((u) => {
    ze.current = u.id, L(u), ie((me) => me?.id === u.workId ? me : null), M((me) => [ao(u), ...me.filter((xe) => xe.id !== u.id)]), R(!1);
  }, []);
  async function Ge(u, me, xe = "projects") {
    const Fe = r ? await r(xe, u, me) : await fetch("/api/" + xe + u, {
      cache: "no-store",
      ...me ? {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(me)
      } : {}
    });
    if (Fe.status === 401)
      throw X(!0), new Error("請先登入流程工作台");
    if (!Fe.headers.get("content-type")?.includes("application/json"))
      throw X(!0), new Error("請開啟工作台並使用 ChatGPT 登入");
    const Ye = await Fe.json();
    if (!Fe.ok) throw new Error(Ye.error || "讀取失敗");
    return X(!1), Ye;
  }
  const we = (0, A.useCallback)(async (u) => {
    const me = ++se.current;
    u && u !== ze.current && (ze.current = u, oe(!0));
    try {
      const [xe, Fe] = await Promise.all([Ge(""), Ge("", void 0, "works")]), Ye = m ? xe.filter((jt) => jt.workId === m) : xe, vt = u || ze.current || Ye.find((jt) => !jt.archived && jt.workId && jt.episode === "EP01")?.id || Ye.find((jt) => !jt.archived && jt.workId)?.id || Ye.find((jt) => !jt.archived)?.id;
      let ct = null, li = null;
      if (vt && (ct = await Ge("?id=" + encodeURIComponent(vt)), ct.workId && (li = (await Ge("?id=" + encodeURIComponent(ct.workId), void 0, "works")).work)), me !== se.current) return;
      W(""), M(Ye), J(m ? Fe.filter((jt) => jt.id === m) : Fe), ye.current || (ct ? Je(ct) : L(null), ie(li));
    } catch (xe) {
      me === se.current && W(xe.message);
    } finally {
      me === se.current && oe(!1);
    }
  }, [Je, m]);
  (0, A.useEffect)(() => {
    const u = new URLSearchParams(window.location.search).get("view");
    !m && u && [
      "resume",
      "project",
      "models",
      "context"
    ].includes(u) && k(u);
  }, []), (0, A.useEffect)(() => {
    we();
  }, [we]), (0, A.useEffect)(() => {
    const u = setInterval(() => {
      !V && !Y && !Q && we(ze.current || void 0);
    }, 2e4);
    return () => clearInterval(u);
  }, [
    V,
    Y,
    Q,
    y?.id,
    we
  ]), (0, A.useEffect)(() => {
    const u = y?.stages[z];
    u && (le(u.checks), Me(u.evidence), F(u.note), R(!1));
  }, [y, z]), (0, A.useEffect)(() => {
    if (!V) return;
    const u = (me) => {
      me.preventDefault();
    };
    return window.addEventListener("beforeunload", u), () => window.removeEventListener("beforeunload", u);
  }, [V]), (0, A.useEffect)(() => {
    if (!P) return;
    const u = setTimeout(() => ae(""), 4500);
    return () => clearTimeout(u);
  }, [P]);
  async function Xe(u, me = {}) {
    if (y) {
      se.current++, de(!0), W("");
      try {
        const xe = await Ge("", {
          projectId: y.id,
          revision: y.revision,
          action: u,
          args: me
        });
        return Je(xe), xe.archived && ee(!0), ae("已儲存至雲端"), xe;
      } catch (xe) {
        W(xe.message);
      } finally {
        de(!1);
      }
    }
  }
  async function xt(u, me) {
    se.current++, de(!0), W("");
    try {
      const xe = await Ge("", [
        "convert_episode",
        "create_work",
        "create_episode"
      ].includes(u) ? {
        action: u,
        ...me,
        workId: U?.id,
        revision: U?.revision
      } : {
        action: u,
        workId: U?.id,
        revision: U?.revision,
        args: me
      }, "works");
      return ie(xe.work), J((Fe) => [{
        ...Lm(xe.work),
        episodeCount: xe.episodes.length
      }, ...Fe.filter((Ye) => Ye.id !== xe.work.id)]), M((Fe) => [...xe.episodes, ...Fe.filter((Ye) => !xe.episodes.some((vt) => vt.id === Ye.id))]), xe.episode && Je(xe.episode), ae("作品專案已儲存"), xe;
    } catch (xe) {
      if (W(xe.message), u === "create_episode") throw xe;
    } finally {
      de(!1);
    }
  }
  function gt(u) {
    V && !window.confirm("此階段有未儲存修改，要放棄修改嗎？") || (R(!1), u());
  }
  function h(u) {
    gt(() => K(u));
  }
  function te(u) {
    gt(() => {
      k(u), [
        "main",
        "op",
        "ed"
      ].includes(u) && K(Kt.find((me) => me.group === u).id);
    });
  }
  async function tt(u) {
    u.preventDefault(), de(!0), W("");
    try {
      Y === "create" ? (U ? await xt("create_episode", {
        title: ue.title || "製作資料",
        episode: ue.episode || "EP01"
      }) : Je(await Ge("", {
        action: "create_project",
        title: ue.title || "現實遊戲",
        episode: ue.episode || "EP01"
      })), k("main"), K("01"), pe(null), ae("專案已建立，全部階段待確認")) : Y === "shot" ? await Xe("save_shot", ue) && pe(null) : Y === "issue" ? await Xe("add_issue", ue) && pe(null) : Y === "resolve" ? await Xe("resolve_issue", ue) && pe(null) : Y === "archive" && await Xe(y?.archived ? "restore" : "archive") && pe(null);
    } catch (me) {
      W(me.message);
    } finally {
      de(!1);
    }
  }
  const Dt = y ? ao(y) : null, E = Kt.find((u) => u.id === z), be = y?.stages[z], at = y ? Np(y, z) : [], Jt = y ? zs(y, z) : [], We = Kt.filter((u) => u.group === T), Ka = y?.issues.filter((u) => u.status === "open") || [], gl = y?.production?.completionReports?.at(-1), Ut = gl?.status === "completed", Ft = y ? ro(y).registration : null, Ja = [
    [
      "resume",
      "工作首頁",
      nn
    ],
    [
      "project",
      "作品與集數",
      Pn
    ],
    [
      "models",
      "3D 模型",
      sp
    ],
    [
      "settings",
      "採用設定",
      ml
    ],
    [
      "context",
      "資料與交接",
      nn
    ],
    [
      "main",
      "動畫製作",
      bm
    ],
    [
      "op",
      "片頭 OP",
      Lr
    ],
    [
      "ed",
      "片尾 ED",
      Pn
    ],
    [
      "shots",
      "鏡頭與素材",
      sp
    ],
    [
      "issues",
      "待修問題",
      ln
    ],
    [
      "chatgpt",
      "AI 協作",
      Yr
    ],
    [
      "history",
      "異動紀錄",
      jp
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
            href: Ir,
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
            children: [/* @__PURE__ */ (0, n.jsx)(Pn, { size: 19 }), /* @__PURE__ */ (0, n.jsxs)("select", {
              disabled: Q || I,
              "aria-label": "切換作品專案",
              value: U?.id || "",
              onChange: (u) => gt(() => {
                const me = d.find((xe) => (xe.workId || "") === u.target.value && !xe.archived);
                me && we(me.id), $(null), k("resume");
              }),
              children: [/* @__PURE__ */ (0, n.jsx)("option", {
                value: "",
                children: "未歸屬單集"
              }), fe.map((u) => /* @__PURE__ */ (0, n.jsxs)("option", {
                value: u.id,
                children: [
                  u.title,
                  " · ",
                  u.episodeCount,
                  " 集"
                ]
              }, u.id))]
            })]
          }),
          /* @__PURE__ */ (0, n.jsx)("div", {
            className: "side-label",
            children: "集數"
          }),
          /* @__PURE__ */ (0, n.jsxs)("div", {
            className: "project-switch",
            children: [/* @__PURE__ */ (0, n.jsx)(nn, { size: 19 }), /* @__PURE__ */ (0, n.jsxs)("select", {
              disabled: Q || I,
              "aria-label": "切換集數",
              value: y?.id || "",
              onChange: (u) => gt(() => {
                we(u.target.value);
              }),
              children: [/* @__PURE__ */ (0, n.jsx)("option", {
                value: "",
                disabled: !0,
                children: "選擇集數"
              }), d.filter((u) => (u.workId || "") === (U?.id || "") && (Z || !u.archived)).map((u) => /* @__PURE__ */ (0, n.jsxs)("option", {
                value: u.id,
                children: [
                  u.episode,
                  " · ",
                  u.title,
                  u.archived ? "（已封存）" : ""
                ]
              }, u.id))]
            })]
          }),
          /* @__PURE__ */ (0, n.jsxs)("button", {
            className: "new-project",
            onClick: () => gt(() => {
              Ae({
                title: "製作資料",
                episode: "EP" + String(Math.max(0, ...d.map((u) => Number(u.episode.replace(/^EP/i, "")) || 0)) + 1).padStart(2, "0")
              }), pe("create");
            }),
            children: [/* @__PURE__ */ (0, n.jsx)(aa, { size: 15 }), "建立其他單集"]
          }),
          /* @__PURE__ */ (0, n.jsx)("nav", {
            "aria-label": "主要功能",
            children: Ja.filter(([u]) => [
              "resume",
              "main",
              "models",
              "context",
              "chatgpt"
            ].includes(u)).map(([u, me, xe]) => /* @__PURE__ */ (0, n.jsxs)("button", {
              "aria-current": T === u ? "page" : void 0,
              className: "nav-item " + (T === u || u === "main" && [
                "op",
                "ed",
                "shots",
                "issues"
              ].includes(T) ? "active" : ""),
              onClick: () => te(u),
              children: [/* @__PURE__ */ (0, n.jsx)(xe, { size: 18 }), /* @__PURE__ */ (0, n.jsx)("span", { children: me })]
            }, u))
          }),
          /* @__PURE__ */ (0, n.jsxs)("details", {
            className: "nav-more",
            open: [
              "project",
              "settings",
              "history"
            ].includes(T) || void 0,
            children: [/* @__PURE__ */ (0, n.jsx)("summary", { children: "專案管理" }), Ja.filter(([u]) => [
              "project",
              "settings",
              "history"
            ].includes(u)).map(([u, me, xe]) => /* @__PURE__ */ (0, n.jsxs)("button", {
              className: "nav-item " + (T === u ? "active" : ""),
              onClick: () => te(u),
              children: [/* @__PURE__ */ (0, n.jsx)(xe, { size: 17 }), me]
            }, u))]
          }),
          /* @__PURE__ */ (0, n.jsxs)("div", {
            className: "side-bottom",
            children: [/* @__PURE__ */ (0, n.jsxs)("label", {
              className: "archive-toggle",
              children: [/* @__PURE__ */ (0, n.jsx)("input", {
                type: "checkbox",
                checked: Z,
                onChange: (u) => ee(u.target.checked)
              }), "顯示已封存專案"]
            }), /* @__PURE__ */ (0, n.jsxs)("a", {
              href: Ir,
              target: "_top",
              children: ["返回立之雲端庫 ", /* @__PURE__ */ (0, n.jsx)(Wh, { size: 14 })]
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
              /* @__PURE__ */ (0, n.jsx)(ip, { size: 14 }),
              /* @__PURE__ */ (0, n.jsx)("span", { children: Ja.find((u) => u[0] === T)?.[1] })
            ]
          }), /* @__PURE__ */ (0, n.jsxs)("div", {
            className: "top-actions",
            children: [/* @__PURE__ */ (0, n.jsxs)("span", {
              className: "cloud-indicator",
              children: [/* @__PURE__ */ (0, n.jsx)("i", {}), r ? "雲端庫帳號 · 共用進度" : "私有雲端進度"]
            }), /* @__PURE__ */ (0, n.jsx)("button", {
              className: "icon-btn",
              title: "重新讀取雲端進度",
              "aria-label": "重新讀取雲端進度",
              disabled: Q || I,
              onClick: () => gt(() => {
                we(y?.id);
              }),
              children: /* @__PURE__ */ (0, n.jsx)(co, {
                size: 17,
                className: I ? "spin" : ""
              })
            })]
          })]
        }), /* @__PURE__ */ (0, n.jsxs)("div", {
          className: "page-content",
          children: [
            G && /* @__PURE__ */ (0, n.jsxs)("div", {
              className: "error-banner",
              role: "alert",
              children: [
                /* @__PURE__ */ (0, n.jsx)(ln, { size: 18 }),
                /* @__PURE__ */ (0, n.jsx)("span", { children: G }),
                ce && /* @__PURE__ */ (0, n.jsx)("a", {
                  href: r ? Ir : "/signin-with-chatgpt?return_to=" + encodeURIComponent("/?view=" + T),
                  target: "_top",
                  children: r ? "重新登入雲端庫" : "登入工作台 ↗"
                }),
                /* @__PURE__ */ (0, n.jsx)("button", {
                  "aria-label": "關閉訊息",
                  onClick: () => W(""),
                  children: /* @__PURE__ */ (0, n.jsx)(Ss, { size: 16 })
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
                /* @__PURE__ */ (0, n.jsx)("h1", { children: Ja.find((u) => u[0] === T)?.[1] }),
                /* @__PURE__ */ (0, n.jsx)("p", { children: T === "resume" ? "查看進度，選一件事接著做。" : T === "models" ? "選擇模型與版本，記錄這次完成的工作。" : T === "context" ? "查找製作資料，保留每次工作的交接。" : "目前選取的作品與集數如下。" })
              ] }), /* @__PURE__ */ (0, n.jsx)("div", {
                className: "heading-actions",
                children: y && /* @__PURE__ */ (0, n.jsxs)(n.Fragment, { children: [/* @__PURE__ */ (0, n.jsxs)("button", {
                  className: "btn",
                  onClick: () => lx(y.title + "_" + y.episode + "_流程備份.json", JSON.stringify(y, null, 2)),
                  children: [/* @__PURE__ */ (0, n.jsx)(io, { size: 15 }), "匯出紀錄"]
                }), /* @__PURE__ */ (0, n.jsx)("button", {
                  className: "icon-btn bordered",
                  title: y.archived ? "還原專案" : "封存專案",
                  "aria-label": y.archived ? "還原專案" : "封存專案",
                  onClick: () => {
                    Ae({}), pe("archive");
                  },
                  children: y.archived ? /* @__PURE__ */ (0, n.jsx)(wm, { size: 17 }) : /* @__PURE__ */ (0, n.jsx)(bp, { size: 17 })
                })] })
              })]
            }),
            I ? /* @__PURE__ */ (0, n.jsxs)("div", {
              className: "empty",
              children: [/* @__PURE__ */ (0, n.jsx)(Gr, {
                className: "spin",
                size: 26
              }), /* @__PURE__ */ (0, n.jsx)("h3", { children: "讀取製作進度" })]
            }) : y ? /* @__PURE__ */ (0, n.jsxs)(n.Fragment, { children: [
              /* @__PURE__ */ (0, n.jsxs)("section", {
                className: "project-banner",
                children: [/* @__PURE__ */ (0, n.jsxs)("div", {
                  className: "project-title",
                  children: [/* @__PURE__ */ (0, n.jsx)("span", {
                    className: "episode",
                    children: y.episode
                  }), /* @__PURE__ */ (0, n.jsxs)("div", { children: [/* @__PURE__ */ (0, n.jsxs)("h2", { children: [U ? U.title + " · " + y.episode : y.title, y.archived && /* @__PURE__ */ (0, n.jsx)("span", {
                    className: "status todo",
                    children: "已封存"
                  })] }), /* @__PURE__ */ (0, n.jsxs)("p", { children: [
                    "更新於 ",
                    tn(y.updatedAt),
                    " ",
                    /* @__PURE__ */ (0, n.jsx)("span", { children: "·" }),
                    " 紀錄版本 ",
                    y.revision
                  ] })] })]
                }), /* @__PURE__ */ (0, n.jsxs)("div", {
                  className: "project-progress",
                  children: [/* @__PURE__ */ (0, n.jsxs)("div", { children: [/* @__PURE__ */ (0, n.jsx)("span", { children: "本集製作狀態" }), /* @__PURE__ */ (0, n.jsx)("strong", { children: Ut ? "作者告知已完成" : gl?.status === "in_progress" ? "作者告知製作中" : gl?.status === "not_started" ? "作者告知尚未開始" : "尚未登記" })] }), /* @__PURE__ */ (0, n.jsx)("small", { children: Ut ? "目前進行資料補登與來源對應" : "依本集作者告知紀錄顯示" })]
                })]
              }),
              T !== "resume" && /* @__PURE__ */ (0, n.jsxs)("details", {
                className: "registration-detail",
                children: [
                  /* @__PURE__ */ (0, n.jsx)("summary", { children: "查看資料登記統計" }),
                  /* @__PURE__ */ (0, n.jsxs)("div", {
                    className: "metrics",
                    children: [
                      /* @__PURE__ */ (0, n.jsxs)("div", { children: [/* @__PURE__ */ (0, n.jsx)("span", {
                        className: "metric-icon green",
                        children: /* @__PURE__ */ (0, n.jsx)(sn, { size: 20 })
                      }), /* @__PURE__ */ (0, n.jsxs)("div", { children: [/* @__PURE__ */ (0, n.jsxs)("b", { children: [Ft.acceptedSources, /* @__PURE__ */ (0, n.jsxs)("em", { children: [" / ", Ft.sources] })] }), /* @__PURE__ */ (0, n.jsx)("small", { children: "來源已確認收錄" })] })] }),
                      /* @__PURE__ */ (0, n.jsxs)("div", { children: [/* @__PURE__ */ (0, n.jsx)("span", {
                        className: "metric-icon blue",
                        children: /* @__PURE__ */ (0, n.jsx)(Lr, { size: 20 })
                      }), /* @__PURE__ */ (0, n.jsxs)("div", { children: [/* @__PURE__ */ (0, n.jsxs)("b", { children: [Ft.linkedShots, /* @__PURE__ */ (0, n.jsxs)("em", { children: [" / ", Ft.shots] })] }), /* @__PURE__ */ (0, n.jsx)("small", { children: "鏡頭來源關聯" })] })] }),
                      /* @__PURE__ */ (0, n.jsxs)("div", { children: [/* @__PURE__ */ (0, n.jsx)("span", {
                        className: "metric-icon amber",
                        children: /* @__PURE__ */ (0, n.jsx)(ml, { size: 20 })
                      }), /* @__PURE__ */ (0, n.jsxs)("div", { children: [/* @__PURE__ */ (0, n.jsx)("b", { children: Ft.registeredSelections || "待補登" }), /* @__PURE__ */ (0, n.jsx)("small", { children: "實際採用檔紀錄" })] })] }),
                      /* @__PURE__ */ (0, n.jsxs)("div", { children: [/* @__PURE__ */ (0, n.jsx)("span", {
                        className: "metric-icon red",
                        children: /* @__PURE__ */ (0, n.jsx)(ln, { size: 20 })
                      }), /* @__PURE__ */ (0, n.jsxs)("div", { children: [/* @__PURE__ */ (0, n.jsx)("b", { children: Ka.length }), /* @__PURE__ */ (0, n.jsx)("small", { children: "已登記退修問題" })] })] })
                    ]
                  }),
                  /* @__PURE__ */ (0, n.jsxs)("details", {
                    className: "registration-detail",
                    children: [/* @__PURE__ */ (0, n.jsx)("summary", { children: "逐項檢視與入片登記" }), /* @__PURE__ */ (0, n.jsxs)("p", { children: [
                      Dt.approved,
                      " / ",
                      Dt.total,
                      " 階段已登記逐項核定；",
                      Dt.inTimeline,
                      " / ",
                      Dt.shots,
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
              ].includes(T) && /* @__PURE__ */ (0, n.jsx)("nav", {
                className: "section-nav",
                "aria-label": "動畫製作內容",
                children: Ja.filter(([u]) => [
                  "main",
                  "op",
                  "ed",
                  "shots",
                  "issues"
                ].includes(u)).map(([u, me]) => /* @__PURE__ */ (0, n.jsxs)("button", {
                  className: T === u ? "active" : "",
                  "aria-current": T === u ? "page" : void 0,
                  onClick: () => te(u),
                  children: [me, u === "issues" && Ka.length > 0 ? " · " + Ka.length : ""]
                }, u))
              }),
              T === "resume" ? /* @__PURE__ */ (0, n.jsx)(Qm, {
                project: y,
                work: U,
                busy: Q,
                onNavigate: te,
                onModel: (u) => {
                  $(u), te("models");
                }
              }) : T === "project" ? /* @__PURE__ */ (0, n.jsx)(ex, {
                work: U,
                episode: y,
                episodes: d,
                busy: Q,
                onWorkAction: xt,
                onSelectEpisode: (u) => gt(() => {
                  we(u);
                }),
                onPin: (u) => Xe("pin_shared_reference", { assetId: u }),
                mutate: Xe
              }, y.id) : T === "models" ? /* @__PURE__ */ (0, n.jsx)(ax, {
                initialSelection: S,
                work: U,
                episode: y,
                episodes: d,
                busy: Q,
                onAction: xt,
                onProject: () => te("project"),
                onDirty: R
              }, (U?.id || y.id) + JSON.stringify(S)) : T === "settings" ? /* @__PURE__ */ (0, n.jsx)(_p, {
                project: y,
                busy: Q,
                mutate: Xe
              }, y.id) : T === "context" ? /* @__PURE__ */ (0, n.jsx)(Wm, {
                project: y,
                mutate: Xe,
                busy: Q
              }, y.id) : [
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
                        checked: y.branches[T],
                        disabled: Q || y.archived,
                        onChange: (u) => {
                          Xe("set_branches", {
                            ...y.branches,
                            [T]: u.target.checked
                          });
                        }
                      }), "納入本集"]
                    })
                  ]
                }),
                T !== "main" && !y.branches[T] ? /* @__PURE__ */ (0, n.jsxs)("div", {
                  className: "empty",
                  children: [
                    /* @__PURE__ */ (0, n.jsx)(Pn, { size: 30 }),
                    /* @__PURE__ */ (0, n.jsxs)("h3", { children: ["本集未納入 ", T.toUpperCase()] }),
                    /* @__PURE__ */ (0, n.jsx)("p", { children: "重新勾選「納入本集」即可保留並繼續原有紀錄。" })
                  ]
                }) : /* @__PURE__ */ (0, n.jsxs)("div", {
                  className: "flow-layout",
                  children: [/* @__PURE__ */ (0, n.jsxs)("div", {
                    className: "stage-list",
                    children: [We.map((u, me) => {
                      const xe = y.stages[u.id], Fe = zs(y, u.id).length > 0;
                      return /* @__PURE__ */ (0, n.jsxs)("button", {
                        className: "stage-item " + (z === u.id ? "selected" : "") + (xe.author ? " completed" : ""),
                        onClick: () => h(u.id),
                        children: [
                          /* @__PURE__ */ (0, n.jsx)("span", {
                            className: "stage-number " + (xe.author ? "done" : ""),
                            children: xe.author ? /* @__PURE__ */ (0, n.jsx)(js, { size: 17 }) : T === "main" ? u.id : String(me + 1).padStart(2, "0")
                          }),
                          /* @__PURE__ */ (0, n.jsxs)("div", { children: [
                            /* @__PURE__ */ (0, n.jsx)("small", { children: u.phase }),
                            /* @__PURE__ */ (0, n.jsx)("strong", { children: u.title }),
                            /* @__PURE__ */ (0, n.jsx)("span", {
                              className: "stage-label " + (xe.status === "needs_revision" ? "red-text" : ""),
                              children: Ut && !xe.author && xe.status === "todo" ? "已完成 · 待補登" : Fe && !xe.author ? /* @__PURE__ */ (0, n.jsxs)(n.Fragment, { children: [/* @__PURE__ */ (0, n.jsx)(to, { size: 11 }), "待前階段核定"] }) : $r[xe.status]
                            })
                          ] }),
                          /* @__PURE__ */ (0, n.jsx)(ip, { size: 15 })
                        ]
                      }, u.id);
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
                          children: T === "main" ? "STAGE " + z : T.toUpperCase() + " · " + z.slice(2)
                        }), /* @__PURE__ */ (0, n.jsx)("h2", { children: E.title })] }), /* @__PURE__ */ (0, n.jsx)("span", {
                          className: "status " + be.status,
                          children: Ut && be.status === "todo" ? "已完成 · 明細待補登" : $r[be.status]
                        })]
                      }),
                      /* @__PURE__ */ (0, n.jsx)("p", {
                        className: "stage-description",
                        children: E.description
                      }),
                      Jt.length > 0 && /* @__PURE__ */ (0, n.jsxs)("div", {
                        className: "gate-notice",
                        children: [/* @__PURE__ */ (0, n.jsx)(to, { size: 16 }), /* @__PURE__ */ (0, n.jsxs)("span", { children: [
                          Ut ? "逐項紀錄尚缺：" : "正式核定前，需先完成：",
                          Jt.join("、"),
                          "。可直接補登產出依據。"
                        ] })]
                      }),
                      /* @__PURE__ */ (0, n.jsxs)("div", {
                        className: "output-box",
                        children: [/* @__PURE__ */ (0, n.jsx)(ml, { size: 19 }), /* @__PURE__ */ (0, n.jsxs)("div", { children: [/* @__PURE__ */ (0, n.jsx)("strong", { children: "本階段產出" }), /* @__PURE__ */ (0, n.jsx)("p", { children: E.output })] })]
                      }),
                      Za(y.episodeRules ?? []).filter((u) => !u.stageIds.length || u.stageIds.includes(z)).map((u) => /* @__PURE__ */ (0, n.jsxs)("div", {
                        className: "context-mini",
                        children: [
                          /* @__PURE__ */ (0, n.jsxs)("b", { children: [
                            "本集採用規則 · ",
                            u.title,
                            " v",
                            u.version
                          ] }),
                          /* @__PURE__ */ (0, n.jsx)("p", { children: u.content }),
                          /* @__PURE__ */ (0, n.jsxs)("small", { children: [
                            "場次：",
                            u.sceneIds.join("、") || "全部",
                            " · 來源：",
                            u.source
                          ] })
                        ]
                      }, u.id)),
                      /* @__PURE__ */ (0, n.jsxs)("div", {
                        className: "checklist-heading",
                        children: [/* @__PURE__ */ (0, n.jsx)("h3", { children: Ut ? "逐項檢視紀錄" : "驗收確認" }), /* @__PURE__ */ (0, n.jsxs)("span", { children: [
                          b.filter(Boolean).length,
                          " / ",
                          b.length
                        ] })]
                      }),
                      /* @__PURE__ */ (0, n.jsx)("div", {
                        className: "checklist",
                        children: E.checks.map((u, me) => /* @__PURE__ */ (0, n.jsxs)("label", {
                          className: b[me] ? "checked" : "",
                          children: [/* @__PURE__ */ (0, n.jsx)("input", {
                            type: "checkbox",
                            checked: b[me] || !1,
                            disabled: Q || y.archived,
                            onChange: (xe) => {
                              le((Fe) => Fe.map((Ye, vt) => vt === me ? xe.target.checked : Ye)), R(!0);
                            }
                          }), /* @__PURE__ */ (0, n.jsx)("span", { children: u })]
                        }, me))
                      }),
                      /* @__PURE__ */ (0, n.jsxs)("label", {
                        className: "field-label",
                        htmlFor: "evidence",
                        children: [
                          /* @__PURE__ */ (0, n.jsx)(so, { size: 15 }),
                          "產出依據與位置 ",
                          /* @__PURE__ */ (0, n.jsx)("span", { children: "必填" })
                        ]
                      }),
                      /* @__PURE__ */ (0, n.jsx)("textarea", {
                        id: "evidence",
                        rows: 3,
                        placeholder: "貼上成果連結、檔案位置與參考版本；每行一筆。",
                        value: ve,
                        disabled: y.archived,
                        onChange: (u) => {
                          Me(u.target.value), R(!0);
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
                        value: g,
                        disabled: y.archived,
                        onChange: (u) => {
                          F(u.target.value), R(!0);
                        }
                      }),
                      /* @__PURE__ */ (0, n.jsxs)("div", {
                        className: "reviews",
                        children: [/* @__PURE__ */ (0, n.jsxs)("div", { children: [/* @__PURE__ */ (0, n.jsxs)("span", {
                          className: "review-title",
                          children: [/* @__PURE__ */ (0, n.jsx)(Yr, { size: 15 }), "AI 初驗"]
                        }), be.ai ? /* @__PURE__ */ (0, n.jsxs)(n.Fragment, { children: [
                          /* @__PURE__ */ (0, n.jsx)("b", {
                            className: be.ai.verdict === "pass" ? "green-text" : "red-text",
                            children: be.ai.verdict === "pass" ? "初驗通過" : "需修正"
                          }),
                          /* @__PURE__ */ (0, n.jsx)("p", { children: be.ai.note }),
                          /* @__PURE__ */ (0, n.jsxs)("small", { children: [
                            tn(be.ai.at),
                            " · ",
                            be.ai.by
                          ] })
                        ] }) : /* @__PURE__ */ (0, n.jsx)("p", {
                          className: "muted",
                          children: "尚未收到 AI 初驗"
                        })] }), /* @__PURE__ */ (0, n.jsxs)("div", { children: [/* @__PURE__ */ (0, n.jsxs)("span", {
                          className: "review-title",
                          children: [/* @__PURE__ */ (0, n.jsx)(sn, { size: 15 }), "作者正式核定"]
                        }), be.author ? /* @__PURE__ */ (0, n.jsxs)(n.Fragment, { children: [
                          /* @__PURE__ */ (0, n.jsx)("b", {
                            className: "green-text",
                            children: "已核定"
                          }),
                          /* @__PURE__ */ (0, n.jsx)("p", { children: be.author.note || "已確認本階段成果與驗收條件" }),
                          /* @__PURE__ */ (0, n.jsxs)("small", { children: [
                            tn(be.author.at),
                            " · ",
                            be.author.by
                          ] })
                        ] }) : /* @__PURE__ */ (0, n.jsx)("p", {
                          className: "muted",
                          children: Ut ? "作者已告知本集完成；逐項檢視依據尚待補登。" : "尚未登記逐項確認"
                        })] })]
                      }),
                      /* @__PURE__ */ (0, n.jsxs)("div", {
                        className: "detail-actions",
                        children: [/* @__PURE__ */ (0, n.jsxs)("button", {
                          className: "text-btn danger-text",
                          disabled: Q || y.archived,
                          onClick: () => {
                            Ae({
                              stageId: z,
                              reason: "",
                              shotId: ""
                            }), pe("issue");
                          },
                          children: [/* @__PURE__ */ (0, n.jsx)(ln, { size: 15 }), "記錄退修"]
                        }), /* @__PURE__ */ (0, n.jsxs)("div", { children: [/* @__PURE__ */ (0, n.jsxs)("button", {
                          className: "btn",
                          disabled: Q || y.archived || !V,
                          onClick: () => {
                            Xe("save_stage", {
                              stageId: z,
                              checks: b,
                              evidence: ve,
                              note: g
                            });
                          },
                          children: [
                            Q ? /* @__PURE__ */ (0, n.jsx)(Gr, {
                              size: 15,
                              className: "spin"
                            }) : null,
                            "儲存草稿",
                            V ? " *" : ""
                          ]
                        }), /* @__PURE__ */ (0, n.jsxs)("button", {
                          className: "btn primary",
                          disabled: Q || y.archived || V || at.length > 0 || !!be.author,
                          onClick: () => {
                            Xe("approve_stage", {
                              stageId: z,
                              note: "作者已核對產出與全部驗收條件"
                            });
                          },
                          children: [/* @__PURE__ */ (0, n.jsx)(sn, { size: 15 }), be.author ? "已正式核定" : "作者確認通過"]
                        })] })]
                      }),
                      !be.author && /* @__PURE__ */ (0, n.jsx)("div", {
                        className: "gate-reasons",
                        children: Ut ? "本集維持作者告知完成；此處保存逐項檢視依據，不要求重新確認整集。" : V ? "先儲存修改，再確認通過。" : at.length ? "待完成：" + at.join("；") : "已符合檢查條件，請實際檢視成果後確認通過。"
                      })
                    ]
                  }, z)]
                }),
                T === "main" && /* @__PURE__ */ (0, n.jsxs)("div", {
                  className: "principle",
                  children: [/* @__PURE__ */ (0, n.jsx)(Pn, { size: 19 }), /* @__PURE__ */ (0, n.jsxs)("div", { children: [/* @__PURE__ */ (0, n.jsx)("b", { children: "發現問題，就回到造成問題的環節。" }), /* @__PURE__ */ (0, n.jsx)("p", { children: "更新已核定的製作依據時，相關下游階段會標為待修正。AI 初驗與作者核定各自留存。" })] })]
                }),
                /* @__PURE__ */ (0, n.jsxs)("details", {
                  className: "manual-rules",
                  children: [/* @__PURE__ */ (0, n.jsx)("summary", { children: "歷史製作經驗（不作為目前有效設定）" }), /* @__PURE__ */ (0, n.jsxs)("div", {
                    className: "manual-rule-content",
                    children: [
                      /* @__PURE__ */ (0, n.jsx)("h3", { children: "場景定位" }),
                      ei.scenePosition.map((u) => /* @__PURE__ */ (0, n.jsx)("p", { children: u }, u)),
                      /* @__PURE__ */ (0, n.jsx)("h3", { children: "生圖提示詞順序" }),
                      /* @__PURE__ */ (0, n.jsx)("p", { children: ei.imagePrompt }),
                      /* @__PURE__ */ (0, n.jsx)("h3", { children: "影片提示詞順序" }),
                      /* @__PURE__ */ (0, n.jsx)("p", { children: ei.videoPrompt }),
                      /* @__PURE__ */ (0, n.jsx)("h3", { children: "失敗時回查" }),
                      ei.repairs.map((u) => /* @__PURE__ */ (0, n.jsx)("p", { children: u }, u)),
                      /* @__PURE__ */ (0, n.jsx)("h3", { children: "本集專用條件" }),
                      /* @__PURE__ */ (0, n.jsx)("p", { children: "請從「本集規則與採用」取得指定版本；前一集的劇情條件不自動沿用。" }),
                      /* @__PURE__ */ (0, n.jsx)("h3", { children: "素材編號" }),
                      /* @__PURE__ */ (0, n.jsx)("p", { children: "每集保留自己的素材編號與明確對照，不依編號相近猜配。" }),
                      /* @__PURE__ */ (0, n.jsxs)("p", { children: ["後續檔名範例：", ei.filenames.map((u) => u.replace("EP01", y.episode)).join("、")] })
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
                      disabled: y.archived,
                      onClick: () => {
                        Ae({}), pe("shot");
                      },
                      children: [/* @__PURE__ */ (0, n.jsx)(aa, { size: 16 }), "新增鏡頭"]
                    })]
                  }),
                  /* @__PURE__ */ (0, n.jsxs)("div", {
                    className: "search",
                    children: [/* @__PURE__ */ (0, n.jsx)(Sp, { size: 16 }), /* @__PURE__ */ (0, n.jsx)("input", {
                      "aria-label": "搜尋鏡頭",
                      placeholder: "搜尋場次、鏡頭 ID 或舊編號…",
                      value: x,
                      onChange: (u) => H(u.target.value)
                    })]
                  }),
                  y.shots.length ? /* @__PURE__ */ (0, n.jsx)("div", {
                    className: "table-scroll",
                    children: /* @__PURE__ */ (0, n.jsxs)("table", { children: [/* @__PURE__ */ (0, n.jsx)("thead", { children: /* @__PURE__ */ (0, n.jsxs)("tr", { children: [
                      /* @__PURE__ */ (0, n.jsx)("th", { children: "鏡頭／場次" }),
                      /* @__PURE__ */ (0, n.jsx)("th", { children: "內容與編號對照" }),
                      /* @__PURE__ */ (0, n.jsx)("th", { children: "參考版本" }),
                      /* @__PURE__ */ (0, n.jsx)("th", { children: "採用／剪輯版本" }),
                      /* @__PURE__ */ (0, n.jsx)("th", { children: "狀態" }),
                      /* @__PURE__ */ (0, n.jsx)("th", { children: "操作" })
                    ] }) }), /* @__PURE__ */ (0, n.jsx)("tbody", { children: y.shots.filter((u) => [
                      u.id,
                      u.scene,
                      u.description,
                      u.legacyIds
                    ].join(" ").includes(x)).map((u) => /* @__PURE__ */ (0, n.jsxs)("tr", { children: [
                      /* @__PURE__ */ (0, n.jsxs)("td", { children: [/* @__PURE__ */ (0, n.jsx)("b", { children: u.id }), /* @__PURE__ */ (0, n.jsx)("small", { children: u.scene })] }),
                      /* @__PURE__ */ (0, n.jsxs)("td", { children: [u.description, /* @__PURE__ */ (0, n.jsxs)("small", { children: [
                        u.legacyIds || "未填舊編號",
                        " · ",
                        u.versions.length + 1,
                        " 次紀錄"
                      ] })] }),
                      /* @__PURE__ */ (0, n.jsxs)("td", { children: [/* @__PURE__ */ (0, n.jsxs)("small", { children: ["劇本 ", u.scriptVersion || "—"] }), /* @__PURE__ */ (0, n.jsxs)("small", { children: [
                        "角色 ",
                        u.characterVersion || "—",
                        "／場景 ",
                        u.sceneVersion || "—"
                      ] })] }),
                      /* @__PURE__ */ (0, n.jsxs)("td", { children: [u.adoptedVersion || "尚未採用", /* @__PURE__ */ (0, n.jsxs)("small", { children: [
                        u.editorVersion || "—",
                        " · ",
                        u.inPoint || "—",
                        " → ",
                        u.outPoint || "—"
                      ] })] }),
                      /* @__PURE__ */ (0, n.jsx)("td", { children: /* @__PURE__ */ (0, n.jsx)("span", {
                        className: "status " + u.status,
                        children: $r[u.status]
                      }) }),
                      /* @__PURE__ */ (0, n.jsx)("td", { children: /* @__PURE__ */ (0, n.jsxs)("div", {
                        className: "table-actions",
                        children: [/* @__PURE__ */ (0, n.jsx)("button", {
                          className: "text-btn",
                          disabled: y.archived,
                          onClick: () => {
                            Ae(Object.fromEntries(xp.map(([me]) => [me, u[me]]))), pe("shot");
                          },
                          children: "查看／編輯"
                        }), u.author ? u.status !== "in_timeline" ? /* @__PURE__ */ (0, n.jsx)("button", {
                          className: "text-btn",
                          disabled: Q || y.archived,
                          onClick: () => {
                            Xe("timeline_shot", { shotId: u.id });
                          },
                          children: "確認已入片"
                        }) : null : /* @__PURE__ */ (0, n.jsx)("button", {
                          className: "text-btn",
                          disabled: Q || y.archived,
                          onClick: () => {
                            Xe("approve_shot", { shotId: u.id });
                          },
                          children: "核定素材"
                        })]
                      }) })
                    ] }, u.id)) })] })
                  }) : /* @__PURE__ */ (0, n.jsxs)("div", {
                    className: "empty",
                    children: [
                      /* @__PURE__ */ (0, n.jsx)(Lr, { size: 32 }),
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
                    disabled: y.archived,
                    onClick: () => {
                      Ae({
                        stageId: "08",
                        reason: "",
                        shotId: ""
                      }), pe("issue");
                    },
                    children: [/* @__PURE__ */ (0, n.jsx)(aa, { size: 16 }), "新增問題"]
                  })]
                }), y.issues.length ? /* @__PURE__ */ (0, n.jsx)("div", {
                  className: "issue-list",
                  children: [...y.issues].reverse().map((u) => /* @__PURE__ */ (0, n.jsxs)("article", {
                    className: "issue-card",
                    children: [
                      /* @__PURE__ */ (0, n.jsxs)("div", {
                        className: "issue-top",
                        children: [
                          /* @__PURE__ */ (0, n.jsx)("span", {
                            className: "status " + (u.status === "open" ? "needs_revision" : "passed"),
                            children: u.status === "open" ? "待修正" : "已複核結案"
                          }),
                          /* @__PURE__ */ (0, n.jsxs)("b", { children: [
                            u.stageId,
                            " ",
                            Kt.find((me) => me.id === u.stageId)?.title,
                            " ",
                            u.shotId ? "／" + u.shotId : ""
                          ] }),
                          /* @__PURE__ */ (0, n.jsx)("time", { children: tn(u.at) })
                        ]
                      }),
                      /* @__PURE__ */ (0, n.jsx)("p", { children: u.reason }),
                      /* @__PURE__ */ (0, n.jsx)("small", { children: u.by }),
                      u.resolution && /* @__PURE__ */ (0, n.jsxs)("div", {
                        className: "resolution",
                        children: [/* @__PURE__ */ (0, n.jsx)(js, { size: 15 }), u.resolution]
                      }),
                      u.status === "open" && /* @__PURE__ */ (0, n.jsx)("button", {
                        className: "btn",
                        disabled: y.archived,
                        onClick: () => {
                          Ae({
                            issueId: u.id,
                            resolution: ""
                          }), pe("resolve");
                        },
                        children: "填寫修正並複核"
                      })
                    ]
                  }, u.id))
                }) : /* @__PURE__ */ (0, n.jsxs)("div", {
                  className: "empty",
                  children: [
                    /* @__PURE__ */ (0, n.jsx)(js, { size: 32 }),
                    /* @__PURE__ */ (0, n.jsx)("h3", { children: "目前沒有退修問題" }),
                    /* @__PURE__ */ (0, n.jsx)("p", { children: "發現問題時，請指定造成問題的階段。" })
                  ]
                })]
              }) : T === "chatgpt" ? /* @__PURE__ */ (0, n.jsx)(Zm, {
                project: y,
                check: () => Ge("")
              }) : /* @__PURE__ */ (0, n.jsxs)("section", {
                className: "wide-card",
                children: [/* @__PURE__ */ (0, n.jsxs)("div", {
                  className: "section-title",
                  children: [/* @__PURE__ */ (0, n.jsxs)("div", { children: [/* @__PURE__ */ (0, n.jsx)("h2", { children: "製作異動紀錄" }), /* @__PURE__ */ (0, n.jsx)("p", { children: "作者與 ChatGPT 的更新分別標記，依時間保留。" })] }), /* @__PURE__ */ (0, n.jsxs)("span", {
                    className: "muted",
                    children: [y.audit.length, " 筆"]
                  })]
                }), /* @__PURE__ */ (0, n.jsx)("div", {
                  className: "audit-list",
                  children: [...y.audit].reverse().map((u, me) => /* @__PURE__ */ (0, n.jsxs)("div", { children: [
                    /* @__PURE__ */ (0, n.jsx)("span", {
                      className: "audit-icon " + (u.actor === "ai" ? "ai" : ""),
                      children: u.actor === "ai" ? /* @__PURE__ */ (0, n.jsx)(Yr, { size: 17 }) : /* @__PURE__ */ (0, n.jsx)(sn, { size: 17 })
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
                      }[u.action] || u.action,
                      " ",
                      /* @__PURE__ */ (0, n.jsx)("span", { children: u.detail })
                    ] }), /* @__PURE__ */ (0, n.jsx)("small", { children: u.by })] }),
                    /* @__PURE__ */ (0, n.jsx)("time", { children: tn(u.at) })
                  ] }, me))
                })]
              })
            ] }) : /* @__PURE__ */ (0, n.jsxs)("div", {
              className: "onboarding",
              children: [
                /* @__PURE__ */ (0, n.jsx)("div", {
                  className: "onboarding-icon",
                  children: /* @__PURE__ */ (0, n.jsx)(nn, { size: 34 })
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
                    Ae({
                      title: "現實遊戲",
                      episode: "EP01"
                    }), pe("create");
                  },
                  children: [/* @__PURE__ */ (0, n.jsx)(aa, { size: 17 }), "建立第一個製作專案"]
                }),
                /* @__PURE__ */ (0, n.jsx)("div", {
                  className: "onboarding-grid",
                  children: Kt.filter((u) => u.group === "main").map((u) => /* @__PURE__ */ (0, n.jsxs)("div", { children: [/* @__PURE__ */ (0, n.jsx)("span", { children: u.id }), u.title] }, u.id))
                }),
                /* @__PURE__ */ (0, n.jsx)("small", { children: "建立時全部階段為待製作；請依實際成果補入完成紀錄。" })
              ]
            }),
            /* @__PURE__ */ (0, n.jsxs)("footer", { children: ["製作工作台 ", /* @__PURE__ */ (0, n.jsx)("span", { children: "工作紀錄自動保存版本 · v5.0" })] })
          ]
        })]
      }),
      P && /* @__PURE__ */ (0, n.jsxs)("div", {
        className: "toast",
        role: "status",
        children: [/* @__PURE__ */ (0, n.jsx)(js, { size: 17 }), P]
      }),
      Y && /* @__PURE__ */ (0, n.jsx)("div", {
        className: "modal-backdrop",
        onMouseDown: (u) => {
          u.target === u.currentTarget && !Q && pe(null);
        },
        children: /* @__PURE__ */ (0, n.jsxs)("section", {
          className: "modal " + (Y === "shot" ? "large" : ""),
          role: "dialog",
          "aria-modal": "true",
          "aria-label": Y === "create" ? "建立製作專案" : Y === "shot" ? "鏡頭素材紀錄" : "製作確認",
          children: [/* @__PURE__ */ (0, n.jsxs)("div", {
            className: "modal-head",
            children: [/* @__PURE__ */ (0, n.jsx)("h2", { children: Y === "create" ? "建立製作專案" : Y === "shot" ? "鏡頭素材紀錄" : Y === "issue" ? "記錄退修問題" : Y === "resolve" ? "修正與複核結果" : y?.archived ? "還原專案" : "封存專案" }), /* @__PURE__ */ (0, n.jsx)("button", {
              className: "icon-btn",
              "aria-label": "關閉視窗",
              disabled: Q,
              onClick: () => pe(null),
              children: /* @__PURE__ */ (0, n.jsx)(Ss, { size: 21 })
            })]
          }), /* @__PURE__ */ (0, n.jsxs)("form", {
            onSubmit: tt,
            children: [
              Y === "create" ? /* @__PURE__ */ (0, n.jsxs)(n.Fragment, { children: [/* @__PURE__ */ (0, n.jsx)("p", {
                className: "muted",
                children: "依手冊建立完整流程，從待製作開始記錄。"
              }), [["title", "專案名稱"], ["episode", "集數"]].map(([u, me]) => /* @__PURE__ */ (0, n.jsxs)("label", {
                className: "form-field",
                children: [me, /* @__PURE__ */ (0, n.jsx)("input", {
                  required: !0,
                  maxLength: u === "title" ? 200 : 60,
                  value: ue[u] || "",
                  onChange: (xe) => Ae({
                    ...ue,
                    [u]: xe.target.value
                  })
                })]
              }, u))] }) : Y === "shot" ? /* @__PURE__ */ (0, n.jsxs)(n.Fragment, { children: [
                /* @__PURE__ */ (0, n.jsx)("p", {
                  className: "muted",
                  children: "修改既有鏡頭請使用相同 ID。系統保留前次紀錄，並要求重新驗收。"
                }),
                /* @__PURE__ */ (0, n.jsx)("div", {
                  className: "shot-form",
                  children: xp.map(([u, me]) => /* @__PURE__ */ (0, n.jsxs)("label", {
                    className: "form-field",
                    children: [me, /* @__PURE__ */ (0, n.jsx)("input", {
                      required: [
                        "id",
                        "scene",
                        "description"
                      ].includes(u),
                      maxLength: u === "id" ? 100 : 12e3,
                      value: ue[u] || "",
                      placeholder: u === "id" ? "如 EP01_S06_SH03" : "",
                      onChange: (xe) => Ae({
                        ...ue,
                        [u]: xe.target.value
                      })
                    })]
                  }, u))
                }),
                y?.shots.find((u) => u.id === ue.id)?.versions.length ? /* @__PURE__ */ (0, n.jsxs)("details", { children: [/* @__PURE__ */ (0, n.jsx)("summary", { children: "查看保留的舊版本" }), y.shots.find((u) => u.id === ue.id).versions.map((u, me) => /* @__PURE__ */ (0, n.jsxs)("pre", { children: [
                  tn(u.at),
                  " · ",
                  u.by,
                  `
`,
                  JSON.stringify(u.data, null, 2)
                ] }, me))] }) : null
              ] }) : Y === "issue" ? /* @__PURE__ */ (0, n.jsxs)(n.Fragment, { children: [
                /* @__PURE__ */ (0, n.jsxs)("label", {
                  className: "form-field",
                  children: ["回查階段", /* @__PURE__ */ (0, n.jsx)("select", {
                    value: ue.stageId || "08",
                    onChange: (u) => Ae({
                      ...ue,
                      stageId: u.target.value
                    }),
                    children: ws(y).map((u) => /* @__PURE__ */ (0, n.jsxs)("option", {
                      value: u.id,
                      children: [
                        u.id,
                        " ",
                        u.title
                      ]
                    }, u.id))
                  })]
                }),
                /* @__PURE__ */ (0, n.jsxs)("label", {
                  className: "form-field",
                  children: ["受影響鏡頭（選填）", /* @__PURE__ */ (0, n.jsxs)("select", {
                    value: ue.shotId || "",
                    onChange: (u) => Ae({
                      ...ue,
                      shotId: u.target.value
                    }),
                    children: [/* @__PURE__ */ (0, n.jsx)("option", {
                      value: "",
                      children: "整個階段"
                    }), y.shots.map((u) => /* @__PURE__ */ (0, n.jsx)("option", { children: u.id }, u.id))]
                  })]
                }),
                /* @__PURE__ */ (0, n.jsxs)("label", {
                  className: "form-field",
                  children: ["具體問題與回查原因", /* @__PURE__ */ (0, n.jsx)("textarea", {
                    required: !0,
                    rows: 5,
                    value: ue.reason || "",
                    onChange: (u) => Ae({
                      ...ue,
                      reason: u.target.value
                    })
                  })]
                }),
                /* @__PURE__ */ (0, n.jsx)("p", {
                  className: "muted",
                  children: "此階段與受影響的下游核定將標為待修正，修正後重新驗收。"
                })
              ] }) : Y === "resolve" ? /* @__PURE__ */ (0, n.jsxs)("label", {
                className: "form-field",
                children: ["已修正內容與複核依據", /* @__PURE__ */ (0, n.jsx)("textarea", {
                  required: !0,
                  rows: 6,
                  value: ue.resolution || "",
                  onChange: (u) => Ae({
                    ...ue,
                    resolution: u.target.value
                  })
                })]
              }) : /* @__PURE__ */ (0, n.jsxs)("p", { children: ["專案", y?.archived ? "還原後可繼續製作。" : "封存後會保留全部進度與紀錄，可隨時還原。"] }),
              G && /* @__PURE__ */ (0, n.jsx)("div", {
                className: "modal-error",
                role: "alert",
                children: G
              }),
              /* @__PURE__ */ (0, n.jsxs)("div", {
                className: "modal-actions",
                children: [/* @__PURE__ */ (0, n.jsx)("button", {
                  type: "button",
                  className: "btn",
                  disabled: Q,
                  onClick: () => pe(null),
                  children: "取消"
                }), /* @__PURE__ */ (0, n.jsxs)("button", {
                  type: "submit",
                  className: "btn primary",
                  disabled: Q,
                  children: [Q ? /* @__PURE__ */ (0, n.jsx)(Gr, {
                    className: "spin",
                    size: 16
                  }) : null, Y === "create" ? "建立專案" : Y === "archive" ? y?.archived ? "還原專案" : "確認封存" : "儲存紀錄"]
                })]
              })
            ]
          })]
        })
      })
    ]
  });
}
var Wr = {
  animation: "動畫製作",
  software: "軟體開發",
  general: "一般專案"
}, gp = {
  animation: [
    "企劃與設定",
    "動畫製作",
    "模型製作",
    "檢查與交付"
  ],
  software: [
    "需求整理",
    "設計",
    "實作",
    "測試",
    "發布",
    "維護"
  ],
  general: [
    "規劃",
    "執行",
    "檢查",
    "交付"
  ]
}, Fr = (r) => new Date(r).toLocaleString("zh-TW", {
  timeZone: "Asia/Taipei",
  month: "numeric",
  day: "numeric",
  hour: "2-digit",
  minute: "2-digit"
}), Pr = {
  partial: "進行中",
  completed: "已完成回報",
  blocked: "遇到卡點",
  todo: "待處理",
  doing: "進行中",
  done: "已完成"
};
function ix({ nativeTransport: r } = {}) {
  const [m, C] = (0, A.useState)([]), [p, d] = (0, A.useState)(null), [M, y] = (0, A.useState)("overview"), [L, T] = (0, A.useState)(null), [k, z] = (0, A.useState)("resume"), [K, U] = (0, A.useState)(!0), [ie, fe] = (0, A.useState)(!1), [J, I] = (0, A.useState)(""), [oe, Q] = (0, A.useState)(""), [de, G] = (0, A.useState)(""), [W, P] = (0, A.useState)(!1), [ae, ce] = (0, A.useState)(null), [X, b] = (0, A.useState)({}), le = (0, A.useRef)(!1), ve = (0, A.useCallback)((S) => {
    le.current = S;
  }, []), Me = (0, A.useRef)(0), g = (0, A.useRef)(ae), F = (0, A.useRef)("");
  g.current = ae;
  const V = (0, A.useCallback)(async (S = "", $) => {
    const se = r ? await r("workspace", S, $) : await fetch("/api/workspace" + S, {
      cache: "no-store",
      ...$ ? {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify($)
      } : {}
    });
    if (!se.headers.get("content-type")?.includes("application/json")) throw Error("請先登入立之雲端庫再開啟工作台");
    const ze = await se.json();
    if (!se.ok) throw Error(ze.error || "讀取失敗");
    return ze;
  }, [r]), R = (0, A.useCallback)(async (S = F.current) => {
    const $ = ++Me.current;
    try {
      const se = await V(), ze = S ? await V("?id=" + encodeURIComponent(S)) : null;
      if ($ !== Me.current) return;
      C(se), g.current || d(ze), I("");
    } catch (se) {
      $ === Me.current && I(se.message);
    } finally {
      $ === Me.current && U(!1);
    }
  }, [V]);
  (0, A.useEffect)(() => {
    R();
    const S = setInterval(() => {
      g.current || R();
    }, 3e4);
    return () => clearInterval(S);
  }, [R]), (0, A.useEffect)(() => {
    if (!ae) return;
    const S = ($) => $.preventDefault();
    return window.addEventListener("beforeunload", S), () => window.removeEventListener("beforeunload", S);
  }, [ae]), (0, A.useEffect)(() => {
    if (!oe) return;
    const S = setTimeout(() => Q(""), 4e3);
    return () => clearTimeout(S);
  }, [oe]);
  async function Y(S) {
    F.current = S, U(!0), d(null), y("overview"), await R(S);
  }
  function pe() {
    Me.current++, F.current = "", d(null), T(null), y("overview"), R("");
  }
  function ue(S) {
    b(S === "create" ? {
      kind: "software",
      title: "",
      objective: ""
    } : S === "edit" ? {
      objective: p?.objective ?? "",
      title: p?.title ?? ""
    } : S === "record" ? {
      key: crypto.randomUUID(),
      phase: gp[p.kind][0],
      status: "partial",
      verification: "",
      nextStep: ""
    } : {
      phase: gp[p.kind][0],
      status: "todo"
    }), ce(S);
  }
  async function Ae(S) {
    S.preventDefault(), fe(!0), I(""), Me.current++;
    try {
      const $ = await V("", {
        action: ae === "create" ? "createWorkspaceProject" : ae === "record" ? "appendWorkspaceRecord" : ae === "task" ? "saveWorkspaceTask" : "updateWorkspaceProject",
        id: p?.id,
        revision: p?.revision,
        args: X
      });
      F.current = $.id, d($), ce(null), g.current = null, Q("已儲存至雲端"), await R($.id);
    } catch ($) {
      I($.message);
    } finally {
      fe(!1);
    }
  }
  async function x() {
    if (p) {
      fe(!0);
      try {
        const S = await V("", {
          action: "updateWorkspaceProject",
          id: p.id,
          revision: p.revision,
          args: { archived: !p.archived }
        });
        d(S), await R(S.id);
      } catch (S) {
        I(S.message);
      } finally {
        fe(!1);
      }
    }
  }
  async function H() {
    if (p) {
      fe(!0);
      try {
        const S = async (Ge, we) => {
          const Xe = r ? await r(Ge, we) : await fetch("/api/" + Ge + we, { cache: "no-store" });
          if (!Xe.ok) throw Error("匯出失敗，請重新讀取");
          return Xe.json();
        }, $ = await V("?id=" + encodeURIComponent(p.id));
        let se = null;
        if ($.animation) {
          const Ge = await S("works", "?id=" + encodeURIComponent($.animation.workId)), we = [];
          for (const Xe of $.animation.episodes) we.push(await S("projects", "?id=" + encodeURIComponent(Xe.id)));
          se = {
            work: Ge.work,
            episodes: we
          };
        }
        const ze = new Blob([JSON.stringify({
          schemaVersion: 1,
          exportedAt: (/* @__PURE__ */ new Date()).toISOString(),
          project: $,
          animation: se
        }, null, 2)], { type: "application/json" }), ye = URL.createObjectURL(ze), Je = document.createElement("a");
        Je.href = ye, Je.download = p.title.replace(/[\\/:*?"<>|]/g, "_") + "_專案備份.json", Je.click(), setTimeout(() => URL.revokeObjectURL(ye), 1e3);
      } catch (S) {
        I(S.message);
      } finally {
        fe(!1);
      }
    }
  }
  function Z(S) {
    p?.workId && (z(S), T(p.workId));
  }
  const ee = (S) => S.map(([$, se, ze, ye]) => /* @__PURE__ */ (0, n.jsxs)("label", {
    className: "form-field",
    children: [se, ye ? /* @__PURE__ */ (0, n.jsx)("textarea", {
      rows: $ === "summary" ? 5 : 3,
      required: ze,
      maxLength: 12e3,
      value: X[$] ?? "",
      onChange: (Je) => b({
        ...X,
        [$]: Je.target.value
      })
    }) : /* @__PURE__ */ (0, n.jsx)("input", {
      required: ze,
      maxLength: $ === "title" ? 300 : 200,
      value: X[$] ?? "",
      onChange: (Je) => b({
        ...X,
        [$]: Je.target.value
      })
    })]
  }, $));
  return L ? /* @__PURE__ */ (0, n.jsxs)(n.Fragment, { children: [/* @__PURE__ */ (0, n.jsxs)("div", {
    className: "project-return",
    children: [/* @__PURE__ */ (0, n.jsxs)("button", {
      className: "text-btn",
      onClick: () => {
        le.current && !window.confirm("動畫或模型有尚未儲存的修改，要離開嗎？") || (le.current = !1, T(null), R());
      },
      children: [
        /* @__PURE__ */ (0, n.jsx)(np, { size: 16 }),
        "返回 ",
        p?.title,
        " 專案"
      ]
    }), /* @__PURE__ */ (0, n.jsx)("span", { children: "動畫與模型共用此專案的版本及來源" })]
  }), /* @__PURE__ */ (0, n.jsx)(nx, {
    nativeTransport: r,
    initialWorkId: L === "legacy" ? void 0 : L,
    initialTab: k,
    onDirtyChange: ve
  }, L + k)] }) : /* @__PURE__ */ (0, n.jsxs)("div", {
    className: "project-hub",
    children: [
      /* @__PURE__ */ (0, n.jsxs)("header", {
        className: "hub-header",
        children: [/* @__PURE__ */ (0, n.jsxs)("div", {
          className: "hub-brand",
          children: [/* @__PURE__ */ (0, n.jsx)(Br, { size: 22 }), /* @__PURE__ */ (0, n.jsx)("b", { children: "專案工作台" })]
        }), /* @__PURE__ */ (0, n.jsx)("button", {
          className: "icon-btn",
          "aria-label": "重新整理",
          disabled: ie || K || !!ae,
          onClick: () => {
            R();
          },
          children: /* @__PURE__ */ (0, n.jsx)(co, { size: 18 })
        })]
      }),
      /* @__PURE__ */ (0, n.jsxs)("main", {
        className: "hub-main",
        children: [
          J && /* @__PURE__ */ (0, n.jsxs)("div", {
            className: "error-banner",
            role: "alert",
            children: [J, /* @__PURE__ */ (0, n.jsx)("button", {
              "aria-label": "關閉錯誤",
              onClick: () => I(""),
              children: /* @__PURE__ */ (0, n.jsx)(Ss, { size: 16 })
            })]
          }),
          F.current && /* @__PURE__ */ (0, n.jsxs)("button", {
            className: "text-btn hub-back",
            onClick: pe,
            children: [/* @__PURE__ */ (0, n.jsx)(np, { size: 16 }), "所有專案"]
          }),
          K ? /* @__PURE__ */ (0, n.jsx)("div", {
            className: "empty",
            children: "讀取專案中…"
          }) : p ? /* @__PURE__ */ (0, n.jsxs)(n.Fragment, { children: [
            /* @__PURE__ */ (0, n.jsxs)("div", {
              className: "page-heading",
              children: [/* @__PURE__ */ (0, n.jsxs)("div", { children: [
                /* @__PURE__ */ (0, n.jsxs)("div", {
                  className: "eyebrow",
                  children: [Wr[p.kind], p.archived ? " · 已封存" : ""]
                }),
                /* @__PURE__ */ (0, n.jsx)("h1", { children: p.title }),
                /* @__PURE__ */ (0, n.jsx)("p", { children: p.objective || "先記下目標，再開始工作。" })
              ] }), /* @__PURE__ */ (0, n.jsxs)("div", {
                className: "heading-actions",
                children: [/* @__PURE__ */ (0, n.jsxs)("button", {
                  className: "btn",
                  disabled: ie,
                  onClick: () => {
                    H();
                  },
                  children: [/* @__PURE__ */ (0, n.jsx)(io, { size: 15 }), "備份專案"]
                }), /* @__PURE__ */ (0, n.jsx)("button", {
                  className: "icon-btn bordered",
                  disabled: ie,
                  "aria-label": p.archived ? "還原專案" : "封存專案",
                  title: p.archived ? "還原專案" : "封存專案",
                  onClick: () => {
                    x();
                  },
                  children: /* @__PURE__ */ (0, n.jsx)(bp, { size: 17 })
                })]
              })]
            }),
            /* @__PURE__ */ (0, n.jsx)("nav", {
              className: "hub-tabs",
              "aria-label": "專案內容",
              children: [
                ["overview", "總覽"],
                ["journal", "工作紀錄"],
                ["tasks", "待辦"],
                ["outputs", "成果"]
              ].map(([S, $]) => /* @__PURE__ */ (0, n.jsx)("button", {
                className: M === S ? "active" : "",
                "aria-current": M === S ? "page" : void 0,
                onClick: () => y(S),
                children: $
              }, S))
            }),
            M === "overview" ? /* @__PURE__ */ (0, n.jsxs)(n.Fragment, { children: [
              /* @__PURE__ */ (0, n.jsxs)("section", {
                className: "handoff-card",
                children: [
                  /* @__PURE__ */ (0, n.jsx)("div", {
                    className: "eyebrow",
                    children: "接著做什麼"
                  }),
                  /* @__PURE__ */ (0, n.jsx)("h2", { children: p.handoff?.nextStep || "尚無交接紀錄" }),
                  /* @__PURE__ */ (0, n.jsx)("p", { children: p.handoff?.summary || "把本次工作內容、驗證結果及下一步寫進工作紀錄，下一位接手就能繼續。" }),
                  p.handoff?.blockers && /* @__PURE__ */ (0, n.jsxs)("div", {
                    className: "inline-note",
                    children: ["目前卡點：", p.handoff.blockers]
                  }),
                  /* @__PURE__ */ (0, n.jsxs)("button", {
                    className: "btn primary",
                    disabled: p.archived,
                    onClick: () => ue("record"),
                    children: [/* @__PURE__ */ (0, n.jsx)(aa, { size: 16 }), "記錄這次工作"]
                  })
                ]
              }),
              p.animation && /* @__PURE__ */ (0, n.jsxs)("div", {
                className: "hub-module-grid",
                children: [/* @__PURE__ */ (0, n.jsxs)("button", {
                  className: "module-card",
                  onClick: () => Z("resume"),
                  children: [
                    /* @__PURE__ */ (0, n.jsx)(nn, { size: 26 }),
                    /* @__PURE__ */ (0, n.jsx)("h3", { children: "動畫製作" }),
                    /* @__PURE__ */ (0, n.jsxs)("p", { children: [p.animation.episodes.length, " 集 · 劇本、鏡頭、OP／ED 與交付"] }),
                    /* @__PURE__ */ (0, n.jsx)("span", { children: "進入動畫流程 →" })
                  ]
                }), /* @__PURE__ */ (0, n.jsxs)("button", {
                  className: "module-card",
                  onClick: () => Z("models"),
                  children: [
                    /* @__PURE__ */ (0, n.jsx)(mm, { size: 26 }),
                    /* @__PURE__ */ (0, n.jsx)("h3", { children: "模型製作" }),
                    /* @__PURE__ */ (0, n.jsxs)("p", { children: [p.animation.modelCount, " 個模型 · 來源、候選版本與檢查"] }),
                    /* @__PURE__ */ (0, n.jsx)("span", { children: "進入模型流程 →" })
                  ]
                })]
              }),
              /* @__PURE__ */ (0, n.jsxs)("section", {
                className: "wide-card",
                children: [
                  /* @__PURE__ */ (0, n.jsxs)("div", {
                    className: "section-title",
                    children: [/* @__PURE__ */ (0, n.jsx)("h2", { children: "專案範圍" }), /* @__PURE__ */ (0, n.jsx)("button", {
                      className: "text-btn",
                      disabled: p.archived,
                      onClick: () => ue("edit"),
                      children: "編輯目標"
                    })]
                  }),
                  /* @__PURE__ */ (0, n.jsx)("p", { children: p.objective || "尚未填寫" }),
                  /* @__PURE__ */ (0, n.jsx)("div", {
                    className: "phase-chips",
                    children: p.phases.map((S) => /* @__PURE__ */ (0, n.jsx)("span", { children: S }, S))
                  }),
                  /* @__PURE__ */ (0, n.jsxs)("p", {
                    className: "muted",
                    children: [
                      p.tasks.filter((S) => S.status !== "done").length,
                      " 項待辦 · ",
                      p.journal.length,
                      " 筆工作紀錄 · 更新於 ",
                      Fr(p.updatedAt)
                    ]
                  })
                ]
              })
            ] }) : M === "journal" ? /* @__PURE__ */ (0, n.jsxs)("section", {
              className: "wide-card",
              children: [/* @__PURE__ */ (0, n.jsxs)("div", {
                className: "section-title",
                children: [/* @__PURE__ */ (0, n.jsxs)("div", { children: [/* @__PURE__ */ (0, n.jsx)("h2", { children: "工作紀錄" }), /* @__PURE__ */ (0, n.jsx)("p", { children: "保留做法、結果和接續位置，依時間接著寫。" })] }), /* @__PURE__ */ (0, n.jsxs)("button", {
                  className: "btn primary",
                  disabled: p.archived,
                  onClick: () => ue("record"),
                  children: [/* @__PURE__ */ (0, n.jsx)(aa, { size: 16 }), "新增紀錄"]
                })]
              }), p.journal.length ? [...p.journal].reverse().map((S) => /* @__PURE__ */ (0, n.jsxs)("article", {
                className: "journal-card",
                children: [
                  /* @__PURE__ */ (0, n.jsxs)("div", {
                    className: "journal-meta",
                    children: [/* @__PURE__ */ (0, n.jsxs)("span", {
                      className: "status",
                      children: [
                        S.phase,
                        " · ",
                        Pr[S.status]
                      ]
                    }), /* @__PURE__ */ (0, n.jsxs)("small", { children: [
                      Fr(S.at),
                      " · ",
                      S.by,
                      S.actor === "ai" ? " · AI 回報" : ""
                    ] })]
                  }),
                  /* @__PURE__ */ (0, n.jsx)("h3", { children: S.summary }),
                  /* @__PURE__ */ (0, n.jsxs)("dl", { children: [
                    /* @__PURE__ */ (0, n.jsx)("dt", { children: "成果與版本" }),
                    /* @__PURE__ */ (0, n.jsx)("dd", { children: S.evidence || "尚無產出" }),
                    /* @__PURE__ */ (0, n.jsx)("dt", { children: "驗證結果" }),
                    /* @__PURE__ */ (0, n.jsx)("dd", { children: S.verification }),
                    S.blockers && /* @__PURE__ */ (0, n.jsxs)(n.Fragment, { children: [/* @__PURE__ */ (0, n.jsx)("dt", { children: "卡點" }), /* @__PURE__ */ (0, n.jsx)("dd", { children: S.blockers })] }),
                    /* @__PURE__ */ (0, n.jsx)("dt", { children: "下一步" }),
                    /* @__PURE__ */ (0, n.jsx)("dd", { children: S.nextStep })
                  ] })
                ]
              }, S.id)) : /* @__PURE__ */ (0, n.jsx)("div", {
                className: "empty",
                children: "尚無紀錄，從這次工作開始。"
              })]
            }) : M === "tasks" ? /* @__PURE__ */ (0, n.jsxs)("section", {
              className: "wide-card",
              children: [/* @__PURE__ */ (0, n.jsxs)("div", {
                className: "section-title",
                children: [/* @__PURE__ */ (0, n.jsx)("h2", { children: "待辦事項" }), /* @__PURE__ */ (0, n.jsxs)("button", {
                  className: "btn primary",
                  disabled: p.archived,
                  onClick: () => ue("task"),
                  children: [/* @__PURE__ */ (0, n.jsx)(aa, { size: 16 }), "新增待辦"]
                })]
              }), p.tasks.length ? p.tasks.map((S) => /* @__PURE__ */ (0, n.jsxs)("article", {
                className: "task-card",
                children: [
                  /* @__PURE__ */ (0, n.jsx)(lm, { size: 18 }),
                  /* @__PURE__ */ (0, n.jsxs)("div", { children: [
                    /* @__PURE__ */ (0, n.jsx)("b", { children: S.title }),
                    /* @__PURE__ */ (0, n.jsxs)("small", { children: [
                      S.phase,
                      " · ",
                      Pr[S.status]
                    ] }),
                    S.evidence && /* @__PURE__ */ (0, n.jsx)("p", { children: S.evidence })
                  ] }),
                  /* @__PURE__ */ (0, n.jsx)("button", {
                    className: "text-btn",
                    disabled: p.archived,
                    onClick: () => {
                      b({ ...S }), ce("task");
                    },
                    children: "更新"
                  })
                ]
              }, S.id)) : /* @__PURE__ */ (0, n.jsx)("div", {
                className: "empty",
                children: "還沒有待辦事項。"
              })]
            }) : /* @__PURE__ */ (0, n.jsxs)("section", {
              className: "wide-card",
              children: [
                /* @__PURE__ */ (0, n.jsx)("h2", { children: "成果與版本" }),
                /* @__PURE__ */ (0, n.jsx)("p", {
                  className: "muted",
                  children: "從工作紀錄彙整，保留提交時的位置與版本。"
                }),
                !p.journal.some((S) => S.evidence) && /* @__PURE__ */ (0, n.jsx)("div", {
                  className: "empty",
                  children: "尚未登記成果位置。"
                }),
                [...p.journal].reverse().filter((S) => S.evidence).map((S) => /* @__PURE__ */ (0, n.jsxs)("article", {
                  className: "journal-card",
                  children: [
                    /* @__PURE__ */ (0, n.jsxs)("b", { children: [
                      S.phase,
                      " · ",
                      Fr(S.at)
                    ] }),
                    /* @__PURE__ */ (0, n.jsx)("p", {
                      className: "preserve-text",
                      children: S.evidence
                    }),
                    /* @__PURE__ */ (0, n.jsx)("small", { children: S.verification })
                  ]
                }, S.id))
              ]
            })
          ] }) : /* @__PURE__ */ (0, n.jsxs)(n.Fragment, { children: [
            /* @__PURE__ */ (0, n.jsxs)("div", {
              className: "page-heading",
              children: [/* @__PURE__ */ (0, n.jsxs)("div", { children: [
                /* @__PURE__ */ (0, n.jsx)("div", {
                  className: "eyebrow",
                  children: "立之雲端庫"
                }),
                /* @__PURE__ */ (0, n.jsx)("h1", { children: "所有專案" }),
                /* @__PURE__ */ (0, n.jsx)("p", { children: "先選專案，再查看進度與接續工作。" })
              ] }), /* @__PURE__ */ (0, n.jsxs)("button", {
                className: "btn primary",
                onClick: () => ue("create"),
                children: [/* @__PURE__ */ (0, n.jsx)(aa, { size: 17 }), "建立專案"]
              })]
            }),
            /* @__PURE__ */ (0, n.jsxs)("div", {
              className: "hub-filter",
              children: [/* @__PURE__ */ (0, n.jsxs)("label", {
                className: "search",
                children: [/* @__PURE__ */ (0, n.jsx)(Sp, { size: 16 }), /* @__PURE__ */ (0, n.jsx)("input", {
                  "aria-label": "搜尋專案",
                  placeholder: "搜尋專案名稱或目標",
                  value: de,
                  onChange: (S) => G(S.target.value)
                })]
              }), /* @__PURE__ */ (0, n.jsxs)("label", { children: [/* @__PURE__ */ (0, n.jsx)("input", {
                type: "checkbox",
                checked: W,
                onChange: (S) => P(S.target.checked)
              }), " 顯示封存"] })]
            }),
            /* @__PURE__ */ (0, n.jsx)("div", {
              className: "hub-project-grid",
              children: m.filter((S) => (W || !S.archived) && (S.title + " " + S.objective).toLowerCase().includes(de.toLowerCase())).map((S) => /* @__PURE__ */ (0, n.jsxs)("button", {
                className: "hub-project-card",
                onClick: () => {
                  Y(S.id);
                },
                children: [
                  /* @__PURE__ */ (0, n.jsxs)("div", {
                    className: "project-card-top",
                    children: [S.kind === "animation" ? /* @__PURE__ */ (0, n.jsx)(nn, { size: 24 }) : S.kind === "software" ? /* @__PURE__ */ (0, n.jsx)(cm, { size: 24 }) : /* @__PURE__ */ (0, n.jsx)(Br, { size: 24 }), /* @__PURE__ */ (0, n.jsxs)("span", { children: [Wr[S.kind], S.archived ? " · 已封存" : ""] })]
                  }),
                  /* @__PURE__ */ (0, n.jsx)("h2", { children: S.title }),
                  /* @__PURE__ */ (0, n.jsx)("p", { children: S.objective || "尚未填寫專案目標" }),
                  S.kind === "animation" && /* @__PURE__ */ (0, n.jsxs)("div", {
                    className: "phase-chips",
                    children: [/* @__PURE__ */ (0, n.jsxs)("span", { children: [
                      "動畫 · ",
                      S.episodeCount,
                      " 集"
                    ] }), /* @__PURE__ */ (0, n.jsxs)("span", { children: [
                      "模型 · ",
                      S.modelCount,
                      " 個"
                    ] })]
                  }),
                  /* @__PURE__ */ (0, n.jsxs)("div", {
                    className: "project-card-next",
                    children: [/* @__PURE__ */ (0, n.jsx)("small", { children: "下一步" }), /* @__PURE__ */ (0, n.jsx)("strong", { children: S.lastRecord?.nextStep || "開啟專案，查看現有進度" })]
                  }),
                  /* @__PURE__ */ (0, n.jsxs)("div", {
                    className: "project-card-bottom",
                    children: [/* @__PURE__ */ (0, n.jsxs)("span", { children: [
                      S.openTasks,
                      " 項待辦 · ",
                      S.recordCount,
                      " 筆工作紀錄"
                    ] }), /* @__PURE__ */ (0, n.jsx)("span", { children: "開啟 →" })]
                  })
                ]
              }, S.id))
            }),
            !m.length && /* @__PURE__ */ (0, n.jsxs)("div", {
              className: "empty",
              children: [
                /* @__PURE__ */ (0, n.jsx)(Br, { size: 32 }),
                /* @__PURE__ */ (0, n.jsx)("h3", { children: "建立第一個專案" }),
                /* @__PURE__ */ (0, n.jsx)("p", { children: "動畫、軟體或其他工作，都從一個明確的目標開始。" })
              ]
            }),
            /* @__PURE__ */ (0, n.jsx)("p", {
              className: "hub-help",
              children: "專案分開保存來源、工作紀錄與成果。動畫專案內含集數及共用模型。"
            }),
            /* @__PURE__ */ (0, n.jsxs)("details", {
              className: "hub-help",
              children: [
                /* @__PURE__ */ (0, n.jsx)("summary", { children: "舊版獨立單集紀錄" }),
                /* @__PURE__ */ (0, n.jsx)("p", { children: "早期尚未歸屬作品的試用紀錄，可在舊版清單選取「未歸屬單集」查看。" }),
                /* @__PURE__ */ (0, n.jsx)("button", {
                  className: "text-btn",
                  onClick: () => {
                    z("resume"), T("legacy");
                  },
                  children: "開啟舊版單集清單 →"
                })
              ]
            })
          ] })
        ]
      }),
      /* @__PURE__ */ (0, n.jsx)("footer", {
        className: "hub-footer",
        children: "專案工作台 · v6.0"
      }),
      oe && /* @__PURE__ */ (0, n.jsx)("div", {
        className: "toast",
        role: "status",
        children: oe
      }),
      ae && /* @__PURE__ */ (0, n.jsx)("div", {
        className: "modal-backdrop",
        children: /* @__PURE__ */ (0, n.jsxs)("section", {
          className: "modal",
          role: "dialog",
          "aria-modal": "true",
          "aria-label": ae === "create" ? "建立專案" : ae === "record" ? "新增工作紀錄" : ae === "task" ? "待辦事項" : "編輯專案",
          children: [/* @__PURE__ */ (0, n.jsxs)("div", {
            className: "modal-head",
            children: [/* @__PURE__ */ (0, n.jsx)("h2", { children: ae === "create" ? "建立專案" : ae === "record" ? "記錄這次工作" : ae === "task" ? "待辦事項" : "編輯專案" }), /* @__PURE__ */ (0, n.jsx)("button", {
              className: "icon-btn",
              "aria-label": "關閉視窗",
              disabled: ie,
              onClick: () => {
                window.confirm("關閉後將放棄此表單尚未儲存的內容。") && ce(null);
              },
              children: /* @__PURE__ */ (0, n.jsx)(Ss, { size: 20 })
            })]
          }), /* @__PURE__ */ (0, n.jsxs)("form", {
            onSubmit: Ae,
            children: [
              ae === "create" ? /* @__PURE__ */ (0, n.jsxs)(n.Fragment, { children: [
                /* @__PURE__ */ (0, n.jsxs)("label", {
                  className: "form-field",
                  children: ["專案類型", /* @__PURE__ */ (0, n.jsx)("select", {
                    value: X.kind,
                    onChange: (S) => b({
                      ...X,
                      kind: S.target.value
                    }),
                    children: Object.entries(Wr).map(([S, $]) => /* @__PURE__ */ (0, n.jsx)("option", {
                      value: S,
                      children: $
                    }, S))
                  })]
                }),
                ee([[
                  "title",
                  "專案名稱",
                  !0
                ], [
                  "objective",
                  "這個專案要完成什麼",
                  !1,
                  !0
                ]]),
                /* @__PURE__ */ (0, n.jsx)("p", {
                  className: "muted",
                  children: X.kind === "animation" ? "建立動畫與共用模型的專案，內含空白 EP01。" : X.kind === "software" ? "依需求、設計、實作、測試、發布與維護記錄工作。" : "依規劃、執行、檢查及交付記錄工作。"
                })
              ] }) : ae === "edit" ? ee([...p?.kind !== "animation" ? [[
                "title",
                "專案名稱",
                !0
              ]] : [], [
                "objective",
                "專案目標與範圍",
                !1,
                !0
              ]]) : /* @__PURE__ */ (0, n.jsxs)(n.Fragment, { children: [
                /* @__PURE__ */ (0, n.jsxs)("label", {
                  className: "form-field",
                  children: ["工作階段", /* @__PURE__ */ (0, n.jsx)("select", {
                    value: X.phase,
                    onChange: (S) => b({
                      ...X,
                      phase: S.target.value
                    }),
                    children: p.phases.map((S) => /* @__PURE__ */ (0, n.jsx)("option", { children: S }, S))
                  })]
                }),
                /* @__PURE__ */ (0, n.jsxs)("label", {
                  className: "form-field",
                  children: ["狀態", /* @__PURE__ */ (0, n.jsx)("select", {
                    value: X.status,
                    onChange: (S) => b({
                      ...X,
                      status: S.target.value
                    }),
                    children: (ae === "record" ? [
                      "partial",
                      "completed",
                      "blocked"
                    ] : [
                      "todo",
                      "doing",
                      "done",
                      "blocked"
                    ]).map((S) => /* @__PURE__ */ (0, n.jsx)("option", {
                      value: S,
                      children: Pr[S]
                    }, S))
                  })]
                }),
                ee(ae === "record" ? [
                  [
                    "summary",
                    "這次做了什麼、如何處理",
                    !0,
                    !0
                  ],
                  [
                    "evidence",
                    "成果位置與版本",
                    X.status === "completed",
                    !0
                  ],
                  [
                    "verification",
                    "實際做過的檢查、結果與限制",
                    !0,
                    !0
                  ],
                  [
                    "blockers",
                    "目前卡點",
                    X.status === "blocked",
                    !0
                  ],
                  [
                    "nextStep",
                    "下一位接手要做什麼",
                    !0,
                    !0
                  ]
                ] : [[
                  "title",
                  "待辦內容",
                  !0
                ], [
                  "evidence",
                  "成果或處理依據",
                  X.status === "done",
                  !0
                ]])
              ] }),
              J && /* @__PURE__ */ (0, n.jsx)("div", {
                className: "modal-error",
                role: "alert",
                children: J
              }),
              /* @__PURE__ */ (0, n.jsx)("div", {
                className: "modal-actions",
                children: /* @__PURE__ */ (0, n.jsx)("button", {
                  className: "btn primary",
                  disabled: ie,
                  type: "submit",
                  children: ie ? "儲存中…" : "儲存至專案"
                })
              })
            ]
          })]
        })
      })
    ]
  });
}
var sx = `
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

:host{display:block;--bg:#f7f8fa;--ink:#23322e;--muted:#85908b;--green:#326552;--border:#e4e9e6;--mint:#edf4ef;--font:'Noto Sans TC','Microsoft JhengHei',system-ui,sans-serif;color:var(--ink);font:14px/1.6 var(--font);background:var(--bg)}.native-production{min-width:0}.workspace{display:grid;grid-template-columns:230px minmax(0,1fr);min-height:calc(100dvh - 70px)}.sidebar{position:sticky;inset:auto;top:0;width:auto;height:calc(100dvh - 70px);overflow-y:auto;padding-top:20px}.brand{display:none}.main{margin-left:0!important}.topbar{height:48px}.page-content{padding:24px}.cloud-indicator{font-size:11px}.sidebar nav{max-height:none}.side-bottom{padding-top:20px}@media(max-width:850px){.workspace{grid-template-columns:185px minmax(0,1fr)}.page-content{padding:20px}}@media(max-width:600px){.workspace{display:block}.sidebar{position:relative;height:auto;padding:12px 16px 0}.main{margin:0}.topbar{display:none}.page-content{padding:20px 16px}.page-heading{margin-top:0}.page-heading p{max-width:none;font-size:12px}.sidebar .new-project{margin-bottom:6px}h1{font-size:24px}}`, cx = "https://hrdzywkihfqggiwjgavi.supabase.co/functions/v1/lizhi-production", Ns = /* @__PURE__ */ new WeakMap(), rx = async (r, m, C) => {
  const p = window.LizhiAuth;
  if (!p?.client) throw new Error("請先登入立之雲端庫");
  const { data: d, error: M } = await p.client.auth.getSession();
  if (M || !d.session?.access_token) throw new Error("登入已失效，請重新登入雲端庫");
  return fetch(cx + "/" + r + m, {
    cache: "no-store",
    headers: {
      Authorization: "Bearer " + d.session.access_token,
      apikey: window.LIZHI_SUPABASE_PUBLISHABLE_KEY,
      ...C ? { "Content-Type": "application/json" } : {}
    },
    ...C ? {
      method: "POST",
      body: JSON.stringify(C)
    } : {}
  });
};
function ox(r) {
  if (Ns.has(r)) return;
  const m = r.attachShadow({ mode: "open" }), C = document.createElement("style");
  C.textContent = sx, m.append(C);
  const p = document.createElement("div");
  p.className = "native-production", m.append(p);
  const d = (0, km.createRoot)(p);
  Ns.set(r, d), d.render(/* @__PURE__ */ (0, n.jsx)(ix, { nativeTransport: rx }));
}
function dx(r) {
  Ns.get(r)?.unmount(), Ns.delete(r);
}
export {
  ox as mount,
  dx as unmount
};
