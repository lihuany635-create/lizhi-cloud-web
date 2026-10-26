var ia = (r, m) => () => (m || (r((m = { exports: {} }).exports, m), r = null), m.exports), Lh = /* @__PURE__ */ ia(((r) => {
  function m(Q, B) {
    var G = Q.length;
    Q.push(B);
    e: for (; 0 < G; ) {
      var fe = G - 1 >>> 1, se = Q[fe];
      if (0 < d(se, B)) Q[fe] = B, Q[G] = se, G = fe;
      else break e;
    }
  }
  function _(Q) {
    return Q.length === 0 ? null : Q[0];
  }
  function u(Q) {
    if (Q.length === 0) return null;
    var B = Q[0], G = Q.pop();
    if (G !== B) {
      Q[0] = G;
      e: for (var fe = 0, se = Q.length, Z = se >>> 1; fe < Z; ) {
        var f = 2 * (fe + 1) - 1, D = Q[f], K = f + 1, ee = Q[K];
        if (0 > d(D, G)) K < se && 0 > d(ee, D) ? (Q[fe] = ee, Q[K] = G, fe = K) : (Q[fe] = D, Q[f] = G, fe = f);
        else if (K < se && 0 > d(ee, G)) Q[fe] = ee, Q[K] = G, fe = K;
        else break e;
      }
    }
    return B;
  }
  function d(Q, B) {
    var G = Q.sortIndex - B.sortIndex;
    return G !== 0 ? G : Q.id - B.id;
  }
  if (r.unstable_now = void 0, typeof performance == "object" && typeof performance.now == "function") {
    var T = performance;
    r.unstable_now = function() {
      return T.now();
    };
  } else {
    var v = Date, M = v.now();
    r.unstable_now = function() {
      return v.now() - M;
    };
  }
  var w = [], k = [], z = 1, V = null, R = 3, re = !1, pe = !1, J = !1, W = !1, le = typeof setTimeout == "function" ? setTimeout : null, X = typeof clearTimeout == "function" ? clearTimeout : null, oe = typeof setImmediate < "u" ? setImmediate : null;
  function H(Q) {
    for (var B = _(k); B !== null; ) {
      if (B.callback === null) u(k);
      else if (B.startTime <= Q) u(k), B.sortIndex = B.expirationTime, m(w, B);
      else break;
      B = _(k);
    }
  }
  function F(Q) {
    if (J = !1, H(Q), !pe) if (_(w) !== null) pe = !0, te || (te = !0, ze());
    else {
      var B = _(k);
      B !== null && ae(F, B.startTime - Q);
    }
  }
  var te = !1, ge = -1, ce = 5, I = -1;
  function j() {
    return W ? !0 : !(r.unstable_now() - I < ce);
  }
  function $() {
    if (W = !1, te) {
      var Q = r.unstable_now();
      I = Q;
      var B = !0;
      try {
        e: {
          pe = !1, J && (J = !1, X(ge), ge = -1), re = !0;
          var G = R;
          try {
            t: {
              for (H(Q), V = _(w); V !== null && !(V.expirationTime > Q && j()); ) {
                var fe = V.callback;
                if (typeof fe == "function") {
                  V.callback = null, R = V.priorityLevel;
                  var se = fe(V.expirationTime <= Q);
                  if (Q = r.unstable_now(), typeof se == "function") {
                    V.callback = se, H(Q), B = !0;
                    break t;
                  }
                  V === _(w) && u(w), H(Q);
                } else u(w);
                V = _(w);
              }
              if (V !== null) B = !0;
              else {
                var Z = _(k);
                Z !== null && ae(F, Z.startTime - Q), B = !1;
              }
            }
            break e;
          } finally {
            V = null, R = G, re = !1;
          }
          B = void 0;
        }
      } finally {
        B ? ze() : te = !1;
      }
    }
  }
  var ze;
  if (typeof oe == "function") ze = function() {
    oe($);
  };
  else if (typeof MessageChannel < "u") {
    var he = new MessageChannel(), g = he.port2;
    he.port1.onmessage = $, ze = function() {
      g.postMessage(null);
    };
  } else ze = function() {
    le($, 0);
  };
  function ae(Q, B) {
    ge = le(function() {
      Q(r.unstable_now());
    }, B);
  }
  r.unstable_IdlePriority = 5, r.unstable_ImmediatePriority = 1, r.unstable_LowPriority = 4, r.unstable_NormalPriority = 3, r.unstable_Profiling = null, r.unstable_UserBlockingPriority = 2, r.unstable_cancelCallback = function(Q) {
    Q.callback = null;
  }, r.unstable_forceFrameRate = function(Q) {
    0 > Q || 125 < Q ? console.error("forceFrameRate takes a positive int between 0 and 125, forcing frame rates higher than 125 fps is not supported") : ce = 0 < Q ? Math.floor(1e3 / Q) : 5;
  }, r.unstable_getCurrentPriorityLevel = function() {
    return R;
  }, r.unstable_next = function(Q) {
    switch (R) {
      case 1:
      case 2:
      case 3:
        var B = 3;
        break;
      default:
        B = R;
    }
    var G = R;
    R = B;
    try {
      return Q();
    } finally {
      R = G;
    }
  }, r.unstable_requestPaint = function() {
    W = !0;
  }, r.unstable_runWithPriority = function(Q, B) {
    switch (Q) {
      case 1:
      case 2:
      case 3:
      case 4:
      case 5:
        break;
      default:
        Q = 3;
    }
    var G = R;
    R = Q;
    try {
      return B();
    } finally {
      R = G;
    }
  }, r.unstable_scheduleCallback = function(Q, B, G) {
    var fe = r.unstable_now();
    switch (typeof G == "object" && G !== null ? (G = G.delay, G = typeof G == "number" && 0 < G ? fe + G : fe) : G = fe, Q) {
      case 1:
        var se = -1;
        break;
      case 2:
        se = 250;
        break;
      case 5:
        se = 1073741823;
        break;
      case 4:
        se = 1e4;
        break;
      default:
        se = 5e3;
    }
    return se = G + se, Q = {
      id: z++,
      callback: B,
      priorityLevel: Q,
      startTime: G,
      expirationTime: se,
      sortIndex: -1
    }, G > fe ? (Q.sortIndex = G, m(k, Q), _(w) === null && Q === _(k) && (J ? (X(ge), ge = -1) : J = !0, ae(F, G - fe))) : (Q.sortIndex = se, m(w, Q), pe || re || (pe = !0, te || (te = !0, ze()))), Q;
  }, r.unstable_shouldYield = j, r.unstable_wrapCallback = function(Q) {
    var B = R;
    return function() {
      var G = R;
      R = B;
      try {
        return Q.apply(this, arguments);
      } finally {
        R = G;
      }
    };
  };
})), Hh = /* @__PURE__ */ ia(((r, m) => {
  m.exports = Lh();
})), Bh = /* @__PURE__ */ ia(((r) => {
  var m = /* @__PURE__ */ Symbol.for("react.transitional.element"), _ = /* @__PURE__ */ Symbol.for("react.portal"), u = /* @__PURE__ */ Symbol.for("react.fragment"), d = /* @__PURE__ */ Symbol.for("react.strict_mode"), T = /* @__PURE__ */ Symbol.for("react.profiler"), v = /* @__PURE__ */ Symbol.for("react.consumer"), M = /* @__PURE__ */ Symbol.for("react.context"), w = /* @__PURE__ */ Symbol.for("react.forward_ref"), k = /* @__PURE__ */ Symbol.for("react.suspense"), z = /* @__PURE__ */ Symbol.for("react.memo"), V = /* @__PURE__ */ Symbol.for("react.lazy"), R = /* @__PURE__ */ Symbol.for("react.activity"), re = Symbol.iterator;
  function pe(f) {
    return f === null || typeof f != "object" ? null : (f = re && f[re] || f["@@iterator"], typeof f == "function" ? f : null);
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
  }, W = Object.assign, le = {};
  function X(f, D, K) {
    this.props = f, this.context = D, this.refs = le, this.updater = K || J;
  }
  X.prototype.isReactComponent = {}, X.prototype.setState = function(f, D) {
    if (typeof f != "object" && typeof f != "function" && f != null) throw Error("takes an object of state variables to update or a function which returns an object of state variables.");
    this.updater.enqueueSetState(this, f, D, "setState");
  }, X.prototype.forceUpdate = function(f) {
    this.updater.enqueueForceUpdate(this, f, "forceUpdate");
  };
  function oe() {
  }
  oe.prototype = X.prototype;
  function H(f, D, K) {
    this.props = f, this.context = D, this.refs = le, this.updater = K || J;
  }
  var F = H.prototype = new oe();
  F.constructor = H, W(F, X.prototype), F.isPureReactComponent = !0;
  var te = Array.isArray;
  function ge() {
  }
  var ce = {
    H: null,
    A: null,
    T: null,
    S: null
  }, I = Object.prototype.hasOwnProperty;
  function j(f, D, K) {
    var ee = K.ref;
    return {
      $$typeof: m,
      type: f,
      key: D,
      ref: ee !== void 0 ? ee : null,
      props: K
    };
  }
  function $(f, D) {
    return j(f.type, D, f.props);
  }
  function ze(f) {
    return typeof f == "object" && f !== null && f.$$typeof === m;
  }
  function he(f) {
    var D = {
      "=": "=0",
      ":": "=2"
    };
    return "$" + f.replace(/[=:]/g, function(K) {
      return D[K];
    });
  }
  var g = /\/+/g;
  function ae(f, D) {
    return typeof f == "object" && f !== null && f.key != null ? he("" + f.key) : D.toString(36);
  }
  function Q(f) {
    switch (f.status) {
      case "fulfilled":
        return f.value;
      case "rejected":
        throw f.reason;
      default:
        switch (typeof f.status == "string" ? f.then(ge, ge) : (f.status = "pending", f.then(function(D) {
          f.status === "pending" && (f.status = "fulfilled", f.value = D);
        }, function(D) {
          f.status === "pending" && (f.status = "rejected", f.reason = D);
        })), f.status) {
          case "fulfilled":
            return f.value;
          case "rejected":
            throw f.reason;
        }
    }
    throw f;
  }
  function B(f, D, K, ee, ne) {
    var Se = typeof f;
    (Se === "undefined" || Se === "boolean") && (f = null);
    var je = !1;
    if (f === null) je = !0;
    else switch (Se) {
      case "bigint":
      case "string":
      case "number":
        je = !0;
        break;
      case "object":
        switch (f.$$typeof) {
          case m:
          case _:
            je = !0;
            break;
          case V:
            return je = f._init, B(je(f._payload), D, K, ee, ne);
        }
    }
    if (je) return ne = ne(f), je = ee === "" ? "." + ae(f, 0) : ee, te(ne) ? (K = "", je != null && (K = je.replace(g, "$&/") + "/"), B(ne, D, K, "", function(Ne) {
      return Ne;
    })) : ne != null && (ze(ne) && (ne = $(ne, K + (ne.key == null || f && f.key === ne.key ? "" : ("" + ne.key).replace(g, "$&/") + "/") + je)), D.push(ne)), 1;
    je = 0;
    var Be = ee === "" ? "." : ee + ":";
    if (te(f)) for (var Ee = 0; Ee < f.length; Ee++) ee = f[Ee], Se = Be + ae(ee, Ee), je += B(ee, D, K, Se, ne);
    else if (Ee = pe(f), typeof Ee == "function") for (f = Ee.call(f), Ee = 0; !(ee = f.next()).done; ) ee = ee.value, Se = Be + ae(ee, Ee++), je += B(ee, D, K, Se, ne);
    else if (Se === "object") {
      if (typeof f.then == "function") return B(Q(f), D, K, ee, ne);
      throw D = String(f), Error("Objects are not valid as a React child (found: " + (D === "[object Object]" ? "object with keys {" + Object.keys(f).join(", ") + "}" : D) + "). If you meant to render a collection of children, use an array instead.");
    }
    return je;
  }
  function G(f, D, K) {
    if (f == null) return f;
    var ee = [], ne = 0;
    return B(f, ee, "", "", function(Se) {
      return D.call(K, Se, ne++);
    }), ee;
  }
  function fe(f) {
    if (f._status === -1) {
      var D = f._result;
      D = D(), D.then(function(K) {
        (f._status === 0 || f._status === -1) && (f._status = 1, f._result = K);
      }, function(K) {
        (f._status === 0 || f._status === -1) && (f._status = 2, f._result = K);
      }), f._status === -1 && (f._status = 0, f._result = D);
    }
    if (f._status === 1) return f._result.default;
    throw f._result;
  }
  var se = typeof reportError == "function" ? reportError : function(f) {
    if (typeof window == "object" && typeof window.ErrorEvent == "function") {
      var D = new window.ErrorEvent("error", {
        bubbles: !0,
        cancelable: !0,
        message: typeof f == "object" && f !== null && typeof f.message == "string" ? String(f.message) : String(f),
        error: f
      });
      if (!window.dispatchEvent(D)) return;
    } else if (typeof process == "object" && typeof process.emit == "function") {
      process.emit("uncaughtException", f);
      return;
    }
    console.error(f);
  }, Z = {
    map: G,
    forEach: function(f, D, K) {
      G(f, function() {
        D.apply(this, arguments);
      }, K);
    },
    count: function(f) {
      var D = 0;
      return G(f, function() {
        D++;
      }), D;
    },
    toArray: function(f) {
      return G(f, function(D) {
        return D;
      }) || [];
    },
    only: function(f) {
      if (!ze(f)) throw Error("React.Children.only expected to receive a single React element child.");
      return f;
    }
  };
  r.Activity = R, r.Children = Z, r.Component = X, r.Fragment = u, r.Profiler = T, r.PureComponent = H, r.StrictMode = d, r.Suspense = k, r.__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE = ce, r.__COMPILER_RUNTIME = {
    __proto__: null,
    c: function(f) {
      return ce.H.useMemoCache(f);
    }
  }, r.cache = function(f) {
    return function() {
      return f.apply(null, arguments);
    };
  }, r.cacheSignal = function() {
    return null;
  }, r.cloneElement = function(f, D, K) {
    if (f == null) throw Error("The argument must be a React element, but you passed " + f + ".");
    var ee = W({}, f.props), ne = f.key;
    if (D != null) for (Se in D.key !== void 0 && (ne = "" + D.key), D) !I.call(D, Se) || Se === "key" || Se === "__self" || Se === "__source" || Se === "ref" && D.ref === void 0 || (ee[Se] = D[Se]);
    var Se = arguments.length - 2;
    if (Se === 1) ee.children = K;
    else if (1 < Se) {
      for (var je = Array(Se), Be = 0; Be < Se; Be++) je[Be] = arguments[Be + 2];
      ee.children = je;
    }
    return j(f.type, ne, ee);
  }, r.createContext = function(f) {
    return f = {
      $$typeof: M,
      _currentValue: f,
      _currentValue2: f,
      _threadCount: 0,
      Provider: null,
      Consumer: null
    }, f.Provider = f, f.Consumer = {
      $$typeof: v,
      _context: f
    }, f;
  }, r.createElement = function(f, D, K) {
    var ee, ne = {}, Se = null;
    if (D != null) for (ee in D.key !== void 0 && (Se = "" + D.key), D) I.call(D, ee) && ee !== "key" && ee !== "__self" && ee !== "__source" && (ne[ee] = D[ee]);
    var je = arguments.length - 2;
    if (je === 1) ne.children = K;
    else if (1 < je) {
      for (var Be = Array(je), Ee = 0; Ee < je; Ee++) Be[Ee] = arguments[Ee + 2];
      ne.children = Be;
    }
    if (f && f.defaultProps) for (ee in je = f.defaultProps, je) ne[ee] === void 0 && (ne[ee] = je[ee]);
    return j(f, Se, ne);
  }, r.createRef = function() {
    return { current: null };
  }, r.forwardRef = function(f) {
    return {
      $$typeof: w,
      render: f
    };
  }, r.isValidElement = ze, r.lazy = function(f) {
    return {
      $$typeof: V,
      _payload: {
        _status: -1,
        _result: f
      },
      _init: fe
    };
  }, r.memo = function(f, D) {
    return {
      $$typeof: z,
      type: f,
      compare: D === void 0 ? null : D
    };
  }, r.startTransition = function(f) {
    var D = ce.T, K = {};
    ce.T = K;
    try {
      var ee = f(), ne = ce.S;
      ne !== null && ne(K, ee), typeof ee == "object" && ee !== null && typeof ee.then == "function" && ee.then(ge, se);
    } catch (Se) {
      se(Se);
    } finally {
      D !== null && K.types !== null && (D.types = K.types), ce.T = D;
    }
  }, r.unstable_useCacheRefresh = function() {
    return ce.H.useCacheRefresh();
  }, r.use = function(f) {
    return ce.H.use(f);
  }, r.useActionState = function(f, D, K) {
    return ce.H.useActionState(f, D, K);
  }, r.useCallback = function(f, D) {
    return ce.H.useCallback(f, D);
  }, r.useContext = function(f) {
    return ce.H.useContext(f);
  }, r.useDebugValue = function() {
  }, r.useDeferredValue = function(f, D) {
    return ce.H.useDeferredValue(f, D);
  }, r.useEffect = function(f, D) {
    return ce.H.useEffect(f, D);
  }, r.useEffectEvent = function(f) {
    return ce.H.useEffectEvent(f);
  }, r.useId = function() {
    return ce.H.useId();
  }, r.useImperativeHandle = function(f, D, K) {
    return ce.H.useImperativeHandle(f, D, K);
  }, r.useInsertionEffect = function(f, D) {
    return ce.H.useInsertionEffect(f, D);
  }, r.useLayoutEffect = function(f, D) {
    return ce.H.useLayoutEffect(f, D);
  }, r.useMemo = function(f, D) {
    return ce.H.useMemo(f, D);
  }, r.useOptimistic = function(f, D) {
    return ce.H.useOptimistic(f, D);
  }, r.useReducer = function(f, D, K) {
    return ce.H.useReducer(f, D, K);
  }, r.useRef = function(f) {
    return ce.H.useRef(f);
  }, r.useState = function(f) {
    return ce.H.useState(f);
  }, r.useSyncExternalStore = function(f, D, K) {
    return ce.H.useSyncExternalStore(f, D, K);
  }, r.useTransition = function() {
    return ce.H.useTransition();
  }, r.version = "19.2.6";
})), ro = /* @__PURE__ */ ia(((r, m) => {
  m.exports = Bh();
})), Gh = /* @__PURE__ */ ia(((r) => {
  var m = ro();
  function _(k) {
    var z = "https://react.dev/errors/" + k;
    if (1 < arguments.length) {
      z += "?args[]=" + encodeURIComponent(arguments[1]);
      for (var V = 2; V < arguments.length; V++) z += "&args[]=" + encodeURIComponent(arguments[V]);
    }
    return "Minified React error #" + k + "; visit " + z + " for the full message or use the non-minified dev environment for full errors and additional helpful warnings.";
  }
  function u() {
  }
  var d = {
    d: {
      f: u,
      r: function() {
        throw Error(_(522));
      },
      D: u,
      C: u,
      L: u,
      m: u,
      X: u,
      S: u,
      M: u
    },
    p: 0,
    findDOMNode: null
  }, T = /* @__PURE__ */ Symbol.for("react.portal");
  function v(k, z, V) {
    var R = 3 < arguments.length && arguments[3] !== void 0 ? arguments[3] : null;
    return {
      $$typeof: T,
      key: R == null ? null : "" + R,
      children: k,
      containerInfo: z,
      implementation: V
    };
  }
  var M = m.__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE;
  function w(k, z) {
    if (k === "font") return "";
    if (typeof z == "string") return z === "use-credentials" ? z : "";
  }
  r.__DOM_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE = d, r.createPortal = function(k, z) {
    var V = 2 < arguments.length && arguments[2] !== void 0 ? arguments[2] : null;
    if (!z || z.nodeType !== 1 && z.nodeType !== 9 && z.nodeType !== 11) throw Error(_(299));
    return v(k, z, null, V);
  }, r.flushSync = function(k) {
    var z = M.T, V = d.p;
    try {
      if (M.T = null, d.p = 2, k) return k();
    } finally {
      M.T = z, d.p = V, d.d.f();
    }
  }, r.preconnect = function(k, z) {
    typeof k == "string" && (z ? (z = z.crossOrigin, z = typeof z == "string" ? z === "use-credentials" ? z : "" : void 0) : z = null, d.d.C(k, z));
  }, r.prefetchDNS = function(k) {
    typeof k == "string" && d.d.D(k);
  }, r.preinit = function(k, z) {
    if (typeof k == "string" && z && typeof z.as == "string") {
      var V = z.as, R = w(V, z.crossOrigin), re = typeof z.integrity == "string" ? z.integrity : void 0, pe = typeof z.fetchPriority == "string" ? z.fetchPriority : void 0;
      V === "style" ? d.d.S(k, typeof z.precedence == "string" ? z.precedence : void 0, {
        crossOrigin: R,
        integrity: re,
        fetchPriority: pe
      }) : V === "script" && d.d.X(k, {
        crossOrigin: R,
        integrity: re,
        fetchPriority: pe,
        nonce: typeof z.nonce == "string" ? z.nonce : void 0
      });
    }
  }, r.preinitModule = function(k, z) {
    if (typeof k == "string") if (typeof z == "object" && z !== null) {
      if (z.as == null || z.as === "script") {
        var V = w(z.as, z.crossOrigin);
        d.d.M(k, {
          crossOrigin: V,
          integrity: typeof z.integrity == "string" ? z.integrity : void 0,
          nonce: typeof z.nonce == "string" ? z.nonce : void 0
        });
      }
    } else z ?? d.d.M(k);
  }, r.preload = function(k, z) {
    if (typeof k == "string" && typeof z == "object" && z !== null && typeof z.as == "string") {
      var V = z.as, R = w(V, z.crossOrigin);
      d.d.L(k, V, {
        crossOrigin: R,
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
      var V = w(z.as, z.crossOrigin);
      d.d.m(k, {
        as: typeof z.as == "string" && z.as !== "script" ? z.as : void 0,
        crossOrigin: V,
        integrity: typeof z.integrity == "string" ? z.integrity : void 0
      });
    } else d.d.m(k);
  }, r.requestFormReset = function(k) {
    d.d.r(k);
  }, r.unstable_batchedUpdates = function(k, z) {
    return k(z);
  }, r.useFormState = function(k, z, V) {
    return M.H.useFormState(k, z, V);
  }, r.useFormStatus = function() {
    return M.H.useHostTransitionStatus();
  }, r.version = "19.2.6";
})), Yh = /* @__PURE__ */ ia(((r, m) => {
  function _() {
    if (!(typeof __REACT_DEVTOOLS_GLOBAL_HOOK__ > "u" || typeof __REACT_DEVTOOLS_GLOBAL_HOOK__.checkDCE != "function"))
      try {
        __REACT_DEVTOOLS_GLOBAL_HOOK__.checkDCE(_);
      } catch (u) {
        console.error(u);
      }
  }
  _(), m.exports = Gh();
})), Vh = /* @__PURE__ */ ia(((r) => {
  var m = Hh(), _ = ro(), u = Yh();
  function d(e) {
    var t = "https://react.dev/errors/" + e;
    if (1 < arguments.length) {
      t += "?args[]=" + encodeURIComponent(arguments[1]);
      for (var a = 2; a < arguments.length; a++) t += "&args[]=" + encodeURIComponent(arguments[a]);
    }
    return "Minified React error #" + e + "; visit " + t + " for the full message or use the non-minified dev environment for full errors and additional helpful warnings.";
  }
  function T(e) {
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
  function M(e) {
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
  function k(e) {
    if (v(e) !== e) throw Error(d(188));
  }
  function z(e) {
    var t = e.alternate;
    if (!t) {
      if (t = v(e), t === null) throw Error(d(188));
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
          if (s === a) return k(n), e;
          if (s === i) return k(n), t;
          s = s.sibling;
        }
        throw Error(d(188));
      }
      if (a.return !== i.return) a = n, i = s;
      else {
        for (var c = !1, o = n.child; o; ) {
          if (o === a) {
            c = !0, a = n, i = s;
            break;
          }
          if (o === i) {
            c = !0, i = n, a = s;
            break;
          }
          o = o.sibling;
        }
        if (!c) {
          for (o = s.child; o; ) {
            if (o === a) {
              c = !0, a = s, i = n;
              break;
            }
            if (o === i) {
              c = !0, i = s, a = n;
              break;
            }
            o = o.sibling;
          }
          if (!c) throw Error(d(189));
        }
      }
      if (a.alternate !== i) throw Error(d(190));
    }
    if (a.tag !== 3) throw Error(d(188));
    return a.stateNode.current === a ? e : t;
  }
  function V(e) {
    var t = e.tag;
    if (t === 5 || t === 26 || t === 27 || t === 6) return e;
    for (e = e.child; e !== null; ) {
      if (t = V(e), t !== null) return t;
      e = e.sibling;
    }
    return null;
  }
  var R = Object.assign, re = /* @__PURE__ */ Symbol.for("react.element"), pe = /* @__PURE__ */ Symbol.for("react.transitional.element"), J = /* @__PURE__ */ Symbol.for("react.portal"), W = /* @__PURE__ */ Symbol.for("react.fragment"), le = /* @__PURE__ */ Symbol.for("react.strict_mode"), X = /* @__PURE__ */ Symbol.for("react.profiler"), oe = /* @__PURE__ */ Symbol.for("react.consumer"), H = /* @__PURE__ */ Symbol.for("react.context"), F = /* @__PURE__ */ Symbol.for("react.forward_ref"), te = /* @__PURE__ */ Symbol.for("react.suspense"), ge = /* @__PURE__ */ Symbol.for("react.suspense_list"), ce = /* @__PURE__ */ Symbol.for("react.memo"), I = /* @__PURE__ */ Symbol.for("react.lazy"), j = /* @__PURE__ */ Symbol.for("react.activity"), $ = /* @__PURE__ */ Symbol.for("react.memo_cache_sentinel"), ze = Symbol.iterator;
  function he(e) {
    return e === null || typeof e != "object" ? null : (e = ze && e[ze] || e["@@iterator"], typeof e == "function" ? e : null);
  }
  var g = /* @__PURE__ */ Symbol.for("react.client.reference");
  function ae(e) {
    if (e == null) return null;
    if (typeof e == "function") return e.$$typeof === g ? null : e.displayName || e.name || null;
    if (typeof e == "string") return e;
    switch (e) {
      case W:
        return "Fragment";
      case X:
        return "Profiler";
      case le:
        return "StrictMode";
      case te:
        return "Suspense";
      case ge:
        return "SuspenseList";
      case j:
        return "Activity";
    }
    if (typeof e == "object") switch (e.$$typeof) {
      case J:
        return "Portal";
      case H:
        return e.displayName || "Context";
      case oe:
        return (e._context.displayName || "Context") + ".Consumer";
      case F:
        var t = e.render;
        return e = e.displayName, e || (e = t.displayName || t.name || "", e = e !== "" ? "ForwardRef(" + e + ")" : "ForwardRef"), e;
      case ce:
        return t = e.displayName || null, t !== null ? t : ae(e.type) || "Memo";
      case I:
        t = e._payload, e = e._init;
        try {
          return ae(e(t));
        } catch {
        }
    }
    return null;
  }
  var Q = Array.isArray, B = _.__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE, G = u.__DOM_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE, fe = {
    pending: !1,
    data: null,
    method: null,
    action: null
  }, se = [], Z = -1;
  function f(e) {
    return { current: e };
  }
  function D(e) {
    0 > Z || (e.current = se[Z], se[Z] = null, Z--);
  }
  function K(e, t) {
    Z++, se[Z] = e.current, e.current = t;
  }
  var ee = f(null), ne = f(null), Se = f(null), je = f(null);
  function Be(e, t) {
    switch (K(Se, t), K(ne, e), K(ee, null), t.nodeType) {
      case 9:
      case 11:
        e = (e = t.documentElement) && (e = e.namespaceURI) ? Ap(e) : 0;
        break;
      default:
        if (e = t.tagName, t = t.namespaceURI) t = Ap(t), e = Tp(t, e);
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
    D(ee), K(ee, e);
  }
  function Ee() {
    D(ee), D(ne), D(Se);
  }
  function Ne(e) {
    e.memoizedState !== null && K(je, e);
    var t = ee.current, a = Tp(t, e.type);
    t !== a && (K(ne, e), K(ee, a));
  }
  function Re(e) {
    ne.current === e && (D(ee), D(ne)), je.current === e && (D(je), $i._currentValue = fe);
  }
  var Ue, y;
  function ie(e) {
    if (Ue === void 0) try {
      throw Error();
    } catch (a) {
      var t = a.stack.trim().match(/\n( *(at )?)/);
      Ue = t && t[1] || "", y = -1 < a.stack.indexOf(`
    at`) ? " (<anonymous>)" : -1 < a.stack.indexOf("@") ? "@unknown:0:0" : "";
    }
    return `
` + Ue + e + y;
  }
  var me = !1;
  function h(e, t) {
    if (!e || me) return "";
    me = !0;
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
                var C = U;
              }
              Reflect.construct(e, [], Y);
            } else {
              try {
                Y.call();
              } catch (U) {
                C = U;
              }
              e.call(Y.prototype);
            }
          } else {
            try {
              throw Error();
            } catch (U) {
              C = U;
            }
            (Y = e()) && typeof Y.catch == "function" && Y.catch(function() {
            });
          }
        } catch (U) {
          if (U && C && typeof U.stack == "string") return [U.stack, C.stack];
        }
        return [null, null];
      } };
      i.DetermineComponentFrameRoot.displayName = "DetermineComponentFrameRoot";
      var n = Object.getOwnPropertyDescriptor(i.DetermineComponentFrameRoot, "name");
      n && n.configurable && Object.defineProperty(i.DetermineComponentFrameRoot, "name", { value: "DetermineComponentFrameRoot" });
      var s = i.DetermineComponentFrameRoot(), c = s[0], o = s[1];
      if (c && o) {
        var x = c.split(`
`), A = o.split(`
`);
        for (n = i = 0; i < x.length && !x[i].includes("DetermineComponentFrameRoot"); ) i++;
        for (; n < A.length && !A[n].includes("DetermineComponentFrameRoot"); ) n++;
        if (i === x.length || n === A.length) for (i = x.length - 1, n = A.length - 1; 1 <= i && 0 <= n && x[i] !== A[n]; ) n--;
        for (; 1 <= i && 0 <= n; i--, n--) if (x[i] !== A[n]) {
          if (i !== 1 || n !== 1) do
            if (i--, n--, 0 > n || x[i] !== A[n]) {
              var q = `
` + x[i].replace(" at new ", " at ");
              return e.displayName && q.includes("<anonymous>") && (q = q.replace("<anonymous>", e.displayName)), q;
            }
          while (1 <= i && 0 <= n);
          break;
        }
      }
    } finally {
      me = !1, Error.prepareStackTrace = a;
    }
    return (a = e ? e.displayName || e.name : "") ? ie(a) : "";
  }
  function P(e, t) {
    switch (e.tag) {
      case 26:
      case 27:
      case 5:
        return ie(e.type);
      case 16:
        return ie("Lazy");
      case 13:
        return e.child !== t && t !== null ? ie("Suspense Fallback") : ie("Suspense");
      case 19:
        return ie("SuspenseList");
      case 0:
      case 15:
        return h(e.type, !1);
      case 11:
        return h(e.type.render, !1);
      case 1:
        return h(e.type, !0);
      case 31:
        return ie("Activity");
      default:
        return "";
    }
  }
  function We(e) {
    try {
      var t = "", a = null;
      do
        t += P(e, a), a = e, e = e.return;
      while (e);
      return t;
    } catch (i) {
      return `
Error generating stack: ` + i.message + `
` + i.stack;
    }
  }
  var jt = Object.prototype.hasOwnProperty, O = m.unstable_scheduleCallback, we = m.unstable_cancelCallback, it = m.unstable_shouldYield, Jt = m.unstable_requestPaint, et = m.unstable_now, Ja = m.unstable_getCurrentPriorityLevel, jl = m.unstable_ImmediatePriority, Ut = m.unstable_UserBlockingPriority, ea = m.unstable_NormalPriority, Ia = m.unstable_LowPriority, p = m.unstable_IdlePriority, be = m.log, ve = m.unstable_setDisableYieldValue, tt = null, Ze = null;
  function bt(e) {
    if (typeof be == "function" && ve(e), Ze && typeof Ze.setStrictMode == "function") try {
      Ze.setStrictMode(tt, e);
    } catch {
    }
  }
  var ot = Math.clz32 ? Math.clz32 : Cf, sn = Math.log, yt = Math.LN2;
  function Cf(e) {
    return e >>>= 0, e === 0 ? 32 : 31 - (sn(e) / yt | 0) | 0;
  }
  var cn = 256, rn = 262144, on = 4194304;
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
  function dn(e, t, a) {
    var i = e.pendingLanes;
    if (i === 0) return 0;
    var n = 0, s = e.suspendedLanes, c = e.pingedLanes;
    e = e.warmLanes;
    var o = i & 134217727;
    return o !== 0 ? (i = o & ~s, i !== 0 ? n = $a(i) : (c &= o, c !== 0 ? n = $a(c) : a || (a = o & ~e, a !== 0 && (n = $a(a))))) : (o = i & ~s, o !== 0 ? n = $a(o) : c !== 0 ? n = $a(c) : a || (a = i & ~e, a !== 0 && (n = $a(a)))), n === 0 ? 0 : t !== 0 && t !== n && (t & s) === 0 && (s = n & -n, a = t & -t, s >= a || s === 32 && (a & 4194048) !== 0) ? t : n;
  }
  function oi(e, t) {
    return (e.pendingLanes & ~(e.suspendedLanes & ~e.pingedLanes) & t) === 0;
  }
  function Of(e, t) {
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
  function uo() {
    var e = on;
    return on <<= 1, (on & 62914560) === 0 && (on = 4194304), e;
  }
  function Ms(e) {
    for (var t = [], a = 0; 31 > a; a++) t.push(e);
    return t;
  }
  function un(e, t) {
    e.pendingLanes |= t, t !== 268435456 && (e.suspendedLanes = 0, e.pingedLanes = 0, e.warmLanes = 0);
  }
  function Mf(e, t, a, i, n, s) {
    var c = e.pendingLanes;
    e.pendingLanes = a, e.suspendedLanes = 0, e.pingedLanes = 0, e.warmLanes = 0, e.expiredLanes &= a, e.entangledLanes &= a, e.errorRecoveryDisabledLanes &= a, e.shellSuspendCounter = 0;
    var o = e.entanglements, x = e.expirationTimes, A = e.hiddenUpdates;
    for (a = c & ~a; 0 < a; ) {
      var q = 31 - ot(a), Y = 1 << q;
      o[q] = 0, x[q] = -1;
      var C = A[q];
      if (C !== null) for (A[q] = null, q = 0; q < C.length; q++) {
        var U = C[q];
        U !== null && (U.lane &= -536870913);
      }
      a &= ~Y;
    }
    i !== 0 && po(e, i, 0), s !== 0 && n === 0 && e.tag !== 0 && (e.suspendedLanes |= s & ~(c & ~t));
  }
  function po(e, t, a) {
    e.pendingLanes |= t, e.suspendedLanes &= ~t;
    var i = 31 - ot(t);
    e.entangledLanes |= t, e.entanglements[i] = e.entanglements[i] | 1073741824 | a & 261930;
  }
  function fo(e, t) {
    var a = e.entangledLanes |= t;
    for (e = e.entanglements; a; ) {
      var i = 31 - ot(a), n = 1 << i;
      n & t | e[i] & t && (e[i] |= t), a &= ~n;
    }
  }
  function ho(e, t) {
    var a = t & -t;
    return a = (a & 42) !== 0 ? 1 : mo(a), (a & (e.suspendedLanes | t)) !== 0 ? 0 : a;
  }
  function mo(e) {
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
  function Ds(e) {
    return e &= -e, 2 < e ? 8 < e ? (e & 134217727) !== 0 ? 32 : 268435456 : 8 : 2;
  }
  function xo() {
    var e = G.p;
    return e !== 0 ? e : (e = window.event, e === void 0 ? 32 : Wp(e.type));
  }
  function go(e, t) {
    var a = G.p;
    try {
      return G.p = e, t();
    } finally {
      G.p = a;
    }
  }
  var wa = Math.random().toString(36).slice(2), ft = "__reactFiber$" + wa, St = "__reactProps$" + wa, di = "__reactContainer$" + wa, Us = "__reactEvents$" + wa, Df = "__reactListeners$" + wa, Uf = "__reactHandles$" + wa, bo = "__reactResources$" + wa, ui = "__reactMarker$" + wa;
  function Rs(e) {
    delete e[ft], delete e[St], delete e[Us], delete e[Df], delete e[Uf];
  }
  function yl(e) {
    var t = e[ft];
    if (t) return t;
    for (var a = e.parentNode; a; ) {
      if (t = a[di] || a[ft]) {
        if (a = t.alternate, t.child !== null || a !== null && a.child !== null) for (e = qp(e); e !== null; ) {
          if (a = e[ft]) return a;
          e = qp(e);
        }
        return t;
      }
      e = a, a = e.parentNode;
    }
    return null;
  }
  function Sl(e) {
    if (e = e[ft] || e[di]) {
      var t = e.tag;
      if (t === 5 || t === 6 || t === 13 || t === 31 || t === 26 || t === 27 || t === 3) return e;
    }
    return null;
  }
  function pi(e) {
    var t = e.tag;
    if (t === 5 || t === 26 || t === 27 || t === 6) return e.stateNode;
    throw Error(d(33));
  }
  function zl(e) {
    var t = e[bo];
    return t || (t = e[bo] = {
      hoistableStyles: /* @__PURE__ */ new Map(),
      hoistableScripts: /* @__PURE__ */ new Map()
    }), t;
  }
  function ut(e) {
    e[ui] = !0;
  }
  var vo = /* @__PURE__ */ new Set(), jo = {};
  function Wa(e, t) {
    Nl(e, t), Nl(e + "Capture", t);
  }
  function Nl(e, t) {
    for (jo[e] = t, e = 0; e < t.length; e++) vo.add(t[e]);
  }
  var Rf = RegExp("^[:A-Z_a-z\\u00C0-\\u00D6\\u00D8-\\u00F6\\u00F8-\\u02FF\\u0370-\\u037D\\u037F-\\u1FFF\\u200C-\\u200D\\u2070-\\u218F\\u2C00-\\u2FEF\\u3001-\\uD7FF\\uF900-\\uFDCF\\uFDF0-\\uFFFD][:A-Z_a-z\\u00C0-\\u00D6\\u00D8-\\u00F6\\u00F8-\\u02FF\\u0370-\\u037D\\u037F-\\u1FFF\\u200C-\\u200D\\u2070-\\u218F\\u2C00-\\u2FEF\\u3001-\\uD7FF\\uF900-\\uFDCF\\uFDF0-\\uFFFD\\-.0-9\\u00B7\\u0300-\\u036F\\u203F-\\u2040]*$"), yo = {}, So = {};
  function qf(e) {
    return jt.call(So, e) ? !0 : jt.call(yo, e) ? !1 : Rf.test(e) ? So[e] = !0 : (yo[e] = !0, !1);
  }
  function pn(e, t, a) {
    if (qf(t)) if (a === null) e.removeAttribute(t);
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
  function fn(e, t, a) {
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
  function zo(e) {
    var t = e.type;
    return (e = e.nodeName) && e.toLowerCase() === "input" && (t === "checkbox" || t === "radio");
  }
  function Lf(e, t, a) {
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
  function qs(e) {
    if (!e._valueTracker) {
      var t = zo(e) ? "checked" : "value";
      e._valueTracker = Lf(e, t, "" + e[t]);
    }
  }
  function No(e) {
    if (!e) return !1;
    var t = e._valueTracker;
    if (!t) return !0;
    var a = t.getValue(), i = "";
    return e && (i = zo(e) ? e.checked ? "true" : "false" : e.value), e = i, e !== a ? (t.setValue(e), !0) : !1;
  }
  function hn(e) {
    if (e = e || (typeof document < "u" ? document : void 0), typeof e > "u") return null;
    try {
      return e.activeElement || e.body;
    } catch {
      return e.body;
    }
  }
  var Hf = /[\n"\\]/g;
  function qt(e) {
    return e.replace(Hf, function(t) {
      return "\\" + t.charCodeAt(0).toString(16) + " ";
    });
  }
  function Ls(e, t, a, i, n, s, c, o) {
    e.name = "", c != null && typeof c != "function" && typeof c != "symbol" && typeof c != "boolean" ? e.type = c : e.removeAttribute("type"), t != null ? c === "number" ? (t === 0 && e.value === "" || e.value != t) && (e.value = "" + Rt(t)) : e.value !== "" + Rt(t) && (e.value = "" + Rt(t)) : c !== "submit" && c !== "reset" || e.removeAttribute("value"), t != null ? Hs(e, c, Rt(t)) : a != null ? Hs(e, c, Rt(a)) : i != null && e.removeAttribute("value"), n == null && s != null && (e.defaultChecked = !!s), n != null && (e.checked = n && typeof n != "function" && typeof n != "symbol"), o != null && typeof o != "function" && typeof o != "symbol" && typeof o != "boolean" ? e.name = "" + Rt(o) : e.removeAttribute("name");
  }
  function wo(e, t, a, i, n, s, c, o) {
    if (s != null && typeof s != "function" && typeof s != "symbol" && typeof s != "boolean" && (e.type = s), t != null || a != null) {
      if (!(s !== "submit" && s !== "reset" || t != null)) {
        qs(e);
        return;
      }
      a = a != null ? "" + Rt(a) : "", t = t != null ? "" + Rt(t) : a, o || t === e.value || (e.value = t), e.defaultValue = t;
    }
    i = i ?? n, i = typeof i != "function" && typeof i != "symbol" && !!i, e.checked = o ? e.checked : !!i, e.defaultChecked = !!i, c != null && typeof c != "function" && typeof c != "symbol" && typeof c != "boolean" && (e.name = c), qs(e);
  }
  function Hs(e, t, a) {
    t === "number" && hn(e.ownerDocument) === e || e.defaultValue === "" + a || (e.defaultValue = "" + a);
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
  function _o(e, t, a) {
    if (t != null && (t = "" + Rt(t), t !== e.value && (e.value = t), a == null)) {
      e.defaultValue !== t && (e.defaultValue = t);
      return;
    }
    e.defaultValue = a != null ? "" + Rt(a) : "";
  }
  function ko(e, t, a, i) {
    if (t == null) {
      if (i != null) {
        if (a != null) throw Error(d(92));
        if (Q(i)) {
          if (1 < i.length) throw Error(d(93));
          i = i[0];
        }
        a = i;
      }
      a ??= "", t = a;
    }
    a = Rt(t), e.defaultValue = a, i = e.textContent, i === a && i !== "" && i !== null && (e.value = i), qs(e);
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
  var Bf = new Set("animationIterationCount aspectRatio borderImageOutset borderImageSlice borderImageWidth boxFlex boxFlexGroup boxOrdinalGroup columnCount columns flex flexGrow flexPositive flexShrink flexNegative flexOrder gridArea gridRow gridRowEnd gridRowSpan gridRowStart gridColumn gridColumnEnd gridColumnSpan gridColumnStart fontWeight lineClamp lineHeight opacity order orphans scale tabSize widows zIndex zoom fillOpacity floodOpacity stopOpacity strokeDasharray strokeDashoffset strokeMiterlimit strokeOpacity strokeWidth MozAnimationIterationCount MozBoxFlex MozBoxFlexGroup MozLineClamp msAnimationIterationCount msFlex msZoom msFlexGrow msFlexNegative msFlexOrder msFlexPositive msFlexShrink msGridColumn msGridColumnSpan msGridRow msGridRowSpan WebkitAnimationIterationCount WebkitBoxFlex WebKitBoxFlexGroup WebkitBoxOrdinalGroup WebkitColumnCount WebkitColumns WebkitFlex WebkitFlexGrow WebkitFlexPositive WebkitFlexShrink WebkitLineClamp".split(" "));
  function Eo(e, t, a) {
    var i = t.indexOf("--") === 0;
    a == null || typeof a == "boolean" || a === "" ? i ? e.setProperty(t, "") : t === "float" ? e.cssFloat = "" : e[t] = "" : i ? e.setProperty(t, a) : typeof a != "number" || a === 0 || Bf.has(t) ? t === "float" ? e.cssFloat = a : e[t] = ("" + a).trim() : e[t] = a + "px";
  }
  function Ao(e, t, a) {
    if (t != null && typeof t != "object") throw Error(d(62));
    if (e = e.style, a != null) {
      for (var i in a) !a.hasOwnProperty(i) || t != null && t.hasOwnProperty(i) || (i.indexOf("--") === 0 ? e.setProperty(i, "") : i === "float" ? e.cssFloat = "" : e[i] = "");
      for (var n in t) i = t[n], t.hasOwnProperty(n) && a[n] !== i && Eo(e, n, i);
    } else for (var s in t) t.hasOwnProperty(s) && Eo(e, s, t[s]);
  }
  function Bs(e) {
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
  var Gf = /* @__PURE__ */ new Map([
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
  ]), Yf = /^[\u0000-\u001F ]*j[\r\n\t]*a[\r\n\t]*v[\r\n\t]*a[\r\n\t]*s[\r\n\t]*c[\r\n\t]*r[\r\n\t]*i[\r\n\t]*p[\r\n\t]*t[\r\n\t]*:/i;
  function mn(e) {
    return Yf.test("" + e) ? "javascript:throw new Error('React has blocked a javascript: URL as a security precaution.')" : e;
  }
  function sa() {
  }
  var Gs = null;
  function Ys(e) {
    return e = e.target || e.srcElement || window, e.correspondingUseElement && (e = e.correspondingUseElement), e.nodeType === 3 ? e.parentNode : e;
  }
  var kl = null, El = null;
  function To(e) {
    var t = Sl(e);
    if (t && (e = t.stateNode)) {
      var a = e[St] || null;
      e: switch (e = t.stateNode, t.type) {
        case "input":
          if (Ls(e, a.value, a.defaultValue, a.defaultValue, a.checked, a.defaultChecked, a.type, a.name), t = a.name, a.type === "radio" && t != null) {
            for (a = e; a.parentNode; ) a = a.parentNode;
            for (a = a.querySelectorAll('input[name="' + qt("" + t) + '"][type="radio"]'), t = 0; t < a.length; t++) {
              var i = a[t];
              if (i !== e && i.form === e.form) {
                var n = i[St] || null;
                if (!n) throw Error(d(90));
                Ls(i, n.value, n.defaultValue, n.defaultValue, n.checked, n.defaultChecked, n.type, n.name);
              }
            }
            for (t = 0; t < a.length; t++) i = a[t], i.form === e.form && No(i);
          }
          break e;
        case "textarea":
          _o(e, a.value, a.defaultValue);
          break e;
        case "select":
          t = a.value, t != null && wl(e, !!a.multiple, t, !1);
      }
    }
  }
  var Vs = !1;
  function Co(e, t, a) {
    if (Vs) return e(t, a);
    Vs = !0;
    try {
      return e(t);
    } finally {
      if (Vs = !1, (kl !== null || El !== null) && (as(), kl && (t = kl, e = El, El = kl = null, To(t), e)))
        for (t = 0; t < e.length; t++) To(e[t]);
    }
  }
  function fi(e, t) {
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
    if (a && typeof a != "function") throw Error(d(231, t, typeof a));
    return a;
  }
  var ca = !(typeof window > "u" || typeof window.document > "u" || typeof window.document.createElement > "u"), Xs = !1;
  if (ca) try {
    var hi = {};
    Object.defineProperty(hi, "passive", { get: function() {
      Xs = !0;
    } }), window.addEventListener("test", hi, hi), window.removeEventListener("test", hi, hi);
  } catch {
    Xs = !1;
  }
  var _a = null, Qs = null, xn = null;
  function Oo() {
    if (xn) return xn;
    var e, t = Qs, a = t.length, i, n = "value" in _a ? _a.value : _a.textContent, s = n.length;
    for (e = 0; e < a && t[e] === n[e]; e++) ;
    var c = a - e;
    for (i = 1; i <= c && t[a - i] === n[s - i]; i++) ;
    return xn = n.slice(e, 1 < i ? 1 - i : void 0);
  }
  function gn(e) {
    var t = e.keyCode;
    return "charCode" in e ? (e = e.charCode, e === 0 && t === 13 && (e = 13)) : e = t, e === 10 && (e = 13), 32 <= e || e === 13 ? e : 0;
  }
  function bn() {
    return !0;
  }
  function Mo() {
    return !1;
  }
  function zt(e) {
    function t(a, i, n, s, c) {
      this._reactName = a, this._targetInst = n, this.type = i, this.nativeEvent = s, this.target = c, this.currentTarget = null;
      for (var o in e) e.hasOwnProperty(o) && (a = e[o], this[o] = a ? a(s) : s[o]);
      return this.isDefaultPrevented = (s.defaultPrevented != null ? s.defaultPrevented : s.returnValue === !1) ? bn : Mo, this.isPropagationStopped = Mo, this;
    }
    return R(t.prototype, {
      preventDefault: function() {
        this.defaultPrevented = !0;
        var a = this.nativeEvent;
        a && (a.preventDefault ? a.preventDefault() : typeof a.returnValue != "unknown" && (a.returnValue = !1), this.isDefaultPrevented = bn);
      },
      stopPropagation: function() {
        var a = this.nativeEvent;
        a && (a.stopPropagation ? a.stopPropagation() : typeof a.cancelBubble != "unknown" && (a.cancelBubble = !0), this.isPropagationStopped = bn);
      },
      persist: function() {
      },
      isPersistent: bn
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
  }, vn = zt(Fa), mi = R({}, Fa, {
    view: 0,
    detail: 0
  }), Vf = zt(mi), Zs, Ks, xi, jn = R({}, mi, {
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
    getModifierState: Is,
    button: 0,
    buttons: 0,
    relatedTarget: function(e) {
      return e.relatedTarget === void 0 ? e.fromElement === e.srcElement ? e.toElement : e.fromElement : e.relatedTarget;
    },
    movementX: function(e) {
      return "movementX" in e ? e.movementX : (e !== xi && (xi && e.type === "mousemove" ? (Zs = e.screenX - xi.screenX, Ks = e.screenY - xi.screenY) : Ks = Zs = 0, xi = e), Zs);
    },
    movementY: function(e) {
      return "movementY" in e ? e.movementY : Ks;
    }
  }), Do = zt(jn), Xf = zt(R({}, jn, { dataTransfer: 0 })), Js = zt(R({}, mi, { relatedTarget: 0 })), Qf = zt(R({}, Fa, {
    animationName: 0,
    elapsedTime: 0,
    pseudoElement: 0
  })), Zf = zt(R({}, Fa, { clipboardData: function(e) {
    return "clipboardData" in e ? e.clipboardData : window.clipboardData;
  } })), Uo = zt(R({}, Fa, { data: 0 })), Kf = {
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
  }, Jf = {
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
  }, If = {
    Alt: "altKey",
    Control: "ctrlKey",
    Meta: "metaKey",
    Shift: "shiftKey"
  };
  function $f(e) {
    var t = this.nativeEvent;
    return t.getModifierState ? t.getModifierState(e) : (e = If[e]) ? !!t[e] : !1;
  }
  function Is() {
    return $f;
  }
  var Wf = zt(R({}, mi, {
    key: function(e) {
      if (e.key) {
        var t = Kf[e.key] || e.key;
        if (t !== "Unidentified") return t;
      }
      return e.type === "keypress" ? (e = gn(e), e === 13 ? "Enter" : String.fromCharCode(e)) : e.type === "keydown" || e.type === "keyup" ? Jf[e.keyCode] || "Unidentified" : "";
    },
    code: 0,
    location: 0,
    ctrlKey: 0,
    shiftKey: 0,
    altKey: 0,
    metaKey: 0,
    repeat: 0,
    locale: 0,
    getModifierState: Is,
    charCode: function(e) {
      return e.type === "keypress" ? gn(e) : 0;
    },
    keyCode: function(e) {
      return e.type === "keydown" || e.type === "keyup" ? e.keyCode : 0;
    },
    which: function(e) {
      return e.type === "keypress" ? gn(e) : e.type === "keydown" || e.type === "keyup" ? e.keyCode : 0;
    }
  })), Ro = zt(R({}, jn, {
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
  })), Ff = zt(R({}, mi, {
    touches: 0,
    targetTouches: 0,
    changedTouches: 0,
    altKey: 0,
    metaKey: 0,
    ctrlKey: 0,
    shiftKey: 0,
    getModifierState: Is
  })), Pf = zt(R({}, Fa, {
    propertyName: 0,
    elapsedTime: 0,
    pseudoElement: 0
  })), e0 = zt(R({}, jn, {
    deltaX: function(e) {
      return "deltaX" in e ? e.deltaX : "wheelDeltaX" in e ? -e.wheelDeltaX : 0;
    },
    deltaY: function(e) {
      return "deltaY" in e ? e.deltaY : "wheelDeltaY" in e ? -e.wheelDeltaY : "wheelDelta" in e ? -e.wheelDelta : 0;
    },
    deltaZ: 0,
    deltaMode: 0
  })), t0 = zt(R({}, Fa, {
    newState: 0,
    oldState: 0
  })), a0 = [
    9,
    13,
    27,
    32
  ], $s = ca && "CompositionEvent" in window, gi = null;
  ca && "documentMode" in document && (gi = document.documentMode);
  var l0 = ca && "TextEvent" in window && !gi, qo = ca && (!$s || gi && 8 < gi && 11 >= gi), Lo = " ", Ho = !1;
  function Bo(e, t) {
    switch (e) {
      case "keyup":
        return a0.indexOf(t.keyCode) !== -1;
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
  function Go(e) {
    return e = e.detail, typeof e == "object" && "data" in e ? e.data : null;
  }
  var Al = !1;
  function i0(e, t) {
    switch (e) {
      case "compositionend":
        return Go(t);
      case "keypress":
        return t.which !== 32 ? null : (Ho = !0, Lo);
      case "textInput":
        return e = t.data, e === Lo && Ho ? null : e;
      default:
        return null;
    }
  }
  function n0(e, t) {
    if (Al) return e === "compositionend" || !$s && Bo(e, t) ? (e = Oo(), xn = Qs = _a = null, Al = !1, e) : null;
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
        return qo && t.locale !== "ko" ? null : t.data;
      default:
        return null;
    }
  }
  var s0 = {
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
  function Yo(e) {
    var t = e && e.nodeName && e.nodeName.toLowerCase();
    return t === "input" ? !!s0[e.type] : t === "textarea";
  }
  function Vo(e, t, a, i) {
    kl ? El ? El.push(i) : El = [i] : kl = i, t = os(t, "onChange"), 0 < t.length && (a = new vn("onChange", "change", null, a, i), e.push({
      event: a,
      listeners: t
    }));
  }
  var bi = null, vi = null;
  function c0(e) {
    Sp(e, 0);
  }
  function yn(e) {
    if (No(pi(e))) return e;
  }
  function Xo(e, t) {
    if (e === "change") return t;
  }
  var Qo = !1;
  if (ca) {
    var Ws;
    if (ca) {
      var Fs = "oninput" in document;
      if (!Fs) {
        var Zo = document.createElement("div");
        Zo.setAttribute("oninput", "return;"), Fs = typeof Zo.oninput == "function";
      }
      Ws = Fs;
    } else Ws = !1;
    Qo = Ws && (!document.documentMode || 9 < document.documentMode);
  }
  function Ko() {
    bi && (bi.detachEvent("onpropertychange", Jo), vi = bi = null);
  }
  function Jo(e) {
    if (e.propertyName === "value" && yn(vi)) {
      var t = [];
      Vo(t, vi, e, Ys(e)), Co(c0, t);
    }
  }
  function r0(e, t, a) {
    e === "focusin" ? (Ko(), bi = t, vi = a, bi.attachEvent("onpropertychange", Jo)) : e === "focusout" && Ko();
  }
  function o0(e) {
    if (e === "selectionchange" || e === "keyup" || e === "keydown") return yn(vi);
  }
  function d0(e, t) {
    if (e === "click") return yn(t);
  }
  function u0(e, t) {
    if (e === "input" || e === "change") return yn(t);
  }
  function p0(e, t) {
    return e === t && (e !== 0 || 1 / e === 1 / t) || e !== e && t !== t;
  }
  var At = typeof Object.is == "function" ? Object.is : p0;
  function ji(e, t) {
    if (At(e, t)) return !0;
    if (typeof e != "object" || e === null || typeof t != "object" || t === null) return !1;
    var a = Object.keys(e), i = Object.keys(t);
    if (a.length !== i.length) return !1;
    for (i = 0; i < a.length; i++) {
      var n = a[i];
      if (!jt.call(t, n) || !At(e[n], t[n])) return !1;
    }
    return !0;
  }
  function Io(e) {
    for (; e && e.firstChild; ) e = e.firstChild;
    return e;
  }
  function $o(e, t) {
    var a = Io(e);
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
      a = Io(a);
    }
  }
  function Wo(e, t) {
    return e && t ? e === t ? !0 : e && e.nodeType === 3 ? !1 : t && t.nodeType === 3 ? Wo(e, t.parentNode) : "contains" in e ? e.contains(t) : e.compareDocumentPosition ? !!(e.compareDocumentPosition(t) & 16) : !1 : !1;
  }
  function Fo(e) {
    e = e != null && e.ownerDocument != null && e.ownerDocument.defaultView != null ? e.ownerDocument.defaultView : window;
    for (var t = hn(e.document); t instanceof e.HTMLIFrameElement; ) {
      try {
        var a = typeof t.contentWindow.location.href == "string";
      } catch {
        a = !1;
      }
      if (a) e = t.contentWindow;
      else break;
      t = hn(e.document);
    }
    return t;
  }
  function Ps(e) {
    var t = e && e.nodeName && e.nodeName.toLowerCase();
    return t && (t === "input" && (e.type === "text" || e.type === "search" || e.type === "tel" || e.type === "url" || e.type === "password") || t === "textarea" || e.contentEditable === "true");
  }
  var f0 = ca && "documentMode" in document && 11 >= document.documentMode, Tl = null, ec = null, yi = null, tc = !1;
  function Po(e, t, a) {
    var i = a.window === a ? a.document : a.nodeType === 9 ? a : a.ownerDocument;
    tc || Tl == null || Tl !== hn(i) || (i = Tl, "selectionStart" in i && Ps(i) ? i = {
      start: i.selectionStart,
      end: i.selectionEnd
    } : (i = (i.ownerDocument && i.ownerDocument.defaultView || window).getSelection(), i = {
      anchorNode: i.anchorNode,
      anchorOffset: i.anchorOffset,
      focusNode: i.focusNode,
      focusOffset: i.focusOffset
    }), yi && ji(yi, i) || (yi = i, i = os(ec, "onSelect"), 0 < i.length && (t = new vn("onSelect", "select", null, t, a), e.push({
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
  }, ac = {}, ed = {};
  ca && (ed = document.createElement("div").style, "AnimationEvent" in window || (delete Cl.animationend.animation, delete Cl.animationiteration.animation, delete Cl.animationstart.animation), "TransitionEvent" in window || delete Cl.transitionend.transition);
  function el(e) {
    if (ac[e]) return ac[e];
    if (!Cl[e]) return e;
    var t = Cl[e], a;
    for (a in t) if (t.hasOwnProperty(a) && a in ed) return ac[e] = t[a];
    return e;
  }
  var td = el("animationend"), ad = el("animationiteration"), ld = el("animationstart"), h0 = el("transitionrun"), m0 = el("transitionstart"), x0 = el("transitioncancel"), id = el("transitionend"), nd = /* @__PURE__ */ new Map(), lc = "abort auxClick beforeToggle cancel canPlay canPlayThrough click close contextMenu copy cut drag dragEnd dragEnter dragExit dragLeave dragOver dragStart drop durationChange emptied encrypted ended error gotPointerCapture input invalid keyDown keyPress keyUp load loadedData loadedMetadata loadStart lostPointerCapture mouseDown mouseMove mouseOut mouseOver mouseUp paste pause play playing pointerCancel pointerDown pointerMove pointerOut pointerOver pointerUp progress rateChange reset resize seeked seeking stalled submit suspend timeUpdate touchCancel touchEnd touchStart volumeChange scroll toggle touchMove waiting wheel".split(" ");
  lc.push("scrollEnd");
  function It(e, t) {
    nd.set(e, t), Wa(t, [e]);
  }
  var Sn = typeof reportError == "function" ? reportError : function(e) {
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
  }, Lt = [], Ol = 0, ic = 0;
  function zn() {
    for (var e = Ol, t = ic = Ol = 0; t < e; ) {
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
      s !== 0 && sd(a, n, s);
    }
  }
  function Nn(e, t, a, i) {
    Lt[Ol++] = e, Lt[Ol++] = t, Lt[Ol++] = a, Lt[Ol++] = i, ic |= i, e.lanes |= i, e = e.alternate, e !== null && (e.lanes |= i);
  }
  function nc(e, t, a, i) {
    return Nn(e, t, a, i), wn(e);
  }
  function tl(e, t) {
    return Nn(e, null, null, t), wn(e);
  }
  function sd(e, t, a) {
    e.lanes |= a;
    var i = e.alternate;
    i !== null && (i.lanes |= a);
    for (var n = !1, s = e.return; s !== null; ) s.childLanes |= a, i = s.alternate, i !== null && (i.childLanes |= a), s.tag === 22 && (e = s.stateNode, e === null || e._visibility & 1 || (n = !0)), e = s, s = s.return;
    return e.tag === 3 ? (s = e.stateNode, n && t !== null && (n = 31 - ot(a), e = s.hiddenUpdates, i = e[n], i === null ? e[n] = [t] : i.push(t), t.lane = a | 536870912), s) : null;
  }
  function wn(e) {
    if (50 < Vi) throw Vi = 0, hr = null, Error(d(185));
    for (var t = e.return; t !== null; ) e = t, t = e.return;
    return e.tag === 3 ? e.stateNode : null;
  }
  var Ml = {};
  function g0(e, t, a, i) {
    this.tag = e, this.key = a, this.sibling = this.child = this.return = this.stateNode = this.type = this.elementType = null, this.index = 0, this.refCleanup = this.ref = null, this.pendingProps = t, this.dependencies = this.memoizedState = this.updateQueue = this.memoizedProps = null, this.mode = i, this.subtreeFlags = this.flags = 0, this.deletions = null, this.childLanes = this.lanes = 0, this.alternate = null;
  }
  function Tt(e, t, a, i) {
    return new g0(e, t, a, i);
  }
  function sc(e) {
    return e = e.prototype, !(!e || !e.isReactComponent);
  }
  function ra(e, t) {
    var a = e.alternate;
    return a === null ? (a = Tt(e.tag, t, e.key, e.mode), a.elementType = e.elementType, a.type = e.type, a.stateNode = e.stateNode, a.alternate = e, e.alternate = a) : (a.pendingProps = t, a.type = e.type, a.flags = 0, a.subtreeFlags = 0, a.deletions = null), a.flags = e.flags & 65011712, a.childLanes = e.childLanes, a.lanes = e.lanes, a.child = e.child, a.memoizedProps = e.memoizedProps, a.memoizedState = e.memoizedState, a.updateQueue = e.updateQueue, t = e.dependencies, a.dependencies = t === null ? null : {
      lanes: t.lanes,
      firstContext: t.firstContext
    }, a.sibling = e.sibling, a.index = e.index, a.ref = e.ref, a.refCleanup = e.refCleanup, a;
  }
  function cd(e, t) {
    e.flags &= 65011714;
    var a = e.alternate;
    return a === null ? (e.childLanes = 0, e.lanes = t, e.child = null, e.subtreeFlags = 0, e.memoizedProps = null, e.memoizedState = null, e.updateQueue = null, e.dependencies = null, e.stateNode = null) : (e.childLanes = a.childLanes, e.lanes = a.lanes, e.child = a.child, e.subtreeFlags = 0, e.deletions = null, e.memoizedProps = a.memoizedProps, e.memoizedState = a.memoizedState, e.updateQueue = a.updateQueue, e.type = a.type, t = a.dependencies, e.dependencies = t === null ? null : {
      lanes: t.lanes,
      firstContext: t.firstContext
    }), e;
  }
  function _n(e, t, a, i, n, s) {
    var c = 0;
    if (i = e, typeof e == "function") sc(e) && (c = 1);
    else if (typeof e == "string") c = zh(e, a, ee.current) ? 26 : e === "html" || e === "head" || e === "body" ? 27 : 5;
    else e: switch (e) {
      case j:
        return e = Tt(31, a, t, n), e.elementType = j, e.lanes = s, e;
      case W:
        return al(a.children, n, s, t);
      case le:
        c = 8, n |= 24;
        break;
      case X:
        return e = Tt(12, a, t, n | 2), e.elementType = X, e.lanes = s, e;
      case te:
        return e = Tt(13, a, t, n), e.elementType = te, e.lanes = s, e;
      case ge:
        return e = Tt(19, a, t, n), e.elementType = ge, e.lanes = s, e;
      default:
        if (typeof e == "object" && e !== null) switch (e.$$typeof) {
          case H:
            c = 10;
            break e;
          case oe:
            c = 9;
            break e;
          case F:
            c = 11;
            break e;
          case ce:
            c = 14;
            break e;
          case I:
            c = 16, i = null;
            break e;
        }
        c = 29, a = Error(d(130, e === null ? "null" : typeof e, "")), i = null;
    }
    return t = Tt(c, a, t, n), t.elementType = e, t.type = i, t.lanes = s, t;
  }
  function al(e, t, a, i) {
    return e = Tt(7, e, i, t), e.lanes = a, e;
  }
  function cc(e, t, a) {
    return e = Tt(6, e, null, t), e.lanes = a, e;
  }
  function rd(e) {
    var t = Tt(18, null, null, 0);
    return t.stateNode = e, t;
  }
  function rc(e, t, a) {
    return t = Tt(4, e.children !== null ? e.children : [], e.key, t), t.lanes = a, t.stateNode = {
      containerInfo: e.containerInfo,
      pendingChildren: null,
      implementation: e.implementation
    }, t;
  }
  var od = /* @__PURE__ */ new WeakMap();
  function Ht(e, t) {
    if (typeof e == "object" && e !== null) {
      var a = od.get(e);
      return a !== void 0 ? a : (t = {
        value: e,
        source: t,
        stack: We(t)
      }, od.set(e, t), t);
    }
    return {
      value: e,
      source: t,
      stack: We(t)
    };
  }
  var Dl = [], Ul = 0, kn = null, Si = 0, Bt = [], Gt = 0, ka = null, ta = 1, aa = "";
  function oa(e, t) {
    Dl[Ul++] = Si, Dl[Ul++] = kn, kn = e, Si = t;
  }
  function dd(e, t, a) {
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
  function oc(e) {
    e.return !== null && (oa(e, 1), dd(e, 1, 0));
  }
  function dc(e) {
    for (; e === kn; ) kn = Dl[--Ul], Dl[Ul] = null, Si = Dl[--Ul], Dl[Ul] = null;
    for (; e === ka; ) ka = Bt[--Gt], Bt[Gt] = null, aa = Bt[--Gt], Bt[Gt] = null, ta = Bt[--Gt], Bt[Gt] = null;
  }
  function ud(e, t) {
    Bt[Gt++] = ta, Bt[Gt++] = aa, Bt[Gt++] = ka, ta = t.id, aa = t.overflow, ka = e;
  }
  var ht = null, Je = null, Me = !1, Ea = null, Yt = !1, uc = Error(d(519));
  function Aa(e) {
    throw zi(Ht(Error(d(418, 1 < arguments.length && arguments[1] !== void 0 && arguments[1] ? "text" : "HTML", "")), e)), uc;
  }
  function pd(e) {
    var t = e.stateNode, a = e.type, i = e.memoizedProps;
    switch (t[ft] = e, t[St] = i, a) {
      case "dialog":
        Te("cancel", t), Te("close", t);
        break;
      case "iframe":
      case "object":
      case "embed":
        Te("load", t);
        break;
      case "video":
      case "audio":
        for (a = 0; a < Qi.length; a++) Te(Qi[a], t);
        break;
      case "source":
        Te("error", t);
        break;
      case "img":
      case "image":
      case "link":
        Te("error", t), Te("load", t);
        break;
      case "details":
        Te("toggle", t);
        break;
      case "input":
        Te("invalid", t), wo(t, i.value, i.defaultValue, i.checked, i.defaultChecked, i.type, i.name, !0);
        break;
      case "select":
        Te("invalid", t);
        break;
      case "textarea":
        Te("invalid", t), ko(t, i.value, i.defaultValue, i.children);
    }
    a = i.children, typeof a != "string" && typeof a != "number" && typeof a != "bigint" || t.textContent === "" + a || i.suppressHydrationWarning === !0 || kp(t.textContent, a) ? (i.popover != null && (Te("beforetoggle", t), Te("toggle", t)), i.onScroll != null && Te("scroll", t), i.onScrollEnd != null && Te("scrollend", t), i.onClick != null && (t.onclick = sa), t = !0) : t = !1, t || Aa(e, !0);
  }
  function fd(e) {
    for (ht = e.return; ht; ) switch (ht.tag) {
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
        ht = ht.return;
    }
  }
  function Rl(e) {
    if (e !== ht) return !1;
    if (!Me) return fd(e), Me = !0, !1;
    var t = e.tag, a;
    if ((a = t !== 3 && t !== 27) && ((a = t === 5) && (a = e.type, a = !(a !== "form" && a !== "button") || Er(e.type, e.memoizedProps)), a = !a), a && Je && Aa(e), fd(e), t === 13) {
      if (e = e.memoizedState, e = e !== null ? e.dehydrated : null, !e) throw Error(d(317));
      Je = Rp(e);
    } else if (t === 31) {
      if (e = e.memoizedState, e = e !== null ? e.dehydrated : null, !e) throw Error(d(317));
      Je = Rp(e);
    } else t === 27 ? (t = Je, Ga(e.type) ? (e = Mr, Mr = null, Je = e) : Je = t) : Je = ht ? Qt(e.stateNode.nextSibling) : null;
    return !0;
  }
  function ll() {
    Je = ht = null, Me = !1;
  }
  function pc() {
    var e = Ea;
    return e !== null && (kt === null ? kt = e : kt.push.apply(kt, e), Ea = null), e;
  }
  function zi(e) {
    Ea === null ? Ea = [e] : Ea.push(e);
  }
  var fc = f(null), il = null, da = null;
  function Ta(e, t, a) {
    K(fc, t._currentValue), t._currentValue = a;
  }
  function ua(e) {
    e._currentValue = fc.current, D(fc);
  }
  function hc(e, t, a) {
    for (; e !== null; ) {
      var i = e.alternate;
      if ((e.childLanes & t) !== t ? (e.childLanes |= t, i !== null && (i.childLanes |= t)) : i !== null && (i.childLanes & t) !== t && (i.childLanes |= t), e === a) break;
      e = e.return;
    }
  }
  function mc(e, t, a, i) {
    var n = e.child;
    for (n !== null && (n.return = e); n !== null; ) {
      var s = n.dependencies;
      if (s !== null) {
        var c = n.child;
        s = s.firstContext;
        e: for (; s !== null; ) {
          var o = s;
          s = n;
          for (var x = 0; x < t.length; x++) if (o.context === t[x]) {
            s.lanes |= a, o = s.alternate, o !== null && (o.lanes |= a), hc(s.return, a, e), i || (c = null);
            break e;
          }
          s = o.next;
        }
      } else if (n.tag === 18) {
        if (c = n.return, c === null) throw Error(d(341));
        c.lanes |= a, s = c.alternate, s !== null && (s.lanes |= a), hc(c, a, e), c = null;
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
        if (c === null) throw Error(d(387));
        if (c = c.memoizedProps, c !== null) {
          var o = n.type;
          At(n.pendingProps.value, c.value) || (e !== null ? e.push(o) : e = [o]);
        }
      } else if (n === je.current) {
        if (c = n.alternate, c === null) throw Error(d(387));
        c.memoizedState.memoizedState !== n.memoizedState.memoizedState && (e !== null ? e.push($i) : e = [$i]);
      }
      n = n.return;
    }
    e !== null && mc(t, e, a, i), t.flags |= 262144;
  }
  function En(e) {
    for (e = e.firstContext; e !== null; ) {
      if (!At(e.context._currentValue, e.memoizedValue)) return !0;
      e = e.next;
    }
    return !1;
  }
  function nl(e) {
    il = e, da = null, e = e.dependencies, e !== null && (e.firstContext = null);
  }
  function mt(e) {
    return hd(il, e);
  }
  function An(e, t) {
    return il === null && nl(e), hd(e, t);
  }
  function hd(e, t) {
    var a = t._currentValue;
    if (t = {
      context: t,
      memoizedValue: a,
      next: null
    }, da === null) {
      if (e === null) throw Error(d(308));
      da = t, e.dependencies = {
        lanes: 0,
        firstContext: t
      }, e.flags |= 524288;
    } else da = da.next = t;
    return a;
  }
  var b0 = typeof AbortController < "u" ? AbortController : function() {
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
  }, v0 = m.unstable_scheduleCallback, j0 = m.unstable_NormalPriority, nt = {
    $$typeof: H,
    Consumer: null,
    Provider: null,
    _currentValue: null,
    _currentValue2: null,
    _threadCount: 0
  };
  function xc() {
    return {
      controller: new b0(),
      data: /* @__PURE__ */ new Map(),
      refCount: 0
    };
  }
  function Ni(e) {
    e.refCount--, e.refCount === 0 && v0(j0, function() {
      e.controller.abort();
    });
  }
  var wi = null, gc = 0, Ll = 0, Hl = null;
  function y0(e, t) {
    if (wi === null) {
      var a = wi = [];
      gc = 0, Ll = jr(), Hl = {
        status: "pending",
        value: void 0,
        then: function(i) {
          a.push(i);
        }
      };
    }
    return gc++, t.then(md, md), t;
  }
  function md() {
    if (--gc === 0 && wi !== null) {
      Hl !== null && (Hl.status = "fulfilled");
      var e = wi;
      wi = null, Ll = 0, Hl = null;
      for (var t = 0; t < e.length; t++) (0, e[t])();
    }
  }
  function S0(e, t) {
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
  var xd = B.S;
  B.S = function(e, t) {
    $u = et(), typeof t == "object" && t !== null && typeof t.then == "function" && y0(e, t), xd !== null && xd(e, t);
  };
  var sl = f(null);
  function bc() {
    var e = sl.current;
    return e !== null ? e : Ke.pooledCache;
  }
  function Tn(e, t) {
    t === null ? K(sl, sl.current) : K(sl, t.pool);
  }
  function gd() {
    var e = bc();
    return e === null ? null : {
      parent: nt._currentValue,
      pool: e
    };
  }
  var Bl = Error(d(460)), vc = Error(d(474)), Cn = Error(d(542)), On = { then: function() {
  } };
  function bd(e) {
    return e = e.status, e === "fulfilled" || e === "rejected";
  }
  function vd(e, t, a) {
    switch (a = e[a], a === void 0 ? e.push(t) : a !== t && (t.then(sa, sa), t = a), t.status) {
      case "fulfilled":
        return t.value;
      case "rejected":
        throw e = t.reason, yd(e), e;
      default:
        if (typeof t.status == "string") t.then(sa, sa);
        else {
          if (e = Ke, e !== null && 100 < e.shellSuspendCounter) throw Error(d(482));
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
            throw e = t.reason, yd(e), e;
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
  function jd() {
    if (rl === null) throw Error(d(459));
    var e = rl;
    return rl = null, e;
  }
  function yd(e) {
    if (e === Bl || e === Cn) throw Error(d(483));
  }
  var Gl = null, _i = 0;
  function Mn(e) {
    var t = _i;
    return _i += 1, Gl === null && (Gl = []), vd(Gl, e, t);
  }
  function ki(e, t) {
    t = t.props.ref, e.ref = t !== void 0 ? t : null;
  }
  function Dn(e, t) {
    throw t.$$typeof === re ? Error(d(525)) : (e = Object.prototype.toString.call(t), Error(d(31, e === "[object Object]" ? "object with keys {" + Object.keys(t).join(", ") + "}" : e)));
  }
  function Sd(e) {
    function t(S, b) {
      if (e) {
        var E = S.deletions;
        E === null ? (S.deletions = [b], S.flags |= 16) : E.push(b);
      }
    }
    function a(S, b) {
      if (!e) return null;
      for (; b !== null; ) t(S, b), b = b.sibling;
      return null;
    }
    function i(S) {
      for (var b = /* @__PURE__ */ new Map(); S !== null; ) S.key !== null ? b.set(S.key, S) : b.set(S.index, S), S = S.sibling;
      return b;
    }
    function n(S, b) {
      return S = ra(S, b), S.index = 0, S.sibling = null, S;
    }
    function s(S, b, E) {
      return S.index = E, e ? (E = S.alternate, E !== null ? (E = E.index, E < b ? (S.flags |= 67108866, b) : E) : (S.flags |= 67108866, b)) : (S.flags |= 1048576, b);
    }
    function c(S) {
      return e && S.alternate === null && (S.flags |= 67108866), S;
    }
    function o(S, b, E, L) {
      return b === null || b.tag !== 6 ? (b = cc(E, S.mode, L), b.return = S, b) : (b = n(b, E), b.return = S, b);
    }
    function x(S, b, E, L) {
      var xe = E.type;
      return xe === W ? q(S, b, E.props.children, L, E.key) : b !== null && (b.elementType === xe || typeof xe == "object" && xe !== null && xe.$$typeof === I && cl(xe) === b.type) ? (b = n(b, E.props), ki(b, E), b.return = S, b) : (b = _n(E.type, E.key, E.props, null, S.mode, L), ki(b, E), b.return = S, b);
    }
    function A(S, b, E, L) {
      return b === null || b.tag !== 4 || b.stateNode.containerInfo !== E.containerInfo || b.stateNode.implementation !== E.implementation ? (b = rc(E, S.mode, L), b.return = S, b) : (b = n(b, E.children || []), b.return = S, b);
    }
    function q(S, b, E, L, xe) {
      return b === null || b.tag !== 7 ? (b = al(E, S.mode, L, xe), b.return = S, b) : (b = n(b, E), b.return = S, b);
    }
    function Y(S, b, E) {
      if (typeof b == "string" && b !== "" || typeof b == "number" || typeof b == "bigint") return b = cc("" + b, S.mode, E), b.return = S, b;
      if (typeof b == "object" && b !== null) {
        switch (b.$$typeof) {
          case pe:
            return E = _n(b.type, b.key, b.props, null, S.mode, E), ki(E, b), E.return = S, E;
          case J:
            return b = rc(b, S.mode, E), b.return = S, b;
          case I:
            return b = cl(b), Y(S, b, E);
        }
        if (Q(b) || he(b)) return b = al(b, S.mode, E, null), b.return = S, b;
        if (typeof b.then == "function") return Y(S, Mn(b), E);
        if (b.$$typeof === H) return Y(S, An(S, b), E);
        Dn(S, b);
      }
      return null;
    }
    function C(S, b, E, L) {
      var xe = b !== null ? b.key : null;
      if (typeof E == "string" && E !== "" || typeof E == "number" || typeof E == "bigint") return xe !== null ? null : o(S, b, "" + E, L);
      if (typeof E == "object" && E !== null) {
        switch (E.$$typeof) {
          case pe:
            return E.key === xe ? x(S, b, E, L) : null;
          case J:
            return E.key === xe ? A(S, b, E, L) : null;
          case I:
            return E = cl(E), C(S, b, E, L);
        }
        if (Q(E) || he(E)) return xe !== null ? null : q(S, b, E, L, null);
        if (typeof E.then == "function") return C(S, b, Mn(E), L);
        if (E.$$typeof === H) return C(S, b, An(S, E), L);
        Dn(S, E);
      }
      return null;
    }
    function U(S, b, E, L, xe) {
      if (typeof L == "string" && L !== "" || typeof L == "number" || typeof L == "bigint") return S = S.get(E) || null, o(b, S, "" + L, xe);
      if (typeof L == "object" && L !== null) {
        switch (L.$$typeof) {
          case pe:
            return S = S.get(L.key === null ? E : L.key) || null, x(b, S, L, xe);
          case J:
            return S = S.get(L.key === null ? E : L.key) || null, A(b, S, L, xe);
          case I:
            return L = cl(L), U(S, b, E, L, xe);
        }
        if (Q(L) || he(L)) return S = S.get(E) || null, q(b, S, L, xe, null);
        if (typeof L.then == "function") return U(S, b, E, Mn(L), xe);
        if (L.$$typeof === H) return U(S, b, E, An(b, L), xe);
        Dn(b, L);
      }
      return null;
    }
    function de(S, b, E, L) {
      for (var xe = null, qe = null, ue = b, ke = b = 0, Oe = null; ue !== null && ke < E.length; ke++) {
        ue.index > ke ? (Oe = ue, ue = null) : Oe = ue.sibling;
        var Le = C(S, ue, E[ke], L);
        if (Le === null) {
          ue === null && (ue = Oe);
          break;
        }
        e && ue && Le.alternate === null && t(S, ue), b = s(Le, b, ke), qe === null ? xe = Le : qe.sibling = Le, qe = Le, ue = Oe;
      }
      if (ke === E.length) return a(S, ue), Me && oa(S, ke), xe;
      if (ue === null) {
        for (; ke < E.length; ke++) ue = Y(S, E[ke], L), ue !== null && (b = s(ue, b, ke), qe === null ? xe = ue : qe.sibling = ue, qe = ue);
        return Me && oa(S, ke), xe;
      }
      for (ue = i(ue); ke < E.length; ke++) Oe = U(ue, S, ke, E[ke], L), Oe !== null && (e && Oe.alternate !== null && ue.delete(Oe.key === null ? ke : Oe.key), b = s(Oe, b, ke), qe === null ? xe = Oe : qe.sibling = Oe, qe = Oe);
      return e && ue.forEach(function(Za) {
        return t(S, Za);
      }), Me && oa(S, ke), xe;
    }
    function ye(S, b, E, L) {
      if (E == null) throw Error(d(151));
      for (var xe = null, qe = null, ue = b, ke = b = 0, Oe = null, Le = E.next(); ue !== null && !Le.done; ke++, Le = E.next()) {
        ue.index > ke ? (Oe = ue, ue = null) : Oe = ue.sibling;
        var Za = C(S, ue, Le.value, L);
        if (Za === null) {
          ue === null && (ue = Oe);
          break;
        }
        e && ue && Za.alternate === null && t(S, ue), b = s(Za, b, ke), qe === null ? xe = Za : qe.sibling = Za, qe = Za, ue = Oe;
      }
      if (Le.done) return a(S, ue), Me && oa(S, ke), xe;
      if (ue === null) {
        for (; !Le.done; ke++, Le = E.next()) Le = Y(S, Le.value, L), Le !== null && (b = s(Le, b, ke), qe === null ? xe = Le : qe.sibling = Le, qe = Le);
        return Me && oa(S, ke), xe;
      }
      for (ue = i(ue); !Le.done; ke++, Le = E.next()) Le = U(ue, S, ke, Le.value, L), Le !== null && (e && Le.alternate !== null && ue.delete(Le.key === null ? ke : Le.key), b = s(Le, b, ke), qe === null ? xe = Le : qe.sibling = Le, qe = Le);
      return e && ue.forEach(function(qh) {
        return t(S, qh);
      }), Me && oa(S, ke), xe;
    }
    function Qe(S, b, E, L) {
      if (typeof E == "object" && E !== null && E.type === W && E.key === null && (E = E.props.children), typeof E == "object" && E !== null) {
        switch (E.$$typeof) {
          case pe:
            e: {
              for (var xe = E.key; b !== null; ) {
                if (b.key === xe) {
                  if (xe = E.type, xe === W) {
                    if (b.tag === 7) {
                      a(S, b.sibling), L = n(b, E.props.children), L.return = S, S = L;
                      break e;
                    }
                  } else if (b.elementType === xe || typeof xe == "object" && xe !== null && xe.$$typeof === I && cl(xe) === b.type) {
                    a(S, b.sibling), L = n(b, E.props), ki(L, E), L.return = S, S = L;
                    break e;
                  }
                  a(S, b);
                  break;
                } else t(S, b);
                b = b.sibling;
              }
              E.type === W ? (L = al(E.props.children, S.mode, L, E.key), L.return = S, S = L) : (L = _n(E.type, E.key, E.props, null, S.mode, L), ki(L, E), L.return = S, S = L);
            }
            return c(S);
          case J:
            e: {
              for (xe = E.key; b !== null; ) {
                if (b.key === xe) if (b.tag === 4 && b.stateNode.containerInfo === E.containerInfo && b.stateNode.implementation === E.implementation) {
                  a(S, b.sibling), L = n(b, E.children || []), L.return = S, S = L;
                  break e;
                } else {
                  a(S, b);
                  break;
                }
                else t(S, b);
                b = b.sibling;
              }
              L = rc(E, S.mode, L), L.return = S, S = L;
            }
            return c(S);
          case I:
            return E = cl(E), Qe(S, b, E, L);
        }
        if (Q(E)) return de(S, b, E, L);
        if (he(E)) {
          if (xe = he(E), typeof xe != "function") throw Error(d(150));
          return E = xe.call(E), ye(S, b, E, L);
        }
        if (typeof E.then == "function") return Qe(S, b, Mn(E), L);
        if (E.$$typeof === H) return Qe(S, b, An(S, E), L);
        Dn(S, E);
      }
      return typeof E == "string" && E !== "" || typeof E == "number" || typeof E == "bigint" ? (E = "" + E, b !== null && b.tag === 6 ? (a(S, b.sibling), L = n(b, E), L.return = S, S = L) : (a(S, b), L = cc(E, S.mode, L), L.return = S, S = L), c(S)) : a(S, b);
    }
    return function(S, b, E, L) {
      try {
        _i = 0;
        var xe = Qe(S, b, E, L);
        return Gl = null, xe;
      } catch (ue) {
        if (ue === Bl || ue === Cn) throw ue;
        var qe = Tt(29, ue, null, S.mode);
        return qe.lanes = L, qe.return = S, qe;
      }
    };
  }
  var ol = Sd(!0), zd = Sd(!1), Ca = !1;
  function jc(e) {
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
  function yc(e, t) {
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
    if (i = i.shared, (He & 2) !== 0) {
      var n = i.pending;
      return n === null ? t.next = t : (t.next = n.next, n.next = t), i.pending = t, t = wn(e), sd(e, null, a), t;
    }
    return Nn(e, i, t, a), wn(e);
  }
  function Ei(e, t, a) {
    if (t = t.updateQueue, t !== null && (t = t.shared, (a & 4194048) !== 0)) {
      var i = t.lanes;
      i &= e.pendingLanes, a |= i, t.lanes = a, fo(e, a);
    }
  }
  function Sc(e, t) {
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
  function Ai() {
    if (zc) {
      var e = Hl;
      if (e !== null) throw e;
    }
  }
  function Ti(e, t, a, i) {
    zc = !1;
    var n = e.updateQueue;
    Ca = !1;
    var s = n.firstBaseUpdate, c = n.lastBaseUpdate, o = n.shared.pending;
    if (o !== null) {
      n.shared.pending = null;
      var x = o, A = x.next;
      x.next = null, c === null ? s = A : c.next = A, c = x;
      var q = e.alternate;
      q !== null && (q = q.updateQueue, o = q.lastBaseUpdate, o !== c && (o === null ? q.firstBaseUpdate = A : o.next = A, q.lastBaseUpdate = x));
    }
    if (s !== null) {
      var Y = n.baseState;
      c = 0, q = A = x = null, o = s;
      do {
        var C = o.lane & -536870913, U = C !== o.lane;
        if (U ? (Ce & C) === C : (i & C) === C) {
          C !== 0 && C === Ll && (zc = !0), q !== null && (q = q.next = {
            lane: 0,
            tag: o.tag,
            payload: o.payload,
            callback: null,
            next: null
          });
          e: {
            var de = e, ye = o;
            C = t;
            var Qe = a;
            switch (ye.tag) {
              case 1:
                if (de = ye.payload, typeof de == "function") {
                  Y = de.call(Qe, Y, C);
                  break e;
                }
                Y = de;
                break e;
              case 3:
                de.flags = de.flags & -65537 | 128;
              case 0:
                if (de = ye.payload, C = typeof de == "function" ? de.call(Qe, Y, C) : de, C == null) break e;
                Y = R({}, Y, C);
                break e;
              case 2:
                Ca = !0;
            }
          }
          C = o.callback, C !== null && (e.flags |= 64, U && (e.flags |= 8192), U = n.callbacks, U === null ? n.callbacks = [C] : U.push(C));
        } else U = {
          lane: C,
          tag: o.tag,
          payload: o.payload,
          callback: o.callback,
          next: null
        }, q === null ? (A = q = U, x = Y) : q = q.next = U, c |= C;
        if (o = o.next, o === null) {
          if (o = n.shared.pending, o === null) break;
          U = o, o = U.next, U.next = null, n.lastBaseUpdate = U, n.shared.pending = null;
        }
      } while (!0);
      q === null && (x = Y), n.baseState = x, n.firstBaseUpdate = A, n.lastBaseUpdate = q, s === null && (n.shared.lanes = 0), Ra |= c, e.lanes = c, e.memoizedState = Y;
    }
  }
  function Nd(e, t) {
    if (typeof e != "function") throw Error(d(191, e));
    e.call(t);
  }
  function wd(e, t) {
    var a = e.callbacks;
    if (a !== null) for (e.callbacks = null, e = 0; e < a.length; e++) Nd(a[e], t);
  }
  var Yl = f(null), Un = f(0);
  function _d(e, t) {
    e = ja, K(Un, e), K(Yl, t), ja = e | t.baseLanes;
  }
  function Nc() {
    K(Un, ja), K(Yl, Yl.current);
  }
  function wc() {
    ja = Un.current, D(Yl), D(Un);
  }
  var Ct = f(null), Vt = null;
  function Oa(e) {
    var t = e.alternate;
    K(at, at.current & 1), K(Ct, e), Vt === null && (t === null || Yl.current !== null || t.memoizedState !== null) && (Vt = e);
  }
  function _c(e) {
    K(at, at.current), K(Ct, e), Vt === null && (Vt = e);
  }
  function kd(e) {
    e.tag === 22 ? (K(at, at.current), K(Ct, e), Vt === null && (Vt = e)) : Ma(e);
  }
  function Ma() {
    K(at, at.current), K(Ct, Ct.current);
  }
  function Ot(e) {
    D(Ct), Vt === e && (Vt = null), D(at);
  }
  var at = f(0);
  function Rn(e) {
    for (var t = e; t !== null; ) {
      if (t.tag === 13) {
        var a = t.memoizedState;
        if (a !== null && (a = a.dehydrated, a === null || Cr(a) || Or(a))) return t;
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
  var pa = 0, _e = null, Ve = null, st = null, qn = !1, Vl = !1, pl = !1, Ln = 0, Ci = 0, Xl = null, z0 = 0;
  function Fe() {
    throw Error(d(321));
  }
  function kc(e, t) {
    if (t === null) return !1;
    for (var a = 0; a < t.length && a < e.length; a++) if (!At(e[a], t[a])) return !1;
    return !0;
  }
  function Ec(e, t, a, i, n, s) {
    return pa = s, _e = t, t.memoizedState = null, t.updateQueue = null, t.lanes = 0, B.H = e === null || e.memoizedState === null ? du : Vc, pl = !1, s = a(i, n), pl = !1, Vl && (s = Ad(t, a, i, n)), Ed(e), s;
  }
  function Ed(e) {
    B.H = Di;
    var t = Ve !== null && Ve.next !== null;
    if (pa = 0, st = Ve = _e = null, qn = !1, Ci = 0, Xl = null, t) throw Error(d(300));
    e === null || ct || (e = e.dependencies, e !== null && En(e) && (ct = !0));
  }
  function Ad(e, t, a, i) {
    _e = e;
    var n = 0;
    do {
      if (Vl && (Xl = null), Ci = 0, Vl = !1, 25 <= n) throw Error(d(301));
      if (n += 1, st = Ve = null, e.updateQueue != null) {
        var s = e.updateQueue;
        s.lastEffect = null, s.events = null, s.stores = null, s.memoCache != null && (s.memoCache.index = 0);
      }
      B.H = uu, s = t(a, i);
    } while (Vl);
    return s;
  }
  function N0() {
    var e = B.H, t = e.useState()[0];
    return t = typeof t.then == "function" ? Oi(t) : t, e = e.useState()[0], (Ve !== null ? Ve.memoizedState : null) !== e && (_e.flags |= 1024), t;
  }
  function Ac() {
    var e = Ln !== 0;
    return Ln = 0, e;
  }
  function Tc(e, t, a) {
    t.updateQueue = e.updateQueue, t.flags &= -2053, e.lanes &= ~a;
  }
  function Cc(e) {
    if (qn) {
      for (e = e.memoizedState; e !== null; ) {
        var t = e.queue;
        t !== null && (t.pending = null), e = e.next;
      }
      qn = !1;
    }
    pa = 0, st = Ve = _e = null, Vl = !1, Ci = Ln = 0, Xl = null;
  }
  function vt() {
    var e = {
      memoizedState: null,
      baseState: null,
      baseQueue: null,
      queue: null,
      next: null
    };
    return st === null ? _e.memoizedState = st = e : st = st.next = e, st;
  }
  function lt() {
    if (Ve === null) {
      var e = _e.alternate;
      e = e !== null ? e.memoizedState : null;
    } else e = Ve.next;
    var t = st === null ? _e.memoizedState : st.next;
    if (t !== null) st = t, Ve = e;
    else {
      if (e === null)
        throw _e.alternate === null ? Error(d(467)) : Error(d(310));
      Ve = e, e = {
        memoizedState: Ve.memoizedState,
        baseState: Ve.baseState,
        baseQueue: Ve.baseQueue,
        queue: Ve.queue,
        next: null
      }, st === null ? _e.memoizedState = st = e : st = st.next = e;
    }
    return st;
  }
  function Hn() {
    return {
      lastEffect: null,
      events: null,
      stores: null,
      memoCache: null
    };
  }
  function Oi(e) {
    var t = Ci;
    return Ci += 1, Xl === null && (Xl = []), e = vd(Xl, e, t), t = _e, (st === null ? t.memoizedState : st.next) === null && (t = t.alternate, B.H = t === null || t.memoizedState === null ? du : Vc), e;
  }
  function Bn(e) {
    if (e !== null && typeof e == "object") {
      if (typeof e.then == "function") return Oi(e);
      if (e.$$typeof === H) return mt(e);
    }
    throw Error(d(438, String(e)));
  }
  function Oc(e) {
    var t = null, a = _e.updateQueue;
    if (a !== null && (t = a.memoCache), t == null) {
      var i = _e.alternate;
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
    }, a === null && (a = Hn(), _e.updateQueue = a), a.memoCache = t, a = t.data[t.index], a === void 0) for (a = t.data[t.index] = Array(e), i = 0; i < e; i++) a[i] = $;
    return t.index++, a;
  }
  function fa(e, t) {
    return typeof t == "function" ? t(e) : t;
  }
  function Gn(e) {
    return Mc(lt(), Ve, e);
  }
  function Mc(e, t, a) {
    var i = e.queue;
    if (i === null) throw Error(d(311));
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
      var o = c = null, x = null, A = t, q = !1;
      do {
        var Y = A.lane & -536870913;
        if (Y !== A.lane ? (Ce & Y) === Y : (pa & Y) === Y) {
          var C = A.revertLane;
          if (C === 0) x !== null && (x = x.next = {
            lane: 0,
            revertLane: 0,
            gesture: null,
            action: A.action,
            hasEagerState: A.hasEagerState,
            eagerState: A.eagerState,
            next: null
          }), Y === Ll && (q = !0);
          else if ((pa & C) === C) {
            A = A.next, C === Ll && (q = !0);
            continue;
          } else Y = {
            lane: 0,
            revertLane: A.revertLane,
            gesture: null,
            action: A.action,
            hasEagerState: A.hasEagerState,
            eagerState: A.eagerState,
            next: null
          }, x === null ? (o = x = Y, c = s) : x = x.next = Y, _e.lanes |= C, Ra |= C;
          Y = A.action, pl && a(s, Y), s = A.hasEagerState ? A.eagerState : a(s, Y);
        } else C = {
          lane: Y,
          revertLane: A.revertLane,
          gesture: A.gesture,
          action: A.action,
          hasEagerState: A.hasEagerState,
          eagerState: A.eagerState,
          next: null
        }, x === null ? (o = x = C, c = s) : x = x.next = C, _e.lanes |= Y, Ra |= Y;
        A = A.next;
      } while (A !== null && A !== t);
      if (x === null ? c = s : x.next = o, !At(s, e.memoizedState) && (ct = !0, q && (a = Hl, a !== null))) throw a;
      e.memoizedState = s, e.baseState = c, e.baseQueue = x, i.lastRenderedState = s;
    }
    return n === null && (i.lanes = 0), [e.memoizedState, i.dispatch];
  }
  function Dc(e) {
    var t = lt(), a = t.queue;
    if (a === null) throw Error(d(311));
    a.lastRenderedReducer = e;
    var i = a.dispatch, n = a.pending, s = t.memoizedState;
    if (n !== null) {
      a.pending = null;
      var c = n = n.next;
      do
        s = e(s, c.action), c = c.next;
      while (c !== n);
      At(s, t.memoizedState) || (ct = !0), t.memoizedState = s, t.baseQueue === null && (t.baseState = s), a.lastRenderedState = s;
    }
    return [s, i];
  }
  function Td(e, t, a) {
    var i = _e, n = lt(), s = Me;
    if (s) {
      if (a === void 0) throw Error(d(407));
      a = a();
    } else a = t();
    var c = !At((Ve || n).memoizedState, a);
    if (c && (n.memoizedState = a, ct = !0), n = n.queue, qc(Md.bind(null, i, n, e), [e]), n.getSnapshot !== t || c || st !== null && st.memoizedState.tag & 1) {
      if (i.flags |= 2048, Ql(9, { destroy: void 0 }, Od.bind(null, i, n, a, t), null), Ke === null) throw Error(d(349));
      s || (pa & 127) !== 0 || Cd(i, t, a);
    }
    return a;
  }
  function Cd(e, t, a) {
    e.flags |= 16384, e = {
      getSnapshot: t,
      value: a
    }, t = _e.updateQueue, t === null ? (t = Hn(), _e.updateQueue = t, t.stores = [e]) : (a = t.stores, a === null ? t.stores = [e] : a.push(e));
  }
  function Od(e, t, a, i) {
    t.value = a, t.getSnapshot = i, Dd(t) && Ud(e);
  }
  function Md(e, t, a) {
    return a(function() {
      Dd(t) && Ud(e);
    });
  }
  function Dd(e) {
    var t = e.getSnapshot;
    e = e.value;
    try {
      var a = t();
      return !At(e, a);
    } catch {
      return !0;
    }
  }
  function Ud(e) {
    var t = tl(e, 2);
    t !== null && Et(t, e, 2);
  }
  function Uc(e) {
    var t = vt();
    if (typeof e == "function") {
      var a = e;
      if (e = a(), pl) {
        bt(!0);
        try {
          a();
        } finally {
          bt(!1);
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
  function Rd(e, t, a, i) {
    return e.baseState = a, Mc(e, Ve, typeof i == "function" ? i : fa);
  }
  function w0(e, t, a, i, n) {
    if (Xn(e)) throw Error(d(485));
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
      B.T !== null ? a(!0) : s.isTransition = !1, i(s), a = t.pending, a === null ? (s.next = t.pending = s, qd(t, s)) : (s.next = a.next, t.pending = a.next = s);
    }
  }
  function qd(e, t) {
    var a = t.action, i = t.payload, n = e.state;
    if (t.isTransition) {
      var s = B.T, c = {};
      B.T = c;
      try {
        var o = a(n, i), x = B.S;
        x !== null && x(c, o), Ld(e, t, o);
      } catch (A) {
        Rc(e, t, A);
      } finally {
        s !== null && c.types !== null && (s.types = c.types), B.T = s;
      }
    } else try {
      s = a(n, i), Ld(e, t, s);
    } catch (A) {
      Rc(e, t, A);
    }
  }
  function Ld(e, t, a) {
    a !== null && typeof a == "object" && typeof a.then == "function" ? a.then(function(i) {
      Hd(e, t, i);
    }, function(i) {
      return Rc(e, t, i);
    }) : Hd(e, t, a);
  }
  function Hd(e, t, a) {
    t.status = "fulfilled", t.value = a, Bd(t), e.state = a, t = e.pending, t !== null && (a = t.next, a === t ? e.pending = null : (a = a.next, t.next = a, qd(e, a)));
  }
  function Rc(e, t, a) {
    var i = e.pending;
    if (e.pending = null, i !== null) {
      i = i.next;
      do
        t.status = "rejected", t.reason = a, Bd(t), t = t.next;
      while (t !== i);
    }
    e.action = null;
  }
  function Bd(e) {
    e = e.listeners;
    for (var t = 0; t < e.length; t++) (0, e[t])();
  }
  function Gd(e, t) {
    return t;
  }
  function Yd(e, t) {
    if (Me) {
      var a = Ke.formState;
      if (a !== null) {
        e: {
          var i = _e;
          if (Me) {
            if (Je) {
              t: {
                for (var n = Je, s = Yt; n.nodeType !== 8; ) {
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
                Je = Qt(n.nextSibling), i = n.data === "F!";
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
    return a = vt(), a.memoizedState = a.baseState = t, i = {
      pending: null,
      lanes: 0,
      dispatch: null,
      lastRenderedReducer: Gd,
      lastRenderedState: t
    }, a.queue = i, a = cu.bind(null, _e, i), i.dispatch = a, i = Uc(!1), s = Yc.bind(null, _e, !1, i.queue), i = vt(), n = {
      state: t,
      dispatch: null,
      action: e,
      pending: null
    }, i.queue = n, a = w0.bind(null, _e, n, s, a), n.dispatch = a, i.memoizedState = e, [
      t,
      a,
      !1
    ];
  }
  function Vd(e) {
    return Xd(lt(), Ve, e);
  }
  function Xd(e, t, a) {
    if (t = Mc(e, t, Gd)[0], e = Gn(fa)[0], typeof t == "object" && t !== null && typeof t.then == "function") try {
      var i = Oi(t);
    } catch (c) {
      throw c === Bl ? Cn : c;
    }
    else i = t;
    t = lt();
    var n = t.queue, s = n.dispatch;
    return a !== t.memoizedState && (_e.flags |= 2048, Ql(9, { destroy: void 0 }, _0.bind(null, n, a), null)), [
      i,
      s,
      e
    ];
  }
  function _0(e, t) {
    e.action = t;
  }
  function Qd(e) {
    var t = lt(), a = Ve;
    if (a !== null) return Xd(t, a, e);
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
    }, t = _e.updateQueue, t === null && (t = Hn(), _e.updateQueue = t), a = t.lastEffect, a === null ? t.lastEffect = e.next = e : (i = a.next, a.next = e, e.next = i, t.lastEffect = e), e;
  }
  function Zd() {
    return lt().memoizedState;
  }
  function Yn(e, t, a, i) {
    var n = vt();
    _e.flags |= e, n.memoizedState = Ql(1 | t, { destroy: void 0 }, a, i === void 0 ? null : i);
  }
  function Vn(e, t, a, i) {
    var n = lt();
    i = i === void 0 ? null : i;
    var s = n.memoizedState.inst;
    Ve !== null && i !== null && kc(i, Ve.memoizedState.deps) ? n.memoizedState = Ql(t, s, a, i) : (_e.flags |= e, n.memoizedState = Ql(1 | t, s, a, i));
  }
  function Kd(e, t) {
    Yn(8390656, 8, e, t);
  }
  function qc(e, t) {
    Vn(2048, 8, e, t);
  }
  function k0(e) {
    _e.flags |= 4;
    var t = _e.updateQueue;
    if (t === null) t = Hn(), _e.updateQueue = t, t.events = [e];
    else {
      var a = t.events;
      a === null ? t.events = [e] : a.push(e);
    }
  }
  function Jd(e) {
    var t = lt().memoizedState;
    return k0({
      ref: t,
      nextImpl: e
    }), function() {
      if ((He & 2) !== 0) throw Error(d(440));
      return t.impl.apply(void 0, arguments);
    };
  }
  function Id(e, t) {
    return Vn(4, 2, e, t);
  }
  function $d(e, t) {
    return Vn(4, 4, e, t);
  }
  function Wd(e, t) {
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
  function Fd(e, t, a) {
    a = a != null ? a.concat([e]) : null, Vn(4, 4, Wd.bind(null, t, e), a);
  }
  function Lc() {
  }
  function Pd(e, t) {
    var a = lt();
    t = t === void 0 ? null : t;
    var i = a.memoizedState;
    return t !== null && kc(t, i[1]) ? i[0] : (a.memoizedState = [e, t], e);
  }
  function eu(e, t) {
    var a = lt();
    t = t === void 0 ? null : t;
    var i = a.memoizedState;
    if (t !== null && kc(t, i[1])) return i[0];
    if (i = e(), pl) {
      bt(!0);
      try {
        e();
      } finally {
        bt(!1);
      }
    }
    return a.memoizedState = [i, t], i;
  }
  function Hc(e, t, a) {
    return a === void 0 || (pa & 1073741824) !== 0 && (Ce & 261930) === 0 ? e.memoizedState = t : (e.memoizedState = a, e = Fu(), _e.lanes |= e, Ra |= e, a);
  }
  function tu(e, t, a, i) {
    return At(a, t) ? a : Yl.current !== null ? (e = Hc(e, a, i), At(e, t) || (ct = !0), e) : (pa & 42) === 0 || (pa & 1073741824) !== 0 && (Ce & 261930) === 0 ? (ct = !0, e.memoizedState = a) : (e = Fu(), _e.lanes |= e, Ra |= e, t);
  }
  function au(e, t, a, i, n) {
    var s = G.p;
    G.p = s !== 0 && 8 > s ? s : 8;
    var c = B.T, o = {};
    B.T = o, Yc(e, !1, t, a);
    try {
      var x = n(), A = B.S;
      A !== null && A(o, x), x !== null && typeof x == "object" && typeof x.then == "function" ? Mi(e, t, S0(x, i), Xt(e)) : Mi(e, t, i, Xt(e));
    } catch (q) {
      Mi(e, t, {
        then: function() {
        },
        status: "rejected",
        reason: q
      }, Xt());
    } finally {
      G.p = s, c !== null && o.types !== null && (c.types = o.types), B.T = c;
    }
  }
  function E0() {
  }
  function Bc(e, t, a, i) {
    if (e.tag !== 5) throw Error(d(476));
    var n = lu(e).queue;
    au(e, n, t, fe, a === null ? E0 : function() {
      return iu(e), a(i);
    });
  }
  function lu(e) {
    var t = e.memoizedState;
    if (t !== null) return t;
    t = {
      memoizedState: fe,
      baseState: fe,
      baseQueue: null,
      queue: {
        pending: null,
        lanes: 0,
        dispatch: null,
        lastRenderedReducer: fa,
        lastRenderedState: fe
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
  function iu(e) {
    var t = lu(e);
    t.next === null && (t = e.alternate.memoizedState), Mi(e, t.next.queue, {}, Xt());
  }
  function Gc() {
    return mt($i);
  }
  function nu() {
    return lt().memoizedState;
  }
  function su() {
    return lt().memoizedState;
  }
  function A0(e) {
    for (var t = e.return; t !== null; ) {
      switch (t.tag) {
        case 24:
        case 3:
          var a = Xt();
          e = dl(a);
          var i = ul(t, e, a);
          i !== null && (Et(i, t, a), Ei(i, t, a)), t = { cache: xc() }, e.payload = t;
          return;
      }
      t = t.return;
    }
  }
  function T0(e, t, a) {
    var i = Xt();
    a = {
      lane: i,
      revertLane: 0,
      gesture: null,
      action: a,
      hasEagerState: !1,
      eagerState: null,
      next: null
    }, Xn(e) ? ru(t, a) : (a = nc(e, t, a, i), a !== null && (Et(a, e, i), ou(a, t, i)));
  }
  function cu(e, t, a) {
    Mi(e, t, a, Xt());
  }
  function Mi(e, t, a, i) {
    var n = {
      lane: i,
      revertLane: 0,
      gesture: null,
      action: a,
      hasEagerState: !1,
      eagerState: null,
      next: null
    };
    if (Xn(e)) ru(t, n);
    else {
      var s = e.alternate;
      if (e.lanes === 0 && (s === null || s.lanes === 0) && (s = t.lastRenderedReducer, s !== null)) try {
        var c = t.lastRenderedState, o = s(c, a);
        if (n.hasEagerState = !0, n.eagerState = o, At(o, c)) return Nn(e, t, n, 0), Ke === null && zn(), !1;
      } catch {
      }
      if (a = nc(e, t, n, i), a !== null) return Et(a, e, i), ou(a, t, i), !0;
    }
    return !1;
  }
  function Yc(e, t, a, i) {
    if (i = {
      lane: 2,
      revertLane: jr(),
      gesture: null,
      action: i,
      hasEagerState: !1,
      eagerState: null,
      next: null
    }, Xn(e)) {
      if (t) throw Error(d(479));
    } else t = nc(e, a, i, 2), t !== null && Et(t, e, 2);
  }
  function Xn(e) {
    var t = e.alternate;
    return e === _e || t !== null && t === _e;
  }
  function ru(e, t) {
    Vl = qn = !0;
    var a = e.pending;
    a === null ? t.next = t : (t.next = a.next, a.next = t), e.pending = t;
  }
  function ou(e, t, a) {
    if ((a & 4194048) !== 0) {
      var i = t.lanes;
      i &= e.pendingLanes, a |= i, t.lanes = a, fo(e, a);
    }
  }
  var Di = {
    readContext: mt,
    use: Bn,
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
  Di.useEffectEvent = Fe;
  var du = {
    readContext: mt,
    use: Bn,
    useCallback: function(e, t) {
      return vt().memoizedState = [e, t === void 0 ? null : t], e;
    },
    useContext: mt,
    useEffect: Kd,
    useImperativeHandle: function(e, t, a) {
      a = a != null ? a.concat([e]) : null, Yn(4194308, 4, Wd.bind(null, t, e), a);
    },
    useLayoutEffect: function(e, t) {
      return Yn(4194308, 4, e, t);
    },
    useInsertionEffect: function(e, t) {
      Yn(4, 2, e, t);
    },
    useMemo: function(e, t) {
      var a = vt();
      t = t === void 0 ? null : t;
      var i = e();
      if (pl) {
        bt(!0);
        try {
          e();
        } finally {
          bt(!1);
        }
      }
      return a.memoizedState = [i, t], i;
    },
    useReducer: function(e, t, a) {
      var i = vt();
      if (a !== void 0) {
        var n = a(t);
        if (pl) {
          bt(!0);
          try {
            a(t);
          } finally {
            bt(!1);
          }
        }
      } else n = t;
      return i.memoizedState = i.baseState = n, e = {
        pending: null,
        lanes: 0,
        dispatch: null,
        lastRenderedReducer: e,
        lastRenderedState: n
      }, i.queue = e, e = e.dispatch = T0.bind(null, _e, e), [i.memoizedState, e];
    },
    useRef: function(e) {
      var t = vt();
      return e = { current: e }, t.memoizedState = e;
    },
    useState: function(e) {
      e = Uc(e);
      var t = e.queue, a = cu.bind(null, _e, t);
      return t.dispatch = a, [e.memoizedState, a];
    },
    useDebugValue: Lc,
    useDeferredValue: function(e, t) {
      return Hc(vt(), e, t);
    },
    useTransition: function() {
      var e = Uc(!1);
      return e = au.bind(null, _e, e.queue, !0, !1), vt().memoizedState = e, [!1, e];
    },
    useSyncExternalStore: function(e, t, a) {
      var i = _e, n = vt();
      if (Me) {
        if (a === void 0) throw Error(d(407));
        a = a();
      } else {
        if (a = t(), Ke === null) throw Error(d(349));
        (Ce & 127) !== 0 || Cd(i, t, a);
      }
      n.memoizedState = a;
      var s = {
        value: a,
        getSnapshot: t
      };
      return n.queue = s, Kd(Md.bind(null, i, s, e), [e]), i.flags |= 2048, Ql(9, { destroy: void 0 }, Od.bind(null, i, s, a, t), null), a;
    },
    useId: function() {
      var e = vt(), t = Ke.identifierPrefix;
      if (Me) {
        var a = aa, i = ta;
        a = (i & ~(1 << 32 - ot(i) - 1)).toString(32) + a, t = "_" + t + "R_" + a, a = Ln++, 0 < a && (t += "H" + a.toString(32)), t += "_";
      } else a = z0++, t = "_" + t + "r_" + a.toString(32) + "_";
      return e.memoizedState = t;
    },
    useHostTransitionStatus: Gc,
    useFormState: Yd,
    useActionState: Yd,
    useOptimistic: function(e) {
      var t = vt();
      t.memoizedState = t.baseState = e;
      var a = {
        pending: null,
        lanes: 0,
        dispatch: null,
        lastRenderedReducer: null,
        lastRenderedState: null
      };
      return t.queue = a, t = Yc.bind(null, _e, !0, a), a.dispatch = t, [e, t];
    },
    useMemoCache: Oc,
    useCacheRefresh: function() {
      return vt().memoizedState = A0.bind(null, _e);
    },
    useEffectEvent: function(e) {
      var t = vt(), a = { impl: e };
      return t.memoizedState = a, function() {
        if ((He & 2) !== 0) throw Error(d(440));
        return a.impl.apply(void 0, arguments);
      };
    }
  }, Vc = {
    readContext: mt,
    use: Bn,
    useCallback: Pd,
    useContext: mt,
    useEffect: qc,
    useImperativeHandle: Fd,
    useInsertionEffect: Id,
    useLayoutEffect: $d,
    useMemo: eu,
    useReducer: Gn,
    useRef: Zd,
    useState: function() {
      return Gn(fa);
    },
    useDebugValue: Lc,
    useDeferredValue: function(e, t) {
      return tu(lt(), Ve.memoizedState, e, t);
    },
    useTransition: function() {
      var e = Gn(fa)[0], t = lt().memoizedState;
      return [typeof e == "boolean" ? e : Oi(e), t];
    },
    useSyncExternalStore: Td,
    useId: nu,
    useHostTransitionStatus: Gc,
    useFormState: Vd,
    useActionState: Vd,
    useOptimistic: function(e, t) {
      return Rd(lt(), Ve, e, t);
    },
    useMemoCache: Oc,
    useCacheRefresh: su
  };
  Vc.useEffectEvent = Jd;
  var uu = {
    readContext: mt,
    use: Bn,
    useCallback: Pd,
    useContext: mt,
    useEffect: qc,
    useImperativeHandle: Fd,
    useInsertionEffect: Id,
    useLayoutEffect: $d,
    useMemo: eu,
    useReducer: Dc,
    useRef: Zd,
    useState: function() {
      return Dc(fa);
    },
    useDebugValue: Lc,
    useDeferredValue: function(e, t) {
      var a = lt();
      return Ve === null ? Hc(a, e, t) : tu(a, Ve.memoizedState, e, t);
    },
    useTransition: function() {
      var e = Dc(fa)[0], t = lt().memoizedState;
      return [typeof e == "boolean" ? e : Oi(e), t];
    },
    useSyncExternalStore: Td,
    useId: nu,
    useHostTransitionStatus: Gc,
    useFormState: Qd,
    useActionState: Qd,
    useOptimistic: function(e, t) {
      var a = lt();
      return Ve !== null ? Rd(a, Ve, e, t) : (a.baseState = e, [e, a.queue.dispatch]);
    },
    useMemoCache: Oc,
    useCacheRefresh: su
  };
  uu.useEffectEvent = Jd;
  function Xc(e, t, a, i) {
    t = e.memoizedState, a = a(i, t), a = a == null ? t : R({}, t, a), e.memoizedState = a, e.lanes === 0 && (e.updateQueue.baseState = a);
  }
  var Qc = {
    enqueueSetState: function(e, t, a) {
      e = e._reactInternals;
      var i = Xt(), n = dl(i);
      n.payload = t, a != null && (n.callback = a), t = ul(e, n, i), t !== null && (Et(t, e, i), Ei(t, e, i));
    },
    enqueueReplaceState: function(e, t, a) {
      e = e._reactInternals;
      var i = Xt(), n = dl(i);
      n.tag = 1, n.payload = t, a != null && (n.callback = a), t = ul(e, n, i), t !== null && (Et(t, e, i), Ei(t, e, i));
    },
    enqueueForceUpdate: function(e, t) {
      e = e._reactInternals;
      var a = Xt(), i = dl(a);
      i.tag = 2, t != null && (i.callback = t), t = ul(e, i, a), t !== null && (Et(t, e, a), Ei(t, e, a));
    }
  };
  function pu(e, t, a, i, n, s, c) {
    return e = e.stateNode, typeof e.shouldComponentUpdate == "function" ? e.shouldComponentUpdate(i, s, c) : t.prototype && t.prototype.isPureReactComponent ? !ji(a, i) || !ji(n, s) : !0;
  }
  function fu(e, t, a, i) {
    e = t.state, typeof t.componentWillReceiveProps == "function" && t.componentWillReceiveProps(a, i), typeof t.UNSAFE_componentWillReceiveProps == "function" && t.UNSAFE_componentWillReceiveProps(a, i), t.state !== e && Qc.enqueueReplaceState(t, t.state, null);
  }
  function fl(e, t) {
    var a = t;
    if ("ref" in t) {
      a = {};
      for (var i in t) i !== "ref" && (a[i] = t[i]);
    }
    if (e = e.defaultProps) {
      a === t && (a = R({}, a));
      for (var n in e) a[n] === void 0 && (a[n] = e[n]);
    }
    return a;
  }
  function C0(e) {
    Sn(e);
  }
  function O0(e) {
    console.error(e);
  }
  function M0(e) {
    Sn(e);
  }
  function Qn(e, t) {
    try {
      var a = e.onUncaughtError;
      a(t.value, { componentStack: t.stack });
    } catch (i) {
      setTimeout(function() {
        throw i;
      });
    }
  }
  function hu(e, t, a) {
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
  function Zc(e, t, a) {
    return a = dl(a), a.tag = 3, a.payload = { element: null }, a.callback = function() {
      Qn(e, t);
    }, a;
  }
  function mu(e) {
    return e = dl(e), e.tag = 3, e;
  }
  function xu(e, t, a, i) {
    var n = a.type.getDerivedStateFromError;
    if (typeof n == "function") {
      var s = i.value;
      e.payload = function() {
        return n(s);
      }, e.callback = function() {
        hu(t, a, i);
      };
    }
    var c = a.stateNode;
    c !== null && typeof c.componentDidCatch == "function" && (e.callback = function() {
      hu(t, a, i), typeof n != "function" && (qa === null ? qa = /* @__PURE__ */ new Set([this]) : qa.add(this));
      var o = i.stack;
      this.componentDidCatch(i.value, { componentStack: o !== null ? o : "" });
    });
  }
  function D0(e, t, a, i, n) {
    if (a.flags |= 32768, i !== null && typeof i == "object" && typeof i.then == "function") {
      if (t = a.alternate, t !== null && ql(t, a, n, !0), a = Ct.current, a !== null) {
        switch (a.tag) {
          case 31:
          case 13:
            return Vt === null ? ls() : a.alternate === null && Pe === 0 && (Pe = 3), a.flags &= -257, a.flags |= 65536, a.lanes = n, i === On ? a.flags |= 16384 : (t = a.updateQueue, t === null ? a.updateQueue = /* @__PURE__ */ new Set([i]) : t.add(i), gr(e, i, n)), !1;
          case 22:
            return a.flags |= 65536, i === On ? a.flags |= 16384 : (t = a.updateQueue, t === null ? (t = {
              transitions: null,
              markerInstances: null,
              retryQueue: /* @__PURE__ */ new Set([i])
            }, a.updateQueue = t) : (a = t.retryQueue, a === null ? t.retryQueue = /* @__PURE__ */ new Set([i]) : a.add(i)), gr(e, i, n)), !1;
        }
        throw Error(d(435, a.tag));
      }
      return gr(e, i, n), ls(), !1;
    }
    if (Me) return t = Ct.current, t !== null ? ((t.flags & 65536) === 0 && (t.flags |= 256), t.flags |= 65536, t.lanes = n, i !== uc && (e = Error(d(422), { cause: i }), zi(Ht(e, a)))) : (i !== uc && (t = Error(d(423), { cause: i }), zi(Ht(t, a))), e = e.current.alternate, e.flags |= 65536, n &= -n, e.lanes |= n, i = Ht(i, a), n = Zc(e.stateNode, i, n), Sc(e, n), Pe !== 4 && (Pe = 2)), !1;
    var s = Error(d(520), { cause: i });
    if (s = Ht(s, a), Yi === null ? Yi = [s] : Yi.push(s), Pe !== 4 && (Pe = 2), t === null) return !0;
    i = Ht(i, a), a = t;
    do {
      switch (a.tag) {
        case 3:
          return a.flags |= 65536, e = n & -n, a.lanes |= e, e = Zc(a.stateNode, i, e), Sc(a, e), !1;
        case 1:
          if (t = a.type, s = a.stateNode, (a.flags & 128) === 0 && (typeof t.getDerivedStateFromError == "function" || s !== null && typeof s.componentDidCatch == "function" && (qa === null || !qa.has(s)))) return a.flags |= 65536, n &= -n, a.lanes |= n, n = mu(n), xu(n, e, a, i), Sc(a, n), !1;
      }
      a = a.return;
    } while (a !== null);
    return !1;
  }
  var Kc = Error(d(461)), ct = !1;
  function xt(e, t, a, i) {
    t.child = e === null ? zd(t, null, a, i) : ol(t, e.child, a, i);
  }
  function gu(e, t, a, i, n) {
    a = a.render;
    var s = t.ref;
    if ("ref" in i) {
      var c = {};
      for (var o in i) o !== "ref" && (c[o] = i[o]);
    } else c = i;
    return nl(t), i = Ec(e, t, a, c, s, n), o = Ac(), e !== null && !ct ? (Tc(e, t, n), ha(e, t, n)) : (Me && o && oc(t), t.flags |= 1, xt(e, t, i, n), t.child);
  }
  function bu(e, t, a, i, n) {
    if (e === null) {
      var s = a.type;
      return typeof s == "function" && !sc(s) && s.defaultProps === void 0 && a.compare === null ? (t.tag = 15, t.type = s, vu(e, t, s, i, n)) : (e = _n(a.type, null, i, t, t.mode, n), e.ref = t.ref, e.return = t, t.child = e);
    }
    if (s = e.child, !tr(e, n)) {
      var c = s.memoizedProps;
      if (a = a.compare, a = a !== null ? a : ji, a(c, i) && e.ref === t.ref) return ha(e, t, n);
    }
    return t.flags |= 1, e = ra(s, i), e.ref = t.ref, e.return = t, t.child = e;
  }
  function vu(e, t, a, i, n) {
    if (e !== null) {
      var s = e.memoizedProps;
      if (ji(s, i) && e.ref === t.ref) if (ct = !1, t.pendingProps = i = s, tr(e, n)) (e.flags & 131072) !== 0 && (ct = !0);
      else return t.lanes = e.lanes, ha(e, t, n);
    }
    return Jc(e, t, a, i, n);
  }
  function ju(e, t, a, i) {
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
        return yu(e, t, s, a, i);
      }
      if ((a & 536870912) !== 0) t.memoizedState = {
        baseLanes: 0,
        cachePool: null
      }, e !== null && Tn(t, s !== null ? s.cachePool : null), s !== null ? _d(t, s) : Nc(), kd(t);
      else return i = t.lanes = 536870912, yu(e, t, s !== null ? s.baseLanes | a : a, a, i);
    } else s !== null ? (Tn(t, s.cachePool), _d(t, s), Ma(t), t.memoizedState = null) : (e !== null && Tn(t, null), Nc(), Ma(t));
    return xt(e, t, n, a), t.child;
  }
  function Ui(e, t) {
    return e !== null && e.tag === 22 || t.stateNode !== null || (t.stateNode = {
      _visibility: 1,
      _pendingMarkers: null,
      _retryCache: null,
      _transitions: null
    }), t.sibling;
  }
  function yu(e, t, a, i, n) {
    var s = bc();
    return s = s === null ? null : {
      parent: nt._currentValue,
      pool: s
    }, t.memoizedState = {
      baseLanes: a,
      cachePool: s
    }, e !== null && Tn(t, null), Nc(), kd(t), e !== null && ql(e, t, i, !0), t.childLanes = n, null;
  }
  function Zn(e, t) {
    return t = Jn({
      mode: t.mode,
      children: t.children
    }, e.mode), t.ref = e.ref, e.child = t, t.return = e, t;
  }
  function Su(e, t, a) {
    return ol(t, e.child, null, a), e = Zn(t, t.pendingProps), e.flags |= 2, Ot(t), t.memoizedState = null, e;
  }
  function U0(e, t, a) {
    var i = t.pendingProps, n = (t.flags & 128) !== 0;
    if (t.flags &= -129, e === null) {
      if (Me) {
        if (i.mode === "hidden") return e = Zn(t, i), t.lanes = 536870912, Ui(null, e);
        if (_c(t), (e = Je) ? (e = Up(e, Yt), e = e !== null && e.data === "&" ? e : null, e !== null && (t.memoizedState = {
          dehydrated: e,
          treeContext: ka !== null ? {
            id: ta,
            overflow: aa
          } : null,
          retryLane: 536870912,
          hydrationErrors: null
        }, a = rd(e), a.return = t, t.child = a, ht = t, Je = null)) : e = null, e === null) throw Aa(t);
        return t.lanes = 536870912, null;
      }
      return Zn(t, i);
    }
    var s = e.memoizedState;
    if (s !== null) {
      var c = s.dehydrated;
      if (_c(t), n) if (t.flags & 256) t.flags &= -257, t = Su(e, t, a);
      else if (t.memoizedState !== null) t.child = e.child, t.flags |= 128, t = null;
      else throw Error(d(558));
      else if (ct || ql(e, t, a, !1), n = (a & e.childLanes) !== 0, ct || n) {
        if (i = Ke, i !== null && (c = ho(i, a), c !== 0 && c !== s.retryLane)) throw s.retryLane = c, tl(e, c), Et(i, e, c), Kc;
        ls(), t = Su(e, t, a);
      } else e = s.treeContext, Je = Qt(c.nextSibling), ht = t, Me = !0, Ea = null, Yt = !1, e !== null && ud(t, e), t = Zn(t, i), t.flags |= 4096;
      return t;
    }
    return e = ra(e.child, {
      mode: i.mode,
      children: i.children
    }), e.ref = t.ref, t.child = e, e.return = t, e;
  }
  function Kn(e, t) {
    var a = t.ref;
    if (a === null) e !== null && e.ref !== null && (t.flags |= 4194816);
    else {
      if (typeof a != "function" && typeof a != "object") throw Error(d(284));
      (e === null || e.ref !== a) && (t.flags |= 4194816);
    }
  }
  function Jc(e, t, a, i, n) {
    return nl(t), a = Ec(e, t, a, i, void 0, n), i = Ac(), e !== null && !ct ? (Tc(e, t, n), ha(e, t, n)) : (Me && i && oc(t), t.flags |= 1, xt(e, t, a, n), t.child);
  }
  function zu(e, t, a, i, n, s) {
    return nl(t), t.updateQueue = null, a = Ad(t, i, a, n), Ed(e), i = Ac(), e !== null && !ct ? (Tc(e, t, s), ha(e, t, s)) : (Me && i && oc(t), t.flags |= 1, xt(e, t, a, s), t.child);
  }
  function Nu(e, t, a, i, n) {
    if (nl(t), t.stateNode === null) {
      var s = Ml, c = a.contextType;
      typeof c == "object" && c !== null && (s = mt(c)), s = new a(i, s), t.memoizedState = s.state !== null && s.state !== void 0 ? s.state : null, s.updater = Qc, t.stateNode = s, s._reactInternals = t, s = t.stateNode, s.props = i, s.state = t.memoizedState, s.refs = {}, jc(t), c = a.contextType, s.context = typeof c == "object" && c !== null ? mt(c) : Ml, s.state = t.memoizedState, c = a.getDerivedStateFromProps, typeof c == "function" && (Xc(t, a, c, i), s.state = t.memoizedState), typeof a.getDerivedStateFromProps == "function" || typeof s.getSnapshotBeforeUpdate == "function" || typeof s.UNSAFE_componentWillMount != "function" && typeof s.componentWillMount != "function" || (c = s.state, typeof s.componentWillMount == "function" && s.componentWillMount(), typeof s.UNSAFE_componentWillMount == "function" && s.UNSAFE_componentWillMount(), c !== s.state && Qc.enqueueReplaceState(s, s.state, null), Ti(t, i, s, n), Ai(), s.state = t.memoizedState), typeof s.componentDidMount == "function" && (t.flags |= 4194308), i = !0;
    } else if (e === null) {
      s = t.stateNode;
      var o = t.memoizedProps, x = fl(a, o);
      s.props = x;
      var A = s.context, q = a.contextType;
      c = Ml, typeof q == "object" && q !== null && (c = mt(q));
      var Y = a.getDerivedStateFromProps;
      q = typeof Y == "function" || typeof s.getSnapshotBeforeUpdate == "function", o = t.pendingProps !== o, q || typeof s.UNSAFE_componentWillReceiveProps != "function" && typeof s.componentWillReceiveProps != "function" || (o || A !== c) && fu(t, s, i, c), Ca = !1;
      var C = t.memoizedState;
      s.state = C, Ti(t, i, s, n), Ai(), A = t.memoizedState, o || C !== A || Ca ? (typeof Y == "function" && (Xc(t, a, Y, i), A = t.memoizedState), (x = Ca || pu(t, a, x, i, C, A, c)) ? (q || typeof s.UNSAFE_componentWillMount != "function" && typeof s.componentWillMount != "function" || (typeof s.componentWillMount == "function" && s.componentWillMount(), typeof s.UNSAFE_componentWillMount == "function" && s.UNSAFE_componentWillMount()), typeof s.componentDidMount == "function" && (t.flags |= 4194308)) : (typeof s.componentDidMount == "function" && (t.flags |= 4194308), t.memoizedProps = i, t.memoizedState = A), s.props = i, s.state = A, s.context = c, i = x) : (typeof s.componentDidMount == "function" && (t.flags |= 4194308), i = !1);
    } else {
      s = t.stateNode, yc(e, t), c = t.memoizedProps, q = fl(a, c), s.props = q, Y = t.pendingProps, C = s.context, A = a.contextType, x = Ml, typeof A == "object" && A !== null && (x = mt(A)), o = a.getDerivedStateFromProps, (A = typeof o == "function" || typeof s.getSnapshotBeforeUpdate == "function") || typeof s.UNSAFE_componentWillReceiveProps != "function" && typeof s.componentWillReceiveProps != "function" || (c !== Y || C !== x) && fu(t, s, i, x), Ca = !1, C = t.memoizedState, s.state = C, Ti(t, i, s, n), Ai();
      var U = t.memoizedState;
      c !== Y || C !== U || Ca || e !== null && e.dependencies !== null && En(e.dependencies) ? (typeof o == "function" && (Xc(t, a, o, i), U = t.memoizedState), (q = Ca || pu(t, a, q, i, C, U, x) || e !== null && e.dependencies !== null && En(e.dependencies)) ? (A || typeof s.UNSAFE_componentWillUpdate != "function" && typeof s.componentWillUpdate != "function" || (typeof s.componentWillUpdate == "function" && s.componentWillUpdate(i, U, x), typeof s.UNSAFE_componentWillUpdate == "function" && s.UNSAFE_componentWillUpdate(i, U, x)), typeof s.componentDidUpdate == "function" && (t.flags |= 4), typeof s.getSnapshotBeforeUpdate == "function" && (t.flags |= 1024)) : (typeof s.componentDidUpdate != "function" || c === e.memoizedProps && C === e.memoizedState || (t.flags |= 4), typeof s.getSnapshotBeforeUpdate != "function" || c === e.memoizedProps && C === e.memoizedState || (t.flags |= 1024), t.memoizedProps = i, t.memoizedState = U), s.props = i, s.state = U, s.context = x, i = q) : (typeof s.componentDidUpdate != "function" || c === e.memoizedProps && C === e.memoizedState || (t.flags |= 4), typeof s.getSnapshotBeforeUpdate != "function" || c === e.memoizedProps && C === e.memoizedState || (t.flags |= 1024), i = !1);
    }
    return s = i, Kn(e, t), i = (t.flags & 128) !== 0, s || i ? (s = t.stateNode, a = i && typeof a.getDerivedStateFromError != "function" ? null : s.render(), t.flags |= 1, e !== null && i ? (t.child = ol(t, e.child, null, n), t.child = ol(t, null, a, n)) : xt(e, t, a, n), t.memoizedState = s.state, e = t.child) : e = ha(e, t, n), e;
  }
  function wu(e, t, a, i) {
    return ll(), t.flags |= 256, xt(e, t, a, i), t.child;
  }
  var Ic = {
    dehydrated: null,
    treeContext: null,
    retryLane: 0,
    hydrationErrors: null
  };
  function $c(e) {
    return {
      baseLanes: e,
      cachePool: gd()
    };
  }
  function Wc(e, t, a) {
    return e = e !== null ? e.childLanes & ~a : 0, t && (e |= Dt), e;
  }
  function _u(e, t, a) {
    var i = t.pendingProps, n = !1, s = (t.flags & 128) !== 0, c;
    if ((c = s) || (c = e !== null && e.memoizedState === null ? !1 : (at.current & 2) !== 0), c && (n = !0, t.flags &= -129), c = (t.flags & 32) !== 0, t.flags &= -33, e === null) {
      if (Me) {
        if (n ? Oa(t) : Ma(t), (e = Je) ? (e = Up(e, Yt), e = e !== null && e.data !== "&" ? e : null, e !== null && (t.memoizedState = {
          dehydrated: e,
          treeContext: ka !== null ? {
            id: ta,
            overflow: aa
          } : null,
          retryLane: 536870912,
          hydrationErrors: null
        }, a = rd(e), a.return = t, t.child = a, ht = t, Je = null)) : e = null, e === null) throw Aa(t);
        return Or(e) ? t.lanes = 32 : t.lanes = 536870912, null;
      }
      var o = i.children;
      return i = i.fallback, n ? (Ma(t), n = t.mode, o = Jn({
        mode: "hidden",
        children: o
      }, n), i = al(i, n, a, null), o.return = t, i.return = t, o.sibling = i, t.child = o, i = t.child, i.memoizedState = $c(a), i.childLanes = Wc(e, c, a), t.memoizedState = Ic, Ui(null, i)) : (Oa(t), Fc(t, o));
    }
    var x = e.memoizedState;
    if (x !== null && (o = x.dehydrated, o !== null)) {
      if (s) t.flags & 256 ? (Oa(t), t.flags &= -257, t = Pc(e, t, a)) : t.memoizedState !== null ? (Ma(t), t.child = e.child, t.flags |= 128, t = null) : (Ma(t), o = i.fallback, n = t.mode, i = Jn({
        mode: "visible",
        children: i.children
      }, n), o = al(o, n, a, null), o.flags |= 2, i.return = t, o.return = t, i.sibling = o, t.child = i, ol(t, e.child, null, a), i = t.child, i.memoizedState = $c(a), i.childLanes = Wc(e, c, a), t.memoizedState = Ic, t = Ui(null, i));
      else if (Oa(t), Or(o)) {
        if (c = o.nextSibling && o.nextSibling.dataset, c) var A = c.dgst;
        c = A, i = Error(d(419)), i.stack = "", i.digest = c, zi({
          value: i,
          source: null,
          stack: null
        }), t = Pc(e, t, a);
      } else if (ct || ql(e, t, a, !1), c = (a & e.childLanes) !== 0, ct || c) {
        if (c = Ke, c !== null && (i = ho(c, a), i !== 0 && i !== x.retryLane)) throw x.retryLane = i, tl(e, i), Et(c, e, i), Kc;
        Cr(o) || ls(), t = Pc(e, t, a);
      } else Cr(o) ? (t.flags |= 192, t.child = e.child, t = null) : (e = x.treeContext, Je = Qt(o.nextSibling), ht = t, Me = !0, Ea = null, Yt = !1, e !== null && ud(t, e), t = Fc(t, i.children), t.flags |= 4096);
      return t;
    }
    return n ? (Ma(t), o = i.fallback, n = t.mode, x = e.child, A = x.sibling, i = ra(x, {
      mode: "hidden",
      children: i.children
    }), i.subtreeFlags = x.subtreeFlags & 65011712, A !== null ? o = ra(A, o) : (o = al(o, n, a, null), o.flags |= 2), o.return = t, i.return = t, i.sibling = o, t.child = i, Ui(null, i), i = t.child, o = e.child.memoizedState, o === null ? o = $c(a) : (n = o.cachePool, n !== null ? (x = nt._currentValue, n = n.parent !== x ? {
      parent: x,
      pool: x
    } : n) : n = gd(), o = {
      baseLanes: o.baseLanes | a,
      cachePool: n
    }), i.memoizedState = o, i.childLanes = Wc(e, c, a), t.memoizedState = Ic, Ui(e.child, i)) : (Oa(t), a = e.child, e = a.sibling, a = ra(a, {
      mode: "visible",
      children: i.children
    }), a.return = t, a.sibling = null, e !== null && (c = t.deletions, c === null ? (t.deletions = [e], t.flags |= 16) : c.push(e)), t.child = a, t.memoizedState = null, a);
  }
  function Fc(e, t) {
    return t = Jn({
      mode: "visible",
      children: t
    }, e.mode), t.return = e, e.child = t;
  }
  function Jn(e, t) {
    return e = Tt(22, e, null, t), e.lanes = 0, e;
  }
  function Pc(e, t, a) {
    return ol(t, e.child, null, a), e = Fc(t, t.pendingProps.children), e.flags |= 2, t.memoizedState = null, e;
  }
  function ku(e, t, a) {
    e.lanes |= t;
    var i = e.alternate;
    i !== null && (i.lanes |= t), hc(e.return, t, a);
  }
  function er(e, t, a, i, n, s) {
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
  function Eu(e, t, a) {
    var i = t.pendingProps, n = i.revealOrder, s = i.tail;
    i = i.children;
    var c = at.current, o = (c & 2) !== 0;
    if (o ? (c = c & 1 | 2, t.flags |= 128) : c &= 1, K(at, c), xt(e, t, i, a), i = Me ? Si : 0, !o && e !== null && (e.flags & 128) !== 0) e: for (e = t.child; e !== null; ) {
      if (e.tag === 13) e.memoizedState !== null && ku(e, a, t);
      else if (e.tag === 19) ku(e, a, t);
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
        for (a = t.child, n = null; a !== null; ) e = a.alternate, e !== null && Rn(e) === null && (n = a), a = a.sibling;
        a = n, a === null ? (n = t.child, t.child = null) : (n = a.sibling, a.sibling = null), er(t, !1, n, a, s, i);
        break;
      case "backwards":
      case "unstable_legacy-backwards":
        for (a = null, n = t.child, t.child = null; n !== null; ) {
          if (e = n.alternate, e !== null && Rn(e) === null) {
            t.child = n;
            break;
          }
          e = n.sibling, n.sibling = a, a = n, n = e;
        }
        er(t, !0, a, null, s, i);
        break;
      case "together":
        er(t, !1, null, null, void 0, i);
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
    if (e !== null && t.child !== e.child) throw Error(d(153));
    if (t.child !== null) {
      for (e = t.child, a = ra(e, e.pendingProps), t.child = a, a.return = t; e.sibling !== null; ) e = e.sibling, a = a.sibling = ra(e, e.pendingProps), a.return = t;
      a.sibling = null;
    }
    return t.child;
  }
  function tr(e, t) {
    return (e.lanes & t) !== 0 ? !0 : (e = e.dependencies, !!(e !== null && En(e)));
  }
  function R0(e, t, a) {
    switch (t.tag) {
      case 3:
        Be(t, t.stateNode.containerInfo), Ta(t, nt, e.memoizedState.cache), ll();
        break;
      case 27:
      case 5:
        Ne(t);
        break;
      case 4:
        Be(t, t.stateNode.containerInfo);
        break;
      case 10:
        Ta(t, t.type, t.memoizedProps.value);
        break;
      case 31:
        if (t.memoizedState !== null) return t.flags |= 128, _c(t), null;
        break;
      case 13:
        var i = t.memoizedState;
        if (i !== null)
          return i.dehydrated !== null ? (Oa(t), t.flags |= 128, null) : (a & t.child.childLanes) !== 0 ? _u(e, t, a) : (Oa(t), e = ha(e, t, a), e !== null ? e.sibling : null);
        Oa(t);
        break;
      case 19:
        var n = (e.flags & 128) !== 0;
        if (i = (a & t.childLanes) !== 0, i || (ql(e, t, a, !1), i = (a & t.childLanes) !== 0), n) {
          if (i) return Eu(e, t, a);
          t.flags |= 128;
        }
        if (n = t.memoizedState, n !== null && (n.rendering = null, n.tail = null, n.lastEffect = null), K(at, at.current), i) break;
        return null;
      case 22:
        return t.lanes = 0, ju(e, t, a, t.pendingProps);
      case 24:
        Ta(t, nt, e.memoizedState.cache);
    }
    return ha(e, t, a);
  }
  function Au(e, t, a) {
    if (e !== null) if (e.memoizedProps !== t.pendingProps) ct = !0;
    else {
      if (!tr(e, a) && (t.flags & 128) === 0) return ct = !1, R0(e, t, a);
      ct = (e.flags & 131072) !== 0;
    }
    else ct = !1, Me && (t.flags & 1048576) !== 0 && dd(t, Si, t.index);
    switch (t.lanes = 0, t.tag) {
      case 16:
        e: {
          var i = t.pendingProps;
          if (e = cl(t.elementType), t.type = e, typeof e == "function") sc(e) ? (i = fl(e, i), t.tag = 1, t = Nu(null, t, e, i, a)) : (t.tag = 0, t = Jc(null, t, e, i, a));
          else {
            if (e != null) {
              var n = e.$$typeof;
              if (n === F) {
                t.tag = 11, t = gu(null, t, e, i, a);
                break e;
              } else if (n === ce) {
                t.tag = 14, t = bu(null, t, e, i, a);
                break e;
              }
            }
            throw t = ae(e) || e, Error(d(306, t, ""));
          }
        }
        return t;
      case 0:
        return Jc(e, t, t.type, t.pendingProps, a);
      case 1:
        return i = t.type, n = fl(i, t.pendingProps), Nu(e, t, i, n, a);
      case 3:
        e: {
          if (Be(t, t.stateNode.containerInfo), e === null) throw Error(d(387));
          i = t.pendingProps;
          var s = t.memoizedState;
          n = s.element, yc(e, t), Ti(t, i, null, a);
          var c = t.memoizedState;
          if (i = c.cache, Ta(t, nt, i), i !== s.cache && mc(t, [nt], a, !0), Ai(), i = c.element, s.isDehydrated) if (s = {
            element: i,
            isDehydrated: !1,
            cache: c.cache
          }, t.updateQueue.baseState = s, t.memoizedState = s, t.flags & 256) {
            t = wu(e, t, i, a);
            break e;
          } else if (i !== n) {
            n = Ht(Error(d(424)), t), zi(n), t = wu(e, t, i, a);
            break e;
          } else
            for (e = t.stateNode.containerInfo, e.nodeType === 9 ? e = e.body : e = e.nodeName === "HTML" ? e.ownerDocument.body : e, Je = Qt(e.firstChild), ht = t, Me = !0, Ea = null, Yt = !0, a = zd(t, null, i, a), t.child = a; a; ) a.flags = a.flags & -3 | 4096, a = a.sibling;
          else {
            if (ll(), i === n) {
              t = ha(e, t, a);
              break e;
            }
            xt(e, t, i, a);
          }
          t = t.child;
        }
        return t;
      case 26:
        return Kn(e, t), e === null ? (a = Gp(t.type, null, t.pendingProps, null)) ? t.memoizedState = a : Me || (a = t.type, e = t.pendingProps, i = ds(Se.current).createElement(a), i[ft] = t, i[St] = e, gt(i, a, e), ut(i), t.stateNode = i) : t.memoizedState = Gp(t.type, e.memoizedProps, t.pendingProps, e.memoizedState), null;
      case 27:
        return Ne(t), e === null && Me && (i = t.stateNode = Lp(t.type, t.pendingProps, Se.current), ht = t, Yt = !0, n = Je, Ga(t.type) ? (Mr = n, Je = Qt(i.firstChild)) : Je = n), xt(e, t, t.pendingProps.children, a), Kn(e, t), e === null && (t.flags |= 4194304), t.child;
      case 5:
        return e === null && Me && ((n = i = Je) && (i = dh(i, t.type, t.pendingProps, Yt), i !== null ? (t.stateNode = i, ht = t, Je = Qt(i.firstChild), Yt = !1, n = !0) : n = !1), n || Aa(t)), Ne(t), n = t.type, s = t.pendingProps, c = e !== null ? e.memoizedProps : null, i = s.children, Er(n, s) ? i = null : c !== null && Er(n, c) && (t.flags |= 32), t.memoizedState !== null && (n = Ec(e, t, N0, null, null, a), $i._currentValue = n), Kn(e, t), xt(e, t, i, a), t.child;
      case 6:
        return e === null && Me && ((e = a = Je) && (a = uh(a, t.pendingProps, Yt), a !== null ? (t.stateNode = a, ht = t, Je = null, e = !0) : e = !1), e || Aa(t)), null;
      case 13:
        return _u(e, t, a);
      case 4:
        return Be(t, t.stateNode.containerInfo), i = t.pendingProps, e === null ? t.child = ol(t, null, i, a) : xt(e, t, i, a), t.child;
      case 11:
        return gu(e, t, t.type, t.pendingProps, a);
      case 7:
        return xt(e, t, t.pendingProps, a), t.child;
      case 8:
        return xt(e, t, t.pendingProps.children, a), t.child;
      case 12:
        return xt(e, t, t.pendingProps.children, a), t.child;
      case 10:
        return i = t.pendingProps, Ta(t, t.type, i.value), xt(e, t, i.children, a), t.child;
      case 9:
        return n = t.type._context, i = t.pendingProps.children, nl(t), n = mt(n), i = i(n), t.flags |= 1, xt(e, t, i, a), t.child;
      case 14:
        return bu(e, t, t.type, t.pendingProps, a);
      case 15:
        return vu(e, t, t.type, t.pendingProps, a);
      case 19:
        return Eu(e, t, a);
      case 31:
        return U0(e, t, a);
      case 22:
        return ju(e, t, a, t.pendingProps);
      case 24:
        return nl(t), i = mt(nt), e === null ? (n = bc(), n === null && (n = Ke, s = xc(), n.pooledCache = s, s.refCount++, s !== null && (n.pooledCacheLanes |= a), n = s), t.memoizedState = {
          parent: i,
          cache: n
        }, jc(t), Ta(t, nt, n)) : ((e.lanes & a) !== 0 && (yc(e, t), Ti(t, null, null, a), Ai()), n = e.memoizedState, s = t.memoizedState, n.parent !== i ? (n = {
          parent: i,
          cache: i
        }, t.memoizedState = n, t.lanes === 0 && (t.memoizedState = t.updateQueue.baseState = n), Ta(t, nt, i)) : (i = s.cache, Ta(t, nt, i), i !== n.cache && mc(t, [nt], a, !0))), xt(e, t, t.pendingProps.children, a), t.child;
      case 29:
        throw t.pendingProps;
    }
    throw Error(d(156, t.tag));
  }
  function ma(e) {
    e.flags |= 4;
  }
  function ar(e, t, a, i, n) {
    if ((t = (e.mode & 32) !== 0) && (t = !1), t) {
      if (e.flags |= 16777216, (n & 335544128) === n) if (e.stateNode.complete) e.flags |= 8192;
      else if (ap()) e.flags |= 8192;
      else throw rl = On, vc;
    } else e.flags &= -16777217;
  }
  function Tu(e, t) {
    if (t.type !== "stylesheet" || (t.state.loading & 4) !== 0) e.flags &= -16777217;
    else if (e.flags |= 16777216, !Zp(t)) if (ap()) e.flags |= 8192;
    else throw rl = On, vc;
  }
  function In(e, t) {
    t !== null && (e.flags |= 4), e.flags & 16384 && (t = e.tag !== 22 ? uo() : 536870912, e.lanes |= t, Il |= t);
  }
  function Ri(e, t) {
    if (!Me) switch (e.tailMode) {
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
  function Ie(e) {
    var t = e.alternate !== null && e.alternate.child === e.child, a = 0, i = 0;
    if (t) for (var n = e.child; n !== null; ) a |= n.lanes | n.childLanes, i |= n.subtreeFlags & 65011712, i |= n.flags & 65011712, n.return = e, n = n.sibling;
    else for (n = e.child; n !== null; ) a |= n.lanes | n.childLanes, i |= n.subtreeFlags, i |= n.flags, n.return = e, n = n.sibling;
    return e.subtreeFlags |= i, e.childLanes = a, t;
  }
  function q0(e, t, a) {
    var i = t.pendingProps;
    switch (dc(t), t.tag) {
      case 16:
      case 15:
      case 0:
      case 11:
      case 7:
      case 8:
      case 12:
      case 9:
      case 14:
        return Ie(t), null;
      case 1:
        return Ie(t), null;
      case 3:
        return a = t.stateNode, i = null, e !== null && (i = e.memoizedState.cache), t.memoizedState.cache !== i && (t.flags |= 2048), ua(nt), Ee(), a.pendingContext && (a.context = a.pendingContext, a.pendingContext = null), (e === null || e.child === null) && (Rl(t) ? ma(t) : e === null || e.memoizedState.isDehydrated && (t.flags & 256) === 0 || (t.flags |= 1024, pc())), Ie(t), null;
      case 26:
        var n = t.type, s = t.memoizedState;
        return e === null ? (ma(t), s !== null ? (Ie(t), Tu(t, s)) : (Ie(t), ar(t, n, null, i, a))) : s ? s !== e.memoizedState ? (ma(t), Ie(t), Tu(t, s)) : (Ie(t), t.flags &= -16777217) : (e = e.memoizedProps, e !== i && ma(t), Ie(t), ar(t, n, e, i, a)), null;
      case 27:
        if (Re(t), a = Se.current, n = t.type, e !== null && t.stateNode != null) e.memoizedProps !== i && ma(t);
        else {
          if (!i) {
            if (t.stateNode === null) throw Error(d(166));
            return Ie(t), null;
          }
          e = ee.current, Rl(t) ? pd(t, e) : (e = Lp(n, i, a), t.stateNode = e, ma(t));
        }
        return Ie(t), null;
      case 5:
        if (Re(t), n = t.type, e !== null && t.stateNode != null) e.memoizedProps !== i && ma(t);
        else {
          if (!i) {
            if (t.stateNode === null) throw Error(d(166));
            return Ie(t), null;
          }
          if (s = ee.current, Rl(t)) pd(t, s);
          else {
            var c = ds(Se.current);
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
            s[ft] = t, s[St] = i;
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
            e: switch (gt(s, n, i), n) {
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
        return Ie(t), ar(t, t.type, e === null ? null : e.memoizedProps, t.pendingProps, a), null;
      case 6:
        if (e && t.stateNode != null) e.memoizedProps !== i && ma(t);
        else {
          if (typeof i != "string" && t.stateNode === null) throw Error(d(166));
          if (e = Se.current, Rl(t)) {
            if (e = t.stateNode, a = t.memoizedProps, i = null, n = ht, n !== null) switch (n.tag) {
              case 27:
              case 5:
                i = n.memoizedProps;
            }
            e[ft] = t, e = !!(e.nodeValue === a || i !== null && i.suppressHydrationWarning === !0 || kp(e.nodeValue, a)), e || Aa(t, !0);
          } else e = ds(e).createTextNode(i), e[ft] = t, t.stateNode = e;
        }
        return Ie(t), null;
      case 31:
        if (a = t.memoizedState, e === null || e.memoizedState !== null) {
          if (i = Rl(t), a !== null) {
            if (e === null) {
              if (!i) throw Error(d(318));
              if (e = t.memoizedState, e = e !== null ? e.dehydrated : null, !e) throw Error(d(557));
              e[ft] = t;
            } else ll(), (t.flags & 128) === 0 && (t.memoizedState = null), t.flags |= 4;
            Ie(t), e = !1;
          } else a = pc(), e !== null && e.memoizedState !== null && (e.memoizedState.hydrationErrors = a), e = !0;
          if (!e)
            return t.flags & 256 ? (Ot(t), t) : (Ot(t), null);
          if ((t.flags & 128) !== 0) throw Error(d(558));
        }
        return Ie(t), null;
      case 13:
        if (i = t.memoizedState, e === null || e.memoizedState !== null && e.memoizedState.dehydrated !== null) {
          if (n = Rl(t), i !== null && i.dehydrated !== null) {
            if (e === null) {
              if (!n) throw Error(d(318));
              if (n = t.memoizedState, n = n !== null ? n.dehydrated : null, !n) throw Error(d(317));
              n[ft] = t;
            } else ll(), (t.flags & 128) === 0 && (t.memoizedState = null), t.flags |= 4;
            Ie(t), n = !1;
          } else n = pc(), e !== null && e.memoizedState !== null && (e.memoizedState.hydrationErrors = n), n = !0;
          if (!n)
            return t.flags & 256 ? (Ot(t), t) : (Ot(t), null);
        }
        return Ot(t), (t.flags & 128) !== 0 ? (t.lanes = a, t) : (a = i !== null, e = e !== null && e.memoizedState !== null, a && (i = t.child, n = null, i.alternate !== null && i.alternate.memoizedState !== null && i.alternate.memoizedState.cachePool !== null && (n = i.alternate.memoizedState.cachePool.pool), s = null, i.memoizedState !== null && i.memoizedState.cachePool !== null && (s = i.memoizedState.cachePool.pool), s !== n && (i.flags |= 2048)), a !== e && a && (t.child.flags |= 8192), In(t, t.updateQueue), Ie(t), null);
      case 4:
        return Ee(), e === null && zp(t.stateNode.containerInfo), Ie(t), null;
      case 10:
        return ua(t.type), Ie(t), null;
      case 19:
        if (D(at), i = t.memoizedState, i === null) return Ie(t), null;
        if (n = (t.flags & 128) !== 0, s = i.rendering, s === null) if (n) Ri(i, !1);
        else {
          if (Pe !== 0 || e !== null && (e.flags & 128) !== 0) for (e = t.child; e !== null; ) {
            if (s = Rn(e), s !== null) {
              for (t.flags |= 128, Ri(i, !1), e = s.updateQueue, t.updateQueue = e, In(t, e), t.subtreeFlags = 0, e = a, a = t.child; a !== null; ) cd(a, e), a = a.sibling;
              return K(at, at.current & 1 | 2), Me && oa(t, i.treeForkCount), t.child;
            }
            e = e.sibling;
          }
          i.tail !== null && et() > es && (t.flags |= 128, n = !0, Ri(i, !1), t.lanes = 4194304);
        }
        else {
          if (!n) if (e = Rn(s), e !== null) {
            if (t.flags |= 128, n = !0, e = e.updateQueue, t.updateQueue = e, In(t, e), Ri(i, !0), i.tail === null && i.tailMode === "hidden" && !s.alternate && !Me) return Ie(t), null;
          } else 2 * et() - i.renderingStartTime > es && a !== 536870912 && (t.flags |= 128, n = !0, Ri(i, !1), t.lanes = 4194304);
          i.isBackwards ? (s.sibling = t.child, t.child = s) : (e = i.last, e !== null ? e.sibling = s : t.child = s, i.last = s);
        }
        return i.tail !== null ? (e = i.tail, i.rendering = e, i.tail = e.sibling, i.renderingStartTime = et(), e.sibling = null, a = at.current, K(at, n ? a & 1 | 2 : a & 1), Me && oa(t, i.treeForkCount), e) : (Ie(t), null);
      case 22:
      case 23:
        return Ot(t), wc(), i = t.memoizedState !== null, e !== null ? e.memoizedState !== null !== i && (t.flags |= 8192) : i && (t.flags |= 8192), i ? (a & 536870912) !== 0 && (t.flags & 128) === 0 && (Ie(t), t.subtreeFlags & 6 && (t.flags |= 8192)) : Ie(t), a = t.updateQueue, a !== null && In(t, a.retryQueue), a = null, e !== null && e.memoizedState !== null && e.memoizedState.cachePool !== null && (a = e.memoizedState.cachePool.pool), i = null, t.memoizedState !== null && t.memoizedState.cachePool !== null && (i = t.memoizedState.cachePool.pool), i !== a && (t.flags |= 2048), e !== null && D(sl), null;
      case 24:
        return a = null, e !== null && (a = e.memoizedState.cache), t.memoizedState.cache !== a && (t.flags |= 2048), ua(nt), Ie(t), null;
      case 25:
        return null;
      case 30:
        return null;
    }
    throw Error(d(156, t.tag));
  }
  function L0(e, t) {
    switch (dc(t), t.tag) {
      case 1:
        return e = t.flags, e & 65536 ? (t.flags = e & -65537 | 128, t) : null;
      case 3:
        return ua(nt), Ee(), e = t.flags, (e & 65536) !== 0 && (e & 128) === 0 ? (t.flags = e & -65537 | 128, t) : null;
      case 26:
      case 27:
      case 5:
        return Re(t), null;
      case 31:
        if (t.memoizedState !== null) {
          if (Ot(t), t.alternate === null) throw Error(d(340));
          ll();
        }
        return e = t.flags, e & 65536 ? (t.flags = e & -65537 | 128, t) : null;
      case 13:
        if (Ot(t), e = t.memoizedState, e !== null && e.dehydrated !== null) {
          if (t.alternate === null) throw Error(d(340));
          ll();
        }
        return e = t.flags, e & 65536 ? (t.flags = e & -65537 | 128, t) : null;
      case 19:
        return D(at), null;
      case 4:
        return Ee(), null;
      case 10:
        return ua(t.type), null;
      case 22:
      case 23:
        return Ot(t), wc(), e !== null && D(sl), e = t.flags, e & 65536 ? (t.flags = e & -65537 | 128, t) : null;
      case 24:
        return ua(nt), null;
      case 25:
        return null;
      default:
        return null;
    }
  }
  function Cu(e, t) {
    switch (dc(t), t.tag) {
      case 3:
        ua(nt), Ee();
        break;
      case 26:
      case 27:
      case 5:
        Re(t);
        break;
      case 4:
        Ee();
        break;
      case 31:
        t.memoizedState !== null && Ot(t);
        break;
      case 13:
        Ot(t);
        break;
      case 19:
        D(at);
        break;
      case 10:
        ua(t.type);
        break;
      case 22:
      case 23:
        Ot(t), wc(), e !== null && D(sl);
        break;
      case 24:
        ua(nt);
    }
  }
  function qi(e, t) {
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
    } catch (o) {
      Ye(t, t.return, o);
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
            var c = i.inst, o = c.destroy;
            if (o !== void 0) {
              c.destroy = void 0, n = t;
              var x = a, A = o;
              try {
                A();
              } catch (q) {
                Ye(n, x, q);
              }
            }
          }
          i = i.next;
        } while (i !== s);
      }
    } catch (q) {
      Ye(t, t.return, q);
    }
  }
  function Ou(e) {
    var t = e.updateQueue;
    if (t !== null) {
      var a = e.stateNode;
      try {
        wd(t, a);
      } catch (i) {
        Ye(e, e.return, i);
      }
    }
  }
  function Mu(e, t, a) {
    a.props = fl(e.type, e.memoizedProps), a.state = e.memoizedState;
    try {
      a.componentWillUnmount();
    } catch (i) {
      Ye(e, t, i);
    }
  }
  function Li(e, t) {
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
      Ye(e, t, n);
    }
  }
  function la(e, t) {
    var a = e.ref, i = e.refCleanup;
    if (a !== null) if (typeof i == "function") try {
      i();
    } catch (n) {
      Ye(e, t, n);
    } finally {
      e.refCleanup = null, e = e.alternate, e != null && (e.refCleanup = null);
    }
    else if (typeof a == "function") try {
      a(null);
    } catch (n) {
      Ye(e, t, n);
    }
    else a.current = null;
  }
  function Du(e) {
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
      Ye(e, e.return, n);
    }
  }
  function lr(e, t, a) {
    try {
      var i = e.stateNode;
      ih(i, e.type, a, t), i[St] = t;
    } catch (n) {
      Ye(e, e.return, n);
    }
  }
  function Uu(e) {
    return e.tag === 5 || e.tag === 3 || e.tag === 26 || e.tag === 27 && Ga(e.type) || e.tag === 4;
  }
  function ir(e) {
    e: for (; ; ) {
      for (; e.sibling === null; ) {
        if (e.return === null || Uu(e.return)) return null;
        e = e.return;
      }
      for (e.sibling.return = e.return, e = e.sibling; e.tag !== 5 && e.tag !== 6 && e.tag !== 18; ) {
        if (e.tag === 27 && Ga(e.type) || e.flags & 2 || e.child === null || e.tag === 4) continue e;
        e.child.return = e, e = e.child;
      }
      if (!(e.flags & 2)) return e.stateNode;
    }
  }
  function nr(e, t, a) {
    var i = e.tag;
    if (i === 5 || i === 6) e = e.stateNode, t ? (a.nodeType === 9 ? a.body : a.nodeName === "HTML" ? a.ownerDocument.body : a).insertBefore(e, t) : (t = a.nodeType === 9 ? a.body : a.nodeName === "HTML" ? a.ownerDocument.body : a, t.appendChild(e), a = a._reactRootContainer, a != null || t.onclick !== null || (t.onclick = sa));
    else if (i !== 4 && (i === 27 && Ga(e.type) && (a = e.stateNode, t = null), e = e.child, e !== null)) for (nr(e, t, a), e = e.sibling; e !== null; ) nr(e, t, a), e = e.sibling;
  }
  function $n(e, t, a) {
    var i = e.tag;
    if (i === 5 || i === 6) e = e.stateNode, t ? a.insertBefore(e, t) : a.appendChild(e);
    else if (i !== 4 && (i === 27 && Ga(e.type) && (a = e.stateNode), e = e.child, e !== null)) for ($n(e, t, a), e = e.sibling; e !== null; ) $n(e, t, a), e = e.sibling;
  }
  function Ru(e) {
    var t = e.stateNode, a = e.memoizedProps;
    try {
      for (var i = e.type, n = t.attributes; n.length; ) t.removeAttributeNode(n[0]);
      gt(t, i, a), t[ft] = e, t[St] = a;
    } catch (s) {
      Ye(e, e.return, s);
    }
  }
  var xa = !1, rt = !1, sr = !1, qu = typeof WeakSet == "function" ? WeakSet : Set, pt = null;
  function H0(e, t) {
    if (e = e.containerInfo, _r = gs, e = Fo(e), Ps(e)) {
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
          var c = 0, o = -1, x = -1, A = 0, q = 0, Y = e, C = null;
          t: for (; ; ) {
            for (var U; Y !== a || n !== 0 && Y.nodeType !== 3 || (o = c + n), Y !== s || i !== 0 && Y.nodeType !== 3 || (x = c + i), Y.nodeType === 3 && (c += Y.nodeValue.length), (U = Y.firstChild) !== null; )
              C = Y, Y = U;
            for (; ; ) {
              if (Y === e) break t;
              if (C === a && ++A === n && (o = c), C === s && ++q === i && (x = c), (U = Y.nextSibling) !== null) break;
              Y = C, C = Y.parentNode;
            }
            Y = U;
          }
          a = o === -1 || x === -1 ? null : {
            start: o,
            end: x
          };
        } else a = null;
      }
      a = a || {
        start: 0,
        end: 0
      };
    } else a = null;
    for (kr = {
      focusedElem: e,
      selectionRange: a
    }, gs = !1, pt = t; pt !== null; ) if (t = pt, e = t.child, (t.subtreeFlags & 1028) !== 0 && e !== null) e.return = t, pt = e;
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
              var de = fl(a.type, n);
              e = i.getSnapshotBeforeUpdate(de, s), i.__reactInternalSnapshotBeforeUpdate = e;
            } catch (ye) {
              Ye(a, a.return, ye);
            }
          }
          break;
        case 3:
          if ((e & 1024) !== 0) {
            if (e = t.stateNode.containerInfo, a = e.nodeType, a === 9) Tr(e);
            else if (a === 1) switch (e.nodeName) {
              case "HEAD":
              case "HTML":
              case "BODY":
                Tr(e);
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
        e.return = t.return, pt = e;
        break;
      }
      pt = t.return;
    }
  }
  function Lu(e, t, a) {
    var i = a.flags;
    switch (a.tag) {
      case 0:
      case 11:
      case 15:
        ba(e, a), i & 4 && qi(5, a);
        break;
      case 1:
        if (ba(e, a), i & 4) if (e = a.stateNode, t === null) try {
          e.componentDidMount();
        } catch (c) {
          Ye(a, a.return, c);
        }
        else {
          var n = fl(a.type, t.memoizedProps);
          t = t.memoizedState;
          try {
            e.componentDidUpdate(n, t, e.__reactInternalSnapshotBeforeUpdate);
          } catch (c) {
            Ye(a, a.return, c);
          }
        }
        i & 64 && Ou(a), i & 512 && Li(a, a.return);
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
            wd(e, t);
          } catch (c) {
            Ye(a, a.return, c);
          }
        }
        break;
      case 27:
        t === null && i & 4 && Ru(a);
      case 26:
      case 5:
        ba(e, a), t === null && i & 4 && Du(a), i & 512 && Li(a, a.return);
        break;
      case 12:
        ba(e, a);
        break;
      case 31:
        ba(e, a), i & 4 && Gu(e, a);
        break;
      case 13:
        ba(e, a), i & 4 && Yu(e, a), i & 64 && (e = a.memoizedState, e !== null && (e = e.dehydrated, e !== null && (a = J0.bind(null, a), ph(e, a))));
        break;
      case 22:
        if (i = a.memoizedState !== null || xa, !i) {
          t = t !== null && t.memoizedState !== null || rt, n = xa;
          var s = rt;
          xa = i, (rt = t) && !s ? va(e, a, (a.subtreeFlags & 8772) !== 0) : ba(e, a), xa = n, rt = s;
        }
        break;
      case 30:
        break;
      default:
        ba(e, a);
    }
  }
  function Hu(e) {
    var t = e.alternate;
    t !== null && (e.alternate = null, Hu(t)), e.child = null, e.deletions = null, e.sibling = null, e.tag === 5 && (t = e.stateNode, t !== null && Rs(t)), e.stateNode = null, e.return = null, e.dependencies = null, e.memoizedProps = null, e.memoizedState = null, e.pendingProps = null, e.stateNode = null, e.updateQueue = null;
  }
  var $e = null, Nt = !1;
  function ga(e, t, a) {
    for (a = a.child; a !== null; ) Bu(e, t, a), a = a.sibling;
  }
  function Bu(e, t, a) {
    if (Ze && typeof Ze.onCommitFiberUnmount == "function") try {
      Ze.onCommitFiberUnmount(tt, a);
    } catch {
    }
    switch (a.tag) {
      case 26:
        rt || la(a, t), ga(e, t, a), a.memoizedState ? a.memoizedState.count-- : a.stateNode && (a = a.stateNode, a.parentNode.removeChild(a));
        break;
      case 27:
        rt || la(a, t);
        var i = $e, n = Nt;
        Ga(a.type) && ($e = a.stateNode, Nt = !1), ga(e, t, a), Ki(a.stateNode), $e = i, Nt = n;
        break;
      case 5:
        rt || la(a, t);
      case 6:
        if (i = $e, n = Nt, $e = null, ga(e, t, a), $e = i, Nt = n, $e !== null) if (Nt) try {
          ($e.nodeType === 9 ? $e.body : $e.nodeName === "HTML" ? $e.ownerDocument.body : $e).removeChild(a.stateNode);
        } catch (s) {
          Ye(a, t, s);
        }
        else try {
          $e.removeChild(a.stateNode);
        } catch (s) {
          Ye(a, t, s);
        }
        break;
      case 18:
        $e !== null && (Nt ? (e = $e, Mp(e.nodeType === 9 ? e.body : e.nodeName === "HTML" ? e.ownerDocument.body : e, a.stateNode), li(e)) : Mp($e, a.stateNode));
        break;
      case 4:
        i = $e, n = Nt, $e = a.stateNode.containerInfo, Nt = !0, ga(e, t, a), $e = i, Nt = n;
        break;
      case 0:
      case 11:
      case 14:
      case 15:
        Da(2, a, t), rt || Da(4, a, t), ga(e, t, a);
        break;
      case 1:
        rt || (la(a, t), i = a.stateNode, typeof i.componentWillUnmount == "function" && Mu(a, t, i)), ga(e, t, a);
        break;
      case 21:
        ga(e, t, a);
        break;
      case 22:
        rt = (i = rt) || a.memoizedState !== null, ga(e, t, a), rt = i;
        break;
      default:
        ga(e, t, a);
    }
  }
  function Gu(e, t) {
    if (t.memoizedState === null && (e = t.alternate, e !== null && (e = e.memoizedState, e !== null))) {
      e = e.dehydrated;
      try {
        li(e);
      } catch (a) {
        Ye(t, t.return, a);
      }
    }
  }
  function Yu(e, t) {
    if (t.memoizedState === null && (e = t.alternate, e !== null && (e = e.memoizedState, e !== null && (e = e.dehydrated, e !== null)))) try {
      li(e);
    } catch (a) {
      Ye(t, t.return, a);
    }
  }
  function B0(e) {
    switch (e.tag) {
      case 31:
      case 13:
      case 19:
        var t = e.stateNode;
        return t === null && (t = e.stateNode = new qu()), t;
      case 22:
        return e = e.stateNode, t = e._retryCache, t === null && (t = e._retryCache = new qu()), t;
      default:
        throw Error(d(435, e.tag));
    }
  }
  function Wn(e, t) {
    var a = B0(e);
    t.forEach(function(i) {
      if (!a.has(i)) {
        a.add(i);
        var n = I0.bind(null, e, i);
        i.then(n, n);
      }
    });
  }
  function wt(e, t) {
    var a = t.deletions;
    if (a !== null) for (var i = 0; i < a.length; i++) {
      var n = a[i], s = e, c = t, o = c;
      e: for (; o !== null; ) {
        switch (o.tag) {
          case 27:
            if (Ga(o.type)) {
              $e = o.stateNode, Nt = !1;
              break e;
            }
            break;
          case 5:
            $e = o.stateNode, Nt = !1;
            break e;
          case 3:
          case 4:
            $e = o.stateNode.containerInfo, Nt = !0;
            break e;
        }
        o = o.return;
      }
      if ($e === null) throw Error(d(160));
      Bu(s, c, n), $e = null, Nt = !1, s = n.alternate, s !== null && (s.return = null), n.return = null;
    }
    if (t.subtreeFlags & 13886) for (t = t.child; t !== null; ) Vu(t, e), t = t.sibling;
  }
  var $t = null;
  function Vu(e, t) {
    var a = e.alternate, i = e.flags;
    switch (e.tag) {
      case 0:
      case 11:
      case 14:
      case 15:
        wt(t, e), _t(e), i & 4 && (Da(3, e, e.return), qi(3, e), Da(5, e, e.return));
        break;
      case 1:
        wt(t, e), _t(e), i & 512 && (rt || a === null || la(a, a.return)), i & 64 && xa && (e = e.updateQueue, e !== null && (i = e.callbacks, i !== null && (a = e.shared.hiddenCallbacks, e.shared.hiddenCallbacks = a === null ? i : a.concat(i))));
        break;
      case 26:
        var n = $t;
        if (wt(t, e), _t(e), i & 512 && (rt || a === null || la(a, a.return)), i & 4) {
          var s = a !== null ? a.memoizedState : null;
          if (i = e.memoizedState, a === null) if (i === null) if (e.stateNode === null) {
            e: {
              i = e.type, a = e.memoizedProps, n = n.ownerDocument || n;
              t: switch (i) {
                case "title":
                  s = n.getElementsByTagName("title")[0], (!s || s[ui] || s[ft] || s.namespaceURI === "http://www.w3.org/2000/svg" || s.hasAttribute("itemprop")) && (s = n.createElement(i), n.head.insertBefore(s, n.querySelector("head > title"))), gt(s, i, a), s[ft] = e, ut(s), i = s;
                  break e;
                case "link":
                  var c = Xp("link", "href", n).get(i + (a.href || ""));
                  if (c) {
                    for (var o = 0; o < c.length; o++) if (s = c[o], s.getAttribute("href") === (a.href == null || a.href === "" ? null : a.href) && s.getAttribute("rel") === (a.rel == null ? null : a.rel) && s.getAttribute("title") === (a.title == null ? null : a.title) && s.getAttribute("crossorigin") === (a.crossOrigin == null ? null : a.crossOrigin)) {
                      c.splice(o, 1);
                      break t;
                    }
                  }
                  s = n.createElement(i), gt(s, i, a), n.head.appendChild(s);
                  break;
                case "meta":
                  if (c = Xp("meta", "content", n).get(i + (a.content || ""))) {
                    for (o = 0; o < c.length; o++) if (s = c[o], s.getAttribute("content") === (a.content == null ? null : "" + a.content) && s.getAttribute("name") === (a.name == null ? null : a.name) && s.getAttribute("property") === (a.property == null ? null : a.property) && s.getAttribute("http-equiv") === (a.httpEquiv == null ? null : a.httpEquiv) && s.getAttribute("charset") === (a.charSet == null ? null : a.charSet)) {
                      c.splice(o, 1);
                      break t;
                    }
                  }
                  s = n.createElement(i), gt(s, i, a), n.head.appendChild(s);
                  break;
                default:
                  throw Error(d(468, i));
              }
              s[ft] = e, ut(s), i = s;
            }
            e.stateNode = i;
          } else Qp(n, e.type, e.stateNode);
          else e.stateNode = Vp(n, i, e.memoizedProps);
          else s !== i ? (s === null ? a.stateNode !== null && (a = a.stateNode, a.parentNode.removeChild(a)) : s.count--, i === null ? Qp(n, e.type, e.stateNode) : Vp(n, i, e.memoizedProps)) : i === null && e.stateNode !== null && lr(e, e.memoizedProps, a.memoizedProps);
        }
        break;
      case 27:
        wt(t, e), _t(e), i & 512 && (rt || a === null || la(a, a.return)), a !== null && i & 4 && lr(e, e.memoizedProps, a.memoizedProps);
        break;
      case 5:
        if (wt(t, e), _t(e), i & 512 && (rt || a === null || la(a, a.return)), e.flags & 32) {
          n = e.stateNode;
          try {
            _l(n, "");
          } catch (de) {
            Ye(e, e.return, de);
          }
        }
        i & 4 && e.stateNode != null && (n = e.memoizedProps, lr(e, n, a !== null ? a.memoizedProps : n)), i & 1024 && (sr = !0);
        break;
      case 6:
        if (wt(t, e), _t(e), i & 4) {
          if (e.stateNode === null) throw Error(d(162));
          i = e.memoizedProps, a = e.stateNode;
          try {
            a.nodeValue = i;
          } catch (de) {
            Ye(e, e.return, de);
          }
        }
        break;
      case 3:
        if (fs = null, n = $t, $t = us(t.containerInfo), wt(t, e), $t = n, _t(e), i & 4 && a !== null && a.memoizedState.isDehydrated) try {
          li(t.containerInfo);
        } catch (de) {
          Ye(e, e.return, de);
        }
        sr && (sr = !1, Xu(e));
        break;
      case 4:
        i = $t, $t = us(e.stateNode.containerInfo), wt(t, e), _t(e), $t = i;
        break;
      case 12:
        wt(t, e), _t(e);
        break;
      case 31:
        wt(t, e), _t(e), i & 4 && (i = e.updateQueue, i !== null && (e.updateQueue = null, Wn(e, i)));
        break;
      case 13:
        wt(t, e), _t(e), e.child.flags & 8192 && e.memoizedState !== null != (a !== null && a.memoizedState !== null) && (Pn = et()), i & 4 && (i = e.updateQueue, i !== null && (e.updateQueue = null, Wn(e, i)));
        break;
      case 22:
        n = e.memoizedState !== null;
        var x = a !== null && a.memoizedState !== null, A = xa, q = rt;
        if (xa = A || n, rt = q || x, wt(t, e), rt = q, xa = A, _t(e), i & 8192) e: for (t = e.stateNode, t._visibility = n ? t._visibility & -2 : t._visibility | 1, n && (a === null || x || xa || rt || hl(e)), a = null, t = e; ; ) {
          if (t.tag === 5 || t.tag === 26) {
            if (a === null) {
              x = a = t;
              try {
                if (s = x.stateNode, n) c = s.style, typeof c.setProperty == "function" ? c.setProperty("display", "none", "important") : c.display = "none";
                else {
                  o = x.stateNode;
                  var Y = x.memoizedProps.style, C = Y != null && Y.hasOwnProperty("display") ? Y.display : null;
                  o.style.display = C == null || typeof C == "boolean" ? "" : ("" + C).trim();
                }
              } catch (de) {
                Ye(x, x.return, de);
              }
            }
          } else if (t.tag === 6) {
            if (a === null) {
              x = t;
              try {
                x.stateNode.nodeValue = n ? "" : x.memoizedProps;
              } catch (de) {
                Ye(x, x.return, de);
              }
            }
          } else if (t.tag === 18) {
            if (a === null) {
              x = t;
              try {
                var U = x.stateNode;
                n ? Dp(U, !0) : Dp(x.stateNode, !1);
              } catch (de) {
                Ye(x, x.return, de);
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
        i & 4 && (i = e.updateQueue, i !== null && (a = i.retryQueue, a !== null && (i.retryQueue = null, Wn(e, a))));
        break;
      case 19:
        wt(t, e), _t(e), i & 4 && (i = e.updateQueue, i !== null && (e.updateQueue = null, Wn(e, i)));
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
          if (Uu(i)) {
            a = i;
            break;
          }
          i = i.return;
        }
        if (a == null) throw Error(d(160));
        switch (a.tag) {
          case 27:
            var n = a.stateNode;
            $n(e, ir(e), n);
            break;
          case 5:
            var s = a.stateNode;
            a.flags & 32 && (_l(s, ""), a.flags &= -33), $n(e, ir(e), s);
            break;
          case 3:
          case 4:
            var c = a.stateNode.containerInfo;
            nr(e, ir(e), c);
            break;
          default:
            throw Error(d(161));
        }
      } catch (o) {
        Ye(e, e.return, o);
      }
      e.flags &= -3;
    }
    t & 4096 && (e.flags &= -4097);
  }
  function Xu(e) {
    if (e.subtreeFlags & 1024) for (e = e.child; e !== null; ) {
      var t = e;
      Xu(t), t.tag === 5 && t.flags & 1024 && t.stateNode.reset(), e = e.sibling;
    }
  }
  function ba(e, t) {
    if (t.subtreeFlags & 8772) for (t = t.child; t !== null; ) Lu(e, t.alternate, t), t = t.sibling;
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
          typeof a.componentWillUnmount == "function" && Mu(t, t.return, a), hl(t);
          break;
        case 27:
          Ki(t.stateNode);
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
          va(n, s, a), qi(4, s);
          break;
        case 1:
          if (va(n, s, a), i = s, n = i.stateNode, typeof n.componentDidMount == "function") try {
            n.componentDidMount();
          } catch (A) {
            Ye(i, i.return, A);
          }
          if (i = s, n = i.updateQueue, n !== null) {
            var o = i.stateNode;
            try {
              var x = n.shared.hiddenCallbacks;
              if (x !== null) for (n.shared.hiddenCallbacks = null, n = 0; n < x.length; n++) Nd(x[n], o);
            } catch (A) {
              Ye(i, i.return, A);
            }
          }
          a && c & 64 && Ou(s), Li(s, s.return);
          break;
        case 27:
          Ru(s);
        case 26:
        case 5:
          va(n, s, a), a && i === null && c & 4 && Du(s), Li(s, s.return);
          break;
        case 12:
          va(n, s, a);
          break;
        case 31:
          va(n, s, a), a && c & 4 && Gu(n, s);
          break;
        case 13:
          va(n, s, a), a && c & 4 && Yu(n, s);
          break;
        case 22:
          s.memoizedState === null && va(n, s, a), Li(s, s.return);
          break;
        case 30:
          break;
        default:
          va(n, s, a);
      }
      t = t.sibling;
    }
  }
  function cr(e, t) {
    var a = null;
    e !== null && e.memoizedState !== null && e.memoizedState.cachePool !== null && (a = e.memoizedState.cachePool.pool), e = null, t.memoizedState !== null && t.memoizedState.cachePool !== null && (e = t.memoizedState.cachePool.pool), e !== a && (e != null && e.refCount++, a != null && Ni(a));
  }
  function rr(e, t) {
    e = null, t.alternate !== null && (e = t.alternate.memoizedState.cache), t = t.memoizedState.cache, t !== e && (t.refCount++, e != null && Ni(e));
  }
  function Wt(e, t, a, i) {
    if (t.subtreeFlags & 10256) for (t = t.child; t !== null; ) Qu(e, t, a, i), t = t.sibling;
  }
  function Qu(e, t, a, i) {
    var n = t.flags;
    switch (t.tag) {
      case 0:
      case 11:
      case 15:
        Wt(e, t, a, i), n & 2048 && qi(9, t);
        break;
      case 1:
        Wt(e, t, a, i);
        break;
      case 3:
        Wt(e, t, a, i), n & 2048 && (e = null, t.alternate !== null && (e = t.alternate.memoizedState.cache), t = t.memoizedState.cache, t !== e && (t.refCount++, e != null && Ni(e)));
        break;
      case 12:
        if (n & 2048) {
          Wt(e, t, a, i), e = t.stateNode;
          try {
            var s = t.memoizedProps, c = s.id, o = s.onPostCommit;
            typeof o == "function" && o(c, t.alternate === null ? "mount" : "update", e.passiveEffectDuration, -0);
          } catch (x) {
            Ye(t, t.return, x);
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
        s = t.stateNode, c = t.alternate, t.memoizedState !== null ? s._visibility & 2 ? Wt(e, t, a, i) : Hi(e, t) : s._visibility & 2 ? Wt(e, t, a, i) : (s._visibility |= 2, Zl(e, t, a, i, (t.subtreeFlags & 10256) !== 0 || !1)), n & 2048 && cr(c, t);
        break;
      case 24:
        Wt(e, t, a, i), n & 2048 && rr(t.alternate, t);
        break;
      default:
        Wt(e, t, a, i);
    }
  }
  function Zl(e, t, a, i, n) {
    for (n = n && ((t.subtreeFlags & 10256) !== 0 || !1), t = t.child; t !== null; ) {
      var s = e, c = t, o = a, x = i, A = c.flags;
      switch (c.tag) {
        case 0:
        case 11:
        case 15:
          Zl(s, c, o, x, n), qi(8, c);
          break;
        case 23:
          break;
        case 22:
          var q = c.stateNode;
          c.memoizedState !== null ? q._visibility & 2 ? Zl(s, c, o, x, n) : Hi(s, c) : (q._visibility |= 2, Zl(s, c, o, x, n)), n && A & 2048 && cr(c.alternate, c);
          break;
        case 24:
          Zl(s, c, o, x, n), n && A & 2048 && rr(c.alternate, c);
          break;
        default:
          Zl(s, c, o, x, n);
      }
      t = t.sibling;
    }
  }
  function Hi(e, t) {
    if (t.subtreeFlags & 10256) for (t = t.child; t !== null; ) {
      var a = e, i = t, n = i.flags;
      switch (i.tag) {
        case 22:
          Hi(a, i), n & 2048 && cr(i.alternate, i);
          break;
        case 24:
          Hi(a, i), n & 2048 && rr(i.alternate, i);
          break;
        default:
          Hi(a, i);
      }
      t = t.sibling;
    }
  }
  var Bi = 8192;
  function Kl(e, t, a) {
    if (e.subtreeFlags & Bi) for (e = e.child; e !== null; ) Zu(e, t, a), e = e.sibling;
  }
  function Zu(e, t, a) {
    switch (e.tag) {
      case 26:
        Kl(e, t, a), e.flags & Bi && e.memoizedState !== null && Nh(a, $t, e.memoizedState, e.memoizedProps);
        break;
      case 5:
        Kl(e, t, a);
        break;
      case 3:
      case 4:
        var i = $t;
        $t = us(e.stateNode.containerInfo), Kl(e, t, a), $t = i;
        break;
      case 22:
        e.memoizedState === null && (i = e.alternate, i !== null && i.memoizedState !== null ? (i = Bi, Bi = 16777216, Kl(e, t, a), Bi = i) : Kl(e, t, a));
        break;
      default:
        Kl(e, t, a);
    }
  }
  function Ku(e) {
    var t = e.alternate;
    if (t !== null && (e = t.child, e !== null)) {
      t.child = null;
      do
        t = e.sibling, e.sibling = null, e = t;
      while (e !== null);
    }
  }
  function Gi(e) {
    var t = e.deletions;
    if ((e.flags & 16) !== 0) {
      if (t !== null) for (var a = 0; a < t.length; a++) {
        var i = t[a];
        pt = i, Iu(i, e);
      }
      Ku(e);
    }
    if (e.subtreeFlags & 10256) for (e = e.child; e !== null; ) Ju(e), e = e.sibling;
  }
  function Ju(e) {
    switch (e.tag) {
      case 0:
      case 11:
      case 15:
        Gi(e), e.flags & 2048 && Da(9, e, e.return);
        break;
      case 3:
        Gi(e);
        break;
      case 12:
        Gi(e);
        break;
      case 22:
        var t = e.stateNode;
        e.memoizedState !== null && t._visibility & 2 && (e.return === null || e.return.tag !== 13) ? (t._visibility &= -3, Fn(e)) : Gi(e);
        break;
      default:
        Gi(e);
    }
  }
  function Fn(e) {
    var t = e.deletions;
    if ((e.flags & 16) !== 0) {
      if (t !== null) for (var a = 0; a < t.length; a++) {
        var i = t[a];
        pt = i, Iu(i, e);
      }
      Ku(e);
    }
    for (e = e.child; e !== null; ) {
      switch (t = e, t.tag) {
        case 0:
        case 11:
        case 15:
          Da(8, t, t.return), Fn(t);
          break;
        case 22:
          a = t.stateNode, a._visibility & 2 && (a._visibility &= -3, Fn(t));
          break;
        default:
          Fn(t);
      }
      e = e.sibling;
    }
  }
  function Iu(e, t) {
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
          Ni(a.memoizedState.cache);
      }
      if (i = a.child, i !== null) i.return = a, pt = i;
      else e: for (a = e; pt !== null; ) {
        i = pt;
        var n = i.sibling, s = i.return;
        if (Hu(i), i === a) {
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
  var G0 = {
    getCacheForType: function(e) {
      var t = mt(nt), a = t.data.get(e);
      return a === void 0 && (a = e(), t.data.set(e, a)), a;
    },
    cacheSignal: function() {
      return mt(nt).controller.signal;
    }
  }, Y0 = typeof WeakMap == "function" ? WeakMap : Map, He = 0, Ke = null, Ae = null, Ce = 0, Ge = 0, Mt = null, Ua = !1, Jl = !1, or = !1, ja = 0, Pe = 0, Ra = 0, ml = 0, dr = 0, Dt = 0, Il = 0, Yi = null, kt = null, ur = !1, Pn = 0, $u = 0, es = 1 / 0, ts = null, qa = null, dt = 0, La = null, $l = null, ya = 0, pr = 0, fr = null, Wu = null, Vi = 0, hr = null;
  function Xt() {
    return (He & 2) !== 0 && Ce !== 0 ? Ce & -Ce : B.T !== null ? jr() : xo();
  }
  function Fu() {
    if (Dt === 0) if ((Ce & 536870912) === 0 || Me) {
      var e = rn;
      rn <<= 1, (rn & 3932160) === 0 && (rn = 262144), Dt = e;
    } else Dt = 536870912;
    return e = Ct.current, e !== null && (e.flags |= 32), Dt;
  }
  function Et(e, t, a) {
    (e === Ke && (Ge === 2 || Ge === 9) || e.cancelPendingCommit !== null) && (Wl(e, 0), Ha(e, Ce, Dt, !1)), un(e, a), ((He & 2) === 0 || e !== Ke) && (e === Ke && ((He & 2) === 0 && (ml |= a), Pe === 4 && Ha(e, Ce, Dt, !1)), Sa(e));
  }
  function Pu(e, t, a) {
    if ((He & 6) !== 0) throw Error(d(327));
    var i = !a && (t & 127) === 0 && (t & e.expiredLanes) === 0 || oi(e, t), n = i ? Q0(e, t) : xr(e, t, !0), s = i;
    do {
      if (n === 0) {
        Jl && !i && Ha(e, t, 0, !1);
        break;
      } else {
        if (a = e.current.alternate, s && !V0(a)) {
          n = xr(e, t, !1), s = !1;
          continue;
        }
        if (n === 2) {
          if (s = t, e.errorRecoveryDisabledLanes & s) var c = 0;
          else c = e.pendingLanes & -536870913, c = c !== 0 ? c : c & 536870912 ? 536870912 : 0;
          if (c !== 0) {
            t = c;
            e: {
              var o = e;
              n = Yi;
              var x = o.current.memoizedState.isDehydrated;
              if (x && (Wl(o, c).flags |= 256), c = xr(o, c, !1), c !== 2) {
                if (or && !x) {
                  o.errorRecoveryDisabledLanes |= s, ml |= s, n = 4;
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
              throw Error(d(345));
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
              throw Error(d(329));
          }
          if ((t & 62914560) === t && (n = Pn + 300 - et(), 10 < n)) {
            if (Ha(i, t, Dt, !Ua), dn(i, 0, !0) !== 0) break e;
            ya = t, i.timeoutHandle = Cp(ep.bind(null, i, a, kt, ts, ur, t, Dt, ml, Il, Ua, s, "Throttled", -0, 0), n);
            break e;
          }
          ep(i, a, kt, ts, ur, t, Dt, ml, Il, Ua, s, null, -0, 0);
        }
      }
      break;
    } while (!0);
    Sa(e);
  }
  function ep(e, t, a, i, n, s, c, o, x, A, q, Y, C, U) {
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
      }, Zu(t, s, Y);
      var de = (s & 62914560) === s ? Pn - et() : (s & 4194048) === s ? $u - et() : 0;
      if (de = wh(Y, de), de !== null) {
        ya = s, e.cancelPendingCommit = de(rp.bind(null, e, t, s, a, i, n, c, o, x, q, Y, null, C, U)), Ha(e, s, c, !A);
        return;
      }
    }
    rp(e, t, s, a, i, n, c, o, x);
  }
  function V0(e) {
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
    t &= ~dr, t &= ~ml, e.suspendedLanes |= t, e.pingedLanes &= ~t, i && (e.warmLanes |= t), i = e.expirationTimes;
    for (var n = t; 0 < n; ) {
      var s = 31 - ot(n), c = 1 << s;
      i[s] = -1, n &= ~c;
    }
    a !== 0 && po(e, a, t);
  }
  function as() {
    return (He & 6) === 0 ? (Xi(0, !1), !1) : !0;
  }
  function mr() {
    if (Ae !== null) {
      if (Ge === 0) var e = Ae.return;
      else e = Ae, da = il = null, Cc(e), Gl = null, _i = 0, e = Ae;
      for (; e !== null; ) Cu(e.alternate, e), e = e.return;
      Ae = null;
    }
  }
  function Wl(e, t) {
    var a = e.timeoutHandle;
    a !== -1 && (e.timeoutHandle = -1, ch(a)), a = e.cancelPendingCommit, a !== null && (e.cancelPendingCommit = null, a()), ya = 0, mr(), Ke = e, Ae = a = ra(e.current, null), Ce = t, Ge = 0, Mt = null, Ua = !1, Jl = oi(e, t), or = !1, Il = Dt = dr = ml = Ra = Pe = 0, kt = Yi = null, ur = !1, (t & 8) !== 0 && (t |= t & 32);
    var i = e.entangledLanes;
    if (i !== 0) for (e = e.entanglements, i &= t; 0 < i; ) {
      var n = 31 - ot(i), s = 1 << n;
      t |= e[n], i &= ~s;
    }
    return ja = t, zn(), a;
  }
  function tp(e, t) {
    _e = null, B.H = Di, t === Bl || t === Cn ? (t = jd(), Ge = 3) : t === vc ? (t = jd(), Ge = 4) : Ge = t === Kc ? 8 : t !== null && typeof t == "object" && typeof t.then == "function" ? 6 : 1, Mt = t, Ae === null && (Pe = 1, Qn(e, Ht(t, e.current)));
  }
  function ap() {
    var e = Ct.current;
    return e === null ? !0 : (Ce & 4194048) === Ce ? Vt === null : (Ce & 62914560) === Ce || (Ce & 536870912) !== 0 ? e === Vt : !1;
  }
  function lp() {
    var e = B.H;
    return B.H = Di, e === null ? Di : e;
  }
  function ip() {
    var e = B.A;
    return B.A = G0, e;
  }
  function ls() {
    Pe = 4, Ua || (Ce & 4194048) !== Ce && Ct.current !== null || (Jl = !0), (Ra & 134217727) === 0 && (ml & 134217727) === 0 || Ke === null || Ha(Ke, Ce, Dt, !1);
  }
  function xr(e, t, a) {
    var i = He;
    He |= 2;
    var n = lp(), s = ip();
    (Ke !== e || Ce !== t) && (ts = null, Wl(e, t)), t = !1;
    var c = Pe;
    e: do
      try {
        if (Ge !== 0 && Ae !== null) {
          var o = Ae, x = Mt;
          switch (Ge) {
            case 8:
              mr(), c = 6;
              break e;
            case 3:
            case 2:
            case 9:
            case 6:
              Ct.current === null && (t = !0);
              var A = Ge;
              if (Ge = 0, Mt = null, Fl(e, o, x, A), a && Jl) {
                c = 0;
                break e;
              }
              break;
            default:
              A = Ge, Ge = 0, Mt = null, Fl(e, o, x, A);
          }
        }
        X0(), c = Pe;
        break;
      } catch (q) {
        tp(e, q);
      }
    while (!0);
    return t && e.shellSuspendCounter++, da = il = null, He = i, B.H = n, B.A = s, Ae === null && (Ke = null, Ce = 0, zn()), c;
  }
  function X0() {
    for (; Ae !== null; ) np(Ae);
  }
  function Q0(e, t) {
    var a = He;
    He |= 2;
    var i = lp(), n = ip();
    Ke !== e || Ce !== t ? (ts = null, es = et() + 500, Wl(e, t)) : Jl = oi(e, t);
    e: do
      try {
        if (Ge !== 0 && Ae !== null) {
          t = Ae;
          var s = Mt;
          t: switch (Ge) {
            case 1:
              Ge = 0, Mt = null, Fl(e, t, s, 1);
              break;
            case 2:
            case 9:
              if (bd(s)) {
                Ge = 0, Mt = null, sp(t);
                break;
              }
              t = function() {
                Ge !== 2 && Ge !== 9 || Ke !== e || (Ge = 7), Sa(e);
              }, s.then(t, t);
              break e;
            case 3:
              Ge = 7;
              break e;
            case 4:
              Ge = 5;
              break e;
            case 7:
              bd(s) ? (Ge = 0, Mt = null, sp(t)) : (Ge = 0, Mt = null, Fl(e, t, s, 7));
              break;
            case 5:
              var c = null;
              switch (Ae.tag) {
                case 26:
                  c = Ae.memoizedState;
                case 5:
                case 27:
                  var o = Ae;
                  if (c ? Zp(c) : o.stateNode.complete) {
                    Ge = 0, Mt = null;
                    var x = o.sibling;
                    if (x !== null) Ae = x;
                    else {
                      var A = o.return;
                      A !== null ? (Ae = A, is(A)) : Ae = null;
                    }
                    break t;
                  }
              }
              Ge = 0, Mt = null, Fl(e, t, s, 5);
              break;
            case 6:
              Ge = 0, Mt = null, Fl(e, t, s, 6);
              break;
            case 8:
              mr(), Pe = 6;
              break e;
            default:
              throw Error(d(462));
          }
        }
        Z0();
        break;
      } catch (q) {
        tp(e, q);
      }
    while (!0);
    return da = il = null, B.H = i, B.A = n, He = a, Ae !== null ? 0 : (Ke = null, Ce = 0, zn(), Pe);
  }
  function Z0() {
    for (; Ae !== null && !it(); ) np(Ae);
  }
  function np(e) {
    var t = Au(e.alternate, e, ja);
    e.memoizedProps = e.pendingProps, t === null ? is(e) : Ae = t;
  }
  function sp(e) {
    var t = e, a = t.alternate;
    switch (t.tag) {
      case 15:
      case 0:
        t = zu(a, t, t.pendingProps, t.type, void 0, Ce);
        break;
      case 11:
        t = zu(a, t, t.pendingProps, t.type.render, t.ref, Ce);
        break;
      case 5:
        Cc(t);
      default:
        Cu(a, t), t = Ae = cd(t, ja), t = Au(a, t, ja);
    }
    e.memoizedProps = e.pendingProps, t === null ? is(e) : Ae = t;
  }
  function Fl(e, t, a, i) {
    da = il = null, Cc(t), Gl = null, _i = 0;
    var n = t.return;
    try {
      if (D0(e, n, t, a, Ce)) {
        Pe = 1, Qn(e, Ht(a, e.current)), Ae = null;
        return;
      }
    } catch (s) {
      if (n !== null) throw Ae = n, s;
      Pe = 1, Qn(e, Ht(a, e.current)), Ae = null;
      return;
    }
    t.flags & 32768 ? (Me || i === 1 ? e = !0 : Jl || (Ce & 536870912) !== 0 ? e = !1 : (Ua = e = !0, (i === 2 || i === 9 || i === 3 || i === 6) && (i = Ct.current, i !== null && i.tag === 13 && (i.flags |= 16384))), cp(t, e)) : is(t);
  }
  function is(e) {
    var t = e;
    do {
      if ((t.flags & 32768) !== 0) {
        cp(t, Ua);
        return;
      }
      e = t.return;
      var a = q0(t.alternate, t, ja);
      if (a !== null) {
        Ae = a;
        return;
      }
      if (t = t.sibling, t !== null) {
        Ae = t;
        return;
      }
      Ae = t = e;
    } while (t !== null);
    Pe === 0 && (Pe = 5);
  }
  function cp(e, t) {
    do {
      var a = L0(e.alternate, e);
      if (a !== null) {
        a.flags &= 32767, Ae = a;
        return;
      }
      if (a = e.return, a !== null && (a.flags |= 32768, a.subtreeFlags = 0, a.deletions = null), !t && (e = e.sibling, e !== null)) {
        Ae = e;
        return;
      }
      Ae = e = a;
    } while (e !== null);
    Pe = 6, Ae = null;
  }
  function rp(e, t, a, i, n, s, c, o, x) {
    e.cancelPendingCommit = null;
    do
      ns();
    while (dt !== 0);
    if ((He & 6) !== 0) throw Error(d(327));
    if (t !== null) {
      if (t === e.current) throw Error(d(177));
      if (s = t.lanes | t.childLanes, s |= ic, Mf(e, a, s, c, o, x), e === Ke && (Ae = Ke = null, Ce = 0), $l = t, La = e, ya = a, pr = s, fr = n, Wu = i, (t.subtreeFlags & 10256) !== 0 || (t.flags & 10256) !== 0 ? (e.callbackNode = null, e.callbackPriority = 0, $0(ea, function() {
        return fp(), null;
      })) : (e.callbackNode = null, e.callbackPriority = 0), i = (t.flags & 13878) !== 0, (t.subtreeFlags & 13878) !== 0 || i) {
        i = B.T, B.T = null, n = G.p, G.p = 2, c = He, He |= 4;
        try {
          H0(e, t, a);
        } finally {
          He = c, G.p = n, B.T = i;
        }
      }
      dt = 1, op(), dp(), up();
    }
  }
  function op() {
    if (dt === 1) {
      dt = 0;
      var e = La, t = $l, a = (t.flags & 13878) !== 0;
      if ((t.subtreeFlags & 13878) !== 0 || a) {
        a = B.T, B.T = null;
        var i = G.p;
        G.p = 2;
        var n = He;
        He |= 4;
        try {
          Vu(t, e);
          var s = kr, c = Fo(e.containerInfo), o = s.focusedElem, x = s.selectionRange;
          if (c !== o && o && o.ownerDocument && Wo(o.ownerDocument.documentElement, o)) {
            if (x !== null && Ps(o)) {
              var A = x.start, q = x.end;
              if (q === void 0 && (q = A), "selectionStart" in o) o.selectionStart = A, o.selectionEnd = Math.min(q, o.value.length);
              else {
                var Y = o.ownerDocument || document, C = Y && Y.defaultView || window;
                if (C.getSelection) {
                  var U = C.getSelection(), de = o.textContent.length, ye = Math.min(x.start, de), Qe = x.end === void 0 ? ye : Math.min(x.end, de);
                  !U.extend && ye > Qe && (c = Qe, Qe = ye, ye = c);
                  var S = $o(o, ye), b = $o(o, Qe);
                  if (S && b && (U.rangeCount !== 1 || U.anchorNode !== S.node || U.anchorOffset !== S.offset || U.focusNode !== b.node || U.focusOffset !== b.offset)) {
                    var E = Y.createRange();
                    E.setStart(S.node, S.offset), U.removeAllRanges(), ye > Qe ? (U.addRange(E), U.extend(b.node, b.offset)) : (E.setEnd(b.node, b.offset), U.addRange(E));
                  }
                }
              }
            }
            for (Y = [], U = o; U = U.parentNode; ) U.nodeType === 1 && Y.push({
              element: U,
              left: U.scrollLeft,
              top: U.scrollTop
            });
            for (typeof o.focus == "function" && o.focus(), o = 0; o < Y.length; o++) {
              var L = Y[o];
              L.element.scrollLeft = L.left, L.element.scrollTop = L.top;
            }
          }
          gs = !!_r, kr = _r = null;
        } finally {
          He = n, G.p = i, B.T = a;
        }
      }
      e.current = t, dt = 2;
    }
  }
  function dp() {
    if (dt === 2) {
      dt = 0;
      var e = La, t = $l, a = (t.flags & 8772) !== 0;
      if ((t.subtreeFlags & 8772) !== 0 || a) {
        a = B.T, B.T = null;
        var i = G.p;
        G.p = 2;
        var n = He;
        He |= 4;
        try {
          Lu(e, t.alternate, t);
        } finally {
          He = n, G.p = i, B.T = a;
        }
      }
      dt = 3;
    }
  }
  function up() {
    if (dt === 4 || dt === 3) {
      dt = 0, Jt();
      var e = La, t = $l, a = ya, i = Wu;
      (t.subtreeFlags & 10256) !== 0 || (t.flags & 10256) !== 0 ? dt = 5 : (dt = 0, $l = La = null, pp(e, e.pendingLanes));
      var n = e.pendingLanes;
      if (n === 0 && (qa = null), Ds(a), t = t.stateNode, Ze && typeof Ze.onCommitFiberRoot == "function") try {
        Ze.onCommitFiberRoot(tt, t, void 0, (t.current.flags & 128) === 128);
      } catch {
      }
      if (i !== null) {
        t = B.T, n = G.p, G.p = 2, B.T = null;
        try {
          for (var s = e.onRecoverableError, c = 0; c < i.length; c++) {
            var o = i[c];
            s(o.value, { componentStack: o.stack });
          }
        } finally {
          B.T = t, G.p = n;
        }
      }
      (ya & 3) !== 0 && ns(), Sa(e), n = e.pendingLanes, (a & 261930) !== 0 && (n & 42) !== 0 ? e === hr ? Vi++ : (Vi = 0, hr = e) : Vi = 0, Xi(0, !1);
    }
  }
  function pp(e, t) {
    (e.pooledCacheLanes &= t) === 0 && (t = e.pooledCache, t != null && (e.pooledCache = null, Ni(t)));
  }
  function ns() {
    return op(), dp(), up(), fp();
  }
  function fp() {
    if (dt !== 5) return !1;
    var e = La, t = pr;
    pr = 0;
    var a = Ds(ya), i = B.T, n = G.p;
    try {
      G.p = 32 > a ? 32 : a, B.T = null, a = fr, fr = null;
      var s = La, c = ya;
      if (dt = 0, $l = La = null, ya = 0, (He & 6) !== 0) throw Error(d(331));
      var o = He;
      if (He |= 4, Ju(s.current), Qu(s, s.current, c, a), He = o, Xi(0, !1), Ze && typeof Ze.onPostCommitFiberRoot == "function") try {
        Ze.onPostCommitFiberRoot(tt, s);
      } catch {
      }
      return !0;
    } finally {
      G.p = n, B.T = i, pp(e, t);
    }
  }
  function hp(e, t, a) {
    t = Ht(a, t), t = Zc(e.stateNode, t, 2), e = ul(e, t, 2), e !== null && (un(e, 2), Sa(e));
  }
  function Ye(e, t, a) {
    if (e.tag === 3) hp(e, e, a);
    else for (; t !== null; ) {
      if (t.tag === 3) {
        hp(t, e, a);
        break;
      } else if (t.tag === 1) {
        var i = t.stateNode;
        if (typeof t.type.getDerivedStateFromError == "function" || typeof i.componentDidCatch == "function" && (qa === null || !qa.has(i))) {
          e = Ht(a, e), a = mu(2), i = ul(t, a, 2), i !== null && (xu(a, i, t, e), un(i, 2), Sa(i));
          break;
        }
      }
      t = t.return;
    }
  }
  function gr(e, t, a) {
    var i = e.pingCache;
    if (i === null) {
      i = e.pingCache = new Y0();
      var n = /* @__PURE__ */ new Set();
      i.set(t, n);
    } else n = i.get(t), n === void 0 && (n = /* @__PURE__ */ new Set(), i.set(t, n));
    n.has(a) || (or = !0, n.add(a), e = K0.bind(null, e, t, a), t.then(e, e));
  }
  function K0(e, t, a) {
    var i = e.pingCache;
    i !== null && i.delete(t), e.pingedLanes |= e.suspendedLanes & a, e.warmLanes &= ~a, Ke === e && (Ce & a) === a && (Pe === 4 || Pe === 3 && (Ce & 62914560) === Ce && 300 > et() - Pn ? (He & 2) === 0 && Wl(e, 0) : dr |= a, Il === Ce && (Il = 0)), Sa(e);
  }
  function mp(e, t) {
    t === 0 && (t = uo()), e = tl(e, t), e !== null && (un(e, t), Sa(e));
  }
  function J0(e) {
    var t = e.memoizedState, a = 0;
    t !== null && (a = t.retryLane), mp(e, a);
  }
  function I0(e, t) {
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
        throw Error(d(314));
    }
    i !== null && i.delete(t), mp(e, a);
  }
  function $0(e, t) {
    return O(e, t);
  }
  var ss = null, Pl = null, br = !1, cs = !1, vr = !1, Ba = 0;
  function Sa(e) {
    e !== Pl && e.next === null && (Pl === null ? ss = Pl = e : Pl = Pl.next = e), cs = !0, br || (br = !0, F0());
  }
  function Xi(e, t) {
    if (!vr && cs) {
      vr = !0;
      do
        for (var a = !1, i = ss; i !== null; ) {
          if (!t) if (e !== 0) {
            var n = i.pendingLanes;
            if (n === 0) var s = 0;
            else {
              var c = i.suspendedLanes, o = i.pingedLanes;
              s = (1 << 31 - ot(42 | e) + 1) - 1, s &= n & ~(c & ~o), s = s & 201326741 ? s & 201326741 | 1 : s ? s | 2 : 0;
            }
            s !== 0 && (a = !0, vp(i, s));
          } else s = Ce, s = dn(i, i === Ke ? s : 0, i.cancelPendingCommit !== null || i.timeoutHandle !== -1), (s & 3) === 0 || oi(i, s) || (a = !0, vp(i, s));
          i = i.next;
        }
      while (a);
      vr = !1;
    }
  }
  function W0() {
    xp();
  }
  function xp() {
    cs = br = !1;
    var e = 0;
    Ba !== 0 && sh() && (e = Ba);
    for (var t = et(), a = null, i = ss; i !== null; ) {
      var n = i.next, s = gp(i, t);
      s === 0 ? (i.next = null, a === null ? ss = n : a.next = n, n === null && (Pl = a)) : (a = i, (e !== 0 || (s & 3) !== 0) && (cs = !0)), i = n;
    }
    dt !== 0 && dt !== 5 || Xi(e, !1), Ba !== 0 && (Ba = 0);
  }
  function gp(e, t) {
    for (var a = e.suspendedLanes, i = e.pingedLanes, n = e.expirationTimes, s = e.pendingLanes & -62914561; 0 < s; ) {
      var c = 31 - ot(s), o = 1 << c, x = n[c];
      x === -1 ? ((o & a) === 0 || (o & i) !== 0) && (n[c] = Of(o, t)) : x <= t && (e.expiredLanes |= o), s &= ~o;
    }
    if (t = Ke, a = Ce, a = dn(e, e === t ? a : 0, e.cancelPendingCommit !== null || e.timeoutHandle !== -1), i = e.callbackNode, a === 0 || e === t && (Ge === 2 || Ge === 9) || e.cancelPendingCommit !== null) return i !== null && i !== null && we(i), e.callbackNode = null, e.callbackPriority = 0;
    if ((a & 3) === 0 || oi(e, a)) {
      if (t = a & -a, t === e.callbackPriority) return t;
      switch (i !== null && we(i), Ds(a)) {
        case 2:
        case 8:
          a = Ut;
          break;
        case 32:
          a = ea;
          break;
        case 268435456:
          a = p;
          break;
        default:
          a = ea;
      }
      return i = bp.bind(null, e), a = O(a, i), e.callbackPriority = t, e.callbackNode = a, t;
    }
    return i !== null && i !== null && we(i), e.callbackPriority = 2, e.callbackNode = null, 2;
  }
  function bp(e, t) {
    if (dt !== 0 && dt !== 5) return e.callbackNode = null, e.callbackPriority = 0, null;
    var a = e.callbackNode;
    if (ns() && e.callbackNode !== a) return null;
    var i = Ce;
    return i = dn(e, e === Ke ? i : 0, e.cancelPendingCommit !== null || e.timeoutHandle !== -1), i === 0 ? null : (Pu(e, i, t), gp(e, et()), e.callbackNode != null && e.callbackNode === a ? bp.bind(null, e) : null);
  }
  function vp(e, t) {
    if (ns()) return null;
    Pu(e, t, !0);
  }
  function F0() {
    rh(function() {
      (He & 6) !== 0 ? O(jl, W0) : xp();
    });
  }
  function jr() {
    if (Ba === 0) {
      var e = Ll;
      e === 0 && (e = cn, cn <<= 1, (cn & 261888) === 0 && (cn = 256)), Ba = e;
    }
    return Ba;
  }
  function jp(e) {
    return e == null || typeof e == "symbol" || typeof e == "boolean" ? null : typeof e == "function" ? e : mn("" + e);
  }
  function yp(e, t) {
    var a = t.ownerDocument.createElement("input");
    return a.name = t.name, a.value = t.value, e.id && a.setAttribute("form", e.id), t.parentNode.insertBefore(a, t), e = new FormData(e), a.parentNode.removeChild(a), e;
  }
  function P0(e, t, a, i, n) {
    if (t === "submit" && a && a.stateNode === n) {
      var s = jp((n[St] || null).action), c = i.submitter;
      c && (t = (t = c[St] || null) ? jp(t.formAction) : c.getAttribute("formAction"), t !== null && (s = t, c = null));
      var o = new vn("action", "action", null, i, n);
      e.push({
        event: o,
        listeners: [{
          instance: null,
          listener: function() {
            if (i.defaultPrevented) {
              if (Ba !== 0) {
                var x = c ? yp(n, c) : new FormData(n);
                Bc(a, {
                  pending: !0,
                  data: x,
                  method: n.method,
                  action: s
                }, null, x);
              }
            } else typeof s == "function" && (o.preventDefault(), x = c ? yp(n, c) : new FormData(n), Bc(a, {
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
  for (var yr = 0; yr < lc.length; yr++) {
    var Sr = lc[yr];
    It(Sr.toLowerCase(), "on" + (Sr[0].toUpperCase() + Sr.slice(1)));
  }
  It(td, "onAnimationEnd"), It(ad, "onAnimationIteration"), It(ld, "onAnimationStart"), It("dblclick", "onDoubleClick"), It("focusin", "onFocus"), It("focusout", "onBlur"), It(h0, "onTransitionRun"), It(m0, "onTransitionStart"), It(x0, "onTransitionCancel"), It(id, "onTransitionEnd"), Nl("onMouseEnter", ["mouseout", "mouseover"]), Nl("onMouseLeave", ["mouseout", "mouseover"]), Nl("onPointerEnter", ["pointerout", "pointerover"]), Nl("onPointerLeave", ["pointerout", "pointerover"]), Wa("onChange", "change click focusin focusout input keydown keyup selectionchange".split(" ")), Wa("onSelect", "focusout contextmenu dragend focusin keydown keyup mousedown mouseup selectionchange".split(" ")), Wa("onBeforeInput", [
    "compositionend",
    "keypress",
    "textInput",
    "paste"
  ]), Wa("onCompositionEnd", "compositionend focusout keydown keypress keyup mousedown".split(" ")), Wa("onCompositionStart", "compositionstart focusout keydown keypress keyup mousedown".split(" ")), Wa("onCompositionUpdate", "compositionupdate focusout keydown keypress keyup mousedown".split(" "));
  var Qi = "abort canplay canplaythrough durationchange emptied encrypted ended error loadeddata loadedmetadata loadstart pause play playing progress ratechange resize seeked seeking stalled suspend timeupdate volumechange waiting".split(" "), eh = new Set("beforetoggle cancel close invalid load scroll scrollend toggle".split(" ").concat(Qi));
  function Sp(e, t) {
    t = (t & 4) !== 0;
    for (var a = 0; a < e.length; a++) {
      var i = e[a], n = i.event;
      i = i.listeners;
      e: {
        var s = void 0;
        if (t) for (var c = i.length - 1; 0 <= c; c--) {
          var o = i[c], x = o.instance, A = o.currentTarget;
          if (o = o.listener, x !== s && n.isPropagationStopped()) break e;
          s = o, n.currentTarget = A;
          try {
            s(n);
          } catch (q) {
            Sn(q);
          }
          n.currentTarget = null, s = x;
        }
        else for (c = 0; c < i.length; c++) {
          if (o = i[c], x = o.instance, A = o.currentTarget, o = o.listener, x !== s && n.isPropagationStopped()) break e;
          s = o, n.currentTarget = A;
          try {
            s(n);
          } catch (q) {
            Sn(q);
          }
          n.currentTarget = null, s = x;
        }
      }
    }
  }
  function Te(e, t) {
    var a = t[Us];
    a === void 0 && (a = t[Us] = /* @__PURE__ */ new Set());
    var i = e + "__bubble";
    a.has(i) || (Np(t, e, 2, !1), a.add(i));
  }
  function zr(e, t, a) {
    var i = 0;
    t && (i |= 4), Np(a, e, i, t);
  }
  var rs = "_reactListening" + Math.random().toString(36).slice(2);
  function zp(e) {
    if (!e[rs]) {
      e[rs] = !0, vo.forEach(function(a) {
        a !== "selectionchange" && (eh.has(a) || zr(a, !1, e), zr(a, !0, e));
      });
      var t = e.nodeType === 9 ? e : e.ownerDocument;
      t === null || t[rs] || (t[rs] = !0, zr("selectionchange", !1, t));
    }
  }
  function Np(e, t, a, i) {
    switch (Wp(t)) {
      case 2:
        var n = Th;
        break;
      case 8:
        n = Ch;
        break;
      default:
        n = Lr;
    }
    a = n.bind(null, t, a, e), n = void 0, !Xs || t !== "touchstart" && t !== "touchmove" && t !== "wheel" || (n = !0), i ? n !== void 0 ? e.addEventListener(t, a, {
      capture: !0,
      passive: n
    }) : e.addEventListener(t, a, !0) : n !== void 0 ? e.addEventListener(t, a, { passive: n }) : e.addEventListener(t, a, !1);
  }
  function Nr(e, t, a, i, n) {
    var s = i;
    if ((t & 1) === 0 && (t & 2) === 0 && i !== null) e: for (; ; ) {
      if (i === null) return;
      var c = i.tag;
      if (c === 3 || c === 4) {
        var o = i.stateNode.containerInfo;
        if (o === n) break;
        if (c === 4) for (c = i.return; c !== null; ) {
          var x = c.tag;
          if ((x === 3 || x === 4) && c.stateNode.containerInfo === n) return;
          c = c.return;
        }
        for (; o !== null; ) {
          if (c = yl(o), c === null) return;
          if (x = c.tag, x === 5 || x === 6 || x === 26 || x === 27) {
            i = s = c;
            continue e;
          }
          o = o.parentNode;
        }
      }
      i = i.return;
    }
    Co(function() {
      var A = s, q = Ys(a), Y = [];
      e: {
        var C = nd.get(e);
        if (C !== void 0) {
          var U = vn, de = e;
          switch (e) {
            case "keypress":
              if (gn(a) === 0) break e;
            case "keydown":
            case "keyup":
              U = Wf;
              break;
            case "focusin":
              de = "focus", U = Js;
              break;
            case "focusout":
              de = "blur", U = Js;
              break;
            case "beforeblur":
            case "afterblur":
              U = Js;
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
              U = Do;
              break;
            case "drag":
            case "dragend":
            case "dragenter":
            case "dragexit":
            case "dragleave":
            case "dragover":
            case "dragstart":
            case "drop":
              U = Xf;
              break;
            case "touchcancel":
            case "touchend":
            case "touchmove":
            case "touchstart":
              U = Ff;
              break;
            case td:
            case ad:
            case ld:
              U = Qf;
              break;
            case id:
              U = Pf;
              break;
            case "scroll":
            case "scrollend":
              U = Vf;
              break;
            case "wheel":
              U = e0;
              break;
            case "copy":
            case "cut":
            case "paste":
              U = Zf;
              break;
            case "gotpointercapture":
            case "lostpointercapture":
            case "pointercancel":
            case "pointerdown":
            case "pointermove":
            case "pointerout":
            case "pointerover":
            case "pointerup":
              U = Ro;
              break;
            case "toggle":
            case "beforetoggle":
              U = t0;
          }
          var ye = (t & 4) !== 0, Qe = !ye && (e === "scroll" || e === "scrollend"), S = ye ? C !== null ? C + "Capture" : null : C;
          ye = [];
          for (var b = A, E; b !== null; ) {
            var L = b;
            if (E = L.stateNode, L = L.tag, L !== 5 && L !== 26 && L !== 27 || E === null || S === null || (L = fi(b, S), L != null && ye.push(Zi(b, L, E))), Qe) break;
            b = b.return;
          }
          0 < ye.length && (C = new U(C, de, null, a, q), Y.push({
            event: C,
            listeners: ye
          }));
        }
      }
      if ((t & 7) === 0) {
        e: {
          if (C = e === "mouseover" || e === "pointerover", U = e === "mouseout" || e === "pointerout", C && a !== Gs && (de = a.relatedTarget || a.fromElement) && (yl(de) || de[di])) break e;
          if ((U || C) && (C = q.window === q ? q : (C = q.ownerDocument) ? C.defaultView || C.parentWindow : window, U ? (de = a.relatedTarget || a.toElement, U = A, de = de ? yl(de) : null, de !== null && (Qe = v(de), ye = de.tag, de !== Qe || ye !== 5 && ye !== 27 && ye !== 6) && (de = null)) : (U = null, de = A), U !== de)) {
            if (ye = Do, L = "onMouseLeave", S = "onMouseEnter", b = "mouse", (e === "pointerout" || e === "pointerover") && (ye = Ro, L = "onPointerLeave", S = "onPointerEnter", b = "pointer"), Qe = U == null ? C : pi(U), E = de == null ? C : pi(de), C = new ye(L, b + "leave", U, a, q), C.target = Qe, C.relatedTarget = E, L = null, yl(q) === A && (ye = new ye(S, b + "enter", de, a, q), ye.target = E, ye.relatedTarget = Qe, L = ye), Qe = L, U && de) t: {
              for (ye = th, S = U, b = de, E = 0, L = S; L; L = ye(L)) E++;
              L = 0;
              for (var xe = b; xe; xe = ye(xe)) L++;
              for (; 0 < E - L; ) S = ye(S), E--;
              for (; 0 < L - E; ) b = ye(b), L--;
              for (; E--; ) {
                if (S === b || b !== null && S === b.alternate) {
                  ye = S;
                  break t;
                }
                S = ye(S), b = ye(b);
              }
              ye = null;
            }
            else ye = null;
            U !== null && wp(Y, C, U, ye, !1), de !== null && Qe !== null && wp(Y, Qe, de, ye, !0);
          }
        }
        e: {
          if (C = A ? pi(A) : window, U = C.nodeName && C.nodeName.toLowerCase(), U === "select" || U === "input" && C.type === "file") var qe = Xo;
          else if (Yo(C)) if (Qo) qe = u0;
          else {
            qe = o0;
            var ue = r0;
          }
          else U = C.nodeName, !U || U.toLowerCase() !== "input" || C.type !== "checkbox" && C.type !== "radio" ? A && Bs(A.elementType) && (qe = Xo) : qe = d0;
          if (qe && (qe = qe(e, A))) {
            Vo(Y, qe, a, q);
            break e;
          }
          ue && ue(e, C, A), e === "focusout" && A && C.type === "number" && A.memoizedProps.value != null && Hs(C, "number", C.value);
        }
        switch (ue = A ? pi(A) : window, e) {
          case "focusin":
            (Yo(ue) || ue.contentEditable === "true") && (Tl = ue, ec = A, yi = null);
            break;
          case "focusout":
            yi = ec = Tl = null;
            break;
          case "mousedown":
            tc = !0;
            break;
          case "contextmenu":
          case "mouseup":
          case "dragend":
            tc = !1, Po(Y, a, q);
            break;
          case "selectionchange":
            if (f0) break;
          case "keydown":
          case "keyup":
            Po(Y, a, q);
        }
        var ke;
        if ($s) e: {
          switch (e) {
            case "compositionstart":
              var Oe = "onCompositionStart";
              break e;
            case "compositionend":
              Oe = "onCompositionEnd";
              break e;
            case "compositionupdate":
              Oe = "onCompositionUpdate";
              break e;
          }
          Oe = void 0;
        }
        else Al ? Bo(e, a) && (Oe = "onCompositionEnd") : e === "keydown" && a.keyCode === 229 && (Oe = "onCompositionStart");
        Oe && (qo && a.locale !== "ko" && (Al || Oe !== "onCompositionStart" ? Oe === "onCompositionEnd" && Al && (ke = Oo()) : (_a = q, Qs = "value" in _a ? _a.value : _a.textContent, Al = !0)), ue = os(A, Oe), 0 < ue.length && (Oe = new Uo(Oe, e, null, a, q), Y.push({
          event: Oe,
          listeners: ue
        }), ke ? Oe.data = ke : (ke = Go(a), ke !== null && (Oe.data = ke)))), (ke = l0 ? i0(e, a) : n0(e, a)) && (Oe = os(A, "onBeforeInput"), 0 < Oe.length && (ue = new Uo("onBeforeInput", "beforeinput", null, a, q), Y.push({
          event: ue,
          listeners: Oe
        }), ue.data = ke)), P0(Y, e, A, a, q);
      }
      Sp(Y, t);
    });
  }
  function Zi(e, t, a) {
    return {
      instance: e,
      listener: t,
      currentTarget: a
    };
  }
  function os(e, t) {
    for (var a = t + "Capture", i = []; e !== null; ) {
      var n = e, s = n.stateNode;
      if (n = n.tag, n !== 5 && n !== 26 && n !== 27 || s === null || (n = fi(e, a), n != null && i.unshift(Zi(e, n, s)), n = fi(e, t), n != null && i.push(Zi(e, n, s))), e.tag === 3) return i;
      e = e.return;
    }
    return [];
  }
  function th(e) {
    if (e === null) return null;
    do
      e = e.return;
    while (e && e.tag !== 5 && e.tag !== 27);
    return e || null;
  }
  function wp(e, t, a, i, n) {
    for (var s = t._reactName, c = []; a !== null && a !== i; ) {
      var o = a, x = o.alternate, A = o.stateNode;
      if (o = o.tag, x !== null && x === i) break;
      o !== 5 && o !== 26 && o !== 27 || A === null || (x = A, n ? (A = fi(a, s), A != null && c.unshift(Zi(a, A, x))) : n || (A = fi(a, s), A != null && c.push(Zi(a, A, x)))), a = a.return;
    }
    c.length !== 0 && e.push({
      event: t,
      listeners: c
    });
  }
  var ah = /\r\n?/g, lh = /\u0000|\uFFFD/g;
  function _p(e) {
    return (typeof e == "string" ? e : "" + e).replace(ah, `
`).replace(lh, "");
  }
  function kp(e, t) {
    return t = _p(t), _p(e) === t;
  }
  function Xe(e, t, a, i, n, s) {
    switch (a) {
      case "children":
        typeof i == "string" ? t === "body" || t === "textarea" && i === "" || _l(e, i) : (typeof i == "number" || typeof i == "bigint") && t !== "body" && _l(e, "" + i);
        break;
      case "className":
        fn(e, "class", i);
        break;
      case "tabIndex":
        fn(e, "tabindex", i);
        break;
      case "dir":
      case "role":
      case "viewBox":
      case "width":
      case "height":
        fn(e, a, i);
        break;
      case "style":
        Ao(e, i, s);
        break;
      case "data":
        if (t !== "object") {
          fn(e, "data", i);
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
        i = mn("" + i), e.setAttribute(a, i);
        break;
      case "action":
      case "formAction":
        if (typeof i == "function") {
          e.setAttribute(a, "javascript:throw new Error('A React form was unexpectedly submitted. If you called form.submit() manually, consider using form.requestSubmit() instead. If you\\'re trying to use event.stopPropagation() in a submit event handler, consider also calling event.preventDefault().')");
          break;
        } else typeof s == "function" && (a === "formAction" ? (t !== "input" && Xe(e, t, "name", n.name, n, null), Xe(e, t, "formEncType", n.formEncType, n, null), Xe(e, t, "formMethod", n.formMethod, n, null), Xe(e, t, "formTarget", n.formTarget, n, null)) : (Xe(e, t, "encType", n.encType, n, null), Xe(e, t, "method", n.method, n, null), Xe(e, t, "target", n.target, n, null)));
        if (i == null || typeof i == "symbol" || typeof i == "boolean") {
          e.removeAttribute(a);
          break;
        }
        i = mn("" + i), e.setAttribute(a, i);
        break;
      case "onClick":
        i != null && (e.onclick = sa);
        break;
      case "onScroll":
        i != null && Te("scroll", e);
        break;
      case "onScrollEnd":
        i != null && Te("scrollend", e);
        break;
      case "dangerouslySetInnerHTML":
        if (i != null) {
          if (typeof i != "object" || !("__html" in i)) throw Error(d(61));
          if (a = i.__html, a != null) {
            if (n.children != null) throw Error(d(60));
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
        a = mn("" + i), e.setAttributeNS("http://www.w3.org/1999/xlink", "xlink:href", a);
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
        Te("beforetoggle", e), Te("toggle", e), pn(e, "popover", i);
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
        pn(e, "is", i);
        break;
      case "innerText":
      case "textContent":
        break;
      default:
        (!(2 < a.length) || a[0] !== "o" && a[0] !== "O" || a[1] !== "n" && a[1] !== "N") && (a = Gf.get(a) || a, pn(e, a, i));
    }
  }
  function wr(e, t, a, i, n, s) {
    switch (a) {
      case "style":
        Ao(e, i, s);
        break;
      case "dangerouslySetInnerHTML":
        if (i != null) {
          if (typeof i != "object" || !("__html" in i)) throw Error(d(61));
          if (a = i.__html, a != null) {
            if (n.children != null) throw Error(d(60));
            e.innerHTML = a;
          }
        }
        break;
      case "children":
        typeof i == "string" ? _l(e, i) : (typeof i == "number" || typeof i == "bigint") && _l(e, "" + i);
        break;
      case "onScroll":
        i != null && Te("scroll", e);
        break;
      case "onScrollEnd":
        i != null && Te("scrollend", e);
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
        if (!jo.hasOwnProperty(a)) e: {
          if (a[0] === "o" && a[1] === "n" && (n = a.endsWith("Capture"), t = a.slice(2, n ? a.length - 7 : void 0), s = e[St] || null, s = s != null ? s[a] : null, typeof s == "function" && e.removeEventListener(t, s, n), typeof i == "function")) {
            typeof s != "function" && s !== null && (a in e ? e[a] = null : e.hasAttribute(a) && e.removeAttribute(a)), e.addEventListener(t, i, n);
            break e;
          }
          a in e ? e[a] = i : i === !0 ? e.setAttribute(a, "") : pn(e, a, i);
        }
    }
  }
  function gt(e, t, a) {
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
        Te("error", e), Te("load", e);
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
              throw Error(d(137, t));
            default:
              Xe(e, t, s, c, a, null);
          }
        }
        n && Xe(e, t, "srcSet", a.srcSet, a, null), i && Xe(e, t, "src", a.src, a, null);
        return;
      case "input":
        Te("invalid", e);
        var o = s = c = n = null, x = null, A = null;
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
              A = q;
              break;
            case "value":
              s = q;
              break;
            case "defaultValue":
              o = q;
              break;
            case "children":
            case "dangerouslySetInnerHTML":
              if (q != null) throw Error(d(137, t));
              break;
            default:
              Xe(e, t, i, q, a, null);
          }
        }
        wo(e, s, o, x, A, c, n, !1);
        return;
      case "select":
        Te("invalid", e), i = c = s = null;
        for (n in a) if (a.hasOwnProperty(n) && (o = a[n], o != null)) switch (n) {
          case "value":
            s = o;
            break;
          case "defaultValue":
            c = o;
            break;
          case "multiple":
            i = o;
          default:
            Xe(e, t, n, o, a, null);
        }
        t = s, a = c, e.multiple = !!i, t != null ? wl(e, !!i, t, !1) : a != null && wl(e, !!i, a, !0);
        return;
      case "textarea":
        Te("invalid", e), s = n = i = null;
        for (c in a) if (a.hasOwnProperty(c) && (o = a[c], o != null)) switch (c) {
          case "value":
            i = o;
            break;
          case "defaultValue":
            n = o;
            break;
          case "children":
            s = o;
            break;
          case "dangerouslySetInnerHTML":
            if (o != null) throw Error(d(91));
            break;
          default:
            Xe(e, t, c, o, a, null);
        }
        ko(e, i, n, s);
        return;
      case "option":
        for (x in a) a.hasOwnProperty(x) && (i = a[x], i != null) && (x === "selected" ? e.selected = i && typeof i != "function" && typeof i != "symbol" : Xe(e, t, x, i, a, null));
        return;
      case "dialog":
        Te("beforetoggle", e), Te("toggle", e), Te("cancel", e), Te("close", e);
        break;
      case "iframe":
      case "object":
        Te("load", e);
        break;
      case "video":
      case "audio":
        for (i = 0; i < Qi.length; i++) Te(Qi[i], e);
        break;
      case "image":
        Te("error", e), Te("load", e);
        break;
      case "details":
        Te("toggle", e);
        break;
      case "embed":
      case "source":
      case "link":
        Te("error", e), Te("load", e);
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
        for (A in a) if (a.hasOwnProperty(A) && (i = a[A], i != null)) switch (A) {
          case "children":
          case "dangerouslySetInnerHTML":
            throw Error(d(137, t));
          default:
            Xe(e, t, A, i, a, null);
        }
        return;
      default:
        if (Bs(t)) {
          for (q in a) a.hasOwnProperty(q) && (i = a[q], i !== void 0 && wr(e, t, q, i, a, void 0));
          return;
        }
    }
    for (o in a) a.hasOwnProperty(o) && (i = a[o], i != null && Xe(e, t, o, i, a, null));
  }
  function ih(e, t, a, i) {
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
        var n = null, s = null, c = null, o = null, x = null, A = null, q = null;
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
              i.hasOwnProperty(U) || Xe(e, t, U, null, i, Y);
          }
        }
        for (var C in i) {
          var U = i[C];
          if (Y = a[C], i.hasOwnProperty(C) && (U != null || Y != null)) switch (C) {
            case "type":
              s = U;
              break;
            case "name":
              n = U;
              break;
            case "checked":
              A = U;
              break;
            case "defaultChecked":
              q = U;
              break;
            case "value":
              c = U;
              break;
            case "defaultValue":
              o = U;
              break;
            case "children":
            case "dangerouslySetInnerHTML":
              if (U != null) throw Error(d(137, t));
              break;
            default:
              U !== Y && Xe(e, t, C, U, i, Y);
          }
        }
        Ls(e, c, o, x, A, q, s, n);
        return;
      case "select":
        U = c = o = C = null;
        for (s in a) if (x = a[s], a.hasOwnProperty(s) && x != null) switch (s) {
          case "value":
            break;
          case "multiple":
            U = x;
          default:
            i.hasOwnProperty(s) || Xe(e, t, s, null, i, x);
        }
        for (n in i) if (s = i[n], x = a[n], i.hasOwnProperty(n) && (s != null || x != null)) switch (n) {
          case "value":
            C = s;
            break;
          case "defaultValue":
            o = s;
            break;
          case "multiple":
            c = s;
          default:
            s !== x && Xe(e, t, n, s, i, x);
        }
        t = o, a = c, i = U, C != null ? wl(e, !!a, C, !1) : !!i != !!a && (t != null ? wl(e, !!a, t, !0) : wl(e, !!a, a ? [] : "", !1));
        return;
      case "textarea":
        U = C = null;
        for (o in a) if (n = a[o], a.hasOwnProperty(o) && n != null && !i.hasOwnProperty(o)) switch (o) {
          case "value":
            break;
          case "children":
            break;
          default:
            Xe(e, t, o, null, i, n);
        }
        for (c in i) if (n = i[c], s = a[c], i.hasOwnProperty(c) && (n != null || s != null)) switch (c) {
          case "value":
            C = n;
            break;
          case "defaultValue":
            U = n;
            break;
          case "children":
            break;
          case "dangerouslySetInnerHTML":
            if (n != null) throw Error(d(91));
            break;
          default:
            n !== s && Xe(e, t, c, n, i, s);
        }
        _o(e, C, U);
        return;
      case "option":
        for (var de in a) C = a[de], a.hasOwnProperty(de) && C != null && !i.hasOwnProperty(de) && (de === "selected" ? e.selected = !1 : Xe(e, t, de, null, i, C));
        for (x in i) C = i[x], U = a[x], i.hasOwnProperty(x) && C !== U && (C != null || U != null) && (x === "selected" ? e.selected = C && typeof C != "function" && typeof C != "symbol" : Xe(e, t, x, C, i, U));
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
        for (var ye in a) C = a[ye], a.hasOwnProperty(ye) && C != null && !i.hasOwnProperty(ye) && Xe(e, t, ye, null, i, C);
        for (A in i) if (C = i[A], U = a[A], i.hasOwnProperty(A) && C !== U && (C != null || U != null)) switch (A) {
          case "children":
          case "dangerouslySetInnerHTML":
            if (C != null) throw Error(d(137, t));
            break;
          default:
            Xe(e, t, A, C, i, U);
        }
        return;
      default:
        if (Bs(t)) {
          for (var Qe in a) C = a[Qe], a.hasOwnProperty(Qe) && C !== void 0 && !i.hasOwnProperty(Qe) && wr(e, t, Qe, void 0, i, C);
          for (q in i) C = i[q], U = a[q], !i.hasOwnProperty(q) || C === U || C === void 0 && U === void 0 || wr(e, t, q, C, i, U);
          return;
        }
    }
    for (var S in a) C = a[S], a.hasOwnProperty(S) && C != null && !i.hasOwnProperty(S) && Xe(e, t, S, null, i, C);
    for (Y in i) C = i[Y], U = a[Y], !i.hasOwnProperty(Y) || C === U || C == null && U == null || Xe(e, t, Y, C, i, U);
  }
  function Ep(e) {
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
  function nh() {
    if (typeof performance.getEntriesByType == "function") {
      for (var e = 0, t = 0, a = performance.getEntriesByType("resource"), i = 0; i < a.length; i++) {
        var n = a[i], s = n.transferSize, c = n.initiatorType, o = n.duration;
        if (s && o && Ep(c)) {
          for (c = 0, o = n.responseEnd, i += 1; i < a.length; i++) {
            var x = a[i], A = x.startTime;
            if (A > o) break;
            var q = x.transferSize, Y = x.initiatorType;
            q && Ep(Y) && (x = x.responseEnd, c += q * (x < o ? 1 : (o - A) / (x - A)));
          }
          if (--i, t += 8 * (s + c) / (n.duration / 1e3), e++, 10 < e) break;
        }
      }
      if (0 < e) return t / e / 1e6;
    }
    return navigator.connection && (e = navigator.connection.downlink, typeof e == "number") ? e : 5;
  }
  var _r = null, kr = null;
  function ds(e) {
    return e.nodeType === 9 ? e : e.ownerDocument;
  }
  function Ap(e) {
    switch (e) {
      case "http://www.w3.org/2000/svg":
        return 1;
      case "http://www.w3.org/1998/Math/MathML":
        return 2;
      default:
        return 0;
    }
  }
  function Tp(e, t) {
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
  function Er(e, t) {
    return e === "textarea" || e === "noscript" || typeof t.children == "string" || typeof t.children == "number" || typeof t.children == "bigint" || typeof t.dangerouslySetInnerHTML == "object" && t.dangerouslySetInnerHTML !== null && t.dangerouslySetInnerHTML.__html != null;
  }
  var Ar = null;
  function sh() {
    var e = window.event;
    return e && e.type === "popstate" ? e === Ar ? !1 : (Ar = e, !0) : (Ar = null, !1);
  }
  var Cp = typeof setTimeout == "function" ? setTimeout : void 0, ch = typeof clearTimeout == "function" ? clearTimeout : void 0, Op = typeof Promise == "function" ? Promise : void 0, rh = typeof queueMicrotask == "function" ? queueMicrotask : typeof Op < "u" ? function(e) {
    return Op.resolve(null).then(e).catch(oh);
  } : Cp;
  function oh(e) {
    setTimeout(function() {
      throw e;
    });
  }
  function Ga(e) {
    return e === "head";
  }
  function Mp(e, t) {
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
      else if (a === "html") Ki(e.ownerDocument.documentElement);
      else if (a === "head") {
        a = e.ownerDocument.head, Ki(a);
        for (var s = a.firstChild; s; ) {
          var c = s.nextSibling, o = s.nodeName;
          s[ui] || o === "SCRIPT" || o === "STYLE" || o === "LINK" && s.rel.toLowerCase() === "stylesheet" || a.removeChild(s), s = c;
        }
      } else a === "body" && Ki(e.ownerDocument.body);
      a = n;
    } while (a);
    li(t);
  }
  function Dp(e, t) {
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
  function Tr(e) {
    var t = e.firstChild;
    for (t && t.nodeType === 10 && (t = t.nextSibling); t; ) {
      var a = t;
      switch (t = t.nextSibling, a.nodeName) {
        case "HTML":
        case "HEAD":
        case "BODY":
          Tr(a), Rs(a);
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
  function dh(e, t, a, i) {
    for (; e.nodeType === 1; ) {
      var n = a;
      if (e.nodeName.toLowerCase() !== t.toLowerCase()) {
        if (!i && (e.nodeName !== "INPUT" || e.type !== "hidden")) break;
      } else if (i) {
        if (!e[ui]) switch (t) {
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
  function uh(e, t, a) {
    if (t === "") return null;
    for (; e.nodeType !== 3; )
      if ((e.nodeType !== 1 || e.nodeName !== "INPUT" || e.type !== "hidden") && !a || (e = Qt(e.nextSibling), e === null)) return null;
    return e;
  }
  function Up(e, t) {
    for (; e.nodeType !== 8; )
      if ((e.nodeType !== 1 || e.nodeName !== "INPUT" || e.type !== "hidden") && !t || (e = Qt(e.nextSibling), e === null)) return null;
    return e;
  }
  function Cr(e) {
    return e.data === "$?" || e.data === "$~";
  }
  function Or(e) {
    return e.data === "$!" || e.data === "$?" && e.ownerDocument.readyState !== "loading";
  }
  function ph(e, t) {
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
  var Mr = null;
  function Rp(e) {
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
  function qp(e) {
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
  function Lp(e, t, a) {
    switch (t = ds(a), e) {
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
  function Ki(e) {
    for (var t = e.attributes; t.length; ) e.removeAttributeNode(t[0]);
    Rs(e);
  }
  var Zt = /* @__PURE__ */ new Map(), Hp = /* @__PURE__ */ new Set();
  function us(e) {
    return typeof e.getRootNode == "function" ? e.getRootNode() : e.nodeType === 9 ? e : e.ownerDocument;
  }
  var za = G.d;
  G.d = {
    f: fh,
    r: hh,
    D: mh,
    C: xh,
    L: gh,
    m: bh,
    X: jh,
    S: vh,
    M: yh
  };
  function fh() {
    var e = za.f(), t = as();
    return e || t;
  }
  function hh(e) {
    var t = Sl(e);
    t !== null && t.tag === 5 && t.type === "form" ? iu(t) : za.r(e);
  }
  var ei = typeof document > "u" ? null : document;
  function Bp(e, t, a) {
    var i = ei;
    if (i && typeof t == "string" && t) {
      var n = qt(t);
      n = 'link[rel="' + e + '"][href="' + n + '"]', typeof a == "string" && (n += '[crossorigin="' + a + '"]'), Hp.has(n) || (Hp.add(n), e = {
        rel: e,
        crossOrigin: a,
        href: t
      }, i.querySelector(n) === null && (t = i.createElement("link"), gt(t, "link", e), ut(t), i.head.appendChild(t)));
    }
  }
  function mh(e) {
    za.D(e), Bp("dns-prefetch", e, null);
  }
  function xh(e, t) {
    za.C(e, t), Bp("preconnect", e, t);
  }
  function gh(e, t, a) {
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
      Zt.has(s) || (e = R({
        rel: "preload",
        href: t === "image" && a && a.imageSrcSet ? void 0 : e,
        as: t
      }, a), Zt.set(s, e), i.querySelector(n) !== null || t === "style" && i.querySelector(Ji(s)) || t === "script" && i.querySelector(Ii(s)) || (t = i.createElement("link"), gt(t, "link", e), ut(t), i.head.appendChild(t)));
    }
  }
  function bh(e, t) {
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
      if (!Zt.has(s) && (e = R({
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
            if (a.querySelector(Ii(s))) return;
        }
        i = a.createElement("link"), gt(i, "link", e), ut(i), a.head.appendChild(i);
      }
    }
  }
  function vh(e, t, a) {
    za.S(e, t, a);
    var i = ei;
    if (i && e) {
      var n = zl(i).hoistableStyles, s = ti(e);
      t = t || "default";
      var c = n.get(s);
      if (!c) {
        var o = {
          loading: 0,
          preload: null
        };
        if (c = i.querySelector(Ji(s))) o.loading = 5;
        else {
          e = R({
            rel: "stylesheet",
            href: e,
            "data-precedence": t
          }, a), (a = Zt.get(s)) && Dr(e, a);
          var x = c = i.createElement("link");
          ut(x), gt(x, "link", e), x._p = new Promise(function(A, q) {
            x.onload = A, x.onerror = q;
          }), x.addEventListener("load", function() {
            o.loading |= 1;
          }), x.addEventListener("error", function() {
            o.loading |= 2;
          }), o.loading |= 4, ps(c, t, i);
        }
        c = {
          type: "stylesheet",
          instance: c,
          count: 1,
          state: o
        }, n.set(s, c);
      }
    }
  }
  function jh(e, t) {
    za.X(e, t);
    var a = ei;
    if (a && e) {
      var i = zl(a).hoistableScripts, n = ai(e), s = i.get(n);
      s || (s = a.querySelector(Ii(n)), s || (e = R({
        src: e,
        async: !0
      }, t), (t = Zt.get(n)) && Ur(e, t), s = a.createElement("script"), ut(s), gt(s, "link", e), a.head.appendChild(s)), s = {
        type: "script",
        instance: s,
        count: 1,
        state: null
      }, i.set(n, s));
    }
  }
  function yh(e, t) {
    za.M(e, t);
    var a = ei;
    if (a && e) {
      var i = zl(a).hoistableScripts, n = ai(e), s = i.get(n);
      s || (s = a.querySelector(Ii(n)), s || (e = R({
        src: e,
        async: !0,
        type: "module"
      }, t), (t = Zt.get(n)) && Ur(e, t), s = a.createElement("script"), ut(s), gt(s, "link", e), a.head.appendChild(s)), s = {
        type: "script",
        instance: s,
        count: 1,
        state: null
      }, i.set(n, s));
    }
  }
  function Gp(e, t, a, i) {
    var n = (n = Se.current) ? us(n) : null;
    if (!n) throw Error(d(446));
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
          }, s.set(e, c), (s = n.querySelector(Ji(e))) && !s._p && (c.instance = s, c.state.loading = 5), Zt.has(e) || (a = {
            rel: "preload",
            as: "style",
            href: a.href,
            crossOrigin: a.crossOrigin,
            integrity: a.integrity,
            media: a.media,
            hrefLang: a.hrefLang,
            referrerPolicy: a.referrerPolicy
          }, Zt.set(e, a), s || Sh(n, e, a, c.state))), t && i === null) throw Error(d(528, ""));
          return c;
        }
        if (t && i !== null) throw Error(d(529, ""));
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
        throw Error(d(444, e));
    }
  }
  function ti(e) {
    return 'href="' + qt(e) + '"';
  }
  function Ji(e) {
    return 'link[rel="stylesheet"][' + e + "]";
  }
  function Yp(e) {
    return R({}, e, {
      "data-precedence": e.precedence,
      precedence: null
    });
  }
  function Sh(e, t, a, i) {
    e.querySelector('link[rel="preload"][as="style"][' + t + "]") ? i.loading = 1 : (t = e.createElement("link"), i.preload = t, t.addEventListener("load", function() {
      return i.loading |= 1;
    }), t.addEventListener("error", function() {
      return i.loading |= 2;
    }), gt(t, "link", a), ut(t), e.head.appendChild(t));
  }
  function ai(e) {
    return '[src="' + qt(e) + '"]';
  }
  function Ii(e) {
    return "script[async]" + e;
  }
  function Vp(e, t, a) {
    if (t.count++, t.instance === null) switch (t.type) {
      case "style":
        var i = e.querySelector('style[data-href~="' + qt(a.href) + '"]');
        if (i) return t.instance = i, ut(i), i;
        var n = R({}, a, {
          "data-href": a.href,
          "data-precedence": a.precedence,
          href: null,
          precedence: null
        });
        return i = (e.ownerDocument || e).createElement("style"), ut(i), gt(i, "style", n), ps(i, a.precedence, e), t.instance = i;
      case "stylesheet":
        n = ti(a.href);
        var s = e.querySelector(Ji(n));
        if (s) return t.state.loading |= 4, t.instance = s, ut(s), s;
        i = Yp(a), (n = Zt.get(n)) && Dr(i, n), s = (e.ownerDocument || e).createElement("link"), ut(s);
        var c = s;
        return c._p = new Promise(function(o, x) {
          c.onload = o, c.onerror = x;
        }), gt(s, "link", i), t.state.loading |= 4, ps(s, a.precedence, e), t.instance = s;
      case "script":
        return s = ai(a.src), (n = e.querySelector(Ii(s))) ? (t.instance = n, ut(n), n) : (i = a, (n = Zt.get(s)) && (i = R({}, a), Ur(i, n)), e = e.ownerDocument || e, n = e.createElement("script"), ut(n), gt(n, "link", i), e.head.appendChild(n), t.instance = n);
      case "void":
        return null;
      default:
        throw Error(d(443, t.type));
    }
    else t.type === "stylesheet" && (t.state.loading & 4) === 0 && (i = t.instance, t.state.loading |= 4, ps(i, a.precedence, e));
    return t.instance;
  }
  function ps(e, t, a) {
    for (var i = a.querySelectorAll('link[rel="stylesheet"][data-precedence],style[data-precedence]'), n = i.length ? i[i.length - 1] : null, s = n, c = 0; c < i.length; c++) {
      var o = i[c];
      if (o.dataset.precedence === t) s = o;
      else if (s !== n) break;
    }
    s ? s.parentNode.insertBefore(e, s.nextSibling) : (t = a.nodeType === 9 ? a.head : a, t.insertBefore(e, t.firstChild));
  }
  function Dr(e, t) {
    e.crossOrigin ??= t.crossOrigin, e.referrerPolicy ??= t.referrerPolicy, e.title ??= t.title;
  }
  function Ur(e, t) {
    e.crossOrigin ??= t.crossOrigin, e.referrerPolicy ??= t.referrerPolicy, e.integrity ??= t.integrity;
  }
  var fs = null;
  function Xp(e, t, a) {
    if (fs === null) {
      var i = /* @__PURE__ */ new Map(), n = fs = /* @__PURE__ */ new Map();
      n.set(a, i);
    } else n = fs, i = n.get(a), i || (i = /* @__PURE__ */ new Map(), n.set(a, i));
    if (i.has(e)) return i;
    for (i.set(e, null), a = a.getElementsByTagName(e), n = 0; n < a.length; n++) {
      var s = a[n];
      if (!(s[ui] || s[ft] || e === "link" && s.getAttribute("rel") === "stylesheet") && s.namespaceURI !== "http://www.w3.org/2000/svg") {
        var c = s.getAttribute(t) || "";
        c = e + c;
        var o = i.get(c);
        o ? o.push(s) : i.set(c, [s]);
      }
    }
    return i;
  }
  function Qp(e, t, a) {
    e = e.ownerDocument || e, e.head.insertBefore(a, t === "title" ? e.querySelector("head > title") : null);
  }
  function zh(e, t, a) {
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
  function Zp(e) {
    return !(e.type === "stylesheet" && (e.state.loading & 3) === 0);
  }
  function Nh(e, t, a, i) {
    if (a.type === "stylesheet" && (typeof i.media != "string" || matchMedia(i.media).matches !== !1) && (a.state.loading & 4) === 0) {
      if (a.instance === null) {
        var n = ti(i.href), s = t.querySelector(Ji(n));
        if (s) {
          t = s._p, t !== null && typeof t == "object" && typeof t.then == "function" && (e.count++, e = hs.bind(e), t.then(e, e)), a.state.loading |= 4, a.instance = s, ut(s);
          return;
        }
        s = t.ownerDocument || t, i = Yp(i), (n = Zt.get(n)) && Dr(i, n), s = s.createElement("link"), ut(s);
        var c = s;
        c._p = new Promise(function(o, x) {
          c.onload = o, c.onerror = x;
        }), gt(s, "link", i), a.instance = s;
      }
      e.stylesheets === null && (e.stylesheets = /* @__PURE__ */ new Map()), e.stylesheets.set(a, t), (t = a.state.preload) && (a.state.loading & 3) === 0 && (e.count++, a = hs.bind(e), t.addEventListener("load", a), t.addEventListener("error", a));
    }
  }
  var Rr = 0;
  function wh(e, t) {
    return e.stylesheets && e.count === 0 && xs(e, e.stylesheets), 0 < e.count || 0 < e.imgCount ? function(a) {
      var i = setTimeout(function() {
        if (e.stylesheets && xs(e, e.stylesheets), e.unsuspend) {
          var s = e.unsuspend;
          e.unsuspend = null, s();
        }
      }, 6e4 + t);
      0 < e.imgBytes && Rr === 0 && (Rr = 62500 * nh());
      var n = setTimeout(function() {
        if (e.waitingForImages = !1, e.count === 0 && (e.stylesheets && xs(e, e.stylesheets), e.unsuspend)) {
          var s = e.unsuspend;
          e.unsuspend = null, s();
        }
      }, (e.imgBytes > Rr ? 50 : 800) + t);
      return e.unsuspend = a, function() {
        e.unsuspend = null, clearTimeout(i), clearTimeout(n);
      };
    } : null;
  }
  function hs() {
    if (this.count--, this.count === 0 && (this.imgCount === 0 || !this.waitingForImages)) {
      if (this.stylesheets) xs(this, this.stylesheets);
      else if (this.unsuspend) {
        var e = this.unsuspend;
        this.unsuspend = null, e();
      }
    }
  }
  var ms = null;
  function xs(e, t) {
    e.stylesheets = null, e.unsuspend !== null && (e.count++, ms = /* @__PURE__ */ new Map(), t.forEach(_h, e), ms = null, hs.call(e));
  }
  function _h(e, t) {
    if (!(t.state.loading & 4)) {
      var a = ms.get(e);
      if (a) var i = a.get(null);
      else {
        a = /* @__PURE__ */ new Map(), ms.set(e, a);
        for (var n = e.querySelectorAll("link[data-precedence],style[data-precedence]"), s = 0; s < n.length; s++) {
          var c = n[s];
          (c.nodeName === "LINK" || c.getAttribute("media") !== "not all") && (a.set(c.dataset.precedence, c), i = c);
        }
        i && a.set(null, i);
      }
      n = t.instance, c = n.getAttribute("data-precedence"), s = a.get(c) || i, s === i && a.set(null, n), a.set(c, n), this.count++, i = hs.bind(this), n.addEventListener("load", i), n.addEventListener("error", i), s ? s.parentNode.insertBefore(n, s.nextSibling) : (e = e.nodeType === 9 ? e.head : e, e.insertBefore(n, e.firstChild)), t.state.loading |= 4;
    }
  }
  var $i = {
    $$typeof: H,
    Provider: null,
    Consumer: null,
    _currentValue: fe,
    _currentValue2: fe,
    _threadCount: 0
  };
  function kh(e, t, a, i, n, s, c, o, x) {
    this.tag = 1, this.containerInfo = e, this.pingCache = this.current = this.pendingChildren = null, this.timeoutHandle = -1, this.callbackNode = this.next = this.pendingContext = this.context = this.cancelPendingCommit = null, this.callbackPriority = 0, this.expirationTimes = Ms(-1), this.entangledLanes = this.shellSuspendCounter = this.errorRecoveryDisabledLanes = this.expiredLanes = this.warmLanes = this.pingedLanes = this.suspendedLanes = this.pendingLanes = 0, this.entanglements = Ms(0), this.hiddenUpdates = Ms(null), this.identifierPrefix = i, this.onUncaughtError = n, this.onCaughtError = s, this.onRecoverableError = c, this.pooledCache = null, this.pooledCacheLanes = 0, this.formState = x, this.incompleteTransitions = /* @__PURE__ */ new Map();
  }
  function Eh(e, t, a, i, n, s, c, o, x, A, q, Y) {
    return e = new kh(e, t, a, c, x, A, q, Y, o), t = 1, s === !0 && (t |= 24), s = Tt(3, null, null, t), e.current = s, s.stateNode = e, t = xc(), t.refCount++, e.pooledCache = t, t.refCount++, s.memoizedState = {
      element: i,
      isDehydrated: a,
      cache: t
    }, jc(s), e;
  }
  function Ah(e) {
    return e ? (e = Ml, e) : Ml;
  }
  function Kp(e, t, a, i, n, s) {
    n = Ah(n), i.context === null ? i.context = n : i.pendingContext = n, i = dl(t), i.payload = { element: a }, s = s === void 0 ? null : s, s !== null && (i.callback = s), a = ul(e, i, t), a !== null && (Et(a, e, t), Ei(a, e, t));
  }
  function Jp(e, t) {
    if (e = e.memoizedState, e !== null && e.dehydrated !== null) {
      var a = e.retryLane;
      e.retryLane = a !== 0 && a < t ? a : t;
    }
  }
  function qr(e, t) {
    Jp(e, t), (e = e.alternate) && Jp(e, t);
  }
  function Ip(e) {
    if (e.tag === 13 || e.tag === 31) {
      var t = tl(e, 67108864);
      t !== null && Et(t, e, 67108864), qr(e, 67108864);
    }
  }
  function $p(e) {
    if (e.tag === 13 || e.tag === 31) {
      var t = Xt();
      t = mo(t);
      var a = tl(e, t);
      a !== null && Et(a, e, t), qr(e, t);
    }
  }
  var gs = !0;
  function Th(e, t, a, i) {
    var n = B.T;
    B.T = null;
    var s = G.p;
    try {
      G.p = 2, Lr(e, t, a, i);
    } finally {
      G.p = s, B.T = n;
    }
  }
  function Ch(e, t, a, i) {
    var n = B.T;
    B.T = null;
    var s = G.p;
    try {
      G.p = 8, Lr(e, t, a, i);
    } finally {
      G.p = s, B.T = n;
    }
  }
  function Lr(e, t, a, i) {
    if (gs) {
      var n = Hr(i);
      if (n === null) Nr(e, t, i, bs, a), Fp(e, i);
      else if (Mh(n, e, t, a, i)) i.stopPropagation();
      else if (Fp(e, i), t & 4 && -1 < Oh.indexOf(e)) {
        for (; n !== null; ) {
          var s = Sl(n);
          if (s !== null) switch (s.tag) {
            case 3:
              if (s = s.stateNode, s.current.memoizedState.isDehydrated) {
                var c = $a(s.pendingLanes);
                if (c !== 0) {
                  var o = s;
                  for (o.pendingLanes |= 2, o.entangledLanes |= 2; c; ) {
                    var x = 1 << 31 - ot(c);
                    o.entanglements[1] |= x, c &= ~x;
                  }
                  Sa(s), (He & 6) === 0 && (es = et() + 500, Xi(0, !1));
                }
              }
              break;
            case 31:
            case 13:
              o = tl(s, 2), o !== null && Et(o, s, 2), as(), qr(s, 2);
          }
          if (s = Hr(i), s === null && Nr(e, t, i, bs, a), s === n) break;
          n = s;
        }
        n !== null && i.stopPropagation();
      } else Nr(e, t, i, null, a);
    }
  }
  function Hr(e) {
    return e = Ys(e), Br(e);
  }
  var bs = null;
  function Br(e) {
    if (bs = null, e = yl(e), e !== null) {
      var t = v(e);
      if (t === null) e = null;
      else {
        var a = t.tag;
        if (a === 13) {
          if (e = M(t), e !== null) return e;
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
    return bs = e, null;
  }
  function Wp(e) {
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
          case p:
            return 268435456;
          default:
            return 32;
        }
      default:
        return 32;
    }
  }
  var Gr = !1, Ya = null, Va = null, Xa = null, Wi = /* @__PURE__ */ new Map(), Fi = /* @__PURE__ */ new Map(), Qa = [], Oh = "mousedown mouseup touchcancel touchend touchstart auxclick dblclick pointercancel pointerdown pointerup dragend dragstart drop compositionend compositionstart keydown keypress keyup input textInput copy cut paste click change contextmenu reset".split(" ");
  function Fp(e, t) {
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
        Wi.delete(t.pointerId);
        break;
      case "gotpointercapture":
      case "lostpointercapture":
        Fi.delete(t.pointerId);
    }
  }
  function Pi(e, t, a, i, n, s) {
    return e === null || e.nativeEvent !== s ? (e = {
      blockedOn: t,
      domEventName: a,
      eventSystemFlags: i,
      nativeEvent: s,
      targetContainers: [n]
    }, t !== null && (t = Sl(t), t !== null && Ip(t)), e) : (e.eventSystemFlags |= i, t = e.targetContainers, n !== null && t.indexOf(n) === -1 && t.push(n), e);
  }
  function Mh(e, t, a, i, n) {
    switch (t) {
      case "focusin":
        return Ya = Pi(Ya, e, t, a, i, n), !0;
      case "dragenter":
        return Va = Pi(Va, e, t, a, i, n), !0;
      case "mouseover":
        return Xa = Pi(Xa, e, t, a, i, n), !0;
      case "pointerover":
        var s = n.pointerId;
        return Wi.set(s, Pi(Wi.get(s) || null, e, t, a, i, n)), !0;
      case "gotpointercapture":
        return s = n.pointerId, Fi.set(s, Pi(Fi.get(s) || null, e, t, a, i, n)), !0;
    }
    return !1;
  }
  function Pp(e) {
    var t = yl(e.target);
    if (t !== null) {
      var a = v(t);
      if (a !== null) {
        if (t = a.tag, t === 13) {
          if (t = M(a), t !== null) {
            e.blockedOn = t, go(e.priority, function() {
              $p(a);
            });
            return;
          }
        } else if (t === 31) {
          if (t = w(a), t !== null) {
            e.blockedOn = t, go(e.priority, function() {
              $p(a);
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
  function vs(e) {
    if (e.blockedOn !== null) return !1;
    for (var t = e.targetContainers; 0 < t.length; ) {
      var a = Hr(e.nativeEvent);
      if (a === null) {
        a = e.nativeEvent;
        var i = new a.constructor(a.type, a);
        Gs = i, a.target.dispatchEvent(i), Gs = null;
      } else return t = Sl(a), t !== null && Ip(t), e.blockedOn = a, !1;
      t.shift();
    }
    return !0;
  }
  function ef(e, t, a) {
    vs(e) && a.delete(t);
  }
  function Dh() {
    Gr = !1, Ya !== null && vs(Ya) && (Ya = null), Va !== null && vs(Va) && (Va = null), Xa !== null && vs(Xa) && (Xa = null), Wi.forEach(ef), Fi.forEach(ef);
  }
  function js(e, t) {
    e.blockedOn === t && (e.blockedOn = null, Gr || (Gr = !0, m.unstable_scheduleCallback(m.unstable_NormalPriority, Dh)));
  }
  var ys = null;
  function tf(e) {
    ys !== e && (ys = e, m.unstable_scheduleCallback(m.unstable_NormalPriority, function() {
      ys === e && (ys = null);
      for (var t = 0; t < e.length; t += 3) {
        var a = e[t], i = e[t + 1], n = e[t + 2];
        if (typeof i != "function") {
          if (Br(i || a) === null) continue;
          break;
        }
        var s = Sl(a);
        s !== null && (e.splice(t, 3), t -= 3, Bc(s, {
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
      return js(x, e);
    }
    Ya !== null && js(Ya, e), Va !== null && js(Va, e), Xa !== null && js(Xa, e), Wi.forEach(t), Fi.forEach(t);
    for (var a = 0; a < Qa.length; a++) {
      var i = Qa[a];
      i.blockedOn === e && (i.blockedOn = null);
    }
    for (; 0 < Qa.length && (a = Qa[0], a.blockedOn === null); ) Pp(a), a.blockedOn === null && Qa.shift();
    if (a = (e.ownerDocument || e).$$reactFormReplay, a != null) for (i = 0; i < a.length; i += 3) {
      var n = a[i], s = a[i + 1], c = n[St] || null;
      if (typeof s == "function") c || tf(a);
      else if (c) {
        var o = null;
        if (s && s.hasAttribute("formAction")) {
          if (n = s, c = s[St] || null) o = c.formAction;
          else if (Br(n) !== null) continue;
        } else o = c.action;
        typeof o == "function" ? a[i + 1] = o : (a.splice(i, 3), i -= 3), tf(a);
      }
    }
  }
  function Uh() {
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
  function Yr(e) {
    this._internalRoot = e;
  }
  Vr.prototype.render = Yr.prototype.render = function(e) {
    var t = this._internalRoot;
    if (t === null) throw Error(d(409));
    var a = t.current;
    Kp(a, Xt(), e, t, null, null);
  }, Vr.prototype.unmount = Yr.prototype.unmount = function() {
    var e = this._internalRoot;
    if (e !== null) {
      this._internalRoot = null;
      var t = e.containerInfo;
      Kp(e.current, 2, null, e, null, null), as(), t[di] = null;
    }
  };
  function Vr(e) {
    this._internalRoot = e;
  }
  Vr.prototype.unstable_scheduleHydration = function(e) {
    if (e) {
      var t = xo();
      e = {
        blockedOn: null,
        target: e,
        priority: t
      };
      for (var a = 0; a < Qa.length && t !== 0 && t < Qa[a].priority; a++) ;
      Qa.splice(a, 0, e), a === 0 && Pp(e);
    }
  };
  var af = _.version;
  if (af !== "19.2.6") throw Error(d(527, af, "19.2.6"));
  G.findDOMNode = function(e) {
    var t = e._reactInternals;
    if (t === void 0)
      throw typeof e.render == "function" ? Error(d(188)) : (e = Object.keys(e).join(","), Error(d(268, e)));
    return e = z(t), e = e !== null ? V(e) : null, e = e === null ? null : e.stateNode, e;
  };
  var Rh = {
    bundleType: 0,
    version: "19.2.6",
    rendererPackageName: "react-dom",
    currentDispatcherRef: B,
    reconcilerVersion: "19.2.6"
  };
  if (typeof __REACT_DEVTOOLS_GLOBAL_HOOK__ < "u") {
    var Ss = __REACT_DEVTOOLS_GLOBAL_HOOK__;
    if (!Ss.isDisabled && Ss.supportsFiber) try {
      tt = Ss.inject(Rh), Ze = Ss;
    } catch {
    }
  }
  r.createRoot = function(e, t) {
    if (!T(e)) throw Error(d(299));
    var a = !1, i = "", n = C0, s = O0, c = M0;
    return t != null && (t.unstable_strictMode === !0 && (a = !0), t.identifierPrefix !== void 0 && (i = t.identifierPrefix), t.onUncaughtError !== void 0 && (n = t.onUncaughtError), t.onCaughtError !== void 0 && (s = t.onCaughtError), t.onRecoverableError !== void 0 && (c = t.onRecoverableError)), t = Eh(e, 1, !1, null, null, a, i, null, n, s, c, Uh), e[di] = t.current, zp(e), new Yr(t);
  };
})), Xh = /* @__PURE__ */ ia(((r, m) => {
  function _() {
    if (!(typeof __REACT_DEVTOOLS_GLOBAL_HOOK__ > "u" || typeof __REACT_DEVTOOLS_GLOBAL_HOOK__.checkDCE != "function"))
      try {
        __REACT_DEVTOOLS_GLOBAL_HOOK__.checkDCE(_);
      } catch (u) {
        console.error(u);
      }
  }
  _(), m.exports = Vh();
})), Sf = (...r) => r.filter((m, _, u) => !!m && m.trim() !== "" && u.indexOf(m) === _).join(" ").trim(), Qh = (r) => r.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase(), Zh = (r) => r.replace(/^([A-Z])|[\s-_]+(\w)/g, (m, _, u) => u ? u.toUpperCase() : _.toLowerCase()), lf = (r) => {
  const m = Zh(r);
  return m.charAt(0).toUpperCase() + m.slice(1);
}, Xr = {
  xmlns: "http://www.w3.org/2000/svg",
  width: 24,
  height: 24,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round",
  strokeLinejoin: "round"
}, Kh = (r) => {
  for (const m in r) if (m.startsWith("aria-") || m === "role" || m === "title") return !0;
  return !1;
}, N = ro(), Jh = (0, N.createContext)({}), Ih = () => (0, N.useContext)(Jh), $h = (0, N.forwardRef)(({ color: r, size: m, strokeWidth: _, absoluteStrokeWidth: u, className: d = "", children: T, iconNode: v, ...M }, w) => {
  const { size: k = 24, strokeWidth: z = 2, absoluteStrokeWidth: V = !1, color: R = "currentColor", className: re = "" } = Ih() ?? {}, pe = u ?? V ? Number(_ ?? z) * 24 / Number(m ?? k) : _ ?? z;
  return (0, N.createElement)("svg", {
    ref: w,
    ...Xr,
    width: m ?? k ?? Xr.width,
    height: m ?? k ?? Xr.height,
    stroke: r ?? R,
    strokeWidth: pe,
    className: Sf("lucide", re, d),
    ...!T && !Kh(M) && { "aria-hidden": "true" },
    ...M
  }, [...v.map(([J, W]) => (0, N.createElement)(J, W)), ...Array.isArray(T) ? T : [T]]);
}), De = (r, m) => {
  const _ = (0, N.forwardRef)(({ className: u, ...d }, T) => (0, N.createElement)($h, {
    ref: T,
    iconNode: m,
    className: Sf(`lucide-${Qh(lf(r))}`, `lucide-${r}`, u),
    ...d
  }));
  return _.displayName = lf(r), _;
}, Wh = [
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
], zf = De("archive", Wh), Fh = [["path", {
  d: "m12 19-7-7 7-7",
  key: "1l729n"
}], ["path", {
  d: "M19 12H5",
  key: "x3x0zl"
}]], nf = De("arrow-left", Fh), Ph = [["path", {
  d: "M5 12h14",
  key: "1ays0h"
}], ["path", {
  d: "m12 5 7 7-7 7",
  key: "xquz4c"
}]], ni = De("arrow-right", Ph), em = [["path", {
  d: "M7 7h10v10",
  key: "1tivn9"
}], ["path", {
  d: "M7 17 17 7",
  key: "1vkiza"
}]], tm = De("arrow-up-right", em), am = [["path", {
  d: "M12 5v16",
  key: "1f6ucr"
}], ["path", {
  d: "M20.001 19A2 2 0 0022 17V5a2 2 0 00-1.999-2L16 3.002A5 5 0 0012 5a5 5 0 00-4-2H4a2 2 0 00-2 2v12a2 2 0 001.999 2H8a5 5 0 014 2 5 5 0 014-2z",
  key: "1fyvmf"
}]], lm = De("book-open", am), im = [
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
], io = De("box", im), nm = [["path", {
  d: "M20 6 9 17l-5-5",
  key: "1gmf2c"
}]], zs = De("check", nm), sm = [["path", {
  d: "m9 18 6-6-6-6",
  key: "mthhwq"
}]], sf = De("chevron-right", sm), cm = [
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
], si = De("circle-alert", cm), rm = [
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
], ci = De("clapperboard", rm), om = [
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
], dm = De("clipboard-list", om), um = [["circle", {
  cx: "12",
  cy: "12",
  r: "10",
  key: "1mglay"
}], ["path", {
  d: "M12 6v6h4",
  key: "135r8i"
}]], Nf = De("clock-3", um), pm = [
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
], fm = De("code-xml", pm), hm = [["rect", {
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
}]], wf = De("copy", hm), mm = [
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
], Es = De("download", mm), xm = [
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
], gm = De("external-link", xm), bm = [
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
], bl = De("file-check-corner", bm), vm = [
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
], Qr = De("film", vm), jm = [["path", {
  d: "m6 14 1.5-2.9A2 2 0 0 1 9.24 10H20a2 2 0 0 1 1.94 2.5l-1.54 6a2 2 0 0 1-1.95 1.5H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h3.9a2 2 0 0 1 1.69.9l.81 1.2a2 2 0 0 0 1.67.9H18a2 2 0 0 1 2 2v2",
  key: "usdka0"
}]], Zr = De("folder-open", jm), ym = [
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
], en = De("git-branch", ym), Sm = [
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
], cf = De("image-plus", Sm), zm = [
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
], Nm = De("layers", zm), wm = [
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
], rf = De("layout-grid", wm), _m = [
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
], As = De("link-2", _m), km = [
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
], Em = De("list-checks", km), Am = [["path", {
  d: "M21 12a9 9 0 1 1-6.219-8.56",
  key: "13zald"
}]], Kr = De("loader-circle", Am), Tm = [
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
], no = De("lock-keyhole", Tm), Cm = [["path", {
  d: "M22 17a2 2 0 0 1-2 2H6.828a2 2 0 0 0-1.414.586l-2.202 2.202A.71.71 0 0 1 2 21.286V5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2z",
  key: "18887p"
}]], Jr = De("message-square", Cm), Om = [["path", {
  d: "M5 12h14",
  key: "1ays0h"
}], ["path", {
  d: "M12 5v14",
  key: "s699le"
}]], Pt = De("plus", Om), Mm = [
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
], Ts = De("refresh-cw", Mm), Dm = [["path", {
  d: "M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8",
  key: "1357e3"
}], ["path", {
  d: "M3 3v5h5",
  key: "1xhq8a"
}]], Um = De("rotate-ccw", Dm), Rm = [["path", {
  d: "m21 21-4.34-4.34",
  key: "14j7rj"
}], ["circle", {
  cx: "11",
  cy: "11",
  r: "8",
  key: "4ej97u"
}]], _f = De("search", Rm), qm = [["path", {
  d: "M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z",
  key: "oel41y"
}], ["path", {
  d: "m9 12 2 2 4-4",
  key: "dzmm74"
}]], gl = De("shield-check", qm), Lm = [["path", {
  d: "M18 6 6 18",
  key: "1bl5f8"
}], ["path", {
  d: "m6 6 12 12",
  key: "d8bk6v"
}]], nn = De("x", Lm), Hm = Xh(), Na = [
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
], Bm = class extends Error {
  status;
  constructor(r, m = 400) {
    super(r), this.status = m;
  }
}, of = (r, m = 400) => {
  throw new Bm(r, m);
};
function Cs(r) {
  return r.modelFlow ?? {
    models: [],
    issues: [],
    packs: [],
    pins: [],
    history: []
  };
}
function Gm(r, m, _) {
  const u = Cs(r).models.find((T) => T.id === m || T.key === m);
  u || of("找不到模型");
  const d = u.versions.find((T) => T.id === _);
  return d || of("找不到指定模型版本"), {
    m: u,
    v: d
  };
}
function Ym(r, m, _, u) {
  const { v: d } = Gm(r, m, _), T = d.stages[u], v = Na.findIndex((w) => w.id === u), M = [];
  return v > 0 && !d.stages[Na[v - 1].id].author && M.push("先核定 " + Na[v - 1].title), T.checks.every(Boolean) || M.push("完成本階段全部檢查"), T.evidence || M.push("填入實際產出或檢查報告位置"), (!T.summary || !T.nextStep) && M.push("填寫已做內容與接手下一步"), u === "M01" && (!d.sourceLocation || !d.sourceVersion || !d.backupLocation || !d.sha256) && M.push("補齊原檔版本、獨立備份與 SHA-256"), u === "M02" && !d.reference && M.push("補入設定及尺度來源"), v >= 3 && !d.candidateLocation && M.push("登記獨立候選 GLB"), Cs(r).issues.some((w) => w.modelId === m && w.versionId === _ && w.status === "open" && (w.stageId === u || v >= 6 || w.kind === "major" && v >= 3)) && M.push("處理適用的待修或待裁定問題"), M;
}
var Vm = [
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
], Xm = [
  "唯一音軌",
  "音樂分析",
  "段落與節點",
  "鏡頭安排",
  "影格與動畫",
  "對音樂試剪",
  "支線驗收",
  "插入全片"
], Qm = [
  ["已指定唯一使用音軌與版本；換音軌需重核切點"],
  ["已實際分析音樂、歌詞與節奏"],
  ["段落與重要音樂節點已標記"],
  ["鏡頭與音樂、主題、劇透範圍相符"],
  ["人物與主線一致，影格及動畫已驗收"],
  ["已按指定音軌核對切點與實際長度"],
  ["無不必要重複鏡頭，劇透範圍及情緒合適"],
  ["通過支線已插入剪輯專案，入點與出點可查"]
], Kt = [...Vm.map((r) => ({
  ...r,
  group: "main"
})), ...["op", "ed"].flatMap((r) => Xm.map((m, _) => ({
  id: r + String(_ + 1).padStart(2, "0"),
  title: m,
  group: r,
  phase: r.toUpperCase() + " 支線",
  description: r === "op" ? "OP 以作品印象、人物關係及主題為主。" : "ED 以情緒收束及畫面變化為主。",
  output: m === "唯一音軌" ? "由作者在有效資料中指定音軌、版本與長度" : m,
  checks: Qm[_],
  deps: _ ? [r + String(_).padStart(2, "0")] : ["03"]
})))], Zm = [
  "script",
  "character",
  "scene",
  "voice",
  "op_audio",
  "ed_audio",
  "edit"
];
function ri(r) {
  return [...new Map(r.map((m) => [m.key, m])).values()];
}
function Ka(r) {
  return ri(r.filter((m) => m.status === "adopted" || m.status === "withdrawn")).filter((m) => m.status === "adopted");
}
function Km(r) {
  return {
    projectId: r.id,
    workId: r.workId,
    episode: r.episode,
    revision: r.revision,
    workflowSchema: r.workflowSchema ?? 1,
    genericChecks: Os(r).map(({ id: m, title: _, checks: u }) => ({
      id: m,
      title: _,
      checks: u
    })),
    rules: ri(r.episodeRules ?? []),
    adoptedRules: Ka(r.episodeRules ?? []),
    baselines: ri(r.baselines ?? []),
    adoptedBaselines: Ka(r.baselines ?? []),
    legacy: r.workflowLegacy ?? null,
    rule: "通用流程不含單集劇情條件。本集規則與採用清單各自保存版本，候選不取代已採用版，另一集須另行指定；檔案位置未驗看。"
  };
}
function Jm(r) {
  return {
    id: r.id,
    title: r.title,
    revision: r.revision,
    updatedAt: r.updatedAt,
    sharedCount: new Set(r.sharedAssets.map((m) => m.key)).size
  };
}
var kf = class extends Error {
  status;
  constructor(r, m = 400) {
    super(r), this.status = m;
  }
};
function Os(r) {
  return Kt.filter((m) => m.group === "main" || r.branches[m.group]);
}
function _s(r, m) {
  const _ = Kt.find((u) => u.id === m);
  if (!_) throw new kf("找不到階段");
  return _.deps.filter((u) => Os(r).some((d) => d.id === u) && !r.stages[u].author).map((u) => `${u} ${Kt.find((d) => d.id === u)?.title}`);
}
function Ef(r, m) {
  const _ = r.stages[m], u = _s(r, m).map((T) => "先完成 " + T), d = Kt.find((T) => T.id === m).checks.length;
  return (_.checks.length < d || !_.checks.slice(0, d).every(Boolean)) && u.push("勾選全部驗收項目"), _.evidence.trim() || u.push("填入產出連結或檔案位置"), r.issues.some((T) => T.status === "open" && T.stageId === m) && u.push("處理此階段未結問題"), vl(r).problems.some((T) => T.status === "open" && (T.scope.type === "project" || T.scope.type === "stage" && T.scope.target === m || m === "12")) && u.push("處理適用範圍內的資訊矛盾或缺件"), m === "12" && (r.issues.some((T) => T.status === "open") && u.push("結清全部退修問題"), r.shots.some((T) => T.status !== "in_timeline") && u.push("總表中所有鏡頭須通過並入片"), r.shots.length || u.push("建立實際採用鏡頭與入片紀錄")), u;
}
function so(r) {
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
    approved: m.filter((_) => r.stages[_.id].author).length,
    total: m.length,
    openIssues: r.issues.filter((_) => _.status === "open").length,
    shots: r.shots.length,
    inTimeline: r.shots.filter((_) => _.status === "in_timeline").length,
    lastMcpAt: r.lastMcpAt,
    next: m.filter((_) => !r.stages[_.id].author && !_s(r, _.id).length).map((_) => ({
      id: _.id,
      title: _.title,
      reasons: Ef(r, _.id)
    }))
  };
}
function oo(r) {
  const m = vl(r), _ = [...new Map((r.production?.links ?? []).map((d) => [d.shotId, d])).values()], u = [...new Map((r.production?.selections ?? []).map((d) => [d.shotId, d])).values()];
  return {
    project: so(r),
    settings: {
      rules: Ka(r.episodeRules ?? []).length,
      adopted: Ka(r.baselines ?? []).map(({ key: d, title: T, category: v, version: M, recordVersion: w, externalVersion: k }) => ({
        key: d,
        title: T,
        category: v,
        version: M,
        recordVersion: w,
        externalVersion: k
      })),
      pending: ri(r.baselines ?? []).filter((d) => d.status === "unresolved" || d.status === "reference").map(({ key: d, title: T, status: v, note: M }) => ({
        key: d,
        title: T,
        status: v,
        note: M
      }))
    },
    registration: {
      sources: m.records.length,
      acceptedSources: m.records.filter(ln).length,
      shots: r.shots.length,
      linkedShots: _.length,
      locatedFrames: _.filter((d) => d.references.length).length,
      registeredSelections: (/* @__PURE__ */ new Set([...u.map((d) => d.shotId), ..._.filter((d) => d.adoptedOutput).map((d) => d.shotId)])).size,
      timelineRegistrations: u.filter((d) => d.editorVersion && d.inPoint && d.outPoint).length
    },
    outgoing: r.production?.handoffs?.at(-1) ?? null,
    openProblems: m.problems.filter((d) => d.status === "open"),
    lastWork: m.results.at(-1) ?? null,
    rule: "作者告知的製作完成、資料補登與素材實際檢視分開記錄。未登記的素材不推定未製作；接續整理保留來源，未對上成片的情節不得自動套用下一集。"
  };
}
var tn = {
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
}, Im = [
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
function ln(r) {
  return r.approval?.verdict === "source_accepted" || r.status === "effective";
}
function Ir(r, m) {
  return (r.production?.sections.find((_) => _.stageId === m)?.gaps ?? []).map((_, u) => {
    const d = [...r.production?.supplements ?? []].reverse().find((T) => T.stageId === m && T.gapIndex === u && T.gap === _);
    return {
      index: u,
      description: _,
      status: d ? "filled" : "open",
      record: d ? vl(r).records.find((T) => T.id === d.recordId) ?? null : null
    };
  });
}
function $m(r, m) {
  if (r.workId && (!m || m.id !== r.workId) || m && m.id !== r.workId) throw new kf("集數與作品不相符", 400);
  const _ = oo(r), u = m ? Cs(m) : null, d = (u?.models ?? []).map((v) => {
    const M = v.versions.at(-1), w = [...u?.history ?? []].reverse().find((V) => V.modelId === v.id && V.versionId === M.id && V.action === "save_model_stage"), k = Na.find((V) => !M.stages[V.id].author) ?? Na[7], z = v.versions.find((V) => V.id === v.adoptedVersionId);
    return {
      modelId: v.id,
      key: v.key,
      title: v.title,
      versionId: M.id,
      label: M.label,
      adopted: z ? {
        versionId: z.id,
        label: z.label
      } : null,
      sourceLocation: M.sourceLocation,
      candidateLocation: M.candidateLocation,
      stageId: k.id,
      stageTitle: k.title,
      approved: Na.filter((V) => M.stages[V.id].author).length,
      lastWork: w ? {
        at: w.at,
        stageId: w.stageId,
        summary: M.stages[w.stageId].summary,
        evidence: M.stages[w.stageId].evidence,
        nextStep: M.stages[w.stageId].nextStep
      } : null,
      openIssues: u.issues.filter((V) => V.modelId === v.id && V.versionId === M.id && V.status === "open"),
      nextStep: w ? M.stages[w.stageId].nextStep : "尚無工作回報；先讀取模型來源與指定版本，再取得任務資料包。"
    };
  }), T = [...new Map((u?.pins ?? []).filter((v) => v.episodeId === r.id).map((v) => [[v.modelId, v.sceneIds].join("|"), v])).values()].map((v) => {
    const M = u.models.find((k) => k.id === v.modelId), w = M?.versions.find((k) => k.id === v.versionId);
    return {
      ...v,
      title: M?.title ?? v.modelId,
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
    episode: _,
    models: d,
    pins: T,
    issues: {
      animation: r.issues.filter((v) => v.status === "open"),
      context: _.openProblems,
      models: u?.issues.filter((v) => v.status === "open") ?? []
    },
    lastToolWrite: [r.lastMcpAt, ...(u?.history ?? []).filter((v) => v.actor === "ai").map((v) => v.at)].filter((v) => !!v).sort().at(-1) ?? null,
    policy: "此總覽唯讀，不是工作資料包。動畫與模型共用作品入口，各自保留精確版本與資料包。模型清單顯示最新登記候選，採用版及本集引用另列，禁止自動替換。作者告知完成不等於逐項素材驗看；未登記不推定未製作。執行前取得對應範圍的新資料包，實際讀取來源後才回報；不得代替作者核定。"
  };
}
var Wm = /* @__PURE__ */ ia(((r) => {
  var m = /* @__PURE__ */ Symbol.for("react.transitional.element"), _ = /* @__PURE__ */ Symbol.for("react.fragment");
  function u(d, T, v) {
    var M = null;
    if (v !== void 0 && (M = "" + v), T.key !== void 0 && (M = "" + T.key), "key" in T) {
      v = {};
      for (var w in T) w !== "key" && (v[w] = T[w]);
    } else v = T;
    return T = v.ref, {
      $$typeof: m,
      type: d,
      key: M,
      ref: T !== void 0 ? T : null,
      props: v
    };
  }
  r.Fragment = _, r.jsx = u, r.jsxs = u;
})), Fm = /* @__PURE__ */ ia(((r, m) => {
  m.exports = Wm();
})), l = Fm(), df = (r) => r ? new Date(r).toLocaleString("zh-TW", { timeZone: "Asia/Taipei" }) : "尚無紀錄";
function Pm(r, m) {
  const _ = URL.createObjectURL(new Blob([m], { type: "text/plain;charset=utf-8" })), u = document.createElement("a");
  u.href = _, u.download = r, u.click(), setTimeout(() => URL.revokeObjectURL(_), 1e3);
}
function ex({ project: r, work: m, busy: _, onNavigate: u, onModel: d }) {
  const T = $m(r, m), [v, M] = (0, N.useState)(""), [w, k] = (0, N.useState)(""), [z, V] = (0, N.useState)("animation"), R = T.models.find((H) => H.versionId === z), re = T.episode.lastWork, pe = T.issues.animation.length + T.issues.context.length + T.issues.models.length, J = `請使用「立之雲端庫｜動畫製作流程」工具，接手 ${T.title}／${r.episode}。先呼叫 read_animation_workspace({projectId:${JSON.stringify(r.id)}})，重新讀取伺服器最新資料，不使用本段文字中的舊 revision。
${R ? `本次範圍為模型 ${R.key}（modelId=${R.modelId}），精確版本 ${R.label}（versionId=${R.versionId}），定位階段 ${R.stageId}。workId=${m.id}。用 read_animation_models 查此版本的全部來源、問題及最近回報，確認實際任務範圍後，用 acquire_animation_model_context 取得新資料包；完成後用 update_animation_model_stage 回報。最新候選不等於已採用版。` : `本次範圍為 ${r.episode} 動畫。先讀 read_animation_episode_brief 與 read_animation_episode_settings，再依最近交接確認任務。用 preview_animation_context 檢查指定範圍，acquire_animation_context 保存資料包，以 submit_animation_work 回報。作者已告知完成的集數以資料補登為主，不因紀錄空白重做。`}
實際讀取所需素材後才執行，缺件、矛盾或過期資料包先回報受阻。寫回已做內容、產出位置與版本、未解問題及下一步。保留原檔、作者採用版本與各集固定引用，不能自行正式核定。若目前對話沒有上述工具，明確告知尚未接通，不宣稱已讀取或已回寫。`, [W, le] = (0, N.useState)(!1), X = T.episode.project.completionReport?.status === "completed", oe = [
    ...T.issues.context.map((H) => ({
      id: H.id,
      text: H.description,
      tab: "context"
    })),
    ...T.issues.animation.map((H) => ({
      id: H.id,
      text: H.reason,
      tab: "issues"
    })),
    ...T.issues.models.map((H) => ({
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
          /* @__PURE__ */ (0, l.jsx)("h2", { children: X ? "本集已完成，繼續整理製作紀錄" : re ? "接著完成上次的工作" : "從本集製作資料開始" }),
          /* @__PURE__ */ (0, l.jsx)("p", { children: re?.nextStep || (X ? "補上採用檔案與製作過程，讓下一集和下一位 AI 都能接著用。" : "先整理劇本、角色與場景參考，再開始製作。") }),
          /* @__PURE__ */ (0, l.jsxs)("div", {
            className: "context-actions",
            children: [/* @__PURE__ */ (0, l.jsxs)("button", {
              className: "btn primary",
              disabled: _,
              onClick: () => u("context"),
              children: [
                X ? "繼續整理資料" : "開啟製作資料",
                " ",
                /* @__PURE__ */ (0, l.jsx)(ni, { size: 16 })
              ]
            }), /* @__PURE__ */ (0, l.jsx)("button", {
              className: "btn",
              onClick: () => le(!W),
              "aria-expanded": W,
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
            /* @__PURE__ */ (0, l.jsx)("strong", { children: X ? "已完成" : T.episode.project.completionReport?.status === "in_progress" ? "製作中" : "尚未登記" }),
            /* @__PURE__ */ (0, l.jsx)("small", { children: "依作者登記" })
          ] }),
          /* @__PURE__ */ (0, l.jsxs)("div", { children: [
            /* @__PURE__ */ (0, l.jsx)("span", { children: "未處理問題" }),
            /* @__PURE__ */ (0, l.jsxs)("strong", { children: [pe, /* @__PURE__ */ (0, l.jsx)("em", { children: " 項" })] }),
            /* @__PURE__ */ (0, l.jsx)("small", { children: "動畫、資料與模型合計" })
          ] }),
          /* @__PURE__ */ (0, l.jsxs)("button", {
            onClick: () => u("models"),
            children: [
              /* @__PURE__ */ (0, l.jsx)("span", { children: "共用模型" }),
              /* @__PURE__ */ (0, l.jsxs)("strong", { children: [T.models.length, /* @__PURE__ */ (0, l.jsx)("em", { children: " 個" })] }),
              /* @__PURE__ */ (0, l.jsx)("small", { children: "依已登記模型" })
            ]
          })
        ]
      }),
      W && /* @__PURE__ */ (0, l.jsxs)("article", {
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
              value: z,
              onChange: (H) => V(H.target.value),
              children: [/* @__PURE__ */ (0, l.jsxs)("option", {
                value: "animation",
                children: [r.episode, " 動畫與資料整理"]
              }), T.models.map((H) => /* @__PURE__ */ (0, l.jsxs)("option", {
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
                  await navigator.clipboard.writeText(J), M("已複製，請貼到已連接工作台的 ChatGPT 對話。");
                } catch {
                  M("無法直接複製，請展開完整指令後手動複製。");
                }
              },
              children: [/* @__PURE__ */ (0, l.jsx)(wf, { size: 15 }), "複製接手指令"]
            }), /* @__PURE__ */ (0, l.jsx)("button", {
              className: "btn",
              onClick: () => u("chatgpt"),
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
              value: J
            }),
            /* @__PURE__ */ (0, l.jsxs)("button", {
              className: "btn",
              onClick: () => Pm(r.episode + "_AI接續指令.txt", J),
              children: [/* @__PURE__ */ (0, l.jsx)(Es, { size: 15 }), "下載指令"]
            })
          ] }),
          /* @__PURE__ */ (0, l.jsxs)("small", { children: [
            "複製指令不會自動啟動 AI。最近寫入：",
            df(T.lastToolWrite),
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
                onClick: () => u("main"),
                children: [
                  /* @__PURE__ */ (0, l.jsx)(bl, { size: 22 }),
                  /* @__PURE__ */ (0, l.jsxs)("span", { children: [/* @__PURE__ */ (0, l.jsx)("b", { children: "動畫製作" }), /* @__PURE__ */ (0, l.jsx)("small", { children: "主線、片頭片尾與鏡頭素材" })] }),
                  /* @__PURE__ */ (0, l.jsx)(ni, { size: 17 })
                ]
              }),
              /* @__PURE__ */ (0, l.jsxs)("button", {
                onClick: () => u("models"),
                children: [
                  /* @__PURE__ */ (0, l.jsx)(io, { size: 22 }),
                  /* @__PURE__ */ (0, l.jsxs)("span", { children: [/* @__PURE__ */ (0, l.jsx)("b", { children: "3D 模型" }), /* @__PURE__ */ (0, l.jsx)("small", { children: "模型版本、檢查與採用紀錄" })] }),
                  /* @__PURE__ */ (0, l.jsx)(ni, { size: 17 })
                ]
              }),
              /* @__PURE__ */ (0, l.jsxs)("button", {
                onClick: () => u("project"),
                children: [
                  /* @__PURE__ */ (0, l.jsx)(Nf, { size: 22 }),
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
              children: [pe, " 項"]
            })]
          }), oe.length ? /* @__PURE__ */ (0, l.jsxs)("div", {
            className: "attention-list",
            children: [oe.slice(0, 3).map((H) => /* @__PURE__ */ (0, l.jsxs)("button", {
              onClick: () => u(H.tab),
              children: [
                /* @__PURE__ */ (0, l.jsx)(si, { size: 17 }),
                /* @__PURE__ */ (0, l.jsx)("span", { children: H.text }),
                /* @__PURE__ */ (0, l.jsx)(ni, { size: 15 })
              ]
            }, H.id)), oe.length > 3 && /* @__PURE__ */ (0, l.jsxs)("details", { children: [/* @__PURE__ */ (0, l.jsxs)("summary", { children: [
              "其餘 ",
              oe.length - 3,
              " 項問題"
            ] }), oe.slice(3).map((H) => /* @__PURE__ */ (0, l.jsx)("button", {
              onClick: () => u(H.tab),
              children: H.text
            }, H.id))] })]
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
          re ? /* @__PURE__ */ (0, l.jsxs)(l.Fragment, { children: [
            /* @__PURE__ */ (0, l.jsx)("h3", { children: re.task }),
            /* @__PURE__ */ (0, l.jsx)("p", { children: re.summary }),
            re.needsReview && /* @__PURE__ */ (0, l.jsx)("p", {
              className: "resume-warning",
              children: "採用依據有更新，接手前請重新讀取。"
            }),
            /* @__PURE__ */ (0, l.jsx)("small", { children: df(re.at) })
          ] }) : /* @__PURE__ */ (0, l.jsx)("p", { children: "尚無 AI 工作回報；這不代表沒有製作成果。" }),
          T.models.map((H) => /* @__PURE__ */ (0, l.jsxs)("div", {
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
              disabled: _,
              onClick: () => d({
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
              T.pins.length,
              "）"
            ] }),
            T.pins.map((H, F) => /* @__PURE__ */ (0, l.jsxs)("p", { children: [
              H.title,
              " · ",
              H.label,
              " · ",
              H.purpose
            ] }, F)),
            /* @__PURE__ */ (0, l.jsx)("button", {
              className: "btn",
              onClick: () => u("settings"),
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
function tx({ project: r, check: m }) {
  const [_, u] = (0, N.useState)(!1), [d, T] = (0, N.useState)(""), [v, M] = (0, N.useState)(""), w = `請使用「立之雲端庫｜動畫製作流程」外掛，先呼叫 read_animation_workspace，projectId 為 ${r.id}，確認 ${r.episode} 的目前進度、採用版本、未解問題與下一步。請重新讀取最新資料，不從聊天推定完成。若本集已由作者告知完成，先做資料補登。確認範圍後取得新的工作資料包，實際讀取參考素材，最後回報已做內容、成果位置、未完成項及下一步。若本對話沒有工具，請明確告知未連接。`;
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
              await navigator.clipboard.writeText(w), M("已複製，請貼到選用工作台的對話。");
            } catch {
              M("請展開完整指令後手動複製。");
            }
          },
          children: [/* @__PURE__ */ (0, l.jsx)(wf, { size: 16 }), "複製本集接手指令"]
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
        /* @__PURE__ */ (0, l.jsxs)("h2", { children: [/* @__PURE__ */ (0, l.jsx)(As, { size: 20 }), " 連線與最近更新"] }),
        /* @__PURE__ */ (0, l.jsx)("p", { children: "網頁連線與對話工具是兩個檢查項目；這個按鈕會檢查網頁能否讀取共用資料。" }),
        /* @__PURE__ */ (0, l.jsxs)("button", {
          className: "btn",
          disabled: _,
          onClick: async () => {
            u(!0), T("");
            try {
              await m(), T("共用資料讀取成功。對話是否已選用外掛，仍需由 ChatGPT 實際呼叫工具確認。");
            } catch (k) {
              T("讀取失敗：" + (k instanceof Error ? k.message : String(k)));
            } finally {
              u(!1);
            }
          },
          children: [/* @__PURE__ */ (0, l.jsx)(Ts, {
            size: 15,
            className: _ ? "spin" : ""
          }), _ ? "檢查中…" : "檢查資料連線"]
        }),
        /* @__PURE__ */ (0, l.jsx)("p", {
          role: "status",
          children: d
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
var uf = {
  rule: "規則／決策",
  script: "劇本／台詞",
  character: "角色",
  scene: "場景",
  audio: "聲音",
  reference: "原作／參考"
};
function ax({ project: r, busy: m, mutate: _ }) {
  const [u, d] = (0, N.useState)(""), [T, v] = (0, N.useState)(""), [M, w] = (0, N.useState)(""), [k, z] = (0, N.useState)(30), [V, R] = (0, N.useState)("main"), [re, pe] = (0, N.useState)(null), [J, W] = (0, N.useState)(""), [le, X] = (0, N.useState)(""), [oe, H] = (0, N.useState)({
    content: "",
    source: "",
    location: ""
  }), F = vl(r).records, te = r.production?.sections ?? [], ge = te.find((g) => g.stageId === u), ce = F.filter(ln).length, I = Ir(r, u), j = te.reduce((g, ae) => g + Ir(r, ae.stageId).filter((Q) => Q.status === "open").length, 0), $ = new Set(te.flatMap((g) => g.recordKeys)), ze = F.filter((g) => (!u || ge?.recordKeys.includes(g.key) || g.scope.type === "stage" && g.scope.target === u) && (!M || g.kind === M) && (!T || [
    g.title,
    g.key,
    g.content,
    g.source,
    g.scope.target
  ].join(" ").toLowerCase().includes(T.toLowerCase()))).sort((g, ae) => (g.key.startsWith("ep01_src_") ? 1 : $.has(g.key) ? 0 : 2) - (ae.key.startsWith("ep01_src_") ? 1 : $.has(ae.key) ? 0 : 2));
  async function he(g) {
    if (pe(null), W(""), !!g)
      try {
        if (g.size > 15e5) throw new Error("資料包不可超過 1.5 MB");
        const ae = JSON.parse(await g.text());
        if (ae.schemaVersion !== 1 || ae.episode !== r.episode || !Array.isArray(ae.records) || !Array.isArray(ae.shots) || !Array.isArray(ae.sections)) throw new Error("請選擇相同集數的製作資料包");
        pe(ae);
      } catch (ae) {
        W(ae instanceof Error ? ae.message : "資料包讀取失敗");
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
            records: F,
            shots: r.shots
          }, null, 2)], { type: "application/json" })), ae = document.createElement("a");
          ae.href = g, ae.download = r.episode + "_製作資料.json", ae.click(), setTimeout(() => URL.revokeObjectURL(g), 1e3);
        },
        children: "匯出製作資料"
      })]
    }),
    /* @__PURE__ */ (0, l.jsxs)("div", {
      className: "production-totals",
      children: [
        /* @__PURE__ */ (0, l.jsxs)("b", { children: [F.length, " 筆資料"] }),
        /* @__PURE__ */ (0, l.jsxs)("b", { children: [r.shots.length, " 列鏡頭規劃"] }),
        /* @__PURE__ */ (0, l.jsxs)("b", { children: [te.length, " 個階段已盤點"] }),
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
        /* @__PURE__ */ (0, l.jsxs)("b", { children: [ce, " 筆已確認收錄"] }),
        /* @__PURE__ */ (0, l.jsx)("p", { children: r.production.acceptance.note }),
        /* @__PURE__ */ (0, l.jsxs)("p", { children: [
          "補齊已開放 · ",
          j,
          " 項待補。可直接保存補充內容，不需逐筆再確認。不同來源版本保留，採用版本另行指定。"
        ] })
      ] }) : /* @__PURE__ */ (0, l.jsxs)(l.Fragment, { children: [/* @__PURE__ */ (0, l.jsx)("p", { children: "依作者確認，將已完成的資料一次通過，並開放剩餘項目直接補齊。" }), /* @__PURE__ */ (0, l.jsx)("button", {
        className: "btn primary",
        disabled: m || r.archived || !te.length,
        onClick: () => {
          _("accept_production_data", { note: "依作者2026-10-21指示：目前先不用檢核，已完成的資料直接通過；剩餘項目開放直接補齊。" });
        },
        children: "通過現有資料並開放補齊"
      })] })
    }),
    /* @__PURE__ */ (0, l.jsxs)("div", {
      className: "production-filters",
      children: [
        /* @__PURE__ */ (0, l.jsxs)("label", { children: ["搜尋實際內容", /* @__PURE__ */ (0, l.jsx)("input", {
          placeholder: "台詞、F077、G11、角色或素材名稱",
          value: T,
          onChange: (g) => {
            v(g.target.value), z(30);
          }
        })] }),
        /* @__PURE__ */ (0, l.jsxs)("label", { children: ["製作階段", /* @__PURE__ */ (0, l.jsxs)("select", {
          value: u,
          onChange: (g) => {
            d(g.target.value), z(30);
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
          value: M,
          onChange: (g) => {
            w(g.target.value), z(30);
          },
          children: [/* @__PURE__ */ (0, l.jsx)("option", {
            value: "",
            children: "全部種類"
          }), Object.entries(uf).map(([g, ae]) => /* @__PURE__ */ (0, l.jsx)("option", {
            value: g,
            children: ae
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
      ].map(([g, ae]) => /* @__PURE__ */ (0, l.jsx)("button", {
        className: V === g ? "active" : "",
        onClick: () => R(g),
        children: ae
      }, g))
    }),
    /* @__PURE__ */ (0, l.jsx)("div", {
      className: "production-grid",
      children: Kt.filter((g) => g.group === V).map((g) => {
        const ae = te.find((B) => B.stageId === g.id), Q = Ir(r, g.id).filter((B) => B.status === "open").length;
        return /* @__PURE__ */ (0, l.jsxs)("button", {
          className: "production-stage " + (u === g.id ? "selected" : ""),
          onClick: () => {
            d(u === g.id ? "" : g.id), X(""), z(30);
          },
          children: [
            /* @__PURE__ */ (0, l.jsx)("small", { children: g.group === "main" ? g.id : g.group.toUpperCase() + " " + g.id.slice(2) }),
            /* @__PURE__ */ (0, l.jsx)("b", { children: g.title }),
            /* @__PURE__ */ (0, l.jsx)("span", { children: ae ? ae.recordKeys.length + " 筆相關資料" : "尚未盤點" }),
            /* @__PURE__ */ (0, l.jsx)("em", { children: ae ? Q + " 項待補" : "待補資料" })
          ]
        }, g.id);
      })
    }),
    ge && /* @__PURE__ */ (0, l.jsxs)("div", {
      className: "production-gaps",
      children: [
        /* @__PURE__ */ (0, l.jsxs)("h3", { children: [Kt.find((g) => g.id === u)?.title, " · 資料盤點"] }),
        /* @__PURE__ */ (0, l.jsx)("p", { children: ge.overview }),
        /* @__PURE__ */ (0, l.jsx)("b", { children: "補齊清單" }),
        I.length ? /* @__PURE__ */ (0, l.jsx)("div", { children: I.map((g) => /* @__PURE__ */ (0, l.jsxs)("article", {
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
            r.production?.supplementsOpen && (le === u + ":" + g.index ? /* @__PURE__ */ (0, l.jsxs)("form", {
              className: "context-form",
              onSubmit: async (ae) => {
                ae.preventDefault(), await _("supplement_production_data", {
                  stageId: u,
                  gapIndex: g.index,
                  ...oe
                }) && (X(""), H({
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
                  value: oe.content,
                  onChange: (ae) => H({
                    ...oe,
                    content: ae.target.value
                  })
                })] }),
                /* @__PURE__ */ (0, l.jsxs)("label", { children: ["補件來源", /* @__PURE__ */ (0, l.jsx)("input", {
                  required: !0,
                  maxLength: 2e3,
                  value: oe.source,
                  onChange: (ae) => H({
                    ...oe,
                    source: ae.target.value
                  })
                })] }),
                /* @__PURE__ */ (0, l.jsxs)("label", { children: ["補件素材位置", /* @__PURE__ */ (0, l.jsx)("input", {
                  maxLength: 2e3,
                  value: oe.location,
                  onChange: (ae) => H({
                    ...oe,
                    location: ae.target.value
                  })
                })] }),
                /* @__PURE__ */ (0, l.jsxs)("div", {
                  className: "context-actions",
                  children: [/* @__PURE__ */ (0, l.jsx)("button", {
                    className: "btn",
                    type: "button",
                    onClick: () => X(""),
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
                X(u + ":" + g.index), H({
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
        ze.length,
        " 筆資料；展開可讀取完整內容與來源。"
      ]
    }),
    /* @__PURE__ */ (0, l.jsx)("div", {
      className: "production-records",
      children: ze.slice(0, k).map((g) => /* @__PURE__ */ (0, l.jsxs)("details", {
        className: "production-record",
        children: [
          /* @__PURE__ */ (0, l.jsxs)("summary", { children: [
            /* @__PURE__ */ (0, l.jsx)("span", {
              className: "status " + (ln(g) ? "passed" : "candidate"),
              children: g.status === "effective" ? "採用版本" : g.status === "superseded" ? "已停用" : ln(g) ? "資料已通過" : "來源資料／待確認"
            }),
            /* @__PURE__ */ (0, l.jsx)("b", { children: g.title }),
            /* @__PURE__ */ (0, l.jsxs)("small", { children: [
              uf[g.kind],
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
    ze.length > k && /* @__PURE__ */ (0, l.jsx)("button", {
      className: "btn",
      onClick: () => z(k + 30),
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
          disabled: m || r.archived,
          onChange: (g) => {
            he(g.target.files?.[0]);
          }
        })] }),
        J && /* @__PURE__ */ (0, l.jsx)("p", {
          role: "alert",
          children: J
        }),
        re && /* @__PURE__ */ (0, l.jsxs)("div", {
          className: "inline-note",
          children: [
            /* @__PURE__ */ (0, l.jsx)("b", { children: String(re.title) }),
            /* @__PURE__ */ (0, l.jsxs)("p", { children: [
              String(re.episode),
              " · ",
              re.records.length,
              " 筆來源資料 · ",
              re.shots.length,
              " 列待製作鏡頭 · ",
              re.sections.length,
              " 個階段盤點"
            ] }),
            /* @__PURE__ */ (0, l.jsx)("button", {
              className: "btn primary",
              disabled: m || r.archived,
              onClick: async () => {
                await _("import_production_data", re) && (pe(null), d(""), v(""), w(""));
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
function lx({ shotId: r, selection: m, disabled: _, mutate: u }) {
  const d = [
    ["output", "實際採用檔位置"],
    ["outputVersion", "採用檔版本"],
    ["reason", "選用原因"],
    ["source", "採用依據來源"],
    ["editorVersion", "剪輯工程版本"],
    ["inPoint", "工程入點"],
    ["outPoint", "工程出點"]
  ], [T, v] = (0, N.useState)(() => Object.fromEntries(d.map(([M]) => [M, m?.[M] ?? ""])));
  return /* @__PURE__ */ (0, l.jsxs)("details", {
    className: "selection-editor",
    children: [/* @__PURE__ */ (0, l.jsx)("summary", { children: "登記採用檔與工程位置" }), /* @__PURE__ */ (0, l.jsxs)("form", {
      className: "context-form",
      onSubmit: async (M) => {
        M.preventDefault(), await u("register_shot_selection", {
          ...T,
          shotId: r,
          baseVersion: m?.version ?? 0
        });
      },
      children: [
        d.map(([M, w]) => /* @__PURE__ */ (0, l.jsxs)("label", { children: [w, /* @__PURE__ */ (0, l.jsx)("input", {
          required: [
            "output",
            "outputVersion",
            "reason",
            "source"
          ].includes(M),
          maxLength: M === "reason" ? 3e3 : 2e3,
          value: T[M],
          onChange: (k) => v({
            ...T,
            [M]: k.target.value
          })
        })] }, M)),
        /* @__PURE__ */ (0, l.jsx)("p", {
          className: "muted",
          children: "工程入出點須成對填寫。保存來源與選用版本；素材實際開啟及檢視另行記錄。"
        }),
        /* @__PURE__ */ (0, l.jsx)("button", {
          className: "btn primary",
          disabled: _,
          children: "保存採用紀錄版本"
        })
      ]
    })]
  });
}
function ix({ project: r, busy: m, mutate: _ }) {
  const [u, d] = (0, N.useState)(""), [T, v] = (0, N.useState)(""), [M, w] = (0, N.useState)(""), [k, z] = (0, N.useState)(20), V = [...new Map((r.production?.selections ?? []).map((J) => [J.shotId, J])).values()], R = [...new Map((r.production?.links ?? []).map((J) => [J.shotId, J])).values()], re = vl(r).records, pe = r.shots.filter((J) => [
    J.id,
    J.scene,
    J.description,
    J.legacyIds
  ].join(" ").toLowerCase().includes(u.toLowerCase()));
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
          R.length,
          " / ",
          r.shots.length,
          " 列已建立關聯"
        ] }),
        /* @__PURE__ */ (0, l.jsxs)("b", { children: [R.filter((J) => J.references.length).length, " 列有影格來源定位"] }),
        /* @__PURE__ */ (0, l.jsxs)("b", { children: [(/* @__PURE__ */ new Set([...V.map((J) => J.shotId), ...R.filter((J) => J.adoptedOutput).map((J) => J.shotId)])).size, " 列已登記採用檔"] })
      ]
    }),
    /* @__PURE__ */ (0, l.jsxs)("label", {
      className: "work-search",
      children: ["搜尋鏡頭關聯", /* @__PURE__ */ (0, l.jsx)("input", {
        value: u,
        onChange: (J) => {
          d(J.target.value), z(20);
        },
        placeholder: "F077、G11、S06 或鏡頭 ID"
      })]
    }),
    pe.slice(0, k).map((J) => {
      const W = R.find((X) => X.shotId === J.id), le = V.find((X) => X.shotId === J.id);
      return /* @__PURE__ */ (0, l.jsxs)("details", {
        className: "production-record",
        children: [
          /* @__PURE__ */ (0, l.jsxs)("summary", { children: [/* @__PURE__ */ (0, l.jsxs)("b", { children: [
            J.id,
            " · ",
            J.legacyIds
          ] }), /* @__PURE__ */ (0, l.jsxs)("small", { children: [
            J.scene,
            " · ",
            W ? "關聯已建立" : "來源對應待補"
          ] })] }),
          /* @__PURE__ */ (0, l.jsx)("p", {
            className: "production-source-text",
            children: J.description
          }),
          W ? /* @__PURE__ */ (0, l.jsxs)(l.Fragment, { children: [
            /* @__PURE__ */ (0, l.jsxs)("div", {
              className: "production-gaps",
              children: [
                /* @__PURE__ */ (0, l.jsx)("b", { children: "接著做什麼" }),
                /* @__PURE__ */ (0, l.jsx)("p", { children: le ? "採用檔已登記；接著開啟素材並對照工程版本與入出點。" : W.nextStep }),
                /* @__PURE__ */ (0, l.jsxs)("p", { children: ["採用檔：", le?.output || W.adoptedOutput || "位置尚未登記"] }),
                /* @__PURE__ */ (0, l.jsxs)("p", { children: ["選用原因：", le?.reason || W.selectionReason || "尚未登記"] }),
                W.unknowns.length > 0 && /* @__PURE__ */ (0, l.jsx)("p", {
                  className: "muted",
                  children: "來源盤點時的缺口；新增採用登記另列於下方。"
                }),
                W.unknowns.length > 0 && /* @__PURE__ */ (0, l.jsx)("ul", { children: W.unknowns.map((X, oe) => /* @__PURE__ */ (0, l.jsx)("li", { children: X }, oe)) })
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
            W.recordKeys.map((X) => {
              const oe = re.find((H) => H.key === X);
              return oe ? /* @__PURE__ */ (0, l.jsxs)("details", {
                className: "context-mini",
                children: [
                  /* @__PURE__ */ (0, l.jsx)("summary", { children: oe.title }),
                  /* @__PURE__ */ (0, l.jsxs)("code", { children: [
                    oe.key,
                    " · v",
                    oe.version
                  ] }),
                  /* @__PURE__ */ (0, l.jsx)("div", {
                    className: "production-source-text",
                    children: oe.content
                  }),
                  /* @__PURE__ */ (0, l.jsxs)("p", { children: ["來源：", oe.source] })
                ]
              }, X) : null;
            }),
            /* @__PURE__ */ (0, l.jsx)("h3", { children: "來源影格定位" }),
            W.references.length ? W.references.map((X, oe) => /* @__PURE__ */ (0, l.jsxs)("div", {
              className: "context-mini",
              children: [
                /* @__PURE__ */ (0, l.jsx)("b", { children: X.file }),
                /* @__PURE__ */ (0, l.jsxs)("p", { children: ["素材包：", X.archive] }),
                /* @__PURE__ */ (0, l.jsxs)("p", { children: ["包內位置：", X.member] }),
                /* @__PURE__ */ (0, l.jsxs)("code", {
                  className: "context-id",
                  children: ["SHA-256 ", X.sha256 || "來源未列"]
                }),
                /* @__PURE__ */ (0, l.jsx)("small", { children: "依來源索引定位；實際圖像讀取狀態另記。" })
              ]
            }, oe)) : /* @__PURE__ */ (0, l.jsx)("p", { children: "目前來源未對上此影格。" }),
            /* @__PURE__ */ (0, l.jsx)("h3", { children: "剪輯對照候選" }),
            /* @__PURE__ */ (0, l.jsx)("p", {
              className: "muted",
              children: "以下時間來自指定來源表，尚未指定為本鏡實際入片位置。"
            }),
            W.timelineCandidates.map((X, oe) => /* @__PURE__ */ (0, l.jsxs)("div", {
              className: "context-mini",
              children: [
                /* @__PURE__ */ (0, l.jsxs)("b", { children: [
                  "序號 ",
                  X.sequence,
                  " · ",
                  X.start,
                  " → ",
                  X.end
                ] }),
                /* @__PURE__ */ (0, l.jsx)("p", { children: X.text }),
                /* @__PURE__ */ (0, l.jsx)("small", { children: X.source })
              ]
            }, oe)),
            !W.timelineCandidates.length && /* @__PURE__ */ (0, l.jsx)("p", { children: "尚缺可核實的剪輯對照。" }),
            /* @__PURE__ */ (0, l.jsx)("h3", { children: "台詞與音檔對照候選" }),
            W.voiceCandidates.map((X, oe) => /* @__PURE__ */ (0, l.jsxs)("div", {
              className: "context-mini",
              children: [
                /* @__PURE__ */ (0, l.jsx)("b", { children: X.lineId }),
                /* @__PURE__ */ (0, l.jsx)("p", { children: X.file }),
                /* @__PURE__ */ (0, l.jsxs)("small", { children: [
                  X.start,
                  " → ",
                  X.end,
                  " · ",
                  X.source
                ] })
              ]
            }, oe)),
            !W.voiceCandidates.length && /* @__PURE__ */ (0, l.jsx)("p", { children: "尚未建立明確台詞對應，不依編號猜配。" })
          ] }) : /* @__PURE__ */ (0, l.jsx)("p", { children: "請補來源與實際輸出對應。" }),
          /* @__PURE__ */ (0, l.jsx)(lx, {
            shotId: J.id,
            selection: le,
            disabled: m || r.archived,
            mutate: _
          }, le?.id ?? J.id)
        ]
      }, J.id);
    }),
    pe.length > k && /* @__PURE__ */ (0, l.jsx)("button", {
      className: "btn",
      onClick: () => z(k + 20),
      children: "再顯示 20 列"
    }),
    /* @__PURE__ */ (0, l.jsxs)("details", {
      className: "production-import",
      children: [
        /* @__PURE__ */ (0, l.jsx)("summary", { children: "補入鏡頭製作關聯" }),
        /* @__PURE__ */ (0, l.jsx)("p", { children: "貼上包含 bundleId 與 links 清單的 JSON；所有鏡頭與資料識別鍵必須已存在。保留歷次關聯。" }),
        /* @__PURE__ */ (0, l.jsxs)("label", { children: ["鏡頭關聯 JSON", /* @__PURE__ */ (0, l.jsx)("textarea", {
          rows: 5,
          value: T,
          onChange: (J) => {
            v(J.target.value), w("");
          }
        })] }),
        M && /* @__PURE__ */ (0, l.jsx)("p", {
          role: "alert",
          children: M
        }),
        /* @__PURE__ */ (0, l.jsx)("button", {
          className: "btn primary",
          disabled: m || r.archived || !T.trim(),
          onClick: async () => {
            try {
              await _("save_production_links", JSON.parse(T)) && v("");
            } catch (J) {
              w(J instanceof Error ? J.message : "格式錯誤");
            }
          },
          children: "保存鏡頭製作關聯"
        })
      ]
    })
  ] });
}
var an = {
  reference: "來源候選",
  adopted: "本集採用",
  withdrawn: "停止沿用",
  unresolved: "版本待補登"
}, pf = {
  script: "劇本",
  character: "角色",
  scene: "場景",
  voice: "聲線",
  op_audio: "OP音軌",
  ed_audio: "ED音軌",
  edit: "剪輯工程"
}, Ns = (r) => r.split(/[,，\n]/).map((m) => m.trim()).filter(Boolean), ff = {
  key: "",
  title: "",
  content: "",
  source: "",
  note: "",
  stageIdsText: "",
  sceneIdsText: "",
  status: "reference",
  baseVersion: 0
}, hf = {
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
function Af({ project: r, busy: m, mutate: _ }) {
  const [u, d] = (0, N.useState)(!1), [T, v] = (0, N.useState)(!1), [M, w] = (0, N.useState)(ff), [k, z] = (0, N.useState)(hf), [V, R] = (0, N.useState)(""), [re, pe] = (0, N.useState)(""), [J, W] = (0, N.useState)(""), le = Km(r), X = m || r.archived, oe = Ka(r.episodeRules ?? []), H = Ka(r.baselines ?? []), F = (j) => !V || [j.key, j.title].join(" ").toLowerCase().includes(V.toLowerCase());
  function te(j) {
    w({
      ...j,
      stageIdsText: j.stageIds.join(", "),
      sceneIdsText: j.sceneIds.join(", "),
      baseVersion: ri(r.episodeRules ?? []).find(($) => $.key === j.key).version
    }), d(!0);
  }
  function ge(j) {
    z({
      ...j,
      recordKey: j.snapshot?.key ?? "",
      recordVersion: j.recordVersion ?? 1,
      content: j.snapshot?.content ?? "",
      stageIdsText: j.stageIds.join(", "),
      sceneIdsText: j.sceneIds.join(", "),
      baseVersion: ri(r.baselines ?? []).find(($) => $.key === j.key).version
    }), v(!0);
  }
  async function ce(j, $) {
    await _("save_episode_rule", {
      ...j,
      status: $,
      baseVersion: le.rules.find((ze) => ze.key === j.key).version
    });
  }
  async function I(j, $) {
    await _("register_episode_baseline", {
      ...j,
      status: $,
      recordKey: j.snapshot?.key ?? "",
      recordVersion: j.recordVersion,
      content: j.snapshot?.content ?? "",
      baseVersion: le.baselines.find((ze) => ze.key === j.key).version
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
              /* @__PURE__ */ (0, l.jsxs)("b", { children: [oe.length, " 項本集規則已採用"] }),
              /* @__PURE__ */ (0, l.jsxs)("b", { children: [H.length, " 項來源已採用"] }),
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
              value: V,
              onChange: (j) => R(j.target.value),
              placeholder: "規則、角色、劇本、聲線或音軌"
            })]
          }),
          /* @__PURE__ */ (0, l.jsxs)("details", { children: [/* @__PURE__ */ (0, l.jsx)("summary", { children: "通用流程檢查項目" }), le.genericChecks.map((j) => /* @__PURE__ */ (0, l.jsxs)("div", {
            className: "context-mini",
            children: [/* @__PURE__ */ (0, l.jsxs)("b", { children: [
              j.id,
              " ",
              j.title
            ] }), /* @__PURE__ */ (0, l.jsx)("ul", { children: j.checks.map(($) => /* @__PURE__ */ (0, l.jsx)("li", { children: $ }, $)) })]
          }, j.id))] }),
          r.workflowLegacy && /* @__PURE__ */ (0, l.jsxs)("details", { children: [
            /* @__PURE__ */ (0, l.jsx)("summary", { children: "保留的舊版檢查表紀錄" }),
            /* @__PURE__ */ (0, l.jsx)("p", { children: "舊版單集條件及勾選狀態保留在此；本集實際適用的規則另列於下方。" }),
            r.workflowLegacy.stages.map((j) => /* @__PURE__ */ (0, l.jsxs)("div", {
              className: "context-mini",
              children: [/* @__PURE__ */ (0, l.jsxs)("b", { children: ["舊階段 ", j.stageId] }), j.labels.map(($, ze) => /* @__PURE__ */ (0, l.jsxs)("p", { children: [
                j.checks[ze] ? "已勾選" : "未勾選",
                " · ",
                $
              ] }, ze))]
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
              disabled: X,
              onClick: () => {
                w(ff), d(!u);
              },
              children: "新增本集規則"
            })]
          }),
          u && /* @__PURE__ */ (0, l.jsxs)("form", {
            className: "context-form",
            onSubmit: async (j) => {
              j.preventDefault(), await _("save_episode_rule", {
                ...M,
                stageIds: Ns(M.stageIdsText),
                sceneIds: Ns(M.sceneIdsText)
              }) && d(!1);
            },
            children: [
              /* @__PURE__ */ (0, l.jsxs)("div", {
                className: "context-form-grid",
                children: [/* @__PURE__ */ (0, l.jsxs)("label", { children: ["規則識別鍵", /* @__PURE__ */ (0, l.jsx)("input", {
                  required: !0,
                  readOnly: !!M.baseVersion,
                  maxLength: 100,
                  value: M.key,
                  onChange: (j) => w({
                    ...M,
                    key: j.target.value
                  })
                })] }), /* @__PURE__ */ (0, l.jsxs)("label", { children: ["規則名稱", /* @__PURE__ */ (0, l.jsx)("input", {
                  required: !0,
                  maxLength: 200,
                  value: M.title,
                  onChange: (j) => w({
                    ...M,
                    title: j.target.value
                  })
                })] })]
              }),
              /* @__PURE__ */ (0, l.jsxs)("label", { children: ["規則內容", /* @__PURE__ */ (0, l.jsx)("textarea", {
                required: !0,
                rows: 4,
                maxLength: 6e3,
                value: M.content,
                onChange: (j) => w({
                  ...M,
                  content: j.target.value
                })
              })] }),
              /* @__PURE__ */ (0, l.jsxs)("label", { children: ["規則來源", /* @__PURE__ */ (0, l.jsx)("input", {
                required: !0,
                maxLength: 2e3,
                value: M.source,
                onChange: (j) => w({
                  ...M,
                  source: j.target.value
                })
              })] }),
              /* @__PURE__ */ (0, l.jsxs)("div", {
                className: "context-form-grid",
                children: [/* @__PURE__ */ (0, l.jsxs)("label", { children: ["規則適用階段", /* @__PURE__ */ (0, l.jsx)("input", {
                  value: M.stageIdsText,
                  placeholder: "逗號分隔；留空為本集共用",
                  onChange: (j) => w({
                    ...M,
                    stageIdsText: j.target.value
                  })
                })] }), /* @__PURE__ */ (0, l.jsxs)("label", { children: ["規則適用場次", /* @__PURE__ */ (0, l.jsx)("input", {
                  value: M.sceneIdsText,
                  placeholder: "逗號分隔；留空為全部場次",
                  onChange: (j) => w({
                    ...M,
                    sceneIdsText: j.target.value
                  })
                })] })]
              }),
              /* @__PURE__ */ (0, l.jsxs)("label", { children: ["規則狀態", /* @__PURE__ */ (0, l.jsx)("select", {
                value: M.status,
                onChange: (j) => w({
                  ...M,
                  status: j.target.value
                }),
                children: Object.entries(an).map(([j, $]) => /* @__PURE__ */ (0, l.jsx)("option", {
                  value: j,
                  children: $
                }, j))
              })] }),
              /* @__PURE__ */ (0, l.jsxs)("label", { children: ["規則備註", /* @__PURE__ */ (0, l.jsx)("textarea", {
                rows: 2,
                value: M.note,
                onChange: (j) => w({
                  ...M,
                  note: j.target.value
                })
              })] }),
              /* @__PURE__ */ (0, l.jsx)("button", {
                className: "btn primary",
                disabled: X,
                children: "保存本集規則版本"
              })
            ]
          }),
          le.rules.filter(F).map((j) => {
            const $ = oe.find((ze) => ze.key === j.key);
            return /* @__PURE__ */ (0, l.jsxs)("details", {
              className: "production-record",
              children: [
                /* @__PURE__ */ (0, l.jsxs)("summary", { children: [/* @__PURE__ */ (0, l.jsx)("b", { children: j.title }), /* @__PURE__ */ (0, l.jsxs)("span", { children: [
                  an[j.status],
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
                $ && $.id !== j.id && /* @__PURE__ */ (0, l.jsxs)("div", {
                  className: "context-mini",
                  children: [
                    /* @__PURE__ */ (0, l.jsxs)("b", { children: ["仍沿用已採用 v", $.version] }),
                    /* @__PURE__ */ (0, l.jsx)("p", { children: $.content }),
                    /* @__PURE__ */ (0, l.jsxs)("small", { children: ["來源：", $.source] })
                  ]
                }),
                /* @__PURE__ */ (0, l.jsxs)("div", {
                  className: "context-actions",
                  children: [
                    /* @__PURE__ */ (0, l.jsx)("button", {
                      className: "btn",
                      disabled: X,
                      onClick: () => te(j),
                      children: "編輯規則新版本"
                    }),
                    j.status === "reference" && /* @__PURE__ */ (0, l.jsx)("button", {
                      className: "btn primary",
                      disabled: X,
                      onClick: () => {
                        ce(j, "adopted");
                      },
                      children: "採用此規則"
                    }),
                    $ && /* @__PURE__ */ (0, l.jsx)("button", {
                      className: "btn",
                      disabled: X,
                      onClick: () => {
                        ce($, "withdrawn");
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
              disabled: X,
              onClick: () => {
                z(hf), v(!T);
              },
              children: "新增採用項目"
            })]
          }),
          T && /* @__PURE__ */ (0, l.jsxs)("form", {
            className: "context-form",
            onSubmit: async (j) => {
              j.preventDefault(), await _("register_episode_baseline", {
                ...k,
                stageIds: Ns(k.stageIdsText),
                sceneIds: Ns(k.sceneIdsText)
              }) && v(!1);
            },
            children: [
              /* @__PURE__ */ (0, l.jsxs)("div", {
                className: "context-form-grid",
                children: [
                  /* @__PURE__ */ (0, l.jsxs)("label", { children: ["採用項目識別鍵", /* @__PURE__ */ (0, l.jsx)("input", {
                    required: !0,
                    readOnly: !!k.baseVersion,
                    maxLength: 100,
                    value: k.key,
                    onChange: (j) => z({
                      ...k,
                      key: j.target.value
                    })
                  })] }),
                  /* @__PURE__ */ (0, l.jsxs)("label", { children: ["採用項目名稱", /* @__PURE__ */ (0, l.jsx)("input", {
                    required: !0,
                    maxLength: 200,
                    value: k.title,
                    onChange: (j) => z({
                      ...k,
                      title: j.target.value
                    })
                  })] }),
                  /* @__PURE__ */ (0, l.jsxs)("label", { children: ["採用種類", /* @__PURE__ */ (0, l.jsx)("select", {
                    value: k.category,
                    onChange: (j) => z({
                      ...k,
                      category: j.target.value
                    }),
                    children: Zm.map((j) => /* @__PURE__ */ (0, l.jsx)("option", {
                      value: j,
                      children: pf[j]
                    }, j))
                  })] }),
                  /* @__PURE__ */ (0, l.jsxs)("label", { children: ["採用項目狀態", /* @__PURE__ */ (0, l.jsx)("select", {
                    value: k.status,
                    onChange: (j) => z({
                      ...k,
                      status: j.target.value
                    }),
                    children: Object.entries(an).map(([j, $]) => /* @__PURE__ */ (0, l.jsx)("option", {
                      value: j,
                      children: $
                    }, j))
                  })] }),
                  /* @__PURE__ */ (0, l.jsxs)("label", { children: ["已有來源識別鍵", /* @__PURE__ */ (0, l.jsx)("input", {
                    value: k.recordKey,
                    maxLength: 120,
                    onChange: (j) => z({
                      ...k,
                      recordKey: j.target.value
                    }),
                    placeholder: "從製作資料取得；外部來源可留空"
                  })] }),
                  /* @__PURE__ */ (0, l.jsxs)("label", { children: ["來源紀錄版本", /* @__PURE__ */ (0, l.jsx)("input", {
                    type: "number",
                    min: 1,
                    value: k.recordVersion,
                    onChange: (j) => z({
                      ...k,
                      recordVersion: Number(j.target.value)
                    })
                  })] })
                ]
              }),
              !k.recordKey && /* @__PURE__ */ (0, l.jsxs)("label", { children: ["外部來源內容", /* @__PURE__ */ (0, l.jsx)("textarea", {
                rows: 4,
                required: k.status === "reference" || k.status === "adopted",
                value: k.content,
                maxLength: 12e3,
                onChange: (j) => z({
                  ...k,
                  content: j.target.value
                })
              })] }),
              /* @__PURE__ */ (0, l.jsxs)("label", { children: ["採用依據來源", /* @__PURE__ */ (0, l.jsx)("input", {
                required: !0,
                maxLength: 2e3,
                value: k.source,
                onChange: (j) => z({
                  ...k,
                  source: j.target.value
                })
              })] }),
              /* @__PURE__ */ (0, l.jsxs)("div", {
                className: "context-form-grid",
                children: [
                  /* @__PURE__ */ (0, l.jsxs)("label", { children: ["外部檔案版本", /* @__PURE__ */ (0, l.jsx)("input", {
                    value: k.externalVersion,
                    maxLength: 200,
                    onChange: (j) => z({
                      ...k,
                      externalVersion: j.target.value
                    })
                  })] }),
                  /* @__PURE__ */ (0, l.jsxs)("label", { children: ["來源檔案位置", /* @__PURE__ */ (0, l.jsx)("input", {
                    value: k.location,
                    maxLength: 2e3,
                    onChange: (j) => z({
                      ...k,
                      location: j.target.value
                    })
                  })] }),
                  /* @__PURE__ */ (0, l.jsxs)("label", { children: ["採用適用階段", /* @__PURE__ */ (0, l.jsx)("input", {
                    value: k.stageIdsText,
                    placeholder: "OP／ED自動限制於各自支線",
                    onChange: (j) => z({
                      ...k,
                      stageIdsText: j.target.value
                    })
                  })] }),
                  /* @__PURE__ */ (0, l.jsxs)("label", { children: ["採用適用場次", /* @__PURE__ */ (0, l.jsx)("input", {
                    value: k.sceneIdsText,
                    onChange: (j) => z({
                      ...k,
                      sceneIdsText: j.target.value
                    })
                  })] })
                ]
              }),
              /* @__PURE__ */ (0, l.jsxs)("label", { children: ["選用原因或待補說明", /* @__PURE__ */ (0, l.jsx)("textarea", {
                required: k.status === "unresolved",
                rows: 3,
                maxLength: 3e3,
                value: k.note,
                onChange: (j) => z({
                  ...k,
                  note: j.target.value
                })
              })] }),
              /* @__PURE__ */ (0, l.jsx)("button", {
                className: "btn primary",
                disabled: X,
                children: "保存採用項目版本"
              })
            ]
          }),
          le.baselines.filter(F).map((j) => {
            const $ = H.find((ze) => ze.key === j.key);
            return /* @__PURE__ */ (0, l.jsxs)("details", {
              className: "production-record",
              children: [
                /* @__PURE__ */ (0, l.jsxs)("summary", { children: [/* @__PURE__ */ (0, l.jsxs)("b", { children: [
                  pf[j.category],
                  "｜",
                  j.title
                ] }), /* @__PURE__ */ (0, l.jsxs)("span", { children: [
                  an[j.status],
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
                $ && $.id !== j.id && /* @__PURE__ */ (0, l.jsxs)("div", {
                  className: "context-mini",
                  children: [/* @__PURE__ */ (0, l.jsxs)("b", { children: [
                    "仍沿用已採用 v",
                    $.version,
                    "：",
                    $.title
                  ] }), /* @__PURE__ */ (0, l.jsxs)("p", { children: [
                    $.externalVersion || $.snapshot?.key,
                    " · ",
                    $.source
                  ] })]
                }),
                /* @__PURE__ */ (0, l.jsxs)("div", {
                  className: "context-actions",
                  children: [
                    /* @__PURE__ */ (0, l.jsx)("button", {
                      className: "btn",
                      disabled: X,
                      onClick: () => ge(j),
                      children: "編輯採用項目新版本"
                    }),
                    j.status === "reference" && j.snapshot && /* @__PURE__ */ (0, l.jsx)("button", {
                      className: "btn primary",
                      disabled: X,
                      onClick: () => {
                        I(j, "adopted");
                      },
                      children: "採用此來源版本"
                    }),
                    $ && /* @__PURE__ */ (0, l.jsx)("button", {
                      className: "btn",
                      disabled: X,
                      onClick: () => {
                        I($, "withdrawn");
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
                value: re,
                onChange: (j) => {
                  pe(j.target.value), W("");
                }
              })] }),
              J && /* @__PURE__ */ (0, l.jsx)("p", {
                role: "alert",
                children: J
              }),
              /* @__PURE__ */ (0, l.jsx)("button", {
                className: "btn primary",
                disabled: X || !re.trim(),
                onClick: async () => {
                  try {
                    await _("import_episode_settings", JSON.parse(re)) && pe("");
                  } catch (j) {
                    W(j instanceof Error ? j.message : "格式錯誤");
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
            an[j.status],
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
var $r = {
  rule: "規則／決策",
  script: "劇本",
  character: "角色",
  scene: "場景",
  audio: "聲音／音軌",
  reference: "原作／參考素材"
}, mf = {
  original: "原文明示",
  adaptation: "動畫改編",
  author_decision: "作者決定",
  ai_proposal: "AI 建議"
}, co = {
  project: "本集共用",
  stage: "指定階段",
  scene: "指定場次",
  shot: "指定鏡頭"
}, Wr = (r) => co[r.type] + (r.target ? " · " + r.target : ""), Fr = {
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
function nx(r, m) {
  const _ = URL.createObjectURL(new Blob([JSON.stringify(m, null, 2)], { type: "application/json" })), u = document.createElement("a");
  u.href = _, u.download = r, u.click(), setTimeout(() => URL.revokeObjectURL(_), 1e3);
}
function sx({ project: r, mutate: m, busy: _ }) {
  const u = vl(r), [d, T] = (0, N.useState)("materials"), [v, M] = (0, N.useState)(!1), [w, k] = (0, N.useState)(Fr), [z, V] = (0, N.useState)(!1), [R, re] = (0, N.useState)({
    type: "conflict",
    scopeType: "project",
    target: "",
    description: ""
  }), [pe, J] = (0, N.useState)("production"), [W, le] = (0, N.useState)(""), [X, oe] = (0, N.useState)(""), [H, F] = (0, N.useState)(""), [te, ge] = (0, N.useState)(""), [ce, I] = (0, N.useState)(""), [j, $] = (0, N.useState)(""), [ze, he] = (0, N.useState)(""), [g, ae] = (0, N.useState)(""), [Q, B] = (0, N.useState)(""), [G, fe] = (0, N.useState)(""), [se, Z] = (0, N.useState)(""), [f, D] = (0, N.useState)(""), [K, ee] = (0, N.useState)(""), [ne, Se] = (0, N.useState)({}), je = u.packs.find((h) => h.id === g) ?? u.packs.at(-1), Be = u.records.filter((h) => h.status === "effective"), Ee = u.records.filter((h) => h.status === "proposed" && !ln(h)), Ne = u.problems.filter((h) => h.status === "open"), Re = [
    [
      "materials",
      "製作資料",
      u.records.length
    ],
    [
      "links",
      "製作關聯",
      new Set((r.production?.links ?? []).map((h) => h.shotId)).size
    ],
    [
      "settings",
      "本集採用",
      Ka(r.baselines ?? []).length
    ],
    [
      "baseline",
      "直接核定來源",
      Be.length
    ],
    [
      "proposals",
      "待確認提案",
      Ee.length
    ],
    [
      "problems",
      "矛盾與缺件",
      Ne.length
    ],
    [
      "packet",
      "工作資料包",
      u.packs.length
    ],
    [
      "handoff",
      "工作接續",
      u.results.length
    ]
  ], Ue = _ || r.archived;
  async function y(h) {
    h.preventDefault(), await m("propose_record", {
      ...w,
      scope: {
        type: w.scopeType,
        target: w.target
      }
    }) && (M(!1), k(Fr), T("proposals"));
  }
  function ie(h) {
    const P = u.records.find((We) => We.id === h);
    k({
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
    }), M(!0);
  }
  function me(h) {
    return /* @__PURE__ */ (0, l.jsxs)(l.Fragment, { children: [
      /* @__PURE__ */ (0, l.jsxs)("div", {
        className: "context-pack-head",
        children: [
          /* @__PURE__ */ (0, l.jsx)("span", {
            className: "status " + (h.readiness === "ready" ? "passed" : "needs_revision"),
            children: h.readiness === "ready" ? h.purpose === "documentation" ? "可整理資料 · 保留來源差異" : "紀錄齊備 · 素材待實際讀取" : "受阻 · 先處理缺件與矛盾"
          }),
          /* @__PURE__ */ (0, l.jsx)("span", {
            className: "status " + (h.projectRevision === r.revision ? "passed" : "needs_revision"),
            children: h.projectRevision === r.revision ? "目前版本" : "已過期，需重新取得"
          }),
          /* @__PURE__ */ (0, l.jsx)("button", {
            className: "btn",
            onClick: () => nx("AI_工作資料包_" + h.id + ".json", h),
            children: "下載資料包 JSON"
          })
        ]
      }),
      /* @__PURE__ */ (0, l.jsx)("p", {
        className: "context-task",
        children: h.task
      }),
      /* @__PURE__ */ (0, l.jsxs)("p", {
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
      /* @__PURE__ */ (0, l.jsx)("code", {
        className: "context-id",
        children: h.id
      }),
      h.blockers.length > 0 && /* @__PURE__ */ (0, l.jsx)("div", {
        className: "context-blockers",
        children: h.blockers.map((P, We) => /* @__PURE__ */ (0, l.jsx)("p", { children: P.replace(/缺少有效資料種類：(\w+)/g, (jt, O) => "缺少有效資料種類：" + ($r[O] || O)) }, We))
      }),
      /* @__PURE__ */ (0, l.jsx)("h3", { children: h.purpose === "documentation" ? "本次指定來源（整理用途）" : "本次有效依據" }),
      h.records.length ? h.records.map((P) => /* @__PURE__ */ (0, l.jsxs)("article", {
        className: "context-mini",
        children: [
          /* @__PURE__ */ (0, l.jsxs)("b", { children: [
            P.title,
            " · v",
            P.version
          ] }),
          /* @__PURE__ */ (0, l.jsxs)("small", { children: [
            P.key,
            " · ",
            Wr(P.scope)
          ] }),
          /* @__PURE__ */ (0, l.jsx)("p", { children: P.content }),
          /* @__PURE__ */ (0, l.jsxs)("small", { children: ["來源：", P.source] }),
          /* @__PURE__ */ (0, l.jsxs)("small", { children: ["素材位置：", P.location || "內容已記錄；未登記外部檔案"] })
        ]
      }, P.id)) : /* @__PURE__ */ (0, l.jsx)("p", {
        className: "muted",
        children: "尚無有效資料，AI 應回報受阻。"
      }),
      /* @__PURE__ */ (0, l.jsxs)("details", { children: [/* @__PURE__ */ (0, l.jsxs)("summary", { children: [
        "禁止混用的版本／待確認提案（",
        h.excluded.length,
        "）"
      ] }), h.excluded.map((P) => /* @__PURE__ */ (0, l.jsxs)("p", { children: [
        P.title,
        " · ",
        P.status,
        " · ",
        P.id
      ] }, P.id))] }),
      /* @__PURE__ */ (0, l.jsxs)("details", { children: [/* @__PURE__ */ (0, l.jsx)("summary", { children: "完整資料契約與素材清單" }), /* @__PURE__ */ (0, l.jsx)("pre", { children: JSON.stringify({
        contract: h.contract,
        manifest: h.manifest,
        adoptedBaselines: h.adoptedBaselines,
        episodeRules: h.episodeRules,
        priorHandoff: h.priorHandoff
      }, null, 2) })] })
    ] });
  }
  return /* @__PURE__ */ (0, l.jsxs)("section", {
    className: "ai-workspace",
    children: [
      /* @__PURE__ */ (0, l.jsx)("nav", {
        className: "section-nav",
        "aria-label": "資料與交接",
        children: Re.filter(([h]) => [
          "materials",
          "links",
          "handoff",
          "problems"
        ].includes(h)).map(([h, P, We]) => /* @__PURE__ */ (0, l.jsxs)("button", {
          className: d === h ? "active" : "",
          onClick: () => T(h),
          children: [
            {
              materials: "製作資料",
              links: "鏡頭對應",
              handoff: "工作紀錄",
              problems: "缺件與疑問"
            }[h],
            " ",
            /* @__PURE__ */ (0, l.jsx)("span", { children: We })
          ]
        }, h))
      }),
      /* @__PURE__ */ (0, l.jsxs)("details", {
        className: "advanced-tools",
        children: [
          /* @__PURE__ */ (0, l.jsx)("summary", { children: "進階：採用設定、資料提案與 AI 工作資料包" }),
          /* @__PURE__ */ (0, l.jsx)("div", {
            className: "context-tabs",
            children: Re.filter(([h]) => ![
              "materials",
              "links",
              "handoff",
              "problems"
            ].includes(h)).map(([h, P, We]) => /* @__PURE__ */ (0, l.jsxs)("button", {
              className: d === h ? "active" : "",
              onClick: () => T(h),
              children: [
                P,
                " · ",
                We
              ]
            }, h))
          }),
          /* @__PURE__ */ (0, l.jsx)("p", { children: "AI 接手時會讀取指定版本；一般查資料不需要手動建立資料包。" })
        ]
      }),
      /* @__PURE__ */ (0, l.jsx)("div", {
        className: d === "settings" ? "" : "wide-card",
        children: d === "settings" ? /* @__PURE__ */ (0, l.jsx)(Af, {
          project: r,
          busy: _,
          mutate: m
        }) : d === "links" ? /* @__PURE__ */ (0, l.jsx)(ix, {
          project: r,
          busy: _,
          mutate: m
        }) : d === "materials" ? /* @__PURE__ */ (0, l.jsx)(ax, {
          project: r,
          busy: _,
          mutate: m
        }) : ["baseline", "proposals"].includes(d) ? /* @__PURE__ */ (0, l.jsxs)(l.Fragment, { children: [
          /* @__PURE__ */ (0, l.jsxs)("div", {
            className: "section-title",
            children: [/* @__PURE__ */ (0, l.jsxs)("div", { children: [/* @__PURE__ */ (0, l.jsx)("h2", { children: d === "baseline" ? "目前有效資料" : "待作者確認的提案" }), /* @__PURE__ */ (0, l.jsx)("p", { children: "識別鍵固定，修改建立新版本；來源與適用範圍必填。" })] }), /* @__PURE__ */ (0, l.jsx)("button", {
              className: "btn primary",
              disabled: Ue,
              onClick: () => {
                k(Fr), M(!v);
              },
              children: "新增資料提案"
            })]
          }),
          v && /* @__PURE__ */ (0, l.jsxs)("form", {
            className: "context-form",
            onSubmit: y,
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
                    onChange: (h) => k({
                      ...w,
                      key: h.target.value
                    })
                  })] }),
                  /* @__PURE__ */ (0, l.jsxs)("label", { children: ["資料名稱", /* @__PURE__ */ (0, l.jsx)("input", {
                    required: !0,
                    maxLength: 200,
                    value: w.title,
                    onChange: (h) => k({
                      ...w,
                      title: h.target.value
                    })
                  })] }),
                  /* @__PURE__ */ (0, l.jsxs)("label", { children: ["資料種類", /* @__PURE__ */ (0, l.jsx)("select", {
                    value: w.kind,
                    onChange: (h) => k({
                      ...w,
                      kind: h.target.value
                    }),
                    children: Im.map((h) => /* @__PURE__ */ (0, l.jsx)("option", {
                      value: h,
                      children: $r[h]
                    }, h))
                  })] }),
                  /* @__PURE__ */ (0, l.jsxs)("label", { children: ["內容性質", /* @__PURE__ */ (0, l.jsx)("select", {
                    value: w.origin,
                    onChange: (h) => k({
                      ...w,
                      origin: h.target.value
                    }),
                    children: Object.entries(mf).map(([h, P]) => /* @__PURE__ */ (0, l.jsx)("option", {
                      value: h,
                      children: P
                    }, h))
                  })] }),
                  /* @__PURE__ */ (0, l.jsxs)("label", { children: ["適用範圍", /* @__PURE__ */ (0, l.jsx)("select", {
                    value: w.scopeType,
                    disabled: !!w.supersedesId,
                    onChange: (h) => k({
                      ...w,
                      scopeType: h.target.value,
                      target: ""
                    }),
                    children: Object.entries(co).map(([h, P]) => /* @__PURE__ */ (0, l.jsx)("option", {
                      value: h,
                      children: P
                    }, h))
                  })] }),
                  /* @__PURE__ */ (0, l.jsxs)("label", { children: ["範圍 ID", /* @__PURE__ */ (0, l.jsx)("input", {
                    required: w.scopeType !== "project",
                    disabled: w.scopeType === "project" || !!w.supersedesId,
                    placeholder: "例如 S06、01 或鏡頭 ID",
                    value: w.target,
                    onChange: (h) => k({
                      ...w,
                      target: h.target.value
                    })
                  })] })
                ]
              }),
              /* @__PURE__ */ (0, l.jsxs)("label", { children: ["內容", /* @__PURE__ */ (0, l.jsx)("textarea", {
                required: !0,
                rows: 5,
                maxLength: 12e3,
                value: w.content,
                onChange: (h) => k({
                  ...w,
                  content: h.target.value
                })
              })] }),
              /* @__PURE__ */ (0, l.jsxs)("label", { children: ["來源依據", /* @__PURE__ */ (0, l.jsx)("input", {
                required: !0,
                maxLength: 2e3,
                placeholder: "原作章節、作者修改要求、檔案名稱與段落等",
                value: w.source,
                onChange: (h) => k({
                  ...w,
                  source: h.target.value
                })
              })] }),
              /* @__PURE__ */ (0, l.jsxs)("label", { children: ["素材位置（選填）", /* @__PURE__ */ (0, l.jsx)("input", {
                maxLength: 2e3,
                placeholder: "可取得的檔案位置或連結；填入不等於已讀取",
                value: w.location,
                onChange: (h) => k({
                  ...w,
                  location: h.target.value
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
                  onClick: () => M(!1),
                  children: "取消"
                }), /* @__PURE__ */ (0, l.jsx)("button", {
                  className: "btn primary",
                  disabled: Ue,
                  children: "保存為待確認提案"
                })]
              })
            ]
          }),
          /* @__PURE__ */ (0, l.jsx)("div", {
            className: "context-records",
            children: (d === "baseline" ? Be : Ee).map((h) => /* @__PURE__ */ (0, l.jsxs)("article", {
              className: "context-record",
              children: [
                /* @__PURE__ */ (0, l.jsxs)("div", {
                  className: "issue-top",
                  children: [/* @__PURE__ */ (0, l.jsx)("span", {
                    className: "status " + (h.status === "effective" ? "passed" : "candidate"),
                    children: h.status === "effective" ? "作者已確認" : "待確認"
                  }), /* @__PURE__ */ (0, l.jsxs)("b", { children: [
                    h.title,
                    " · v",
                    h.version
                  ] })]
                }),
                /* @__PURE__ */ (0, l.jsxs)("small", { children: [
                  $r[h.kind],
                  " ／ ",
                  mf[h.origin],
                  " ／ ",
                  Wr(h.scope)
                ] }),
                /* @__PURE__ */ (0, l.jsxs)("code", {
                  className: "context-id",
                  children: [
                    h.key,
                    " · ",
                    h.id
                  ]
                }),
                /* @__PURE__ */ (0, l.jsx)("p", { children: h.content }),
                /* @__PURE__ */ (0, l.jsxs)("div", {
                  className: "context-source",
                  children: [
                    "來源：",
                    h.source,
                    h.location && /* @__PURE__ */ (0, l.jsxs)("p", { children: ["素材位置：", h.location] })
                  ]
                }),
                h.supersedesId && /* @__PURE__ */ (0, l.jsxs)("small", { children: ["取代目標：", h.supersedesId] }),
                h.approval && /* @__PURE__ */ (0, l.jsxs)("small", { children: ["確認者：", h.approval.by] }),
                /* @__PURE__ */ (0, l.jsx)("div", {
                  className: "context-actions",
                  children: h.status === "proposed" ? /* @__PURE__ */ (0, l.jsx)("button", {
                    className: "btn primary",
                    disabled: Ue,
                    onClick: () => {
                      m("activate_record", { recordId: h.id });
                    },
                    children: "作者確認為有效資料"
                  }) : /* @__PURE__ */ (0, l.jsx)("button", {
                    className: "btn",
                    disabled: Ue,
                    onClick: () => ie(h.id),
                    children: "提出修改版本"
                  })
                })
              ]
            }, h.id))
          }),
          !(d === "baseline" ? Be : Ee).length && !v && /* @__PURE__ */ (0, l.jsxs)("div", {
            className: "empty",
            children: [/* @__PURE__ */ (0, l.jsx)("h3", { children: d === "baseline" ? "尚無有效資料" : "目前沒有待確認提案" }), /* @__PURE__ */ (0, l.jsx)("p", { children: "先登記來源、內容與範圍，再由作者確認。" })]
          }),
          /* @__PURE__ */ (0, l.jsxs)("details", { children: [/* @__PURE__ */ (0, l.jsxs)("summary", { children: [
            "已被取代的歷史版本（",
            u.records.filter((h) => h.status === "superseded").length,
            "）"
          ] }), u.records.filter((h) => h.status === "superseded").map((h) => /* @__PURE__ */ (0, l.jsxs)("article", {
            className: "context-mini",
            children: [
              /* @__PURE__ */ (0, l.jsxs)("b", { children: [
                h.title,
                " v",
                h.version,
                " · 已停用"
              ] }),
              /* @__PURE__ */ (0, l.jsx)("p", { children: h.content }),
              /* @__PURE__ */ (0, l.jsxs)("small", { children: [
                h.id,
                " → ",
                h.supersededBy
              ] })
            ]
          }, h.id))] })
        ] }) : d === "problems" ? /* @__PURE__ */ (0, l.jsxs)(l.Fragment, { children: [
          /* @__PURE__ */ (0, l.jsxs)("div", {
            className: "section-title",
            children: [/* @__PURE__ */ (0, l.jsxs)("div", { children: [/* @__PURE__ */ (0, l.jsx)("h2", { children: "矛盾、缺件與待裁定事項" }), /* @__PURE__ */ (0, l.jsx)("p", { children: "相關任務在問題處理前回報受阻，AI 不自行裁定。" })] }), /* @__PURE__ */ (0, l.jsx)("button", {
              className: "btn",
              disabled: Ue,
              onClick: () => V(!z),
              children: "登記矛盾或缺件"
            })]
          }),
          z && /* @__PURE__ */ (0, l.jsxs)("form", {
            className: "context-form",
            onSubmit: async (h) => {
              h.preventDefault(), await m("add_knowledge_problem", {
                type: R.type,
                scope: {
                  type: R.scopeType,
                  target: R.target
                },
                description: R.description,
                recordIds: []
              }) && (V(!1), re({
                ...R,
                description: ""
              }));
            },
            children: [
              /* @__PURE__ */ (0, l.jsxs)("div", {
                className: "context-form-grid",
                children: [
                  /* @__PURE__ */ (0, l.jsxs)("label", { children: ["問題種類", /* @__PURE__ */ (0, l.jsxs)("select", {
                    value: R.type,
                    onChange: (h) => re({
                      ...R,
                      type: h.target.value
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
                    value: R.scopeType,
                    onChange: (h) => re({
                      ...R,
                      scopeType: h.target.value,
                      target: ""
                    }),
                    children: Object.entries(co).map(([h, P]) => /* @__PURE__ */ (0, l.jsx)("option", {
                      value: h,
                      children: P
                    }, h))
                  })] }),
                  /* @__PURE__ */ (0, l.jsxs)("label", { children: ["範圍 ID", /* @__PURE__ */ (0, l.jsx)("input", {
                    required: R.scopeType !== "project",
                    disabled: R.scopeType === "project",
                    value: R.target,
                    onChange: (h) => re({
                      ...R,
                      target: h.target.value
                    })
                  })] })
                ]
              }),
              /* @__PURE__ */ (0, l.jsxs)("label", { children: ["問題與缺少的依據", /* @__PURE__ */ (0, l.jsx)("textarea", {
                required: !0,
                rows: 4,
                value: R.description,
                onChange: (h) => re({
                  ...R,
                  description: h.target.value
                })
              })] }),
              /* @__PURE__ */ (0, l.jsx)("button", {
                className: "btn primary",
                disabled: Ue,
                children: "保存待處理問題"
              })
            ]
          }),
          u.problems.map((h) => /* @__PURE__ */ (0, l.jsxs)("article", {
            className: "context-record",
            children: [
              /* @__PURE__ */ (0, l.jsxs)("div", {
                className: "issue-top",
                children: [/* @__PURE__ */ (0, l.jsxs)("span", {
                  className: "status " + (h.status === "open" ? "needs_revision" : "passed"),
                  children: [
                    h.type === "conflict" ? "資訊矛盾" : "資料缺件",
                    " · ",
                    h.status === "open" ? "待處理" : "作者已處理"
                  ]
                }), /* @__PURE__ */ (0, l.jsx)("small", { children: Wr(h.scope) })]
              }),
              /* @__PURE__ */ (0, l.jsx)("p", { children: h.description }),
              h.resolution && /* @__PURE__ */ (0, l.jsxs)("p", { children: ["處理結果：", h.resolution] }),
              h.status === "open" && (j === h.id ? /* @__PURE__ */ (0, l.jsxs)("form", {
                onSubmit: async (P) => {
                  P.preventDefault(), await m("resolve_knowledge_problem", {
                    problemId: h.id,
                    resolution: ze
                  }) && ($(""), he(""));
                },
                children: [
                  /* @__PURE__ */ (0, l.jsxs)("label", {
                    className: "form-field",
                    children: ["作者裁定／補件結果", /* @__PURE__ */ (0, l.jsx)("textarea", {
                      required: !0,
                      rows: 3,
                      value: ze,
                      onChange: (P) => he(P.target.value)
                    })]
                  }),
                  /* @__PURE__ */ (0, l.jsx)("p", {
                    className: "muted",
                    children: "若涉及設定變更，請另外確認新資料版本；問題結案不會自動修改有效資料。"
                  }),
                  /* @__PURE__ */ (0, l.jsx)("button", {
                    className: "btn primary",
                    disabled: Ue,
                    children: "作者確認處理完成"
                  })
                ]
              }) : /* @__PURE__ */ (0, l.jsx)("button", {
                className: "btn",
                disabled: Ue,
                onClick: () => {
                  $(h.id), he("");
                },
                children: "填寫作者處理結果"
              }))
            ]
          }, h.id)),
          !u.problems.length && /* @__PURE__ */ (0, l.jsx)("p", {
            className: "muted",
            children: "目前沒有登記矛盾或缺件。資料包仍會檢查必要資料種類。"
          })
        ] }) : d === "packet" ? /* @__PURE__ */ (0, l.jsxs)(l.Fragment, { children: [
          /* @__PURE__ */ (0, l.jsx)("div", {
            className: "section-title",
            children: /* @__PURE__ */ (0, l.jsxs)("div", { children: [/* @__PURE__ */ (0, l.jsx)("h2", { children: "指定任務的工作資料包" }), /* @__PURE__ */ (0, l.jsx)("p", { children: "保存當下版本；任何更新後均需重新取得，避免沿用舊依據。" })] })
          }),
          /* @__PURE__ */ (0, l.jsxs)("form", {
            className: "context-form",
            onSubmit: async (h) => {
              h.preventDefault();
              const P = await m("create_context_pack", {
                task: X,
                stageId: H,
                sceneId: te,
                shotId: ce,
                purpose: pe,
                recordKeys: pe === "documentation" ? W.split(/[,，\n]/).map((We) => We.trim()).filter(Boolean) : void 0
              });
              P && ae(vl(P).packs.at(-1).id);
            },
            children: [
              /* @__PURE__ */ (0, l.jsxs)("label", { children: ["工作用途", /* @__PURE__ */ (0, l.jsxs)("select", {
                value: pe,
                onChange: (h) => J(h.target.value),
                children: [/* @__PURE__ */ (0, l.jsx)("option", {
                  value: "production",
                  children: "素材製作／檢視"
                }), /* @__PURE__ */ (0, l.jsx)("option", {
                  value: "documentation",
                  children: "資料整理／補登"
                })]
              })] }),
              pe === "documentation" && /* @__PURE__ */ (0, l.jsxs)("label", { children: ["本次來源識別鍵", /* @__PURE__ */ (0, l.jsx)("textarea", {
                required: !0,
                rows: 2,
                value: W,
                onChange: (h) => le(h.target.value),
                placeholder: "以逗號分隔，最多20筆；可從製作資料或鏡頭關聯取得"
              })] }),
              /* @__PURE__ */ (0, l.jsxs)("label", { children: ["本次任務", /* @__PURE__ */ (0, l.jsx)("textarea", {
                required: !0,
                rows: 2,
                maxLength: 2e3,
                placeholder: "例如：檢查 S06 指定鏡頭的母親座位與場景一致性",
                value: X,
                onChange: (h) => oe(h.target.value)
              })] }),
              /* @__PURE__ */ (0, l.jsxs)("div", {
                className: "context-form-grid",
                children: [
                  /* @__PURE__ */ (0, l.jsxs)("label", { children: ["階段 ID（選填）", /* @__PURE__ */ (0, l.jsx)("input", {
                    placeholder: "例如 08、op01",
                    value: H,
                    onChange: (h) => F(h.target.value)
                  })] }),
                  /* @__PURE__ */ (0, l.jsxs)("label", { children: ["場次 ID（選填）", /* @__PURE__ */ (0, l.jsx)("input", {
                    placeholder: "例如 S06",
                    value: te,
                    onChange: (h) => ge(h.target.value)
                  })] }),
                  /* @__PURE__ */ (0, l.jsxs)("label", { children: ["鏡頭 ID（選填）", /* @__PURE__ */ (0, l.jsx)("input", {
                    placeholder: "素材總表的固定鏡頭 ID",
                    value: ce,
                    onChange: (h) => I(h.target.value)
                  })] })
                ]
              }),
              /* @__PURE__ */ (0, l.jsx)("button", {
                className: "btn primary",
                disabled: Ue,
                children: "建立並保存資料包"
              })
            ]
          }),
          je ? /* @__PURE__ */ (0, l.jsx)("div", {
            className: "context-pack",
            children: me(je)
          }) : /* @__PURE__ */ (0, l.jsx)("p", {
            className: "muted",
            children: "尚未建立資料包。AI 可透過 acquire_animation_context 取得同一份資料。"
          }),
          je?.purpose === "documentation" && je.projectRevision === r.revision && /* @__PURE__ */ (0, l.jsxs)("details", { children: [/* @__PURE__ */ (0, l.jsx)("summary", { children: "回報本次資料整理結果" }), /* @__PURE__ */ (0, l.jsxs)("form", {
            className: "context-form",
            onSubmit: async (h) => {
              h.preventDefault(), await m("submit_ai_work", {
                contextPackId: je.id,
                resultId: crypto.randomUUID(),
                status: "completed",
                summary: Q,
                nextStep: G,
                recordIds: je.records.map((P) => P.id),
                observations: je.records.map((P) => ({
                  recordId: P.id,
                  version: P.version,
                  note: ne[P.id] ?? ""
                })),
                artifacts: [{
                  location: se,
                  version: f,
                  description: K
                }]
              });
            },
            children: [
              /* @__PURE__ */ (0, l.jsxs)("label", { children: ["本次完成內容", /* @__PURE__ */ (0, l.jsx)("textarea", {
                required: !0,
                rows: 3,
                value: Q,
                onChange: (h) => B(h.target.value)
              })] }),
              /* @__PURE__ */ (0, l.jsxs)("label", { children: ["下一位 AI 接手動作", /* @__PURE__ */ (0, l.jsx)("textarea", {
                required: !0,
                rows: 3,
                value: G,
                onChange: (h) => fe(h.target.value)
              })] }),
              je.records.map((h) => /* @__PURE__ */ (0, l.jsxs)("label", { children: [
                "實際閱讀依據｜",
                h.title,
                /* @__PURE__ */ (0, l.jsx)("textarea", {
                  required: !0,
                  rows: 2,
                  maxLength: 3e3,
                  value: ne[h.id] ?? "",
                  onChange: (P) => Se({
                    ...ne,
                    [h.id]: P.target.value
                  })
                })
              ] }, h.id)),
              /* @__PURE__ */ (0, l.jsxs)("label", { children: ["整理成果位置", /* @__PURE__ */ (0, l.jsx)("input", {
                required: !0,
                maxLength: 2e3,
                value: se,
                onChange: (h) => Z(h.target.value)
              })] }),
              /* @__PURE__ */ (0, l.jsxs)("label", { children: ["整理成果版本", /* @__PURE__ */ (0, l.jsx)("input", {
                required: !0,
                maxLength: 100,
                value: f,
                onChange: (h) => D(h.target.value)
              })] }),
              /* @__PURE__ */ (0, l.jsxs)("label", { children: ["整理成果說明", /* @__PURE__ */ (0, l.jsx)("input", {
                required: !0,
                maxLength: 2e3,
                value: K,
                onChange: (h) => ee(h.target.value)
              })] }),
              /* @__PURE__ */ (0, l.jsx)("button", {
                className: "btn primary",
                disabled: Ue,
                children: "保存資料整理結果"
              })
            ]
          })] }),
          u.packs.length > 1 && /* @__PURE__ */ (0, l.jsxs)("details", { children: [/* @__PURE__ */ (0, l.jsxs)("summary", { children: [
            "先前資料包（",
            u.packs.length - 1,
            "）"
          ] }), [...u.packs].reverse().map((h) => /* @__PURE__ */ (0, l.jsxs)("button", {
            className: "text-btn",
            onClick: () => ae(h.id),
            children: [
              h.task,
              " · 版本 ",
              h.projectRevision
            ]
          }, h.id))] })
        ] }) : /* @__PURE__ */ (0, l.jsxs)(l.Fragment, { children: [
          /* @__PURE__ */ (0, l.jsx)("div", {
            className: "section-title",
            children: /* @__PURE__ */ (0, l.jsxs)("div", { children: [/* @__PURE__ */ (0, l.jsx)("h2", { children: "AI 工作接續紀錄" }), /* @__PURE__ */ (0, l.jsx)("p", { children: "依資料包回寫使用版本、實際閱讀自述、成果位置與下一步。" })] })
          }),
          [...u.results].reverse().map((h) => /* @__PURE__ */ (0, l.jsxs)("article", {
            className: "context-record",
            children: [
              /* @__PURE__ */ (0, l.jsxs)("div", {
                className: "issue-top",
                children: [/* @__PURE__ */ (0, l.jsx)("span", {
                  className: "status " + (h.needsReview ? "needs_revision" : h.status === "blocked" ? "todo" : "candidate"),
                  children: h.needsReview ? u.packs.find((P) => P.id === h.packId)?.purpose === "documentation" ? "採用設定已更新，接手前讀取新版本" : "依據已變更，需重驗" : h.status === "completed" ? u.packs.find((P) => P.id === h.packId)?.purpose === "documentation" ? "資料整理完成" : "AI 回報完成，待作者驗收" : h.status === "partial" ? "部分完成" : "受阻"
                }), /* @__PURE__ */ (0, l.jsx)("b", { children: h.task })]
              }),
              /* @__PURE__ */ (0, l.jsx)("p", { children: h.summary }),
              /* @__PURE__ */ (0, l.jsxs)("div", {
                className: "context-source",
                children: [/* @__PURE__ */ (0, l.jsx)("b", { children: "下一步" }), /* @__PURE__ */ (0, l.jsx)("p", { children: h.nextStep })]
              }),
              h.needsReview && /* @__PURE__ */ (0, l.jsx)("p", {
                className: "red-text",
                children: h.reviewReason
              }),
              h.artifacts.map((P, We) => /* @__PURE__ */ (0, l.jsxs)("p", { children: [
                P.description,
                " · ",
                P.version,
                /* @__PURE__ */ (0, l.jsx)("code", {
                  className: "context-id",
                  children: P.location
                })
              ] }, We)),
              /* @__PURE__ */ (0, l.jsxs)("details", { children: [/* @__PURE__ */ (0, l.jsx)("summary", { children: "使用版本與閱讀自述" }), /* @__PURE__ */ (0, l.jsx)("pre", { children: JSON.stringify({
                packId: h.packId,
                recordIds: h.recordIds,
                observations: h.observations
              }, null, 2) })] })
            ]
          }, h.id)),
          !u.results.length && /* @__PURE__ */ (0, l.jsxs)("div", {
            className: "empty",
            children: [/* @__PURE__ */ (0, l.jsx)("h3", { children: "等待 AI 回報工作" }), /* @__PURE__ */ (0, l.jsx)("p", { children: "工具 submit_animation_work 會保存結果與交接內容。" })]
          })
        ] })
      })
    ]
  });
}
var Tf = [
  ["coverage", "原作與改編範圍"],
  ["endingState", "本集結尾狀態"],
  ["characters", "人物狀態與關係"],
  ["revealed", "已揭露資訊與邊界"],
  ["unresolved", "尚未確定的內容"],
  ["carryRules", "後續集數沿用規則"],
  ["nextSteps", "下一步與接手順序"],
  ["sources", "來源與版本說明"]
], xf = {
  title: "",
  coverage: "",
  endingState: "",
  characters: "",
  revealed: "",
  unresolved: "",
  carryRules: "",
  nextSteps: "",
  sources: ""
}, cx = {
  completed: "作者告知已完成",
  in_progress: "作者告知製作中",
  not_started: "作者告知尚未開始"
};
function Pr({ h: r, target: m }) {
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
      Tf.map(([_, u]) => /* @__PURE__ */ (0, l.jsxs)("div", {
        className: "context-mini",
        children: [/* @__PURE__ */ (0, l.jsx)("b", { children: u }), /* @__PURE__ */ (0, l.jsx)("p", {
          className: "production-source-text",
          children: r[_]
        })]
      }, _)),
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
function rx({ project: r, episodes: m, busy: _, mutate: u }) {
  const d = r.production?.completionReports?.at(-1), T = r.production?.handoffs?.at(-1), v = m.filter((I) => I.workId === r.workId && I.id !== r.id), [M, w] = (0, N.useState)("completed"), [k, z] = (0, N.useState)(""), [V, R] = (0, N.useState)(""), [re, pe] = (0, N.useState)(""), [J, W] = (0, N.useState)(xf), [le, X] = (0, N.useState)(""), [oe, H] = (0, N.useState)([]), [F, te] = (0, N.useState)("");
  (0, N.useEffect)(() => {
    w(d?.status ?? "completed"), z(d?.note ?? ""), R(d?.source ?? ""), pe(T?.toEpisodeId ?? ""), W(T ?? xf), X(T?.sourceKeys.join(", ") ?? "");
  }, [
    r.id,
    d?.at,
    T?.id
  ]), (0, N.useEffect)(() => {
    let I = !0;
    return H([]), fetch("/api/projects?id=" + encodeURIComponent(r.id) + "&view=brief", { cache: "no-store" }).then(async (j) => {
      const $ = await j.json();
      if (!j.ok) throw new Error($.error ?? "接續資料讀取失敗");
      I && (H($.incoming), te(""));
    }).catch((j) => {
      I && te(j.message);
    }), () => {
      I = !1;
    };
  }, [r.id, r.revision]);
  const ge = oo(r).registration, ce = _ || r.archived;
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
          /* @__PURE__ */ (0, l.jsx)("b", { children: d ? cx[d.status] : "製作狀態尚未登記" }),
          /* @__PURE__ */ (0, l.jsxs)("span", { children: [
            ge.acceptedSources,
            " / ",
            ge.sources,
            " 筆來源已收錄"
          ] }),
          /* @__PURE__ */ (0, l.jsxs)("span", { children: [
            ge.linkedShots,
            " / ",
            ge.shots,
            " 列鏡頭有關聯"
          ] }),
          /* @__PURE__ */ (0, l.jsxs)("span", { children: [ge.registeredSelections, " 列已登記採用檔"] })
        ]
      }),
      d && /* @__PURE__ */ (0, l.jsxs)(l.Fragment, { children: [/* @__PURE__ */ (0, l.jsx)("p", { children: d.note }), /* @__PURE__ */ (0, l.jsxs)("small", { children: ["作者告知依據：", d.source] })] }),
      /* @__PURE__ */ (0, l.jsx)("p", {
        className: "inline-note",
        children: "製作完成、資料補登及素材實際檢視各自記錄。未登記檔案位置不等於尚未製作。"
      }),
      /* @__PURE__ */ (0, l.jsxs)("details", { children: [/* @__PURE__ */ (0, l.jsx)("summary", { children: "補登本集製作狀態" }), /* @__PURE__ */ (0, l.jsxs)("form", {
        className: "context-form",
        onSubmit: async (I) => {
          I.preventDefault(), await u("report_episode_completion", {
            status: M,
            note: k,
            source: V
          });
        },
        children: [
          /* @__PURE__ */ (0, l.jsxs)("label", { children: ["作者告知的製作狀態", /* @__PURE__ */ (0, l.jsxs)("select", {
            value: M,
            onChange: (I) => w(I.target.value),
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
            value: k,
            onChange: (I) => z(I.target.value)
          })] }),
          /* @__PURE__ */ (0, l.jsxs)("label", { children: ["告知來源", /* @__PURE__ */ (0, l.jsx)("input", {
            required: !0,
            maxLength: 2e3,
            value: V,
            onChange: (I) => R(I.target.value)
          })] }),
          /* @__PURE__ */ (0, l.jsx)("button", {
            className: "btn primary",
            disabled: ce,
            children: "保存作者告知狀態"
          })
        ]
      })] }),
      F && /* @__PURE__ */ (0, l.jsx)("p", {
        role: "alert",
        children: F
      }),
      oe.map((I) => /* @__PURE__ */ (0, l.jsxs)("details", {
        className: "production-record",
        children: [/* @__PURE__ */ (0, l.jsxs)("summary", { children: [/* @__PURE__ */ (0, l.jsxs)("b", { children: [
          "來自 ",
          I.fromEpisode,
          " 的接續資料"
        ] }), /* @__PURE__ */ (0, l.jsxs)("span", { children: [
          "v",
          I.handoff.version,
          " · 來源集數紀錄版本 ",
          I.fromRevision
        ] })] }), /* @__PURE__ */ (0, l.jsx)(Pr, {
          h: I.handoff,
          target: r.episode
        })]
      }, I.handoff.id)),
      T ? /* @__PURE__ */ (0, l.jsxs)("details", {
        className: "production-record",
        children: [/* @__PURE__ */ (0, l.jsxs)("summary", { children: [/* @__PURE__ */ (0, l.jsxs)("b", { children: ["交接至 ", m.find((I) => I.id === T.toEpisodeId)?.episode ?? "指定集數"] }), /* @__PURE__ */ (0, l.jsxs)("span", { children: ["接續資料 v", T.version] })] }), /* @__PURE__ */ (0, l.jsx)(Pr, {
          h: T,
          target: m.find((I) => I.id === T.toEpisodeId)?.episode ?? "指定集數"
        })]
      }) : /* @__PURE__ */ (0, l.jsx)("p", {
        className: "muted",
        children: "尚未保存本集對後續集數的交接資料。"
      }),
      /* @__PURE__ */ (0, l.jsxs)("details", { children: [/* @__PURE__ */ (0, l.jsx)("summary", { children: T ? "更新接續資料版本" : "補登跨集接續資料" }), v.length ? /* @__PURE__ */ (0, l.jsxs)("form", {
        className: "context-form",
        onSubmit: async (I) => {
          I.preventDefault(), await u("save_episode_handoff", {
            ...J,
            toEpisodeId: re || v[0].id,
            baseVersion: T?.version ?? 0,
            sourceKeys: le.split(/[,，\n]/).map((j) => j.trim()).filter(Boolean)
          });
        },
        children: [
          /* @__PURE__ */ (0, l.jsxs)("label", { children: ["接續目標集數", /* @__PURE__ */ (0, l.jsx)("select", {
            value: re || v[0].id,
            onChange: (I) => pe(I.target.value),
            children: v.map((I) => /* @__PURE__ */ (0, l.jsxs)("option", {
              value: I.id,
              children: [
                I.episode,
                " · ",
                I.title
              ]
            }, I.id))
          })] }),
          /* @__PURE__ */ (0, l.jsxs)("label", { children: ["接續資料名稱", /* @__PURE__ */ (0, l.jsx)("input", {
            required: !0,
            maxLength: 200,
            value: J.title,
            onChange: (I) => W({
              ...J,
              title: I.target.value
            })
          })] }),
          Tf.map(([I, j]) => /* @__PURE__ */ (0, l.jsxs)("label", { children: [j, /* @__PURE__ */ (0, l.jsx)("textarea", {
            required: !0,
            rows: 3,
            maxLength: 6e3,
            value: J[I],
            onChange: ($) => W({
              ...J,
              [I]: $.target.value
            })
          })] }, I)),
          /* @__PURE__ */ (0, l.jsxs)("label", { children: ["來源識別鍵（逗號分隔）", /* @__PURE__ */ (0, l.jsx)("textarea", {
            rows: 2,
            value: le,
            onChange: (I) => X(I.target.value)
          })] }),
          /* @__PURE__ */ (0, l.jsx)("button", {
            className: "btn primary",
            disabled: ce,
            children: "保存接續資料版本"
          })
        ]
      }) : /* @__PURE__ */ (0, l.jsx)("p", { children: "先在作品專案新增下一集，再建立交接。" })] }),
      (r.production?.handoffs?.length ?? 0) > 1 && /* @__PURE__ */ (0, l.jsxs)("details", { children: [/* @__PURE__ */ (0, l.jsxs)("summary", { children: [
        "先前接續版本（",
        r.production.handoffs.length - 1,
        "）"
      ] }), r.production.handoffs.slice(0, -1).map((I) => /* @__PURE__ */ (0, l.jsx)(Pr, {
        h: I,
        target: m.find((j) => j.id === I.toEpisodeId)?.episode ?? I.toEpisodeId
      }, I.id))] }),
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
var eo = {
  key: "",
  title: "",
  kind: "reference",
  content: "",
  source: "",
  location: "",
  baseVersion: void 0
};
function ox({ work: r, episode: m, episodes: _, busy: u, onWorkAction: d, onSelectEpisode: T, onPin: v, mutate: M }) {
  const [w, k] = (0, N.useState)(m.title.split("｜")[0]), [z, V] = (0, N.useState)(""), [R, re] = (0, N.useState)(""), [pe, J] = (0, N.useState)(""), [W, le] = (0, N.useState)(""), [X, oe] = (0, N.useState)(""), [H, F] = (0, N.useState)(eo), [te, ge] = (0, N.useState)(!1);
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
          g.preventDefault(), await d("convert_episode", {
            title: w,
            episodeId: m.id,
            episodeRevision: m.revision
          });
        },
        children: [/* @__PURE__ */ (0, l.jsxs)("label", { children: ["作品專案名稱", /* @__PURE__ */ (0, l.jsx)("input", {
          required: !0,
          maxLength: 200,
          value: w,
          onChange: (g) => k(g.target.value)
        })] }), /* @__PURE__ */ (0, l.jsx)("button", {
          className: "btn primary",
          disabled: u,
          children: "建立作品專案並保留本集"
        })]
      })
    ]
  });
  const ce = _.filter((g) => g.workId === r.id).sort((g, ae) => g.episode.localeCompare(ae.episode, void 0, { numeric: !0 })), I = Math.max(0, ...ce.map((g) => Number(g.episode.replace(/^EP/i, "")) || 0)) + 1, j = "EP" + String(I).padStart(2, "0"), $ = [...new Map(r.sharedAssets.map((g) => [g.key, g])).values()], ze = $.filter((g) => !pe || [
    g.key,
    g.title,
    g.content,
    g.source
  ].join(" ").toLowerCase().includes(pe.toLowerCase()));
  function he(g) {
    F({
      key: g.key,
      title: g.title,
      kind: g.kind,
      content: g.content,
      source: g.source,
      location: g.location,
      baseVersion: g.version
    }), ge(!0);
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
              /* @__PURE__ */ (0, l.jsxs)("b", { children: [ce.length, " 集"] }),
              /* @__PURE__ */ (0, l.jsxs)("b", { children: [$.length, " 項共用來源"] }),
              /* @__PURE__ */ (0, l.jsx)("span", { children: "各集保留自己的劇本、進度與採用版本。" })
            ]
          }),
          /* @__PURE__ */ (0, l.jsx)("div", {
            className: "episode-grid",
            children: ce.map((g) => /* @__PURE__ */ (0, l.jsxs)("button", {
              className: "episode-card " + (g.id === m.id ? "selected" : ""),
              disabled: u,
              onClick: () => T(g.id),
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
              g.preventDefault(), await d("create_episode", {
                episode: z || j,
                title: R || `${z || j} 製作資料`
              }) && (V(""), re(""));
            },
            children: [
              /* @__PURE__ */ (0, l.jsxs)("div", {
                className: "context-form-grid",
                children: [/* @__PURE__ */ (0, l.jsxs)("label", { children: ["新集數", /* @__PURE__ */ (0, l.jsx)("input", {
                  required: !0,
                  pattern: "[Ee][Pp][0-9]{2,4}",
                  value: z || j,
                  onChange: (g) => V(g.target.value),
                  placeholder: "EP02"
                })] }), /* @__PURE__ */ (0, l.jsxs)("label", { children: ["本集名稱", /* @__PURE__ */ (0, l.jsx)("input", {
                  maxLength: 200,
                  value: R,
                  onChange: (g) => re(g.target.value),
                  placeholder: `${z || j} 製作資料`
                })] })]
              }),
              /* @__PURE__ */ (0, l.jsx)("p", {
                className: "muted",
                children: "建立空白流程；EP01 的劇情、鏡頭及完成狀態不會複製到下一集。"
              }),
              /* @__PURE__ */ (0, l.jsx)("button", {
                className: "btn primary",
                disabled: u,
                children: "建立新集數"
              })
            ]
          })] })
        ]
      }),
      /* @__PURE__ */ (0, l.jsx)(rx, {
        project: m,
        episodes: _,
        busy: u,
        mutate: M
      }),
      /* @__PURE__ */ (0, l.jsxs)("div", {
        className: "wide-card",
        children: [
          /* @__PURE__ */ (0, l.jsxs)("div", {
            className: "section-title",
            children: [/* @__PURE__ */ (0, l.jsxs)("div", { children: [/* @__PURE__ */ (0, l.jsx)("h2", { children: "作品共用資料" }), /* @__PURE__ */ (0, l.jsx)("p", { children: "原作、角色、場景、世界設定及聲線參考。連結到集數時保存指定版本，之後更新共用資料仍保留各集原先使用的版本。" })] }), /* @__PURE__ */ (0, l.jsx)("button", {
              className: "btn",
              disabled: u,
              onClick: () => {
                F(eo), ge(!te);
              },
              children: "新增共用參考"
            })]
          }),
          te && /* @__PURE__ */ (0, l.jsxs)("form", {
            className: "context-form",
            onSubmit: async (g) => {
              g.preventDefault(), await d("save_shared_asset", H) && (ge(!1), F(eo));
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
                    onChange: (g) => F({
                      ...H,
                      key: g.target.value
                    })
                  })] }),
                  /* @__PURE__ */ (0, l.jsxs)("label", { children: ["共用名稱", /* @__PURE__ */ (0, l.jsx)("input", {
                    required: !0,
                    maxLength: 200,
                    value: H.title,
                    onChange: (g) => F({
                      ...H,
                      title: g.target.value
                    })
                  })] }),
                  /* @__PURE__ */ (0, l.jsxs)("label", { children: ["資料種類", /* @__PURE__ */ (0, l.jsx)("select", {
                    value: H.kind,
                    onChange: (g) => F({
                      ...H,
                      kind: g.target.value
                    }),
                    children: [
                      ["reference", "原作／參考"],
                      ["character", "角色"],
                      ["scene", "場景"],
                      ["rule", "世界設定／規則"],
                      ["audio", "聲線／聲音"],
                      ["script", "文本"]
                    ].map(([g, ae]) => /* @__PURE__ */ (0, l.jsx)("option", {
                      value: g,
                      children: ae
                    }, g))
                  })] })
                ]
              }),
              /* @__PURE__ */ (0, l.jsxs)("label", { children: ["完整內容", /* @__PURE__ */ (0, l.jsx)("textarea", {
                required: !0,
                rows: 7,
                maxLength: 12e3,
                value: H.content,
                onChange: (g) => F({
                  ...H,
                  content: g.target.value
                })
              })] }),
              /* @__PURE__ */ (0, l.jsxs)("label", { children: ["來源", /* @__PURE__ */ (0, l.jsx)("input", {
                required: !0,
                maxLength: 2e3,
                value: H.source,
                onChange: (g) => F({
                  ...H,
                  source: g.target.value
                })
              })] }),
              /* @__PURE__ */ (0, l.jsxs)("label", { children: ["素材位置", /* @__PURE__ */ (0, l.jsx)("input", {
                maxLength: 2e3,
                value: H.location,
                onChange: (g) => F({
                  ...H,
                  location: g.target.value
                })
              })] }),
              /* @__PURE__ */ (0, l.jsx)("button", {
                className: "btn primary",
                disabled: u,
                children: H.baseVersion ? "保存新版本" : "保存共用來源"
              })
            ]
          }),
          /* @__PURE__ */ (0, l.jsxs)("label", {
            className: "work-search",
            children: ["搜尋共用資料", /* @__PURE__ */ (0, l.jsx)("input", {
              placeholder: "原作章名、角色、場景或設定",
              value: pe,
              onChange: (g) => J(g.target.value)
            })]
          }),
          /* @__PURE__ */ (0, l.jsxs)("p", {
            className: "muted",
            children: [
              ze.length,
              " 項來源；目前連結目標為 ",
              m.episode,
              "。"
            ]
          }),
          ze.slice(0, 60).map((g) => /* @__PURE__ */ (0, l.jsxs)("details", {
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
                  _.find((ae) => ae.id === g.originEpisodeId)?.episode ?? g.originEpisodeId,
                  "；按本集需求選用。"
                ]
              }),
              /* @__PURE__ */ (0, l.jsxs)("div", {
                className: "context-actions",
                children: [/* @__PURE__ */ (0, l.jsx)("button", {
                  className: "btn",
                  disabled: u || !!m.sharedPins?.some((ae) => ae.assetId === g.id),
                  onClick: () => {
                    v(g.id);
                  },
                  children: m.sharedPins?.some((ae) => ae.assetId === g.id) ? `${m.episode} 已連結此版本` : `連結此版本至 ${m.episode}`
                }), /* @__PURE__ */ (0, l.jsx)("button", {
                  className: "btn",
                  disabled: u,
                  onClick: () => he(g),
                  children: "建立新版本"
                })]
              }),
              (m.sharedPins?.filter((ae) => ae.assetKey === g.key).at(-1)?.version ?? g.version) < g.version && /* @__PURE__ */ (0, l.jsx)("p", {
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
                value: W,
                onChange: (g) => {
                  le(g.target.value), oe("");
                }
              })] }),
              X && /* @__PURE__ */ (0, l.jsx)("p", {
                role: "alert",
                children: X
              }),
              /* @__PURE__ */ (0, l.jsx)("button", {
                className: "btn primary",
                disabled: u || !W.trim(),
                onClick: async () => {
                  try {
                    const g = JSON.parse(W);
                    if (!Array.isArray(g.assets)) throw new Error("缺少 assets 清單");
                    await d("import_shared_assets", { assets: g.assets }) && le("");
                  } catch (g) {
                    oe(g instanceof Error ? g.message : "格式錯誤");
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
var gf = {
  key: "",
  title: "",
  world: "real",
  label: "v2_candidate",
  sourceLocation: "",
  sourceVersion: "",
  backupLocation: "",
  sha256: "",
  reference: ""
}, dx = {
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
function ux({ initialSelection: r, work: m, episode: _, episodes: u, busy: d, onAction: T, onProject: v, onDirty: M }) {
  const [w, k] = (0, N.useState)(r?.modelId ?? ""), [z, V] = (0, N.useState)(r?.versionId ?? ""), [R, re] = (0, N.useState)(r?.stageId ?? "M01"), [pe, J] = (0, N.useState)(null), [W, le] = (0, N.useState)(gf), [X, oe] = (0, N.useState)(""), H = m ? Cs(m) : null, F = H?.models.find((O) => O.id === w) ?? H?.models[0], te = F?.versions.find((O) => O.id === z) ?? F?.versions.at(-1), ge = te?.stages[R], ce = Na.find((O) => O.id === R);
  function I(O) {
    Ne(O), M(O);
  }
  const [j, $] = (0, N.useState)([]), [ze, he] = (0, N.useState)(""), [g, ae] = (0, N.useState)(""), [Q, B] = (0, N.useState)(""), [G, fe] = (0, N.useState)(""), [se, Z] = (0, N.useState)(""), [f, D] = (0, N.useState)("technical"), [K, ee] = (0, N.useState)({}), [ne, Se] = (0, N.useState)(""), [je, Be] = (0, N.useState)(""), [Ee, Ne] = (0, N.useState)(!1);
  (0, N.useEffect)(() => {
    ge && ($(ge.checks), he(ge.evidence), ae(ge.summary), B(ge.nextStep), fe(te.candidateLocation), I(!1));
  }, [ge, te]), (0, N.useEffect)(() => {
    if (!Ee) return;
    const O = (we) => we.preventDefault();
    return window.addEventListener("beforeunload", O), () => window.removeEventListener("beforeunload", O);
  }, [Ee]);
  function Re(O) {
    Ee && !window.confirm("有未儲存模型紀錄，要放棄修改嗎？") || (I(!1), oe(""), O());
  }
  async function Ue(O, we) {
    oe("");
    const it = await T(O, we);
    return it && I(!1), it;
  }
  function y() {
    !F || !te || (le({
      key: F.key,
      title: F.title,
      world: F.world,
      label: "v" + (te.number + 2) + "_candidate",
      sourceLocation: te.sourceLocation,
      sourceVersion: te.sourceVersion,
      backupLocation: te.backupLocation,
      sha256: te.sha256,
      reference: te.reference
    }), J("version"));
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
  const ie = H.issues.filter((O) => O.modelId === F?.id && O.versionId === te?.id), me = ie.filter((O) => O.status === "open"), h = !!te?.stages.M08.author, P = F && te ? Ym(m, F.id, te.id, R) : [], We = H.pins.filter((O) => O.episodeId === _.id), jt = new Map(We.map((O) => [[O.modelId, O.sceneIds].join("|"), O]));
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
            /* @__PURE__ */ (0, l.jsxs)("h2", { children: [/* @__PURE__ */ (0, l.jsx)(io, { size: 23 }), "模型製作與完善"] }),
            /* @__PURE__ */ (0, l.jsxs)("p", { children: [m.title, " · 各模型、各候選及各集引用分開記錄。"] })
          ] }), /* @__PURE__ */ (0, l.jsxs)("button", {
            className: "btn primary",
            disabled: d,
            onClick: () => Re(() => {
              le(gf), J("register");
            }),
            children: [/* @__PURE__ */ (0, l.jsx)(Pt, { size: 15 }), "登記模型"]
          })]
        }), /* @__PURE__ */ (0, l.jsxs)("div", {
          className: "model-principles",
          children: [
            /* @__PURE__ */ (0, l.jsxs)("span", { children: [/* @__PURE__ */ (0, l.jsx)(bl, { size: 15 }), "先讀原檔與設定"] }),
            /* @__PURE__ */ (0, l.jsxs)("span", { children: [/* @__PURE__ */ (0, l.jsx)(no, { size: 15 }), "保留原檔及版本"] }),
            /* @__PURE__ */ (0, l.jsxs)("span", { children: [/* @__PURE__ */ (0, l.jsx)(gl, { size: 15 }), "技術、視覺與採用分開"] })
          ]
        })]
      }),
      pe && /* @__PURE__ */ (0, l.jsxs)("form", {
        className: "wide-card context-form model-register",
        onSubmit: async (O) => {
          O.preventDefault();
          const we = await Ue(pe === "register" ? "register_model" : "create_model_version", {
            ...W,
            modelId: F?.id
          });
          if (we) {
            const it = pe === "register" ? we.work.modelFlow?.models.at(-1) : we.work.modelFlow?.models.find((Jt) => Jt.id === F?.id);
            J(null), k(it?.id ?? ""), V(it?.versions.at(-1)?.id ?? ""), re("M01");
          }
        },
        children: [
          /* @__PURE__ */ (0, l.jsxs)("div", {
            className: "section-title",
            children: [/* @__PURE__ */ (0, l.jsx)("h3", { children: pe === "register" ? "登記模型來源" : "建立新候選版本" }), /* @__PURE__ */ (0, l.jsx)("button", {
              className: "text-btn",
              type: "button",
              onClick: () => J(null),
              children: "關閉"
            })]
          }),
          /* @__PURE__ */ (0, l.jsxs)("div", {
            className: "context-form-grid",
            children: [
              pe === "register" && /* @__PURE__ */ (0, l.jsxs)(l.Fragment, { children: [
                /* @__PURE__ */ (0, l.jsxs)("label", { children: ["模型固定識別鍵 *", /* @__PURE__ */ (0, l.jsx)("input", {
                  required: !0,
                  maxLength: 100,
                  value: W.key,
                  placeholder: "RG-REAL-01",
                  onChange: (O) => le({
                    ...W,
                    key: O.target.value
                  })
                })] }),
                /* @__PURE__ */ (0, l.jsxs)("label", { children: ["模型名稱 *", /* @__PURE__ */ (0, l.jsx)("input", {
                  required: !0,
                  maxLength: 200,
                  value: W.title,
                  placeholder: "現實主角家",
                  onChange: (O) => le({
                    ...W,
                    title: O.target.value
                  })
                })] }),
                /* @__PURE__ */ (0, l.jsxs)("label", { children: ["世界／場景分類", /* @__PURE__ */ (0, l.jsxs)("select", {
                  value: W.world,
                  onChange: (O) => le({
                    ...W,
                    world: O.target.value
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
                value: W.label,
                onChange: (O) => le({
                  ...W,
                  label: O.target.value
                })
              })] }),
              [
                ["sourceLocation", "正式來源 GLB 位置 *"],
                ["sourceVersion", "來源版本／清單版本 *"],
                ["backupLocation", "原檔備份位置"],
                ["sha256", "原檔 SHA-256（實際計算值）"]
              ].map(([O, we]) => /* @__PURE__ */ (0, l.jsxs)("label", { children: [we, /* @__PURE__ */ (0, l.jsx)("input", {
                required: O === "sourceLocation" || O === "sourceVersion",
                maxLength: O === "sha256" ? 64 : 2e3,
                pattern: O === "sha256" ? "[a-fA-F0-9]{64}" : void 0,
                value: W[O],
                onChange: (it) => le({
                  ...W,
                  [O]: it.target.value
                })
              })] }, O))
            ]
          }),
          /* @__PURE__ */ (0, l.jsxs)("label", { children: ["設定與尺度來源／不可改動項目", /* @__PURE__ */ (0, l.jsx)("textarea", {
            rows: 4,
            maxLength: 12e3,
            value: W.reference,
            onChange: (O) => le({
              ...W,
              reference: O.target.value
            }),
            placeholder: "設計書與平面圖版本、固定節點／家具 ID、單位、重大變更待核定項。"
          })] }),
          /* @__PURE__ */ (0, l.jsx)("p", {
            className: "muted",
            children: "來源會隨此版本保存。待補欄位可先留空，但原檔、備份與雜湊不齊時不能通過盤點；更正來源請另建版本。登記資料不會修改或上傳模型檔案。"
          }),
          /* @__PURE__ */ (0, l.jsx)("button", {
            className: "btn primary",
            disabled: d,
            children: "保存模型來源與空白流程"
          })
        ]
      }),
      !F || !te ? /* @__PURE__ */ (0, l.jsxs)("div", {
        className: "wide-card empty",
        children: [
          /* @__PURE__ */ (0, l.jsx)(io, { size: 36 }),
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
                  disabled: d,
                  onChange: (O) => Re(() => {
                    k(O.target.value), V(""), re("M01");
                  }),
                  children: H.models.map((O) => /* @__PURE__ */ (0, l.jsxs)("option", {
                    value: O.id,
                    children: [
                      O.key,
                      " · ",
                      O.title
                    ]
                  }, O.id))
                })] }),
                /* @__PURE__ */ (0, l.jsxs)("label", { children: ["精確版本", /* @__PURE__ */ (0, l.jsx)("select", {
                  value: te.id,
                  disabled: d,
                  onChange: (O) => Re(() => V(O.target.value)),
                  children: F.versions.map((O) => /* @__PURE__ */ (0, l.jsxs)("option", {
                    value: O.id,
                    children: [
                      "v",
                      O.number,
                      " · ",
                      O.label,
                      O.stages.M08.author ? "（曾採用）" : "",
                      F.adoptedVersionId === O.id ? "／目前採用" : ""
                    ]
                  }, O.id))
                })] }),
                /* @__PURE__ */ (0, l.jsxs)("button", {
                  className: "btn",
                  disabled: d,
                  onClick: () => Re(y),
                  children: [/* @__PURE__ */ (0, l.jsx)(Pt, { size: 14 }), "另建候選版本"]
                })
              ]
            }),
            /* @__PURE__ */ (0, l.jsxs)("div", {
              className: "production-totals",
              children: [
                /* @__PURE__ */ (0, l.jsxs)("b", { children: [Na.filter((O) => te.stages[O.id].author).length, " / 8 階段核定"] }),
                /* @__PURE__ */ (0, l.jsxs)("b", { children: [me.length, " 項待修或待裁定"] }),
                /* @__PURE__ */ (0, l.jsxs)("span", { children: [
                  F.world === "real" ? "現實場景" : F.world === "game" ? "遊戲場景" : "其他模型",
                  " · ",
                  h ? "此採用版本保持不變" : "候選製作中"
                ] })
              ]
            }),
            /* @__PURE__ */ (0, l.jsxs)("details", { children: [/* @__PURE__ */ (0, l.jsx)("summary", { children: "此版本來源與設定" }), /* @__PURE__ */ (0, l.jsxs)("dl", {
              className: "model-sources",
              children: [
                /* @__PURE__ */ (0, l.jsx)("dt", { children: "模型來源" }),
                /* @__PURE__ */ (0, l.jsxs)("dd", { children: [
                  te.sourceLocation,
                  " · ",
                  te.sourceVersion
                ] }),
                /* @__PURE__ */ (0, l.jsx)("dt", { children: "原檔備份" }),
                /* @__PURE__ */ (0, l.jsx)("dd", { children: te.backupLocation || "待補" }),
                /* @__PURE__ */ (0, l.jsx)("dt", { children: "SHA-256" }),
                /* @__PURE__ */ (0, l.jsx)("dd", { children: te.sha256 || "待實際計算" }),
                /* @__PURE__ */ (0, l.jsx)("dt", { children: "設定與尺度" }),
                /* @__PURE__ */ (0, l.jsx)("dd", { children: te.reference || "待補" }),
                /* @__PURE__ */ (0, l.jsx)("dt", { children: "候選 GLB" }),
                /* @__PURE__ */ (0, l.jsx)("dd", { children: te.candidateLocation || "尚未登記" })
              ]
            })] })
          ]
        }),
        /* @__PURE__ */ (0, l.jsx)("div", {
          className: "model-stage-grid",
          children: Na.map((O, we) => /* @__PURE__ */ (0, l.jsxs)("button", {
            disabled: d,
            className: "model-step " + (R === O.id ? "selected" : "") + (te.stages[O.id].author ? " passed" : ""),
            onClick: () => Re(() => re(O.id)),
            children: [
              /* @__PURE__ */ (0, l.jsx)("small", { children: O.id }),
              /* @__PURE__ */ (0, l.jsx)("b", { children: O.title }),
              /* @__PURE__ */ (0, l.jsx)("span", { children: te.stages[O.id].author ? "作者已確認" : te.stages[O.id].status === "needs_revision" ? "待修正" : te.stages[O.id].status === "candidate" ? "已有工作回報" : "待製作" })
            ]
          }, O.id))
        }),
        /* @__PURE__ */ (0, l.jsxs)("div", {
          className: "wide-card model-stage-detail",
          children: [
            /* @__PURE__ */ (0, l.jsxs)("div", {
              className: "section-title",
              children: [/* @__PURE__ */ (0, l.jsxs)("div", { children: [/* @__PURE__ */ (0, l.jsxs)("div", {
                className: "eyebrow",
                children: [
                  ce.id,
                  " · ",
                  F.title,
                  " · ",
                  te.label
                ]
              }), /* @__PURE__ */ (0, l.jsx)("h2", { children: ce.title })] }), /* @__PURE__ */ (0, l.jsx)("span", {
                className: "status " + (ge.author ? "passed" : ge.status === "needs_revision" ? "needs_revision" : "candidate"),
                children: ge.author ? "作者已確認" : ge.status === "todo" ? "待製作" : "待確認工作"
              })]
            }),
            /* @__PURE__ */ (0, l.jsxs)("div", {
              className: "output-box",
              children: [/* @__PURE__ */ (0, l.jsx)(bl, { size: 19 }), /* @__PURE__ */ (0, l.jsxs)("div", { children: [/* @__PURE__ */ (0, l.jsx)("strong", { children: "應留下的產出" }), /* @__PURE__ */ (0, l.jsx)("p", { children: ce.output })] })]
            }),
            /* @__PURE__ */ (0, l.jsxs)("form", {
              className: "context-form",
              onSubmit: async (O) => {
                O.preventDefault(), await Ue("save_model_stage", {
                  modelId: F.id,
                  versionId: te.id,
                  stageId: R,
                  checks: j,
                  evidence: ze,
                  summary: g,
                  nextStep: Q,
                  candidateLocation: G
                });
              },
              children: [
                /* @__PURE__ */ (0, l.jsx)("div", {
                  className: "checklist",
                  children: ce.checks.map((O, we) => /* @__PURE__ */ (0, l.jsxs)("label", { children: [/* @__PURE__ */ (0, l.jsx)("input", {
                    type: "checkbox",
                    disabled: d || h,
                    checked: j[we] ?? !1,
                    onChange: (it) => {
                      $((Jt) => Jt.map((et, Ja) => Ja === we ? it.target.checked : et)), I(!0);
                    }
                  }), /* @__PURE__ */ (0, l.jsx)("span", { children: O })] }, O))
                }),
                R === "M04" && /* @__PURE__ */ (0, l.jsxs)("label", { children: ["本次獨立候選 GLB", /* @__PURE__ */ (0, l.jsx)("input", {
                  disabled: d || h,
                  maxLength: 2e3,
                  value: G,
                  placeholder: ".../reality-home_v2_candidate.glb",
                  onChange: (O) => {
                    fe(O.target.value), I(!0);
                  }
                })] }),
                /* @__PURE__ */ (0, l.jsxs)("label", { children: ["實際產出／檢查依據位置", /* @__PURE__ */ (0, l.jsx)("textarea", {
                  rows: 2,
                  disabled: d || h,
                  value: ze,
                  onChange: (O) => {
                    he(O.target.value), I(!0);
                  },
                  placeholder: "原檔盤點報告、逐物件差異、檢查結果或指定鏡位截圖；附來源版本。"
                })] }),
                /* @__PURE__ */ (0, l.jsxs)("label", { children: ["本次實際做了什麼 *", /* @__PURE__ */ (0, l.jsx)("textarea", {
                  required: !0,
                  rows: 3,
                  maxLength: 6e3,
                  disabled: d || h,
                  value: g,
                  onChange: (O) => {
                    ae(O.target.value), I(!0);
                  },
                  placeholder: "具體節點／物件、改動、檢查方式、尚未完成項。"
                })] }),
                /* @__PURE__ */ (0, l.jsxs)("label", { children: ["下一位 AI 從哪裡繼續 *", /* @__PURE__ */ (0, l.jsx)("textarea", {
                  required: !0,
                  rows: 3,
                  maxLength: 6e3,
                  disabled: d || h,
                  value: Q,
                  onChange: (O) => {
                    B(O.target.value), I(!0);
                  },
                  placeholder: "指定版本、檔案位置、先讀資料、下一個物件或鏡位，以及受阻原因。"
                })] }),
                /* @__PURE__ */ (0, l.jsxs)("div", {
                  className: "context-actions",
                  children: [/* @__PURE__ */ (0, l.jsxs)("button", {
                    className: "btn",
                    disabled: d || h || !Ee,
                    children: ["保存候選工作紀錄", Ee ? " *" : ""]
                  }), /* @__PURE__ */ (0, l.jsxs)("button", {
                    type: "button",
                    className: "btn primary",
                    disabled: d || h || Ee || P.length > 0 || !!ge.author,
                    onClick: () => {
                      Ue(R === "M08" ? "adopt_model_version" : "approve_model_stage", {
                        modelId: F.id,
                        versionId: te.id,
                        stageId: R,
                        note: "作者確認指定候選版本與適用範圍"
                      });
                    },
                    children: [/* @__PURE__ */ (0, l.jsx)(gl, { size: 15 }), R === "M08" ? "作者登記採用此版本" : "作者確認本階段"]
                  })]
                }),
                /* @__PURE__ */ (0, l.jsx)("p", {
                  className: "muted",
                  children: h ? "已採用版本及舊集引用保持不變；需要修改請另建候選。" : Ee ? "請先保存工作紀錄，再確認。" : P.length ? "待補：" + P.join("；") : "檢查條件已齊，請核對實際成果後確認。"
                }),
                R === "M08" && /* @__PURE__ */ (0, l.jsx)("p", {
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
              onSubmit: async (O) => {
                O.preventDefault(), await Ue("report_model_issue", {
                  modelId: F.id,
                  versionId: te.id,
                  stageId: R,
                  kind: f,
                  reason: se
                }) && Z("");
              },
              children: [
                /* @__PURE__ */ (0, l.jsxs)("div", {
                  className: "context-form-grid",
                  children: [/* @__PURE__ */ (0, l.jsxs)("label", { children: ["問題分類", /* @__PURE__ */ (0, l.jsxs)("select", {
                    value: f,
                    onChange: (O) => D(O.target.value),
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
                    value: ce.id + " " + ce.title
                  })] })]
                }),
                /* @__PURE__ */ (0, l.jsxs)("label", { children: ["具體原因", /* @__PURE__ */ (0, l.jsx)("textarea", {
                  required: !0,
                  rows: 2,
                  maxLength: 6e3,
                  value: se,
                  onChange: (O) => Z(O.target.value)
                })] }),
                /* @__PURE__ */ (0, l.jsxs)("button", {
                  className: "btn",
                  disabled: d || !se.trim(),
                  children: [/* @__PURE__ */ (0, l.jsx)(si, { size: 15 }), "登記問題"]
                })
              ]
            }),
            ie.map((O) => /* @__PURE__ */ (0, l.jsxs)("article", {
              className: "context-record",
              children: [
                /* @__PURE__ */ (0, l.jsxs)("div", {
                  className: "issue-top",
                  children: [/* @__PURE__ */ (0, l.jsx)("span", {
                    className: "status " + (O.status === "open" ? "needs_revision" : "passed"),
                    children: O.status === "open" ? "待處理" : "作者已複核"
                  }), /* @__PURE__ */ (0, l.jsxs)("b", { children: [
                    O.stageId,
                    " · ",
                    O.kind === "major" ? "重大變更" : O.kind === "technical" ? "技術" : "視覺"
                  ] })]
                }),
                /* @__PURE__ */ (0, l.jsx)("p", { children: O.reason }),
                /* @__PURE__ */ (0, l.jsxs)("small", { children: [
                  O.by,
                  " · ",
                  new Date(O.at).toLocaleString("zh-TW", { timeZone: "Asia/Taipei" })
                ] }),
                O.status === "open" ? /* @__PURE__ */ (0, l.jsxs)("form", {
                  className: "context-form",
                  onSubmit: async (we) => {
                    we.preventDefault(), await Ue("resolve_model_issue", {
                      modelId: F.id,
                      versionId: te.id,
                      issueId: O.id,
                      resolution: K[O.id] ?? ""
                    });
                  },
                  children: [/* @__PURE__ */ (0, l.jsxs)("label", { children: ["作者修正複核／裁定結果", /* @__PURE__ */ (0, l.jsx)("textarea", {
                    required: !0,
                    rows: 2,
                    maxLength: 6e3,
                    value: K[O.id] ?? "",
                    onChange: (we) => ee({
                      ...K,
                      [O.id]: we.target.value
                    })
                  })] }), /* @__PURE__ */ (0, l.jsx)("button", {
                    className: "btn",
                    disabled: d,
                    children: "作者確認處理結果"
                  })]
                }) : /* @__PURE__ */ (0, l.jsxs)("p", { children: ["處理結果：", O.resolution] })
              ]
            }, O.id))
          ]
        }),
        /* @__PURE__ */ (0, l.jsxs)("div", {
          className: "wide-card",
          children: [
            /* @__PURE__ */ (0, l.jsx)("div", {
              className: "section-title",
              children: /* @__PURE__ */ (0, l.jsxs)("div", { children: [/* @__PURE__ */ (0, l.jsxs)("h2", { children: [/* @__PURE__ */ (0, l.jsx)(As, { size: 19 }), "各集固定版本引用"] }), /* @__PURE__ */ (0, l.jsxs)("p", { children: [
                "目前集數：",
                _.episode,
                "。新候選不會自動替換 EP01 或其他集的模型來源。"
              ] })] })
            }),
            h && /* @__PURE__ */ (0, l.jsxs)("form", {
              className: "context-form",
              onSubmit: async (O) => {
                O.preventDefault(), await Ue("pin_model_version", {
                  modelId: F.id,
                  versionId: te.id,
                  episodeId: _.id,
                  purpose: ne,
                  sceneIds: je
                }) && (Se(""), Be(""));
              },
              children: [/* @__PURE__ */ (0, l.jsxs)("div", {
                className: "context-form-grid",
                children: [/* @__PURE__ */ (0, l.jsxs)("label", { children: ["引用場次（選填）", /* @__PURE__ */ (0, l.jsx)("input", {
                  value: je,
                  maxLength: 1e3,
                  placeholder: "S06、S07",
                  onChange: (O) => Be(O.target.value)
                })] }), /* @__PURE__ */ (0, l.jsxs)("label", { children: ["本集用途 *", /* @__PURE__ */ (0, l.jsx)("input", {
                  required: !0,
                  value: ne,
                  maxLength: 2e3,
                  placeholder: "固定樓梯、餐桌與走道位置",
                  onChange: (O) => Se(O.target.value)
                })] })]
              }), /* @__PURE__ */ (0, l.jsxs)("button", {
                className: "btn",
                disabled: d || me.length > 0,
                children: ["將此採用版本引用至 ", _.episode]
              })]
            }),
            We.length ? /* @__PURE__ */ (0, l.jsx)("div", {
              className: "model-pins",
              children: We.map((O, we) => {
                const it = H.models.find((et) => et.id === O.modelId), Jt = it?.versions.find((et) => et.id === O.versionId);
                return /* @__PURE__ */ (0, l.jsxs)("article", { children: [
                  /* @__PURE__ */ (0, l.jsxs)("b", { children: [
                    it?.title,
                    " · ",
                    Jt?.label
                  ] }),
                  " ",
                  /* @__PURE__ */ (0, l.jsx)("span", {
                    className: "status " + (jt.get([O.modelId, O.sceneIds].join("|")) === O ? "passed" : "todo"),
                    children: jt.get([O.modelId, O.sceneIds].join("|")) === O ? "本集現行引用" : "歷史引用"
                  }),
                  /* @__PURE__ */ (0, l.jsxs)("p", { children: [
                    O.sceneIds || "本集",
                    " ／ ",
                    O.purpose
                  ] }),
                  /* @__PURE__ */ (0, l.jsx)("code", { children: Jt?.candidateLocation })
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
            H.history.filter((O) => O.modelId === F.id).length,
            "）"
          ] }), [...H.history].reverse().filter((O) => O.modelId === F.id).slice(0, 60).map((O, we) => /* @__PURE__ */ (0, l.jsxs)("article", {
            className: "context-mini",
            children: [
              /* @__PURE__ */ (0, l.jsxs)("b", { children: [
                dx[O.action] ?? O.action,
                " · ",
                O.stageId,
                " · ",
                F.versions.find((it) => it.id === O.versionId)?.label
              ] }),
              /* @__PURE__ */ (0, l.jsx)("p", { children: O.detail }),
              /* @__PURE__ */ (0, l.jsxs)("small", { children: [
                O.actor === "ai" ? "AI" : "作者",
                " · ",
                O.by,
                " · ",
                new Date(O.at).toLocaleString("zh-TW", { timeZone: "Asia/Taipei" })
              ] })
            ]
          }, we))]
        })
      ] }),
      X && /* @__PURE__ */ (0, l.jsx)("p", {
        role: "alert",
        children: X
      })
    ]
  });
}
var to = "https://lihuany635-create.github.io/lizhi-cloud-web/?open=animationflow", ao = {
  todo: "待製作",
  candidate: "候選待驗收",
  passed: "已通過",
  in_timeline: "已入片",
  needs_revision: "待修正"
}, bf = [
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
function px(r, m, _ = "application/json") {
  const u = URL.createObjectURL(new Blob([m], { type: _ })), d = document.createElement("a");
  d.href = u, d.download = r, d.click(), setTimeout(() => URL.revokeObjectURL(u), 1e3);
}
function fx({ nativeTransport: r, initialWorkId: m, initialTab: _ = "resume", onDirtyChange: u } = {}) {
  const [d, T] = (0, N.useState)([]), [v, M] = (0, N.useState)(null), [w, k] = (0, N.useState)(_), [z, V] = (0, N.useState)("01"), [R, re] = (0, N.useState)(null), [pe, J] = (0, N.useState)([]), [W, le] = (0, N.useState)(!0), [X, oe] = (0, N.useState)(!1), [H, F] = (0, N.useState)(""), [te, ge] = (0, N.useState)(""), [ce, I] = (0, N.useState)(!1), [j, $] = (0, N.useState)([]), [ze, he] = (0, N.useState)(""), [g, ae] = (0, N.useState)(""), [Q, B] = (0, N.useState)(!1), [G, fe] = (0, N.useState)(null), [se, Z] = (0, N.useState)({}), [f, D] = (0, N.useState)(""), [K, ee] = (0, N.useState)(!1), [ne, Se] = (0, N.useState)(null), je = (0, N.useRef)(0), Be = (0, N.useRef)(""), Ee = (0, N.useRef)(!1);
  (0, N.useEffect)(() => {
    Ee.current = Q, u?.(Q);
  }, [Q, u]);
  const Ne = (0, N.useCallback)((p) => {
    Be.current = p.id, M(p), re((be) => be?.id === p.workId ? be : null), T((be) => [so(p), ...be.filter((ve) => ve.id !== p.id)]), B(!1);
  }, []);
  async function Re(p, be, ve = "projects") {
    const tt = r ? await r(ve, p, be) : await fetch("/api/" + ve + p, {
      cache: "no-store",
      ...be ? {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(be)
      } : {}
    });
    if (tt.status === 401)
      throw I(!0), new Error("請先登入流程工作台");
    if (!tt.headers.get("content-type")?.includes("application/json"))
      throw I(!0), new Error("請開啟工作台並使用 ChatGPT 登入");
    const Ze = await tt.json();
    if (!tt.ok) throw new Error(Ze.error || "讀取失敗");
    return I(!1), Ze;
  }
  const Ue = (0, N.useCallback)(async (p) => {
    const be = ++je.current;
    p && p !== Be.current && (Be.current = p, le(!0));
    try {
      const [ve, tt] = await Promise.all([Re(""), Re("", void 0, "works")]), Ze = m ? ve.filter((yt) => yt.workId === m) : ve, bt = p || Be.current || Ze.find((yt) => !yt.archived && yt.workId && yt.episode === "EP01")?.id || Ze.find((yt) => !yt.archived && yt.workId)?.id || Ze.find((yt) => !yt.archived)?.id;
      let ot = null, sn = null;
      if (bt && (ot = await Re("?id=" + encodeURIComponent(bt)), ot.workId && (sn = (await Re("?id=" + encodeURIComponent(ot.workId), void 0, "works")).work)), be !== je.current) return;
      F(""), T(Ze), J(m ? tt.filter((yt) => yt.id === m) : tt), Ee.current || (ot ? Ne(ot) : M(null), re(sn));
    } catch (ve) {
      be === je.current && F(ve.message);
    } finally {
      be === je.current && le(!1);
    }
  }, [Ne, m]);
  (0, N.useEffect)(() => {
    const p = new URLSearchParams(window.location.search).get("view");
    !m && p && [
      "resume",
      "project",
      "models",
      "context"
    ].includes(p) && k(p);
  }, []), (0, N.useEffect)(() => {
    Ue();
  }, [Ue]), (0, N.useEffect)(() => {
    const p = setInterval(() => {
      !Q && !G && !X && Ue(Be.current || void 0);
    }, 2e4);
    return () => clearInterval(p);
  }, [
    Q,
    G,
    X,
    v?.id,
    Ue
  ]), (0, N.useEffect)(() => {
    const p = v?.stages[z];
    p && ($(p.checks), he(p.evidence), ae(p.note), B(!1));
  }, [v, z]), (0, N.useEffect)(() => {
    if (!Q) return;
    const p = (be) => {
      be.preventDefault();
    };
    return window.addEventListener("beforeunload", p), () => window.removeEventListener("beforeunload", p);
  }, [Q]), (0, N.useEffect)(() => {
    if (!te) return;
    const p = setTimeout(() => ge(""), 4500);
    return () => clearTimeout(p);
  }, [te]);
  async function y(p, be = {}) {
    if (v) {
      je.current++, oe(!0), F("");
      try {
        const ve = await Re("", {
          projectId: v.id,
          revision: v.revision,
          action: p,
          args: be
        });
        return Ne(ve), ve.archived && ee(!0), ge("已儲存至雲端"), ve;
      } catch (ve) {
        F(ve.message);
      } finally {
        oe(!1);
      }
    }
  }
  async function ie(p, be) {
    je.current++, oe(!0), F("");
    try {
      const ve = await Re("", [
        "convert_episode",
        "create_work",
        "create_episode"
      ].includes(p) ? {
        action: p,
        ...be,
        workId: R?.id,
        revision: R?.revision
      } : {
        action: p,
        workId: R?.id,
        revision: R?.revision,
        args: be
      }, "works");
      return re(ve.work), J((tt) => [{
        ...Jm(ve.work),
        episodeCount: ve.episodes.length
      }, ...tt.filter((Ze) => Ze.id !== ve.work.id)]), T((tt) => [...ve.episodes, ...tt.filter((Ze) => !ve.episodes.some((bt) => bt.id === Ze.id))]), ve.episode && Ne(ve.episode), ge("作品專案已儲存"), ve;
    } catch (ve) {
      if (F(ve.message), p === "create_episode") throw ve;
    } finally {
      oe(!1);
    }
  }
  function me(p) {
    Q && !window.confirm("此階段有未儲存修改，要放棄修改嗎？") || (B(!1), p());
  }
  function h(p) {
    me(() => V(p));
  }
  function P(p) {
    me(() => {
      k(p), [
        "main",
        "op",
        "ed"
      ].includes(p) && V(Kt.find((be) => be.group === p).id);
    });
  }
  async function We(p) {
    p.preventDefault(), oe(!0), F("");
    try {
      G === "create" ? (R ? await ie("create_episode", {
        title: se.title || "製作資料",
        episode: se.episode || "EP01"
      }) : Ne(await Re("", {
        action: "create_project",
        title: se.title || "現實遊戲",
        episode: se.episode || "EP01"
      })), k("main"), V("01"), fe(null), ge("專案已建立，全部階段待確認")) : G === "shot" ? await y("save_shot", se) && fe(null) : G === "issue" ? await y("add_issue", se) && fe(null) : G === "resolve" ? await y("resolve_issue", se) && fe(null) : G === "archive" && await y(v?.archived ? "restore" : "archive") && fe(null);
    } catch (be) {
      F(be.message);
    } finally {
      oe(!1);
    }
  }
  const jt = v ? so(v) : null, O = Kt.find((p) => p.id === z), we = v?.stages[z], it = v ? Ef(v, z) : [], Jt = v ? _s(v, z) : [], et = Kt.filter((p) => p.group === w), Ja = v?.issues.filter((p) => p.status === "open") || [], jl = v?.production?.completionReports?.at(-1), Ut = jl?.status === "completed", ea = v ? oo(v).registration : null, Ia = [
    [
      "resume",
      "工作首頁",
      ci
    ],
    [
      "project",
      "作品與集數",
      en
    ],
    [
      "models",
      "3D 模型",
      rf
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
      Em
    ],
    [
      "op",
      "片頭 OP",
      Qr
    ],
    [
      "ed",
      "片尾 ED",
      en
    ],
    [
      "shots",
      "鏡頭與素材",
      rf
    ],
    [
      "issues",
      "待修問題",
      si
    ],
    [
      "chatgpt",
      "AI 協作",
      Jr
    ],
    [
      "history",
      "異動紀錄",
      Nf
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
            href: to,
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
            children: [/* @__PURE__ */ (0, l.jsx)(en, { size: 19 }), /* @__PURE__ */ (0, l.jsxs)("select", {
              disabled: X || W,
              "aria-label": "切換作品專案",
              value: R?.id || "",
              onChange: (p) => me(() => {
                const be = d.find((ve) => (ve.workId || "") === p.target.value && !ve.archived);
                be && Ue(be.id), Se(null), k("resume");
              }),
              children: [/* @__PURE__ */ (0, l.jsx)("option", {
                value: "",
                children: "未歸屬單集"
              }), pe.map((p) => /* @__PURE__ */ (0, l.jsxs)("option", {
                value: p.id,
                children: [
                  p.title,
                  " · ",
                  p.episodeCount,
                  " 集"
                ]
              }, p.id))]
            })]
          }),
          /* @__PURE__ */ (0, l.jsx)("div", {
            className: "side-label",
            children: "集數"
          }),
          /* @__PURE__ */ (0, l.jsxs)("div", {
            className: "project-switch",
            children: [/* @__PURE__ */ (0, l.jsx)(ci, { size: 19 }), /* @__PURE__ */ (0, l.jsxs)("select", {
              disabled: X || W,
              "aria-label": "切換集數",
              value: v?.id || "",
              onChange: (p) => me(() => {
                Ue(p.target.value);
              }),
              children: [/* @__PURE__ */ (0, l.jsx)("option", {
                value: "",
                disabled: !0,
                children: "選擇集數"
              }), d.filter((p) => (p.workId || "") === (R?.id || "") && (K || !p.archived)).map((p) => /* @__PURE__ */ (0, l.jsxs)("option", {
                value: p.id,
                children: [
                  p.episode,
                  " · ",
                  p.title,
                  p.archived ? "（已封存）" : ""
                ]
              }, p.id))]
            })]
          }),
          /* @__PURE__ */ (0, l.jsxs)("button", {
            className: "new-project",
            onClick: () => me(() => {
              Z({
                title: "製作資料",
                episode: "EP" + String(Math.max(0, ...d.map((p) => Number(p.episode.replace(/^EP/i, "")) || 0)) + 1).padStart(2, "0")
              }), fe("create");
            }),
            children: [/* @__PURE__ */ (0, l.jsx)(Pt, { size: 15 }), "建立其他單集"]
          }),
          /* @__PURE__ */ (0, l.jsx)("nav", {
            "aria-label": "主要功能",
            children: Ia.filter(([p]) => [
              "resume",
              "main",
              "models",
              "context",
              "chatgpt"
            ].includes(p)).map(([p, be, ve]) => /* @__PURE__ */ (0, l.jsxs)("button", {
              "aria-current": w === p ? "page" : void 0,
              className: "nav-item " + (w === p || p === "main" && [
                "op",
                "ed",
                "shots",
                "issues"
              ].includes(w) ? "active" : ""),
              onClick: () => P(p),
              children: [/* @__PURE__ */ (0, l.jsx)(ve, { size: 18 }), /* @__PURE__ */ (0, l.jsx)("span", { children: be })]
            }, p))
          }),
          /* @__PURE__ */ (0, l.jsxs)("details", {
            className: "nav-more",
            open: [
              "project",
              "settings",
              "history"
            ].includes(w) || void 0,
            children: [/* @__PURE__ */ (0, l.jsx)("summary", { children: "專案管理" }), Ia.filter(([p]) => [
              "project",
              "settings",
              "history"
            ].includes(p)).map(([p, be, ve]) => /* @__PURE__ */ (0, l.jsxs)("button", {
              className: "nav-item " + (w === p ? "active" : ""),
              onClick: () => P(p),
              children: [/* @__PURE__ */ (0, l.jsx)(ve, { size: 17 }), be]
            }, p))]
          }),
          /* @__PURE__ */ (0, l.jsxs)("div", {
            className: "side-bottom",
            children: [/* @__PURE__ */ (0, l.jsxs)("label", {
              className: "archive-toggle",
              children: [/* @__PURE__ */ (0, l.jsx)("input", {
                type: "checkbox",
                checked: K,
                onChange: (p) => ee(p.target.checked)
              }), "顯示已封存專案"]
            }), /* @__PURE__ */ (0, l.jsxs)("a", {
              href: to,
              target: "_top",
              children: ["返回立之雲端庫 ", /* @__PURE__ */ (0, l.jsx)(tm, { size: 14 })]
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
              /* @__PURE__ */ (0, l.jsx)(sf, { size: 14 }),
              /* @__PURE__ */ (0, l.jsx)("span", { children: Ia.find((p) => p[0] === w)?.[1] })
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
              disabled: X || W,
              onClick: () => me(() => {
                Ue(v?.id);
              }),
              children: /* @__PURE__ */ (0, l.jsx)(Ts, {
                size: 17,
                className: W ? "spin" : ""
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
                /* @__PURE__ */ (0, l.jsx)(si, { size: 18 }),
                /* @__PURE__ */ (0, l.jsx)("span", { children: H }),
                ce && /* @__PURE__ */ (0, l.jsx)("a", {
                  href: r ? to : "/signin-with-chatgpt?return_to=" + encodeURIComponent("/?view=" + w),
                  target: "_top",
                  children: r ? "重新登入雲端庫" : "登入工作台 ↗"
                }),
                /* @__PURE__ */ (0, l.jsx)("button", {
                  "aria-label": "關閉訊息",
                  onClick: () => F(""),
                  children: /* @__PURE__ */ (0, l.jsx)(nn, { size: 16 })
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
                /* @__PURE__ */ (0, l.jsx)("h1", { children: Ia.find((p) => p[0] === w)?.[1] }),
                /* @__PURE__ */ (0, l.jsx)("p", { children: w === "resume" ? "查看進度，選一件事接著做。" : w === "models" ? "選擇模型與版本，記錄這次完成的工作。" : w === "context" ? "查找製作資料，保留每次工作的交接。" : "目前選取的作品與集數如下。" })
              ] }), /* @__PURE__ */ (0, l.jsx)("div", {
                className: "heading-actions",
                children: v && /* @__PURE__ */ (0, l.jsxs)(l.Fragment, { children: [/* @__PURE__ */ (0, l.jsxs)("button", {
                  className: "btn",
                  onClick: () => px(v.title + "_" + v.episode + "_流程備份.json", JSON.stringify(v, null, 2)),
                  children: [/* @__PURE__ */ (0, l.jsx)(Es, { size: 15 }), "匯出紀錄"]
                }), /* @__PURE__ */ (0, l.jsx)("button", {
                  className: "icon-btn bordered",
                  title: v.archived ? "還原專案" : "封存專案",
                  "aria-label": v.archived ? "還原專案" : "封存專案",
                  onClick: () => {
                    Z({}), fe("archive");
                  },
                  children: v.archived ? /* @__PURE__ */ (0, l.jsx)(Um, { size: 17 }) : /* @__PURE__ */ (0, l.jsx)(zf, { size: 17 })
                })] })
              })]
            }),
            W ? /* @__PURE__ */ (0, l.jsxs)("div", {
              className: "empty",
              children: [/* @__PURE__ */ (0, l.jsx)(Kr, {
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
                  }), /* @__PURE__ */ (0, l.jsxs)("div", { children: [/* @__PURE__ */ (0, l.jsxs)("h2", { children: [R ? R.title + " · " + v.episode : v.title, v.archived && /* @__PURE__ */ (0, l.jsx)("span", {
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
                        children: /* @__PURE__ */ (0, l.jsx)(Qr, { size: 20 })
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
                      jt.approved,
                      " / ",
                      jt.total,
                      " 階段已登記逐項核定；",
                      jt.inTimeline,
                      " / ",
                      jt.shots,
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
                children: Ia.filter(([p]) => [
                  "main",
                  "op",
                  "ed",
                  "shots",
                  "issues"
                ].includes(p)).map(([p, be]) => /* @__PURE__ */ (0, l.jsxs)("button", {
                  className: w === p ? "active" : "",
                  "aria-current": w === p ? "page" : void 0,
                  onClick: () => P(p),
                  children: [be, p === "issues" && Ja.length > 0 ? " · " + Ja.length : ""]
                }, p))
              }),
              w === "resume" ? /* @__PURE__ */ (0, l.jsx)(ex, {
                project: v,
                work: R,
                busy: X,
                onNavigate: P,
                onModel: (p) => {
                  Se(p), P("models");
                }
              }) : w === "project" ? /* @__PURE__ */ (0, l.jsx)(ox, {
                work: R,
                episode: v,
                episodes: d,
                busy: X,
                onWorkAction: ie,
                onSelectEpisode: (p) => me(() => {
                  Ue(p);
                }),
                onPin: (p) => y("pin_shared_reference", { assetId: p }),
                mutate: y
              }, v.id) : w === "models" ? /* @__PURE__ */ (0, l.jsx)(ux, {
                initialSelection: ne,
                work: R,
                episode: v,
                episodes: d,
                busy: X,
                onAction: ie,
                onProject: () => P("project"),
                onDirty: B
              }, (R?.id || v.id) + JSON.stringify(ne)) : w === "settings" ? /* @__PURE__ */ (0, l.jsx)(Af, {
                project: v,
                busy: X,
                mutate: y
              }, v.id) : w === "context" ? /* @__PURE__ */ (0, l.jsx)(sx, {
                project: v,
                mutate: y,
                busy: X
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
                        disabled: X || v.archived,
                        onChange: (p) => {
                          y("set_branches", {
                            ...v.branches,
                            [w]: p.target.checked
                          });
                        }
                      }), "納入本集"]
                    })
                  ]
                }),
                w !== "main" && !v.branches[w] ? /* @__PURE__ */ (0, l.jsxs)("div", {
                  className: "empty",
                  children: [
                    /* @__PURE__ */ (0, l.jsx)(en, { size: 30 }),
                    /* @__PURE__ */ (0, l.jsxs)("h3", { children: ["本集未納入 ", w.toUpperCase()] }),
                    /* @__PURE__ */ (0, l.jsx)("p", { children: "重新勾選「納入本集」即可保留並繼續原有紀錄。" })
                  ]
                }) : /* @__PURE__ */ (0, l.jsxs)("div", {
                  className: "flow-layout",
                  children: [/* @__PURE__ */ (0, l.jsxs)("div", {
                    className: "stage-list",
                    children: [et.map((p, be) => {
                      const ve = v.stages[p.id], tt = _s(v, p.id).length > 0;
                      return /* @__PURE__ */ (0, l.jsxs)("button", {
                        className: "stage-item " + (z === p.id ? "selected" : "") + (ve.author ? " completed" : ""),
                        onClick: () => h(p.id),
                        children: [
                          /* @__PURE__ */ (0, l.jsx)("span", {
                            className: "stage-number " + (ve.author ? "done" : ""),
                            children: ve.author ? /* @__PURE__ */ (0, l.jsx)(zs, { size: 17 }) : w === "main" ? p.id : String(be + 1).padStart(2, "0")
                          }),
                          /* @__PURE__ */ (0, l.jsxs)("div", { children: [
                            /* @__PURE__ */ (0, l.jsx)("small", { children: p.phase }),
                            /* @__PURE__ */ (0, l.jsx)("strong", { children: p.title }),
                            /* @__PURE__ */ (0, l.jsx)("span", {
                              className: "stage-label " + (ve.status === "needs_revision" ? "red-text" : ""),
                              children: Ut && !ve.author && ve.status === "todo" ? "已完成 · 待補登" : tt && !ve.author ? /* @__PURE__ */ (0, l.jsxs)(l.Fragment, { children: [/* @__PURE__ */ (0, l.jsx)(no, { size: 11 }), "待前階段核定"] }) : ao[ve.status]
                            })
                          ] }),
                          /* @__PURE__ */ (0, l.jsx)(sf, { size: 15 })
                        ]
                      }, p.id);
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
                          children: w === "main" ? "STAGE " + z : w.toUpperCase() + " · " + z.slice(2)
                        }), /* @__PURE__ */ (0, l.jsx)("h2", { children: O.title })] }), /* @__PURE__ */ (0, l.jsx)("span", {
                          className: "status " + we.status,
                          children: Ut && we.status === "todo" ? "已完成 · 明細待補登" : ao[we.status]
                        })]
                      }),
                      /* @__PURE__ */ (0, l.jsx)("p", {
                        className: "stage-description",
                        children: O.description
                      }),
                      Jt.length > 0 && /* @__PURE__ */ (0, l.jsxs)("div", {
                        className: "gate-notice",
                        children: [/* @__PURE__ */ (0, l.jsx)(no, { size: 16 }), /* @__PURE__ */ (0, l.jsxs)("span", { children: [
                          Ut ? "逐項紀錄尚缺：" : "正式核定前，需先完成：",
                          Jt.join("、"),
                          "。可直接補登產出依據。"
                        ] })]
                      }),
                      /* @__PURE__ */ (0, l.jsxs)("div", {
                        className: "output-box",
                        children: [/* @__PURE__ */ (0, l.jsx)(bl, { size: 19 }), /* @__PURE__ */ (0, l.jsxs)("div", { children: [/* @__PURE__ */ (0, l.jsx)("strong", { children: "本階段產出" }), /* @__PURE__ */ (0, l.jsx)("p", { children: O.output })] })]
                      }),
                      Ka(v.episodeRules ?? []).filter((p) => !p.stageIds.length || p.stageIds.includes(z)).map((p) => /* @__PURE__ */ (0, l.jsxs)("div", {
                        className: "context-mini",
                        children: [
                          /* @__PURE__ */ (0, l.jsxs)("b", { children: [
                            "本集採用規則 · ",
                            p.title,
                            " v",
                            p.version
                          ] }),
                          /* @__PURE__ */ (0, l.jsx)("p", { children: p.content }),
                          /* @__PURE__ */ (0, l.jsxs)("small", { children: [
                            "場次：",
                            p.sceneIds.join("、") || "全部",
                            " · 來源：",
                            p.source
                          ] })
                        ]
                      }, p.id)),
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
                        children: O.checks.map((p, be) => /* @__PURE__ */ (0, l.jsxs)("label", {
                          className: j[be] ? "checked" : "",
                          children: [/* @__PURE__ */ (0, l.jsx)("input", {
                            type: "checkbox",
                            checked: j[be] || !1,
                            disabled: X || v.archived,
                            onChange: (ve) => {
                              $((tt) => tt.map((Ze, bt) => bt === be ? ve.target.checked : Ze)), B(!0);
                            }
                          }), /* @__PURE__ */ (0, l.jsx)("span", { children: p })]
                        }, be))
                      }),
                      /* @__PURE__ */ (0, l.jsxs)("label", {
                        className: "field-label",
                        htmlFor: "evidence",
                        children: [
                          /* @__PURE__ */ (0, l.jsx)(As, { size: 15 }),
                          "產出依據與位置 ",
                          /* @__PURE__ */ (0, l.jsx)("span", { children: "必填" })
                        ]
                      }),
                      /* @__PURE__ */ (0, l.jsx)("textarea", {
                        id: "evidence",
                        rows: 3,
                        placeholder: "貼上成果連結、檔案位置與參考版本；每行一筆。",
                        value: ze,
                        disabled: v.archived,
                        onChange: (p) => {
                          he(p.target.value), B(!0);
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
                        onChange: (p) => {
                          ae(p.target.value), B(!0);
                        }
                      }),
                      /* @__PURE__ */ (0, l.jsxs)("div", {
                        className: "reviews",
                        children: [/* @__PURE__ */ (0, l.jsxs)("div", { children: [/* @__PURE__ */ (0, l.jsxs)("span", {
                          className: "review-title",
                          children: [/* @__PURE__ */ (0, l.jsx)(Jr, { size: 15 }), "AI 初驗"]
                        }), we.ai ? /* @__PURE__ */ (0, l.jsxs)(l.Fragment, { children: [
                          /* @__PURE__ */ (0, l.jsx)("b", {
                            className: we.ai.verdict === "pass" ? "green-text" : "red-text",
                            children: we.ai.verdict === "pass" ? "初驗通過" : "需修正"
                          }),
                          /* @__PURE__ */ (0, l.jsx)("p", { children: we.ai.note }),
                          /* @__PURE__ */ (0, l.jsxs)("small", { children: [
                            ii(we.ai.at),
                            " · ",
                            we.ai.by
                          ] })
                        ] }) : /* @__PURE__ */ (0, l.jsx)("p", {
                          className: "muted",
                          children: "尚未收到 AI 初驗"
                        })] }), /* @__PURE__ */ (0, l.jsxs)("div", { children: [/* @__PURE__ */ (0, l.jsxs)("span", {
                          className: "review-title",
                          children: [/* @__PURE__ */ (0, l.jsx)(gl, { size: 15 }), "作者正式核定"]
                        }), we.author ? /* @__PURE__ */ (0, l.jsxs)(l.Fragment, { children: [
                          /* @__PURE__ */ (0, l.jsx)("b", {
                            className: "green-text",
                            children: "已核定"
                          }),
                          /* @__PURE__ */ (0, l.jsx)("p", { children: we.author.note || "已確認本階段成果與驗收條件" }),
                          /* @__PURE__ */ (0, l.jsxs)("small", { children: [
                            ii(we.author.at),
                            " · ",
                            we.author.by
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
                          disabled: X || v.archived,
                          onClick: () => {
                            Z({
                              stageId: z,
                              reason: "",
                              shotId: ""
                            }), fe("issue");
                          },
                          children: [/* @__PURE__ */ (0, l.jsx)(si, { size: 15 }), "記錄退修"]
                        }), /* @__PURE__ */ (0, l.jsxs)("div", { children: [/* @__PURE__ */ (0, l.jsxs)("button", {
                          className: "btn",
                          disabled: X || v.archived || !Q,
                          onClick: () => {
                            y("save_stage", {
                              stageId: z,
                              checks: j,
                              evidence: ze,
                              note: g
                            });
                          },
                          children: [
                            X ? /* @__PURE__ */ (0, l.jsx)(Kr, {
                              size: 15,
                              className: "spin"
                            }) : null,
                            "儲存草稿",
                            Q ? " *" : ""
                          ]
                        }), /* @__PURE__ */ (0, l.jsxs)("button", {
                          className: "btn primary",
                          disabled: X || v.archived || Q || it.length > 0 || !!we.author,
                          onClick: () => {
                            y("approve_stage", {
                              stageId: z,
                              note: "作者已核對產出與全部驗收條件"
                            });
                          },
                          children: [/* @__PURE__ */ (0, l.jsx)(gl, { size: 15 }), we.author ? "已正式核定" : "作者確認通過"]
                        })] })]
                      }),
                      !we.author && /* @__PURE__ */ (0, l.jsx)("div", {
                        className: "gate-reasons",
                        children: Ut ? "本集維持作者告知完成；此處保存逐項檢視依據，不要求重新確認整集。" : Q ? "先儲存修改，再確認通過。" : it.length ? "待完成：" + it.join("；") : "已符合檢查條件，請實際檢視成果後確認通過。"
                      })
                    ]
                  }, z)]
                }),
                w === "main" && /* @__PURE__ */ (0, l.jsxs)("div", {
                  className: "principle",
                  children: [/* @__PURE__ */ (0, l.jsx)(en, { size: 19 }), /* @__PURE__ */ (0, l.jsxs)("div", { children: [/* @__PURE__ */ (0, l.jsx)("b", { children: "發現問題，就回到造成問題的環節。" }), /* @__PURE__ */ (0, l.jsx)("p", { children: "更新已核定的製作依據時，相關下游階段會標為待修正。AI 初驗與作者核定各自留存。" })] })]
                }),
                /* @__PURE__ */ (0, l.jsxs)("details", {
                  className: "manual-rules",
                  children: [/* @__PURE__ */ (0, l.jsx)("summary", { children: "歷史製作經驗（不作為目前有效設定）" }), /* @__PURE__ */ (0, l.jsxs)("div", {
                    className: "manual-rule-content",
                    children: [
                      /* @__PURE__ */ (0, l.jsx)("h3", { children: "場景定位" }),
                      tn.scenePosition.map((p) => /* @__PURE__ */ (0, l.jsx)("p", { children: p }, p)),
                      /* @__PURE__ */ (0, l.jsx)("h3", { children: "生圖提示詞順序" }),
                      /* @__PURE__ */ (0, l.jsx)("p", { children: tn.imagePrompt }),
                      /* @__PURE__ */ (0, l.jsx)("h3", { children: "影片提示詞順序" }),
                      /* @__PURE__ */ (0, l.jsx)("p", { children: tn.videoPrompt }),
                      /* @__PURE__ */ (0, l.jsx)("h3", { children: "失敗時回查" }),
                      tn.repairs.map((p) => /* @__PURE__ */ (0, l.jsx)("p", { children: p }, p)),
                      /* @__PURE__ */ (0, l.jsx)("h3", { children: "本集專用條件" }),
                      /* @__PURE__ */ (0, l.jsx)("p", { children: "請從「本集規則與採用」取得指定版本；前一集的劇情條件不自動沿用。" }),
                      /* @__PURE__ */ (0, l.jsx)("h3", { children: "素材編號" }),
                      /* @__PURE__ */ (0, l.jsx)("p", { children: "每集保留自己的素材編號與明確對照，不依編號相近猜配。" }),
                      /* @__PURE__ */ (0, l.jsxs)("p", { children: ["後續檔名範例：", tn.filenames.map((p) => p.replace("EP01", v.episode)).join("、")] })
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
                        Z({}), fe("shot");
                      },
                      children: [/* @__PURE__ */ (0, l.jsx)(Pt, { size: 16 }), "新增鏡頭"]
                    })]
                  }),
                  /* @__PURE__ */ (0, l.jsxs)("div", {
                    className: "search",
                    children: [/* @__PURE__ */ (0, l.jsx)(_f, { size: 16 }), /* @__PURE__ */ (0, l.jsx)("input", {
                      "aria-label": "搜尋鏡頭",
                      placeholder: "搜尋場次、鏡頭 ID 或舊編號…",
                      value: f,
                      onChange: (p) => D(p.target.value)
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
                    ] }) }), /* @__PURE__ */ (0, l.jsx)("tbody", { children: v.shots.filter((p) => [
                      p.id,
                      p.scene,
                      p.description,
                      p.legacyIds
                    ].join(" ").includes(f)).map((p) => /* @__PURE__ */ (0, l.jsxs)("tr", { children: [
                      /* @__PURE__ */ (0, l.jsxs)("td", { children: [/* @__PURE__ */ (0, l.jsx)("b", { children: p.id }), /* @__PURE__ */ (0, l.jsx)("small", { children: p.scene })] }),
                      /* @__PURE__ */ (0, l.jsxs)("td", { children: [p.description, /* @__PURE__ */ (0, l.jsxs)("small", { children: [
                        p.legacyIds || "未填舊編號",
                        " · ",
                        p.versions.length + 1,
                        " 次紀錄"
                      ] })] }),
                      /* @__PURE__ */ (0, l.jsxs)("td", { children: [/* @__PURE__ */ (0, l.jsxs)("small", { children: ["劇本 ", p.scriptVersion || "—"] }), /* @__PURE__ */ (0, l.jsxs)("small", { children: [
                        "角色 ",
                        p.characterVersion || "—",
                        "／場景 ",
                        p.sceneVersion || "—"
                      ] })] }),
                      /* @__PURE__ */ (0, l.jsxs)("td", { children: [p.adoptedVersion || "尚未採用", /* @__PURE__ */ (0, l.jsxs)("small", { children: [
                        p.editorVersion || "—",
                        " · ",
                        p.inPoint || "—",
                        " → ",
                        p.outPoint || "—"
                      ] })] }),
                      /* @__PURE__ */ (0, l.jsx)("td", { children: /* @__PURE__ */ (0, l.jsx)("span", {
                        className: "status " + p.status,
                        children: ao[p.status]
                      }) }),
                      /* @__PURE__ */ (0, l.jsx)("td", { children: /* @__PURE__ */ (0, l.jsxs)("div", {
                        className: "table-actions",
                        children: [/* @__PURE__ */ (0, l.jsx)("button", {
                          className: "text-btn",
                          disabled: v.archived,
                          onClick: () => {
                            Z(Object.fromEntries(bf.map(([be]) => [be, p[be]]))), fe("shot");
                          },
                          children: "查看／編輯"
                        }), p.author ? p.status !== "in_timeline" ? /* @__PURE__ */ (0, l.jsx)("button", {
                          className: "text-btn",
                          disabled: X || v.archived,
                          onClick: () => {
                            y("timeline_shot", { shotId: p.id });
                          },
                          children: "確認已入片"
                        }) : null : /* @__PURE__ */ (0, l.jsx)("button", {
                          className: "text-btn",
                          disabled: X || v.archived,
                          onClick: () => {
                            y("approve_shot", { shotId: p.id });
                          },
                          children: "核定素材"
                        })]
                      }) })
                    ] }, p.id)) })] })
                  }) : /* @__PURE__ */ (0, l.jsxs)("div", {
                    className: "empty",
                    children: [
                      /* @__PURE__ */ (0, l.jsx)(Qr, { size: 32 }),
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
                      Z({
                        stageId: "08",
                        reason: "",
                        shotId: ""
                      }), fe("issue");
                    },
                    children: [/* @__PURE__ */ (0, l.jsx)(Pt, { size: 16 }), "新增問題"]
                  })]
                }), v.issues.length ? /* @__PURE__ */ (0, l.jsx)("div", {
                  className: "issue-list",
                  children: [...v.issues].reverse().map((p) => /* @__PURE__ */ (0, l.jsxs)("article", {
                    className: "issue-card",
                    children: [
                      /* @__PURE__ */ (0, l.jsxs)("div", {
                        className: "issue-top",
                        children: [
                          /* @__PURE__ */ (0, l.jsx)("span", {
                            className: "status " + (p.status === "open" ? "needs_revision" : "passed"),
                            children: p.status === "open" ? "待修正" : "已複核結案"
                          }),
                          /* @__PURE__ */ (0, l.jsxs)("b", { children: [
                            p.stageId,
                            " ",
                            Kt.find((be) => be.id === p.stageId)?.title,
                            " ",
                            p.shotId ? "／" + p.shotId : ""
                          ] }),
                          /* @__PURE__ */ (0, l.jsx)("time", { children: ii(p.at) })
                        ]
                      }),
                      /* @__PURE__ */ (0, l.jsx)("p", { children: p.reason }),
                      /* @__PURE__ */ (0, l.jsx)("small", { children: p.by }),
                      p.resolution && /* @__PURE__ */ (0, l.jsxs)("div", {
                        className: "resolution",
                        children: [/* @__PURE__ */ (0, l.jsx)(zs, { size: 15 }), p.resolution]
                      }),
                      p.status === "open" && /* @__PURE__ */ (0, l.jsx)("button", {
                        className: "btn",
                        disabled: v.archived,
                        onClick: () => {
                          Z({
                            issueId: p.id,
                            resolution: ""
                          }), fe("resolve");
                        },
                        children: "填寫修正並複核"
                      })
                    ]
                  }, p.id))
                }) : /* @__PURE__ */ (0, l.jsxs)("div", {
                  className: "empty",
                  children: [
                    /* @__PURE__ */ (0, l.jsx)(zs, { size: 32 }),
                    /* @__PURE__ */ (0, l.jsx)("h3", { children: "目前沒有退修問題" }),
                    /* @__PURE__ */ (0, l.jsx)("p", { children: "發現問題時，請指定造成問題的階段。" })
                  ]
                })]
              }) : w === "chatgpt" ? /* @__PURE__ */ (0, l.jsx)(tx, {
                project: v,
                check: () => Re("")
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
                  children: [...v.audit].reverse().map((p, be) => /* @__PURE__ */ (0, l.jsxs)("div", { children: [
                    /* @__PURE__ */ (0, l.jsx)("span", {
                      className: "audit-icon " + (p.actor === "ai" ? "ai" : ""),
                      children: p.actor === "ai" ? /* @__PURE__ */ (0, l.jsx)(Jr, { size: 17 }) : /* @__PURE__ */ (0, l.jsx)(gl, { size: 17 })
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
                      }[p.action] || p.action,
                      " ",
                      /* @__PURE__ */ (0, l.jsx)("span", { children: p.detail })
                    ] }), /* @__PURE__ */ (0, l.jsx)("small", { children: p.by })] }),
                    /* @__PURE__ */ (0, l.jsx)("time", { children: ii(p.at) })
                  ] }, be))
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
                    Z({
                      title: "現實遊戲",
                      episode: "EP01"
                    }), fe("create");
                  },
                  children: [/* @__PURE__ */ (0, l.jsx)(Pt, { size: 17 }), "建立第一個製作專案"]
                }),
                /* @__PURE__ */ (0, l.jsx)("div", {
                  className: "onboarding-grid",
                  children: Kt.filter((p) => p.group === "main").map((p) => /* @__PURE__ */ (0, l.jsxs)("div", { children: [/* @__PURE__ */ (0, l.jsx)("span", { children: p.id }), p.title] }, p.id))
                }),
                /* @__PURE__ */ (0, l.jsx)("small", { children: "建立時全部階段為待製作；請依實際成果補入完成紀錄。" })
              ]
            }),
            /* @__PURE__ */ (0, l.jsxs)("footer", { children: ["製作工作台 ", /* @__PURE__ */ (0, l.jsx)("span", { children: "工作紀錄自動保存版本 · v5.0" })] })
          ]
        })]
      }),
      te && /* @__PURE__ */ (0, l.jsxs)("div", {
        className: "toast",
        role: "status",
        children: [/* @__PURE__ */ (0, l.jsx)(zs, { size: 17 }), te]
      }),
      G && /* @__PURE__ */ (0, l.jsx)("div", {
        className: "modal-backdrop",
        onMouseDown: (p) => {
          p.target === p.currentTarget && !X && fe(null);
        },
        children: /* @__PURE__ */ (0, l.jsxs)("section", {
          className: "modal " + (G === "shot" ? "large" : ""),
          role: "dialog",
          "aria-modal": "true",
          "aria-label": G === "create" ? "建立製作專案" : G === "shot" ? "鏡頭素材紀錄" : "製作確認",
          children: [/* @__PURE__ */ (0, l.jsxs)("div", {
            className: "modal-head",
            children: [/* @__PURE__ */ (0, l.jsx)("h2", { children: G === "create" ? "建立製作專案" : G === "shot" ? "鏡頭素材紀錄" : G === "issue" ? "記錄退修問題" : G === "resolve" ? "修正與複核結果" : v?.archived ? "還原專案" : "封存專案" }), /* @__PURE__ */ (0, l.jsx)("button", {
              className: "icon-btn",
              "aria-label": "關閉視窗",
              disabled: X,
              onClick: () => fe(null),
              children: /* @__PURE__ */ (0, l.jsx)(nn, { size: 21 })
            })]
          }), /* @__PURE__ */ (0, l.jsxs)("form", {
            onSubmit: We,
            children: [
              G === "create" ? /* @__PURE__ */ (0, l.jsxs)(l.Fragment, { children: [/* @__PURE__ */ (0, l.jsx)("p", {
                className: "muted",
                children: "依手冊建立完整流程，從待製作開始記錄。"
              }), [["title", "專案名稱"], ["episode", "集數"]].map(([p, be]) => /* @__PURE__ */ (0, l.jsxs)("label", {
                className: "form-field",
                children: [be, /* @__PURE__ */ (0, l.jsx)("input", {
                  required: !0,
                  maxLength: p === "title" ? 200 : 60,
                  value: se[p] || "",
                  onChange: (ve) => Z({
                    ...se,
                    [p]: ve.target.value
                  })
                })]
              }, p))] }) : G === "shot" ? /* @__PURE__ */ (0, l.jsxs)(l.Fragment, { children: [
                /* @__PURE__ */ (0, l.jsx)("p", {
                  className: "muted",
                  children: "修改既有鏡頭請使用相同 ID。系統保留前次紀錄，並要求重新驗收。"
                }),
                /* @__PURE__ */ (0, l.jsx)("div", {
                  className: "shot-form",
                  children: bf.map(([p, be]) => /* @__PURE__ */ (0, l.jsxs)("label", {
                    className: "form-field",
                    children: [be, /* @__PURE__ */ (0, l.jsx)("input", {
                      required: [
                        "id",
                        "scene",
                        "description"
                      ].includes(p),
                      maxLength: p === "id" ? 100 : 12e3,
                      value: se[p] || "",
                      placeholder: p === "id" ? "如 EP01_S06_SH03" : "",
                      onChange: (ve) => Z({
                        ...se,
                        [p]: ve.target.value
                      })
                    })]
                  }, p))
                }),
                v?.shots.find((p) => p.id === se.id)?.versions.length ? /* @__PURE__ */ (0, l.jsxs)("details", { children: [/* @__PURE__ */ (0, l.jsx)("summary", { children: "查看保留的舊版本" }), v.shots.find((p) => p.id === se.id).versions.map((p, be) => /* @__PURE__ */ (0, l.jsxs)("pre", { children: [
                  ii(p.at),
                  " · ",
                  p.by,
                  `
`,
                  JSON.stringify(p.data, null, 2)
                ] }, be))] }) : null
              ] }) : G === "issue" ? /* @__PURE__ */ (0, l.jsxs)(l.Fragment, { children: [
                /* @__PURE__ */ (0, l.jsxs)("label", {
                  className: "form-field",
                  children: ["回查階段", /* @__PURE__ */ (0, l.jsx)("select", {
                    value: se.stageId || "08",
                    onChange: (p) => Z({
                      ...se,
                      stageId: p.target.value
                    }),
                    children: Os(v).map((p) => /* @__PURE__ */ (0, l.jsxs)("option", {
                      value: p.id,
                      children: [
                        p.id,
                        " ",
                        p.title
                      ]
                    }, p.id))
                  })]
                }),
                /* @__PURE__ */ (0, l.jsxs)("label", {
                  className: "form-field",
                  children: ["受影響鏡頭（選填）", /* @__PURE__ */ (0, l.jsxs)("select", {
                    value: se.shotId || "",
                    onChange: (p) => Z({
                      ...se,
                      shotId: p.target.value
                    }),
                    children: [/* @__PURE__ */ (0, l.jsx)("option", {
                      value: "",
                      children: "整個階段"
                    }), v.shots.map((p) => /* @__PURE__ */ (0, l.jsx)("option", { children: p.id }, p.id))]
                  })]
                }),
                /* @__PURE__ */ (0, l.jsxs)("label", {
                  className: "form-field",
                  children: ["具體問題與回查原因", /* @__PURE__ */ (0, l.jsx)("textarea", {
                    required: !0,
                    rows: 5,
                    value: se.reason || "",
                    onChange: (p) => Z({
                      ...se,
                      reason: p.target.value
                    })
                  })]
                }),
                /* @__PURE__ */ (0, l.jsx)("p", {
                  className: "muted",
                  children: "此階段與受影響的下游核定將標為待修正，修正後重新驗收。"
                })
              ] }) : G === "resolve" ? /* @__PURE__ */ (0, l.jsxs)("label", {
                className: "form-field",
                children: ["已修正內容與複核依據", /* @__PURE__ */ (0, l.jsx)("textarea", {
                  required: !0,
                  rows: 6,
                  value: se.resolution || "",
                  onChange: (p) => Z({
                    ...se,
                    resolution: p.target.value
                  })
                })]
              }) : /* @__PURE__ */ (0, l.jsxs)("p", { children: ["專案", v?.archived ? "還原後可繼續製作。" : "封存後會保留全部進度與紀錄，可隨時還原。"] }),
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
                  disabled: X,
                  onClick: () => fe(null),
                  children: "取消"
                }), /* @__PURE__ */ (0, l.jsxs)("button", {
                  type: "submit",
                  className: "btn primary",
                  disabled: X,
                  children: [X ? /* @__PURE__ */ (0, l.jsx)(Kr, {
                    className: "spin",
                    size: 16
                  }) : null, G === "create" ? "建立專案" : G === "archive" ? v?.archived ? "還原專案" : "確認封存" : "儲存紀錄"]
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
function vf(r) {
  return new URL(r, new URL("./", window.location.href)).href;
}
function hx(r) {
  const m = r.split(/\r?\n/), _ = [];
  let u = !1, d = [];
  for (let T = 0; T < m.length; T++) {
    const v = m[T].trimEnd(), M = v.trim();
    if (M.startsWith("```")) {
      u && (_.push(/* @__PURE__ */ (0, l.jsx)("pre", {
        className: "essentials-code",
        children: d.join(`
`)
      }, "code" + T)), d = []), u = !u;
      continue;
    }
    if (u) {
      d.push(v);
      continue;
    }
    if (!M) continue;
    if (/^---+$/.test(M)) {
      _.push(/* @__PURE__ */ (0, l.jsx)("hr", {}, T));
      continue;
    }
    const w = M.match(/^(#{1,3})\s+(.+)$/);
    if (w) {
      const V = w[2];
      _.push(w[1].length === 1 ? /* @__PURE__ */ (0, l.jsx)("h2", { children: V }, T) : w[1].length === 2 ? /* @__PURE__ */ (0, l.jsx)("h3", { children: V }, T) : /* @__PURE__ */ (0, l.jsx)("h4", { children: V }, T));
      continue;
    }
    if (M.startsWith("|")) {
      let V = [v], R = T + 1;
      for (; R < m.length && m[R].trim().startsWith("|"); ) V.push(m[R++]);
      _.push(/* @__PURE__ */ (0, l.jsx)("pre", {
        className: "essentials-code",
        children: V.join(`
`)
      }, T)), T = R - 1;
      continue;
    }
    if (M.startsWith(">")) {
      _.push(/* @__PURE__ */ (0, l.jsx)("blockquote", { children: M.replace(/^>\s?/, "") }, T));
      continue;
    }
    const k = M.match(/^[-*]\s+(.+)$/), z = M.match(/^(\d+)\.\s+(.+)$/);
    if (k || z) {
      _.push(/* @__PURE__ */ (0, l.jsxs)("p", {
        className: "essentials-list",
        children: [z ? z[1] + ". " : "• ", k ? k[1] : z?.[2]]
      }, T));
      continue;
    }
    _.push(/* @__PURE__ */ (0, l.jsx)("p", { children: M }, T));
  }
  return _;
}
function mx() {
  const [r, m] = (0, N.useState)("handbook"), [_, u] = (0, N.useState)({}), [d, T] = (0, N.useState)({});
  (0, N.useEffect)(() => {
    const M = new AbortController();
    return Object.keys(xl).forEach(async (w) => {
      try {
        const k = await fetch(vf(xl[w].path), {
          credentials: "same-origin",
          cache: "no-store",
          signal: M.signal
        });
        if (!k.ok) throw new Error("HTTP " + k.status);
        const z = await k.text();
        if (!z.includes(w === "handbook" ? "LIZHI-AI-RULES" : "LIZHI-APP-INTAKE")) throw new Error("文件版本或內容不符");
        M.signal.aborted || u((V) => ({
          ...V,
          [w]: z
        }));
      } catch (k) {
        M.signal.aborted || T((z) => ({
          ...z,
          [w]: "目前無法載入全文（" + k.message + "），請使用下方原始文件連結。"
        }));
      }
    }), () => M.abort();
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
        children: Object.keys(xl).map((M) => /* @__PURE__ */ (0, l.jsxs)("button", {
          type: "button",
          className: "essentials-card " + (r === M ? "selected" : ""),
          onClick: () => m(M),
          "aria-pressed": r === M,
          children: [M === "handbook" ? /* @__PURE__ */ (0, l.jsx)(gl, { size: 23 }) : /* @__PURE__ */ (0, l.jsx)(dm, { size: 23 }), /* @__PURE__ */ (0, l.jsxs)("span", { children: [/* @__PURE__ */ (0, l.jsx)("b", { children: xl[M].title }), /* @__PURE__ */ (0, l.jsxs)("small", { children: [
            xl[M].version,
            " · ",
            xl[M].summary
          ] })] })]
        }, M))
      }),
      /* @__PURE__ */ (0, l.jsxs)("article", {
        className: "wide-card essentials-document",
        children: [
          /* @__PURE__ */ (0, l.jsxs)("div", {
            className: "section-title",
            children: [/* @__PURE__ */ (0, l.jsxs)("div", { children: [/* @__PURE__ */ (0, l.jsxs)("h2", { children: [/* @__PURE__ */ (0, l.jsx)(lm, { size: 19 }), v.title] }), /* @__PURE__ */ (0, l.jsxs)("p", { children: [
              "文件編號：",
              r === "handbook" ? "LIZHI-AI-RULES" : "LIZHI-APP-INTAKE",
              " · ",
              v.version
            ] })] }), /* @__PURE__ */ (0, l.jsxs)("a", {
              className: "btn",
              href: vf(v.path),
              target: "_blank",
              rel: "noopener noreferrer",
              children: [/* @__PURE__ */ (0, l.jsx)(gm, { size: 14 }), "開啟原始文件"]
            })]
          }),
          /* @__PURE__ */ (0, l.jsx)("div", {
            className: "essentials-highlights",
            children: v.highlights.map((M) => /* @__PURE__ */ (0, l.jsxs)("p", { children: ["✓ ", M] }, M))
          }),
          d[r] && /* @__PURE__ */ (0, l.jsx)("p", {
            role: "status",
            className: "essentials-warning",
            children: d[r]
          }),
          _[r] ? /* @__PURE__ */ (0, l.jsx)("div", {
            className: "essentials-fulltext",
            children: hx(_[r])
          }) : !d[r] && /* @__PURE__ */ (0, l.jsx)("p", {
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
async function xx(r, m = () => window.open("about:blank", "_blank")) {
  const _ = m();
  if (!_) throw Error("瀏覽器阻擋了原圖視窗，請允許此網站開啟新視窗後再試。");
  _.opener = null;
  try {
    _.location.replace(await r());
  } catch (u) {
    throw _.close(), u;
  }
}
var ws = {
  animation: "動畫製作",
  model: "3D 模型",
  software: "軟體開發",
  general: "一般專案"
}, jf = [
  "PLANNED",
  "IN_PROGRESS",
  "PASS",
  "FAIL",
  "BLOCKED",
  "NOT_TESTED"
], Nx = 10 * 1024 * 1024, gx = [
  "image/jpeg",
  "image/png",
  "image/webp"
];
function bx({ image: r, access: m, onEdit: _, record: u }) {
  const [d, T] = (0, N.useState)(""), [v, M] = (0, N.useState)(""), [w, k] = (0, N.useState)(!1);
  (0, N.useEffect)(() => {
    let V = !0;
    return m(r.id).then((R) => {
      V && T(R);
    }).catch((R) => {
      V && M(R.message);
    }), () => {
      V = !1;
    };
  }, [r.id, m]);
  async function z(V = !1) {
    k(!0);
    try {
      if (!V) {
        await xx(() => m(r.id));
        return;
      }
      const R = await m(r.id), re = await fetch(R);
      if (!re.ok) throw Error("原圖下載失敗");
      const pe = URL.createObjectURL(await re.blob()), J = document.createElement("a");
      J.href = pe, J.download = r.name, J.click(), setTimeout(() => URL.revokeObjectURL(pe), 1e3);
    } catch (R) {
      M(R.message);
    } finally {
      k(!1);
    }
  }
  return /* @__PURE__ */ (0, l.jsxs)("article", {
    className: "project-image-card",
    children: [/* @__PURE__ */ (0, l.jsx)("button", {
      className: "project-image-preview",
      disabled: !d || w,
      onClick: () => {
        z();
      },
      "aria-label": "查看原圖：" + r.name,
      children: d ? /* @__PURE__ */ (0, l.jsx)("img", {
        loading: "lazy",
        src: d,
        alt: r.description || r.name,
        onError: () => M("圖片連結可能已過期，請按重新載入")
      }) : /* @__PURE__ */ (0, l.jsx)("span", { children: "讀取圖片…" })
    }), /* @__PURE__ */ (0, l.jsxs)("div", {
      className: "project-image-info",
      children: [
        /* @__PURE__ */ (0, l.jsx)("b", { children: r.name }),
        /* @__PURE__ */ (0, l.jsx)("p", { children: r.description || "尚未填寫說明" }),
        r.recordId && /* @__PURE__ */ (0, l.jsxs)("small", { children: [/* @__PURE__ */ (0, l.jsx)(As, { size: 12 }), u ? "紀錄：" + u.summary : "原連結紀錄目前未列於此版本"] }),
        /* @__PURE__ */ (0, l.jsxs)("small", { children: [
          (r.size / 1024 / 1024).toFixed(2),
          " MB · ",
          new Date(r.at).toLocaleDateString("zh-TW", { timeZone: "Asia/Taipei" })
        ] }),
        v && /* @__PURE__ */ (0, l.jsx)("p", {
          className: "red-text",
          role: "alert",
          children: v
        }),
        /* @__PURE__ */ (0, l.jsxs)("div", {
          className: "project-image-actions",
          children: [/* @__PURE__ */ (0, l.jsx)("button", {
            className: "text-btn",
            onClick: _,
            children: "說明／連結紀錄"
          }), /* @__PURE__ */ (0, l.jsx)("button", {
            className: "icon-btn",
            disabled: w,
            onClick: () => {
              z(!0);
            },
            "aria-label": "下載：" + r.name,
            children: /* @__PURE__ */ (0, l.jsx)(Es, { size: 16 })
          })]
        })
      ]
    })]
  });
}
function vx({ project: r, transport: m, onSaved: _, onDirty: u, onBusy: d, recordFilter: T }) {
  const [v, M] = (0, N.useState)(!1), [w, k] = (0, N.useState)([]), [z, V] = (0, N.useState)(""), [R, re] = (0, N.useState)(T ?? ""), [pe, J] = (0, N.useState)(""), [W, le] = (0, N.useState)(""), [X, oe] = (0, N.useState)(""), [H, F] = (0, N.useState)(!1), [te, ge] = (0, N.useState)(0), [ce, I] = (0, N.useState)(null), [j, $] = (0, N.useState)(T ?? ""), ze = (0, N.useRef)(null), he = (0, N.useRef)(r.revision);
  (0, N.useEffect)(() => {
    he.current = r.revision;
  }, [r.revision]), (0, N.useEffect)(() => (u(v || !!ce), () => u(!1)), [
    v,
    ce,
    u
  ]), (0, N.useEffect)(() => {
    if (!v && !ce) return;
    const Z = (f) => f.preventDefault();
    return window.addEventListener("beforeunload", Z), () => window.removeEventListener("beforeunload", Z);
  }, [v, ce]);
  const g = (0, N.useCallback)(async (Z, f) => {
    const D = m ? await m("images", Z, f) : await fetch("/api/images" + Z, {
      cache: "no-store",
      ...f ? {
        method: "POST",
        ...f instanceof FormData ? { body: f } : {
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(f)
        }
      } : {}
    }), K = await D.json();
    if (!D.ok) throw Error(K.error || "圖片操作失敗");
    return K;
  }, [m]), ae = (0, N.useCallback)(async (Z) => (await g("?projectId=" + encodeURIComponent(r.id) + "&imageId=" + encodeURIComponent(Z))).url, [
    g,
    r.id,
    te
  ]);
  function Q(Z) {
    if (!Z) return;
    le("");
    const f = [];
    for (const D of Array.from(Z)) {
      if (!gx.includes(D.type)) {
        le("只接受 JPG、PNG、WebP；其他格式請先轉換。");
        continue;
      }
      if (!D.size || D.size > 10485760) {
        le("每張圖片上限 10 MB；過大的圖片未加入。");
        continue;
      }
      f.push({
        file: D,
        key: crypto.randomUUID(),
        status: "waiting",
        error: ""
      });
    }
    k((D) => [...D, ...f]);
  }
  async function B() {
    F(!0), d(!0), le("");
    let Z = !1;
    try {
      for (const f of w.filter((D) => D.status !== "saved")) {
        k((K) => K.map((ee) => ee.key === f.key ? {
          ...ee,
          status: "uploading",
          error: ""
        } : ee));
        const D = new FormData();
        for (const [K, ee] of Object.entries({
          projectId: r.id,
          revision: String(he.current),
          key: f.key,
          description: z,
          recordId: R,
          stageId: pe
        })) D.set(K, ee);
        D.set("file", f.file, f.file.name);
        try {
          const K = await g("", D);
          he.current = K.revision, _(K), k((ee) => ee.map((ne) => ne.key === f.key ? {
            ...ne,
            status: "saved"
          } : ne));
        } catch (K) {
          Z = !0, k((ee) => ee.map((ne) => ne.key === f.key ? {
            ...ne,
            status: "failed",
            error: K.message
          } : ne)), le(K.message);
          break;
        }
      }
      Z || (oe("圖片已存入此專案"), M(!1), k([]), V(""), ge((f) => f + 1));
    } finally {
      F(!1), d(!1);
    }
  }
  async function G(Z) {
    if (Z.preventDefault(), !!ce) {
      F(!0), d(!0), le("");
      try {
        _(await g("", {
          action: "update",
          projectId: r.id,
          revision: r.revision,
          key: crypto.randomUUID(),
          imageId: ce.id,
          description: z,
          recordId: R,
          stageId: pe
        })), I(null), oe("圖片說明與紀錄連結已保存");
      } catch (f) {
        le(f.message);
      } finally {
        F(!1), d(!1);
      }
    }
  }
  const fe = /* @__PURE__ */ (0, l.jsxs)(l.Fragment, { children: [/* @__PURE__ */ (0, l.jsx)("option", {
    value: "",
    children: "不連結紀錄"
  }), [...r.records].reverse().map((Z) => /* @__PURE__ */ (0, l.jsx)("option", {
    value: Z.id,
    children: Z.summary.slice(0, 85)
  }, Z.id))] }), se = r.images.filter((Z) => !j || Z.recordId === j);
  return /* @__PURE__ */ (0, l.jsxs)("section", {
    className: "wide-card project-images",
    children: [
      /* @__PURE__ */ (0, l.jsxs)("div", {
        className: "section-title",
        children: [/* @__PURE__ */ (0, l.jsxs)("div", { children: [/* @__PURE__ */ (0, l.jsx)("h2", { children: "專案圖片" }), /* @__PURE__ */ (0, l.jsx)("p", { children: "保存照片、參考圖與製作截圖，搭配說明和工作紀錄。" })] }), /* @__PURE__ */ (0, l.jsxs)("div", {
          className: "heading-actions",
          children: [/* @__PURE__ */ (0, l.jsx)("button", {
            className: "icon-btn bordered",
            disabled: H,
            "aria-label": "重新載入圖片",
            onClick: () => ge((Z) => Z + 1),
            children: /* @__PURE__ */ (0, l.jsx)(Ts, { size: 16 })
          }), /* @__PURE__ */ (0, l.jsxs)("button", {
            className: "btn primary",
            disabled: r.archived || H,
            onClick: () => {
              M(!0), I(null), V(""), re(j), J(""), k([]), le("");
            },
            children: [/* @__PURE__ */ (0, l.jsx)(cf, { size: 17 }), "匯入圖片"]
          })]
        })]
      }),
      /* @__PURE__ */ (0, l.jsxs)("label", {
        className: "form-field",
        children: ["依工作紀錄查看", /* @__PURE__ */ (0, l.jsxs)("select", {
          "aria-label": "依工作紀錄查看圖片",
          value: j,
          onChange: (Z) => $(Z.target.value),
          children: [/* @__PURE__ */ (0, l.jsx)("option", {
            value: "",
            children: "全部圖片"
          }), [...r.records].reverse().map((Z) => /* @__PURE__ */ (0, l.jsx)("option", {
            value: Z.id,
            children: Z.summary.slice(0, 85)
          }, Z.id))]
        })]
      }),
      X && /* @__PURE__ */ (0, l.jsx)("p", {
        role: "status",
        className: "green-text",
        children: X
      }),
      se.length ? /* @__PURE__ */ (0, l.jsx)("div", {
        className: "project-image-grid",
        children: se.map((Z) => /* @__PURE__ */ (0, l.jsx)(bx, {
          image: Z,
          access: ae,
          record: r.records.find((f) => f.id === Z.recordId),
          onEdit: () => {
            r.archived || (I(Z), V(Z.description), re(Z.recordId), J(Z.stageId), le(""));
          }
        }, Z.id + ":" + te))
      }) : /* @__PURE__ */ (0, l.jsxs)("div", {
        className: "empty",
        children: [
          /* @__PURE__ */ (0, l.jsx)(cf, { size: 30 }),
          /* @__PURE__ */ (0, l.jsx)("h3", { children: j ? "這筆紀錄還沒有圖片" : "先匯入一張圖片" }),
          /* @__PURE__ */ (0, l.jsx)("p", { children: "支援 JPG、PNG、WebP，每張最多 10 MB。圖片原檔私有保存，重新整理後仍可查看。" })
        ]
      }),
      (v || ce) && /* @__PURE__ */ (0, l.jsx)("div", {
        className: "modal-backdrop",
        children: /* @__PURE__ */ (0, l.jsxs)("section", {
          className: "modal",
          role: "dialog",
          "aria-modal": "true",
          "aria-label": v ? "匯入專案圖片" : "圖片說明與紀錄",
          children: [/* @__PURE__ */ (0, l.jsxs)("div", {
            className: "modal-head",
            children: [/* @__PURE__ */ (0, l.jsx)("h2", { children: v ? "匯入圖片" : "圖片說明與紀錄" }), /* @__PURE__ */ (0, l.jsx)("button", {
              className: "icon-btn",
              "aria-label": "關閉圖片表單",
              disabled: H,
              onClick: () => {
                window.confirm("放棄尚未儲存的表單？已成功上傳的圖片會保留。") && (M(!1), I(null));
              },
              children: /* @__PURE__ */ (0, l.jsx)(nn, { size: 20 })
            })]
          }), /* @__PURE__ */ (0, l.jsxs)("form", {
            onSubmit: (Z) => {
              v ? (Z.preventDefault(), B()) : G(Z);
            },
            children: [
              v && /* @__PURE__ */ (0, l.jsxs)(l.Fragment, { children: [
                /* @__PURE__ */ (0, l.jsxs)("label", {
                  className: "image-dropzone",
                  children: ["選擇圖片（可多選）", /* @__PURE__ */ (0, l.jsx)("input", {
                    ref: ze,
                    type: "file",
                    accept: "image/jpeg,image/png,image/webp",
                    multiple: !0,
                    disabled: H,
                    onChange: (Z) => {
                      Q(Z.target.files), Z.target.value = "";
                    }
                  })]
                }),
                /* @__PURE__ */ (0, l.jsx)("p", {
                  className: "muted",
                  children: "原檔保留，每張上限 10 MB。依序上傳；失敗時已完成的圖片仍會保存。"
                }),
                /* @__PURE__ */ (0, l.jsx)("ul", {
                  className: "image-upload-list",
                  children: w.map((Z) => /* @__PURE__ */ (0, l.jsxs)("li", { children: [
                    /* @__PURE__ */ (0, l.jsx)("span", { children: Z.file.name }),
                    /* @__PURE__ */ (0, l.jsx)("small", { children: {
                      waiting: "等待上傳",
                      uploading: "上傳中…",
                      saved: "已保存",
                      failed: "未完成"
                    }[Z.status] }),
                    Z.error && /* @__PURE__ */ (0, l.jsx)("p", {
                      role: "alert",
                      children: Z.error
                    })
                  ] }, Z.key))
                })
              ] }),
              /* @__PURE__ */ (0, l.jsxs)("label", {
                className: "form-field",
                children: [
                  "圖片說明",
                  v && w.length > 1 ? "（套用本次圖片）" : "",
                  /* @__PURE__ */ (0, l.jsx)("textarea", {
                    rows: 3,
                    maxLength: 3e3,
                    value: z,
                    disabled: H,
                    onChange: (Z) => V(Z.target.value)
                  })
                ]
              }),
              /* @__PURE__ */ (0, l.jsxs)("label", {
                className: "form-field",
                children: ["連結工作紀錄", /* @__PURE__ */ (0, l.jsx)("select", {
                  value: R,
                  disabled: H,
                  onChange: (Z) => re(Z.target.value),
                  children: fe
                })]
              }),
              /* @__PURE__ */ (0, l.jsxs)("label", {
                className: "form-field",
                children: ["所屬階段", /* @__PURE__ */ (0, l.jsxs)("select", {
                  value: pe,
                  disabled: H,
                  onChange: (Z) => J(Z.target.value),
                  children: [/* @__PURE__ */ (0, l.jsx)("option", {
                    value: "",
                    children: "不指定階段"
                  }), r.stages.map((Z) => /* @__PURE__ */ (0, l.jsxs)("option", {
                    value: Z.id,
                    children: [
                      Z.key,
                      " · ",
                      Z.title
                    ]
                  }, Z.id))]
                })]
              }),
              W && /* @__PURE__ */ (0, l.jsx)("p", {
                className: "modal-error",
                role: "alert",
                children: W
              }),
              /* @__PURE__ */ (0, l.jsxs)("div", {
                className: "modal-actions",
                children: [W && /* @__PURE__ */ (0, l.jsx)("button", {
                  className: "btn",
                  disabled: H,
                  type: "button",
                  onClick: async () => {
                    const Z = m ? await m("workspace", "?view=managed&id=" + r.id) : await fetch("/api/workspace?view=managed&id=" + r.id);
                    if (Z.ok) {
                      const f = await Z.json();
                      he.current = f.revision, _(f), le("");
                    }
                  },
                  children: "重新讀取專案"
                }), /* @__PURE__ */ (0, l.jsx)("button", {
                  className: "btn primary",
                  disabled: H || v && !w.some((Z) => Z.status !== "saved"),
                  type: "submit",
                  children: H ? "保存中…" : v ? "上傳並保存" : "保存說明"
                })]
              })
            ]
          })]
        })
      })
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
}, lo = (r) => new Date(r).toLocaleString("zh-TW", {
  timeZone: "Asia/Taipei",
  month: "numeric",
  day: "numeric",
  hour: "2-digit",
  minute: "2-digit"
});
function yf({ url: r, children: m }) {
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
function jx({ nativeTransport: r } = {}) {
  const [m, _] = (0, N.useState)([]), [u, d] = (0, N.useState)(null), [T, v] = (0, N.useState)("overview"), [M, w] = (0, N.useState)(""), [k, z] = (0, N.useState)("resume"), [V, R] = (0, N.useState)(""), [re, pe] = (0, N.useState)(!0), [J, W] = (0, N.useState)(!1), [le, X] = (0, N.useState)(""), [oe, H] = (0, N.useState)(""), [F, te] = (0, N.useState)(""), [ge, ce] = (0, N.useState)(!1), [I, j] = (0, N.useState)(!1), [$, ze] = (0, N.useState)(""), [he, g] = (0, N.useState)({}), [ae, Q] = (0, N.useState)(!1), B = (0, N.useRef)(""), G = (0, N.useRef)(0), fe = (0, N.useRef)(""), se = (0, N.useRef)(!1);
  fe.current = $;
  const Z = (0, N.useCallback)((y) => {
    se.current = y;
  }, []), f = (0, N.useCallback)(async (y, ie, me) => {
    const h = r ? await r(y, ie, me) : await fetch("/api/" + y + ie, {
      cache: "no-store",
      ...me ? {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(me)
      } : {}
    });
    if (!h.headers.get("content-type")?.includes("application/json")) throw Error("請先登入立之雲端庫");
    const P = await h.json();
    if (!h.ok) throw Error(P.error || "讀取失敗");
    return P;
  }, [r]), D = (0, N.useCallback)(async (y = B.current) => {
    const ie = ++G.current;
    try {
      const me = await f("workspace", "?view=managed"), h = y ? await f("workspace", "?view=managed&id=" + encodeURIComponent(y)) : null;
      if (ie !== G.current) return;
      _(me), fe.current || d(h), X("");
    } catch (me) {
      ie === G.current && X(me.message);
    } finally {
      ie === G.current && pe(!1);
    }
  }, [f]);
  (0, N.useEffect)(() => {
    D();
    const y = setInterval(() => {
      !fe.current && !se.current && D();
    }, 3e4);
    return () => clearInterval(y);
  }, [D]), (0, N.useEffect)(() => {
    if (!$) return;
    const y = (ie) => ie.preventDefault();
    return window.addEventListener("beforeunload", y), () => window.removeEventListener("beforeunload", y);
  }, [$]), (0, N.useEffect)(() => {
    if (!oe) return;
    const y = setTimeout(() => H(""), 4500);
    return () => clearTimeout(y);
  }, [oe]);
  async function K(y) {
    B.current = y, d(null), pe(!0), v("overview"), Q(!1), await D(y);
  }
  function ee() {
    se.current && !window.confirm("有尚未保存的圖片表單，確定離開？") || (se.current = !1, B.current = "", G.current++, d(null), w(""), Q(!1), D(""));
  }
  function ne(y, ie = {}) {
    X(""), g({
      key: crypto.randomUUID(),
      type: "software",
      status: y === "record" ? "NOT_TESTED" : "PLANNED",
      mode: "not_run",
      stageId: u?.stages[0]?.id ?? "",
      evidenceIds: [],
      sourceIds: [],
      ...ie
    }), ze(y);
  }
  async function Se(y, ie) {
    if (!(!u && y !== "createManagedProject")) {
      G.current++, W(!0);
      try {
        const me = await f("workspace", "", {
          action: y,
          id: u?.id,
          revision: u?.revision,
          args: ie
        });
        return B.current = me.id, d(me), ze(""), fe.current = "", H("已保存並讀回最新專案"), await D(me.id), me;
      } catch (me) {
        X(me.message);
      } finally {
        W(!1);
      }
    }
  }
  async function je(y) {
    y.preventDefault(), await Se({
      create: "createManagedProject",
      stage: "createProjectStage",
      task: he.taskId ? "updateProjectTask" : "createProjectTask",
      record: "appendWorkRecord",
      artifact: "registerProjectArtifact",
      source: "registerProjectSource",
      issue: "reportProjectIssue",
      resolve: "resolveProjectIssue",
      edit: "updateManagedProject",
      restore: "restoreProjectBackup"
    }[$], {
      ...he,
      ...$ === "stage" ? { stageKey: he.stageKey || he.key } : $ === "task" ? { taskKey: he.taskKey || he.key } : $ === "artifact" ? { artifactKey: he.artifactKey || he.key } : $ === "source" ? { sourceKey: he.sourceKey || he.key } : $ === "issue" ? { issueKey: he.issueKey || he.key } : {}
    });
  }
  async function Be() {
    if (u) {
      W(!0);
      try {
        const y = await f("workspace", "?view=managed&id=" + u.id);
        let ie = null;
        if (u.animation) {
          const P = await f("works", "?id=" + u.animation.workId), We = [];
          for (const jt of u.animation.episodes) We.push(await f("projects", "?id=" + jt.id));
          ie = {
            work: P.work,
            episodes: We
          };
        }
        const me = URL.createObjectURL(new Blob([JSON.stringify({
          schemaVersion: 2,
          exportedAt: (/* @__PURE__ */ new Date()).toISOString(),
          project: y,
          animation: ie
        }, null, 2)], { type: "application/json" })), h = document.createElement("a");
        h.href = me, h.download = u.title.replace(/[\\/:*?"<>|]/g, "_") + "_專案備份.json", h.click(), setTimeout(() => URL.revokeObjectURL(me), 1e3);
      } catch (y) {
        X(y.message);
      } finally {
        W(!1);
      }
    }
  }
  function Ee(y) {
    u?.workId && (z(y), w(u.workId));
  }
  function Ne(y, ie, me = !1, h = !1) {
    return /* @__PURE__ */ (0, l.jsxs)("label", {
      className: "form-field",
      children: [ie, h ? /* @__PURE__ */ (0, l.jsx)("textarea", {
        rows: 3,
        required: me,
        maxLength: y === "snapshot" ? 6e4 : 12e3,
        value: he[y] ?? "",
        onChange: (P) => g({
          ...he,
          [y]: P.target.value
        })
      }) : /* @__PURE__ */ (0, l.jsx)("input", {
        required: me,
        maxLength: y === "sha256" ? 64 : 2e3,
        value: he[y] ?? "",
        onChange: (P) => g({
          ...he,
          [y]: P.target.value
        })
      })]
    }, y);
  }
  function Re(y, ie, me) {
    return /* @__PURE__ */ (0, l.jsxs)("label", {
      className: "form-field",
      children: [ie, /* @__PURE__ */ (0, l.jsx)("select", {
        value: he[y] ?? "",
        onChange: (h) => g({
          ...he,
          [y]: h.target.value,
          ...y === "stageId" ? { taskId: "" } : {}
        }),
        children: me.map(([h, P]) => /* @__PURE__ */ (0, l.jsx)("option", {
          value: h,
          children: P
        }, h))
      })]
    });
  }
  function Ue(y, ie) {
    return /* @__PURE__ */ (0, l.jsxs)("fieldset", {
      className: "proof-picker",
      children: [/* @__PURE__ */ (0, l.jsx)("legend", { children: y === "evidenceIds" ? "成果證據" : "已讀來源" }), ie.length ? ie.map((me) => /* @__PURE__ */ (0, l.jsxs)("label", { children: [/* @__PURE__ */ (0, l.jsx)("input", {
        type: "checkbox",
        checked: (he[y] ?? []).includes(me.id),
        onChange: (h) => g({
          ...he,
          [y]: h.target.checked ? [...he[y] ?? [], me.id] : (he[y] ?? []).filter((P) => P !== me.id)
        })
      }), me.title] }, me.id)) : /* @__PURE__ */ (0, l.jsx)("small", { children: "先在成果分頁登記，僅貼連結不能作為已檢查證據。" })]
    });
  }
  return M && !ae ? /* @__PURE__ */ (0, l.jsxs)(l.Fragment, { children: [/* @__PURE__ */ (0, l.jsxs)("div", {
    className: "project-return",
    children: [/* @__PURE__ */ (0, l.jsxs)("button", {
      className: "text-btn",
      onClick: () => {
        se.current && !window.confirm("有未儲存的動畫或模型修改，確定離開？") || (se.current = !1, w(""), D());
      },
      children: [
        /* @__PURE__ */ (0, l.jsx)(nf, { size: 16 }),
        "返回 ",
        u?.title ?? "專案清單"
      ]
    }), /* @__PURE__ */ (0, l.jsx)("button", {
      className: "text-btn",
      onClick: () => {
        se.current && !window.confirm("有未儲存的動畫或模型修改，確定開啟員工必知？") || (se.current = !1, Q(!0));
      },
      children: "員工必知"
    })]
  }), /* @__PURE__ */ (0, l.jsx)(fx, {
    nativeTransport: r,
    initialWorkId: M === "legacy" ? void 0 : M,
    initialTab: k,
    onDirtyChange: Z
  }, M + k)] }) : /* @__PURE__ */ (0, l.jsxs)("div", {
    className: "project-hub",
    children: [
      /* @__PURE__ */ (0, l.jsxs)("header", {
        className: "hub-header",
        children: [
          /* @__PURE__ */ (0, l.jsxs)("div", {
            className: "hub-brand",
            children: [/* @__PURE__ */ (0, l.jsx)(Zr, { size: 22 }), /* @__PURE__ */ (0, l.jsx)("b", { children: "製作工作台" })]
          }),
          /* @__PURE__ */ (0, l.jsx)("button", {
            className: "btn" + (ae ? " primary" : ""),
            type: "button",
            "aria-pressed": ae,
            onClick: () => Q((y) => !y),
            children: "員工必知"
          }),
          /* @__PURE__ */ (0, l.jsx)("button", {
            className: "icon-btn",
            "aria-label": "重新整理",
            disabled: re || J || !!$,
            onClick: () => {
              D();
            },
            children: /* @__PURE__ */ (0, l.jsx)(Ts, { size: 18 })
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
              onClick: () => X(""),
              children: /* @__PURE__ */ (0, l.jsx)(nn, { size: 16 })
            })]
          }),
          B.current && /* @__PURE__ */ (0, l.jsxs)("button", {
            className: "text-btn hub-back",
            disabled: J,
            onClick: ee,
            children: [/* @__PURE__ */ (0, l.jsx)(nf, { size: 16 }), "我的專案"]
          }),
          ae ? /* @__PURE__ */ (0, l.jsx)(mx, {}) : re ? /* @__PURE__ */ (0, l.jsx)("div", {
            className: "empty",
            children: "讀取專案中…"
          }) : u ? /* @__PURE__ */ (0, l.jsxs)(l.Fragment, { children: [
            /* @__PURE__ */ (0, l.jsxs)("div", {
              className: "page-heading",
              children: [/* @__PURE__ */ (0, l.jsxs)("div", { children: [
                /* @__PURE__ */ (0, l.jsxs)("div", {
                  className: "eyebrow",
                  children: [
                    ws[u.kind],
                    " · ",
                    Ft[u.status]
                  ]
                }),
                /* @__PURE__ */ (0, l.jsx)("h1", { children: u.title }),
                /* @__PURE__ */ (0, l.jsx)("p", { children: u.objective || "先填寫這個專案的目標。" })
              ] }), /* @__PURE__ */ (0, l.jsxs)("div", {
                className: "heading-actions",
                children: [/* @__PURE__ */ (0, l.jsxs)("button", {
                  className: "btn",
                  disabled: J,
                  onClick: () => {
                    Be();
                  },
                  children: [/* @__PURE__ */ (0, l.jsx)(Es, { size: 15 }), "匯出備份"]
                }), /* @__PURE__ */ (0, l.jsx)("button", {
                  className: "icon-btn bordered",
                  "aria-label": u.archived ? "還原專案" : "封存專案",
                  title: u.archived ? "還原專案" : "封存專案",
                  disabled: J,
                  onClick: () => {
                    Se("updateManagedProject", {
                      key: crypto.randomUUID(),
                      status: u.archived ? "in_progress" : "archived"
                    });
                  },
                  children: /* @__PURE__ */ (0, l.jsx)(zf, { size: 17 })
                })]
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
              ].map(([y, ie]) => /* @__PURE__ */ (0, l.jsxs)("button", {
                className: T === y ? "active" : "",
                "aria-current": T === y ? "page" : void 0,
                disabled: J,
                onClick: () => {
                  se.current && !window.confirm("有尚未儲存的圖片表單，確定切換？") || (se.current = !1, R(""), v(y));
                },
                children: [ie, y === "issues" && u.issues.some((me) => me.status === "open") ? " · " + u.issues.filter((me) => me.status === "open").length : ""]
              }, y))
            }),
            T === "overview" ? /* @__PURE__ */ (0, l.jsxs)(l.Fragment, { children: [
              /* @__PURE__ */ (0, l.jsxs)("section", {
                className: "handoff-card",
                children: [
                  /* @__PURE__ */ (0, l.jsxs)("div", {
                    className: "eyebrow",
                    children: ["目前階段 · ", u.handoff.currentStage?.title ?? "尚未設定"]
                  }),
                  /* @__PURE__ */ (0, l.jsx)("h2", { children: u.handoff.nextActions[0] ?? "先建立任務或記錄本次工作" }),
                  /* @__PURE__ */ (0, l.jsx)("p", { children: u.handoff.lastWork?.summary ?? "尚無通用工作紀錄。" }),
                  u.handoff.lastWork && /* @__PURE__ */ (0, l.jsxs)("span", {
                    className: "status",
                    children: [
                      Ft[u.handoff.lastWork.status],
                      " · ",
                      Ft[u.handoff.lastWork.mode]
                    ]
                  }),
                  /* @__PURE__ */ (0, l.jsx)("div", {
                    style: { marginTop: 18 },
                    children: /* @__PURE__ */ (0, l.jsxs)("button", {
                      className: "btn primary",
                      disabled: u.archived,
                      onClick: () => ne("record"),
                      children: [/* @__PURE__ */ (0, l.jsx)(Pt, { size: 16 }), "記錄這次工作"]
                    })
                  })
                ]
              }),
              u.animation && /* @__PURE__ */ (0, l.jsxs)("div", {
                className: "hub-module-grid",
                children: [/* @__PURE__ */ (0, l.jsxs)("button", {
                  className: "module-card",
                  onClick: () => Ee("resume"),
                  children: [
                    /* @__PURE__ */ (0, l.jsx)(ci, { size: 26 }),
                    /* @__PURE__ */ (0, l.jsx)("h3", { children: "動畫製作" }),
                    /* @__PURE__ */ (0, l.jsxs)("p", { children: [u.animation.episodes.length, " 集 · 劇本、鏡頭、影格、OP／ED"] }),
                    /* @__PURE__ */ (0, l.jsx)("span", { children: "開啟動畫流程 →" })
                  ]
                }), /* @__PURE__ */ (0, l.jsxs)("button", {
                  className: "module-card",
                  onClick: () => Ee("models"),
                  children: [
                    /* @__PURE__ */ (0, l.jsx)(Nm, { size: 26 }),
                    /* @__PURE__ */ (0, l.jsx)("h3", { children: "3D 模型" }),
                    /* @__PURE__ */ (0, l.jsxs)("p", { children: [u.animation.modelCount, " 個模型 · 來源、版本與驗收"] }),
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
                      disabled: u.archived,
                      onClick: () => ne("edit", {
                        name: u.title,
                        description: u.objective,
                        status: u.status
                      }),
                      children: "編輯專案"
                    })]
                  }),
                  /* @__PURE__ */ (0, l.jsxs)("p", { children: [
                    u.managedTasks.filter((y) => y.status !== "PASS").length,
                    " 項工作未完成 · ",
                    u.issues.filter((y) => y.status === "open").length,
                    " 項問題"
                  ] }),
                  /* @__PURE__ */ (0, l.jsx)("h3", { children: "操作限制" }),
                  u.restrictions.map((y, ie) => /* @__PURE__ */ (0, l.jsx)("p", {
                    className: "muted",
                    children: y
                  }, ie)),
                  /* @__PURE__ */ (0, l.jsxs)("details", { children: [
                    /* @__PURE__ */ (0, l.jsx)("summary", { children: "進階資訊與 AI 交接資料" }),
                    /* @__PURE__ */ (0, l.jsxs)("p", { children: [
                      "紀錄版本 ",
                      u.revision,
                      " · 更新於 ",
                      lo(u.updatedAt)
                    ] }),
                    /* @__PURE__ */ (0, l.jsx)("pre", {
                      className: "hub-json",
                      children: JSON.stringify(u.handoff, null, 2)
                    }),
                    /* @__PURE__ */ (0, l.jsx)("h3", { children: "異動紀錄" }),
                    [...u.history].reverse().map((y, ie) => /* @__PURE__ */ (0, l.jsxs)("p", {
                      className: "muted",
                      children: [
                        lo(y.at),
                        " · ",
                        y.by,
                        " · ",
                        y.action
                      ]
                    }, ie)),
                    /* @__PURE__ */ (0, l.jsxs)("label", {
                      className: "form-field",
                      children: ["回復本專案的通用資料備份", /* @__PURE__ */ (0, l.jsx)("input", {
                        type: "file",
                        accept: "application/json,.json",
                        disabled: J,
                        onChange: async (y) => {
                          try {
                            const ie = y.target.files?.[0];
                            if (!ie) return;
                            if (ie.size > 24e6) throw Error("備份過大");
                            const me = JSON.parse(await ie.text());
                            if (me.schemaVersion !== 2 || me.project?.id !== u.id) throw Error("請選取此專案的 v2 備份");
                            ne("restore", { backup: me.project });
                          } catch (ie) {
                            X(ie.message);
                          }
                          y.target.value = "";
                        }
                      })]
                    })
                  ] })
                ]
              })
            ] }) : T === "stages" ? /* @__PURE__ */ (0, l.jsxs)(l.Fragment, { children: [/* @__PURE__ */ (0, l.jsxs)("div", {
              className: "section-title",
              children: [/* @__PURE__ */ (0, l.jsx)("h2", { children: "階段與工作項目" }), /* @__PURE__ */ (0, l.jsxs)("button", {
                className: "btn",
                disabled: u.archived,
                onClick: () => ne("stage"),
                children: [/* @__PURE__ */ (0, l.jsx)(Pt, { size: 16 }), "新增階段"]
              })]
            }), u.stages.map((y) => /* @__PURE__ */ (0, l.jsxs)("section", {
              className: "wide-card stage-work-card",
              children: [/* @__PURE__ */ (0, l.jsxs)("div", {
                className: "section-title",
                children: [/* @__PURE__ */ (0, l.jsxs)("div", { children: [/* @__PURE__ */ (0, l.jsxs)("h3", { children: [
                  y.key,
                  " · ",
                  y.title
                ] }), /* @__PURE__ */ (0, l.jsx)("span", {
                  className: "status",
                  children: Ft[y.status]
                })] }), /* @__PURE__ */ (0, l.jsx)("button", {
                  className: "text-btn",
                  disabled: u.archived,
                  onClick: () => ne("task", { stageId: y.id }),
                  children: "新增工作"
                })]
              }), u.managedTasks.filter((ie) => ie.stageId === y.id).map((ie) => /* @__PURE__ */ (0, l.jsxs)("article", {
                className: "task-card",
                children: [
                  /* @__PURE__ */ (0, l.jsxs)("div", { children: [
                    /* @__PURE__ */ (0, l.jsx)("b", { children: ie.title }),
                    /* @__PURE__ */ (0, l.jsx)("small", { children: Ft[ie.status] }),
                    ie.nextAction && /* @__PURE__ */ (0, l.jsxs)("p", { children: ["下一步：", ie.nextAction] })
                  ] }),
                  /* @__PURE__ */ (0, l.jsx)("button", {
                    className: "text-btn",
                    disabled: u.archived,
                    onClick: () => ne("record", {
                      stageId: y.id,
                      taskId: ie.id,
                      summary: ie.title
                    }),
                    children: "回報"
                  }),
                  /* @__PURE__ */ (0, l.jsx)("button", {
                    className: "text-btn",
                    disabled: u.archived,
                    onClick: () => ne("task", {
                      ...ie,
                      key: crypto.randomUUID(),
                      taskId: ie.id
                    }),
                    children: "編輯"
                  })
                ]
              }, ie.id))]
            }, y.id))] }) : T === "records" ? /* @__PURE__ */ (0, l.jsxs)("section", {
              className: "wide-card",
              children: [
                /* @__PURE__ */ (0, l.jsxs)("div", {
                  className: "section-title",
                  children: [/* @__PURE__ */ (0, l.jsxs)("div", { children: [/* @__PURE__ */ (0, l.jsx)("h2", { children: "執行紀錄" }), /* @__PURE__ */ (0, l.jsx)("p", { children: "計畫、模擬與實測分開保存；沒有證據不會轉成 PASS。" })] }), /* @__PURE__ */ (0, l.jsxs)("button", {
                    className: "btn primary",
                    disabled: u.archived,
                    onClick: () => ne("record"),
                    children: [/* @__PURE__ */ (0, l.jsx)(Pt, { size: 16 }), "新增紀錄"]
                  })]
                }),
                !u.records.length && /* @__PURE__ */ (0, l.jsx)("div", {
                  className: "empty",
                  children: "還沒有工作紀錄。"
                }),
                [...u.records].reverse().map((y) => /* @__PURE__ */ (0, l.jsxs)("article", {
                  className: "journal-card",
                  children: [
                    /* @__PURE__ */ (0, l.jsxs)("div", {
                      className: "journal-meta",
                      children: [
                        /* @__PURE__ */ (0, l.jsx)("span", {
                          className: "result-badge " + y.status.toLowerCase(),
                          children: Ft[y.status]
                        }),
                        /* @__PURE__ */ (0, l.jsxs)("span", { children: [
                          Ft[y.mode],
                          " · ",
                          y.scope
                        ] }),
                        /* @__PURE__ */ (0, l.jsxs)("small", { children: [
                          lo(y.at),
                          " · ",
                          y.by
                        ] })
                      ]
                    }),
                    /* @__PURE__ */ (0, l.jsx)("h3", { children: y.summary }),
                    /* @__PURE__ */ (0, l.jsxs)("dl", { children: [
                      /* @__PURE__ */ (0, l.jsx)("dt", { children: "方法與結果" }),
                      /* @__PURE__ */ (0, l.jsxs)("dd", { children: [
                        y.method,
                        `
`,
                        y.result
                      ] }),
                      /* @__PURE__ */ (0, l.jsx)("dt", { children: "證據" }),
                      /* @__PURE__ */ (0, l.jsx)("dd", { children: [...y.evidenceIds.map((ie) => u.artifacts.find((me) => me.id === ie)?.title), ...y.sourceIds.map((ie) => u.sources.find((me) => me.id === ie)?.title)].filter(Boolean).join("、") || "未附可核對證據" }),
                      /* @__PURE__ */ (0, l.jsx)("dt", { children: "下一步" }),
                      /* @__PURE__ */ (0, l.jsx)("dd", { children: y.nextStep }),
                      y.limitations && /* @__PURE__ */ (0, l.jsxs)(l.Fragment, { children: [/* @__PURE__ */ (0, l.jsx)("dt", { children: "限制" }), /* @__PURE__ */ (0, l.jsx)("dd", { children: y.limitations })] })
                    ] }),
                    /* @__PURE__ */ (0, l.jsxs)("button", {
                      className: "text-btn",
                      onClick: () => {
                        R(y.id), v("images");
                      },
                      children: ["圖片 · ", u.images.filter((ie) => ie.recordId === y.id).length]
                    }),
                    y.requestedStatus !== y.status && /* @__PURE__ */ (0, l.jsxs)("p", {
                      className: "modal-error",
                      children: [
                        "原回報 ",
                        y.requestedStatus,
                        "；",
                        y.validationNote
                      ]
                    })
                  ]
                }, y.id))
              ]
            }) : T === "images" ? /* @__PURE__ */ (0, l.jsx)(vx, {
              project: u,
              transport: r,
              recordFilter: V,
              onDirty: Z,
              onBusy: W,
              onSaved: (y) => {
                G.current++, d(y);
              }
            }, u.id + V) : T === "artifacts" ? /* @__PURE__ */ (0, l.jsxs)("section", {
              className: "wide-card",
              children: [
                /* @__PURE__ */ (0, l.jsxs)("div", {
                  className: "section-title",
                  children: [/* @__PURE__ */ (0, l.jsx)("h2", { children: "成果與來源" }), /* @__PURE__ */ (0, l.jsxs)("div", {
                    className: "heading-actions",
                    children: [/* @__PURE__ */ (0, l.jsx)("button", {
                      className: "btn",
                      disabled: u.archived,
                      onClick: () => ne("source"),
                      children: "登記來源"
                    }), /* @__PURE__ */ (0, l.jsxs)("button", {
                      className: "btn primary",
                      disabled: u.archived,
                      onClick: () => ne("artifact"),
                      children: [/* @__PURE__ */ (0, l.jsx)(Pt, { size: 16 }), "登記成果"]
                    })]
                  })]
                }),
                !u.artifacts.length && /* @__PURE__ */ (0, l.jsx)("p", {
                  className: "muted",
                  children: "尚無成果；檔案位置只是引用，需檢查內容及雜湊才能作為 PASS 證據。"
                }),
                u.artifacts.map((y) => /* @__PURE__ */ (0, l.jsxs)("article", {
                  className: "journal-card",
                  children: [
                    /* @__PURE__ */ (0, l.jsx)("h3", { children: /* @__PURE__ */ (0, l.jsx)(yf, {
                      url: y.location,
                      children: y.title
                    }) }),
                    /* @__PURE__ */ (0, l.jsxs)("p", { children: [
                      y.version,
                      " · ",
                      y.availability === "inspected" ? "已檢查（執行者回報）" : "僅登記位置"
                    ] }),
                    /* @__PURE__ */ (0, l.jsx)("p", {
                      className: "preserve-text",
                      children: y.inspection
                    }),
                    /* @__PURE__ */ (0, l.jsxs)("details", { children: [/* @__PURE__ */ (0, l.jsx)("summary", { children: "版本與雜湊" }), /* @__PURE__ */ (0, l.jsx)("code", { children: y.sha256 || "未提供" })] })
                  ]
                }, y.id)),
                /* @__PURE__ */ (0, l.jsx)("h3", { children: "資料來源" }),
                u.sources.map((y) => /* @__PURE__ */ (0, l.jsxs)("article", {
                  className: "journal-card",
                  children: [
                    /* @__PURE__ */ (0, l.jsx)("b", { children: /* @__PURE__ */ (0, l.jsx)(yf, {
                      url: y.location,
                      children: y.title
                    }) }),
                    /* @__PURE__ */ (0, l.jsxs)("p", { children: [
                      y.readStatus === "read" ? "已讀內容快照" : "未讀，只登記連結",
                      " · ",
                      y.version
                    ] }),
                    /* @__PURE__ */ (0, l.jsx)("p", { children: y.observation }),
                    /* @__PURE__ */ (0, l.jsxs)("details", { children: [
                      /* @__PURE__ */ (0, l.jsx)("summary", { children: "查看保存的來源內容" }),
                      /* @__PURE__ */ (0, l.jsx)("pre", {
                        className: "hub-json",
                        children: y.snapshot || "尚未讀取"
                      }),
                      /* @__PURE__ */ (0, l.jsx)("code", { children: y.sha256 })
                    ] })
                  ]
                }, y.id))
              ]
            }) : /* @__PURE__ */ (0, l.jsxs)("section", {
              className: "wide-card",
              children: [
                /* @__PURE__ */ (0, l.jsxs)("div", {
                  className: "section-title",
                  children: [/* @__PURE__ */ (0, l.jsx)("h2", { children: "問題與阻礙" }), /* @__PURE__ */ (0, l.jsx)("button", {
                    className: "btn primary",
                    disabled: u.archived,
                    onClick: () => ne("issue"),
                    children: "新增問題"
                  })]
                }),
                !u.issues.length && /* @__PURE__ */ (0, l.jsx)("div", {
                  className: "empty",
                  children: "尚未登記問題。"
                }),
                u.issues.map((y) => /* @__PURE__ */ (0, l.jsxs)("article", {
                  className: "journal-card",
                  children: [
                    /* @__PURE__ */ (0, l.jsx)("span", {
                      className: "status",
                      children: y.status === "open" ? "待處理" : "已記錄解法"
                    }),
                    /* @__PURE__ */ (0, l.jsx)("h3", { children: y.title }),
                    /* @__PURE__ */ (0, l.jsx)("p", {
                      className: "preserve-text",
                      children: y.detail
                    }),
                    y.resolution && /* @__PURE__ */ (0, l.jsx)("p", {
                      className: "preserve-text",
                      children: y.resolution
                    }),
                    y.status === "open" && /* @__PURE__ */ (0, l.jsx)("button", {
                      className: "btn",
                      disabled: u.archived,
                      onClick: () => ne("resolve", { issueId: y.id }),
                      children: "填寫處理結果"
                    })
                  ]
                }, y.id))
              ]
            })
          ] }) : /* @__PURE__ */ (0, l.jsxs)(l.Fragment, { children: [/* @__PURE__ */ (0, l.jsxs)("div", {
            className: "page-heading",
            children: [/* @__PURE__ */ (0, l.jsxs)("div", { children: [
              /* @__PURE__ */ (0, l.jsx)("div", {
                className: "eyebrow",
                children: "立之雲端庫"
              }),
              /* @__PURE__ */ (0, l.jsx)("h1", { children: I ? "專案範本" : "我的專案" }),
              /* @__PURE__ */ (0, l.jsx)("p", { children: "把目標、過程和成果放在同一個專案裡。" })
            ] }), /* @__PURE__ */ (0, l.jsxs)("div", {
              className: "heading-actions",
              children: [/* @__PURE__ */ (0, l.jsx)("button", {
                className: "btn",
                onClick: () => j(!I),
                children: I ? "我的專案" : "專案範本"
              }), /* @__PURE__ */ (0, l.jsxs)("button", {
                className: "btn primary",
                onClick: () => ne("create"),
                children: [/* @__PURE__ */ (0, l.jsx)(Pt, { size: 17 }), "建立專案"]
              })]
            })]
          }), I ? /* @__PURE__ */ (0, l.jsx)("div", {
            className: "hub-project-grid",
            children: Object.entries(ws).map(([y, ie]) => /* @__PURE__ */ (0, l.jsxs)("button", {
              className: "hub-project-card",
              onClick: () => ne("create", { type: y }),
              children: [
                /* @__PURE__ */ (0, l.jsx)(Zr, { size: 24 }),
                /* @__PURE__ */ (0, l.jsx)("h2", { children: ie }),
                /* @__PURE__ */ (0, l.jsx)("p", { children: y === "animation" ? "集數、共用模型與既有動畫專業流程。" : y === "model" ? "八個模型工作階段，保存來源、候選、檢查與交接。" : y === "software" ? "需求、設計、實作、測試、發布與維護。" : "自訂階段、任務、工作紀錄及交付。" }),
                /* @__PURE__ */ (0, l.jsx)("span", { children: "使用範本 →" })
              ]
            }, y))
          }) : /* @__PURE__ */ (0, l.jsxs)(l.Fragment, { children: [
            /* @__PURE__ */ (0, l.jsxs)("div", {
              className: "hub-filter",
              children: [/* @__PURE__ */ (0, l.jsxs)("label", {
                className: "search",
                children: [/* @__PURE__ */ (0, l.jsx)(_f, { size: 16 }), /* @__PURE__ */ (0, l.jsx)("input", {
                  "aria-label": "搜尋專案",
                  placeholder: "搜尋專案",
                  value: F,
                  onChange: (y) => te(y.target.value)
                })]
              }), /* @__PURE__ */ (0, l.jsxs)("label", { children: [/* @__PURE__ */ (0, l.jsx)("input", {
                type: "checkbox",
                checked: ge,
                onChange: (y) => ce(y.target.checked)
              }), " 顯示封存"] })]
            }),
            /* @__PURE__ */ (0, l.jsx)("div", {
              className: "hub-project-grid",
              children: m.filter((y) => (ge || !y.archived) && y.name.toLowerCase().includes(F.toLowerCase())).map((y) => /* @__PURE__ */ (0, l.jsxs)("button", {
                className: "hub-project-card",
                onClick: () => {
                  K(y.id);
                },
                children: [
                  /* @__PURE__ */ (0, l.jsxs)("div", {
                    className: "project-card-top",
                    children: [y.type === "animation" ? /* @__PURE__ */ (0, l.jsx)(ci, { size: 24 }) : y.type === "software" ? /* @__PURE__ */ (0, l.jsx)(fm, { size: 24 }) : /* @__PURE__ */ (0, l.jsx)(Zr, { size: 24 }), /* @__PURE__ */ (0, l.jsx)("span", { children: ws[y.type] })]
                  }),
                  /* @__PURE__ */ (0, l.jsx)("h2", { children: y.name }),
                  /* @__PURE__ */ (0, l.jsxs)("p", { children: ["目前階段：", y.currentStage] }),
                  /* @__PURE__ */ (0, l.jsxs)("div", {
                    className: "project-card-next",
                    children: [
                      /* @__PURE__ */ (0, l.jsx)("small", { children: "最近工作" }),
                      /* @__PURE__ */ (0, l.jsx)("strong", { children: y.recentWork }),
                      /* @__PURE__ */ (0, l.jsx)("small", { children: "下一個待辦" }),
                      /* @__PURE__ */ (0, l.jsx)("strong", { children: y.nextAction })
                    ]
                  }),
                  /* @__PURE__ */ (0, l.jsxs)("div", {
                    className: "project-card-bottom",
                    children: [/* @__PURE__ */ (0, l.jsx)("span", {}), /* @__PURE__ */ (0, l.jsx)("span", { children: "開啟專案 →" })]
                  })
                ]
              }, y.id))
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
                  z("resume"), w("legacy");
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
      oe && /* @__PURE__ */ (0, l.jsx)("div", {
        role: "status",
        className: "toast",
        children: oe
      }),
      $ && /* @__PURE__ */ (0, l.jsx)("div", {
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
            }[$] }), /* @__PURE__ */ (0, l.jsx)("button", {
              className: "icon-btn",
              "aria-label": "關閉表單",
              disabled: J,
              onClick: () => {
                window.confirm("確定放棄尚未儲存的表單？") && ze("");
              },
              children: /* @__PURE__ */ (0, l.jsx)(nn, { size: 20 })
            })]
          }), /* @__PURE__ */ (0, l.jsxs)("form", {
            onSubmit: je,
            children: [
              $ === "create" ? /* @__PURE__ */ (0, l.jsxs)(l.Fragment, { children: [
                Re("type", "專案類型", Object.entries(ws)),
                Ne("name", "專案名稱", !0),
                Ne("description", "專案目標", !1, !0)
              ] }) : $ === "stage" ? /* @__PURE__ */ (0, l.jsxs)(l.Fragment, { children: [Ne("stageKey", "階段編號（例如 M0）", !0), Ne("title", "階段名稱", !0)] }) : $ === "edit" ? /* @__PURE__ */ (0, l.jsxs)(l.Fragment, { children: [
                u?.kind !== "animation" && Ne("name", "專案名稱", !0),
                Ne("description", "專案目標", !1, !0),
                Re("status", "專案狀態", Object.entries(Ft).filter(([y]) => [
                  "planning",
                  "in_progress",
                  "blocked",
                  "completed"
                ].includes(y)))
              ] }) : $ === "restore" ? /* @__PURE__ */ (0, l.jsx)("p", { children: "以新版本回復此專案的通用資料，保留回復前內容與異動紀錄。動畫及模型專業資料維持現況。" }) : $ === "resolve" ? Ne("resolution", "處理方式與依據", !0, !0) : /* @__PURE__ */ (0, l.jsxs)(l.Fragment, { children: [[
                "task",
                "record",
                "issue",
                "artifact"
              ].includes($) && Re("stageId", "階段", [...$ === "artifact" || $ === "issue" ? [["", "不指定階段"]] : [], ...(u?.stages ?? []).map((y) => [y.id, y.key + " · " + y.title])]), $ === "task" ? /* @__PURE__ */ (0, l.jsxs)(l.Fragment, { children: [
                Ne("title", "工作項目", !0),
                Re("status", "目前狀態", jf.map((y) => [y, Ft[y]])),
                Ne("nextAction", "下一步", !1, !0),
                /* @__PURE__ */ (0, l.jsx)("p", {
                  className: "muted",
                  children: "選擇 PASS 仍需有此任務的測試紀錄及證據，否則保存為待驗證。"
                })
              ] }) : $ === "record" ? /* @__PURE__ */ (0, l.jsxs)(l.Fragment, { children: [
                Re("taskId", "對應工作", [["", "整個階段"], ...(u?.managedTasks ?? []).filter((y) => y.stageId === he.stageId).map((y) => [y.id, y.title])]),
                Re("status", "回報結果", jf.map((y) => [y, Ft[y]])),
                Re("mode", "這次如何執行", [
                  "actual",
                  "simulation",
                  "document",
                  "not_run"
                ].map((y) => [y, Ft[y]])),
                Ne("scope", "測試／工作範圍（例如 ezdxf 或模擬 MCP）", !0),
                Ne("summary", "這次實際做了什麼", !0, !0),
                Ne("method", "檢查方法", !1, !0),
                Ne("result", "檢查結果", !1, !0),
                Ue("evidenceIds", u?.artifacts ?? []),
                Ue("sourceIds", u?.sources ?? []),
                Ne("limitations", "限制與未完成項目", !1, !0),
                Ne("nextStep", "下一位接手要做什麼", !0, !0),
                /* @__PURE__ */ (0, l.jsx)("p", {
                  className: "muted",
                  children: "無有效證據的 PASS 回報會保存為 NOT_TESTED；模擬通過不代表實機通過。"
                })
              ] }) : $ === "artifact" ? /* @__PURE__ */ (0, l.jsxs)(l.Fragment, { children: [
                Ne("title", "成果名稱", !0),
                Ne("location", "成果檔案位置", !0),
                Ne("version", "成果版本"),
                Re("availability", "檢查情形", [["reference", "只登記位置"], ["inspected", "已檢查內容"]]),
                Ne("sha256", "SHA-256", he.availability === "inspected"),
                Ne("inspection", "實際檢查內容", he.availability === "inspected", !0)
              ] }) : $ === "source" ? /* @__PURE__ */ (0, l.jsxs)(l.Fragment, { children: [
                Ne("title", "來源名稱", !0),
                Ne("location", "來源位置", !0),
                Ne("version", "來源版本"),
                Re("readStatus", "閱讀情形", [["reference", "未讀，只登記連結"], ["read", "已讀取內容"]]),
                Ne("snapshot", "讀取內容快照", he.readStatus === "read", !0),
                Ne("sha256", "內容 SHA-256", he.readStatus === "read"),
                Ne("observation", "閱讀觀察", he.readStatus === "read", !0)
              ] }) : /* @__PURE__ */ (0, l.jsxs)(l.Fragment, { children: [Ne("title", "問題名稱", !0), Ne("detail", "問題、影響及缺少的條件", !0, !0)] })] }),
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
                  disabled: J,
                  children: J ? "儲存中…" : $ === "restore" ? "回復成新版本" : "儲存並讀回"
                })
              })
            ]
          })]
        })
      })
    ]
  });
}
var yx = `
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

:host{display:block;--bg:#f7f8fa;--ink:#23322e;--muted:#85908b;--green:#326552;--border:#e4e9e6;--mint:#edf4ef;--font:'Noto Sans TC','Microsoft JhengHei',system-ui,sans-serif;color:var(--ink);font:14px/1.6 var(--font);background:var(--bg)}.native-production{min-width:0}.workspace{display:grid;grid-template-columns:230px minmax(0,1fr);min-height:calc(100dvh - 70px)}.sidebar{position:sticky;inset:auto;top:0;width:auto;height:calc(100dvh - 70px);overflow-y:auto;padding-top:20px}.brand{display:none}.main{margin-left:0!important}.topbar{height:48px}.page-content{padding:24px}.cloud-indicator{font-size:11px}.sidebar nav{max-height:none}.side-bottom{padding-top:20px}@media(max-width:850px){.workspace{grid-template-columns:185px minmax(0,1fr)}.page-content{padding:20px}}@media(max-width:600px){.workspace{display:block}.sidebar{position:relative;height:auto;padding:12px 16px 0}.main{margin:0}.topbar{display:none}.page-content{padding:20px 16px}.page-heading{margin-top:0}.page-heading p{max-width:none;font-size:12px}.sidebar .new-project{margin-bottom:6px}h1{font-size:24px}}`, Sx = "https://hrdzywkihfqggiwjgavi.supabase.co/functions/v1/lizhi-production", ks = /* @__PURE__ */ new WeakMap(), zx = async (r, m, _) => {
  const u = window.LizhiAuth;
  if (!u?.client) throw new Error("請先登入立之雲端庫");
  const { data: d, error: T } = await u.client.auth.getSession();
  if (T || !d.session?.access_token) throw new Error("登入已失效，請重新登入雲端庫");
  return fetch(Sx + "/" + r + m, {
    cache: "no-store",
    headers: {
      Authorization: "Bearer " + d.session.access_token,
      apikey: window.LIZHI_SUPABASE_PUBLISHABLE_KEY,
      ..._ && !(_ instanceof FormData) ? { "Content-Type": "application/json" } : {}
    },
    ..._ ? {
      method: "POST",
      body: _ instanceof FormData ? _ : JSON.stringify(_)
    } : {}
  });
};
function wx(r) {
  if (ks.has(r)) return;
  const m = r.attachShadow({ mode: "open" }), _ = document.createElement("style");
  _.textContent = yx, m.append(_);
  const u = document.createElement("div");
  u.className = "native-production", m.append(u);
  const d = (0, Hm.createRoot)(u);
  ks.set(r, d), d.render(/* @__PURE__ */ (0, l.jsx)(jx, { nativeTransport: zx }));
}
function _x(r) {
  ks.get(r)?.unmount(), ks.delete(r);
}
export {
  wx as mount,
  _x as unmount
};
