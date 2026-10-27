var ca = (r, h) => () => (h || (r((h = { exports: {} }).exports, h), r = null), h.exports), Kh = /* @__PURE__ */ ca(((r) => {
  function h(K, Y) {
    var Q = K.length;
    K.push(Y);
    e: for (; 0 < Q; ) {
      var se = Q - 1 >>> 1, re = K[se];
      if (0 < p(re, Y)) K[se] = Y, K[Q] = re, Q = se;
      else break e;
    }
  }
  function C(K) {
    return K.length === 0 ? null : K[0];
  }
  function f(K) {
    if (K.length === 0) return null;
    var Y = K[0], Q = K.pop();
    if (Q !== Y) {
      K[0] = Q;
      e: for (var se = 0, re = K.length, _e = re >>> 1; se < _e; ) {
        var o = 2 * (se + 1) - 1, j = K[o], R = o + 1, W = K[R];
        if (0 > p(j, Q)) R < re && 0 > p(W, j) ? (K[se] = W, K[R] = Q, se = R) : (K[se] = j, K[o] = Q, se = o);
        else if (R < re && 0 > p(W, Q)) K[se] = W, K[R] = Q, se = R;
        else break e;
      }
    }
    return Y;
  }
  function p(K, Y) {
    var Q = K.sortIndex - Y.sortIndex;
    return Q !== 0 ? Q : K.id - Y.id;
  }
  if (r.unstable_now = void 0, typeof performance == "object" && typeof performance.now == "function") {
    var k = performance;
    r.unstable_now = function() {
      return k.now();
    };
  } else {
    var x = Date, A = x.now();
    r.unstable_now = function() {
      return x.now() - A;
    };
  }
  var N = [], _ = [], w = 1, G = null, z = 3, le = !1, ne = !1, I = !1, X = !1, oe = typeof setTimeout == "function" ? setTimeout : null, q = typeof clearTimeout == "function" ? clearTimeout : null, ie = typeof setImmediate < "u" ? setImmediate : null;
  function H(K) {
    for (var Y = C(_); Y !== null; ) {
      if (Y.callback === null) f(_);
      else if (Y.startTime <= K) f(_), Y.sortIndex = Y.expirationTime, h(N, Y);
      else break;
      Y = C(_);
    }
  }
  function F(K) {
    if (I = !1, H(K), !ne) if (C(N) !== null) ne = !0, $ || ($ = !0, ge());
    else {
      var Y = C(_);
      Y !== null && ae(F, Y.startTime - K);
    }
  }
  var $ = !1, pe = -1, te = 5, P = -1;
  function y() {
    return X ? !0 : !(r.unstable_now() - P < te);
  }
  function ee() {
    if (X = !1, $) {
      var K = r.unstable_now();
      P = K;
      var Y = !0;
      try {
        e: {
          ne = !1, I && (I = !1, q(pe), pe = -1), le = !0;
          var Q = z;
          try {
            t: {
              for (H(K), G = C(N); G !== null && !(G.expirationTime > K && y()); ) {
                var se = G.callback;
                if (typeof se == "function") {
                  G.callback = null, z = G.priorityLevel;
                  var re = se(G.expirationTime <= K);
                  if (K = r.unstable_now(), typeof re == "function") {
                    G.callback = re, H(K), Y = !0;
                    break t;
                  }
                  G === C(N) && f(N), H(K);
                } else f(N);
                G = C(N);
              }
              if (G !== null) Y = !0;
              else {
                var _e = C(_);
                _e !== null && ae(F, _e.startTime - K), Y = !1;
              }
            }
            break e;
          } finally {
            G = null, z = Q, le = !1;
          }
          Y = void 0;
        }
      } finally {
        Y ? ge() : $ = !1;
      }
    }
  }
  var ge;
  if (typeof ie == "function") ge = function() {
    ie(ee);
  };
  else if (typeof MessageChannel < "u") {
    var me = new MessageChannel(), b = me.port2;
    me.port1.onmessage = ee, ge = function() {
      b.postMessage(null);
    };
  } else ge = function() {
    oe(ee, 0);
  };
  function ae(K, Y) {
    pe = oe(function() {
      K(r.unstable_now());
    }, Y);
  }
  r.unstable_IdlePriority = 5, r.unstable_ImmediatePriority = 1, r.unstable_LowPriority = 4, r.unstable_NormalPriority = 3, r.unstable_Profiling = null, r.unstable_UserBlockingPriority = 2, r.unstable_cancelCallback = function(K) {
    K.callback = null;
  }, r.unstable_forceFrameRate = function(K) {
    0 > K || 125 < K ? console.error("forceFrameRate takes a positive int between 0 and 125, forcing frame rates higher than 125 fps is not supported") : te = 0 < K ? Math.floor(1e3 / K) : 5;
  }, r.unstable_getCurrentPriorityLevel = function() {
    return z;
  }, r.unstable_next = function(K) {
    switch (z) {
      case 1:
      case 2:
      case 3:
        var Y = 3;
        break;
      default:
        Y = z;
    }
    var Q = z;
    z = Y;
    try {
      return K();
    } finally {
      z = Q;
    }
  }, r.unstable_requestPaint = function() {
    X = !0;
  }, r.unstable_runWithPriority = function(K, Y) {
    switch (K) {
      case 1:
      case 2:
      case 3:
      case 4:
      case 5:
        break;
      default:
        K = 3;
    }
    var Q = z;
    z = K;
    try {
      return Y();
    } finally {
      z = Q;
    }
  }, r.unstable_scheduleCallback = function(K, Y, Q) {
    var se = r.unstable_now();
    switch (typeof Q == "object" && Q !== null ? (Q = Q.delay, Q = typeof Q == "number" && 0 < Q ? se + Q : se) : Q = se, K) {
      case 1:
        var re = -1;
        break;
      case 2:
        re = 250;
        break;
      case 5:
        re = 1073741823;
        break;
      case 4:
        re = 1e4;
        break;
      default:
        re = 5e3;
    }
    return re = Q + re, K = {
      id: w++,
      callback: Y,
      priorityLevel: K,
      startTime: Q,
      expirationTime: re,
      sortIndex: -1
    }, Q > se ? (K.sortIndex = Q, h(_, K), C(N) === null && K === C(_) && (I ? (q(pe), pe = -1) : I = !0, ae(F, Q - se))) : (K.sortIndex = re, h(N, K), ne || le || (ne = !0, $ || ($ = !0, ge()))), K;
  }, r.unstable_shouldYield = y, r.unstable_wrapCallback = function(K) {
    var Y = z;
    return function() {
      var Q = z;
      z = Y;
      try {
        return K.apply(this, arguments);
      } finally {
        z = Q;
      }
    };
  };
})), Jh = /* @__PURE__ */ ca(((r, h) => {
  h.exports = Kh();
})), Ih = /* @__PURE__ */ ca(((r) => {
  var h = /* @__PURE__ */ Symbol.for("react.transitional.element"), C = /* @__PURE__ */ Symbol.for("react.portal"), f = /* @__PURE__ */ Symbol.for("react.fragment"), p = /* @__PURE__ */ Symbol.for("react.strict_mode"), k = /* @__PURE__ */ Symbol.for("react.profiler"), x = /* @__PURE__ */ Symbol.for("react.consumer"), A = /* @__PURE__ */ Symbol.for("react.context"), N = /* @__PURE__ */ Symbol.for("react.forward_ref"), _ = /* @__PURE__ */ Symbol.for("react.suspense"), w = /* @__PURE__ */ Symbol.for("react.memo"), G = /* @__PURE__ */ Symbol.for("react.lazy"), z = /* @__PURE__ */ Symbol.for("react.activity"), le = Symbol.iterator;
  function ne(o) {
    return o === null || typeof o != "object" ? null : (o = le && o[le] || o["@@iterator"], typeof o == "function" ? o : null);
  }
  var I = {
    isMounted: function() {
      return !1;
    },
    enqueueForceUpdate: function() {
    },
    enqueueReplaceState: function() {
    },
    enqueueSetState: function() {
    }
  }, X = Object.assign, oe = {};
  function q(o, j, R) {
    this.props = o, this.context = j, this.refs = oe, this.updater = R || I;
  }
  q.prototype.isReactComponent = {}, q.prototype.setState = function(o, j) {
    if (typeof o != "object" && typeof o != "function" && o != null) throw Error("takes an object of state variables to update or a function which returns an object of state variables.");
    this.updater.enqueueSetState(this, o, j, "setState");
  }, q.prototype.forceUpdate = function(o) {
    this.updater.enqueueForceUpdate(this, o, "forceUpdate");
  };
  function ie() {
  }
  ie.prototype = q.prototype;
  function H(o, j, R) {
    this.props = o, this.context = j, this.refs = oe, this.updater = R || I;
  }
  var F = H.prototype = new ie();
  F.constructor = H, X(F, q.prototype), F.isPureReactComponent = !0;
  var $ = Array.isArray;
  function pe() {
  }
  var te = {
    H: null,
    A: null,
    T: null,
    S: null
  }, P = Object.prototype.hasOwnProperty;
  function y(o, j, R) {
    var W = R.ref;
    return {
      $$typeof: h,
      type: o,
      key: j,
      ref: W !== void 0 ? W : null,
      props: R
    };
  }
  function ee(o, j) {
    return y(o.type, j, o.props);
  }
  function ge(o) {
    return typeof o == "object" && o !== null && o.$$typeof === h;
  }
  function me(o) {
    var j = {
      "=": "=0",
      ":": "=2"
    };
    return "$" + o.replace(/[=:]/g, function(R) {
      return j[R];
    });
  }
  var b = /\/+/g;
  function ae(o, j) {
    return typeof o == "object" && o !== null && o.key != null ? me("" + o.key) : j.toString(36);
  }
  function K(o) {
    switch (o.status) {
      case "fulfilled":
        return o.value;
      case "rejected":
        throw o.reason;
      default:
        switch (typeof o.status == "string" ? o.then(pe, pe) : (o.status = "pending", o.then(function(j) {
          o.status === "pending" && (o.status = "fulfilled", o.value = j);
        }, function(j) {
          o.status === "pending" && (o.status = "rejected", o.reason = j);
        })), o.status) {
          case "fulfilled":
            return o.value;
          case "rejected":
            throw o.reason;
        }
    }
    throw o;
  }
  function Y(o, j, R, W, ce) {
    var he = typeof o;
    (he === "undefined" || he === "boolean") && (o = null);
    var de = !1;
    if (o === null) de = !0;
    else switch (he) {
      case "bigint":
      case "string":
      case "number":
        de = !0;
        break;
      case "object":
        switch (o.$$typeof) {
          case h:
          case C:
            de = !0;
            break;
          case G:
            return de = o._init, Y(de(o._payload), j, R, W, ce);
        }
    }
    if (de) return ce = ce(o), de = W === "" ? "." + ae(o, 0) : W, $(ce) ? (R = "", de != null && (R = de.replace(b, "$&/") + "/"), Y(ce, j, R, "", function(dt) {
      return dt;
    })) : ce != null && (ge(ce) && (ce = ee(ce, R + (ce.key == null || o && o.key === ce.key ? "" : ("" + ce.key).replace(b, "$&/") + "/") + de)), j.push(ce)), 1;
    de = 0;
    var Ge = W === "" ? "." : W + ":";
    if ($(o)) for (var ze = 0; ze < o.length; ze++) W = o[ze], he = Ge + ae(W, ze), de += Y(W, j, R, he, ce);
    else if (ze = ne(o), typeof ze == "function") for (o = ze.call(o), ze = 0; !(W = o.next()).done; ) W = W.value, he = Ge + ae(W, ze++), de += Y(W, j, R, he, ce);
    else if (he === "object") {
      if (typeof o.then == "function") return Y(K(o), j, R, W, ce);
      throw j = String(o), Error("Objects are not valid as a React child (found: " + (j === "[object Object]" ? "object with keys {" + Object.keys(o).join(", ") + "}" : j) + "). If you meant to render a collection of children, use an array instead.");
    }
    return de;
  }
  function Q(o, j, R) {
    if (o == null) return o;
    var W = [], ce = 0;
    return Y(o, W, "", "", function(he) {
      return j.call(R, he, ce++);
    }), W;
  }
  function se(o) {
    if (o._status === -1) {
      var j = o._result;
      j = j(), j.then(function(R) {
        (o._status === 0 || o._status === -1) && (o._status = 1, o._result = R);
      }, function(R) {
        (o._status === 0 || o._status === -1) && (o._status = 2, o._result = R);
      }), o._status === -1 && (o._status = 0, o._result = j);
    }
    if (o._status === 1) return o._result.default;
    throw o._result;
  }
  var re = typeof reportError == "function" ? reportError : function(o) {
    if (typeof window == "object" && typeof window.ErrorEvent == "function") {
      var j = new window.ErrorEvent("error", {
        bubbles: !0,
        cancelable: !0,
        message: typeof o == "object" && o !== null && typeof o.message == "string" ? String(o.message) : String(o),
        error: o
      });
      if (!window.dispatchEvent(j)) return;
    } else if (typeof process == "object" && typeof process.emit == "function") {
      process.emit("uncaughtException", o);
      return;
    }
    console.error(o);
  }, _e = {
    map: Q,
    forEach: function(o, j, R) {
      Q(o, function() {
        j.apply(this, arguments);
      }, R);
    },
    count: function(o) {
      var j = 0;
      return Q(o, function() {
        j++;
      }), j;
    },
    toArray: function(o) {
      return Q(o, function(j) {
        return j;
      }) || [];
    },
    only: function(o) {
      if (!ge(o)) throw Error("React.Children.only expected to receive a single React element child.");
      return o;
    }
  };
  r.Activity = z, r.Children = _e, r.Component = q, r.Fragment = f, r.Profiler = k, r.PureComponent = H, r.StrictMode = p, r.Suspense = _, r.__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE = te, r.__COMPILER_RUNTIME = {
    __proto__: null,
    c: function(o) {
      return te.H.useMemoCache(o);
    }
  }, r.cache = function(o) {
    return function() {
      return o.apply(null, arguments);
    };
  }, r.cacheSignal = function() {
    return null;
  }, r.cloneElement = function(o, j, R) {
    if (o == null) throw Error("The argument must be a React element, but you passed " + o + ".");
    var W = X({}, o.props), ce = o.key;
    if (j != null) for (he in j.key !== void 0 && (ce = "" + j.key), j) !P.call(j, he) || he === "key" || he === "__self" || he === "__source" || he === "ref" && j.ref === void 0 || (W[he] = j[he]);
    var he = arguments.length - 2;
    if (he === 1) W.children = R;
    else if (1 < he) {
      for (var de = Array(he), Ge = 0; Ge < he; Ge++) de[Ge] = arguments[Ge + 2];
      W.children = de;
    }
    return y(o.type, ce, W);
  }, r.createContext = function(o) {
    return o = {
      $$typeof: A,
      _currentValue: o,
      _currentValue2: o,
      _threadCount: 0,
      Provider: null,
      Consumer: null
    }, o.Provider = o, o.Consumer = {
      $$typeof: x,
      _context: o
    }, o;
  }, r.createElement = function(o, j, R) {
    var W, ce = {}, he = null;
    if (j != null) for (W in j.key !== void 0 && (he = "" + j.key), j) P.call(j, W) && W !== "key" && W !== "__self" && W !== "__source" && (ce[W] = j[W]);
    var de = arguments.length - 2;
    if (de === 1) ce.children = R;
    else if (1 < de) {
      for (var Ge = Array(de), ze = 0; ze < de; ze++) Ge[ze] = arguments[ze + 2];
      ce.children = Ge;
    }
    if (o && o.defaultProps) for (W in de = o.defaultProps, de) ce[W] === void 0 && (ce[W] = de[W]);
    return y(o, he, ce);
  }, r.createRef = function() {
    return { current: null };
  }, r.forwardRef = function(o) {
    return {
      $$typeof: N,
      render: o
    };
  }, r.isValidElement = ge, r.lazy = function(o) {
    return {
      $$typeof: G,
      _payload: {
        _status: -1,
        _result: o
      },
      _init: se
    };
  }, r.memo = function(o, j) {
    return {
      $$typeof: w,
      type: o,
      compare: j === void 0 ? null : j
    };
  }, r.startTransition = function(o) {
    var j = te.T, R = {};
    te.T = R;
    try {
      var W = o(), ce = te.S;
      ce !== null && ce(R, W), typeof W == "object" && W !== null && typeof W.then == "function" && W.then(pe, re);
    } catch (he) {
      re(he);
    } finally {
      j !== null && R.types !== null && (j.types = R.types), te.T = j;
    }
  }, r.unstable_useCacheRefresh = function() {
    return te.H.useCacheRefresh();
  }, r.use = function(o) {
    return te.H.use(o);
  }, r.useActionState = function(o, j, R) {
    return te.H.useActionState(o, j, R);
  }, r.useCallback = function(o, j) {
    return te.H.useCallback(o, j);
  }, r.useContext = function(o) {
    return te.H.useContext(o);
  }, r.useDebugValue = function() {
  }, r.useDeferredValue = function(o, j) {
    return te.H.useDeferredValue(o, j);
  }, r.useEffect = function(o, j) {
    return te.H.useEffect(o, j);
  }, r.useEffectEvent = function(o) {
    return te.H.useEffectEvent(o);
  }, r.useId = function() {
    return te.H.useId();
  }, r.useImperativeHandle = function(o, j, R) {
    return te.H.useImperativeHandle(o, j, R);
  }, r.useInsertionEffect = function(o, j) {
    return te.H.useInsertionEffect(o, j);
  }, r.useLayoutEffect = function(o, j) {
    return te.H.useLayoutEffect(o, j);
  }, r.useMemo = function(o, j) {
    return te.H.useMemo(o, j);
  }, r.useOptimistic = function(o, j) {
    return te.H.useOptimistic(o, j);
  }, r.useReducer = function(o, j, R) {
    return te.H.useReducer(o, j, R);
  }, r.useRef = function(o) {
    return te.H.useRef(o);
  }, r.useState = function(o) {
    return te.H.useState(o);
  }, r.useSyncExternalStore = function(o, j, R) {
    return te.H.useSyncExternalStore(o, j, R);
  }, r.useTransition = function() {
    return te.H.useTransition();
  }, r.version = "19.2.6";
})), ud = /* @__PURE__ */ ca(((r, h) => {
  h.exports = Ih();
})), $h = /* @__PURE__ */ ca(((r) => {
  var h = ud();
  function C(_) {
    var w = "https://react.dev/errors/" + _;
    if (1 < arguments.length) {
      w += "?args[]=" + encodeURIComponent(arguments[1]);
      for (var G = 2; G < arguments.length; G++) w += "&args[]=" + encodeURIComponent(arguments[G]);
    }
    return "Minified React error #" + _ + "; visit " + w + " for the full message or use the non-minified dev environment for full errors and additional helpful warnings.";
  }
  function f() {
  }
  var p = {
    d: {
      f,
      r: function() {
        throw Error(C(522));
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
  }, k = /* @__PURE__ */ Symbol.for("react.portal");
  function x(_, w, G) {
    var z = 3 < arguments.length && arguments[3] !== void 0 ? arguments[3] : null;
    return {
      $$typeof: k,
      key: z == null ? null : "" + z,
      children: _,
      containerInfo: w,
      implementation: G
    };
  }
  var A = h.__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE;
  function N(_, w) {
    if (_ === "font") return "";
    if (typeof w == "string") return w === "use-credentials" ? w : "";
  }
  r.__DOM_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE = p, r.createPortal = function(_, w) {
    var G = 2 < arguments.length && arguments[2] !== void 0 ? arguments[2] : null;
    if (!w || w.nodeType !== 1 && w.nodeType !== 9 && w.nodeType !== 11) throw Error(C(299));
    return x(_, w, null, G);
  }, r.flushSync = function(_) {
    var w = A.T, G = p.p;
    try {
      if (A.T = null, p.p = 2, _) return _();
    } finally {
      A.T = w, p.p = G, p.d.f();
    }
  }, r.preconnect = function(_, w) {
    typeof _ == "string" && (w ? (w = w.crossOrigin, w = typeof w == "string" ? w === "use-credentials" ? w : "" : void 0) : w = null, p.d.C(_, w));
  }, r.prefetchDNS = function(_) {
    typeof _ == "string" && p.d.D(_);
  }, r.preinit = function(_, w) {
    if (typeof _ == "string" && w && typeof w.as == "string") {
      var G = w.as, z = N(G, w.crossOrigin), le = typeof w.integrity == "string" ? w.integrity : void 0, ne = typeof w.fetchPriority == "string" ? w.fetchPriority : void 0;
      G === "style" ? p.d.S(_, typeof w.precedence == "string" ? w.precedence : void 0, {
        crossOrigin: z,
        integrity: le,
        fetchPriority: ne
      }) : G === "script" && p.d.X(_, {
        crossOrigin: z,
        integrity: le,
        fetchPriority: ne,
        nonce: typeof w.nonce == "string" ? w.nonce : void 0
      });
    }
  }, r.preinitModule = function(_, w) {
    if (typeof _ == "string") if (typeof w == "object" && w !== null) {
      if (w.as == null || w.as === "script") {
        var G = N(w.as, w.crossOrigin);
        p.d.M(_, {
          crossOrigin: G,
          integrity: typeof w.integrity == "string" ? w.integrity : void 0,
          nonce: typeof w.nonce == "string" ? w.nonce : void 0
        });
      }
    } else w ?? p.d.M(_);
  }, r.preload = function(_, w) {
    if (typeof _ == "string" && typeof w == "object" && w !== null && typeof w.as == "string") {
      var G = w.as, z = N(G, w.crossOrigin);
      p.d.L(_, G, {
        crossOrigin: z,
        integrity: typeof w.integrity == "string" ? w.integrity : void 0,
        nonce: typeof w.nonce == "string" ? w.nonce : void 0,
        type: typeof w.type == "string" ? w.type : void 0,
        fetchPriority: typeof w.fetchPriority == "string" ? w.fetchPriority : void 0,
        referrerPolicy: typeof w.referrerPolicy == "string" ? w.referrerPolicy : void 0,
        imageSrcSet: typeof w.imageSrcSet == "string" ? w.imageSrcSet : void 0,
        imageSizes: typeof w.imageSizes == "string" ? w.imageSizes : void 0,
        media: typeof w.media == "string" ? w.media : void 0
      });
    }
  }, r.preloadModule = function(_, w) {
    if (typeof _ == "string") if (w) {
      var G = N(w.as, w.crossOrigin);
      p.d.m(_, {
        as: typeof w.as == "string" && w.as !== "script" ? w.as : void 0,
        crossOrigin: G,
        integrity: typeof w.integrity == "string" ? w.integrity : void 0
      });
    } else p.d.m(_);
  }, r.requestFormReset = function(_) {
    p.d.r(_);
  }, r.unstable_batchedUpdates = function(_, w) {
    return _(w);
  }, r.useFormState = function(_, w, G) {
    return A.H.useFormState(_, w, G);
  }, r.useFormStatus = function() {
    return A.H.useHostTransitionStatus();
  }, r.version = "19.2.6";
})), Wh = /* @__PURE__ */ ca(((r, h) => {
  function C() {
    if (!(typeof __REACT_DEVTOOLS_GLOBAL_HOOK__ > "u" || typeof __REACT_DEVTOOLS_GLOBAL_HOOK__.checkDCE != "function"))
      try {
        __REACT_DEVTOOLS_GLOBAL_HOOK__.checkDCE(C);
      } catch (f) {
        console.error(f);
      }
  }
  C(), h.exports = $h();
})), Fh = /* @__PURE__ */ ca(((r) => {
  var h = Jh(), C = ud(), f = Wh();
  function p(e) {
    var t = "https://react.dev/errors/" + e;
    if (1 < arguments.length) {
      t += "?args[]=" + encodeURIComponent(arguments[1]);
      for (var a = 2; a < arguments.length; a++) t += "&args[]=" + encodeURIComponent(arguments[a]);
    }
    return "Minified React error #" + e + "; visit " + t + " for the full message or use the non-minified dev environment for full errors and additional helpful warnings.";
  }
  function k(e) {
    return !(!e || e.nodeType !== 1 && e.nodeType !== 9 && e.nodeType !== 11);
  }
  function x(e) {
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
  function N(e) {
    if (e.tag === 31) {
      var t = e.memoizedState;
      if (t === null && (e = e.alternate, e !== null && (t = e.memoizedState)), t !== null) return t.dehydrated;
    }
    return null;
  }
  function _(e) {
    if (x(e) !== e) throw Error(p(188));
  }
  function w(e) {
    var t = e.alternate;
    if (!t) {
      if (t = x(e), t === null) throw Error(p(188));
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
        throw Error(p(188));
      }
      if (a.return !== i.return) a = n, i = s;
      else {
        for (var c = !1, u = n.child; u; ) {
          if (u === a) {
            c = !0, a = n, i = s;
            break;
          }
          if (u === i) {
            c = !0, i = n, a = s;
            break;
          }
          u = u.sibling;
        }
        if (!c) {
          for (u = s.child; u; ) {
            if (u === a) {
              c = !0, a = s, i = n;
              break;
            }
            if (u === i) {
              c = !0, i = s, a = n;
              break;
            }
            u = u.sibling;
          }
          if (!c) throw Error(p(189));
        }
      }
      if (a.alternate !== i) throw Error(p(190));
    }
    if (a.tag !== 3) throw Error(p(188));
    return a.stateNode.current === a ? e : t;
  }
  function G(e) {
    var t = e.tag;
    if (t === 5 || t === 26 || t === 27 || t === 6) return e;
    for (e = e.child; e !== null; ) {
      if (t = G(e), t !== null) return t;
      e = e.sibling;
    }
    return null;
  }
  var z = Object.assign, le = /* @__PURE__ */ Symbol.for("react.element"), ne = /* @__PURE__ */ Symbol.for("react.transitional.element"), I = /* @__PURE__ */ Symbol.for("react.portal"), X = /* @__PURE__ */ Symbol.for("react.fragment"), oe = /* @__PURE__ */ Symbol.for("react.strict_mode"), q = /* @__PURE__ */ Symbol.for("react.profiler"), ie = /* @__PURE__ */ Symbol.for("react.consumer"), H = /* @__PURE__ */ Symbol.for("react.context"), F = /* @__PURE__ */ Symbol.for("react.forward_ref"), $ = /* @__PURE__ */ Symbol.for("react.suspense"), pe = /* @__PURE__ */ Symbol.for("react.suspense_list"), te = /* @__PURE__ */ Symbol.for("react.memo"), P = /* @__PURE__ */ Symbol.for("react.lazy"), y = /* @__PURE__ */ Symbol.for("react.activity"), ee = /* @__PURE__ */ Symbol.for("react.memo_cache_sentinel"), ge = Symbol.iterator;
  function me(e) {
    return e === null || typeof e != "object" ? null : (e = ge && e[ge] || e["@@iterator"], typeof e == "function" ? e : null);
  }
  var b = /* @__PURE__ */ Symbol.for("react.client.reference");
  function ae(e) {
    if (e == null) return null;
    if (typeof e == "function") return e.$$typeof === b ? null : e.displayName || e.name || null;
    if (typeof e == "string") return e;
    switch (e) {
      case X:
        return "Fragment";
      case q:
        return "Profiler";
      case oe:
        return "StrictMode";
      case $:
        return "Suspense";
      case pe:
        return "SuspenseList";
      case y:
        return "Activity";
    }
    if (typeof e == "object") switch (e.$$typeof) {
      case I:
        return "Portal";
      case H:
        return e.displayName || "Context";
      case ie:
        return (e._context.displayName || "Context") + ".Consumer";
      case F:
        var t = e.render;
        return e = e.displayName, e || (e = t.displayName || t.name || "", e = e !== "" ? "ForwardRef(" + e + ")" : "ForwardRef"), e;
      case te:
        return t = e.displayName || null, t !== null ? t : ae(e.type) || "Memo";
      case P:
        t = e._payload, e = e._init;
        try {
          return ae(e(t));
        } catch {
        }
    }
    return null;
  }
  var K = Array.isArray, Y = C.__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE, Q = f.__DOM_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE, se = {
    pending: !1,
    data: null,
    method: null,
    action: null
  }, re = [], _e = -1;
  function o(e) {
    return { current: e };
  }
  function j(e) {
    0 > _e || (e.current = re[_e], re[_e] = null, _e--);
  }
  function R(e, t) {
    _e++, re[_e] = e.current, e.current = t;
  }
  var W = o(null), ce = o(null), he = o(null), de = o(null);
  function Ge(e, t) {
    switch (R(he, t), R(ce, e), R(W, null), t.nodeType) {
      case 9:
      case 11:
        e = (e = t.documentElement) && (e = e.namespaceURI) ? Dp(e) : 0;
        break;
      default:
        if (e = t.tagName, t = t.namespaceURI) t = Dp(t), e = Up(t, e);
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
    j(W), R(W, e);
  }
  function ze() {
    j(W), j(ce), j(he);
  }
  function dt(e) {
    e.memoizedState !== null && R(de, e);
    var t = W.current, a = Up(t, e.type);
    t !== a && (R(ce, e), R(W, a));
  }
  function Xe(e) {
    ce.current === e && (j(W), j(ce)), de.current === e && (j(de), en._currentValue = se);
  }
  var Me, ve;
  function qe(e) {
    if (Me === void 0) try {
      throw Error();
    } catch (a) {
      var t = a.stack.trim().match(/\n( *(at )?)/);
      Me = t && t[1] || "", ve = -1 < a.stack.indexOf(`
    at`) ? " (<anonymous>)" : -1 < a.stack.indexOf("@") ? "@unknown:0:0" : "";
    }
    return `
` + Me + e + ve;
  }
  var lt = !1;
  function d(e, t) {
    if (!e || lt) return "";
    lt = !0;
    var a = Error.prepareStackTrace;
    Error.prepareStackTrace = void 0;
    try {
      var i = { DetermineComponentFrameRoot: function() {
        try {
          if (t) {
            var J = function() {
              throw Error();
            };
            if (Object.defineProperty(J.prototype, "props", { set: function() {
              throw Error();
            } }), typeof Reflect == "object" && Reflect.construct) {
              try {
                Reflect.construct(J, []);
              } catch (L) {
                var U = L;
              }
              Reflect.construct(e, [], J);
            } else {
              try {
                J.call();
              } catch (L) {
                U = L;
              }
              e.call(J.prototype);
            }
          } else {
            try {
              throw Error();
            } catch (L) {
              U = L;
            }
            (J = e()) && typeof J.catch == "function" && J.catch(function() {
            });
          }
        } catch (L) {
          if (L && U && typeof L.stack == "string") return [L.stack, U.stack];
        }
        return [null, null];
      } };
      i.DetermineComponentFrameRoot.displayName = "DetermineComponentFrameRoot";
      var n = Object.getOwnPropertyDescriptor(i.DetermineComponentFrameRoot, "name");
      n && n.configurable && Object.defineProperty(i.DetermineComponentFrameRoot, "name", { value: "DetermineComponentFrameRoot" });
      var s = i.DetermineComponentFrameRoot(), c = s[0], u = s[1];
      if (c && u) {
        var v = c.split(`
`), D = u.split(`
`);
        for (n = i = 0; i < v.length && !v[i].includes("DetermineComponentFrameRoot"); ) i++;
        for (; n < D.length && !D[n].includes("DetermineComponentFrameRoot"); ) n++;
        if (i === v.length || n === D.length) for (i = v.length - 1, n = D.length - 1; 1 <= i && 0 <= n && v[i] !== D[n]; ) n--;
        for (; 1 <= i && 0 <= n; i--, n--) if (v[i] !== D[n]) {
          if (i !== 1 || n !== 1) do
            if (i--, n--, 0 > n || v[i] !== D[n]) {
              var V = `
` + v[i].replace(" at new ", " at ");
              return e.displayName && V.includes("<anonymous>") && (V = V.replace("<anonymous>", e.displayName)), V;
            }
          while (1 <= i && 0 <= n);
          break;
        }
      }
    } finally {
      lt = !1, Error.prepareStackTrace = a;
    }
    return (a = e ? e.displayName || e.name : "") ? qe(a) : "";
  }
  function B(e, t) {
    switch (e.tag) {
      case 26:
      case 27:
      case 5:
        return qe(e.type);
      case 16:
        return qe("Lazy");
      case 13:
        return e.child !== t && t !== null ? qe("Suspense Fallback") : qe("Suspense");
      case 19:
        return qe("SuspenseList");
      case 0:
      case 15:
        return d(e.type, !1);
      case 11:
        return d(e.type.render, !1);
      case 1:
        return d(e.type, !0);
      case 31:
        return qe("Activity");
      default:
        return "";
    }
  }
  function ue(e) {
    try {
      var t = "", a = null;
      do
        t += B(e, a), a = e, e = e.return;
      while (e);
      return t;
    } catch (i) {
      return `
Error generating stack: ` + i.message + `
` + i.stack;
    }
  }
  var He = Object.prototype.hasOwnProperty, T = h.unstable_scheduleCallback, we = h.unstable_cancelCallback, Ze = h.unstable_shouldYield, Dt = h.unstable_requestPaint, M = h.unstable_now, ke = h.unstable_getCurrentPriorityLevel, je = h.unstable_ImmediatePriority, Ce = h.unstable_UserBlockingPriority, Be = h.unstable_NormalPriority, bt = h.unstable_LowPriority, m = h.unstable_IdlePriority, ye = h.log, Se = h.unstable_setDisableYieldValue, st = null, Fe = null;
  function wt(e) {
    if (typeof ye == "function" && Se(e), Fe && typeof Fe.setStrictMode == "function") try {
      Fe.setStrictMode(st, e);
    } catch {
    }
  }
  var ht = Math.clz32 ? Math.clz32 : Bf, un = Math.log, kt = Math.LN2;
  function Bf(e) {
    return e >>>= 0, e === 0 ? 32 : 31 - (un(e) / kt | 0) | 0;
  }
  var pn = 256, fn = 262144, hn = 4194304;
  function Fa(e) {
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
  function mn(e, t, a) {
    var i = e.pendingLanes;
    if (i === 0) return 0;
    var n = 0, s = e.suspendedLanes, c = e.pingedLanes;
    e = e.warmLanes;
    var u = i & 134217727;
    return u !== 0 ? (i = u & ~s, i !== 0 ? n = Fa(i) : (c &= u, c !== 0 ? n = Fa(c) : a || (a = u & ~e, a !== 0 && (n = Fa(a))))) : (u = i & ~s, u !== 0 ? n = Fa(u) : c !== 0 ? n = Fa(c) : a || (a = i & ~e, a !== 0 && (n = Fa(a)))), n === 0 ? 0 : t !== 0 && t !== n && (t & s) === 0 && (s = n & -n, a = t & -t, s >= a || s === 32 && (a & 4194048) !== 0) ? t : n;
  }
  function fi(e, t) {
    return (e.pendingLanes & ~(e.suspendedLanes & ~e.pingedLanes) & t) === 0;
  }
  function Gf(e, t) {
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
  function md() {
    var e = hn;
    return hn <<= 1, (hn & 62914560) === 0 && (hn = 4194304), e;
  }
  function Us(e) {
    for (var t = [], a = 0; 31 > a; a++) t.push(e);
    return t;
  }
  function xn(e, t) {
    e.pendingLanes |= t, t !== 268435456 && (e.suspendedLanes = 0, e.pingedLanes = 0, e.warmLanes = 0);
  }
  function Yf(e, t, a, i, n, s) {
    var c = e.pendingLanes;
    e.pendingLanes = a, e.suspendedLanes = 0, e.pingedLanes = 0, e.warmLanes = 0, e.expiredLanes &= a, e.entangledLanes &= a, e.errorRecoveryDisabledLanes &= a, e.shellSuspendCounter = 0;
    var u = e.entanglements, v = e.expirationTimes, D = e.hiddenUpdates;
    for (a = c & ~a; 0 < a; ) {
      var V = 31 - ht(a), J = 1 << V;
      u[V] = 0, v[V] = -1;
      var U = D[V];
      if (U !== null) for (D[V] = null, V = 0; V < U.length; V++) {
        var L = U[V];
        L !== null && (L.lane &= -536870913);
      }
      a &= ~J;
    }
    i !== 0 && xd(e, i, 0), s !== 0 && n === 0 && e.tag !== 0 && (e.suspendedLanes |= s & ~(c & ~t));
  }
  function xd(e, t, a) {
    e.pendingLanes |= t, e.suspendedLanes &= ~t;
    var i = 31 - ht(t);
    e.entangledLanes |= t, e.entanglements[i] = e.entanglements[i] | 1073741824 | a & 261930;
  }
  function gd(e, t) {
    var a = e.entangledLanes |= t;
    for (e = e.entanglements; a; ) {
      var i = 31 - ht(a), n = 1 << i;
      n & t | e[i] & t && (e[i] |= t), a &= ~n;
    }
  }
  function bd(e, t) {
    var a = t & -t;
    return a = (a & 42) !== 0 ? 1 : vd(a), (a & (e.suspendedLanes | t)) !== 0 ? 0 : a;
  }
  function vd(e) {
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
  function Rs(e) {
    return e &= -e, 2 < e ? 8 < e ? (e & 134217727) !== 0 ? 32 : 268435456 : 8 : 2;
  }
  function jd() {
    var e = Q.p;
    return e !== 0 ? e : (e = window.event, e === void 0 ? 32 : af(e.type));
  }
  function yd(e, t) {
    var a = Q.p;
    try {
      return Q.p = e, t();
    } finally {
      Q.p = a;
    }
  }
  var Ca = Math.random().toString(36).slice(2), vt = "__reactFiber$" + Ca, _t = "__reactProps$" + Ca, hi = "__reactContainer$" + Ca, Ls = "__reactEvents$" + Ca, Vf = "__reactListeners$" + Ca, Qf = "__reactHandles$" + Ca, Sd = "__reactResources$" + Ca, mi = "__reactMarker$" + Ca;
  function qs(e) {
    delete e[vt], delete e[_t], delete e[Ls], delete e[Vf], delete e[Qf];
  }
  function wl(e) {
    var t = e[vt];
    if (t) return t;
    for (var a = e.parentNode; a; ) {
      if (t = a[hi] || a[vt]) {
        if (a = t.alternate, t.child !== null || a !== null && a.child !== null) for (e = Yp(e); e !== null; ) {
          if (a = e[vt]) return a;
          e = Yp(e);
        }
        return t;
      }
      e = a, a = e.parentNode;
    }
    return null;
  }
  function zl(e) {
    if (e = e[vt] || e[hi]) {
      var t = e.tag;
      if (t === 5 || t === 6 || t === 13 || t === 31 || t === 26 || t === 27 || t === 3) return e;
    }
    return null;
  }
  function xi(e) {
    var t = e.tag;
    if (t === 5 || t === 26 || t === 27 || t === 6) return e.stateNode;
    throw Error(p(33));
  }
  function kl(e) {
    var t = e[Sd];
    return t || (t = e[Sd] = {
      hoistableStyles: /* @__PURE__ */ new Map(),
      hoistableScripts: /* @__PURE__ */ new Map()
    }), t;
  }
  function xt(e) {
    e[mi] = !0;
  }
  var Nd = /* @__PURE__ */ new Set(), wd = {};
  function Pa(e, t) {
    _l(e, t), _l(e + "Capture", t);
  }
  function _l(e, t) {
    for (wd[e] = t, e = 0; e < t.length; e++) Nd.add(t[e]);
  }
  var Xf = RegExp("^[:A-Z_a-z\\u00C0-\\u00D6\\u00D8-\\u00F6\\u00F8-\\u02FF\\u0370-\\u037D\\u037F-\\u1FFF\\u200C-\\u200D\\u2070-\\u218F\\u2C00-\\u2FEF\\u3001-\\uD7FF\\uF900-\\uFDCF\\uFDF0-\\uFFFD][:A-Z_a-z\\u00C0-\\u00D6\\u00D8-\\u00F6\\u00F8-\\u02FF\\u0370-\\u037D\\u037F-\\u1FFF\\u200C-\\u200D\\u2070-\\u218F\\u2C00-\\u2FEF\\u3001-\\uD7FF\\uF900-\\uFDCF\\uFDF0-\\uFFFD\\-.0-9\\u00B7\\u0300-\\u036F\\u203F-\\u2040]*$"), zd = {}, kd = {};
  function Zf(e) {
    return He.call(kd, e) ? !0 : He.call(zd, e) ? !1 : Xf.test(e) ? kd[e] = !0 : (zd[e] = !0, !1);
  }
  function gn(e, t, a) {
    if (Zf(t)) if (a === null) e.removeAttribute(t);
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
  function bn(e, t, a) {
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
  function ra(e, t, a, i) {
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
  function Gt(e) {
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
  function _d(e) {
    var t = e.type;
    return (e = e.nodeName) && e.toLowerCase() === "input" && (t === "checkbox" || t === "radio");
  }
  function Kf(e, t, a) {
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
  function Hs(e) {
    if (!e._valueTracker) {
      var t = _d(e) ? "checked" : "value";
      e._valueTracker = Kf(e, t, "" + e[t]);
    }
  }
  function Cd(e) {
    if (!e) return !1;
    var t = e._valueTracker;
    if (!t) return !0;
    var a = t.getValue(), i = "";
    return e && (i = _d(e) ? e.checked ? "true" : "false" : e.value), e = i, e !== a ? (t.setValue(e), !0) : !1;
  }
  function vn(e) {
    if (e = e || (typeof document < "u" ? document : void 0), typeof e > "u") return null;
    try {
      return e.activeElement || e.body;
    } catch {
      return e.body;
    }
  }
  var Jf = /[\n"\\]/g;
  function Yt(e) {
    return e.replace(Jf, function(t) {
      return "\\" + t.charCodeAt(0).toString(16) + " ";
    });
  }
  function Bs(e, t, a, i, n, s, c, u) {
    e.name = "", c != null && typeof c != "function" && typeof c != "symbol" && typeof c != "boolean" ? e.type = c : e.removeAttribute("type"), t != null ? c === "number" ? (t === 0 && e.value === "" || e.value != t) && (e.value = "" + Gt(t)) : e.value !== "" + Gt(t) && (e.value = "" + Gt(t)) : c !== "submit" && c !== "reset" || e.removeAttribute("value"), t != null ? Gs(e, c, Gt(t)) : a != null ? Gs(e, c, Gt(a)) : i != null && e.removeAttribute("value"), n == null && s != null && (e.defaultChecked = !!s), n != null && (e.checked = n && typeof n != "function" && typeof n != "symbol"), u != null && typeof u != "function" && typeof u != "symbol" && typeof u != "boolean" ? e.name = "" + Gt(u) : e.removeAttribute("name");
  }
  function Ed(e, t, a, i, n, s, c, u) {
    if (s != null && typeof s != "function" && typeof s != "symbol" && typeof s != "boolean" && (e.type = s), t != null || a != null) {
      if (!(s !== "submit" && s !== "reset" || t != null)) {
        Hs(e);
        return;
      }
      a = a != null ? "" + Gt(a) : "", t = t != null ? "" + Gt(t) : a, u || t === e.value || (e.value = t), e.defaultValue = t;
    }
    i = i ?? n, i = typeof i != "function" && typeof i != "symbol" && !!i, e.checked = u ? e.checked : !!i, e.defaultChecked = !!i, c != null && typeof c != "function" && typeof c != "symbol" && typeof c != "boolean" && (e.name = c), Hs(e);
  }
  function Gs(e, t, a) {
    t === "number" && vn(e.ownerDocument) === e || e.defaultValue === "" + a || (e.defaultValue = "" + a);
  }
  function Cl(e, t, a, i) {
    if (e = e.options, t) {
      t = {};
      for (var n = 0; n < a.length; n++) t["$" + a[n]] = !0;
      for (a = 0; a < e.length; a++) n = t.hasOwnProperty("$" + e[a].value), e[a].selected !== n && (e[a].selected = n), n && i && (e[a].defaultSelected = !0);
    } else {
      for (a = "" + Gt(a), t = null, n = 0; n < e.length; n++) {
        if (e[n].value === a) {
          e[n].selected = !0, i && (e[n].defaultSelected = !0);
          return;
        }
        t !== null || e[n].disabled || (t = e[n]);
      }
      t !== null && (t.selected = !0);
    }
  }
  function Ad(e, t, a) {
    if (t != null && (t = "" + Gt(t), t !== e.value && (e.value = t), a == null)) {
      e.defaultValue !== t && (e.defaultValue = t);
      return;
    }
    e.defaultValue = a != null ? "" + Gt(a) : "";
  }
  function Td(e, t, a, i) {
    if (t == null) {
      if (i != null) {
        if (a != null) throw Error(p(92));
        if (K(i)) {
          if (1 < i.length) throw Error(p(93));
          i = i[0];
        }
        a = i;
      }
      a ??= "", t = a;
    }
    a = Gt(t), e.defaultValue = a, i = e.textContent, i === a && i !== "" && i !== null && (e.value = i), Hs(e);
  }
  function El(e, t) {
    if (t) {
      var a = e.firstChild;
      if (a && a === e.lastChild && a.nodeType === 3) {
        a.nodeValue = t;
        return;
      }
    }
    e.textContent = t;
  }
  var If = new Set("animationIterationCount aspectRatio borderImageOutset borderImageSlice borderImageWidth boxFlex boxFlexGroup boxOrdinalGroup columnCount columns flex flexGrow flexPositive flexShrink flexNegative flexOrder gridArea gridRow gridRowEnd gridRowSpan gridRowStart gridColumn gridColumnEnd gridColumnSpan gridColumnStart fontWeight lineClamp lineHeight opacity order orphans scale tabSize widows zIndex zoom fillOpacity floodOpacity stopOpacity strokeDasharray strokeDashoffset strokeMiterlimit strokeOpacity strokeWidth MozAnimationIterationCount MozBoxFlex MozBoxFlexGroup MozLineClamp msAnimationIterationCount msFlex msZoom msFlexGrow msFlexNegative msFlexOrder msFlexPositive msFlexShrink msGridColumn msGridColumnSpan msGridRow msGridRowSpan WebkitAnimationIterationCount WebkitBoxFlex WebKitBoxFlexGroup WebkitBoxOrdinalGroup WebkitColumnCount WebkitColumns WebkitFlex WebkitFlexGrow WebkitFlexPositive WebkitFlexShrink WebkitLineClamp".split(" "));
  function Md(e, t, a) {
    var i = t.indexOf("--") === 0;
    a == null || typeof a == "boolean" || a === "" ? i ? e.setProperty(t, "") : t === "float" ? e.cssFloat = "" : e[t] = "" : i ? e.setProperty(t, a) : typeof a != "number" || a === 0 || If.has(t) ? t === "float" ? e.cssFloat = a : e[t] = ("" + a).trim() : e[t] = a + "px";
  }
  function Od(e, t, a) {
    if (t != null && typeof t != "object") throw Error(p(62));
    if (e = e.style, a != null) {
      for (var i in a) !a.hasOwnProperty(i) || t != null && t.hasOwnProperty(i) || (i.indexOf("--") === 0 ? e.setProperty(i, "") : i === "float" ? e.cssFloat = "" : e[i] = "");
      for (var n in t) i = t[n], t.hasOwnProperty(n) && a[n] !== i && Md(e, n, i);
    } else for (var s in t) t.hasOwnProperty(s) && Md(e, s, t[s]);
  }
  function Ys(e) {
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
  var $f = /* @__PURE__ */ new Map([
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
  ]), Wf = /^[\u0000-\u001F ]*j[\r\n\t]*a[\r\n\t]*v[\r\n\t]*a[\r\n\t]*s[\r\n\t]*c[\r\n\t]*r[\r\n\t]*i[\r\n\t]*p[\r\n\t]*t[\r\n\t]*:/i;
  function jn(e) {
    return Wf.test("" + e) ? "javascript:throw new Error('React has blocked a javascript: URL as a security precaution.')" : e;
  }
  function da() {
  }
  var Vs = null;
  function Qs(e) {
    return e = e.target || e.srcElement || window, e.correspondingUseElement && (e = e.correspondingUseElement), e.nodeType === 3 ? e.parentNode : e;
  }
  var Al = null, Tl = null;
  function Dd(e) {
    var t = zl(e);
    if (t && (e = t.stateNode)) {
      var a = e[_t] || null;
      e: switch (e = t.stateNode, t.type) {
        case "input":
          if (Bs(e, a.value, a.defaultValue, a.defaultValue, a.checked, a.defaultChecked, a.type, a.name), t = a.name, a.type === "radio" && t != null) {
            for (a = e; a.parentNode; ) a = a.parentNode;
            for (a = a.querySelectorAll('input[name="' + Yt("" + t) + '"][type="radio"]'), t = 0; t < a.length; t++) {
              var i = a[t];
              if (i !== e && i.form === e.form) {
                var n = i[_t] || null;
                if (!n) throw Error(p(90));
                Bs(i, n.value, n.defaultValue, n.defaultValue, n.checked, n.defaultChecked, n.type, n.name);
              }
            }
            for (t = 0; t < a.length; t++) i = a[t], i.form === e.form && Cd(i);
          }
          break e;
        case "textarea":
          Ad(e, a.value, a.defaultValue);
          break e;
        case "select":
          t = a.value, t != null && Cl(e, !!a.multiple, t, !1);
      }
    }
  }
  var Xs = !1;
  function Ud(e, t, a) {
    if (Xs) return e(t, a);
    Xs = !0;
    try {
      return e(t);
    } finally {
      if (Xs = !1, (Al !== null || Tl !== null) && (cs(), Al && (t = Al, e = Tl, Tl = Al = null, Dd(t), e)))
        for (t = 0; t < e.length; t++) Dd(e[t]);
    }
  }
  function gi(e, t) {
    var a = e.stateNode;
    if (a === null) return null;
    var i = a[_t] || null;
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
    if (a && typeof a != "function") throw Error(p(231, t, typeof a));
    return a;
  }
  var oa = !(typeof window > "u" || typeof window.document > "u" || typeof window.document.createElement > "u"), Zs = !1;
  if (oa) try {
    var bi = {};
    Object.defineProperty(bi, "passive", { get: function() {
      Zs = !0;
    } }), window.addEventListener("test", bi, bi), window.removeEventListener("test", bi, bi);
  } catch {
    Zs = !1;
  }
  var Ea = null, Ks = null, yn = null;
  function Rd() {
    if (yn) return yn;
    var e, t = Ks, a = t.length, i, n = "value" in Ea ? Ea.value : Ea.textContent, s = n.length;
    for (e = 0; e < a && t[e] === n[e]; e++) ;
    var c = a - e;
    for (i = 1; i <= c && t[a - i] === n[s - i]; i++) ;
    return yn = n.slice(e, 1 < i ? 1 - i : void 0);
  }
  function Sn(e) {
    var t = e.keyCode;
    return "charCode" in e ? (e = e.charCode, e === 0 && t === 13 && (e = 13)) : e = t, e === 10 && (e = 13), 32 <= e || e === 13 ? e : 0;
  }
  function Nn() {
    return !0;
  }
  function Ld() {
    return !1;
  }
  function Ct(e) {
    function t(a, i, n, s, c) {
      this._reactName = a, this._targetInst = n, this.type = i, this.nativeEvent = s, this.target = c, this.currentTarget = null;
      for (var u in e) e.hasOwnProperty(u) && (a = e[u], this[u] = a ? a(s) : s[u]);
      return this.isDefaultPrevented = (s.defaultPrevented != null ? s.defaultPrevented : s.returnValue === !1) ? Nn : Ld, this.isPropagationStopped = Ld, this;
    }
    return z(t.prototype, {
      preventDefault: function() {
        this.defaultPrevented = !0;
        var a = this.nativeEvent;
        a && (a.preventDefault ? a.preventDefault() : typeof a.returnValue != "unknown" && (a.returnValue = !1), this.isDefaultPrevented = Nn);
      },
      stopPropagation: function() {
        var a = this.nativeEvent;
        a && (a.stopPropagation ? a.stopPropagation() : typeof a.cancelBubble != "unknown" && (a.cancelBubble = !0), this.isPropagationStopped = Nn);
      },
      persist: function() {
      },
      isPersistent: Nn
    }), t;
  }
  var el = {
    eventPhase: 0,
    bubbles: 0,
    cancelable: 0,
    timeStamp: function(e) {
      return e.timeStamp || Date.now();
    },
    defaultPrevented: 0,
    isTrusted: 0
  }, wn = Ct(el), vi = z({}, el, {
    view: 0,
    detail: 0
  }), Ff = Ct(vi), Js, Is, ji, zn = z({}, vi, {
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
    getModifierState: Ws,
    button: 0,
    buttons: 0,
    relatedTarget: function(e) {
      return e.relatedTarget === void 0 ? e.fromElement === e.srcElement ? e.toElement : e.fromElement : e.relatedTarget;
    },
    movementX: function(e) {
      return "movementX" in e ? e.movementX : (e !== ji && (ji && e.type === "mousemove" ? (Js = e.screenX - ji.screenX, Is = e.screenY - ji.screenY) : Is = Js = 0, ji = e), Js);
    },
    movementY: function(e) {
      return "movementY" in e ? e.movementY : Is;
    }
  }), qd = Ct(zn), Pf = Ct(z({}, zn, { dataTransfer: 0 })), $s = Ct(z({}, vi, { relatedTarget: 0 })), e0 = Ct(z({}, el, {
    animationName: 0,
    elapsedTime: 0,
    pseudoElement: 0
  })), t0 = Ct(z({}, el, { clipboardData: function(e) {
    return "clipboardData" in e ? e.clipboardData : window.clipboardData;
  } })), Hd = Ct(z({}, el, { data: 0 })), a0 = {
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
  }, l0 = {
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
  }, i0 = {
    Alt: "altKey",
    Control: "ctrlKey",
    Meta: "metaKey",
    Shift: "shiftKey"
  };
  function n0(e) {
    var t = this.nativeEvent;
    return t.getModifierState ? t.getModifierState(e) : (e = i0[e]) ? !!t[e] : !1;
  }
  function Ws() {
    return n0;
  }
  var s0 = Ct(z({}, vi, {
    key: function(e) {
      if (e.key) {
        var t = a0[e.key] || e.key;
        if (t !== "Unidentified") return t;
      }
      return e.type === "keypress" ? (e = Sn(e), e === 13 ? "Enter" : String.fromCharCode(e)) : e.type === "keydown" || e.type === "keyup" ? l0[e.keyCode] || "Unidentified" : "";
    },
    code: 0,
    location: 0,
    ctrlKey: 0,
    shiftKey: 0,
    altKey: 0,
    metaKey: 0,
    repeat: 0,
    locale: 0,
    getModifierState: Ws,
    charCode: function(e) {
      return e.type === "keypress" ? Sn(e) : 0;
    },
    keyCode: function(e) {
      return e.type === "keydown" || e.type === "keyup" ? e.keyCode : 0;
    },
    which: function(e) {
      return e.type === "keypress" ? Sn(e) : e.type === "keydown" || e.type === "keyup" ? e.keyCode : 0;
    }
  })), Bd = Ct(z({}, zn, {
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
  })), c0 = Ct(z({}, vi, {
    touches: 0,
    targetTouches: 0,
    changedTouches: 0,
    altKey: 0,
    metaKey: 0,
    ctrlKey: 0,
    shiftKey: 0,
    getModifierState: Ws
  })), r0 = Ct(z({}, el, {
    propertyName: 0,
    elapsedTime: 0,
    pseudoElement: 0
  })), d0 = Ct(z({}, zn, {
    deltaX: function(e) {
      return "deltaX" in e ? e.deltaX : "wheelDeltaX" in e ? -e.wheelDeltaX : 0;
    },
    deltaY: function(e) {
      return "deltaY" in e ? e.deltaY : "wheelDeltaY" in e ? -e.wheelDeltaY : "wheelDelta" in e ? -e.wheelDelta : 0;
    },
    deltaZ: 0,
    deltaMode: 0
  })), o0 = Ct(z({}, el, {
    newState: 0,
    oldState: 0
  })), u0 = [
    9,
    13,
    27,
    32
  ], Fs = oa && "CompositionEvent" in window, yi = null;
  oa && "documentMode" in document && (yi = document.documentMode);
  var p0 = oa && "TextEvent" in window && !yi, Gd = oa && (!Fs || yi && 8 < yi && 11 >= yi), Yd = " ", Vd = !1;
  function Qd(e, t) {
    switch (e) {
      case "keyup":
        return u0.indexOf(t.keyCode) !== -1;
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
  function Xd(e) {
    return e = e.detail, typeof e == "object" && "data" in e ? e.data : null;
  }
  var Ml = !1;
  function f0(e, t) {
    switch (e) {
      case "compositionend":
        return Xd(t);
      case "keypress":
        return t.which !== 32 ? null : (Vd = !0, Yd);
      case "textInput":
        return e = t.data, e === Yd && Vd ? null : e;
      default:
        return null;
    }
  }
  function h0(e, t) {
    if (Ml) return e === "compositionend" || !Fs && Qd(e, t) ? (e = Rd(), yn = Ks = Ea = null, Ml = !1, e) : null;
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
        return Gd && t.locale !== "ko" ? null : t.data;
      default:
        return null;
    }
  }
  var m0 = {
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
  function Zd(e) {
    var t = e && e.nodeName && e.nodeName.toLowerCase();
    return t === "input" ? !!m0[e.type] : t === "textarea";
  }
  function Kd(e, t, a, i) {
    Al ? Tl ? Tl.push(i) : Tl = [i] : Al = i, t = hs(t, "onChange"), 0 < t.length && (a = new wn("onChange", "change", null, a, i), e.push({
      event: a,
      listeners: t
    }));
  }
  var Si = null, Ni = null;
  function x0(e) {
    _p(e, 0);
  }
  function kn(e) {
    if (Cd(xi(e))) return e;
  }
  function Jd(e, t) {
    if (e === "change") return t;
  }
  var Id = !1;
  if (oa) {
    var Ps;
    if (oa) {
      var ec = "oninput" in document;
      if (!ec) {
        var $d = document.createElement("div");
        $d.setAttribute("oninput", "return;"), ec = typeof $d.oninput == "function";
      }
      Ps = ec;
    } else Ps = !1;
    Id = Ps && (!document.documentMode || 9 < document.documentMode);
  }
  function Wd() {
    Si && (Si.detachEvent("onpropertychange", Fd), Ni = Si = null);
  }
  function Fd(e) {
    if (e.propertyName === "value" && kn(Ni)) {
      var t = [];
      Kd(t, Ni, e, Qs(e)), Ud(x0, t);
    }
  }
  function g0(e, t, a) {
    e === "focusin" ? (Wd(), Si = t, Ni = a, Si.attachEvent("onpropertychange", Fd)) : e === "focusout" && Wd();
  }
  function b0(e) {
    if (e === "selectionchange" || e === "keyup" || e === "keydown") return kn(Ni);
  }
  function v0(e, t) {
    if (e === "click") return kn(t);
  }
  function j0(e, t) {
    if (e === "input" || e === "change") return kn(t);
  }
  function y0(e, t) {
    return e === t && (e !== 0 || 1 / e === 1 / t) || e !== e && t !== t;
  }
  var Ut = typeof Object.is == "function" ? Object.is : y0;
  function wi(e, t) {
    if (Ut(e, t)) return !0;
    if (typeof e != "object" || e === null || typeof t != "object" || t === null) return !1;
    var a = Object.keys(e), i = Object.keys(t);
    if (a.length !== i.length) return !1;
    for (i = 0; i < a.length; i++) {
      var n = a[i];
      if (!He.call(t, n) || !Ut(e[n], t[n])) return !1;
    }
    return !0;
  }
  function Pd(e) {
    for (; e && e.firstChild; ) e = e.firstChild;
    return e;
  }
  function eo(e, t) {
    var a = Pd(e);
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
      a = Pd(a);
    }
  }
  function to(e, t) {
    return e && t ? e === t ? !0 : e && e.nodeType === 3 ? !1 : t && t.nodeType === 3 ? to(e, t.parentNode) : "contains" in e ? e.contains(t) : e.compareDocumentPosition ? !!(e.compareDocumentPosition(t) & 16) : !1 : !1;
  }
  function ao(e) {
    e = e != null && e.ownerDocument != null && e.ownerDocument.defaultView != null ? e.ownerDocument.defaultView : window;
    for (var t = vn(e.document); t instanceof e.HTMLIFrameElement; ) {
      try {
        var a = typeof t.contentWindow.location.href == "string";
      } catch {
        a = !1;
      }
      if (a) e = t.contentWindow;
      else break;
      t = vn(e.document);
    }
    return t;
  }
  function tc(e) {
    var t = e && e.nodeName && e.nodeName.toLowerCase();
    return t && (t === "input" && (e.type === "text" || e.type === "search" || e.type === "tel" || e.type === "url" || e.type === "password") || t === "textarea" || e.contentEditable === "true");
  }
  var S0 = oa && "documentMode" in document && 11 >= document.documentMode, Ol = null, ac = null, zi = null, lc = !1;
  function lo(e, t, a) {
    var i = a.window === a ? a.document : a.nodeType === 9 ? a : a.ownerDocument;
    lc || Ol == null || Ol !== vn(i) || (i = Ol, "selectionStart" in i && tc(i) ? i = {
      start: i.selectionStart,
      end: i.selectionEnd
    } : (i = (i.ownerDocument && i.ownerDocument.defaultView || window).getSelection(), i = {
      anchorNode: i.anchorNode,
      anchorOffset: i.anchorOffset,
      focusNode: i.focusNode,
      focusOffset: i.focusOffset
    }), zi && wi(zi, i) || (zi = i, i = hs(ac, "onSelect"), 0 < i.length && (t = new wn("onSelect", "select", null, t, a), e.push({
      event: t,
      listeners: i
    }), t.target = Ol)));
  }
  function tl(e, t) {
    var a = {};
    return a[e.toLowerCase()] = t.toLowerCase(), a["Webkit" + e] = "webkit" + t, a["Moz" + e] = "moz" + t, a;
  }
  var Dl = {
    animationend: tl("Animation", "AnimationEnd"),
    animationiteration: tl("Animation", "AnimationIteration"),
    animationstart: tl("Animation", "AnimationStart"),
    transitionrun: tl("Transition", "TransitionRun"),
    transitionstart: tl("Transition", "TransitionStart"),
    transitioncancel: tl("Transition", "TransitionCancel"),
    transitionend: tl("Transition", "TransitionEnd")
  }, ic = {}, io = {};
  oa && (io = document.createElement("div").style, "AnimationEvent" in window || (delete Dl.animationend.animation, delete Dl.animationiteration.animation, delete Dl.animationstart.animation), "TransitionEvent" in window || delete Dl.transitionend.transition);
  function al(e) {
    if (ic[e]) return ic[e];
    if (!Dl[e]) return e;
    var t = Dl[e], a;
    for (a in t) if (t.hasOwnProperty(a) && a in io) return ic[e] = t[a];
    return e;
  }
  var no = al("animationend"), so = al("animationiteration"), co = al("animationstart"), N0 = al("transitionrun"), w0 = al("transitionstart"), z0 = al("transitioncancel"), ro = al("transitionend"), oo = /* @__PURE__ */ new Map(), nc = "abort auxClick beforeToggle cancel canPlay canPlayThrough click close contextMenu copy cut drag dragEnd dragEnter dragExit dragLeave dragOver dragStart drop durationChange emptied encrypted ended error gotPointerCapture input invalid keyDown keyPress keyUp load loadedData loadedMetadata loadStart lostPointerCapture mouseDown mouseMove mouseOut mouseOver mouseUp paste pause play playing pointerCancel pointerDown pointerMove pointerOut pointerOver pointerUp progress rateChange reset resize seeked seeking stalled submit suspend timeUpdate touchCancel touchEnd touchStart volumeChange scroll toggle touchMove waiting wheel".split(" ");
  nc.push("scrollEnd");
  function ea(e, t) {
    oo.set(e, t), Pa(t, [e]);
  }
  var _n = typeof reportError == "function" ? reportError : function(e) {
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
  }, Vt = [], Ul = 0, sc = 0;
  function Cn() {
    for (var e = Ul, t = sc = Ul = 0; t < e; ) {
      var a = Vt[t];
      Vt[t++] = null;
      var i = Vt[t];
      Vt[t++] = null;
      var n = Vt[t];
      Vt[t++] = null;
      var s = Vt[t];
      if (Vt[t++] = null, i !== null && n !== null) {
        var c = i.pending;
        c === null ? n.next = n : (n.next = c.next, c.next = n), i.pending = n;
      }
      s !== 0 && uo(a, n, s);
    }
  }
  function En(e, t, a, i) {
    Vt[Ul++] = e, Vt[Ul++] = t, Vt[Ul++] = a, Vt[Ul++] = i, sc |= i, e.lanes |= i, e = e.alternate, e !== null && (e.lanes |= i);
  }
  function cc(e, t, a, i) {
    return En(e, t, a, i), An(e);
  }
  function ll(e, t) {
    return En(e, null, null, t), An(e);
  }
  function uo(e, t, a) {
    e.lanes |= a;
    var i = e.alternate;
    i !== null && (i.lanes |= a);
    for (var n = !1, s = e.return; s !== null; ) s.childLanes |= a, i = s.alternate, i !== null && (i.childLanes |= a), s.tag === 22 && (e = s.stateNode, e === null || e._visibility & 1 || (n = !0)), e = s, s = s.return;
    return e.tag === 3 ? (s = e.stateNode, n && t !== null && (n = 31 - ht(a), e = s.hiddenUpdates, i = e[n], i === null ? e[n] = [t] : i.push(t), t.lane = a | 536870912), s) : null;
  }
  function An(e) {
    if (50 < Ki) throw Ki = 0, xr = null, Error(p(185));
    for (var t = e.return; t !== null; ) e = t, t = e.return;
    return e.tag === 3 ? e.stateNode : null;
  }
  var Rl = {};
  function k0(e, t, a, i) {
    this.tag = e, this.key = a, this.sibling = this.child = this.return = this.stateNode = this.type = this.elementType = null, this.index = 0, this.refCleanup = this.ref = null, this.pendingProps = t, this.dependencies = this.memoizedState = this.updateQueue = this.memoizedProps = null, this.mode = i, this.subtreeFlags = this.flags = 0, this.deletions = null, this.childLanes = this.lanes = 0, this.alternate = null;
  }
  function Rt(e, t, a, i) {
    return new k0(e, t, a, i);
  }
  function rc(e) {
    return e = e.prototype, !(!e || !e.isReactComponent);
  }
  function ua(e, t) {
    var a = e.alternate;
    return a === null ? (a = Rt(e.tag, t, e.key, e.mode), a.elementType = e.elementType, a.type = e.type, a.stateNode = e.stateNode, a.alternate = e, e.alternate = a) : (a.pendingProps = t, a.type = e.type, a.flags = 0, a.subtreeFlags = 0, a.deletions = null), a.flags = e.flags & 65011712, a.childLanes = e.childLanes, a.lanes = e.lanes, a.child = e.child, a.memoizedProps = e.memoizedProps, a.memoizedState = e.memoizedState, a.updateQueue = e.updateQueue, t = e.dependencies, a.dependencies = t === null ? null : {
      lanes: t.lanes,
      firstContext: t.firstContext
    }, a.sibling = e.sibling, a.index = e.index, a.ref = e.ref, a.refCleanup = e.refCleanup, a;
  }
  function po(e, t) {
    e.flags &= 65011714;
    var a = e.alternate;
    return a === null ? (e.childLanes = 0, e.lanes = t, e.child = null, e.subtreeFlags = 0, e.memoizedProps = null, e.memoizedState = null, e.updateQueue = null, e.dependencies = null, e.stateNode = null) : (e.childLanes = a.childLanes, e.lanes = a.lanes, e.child = a.child, e.subtreeFlags = 0, e.deletions = null, e.memoizedProps = a.memoizedProps, e.memoizedState = a.memoizedState, e.updateQueue = a.updateQueue, e.type = a.type, t = a.dependencies, e.dependencies = t === null ? null : {
      lanes: t.lanes,
      firstContext: t.firstContext
    }), e;
  }
  function Tn(e, t, a, i, n, s) {
    var c = 0;
    if (i = e, typeof e == "function") rc(e) && (c = 1);
    else if (typeof e == "string") c = Mh(e, a, W.current) ? 26 : e === "html" || e === "head" || e === "body" ? 27 : 5;
    else e: switch (e) {
      case y:
        return e = Rt(31, a, t, n), e.elementType = y, e.lanes = s, e;
      case X:
        return il(a.children, n, s, t);
      case oe:
        c = 8, n |= 24;
        break;
      case q:
        return e = Rt(12, a, t, n | 2), e.elementType = q, e.lanes = s, e;
      case $:
        return e = Rt(13, a, t, n), e.elementType = $, e.lanes = s, e;
      case pe:
        return e = Rt(19, a, t, n), e.elementType = pe, e.lanes = s, e;
      default:
        if (typeof e == "object" && e !== null) switch (e.$$typeof) {
          case H:
            c = 10;
            break e;
          case ie:
            c = 9;
            break e;
          case F:
            c = 11;
            break e;
          case te:
            c = 14;
            break e;
          case P:
            c = 16, i = null;
            break e;
        }
        c = 29, a = Error(p(130, e === null ? "null" : typeof e, "")), i = null;
    }
    return t = Rt(c, a, t, n), t.elementType = e, t.type = i, t.lanes = s, t;
  }
  function il(e, t, a, i) {
    return e = Rt(7, e, i, t), e.lanes = a, e;
  }
  function dc(e, t, a) {
    return e = Rt(6, e, null, t), e.lanes = a, e;
  }
  function fo(e) {
    var t = Rt(18, null, null, 0);
    return t.stateNode = e, t;
  }
  function oc(e, t, a) {
    return t = Rt(4, e.children !== null ? e.children : [], e.key, t), t.lanes = a, t.stateNode = {
      containerInfo: e.containerInfo,
      pendingChildren: null,
      implementation: e.implementation
    }, t;
  }
  var ho = /* @__PURE__ */ new WeakMap();
  function Qt(e, t) {
    if (typeof e == "object" && e !== null) {
      var a = ho.get(e);
      return a !== void 0 ? a : (t = {
        value: e,
        source: t,
        stack: ue(t)
      }, ho.set(e, t), t);
    }
    return {
      value: e,
      source: t,
      stack: ue(t)
    };
  }
  var Ll = [], ql = 0, Mn = null, ki = 0, Xt = [], Zt = 0, Aa = null, ia = 1, na = "";
  function pa(e, t) {
    Ll[ql++] = ki, Ll[ql++] = Mn, Mn = e, ki = t;
  }
  function mo(e, t, a) {
    Xt[Zt++] = ia, Xt[Zt++] = na, Xt[Zt++] = Aa, Aa = e;
    var i = ia;
    e = na;
    var n = 32 - ht(i) - 1;
    i &= ~(1 << n), a += 1;
    var s = 32 - ht(t) + n;
    if (30 < s) {
      var c = n - n % 5;
      s = (i & (1 << c) - 1).toString(32), i >>= c, n -= c, ia = 1 << 32 - ht(t) + n | a << n | i, na = s + e;
    } else ia = 1 << s | a << n | i, na = e;
  }
  function uc(e) {
    e.return !== null && (pa(e, 1), mo(e, 1, 0));
  }
  function pc(e) {
    for (; e === Mn; ) Mn = Ll[--ql], Ll[ql] = null, ki = Ll[--ql], Ll[ql] = null;
    for (; e === Aa; ) Aa = Xt[--Zt], Xt[Zt] = null, na = Xt[--Zt], Xt[Zt] = null, ia = Xt[--Zt], Xt[Zt] = null;
  }
  function xo(e, t) {
    Xt[Zt++] = ia, Xt[Zt++] = na, Xt[Zt++] = Aa, ia = t.id, na = t.overflow, Aa = e;
  }
  var jt = null, et = null, Le = !1, Ta = null, Kt = !1, fc = Error(p(519));
  function Ma(e) {
    throw _i(Qt(Error(p(418, 1 < arguments.length && arguments[1] !== void 0 && arguments[1] ? "text" : "HTML", "")), e)), fc;
  }
  function go(e) {
    var t = e.stateNode, a = e.type, i = e.memoizedProps;
    switch (t[vt] = e, t[_t] = i, a) {
      case "dialog":
        De("cancel", t), De("close", t);
        break;
      case "iframe":
      case "object":
      case "embed":
        De("load", t);
        break;
      case "video":
      case "audio":
        for (a = 0; a < Ii.length; a++) De(Ii[a], t);
        break;
      case "source":
        De("error", t);
        break;
      case "img":
      case "image":
      case "link":
        De("error", t), De("load", t);
        break;
      case "details":
        De("toggle", t);
        break;
      case "input":
        De("invalid", t), Ed(t, i.value, i.defaultValue, i.checked, i.defaultChecked, i.type, i.name, !0);
        break;
      case "select":
        De("invalid", t);
        break;
      case "textarea":
        De("invalid", t), Td(t, i.value, i.defaultValue, i.children);
    }
    a = i.children, typeof a != "string" && typeof a != "number" && typeof a != "bigint" || t.textContent === "" + a || i.suppressHydrationWarning === !0 || Mp(t.textContent, a) ? (i.popover != null && (De("beforetoggle", t), De("toggle", t)), i.onScroll != null && De("scroll", t), i.onScrollEnd != null && De("scrollend", t), i.onClick != null && (t.onclick = da), t = !0) : t = !1, t || Ma(e, !0);
  }
  function bo(e) {
    for (jt = e.return; jt; ) switch (jt.tag) {
      case 5:
      case 31:
      case 13:
        Kt = !1;
        return;
      case 27:
      case 3:
        Kt = !0;
        return;
      default:
        jt = jt.return;
    }
  }
  function Hl(e) {
    if (e !== jt) return !1;
    if (!Le) return bo(e), Le = !0, !1;
    var t = e.tag, a;
    if ((a = t !== 3 && t !== 27) && ((a = t === 5) && (a = e.type, a = !(a !== "form" && a !== "button") || Ar(e.type, e.memoizedProps)), a = !a), a && et && Ma(e), bo(e), t === 13) {
      if (e = e.memoizedState, e = e !== null ? e.dehydrated : null, !e) throw Error(p(317));
      et = Gp(e);
    } else if (t === 31) {
      if (e = e.memoizedState, e = e !== null ? e.dehydrated : null, !e) throw Error(p(317));
      et = Gp(e);
    } else t === 27 ? (t = et, Qa(e.type) ? (e = Ur, Ur = null, et = e) : et = t) : et = jt ? $t(e.stateNode.nextSibling) : null;
    return !0;
  }
  function nl() {
    et = jt = null, Le = !1;
  }
  function hc() {
    var e = Ta;
    return e !== null && (Mt === null ? Mt = e : Mt.push.apply(Mt, e), Ta = null), e;
  }
  function _i(e) {
    Ta === null ? Ta = [e] : Ta.push(e);
  }
  var mc = o(null), sl = null, fa = null;
  function Oa(e, t, a) {
    R(mc, t._currentValue), t._currentValue = a;
  }
  function ha(e) {
    e._currentValue = mc.current, j(mc);
  }
  function xc(e, t, a) {
    for (; e !== null; ) {
      var i = e.alternate;
      if ((e.childLanes & t) !== t ? (e.childLanes |= t, i !== null && (i.childLanes |= t)) : i !== null && (i.childLanes & t) !== t && (i.childLanes |= t), e === a) break;
      e = e.return;
    }
  }
  function gc(e, t, a, i) {
    var n = e.child;
    for (n !== null && (n.return = e); n !== null; ) {
      var s = n.dependencies;
      if (s !== null) {
        var c = n.child;
        s = s.firstContext;
        e: for (; s !== null; ) {
          var u = s;
          s = n;
          for (var v = 0; v < t.length; v++) if (u.context === t[v]) {
            s.lanes |= a, u = s.alternate, u !== null && (u.lanes |= a), xc(s.return, a, e), i || (c = null);
            break e;
          }
          s = u.next;
        }
      } else if (n.tag === 18) {
        if (c = n.return, c === null) throw Error(p(341));
        c.lanes |= a, s = c.alternate, s !== null && (s.lanes |= a), xc(c, a, e), c = null;
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
  function Bl(e, t, a, i) {
    e = null;
    for (var n = t, s = !1; n !== null; ) {
      if (!s) {
        if ((n.flags & 524288) !== 0) s = !0;
        else if ((n.flags & 262144) !== 0) break;
      }
      if (n.tag === 10) {
        var c = n.alternate;
        if (c === null) throw Error(p(387));
        if (c = c.memoizedProps, c !== null) {
          var u = n.type;
          Ut(n.pendingProps.value, c.value) || (e !== null ? e.push(u) : e = [u]);
        }
      } else if (n === de.current) {
        if (c = n.alternate, c === null) throw Error(p(387));
        c.memoizedState.memoizedState !== n.memoizedState.memoizedState && (e !== null ? e.push(en) : e = [en]);
      }
      n = n.return;
    }
    e !== null && gc(t, e, a, i), t.flags |= 262144;
  }
  function On(e) {
    for (e = e.firstContext; e !== null; ) {
      if (!Ut(e.context._currentValue, e.memoizedValue)) return !0;
      e = e.next;
    }
    return !1;
  }
  function cl(e) {
    sl = e, fa = null, e = e.dependencies, e !== null && (e.firstContext = null);
  }
  function yt(e) {
    return vo(sl, e);
  }
  function Dn(e, t) {
    return sl === null && cl(e), vo(e, t);
  }
  function vo(e, t) {
    var a = t._currentValue;
    if (t = {
      context: t,
      memoizedValue: a,
      next: null
    }, fa === null) {
      if (e === null) throw Error(p(308));
      fa = t, e.dependencies = {
        lanes: 0,
        firstContext: t
      }, e.flags |= 524288;
    } else fa = fa.next = t;
    return a;
  }
  var _0 = typeof AbortController < "u" ? AbortController : function() {
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
  }, C0 = h.unstable_scheduleCallback, E0 = h.unstable_NormalPriority, ot = {
    $$typeof: H,
    Consumer: null,
    Provider: null,
    _currentValue: null,
    _currentValue2: null,
    _threadCount: 0
  };
  function bc() {
    return {
      controller: new _0(),
      data: /* @__PURE__ */ new Map(),
      refCount: 0
    };
  }
  function Ci(e) {
    e.refCount--, e.refCount === 0 && C0(E0, function() {
      e.controller.abort();
    });
  }
  var Ei = null, vc = 0, Gl = 0, Yl = null;
  function A0(e, t) {
    if (Ei === null) {
      var a = Ei = [];
      vc = 0, Gl = Sr(), Yl = {
        status: "pending",
        value: void 0,
        then: function(i) {
          a.push(i);
        }
      };
    }
    return vc++, t.then(jo, jo), t;
  }
  function jo() {
    if (--vc === 0 && Ei !== null) {
      Yl !== null && (Yl.status = "fulfilled");
      var e = Ei;
      Ei = null, Gl = 0, Yl = null;
      for (var t = 0; t < e.length; t++) (0, e[t])();
    }
  }
  function T0(e, t) {
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
  var yo = Y.S;
  Y.S = function(e, t) {
    tp = M(), typeof t == "object" && t !== null && typeof t.then == "function" && A0(e, t), yo !== null && yo(e, t);
  };
  var rl = o(null);
  function jc() {
    var e = rl.current;
    return e !== null ? e : Pe.pooledCache;
  }
  function Un(e, t) {
    t === null ? R(rl, rl.current) : R(rl, t.pool);
  }
  function So() {
    var e = jc();
    return e === null ? null : {
      parent: ot._currentValue,
      pool: e
    };
  }
  var Vl = Error(p(460)), yc = Error(p(474)), Rn = Error(p(542)), Ln = { then: function() {
  } };
  function No(e) {
    return e = e.status, e === "fulfilled" || e === "rejected";
  }
  function wo(e, t, a) {
    switch (a = e[a], a === void 0 ? e.push(t) : a !== t && (t.then(da, da), t = a), t.status) {
      case "fulfilled":
        return t.value;
      case "rejected":
        throw e = t.reason, ko(e), e;
      default:
        if (typeof t.status == "string") t.then(da, da);
        else {
          if (e = Pe, e !== null && 100 < e.shellSuspendCounter) throw Error(p(482));
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
            throw e = t.reason, ko(e), e;
        }
        throw ol = t, Vl;
    }
  }
  function dl(e) {
    try {
      var t = e._init;
      return t(e._payload);
    } catch (a) {
      throw a !== null && typeof a == "object" && typeof a.then == "function" ? (ol = a, Vl) : a;
    }
  }
  var ol = null;
  function zo() {
    if (ol === null) throw Error(p(459));
    var e = ol;
    return ol = null, e;
  }
  function ko(e) {
    if (e === Vl || e === Rn) throw Error(p(483));
  }
  var Ql = null, Ai = 0;
  function qn(e) {
    var t = Ai;
    return Ai += 1, Ql === null && (Ql = []), wo(Ql, e, t);
  }
  function Ti(e, t) {
    t = t.props.ref, e.ref = t !== void 0 ? t : null;
  }
  function Hn(e, t) {
    throw t.$$typeof === le ? Error(p(525)) : (e = Object.prototype.toString.call(t), Error(p(31, e === "[object Object]" ? "object with keys {" + Object.keys(t).join(", ") + "}" : e)));
  }
  function _o(e) {
    function t(E, S) {
      if (e) {
        var O = E.deletions;
        O === null ? (E.deletions = [S], E.flags |= 16) : O.push(S);
      }
    }
    function a(E, S) {
      if (!e) return null;
      for (; S !== null; ) t(E, S), S = S.sibling;
      return null;
    }
    function i(E) {
      for (var S = /* @__PURE__ */ new Map(); E !== null; ) E.key !== null ? S.set(E.key, E) : S.set(E.index, E), E = E.sibling;
      return S;
    }
    function n(E, S) {
      return E = ua(E, S), E.index = 0, E.sibling = null, E;
    }
    function s(E, S, O) {
      return E.index = O, e ? (O = E.alternate, O !== null ? (O = O.index, O < S ? (E.flags |= 67108866, S) : O) : (E.flags |= 67108866, S)) : (E.flags |= 1048576, S);
    }
    function c(E) {
      return e && E.alternate === null && (E.flags |= 67108866), E;
    }
    function u(E, S, O, Z) {
      return S === null || S.tag !== 6 ? (S = dc(O, E.mode, Z), S.return = E, S) : (S = n(S, O), S.return = E, S);
    }
    function v(E, S, O, Z) {
      var be = O.type;
      return be === X ? V(E, S, O.props.children, Z, O.key) : S !== null && (S.elementType === be || typeof be == "object" && be !== null && be.$$typeof === P && dl(be) === S.type) ? (S = n(S, O.props), Ti(S, O), S.return = E, S) : (S = Tn(O.type, O.key, O.props, null, E.mode, Z), Ti(S, O), S.return = E, S);
    }
    function D(E, S, O, Z) {
      return S === null || S.tag !== 4 || S.stateNode.containerInfo !== O.containerInfo || S.stateNode.implementation !== O.implementation ? (S = oc(O, E.mode, Z), S.return = E, S) : (S = n(S, O.children || []), S.return = E, S);
    }
    function V(E, S, O, Z, be) {
      return S === null || S.tag !== 7 ? (S = il(O, E.mode, Z, be), S.return = E, S) : (S = n(S, O), S.return = E, S);
    }
    function J(E, S, O) {
      if (typeof S == "string" && S !== "" || typeof S == "number" || typeof S == "bigint") return S = dc("" + S, E.mode, O), S.return = E, S;
      if (typeof S == "object" && S !== null) {
        switch (S.$$typeof) {
          case ne:
            return O = Tn(S.type, S.key, S.props, null, E.mode, O), Ti(O, S), O.return = E, O;
          case I:
            return S = oc(S, E.mode, O), S.return = E, S;
          case P:
            return S = dl(S), J(E, S, O);
        }
        if (K(S) || me(S)) return S = il(S, E.mode, O, null), S.return = E, S;
        if (typeof S.then == "function") return J(E, qn(S), O);
        if (S.$$typeof === H) return J(E, Dn(E, S), O);
        Hn(E, S);
      }
      return null;
    }
    function U(E, S, O, Z) {
      var be = S !== null ? S.key : null;
      if (typeof O == "string" && O !== "" || typeof O == "number" || typeof O == "bigint") return be !== null ? null : u(E, S, "" + O, Z);
      if (typeof O == "object" && O !== null) {
        switch (O.$$typeof) {
          case ne:
            return O.key === be ? v(E, S, O, Z) : null;
          case I:
            return O.key === be ? D(E, S, O, Z) : null;
          case P:
            return O = dl(O), U(E, S, O, Z);
        }
        if (K(O) || me(O)) return be !== null ? null : V(E, S, O, Z, null);
        if (typeof O.then == "function") return U(E, S, qn(O), Z);
        if (O.$$typeof === H) return U(E, S, Dn(E, O), Z);
        Hn(E, O);
      }
      return null;
    }
    function L(E, S, O, Z, be) {
      if (typeof Z == "string" && Z !== "" || typeof Z == "number" || typeof Z == "bigint") return E = E.get(O) || null, u(S, E, "" + Z, be);
      if (typeof Z == "object" && Z !== null) {
        switch (Z.$$typeof) {
          case ne:
            return E = E.get(Z.key === null ? O : Z.key) || null, v(S, E, Z, be);
          case I:
            return E = E.get(Z.key === null ? O : Z.key) || null, D(S, E, Z, be);
          case P:
            return Z = dl(Z), L(E, S, O, Z, be);
        }
        if (K(Z) || me(Z)) return E = E.get(O) || null, V(S, E, Z, be, null);
        if (typeof Z.then == "function") return L(E, S, O, qn(Z), be);
        if (Z.$$typeof === H) return L(E, S, O, Dn(S, Z), be);
        Hn(S, Z);
      }
      return null;
    }
    function fe(E, S, O, Z) {
      for (var be = null, Ye = null, xe = S, Te = S = 0, Re = null; xe !== null && Te < O.length; Te++) {
        xe.index > Te ? (Re = xe, xe = null) : Re = xe.sibling;
        var Ve = U(E, xe, O[Te], Z);
        if (Ve === null) {
          xe === null && (xe = Re);
          break;
        }
        e && xe && Ve.alternate === null && t(E, xe), S = s(Ve, S, Te), Ye === null ? be = Ve : Ye.sibling = Ve, Ye = Ve, xe = Re;
      }
      if (Te === O.length) return a(E, xe), Le && pa(E, Te), be;
      if (xe === null) {
        for (; Te < O.length; Te++) xe = J(E, O[Te], Z), xe !== null && (S = s(xe, S, Te), Ye === null ? be = xe : Ye.sibling = xe, Ye = xe);
        return Le && pa(E, Te), be;
      }
      for (xe = i(xe); Te < O.length; Te++) Re = L(xe, E, Te, O[Te], Z), Re !== null && (e && Re.alternate !== null && xe.delete(Re.key === null ? Te : Re.key), S = s(Re, S, Te), Ye === null ? be = Re : Ye.sibling = Re, Ye = Re);
      return e && xe.forEach(function(Ia) {
        return t(E, Ia);
      }), Le && pa(E, Te), be;
    }
    function Ne(E, S, O, Z) {
      if (O == null) throw Error(p(151));
      for (var be = null, Ye = null, xe = S, Te = S = 0, Re = null, Ve = O.next(); xe !== null && !Ve.done; Te++, Ve = O.next()) {
        xe.index > Te ? (Re = xe, xe = null) : Re = xe.sibling;
        var Ia = U(E, xe, Ve.value, Z);
        if (Ia === null) {
          xe === null && (xe = Re);
          break;
        }
        e && xe && Ia.alternate === null && t(E, xe), S = s(Ia, S, Te), Ye === null ? be = Ia : Ye.sibling = Ia, Ye = Ia, xe = Re;
      }
      if (Ve.done) return a(E, xe), Le && pa(E, Te), be;
      if (xe === null) {
        for (; !Ve.done; Te++, Ve = O.next()) Ve = J(E, Ve.value, Z), Ve !== null && (S = s(Ve, S, Te), Ye === null ? be = Ve : Ye.sibling = Ve, Ye = Ve);
        return Le && pa(E, Te), be;
      }
      for (xe = i(xe); !Ve.done; Te++, Ve = O.next()) Ve = L(xe, E, Te, Ve.value, Z), Ve !== null && (e && Ve.alternate !== null && xe.delete(Ve.key === null ? Te : Ve.key), S = s(Ve, S, Te), Ye === null ? be = Ve : Ye.sibling = Ve, Ye = Ve);
      return e && xe.forEach(function(Zh) {
        return t(E, Zh);
      }), Le && pa(E, Te), be;
    }
    function We(E, S, O, Z) {
      if (typeof O == "object" && O !== null && O.type === X && O.key === null && (O = O.props.children), typeof O == "object" && O !== null) {
        switch (O.$$typeof) {
          case ne:
            e: {
              for (var be = O.key; S !== null; ) {
                if (S.key === be) {
                  if (be = O.type, be === X) {
                    if (S.tag === 7) {
                      a(E, S.sibling), Z = n(S, O.props.children), Z.return = E, E = Z;
                      break e;
                    }
                  } else if (S.elementType === be || typeof be == "object" && be !== null && be.$$typeof === P && dl(be) === S.type) {
                    a(E, S.sibling), Z = n(S, O.props), Ti(Z, O), Z.return = E, E = Z;
                    break e;
                  }
                  a(E, S);
                  break;
                } else t(E, S);
                S = S.sibling;
              }
              O.type === X ? (Z = il(O.props.children, E.mode, Z, O.key), Z.return = E, E = Z) : (Z = Tn(O.type, O.key, O.props, null, E.mode, Z), Ti(Z, O), Z.return = E, E = Z);
            }
            return c(E);
          case I:
            e: {
              for (be = O.key; S !== null; ) {
                if (S.key === be) if (S.tag === 4 && S.stateNode.containerInfo === O.containerInfo && S.stateNode.implementation === O.implementation) {
                  a(E, S.sibling), Z = n(S, O.children || []), Z.return = E, E = Z;
                  break e;
                } else {
                  a(E, S);
                  break;
                }
                else t(E, S);
                S = S.sibling;
              }
              Z = oc(O, E.mode, Z), Z.return = E, E = Z;
            }
            return c(E);
          case P:
            return O = dl(O), We(E, S, O, Z);
        }
        if (K(O)) return fe(E, S, O, Z);
        if (me(O)) {
          if (be = me(O), typeof be != "function") throw Error(p(150));
          return O = be.call(O), Ne(E, S, O, Z);
        }
        if (typeof O.then == "function") return We(E, S, qn(O), Z);
        if (O.$$typeof === H) return We(E, S, Dn(E, O), Z);
        Hn(E, O);
      }
      return typeof O == "string" && O !== "" || typeof O == "number" || typeof O == "bigint" ? (O = "" + O, S !== null && S.tag === 6 ? (a(E, S.sibling), Z = n(S, O), Z.return = E, E = Z) : (a(E, S), Z = dc(O, E.mode, Z), Z.return = E, E = Z), c(E)) : a(E, S);
    }
    return function(E, S, O, Z) {
      try {
        Ai = 0;
        var be = We(E, S, O, Z);
        return Ql = null, be;
      } catch (xe) {
        if (xe === Vl || xe === Rn) throw xe;
        var Ye = Rt(29, xe, null, E.mode);
        return Ye.lanes = Z, Ye.return = E, Ye;
      }
    };
  }
  var ul = _o(!0), Co = _o(!1), Da = !1;
  function Sc(e) {
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
  function Nc(e, t) {
    e = e.updateQueue, t.updateQueue === e && (t.updateQueue = {
      baseState: e.baseState,
      firstBaseUpdate: e.firstBaseUpdate,
      lastBaseUpdate: e.lastBaseUpdate,
      shared: e.shared,
      callbacks: null
    });
  }
  function pl(e) {
    return {
      lane: e,
      tag: 0,
      payload: null,
      callback: null,
      next: null
    };
  }
  function fl(e, t, a) {
    var i = e.updateQueue;
    if (i === null) return null;
    if (i = i.shared, (Qe & 2) !== 0) {
      var n = i.pending;
      return n === null ? t.next = t : (t.next = n.next, n.next = t), i.pending = t, t = An(e), uo(e, null, a), t;
    }
    return En(e, i, t, a), An(e);
  }
  function Mi(e, t, a) {
    if (t = t.updateQueue, t !== null && (t = t.shared, (a & 4194048) !== 0)) {
      var i = t.lanes;
      i &= e.pendingLanes, a |= i, t.lanes = a, gd(e, a);
    }
  }
  function wc(e, t) {
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
  var zc = !1;
  function Oi() {
    if (zc) {
      var e = Yl;
      if (e !== null) throw e;
    }
  }
  function Di(e, t, a, i) {
    zc = !1;
    var n = e.updateQueue;
    Da = !1;
    var s = n.firstBaseUpdate, c = n.lastBaseUpdate, u = n.shared.pending;
    if (u !== null) {
      n.shared.pending = null;
      var v = u, D = v.next;
      v.next = null, c === null ? s = D : c.next = D, c = v;
      var V = e.alternate;
      V !== null && (V = V.updateQueue, u = V.lastBaseUpdate, u !== c && (u === null ? V.firstBaseUpdate = D : u.next = D, V.lastBaseUpdate = v));
    }
    if (s !== null) {
      var J = n.baseState;
      c = 0, V = D = v = null, u = s;
      do {
        var U = u.lane & -536870913, L = U !== u.lane;
        if (L ? (Ue & U) === U : (i & U) === U) {
          U !== 0 && U === Gl && (zc = !0), V !== null && (V = V.next = {
            lane: 0,
            tag: u.tag,
            payload: u.payload,
            callback: null,
            next: null
          });
          e: {
            var fe = e, Ne = u;
            U = t;
            var We = a;
            switch (Ne.tag) {
              case 1:
                if (fe = Ne.payload, typeof fe == "function") {
                  J = fe.call(We, J, U);
                  break e;
                }
                J = fe;
                break e;
              case 3:
                fe.flags = fe.flags & -65537 | 128;
              case 0:
                if (fe = Ne.payload, U = typeof fe == "function" ? fe.call(We, J, U) : fe, U == null) break e;
                J = z({}, J, U);
                break e;
              case 2:
                Da = !0;
            }
          }
          U = u.callback, U !== null && (e.flags |= 64, L && (e.flags |= 8192), L = n.callbacks, L === null ? n.callbacks = [U] : L.push(U));
        } else L = {
          lane: U,
          tag: u.tag,
          payload: u.payload,
          callback: u.callback,
          next: null
        }, V === null ? (D = V = L, v = J) : V = V.next = L, c |= U;
        if (u = u.next, u === null) {
          if (u = n.shared.pending, u === null) break;
          L = u, u = L.next, L.next = null, n.lastBaseUpdate = L, n.shared.pending = null;
        }
      } while (!0);
      V === null && (v = J), n.baseState = v, n.firstBaseUpdate = D, n.lastBaseUpdate = V, s === null && (n.shared.lanes = 0), Ha |= c, e.lanes = c, e.memoizedState = J;
    }
  }
  function Eo(e, t) {
    if (typeof e != "function") throw Error(p(191, e));
    e.call(t);
  }
  function Ao(e, t) {
    var a = e.callbacks;
    if (a !== null) for (e.callbacks = null, e = 0; e < a.length; e++) Eo(a[e], t);
  }
  var Xl = o(null), Bn = o(0);
  function To(e, t) {
    e = Na, R(Bn, e), R(Xl, t), Na = e | t.baseLanes;
  }
  function kc() {
    R(Bn, Na), R(Xl, Xl.current);
  }
  function _c() {
    Na = Bn.current, j(Xl), j(Bn);
  }
  var Lt = o(null), Jt = null;
  function Ua(e) {
    var t = e.alternate;
    R(ct, ct.current & 1), R(Lt, e), Jt === null && (t === null || Xl.current !== null || t.memoizedState !== null) && (Jt = e);
  }
  function Cc(e) {
    R(ct, ct.current), R(Lt, e), Jt === null && (Jt = e);
  }
  function Mo(e) {
    e.tag === 22 ? (R(ct, ct.current), R(Lt, e), Jt === null && (Jt = e)) : Ra(e);
  }
  function Ra() {
    R(ct, ct.current), R(Lt, Lt.current);
  }
  function qt(e) {
    j(Lt), Jt === e && (Jt = null), j(ct);
  }
  var ct = o(0);
  function Gn(e) {
    for (var t = e; t !== null; ) {
      if (t.tag === 13) {
        var a = t.memoizedState;
        if (a !== null && (a = a.dehydrated, a === null || Or(a) || Dr(a))) return t;
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
  var ma = 0, Ee = null, Ie = null, ut = null, Yn = !1, Zl = !1, hl = !1, Vn = 0, Ui = 0, Kl = null, M0 = 0;
  function it() {
    throw Error(p(321));
  }
  function Ec(e, t) {
    if (t === null) return !1;
    for (var a = 0; a < t.length && a < e.length; a++) if (!Ut(e[a], t[a])) return !1;
    return !0;
  }
  function Ac(e, t, a, i, n, s) {
    return ma = s, Ee = t, t.memoizedState = null, t.updateQueue = null, t.lanes = 0, Y.H = e === null || e.memoizedState === null ? mu : Xc, hl = !1, s = a(i, n), hl = !1, Zl && (s = Do(t, a, i, n)), Oo(e), s;
  }
  function Oo(e) {
    Y.H = qi;
    var t = Ie !== null && Ie.next !== null;
    if (ma = 0, ut = Ie = Ee = null, Yn = !1, Ui = 0, Kl = null, t) throw Error(p(300));
    e === null || pt || (e = e.dependencies, e !== null && On(e) && (pt = !0));
  }
  function Do(e, t, a, i) {
    Ee = e;
    var n = 0;
    do {
      if (Zl && (Kl = null), Ui = 0, Zl = !1, 25 <= n) throw Error(p(301));
      if (n += 1, ut = Ie = null, e.updateQueue != null) {
        var s = e.updateQueue;
        s.lastEffect = null, s.events = null, s.stores = null, s.memoCache != null && (s.memoCache.index = 0);
      }
      Y.H = xu, s = t(a, i);
    } while (Zl);
    return s;
  }
  function O0() {
    var e = Y.H, t = e.useState()[0];
    return t = typeof t.then == "function" ? Ri(t) : t, e = e.useState()[0], (Ie !== null ? Ie.memoizedState : null) !== e && (Ee.flags |= 1024), t;
  }
  function Tc() {
    var e = Vn !== 0;
    return Vn = 0, e;
  }
  function Mc(e, t, a) {
    t.updateQueue = e.updateQueue, t.flags &= -2053, e.lanes &= ~a;
  }
  function Oc(e) {
    if (Yn) {
      for (e = e.memoizedState; e !== null; ) {
        var t = e.queue;
        t !== null && (t.pending = null), e = e.next;
      }
      Yn = !1;
    }
    ma = 0, ut = Ie = Ee = null, Zl = !1, Ui = Vn = 0, Kl = null;
  }
  function zt() {
    var e = {
      memoizedState: null,
      baseState: null,
      baseQueue: null,
      queue: null,
      next: null
    };
    return ut === null ? Ee.memoizedState = ut = e : ut = ut.next = e, ut;
  }
  function rt() {
    if (Ie === null) {
      var e = Ee.alternate;
      e = e !== null ? e.memoizedState : null;
    } else e = Ie.next;
    var t = ut === null ? Ee.memoizedState : ut.next;
    if (t !== null) ut = t, Ie = e;
    else {
      if (e === null)
        throw Ee.alternate === null ? Error(p(467)) : Error(p(310));
      Ie = e, e = {
        memoizedState: Ie.memoizedState,
        baseState: Ie.baseState,
        baseQueue: Ie.baseQueue,
        queue: Ie.queue,
        next: null
      }, ut === null ? Ee.memoizedState = ut = e : ut = ut.next = e;
    }
    return ut;
  }
  function Qn() {
    return {
      lastEffect: null,
      events: null,
      stores: null,
      memoCache: null
    };
  }
  function Ri(e) {
    var t = Ui;
    return Ui += 1, Kl === null && (Kl = []), e = wo(Kl, e, t), t = Ee, (ut === null ? t.memoizedState : ut.next) === null && (t = t.alternate, Y.H = t === null || t.memoizedState === null ? mu : Xc), e;
  }
  function Xn(e) {
    if (e !== null && typeof e == "object") {
      if (typeof e.then == "function") return Ri(e);
      if (e.$$typeof === H) return yt(e);
    }
    throw Error(p(438, String(e)));
  }
  function Dc(e) {
    var t = null, a = Ee.updateQueue;
    if (a !== null && (t = a.memoCache), t == null) {
      var i = Ee.alternate;
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
    }, a === null && (a = Qn(), Ee.updateQueue = a), a.memoCache = t, a = t.data[t.index], a === void 0) for (a = t.data[t.index] = Array(e), i = 0; i < e; i++) a[i] = ee;
    return t.index++, a;
  }
  function xa(e, t) {
    return typeof t == "function" ? t(e) : t;
  }
  function Zn(e) {
    return Uc(rt(), Ie, e);
  }
  function Uc(e, t, a) {
    var i = e.queue;
    if (i === null) throw Error(p(311));
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
      var u = c = null, v = null, D = t, V = !1;
      do {
        var J = D.lane & -536870913;
        if (J !== D.lane ? (Ue & J) === J : (ma & J) === J) {
          var U = D.revertLane;
          if (U === 0) v !== null && (v = v.next = {
            lane: 0,
            revertLane: 0,
            gesture: null,
            action: D.action,
            hasEagerState: D.hasEagerState,
            eagerState: D.eagerState,
            next: null
          }), J === Gl && (V = !0);
          else if ((ma & U) === U) {
            D = D.next, U === Gl && (V = !0);
            continue;
          } else J = {
            lane: 0,
            revertLane: D.revertLane,
            gesture: null,
            action: D.action,
            hasEagerState: D.hasEagerState,
            eagerState: D.eagerState,
            next: null
          }, v === null ? (u = v = J, c = s) : v = v.next = J, Ee.lanes |= U, Ha |= U;
          J = D.action, hl && a(s, J), s = D.hasEagerState ? D.eagerState : a(s, J);
        } else U = {
          lane: J,
          revertLane: D.revertLane,
          gesture: D.gesture,
          action: D.action,
          hasEagerState: D.hasEagerState,
          eagerState: D.eagerState,
          next: null
        }, v === null ? (u = v = U, c = s) : v = v.next = U, Ee.lanes |= J, Ha |= J;
        D = D.next;
      } while (D !== null && D !== t);
      if (v === null ? c = s : v.next = u, !Ut(s, e.memoizedState) && (pt = !0, V && (a = Yl, a !== null))) throw a;
      e.memoizedState = s, e.baseState = c, e.baseQueue = v, i.lastRenderedState = s;
    }
    return n === null && (i.lanes = 0), [e.memoizedState, i.dispatch];
  }
  function Rc(e) {
    var t = rt(), a = t.queue;
    if (a === null) throw Error(p(311));
    a.lastRenderedReducer = e;
    var i = a.dispatch, n = a.pending, s = t.memoizedState;
    if (n !== null) {
      a.pending = null;
      var c = n = n.next;
      do
        s = e(s, c.action), c = c.next;
      while (c !== n);
      Ut(s, t.memoizedState) || (pt = !0), t.memoizedState = s, t.baseQueue === null && (t.baseState = s), a.lastRenderedState = s;
    }
    return [s, i];
  }
  function Uo(e, t, a) {
    var i = Ee, n = rt(), s = Le;
    if (s) {
      if (a === void 0) throw Error(p(407));
      a = a();
    } else a = t();
    var c = !Ut((Ie || n).memoizedState, a);
    if (c && (n.memoizedState = a, pt = !0), n = n.queue, Hc(qo.bind(null, i, n, e), [e]), n.getSnapshot !== t || c || ut !== null && ut.memoizedState.tag & 1) {
      if (i.flags |= 2048, Jl(9, { destroy: void 0 }, Lo.bind(null, i, n, a, t), null), Pe === null) throw Error(p(349));
      s || (ma & 127) !== 0 || Ro(i, t, a);
    }
    return a;
  }
  function Ro(e, t, a) {
    e.flags |= 16384, e = {
      getSnapshot: t,
      value: a
    }, t = Ee.updateQueue, t === null ? (t = Qn(), Ee.updateQueue = t, t.stores = [e]) : (a = t.stores, a === null ? t.stores = [e] : a.push(e));
  }
  function Lo(e, t, a, i) {
    t.value = a, t.getSnapshot = i, Ho(t) && Bo(e);
  }
  function qo(e, t, a) {
    return a(function() {
      Ho(t) && Bo(e);
    });
  }
  function Ho(e) {
    var t = e.getSnapshot;
    e = e.value;
    try {
      var a = t();
      return !Ut(e, a);
    } catch {
      return !0;
    }
  }
  function Bo(e) {
    var t = ll(e, 2);
    t !== null && Ot(t, e, 2);
  }
  function Lc(e) {
    var t = zt();
    if (typeof e == "function") {
      var a = e;
      if (e = a(), hl) {
        wt(!0);
        try {
          a();
        } finally {
          wt(!1);
        }
      }
    }
    return t.memoizedState = t.baseState = e, t.queue = {
      pending: null,
      lanes: 0,
      dispatch: null,
      lastRenderedReducer: xa,
      lastRenderedState: e
    }, t;
  }
  function Go(e, t, a, i) {
    return e.baseState = a, Uc(e, Ie, typeof i == "function" ? i : xa);
  }
  function D0(e, t, a, i, n) {
    if (In(e)) throw Error(p(485));
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
      Y.T !== null ? a(!0) : s.isTransition = !1, i(s), a = t.pending, a === null ? (s.next = t.pending = s, Yo(t, s)) : (s.next = a.next, t.pending = a.next = s);
    }
  }
  function Yo(e, t) {
    var a = t.action, i = t.payload, n = e.state;
    if (t.isTransition) {
      var s = Y.T, c = {};
      Y.T = c;
      try {
        var u = a(n, i), v = Y.S;
        v !== null && v(c, u), Vo(e, t, u);
      } catch (D) {
        qc(e, t, D);
      } finally {
        s !== null && c.types !== null && (s.types = c.types), Y.T = s;
      }
    } else try {
      s = a(n, i), Vo(e, t, s);
    } catch (D) {
      qc(e, t, D);
    }
  }
  function Vo(e, t, a) {
    a !== null && typeof a == "object" && typeof a.then == "function" ? a.then(function(i) {
      Qo(e, t, i);
    }, function(i) {
      return qc(e, t, i);
    }) : Qo(e, t, a);
  }
  function Qo(e, t, a) {
    t.status = "fulfilled", t.value = a, Xo(t), e.state = a, t = e.pending, t !== null && (a = t.next, a === t ? e.pending = null : (a = a.next, t.next = a, Yo(e, a)));
  }
  function qc(e, t, a) {
    var i = e.pending;
    if (e.pending = null, i !== null) {
      i = i.next;
      do
        t.status = "rejected", t.reason = a, Xo(t), t = t.next;
      while (t !== i);
    }
    e.action = null;
  }
  function Xo(e) {
    e = e.listeners;
    for (var t = 0; t < e.length; t++) (0, e[t])();
  }
  function Zo(e, t) {
    return t;
  }
  function Ko(e, t) {
    if (Le) {
      var a = Pe.formState;
      if (a !== null) {
        e: {
          var i = Ee;
          if (Le) {
            if (et) {
              t: {
                for (var n = et, s = Kt; n.nodeType !== 8; ) {
                  if (!s) {
                    n = null;
                    break t;
                  }
                  if (n = $t(n.nextSibling), n === null) {
                    n = null;
                    break t;
                  }
                }
                s = n.data, n = s === "F!" || s === "F" ? n : null;
              }
              if (n) {
                et = $t(n.nextSibling), i = n.data === "F!";
                break e;
              }
            }
            Ma(i);
          }
          i = !1;
        }
        i && (t = a[0]);
      }
    }
    return a = zt(), a.memoizedState = a.baseState = t, i = {
      pending: null,
      lanes: 0,
      dispatch: null,
      lastRenderedReducer: Zo,
      lastRenderedState: t
    }, a.queue = i, a = pu.bind(null, Ee, i), i.dispatch = a, i = Lc(!1), s = Qc.bind(null, Ee, !1, i.queue), i = zt(), n = {
      state: t,
      dispatch: null,
      action: e,
      pending: null
    }, i.queue = n, a = D0.bind(null, Ee, n, s, a), n.dispatch = a, i.memoizedState = e, [
      t,
      a,
      !1
    ];
  }
  function Jo(e) {
    return Io(rt(), Ie, e);
  }
  function Io(e, t, a) {
    if (t = Uc(e, t, Zo)[0], e = Zn(xa)[0], typeof t == "object" && t !== null && typeof t.then == "function") try {
      var i = Ri(t);
    } catch (c) {
      throw c === Vl ? Rn : c;
    }
    else i = t;
    t = rt();
    var n = t.queue, s = n.dispatch;
    return a !== t.memoizedState && (Ee.flags |= 2048, Jl(9, { destroy: void 0 }, U0.bind(null, n, a), null)), [
      i,
      s,
      e
    ];
  }
  function U0(e, t) {
    e.action = t;
  }
  function $o(e) {
    var t = rt(), a = Ie;
    if (a !== null) return Io(t, a, e);
    rt(), t = t.memoizedState, a = rt();
    var i = a.queue.dispatch;
    return a.memoizedState = e, [
      t,
      i,
      !1
    ];
  }
  function Jl(e, t, a, i) {
    return e = {
      tag: e,
      create: a,
      deps: i,
      inst: t,
      next: null
    }, t = Ee.updateQueue, t === null && (t = Qn(), Ee.updateQueue = t), a = t.lastEffect, a === null ? t.lastEffect = e.next = e : (i = a.next, a.next = e, e.next = i, t.lastEffect = e), e;
  }
  function Wo() {
    return rt().memoizedState;
  }
  function Kn(e, t, a, i) {
    var n = zt();
    Ee.flags |= e, n.memoizedState = Jl(1 | t, { destroy: void 0 }, a, i === void 0 ? null : i);
  }
  function Jn(e, t, a, i) {
    var n = rt();
    i = i === void 0 ? null : i;
    var s = n.memoizedState.inst;
    Ie !== null && i !== null && Ec(i, Ie.memoizedState.deps) ? n.memoizedState = Jl(t, s, a, i) : (Ee.flags |= e, n.memoizedState = Jl(1 | t, s, a, i));
  }
  function Fo(e, t) {
    Kn(8390656, 8, e, t);
  }
  function Hc(e, t) {
    Jn(2048, 8, e, t);
  }
  function R0(e) {
    Ee.flags |= 4;
    var t = Ee.updateQueue;
    if (t === null) t = Qn(), Ee.updateQueue = t, t.events = [e];
    else {
      var a = t.events;
      a === null ? t.events = [e] : a.push(e);
    }
  }
  function Po(e) {
    var t = rt().memoizedState;
    return R0({
      ref: t,
      nextImpl: e
    }), function() {
      if ((Qe & 2) !== 0) throw Error(p(440));
      return t.impl.apply(void 0, arguments);
    };
  }
  function eu(e, t) {
    return Jn(4, 2, e, t);
  }
  function tu(e, t) {
    return Jn(4, 4, e, t);
  }
  function au(e, t) {
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
  function lu(e, t, a) {
    a = a != null ? a.concat([e]) : null, Jn(4, 4, au.bind(null, t, e), a);
  }
  function Bc() {
  }
  function iu(e, t) {
    var a = rt();
    t = t === void 0 ? null : t;
    var i = a.memoizedState;
    return t !== null && Ec(t, i[1]) ? i[0] : (a.memoizedState = [e, t], e);
  }
  function nu(e, t) {
    var a = rt();
    t = t === void 0 ? null : t;
    var i = a.memoizedState;
    if (t !== null && Ec(t, i[1])) return i[0];
    if (i = e(), hl) {
      wt(!0);
      try {
        e();
      } finally {
        wt(!1);
      }
    }
    return a.memoizedState = [i, t], i;
  }
  function Gc(e, t, a) {
    return a === void 0 || (ma & 1073741824) !== 0 && (Ue & 261930) === 0 ? e.memoizedState = t : (e.memoizedState = a, e = lp(), Ee.lanes |= e, Ha |= e, a);
  }
  function su(e, t, a, i) {
    return Ut(a, t) ? a : Xl.current !== null ? (e = Gc(e, a, i), Ut(e, t) || (pt = !0), e) : (ma & 42) === 0 || (ma & 1073741824) !== 0 && (Ue & 261930) === 0 ? (pt = !0, e.memoizedState = a) : (e = lp(), Ee.lanes |= e, Ha |= e, t);
  }
  function cu(e, t, a, i, n) {
    var s = Q.p;
    Q.p = s !== 0 && 8 > s ? s : 8;
    var c = Y.T, u = {};
    Y.T = u, Qc(e, !1, t, a);
    try {
      var v = n(), D = Y.S;
      D !== null && D(u, v), v !== null && typeof v == "object" && typeof v.then == "function" ? Li(e, t, T0(v, i), It(e)) : Li(e, t, i, It(e));
    } catch (V) {
      Li(e, t, {
        then: function() {
        },
        status: "rejected",
        reason: V
      }, It());
    } finally {
      Q.p = s, c !== null && u.types !== null && (c.types = u.types), Y.T = c;
    }
  }
  function L0() {
  }
  function Yc(e, t, a, i) {
    if (e.tag !== 5) throw Error(p(476));
    var n = ru(e).queue;
    cu(e, n, t, se, a === null ? L0 : function() {
      return du(e), a(i);
    });
  }
  function ru(e) {
    var t = e.memoizedState;
    if (t !== null) return t;
    t = {
      memoizedState: se,
      baseState: se,
      baseQueue: null,
      queue: {
        pending: null,
        lanes: 0,
        dispatch: null,
        lastRenderedReducer: xa,
        lastRenderedState: se
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
        lastRenderedReducer: xa,
        lastRenderedState: a
      },
      next: null
    }, e.memoizedState = t, e = e.alternate, e !== null && (e.memoizedState = t), t;
  }
  function du(e) {
    var t = ru(e);
    t.next === null && (t = e.alternate.memoizedState), Li(e, t.next.queue, {}, It());
  }
  function Vc() {
    return yt(en);
  }
  function ou() {
    return rt().memoizedState;
  }
  function uu() {
    return rt().memoizedState;
  }
  function q0(e) {
    for (var t = e.return; t !== null; ) {
      switch (t.tag) {
        case 24:
        case 3:
          var a = It();
          e = pl(a);
          var i = fl(t, e, a);
          i !== null && (Ot(i, t, a), Mi(i, t, a)), t = { cache: bc() }, e.payload = t;
          return;
      }
      t = t.return;
    }
  }
  function H0(e, t, a) {
    var i = It();
    a = {
      lane: i,
      revertLane: 0,
      gesture: null,
      action: a,
      hasEagerState: !1,
      eagerState: null,
      next: null
    }, In(e) ? fu(t, a) : (a = cc(e, t, a, i), a !== null && (Ot(a, e, i), hu(a, t, i)));
  }
  function pu(e, t, a) {
    Li(e, t, a, It());
  }
  function Li(e, t, a, i) {
    var n = {
      lane: i,
      revertLane: 0,
      gesture: null,
      action: a,
      hasEagerState: !1,
      eagerState: null,
      next: null
    };
    if (In(e)) fu(t, n);
    else {
      var s = e.alternate;
      if (e.lanes === 0 && (s === null || s.lanes === 0) && (s = t.lastRenderedReducer, s !== null)) try {
        var c = t.lastRenderedState, u = s(c, a);
        if (n.hasEagerState = !0, n.eagerState = u, Ut(u, c)) return En(e, t, n, 0), Pe === null && Cn(), !1;
      } catch {
      }
      if (a = cc(e, t, n, i), a !== null) return Ot(a, e, i), hu(a, t, i), !0;
    }
    return !1;
  }
  function Qc(e, t, a, i) {
    if (i = {
      lane: 2,
      revertLane: Sr(),
      gesture: null,
      action: i,
      hasEagerState: !1,
      eagerState: null,
      next: null
    }, In(e)) {
      if (t) throw Error(p(479));
    } else t = cc(e, a, i, 2), t !== null && Ot(t, e, 2);
  }
  function In(e) {
    var t = e.alternate;
    return e === Ee || t !== null && t === Ee;
  }
  function fu(e, t) {
    Zl = Yn = !0;
    var a = e.pending;
    a === null ? t.next = t : (t.next = a.next, a.next = t), e.pending = t;
  }
  function hu(e, t, a) {
    if ((a & 4194048) !== 0) {
      var i = t.lanes;
      i &= e.pendingLanes, a |= i, t.lanes = a, gd(e, a);
    }
  }
  var qi = {
    readContext: yt,
    use: Xn,
    useCallback: it,
    useContext: it,
    useEffect: it,
    useImperativeHandle: it,
    useLayoutEffect: it,
    useInsertionEffect: it,
    useMemo: it,
    useReducer: it,
    useRef: it,
    useState: it,
    useDebugValue: it,
    useDeferredValue: it,
    useTransition: it,
    useSyncExternalStore: it,
    useId: it,
    useHostTransitionStatus: it,
    useFormState: it,
    useActionState: it,
    useOptimistic: it,
    useMemoCache: it,
    useCacheRefresh: it
  };
  qi.useEffectEvent = it;
  var mu = {
    readContext: yt,
    use: Xn,
    useCallback: function(e, t) {
      return zt().memoizedState = [e, t === void 0 ? null : t], e;
    },
    useContext: yt,
    useEffect: Fo,
    useImperativeHandle: function(e, t, a) {
      a = a != null ? a.concat([e]) : null, Kn(4194308, 4, au.bind(null, t, e), a);
    },
    useLayoutEffect: function(e, t) {
      return Kn(4194308, 4, e, t);
    },
    useInsertionEffect: function(e, t) {
      Kn(4, 2, e, t);
    },
    useMemo: function(e, t) {
      var a = zt();
      t = t === void 0 ? null : t;
      var i = e();
      if (hl) {
        wt(!0);
        try {
          e();
        } finally {
          wt(!1);
        }
      }
      return a.memoizedState = [i, t], i;
    },
    useReducer: function(e, t, a) {
      var i = zt();
      if (a !== void 0) {
        var n = a(t);
        if (hl) {
          wt(!0);
          try {
            a(t);
          } finally {
            wt(!1);
          }
        }
      } else n = t;
      return i.memoizedState = i.baseState = n, e = {
        pending: null,
        lanes: 0,
        dispatch: null,
        lastRenderedReducer: e,
        lastRenderedState: n
      }, i.queue = e, e = e.dispatch = H0.bind(null, Ee, e), [i.memoizedState, e];
    },
    useRef: function(e) {
      var t = zt();
      return e = { current: e }, t.memoizedState = e;
    },
    useState: function(e) {
      e = Lc(e);
      var t = e.queue, a = pu.bind(null, Ee, t);
      return t.dispatch = a, [e.memoizedState, a];
    },
    useDebugValue: Bc,
    useDeferredValue: function(e, t) {
      return Gc(zt(), e, t);
    },
    useTransition: function() {
      var e = Lc(!1);
      return e = cu.bind(null, Ee, e.queue, !0, !1), zt().memoizedState = e, [!1, e];
    },
    useSyncExternalStore: function(e, t, a) {
      var i = Ee, n = zt();
      if (Le) {
        if (a === void 0) throw Error(p(407));
        a = a();
      } else {
        if (a = t(), Pe === null) throw Error(p(349));
        (Ue & 127) !== 0 || Ro(i, t, a);
      }
      n.memoizedState = a;
      var s = {
        value: a,
        getSnapshot: t
      };
      return n.queue = s, Fo(qo.bind(null, i, s, e), [e]), i.flags |= 2048, Jl(9, { destroy: void 0 }, Lo.bind(null, i, s, a, t), null), a;
    },
    useId: function() {
      var e = zt(), t = Pe.identifierPrefix;
      if (Le) {
        var a = na, i = ia;
        a = (i & ~(1 << 32 - ht(i) - 1)).toString(32) + a, t = "_" + t + "R_" + a, a = Vn++, 0 < a && (t += "H" + a.toString(32)), t += "_";
      } else a = M0++, t = "_" + t + "r_" + a.toString(32) + "_";
      return e.memoizedState = t;
    },
    useHostTransitionStatus: Vc,
    useFormState: Ko,
    useActionState: Ko,
    useOptimistic: function(e) {
      var t = zt();
      t.memoizedState = t.baseState = e;
      var a = {
        pending: null,
        lanes: 0,
        dispatch: null,
        lastRenderedReducer: null,
        lastRenderedState: null
      };
      return t.queue = a, t = Qc.bind(null, Ee, !0, a), a.dispatch = t, [e, t];
    },
    useMemoCache: Dc,
    useCacheRefresh: function() {
      return zt().memoizedState = q0.bind(null, Ee);
    },
    useEffectEvent: function(e) {
      var t = zt(), a = { impl: e };
      return t.memoizedState = a, function() {
        if ((Qe & 2) !== 0) throw Error(p(440));
        return a.impl.apply(void 0, arguments);
      };
    }
  }, Xc = {
    readContext: yt,
    use: Xn,
    useCallback: iu,
    useContext: yt,
    useEffect: Hc,
    useImperativeHandle: lu,
    useInsertionEffect: eu,
    useLayoutEffect: tu,
    useMemo: nu,
    useReducer: Zn,
    useRef: Wo,
    useState: function() {
      return Zn(xa);
    },
    useDebugValue: Bc,
    useDeferredValue: function(e, t) {
      return su(rt(), Ie.memoizedState, e, t);
    },
    useTransition: function() {
      var e = Zn(xa)[0], t = rt().memoizedState;
      return [typeof e == "boolean" ? e : Ri(e), t];
    },
    useSyncExternalStore: Uo,
    useId: ou,
    useHostTransitionStatus: Vc,
    useFormState: Jo,
    useActionState: Jo,
    useOptimistic: function(e, t) {
      return Go(rt(), Ie, e, t);
    },
    useMemoCache: Dc,
    useCacheRefresh: uu
  };
  Xc.useEffectEvent = Po;
  var xu = {
    readContext: yt,
    use: Xn,
    useCallback: iu,
    useContext: yt,
    useEffect: Hc,
    useImperativeHandle: lu,
    useInsertionEffect: eu,
    useLayoutEffect: tu,
    useMemo: nu,
    useReducer: Rc,
    useRef: Wo,
    useState: function() {
      return Rc(xa);
    },
    useDebugValue: Bc,
    useDeferredValue: function(e, t) {
      var a = rt();
      return Ie === null ? Gc(a, e, t) : su(a, Ie.memoizedState, e, t);
    },
    useTransition: function() {
      var e = Rc(xa)[0], t = rt().memoizedState;
      return [typeof e == "boolean" ? e : Ri(e), t];
    },
    useSyncExternalStore: Uo,
    useId: ou,
    useHostTransitionStatus: Vc,
    useFormState: $o,
    useActionState: $o,
    useOptimistic: function(e, t) {
      var a = rt();
      return Ie !== null ? Go(a, Ie, e, t) : (a.baseState = e, [e, a.queue.dispatch]);
    },
    useMemoCache: Dc,
    useCacheRefresh: uu
  };
  xu.useEffectEvent = Po;
  function Zc(e, t, a, i) {
    t = e.memoizedState, a = a(i, t), a = a == null ? t : z({}, t, a), e.memoizedState = a, e.lanes === 0 && (e.updateQueue.baseState = a);
  }
  var Kc = {
    enqueueSetState: function(e, t, a) {
      e = e._reactInternals;
      var i = It(), n = pl(i);
      n.payload = t, a != null && (n.callback = a), t = fl(e, n, i), t !== null && (Ot(t, e, i), Mi(t, e, i));
    },
    enqueueReplaceState: function(e, t, a) {
      e = e._reactInternals;
      var i = It(), n = pl(i);
      n.tag = 1, n.payload = t, a != null && (n.callback = a), t = fl(e, n, i), t !== null && (Ot(t, e, i), Mi(t, e, i));
    },
    enqueueForceUpdate: function(e, t) {
      e = e._reactInternals;
      var a = It(), i = pl(a);
      i.tag = 2, t != null && (i.callback = t), t = fl(e, i, a), t !== null && (Ot(t, e, a), Mi(t, e, a));
    }
  };
  function gu(e, t, a, i, n, s, c) {
    return e = e.stateNode, typeof e.shouldComponentUpdate == "function" ? e.shouldComponentUpdate(i, s, c) : t.prototype && t.prototype.isPureReactComponent ? !wi(a, i) || !wi(n, s) : !0;
  }
  function bu(e, t, a, i) {
    e = t.state, typeof t.componentWillReceiveProps == "function" && t.componentWillReceiveProps(a, i), typeof t.UNSAFE_componentWillReceiveProps == "function" && t.UNSAFE_componentWillReceiveProps(a, i), t.state !== e && Kc.enqueueReplaceState(t, t.state, null);
  }
  function ml(e, t) {
    var a = t;
    if ("ref" in t) {
      a = {};
      for (var i in t) i !== "ref" && (a[i] = t[i]);
    }
    if (e = e.defaultProps) {
      a === t && (a = z({}, a));
      for (var n in e) a[n] === void 0 && (a[n] = e[n]);
    }
    return a;
  }
  function B0(e) {
    _n(e);
  }
  function G0(e) {
    console.error(e);
  }
  function Y0(e) {
    _n(e);
  }
  function $n(e, t) {
    try {
      var a = e.onUncaughtError;
      a(t.value, { componentStack: t.stack });
    } catch (i) {
      setTimeout(function() {
        throw i;
      });
    }
  }
  function vu(e, t, a) {
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
  function Jc(e, t, a) {
    return a = pl(a), a.tag = 3, a.payload = { element: null }, a.callback = function() {
      $n(e, t);
    }, a;
  }
  function ju(e) {
    return e = pl(e), e.tag = 3, e;
  }
  function yu(e, t, a, i) {
    var n = a.type.getDerivedStateFromError;
    if (typeof n == "function") {
      var s = i.value;
      e.payload = function() {
        return n(s);
      }, e.callback = function() {
        vu(t, a, i);
      };
    }
    var c = a.stateNode;
    c !== null && typeof c.componentDidCatch == "function" && (e.callback = function() {
      vu(t, a, i), typeof n != "function" && (Ba === null ? Ba = /* @__PURE__ */ new Set([this]) : Ba.add(this));
      var u = i.stack;
      this.componentDidCatch(i.value, { componentStack: u !== null ? u : "" });
    });
  }
  function V0(e, t, a, i, n) {
    if (a.flags |= 32768, i !== null && typeof i == "object" && typeof i.then == "function") {
      if (t = a.alternate, t !== null && Bl(t, a, n, !0), a = Lt.current, a !== null) {
        switch (a.tag) {
          case 31:
          case 13:
            return Jt === null ? rs() : a.alternate === null && nt === 0 && (nt = 3), a.flags &= -257, a.flags |= 65536, a.lanes = n, i === Ln ? a.flags |= 16384 : (t = a.updateQueue, t === null ? a.updateQueue = /* @__PURE__ */ new Set([i]) : t.add(i), vr(e, i, n)), !1;
          case 22:
            return a.flags |= 65536, i === Ln ? a.flags |= 16384 : (t = a.updateQueue, t === null ? (t = {
              transitions: null,
              markerInstances: null,
              retryQueue: /* @__PURE__ */ new Set([i])
            }, a.updateQueue = t) : (a = t.retryQueue, a === null ? t.retryQueue = /* @__PURE__ */ new Set([i]) : a.add(i)), vr(e, i, n)), !1;
        }
        throw Error(p(435, a.tag));
      }
      return vr(e, i, n), rs(), !1;
    }
    if (Le) return t = Lt.current, t !== null ? ((t.flags & 65536) === 0 && (t.flags |= 256), t.flags |= 65536, t.lanes = n, i !== fc && (e = Error(p(422), { cause: i }), _i(Qt(e, a)))) : (i !== fc && (t = Error(p(423), { cause: i }), _i(Qt(t, a))), e = e.current.alternate, e.flags |= 65536, n &= -n, e.lanes |= n, i = Qt(i, a), n = Jc(e.stateNode, i, n), wc(e, n), nt !== 4 && (nt = 2)), !1;
    var s = Error(p(520), { cause: i });
    if (s = Qt(s, a), Zi === null ? Zi = [s] : Zi.push(s), nt !== 4 && (nt = 2), t === null) return !0;
    i = Qt(i, a), a = t;
    do {
      switch (a.tag) {
        case 3:
          return a.flags |= 65536, e = n & -n, a.lanes |= e, e = Jc(a.stateNode, i, e), wc(a, e), !1;
        case 1:
          if (t = a.type, s = a.stateNode, (a.flags & 128) === 0 && (typeof t.getDerivedStateFromError == "function" || s !== null && typeof s.componentDidCatch == "function" && (Ba === null || !Ba.has(s)))) return a.flags |= 65536, n &= -n, a.lanes |= n, n = ju(n), yu(n, e, a, i), wc(a, n), !1;
      }
      a = a.return;
    } while (a !== null);
    return !1;
  }
  var Ic = Error(p(461)), pt = !1;
  function St(e, t, a, i) {
    t.child = e === null ? Co(t, null, a, i) : ul(t, e.child, a, i);
  }
  function Su(e, t, a, i, n) {
    a = a.render;
    var s = t.ref;
    if ("ref" in i) {
      var c = {};
      for (var u in i) u !== "ref" && (c[u] = i[u]);
    } else c = i;
    return cl(t), i = Ac(e, t, a, c, s, n), u = Tc(), e !== null && !pt ? (Mc(e, t, n), ga(e, t, n)) : (Le && u && uc(t), t.flags |= 1, St(e, t, i, n), t.child);
  }
  function Nu(e, t, a, i, n) {
    if (e === null) {
      var s = a.type;
      return typeof s == "function" && !rc(s) && s.defaultProps === void 0 && a.compare === null ? (t.tag = 15, t.type = s, wu(e, t, s, i, n)) : (e = Tn(a.type, null, i, t, t.mode, n), e.ref = t.ref, e.return = t, t.child = e);
    }
    if (s = e.child, !lr(e, n)) {
      var c = s.memoizedProps;
      if (a = a.compare, a = a !== null ? a : wi, a(c, i) && e.ref === t.ref) return ga(e, t, n);
    }
    return t.flags |= 1, e = ua(s, i), e.ref = t.ref, e.return = t, t.child = e;
  }
  function wu(e, t, a, i, n) {
    if (e !== null) {
      var s = e.memoizedProps;
      if (wi(s, i) && e.ref === t.ref) if (pt = !1, t.pendingProps = i = s, lr(e, n)) (e.flags & 131072) !== 0 && (pt = !0);
      else return t.lanes = e.lanes, ga(e, t, n);
    }
    return $c(e, t, a, i, n);
  }
  function zu(e, t, a, i) {
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
        return ku(e, t, s, a, i);
      }
      if ((a & 536870912) !== 0) t.memoizedState = {
        baseLanes: 0,
        cachePool: null
      }, e !== null && Un(t, s !== null ? s.cachePool : null), s !== null ? To(t, s) : kc(), Mo(t);
      else return i = t.lanes = 536870912, ku(e, t, s !== null ? s.baseLanes | a : a, a, i);
    } else s !== null ? (Un(t, s.cachePool), To(t, s), Ra(t), t.memoizedState = null) : (e !== null && Un(t, null), kc(), Ra(t));
    return St(e, t, n, a), t.child;
  }
  function Hi(e, t) {
    return e !== null && e.tag === 22 || t.stateNode !== null || (t.stateNode = {
      _visibility: 1,
      _pendingMarkers: null,
      _retryCache: null,
      _transitions: null
    }), t.sibling;
  }
  function ku(e, t, a, i, n) {
    var s = jc();
    return s = s === null ? null : {
      parent: ot._currentValue,
      pool: s
    }, t.memoizedState = {
      baseLanes: a,
      cachePool: s
    }, e !== null && Un(t, null), kc(), Mo(t), e !== null && Bl(e, t, i, !0), t.childLanes = n, null;
  }
  function Wn(e, t) {
    return t = Pn({
      mode: t.mode,
      children: t.children
    }, e.mode), t.ref = e.ref, e.child = t, t.return = e, t;
  }
  function _u(e, t, a) {
    return ul(t, e.child, null, a), e = Wn(t, t.pendingProps), e.flags |= 2, qt(t), t.memoizedState = null, e;
  }
  function Q0(e, t, a) {
    var i = t.pendingProps, n = (t.flags & 128) !== 0;
    if (t.flags &= -129, e === null) {
      if (Le) {
        if (i.mode === "hidden") return e = Wn(t, i), t.lanes = 536870912, Hi(null, e);
        if (Cc(t), (e = et) ? (e = Bp(e, Kt), e = e !== null && e.data === "&" ? e : null, e !== null && (t.memoizedState = {
          dehydrated: e,
          treeContext: Aa !== null ? {
            id: ia,
            overflow: na
          } : null,
          retryLane: 536870912,
          hydrationErrors: null
        }, a = fo(e), a.return = t, t.child = a, jt = t, et = null)) : e = null, e === null) throw Ma(t);
        return t.lanes = 536870912, null;
      }
      return Wn(t, i);
    }
    var s = e.memoizedState;
    if (s !== null) {
      var c = s.dehydrated;
      if (Cc(t), n) if (t.flags & 256) t.flags &= -257, t = _u(e, t, a);
      else if (t.memoizedState !== null) t.child = e.child, t.flags |= 128, t = null;
      else throw Error(p(558));
      else if (pt || Bl(e, t, a, !1), n = (a & e.childLanes) !== 0, pt || n) {
        if (i = Pe, i !== null && (c = bd(i, a), c !== 0 && c !== s.retryLane)) throw s.retryLane = c, ll(e, c), Ot(i, e, c), Ic;
        rs(), t = _u(e, t, a);
      } else e = s.treeContext, et = $t(c.nextSibling), jt = t, Le = !0, Ta = null, Kt = !1, e !== null && xo(t, e), t = Wn(t, i), t.flags |= 4096;
      return t;
    }
    return e = ua(e.child, {
      mode: i.mode,
      children: i.children
    }), e.ref = t.ref, t.child = e, e.return = t, e;
  }
  function Fn(e, t) {
    var a = t.ref;
    if (a === null) e !== null && e.ref !== null && (t.flags |= 4194816);
    else {
      if (typeof a != "function" && typeof a != "object") throw Error(p(284));
      (e === null || e.ref !== a) && (t.flags |= 4194816);
    }
  }
  function $c(e, t, a, i, n) {
    return cl(t), a = Ac(e, t, a, i, void 0, n), i = Tc(), e !== null && !pt ? (Mc(e, t, n), ga(e, t, n)) : (Le && i && uc(t), t.flags |= 1, St(e, t, a, n), t.child);
  }
  function Cu(e, t, a, i, n, s) {
    return cl(t), t.updateQueue = null, a = Do(t, i, a, n), Oo(e), i = Tc(), e !== null && !pt ? (Mc(e, t, s), ga(e, t, s)) : (Le && i && uc(t), t.flags |= 1, St(e, t, a, s), t.child);
  }
  function Eu(e, t, a, i, n) {
    if (cl(t), t.stateNode === null) {
      var s = Rl, c = a.contextType;
      typeof c == "object" && c !== null && (s = yt(c)), s = new a(i, s), t.memoizedState = s.state !== null && s.state !== void 0 ? s.state : null, s.updater = Kc, t.stateNode = s, s._reactInternals = t, s = t.stateNode, s.props = i, s.state = t.memoizedState, s.refs = {}, Sc(t), c = a.contextType, s.context = typeof c == "object" && c !== null ? yt(c) : Rl, s.state = t.memoizedState, c = a.getDerivedStateFromProps, typeof c == "function" && (Zc(t, a, c, i), s.state = t.memoizedState), typeof a.getDerivedStateFromProps == "function" || typeof s.getSnapshotBeforeUpdate == "function" || typeof s.UNSAFE_componentWillMount != "function" && typeof s.componentWillMount != "function" || (c = s.state, typeof s.componentWillMount == "function" && s.componentWillMount(), typeof s.UNSAFE_componentWillMount == "function" && s.UNSAFE_componentWillMount(), c !== s.state && Kc.enqueueReplaceState(s, s.state, null), Di(t, i, s, n), Oi(), s.state = t.memoizedState), typeof s.componentDidMount == "function" && (t.flags |= 4194308), i = !0;
    } else if (e === null) {
      s = t.stateNode;
      var u = t.memoizedProps, v = ml(a, u);
      s.props = v;
      var D = s.context, V = a.contextType;
      c = Rl, typeof V == "object" && V !== null && (c = yt(V));
      var J = a.getDerivedStateFromProps;
      V = typeof J == "function" || typeof s.getSnapshotBeforeUpdate == "function", u = t.pendingProps !== u, V || typeof s.UNSAFE_componentWillReceiveProps != "function" && typeof s.componentWillReceiveProps != "function" || (u || D !== c) && bu(t, s, i, c), Da = !1;
      var U = t.memoizedState;
      s.state = U, Di(t, i, s, n), Oi(), D = t.memoizedState, u || U !== D || Da ? (typeof J == "function" && (Zc(t, a, J, i), D = t.memoizedState), (v = Da || gu(t, a, v, i, U, D, c)) ? (V || typeof s.UNSAFE_componentWillMount != "function" && typeof s.componentWillMount != "function" || (typeof s.componentWillMount == "function" && s.componentWillMount(), typeof s.UNSAFE_componentWillMount == "function" && s.UNSAFE_componentWillMount()), typeof s.componentDidMount == "function" && (t.flags |= 4194308)) : (typeof s.componentDidMount == "function" && (t.flags |= 4194308), t.memoizedProps = i, t.memoizedState = D), s.props = i, s.state = D, s.context = c, i = v) : (typeof s.componentDidMount == "function" && (t.flags |= 4194308), i = !1);
    } else {
      s = t.stateNode, Nc(e, t), c = t.memoizedProps, V = ml(a, c), s.props = V, J = t.pendingProps, U = s.context, D = a.contextType, v = Rl, typeof D == "object" && D !== null && (v = yt(D)), u = a.getDerivedStateFromProps, (D = typeof u == "function" || typeof s.getSnapshotBeforeUpdate == "function") || typeof s.UNSAFE_componentWillReceiveProps != "function" && typeof s.componentWillReceiveProps != "function" || (c !== J || U !== v) && bu(t, s, i, v), Da = !1, U = t.memoizedState, s.state = U, Di(t, i, s, n), Oi();
      var L = t.memoizedState;
      c !== J || U !== L || Da || e !== null && e.dependencies !== null && On(e.dependencies) ? (typeof u == "function" && (Zc(t, a, u, i), L = t.memoizedState), (V = Da || gu(t, a, V, i, U, L, v) || e !== null && e.dependencies !== null && On(e.dependencies)) ? (D || typeof s.UNSAFE_componentWillUpdate != "function" && typeof s.componentWillUpdate != "function" || (typeof s.componentWillUpdate == "function" && s.componentWillUpdate(i, L, v), typeof s.UNSAFE_componentWillUpdate == "function" && s.UNSAFE_componentWillUpdate(i, L, v)), typeof s.componentDidUpdate == "function" && (t.flags |= 4), typeof s.getSnapshotBeforeUpdate == "function" && (t.flags |= 1024)) : (typeof s.componentDidUpdate != "function" || c === e.memoizedProps && U === e.memoizedState || (t.flags |= 4), typeof s.getSnapshotBeforeUpdate != "function" || c === e.memoizedProps && U === e.memoizedState || (t.flags |= 1024), t.memoizedProps = i, t.memoizedState = L), s.props = i, s.state = L, s.context = v, i = V) : (typeof s.componentDidUpdate != "function" || c === e.memoizedProps && U === e.memoizedState || (t.flags |= 4), typeof s.getSnapshotBeforeUpdate != "function" || c === e.memoizedProps && U === e.memoizedState || (t.flags |= 1024), i = !1);
    }
    return s = i, Fn(e, t), i = (t.flags & 128) !== 0, s || i ? (s = t.stateNode, a = i && typeof a.getDerivedStateFromError != "function" ? null : s.render(), t.flags |= 1, e !== null && i ? (t.child = ul(t, e.child, null, n), t.child = ul(t, null, a, n)) : St(e, t, a, n), t.memoizedState = s.state, e = t.child) : e = ga(e, t, n), e;
  }
  function Au(e, t, a, i) {
    return nl(), t.flags |= 256, St(e, t, a, i), t.child;
  }
  var Wc = {
    dehydrated: null,
    treeContext: null,
    retryLane: 0,
    hydrationErrors: null
  };
  function Fc(e) {
    return {
      baseLanes: e,
      cachePool: So()
    };
  }
  function Pc(e, t, a) {
    return e = e !== null ? e.childLanes & ~a : 0, t && (e |= Bt), e;
  }
  function Tu(e, t, a) {
    var i = t.pendingProps, n = !1, s = (t.flags & 128) !== 0, c;
    if ((c = s) || (c = e !== null && e.memoizedState === null ? !1 : (ct.current & 2) !== 0), c && (n = !0, t.flags &= -129), c = (t.flags & 32) !== 0, t.flags &= -33, e === null) {
      if (Le) {
        if (n ? Ua(t) : Ra(t), (e = et) ? (e = Bp(e, Kt), e = e !== null && e.data !== "&" ? e : null, e !== null && (t.memoizedState = {
          dehydrated: e,
          treeContext: Aa !== null ? {
            id: ia,
            overflow: na
          } : null,
          retryLane: 536870912,
          hydrationErrors: null
        }, a = fo(e), a.return = t, t.child = a, jt = t, et = null)) : e = null, e === null) throw Ma(t);
        return Dr(e) ? t.lanes = 32 : t.lanes = 536870912, null;
      }
      var u = i.children;
      return i = i.fallback, n ? (Ra(t), n = t.mode, u = Pn({
        mode: "hidden",
        children: u
      }, n), i = il(i, n, a, null), u.return = t, i.return = t, u.sibling = i, t.child = u, i = t.child, i.memoizedState = Fc(a), i.childLanes = Pc(e, c, a), t.memoizedState = Wc, Hi(null, i)) : (Ua(t), er(t, u));
    }
    var v = e.memoizedState;
    if (v !== null && (u = v.dehydrated, u !== null)) {
      if (s) t.flags & 256 ? (Ua(t), t.flags &= -257, t = tr(e, t, a)) : t.memoizedState !== null ? (Ra(t), t.child = e.child, t.flags |= 128, t = null) : (Ra(t), u = i.fallback, n = t.mode, i = Pn({
        mode: "visible",
        children: i.children
      }, n), u = il(u, n, a, null), u.flags |= 2, i.return = t, u.return = t, i.sibling = u, t.child = i, ul(t, e.child, null, a), i = t.child, i.memoizedState = Fc(a), i.childLanes = Pc(e, c, a), t.memoizedState = Wc, t = Hi(null, i));
      else if (Ua(t), Dr(u)) {
        if (c = u.nextSibling && u.nextSibling.dataset, c) var D = c.dgst;
        c = D, i = Error(p(419)), i.stack = "", i.digest = c, _i({
          value: i,
          source: null,
          stack: null
        }), t = tr(e, t, a);
      } else if (pt || Bl(e, t, a, !1), c = (a & e.childLanes) !== 0, pt || c) {
        if (c = Pe, c !== null && (i = bd(c, a), i !== 0 && i !== v.retryLane)) throw v.retryLane = i, ll(e, i), Ot(c, e, i), Ic;
        Or(u) || rs(), t = tr(e, t, a);
      } else Or(u) ? (t.flags |= 192, t.child = e.child, t = null) : (e = v.treeContext, et = $t(u.nextSibling), jt = t, Le = !0, Ta = null, Kt = !1, e !== null && xo(t, e), t = er(t, i.children), t.flags |= 4096);
      return t;
    }
    return n ? (Ra(t), u = i.fallback, n = t.mode, v = e.child, D = v.sibling, i = ua(v, {
      mode: "hidden",
      children: i.children
    }), i.subtreeFlags = v.subtreeFlags & 65011712, D !== null ? u = ua(D, u) : (u = il(u, n, a, null), u.flags |= 2), u.return = t, i.return = t, i.sibling = u, t.child = i, Hi(null, i), i = t.child, u = e.child.memoizedState, u === null ? u = Fc(a) : (n = u.cachePool, n !== null ? (v = ot._currentValue, n = n.parent !== v ? {
      parent: v,
      pool: v
    } : n) : n = So(), u = {
      baseLanes: u.baseLanes | a,
      cachePool: n
    }), i.memoizedState = u, i.childLanes = Pc(e, c, a), t.memoizedState = Wc, Hi(e.child, i)) : (Ua(t), a = e.child, e = a.sibling, a = ua(a, {
      mode: "visible",
      children: i.children
    }), a.return = t, a.sibling = null, e !== null && (c = t.deletions, c === null ? (t.deletions = [e], t.flags |= 16) : c.push(e)), t.child = a, t.memoizedState = null, a);
  }
  function er(e, t) {
    return t = Pn({
      mode: "visible",
      children: t
    }, e.mode), t.return = e, e.child = t;
  }
  function Pn(e, t) {
    return e = Rt(22, e, null, t), e.lanes = 0, e;
  }
  function tr(e, t, a) {
    return ul(t, e.child, null, a), e = er(t, t.pendingProps.children), e.flags |= 2, t.memoizedState = null, e;
  }
  function Mu(e, t, a) {
    e.lanes |= t;
    var i = e.alternate;
    i !== null && (i.lanes |= t), xc(e.return, t, a);
  }
  function ar(e, t, a, i, n, s) {
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
  function Ou(e, t, a) {
    var i = t.pendingProps, n = i.revealOrder, s = i.tail;
    i = i.children;
    var c = ct.current, u = (c & 2) !== 0;
    if (u ? (c = c & 1 | 2, t.flags |= 128) : c &= 1, R(ct, c), St(e, t, i, a), i = Le ? ki : 0, !u && e !== null && (e.flags & 128) !== 0) e: for (e = t.child; e !== null; ) {
      if (e.tag === 13) e.memoizedState !== null && Mu(e, a, t);
      else if (e.tag === 19) Mu(e, a, t);
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
        for (a = t.child, n = null; a !== null; ) e = a.alternate, e !== null && Gn(e) === null && (n = a), a = a.sibling;
        a = n, a === null ? (n = t.child, t.child = null) : (n = a.sibling, a.sibling = null), ar(t, !1, n, a, s, i);
        break;
      case "backwards":
      case "unstable_legacy-backwards":
        for (a = null, n = t.child, t.child = null; n !== null; ) {
          if (e = n.alternate, e !== null && Gn(e) === null) {
            t.child = n;
            break;
          }
          e = n.sibling, n.sibling = a, a = n, n = e;
        }
        ar(t, !0, a, null, s, i);
        break;
      case "together":
        ar(t, !1, null, null, void 0, i);
        break;
      default:
        t.memoizedState = null;
    }
    return t.child;
  }
  function ga(e, t, a) {
    if (e !== null && (t.dependencies = e.dependencies), Ha |= t.lanes, (a & t.childLanes) === 0) if (e !== null) {
      if (Bl(e, t, a, !1), (a & t.childLanes) === 0) return null;
    } else return null;
    if (e !== null && t.child !== e.child) throw Error(p(153));
    if (t.child !== null) {
      for (e = t.child, a = ua(e, e.pendingProps), t.child = a, a.return = t; e.sibling !== null; ) e = e.sibling, a = a.sibling = ua(e, e.pendingProps), a.return = t;
      a.sibling = null;
    }
    return t.child;
  }
  function lr(e, t) {
    return (e.lanes & t) !== 0 ? !0 : (e = e.dependencies, !!(e !== null && On(e)));
  }
  function X0(e, t, a) {
    switch (t.tag) {
      case 3:
        Ge(t, t.stateNode.containerInfo), Oa(t, ot, e.memoizedState.cache), nl();
        break;
      case 27:
      case 5:
        dt(t);
        break;
      case 4:
        Ge(t, t.stateNode.containerInfo);
        break;
      case 10:
        Oa(t, t.type, t.memoizedProps.value);
        break;
      case 31:
        if (t.memoizedState !== null) return t.flags |= 128, Cc(t), null;
        break;
      case 13:
        var i = t.memoizedState;
        if (i !== null)
          return i.dehydrated !== null ? (Ua(t), t.flags |= 128, null) : (a & t.child.childLanes) !== 0 ? Tu(e, t, a) : (Ua(t), e = ga(e, t, a), e !== null ? e.sibling : null);
        Ua(t);
        break;
      case 19:
        var n = (e.flags & 128) !== 0;
        if (i = (a & t.childLanes) !== 0, i || (Bl(e, t, a, !1), i = (a & t.childLanes) !== 0), n) {
          if (i) return Ou(e, t, a);
          t.flags |= 128;
        }
        if (n = t.memoizedState, n !== null && (n.rendering = null, n.tail = null, n.lastEffect = null), R(ct, ct.current), i) break;
        return null;
      case 22:
        return t.lanes = 0, zu(e, t, a, t.pendingProps);
      case 24:
        Oa(t, ot, e.memoizedState.cache);
    }
    return ga(e, t, a);
  }
  function Du(e, t, a) {
    if (e !== null) if (e.memoizedProps !== t.pendingProps) pt = !0;
    else {
      if (!lr(e, a) && (t.flags & 128) === 0) return pt = !1, X0(e, t, a);
      pt = (e.flags & 131072) !== 0;
    }
    else pt = !1, Le && (t.flags & 1048576) !== 0 && mo(t, ki, t.index);
    switch (t.lanes = 0, t.tag) {
      case 16:
        e: {
          var i = t.pendingProps;
          if (e = dl(t.elementType), t.type = e, typeof e == "function") rc(e) ? (i = ml(e, i), t.tag = 1, t = Eu(null, t, e, i, a)) : (t.tag = 0, t = $c(null, t, e, i, a));
          else {
            if (e != null) {
              var n = e.$$typeof;
              if (n === F) {
                t.tag = 11, t = Su(null, t, e, i, a);
                break e;
              } else if (n === te) {
                t.tag = 14, t = Nu(null, t, e, i, a);
                break e;
              }
            }
            throw t = ae(e) || e, Error(p(306, t, ""));
          }
        }
        return t;
      case 0:
        return $c(e, t, t.type, t.pendingProps, a);
      case 1:
        return i = t.type, n = ml(i, t.pendingProps), Eu(e, t, i, n, a);
      case 3:
        e: {
          if (Ge(t, t.stateNode.containerInfo), e === null) throw Error(p(387));
          i = t.pendingProps;
          var s = t.memoizedState;
          n = s.element, Nc(e, t), Di(t, i, null, a);
          var c = t.memoizedState;
          if (i = c.cache, Oa(t, ot, i), i !== s.cache && gc(t, [ot], a, !0), Oi(), i = c.element, s.isDehydrated) if (s = {
            element: i,
            isDehydrated: !1,
            cache: c.cache
          }, t.updateQueue.baseState = s, t.memoizedState = s, t.flags & 256) {
            t = Au(e, t, i, a);
            break e;
          } else if (i !== n) {
            n = Qt(Error(p(424)), t), _i(n), t = Au(e, t, i, a);
            break e;
          } else
            for (e = t.stateNode.containerInfo, e.nodeType === 9 ? e = e.body : e = e.nodeName === "HTML" ? e.ownerDocument.body : e, et = $t(e.firstChild), jt = t, Le = !0, Ta = null, Kt = !0, a = Co(t, null, i, a), t.child = a; a; ) a.flags = a.flags & -3 | 4096, a = a.sibling;
          else {
            if (nl(), i === n) {
              t = ga(e, t, a);
              break e;
            }
            St(e, t, i, a);
          }
          t = t.child;
        }
        return t;
      case 26:
        return Fn(e, t), e === null ? (a = Zp(t.type, null, t.pendingProps, null)) ? t.memoizedState = a : Le || (a = t.type, e = t.pendingProps, i = ms(he.current).createElement(a), i[vt] = t, i[_t] = e, Nt(i, a, e), xt(i), t.stateNode = i) : t.memoizedState = Zp(t.type, e.memoizedProps, t.pendingProps, e.memoizedState), null;
      case 27:
        return dt(t), e === null && Le && (i = t.stateNode = Vp(t.type, t.pendingProps, he.current), jt = t, Kt = !0, n = et, Qa(t.type) ? (Ur = n, et = $t(i.firstChild)) : et = n), St(e, t, t.pendingProps.children, a), Fn(e, t), e === null && (t.flags |= 4194304), t.child;
      case 5:
        return e === null && Le && ((n = i = et) && (i = vh(i, t.type, t.pendingProps, Kt), i !== null ? (t.stateNode = i, jt = t, et = $t(i.firstChild), Kt = !1, n = !0) : n = !1), n || Ma(t)), dt(t), n = t.type, s = t.pendingProps, c = e !== null ? e.memoizedProps : null, i = s.children, Ar(n, s) ? i = null : c !== null && Ar(n, c) && (t.flags |= 32), t.memoizedState !== null && (n = Ac(e, t, O0, null, null, a), en._currentValue = n), Fn(e, t), St(e, t, i, a), t.child;
      case 6:
        return e === null && Le && ((e = a = et) && (a = jh(a, t.pendingProps, Kt), a !== null ? (t.stateNode = a, jt = t, et = null, e = !0) : e = !1), e || Ma(t)), null;
      case 13:
        return Tu(e, t, a);
      case 4:
        return Ge(t, t.stateNode.containerInfo), i = t.pendingProps, e === null ? t.child = ul(t, null, i, a) : St(e, t, i, a), t.child;
      case 11:
        return Su(e, t, t.type, t.pendingProps, a);
      case 7:
        return St(e, t, t.pendingProps, a), t.child;
      case 8:
        return St(e, t, t.pendingProps.children, a), t.child;
      case 12:
        return St(e, t, t.pendingProps.children, a), t.child;
      case 10:
        return i = t.pendingProps, Oa(t, t.type, i.value), St(e, t, i.children, a), t.child;
      case 9:
        return n = t.type._context, i = t.pendingProps.children, cl(t), n = yt(n), i = i(n), t.flags |= 1, St(e, t, i, a), t.child;
      case 14:
        return Nu(e, t, t.type, t.pendingProps, a);
      case 15:
        return wu(e, t, t.type, t.pendingProps, a);
      case 19:
        return Ou(e, t, a);
      case 31:
        return Q0(e, t, a);
      case 22:
        return zu(e, t, a, t.pendingProps);
      case 24:
        return cl(t), i = yt(ot), e === null ? (n = jc(), n === null && (n = Pe, s = bc(), n.pooledCache = s, s.refCount++, s !== null && (n.pooledCacheLanes |= a), n = s), t.memoizedState = {
          parent: i,
          cache: n
        }, Sc(t), Oa(t, ot, n)) : ((e.lanes & a) !== 0 && (Nc(e, t), Di(t, null, null, a), Oi()), n = e.memoizedState, s = t.memoizedState, n.parent !== i ? (n = {
          parent: i,
          cache: i
        }, t.memoizedState = n, t.lanes === 0 && (t.memoizedState = t.updateQueue.baseState = n), Oa(t, ot, i)) : (i = s.cache, Oa(t, ot, i), i !== n.cache && gc(t, [ot], a, !0))), St(e, t, t.pendingProps.children, a), t.child;
      case 29:
        throw t.pendingProps;
    }
    throw Error(p(156, t.tag));
  }
  function ba(e) {
    e.flags |= 4;
  }
  function ir(e, t, a, i, n) {
    if ((t = (e.mode & 32) !== 0) && (t = !1), t) {
      if (e.flags |= 16777216, (n & 335544128) === n) if (e.stateNode.complete) e.flags |= 8192;
      else if (cp()) e.flags |= 8192;
      else throw ol = Ln, yc;
    } else e.flags &= -16777217;
  }
  function Uu(e, t) {
    if (t.type !== "stylesheet" || (t.state.loading & 4) !== 0) e.flags &= -16777217;
    else if (e.flags |= 16777216, !Wp(t)) if (cp()) e.flags |= 8192;
    else throw ol = Ln, yc;
  }
  function es(e, t) {
    t !== null && (e.flags |= 4), e.flags & 16384 && (t = e.tag !== 22 ? md() : 536870912, e.lanes |= t, Fl |= t);
  }
  function Bi(e, t) {
    if (!Le) switch (e.tailMode) {
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
  function tt(e) {
    var t = e.alternate !== null && e.alternate.child === e.child, a = 0, i = 0;
    if (t) for (var n = e.child; n !== null; ) a |= n.lanes | n.childLanes, i |= n.subtreeFlags & 65011712, i |= n.flags & 65011712, n.return = e, n = n.sibling;
    else for (n = e.child; n !== null; ) a |= n.lanes | n.childLanes, i |= n.subtreeFlags, i |= n.flags, n.return = e, n = n.sibling;
    return e.subtreeFlags |= i, e.childLanes = a, t;
  }
  function Z0(e, t, a) {
    var i = t.pendingProps;
    switch (pc(t), t.tag) {
      case 16:
      case 15:
      case 0:
      case 11:
      case 7:
      case 8:
      case 12:
      case 9:
      case 14:
        return tt(t), null;
      case 1:
        return tt(t), null;
      case 3:
        return a = t.stateNode, i = null, e !== null && (i = e.memoizedState.cache), t.memoizedState.cache !== i && (t.flags |= 2048), ha(ot), ze(), a.pendingContext && (a.context = a.pendingContext, a.pendingContext = null), (e === null || e.child === null) && (Hl(t) ? ba(t) : e === null || e.memoizedState.isDehydrated && (t.flags & 256) === 0 || (t.flags |= 1024, hc())), tt(t), null;
      case 26:
        var n = t.type, s = t.memoizedState;
        return e === null ? (ba(t), s !== null ? (tt(t), Uu(t, s)) : (tt(t), ir(t, n, null, i, a))) : s ? s !== e.memoizedState ? (ba(t), tt(t), Uu(t, s)) : (tt(t), t.flags &= -16777217) : (e = e.memoizedProps, e !== i && ba(t), tt(t), ir(t, n, e, i, a)), null;
      case 27:
        if (Xe(t), a = he.current, n = t.type, e !== null && t.stateNode != null) e.memoizedProps !== i && ba(t);
        else {
          if (!i) {
            if (t.stateNode === null) throw Error(p(166));
            return tt(t), null;
          }
          e = W.current, Hl(t) ? go(t, e) : (e = Vp(n, i, a), t.stateNode = e, ba(t));
        }
        return tt(t), null;
      case 5:
        if (Xe(t), n = t.type, e !== null && t.stateNode != null) e.memoizedProps !== i && ba(t);
        else {
          if (!i) {
            if (t.stateNode === null) throw Error(p(166));
            return tt(t), null;
          }
          if (s = W.current, Hl(t)) go(t, s);
          else {
            var c = ms(he.current);
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
            s[vt] = t, s[_t] = i;
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
            e: switch (Nt(s, n, i), n) {
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
            i && ba(t);
          }
        }
        return tt(t), ir(t, t.type, e === null ? null : e.memoizedProps, t.pendingProps, a), null;
      case 6:
        if (e && t.stateNode != null) e.memoizedProps !== i && ba(t);
        else {
          if (typeof i != "string" && t.stateNode === null) throw Error(p(166));
          if (e = he.current, Hl(t)) {
            if (e = t.stateNode, a = t.memoizedProps, i = null, n = jt, n !== null) switch (n.tag) {
              case 27:
              case 5:
                i = n.memoizedProps;
            }
            e[vt] = t, e = !!(e.nodeValue === a || i !== null && i.suppressHydrationWarning === !0 || Mp(e.nodeValue, a)), e || Ma(t, !0);
          } else e = ms(e).createTextNode(i), e[vt] = t, t.stateNode = e;
        }
        return tt(t), null;
      case 31:
        if (a = t.memoizedState, e === null || e.memoizedState !== null) {
          if (i = Hl(t), a !== null) {
            if (e === null) {
              if (!i) throw Error(p(318));
              if (e = t.memoizedState, e = e !== null ? e.dehydrated : null, !e) throw Error(p(557));
              e[vt] = t;
            } else nl(), (t.flags & 128) === 0 && (t.memoizedState = null), t.flags |= 4;
            tt(t), e = !1;
          } else a = hc(), e !== null && e.memoizedState !== null && (e.memoizedState.hydrationErrors = a), e = !0;
          if (!e)
            return t.flags & 256 ? (qt(t), t) : (qt(t), null);
          if ((t.flags & 128) !== 0) throw Error(p(558));
        }
        return tt(t), null;
      case 13:
        if (i = t.memoizedState, e === null || e.memoizedState !== null && e.memoizedState.dehydrated !== null) {
          if (n = Hl(t), i !== null && i.dehydrated !== null) {
            if (e === null) {
              if (!n) throw Error(p(318));
              if (n = t.memoizedState, n = n !== null ? n.dehydrated : null, !n) throw Error(p(317));
              n[vt] = t;
            } else nl(), (t.flags & 128) === 0 && (t.memoizedState = null), t.flags |= 4;
            tt(t), n = !1;
          } else n = hc(), e !== null && e.memoizedState !== null && (e.memoizedState.hydrationErrors = n), n = !0;
          if (!n)
            return t.flags & 256 ? (qt(t), t) : (qt(t), null);
        }
        return qt(t), (t.flags & 128) !== 0 ? (t.lanes = a, t) : (a = i !== null, e = e !== null && e.memoizedState !== null, a && (i = t.child, n = null, i.alternate !== null && i.alternate.memoizedState !== null && i.alternate.memoizedState.cachePool !== null && (n = i.alternate.memoizedState.cachePool.pool), s = null, i.memoizedState !== null && i.memoizedState.cachePool !== null && (s = i.memoizedState.cachePool.pool), s !== n && (i.flags |= 2048)), a !== e && a && (t.child.flags |= 8192), es(t, t.updateQueue), tt(t), null);
      case 4:
        return ze(), e === null && Cp(t.stateNode.containerInfo), tt(t), null;
      case 10:
        return ha(t.type), tt(t), null;
      case 19:
        if (j(ct), i = t.memoizedState, i === null) return tt(t), null;
        if (n = (t.flags & 128) !== 0, s = i.rendering, s === null) if (n) Bi(i, !1);
        else {
          if (nt !== 0 || e !== null && (e.flags & 128) !== 0) for (e = t.child; e !== null; ) {
            if (s = Gn(e), s !== null) {
              for (t.flags |= 128, Bi(i, !1), e = s.updateQueue, t.updateQueue = e, es(t, e), t.subtreeFlags = 0, e = a, a = t.child; a !== null; ) po(a, e), a = a.sibling;
              return R(ct, ct.current & 1 | 2), Le && pa(t, i.treeForkCount), t.child;
            }
            e = e.sibling;
          }
          i.tail !== null && M() > ns && (t.flags |= 128, n = !0, Bi(i, !1), t.lanes = 4194304);
        }
        else {
          if (!n) if (e = Gn(s), e !== null) {
            if (t.flags |= 128, n = !0, e = e.updateQueue, t.updateQueue = e, es(t, e), Bi(i, !0), i.tail === null && i.tailMode === "hidden" && !s.alternate && !Le) return tt(t), null;
          } else 2 * M() - i.renderingStartTime > ns && a !== 536870912 && (t.flags |= 128, n = !0, Bi(i, !1), t.lanes = 4194304);
          i.isBackwards ? (s.sibling = t.child, t.child = s) : (e = i.last, e !== null ? e.sibling = s : t.child = s, i.last = s);
        }
        return i.tail !== null ? (e = i.tail, i.rendering = e, i.tail = e.sibling, i.renderingStartTime = M(), e.sibling = null, a = ct.current, R(ct, n ? a & 1 | 2 : a & 1), Le && pa(t, i.treeForkCount), e) : (tt(t), null);
      case 22:
      case 23:
        return qt(t), _c(), i = t.memoizedState !== null, e !== null ? e.memoizedState !== null !== i && (t.flags |= 8192) : i && (t.flags |= 8192), i ? (a & 536870912) !== 0 && (t.flags & 128) === 0 && (tt(t), t.subtreeFlags & 6 && (t.flags |= 8192)) : tt(t), a = t.updateQueue, a !== null && es(t, a.retryQueue), a = null, e !== null && e.memoizedState !== null && e.memoizedState.cachePool !== null && (a = e.memoizedState.cachePool.pool), i = null, t.memoizedState !== null && t.memoizedState.cachePool !== null && (i = t.memoizedState.cachePool.pool), i !== a && (t.flags |= 2048), e !== null && j(rl), null;
      case 24:
        return a = null, e !== null && (a = e.memoizedState.cache), t.memoizedState.cache !== a && (t.flags |= 2048), ha(ot), tt(t), null;
      case 25:
        return null;
      case 30:
        return null;
    }
    throw Error(p(156, t.tag));
  }
  function K0(e, t) {
    switch (pc(t), t.tag) {
      case 1:
        return e = t.flags, e & 65536 ? (t.flags = e & -65537 | 128, t) : null;
      case 3:
        return ha(ot), ze(), e = t.flags, (e & 65536) !== 0 && (e & 128) === 0 ? (t.flags = e & -65537 | 128, t) : null;
      case 26:
      case 27:
      case 5:
        return Xe(t), null;
      case 31:
        if (t.memoizedState !== null) {
          if (qt(t), t.alternate === null) throw Error(p(340));
          nl();
        }
        return e = t.flags, e & 65536 ? (t.flags = e & -65537 | 128, t) : null;
      case 13:
        if (qt(t), e = t.memoizedState, e !== null && e.dehydrated !== null) {
          if (t.alternate === null) throw Error(p(340));
          nl();
        }
        return e = t.flags, e & 65536 ? (t.flags = e & -65537 | 128, t) : null;
      case 19:
        return j(ct), null;
      case 4:
        return ze(), null;
      case 10:
        return ha(t.type), null;
      case 22:
      case 23:
        return qt(t), _c(), e !== null && j(rl), e = t.flags, e & 65536 ? (t.flags = e & -65537 | 128, t) : null;
      case 24:
        return ha(ot), null;
      case 25:
        return null;
      default:
        return null;
    }
  }
  function Ru(e, t) {
    switch (pc(t), t.tag) {
      case 3:
        ha(ot), ze();
        break;
      case 26:
      case 27:
      case 5:
        Xe(t);
        break;
      case 4:
        ze();
        break;
      case 31:
        t.memoizedState !== null && qt(t);
        break;
      case 13:
        qt(t);
        break;
      case 19:
        j(ct);
        break;
      case 10:
        ha(t.type);
        break;
      case 22:
      case 23:
        qt(t), _c(), e !== null && j(rl);
        break;
      case 24:
        ha(ot);
    }
  }
  function Gi(e, t) {
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
    } catch (u) {
      Je(t, t.return, u);
    }
  }
  function La(e, t, a) {
    try {
      var i = t.updateQueue, n = i !== null ? i.lastEffect : null;
      if (n !== null) {
        var s = n.next;
        i = s;
        do {
          if ((i.tag & e) === e) {
            var c = i.inst, u = c.destroy;
            if (u !== void 0) {
              c.destroy = void 0, n = t;
              var v = a, D = u;
              try {
                D();
              } catch (V) {
                Je(n, v, V);
              }
            }
          }
          i = i.next;
        } while (i !== s);
      }
    } catch (V) {
      Je(t, t.return, V);
    }
  }
  function Lu(e) {
    var t = e.updateQueue;
    if (t !== null) {
      var a = e.stateNode;
      try {
        Ao(t, a);
      } catch (i) {
        Je(e, e.return, i);
      }
    }
  }
  function qu(e, t, a) {
    a.props = ml(e.type, e.memoizedProps), a.state = e.memoizedState;
    try {
      a.componentWillUnmount();
    } catch (i) {
      Je(e, t, i);
    }
  }
  function Yi(e, t) {
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
      Je(e, t, n);
    }
  }
  function sa(e, t) {
    var a = e.ref, i = e.refCleanup;
    if (a !== null) if (typeof i == "function") try {
      i();
    } catch (n) {
      Je(e, t, n);
    } finally {
      e.refCleanup = null, e = e.alternate, e != null && (e.refCleanup = null);
    }
    else if (typeof a == "function") try {
      a(null);
    } catch (n) {
      Je(e, t, n);
    }
    else a.current = null;
  }
  function Hu(e) {
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
      Je(e, e.return, n);
    }
  }
  function nr(e, t, a) {
    try {
      var i = e.stateNode;
      fh(i, e.type, a, t), i[_t] = t;
    } catch (n) {
      Je(e, e.return, n);
    }
  }
  function Bu(e) {
    return e.tag === 5 || e.tag === 3 || e.tag === 26 || e.tag === 27 && Qa(e.type) || e.tag === 4;
  }
  function sr(e) {
    e: for (; ; ) {
      for (; e.sibling === null; ) {
        if (e.return === null || Bu(e.return)) return null;
        e = e.return;
      }
      for (e.sibling.return = e.return, e = e.sibling; e.tag !== 5 && e.tag !== 6 && e.tag !== 18; ) {
        if (e.tag === 27 && Qa(e.type) || e.flags & 2 || e.child === null || e.tag === 4) continue e;
        e.child.return = e, e = e.child;
      }
      if (!(e.flags & 2)) return e.stateNode;
    }
  }
  function cr(e, t, a) {
    var i = e.tag;
    if (i === 5 || i === 6) e = e.stateNode, t ? (a.nodeType === 9 ? a.body : a.nodeName === "HTML" ? a.ownerDocument.body : a).insertBefore(e, t) : (t = a.nodeType === 9 ? a.body : a.nodeName === "HTML" ? a.ownerDocument.body : a, t.appendChild(e), a = a._reactRootContainer, a != null || t.onclick !== null || (t.onclick = da));
    else if (i !== 4 && (i === 27 && Qa(e.type) && (a = e.stateNode, t = null), e = e.child, e !== null)) for (cr(e, t, a), e = e.sibling; e !== null; ) cr(e, t, a), e = e.sibling;
  }
  function ts(e, t, a) {
    var i = e.tag;
    if (i === 5 || i === 6) e = e.stateNode, t ? a.insertBefore(e, t) : a.appendChild(e);
    else if (i !== 4 && (i === 27 && Qa(e.type) && (a = e.stateNode), e = e.child, e !== null)) for (ts(e, t, a), e = e.sibling; e !== null; ) ts(e, t, a), e = e.sibling;
  }
  function Gu(e) {
    var t = e.stateNode, a = e.memoizedProps;
    try {
      for (var i = e.type, n = t.attributes; n.length; ) t.removeAttributeNode(n[0]);
      Nt(t, i, a), t[vt] = e, t[_t] = a;
    } catch (s) {
      Je(e, e.return, s);
    }
  }
  var va = !1, ft = !1, rr = !1, Yu = typeof WeakSet == "function" ? WeakSet : Set, gt = null;
  function J0(e, t) {
    if (e = e.containerInfo, Cr = Ss, e = ao(e), tc(e)) {
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
          var c = 0, u = -1, v = -1, D = 0, V = 0, J = e, U = null;
          t: for (; ; ) {
            for (var L; J !== a || n !== 0 && J.nodeType !== 3 || (u = c + n), J !== s || i !== 0 && J.nodeType !== 3 || (v = c + i), J.nodeType === 3 && (c += J.nodeValue.length), (L = J.firstChild) !== null; )
              U = J, J = L;
            for (; ; ) {
              if (J === e) break t;
              if (U === a && ++D === n && (u = c), U === s && ++V === i && (v = c), (L = J.nextSibling) !== null) break;
              J = U, U = J.parentNode;
            }
            J = L;
          }
          a = u === -1 || v === -1 ? null : {
            start: u,
            end: v
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
    }, Ss = !1, gt = t; gt !== null; ) if (t = gt, e = t.child, (t.subtreeFlags & 1028) !== 0 && e !== null) e.return = t, gt = e;
    else for (; gt !== null; ) {
      switch (t = gt, s = t.alternate, e = t.flags, t.tag) {
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
              var fe = ml(a.type, n);
              e = i.getSnapshotBeforeUpdate(fe, s), i.__reactInternalSnapshotBeforeUpdate = e;
            } catch (Ne) {
              Je(a, a.return, Ne);
            }
          }
          break;
        case 3:
          if ((e & 1024) !== 0) {
            if (e = t.stateNode.containerInfo, a = e.nodeType, a === 9) Mr(e);
            else if (a === 1) switch (e.nodeName) {
              case "HEAD":
              case "HTML":
              case "BODY":
                Mr(e);
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
          if ((e & 1024) !== 0) throw Error(p(163));
      }
      if (e = t.sibling, e !== null) {
        e.return = t.return, gt = e;
        break;
      }
      gt = t.return;
    }
  }
  function Vu(e, t, a) {
    var i = a.flags;
    switch (a.tag) {
      case 0:
      case 11:
      case 15:
        ya(e, a), i & 4 && Gi(5, a);
        break;
      case 1:
        if (ya(e, a), i & 4) if (e = a.stateNode, t === null) try {
          e.componentDidMount();
        } catch (c) {
          Je(a, a.return, c);
        }
        else {
          var n = ml(a.type, t.memoizedProps);
          t = t.memoizedState;
          try {
            e.componentDidUpdate(n, t, e.__reactInternalSnapshotBeforeUpdate);
          } catch (c) {
            Je(a, a.return, c);
          }
        }
        i & 64 && Lu(a), i & 512 && Yi(a, a.return);
        break;
      case 3:
        if (ya(e, a), i & 64 && (e = a.updateQueue, e !== null)) {
          if (t = null, a.child !== null) switch (a.child.tag) {
            case 27:
            case 5:
              t = a.child.stateNode;
              break;
            case 1:
              t = a.child.stateNode;
          }
          try {
            Ao(e, t);
          } catch (c) {
            Je(a, a.return, c);
          }
        }
        break;
      case 27:
        t === null && i & 4 && Gu(a);
      case 26:
      case 5:
        ya(e, a), t === null && i & 4 && Hu(a), i & 512 && Yi(a, a.return);
        break;
      case 12:
        ya(e, a);
        break;
      case 31:
        ya(e, a), i & 4 && Zu(e, a);
        break;
      case 13:
        ya(e, a), i & 4 && Ku(e, a), i & 64 && (e = a.memoizedState, e !== null && (e = e.dehydrated, e !== null && (a = lh.bind(null, a), yh(e, a))));
        break;
      case 22:
        if (i = a.memoizedState !== null || va, !i) {
          t = t !== null && t.memoizedState !== null || ft, n = va;
          var s = ft;
          va = i, (ft = t) && !s ? Sa(e, a, (a.subtreeFlags & 8772) !== 0) : ya(e, a), va = n, ft = s;
        }
        break;
      case 30:
        break;
      default:
        ya(e, a);
    }
  }
  function Qu(e) {
    var t = e.alternate;
    t !== null && (e.alternate = null, Qu(t)), e.child = null, e.deletions = null, e.sibling = null, e.tag === 5 && (t = e.stateNode, t !== null && qs(t)), e.stateNode = null, e.return = null, e.dependencies = null, e.memoizedProps = null, e.memoizedState = null, e.pendingProps = null, e.stateNode = null, e.updateQueue = null;
  }
  var at = null, Et = !1;
  function ja(e, t, a) {
    for (a = a.child; a !== null; ) Xu(e, t, a), a = a.sibling;
  }
  function Xu(e, t, a) {
    if (Fe && typeof Fe.onCommitFiberUnmount == "function") try {
      Fe.onCommitFiberUnmount(st, a);
    } catch {
    }
    switch (a.tag) {
      case 26:
        ft || sa(a, t), ja(e, t, a), a.memoizedState ? a.memoizedState.count-- : a.stateNode && (a = a.stateNode, a.parentNode.removeChild(a));
        break;
      case 27:
        ft || sa(a, t);
        var i = at, n = Et;
        Qa(a.type) && (at = a.stateNode, Et = !1), ja(e, t, a), Wi(a.stateNode), at = i, Et = n;
        break;
      case 5:
        ft || sa(a, t);
      case 6:
        if (i = at, n = Et, at = null, ja(e, t, a), at = i, Et = n, at !== null) if (Et) try {
          (at.nodeType === 9 ? at.body : at.nodeName === "HTML" ? at.ownerDocument.body : at).removeChild(a.stateNode);
        } catch (s) {
          Je(a, t, s);
        }
        else try {
          at.removeChild(a.stateNode);
        } catch (s) {
          Je(a, t, s);
        }
        break;
      case 18:
        at !== null && (Et ? (e = at, qp(e.nodeType === 9 ? e.body : e.nodeName === "HTML" ? e.ownerDocument.body : e, a.stateNode), si(e)) : qp(at, a.stateNode));
        break;
      case 4:
        i = at, n = Et, at = a.stateNode.containerInfo, Et = !0, ja(e, t, a), at = i, Et = n;
        break;
      case 0:
      case 11:
      case 14:
      case 15:
        La(2, a, t), ft || La(4, a, t), ja(e, t, a);
        break;
      case 1:
        ft || (sa(a, t), i = a.stateNode, typeof i.componentWillUnmount == "function" && qu(a, t, i)), ja(e, t, a);
        break;
      case 21:
        ja(e, t, a);
        break;
      case 22:
        ft = (i = ft) || a.memoizedState !== null, ja(e, t, a), ft = i;
        break;
      default:
        ja(e, t, a);
    }
  }
  function Zu(e, t) {
    if (t.memoizedState === null && (e = t.alternate, e !== null && (e = e.memoizedState, e !== null))) {
      e = e.dehydrated;
      try {
        si(e);
      } catch (a) {
        Je(t, t.return, a);
      }
    }
  }
  function Ku(e, t) {
    if (t.memoizedState === null && (e = t.alternate, e !== null && (e = e.memoizedState, e !== null && (e = e.dehydrated, e !== null)))) try {
      si(e);
    } catch (a) {
      Je(t, t.return, a);
    }
  }
  function I0(e) {
    switch (e.tag) {
      case 31:
      case 13:
      case 19:
        var t = e.stateNode;
        return t === null && (t = e.stateNode = new Yu()), t;
      case 22:
        return e = e.stateNode, t = e._retryCache, t === null && (t = e._retryCache = new Yu()), t;
      default:
        throw Error(p(435, e.tag));
    }
  }
  function as(e, t) {
    var a = I0(e);
    t.forEach(function(i) {
      if (!a.has(i)) {
        a.add(i);
        var n = ih.bind(null, e, i);
        i.then(n, n);
      }
    });
  }
  function At(e, t) {
    var a = t.deletions;
    if (a !== null) for (var i = 0; i < a.length; i++) {
      var n = a[i], s = e, c = t, u = c;
      e: for (; u !== null; ) {
        switch (u.tag) {
          case 27:
            if (Qa(u.type)) {
              at = u.stateNode, Et = !1;
              break e;
            }
            break;
          case 5:
            at = u.stateNode, Et = !1;
            break e;
          case 3:
          case 4:
            at = u.stateNode.containerInfo, Et = !0;
            break e;
        }
        u = u.return;
      }
      if (at === null) throw Error(p(160));
      Xu(s, c, n), at = null, Et = !1, s = n.alternate, s !== null && (s.return = null), n.return = null;
    }
    if (t.subtreeFlags & 13886) for (t = t.child; t !== null; ) Ju(t, e), t = t.sibling;
  }
  var ta = null;
  function Ju(e, t) {
    var a = e.alternate, i = e.flags;
    switch (e.tag) {
      case 0:
      case 11:
      case 14:
      case 15:
        At(t, e), Tt(e), i & 4 && (La(3, e, e.return), Gi(3, e), La(5, e, e.return));
        break;
      case 1:
        At(t, e), Tt(e), i & 512 && (ft || a === null || sa(a, a.return)), i & 64 && va && (e = e.updateQueue, e !== null && (i = e.callbacks, i !== null && (a = e.shared.hiddenCallbacks, e.shared.hiddenCallbacks = a === null ? i : a.concat(i))));
        break;
      case 26:
        var n = ta;
        if (At(t, e), Tt(e), i & 512 && (ft || a === null || sa(a, a.return)), i & 4) {
          var s = a !== null ? a.memoizedState : null;
          if (i = e.memoizedState, a === null) if (i === null) if (e.stateNode === null) {
            e: {
              i = e.type, a = e.memoizedProps, n = n.ownerDocument || n;
              t: switch (i) {
                case "title":
                  s = n.getElementsByTagName("title")[0], (!s || s[mi] || s[vt] || s.namespaceURI === "http://www.w3.org/2000/svg" || s.hasAttribute("itemprop")) && (s = n.createElement(i), n.head.insertBefore(s, n.querySelector("head > title"))), Nt(s, i, a), s[vt] = e, xt(s), i = s;
                  break e;
                case "link":
                  var c = Ip("link", "href", n).get(i + (a.href || ""));
                  if (c) {
                    for (var u = 0; u < c.length; u++) if (s = c[u], s.getAttribute("href") === (a.href == null || a.href === "" ? null : a.href) && s.getAttribute("rel") === (a.rel == null ? null : a.rel) && s.getAttribute("title") === (a.title == null ? null : a.title) && s.getAttribute("crossorigin") === (a.crossOrigin == null ? null : a.crossOrigin)) {
                      c.splice(u, 1);
                      break t;
                    }
                  }
                  s = n.createElement(i), Nt(s, i, a), n.head.appendChild(s);
                  break;
                case "meta":
                  if (c = Ip("meta", "content", n).get(i + (a.content || ""))) {
                    for (u = 0; u < c.length; u++) if (s = c[u], s.getAttribute("content") === (a.content == null ? null : "" + a.content) && s.getAttribute("name") === (a.name == null ? null : a.name) && s.getAttribute("property") === (a.property == null ? null : a.property) && s.getAttribute("http-equiv") === (a.httpEquiv == null ? null : a.httpEquiv) && s.getAttribute("charset") === (a.charSet == null ? null : a.charSet)) {
                      c.splice(u, 1);
                      break t;
                    }
                  }
                  s = n.createElement(i), Nt(s, i, a), n.head.appendChild(s);
                  break;
                default:
                  throw Error(p(468, i));
              }
              s[vt] = e, xt(s), i = s;
            }
            e.stateNode = i;
          } else $p(n, e.type, e.stateNode);
          else e.stateNode = Jp(n, i, e.memoizedProps);
          else s !== i ? (s === null ? a.stateNode !== null && (a = a.stateNode, a.parentNode.removeChild(a)) : s.count--, i === null ? $p(n, e.type, e.stateNode) : Jp(n, i, e.memoizedProps)) : i === null && e.stateNode !== null && nr(e, e.memoizedProps, a.memoizedProps);
        }
        break;
      case 27:
        At(t, e), Tt(e), i & 512 && (ft || a === null || sa(a, a.return)), a !== null && i & 4 && nr(e, e.memoizedProps, a.memoizedProps);
        break;
      case 5:
        if (At(t, e), Tt(e), i & 512 && (ft || a === null || sa(a, a.return)), e.flags & 32) {
          n = e.stateNode;
          try {
            El(n, "");
          } catch (fe) {
            Je(e, e.return, fe);
          }
        }
        i & 4 && e.stateNode != null && (n = e.memoizedProps, nr(e, n, a !== null ? a.memoizedProps : n)), i & 1024 && (rr = !0);
        break;
      case 6:
        if (At(t, e), Tt(e), i & 4) {
          if (e.stateNode === null) throw Error(p(162));
          i = e.memoizedProps, a = e.stateNode;
          try {
            a.nodeValue = i;
          } catch (fe) {
            Je(e, e.return, fe);
          }
        }
        break;
      case 3:
        if (bs = null, n = ta, ta = xs(t.containerInfo), At(t, e), ta = n, Tt(e), i & 4 && a !== null && a.memoizedState.isDehydrated) try {
          si(t.containerInfo);
        } catch (fe) {
          Je(e, e.return, fe);
        }
        rr && (rr = !1, Iu(e));
        break;
      case 4:
        i = ta, ta = xs(e.stateNode.containerInfo), At(t, e), Tt(e), ta = i;
        break;
      case 12:
        At(t, e), Tt(e);
        break;
      case 31:
        At(t, e), Tt(e), i & 4 && (i = e.updateQueue, i !== null && (e.updateQueue = null, as(e, i)));
        break;
      case 13:
        At(t, e), Tt(e), e.child.flags & 8192 && e.memoizedState !== null != (a !== null && a.memoizedState !== null) && (is = M()), i & 4 && (i = e.updateQueue, i !== null && (e.updateQueue = null, as(e, i)));
        break;
      case 22:
        n = e.memoizedState !== null;
        var v = a !== null && a.memoizedState !== null, D = va, V = ft;
        if (va = D || n, ft = V || v, At(t, e), ft = V, va = D, Tt(e), i & 8192) e: for (t = e.stateNode, t._visibility = n ? t._visibility & -2 : t._visibility | 1, n && (a === null || v || va || ft || xl(e)), a = null, t = e; ; ) {
          if (t.tag === 5 || t.tag === 26) {
            if (a === null) {
              v = a = t;
              try {
                if (s = v.stateNode, n) c = s.style, typeof c.setProperty == "function" ? c.setProperty("display", "none", "important") : c.display = "none";
                else {
                  u = v.stateNode;
                  var J = v.memoizedProps.style, U = J != null && J.hasOwnProperty("display") ? J.display : null;
                  u.style.display = U == null || typeof U == "boolean" ? "" : ("" + U).trim();
                }
              } catch (fe) {
                Je(v, v.return, fe);
              }
            }
          } else if (t.tag === 6) {
            if (a === null) {
              v = t;
              try {
                v.stateNode.nodeValue = n ? "" : v.memoizedProps;
              } catch (fe) {
                Je(v, v.return, fe);
              }
            }
          } else if (t.tag === 18) {
            if (a === null) {
              v = t;
              try {
                var L = v.stateNode;
                n ? Hp(L, !0) : Hp(v.stateNode, !1);
              } catch (fe) {
                Je(v, v.return, fe);
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
        i & 4 && (i = e.updateQueue, i !== null && (a = i.retryQueue, a !== null && (i.retryQueue = null, as(e, a))));
        break;
      case 19:
        At(t, e), Tt(e), i & 4 && (i = e.updateQueue, i !== null && (e.updateQueue = null, as(e, i)));
        break;
      case 30:
        break;
      case 21:
        break;
      default:
        At(t, e), Tt(e);
    }
  }
  function Tt(e) {
    var t = e.flags;
    if (t & 2) {
      try {
        for (var a, i = e.return; i !== null; ) {
          if (Bu(i)) {
            a = i;
            break;
          }
          i = i.return;
        }
        if (a == null) throw Error(p(160));
        switch (a.tag) {
          case 27:
            var n = a.stateNode;
            ts(e, sr(e), n);
            break;
          case 5:
            var s = a.stateNode;
            a.flags & 32 && (El(s, ""), a.flags &= -33), ts(e, sr(e), s);
            break;
          case 3:
          case 4:
            var c = a.stateNode.containerInfo;
            cr(e, sr(e), c);
            break;
          default:
            throw Error(p(161));
        }
      } catch (u) {
        Je(e, e.return, u);
      }
      e.flags &= -3;
    }
    t & 4096 && (e.flags &= -4097);
  }
  function Iu(e) {
    if (e.subtreeFlags & 1024) for (e = e.child; e !== null; ) {
      var t = e;
      Iu(t), t.tag === 5 && t.flags & 1024 && t.stateNode.reset(), e = e.sibling;
    }
  }
  function ya(e, t) {
    if (t.subtreeFlags & 8772) for (t = t.child; t !== null; ) Vu(e, t.alternate, t), t = t.sibling;
  }
  function xl(e) {
    for (e = e.child; e !== null; ) {
      var t = e;
      switch (t.tag) {
        case 0:
        case 11:
        case 14:
        case 15:
          La(4, t, t.return), xl(t);
          break;
        case 1:
          sa(t, t.return);
          var a = t.stateNode;
          typeof a.componentWillUnmount == "function" && qu(t, t.return, a), xl(t);
          break;
        case 27:
          Wi(t.stateNode);
        case 26:
        case 5:
          sa(t, t.return), xl(t);
          break;
        case 22:
          t.memoizedState === null && xl(t);
          break;
        case 30:
          xl(t);
          break;
        default:
          xl(t);
      }
      e = e.sibling;
    }
  }
  function Sa(e, t, a) {
    for (a = a && (t.subtreeFlags & 8772) !== 0, t = t.child; t !== null; ) {
      var i = t.alternate, n = e, s = t, c = s.flags;
      switch (s.tag) {
        case 0:
        case 11:
        case 15:
          Sa(n, s, a), Gi(4, s);
          break;
        case 1:
          if (Sa(n, s, a), i = s, n = i.stateNode, typeof n.componentDidMount == "function") try {
            n.componentDidMount();
          } catch (D) {
            Je(i, i.return, D);
          }
          if (i = s, n = i.updateQueue, n !== null) {
            var u = i.stateNode;
            try {
              var v = n.shared.hiddenCallbacks;
              if (v !== null) for (n.shared.hiddenCallbacks = null, n = 0; n < v.length; n++) Eo(v[n], u);
            } catch (D) {
              Je(i, i.return, D);
            }
          }
          a && c & 64 && Lu(s), Yi(s, s.return);
          break;
        case 27:
          Gu(s);
        case 26:
        case 5:
          Sa(n, s, a), a && i === null && c & 4 && Hu(s), Yi(s, s.return);
          break;
        case 12:
          Sa(n, s, a);
          break;
        case 31:
          Sa(n, s, a), a && c & 4 && Zu(n, s);
          break;
        case 13:
          Sa(n, s, a), a && c & 4 && Ku(n, s);
          break;
        case 22:
          s.memoizedState === null && Sa(n, s, a), Yi(s, s.return);
          break;
        case 30:
          break;
        default:
          Sa(n, s, a);
      }
      t = t.sibling;
    }
  }
  function dr(e, t) {
    var a = null;
    e !== null && e.memoizedState !== null && e.memoizedState.cachePool !== null && (a = e.memoizedState.cachePool.pool), e = null, t.memoizedState !== null && t.memoizedState.cachePool !== null && (e = t.memoizedState.cachePool.pool), e !== a && (e != null && e.refCount++, a != null && Ci(a));
  }
  function or(e, t) {
    e = null, t.alternate !== null && (e = t.alternate.memoizedState.cache), t = t.memoizedState.cache, t !== e && (t.refCount++, e != null && Ci(e));
  }
  function aa(e, t, a, i) {
    if (t.subtreeFlags & 10256) for (t = t.child; t !== null; ) $u(e, t, a, i), t = t.sibling;
  }
  function $u(e, t, a, i) {
    var n = t.flags;
    switch (t.tag) {
      case 0:
      case 11:
      case 15:
        aa(e, t, a, i), n & 2048 && Gi(9, t);
        break;
      case 1:
        aa(e, t, a, i);
        break;
      case 3:
        aa(e, t, a, i), n & 2048 && (e = null, t.alternate !== null && (e = t.alternate.memoizedState.cache), t = t.memoizedState.cache, t !== e && (t.refCount++, e != null && Ci(e)));
        break;
      case 12:
        if (n & 2048) {
          aa(e, t, a, i), e = t.stateNode;
          try {
            var s = t.memoizedProps, c = s.id, u = s.onPostCommit;
            typeof u == "function" && u(c, t.alternate === null ? "mount" : "update", e.passiveEffectDuration, -0);
          } catch (v) {
            Je(t, t.return, v);
          }
        } else aa(e, t, a, i);
        break;
      case 31:
        aa(e, t, a, i);
        break;
      case 13:
        aa(e, t, a, i);
        break;
      case 23:
        break;
      case 22:
        s = t.stateNode, c = t.alternate, t.memoizedState !== null ? s._visibility & 2 ? aa(e, t, a, i) : Vi(e, t) : s._visibility & 2 ? aa(e, t, a, i) : (s._visibility |= 2, Il(e, t, a, i, (t.subtreeFlags & 10256) !== 0 || !1)), n & 2048 && dr(c, t);
        break;
      case 24:
        aa(e, t, a, i), n & 2048 && or(t.alternate, t);
        break;
      default:
        aa(e, t, a, i);
    }
  }
  function Il(e, t, a, i, n) {
    for (n = n && ((t.subtreeFlags & 10256) !== 0 || !1), t = t.child; t !== null; ) {
      var s = e, c = t, u = a, v = i, D = c.flags;
      switch (c.tag) {
        case 0:
        case 11:
        case 15:
          Il(s, c, u, v, n), Gi(8, c);
          break;
        case 23:
          break;
        case 22:
          var V = c.stateNode;
          c.memoizedState !== null ? V._visibility & 2 ? Il(s, c, u, v, n) : Vi(s, c) : (V._visibility |= 2, Il(s, c, u, v, n)), n && D & 2048 && dr(c.alternate, c);
          break;
        case 24:
          Il(s, c, u, v, n), n && D & 2048 && or(c.alternate, c);
          break;
        default:
          Il(s, c, u, v, n);
      }
      t = t.sibling;
    }
  }
  function Vi(e, t) {
    if (t.subtreeFlags & 10256) for (t = t.child; t !== null; ) {
      var a = e, i = t, n = i.flags;
      switch (i.tag) {
        case 22:
          Vi(a, i), n & 2048 && dr(i.alternate, i);
          break;
        case 24:
          Vi(a, i), n & 2048 && or(i.alternate, i);
          break;
        default:
          Vi(a, i);
      }
      t = t.sibling;
    }
  }
  var Qi = 8192;
  function $l(e, t, a) {
    if (e.subtreeFlags & Qi) for (e = e.child; e !== null; ) Wu(e, t, a), e = e.sibling;
  }
  function Wu(e, t, a) {
    switch (e.tag) {
      case 26:
        $l(e, t, a), e.flags & Qi && e.memoizedState !== null && Oh(a, ta, e.memoizedState, e.memoizedProps);
        break;
      case 5:
        $l(e, t, a);
        break;
      case 3:
      case 4:
        var i = ta;
        ta = xs(e.stateNode.containerInfo), $l(e, t, a), ta = i;
        break;
      case 22:
        e.memoizedState === null && (i = e.alternate, i !== null && i.memoizedState !== null ? (i = Qi, Qi = 16777216, $l(e, t, a), Qi = i) : $l(e, t, a));
        break;
      default:
        $l(e, t, a);
    }
  }
  function Fu(e) {
    var t = e.alternate;
    if (t !== null && (e = t.child, e !== null)) {
      t.child = null;
      do
        t = e.sibling, e.sibling = null, e = t;
      while (e !== null);
    }
  }
  function Xi(e) {
    var t = e.deletions;
    if ((e.flags & 16) !== 0) {
      if (t !== null) for (var a = 0; a < t.length; a++) {
        var i = t[a];
        gt = i, ep(i, e);
      }
      Fu(e);
    }
    if (e.subtreeFlags & 10256) for (e = e.child; e !== null; ) Pu(e), e = e.sibling;
  }
  function Pu(e) {
    switch (e.tag) {
      case 0:
      case 11:
      case 15:
        Xi(e), e.flags & 2048 && La(9, e, e.return);
        break;
      case 3:
        Xi(e);
        break;
      case 12:
        Xi(e);
        break;
      case 22:
        var t = e.stateNode;
        e.memoizedState !== null && t._visibility & 2 && (e.return === null || e.return.tag !== 13) ? (t._visibility &= -3, ls(e)) : Xi(e);
        break;
      default:
        Xi(e);
    }
  }
  function ls(e) {
    var t = e.deletions;
    if ((e.flags & 16) !== 0) {
      if (t !== null) for (var a = 0; a < t.length; a++) {
        var i = t[a];
        gt = i, ep(i, e);
      }
      Fu(e);
    }
    for (e = e.child; e !== null; ) {
      switch (t = e, t.tag) {
        case 0:
        case 11:
        case 15:
          La(8, t, t.return), ls(t);
          break;
        case 22:
          a = t.stateNode, a._visibility & 2 && (a._visibility &= -3, ls(t));
          break;
        default:
          ls(t);
      }
      e = e.sibling;
    }
  }
  function ep(e, t) {
    for (; gt !== null; ) {
      var a = gt;
      switch (a.tag) {
        case 0:
        case 11:
        case 15:
          La(8, a, t);
          break;
        case 23:
        case 22:
          if (a.memoizedState !== null && a.memoizedState.cachePool !== null) {
            var i = a.memoizedState.cachePool.pool;
            i != null && i.refCount++;
          }
          break;
        case 24:
          Ci(a.memoizedState.cache);
      }
      if (i = a.child, i !== null) i.return = a, gt = i;
      else e: for (a = e; gt !== null; ) {
        i = gt;
        var n = i.sibling, s = i.return;
        if (Qu(i), i === a) {
          gt = null;
          break e;
        }
        if (n !== null) {
          n.return = s, gt = n;
          break e;
        }
        gt = s;
      }
    }
  }
  var $0 = {
    getCacheForType: function(e) {
      var t = yt(ot), a = t.data.get(e);
      return a === void 0 && (a = e(), t.data.set(e, a)), a;
    },
    cacheSignal: function() {
      return yt(ot).controller.signal;
    }
  }, W0 = typeof WeakMap == "function" ? WeakMap : Map, Qe = 0, Pe = null, Oe = null, Ue = 0, Ke = 0, Ht = null, qa = !1, Wl = !1, ur = !1, Na = 0, nt = 0, Ha = 0, gl = 0, pr = 0, Bt = 0, Fl = 0, Zi = null, Mt = null, fr = !1, is = 0, tp = 0, ns = 1 / 0, ss = null, Ba = null, mt = 0, Ga = null, Pl = null, wa = 0, hr = 0, mr = null, ap = null, Ki = 0, xr = null;
  function It() {
    return (Qe & 2) !== 0 && Ue !== 0 ? Ue & -Ue : Y.T !== null ? Sr() : jd();
  }
  function lp() {
    if (Bt === 0) if ((Ue & 536870912) === 0 || Le) {
      var e = fn;
      fn <<= 1, (fn & 3932160) === 0 && (fn = 262144), Bt = e;
    } else Bt = 536870912;
    return e = Lt.current, e !== null && (e.flags |= 32), Bt;
  }
  function Ot(e, t, a) {
    (e === Pe && (Ke === 2 || Ke === 9) || e.cancelPendingCommit !== null) && (ei(e, 0), Ya(e, Ue, Bt, !1)), xn(e, a), ((Qe & 2) === 0 || e !== Pe) && (e === Pe && ((Qe & 2) === 0 && (gl |= a), nt === 4 && Ya(e, Ue, Bt, !1)), za(e));
  }
  function ip(e, t, a) {
    if ((Qe & 6) !== 0) throw Error(p(327));
    var i = !a && (t & 127) === 0 && (t & e.expiredLanes) === 0 || fi(e, t), n = i ? eh(e, t) : br(e, t, !0), s = i;
    do {
      if (n === 0) {
        Wl && !i && Ya(e, t, 0, !1);
        break;
      } else {
        if (a = e.current.alternate, s && !F0(a)) {
          n = br(e, t, !1), s = !1;
          continue;
        }
        if (n === 2) {
          if (s = t, e.errorRecoveryDisabledLanes & s) var c = 0;
          else c = e.pendingLanes & -536870913, c = c !== 0 ? c : c & 536870912 ? 536870912 : 0;
          if (c !== 0) {
            t = c;
            e: {
              var u = e;
              n = Zi;
              var v = u.current.memoizedState.isDehydrated;
              if (v && (ei(u, c).flags |= 256), c = br(u, c, !1), c !== 2) {
                if (ur && !v) {
                  u.errorRecoveryDisabledLanes |= s, gl |= s, n = 4;
                  break e;
                }
                s = Mt, Mt = n, s !== null && (Mt === null ? Mt = s : Mt.push.apply(Mt, s));
              }
              n = c;
            }
            if (s = !1, n !== 2) continue;
          }
        }
        if (n === 1) {
          ei(e, 0), Ya(e, t, 0, !0);
          break;
        }
        e: {
          switch (i = e, s = n, s) {
            case 0:
            case 1:
              throw Error(p(345));
            case 4:
              if ((t & 4194048) !== t) break;
            case 6:
              Ya(i, t, Bt, !qa);
              break e;
            case 2:
              Mt = null;
              break;
            case 3:
            case 5:
              break;
            default:
              throw Error(p(329));
          }
          if ((t & 62914560) === t && (n = is + 300 - M(), 10 < n)) {
            if (Ya(i, t, Bt, !qa), mn(i, 0, !0) !== 0) break e;
            wa = t, i.timeoutHandle = Rp(np.bind(null, i, a, Mt, ss, fr, t, Bt, gl, Fl, qa, s, "Throttled", -0, 0), n);
            break e;
          }
          np(i, a, Mt, ss, fr, t, Bt, gl, Fl, qa, s, null, -0, 0);
        }
      }
      break;
    } while (!0);
    za(e);
  }
  function np(e, t, a, i, n, s, c, u, v, D, V, J, U, L) {
    if (e.timeoutHandle = -1, J = t.subtreeFlags, J & 8192 || (J & 16785408) === 16785408) {
      J = {
        stylesheets: null,
        count: 0,
        imgCount: 0,
        imgBytes: 0,
        suspenseyImages: [],
        waitingForImages: !0,
        waitingForViewTransition: !1,
        unsuspend: da
      }, Wu(t, s, J);
      var fe = (s & 62914560) === s ? is - M() : (s & 4194048) === s ? tp - M() : 0;
      if (fe = Dh(J, fe), fe !== null) {
        wa = s, e.cancelPendingCommit = fe(fp.bind(null, e, t, s, a, i, n, c, u, v, V, J, null, U, L)), Ya(e, s, c, !D);
        return;
      }
    }
    fp(e, t, s, a, i, n, c, u, v);
  }
  function F0(e) {
    for (var t = e; ; ) {
      var a = t.tag;
      if ((a === 0 || a === 11 || a === 15) && t.flags & 16384 && (a = t.updateQueue, a !== null && (a = a.stores, a !== null))) for (var i = 0; i < a.length; i++) {
        var n = a[i], s = n.getSnapshot;
        n = n.value;
        try {
          if (!Ut(s(), n)) return !1;
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
  function Ya(e, t, a, i) {
    t &= ~pr, t &= ~gl, e.suspendedLanes |= t, e.pingedLanes &= ~t, i && (e.warmLanes |= t), i = e.expirationTimes;
    for (var n = t; 0 < n; ) {
      var s = 31 - ht(n), c = 1 << s;
      i[s] = -1, n &= ~c;
    }
    a !== 0 && xd(e, a, t);
  }
  function cs() {
    return (Qe & 6) === 0 ? (Ji(0, !1), !1) : !0;
  }
  function gr() {
    if (Oe !== null) {
      if (Ke === 0) var e = Oe.return;
      else e = Oe, fa = sl = null, Oc(e), Ql = null, Ai = 0, e = Oe;
      for (; e !== null; ) Ru(e.alternate, e), e = e.return;
      Oe = null;
    }
  }
  function ei(e, t) {
    var a = e.timeoutHandle;
    a !== -1 && (e.timeoutHandle = -1, xh(a)), a = e.cancelPendingCommit, a !== null && (e.cancelPendingCommit = null, a()), wa = 0, gr(), Pe = e, Oe = a = ua(e.current, null), Ue = t, Ke = 0, Ht = null, qa = !1, Wl = fi(e, t), ur = !1, Fl = Bt = pr = gl = Ha = nt = 0, Mt = Zi = null, fr = !1, (t & 8) !== 0 && (t |= t & 32);
    var i = e.entangledLanes;
    if (i !== 0) for (e = e.entanglements, i &= t; 0 < i; ) {
      var n = 31 - ht(i), s = 1 << n;
      t |= e[n], i &= ~s;
    }
    return Na = t, Cn(), a;
  }
  function sp(e, t) {
    Ee = null, Y.H = qi, t === Vl || t === Rn ? (t = zo(), Ke = 3) : t === yc ? (t = zo(), Ke = 4) : Ke = t === Ic ? 8 : t !== null && typeof t == "object" && typeof t.then == "function" ? 6 : 1, Ht = t, Oe === null && (nt = 1, $n(e, Qt(t, e.current)));
  }
  function cp() {
    var e = Lt.current;
    return e === null ? !0 : (Ue & 4194048) === Ue ? Jt === null : (Ue & 62914560) === Ue || (Ue & 536870912) !== 0 ? e === Jt : !1;
  }
  function rp() {
    var e = Y.H;
    return Y.H = qi, e === null ? qi : e;
  }
  function dp() {
    var e = Y.A;
    return Y.A = $0, e;
  }
  function rs() {
    nt = 4, qa || (Ue & 4194048) !== Ue && Lt.current !== null || (Wl = !0), (Ha & 134217727) === 0 && (gl & 134217727) === 0 || Pe === null || Ya(Pe, Ue, Bt, !1);
  }
  function br(e, t, a) {
    var i = Qe;
    Qe |= 2;
    var n = rp(), s = dp();
    (Pe !== e || Ue !== t) && (ss = null, ei(e, t)), t = !1;
    var c = nt;
    e: do
      try {
        if (Ke !== 0 && Oe !== null) {
          var u = Oe, v = Ht;
          switch (Ke) {
            case 8:
              gr(), c = 6;
              break e;
            case 3:
            case 2:
            case 9:
            case 6:
              Lt.current === null && (t = !0);
              var D = Ke;
              if (Ke = 0, Ht = null, ti(e, u, v, D), a && Wl) {
                c = 0;
                break e;
              }
              break;
            default:
              D = Ke, Ke = 0, Ht = null, ti(e, u, v, D);
          }
        }
        P0(), c = nt;
        break;
      } catch (V) {
        sp(e, V);
      }
    while (!0);
    return t && e.shellSuspendCounter++, fa = sl = null, Qe = i, Y.H = n, Y.A = s, Oe === null && (Pe = null, Ue = 0, Cn()), c;
  }
  function P0() {
    for (; Oe !== null; ) op(Oe);
  }
  function eh(e, t) {
    var a = Qe;
    Qe |= 2;
    var i = rp(), n = dp();
    Pe !== e || Ue !== t ? (ss = null, ns = M() + 500, ei(e, t)) : Wl = fi(e, t);
    e: do
      try {
        if (Ke !== 0 && Oe !== null) {
          t = Oe;
          var s = Ht;
          t: switch (Ke) {
            case 1:
              Ke = 0, Ht = null, ti(e, t, s, 1);
              break;
            case 2:
            case 9:
              if (No(s)) {
                Ke = 0, Ht = null, up(t);
                break;
              }
              t = function() {
                Ke !== 2 && Ke !== 9 || Pe !== e || (Ke = 7), za(e);
              }, s.then(t, t);
              break e;
            case 3:
              Ke = 7;
              break e;
            case 4:
              Ke = 5;
              break e;
            case 7:
              No(s) ? (Ke = 0, Ht = null, up(t)) : (Ke = 0, Ht = null, ti(e, t, s, 7));
              break;
            case 5:
              var c = null;
              switch (Oe.tag) {
                case 26:
                  c = Oe.memoizedState;
                case 5:
                case 27:
                  var u = Oe;
                  if (c ? Wp(c) : u.stateNode.complete) {
                    Ke = 0, Ht = null;
                    var v = u.sibling;
                    if (v !== null) Oe = v;
                    else {
                      var D = u.return;
                      D !== null ? (Oe = D, ds(D)) : Oe = null;
                    }
                    break t;
                  }
              }
              Ke = 0, Ht = null, ti(e, t, s, 5);
              break;
            case 6:
              Ke = 0, Ht = null, ti(e, t, s, 6);
              break;
            case 8:
              gr(), nt = 6;
              break e;
            default:
              throw Error(p(462));
          }
        }
        th();
        break;
      } catch (V) {
        sp(e, V);
      }
    while (!0);
    return fa = sl = null, Y.H = i, Y.A = n, Qe = a, Oe !== null ? 0 : (Pe = null, Ue = 0, Cn(), nt);
  }
  function th() {
    for (; Oe !== null && !Ze(); ) op(Oe);
  }
  function op(e) {
    var t = Du(e.alternate, e, Na);
    e.memoizedProps = e.pendingProps, t === null ? ds(e) : Oe = t;
  }
  function up(e) {
    var t = e, a = t.alternate;
    switch (t.tag) {
      case 15:
      case 0:
        t = Cu(a, t, t.pendingProps, t.type, void 0, Ue);
        break;
      case 11:
        t = Cu(a, t, t.pendingProps, t.type.render, t.ref, Ue);
        break;
      case 5:
        Oc(t);
      default:
        Ru(a, t), t = Oe = po(t, Na), t = Du(a, t, Na);
    }
    e.memoizedProps = e.pendingProps, t === null ? ds(e) : Oe = t;
  }
  function ti(e, t, a, i) {
    fa = sl = null, Oc(t), Ql = null, Ai = 0;
    var n = t.return;
    try {
      if (V0(e, n, t, a, Ue)) {
        nt = 1, $n(e, Qt(a, e.current)), Oe = null;
        return;
      }
    } catch (s) {
      if (n !== null) throw Oe = n, s;
      nt = 1, $n(e, Qt(a, e.current)), Oe = null;
      return;
    }
    t.flags & 32768 ? (Le || i === 1 ? e = !0 : Wl || (Ue & 536870912) !== 0 ? e = !1 : (qa = e = !0, (i === 2 || i === 9 || i === 3 || i === 6) && (i = Lt.current, i !== null && i.tag === 13 && (i.flags |= 16384))), pp(t, e)) : ds(t);
  }
  function ds(e) {
    var t = e;
    do {
      if ((t.flags & 32768) !== 0) {
        pp(t, qa);
        return;
      }
      e = t.return;
      var a = Z0(t.alternate, t, Na);
      if (a !== null) {
        Oe = a;
        return;
      }
      if (t = t.sibling, t !== null) {
        Oe = t;
        return;
      }
      Oe = t = e;
    } while (t !== null);
    nt === 0 && (nt = 5);
  }
  function pp(e, t) {
    do {
      var a = K0(e.alternate, e);
      if (a !== null) {
        a.flags &= 32767, Oe = a;
        return;
      }
      if (a = e.return, a !== null && (a.flags |= 32768, a.subtreeFlags = 0, a.deletions = null), !t && (e = e.sibling, e !== null)) {
        Oe = e;
        return;
      }
      Oe = e = a;
    } while (e !== null);
    nt = 6, Oe = null;
  }
  function fp(e, t, a, i, n, s, c, u, v) {
    e.cancelPendingCommit = null;
    do
      os();
    while (mt !== 0);
    if ((Qe & 6) !== 0) throw Error(p(327));
    if (t !== null) {
      if (t === e.current) throw Error(p(177));
      if (s = t.lanes | t.childLanes, s |= sc, Yf(e, a, s, c, u, v), e === Pe && (Oe = Pe = null, Ue = 0), Pl = t, Ga = e, wa = a, hr = s, mr = n, ap = i, (t.subtreeFlags & 10256) !== 0 || (t.flags & 10256) !== 0 ? (e.callbackNode = null, e.callbackPriority = 0, nh(Be, function() {
        return bp(), null;
      })) : (e.callbackNode = null, e.callbackPriority = 0), i = (t.flags & 13878) !== 0, (t.subtreeFlags & 13878) !== 0 || i) {
        i = Y.T, Y.T = null, n = Q.p, Q.p = 2, c = Qe, Qe |= 4;
        try {
          J0(e, t, a);
        } finally {
          Qe = c, Q.p = n, Y.T = i;
        }
      }
      mt = 1, hp(), mp(), xp();
    }
  }
  function hp() {
    if (mt === 1) {
      mt = 0;
      var e = Ga, t = Pl, a = (t.flags & 13878) !== 0;
      if ((t.subtreeFlags & 13878) !== 0 || a) {
        a = Y.T, Y.T = null;
        var i = Q.p;
        Q.p = 2;
        var n = Qe;
        Qe |= 4;
        try {
          Ju(t, e);
          var s = Er, c = ao(e.containerInfo), u = s.focusedElem, v = s.selectionRange;
          if (c !== u && u && u.ownerDocument && to(u.ownerDocument.documentElement, u)) {
            if (v !== null && tc(u)) {
              var D = v.start, V = v.end;
              if (V === void 0 && (V = D), "selectionStart" in u) u.selectionStart = D, u.selectionEnd = Math.min(V, u.value.length);
              else {
                var J = u.ownerDocument || document, U = J && J.defaultView || window;
                if (U.getSelection) {
                  var L = U.getSelection(), fe = u.textContent.length, Ne = Math.min(v.start, fe), We = v.end === void 0 ? Ne : Math.min(v.end, fe);
                  !L.extend && Ne > We && (c = We, We = Ne, Ne = c);
                  var E = eo(u, Ne), S = eo(u, We);
                  if (E && S && (L.rangeCount !== 1 || L.anchorNode !== E.node || L.anchorOffset !== E.offset || L.focusNode !== S.node || L.focusOffset !== S.offset)) {
                    var O = J.createRange();
                    O.setStart(E.node, E.offset), L.removeAllRanges(), Ne > We ? (L.addRange(O), L.extend(S.node, S.offset)) : (O.setEnd(S.node, S.offset), L.addRange(O));
                  }
                }
              }
            }
            for (J = [], L = u; L = L.parentNode; ) L.nodeType === 1 && J.push({
              element: L,
              left: L.scrollLeft,
              top: L.scrollTop
            });
            for (typeof u.focus == "function" && u.focus(), u = 0; u < J.length; u++) {
              var Z = J[u];
              Z.element.scrollLeft = Z.left, Z.element.scrollTop = Z.top;
            }
          }
          Ss = !!Cr, Er = Cr = null;
        } finally {
          Qe = n, Q.p = i, Y.T = a;
        }
      }
      e.current = t, mt = 2;
    }
  }
  function mp() {
    if (mt === 2) {
      mt = 0;
      var e = Ga, t = Pl, a = (t.flags & 8772) !== 0;
      if ((t.subtreeFlags & 8772) !== 0 || a) {
        a = Y.T, Y.T = null;
        var i = Q.p;
        Q.p = 2;
        var n = Qe;
        Qe |= 4;
        try {
          Vu(e, t.alternate, t);
        } finally {
          Qe = n, Q.p = i, Y.T = a;
        }
      }
      mt = 3;
    }
  }
  function xp() {
    if (mt === 4 || mt === 3) {
      mt = 0, Dt();
      var e = Ga, t = Pl, a = wa, i = ap;
      (t.subtreeFlags & 10256) !== 0 || (t.flags & 10256) !== 0 ? mt = 5 : (mt = 0, Pl = Ga = null, gp(e, e.pendingLanes));
      var n = e.pendingLanes;
      if (n === 0 && (Ba = null), Rs(a), t = t.stateNode, Fe && typeof Fe.onCommitFiberRoot == "function") try {
        Fe.onCommitFiberRoot(st, t, void 0, (t.current.flags & 128) === 128);
      } catch {
      }
      if (i !== null) {
        t = Y.T, n = Q.p, Q.p = 2, Y.T = null;
        try {
          for (var s = e.onRecoverableError, c = 0; c < i.length; c++) {
            var u = i[c];
            s(u.value, { componentStack: u.stack });
          }
        } finally {
          Y.T = t, Q.p = n;
        }
      }
      (wa & 3) !== 0 && os(), za(e), n = e.pendingLanes, (a & 261930) !== 0 && (n & 42) !== 0 ? e === xr ? Ki++ : (Ki = 0, xr = e) : Ki = 0, Ji(0, !1);
    }
  }
  function gp(e, t) {
    (e.pooledCacheLanes &= t) === 0 && (t = e.pooledCache, t != null && (e.pooledCache = null, Ci(t)));
  }
  function os() {
    return hp(), mp(), xp(), bp();
  }
  function bp() {
    if (mt !== 5) return !1;
    var e = Ga, t = hr;
    hr = 0;
    var a = Rs(wa), i = Y.T, n = Q.p;
    try {
      Q.p = 32 > a ? 32 : a, Y.T = null, a = mr, mr = null;
      var s = Ga, c = wa;
      if (mt = 0, Pl = Ga = null, wa = 0, (Qe & 6) !== 0) throw Error(p(331));
      var u = Qe;
      if (Qe |= 4, Pu(s.current), $u(s, s.current, c, a), Qe = u, Ji(0, !1), Fe && typeof Fe.onPostCommitFiberRoot == "function") try {
        Fe.onPostCommitFiberRoot(st, s);
      } catch {
      }
      return !0;
    } finally {
      Q.p = n, Y.T = i, gp(e, t);
    }
  }
  function vp(e, t, a) {
    t = Qt(a, t), t = Jc(e.stateNode, t, 2), e = fl(e, t, 2), e !== null && (xn(e, 2), za(e));
  }
  function Je(e, t, a) {
    if (e.tag === 3) vp(e, e, a);
    else for (; t !== null; ) {
      if (t.tag === 3) {
        vp(t, e, a);
        break;
      } else if (t.tag === 1) {
        var i = t.stateNode;
        if (typeof t.type.getDerivedStateFromError == "function" || typeof i.componentDidCatch == "function" && (Ba === null || !Ba.has(i))) {
          e = Qt(a, e), a = ju(2), i = fl(t, a, 2), i !== null && (yu(a, i, t, e), xn(i, 2), za(i));
          break;
        }
      }
      t = t.return;
    }
  }
  function vr(e, t, a) {
    var i = e.pingCache;
    if (i === null) {
      i = e.pingCache = new W0();
      var n = /* @__PURE__ */ new Set();
      i.set(t, n);
    } else n = i.get(t), n === void 0 && (n = /* @__PURE__ */ new Set(), i.set(t, n));
    n.has(a) || (ur = !0, n.add(a), e = ah.bind(null, e, t, a), t.then(e, e));
  }
  function ah(e, t, a) {
    var i = e.pingCache;
    i !== null && i.delete(t), e.pingedLanes |= e.suspendedLanes & a, e.warmLanes &= ~a, Pe === e && (Ue & a) === a && (nt === 4 || nt === 3 && (Ue & 62914560) === Ue && 300 > M() - is ? (Qe & 2) === 0 && ei(e, 0) : pr |= a, Fl === Ue && (Fl = 0)), za(e);
  }
  function jp(e, t) {
    t === 0 && (t = md()), e = ll(e, t), e !== null && (xn(e, t), za(e));
  }
  function lh(e) {
    var t = e.memoizedState, a = 0;
    t !== null && (a = t.retryLane), jp(e, a);
  }
  function ih(e, t) {
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
        throw Error(p(314));
    }
    i !== null && i.delete(t), jp(e, a);
  }
  function nh(e, t) {
    return T(e, t);
  }
  var us = null, ai = null, jr = !1, ps = !1, yr = !1, Va = 0;
  function za(e) {
    e !== ai && e.next === null && (ai === null ? us = ai = e : ai = ai.next = e), ps = !0, jr || (jr = !0, ch());
  }
  function Ji(e, t) {
    if (!yr && ps) {
      yr = !0;
      do
        for (var a = !1, i = us; i !== null; ) {
          if (!t) if (e !== 0) {
            var n = i.pendingLanes;
            if (n === 0) var s = 0;
            else {
              var c = i.suspendedLanes, u = i.pingedLanes;
              s = (1 << 31 - ht(42 | e) + 1) - 1, s &= n & ~(c & ~u), s = s & 201326741 ? s & 201326741 | 1 : s ? s | 2 : 0;
            }
            s !== 0 && (a = !0, wp(i, s));
          } else s = Ue, s = mn(i, i === Pe ? s : 0, i.cancelPendingCommit !== null || i.timeoutHandle !== -1), (s & 3) === 0 || fi(i, s) || (a = !0, wp(i, s));
          i = i.next;
        }
      while (a);
      yr = !1;
    }
  }
  function sh() {
    yp();
  }
  function yp() {
    ps = jr = !1;
    var e = 0;
    Va !== 0 && mh() && (e = Va);
    for (var t = M(), a = null, i = us; i !== null; ) {
      var n = i.next, s = Sp(i, t);
      s === 0 ? (i.next = null, a === null ? us = n : a.next = n, n === null && (ai = a)) : (a = i, (e !== 0 || (s & 3) !== 0) && (ps = !0)), i = n;
    }
    mt !== 0 && mt !== 5 || Ji(e, !1), Va !== 0 && (Va = 0);
  }
  function Sp(e, t) {
    for (var a = e.suspendedLanes, i = e.pingedLanes, n = e.expirationTimes, s = e.pendingLanes & -62914561; 0 < s; ) {
      var c = 31 - ht(s), u = 1 << c, v = n[c];
      v === -1 ? ((u & a) === 0 || (u & i) !== 0) && (n[c] = Gf(u, t)) : v <= t && (e.expiredLanes |= u), s &= ~u;
    }
    if (t = Pe, a = Ue, a = mn(e, e === t ? a : 0, e.cancelPendingCommit !== null || e.timeoutHandle !== -1), i = e.callbackNode, a === 0 || e === t && (Ke === 2 || Ke === 9) || e.cancelPendingCommit !== null) return i !== null && i !== null && we(i), e.callbackNode = null, e.callbackPriority = 0;
    if ((a & 3) === 0 || fi(e, a)) {
      if (t = a & -a, t === e.callbackPriority) return t;
      switch (i !== null && we(i), Rs(a)) {
        case 2:
        case 8:
          a = Ce;
          break;
        case 32:
          a = Be;
          break;
        case 268435456:
          a = m;
          break;
        default:
          a = Be;
      }
      return i = Np.bind(null, e), a = T(a, i), e.callbackPriority = t, e.callbackNode = a, t;
    }
    return i !== null && i !== null && we(i), e.callbackPriority = 2, e.callbackNode = null, 2;
  }
  function Np(e, t) {
    if (mt !== 0 && mt !== 5) return e.callbackNode = null, e.callbackPriority = 0, null;
    var a = e.callbackNode;
    if (os() && e.callbackNode !== a) return null;
    var i = Ue;
    return i = mn(e, e === Pe ? i : 0, e.cancelPendingCommit !== null || e.timeoutHandle !== -1), i === 0 ? null : (ip(e, i, t), Sp(e, M()), e.callbackNode != null && e.callbackNode === a ? Np.bind(null, e) : null);
  }
  function wp(e, t) {
    if (os()) return null;
    ip(e, t, !0);
  }
  function ch() {
    gh(function() {
      (Qe & 6) !== 0 ? T(je, sh) : yp();
    });
  }
  function Sr() {
    if (Va === 0) {
      var e = Gl;
      e === 0 && (e = pn, pn <<= 1, (pn & 261888) === 0 && (pn = 256)), Va = e;
    }
    return Va;
  }
  function zp(e) {
    return e == null || typeof e == "symbol" || typeof e == "boolean" ? null : typeof e == "function" ? e : jn("" + e);
  }
  function kp(e, t) {
    var a = t.ownerDocument.createElement("input");
    return a.name = t.name, a.value = t.value, e.id && a.setAttribute("form", e.id), t.parentNode.insertBefore(a, t), e = new FormData(e), a.parentNode.removeChild(a), e;
  }
  function rh(e, t, a, i, n) {
    if (t === "submit" && a && a.stateNode === n) {
      var s = zp((n[_t] || null).action), c = i.submitter;
      c && (t = (t = c[_t] || null) ? zp(t.formAction) : c.getAttribute("formAction"), t !== null && (s = t, c = null));
      var u = new wn("action", "action", null, i, n);
      e.push({
        event: u,
        listeners: [{
          instance: null,
          listener: function() {
            if (i.defaultPrevented) {
              if (Va !== 0) {
                var v = c ? kp(n, c) : new FormData(n);
                Yc(a, {
                  pending: !0,
                  data: v,
                  method: n.method,
                  action: s
                }, null, v);
              }
            } else typeof s == "function" && (u.preventDefault(), v = c ? kp(n, c) : new FormData(n), Yc(a, {
              pending: !0,
              data: v,
              method: n.method,
              action: s
            }, s, v));
          },
          currentTarget: n
        }]
      });
    }
  }
  for (var Nr = 0; Nr < nc.length; Nr++) {
    var wr = nc[Nr];
    ea(wr.toLowerCase(), "on" + (wr[0].toUpperCase() + wr.slice(1)));
  }
  ea(no, "onAnimationEnd"), ea(so, "onAnimationIteration"), ea(co, "onAnimationStart"), ea("dblclick", "onDoubleClick"), ea("focusin", "onFocus"), ea("focusout", "onBlur"), ea(N0, "onTransitionRun"), ea(w0, "onTransitionStart"), ea(z0, "onTransitionCancel"), ea(ro, "onTransitionEnd"), _l("onMouseEnter", ["mouseout", "mouseover"]), _l("onMouseLeave", ["mouseout", "mouseover"]), _l("onPointerEnter", ["pointerout", "pointerover"]), _l("onPointerLeave", ["pointerout", "pointerover"]), Pa("onChange", "change click focusin focusout input keydown keyup selectionchange".split(" ")), Pa("onSelect", "focusout contextmenu dragend focusin keydown keyup mousedown mouseup selectionchange".split(" ")), Pa("onBeforeInput", [
    "compositionend",
    "keypress",
    "textInput",
    "paste"
  ]), Pa("onCompositionEnd", "compositionend focusout keydown keypress keyup mousedown".split(" ")), Pa("onCompositionStart", "compositionstart focusout keydown keypress keyup mousedown".split(" ")), Pa("onCompositionUpdate", "compositionupdate focusout keydown keypress keyup mousedown".split(" "));
  var Ii = "abort canplay canplaythrough durationchange emptied encrypted ended error loadeddata loadedmetadata loadstart pause play playing progress ratechange resize seeked seeking stalled suspend timeupdate volumechange waiting".split(" "), dh = new Set("beforetoggle cancel close invalid load scroll scrollend toggle".split(" ").concat(Ii));
  function _p(e, t) {
    t = (t & 4) !== 0;
    for (var a = 0; a < e.length; a++) {
      var i = e[a], n = i.event;
      i = i.listeners;
      e: {
        var s = void 0;
        if (t) for (var c = i.length - 1; 0 <= c; c--) {
          var u = i[c], v = u.instance, D = u.currentTarget;
          if (u = u.listener, v !== s && n.isPropagationStopped()) break e;
          s = u, n.currentTarget = D;
          try {
            s(n);
          } catch (V) {
            _n(V);
          }
          n.currentTarget = null, s = v;
        }
        else for (c = 0; c < i.length; c++) {
          if (u = i[c], v = u.instance, D = u.currentTarget, u = u.listener, v !== s && n.isPropagationStopped()) break e;
          s = u, n.currentTarget = D;
          try {
            s(n);
          } catch (V) {
            _n(V);
          }
          n.currentTarget = null, s = v;
        }
      }
    }
  }
  function De(e, t) {
    var a = t[Ls];
    a === void 0 && (a = t[Ls] = /* @__PURE__ */ new Set());
    var i = e + "__bubble";
    a.has(i) || (Ep(t, e, 2, !1), a.add(i));
  }
  function zr(e, t, a) {
    var i = 0;
    t && (i |= 4), Ep(a, e, i, t);
  }
  var fs = "_reactListening" + Math.random().toString(36).slice(2);
  function Cp(e) {
    if (!e[fs]) {
      e[fs] = !0, Nd.forEach(function(a) {
        a !== "selectionchange" && (dh.has(a) || zr(a, !1, e), zr(a, !0, e));
      });
      var t = e.nodeType === 9 ? e : e.ownerDocument;
      t === null || t[fs] || (t[fs] = !0, zr("selectionchange", !1, t));
    }
  }
  function Ep(e, t, a, i) {
    switch (af(t)) {
      case 2:
        var n = Hh;
        break;
      case 8:
        n = Bh;
        break;
      default:
        n = Br;
    }
    a = n.bind(null, t, a, e), n = void 0, !Zs || t !== "touchstart" && t !== "touchmove" && t !== "wheel" || (n = !0), i ? n !== void 0 ? e.addEventListener(t, a, {
      capture: !0,
      passive: n
    }) : e.addEventListener(t, a, !0) : n !== void 0 ? e.addEventListener(t, a, { passive: n }) : e.addEventListener(t, a, !1);
  }
  function kr(e, t, a, i, n) {
    var s = i;
    if ((t & 1) === 0 && (t & 2) === 0 && i !== null) e: for (; ; ) {
      if (i === null) return;
      var c = i.tag;
      if (c === 3 || c === 4) {
        var u = i.stateNode.containerInfo;
        if (u === n) break;
        if (c === 4) for (c = i.return; c !== null; ) {
          var v = c.tag;
          if ((v === 3 || v === 4) && c.stateNode.containerInfo === n) return;
          c = c.return;
        }
        for (; u !== null; ) {
          if (c = wl(u), c === null) return;
          if (v = c.tag, v === 5 || v === 6 || v === 26 || v === 27) {
            i = s = c;
            continue e;
          }
          u = u.parentNode;
        }
      }
      i = i.return;
    }
    Ud(function() {
      var D = s, V = Qs(a), J = [];
      e: {
        var U = oo.get(e);
        if (U !== void 0) {
          var L = wn, fe = e;
          switch (e) {
            case "keypress":
              if (Sn(a) === 0) break e;
            case "keydown":
            case "keyup":
              L = s0;
              break;
            case "focusin":
              fe = "focus", L = $s;
              break;
            case "focusout":
              fe = "blur", L = $s;
              break;
            case "beforeblur":
            case "afterblur":
              L = $s;
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
              L = qd;
              break;
            case "drag":
            case "dragend":
            case "dragenter":
            case "dragexit":
            case "dragleave":
            case "dragover":
            case "dragstart":
            case "drop":
              L = Pf;
              break;
            case "touchcancel":
            case "touchend":
            case "touchmove":
            case "touchstart":
              L = c0;
              break;
            case no:
            case so:
            case co:
              L = e0;
              break;
            case ro:
              L = r0;
              break;
            case "scroll":
            case "scrollend":
              L = Ff;
              break;
            case "wheel":
              L = d0;
              break;
            case "copy":
            case "cut":
            case "paste":
              L = t0;
              break;
            case "gotpointercapture":
            case "lostpointercapture":
            case "pointercancel":
            case "pointerdown":
            case "pointermove":
            case "pointerout":
            case "pointerover":
            case "pointerup":
              L = Bd;
              break;
            case "toggle":
            case "beforetoggle":
              L = o0;
          }
          var Ne = (t & 4) !== 0, We = !Ne && (e === "scroll" || e === "scrollend"), E = Ne ? U !== null ? U + "Capture" : null : U;
          Ne = [];
          for (var S = D, O; S !== null; ) {
            var Z = S;
            if (O = Z.stateNode, Z = Z.tag, Z !== 5 && Z !== 26 && Z !== 27 || O === null || E === null || (Z = gi(S, E), Z != null && Ne.push($i(S, Z, O))), We) break;
            S = S.return;
          }
          0 < Ne.length && (U = new L(U, fe, null, a, V), J.push({
            event: U,
            listeners: Ne
          }));
        }
      }
      if ((t & 7) === 0) {
        e: {
          if (U = e === "mouseover" || e === "pointerover", L = e === "mouseout" || e === "pointerout", U && a !== Vs && (fe = a.relatedTarget || a.fromElement) && (wl(fe) || fe[hi])) break e;
          if ((L || U) && (U = V.window === V ? V : (U = V.ownerDocument) ? U.defaultView || U.parentWindow : window, L ? (fe = a.relatedTarget || a.toElement, L = D, fe = fe ? wl(fe) : null, fe !== null && (We = x(fe), Ne = fe.tag, fe !== We || Ne !== 5 && Ne !== 27 && Ne !== 6) && (fe = null)) : (L = null, fe = D), L !== fe)) {
            if (Ne = qd, Z = "onMouseLeave", E = "onMouseEnter", S = "mouse", (e === "pointerout" || e === "pointerover") && (Ne = Bd, Z = "onPointerLeave", E = "onPointerEnter", S = "pointer"), We = L == null ? U : xi(L), O = fe == null ? U : xi(fe), U = new Ne(Z, S + "leave", L, a, V), U.target = We, U.relatedTarget = O, Z = null, wl(V) === D && (Ne = new Ne(E, S + "enter", fe, a, V), Ne.target = O, Ne.relatedTarget = We, Z = Ne), We = Z, L && fe) t: {
              for (Ne = oh, E = L, S = fe, O = 0, Z = E; Z; Z = Ne(Z)) O++;
              Z = 0;
              for (var be = S; be; be = Ne(be)) Z++;
              for (; 0 < O - Z; ) E = Ne(E), O--;
              for (; 0 < Z - O; ) S = Ne(S), Z--;
              for (; O--; ) {
                if (E === S || S !== null && E === S.alternate) {
                  Ne = E;
                  break t;
                }
                E = Ne(E), S = Ne(S);
              }
              Ne = null;
            }
            else Ne = null;
            L !== null && Ap(J, U, L, Ne, !1), fe !== null && We !== null && Ap(J, We, fe, Ne, !0);
          }
        }
        e: {
          if (U = D ? xi(D) : window, L = U.nodeName && U.nodeName.toLowerCase(), L === "select" || L === "input" && U.type === "file") var Ye = Jd;
          else if (Zd(U)) if (Id) Ye = j0;
          else {
            Ye = b0;
            var xe = g0;
          }
          else L = U.nodeName, !L || L.toLowerCase() !== "input" || U.type !== "checkbox" && U.type !== "radio" ? D && Ys(D.elementType) && (Ye = Jd) : Ye = v0;
          if (Ye && (Ye = Ye(e, D))) {
            Kd(J, Ye, a, V);
            break e;
          }
          xe && xe(e, U, D), e === "focusout" && D && U.type === "number" && D.memoizedProps.value != null && Gs(U, "number", U.value);
        }
        switch (xe = D ? xi(D) : window, e) {
          case "focusin":
            (Zd(xe) || xe.contentEditable === "true") && (Ol = xe, ac = D, zi = null);
            break;
          case "focusout":
            zi = ac = Ol = null;
            break;
          case "mousedown":
            lc = !0;
            break;
          case "contextmenu":
          case "mouseup":
          case "dragend":
            lc = !1, lo(J, a, V);
            break;
          case "selectionchange":
            if (S0) break;
          case "keydown":
          case "keyup":
            lo(J, a, V);
        }
        var Te;
        if (Fs) e: {
          switch (e) {
            case "compositionstart":
              var Re = "onCompositionStart";
              break e;
            case "compositionend":
              Re = "onCompositionEnd";
              break e;
            case "compositionupdate":
              Re = "onCompositionUpdate";
              break e;
          }
          Re = void 0;
        }
        else Ml ? Qd(e, a) && (Re = "onCompositionEnd") : e === "keydown" && a.keyCode === 229 && (Re = "onCompositionStart");
        Re && (Gd && a.locale !== "ko" && (Ml || Re !== "onCompositionStart" ? Re === "onCompositionEnd" && Ml && (Te = Rd()) : (Ea = V, Ks = "value" in Ea ? Ea.value : Ea.textContent, Ml = !0)), xe = hs(D, Re), 0 < xe.length && (Re = new Hd(Re, e, null, a, V), J.push({
          event: Re,
          listeners: xe
        }), Te ? Re.data = Te : (Te = Xd(a), Te !== null && (Re.data = Te)))), (Te = p0 ? f0(e, a) : h0(e, a)) && (Re = hs(D, "onBeforeInput"), 0 < Re.length && (xe = new Hd("onBeforeInput", "beforeinput", null, a, V), J.push({
          event: xe,
          listeners: Re
        }), xe.data = Te)), rh(J, e, D, a, V);
      }
      _p(J, t);
    });
  }
  function $i(e, t, a) {
    return {
      instance: e,
      listener: t,
      currentTarget: a
    };
  }
  function hs(e, t) {
    for (var a = t + "Capture", i = []; e !== null; ) {
      var n = e, s = n.stateNode;
      if (n = n.tag, n !== 5 && n !== 26 && n !== 27 || s === null || (n = gi(e, a), n != null && i.unshift($i(e, n, s)), n = gi(e, t), n != null && i.push($i(e, n, s))), e.tag === 3) return i;
      e = e.return;
    }
    return [];
  }
  function oh(e) {
    if (e === null) return null;
    do
      e = e.return;
    while (e && e.tag !== 5 && e.tag !== 27);
    return e || null;
  }
  function Ap(e, t, a, i, n) {
    for (var s = t._reactName, c = []; a !== null && a !== i; ) {
      var u = a, v = u.alternate, D = u.stateNode;
      if (u = u.tag, v !== null && v === i) break;
      u !== 5 && u !== 26 && u !== 27 || D === null || (v = D, n ? (D = gi(a, s), D != null && c.unshift($i(a, D, v))) : n || (D = gi(a, s), D != null && c.push($i(a, D, v)))), a = a.return;
    }
    c.length !== 0 && e.push({
      event: t,
      listeners: c
    });
  }
  var uh = /\r\n?/g, ph = /\u0000|\uFFFD/g;
  function Tp(e) {
    return (typeof e == "string" ? e : "" + e).replace(uh, `
`).replace(ph, "");
  }
  function Mp(e, t) {
    return t = Tp(t), Tp(e) === t;
  }
  function $e(e, t, a, i, n, s) {
    switch (a) {
      case "children":
        typeof i == "string" ? t === "body" || t === "textarea" && i === "" || El(e, i) : (typeof i == "number" || typeof i == "bigint") && t !== "body" && El(e, "" + i);
        break;
      case "className":
        bn(e, "class", i);
        break;
      case "tabIndex":
        bn(e, "tabindex", i);
        break;
      case "dir":
      case "role":
      case "viewBox":
      case "width":
      case "height":
        bn(e, a, i);
        break;
      case "style":
        Od(e, i, s);
        break;
      case "data":
        if (t !== "object") {
          bn(e, "data", i);
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
        i = jn("" + i), e.setAttribute(a, i);
        break;
      case "action":
      case "formAction":
        if (typeof i == "function") {
          e.setAttribute(a, "javascript:throw new Error('A React form was unexpectedly submitted. If you called form.submit() manually, consider using form.requestSubmit() instead. If you\\'re trying to use event.stopPropagation() in a submit event handler, consider also calling event.preventDefault().')");
          break;
        } else typeof s == "function" && (a === "formAction" ? (t !== "input" && $e(e, t, "name", n.name, n, null), $e(e, t, "formEncType", n.formEncType, n, null), $e(e, t, "formMethod", n.formMethod, n, null), $e(e, t, "formTarget", n.formTarget, n, null)) : ($e(e, t, "encType", n.encType, n, null), $e(e, t, "method", n.method, n, null), $e(e, t, "target", n.target, n, null)));
        if (i == null || typeof i == "symbol" || typeof i == "boolean") {
          e.removeAttribute(a);
          break;
        }
        i = jn("" + i), e.setAttribute(a, i);
        break;
      case "onClick":
        i != null && (e.onclick = da);
        break;
      case "onScroll":
        i != null && De("scroll", e);
        break;
      case "onScrollEnd":
        i != null && De("scrollend", e);
        break;
      case "dangerouslySetInnerHTML":
        if (i != null) {
          if (typeof i != "object" || !("__html" in i)) throw Error(p(61));
          if (a = i.__html, a != null) {
            if (n.children != null) throw Error(p(60));
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
        a = jn("" + i), e.setAttributeNS("http://www.w3.org/1999/xlink", "xlink:href", a);
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
        De("beforetoggle", e), De("toggle", e), gn(e, "popover", i);
        break;
      case "xlinkActuate":
        ra(e, "http://www.w3.org/1999/xlink", "xlink:actuate", i);
        break;
      case "xlinkArcrole":
        ra(e, "http://www.w3.org/1999/xlink", "xlink:arcrole", i);
        break;
      case "xlinkRole":
        ra(e, "http://www.w3.org/1999/xlink", "xlink:role", i);
        break;
      case "xlinkShow":
        ra(e, "http://www.w3.org/1999/xlink", "xlink:show", i);
        break;
      case "xlinkTitle":
        ra(e, "http://www.w3.org/1999/xlink", "xlink:title", i);
        break;
      case "xlinkType":
        ra(e, "http://www.w3.org/1999/xlink", "xlink:type", i);
        break;
      case "xmlBase":
        ra(e, "http://www.w3.org/XML/1998/namespace", "xml:base", i);
        break;
      case "xmlLang":
        ra(e, "http://www.w3.org/XML/1998/namespace", "xml:lang", i);
        break;
      case "xmlSpace":
        ra(e, "http://www.w3.org/XML/1998/namespace", "xml:space", i);
        break;
      case "is":
        gn(e, "is", i);
        break;
      case "innerText":
      case "textContent":
        break;
      default:
        (!(2 < a.length) || a[0] !== "o" && a[0] !== "O" || a[1] !== "n" && a[1] !== "N") && (a = $f.get(a) || a, gn(e, a, i));
    }
  }
  function _r(e, t, a, i, n, s) {
    switch (a) {
      case "style":
        Od(e, i, s);
        break;
      case "dangerouslySetInnerHTML":
        if (i != null) {
          if (typeof i != "object" || !("__html" in i)) throw Error(p(61));
          if (a = i.__html, a != null) {
            if (n.children != null) throw Error(p(60));
            e.innerHTML = a;
          }
        }
        break;
      case "children":
        typeof i == "string" ? El(e, i) : (typeof i == "number" || typeof i == "bigint") && El(e, "" + i);
        break;
      case "onScroll":
        i != null && De("scroll", e);
        break;
      case "onScrollEnd":
        i != null && De("scrollend", e);
        break;
      case "onClick":
        i != null && (e.onclick = da);
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
        if (!wd.hasOwnProperty(a)) e: {
          if (a[0] === "o" && a[1] === "n" && (n = a.endsWith("Capture"), t = a.slice(2, n ? a.length - 7 : void 0), s = e[_t] || null, s = s != null ? s[a] : null, typeof s == "function" && e.removeEventListener(t, s, n), typeof i == "function")) {
            typeof s != "function" && s !== null && (a in e ? e[a] = null : e.hasAttribute(a) && e.removeAttribute(a)), e.addEventListener(t, i, n);
            break e;
          }
          a in e ? e[a] = i : i === !0 ? e.setAttribute(a, "") : gn(e, a, i);
        }
    }
  }
  function Nt(e, t, a) {
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
        De("error", e), De("load", e);
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
              throw Error(p(137, t));
            default:
              $e(e, t, s, c, a, null);
          }
        }
        n && $e(e, t, "srcSet", a.srcSet, a, null), i && $e(e, t, "src", a.src, a, null);
        return;
      case "input":
        De("invalid", e);
        var u = s = c = n = null, v = null, D = null;
        for (i in a) if (a.hasOwnProperty(i)) {
          var V = a[i];
          if (V != null) switch (i) {
            case "name":
              n = V;
              break;
            case "type":
              c = V;
              break;
            case "checked":
              v = V;
              break;
            case "defaultChecked":
              D = V;
              break;
            case "value":
              s = V;
              break;
            case "defaultValue":
              u = V;
              break;
            case "children":
            case "dangerouslySetInnerHTML":
              if (V != null) throw Error(p(137, t));
              break;
            default:
              $e(e, t, i, V, a, null);
          }
        }
        Ed(e, s, u, v, D, c, n, !1);
        return;
      case "select":
        De("invalid", e), i = c = s = null;
        for (n in a) if (a.hasOwnProperty(n) && (u = a[n], u != null)) switch (n) {
          case "value":
            s = u;
            break;
          case "defaultValue":
            c = u;
            break;
          case "multiple":
            i = u;
          default:
            $e(e, t, n, u, a, null);
        }
        t = s, a = c, e.multiple = !!i, t != null ? Cl(e, !!i, t, !1) : a != null && Cl(e, !!i, a, !0);
        return;
      case "textarea":
        De("invalid", e), s = n = i = null;
        for (c in a) if (a.hasOwnProperty(c) && (u = a[c], u != null)) switch (c) {
          case "value":
            i = u;
            break;
          case "defaultValue":
            n = u;
            break;
          case "children":
            s = u;
            break;
          case "dangerouslySetInnerHTML":
            if (u != null) throw Error(p(91));
            break;
          default:
            $e(e, t, c, u, a, null);
        }
        Td(e, i, n, s);
        return;
      case "option":
        for (v in a) a.hasOwnProperty(v) && (i = a[v], i != null) && (v === "selected" ? e.selected = i && typeof i != "function" && typeof i != "symbol" : $e(e, t, v, i, a, null));
        return;
      case "dialog":
        De("beforetoggle", e), De("toggle", e), De("cancel", e), De("close", e);
        break;
      case "iframe":
      case "object":
        De("load", e);
        break;
      case "video":
      case "audio":
        for (i = 0; i < Ii.length; i++) De(Ii[i], e);
        break;
      case "image":
        De("error", e), De("load", e);
        break;
      case "details":
        De("toggle", e);
        break;
      case "embed":
      case "source":
      case "link":
        De("error", e), De("load", e);
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
        for (D in a) if (a.hasOwnProperty(D) && (i = a[D], i != null)) switch (D) {
          case "children":
          case "dangerouslySetInnerHTML":
            throw Error(p(137, t));
          default:
            $e(e, t, D, i, a, null);
        }
        return;
      default:
        if (Ys(t)) {
          for (V in a) a.hasOwnProperty(V) && (i = a[V], i !== void 0 && _r(e, t, V, i, a, void 0));
          return;
        }
    }
    for (u in a) a.hasOwnProperty(u) && (i = a[u], i != null && $e(e, t, u, i, a, null));
  }
  function fh(e, t, a, i) {
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
        var n = null, s = null, c = null, u = null, v = null, D = null, V = null;
        for (L in a) {
          var J = a[L];
          if (a.hasOwnProperty(L) && J != null) switch (L) {
            case "checked":
              break;
            case "value":
              break;
            case "defaultValue":
              v = J;
            default:
              i.hasOwnProperty(L) || $e(e, t, L, null, i, J);
          }
        }
        for (var U in i) {
          var L = i[U];
          if (J = a[U], i.hasOwnProperty(U) && (L != null || J != null)) switch (U) {
            case "type":
              s = L;
              break;
            case "name":
              n = L;
              break;
            case "checked":
              D = L;
              break;
            case "defaultChecked":
              V = L;
              break;
            case "value":
              c = L;
              break;
            case "defaultValue":
              u = L;
              break;
            case "children":
            case "dangerouslySetInnerHTML":
              if (L != null) throw Error(p(137, t));
              break;
            default:
              L !== J && $e(e, t, U, L, i, J);
          }
        }
        Bs(e, c, u, v, D, V, s, n);
        return;
      case "select":
        L = c = u = U = null;
        for (s in a) if (v = a[s], a.hasOwnProperty(s) && v != null) switch (s) {
          case "value":
            break;
          case "multiple":
            L = v;
          default:
            i.hasOwnProperty(s) || $e(e, t, s, null, i, v);
        }
        for (n in i) if (s = i[n], v = a[n], i.hasOwnProperty(n) && (s != null || v != null)) switch (n) {
          case "value":
            U = s;
            break;
          case "defaultValue":
            u = s;
            break;
          case "multiple":
            c = s;
          default:
            s !== v && $e(e, t, n, s, i, v);
        }
        t = u, a = c, i = L, U != null ? Cl(e, !!a, U, !1) : !!i != !!a && (t != null ? Cl(e, !!a, t, !0) : Cl(e, !!a, a ? [] : "", !1));
        return;
      case "textarea":
        L = U = null;
        for (u in a) if (n = a[u], a.hasOwnProperty(u) && n != null && !i.hasOwnProperty(u)) switch (u) {
          case "value":
            break;
          case "children":
            break;
          default:
            $e(e, t, u, null, i, n);
        }
        for (c in i) if (n = i[c], s = a[c], i.hasOwnProperty(c) && (n != null || s != null)) switch (c) {
          case "value":
            U = n;
            break;
          case "defaultValue":
            L = n;
            break;
          case "children":
            break;
          case "dangerouslySetInnerHTML":
            if (n != null) throw Error(p(91));
            break;
          default:
            n !== s && $e(e, t, c, n, i, s);
        }
        Ad(e, U, L);
        return;
      case "option":
        for (var fe in a) U = a[fe], a.hasOwnProperty(fe) && U != null && !i.hasOwnProperty(fe) && (fe === "selected" ? e.selected = !1 : $e(e, t, fe, null, i, U));
        for (v in i) U = i[v], L = a[v], i.hasOwnProperty(v) && U !== L && (U != null || L != null) && (v === "selected" ? e.selected = U && typeof U != "function" && typeof U != "symbol" : $e(e, t, v, U, i, L));
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
        for (var Ne in a) U = a[Ne], a.hasOwnProperty(Ne) && U != null && !i.hasOwnProperty(Ne) && $e(e, t, Ne, null, i, U);
        for (D in i) if (U = i[D], L = a[D], i.hasOwnProperty(D) && U !== L && (U != null || L != null)) switch (D) {
          case "children":
          case "dangerouslySetInnerHTML":
            if (U != null) throw Error(p(137, t));
            break;
          default:
            $e(e, t, D, U, i, L);
        }
        return;
      default:
        if (Ys(t)) {
          for (var We in a) U = a[We], a.hasOwnProperty(We) && U !== void 0 && !i.hasOwnProperty(We) && _r(e, t, We, void 0, i, U);
          for (V in i) U = i[V], L = a[V], !i.hasOwnProperty(V) || U === L || U === void 0 && L === void 0 || _r(e, t, V, U, i, L);
          return;
        }
    }
    for (var E in a) U = a[E], a.hasOwnProperty(E) && U != null && !i.hasOwnProperty(E) && $e(e, t, E, null, i, U);
    for (J in i) U = i[J], L = a[J], !i.hasOwnProperty(J) || U === L || U == null && L == null || $e(e, t, J, U, i, L);
  }
  function Op(e) {
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
  function hh() {
    if (typeof performance.getEntriesByType == "function") {
      for (var e = 0, t = 0, a = performance.getEntriesByType("resource"), i = 0; i < a.length; i++) {
        var n = a[i], s = n.transferSize, c = n.initiatorType, u = n.duration;
        if (s && u && Op(c)) {
          for (c = 0, u = n.responseEnd, i += 1; i < a.length; i++) {
            var v = a[i], D = v.startTime;
            if (D > u) break;
            var V = v.transferSize, J = v.initiatorType;
            V && Op(J) && (v = v.responseEnd, c += V * (v < u ? 1 : (u - D) / (v - D)));
          }
          if (--i, t += 8 * (s + c) / (n.duration / 1e3), e++, 10 < e) break;
        }
      }
      if (0 < e) return t / e / 1e6;
    }
    return navigator.connection && (e = navigator.connection.downlink, typeof e == "number") ? e : 5;
  }
  var Cr = null, Er = null;
  function ms(e) {
    return e.nodeType === 9 ? e : e.ownerDocument;
  }
  function Dp(e) {
    switch (e) {
      case "http://www.w3.org/2000/svg":
        return 1;
      case "http://www.w3.org/1998/Math/MathML":
        return 2;
      default:
        return 0;
    }
  }
  function Up(e, t) {
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
  function mh() {
    var e = window.event;
    return e && e.type === "popstate" ? e === Tr ? !1 : (Tr = e, !0) : (Tr = null, !1);
  }
  var Rp = typeof setTimeout == "function" ? setTimeout : void 0, xh = typeof clearTimeout == "function" ? clearTimeout : void 0, Lp = typeof Promise == "function" ? Promise : void 0, gh = typeof queueMicrotask == "function" ? queueMicrotask : typeof Lp < "u" ? function(e) {
    return Lp.resolve(null).then(e).catch(bh);
  } : Rp;
  function bh(e) {
    setTimeout(function() {
      throw e;
    });
  }
  function Qa(e) {
    return e === "head";
  }
  function qp(e, t) {
    var a = t, i = 0;
    do {
      var n = a.nextSibling;
      if (e.removeChild(a), n && n.nodeType === 8) if (a = n.data, a === "/$" || a === "/&") {
        if (i === 0) {
          e.removeChild(n), si(t);
          return;
        }
        i--;
      } else if (a === "$" || a === "$?" || a === "$~" || a === "$!" || a === "&") i++;
      else if (a === "html") Wi(e.ownerDocument.documentElement);
      else if (a === "head") {
        a = e.ownerDocument.head, Wi(a);
        for (var s = a.firstChild; s; ) {
          var c = s.nextSibling, u = s.nodeName;
          s[mi] || u === "SCRIPT" || u === "STYLE" || u === "LINK" && s.rel.toLowerCase() === "stylesheet" || a.removeChild(s), s = c;
        }
      } else a === "body" && Wi(e.ownerDocument.body);
      a = n;
    } while (a);
    si(t);
  }
  function Hp(e, t) {
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
  function Mr(e) {
    var t = e.firstChild;
    for (t && t.nodeType === 10 && (t = t.nextSibling); t; ) {
      var a = t;
      switch (t = t.nextSibling, a.nodeName) {
        case "HTML":
        case "HEAD":
        case "BODY":
          Mr(a), qs(a);
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
  function vh(e, t, a, i) {
    for (; e.nodeType === 1; ) {
      var n = a;
      if (e.nodeName.toLowerCase() !== t.toLowerCase()) {
        if (!i && (e.nodeName !== "INPUT" || e.type !== "hidden")) break;
      } else if (i) {
        if (!e[mi]) switch (t) {
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
      if (e = $t(e.nextSibling), e === null) break;
    }
    return null;
  }
  function jh(e, t, a) {
    if (t === "") return null;
    for (; e.nodeType !== 3; )
      if ((e.nodeType !== 1 || e.nodeName !== "INPUT" || e.type !== "hidden") && !a || (e = $t(e.nextSibling), e === null)) return null;
    return e;
  }
  function Bp(e, t) {
    for (; e.nodeType !== 8; )
      if ((e.nodeType !== 1 || e.nodeName !== "INPUT" || e.type !== "hidden") && !t || (e = $t(e.nextSibling), e === null)) return null;
    return e;
  }
  function Or(e) {
    return e.data === "$?" || e.data === "$~";
  }
  function Dr(e) {
    return e.data === "$!" || e.data === "$?" && e.ownerDocument.readyState !== "loading";
  }
  function yh(e, t) {
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
  function $t(e) {
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
  var Ur = null;
  function Gp(e) {
    e = e.nextSibling;
    for (var t = 0; e; ) {
      if (e.nodeType === 8) {
        var a = e.data;
        if (a === "/$" || a === "/&") {
          if (t === 0) return $t(e.nextSibling);
          t--;
        } else a !== "$" && a !== "$!" && a !== "$?" && a !== "$~" && a !== "&" || t++;
      }
      e = e.nextSibling;
    }
    return null;
  }
  function Yp(e) {
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
  function Vp(e, t, a) {
    switch (t = ms(a), e) {
      case "html":
        if (e = t.documentElement, !e) throw Error(p(452));
        return e;
      case "head":
        if (e = t.head, !e) throw Error(p(453));
        return e;
      case "body":
        if (e = t.body, !e) throw Error(p(454));
        return e;
      default:
        throw Error(p(451));
    }
  }
  function Wi(e) {
    for (var t = e.attributes; t.length; ) e.removeAttributeNode(t[0]);
    qs(e);
  }
  var Wt = /* @__PURE__ */ new Map(), Qp = /* @__PURE__ */ new Set();
  function xs(e) {
    return typeof e.getRootNode == "function" ? e.getRootNode() : e.nodeType === 9 ? e : e.ownerDocument;
  }
  var ka = Q.d;
  Q.d = {
    f: Sh,
    r: Nh,
    D: wh,
    C: zh,
    L: kh,
    m: _h,
    X: Eh,
    S: Ch,
    M: Ah
  };
  function Sh() {
    var e = ka.f(), t = cs();
    return e || t;
  }
  function Nh(e) {
    var t = zl(e);
    t !== null && t.tag === 5 && t.type === "form" ? du(t) : ka.r(e);
  }
  var li = typeof document > "u" ? null : document;
  function Xp(e, t, a) {
    var i = li;
    if (i && typeof t == "string" && t) {
      var n = Yt(t);
      n = 'link[rel="' + e + '"][href="' + n + '"]', typeof a == "string" && (n += '[crossorigin="' + a + '"]'), Qp.has(n) || (Qp.add(n), e = {
        rel: e,
        crossOrigin: a,
        href: t
      }, i.querySelector(n) === null && (t = i.createElement("link"), Nt(t, "link", e), xt(t), i.head.appendChild(t)));
    }
  }
  function wh(e) {
    ka.D(e), Xp("dns-prefetch", e, null);
  }
  function zh(e, t) {
    ka.C(e, t), Xp("preconnect", e, t);
  }
  function kh(e, t, a) {
    ka.L(e, t, a);
    var i = li;
    if (i && e && t) {
      var n = 'link[rel="preload"][as="' + Yt(t) + '"]';
      t === "image" && a && a.imageSrcSet ? (n += '[imagesrcset="' + Yt(a.imageSrcSet) + '"]', typeof a.imageSizes == "string" && (n += '[imagesizes="' + Yt(a.imageSizes) + '"]')) : n += '[href="' + Yt(e) + '"]';
      var s = n;
      switch (t) {
        case "style":
          s = ii(e);
          break;
        case "script":
          s = ni(e);
      }
      Wt.has(s) || (e = z({
        rel: "preload",
        href: t === "image" && a && a.imageSrcSet ? void 0 : e,
        as: t
      }, a), Wt.set(s, e), i.querySelector(n) !== null || t === "style" && i.querySelector(Fi(s)) || t === "script" && i.querySelector(Pi(s)) || (t = i.createElement("link"), Nt(t, "link", e), xt(t), i.head.appendChild(t)));
    }
  }
  function _h(e, t) {
    ka.m(e, t);
    var a = li;
    if (a && e) {
      var i = t && typeof t.as == "string" ? t.as : "script", n = 'link[rel="modulepreload"][as="' + Yt(i) + '"][href="' + Yt(e) + '"]', s = n;
      switch (i) {
        case "audioworklet":
        case "paintworklet":
        case "serviceworker":
        case "sharedworker":
        case "worker":
        case "script":
          s = ni(e);
      }
      if (!Wt.has(s) && (e = z({
        rel: "modulepreload",
        href: e
      }, t), Wt.set(s, e), a.querySelector(n) === null)) {
        switch (i) {
          case "audioworklet":
          case "paintworklet":
          case "serviceworker":
          case "sharedworker":
          case "worker":
          case "script":
            if (a.querySelector(Pi(s))) return;
        }
        i = a.createElement("link"), Nt(i, "link", e), xt(i), a.head.appendChild(i);
      }
    }
  }
  function Ch(e, t, a) {
    ka.S(e, t, a);
    var i = li;
    if (i && e) {
      var n = kl(i).hoistableStyles, s = ii(e);
      t = t || "default";
      var c = n.get(s);
      if (!c) {
        var u = {
          loading: 0,
          preload: null
        };
        if (c = i.querySelector(Fi(s))) u.loading = 5;
        else {
          e = z({
            rel: "stylesheet",
            href: e,
            "data-precedence": t
          }, a), (a = Wt.get(s)) && Rr(e, a);
          var v = c = i.createElement("link");
          xt(v), Nt(v, "link", e), v._p = new Promise(function(D, V) {
            v.onload = D, v.onerror = V;
          }), v.addEventListener("load", function() {
            u.loading |= 1;
          }), v.addEventListener("error", function() {
            u.loading |= 2;
          }), u.loading |= 4, gs(c, t, i);
        }
        c = {
          type: "stylesheet",
          instance: c,
          count: 1,
          state: u
        }, n.set(s, c);
      }
    }
  }
  function Eh(e, t) {
    ka.X(e, t);
    var a = li;
    if (a && e) {
      var i = kl(a).hoistableScripts, n = ni(e), s = i.get(n);
      s || (s = a.querySelector(Pi(n)), s || (e = z({
        src: e,
        async: !0
      }, t), (t = Wt.get(n)) && Lr(e, t), s = a.createElement("script"), xt(s), Nt(s, "link", e), a.head.appendChild(s)), s = {
        type: "script",
        instance: s,
        count: 1,
        state: null
      }, i.set(n, s));
    }
  }
  function Ah(e, t) {
    ka.M(e, t);
    var a = li;
    if (a && e) {
      var i = kl(a).hoistableScripts, n = ni(e), s = i.get(n);
      s || (s = a.querySelector(Pi(n)), s || (e = z({
        src: e,
        async: !0,
        type: "module"
      }, t), (t = Wt.get(n)) && Lr(e, t), s = a.createElement("script"), xt(s), Nt(s, "link", e), a.head.appendChild(s)), s = {
        type: "script",
        instance: s,
        count: 1,
        state: null
      }, i.set(n, s));
    }
  }
  function Zp(e, t, a, i) {
    var n = (n = he.current) ? xs(n) : null;
    if (!n) throw Error(p(446));
    switch (e) {
      case "meta":
      case "title":
        return null;
      case "style":
        return typeof a.precedence == "string" && typeof a.href == "string" ? (t = ii(a.href), a = kl(n).hoistableStyles, i = a.get(t), i || (i = {
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
          e = ii(a.href);
          var s = kl(n).hoistableStyles, c = s.get(e);
          if (c || (n = n.ownerDocument || n, c = {
            type: "stylesheet",
            instance: null,
            count: 0,
            state: {
              loading: 0,
              preload: null
            }
          }, s.set(e, c), (s = n.querySelector(Fi(e))) && !s._p && (c.instance = s, c.state.loading = 5), Wt.has(e) || (a = {
            rel: "preload",
            as: "style",
            href: a.href,
            crossOrigin: a.crossOrigin,
            integrity: a.integrity,
            media: a.media,
            hrefLang: a.hrefLang,
            referrerPolicy: a.referrerPolicy
          }, Wt.set(e, a), s || Th(n, e, a, c.state))), t && i === null) throw Error(p(528, ""));
          return c;
        }
        if (t && i !== null) throw Error(p(529, ""));
        return null;
      case "script":
        return t = a.async, a = a.src, typeof a == "string" && t && typeof t != "function" && typeof t != "symbol" ? (t = ni(a), a = kl(n).hoistableScripts, i = a.get(t), i || (i = {
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
        throw Error(p(444, e));
    }
  }
  function ii(e) {
    return 'href="' + Yt(e) + '"';
  }
  function Fi(e) {
    return 'link[rel="stylesheet"][' + e + "]";
  }
  function Kp(e) {
    return z({}, e, {
      "data-precedence": e.precedence,
      precedence: null
    });
  }
  function Th(e, t, a, i) {
    e.querySelector('link[rel="preload"][as="style"][' + t + "]") ? i.loading = 1 : (t = e.createElement("link"), i.preload = t, t.addEventListener("load", function() {
      return i.loading |= 1;
    }), t.addEventListener("error", function() {
      return i.loading |= 2;
    }), Nt(t, "link", a), xt(t), e.head.appendChild(t));
  }
  function ni(e) {
    return '[src="' + Yt(e) + '"]';
  }
  function Pi(e) {
    return "script[async]" + e;
  }
  function Jp(e, t, a) {
    if (t.count++, t.instance === null) switch (t.type) {
      case "style":
        var i = e.querySelector('style[data-href~="' + Yt(a.href) + '"]');
        if (i) return t.instance = i, xt(i), i;
        var n = z({}, a, {
          "data-href": a.href,
          "data-precedence": a.precedence,
          href: null,
          precedence: null
        });
        return i = (e.ownerDocument || e).createElement("style"), xt(i), Nt(i, "style", n), gs(i, a.precedence, e), t.instance = i;
      case "stylesheet":
        n = ii(a.href);
        var s = e.querySelector(Fi(n));
        if (s) return t.state.loading |= 4, t.instance = s, xt(s), s;
        i = Kp(a), (n = Wt.get(n)) && Rr(i, n), s = (e.ownerDocument || e).createElement("link"), xt(s);
        var c = s;
        return c._p = new Promise(function(u, v) {
          c.onload = u, c.onerror = v;
        }), Nt(s, "link", i), t.state.loading |= 4, gs(s, a.precedence, e), t.instance = s;
      case "script":
        return s = ni(a.src), (n = e.querySelector(Pi(s))) ? (t.instance = n, xt(n), n) : (i = a, (n = Wt.get(s)) && (i = z({}, a), Lr(i, n)), e = e.ownerDocument || e, n = e.createElement("script"), xt(n), Nt(n, "link", i), e.head.appendChild(n), t.instance = n);
      case "void":
        return null;
      default:
        throw Error(p(443, t.type));
    }
    else t.type === "stylesheet" && (t.state.loading & 4) === 0 && (i = t.instance, t.state.loading |= 4, gs(i, a.precedence, e));
    return t.instance;
  }
  function gs(e, t, a) {
    for (var i = a.querySelectorAll('link[rel="stylesheet"][data-precedence],style[data-precedence]'), n = i.length ? i[i.length - 1] : null, s = n, c = 0; c < i.length; c++) {
      var u = i[c];
      if (u.dataset.precedence === t) s = u;
      else if (s !== n) break;
    }
    s ? s.parentNode.insertBefore(e, s.nextSibling) : (t = a.nodeType === 9 ? a.head : a, t.insertBefore(e, t.firstChild));
  }
  function Rr(e, t) {
    e.crossOrigin ??= t.crossOrigin, e.referrerPolicy ??= t.referrerPolicy, e.title ??= t.title;
  }
  function Lr(e, t) {
    e.crossOrigin ??= t.crossOrigin, e.referrerPolicy ??= t.referrerPolicy, e.integrity ??= t.integrity;
  }
  var bs = null;
  function Ip(e, t, a) {
    if (bs === null) {
      var i = /* @__PURE__ */ new Map(), n = bs = /* @__PURE__ */ new Map();
      n.set(a, i);
    } else n = bs, i = n.get(a), i || (i = /* @__PURE__ */ new Map(), n.set(a, i));
    if (i.has(e)) return i;
    for (i.set(e, null), a = a.getElementsByTagName(e), n = 0; n < a.length; n++) {
      var s = a[n];
      if (!(s[mi] || s[vt] || e === "link" && s.getAttribute("rel") === "stylesheet") && s.namespaceURI !== "http://www.w3.org/2000/svg") {
        var c = s.getAttribute(t) || "";
        c = e + c;
        var u = i.get(c);
        u ? u.push(s) : i.set(c, [s]);
      }
    }
    return i;
  }
  function $p(e, t, a) {
    e = e.ownerDocument || e, e.head.insertBefore(a, t === "title" ? e.querySelector("head > title") : null);
  }
  function Mh(e, t, a) {
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
  function Wp(e) {
    return !(e.type === "stylesheet" && (e.state.loading & 3) === 0);
  }
  function Oh(e, t, a, i) {
    if (a.type === "stylesheet" && (typeof i.media != "string" || matchMedia(i.media).matches !== !1) && (a.state.loading & 4) === 0) {
      if (a.instance === null) {
        var n = ii(i.href), s = t.querySelector(Fi(n));
        if (s) {
          t = s._p, t !== null && typeof t == "object" && typeof t.then == "function" && (e.count++, e = vs.bind(e), t.then(e, e)), a.state.loading |= 4, a.instance = s, xt(s);
          return;
        }
        s = t.ownerDocument || t, i = Kp(i), (n = Wt.get(n)) && Rr(i, n), s = s.createElement("link"), xt(s);
        var c = s;
        c._p = new Promise(function(u, v) {
          c.onload = u, c.onerror = v;
        }), Nt(s, "link", i), a.instance = s;
      }
      e.stylesheets === null && (e.stylesheets = /* @__PURE__ */ new Map()), e.stylesheets.set(a, t), (t = a.state.preload) && (a.state.loading & 3) === 0 && (e.count++, a = vs.bind(e), t.addEventListener("load", a), t.addEventListener("error", a));
    }
  }
  var qr = 0;
  function Dh(e, t) {
    return e.stylesheets && e.count === 0 && ys(e, e.stylesheets), 0 < e.count || 0 < e.imgCount ? function(a) {
      var i = setTimeout(function() {
        if (e.stylesheets && ys(e, e.stylesheets), e.unsuspend) {
          var s = e.unsuspend;
          e.unsuspend = null, s();
        }
      }, 6e4 + t);
      0 < e.imgBytes && qr === 0 && (qr = 62500 * hh());
      var n = setTimeout(function() {
        if (e.waitingForImages = !1, e.count === 0 && (e.stylesheets && ys(e, e.stylesheets), e.unsuspend)) {
          var s = e.unsuspend;
          e.unsuspend = null, s();
        }
      }, (e.imgBytes > qr ? 50 : 800) + t);
      return e.unsuspend = a, function() {
        e.unsuspend = null, clearTimeout(i), clearTimeout(n);
      };
    } : null;
  }
  function vs() {
    if (this.count--, this.count === 0 && (this.imgCount === 0 || !this.waitingForImages)) {
      if (this.stylesheets) ys(this, this.stylesheets);
      else if (this.unsuspend) {
        var e = this.unsuspend;
        this.unsuspend = null, e();
      }
    }
  }
  var js = null;
  function ys(e, t) {
    e.stylesheets = null, e.unsuspend !== null && (e.count++, js = /* @__PURE__ */ new Map(), t.forEach(Uh, e), js = null, vs.call(e));
  }
  function Uh(e, t) {
    if (!(t.state.loading & 4)) {
      var a = js.get(e);
      if (a) var i = a.get(null);
      else {
        a = /* @__PURE__ */ new Map(), js.set(e, a);
        for (var n = e.querySelectorAll("link[data-precedence],style[data-precedence]"), s = 0; s < n.length; s++) {
          var c = n[s];
          (c.nodeName === "LINK" || c.getAttribute("media") !== "not all") && (a.set(c.dataset.precedence, c), i = c);
        }
        i && a.set(null, i);
      }
      n = t.instance, c = n.getAttribute("data-precedence"), s = a.get(c) || i, s === i && a.set(null, n), a.set(c, n), this.count++, i = vs.bind(this), n.addEventListener("load", i), n.addEventListener("error", i), s ? s.parentNode.insertBefore(n, s.nextSibling) : (e = e.nodeType === 9 ? e.head : e, e.insertBefore(n, e.firstChild)), t.state.loading |= 4;
    }
  }
  var en = {
    $$typeof: H,
    Provider: null,
    Consumer: null,
    _currentValue: se,
    _currentValue2: se,
    _threadCount: 0
  };
  function Rh(e, t, a, i, n, s, c, u, v) {
    this.tag = 1, this.containerInfo = e, this.pingCache = this.current = this.pendingChildren = null, this.timeoutHandle = -1, this.callbackNode = this.next = this.pendingContext = this.context = this.cancelPendingCommit = null, this.callbackPriority = 0, this.expirationTimes = Us(-1), this.entangledLanes = this.shellSuspendCounter = this.errorRecoveryDisabledLanes = this.expiredLanes = this.warmLanes = this.pingedLanes = this.suspendedLanes = this.pendingLanes = 0, this.entanglements = Us(0), this.hiddenUpdates = Us(null), this.identifierPrefix = i, this.onUncaughtError = n, this.onCaughtError = s, this.onRecoverableError = c, this.pooledCache = null, this.pooledCacheLanes = 0, this.formState = v, this.incompleteTransitions = /* @__PURE__ */ new Map();
  }
  function Lh(e, t, a, i, n, s, c, u, v, D, V, J) {
    return e = new Rh(e, t, a, c, v, D, V, J, u), t = 1, s === !0 && (t |= 24), s = Rt(3, null, null, t), e.current = s, s.stateNode = e, t = bc(), t.refCount++, e.pooledCache = t, t.refCount++, s.memoizedState = {
      element: i,
      isDehydrated: a,
      cache: t
    }, Sc(s), e;
  }
  function qh(e) {
    return e ? (e = Rl, e) : Rl;
  }
  function Fp(e, t, a, i, n, s) {
    n = qh(n), i.context === null ? i.context = n : i.pendingContext = n, i = pl(t), i.payload = { element: a }, s = s === void 0 ? null : s, s !== null && (i.callback = s), a = fl(e, i, t), a !== null && (Ot(a, e, t), Mi(a, e, t));
  }
  function Pp(e, t) {
    if (e = e.memoizedState, e !== null && e.dehydrated !== null) {
      var a = e.retryLane;
      e.retryLane = a !== 0 && a < t ? a : t;
    }
  }
  function Hr(e, t) {
    Pp(e, t), (e = e.alternate) && Pp(e, t);
  }
  function ef(e) {
    if (e.tag === 13 || e.tag === 31) {
      var t = ll(e, 67108864);
      t !== null && Ot(t, e, 67108864), Hr(e, 67108864);
    }
  }
  function tf(e) {
    if (e.tag === 13 || e.tag === 31) {
      var t = It();
      t = vd(t);
      var a = ll(e, t);
      a !== null && Ot(a, e, t), Hr(e, t);
    }
  }
  var Ss = !0;
  function Hh(e, t, a, i) {
    var n = Y.T;
    Y.T = null;
    var s = Q.p;
    try {
      Q.p = 2, Br(e, t, a, i);
    } finally {
      Q.p = s, Y.T = n;
    }
  }
  function Bh(e, t, a, i) {
    var n = Y.T;
    Y.T = null;
    var s = Q.p;
    try {
      Q.p = 8, Br(e, t, a, i);
    } finally {
      Q.p = s, Y.T = n;
    }
  }
  function Br(e, t, a, i) {
    if (Ss) {
      var n = Gr(i);
      if (n === null) kr(e, t, i, Ns, a), lf(e, i);
      else if (Yh(n, e, t, a, i)) i.stopPropagation();
      else if (lf(e, i), t & 4 && -1 < Gh.indexOf(e)) {
        for (; n !== null; ) {
          var s = zl(n);
          if (s !== null) switch (s.tag) {
            case 3:
              if (s = s.stateNode, s.current.memoizedState.isDehydrated) {
                var c = Fa(s.pendingLanes);
                if (c !== 0) {
                  var u = s;
                  for (u.pendingLanes |= 2, u.entangledLanes |= 2; c; ) {
                    var v = 1 << 31 - ht(c);
                    u.entanglements[1] |= v, c &= ~v;
                  }
                  za(s), (Qe & 6) === 0 && (ns = M() + 500, Ji(0, !1));
                }
              }
              break;
            case 31:
            case 13:
              u = ll(s, 2), u !== null && Ot(u, s, 2), cs(), Hr(s, 2);
          }
          if (s = Gr(i), s === null && kr(e, t, i, Ns, a), s === n) break;
          n = s;
        }
        n !== null && i.stopPropagation();
      } else kr(e, t, i, null, a);
    }
  }
  function Gr(e) {
    return e = Qs(e), Yr(e);
  }
  var Ns = null;
  function Yr(e) {
    if (Ns = null, e = wl(e), e !== null) {
      var t = x(e);
      if (t === null) e = null;
      else {
        var a = t.tag;
        if (a === 13) {
          if (e = A(t), e !== null) return e;
          e = null;
        } else if (a === 31) {
          if (e = N(t), e !== null) return e;
          e = null;
        } else if (a === 3) {
          if (t.stateNode.current.memoizedState.isDehydrated) return t.tag === 3 ? t.stateNode.containerInfo : null;
          e = null;
        } else t !== e && (e = null);
      }
    }
    return Ns = e, null;
  }
  function af(e) {
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
        switch (ke()) {
          case je:
            return 2;
          case Ce:
            return 8;
          case Be:
          case bt:
            return 32;
          case m:
            return 268435456;
          default:
            return 32;
        }
      default:
        return 32;
    }
  }
  var Vr = !1, Xa = null, Za = null, Ka = null, tn = /* @__PURE__ */ new Map(), an = /* @__PURE__ */ new Map(), Ja = [], Gh = "mousedown mouseup touchcancel touchend touchstart auxclick dblclick pointercancel pointerdown pointerup dragend dragstart drop compositionend compositionstart keydown keypress keyup input textInput copy cut paste click change contextmenu reset".split(" ");
  function lf(e, t) {
    switch (e) {
      case "focusin":
      case "focusout":
        Xa = null;
        break;
      case "dragenter":
      case "dragleave":
        Za = null;
        break;
      case "mouseover":
      case "mouseout":
        Ka = null;
        break;
      case "pointerover":
      case "pointerout":
        tn.delete(t.pointerId);
        break;
      case "gotpointercapture":
      case "lostpointercapture":
        an.delete(t.pointerId);
    }
  }
  function ln(e, t, a, i, n, s) {
    return e === null || e.nativeEvent !== s ? (e = {
      blockedOn: t,
      domEventName: a,
      eventSystemFlags: i,
      nativeEvent: s,
      targetContainers: [n]
    }, t !== null && (t = zl(t), t !== null && ef(t)), e) : (e.eventSystemFlags |= i, t = e.targetContainers, n !== null && t.indexOf(n) === -1 && t.push(n), e);
  }
  function Yh(e, t, a, i, n) {
    switch (t) {
      case "focusin":
        return Xa = ln(Xa, e, t, a, i, n), !0;
      case "dragenter":
        return Za = ln(Za, e, t, a, i, n), !0;
      case "mouseover":
        return Ka = ln(Ka, e, t, a, i, n), !0;
      case "pointerover":
        var s = n.pointerId;
        return tn.set(s, ln(tn.get(s) || null, e, t, a, i, n)), !0;
      case "gotpointercapture":
        return s = n.pointerId, an.set(s, ln(an.get(s) || null, e, t, a, i, n)), !0;
    }
    return !1;
  }
  function nf(e) {
    var t = wl(e.target);
    if (t !== null) {
      var a = x(t);
      if (a !== null) {
        if (t = a.tag, t === 13) {
          if (t = A(a), t !== null) {
            e.blockedOn = t, yd(e.priority, function() {
              tf(a);
            });
            return;
          }
        } else if (t === 31) {
          if (t = N(a), t !== null) {
            e.blockedOn = t, yd(e.priority, function() {
              tf(a);
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
  function ws(e) {
    if (e.blockedOn !== null) return !1;
    for (var t = e.targetContainers; 0 < t.length; ) {
      var a = Gr(e.nativeEvent);
      if (a === null) {
        a = e.nativeEvent;
        var i = new a.constructor(a.type, a);
        Vs = i, a.target.dispatchEvent(i), Vs = null;
      } else return t = zl(a), t !== null && ef(t), e.blockedOn = a, !1;
      t.shift();
    }
    return !0;
  }
  function sf(e, t, a) {
    ws(e) && a.delete(t);
  }
  function Vh() {
    Vr = !1, Xa !== null && ws(Xa) && (Xa = null), Za !== null && ws(Za) && (Za = null), Ka !== null && ws(Ka) && (Ka = null), tn.forEach(sf), an.forEach(sf);
  }
  function zs(e, t) {
    e.blockedOn === t && (e.blockedOn = null, Vr || (Vr = !0, h.unstable_scheduleCallback(h.unstable_NormalPriority, Vh)));
  }
  var ks = null;
  function cf(e) {
    ks !== e && (ks = e, h.unstable_scheduleCallback(h.unstable_NormalPriority, function() {
      ks === e && (ks = null);
      for (var t = 0; t < e.length; t += 3) {
        var a = e[t], i = e[t + 1], n = e[t + 2];
        if (typeof i != "function") {
          if (Yr(i || a) === null) continue;
          break;
        }
        var s = zl(a);
        s !== null && (e.splice(t, 3), t -= 3, Yc(s, {
          pending: !0,
          data: n,
          method: a.method,
          action: i
        }, i, n));
      }
    }));
  }
  function si(e) {
    function t(v) {
      return zs(v, e);
    }
    Xa !== null && zs(Xa, e), Za !== null && zs(Za, e), Ka !== null && zs(Ka, e), tn.forEach(t), an.forEach(t);
    for (var a = 0; a < Ja.length; a++) {
      var i = Ja[a];
      i.blockedOn === e && (i.blockedOn = null);
    }
    for (; 0 < Ja.length && (a = Ja[0], a.blockedOn === null); ) nf(a), a.blockedOn === null && Ja.shift();
    if (a = (e.ownerDocument || e).$$reactFormReplay, a != null) for (i = 0; i < a.length; i += 3) {
      var n = a[i], s = a[i + 1], c = n[_t] || null;
      if (typeof s == "function") c || cf(a);
      else if (c) {
        var u = null;
        if (s && s.hasAttribute("formAction")) {
          if (n = s, c = s[_t] || null) u = c.formAction;
          else if (Yr(n) !== null) continue;
        } else u = c.action;
        typeof u == "function" ? a[i + 1] = u : (a.splice(i, 3), i -= 3), cf(a);
      }
    }
  }
  function Qh() {
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
  function Qr(e) {
    this._internalRoot = e;
  }
  Xr.prototype.render = Qr.prototype.render = function(e) {
    var t = this._internalRoot;
    if (t === null) throw Error(p(409));
    var a = t.current;
    Fp(a, It(), e, t, null, null);
  }, Xr.prototype.unmount = Qr.prototype.unmount = function() {
    var e = this._internalRoot;
    if (e !== null) {
      this._internalRoot = null;
      var t = e.containerInfo;
      Fp(e.current, 2, null, e, null, null), cs(), t[hi] = null;
    }
  };
  function Xr(e) {
    this._internalRoot = e;
  }
  Xr.prototype.unstable_scheduleHydration = function(e) {
    if (e) {
      var t = jd();
      e = {
        blockedOn: null,
        target: e,
        priority: t
      };
      for (var a = 0; a < Ja.length && t !== 0 && t < Ja[a].priority; a++) ;
      Ja.splice(a, 0, e), a === 0 && nf(e);
    }
  };
  var rf = C.version;
  if (rf !== "19.2.6") throw Error(p(527, rf, "19.2.6"));
  Q.findDOMNode = function(e) {
    var t = e._reactInternals;
    if (t === void 0)
      throw typeof e.render == "function" ? Error(p(188)) : (e = Object.keys(e).join(","), Error(p(268, e)));
    return e = w(t), e = e !== null ? G(e) : null, e = e === null ? null : e.stateNode, e;
  };
  var Xh = {
    bundleType: 0,
    version: "19.2.6",
    rendererPackageName: "react-dom",
    currentDispatcherRef: Y,
    reconcilerVersion: "19.2.6"
  };
  if (typeof __REACT_DEVTOOLS_GLOBAL_HOOK__ < "u") {
    var _s = __REACT_DEVTOOLS_GLOBAL_HOOK__;
    if (!_s.isDisabled && _s.supportsFiber) try {
      st = _s.inject(Xh), Fe = _s;
    } catch {
    }
  }
  r.createRoot = function(e, t) {
    if (!k(e)) throw Error(p(299));
    var a = !1, i = "", n = B0, s = G0, c = Y0;
    return t != null && (t.unstable_strictMode === !0 && (a = !0), t.identifierPrefix !== void 0 && (i = t.identifierPrefix), t.onUncaughtError !== void 0 && (n = t.onUncaughtError), t.onCaughtError !== void 0 && (s = t.onCaughtError), t.onRecoverableError !== void 0 && (c = t.onRecoverableError)), t = Lh(e, 1, !1, null, null, a, i, null, n, s, c, Qh), e[hi] = t.current, Cp(e), new Qr(t);
  };
})), Ph = /* @__PURE__ */ ca(((r, h) => {
  function C() {
    if (!(typeof __REACT_DEVTOOLS_GLOBAL_HOOK__ > "u" || typeof __REACT_DEVTOOLS_GLOBAL_HOOK__.checkDCE != "function"))
      try {
        __REACT_DEVTOOLS_GLOBAL_HOOK__.checkDCE(C);
      } catch (f) {
        console.error(f);
      }
  }
  C(), h.exports = Fh();
})), Ef = (...r) => r.filter((h, C, f) => !!h && h.trim() !== "" && f.indexOf(h) === C).join(" ").trim(), em = (r) => r.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase(), tm = (r) => r.replace(/^([A-Z])|[\s-_]+(\w)/g, (h, C, f) => f ? f.toUpperCase() : C.toLowerCase()), df = (r) => {
  const h = tm(r);
  return h.charAt(0).toUpperCase() + h.slice(1);
}, Zr = {
  xmlns: "http://www.w3.org/2000/svg",
  width: 24,
  height: 24,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round",
  strokeLinejoin: "round"
}, am = (r) => {
  for (const h in r) if (h.startsWith("aria-") || h === "role" || h === "title") return !0;
  return !1;
}, g = ud(), lm = (0, g.createContext)({}), im = () => (0, g.useContext)(lm), nm = (0, g.forwardRef)(({ color: r, size: h, strokeWidth: C, absoluteStrokeWidth: f, className: p = "", children: k, iconNode: x, ...A }, N) => {
  const { size: _ = 24, strokeWidth: w = 2, absoluteStrokeWidth: G = !1, color: z = "currentColor", className: le = "" } = im() ?? {}, ne = f ?? G ? Number(C ?? w) * 24 / Number(h ?? _) : C ?? w;
  return (0, g.createElement)("svg", {
    ref: N,
    ...Zr,
    width: h ?? _ ?? Zr.width,
    height: h ?? _ ?? Zr.height,
    stroke: r ?? z,
    strokeWidth: ne,
    className: Ef("lucide", le, p),
    ...!k && !am(A) && { "aria-hidden": "true" },
    ...A
  }, [...x.map(([I, X]) => (0, g.createElement)(I, X)), ...Array.isArray(k) ? k : [k]]);
}), Ae = (r, h) => {
  const C = (0, g.forwardRef)(({ className: f, ...p }, k) => (0, g.createElement)(nm, {
    ref: k,
    iconNode: h,
    className: Ef(`lucide-${em(df(r))}`, `lucide-${r}`, f),
    ...p
  }));
  return C.displayName = df(r), C;
}, sm = [
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
], Af = Ae("archive", sm), cm = [["path", {
  d: "m12 19-7-7 7-7",
  key: "1l729n"
}], ["path", {
  d: "M19 12H5",
  key: "x3x0zl"
}]], of = Ae("arrow-left", cm), rm = [["path", {
  d: "M5 12h14",
  key: "1ays0h"
}], ["path", {
  d: "m12 5 7 7-7 7",
  key: "xquz4c"
}]], di = Ae("arrow-right", rm), dm = [["path", {
  d: "M7 7h10v10",
  key: "1tivn9"
}], ["path", {
  d: "M7 17 17 7",
  key: "1vkiza"
}]], om = Ae("arrow-up-right", dm), um = [["path", {
  d: "M12 5v16",
  key: "1f6ucr"
}], ["path", {
  d: "M20.001 19A2 2 0 0022 17V5a2 2 0 00-1.999-2L16 3.002A5 5 0 0012 5a5 5 0 00-4-2H4a2 2 0 00-2 2v12a2 2 0 001.999 2H8a5 5 0 014 2 5 5 0 014-2z",
  key: "1fyvmf"
}]], pm = Ae("book-open", um), fm = [
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
], sd = Ae("box", fm), hm = [["path", {
  d: "M20 6 9 17l-5-5",
  key: "1gmf2c"
}]], Cs = Ae("check", hm), mm = [["path", {
  d: "m9 18 6-6-6-6",
  key: "mthhwq"
}]], uf = Ae("chevron-right", mm), xm = [
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
], oi = Ae("circle-alert", xm), gm = [
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
], ui = Ae("clapperboard", gm), bm = [
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
], vm = Ae("clipboard-list", bm), jm = [["circle", {
  cx: "12",
  cy: "12",
  r: "10",
  key: "1mglay"
}], ["path", {
  d: "M12 6v6h4",
  key: "135r8i"
}]], Tf = Ae("clock-3", jm), ym = [
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
], Sm = Ae("code-xml", ym), Nm = [["rect", {
  width: "18",
  height: "18",
  x: "3",
  y: "3",
  rx: "2",
  key: "afitv7"
}], ["path", {
  d: "M12 3v18",
  key: "108xh3"
}]], wm = Ae("columns-2", Nm), zm = [["rect", {
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
}]], pd = Ae("copy", zm), km = [
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
], dn = Ae("download", km), _m = [
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
], Cm = Ae("external-link", _m), Em = [
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
], jl = Ae("file-check-corner", Em), Am = [
  ["path", {
    d: "M6 22a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h8a2.4 2.4 0 0 1 1.704.706l3.588 3.588A2.4 2.4 0 0 1 20 8v12a2 2 0 0 1-2 2z",
    key: "1oefj6"
  }],
  ["path", {
    d: "M14 2v5a1 1 0 0 0 1 1h5",
    key: "wfsgrz"
  }],
  ["path", {
    d: "M10 9H8",
    key: "b1mrlr"
  }],
  ["path", {
    d: "M16 13H8",
    key: "t4e002"
  }],
  ["path", {
    d: "M16 17H8",
    key: "z1uh3a"
  }]
], Tm = Ae("file-text", Am), Mm = [
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
], Kr = Ae("film", Mm), Om = [["path", {
  d: "m6 14 1.5-2.9A2 2 0 0 1 9.24 10H20a2 2 0 0 1 1.94 2.5l-1.54 6a2 2 0 0 1-1.95 1.5H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h3.9a2 2 0 0 1 1.69.9l.81 1.2a2 2 0 0 0 1.67.9H18a2 2 0 0 1 2 2v2",
  key: "usdka0"
}]], Jr = Ae("folder-open", Om), Dm = [
  ["path", {
    d: "M12 10v6",
    key: "1bos4e"
  }],
  ["path", {
    d: "M9 13h6",
    key: "1uhe8q"
  }],
  ["path", {
    d: "M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z",
    key: "1kt360"
  }]
], Um = Ae("folder-plus", Dm), Rm = [["path", {
  d: "M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z",
  key: "1kt360"
}]], Lm = Ae("folder", Rm), qm = [
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
], nn = Ae("git-branch", qm), Hm = [
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
], pf = Ae("image-plus", Hm), Bm = [
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
], Mf = Ae("layers", Bm), Gm = [
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
], ff = Ae("layout-grid", Gm), Ym = [
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
], on = Ae("link-2", Ym), Vm = [
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
], Qm = Ae("list-checks", Vm), Xm = [["path", {
  d: "M21 12a9 9 0 1 1-6.219-8.56",
  key: "13zald"
}]], Ir = Ae("loader-circle", Xm), Zm = [
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
], cd = Ae("lock-keyhole", Zm), Km = [
  ["path", {
    d: "M15 3h6v6",
    key: "1q9fwt"
  }],
  ["path", {
    d: "m21 3-7 7",
    key: "1l2asr"
  }],
  ["path", {
    d: "m3 21 7-7",
    key: "tjx5ai"
  }],
  ["path", {
    d: "M9 21H3v-6",
    key: "wtvkvv"
  }]
], Jm = Ae("maximize-2", Km), Im = [["path", {
  d: "M22 17a2 2 0 0 1-2 2H6.828a2 2 0 0 0-1.414.586l-2.202 2.202A.71.71 0 0 1 2 21.286V5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2z",
  key: "18887p"
}]], $r = Ae("message-square", Im), $m = [
  ["path", {
    d: "M12 2v20",
    key: "t6zp3m"
  }],
  ["path", {
    d: "m15 19-3 3-3-3",
    key: "11eu04"
  }],
  ["path", {
    d: "m19 9 3 3-3 3",
    key: "1mg7y2"
  }],
  ["path", {
    d: "M2 12h20",
    key: "9i4pu4"
  }],
  ["path", {
    d: "m5 9-3 3 3 3",
    key: "j64kie"
  }],
  ["path", {
    d: "m9 5 3-3 3 3",
    key: "l8vdw6"
  }]
], Wm = Ae("move", $m), Fm = [["path", {
  d: "M5 12h14",
  key: "1ays0h"
}], ["path", {
  d: "M12 5v14",
  key: "s699le"
}]], Ft = Ae("plus", Fm), Pm = [
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
], Wa = Ae("refresh-cw", Pm), ex = [["path", {
  d: "M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8",
  key: "1357e3"
}], ["path", {
  d: "M3 3v5h5",
  key: "1xhq8a"
}]], Of = Ae("rotate-ccw", ex), tx = [["path", {
  d: "m21 21-4.34-4.34",
  key: "14j7rj"
}], ["circle", {
  cx: "11",
  cy: "11",
  r: "8",
  key: "4ej97u"
}]], fd = Ae("search", tx), ax = [["path", {
  d: "M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z",
  key: "oel41y"
}], ["path", {
  d: "m9 12 2 2 4-4",
  key: "dzmm74"
}]], vl = Ae("shield-check", ax), lx = [
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
], yl = Ae("trash-2", lx), ix = [
  ["path", {
    d: "M12 3v12",
    key: "1x0j5s"
  }],
  ["path", {
    d: "m17 8-5-5-5 5",
    key: "7q97r8"
  }],
  ["path", {
    d: "M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4",
    key: "ih7n3h"
  }]
], nx = Ae("upload", ix), sx = [["path", {
  d: "M18 6 6 18",
  key: "1bl5f8"
}], ["path", {
  d: "m6 6 12 12",
  key: "d8bk6v"
}]], Sl = Ae("x", sx), cx = Ph(), _a = [
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
], rx = class extends Error {
  status;
  constructor(r, h = 400) {
    super(r), this.status = h;
  }
}, hf = (r, h = 400) => {
  throw new rx(r, h);
};
function Os(r) {
  return r.modelFlow ?? {
    models: [],
    issues: [],
    packs: [],
    pins: [],
    history: []
  };
}
function dx(r, h, C) {
  const f = Os(r).models.find((k) => k.id === h || k.key === h);
  f || hf("找不到模型");
  const p = f.versions.find((k) => k.id === C);
  return p || hf("找不到指定模型版本"), {
    m: f,
    v: p
  };
}
function ox(r, h, C, f) {
  const { v: p } = dx(r, h, C), k = p.stages[f], x = _a.findIndex((N) => N.id === f), A = [];
  return x > 0 && !p.stages[_a[x - 1].id].author && A.push("先核定 " + _a[x - 1].title), k.checks.every(Boolean) || A.push("完成本階段全部檢查"), k.evidence || A.push("填入實際產出或檢查報告位置"), (!k.summary || !k.nextStep) && A.push("填寫已做內容與接手下一步"), f === "M01" && (!p.sourceLocation || !p.sourceVersion || !p.backupLocation || !p.sha256) && A.push("補齊原檔版本、獨立備份與 SHA-256"), f === "M02" && !p.reference && A.push("補入設定及尺度來源"), x >= 3 && !p.candidateLocation && A.push("登記獨立候選 GLB"), Os(r).issues.some((N) => N.modelId === h && N.versionId === C && N.status === "open" && (N.stageId === f || x >= 6 || N.kind === "major" && x >= 3)) && A.push("處理適用的待修或待裁定問題"), A;
}
var ux = [
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
], px = [
  "唯一音軌",
  "音樂分析",
  "段落與節點",
  "鏡頭安排",
  "影格與動畫",
  "對音樂試剪",
  "支線驗收",
  "插入全片"
], fx = [
  ["已指定唯一使用音軌與版本；換音軌需重核切點"],
  ["已實際分析音樂、歌詞與節奏"],
  ["段落與重要音樂節點已標記"],
  ["鏡頭與音樂、主題、劇透範圍相符"],
  ["人物與主線一致，影格及動畫已驗收"],
  ["已按指定音軌核對切點與實際長度"],
  ["無不必要重複鏡頭，劇透範圍及情緒合適"],
  ["通過支線已插入剪輯專案，入點與出點可查"]
], Pt = [...ux.map((r) => ({
  ...r,
  group: "main"
})), ...["op", "ed"].flatMap((r) => px.map((h, C) => ({
  id: r + String(C + 1).padStart(2, "0"),
  title: h,
  group: r,
  phase: r.toUpperCase() + " 支線",
  description: r === "op" ? "OP 以作品印象、人物關係及主題為主。" : "ED 以情緒收束及畫面變化為主。",
  output: h === "唯一音軌" ? "由作者在有效資料中指定音軌、版本與長度" : h,
  checks: fx[C],
  deps: C ? [r + String(C).padStart(2, "0")] : ["03"]
})))], hx = [
  "script",
  "character",
  "scene",
  "voice",
  "op_audio",
  "ed_audio",
  "edit"
];
function pi(r) {
  return [...new Map(r.map((h) => [h.key, h])).values()];
}
function $a(r) {
  return pi(r.filter((h) => h.status === "adopted" || h.status === "withdrawn")).filter((h) => h.status === "adopted");
}
function mx(r) {
  return {
    projectId: r.id,
    workId: r.workId,
    episode: r.episode,
    revision: r.revision,
    workflowSchema: r.workflowSchema ?? 1,
    genericChecks: Ds(r).map(({ id: h, title: C, checks: f }) => ({
      id: h,
      title: C,
      checks: f
    })),
    rules: pi(r.episodeRules ?? []),
    adoptedRules: $a(r.episodeRules ?? []),
    baselines: pi(r.baselines ?? []),
    adoptedBaselines: $a(r.baselines ?? []),
    legacy: r.workflowLegacy ?? null,
    rule: "通用流程不含單集劇情條件。本集規則與採用清單各自保存版本，候選不取代已採用版，另一集須另行指定；檔案位置未驗看。"
  };
}
function xx(r) {
  return {
    id: r.id,
    title: r.title,
    revision: r.revision,
    updatedAt: r.updatedAt,
    sharedCount: new Set(r.sharedAssets.map((h) => h.key)).size
  };
}
var Df = class extends Error {
  status;
  constructor(r, h = 400) {
    super(r), this.status = h;
  }
};
function Ds(r) {
  return Pt.filter((h) => h.group === "main" || r.branches[h.group]);
}
function Ts(r, h) {
  const C = Pt.find((f) => f.id === h);
  if (!C) throw new Df("找不到階段");
  return C.deps.filter((f) => Ds(r).some((p) => p.id === f) && !r.stages[f].author).map((f) => `${f} ${Pt.find((p) => p.id === f)?.title}`);
}
function Uf(r, h) {
  const C = r.stages[h], f = Ts(r, h).map((k) => "先完成 " + k), p = Pt.find((k) => k.id === h).checks.length;
  return (C.checks.length < p || !C.checks.slice(0, p).every(Boolean)) && f.push("勾選全部驗收項目"), C.evidence.trim() || f.push("填入產出連結或檔案位置"), r.issues.some((k) => k.status === "open" && k.stageId === h) && f.push("處理此階段未結問題"), Nl(r).problems.some((k) => k.status === "open" && (k.scope.type === "project" || k.scope.type === "stage" && k.scope.target === h || h === "12")) && f.push("處理適用範圍內的資訊矛盾或缺件"), h === "12" && (r.issues.some((k) => k.status === "open") && f.push("結清全部退修問題"), r.shots.some((k) => k.status !== "in_timeline") && f.push("總表中所有鏡頭須通過並入片"), r.shots.length || f.push("建立實際採用鏡頭與入片紀錄")), f;
}
function rd(r) {
  const h = Ds(r);
  return {
    id: r.id,
    workId: r.workId ?? "",
    title: r.title,
    episode: r.episode,
    revision: r.revision,
    archived: r.archived,
    updatedAt: r.updatedAt,
    completionReport: r.production?.completionReports?.at(-1) ?? null,
    approved: h.filter((C) => r.stages[C.id].author).length,
    total: h.length,
    openIssues: r.issues.filter((C) => C.status === "open").length,
    shots: r.shots.length,
    inTimeline: r.shots.filter((C) => C.status === "in_timeline").length,
    lastMcpAt: r.lastMcpAt,
    next: h.filter((C) => !r.stages[C.id].author && !Ts(r, C.id).length).map((C) => ({
      id: C.id,
      title: C.title,
      reasons: Uf(r, C.id)
    }))
  };
}
function hd(r) {
  const h = Nl(r), C = [...new Map((r.production?.links ?? []).map((p) => [p.shotId, p])).values()], f = [...new Map((r.production?.selections ?? []).map((p) => [p.shotId, p])).values()];
  return {
    project: rd(r),
    settings: {
      rules: $a(r.episodeRules ?? []).length,
      adopted: $a(r.baselines ?? []).map(({ key: p, title: k, category: x, version: A, recordVersion: N, externalVersion: _ }) => ({
        key: p,
        title: k,
        category: x,
        version: A,
        recordVersion: N,
        externalVersion: _
      })),
      pending: pi(r.baselines ?? []).filter((p) => p.status === "unresolved" || p.status === "reference").map(({ key: p, title: k, status: x, note: A }) => ({
        key: p,
        title: k,
        status: x,
        note: A
      }))
    },
    registration: {
      sources: h.records.length,
      acceptedSources: h.records.filter(rn).length,
      shots: r.shots.length,
      linkedShots: C.length,
      locatedFrames: C.filter((p) => p.references.length).length,
      registeredSelections: (/* @__PURE__ */ new Set([...f.map((p) => p.shotId), ...C.filter((p) => p.adoptedOutput).map((p) => p.shotId)])).size,
      timelineRegistrations: f.filter((p) => p.editorVersion && p.inPoint && p.outPoint).length
    },
    outgoing: r.production?.handoffs?.at(-1) ?? null,
    openProblems: h.problems.filter((p) => p.status === "open"),
    lastWork: h.results.at(-1) ?? null,
    rule: "作者告知的製作完成、資料補登與素材實際檢視分開記錄。未登記的素材不推定未製作；接續整理保留來源，未對上成片的情節不得自動套用下一集。"
  };
}
var sn = {
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
}, gx = [
  "rule",
  "script",
  "character",
  "scene",
  "audio",
  "reference"
];
function Nl(r) {
  return r.knowledge ?? {
    records: [],
    problems: [],
    packs: [],
    results: []
  };
}
function rn(r) {
  return r.approval?.verdict === "source_accepted" || r.status === "effective";
}
function Wr(r, h) {
  return (r.production?.sections.find((C) => C.stageId === h)?.gaps ?? []).map((C, f) => {
    const p = [...r.production?.supplements ?? []].reverse().find((k) => k.stageId === h && k.gapIndex === f && k.gap === C);
    return {
      index: f,
      description: C,
      status: p ? "filled" : "open",
      record: p ? Nl(r).records.find((k) => k.id === p.recordId) ?? null : null
    };
  });
}
function bx(r, h) {
  if (r.workId && (!h || h.id !== r.workId) || h && h.id !== r.workId) throw new Df("集數與作品不相符", 400);
  const C = hd(r), f = h ? Os(h) : null, p = (f?.models ?? []).map((x) => {
    const A = x.versions.at(-1), N = [...f?.history ?? []].reverse().find((G) => G.modelId === x.id && G.versionId === A.id && G.action === "save_model_stage"), _ = _a.find((G) => !A.stages[G.id].author) ?? _a[7], w = x.versions.find((G) => G.id === x.adoptedVersionId);
    return {
      modelId: x.id,
      key: x.key,
      title: x.title,
      versionId: A.id,
      label: A.label,
      adopted: w ? {
        versionId: w.id,
        label: w.label
      } : null,
      sourceLocation: A.sourceLocation,
      candidateLocation: A.candidateLocation,
      stageId: _.id,
      stageTitle: _.title,
      approved: _a.filter((G) => A.stages[G.id].author).length,
      lastWork: N ? {
        at: N.at,
        stageId: N.stageId,
        summary: A.stages[N.stageId].summary,
        evidence: A.stages[N.stageId].evidence,
        nextStep: A.stages[N.stageId].nextStep
      } : null,
      openIssues: f.issues.filter((G) => G.modelId === x.id && G.versionId === A.id && G.status === "open"),
      nextStep: N ? A.stages[N.stageId].nextStep : "尚無工作回報；先讀取模型來源與指定版本，再取得任務資料包。"
    };
  }), k = [...new Map((f?.pins ?? []).filter((x) => x.episodeId === r.id).map((x) => [[x.modelId, x.sceneIds].join("|"), x])).values()].map((x) => {
    const A = f.models.find((_) => _.id === x.modelId), N = A?.versions.find((_) => _.id === x.versionId);
    return {
      ...x,
      title: A?.title ?? x.modelId,
      label: N?.label ?? x.versionId
    };
  });
  return {
    schemaVersion: 1,
    projectId: r.id,
    episodeCode: r.episode,
    title: h?.title ?? r.title,
    projectRevision: r.revision,
    workId: h?.id ?? null,
    workRevision: h?.revision ?? null,
    episode: C,
    models: p,
    pins: k,
    issues: {
      animation: r.issues.filter((x) => x.status === "open"),
      context: C.openProblems,
      models: f?.issues.filter((x) => x.status === "open") ?? []
    },
    lastToolWrite: [r.lastMcpAt, ...(f?.history ?? []).filter((x) => x.actor === "ai").map((x) => x.at)].filter((x) => !!x).sort().at(-1) ?? null,
    policy: "此總覽唯讀，不是工作資料包。動畫與模型共用作品入口，各自保留精確版本與資料包。模型清單顯示最新登記候選，採用版及本集引用另列，禁止自動替換。作者告知完成不等於逐項素材驗看；未登記不推定未製作。執行前取得對應範圍的新資料包，實際讀取來源後才回報；不得代替作者核定。"
  };
}
var vx = /* @__PURE__ */ ca(((r) => {
  var h = /* @__PURE__ */ Symbol.for("react.transitional.element"), C = /* @__PURE__ */ Symbol.for("react.fragment");
  function f(p, k, x) {
    var A = null;
    if (x !== void 0 && (A = "" + x), k.key !== void 0 && (A = "" + k.key), "key" in k) {
      x = {};
      for (var N in k) N !== "key" && (x[N] = k[N]);
    } else x = k;
    return k = x.ref, {
      $$typeof: h,
      type: p,
      key: A,
      ref: k !== void 0 ? k : null,
      props: x
    };
  }
  r.Fragment = C, r.jsx = f, r.jsxs = f;
})), jx = /* @__PURE__ */ ca(((r, h) => {
  h.exports = vx();
})), l = jx(), mf = (r) => r ? new Date(r).toLocaleString("zh-TW", { timeZone: "Asia/Taipei" }) : "尚無紀錄";
function yx(r, h) {
  const C = URL.createObjectURL(new Blob([h], { type: "text/plain;charset=utf-8" })), f = document.createElement("a");
  f.href = C, f.download = r, f.click(), setTimeout(() => URL.revokeObjectURL(C), 1e3);
}
function Sx({ project: r, work: h, busy: C, onNavigate: f, onModel: p }) {
  const k = bx(r, h), [x, A] = (0, g.useState)(""), [N, _] = (0, g.useState)(""), [w, G] = (0, g.useState)("animation"), z = k.models.find((H) => H.versionId === w), le = k.episode.lastWork, ne = k.issues.animation.length + k.issues.context.length + k.issues.models.length, I = `請使用「立之雲端庫｜動畫製作流程」工具，接手 ${k.title}／${r.episode}。先呼叫 read_animation_workspace({projectId:${JSON.stringify(r.id)}})，重新讀取伺服器最新資料，不使用本段文字中的舊 revision。
${z ? `本次範圍為模型 ${z.key}（modelId=${z.modelId}），精確版本 ${z.label}（versionId=${z.versionId}），定位階段 ${z.stageId}。workId=${h.id}。用 read_animation_models 查此版本的全部來源、問題及最近回報，確認實際任務範圍後，用 acquire_animation_model_context 取得新資料包；完成後用 update_animation_model_stage 回報。最新候選不等於已採用版。` : `本次範圍為 ${r.episode} 動畫。先讀 read_animation_episode_brief 與 read_animation_episode_settings，再依最近交接確認任務。用 preview_animation_context 檢查指定範圍，acquire_animation_context 保存資料包，以 submit_animation_work 回報。作者已告知完成的集數以資料補登為主，不因紀錄空白重做。`}
實際讀取所需素材後才執行，缺件、矛盾或過期資料包先回報受阻。寫回已做內容、產出位置與版本、未解問題及下一步。保留原檔、作者採用版本與各集固定引用，不能自行正式核定。若目前對話沒有上述工具，明確告知尚未接通，不宣稱已讀取或已回寫。`, [X, oe] = (0, g.useState)(!1), q = k.episode.project.completionReport?.status === "completed", ie = [
    ...k.issues.context.map((H) => ({
      id: H.id,
      text: H.description,
      tab: "context"
    })),
    ...k.issues.animation.map((H) => ({
      id: H.id,
      text: H.reason,
      tab: "issues"
    })),
    ...k.issues.models.map((H) => ({
      id: H.id,
      text: H.reason,
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
          /* @__PURE__ */ (0, l.jsx)("h2", { children: q ? "本集已完成，繼續整理製作紀錄" : le ? "接著完成上次的工作" : "從本集製作資料開始" }),
          /* @__PURE__ */ (0, l.jsx)("p", { children: le?.nextStep || (q ? "補上採用檔案與製作過程，讓下一集和下一位 AI 都能接著用。" : "先整理劇本、角色與場景參考，再開始製作。") }),
          /* @__PURE__ */ (0, l.jsxs)("div", {
            className: "context-actions",
            children: [/* @__PURE__ */ (0, l.jsxs)("button", {
              className: "btn primary",
              disabled: C,
              onClick: () => f("context"),
              children: [
                q ? "繼續整理資料" : "開啟製作資料",
                " ",
                /* @__PURE__ */ (0, l.jsx)(di, { size: 16 })
              ]
            }), /* @__PURE__ */ (0, l.jsx)("button", {
              className: "btn",
              onClick: () => oe(!X),
              "aria-expanded": X,
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
            /* @__PURE__ */ (0, l.jsx)("strong", { children: q ? "已完成" : k.episode.project.completionReport?.status === "in_progress" ? "製作中" : "尚未登記" }),
            /* @__PURE__ */ (0, l.jsx)("small", { children: "依作者登記" })
          ] }),
          /* @__PURE__ */ (0, l.jsxs)("div", { children: [
            /* @__PURE__ */ (0, l.jsx)("span", { children: "未處理問題" }),
            /* @__PURE__ */ (0, l.jsxs)("strong", { children: [ne, /* @__PURE__ */ (0, l.jsx)("em", { children: " 項" })] }),
            /* @__PURE__ */ (0, l.jsx)("small", { children: "動畫、資料與模型合計" })
          ] }),
          /* @__PURE__ */ (0, l.jsxs)("button", {
            onClick: () => f("models"),
            children: [
              /* @__PURE__ */ (0, l.jsx)("span", { children: "共用模型" }),
              /* @__PURE__ */ (0, l.jsxs)("strong", { children: [k.models.length, /* @__PURE__ */ (0, l.jsx)("em", { children: " 個" })] }),
              /* @__PURE__ */ (0, l.jsx)("small", { children: "依已登記模型" })
            ]
          })
        ]
      }),
      X && /* @__PURE__ */ (0, l.jsxs)("article", {
        className: "wide-card ai-handoff",
        children: [
          /* @__PURE__ */ (0, l.jsxs)("div", {
            className: "section-title",
            children: [/* @__PURE__ */ (0, l.jsx)("h2", { children: "把這次工作交給 ChatGPT" }), /* @__PURE__ */ (0, l.jsx)("button", {
              className: "text-btn",
              onClick: () => oe(!1),
              children: "收起"
            })]
          }),
          /* @__PURE__ */ (0, l.jsx)("p", { children: "在已連接工作台的對話貼上指令，AI 會先讀取最新進度。" }),
          /* @__PURE__ */ (0, l.jsxs)("label", {
            className: "form-field",
            children: ["要接手的工作", /* @__PURE__ */ (0, l.jsxs)("select", {
              value: w,
              onChange: (H) => G(H.target.value),
              children: [/* @__PURE__ */ (0, l.jsxs)("option", {
                value: "animation",
                children: [r.episode, " 動畫與資料整理"]
              }), k.models.map((H) => /* @__PURE__ */ (0, l.jsxs)("option", {
                value: H.versionId,
                children: [
                  H.title,
                  " · ",
                  H.label
                ]
              }, H.versionId))]
            })]
          }),
          /* @__PURE__ */ (0, l.jsxs)("div", {
            className: "context-actions",
            children: [/* @__PURE__ */ (0, l.jsxs)("button", {
              className: "btn primary",
              onClick: async () => {
                try {
                  await navigator.clipboard.writeText(I), A("已複製，請貼到已連接工作台的 ChatGPT 對話。");
                } catch {
                  A("無法直接複製，請展開完整指令後手動複製。");
                }
              },
              children: [/* @__PURE__ */ (0, l.jsx)(pd, { size: 15 }), "複製接手指令"]
            }), /* @__PURE__ */ (0, l.jsx)("button", {
              className: "btn",
              onClick: () => f("chatgpt"),
              children: "查看連接方式"
            })]
          }),
          /* @__PURE__ */ (0, l.jsx)("p", {
            role: "status",
            children: x
          }),
          /* @__PURE__ */ (0, l.jsxs)("details", { children: [
            /* @__PURE__ */ (0, l.jsx)("summary", { children: "完整指令與下載" }),
            /* @__PURE__ */ (0, l.jsx)("textarea", {
              readOnly: !0,
              "aria-label": "AI 接手指令",
              rows: 8,
              value: I
            }),
            /* @__PURE__ */ (0, l.jsxs)("button", {
              className: "btn",
              onClick: () => yx(r.episode + "_AI接續指令.txt", I),
              children: [/* @__PURE__ */ (0, l.jsx)(dn, { size: 15 }), "下載指令"]
            })
          ] }),
          /* @__PURE__ */ (0, l.jsxs)("small", { children: [
            "複製指令不會自動啟動 AI。最近寫入：",
            mf(k.lastToolWrite),
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
                  /* @__PURE__ */ (0, l.jsx)(jl, { size: 22 }),
                  /* @__PURE__ */ (0, l.jsxs)("span", { children: [/* @__PURE__ */ (0, l.jsx)("b", { children: "動畫製作" }), /* @__PURE__ */ (0, l.jsx)("small", { children: "主線、片頭片尾與鏡頭素材" })] }),
                  /* @__PURE__ */ (0, l.jsx)(di, { size: 17 })
                ]
              }),
              /* @__PURE__ */ (0, l.jsxs)("button", {
                onClick: () => f("models"),
                children: [
                  /* @__PURE__ */ (0, l.jsx)(sd, { size: 22 }),
                  /* @__PURE__ */ (0, l.jsxs)("span", { children: [/* @__PURE__ */ (0, l.jsx)("b", { children: "3D 模型" }), /* @__PURE__ */ (0, l.jsx)("small", { children: "模型版本、檢查與採用紀錄" })] }),
                  /* @__PURE__ */ (0, l.jsx)(di, { size: 17 })
                ]
              }),
              /* @__PURE__ */ (0, l.jsxs)("button", {
                onClick: () => f("project"),
                children: [
                  /* @__PURE__ */ (0, l.jsx)(Tf, { size: 22 }),
                  /* @__PURE__ */ (0, l.jsxs)("span", { children: [/* @__PURE__ */ (0, l.jsx)("b", { children: "作品與後續集數" }), /* @__PURE__ */ (0, l.jsx)("small", { children: "管理集數與共用參考資料" })] }),
                  /* @__PURE__ */ (0, l.jsx)(di, { size: 17 })
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
              children: [ne, " 項"]
            })]
          }), ie.length ? /* @__PURE__ */ (0, l.jsxs)("div", {
            className: "attention-list",
            children: [ie.slice(0, 3).map((H) => /* @__PURE__ */ (0, l.jsxs)("button", {
              onClick: () => f(H.tab),
              children: [
                /* @__PURE__ */ (0, l.jsx)(oi, { size: 17 }),
                /* @__PURE__ */ (0, l.jsx)("span", { children: H.text }),
                /* @__PURE__ */ (0, l.jsx)(di, { size: 15 })
              ]
            }, H.id)), ie.length > 3 && /* @__PURE__ */ (0, l.jsxs)("details", { children: [/* @__PURE__ */ (0, l.jsxs)("summary", { children: [
              "其餘 ",
              ie.length - 3,
              " 項問題"
            ] }), ie.slice(3).map((H) => /* @__PURE__ */ (0, l.jsx)("button", {
              onClick: () => f(H.tab),
              children: H.text
            }, H.id))] })]
          }) : /* @__PURE__ */ (0, l.jsxs)("div", {
            className: "quiet-state",
            children: [
              /* @__PURE__ */ (0, l.jsx)(jl, { size: 28 }),
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
          le ? /* @__PURE__ */ (0, l.jsxs)(l.Fragment, { children: [
            /* @__PURE__ */ (0, l.jsx)("h3", { children: le.task }),
            /* @__PURE__ */ (0, l.jsx)("p", { children: le.summary }),
            le.needsReview && /* @__PURE__ */ (0, l.jsx)("p", {
              className: "resume-warning",
              children: "採用依據有更新，接手前請重新讀取。"
            }),
            /* @__PURE__ */ (0, l.jsx)("small", { children: mf(le.at) })
          ] }) : /* @__PURE__ */ (0, l.jsx)("p", { children: "尚無 AI 工作回報；這不代表沒有製作成果。" }),
          k.models.map((H) => /* @__PURE__ */ (0, l.jsxs)("div", {
            className: "home-model-row",
            children: [/* @__PURE__ */ (0, l.jsxs)("div", { children: [
              /* @__PURE__ */ (0, l.jsx)("b", { children: H.title }),
              /* @__PURE__ */ (0, l.jsxs)("p", { children: [
                "目前候選 ",
                H.label,
                " · 採用 ",
                H.adopted?.label ?? "尚未登記"
              ] }),
              /* @__PURE__ */ (0, l.jsx)("small", { children: H.nextStep })
            ] }), /* @__PURE__ */ (0, l.jsx)("button", {
              className: "btn",
              disabled: C,
              onClick: () => p({
                modelId: H.modelId,
                versionId: H.versionId,
                stageId: H.stageId
              }),
              children: "開啟版本"
            })]
          }, H.modelId)),
          /* @__PURE__ */ (0, l.jsxs)("details", { children: [
            /* @__PURE__ */ (0, l.jsxs)("summary", { children: [
              "本集固定模型引用（",
              k.pins.length,
              "）"
            ] }),
            k.pins.map((H, F) => /* @__PURE__ */ (0, l.jsxs)("p", { children: [
              H.title,
              " · ",
              H.label,
              " · ",
              H.purpose
            ] }, F)),
            /* @__PURE__ */ (0, l.jsx)("button", {
              className: "btn",
              onClick: () => f("settings"),
              children: "查看採用設定"
            })
          ] }),
          /* @__PURE__ */ (0, l.jsxs)("details", { children: [
            /* @__PURE__ */ (0, l.jsx)("summary", { children: "AI 接手識別資料" }),
            /* @__PURE__ */ (0, l.jsxs)("p", { children: ["集數 ID：", r.id] }),
            /* @__PURE__ */ (0, l.jsxs)("p", { children: ["作品 ID：", h?.id || "未歸屬"] }),
            /* @__PURE__ */ (0, l.jsxs)("p", { children: ["資料版本：", r.revision] })
          ] })
        ]
      })
    ]
  });
}
function Nx({ project: r, check: h }) {
  const [C, f] = (0, g.useState)(!1), [p, k] = (0, g.useState)(""), [x, A] = (0, g.useState)(""), N = `請使用「立之雲端庫｜動畫製作流程」外掛，先呼叫 read_animation_workspace，projectId 為 ${r.id}，確認 ${r.episode} 的目前進度、採用版本、未解問題與下一步。請重新讀取最新資料，不從聊天推定完成。若本集已由作者告知完成，先做資料補登。確認範圍後取得新的工作資料包，實際讀取參考素材，最後回報已做內容、成果位置、未完成項及下一步。若本對話沒有工具，請明確告知未連接。`;
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
              await navigator.clipboard.writeText(N), A("已複製，請貼到選用工作台的對話。");
            } catch {
              A("請展開完整指令後手動複製。");
            }
          },
          children: [/* @__PURE__ */ (0, l.jsx)(pd, { size: 16 }), "複製本集接手指令"]
        }),
        /* @__PURE__ */ (0, l.jsx)("p", {
          role: "status",
          children: x
        }),
        /* @__PURE__ */ (0, l.jsxs)("details", { children: [/* @__PURE__ */ (0, l.jsx)("summary", { children: "查看完整指令" }), /* @__PURE__ */ (0, l.jsx)("textarea", {
          "aria-label": "本集接手指令",
          readOnly: !0,
          rows: 7,
          value: N
        })] })
      ]
    }), /* @__PURE__ */ (0, l.jsxs)("article", {
      className: "wide-card",
      children: [
        /* @__PURE__ */ (0, l.jsxs)("h2", { children: [/* @__PURE__ */ (0, l.jsx)(on, { size: 20 }), " 連線與最近更新"] }),
        /* @__PURE__ */ (0, l.jsx)("p", { children: "網頁連線與對話工具是兩個檢查項目；這個按鈕會檢查網頁能否讀取共用資料。" }),
        /* @__PURE__ */ (0, l.jsxs)("button", {
          className: "btn",
          disabled: C,
          onClick: async () => {
            f(!0), k("");
            try {
              await h(), k("共用資料讀取成功。對話是否已選用外掛，仍需由 ChatGPT 實際呼叫工具確認。");
            } catch (_) {
              k("讀取失敗：" + (_ instanceof Error ? _.message : String(_)));
            } finally {
              f(!1);
            }
          },
          children: [/* @__PURE__ */ (0, l.jsx)(Wa, {
            size: 15,
            className: C ? "spin" : ""
          }), C ? "檢查中…" : "檢查資料連線"]
        }),
        /* @__PURE__ */ (0, l.jsx)("p", {
          role: "status",
          children: p
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
var xf = {
  rule: "規則／決策",
  script: "劇本／台詞",
  character: "角色",
  scene: "場景",
  audio: "聲音",
  reference: "原作／參考"
};
function wx({ project: r, busy: h, mutate: C }) {
  const [f, p] = (0, g.useState)(""), [k, x] = (0, g.useState)(""), [A, N] = (0, g.useState)(""), [_, w] = (0, g.useState)(30), [G, z] = (0, g.useState)("main"), [le, ne] = (0, g.useState)(null), [I, X] = (0, g.useState)(""), [oe, q] = (0, g.useState)(""), [ie, H] = (0, g.useState)({
    content: "",
    source: "",
    location: ""
  }), F = Nl(r).records, $ = r.production?.sections ?? [], pe = $.find((b) => b.stageId === f), te = F.filter(rn).length, P = Wr(r, f), y = $.reduce((b, ae) => b + Wr(r, ae.stageId).filter((K) => K.status === "open").length, 0), ee = new Set($.flatMap((b) => b.recordKeys)), ge = F.filter((b) => (!f || pe?.recordKeys.includes(b.key) || b.scope.type === "stage" && b.scope.target === f) && (!A || b.kind === A) && (!k || [
    b.title,
    b.key,
    b.content,
    b.source,
    b.scope.target
  ].join(" ").toLowerCase().includes(k.toLowerCase()))).sort((b, ae) => (b.key.startsWith("ep01_src_") ? 1 : ee.has(b.key) ? 0 : 2) - (ae.key.startsWith("ep01_src_") ? 1 : ee.has(ae.key) ? 0 : 2));
  async function me(b) {
    if (ne(null), X(""), !!b)
      try {
        if (b.size > 15e5) throw new Error("資料包不可超過 1.5 MB");
        const ae = JSON.parse(await b.text());
        if (ae.schemaVersion !== 1 || ae.episode !== r.episode || !Array.isArray(ae.records) || !Array.isArray(ae.shots) || !Array.isArray(ae.sections)) throw new Error("請選擇相同集數的製作資料包");
        ne(ae);
      } catch (ae) {
        X(ae instanceof Error ? ae.message : "資料包讀取失敗");
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
          const b = URL.createObjectURL(new Blob([JSON.stringify({
            episode: r.episode,
            production: r.production,
            records: F,
            shots: r.shots
          }, null, 2)], { type: "application/json" })), ae = document.createElement("a");
          ae.href = b, ae.download = r.episode + "_製作資料.json", ae.click(), setTimeout(() => URL.revokeObjectURL(b), 1e3);
        },
        children: "匯出製作資料"
      })]
    }),
    /* @__PURE__ */ (0, l.jsxs)("div", {
      className: "production-totals",
      children: [
        /* @__PURE__ */ (0, l.jsxs)("b", { children: [F.length, " 筆資料"] }),
        /* @__PURE__ */ (0, l.jsxs)("b", { children: [r.shots.length, " 列鏡頭規劃"] }),
        /* @__PURE__ */ (0, l.jsxs)("b", { children: [$.length, " 個階段已盤點"] }),
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
        /* @__PURE__ */ (0, l.jsxs)("b", { children: [te, " 筆已確認收錄"] }),
        /* @__PURE__ */ (0, l.jsx)("p", { children: r.production.acceptance.note }),
        /* @__PURE__ */ (0, l.jsxs)("p", { children: [
          "補齊已開放 · ",
          y,
          " 項待補。可直接保存補充內容，不需逐筆再確認。不同來源版本保留，採用版本另行指定。"
        ] })
      ] }) : /* @__PURE__ */ (0, l.jsxs)(l.Fragment, { children: [/* @__PURE__ */ (0, l.jsx)("p", { children: "依作者確認，將已完成的資料一次通過，並開放剩餘項目直接補齊。" }), /* @__PURE__ */ (0, l.jsx)("button", {
        className: "btn primary",
        disabled: h || r.archived || !$.length,
        onClick: () => {
          C("accept_production_data", { note: "依作者2026-10-21指示：目前先不用檢核，已完成的資料直接通過；剩餘項目開放直接補齊。" });
        },
        children: "通過現有資料並開放補齊"
      })] })
    }),
    /* @__PURE__ */ (0, l.jsxs)("div", {
      className: "production-filters",
      children: [
        /* @__PURE__ */ (0, l.jsxs)("label", { children: ["搜尋實際內容", /* @__PURE__ */ (0, l.jsx)("input", {
          placeholder: "台詞、F077、G11、角色或素材名稱",
          value: k,
          onChange: (b) => {
            x(b.target.value), w(30);
          }
        })] }),
        /* @__PURE__ */ (0, l.jsxs)("label", { children: ["製作階段", /* @__PURE__ */ (0, l.jsxs)("select", {
          value: f,
          onChange: (b) => {
            p(b.target.value), w(30);
          },
          children: [/* @__PURE__ */ (0, l.jsx)("option", {
            value: "",
            children: "全部階段"
          }), Pt.map((b) => /* @__PURE__ */ (0, l.jsxs)("option", {
            value: b.id,
            children: [
              b.id,
              " ",
              b.title
            ]
          }, b.id))]
        })] }),
        /* @__PURE__ */ (0, l.jsxs)("label", { children: ["資料種類", /* @__PURE__ */ (0, l.jsxs)("select", {
          value: A,
          onChange: (b) => {
            N(b.target.value), w(30);
          },
          children: [/* @__PURE__ */ (0, l.jsx)("option", {
            value: "",
            children: "全部種類"
          }), Object.entries(xf).map(([b, ae]) => /* @__PURE__ */ (0, l.jsx)("option", {
            value: b,
            children: ae
          }, b))]
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
      ].map(([b, ae]) => /* @__PURE__ */ (0, l.jsx)("button", {
        className: G === b ? "active" : "",
        onClick: () => z(b),
        children: ae
      }, b))
    }),
    /* @__PURE__ */ (0, l.jsx)("div", {
      className: "production-grid",
      children: Pt.filter((b) => b.group === G).map((b) => {
        const ae = $.find((Y) => Y.stageId === b.id), K = Wr(r, b.id).filter((Y) => Y.status === "open").length;
        return /* @__PURE__ */ (0, l.jsxs)("button", {
          className: "production-stage " + (f === b.id ? "selected" : ""),
          onClick: () => {
            p(f === b.id ? "" : b.id), q(""), w(30);
          },
          children: [
            /* @__PURE__ */ (0, l.jsx)("small", { children: b.group === "main" ? b.id : b.group.toUpperCase() + " " + b.id.slice(2) }),
            /* @__PURE__ */ (0, l.jsx)("b", { children: b.title }),
            /* @__PURE__ */ (0, l.jsx)("span", { children: ae ? ae.recordKeys.length + " 筆相關資料" : "尚未盤點" }),
            /* @__PURE__ */ (0, l.jsx)("em", { children: ae ? K + " 項待補" : "待補資料" })
          ]
        }, b.id);
      })
    }),
    pe && /* @__PURE__ */ (0, l.jsxs)("div", {
      className: "production-gaps",
      children: [
        /* @__PURE__ */ (0, l.jsxs)("h3", { children: [Pt.find((b) => b.id === f)?.title, " · 資料盤點"] }),
        /* @__PURE__ */ (0, l.jsx)("p", { children: pe.overview }),
        /* @__PURE__ */ (0, l.jsx)("b", { children: "補齊清單" }),
        P.length ? /* @__PURE__ */ (0, l.jsx)("div", { children: P.map((b) => /* @__PURE__ */ (0, l.jsxs)("article", {
          className: "production-gap",
          children: [
            /* @__PURE__ */ (0, l.jsx)("span", {
              className: "status " + (b.status === "filled" ? "passed" : "candidate"),
              children: b.status === "filled" ? "已補資料" : r.production?.supplementsOpen ? "開放補齊" : "待補"
            }),
            /* @__PURE__ */ (0, l.jsx)("p", { children: b.description }),
            b.record && /* @__PURE__ */ (0, l.jsxs)("details", { children: [
              /* @__PURE__ */ (0, l.jsx)("summary", { children: "查看已補內容與來源" }),
              /* @__PURE__ */ (0, l.jsx)("div", {
                className: "production-source-text",
                children: b.record.content
              }),
              /* @__PURE__ */ (0, l.jsxs)("p", { children: ["來源：", b.record.source] }),
              /* @__PURE__ */ (0, l.jsxs)("p", { children: ["素材位置：", b.record.location || "內容已記錄"] })
            ] }),
            r.production?.supplementsOpen && (oe === f + ":" + b.index ? /* @__PURE__ */ (0, l.jsxs)("form", {
              className: "context-form",
              onSubmit: async (ae) => {
                ae.preventDefault(), await C("supplement_production_data", {
                  stageId: f,
                  gapIndex: b.index,
                  ...ie
                }) && (q(""), H({
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
                  onChange: (ae) => H({
                    ...ie,
                    content: ae.target.value
                  })
                })] }),
                /* @__PURE__ */ (0, l.jsxs)("label", { children: ["補件來源", /* @__PURE__ */ (0, l.jsx)("input", {
                  required: !0,
                  maxLength: 2e3,
                  value: ie.source,
                  onChange: (ae) => H({
                    ...ie,
                    source: ae.target.value
                  })
                })] }),
                /* @__PURE__ */ (0, l.jsxs)("label", { children: ["補件素材位置", /* @__PURE__ */ (0, l.jsx)("input", {
                  maxLength: 2e3,
                  value: ie.location,
                  onChange: (ae) => H({
                    ...ie,
                    location: ae.target.value
                  })
                })] }),
                /* @__PURE__ */ (0, l.jsxs)("div", {
                  className: "context-actions",
                  children: [/* @__PURE__ */ (0, l.jsx)("button", {
                    className: "btn",
                    type: "button",
                    onClick: () => q(""),
                    children: "取消"
                  }), /* @__PURE__ */ (0, l.jsx)("button", {
                    className: "btn primary",
                    disabled: h || r.archived,
                    children: "直接保存補齊內容"
                  })]
                })
              ]
            }) : /* @__PURE__ */ (0, l.jsx)("button", {
              className: "btn",
              disabled: h || r.archived,
              onClick: () => {
                q(f + ":" + b.index), H({
                  content: b.record?.content ?? "",
                  source: b.record?.source ?? "",
                  location: b.record?.location ?? ""
                });
              },
              children: b.status === "filled" ? "追加補充版本" : "補齊此項"
            }))
          ]
        }, b.index)) }) : /* @__PURE__ */ (0, l.jsx)("p", { children: "本次盤點未列缺件。" })
      ]
    }),
    /* @__PURE__ */ (0, l.jsxs)("p", {
      className: "muted",
      children: [
        "找到 ",
        ge.length,
        " 筆資料；展開可讀取完整內容與來源。"
      ]
    }),
    /* @__PURE__ */ (0, l.jsx)("div", {
      className: "production-records",
      children: ge.slice(0, _).map((b) => /* @__PURE__ */ (0, l.jsxs)("details", {
        className: "production-record",
        children: [
          /* @__PURE__ */ (0, l.jsxs)("summary", { children: [
            /* @__PURE__ */ (0, l.jsx)("span", {
              className: "status " + (rn(b) ? "passed" : "candidate"),
              children: b.status === "effective" ? "採用版本" : b.status === "superseded" ? "已停用" : rn(b) ? "資料已通過" : "來源資料／待確認"
            }),
            /* @__PURE__ */ (0, l.jsx)("b", { children: b.title }),
            /* @__PURE__ */ (0, l.jsxs)("small", { children: [
              xf[b.kind],
              " · ",
              b.scope.target || "本集共用"
            ] })
          ] }),
          /* @__PURE__ */ (0, l.jsxs)("code", {
            className: "context-id",
            children: [
              b.key,
              " · v",
              b.version
            ]
          }),
          /* @__PURE__ */ (0, l.jsx)("div", {
            className: "production-source-text",
            children: b.content
          }),
          /* @__PURE__ */ (0, l.jsxs)("p", {
            className: "context-source",
            children: [
              "來源：",
              b.source,
              /* @__PURE__ */ (0, l.jsx)("br", {}),
              "素材位置：",
              b.location || "內容已收錄於本資料；無外部素材位置"
            ]
          })
        ]
      }, b.id))
    }),
    ge.length > _ && /* @__PURE__ */ (0, l.jsx)("button", {
      className: "btn",
      onClick: () => w(_ + 30),
      children: "再顯示 30 筆資料"
    }),
    !F.length && /* @__PURE__ */ (0, l.jsx)("p", {
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
          disabled: h || r.archived,
          onChange: (b) => {
            me(b.target.files?.[0]);
          }
        })] }),
        I && /* @__PURE__ */ (0, l.jsx)("p", {
          role: "alert",
          children: I
        }),
        le && /* @__PURE__ */ (0, l.jsxs)("div", {
          className: "inline-note",
          children: [
            /* @__PURE__ */ (0, l.jsx)("b", { children: String(le.title) }),
            /* @__PURE__ */ (0, l.jsxs)("p", { children: [
              String(le.episode),
              " · ",
              le.records.length,
              " 筆來源資料 · ",
              le.shots.length,
              " 列待製作鏡頭 · ",
              le.sections.length,
              " 個階段盤點"
            ] }),
            /* @__PURE__ */ (0, l.jsx)("button", {
              className: "btn primary",
              disabled: h || r.archived,
              onClick: async () => {
                await C("import_production_data", le) && (ne(null), p(""), x(""), N(""));
              },
              children: "保存製作資料包"
            })
          ]
        }),
        r.production?.imports.map((b) => /* @__PURE__ */ (0, l.jsxs)("p", {
          className: "muted",
          children: [
            "已補入：",
            b.title,
            " · ",
            b.records,
            " 筆資料／",
            b.shots,
            " 列鏡頭"
          ]
        }, b.id))
      ]
    })
  ] });
}
function zx({ shotId: r, selection: h, disabled: C, mutate: f }) {
  const p = [
    ["output", "實際採用檔位置"],
    ["outputVersion", "採用檔版本"],
    ["reason", "選用原因"],
    ["source", "採用依據來源"],
    ["editorVersion", "剪輯工程版本"],
    ["inPoint", "工程入點"],
    ["outPoint", "工程出點"]
  ], [k, x] = (0, g.useState)(() => Object.fromEntries(p.map(([A]) => [A, h?.[A] ?? ""])));
  return /* @__PURE__ */ (0, l.jsxs)("details", {
    className: "selection-editor",
    children: [/* @__PURE__ */ (0, l.jsx)("summary", { children: "登記採用檔與工程位置" }), /* @__PURE__ */ (0, l.jsxs)("form", {
      className: "context-form",
      onSubmit: async (A) => {
        A.preventDefault(), await f("register_shot_selection", {
          ...k,
          shotId: r,
          baseVersion: h?.version ?? 0
        });
      },
      children: [
        p.map(([A, N]) => /* @__PURE__ */ (0, l.jsxs)("label", { children: [N, /* @__PURE__ */ (0, l.jsx)("input", {
          required: [
            "output",
            "outputVersion",
            "reason",
            "source"
          ].includes(A),
          maxLength: A === "reason" ? 3e3 : 2e3,
          value: k[A],
          onChange: (_) => x({
            ...k,
            [A]: _.target.value
          })
        })] }, A)),
        /* @__PURE__ */ (0, l.jsx)("p", {
          className: "muted",
          children: "工程入出點須成對填寫。保存來源與選用版本；素材實際開啟及檢視另行記錄。"
        }),
        /* @__PURE__ */ (0, l.jsx)("button", {
          className: "btn primary",
          disabled: C,
          children: "保存採用紀錄版本"
        })
      ]
    })]
  });
}
function kx({ project: r, busy: h, mutate: C }) {
  const [f, p] = (0, g.useState)(""), [k, x] = (0, g.useState)(""), [A, N] = (0, g.useState)(""), [_, w] = (0, g.useState)(20), G = [...new Map((r.production?.selections ?? []).map((I) => [I.shotId, I])).values()], z = [...new Map((r.production?.links ?? []).map((I) => [I.shotId, I])).values()], le = Nl(r).records, ne = r.shots.filter((I) => [
    I.id,
    I.scene,
    I.description,
    I.legacyIds
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
          z.length,
          " / ",
          r.shots.length,
          " 列已建立關聯"
        ] }),
        /* @__PURE__ */ (0, l.jsxs)("b", { children: [z.filter((I) => I.references.length).length, " 列有影格來源定位"] }),
        /* @__PURE__ */ (0, l.jsxs)("b", { children: [(/* @__PURE__ */ new Set([...G.map((I) => I.shotId), ...z.filter((I) => I.adoptedOutput).map((I) => I.shotId)])).size, " 列已登記採用檔"] })
      ]
    }),
    /* @__PURE__ */ (0, l.jsxs)("label", {
      className: "work-search",
      children: ["搜尋鏡頭關聯", /* @__PURE__ */ (0, l.jsx)("input", {
        value: f,
        onChange: (I) => {
          p(I.target.value), w(20);
        },
        placeholder: "F077、G11、S06 或鏡頭 ID"
      })]
    }),
    ne.slice(0, _).map((I) => {
      const X = z.find((q) => q.shotId === I.id), oe = G.find((q) => q.shotId === I.id);
      return /* @__PURE__ */ (0, l.jsxs)("details", {
        className: "production-record",
        children: [
          /* @__PURE__ */ (0, l.jsxs)("summary", { children: [/* @__PURE__ */ (0, l.jsxs)("b", { children: [
            I.id,
            " · ",
            I.legacyIds
          ] }), /* @__PURE__ */ (0, l.jsxs)("small", { children: [
            I.scene,
            " · ",
            X ? "關聯已建立" : "來源對應待補"
          ] })] }),
          /* @__PURE__ */ (0, l.jsx)("p", {
            className: "production-source-text",
            children: I.description
          }),
          X ? /* @__PURE__ */ (0, l.jsxs)(l.Fragment, { children: [
            /* @__PURE__ */ (0, l.jsxs)("div", {
              className: "production-gaps",
              children: [
                /* @__PURE__ */ (0, l.jsx)("b", { children: "接著做什麼" }),
                /* @__PURE__ */ (0, l.jsx)("p", { children: oe ? "採用檔已登記；接著開啟素材並對照工程版本與入出點。" : X.nextStep }),
                /* @__PURE__ */ (0, l.jsxs)("p", { children: ["採用檔：", oe?.output || X.adoptedOutput || "位置尚未登記"] }),
                /* @__PURE__ */ (0, l.jsxs)("p", { children: ["選用原因：", oe?.reason || X.selectionReason || "尚未登記"] }),
                X.unknowns.length > 0 && /* @__PURE__ */ (0, l.jsx)("p", {
                  className: "muted",
                  children: "來源盤點時的缺口；新增採用登記另列於下方。"
                }),
                X.unknowns.length > 0 && /* @__PURE__ */ (0, l.jsx)("ul", { children: X.unknowns.map((q, ie) => /* @__PURE__ */ (0, l.jsx)("li", { children: q }, ie)) })
              ]
            }),
            oe && /* @__PURE__ */ (0, l.jsxs)("div", {
              className: "context-mini",
              children: [
                /* @__PURE__ */ (0, l.jsxs)("b", { children: [
                  "採用登記 v",
                  oe.version,
                  " · ",
                  oe.outputVersion
                ] }),
                /* @__PURE__ */ (0, l.jsxs)("p", { children: ["依據：", oe.source] }),
                /* @__PURE__ */ (0, l.jsxs)("p", { children: [
                  "工程：",
                  oe.editorVersion || "未登記",
                  " · ",
                  oe.inPoint || "未登記",
                  " → ",
                  oe.outPoint || "未登記"
                ] })
              ]
            }),
            /* @__PURE__ */ (0, l.jsx)("h3", { children: "使用依據與提示詞" }),
            X.recordKeys.map((q) => {
              const ie = le.find((H) => H.key === q);
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
              }, q) : null;
            }),
            /* @__PURE__ */ (0, l.jsx)("h3", { children: "來源影格定位" }),
            X.references.length ? X.references.map((q, ie) => /* @__PURE__ */ (0, l.jsxs)("div", {
              className: "context-mini",
              children: [
                /* @__PURE__ */ (0, l.jsx)("b", { children: q.file }),
                /* @__PURE__ */ (0, l.jsxs)("p", { children: ["素材包：", q.archive] }),
                /* @__PURE__ */ (0, l.jsxs)("p", { children: ["包內位置：", q.member] }),
                /* @__PURE__ */ (0, l.jsxs)("code", {
                  className: "context-id",
                  children: ["SHA-256 ", q.sha256 || "來源未列"]
                }),
                /* @__PURE__ */ (0, l.jsx)("small", { children: "依來源索引定位；實際圖像讀取狀態另記。" })
              ]
            }, ie)) : /* @__PURE__ */ (0, l.jsx)("p", { children: "目前來源未對上此影格。" }),
            /* @__PURE__ */ (0, l.jsx)("h3", { children: "剪輯對照候選" }),
            /* @__PURE__ */ (0, l.jsx)("p", {
              className: "muted",
              children: "以下時間來自指定來源表，尚未指定為本鏡實際入片位置。"
            }),
            X.timelineCandidates.map((q, ie) => /* @__PURE__ */ (0, l.jsxs)("div", {
              className: "context-mini",
              children: [
                /* @__PURE__ */ (0, l.jsxs)("b", { children: [
                  "序號 ",
                  q.sequence,
                  " · ",
                  q.start,
                  " → ",
                  q.end
                ] }),
                /* @__PURE__ */ (0, l.jsx)("p", { children: q.text }),
                /* @__PURE__ */ (0, l.jsx)("small", { children: q.source })
              ]
            }, ie)),
            !X.timelineCandidates.length && /* @__PURE__ */ (0, l.jsx)("p", { children: "尚缺可核實的剪輯對照。" }),
            /* @__PURE__ */ (0, l.jsx)("h3", { children: "台詞與音檔對照候選" }),
            X.voiceCandidates.map((q, ie) => /* @__PURE__ */ (0, l.jsxs)("div", {
              className: "context-mini",
              children: [
                /* @__PURE__ */ (0, l.jsx)("b", { children: q.lineId }),
                /* @__PURE__ */ (0, l.jsx)("p", { children: q.file }),
                /* @__PURE__ */ (0, l.jsxs)("small", { children: [
                  q.start,
                  " → ",
                  q.end,
                  " · ",
                  q.source
                ] })
              ]
            }, ie)),
            !X.voiceCandidates.length && /* @__PURE__ */ (0, l.jsx)("p", { children: "尚未建立明確台詞對應，不依編號猜配。" })
          ] }) : /* @__PURE__ */ (0, l.jsx)("p", { children: "請補來源與實際輸出對應。" }),
          /* @__PURE__ */ (0, l.jsx)(zx, {
            shotId: I.id,
            selection: oe,
            disabled: h || r.archived,
            mutate: C
          }, oe?.id ?? I.id)
        ]
      }, I.id);
    }),
    ne.length > _ && /* @__PURE__ */ (0, l.jsx)("button", {
      className: "btn",
      onClick: () => w(_ + 20),
      children: "再顯示 20 列"
    }),
    /* @__PURE__ */ (0, l.jsxs)("details", {
      className: "production-import",
      children: [
        /* @__PURE__ */ (0, l.jsx)("summary", { children: "補入鏡頭製作關聯" }),
        /* @__PURE__ */ (0, l.jsx)("p", { children: "貼上包含 bundleId 與 links 清單的 JSON；所有鏡頭與資料識別鍵必須已存在。保留歷次關聯。" }),
        /* @__PURE__ */ (0, l.jsxs)("label", { children: ["鏡頭關聯 JSON", /* @__PURE__ */ (0, l.jsx)("textarea", {
          rows: 5,
          value: k,
          onChange: (I) => {
            x(I.target.value), N("");
          }
        })] }),
        A && /* @__PURE__ */ (0, l.jsx)("p", {
          role: "alert",
          children: A
        }),
        /* @__PURE__ */ (0, l.jsx)("button", {
          className: "btn primary",
          disabled: h || r.archived || !k.trim(),
          onClick: async () => {
            try {
              await C("save_production_links", JSON.parse(k)) && x("");
            } catch (I) {
              N(I instanceof Error ? I.message : "格式錯誤");
            }
          },
          children: "保存鏡頭製作關聯"
        })
      ]
    })
  ] });
}
var cn = {
  reference: "來源候選",
  adopted: "本集採用",
  withdrawn: "停止沿用",
  unresolved: "版本待補登"
}, gf = {
  script: "劇本",
  character: "角色",
  scene: "場景",
  voice: "聲線",
  op_audio: "OP音軌",
  ed_audio: "ED音軌",
  edit: "剪輯工程"
}, Es = (r) => r.split(/[,，\n]/).map((h) => h.trim()).filter(Boolean), bf = {
  key: "",
  title: "",
  content: "",
  source: "",
  note: "",
  stageIdsText: "",
  sceneIdsText: "",
  status: "reference",
  baseVersion: 0
}, vf = {
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
function Rf({ project: r, busy: h, mutate: C }) {
  const [f, p] = (0, g.useState)(!1), [k, x] = (0, g.useState)(!1), [A, N] = (0, g.useState)(bf), [_, w] = (0, g.useState)(vf), [G, z] = (0, g.useState)(""), [le, ne] = (0, g.useState)(""), [I, X] = (0, g.useState)(""), oe = mx(r), q = h || r.archived, ie = $a(r.episodeRules ?? []), H = $a(r.baselines ?? []), F = (y) => !G || [y.key, y.title].join(" ").toLowerCase().includes(G.toLowerCase());
  function $(y) {
    N({
      ...y,
      stageIdsText: y.stageIds.join(", "),
      sceneIdsText: y.sceneIds.join(", "),
      baseVersion: pi(r.episodeRules ?? []).find((ee) => ee.key === y.key).version
    }), p(!0);
  }
  function pe(y) {
    w({
      ...y,
      recordKey: y.snapshot?.key ?? "",
      recordVersion: y.recordVersion ?? 1,
      content: y.snapshot?.content ?? "",
      stageIdsText: y.stageIds.join(", "),
      sceneIdsText: y.sceneIds.join(", "),
      baseVersion: pi(r.baselines ?? []).find((ee) => ee.key === y.key).version
    }), x(!0);
  }
  async function te(y, ee) {
    await C("save_episode_rule", {
      ...y,
      status: ee,
      baseVersion: oe.rules.find((ge) => ge.key === y.key).version
    });
  }
  async function P(y, ee) {
    await C("register_episode_baseline", {
      ...y,
      status: ee,
      recordKey: y.snapshot?.key ?? "",
      recordVersion: y.recordVersion,
      content: y.snapshot?.content ?? "",
      baseVersion: oe.baselines.find((ge) => ge.key === y.key).version
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
              /* @__PURE__ */ (0, l.jsxs)("b", { children: [H.length, " 項來源已採用"] }),
              /* @__PURE__ */ (0, l.jsxs)("span", { children: [oe.baselines.filter((y) => y.status === "unresolved").length, " 項版本待補登"] })
            ]
          }),
          /* @__PURE__ */ (0, l.jsx)("p", {
            className: "inline-note",
            children: "候選新版本保留原採用版。採用紀錄、來源收錄與素材實際檢視分開保存。"
          }),
          /* @__PURE__ */ (0, l.jsxs)("label", {
            className: "work-search",
            children: ["搜尋規則與採用項目", /* @__PURE__ */ (0, l.jsx)("input", {
              value: G,
              onChange: (y) => z(y.target.value),
              placeholder: "規則、角色、劇本、聲線或音軌"
            })]
          }),
          /* @__PURE__ */ (0, l.jsxs)("details", { children: [/* @__PURE__ */ (0, l.jsx)("summary", { children: "通用流程檢查項目" }), oe.genericChecks.map((y) => /* @__PURE__ */ (0, l.jsxs)("div", {
            className: "context-mini",
            children: [/* @__PURE__ */ (0, l.jsxs)("b", { children: [
              y.id,
              " ",
              y.title
            ] }), /* @__PURE__ */ (0, l.jsx)("ul", { children: y.checks.map((ee) => /* @__PURE__ */ (0, l.jsx)("li", { children: ee }, ee)) })]
          }, y.id))] }),
          r.workflowLegacy && /* @__PURE__ */ (0, l.jsxs)("details", { children: [
            /* @__PURE__ */ (0, l.jsx)("summary", { children: "保留的舊版檢查表紀錄" }),
            /* @__PURE__ */ (0, l.jsx)("p", { children: "舊版單集條件及勾選狀態保留在此；本集實際適用的規則另列於下方。" }),
            r.workflowLegacy.stages.map((y) => /* @__PURE__ */ (0, l.jsxs)("div", {
              className: "context-mini",
              children: [/* @__PURE__ */ (0, l.jsxs)("b", { children: ["舊階段 ", y.stageId] }), y.labels.map((ee, ge) => /* @__PURE__ */ (0, l.jsxs)("p", { children: [
                y.checks[ge] ? "已勾選" : "未勾選",
                " · ",
                ee
              ] }, ge))]
            }, y.stageId))
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
              disabled: q,
              onClick: () => {
                N(bf), p(!f);
              },
              children: "新增本集規則"
            })]
          }),
          f && /* @__PURE__ */ (0, l.jsxs)("form", {
            className: "context-form",
            onSubmit: async (y) => {
              y.preventDefault(), await C("save_episode_rule", {
                ...A,
                stageIds: Es(A.stageIdsText),
                sceneIds: Es(A.sceneIdsText)
              }) && p(!1);
            },
            children: [
              /* @__PURE__ */ (0, l.jsxs)("div", {
                className: "context-form-grid",
                children: [/* @__PURE__ */ (0, l.jsxs)("label", { children: ["規則識別鍵", /* @__PURE__ */ (0, l.jsx)("input", {
                  required: !0,
                  readOnly: !!A.baseVersion,
                  maxLength: 100,
                  value: A.key,
                  onChange: (y) => N({
                    ...A,
                    key: y.target.value
                  })
                })] }), /* @__PURE__ */ (0, l.jsxs)("label", { children: ["規則名稱", /* @__PURE__ */ (0, l.jsx)("input", {
                  required: !0,
                  maxLength: 200,
                  value: A.title,
                  onChange: (y) => N({
                    ...A,
                    title: y.target.value
                  })
                })] })]
              }),
              /* @__PURE__ */ (0, l.jsxs)("label", { children: ["規則內容", /* @__PURE__ */ (0, l.jsx)("textarea", {
                required: !0,
                rows: 4,
                maxLength: 6e3,
                value: A.content,
                onChange: (y) => N({
                  ...A,
                  content: y.target.value
                })
              })] }),
              /* @__PURE__ */ (0, l.jsxs)("label", { children: ["規則來源", /* @__PURE__ */ (0, l.jsx)("input", {
                required: !0,
                maxLength: 2e3,
                value: A.source,
                onChange: (y) => N({
                  ...A,
                  source: y.target.value
                })
              })] }),
              /* @__PURE__ */ (0, l.jsxs)("div", {
                className: "context-form-grid",
                children: [/* @__PURE__ */ (0, l.jsxs)("label", { children: ["規則適用階段", /* @__PURE__ */ (0, l.jsx)("input", {
                  value: A.stageIdsText,
                  placeholder: "逗號分隔；留空為本集共用",
                  onChange: (y) => N({
                    ...A,
                    stageIdsText: y.target.value
                  })
                })] }), /* @__PURE__ */ (0, l.jsxs)("label", { children: ["規則適用場次", /* @__PURE__ */ (0, l.jsx)("input", {
                  value: A.sceneIdsText,
                  placeholder: "逗號分隔；留空為全部場次",
                  onChange: (y) => N({
                    ...A,
                    sceneIdsText: y.target.value
                  })
                })] })]
              }),
              /* @__PURE__ */ (0, l.jsxs)("label", { children: ["規則狀態", /* @__PURE__ */ (0, l.jsx)("select", {
                value: A.status,
                onChange: (y) => N({
                  ...A,
                  status: y.target.value
                }),
                children: Object.entries(cn).map(([y, ee]) => /* @__PURE__ */ (0, l.jsx)("option", {
                  value: y,
                  children: ee
                }, y))
              })] }),
              /* @__PURE__ */ (0, l.jsxs)("label", { children: ["規則備註", /* @__PURE__ */ (0, l.jsx)("textarea", {
                rows: 2,
                value: A.note,
                onChange: (y) => N({
                  ...A,
                  note: y.target.value
                })
              })] }),
              /* @__PURE__ */ (0, l.jsx)("button", {
                className: "btn primary",
                disabled: q,
                children: "保存本集規則版本"
              })
            ]
          }),
          oe.rules.filter(F).map((y) => {
            const ee = ie.find((ge) => ge.key === y.key);
            return /* @__PURE__ */ (0, l.jsxs)("details", {
              className: "production-record",
              children: [
                /* @__PURE__ */ (0, l.jsxs)("summary", { children: [/* @__PURE__ */ (0, l.jsx)("b", { children: y.title }), /* @__PURE__ */ (0, l.jsxs)("span", { children: [
                  cn[y.status],
                  " · v",
                  y.version
                ] })] }),
                /* @__PURE__ */ (0, l.jsx)("code", { children: y.key }),
                /* @__PURE__ */ (0, l.jsx)("p", {
                  className: "production-source-text",
                  children: y.content
                }),
                /* @__PURE__ */ (0, l.jsxs)("p", { children: ["來源：", y.source] }),
                /* @__PURE__ */ (0, l.jsxs)("p", { children: [
                  "階段：",
                  y.stageIds.join("、") || "本集共用",
                  " · 場次：",
                  y.sceneIds.join("、") || "全部場次"
                ] }),
                /* @__PURE__ */ (0, l.jsx)("p", { children: y.note }),
                ee && ee.id !== y.id && /* @__PURE__ */ (0, l.jsxs)("div", {
                  className: "context-mini",
                  children: [
                    /* @__PURE__ */ (0, l.jsxs)("b", { children: ["仍沿用已採用 v", ee.version] }),
                    /* @__PURE__ */ (0, l.jsx)("p", { children: ee.content }),
                    /* @__PURE__ */ (0, l.jsxs)("small", { children: ["來源：", ee.source] })
                  ]
                }),
                /* @__PURE__ */ (0, l.jsxs)("div", {
                  className: "context-actions",
                  children: [
                    /* @__PURE__ */ (0, l.jsx)("button", {
                      className: "btn",
                      disabled: q,
                      onClick: () => $(y),
                      children: "編輯規則新版本"
                    }),
                    y.status === "reference" && /* @__PURE__ */ (0, l.jsx)("button", {
                      className: "btn primary",
                      disabled: q,
                      onClick: () => {
                        te(y, "adopted");
                      },
                      children: "採用此規則"
                    }),
                    ee && /* @__PURE__ */ (0, l.jsx)("button", {
                      className: "btn",
                      disabled: q,
                      onClick: () => {
                        te(ee, "withdrawn");
                      },
                      children: "停止沿用規則"
                    })
                  ]
                })
              ]
            }, y.id);
          }),
          !oe.rules.length && /* @__PURE__ */ (0, l.jsx)("p", { children: "本集尚未登記專用規則；不自動繼承前一集條件。" })
        ]
      }),
      /* @__PURE__ */ (0, l.jsxs)("div", {
        className: "wide-card",
        children: [
          /* @__PURE__ */ (0, l.jsxs)("div", {
            className: "section-title",
            children: [/* @__PURE__ */ (0, l.jsxs)("div", { children: [/* @__PURE__ */ (0, l.jsx)("h2", { children: "本集採用版本清單" }), /* @__PURE__ */ (0, l.jsx)("p", { children: "依角色、場景或音軌使用固定識別鍵；指定來源全文的確切版本，或登記外部來源。" })] }), /* @__PURE__ */ (0, l.jsx)("button", {
              className: "btn",
              disabled: q,
              onClick: () => {
                w(vf), x(!k);
              },
              children: "新增採用項目"
            })]
          }),
          k && /* @__PURE__ */ (0, l.jsxs)("form", {
            className: "context-form",
            onSubmit: async (y) => {
              y.preventDefault(), await C("register_episode_baseline", {
                ..._,
                stageIds: Es(_.stageIdsText),
                sceneIds: Es(_.sceneIdsText)
              }) && x(!1);
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
                    onChange: (y) => w({
                      ..._,
                      key: y.target.value
                    })
                  })] }),
                  /* @__PURE__ */ (0, l.jsxs)("label", { children: ["採用項目名稱", /* @__PURE__ */ (0, l.jsx)("input", {
                    required: !0,
                    maxLength: 200,
                    value: _.title,
                    onChange: (y) => w({
                      ..._,
                      title: y.target.value
                    })
                  })] }),
                  /* @__PURE__ */ (0, l.jsxs)("label", { children: ["採用種類", /* @__PURE__ */ (0, l.jsx)("select", {
                    value: _.category,
                    onChange: (y) => w({
                      ..._,
                      category: y.target.value
                    }),
                    children: hx.map((y) => /* @__PURE__ */ (0, l.jsx)("option", {
                      value: y,
                      children: gf[y]
                    }, y))
                  })] }),
                  /* @__PURE__ */ (0, l.jsxs)("label", { children: ["採用項目狀態", /* @__PURE__ */ (0, l.jsx)("select", {
                    value: _.status,
                    onChange: (y) => w({
                      ..._,
                      status: y.target.value
                    }),
                    children: Object.entries(cn).map(([y, ee]) => /* @__PURE__ */ (0, l.jsx)("option", {
                      value: y,
                      children: ee
                    }, y))
                  })] }),
                  /* @__PURE__ */ (0, l.jsxs)("label", { children: ["已有來源識別鍵", /* @__PURE__ */ (0, l.jsx)("input", {
                    value: _.recordKey,
                    maxLength: 120,
                    onChange: (y) => w({
                      ..._,
                      recordKey: y.target.value
                    }),
                    placeholder: "從製作資料取得；外部來源可留空"
                  })] }),
                  /* @__PURE__ */ (0, l.jsxs)("label", { children: ["來源紀錄版本", /* @__PURE__ */ (0, l.jsx)("input", {
                    type: "number",
                    min: 1,
                    value: _.recordVersion,
                    onChange: (y) => w({
                      ..._,
                      recordVersion: Number(y.target.value)
                    })
                  })] })
                ]
              }),
              !_.recordKey && /* @__PURE__ */ (0, l.jsxs)("label", { children: ["外部來源內容", /* @__PURE__ */ (0, l.jsx)("textarea", {
                rows: 4,
                required: _.status === "reference" || _.status === "adopted",
                value: _.content,
                maxLength: 12e3,
                onChange: (y) => w({
                  ..._,
                  content: y.target.value
                })
              })] }),
              /* @__PURE__ */ (0, l.jsxs)("label", { children: ["採用依據來源", /* @__PURE__ */ (0, l.jsx)("input", {
                required: !0,
                maxLength: 2e3,
                value: _.source,
                onChange: (y) => w({
                  ..._,
                  source: y.target.value
                })
              })] }),
              /* @__PURE__ */ (0, l.jsxs)("div", {
                className: "context-form-grid",
                children: [
                  /* @__PURE__ */ (0, l.jsxs)("label", { children: ["外部檔案版本", /* @__PURE__ */ (0, l.jsx)("input", {
                    value: _.externalVersion,
                    maxLength: 200,
                    onChange: (y) => w({
                      ..._,
                      externalVersion: y.target.value
                    })
                  })] }),
                  /* @__PURE__ */ (0, l.jsxs)("label", { children: ["來源檔案位置", /* @__PURE__ */ (0, l.jsx)("input", {
                    value: _.location,
                    maxLength: 2e3,
                    onChange: (y) => w({
                      ..._,
                      location: y.target.value
                    })
                  })] }),
                  /* @__PURE__ */ (0, l.jsxs)("label", { children: ["採用適用階段", /* @__PURE__ */ (0, l.jsx)("input", {
                    value: _.stageIdsText,
                    placeholder: "OP／ED自動限制於各自支線",
                    onChange: (y) => w({
                      ..._,
                      stageIdsText: y.target.value
                    })
                  })] }),
                  /* @__PURE__ */ (0, l.jsxs)("label", { children: ["採用適用場次", /* @__PURE__ */ (0, l.jsx)("input", {
                    value: _.sceneIdsText,
                    onChange: (y) => w({
                      ..._,
                      sceneIdsText: y.target.value
                    })
                  })] })
                ]
              }),
              /* @__PURE__ */ (0, l.jsxs)("label", { children: ["選用原因或待補說明", /* @__PURE__ */ (0, l.jsx)("textarea", {
                required: _.status === "unresolved",
                rows: 3,
                maxLength: 3e3,
                value: _.note,
                onChange: (y) => w({
                  ..._,
                  note: y.target.value
                })
              })] }),
              /* @__PURE__ */ (0, l.jsx)("button", {
                className: "btn primary",
                disabled: q,
                children: "保存採用項目版本"
              })
            ]
          }),
          oe.baselines.filter(F).map((y) => {
            const ee = H.find((ge) => ge.key === y.key);
            return /* @__PURE__ */ (0, l.jsxs)("details", {
              className: "production-record",
              children: [
                /* @__PURE__ */ (0, l.jsxs)("summary", { children: [/* @__PURE__ */ (0, l.jsxs)("b", { children: [
                  gf[y.category],
                  "｜",
                  y.title
                ] }), /* @__PURE__ */ (0, l.jsxs)("span", { children: [
                  cn[y.status],
                  " · v",
                  y.version
                ] })] }),
                /* @__PURE__ */ (0, l.jsx)("code", { children: y.key }),
                /* @__PURE__ */ (0, l.jsx)("p", { children: y.note }),
                /* @__PURE__ */ (0, l.jsxs)("p", { children: ["來源：", y.source] }),
                /* @__PURE__ */ (0, l.jsxs)("p", { children: [
                  "來源版本：",
                  y.snapshot ? `${y.snapshot.key} · v${y.recordVersion}` : "尚未指定",
                  y.externalVersion ? " · " + y.externalVersion : ""
                ] }),
                /* @__PURE__ */ (0, l.jsxs)("p", { children: ["檔案位置：", y.location || "待補登可讀取位置"] }),
                /* @__PURE__ */ (0, l.jsxs)("p", { children: [
                  "階段：",
                  y.stageIds.join("、") || "本集共用",
                  " · 場次：",
                  y.sceneIds.join("、") || "全部場次"
                ] }),
                y.snapshot && /* @__PURE__ */ (0, l.jsxs)("details", { children: [/* @__PURE__ */ (0, l.jsx)("summary", { children: "查看此來源版本全文" }), /* @__PURE__ */ (0, l.jsx)("p", {
                  className: "production-source-text",
                  children: y.snapshot.content
                })] }),
                ee && ee.id !== y.id && /* @__PURE__ */ (0, l.jsxs)("div", {
                  className: "context-mini",
                  children: [/* @__PURE__ */ (0, l.jsxs)("b", { children: [
                    "仍沿用已採用 v",
                    ee.version,
                    "：",
                    ee.title
                  ] }), /* @__PURE__ */ (0, l.jsxs)("p", { children: [
                    ee.externalVersion || ee.snapshot?.key,
                    " · ",
                    ee.source
                  ] })]
                }),
                /* @__PURE__ */ (0, l.jsxs)("div", {
                  className: "context-actions",
                  children: [
                    /* @__PURE__ */ (0, l.jsx)("button", {
                      className: "btn",
                      disabled: q,
                      onClick: () => pe(y),
                      children: "編輯採用項目新版本"
                    }),
                    y.status === "reference" && y.snapshot && /* @__PURE__ */ (0, l.jsx)("button", {
                      className: "btn primary",
                      disabled: q,
                      onClick: () => {
                        P(y, "adopted");
                      },
                      children: "採用此來源版本"
                    }),
                    ee && /* @__PURE__ */ (0, l.jsx)("button", {
                      className: "btn",
                      disabled: q,
                      onClick: () => {
                        P(ee, "withdrawn");
                      },
                      children: "停止沿用此項目"
                    })
                  ]
                })
              ]
            }, y.id);
          }),
          !oe.baselines.length && /* @__PURE__ */ (0, l.jsx)("p", { children: "尚未指定本集採用版本。共用來源可按需連結後再選用。" }),
          /* @__PURE__ */ (0, l.jsxs)("details", {
            className: "production-import",
            children: [
              /* @__PURE__ */ (0, l.jsx)("summary", { children: "批次補登本集設定" }),
              /* @__PURE__ */ (0, l.jsx)("p", { children: "包含 rules 與 baselines 清單；保留版本及來源，採用與候選分開。" }),
              /* @__PURE__ */ (0, l.jsxs)("label", { children: ["本集設定 JSON", /* @__PURE__ */ (0, l.jsx)("textarea", {
                rows: 5,
                value: le,
                onChange: (y) => {
                  ne(y.target.value), X("");
                }
              })] }),
              I && /* @__PURE__ */ (0, l.jsx)("p", {
                role: "alert",
                children: I
              }),
              /* @__PURE__ */ (0, l.jsx)("button", {
                className: "btn primary",
                disabled: q || !le.trim(),
                onClick: async () => {
                  try {
                    await C("import_episode_settings", JSON.parse(le)) && ne("");
                  } catch (y) {
                    X(y instanceof Error ? y.message : "格式錯誤");
                  }
                },
                children: "保存本集設定清單"
              })
            ]
          }),
          /* @__PURE__ */ (0, l.jsxs)("details", { children: [/* @__PURE__ */ (0, l.jsx)("summary", { children: "設定歷史版本" }), [...r.episodeRules ?? [], ...r.baselines ?? []].map((y) => /* @__PURE__ */ (0, l.jsxs)("p", { children: [
            y.key,
            " v",
            y.version,
            " · ",
            cn[y.status],
            " · ",
            y.at,
            " · ",
            y.by
          ] }, y.id))] })
        ]
      })
    ]
  });
}
var Fr = {
  rule: "規則／決策",
  script: "劇本",
  character: "角色",
  scene: "場景",
  audio: "聲音／音軌",
  reference: "原作／參考素材"
}, jf = {
  original: "原文明示",
  adaptation: "動畫改編",
  author_decision: "作者決定",
  ai_proposal: "AI 建議"
}, dd = {
  project: "本集共用",
  stage: "指定階段",
  scene: "指定場次",
  shot: "指定鏡頭"
}, Pr = (r) => dd[r.type] + (r.target ? " · " + r.target : ""), ed = {
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
function _x(r, h) {
  const C = URL.createObjectURL(new Blob([JSON.stringify(h, null, 2)], { type: "application/json" })), f = document.createElement("a");
  f.href = C, f.download = r, f.click(), setTimeout(() => URL.revokeObjectURL(C), 1e3);
}
function Cx({ project: r, mutate: h, busy: C }) {
  const f = Nl(r), [p, k] = (0, g.useState)("materials"), [x, A] = (0, g.useState)(!1), [N, _] = (0, g.useState)(ed), [w, G] = (0, g.useState)(!1), [z, le] = (0, g.useState)({
    type: "conflict",
    scopeType: "project",
    target: "",
    description: ""
  }), [ne, I] = (0, g.useState)("production"), [X, oe] = (0, g.useState)(""), [q, ie] = (0, g.useState)(""), [H, F] = (0, g.useState)(""), [$, pe] = (0, g.useState)(""), [te, P] = (0, g.useState)(""), [y, ee] = (0, g.useState)(""), [ge, me] = (0, g.useState)(""), [b, ae] = (0, g.useState)(""), [K, Y] = (0, g.useState)(""), [Q, se] = (0, g.useState)(""), [re, _e] = (0, g.useState)(""), [o, j] = (0, g.useState)(""), [R, W] = (0, g.useState)(""), [ce, he] = (0, g.useState)({}), de = f.packs.find((d) => d.id === b) ?? f.packs.at(-1), Ge = f.records.filter((d) => d.status === "effective"), ze = f.records.filter((d) => d.status === "proposed" && !rn(d)), dt = f.problems.filter((d) => d.status === "open"), Xe = [
    [
      "materials",
      "製作資料",
      f.records.length
    ],
    [
      "links",
      "製作關聯",
      new Set((r.production?.links ?? []).map((d) => d.shotId)).size
    ],
    [
      "settings",
      "本集採用",
      $a(r.baselines ?? []).length
    ],
    [
      "baseline",
      "直接核定來源",
      Ge.length
    ],
    [
      "proposals",
      "待確認提案",
      ze.length
    ],
    [
      "problems",
      "矛盾與缺件",
      dt.length
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
  ], Me = C || r.archived;
  async function ve(d) {
    d.preventDefault(), await h("propose_record", {
      ...N,
      scope: {
        type: N.scopeType,
        target: N.target
      }
    }) && (A(!1), _(ed), k("proposals"));
  }
  function qe(d) {
    const B = f.records.find((ue) => ue.id === d);
    _({
      key: B.key,
      title: B.title,
      kind: B.kind,
      origin: "author_decision",
      content: B.content,
      source: "",
      location: B.location,
      scopeType: B.scope.type,
      target: B.scope.target,
      supersedesId: B.id
    }), A(!0);
  }
  function lt(d) {
    return /* @__PURE__ */ (0, l.jsxs)(l.Fragment, { children: [
      /* @__PURE__ */ (0, l.jsxs)("div", {
        className: "context-pack-head",
        children: [
          /* @__PURE__ */ (0, l.jsx)("span", {
            className: "status " + (d.readiness === "ready" ? "passed" : "needs_revision"),
            children: d.readiness === "ready" ? d.purpose === "documentation" ? "可整理資料 · 保留來源差異" : "紀錄齊備 · 素材待實際讀取" : "受阻 · 先處理缺件與矛盾"
          }),
          /* @__PURE__ */ (0, l.jsx)("span", {
            className: "status " + (d.projectRevision === r.revision ? "passed" : "needs_revision"),
            children: d.projectRevision === r.revision ? "目前版本" : "已過期，需重新取得"
          }),
          /* @__PURE__ */ (0, l.jsx)("button", {
            className: "btn",
            onClick: () => _x("AI_工作資料包_" + d.id + ".json", d),
            children: "下載資料包 JSON"
          })
        ]
      }),
      /* @__PURE__ */ (0, l.jsx)("p", {
        className: "context-task",
        children: d.task
      }),
      /* @__PURE__ */ (0, l.jsxs)("p", {
        className: "muted",
        children: [
          "範圍：",
          [
            d.episode,
            d.scope.stageId,
            d.scope.sceneId,
            d.scope.shotId
          ].filter(Boolean).join(" ／ "),
          " · 專案版本 ",
          d.projectRevision
        ]
      }),
      /* @__PURE__ */ (0, l.jsx)("code", {
        className: "context-id",
        children: d.id
      }),
      d.blockers.length > 0 && /* @__PURE__ */ (0, l.jsx)("div", {
        className: "context-blockers",
        children: d.blockers.map((B, ue) => /* @__PURE__ */ (0, l.jsx)("p", { children: B.replace(/缺少有效資料種類：(\w+)/g, (He, T) => "缺少有效資料種類：" + (Fr[T] || T)) }, ue))
      }),
      /* @__PURE__ */ (0, l.jsx)("h3", { children: d.purpose === "documentation" ? "本次指定來源（整理用途）" : "本次有效依據" }),
      d.records.length ? d.records.map((B) => /* @__PURE__ */ (0, l.jsxs)("article", {
        className: "context-mini",
        children: [
          /* @__PURE__ */ (0, l.jsxs)("b", { children: [
            B.title,
            " · v",
            B.version
          ] }),
          /* @__PURE__ */ (0, l.jsxs)("small", { children: [
            B.key,
            " · ",
            Pr(B.scope)
          ] }),
          /* @__PURE__ */ (0, l.jsx)("p", { children: B.content }),
          /* @__PURE__ */ (0, l.jsxs)("small", { children: ["來源：", B.source] }),
          /* @__PURE__ */ (0, l.jsxs)("small", { children: ["素材位置：", B.location || "內容已記錄；未登記外部檔案"] })
        ]
      }, B.id)) : /* @__PURE__ */ (0, l.jsx)("p", {
        className: "muted",
        children: "尚無有效資料，AI 應回報受阻。"
      }),
      /* @__PURE__ */ (0, l.jsxs)("details", { children: [/* @__PURE__ */ (0, l.jsxs)("summary", { children: [
        "禁止混用的版本／待確認提案（",
        d.excluded.length,
        "）"
      ] }), d.excluded.map((B) => /* @__PURE__ */ (0, l.jsxs)("p", { children: [
        B.title,
        " · ",
        B.status,
        " · ",
        B.id
      ] }, B.id))] }),
      /* @__PURE__ */ (0, l.jsxs)("details", { children: [/* @__PURE__ */ (0, l.jsx)("summary", { children: "完整資料契約與素材清單" }), /* @__PURE__ */ (0, l.jsx)("pre", { children: JSON.stringify({
        contract: d.contract,
        manifest: d.manifest,
        adoptedBaselines: d.adoptedBaselines,
        episodeRules: d.episodeRules,
        priorHandoff: d.priorHandoff
      }, null, 2) })] })
    ] });
  }
  return /* @__PURE__ */ (0, l.jsxs)("section", {
    className: "ai-workspace",
    children: [
      /* @__PURE__ */ (0, l.jsx)("nav", {
        className: "section-nav",
        "aria-label": "資料與交接",
        children: Xe.filter(([d]) => [
          "materials",
          "links",
          "handoff",
          "problems"
        ].includes(d)).map(([d, B, ue]) => /* @__PURE__ */ (0, l.jsxs)("button", {
          className: p === d ? "active" : "",
          onClick: () => k(d),
          children: [
            {
              materials: "製作資料",
              links: "鏡頭對應",
              handoff: "工作紀錄",
              problems: "缺件與疑問"
            }[d],
            " ",
            /* @__PURE__ */ (0, l.jsx)("span", { children: ue })
          ]
        }, d))
      }),
      /* @__PURE__ */ (0, l.jsxs)("details", {
        className: "advanced-tools",
        children: [
          /* @__PURE__ */ (0, l.jsx)("summary", { children: "進階：採用設定、資料提案與 AI 工作資料包" }),
          /* @__PURE__ */ (0, l.jsx)("div", {
            className: "context-tabs",
            children: Xe.filter(([d]) => ![
              "materials",
              "links",
              "handoff",
              "problems"
            ].includes(d)).map(([d, B, ue]) => /* @__PURE__ */ (0, l.jsxs)("button", {
              className: p === d ? "active" : "",
              onClick: () => k(d),
              children: [
                B,
                " · ",
                ue
              ]
            }, d))
          }),
          /* @__PURE__ */ (0, l.jsx)("p", { children: "AI 接手時會讀取指定版本；一般查資料不需要手動建立資料包。" })
        ]
      }),
      /* @__PURE__ */ (0, l.jsx)("div", {
        className: p === "settings" ? "" : "wide-card",
        children: p === "settings" ? /* @__PURE__ */ (0, l.jsx)(Rf, {
          project: r,
          busy: C,
          mutate: h
        }) : p === "links" ? /* @__PURE__ */ (0, l.jsx)(kx, {
          project: r,
          busy: C,
          mutate: h
        }) : p === "materials" ? /* @__PURE__ */ (0, l.jsx)(wx, {
          project: r,
          busy: C,
          mutate: h
        }) : ["baseline", "proposals"].includes(p) ? /* @__PURE__ */ (0, l.jsxs)(l.Fragment, { children: [
          /* @__PURE__ */ (0, l.jsxs)("div", {
            className: "section-title",
            children: [/* @__PURE__ */ (0, l.jsxs)("div", { children: [/* @__PURE__ */ (0, l.jsx)("h2", { children: p === "baseline" ? "目前有效資料" : "待作者確認的提案" }), /* @__PURE__ */ (0, l.jsx)("p", { children: "識別鍵固定，修改建立新版本；來源與適用範圍必填。" })] }), /* @__PURE__ */ (0, l.jsx)("button", {
              className: "btn primary",
              disabled: Me,
              onClick: () => {
                _(ed), A(!x);
              },
              children: "新增資料提案"
            })]
          }),
          x && /* @__PURE__ */ (0, l.jsxs)("form", {
            className: "context-form",
            onSubmit: ve,
            children: [
              /* @__PURE__ */ (0, l.jsxs)("div", {
                className: "context-form-grid",
                children: [
                  /* @__PURE__ */ (0, l.jsxs)("label", { children: ["固定識別鍵", /* @__PURE__ */ (0, l.jsx)("input", {
                    required: !0,
                    maxLength: 120,
                    placeholder: "例如 mother_position 或 script_main",
                    value: N.key,
                    readOnly: !!N.supersedesId,
                    onChange: (d) => _({
                      ...N,
                      key: d.target.value
                    })
                  })] }),
                  /* @__PURE__ */ (0, l.jsxs)("label", { children: ["資料名稱", /* @__PURE__ */ (0, l.jsx)("input", {
                    required: !0,
                    maxLength: 200,
                    value: N.title,
                    onChange: (d) => _({
                      ...N,
                      title: d.target.value
                    })
                  })] }),
                  /* @__PURE__ */ (0, l.jsxs)("label", { children: ["資料種類", /* @__PURE__ */ (0, l.jsx)("select", {
                    value: N.kind,
                    onChange: (d) => _({
                      ...N,
                      kind: d.target.value
                    }),
                    children: gx.map((d) => /* @__PURE__ */ (0, l.jsx)("option", {
                      value: d,
                      children: Fr[d]
                    }, d))
                  })] }),
                  /* @__PURE__ */ (0, l.jsxs)("label", { children: ["內容性質", /* @__PURE__ */ (0, l.jsx)("select", {
                    value: N.origin,
                    onChange: (d) => _({
                      ...N,
                      origin: d.target.value
                    }),
                    children: Object.entries(jf).map(([d, B]) => /* @__PURE__ */ (0, l.jsx)("option", {
                      value: d,
                      children: B
                    }, d))
                  })] }),
                  /* @__PURE__ */ (0, l.jsxs)("label", { children: ["適用範圍", /* @__PURE__ */ (0, l.jsx)("select", {
                    value: N.scopeType,
                    disabled: !!N.supersedesId,
                    onChange: (d) => _({
                      ...N,
                      scopeType: d.target.value,
                      target: ""
                    }),
                    children: Object.entries(dd).map(([d, B]) => /* @__PURE__ */ (0, l.jsx)("option", {
                      value: d,
                      children: B
                    }, d))
                  })] }),
                  /* @__PURE__ */ (0, l.jsxs)("label", { children: ["範圍 ID", /* @__PURE__ */ (0, l.jsx)("input", {
                    required: N.scopeType !== "project",
                    disabled: N.scopeType === "project" || !!N.supersedesId,
                    placeholder: "例如 S06、01 或鏡頭 ID",
                    value: N.target,
                    onChange: (d) => _({
                      ...N,
                      target: d.target.value
                    })
                  })] })
                ]
              }),
              /* @__PURE__ */ (0, l.jsxs)("label", { children: ["內容", /* @__PURE__ */ (0, l.jsx)("textarea", {
                required: !0,
                rows: 5,
                maxLength: 12e3,
                value: N.content,
                onChange: (d) => _({
                  ...N,
                  content: d.target.value
                })
              })] }),
              /* @__PURE__ */ (0, l.jsxs)("label", { children: ["來源依據", /* @__PURE__ */ (0, l.jsx)("input", {
                required: !0,
                maxLength: 2e3,
                placeholder: "原作章節、作者修改要求、檔案名稱與段落等",
                value: N.source,
                onChange: (d) => _({
                  ...N,
                  source: d.target.value
                })
              })] }),
              /* @__PURE__ */ (0, l.jsxs)("label", { children: ["素材位置（選填）", /* @__PURE__ */ (0, l.jsx)("input", {
                maxLength: 2e3,
                placeholder: "可取得的檔案位置或連結；填入不等於已讀取",
                value: N.location,
                onChange: (d) => _({
                  ...N,
                  location: d.target.value
                })
              })] }),
              N.supersedesId && /* @__PURE__ */ (0, l.jsxs)("p", {
                className: "muted",
                children: [
                  "明確取代：",
                  N.supersedesId,
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
                  disabled: Me,
                  children: "保存為待確認提案"
                })]
              })
            ]
          }),
          /* @__PURE__ */ (0, l.jsx)("div", {
            className: "context-records",
            children: (p === "baseline" ? Ge : ze).map((d) => /* @__PURE__ */ (0, l.jsxs)("article", {
              className: "context-record",
              children: [
                /* @__PURE__ */ (0, l.jsxs)("div", {
                  className: "issue-top",
                  children: [/* @__PURE__ */ (0, l.jsx)("span", {
                    className: "status " + (d.status === "effective" ? "passed" : "candidate"),
                    children: d.status === "effective" ? "作者已確認" : "待確認"
                  }), /* @__PURE__ */ (0, l.jsxs)("b", { children: [
                    d.title,
                    " · v",
                    d.version
                  ] })]
                }),
                /* @__PURE__ */ (0, l.jsxs)("small", { children: [
                  Fr[d.kind],
                  " ／ ",
                  jf[d.origin],
                  " ／ ",
                  Pr(d.scope)
                ] }),
                /* @__PURE__ */ (0, l.jsxs)("code", {
                  className: "context-id",
                  children: [
                    d.key,
                    " · ",
                    d.id
                  ]
                }),
                /* @__PURE__ */ (0, l.jsx)("p", { children: d.content }),
                /* @__PURE__ */ (0, l.jsxs)("div", {
                  className: "context-source",
                  children: [
                    "來源：",
                    d.source,
                    d.location && /* @__PURE__ */ (0, l.jsxs)("p", { children: ["素材位置：", d.location] })
                  ]
                }),
                d.supersedesId && /* @__PURE__ */ (0, l.jsxs)("small", { children: ["取代目標：", d.supersedesId] }),
                d.approval && /* @__PURE__ */ (0, l.jsxs)("small", { children: ["確認者：", d.approval.by] }),
                /* @__PURE__ */ (0, l.jsx)("div", {
                  className: "context-actions",
                  children: d.status === "proposed" ? /* @__PURE__ */ (0, l.jsx)("button", {
                    className: "btn primary",
                    disabled: Me,
                    onClick: () => {
                      h("activate_record", { recordId: d.id });
                    },
                    children: "作者確認為有效資料"
                  }) : /* @__PURE__ */ (0, l.jsx)("button", {
                    className: "btn",
                    disabled: Me,
                    onClick: () => qe(d.id),
                    children: "提出修改版本"
                  })
                })
              ]
            }, d.id))
          }),
          !(p === "baseline" ? Ge : ze).length && !x && /* @__PURE__ */ (0, l.jsxs)("div", {
            className: "empty",
            children: [/* @__PURE__ */ (0, l.jsx)("h3", { children: p === "baseline" ? "尚無有效資料" : "目前沒有待確認提案" }), /* @__PURE__ */ (0, l.jsx)("p", { children: "先登記來源、內容與範圍，再由作者確認。" })]
          }),
          /* @__PURE__ */ (0, l.jsxs)("details", { children: [/* @__PURE__ */ (0, l.jsxs)("summary", { children: [
            "已被取代的歷史版本（",
            f.records.filter((d) => d.status === "superseded").length,
            "）"
          ] }), f.records.filter((d) => d.status === "superseded").map((d) => /* @__PURE__ */ (0, l.jsxs)("article", {
            className: "context-mini",
            children: [
              /* @__PURE__ */ (0, l.jsxs)("b", { children: [
                d.title,
                " v",
                d.version,
                " · 已停用"
              ] }),
              /* @__PURE__ */ (0, l.jsx)("p", { children: d.content }),
              /* @__PURE__ */ (0, l.jsxs)("small", { children: [
                d.id,
                " → ",
                d.supersededBy
              ] })
            ]
          }, d.id))] })
        ] }) : p === "problems" ? /* @__PURE__ */ (0, l.jsxs)(l.Fragment, { children: [
          /* @__PURE__ */ (0, l.jsxs)("div", {
            className: "section-title",
            children: [/* @__PURE__ */ (0, l.jsxs)("div", { children: [/* @__PURE__ */ (0, l.jsx)("h2", { children: "矛盾、缺件與待裁定事項" }), /* @__PURE__ */ (0, l.jsx)("p", { children: "相關任務在問題處理前回報受阻，AI 不自行裁定。" })] }), /* @__PURE__ */ (0, l.jsx)("button", {
              className: "btn",
              disabled: Me,
              onClick: () => G(!w),
              children: "登記矛盾或缺件"
            })]
          }),
          w && /* @__PURE__ */ (0, l.jsxs)("form", {
            className: "context-form",
            onSubmit: async (d) => {
              d.preventDefault(), await h("add_knowledge_problem", {
                type: z.type,
                scope: {
                  type: z.scopeType,
                  target: z.target
                },
                description: z.description,
                recordIds: []
              }) && (G(!1), le({
                ...z,
                description: ""
              }));
            },
            children: [
              /* @__PURE__ */ (0, l.jsxs)("div", {
                className: "context-form-grid",
                children: [
                  /* @__PURE__ */ (0, l.jsxs)("label", { children: ["問題種類", /* @__PURE__ */ (0, l.jsxs)("select", {
                    value: z.type,
                    onChange: (d) => le({
                      ...z,
                      type: d.target.value
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
                    value: z.scopeType,
                    onChange: (d) => le({
                      ...z,
                      scopeType: d.target.value,
                      target: ""
                    }),
                    children: Object.entries(dd).map(([d, B]) => /* @__PURE__ */ (0, l.jsx)("option", {
                      value: d,
                      children: B
                    }, d))
                  })] }),
                  /* @__PURE__ */ (0, l.jsxs)("label", { children: ["範圍 ID", /* @__PURE__ */ (0, l.jsx)("input", {
                    required: z.scopeType !== "project",
                    disabled: z.scopeType === "project",
                    value: z.target,
                    onChange: (d) => le({
                      ...z,
                      target: d.target.value
                    })
                  })] })
                ]
              }),
              /* @__PURE__ */ (0, l.jsxs)("label", { children: ["問題與缺少的依據", /* @__PURE__ */ (0, l.jsx)("textarea", {
                required: !0,
                rows: 4,
                value: z.description,
                onChange: (d) => le({
                  ...z,
                  description: d.target.value
                })
              })] }),
              /* @__PURE__ */ (0, l.jsx)("button", {
                className: "btn primary",
                disabled: Me,
                children: "保存待處理問題"
              })
            ]
          }),
          f.problems.map((d) => /* @__PURE__ */ (0, l.jsxs)("article", {
            className: "context-record",
            children: [
              /* @__PURE__ */ (0, l.jsxs)("div", {
                className: "issue-top",
                children: [/* @__PURE__ */ (0, l.jsxs)("span", {
                  className: "status " + (d.status === "open" ? "needs_revision" : "passed"),
                  children: [
                    d.type === "conflict" ? "資訊矛盾" : "資料缺件",
                    " · ",
                    d.status === "open" ? "待處理" : "作者已處理"
                  ]
                }), /* @__PURE__ */ (0, l.jsx)("small", { children: Pr(d.scope) })]
              }),
              /* @__PURE__ */ (0, l.jsx)("p", { children: d.description }),
              d.resolution && /* @__PURE__ */ (0, l.jsxs)("p", { children: ["處理結果：", d.resolution] }),
              d.status === "open" && (y === d.id ? /* @__PURE__ */ (0, l.jsxs)("form", {
                onSubmit: async (B) => {
                  B.preventDefault(), await h("resolve_knowledge_problem", {
                    problemId: d.id,
                    resolution: ge
                  }) && (ee(""), me(""));
                },
                children: [
                  /* @__PURE__ */ (0, l.jsxs)("label", {
                    className: "form-field",
                    children: ["作者裁定／補件結果", /* @__PURE__ */ (0, l.jsx)("textarea", {
                      required: !0,
                      rows: 3,
                      value: ge,
                      onChange: (B) => me(B.target.value)
                    })]
                  }),
                  /* @__PURE__ */ (0, l.jsx)("p", {
                    className: "muted",
                    children: "若涉及設定變更，請另外確認新資料版本；問題結案不會自動修改有效資料。"
                  }),
                  /* @__PURE__ */ (0, l.jsx)("button", {
                    className: "btn primary",
                    disabled: Me,
                    children: "作者確認處理完成"
                  })
                ]
              }) : /* @__PURE__ */ (0, l.jsx)("button", {
                className: "btn",
                disabled: Me,
                onClick: () => {
                  ee(d.id), me("");
                },
                children: "填寫作者處理結果"
              }))
            ]
          }, d.id)),
          !f.problems.length && /* @__PURE__ */ (0, l.jsx)("p", {
            className: "muted",
            children: "目前沒有登記矛盾或缺件。資料包仍會檢查必要資料種類。"
          })
        ] }) : p === "packet" ? /* @__PURE__ */ (0, l.jsxs)(l.Fragment, { children: [
          /* @__PURE__ */ (0, l.jsx)("div", {
            className: "section-title",
            children: /* @__PURE__ */ (0, l.jsxs)("div", { children: [/* @__PURE__ */ (0, l.jsx)("h2", { children: "指定任務的工作資料包" }), /* @__PURE__ */ (0, l.jsx)("p", { children: "保存當下版本；任何更新後均需重新取得，避免沿用舊依據。" })] })
          }),
          /* @__PURE__ */ (0, l.jsxs)("form", {
            className: "context-form",
            onSubmit: async (d) => {
              d.preventDefault();
              const B = await h("create_context_pack", {
                task: q,
                stageId: H,
                sceneId: $,
                shotId: te,
                purpose: ne,
                recordKeys: ne === "documentation" ? X.split(/[,，\n]/).map((ue) => ue.trim()).filter(Boolean) : void 0
              });
              B && ae(Nl(B).packs.at(-1).id);
            },
            children: [
              /* @__PURE__ */ (0, l.jsxs)("label", { children: ["工作用途", /* @__PURE__ */ (0, l.jsxs)("select", {
                value: ne,
                onChange: (d) => I(d.target.value),
                children: [/* @__PURE__ */ (0, l.jsx)("option", {
                  value: "production",
                  children: "素材製作／檢視"
                }), /* @__PURE__ */ (0, l.jsx)("option", {
                  value: "documentation",
                  children: "資料整理／補登"
                })]
              })] }),
              ne === "documentation" && /* @__PURE__ */ (0, l.jsxs)("label", { children: ["本次來源識別鍵", /* @__PURE__ */ (0, l.jsx)("textarea", {
                required: !0,
                rows: 2,
                value: X,
                onChange: (d) => oe(d.target.value),
                placeholder: "以逗號分隔，最多20筆；可從製作資料或鏡頭關聯取得"
              })] }),
              /* @__PURE__ */ (0, l.jsxs)("label", { children: ["本次任務", /* @__PURE__ */ (0, l.jsx)("textarea", {
                required: !0,
                rows: 2,
                maxLength: 2e3,
                placeholder: "例如：檢查 S06 指定鏡頭的母親座位與場景一致性",
                value: q,
                onChange: (d) => ie(d.target.value)
              })] }),
              /* @__PURE__ */ (0, l.jsxs)("div", {
                className: "context-form-grid",
                children: [
                  /* @__PURE__ */ (0, l.jsxs)("label", { children: ["階段 ID（選填）", /* @__PURE__ */ (0, l.jsx)("input", {
                    placeholder: "例如 08、op01",
                    value: H,
                    onChange: (d) => F(d.target.value)
                  })] }),
                  /* @__PURE__ */ (0, l.jsxs)("label", { children: ["場次 ID（選填）", /* @__PURE__ */ (0, l.jsx)("input", {
                    placeholder: "例如 S06",
                    value: $,
                    onChange: (d) => pe(d.target.value)
                  })] }),
                  /* @__PURE__ */ (0, l.jsxs)("label", { children: ["鏡頭 ID（選填）", /* @__PURE__ */ (0, l.jsx)("input", {
                    placeholder: "素材總表的固定鏡頭 ID",
                    value: te,
                    onChange: (d) => P(d.target.value)
                  })] })
                ]
              }),
              /* @__PURE__ */ (0, l.jsx)("button", {
                className: "btn primary",
                disabled: Me,
                children: "建立並保存資料包"
              })
            ]
          }),
          de ? /* @__PURE__ */ (0, l.jsx)("div", {
            className: "context-pack",
            children: lt(de)
          }) : /* @__PURE__ */ (0, l.jsx)("p", {
            className: "muted",
            children: "尚未建立資料包。AI 可透過 acquire_animation_context 取得同一份資料。"
          }),
          de?.purpose === "documentation" && de.projectRevision === r.revision && /* @__PURE__ */ (0, l.jsxs)("details", { children: [/* @__PURE__ */ (0, l.jsx)("summary", { children: "回報本次資料整理結果" }), /* @__PURE__ */ (0, l.jsxs)("form", {
            className: "context-form",
            onSubmit: async (d) => {
              d.preventDefault(), await h("submit_ai_work", {
                contextPackId: de.id,
                resultId: crypto.randomUUID(),
                status: "completed",
                summary: K,
                nextStep: Q,
                recordIds: de.records.map((B) => B.id),
                observations: de.records.map((B) => ({
                  recordId: B.id,
                  version: B.version,
                  note: ce[B.id] ?? ""
                })),
                artifacts: [{
                  location: re,
                  version: o,
                  description: R
                }]
              });
            },
            children: [
              /* @__PURE__ */ (0, l.jsxs)("label", { children: ["本次完成內容", /* @__PURE__ */ (0, l.jsx)("textarea", {
                required: !0,
                rows: 3,
                value: K,
                onChange: (d) => Y(d.target.value)
              })] }),
              /* @__PURE__ */ (0, l.jsxs)("label", { children: ["下一位 AI 接手動作", /* @__PURE__ */ (0, l.jsx)("textarea", {
                required: !0,
                rows: 3,
                value: Q,
                onChange: (d) => se(d.target.value)
              })] }),
              de.records.map((d) => /* @__PURE__ */ (0, l.jsxs)("label", { children: [
                "實際閱讀依據｜",
                d.title,
                /* @__PURE__ */ (0, l.jsx)("textarea", {
                  required: !0,
                  rows: 2,
                  maxLength: 3e3,
                  value: ce[d.id] ?? "",
                  onChange: (B) => he({
                    ...ce,
                    [d.id]: B.target.value
                  })
                })
              ] }, d.id)),
              /* @__PURE__ */ (0, l.jsxs)("label", { children: ["整理成果位置", /* @__PURE__ */ (0, l.jsx)("input", {
                required: !0,
                maxLength: 2e3,
                value: re,
                onChange: (d) => _e(d.target.value)
              })] }),
              /* @__PURE__ */ (0, l.jsxs)("label", { children: ["整理成果版本", /* @__PURE__ */ (0, l.jsx)("input", {
                required: !0,
                maxLength: 100,
                value: o,
                onChange: (d) => j(d.target.value)
              })] }),
              /* @__PURE__ */ (0, l.jsxs)("label", { children: ["整理成果說明", /* @__PURE__ */ (0, l.jsx)("input", {
                required: !0,
                maxLength: 2e3,
                value: R,
                onChange: (d) => W(d.target.value)
              })] }),
              /* @__PURE__ */ (0, l.jsx)("button", {
                className: "btn primary",
                disabled: Me,
                children: "保存資料整理結果"
              })
            ]
          })] }),
          f.packs.length > 1 && /* @__PURE__ */ (0, l.jsxs)("details", { children: [/* @__PURE__ */ (0, l.jsxs)("summary", { children: [
            "先前資料包（",
            f.packs.length - 1,
            "）"
          ] }), [...f.packs].reverse().map((d) => /* @__PURE__ */ (0, l.jsxs)("button", {
            className: "text-btn",
            onClick: () => ae(d.id),
            children: [
              d.task,
              " · 版本 ",
              d.projectRevision
            ]
          }, d.id))] })
        ] }) : /* @__PURE__ */ (0, l.jsxs)(l.Fragment, { children: [
          /* @__PURE__ */ (0, l.jsx)("div", {
            className: "section-title",
            children: /* @__PURE__ */ (0, l.jsxs)("div", { children: [/* @__PURE__ */ (0, l.jsx)("h2", { children: "AI 工作接續紀錄" }), /* @__PURE__ */ (0, l.jsx)("p", { children: "依資料包回寫使用版本、實際閱讀自述、成果位置與下一步。" })] })
          }),
          [...f.results].reverse().map((d) => /* @__PURE__ */ (0, l.jsxs)("article", {
            className: "context-record",
            children: [
              /* @__PURE__ */ (0, l.jsxs)("div", {
                className: "issue-top",
                children: [/* @__PURE__ */ (0, l.jsx)("span", {
                  className: "status " + (d.needsReview ? "needs_revision" : d.status === "blocked" ? "todo" : "candidate"),
                  children: d.needsReview ? f.packs.find((B) => B.id === d.packId)?.purpose === "documentation" ? "採用設定已更新，接手前讀取新版本" : "依據已變更，需重驗" : d.status === "completed" ? f.packs.find((B) => B.id === d.packId)?.purpose === "documentation" ? "資料整理完成" : "AI 回報完成，待作者驗收" : d.status === "partial" ? "部分完成" : "受阻"
                }), /* @__PURE__ */ (0, l.jsx)("b", { children: d.task })]
              }),
              /* @__PURE__ */ (0, l.jsx)("p", { children: d.summary }),
              /* @__PURE__ */ (0, l.jsxs)("div", {
                className: "context-source",
                children: [/* @__PURE__ */ (0, l.jsx)("b", { children: "下一步" }), /* @__PURE__ */ (0, l.jsx)("p", { children: d.nextStep })]
              }),
              d.needsReview && /* @__PURE__ */ (0, l.jsx)("p", {
                className: "red-text",
                children: d.reviewReason
              }),
              d.artifacts.map((B, ue) => /* @__PURE__ */ (0, l.jsxs)("p", { children: [
                B.description,
                " · ",
                B.version,
                /* @__PURE__ */ (0, l.jsx)("code", {
                  className: "context-id",
                  children: B.location
                })
              ] }, ue)),
              /* @__PURE__ */ (0, l.jsxs)("details", { children: [/* @__PURE__ */ (0, l.jsx)("summary", { children: "使用版本與閱讀自述" }), /* @__PURE__ */ (0, l.jsx)("pre", { children: JSON.stringify({
                packId: d.packId,
                recordIds: d.recordIds,
                observations: d.observations
              }, null, 2) })] })
            ]
          }, d.id)),
          !f.results.length && /* @__PURE__ */ (0, l.jsxs)("div", {
            className: "empty",
            children: [/* @__PURE__ */ (0, l.jsx)("h3", { children: "等待 AI 回報工作" }), /* @__PURE__ */ (0, l.jsx)("p", { children: "工具 submit_animation_work 會保存結果與交接內容。" })]
          })
        ] })
      })
    ]
  });
}
var Lf = [
  ["coverage", "原作與改編範圍"],
  ["endingState", "本集結尾狀態"],
  ["characters", "人物狀態與關係"],
  ["revealed", "已揭露資訊與邊界"],
  ["unresolved", "尚未確定的內容"],
  ["carryRules", "後續集數沿用規則"],
  ["nextSteps", "下一步與接手順序"],
  ["sources", "來源與版本說明"]
], yf = {
  title: "",
  coverage: "",
  endingState: "",
  characters: "",
  revealed: "",
  unresolved: "",
  carryRules: "",
  nextSteps: "",
  sources: ""
}, Ex = {
  completed: "作者告知已完成",
  in_progress: "作者告知製作中",
  not_started: "作者告知尚未開始"
};
function td({ h: r, target: h }) {
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
          h,
          "。內容按所列版本交接；尚未對上成片的部分保留疑點，不自動變成下一集採用設定。"
        ]
      }),
      Lf.map(([C, f]) => /* @__PURE__ */ (0, l.jsxs)("div", {
        className: "context-mini",
        children: [/* @__PURE__ */ (0, l.jsx)("b", { children: f }), /* @__PURE__ */ (0, l.jsx)("p", {
          className: "production-source-text",
          children: r[C]
        })]
      }, C)),
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
function Ax({ project: r, episodes: h, busy: C, mutate: f }) {
  const p = r.production?.completionReports?.at(-1), k = r.production?.handoffs?.at(-1), x = h.filter((P) => P.workId === r.workId && P.id !== r.id), [A, N] = (0, g.useState)("completed"), [_, w] = (0, g.useState)(""), [G, z] = (0, g.useState)(""), [le, ne] = (0, g.useState)(""), [I, X] = (0, g.useState)(yf), [oe, q] = (0, g.useState)(""), [ie, H] = (0, g.useState)([]), [F, $] = (0, g.useState)("");
  (0, g.useEffect)(() => {
    N(p?.status ?? "completed"), w(p?.note ?? ""), z(p?.source ?? ""), ne(k?.toEpisodeId ?? ""), X(k ?? yf), q(k?.sourceKeys.join(", ") ?? "");
  }, [
    r.id,
    p?.at,
    k?.id
  ]), (0, g.useEffect)(() => {
    let P = !0;
    return H([]), fetch("/api/projects?id=" + encodeURIComponent(r.id) + "&view=brief", { cache: "no-store" }).then(async (y) => {
      const ee = await y.json();
      if (!y.ok) throw new Error(ee.error ?? "接續資料讀取失敗");
      P && (H(ee.incoming), $(""));
    }).catch((y) => {
      P && $(y.message);
    }), () => {
      P = !1;
    };
  }, [r.id, r.revision]);
  const pe = hd(r).registration, te = C || r.archived;
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
          /* @__PURE__ */ (0, l.jsx)("b", { children: p ? Ex[p.status] : "製作狀態尚未登記" }),
          /* @__PURE__ */ (0, l.jsxs)("span", { children: [
            pe.acceptedSources,
            " / ",
            pe.sources,
            " 筆來源已收錄"
          ] }),
          /* @__PURE__ */ (0, l.jsxs)("span", { children: [
            pe.linkedShots,
            " / ",
            pe.shots,
            " 列鏡頭有關聯"
          ] }),
          /* @__PURE__ */ (0, l.jsxs)("span", { children: [pe.registeredSelections, " 列已登記採用檔"] })
        ]
      }),
      p && /* @__PURE__ */ (0, l.jsxs)(l.Fragment, { children: [/* @__PURE__ */ (0, l.jsx)("p", { children: p.note }), /* @__PURE__ */ (0, l.jsxs)("small", { children: ["作者告知依據：", p.source] })] }),
      /* @__PURE__ */ (0, l.jsx)("p", {
        className: "inline-note",
        children: "製作完成、資料補登及素材實際檢視各自記錄。未登記檔案位置不等於尚未製作。"
      }),
      /* @__PURE__ */ (0, l.jsxs)("details", { children: [/* @__PURE__ */ (0, l.jsx)("summary", { children: "補登本集製作狀態" }), /* @__PURE__ */ (0, l.jsxs)("form", {
        className: "context-form",
        onSubmit: async (P) => {
          P.preventDefault(), await f("report_episode_completion", {
            status: A,
            note: _,
            source: G
          });
        },
        children: [
          /* @__PURE__ */ (0, l.jsxs)("label", { children: ["作者告知的製作狀態", /* @__PURE__ */ (0, l.jsxs)("select", {
            value: A,
            onChange: (P) => N(P.target.value),
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
            onChange: (P) => w(P.target.value)
          })] }),
          /* @__PURE__ */ (0, l.jsxs)("label", { children: ["告知來源", /* @__PURE__ */ (0, l.jsx)("input", {
            required: !0,
            maxLength: 2e3,
            value: G,
            onChange: (P) => z(P.target.value)
          })] }),
          /* @__PURE__ */ (0, l.jsx)("button", {
            className: "btn primary",
            disabled: te,
            children: "保存作者告知狀態"
          })
        ]
      })] }),
      F && /* @__PURE__ */ (0, l.jsx)("p", {
        role: "alert",
        children: F
      }),
      ie.map((P) => /* @__PURE__ */ (0, l.jsxs)("details", {
        className: "production-record",
        children: [/* @__PURE__ */ (0, l.jsxs)("summary", { children: [/* @__PURE__ */ (0, l.jsxs)("b", { children: [
          "來自 ",
          P.fromEpisode,
          " 的接續資料"
        ] }), /* @__PURE__ */ (0, l.jsxs)("span", { children: [
          "v",
          P.handoff.version,
          " · 來源集數紀錄版本 ",
          P.fromRevision
        ] })] }), /* @__PURE__ */ (0, l.jsx)(td, {
          h: P.handoff,
          target: r.episode
        })]
      }, P.handoff.id)),
      k ? /* @__PURE__ */ (0, l.jsxs)("details", {
        className: "production-record",
        children: [/* @__PURE__ */ (0, l.jsxs)("summary", { children: [/* @__PURE__ */ (0, l.jsxs)("b", { children: ["交接至 ", h.find((P) => P.id === k.toEpisodeId)?.episode ?? "指定集數"] }), /* @__PURE__ */ (0, l.jsxs)("span", { children: ["接續資料 v", k.version] })] }), /* @__PURE__ */ (0, l.jsx)(td, {
          h: k,
          target: h.find((P) => P.id === k.toEpisodeId)?.episode ?? "指定集數"
        })]
      }) : /* @__PURE__ */ (0, l.jsx)("p", {
        className: "muted",
        children: "尚未保存本集對後續集數的交接資料。"
      }),
      /* @__PURE__ */ (0, l.jsxs)("details", { children: [/* @__PURE__ */ (0, l.jsx)("summary", { children: k ? "更新接續資料版本" : "補登跨集接續資料" }), x.length ? /* @__PURE__ */ (0, l.jsxs)("form", {
        className: "context-form",
        onSubmit: async (P) => {
          P.preventDefault(), await f("save_episode_handoff", {
            ...I,
            toEpisodeId: le || x[0].id,
            baseVersion: k?.version ?? 0,
            sourceKeys: oe.split(/[,，\n]/).map((y) => y.trim()).filter(Boolean)
          });
        },
        children: [
          /* @__PURE__ */ (0, l.jsxs)("label", { children: ["接續目標集數", /* @__PURE__ */ (0, l.jsx)("select", {
            value: le || x[0].id,
            onChange: (P) => ne(P.target.value),
            children: x.map((P) => /* @__PURE__ */ (0, l.jsxs)("option", {
              value: P.id,
              children: [
                P.episode,
                " · ",
                P.title
              ]
            }, P.id))
          })] }),
          /* @__PURE__ */ (0, l.jsxs)("label", { children: ["接續資料名稱", /* @__PURE__ */ (0, l.jsx)("input", {
            required: !0,
            maxLength: 200,
            value: I.title,
            onChange: (P) => X({
              ...I,
              title: P.target.value
            })
          })] }),
          Lf.map(([P, y]) => /* @__PURE__ */ (0, l.jsxs)("label", { children: [y, /* @__PURE__ */ (0, l.jsx)("textarea", {
            required: !0,
            rows: 3,
            maxLength: 6e3,
            value: I[P],
            onChange: (ee) => X({
              ...I,
              [P]: ee.target.value
            })
          })] }, P)),
          /* @__PURE__ */ (0, l.jsxs)("label", { children: ["來源識別鍵（逗號分隔）", /* @__PURE__ */ (0, l.jsx)("textarea", {
            rows: 2,
            value: oe,
            onChange: (P) => q(P.target.value)
          })] }),
          /* @__PURE__ */ (0, l.jsx)("button", {
            className: "btn primary",
            disabled: te,
            children: "保存接續資料版本"
          })
        ]
      }) : /* @__PURE__ */ (0, l.jsx)("p", { children: "先在作品專案新增下一集，再建立交接。" })] }),
      (r.production?.handoffs?.length ?? 0) > 1 && /* @__PURE__ */ (0, l.jsxs)("details", { children: [/* @__PURE__ */ (0, l.jsxs)("summary", { children: [
        "先前接續版本（",
        r.production.handoffs.length - 1,
        "）"
      ] }), r.production.handoffs.slice(0, -1).map((P) => /* @__PURE__ */ (0, l.jsx)(td, {
        h: P,
        target: h.find((y) => y.id === P.toEpisodeId)?.episode ?? P.toEpisodeId
      }, P.id))] }),
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
var ad = {
  key: "",
  title: "",
  kind: "reference",
  content: "",
  source: "",
  location: "",
  baseVersion: void 0
};
function Tx({ work: r, episode: h, episodes: C, busy: f, onWorkAction: p, onSelectEpisode: k, onPin: x, mutate: A }) {
  const [N, _] = (0, g.useState)(h.title.split("｜")[0]), [w, G] = (0, g.useState)(""), [z, le] = (0, g.useState)(""), [ne, I] = (0, g.useState)(""), [X, oe] = (0, g.useState)(""), [q, ie] = (0, g.useState)(""), [H, F] = (0, g.useState)(ad), [$, pe] = (0, g.useState)(!1);
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
        onSubmit: async (b) => {
          b.preventDefault(), await p("convert_episode", {
            title: N,
            episodeId: h.id,
            episodeRevision: h.revision
          });
        },
        children: [/* @__PURE__ */ (0, l.jsxs)("label", { children: ["作品專案名稱", /* @__PURE__ */ (0, l.jsx)("input", {
          required: !0,
          maxLength: 200,
          value: N,
          onChange: (b) => _(b.target.value)
        })] }), /* @__PURE__ */ (0, l.jsx)("button", {
          className: "btn primary",
          disabled: f,
          children: "建立作品專案並保留本集"
        })]
      })
    ]
  });
  const te = C.filter((b) => b.workId === r.id).sort((b, ae) => b.episode.localeCompare(ae.episode, void 0, { numeric: !0 })), P = Math.max(0, ...te.map((b) => Number(b.episode.replace(/^EP/i, "")) || 0)) + 1, y = "EP" + String(P).padStart(2, "0"), ee = [...new Map(r.sharedAssets.map((b) => [b.key, b])).values()], ge = ee.filter((b) => !ne || [
    b.key,
    b.title,
    b.content,
    b.source
  ].join(" ").toLowerCase().includes(ne.toLowerCase()));
  function me(b) {
    F({
      key: b.key,
      title: b.title,
      kind: b.kind,
      content: b.content,
      source: b.source,
      location: b.location,
      baseVersion: b.version
    }), pe(!0);
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
              /* @__PURE__ */ (0, l.jsxs)("b", { children: [te.length, " 集"] }),
              /* @__PURE__ */ (0, l.jsxs)("b", { children: [ee.length, " 項共用來源"] }),
              /* @__PURE__ */ (0, l.jsx)("span", { children: "各集保留自己的劇本、進度與採用版本。" })
            ]
          }),
          /* @__PURE__ */ (0, l.jsx)("div", {
            className: "episode-grid",
            children: te.map((b) => /* @__PURE__ */ (0, l.jsxs)("button", {
              className: "episode-card " + (b.id === h.id ? "selected" : ""),
              disabled: f,
              onClick: () => k(b.id),
              children: [
                /* @__PURE__ */ (0, l.jsx)("small", { children: b.episode }),
                /* @__PURE__ */ (0, l.jsx)("b", { children: b.title }),
                /* @__PURE__ */ (0, l.jsxs)("span", { children: [
                  b.shots,
                  " 列鏡頭 · ",
                  b.id === h.id ? "目前集數" : "開啟本集",
                  b.completionReport?.status === "completed" ? " · 作者告知完成" : ""
                ] })
              ]
            }, b.id))
          }),
          /* @__PURE__ */ (0, l.jsxs)("details", { children: [/* @__PURE__ */ (0, l.jsx)("summary", { children: "新增後續集數" }), /* @__PURE__ */ (0, l.jsxs)("form", {
            className: "context-form",
            onSubmit: async (b) => {
              b.preventDefault(), await p("create_episode", {
                episode: w || y,
                title: z || `${w || y} 製作資料`
              }) && (G(""), le(""));
            },
            children: [
              /* @__PURE__ */ (0, l.jsxs)("div", {
                className: "context-form-grid",
                children: [/* @__PURE__ */ (0, l.jsxs)("label", { children: ["新集數", /* @__PURE__ */ (0, l.jsx)("input", {
                  required: !0,
                  pattern: "[Ee][Pp][0-9]{2,4}",
                  value: w || y,
                  onChange: (b) => G(b.target.value),
                  placeholder: "EP02"
                })] }), /* @__PURE__ */ (0, l.jsxs)("label", { children: ["本集名稱", /* @__PURE__ */ (0, l.jsx)("input", {
                  maxLength: 200,
                  value: z,
                  onChange: (b) => le(b.target.value),
                  placeholder: `${w || y} 製作資料`
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
      /* @__PURE__ */ (0, l.jsx)(Ax, {
        project: h,
        episodes: C,
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
                F(ad), pe(!$);
              },
              children: "新增共用參考"
            })]
          }),
          $ && /* @__PURE__ */ (0, l.jsxs)("form", {
            className: "context-form",
            onSubmit: async (b) => {
              b.preventDefault(), await p("save_shared_asset", H) && (pe(!1), F(ad));
            },
            children: [
              /* @__PURE__ */ (0, l.jsxs)("div", {
                className: "context-form-grid",
                children: [
                  /* @__PURE__ */ (0, l.jsxs)("label", { children: ["共用識別鍵", /* @__PURE__ */ (0, l.jsx)("input", {
                    required: !0,
                    readOnly: H.baseVersion !== void 0,
                    maxLength: 110,
                    value: H.key,
                    onChange: (b) => F({
                      ...H,
                      key: b.target.value
                    })
                  })] }),
                  /* @__PURE__ */ (0, l.jsxs)("label", { children: ["共用名稱", /* @__PURE__ */ (0, l.jsx)("input", {
                    required: !0,
                    maxLength: 200,
                    value: H.title,
                    onChange: (b) => F({
                      ...H,
                      title: b.target.value
                    })
                  })] }),
                  /* @__PURE__ */ (0, l.jsxs)("label", { children: ["資料種類", /* @__PURE__ */ (0, l.jsx)("select", {
                    value: H.kind,
                    onChange: (b) => F({
                      ...H,
                      kind: b.target.value
                    }),
                    children: [
                      ["reference", "原作／參考"],
                      ["character", "角色"],
                      ["scene", "場景"],
                      ["rule", "世界設定／規則"],
                      ["audio", "聲線／聲音"],
                      ["script", "文本"]
                    ].map(([b, ae]) => /* @__PURE__ */ (0, l.jsx)("option", {
                      value: b,
                      children: ae
                    }, b))
                  })] })
                ]
              }),
              /* @__PURE__ */ (0, l.jsxs)("label", { children: ["完整內容", /* @__PURE__ */ (0, l.jsx)("textarea", {
                required: !0,
                rows: 7,
                maxLength: 12e3,
                value: H.content,
                onChange: (b) => F({
                  ...H,
                  content: b.target.value
                })
              })] }),
              /* @__PURE__ */ (0, l.jsxs)("label", { children: ["來源", /* @__PURE__ */ (0, l.jsx)("input", {
                required: !0,
                maxLength: 2e3,
                value: H.source,
                onChange: (b) => F({
                  ...H,
                  source: b.target.value
                })
              })] }),
              /* @__PURE__ */ (0, l.jsxs)("label", { children: ["素材位置", /* @__PURE__ */ (0, l.jsx)("input", {
                maxLength: 2e3,
                value: H.location,
                onChange: (b) => F({
                  ...H,
                  location: b.target.value
                })
              })] }),
              /* @__PURE__ */ (0, l.jsx)("button", {
                className: "btn primary",
                disabled: f,
                children: H.baseVersion ? "保存新版本" : "保存共用來源"
              })
            ]
          }),
          /* @__PURE__ */ (0, l.jsxs)("label", {
            className: "work-search",
            children: ["搜尋共用資料", /* @__PURE__ */ (0, l.jsx)("input", {
              placeholder: "原作章名、角色、場景或設定",
              value: ne,
              onChange: (b) => I(b.target.value)
            })]
          }),
          /* @__PURE__ */ (0, l.jsxs)("p", {
            className: "muted",
            children: [
              ge.length,
              " 項來源；目前連結目標為 ",
              h.episode,
              "。"
            ]
          }),
          ge.slice(0, 60).map((b) => /* @__PURE__ */ (0, l.jsxs)("details", {
            className: "production-record",
            children: [
              /* @__PURE__ */ (0, l.jsxs)("summary", { children: [/* @__PURE__ */ (0, l.jsx)("b", { children: b.title }), /* @__PURE__ */ (0, l.jsxs)("span", {
                className: "status candidate",
                children: ["共用參考 v", b.version]
              })] }),
              /* @__PURE__ */ (0, l.jsx)("code", {
                className: "context-id",
                children: b.key
              }),
              /* @__PURE__ */ (0, l.jsx)("div", {
                className: "production-source-text",
                children: b.content
              }),
              /* @__PURE__ */ (0, l.jsxs)("p", { children: ["來源：", b.source] }),
              /* @__PURE__ */ (0, l.jsxs)("p", { children: ["素材位置：", b.location || "文字已收錄"] }),
              b.originEpisodeId && /* @__PURE__ */ (0, l.jsxs)("p", {
                className: "muted",
                children: [
                  "保留來源集數：",
                  C.find((ae) => ae.id === b.originEpisodeId)?.episode ?? b.originEpisodeId,
                  "；按本集需求選用。"
                ]
              }),
              /* @__PURE__ */ (0, l.jsxs)("div", {
                className: "context-actions",
                children: [/* @__PURE__ */ (0, l.jsx)("button", {
                  className: "btn",
                  disabled: f || !!h.sharedPins?.some((ae) => ae.assetId === b.id),
                  onClick: () => {
                    x(b.id);
                  },
                  children: h.sharedPins?.some((ae) => ae.assetId === b.id) ? `${h.episode} 已連結此版本` : `連結此版本至 ${h.episode}`
                }), /* @__PURE__ */ (0, l.jsx)("button", {
                  className: "btn",
                  disabled: f,
                  onClick: () => me(b),
                  children: "建立新版本"
                })]
              }),
              (h.sharedPins?.filter((ae) => ae.assetKey === b.key).at(-1)?.version ?? b.version) < b.version && /* @__PURE__ */ (0, l.jsx)("p", {
                className: "inline-note",
                children: "本集仍連結較舊版本，沿用內容保持不變；需要時再連結新版本。"
              })
            ]
          }, b.id)),
          /* @__PURE__ */ (0, l.jsxs)("details", {
            className: "production-import",
            children: [
              /* @__PURE__ */ (0, l.jsx)("summary", { children: "批次補入作品共用來源" }),
              /* @__PURE__ */ (0, l.jsx)("p", { children: "貼上包含 assets 清單的 JSON。每項須有 key、title、kind、content、source；識別鍵重複時拒絕覆寫。" }),
              /* @__PURE__ */ (0, l.jsxs)("label", { children: ["作品來源 JSON", /* @__PURE__ */ (0, l.jsx)("textarea", {
                rows: 5,
                value: X,
                onChange: (b) => {
                  oe(b.target.value), ie("");
                }
              })] }),
              q && /* @__PURE__ */ (0, l.jsx)("p", {
                role: "alert",
                children: q
              }),
              /* @__PURE__ */ (0, l.jsx)("button", {
                className: "btn primary",
                disabled: f || !X.trim(),
                onClick: async () => {
                  try {
                    const b = JSON.parse(X);
                    if (!Array.isArray(b.assets)) throw new Error("缺少 assets 清單");
                    await p("import_shared_assets", { assets: b.assets }) && oe("");
                  } catch (b) {
                    ie(b instanceof Error ? b.message : "格式錯誤");
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
var Sf = {
  key: "",
  title: "",
  world: "real",
  label: "v2_candidate",
  sourceLocation: "",
  sourceVersion: "",
  backupLocation: "",
  sha256: "",
  reference: ""
}, Mx = {
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
function Ox({ initialSelection: r, work: h, episode: C, episodes: f, busy: p, onAction: k, onProject: x, onDirty: A }) {
  const [N, _] = (0, g.useState)(r?.modelId ?? ""), [w, G] = (0, g.useState)(r?.versionId ?? ""), [z, le] = (0, g.useState)(r?.stageId ?? "M01"), [ne, I] = (0, g.useState)(null), [X, oe] = (0, g.useState)(Sf), [q, ie] = (0, g.useState)(""), H = h ? Os(h) : null, F = H?.models.find((T) => T.id === N) ?? H?.models[0], $ = F?.versions.find((T) => T.id === w) ?? F?.versions.at(-1), pe = $?.stages[z], te = _a.find((T) => T.id === z);
  function P(T) {
    dt(T), A(T);
  }
  const [y, ee] = (0, g.useState)([]), [ge, me] = (0, g.useState)(""), [b, ae] = (0, g.useState)(""), [K, Y] = (0, g.useState)(""), [Q, se] = (0, g.useState)(""), [re, _e] = (0, g.useState)(""), [o, j] = (0, g.useState)("technical"), [R, W] = (0, g.useState)({}), [ce, he] = (0, g.useState)(""), [de, Ge] = (0, g.useState)(""), [ze, dt] = (0, g.useState)(!1);
  (0, g.useEffect)(() => {
    pe && (ee(pe.checks), me(pe.evidence), ae(pe.summary), Y(pe.nextStep), se($.candidateLocation), P(!1));
  }, [pe, $]), (0, g.useEffect)(() => {
    if (!ze) return;
    const T = (we) => we.preventDefault();
    return window.addEventListener("beforeunload", T), () => window.removeEventListener("beforeunload", T);
  }, [ze]);
  function Xe(T) {
    ze && !window.confirm("有未儲存模型紀錄，要放棄修改嗎？") || (P(!1), ie(""), T());
  }
  async function Me(T, we) {
    ie("");
    const Ze = await k(T, we);
    return Ze && P(!1), Ze;
  }
  function ve() {
    !F || !$ || (oe({
      key: F.key,
      title: F.title,
      world: F.world,
      label: "v" + ($.number + 2) + "_candidate",
      sourceLocation: $.sourceLocation,
      sourceVersion: $.sourceVersion,
      backupLocation: $.backupLocation,
      sha256: $.sha256,
      reference: $.reference
    }), I("version"));
  }
  if (!h) return /* @__PURE__ */ (0, l.jsxs)("section", {
    className: "wide-card",
    children: [
      /* @__PURE__ */ (0, l.jsx)("h2", { children: "3D 模型製作流程" }),
      /* @__PURE__ */ (0, l.jsx)("p", {
        className: "stage-description",
        children: "模型屬於作品共用資產。先把本集整理到作品專案，即可登記模型及候選版本，供後續各集引用。"
      }),
      /* @__PURE__ */ (0, l.jsxs)("button", {
        className: "btn primary",
        onClick: x,
        children: ["前往作品專案 ", /* @__PURE__ */ (0, l.jsx)(di, { size: 15 })]
      })
    ]
  });
  const qe = H.issues.filter((T) => T.modelId === F?.id && T.versionId === $?.id), lt = qe.filter((T) => T.status === "open"), d = !!$?.stages.M08.author, B = F && $ ? ox(h, F.id, $.id, z) : [], ue = H.pins.filter((T) => T.episodeId === C.id), He = new Map(ue.map((T) => [[T.modelId, T.sceneIds].join("|"), T]));
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
            /* @__PURE__ */ (0, l.jsxs)("h2", { children: [/* @__PURE__ */ (0, l.jsx)(sd, { size: 23 }), "模型製作與完善"] }),
            /* @__PURE__ */ (0, l.jsxs)("p", { children: [h.title, " · 各模型、各候選及各集引用分開記錄。"] })
          ] }), /* @__PURE__ */ (0, l.jsxs)("button", {
            className: "btn primary",
            disabled: p,
            onClick: () => Xe(() => {
              oe(Sf), I("register");
            }),
            children: [/* @__PURE__ */ (0, l.jsx)(Ft, { size: 15 }), "登記模型"]
          })]
        }), /* @__PURE__ */ (0, l.jsxs)("div", {
          className: "model-principles",
          children: [
            /* @__PURE__ */ (0, l.jsxs)("span", { children: [/* @__PURE__ */ (0, l.jsx)(jl, { size: 15 }), "先讀原檔與設定"] }),
            /* @__PURE__ */ (0, l.jsxs)("span", { children: [/* @__PURE__ */ (0, l.jsx)(cd, { size: 15 }), "保留原檔及版本"] }),
            /* @__PURE__ */ (0, l.jsxs)("span", { children: [/* @__PURE__ */ (0, l.jsx)(vl, { size: 15 }), "技術、視覺與採用分開"] })
          ]
        })]
      }),
      ne && /* @__PURE__ */ (0, l.jsxs)("form", {
        className: "wide-card context-form model-register",
        onSubmit: async (T) => {
          T.preventDefault();
          const we = await Me(ne === "register" ? "register_model" : "create_model_version", {
            ...X,
            modelId: F?.id
          });
          if (we) {
            const Ze = ne === "register" ? we.work.modelFlow?.models.at(-1) : we.work.modelFlow?.models.find((Dt) => Dt.id === F?.id);
            I(null), _(Ze?.id ?? ""), G(Ze?.versions.at(-1)?.id ?? ""), le("M01");
          }
        },
        children: [
          /* @__PURE__ */ (0, l.jsxs)("div", {
            className: "section-title",
            children: [/* @__PURE__ */ (0, l.jsx)("h3", { children: ne === "register" ? "登記模型來源" : "建立新候選版本" }), /* @__PURE__ */ (0, l.jsx)("button", {
              className: "text-btn",
              type: "button",
              onClick: () => I(null),
              children: "關閉"
            })]
          }),
          /* @__PURE__ */ (0, l.jsxs)("div", {
            className: "context-form-grid",
            children: [
              ne === "register" && /* @__PURE__ */ (0, l.jsxs)(l.Fragment, { children: [
                /* @__PURE__ */ (0, l.jsxs)("label", { children: ["模型固定識別鍵 *", /* @__PURE__ */ (0, l.jsx)("input", {
                  required: !0,
                  maxLength: 100,
                  value: X.key,
                  placeholder: "RG-REAL-01",
                  onChange: (T) => oe({
                    ...X,
                    key: T.target.value
                  })
                })] }),
                /* @__PURE__ */ (0, l.jsxs)("label", { children: ["模型名稱 *", /* @__PURE__ */ (0, l.jsx)("input", {
                  required: !0,
                  maxLength: 200,
                  value: X.title,
                  placeholder: "現實主角家",
                  onChange: (T) => oe({
                    ...X,
                    title: T.target.value
                  })
                })] }),
                /* @__PURE__ */ (0, l.jsxs)("label", { children: ["世界／場景分類", /* @__PURE__ */ (0, l.jsxs)("select", {
                  value: X.world,
                  onChange: (T) => oe({
                    ...X,
                    world: T.target.value
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
                value: X.label,
                onChange: (T) => oe({
                  ...X,
                  label: T.target.value
                })
              })] }),
              [
                ["sourceLocation", "正式來源 GLB 位置 *"],
                ["sourceVersion", "來源版本／清單版本 *"],
                ["backupLocation", "原檔備份位置"],
                ["sha256", "原檔 SHA-256（實際計算值）"]
              ].map(([T, we]) => /* @__PURE__ */ (0, l.jsxs)("label", { children: [we, /* @__PURE__ */ (0, l.jsx)("input", {
                required: T === "sourceLocation" || T === "sourceVersion",
                maxLength: T === "sha256" ? 64 : 2e3,
                pattern: T === "sha256" ? "[a-fA-F0-9]{64}" : void 0,
                value: X[T],
                onChange: (Ze) => oe({
                  ...X,
                  [T]: Ze.target.value
                })
              })] }, T))
            ]
          }),
          /* @__PURE__ */ (0, l.jsxs)("label", { children: ["設定與尺度來源／不可改動項目", /* @__PURE__ */ (0, l.jsx)("textarea", {
            rows: 4,
            maxLength: 12e3,
            value: X.reference,
            onChange: (T) => oe({
              ...X,
              reference: T.target.value
            }),
            placeholder: "設計書與平面圖版本、固定節點／家具 ID、單位、重大變更待核定項。"
          })] }),
          /* @__PURE__ */ (0, l.jsx)("p", {
            className: "muted",
            children: "來源會隨此版本保存。待補欄位可先留空，但原檔、備份與雜湊不齊時不能通過盤點；更正來源請另建版本。登記資料不會修改或上傳模型檔案。"
          }),
          /* @__PURE__ */ (0, l.jsx)("button", {
            className: "btn primary",
            disabled: p,
            children: "保存模型來源與空白流程"
          })
        ]
      }),
      !F || !$ ? /* @__PURE__ */ (0, l.jsxs)("div", {
        className: "wide-card empty",
        children: [
          /* @__PURE__ */ (0, l.jsx)(sd, { size: 36 }),
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
                  value: F.id,
                  disabled: p,
                  onChange: (T) => Xe(() => {
                    _(T.target.value), G(""), le("M01");
                  }),
                  children: H.models.map((T) => /* @__PURE__ */ (0, l.jsxs)("option", {
                    value: T.id,
                    children: [
                      T.key,
                      " · ",
                      T.title
                    ]
                  }, T.id))
                })] }),
                /* @__PURE__ */ (0, l.jsxs)("label", { children: ["精確版本", /* @__PURE__ */ (0, l.jsx)("select", {
                  value: $.id,
                  disabled: p,
                  onChange: (T) => Xe(() => G(T.target.value)),
                  children: F.versions.map((T) => /* @__PURE__ */ (0, l.jsxs)("option", {
                    value: T.id,
                    children: [
                      "v",
                      T.number,
                      " · ",
                      T.label,
                      T.stages.M08.author ? "（曾採用）" : "",
                      F.adoptedVersionId === T.id ? "／目前採用" : ""
                    ]
                  }, T.id))
                })] }),
                /* @__PURE__ */ (0, l.jsxs)("button", {
                  className: "btn",
                  disabled: p,
                  onClick: () => Xe(ve),
                  children: [/* @__PURE__ */ (0, l.jsx)(Ft, { size: 14 }), "另建候選版本"]
                })
              ]
            }),
            /* @__PURE__ */ (0, l.jsxs)("div", {
              className: "production-totals",
              children: [
                /* @__PURE__ */ (0, l.jsxs)("b", { children: [_a.filter((T) => $.stages[T.id].author).length, " / 8 階段核定"] }),
                /* @__PURE__ */ (0, l.jsxs)("b", { children: [lt.length, " 項待修或待裁定"] }),
                /* @__PURE__ */ (0, l.jsxs)("span", { children: [
                  F.world === "real" ? "現實場景" : F.world === "game" ? "遊戲場景" : "其他模型",
                  " · ",
                  d ? "此採用版本保持不變" : "候選製作中"
                ] })
              ]
            }),
            /* @__PURE__ */ (0, l.jsxs)("details", { children: [/* @__PURE__ */ (0, l.jsx)("summary", { children: "此版本來源與設定" }), /* @__PURE__ */ (0, l.jsxs)("dl", {
              className: "model-sources",
              children: [
                /* @__PURE__ */ (0, l.jsx)("dt", { children: "模型來源" }),
                /* @__PURE__ */ (0, l.jsxs)("dd", { children: [
                  $.sourceLocation,
                  " · ",
                  $.sourceVersion
                ] }),
                /* @__PURE__ */ (0, l.jsx)("dt", { children: "原檔備份" }),
                /* @__PURE__ */ (0, l.jsx)("dd", { children: $.backupLocation || "待補" }),
                /* @__PURE__ */ (0, l.jsx)("dt", { children: "SHA-256" }),
                /* @__PURE__ */ (0, l.jsx)("dd", { children: $.sha256 || "待實際計算" }),
                /* @__PURE__ */ (0, l.jsx)("dt", { children: "設定與尺度" }),
                /* @__PURE__ */ (0, l.jsx)("dd", { children: $.reference || "待補" }),
                /* @__PURE__ */ (0, l.jsx)("dt", { children: "候選 GLB" }),
                /* @__PURE__ */ (0, l.jsx)("dd", { children: $.candidateLocation || "尚未登記" })
              ]
            })] })
          ]
        }),
        /* @__PURE__ */ (0, l.jsx)("div", {
          className: "model-stage-grid",
          children: _a.map((T, we) => /* @__PURE__ */ (0, l.jsxs)("button", {
            disabled: p,
            className: "model-step " + (z === T.id ? "selected" : "") + ($.stages[T.id].author ? " passed" : ""),
            onClick: () => Xe(() => le(T.id)),
            children: [
              /* @__PURE__ */ (0, l.jsx)("small", { children: T.id }),
              /* @__PURE__ */ (0, l.jsx)("b", { children: T.title }),
              /* @__PURE__ */ (0, l.jsx)("span", { children: $.stages[T.id].author ? "作者已確認" : $.stages[T.id].status === "needs_revision" ? "待修正" : $.stages[T.id].status === "candidate" ? "已有工作回報" : "待製作" })
            ]
          }, T.id))
        }),
        /* @__PURE__ */ (0, l.jsxs)("div", {
          className: "wide-card model-stage-detail",
          children: [
            /* @__PURE__ */ (0, l.jsxs)("div", {
              className: "section-title",
              children: [/* @__PURE__ */ (0, l.jsxs)("div", { children: [/* @__PURE__ */ (0, l.jsxs)("div", {
                className: "eyebrow",
                children: [
                  te.id,
                  " · ",
                  F.title,
                  " · ",
                  $.label
                ]
              }), /* @__PURE__ */ (0, l.jsx)("h2", { children: te.title })] }), /* @__PURE__ */ (0, l.jsx)("span", {
                className: "status " + (pe.author ? "passed" : pe.status === "needs_revision" ? "needs_revision" : "candidate"),
                children: pe.author ? "作者已確認" : pe.status === "todo" ? "待製作" : "待確認工作"
              })]
            }),
            /* @__PURE__ */ (0, l.jsxs)("div", {
              className: "output-box",
              children: [/* @__PURE__ */ (0, l.jsx)(jl, { size: 19 }), /* @__PURE__ */ (0, l.jsxs)("div", { children: [/* @__PURE__ */ (0, l.jsx)("strong", { children: "應留下的產出" }), /* @__PURE__ */ (0, l.jsx)("p", { children: te.output })] })]
            }),
            /* @__PURE__ */ (0, l.jsxs)("form", {
              className: "context-form",
              onSubmit: async (T) => {
                T.preventDefault(), await Me("save_model_stage", {
                  modelId: F.id,
                  versionId: $.id,
                  stageId: z,
                  checks: y,
                  evidence: ge,
                  summary: b,
                  nextStep: K,
                  candidateLocation: Q
                });
              },
              children: [
                /* @__PURE__ */ (0, l.jsx)("div", {
                  className: "checklist",
                  children: te.checks.map((T, we) => /* @__PURE__ */ (0, l.jsxs)("label", { children: [/* @__PURE__ */ (0, l.jsx)("input", {
                    type: "checkbox",
                    disabled: p || d,
                    checked: y[we] ?? !1,
                    onChange: (Ze) => {
                      ee((Dt) => Dt.map((M, ke) => ke === we ? Ze.target.checked : M)), P(!0);
                    }
                  }), /* @__PURE__ */ (0, l.jsx)("span", { children: T })] }, T))
                }),
                z === "M04" && /* @__PURE__ */ (0, l.jsxs)("label", { children: ["本次獨立候選 GLB", /* @__PURE__ */ (0, l.jsx)("input", {
                  disabled: p || d,
                  maxLength: 2e3,
                  value: Q,
                  placeholder: ".../reality-home_v2_candidate.glb",
                  onChange: (T) => {
                    se(T.target.value), P(!0);
                  }
                })] }),
                /* @__PURE__ */ (0, l.jsxs)("label", { children: ["實際產出／檢查依據位置", /* @__PURE__ */ (0, l.jsx)("textarea", {
                  rows: 2,
                  disabled: p || d,
                  value: ge,
                  onChange: (T) => {
                    me(T.target.value), P(!0);
                  },
                  placeholder: "原檔盤點報告、逐物件差異、檢查結果或指定鏡位截圖；附來源版本。"
                })] }),
                /* @__PURE__ */ (0, l.jsxs)("label", { children: ["本次實際做了什麼 *", /* @__PURE__ */ (0, l.jsx)("textarea", {
                  required: !0,
                  rows: 3,
                  maxLength: 6e3,
                  disabled: p || d,
                  value: b,
                  onChange: (T) => {
                    ae(T.target.value), P(!0);
                  },
                  placeholder: "具體節點／物件、改動、檢查方式、尚未完成項。"
                })] }),
                /* @__PURE__ */ (0, l.jsxs)("label", { children: ["下一位 AI 從哪裡繼續 *", /* @__PURE__ */ (0, l.jsx)("textarea", {
                  required: !0,
                  rows: 3,
                  maxLength: 6e3,
                  disabled: p || d,
                  value: K,
                  onChange: (T) => {
                    Y(T.target.value), P(!0);
                  },
                  placeholder: "指定版本、檔案位置、先讀資料、下一個物件或鏡位，以及受阻原因。"
                })] }),
                /* @__PURE__ */ (0, l.jsxs)("div", {
                  className: "context-actions",
                  children: [/* @__PURE__ */ (0, l.jsxs)("button", {
                    className: "btn",
                    disabled: p || d || !ze,
                    children: ["保存候選工作紀錄", ze ? " *" : ""]
                  }), /* @__PURE__ */ (0, l.jsxs)("button", {
                    type: "button",
                    className: "btn primary",
                    disabled: p || d || ze || B.length > 0 || !!pe.author,
                    onClick: () => {
                      Me(z === "M08" ? "adopt_model_version" : "approve_model_stage", {
                        modelId: F.id,
                        versionId: $.id,
                        stageId: z,
                        note: "作者確認指定候選版本與適用範圍"
                      });
                    },
                    children: [/* @__PURE__ */ (0, l.jsx)(vl, { size: 15 }), z === "M08" ? "作者登記採用此版本" : "作者確認本階段"]
                  })]
                }),
                /* @__PURE__ */ (0, l.jsx)("p", {
                  className: "muted",
                  children: d ? "已採用版本及舊集引用保持不變；需要修改請另建候選。" : ze ? "請先保存工作紀錄，再確認。" : B.length ? "待補：" + B.join("；") : "檢查條件已齊，請核對實際成果後確認。"
                }),
                z === "M08" && /* @__PURE__ */ (0, l.jsx)("p", {
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
              onSubmit: async (T) => {
                T.preventDefault(), await Me("report_model_issue", {
                  modelId: F.id,
                  versionId: $.id,
                  stageId: z,
                  kind: o,
                  reason: re
                }) && _e("");
              },
              children: [
                /* @__PURE__ */ (0, l.jsxs)("div", {
                  className: "context-form-grid",
                  children: [/* @__PURE__ */ (0, l.jsxs)("label", { children: ["問題分類", /* @__PURE__ */ (0, l.jsxs)("select", {
                    value: o,
                    onChange: (T) => j(T.target.value),
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
                    value: te.id + " " + te.title
                  })] })]
                }),
                /* @__PURE__ */ (0, l.jsxs)("label", { children: ["具體原因", /* @__PURE__ */ (0, l.jsx)("textarea", {
                  required: !0,
                  rows: 2,
                  maxLength: 6e3,
                  value: re,
                  onChange: (T) => _e(T.target.value)
                })] }),
                /* @__PURE__ */ (0, l.jsxs)("button", {
                  className: "btn",
                  disabled: p || !re.trim(),
                  children: [/* @__PURE__ */ (0, l.jsx)(oi, { size: 15 }), "登記問題"]
                })
              ]
            }),
            qe.map((T) => /* @__PURE__ */ (0, l.jsxs)("article", {
              className: "context-record",
              children: [
                /* @__PURE__ */ (0, l.jsxs)("div", {
                  className: "issue-top",
                  children: [/* @__PURE__ */ (0, l.jsx)("span", {
                    className: "status " + (T.status === "open" ? "needs_revision" : "passed"),
                    children: T.status === "open" ? "待處理" : "作者已複核"
                  }), /* @__PURE__ */ (0, l.jsxs)("b", { children: [
                    T.stageId,
                    " · ",
                    T.kind === "major" ? "重大變更" : T.kind === "technical" ? "技術" : "視覺"
                  ] })]
                }),
                /* @__PURE__ */ (0, l.jsx)("p", { children: T.reason }),
                /* @__PURE__ */ (0, l.jsxs)("small", { children: [
                  T.by,
                  " · ",
                  new Date(T.at).toLocaleString("zh-TW", { timeZone: "Asia/Taipei" })
                ] }),
                T.status === "open" ? /* @__PURE__ */ (0, l.jsxs)("form", {
                  className: "context-form",
                  onSubmit: async (we) => {
                    we.preventDefault(), await Me("resolve_model_issue", {
                      modelId: F.id,
                      versionId: $.id,
                      issueId: T.id,
                      resolution: R[T.id] ?? ""
                    });
                  },
                  children: [/* @__PURE__ */ (0, l.jsxs)("label", { children: ["作者修正複核／裁定結果", /* @__PURE__ */ (0, l.jsx)("textarea", {
                    required: !0,
                    rows: 2,
                    maxLength: 6e3,
                    value: R[T.id] ?? "",
                    onChange: (we) => W({
                      ...R,
                      [T.id]: we.target.value
                    })
                  })] }), /* @__PURE__ */ (0, l.jsx)("button", {
                    className: "btn",
                    disabled: p,
                    children: "作者確認處理結果"
                  })]
                }) : /* @__PURE__ */ (0, l.jsxs)("p", { children: ["處理結果：", T.resolution] })
              ]
            }, T.id))
          ]
        }),
        /* @__PURE__ */ (0, l.jsxs)("div", {
          className: "wide-card",
          children: [
            /* @__PURE__ */ (0, l.jsx)("div", {
              className: "section-title",
              children: /* @__PURE__ */ (0, l.jsxs)("div", { children: [/* @__PURE__ */ (0, l.jsxs)("h2", { children: [/* @__PURE__ */ (0, l.jsx)(on, { size: 19 }), "各集固定版本引用"] }), /* @__PURE__ */ (0, l.jsxs)("p", { children: [
                "目前集數：",
                C.episode,
                "。新候選不會自動替換 EP01 或其他集的模型來源。"
              ] })] })
            }),
            d && /* @__PURE__ */ (0, l.jsxs)("form", {
              className: "context-form",
              onSubmit: async (T) => {
                T.preventDefault(), await Me("pin_model_version", {
                  modelId: F.id,
                  versionId: $.id,
                  episodeId: C.id,
                  purpose: ce,
                  sceneIds: de
                }) && (he(""), Ge(""));
              },
              children: [/* @__PURE__ */ (0, l.jsxs)("div", {
                className: "context-form-grid",
                children: [/* @__PURE__ */ (0, l.jsxs)("label", { children: ["引用場次（選填）", /* @__PURE__ */ (0, l.jsx)("input", {
                  value: de,
                  maxLength: 1e3,
                  placeholder: "S06、S07",
                  onChange: (T) => Ge(T.target.value)
                })] }), /* @__PURE__ */ (0, l.jsxs)("label", { children: ["本集用途 *", /* @__PURE__ */ (0, l.jsx)("input", {
                  required: !0,
                  value: ce,
                  maxLength: 2e3,
                  placeholder: "固定樓梯、餐桌與走道位置",
                  onChange: (T) => he(T.target.value)
                })] })]
              }), /* @__PURE__ */ (0, l.jsxs)("button", {
                className: "btn",
                disabled: p || lt.length > 0,
                children: ["將此採用版本引用至 ", C.episode]
              })]
            }),
            ue.length ? /* @__PURE__ */ (0, l.jsx)("div", {
              className: "model-pins",
              children: ue.map((T, we) => {
                const Ze = H.models.find((M) => M.id === T.modelId), Dt = Ze?.versions.find((M) => M.id === T.versionId);
                return /* @__PURE__ */ (0, l.jsxs)("article", { children: [
                  /* @__PURE__ */ (0, l.jsxs)("b", { children: [
                    Ze?.title,
                    " · ",
                    Dt?.label
                  ] }),
                  " ",
                  /* @__PURE__ */ (0, l.jsx)("span", {
                    className: "status " + (He.get([T.modelId, T.sceneIds].join("|")) === T ? "passed" : "todo"),
                    children: He.get([T.modelId, T.sceneIds].join("|")) === T ? "本集現行引用" : "歷史引用"
                  }),
                  /* @__PURE__ */ (0, l.jsxs)("p", { children: [
                    T.sceneIds || "本集",
                    " ／ ",
                    T.purpose
                  ] }),
                  /* @__PURE__ */ (0, l.jsx)("code", { children: Dt?.candidateLocation })
                ] }, we);
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
            H.history.filter((T) => T.modelId === F.id).length,
            "）"
          ] }), [...H.history].reverse().filter((T) => T.modelId === F.id).slice(0, 60).map((T, we) => /* @__PURE__ */ (0, l.jsxs)("article", {
            className: "context-mini",
            children: [
              /* @__PURE__ */ (0, l.jsxs)("b", { children: [
                Mx[T.action] ?? T.action,
                " · ",
                T.stageId,
                " · ",
                F.versions.find((Ze) => Ze.id === T.versionId)?.label
              ] }),
              /* @__PURE__ */ (0, l.jsx)("p", { children: T.detail }),
              /* @__PURE__ */ (0, l.jsxs)("small", { children: [
                T.actor === "ai" ? "AI" : "作者",
                " · ",
                T.by,
                " · ",
                new Date(T.at).toLocaleString("zh-TW", { timeZone: "Asia/Taipei" })
              ] })
            ]
          }, we))]
        })
      ] }),
      q && /* @__PURE__ */ (0, l.jsx)("p", {
        role: "alert",
        children: q
      })
    ]
  });
}
var ld = "https://lihuany635-create.github.io/lizhi-cloud-web/?open=animationflow", id = {
  todo: "待製作",
  candidate: "候選待驗收",
  passed: "已通過",
  in_timeline: "已入片",
  needs_revision: "待修正"
}, Nf = [
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
function ci(r) {
  return r ? new Date(r).toLocaleString("zh-TW", {
    timeZone: "Asia/Taipei",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  }) : "尚無紀錄";
}
function Dx(r, h, C = "application/json") {
  const f = URL.createObjectURL(new Blob([h], { type: C })), p = document.createElement("a");
  p.href = f, p.download = r, p.click(), setTimeout(() => URL.revokeObjectURL(f), 1e3);
}
function Ux({ nativeTransport: r, initialWorkId: h, initialTab: C = "resume", onDirtyChange: f } = {}) {
  const [p, k] = (0, g.useState)([]), [x, A] = (0, g.useState)(null), [N, _] = (0, g.useState)(C), [w, G] = (0, g.useState)("01"), [z, le] = (0, g.useState)(null), [ne, I] = (0, g.useState)([]), [X, oe] = (0, g.useState)(!0), [q, ie] = (0, g.useState)(!1), [H, F] = (0, g.useState)(""), [$, pe] = (0, g.useState)(""), [te, P] = (0, g.useState)(!1), [y, ee] = (0, g.useState)([]), [ge, me] = (0, g.useState)(""), [b, ae] = (0, g.useState)(""), [K, Y] = (0, g.useState)(!1), [Q, se] = (0, g.useState)(null), [re, _e] = (0, g.useState)({}), [o, j] = (0, g.useState)(""), [R, W] = (0, g.useState)(!1), [ce, he] = (0, g.useState)(null), de = (0, g.useRef)(0), Ge = (0, g.useRef)(""), ze = (0, g.useRef)(!1);
  (0, g.useEffect)(() => {
    ze.current = K, f?.(K);
  }, [K, f]);
  const dt = (0, g.useCallback)((m) => {
    Ge.current = m.id, A(m), le((ye) => ye?.id === m.workId ? ye : null), k((ye) => [rd(m), ...ye.filter((Se) => Se.id !== m.id)]), Y(!1);
  }, []);
  async function Xe(m, ye, Se = "projects") {
    const st = r ? await r(Se, m, ye) : await fetch("/api/" + Se + m, {
      cache: "no-store",
      ...ye ? {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(ye)
      } : {}
    });
    if (st.status === 401)
      throw P(!0), new Error("請先登入流程工作台");
    if (!st.headers.get("content-type")?.includes("application/json"))
      throw P(!0), new Error("請開啟工作台並使用 ChatGPT 登入");
    const Fe = await st.json();
    if (!st.ok) throw new Error(Fe.error || "讀取失敗");
    return P(!1), Fe;
  }
  const Me = (0, g.useCallback)(async (m) => {
    const ye = ++de.current;
    m && m !== Ge.current && (Ge.current = m, oe(!0));
    try {
      const [Se, st] = await Promise.all([Xe(""), Xe("", void 0, "works")]), Fe = h ? Se.filter((kt) => kt.workId === h) : Se, wt = m || Ge.current || Fe.find((kt) => !kt.archived && kt.workId && kt.episode === "EP01")?.id || Fe.find((kt) => !kt.archived && kt.workId)?.id || Fe.find((kt) => !kt.archived)?.id;
      let ht = null, un = null;
      if (wt && (ht = await Xe("?id=" + encodeURIComponent(wt)), ht.workId && (un = (await Xe("?id=" + encodeURIComponent(ht.workId), void 0, "works")).work)), ye !== de.current) return;
      F(""), k(Fe), I(h ? st.filter((kt) => kt.id === h) : st), ze.current || (ht ? dt(ht) : A(null), le(un));
    } catch (Se) {
      ye === de.current && F(Se.message);
    } finally {
      ye === de.current && oe(!1);
    }
  }, [dt, h]);
  (0, g.useEffect)(() => {
    const m = new URLSearchParams(window.location.search).get("view");
    !h && m && [
      "resume",
      "project",
      "models",
      "context"
    ].includes(m) && _(m);
  }, []), (0, g.useEffect)(() => {
    Me();
  }, [Me]), (0, g.useEffect)(() => {
    const m = setInterval(() => {
      !K && !Q && !q && Me(Ge.current || void 0);
    }, 2e4);
    return () => clearInterval(m);
  }, [
    K,
    Q,
    q,
    x?.id,
    Me
  ]), (0, g.useEffect)(() => {
    const m = x?.stages[w];
    m && (ee(m.checks), me(m.evidence), ae(m.note), Y(!1));
  }, [x, w]), (0, g.useEffect)(() => {
    if (!K) return;
    const m = (ye) => {
      ye.preventDefault();
    };
    return window.addEventListener("beforeunload", m), () => window.removeEventListener("beforeunload", m);
  }, [K]), (0, g.useEffect)(() => {
    if (!$) return;
    const m = setTimeout(() => pe(""), 4500);
    return () => clearTimeout(m);
  }, [$]);
  async function ve(m, ye = {}) {
    if (x) {
      de.current++, ie(!0), F("");
      try {
        const Se = await Xe("", {
          projectId: x.id,
          revision: x.revision,
          action: m,
          args: ye
        });
        return dt(Se), Se.archived && W(!0), pe("已儲存至雲端"), Se;
      } catch (Se) {
        F(Se.message);
      } finally {
        ie(!1);
      }
    }
  }
  async function qe(m, ye) {
    de.current++, ie(!0), F("");
    try {
      const Se = await Xe("", [
        "convert_episode",
        "create_work",
        "create_episode"
      ].includes(m) ? {
        action: m,
        ...ye,
        workId: z?.id,
        revision: z?.revision
      } : {
        action: m,
        workId: z?.id,
        revision: z?.revision,
        args: ye
      }, "works");
      return le(Se.work), I((st) => [{
        ...xx(Se.work),
        episodeCount: Se.episodes.length
      }, ...st.filter((Fe) => Fe.id !== Se.work.id)]), k((st) => [...Se.episodes, ...st.filter((Fe) => !Se.episodes.some((wt) => wt.id === Fe.id))]), Se.episode && dt(Se.episode), pe("作品專案已儲存"), Se;
    } catch (Se) {
      if (F(Se.message), m === "create_episode") throw Se;
    } finally {
      ie(!1);
    }
  }
  function lt(m) {
    K && !window.confirm("此階段有未儲存修改，要放棄修改嗎？") || (Y(!1), m());
  }
  function d(m) {
    lt(() => G(m));
  }
  function B(m) {
    lt(() => {
      _(m), [
        "main",
        "op",
        "ed"
      ].includes(m) && G(Pt.find((ye) => ye.group === m).id);
    });
  }
  async function ue(m) {
    m.preventDefault(), ie(!0), F("");
    try {
      Q === "create" ? (z ? await qe("create_episode", {
        title: re.title || "製作資料",
        episode: re.episode || "EP01"
      }) : dt(await Xe("", {
        action: "create_project",
        title: re.title || "現實遊戲",
        episode: re.episode || "EP01"
      })), _("main"), G("01"), se(null), pe("專案已建立，全部階段待確認")) : Q === "shot" ? await ve("save_shot", re) && se(null) : Q === "issue" ? await ve("add_issue", re) && se(null) : Q === "resolve" ? await ve("resolve_issue", re) && se(null) : Q === "archive" && await ve(x?.archived ? "restore" : "archive") && se(null);
    } catch (ye) {
      F(ye.message);
    } finally {
      ie(!1);
    }
  }
  const He = x ? rd(x) : null, T = Pt.find((m) => m.id === w), we = x?.stages[w], Ze = x ? Uf(x, w) : [], Dt = x ? Ts(x, w) : [], M = Pt.filter((m) => m.group === N), ke = x?.issues.filter((m) => m.status === "open") || [], je = x?.production?.completionReports?.at(-1), Ce = je?.status === "completed", Be = x ? hd(x).registration : null, bt = [
    [
      "resume",
      "工作首頁",
      ui
    ],
    [
      "project",
      "作品與集數",
      nn
    ],
    [
      "models",
      "3D 模型",
      ff
    ],
    [
      "settings",
      "採用設定",
      jl
    ],
    [
      "context",
      "資料與交接",
      ui
    ],
    [
      "main",
      "動畫製作",
      Qm
    ],
    [
      "op",
      "片頭 OP",
      Kr
    ],
    [
      "ed",
      "片尾 ED",
      nn
    ],
    [
      "shots",
      "鏡頭與素材",
      ff
    ],
    [
      "issues",
      "待修問題",
      oi
    ],
    [
      "chatgpt",
      "AI 協作",
      $r
    ],
    [
      "history",
      "異動紀錄",
      Tf
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
            href: ld,
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
            children: [/* @__PURE__ */ (0, l.jsx)(nn, { size: 19 }), /* @__PURE__ */ (0, l.jsxs)("select", {
              disabled: q || X,
              "aria-label": "切換作品專案",
              value: z?.id || "",
              onChange: (m) => lt(() => {
                const ye = p.find((Se) => (Se.workId || "") === m.target.value && !Se.archived);
                ye && Me(ye.id), he(null), _("resume");
              }),
              children: [/* @__PURE__ */ (0, l.jsx)("option", {
                value: "",
                children: "未歸屬單集"
              }), ne.map((m) => /* @__PURE__ */ (0, l.jsxs)("option", {
                value: m.id,
                children: [
                  m.title,
                  " · ",
                  m.episodeCount,
                  " 集"
                ]
              }, m.id))]
            })]
          }),
          /* @__PURE__ */ (0, l.jsx)("div", {
            className: "side-label",
            children: "集數"
          }),
          /* @__PURE__ */ (0, l.jsxs)("div", {
            className: "project-switch",
            children: [/* @__PURE__ */ (0, l.jsx)(ui, { size: 19 }), /* @__PURE__ */ (0, l.jsxs)("select", {
              disabled: q || X,
              "aria-label": "切換集數",
              value: x?.id || "",
              onChange: (m) => lt(() => {
                Me(m.target.value);
              }),
              children: [/* @__PURE__ */ (0, l.jsx)("option", {
                value: "",
                disabled: !0,
                children: "選擇集數"
              }), p.filter((m) => (m.workId || "") === (z?.id || "") && (R || !m.archived)).map((m) => /* @__PURE__ */ (0, l.jsxs)("option", {
                value: m.id,
                children: [
                  m.episode,
                  " · ",
                  m.title,
                  m.archived ? "（已封存）" : ""
                ]
              }, m.id))]
            })]
          }),
          /* @__PURE__ */ (0, l.jsxs)("button", {
            className: "new-project",
            onClick: () => lt(() => {
              _e({
                title: "製作資料",
                episode: "EP" + String(Math.max(0, ...p.map((m) => Number(m.episode.replace(/^EP/i, "")) || 0)) + 1).padStart(2, "0")
              }), se("create");
            }),
            children: [/* @__PURE__ */ (0, l.jsx)(Ft, { size: 15 }), "建立其他單集"]
          }),
          /* @__PURE__ */ (0, l.jsx)("nav", {
            "aria-label": "主要功能",
            children: bt.filter(([m]) => [
              "resume",
              "main",
              "models",
              "context",
              "chatgpt"
            ].includes(m)).map(([m, ye, Se]) => /* @__PURE__ */ (0, l.jsxs)("button", {
              "aria-current": N === m ? "page" : void 0,
              className: "nav-item " + (N === m || m === "main" && [
                "op",
                "ed",
                "shots",
                "issues"
              ].includes(N) ? "active" : ""),
              onClick: () => B(m),
              children: [/* @__PURE__ */ (0, l.jsx)(Se, { size: 18 }), /* @__PURE__ */ (0, l.jsx)("span", { children: ye })]
            }, m))
          }),
          /* @__PURE__ */ (0, l.jsxs)("details", {
            className: "nav-more",
            open: [
              "project",
              "settings",
              "history"
            ].includes(N) || void 0,
            children: [/* @__PURE__ */ (0, l.jsx)("summary", { children: "專案管理" }), bt.filter(([m]) => [
              "project",
              "settings",
              "history"
            ].includes(m)).map(([m, ye, Se]) => /* @__PURE__ */ (0, l.jsxs)("button", {
              className: "nav-item " + (N === m ? "active" : ""),
              onClick: () => B(m),
              children: [/* @__PURE__ */ (0, l.jsx)(Se, { size: 17 }), ye]
            }, m))]
          }),
          /* @__PURE__ */ (0, l.jsxs)("div", {
            className: "side-bottom",
            children: [/* @__PURE__ */ (0, l.jsxs)("label", {
              className: "archive-toggle",
              children: [/* @__PURE__ */ (0, l.jsx)("input", {
                type: "checkbox",
                checked: R,
                onChange: (m) => W(m.target.checked)
              }), "顯示已封存專案"]
            }), /* @__PURE__ */ (0, l.jsxs)("a", {
              href: ld,
              target: "_top",
              children: ["返回立之雲端庫 ", /* @__PURE__ */ (0, l.jsx)(om, { size: 14 })]
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
              /* @__PURE__ */ (0, l.jsx)(uf, { size: 14 }),
              /* @__PURE__ */ (0, l.jsx)("span", { children: bt.find((m) => m[0] === N)?.[1] })
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
              disabled: q || X,
              onClick: () => lt(() => {
                Me(x?.id);
              }),
              children: /* @__PURE__ */ (0, l.jsx)(Wa, {
                size: 17,
                className: X ? "spin" : ""
              })
            })]
          })]
        }), /* @__PURE__ */ (0, l.jsxs)("div", {
          className: "page-content",
          children: [
            H && /* @__PURE__ */ (0, l.jsxs)("div", {
              className: "error-banner",
              role: "alert",
              children: [
                /* @__PURE__ */ (0, l.jsx)(oi, { size: 18 }),
                /* @__PURE__ */ (0, l.jsx)("span", { children: H }),
                te && /* @__PURE__ */ (0, l.jsx)("a", {
                  href: r ? ld : "/signin-with-chatgpt?return_to=" + encodeURIComponent("/?view=" + N),
                  target: "_top",
                  children: r ? "重新登入雲端庫" : "登入工作台 ↗"
                }),
                /* @__PURE__ */ (0, l.jsx)("button", {
                  "aria-label": "關閉訊息",
                  onClick: () => F(""),
                  children: /* @__PURE__ */ (0, l.jsx)(Sl, { size: 16 })
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
                /* @__PURE__ */ (0, l.jsx)("h1", { children: bt.find((m) => m[0] === N)?.[1] }),
                /* @__PURE__ */ (0, l.jsx)("p", { children: N === "resume" ? "查看進度，選一件事接著做。" : N === "models" ? "選擇模型與版本，記錄這次完成的工作。" : N === "context" ? "查找製作資料，保留每次工作的交接。" : "目前選取的作品與集數如下。" })
              ] }), /* @__PURE__ */ (0, l.jsx)("div", {
                className: "heading-actions",
                children: x && /* @__PURE__ */ (0, l.jsxs)(l.Fragment, { children: [/* @__PURE__ */ (0, l.jsxs)("button", {
                  className: "btn",
                  onClick: () => Dx(x.title + "_" + x.episode + "_流程備份.json", JSON.stringify(x, null, 2)),
                  children: [/* @__PURE__ */ (0, l.jsx)(dn, { size: 15 }), "匯出紀錄"]
                }), /* @__PURE__ */ (0, l.jsx)("button", {
                  className: "icon-btn bordered",
                  title: x.archived ? "還原專案" : "封存專案",
                  "aria-label": x.archived ? "還原專案" : "封存專案",
                  onClick: () => {
                    _e({}), se("archive");
                  },
                  children: x.archived ? /* @__PURE__ */ (0, l.jsx)(Of, { size: 17 }) : /* @__PURE__ */ (0, l.jsx)(Af, { size: 17 })
                })] })
              })]
            }),
            X ? /* @__PURE__ */ (0, l.jsxs)("div", {
              className: "empty",
              children: [/* @__PURE__ */ (0, l.jsx)(Ir, {
                className: "spin",
                size: 26
              }), /* @__PURE__ */ (0, l.jsx)("h3", { children: "讀取製作進度" })]
            }) : x ? /* @__PURE__ */ (0, l.jsxs)(l.Fragment, { children: [
              /* @__PURE__ */ (0, l.jsxs)("section", {
                className: "project-banner",
                children: [/* @__PURE__ */ (0, l.jsxs)("div", {
                  className: "project-title",
                  children: [/* @__PURE__ */ (0, l.jsx)("span", {
                    className: "episode",
                    children: x.episode
                  }), /* @__PURE__ */ (0, l.jsxs)("div", { children: [/* @__PURE__ */ (0, l.jsxs)("h2", { children: [z ? z.title + " · " + x.episode : x.title, x.archived && /* @__PURE__ */ (0, l.jsx)("span", {
                    className: "status todo",
                    children: "已封存"
                  })] }), /* @__PURE__ */ (0, l.jsxs)("p", { children: [
                    "更新於 ",
                    ci(x.updatedAt),
                    " ",
                    /* @__PURE__ */ (0, l.jsx)("span", { children: "·" }),
                    " 紀錄版本 ",
                    x.revision
                  ] })] })]
                }), /* @__PURE__ */ (0, l.jsxs)("div", {
                  className: "project-progress",
                  children: [/* @__PURE__ */ (0, l.jsxs)("div", { children: [/* @__PURE__ */ (0, l.jsx)("span", { children: "本集製作狀態" }), /* @__PURE__ */ (0, l.jsx)("strong", { children: Ce ? "作者告知已完成" : je?.status === "in_progress" ? "作者告知製作中" : je?.status === "not_started" ? "作者告知尚未開始" : "尚未登記" })] }), /* @__PURE__ */ (0, l.jsx)("small", { children: Ce ? "目前進行資料補登與來源對應" : "依本集作者告知紀錄顯示" })]
                })]
              }),
              N !== "resume" && /* @__PURE__ */ (0, l.jsxs)("details", {
                className: "registration-detail",
                children: [
                  /* @__PURE__ */ (0, l.jsx)("summary", { children: "查看資料登記統計" }),
                  /* @__PURE__ */ (0, l.jsxs)("div", {
                    className: "metrics",
                    children: [
                      /* @__PURE__ */ (0, l.jsxs)("div", { children: [/* @__PURE__ */ (0, l.jsx)("span", {
                        className: "metric-icon green",
                        children: /* @__PURE__ */ (0, l.jsx)(vl, { size: 20 })
                      }), /* @__PURE__ */ (0, l.jsxs)("div", { children: [/* @__PURE__ */ (0, l.jsxs)("b", { children: [Be.acceptedSources, /* @__PURE__ */ (0, l.jsxs)("em", { children: [" / ", Be.sources] })] }), /* @__PURE__ */ (0, l.jsx)("small", { children: "來源已確認收錄" })] })] }),
                      /* @__PURE__ */ (0, l.jsxs)("div", { children: [/* @__PURE__ */ (0, l.jsx)("span", {
                        className: "metric-icon blue",
                        children: /* @__PURE__ */ (0, l.jsx)(Kr, { size: 20 })
                      }), /* @__PURE__ */ (0, l.jsxs)("div", { children: [/* @__PURE__ */ (0, l.jsxs)("b", { children: [Be.linkedShots, /* @__PURE__ */ (0, l.jsxs)("em", { children: [" / ", Be.shots] })] }), /* @__PURE__ */ (0, l.jsx)("small", { children: "鏡頭來源關聯" })] })] }),
                      /* @__PURE__ */ (0, l.jsxs)("div", { children: [/* @__PURE__ */ (0, l.jsx)("span", {
                        className: "metric-icon amber",
                        children: /* @__PURE__ */ (0, l.jsx)(jl, { size: 20 })
                      }), /* @__PURE__ */ (0, l.jsxs)("div", { children: [/* @__PURE__ */ (0, l.jsx)("b", { children: Be.registeredSelections || "待補登" }), /* @__PURE__ */ (0, l.jsx)("small", { children: "實際採用檔紀錄" })] })] }),
                      /* @__PURE__ */ (0, l.jsxs)("div", { children: [/* @__PURE__ */ (0, l.jsx)("span", {
                        className: "metric-icon red",
                        children: /* @__PURE__ */ (0, l.jsx)(oi, { size: 20 })
                      }), /* @__PURE__ */ (0, l.jsxs)("div", { children: [/* @__PURE__ */ (0, l.jsx)("b", { children: ke.length }), /* @__PURE__ */ (0, l.jsx)("small", { children: "已登記退修問題" })] })] })
                    ]
                  }),
                  /* @__PURE__ */ (0, l.jsxs)("details", {
                    className: "registration-detail",
                    children: [/* @__PURE__ */ (0, l.jsx)("summary", { children: "逐項檢視與入片登記" }), /* @__PURE__ */ (0, l.jsxs)("p", { children: [
                      He.approved,
                      " / ",
                      He.total,
                      " 階段已登記逐項核定；",
                      He.inTimeline,
                      " / ",
                      He.shots,
                      " 列鏡頭已登記工程入出點。",
                      Ce ? "本集已按作者告知完成登記；以上為資料紀錄覆蓋情形，不代表製作完成比例。" : "作者告知、逐項檢視與資料收錄分別保存。"
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
              ].includes(N) && /* @__PURE__ */ (0, l.jsx)("nav", {
                className: "section-nav",
                "aria-label": "動畫製作內容",
                children: bt.filter(([m]) => [
                  "main",
                  "op",
                  "ed",
                  "shots",
                  "issues"
                ].includes(m)).map(([m, ye]) => /* @__PURE__ */ (0, l.jsxs)("button", {
                  className: N === m ? "active" : "",
                  "aria-current": N === m ? "page" : void 0,
                  onClick: () => B(m),
                  children: [ye, m === "issues" && ke.length > 0 ? " · " + ke.length : ""]
                }, m))
              }),
              N === "resume" ? /* @__PURE__ */ (0, l.jsx)(Sx, {
                project: x,
                work: z,
                busy: q,
                onNavigate: B,
                onModel: (m) => {
                  he(m), B("models");
                }
              }) : N === "project" ? /* @__PURE__ */ (0, l.jsx)(Tx, {
                work: z,
                episode: x,
                episodes: p,
                busy: q,
                onWorkAction: qe,
                onSelectEpisode: (m) => lt(() => {
                  Me(m);
                }),
                onPin: (m) => ve("pin_shared_reference", { assetId: m }),
                mutate: ve
              }, x.id) : N === "models" ? /* @__PURE__ */ (0, l.jsx)(Ox, {
                initialSelection: ce,
                work: z,
                episode: x,
                episodes: p,
                busy: q,
                onAction: qe,
                onProject: () => B("project"),
                onDirty: Y
              }, (z?.id || x.id) + JSON.stringify(ce)) : N === "settings" ? /* @__PURE__ */ (0, l.jsx)(Rf, {
                project: x,
                busy: q,
                mutate: ve
              }, x.id) : N === "context" ? /* @__PURE__ */ (0, l.jsx)(Cx, {
                project: x,
                mutate: ve,
                busy: q
              }, x.id) : [
                "main",
                "op",
                "ed"
              ].includes(N) ? /* @__PURE__ */ (0, l.jsxs)(l.Fragment, { children: [
                /* @__PURE__ */ (0, l.jsxs)("div", {
                  className: "section-title",
                  children: [
                    /* @__PURE__ */ (0, l.jsx)("h2", { children: N === "main" ? "主線製作流程" : N.toUpperCase() + " 獨立製作支線" }),
                    /* @__PURE__ */ (0, l.jsx)("span", { children: N === "main" ? "每階段留下產出，再進行驗收" : "完成支線後接回全片驗收" }),
                    N !== "main" && /* @__PURE__ */ (0, l.jsxs)("label", {
                      className: "branch-toggle",
                      children: [/* @__PURE__ */ (0, l.jsx)("input", {
                        type: "checkbox",
                        checked: x.branches[N],
                        disabled: q || x.archived,
                        onChange: (m) => {
                          ve("set_branches", {
                            ...x.branches,
                            [N]: m.target.checked
                          });
                        }
                      }), "納入本集"]
                    })
                  ]
                }),
                N !== "main" && !x.branches[N] ? /* @__PURE__ */ (0, l.jsxs)("div", {
                  className: "empty",
                  children: [
                    /* @__PURE__ */ (0, l.jsx)(nn, { size: 30 }),
                    /* @__PURE__ */ (0, l.jsxs)("h3", { children: ["本集未納入 ", N.toUpperCase()] }),
                    /* @__PURE__ */ (0, l.jsx)("p", { children: "重新勾選「納入本集」即可保留並繼續原有紀錄。" })
                  ]
                }) : /* @__PURE__ */ (0, l.jsxs)("div", {
                  className: "flow-layout",
                  children: [/* @__PURE__ */ (0, l.jsxs)("div", {
                    className: "stage-list",
                    children: [M.map((m, ye) => {
                      const Se = x.stages[m.id], st = Ts(x, m.id).length > 0;
                      return /* @__PURE__ */ (0, l.jsxs)("button", {
                        className: "stage-item " + (w === m.id ? "selected" : "") + (Se.author ? " completed" : ""),
                        onClick: () => d(m.id),
                        children: [
                          /* @__PURE__ */ (0, l.jsx)("span", {
                            className: "stage-number " + (Se.author ? "done" : ""),
                            children: Se.author ? /* @__PURE__ */ (0, l.jsx)(Cs, { size: 17 }) : N === "main" ? m.id : String(ye + 1).padStart(2, "0")
                          }),
                          /* @__PURE__ */ (0, l.jsxs)("div", { children: [
                            /* @__PURE__ */ (0, l.jsx)("small", { children: m.phase }),
                            /* @__PURE__ */ (0, l.jsx)("strong", { children: m.title }),
                            /* @__PURE__ */ (0, l.jsx)("span", {
                              className: "stage-label " + (Se.status === "needs_revision" ? "red-text" : ""),
                              children: Ce && !Se.author && Se.status === "todo" ? "已完成 · 待補登" : st && !Se.author ? /* @__PURE__ */ (0, l.jsxs)(l.Fragment, { children: [/* @__PURE__ */ (0, l.jsx)(cd, { size: 11 }), "待前階段核定"] }) : id[Se.status]
                            })
                          ] }),
                          /* @__PURE__ */ (0, l.jsx)(uf, { size: 15 })
                        ]
                      }, m.id);
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
                          children: N === "main" ? "STAGE " + w : N.toUpperCase() + " · " + w.slice(2)
                        }), /* @__PURE__ */ (0, l.jsx)("h2", { children: T.title })] }), /* @__PURE__ */ (0, l.jsx)("span", {
                          className: "status " + we.status,
                          children: Ce && we.status === "todo" ? "已完成 · 明細待補登" : id[we.status]
                        })]
                      }),
                      /* @__PURE__ */ (0, l.jsx)("p", {
                        className: "stage-description",
                        children: T.description
                      }),
                      Dt.length > 0 && /* @__PURE__ */ (0, l.jsxs)("div", {
                        className: "gate-notice",
                        children: [/* @__PURE__ */ (0, l.jsx)(cd, { size: 16 }), /* @__PURE__ */ (0, l.jsxs)("span", { children: [
                          Ce ? "逐項紀錄尚缺：" : "正式核定前，需先完成：",
                          Dt.join("、"),
                          "。可直接補登產出依據。"
                        ] })]
                      }),
                      /* @__PURE__ */ (0, l.jsxs)("div", {
                        className: "output-box",
                        children: [/* @__PURE__ */ (0, l.jsx)(jl, { size: 19 }), /* @__PURE__ */ (0, l.jsxs)("div", { children: [/* @__PURE__ */ (0, l.jsx)("strong", { children: "本階段產出" }), /* @__PURE__ */ (0, l.jsx)("p", { children: T.output })] })]
                      }),
                      $a(x.episodeRules ?? []).filter((m) => !m.stageIds.length || m.stageIds.includes(w)).map((m) => /* @__PURE__ */ (0, l.jsxs)("div", {
                        className: "context-mini",
                        children: [
                          /* @__PURE__ */ (0, l.jsxs)("b", { children: [
                            "本集採用規則 · ",
                            m.title,
                            " v",
                            m.version
                          ] }),
                          /* @__PURE__ */ (0, l.jsx)("p", { children: m.content }),
                          /* @__PURE__ */ (0, l.jsxs)("small", { children: [
                            "場次：",
                            m.sceneIds.join("、") || "全部",
                            " · 來源：",
                            m.source
                          ] })
                        ]
                      }, m.id)),
                      /* @__PURE__ */ (0, l.jsxs)("div", {
                        className: "checklist-heading",
                        children: [/* @__PURE__ */ (0, l.jsx)("h3", { children: Ce ? "逐項檢視紀錄" : "驗收確認" }), /* @__PURE__ */ (0, l.jsxs)("span", { children: [
                          y.filter(Boolean).length,
                          " / ",
                          y.length
                        ] })]
                      }),
                      /* @__PURE__ */ (0, l.jsx)("div", {
                        className: "checklist",
                        children: T.checks.map((m, ye) => /* @__PURE__ */ (0, l.jsxs)("label", {
                          className: y[ye] ? "checked" : "",
                          children: [/* @__PURE__ */ (0, l.jsx)("input", {
                            type: "checkbox",
                            checked: y[ye] || !1,
                            disabled: q || x.archived,
                            onChange: (Se) => {
                              ee((st) => st.map((Fe, wt) => wt === ye ? Se.target.checked : Fe)), Y(!0);
                            }
                          }), /* @__PURE__ */ (0, l.jsx)("span", { children: m })]
                        }, ye))
                      }),
                      /* @__PURE__ */ (0, l.jsxs)("label", {
                        className: "field-label",
                        htmlFor: "evidence",
                        children: [
                          /* @__PURE__ */ (0, l.jsx)(on, { size: 15 }),
                          "產出依據與位置 ",
                          /* @__PURE__ */ (0, l.jsx)("span", { children: "必填" })
                        ]
                      }),
                      /* @__PURE__ */ (0, l.jsx)("textarea", {
                        id: "evidence",
                        rows: 3,
                        placeholder: "貼上成果連結、檔案位置與參考版本；每行一筆。",
                        value: ge,
                        disabled: x.archived,
                        onChange: (m) => {
                          me(m.target.value), Y(!0);
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
                        value: b,
                        disabled: x.archived,
                        onChange: (m) => {
                          ae(m.target.value), Y(!0);
                        }
                      }),
                      /* @__PURE__ */ (0, l.jsxs)("div", {
                        className: "reviews",
                        children: [/* @__PURE__ */ (0, l.jsxs)("div", { children: [/* @__PURE__ */ (0, l.jsxs)("span", {
                          className: "review-title",
                          children: [/* @__PURE__ */ (0, l.jsx)($r, { size: 15 }), "AI 初驗"]
                        }), we.ai ? /* @__PURE__ */ (0, l.jsxs)(l.Fragment, { children: [
                          /* @__PURE__ */ (0, l.jsx)("b", {
                            className: we.ai.verdict === "pass" ? "green-text" : "red-text",
                            children: we.ai.verdict === "pass" ? "初驗通過" : "需修正"
                          }),
                          /* @__PURE__ */ (0, l.jsx)("p", { children: we.ai.note }),
                          /* @__PURE__ */ (0, l.jsxs)("small", { children: [
                            ci(we.ai.at),
                            " · ",
                            we.ai.by
                          ] })
                        ] }) : /* @__PURE__ */ (0, l.jsx)("p", {
                          className: "muted",
                          children: "尚未收到 AI 初驗"
                        })] }), /* @__PURE__ */ (0, l.jsxs)("div", { children: [/* @__PURE__ */ (0, l.jsxs)("span", {
                          className: "review-title",
                          children: [/* @__PURE__ */ (0, l.jsx)(vl, { size: 15 }), "作者正式核定"]
                        }), we.author ? /* @__PURE__ */ (0, l.jsxs)(l.Fragment, { children: [
                          /* @__PURE__ */ (0, l.jsx)("b", {
                            className: "green-text",
                            children: "已核定"
                          }),
                          /* @__PURE__ */ (0, l.jsx)("p", { children: we.author.note || "已確認本階段成果與驗收條件" }),
                          /* @__PURE__ */ (0, l.jsxs)("small", { children: [
                            ci(we.author.at),
                            " · ",
                            we.author.by
                          ] })
                        ] }) : /* @__PURE__ */ (0, l.jsx)("p", {
                          className: "muted",
                          children: Ce ? "作者已告知本集完成；逐項檢視依據尚待補登。" : "尚未登記逐項確認"
                        })] })]
                      }),
                      /* @__PURE__ */ (0, l.jsxs)("div", {
                        className: "detail-actions",
                        children: [/* @__PURE__ */ (0, l.jsxs)("button", {
                          className: "text-btn danger-text",
                          disabled: q || x.archived,
                          onClick: () => {
                            _e({
                              stageId: w,
                              reason: "",
                              shotId: ""
                            }), se("issue");
                          },
                          children: [/* @__PURE__ */ (0, l.jsx)(oi, { size: 15 }), "記錄退修"]
                        }), /* @__PURE__ */ (0, l.jsxs)("div", { children: [/* @__PURE__ */ (0, l.jsxs)("button", {
                          className: "btn",
                          disabled: q || x.archived || !K,
                          onClick: () => {
                            ve("save_stage", {
                              stageId: w,
                              checks: y,
                              evidence: ge,
                              note: b
                            });
                          },
                          children: [
                            q ? /* @__PURE__ */ (0, l.jsx)(Ir, {
                              size: 15,
                              className: "spin"
                            }) : null,
                            "儲存草稿",
                            K ? " *" : ""
                          ]
                        }), /* @__PURE__ */ (0, l.jsxs)("button", {
                          className: "btn primary",
                          disabled: q || x.archived || K || Ze.length > 0 || !!we.author,
                          onClick: () => {
                            ve("approve_stage", {
                              stageId: w,
                              note: "作者已核對產出與全部驗收條件"
                            });
                          },
                          children: [/* @__PURE__ */ (0, l.jsx)(vl, { size: 15 }), we.author ? "已正式核定" : "作者確認通過"]
                        })] })]
                      }),
                      !we.author && /* @__PURE__ */ (0, l.jsx)("div", {
                        className: "gate-reasons",
                        children: Ce ? "本集維持作者告知完成；此處保存逐項檢視依據，不要求重新確認整集。" : K ? "先儲存修改，再確認通過。" : Ze.length ? "待完成：" + Ze.join("；") : "已符合檢查條件，請實際檢視成果後確認通過。"
                      })
                    ]
                  }, w)]
                }),
                N === "main" && /* @__PURE__ */ (0, l.jsxs)("div", {
                  className: "principle",
                  children: [/* @__PURE__ */ (0, l.jsx)(nn, { size: 19 }), /* @__PURE__ */ (0, l.jsxs)("div", { children: [/* @__PURE__ */ (0, l.jsx)("b", { children: "發現問題，就回到造成問題的環節。" }), /* @__PURE__ */ (0, l.jsx)("p", { children: "更新已核定的製作依據時，相關下游階段會標為待修正。AI 初驗與作者核定各自留存。" })] })]
                }),
                /* @__PURE__ */ (0, l.jsxs)("details", {
                  className: "manual-rules",
                  children: [/* @__PURE__ */ (0, l.jsx)("summary", { children: "歷史製作經驗（不作為目前有效設定）" }), /* @__PURE__ */ (0, l.jsxs)("div", {
                    className: "manual-rule-content",
                    children: [
                      /* @__PURE__ */ (0, l.jsx)("h3", { children: "場景定位" }),
                      sn.scenePosition.map((m) => /* @__PURE__ */ (0, l.jsx)("p", { children: m }, m)),
                      /* @__PURE__ */ (0, l.jsx)("h3", { children: "生圖提示詞順序" }),
                      /* @__PURE__ */ (0, l.jsx)("p", { children: sn.imagePrompt }),
                      /* @__PURE__ */ (0, l.jsx)("h3", { children: "影片提示詞順序" }),
                      /* @__PURE__ */ (0, l.jsx)("p", { children: sn.videoPrompt }),
                      /* @__PURE__ */ (0, l.jsx)("h3", { children: "失敗時回查" }),
                      sn.repairs.map((m) => /* @__PURE__ */ (0, l.jsx)("p", { children: m }, m)),
                      /* @__PURE__ */ (0, l.jsx)("h3", { children: "本集專用條件" }),
                      /* @__PURE__ */ (0, l.jsx)("p", { children: "請從「本集規則與採用」取得指定版本；前一集的劇情條件不自動沿用。" }),
                      /* @__PURE__ */ (0, l.jsx)("h3", { children: "素材編號" }),
                      /* @__PURE__ */ (0, l.jsx)("p", { children: "每集保留自己的素材編號與明確對照，不依編號相近猜配。" }),
                      /* @__PURE__ */ (0, l.jsxs)("p", { children: ["後續檔名範例：", sn.filenames.map((m) => m.replace("EP01", x.episode)).join("、")] })
                    ]
                  })]
                })
              ] }) : N === "shots" ? /* @__PURE__ */ (0, l.jsxs)("section", {
                className: "wide-card",
                children: [
                  /* @__PURE__ */ (0, l.jsxs)("div", {
                    className: "section-title",
                    children: [/* @__PURE__ */ (0, l.jsxs)("div", { children: [/* @__PURE__ */ (0, l.jsx)("h2", { children: "製作素材總表" }), /* @__PURE__ */ (0, l.jsx)("p", { children: "依鏡頭串起參考版本、素材位置、舊編號與成片時間。" })] }), /* @__PURE__ */ (0, l.jsxs)("button", {
                      className: "btn primary",
                      disabled: x.archived,
                      onClick: () => {
                        _e({}), se("shot");
                      },
                      children: [/* @__PURE__ */ (0, l.jsx)(Ft, { size: 16 }), "新增鏡頭"]
                    })]
                  }),
                  /* @__PURE__ */ (0, l.jsxs)("div", {
                    className: "search",
                    children: [/* @__PURE__ */ (0, l.jsx)(fd, { size: 16 }), /* @__PURE__ */ (0, l.jsx)("input", {
                      "aria-label": "搜尋鏡頭",
                      placeholder: "搜尋場次、鏡頭 ID 或舊編號…",
                      value: o,
                      onChange: (m) => j(m.target.value)
                    })]
                  }),
                  x.shots.length ? /* @__PURE__ */ (0, l.jsx)("div", {
                    className: "table-scroll",
                    children: /* @__PURE__ */ (0, l.jsxs)("table", { children: [/* @__PURE__ */ (0, l.jsx)("thead", { children: /* @__PURE__ */ (0, l.jsxs)("tr", { children: [
                      /* @__PURE__ */ (0, l.jsx)("th", { children: "鏡頭／場次" }),
                      /* @__PURE__ */ (0, l.jsx)("th", { children: "內容與編號對照" }),
                      /* @__PURE__ */ (0, l.jsx)("th", { children: "參考版本" }),
                      /* @__PURE__ */ (0, l.jsx)("th", { children: "採用／剪輯版本" }),
                      /* @__PURE__ */ (0, l.jsx)("th", { children: "狀態" }),
                      /* @__PURE__ */ (0, l.jsx)("th", { children: "操作" })
                    ] }) }), /* @__PURE__ */ (0, l.jsx)("tbody", { children: x.shots.filter((m) => [
                      m.id,
                      m.scene,
                      m.description,
                      m.legacyIds
                    ].join(" ").includes(o)).map((m) => /* @__PURE__ */ (0, l.jsxs)("tr", { children: [
                      /* @__PURE__ */ (0, l.jsxs)("td", { children: [/* @__PURE__ */ (0, l.jsx)("b", { children: m.id }), /* @__PURE__ */ (0, l.jsx)("small", { children: m.scene })] }),
                      /* @__PURE__ */ (0, l.jsxs)("td", { children: [m.description, /* @__PURE__ */ (0, l.jsxs)("small", { children: [
                        m.legacyIds || "未填舊編號",
                        " · ",
                        m.versions.length + 1,
                        " 次紀錄"
                      ] })] }),
                      /* @__PURE__ */ (0, l.jsxs)("td", { children: [/* @__PURE__ */ (0, l.jsxs)("small", { children: ["劇本 ", m.scriptVersion || "—"] }), /* @__PURE__ */ (0, l.jsxs)("small", { children: [
                        "角色 ",
                        m.characterVersion || "—",
                        "／場景 ",
                        m.sceneVersion || "—"
                      ] })] }),
                      /* @__PURE__ */ (0, l.jsxs)("td", { children: [m.adoptedVersion || "尚未採用", /* @__PURE__ */ (0, l.jsxs)("small", { children: [
                        m.editorVersion || "—",
                        " · ",
                        m.inPoint || "—",
                        " → ",
                        m.outPoint || "—"
                      ] })] }),
                      /* @__PURE__ */ (0, l.jsx)("td", { children: /* @__PURE__ */ (0, l.jsx)("span", {
                        className: "status " + m.status,
                        children: id[m.status]
                      }) }),
                      /* @__PURE__ */ (0, l.jsx)("td", { children: /* @__PURE__ */ (0, l.jsxs)("div", {
                        className: "table-actions",
                        children: [/* @__PURE__ */ (0, l.jsx)("button", {
                          className: "text-btn",
                          disabled: x.archived,
                          onClick: () => {
                            _e(Object.fromEntries(Nf.map(([ye]) => [ye, m[ye]]))), se("shot");
                          },
                          children: "查看／編輯"
                        }), m.author ? m.status !== "in_timeline" ? /* @__PURE__ */ (0, l.jsx)("button", {
                          className: "text-btn",
                          disabled: q || x.archived,
                          onClick: () => {
                            ve("timeline_shot", { shotId: m.id });
                          },
                          children: "確認已入片"
                        }) : null : /* @__PURE__ */ (0, l.jsx)("button", {
                          className: "text-btn",
                          disabled: q || x.archived,
                          onClick: () => {
                            ve("approve_shot", { shotId: m.id });
                          },
                          children: "核定素材"
                        })]
                      }) })
                    ] }, m.id)) })] })
                  }) : /* @__PURE__ */ (0, l.jsxs)("div", {
                    className: "empty",
                    children: [
                      /* @__PURE__ */ (0, l.jsx)(Kr, { size: 32 }),
                      /* @__PURE__ */ (0, l.jsx)("h3", { children: "先建立一個實際鏡頭" }),
                      /* @__PURE__ */ (0, l.jsx)("p", { children: "不同來源的鏡號與素材編號填入對照欄，保留原始名稱。" })
                    ]
                  }),
                  /* @__PURE__ */ (0, l.jsx)("div", {
                    className: "inline-note",
                    children: "新版本會保留前次紀錄；填寫檔案位置不會上傳或覆寫原始素材。鏡頭更新後須重新核定。"
                  })
                ]
              }) : N === "issues" ? /* @__PURE__ */ (0, l.jsxs)("section", {
                className: "wide-card",
                children: [/* @__PURE__ */ (0, l.jsxs)("div", {
                  className: "section-title",
                  children: [/* @__PURE__ */ (0, l.jsxs)("div", { children: [/* @__PURE__ */ (0, l.jsx)("h2", { children: "退修與複核" }), /* @__PURE__ */ (0, l.jsx)("p", { children: "保留原因、受影響階段及修正結果。" })] }), /* @__PURE__ */ (0, l.jsxs)("button", {
                    className: "btn",
                    disabled: x.archived,
                    onClick: () => {
                      _e({
                        stageId: "08",
                        reason: "",
                        shotId: ""
                      }), se("issue");
                    },
                    children: [/* @__PURE__ */ (0, l.jsx)(Ft, { size: 16 }), "新增問題"]
                  })]
                }), x.issues.length ? /* @__PURE__ */ (0, l.jsx)("div", {
                  className: "issue-list",
                  children: [...x.issues].reverse().map((m) => /* @__PURE__ */ (0, l.jsxs)("article", {
                    className: "issue-card",
                    children: [
                      /* @__PURE__ */ (0, l.jsxs)("div", {
                        className: "issue-top",
                        children: [
                          /* @__PURE__ */ (0, l.jsx)("span", {
                            className: "status " + (m.status === "open" ? "needs_revision" : "passed"),
                            children: m.status === "open" ? "待修正" : "已複核結案"
                          }),
                          /* @__PURE__ */ (0, l.jsxs)("b", { children: [
                            m.stageId,
                            " ",
                            Pt.find((ye) => ye.id === m.stageId)?.title,
                            " ",
                            m.shotId ? "／" + m.shotId : ""
                          ] }),
                          /* @__PURE__ */ (0, l.jsx)("time", { children: ci(m.at) })
                        ]
                      }),
                      /* @__PURE__ */ (0, l.jsx)("p", { children: m.reason }),
                      /* @__PURE__ */ (0, l.jsx)("small", { children: m.by }),
                      m.resolution && /* @__PURE__ */ (0, l.jsxs)("div", {
                        className: "resolution",
                        children: [/* @__PURE__ */ (0, l.jsx)(Cs, { size: 15 }), m.resolution]
                      }),
                      m.status === "open" && /* @__PURE__ */ (0, l.jsx)("button", {
                        className: "btn",
                        disabled: x.archived,
                        onClick: () => {
                          _e({
                            issueId: m.id,
                            resolution: ""
                          }), se("resolve");
                        },
                        children: "填寫修正並複核"
                      })
                    ]
                  }, m.id))
                }) : /* @__PURE__ */ (0, l.jsxs)("div", {
                  className: "empty",
                  children: [
                    /* @__PURE__ */ (0, l.jsx)(Cs, { size: 32 }),
                    /* @__PURE__ */ (0, l.jsx)("h3", { children: "目前沒有退修問題" }),
                    /* @__PURE__ */ (0, l.jsx)("p", { children: "發現問題時，請指定造成問題的階段。" })
                  ]
                })]
              }) : N === "chatgpt" ? /* @__PURE__ */ (0, l.jsx)(Nx, {
                project: x,
                check: () => Xe("")
              }) : /* @__PURE__ */ (0, l.jsxs)("section", {
                className: "wide-card",
                children: [/* @__PURE__ */ (0, l.jsxs)("div", {
                  className: "section-title",
                  children: [/* @__PURE__ */ (0, l.jsxs)("div", { children: [/* @__PURE__ */ (0, l.jsx)("h2", { children: "製作異動紀錄" }), /* @__PURE__ */ (0, l.jsx)("p", { children: "作者與 ChatGPT 的更新分別標記，依時間保留。" })] }), /* @__PURE__ */ (0, l.jsxs)("span", {
                    className: "muted",
                    children: [x.audit.length, " 筆"]
                  })]
                }), /* @__PURE__ */ (0, l.jsx)("div", {
                  className: "audit-list",
                  children: [...x.audit].reverse().map((m, ye) => /* @__PURE__ */ (0, l.jsxs)("div", { children: [
                    /* @__PURE__ */ (0, l.jsx)("span", {
                      className: "audit-icon " + (m.actor === "ai" ? "ai" : ""),
                      children: m.actor === "ai" ? /* @__PURE__ */ (0, l.jsx)($r, { size: 17 }) : /* @__PURE__ */ (0, l.jsx)(vl, { size: 17 })
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
                      }[m.action] || m.action,
                      " ",
                      /* @__PURE__ */ (0, l.jsx)("span", { children: m.detail })
                    ] }), /* @__PURE__ */ (0, l.jsx)("small", { children: m.by })] }),
                    /* @__PURE__ */ (0, l.jsx)("time", { children: ci(m.at) })
                  ] }, ye))
                })]
              })
            ] }) : /* @__PURE__ */ (0, l.jsxs)("div", {
              className: "onboarding",
              children: [
                /* @__PURE__ */ (0, l.jsx)("div", {
                  className: "onboarding-icon",
                  children: /* @__PURE__ */ (0, l.jsx)(ui, { size: 34 })
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
                    _e({
                      title: "現實遊戲",
                      episode: "EP01"
                    }), se("create");
                  },
                  children: [/* @__PURE__ */ (0, l.jsx)(Ft, { size: 17 }), "建立第一個製作專案"]
                }),
                /* @__PURE__ */ (0, l.jsx)("div", {
                  className: "onboarding-grid",
                  children: Pt.filter((m) => m.group === "main").map((m) => /* @__PURE__ */ (0, l.jsxs)("div", { children: [/* @__PURE__ */ (0, l.jsx)("span", { children: m.id }), m.title] }, m.id))
                }),
                /* @__PURE__ */ (0, l.jsx)("small", { children: "建立時全部階段為待製作；請依實際成果補入完成紀錄。" })
              ]
            }),
            /* @__PURE__ */ (0, l.jsxs)("footer", { children: ["製作工作台 ", /* @__PURE__ */ (0, l.jsx)("span", { children: "工作紀錄自動保存版本 · v5.0" })] })
          ]
        })]
      }),
      $ && /* @__PURE__ */ (0, l.jsxs)("div", {
        className: "toast",
        role: "status",
        children: [/* @__PURE__ */ (0, l.jsx)(Cs, { size: 17 }), $]
      }),
      Q && /* @__PURE__ */ (0, l.jsx)("div", {
        className: "modal-backdrop",
        onMouseDown: (m) => {
          m.target === m.currentTarget && !q && se(null);
        },
        children: /* @__PURE__ */ (0, l.jsxs)("section", {
          className: "modal " + (Q === "shot" ? "large" : ""),
          role: "dialog",
          "aria-modal": "true",
          "aria-label": Q === "create" ? "建立製作專案" : Q === "shot" ? "鏡頭素材紀錄" : "製作確認",
          children: [/* @__PURE__ */ (0, l.jsxs)("div", {
            className: "modal-head",
            children: [/* @__PURE__ */ (0, l.jsx)("h2", { children: Q === "create" ? "建立製作專案" : Q === "shot" ? "鏡頭素材紀錄" : Q === "issue" ? "記錄退修問題" : Q === "resolve" ? "修正與複核結果" : x?.archived ? "還原專案" : "封存專案" }), /* @__PURE__ */ (0, l.jsx)("button", {
              className: "icon-btn",
              "aria-label": "關閉視窗",
              disabled: q,
              onClick: () => se(null),
              children: /* @__PURE__ */ (0, l.jsx)(Sl, { size: 21 })
            })]
          }), /* @__PURE__ */ (0, l.jsxs)("form", {
            onSubmit: ue,
            children: [
              Q === "create" ? /* @__PURE__ */ (0, l.jsxs)(l.Fragment, { children: [/* @__PURE__ */ (0, l.jsx)("p", {
                className: "muted",
                children: "依手冊建立完整流程，從待製作開始記錄。"
              }), [["title", "專案名稱"], ["episode", "集數"]].map(([m, ye]) => /* @__PURE__ */ (0, l.jsxs)("label", {
                className: "form-field",
                children: [ye, /* @__PURE__ */ (0, l.jsx)("input", {
                  required: !0,
                  maxLength: m === "title" ? 200 : 60,
                  value: re[m] || "",
                  onChange: (Se) => _e({
                    ...re,
                    [m]: Se.target.value
                  })
                })]
              }, m))] }) : Q === "shot" ? /* @__PURE__ */ (0, l.jsxs)(l.Fragment, { children: [
                /* @__PURE__ */ (0, l.jsx)("p", {
                  className: "muted",
                  children: "修改既有鏡頭請使用相同 ID。系統保留前次紀錄，並要求重新驗收。"
                }),
                /* @__PURE__ */ (0, l.jsx)("div", {
                  className: "shot-form",
                  children: Nf.map(([m, ye]) => /* @__PURE__ */ (0, l.jsxs)("label", {
                    className: "form-field",
                    children: [ye, /* @__PURE__ */ (0, l.jsx)("input", {
                      required: [
                        "id",
                        "scene",
                        "description"
                      ].includes(m),
                      maxLength: m === "id" ? 100 : 12e3,
                      value: re[m] || "",
                      placeholder: m === "id" ? "如 EP01_S06_SH03" : "",
                      onChange: (Se) => _e({
                        ...re,
                        [m]: Se.target.value
                      })
                    })]
                  }, m))
                }),
                x?.shots.find((m) => m.id === re.id)?.versions.length ? /* @__PURE__ */ (0, l.jsxs)("details", { children: [/* @__PURE__ */ (0, l.jsx)("summary", { children: "查看保留的舊版本" }), x.shots.find((m) => m.id === re.id).versions.map((m, ye) => /* @__PURE__ */ (0, l.jsxs)("pre", { children: [
                  ci(m.at),
                  " · ",
                  m.by,
                  `
`,
                  JSON.stringify(m.data, null, 2)
                ] }, ye))] }) : null
              ] }) : Q === "issue" ? /* @__PURE__ */ (0, l.jsxs)(l.Fragment, { children: [
                /* @__PURE__ */ (0, l.jsxs)("label", {
                  className: "form-field",
                  children: ["回查階段", /* @__PURE__ */ (0, l.jsx)("select", {
                    value: re.stageId || "08",
                    onChange: (m) => _e({
                      ...re,
                      stageId: m.target.value
                    }),
                    children: Ds(x).map((m) => /* @__PURE__ */ (0, l.jsxs)("option", {
                      value: m.id,
                      children: [
                        m.id,
                        " ",
                        m.title
                      ]
                    }, m.id))
                  })]
                }),
                /* @__PURE__ */ (0, l.jsxs)("label", {
                  className: "form-field",
                  children: ["受影響鏡頭（選填）", /* @__PURE__ */ (0, l.jsxs)("select", {
                    value: re.shotId || "",
                    onChange: (m) => _e({
                      ...re,
                      shotId: m.target.value
                    }),
                    children: [/* @__PURE__ */ (0, l.jsx)("option", {
                      value: "",
                      children: "整個階段"
                    }), x.shots.map((m) => /* @__PURE__ */ (0, l.jsx)("option", { children: m.id }, m.id))]
                  })]
                }),
                /* @__PURE__ */ (0, l.jsxs)("label", {
                  className: "form-field",
                  children: ["具體問題與回查原因", /* @__PURE__ */ (0, l.jsx)("textarea", {
                    required: !0,
                    rows: 5,
                    value: re.reason || "",
                    onChange: (m) => _e({
                      ...re,
                      reason: m.target.value
                    })
                  })]
                }),
                /* @__PURE__ */ (0, l.jsx)("p", {
                  className: "muted",
                  children: "此階段與受影響的下游核定將標為待修正，修正後重新驗收。"
                })
              ] }) : Q === "resolve" ? /* @__PURE__ */ (0, l.jsxs)("label", {
                className: "form-field",
                children: ["已修正內容與複核依據", /* @__PURE__ */ (0, l.jsx)("textarea", {
                  required: !0,
                  rows: 6,
                  value: re.resolution || "",
                  onChange: (m) => _e({
                    ...re,
                    resolution: m.target.value
                  })
                })]
              }) : /* @__PURE__ */ (0, l.jsxs)("p", { children: ["專案", x?.archived ? "還原後可繼續製作。" : "封存後會保留全部進度與紀錄，可隨時還原。"] }),
              H && /* @__PURE__ */ (0, l.jsx)("div", {
                className: "modal-error",
                role: "alert",
                children: H
              }),
              /* @__PURE__ */ (0, l.jsxs)("div", {
                className: "modal-actions",
                children: [/* @__PURE__ */ (0, l.jsx)("button", {
                  type: "button",
                  className: "btn",
                  disabled: q,
                  onClick: () => se(null),
                  children: "取消"
                }), /* @__PURE__ */ (0, l.jsxs)("button", {
                  type: "submit",
                  className: "btn primary",
                  disabled: q,
                  children: [q ? /* @__PURE__ */ (0, l.jsx)(Ir, {
                    className: "spin",
                    size: 16
                  }) : null, Q === "create" ? "建立專案" : Q === "archive" ? x?.archived ? "還原專案" : "確認封存" : "儲存紀錄"]
                })]
              })
            ]
          })]
        })
      })
    ]
  });
}
var bl = {
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
function wf(r) {
  return new URL(r, new URL("./", window.location.href)).href;
}
function Rx(r) {
  const h = r.split(/\r?\n/), C = [];
  let f = !1, p = [];
  for (let k = 0; k < h.length; k++) {
    const x = h[k].trimEnd(), A = x.trim();
    if (A.startsWith("```")) {
      f && (C.push(/* @__PURE__ */ (0, l.jsx)("pre", {
        className: "essentials-code",
        children: p.join(`
`)
      }, "code" + k)), p = []), f = !f;
      continue;
    }
    if (f) {
      p.push(x);
      continue;
    }
    if (!A) continue;
    if (/^---+$/.test(A)) {
      C.push(/* @__PURE__ */ (0, l.jsx)("hr", {}, k));
      continue;
    }
    const N = A.match(/^(#{1,3})\s+(.+)$/);
    if (N) {
      const G = N[2];
      C.push(N[1].length === 1 ? /* @__PURE__ */ (0, l.jsx)("h2", { children: G }, k) : N[1].length === 2 ? /* @__PURE__ */ (0, l.jsx)("h3", { children: G }, k) : /* @__PURE__ */ (0, l.jsx)("h4", { children: G }, k));
      continue;
    }
    if (A.startsWith("|")) {
      let G = [x], z = k + 1;
      for (; z < h.length && h[z].trim().startsWith("|"); ) G.push(h[z++]);
      C.push(/* @__PURE__ */ (0, l.jsx)("pre", {
        className: "essentials-code",
        children: G.join(`
`)
      }, k)), k = z - 1;
      continue;
    }
    if (A.startsWith(">")) {
      C.push(/* @__PURE__ */ (0, l.jsx)("blockquote", { children: A.replace(/^>\s?/, "") }, k));
      continue;
    }
    const _ = A.match(/^[-*]\s+(.+)$/), w = A.match(/^(\d+)\.\s+(.+)$/);
    if (_ || w) {
      C.push(/* @__PURE__ */ (0, l.jsxs)("p", {
        className: "essentials-list",
        children: [w ? w[1] + ". " : "• ", _ ? _[1] : w?.[2]]
      }, k));
      continue;
    }
    C.push(/* @__PURE__ */ (0, l.jsx)("p", { children: A }, k));
  }
  return C;
}
function Lx() {
  const [r, h] = (0, g.useState)("handbook"), [C, f] = (0, g.useState)({}), [p, k] = (0, g.useState)({});
  (0, g.useEffect)(() => {
    const A = new AbortController();
    return Object.keys(bl).forEach(async (N) => {
      try {
        const _ = await fetch(wf(bl[N].path), {
          credentials: "same-origin",
          cache: "no-store",
          signal: A.signal
        });
        if (!_.ok) throw new Error("HTTP " + _.status);
        const w = await _.text();
        if (!w.includes(N === "handbook" ? "LIZHI-AI-RULES" : "LIZHI-APP-INTAKE")) throw new Error("文件版本或內容不符");
        A.signal.aborted || f((G) => ({
          ...G,
          [N]: w
        }));
      } catch (_) {
        A.signal.aborted || k((w) => ({
          ...w,
          [N]: "目前無法載入全文（" + _.message + "），請使用下方原始文件連結。"
        }));
      }
    }), () => A.abort();
  }, []);
  const x = bl[r];
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
        children: Object.keys(bl).map((A) => /* @__PURE__ */ (0, l.jsxs)("button", {
          type: "button",
          className: "essentials-card " + (r === A ? "selected" : ""),
          onClick: () => h(A),
          "aria-pressed": r === A,
          children: [A === "handbook" ? /* @__PURE__ */ (0, l.jsx)(vl, { size: 23 }) : /* @__PURE__ */ (0, l.jsx)(vm, { size: 23 }), /* @__PURE__ */ (0, l.jsxs)("span", { children: [/* @__PURE__ */ (0, l.jsx)("b", { children: bl[A].title }), /* @__PURE__ */ (0, l.jsxs)("small", { children: [
            bl[A].version,
            " · ",
            bl[A].summary
          ] })] })]
        }, A))
      }),
      /* @__PURE__ */ (0, l.jsxs)("article", {
        className: "wide-card essentials-document",
        children: [
          /* @__PURE__ */ (0, l.jsxs)("div", {
            className: "section-title",
            children: [/* @__PURE__ */ (0, l.jsxs)("div", { children: [/* @__PURE__ */ (0, l.jsxs)("h2", { children: [/* @__PURE__ */ (0, l.jsx)(pm, { size: 19 }), x.title] }), /* @__PURE__ */ (0, l.jsxs)("p", { children: [
              "文件編號：",
              r === "handbook" ? "LIZHI-AI-RULES" : "LIZHI-APP-INTAKE",
              " · ",
              x.version
            ] })] }), /* @__PURE__ */ (0, l.jsxs)("a", {
              className: "btn",
              href: wf(x.path),
              target: "_blank",
              rel: "noopener noreferrer",
              children: [/* @__PURE__ */ (0, l.jsx)(Cm, { size: 14 }), "開啟原始文件"]
            })]
          }),
          /* @__PURE__ */ (0, l.jsx)("div", {
            className: "essentials-highlights",
            children: x.highlights.map((A) => /* @__PURE__ */ (0, l.jsxs)("p", { children: ["✓ ", A] }, A))
          }),
          p[r] && /* @__PURE__ */ (0, l.jsx)("p", {
            role: "status",
            className: "essentials-warning",
            children: p[r]
          }),
          C[r] ? /* @__PURE__ */ (0, l.jsx)("div", {
            className: "essentials-fulltext",
            children: Rx(C[r])
          }) : !p[r] && /* @__PURE__ */ (0, l.jsx)("p", {
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
async function qx(r, h = () => window.open("about:blank", "_blank")) {
  const C = h();
  if (!C) throw Error("瀏覽器阻擋了原圖視窗，請允許此網站開啟新視窗後再試。");
  C.opener = null;
  try {
    C.location.replace(await r());
  } catch (f) {
    throw C.close(), f;
  }
}
function Hx(r, h = 15e3) {
  return new Promise((C, f) => {
    const p = setTimeout(() => f(Error("圖片讀取逾時，請按重試")), h);
    Promise.resolve().then(r).then(C, f).finally(() => clearTimeout(p));
  });
}
function Bx(r, h = Date.now, C = 15e3) {
  const f = /* @__PURE__ */ new Map(), p = /* @__PURE__ */ new Map(), k = /* @__PURE__ */ new Map();
  let x = !1;
  async function A() {
    if (!x) {
      x = !0;
      try {
        for (; p.size; ) {
          const N = [...p.entries()].slice(0, 50);
          for (const [_] of N) p.delete(_);
          try {
            const _ = await Hx(() => r(N.map(([G]) => G)), C), w = new Map(_.urls.map((G) => [G.imageId, G.url]));
            for (const [G, z] of N) {
              const le = w.get(G);
              if (!le) {
                for (const ne of z) ne.reject(Error("圖片連結未取得，請重試"));
                continue;
              }
              f.set(G, {
                url: le,
                until: h() + Math.max(0, _.expiresIn - 30) * 1e3
              });
              for (const ne of z) ne.resolve(le);
            }
          } catch (_) {
            for (const [, w] of N) for (const G of w) G.reject(_);
          }
        }
      } finally {
        x = !1;
      }
    }
  }
  return { get(N, _ = !1) {
    _ && f.delete(N);
    const w = f.get(N);
    if (w && w.until > h()) return Promise.resolve(w.url);
    const G = k.get(N);
    if (G) return G;
    const z = new Promise((ne, I) => {
      p.set(N, [{
        resolve: ne,
        reject: I
      }]), queueMicrotask(() => {
        A();
      });
    });
    k.set(N, z);
    const le = () => k.delete(N);
    return z.then(le, le), z;
  } };
}
var As = {
  animation: "動畫製作",
  model: "3D 模型",
  software: "軟體開發",
  general: "一般專案"
}, zf = [
  "PLANNED",
  "IN_PROGRESS",
  "PASS",
  "FAIL",
  "BLOCKED",
  "NOT_TESTED"
], Px = 10 * 1024 * 1024, qf = [
  "image/jpeg",
  "image/png",
  "image/webp"
], Gx = [
  ...qf,
  "image/svg+xml",
  "application/pdf"
];
function Yx({ image: r, access: h, onEdit: C, onTrash: f, disabled: p, record: k }) {
  const [x, A] = (0, g.useState)(""), [N, _] = (0, g.useState)(""), [w, G] = (0, g.useState)(!1), [z, le] = (0, g.useState)(0), [ne, I] = (0, g.useState)(!1), [X, oe] = (0, g.useState)(!1), q = (0, g.useRef)(null);
  (0, g.useEffect)(() => {
    const H = q.current;
    if (!H) return;
    if (typeof IntersectionObserver > "u") {
      I(!0);
      return;
    }
    const F = new IntersectionObserver(($) => {
      $.some((pe) => pe.isIntersecting) && (I(!0), F.disconnect());
    }, { rootMargin: "300px" });
    return F.observe(H), () => F.disconnect();
  }, []), (0, g.useEffect)(() => {
    if (!ne) return;
    let H = !0;
    return _(""), A(""), oe(!1), h(r.id, z > 0).then((F) => {
      H && A(F);
    }).catch((F) => {
      H && _(F.message);
    }), () => {
      H = !1;
    };
  }, [
    r.id,
    h,
    z,
    ne
  ]), (0, g.useEffect)(() => {
    if (!x || X || N) return;
    const H = setTimeout(() => _("圖片載入逾時，請按重試"), 2e4);
    return () => clearTimeout(H);
  }, [
    x,
    X,
    N
  ]);
  async function ie(H = !1) {
    G(!0), _("");
    try {
      if (!H) {
        await qx(() => h(r.id));
        return;
      }
      const F = await h(r.id), $ = await fetch(F, { signal: AbortSignal.timeout(2e4) });
      if (!$.ok) throw Error("原圖下載失敗");
      const pe = URL.createObjectURL(await $.blob()), te = document.createElement("a");
      te.href = pe, te.download = r.name, te.click(), setTimeout(() => URL.revokeObjectURL(pe), 1e3);
    } catch (F) {
      _(F.message);
    } finally {
      G(!1);
    }
  }
  return /* @__PURE__ */ (0, l.jsxs)("article", {
    ref: q,
    className: "project-image-card",
    children: [/* @__PURE__ */ (0, l.jsx)("button", {
      className: "project-image-preview",
      disabled: !x || !!N || w,
      onClick: () => {
        ie();
      },
      "aria-label": "查看原圖：" + r.name,
      children: x && !N ? /* @__PURE__ */ (0, l.jsx)("img", {
        src: x,
        alt: r.description || r.name,
        onLoad: () => oe(!0),
        onError: () => _("圖片連結失效或載入失敗，請按重試")
      }) : /* @__PURE__ */ (0, l.jsx)("span", { children: N ? "圖片暫時無法顯示" : ne ? "讀取圖片…" : "捲動至此處載入圖片" })
    }), /* @__PURE__ */ (0, l.jsxs)("div", {
      className: "project-image-info",
      children: [
        /* @__PURE__ */ (0, l.jsx)("b", { children: r.name }),
        /* @__PURE__ */ (0, l.jsx)("p", { children: r.description || "尚未填寫說明" }),
        r.recordId && /* @__PURE__ */ (0, l.jsxs)("small", { children: [/* @__PURE__ */ (0, l.jsx)(on, { size: 12 }), k ? "紀錄：" + k.summary : "原連結紀錄目前未列於此版本"] }),
        /* @__PURE__ */ (0, l.jsxs)("small", { children: [
          (r.size / 1024 / 1024).toFixed(2),
          " MB · ",
          new Date(r.at).toLocaleDateString("zh-TW", { timeZone: "Asia/Taipei" })
        ] }),
        N && /* @__PURE__ */ (0, l.jsxs)("div", {
          role: "alert",
          className: "image-load-error",
          children: [/* @__PURE__ */ (0, l.jsx)("p", { children: N }), /* @__PURE__ */ (0, l.jsxs)("button", {
            className: "btn",
            disabled: w,
            onClick: () => {
              I(!0), le((H) => H + 1);
            },
            children: [/* @__PURE__ */ (0, l.jsx)(Wa, { size: 15 }), "重試這張圖片"]
          })]
        }),
        /* @__PURE__ */ (0, l.jsxs)("div", {
          className: "project-image-actions",
          children: [
            /* @__PURE__ */ (0, l.jsx)("button", {
              className: "text-btn",
              disabled: p,
              onClick: C,
              children: "說明／連結紀錄"
            }),
            /* @__PURE__ */ (0, l.jsx)("button", {
              className: "icon-btn",
              disabled: w,
              onClick: () => {
                ie(!0);
              },
              "aria-label": "下載：" + r.name,
              children: /* @__PURE__ */ (0, l.jsx)(dn, { size: 16 })
            }),
            /* @__PURE__ */ (0, l.jsx)("button", {
              className: "icon-btn danger",
              disabled: w || p,
              onClick: f,
              "aria-label": "刪除圖片：" + r.name,
              children: /* @__PURE__ */ (0, l.jsx)(yl, { size: 16 })
            })
          ]
        })
      ]
    })]
  });
}
function Vx({ project: r, transport: h, onTrash: C, onSaved: f, onDirty: p, onBusy: k, recordFilter: x }) {
  const [A, N] = (0, g.useState)(!1), [_, w] = (0, g.useState)([]), [G, z] = (0, g.useState)(""), [le, ne] = (0, g.useState)(x ?? ""), [I, X] = (0, g.useState)(""), [oe, q] = (0, g.useState)(""), [ie, H] = (0, g.useState)(""), [F, $] = (0, g.useState)(!1), [pe, te] = (0, g.useState)(0), [P, y] = (0, g.useState)(null), [ee, ge] = (0, g.useState)(x ?? ""), me = (0, g.useRef)(null), b = (0, g.useRef)(r.revision);
  (0, g.useEffect)(() => {
    b.current = r.revision;
  }, [r.revision]), (0, g.useEffect)(() => (p(A || !!P), () => p(!1)), [
    A,
    P,
    p
  ]), (0, g.useEffect)(() => {
    if (!A && !P) return;
    const j = (R) => R.preventDefault();
    return window.addEventListener("beforeunload", j), () => window.removeEventListener("beforeunload", j);
  }, [A, P]);
  const ae = (0, g.useCallback)(async (j, R) => {
    const W = h ? await h("images", j, R) : await fetch("/api/images" + j, {
      cache: "no-store",
      ...R ? {
        method: "POST",
        ...R instanceof FormData ? { body: R } : {
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(R)
        }
      } : {}
    }), ce = await W.json();
    if (!W.ok) throw Error(ce.error || "圖片操作失敗");
    return ce;
  }, [h]), K = (0, g.useMemo)(() => Bx((j) => ae("?" + new URLSearchParams({
    projectId: r.id,
    imageIds: j.join(",")
  }))), [
    ae,
    r.id,
    pe
  ]), Y = (0, g.useCallback)((j, R = !1) => K.get(j, R), [K]);
  function Q(j) {
    if (!j) return;
    q("");
    const R = [];
    for (const W of Array.from(j)) {
      if (!qf.includes(W.type)) {
        q("只接受 JPG、PNG、WebP；其他格式請先轉換。");
        continue;
      }
      if (!W.size || W.size > 10485760) {
        q("每張圖片上限 10 MB；過大的圖片未加入。");
        continue;
      }
      R.push({
        file: W,
        key: crypto.randomUUID(),
        status: "waiting",
        error: ""
      });
    }
    w((W) => [...W, ...R]);
  }
  async function se() {
    $(!0), k(!0), q("");
    let j = !1;
    try {
      for (const R of _.filter((W) => W.status !== "saved")) {
        w((ce) => ce.map((he) => he.key === R.key ? {
          ...he,
          status: "uploading",
          error: ""
        } : he));
        const W = new FormData();
        for (const [ce, he] of Object.entries({
          projectId: r.id,
          revision: String(b.current),
          key: R.key,
          description: G,
          recordId: le,
          stageId: I
        })) W.set(ce, he);
        W.set("file", R.file, R.file.name);
        try {
          const ce = await ae("", W);
          b.current = ce.revision, f(ce), w((he) => he.map((de) => de.key === R.key ? {
            ...de,
            status: "saved"
          } : de));
        } catch (ce) {
          j = !0, w((he) => he.map((de) => de.key === R.key ? {
            ...de,
            status: "failed",
            error: ce.message
          } : de)), q(ce.message);
          break;
        }
      }
      j || (H("圖片已存入此專案"), N(!1), w([]), z(""), te((R) => R + 1));
    } finally {
      $(!1), k(!1);
    }
  }
  async function re(j) {
    if (j.preventDefault(), !!P) {
      $(!0), k(!0), q("");
      try {
        f(await ae("", {
          action: "update",
          projectId: r.id,
          revision: r.revision,
          key: crypto.randomUUID(),
          imageId: P.id,
          description: G,
          recordId: le,
          stageId: I
        })), y(null), H("圖片說明與紀錄連結已保存");
      } catch (R) {
        q(R.message);
      } finally {
        $(!1), k(!1);
      }
    }
  }
  const _e = /* @__PURE__ */ (0, l.jsxs)(l.Fragment, { children: [/* @__PURE__ */ (0, l.jsx)("option", {
    value: "",
    children: "不連結紀錄"
  }), [...r.records].reverse().map((j) => /* @__PURE__ */ (0, l.jsx)("option", {
    value: j.id,
    children: j.summary.slice(0, 85)
  }, j.id))] }), o = r.images.filter((j) => !ee || j.recordId === ee);
  return /* @__PURE__ */ (0, l.jsxs)("section", {
    className: "wide-card project-images",
    children: [
      /* @__PURE__ */ (0, l.jsxs)("div", {
        className: "section-title",
        children: [/* @__PURE__ */ (0, l.jsxs)("div", { children: [/* @__PURE__ */ (0, l.jsx)("h2", { children: "專案圖片" }), /* @__PURE__ */ (0, l.jsx)("p", { children: "保存照片、參考圖與製作截圖，搭配說明和工作紀錄。" })] }), /* @__PURE__ */ (0, l.jsxs)("div", {
          className: "heading-actions",
          children: [/* @__PURE__ */ (0, l.jsx)("button", {
            className: "icon-btn bordered",
            disabled: F,
            "aria-label": "重新載入圖片",
            onClick: () => te((j) => j + 1),
            children: /* @__PURE__ */ (0, l.jsx)(Wa, { size: 16 })
          }), /* @__PURE__ */ (0, l.jsxs)("button", {
            className: "btn primary",
            disabled: r.archived || F,
            onClick: () => {
              N(!0), y(null), z(""), ne(ee), X(""), w([]), q("");
            },
            children: [/* @__PURE__ */ (0, l.jsx)(pf, { size: 17 }), "匯入圖片"]
          })]
        })]
      }),
      /* @__PURE__ */ (0, l.jsxs)("label", {
        className: "form-field",
        children: ["依工作紀錄查看", /* @__PURE__ */ (0, l.jsxs)("select", {
          "aria-label": "依工作紀錄查看圖片",
          value: ee,
          onChange: (j) => ge(j.target.value),
          children: [/* @__PURE__ */ (0, l.jsx)("option", {
            value: "",
            children: "全部圖片"
          }), [...r.records].reverse().map((j) => /* @__PURE__ */ (0, l.jsx)("option", {
            value: j.id,
            children: j.summary.slice(0, 85)
          }, j.id))]
        })]
      }),
      ie && /* @__PURE__ */ (0, l.jsx)("p", {
        role: "status",
        className: "green-text",
        children: ie
      }),
      o.length ? /* @__PURE__ */ (0, l.jsx)("div", {
        className: "project-image-grid",
        children: o.map((j) => /* @__PURE__ */ (0, l.jsx)(Yx, {
          image: j,
          access: Y,
          disabled: F || A || !!P,
          onTrash: () => C(j.id),
          record: r.records.find((R) => R.id === j.recordId),
          onEdit: () => {
            r.archived || (y(j), z(j.description), ne(j.recordId), X(j.stageId), q(""));
          }
        }, j.id + ":" + pe))
      }) : /* @__PURE__ */ (0, l.jsxs)("div", {
        className: "empty",
        children: [
          /* @__PURE__ */ (0, l.jsx)(pf, { size: 30 }),
          /* @__PURE__ */ (0, l.jsx)("h3", { children: ee ? "這筆紀錄還沒有圖片" : "先匯入一張圖片" }),
          /* @__PURE__ */ (0, l.jsx)("p", { children: "支援 JPG、PNG、WebP，每張最多 10 MB。圖片原檔私有保存，重新整理後仍可查看。" })
        ]
      }),
      (A || P) && /* @__PURE__ */ (0, l.jsx)("div", {
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
              disabled: F,
              onClick: () => {
                window.confirm("放棄尚未儲存的表單？已成功上傳的圖片會保留。") && (N(!1), y(null));
              },
              children: /* @__PURE__ */ (0, l.jsx)(Sl, { size: 20 })
            })]
          }), /* @__PURE__ */ (0, l.jsxs)("form", {
            onSubmit: (j) => {
              A ? (j.preventDefault(), se()) : re(j);
            },
            children: [
              A && /* @__PURE__ */ (0, l.jsxs)(l.Fragment, { children: [
                /* @__PURE__ */ (0, l.jsxs)("label", {
                  className: "image-dropzone",
                  children: ["選擇圖片（可多選）", /* @__PURE__ */ (0, l.jsx)("input", {
                    ref: me,
                    type: "file",
                    accept: "image/jpeg,image/png,image/webp",
                    multiple: !0,
                    disabled: F,
                    onChange: (j) => {
                      Q(j.target.files), j.target.value = "";
                    }
                  })]
                }),
                /* @__PURE__ */ (0, l.jsx)("p", {
                  className: "muted",
                  children: "原檔保留，每張上限 10 MB。依序上傳；失敗時已完成的圖片仍會保存。"
                }),
                /* @__PURE__ */ (0, l.jsx)("ul", {
                  className: "image-upload-list",
                  children: _.map((j) => /* @__PURE__ */ (0, l.jsxs)("li", { children: [
                    /* @__PURE__ */ (0, l.jsx)("span", { children: j.file.name }),
                    /* @__PURE__ */ (0, l.jsx)("small", { children: {
                      waiting: "等待上傳",
                      uploading: "上傳中…",
                      saved: "已保存",
                      failed: "未完成"
                    }[j.status] }),
                    j.error && /* @__PURE__ */ (0, l.jsx)("p", {
                      role: "alert",
                      children: j.error
                    })
                  ] }, j.key))
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
                    value: G,
                    disabled: F,
                    onChange: (j) => z(j.target.value)
                  })
                ]
              }),
              /* @__PURE__ */ (0, l.jsxs)("label", {
                className: "form-field",
                children: ["連結工作紀錄", /* @__PURE__ */ (0, l.jsx)("select", {
                  value: le,
                  disabled: F,
                  onChange: (j) => ne(j.target.value),
                  children: _e
                })]
              }),
              /* @__PURE__ */ (0, l.jsxs)("label", {
                className: "form-field",
                children: ["所屬階段", /* @__PURE__ */ (0, l.jsxs)("select", {
                  value: I,
                  disabled: F,
                  onChange: (j) => X(j.target.value),
                  children: [/* @__PURE__ */ (0, l.jsx)("option", {
                    value: "",
                    children: "不指定階段"
                  }), r.stages.map((j) => /* @__PURE__ */ (0, l.jsxs)("option", {
                    value: j.id,
                    children: [
                      j.key,
                      " · ",
                      j.title
                    ]
                  }, j.id))]
                })]
              }),
              oe && /* @__PURE__ */ (0, l.jsx)("p", {
                className: "modal-error",
                role: "alert",
                children: oe
              }),
              /* @__PURE__ */ (0, l.jsxs)("div", {
                className: "modal-actions",
                children: [oe && /* @__PURE__ */ (0, l.jsx)("button", {
                  className: "btn",
                  disabled: F,
                  type: "button",
                  onClick: async () => {
                    const j = h ? await h("workspace", "?view=managed&id=" + r.id) : await fetch("/api/workspace?view=managed&id=" + r.id);
                    if (j.ok) {
                      const R = await j.json();
                      b.current = R.revision, f(R), q("");
                    }
                  },
                  children: "重新讀取專案"
                }), /* @__PURE__ */ (0, l.jsx)("button", {
                  className: "btn primary",
                  disabled: F || A && !_.some((j) => j.status !== "saved"),
                  type: "submit",
                  children: F ? "保存中…" : A ? "上傳並保存" : "保存說明"
                })]
              })
            ]
          })]
        })
      })
    ]
  });
}
function Hf(r, h) {
  return (0, g.useCallback)(async (C, f = {}, p) => {
    const k = {
      action: C,
      id: r,
      revision: p,
      args: f
    }, x = h ? await h("workspace", "", k) : await fetch("/api/workspace", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(k)
    }), A = await x.json();
    if (!x.ok) throw Error(A.error || "素材操作失敗");
    return A;
  }, [r, h]);
}
async function od(r, h, C) {
  if (!h.length) return {};
  const f = "?" + new URLSearchParams({
    projectId: r,
    imageIds: h.join(",")
  }), p = C ? await C("images", f) : await fetch("/api/images" + f), k = await p.json();
  if (!p.ok) throw Error(k.error || "原檔讀取失敗");
  return Object.fromEntries(k.urls.map((x) => [x.imageId, x.url]));
}
var Qx = [
  "平面圖",
  "立面圖",
  "剖面圖",
  "家具配置圖",
  "外觀效果圖",
  "室內效果圖",
  "材質參考",
  "3D 模型參考",
  "其他"
];
function Xx({ project: r, transport: h, onUpdated: C, onDirty: f, onBusy: p }) {
  const k = Hf(r.id, h), [x, A] = (0, g.useState)([]), [N, _] = (0, g.useState)([]), [w, G] = (0, g.useState)({}), [z, le] = (0, g.useState)(""), [ne, I] = (0, g.useState)(""), [X, oe] = (0, g.useState)(!1), [q, ie] = (0, g.useState)(""), [H, F] = (0, g.useState)(""), [$, pe] = (0, g.useState)({
    kind: "image",
    ids: []
  }), [te, P] = (0, g.useState)(null), [y, ee] = (0, g.useState)({}), [ge, me] = (0, g.useState)(null), [b, ae] = (0, g.useState)(""), [K, Y] = (0, g.useState)(""), [Q, se] = (0, g.useState)(""), [re, _e] = (0, g.useState)(!1), [o, j] = (0, g.useState)([]), [R, W] = (0, g.useState)([]), [ce, he] = (0, g.useState)(0), [de, Ge] = (0, g.useState)(0), ze = (0, g.useRef)(r.revision), dt = (0, g.useRef)(null), Xe = (0, g.useRef)(0), Me = (0, g.useCallback)(async () => {
    const M = ++Xe.current;
    try {
      const ke = await k("listProjectFolders");
      !ke.initialized && !r.archived && await k("initializeProjectAssets", { key: crypto.randomUUID() }, ke.revision);
      const je = await k("queryProjectAssets", {
        query: ne,
        folderId: z === "*" ? void 0 : z,
        includeRecycled: !0,
        offset: ce,
        limit: 50
      });
      if (M !== Xe.current) return;
      if (A(ke.folders.filter((Ce) => Ce.available)), _(je.assets), Ge(je.total), j([...ke.recycled, ...je.recycled]), ze.current = je.revision, G({}), je.assets.length) {
        const Ce = await od(r.id, je.assets.map((Be) => Be.id), h);
        M === Xe.current && G(Ce);
      }
      ie("");
    } catch (ke) {
      M === Xe.current && ie(ke.message);
    }
  }, [
    k,
    r.id,
    h,
    ne,
    z,
    ce
  ]);
  (0, g.useEffect)(() => {
    const M = setTimeout(() => {
      Me();
    }, 250);
    return () => {
      clearTimeout(M), Xe.current++;
    };
  }, [Me]), (0, g.useEffect)(() => (f(!!b || R.some((M) => M.status !== "已保存" && M.status !== "已存在") || !!te && JSON.stringify(y) !== JSON.stringify({
    name: te.name,
    description: te.description,
    purpose: te.purpose ?? "",
    tags: (te.tags ?? []).join("、")
  })), () => f(!1)), [
    b,
    R,
    te,
    y,
    f
  ]);
  const ve = (M) => {
    oe(M), p(M);
  };
  async function qe(M, ke) {
    ve(!0), ie("");
    try {
      const je = await k(M, {
        key: crypto.randomUUID(),
        ...ke
      }, ze.current);
      ze.current = je.revision;
      const Ce = je.results?.filter((Be) => !Be.success) ?? [];
      return F(Ce.length ? Ce.map((Be) => Be.error).join("；") : "已保存並讀回"), ae(""), pe({
        kind: "image",
        ids: []
      }), P(null), C(), await Me(), je;
    } catch (je) {
      ie(je.message);
    } finally {
      ve(!1);
    }
  }
  function lt(M) {
    ie(""), W((ke) => [...ke, ...M.filter((je) => !Gx.includes(je.type) || !je.size || je.size > 10485760 ? (ie("僅接受PNG、JPEG、WebP、靜態SVG、PDF，每檔最多10MB"), !1) : !0).map((je) => ({
      file: je,
      key: crypto.randomUUID(),
      status: "待上傳"
    }))]);
  }
  async function d() {
    ve(!0), ie("");
    try {
      for (const M of R.filter((ke) => !["已保存", "已存在"].includes(ke.status))) {
        W((je) => je.map((Ce) => Ce.key === M.key ? {
          ...Ce,
          status: "上傳中",
          error: ""
        } : Ce));
        const ke = new FormData();
        for (const [je, Ce] of Object.entries({
          projectId: r.id,
          revision: String(ze.current),
          key: M.key,
          assetUpload: "1",
          folderId: z === "*" ? "" : z,
          description: "",
          recordId: "",
          stageId: ""
        })) ke.set(je, Ce);
        ke.set("file", M.file, M.file.name);
        try {
          const je = h ? await h("images", "", ke) : await fetch("/api/images", {
            method: "POST",
            body: ke
          }), Ce = await je.json();
          if (!je.ok) throw Error(Ce.error || "上傳失敗");
          ze.current = Ce.revision, W((Be) => Be.map((bt) => bt.key === M.key ? {
            ...bt,
            status: Ce.uploadResult?.deduplicated ? "已存在" : "已保存"
          } : bt));
        } catch (je) {
          W((Ce) => Ce.map((Be) => Be.key === M.key ? {
            ...Be,
            status: "失敗",
            error: je.message
          } : Be));
          break;
        }
      }
      C(), await Me();
    } finally {
      ve(!1);
    }
  }
  function B(M, ke, je) {
    pe((Ce) => ({
      kind: M,
      ids: je ? [...Ce.kind === M ? Ce.ids : [], ke] : Ce.ids.filter((Be) => Be !== ke)
    }));
  }
  async function ue(M = "trash", ke = $.kind, je = $.ids) {
    if (je.length) {
      if (M === "trash") {
        let Ce = "資料夾內原檔保留，會在待分類中可見。";
        if (ke === "image") {
          const Be = await k("queryProjectAssets", {
            ids: je,
            limit: 100
          });
          ze.current = Be.revision, Ce = Be.assets.map((bt) => bt.name + "：" + (bt.references.drawings.length + "個圖說版本、" + bt.references.relations.length + "個關聯引用")).join(`
`) + `
被引用的來源回收後會顯示待核對，不會自動替換基準。`;
        }
        if (!window.confirm("將選取的" + je.length + `個項目移至回收區？至少保留30天。
` + Ce)) return;
      }
      await qe("recycleProjectAssets", {
        action: M,
        kind: ke,
        ids: je,
        confirm: !0
      });
    }
  }
  async function He(M) {
    try {
      const ke = await od(r.id, [M.id], h), je = await fetch(ke[M.id]);
      if (!je.ok) throw Error("下載失敗");
      const Ce = URL.createObjectURL(await je.blob()), Be = document.createElement("a");
      Be.href = Ce, Be.download = M.name, Be.click(), setTimeout(() => URL.revokeObjectURL(Ce), 1e3);
    } catch (ke) {
      ie(ke.message);
    }
  }
  async function T() {
    try {
      const M = await k("exportProjectAssets"), ke = URL.createObjectURL(new Blob([JSON.stringify(M, null, 2)], { type: "application/json" })), je = document.createElement("a");
      je.href = ke, je.download = "project-assets-" + r.id + ".json", je.click(), setTimeout(() => URL.revokeObjectURL(ke), 1e3);
    } catch (M) {
      ie(M.message);
    }
  }
  function we(M) {
    let ke = 0, je = M.parentId;
    const Ce = /* @__PURE__ */ new Set([M.id]);
    for (; je && !Ce.has(je); ) {
      Ce.add(je);
      const Be = x.find((bt) => bt.id === je);
      if (!Be) break;
      ke++, je = Be.parentId;
    }
    return ke;
  }
  const Ze = $.ids.length, Dt = /* @__PURE__ */ (0, l.jsxs)(l.Fragment, { children: [/* @__PURE__ */ (0, l.jsx)("option", {
    value: "",
    children: "待分類／根目錄"
  }), x.map((M) => /* @__PURE__ */ (0, l.jsxs)("option", {
    value: M.id,
    children: ["　".repeat(we(M)), M.name]
  }, M.id))] });
  return /* @__PURE__ */ (0, l.jsxs)("section", {
    className: "asset-manager",
    children: [
      /* @__PURE__ */ (0, l.jsxs)("header", {
        className: "asset-toolbar",
        children: [
          /* @__PURE__ */ (0, l.jsxs)("button", {
            className: "btn",
            disabled: X || r.archived,
            onClick: () => {
              Y(""), ae("create");
            },
            children: [/* @__PURE__ */ (0, l.jsx)(Um, { size: 16 }), "新增資料夾"]
          }),
          /* @__PURE__ */ (0, l.jsxs)("button", {
            className: "btn primary",
            disabled: X || r.archived,
            onClick: () => dt.current?.click(),
            children: [/* @__PURE__ */ (0, l.jsx)(nx, { size: 16 }), "上傳"]
          }),
          /* @__PURE__ */ (0, l.jsxs)("button", {
            className: "btn",
            disabled: X || !Ze || r.archived,
            onClick: () => {
              se(""), ae("move");
            },
            children: [/* @__PURE__ */ (0, l.jsx)(Wm, { size: 16 }), "移動"]
          }),
          /* @__PURE__ */ (0, l.jsxs)("button", {
            className: "btn danger",
            disabled: X || !Ze || r.archived,
            onClick: () => {
              ue();
            },
            children: [/* @__PURE__ */ (0, l.jsx)(yl, { size: 16 }), "刪除"]
          }),
          /* @__PURE__ */ (0, l.jsxs)("details", { children: [
            /* @__PURE__ */ (0, l.jsx)("summary", { children: "更多" }),
            /* @__PURE__ */ (0, l.jsx)("button", {
              className: "text-btn",
              disabled: X || $.kind !== "folder" || Ze !== 1 || r.archived,
              onClick: () => {
                Y(x.find((M) => M.id === $.ids[0])?.name ?? ""), ae("rename");
              },
              children: "資料夾重新命名"
            }),
            /* @__PURE__ */ (0, l.jsxs)("button", {
              className: "text-btn",
              disabled: X || $.kind !== "folder" || !Ze || r.archived,
              onClick: () => {
                se(""), ae("copy");
              },
              children: [/* @__PURE__ */ (0, l.jsx)(pd, { size: 14 }), "複製資料夾及素材引用"]
            }),
            /* @__PURE__ */ (0, l.jsx)("button", {
              className: "text-btn",
              disabled: X || $.kind !== "image" || !Ze || r.archived,
              onClick: () => {
                Y(""), ae("classify");
              },
              children: "批次分類"
            }),
            /* @__PURE__ */ (0, l.jsx)("button", {
              className: "text-btn",
              onClick: () => {
                T();
              },
              children: "匯出素材索引"
            })
          ] }),
          /* @__PURE__ */ (0, l.jsx)("button", {
            className: "btn",
            disabled: X,
            onClick: () => {
              _e((M) => !M), P(null);
            },
            children: re ? "返回素材" : "回收區"
          }),
          /* @__PURE__ */ (0, l.jsx)("button", {
            className: "icon-btn",
            "aria-label": "重新整理素材",
            disabled: X,
            onClick: () => {
              Me();
            },
            children: /* @__PURE__ */ (0, l.jsx)(Wa, { size: 16 })
          }),
          /* @__PURE__ */ (0, l.jsx)("input", {
            ref: dt,
            type: "file",
            multiple: !0,
            hidden: !0,
            accept: "image/png,image/jpeg,image/webp,image/svg+xml,application/pdf",
            onChange: (M) => {
              lt(Array.from(M.target.files ?? [])), M.target.value = "";
            }
          })
        ]
      }),
      /* @__PURE__ */ (0, l.jsxs)("label", {
        className: "search asset-search",
        children: [/* @__PURE__ */ (0, l.jsx)(fd, { size: 16 }), /* @__PURE__ */ (0, l.jsx)("input", {
          "aria-label": "搜尋素材與資料夾",
          placeholder: "搜尋檔名、說明、分類或資料夾",
          value: ne,
          onChange: (M) => {
            I(M.target.value), he(0);
          }
        })]
      }),
      q && /* @__PURE__ */ (0, l.jsx)("p", {
        className: "modal-error",
        role: "alert",
        children: q
      }),
      H && /* @__PURE__ */ (0, l.jsx)("p", {
        role: "status",
        children: H
      }),
      !!R.length && /* @__PURE__ */ (0, l.jsxs)("section", {
        className: "wide-card",
        children: [
          /* @__PURE__ */ (0, l.jsxs)("b", { children: [
            "上傳清單 · ",
            R.filter((M) => ["已保存", "已存在"].includes(M.status)).length,
            "/",
            R.length
          ] }),
          /* @__PURE__ */ (0, l.jsx)("progress", {
            max: R.length,
            value: R.filter((M) => ["已保存", "已存在"].includes(M.status)).length
          }),
          R.map((M) => /* @__PURE__ */ (0, l.jsxs)("p", { children: [
            M.file.name,
            " · ",
            M.status,
            M.error ? "：" + M.error : ""
          ] }, M.key)),
          /* @__PURE__ */ (0, l.jsx)("button", {
            className: "btn primary",
            disabled: X || r.archived,
            onClick: () => {
              d();
            },
            children: "開始上傳／重試失敗檔案"
          }),
          /* @__PURE__ */ (0, l.jsx)("button", {
            className: "btn",
            disabled: X,
            onClick: () => W([]),
            children: "清除清單"
          }),
          /* @__PURE__ */ (0, l.jsx)("p", {
            className: "muted",
            children: "相同SHA256的原檔不會重複保存。若結果不明，請先重新整理；相同上傳鍵可安全讀回。"
          })
        ]
      }),
      re ? /* @__PURE__ */ (0, l.jsxs)("section", {
        className: "wide-card",
        children: [
          /* @__PURE__ */ (0, l.jsx)("h2", { children: "素材回收區" }),
          /* @__PURE__ */ (0, l.jsx)("p", { children: "至少保留30天，沒有自動清空排程。還原使用原ID與原檔。" }),
          !o.length && /* @__PURE__ */ (0, l.jsx)("p", { children: "回收區是空的。" }),
          o.map((M) => /* @__PURE__ */ (0, l.jsxs)("article", {
            className: "journal-card",
            children: [
              /* @__PURE__ */ (0, l.jsx)("b", { children: M.title }),
              /* @__PURE__ */ (0, l.jsxs)("p", { children: [
                M.kind === "folder" ? "資料夾" : "檔案",
                " · ",
                new Date(M.at).toLocaleString("zh-TW"),
                " · ",
                M.by
              ] }),
              /* @__PURE__ */ (0, l.jsxs)("p", { children: ["保留至 ", M.retainUntil ? new Date(M.retainUntil).toLocaleDateString("zh-TW") : "未設定期限"] }),
              /* @__PURE__ */ (0, l.jsx)("button", {
                className: "btn",
                disabled: X || r.archived,
                onClick: () => {
                  ue("restore", M.kind, [M.id]);
                },
                children: "還原"
              })
            ]
          }, M.id))
        ]
      }) : /* @__PURE__ */ (0, l.jsxs)("div", {
        className: "asset-layout" + (te ? " has-detail" : ""),
        children: [
          /* @__PURE__ */ (0, l.jsxs)("aside", {
            className: "asset-folders",
            children: [
              /* @__PURE__ */ (0, l.jsxs)("h3", { children: [/* @__PURE__ */ (0, l.jsx)(Lm, { size: 17 }), "資料夾"] }),
              /* @__PURE__ */ (0, l.jsx)("button", {
                className: z === "*" ? "active" : "",
                onClick: () => {
                  le("*"), he(0);
                },
                children: "全部素材"
              }),
              /* @__PURE__ */ (0, l.jsx)("button", {
                className: z === "" ? "active" : "",
                onClick: () => {
                  le(""), he(0);
                },
                children: "待分類"
              }),
              x.filter((M) => !ne || M.name.toLowerCase().includes(ne.toLowerCase())).map((M) => /* @__PURE__ */ (0, l.jsxs)("div", {
                style: { paddingLeft: we(M) * 12 },
                children: [/* @__PURE__ */ (0, l.jsx)("input", {
                  type: "checkbox",
                  "aria-label": "選取資料夾：" + M.name,
                  checked: $.kind === "folder" && $.ids.includes(M.id),
                  onChange: (ke) => B("folder", M.id, ke.target.checked)
                }), /* @__PURE__ */ (0, l.jsx)("button", {
                  className: z === M.id ? "active" : "",
                  onClick: () => {
                    le(M.id), he(0);
                  },
                  children: M.name
                })]
              }, M.id))
            ]
          }),
          /* @__PURE__ */ (0, l.jsxs)("main", {
            className: "asset-files",
            onDragOver: (M) => M.preventDefault(),
            onDrop: (M) => {
              M.preventDefault(), !X && !r.archived && lt(Array.from(M.dataTransfer.files));
            },
            children: [
              /* @__PURE__ */ (0, l.jsxs)("div", {
                className: "section-title",
                children: [/* @__PURE__ */ (0, l.jsx)("h2", { children: z === "*" ? "全部素材" : x.find((M) => M.id === z)?.name ?? "待分類" }), /* @__PURE__ */ (0, l.jsxs)("span", { children: [
                  de,
                  "個檔案 · 已選",
                  Ze
                ] })]
              }),
              /* @__PURE__ */ (0, l.jsx)("p", {
                className: "muted",
                children: "可拖放多個檔案到這裡。舊圖未分類時保留在「待分類」。"
              }),
              /* @__PURE__ */ (0, l.jsxs)("label", { children: [/* @__PURE__ */ (0, l.jsx)("input", {
                type: "checkbox",
                checked: !!N.length && $.kind === "image" && N.every((M) => $.ids.includes(M.id)),
                onChange: (M) => pe({
                  kind: "image",
                  ids: M.target.checked ? N.map((ke) => ke.id) : []
                })
              }), "選取本頁"] }),
              /* @__PURE__ */ (0, l.jsx)("div", {
                className: "asset-grid",
                children: N.map((M) => /* @__PURE__ */ (0, l.jsxs)("article", {
                  className: "asset-card" + (te?.id === M.id ? " selected" : ""),
                  children: [
                    /* @__PURE__ */ (0, l.jsxs)("label", { children: [/* @__PURE__ */ (0, l.jsx)("input", {
                      type: "checkbox",
                      "aria-label": "選取素材：" + M.name,
                      checked: $.kind === "image" && $.ids.includes(M.id),
                      onChange: (ke) => B("image", M.id, ke.target.checked)
                    }), M.purpose || "未分類用途"] }),
                    /* @__PURE__ */ (0, l.jsx)("button", {
                      className: "asset-thumb",
                      onClick: () => {
                        P(M), ee({
                          name: M.name,
                          description: M.description,
                          purpose: M.purpose ?? "",
                          tags: (M.tags ?? []).join("、")
                        });
                      },
                      "aria-label": "素材詳情：" + M.name,
                      children: w[M.id] && M.mime !== "application/pdf" ? /* @__PURE__ */ (0, l.jsx)("img", {
                        src: w[M.id],
                        alt: M.description || M.name
                      }) : /* @__PURE__ */ (0, l.jsx)(Tm, { size: 40 })
                    }),
                    /* @__PURE__ */ (0, l.jsx)("b", { children: M.name }),
                    /* @__PURE__ */ (0, l.jsxs)("small", { children: [(M.size / 1024).toFixed(0), " KB"] }),
                    /* @__PURE__ */ (0, l.jsxs)("button", {
                      className: "text-btn",
                      disabled: !w[M.id],
                      onClick: () => me(M),
                      children: [/* @__PURE__ */ (0, l.jsx)(Jm, { size: 13 }), "全螢幕檢視"]
                    })
                  ]
                }, M.id))
              }),
              !N.length && /* @__PURE__ */ (0, l.jsx)("div", {
                className: "empty",
                children: "此分類尚無素材。"
              }),
              /* @__PURE__ */ (0, l.jsxs)("div", {
                className: "heading-actions",
                children: [/* @__PURE__ */ (0, l.jsx)("button", {
                  className: "btn",
                  disabled: !ce,
                  onClick: () => he((M) => Math.max(0, M - 50)),
                  children: "上一頁"
                }), /* @__PURE__ */ (0, l.jsx)("button", {
                  className: "btn",
                  disabled: ce + N.length >= de,
                  onClick: () => he((M) => M + 50),
                  children: "下一頁"
                })]
              })
            ]
          }),
          te && /* @__PURE__ */ (0, l.jsxs)("aside", {
            className: "asset-detail",
            children: [
              /* @__PURE__ */ (0, l.jsx)("button", {
                className: "icon-btn",
                "aria-label": "關閉素材詳情",
                onClick: () => P(null),
                children: /* @__PURE__ */ (0, l.jsx)(Sl, { size: 18 })
              }),
              /* @__PURE__ */ (0, l.jsx)("h3", { children: "素材資訊" }),
              /* @__PURE__ */ (0, l.jsxs)("label", {
                className: "form-field",
                children: ["檔名", /* @__PURE__ */ (0, l.jsx)("input", {
                  value: y.name ?? "",
                  onChange: (M) => ee({
                    ...y,
                    name: M.target.value
                  })
                })]
              }),
              /* @__PURE__ */ (0, l.jsxs)("label", {
                className: "form-field",
                children: ["描述", /* @__PURE__ */ (0, l.jsx)("textarea", {
                  value: y.description ?? "",
                  onChange: (M) => ee({
                    ...y,
                    description: M.target.value
                  })
                })]
              }),
              /* @__PURE__ */ (0, l.jsxs)("label", {
                className: "form-field",
                children: [
                  "用途",
                  /* @__PURE__ */ (0, l.jsx)("input", {
                    list: "asset-purposes",
                    value: y.purpose ?? "",
                    onChange: (M) => ee({
                      ...y,
                      purpose: M.target.value
                    })
                  }),
                  /* @__PURE__ */ (0, l.jsx)("datalist", {
                    id: "asset-purposes",
                    children: Qx.map((M) => /* @__PURE__ */ (0, l.jsx)("option", { value: M }, M))
                  })
                ]
              }),
              /* @__PURE__ */ (0, l.jsxs)("label", {
                className: "form-field",
                children: ["分類標籤（、分隔）", /* @__PURE__ */ (0, l.jsx)("input", {
                  value: y.tags ?? "",
                  onChange: (M) => ee({
                    ...y,
                    tags: M.target.value
                  })
                })]
              }),
              /* @__PURE__ */ (0, l.jsx)("button", {
                className: "btn primary",
                disabled: X || r.archived,
                onClick: () => {
                  qe("updateProjectAssets", {
                    ids: [te.id],
                    patch: {
                      ...y,
                      tags: String(y.tags).split(/[、,，]/).map((M) => M.trim()).filter(Boolean)
                    }
                  });
                },
                children: "儲存資訊"
              }),
              /* @__PURE__ */ (0, l.jsxs)("button", {
                className: "btn",
                onClick: () => {
                  He(te);
                },
                children: [/* @__PURE__ */ (0, l.jsx)(dn, { size: 16 }), "下載原檔"]
              }),
              /* @__PURE__ */ (0, l.jsxs)("details", { children: [
                /* @__PURE__ */ (0, l.jsx)("summary", { children: "版本、引用與SHA256" }),
                /* @__PURE__ */ (0, l.jsx)("code", { children: te.sha256 }),
                /* @__PURE__ */ (0, l.jsx)("pre", {
                  className: "hub-json",
                  children: JSON.stringify(te.references, null, 2)
                })
              ] })
            ]
          })
        ]
      }),
      b && /* @__PURE__ */ (0, l.jsx)("div", {
        className: "modal-backdrop",
        children: /* @__PURE__ */ (0, l.jsxs)("section", {
          className: "modal",
          role: "dialog",
          "aria-modal": "true",
          "aria-label": "素材操作",
          children: [/* @__PURE__ */ (0, l.jsx)("h2", { children: {
            create: "新增資料夾",
            rename: "重新命名資料夾",
            move: "移動選取項目",
            copy: "複製資料夾",
            classify: "批次分類"
          }[b] }), /* @__PURE__ */ (0, l.jsxs)("form", {
            onSubmit: (M) => {
              M.preventDefault(), b === "create" ? qe("createProjectFolder", {
                name: K,
                parentId: z === "*" ? "" : z
              }) : b === "classify" ? qe("updateProjectAssets", {
                ids: $.ids,
                patch: { purpose: K }
              }) : b === "rename" ? qe("manageProjectFolders", {
                action: "rename",
                ids: $.ids,
                name: K
              }) : $.kind === "folder" ? qe("manageProjectFolders", {
                action: b,
                ids: $.ids,
                parentId: Q
              }) : qe("updateProjectAssets", {
                ids: $.ids,
                patch: { folderId: Q }
              });
            },
            children: [[
              "create",
              "rename",
              "classify"
            ].includes(b) ? /* @__PURE__ */ (0, l.jsxs)("label", {
              className: "form-field",
              children: ["名稱／用途", /* @__PURE__ */ (0, l.jsx)("input", {
                required: !0,
                maxLength: 200,
                value: K,
                onChange: (M) => Y(M.target.value)
              })]
            }) : /* @__PURE__ */ (0, l.jsxs)("label", {
              className: "form-field",
              children: ["目的資料夾", /* @__PURE__ */ (0, l.jsx)("select", {
                value: Q,
                onChange: (M) => se(M.target.value),
                children: Dt
              })]
            }), /* @__PURE__ */ (0, l.jsxs)("div", {
              className: "modal-actions",
              children: [/* @__PURE__ */ (0, l.jsx)("button", {
                className: "btn",
                type: "button",
                disabled: X,
                onClick: () => ae(""),
                children: "取消"
              }), /* @__PURE__ */ (0, l.jsx)("button", {
                className: "btn primary",
                disabled: X,
                children: "儲存"
              })]
            })]
          })]
        })
      }),
      ge && /* @__PURE__ */ (0, l.jsxs)("div", {
        className: "asset-viewer",
        role: "dialog",
        "aria-modal": "true",
        "aria-label": "全螢幕素材檢視",
        children: [/* @__PURE__ */ (0, l.jsxs)("header", { children: [
          /* @__PURE__ */ (0, l.jsx)("b", { children: ge.name }),
          /* @__PURE__ */ (0, l.jsx)("button", {
            className: "btn",
            onClick: () => {
              He(ge);
            },
            children: "下載原檔"
          }),
          /* @__PURE__ */ (0, l.jsx)("button", {
            className: "btn",
            onClick: () => me(null),
            children: "關閉"
          })
        ] }), ge.mime === "application/pdf" ? /* @__PURE__ */ (0, l.jsx)("iframe", {
          sandbox: "",
          src: w[ge.id],
          title: ge.name
        }) : /* @__PURE__ */ (0, l.jsx)("img", {
          src: w[ge.id],
          alt: ge.description || ge.name
        })]
      })
    ]
  });
}
var kf = {
  draft: "草稿",
  candidate: "待確認候選",
  adopted: "已採用基準",
  historical: "歷史版本",
  returned: "已退回"
}, ri = {
  geometry: "幾何依據",
  appearance: "外觀設計參考",
  history: "歷史紀錄",
  reference: "一般參考",
  related: "相關素材"
}, _f = {
  needs_check: "待核對",
  consistent: "使用者已確認一致",
  conflict: "有衝突，待處理"
};
function Zx({ project: r, transport: h, onUpdated: C, onDirty: f, onBusy: p }) {
  const k = Hf(r.id, h), [x, A] = (0, g.useState)(null), [N, _] = (0, g.useState)(""), [w, G] = (0, g.useState)(""), [z, le] = (0, g.useState)(!1), [ne, I] = (0, g.useState)(""), [X, oe] = (0, g.useState)(""), [q, ie] = (0, g.useState)({}), [H, F] = (0, g.useState)(""), [$, pe] = (0, g.useState)(""), [te, P] = (0, g.useState)(null), [y, ee] = (0, g.useState)({}), [ge, me] = (0, g.useState)(!1), [b, ae] = (0, g.useState)(50), K = (0, g.useCallback)(async () => {
    try {
      A(await k("getProjectDrawings")), _("");
    } catch (o) {
      _(o.message);
    }
  }, [k]);
  (0, g.useEffect)(() => {
    K();
  }, [K]), (0, g.useEffect)(() => (f(!!X), () => f(!1)), [X, f]);
  async function Y(o, j) {
    le(!0), p(!0), _("");
    try {
      const R = await k(o, {
        key: crypto.randomUUID(),
        ...j
      }, x.revision);
      return oe(""), G("已保存，版本與稽核紀錄已保留"), C(), await K(), R;
    } catch (R) {
      _(R.message);
    } finally {
      le(!1), p(!1);
    }
  }
  function Q(o, j, R = !1, W = !1) {
    return /* @__PURE__ */ (0, l.jsxs)("label", {
      className: "form-field",
      children: [j, W ? /* @__PURE__ */ (0, l.jsx)("textarea", {
        required: R,
        value: q[o] ?? "",
        onChange: (ce) => ie({
          ...q,
          [o]: ce.target.value
        })
      }) : /* @__PURE__ */ (0, l.jsx)("input", {
        required: R,
        maxLength: 300,
        value: q[o] ?? "",
        onChange: (ce) => ie({
          ...q,
          [o]: ce.target.value
        })
      })]
    });
  }
  function se(o, j, R, W = !0) {
    return /* @__PURE__ */ (0, l.jsxs)("label", {
      className: "form-field",
      children: [j, /* @__PURE__ */ (0, l.jsxs)("select", {
        required: !W,
        value: q[o] ?? "",
        onChange: (ce) => ie({
          ...q,
          [o]: ce.target.value
        }),
        children: [W && /* @__PURE__ */ (0, l.jsx)("option", {
          value: "",
          children: "不指定"
        }), R.map((ce) => /* @__PURE__ */ (0, l.jsx)("option", {
          value: ce.id,
          children: ce.title
        }, ce.id))]
      })]
    });
  }
  function re(o, j = {}) {
    ie({
      role: o === "relation" ? "related" : "reference",
      status: "draft",
      checkState: "needs_check",
      assetId: x.files[0]?.id ?? "",
      from: x.nodes[0]?.id ?? "",
      to: x.nodes[1]?.id ?? "",
      ...j
    }), oe(o), _("");
  }
  async function _e() {
    le(!0);
    try {
      const o = await k("getDrawingComparison", {
        leftId: H,
        rightId: $
      });
      ee(await od(r.id, [.../* @__PURE__ */ new Set([o.left.asset.id, o.right.asset.id])], h)), P(o), _("");
    } catch (o) {
      _(o.message);
    } finally {
      le(!1);
    }
  }
  return x ? /* @__PURE__ */ (0, l.jsxs)("section", {
    className: "drawing-workspace",
    children: [
      /* @__PURE__ */ (0, l.jsxs)("div", {
        className: "section-title",
        children: [/* @__PURE__ */ (0, l.jsxs)("div", { children: [
          /* @__PURE__ */ (0, l.jsx)("h2", { children: "圖說版本" }),
          !h && /* @__PURE__ */ (0, l.jsxs)("p", { children: [
            "正式基準請由本人在",
            /* @__PURE__ */ (0, l.jsx)("a", {
              href: "https://lihuany635-create.github.io/lizhi-cloud-web/?open=animationflow",
              target: "_blank",
              rel: "noreferrer",
              children: "立之雲端庫工作台"
            }),
            "登入後核定。"
          ] }),
          /* @__PURE__ */ (0, l.jsx)("p", { children: "原版保留；幾何依據與外觀參考分開。較新的圖不會自動成為基準。" })
        ] }), /* @__PURE__ */ (0, l.jsxs)("div", {
          className: "heading-actions",
          children: [
            /* @__PURE__ */ (0, l.jsxs)("button", {
              className: "btn primary",
              disabled: z || r.archived || !x.files.length,
              onClick: () => re("version"),
              children: [/* @__PURE__ */ (0, l.jsx)(Ft, { size: 16 }), "新增版本"]
            }),
            /* @__PURE__ */ (0, l.jsxs)("button", {
              className: "btn",
              disabled: z || r.archived || x.nodes.length < 2,
              onClick: () => re("relation"),
              children: [/* @__PURE__ */ (0, l.jsx)(on, { size: 16 }), "建立關聯"]
            }),
            /* @__PURE__ */ (0, l.jsx)("button", {
              className: "icon-btn",
              "aria-label": "重新整理圖說",
              disabled: z,
              onClick: () => {
                K();
              },
              children: /* @__PURE__ */ (0, l.jsx)(Wa, { size: 16 })
            })
          ]
        })]
      }),
      N && /* @__PURE__ */ (0, l.jsx)("p", {
        role: "alert",
        className: "modal-error",
        children: N
      }),
      w && /* @__PURE__ */ (0, l.jsx)("p", {
        role: "status",
        children: w
      }),
      /* @__PURE__ */ (0, l.jsxs)("label", {
        className: "form-field",
        children: ["搜尋圖號、圖名與版本", /* @__PURE__ */ (0, l.jsx)("input", {
          value: ne,
          onChange: (o) => I(o.target.value),
          placeholder: "例如 A-201、人物正面、車身"
        })]
      }),
      !x.drawings.length && /* @__PURE__ */ (0, l.jsx)("div", {
        className: "empty",
        children: "先在「素材」上傳檔案，再建立圖號與版本。圖號及用途可自行命名，適用各種模型。"
      }),
      /* @__PURE__ */ (0, l.jsx)("div", {
        className: "drawing-grid",
        children: x.drawings.filter((o) => !ne || [
          o.number,
          o.title,
          o.version
        ].join(" ").toLowerCase().includes(ne.toLowerCase())).map((o) => /* @__PURE__ */ (0, l.jsxs)("article", {
          className: "wide-card drawing-card " + o.status,
          children: [
            /* @__PURE__ */ (0, l.jsxs)("div", {
              className: "section-title",
              children: [/* @__PURE__ */ (0, l.jsxs)("h3", { children: [
                o.number,
                " · ",
                o.version
              ] }), /* @__PURE__ */ (0, l.jsx)("span", {
                className: "status",
                children: kf[o.status]
              })]
            }),
            /* @__PURE__ */ (0, l.jsx)("b", { children: o.title }),
            /* @__PURE__ */ (0, l.jsx)("p", {
              className: "drawing-role",
              children: ri[o.role]
            }),
            /* @__PURE__ */ (0, l.jsx)("p", { children: o.reason }),
            /* @__PURE__ */ (0, l.jsxs)("small", { children: [
              new Date(o.createdAt).toLocaleString("zh-TW"),
              " · ",
              o.by
            ] }),
            /* @__PURE__ */ (0, l.jsxs)("p", { children: ["來源：", o.sourceName] }),
            o.recordId && /* @__PURE__ */ (0, l.jsxs)("p", { children: ["工作紀錄：", x.records.find((j) => j.id === o.recordId)?.summary ?? "原連結紀錄已回收，待核對"] }),
            !o.sourceAvailable && /* @__PURE__ */ (0, l.jsx)("p", {
              className: "red-text",
              children: "來源素材已回收或缺少，待核對；未自動替換基準。"
            }),
            /* @__PURE__ */ (0, l.jsxs)("div", {
              className: "heading-actions",
              children: [
                /* @__PURE__ */ (0, l.jsx)("button", {
                  className: "text-btn",
                  disabled: z || r.archived,
                  onClick: () => re("version", {
                    number: o.number,
                    title: o.title,
                    previousVersionId: o.id,
                    role: o.role,
                    version: "",
                    reason: ""
                  }),
                  children: "新增後續版本"
                }),
                /* @__PURE__ */ (0, l.jsx)("button", {
                  className: "text-btn",
                  disabled: z || r.archived || o.status === "adopted",
                  onClick: () => re("status", {
                    drawingId: o.id,
                    status: o.status,
                    reason: ""
                  }),
                  children: "變更狀態"
                }),
                /* @__PURE__ */ (0, l.jsx)("button", {
                  className: "text-btn",
                  disabled: z || r.archived || !h || !o.sourceAvailable || o.status === "adopted",
                  onClick: () => re("adopt", {
                    drawingId: o.id,
                    currentBaselineId: x.drawings.find((j) => j.number === o.number && j.role === o.role && j.status === "adopted")?.id ?? "",
                    reason: "",
                    title: o.number + " " + o.version,
                    role: o.role
                  }),
                  children: "設為正式基準"
                })
              ]
            })
          ]
        }, o.id))
      }),
      /* @__PURE__ */ (0, l.jsxs)("section", {
        className: "wide-card",
        children: [
          /* @__PURE__ */ (0, l.jsx)("h3", { children: "圖說與素材關聯" }),
          /* @__PURE__ */ (0, l.jsx)("p", {
            className: "muted",
            children: "關聯不等於幾何一致。來源回收、衝突或尚未確認時保留「待核對」。未來模型可透過本專案的成果引用建立關聯。"
          }),
          !x.relations.length && /* @__PURE__ */ (0, l.jsx)("p", { children: "尚未建立關聯。" }),
          x.relations.map((o) => /* @__PURE__ */ (0, l.jsxs)("article", {
            className: "journal-card",
            children: [
              /* @__PURE__ */ (0, l.jsxs)("b", { children: [
                o.fromNode?.title ?? o.from,
                " ↔ ",
                o.toNode?.title ?? o.to
              ] }),
              /* @__PURE__ */ (0, l.jsxs)("p", { children: [
                ri[o.role],
                " · ",
                _f[o.effectiveCheckState]
              ] }),
              /* @__PURE__ */ (0, l.jsx)("p", { children: o.note }),
              /* @__PURE__ */ (0, l.jsx)("button", {
                className: "text-btn",
                disabled: z || r.archived,
                onClick: () => re("relation", {
                  ...o,
                  relationId: o.id
                }),
                children: "修改／核對關聯"
              }),
              /* @__PURE__ */ (0, l.jsx)("button", {
                className: "text-btn danger",
                disabled: z || r.archived,
                onClick: () => {
                  window.confirm("移除此關聯？原圖及版本仍保留。") && Y("manageAssetRelations", {
                    action: "remove",
                    relationId: o.id
                  });
                },
                children: "移除關聯"
              })
            ]
          }, o.id))
        ]
      }),
      /* @__PURE__ */ (0, l.jsxs)("section", {
        className: "wide-card",
        children: [
          /* @__PURE__ */ (0, l.jsx)("h3", { children: "人工比較" }),
          /* @__PURE__ */ (0, l.jsxs)("div", {
            className: "drawing-compare-select",
            children: [
              /* @__PURE__ */ (0, l.jsxs)("label", { children: ["左側版本", /* @__PURE__ */ (0, l.jsxs)("select", {
                "aria-label": "比較左側版本",
                value: H,
                onChange: (o) => F(o.target.value),
                children: [/* @__PURE__ */ (0, l.jsx)("option", {
                  value: "",
                  children: "選擇版本"
                }), x.drawings.map((o) => /* @__PURE__ */ (0, l.jsxs)("option", {
                  value: o.id,
                  children: [
                    o.number,
                    " ",
                    o.version,
                    " · ",
                    o.title
                  ]
                }, o.id))]
              })] }),
              /* @__PURE__ */ (0, l.jsxs)("label", { children: ["右側版本", /* @__PURE__ */ (0, l.jsxs)("select", {
                "aria-label": "比較右側版本",
                value: $,
                onChange: (o) => pe(o.target.value),
                children: [/* @__PURE__ */ (0, l.jsx)("option", {
                  value: "",
                  children: "選擇版本"
                }), x.drawings.map((o) => /* @__PURE__ */ (0, l.jsxs)("option", {
                  value: o.id,
                  children: [
                    o.number,
                    " ",
                    o.version,
                    " · ",
                    o.title
                  ]
                }, o.id))]
              })] }),
              /* @__PURE__ */ (0, l.jsx)("button", {
                className: "btn primary",
                disabled: z || !H || !$ || H === $,
                onClick: () => {
                  _e();
                },
                children: "開啟比較"
              })
            ]
          }),
          te && /* @__PURE__ */ (0, l.jsxs)(l.Fragment, { children: [
            /* @__PURE__ */ (0, l.jsxs)("div", {
              className: "heading-actions",
              children: [/* @__PURE__ */ (0, l.jsxs)("button", {
                className: "btn",
                onClick: () => me(!1),
                children: [/* @__PURE__ */ (0, l.jsx)(wm, { size: 16 }), "左右並排"]
              }), /* @__PURE__ */ (0, l.jsxs)("button", {
                className: "btn",
                disabled: [te.left.asset, te.right.asset].some((o) => o.mime === "application/pdf"),
                onClick: () => me(!0),
                children: [/* @__PURE__ */ (0, l.jsx)(Mf, { size: 16 }), "透明度疊圖"]
              })]
            }),
            /* @__PURE__ */ (0, l.jsxs)("p", { children: [
              te.left.drawing.number,
              " ",
              te.left.drawing.version,
              " ↔ ",
              te.right.drawing.number,
              " ",
              te.right.drawing.version
            ] }),
            ge && /* @__PURE__ */ (0, l.jsxs)("label", { children: [
              "疊圖透明度 ",
              b,
              "%",
              /* @__PURE__ */ (0, l.jsx)("input", {
                type: "range",
                "aria-label": "疊圖透明度",
                min: "0",
                max: "100",
                value: b,
                onChange: (o) => ae(Number(o.target.value))
              })
            ] }),
            /* @__PURE__ */ (0, l.jsx)("div", {
              className: ge ? "drawing-overlay" : "drawing-side-by-side",
              children: [te.left, te.right].map((o, j) => /* @__PURE__ */ (0, l.jsxs)("div", {
                className: "drawing-compare-image",
                style: ge ? { opacity: j ? b / 100 : 1 } : void 0,
                children: [/* @__PURE__ */ (0, l.jsxs)("b", { children: [
                  o.drawing.number,
                  " ",
                  o.drawing.version,
                  " · ",
                  ri[o.drawing.role]
                ] }), o.asset.mime === "application/pdf" ? /* @__PURE__ */ (0, l.jsx)("iframe", {
                  sandbox: "",
                  title: o.drawing.title,
                  src: y[o.asset.id]
                }) : /* @__PURE__ */ (0, l.jsx)("img", {
                  src: y[o.asset.id],
                  alt: o.drawing.title + " " + o.drawing.version
                })]
              }, j))
            }),
            /* @__PURE__ */ (0, l.jsx)("p", {
              className: "muted",
              children: "顯示比例依容器調整，只供人工視覺比較，不作尺寸量測或自動驗收。PDF支援並排預覽，疊圖僅支援圖片。"
            }),
            /* @__PURE__ */ (0, l.jsx)("h4", { children: "修改說明" }),
            te.notes.map((o, j) => /* @__PURE__ */ (0, l.jsx)("p", { children: o }, j)),
            /* @__PURE__ */ (0, l.jsx)("h4", { children: "相關待處理事項" }),
            te.issues.length ? te.issues.map((o) => /* @__PURE__ */ (0, l.jsxs)("p", { children: [
              o.title,
              "：",
              o.detail
            ] }, o.id)) : /* @__PURE__ */ (0, l.jsx)("p", { children: "目前沒有登記未結問題。" }),
            /* @__PURE__ */ (0, l.jsx)("button", {
              className: "text-btn",
              disabled: r.archived,
              onClick: () => re("relation", {
                from: "drawing:" + H,
                to: "drawing:" + $,
                note: "人工比對觀察：",
                checkState: "needs_check"
              }),
              children: "記錄比較觀察與待核對事項"
            })
          ] })
        ]
      }),
      /* @__PURE__ */ (0, l.jsxs)("details", {
        className: "wide-card",
        children: [/* @__PURE__ */ (0, l.jsx)("summary", { children: "圖說版本與基準異動紀錄" }), [...x.history].reverse().map((o, j) => /* @__PURE__ */ (0, l.jsxs)("article", {
          className: "journal-card",
          children: [
            /* @__PURE__ */ (0, l.jsx)("b", { children: o.action }),
            /* @__PURE__ */ (0, l.jsxs)("p", { children: [
              o.at,
              " · ",
              o.by
            ] }),
            /* @__PURE__ */ (0, l.jsx)("pre", {
              className: "hub-json",
              children: o.detail
            })
          ]
        }, j))]
      }),
      X && /* @__PURE__ */ (0, l.jsx)("div", {
        className: "modal-backdrop",
        children: /* @__PURE__ */ (0, l.jsxs)("section", {
          className: "modal",
          role: "dialog",
          "aria-modal": "true",
          "aria-label": "圖說版本操作",
          children: [/* @__PURE__ */ (0, l.jsxs)("div", {
            className: "modal-head",
            children: [/* @__PURE__ */ (0, l.jsx)("h2", { children: {
              version: "新增圖說版本",
              relation: "圖說與素材關聯",
              status: "版本狀態",
              adopt: "核定正式基準"
            }[X] }), /* @__PURE__ */ (0, l.jsx)("button", {
              className: "icon-btn",
              disabled: z,
              onClick: () => oe(""),
              "aria-label": "關閉圖說表單",
              children: /* @__PURE__ */ (0, l.jsx)(Sl, { size: 18 })
            })]
          }), /* @__PURE__ */ (0, l.jsxs)("form", {
            onSubmit: (o) => {
              o.preventDefault(), X === "version" && Y("createDrawingVersion", q), X === "status" && Y("updateDrawingStatus", q), X === "relation" && Y("manageAssetRelations", {
                ...q,
                action: q.relationId ? "update" : "create"
              }), X === "adopt" && Y("adoptDrawingBaseline", q);
            },
            children: [
              X === "version" ? /* @__PURE__ */ (0, l.jsxs)(l.Fragment, { children: [
                Q("number", "圖號", !0),
                Q("title", "圖名", !0),
                Q("version", "版本號（例如 R00、R01）", !0),
                Q("reason", "建立／修改原因", !0, !0),
                se("assetId", "來源素材", x.files.map((o) => ({
                  id: o.id,
                  title: o.name
                })), !1),
                se("recordId", "相關工作紀錄", x.records.map((o) => ({
                  id: o.id,
                  title: o.summary
                }))),
                se("role", "依據角色", Object.entries(ri).filter(([o]) => o !== "related").map(([o, j]) => ({
                  id: o,
                  title: j
                })), !1),
                se("status", "初始狀態", [{
                  id: "draft",
                  title: "草稿"
                }, {
                  id: "candidate",
                  title: "待確認候選"
                }], !1)
              ] }) : X === "relation" ? /* @__PURE__ */ (0, l.jsxs)(l.Fragment, { children: [
                se("from", "關聯來源", x.nodes, !1),
                se("to", "關聯對象", x.nodes, !1),
                se("role", "關聯用途", Object.entries(ri).filter(([o]) => o !== "reference").map(([o, j]) => ({
                  id: o,
                  title: j
                })), !1),
                se("checkState", "人工核對狀態", Object.entries(_f).map(([o, j]) => ({
                  id: o,
                  title: j
                })), !1),
                Q("note", "關聯／差異與修改說明", !1, !0)
              ] }) : X === "status" ? /* @__PURE__ */ (0, l.jsxs)(l.Fragment, { children: [se("status", "狀態", Object.entries(kf).filter(([o]) => o !== "adopted").map(([o, j]) => ({
                id: o,
                title: j
              })), !1), Q("reason", "變更原因", !0, !0)] }) : /* @__PURE__ */ (0, l.jsxs)(l.Fragment, { children: [
                /* @__PURE__ */ (0, l.jsxs)("p", { children: [
                  "將 ",
                  q.title,
                  " 設為「",
                  ri[q.role],
                  "」的正式基準。同圖號同角色的原基準會保留為歷史版；其他角色的基準不受影響。"
                ] }),
                /* @__PURE__ */ (0, l.jsx)("p", { children: "請先人工檢查來源、幾何或外觀用途。這是使用者核定，AI不能代為批准。" }),
                Q("reason", "正式採用／變更原因", !0, !0)
              ] }),
              N && /* @__PURE__ */ (0, l.jsx)("p", {
                role: "alert",
                className: "modal-error",
                children: N
              }),
              /* @__PURE__ */ (0, l.jsxs)("div", {
                className: "modal-actions",
                children: [/* @__PURE__ */ (0, l.jsx)("button", {
                  className: "btn",
                  disabled: z,
                  type: "button",
                  onClick: () => oe(""),
                  children: "取消"
                }), /* @__PURE__ */ (0, l.jsx)("button", {
                  className: "btn primary",
                  disabled: z,
                  children: X === "adopt" ? "本人確認採用此基準" : "保存並保留歷史"
                })]
              })
            ]
          })]
        })
      })
    ]
  }) : /* @__PURE__ */ (0, l.jsx)("section", {
    className: "wide-card",
    children: N ? /* @__PURE__ */ (0, l.jsx)("p", {
      role: "alert",
      children: N
    }) : "讀取圖說版本…"
  });
}
var Kx = {
  project: "專案",
  record: "工作紀錄",
  image: "圖片",
  folder: "資料夾"
};
function Jx({ request: r, onChange: h }) {
  const [C, f] = (0, g.useState)(null), [p, k] = (0, g.useState)(!1), [x, A] = (0, g.useState)(""), [N, _] = (0, g.useState)("");
  async function w() {
    k(!0);
    try {
      f(await r("trash", "")), A("");
    } catch (z) {
      A(z.message);
    } finally {
      k(!1);
    }
  }
  (0, g.useEffect)(() => {
    w();
  }, [r]);
  async function G(z, le) {
    let ne = "";
    if (!(le === "purge" && (ne = window.prompt("永久刪除「" + z.title + "」後無法從工作台還原。既有備份與異動歷史仍保留。請輸入「永久刪除」確認。") ?? "", ne !== "永久刪除"))) {
      k(!0), A("");
      try {
        f(await r("trash", "", {
          action: le,
          trashId: z.id,
          projectId: z.projectId,
          projectRevision: z.projectRevision,
          revision: C?.revision,
          key: crypto.randomUUID(),
          confirm: ne
        })), _(le === "restore" ? "已還原，原有資料已保留" : "已永久刪除此項目"), h();
      } catch (I) {
        A(I.message);
        try {
          f(await r("trash", ""));
        } catch {
        }
      } finally {
        k(!1);
      }
    }
  }
  return /* @__PURE__ */ (0, l.jsxs)("section", {
    className: "wide-card recycle-bin",
    children: [
      /* @__PURE__ */ (0, l.jsxs)("div", {
        className: "section-title",
        children: [/* @__PURE__ */ (0, l.jsxs)("div", { children: [/* @__PURE__ */ (0, l.jsxs)("h1", { children: [/* @__PURE__ */ (0, l.jsx)(yl, { size: 24 }), "垃圾桶"] }), /* @__PURE__ */ (0, l.jsx)("p", { children: "刪除的專案、圖片和紀錄會先留在這裡，可以還原。永久刪除需再次確認。" })] }), /* @__PURE__ */ (0, l.jsxs)("button", {
          className: "btn",
          disabled: p,
          onClick: () => {
            w();
          },
          children: [/* @__PURE__ */ (0, l.jsx)(Wa, { size: 16 }), "重新整理"]
        })]
      }),
      x && /* @__PURE__ */ (0, l.jsx)("p", {
        role: "alert",
        className: "modal-error",
        children: x
      }),
      N && /* @__PURE__ */ (0, l.jsx)("p", {
        role: "status",
        children: N
      }),
      C && !C.items.length && /* @__PURE__ */ (0, l.jsx)("div", {
        className: "empty",
        children: "垃圾桶是空的。"
      }),
      !C && !x && /* @__PURE__ */ (0, l.jsx)("p", { children: "讀取中…" }),
      C?.items.map((z) => /* @__PURE__ */ (0, l.jsxs)("article", {
        className: "journal-card",
        children: [
          /* @__PURE__ */ (0, l.jsx)("span", {
            className: "status",
            children: Kx[z.kind]
          }),
          /* @__PURE__ */ (0, l.jsx)("h3", { children: z.title }),
          /* @__PURE__ */ (0, l.jsxs)("p", { children: [
            z.projectName,
            " · ",
            new Date(z.at).toLocaleString("zh-TW", { timeZone: "Asia/Taipei" })
          ] }),
          z.retainUntil && /* @__PURE__ */ (0, l.jsxs)("p", {
            className: "muted",
            children: ["至少保留至 ", new Date(z.retainUntil).toLocaleDateString("zh-TW")]
          }),
          z.parentDeleted && /* @__PURE__ */ (0, l.jsx)("p", {
            className: "muted",
            children: "請先還原所屬專案，再處理此項目。"
          }),
          z.purging && /* @__PURE__ */ (0, l.jsx)("p", {
            role: "status",
            children: "原圖永久刪除清理尚未完成；可以重試清理，無法還原。"
          }),
          !z.canPurge && /* @__PURE__ */ (0, l.jsx)("p", {
            className: "muted",
            children: "此專案連結動畫專業資料，或仍有圖片／垃圾桶項目。請保留於垃圾桶，或還原後先整理內容。"
          }),
          /* @__PURE__ */ (0, l.jsxs)("div", {
            className: "heading-actions",
            children: [/* @__PURE__ */ (0, l.jsxs)("button", {
              className: "btn",
              disabled: p || z.parentDeleted || z.purging,
              onClick: () => {
                G(z, "restore");
              },
              children: [/* @__PURE__ */ (0, l.jsx)(Of, { size: 16 }), "還原"]
            }), /* @__PURE__ */ (0, l.jsxs)("button", {
              className: "btn danger",
              disabled: p || z.parentDeleted || !z.canPurge || !!z.retainUntil && Date.now() < Date.parse(z.retainUntil),
              onClick: () => {
                G(z, "purge");
              },
              children: [/* @__PURE__ */ (0, l.jsx)(yl, { size: 16 }), z.purging ? "重試永久刪除" : "永久刪除"]
            })]
          })
        ]
      }, z.id))
    ]
  });
}
var la = {
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
}, nd = (r) => new Date(r).toLocaleString("zh-TW", {
  timeZone: "Asia/Taipei",
  month: "numeric",
  day: "numeric",
  hour: "2-digit",
  minute: "2-digit"
});
function Cf({ url: r, children: h }) {
  return /^https?:\/\//i.test(r) ? /* @__PURE__ */ (0, l.jsxs)("a", {
    href: r,
    target: "_blank",
    rel: "noopener noreferrer",
    children: [h, " ↗"]
  }) : /* @__PURE__ */ (0, l.jsxs)("span", { children: [h, /* @__PURE__ */ (0, l.jsx)("small", {
    className: "preserve-text",
    children: r
  })] });
}
function Ix({ nativeTransport: r } = {}) {
  const [h, C] = (0, g.useState)([]), [f, p] = (0, g.useState)(null), [k, x] = (0, g.useState)("overview"), [A, N] = (0, g.useState)(""), [_, w] = (0, g.useState)("resume"), [G, z] = (0, g.useState)(""), [le, ne] = (0, g.useState)(!0), [I, X] = (0, g.useState)(!1), [oe, q] = (0, g.useState)(""), [ie, H] = (0, g.useState)(""), [F, $] = (0, g.useState)(""), [pe, te] = (0, g.useState)(!1), [P, y] = (0, g.useState)(!1), [ee, ge] = (0, g.useState)(""), [me, b] = (0, g.useState)({}), [ae, K] = (0, g.useState)(!1), [Y, Q] = (0, g.useState)(!1), se = (0, g.useRef)(""), re = (0, g.useRef)(0), _e = (0, g.useRef)(""), o = (0, g.useRef)(!1);
  _e.current = ee;
  const j = (0, g.useCallback)((d) => {
    o.current = d;
  }, []), R = (0, g.useCallback)(async (d, B, ue) => {
    const He = r ? await r(d, B, ue) : await fetch("/api/" + d + B, {
      cache: "no-store",
      ...ue ? {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(ue)
      } : {}
    });
    if (!He.headers.get("content-type")?.includes("application/json")) throw Error("請先登入立之雲端庫");
    const T = await He.json();
    if (!He.ok) throw Error(T.error || "讀取失敗");
    return T;
  }, [r]), W = (0, g.useCallback)(async (d = se.current) => {
    const B = ++re.current;
    try {
      const ue = await R("workspace", "?view=managed"), He = d ? await R("workspace", "?view=managed&id=" + encodeURIComponent(d)) : null;
      if (B !== re.current) return;
      C(ue), _e.current || p(He), q("");
    } catch (ue) {
      B === re.current && q(ue.message);
    } finally {
      B === re.current && ne(!1);
    }
  }, [R]);
  (0, g.useEffect)(() => {
    W();
    const d = setInterval(() => {
      !_e.current && !o.current && W();
    }, 3e4);
    return () => clearInterval(d);
  }, [W]), (0, g.useEffect)(() => {
    if (!ee) return;
    const d = (B) => B.preventDefault();
    return window.addEventListener("beforeunload", d), () => window.removeEventListener("beforeunload", d);
  }, [ee]), (0, g.useEffect)(() => {
    if (!ie) return;
    const d = setTimeout(() => H(""), 4500);
    return () => clearTimeout(d);
  }, [ie]);
  async function ce(d) {
    se.current = d, p(null), ne(!0), x("overview"), K(!1), await W(d);
  }
  function he() {
    o.current && !window.confirm("有尚未保存的圖片表單，確定離開？") || (o.current = !1, se.current = "", re.current++, p(null), N(""), K(!1), Q(!1), W(""));
  }
  function de(d, B = {}) {
    q(""), b({
      key: crypto.randomUUID(),
      type: "software",
      status: d === "record" ? "NOT_TESTED" : "PLANNED",
      mode: "not_run",
      stageId: f?.stages[0]?.id ?? "",
      evidenceIds: [],
      sourceIds: [],
      ...B
    }), ge(d);
  }
  async function Ge(d, B) {
    if (!(!f && d !== "createManagedProject")) {
      re.current++, X(!0);
      try {
        const ue = await R("workspace", "", {
          action: d,
          id: f?.id,
          revision: f?.revision,
          args: B
        });
        return se.current = ue.id, p(ue), ge(""), _e.current = "", H("已保存並讀回最新專案"), await W(ue.id), ue;
      } catch (ue) {
        q(ue.message);
      } finally {
        X(!1);
      }
    }
  }
  async function ze(d, B) {
    if (!(!f || I) && !(o.current && !window.confirm("有尚未儲存的修改，確定放棄？")) && window.confirm("將此" + {
      project: "專案",
      record: "紀錄",
      image: "圖片"
    }[d] + "移到垃圾桶？之後可以還原。")) {
      o.current = !1, X(!0), re.current++;
      try {
        const ue = await R("trash", "");
        await R("trash", "", {
          action: "trash",
          kind: d,
          projectId: f.id,
          targetId: B,
          projectRevision: f.revision,
          revision: ue.revision,
          key: crypto.randomUUID()
        }), d === "project" && (se.current = "", p(null), Q(!0)), await W(se.current), H("已移到垃圾桶，可隨時還原");
      } catch (ue) {
        q(ue.message);
      } finally {
        X(!1);
      }
    }
  }
  async function dt(d) {
    d.preventDefault(), await Ge({
      create: "createManagedProject",
      stage: "createProjectStage",
      task: me.taskId ? "updateProjectTask" : "createProjectTask",
      record: "appendWorkRecord",
      artifact: "registerProjectArtifact",
      source: "registerProjectSource",
      issue: "reportProjectIssue",
      resolve: "resolveProjectIssue",
      edit: "updateManagedProject",
      restore: "restoreProjectBackup"
    }[ee], {
      ...me,
      ...ee === "stage" ? { stageKey: me.stageKey || me.key } : ee === "task" ? { taskKey: me.taskKey || me.key } : ee === "artifact" ? { artifactKey: me.artifactKey || me.key } : ee === "source" ? { sourceKey: me.sourceKey || me.key } : ee === "issue" ? { issueKey: me.issueKey || me.key } : {}
    });
  }
  async function Xe() {
    if (f) {
      X(!0);
      try {
        const d = await R("workspace", "?view=managed&id=" + f.id);
        let B = null;
        if (f.animation) {
          const T = await R("works", "?id=" + f.animation.workId), we = [];
          for (const Ze of f.animation.episodes) we.push(await R("projects", "?id=" + Ze.id));
          B = {
            work: T.work,
            episodes: we
          };
        }
        const ue = URL.createObjectURL(new Blob([JSON.stringify({
          schemaVersion: 2,
          exportedAt: (/* @__PURE__ */ new Date()).toISOString(),
          project: d,
          animation: B
        }, null, 2)], { type: "application/json" })), He = document.createElement("a");
        He.href = ue, He.download = f.title.replace(/[\\/:*?"<>|]/g, "_") + "_專案備份.json", He.click(), setTimeout(() => URL.revokeObjectURL(ue), 1e3);
      } catch (d) {
        q(d.message);
      } finally {
        X(!1);
      }
    }
  }
  function Me(d) {
    f?.workId && (w(d), N(f.workId));
  }
  function ve(d, B, ue = !1, He = !1) {
    return /* @__PURE__ */ (0, l.jsxs)("label", {
      className: "form-field",
      children: [B, He ? /* @__PURE__ */ (0, l.jsx)("textarea", {
        rows: 3,
        required: ue,
        maxLength: d === "snapshot" ? 6e4 : 12e3,
        value: me[d] ?? "",
        onChange: (T) => b({
          ...me,
          [d]: T.target.value
        })
      }) : /* @__PURE__ */ (0, l.jsx)("input", {
        required: ue,
        maxLength: d === "sha256" ? 64 : 2e3,
        value: me[d] ?? "",
        onChange: (T) => b({
          ...me,
          [d]: T.target.value
        })
      })]
    }, d);
  }
  function qe(d, B, ue) {
    return /* @__PURE__ */ (0, l.jsxs)("label", {
      className: "form-field",
      children: [B, /* @__PURE__ */ (0, l.jsx)("select", {
        value: me[d] ?? "",
        onChange: (He) => b({
          ...me,
          [d]: He.target.value,
          ...d === "stageId" ? { taskId: "" } : {}
        }),
        children: ue.map(([He, T]) => /* @__PURE__ */ (0, l.jsx)("option", {
          value: He,
          children: T
        }, He))
      })]
    });
  }
  function lt(d, B) {
    return /* @__PURE__ */ (0, l.jsxs)("fieldset", {
      className: "proof-picker",
      children: [/* @__PURE__ */ (0, l.jsx)("legend", { children: d === "evidenceIds" ? "成果證據" : "已讀來源" }), B.length ? B.map((ue) => /* @__PURE__ */ (0, l.jsxs)("label", { children: [/* @__PURE__ */ (0, l.jsx)("input", {
        type: "checkbox",
        checked: (me[d] ?? []).includes(ue.id),
        onChange: (He) => b({
          ...me,
          [d]: He.target.checked ? [...me[d] ?? [], ue.id] : (me[d] ?? []).filter((T) => T !== ue.id)
        })
      }), ue.title] }, ue.id)) : /* @__PURE__ */ (0, l.jsx)("small", { children: "先在成果分頁登記，僅貼連結不能作為已檢查證據。" })]
    });
  }
  return A && !ae ? /* @__PURE__ */ (0, l.jsxs)(l.Fragment, { children: [/* @__PURE__ */ (0, l.jsxs)("div", {
    className: "project-return",
    children: [/* @__PURE__ */ (0, l.jsxs)("button", {
      className: "text-btn",
      onClick: () => {
        o.current && !window.confirm("有未儲存的動畫或模型修改，確定離開？") || (o.current = !1, N(""), W());
      },
      children: [
        /* @__PURE__ */ (0, l.jsx)(of, { size: 16 }),
        "返回 ",
        f?.title ?? "專案清單"
      ]
    }), /* @__PURE__ */ (0, l.jsx)("button", {
      className: "text-btn",
      onClick: () => {
        o.current && !window.confirm("有未儲存的動畫或模型修改，確定開啟員工必知？") || (o.current = !1, K(!0));
      },
      children: "員工必知"
    })]
  }), /* @__PURE__ */ (0, l.jsx)(Ux, {
    nativeTransport: r,
    initialWorkId: A === "legacy" ? void 0 : A,
    initialTab: _,
    onDirtyChange: j
  }, A + _)] }) : /* @__PURE__ */ (0, l.jsxs)("div", {
    className: "project-hub",
    children: [
      /* @__PURE__ */ (0, l.jsxs)("header", {
        className: "hub-header",
        children: [
          /* @__PURE__ */ (0, l.jsxs)("div", {
            className: "hub-brand",
            children: [/* @__PURE__ */ (0, l.jsx)(Jr, { size: 22 }), /* @__PURE__ */ (0, l.jsx)("b", { children: "製作工作台" })]
          }),
          /* @__PURE__ */ (0, l.jsxs)("button", {
            className: "btn",
            disabled: I || !!ee,
            "aria-pressed": Y,
            onClick: () => {
              o.current && !window.confirm("有未儲存修改，確定開啟垃圾桶？") || (o.current = !1, Q((d) => !d), K(!1));
            },
            children: [/* @__PURE__ */ (0, l.jsx)(yl, { size: 16 }), "垃圾桶"]
          }),
          /* @__PURE__ */ (0, l.jsx)("button", {
            className: "btn" + (ae ? " primary" : ""),
            type: "button",
            "aria-pressed": ae,
            onClick: () => {
              Q(!1), K((d) => !d);
            },
            children: "員工必知"
          }),
          /* @__PURE__ */ (0, l.jsx)("button", {
            className: "icon-btn",
            "aria-label": "重新整理",
            disabled: le || I || !!ee,
            onClick: () => {
              W();
            },
            children: /* @__PURE__ */ (0, l.jsx)(Wa, { size: 18 })
          })
        ]
      }),
      /* @__PURE__ */ (0, l.jsxs)("main", {
        className: "hub-main",
        children: [
          oe && /* @__PURE__ */ (0, l.jsxs)("div", {
            role: "alert",
            className: "error-banner",
            children: [oe, /* @__PURE__ */ (0, l.jsx)("button", {
              "aria-label": "關閉錯誤",
              onClick: () => q(""),
              children: /* @__PURE__ */ (0, l.jsx)(Sl, { size: 16 })
            })]
          }),
          se.current && /* @__PURE__ */ (0, l.jsxs)("button", {
            className: "text-btn hub-back",
            disabled: I,
            onClick: he,
            children: [/* @__PURE__ */ (0, l.jsx)(of, { size: 16 }), "我的專案"]
          }),
          Y ? /* @__PURE__ */ (0, l.jsx)(Jx, {
            request: R,
            onChange: () => {
              W();
            }
          }) : ae ? /* @__PURE__ */ (0, l.jsx)(Lx, {}) : le ? /* @__PURE__ */ (0, l.jsx)("div", {
            className: "empty",
            children: "讀取專案中…"
          }) : f ? /* @__PURE__ */ (0, l.jsxs)(l.Fragment, { children: [
            /* @__PURE__ */ (0, l.jsxs)("div", {
              className: "page-heading",
              children: [/* @__PURE__ */ (0, l.jsxs)("div", { children: [
                /* @__PURE__ */ (0, l.jsxs)("div", {
                  className: "eyebrow",
                  children: [
                    As[f.kind],
                    " · ",
                    la[f.status]
                  ]
                }),
                /* @__PURE__ */ (0, l.jsx)("h1", { children: f.title }),
                /* @__PURE__ */ (0, l.jsx)("p", { children: f.objective || "先填寫這個專案的目標。" })
              ] }), /* @__PURE__ */ (0, l.jsxs)("div", {
                className: "heading-actions",
                children: [
                  /* @__PURE__ */ (0, l.jsxs)("button", {
                    className: "btn",
                    disabled: I,
                    onClick: () => {
                      Xe();
                    },
                    children: [/* @__PURE__ */ (0, l.jsx)(dn, { size: 15 }), "匯出備份"]
                  }),
                  /* @__PURE__ */ (0, l.jsx)("button", {
                    className: "icon-btn bordered",
                    "aria-label": f.archived ? "還原專案" : "封存專案",
                    title: f.archived ? "還原專案" : "封存專案",
                    disabled: I,
                    onClick: () => {
                      Ge("updateManagedProject", {
                        key: crypto.randomUUID(),
                        status: f.archived ? "in_progress" : "archived"
                      });
                    },
                    children: /* @__PURE__ */ (0, l.jsx)(Af, { size: 17 })
                  }),
                  /* @__PURE__ */ (0, l.jsxs)("button", {
                    className: "btn danger",
                    disabled: I,
                    onClick: () => {
                      ze("project", f.id);
                    },
                    children: [/* @__PURE__ */ (0, l.jsx)(yl, { size: 16 }), "刪除專案"]
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
                ["records", "工作紀錄"],
                ["assets", "素材"],
                ["drawings", "圖說版本"],
                ["models", "3D 模型"],
                ["images", "圖片（舊）"],
                ["artifacts", "成果"],
                ["issues", "問題"]
              ].map(([d, B]) => /* @__PURE__ */ (0, l.jsxs)("button", {
                className: k === d ? "active" : "",
                "aria-current": k === d ? "page" : void 0,
                disabled: I,
                onClick: () => {
                  o.current && !window.confirm("有尚未儲存的圖片表單，確定切換？") || (o.current = !1, z(""), x(d));
                },
                children: [B, d === "issues" && f.issues.some((ue) => ue.status === "open") ? " · " + f.issues.filter((ue) => ue.status === "open").length : ""]
              }, d))
            }),
            k === "overview" ? /* @__PURE__ */ (0, l.jsxs)(l.Fragment, { children: [
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
                      la[f.handoff.lastWork.status],
                      " · ",
                      la[f.handoff.lastWork.mode]
                    ]
                  }),
                  /* @__PURE__ */ (0, l.jsx)("div", {
                    style: { marginTop: 18 },
                    children: /* @__PURE__ */ (0, l.jsxs)("button", {
                      className: "btn primary",
                      disabled: f.archived,
                      onClick: () => de("record"),
                      children: [/* @__PURE__ */ (0, l.jsx)(Ft, { size: 16 }), "記錄這次工作"]
                    })
                  })
                ]
              }),
              f.animation && /* @__PURE__ */ (0, l.jsxs)("div", {
                className: "hub-module-grid",
                children: [/* @__PURE__ */ (0, l.jsxs)("button", {
                  className: "module-card",
                  onClick: () => Me("resume"),
                  children: [
                    /* @__PURE__ */ (0, l.jsx)(ui, { size: 26 }),
                    /* @__PURE__ */ (0, l.jsx)("h3", { children: "動畫製作" }),
                    /* @__PURE__ */ (0, l.jsxs)("p", { children: [f.animation.episodes.length, " 集 · 劇本、鏡頭、影格、OP／ED"] }),
                    /* @__PURE__ */ (0, l.jsx)("span", { children: "開啟動畫流程 →" })
                  ]
                }), /* @__PURE__ */ (0, l.jsxs)("button", {
                  className: "module-card",
                  onClick: () => Me("models"),
                  children: [
                    /* @__PURE__ */ (0, l.jsx)(Mf, { size: 26 }),
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
                      onClick: () => de("edit", {
                        name: f.title,
                        description: f.objective,
                        status: f.status
                      }),
                      children: "編輯專案"
                    })]
                  }),
                  /* @__PURE__ */ (0, l.jsxs)("p", { children: [
                    f.managedTasks.filter((d) => d.status !== "PASS").length,
                    " 項工作未完成 · ",
                    f.issues.filter((d) => d.status === "open").length,
                    " 項問題"
                  ] }),
                  /* @__PURE__ */ (0, l.jsx)("h3", { children: "操作限制" }),
                  f.restrictions.map((d, B) => /* @__PURE__ */ (0, l.jsx)("p", {
                    className: "muted",
                    children: d
                  }, B)),
                  /* @__PURE__ */ (0, l.jsxs)("details", { children: [
                    /* @__PURE__ */ (0, l.jsx)("summary", { children: "進階資訊與 AI 交接資料" }),
                    /* @__PURE__ */ (0, l.jsxs)("p", { children: [
                      "紀錄版本 ",
                      f.revision,
                      " · 更新於 ",
                      nd(f.updatedAt)
                    ] }),
                    /* @__PURE__ */ (0, l.jsx)("pre", {
                      className: "hub-json",
                      children: JSON.stringify(f.handoff, null, 2)
                    }),
                    /* @__PURE__ */ (0, l.jsx)("h3", { children: "異動紀錄" }),
                    [...f.history].reverse().map((d, B) => /* @__PURE__ */ (0, l.jsxs)("p", {
                      className: "muted",
                      children: [
                        nd(d.at),
                        " · ",
                        d.by,
                        " · ",
                        d.action
                      ]
                    }, B)),
                    /* @__PURE__ */ (0, l.jsxs)("label", {
                      className: "form-field",
                      children: ["回復本專案的通用資料備份", /* @__PURE__ */ (0, l.jsx)("input", {
                        type: "file",
                        accept: "application/json,.json",
                        disabled: I,
                        onChange: async (d) => {
                          try {
                            const B = d.target.files?.[0];
                            if (!B) return;
                            if (B.size > 24e6) throw Error("備份過大");
                            const ue = JSON.parse(await B.text());
                            if (ue.schemaVersion !== 2 || ue.project?.id !== f.id) throw Error("請選取此專案的 v2 備份");
                            de("restore", { backup: ue.project });
                          } catch (B) {
                            q(B.message);
                          }
                          d.target.value = "";
                        }
                      })]
                    })
                  ] })
                ]
              })
            ] }) : k === "stages" ? /* @__PURE__ */ (0, l.jsxs)(l.Fragment, { children: [/* @__PURE__ */ (0, l.jsxs)("div", {
              className: "section-title",
              children: [/* @__PURE__ */ (0, l.jsx)("h2", { children: "階段與工作項目" }), /* @__PURE__ */ (0, l.jsxs)("button", {
                className: "btn",
                disabled: f.archived,
                onClick: () => de("stage"),
                children: [/* @__PURE__ */ (0, l.jsx)(Ft, { size: 16 }), "新增階段"]
              })]
            }), f.stages.map((d) => /* @__PURE__ */ (0, l.jsxs)("section", {
              className: "wide-card stage-work-card",
              children: [/* @__PURE__ */ (0, l.jsxs)("div", {
                className: "section-title",
                children: [/* @__PURE__ */ (0, l.jsxs)("div", { children: [/* @__PURE__ */ (0, l.jsxs)("h3", { children: [
                  d.key,
                  " · ",
                  d.title
                ] }), /* @__PURE__ */ (0, l.jsx)("span", {
                  className: "status",
                  children: la[d.status]
                })] }), /* @__PURE__ */ (0, l.jsx)("button", {
                  className: "text-btn",
                  disabled: f.archived,
                  onClick: () => de("task", { stageId: d.id }),
                  children: "新增工作"
                })]
              }), f.managedTasks.filter((B) => B.stageId === d.id).map((B) => /* @__PURE__ */ (0, l.jsxs)("article", {
                className: "task-card",
                children: [
                  /* @__PURE__ */ (0, l.jsxs)("div", { children: [
                    /* @__PURE__ */ (0, l.jsx)("b", { children: B.title }),
                    /* @__PURE__ */ (0, l.jsx)("small", { children: la[B.status] }),
                    B.nextAction && /* @__PURE__ */ (0, l.jsxs)("p", { children: ["下一步：", B.nextAction] })
                  ] }),
                  /* @__PURE__ */ (0, l.jsx)("button", {
                    className: "text-btn",
                    disabled: f.archived,
                    onClick: () => de("record", {
                      stageId: d.id,
                      taskId: B.id,
                      summary: B.title
                    }),
                    children: "回報"
                  }),
                  /* @__PURE__ */ (0, l.jsx)("button", {
                    className: "text-btn",
                    disabled: f.archived,
                    onClick: () => de("task", {
                      ...B,
                      key: crypto.randomUUID(),
                      taskId: B.id
                    }),
                    children: "編輯"
                  })
                ]
              }, B.id))]
            }, d.id))] }) : k === "records" ? /* @__PURE__ */ (0, l.jsxs)("section", {
              className: "wide-card",
              children: [
                /* @__PURE__ */ (0, l.jsxs)("div", {
                  className: "section-title",
                  children: [/* @__PURE__ */ (0, l.jsxs)("div", { children: [/* @__PURE__ */ (0, l.jsx)("h2", { children: "執行紀錄" }), /* @__PURE__ */ (0, l.jsx)("p", { children: "計畫、模擬與實測分開保存；沒有證據不會轉成 PASS。" })] }), /* @__PURE__ */ (0, l.jsxs)("button", {
                    className: "btn primary",
                    disabled: f.archived,
                    onClick: () => de("record"),
                    children: [/* @__PURE__ */ (0, l.jsx)(Ft, { size: 16 }), "新增紀錄"]
                  })]
                }),
                !f.records.length && /* @__PURE__ */ (0, l.jsx)("div", {
                  className: "empty",
                  children: "還沒有工作紀錄。"
                }),
                [...f.records].reverse().map((d) => /* @__PURE__ */ (0, l.jsxs)("article", {
                  className: "journal-card",
                  children: [
                    /* @__PURE__ */ (0, l.jsxs)("div", {
                      className: "journal-meta",
                      children: [
                        /* @__PURE__ */ (0, l.jsx)("span", {
                          className: "result-badge " + d.status.toLowerCase(),
                          children: la[d.status]
                        }),
                        /* @__PURE__ */ (0, l.jsxs)("span", { children: [
                          la[d.mode],
                          " · ",
                          d.scope
                        ] }),
                        /* @__PURE__ */ (0, l.jsxs)("small", { children: [
                          nd(d.at),
                          " · ",
                          d.by
                        ] })
                      ]
                    }),
                    /* @__PURE__ */ (0, l.jsx)("h3", { children: d.summary }),
                    /* @__PURE__ */ (0, l.jsxs)("dl", { children: [
                      /* @__PURE__ */ (0, l.jsx)("dt", { children: "方法與結果" }),
                      /* @__PURE__ */ (0, l.jsxs)("dd", { children: [
                        d.method,
                        `
`,
                        d.result
                      ] }),
                      /* @__PURE__ */ (0, l.jsx)("dt", { children: "證據" }),
                      /* @__PURE__ */ (0, l.jsx)("dd", { children: [...d.evidenceIds.map((B) => f.artifacts.find((ue) => ue.id === B)?.title), ...d.sourceIds.map((B) => f.sources.find((ue) => ue.id === B)?.title)].filter(Boolean).join("、") || "未附可核對證據" }),
                      /* @__PURE__ */ (0, l.jsx)("dt", { children: "下一步" }),
                      /* @__PURE__ */ (0, l.jsx)("dd", { children: d.nextStep }),
                      d.limitations && /* @__PURE__ */ (0, l.jsxs)(l.Fragment, { children: [/* @__PURE__ */ (0, l.jsx)("dt", { children: "限制" }), /* @__PURE__ */ (0, l.jsx)("dd", { children: d.limitations })] })
                    ] }),
                    /* @__PURE__ */ (0, l.jsxs)("button", {
                      className: "text-btn danger",
                      disabled: I,
                      onClick: () => {
                        ze("record", d.id);
                      },
                      children: [/* @__PURE__ */ (0, l.jsx)(yl, { size: 15 }), "刪除紀錄"]
                    }),
                    /* @__PURE__ */ (0, l.jsxs)("button", {
                      className: "text-btn",
                      onClick: () => {
                        z(d.id), x("images");
                      },
                      children: ["圖片 · ", f.images.filter((B) => B.recordId === d.id).length]
                    }),
                    d.requestedStatus !== d.status && /* @__PURE__ */ (0, l.jsxs)("p", {
                      className: "modal-error",
                      children: [
                        "原回報 ",
                        d.requestedStatus,
                        "；",
                        d.validationNote
                      ]
                    })
                  ]
                }, d.id))
              ]
            }) : k === "models" ? /* @__PURE__ */ (0, l.jsxs)("section", {
              className: "wide-card",
              children: [/* @__PURE__ */ (0, l.jsx)("h2", { children: "3D 模型" }), f.animation ? /* @__PURE__ */ (0, l.jsx)("button", {
                className: "btn primary",
                onClick: () => Me("models"),
                children: "開啟原有模型流程"
              }) : /* @__PURE__ */ (0, l.jsxs)(l.Fragment, { children: [/* @__PURE__ */ (0, l.jsx)("p", { children: "將模型的成果位置登記在「成果」，並於圖說版本建立素材關聯。本階段不重新開發3D檢視器。" }), /* @__PURE__ */ (0, l.jsx)("button", {
                className: "btn",
                onClick: () => x("artifacts"),
                children: "查看／登記模型成果"
              })] })]
            }) : k === "drawings" ? /* @__PURE__ */ (0, l.jsx)(Zx, {
              project: f,
              transport: r,
              onUpdated: () => {
                W();
              },
              onDirty: j,
              onBusy: X
            }) : k === "assets" ? /* @__PURE__ */ (0, l.jsx)(Xx, {
              project: f,
              transport: r,
              onUpdated: () => {
                W();
              },
              onDirty: j,
              onBusy: X
            }) : k === "images" ? /* @__PURE__ */ (0, l.jsx)(Vx, {
              project: {
                ...f,
                images: f.images.filter((d) => [
                  "image/png",
                  "image/jpeg",
                  "image/webp"
                ].includes(d.mime))
              },
              transport: r,
              onTrash: (d) => {
                ze("image", d);
              },
              recordFilter: G,
              onDirty: j,
              onBusy: X,
              onSaved: (d) => {
                re.current++, p(d);
              }
            }, f.id + G) : k === "artifacts" ? /* @__PURE__ */ (0, l.jsxs)("section", {
              className: "wide-card",
              children: [
                /* @__PURE__ */ (0, l.jsxs)("div", {
                  className: "section-title",
                  children: [/* @__PURE__ */ (0, l.jsx)("h2", { children: "成果與來源" }), /* @__PURE__ */ (0, l.jsxs)("div", {
                    className: "heading-actions",
                    children: [/* @__PURE__ */ (0, l.jsx)("button", {
                      className: "btn",
                      disabled: f.archived,
                      onClick: () => de("source"),
                      children: "登記來源"
                    }), /* @__PURE__ */ (0, l.jsxs)("button", {
                      className: "btn primary",
                      disabled: f.archived,
                      onClick: () => de("artifact"),
                      children: [/* @__PURE__ */ (0, l.jsx)(Ft, { size: 16 }), "登記成果"]
                    })]
                  })]
                }),
                !f.artifacts.length && /* @__PURE__ */ (0, l.jsx)("p", {
                  className: "muted",
                  children: "尚無成果；檔案位置只是引用，需檢查內容及雜湊才能作為 PASS 證據。"
                }),
                f.artifacts.map((d) => /* @__PURE__ */ (0, l.jsxs)("article", {
                  className: "journal-card",
                  children: [
                    /* @__PURE__ */ (0, l.jsx)("h3", { children: /* @__PURE__ */ (0, l.jsx)(Cf, {
                      url: d.location,
                      children: d.title
                    }) }),
                    /* @__PURE__ */ (0, l.jsxs)("p", { children: [
                      d.version,
                      " · ",
                      d.availability === "inspected" ? "已檢查（執行者回報）" : "僅登記位置"
                    ] }),
                    /* @__PURE__ */ (0, l.jsx)("p", {
                      className: "preserve-text",
                      children: d.inspection
                    }),
                    /* @__PURE__ */ (0, l.jsxs)("details", { children: [/* @__PURE__ */ (0, l.jsx)("summary", { children: "版本與雜湊" }), /* @__PURE__ */ (0, l.jsx)("code", { children: d.sha256 || "未提供" })] })
                  ]
                }, d.id)),
                /* @__PURE__ */ (0, l.jsx)("h3", { children: "資料來源" }),
                f.sources.map((d) => /* @__PURE__ */ (0, l.jsxs)("article", {
                  className: "journal-card",
                  children: [
                    /* @__PURE__ */ (0, l.jsx)("b", { children: /* @__PURE__ */ (0, l.jsx)(Cf, {
                      url: d.location,
                      children: d.title
                    }) }),
                    /* @__PURE__ */ (0, l.jsxs)("p", { children: [
                      d.readStatus === "read" ? "已讀內容快照" : "未讀，只登記連結",
                      " · ",
                      d.version
                    ] }),
                    /* @__PURE__ */ (0, l.jsx)("p", { children: d.observation }),
                    /* @__PURE__ */ (0, l.jsxs)("details", { children: [
                      /* @__PURE__ */ (0, l.jsx)("summary", { children: "查看保存的來源內容" }),
                      /* @__PURE__ */ (0, l.jsx)("pre", {
                        className: "hub-json",
                        children: d.snapshot || "尚未讀取"
                      }),
                      /* @__PURE__ */ (0, l.jsx)("code", { children: d.sha256 })
                    ] })
                  ]
                }, d.id))
              ]
            }) : /* @__PURE__ */ (0, l.jsxs)("section", {
              className: "wide-card",
              children: [
                /* @__PURE__ */ (0, l.jsxs)("div", {
                  className: "section-title",
                  children: [/* @__PURE__ */ (0, l.jsx)("h2", { children: "問題與阻礙" }), /* @__PURE__ */ (0, l.jsx)("button", {
                    className: "btn primary",
                    disabled: f.archived,
                    onClick: () => de("issue"),
                    children: "新增問題"
                  })]
                }),
                !f.issues.length && /* @__PURE__ */ (0, l.jsx)("div", {
                  className: "empty",
                  children: "尚未登記問題。"
                }),
                f.issues.map((d) => /* @__PURE__ */ (0, l.jsxs)("article", {
                  className: "journal-card",
                  children: [
                    /* @__PURE__ */ (0, l.jsx)("span", {
                      className: "status",
                      children: d.status === "open" ? "待處理" : "已記錄解法"
                    }),
                    /* @__PURE__ */ (0, l.jsx)("h3", { children: d.title }),
                    /* @__PURE__ */ (0, l.jsx)("p", {
                      className: "preserve-text",
                      children: d.detail
                    }),
                    d.resolution && /* @__PURE__ */ (0, l.jsx)("p", {
                      className: "preserve-text",
                      children: d.resolution
                    }),
                    d.status === "open" && /* @__PURE__ */ (0, l.jsx)("button", {
                      className: "btn",
                      disabled: f.archived,
                      onClick: () => de("resolve", { issueId: d.id }),
                      children: "填寫處理結果"
                    })
                  ]
                }, d.id))
              ]
            })
          ] }) : /* @__PURE__ */ (0, l.jsxs)(l.Fragment, { children: [/* @__PURE__ */ (0, l.jsxs)("div", {
            className: "page-heading",
            children: [/* @__PURE__ */ (0, l.jsxs)("div", { children: [
              /* @__PURE__ */ (0, l.jsx)("div", {
                className: "eyebrow",
                children: "立之雲端庫"
              }),
              /* @__PURE__ */ (0, l.jsx)("h1", { children: P ? "專案範本" : "我的專案" }),
              /* @__PURE__ */ (0, l.jsx)("p", { children: "把目標、過程和成果放在同一個專案裡。" })
            ] }), /* @__PURE__ */ (0, l.jsxs)("div", {
              className: "heading-actions",
              children: [/* @__PURE__ */ (0, l.jsx)("button", {
                className: "btn",
                onClick: () => y(!P),
                children: P ? "我的專案" : "專案範本"
              }), /* @__PURE__ */ (0, l.jsxs)("button", {
                className: "btn primary",
                onClick: () => de("create"),
                children: [/* @__PURE__ */ (0, l.jsx)(Ft, { size: 17 }), "建立專案"]
              })]
            })]
          }), P ? /* @__PURE__ */ (0, l.jsx)("div", {
            className: "hub-project-grid",
            children: Object.entries(As).map(([d, B]) => /* @__PURE__ */ (0, l.jsxs)("button", {
              className: "hub-project-card",
              onClick: () => de("create", { type: d }),
              children: [
                /* @__PURE__ */ (0, l.jsx)(Jr, { size: 24 }),
                /* @__PURE__ */ (0, l.jsx)("h2", { children: B }),
                /* @__PURE__ */ (0, l.jsx)("p", { children: d === "animation" ? "集數、共用模型與既有動畫專業流程。" : d === "model" ? "八個模型工作階段，保存來源、候選、檢查與交接。" : d === "software" ? "需求、設計、實作、測試、發布與維護。" : "自訂階段、任務、工作紀錄及交付。" }),
                /* @__PURE__ */ (0, l.jsx)("span", { children: "使用範本 →" })
              ]
            }, d))
          }) : /* @__PURE__ */ (0, l.jsxs)(l.Fragment, { children: [
            /* @__PURE__ */ (0, l.jsxs)("div", {
              className: "hub-filter",
              children: [/* @__PURE__ */ (0, l.jsxs)("label", {
                className: "search",
                children: [/* @__PURE__ */ (0, l.jsx)(fd, { size: 16 }), /* @__PURE__ */ (0, l.jsx)("input", {
                  "aria-label": "搜尋專案",
                  placeholder: "搜尋專案",
                  value: F,
                  onChange: (d) => $(d.target.value)
                })]
              }), /* @__PURE__ */ (0, l.jsxs)("label", { children: [/* @__PURE__ */ (0, l.jsx)("input", {
                type: "checkbox",
                checked: pe,
                onChange: (d) => te(d.target.checked)
              }), " 顯示封存"] })]
            }),
            /* @__PURE__ */ (0, l.jsx)("div", {
              className: "hub-project-grid",
              children: h.filter((d) => (pe || !d.archived) && d.name.toLowerCase().includes(F.toLowerCase())).map((d) => /* @__PURE__ */ (0, l.jsxs)("button", {
                className: "hub-project-card",
                onClick: () => {
                  ce(d.id);
                },
                children: [
                  /* @__PURE__ */ (0, l.jsxs)("div", {
                    className: "project-card-top",
                    children: [d.type === "animation" ? /* @__PURE__ */ (0, l.jsx)(ui, { size: 24 }) : d.type === "software" ? /* @__PURE__ */ (0, l.jsx)(Sm, { size: 24 }) : /* @__PURE__ */ (0, l.jsx)(Jr, { size: 24 }), /* @__PURE__ */ (0, l.jsx)("span", { children: As[d.type] })]
                  }),
                  /* @__PURE__ */ (0, l.jsx)("h2", { children: d.name }),
                  /* @__PURE__ */ (0, l.jsxs)("p", { children: ["目前階段：", d.currentStage] }),
                  /* @__PURE__ */ (0, l.jsxs)("div", {
                    className: "project-card-next",
                    children: [
                      /* @__PURE__ */ (0, l.jsx)("small", { children: "最近工作" }),
                      /* @__PURE__ */ (0, l.jsx)("strong", { children: d.recentWork }),
                      /* @__PURE__ */ (0, l.jsx)("small", { children: "下一個待辦" }),
                      /* @__PURE__ */ (0, l.jsx)("strong", { children: d.nextAction })
                    ]
                  }),
                  /* @__PURE__ */ (0, l.jsxs)("div", {
                    className: "project-card-bottom",
                    children: [/* @__PURE__ */ (0, l.jsx)("span", {}), /* @__PURE__ */ (0, l.jsx)("span", { children: "開啟專案 →" })]
                  })
                ]
              }, d.id))
            }),
            !h.length && /* @__PURE__ */ (0, l.jsx)("div", {
              className: "empty",
              children: "尚無專案，請建立第一個專案。"
            }),
            /* @__PURE__ */ (0, l.jsxs)("details", {
              className: "hub-help",
              children: [/* @__PURE__ */ (0, l.jsx)("summary", { children: "舊版獨立單集紀錄" }), /* @__PURE__ */ (0, l.jsx)("button", {
                className: "text-btn",
                onClick: () => {
                  w("resume"), N("legacy");
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
      ee && /* @__PURE__ */ (0, l.jsx)("div", {
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
            }[ee] }), /* @__PURE__ */ (0, l.jsx)("button", {
              className: "icon-btn",
              "aria-label": "關閉表單",
              disabled: I,
              onClick: () => {
                window.confirm("確定放棄尚未儲存的表單？") && ge("");
              },
              children: /* @__PURE__ */ (0, l.jsx)(Sl, { size: 20 })
            })]
          }), /* @__PURE__ */ (0, l.jsxs)("form", {
            onSubmit: dt,
            children: [
              ee === "create" ? /* @__PURE__ */ (0, l.jsxs)(l.Fragment, { children: [
                qe("type", "專案類型", Object.entries(As)),
                ve("name", "專案名稱", !0),
                ve("description", "專案目標", !1, !0)
              ] }) : ee === "stage" ? /* @__PURE__ */ (0, l.jsxs)(l.Fragment, { children: [ve("stageKey", "階段編號（例如 M0）", !0), ve("title", "階段名稱", !0)] }) : ee === "edit" ? /* @__PURE__ */ (0, l.jsxs)(l.Fragment, { children: [
                f?.kind !== "animation" && ve("name", "專案名稱", !0),
                ve("description", "專案目標", !1, !0),
                qe("status", "專案狀態", Object.entries(la).filter(([d]) => [
                  "planning",
                  "in_progress",
                  "blocked",
                  "completed"
                ].includes(d)))
              ] }) : ee === "restore" ? /* @__PURE__ */ (0, l.jsx)("p", { children: "以新版本回復此專案的通用資料，保留回復前內容與異動紀錄。動畫及模型專業資料維持現況。" }) : ee === "resolve" ? ve("resolution", "處理方式與依據", !0, !0) : /* @__PURE__ */ (0, l.jsxs)(l.Fragment, { children: [[
                "task",
                "record",
                "issue",
                "artifact"
              ].includes(ee) && qe("stageId", "階段", [...ee === "artifact" || ee === "issue" ? [["", "不指定階段"]] : [], ...(f?.stages ?? []).map((d) => [d.id, d.key + " · " + d.title])]), ee === "task" ? /* @__PURE__ */ (0, l.jsxs)(l.Fragment, { children: [
                ve("title", "工作項目", !0),
                qe("status", "目前狀態", zf.map((d) => [d, la[d]])),
                ve("nextAction", "下一步", !1, !0),
                /* @__PURE__ */ (0, l.jsx)("p", {
                  className: "muted",
                  children: "選擇 PASS 仍需有此任務的測試紀錄及證據，否則保存為待驗證。"
                })
              ] }) : ee === "record" ? /* @__PURE__ */ (0, l.jsxs)(l.Fragment, { children: [
                qe("taskId", "對應工作", [["", "整個階段"], ...(f?.managedTasks ?? []).filter((d) => d.stageId === me.stageId).map((d) => [d.id, d.title])]),
                qe("status", "回報結果", zf.map((d) => [d, la[d]])),
                qe("mode", "這次如何執行", [
                  "actual",
                  "simulation",
                  "document",
                  "not_run"
                ].map((d) => [d, la[d]])),
                ve("scope", "測試／工作範圍（例如 ezdxf 或模擬 MCP）", !0),
                ve("summary", "這次實際做了什麼", !0, !0),
                ve("method", "檢查方法", !1, !0),
                ve("result", "檢查結果", !1, !0),
                lt("evidenceIds", f?.artifacts ?? []),
                lt("sourceIds", f?.sources ?? []),
                ve("limitations", "限制與未完成項目", !1, !0),
                ve("nextStep", "下一位接手要做什麼", !0, !0),
                /* @__PURE__ */ (0, l.jsx)("p", {
                  className: "muted",
                  children: "無有效證據的 PASS 回報會保存為 NOT_TESTED；模擬通過不代表實機通過。"
                })
              ] }) : ee === "artifact" ? /* @__PURE__ */ (0, l.jsxs)(l.Fragment, { children: [
                ve("title", "成果名稱", !0),
                ve("location", "成果檔案位置", !0),
                ve("version", "成果版本"),
                qe("availability", "檢查情形", [["reference", "只登記位置"], ["inspected", "已檢查內容"]]),
                ve("sha256", "SHA-256", me.availability === "inspected"),
                ve("inspection", "實際檢查內容", me.availability === "inspected", !0)
              ] }) : ee === "source" ? /* @__PURE__ */ (0, l.jsxs)(l.Fragment, { children: [
                ve("title", "來源名稱", !0),
                ve("location", "來源位置", !0),
                ve("version", "來源版本"),
                qe("readStatus", "閱讀情形", [["reference", "未讀，只登記連結"], ["read", "已讀取內容"]]),
                ve("snapshot", "讀取內容快照", me.readStatus === "read", !0),
                ve("sha256", "內容 SHA-256", me.readStatus === "read"),
                ve("observation", "閱讀觀察", me.readStatus === "read", !0)
              ] }) : /* @__PURE__ */ (0, l.jsxs)(l.Fragment, { children: [ve("title", "問題名稱", !0), ve("detail", "問題、影響及缺少的條件", !0, !0)] })] }),
              oe && /* @__PURE__ */ (0, l.jsx)("p", {
                className: "modal-error",
                role: "alert",
                children: oe
              }),
              /* @__PURE__ */ (0, l.jsx)("div", {
                className: "modal-actions",
                children: /* @__PURE__ */ (0, l.jsx)("button", {
                  type: "submit",
                  className: "btn primary",
                  disabled: I,
                  children: I ? "儲存中…" : ee === "restore" ? "回復成新版本" : "儲存並讀回"
                })
              })
            ]
          })]
        })
      })
    ]
  });
}
var $x = `
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

.asset-toolbar{display:flex;gap:8px;flex-wrap:wrap;align-items:center;margin:12px 0}.asset-toolbar details{position:relative}.asset-toolbar details[open]{background:white;border:1px solid var(--border);padding:10px;z-index:2}.asset-toolbar details .text-btn{display:block}.asset-search{max-width:620px;margin:18px 0}.asset-layout{display:grid;grid-template-columns:200px minmax(0,1fr);gap:18px}.asset-layout.has-detail{grid-template-columns:190px minmax(0,1fr) 280px}.asset-folders,.asset-detail{background:white;border:1px solid var(--border);padding:16px;border-radius:14px;overflow-wrap:anywhere}.asset-folders h3{display:flex;gap:8px}.asset-folders button{border:0;background:transparent;text-align:left;padding:8px;cursor:pointer;overflow-wrap:anywhere}.asset-folders>button{display:block;width:100%}.asset-folders button.active{background:var(--mint);color:var(--green);font-weight:700}.asset-folders div{display:flex;align-items:center}.asset-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(170px,1fr));gap:12px;margin:15px 0}.asset-card{display:flex;flex-direction:column;gap:8px;background:white;border:1px solid var(--border);border-radius:12px;padding:10px;min-width:0;overflow-wrap:anywhere}.asset-card.selected{outline:2px solid var(--green)}.asset-card label{font-size:12px;display:flex;gap:8px}.asset-thumb{border:0;background:#f0f3f1;aspect-ratio:4/3;display:flex;align-items:center;justify-content:center;cursor:pointer;overflow:hidden}.asset-thumb img{width:100%;height:100%;object-fit:contain}.asset-card small{color:var(--muted)}.asset-detail code{word-break:break-all}.asset-viewer{position:fixed;inset:0;background:#111d;z-index:10000;display:flex;flex-direction:column;padding:16px;color:white}.asset-viewer header{display:flex;align-items:center;gap:10px;flex-wrap:wrap}.asset-viewer header b{flex:1}.asset-viewer>img{width:100%;height:calc(100% - 70px);object-fit:contain}.asset-viewer>iframe{width:100%;height:100%;background:white;border:0}.asset-manager progress{display:block;width:100%;margin:12px 0}@media(max-width:1000px){.asset-layout.has-detail{grid-template-columns:170px minmax(0,1fr)}.asset-detail{grid-column:1/-1}}@media(max-width:650px){.asset-layout,.asset-layout.has-detail{display:block}.asset-folders{margin-bottom:12px;max-height:250px;overflow:auto}.asset-detail{margin-top:12px}.asset-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.asset-toolbar .btn{padding:8px}.asset-viewer{padding:8px}}

.drawing-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:16px}.drawing-card.adopted{border:2px solid var(--green)}.drawing-card p{overflow-wrap:anywhere}.drawing-role{display:inline-block;padding:4px 10px;background:var(--mint);border-radius:20px;color:var(--green)}.drawing-compare-select{display:flex;gap:12px;flex-wrap:wrap;align-items:end;margin-bottom:16px}.drawing-compare-select label{display:grid;gap:5px;flex:1;min-width:180px}.drawing-compare-select select{width:100%;padding:9px;border:1px solid var(--border);border-radius:8px}.drawing-side-by-side{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin:16px 0}.drawing-compare-image{min-width:0;overflow:hidden;background:#eef1ef}.drawing-compare-image>b{display:block;padding:8px;font-size:12px}.drawing-compare-image img{width:100%;height:450px;object-fit:contain}.drawing-compare-image iframe{width:100%;height:450px;border:0}.drawing-overlay{position:relative;height:500px;margin:16px 0;background:#eee}.drawing-overlay .drawing-compare-image{position:absolute;inset:0;background:transparent}.drawing-overlay .drawing-compare-image img{height:calc(100% - 35px)}@media(max-width:650px){.drawing-grid{display:block}.drawing-side-by-side{display:block}.drawing-compare-image img,.drawing-compare-image iframe{height:320px}.drawing-overlay{height:360px}}

.image-load-error{color:#9d3f32;background:#fff5f0;border-radius:8px;padding:10px}.image-load-error .btn{width:100%;justify-content:center;min-height:44px}.project-image-preview:disabled{cursor:default;opacity:1}

:host{display:block;--bg:#f7f8fa;--ink:#23322e;--muted:#85908b;--green:#326552;--border:#e4e9e6;--mint:#edf4ef;--font:'Noto Sans TC','Microsoft JhengHei',system-ui,sans-serif;color:var(--ink);font:14px/1.6 var(--font);background:var(--bg)}.native-production{min-width:0}.workspace{display:grid;grid-template-columns:230px minmax(0,1fr);min-height:calc(100dvh - 70px)}.sidebar{position:sticky;inset:auto;top:0;width:auto;height:calc(100dvh - 70px);overflow-y:auto;padding-top:20px}.brand{display:none}.main{margin-left:0!important}.topbar{height:48px}.page-content{padding:24px}.cloud-indicator{font-size:11px}.sidebar nav{max-height:none}.side-bottom{padding-top:20px}@media(max-width:850px){.workspace{grid-template-columns:185px minmax(0,1fr)}.page-content{padding:20px}}@media(max-width:600px){.workspace{display:block}.sidebar{position:relative;height:auto;padding:12px 16px 0}.main{margin:0}.topbar{display:none}.page-content{padding:20px 16px}.page-heading{margin-top:0}.page-heading p{max-width:none;font-size:12px}.sidebar .new-project{margin-bottom:6px}h1{font-size:24px}}`, Wx = "https://hrdzywkihfqggiwjgavi.supabase.co/functions/v1/lizhi-production", Ms = /* @__PURE__ */ new WeakMap(), Fx = async (r, h, C) => {
  const f = window.LizhiAuth;
  if (!f?.client) throw new Error("請先登入立之雲端庫");
  const { data: p, error: k } = await f.client.auth.getSession();
  if (k || !p.session?.access_token) throw new Error("登入已失效，請重新登入雲端庫");
  return fetch(Wx + "/" + r + h, {
    cache: "no-store",
    ...C ? {} : { signal: AbortSignal.timeout(2e4) },
    headers: {
      Authorization: "Bearer " + p.session.access_token,
      apikey: window.LIZHI_SUPABASE_PUBLISHABLE_KEY,
      ...C && !(C instanceof FormData) ? { "Content-Type": "application/json" } : {}
    },
    ...C ? {
      method: "POST",
      body: C instanceof FormData ? C : JSON.stringify(C)
    } : {}
  });
};
function eg(r) {
  if (Ms.has(r)) return;
  const h = r.attachShadow({ mode: "open" }), C = document.createElement("style");
  C.textContent = $x, h.append(C);
  const f = document.createElement("div");
  f.className = "native-production", h.append(f);
  const p = (0, cx.createRoot)(f);
  Ms.set(r, p), p.render(/* @__PURE__ */ (0, l.jsx)(Ix, { nativeTransport: Fx }));
}
function tg(r) {
  Ms.get(r)?.unmount(), Ms.delete(r);
}
export {
  eg as mount,
  tg as unmount
};
