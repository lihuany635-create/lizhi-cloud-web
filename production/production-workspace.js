var ia = (r, x) => () => (x || (r((x = { exports: {} }).exports, x), r = null), x.exports), Uh = /* @__PURE__ */ ia(((r) => {
  function x(X, B) {
    var G = X.length;
    X.push(B);
    e: for (; 0 < G; ) {
      var ce = G - 1 >>> 1, fe = X[ce];
      if (0 < o(fe, B)) X[ce] = B, X[G] = fe, G = ce;
      else break e;
    }
  }
  function C(X) {
    return X.length === 0 ? null : X[0];
  }
  function p(X) {
    if (X.length === 0) return null;
    var B = X[0], G = X.pop();
    if (G !== B) {
      X[0] = G;
      e: for (var ce = 0, fe = X.length, Ae = fe >>> 1; ce < Ae; ) {
        var h = 2 * (ce + 1) - 1, R = X[h], J = h + 1, ae = X[J];
        if (0 > o(R, G)) J < fe && 0 > o(ae, R) ? (X[ce] = ae, X[J] = G, ce = J) : (X[ce] = R, X[h] = G, ce = h);
        else if (J < fe && 0 > o(ae, G)) X[ce] = ae, X[J] = G, ce = J;
        else break e;
      }
    }
    return B;
  }
  function o(X, B) {
    var G = X.sortIndex - B.sortIndex;
    return G !== 0 ? G : X.id - B.id;
  }
  if (r.unstable_now = void 0, typeof performance == "object" && typeof performance.now == "function") {
    var M = performance;
    r.unstable_now = function() {
      return M.now();
    };
  } else {
    var S = Date, H = S.now();
    r.unstable_now = function() {
      return S.now() - H;
    };
  }
  var T = [], A = [], z = 1, K = null, U = 3, ne = !1, he = !1, I = !1, $ = !1, de = typeof setTimeout == "function" ? setTimeout : null, Q = typeof clearTimeout == "function" ? clearTimeout : null, oe = typeof setImmediate < "u" ? setImmediate : null;
  function V(X) {
    for (var B = C(A); B !== null; ) {
      if (B.callback === null) p(A);
      else if (B.startTime <= X) p(A), B.sortIndex = B.expirationTime, x(T, B);
      else break;
      B = C(A);
    }
  }
  function W(X) {
    if (I = !1, V(X), !he) if (C(T) !== null) he = !0, P || (P = !0, Se());
    else {
      var B = C(A);
      B !== null && ee(W, B.startTime - X);
    }
  }
  var P = !1, ge = -1, pe = 5, Y = -1;
  function j() {
    return $ ? !0 : !(r.unstable_now() - Y < pe);
  }
  function Z() {
    if ($ = !1, P) {
      var X = r.unstable_now();
      Y = X;
      var B = !0;
      try {
        e: {
          he = !1, I && (I = !1, Q(ge), ge = -1), ne = !0;
          var G = U;
          try {
            t: {
              for (V(X), K = C(T); K !== null && !(K.expirationTime > X && j()); ) {
                var ce = K.callback;
                if (typeof ce == "function") {
                  K.callback = null, U = K.priorityLevel;
                  var fe = ce(K.expirationTime <= X);
                  if (X = r.unstable_now(), typeof fe == "function") {
                    K.callback = fe, V(X), B = !0;
                    break t;
                  }
                  K === C(T) && p(T), V(X);
                } else p(T);
                K = C(T);
              }
              if (K !== null) B = !0;
              else {
                var Ae = C(A);
                Ae !== null && ee(W, Ae.startTime - X), B = !1;
              }
            }
            break e;
          } finally {
            K = null, U = G, ne = !1;
          }
          B = void 0;
        }
      } finally {
        B ? Se() : P = !1;
      }
    }
  }
  var Se;
  if (typeof oe == "function") Se = function() {
    oe(Z);
  };
  else if (typeof MessageChannel < "u") {
    var qe = new MessageChannel(), g = qe.port2;
    qe.port1.onmessage = Z, Se = function() {
      g.postMessage(null);
    };
  } else Se = function() {
    de(Z, 0);
  };
  function ee(X, B) {
    ge = de(function() {
      X(r.unstable_now());
    }, B);
  }
  r.unstable_IdlePriority = 5, r.unstable_ImmediatePriority = 1, r.unstable_LowPriority = 4, r.unstable_NormalPriority = 3, r.unstable_Profiling = null, r.unstable_UserBlockingPriority = 2, r.unstable_cancelCallback = function(X) {
    X.callback = null;
  }, r.unstable_forceFrameRate = function(X) {
    0 > X || 125 < X ? console.error("forceFrameRate takes a positive int between 0 and 125, forcing frame rates higher than 125 fps is not supported") : pe = 0 < X ? Math.floor(1e3 / X) : 5;
  }, r.unstable_getCurrentPriorityLevel = function() {
    return U;
  }, r.unstable_next = function(X) {
    switch (U) {
      case 1:
      case 2:
      case 3:
        var B = 3;
        break;
      default:
        B = U;
    }
    var G = U;
    U = B;
    try {
      return X();
    } finally {
      U = G;
    }
  }, r.unstable_requestPaint = function() {
    $ = !0;
  }, r.unstable_runWithPriority = function(X, B) {
    switch (X) {
      case 1:
      case 2:
      case 3:
      case 4:
      case 5:
        break;
      default:
        X = 3;
    }
    var G = U;
    U = X;
    try {
      return B();
    } finally {
      U = G;
    }
  }, r.unstable_scheduleCallback = function(X, B, G) {
    var ce = r.unstable_now();
    switch (typeof G == "object" && G !== null ? (G = G.delay, G = typeof G == "number" && 0 < G ? ce + G : ce) : G = ce, X) {
      case 1:
        var fe = -1;
        break;
      case 2:
        fe = 250;
        break;
      case 5:
        fe = 1073741823;
        break;
      case 4:
        fe = 1e4;
        break;
      default:
        fe = 5e3;
    }
    return fe = G + fe, X = {
      id: z++,
      callback: B,
      priorityLevel: X,
      startTime: G,
      expirationTime: fe,
      sortIndex: -1
    }, G > ce ? (X.sortIndex = G, x(A, X), C(T) === null && X === C(A) && (I ? (Q(ge), ge = -1) : I = !0, ee(W, G - ce))) : (X.sortIndex = fe, x(T, X), he || ne || (he = !0, P || (P = !0, Se()))), X;
  }, r.unstable_shouldYield = j, r.unstable_wrapCallback = function(X) {
    var B = U;
    return function() {
      var G = U;
      U = B;
      try {
        return X.apply(this, arguments);
      } finally {
        U = G;
      }
    };
  };
})), Rh = /* @__PURE__ */ ia(((r, x) => {
  x.exports = Uh();
})), qh = /* @__PURE__ */ ia(((r) => {
  var x = /* @__PURE__ */ Symbol.for("react.transitional.element"), C = /* @__PURE__ */ Symbol.for("react.portal"), p = /* @__PURE__ */ Symbol.for("react.fragment"), o = /* @__PURE__ */ Symbol.for("react.strict_mode"), M = /* @__PURE__ */ Symbol.for("react.profiler"), S = /* @__PURE__ */ Symbol.for("react.consumer"), H = /* @__PURE__ */ Symbol.for("react.context"), T = /* @__PURE__ */ Symbol.for("react.forward_ref"), A = /* @__PURE__ */ Symbol.for("react.suspense"), z = /* @__PURE__ */ Symbol.for("react.memo"), K = /* @__PURE__ */ Symbol.for("react.lazy"), U = /* @__PURE__ */ Symbol.for("react.activity"), ne = Symbol.iterator;
  function he(h) {
    return h === null || typeof h != "object" ? null : (h = ne && h[ne] || h["@@iterator"], typeof h == "function" ? h : null);
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
  }, $ = Object.assign, de = {};
  function Q(h, R, J) {
    this.props = h, this.context = R, this.refs = de, this.updater = J || I;
  }
  Q.prototype.isReactComponent = {}, Q.prototype.setState = function(h, R) {
    if (typeof h != "object" && typeof h != "function" && h != null) throw Error("takes an object of state variables to update or a function which returns an object of state variables.");
    this.updater.enqueueSetState(this, h, R, "setState");
  }, Q.prototype.forceUpdate = function(h) {
    this.updater.enqueueForceUpdate(this, h, "forceUpdate");
  };
  function oe() {
  }
  oe.prototype = Q.prototype;
  function V(h, R, J) {
    this.props = h, this.context = R, this.refs = de, this.updater = J || I;
  }
  var W = V.prototype = new oe();
  W.constructor = V, $(W, Q.prototype), W.isPureReactComponent = !0;
  var P = Array.isArray;
  function ge() {
  }
  var pe = {
    H: null,
    A: null,
    T: null,
    S: null
  }, Y = Object.prototype.hasOwnProperty;
  function j(h, R, J) {
    var ae = J.ref;
    return {
      $$typeof: x,
      type: h,
      key: R,
      ref: ae !== void 0 ? ae : null,
      props: J
    };
  }
  function Z(h, R) {
    return j(h.type, R, h.props);
  }
  function Se(h) {
    return typeof h == "object" && h !== null && h.$$typeof === x;
  }
  function qe(h) {
    var R = {
      "=": "=0",
      ":": "=2"
    };
    return "$" + h.replace(/[=:]/g, function(J) {
      return R[J];
    });
  }
  var g = /\/+/g;
  function ee(h, R) {
    return typeof h == "object" && h !== null && h.key != null ? qe("" + h.key) : R.toString(36);
  }
  function X(h) {
    switch (h.status) {
      case "fulfilled":
        return h.value;
      case "rejected":
        throw h.reason;
      default:
        switch (typeof h.status == "string" ? h.then(ge, ge) : (h.status = "pending", h.then(function(R) {
          h.status === "pending" && (h.status = "fulfilled", h.value = R);
        }, function(R) {
          h.status === "pending" && (h.status = "rejected", h.reason = R);
        })), h.status) {
          case "fulfilled":
            return h.value;
          case "rejected":
            throw h.reason;
        }
    }
    throw h;
  }
  function B(h, R, J, ae, je) {
    var F = typeof h;
    (F === "undefined" || F === "boolean") && (h = null);
    var ue = !1;
    if (h === null) ue = !0;
    else switch (F) {
      case "bigint":
      case "string":
      case "number":
        ue = !0;
        break;
      case "object":
        switch (h.$$typeof) {
          case x:
          case C:
            ue = !0;
            break;
          case K:
            return ue = h._init, B(ue(h._payload), R, J, ae, je);
        }
    }
    if (ue) return je = je(h), ue = ae === "" ? "." + ee(h, 0) : ae, P(je) ? (J = "", ue != null && (J = ue.replace(g, "$&/") + "/"), B(je, R, J, "", function(le) {
      return le;
    })) : je != null && (Se(je) && (je = Z(je, J + (je.key == null || h && h.key === je.key ? "" : ("" + je.key).replace(g, "$&/") + "/") + ue)), R.push(je)), 1;
    ue = 0;
    var Ue = ae === "" ? "." : ae + ":";
    if (P(h)) for (var b = 0; b < h.length; b++) ae = h[b], F = Ue + ee(ae, b), ue += B(ae, R, J, F, je);
    else if (b = he(h), typeof b == "function") for (h = b.call(h), b = 0; !(ae = h.next()).done; ) ae = ae.value, F = Ue + ee(ae, b++), ue += B(ae, R, J, F, je);
    else if (F === "object") {
      if (typeof h.then == "function") return B(X(h), R, J, ae, je);
      throw R = String(h), Error("Objects are not valid as a React child (found: " + (R === "[object Object]" ? "object with keys {" + Object.keys(h).join(", ") + "}" : R) + "). If you meant to render a collection of children, use an array instead.");
    }
    return ue;
  }
  function G(h, R, J) {
    if (h == null) return h;
    var ae = [], je = 0;
    return B(h, ae, "", "", function(F) {
      return R.call(J, F, je++);
    }), ae;
  }
  function ce(h) {
    if (h._status === -1) {
      var R = h._result;
      R = R(), R.then(function(J) {
        (h._status === 0 || h._status === -1) && (h._status = 1, h._result = J);
      }, function(J) {
        (h._status === 0 || h._status === -1) && (h._status = 2, h._result = J);
      }), h._status === -1 && (h._status = 0, h._result = R);
    }
    if (h._status === 1) return h._result.default;
    throw h._result;
  }
  var fe = typeof reportError == "function" ? reportError : function(h) {
    if (typeof window == "object" && typeof window.ErrorEvent == "function") {
      var R = new window.ErrorEvent("error", {
        bubbles: !0,
        cancelable: !0,
        message: typeof h == "object" && h !== null && typeof h.message == "string" ? String(h.message) : String(h),
        error: h
      });
      if (!window.dispatchEvent(R)) return;
    } else if (typeof process == "object" && typeof process.emit == "function") {
      process.emit("uncaughtException", h);
      return;
    }
    console.error(h);
  }, Ae = {
    map: G,
    forEach: function(h, R, J) {
      G(h, function() {
        R.apply(this, arguments);
      }, J);
    },
    count: function(h) {
      var R = 0;
      return G(h, function() {
        R++;
      }), R;
    },
    toArray: function(h) {
      return G(h, function(R) {
        return R;
      }) || [];
    },
    only: function(h) {
      if (!Se(h)) throw Error("React.Children.only expected to receive a single React element child.");
      return h;
    }
  };
  r.Activity = U, r.Children = Ae, r.Component = Q, r.Fragment = p, r.Profiler = M, r.PureComponent = V, r.StrictMode = o, r.Suspense = A, r.__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE = pe, r.__COMPILER_RUNTIME = {
    __proto__: null,
    c: function(h) {
      return pe.H.useMemoCache(h);
    }
  }, r.cache = function(h) {
    return function() {
      return h.apply(null, arguments);
    };
  }, r.cacheSignal = function() {
    return null;
  }, r.cloneElement = function(h, R, J) {
    if (h == null) throw Error("The argument must be a React element, but you passed " + h + ".");
    var ae = $({}, h.props), je = h.key;
    if (R != null) for (F in R.key !== void 0 && (je = "" + R.key), R) !Y.call(R, F) || F === "key" || F === "__self" || F === "__source" || F === "ref" && R.ref === void 0 || (ae[F] = R[F]);
    var F = arguments.length - 2;
    if (F === 1) ae.children = J;
    else if (1 < F) {
      for (var ue = Array(F), Ue = 0; Ue < F; Ue++) ue[Ue] = arguments[Ue + 2];
      ae.children = ue;
    }
    return j(h.type, je, ae);
  }, r.createContext = function(h) {
    return h = {
      $$typeof: H,
      _currentValue: h,
      _currentValue2: h,
      _threadCount: 0,
      Provider: null,
      Consumer: null
    }, h.Provider = h, h.Consumer = {
      $$typeof: S,
      _context: h
    }, h;
  }, r.createElement = function(h, R, J) {
    var ae, je = {}, F = null;
    if (R != null) for (ae in R.key !== void 0 && (F = "" + R.key), R) Y.call(R, ae) && ae !== "key" && ae !== "__self" && ae !== "__source" && (je[ae] = R[ae]);
    var ue = arguments.length - 2;
    if (ue === 1) je.children = J;
    else if (1 < ue) {
      for (var Ue = Array(ue), b = 0; b < ue; b++) Ue[b] = arguments[b + 2];
      je.children = Ue;
    }
    if (h && h.defaultProps) for (ae in ue = h.defaultProps, ue) je[ae] === void 0 && (je[ae] = ue[ae]);
    return j(h, F, je);
  }, r.createRef = function() {
    return { current: null };
  }, r.forwardRef = function(h) {
    return {
      $$typeof: T,
      render: h
    };
  }, r.isValidElement = Se, r.lazy = function(h) {
    return {
      $$typeof: K,
      _payload: {
        _status: -1,
        _result: h
      },
      _init: ce
    };
  }, r.memo = function(h, R) {
    return {
      $$typeof: z,
      type: h,
      compare: R === void 0 ? null : R
    };
  }, r.startTransition = function(h) {
    var R = pe.T, J = {};
    pe.T = J;
    try {
      var ae = h(), je = pe.S;
      je !== null && je(J, ae), typeof ae == "object" && ae !== null && typeof ae.then == "function" && ae.then(ge, fe);
    } catch (F) {
      fe(F);
    } finally {
      R !== null && J.types !== null && (R.types = J.types), pe.T = R;
    }
  }, r.unstable_useCacheRefresh = function() {
    return pe.H.useCacheRefresh();
  }, r.use = function(h) {
    return pe.H.use(h);
  }, r.useActionState = function(h, R, J) {
    return pe.H.useActionState(h, R, J);
  }, r.useCallback = function(h, R) {
    return pe.H.useCallback(h, R);
  }, r.useContext = function(h) {
    return pe.H.useContext(h);
  }, r.useDebugValue = function() {
  }, r.useDeferredValue = function(h, R) {
    return pe.H.useDeferredValue(h, R);
  }, r.useEffect = function(h, R) {
    return pe.H.useEffect(h, R);
  }, r.useEffectEvent = function(h) {
    return pe.H.useEffectEvent(h);
  }, r.useId = function() {
    return pe.H.useId();
  }, r.useImperativeHandle = function(h, R, J) {
    return pe.H.useImperativeHandle(h, R, J);
  }, r.useInsertionEffect = function(h, R) {
    return pe.H.useInsertionEffect(h, R);
  }, r.useLayoutEffect = function(h, R) {
    return pe.H.useLayoutEffect(h, R);
  }, r.useMemo = function(h, R) {
    return pe.H.useMemo(h, R);
  }, r.useOptimistic = function(h, R) {
    return pe.H.useOptimistic(h, R);
  }, r.useReducer = function(h, R, J) {
    return pe.H.useReducer(h, R, J);
  }, r.useRef = function(h) {
    return pe.H.useRef(h);
  }, r.useState = function(h) {
    return pe.H.useState(h);
  }, r.useSyncExternalStore = function(h, R, J) {
    return pe.H.useSyncExternalStore(h, R, J);
  }, r.useTransition = function() {
    return pe.H.useTransition();
  }, r.version = "19.2.6";
})), id = /* @__PURE__ */ ia(((r, x) => {
  x.exports = qh();
})), Hh = /* @__PURE__ */ ia(((r) => {
  var x = id();
  function C(A) {
    var z = "https://react.dev/errors/" + A;
    if (1 < arguments.length) {
      z += "?args[]=" + encodeURIComponent(arguments[1]);
      for (var K = 2; K < arguments.length; K++) z += "&args[]=" + encodeURIComponent(arguments[K]);
    }
    return "Minified React error #" + A + "; visit " + z + " for the full message or use the non-minified dev environment for full errors and additional helpful warnings.";
  }
  function p() {
  }
  var o = {
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
  function S(A, z, K) {
    var U = 3 < arguments.length && arguments[3] !== void 0 ? arguments[3] : null;
    return {
      $$typeof: M,
      key: U == null ? null : "" + U,
      children: A,
      containerInfo: z,
      implementation: K
    };
  }
  var H = x.__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE;
  function T(A, z) {
    if (A === "font") return "";
    if (typeof z == "string") return z === "use-credentials" ? z : "";
  }
  r.__DOM_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE = o, r.createPortal = function(A, z) {
    var K = 2 < arguments.length && arguments[2] !== void 0 ? arguments[2] : null;
    if (!z || z.nodeType !== 1 && z.nodeType !== 9 && z.nodeType !== 11) throw Error(C(299));
    return S(A, z, null, K);
  }, r.flushSync = function(A) {
    var z = H.T, K = o.p;
    try {
      if (H.T = null, o.p = 2, A) return A();
    } finally {
      H.T = z, o.p = K, o.d.f();
    }
  }, r.preconnect = function(A, z) {
    typeof A == "string" && (z ? (z = z.crossOrigin, z = typeof z == "string" ? z === "use-credentials" ? z : "" : void 0) : z = null, o.d.C(A, z));
  }, r.prefetchDNS = function(A) {
    typeof A == "string" && o.d.D(A);
  }, r.preinit = function(A, z) {
    if (typeof A == "string" && z && typeof z.as == "string") {
      var K = z.as, U = T(K, z.crossOrigin), ne = typeof z.integrity == "string" ? z.integrity : void 0, he = typeof z.fetchPriority == "string" ? z.fetchPriority : void 0;
      K === "style" ? o.d.S(A, typeof z.precedence == "string" ? z.precedence : void 0, {
        crossOrigin: U,
        integrity: ne,
        fetchPriority: he
      }) : K === "script" && o.d.X(A, {
        crossOrigin: U,
        integrity: ne,
        fetchPriority: he,
        nonce: typeof z.nonce == "string" ? z.nonce : void 0
      });
    }
  }, r.preinitModule = function(A, z) {
    if (typeof A == "string") if (typeof z == "object" && z !== null) {
      if (z.as == null || z.as === "script") {
        var K = T(z.as, z.crossOrigin);
        o.d.M(A, {
          crossOrigin: K,
          integrity: typeof z.integrity == "string" ? z.integrity : void 0,
          nonce: typeof z.nonce == "string" ? z.nonce : void 0
        });
      }
    } else z ?? o.d.M(A);
  }, r.preload = function(A, z) {
    if (typeof A == "string" && typeof z == "object" && z !== null && typeof z.as == "string") {
      var K = z.as, U = T(K, z.crossOrigin);
      o.d.L(A, K, {
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
  }, r.preloadModule = function(A, z) {
    if (typeof A == "string") if (z) {
      var K = T(z.as, z.crossOrigin);
      o.d.m(A, {
        as: typeof z.as == "string" && z.as !== "script" ? z.as : void 0,
        crossOrigin: K,
        integrity: typeof z.integrity == "string" ? z.integrity : void 0
      });
    } else o.d.m(A);
  }, r.requestFormReset = function(A) {
    o.d.r(A);
  }, r.unstable_batchedUpdates = function(A, z) {
    return A(z);
  }, r.useFormState = function(A, z, K) {
    return H.H.useFormState(A, z, K);
  }, r.useFormStatus = function() {
    return H.H.useHostTransitionStatus();
  }, r.version = "19.2.6";
})), Lh = /* @__PURE__ */ ia(((r, x) => {
  function C() {
    if (!(typeof __REACT_DEVTOOLS_GLOBAL_HOOK__ > "u" || typeof __REACT_DEVTOOLS_GLOBAL_HOOK__.checkDCE != "function"))
      try {
        __REACT_DEVTOOLS_GLOBAL_HOOK__.checkDCE(C);
      } catch (p) {
        console.error(p);
      }
  }
  C(), x.exports = Hh();
})), Bh = /* @__PURE__ */ ia(((r) => {
  var x = Rh(), C = id(), p = Lh();
  function o(e) {
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
  function S(e) {
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
  function H(e) {
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
  function A(e) {
    if (S(e) !== e) throw Error(o(188));
  }
  function z(e) {
    var t = e.alternate;
    if (!t) {
      if (t = S(e), t === null) throw Error(o(188));
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
          if (s === a) return A(n), e;
          if (s === i) return A(n), t;
          s = s.sibling;
        }
        throw Error(o(188));
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
          if (!c) throw Error(o(189));
        }
      }
      if (a.alternate !== i) throw Error(o(190));
    }
    if (a.tag !== 3) throw Error(o(188));
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
  var U = Object.assign, ne = /* @__PURE__ */ Symbol.for("react.element"), he = /* @__PURE__ */ Symbol.for("react.transitional.element"), I = /* @__PURE__ */ Symbol.for("react.portal"), $ = /* @__PURE__ */ Symbol.for("react.fragment"), de = /* @__PURE__ */ Symbol.for("react.strict_mode"), Q = /* @__PURE__ */ Symbol.for("react.profiler"), oe = /* @__PURE__ */ Symbol.for("react.consumer"), V = /* @__PURE__ */ Symbol.for("react.context"), W = /* @__PURE__ */ Symbol.for("react.forward_ref"), P = /* @__PURE__ */ Symbol.for("react.suspense"), ge = /* @__PURE__ */ Symbol.for("react.suspense_list"), pe = /* @__PURE__ */ Symbol.for("react.memo"), Y = /* @__PURE__ */ Symbol.for("react.lazy"), j = /* @__PURE__ */ Symbol.for("react.activity"), Z = /* @__PURE__ */ Symbol.for("react.memo_cache_sentinel"), Se = Symbol.iterator;
  function qe(e) {
    return e === null || typeof e != "object" ? null : (e = Se && e[Se] || e["@@iterator"], typeof e == "function" ? e : null);
  }
  var g = /* @__PURE__ */ Symbol.for("react.client.reference");
  function ee(e) {
    if (e == null) return null;
    if (typeof e == "function") return e.$$typeof === g ? null : e.displayName || e.name || null;
    if (typeof e == "string") return e;
    switch (e) {
      case $:
        return "Fragment";
      case Q:
        return "Profiler";
      case de:
        return "StrictMode";
      case P:
        return "Suspense";
      case ge:
        return "SuspenseList";
      case j:
        return "Activity";
    }
    if (typeof e == "object") switch (e.$$typeof) {
      case I:
        return "Portal";
      case V:
        return e.displayName || "Context";
      case oe:
        return (e._context.displayName || "Context") + ".Consumer";
      case W:
        var t = e.render;
        return e = e.displayName, e || (e = t.displayName || t.name || "", e = e !== "" ? "ForwardRef(" + e + ")" : "ForwardRef"), e;
      case pe:
        return t = e.displayName || null, t !== null ? t : ee(e.type) || "Memo";
      case Y:
        t = e._payload, e = e._init;
        try {
          return ee(e(t));
        } catch {
        }
    }
    return null;
  }
  var X = Array.isArray, B = C.__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE, G = p.__DOM_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE, ce = {
    pending: !1,
    data: null,
    method: null,
    action: null
  }, fe = [], Ae = -1;
  function h(e) {
    return { current: e };
  }
  function R(e) {
    0 > Ae || (e.current = fe[Ae], fe[Ae] = null, Ae--);
  }
  function J(e, t) {
    Ae++, fe[Ae] = e.current, e.current = t;
  }
  var ae = h(null), je = h(null), F = h(null), ue = h(null);
  function Ue(e, t) {
    switch (J(F, t), J(je, e), J(ae, null), t.nodeType) {
      case 9:
      case 11:
        e = (e = t.documentElement) && (e = e.namespaceURI) ? Tp(e) : 0;
        break;
      default:
        if (e = t.tagName, t = t.namespaceURI) t = Tp(t), e = kp(t, e);
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
    R(ae), J(ae, e);
  }
  function b() {
    R(ae), R(je), R(F);
  }
  function le(e) {
    e.memoizedState !== null && J(ue, e);
    var t = ae.current, a = kp(t, e.type);
    t !== a && (J(je, e), J(ae, a));
  }
  function se(e) {
    je.current === e && (R(ae), R(je)), ue.current === e && (R(ue), Ii._currentValue = ce);
  }
  var ye, Oe;
  function ct(e) {
    if (ye === void 0) try {
      throw Error();
    } catch (a) {
      var t = a.stack.trim().match(/\n( *(at )?)/);
      ye = t && t[1] || "", Oe = -1 < a.stack.indexOf(`
    at`) ? " (<anonymous>)" : -1 < a.stack.indexOf("@") ? "@unknown:0:0" : "";
    }
    return `
` + ye + e + Oe;
  }
  var ot = !1;
  function m(e, t) {
    if (!e || ot) return "";
    ot = !0;
    var a = Error.prepareStackTrace;
    Error.prepareStackTrace = void 0;
    try {
      var i = { DetermineComponentFrameRoot: function() {
        try {
          if (t) {
            var L = function() {
              throw Error();
            };
            if (Object.defineProperty(L.prototype, "props", { set: function() {
              throw Error();
            } }), typeof Reflect == "object" && Reflect.construct) {
              try {
                Reflect.construct(L, []);
              } catch (O) {
                var _ = O;
              }
              Reflect.construct(e, [], L);
            } else {
              try {
                L.call();
              } catch (O) {
                _ = O;
              }
              e.call(L.prototype);
            }
          } else {
            try {
              throw Error();
            } catch (O) {
              _ = O;
            }
            (L = e()) && typeof L.catch == "function" && L.catch(function() {
            });
          }
        } catch (O) {
          if (O && _ && typeof O.stack == "string") return [O.stack, _.stack];
        }
        return [null, null];
      } };
      i.DetermineComponentFrameRoot.displayName = "DetermineComponentFrameRoot";
      var n = Object.getOwnPropertyDescriptor(i.DetermineComponentFrameRoot, "name");
      n && n.configurable && Object.defineProperty(i.DetermineComponentFrameRoot, "name", { value: "DetermineComponentFrameRoot" });
      var s = i.DetermineComponentFrameRoot(), c = s[0], d = s[1];
      if (c && d) {
        var f = c.split(`
`), w = d.split(`
`);
        for (n = i = 0; i < f.length && !f[i].includes("DetermineComponentFrameRoot"); ) i++;
        for (; n < w.length && !w[n].includes("DetermineComponentFrameRoot"); ) n++;
        if (i === f.length || n === w.length) for (i = f.length - 1, n = w.length - 1; 1 <= i && 0 <= n && f[i] !== w[n]; ) n--;
        for (; 1 <= i && 0 <= n; i--, n--) if (f[i] !== w[n]) {
          if (i !== 1 || n !== 1) do
            if (i--, n--, 0 > n || f[i] !== w[n]) {
              var D = `
` + f[i].replace(" at new ", " at ");
              return e.displayName && D.includes("<anonymous>") && (D = D.replace("<anonymous>", e.displayName)), D;
            }
          while (1 <= i && 0 <= n);
          break;
        }
      }
    } finally {
      ot = !1, Error.prepareStackTrace = a;
    }
    return (a = e ? e.displayName || e.name : "") ? ct(a) : "";
  }
  function te(e, t) {
    switch (e.tag) {
      case 26:
      case 27:
      case 5:
        return ct(e.type);
      case 16:
        return ct("Lazy");
      case 13:
        return e.child !== t && t !== null ? ct("Suspense Fallback") : ct("Suspense");
      case 19:
        return ct("SuspenseList");
      case 0:
      case 15:
        return m(e.type, !1);
      case 11:
        return m(e.type.render, !1);
      case 1:
        return m(e.type, !0);
      case 31:
        return ct("Activity");
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
    } catch (i) {
      return `
Error generating stack: ` + i.message + `
` + i.stack;
    }
  }
  var Dt = Object.prototype.hasOwnProperty, E = x.unstable_scheduleCallback, ze = x.unstable_cancelCallback, at = x.unstable_shouldYield, Jt = x.unstable_requestPaint, We = x.unstable_now, Ja = x.unstable_getCurrentPriorityLevel, bl = x.unstable_ImmediatePriority, Ut = x.unstable_UserBlockingPriority, ea = x.unstable_NormalPriority, Ia = x.unstable_LowPriority, u = x.unstable_IdlePriority, xe = x.log, be = x.unstable_setDisableYieldValue, Fe = null, Xe = null;
  function bt(e) {
    if (typeof xe == "function" && be(e), Xe && typeof Xe.setStrictMode == "function") try {
      Xe.setStrictMode(Fe, e);
    } catch {
    }
  }
  var rt = Math.clz32 ? Math.clz32 : Tf, ln = Math.log, jt = Math.LN2;
  function Tf(e) {
    return e >>>= 0, e === 0 ? 32 : 31 - (ln(e) / jt | 0) | 0;
  }
  var nn = 256, sn = 262144, cn = 4194304;
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
  function rn(e, t, a) {
    var i = e.pendingLanes;
    if (i === 0) return 0;
    var n = 0, s = e.suspendedLanes, c = e.pingedLanes;
    e = e.warmLanes;
    var d = i & 134217727;
    return d !== 0 ? (i = d & ~s, i !== 0 ? n = $a(i) : (c &= d, c !== 0 ? n = $a(c) : a || (a = d & ~e, a !== 0 && (n = $a(a))))) : (d = i & ~s, d !== 0 ? n = $a(d) : c !== 0 ? n = $a(c) : a || (a = i & ~e, a !== 0 && (n = $a(a)))), n === 0 ? 0 : t !== 0 && t !== n && (t & s) === 0 && (s = n & -n, a = t & -t, s >= a || s === 32 && (a & 4194048) !== 0) ? t : n;
  }
  function ri(e, t) {
    return (e.pendingLanes & ~(e.suspendedLanes & ~e.pingedLanes) & t) === 0;
  }
  function kf(e, t) {
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
  function dd() {
    var e = cn;
    return cn <<= 1, (cn & 62914560) === 0 && (cn = 4194304), e;
  }
  function ks(e) {
    for (var t = [], a = 0; 31 > a; a++) t.push(e);
    return t;
  }
  function dn(e, t) {
    e.pendingLanes |= t, t !== 268435456 && (e.suspendedLanes = 0, e.pingedLanes = 0, e.warmLanes = 0);
  }
  function Af(e, t, a, i, n, s) {
    var c = e.pendingLanes;
    e.pendingLanes = a, e.suspendedLanes = 0, e.pingedLanes = 0, e.warmLanes = 0, e.expiredLanes &= a, e.entangledLanes &= a, e.errorRecoveryDisabledLanes &= a, e.shellSuspendCounter = 0;
    var d = e.entanglements, f = e.expirationTimes, w = e.hiddenUpdates;
    for (a = c & ~a; 0 < a; ) {
      var D = 31 - rt(a), L = 1 << D;
      d[D] = 0, f[D] = -1;
      var _ = w[D];
      if (_ !== null) for (w[D] = null, D = 0; D < _.length; D++) {
        var O = _[D];
        O !== null && (O.lane &= -536870913);
      }
      a &= ~L;
    }
    i !== 0 && od(e, i, 0), s !== 0 && n === 0 && e.tag !== 0 && (e.suspendedLanes |= s & ~(c & ~t));
  }
  function od(e, t, a) {
    e.pendingLanes |= t, e.suspendedLanes &= ~t;
    var i = 31 - rt(t);
    e.entangledLanes |= t, e.entanglements[i] = e.entanglements[i] | 1073741824 | a & 261930;
  }
  function ud(e, t) {
    var a = e.entangledLanes |= t;
    for (e = e.entanglements; a; ) {
      var i = 31 - rt(a), n = 1 << i;
      n & t | e[i] & t && (e[i] |= t), a &= ~n;
    }
  }
  function pd(e, t) {
    var a = t & -t;
    return a = (a & 42) !== 0 ? 1 : fd(a), (a & (e.suspendedLanes | t)) !== 0 ? 0 : a;
  }
  function fd(e) {
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
  function As(e) {
    return e &= -e, 2 < e ? 8 < e ? (e & 134217727) !== 0 ? 32 : 268435456 : 8 : 2;
  }
  function hd() {
    var e = G.p;
    return e !== 0 ? e : (e = window.event, e === void 0 ? 32 : $p(e.type));
  }
  function md(e, t) {
    var a = G.p;
    try {
      return G.p = e, t();
    } finally {
      G.p = a;
    }
  }
  var wa = Math.random().toString(36).slice(2), ft = "__reactFiber$" + wa, yt = "__reactProps$" + wa, di = "__reactContainer$" + wa, Cs = "__reactEvents$" + wa, Cf = "__reactListeners$" + wa, Of = "__reactHandles$" + wa, xd = "__reactResources$" + wa, oi = "__reactMarker$" + wa;
  function Os(e) {
    delete e[ft], delete e[yt], delete e[Cs], delete e[Cf], delete e[Of];
  }
  function vl(e) {
    var t = e[ft];
    if (t) return t;
    for (var a = e.parentNode; a; ) {
      if (t = a[di] || a[ft]) {
        if (a = t.alternate, t.child !== null || a !== null && a.child !== null) for (e = Rp(e); e !== null; ) {
          if (a = e[ft]) return a;
          e = Rp(e);
        }
        return t;
      }
      e = a, a = e.parentNode;
    }
    return null;
  }
  function jl(e) {
    if (e = e[ft] || e[di]) {
      var t = e.tag;
      if (t === 5 || t === 6 || t === 13 || t === 31 || t === 26 || t === 27 || t === 3) return e;
    }
    return null;
  }
  function ui(e) {
    var t = e.tag;
    if (t === 5 || t === 26 || t === 27 || t === 6) return e.stateNode;
    throw Error(o(33));
  }
  function yl(e) {
    var t = e[xd];
    return t || (t = e[xd] = {
      hoistableStyles: /* @__PURE__ */ new Map(),
      hoistableScripts: /* @__PURE__ */ new Map()
    }), t;
  }
  function ut(e) {
    e[oi] = !0;
  }
  var gd = /* @__PURE__ */ new Set(), bd = {};
  function Wa(e, t) {
    Sl(e, t), Sl(e + "Capture", t);
  }
  function Sl(e, t) {
    for (bd[e] = t, e = 0; e < t.length; e++) gd.add(t[e]);
  }
  var Mf = RegExp("^[:A-Z_a-z\\u00C0-\\u00D6\\u00D8-\\u00F6\\u00F8-\\u02FF\\u0370-\\u037D\\u037F-\\u1FFF\\u200C-\\u200D\\u2070-\\u218F\\u2C00-\\u2FEF\\u3001-\\uD7FF\\uF900-\\uFDCF\\uFDF0-\\uFFFD][:A-Z_a-z\\u00C0-\\u00D6\\u00D8-\\u00F6\\u00F8-\\u02FF\\u0370-\\u037D\\u037F-\\u1FFF\\u200C-\\u200D\\u2070-\\u218F\\u2C00-\\u2FEF\\u3001-\\uD7FF\\uF900-\\uFDCF\\uFDF0-\\uFFFD\\-.0-9\\u00B7\\u0300-\\u036F\\u203F-\\u2040]*$"), vd = {}, jd = {};
  function Df(e) {
    return Dt.call(jd, e) ? !0 : Dt.call(vd, e) ? !1 : Mf.test(e) ? jd[e] = !0 : (vd[e] = !0, !1);
  }
  function on(e, t, a) {
    if (Df(t)) if (a === null) e.removeAttribute(t);
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
  function un(e, t, a) {
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
  function yd(e) {
    var t = e.type;
    return (e = e.nodeName) && e.toLowerCase() === "input" && (t === "checkbox" || t === "radio");
  }
  function Uf(e, t, a) {
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
  function Ms(e) {
    if (!e._valueTracker) {
      var t = yd(e) ? "checked" : "value";
      e._valueTracker = Uf(e, t, "" + e[t]);
    }
  }
  function Sd(e) {
    if (!e) return !1;
    var t = e._valueTracker;
    if (!t) return !0;
    var a = t.getValue(), i = "";
    return e && (i = yd(e) ? e.checked ? "true" : "false" : e.value), e = i, e !== a ? (t.setValue(e), !0) : !1;
  }
  function pn(e) {
    if (e = e || (typeof document < "u" ? document : void 0), typeof e > "u") return null;
    try {
      return e.activeElement || e.body;
    } catch {
      return e.body;
    }
  }
  var Rf = /[\n"\\]/g;
  function qt(e) {
    return e.replace(Rf, function(t) {
      return "\\" + t.charCodeAt(0).toString(16) + " ";
    });
  }
  function Ds(e, t, a, i, n, s, c, d) {
    e.name = "", c != null && typeof c != "function" && typeof c != "symbol" && typeof c != "boolean" ? e.type = c : e.removeAttribute("type"), t != null ? c === "number" ? (t === 0 && e.value === "" || e.value != t) && (e.value = "" + Rt(t)) : e.value !== "" + Rt(t) && (e.value = "" + Rt(t)) : c !== "submit" && c !== "reset" || e.removeAttribute("value"), t != null ? Us(e, c, Rt(t)) : a != null ? Us(e, c, Rt(a)) : i != null && e.removeAttribute("value"), n == null && s != null && (e.defaultChecked = !!s), n != null && (e.checked = n && typeof n != "function" && typeof n != "symbol"), d != null && typeof d != "function" && typeof d != "symbol" && typeof d != "boolean" ? e.name = "" + Rt(d) : e.removeAttribute("name");
  }
  function zd(e, t, a, i, n, s, c, d) {
    if (s != null && typeof s != "function" && typeof s != "symbol" && typeof s != "boolean" && (e.type = s), t != null || a != null) {
      if (!(s !== "submit" && s !== "reset" || t != null)) {
        Ms(e);
        return;
      }
      a = a != null ? "" + Rt(a) : "", t = t != null ? "" + Rt(t) : a, d || t === e.value || (e.value = t), e.defaultValue = t;
    }
    i = i ?? n, i = typeof i != "function" && typeof i != "symbol" && !!i, e.checked = d ? e.checked : !!i, e.defaultChecked = !!i, c != null && typeof c != "function" && typeof c != "symbol" && typeof c != "boolean" && (e.name = c), Ms(e);
  }
  function Us(e, t, a) {
    t === "number" && pn(e.ownerDocument) === e || e.defaultValue === "" + a || (e.defaultValue = "" + a);
  }
  function zl(e, t, a, i) {
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
  function Nd(e, t, a) {
    if (t != null && (t = "" + Rt(t), t !== e.value && (e.value = t), a == null)) {
      e.defaultValue !== t && (e.defaultValue = t);
      return;
    }
    e.defaultValue = a != null ? "" + Rt(a) : "";
  }
  function wd(e, t, a, i) {
    if (t == null) {
      if (i != null) {
        if (a != null) throw Error(o(92));
        if (X(i)) {
          if (1 < i.length) throw Error(o(93));
          i = i[0];
        }
        a = i;
      }
      a ??= "", t = a;
    }
    a = Rt(t), e.defaultValue = a, i = e.textContent, i === a && i !== "" && i !== null && (e.value = i), Ms(e);
  }
  function Nl(e, t) {
    if (t) {
      var a = e.firstChild;
      if (a && a === e.lastChild && a.nodeType === 3) {
        a.nodeValue = t;
        return;
      }
    }
    e.textContent = t;
  }
  var qf = new Set("animationIterationCount aspectRatio borderImageOutset borderImageSlice borderImageWidth boxFlex boxFlexGroup boxOrdinalGroup columnCount columns flex flexGrow flexPositive flexShrink flexNegative flexOrder gridArea gridRow gridRowEnd gridRowSpan gridRowStart gridColumn gridColumnEnd gridColumnSpan gridColumnStart fontWeight lineClamp lineHeight opacity order orphans scale tabSize widows zIndex zoom fillOpacity floodOpacity stopOpacity strokeDasharray strokeDashoffset strokeMiterlimit strokeOpacity strokeWidth MozAnimationIterationCount MozBoxFlex MozBoxFlexGroup MozLineClamp msAnimationIterationCount msFlex msZoom msFlexGrow msFlexNegative msFlexOrder msFlexPositive msFlexShrink msGridColumn msGridColumnSpan msGridRow msGridRowSpan WebkitAnimationIterationCount WebkitBoxFlex WebKitBoxFlexGroup WebkitBoxOrdinalGroup WebkitColumnCount WebkitColumns WebkitFlex WebkitFlexGrow WebkitFlexPositive WebkitFlexShrink WebkitLineClamp".split(" "));
  function _d(e, t, a) {
    var i = t.indexOf("--") === 0;
    a == null || typeof a == "boolean" || a === "" ? i ? e.setProperty(t, "") : t === "float" ? e.cssFloat = "" : e[t] = "" : i ? e.setProperty(t, a) : typeof a != "number" || a === 0 || qf.has(t) ? t === "float" ? e.cssFloat = a : e[t] = ("" + a).trim() : e[t] = a + "px";
  }
  function Ed(e, t, a) {
    if (t != null && typeof t != "object") throw Error(o(62));
    if (e = e.style, a != null) {
      for (var i in a) !a.hasOwnProperty(i) || t != null && t.hasOwnProperty(i) || (i.indexOf("--") === 0 ? e.setProperty(i, "") : i === "float" ? e.cssFloat = "" : e[i] = "");
      for (var n in t) i = t[n], t.hasOwnProperty(n) && a[n] !== i && _d(e, n, i);
    } else for (var s in t) t.hasOwnProperty(s) && _d(e, s, t[s]);
  }
  function Rs(e) {
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
  var Hf = /* @__PURE__ */ new Map([
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
  ]), Lf = /^[\u0000-\u001F ]*j[\r\n\t]*a[\r\n\t]*v[\r\n\t]*a[\r\n\t]*s[\r\n\t]*c[\r\n\t]*r[\r\n\t]*i[\r\n\t]*p[\r\n\t]*t[\r\n\t]*:/i;
  function fn(e) {
    return Lf.test("" + e) ? "javascript:throw new Error('React has blocked a javascript: URL as a security precaution.')" : e;
  }
  function sa() {
  }
  var qs = null;
  function Hs(e) {
    return e = e.target || e.srcElement || window, e.correspondingUseElement && (e = e.correspondingUseElement), e.nodeType === 3 ? e.parentNode : e;
  }
  var wl = null, _l = null;
  function Td(e) {
    var t = jl(e);
    if (t && (e = t.stateNode)) {
      var a = e[yt] || null;
      e: switch (e = t.stateNode, t.type) {
        case "input":
          if (Ds(e, a.value, a.defaultValue, a.defaultValue, a.checked, a.defaultChecked, a.type, a.name), t = a.name, a.type === "radio" && t != null) {
            for (a = e; a.parentNode; ) a = a.parentNode;
            for (a = a.querySelectorAll('input[name="' + qt("" + t) + '"][type="radio"]'), t = 0; t < a.length; t++) {
              var i = a[t];
              if (i !== e && i.form === e.form) {
                var n = i[yt] || null;
                if (!n) throw Error(o(90));
                Ds(i, n.value, n.defaultValue, n.defaultValue, n.checked, n.defaultChecked, n.type, n.name);
              }
            }
            for (t = 0; t < a.length; t++) i = a[t], i.form === e.form && Sd(i);
          }
          break e;
        case "textarea":
          Nd(e, a.value, a.defaultValue);
          break e;
        case "select":
          t = a.value, t != null && zl(e, !!a.multiple, t, !1);
      }
    }
  }
  var Ls = !1;
  function kd(e, t, a) {
    if (Ls) return e(t, a);
    Ls = !0;
    try {
      return e(t);
    } finally {
      if (Ls = !1, (wl !== null || _l !== null) && (es(), wl && (t = wl, e = _l, _l = wl = null, Td(t), e)))
        for (t = 0; t < e.length; t++) Td(e[t]);
    }
  }
  function pi(e, t) {
    var a = e.stateNode;
    if (a === null) return null;
    var i = a[yt] || null;
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
    if (a && typeof a != "function") throw Error(o(231, t, typeof a));
    return a;
  }
  var ca = !(typeof window > "u" || typeof window.document > "u" || typeof window.document.createElement > "u"), Bs = !1;
  if (ca) try {
    var fi = {};
    Object.defineProperty(fi, "passive", { get: function() {
      Bs = !0;
    } }), window.addEventListener("test", fi, fi), window.removeEventListener("test", fi, fi);
  } catch {
    Bs = !1;
  }
  var _a = null, Gs = null, hn = null;
  function Ad() {
    if (hn) return hn;
    var e, t = Gs, a = t.length, i, n = "value" in _a ? _a.value : _a.textContent, s = n.length;
    for (e = 0; e < a && t[e] === n[e]; e++) ;
    var c = a - e;
    for (i = 1; i <= c && t[a - i] === n[s - i]; i++) ;
    return hn = n.slice(e, 1 < i ? 1 - i : void 0);
  }
  function mn(e) {
    var t = e.keyCode;
    return "charCode" in e ? (e = e.charCode, e === 0 && t === 13 && (e = 13)) : e = t, e === 10 && (e = 13), 32 <= e || e === 13 ? e : 0;
  }
  function xn() {
    return !0;
  }
  function Cd() {
    return !1;
  }
  function St(e) {
    function t(a, i, n, s, c) {
      this._reactName = a, this._targetInst = n, this.type = i, this.nativeEvent = s, this.target = c, this.currentTarget = null;
      for (var d in e) e.hasOwnProperty(d) && (a = e[d], this[d] = a ? a(s) : s[d]);
      return this.isDefaultPrevented = (s.defaultPrevented != null ? s.defaultPrevented : s.returnValue === !1) ? xn : Cd, this.isPropagationStopped = Cd, this;
    }
    return U(t.prototype, {
      preventDefault: function() {
        this.defaultPrevented = !0;
        var a = this.nativeEvent;
        a && (a.preventDefault ? a.preventDefault() : typeof a.returnValue != "unknown" && (a.returnValue = !1), this.isDefaultPrevented = xn);
      },
      stopPropagation: function() {
        var a = this.nativeEvent;
        a && (a.stopPropagation ? a.stopPropagation() : typeof a.cancelBubble != "unknown" && (a.cancelBubble = !0), this.isPropagationStopped = xn);
      },
      persist: function() {
      },
      isPersistent: xn
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
  }, gn = St(Fa), hi = U({}, Fa, {
    view: 0,
    detail: 0
  }), Bf = St(hi), Ys, Vs, mi, bn = U({}, hi, {
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
    getModifierState: Qs,
    button: 0,
    buttons: 0,
    relatedTarget: function(e) {
      return e.relatedTarget === void 0 ? e.fromElement === e.srcElement ? e.toElement : e.fromElement : e.relatedTarget;
    },
    movementX: function(e) {
      return "movementX" in e ? e.movementX : (e !== mi && (mi && e.type === "mousemove" ? (Ys = e.screenX - mi.screenX, Vs = e.screenY - mi.screenY) : Vs = Ys = 0, mi = e), Ys);
    },
    movementY: function(e) {
      return "movementY" in e ? e.movementY : Vs;
    }
  }), Od = St(bn), Gf = St(U({}, bn, { dataTransfer: 0 })), Xs = St(U({}, hi, { relatedTarget: 0 })), Yf = St(U({}, Fa, {
    animationName: 0,
    elapsedTime: 0,
    pseudoElement: 0
  })), Vf = St(U({}, Fa, { clipboardData: function(e) {
    return "clipboardData" in e ? e.clipboardData : window.clipboardData;
  } })), Md = St(U({}, Fa, { data: 0 })), Xf = {
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
  }, Qf = {
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
  }, Zf = {
    Alt: "altKey",
    Control: "ctrlKey",
    Meta: "metaKey",
    Shift: "shiftKey"
  };
  function Kf(e) {
    var t = this.nativeEvent;
    return t.getModifierState ? t.getModifierState(e) : (e = Zf[e]) ? !!t[e] : !1;
  }
  function Qs() {
    return Kf;
  }
  var Jf = St(U({}, hi, {
    key: function(e) {
      if (e.key) {
        var t = Xf[e.key] || e.key;
        if (t !== "Unidentified") return t;
      }
      return e.type === "keypress" ? (e = mn(e), e === 13 ? "Enter" : String.fromCharCode(e)) : e.type === "keydown" || e.type === "keyup" ? Qf[e.keyCode] || "Unidentified" : "";
    },
    code: 0,
    location: 0,
    ctrlKey: 0,
    shiftKey: 0,
    altKey: 0,
    metaKey: 0,
    repeat: 0,
    locale: 0,
    getModifierState: Qs,
    charCode: function(e) {
      return e.type === "keypress" ? mn(e) : 0;
    },
    keyCode: function(e) {
      return e.type === "keydown" || e.type === "keyup" ? e.keyCode : 0;
    },
    which: function(e) {
      return e.type === "keypress" ? mn(e) : e.type === "keydown" || e.type === "keyup" ? e.keyCode : 0;
    }
  })), Dd = St(U({}, bn, {
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
  })), If = St(U({}, hi, {
    touches: 0,
    targetTouches: 0,
    changedTouches: 0,
    altKey: 0,
    metaKey: 0,
    ctrlKey: 0,
    shiftKey: 0,
    getModifierState: Qs
  })), $f = St(U({}, Fa, {
    propertyName: 0,
    elapsedTime: 0,
    pseudoElement: 0
  })), Wf = St(U({}, bn, {
    deltaX: function(e) {
      return "deltaX" in e ? e.deltaX : "wheelDeltaX" in e ? -e.wheelDeltaX : 0;
    },
    deltaY: function(e) {
      return "deltaY" in e ? e.deltaY : "wheelDeltaY" in e ? -e.wheelDeltaY : "wheelDelta" in e ? -e.wheelDelta : 0;
    },
    deltaZ: 0,
    deltaMode: 0
  })), Ff = St(U({}, Fa, {
    newState: 0,
    oldState: 0
  })), Pf = [
    9,
    13,
    27,
    32
  ], Zs = ca && "CompositionEvent" in window, xi = null;
  ca && "documentMode" in document && (xi = document.documentMode);
  var e0 = ca && "TextEvent" in window && !xi, Ud = ca && (!Zs || xi && 8 < xi && 11 >= xi), Rd = " ", qd = !1;
  function Hd(e, t) {
    switch (e) {
      case "keyup":
        return Pf.indexOf(t.keyCode) !== -1;
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
  function Ld(e) {
    return e = e.detail, typeof e == "object" && "data" in e ? e.data : null;
  }
  var El = !1;
  function t0(e, t) {
    switch (e) {
      case "compositionend":
        return Ld(t);
      case "keypress":
        return t.which !== 32 ? null : (qd = !0, Rd);
      case "textInput":
        return e = t.data, e === Rd && qd ? null : e;
      default:
        return null;
    }
  }
  function a0(e, t) {
    if (El) return e === "compositionend" || !Zs && Hd(e, t) ? (e = Ad(), hn = Gs = _a = null, El = !1, e) : null;
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
        return Ud && t.locale !== "ko" ? null : t.data;
      default:
        return null;
    }
  }
  var l0 = {
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
  function Bd(e) {
    var t = e && e.nodeName && e.nodeName.toLowerCase();
    return t === "input" ? !!l0[e.type] : t === "textarea";
  }
  function Gd(e, t, a, i) {
    wl ? _l ? _l.push(i) : _l = [i] : wl = i, t = cs(t, "onChange"), 0 < t.length && (a = new gn("onChange", "change", null, a, i), e.push({
      event: a,
      listeners: t
    }));
  }
  var gi = null, bi = null;
  function i0(e) {
    yp(e, 0);
  }
  function vn(e) {
    if (Sd(ui(e))) return e;
  }
  function Yd(e, t) {
    if (e === "change") return t;
  }
  var Vd = !1;
  if (ca) {
    var Ks;
    if (ca) {
      var Js = "oninput" in document;
      if (!Js) {
        var Xd = document.createElement("div");
        Xd.setAttribute("oninput", "return;"), Js = typeof Xd.oninput == "function";
      }
      Ks = Js;
    } else Ks = !1;
    Vd = Ks && (!document.documentMode || 9 < document.documentMode);
  }
  function Qd() {
    gi && (gi.detachEvent("onpropertychange", Zd), bi = gi = null);
  }
  function Zd(e) {
    if (e.propertyName === "value" && vn(bi)) {
      var t = [];
      Gd(t, bi, e, Hs(e)), kd(i0, t);
    }
  }
  function n0(e, t, a) {
    e === "focusin" ? (Qd(), gi = t, bi = a, gi.attachEvent("onpropertychange", Zd)) : e === "focusout" && Qd();
  }
  function s0(e) {
    if (e === "selectionchange" || e === "keyup" || e === "keydown") return vn(bi);
  }
  function c0(e, t) {
    if (e === "click") return vn(t);
  }
  function r0(e, t) {
    if (e === "input" || e === "change") return vn(t);
  }
  function d0(e, t) {
    return e === t && (e !== 0 || 1 / e === 1 / t) || e !== e && t !== t;
  }
  var Tt = typeof Object.is == "function" ? Object.is : d0;
  function vi(e, t) {
    if (Tt(e, t)) return !0;
    if (typeof e != "object" || e === null || typeof t != "object" || t === null) return !1;
    var a = Object.keys(e), i = Object.keys(t);
    if (a.length !== i.length) return !1;
    for (i = 0; i < a.length; i++) {
      var n = a[i];
      if (!Dt.call(t, n) || !Tt(e[n], t[n])) return !1;
    }
    return !0;
  }
  function Kd(e) {
    for (; e && e.firstChild; ) e = e.firstChild;
    return e;
  }
  function Jd(e, t) {
    var a = Kd(e);
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
      a = Kd(a);
    }
  }
  function Id(e, t) {
    return e && t ? e === t ? !0 : e && e.nodeType === 3 ? !1 : t && t.nodeType === 3 ? Id(e, t.parentNode) : "contains" in e ? e.contains(t) : e.compareDocumentPosition ? !!(e.compareDocumentPosition(t) & 16) : !1 : !1;
  }
  function $d(e) {
    e = e != null && e.ownerDocument != null && e.ownerDocument.defaultView != null ? e.ownerDocument.defaultView : window;
    for (var t = pn(e.document); t instanceof e.HTMLIFrameElement; ) {
      try {
        var a = typeof t.contentWindow.location.href == "string";
      } catch {
        a = !1;
      }
      if (a) e = t.contentWindow;
      else break;
      t = pn(e.document);
    }
    return t;
  }
  function Is(e) {
    var t = e && e.nodeName && e.nodeName.toLowerCase();
    return t && (t === "input" && (e.type === "text" || e.type === "search" || e.type === "tel" || e.type === "url" || e.type === "password") || t === "textarea" || e.contentEditable === "true");
  }
  var o0 = ca && "documentMode" in document && 11 >= document.documentMode, Tl = null, $s = null, ji = null, Ws = !1;
  function Wd(e, t, a) {
    var i = a.window === a ? a.document : a.nodeType === 9 ? a : a.ownerDocument;
    Ws || Tl == null || Tl !== pn(i) || (i = Tl, "selectionStart" in i && Is(i) ? i = {
      start: i.selectionStart,
      end: i.selectionEnd
    } : (i = (i.ownerDocument && i.ownerDocument.defaultView || window).getSelection(), i = {
      anchorNode: i.anchorNode,
      anchorOffset: i.anchorOffset,
      focusNode: i.focusNode,
      focusOffset: i.focusOffset
    }), ji && vi(ji, i) || (ji = i, i = cs($s, "onSelect"), 0 < i.length && (t = new gn("onSelect", "select", null, t, a), e.push({
      event: t,
      listeners: i
    }), t.target = Tl)));
  }
  function Pa(e, t) {
    var a = {};
    return a[e.toLowerCase()] = t.toLowerCase(), a["Webkit" + e] = "webkit" + t, a["Moz" + e] = "moz" + t, a;
  }
  var kl = {
    animationend: Pa("Animation", "AnimationEnd"),
    animationiteration: Pa("Animation", "AnimationIteration"),
    animationstart: Pa("Animation", "AnimationStart"),
    transitionrun: Pa("Transition", "TransitionRun"),
    transitionstart: Pa("Transition", "TransitionStart"),
    transitioncancel: Pa("Transition", "TransitionCancel"),
    transitionend: Pa("Transition", "TransitionEnd")
  }, Fs = {}, Fd = {};
  ca && (Fd = document.createElement("div").style, "AnimationEvent" in window || (delete kl.animationend.animation, delete kl.animationiteration.animation, delete kl.animationstart.animation), "TransitionEvent" in window || delete kl.transitionend.transition);
  function el(e) {
    if (Fs[e]) return Fs[e];
    if (!kl[e]) return e;
    var t = kl[e], a;
    for (a in t) if (t.hasOwnProperty(a) && a in Fd) return Fs[e] = t[a];
    return e;
  }
  var Pd = el("animationend"), eo = el("animationiteration"), to = el("animationstart"), u0 = el("transitionrun"), p0 = el("transitionstart"), f0 = el("transitioncancel"), ao = el("transitionend"), lo = /* @__PURE__ */ new Map(), Ps = "abort auxClick beforeToggle cancel canPlay canPlayThrough click close contextMenu copy cut drag dragEnd dragEnter dragExit dragLeave dragOver dragStart drop durationChange emptied encrypted ended error gotPointerCapture input invalid keyDown keyPress keyUp load loadedData loadedMetadata loadStart lostPointerCapture mouseDown mouseMove mouseOut mouseOver mouseUp paste pause play playing pointerCancel pointerDown pointerMove pointerOut pointerOver pointerUp progress rateChange reset resize seeked seeking stalled submit suspend timeUpdate touchCancel touchEnd touchStart volumeChange scroll toggle touchMove waiting wheel".split(" ");
  Ps.push("scrollEnd");
  function It(e, t) {
    lo.set(e, t), Wa(t, [e]);
  }
  var jn = typeof reportError == "function" ? reportError : function(e) {
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
  }, Ht = [], Al = 0, ec = 0;
  function yn() {
    for (var e = Al, t = ec = Al = 0; t < e; ) {
      var a = Ht[t];
      Ht[t++] = null;
      var i = Ht[t];
      Ht[t++] = null;
      var n = Ht[t];
      Ht[t++] = null;
      var s = Ht[t];
      if (Ht[t++] = null, i !== null && n !== null) {
        var c = i.pending;
        c === null ? n.next = n : (n.next = c.next, c.next = n), i.pending = n;
      }
      s !== 0 && io(a, n, s);
    }
  }
  function Sn(e, t, a, i) {
    Ht[Al++] = e, Ht[Al++] = t, Ht[Al++] = a, Ht[Al++] = i, ec |= i, e.lanes |= i, e = e.alternate, e !== null && (e.lanes |= i);
  }
  function tc(e, t, a, i) {
    return Sn(e, t, a, i), zn(e);
  }
  function tl(e, t) {
    return Sn(e, null, null, t), zn(e);
  }
  function io(e, t, a) {
    e.lanes |= a;
    var i = e.alternate;
    i !== null && (i.lanes |= a);
    for (var n = !1, s = e.return; s !== null; ) s.childLanes |= a, i = s.alternate, i !== null && (i.childLanes |= a), s.tag === 22 && (e = s.stateNode, e === null || e._visibility & 1 || (n = !0)), e = s, s = s.return;
    return e.tag === 3 ? (s = e.stateNode, n && t !== null && (n = 31 - rt(a), e = s.hiddenUpdates, i = e[n], i === null ? e[n] = [t] : i.push(t), t.lane = a | 536870912), s) : null;
  }
  function zn(e) {
    if (50 < Yi) throw Yi = 0, or = null, Error(o(185));
    for (var t = e.return; t !== null; ) e = t, t = e.return;
    return e.tag === 3 ? e.stateNode : null;
  }
  var Cl = {};
  function h0(e, t, a, i) {
    this.tag = e, this.key = a, this.sibling = this.child = this.return = this.stateNode = this.type = this.elementType = null, this.index = 0, this.refCleanup = this.ref = null, this.pendingProps = t, this.dependencies = this.memoizedState = this.updateQueue = this.memoizedProps = null, this.mode = i, this.subtreeFlags = this.flags = 0, this.deletions = null, this.childLanes = this.lanes = 0, this.alternate = null;
  }
  function kt(e, t, a, i) {
    return new h0(e, t, a, i);
  }
  function ac(e) {
    return e = e.prototype, !(!e || !e.isReactComponent);
  }
  function ra(e, t) {
    var a = e.alternate;
    return a === null ? (a = kt(e.tag, t, e.key, e.mode), a.elementType = e.elementType, a.type = e.type, a.stateNode = e.stateNode, a.alternate = e, e.alternate = a) : (a.pendingProps = t, a.type = e.type, a.flags = 0, a.subtreeFlags = 0, a.deletions = null), a.flags = e.flags & 65011712, a.childLanes = e.childLanes, a.lanes = e.lanes, a.child = e.child, a.memoizedProps = e.memoizedProps, a.memoizedState = e.memoizedState, a.updateQueue = e.updateQueue, t = e.dependencies, a.dependencies = t === null ? null : {
      lanes: t.lanes,
      firstContext: t.firstContext
    }, a.sibling = e.sibling, a.index = e.index, a.ref = e.ref, a.refCleanup = e.refCleanup, a;
  }
  function no(e, t) {
    e.flags &= 65011714;
    var a = e.alternate;
    return a === null ? (e.childLanes = 0, e.lanes = t, e.child = null, e.subtreeFlags = 0, e.memoizedProps = null, e.memoizedState = null, e.updateQueue = null, e.dependencies = null, e.stateNode = null) : (e.childLanes = a.childLanes, e.lanes = a.lanes, e.child = a.child, e.subtreeFlags = 0, e.deletions = null, e.memoizedProps = a.memoizedProps, e.memoizedState = a.memoizedState, e.updateQueue = a.updateQueue, e.type = a.type, t = a.dependencies, e.dependencies = t === null ? null : {
      lanes: t.lanes,
      firstContext: t.firstContext
    }), e;
  }
  function Nn(e, t, a, i, n, s) {
    var c = 0;
    if (i = e, typeof e == "function") ac(e) && (c = 1);
    else if (typeof e == "string") c = jh(e, a, ae.current) ? 26 : e === "html" || e === "head" || e === "body" ? 27 : 5;
    else e: switch (e) {
      case j:
        return e = kt(31, a, t, n), e.elementType = j, e.lanes = s, e;
      case $:
        return al(a.children, n, s, t);
      case de:
        c = 8, n |= 24;
        break;
      case Q:
        return e = kt(12, a, t, n | 2), e.elementType = Q, e.lanes = s, e;
      case P:
        return e = kt(13, a, t, n), e.elementType = P, e.lanes = s, e;
      case ge:
        return e = kt(19, a, t, n), e.elementType = ge, e.lanes = s, e;
      default:
        if (typeof e == "object" && e !== null) switch (e.$$typeof) {
          case V:
            c = 10;
            break e;
          case oe:
            c = 9;
            break e;
          case W:
            c = 11;
            break e;
          case pe:
            c = 14;
            break e;
          case Y:
            c = 16, i = null;
            break e;
        }
        c = 29, a = Error(o(130, e === null ? "null" : typeof e, "")), i = null;
    }
    return t = kt(c, a, t, n), t.elementType = e, t.type = i, t.lanes = s, t;
  }
  function al(e, t, a, i) {
    return e = kt(7, e, i, t), e.lanes = a, e;
  }
  function lc(e, t, a) {
    return e = kt(6, e, null, t), e.lanes = a, e;
  }
  function so(e) {
    var t = kt(18, null, null, 0);
    return t.stateNode = e, t;
  }
  function ic(e, t, a) {
    return t = kt(4, e.children !== null ? e.children : [], e.key, t), t.lanes = a, t.stateNode = {
      containerInfo: e.containerInfo,
      pendingChildren: null,
      implementation: e.implementation
    }, t;
  }
  var co = /* @__PURE__ */ new WeakMap();
  function Lt(e, t) {
    if (typeof e == "object" && e !== null) {
      var a = co.get(e);
      return a !== void 0 ? a : (t = {
        value: e,
        source: t,
        stack: tt(t)
      }, co.set(e, t), t);
    }
    return {
      value: e,
      source: t,
      stack: tt(t)
    };
  }
  var Ol = [], Ml = 0, wn = null, yi = 0, Bt = [], Gt = 0, Ea = null, ta = 1, aa = "";
  function da(e, t) {
    Ol[Ml++] = yi, Ol[Ml++] = wn, wn = e, yi = t;
  }
  function ro(e, t, a) {
    Bt[Gt++] = ta, Bt[Gt++] = aa, Bt[Gt++] = Ea, Ea = e;
    var i = ta;
    e = aa;
    var n = 32 - rt(i) - 1;
    i &= ~(1 << n), a += 1;
    var s = 32 - rt(t) + n;
    if (30 < s) {
      var c = n - n % 5;
      s = (i & (1 << c) - 1).toString(32), i >>= c, n -= c, ta = 1 << 32 - rt(t) + n | a << n | i, aa = s + e;
    } else ta = 1 << s | a << n | i, aa = e;
  }
  function nc(e) {
    e.return !== null && (da(e, 1), ro(e, 1, 0));
  }
  function sc(e) {
    for (; e === wn; ) wn = Ol[--Ml], Ol[Ml] = null, yi = Ol[--Ml], Ol[Ml] = null;
    for (; e === Ea; ) Ea = Bt[--Gt], Bt[Gt] = null, aa = Bt[--Gt], Bt[Gt] = null, ta = Bt[--Gt], Bt[Gt] = null;
  }
  function oo(e, t) {
    Bt[Gt++] = ta, Bt[Gt++] = aa, Bt[Gt++] = Ea, ta = t.id, aa = t.overflow, Ea = e;
  }
  var ht = null, Ze = null, Ce = !1, Ta = null, Yt = !1, cc = Error(o(519));
  function ka(e) {
    throw Si(Lt(Error(o(418, 1 < arguments.length && arguments[1] !== void 0 && arguments[1] ? "text" : "HTML", "")), e)), cc;
  }
  function uo(e) {
    var t = e.stateNode, a = e.type, i = e.memoizedProps;
    switch (t[ft] = e, t[yt] = i, a) {
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
        for (a = 0; a < Xi.length; a++) Ee(Xi[a], t);
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
        Ee("invalid", t), zd(t, i.value, i.defaultValue, i.checked, i.defaultChecked, i.type, i.name, !0);
        break;
      case "select":
        Ee("invalid", t);
        break;
      case "textarea":
        Ee("invalid", t), wd(t, i.value, i.defaultValue, i.children);
    }
    a = i.children, typeof a != "string" && typeof a != "number" && typeof a != "bigint" || t.textContent === "" + a || i.suppressHydrationWarning === !0 || _p(t.textContent, a) ? (i.popover != null && (Ee("beforetoggle", t), Ee("toggle", t)), i.onScroll != null && Ee("scroll", t), i.onScrollEnd != null && Ee("scrollend", t), i.onClick != null && (t.onclick = sa), t = !0) : t = !1, t || ka(e, !0);
  }
  function po(e) {
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
  function Dl(e) {
    if (e !== ht) return !1;
    if (!Ce) return po(e), Ce = !0, !1;
    var t = e.tag, a;
    if ((a = t !== 3 && t !== 27) && ((a = t === 5) && (a = e.type, a = !(a !== "form" && a !== "button") || Nr(e.type, e.memoizedProps)), a = !a), a && Ze && ka(e), po(e), t === 13) {
      if (e = e.memoizedState, e = e !== null ? e.dehydrated : null, !e) throw Error(o(317));
      Ze = Up(e);
    } else if (t === 31) {
      if (e = e.memoizedState, e = e !== null ? e.dehydrated : null, !e) throw Error(o(317));
      Ze = Up(e);
    } else t === 27 ? (t = Ze, Ga(e.type) ? (e = kr, kr = null, Ze = e) : Ze = t) : Ze = ht ? Qt(e.stateNode.nextSibling) : null;
    return !0;
  }
  function ll() {
    Ze = ht = null, Ce = !1;
  }
  function rc() {
    var e = Ta;
    return e !== null && (_t === null ? _t = e : _t.push.apply(_t, e), Ta = null), e;
  }
  function Si(e) {
    Ta === null ? Ta = [e] : Ta.push(e);
  }
  var dc = h(null), il = null, oa = null;
  function Aa(e, t, a) {
    J(dc, t._currentValue), t._currentValue = a;
  }
  function ua(e) {
    e._currentValue = dc.current, R(dc);
  }
  function oc(e, t, a) {
    for (; e !== null; ) {
      var i = e.alternate;
      if ((e.childLanes & t) !== t ? (e.childLanes |= t, i !== null && (i.childLanes |= t)) : i !== null && (i.childLanes & t) !== t && (i.childLanes |= t), e === a) break;
      e = e.return;
    }
  }
  function uc(e, t, a, i) {
    var n = e.child;
    for (n !== null && (n.return = e); n !== null; ) {
      var s = n.dependencies;
      if (s !== null) {
        var c = n.child;
        s = s.firstContext;
        e: for (; s !== null; ) {
          var d = s;
          s = n;
          for (var f = 0; f < t.length; f++) if (d.context === t[f]) {
            s.lanes |= a, d = s.alternate, d !== null && (d.lanes |= a), oc(s.return, a, e), i || (c = null);
            break e;
          }
          s = d.next;
        }
      } else if (n.tag === 18) {
        if (c = n.return, c === null) throw Error(o(341));
        c.lanes |= a, s = c.alternate, s !== null && (s.lanes |= a), oc(c, a, e), c = null;
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
  function Ul(e, t, a, i) {
    e = null;
    for (var n = t, s = !1; n !== null; ) {
      if (!s) {
        if ((n.flags & 524288) !== 0) s = !0;
        else if ((n.flags & 262144) !== 0) break;
      }
      if (n.tag === 10) {
        var c = n.alternate;
        if (c === null) throw Error(o(387));
        if (c = c.memoizedProps, c !== null) {
          var d = n.type;
          Tt(n.pendingProps.value, c.value) || (e !== null ? e.push(d) : e = [d]);
        }
      } else if (n === ue.current) {
        if (c = n.alternate, c === null) throw Error(o(387));
        c.memoizedState.memoizedState !== n.memoizedState.memoizedState && (e !== null ? e.push(Ii) : e = [Ii]);
      }
      n = n.return;
    }
    e !== null && uc(t, e, a, i), t.flags |= 262144;
  }
  function _n(e) {
    for (e = e.firstContext; e !== null; ) {
      if (!Tt(e.context._currentValue, e.memoizedValue)) return !0;
      e = e.next;
    }
    return !1;
  }
  function nl(e) {
    il = e, oa = null, e = e.dependencies, e !== null && (e.firstContext = null);
  }
  function mt(e) {
    return fo(il, e);
  }
  function En(e, t) {
    return il === null && nl(e), fo(e, t);
  }
  function fo(e, t) {
    var a = t._currentValue;
    if (t = {
      context: t,
      memoizedValue: a,
      next: null
    }, oa === null) {
      if (e === null) throw Error(o(308));
      oa = t, e.dependencies = {
        lanes: 0,
        firstContext: t
      }, e.flags |= 524288;
    } else oa = oa.next = t;
    return a;
  }
  var m0 = typeof AbortController < "u" ? AbortController : function() {
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
  }, x0 = x.unstable_scheduleCallback, g0 = x.unstable_NormalPriority, lt = {
    $$typeof: V,
    Consumer: null,
    Provider: null,
    _currentValue: null,
    _currentValue2: null,
    _threadCount: 0
  };
  function pc() {
    return {
      controller: new m0(),
      data: /* @__PURE__ */ new Map(),
      refCount: 0
    };
  }
  function zi(e) {
    e.refCount--, e.refCount === 0 && x0(g0, function() {
      e.controller.abort();
    });
  }
  var Ni = null, fc = 0, Rl = 0, ql = null;
  function b0(e, t) {
    if (Ni === null) {
      var a = Ni = [];
      fc = 0, Rl = xr(), ql = {
        status: "pending",
        value: void 0,
        then: function(i) {
          a.push(i);
        }
      };
    }
    return fc++, t.then(ho, ho), t;
  }
  function ho() {
    if (--fc === 0 && Ni !== null) {
      ql !== null && (ql.status = "fulfilled");
      var e = Ni;
      Ni = null, Rl = 0, ql = null;
      for (var t = 0; t < e.length; t++) (0, e[t])();
    }
  }
  function v0(e, t) {
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
  var mo = B.S;
  B.S = function(e, t) {
    Iu = We(), typeof t == "object" && t !== null && typeof t.then == "function" && b0(e, t), mo !== null && mo(e, t);
  };
  var sl = h(null);
  function hc() {
    var e = sl.current;
    return e !== null ? e : Qe.pooledCache;
  }
  function Tn(e, t) {
    t === null ? J(sl, sl.current) : J(sl, t.pool);
  }
  function xo() {
    var e = hc();
    return e === null ? null : {
      parent: lt._currentValue,
      pool: e
    };
  }
  var Hl = Error(o(460)), mc = Error(o(474)), kn = Error(o(542)), An = { then: function() {
  } };
  function go(e) {
    return e = e.status, e === "fulfilled" || e === "rejected";
  }
  function bo(e, t, a) {
    switch (a = e[a], a === void 0 ? e.push(t) : a !== t && (t.then(sa, sa), t = a), t.status) {
      case "fulfilled":
        return t.value;
      case "rejected":
        throw e = t.reason, jo(e), e;
      default:
        if (typeof t.status == "string") t.then(sa, sa);
        else {
          if (e = Qe, e !== null && 100 < e.shellSuspendCounter) throw Error(o(482));
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
            throw e = t.reason, jo(e), e;
        }
        throw rl = t, Hl;
    }
  }
  function cl(e) {
    try {
      var t = e._init;
      return t(e._payload);
    } catch (a) {
      throw a !== null && typeof a == "object" && typeof a.then == "function" ? (rl = a, Hl) : a;
    }
  }
  var rl = null;
  function vo() {
    if (rl === null) throw Error(o(459));
    var e = rl;
    return rl = null, e;
  }
  function jo(e) {
    if (e === Hl || e === kn) throw Error(o(483));
  }
  var Ll = null, wi = 0;
  function Cn(e) {
    var t = wi;
    return wi += 1, Ll === null && (Ll = []), bo(Ll, e, t);
  }
  function _i(e, t) {
    t = t.props.ref, e.ref = t !== void 0 ? t : null;
  }
  function On(e, t) {
    throw t.$$typeof === ne ? Error(o(525)) : (e = Object.prototype.toString.call(t), Error(o(31, e === "[object Object]" ? "object with keys {" + Object.keys(t).join(", ") + "}" : e)));
  }
  function yo(e) {
    function t(y, v) {
      if (e) {
        var N = y.deletions;
        N === null ? (y.deletions = [v], y.flags |= 16) : N.push(v);
      }
    }
    function a(y, v) {
      if (!e) return null;
      for (; v !== null; ) t(y, v), v = v.sibling;
      return null;
    }
    function i(y) {
      for (var v = /* @__PURE__ */ new Map(); y !== null; ) y.key !== null ? v.set(y.key, y) : v.set(y.index, y), y = y.sibling;
      return v;
    }
    function n(y, v) {
      return y = ra(y, v), y.index = 0, y.sibling = null, y;
    }
    function s(y, v, N) {
      return y.index = N, e ? (N = y.alternate, N !== null ? (N = N.index, N < v ? (y.flags |= 67108866, v) : N) : (y.flags |= 67108866, v)) : (y.flags |= 1048576, v);
    }
    function c(y) {
      return e && y.alternate === null && (y.flags |= 67108866), y;
    }
    function d(y, v, N, q) {
      return v === null || v.tag !== 6 ? (v = lc(N, y.mode, q), v.return = y, v) : (v = n(v, N), v.return = y, v);
    }
    function f(y, v, N, q) {
      var me = N.type;
      return me === $ ? D(y, v, N.props.children, q, N.key) : v !== null && (v.elementType === me || typeof me == "object" && me !== null && me.$$typeof === Y && cl(me) === v.type) ? (v = n(v, N.props), _i(v, N), v.return = y, v) : (v = Nn(N.type, N.key, N.props, null, y.mode, q), _i(v, N), v.return = y, v);
    }
    function w(y, v, N, q) {
      return v === null || v.tag !== 4 || v.stateNode.containerInfo !== N.containerInfo || v.stateNode.implementation !== N.implementation ? (v = ic(N, y.mode, q), v.return = y, v) : (v = n(v, N.children || []), v.return = y, v);
    }
    function D(y, v, N, q, me) {
      return v === null || v.tag !== 7 ? (v = al(N, y.mode, q, me), v.return = y, v) : (v = n(v, N), v.return = y, v);
    }
    function L(y, v, N) {
      if (typeof v == "string" && v !== "" || typeof v == "number" || typeof v == "bigint") return v = lc("" + v, y.mode, N), v.return = y, v;
      if (typeof v == "object" && v !== null) {
        switch (v.$$typeof) {
          case he:
            return N = Nn(v.type, v.key, v.props, null, y.mode, N), _i(N, v), N.return = y, N;
          case I:
            return v = ic(v, y.mode, N), v.return = y, v;
          case Y:
            return v = cl(v), L(y, v, N);
        }
        if (X(v) || qe(v)) return v = al(v, y.mode, N, null), v.return = y, v;
        if (typeof v.then == "function") return L(y, Cn(v), N);
        if (v.$$typeof === V) return L(y, En(y, v), N);
        On(y, v);
      }
      return null;
    }
    function _(y, v, N, q) {
      var me = v !== null ? v.key : null;
      if (typeof N == "string" && N !== "" || typeof N == "number" || typeof N == "bigint") return me !== null ? null : d(y, v, "" + N, q);
      if (typeof N == "object" && N !== null) {
        switch (N.$$typeof) {
          case he:
            return N.key === me ? f(y, v, N, q) : null;
          case I:
            return N.key === me ? w(y, v, N, q) : null;
          case Y:
            return N = cl(N), _(y, v, N, q);
        }
        if (X(N) || qe(N)) return me !== null ? null : D(y, v, N, q, null);
        if (typeof N.then == "function") return _(y, v, Cn(N), q);
        if (N.$$typeof === V) return _(y, v, En(y, N), q);
        On(y, N);
      }
      return null;
    }
    function O(y, v, N, q, me) {
      if (typeof q == "string" && q !== "" || typeof q == "number" || typeof q == "bigint") return y = y.get(N) || null, d(v, y, "" + q, me);
      if (typeof q == "object" && q !== null) {
        switch (q.$$typeof) {
          case he:
            return y = y.get(q.key === null ? N : q.key) || null, f(v, y, q, me);
          case I:
            return y = y.get(q.key === null ? N : q.key) || null, w(v, y, q, me);
          case Y:
            return q = cl(q), O(y, v, N, q, me);
        }
        if (X(q) || qe(q)) return y = y.get(N) || null, D(v, y, q, me, null);
        if (typeof q.then == "function") return O(y, v, N, Cn(q), me);
        if (q.$$typeof === V) return O(y, v, N, En(v, q), me);
        On(v, q);
      }
      return null;
    }
    function ie(y, v, N, q) {
      for (var me = null, Me = null, re = v, we = v = 0, ke = null; re !== null && we < N.length; we++) {
        re.index > we ? (ke = re, re = null) : ke = re.sibling;
        var De = _(y, re, N[we], q);
        if (De === null) {
          re === null && (re = ke);
          break;
        }
        e && re && De.alternate === null && t(y, re), v = s(De, v, we), Me === null ? me = De : Me.sibling = De, Me = De, re = ke;
      }
      if (we === N.length) return a(y, re), Ce && da(y, we), me;
      if (re === null) {
        for (; we < N.length; we++) re = L(y, N[we], q), re !== null && (v = s(re, v, we), Me === null ? me = re : Me.sibling = re, Me = re);
        return Ce && da(y, we), me;
      }
      for (re = i(re); we < N.length; we++) ke = O(re, y, we, N[we], q), ke !== null && (e && ke.alternate !== null && re.delete(ke.key === null ? we : ke.key), v = s(ke, v, we), Me === null ? me = ke : Me.sibling = ke, Me = ke);
      return e && re.forEach(function(Za) {
        return t(y, Za);
      }), Ce && da(y, we), me;
    }
    function ve(y, v, N, q) {
      if (N == null) throw Error(o(151));
      for (var me = null, Me = null, re = v, we = v = 0, ke = null, De = N.next(); re !== null && !De.done; we++, De = N.next()) {
        re.index > we ? (ke = re, re = null) : ke = re.sibling;
        var Za = _(y, re, De.value, q);
        if (Za === null) {
          re === null && (re = ke);
          break;
        }
        e && re && Za.alternate === null && t(y, re), v = s(Za, v, we), Me === null ? me = Za : Me.sibling = Za, Me = Za, re = ke;
      }
      if (De.done) return a(y, re), Ce && da(y, we), me;
      if (re === null) {
        for (; !De.done; we++, De = N.next()) De = L(y, De.value, q), De !== null && (v = s(De, v, we), Me === null ? me = De : Me.sibling = De, Me = De);
        return Ce && da(y, we), me;
      }
      for (re = i(re); !De.done; we++, De = N.next()) De = O(re, y, we, De.value, q), De !== null && (e && De.alternate !== null && re.delete(De.key === null ? we : De.key), v = s(De, v, we), Me === null ? me = De : Me.sibling = De, Me = De);
      return e && re.forEach(function(Dh) {
        return t(y, Dh);
      }), Ce && da(y, we), me;
    }
    function Ve(y, v, N, q) {
      if (typeof N == "object" && N !== null && N.type === $ && N.key === null && (N = N.props.children), typeof N == "object" && N !== null) {
        switch (N.$$typeof) {
          case he:
            e: {
              for (var me = N.key; v !== null; ) {
                if (v.key === me) {
                  if (me = N.type, me === $) {
                    if (v.tag === 7) {
                      a(y, v.sibling), q = n(v, N.props.children), q.return = y, y = q;
                      break e;
                    }
                  } else if (v.elementType === me || typeof me == "object" && me !== null && me.$$typeof === Y && cl(me) === v.type) {
                    a(y, v.sibling), q = n(v, N.props), _i(q, N), q.return = y, y = q;
                    break e;
                  }
                  a(y, v);
                  break;
                } else t(y, v);
                v = v.sibling;
              }
              N.type === $ ? (q = al(N.props.children, y.mode, q, N.key), q.return = y, y = q) : (q = Nn(N.type, N.key, N.props, null, y.mode, q), _i(q, N), q.return = y, y = q);
            }
            return c(y);
          case I:
            e: {
              for (me = N.key; v !== null; ) {
                if (v.key === me) if (v.tag === 4 && v.stateNode.containerInfo === N.containerInfo && v.stateNode.implementation === N.implementation) {
                  a(y, v.sibling), q = n(v, N.children || []), q.return = y, y = q;
                  break e;
                } else {
                  a(y, v);
                  break;
                }
                else t(y, v);
                v = v.sibling;
              }
              q = ic(N, y.mode, q), q.return = y, y = q;
            }
            return c(y);
          case Y:
            return N = cl(N), Ve(y, v, N, q);
        }
        if (X(N)) return ie(y, v, N, q);
        if (qe(N)) {
          if (me = qe(N), typeof me != "function") throw Error(o(150));
          return N = me.call(N), ve(y, v, N, q);
        }
        if (typeof N.then == "function") return Ve(y, v, Cn(N), q);
        if (N.$$typeof === V) return Ve(y, v, En(y, N), q);
        On(y, N);
      }
      return typeof N == "string" && N !== "" || typeof N == "number" || typeof N == "bigint" ? (N = "" + N, v !== null && v.tag === 6 ? (a(y, v.sibling), q = n(v, N), q.return = y, y = q) : (a(y, v), q = lc(N, y.mode, q), q.return = y, y = q), c(y)) : a(y, v);
    }
    return function(y, v, N, q) {
      try {
        wi = 0;
        var me = Ve(y, v, N, q);
        return Ll = null, me;
      } catch (re) {
        if (re === Hl || re === kn) throw re;
        var Me = kt(29, re, null, y.mode);
        return Me.lanes = q, Me.return = y, Me;
      }
    };
  }
  var dl = yo(!0), So = yo(!1), Ca = !1;
  function xc(e) {
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
  function gc(e, t) {
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
  function ul(e, t, a) {
    var i = e.updateQueue;
    if (i === null) return null;
    if (i = i.shared, (Re & 2) !== 0) {
      var n = i.pending;
      return n === null ? t.next = t : (t.next = n.next, n.next = t), i.pending = t, t = zn(e), io(e, null, a), t;
    }
    return Sn(e, i, t, a), zn(e);
  }
  function Ei(e, t, a) {
    if (t = t.updateQueue, t !== null && (t = t.shared, (a & 4194048) !== 0)) {
      var i = t.lanes;
      i &= e.pendingLanes, a |= i, t.lanes = a, ud(e, a);
    }
  }
  function bc(e, t) {
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
  var vc = !1;
  function Ti() {
    if (vc) {
      var e = ql;
      if (e !== null) throw e;
    }
  }
  function ki(e, t, a, i) {
    vc = !1;
    var n = e.updateQueue;
    Ca = !1;
    var s = n.firstBaseUpdate, c = n.lastBaseUpdate, d = n.shared.pending;
    if (d !== null) {
      n.shared.pending = null;
      var f = d, w = f.next;
      f.next = null, c === null ? s = w : c.next = w, c = f;
      var D = e.alternate;
      D !== null && (D = D.updateQueue, d = D.lastBaseUpdate, d !== c && (d === null ? D.firstBaseUpdate = w : d.next = w, D.lastBaseUpdate = f));
    }
    if (s !== null) {
      var L = n.baseState;
      c = 0, D = w = f = null, d = s;
      do {
        var _ = d.lane & -536870913, O = _ !== d.lane;
        if (O ? (Te & _) === _ : (i & _) === _) {
          _ !== 0 && _ === Rl && (vc = !0), D !== null && (D = D.next = {
            lane: 0,
            tag: d.tag,
            payload: d.payload,
            callback: null,
            next: null
          });
          e: {
            var ie = e, ve = d;
            _ = t;
            var Ve = a;
            switch (ve.tag) {
              case 1:
                if (ie = ve.payload, typeof ie == "function") {
                  L = ie.call(Ve, L, _);
                  break e;
                }
                L = ie;
                break e;
              case 3:
                ie.flags = ie.flags & -65537 | 128;
              case 0:
                if (ie = ve.payload, _ = typeof ie == "function" ? ie.call(Ve, L, _) : ie, _ == null) break e;
                L = U({}, L, _);
                break e;
              case 2:
                Ca = !0;
            }
          }
          _ = d.callback, _ !== null && (e.flags |= 64, O && (e.flags |= 8192), O = n.callbacks, O === null ? n.callbacks = [_] : O.push(_));
        } else O = {
          lane: _,
          tag: d.tag,
          payload: d.payload,
          callback: d.callback,
          next: null
        }, D === null ? (w = D = O, f = L) : D = D.next = O, c |= _;
        if (d = d.next, d === null) {
          if (d = n.shared.pending, d === null) break;
          O = d, d = O.next, O.next = null, n.lastBaseUpdate = O, n.shared.pending = null;
        }
      } while (!0);
      D === null && (f = L), n.baseState = f, n.firstBaseUpdate = w, n.lastBaseUpdate = D, s === null && (n.shared.lanes = 0), Ra |= c, e.lanes = c, e.memoizedState = L;
    }
  }
  function zo(e, t) {
    if (typeof e != "function") throw Error(o(191, e));
    e.call(t);
  }
  function No(e, t) {
    var a = e.callbacks;
    if (a !== null) for (e.callbacks = null, e = 0; e < a.length; e++) zo(a[e], t);
  }
  var Bl = h(null), Mn = h(0);
  function wo(e, t) {
    e = ja, J(Mn, e), J(Bl, t), ja = e | t.baseLanes;
  }
  function jc() {
    J(Mn, ja), J(Bl, Bl.current);
  }
  function yc() {
    ja = Mn.current, R(Bl), R(Mn);
  }
  var At = h(null), Vt = null;
  function Oa(e) {
    var t = e.alternate;
    J(Pe, Pe.current & 1), J(At, e), Vt === null && (t === null || Bl.current !== null || t.memoizedState !== null) && (Vt = e);
  }
  function Sc(e) {
    J(Pe, Pe.current), J(At, e), Vt === null && (Vt = e);
  }
  function _o(e) {
    e.tag === 22 ? (J(Pe, Pe.current), J(At, e), Vt === null && (Vt = e)) : Ma(e);
  }
  function Ma() {
    J(Pe, Pe.current), J(At, At.current);
  }
  function Ct(e) {
    R(At), Vt === e && (Vt = null), R(Pe);
  }
  var Pe = h(0);
  function Dn(e) {
    for (var t = e; t !== null; ) {
      if (t.tag === 13) {
        var a = t.memoizedState;
        if (a !== null && (a = a.dehydrated, a === null || Er(a) || Tr(a))) return t;
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
  var pa = 0, Ne = null, Ge = null, it = null, Un = !1, Gl = !1, pl = !1, Rn = 0, Ai = 0, Yl = null, j0 = 0;
  function Ie() {
    throw Error(o(321));
  }
  function zc(e, t) {
    if (t === null) return !1;
    for (var a = 0; a < t.length && a < e.length; a++) if (!Tt(e[a], t[a])) return !1;
    return !0;
  }
  function Nc(e, t, a, i, n, s) {
    return pa = s, Ne = t, t.memoizedState = null, t.updateQueue = null, t.lanes = 0, B.H = e === null || e.memoizedState === null ? du : Lc, pl = !1, s = a(i, n), pl = !1, Gl && (s = To(t, a, i, n)), Eo(e), s;
  }
  function Eo(e) {
    B.H = Mi;
    var t = Ge !== null && Ge.next !== null;
    if (pa = 0, it = Ge = Ne = null, Un = !1, Ai = 0, Yl = null, t) throw Error(o(300));
    e === null || nt || (e = e.dependencies, e !== null && _n(e) && (nt = !0));
  }
  function To(e, t, a, i) {
    Ne = e;
    var n = 0;
    do {
      if (Gl && (Yl = null), Ai = 0, Gl = !1, 25 <= n) throw Error(o(301));
      if (n += 1, it = Ge = null, e.updateQueue != null) {
        var s = e.updateQueue;
        s.lastEffect = null, s.events = null, s.stores = null, s.memoCache != null && (s.memoCache.index = 0);
      }
      B.H = ou, s = t(a, i);
    } while (Gl);
    return s;
  }
  function y0() {
    var e = B.H, t = e.useState()[0];
    return t = typeof t.then == "function" ? Ci(t) : t, e = e.useState()[0], (Ge !== null ? Ge.memoizedState : null) !== e && (Ne.flags |= 1024), t;
  }
  function wc() {
    var e = Rn !== 0;
    return Rn = 0, e;
  }
  function _c(e, t, a) {
    t.updateQueue = e.updateQueue, t.flags &= -2053, e.lanes &= ~a;
  }
  function Ec(e) {
    if (Un) {
      for (e = e.memoizedState; e !== null; ) {
        var t = e.queue;
        t !== null && (t.pending = null), e = e.next;
      }
      Un = !1;
    }
    pa = 0, it = Ge = Ne = null, Gl = !1, Ai = Rn = 0, Yl = null;
  }
  function vt() {
    var e = {
      memoizedState: null,
      baseState: null,
      baseQueue: null,
      queue: null,
      next: null
    };
    return it === null ? Ne.memoizedState = it = e : it = it.next = e, it;
  }
  function et() {
    if (Ge === null) {
      var e = Ne.alternate;
      e = e !== null ? e.memoizedState : null;
    } else e = Ge.next;
    var t = it === null ? Ne.memoizedState : it.next;
    if (t !== null) it = t, Ge = e;
    else {
      if (e === null)
        throw Ne.alternate === null ? Error(o(467)) : Error(o(310));
      Ge = e, e = {
        memoizedState: Ge.memoizedState,
        baseState: Ge.baseState,
        baseQueue: Ge.baseQueue,
        queue: Ge.queue,
        next: null
      }, it === null ? Ne.memoizedState = it = e : it = it.next = e;
    }
    return it;
  }
  function qn() {
    return {
      lastEffect: null,
      events: null,
      stores: null,
      memoCache: null
    };
  }
  function Ci(e) {
    var t = Ai;
    return Ai += 1, Yl === null && (Yl = []), e = bo(Yl, e, t), t = Ne, (it === null ? t.memoizedState : it.next) === null && (t = t.alternate, B.H = t === null || t.memoizedState === null ? du : Lc), e;
  }
  function Hn(e) {
    if (e !== null && typeof e == "object") {
      if (typeof e.then == "function") return Ci(e);
      if (e.$$typeof === V) return mt(e);
    }
    throw Error(o(438, String(e)));
  }
  function Tc(e) {
    var t = null, a = Ne.updateQueue;
    if (a !== null && (t = a.memoCache), t == null) {
      var i = Ne.alternate;
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
    }, a === null && (a = qn(), Ne.updateQueue = a), a.memoCache = t, a = t.data[t.index], a === void 0) for (a = t.data[t.index] = Array(e), i = 0; i < e; i++) a[i] = Z;
    return t.index++, a;
  }
  function fa(e, t) {
    return typeof t == "function" ? t(e) : t;
  }
  function Ln(e) {
    return kc(et(), Ge, e);
  }
  function kc(e, t, a) {
    var i = e.queue;
    if (i === null) throw Error(o(311));
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
      var d = c = null, f = null, w = t, D = !1;
      do {
        var L = w.lane & -536870913;
        if (L !== w.lane ? (Te & L) === L : (pa & L) === L) {
          var _ = w.revertLane;
          if (_ === 0) f !== null && (f = f.next = {
            lane: 0,
            revertLane: 0,
            gesture: null,
            action: w.action,
            hasEagerState: w.hasEagerState,
            eagerState: w.eagerState,
            next: null
          }), L === Rl && (D = !0);
          else if ((pa & _) === _) {
            w = w.next, _ === Rl && (D = !0);
            continue;
          } else L = {
            lane: 0,
            revertLane: w.revertLane,
            gesture: null,
            action: w.action,
            hasEagerState: w.hasEagerState,
            eagerState: w.eagerState,
            next: null
          }, f === null ? (d = f = L, c = s) : f = f.next = L, Ne.lanes |= _, Ra |= _;
          L = w.action, pl && a(s, L), s = w.hasEagerState ? w.eagerState : a(s, L);
        } else _ = {
          lane: L,
          revertLane: w.revertLane,
          gesture: w.gesture,
          action: w.action,
          hasEagerState: w.hasEagerState,
          eagerState: w.eagerState,
          next: null
        }, f === null ? (d = f = _, c = s) : f = f.next = _, Ne.lanes |= L, Ra |= L;
        w = w.next;
      } while (w !== null && w !== t);
      if (f === null ? c = s : f.next = d, !Tt(s, e.memoizedState) && (nt = !0, D && (a = ql, a !== null))) throw a;
      e.memoizedState = s, e.baseState = c, e.baseQueue = f, i.lastRenderedState = s;
    }
    return n === null && (i.lanes = 0), [e.memoizedState, i.dispatch];
  }
  function Ac(e) {
    var t = et(), a = t.queue;
    if (a === null) throw Error(o(311));
    a.lastRenderedReducer = e;
    var i = a.dispatch, n = a.pending, s = t.memoizedState;
    if (n !== null) {
      a.pending = null;
      var c = n = n.next;
      do
        s = e(s, c.action), c = c.next;
      while (c !== n);
      Tt(s, t.memoizedState) || (nt = !0), t.memoizedState = s, t.baseQueue === null && (t.baseState = s), a.lastRenderedState = s;
    }
    return [s, i];
  }
  function ko(e, t, a) {
    var i = Ne, n = et(), s = Ce;
    if (s) {
      if (a === void 0) throw Error(o(407));
      a = a();
    } else a = t();
    var c = !Tt((Ge || n).memoizedState, a);
    if (c && (n.memoizedState = a, nt = !0), n = n.queue, Mc(Oo.bind(null, i, n, e), [e]), n.getSnapshot !== t || c || it !== null && it.memoizedState.tag & 1) {
      if (i.flags |= 2048, Vl(9, { destroy: void 0 }, Co.bind(null, i, n, a, t), null), Qe === null) throw Error(o(349));
      s || (pa & 127) !== 0 || Ao(i, t, a);
    }
    return a;
  }
  function Ao(e, t, a) {
    e.flags |= 16384, e = {
      getSnapshot: t,
      value: a
    }, t = Ne.updateQueue, t === null ? (t = qn(), Ne.updateQueue = t, t.stores = [e]) : (a = t.stores, a === null ? t.stores = [e] : a.push(e));
  }
  function Co(e, t, a, i) {
    t.value = a, t.getSnapshot = i, Mo(t) && Do(e);
  }
  function Oo(e, t, a) {
    return a(function() {
      Mo(t) && Do(e);
    });
  }
  function Mo(e) {
    var t = e.getSnapshot;
    e = e.value;
    try {
      var a = t();
      return !Tt(e, a);
    } catch {
      return !0;
    }
  }
  function Do(e) {
    var t = tl(e, 2);
    t !== null && Et(t, e, 2);
  }
  function Cc(e) {
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
  function Uo(e, t, a, i) {
    return e.baseState = a, kc(e, Ge, typeof i == "function" ? i : fa);
  }
  function S0(e, t, a, i, n) {
    if (Yn(e)) throw Error(o(485));
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
      B.T !== null ? a(!0) : s.isTransition = !1, i(s), a = t.pending, a === null ? (s.next = t.pending = s, Ro(t, s)) : (s.next = a.next, t.pending = a.next = s);
    }
  }
  function Ro(e, t) {
    var a = t.action, i = t.payload, n = e.state;
    if (t.isTransition) {
      var s = B.T, c = {};
      B.T = c;
      try {
        var d = a(n, i), f = B.S;
        f !== null && f(c, d), qo(e, t, d);
      } catch (w) {
        Oc(e, t, w);
      } finally {
        s !== null && c.types !== null && (s.types = c.types), B.T = s;
      }
    } else try {
      s = a(n, i), qo(e, t, s);
    } catch (w) {
      Oc(e, t, w);
    }
  }
  function qo(e, t, a) {
    a !== null && typeof a == "object" && typeof a.then == "function" ? a.then(function(i) {
      Ho(e, t, i);
    }, function(i) {
      return Oc(e, t, i);
    }) : Ho(e, t, a);
  }
  function Ho(e, t, a) {
    t.status = "fulfilled", t.value = a, Lo(t), e.state = a, t = e.pending, t !== null && (a = t.next, a === t ? e.pending = null : (a = a.next, t.next = a, Ro(e, a)));
  }
  function Oc(e, t, a) {
    var i = e.pending;
    if (e.pending = null, i !== null) {
      i = i.next;
      do
        t.status = "rejected", t.reason = a, Lo(t), t = t.next;
      while (t !== i);
    }
    e.action = null;
  }
  function Lo(e) {
    e = e.listeners;
    for (var t = 0; t < e.length; t++) (0, e[t])();
  }
  function Bo(e, t) {
    return t;
  }
  function Go(e, t) {
    if (Ce) {
      var a = Qe.formState;
      if (a !== null) {
        e: {
          var i = Ne;
          if (Ce) {
            if (Ze) {
              t: {
                for (var n = Ze, s = Yt; n.nodeType !== 8; ) {
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
                Ze = Qt(n.nextSibling), i = n.data === "F!";
                break e;
              }
            }
            ka(i);
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
      lastRenderedReducer: Bo,
      lastRenderedState: t
    }, a.queue = i, a = su.bind(null, Ne, i), i.dispatch = a, i = Cc(!1), s = Hc.bind(null, Ne, !1, i.queue), i = vt(), n = {
      state: t,
      dispatch: null,
      action: e,
      pending: null
    }, i.queue = n, a = S0.bind(null, Ne, n, s, a), n.dispatch = a, i.memoizedState = e, [
      t,
      a,
      !1
    ];
  }
  function Yo(e) {
    return Vo(et(), Ge, e);
  }
  function Vo(e, t, a) {
    if (t = kc(e, t, Bo)[0], e = Ln(fa)[0], typeof t == "object" && t !== null && typeof t.then == "function") try {
      var i = Ci(t);
    } catch (c) {
      throw c === Hl ? kn : c;
    }
    else i = t;
    t = et();
    var n = t.queue, s = n.dispatch;
    return a !== t.memoizedState && (Ne.flags |= 2048, Vl(9, { destroy: void 0 }, z0.bind(null, n, a), null)), [
      i,
      s,
      e
    ];
  }
  function z0(e, t) {
    e.action = t;
  }
  function Xo(e) {
    var t = et(), a = Ge;
    if (a !== null) return Vo(t, a, e);
    et(), t = t.memoizedState, a = et();
    var i = a.queue.dispatch;
    return a.memoizedState = e, [
      t,
      i,
      !1
    ];
  }
  function Vl(e, t, a, i) {
    return e = {
      tag: e,
      create: a,
      deps: i,
      inst: t,
      next: null
    }, t = Ne.updateQueue, t === null && (t = qn(), Ne.updateQueue = t), a = t.lastEffect, a === null ? t.lastEffect = e.next = e : (i = a.next, a.next = e, e.next = i, t.lastEffect = e), e;
  }
  function Qo() {
    return et().memoizedState;
  }
  function Bn(e, t, a, i) {
    var n = vt();
    Ne.flags |= e, n.memoizedState = Vl(1 | t, { destroy: void 0 }, a, i === void 0 ? null : i);
  }
  function Gn(e, t, a, i) {
    var n = et();
    i = i === void 0 ? null : i;
    var s = n.memoizedState.inst;
    Ge !== null && i !== null && zc(i, Ge.memoizedState.deps) ? n.memoizedState = Vl(t, s, a, i) : (Ne.flags |= e, n.memoizedState = Vl(1 | t, s, a, i));
  }
  function Zo(e, t) {
    Bn(8390656, 8, e, t);
  }
  function Mc(e, t) {
    Gn(2048, 8, e, t);
  }
  function N0(e) {
    Ne.flags |= 4;
    var t = Ne.updateQueue;
    if (t === null) t = qn(), Ne.updateQueue = t, t.events = [e];
    else {
      var a = t.events;
      a === null ? t.events = [e] : a.push(e);
    }
  }
  function Ko(e) {
    var t = et().memoizedState;
    return N0({
      ref: t,
      nextImpl: e
    }), function() {
      if ((Re & 2) !== 0) throw Error(o(440));
      return t.impl.apply(void 0, arguments);
    };
  }
  function Jo(e, t) {
    return Gn(4, 2, e, t);
  }
  function Io(e, t) {
    return Gn(4, 4, e, t);
  }
  function $o(e, t) {
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
  function Wo(e, t, a) {
    a = a != null ? a.concat([e]) : null, Gn(4, 4, $o.bind(null, t, e), a);
  }
  function Dc() {
  }
  function Fo(e, t) {
    var a = et();
    t = t === void 0 ? null : t;
    var i = a.memoizedState;
    return t !== null && zc(t, i[1]) ? i[0] : (a.memoizedState = [e, t], e);
  }
  function Po(e, t) {
    var a = et();
    t = t === void 0 ? null : t;
    var i = a.memoizedState;
    if (t !== null && zc(t, i[1])) return i[0];
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
  function Uc(e, t, a) {
    return a === void 0 || (pa & 1073741824) !== 0 && (Te & 261930) === 0 ? e.memoizedState = t : (e.memoizedState = a, e = Wu(), Ne.lanes |= e, Ra |= e, a);
  }
  function eu(e, t, a, i) {
    return Tt(a, t) ? a : Bl.current !== null ? (e = Uc(e, a, i), Tt(e, t) || (nt = !0), e) : (pa & 42) === 0 || (pa & 1073741824) !== 0 && (Te & 261930) === 0 ? (nt = !0, e.memoizedState = a) : (e = Wu(), Ne.lanes |= e, Ra |= e, t);
  }
  function tu(e, t, a, i, n) {
    var s = G.p;
    G.p = s !== 0 && 8 > s ? s : 8;
    var c = B.T, d = {};
    B.T = d, Hc(e, !1, t, a);
    try {
      var f = n(), w = B.S;
      w !== null && w(d, f), f !== null && typeof f == "object" && typeof f.then == "function" ? Oi(e, t, v0(f, i), Xt(e)) : Oi(e, t, i, Xt(e));
    } catch (D) {
      Oi(e, t, {
        then: function() {
        },
        status: "rejected",
        reason: D
      }, Xt());
    } finally {
      G.p = s, c !== null && d.types !== null && (c.types = d.types), B.T = c;
    }
  }
  function w0() {
  }
  function Rc(e, t, a, i) {
    if (e.tag !== 5) throw Error(o(476));
    var n = au(e).queue;
    tu(e, n, t, ce, a === null ? w0 : function() {
      return lu(e), a(i);
    });
  }
  function au(e) {
    var t = e.memoizedState;
    if (t !== null) return t;
    t = {
      memoizedState: ce,
      baseState: ce,
      baseQueue: null,
      queue: {
        pending: null,
        lanes: 0,
        dispatch: null,
        lastRenderedReducer: fa,
        lastRenderedState: ce
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
    t.next === null && (t = e.alternate.memoizedState), Oi(e, t.next.queue, {}, Xt());
  }
  function qc() {
    return mt(Ii);
  }
  function iu() {
    return et().memoizedState;
  }
  function nu() {
    return et().memoizedState;
  }
  function _0(e) {
    for (var t = e.return; t !== null; ) {
      switch (t.tag) {
        case 24:
        case 3:
          var a = Xt();
          e = ol(a);
          var i = ul(t, e, a);
          i !== null && (Et(i, t, a), Ei(i, t, a)), t = { cache: pc() }, e.payload = t;
          return;
      }
      t = t.return;
    }
  }
  function E0(e, t, a) {
    var i = Xt();
    a = {
      lane: i,
      revertLane: 0,
      gesture: null,
      action: a,
      hasEagerState: !1,
      eagerState: null,
      next: null
    }, Yn(e) ? cu(t, a) : (a = tc(e, t, a, i), a !== null && (Et(a, e, i), ru(a, t, i)));
  }
  function su(e, t, a) {
    Oi(e, t, a, Xt());
  }
  function Oi(e, t, a, i) {
    var n = {
      lane: i,
      revertLane: 0,
      gesture: null,
      action: a,
      hasEagerState: !1,
      eagerState: null,
      next: null
    };
    if (Yn(e)) cu(t, n);
    else {
      var s = e.alternate;
      if (e.lanes === 0 && (s === null || s.lanes === 0) && (s = t.lastRenderedReducer, s !== null)) try {
        var c = t.lastRenderedState, d = s(c, a);
        if (n.hasEagerState = !0, n.eagerState = d, Tt(d, c)) return Sn(e, t, n, 0), Qe === null && yn(), !1;
      } catch {
      }
      if (a = tc(e, t, n, i), a !== null) return Et(a, e, i), ru(a, t, i), !0;
    }
    return !1;
  }
  function Hc(e, t, a, i) {
    if (i = {
      lane: 2,
      revertLane: xr(),
      gesture: null,
      action: i,
      hasEagerState: !1,
      eagerState: null,
      next: null
    }, Yn(e)) {
      if (t) throw Error(o(479));
    } else t = tc(e, a, i, 2), t !== null && Et(t, e, 2);
  }
  function Yn(e) {
    var t = e.alternate;
    return e === Ne || t !== null && t === Ne;
  }
  function cu(e, t) {
    Gl = Un = !0;
    var a = e.pending;
    a === null ? t.next = t : (t.next = a.next, a.next = t), e.pending = t;
  }
  function ru(e, t, a) {
    if ((a & 4194048) !== 0) {
      var i = t.lanes;
      i &= e.pendingLanes, a |= i, t.lanes = a, ud(e, a);
    }
  }
  var Mi = {
    readContext: mt,
    use: Hn,
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
  Mi.useEffectEvent = Ie;
  var du = {
    readContext: mt,
    use: Hn,
    useCallback: function(e, t) {
      return vt().memoizedState = [e, t === void 0 ? null : t], e;
    },
    useContext: mt,
    useEffect: Zo,
    useImperativeHandle: function(e, t, a) {
      a = a != null ? a.concat([e]) : null, Bn(4194308, 4, $o.bind(null, t, e), a);
    },
    useLayoutEffect: function(e, t) {
      return Bn(4194308, 4, e, t);
    },
    useInsertionEffect: function(e, t) {
      Bn(4, 2, e, t);
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
      }, i.queue = e, e = e.dispatch = E0.bind(null, Ne, e), [i.memoizedState, e];
    },
    useRef: function(e) {
      var t = vt();
      return e = { current: e }, t.memoizedState = e;
    },
    useState: function(e) {
      e = Cc(e);
      var t = e.queue, a = su.bind(null, Ne, t);
      return t.dispatch = a, [e.memoizedState, a];
    },
    useDebugValue: Dc,
    useDeferredValue: function(e, t) {
      return Uc(vt(), e, t);
    },
    useTransition: function() {
      var e = Cc(!1);
      return e = tu.bind(null, Ne, e.queue, !0, !1), vt().memoizedState = e, [!1, e];
    },
    useSyncExternalStore: function(e, t, a) {
      var i = Ne, n = vt();
      if (Ce) {
        if (a === void 0) throw Error(o(407));
        a = a();
      } else {
        if (a = t(), Qe === null) throw Error(o(349));
        (Te & 127) !== 0 || Ao(i, t, a);
      }
      n.memoizedState = a;
      var s = {
        value: a,
        getSnapshot: t
      };
      return n.queue = s, Zo(Oo.bind(null, i, s, e), [e]), i.flags |= 2048, Vl(9, { destroy: void 0 }, Co.bind(null, i, s, a, t), null), a;
    },
    useId: function() {
      var e = vt(), t = Qe.identifierPrefix;
      if (Ce) {
        var a = aa, i = ta;
        a = (i & ~(1 << 32 - rt(i) - 1)).toString(32) + a, t = "_" + t + "R_" + a, a = Rn++, 0 < a && (t += "H" + a.toString(32)), t += "_";
      } else a = j0++, t = "_" + t + "r_" + a.toString(32) + "_";
      return e.memoizedState = t;
    },
    useHostTransitionStatus: qc,
    useFormState: Go,
    useActionState: Go,
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
      return t.queue = a, t = Hc.bind(null, Ne, !0, a), a.dispatch = t, [e, t];
    },
    useMemoCache: Tc,
    useCacheRefresh: function() {
      return vt().memoizedState = _0.bind(null, Ne);
    },
    useEffectEvent: function(e) {
      var t = vt(), a = { impl: e };
      return t.memoizedState = a, function() {
        if ((Re & 2) !== 0) throw Error(o(440));
        return a.impl.apply(void 0, arguments);
      };
    }
  }, Lc = {
    readContext: mt,
    use: Hn,
    useCallback: Fo,
    useContext: mt,
    useEffect: Mc,
    useImperativeHandle: Wo,
    useInsertionEffect: Jo,
    useLayoutEffect: Io,
    useMemo: Po,
    useReducer: Ln,
    useRef: Qo,
    useState: function() {
      return Ln(fa);
    },
    useDebugValue: Dc,
    useDeferredValue: function(e, t) {
      return eu(et(), Ge.memoizedState, e, t);
    },
    useTransition: function() {
      var e = Ln(fa)[0], t = et().memoizedState;
      return [typeof e == "boolean" ? e : Ci(e), t];
    },
    useSyncExternalStore: ko,
    useId: iu,
    useHostTransitionStatus: qc,
    useFormState: Yo,
    useActionState: Yo,
    useOptimistic: function(e, t) {
      return Uo(et(), Ge, e, t);
    },
    useMemoCache: Tc,
    useCacheRefresh: nu
  };
  Lc.useEffectEvent = Ko;
  var ou = {
    readContext: mt,
    use: Hn,
    useCallback: Fo,
    useContext: mt,
    useEffect: Mc,
    useImperativeHandle: Wo,
    useInsertionEffect: Jo,
    useLayoutEffect: Io,
    useMemo: Po,
    useReducer: Ac,
    useRef: Qo,
    useState: function() {
      return Ac(fa);
    },
    useDebugValue: Dc,
    useDeferredValue: function(e, t) {
      var a = et();
      return Ge === null ? Uc(a, e, t) : eu(a, Ge.memoizedState, e, t);
    },
    useTransition: function() {
      var e = Ac(fa)[0], t = et().memoizedState;
      return [typeof e == "boolean" ? e : Ci(e), t];
    },
    useSyncExternalStore: ko,
    useId: iu,
    useHostTransitionStatus: qc,
    useFormState: Xo,
    useActionState: Xo,
    useOptimistic: function(e, t) {
      var a = et();
      return Ge !== null ? Uo(a, Ge, e, t) : (a.baseState = e, [e, a.queue.dispatch]);
    },
    useMemoCache: Tc,
    useCacheRefresh: nu
  };
  ou.useEffectEvent = Ko;
  function Bc(e, t, a, i) {
    t = e.memoizedState, a = a(i, t), a = a == null ? t : U({}, t, a), e.memoizedState = a, e.lanes === 0 && (e.updateQueue.baseState = a);
  }
  var Gc = {
    enqueueSetState: function(e, t, a) {
      e = e._reactInternals;
      var i = Xt(), n = ol(i);
      n.payload = t, a != null && (n.callback = a), t = ul(e, n, i), t !== null && (Et(t, e, i), Ei(t, e, i));
    },
    enqueueReplaceState: function(e, t, a) {
      e = e._reactInternals;
      var i = Xt(), n = ol(i);
      n.tag = 1, n.payload = t, a != null && (n.callback = a), t = ul(e, n, i), t !== null && (Et(t, e, i), Ei(t, e, i));
    },
    enqueueForceUpdate: function(e, t) {
      e = e._reactInternals;
      var a = Xt(), i = ol(a);
      i.tag = 2, t != null && (i.callback = t), t = ul(e, i, a), t !== null && (Et(t, e, a), Ei(t, e, a));
    }
  };
  function uu(e, t, a, i, n, s, c) {
    return e = e.stateNode, typeof e.shouldComponentUpdate == "function" ? e.shouldComponentUpdate(i, s, c) : t.prototype && t.prototype.isPureReactComponent ? !vi(a, i) || !vi(n, s) : !0;
  }
  function pu(e, t, a, i) {
    e = t.state, typeof t.componentWillReceiveProps == "function" && t.componentWillReceiveProps(a, i), typeof t.UNSAFE_componentWillReceiveProps == "function" && t.UNSAFE_componentWillReceiveProps(a, i), t.state !== e && Gc.enqueueReplaceState(t, t.state, null);
  }
  function fl(e, t) {
    var a = t;
    if ("ref" in t) {
      a = {};
      for (var i in t) i !== "ref" && (a[i] = t[i]);
    }
    if (e = e.defaultProps) {
      a === t && (a = U({}, a));
      for (var n in e) a[n] === void 0 && (a[n] = e[n]);
    }
    return a;
  }
  function T0(e) {
    jn(e);
  }
  function k0(e) {
    console.error(e);
  }
  function A0(e) {
    jn(e);
  }
  function Vn(e, t) {
    try {
      var a = e.onUncaughtError;
      a(t.value, { componentStack: t.stack });
    } catch (i) {
      setTimeout(function() {
        throw i;
      });
    }
  }
  function fu(e, t, a) {
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
  function Yc(e, t, a) {
    return a = ol(a), a.tag = 3, a.payload = { element: null }, a.callback = function() {
      Vn(e, t);
    }, a;
  }
  function hu(e) {
    return e = ol(e), e.tag = 3, e;
  }
  function mu(e, t, a, i) {
    var n = a.type.getDerivedStateFromError;
    if (typeof n == "function") {
      var s = i.value;
      e.payload = function() {
        return n(s);
      }, e.callback = function() {
        fu(t, a, i);
      };
    }
    var c = a.stateNode;
    c !== null && typeof c.componentDidCatch == "function" && (e.callback = function() {
      fu(t, a, i), typeof n != "function" && (qa === null ? qa = /* @__PURE__ */ new Set([this]) : qa.add(this));
      var d = i.stack;
      this.componentDidCatch(i.value, { componentStack: d !== null ? d : "" });
    });
  }
  function C0(e, t, a, i, n) {
    if (a.flags |= 32768, i !== null && typeof i == "object" && typeof i.then == "function") {
      if (t = a.alternate, t !== null && Ul(t, a, n, !0), a = At.current, a !== null) {
        switch (a.tag) {
          case 31:
          case 13:
            return Vt === null ? ts() : a.alternate === null && $e === 0 && ($e = 3), a.flags &= -257, a.flags |= 65536, a.lanes = n, i === An ? a.flags |= 16384 : (t = a.updateQueue, t === null ? a.updateQueue = /* @__PURE__ */ new Set([i]) : t.add(i), fr(e, i, n)), !1;
          case 22:
            return a.flags |= 65536, i === An ? a.flags |= 16384 : (t = a.updateQueue, t === null ? (t = {
              transitions: null,
              markerInstances: null,
              retryQueue: /* @__PURE__ */ new Set([i])
            }, a.updateQueue = t) : (a = t.retryQueue, a === null ? t.retryQueue = /* @__PURE__ */ new Set([i]) : a.add(i)), fr(e, i, n)), !1;
        }
        throw Error(o(435, a.tag));
      }
      return fr(e, i, n), ts(), !1;
    }
    if (Ce) return t = At.current, t !== null ? ((t.flags & 65536) === 0 && (t.flags |= 256), t.flags |= 65536, t.lanes = n, i !== cc && (e = Error(o(422), { cause: i }), Si(Lt(e, a)))) : (i !== cc && (t = Error(o(423), { cause: i }), Si(Lt(t, a))), e = e.current.alternate, e.flags |= 65536, n &= -n, e.lanes |= n, i = Lt(i, a), n = Yc(e.stateNode, i, n), bc(e, n), $e !== 4 && ($e = 2)), !1;
    var s = Error(o(520), { cause: i });
    if (s = Lt(s, a), Gi === null ? Gi = [s] : Gi.push(s), $e !== 4 && ($e = 2), t === null) return !0;
    i = Lt(i, a), a = t;
    do {
      switch (a.tag) {
        case 3:
          return a.flags |= 65536, e = n & -n, a.lanes |= e, e = Yc(a.stateNode, i, e), bc(a, e), !1;
        case 1:
          if (t = a.type, s = a.stateNode, (a.flags & 128) === 0 && (typeof t.getDerivedStateFromError == "function" || s !== null && typeof s.componentDidCatch == "function" && (qa === null || !qa.has(s)))) return a.flags |= 65536, n &= -n, a.lanes |= n, n = hu(n), mu(n, e, a, i), bc(a, n), !1;
      }
      a = a.return;
    } while (a !== null);
    return !1;
  }
  var Vc = Error(o(461)), nt = !1;
  function xt(e, t, a, i) {
    t.child = e === null ? So(t, null, a, i) : dl(t, e.child, a, i);
  }
  function xu(e, t, a, i, n) {
    a = a.render;
    var s = t.ref;
    if ("ref" in i) {
      var c = {};
      for (var d in i) d !== "ref" && (c[d] = i[d]);
    } else c = i;
    return nl(t), i = Nc(e, t, a, c, s, n), d = wc(), e !== null && !nt ? (_c(e, t, n), ha(e, t, n)) : (Ce && d && nc(t), t.flags |= 1, xt(e, t, i, n), t.child);
  }
  function gu(e, t, a, i, n) {
    if (e === null) {
      var s = a.type;
      return typeof s == "function" && !ac(s) && s.defaultProps === void 0 && a.compare === null ? (t.tag = 15, t.type = s, bu(e, t, s, i, n)) : (e = Nn(a.type, null, i, t, t.mode, n), e.ref = t.ref, e.return = t, t.child = e);
    }
    if (s = e.child, !Wc(e, n)) {
      var c = s.memoizedProps;
      if (a = a.compare, a = a !== null ? a : vi, a(c, i) && e.ref === t.ref) return ha(e, t, n);
    }
    return t.flags |= 1, e = ra(s, i), e.ref = t.ref, e.return = t, t.child = e;
  }
  function bu(e, t, a, i, n) {
    if (e !== null) {
      var s = e.memoizedProps;
      if (vi(s, i) && e.ref === t.ref) if (nt = !1, t.pendingProps = i = s, Wc(e, n)) (e.flags & 131072) !== 0 && (nt = !0);
      else return t.lanes = e.lanes, ha(e, t, n);
    }
    return Xc(e, t, a, i, n);
  }
  function vu(e, t, a, i) {
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
        return ju(e, t, s, a, i);
      }
      if ((a & 536870912) !== 0) t.memoizedState = {
        baseLanes: 0,
        cachePool: null
      }, e !== null && Tn(t, s !== null ? s.cachePool : null), s !== null ? wo(t, s) : jc(), _o(t);
      else return i = t.lanes = 536870912, ju(e, t, s !== null ? s.baseLanes | a : a, a, i);
    } else s !== null ? (Tn(t, s.cachePool), wo(t, s), Ma(t), t.memoizedState = null) : (e !== null && Tn(t, null), jc(), Ma(t));
    return xt(e, t, n, a), t.child;
  }
  function Di(e, t) {
    return e !== null && e.tag === 22 || t.stateNode !== null || (t.stateNode = {
      _visibility: 1,
      _pendingMarkers: null,
      _retryCache: null,
      _transitions: null
    }), t.sibling;
  }
  function ju(e, t, a, i, n) {
    var s = hc();
    return s = s === null ? null : {
      parent: lt._currentValue,
      pool: s
    }, t.memoizedState = {
      baseLanes: a,
      cachePool: s
    }, e !== null && Tn(t, null), jc(), _o(t), e !== null && Ul(e, t, i, !0), t.childLanes = n, null;
  }
  function Xn(e, t) {
    return t = Zn({
      mode: t.mode,
      children: t.children
    }, e.mode), t.ref = e.ref, e.child = t, t.return = e, t;
  }
  function yu(e, t, a) {
    return dl(t, e.child, null, a), e = Xn(t, t.pendingProps), e.flags |= 2, Ct(t), t.memoizedState = null, e;
  }
  function O0(e, t, a) {
    var i = t.pendingProps, n = (t.flags & 128) !== 0;
    if (t.flags &= -129, e === null) {
      if (Ce) {
        if (i.mode === "hidden") return e = Xn(t, i), t.lanes = 536870912, Di(null, e);
        if (Sc(t), (e = Ze) ? (e = Dp(e, Yt), e = e !== null && e.data === "&" ? e : null, e !== null && (t.memoizedState = {
          dehydrated: e,
          treeContext: Ea !== null ? {
            id: ta,
            overflow: aa
          } : null,
          retryLane: 536870912,
          hydrationErrors: null
        }, a = so(e), a.return = t, t.child = a, ht = t, Ze = null)) : e = null, e === null) throw ka(t);
        return t.lanes = 536870912, null;
      }
      return Xn(t, i);
    }
    var s = e.memoizedState;
    if (s !== null) {
      var c = s.dehydrated;
      if (Sc(t), n) if (t.flags & 256) t.flags &= -257, t = yu(e, t, a);
      else if (t.memoizedState !== null) t.child = e.child, t.flags |= 128, t = null;
      else throw Error(o(558));
      else if (nt || Ul(e, t, a, !1), n = (a & e.childLanes) !== 0, nt || n) {
        if (i = Qe, i !== null && (c = pd(i, a), c !== 0 && c !== s.retryLane)) throw s.retryLane = c, tl(e, c), Et(i, e, c), Vc;
        ts(), t = yu(e, t, a);
      } else e = s.treeContext, Ze = Qt(c.nextSibling), ht = t, Ce = !0, Ta = null, Yt = !1, e !== null && oo(t, e), t = Xn(t, i), t.flags |= 4096;
      return t;
    }
    return e = ra(e.child, {
      mode: i.mode,
      children: i.children
    }), e.ref = t.ref, t.child = e, e.return = t, e;
  }
  function Qn(e, t) {
    var a = t.ref;
    if (a === null) e !== null && e.ref !== null && (t.flags |= 4194816);
    else {
      if (typeof a != "function" && typeof a != "object") throw Error(o(284));
      (e === null || e.ref !== a) && (t.flags |= 4194816);
    }
  }
  function Xc(e, t, a, i, n) {
    return nl(t), a = Nc(e, t, a, i, void 0, n), i = wc(), e !== null && !nt ? (_c(e, t, n), ha(e, t, n)) : (Ce && i && nc(t), t.flags |= 1, xt(e, t, a, n), t.child);
  }
  function Su(e, t, a, i, n, s) {
    return nl(t), t.updateQueue = null, a = To(t, i, a, n), Eo(e), i = wc(), e !== null && !nt ? (_c(e, t, s), ha(e, t, s)) : (Ce && i && nc(t), t.flags |= 1, xt(e, t, a, s), t.child);
  }
  function zu(e, t, a, i, n) {
    if (nl(t), t.stateNode === null) {
      var s = Cl, c = a.contextType;
      typeof c == "object" && c !== null && (s = mt(c)), s = new a(i, s), t.memoizedState = s.state !== null && s.state !== void 0 ? s.state : null, s.updater = Gc, t.stateNode = s, s._reactInternals = t, s = t.stateNode, s.props = i, s.state = t.memoizedState, s.refs = {}, xc(t), c = a.contextType, s.context = typeof c == "object" && c !== null ? mt(c) : Cl, s.state = t.memoizedState, c = a.getDerivedStateFromProps, typeof c == "function" && (Bc(t, a, c, i), s.state = t.memoizedState), typeof a.getDerivedStateFromProps == "function" || typeof s.getSnapshotBeforeUpdate == "function" || typeof s.UNSAFE_componentWillMount != "function" && typeof s.componentWillMount != "function" || (c = s.state, typeof s.componentWillMount == "function" && s.componentWillMount(), typeof s.UNSAFE_componentWillMount == "function" && s.UNSAFE_componentWillMount(), c !== s.state && Gc.enqueueReplaceState(s, s.state, null), ki(t, i, s, n), Ti(), s.state = t.memoizedState), typeof s.componentDidMount == "function" && (t.flags |= 4194308), i = !0;
    } else if (e === null) {
      s = t.stateNode;
      var d = t.memoizedProps, f = fl(a, d);
      s.props = f;
      var w = s.context, D = a.contextType;
      c = Cl, typeof D == "object" && D !== null && (c = mt(D));
      var L = a.getDerivedStateFromProps;
      D = typeof L == "function" || typeof s.getSnapshotBeforeUpdate == "function", d = t.pendingProps !== d, D || typeof s.UNSAFE_componentWillReceiveProps != "function" && typeof s.componentWillReceiveProps != "function" || (d || w !== c) && pu(t, s, i, c), Ca = !1;
      var _ = t.memoizedState;
      s.state = _, ki(t, i, s, n), Ti(), w = t.memoizedState, d || _ !== w || Ca ? (typeof L == "function" && (Bc(t, a, L, i), w = t.memoizedState), (f = Ca || uu(t, a, f, i, _, w, c)) ? (D || typeof s.UNSAFE_componentWillMount != "function" && typeof s.componentWillMount != "function" || (typeof s.componentWillMount == "function" && s.componentWillMount(), typeof s.UNSAFE_componentWillMount == "function" && s.UNSAFE_componentWillMount()), typeof s.componentDidMount == "function" && (t.flags |= 4194308)) : (typeof s.componentDidMount == "function" && (t.flags |= 4194308), t.memoizedProps = i, t.memoizedState = w), s.props = i, s.state = w, s.context = c, i = f) : (typeof s.componentDidMount == "function" && (t.flags |= 4194308), i = !1);
    } else {
      s = t.stateNode, gc(e, t), c = t.memoizedProps, D = fl(a, c), s.props = D, L = t.pendingProps, _ = s.context, w = a.contextType, f = Cl, typeof w == "object" && w !== null && (f = mt(w)), d = a.getDerivedStateFromProps, (w = typeof d == "function" || typeof s.getSnapshotBeforeUpdate == "function") || typeof s.UNSAFE_componentWillReceiveProps != "function" && typeof s.componentWillReceiveProps != "function" || (c !== L || _ !== f) && pu(t, s, i, f), Ca = !1, _ = t.memoizedState, s.state = _, ki(t, i, s, n), Ti();
      var O = t.memoizedState;
      c !== L || _ !== O || Ca || e !== null && e.dependencies !== null && _n(e.dependencies) ? (typeof d == "function" && (Bc(t, a, d, i), O = t.memoizedState), (D = Ca || uu(t, a, D, i, _, O, f) || e !== null && e.dependencies !== null && _n(e.dependencies)) ? (w || typeof s.UNSAFE_componentWillUpdate != "function" && typeof s.componentWillUpdate != "function" || (typeof s.componentWillUpdate == "function" && s.componentWillUpdate(i, O, f), typeof s.UNSAFE_componentWillUpdate == "function" && s.UNSAFE_componentWillUpdate(i, O, f)), typeof s.componentDidUpdate == "function" && (t.flags |= 4), typeof s.getSnapshotBeforeUpdate == "function" && (t.flags |= 1024)) : (typeof s.componentDidUpdate != "function" || c === e.memoizedProps && _ === e.memoizedState || (t.flags |= 4), typeof s.getSnapshotBeforeUpdate != "function" || c === e.memoizedProps && _ === e.memoizedState || (t.flags |= 1024), t.memoizedProps = i, t.memoizedState = O), s.props = i, s.state = O, s.context = f, i = D) : (typeof s.componentDidUpdate != "function" || c === e.memoizedProps && _ === e.memoizedState || (t.flags |= 4), typeof s.getSnapshotBeforeUpdate != "function" || c === e.memoizedProps && _ === e.memoizedState || (t.flags |= 1024), i = !1);
    }
    return s = i, Qn(e, t), i = (t.flags & 128) !== 0, s || i ? (s = t.stateNode, a = i && typeof a.getDerivedStateFromError != "function" ? null : s.render(), t.flags |= 1, e !== null && i ? (t.child = dl(t, e.child, null, n), t.child = dl(t, null, a, n)) : xt(e, t, a, n), t.memoizedState = s.state, e = t.child) : e = ha(e, t, n), e;
  }
  function Nu(e, t, a, i) {
    return ll(), t.flags |= 256, xt(e, t, a, i), t.child;
  }
  var Qc = {
    dehydrated: null,
    treeContext: null,
    retryLane: 0,
    hydrationErrors: null
  };
  function Zc(e) {
    return {
      baseLanes: e,
      cachePool: xo()
    };
  }
  function Kc(e, t, a) {
    return e = e !== null ? e.childLanes & ~a : 0, t && (e |= Mt), e;
  }
  function wu(e, t, a) {
    var i = t.pendingProps, n = !1, s = (t.flags & 128) !== 0, c;
    if ((c = s) || (c = e !== null && e.memoizedState === null ? !1 : (Pe.current & 2) !== 0), c && (n = !0, t.flags &= -129), c = (t.flags & 32) !== 0, t.flags &= -33, e === null) {
      if (Ce) {
        if (n ? Oa(t) : Ma(t), (e = Ze) ? (e = Dp(e, Yt), e = e !== null && e.data !== "&" ? e : null, e !== null && (t.memoizedState = {
          dehydrated: e,
          treeContext: Ea !== null ? {
            id: ta,
            overflow: aa
          } : null,
          retryLane: 536870912,
          hydrationErrors: null
        }, a = so(e), a.return = t, t.child = a, ht = t, Ze = null)) : e = null, e === null) throw ka(t);
        return Tr(e) ? t.lanes = 32 : t.lanes = 536870912, null;
      }
      var d = i.children;
      return i = i.fallback, n ? (Ma(t), n = t.mode, d = Zn({
        mode: "hidden",
        children: d
      }, n), i = al(i, n, a, null), d.return = t, i.return = t, d.sibling = i, t.child = d, i = t.child, i.memoizedState = Zc(a), i.childLanes = Kc(e, c, a), t.memoizedState = Qc, Di(null, i)) : (Oa(t), Jc(t, d));
    }
    var f = e.memoizedState;
    if (f !== null && (d = f.dehydrated, d !== null)) {
      if (s) t.flags & 256 ? (Oa(t), t.flags &= -257, t = Ic(e, t, a)) : t.memoizedState !== null ? (Ma(t), t.child = e.child, t.flags |= 128, t = null) : (Ma(t), d = i.fallback, n = t.mode, i = Zn({
        mode: "visible",
        children: i.children
      }, n), d = al(d, n, a, null), d.flags |= 2, i.return = t, d.return = t, i.sibling = d, t.child = i, dl(t, e.child, null, a), i = t.child, i.memoizedState = Zc(a), i.childLanes = Kc(e, c, a), t.memoizedState = Qc, t = Di(null, i));
      else if (Oa(t), Tr(d)) {
        if (c = d.nextSibling && d.nextSibling.dataset, c) var w = c.dgst;
        c = w, i = Error(o(419)), i.stack = "", i.digest = c, Si({
          value: i,
          source: null,
          stack: null
        }), t = Ic(e, t, a);
      } else if (nt || Ul(e, t, a, !1), c = (a & e.childLanes) !== 0, nt || c) {
        if (c = Qe, c !== null && (i = pd(c, a), i !== 0 && i !== f.retryLane)) throw f.retryLane = i, tl(e, i), Et(c, e, i), Vc;
        Er(d) || ts(), t = Ic(e, t, a);
      } else Er(d) ? (t.flags |= 192, t.child = e.child, t = null) : (e = f.treeContext, Ze = Qt(d.nextSibling), ht = t, Ce = !0, Ta = null, Yt = !1, e !== null && oo(t, e), t = Jc(t, i.children), t.flags |= 4096);
      return t;
    }
    return n ? (Ma(t), d = i.fallback, n = t.mode, f = e.child, w = f.sibling, i = ra(f, {
      mode: "hidden",
      children: i.children
    }), i.subtreeFlags = f.subtreeFlags & 65011712, w !== null ? d = ra(w, d) : (d = al(d, n, a, null), d.flags |= 2), d.return = t, i.return = t, i.sibling = d, t.child = i, Di(null, i), i = t.child, d = e.child.memoizedState, d === null ? d = Zc(a) : (n = d.cachePool, n !== null ? (f = lt._currentValue, n = n.parent !== f ? {
      parent: f,
      pool: f
    } : n) : n = xo(), d = {
      baseLanes: d.baseLanes | a,
      cachePool: n
    }), i.memoizedState = d, i.childLanes = Kc(e, c, a), t.memoizedState = Qc, Di(e.child, i)) : (Oa(t), a = e.child, e = a.sibling, a = ra(a, {
      mode: "visible",
      children: i.children
    }), a.return = t, a.sibling = null, e !== null && (c = t.deletions, c === null ? (t.deletions = [e], t.flags |= 16) : c.push(e)), t.child = a, t.memoizedState = null, a);
  }
  function Jc(e, t) {
    return t = Zn({
      mode: "visible",
      children: t
    }, e.mode), t.return = e, e.child = t;
  }
  function Zn(e, t) {
    return e = kt(22, e, null, t), e.lanes = 0, e;
  }
  function Ic(e, t, a) {
    return dl(t, e.child, null, a), e = Jc(t, t.pendingProps.children), e.flags |= 2, t.memoizedState = null, e;
  }
  function _u(e, t, a) {
    e.lanes |= t;
    var i = e.alternate;
    i !== null && (i.lanes |= t), oc(e.return, t, a);
  }
  function $c(e, t, a, i, n, s) {
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
    var c = Pe.current, d = (c & 2) !== 0;
    if (d ? (c = c & 1 | 2, t.flags |= 128) : c &= 1, J(Pe, c), xt(e, t, i, a), i = Ce ? yi : 0, !d && e !== null && (e.flags & 128) !== 0) e: for (e = t.child; e !== null; ) {
      if (e.tag === 13) e.memoizedState !== null && _u(e, a, t);
      else if (e.tag === 19) _u(e, a, t);
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
        for (a = t.child, n = null; a !== null; ) e = a.alternate, e !== null && Dn(e) === null && (n = a), a = a.sibling;
        a = n, a === null ? (n = t.child, t.child = null) : (n = a.sibling, a.sibling = null), $c(t, !1, n, a, s, i);
        break;
      case "backwards":
      case "unstable_legacy-backwards":
        for (a = null, n = t.child, t.child = null; n !== null; ) {
          if (e = n.alternate, e !== null && Dn(e) === null) {
            t.child = n;
            break;
          }
          e = n.sibling, n.sibling = a, a = n, n = e;
        }
        $c(t, !0, a, null, s, i);
        break;
      case "together":
        $c(t, !1, null, null, void 0, i);
        break;
      default:
        t.memoizedState = null;
    }
    return t.child;
  }
  function ha(e, t, a) {
    if (e !== null && (t.dependencies = e.dependencies), Ra |= t.lanes, (a & t.childLanes) === 0) if (e !== null) {
      if (Ul(e, t, a, !1), (a & t.childLanes) === 0) return null;
    } else return null;
    if (e !== null && t.child !== e.child) throw Error(o(153));
    if (t.child !== null) {
      for (e = t.child, a = ra(e, e.pendingProps), t.child = a, a.return = t; e.sibling !== null; ) e = e.sibling, a = a.sibling = ra(e, e.pendingProps), a.return = t;
      a.sibling = null;
    }
    return t.child;
  }
  function Wc(e, t) {
    return (e.lanes & t) !== 0 ? !0 : (e = e.dependencies, !!(e !== null && _n(e)));
  }
  function M0(e, t, a) {
    switch (t.tag) {
      case 3:
        Ue(t, t.stateNode.containerInfo), Aa(t, lt, e.memoizedState.cache), ll();
        break;
      case 27:
      case 5:
        le(t);
        break;
      case 4:
        Ue(t, t.stateNode.containerInfo);
        break;
      case 10:
        Aa(t, t.type, t.memoizedProps.value);
        break;
      case 31:
        if (t.memoizedState !== null) return t.flags |= 128, Sc(t), null;
        break;
      case 13:
        var i = t.memoizedState;
        if (i !== null)
          return i.dehydrated !== null ? (Oa(t), t.flags |= 128, null) : (a & t.child.childLanes) !== 0 ? wu(e, t, a) : (Oa(t), e = ha(e, t, a), e !== null ? e.sibling : null);
        Oa(t);
        break;
      case 19:
        var n = (e.flags & 128) !== 0;
        if (i = (a & t.childLanes) !== 0, i || (Ul(e, t, a, !1), i = (a & t.childLanes) !== 0), n) {
          if (i) return Eu(e, t, a);
          t.flags |= 128;
        }
        if (n = t.memoizedState, n !== null && (n.rendering = null, n.tail = null, n.lastEffect = null), J(Pe, Pe.current), i) break;
        return null;
      case 22:
        return t.lanes = 0, vu(e, t, a, t.pendingProps);
      case 24:
        Aa(t, lt, e.memoizedState.cache);
    }
    return ha(e, t, a);
  }
  function Tu(e, t, a) {
    if (e !== null) if (e.memoizedProps !== t.pendingProps) nt = !0;
    else {
      if (!Wc(e, a) && (t.flags & 128) === 0) return nt = !1, M0(e, t, a);
      nt = (e.flags & 131072) !== 0;
    }
    else nt = !1, Ce && (t.flags & 1048576) !== 0 && ro(t, yi, t.index);
    switch (t.lanes = 0, t.tag) {
      case 16:
        e: {
          var i = t.pendingProps;
          if (e = cl(t.elementType), t.type = e, typeof e == "function") ac(e) ? (i = fl(e, i), t.tag = 1, t = zu(null, t, e, i, a)) : (t.tag = 0, t = Xc(null, t, e, i, a));
          else {
            if (e != null) {
              var n = e.$$typeof;
              if (n === W) {
                t.tag = 11, t = xu(null, t, e, i, a);
                break e;
              } else if (n === pe) {
                t.tag = 14, t = gu(null, t, e, i, a);
                break e;
              }
            }
            throw t = ee(e) || e, Error(o(306, t, ""));
          }
        }
        return t;
      case 0:
        return Xc(e, t, t.type, t.pendingProps, a);
      case 1:
        return i = t.type, n = fl(i, t.pendingProps), zu(e, t, i, n, a);
      case 3:
        e: {
          if (Ue(t, t.stateNode.containerInfo), e === null) throw Error(o(387));
          i = t.pendingProps;
          var s = t.memoizedState;
          n = s.element, gc(e, t), ki(t, i, null, a);
          var c = t.memoizedState;
          if (i = c.cache, Aa(t, lt, i), i !== s.cache && uc(t, [lt], a, !0), Ti(), i = c.element, s.isDehydrated) if (s = {
            element: i,
            isDehydrated: !1,
            cache: c.cache
          }, t.updateQueue.baseState = s, t.memoizedState = s, t.flags & 256) {
            t = Nu(e, t, i, a);
            break e;
          } else if (i !== n) {
            n = Lt(Error(o(424)), t), Si(n), t = Nu(e, t, i, a);
            break e;
          } else
            for (e = t.stateNode.containerInfo, e.nodeType === 9 ? e = e.body : e = e.nodeName === "HTML" ? e.ownerDocument.body : e, Ze = Qt(e.firstChild), ht = t, Ce = !0, Ta = null, Yt = !0, a = So(t, null, i, a), t.child = a; a; ) a.flags = a.flags & -3 | 4096, a = a.sibling;
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
        return Qn(e, t), e === null ? (a = Bp(t.type, null, t.pendingProps, null)) ? t.memoizedState = a : Ce || (a = t.type, e = t.pendingProps, i = rs(F.current).createElement(a), i[ft] = t, i[yt] = e, gt(i, a, e), ut(i), t.stateNode = i) : t.memoizedState = Bp(t.type, e.memoizedProps, t.pendingProps, e.memoizedState), null;
      case 27:
        return le(t), e === null && Ce && (i = t.stateNode = qp(t.type, t.pendingProps, F.current), ht = t, Yt = !0, n = Ze, Ga(t.type) ? (kr = n, Ze = Qt(i.firstChild)) : Ze = n), xt(e, t, t.pendingProps.children, a), Qn(e, t), e === null && (t.flags |= 4194304), t.child;
      case 5:
        return e === null && Ce && ((n = i = Ze) && (i = ch(i, t.type, t.pendingProps, Yt), i !== null ? (t.stateNode = i, ht = t, Ze = Qt(i.firstChild), Yt = !1, n = !0) : n = !1), n || ka(t)), le(t), n = t.type, s = t.pendingProps, c = e !== null ? e.memoizedProps : null, i = s.children, Nr(n, s) ? i = null : c !== null && Nr(n, c) && (t.flags |= 32), t.memoizedState !== null && (n = Nc(e, t, y0, null, null, a), Ii._currentValue = n), Qn(e, t), xt(e, t, i, a), t.child;
      case 6:
        return e === null && Ce && ((e = a = Ze) && (a = rh(a, t.pendingProps, Yt), a !== null ? (t.stateNode = a, ht = t, Ze = null, e = !0) : e = !1), e || ka(t)), null;
      case 13:
        return wu(e, t, a);
      case 4:
        return Ue(t, t.stateNode.containerInfo), i = t.pendingProps, e === null ? t.child = dl(t, null, i, a) : xt(e, t, i, a), t.child;
      case 11:
        return xu(e, t, t.type, t.pendingProps, a);
      case 7:
        return xt(e, t, t.pendingProps, a), t.child;
      case 8:
        return xt(e, t, t.pendingProps.children, a), t.child;
      case 12:
        return xt(e, t, t.pendingProps.children, a), t.child;
      case 10:
        return i = t.pendingProps, Aa(t, t.type, i.value), xt(e, t, i.children, a), t.child;
      case 9:
        return n = t.type._context, i = t.pendingProps.children, nl(t), n = mt(n), i = i(n), t.flags |= 1, xt(e, t, i, a), t.child;
      case 14:
        return gu(e, t, t.type, t.pendingProps, a);
      case 15:
        return bu(e, t, t.type, t.pendingProps, a);
      case 19:
        return Eu(e, t, a);
      case 31:
        return O0(e, t, a);
      case 22:
        return vu(e, t, a, t.pendingProps);
      case 24:
        return nl(t), i = mt(lt), e === null ? (n = hc(), n === null && (n = Qe, s = pc(), n.pooledCache = s, s.refCount++, s !== null && (n.pooledCacheLanes |= a), n = s), t.memoizedState = {
          parent: i,
          cache: n
        }, xc(t), Aa(t, lt, n)) : ((e.lanes & a) !== 0 && (gc(e, t), ki(t, null, null, a), Ti()), n = e.memoizedState, s = t.memoizedState, n.parent !== i ? (n = {
          parent: i,
          cache: i
        }, t.memoizedState = n, t.lanes === 0 && (t.memoizedState = t.updateQueue.baseState = n), Aa(t, lt, i)) : (i = s.cache, Aa(t, lt, i), i !== n.cache && uc(t, [lt], a, !0))), xt(e, t, t.pendingProps.children, a), t.child;
      case 29:
        throw t.pendingProps;
    }
    throw Error(o(156, t.tag));
  }
  function ma(e) {
    e.flags |= 4;
  }
  function Fc(e, t, a, i, n) {
    if ((t = (e.mode & 32) !== 0) && (t = !1), t) {
      if (e.flags |= 16777216, (n & 335544128) === n) if (e.stateNode.complete) e.flags |= 8192;
      else if (tp()) e.flags |= 8192;
      else throw rl = An, mc;
    } else e.flags &= -16777217;
  }
  function ku(e, t) {
    if (t.type !== "stylesheet" || (t.state.loading & 4) !== 0) e.flags &= -16777217;
    else if (e.flags |= 16777216, !Qp(t)) if (tp()) e.flags |= 8192;
    else throw rl = An, mc;
  }
  function Kn(e, t) {
    t !== null && (e.flags |= 4), e.flags & 16384 && (t = e.tag !== 22 ? dd() : 536870912, e.lanes |= t, Kl |= t);
  }
  function Ui(e, t) {
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
  function Ke(e) {
    var t = e.alternate !== null && e.alternate.child === e.child, a = 0, i = 0;
    if (t) for (var n = e.child; n !== null; ) a |= n.lanes | n.childLanes, i |= n.subtreeFlags & 65011712, i |= n.flags & 65011712, n.return = e, n = n.sibling;
    else for (n = e.child; n !== null; ) a |= n.lanes | n.childLanes, i |= n.subtreeFlags, i |= n.flags, n.return = e, n = n.sibling;
    return e.subtreeFlags |= i, e.childLanes = a, t;
  }
  function D0(e, t, a) {
    var i = t.pendingProps;
    switch (sc(t), t.tag) {
      case 16:
      case 15:
      case 0:
      case 11:
      case 7:
      case 8:
      case 12:
      case 9:
      case 14:
        return Ke(t), null;
      case 1:
        return Ke(t), null;
      case 3:
        return a = t.stateNode, i = null, e !== null && (i = e.memoizedState.cache), t.memoizedState.cache !== i && (t.flags |= 2048), ua(lt), b(), a.pendingContext && (a.context = a.pendingContext, a.pendingContext = null), (e === null || e.child === null) && (Dl(t) ? ma(t) : e === null || e.memoizedState.isDehydrated && (t.flags & 256) === 0 || (t.flags |= 1024, rc())), Ke(t), null;
      case 26:
        var n = t.type, s = t.memoizedState;
        return e === null ? (ma(t), s !== null ? (Ke(t), ku(t, s)) : (Ke(t), Fc(t, n, null, i, a))) : s ? s !== e.memoizedState ? (ma(t), Ke(t), ku(t, s)) : (Ke(t), t.flags &= -16777217) : (e = e.memoizedProps, e !== i && ma(t), Ke(t), Fc(t, n, e, i, a)), null;
      case 27:
        if (se(t), a = F.current, n = t.type, e !== null && t.stateNode != null) e.memoizedProps !== i && ma(t);
        else {
          if (!i) {
            if (t.stateNode === null) throw Error(o(166));
            return Ke(t), null;
          }
          e = ae.current, Dl(t) ? uo(t, e) : (e = qp(n, i, a), t.stateNode = e, ma(t));
        }
        return Ke(t), null;
      case 5:
        if (se(t), n = t.type, e !== null && t.stateNode != null) e.memoizedProps !== i && ma(t);
        else {
          if (!i) {
            if (t.stateNode === null) throw Error(o(166));
            return Ke(t), null;
          }
          if (s = ae.current, Dl(t)) uo(t, s);
          else {
            var c = rs(F.current);
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
            s[ft] = t, s[yt] = i;
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
        return Ke(t), Fc(t, t.type, e === null ? null : e.memoizedProps, t.pendingProps, a), null;
      case 6:
        if (e && t.stateNode != null) e.memoizedProps !== i && ma(t);
        else {
          if (typeof i != "string" && t.stateNode === null) throw Error(o(166));
          if (e = F.current, Dl(t)) {
            if (e = t.stateNode, a = t.memoizedProps, i = null, n = ht, n !== null) switch (n.tag) {
              case 27:
              case 5:
                i = n.memoizedProps;
            }
            e[ft] = t, e = !!(e.nodeValue === a || i !== null && i.suppressHydrationWarning === !0 || _p(e.nodeValue, a)), e || ka(t, !0);
          } else e = rs(e).createTextNode(i), e[ft] = t, t.stateNode = e;
        }
        return Ke(t), null;
      case 31:
        if (a = t.memoizedState, e === null || e.memoizedState !== null) {
          if (i = Dl(t), a !== null) {
            if (e === null) {
              if (!i) throw Error(o(318));
              if (e = t.memoizedState, e = e !== null ? e.dehydrated : null, !e) throw Error(o(557));
              e[ft] = t;
            } else ll(), (t.flags & 128) === 0 && (t.memoizedState = null), t.flags |= 4;
            Ke(t), e = !1;
          } else a = rc(), e !== null && e.memoizedState !== null && (e.memoizedState.hydrationErrors = a), e = !0;
          if (!e)
            return t.flags & 256 ? (Ct(t), t) : (Ct(t), null);
          if ((t.flags & 128) !== 0) throw Error(o(558));
        }
        return Ke(t), null;
      case 13:
        if (i = t.memoizedState, e === null || e.memoizedState !== null && e.memoizedState.dehydrated !== null) {
          if (n = Dl(t), i !== null && i.dehydrated !== null) {
            if (e === null) {
              if (!n) throw Error(o(318));
              if (n = t.memoizedState, n = n !== null ? n.dehydrated : null, !n) throw Error(o(317));
              n[ft] = t;
            } else ll(), (t.flags & 128) === 0 && (t.memoizedState = null), t.flags |= 4;
            Ke(t), n = !1;
          } else n = rc(), e !== null && e.memoizedState !== null && (e.memoizedState.hydrationErrors = n), n = !0;
          if (!n)
            return t.flags & 256 ? (Ct(t), t) : (Ct(t), null);
        }
        return Ct(t), (t.flags & 128) !== 0 ? (t.lanes = a, t) : (a = i !== null, e = e !== null && e.memoizedState !== null, a && (i = t.child, n = null, i.alternate !== null && i.alternate.memoizedState !== null && i.alternate.memoizedState.cachePool !== null && (n = i.alternate.memoizedState.cachePool.pool), s = null, i.memoizedState !== null && i.memoizedState.cachePool !== null && (s = i.memoizedState.cachePool.pool), s !== n && (i.flags |= 2048)), a !== e && a && (t.child.flags |= 8192), Kn(t, t.updateQueue), Ke(t), null);
      case 4:
        return b(), e === null && Sp(t.stateNode.containerInfo), Ke(t), null;
      case 10:
        return ua(t.type), Ke(t), null;
      case 19:
        if (R(Pe), i = t.memoizedState, i === null) return Ke(t), null;
        if (n = (t.flags & 128) !== 0, s = i.rendering, s === null) if (n) Ui(i, !1);
        else {
          if ($e !== 0 || e !== null && (e.flags & 128) !== 0) for (e = t.child; e !== null; ) {
            if (s = Dn(e), s !== null) {
              for (t.flags |= 128, Ui(i, !1), e = s.updateQueue, t.updateQueue = e, Kn(t, e), t.subtreeFlags = 0, e = a, a = t.child; a !== null; ) no(a, e), a = a.sibling;
              return J(Pe, Pe.current & 1 | 2), Ce && da(t, i.treeForkCount), t.child;
            }
            e = e.sibling;
          }
          i.tail !== null && We() > Fn && (t.flags |= 128, n = !0, Ui(i, !1), t.lanes = 4194304);
        }
        else {
          if (!n) if (e = Dn(s), e !== null) {
            if (t.flags |= 128, n = !0, e = e.updateQueue, t.updateQueue = e, Kn(t, e), Ui(i, !0), i.tail === null && i.tailMode === "hidden" && !s.alternate && !Ce) return Ke(t), null;
          } else 2 * We() - i.renderingStartTime > Fn && a !== 536870912 && (t.flags |= 128, n = !0, Ui(i, !1), t.lanes = 4194304);
          i.isBackwards ? (s.sibling = t.child, t.child = s) : (e = i.last, e !== null ? e.sibling = s : t.child = s, i.last = s);
        }
        return i.tail !== null ? (e = i.tail, i.rendering = e, i.tail = e.sibling, i.renderingStartTime = We(), e.sibling = null, a = Pe.current, J(Pe, n ? a & 1 | 2 : a & 1), Ce && da(t, i.treeForkCount), e) : (Ke(t), null);
      case 22:
      case 23:
        return Ct(t), yc(), i = t.memoizedState !== null, e !== null ? e.memoizedState !== null !== i && (t.flags |= 8192) : i && (t.flags |= 8192), i ? (a & 536870912) !== 0 && (t.flags & 128) === 0 && (Ke(t), t.subtreeFlags & 6 && (t.flags |= 8192)) : Ke(t), a = t.updateQueue, a !== null && Kn(t, a.retryQueue), a = null, e !== null && e.memoizedState !== null && e.memoizedState.cachePool !== null && (a = e.memoizedState.cachePool.pool), i = null, t.memoizedState !== null && t.memoizedState.cachePool !== null && (i = t.memoizedState.cachePool.pool), i !== a && (t.flags |= 2048), e !== null && R(sl), null;
      case 24:
        return a = null, e !== null && (a = e.memoizedState.cache), t.memoizedState.cache !== a && (t.flags |= 2048), ua(lt), Ke(t), null;
      case 25:
        return null;
      case 30:
        return null;
    }
    throw Error(o(156, t.tag));
  }
  function U0(e, t) {
    switch (sc(t), t.tag) {
      case 1:
        return e = t.flags, e & 65536 ? (t.flags = e & -65537 | 128, t) : null;
      case 3:
        return ua(lt), b(), e = t.flags, (e & 65536) !== 0 && (e & 128) === 0 ? (t.flags = e & -65537 | 128, t) : null;
      case 26:
      case 27:
      case 5:
        return se(t), null;
      case 31:
        if (t.memoizedState !== null) {
          if (Ct(t), t.alternate === null) throw Error(o(340));
          ll();
        }
        return e = t.flags, e & 65536 ? (t.flags = e & -65537 | 128, t) : null;
      case 13:
        if (Ct(t), e = t.memoizedState, e !== null && e.dehydrated !== null) {
          if (t.alternate === null) throw Error(o(340));
          ll();
        }
        return e = t.flags, e & 65536 ? (t.flags = e & -65537 | 128, t) : null;
      case 19:
        return R(Pe), null;
      case 4:
        return b(), null;
      case 10:
        return ua(t.type), null;
      case 22:
      case 23:
        return Ct(t), yc(), e !== null && R(sl), e = t.flags, e & 65536 ? (t.flags = e & -65537 | 128, t) : null;
      case 24:
        return ua(lt), null;
      case 25:
        return null;
      default:
        return null;
    }
  }
  function Au(e, t) {
    switch (sc(t), t.tag) {
      case 3:
        ua(lt), b();
        break;
      case 26:
      case 27:
      case 5:
        se(t);
        break;
      case 4:
        b();
        break;
      case 31:
        t.memoizedState !== null && Ct(t);
        break;
      case 13:
        Ct(t);
        break;
      case 19:
        R(Pe);
        break;
      case 10:
        ua(t.type);
        break;
      case 22:
      case 23:
        Ct(t), yc(), e !== null && R(sl);
        break;
      case 24:
        ua(lt);
    }
  }
  function Ri(e, t) {
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
              var f = a, w = d;
              try {
                w();
              } catch (D) {
                Be(n, f, D);
              }
            }
          }
          i = i.next;
        } while (i !== s);
      }
    } catch (D) {
      Be(t, t.return, D);
    }
  }
  function Cu(e) {
    var t = e.updateQueue;
    if (t !== null) {
      var a = e.stateNode;
      try {
        No(t, a);
      } catch (i) {
        Be(e, e.return, i);
      }
    }
  }
  function Ou(e, t, a) {
    a.props = fl(e.type, e.memoizedProps), a.state = e.memoizedState;
    try {
      a.componentWillUnmount();
    } catch (i) {
      Be(e, t, i);
    }
  }
  function qi(e, t) {
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
  function Mu(e) {
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
  function Pc(e, t, a) {
    try {
      var i = e.stateNode;
      th(i, e.type, a, t), i[yt] = t;
    } catch (n) {
      Be(e, e.return, n);
    }
  }
  function Du(e) {
    return e.tag === 5 || e.tag === 3 || e.tag === 26 || e.tag === 27 && Ga(e.type) || e.tag === 4;
  }
  function er(e) {
    e: for (; ; ) {
      for (; e.sibling === null; ) {
        if (e.return === null || Du(e.return)) return null;
        e = e.return;
      }
      for (e.sibling.return = e.return, e = e.sibling; e.tag !== 5 && e.tag !== 6 && e.tag !== 18; ) {
        if (e.tag === 27 && Ga(e.type) || e.flags & 2 || e.child === null || e.tag === 4) continue e;
        e.child.return = e, e = e.child;
      }
      if (!(e.flags & 2)) return e.stateNode;
    }
  }
  function tr(e, t, a) {
    var i = e.tag;
    if (i === 5 || i === 6) e = e.stateNode, t ? (a.nodeType === 9 ? a.body : a.nodeName === "HTML" ? a.ownerDocument.body : a).insertBefore(e, t) : (t = a.nodeType === 9 ? a.body : a.nodeName === "HTML" ? a.ownerDocument.body : a, t.appendChild(e), a = a._reactRootContainer, a != null || t.onclick !== null || (t.onclick = sa));
    else if (i !== 4 && (i === 27 && Ga(e.type) && (a = e.stateNode, t = null), e = e.child, e !== null)) for (tr(e, t, a), e = e.sibling; e !== null; ) tr(e, t, a), e = e.sibling;
  }
  function Jn(e, t, a) {
    var i = e.tag;
    if (i === 5 || i === 6) e = e.stateNode, t ? a.insertBefore(e, t) : a.appendChild(e);
    else if (i !== 4 && (i === 27 && Ga(e.type) && (a = e.stateNode), e = e.child, e !== null)) for (Jn(e, t, a), e = e.sibling; e !== null; ) Jn(e, t, a), e = e.sibling;
  }
  function Uu(e) {
    var t = e.stateNode, a = e.memoizedProps;
    try {
      for (var i = e.type, n = t.attributes; n.length; ) t.removeAttributeNode(n[0]);
      gt(t, i, a), t[ft] = e, t[yt] = a;
    } catch (s) {
      Be(e, e.return, s);
    }
  }
  var xa = !1, st = !1, ar = !1, Ru = typeof WeakSet == "function" ? WeakSet : Set, pt = null;
  function R0(e, t) {
    if (e = e.containerInfo, Sr = ms, e = $d(e), Is(e)) {
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
          var c = 0, d = -1, f = -1, w = 0, D = 0, L = e, _ = null;
          t: for (; ; ) {
            for (var O; L !== a || n !== 0 && L.nodeType !== 3 || (d = c + n), L !== s || i !== 0 && L.nodeType !== 3 || (f = c + i), L.nodeType === 3 && (c += L.nodeValue.length), (O = L.firstChild) !== null; )
              _ = L, L = O;
            for (; ; ) {
              if (L === e) break t;
              if (_ === a && ++w === n && (d = c), _ === s && ++D === i && (f = c), (O = L.nextSibling) !== null) break;
              L = _, _ = L.parentNode;
            }
            L = O;
          }
          a = d === -1 || f === -1 ? null : {
            start: d,
            end: f
          };
        } else a = null;
      }
      a = a || {
        start: 0,
        end: 0
      };
    } else a = null;
    for (zr = {
      focusedElem: e,
      selectionRange: a
    }, ms = !1, pt = t; pt !== null; ) if (t = pt, e = t.child, (t.subtreeFlags & 1028) !== 0 && e !== null) e.return = t, pt = e;
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
              var ie = fl(a.type, n);
              e = i.getSnapshotBeforeUpdate(ie, s), i.__reactInternalSnapshotBeforeUpdate = e;
            } catch (ve) {
              Be(a, a.return, ve);
            }
          }
          break;
        case 3:
          if ((e & 1024) !== 0) {
            if (e = t.stateNode.containerInfo, a = e.nodeType, a === 9) _r(e);
            else if (a === 1) switch (e.nodeName) {
              case "HEAD":
              case "HTML":
              case "BODY":
                _r(e);
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
        e.return = t.return, pt = e;
        break;
      }
      pt = t.return;
    }
  }
  function qu(e, t, a) {
    var i = a.flags;
    switch (a.tag) {
      case 0:
      case 11:
      case 15:
        ba(e, a), i & 4 && Ri(5, a);
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
        i & 64 && Cu(a), i & 512 && qi(a, a.return);
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
            No(e, t);
          } catch (c) {
            Be(a, a.return, c);
          }
        }
        break;
      case 27:
        t === null && i & 4 && Uu(a);
      case 26:
      case 5:
        ba(e, a), t === null && i & 4 && Mu(a), i & 512 && qi(a, a.return);
        break;
      case 12:
        ba(e, a);
        break;
      case 31:
        ba(e, a), i & 4 && Bu(e, a);
        break;
      case 13:
        ba(e, a), i & 4 && Gu(e, a), i & 64 && (e = a.memoizedState, e !== null && (e = e.dehydrated, e !== null && (a = Q0.bind(null, a), dh(e, a))));
        break;
      case 22:
        if (i = a.memoizedState !== null || xa, !i) {
          t = t !== null && t.memoizedState !== null || st, n = xa;
          var s = st;
          xa = i, (st = t) && !s ? va(e, a, (a.subtreeFlags & 8772) !== 0) : ba(e, a), xa = n, st = s;
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
    t !== null && (e.alternate = null, Hu(t)), e.child = null, e.deletions = null, e.sibling = null, e.tag === 5 && (t = e.stateNode, t !== null && Os(t)), e.stateNode = null, e.return = null, e.dependencies = null, e.memoizedProps = null, e.memoizedState = null, e.pendingProps = null, e.stateNode = null, e.updateQueue = null;
  }
  var Je = null, zt = !1;
  function ga(e, t, a) {
    for (a = a.child; a !== null; ) Lu(e, t, a), a = a.sibling;
  }
  function Lu(e, t, a) {
    if (Xe && typeof Xe.onCommitFiberUnmount == "function") try {
      Xe.onCommitFiberUnmount(Fe, a);
    } catch {
    }
    switch (a.tag) {
      case 26:
        st || la(a, t), ga(e, t, a), a.memoizedState ? a.memoizedState.count-- : a.stateNode && (a = a.stateNode, a.parentNode.removeChild(a));
        break;
      case 27:
        st || la(a, t);
        var i = Je, n = zt;
        Ga(a.type) && (Je = a.stateNode, zt = !1), ga(e, t, a), Zi(a.stateNode), Je = i, zt = n;
        break;
      case 5:
        st || la(a, t);
      case 6:
        if (i = Je, n = zt, Je = null, ga(e, t, a), Je = i, zt = n, Je !== null) if (zt) try {
          (Je.nodeType === 9 ? Je.body : Je.nodeName === "HTML" ? Je.ownerDocument.body : Je).removeChild(a.stateNode);
        } catch (s) {
          Be(a, t, s);
        }
        else try {
          Je.removeChild(a.stateNode);
        } catch (s) {
          Be(a, t, s);
        }
        break;
      case 18:
        Je !== null && (zt ? (e = Je, Op(e.nodeType === 9 ? e.body : e.nodeName === "HTML" ? e.ownerDocument.body : e, a.stateNode), ti(e)) : Op(Je, a.stateNode));
        break;
      case 4:
        i = Je, n = zt, Je = a.stateNode.containerInfo, zt = !0, ga(e, t, a), Je = i, zt = n;
        break;
      case 0:
      case 11:
      case 14:
      case 15:
        Da(2, a, t), st || Da(4, a, t), ga(e, t, a);
        break;
      case 1:
        st || (la(a, t), i = a.stateNode, typeof i.componentWillUnmount == "function" && Ou(a, t, i)), ga(e, t, a);
        break;
      case 21:
        ga(e, t, a);
        break;
      case 22:
        st = (i = st) || a.memoizedState !== null, ga(e, t, a), st = i;
        break;
      default:
        ga(e, t, a);
    }
  }
  function Bu(e, t) {
    if (t.memoizedState === null && (e = t.alternate, e !== null && (e = e.memoizedState, e !== null))) {
      e = e.dehydrated;
      try {
        ti(e);
      } catch (a) {
        Be(t, t.return, a);
      }
    }
  }
  function Gu(e, t) {
    if (t.memoizedState === null && (e = t.alternate, e !== null && (e = e.memoizedState, e !== null && (e = e.dehydrated, e !== null)))) try {
      ti(e);
    } catch (a) {
      Be(t, t.return, a);
    }
  }
  function q0(e) {
    switch (e.tag) {
      case 31:
      case 13:
      case 19:
        var t = e.stateNode;
        return t === null && (t = e.stateNode = new Ru()), t;
      case 22:
        return e = e.stateNode, t = e._retryCache, t === null && (t = e._retryCache = new Ru()), t;
      default:
        throw Error(o(435, e.tag));
    }
  }
  function In(e, t) {
    var a = q0(e);
    t.forEach(function(i) {
      if (!a.has(i)) {
        a.add(i);
        var n = Z0.bind(null, e, i);
        i.then(n, n);
      }
    });
  }
  function Nt(e, t) {
    var a = t.deletions;
    if (a !== null) for (var i = 0; i < a.length; i++) {
      var n = a[i], s = e, c = t, d = c;
      e: for (; d !== null; ) {
        switch (d.tag) {
          case 27:
            if (Ga(d.type)) {
              Je = d.stateNode, zt = !1;
              break e;
            }
            break;
          case 5:
            Je = d.stateNode, zt = !1;
            break e;
          case 3:
          case 4:
            Je = d.stateNode.containerInfo, zt = !0;
            break e;
        }
        d = d.return;
      }
      if (Je === null) throw Error(o(160));
      Lu(s, c, n), Je = null, zt = !1, s = n.alternate, s !== null && (s.return = null), n.return = null;
    }
    if (t.subtreeFlags & 13886) for (t = t.child; t !== null; ) Yu(t, e), t = t.sibling;
  }
  var $t = null;
  function Yu(e, t) {
    var a = e.alternate, i = e.flags;
    switch (e.tag) {
      case 0:
      case 11:
      case 14:
      case 15:
        Nt(t, e), wt(e), i & 4 && (Da(3, e, e.return), Ri(3, e), Da(5, e, e.return));
        break;
      case 1:
        Nt(t, e), wt(e), i & 512 && (st || a === null || la(a, a.return)), i & 64 && xa && (e = e.updateQueue, e !== null && (i = e.callbacks, i !== null && (a = e.shared.hiddenCallbacks, e.shared.hiddenCallbacks = a === null ? i : a.concat(i))));
        break;
      case 26:
        var n = $t;
        if (Nt(t, e), wt(e), i & 512 && (st || a === null || la(a, a.return)), i & 4) {
          var s = a !== null ? a.memoizedState : null;
          if (i = e.memoizedState, a === null) if (i === null) if (e.stateNode === null) {
            e: {
              i = e.type, a = e.memoizedProps, n = n.ownerDocument || n;
              t: switch (i) {
                case "title":
                  s = n.getElementsByTagName("title")[0], (!s || s[oi] || s[ft] || s.namespaceURI === "http://www.w3.org/2000/svg" || s.hasAttribute("itemprop")) && (s = n.createElement(i), n.head.insertBefore(s, n.querySelector("head > title"))), gt(s, i, a), s[ft] = e, ut(s), i = s;
                  break e;
                case "link":
                  var c = Vp("link", "href", n).get(i + (a.href || ""));
                  if (c) {
                    for (var d = 0; d < c.length; d++) if (s = c[d], s.getAttribute("href") === (a.href == null || a.href === "" ? null : a.href) && s.getAttribute("rel") === (a.rel == null ? null : a.rel) && s.getAttribute("title") === (a.title == null ? null : a.title) && s.getAttribute("crossorigin") === (a.crossOrigin == null ? null : a.crossOrigin)) {
                      c.splice(d, 1);
                      break t;
                    }
                  }
                  s = n.createElement(i), gt(s, i, a), n.head.appendChild(s);
                  break;
                case "meta":
                  if (c = Vp("meta", "content", n).get(i + (a.content || ""))) {
                    for (d = 0; d < c.length; d++) if (s = c[d], s.getAttribute("content") === (a.content == null ? null : "" + a.content) && s.getAttribute("name") === (a.name == null ? null : a.name) && s.getAttribute("property") === (a.property == null ? null : a.property) && s.getAttribute("http-equiv") === (a.httpEquiv == null ? null : a.httpEquiv) && s.getAttribute("charset") === (a.charSet == null ? null : a.charSet)) {
                      c.splice(d, 1);
                      break t;
                    }
                  }
                  s = n.createElement(i), gt(s, i, a), n.head.appendChild(s);
                  break;
                default:
                  throw Error(o(468, i));
              }
              s[ft] = e, ut(s), i = s;
            }
            e.stateNode = i;
          } else Xp(n, e.type, e.stateNode);
          else e.stateNode = Yp(n, i, e.memoizedProps);
          else s !== i ? (s === null ? a.stateNode !== null && (a = a.stateNode, a.parentNode.removeChild(a)) : s.count--, i === null ? Xp(n, e.type, e.stateNode) : Yp(n, i, e.memoizedProps)) : i === null && e.stateNode !== null && Pc(e, e.memoizedProps, a.memoizedProps);
        }
        break;
      case 27:
        Nt(t, e), wt(e), i & 512 && (st || a === null || la(a, a.return)), a !== null && i & 4 && Pc(e, e.memoizedProps, a.memoizedProps);
        break;
      case 5:
        if (Nt(t, e), wt(e), i & 512 && (st || a === null || la(a, a.return)), e.flags & 32) {
          n = e.stateNode;
          try {
            Nl(n, "");
          } catch (ie) {
            Be(e, e.return, ie);
          }
        }
        i & 4 && e.stateNode != null && (n = e.memoizedProps, Pc(e, n, a !== null ? a.memoizedProps : n)), i & 1024 && (ar = !0);
        break;
      case 6:
        if (Nt(t, e), wt(e), i & 4) {
          if (e.stateNode === null) throw Error(o(162));
          i = e.memoizedProps, a = e.stateNode;
          try {
            a.nodeValue = i;
          } catch (ie) {
            Be(e, e.return, ie);
          }
        }
        break;
      case 3:
        if (us = null, n = $t, $t = ds(t.containerInfo), Nt(t, e), $t = n, wt(e), i & 4 && a !== null && a.memoizedState.isDehydrated) try {
          ti(t.containerInfo);
        } catch (ie) {
          Be(e, e.return, ie);
        }
        ar && (ar = !1, Vu(e));
        break;
      case 4:
        i = $t, $t = ds(e.stateNode.containerInfo), Nt(t, e), wt(e), $t = i;
        break;
      case 12:
        Nt(t, e), wt(e);
        break;
      case 31:
        Nt(t, e), wt(e), i & 4 && (i = e.updateQueue, i !== null && (e.updateQueue = null, In(e, i)));
        break;
      case 13:
        Nt(t, e), wt(e), e.child.flags & 8192 && e.memoizedState !== null != (a !== null && a.memoizedState !== null) && (Wn = We()), i & 4 && (i = e.updateQueue, i !== null && (e.updateQueue = null, In(e, i)));
        break;
      case 22:
        n = e.memoizedState !== null;
        var f = a !== null && a.memoizedState !== null, w = xa, D = st;
        if (xa = w || n, st = D || f, Nt(t, e), st = D, xa = w, wt(e), i & 8192) e: for (t = e.stateNode, t._visibility = n ? t._visibility & -2 : t._visibility | 1, n && (a === null || f || xa || st || hl(e)), a = null, t = e; ; ) {
          if (t.tag === 5 || t.tag === 26) {
            if (a === null) {
              f = a = t;
              try {
                if (s = f.stateNode, n) c = s.style, typeof c.setProperty == "function" ? c.setProperty("display", "none", "important") : c.display = "none";
                else {
                  d = f.stateNode;
                  var L = f.memoizedProps.style, _ = L != null && L.hasOwnProperty("display") ? L.display : null;
                  d.style.display = _ == null || typeof _ == "boolean" ? "" : ("" + _).trim();
                }
              } catch (ie) {
                Be(f, f.return, ie);
              }
            }
          } else if (t.tag === 6) {
            if (a === null) {
              f = t;
              try {
                f.stateNode.nodeValue = n ? "" : f.memoizedProps;
              } catch (ie) {
                Be(f, f.return, ie);
              }
            }
          } else if (t.tag === 18) {
            if (a === null) {
              f = t;
              try {
                var O = f.stateNode;
                n ? Mp(O, !0) : Mp(f.stateNode, !1);
              } catch (ie) {
                Be(f, f.return, ie);
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
        i & 4 && (i = e.updateQueue, i !== null && (a = i.retryQueue, a !== null && (i.retryQueue = null, In(e, a))));
        break;
      case 19:
        Nt(t, e), wt(e), i & 4 && (i = e.updateQueue, i !== null && (e.updateQueue = null, In(e, i)));
        break;
      case 30:
        break;
      case 21:
        break;
      default:
        Nt(t, e), wt(e);
    }
  }
  function wt(e) {
    var t = e.flags;
    if (t & 2) {
      try {
        for (var a, i = e.return; i !== null; ) {
          if (Du(i)) {
            a = i;
            break;
          }
          i = i.return;
        }
        if (a == null) throw Error(o(160));
        switch (a.tag) {
          case 27:
            var n = a.stateNode;
            Jn(e, er(e), n);
            break;
          case 5:
            var s = a.stateNode;
            a.flags & 32 && (Nl(s, ""), a.flags &= -33), Jn(e, er(e), s);
            break;
          case 3:
          case 4:
            var c = a.stateNode.containerInfo;
            tr(e, er(e), c);
            break;
          default:
            throw Error(o(161));
        }
      } catch (d) {
        Be(e, e.return, d);
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
  function ba(e, t) {
    if (t.subtreeFlags & 8772) for (t = t.child; t !== null; ) qu(e, t.alternate, t), t = t.sibling;
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
          typeof a.componentWillUnmount == "function" && Ou(t, t.return, a), hl(t);
          break;
        case 27:
          Zi(t.stateNode);
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
          va(n, s, a), Ri(4, s);
          break;
        case 1:
          if (va(n, s, a), i = s, n = i.stateNode, typeof n.componentDidMount == "function") try {
            n.componentDidMount();
          } catch (w) {
            Be(i, i.return, w);
          }
          if (i = s, n = i.updateQueue, n !== null) {
            var d = i.stateNode;
            try {
              var f = n.shared.hiddenCallbacks;
              if (f !== null) for (n.shared.hiddenCallbacks = null, n = 0; n < f.length; n++) zo(f[n], d);
            } catch (w) {
              Be(i, i.return, w);
            }
          }
          a && c & 64 && Cu(s), qi(s, s.return);
          break;
        case 27:
          Uu(s);
        case 26:
        case 5:
          va(n, s, a), a && i === null && c & 4 && Mu(s), qi(s, s.return);
          break;
        case 12:
          va(n, s, a);
          break;
        case 31:
          va(n, s, a), a && c & 4 && Bu(n, s);
          break;
        case 13:
          va(n, s, a), a && c & 4 && Gu(n, s);
          break;
        case 22:
          s.memoizedState === null && va(n, s, a), qi(s, s.return);
          break;
        case 30:
          break;
        default:
          va(n, s, a);
      }
      t = t.sibling;
    }
  }
  function lr(e, t) {
    var a = null;
    e !== null && e.memoizedState !== null && e.memoizedState.cachePool !== null && (a = e.memoizedState.cachePool.pool), e = null, t.memoizedState !== null && t.memoizedState.cachePool !== null && (e = t.memoizedState.cachePool.pool), e !== a && (e != null && e.refCount++, a != null && zi(a));
  }
  function ir(e, t) {
    e = null, t.alternate !== null && (e = t.alternate.memoizedState.cache), t = t.memoizedState.cache, t !== e && (t.refCount++, e != null && zi(e));
  }
  function Wt(e, t, a, i) {
    if (t.subtreeFlags & 10256) for (t = t.child; t !== null; ) Xu(e, t, a, i), t = t.sibling;
  }
  function Xu(e, t, a, i) {
    var n = t.flags;
    switch (t.tag) {
      case 0:
      case 11:
      case 15:
        Wt(e, t, a, i), n & 2048 && Ri(9, t);
        break;
      case 1:
        Wt(e, t, a, i);
        break;
      case 3:
        Wt(e, t, a, i), n & 2048 && (e = null, t.alternate !== null && (e = t.alternate.memoizedState.cache), t = t.memoizedState.cache, t !== e && (t.refCount++, e != null && zi(e)));
        break;
      case 12:
        if (n & 2048) {
          Wt(e, t, a, i), e = t.stateNode;
          try {
            var s = t.memoizedProps, c = s.id, d = s.onPostCommit;
            typeof d == "function" && d(c, t.alternate === null ? "mount" : "update", e.passiveEffectDuration, -0);
          } catch (f) {
            Be(t, t.return, f);
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
        s = t.stateNode, c = t.alternate, t.memoizedState !== null ? s._visibility & 2 ? Wt(e, t, a, i) : Hi(e, t) : s._visibility & 2 ? Wt(e, t, a, i) : (s._visibility |= 2, Xl(e, t, a, i, (t.subtreeFlags & 10256) !== 0 || !1)), n & 2048 && lr(c, t);
        break;
      case 24:
        Wt(e, t, a, i), n & 2048 && ir(t.alternate, t);
        break;
      default:
        Wt(e, t, a, i);
    }
  }
  function Xl(e, t, a, i, n) {
    for (n = n && ((t.subtreeFlags & 10256) !== 0 || !1), t = t.child; t !== null; ) {
      var s = e, c = t, d = a, f = i, w = c.flags;
      switch (c.tag) {
        case 0:
        case 11:
        case 15:
          Xl(s, c, d, f, n), Ri(8, c);
          break;
        case 23:
          break;
        case 22:
          var D = c.stateNode;
          c.memoizedState !== null ? D._visibility & 2 ? Xl(s, c, d, f, n) : Hi(s, c) : (D._visibility |= 2, Xl(s, c, d, f, n)), n && w & 2048 && lr(c.alternate, c);
          break;
        case 24:
          Xl(s, c, d, f, n), n && w & 2048 && ir(c.alternate, c);
          break;
        default:
          Xl(s, c, d, f, n);
      }
      t = t.sibling;
    }
  }
  function Hi(e, t) {
    if (t.subtreeFlags & 10256) for (t = t.child; t !== null; ) {
      var a = e, i = t, n = i.flags;
      switch (i.tag) {
        case 22:
          Hi(a, i), n & 2048 && lr(i.alternate, i);
          break;
        case 24:
          Hi(a, i), n & 2048 && ir(i.alternate, i);
          break;
        default:
          Hi(a, i);
      }
      t = t.sibling;
    }
  }
  var Li = 8192;
  function Ql(e, t, a) {
    if (e.subtreeFlags & Li) for (e = e.child; e !== null; ) Qu(e, t, a), e = e.sibling;
  }
  function Qu(e, t, a) {
    switch (e.tag) {
      case 26:
        Ql(e, t, a), e.flags & Li && e.memoizedState !== null && yh(a, $t, e.memoizedState, e.memoizedProps);
        break;
      case 5:
        Ql(e, t, a);
        break;
      case 3:
      case 4:
        var i = $t;
        $t = ds(e.stateNode.containerInfo), Ql(e, t, a), $t = i;
        break;
      case 22:
        e.memoizedState === null && (i = e.alternate, i !== null && i.memoizedState !== null ? (i = Li, Li = 16777216, Ql(e, t, a), Li = i) : Ql(e, t, a));
        break;
      default:
        Ql(e, t, a);
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
  function Bi(e) {
    var t = e.deletions;
    if ((e.flags & 16) !== 0) {
      if (t !== null) for (var a = 0; a < t.length; a++) {
        var i = t[a];
        pt = i, Ju(i, e);
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
        Bi(e), e.flags & 2048 && Da(9, e, e.return);
        break;
      case 3:
        Bi(e);
        break;
      case 12:
        Bi(e);
        break;
      case 22:
        var t = e.stateNode;
        e.memoizedState !== null && t._visibility & 2 && (e.return === null || e.return.tag !== 13) ? (t._visibility &= -3, $n(e)) : Bi(e);
        break;
      default:
        Bi(e);
    }
  }
  function $n(e) {
    var t = e.deletions;
    if ((e.flags & 16) !== 0) {
      if (t !== null) for (var a = 0; a < t.length; a++) {
        var i = t[a];
        pt = i, Ju(i, e);
      }
      Zu(e);
    }
    for (e = e.child; e !== null; ) {
      switch (t = e, t.tag) {
        case 0:
        case 11:
        case 15:
          Da(8, t, t.return), $n(t);
          break;
        case 22:
          a = t.stateNode, a._visibility & 2 && (a._visibility &= -3, $n(t));
          break;
        default:
          $n(t);
      }
      e = e.sibling;
    }
  }
  function Ju(e, t) {
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
          zi(a.memoizedState.cache);
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
  var H0 = {
    getCacheForType: function(e) {
      var t = mt(lt), a = t.data.get(e);
      return a === void 0 && (a = e(), t.data.set(e, a)), a;
    },
    cacheSignal: function() {
      return mt(lt).controller.signal;
    }
  }, L0 = typeof WeakMap == "function" ? WeakMap : Map, Re = 0, Qe = null, _e = null, Te = 0, Le = 0, Ot = null, Ua = !1, Zl = !1, nr = !1, ja = 0, $e = 0, Ra = 0, ml = 0, sr = 0, Mt = 0, Kl = 0, Gi = null, _t = null, cr = !1, Wn = 0, Iu = 0, Fn = 1 / 0, Pn = null, qa = null, dt = 0, Ha = null, Jl = null, ya = 0, rr = 0, dr = null, $u = null, Yi = 0, or = null;
  function Xt() {
    return (Re & 2) !== 0 && Te !== 0 ? Te & -Te : B.T !== null ? xr() : hd();
  }
  function Wu() {
    if (Mt === 0) if ((Te & 536870912) === 0 || Ce) {
      var e = sn;
      sn <<= 1, (sn & 3932160) === 0 && (sn = 262144), Mt = e;
    } else Mt = 536870912;
    return e = At.current, e !== null && (e.flags |= 32), Mt;
  }
  function Et(e, t, a) {
    (e === Qe && (Le === 2 || Le === 9) || e.cancelPendingCommit !== null) && (Il(e, 0), La(e, Te, Mt, !1)), dn(e, a), ((Re & 2) === 0 || e !== Qe) && (e === Qe && ((Re & 2) === 0 && (ml |= a), $e === 4 && La(e, Te, Mt, !1)), Sa(e));
  }
  function Fu(e, t, a) {
    if ((Re & 6) !== 0) throw Error(o(327));
    var i = !a && (t & 127) === 0 && (t & e.expiredLanes) === 0 || ri(e, t), n = i ? Y0(e, t) : pr(e, t, !0), s = i;
    do {
      if (n === 0) {
        Zl && !i && La(e, t, 0, !1);
        break;
      } else {
        if (a = e.current.alternate, s && !B0(a)) {
          n = pr(e, t, !1), s = !1;
          continue;
        }
        if (n === 2) {
          if (s = t, e.errorRecoveryDisabledLanes & s) var c = 0;
          else c = e.pendingLanes & -536870913, c = c !== 0 ? c : c & 536870912 ? 536870912 : 0;
          if (c !== 0) {
            t = c;
            e: {
              var d = e;
              n = Gi;
              var f = d.current.memoizedState.isDehydrated;
              if (f && (Il(d, c).flags |= 256), c = pr(d, c, !1), c !== 2) {
                if (nr && !f) {
                  d.errorRecoveryDisabledLanes |= s, ml |= s, n = 4;
                  break e;
                }
                s = _t, _t = n, s !== null && (_t === null ? _t = s : _t.push.apply(_t, s));
              }
              n = c;
            }
            if (s = !1, n !== 2) continue;
          }
        }
        if (n === 1) {
          Il(e, 0), La(e, t, 0, !0);
          break;
        }
        e: {
          switch (i = e, s = n, s) {
            case 0:
            case 1:
              throw Error(o(345));
            case 4:
              if ((t & 4194048) !== t) break;
            case 6:
              La(i, t, Mt, !Ua);
              break e;
            case 2:
              _t = null;
              break;
            case 3:
            case 5:
              break;
            default:
              throw Error(o(329));
          }
          if ((t & 62914560) === t && (n = Wn + 300 - We(), 10 < n)) {
            if (La(i, t, Mt, !Ua), rn(i, 0, !0) !== 0) break e;
            ya = t, i.timeoutHandle = Ap(Pu.bind(null, i, a, _t, Pn, cr, t, Mt, ml, Kl, Ua, s, "Throttled", -0, 0), n);
            break e;
          }
          Pu(i, a, _t, Pn, cr, t, Mt, ml, Kl, Ua, s, null, -0, 0);
        }
      }
      break;
    } while (!0);
    Sa(e);
  }
  function Pu(e, t, a, i, n, s, c, d, f, w, D, L, _, O) {
    if (e.timeoutHandle = -1, L = t.subtreeFlags, L & 8192 || (L & 16785408) === 16785408) {
      L = {
        stylesheets: null,
        count: 0,
        imgCount: 0,
        imgBytes: 0,
        suspenseyImages: [],
        waitingForImages: !0,
        waitingForViewTransition: !1,
        unsuspend: sa
      }, Qu(t, s, L);
      var ie = (s & 62914560) === s ? Wn - We() : (s & 4194048) === s ? Iu - We() : 0;
      if (ie = Sh(L, ie), ie !== null) {
        ya = s, e.cancelPendingCommit = ie(cp.bind(null, e, t, s, a, i, n, c, d, f, D, L, null, _, O)), La(e, s, c, !w);
        return;
      }
    }
    cp(e, t, s, a, i, n, c, d, f);
  }
  function B0(e) {
    for (var t = e; ; ) {
      var a = t.tag;
      if ((a === 0 || a === 11 || a === 15) && t.flags & 16384 && (a = t.updateQueue, a !== null && (a = a.stores, a !== null))) for (var i = 0; i < a.length; i++) {
        var n = a[i], s = n.getSnapshot;
        n = n.value;
        try {
          if (!Tt(s(), n)) return !1;
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
  function La(e, t, a, i) {
    t &= ~sr, t &= ~ml, e.suspendedLanes |= t, e.pingedLanes &= ~t, i && (e.warmLanes |= t), i = e.expirationTimes;
    for (var n = t; 0 < n; ) {
      var s = 31 - rt(n), c = 1 << s;
      i[s] = -1, n &= ~c;
    }
    a !== 0 && od(e, a, t);
  }
  function es() {
    return (Re & 6) === 0 ? (Vi(0, !1), !1) : !0;
  }
  function ur() {
    if (_e !== null) {
      if (Le === 0) var e = _e.return;
      else e = _e, oa = il = null, Ec(e), Ll = null, wi = 0, e = _e;
      for (; e !== null; ) Au(e.alternate, e), e = e.return;
      _e = null;
    }
  }
  function Il(e, t) {
    var a = e.timeoutHandle;
    a !== -1 && (e.timeoutHandle = -1, ih(a)), a = e.cancelPendingCommit, a !== null && (e.cancelPendingCommit = null, a()), ya = 0, ur(), Qe = e, _e = a = ra(e.current, null), Te = t, Le = 0, Ot = null, Ua = !1, Zl = ri(e, t), nr = !1, Kl = Mt = sr = ml = Ra = $e = 0, _t = Gi = null, cr = !1, (t & 8) !== 0 && (t |= t & 32);
    var i = e.entangledLanes;
    if (i !== 0) for (e = e.entanglements, i &= t; 0 < i; ) {
      var n = 31 - rt(i), s = 1 << n;
      t |= e[n], i &= ~s;
    }
    return ja = t, yn(), a;
  }
  function ep(e, t) {
    Ne = null, B.H = Mi, t === Hl || t === kn ? (t = vo(), Le = 3) : t === mc ? (t = vo(), Le = 4) : Le = t === Vc ? 8 : t !== null && typeof t == "object" && typeof t.then == "function" ? 6 : 1, Ot = t, _e === null && ($e = 1, Vn(e, Lt(t, e.current)));
  }
  function tp() {
    var e = At.current;
    return e === null ? !0 : (Te & 4194048) === Te ? Vt === null : (Te & 62914560) === Te || (Te & 536870912) !== 0 ? e === Vt : !1;
  }
  function ap() {
    var e = B.H;
    return B.H = Mi, e === null ? Mi : e;
  }
  function lp() {
    var e = B.A;
    return B.A = H0, e;
  }
  function ts() {
    $e = 4, Ua || (Te & 4194048) !== Te && At.current !== null || (Zl = !0), (Ra & 134217727) === 0 && (ml & 134217727) === 0 || Qe === null || La(Qe, Te, Mt, !1);
  }
  function pr(e, t, a) {
    var i = Re;
    Re |= 2;
    var n = ap(), s = lp();
    (Qe !== e || Te !== t) && (Pn = null, Il(e, t)), t = !1;
    var c = $e;
    e: do
      try {
        if (Le !== 0 && _e !== null) {
          var d = _e, f = Ot;
          switch (Le) {
            case 8:
              ur(), c = 6;
              break e;
            case 3:
            case 2:
            case 9:
            case 6:
              At.current === null && (t = !0);
              var w = Le;
              if (Le = 0, Ot = null, $l(e, d, f, w), a && Zl) {
                c = 0;
                break e;
              }
              break;
            default:
              w = Le, Le = 0, Ot = null, $l(e, d, f, w);
          }
        }
        G0(), c = $e;
        break;
      } catch (D) {
        ep(e, D);
      }
    while (!0);
    return t && e.shellSuspendCounter++, oa = il = null, Re = i, B.H = n, B.A = s, _e === null && (Qe = null, Te = 0, yn()), c;
  }
  function G0() {
    for (; _e !== null; ) ip(_e);
  }
  function Y0(e, t) {
    var a = Re;
    Re |= 2;
    var i = ap(), n = lp();
    Qe !== e || Te !== t ? (Pn = null, Fn = We() + 500, Il(e, t)) : Zl = ri(e, t);
    e: do
      try {
        if (Le !== 0 && _e !== null) {
          t = _e;
          var s = Ot;
          t: switch (Le) {
            case 1:
              Le = 0, Ot = null, $l(e, t, s, 1);
              break;
            case 2:
            case 9:
              if (go(s)) {
                Le = 0, Ot = null, np(t);
                break;
              }
              t = function() {
                Le !== 2 && Le !== 9 || Qe !== e || (Le = 7), Sa(e);
              }, s.then(t, t);
              break e;
            case 3:
              Le = 7;
              break e;
            case 4:
              Le = 5;
              break e;
            case 7:
              go(s) ? (Le = 0, Ot = null, np(t)) : (Le = 0, Ot = null, $l(e, t, s, 7));
              break;
            case 5:
              var c = null;
              switch (_e.tag) {
                case 26:
                  c = _e.memoizedState;
                case 5:
                case 27:
                  var d = _e;
                  if (c ? Qp(c) : d.stateNode.complete) {
                    Le = 0, Ot = null;
                    var f = d.sibling;
                    if (f !== null) _e = f;
                    else {
                      var w = d.return;
                      w !== null ? (_e = w, as(w)) : _e = null;
                    }
                    break t;
                  }
              }
              Le = 0, Ot = null, $l(e, t, s, 5);
              break;
            case 6:
              Le = 0, Ot = null, $l(e, t, s, 6);
              break;
            case 8:
              ur(), $e = 6;
              break e;
            default:
              throw Error(o(462));
          }
        }
        V0();
        break;
      } catch (D) {
        ep(e, D);
      }
    while (!0);
    return oa = il = null, B.H = i, B.A = n, Re = a, _e !== null ? 0 : (Qe = null, Te = 0, yn(), $e);
  }
  function V0() {
    for (; _e !== null && !at(); ) ip(_e);
  }
  function ip(e) {
    var t = Tu(e.alternate, e, ja);
    e.memoizedProps = e.pendingProps, t === null ? as(e) : _e = t;
  }
  function np(e) {
    var t = e, a = t.alternate;
    switch (t.tag) {
      case 15:
      case 0:
        t = Su(a, t, t.pendingProps, t.type, void 0, Te);
        break;
      case 11:
        t = Su(a, t, t.pendingProps, t.type.render, t.ref, Te);
        break;
      case 5:
        Ec(t);
      default:
        Au(a, t), t = _e = no(t, ja), t = Tu(a, t, ja);
    }
    e.memoizedProps = e.pendingProps, t === null ? as(e) : _e = t;
  }
  function $l(e, t, a, i) {
    oa = il = null, Ec(t), Ll = null, wi = 0;
    var n = t.return;
    try {
      if (C0(e, n, t, a, Te)) {
        $e = 1, Vn(e, Lt(a, e.current)), _e = null;
        return;
      }
    } catch (s) {
      if (n !== null) throw _e = n, s;
      $e = 1, Vn(e, Lt(a, e.current)), _e = null;
      return;
    }
    t.flags & 32768 ? (Ce || i === 1 ? e = !0 : Zl || (Te & 536870912) !== 0 ? e = !1 : (Ua = e = !0, (i === 2 || i === 9 || i === 3 || i === 6) && (i = At.current, i !== null && i.tag === 13 && (i.flags |= 16384))), sp(t, e)) : as(t);
  }
  function as(e) {
    var t = e;
    do {
      if ((t.flags & 32768) !== 0) {
        sp(t, Ua);
        return;
      }
      e = t.return;
      var a = D0(t.alternate, t, ja);
      if (a !== null) {
        _e = a;
        return;
      }
      if (t = t.sibling, t !== null) {
        _e = t;
        return;
      }
      _e = t = e;
    } while (t !== null);
    $e === 0 && ($e = 5);
  }
  function sp(e, t) {
    do {
      var a = U0(e.alternate, e);
      if (a !== null) {
        a.flags &= 32767, _e = a;
        return;
      }
      if (a = e.return, a !== null && (a.flags |= 32768, a.subtreeFlags = 0, a.deletions = null), !t && (e = e.sibling, e !== null)) {
        _e = e;
        return;
      }
      _e = e = a;
    } while (e !== null);
    $e = 6, _e = null;
  }
  function cp(e, t, a, i, n, s, c, d, f) {
    e.cancelPendingCommit = null;
    do
      ls();
    while (dt !== 0);
    if ((Re & 6) !== 0) throw Error(o(327));
    if (t !== null) {
      if (t === e.current) throw Error(o(177));
      if (s = t.lanes | t.childLanes, s |= ec, Af(e, a, s, c, d, f), e === Qe && (_e = Qe = null, Te = 0), Jl = t, Ha = e, ya = a, rr = s, dr = n, $u = i, (t.subtreeFlags & 10256) !== 0 || (t.flags & 10256) !== 0 ? (e.callbackNode = null, e.callbackPriority = 0, K0(ea, function() {
        return pp(), null;
      })) : (e.callbackNode = null, e.callbackPriority = 0), i = (t.flags & 13878) !== 0, (t.subtreeFlags & 13878) !== 0 || i) {
        i = B.T, B.T = null, n = G.p, G.p = 2, c = Re, Re |= 4;
        try {
          R0(e, t, a);
        } finally {
          Re = c, G.p = n, B.T = i;
        }
      }
      dt = 1, rp(), dp(), op();
    }
  }
  function rp() {
    if (dt === 1) {
      dt = 0;
      var e = Ha, t = Jl, a = (t.flags & 13878) !== 0;
      if ((t.subtreeFlags & 13878) !== 0 || a) {
        a = B.T, B.T = null;
        var i = G.p;
        G.p = 2;
        var n = Re;
        Re |= 4;
        try {
          Yu(t, e);
          var s = zr, c = $d(e.containerInfo), d = s.focusedElem, f = s.selectionRange;
          if (c !== d && d && d.ownerDocument && Id(d.ownerDocument.documentElement, d)) {
            if (f !== null && Is(d)) {
              var w = f.start, D = f.end;
              if (D === void 0 && (D = w), "selectionStart" in d) d.selectionStart = w, d.selectionEnd = Math.min(D, d.value.length);
              else {
                var L = d.ownerDocument || document, _ = L && L.defaultView || window;
                if (_.getSelection) {
                  var O = _.getSelection(), ie = d.textContent.length, ve = Math.min(f.start, ie), Ve = f.end === void 0 ? ve : Math.min(f.end, ie);
                  !O.extend && ve > Ve && (c = Ve, Ve = ve, ve = c);
                  var y = Jd(d, ve), v = Jd(d, Ve);
                  if (y && v && (O.rangeCount !== 1 || O.anchorNode !== y.node || O.anchorOffset !== y.offset || O.focusNode !== v.node || O.focusOffset !== v.offset)) {
                    var N = L.createRange();
                    N.setStart(y.node, y.offset), O.removeAllRanges(), ve > Ve ? (O.addRange(N), O.extend(v.node, v.offset)) : (N.setEnd(v.node, v.offset), O.addRange(N));
                  }
                }
              }
            }
            for (L = [], O = d; O = O.parentNode; ) O.nodeType === 1 && L.push({
              element: O,
              left: O.scrollLeft,
              top: O.scrollTop
            });
            for (typeof d.focus == "function" && d.focus(), d = 0; d < L.length; d++) {
              var q = L[d];
              q.element.scrollLeft = q.left, q.element.scrollTop = q.top;
            }
          }
          ms = !!Sr, zr = Sr = null;
        } finally {
          Re = n, G.p = i, B.T = a;
        }
      }
      e.current = t, dt = 2;
    }
  }
  function dp() {
    if (dt === 2) {
      dt = 0;
      var e = Ha, t = Jl, a = (t.flags & 8772) !== 0;
      if ((t.subtreeFlags & 8772) !== 0 || a) {
        a = B.T, B.T = null;
        var i = G.p;
        G.p = 2;
        var n = Re;
        Re |= 4;
        try {
          qu(e, t.alternate, t);
        } finally {
          Re = n, G.p = i, B.T = a;
        }
      }
      dt = 3;
    }
  }
  function op() {
    if (dt === 4 || dt === 3) {
      dt = 0, Jt();
      var e = Ha, t = Jl, a = ya, i = $u;
      (t.subtreeFlags & 10256) !== 0 || (t.flags & 10256) !== 0 ? dt = 5 : (dt = 0, Jl = Ha = null, up(e, e.pendingLanes));
      var n = e.pendingLanes;
      if (n === 0 && (qa = null), As(a), t = t.stateNode, Xe && typeof Xe.onCommitFiberRoot == "function") try {
        Xe.onCommitFiberRoot(Fe, t, void 0, (t.current.flags & 128) === 128);
      } catch {
      }
      if (i !== null) {
        t = B.T, n = G.p, G.p = 2, B.T = null;
        try {
          for (var s = e.onRecoverableError, c = 0; c < i.length; c++) {
            var d = i[c];
            s(d.value, { componentStack: d.stack });
          }
        } finally {
          B.T = t, G.p = n;
        }
      }
      (ya & 3) !== 0 && ls(), Sa(e), n = e.pendingLanes, (a & 261930) !== 0 && (n & 42) !== 0 ? e === or ? Yi++ : (Yi = 0, or = e) : Yi = 0, Vi(0, !1);
    }
  }
  function up(e, t) {
    (e.pooledCacheLanes &= t) === 0 && (t = e.pooledCache, t != null && (e.pooledCache = null, zi(t)));
  }
  function ls() {
    return rp(), dp(), op(), pp();
  }
  function pp() {
    if (dt !== 5) return !1;
    var e = Ha, t = rr;
    rr = 0;
    var a = As(ya), i = B.T, n = G.p;
    try {
      G.p = 32 > a ? 32 : a, B.T = null, a = dr, dr = null;
      var s = Ha, c = ya;
      if (dt = 0, Jl = Ha = null, ya = 0, (Re & 6) !== 0) throw Error(o(331));
      var d = Re;
      if (Re |= 4, Ku(s.current), Xu(s, s.current, c, a), Re = d, Vi(0, !1), Xe && typeof Xe.onPostCommitFiberRoot == "function") try {
        Xe.onPostCommitFiberRoot(Fe, s);
      } catch {
      }
      return !0;
    } finally {
      G.p = n, B.T = i, up(e, t);
    }
  }
  function fp(e, t, a) {
    t = Lt(a, t), t = Yc(e.stateNode, t, 2), e = ul(e, t, 2), e !== null && (dn(e, 2), Sa(e));
  }
  function Be(e, t, a) {
    if (e.tag === 3) fp(e, e, a);
    else for (; t !== null; ) {
      if (t.tag === 3) {
        fp(t, e, a);
        break;
      } else if (t.tag === 1) {
        var i = t.stateNode;
        if (typeof t.type.getDerivedStateFromError == "function" || typeof i.componentDidCatch == "function" && (qa === null || !qa.has(i))) {
          e = Lt(a, e), a = hu(2), i = ul(t, a, 2), i !== null && (mu(a, i, t, e), dn(i, 2), Sa(i));
          break;
        }
      }
      t = t.return;
    }
  }
  function fr(e, t, a) {
    var i = e.pingCache;
    if (i === null) {
      i = e.pingCache = new L0();
      var n = /* @__PURE__ */ new Set();
      i.set(t, n);
    } else n = i.get(t), n === void 0 && (n = /* @__PURE__ */ new Set(), i.set(t, n));
    n.has(a) || (nr = !0, n.add(a), e = X0.bind(null, e, t, a), t.then(e, e));
  }
  function X0(e, t, a) {
    var i = e.pingCache;
    i !== null && i.delete(t), e.pingedLanes |= e.suspendedLanes & a, e.warmLanes &= ~a, Qe === e && (Te & a) === a && ($e === 4 || $e === 3 && (Te & 62914560) === Te && 300 > We() - Wn ? (Re & 2) === 0 && Il(e, 0) : sr |= a, Kl === Te && (Kl = 0)), Sa(e);
  }
  function hp(e, t) {
    t === 0 && (t = dd()), e = tl(e, t), e !== null && (dn(e, t), Sa(e));
  }
  function Q0(e) {
    var t = e.memoizedState, a = 0;
    t !== null && (a = t.retryLane), hp(e, a);
  }
  function Z0(e, t) {
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
        throw Error(o(314));
    }
    i !== null && i.delete(t), hp(e, a);
  }
  function K0(e, t) {
    return E(e, t);
  }
  var is = null, Wl = null, hr = !1, ns = !1, mr = !1, Ba = 0;
  function Sa(e) {
    e !== Wl && e.next === null && (Wl === null ? is = Wl = e : Wl = Wl.next = e), ns = !0, hr || (hr = !0, I0());
  }
  function Vi(e, t) {
    if (!mr && ns) {
      mr = !0;
      do
        for (var a = !1, i = is; i !== null; ) {
          if (!t) if (e !== 0) {
            var n = i.pendingLanes;
            if (n === 0) var s = 0;
            else {
              var c = i.suspendedLanes, d = i.pingedLanes;
              s = (1 << 31 - rt(42 | e) + 1) - 1, s &= n & ~(c & ~d), s = s & 201326741 ? s & 201326741 | 1 : s ? s | 2 : 0;
            }
            s !== 0 && (a = !0, bp(i, s));
          } else s = Te, s = rn(i, i === Qe ? s : 0, i.cancelPendingCommit !== null || i.timeoutHandle !== -1), (s & 3) === 0 || ri(i, s) || (a = !0, bp(i, s));
          i = i.next;
        }
      while (a);
      mr = !1;
    }
  }
  function J0() {
    mp();
  }
  function mp() {
    ns = hr = !1;
    var e = 0;
    Ba !== 0 && lh() && (e = Ba);
    for (var t = We(), a = null, i = is; i !== null; ) {
      var n = i.next, s = xp(i, t);
      s === 0 ? (i.next = null, a === null ? is = n : a.next = n, n === null && (Wl = a)) : (a = i, (e !== 0 || (s & 3) !== 0) && (ns = !0)), i = n;
    }
    dt !== 0 && dt !== 5 || Vi(e, !1), Ba !== 0 && (Ba = 0);
  }
  function xp(e, t) {
    for (var a = e.suspendedLanes, i = e.pingedLanes, n = e.expirationTimes, s = e.pendingLanes & -62914561; 0 < s; ) {
      var c = 31 - rt(s), d = 1 << c, f = n[c];
      f === -1 ? ((d & a) === 0 || (d & i) !== 0) && (n[c] = kf(d, t)) : f <= t && (e.expiredLanes |= d), s &= ~d;
    }
    if (t = Qe, a = Te, a = rn(e, e === t ? a : 0, e.cancelPendingCommit !== null || e.timeoutHandle !== -1), i = e.callbackNode, a === 0 || e === t && (Le === 2 || Le === 9) || e.cancelPendingCommit !== null) return i !== null && i !== null && ze(i), e.callbackNode = null, e.callbackPriority = 0;
    if ((a & 3) === 0 || ri(e, a)) {
      if (t = a & -a, t === e.callbackPriority) return t;
      switch (i !== null && ze(i), As(a)) {
        case 2:
        case 8:
          a = Ut;
          break;
        case 32:
          a = ea;
          break;
        case 268435456:
          a = u;
          break;
        default:
          a = ea;
      }
      return i = gp.bind(null, e), a = E(a, i), e.callbackPriority = t, e.callbackNode = a, t;
    }
    return i !== null && i !== null && ze(i), e.callbackPriority = 2, e.callbackNode = null, 2;
  }
  function gp(e, t) {
    if (dt !== 0 && dt !== 5) return e.callbackNode = null, e.callbackPriority = 0, null;
    var a = e.callbackNode;
    if (ls() && e.callbackNode !== a) return null;
    var i = Te;
    return i = rn(e, e === Qe ? i : 0, e.cancelPendingCommit !== null || e.timeoutHandle !== -1), i === 0 ? null : (Fu(e, i, t), xp(e, We()), e.callbackNode != null && e.callbackNode === a ? gp.bind(null, e) : null);
  }
  function bp(e, t) {
    if (ls()) return null;
    Fu(e, t, !0);
  }
  function I0() {
    nh(function() {
      (Re & 6) !== 0 ? E(bl, J0) : mp();
    });
  }
  function xr() {
    if (Ba === 0) {
      var e = Rl;
      e === 0 && (e = nn, nn <<= 1, (nn & 261888) === 0 && (nn = 256)), Ba = e;
    }
    return Ba;
  }
  function vp(e) {
    return e == null || typeof e == "symbol" || typeof e == "boolean" ? null : typeof e == "function" ? e : fn("" + e);
  }
  function jp(e, t) {
    var a = t.ownerDocument.createElement("input");
    return a.name = t.name, a.value = t.value, e.id && a.setAttribute("form", e.id), t.parentNode.insertBefore(a, t), e = new FormData(e), a.parentNode.removeChild(a), e;
  }
  function $0(e, t, a, i, n) {
    if (t === "submit" && a && a.stateNode === n) {
      var s = vp((n[yt] || null).action), c = i.submitter;
      c && (t = (t = c[yt] || null) ? vp(t.formAction) : c.getAttribute("formAction"), t !== null && (s = t, c = null));
      var d = new gn("action", "action", null, i, n);
      e.push({
        event: d,
        listeners: [{
          instance: null,
          listener: function() {
            if (i.defaultPrevented) {
              if (Ba !== 0) {
                var f = c ? jp(n, c) : new FormData(n);
                Rc(a, {
                  pending: !0,
                  data: f,
                  method: n.method,
                  action: s
                }, null, f);
              }
            } else typeof s == "function" && (d.preventDefault(), f = c ? jp(n, c) : new FormData(n), Rc(a, {
              pending: !0,
              data: f,
              method: n.method,
              action: s
            }, s, f));
          },
          currentTarget: n
        }]
      });
    }
  }
  for (var gr = 0; gr < Ps.length; gr++) {
    var br = Ps[gr];
    It(br.toLowerCase(), "on" + (br[0].toUpperCase() + br.slice(1)));
  }
  It(Pd, "onAnimationEnd"), It(eo, "onAnimationIteration"), It(to, "onAnimationStart"), It("dblclick", "onDoubleClick"), It("focusin", "onFocus"), It("focusout", "onBlur"), It(u0, "onTransitionRun"), It(p0, "onTransitionStart"), It(f0, "onTransitionCancel"), It(ao, "onTransitionEnd"), Sl("onMouseEnter", ["mouseout", "mouseover"]), Sl("onMouseLeave", ["mouseout", "mouseover"]), Sl("onPointerEnter", ["pointerout", "pointerover"]), Sl("onPointerLeave", ["pointerout", "pointerover"]), Wa("onChange", "change click focusin focusout input keydown keyup selectionchange".split(" ")), Wa("onSelect", "focusout contextmenu dragend focusin keydown keyup mousedown mouseup selectionchange".split(" ")), Wa("onBeforeInput", [
    "compositionend",
    "keypress",
    "textInput",
    "paste"
  ]), Wa("onCompositionEnd", "compositionend focusout keydown keypress keyup mousedown".split(" ")), Wa("onCompositionStart", "compositionstart focusout keydown keypress keyup mousedown".split(" ")), Wa("onCompositionUpdate", "compositionupdate focusout keydown keypress keyup mousedown".split(" "));
  var Xi = "abort canplay canplaythrough durationchange emptied encrypted ended error loadeddata loadedmetadata loadstart pause play playing progress ratechange resize seeked seeking stalled suspend timeupdate volumechange waiting".split(" "), W0 = new Set("beforetoggle cancel close invalid load scroll scrollend toggle".split(" ").concat(Xi));
  function yp(e, t) {
    t = (t & 4) !== 0;
    for (var a = 0; a < e.length; a++) {
      var i = e[a], n = i.event;
      i = i.listeners;
      e: {
        var s = void 0;
        if (t) for (var c = i.length - 1; 0 <= c; c--) {
          var d = i[c], f = d.instance, w = d.currentTarget;
          if (d = d.listener, f !== s && n.isPropagationStopped()) break e;
          s = d, n.currentTarget = w;
          try {
            s(n);
          } catch (D) {
            jn(D);
          }
          n.currentTarget = null, s = f;
        }
        else for (c = 0; c < i.length; c++) {
          if (d = i[c], f = d.instance, w = d.currentTarget, d = d.listener, f !== s && n.isPropagationStopped()) break e;
          s = d, n.currentTarget = w;
          try {
            s(n);
          } catch (D) {
            jn(D);
          }
          n.currentTarget = null, s = f;
        }
      }
    }
  }
  function Ee(e, t) {
    var a = t[Cs];
    a === void 0 && (a = t[Cs] = /* @__PURE__ */ new Set());
    var i = e + "__bubble";
    a.has(i) || (zp(t, e, 2, !1), a.add(i));
  }
  function vr(e, t, a) {
    var i = 0;
    t && (i |= 4), zp(a, e, i, t);
  }
  var ss = "_reactListening" + Math.random().toString(36).slice(2);
  function Sp(e) {
    if (!e[ss]) {
      e[ss] = !0, gd.forEach(function(a) {
        a !== "selectionchange" && (W0.has(a) || vr(a, !1, e), vr(a, !0, e));
      });
      var t = e.nodeType === 9 ? e : e.ownerDocument;
      t === null || t[ss] || (t[ss] = !0, vr("selectionchange", !1, t));
    }
  }
  function zp(e, t, a, i) {
    switch ($p(t)) {
      case 2:
        var n = Eh;
        break;
      case 8:
        n = Th;
        break;
      default:
        n = Dr;
    }
    a = n.bind(null, t, a, e), n = void 0, !Bs || t !== "touchstart" && t !== "touchmove" && t !== "wheel" || (n = !0), i ? n !== void 0 ? e.addEventListener(t, a, {
      capture: !0,
      passive: n
    }) : e.addEventListener(t, a, !0) : n !== void 0 ? e.addEventListener(t, a, { passive: n }) : e.addEventListener(t, a, !1);
  }
  function jr(e, t, a, i, n) {
    var s = i;
    if ((t & 1) === 0 && (t & 2) === 0 && i !== null) e: for (; ; ) {
      if (i === null) return;
      var c = i.tag;
      if (c === 3 || c === 4) {
        var d = i.stateNode.containerInfo;
        if (d === n) break;
        if (c === 4) for (c = i.return; c !== null; ) {
          var f = c.tag;
          if ((f === 3 || f === 4) && c.stateNode.containerInfo === n) return;
          c = c.return;
        }
        for (; d !== null; ) {
          if (c = vl(d), c === null) return;
          if (f = c.tag, f === 5 || f === 6 || f === 26 || f === 27) {
            i = s = c;
            continue e;
          }
          d = d.parentNode;
        }
      }
      i = i.return;
    }
    kd(function() {
      var w = s, D = Hs(a), L = [];
      e: {
        var _ = lo.get(e);
        if (_ !== void 0) {
          var O = gn, ie = e;
          switch (e) {
            case "keypress":
              if (mn(a) === 0) break e;
            case "keydown":
            case "keyup":
              O = Jf;
              break;
            case "focusin":
              ie = "focus", O = Xs;
              break;
            case "focusout":
              ie = "blur", O = Xs;
              break;
            case "beforeblur":
            case "afterblur":
              O = Xs;
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
              O = Od;
              break;
            case "drag":
            case "dragend":
            case "dragenter":
            case "dragexit":
            case "dragleave":
            case "dragover":
            case "dragstart":
            case "drop":
              O = Gf;
              break;
            case "touchcancel":
            case "touchend":
            case "touchmove":
            case "touchstart":
              O = If;
              break;
            case Pd:
            case eo:
            case to:
              O = Yf;
              break;
            case ao:
              O = $f;
              break;
            case "scroll":
            case "scrollend":
              O = Bf;
              break;
            case "wheel":
              O = Wf;
              break;
            case "copy":
            case "cut":
            case "paste":
              O = Vf;
              break;
            case "gotpointercapture":
            case "lostpointercapture":
            case "pointercancel":
            case "pointerdown":
            case "pointermove":
            case "pointerout":
            case "pointerover":
            case "pointerup":
              O = Dd;
              break;
            case "toggle":
            case "beforetoggle":
              O = Ff;
          }
          var ve = (t & 4) !== 0, Ve = !ve && (e === "scroll" || e === "scrollend"), y = ve ? _ !== null ? _ + "Capture" : null : _;
          ve = [];
          for (var v = w, N; v !== null; ) {
            var q = v;
            if (N = q.stateNode, q = q.tag, q !== 5 && q !== 26 && q !== 27 || N === null || y === null || (q = pi(v, y), q != null && ve.push(Qi(v, q, N))), Ve) break;
            v = v.return;
          }
          0 < ve.length && (_ = new O(_, ie, null, a, D), L.push({
            event: _,
            listeners: ve
          }));
        }
      }
      if ((t & 7) === 0) {
        e: {
          if (_ = e === "mouseover" || e === "pointerover", O = e === "mouseout" || e === "pointerout", _ && a !== qs && (ie = a.relatedTarget || a.fromElement) && (vl(ie) || ie[di])) break e;
          if ((O || _) && (_ = D.window === D ? D : (_ = D.ownerDocument) ? _.defaultView || _.parentWindow : window, O ? (ie = a.relatedTarget || a.toElement, O = w, ie = ie ? vl(ie) : null, ie !== null && (Ve = S(ie), ve = ie.tag, ie !== Ve || ve !== 5 && ve !== 27 && ve !== 6) && (ie = null)) : (O = null, ie = w), O !== ie)) {
            if (ve = Od, q = "onMouseLeave", y = "onMouseEnter", v = "mouse", (e === "pointerout" || e === "pointerover") && (ve = Dd, q = "onPointerLeave", y = "onPointerEnter", v = "pointer"), Ve = O == null ? _ : ui(O), N = ie == null ? _ : ui(ie), _ = new ve(q, v + "leave", O, a, D), _.target = Ve, _.relatedTarget = N, q = null, vl(D) === w && (ve = new ve(y, v + "enter", ie, a, D), ve.target = N, ve.relatedTarget = Ve, q = ve), Ve = q, O && ie) t: {
              for (ve = F0, y = O, v = ie, N = 0, q = y; q; q = ve(q)) N++;
              q = 0;
              for (var me = v; me; me = ve(me)) q++;
              for (; 0 < N - q; ) y = ve(y), N--;
              for (; 0 < q - N; ) v = ve(v), q--;
              for (; N--; ) {
                if (y === v || v !== null && y === v.alternate) {
                  ve = y;
                  break t;
                }
                y = ve(y), v = ve(v);
              }
              ve = null;
            }
            else ve = null;
            O !== null && Np(L, _, O, ve, !1), ie !== null && Ve !== null && Np(L, Ve, ie, ve, !0);
          }
        }
        e: {
          if (_ = w ? ui(w) : window, O = _.nodeName && _.nodeName.toLowerCase(), O === "select" || O === "input" && _.type === "file") var Me = Yd;
          else if (Bd(_)) if (Vd) Me = r0;
          else {
            Me = s0;
            var re = n0;
          }
          else O = _.nodeName, !O || O.toLowerCase() !== "input" || _.type !== "checkbox" && _.type !== "radio" ? w && Rs(w.elementType) && (Me = Yd) : Me = c0;
          if (Me && (Me = Me(e, w))) {
            Gd(L, Me, a, D);
            break e;
          }
          re && re(e, _, w), e === "focusout" && w && _.type === "number" && w.memoizedProps.value != null && Us(_, "number", _.value);
        }
        switch (re = w ? ui(w) : window, e) {
          case "focusin":
            (Bd(re) || re.contentEditable === "true") && (Tl = re, $s = w, ji = null);
            break;
          case "focusout":
            ji = $s = Tl = null;
            break;
          case "mousedown":
            Ws = !0;
            break;
          case "contextmenu":
          case "mouseup":
          case "dragend":
            Ws = !1, Wd(L, a, D);
            break;
          case "selectionchange":
            if (o0) break;
          case "keydown":
          case "keyup":
            Wd(L, a, D);
        }
        var we;
        if (Zs) e: {
          switch (e) {
            case "compositionstart":
              var ke = "onCompositionStart";
              break e;
            case "compositionend":
              ke = "onCompositionEnd";
              break e;
            case "compositionupdate":
              ke = "onCompositionUpdate";
              break e;
          }
          ke = void 0;
        }
        else El ? Hd(e, a) && (ke = "onCompositionEnd") : e === "keydown" && a.keyCode === 229 && (ke = "onCompositionStart");
        ke && (Ud && a.locale !== "ko" && (El || ke !== "onCompositionStart" ? ke === "onCompositionEnd" && El && (we = Ad()) : (_a = D, Gs = "value" in _a ? _a.value : _a.textContent, El = !0)), re = cs(w, ke), 0 < re.length && (ke = new Md(ke, e, null, a, D), L.push({
          event: ke,
          listeners: re
        }), we ? ke.data = we : (we = Ld(a), we !== null && (ke.data = we)))), (we = e0 ? t0(e, a) : a0(e, a)) && (ke = cs(w, "onBeforeInput"), 0 < ke.length && (re = new Md("onBeforeInput", "beforeinput", null, a, D), L.push({
          event: re,
          listeners: ke
        }), re.data = we)), $0(L, e, w, a, D);
      }
      yp(L, t);
    });
  }
  function Qi(e, t, a) {
    return {
      instance: e,
      listener: t,
      currentTarget: a
    };
  }
  function cs(e, t) {
    for (var a = t + "Capture", i = []; e !== null; ) {
      var n = e, s = n.stateNode;
      if (n = n.tag, n !== 5 && n !== 26 && n !== 27 || s === null || (n = pi(e, a), n != null && i.unshift(Qi(e, n, s)), n = pi(e, t), n != null && i.push(Qi(e, n, s))), e.tag === 3) return i;
      e = e.return;
    }
    return [];
  }
  function F0(e) {
    if (e === null) return null;
    do
      e = e.return;
    while (e && e.tag !== 5 && e.tag !== 27);
    return e || null;
  }
  function Np(e, t, a, i, n) {
    for (var s = t._reactName, c = []; a !== null && a !== i; ) {
      var d = a, f = d.alternate, w = d.stateNode;
      if (d = d.tag, f !== null && f === i) break;
      d !== 5 && d !== 26 && d !== 27 || w === null || (f = w, n ? (w = pi(a, s), w != null && c.unshift(Qi(a, w, f))) : n || (w = pi(a, s), w != null && c.push(Qi(a, w, f)))), a = a.return;
    }
    c.length !== 0 && e.push({
      event: t,
      listeners: c
    });
  }
  var P0 = /\r\n?/g, eh = /\u0000|\uFFFD/g;
  function wp(e) {
    return (typeof e == "string" ? e : "" + e).replace(P0, `
`).replace(eh, "");
  }
  function _p(e, t) {
    return t = wp(t), wp(e) === t;
  }
  function Ye(e, t, a, i, n, s) {
    switch (a) {
      case "children":
        typeof i == "string" ? t === "body" || t === "textarea" && i === "" || Nl(e, i) : (typeof i == "number" || typeof i == "bigint") && t !== "body" && Nl(e, "" + i);
        break;
      case "className":
        un(e, "class", i);
        break;
      case "tabIndex":
        un(e, "tabindex", i);
        break;
      case "dir":
      case "role":
      case "viewBox":
      case "width":
      case "height":
        un(e, a, i);
        break;
      case "style":
        Ed(e, i, s);
        break;
      case "data":
        if (t !== "object") {
          un(e, "data", i);
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
        i = fn("" + i), e.setAttribute(a, i);
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
        i = fn("" + i), e.setAttribute(a, i);
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
          if (typeof i != "object" || !("__html" in i)) throw Error(o(61));
          if (a = i.__html, a != null) {
            if (n.children != null) throw Error(o(60));
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
        a = fn("" + i), e.setAttributeNS("http://www.w3.org/1999/xlink", "xlink:href", a);
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
        Ee("beforetoggle", e), Ee("toggle", e), on(e, "popover", i);
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
        on(e, "is", i);
        break;
      case "innerText":
      case "textContent":
        break;
      default:
        (!(2 < a.length) || a[0] !== "o" && a[0] !== "O" || a[1] !== "n" && a[1] !== "N") && (a = Hf.get(a) || a, on(e, a, i));
    }
  }
  function yr(e, t, a, i, n, s) {
    switch (a) {
      case "style":
        Ed(e, i, s);
        break;
      case "dangerouslySetInnerHTML":
        if (i != null) {
          if (typeof i != "object" || !("__html" in i)) throw Error(o(61));
          if (a = i.__html, a != null) {
            if (n.children != null) throw Error(o(60));
            e.innerHTML = a;
          }
        }
        break;
      case "children":
        typeof i == "string" ? Nl(e, i) : (typeof i == "number" || typeof i == "bigint") && Nl(e, "" + i);
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
        if (!bd.hasOwnProperty(a)) e: {
          if (a[0] === "o" && a[1] === "n" && (n = a.endsWith("Capture"), t = a.slice(2, n ? a.length - 7 : void 0), s = e[yt] || null, s = s != null ? s[a] : null, typeof s == "function" && e.removeEventListener(t, s, n), typeof i == "function")) {
            typeof s != "function" && s !== null && (a in e ? e[a] = null : e.hasAttribute(a) && e.removeAttribute(a)), e.addEventListener(t, i, n);
            break e;
          }
          a in e ? e[a] = i : i === !0 ? e.setAttribute(a, "") : on(e, a, i);
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
              throw Error(o(137, t));
            default:
              Ye(e, t, s, c, a, null);
          }
        }
        n && Ye(e, t, "srcSet", a.srcSet, a, null), i && Ye(e, t, "src", a.src, a, null);
        return;
      case "input":
        Ee("invalid", e);
        var d = s = c = n = null, f = null, w = null;
        for (i in a) if (a.hasOwnProperty(i)) {
          var D = a[i];
          if (D != null) switch (i) {
            case "name":
              n = D;
              break;
            case "type":
              c = D;
              break;
            case "checked":
              f = D;
              break;
            case "defaultChecked":
              w = D;
              break;
            case "value":
              s = D;
              break;
            case "defaultValue":
              d = D;
              break;
            case "children":
            case "dangerouslySetInnerHTML":
              if (D != null) throw Error(o(137, t));
              break;
            default:
              Ye(e, t, i, D, a, null);
          }
        }
        zd(e, s, d, f, w, c, n, !1);
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
        t = s, a = c, e.multiple = !!i, t != null ? zl(e, !!i, t, !1) : a != null && zl(e, !!i, a, !0);
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
            if (d != null) throw Error(o(91));
            break;
          default:
            Ye(e, t, c, d, a, null);
        }
        wd(e, i, n, s);
        return;
      case "option":
        for (f in a) a.hasOwnProperty(f) && (i = a[f], i != null) && (f === "selected" ? e.selected = i && typeof i != "function" && typeof i != "symbol" : Ye(e, t, f, i, a, null));
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
        for (i = 0; i < Xi.length; i++) Ee(Xi[i], e);
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
        for (w in a) if (a.hasOwnProperty(w) && (i = a[w], i != null)) switch (w) {
          case "children":
          case "dangerouslySetInnerHTML":
            throw Error(o(137, t));
          default:
            Ye(e, t, w, i, a, null);
        }
        return;
      default:
        if (Rs(t)) {
          for (D in a) a.hasOwnProperty(D) && (i = a[D], i !== void 0 && yr(e, t, D, i, a, void 0));
          return;
        }
    }
    for (d in a) a.hasOwnProperty(d) && (i = a[d], i != null && Ye(e, t, d, i, a, null));
  }
  function th(e, t, a, i) {
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
        var n = null, s = null, c = null, d = null, f = null, w = null, D = null;
        for (O in a) {
          var L = a[O];
          if (a.hasOwnProperty(O) && L != null) switch (O) {
            case "checked":
              break;
            case "value":
              break;
            case "defaultValue":
              f = L;
            default:
              i.hasOwnProperty(O) || Ye(e, t, O, null, i, L);
          }
        }
        for (var _ in i) {
          var O = i[_];
          if (L = a[_], i.hasOwnProperty(_) && (O != null || L != null)) switch (_) {
            case "type":
              s = O;
              break;
            case "name":
              n = O;
              break;
            case "checked":
              w = O;
              break;
            case "defaultChecked":
              D = O;
              break;
            case "value":
              c = O;
              break;
            case "defaultValue":
              d = O;
              break;
            case "children":
            case "dangerouslySetInnerHTML":
              if (O != null) throw Error(o(137, t));
              break;
            default:
              O !== L && Ye(e, t, _, O, i, L);
          }
        }
        Ds(e, c, d, f, w, D, s, n);
        return;
      case "select":
        O = c = d = _ = null;
        for (s in a) if (f = a[s], a.hasOwnProperty(s) && f != null) switch (s) {
          case "value":
            break;
          case "multiple":
            O = f;
          default:
            i.hasOwnProperty(s) || Ye(e, t, s, null, i, f);
        }
        for (n in i) if (s = i[n], f = a[n], i.hasOwnProperty(n) && (s != null || f != null)) switch (n) {
          case "value":
            _ = s;
            break;
          case "defaultValue":
            d = s;
            break;
          case "multiple":
            c = s;
          default:
            s !== f && Ye(e, t, n, s, i, f);
        }
        t = d, a = c, i = O, _ != null ? zl(e, !!a, _, !1) : !!i != !!a && (t != null ? zl(e, !!a, t, !0) : zl(e, !!a, a ? [] : "", !1));
        return;
      case "textarea":
        O = _ = null;
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
            _ = n;
            break;
          case "defaultValue":
            O = n;
            break;
          case "children":
            break;
          case "dangerouslySetInnerHTML":
            if (n != null) throw Error(o(91));
            break;
          default:
            n !== s && Ye(e, t, c, n, i, s);
        }
        Nd(e, _, O);
        return;
      case "option":
        for (var ie in a) _ = a[ie], a.hasOwnProperty(ie) && _ != null && !i.hasOwnProperty(ie) && (ie === "selected" ? e.selected = !1 : Ye(e, t, ie, null, i, _));
        for (f in i) _ = i[f], O = a[f], i.hasOwnProperty(f) && _ !== O && (_ != null || O != null) && (f === "selected" ? e.selected = _ && typeof _ != "function" && typeof _ != "symbol" : Ye(e, t, f, _, i, O));
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
        for (var ve in a) _ = a[ve], a.hasOwnProperty(ve) && _ != null && !i.hasOwnProperty(ve) && Ye(e, t, ve, null, i, _);
        for (w in i) if (_ = i[w], O = a[w], i.hasOwnProperty(w) && _ !== O && (_ != null || O != null)) switch (w) {
          case "children":
          case "dangerouslySetInnerHTML":
            if (_ != null) throw Error(o(137, t));
            break;
          default:
            Ye(e, t, w, _, i, O);
        }
        return;
      default:
        if (Rs(t)) {
          for (var Ve in a) _ = a[Ve], a.hasOwnProperty(Ve) && _ !== void 0 && !i.hasOwnProperty(Ve) && yr(e, t, Ve, void 0, i, _);
          for (D in i) _ = i[D], O = a[D], !i.hasOwnProperty(D) || _ === O || _ === void 0 && O === void 0 || yr(e, t, D, _, i, O);
          return;
        }
    }
    for (var y in a) _ = a[y], a.hasOwnProperty(y) && _ != null && !i.hasOwnProperty(y) && Ye(e, t, y, null, i, _);
    for (L in i) _ = i[L], O = a[L], !i.hasOwnProperty(L) || _ === O || _ == null && O == null || Ye(e, t, L, _, i, O);
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
  function ah() {
    if (typeof performance.getEntriesByType == "function") {
      for (var e = 0, t = 0, a = performance.getEntriesByType("resource"), i = 0; i < a.length; i++) {
        var n = a[i], s = n.transferSize, c = n.initiatorType, d = n.duration;
        if (s && d && Ep(c)) {
          for (c = 0, d = n.responseEnd, i += 1; i < a.length; i++) {
            var f = a[i], w = f.startTime;
            if (w > d) break;
            var D = f.transferSize, L = f.initiatorType;
            D && Ep(L) && (f = f.responseEnd, c += D * (f < d ? 1 : (d - w) / (f - w)));
          }
          if (--i, t += 8 * (s + c) / (n.duration / 1e3), e++, 10 < e) break;
        }
      }
      if (0 < e) return t / e / 1e6;
    }
    return navigator.connection && (e = navigator.connection.downlink, typeof e == "number") ? e : 5;
  }
  var Sr = null, zr = null;
  function rs(e) {
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
  function kp(e, t) {
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
  function Nr(e, t) {
    return e === "textarea" || e === "noscript" || typeof t.children == "string" || typeof t.children == "number" || typeof t.children == "bigint" || typeof t.dangerouslySetInnerHTML == "object" && t.dangerouslySetInnerHTML !== null && t.dangerouslySetInnerHTML.__html != null;
  }
  var wr = null;
  function lh() {
    var e = window.event;
    return e && e.type === "popstate" ? e === wr ? !1 : (wr = e, !0) : (wr = null, !1);
  }
  var Ap = typeof setTimeout == "function" ? setTimeout : void 0, ih = typeof clearTimeout == "function" ? clearTimeout : void 0, Cp = typeof Promise == "function" ? Promise : void 0, nh = typeof queueMicrotask == "function" ? queueMicrotask : typeof Cp < "u" ? function(e) {
    return Cp.resolve(null).then(e).catch(sh);
  } : Ap;
  function sh(e) {
    setTimeout(function() {
      throw e;
    });
  }
  function Ga(e) {
    return e === "head";
  }
  function Op(e, t) {
    var a = t, i = 0;
    do {
      var n = a.nextSibling;
      if (e.removeChild(a), n && n.nodeType === 8) if (a = n.data, a === "/$" || a === "/&") {
        if (i === 0) {
          e.removeChild(n), ti(t);
          return;
        }
        i--;
      } else if (a === "$" || a === "$?" || a === "$~" || a === "$!" || a === "&") i++;
      else if (a === "html") Zi(e.ownerDocument.documentElement);
      else if (a === "head") {
        a = e.ownerDocument.head, Zi(a);
        for (var s = a.firstChild; s; ) {
          var c = s.nextSibling, d = s.nodeName;
          s[oi] || d === "SCRIPT" || d === "STYLE" || d === "LINK" && s.rel.toLowerCase() === "stylesheet" || a.removeChild(s), s = c;
        }
      } else a === "body" && Zi(e.ownerDocument.body);
      a = n;
    } while (a);
    ti(t);
  }
  function Mp(e, t) {
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
  function _r(e) {
    var t = e.firstChild;
    for (t && t.nodeType === 10 && (t = t.nextSibling); t; ) {
      var a = t;
      switch (t = t.nextSibling, a.nodeName) {
        case "HTML":
        case "HEAD":
        case "BODY":
          _r(a), Os(a);
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
  function ch(e, t, a, i) {
    for (; e.nodeType === 1; ) {
      var n = a;
      if (e.nodeName.toLowerCase() !== t.toLowerCase()) {
        if (!i && (e.nodeName !== "INPUT" || e.type !== "hidden")) break;
      } else if (i) {
        if (!e[oi]) switch (t) {
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
  function rh(e, t, a) {
    if (t === "") return null;
    for (; e.nodeType !== 3; )
      if ((e.nodeType !== 1 || e.nodeName !== "INPUT" || e.type !== "hidden") && !a || (e = Qt(e.nextSibling), e === null)) return null;
    return e;
  }
  function Dp(e, t) {
    for (; e.nodeType !== 8; )
      if ((e.nodeType !== 1 || e.nodeName !== "INPUT" || e.type !== "hidden") && !t || (e = Qt(e.nextSibling), e === null)) return null;
    return e;
  }
  function Er(e) {
    return e.data === "$?" || e.data === "$~";
  }
  function Tr(e) {
    return e.data === "$!" || e.data === "$?" && e.ownerDocument.readyState !== "loading";
  }
  function dh(e, t) {
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
  var kr = null;
  function Up(e) {
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
  function Rp(e) {
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
  function qp(e, t, a) {
    switch (t = rs(a), e) {
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
  function Zi(e) {
    for (var t = e.attributes; t.length; ) e.removeAttributeNode(t[0]);
    Os(e);
  }
  var Zt = /* @__PURE__ */ new Map(), Hp = /* @__PURE__ */ new Set();
  function ds(e) {
    return typeof e.getRootNode == "function" ? e.getRootNode() : e.nodeType === 9 ? e : e.ownerDocument;
  }
  var za = G.d;
  G.d = {
    f: oh,
    r: uh,
    D: ph,
    C: fh,
    L: hh,
    m: mh,
    X: gh,
    S: xh,
    M: bh
  };
  function oh() {
    var e = za.f(), t = es();
    return e || t;
  }
  function uh(e) {
    var t = jl(e);
    t !== null && t.tag === 5 && t.type === "form" ? lu(t) : za.r(e);
  }
  var Fl = typeof document > "u" ? null : document;
  function Lp(e, t, a) {
    var i = Fl;
    if (i && typeof t == "string" && t) {
      var n = qt(t);
      n = 'link[rel="' + e + '"][href="' + n + '"]', typeof a == "string" && (n += '[crossorigin="' + a + '"]'), Hp.has(n) || (Hp.add(n), e = {
        rel: e,
        crossOrigin: a,
        href: t
      }, i.querySelector(n) === null && (t = i.createElement("link"), gt(t, "link", e), ut(t), i.head.appendChild(t)));
    }
  }
  function ph(e) {
    za.D(e), Lp("dns-prefetch", e, null);
  }
  function fh(e, t) {
    za.C(e, t), Lp("preconnect", e, t);
  }
  function hh(e, t, a) {
    za.L(e, t, a);
    var i = Fl;
    if (i && e && t) {
      var n = 'link[rel="preload"][as="' + qt(t) + '"]';
      t === "image" && a && a.imageSrcSet ? (n += '[imagesrcset="' + qt(a.imageSrcSet) + '"]', typeof a.imageSizes == "string" && (n += '[imagesizes="' + qt(a.imageSizes) + '"]')) : n += '[href="' + qt(e) + '"]';
      var s = n;
      switch (t) {
        case "style":
          s = Pl(e);
          break;
        case "script":
          s = ei(e);
      }
      Zt.has(s) || (e = U({
        rel: "preload",
        href: t === "image" && a && a.imageSrcSet ? void 0 : e,
        as: t
      }, a), Zt.set(s, e), i.querySelector(n) !== null || t === "style" && i.querySelector(Ki(s)) || t === "script" && i.querySelector(Ji(s)) || (t = i.createElement("link"), gt(t, "link", e), ut(t), i.head.appendChild(t)));
    }
  }
  function mh(e, t) {
    za.m(e, t);
    var a = Fl;
    if (a && e) {
      var i = t && typeof t.as == "string" ? t.as : "script", n = 'link[rel="modulepreload"][as="' + qt(i) + '"][href="' + qt(e) + '"]', s = n;
      switch (i) {
        case "audioworklet":
        case "paintworklet":
        case "serviceworker":
        case "sharedworker":
        case "worker":
        case "script":
          s = ei(e);
      }
      if (!Zt.has(s) && (e = U({
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
            if (a.querySelector(Ji(s))) return;
        }
        i = a.createElement("link"), gt(i, "link", e), ut(i), a.head.appendChild(i);
      }
    }
  }
  function xh(e, t, a) {
    za.S(e, t, a);
    var i = Fl;
    if (i && e) {
      var n = yl(i).hoistableStyles, s = Pl(e);
      t = t || "default";
      var c = n.get(s);
      if (!c) {
        var d = {
          loading: 0,
          preload: null
        };
        if (c = i.querySelector(Ki(s))) d.loading = 5;
        else {
          e = U({
            rel: "stylesheet",
            href: e,
            "data-precedence": t
          }, a), (a = Zt.get(s)) && Ar(e, a);
          var f = c = i.createElement("link");
          ut(f), gt(f, "link", e), f._p = new Promise(function(w, D) {
            f.onload = w, f.onerror = D;
          }), f.addEventListener("load", function() {
            d.loading |= 1;
          }), f.addEventListener("error", function() {
            d.loading |= 2;
          }), d.loading |= 4, os(c, t, i);
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
  function gh(e, t) {
    za.X(e, t);
    var a = Fl;
    if (a && e) {
      var i = yl(a).hoistableScripts, n = ei(e), s = i.get(n);
      s || (s = a.querySelector(Ji(n)), s || (e = U({
        src: e,
        async: !0
      }, t), (t = Zt.get(n)) && Cr(e, t), s = a.createElement("script"), ut(s), gt(s, "link", e), a.head.appendChild(s)), s = {
        type: "script",
        instance: s,
        count: 1,
        state: null
      }, i.set(n, s));
    }
  }
  function bh(e, t) {
    za.M(e, t);
    var a = Fl;
    if (a && e) {
      var i = yl(a).hoistableScripts, n = ei(e), s = i.get(n);
      s || (s = a.querySelector(Ji(n)), s || (e = U({
        src: e,
        async: !0,
        type: "module"
      }, t), (t = Zt.get(n)) && Cr(e, t), s = a.createElement("script"), ut(s), gt(s, "link", e), a.head.appendChild(s)), s = {
        type: "script",
        instance: s,
        count: 1,
        state: null
      }, i.set(n, s));
    }
  }
  function Bp(e, t, a, i) {
    var n = (n = F.current) ? ds(n) : null;
    if (!n) throw Error(o(446));
    switch (e) {
      case "meta":
      case "title":
        return null;
      case "style":
        return typeof a.precedence == "string" && typeof a.href == "string" ? (t = Pl(a.href), a = yl(n).hoistableStyles, i = a.get(t), i || (i = {
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
          e = Pl(a.href);
          var s = yl(n).hoistableStyles, c = s.get(e);
          if (c || (n = n.ownerDocument || n, c = {
            type: "stylesheet",
            instance: null,
            count: 0,
            state: {
              loading: 0,
              preload: null
            }
          }, s.set(e, c), (s = n.querySelector(Ki(e))) && !s._p && (c.instance = s, c.state.loading = 5), Zt.has(e) || (a = {
            rel: "preload",
            as: "style",
            href: a.href,
            crossOrigin: a.crossOrigin,
            integrity: a.integrity,
            media: a.media,
            hrefLang: a.hrefLang,
            referrerPolicy: a.referrerPolicy
          }, Zt.set(e, a), s || vh(n, e, a, c.state))), t && i === null) throw Error(o(528, ""));
          return c;
        }
        if (t && i !== null) throw Error(o(529, ""));
        return null;
      case "script":
        return t = a.async, a = a.src, typeof a == "string" && t && typeof t != "function" && typeof t != "symbol" ? (t = ei(a), a = yl(n).hoistableScripts, i = a.get(t), i || (i = {
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
        throw Error(o(444, e));
    }
  }
  function Pl(e) {
    return 'href="' + qt(e) + '"';
  }
  function Ki(e) {
    return 'link[rel="stylesheet"][' + e + "]";
  }
  function Gp(e) {
    return U({}, e, {
      "data-precedence": e.precedence,
      precedence: null
    });
  }
  function vh(e, t, a, i) {
    e.querySelector('link[rel="preload"][as="style"][' + t + "]") ? i.loading = 1 : (t = e.createElement("link"), i.preload = t, t.addEventListener("load", function() {
      return i.loading |= 1;
    }), t.addEventListener("error", function() {
      return i.loading |= 2;
    }), gt(t, "link", a), ut(t), e.head.appendChild(t));
  }
  function ei(e) {
    return '[src="' + qt(e) + '"]';
  }
  function Ji(e) {
    return "script[async]" + e;
  }
  function Yp(e, t, a) {
    if (t.count++, t.instance === null) switch (t.type) {
      case "style":
        var i = e.querySelector('style[data-href~="' + qt(a.href) + '"]');
        if (i) return t.instance = i, ut(i), i;
        var n = U({}, a, {
          "data-href": a.href,
          "data-precedence": a.precedence,
          href: null,
          precedence: null
        });
        return i = (e.ownerDocument || e).createElement("style"), ut(i), gt(i, "style", n), os(i, a.precedence, e), t.instance = i;
      case "stylesheet":
        n = Pl(a.href);
        var s = e.querySelector(Ki(n));
        if (s) return t.state.loading |= 4, t.instance = s, ut(s), s;
        i = Gp(a), (n = Zt.get(n)) && Ar(i, n), s = (e.ownerDocument || e).createElement("link"), ut(s);
        var c = s;
        return c._p = new Promise(function(d, f) {
          c.onload = d, c.onerror = f;
        }), gt(s, "link", i), t.state.loading |= 4, os(s, a.precedence, e), t.instance = s;
      case "script":
        return s = ei(a.src), (n = e.querySelector(Ji(s))) ? (t.instance = n, ut(n), n) : (i = a, (n = Zt.get(s)) && (i = U({}, a), Cr(i, n)), e = e.ownerDocument || e, n = e.createElement("script"), ut(n), gt(n, "link", i), e.head.appendChild(n), t.instance = n);
      case "void":
        return null;
      default:
        throw Error(o(443, t.type));
    }
    else t.type === "stylesheet" && (t.state.loading & 4) === 0 && (i = t.instance, t.state.loading |= 4, os(i, a.precedence, e));
    return t.instance;
  }
  function os(e, t, a) {
    for (var i = a.querySelectorAll('link[rel="stylesheet"][data-precedence],style[data-precedence]'), n = i.length ? i[i.length - 1] : null, s = n, c = 0; c < i.length; c++) {
      var d = i[c];
      if (d.dataset.precedence === t) s = d;
      else if (s !== n) break;
    }
    s ? s.parentNode.insertBefore(e, s.nextSibling) : (t = a.nodeType === 9 ? a.head : a, t.insertBefore(e, t.firstChild));
  }
  function Ar(e, t) {
    e.crossOrigin ??= t.crossOrigin, e.referrerPolicy ??= t.referrerPolicy, e.title ??= t.title;
  }
  function Cr(e, t) {
    e.crossOrigin ??= t.crossOrigin, e.referrerPolicy ??= t.referrerPolicy, e.integrity ??= t.integrity;
  }
  var us = null;
  function Vp(e, t, a) {
    if (us === null) {
      var i = /* @__PURE__ */ new Map(), n = us = /* @__PURE__ */ new Map();
      n.set(a, i);
    } else n = us, i = n.get(a), i || (i = /* @__PURE__ */ new Map(), n.set(a, i));
    if (i.has(e)) return i;
    for (i.set(e, null), a = a.getElementsByTagName(e), n = 0; n < a.length; n++) {
      var s = a[n];
      if (!(s[oi] || s[ft] || e === "link" && s.getAttribute("rel") === "stylesheet") && s.namespaceURI !== "http://www.w3.org/2000/svg") {
        var c = s.getAttribute(t) || "";
        c = e + c;
        var d = i.get(c);
        d ? d.push(s) : i.set(c, [s]);
      }
    }
    return i;
  }
  function Xp(e, t, a) {
    e = e.ownerDocument || e, e.head.insertBefore(a, t === "title" ? e.querySelector("head > title") : null);
  }
  function jh(e, t, a) {
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
  function Qp(e) {
    return !(e.type === "stylesheet" && (e.state.loading & 3) === 0);
  }
  function yh(e, t, a, i) {
    if (a.type === "stylesheet" && (typeof i.media != "string" || matchMedia(i.media).matches !== !1) && (a.state.loading & 4) === 0) {
      if (a.instance === null) {
        var n = Pl(i.href), s = t.querySelector(Ki(n));
        if (s) {
          t = s._p, t !== null && typeof t == "object" && typeof t.then == "function" && (e.count++, e = ps.bind(e), t.then(e, e)), a.state.loading |= 4, a.instance = s, ut(s);
          return;
        }
        s = t.ownerDocument || t, i = Gp(i), (n = Zt.get(n)) && Ar(i, n), s = s.createElement("link"), ut(s);
        var c = s;
        c._p = new Promise(function(d, f) {
          c.onload = d, c.onerror = f;
        }), gt(s, "link", i), a.instance = s;
      }
      e.stylesheets === null && (e.stylesheets = /* @__PURE__ */ new Map()), e.stylesheets.set(a, t), (t = a.state.preload) && (a.state.loading & 3) === 0 && (e.count++, a = ps.bind(e), t.addEventListener("load", a), t.addEventListener("error", a));
    }
  }
  var Or = 0;
  function Sh(e, t) {
    return e.stylesheets && e.count === 0 && hs(e, e.stylesheets), 0 < e.count || 0 < e.imgCount ? function(a) {
      var i = setTimeout(function() {
        if (e.stylesheets && hs(e, e.stylesheets), e.unsuspend) {
          var s = e.unsuspend;
          e.unsuspend = null, s();
        }
      }, 6e4 + t);
      0 < e.imgBytes && Or === 0 && (Or = 62500 * ah());
      var n = setTimeout(function() {
        if (e.waitingForImages = !1, e.count === 0 && (e.stylesheets && hs(e, e.stylesheets), e.unsuspend)) {
          var s = e.unsuspend;
          e.unsuspend = null, s();
        }
      }, (e.imgBytes > Or ? 50 : 800) + t);
      return e.unsuspend = a, function() {
        e.unsuspend = null, clearTimeout(i), clearTimeout(n);
      };
    } : null;
  }
  function ps() {
    if (this.count--, this.count === 0 && (this.imgCount === 0 || !this.waitingForImages)) {
      if (this.stylesheets) hs(this, this.stylesheets);
      else if (this.unsuspend) {
        var e = this.unsuspend;
        this.unsuspend = null, e();
      }
    }
  }
  var fs = null;
  function hs(e, t) {
    e.stylesheets = null, e.unsuspend !== null && (e.count++, fs = /* @__PURE__ */ new Map(), t.forEach(zh, e), fs = null, ps.call(e));
  }
  function zh(e, t) {
    if (!(t.state.loading & 4)) {
      var a = fs.get(e);
      if (a) var i = a.get(null);
      else {
        a = /* @__PURE__ */ new Map(), fs.set(e, a);
        for (var n = e.querySelectorAll("link[data-precedence],style[data-precedence]"), s = 0; s < n.length; s++) {
          var c = n[s];
          (c.nodeName === "LINK" || c.getAttribute("media") !== "not all") && (a.set(c.dataset.precedence, c), i = c);
        }
        i && a.set(null, i);
      }
      n = t.instance, c = n.getAttribute("data-precedence"), s = a.get(c) || i, s === i && a.set(null, n), a.set(c, n), this.count++, i = ps.bind(this), n.addEventListener("load", i), n.addEventListener("error", i), s ? s.parentNode.insertBefore(n, s.nextSibling) : (e = e.nodeType === 9 ? e.head : e, e.insertBefore(n, e.firstChild)), t.state.loading |= 4;
    }
  }
  var Ii = {
    $$typeof: V,
    Provider: null,
    Consumer: null,
    _currentValue: ce,
    _currentValue2: ce,
    _threadCount: 0
  };
  function Nh(e, t, a, i, n, s, c, d, f) {
    this.tag = 1, this.containerInfo = e, this.pingCache = this.current = this.pendingChildren = null, this.timeoutHandle = -1, this.callbackNode = this.next = this.pendingContext = this.context = this.cancelPendingCommit = null, this.callbackPriority = 0, this.expirationTimes = ks(-1), this.entangledLanes = this.shellSuspendCounter = this.errorRecoveryDisabledLanes = this.expiredLanes = this.warmLanes = this.pingedLanes = this.suspendedLanes = this.pendingLanes = 0, this.entanglements = ks(0), this.hiddenUpdates = ks(null), this.identifierPrefix = i, this.onUncaughtError = n, this.onCaughtError = s, this.onRecoverableError = c, this.pooledCache = null, this.pooledCacheLanes = 0, this.formState = f, this.incompleteTransitions = /* @__PURE__ */ new Map();
  }
  function wh(e, t, a, i, n, s, c, d, f, w, D, L) {
    return e = new Nh(e, t, a, c, f, w, D, L, d), t = 1, s === !0 && (t |= 24), s = kt(3, null, null, t), e.current = s, s.stateNode = e, t = pc(), t.refCount++, e.pooledCache = t, t.refCount++, s.memoizedState = {
      element: i,
      isDehydrated: a,
      cache: t
    }, xc(s), e;
  }
  function _h(e) {
    return e ? (e = Cl, e) : Cl;
  }
  function Zp(e, t, a, i, n, s) {
    n = _h(n), i.context === null ? i.context = n : i.pendingContext = n, i = ol(t), i.payload = { element: a }, s = s === void 0 ? null : s, s !== null && (i.callback = s), a = ul(e, i, t), a !== null && (Et(a, e, t), Ei(a, e, t));
  }
  function Kp(e, t) {
    if (e = e.memoizedState, e !== null && e.dehydrated !== null) {
      var a = e.retryLane;
      e.retryLane = a !== 0 && a < t ? a : t;
    }
  }
  function Mr(e, t) {
    Kp(e, t), (e = e.alternate) && Kp(e, t);
  }
  function Jp(e) {
    if (e.tag === 13 || e.tag === 31) {
      var t = tl(e, 67108864);
      t !== null && Et(t, e, 67108864), Mr(e, 67108864);
    }
  }
  function Ip(e) {
    if (e.tag === 13 || e.tag === 31) {
      var t = Xt();
      t = fd(t);
      var a = tl(e, t);
      a !== null && Et(a, e, t), Mr(e, t);
    }
  }
  var ms = !0;
  function Eh(e, t, a, i) {
    var n = B.T;
    B.T = null;
    var s = G.p;
    try {
      G.p = 2, Dr(e, t, a, i);
    } finally {
      G.p = s, B.T = n;
    }
  }
  function Th(e, t, a, i) {
    var n = B.T;
    B.T = null;
    var s = G.p;
    try {
      G.p = 8, Dr(e, t, a, i);
    } finally {
      G.p = s, B.T = n;
    }
  }
  function Dr(e, t, a, i) {
    if (ms) {
      var n = Ur(i);
      if (n === null) jr(e, t, i, xs, a), Wp(e, i);
      else if (Ah(n, e, t, a, i)) i.stopPropagation();
      else if (Wp(e, i), t & 4 && -1 < kh.indexOf(e)) {
        for (; n !== null; ) {
          var s = jl(n);
          if (s !== null) switch (s.tag) {
            case 3:
              if (s = s.stateNode, s.current.memoizedState.isDehydrated) {
                var c = $a(s.pendingLanes);
                if (c !== 0) {
                  var d = s;
                  for (d.pendingLanes |= 2, d.entangledLanes |= 2; c; ) {
                    var f = 1 << 31 - rt(c);
                    d.entanglements[1] |= f, c &= ~f;
                  }
                  Sa(s), (Re & 6) === 0 && (Fn = We() + 500, Vi(0, !1));
                }
              }
              break;
            case 31:
            case 13:
              d = tl(s, 2), d !== null && Et(d, s, 2), es(), Mr(s, 2);
          }
          if (s = Ur(i), s === null && jr(e, t, i, xs, a), s === n) break;
          n = s;
        }
        n !== null && i.stopPropagation();
      } else jr(e, t, i, null, a);
    }
  }
  function Ur(e) {
    return e = Hs(e), Rr(e);
  }
  var xs = null;
  function Rr(e) {
    if (xs = null, e = vl(e), e !== null) {
      var t = S(e);
      if (t === null) e = null;
      else {
        var a = t.tag;
        if (a === 13) {
          if (e = H(t), e !== null) return e;
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
    return xs = e, null;
  }
  function $p(e) {
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
          case bl:
            return 2;
          case Ut:
            return 8;
          case ea:
          case Ia:
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
  var qr = !1, Ya = null, Va = null, Xa = null, $i = /* @__PURE__ */ new Map(), Wi = /* @__PURE__ */ new Map(), Qa = [], kh = "mousedown mouseup touchcancel touchend touchstart auxclick dblclick pointercancel pointerdown pointerup dragend dragstart drop compositionend compositionstart keydown keypress keyup input textInput copy cut paste click change contextmenu reset".split(" ");
  function Wp(e, t) {
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
        $i.delete(t.pointerId);
        break;
      case "gotpointercapture":
      case "lostpointercapture":
        Wi.delete(t.pointerId);
    }
  }
  function Fi(e, t, a, i, n, s) {
    return e === null || e.nativeEvent !== s ? (e = {
      blockedOn: t,
      domEventName: a,
      eventSystemFlags: i,
      nativeEvent: s,
      targetContainers: [n]
    }, t !== null && (t = jl(t), t !== null && Jp(t)), e) : (e.eventSystemFlags |= i, t = e.targetContainers, n !== null && t.indexOf(n) === -1 && t.push(n), e);
  }
  function Ah(e, t, a, i, n) {
    switch (t) {
      case "focusin":
        return Ya = Fi(Ya, e, t, a, i, n), !0;
      case "dragenter":
        return Va = Fi(Va, e, t, a, i, n), !0;
      case "mouseover":
        return Xa = Fi(Xa, e, t, a, i, n), !0;
      case "pointerover":
        var s = n.pointerId;
        return $i.set(s, Fi($i.get(s) || null, e, t, a, i, n)), !0;
      case "gotpointercapture":
        return s = n.pointerId, Wi.set(s, Fi(Wi.get(s) || null, e, t, a, i, n)), !0;
    }
    return !1;
  }
  function Fp(e) {
    var t = vl(e.target);
    if (t !== null) {
      var a = S(t);
      if (a !== null) {
        if (t = a.tag, t === 13) {
          if (t = H(a), t !== null) {
            e.blockedOn = t, md(e.priority, function() {
              Ip(a);
            });
            return;
          }
        } else if (t === 31) {
          if (t = T(a), t !== null) {
            e.blockedOn = t, md(e.priority, function() {
              Ip(a);
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
  function gs(e) {
    if (e.blockedOn !== null) return !1;
    for (var t = e.targetContainers; 0 < t.length; ) {
      var a = Ur(e.nativeEvent);
      if (a === null) {
        a = e.nativeEvent;
        var i = new a.constructor(a.type, a);
        qs = i, a.target.dispatchEvent(i), qs = null;
      } else return t = jl(a), t !== null && Jp(t), e.blockedOn = a, !1;
      t.shift();
    }
    return !0;
  }
  function Pp(e, t, a) {
    gs(e) && a.delete(t);
  }
  function Ch() {
    qr = !1, Ya !== null && gs(Ya) && (Ya = null), Va !== null && gs(Va) && (Va = null), Xa !== null && gs(Xa) && (Xa = null), $i.forEach(Pp), Wi.forEach(Pp);
  }
  function bs(e, t) {
    e.blockedOn === t && (e.blockedOn = null, qr || (qr = !0, x.unstable_scheduleCallback(x.unstable_NormalPriority, Ch)));
  }
  var vs = null;
  function ef(e) {
    vs !== e && (vs = e, x.unstable_scheduleCallback(x.unstable_NormalPriority, function() {
      vs === e && (vs = null);
      for (var t = 0; t < e.length; t += 3) {
        var a = e[t], i = e[t + 1], n = e[t + 2];
        if (typeof i != "function") {
          if (Rr(i || a) === null) continue;
          break;
        }
        var s = jl(a);
        s !== null && (e.splice(t, 3), t -= 3, Rc(s, {
          pending: !0,
          data: n,
          method: a.method,
          action: i
        }, i, n));
      }
    }));
  }
  function ti(e) {
    function t(f) {
      return bs(f, e);
    }
    Ya !== null && bs(Ya, e), Va !== null && bs(Va, e), Xa !== null && bs(Xa, e), $i.forEach(t), Wi.forEach(t);
    for (var a = 0; a < Qa.length; a++) {
      var i = Qa[a];
      i.blockedOn === e && (i.blockedOn = null);
    }
    for (; 0 < Qa.length && (a = Qa[0], a.blockedOn === null); ) Fp(a), a.blockedOn === null && Qa.shift();
    if (a = (e.ownerDocument || e).$$reactFormReplay, a != null) for (i = 0; i < a.length; i += 3) {
      var n = a[i], s = a[i + 1], c = n[yt] || null;
      if (typeof s == "function") c || ef(a);
      else if (c) {
        var d = null;
        if (s && s.hasAttribute("formAction")) {
          if (n = s, c = s[yt] || null) d = c.formAction;
          else if (Rr(n) !== null) continue;
        } else d = c.action;
        typeof d == "function" ? a[i + 1] = d : (a.splice(i, 3), i -= 3), ef(a);
      }
    }
  }
  function Oh() {
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
  function Hr(e) {
    this._internalRoot = e;
  }
  Lr.prototype.render = Hr.prototype.render = function(e) {
    var t = this._internalRoot;
    if (t === null) throw Error(o(409));
    var a = t.current;
    Zp(a, Xt(), e, t, null, null);
  }, Lr.prototype.unmount = Hr.prototype.unmount = function() {
    var e = this._internalRoot;
    if (e !== null) {
      this._internalRoot = null;
      var t = e.containerInfo;
      Zp(e.current, 2, null, e, null, null), es(), t[di] = null;
    }
  };
  function Lr(e) {
    this._internalRoot = e;
  }
  Lr.prototype.unstable_scheduleHydration = function(e) {
    if (e) {
      var t = hd();
      e = {
        blockedOn: null,
        target: e,
        priority: t
      };
      for (var a = 0; a < Qa.length && t !== 0 && t < Qa[a].priority; a++) ;
      Qa.splice(a, 0, e), a === 0 && Fp(e);
    }
  };
  var tf = C.version;
  if (tf !== "19.2.6") throw Error(o(527, tf, "19.2.6"));
  G.findDOMNode = function(e) {
    var t = e._reactInternals;
    if (t === void 0)
      throw typeof e.render == "function" ? Error(o(188)) : (e = Object.keys(e).join(","), Error(o(268, e)));
    return e = z(t), e = e !== null ? K(e) : null, e = e === null ? null : e.stateNode, e;
  };
  var Mh = {
    bundleType: 0,
    version: "19.2.6",
    rendererPackageName: "react-dom",
    currentDispatcherRef: B,
    reconcilerVersion: "19.2.6"
  };
  if (typeof __REACT_DEVTOOLS_GLOBAL_HOOK__ < "u") {
    var js = __REACT_DEVTOOLS_GLOBAL_HOOK__;
    if (!js.isDisabled && js.supportsFiber) try {
      Fe = js.inject(Mh), Xe = js;
    } catch {
    }
  }
  r.createRoot = function(e, t) {
    if (!M(e)) throw Error(o(299));
    var a = !1, i = "", n = T0, s = k0, c = A0;
    return t != null && (t.unstable_strictMode === !0 && (a = !0), t.identifierPrefix !== void 0 && (i = t.identifierPrefix), t.onUncaughtError !== void 0 && (n = t.onUncaughtError), t.onCaughtError !== void 0 && (s = t.onCaughtError), t.onRecoverableError !== void 0 && (c = t.onRecoverableError)), t = wh(e, 1, !1, null, null, a, i, null, n, s, c, Oh), e[di] = t.current, Sp(e), new Hr(t);
  };
})), Gh = /* @__PURE__ */ ia(((r, x) => {
  function C() {
    if (!(typeof __REACT_DEVTOOLS_GLOBAL_HOOK__ > "u" || typeof __REACT_DEVTOOLS_GLOBAL_HOOK__.checkDCE != "function"))
      try {
        __REACT_DEVTOOLS_GLOBAL_HOOK__.checkDCE(C);
      } catch (p) {
        console.error(p);
      }
  }
  C(), x.exports = Bh();
})), vf = (...r) => r.filter((x, C, p) => !!x && x.trim() !== "" && p.indexOf(x) === C).join(" ").trim(), Yh = (r) => r.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase(), Vh = (r) => r.replace(/^([A-Z])|[\s-_]+(\w)/g, (x, C, p) => p ? p.toUpperCase() : C.toLowerCase()), af = (r) => {
  const x = Vh(r);
  return x.charAt(0).toUpperCase() + x.slice(1);
}, Br = {
  xmlns: "http://www.w3.org/2000/svg",
  width: 24,
  height: 24,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round",
  strokeLinejoin: "round"
}, Xh = (r) => {
  for (const x in r) if (x.startsWith("aria-") || x === "role" || x === "title") return !0;
  return !1;
}, k = id(), Qh = (0, k.createContext)({}), Zh = () => (0, k.useContext)(Qh), Kh = (0, k.forwardRef)(({ color: r, size: x, strokeWidth: C, absoluteStrokeWidth: p, className: o = "", children: M, iconNode: S, ...H }, T) => {
  const { size: A = 24, strokeWidth: z = 2, absoluteStrokeWidth: K = !1, color: U = "currentColor", className: ne = "" } = Zh() ?? {}, he = p ?? K ? Number(C ?? z) * 24 / Number(x ?? A) : C ?? z;
  return (0, k.createElement)("svg", {
    ref: T,
    ...Br,
    width: x ?? A ?? Br.width,
    height: x ?? A ?? Br.height,
    stroke: r ?? U,
    strokeWidth: he,
    className: vf("lucide", ne, o),
    ...!M && !Xh(H) && { "aria-hidden": "true" },
    ...H
  }, [...S.map(([I, $]) => (0, k.createElement)(I, $)), ...Array.isArray(M) ? M : [M]]);
}), He = (r, x) => {
  const C = (0, k.forwardRef)(({ className: p, ...o }, M) => (0, k.createElement)(Kh, {
    ref: M,
    iconNode: x,
    className: vf(`lucide-${Yh(af(r))}`, `lucide-${r}`, p),
    ...o
  }));
  return C.displayName = af(r), C;
}, Jh = [
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
], jf = He("archive", Jh), Ih = [["path", {
  d: "m12 19-7-7 7-7",
  key: "1l729n"
}], ["path", {
  d: "M19 12H5",
  key: "x3x0zl"
}]], lf = He("arrow-left", Ih), $h = [["path", {
  d: "M5 12h14",
  key: "1ays0h"
}], ["path", {
  d: "m12 5 7 7-7 7",
  key: "xquz4c"
}]], li = He("arrow-right", $h), Wh = [["path", {
  d: "M7 7h10v10",
  key: "1tivn9"
}], ["path", {
  d: "M7 17 17 7",
  key: "1vkiza"
}]], Fh = He("arrow-up-right", Wh), Ph = [
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
], ed = He("box", Ph), em = [["path", {
  d: "M20 6 9 17l-5-5",
  key: "1gmf2c"
}]], ys = He("check", em), tm = [["path", {
  d: "m9 18 6-6-6-6",
  key: "mthhwq"
}]], nf = He("chevron-right", tm), am = [
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
], ii = He("circle-alert", am), lm = [
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
], ni = He("clapperboard", lm), im = [["circle", {
  cx: "12",
  cy: "12",
  r: "10",
  key: "1mglay"
}], ["path", {
  d: "M12 6v6h4",
  key: "135r8i"
}]], yf = He("clock-3", im), nm = [
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
], sm = He("code-xml", nm), cm = [["rect", {
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
}]], Sf = He("copy", cm), rm = [
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
], nd = He("download", rm), dm = [
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
], xl = He("file-check-corner", dm), om = [
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
], Gr = He("film", om), um = [["path", {
  d: "m6 14 1.5-2.9A2 2 0 0 1 9.24 10H20a2 2 0 0 1 1.94 2.5l-1.54 6a2 2 0 0 1-1.95 1.5H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h3.9a2 2 0 0 1 1.69.9l.81 1.2a2 2 0 0 0 1.67.9H18a2 2 0 0 1 2 2v2",
  key: "usdka0"
}]], Yr = He("folder-open", um), pm = [
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
], Pi = He("git-branch", pm), fm = [
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
], hm = He("layers", fm), mm = [
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
], sf = He("layout-grid", mm), xm = [
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
], sd = He("link-2", xm), gm = [
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
], bm = He("list-checks", gm), vm = [["path", {
  d: "M21 12a9 9 0 1 1-6.219-8.56",
  key: "13zald"
}]], Vr = He("loader-circle", vm), jm = [
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
], td = He("lock-keyhole", jm), ym = [["path", {
  d: "M22 17a2 2 0 0 1-2 2H6.828a2 2 0 0 0-1.414.586l-2.202 2.202A.71.71 0 0 1 2 21.286V5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2z",
  key: "18887p"
}]], Xr = He("message-square", ym), Sm = [["path", {
  d: "M5 12h14",
  key: "1ays0h"
}], ["path", {
  d: "M12 5v14",
  key: "s699le"
}]], Pt = He("plus", Sm), zm = [
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
], cd = He("refresh-cw", zm), Nm = [["path", {
  d: "M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8",
  key: "1357e3"
}], ["path", {
  d: "M3 3v5h5",
  key: "1xhq8a"
}]], wm = He("rotate-ccw", Nm), _m = [["path", {
  d: "m21 21-4.34-4.34",
  key: "14j7rj"
}], ["circle", {
  cx: "11",
  cy: "11",
  r: "8",
  key: "4ej97u"
}]], zf = He("search", _m), Em = [["path", {
  d: "M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z",
  key: "oel41y"
}], ["path", {
  d: "m9 12 2 2 4-4",
  key: "dzmm74"
}]], si = He("shield-check", Em), Tm = [["path", {
  d: "M18 6 6 18",
  key: "1bl5f8"
}], ["path", {
  d: "m6 6 12 12",
  key: "d8bk6v"
}]], Ns = He("x", Tm), km = Gh(), Na = [
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
], Am = class extends Error {
  constructor(r, x = 400) {
    super(r), this.status = x;
  }
}, cf = (r, x = 400) => {
  throw new Am(r, x);
};
function Es(r) {
  return r.modelFlow ?? {
    models: [],
    issues: [],
    packs: [],
    pins: [],
    history: []
  };
}
function Cm(r, x, C) {
  const p = Es(r).models.find((M) => M.id === x || M.key === x);
  p || cf("找不到模型");
  const o = p.versions.find((M) => M.id === C);
  return o || cf("找不到指定模型版本"), {
    m: p,
    v: o
  };
}
function Om(r, x, C, p) {
  const { v: o } = Cm(r, x, C), M = o.stages[p], S = Na.findIndex((T) => T.id === p), H = [];
  return S > 0 && !o.stages[Na[S - 1].id].author && H.push("先核定 " + Na[S - 1].title), M.checks.every(Boolean) || H.push("完成本階段全部檢查"), M.evidence || H.push("填入實際產出或檢查報告位置"), (!M.summary || !M.nextStep) && H.push("填寫已做內容與接手下一步"), p === "M01" && (!o.sourceLocation || !o.sourceVersion || !o.backupLocation || !o.sha256) && H.push("補齊原檔版本、獨立備份與 SHA-256"), p === "M02" && !o.reference && H.push("補入設定及尺度來源"), S >= 3 && !o.candidateLocation && H.push("登記獨立候選 GLB"), Es(r).issues.some((T) => T.modelId === x && T.versionId === C && T.status === "open" && (T.stageId === p || S >= 6 || T.kind === "major" && S >= 3)) && H.push("處理適用的待修或待裁定問題"), H;
}
var Mm = [
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
], Dm = [
  "唯一音軌",
  "音樂分析",
  "段落與節點",
  "鏡頭安排",
  "影格與動畫",
  "對音樂試剪",
  "支線驗收",
  "插入全片"
], Um = [
  ["已指定唯一使用音軌與版本；換音軌需重核切點"],
  ["已實際分析音樂、歌詞與節奏"],
  ["段落與重要音樂節點已標記"],
  ["鏡頭與音樂、主題、劇透範圍相符"],
  ["人物與主線一致，影格及動畫已驗收"],
  ["已按指定音軌核對切點與實際長度"],
  ["無不必要重複鏡頭，劇透範圍及情緒合適"],
  ["通過支線已插入剪輯專案，入點與出點可查"]
], Kt = [...Mm.map((r) => ({
  ...r,
  group: "main"
})), ...["op", "ed"].flatMap((r) => Dm.map((x, C) => ({
  id: r + String(C + 1).padStart(2, "0"),
  title: x,
  group: r,
  phase: r.toUpperCase() + " 支線",
  description: r === "op" ? "OP 以作品印象、人物關係及主題為主。" : "ED 以情緒收束及畫面變化為主。",
  output: x === "唯一音軌" ? "由作者在有效資料中指定音軌、版本與長度" : x,
  checks: Um[C],
  deps: C ? [r + String(C).padStart(2, "0")] : ["03"]
})))], Rm = [
  "script",
  "character",
  "scene",
  "voice",
  "op_audio",
  "ed_audio",
  "edit"
];
function ci(r) {
  return [...new Map(r.map((x) => [x.key, x])).values()];
}
function Ka(r) {
  return ci(r.filter((x) => x.status === "adopted" || x.status === "withdrawn")).filter((x) => x.status === "adopted");
}
function qm(r) {
  return {
    projectId: r.id,
    workId: r.workId,
    episode: r.episode,
    revision: r.revision,
    workflowSchema: r.workflowSchema ?? 1,
    genericChecks: Ts(r).map(({ id: x, title: C, checks: p }) => ({
      id: x,
      title: C,
      checks: p
    })),
    rules: ci(r.episodeRules ?? []),
    adoptedRules: Ka(r.episodeRules ?? []),
    baselines: ci(r.baselines ?? []),
    adoptedBaselines: Ka(r.baselines ?? []),
    legacy: r.workflowLegacy ?? null,
    rule: "通用流程不含單集劇情條件。本集規則與採用清單各自保存版本，候選不取代已採用版，另一集須另行指定；檔案位置未驗看。"
  };
}
function Hm(r) {
  return {
    id: r.id,
    title: r.title,
    revision: r.revision,
    updatedAt: r.updatedAt,
    sharedCount: new Set(r.sharedAssets.map((x) => x.key)).size
  };
}
var Nf = class extends Error {
  constructor(r, x = 400) {
    super(r), this.status = x;
  }
};
function Ts(r) {
  return Kt.filter((x) => x.group === "main" || r.branches[x.group]);
}
function ws(r, x) {
  const C = Kt.find((p) => p.id === x);
  if (!C) throw new Nf("找不到階段");
  return C.deps.filter((p) => Ts(r).some((o) => o.id === p) && !r.stages[p].author).map((p) => `${p} ${Kt.find((o) => o.id === p)?.title}`);
}
function wf(r, x) {
  const C = r.stages[x], p = ws(r, x).map((M) => "先完成 " + M), o = Kt.find((M) => M.id === x).checks.length;
  return (C.checks.length < o || !C.checks.slice(0, o).every(Boolean)) && p.push("勾選全部驗收項目"), C.evidence.trim() || p.push("填入產出連結或檔案位置"), r.issues.some((M) => M.status === "open" && M.stageId === x) && p.push("處理此階段未結問題"), gl(r).problems.some((M) => M.status === "open" && (M.scope.type === "project" || M.scope.type === "stage" && M.scope.target === x || x === "12")) && p.push("處理適用範圍內的資訊矛盾或缺件"), x === "12" && (r.issues.some((M) => M.status === "open") && p.push("結清全部退修問題"), r.shots.some((M) => M.status !== "in_timeline") && p.push("總表中所有鏡頭須通過並入片"), r.shots.length || p.push("建立實際採用鏡頭與入片紀錄")), p;
}
function ad(r) {
  const x = Ts(r);
  return {
    id: r.id,
    workId: r.workId ?? "",
    title: r.title,
    episode: r.episode,
    revision: r.revision,
    archived: r.archived,
    updatedAt: r.updatedAt,
    completionReport: r.production?.completionReports?.at(-1) ?? null,
    approved: x.filter((C) => r.stages[C.id].author).length,
    total: x.length,
    openIssues: r.issues.filter((C) => C.status === "open").length,
    shots: r.shots.length,
    inTimeline: r.shots.filter((C) => C.status === "in_timeline").length,
    lastMcpAt: r.lastMcpAt,
    next: x.filter((C) => !r.stages[C.id].author && !ws(r, C.id).length).map((C) => ({
      id: C.id,
      title: C.title,
      reasons: wf(r, C.id)
    }))
  };
}
function rd(r) {
  const x = gl(r), C = [...new Map((r.production?.links ?? []).map((o) => [o.shotId, o])).values()], p = [...new Map((r.production?.selections ?? []).map((o) => [o.shotId, o])).values()];
  return {
    project: ad(r),
    settings: {
      rules: Ka(r.episodeRules ?? []).length,
      adopted: Ka(r.baselines ?? []).map(({ key: o, title: M, category: S, version: H, recordVersion: T, externalVersion: A }) => ({
        key: o,
        title: M,
        category: S,
        version: H,
        recordVersion: T,
        externalVersion: A
      })),
      pending: ci(r.baselines ?? []).filter((o) => o.status === "unresolved" || o.status === "reference").map(({ key: o, title: M, status: S, note: H }) => ({
        key: o,
        title: M,
        status: S,
        note: H
      }))
    },
    registration: {
      sources: x.records.length,
      acceptedSources: x.records.filter(an).length,
      shots: r.shots.length,
      linkedShots: C.length,
      locatedFrames: C.filter((o) => o.references.length).length,
      registeredSelections: (/* @__PURE__ */ new Set([...p.map((o) => o.shotId), ...C.filter((o) => o.adoptedOutput).map((o) => o.shotId)])).size,
      timelineRegistrations: p.filter((o) => o.editorVersion && o.inPoint && o.outPoint).length
    },
    outgoing: r.production?.handoffs?.at(-1) ?? null,
    openProblems: x.problems.filter((o) => o.status === "open"),
    lastWork: x.results.at(-1) ?? null,
    rule: "作者告知的製作完成、資料補登與素材實際檢視分開記錄。未登記的素材不推定未製作；接續整理保留來源，未對上成片的情節不得自動套用下一集。"
  };
}
var en = {
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
}, Lm = [
  "rule",
  "script",
  "character",
  "scene",
  "audio",
  "reference"
];
function gl(r) {
  return r.knowledge ?? {
    records: [],
    problems: [],
    packs: [],
    results: []
  };
}
function an(r) {
  return r.approval?.verdict === "source_accepted" || r.status === "effective";
}
function Qr(r, x) {
  return (r.production?.sections.find((C) => C.stageId === x)?.gaps ?? []).map((C, p) => {
    const o = [...r.production?.supplements ?? []].reverse().find((M) => M.stageId === x && M.gapIndex === p && M.gap === C);
    return {
      index: p,
      description: C,
      status: o ? "filled" : "open",
      record: o ? gl(r).records.find((M) => M.id === o.recordId) ?? null : null
    };
  });
}
function Bm(r, x) {
  if (r.workId && (!x || x.id !== r.workId) || x && x.id !== r.workId) throw new Nf("集數與作品不相符", 400);
  const C = rd(r), p = x ? Es(x) : null, o = (p?.models ?? []).map((S) => {
    const H = S.versions.at(-1), T = [...p?.history ?? []].reverse().find((K) => K.modelId === S.id && K.versionId === H.id && K.action === "save_model_stage"), A = Na.find((K) => !H.stages[K.id].author) ?? Na[7], z = S.versions.find((K) => K.id === S.adoptedVersionId);
    return {
      modelId: S.id,
      key: S.key,
      title: S.title,
      versionId: H.id,
      label: H.label,
      adopted: z ? {
        versionId: z.id,
        label: z.label
      } : null,
      sourceLocation: H.sourceLocation,
      candidateLocation: H.candidateLocation,
      stageId: A.id,
      stageTitle: A.title,
      approved: Na.filter((K) => H.stages[K.id].author).length,
      lastWork: T ? {
        at: T.at,
        stageId: T.stageId,
        summary: H.stages[T.stageId].summary,
        evidence: H.stages[T.stageId].evidence,
        nextStep: H.stages[T.stageId].nextStep
      } : null,
      openIssues: p.issues.filter((K) => K.modelId === S.id && K.versionId === H.id && K.status === "open"),
      nextStep: T ? H.stages[T.stageId].nextStep : "尚無工作回報；先讀取模型來源與指定版本，再取得任務資料包。"
    };
  }), M = [...new Map((p?.pins ?? []).filter((S) => S.episodeId === r.id).map((S) => [[S.modelId, S.sceneIds].join("|"), S])).values()].map((S) => {
    const H = p.models.find((A) => A.id === S.modelId), T = H?.versions.find((A) => A.id === S.versionId);
    return {
      ...S,
      title: H?.title ?? S.modelId,
      label: T?.label ?? S.versionId
    };
  });
  return {
    schemaVersion: 1,
    projectId: r.id,
    episodeCode: r.episode,
    title: x?.title ?? r.title,
    projectRevision: r.revision,
    workId: x?.id ?? null,
    workRevision: x?.revision ?? null,
    episode: C,
    models: o,
    pins: M,
    issues: {
      animation: r.issues.filter((S) => S.status === "open"),
      context: C.openProblems,
      models: p?.issues.filter((S) => S.status === "open") ?? []
    },
    lastToolWrite: [r.lastMcpAt, ...(p?.history ?? []).filter((S) => S.actor === "ai").map((S) => S.at)].filter((S) => !!S).sort().at(-1) ?? null,
    policy: "此總覽唯讀，不是工作資料包。動畫與模型共用作品入口，各自保留精確版本與資料包。模型清單顯示最新登記候選，採用版及本集引用另列，禁止自動替換。作者告知完成不等於逐項素材驗看；未登記不推定未製作。執行前取得對應範圍的新資料包，實際讀取來源後才回報；不得代替作者核定。"
  };
}
var Gm = /* @__PURE__ */ ia(((r) => {
  var x = /* @__PURE__ */ Symbol.for("react.transitional.element"), C = /* @__PURE__ */ Symbol.for("react.fragment");
  function p(o, M, S) {
    var H = null;
    if (S !== void 0 && (H = "" + S), M.key !== void 0 && (H = "" + M.key), "key" in M) {
      S = {};
      for (var T in M) T !== "key" && (S[T] = M[T]);
    } else S = M;
    return M = S.ref, {
      $$typeof: x,
      type: o,
      key: H,
      ref: M !== void 0 ? M : null,
      props: S
    };
  }
  r.Fragment = C, r.jsx = p, r.jsxs = p;
})), Ym = /* @__PURE__ */ ia(((r, x) => {
  x.exports = Gm();
})), l = Ym(), rf = (r) => r ? new Date(r).toLocaleString("zh-TW", { timeZone: "Asia/Taipei" }) : "尚無紀錄";
function Vm(r, x) {
  const C = URL.createObjectURL(new Blob([x], { type: "text/plain;charset=utf-8" })), p = document.createElement("a");
  p.href = C, p.download = r, p.click(), setTimeout(() => URL.revokeObjectURL(C), 1e3);
}
function Xm({ project: r, work: x, busy: C, onNavigate: p, onModel: o }) {
  const M = Bm(r, x), [S, H] = (0, k.useState)(""), [T, A] = (0, k.useState)(""), [z, K] = (0, k.useState)("animation"), U = M.models.find((V) => V.versionId === z), ne = M.episode.lastWork, he = M.issues.animation.length + M.issues.context.length + M.issues.models.length, I = `請使用「立之雲端庫｜動畫製作流程」工具，接手 ${M.title}／${r.episode}。先呼叫 read_animation_workspace({projectId:${JSON.stringify(r.id)}})，重新讀取伺服器最新資料，不使用本段文字中的舊 revision。
${U ? `本次範圍為模型 ${U.key}（modelId=${U.modelId}），精確版本 ${U.label}（versionId=${U.versionId}），定位階段 ${U.stageId}。workId=${x.id}。用 read_animation_models 查此版本的全部來源、問題及最近回報，確認實際任務範圍後，用 acquire_animation_model_context 取得新資料包；完成後用 update_animation_model_stage 回報。最新候選不等於已採用版。` : `本次範圍為 ${r.episode} 動畫。先讀 read_animation_episode_brief 與 read_animation_episode_settings，再依最近交接確認任務。用 preview_animation_context 檢查指定範圍，acquire_animation_context 保存資料包，以 submit_animation_work 回報。作者已告知完成的集數以資料補登為主，不因紀錄空白重做。`}
實際讀取所需素材後才執行，缺件、矛盾或過期資料包先回報受阻。寫回已做內容、產出位置與版本、未解問題及下一步。保留原檔、作者採用版本與各集固定引用，不能自行正式核定。若目前對話沒有上述工具，明確告知尚未接通，不宣稱已讀取或已回寫。`, [$, de] = (0, k.useState)(!1), Q = M.episode.project.completionReport?.status === "completed", oe = [
    ...M.issues.context.map((V) => ({
      id: V.id,
      text: V.description,
      tab: "context"
    })),
    ...M.issues.animation.map((V) => ({
      id: V.id,
      text: V.reason,
      tab: "issues"
    })),
    ...M.issues.models.map((V) => ({
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
          /* @__PURE__ */ (0, l.jsx)("h2", { children: Q ? "本集已完成，繼續整理製作紀錄" : ne ? "接著完成上次的工作" : "從本集製作資料開始" }),
          /* @__PURE__ */ (0, l.jsx)("p", { children: ne?.nextStep || (Q ? "補上採用檔案與製作過程，讓下一集和下一位 AI 都能接著用。" : "先整理劇本、角色與場景參考，再開始製作。") }),
          /* @__PURE__ */ (0, l.jsxs)("div", {
            className: "context-actions",
            children: [/* @__PURE__ */ (0, l.jsxs)("button", {
              className: "btn primary",
              disabled: C,
              onClick: () => p("context"),
              children: [
                Q ? "繼續整理資料" : "開啟製作資料",
                " ",
                /* @__PURE__ */ (0, l.jsx)(li, { size: 16 })
              ]
            }), /* @__PURE__ */ (0, l.jsx)("button", {
              className: "btn",
              onClick: () => de(!$),
              "aria-expanded": $,
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
            /* @__PURE__ */ (0, l.jsx)("strong", { children: Q ? "已完成" : M.episode.project.completionReport?.status === "in_progress" ? "製作中" : "尚未登記" }),
            /* @__PURE__ */ (0, l.jsx)("small", { children: "依作者登記" })
          ] }),
          /* @__PURE__ */ (0, l.jsxs)("div", { children: [
            /* @__PURE__ */ (0, l.jsx)("span", { children: "未處理問題" }),
            /* @__PURE__ */ (0, l.jsxs)("strong", { children: [he, /* @__PURE__ */ (0, l.jsx)("em", { children: " 項" })] }),
            /* @__PURE__ */ (0, l.jsx)("small", { children: "動畫、資料與模型合計" })
          ] }),
          /* @__PURE__ */ (0, l.jsxs)("button", {
            onClick: () => p("models"),
            children: [
              /* @__PURE__ */ (0, l.jsx)("span", { children: "共用模型" }),
              /* @__PURE__ */ (0, l.jsxs)("strong", { children: [M.models.length, /* @__PURE__ */ (0, l.jsx)("em", { children: " 個" })] }),
              /* @__PURE__ */ (0, l.jsx)("small", { children: "依已登記模型" })
            ]
          })
        ]
      }),
      $ && /* @__PURE__ */ (0, l.jsxs)("article", {
        className: "wide-card ai-handoff",
        children: [
          /* @__PURE__ */ (0, l.jsxs)("div", {
            className: "section-title",
            children: [/* @__PURE__ */ (0, l.jsx)("h2", { children: "把這次工作交給 ChatGPT" }), /* @__PURE__ */ (0, l.jsx)("button", {
              className: "text-btn",
              onClick: () => de(!1),
              children: "收起"
            })]
          }),
          /* @__PURE__ */ (0, l.jsx)("p", { children: "在已連接工作台的對話貼上指令，AI 會先讀取最新進度。" }),
          /* @__PURE__ */ (0, l.jsxs)("label", {
            className: "form-field",
            children: ["要接手的工作", /* @__PURE__ */ (0, l.jsxs)("select", {
              value: z,
              onChange: (V) => K(V.target.value),
              children: [/* @__PURE__ */ (0, l.jsxs)("option", {
                value: "animation",
                children: [r.episode, " 動畫與資料整理"]
              }), M.models.map((V) => /* @__PURE__ */ (0, l.jsxs)("option", {
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
                  await navigator.clipboard.writeText(I), H("已複製，請貼到已連接工作台的 ChatGPT 對話。");
                } catch {
                  H("無法直接複製，請展開完整指令後手動複製。");
                }
              },
              children: [/* @__PURE__ */ (0, l.jsx)(Sf, { size: 15 }), "複製接手指令"]
            }), /* @__PURE__ */ (0, l.jsx)("button", {
              className: "btn",
              onClick: () => p("chatgpt"),
              children: "查看連接方式"
            })]
          }),
          /* @__PURE__ */ (0, l.jsx)("p", {
            role: "status",
            children: S
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
              onClick: () => Vm(r.episode + "_AI接續指令.txt", I),
              children: [/* @__PURE__ */ (0, l.jsx)(nd, { size: 15 }), "下載指令"]
            })
          ] }),
          /* @__PURE__ */ (0, l.jsxs)("small", { children: [
            "複製指令不會自動啟動 AI。最近寫入：",
            rf(M.lastToolWrite),
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
                onClick: () => p("main"),
                children: [
                  /* @__PURE__ */ (0, l.jsx)(xl, { size: 22 }),
                  /* @__PURE__ */ (0, l.jsxs)("span", { children: [/* @__PURE__ */ (0, l.jsx)("b", { children: "動畫製作" }), /* @__PURE__ */ (0, l.jsx)("small", { children: "主線、片頭片尾與鏡頭素材" })] }),
                  /* @__PURE__ */ (0, l.jsx)(li, { size: 17 })
                ]
              }),
              /* @__PURE__ */ (0, l.jsxs)("button", {
                onClick: () => p("models"),
                children: [
                  /* @__PURE__ */ (0, l.jsx)(ed, { size: 22 }),
                  /* @__PURE__ */ (0, l.jsxs)("span", { children: [/* @__PURE__ */ (0, l.jsx)("b", { children: "3D 模型" }), /* @__PURE__ */ (0, l.jsx)("small", { children: "模型版本、檢查與採用紀錄" })] }),
                  /* @__PURE__ */ (0, l.jsx)(li, { size: 17 })
                ]
              }),
              /* @__PURE__ */ (0, l.jsxs)("button", {
                onClick: () => p("project"),
                children: [
                  /* @__PURE__ */ (0, l.jsx)(yf, { size: 22 }),
                  /* @__PURE__ */ (0, l.jsxs)("span", { children: [/* @__PURE__ */ (0, l.jsx)("b", { children: "作品與後續集數" }), /* @__PURE__ */ (0, l.jsx)("small", { children: "管理集數與共用參考資料" })] }),
                  /* @__PURE__ */ (0, l.jsx)(li, { size: 17 })
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
              children: [he, " 項"]
            })]
          }), oe.length ? /* @__PURE__ */ (0, l.jsxs)("div", {
            className: "attention-list",
            children: [oe.slice(0, 3).map((V) => /* @__PURE__ */ (0, l.jsxs)("button", {
              onClick: () => p(V.tab),
              children: [
                /* @__PURE__ */ (0, l.jsx)(ii, { size: 17 }),
                /* @__PURE__ */ (0, l.jsx)("span", { children: V.text }),
                /* @__PURE__ */ (0, l.jsx)(li, { size: 15 })
              ]
            }, V.id)), oe.length > 3 && /* @__PURE__ */ (0, l.jsxs)("details", { children: [/* @__PURE__ */ (0, l.jsxs)("summary", { children: [
              "其餘 ",
              oe.length - 3,
              " 項問題"
            ] }), oe.slice(3).map((V) => /* @__PURE__ */ (0, l.jsx)("button", {
              onClick: () => p(V.tab),
              children: V.text
            }, V.id))] })]
          }) : /* @__PURE__ */ (0, l.jsxs)("div", {
            className: "quiet-state",
            children: [
              /* @__PURE__ */ (0, l.jsx)(xl, { size: 28 }),
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
          ne ? /* @__PURE__ */ (0, l.jsxs)(l.Fragment, { children: [
            /* @__PURE__ */ (0, l.jsx)("h3", { children: ne.task }),
            /* @__PURE__ */ (0, l.jsx)("p", { children: ne.summary }),
            ne.needsReview && /* @__PURE__ */ (0, l.jsx)("p", {
              className: "resume-warning",
              children: "採用依據有更新，接手前請重新讀取。"
            }),
            /* @__PURE__ */ (0, l.jsx)("small", { children: rf(ne.at) })
          ] }) : /* @__PURE__ */ (0, l.jsx)("p", { children: "尚無 AI 工作回報；這不代表沒有製作成果。" }),
          M.models.map((V) => /* @__PURE__ */ (0, l.jsxs)("div", {
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
              disabled: C,
              onClick: () => o({
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
              M.pins.length,
              "）"
            ] }),
            M.pins.map((V, W) => /* @__PURE__ */ (0, l.jsxs)("p", { children: [
              V.title,
              " · ",
              V.label,
              " · ",
              V.purpose
            ] }, W)),
            /* @__PURE__ */ (0, l.jsx)("button", {
              className: "btn",
              onClick: () => p("settings"),
              children: "查看採用設定"
            })
          ] }),
          /* @__PURE__ */ (0, l.jsxs)("details", { children: [
            /* @__PURE__ */ (0, l.jsx)("summary", { children: "AI 接手識別資料" }),
            /* @__PURE__ */ (0, l.jsxs)("p", { children: ["集數 ID：", r.id] }),
            /* @__PURE__ */ (0, l.jsxs)("p", { children: ["作品 ID：", x?.id || "未歸屬"] }),
            /* @__PURE__ */ (0, l.jsxs)("p", { children: ["資料版本：", r.revision] })
          ] })
        ]
      })
    ]
  });
}
function Qm({ project: r, check: x }) {
  const [C, p] = (0, k.useState)(!1), [o, M] = (0, k.useState)(""), [S, H] = (0, k.useState)(""), T = `請使用「立之雲端庫｜動畫製作流程」外掛，先呼叫 read_animation_workspace，projectId 為 ${r.id}，確認 ${r.episode} 的目前進度、採用版本、未解問題與下一步。請重新讀取最新資料，不從聊天推定完成。若本集已由作者告知完成，先做資料補登。確認範圍後取得新的工作資料包，實際讀取參考素材，最後回報已做內容、成果位置、未完成項及下一步。若本對話沒有工具，請明確告知未連接。`;
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
              await navigator.clipboard.writeText(T), H("已複製，請貼到選用工作台的對話。");
            } catch {
              H("請展開完整指令後手動複製。");
            }
          },
          children: [/* @__PURE__ */ (0, l.jsx)(Sf, { size: 16 }), "複製本集接手指令"]
        }),
        /* @__PURE__ */ (0, l.jsx)("p", {
          role: "status",
          children: S
        }),
        /* @__PURE__ */ (0, l.jsxs)("details", { children: [/* @__PURE__ */ (0, l.jsx)("summary", { children: "查看完整指令" }), /* @__PURE__ */ (0, l.jsx)("textarea", {
          "aria-label": "本集接手指令",
          readOnly: !0,
          rows: 7,
          value: T
        })] })
      ]
    }), /* @__PURE__ */ (0, l.jsxs)("article", {
      className: "wide-card",
      children: [
        /* @__PURE__ */ (0, l.jsxs)("h2", { children: [/* @__PURE__ */ (0, l.jsx)(sd, { size: 20 }), " 連線與最近更新"] }),
        /* @__PURE__ */ (0, l.jsx)("p", { children: "網頁連線與對話工具是兩個檢查項目；這個按鈕會檢查網頁能否讀取共用資料。" }),
        /* @__PURE__ */ (0, l.jsxs)("button", {
          className: "btn",
          disabled: C,
          onClick: async () => {
            p(!0), M("");
            try {
              await x(), M("共用資料讀取成功。對話是否已選用外掛，仍需由 ChatGPT 實際呼叫工具確認。");
            } catch (A) {
              M("讀取失敗：" + (A instanceof Error ? A.message : String(A)));
            } finally {
              p(!1);
            }
          },
          children: [/* @__PURE__ */ (0, l.jsx)(cd, {
            size: 15,
            className: C ? "spin" : ""
          }), C ? "檢查中…" : "檢查資料連線"]
        }),
        /* @__PURE__ */ (0, l.jsx)("p", {
          role: "status",
          children: o
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
var df = {
  rule: "規則／決策",
  script: "劇本／台詞",
  character: "角色",
  scene: "場景",
  audio: "聲音",
  reference: "原作／參考"
};
function Zm({ project: r, busy: x, mutate: C }) {
  const [p, o] = (0, k.useState)(""), [M, S] = (0, k.useState)(""), [H, T] = (0, k.useState)(""), [A, z] = (0, k.useState)(30), [K, U] = (0, k.useState)("main"), [ne, he] = (0, k.useState)(null), [I, $] = (0, k.useState)(""), [de, Q] = (0, k.useState)(""), [oe, V] = (0, k.useState)({
    content: "",
    source: "",
    location: ""
  }), W = gl(r).records, P = r.production?.sections ?? [], ge = P.find((g) => g.stageId === p), pe = W.filter(an).length, Y = Qr(r, p), j = P.reduce((g, ee) => g + Qr(r, ee.stageId).filter((X) => X.status === "open").length, 0), Z = new Set(P.flatMap((g) => g.recordKeys)), Se = W.filter((g) => (!p || ge?.recordKeys.includes(g.key) || g.scope.type === "stage" && g.scope.target === p) && (!H || g.kind === H) && (!M || [
    g.title,
    g.key,
    g.content,
    g.source,
    g.scope.target
  ].join(" ").toLowerCase().includes(M.toLowerCase()))).sort((g, ee) => (g.key.startsWith("ep01_src_") ? 1 : Z.has(g.key) ? 0 : 2) - (ee.key.startsWith("ep01_src_") ? 1 : Z.has(ee.key) ? 0 : 2));
  async function qe(g) {
    if (he(null), $(""), !!g)
      try {
        if (g.size > 15e5) throw new Error("資料包不可超過 1.5 MB");
        const ee = JSON.parse(await g.text());
        if (ee.schemaVersion !== 1 || ee.episode !== r.episode || !Array.isArray(ee.records) || !Array.isArray(ee.shots) || !Array.isArray(ee.sections)) throw new Error("請選擇相同集數的製作資料包");
        he(ee);
      } catch (ee) {
        $(ee instanceof Error ? ee.message : "資料包讀取失敗");
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
        /* @__PURE__ */ (0, l.jsxs)("b", { children: [pe, " 筆已確認收錄"] }),
        /* @__PURE__ */ (0, l.jsx)("p", { children: r.production.acceptance.note }),
        /* @__PURE__ */ (0, l.jsxs)("p", { children: [
          "補齊已開放 · ",
          j,
          " 項待補。可直接保存補充內容，不需逐筆再確認。不同來源版本保留，採用版本另行指定。"
        ] })
      ] }) : /* @__PURE__ */ (0, l.jsxs)(l.Fragment, { children: [/* @__PURE__ */ (0, l.jsx)("p", { children: "依作者確認，將已完成的資料一次通過，並開放剩餘項目直接補齊。" }), /* @__PURE__ */ (0, l.jsx)("button", {
        className: "btn primary",
        disabled: x || r.archived || !P.length,
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
          value: M,
          onChange: (g) => {
            S(g.target.value), z(30);
          }
        })] }),
        /* @__PURE__ */ (0, l.jsxs)("label", { children: ["製作階段", /* @__PURE__ */ (0, l.jsxs)("select", {
          value: p,
          onChange: (g) => {
            o(g.target.value), z(30);
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
          value: H,
          onChange: (g) => {
            T(g.target.value), z(30);
          },
          children: [/* @__PURE__ */ (0, l.jsx)("option", {
            value: "",
            children: "全部種類"
          }), Object.entries(df).map(([g, ee]) => /* @__PURE__ */ (0, l.jsx)("option", {
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
        className: K === g ? "active" : "",
        onClick: () => U(g),
        children: ee
      }, g))
    }),
    /* @__PURE__ */ (0, l.jsx)("div", {
      className: "production-grid",
      children: Kt.filter((g) => g.group === K).map((g) => {
        const ee = P.find((B) => B.stageId === g.id), X = Qr(r, g.id).filter((B) => B.status === "open").length;
        return /* @__PURE__ */ (0, l.jsxs)("button", {
          className: "production-stage " + (p === g.id ? "selected" : ""),
          onClick: () => {
            o(p === g.id ? "" : g.id), Q(""), z(30);
          },
          children: [
            /* @__PURE__ */ (0, l.jsx)("small", { children: g.group === "main" ? g.id : g.group.toUpperCase() + " " + g.id.slice(2) }),
            /* @__PURE__ */ (0, l.jsx)("b", { children: g.title }),
            /* @__PURE__ */ (0, l.jsx)("span", { children: ee ? ee.recordKeys.length + " 筆相關資料" : "尚未盤點" }),
            /* @__PURE__ */ (0, l.jsx)("em", { children: ee ? X + " 項待補" : "待補資料" })
          ]
        }, g.id);
      })
    }),
    ge && /* @__PURE__ */ (0, l.jsxs)("div", {
      className: "production-gaps",
      children: [
        /* @__PURE__ */ (0, l.jsxs)("h3", { children: [Kt.find((g) => g.id === p)?.title, " · 資料盤點"] }),
        /* @__PURE__ */ (0, l.jsx)("p", { children: ge.overview }),
        /* @__PURE__ */ (0, l.jsx)("b", { children: "補齊清單" }),
        Y.length ? /* @__PURE__ */ (0, l.jsx)("div", { children: Y.map((g) => /* @__PURE__ */ (0, l.jsxs)("article", {
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
            r.production?.supplementsOpen && (de === p + ":" + g.index ? /* @__PURE__ */ (0, l.jsxs)("form", {
              className: "context-form",
              onSubmit: async (ee) => {
                ee.preventDefault(), await C("supplement_production_data", {
                  stageId: p,
                  gapIndex: g.index,
                  ...oe
                }) && (Q(""), V({
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
                  onChange: (ee) => V({
                    ...oe,
                    content: ee.target.value
                  })
                })] }),
                /* @__PURE__ */ (0, l.jsxs)("label", { children: ["補件來源", /* @__PURE__ */ (0, l.jsx)("input", {
                  required: !0,
                  maxLength: 2e3,
                  value: oe.source,
                  onChange: (ee) => V({
                    ...oe,
                    source: ee.target.value
                  })
                })] }),
                /* @__PURE__ */ (0, l.jsxs)("label", { children: ["補件素材位置", /* @__PURE__ */ (0, l.jsx)("input", {
                  maxLength: 2e3,
                  value: oe.location,
                  onChange: (ee) => V({
                    ...oe,
                    location: ee.target.value
                  })
                })] }),
                /* @__PURE__ */ (0, l.jsxs)("div", {
                  className: "context-actions",
                  children: [/* @__PURE__ */ (0, l.jsx)("button", {
                    className: "btn",
                    type: "button",
                    onClick: () => Q(""),
                    children: "取消"
                  }), /* @__PURE__ */ (0, l.jsx)("button", {
                    className: "btn primary",
                    disabled: x || r.archived,
                    children: "直接保存補齊內容"
                  })]
                })
              ]
            }) : /* @__PURE__ */ (0, l.jsx)("button", {
              className: "btn",
              disabled: x || r.archived,
              onClick: () => {
                Q(p + ":" + g.index), V({
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
        Se.length,
        " 筆資料；展開可讀取完整內容與來源。"
      ]
    }),
    /* @__PURE__ */ (0, l.jsx)("div", {
      className: "production-records",
      children: Se.slice(0, A).map((g) => /* @__PURE__ */ (0, l.jsxs)("details", {
        className: "production-record",
        children: [
          /* @__PURE__ */ (0, l.jsxs)("summary", { children: [
            /* @__PURE__ */ (0, l.jsx)("span", {
              className: "status " + (an(g) ? "passed" : "candidate"),
              children: g.status === "effective" ? "採用版本" : g.status === "superseded" ? "已停用" : an(g) ? "資料已通過" : "來源資料／待確認"
            }),
            /* @__PURE__ */ (0, l.jsx)("b", { children: g.title }),
            /* @__PURE__ */ (0, l.jsxs)("small", { children: [
              df[g.kind],
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
    Se.length > A && /* @__PURE__ */ (0, l.jsx)("button", {
      className: "btn",
      onClick: () => z(A + 30),
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
          disabled: x || r.archived,
          onChange: (g) => {
            qe(g.target.files?.[0]);
          }
        })] }),
        I && /* @__PURE__ */ (0, l.jsx)("p", {
          role: "alert",
          children: I
        }),
        ne && /* @__PURE__ */ (0, l.jsxs)("div", {
          className: "inline-note",
          children: [
            /* @__PURE__ */ (0, l.jsx)("b", { children: String(ne.title) }),
            /* @__PURE__ */ (0, l.jsxs)("p", { children: [
              String(ne.episode),
              " · ",
              ne.records.length,
              " 筆來源資料 · ",
              ne.shots.length,
              " 列待製作鏡頭 · ",
              ne.sections.length,
              " 個階段盤點"
            ] }),
            /* @__PURE__ */ (0, l.jsx)("button", {
              className: "btn primary",
              disabled: x || r.archived,
              onClick: async () => {
                await C("import_production_data", ne) && (he(null), o(""), S(""), T(""));
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
function Km({ shotId: r, selection: x, disabled: C, mutate: p }) {
  const o = [
    ["output", "實際採用檔位置"],
    ["outputVersion", "採用檔版本"],
    ["reason", "選用原因"],
    ["source", "採用依據來源"],
    ["editorVersion", "剪輯工程版本"],
    ["inPoint", "工程入點"],
    ["outPoint", "工程出點"]
  ], [M, S] = (0, k.useState)(() => Object.fromEntries(o.map(([H]) => [H, x?.[H] ?? ""])));
  return /* @__PURE__ */ (0, l.jsxs)("details", {
    className: "selection-editor",
    children: [/* @__PURE__ */ (0, l.jsx)("summary", { children: "登記採用檔與工程位置" }), /* @__PURE__ */ (0, l.jsxs)("form", {
      className: "context-form",
      onSubmit: async (H) => {
        H.preventDefault(), await p("register_shot_selection", {
          ...M,
          shotId: r,
          baseVersion: x?.version ?? 0
        });
      },
      children: [
        o.map(([H, T]) => /* @__PURE__ */ (0, l.jsxs)("label", { children: [T, /* @__PURE__ */ (0, l.jsx)("input", {
          required: [
            "output",
            "outputVersion",
            "reason",
            "source"
          ].includes(H),
          maxLength: H === "reason" ? 3e3 : 2e3,
          value: M[H],
          onChange: (A) => S({
            ...M,
            [H]: A.target.value
          })
        })] }, H)),
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
function Jm({ project: r, busy: x, mutate: C }) {
  const [p, o] = (0, k.useState)(""), [M, S] = (0, k.useState)(""), [H, T] = (0, k.useState)(""), [A, z] = (0, k.useState)(20), K = [...new Map((r.production?.selections ?? []).map((I) => [I.shotId, I])).values()], U = [...new Map((r.production?.links ?? []).map((I) => [I.shotId, I])).values()], ne = gl(r).records, he = r.shots.filter((I) => [
    I.id,
    I.scene,
    I.description,
    I.legacyIds
  ].join(" ").toLowerCase().includes(p.toLowerCase()));
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
          U.length,
          " / ",
          r.shots.length,
          " 列已建立關聯"
        ] }),
        /* @__PURE__ */ (0, l.jsxs)("b", { children: [U.filter((I) => I.references.length).length, " 列有影格來源定位"] }),
        /* @__PURE__ */ (0, l.jsxs)("b", { children: [(/* @__PURE__ */ new Set([...K.map((I) => I.shotId), ...U.filter((I) => I.adoptedOutput).map((I) => I.shotId)])).size, " 列已登記採用檔"] })
      ]
    }),
    /* @__PURE__ */ (0, l.jsxs)("label", {
      className: "work-search",
      children: ["搜尋鏡頭關聯", /* @__PURE__ */ (0, l.jsx)("input", {
        value: p,
        onChange: (I) => {
          o(I.target.value), z(20);
        },
        placeholder: "F077、G11、S06 或鏡頭 ID"
      })]
    }),
    he.slice(0, A).map((I) => {
      const $ = U.find((Q) => Q.shotId === I.id), de = K.find((Q) => Q.shotId === I.id);
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
            $ ? "關聯已建立" : "來源對應待補"
          ] })] }),
          /* @__PURE__ */ (0, l.jsx)("p", {
            className: "production-source-text",
            children: I.description
          }),
          $ ? /* @__PURE__ */ (0, l.jsxs)(l.Fragment, { children: [
            /* @__PURE__ */ (0, l.jsxs)("div", {
              className: "production-gaps",
              children: [
                /* @__PURE__ */ (0, l.jsx)("b", { children: "接著做什麼" }),
                /* @__PURE__ */ (0, l.jsx)("p", { children: de ? "採用檔已登記；接著開啟素材並對照工程版本與入出點。" : $.nextStep }),
                /* @__PURE__ */ (0, l.jsxs)("p", { children: ["採用檔：", de?.output || $.adoptedOutput || "位置尚未登記"] }),
                /* @__PURE__ */ (0, l.jsxs)("p", { children: ["選用原因：", de?.reason || $.selectionReason || "尚未登記"] }),
                $.unknowns.length > 0 && /* @__PURE__ */ (0, l.jsx)("p", {
                  className: "muted",
                  children: "來源盤點時的缺口；新增採用登記另列於下方。"
                }),
                $.unknowns.length > 0 && /* @__PURE__ */ (0, l.jsx)("ul", { children: $.unknowns.map((Q, oe) => /* @__PURE__ */ (0, l.jsx)("li", { children: Q }, oe)) })
              ]
            }),
            de && /* @__PURE__ */ (0, l.jsxs)("div", {
              className: "context-mini",
              children: [
                /* @__PURE__ */ (0, l.jsxs)("b", { children: [
                  "採用登記 v",
                  de.version,
                  " · ",
                  de.outputVersion
                ] }),
                /* @__PURE__ */ (0, l.jsxs)("p", { children: ["依據：", de.source] }),
                /* @__PURE__ */ (0, l.jsxs)("p", { children: [
                  "工程：",
                  de.editorVersion || "未登記",
                  " · ",
                  de.inPoint || "未登記",
                  " → ",
                  de.outPoint || "未登記"
                ] })
              ]
            }),
            /* @__PURE__ */ (0, l.jsx)("h3", { children: "使用依據與提示詞" }),
            $.recordKeys.map((Q) => {
              const oe = ne.find((V) => V.key === Q);
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
              }, Q) : null;
            }),
            /* @__PURE__ */ (0, l.jsx)("h3", { children: "來源影格定位" }),
            $.references.length ? $.references.map((Q, oe) => /* @__PURE__ */ (0, l.jsxs)("div", {
              className: "context-mini",
              children: [
                /* @__PURE__ */ (0, l.jsx)("b", { children: Q.file }),
                /* @__PURE__ */ (0, l.jsxs)("p", { children: ["素材包：", Q.archive] }),
                /* @__PURE__ */ (0, l.jsxs)("p", { children: ["包內位置：", Q.member] }),
                /* @__PURE__ */ (0, l.jsxs)("code", {
                  className: "context-id",
                  children: ["SHA-256 ", Q.sha256 || "來源未列"]
                }),
                /* @__PURE__ */ (0, l.jsx)("small", { children: "依來源索引定位；實際圖像讀取狀態另記。" })
              ]
            }, oe)) : /* @__PURE__ */ (0, l.jsx)("p", { children: "目前來源未對上此影格。" }),
            /* @__PURE__ */ (0, l.jsx)("h3", { children: "剪輯對照候選" }),
            /* @__PURE__ */ (0, l.jsx)("p", {
              className: "muted",
              children: "以下時間來自指定來源表，尚未指定為本鏡實際入片位置。"
            }),
            $.timelineCandidates.map((Q, oe) => /* @__PURE__ */ (0, l.jsxs)("div", {
              className: "context-mini",
              children: [
                /* @__PURE__ */ (0, l.jsxs)("b", { children: [
                  "序號 ",
                  Q.sequence,
                  " · ",
                  Q.start,
                  " → ",
                  Q.end
                ] }),
                /* @__PURE__ */ (0, l.jsx)("p", { children: Q.text }),
                /* @__PURE__ */ (0, l.jsx)("small", { children: Q.source })
              ]
            }, oe)),
            !$.timelineCandidates.length && /* @__PURE__ */ (0, l.jsx)("p", { children: "尚缺可核實的剪輯對照。" }),
            /* @__PURE__ */ (0, l.jsx)("h3", { children: "台詞與音檔對照候選" }),
            $.voiceCandidates.map((Q, oe) => /* @__PURE__ */ (0, l.jsxs)("div", {
              className: "context-mini",
              children: [
                /* @__PURE__ */ (0, l.jsx)("b", { children: Q.lineId }),
                /* @__PURE__ */ (0, l.jsx)("p", { children: Q.file }),
                /* @__PURE__ */ (0, l.jsxs)("small", { children: [
                  Q.start,
                  " → ",
                  Q.end,
                  " · ",
                  Q.source
                ] })
              ]
            }, oe)),
            !$.voiceCandidates.length && /* @__PURE__ */ (0, l.jsx)("p", { children: "尚未建立明確台詞對應，不依編號猜配。" })
          ] }) : /* @__PURE__ */ (0, l.jsx)("p", { children: "請補來源與實際輸出對應。" }),
          /* @__PURE__ */ (0, l.jsx)(Km, {
            shotId: I.id,
            selection: de,
            disabled: x || r.archived,
            mutate: C
          }, de?.id ?? I.id)
        ]
      }, I.id);
    }),
    he.length > A && /* @__PURE__ */ (0, l.jsx)("button", {
      className: "btn",
      onClick: () => z(A + 20),
      children: "再顯示 20 列"
    }),
    /* @__PURE__ */ (0, l.jsxs)("details", {
      className: "production-import",
      children: [
        /* @__PURE__ */ (0, l.jsx)("summary", { children: "補入鏡頭製作關聯" }),
        /* @__PURE__ */ (0, l.jsx)("p", { children: "貼上包含 bundleId 與 links 清單的 JSON；所有鏡頭與資料識別鍵必須已存在。保留歷次關聯。" }),
        /* @__PURE__ */ (0, l.jsxs)("label", { children: ["鏡頭關聯 JSON", /* @__PURE__ */ (0, l.jsx)("textarea", {
          rows: 5,
          value: M,
          onChange: (I) => {
            S(I.target.value), T("");
          }
        })] }),
        H && /* @__PURE__ */ (0, l.jsx)("p", {
          role: "alert",
          children: H
        }),
        /* @__PURE__ */ (0, l.jsx)("button", {
          className: "btn primary",
          disabled: x || r.archived || !M.trim(),
          onClick: async () => {
            try {
              await C("save_production_links", JSON.parse(M)) && S("");
            } catch (I) {
              T(I instanceof Error ? I.message : "格式錯誤");
            }
          },
          children: "保存鏡頭製作關聯"
        })
      ]
    })
  ] });
}
var tn = {
  reference: "來源候選",
  adopted: "本集採用",
  withdrawn: "停止沿用",
  unresolved: "版本待補登"
}, of = {
  script: "劇本",
  character: "角色",
  scene: "場景",
  voice: "聲線",
  op_audio: "OP音軌",
  ed_audio: "ED音軌",
  edit: "剪輯工程"
}, Ss = (r) => r.split(/[,，\n]/).map((x) => x.trim()).filter(Boolean), uf = {
  key: "",
  title: "",
  content: "",
  source: "",
  note: "",
  stageIdsText: "",
  sceneIdsText: "",
  status: "reference",
  baseVersion: 0
}, pf = {
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
function _f({ project: r, busy: x, mutate: C }) {
  const [p, o] = (0, k.useState)(!1), [M, S] = (0, k.useState)(!1), [H, T] = (0, k.useState)(uf), [A, z] = (0, k.useState)(pf), [K, U] = (0, k.useState)(""), [ne, he] = (0, k.useState)(""), [I, $] = (0, k.useState)(""), de = qm(r), Q = x || r.archived, oe = Ka(r.episodeRules ?? []), V = Ka(r.baselines ?? []), W = (j) => !K || [j.key, j.title].join(" ").toLowerCase().includes(K.toLowerCase());
  function P(j) {
    T({
      ...j,
      stageIdsText: j.stageIds.join(", "),
      sceneIdsText: j.sceneIds.join(", "),
      baseVersion: ci(r.episodeRules ?? []).find((Z) => Z.key === j.key).version
    }), o(!0);
  }
  function ge(j) {
    z({
      ...j,
      recordKey: j.snapshot?.key ?? "",
      recordVersion: j.recordVersion ?? 1,
      content: j.snapshot?.content ?? "",
      stageIdsText: j.stageIds.join(", "),
      sceneIdsText: j.sceneIds.join(", "),
      baseVersion: ci(r.baselines ?? []).find((Z) => Z.key === j.key).version
    }), S(!0);
  }
  async function pe(j, Z) {
    await C("save_episode_rule", {
      ...j,
      status: Z,
      baseVersion: de.rules.find((Se) => Se.key === j.key).version
    });
  }
  async function Y(j, Z) {
    await C("register_episode_baseline", {
      ...j,
      status: Z,
      recordKey: j.snapshot?.key ?? "",
      recordVersion: j.recordVersion,
      content: j.snapshot?.content ?? "",
      baseVersion: de.baselines.find((Se) => Se.key === j.key).version
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
              /* @__PURE__ */ (0, l.jsxs)("b", { children: [V.length, " 項來源已採用"] }),
              /* @__PURE__ */ (0, l.jsxs)("span", { children: [de.baselines.filter((j) => j.status === "unresolved").length, " 項版本待補登"] })
            ]
          }),
          /* @__PURE__ */ (0, l.jsx)("p", {
            className: "inline-note",
            children: "候選新版本保留原採用版。採用紀錄、來源收錄與素材實際檢視分開保存。"
          }),
          /* @__PURE__ */ (0, l.jsxs)("label", {
            className: "work-search",
            children: ["搜尋規則與採用項目", /* @__PURE__ */ (0, l.jsx)("input", {
              value: K,
              onChange: (j) => U(j.target.value),
              placeholder: "規則、角色、劇本、聲線或音軌"
            })]
          }),
          /* @__PURE__ */ (0, l.jsxs)("details", { children: [/* @__PURE__ */ (0, l.jsx)("summary", { children: "通用流程檢查項目" }), de.genericChecks.map((j) => /* @__PURE__ */ (0, l.jsxs)("div", {
            className: "context-mini",
            children: [/* @__PURE__ */ (0, l.jsxs)("b", { children: [
              j.id,
              " ",
              j.title
            ] }), /* @__PURE__ */ (0, l.jsx)("ul", { children: j.checks.map((Z) => /* @__PURE__ */ (0, l.jsx)("li", { children: Z }, Z)) })]
          }, j.id))] }),
          r.workflowLegacy && /* @__PURE__ */ (0, l.jsxs)("details", { children: [
            /* @__PURE__ */ (0, l.jsx)("summary", { children: "保留的舊版檢查表紀錄" }),
            /* @__PURE__ */ (0, l.jsx)("p", { children: "舊版單集條件及勾選狀態保留在此；本集實際適用的規則另列於下方。" }),
            r.workflowLegacy.stages.map((j) => /* @__PURE__ */ (0, l.jsxs)("div", {
              className: "context-mini",
              children: [/* @__PURE__ */ (0, l.jsxs)("b", { children: ["舊階段 ", j.stageId] }), j.labels.map((Z, Se) => /* @__PURE__ */ (0, l.jsxs)("p", { children: [
                j.checks[Se] ? "已勾選" : "未勾選",
                " · ",
                Z
              ] }, Se))]
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
              disabled: Q,
              onClick: () => {
                T(uf), o(!p);
              },
              children: "新增本集規則"
            })]
          }),
          p && /* @__PURE__ */ (0, l.jsxs)("form", {
            className: "context-form",
            onSubmit: async (j) => {
              j.preventDefault(), await C("save_episode_rule", {
                ...H,
                stageIds: Ss(H.stageIdsText),
                sceneIds: Ss(H.sceneIdsText)
              }) && o(!1);
            },
            children: [
              /* @__PURE__ */ (0, l.jsxs)("div", {
                className: "context-form-grid",
                children: [/* @__PURE__ */ (0, l.jsxs)("label", { children: ["規則識別鍵", /* @__PURE__ */ (0, l.jsx)("input", {
                  required: !0,
                  readOnly: !!H.baseVersion,
                  maxLength: 100,
                  value: H.key,
                  onChange: (j) => T({
                    ...H,
                    key: j.target.value
                  })
                })] }), /* @__PURE__ */ (0, l.jsxs)("label", { children: ["規則名稱", /* @__PURE__ */ (0, l.jsx)("input", {
                  required: !0,
                  maxLength: 200,
                  value: H.title,
                  onChange: (j) => T({
                    ...H,
                    title: j.target.value
                  })
                })] })]
              }),
              /* @__PURE__ */ (0, l.jsxs)("label", { children: ["規則內容", /* @__PURE__ */ (0, l.jsx)("textarea", {
                required: !0,
                rows: 4,
                maxLength: 6e3,
                value: H.content,
                onChange: (j) => T({
                  ...H,
                  content: j.target.value
                })
              })] }),
              /* @__PURE__ */ (0, l.jsxs)("label", { children: ["規則來源", /* @__PURE__ */ (0, l.jsx)("input", {
                required: !0,
                maxLength: 2e3,
                value: H.source,
                onChange: (j) => T({
                  ...H,
                  source: j.target.value
                })
              })] }),
              /* @__PURE__ */ (0, l.jsxs)("div", {
                className: "context-form-grid",
                children: [/* @__PURE__ */ (0, l.jsxs)("label", { children: ["規則適用階段", /* @__PURE__ */ (0, l.jsx)("input", {
                  value: H.stageIdsText,
                  placeholder: "逗號分隔；留空為本集共用",
                  onChange: (j) => T({
                    ...H,
                    stageIdsText: j.target.value
                  })
                })] }), /* @__PURE__ */ (0, l.jsxs)("label", { children: ["規則適用場次", /* @__PURE__ */ (0, l.jsx)("input", {
                  value: H.sceneIdsText,
                  placeholder: "逗號分隔；留空為全部場次",
                  onChange: (j) => T({
                    ...H,
                    sceneIdsText: j.target.value
                  })
                })] })]
              }),
              /* @__PURE__ */ (0, l.jsxs)("label", { children: ["規則狀態", /* @__PURE__ */ (0, l.jsx)("select", {
                value: H.status,
                onChange: (j) => T({
                  ...H,
                  status: j.target.value
                }),
                children: Object.entries(tn).map(([j, Z]) => /* @__PURE__ */ (0, l.jsx)("option", {
                  value: j,
                  children: Z
                }, j))
              })] }),
              /* @__PURE__ */ (0, l.jsxs)("label", { children: ["規則備註", /* @__PURE__ */ (0, l.jsx)("textarea", {
                rows: 2,
                value: H.note,
                onChange: (j) => T({
                  ...H,
                  note: j.target.value
                })
              })] }),
              /* @__PURE__ */ (0, l.jsx)("button", {
                className: "btn primary",
                disabled: Q,
                children: "保存本集規則版本"
              })
            ]
          }),
          de.rules.filter(W).map((j) => {
            const Z = oe.find((Se) => Se.key === j.key);
            return /* @__PURE__ */ (0, l.jsxs)("details", {
              className: "production-record",
              children: [
                /* @__PURE__ */ (0, l.jsxs)("summary", { children: [/* @__PURE__ */ (0, l.jsx)("b", { children: j.title }), /* @__PURE__ */ (0, l.jsxs)("span", { children: [
                  tn[j.status],
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
                Z && Z.id !== j.id && /* @__PURE__ */ (0, l.jsxs)("div", {
                  className: "context-mini",
                  children: [
                    /* @__PURE__ */ (0, l.jsxs)("b", { children: ["仍沿用已採用 v", Z.version] }),
                    /* @__PURE__ */ (0, l.jsx)("p", { children: Z.content }),
                    /* @__PURE__ */ (0, l.jsxs)("small", { children: ["來源：", Z.source] })
                  ]
                }),
                /* @__PURE__ */ (0, l.jsxs)("div", {
                  className: "context-actions",
                  children: [
                    /* @__PURE__ */ (0, l.jsx)("button", {
                      className: "btn",
                      disabled: Q,
                      onClick: () => P(j),
                      children: "編輯規則新版本"
                    }),
                    j.status === "reference" && /* @__PURE__ */ (0, l.jsx)("button", {
                      className: "btn primary",
                      disabled: Q,
                      onClick: () => {
                        pe(j, "adopted");
                      },
                      children: "採用此規則"
                    }),
                    Z && /* @__PURE__ */ (0, l.jsx)("button", {
                      className: "btn",
                      disabled: Q,
                      onClick: () => {
                        pe(Z, "withdrawn");
                      },
                      children: "停止沿用規則"
                    })
                  ]
                })
              ]
            }, j.id);
          }),
          !de.rules.length && /* @__PURE__ */ (0, l.jsx)("p", { children: "本集尚未登記專用規則；不自動繼承前一集條件。" })
        ]
      }),
      /* @__PURE__ */ (0, l.jsxs)("div", {
        className: "wide-card",
        children: [
          /* @__PURE__ */ (0, l.jsxs)("div", {
            className: "section-title",
            children: [/* @__PURE__ */ (0, l.jsxs)("div", { children: [/* @__PURE__ */ (0, l.jsx)("h2", { children: "本集採用版本清單" }), /* @__PURE__ */ (0, l.jsx)("p", { children: "依角色、場景或音軌使用固定識別鍵；指定來源全文的確切版本，或登記外部來源。" })] }), /* @__PURE__ */ (0, l.jsx)("button", {
              className: "btn",
              disabled: Q,
              onClick: () => {
                z(pf), S(!M);
              },
              children: "新增採用項目"
            })]
          }),
          M && /* @__PURE__ */ (0, l.jsxs)("form", {
            className: "context-form",
            onSubmit: async (j) => {
              j.preventDefault(), await C("register_episode_baseline", {
                ...A,
                stageIds: Ss(A.stageIdsText),
                sceneIds: Ss(A.sceneIdsText)
              }) && S(!1);
            },
            children: [
              /* @__PURE__ */ (0, l.jsxs)("div", {
                className: "context-form-grid",
                children: [
                  /* @__PURE__ */ (0, l.jsxs)("label", { children: ["採用項目識別鍵", /* @__PURE__ */ (0, l.jsx)("input", {
                    required: !0,
                    readOnly: !!A.baseVersion,
                    maxLength: 100,
                    value: A.key,
                    onChange: (j) => z({
                      ...A,
                      key: j.target.value
                    })
                  })] }),
                  /* @__PURE__ */ (0, l.jsxs)("label", { children: ["採用項目名稱", /* @__PURE__ */ (0, l.jsx)("input", {
                    required: !0,
                    maxLength: 200,
                    value: A.title,
                    onChange: (j) => z({
                      ...A,
                      title: j.target.value
                    })
                  })] }),
                  /* @__PURE__ */ (0, l.jsxs)("label", { children: ["採用種類", /* @__PURE__ */ (0, l.jsx)("select", {
                    value: A.category,
                    onChange: (j) => z({
                      ...A,
                      category: j.target.value
                    }),
                    children: Rm.map((j) => /* @__PURE__ */ (0, l.jsx)("option", {
                      value: j,
                      children: of[j]
                    }, j))
                  })] }),
                  /* @__PURE__ */ (0, l.jsxs)("label", { children: ["採用項目狀態", /* @__PURE__ */ (0, l.jsx)("select", {
                    value: A.status,
                    onChange: (j) => z({
                      ...A,
                      status: j.target.value
                    }),
                    children: Object.entries(tn).map(([j, Z]) => /* @__PURE__ */ (0, l.jsx)("option", {
                      value: j,
                      children: Z
                    }, j))
                  })] }),
                  /* @__PURE__ */ (0, l.jsxs)("label", { children: ["已有來源識別鍵", /* @__PURE__ */ (0, l.jsx)("input", {
                    value: A.recordKey,
                    maxLength: 120,
                    onChange: (j) => z({
                      ...A,
                      recordKey: j.target.value
                    }),
                    placeholder: "從製作資料取得；外部來源可留空"
                  })] }),
                  /* @__PURE__ */ (0, l.jsxs)("label", { children: ["來源紀錄版本", /* @__PURE__ */ (0, l.jsx)("input", {
                    type: "number",
                    min: 1,
                    value: A.recordVersion,
                    onChange: (j) => z({
                      ...A,
                      recordVersion: Number(j.target.value)
                    })
                  })] })
                ]
              }),
              !A.recordKey && /* @__PURE__ */ (0, l.jsxs)("label", { children: ["外部來源內容", /* @__PURE__ */ (0, l.jsx)("textarea", {
                rows: 4,
                required: A.status === "reference" || A.status === "adopted",
                value: A.content,
                maxLength: 12e3,
                onChange: (j) => z({
                  ...A,
                  content: j.target.value
                })
              })] }),
              /* @__PURE__ */ (0, l.jsxs)("label", { children: ["採用依據來源", /* @__PURE__ */ (0, l.jsx)("input", {
                required: !0,
                maxLength: 2e3,
                value: A.source,
                onChange: (j) => z({
                  ...A,
                  source: j.target.value
                })
              })] }),
              /* @__PURE__ */ (0, l.jsxs)("div", {
                className: "context-form-grid",
                children: [
                  /* @__PURE__ */ (0, l.jsxs)("label", { children: ["外部檔案版本", /* @__PURE__ */ (0, l.jsx)("input", {
                    value: A.externalVersion,
                    maxLength: 200,
                    onChange: (j) => z({
                      ...A,
                      externalVersion: j.target.value
                    })
                  })] }),
                  /* @__PURE__ */ (0, l.jsxs)("label", { children: ["來源檔案位置", /* @__PURE__ */ (0, l.jsx)("input", {
                    value: A.location,
                    maxLength: 2e3,
                    onChange: (j) => z({
                      ...A,
                      location: j.target.value
                    })
                  })] }),
                  /* @__PURE__ */ (0, l.jsxs)("label", { children: ["採用適用階段", /* @__PURE__ */ (0, l.jsx)("input", {
                    value: A.stageIdsText,
                    placeholder: "OP／ED自動限制於各自支線",
                    onChange: (j) => z({
                      ...A,
                      stageIdsText: j.target.value
                    })
                  })] }),
                  /* @__PURE__ */ (0, l.jsxs)("label", { children: ["採用適用場次", /* @__PURE__ */ (0, l.jsx)("input", {
                    value: A.sceneIdsText,
                    onChange: (j) => z({
                      ...A,
                      sceneIdsText: j.target.value
                    })
                  })] })
                ]
              }),
              /* @__PURE__ */ (0, l.jsxs)("label", { children: ["選用原因或待補說明", /* @__PURE__ */ (0, l.jsx)("textarea", {
                required: A.status === "unresolved",
                rows: 3,
                maxLength: 3e3,
                value: A.note,
                onChange: (j) => z({
                  ...A,
                  note: j.target.value
                })
              })] }),
              /* @__PURE__ */ (0, l.jsx)("button", {
                className: "btn primary",
                disabled: Q,
                children: "保存採用項目版本"
              })
            ]
          }),
          de.baselines.filter(W).map((j) => {
            const Z = V.find((Se) => Se.key === j.key);
            return /* @__PURE__ */ (0, l.jsxs)("details", {
              className: "production-record",
              children: [
                /* @__PURE__ */ (0, l.jsxs)("summary", { children: [/* @__PURE__ */ (0, l.jsxs)("b", { children: [
                  of[j.category],
                  "｜",
                  j.title
                ] }), /* @__PURE__ */ (0, l.jsxs)("span", { children: [
                  tn[j.status],
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
                Z && Z.id !== j.id && /* @__PURE__ */ (0, l.jsxs)("div", {
                  className: "context-mini",
                  children: [/* @__PURE__ */ (0, l.jsxs)("b", { children: [
                    "仍沿用已採用 v",
                    Z.version,
                    "：",
                    Z.title
                  ] }), /* @__PURE__ */ (0, l.jsxs)("p", { children: [
                    Z.externalVersion || Z.snapshot?.key,
                    " · ",
                    Z.source
                  ] })]
                }),
                /* @__PURE__ */ (0, l.jsxs)("div", {
                  className: "context-actions",
                  children: [
                    /* @__PURE__ */ (0, l.jsx)("button", {
                      className: "btn",
                      disabled: Q,
                      onClick: () => ge(j),
                      children: "編輯採用項目新版本"
                    }),
                    j.status === "reference" && j.snapshot && /* @__PURE__ */ (0, l.jsx)("button", {
                      className: "btn primary",
                      disabled: Q,
                      onClick: () => {
                        Y(j, "adopted");
                      },
                      children: "採用此來源版本"
                    }),
                    Z && /* @__PURE__ */ (0, l.jsx)("button", {
                      className: "btn",
                      disabled: Q,
                      onClick: () => {
                        Y(Z, "withdrawn");
                      },
                      children: "停止沿用此項目"
                    })
                  ]
                })
              ]
            }, j.id);
          }),
          !de.baselines.length && /* @__PURE__ */ (0, l.jsx)("p", { children: "尚未指定本集採用版本。共用來源可按需連結後再選用。" }),
          /* @__PURE__ */ (0, l.jsxs)("details", {
            className: "production-import",
            children: [
              /* @__PURE__ */ (0, l.jsx)("summary", { children: "批次補登本集設定" }),
              /* @__PURE__ */ (0, l.jsx)("p", { children: "包含 rules 與 baselines 清單；保留版本及來源，採用與候選分開。" }),
              /* @__PURE__ */ (0, l.jsxs)("label", { children: ["本集設定 JSON", /* @__PURE__ */ (0, l.jsx)("textarea", {
                rows: 5,
                value: ne,
                onChange: (j) => {
                  he(j.target.value), $("");
                }
              })] }),
              I && /* @__PURE__ */ (0, l.jsx)("p", {
                role: "alert",
                children: I
              }),
              /* @__PURE__ */ (0, l.jsx)("button", {
                className: "btn primary",
                disabled: Q || !ne.trim(),
                onClick: async () => {
                  try {
                    await C("import_episode_settings", JSON.parse(ne)) && he("");
                  } catch (j) {
                    $(j instanceof Error ? j.message : "格式錯誤");
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
            tn[j.status],
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
var Zr = {
  rule: "規則／決策",
  script: "劇本",
  character: "角色",
  scene: "場景",
  audio: "聲音／音軌",
  reference: "原作／參考素材"
}, ff = {
  original: "原文明示",
  adaptation: "動畫改編",
  author_decision: "作者決定",
  ai_proposal: "AI 建議"
}, ld = {
  project: "本集共用",
  stage: "指定階段",
  scene: "指定場次",
  shot: "指定鏡頭"
}, Kr = (r) => ld[r.type] + (r.target ? " · " + r.target : ""), Jr = {
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
function Im(r, x) {
  const C = URL.createObjectURL(new Blob([JSON.stringify(x, null, 2)], { type: "application/json" })), p = document.createElement("a");
  p.href = C, p.download = r, p.click(), setTimeout(() => URL.revokeObjectURL(C), 1e3);
}
function $m({ project: r, mutate: x, busy: C }) {
  const p = gl(r), [o, M] = (0, k.useState)("materials"), [S, H] = (0, k.useState)(!1), [T, A] = (0, k.useState)(Jr), [z, K] = (0, k.useState)(!1), [U, ne] = (0, k.useState)({
    type: "conflict",
    scopeType: "project",
    target: "",
    description: ""
  }), [he, I] = (0, k.useState)("production"), [$, de] = (0, k.useState)(""), [Q, oe] = (0, k.useState)(""), [V, W] = (0, k.useState)(""), [P, ge] = (0, k.useState)(""), [pe, Y] = (0, k.useState)(""), [j, Z] = (0, k.useState)(""), [Se, qe] = (0, k.useState)(""), [g, ee] = (0, k.useState)(""), [X, B] = (0, k.useState)(""), [G, ce] = (0, k.useState)(""), [fe, Ae] = (0, k.useState)(""), [h, R] = (0, k.useState)(""), [J, ae] = (0, k.useState)(""), [je, F] = (0, k.useState)({}), ue = p.packs.find((m) => m.id === g) ?? p.packs.at(-1), Ue = p.records.filter((m) => m.status === "effective"), b = p.records.filter((m) => m.status === "proposed" && !an(m)), le = p.problems.filter((m) => m.status === "open"), se = [
    [
      "materials",
      "製作資料",
      p.records.length
    ],
    [
      "links",
      "製作關聯",
      new Set((r.production?.links ?? []).map((m) => m.shotId)).size
    ],
    [
      "settings",
      "本集採用",
      Ka(r.baselines ?? []).length
    ],
    [
      "baseline",
      "直接核定來源",
      Ue.length
    ],
    [
      "proposals",
      "待確認提案",
      b.length
    ],
    [
      "problems",
      "矛盾與缺件",
      le.length
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
  ], ye = C || r.archived;
  async function Oe(m) {
    m.preventDefault(), await x("propose_record", {
      ...T,
      scope: {
        type: T.scopeType,
        target: T.target
      }
    }) && (H(!1), A(Jr), M("proposals"));
  }
  function ct(m) {
    const te = p.records.find((tt) => tt.id === m);
    A({
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
    }), H(!0);
  }
  function ot(m) {
    return /* @__PURE__ */ (0, l.jsxs)(l.Fragment, { children: [
      /* @__PURE__ */ (0, l.jsxs)("div", {
        className: "context-pack-head",
        children: [
          /* @__PURE__ */ (0, l.jsx)("span", {
            className: "status " + (m.readiness === "ready" ? "passed" : "needs_revision"),
            children: m.readiness === "ready" ? m.purpose === "documentation" ? "可整理資料 · 保留來源差異" : "紀錄齊備 · 素材待實際讀取" : "受阻 · 先處理缺件與矛盾"
          }),
          /* @__PURE__ */ (0, l.jsx)("span", {
            className: "status " + (m.projectRevision === r.revision ? "passed" : "needs_revision"),
            children: m.projectRevision === r.revision ? "目前版本" : "已過期，需重新取得"
          }),
          /* @__PURE__ */ (0, l.jsx)("button", {
            className: "btn",
            onClick: () => Im("AI_工作資料包_" + m.id + ".json", m),
            children: "下載資料包 JSON"
          })
        ]
      }),
      /* @__PURE__ */ (0, l.jsx)("p", {
        className: "context-task",
        children: m.task
      }),
      /* @__PURE__ */ (0, l.jsxs)("p", {
        className: "muted",
        children: [
          "範圍：",
          [
            m.episode,
            m.scope.stageId,
            m.scope.sceneId,
            m.scope.shotId
          ].filter(Boolean).join(" ／ "),
          " · 專案版本 ",
          m.projectRevision
        ]
      }),
      /* @__PURE__ */ (0, l.jsx)("code", {
        className: "context-id",
        children: m.id
      }),
      m.blockers.length > 0 && /* @__PURE__ */ (0, l.jsx)("div", {
        className: "context-blockers",
        children: m.blockers.map((te, tt) => /* @__PURE__ */ (0, l.jsx)("p", { children: te.replace(/缺少有效資料種類：(\w+)/g, (Dt, E) => "缺少有效資料種類：" + (Zr[E] || E)) }, tt))
      }),
      /* @__PURE__ */ (0, l.jsx)("h3", { children: m.purpose === "documentation" ? "本次指定來源（整理用途）" : "本次有效依據" }),
      m.records.length ? m.records.map((te) => /* @__PURE__ */ (0, l.jsxs)("article", {
        className: "context-mini",
        children: [
          /* @__PURE__ */ (0, l.jsxs)("b", { children: [
            te.title,
            " · v",
            te.version
          ] }),
          /* @__PURE__ */ (0, l.jsxs)("small", { children: [
            te.key,
            " · ",
            Kr(te.scope)
          ] }),
          /* @__PURE__ */ (0, l.jsx)("p", { children: te.content }),
          /* @__PURE__ */ (0, l.jsxs)("small", { children: ["來源：", te.source] }),
          /* @__PURE__ */ (0, l.jsxs)("small", { children: ["素材位置：", te.location || "內容已記錄；未登記外部檔案"] })
        ]
      }, te.id)) : /* @__PURE__ */ (0, l.jsx)("p", {
        className: "muted",
        children: "尚無有效資料，AI 應回報受阻。"
      }),
      /* @__PURE__ */ (0, l.jsxs)("details", { children: [/* @__PURE__ */ (0, l.jsxs)("summary", { children: [
        "禁止混用的版本／待確認提案（",
        m.excluded.length,
        "）"
      ] }), m.excluded.map((te) => /* @__PURE__ */ (0, l.jsxs)("p", { children: [
        te.title,
        " · ",
        te.status,
        " · ",
        te.id
      ] }, te.id))] }),
      /* @__PURE__ */ (0, l.jsxs)("details", { children: [/* @__PURE__ */ (0, l.jsx)("summary", { children: "完整資料契約與素材清單" }), /* @__PURE__ */ (0, l.jsx)("pre", { children: JSON.stringify({
        contract: m.contract,
        manifest: m.manifest,
        adoptedBaselines: m.adoptedBaselines,
        episodeRules: m.episodeRules,
        priorHandoff: m.priorHandoff
      }, null, 2) })] })
    ] });
  }
  return /* @__PURE__ */ (0, l.jsxs)("section", {
    className: "ai-workspace",
    children: [
      /* @__PURE__ */ (0, l.jsx)("nav", {
        className: "section-nav",
        "aria-label": "資料與交接",
        children: se.filter(([m]) => [
          "materials",
          "links",
          "handoff",
          "problems"
        ].includes(m)).map(([m, te, tt]) => /* @__PURE__ */ (0, l.jsxs)("button", {
          className: o === m ? "active" : "",
          onClick: () => M(m),
          children: [
            {
              materials: "製作資料",
              links: "鏡頭對應",
              handoff: "工作紀錄",
              problems: "缺件與疑問"
            }[m],
            " ",
            /* @__PURE__ */ (0, l.jsx)("span", { children: tt })
          ]
        }, m))
      }),
      /* @__PURE__ */ (0, l.jsxs)("details", {
        className: "advanced-tools",
        children: [
          /* @__PURE__ */ (0, l.jsx)("summary", { children: "進階：採用設定、資料提案與 AI 工作資料包" }),
          /* @__PURE__ */ (0, l.jsx)("div", {
            className: "context-tabs",
            children: se.filter(([m]) => ![
              "materials",
              "links",
              "handoff",
              "problems"
            ].includes(m)).map(([m, te, tt]) => /* @__PURE__ */ (0, l.jsxs)("button", {
              className: o === m ? "active" : "",
              onClick: () => M(m),
              children: [
                te,
                " · ",
                tt
              ]
            }, m))
          }),
          /* @__PURE__ */ (0, l.jsx)("p", { children: "AI 接手時會讀取指定版本；一般查資料不需要手動建立資料包。" })
        ]
      }),
      /* @__PURE__ */ (0, l.jsx)("div", {
        className: o === "settings" ? "" : "wide-card",
        children: o === "settings" ? /* @__PURE__ */ (0, l.jsx)(_f, {
          project: r,
          busy: C,
          mutate: x
        }) : o === "links" ? /* @__PURE__ */ (0, l.jsx)(Jm, {
          project: r,
          busy: C,
          mutate: x
        }) : o === "materials" ? /* @__PURE__ */ (0, l.jsx)(Zm, {
          project: r,
          busy: C,
          mutate: x
        }) : ["baseline", "proposals"].includes(o) ? /* @__PURE__ */ (0, l.jsxs)(l.Fragment, { children: [
          /* @__PURE__ */ (0, l.jsxs)("div", {
            className: "section-title",
            children: [/* @__PURE__ */ (0, l.jsxs)("div", { children: [/* @__PURE__ */ (0, l.jsx)("h2", { children: o === "baseline" ? "目前有效資料" : "待作者確認的提案" }), /* @__PURE__ */ (0, l.jsx)("p", { children: "識別鍵固定，修改建立新版本；來源與適用範圍必填。" })] }), /* @__PURE__ */ (0, l.jsx)("button", {
              className: "btn primary",
              disabled: ye,
              onClick: () => {
                A(Jr), H(!S);
              },
              children: "新增資料提案"
            })]
          }),
          S && /* @__PURE__ */ (0, l.jsxs)("form", {
            className: "context-form",
            onSubmit: Oe,
            children: [
              /* @__PURE__ */ (0, l.jsxs)("div", {
                className: "context-form-grid",
                children: [
                  /* @__PURE__ */ (0, l.jsxs)("label", { children: ["固定識別鍵", /* @__PURE__ */ (0, l.jsx)("input", {
                    required: !0,
                    maxLength: 120,
                    placeholder: "例如 mother_position 或 script_main",
                    value: T.key,
                    readOnly: !!T.supersedesId,
                    onChange: (m) => A({
                      ...T,
                      key: m.target.value
                    })
                  })] }),
                  /* @__PURE__ */ (0, l.jsxs)("label", { children: ["資料名稱", /* @__PURE__ */ (0, l.jsx)("input", {
                    required: !0,
                    maxLength: 200,
                    value: T.title,
                    onChange: (m) => A({
                      ...T,
                      title: m.target.value
                    })
                  })] }),
                  /* @__PURE__ */ (0, l.jsxs)("label", { children: ["資料種類", /* @__PURE__ */ (0, l.jsx)("select", {
                    value: T.kind,
                    onChange: (m) => A({
                      ...T,
                      kind: m.target.value
                    }),
                    children: Lm.map((m) => /* @__PURE__ */ (0, l.jsx)("option", {
                      value: m,
                      children: Zr[m]
                    }, m))
                  })] }),
                  /* @__PURE__ */ (0, l.jsxs)("label", { children: ["內容性質", /* @__PURE__ */ (0, l.jsx)("select", {
                    value: T.origin,
                    onChange: (m) => A({
                      ...T,
                      origin: m.target.value
                    }),
                    children: Object.entries(ff).map(([m, te]) => /* @__PURE__ */ (0, l.jsx)("option", {
                      value: m,
                      children: te
                    }, m))
                  })] }),
                  /* @__PURE__ */ (0, l.jsxs)("label", { children: ["適用範圍", /* @__PURE__ */ (0, l.jsx)("select", {
                    value: T.scopeType,
                    disabled: !!T.supersedesId,
                    onChange: (m) => A({
                      ...T,
                      scopeType: m.target.value,
                      target: ""
                    }),
                    children: Object.entries(ld).map(([m, te]) => /* @__PURE__ */ (0, l.jsx)("option", {
                      value: m,
                      children: te
                    }, m))
                  })] }),
                  /* @__PURE__ */ (0, l.jsxs)("label", { children: ["範圍 ID", /* @__PURE__ */ (0, l.jsx)("input", {
                    required: T.scopeType !== "project",
                    disabled: T.scopeType === "project" || !!T.supersedesId,
                    placeholder: "例如 S06、01 或鏡頭 ID",
                    value: T.target,
                    onChange: (m) => A({
                      ...T,
                      target: m.target.value
                    })
                  })] })
                ]
              }),
              /* @__PURE__ */ (0, l.jsxs)("label", { children: ["內容", /* @__PURE__ */ (0, l.jsx)("textarea", {
                required: !0,
                rows: 5,
                maxLength: 12e3,
                value: T.content,
                onChange: (m) => A({
                  ...T,
                  content: m.target.value
                })
              })] }),
              /* @__PURE__ */ (0, l.jsxs)("label", { children: ["來源依據", /* @__PURE__ */ (0, l.jsx)("input", {
                required: !0,
                maxLength: 2e3,
                placeholder: "原作章節、作者修改要求、檔案名稱與段落等",
                value: T.source,
                onChange: (m) => A({
                  ...T,
                  source: m.target.value
                })
              })] }),
              /* @__PURE__ */ (0, l.jsxs)("label", { children: ["素材位置（選填）", /* @__PURE__ */ (0, l.jsx)("input", {
                maxLength: 2e3,
                placeholder: "可取得的檔案位置或連結；填入不等於已讀取",
                value: T.location,
                onChange: (m) => A({
                  ...T,
                  location: m.target.value
                })
              })] }),
              T.supersedesId && /* @__PURE__ */ (0, l.jsxs)("p", {
                className: "muted",
                children: [
                  "明確取代：",
                  T.supersedesId,
                  "。作者確認前，舊版仍然有效。"
                ]
              }),
              /* @__PURE__ */ (0, l.jsxs)("div", {
                className: "context-actions",
                children: [/* @__PURE__ */ (0, l.jsx)("button", {
                  className: "btn",
                  type: "button",
                  onClick: () => H(!1),
                  children: "取消"
                }), /* @__PURE__ */ (0, l.jsx)("button", {
                  className: "btn primary",
                  disabled: ye,
                  children: "保存為待確認提案"
                })]
              })
            ]
          }),
          /* @__PURE__ */ (0, l.jsx)("div", {
            className: "context-records",
            children: (o === "baseline" ? Ue : b).map((m) => /* @__PURE__ */ (0, l.jsxs)("article", {
              className: "context-record",
              children: [
                /* @__PURE__ */ (0, l.jsxs)("div", {
                  className: "issue-top",
                  children: [/* @__PURE__ */ (0, l.jsx)("span", {
                    className: "status " + (m.status === "effective" ? "passed" : "candidate"),
                    children: m.status === "effective" ? "作者已確認" : "待確認"
                  }), /* @__PURE__ */ (0, l.jsxs)("b", { children: [
                    m.title,
                    " · v",
                    m.version
                  ] })]
                }),
                /* @__PURE__ */ (0, l.jsxs)("small", { children: [
                  Zr[m.kind],
                  " ／ ",
                  ff[m.origin],
                  " ／ ",
                  Kr(m.scope)
                ] }),
                /* @__PURE__ */ (0, l.jsxs)("code", {
                  className: "context-id",
                  children: [
                    m.key,
                    " · ",
                    m.id
                  ]
                }),
                /* @__PURE__ */ (0, l.jsx)("p", { children: m.content }),
                /* @__PURE__ */ (0, l.jsxs)("div", {
                  className: "context-source",
                  children: [
                    "來源：",
                    m.source,
                    m.location && /* @__PURE__ */ (0, l.jsxs)("p", { children: ["素材位置：", m.location] })
                  ]
                }),
                m.supersedesId && /* @__PURE__ */ (0, l.jsxs)("small", { children: ["取代目標：", m.supersedesId] }),
                m.approval && /* @__PURE__ */ (0, l.jsxs)("small", { children: ["確認者：", m.approval.by] }),
                /* @__PURE__ */ (0, l.jsx)("div", {
                  className: "context-actions",
                  children: m.status === "proposed" ? /* @__PURE__ */ (0, l.jsx)("button", {
                    className: "btn primary",
                    disabled: ye,
                    onClick: () => {
                      x("activate_record", { recordId: m.id });
                    },
                    children: "作者確認為有效資料"
                  }) : /* @__PURE__ */ (0, l.jsx)("button", {
                    className: "btn",
                    disabled: ye,
                    onClick: () => ct(m.id),
                    children: "提出修改版本"
                  })
                })
              ]
            }, m.id))
          }),
          !(o === "baseline" ? Ue : b).length && !S && /* @__PURE__ */ (0, l.jsxs)("div", {
            className: "empty",
            children: [/* @__PURE__ */ (0, l.jsx)("h3", { children: o === "baseline" ? "尚無有效資料" : "目前沒有待確認提案" }), /* @__PURE__ */ (0, l.jsx)("p", { children: "先登記來源、內容與範圍，再由作者確認。" })]
          }),
          /* @__PURE__ */ (0, l.jsxs)("details", { children: [/* @__PURE__ */ (0, l.jsxs)("summary", { children: [
            "已被取代的歷史版本（",
            p.records.filter((m) => m.status === "superseded").length,
            "）"
          ] }), p.records.filter((m) => m.status === "superseded").map((m) => /* @__PURE__ */ (0, l.jsxs)("article", {
            className: "context-mini",
            children: [
              /* @__PURE__ */ (0, l.jsxs)("b", { children: [
                m.title,
                " v",
                m.version,
                " · 已停用"
              ] }),
              /* @__PURE__ */ (0, l.jsx)("p", { children: m.content }),
              /* @__PURE__ */ (0, l.jsxs)("small", { children: [
                m.id,
                " → ",
                m.supersededBy
              ] })
            ]
          }, m.id))] })
        ] }) : o === "problems" ? /* @__PURE__ */ (0, l.jsxs)(l.Fragment, { children: [
          /* @__PURE__ */ (0, l.jsxs)("div", {
            className: "section-title",
            children: [/* @__PURE__ */ (0, l.jsxs)("div", { children: [/* @__PURE__ */ (0, l.jsx)("h2", { children: "矛盾、缺件與待裁定事項" }), /* @__PURE__ */ (0, l.jsx)("p", { children: "相關任務在問題處理前回報受阻，AI 不自行裁定。" })] }), /* @__PURE__ */ (0, l.jsx)("button", {
              className: "btn",
              disabled: ye,
              onClick: () => K(!z),
              children: "登記矛盾或缺件"
            })]
          }),
          z && /* @__PURE__ */ (0, l.jsxs)("form", {
            className: "context-form",
            onSubmit: async (m) => {
              m.preventDefault(), await x("add_knowledge_problem", {
                type: U.type,
                scope: {
                  type: U.scopeType,
                  target: U.target
                },
                description: U.description,
                recordIds: []
              }) && (K(!1), ne({
                ...U,
                description: ""
              }));
            },
            children: [
              /* @__PURE__ */ (0, l.jsxs)("div", {
                className: "context-form-grid",
                children: [
                  /* @__PURE__ */ (0, l.jsxs)("label", { children: ["問題種類", /* @__PURE__ */ (0, l.jsxs)("select", {
                    value: U.type,
                    onChange: (m) => ne({
                      ...U,
                      type: m.target.value
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
                    value: U.scopeType,
                    onChange: (m) => ne({
                      ...U,
                      scopeType: m.target.value,
                      target: ""
                    }),
                    children: Object.entries(ld).map(([m, te]) => /* @__PURE__ */ (0, l.jsx)("option", {
                      value: m,
                      children: te
                    }, m))
                  })] }),
                  /* @__PURE__ */ (0, l.jsxs)("label", { children: ["範圍 ID", /* @__PURE__ */ (0, l.jsx)("input", {
                    required: U.scopeType !== "project",
                    disabled: U.scopeType === "project",
                    value: U.target,
                    onChange: (m) => ne({
                      ...U,
                      target: m.target.value
                    })
                  })] })
                ]
              }),
              /* @__PURE__ */ (0, l.jsxs)("label", { children: ["問題與缺少的依據", /* @__PURE__ */ (0, l.jsx)("textarea", {
                required: !0,
                rows: 4,
                value: U.description,
                onChange: (m) => ne({
                  ...U,
                  description: m.target.value
                })
              })] }),
              /* @__PURE__ */ (0, l.jsx)("button", {
                className: "btn primary",
                disabled: ye,
                children: "保存待處理問題"
              })
            ]
          }),
          p.problems.map((m) => /* @__PURE__ */ (0, l.jsxs)("article", {
            className: "context-record",
            children: [
              /* @__PURE__ */ (0, l.jsxs)("div", {
                className: "issue-top",
                children: [/* @__PURE__ */ (0, l.jsxs)("span", {
                  className: "status " + (m.status === "open" ? "needs_revision" : "passed"),
                  children: [
                    m.type === "conflict" ? "資訊矛盾" : "資料缺件",
                    " · ",
                    m.status === "open" ? "待處理" : "作者已處理"
                  ]
                }), /* @__PURE__ */ (0, l.jsx)("small", { children: Kr(m.scope) })]
              }),
              /* @__PURE__ */ (0, l.jsx)("p", { children: m.description }),
              m.resolution && /* @__PURE__ */ (0, l.jsxs)("p", { children: ["處理結果：", m.resolution] }),
              m.status === "open" && (j === m.id ? /* @__PURE__ */ (0, l.jsxs)("form", {
                onSubmit: async (te) => {
                  te.preventDefault(), await x("resolve_knowledge_problem", {
                    problemId: m.id,
                    resolution: Se
                  }) && (Z(""), qe(""));
                },
                children: [
                  /* @__PURE__ */ (0, l.jsxs)("label", {
                    className: "form-field",
                    children: ["作者裁定／補件結果", /* @__PURE__ */ (0, l.jsx)("textarea", {
                      required: !0,
                      rows: 3,
                      value: Se,
                      onChange: (te) => qe(te.target.value)
                    })]
                  }),
                  /* @__PURE__ */ (0, l.jsx)("p", {
                    className: "muted",
                    children: "若涉及設定變更，請另外確認新資料版本；問題結案不會自動修改有效資料。"
                  }),
                  /* @__PURE__ */ (0, l.jsx)("button", {
                    className: "btn primary",
                    disabled: ye,
                    children: "作者確認處理完成"
                  })
                ]
              }) : /* @__PURE__ */ (0, l.jsx)("button", {
                className: "btn",
                disabled: ye,
                onClick: () => {
                  Z(m.id), qe("");
                },
                children: "填寫作者處理結果"
              }))
            ]
          }, m.id)),
          !p.problems.length && /* @__PURE__ */ (0, l.jsx)("p", {
            className: "muted",
            children: "目前沒有登記矛盾或缺件。資料包仍會檢查必要資料種類。"
          })
        ] }) : o === "packet" ? /* @__PURE__ */ (0, l.jsxs)(l.Fragment, { children: [
          /* @__PURE__ */ (0, l.jsx)("div", {
            className: "section-title",
            children: /* @__PURE__ */ (0, l.jsxs)("div", { children: [/* @__PURE__ */ (0, l.jsx)("h2", { children: "指定任務的工作資料包" }), /* @__PURE__ */ (0, l.jsx)("p", { children: "保存當下版本；任何更新後均需重新取得，避免沿用舊依據。" })] })
          }),
          /* @__PURE__ */ (0, l.jsxs)("form", {
            className: "context-form",
            onSubmit: async (m) => {
              m.preventDefault();
              const te = await x("create_context_pack", {
                task: Q,
                stageId: V,
                sceneId: P,
                shotId: pe,
                purpose: he,
                recordKeys: he === "documentation" ? $.split(/[,，\n]/).map((tt) => tt.trim()).filter(Boolean) : void 0
              });
              te && ee(gl(te).packs.at(-1).id);
            },
            children: [
              /* @__PURE__ */ (0, l.jsxs)("label", { children: ["工作用途", /* @__PURE__ */ (0, l.jsxs)("select", {
                value: he,
                onChange: (m) => I(m.target.value),
                children: [/* @__PURE__ */ (0, l.jsx)("option", {
                  value: "production",
                  children: "素材製作／檢視"
                }), /* @__PURE__ */ (0, l.jsx)("option", {
                  value: "documentation",
                  children: "資料整理／補登"
                })]
              })] }),
              he === "documentation" && /* @__PURE__ */ (0, l.jsxs)("label", { children: ["本次來源識別鍵", /* @__PURE__ */ (0, l.jsx)("textarea", {
                required: !0,
                rows: 2,
                value: $,
                onChange: (m) => de(m.target.value),
                placeholder: "以逗號分隔，最多20筆；可從製作資料或鏡頭關聯取得"
              })] }),
              /* @__PURE__ */ (0, l.jsxs)("label", { children: ["本次任務", /* @__PURE__ */ (0, l.jsx)("textarea", {
                required: !0,
                rows: 2,
                maxLength: 2e3,
                placeholder: "例如：檢查 S06 指定鏡頭的母親座位與場景一致性",
                value: Q,
                onChange: (m) => oe(m.target.value)
              })] }),
              /* @__PURE__ */ (0, l.jsxs)("div", {
                className: "context-form-grid",
                children: [
                  /* @__PURE__ */ (0, l.jsxs)("label", { children: ["階段 ID（選填）", /* @__PURE__ */ (0, l.jsx)("input", {
                    placeholder: "例如 08、op01",
                    value: V,
                    onChange: (m) => W(m.target.value)
                  })] }),
                  /* @__PURE__ */ (0, l.jsxs)("label", { children: ["場次 ID（選填）", /* @__PURE__ */ (0, l.jsx)("input", {
                    placeholder: "例如 S06",
                    value: P,
                    onChange: (m) => ge(m.target.value)
                  })] }),
                  /* @__PURE__ */ (0, l.jsxs)("label", { children: ["鏡頭 ID（選填）", /* @__PURE__ */ (0, l.jsx)("input", {
                    placeholder: "素材總表的固定鏡頭 ID",
                    value: pe,
                    onChange: (m) => Y(m.target.value)
                  })] })
                ]
              }),
              /* @__PURE__ */ (0, l.jsx)("button", {
                className: "btn primary",
                disabled: ye,
                children: "建立並保存資料包"
              })
            ]
          }),
          ue ? /* @__PURE__ */ (0, l.jsx)("div", {
            className: "context-pack",
            children: ot(ue)
          }) : /* @__PURE__ */ (0, l.jsx)("p", {
            className: "muted",
            children: "尚未建立資料包。AI 可透過 acquire_animation_context 取得同一份資料。"
          }),
          ue?.purpose === "documentation" && ue.projectRevision === r.revision && /* @__PURE__ */ (0, l.jsxs)("details", { children: [/* @__PURE__ */ (0, l.jsx)("summary", { children: "回報本次資料整理結果" }), /* @__PURE__ */ (0, l.jsxs)("form", {
            className: "context-form",
            onSubmit: async (m) => {
              m.preventDefault(), await x("submit_ai_work", {
                contextPackId: ue.id,
                resultId: crypto.randomUUID(),
                status: "completed",
                summary: X,
                nextStep: G,
                recordIds: ue.records.map((te) => te.id),
                observations: ue.records.map((te) => ({
                  recordId: te.id,
                  version: te.version,
                  note: je[te.id] ?? ""
                })),
                artifacts: [{
                  location: fe,
                  version: h,
                  description: J
                }]
              });
            },
            children: [
              /* @__PURE__ */ (0, l.jsxs)("label", { children: ["本次完成內容", /* @__PURE__ */ (0, l.jsx)("textarea", {
                required: !0,
                rows: 3,
                value: X,
                onChange: (m) => B(m.target.value)
              })] }),
              /* @__PURE__ */ (0, l.jsxs)("label", { children: ["下一位 AI 接手動作", /* @__PURE__ */ (0, l.jsx)("textarea", {
                required: !0,
                rows: 3,
                value: G,
                onChange: (m) => ce(m.target.value)
              })] }),
              ue.records.map((m) => /* @__PURE__ */ (0, l.jsxs)("label", { children: [
                "實際閱讀依據｜",
                m.title,
                /* @__PURE__ */ (0, l.jsx)("textarea", {
                  required: !0,
                  rows: 2,
                  maxLength: 3e3,
                  value: je[m.id] ?? "",
                  onChange: (te) => F({
                    ...je,
                    [m.id]: te.target.value
                  })
                })
              ] }, m.id)),
              /* @__PURE__ */ (0, l.jsxs)("label", { children: ["整理成果位置", /* @__PURE__ */ (0, l.jsx)("input", {
                required: !0,
                maxLength: 2e3,
                value: fe,
                onChange: (m) => Ae(m.target.value)
              })] }),
              /* @__PURE__ */ (0, l.jsxs)("label", { children: ["整理成果版本", /* @__PURE__ */ (0, l.jsx)("input", {
                required: !0,
                maxLength: 100,
                value: h,
                onChange: (m) => R(m.target.value)
              })] }),
              /* @__PURE__ */ (0, l.jsxs)("label", { children: ["整理成果說明", /* @__PURE__ */ (0, l.jsx)("input", {
                required: !0,
                maxLength: 2e3,
                value: J,
                onChange: (m) => ae(m.target.value)
              })] }),
              /* @__PURE__ */ (0, l.jsx)("button", {
                className: "btn primary",
                disabled: ye,
                children: "保存資料整理結果"
              })
            ]
          })] }),
          p.packs.length > 1 && /* @__PURE__ */ (0, l.jsxs)("details", { children: [/* @__PURE__ */ (0, l.jsxs)("summary", { children: [
            "先前資料包（",
            p.packs.length - 1,
            "）"
          ] }), [...p.packs].reverse().map((m) => /* @__PURE__ */ (0, l.jsxs)("button", {
            className: "text-btn",
            onClick: () => ee(m.id),
            children: [
              m.task,
              " · 版本 ",
              m.projectRevision
            ]
          }, m.id))] })
        ] }) : /* @__PURE__ */ (0, l.jsxs)(l.Fragment, { children: [
          /* @__PURE__ */ (0, l.jsx)("div", {
            className: "section-title",
            children: /* @__PURE__ */ (0, l.jsxs)("div", { children: [/* @__PURE__ */ (0, l.jsx)("h2", { children: "AI 工作接續紀錄" }), /* @__PURE__ */ (0, l.jsx)("p", { children: "依資料包回寫使用版本、實際閱讀自述、成果位置與下一步。" })] })
          }),
          [...p.results].reverse().map((m) => /* @__PURE__ */ (0, l.jsxs)("article", {
            className: "context-record",
            children: [
              /* @__PURE__ */ (0, l.jsxs)("div", {
                className: "issue-top",
                children: [/* @__PURE__ */ (0, l.jsx)("span", {
                  className: "status " + (m.needsReview ? "needs_revision" : m.status === "blocked" ? "todo" : "candidate"),
                  children: m.needsReview ? p.packs.find((te) => te.id === m.packId)?.purpose === "documentation" ? "採用設定已更新，接手前讀取新版本" : "依據已變更，需重驗" : m.status === "completed" ? p.packs.find((te) => te.id === m.packId)?.purpose === "documentation" ? "資料整理完成" : "AI 回報完成，待作者驗收" : m.status === "partial" ? "部分完成" : "受阻"
                }), /* @__PURE__ */ (0, l.jsx)("b", { children: m.task })]
              }),
              /* @__PURE__ */ (0, l.jsx)("p", { children: m.summary }),
              /* @__PURE__ */ (0, l.jsxs)("div", {
                className: "context-source",
                children: [/* @__PURE__ */ (0, l.jsx)("b", { children: "下一步" }), /* @__PURE__ */ (0, l.jsx)("p", { children: m.nextStep })]
              }),
              m.needsReview && /* @__PURE__ */ (0, l.jsx)("p", {
                className: "red-text",
                children: m.reviewReason
              }),
              m.artifacts.map((te, tt) => /* @__PURE__ */ (0, l.jsxs)("p", { children: [
                te.description,
                " · ",
                te.version,
                /* @__PURE__ */ (0, l.jsx)("code", {
                  className: "context-id",
                  children: te.location
                })
              ] }, tt)),
              /* @__PURE__ */ (0, l.jsxs)("details", { children: [/* @__PURE__ */ (0, l.jsx)("summary", { children: "使用版本與閱讀自述" }), /* @__PURE__ */ (0, l.jsx)("pre", { children: JSON.stringify({
                packId: m.packId,
                recordIds: m.recordIds,
                observations: m.observations
              }, null, 2) })] })
            ]
          }, m.id)),
          !p.results.length && /* @__PURE__ */ (0, l.jsxs)("div", {
            className: "empty",
            children: [/* @__PURE__ */ (0, l.jsx)("h3", { children: "等待 AI 回報工作" }), /* @__PURE__ */ (0, l.jsx)("p", { children: "工具 submit_animation_work 會保存結果與交接內容。" })]
          })
        ] })
      })
    ]
  });
}
var Ef = [
  ["coverage", "原作與改編範圍"],
  ["endingState", "本集結尾狀態"],
  ["characters", "人物狀態與關係"],
  ["revealed", "已揭露資訊與邊界"],
  ["unresolved", "尚未確定的內容"],
  ["carryRules", "後續集數沿用規則"],
  ["nextSteps", "下一步與接手順序"],
  ["sources", "來源與版本說明"]
], hf = {
  title: "",
  coverage: "",
  endingState: "",
  characters: "",
  revealed: "",
  unresolved: "",
  carryRules: "",
  nextSteps: "",
  sources: ""
}, Wm = {
  completed: "作者告知已完成",
  in_progress: "作者告知製作中",
  not_started: "作者告知尚未開始"
};
function Ir({ h: r, target: x }) {
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
          x,
          "。內容按所列版本交接；尚未對上成片的部分保留疑點，不自動變成下一集採用設定。"
        ]
      }),
      Ef.map(([C, p]) => /* @__PURE__ */ (0, l.jsxs)("div", {
        className: "context-mini",
        children: [/* @__PURE__ */ (0, l.jsx)("b", { children: p }), /* @__PURE__ */ (0, l.jsx)("p", {
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
function Fm({ project: r, episodes: x, busy: C, mutate: p }) {
  const o = r.production?.completionReports?.at(-1), M = r.production?.handoffs?.at(-1), S = x.filter((Y) => Y.workId === r.workId && Y.id !== r.id), [H, T] = (0, k.useState)("completed"), [A, z] = (0, k.useState)(""), [K, U] = (0, k.useState)(""), [ne, he] = (0, k.useState)(""), [I, $] = (0, k.useState)(hf), [de, Q] = (0, k.useState)(""), [oe, V] = (0, k.useState)([]), [W, P] = (0, k.useState)("");
  (0, k.useEffect)(() => {
    T(o?.status ?? "completed"), z(o?.note ?? ""), U(o?.source ?? ""), he(M?.toEpisodeId ?? ""), $(M ?? hf), Q(M?.sourceKeys.join(", ") ?? "");
  }, [
    r.id,
    o?.at,
    M?.id
  ]), (0, k.useEffect)(() => {
    let Y = !0;
    return V([]), fetch("/api/projects?id=" + encodeURIComponent(r.id) + "&view=brief", { cache: "no-store" }).then(async (j) => {
      const Z = await j.json();
      if (!j.ok) throw new Error(Z.error ?? "接續資料讀取失敗");
      Y && (V(Z.incoming), P(""));
    }).catch((j) => {
      Y && P(j.message);
    }), () => {
      Y = !1;
    };
  }, [r.id, r.revision]);
  const ge = rd(r).registration, pe = C || r.archived;
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
          /* @__PURE__ */ (0, l.jsx)("b", { children: o ? Wm[o.status] : "製作狀態尚未登記" }),
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
      o && /* @__PURE__ */ (0, l.jsxs)(l.Fragment, { children: [/* @__PURE__ */ (0, l.jsx)("p", { children: o.note }), /* @__PURE__ */ (0, l.jsxs)("small", { children: ["作者告知依據：", o.source] })] }),
      /* @__PURE__ */ (0, l.jsx)("p", {
        className: "inline-note",
        children: "製作完成、資料補登及素材實際檢視各自記錄。未登記檔案位置不等於尚未製作。"
      }),
      /* @__PURE__ */ (0, l.jsxs)("details", { children: [/* @__PURE__ */ (0, l.jsx)("summary", { children: "補登本集製作狀態" }), /* @__PURE__ */ (0, l.jsxs)("form", {
        className: "context-form",
        onSubmit: async (Y) => {
          Y.preventDefault(), await p("report_episode_completion", {
            status: H,
            note: A,
            source: K
          });
        },
        children: [
          /* @__PURE__ */ (0, l.jsxs)("label", { children: ["作者告知的製作狀態", /* @__PURE__ */ (0, l.jsxs)("select", {
            value: H,
            onChange: (Y) => T(Y.target.value),
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
            value: A,
            onChange: (Y) => z(Y.target.value)
          })] }),
          /* @__PURE__ */ (0, l.jsxs)("label", { children: ["告知來源", /* @__PURE__ */ (0, l.jsx)("input", {
            required: !0,
            maxLength: 2e3,
            value: K,
            onChange: (Y) => U(Y.target.value)
          })] }),
          /* @__PURE__ */ (0, l.jsx)("button", {
            className: "btn primary",
            disabled: pe,
            children: "保存作者告知狀態"
          })
        ]
      })] }),
      W && /* @__PURE__ */ (0, l.jsx)("p", {
        role: "alert",
        children: W
      }),
      oe.map((Y) => /* @__PURE__ */ (0, l.jsxs)("details", {
        className: "production-record",
        children: [/* @__PURE__ */ (0, l.jsxs)("summary", { children: [/* @__PURE__ */ (0, l.jsxs)("b", { children: [
          "來自 ",
          Y.fromEpisode,
          " 的接續資料"
        ] }), /* @__PURE__ */ (0, l.jsxs)("span", { children: [
          "v",
          Y.handoff.version,
          " · 來源集數紀錄版本 ",
          Y.fromRevision
        ] })] }), /* @__PURE__ */ (0, l.jsx)(Ir, {
          h: Y.handoff,
          target: r.episode
        })]
      }, Y.handoff.id)),
      M ? /* @__PURE__ */ (0, l.jsxs)("details", {
        className: "production-record",
        children: [/* @__PURE__ */ (0, l.jsxs)("summary", { children: [/* @__PURE__ */ (0, l.jsxs)("b", { children: ["交接至 ", x.find((Y) => Y.id === M.toEpisodeId)?.episode ?? "指定集數"] }), /* @__PURE__ */ (0, l.jsxs)("span", { children: ["接續資料 v", M.version] })] }), /* @__PURE__ */ (0, l.jsx)(Ir, {
          h: M,
          target: x.find((Y) => Y.id === M.toEpisodeId)?.episode ?? "指定集數"
        })]
      }) : /* @__PURE__ */ (0, l.jsx)("p", {
        className: "muted",
        children: "尚未保存本集對後續集數的交接資料。"
      }),
      /* @__PURE__ */ (0, l.jsxs)("details", { children: [/* @__PURE__ */ (0, l.jsx)("summary", { children: M ? "更新接續資料版本" : "補登跨集接續資料" }), S.length ? /* @__PURE__ */ (0, l.jsxs)("form", {
        className: "context-form",
        onSubmit: async (Y) => {
          Y.preventDefault(), await p("save_episode_handoff", {
            ...I,
            toEpisodeId: ne || S[0].id,
            baseVersion: M?.version ?? 0,
            sourceKeys: de.split(/[,，\n]/).map((j) => j.trim()).filter(Boolean)
          });
        },
        children: [
          /* @__PURE__ */ (0, l.jsxs)("label", { children: ["接續目標集數", /* @__PURE__ */ (0, l.jsx)("select", {
            value: ne || S[0].id,
            onChange: (Y) => he(Y.target.value),
            children: S.map((Y) => /* @__PURE__ */ (0, l.jsxs)("option", {
              value: Y.id,
              children: [
                Y.episode,
                " · ",
                Y.title
              ]
            }, Y.id))
          })] }),
          /* @__PURE__ */ (0, l.jsxs)("label", { children: ["接續資料名稱", /* @__PURE__ */ (0, l.jsx)("input", {
            required: !0,
            maxLength: 200,
            value: I.title,
            onChange: (Y) => $({
              ...I,
              title: Y.target.value
            })
          })] }),
          Ef.map(([Y, j]) => /* @__PURE__ */ (0, l.jsxs)("label", { children: [j, /* @__PURE__ */ (0, l.jsx)("textarea", {
            required: !0,
            rows: 3,
            maxLength: 6e3,
            value: I[Y],
            onChange: (Z) => $({
              ...I,
              [Y]: Z.target.value
            })
          })] }, Y)),
          /* @__PURE__ */ (0, l.jsxs)("label", { children: ["來源識別鍵（逗號分隔）", /* @__PURE__ */ (0, l.jsx)("textarea", {
            rows: 2,
            value: de,
            onChange: (Y) => Q(Y.target.value)
          })] }),
          /* @__PURE__ */ (0, l.jsx)("button", {
            className: "btn primary",
            disabled: pe,
            children: "保存接續資料版本"
          })
        ]
      }) : /* @__PURE__ */ (0, l.jsx)("p", { children: "先在作品專案新增下一集，再建立交接。" })] }),
      (r.production?.handoffs?.length ?? 0) > 1 && /* @__PURE__ */ (0, l.jsxs)("details", { children: [/* @__PURE__ */ (0, l.jsxs)("summary", { children: [
        "先前接續版本（",
        r.production.handoffs.length - 1,
        "）"
      ] }), r.production.handoffs.slice(0, -1).map((Y) => /* @__PURE__ */ (0, l.jsx)(Ir, {
        h: Y,
        target: x.find((j) => j.id === Y.toEpisodeId)?.episode ?? Y.toEpisodeId
      }, Y.id))] }),
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
var $r = {
  key: "",
  title: "",
  kind: "reference",
  content: "",
  source: "",
  location: "",
  baseVersion: void 0
};
function Pm({ work: r, episode: x, episodes: C, busy: p, onWorkAction: o, onSelectEpisode: M, onPin: S, mutate: H }) {
  const [T, A] = (0, k.useState)(x.title.split("｜")[0]), [z, K] = (0, k.useState)(""), [U, ne] = (0, k.useState)(""), [he, I] = (0, k.useState)(""), [$, de] = (0, k.useState)(""), [Q, oe] = (0, k.useState)(""), [V, W] = (0, k.useState)($r), [P, ge] = (0, k.useState)(!1);
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
          g.preventDefault(), await o("convert_episode", {
            title: T,
            episodeId: x.id,
            episodeRevision: x.revision
          });
        },
        children: [/* @__PURE__ */ (0, l.jsxs)("label", { children: ["作品專案名稱", /* @__PURE__ */ (0, l.jsx)("input", {
          required: !0,
          maxLength: 200,
          value: T,
          onChange: (g) => A(g.target.value)
        })] }), /* @__PURE__ */ (0, l.jsx)("button", {
          className: "btn primary",
          disabled: p,
          children: "建立作品專案並保留本集"
        })]
      })
    ]
  });
  const pe = C.filter((g) => g.workId === r.id).sort((g, ee) => g.episode.localeCompare(ee.episode, void 0, { numeric: !0 })), Y = Math.max(0, ...pe.map((g) => Number(g.episode.replace(/^EP/i, "")) || 0)) + 1, j = "EP" + String(Y).padStart(2, "0"), Z = [...new Map(r.sharedAssets.map((g) => [g.key, g])).values()], Se = Z.filter((g) => !he || [
    g.key,
    g.title,
    g.content,
    g.source
  ].join(" ").toLowerCase().includes(he.toLowerCase()));
  function qe(g) {
    W({
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
              /* @__PURE__ */ (0, l.jsxs)("b", { children: [pe.length, " 集"] }),
              /* @__PURE__ */ (0, l.jsxs)("b", { children: [Z.length, " 項共用來源"] }),
              /* @__PURE__ */ (0, l.jsx)("span", { children: "各集保留自己的劇本、進度與採用版本。" })
            ]
          }),
          /* @__PURE__ */ (0, l.jsx)("div", {
            className: "episode-grid",
            children: pe.map((g) => /* @__PURE__ */ (0, l.jsxs)("button", {
              className: "episode-card " + (g.id === x.id ? "selected" : ""),
              disabled: p,
              onClick: () => M(g.id),
              children: [
                /* @__PURE__ */ (0, l.jsx)("small", { children: g.episode }),
                /* @__PURE__ */ (0, l.jsx)("b", { children: g.title }),
                /* @__PURE__ */ (0, l.jsxs)("span", { children: [
                  g.shots,
                  " 列鏡頭 · ",
                  g.id === x.id ? "目前集數" : "開啟本集",
                  g.completionReport?.status === "completed" ? " · 作者告知完成" : ""
                ] })
              ]
            }, g.id))
          }),
          /* @__PURE__ */ (0, l.jsxs)("details", { children: [/* @__PURE__ */ (0, l.jsx)("summary", { children: "新增後續集數" }), /* @__PURE__ */ (0, l.jsxs)("form", {
            className: "context-form",
            onSubmit: async (g) => {
              g.preventDefault(), await o("create_episode", {
                episode: z || j,
                title: U || `${z || j} 製作資料`
              }) && (K(""), ne(""));
            },
            children: [
              /* @__PURE__ */ (0, l.jsxs)("div", {
                className: "context-form-grid",
                children: [/* @__PURE__ */ (0, l.jsxs)("label", { children: ["新集數", /* @__PURE__ */ (0, l.jsx)("input", {
                  required: !0,
                  pattern: "[Ee][Pp][0-9]{2,4}",
                  value: z || j,
                  onChange: (g) => K(g.target.value),
                  placeholder: "EP02"
                })] }), /* @__PURE__ */ (0, l.jsxs)("label", { children: ["本集名稱", /* @__PURE__ */ (0, l.jsx)("input", {
                  maxLength: 200,
                  value: U,
                  onChange: (g) => ne(g.target.value),
                  placeholder: `${z || j} 製作資料`
                })] })]
              }),
              /* @__PURE__ */ (0, l.jsx)("p", {
                className: "muted",
                children: "建立空白流程；EP01 的劇情、鏡頭及完成狀態不會複製到下一集。"
              }),
              /* @__PURE__ */ (0, l.jsx)("button", {
                className: "btn primary",
                disabled: p,
                children: "建立新集數"
              })
            ]
          })] })
        ]
      }),
      /* @__PURE__ */ (0, l.jsx)(Fm, {
        project: x,
        episodes: C,
        busy: p,
        mutate: H
      }),
      /* @__PURE__ */ (0, l.jsxs)("div", {
        className: "wide-card",
        children: [
          /* @__PURE__ */ (0, l.jsxs)("div", {
            className: "section-title",
            children: [/* @__PURE__ */ (0, l.jsxs)("div", { children: [/* @__PURE__ */ (0, l.jsx)("h2", { children: "作品共用資料" }), /* @__PURE__ */ (0, l.jsx)("p", { children: "原作、角色、場景、世界設定及聲線參考。連結到集數時保存指定版本，之後更新共用資料仍保留各集原先使用的版本。" })] }), /* @__PURE__ */ (0, l.jsx)("button", {
              className: "btn",
              disabled: p,
              onClick: () => {
                W($r), ge(!P);
              },
              children: "新增共用參考"
            })]
          }),
          P && /* @__PURE__ */ (0, l.jsxs)("form", {
            className: "context-form",
            onSubmit: async (g) => {
              g.preventDefault(), await o("save_shared_asset", V) && (ge(!1), W($r));
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
                disabled: p,
                children: V.baseVersion ? "保存新版本" : "保存共用來源"
              })
            ]
          }),
          /* @__PURE__ */ (0, l.jsxs)("label", {
            className: "work-search",
            children: ["搜尋共用資料", /* @__PURE__ */ (0, l.jsx)("input", {
              placeholder: "原作章名、角色、場景或設定",
              value: he,
              onChange: (g) => I(g.target.value)
            })]
          }),
          /* @__PURE__ */ (0, l.jsxs)("p", {
            className: "muted",
            children: [
              Se.length,
              " 項來源；目前連結目標為 ",
              x.episode,
              "。"
            ]
          }),
          Se.slice(0, 60).map((g) => /* @__PURE__ */ (0, l.jsxs)("details", {
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
                  C.find((ee) => ee.id === g.originEpisodeId)?.episode ?? g.originEpisodeId,
                  "；按本集需求選用。"
                ]
              }),
              /* @__PURE__ */ (0, l.jsxs)("div", {
                className: "context-actions",
                children: [/* @__PURE__ */ (0, l.jsx)("button", {
                  className: "btn",
                  disabled: p || !!x.sharedPins?.some((ee) => ee.assetId === g.id),
                  onClick: () => {
                    S(g.id);
                  },
                  children: x.sharedPins?.some((ee) => ee.assetId === g.id) ? `${x.episode} 已連結此版本` : `連結此版本至 ${x.episode}`
                }), /* @__PURE__ */ (0, l.jsx)("button", {
                  className: "btn",
                  disabled: p,
                  onClick: () => qe(g),
                  children: "建立新版本"
                })]
              }),
              (x.sharedPins?.filter((ee) => ee.assetKey === g.key).at(-1)?.version ?? g.version) < g.version && /* @__PURE__ */ (0, l.jsx)("p", {
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
                value: $,
                onChange: (g) => {
                  de(g.target.value), oe("");
                }
              })] }),
              Q && /* @__PURE__ */ (0, l.jsx)("p", {
                role: "alert",
                children: Q
              }),
              /* @__PURE__ */ (0, l.jsx)("button", {
                className: "btn primary",
                disabled: p || !$.trim(),
                onClick: async () => {
                  try {
                    const g = JSON.parse($);
                    if (!Array.isArray(g.assets)) throw new Error("缺少 assets 清單");
                    await o("import_shared_assets", { assets: g.assets }) && de("");
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
var mf = {
  key: "",
  title: "",
  world: "real",
  label: "v2_candidate",
  sourceLocation: "",
  sourceVersion: "",
  backupLocation: "",
  sha256: "",
  reference: ""
}, ex = {
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
function tx({ initialSelection: r, work: x, episode: C, episodes: p, busy: o, onAction: M, onProject: S, onDirty: H }) {
  const [T, A] = (0, k.useState)(r?.modelId ?? ""), [z, K] = (0, k.useState)(r?.versionId ?? ""), [U, ne] = (0, k.useState)(r?.stageId ?? "M01"), [he, I] = (0, k.useState)(null), [$, de] = (0, k.useState)(mf), [Q, oe] = (0, k.useState)(""), V = x ? Es(x) : null, W = V?.models.find((E) => E.id === T) ?? V?.models[0], P = W?.versions.find((E) => E.id === z) ?? W?.versions.at(-1), ge = P?.stages[U], pe = Na.find((E) => E.id === U);
  function Y(E) {
    le(E), H(E);
  }
  const [j, Z] = (0, k.useState)([]), [Se, qe] = (0, k.useState)(""), [g, ee] = (0, k.useState)(""), [X, B] = (0, k.useState)(""), [G, ce] = (0, k.useState)(""), [fe, Ae] = (0, k.useState)(""), [h, R] = (0, k.useState)("technical"), [J, ae] = (0, k.useState)({}), [je, F] = (0, k.useState)(""), [ue, Ue] = (0, k.useState)(""), [b, le] = (0, k.useState)(!1);
  (0, k.useEffect)(() => {
    ge && (Z(ge.checks), qe(ge.evidence), ee(ge.summary), B(ge.nextStep), ce(P.candidateLocation), Y(!1));
  }, [ge, P]), (0, k.useEffect)(() => {
    if (!b) return;
    const E = (ze) => ze.preventDefault();
    return window.addEventListener("beforeunload", E), () => window.removeEventListener("beforeunload", E);
  }, [b]);
  function se(E) {
    b && !window.confirm("有未儲存模型紀錄，要放棄修改嗎？") || (Y(!1), oe(""), E());
  }
  async function ye(E, ze) {
    oe("");
    const at = await M(E, ze);
    return at && Y(!1), at;
  }
  function Oe() {
    !W || !P || (de({
      key: W.key,
      title: W.title,
      world: W.world,
      label: "v" + (P.number + 2) + "_candidate",
      sourceLocation: P.sourceLocation,
      sourceVersion: P.sourceVersion,
      backupLocation: P.backupLocation,
      sha256: P.sha256,
      reference: P.reference
    }), I("version"));
  }
  if (!x) return /* @__PURE__ */ (0, l.jsxs)("section", {
    className: "wide-card",
    children: [
      /* @__PURE__ */ (0, l.jsx)("h2", { children: "3D 模型製作流程" }),
      /* @__PURE__ */ (0, l.jsx)("p", {
        className: "stage-description",
        children: "模型屬於作品共用資產。先把本集整理到作品專案，即可登記模型及候選版本，供後續各集引用。"
      }),
      /* @__PURE__ */ (0, l.jsxs)("button", {
        className: "btn primary",
        onClick: S,
        children: ["前往作品專案 ", /* @__PURE__ */ (0, l.jsx)(li, { size: 15 })]
      })
    ]
  });
  const ct = V.issues.filter((E) => E.modelId === W?.id && E.versionId === P?.id), ot = ct.filter((E) => E.status === "open"), m = !!P?.stages.M08.author, te = W && P ? Om(x, W.id, P.id, U) : [], tt = V.pins.filter((E) => E.episodeId === C.id), Dt = new Map(tt.map((E) => [[E.modelId, E.sceneIds].join("|"), E]));
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
            /* @__PURE__ */ (0, l.jsxs)("h2", { children: [/* @__PURE__ */ (0, l.jsx)(ed, { size: 23 }), "模型製作與完善"] }),
            /* @__PURE__ */ (0, l.jsxs)("p", { children: [x.title, " · 各模型、各候選及各集引用分開記錄。"] })
          ] }), /* @__PURE__ */ (0, l.jsxs)("button", {
            className: "btn primary",
            disabled: o,
            onClick: () => se(() => {
              de(mf), I("register");
            }),
            children: [/* @__PURE__ */ (0, l.jsx)(Pt, { size: 15 }), "登記模型"]
          })]
        }), /* @__PURE__ */ (0, l.jsxs)("div", {
          className: "model-principles",
          children: [
            /* @__PURE__ */ (0, l.jsxs)("span", { children: [/* @__PURE__ */ (0, l.jsx)(xl, { size: 15 }), "先讀原檔與設定"] }),
            /* @__PURE__ */ (0, l.jsxs)("span", { children: [/* @__PURE__ */ (0, l.jsx)(td, { size: 15 }), "保留原檔及版本"] }),
            /* @__PURE__ */ (0, l.jsxs)("span", { children: [/* @__PURE__ */ (0, l.jsx)(si, { size: 15 }), "技術、視覺與採用分開"] })
          ]
        })]
      }),
      he && /* @__PURE__ */ (0, l.jsxs)("form", {
        className: "wide-card context-form model-register",
        onSubmit: async (E) => {
          E.preventDefault();
          const ze = await ye(he === "register" ? "register_model" : "create_model_version", {
            ...$,
            modelId: W?.id
          });
          if (ze) {
            const at = he === "register" ? ze.work.modelFlow?.models.at(-1) : ze.work.modelFlow?.models.find((Jt) => Jt.id === W?.id);
            I(null), A(at?.id ?? ""), K(at?.versions.at(-1)?.id ?? ""), ne("M01");
          }
        },
        children: [
          /* @__PURE__ */ (0, l.jsxs)("div", {
            className: "section-title",
            children: [/* @__PURE__ */ (0, l.jsx)("h3", { children: he === "register" ? "登記模型來源" : "建立新候選版本" }), /* @__PURE__ */ (0, l.jsx)("button", {
              className: "text-btn",
              type: "button",
              onClick: () => I(null),
              children: "關閉"
            })]
          }),
          /* @__PURE__ */ (0, l.jsxs)("div", {
            className: "context-form-grid",
            children: [
              he === "register" && /* @__PURE__ */ (0, l.jsxs)(l.Fragment, { children: [
                /* @__PURE__ */ (0, l.jsxs)("label", { children: ["模型固定識別鍵 *", /* @__PURE__ */ (0, l.jsx)("input", {
                  required: !0,
                  maxLength: 100,
                  value: $.key,
                  placeholder: "RG-REAL-01",
                  onChange: (E) => de({
                    ...$,
                    key: E.target.value
                  })
                })] }),
                /* @__PURE__ */ (0, l.jsxs)("label", { children: ["模型名稱 *", /* @__PURE__ */ (0, l.jsx)("input", {
                  required: !0,
                  maxLength: 200,
                  value: $.title,
                  placeholder: "現實主角家",
                  onChange: (E) => de({
                    ...$,
                    title: E.target.value
                  })
                })] }),
                /* @__PURE__ */ (0, l.jsxs)("label", { children: ["世界／場景分類", /* @__PURE__ */ (0, l.jsxs)("select", {
                  value: $.world,
                  onChange: (E) => de({
                    ...$,
                    world: E.target.value
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
                value: $.label,
                onChange: (E) => de({
                  ...$,
                  label: E.target.value
                })
              })] }),
              [
                ["sourceLocation", "正式來源 GLB 位置 *"],
                ["sourceVersion", "來源版本／清單版本 *"],
                ["backupLocation", "原檔備份位置"],
                ["sha256", "原檔 SHA-256（實際計算值）"]
              ].map(([E, ze]) => /* @__PURE__ */ (0, l.jsxs)("label", { children: [ze, /* @__PURE__ */ (0, l.jsx)("input", {
                required: E === "sourceLocation" || E === "sourceVersion",
                maxLength: E === "sha256" ? 64 : 2e3,
                pattern: E === "sha256" ? "[a-fA-F0-9]{64}" : void 0,
                value: $[E],
                onChange: (at) => de({
                  ...$,
                  [E]: at.target.value
                })
              })] }, E))
            ]
          }),
          /* @__PURE__ */ (0, l.jsxs)("label", { children: ["設定與尺度來源／不可改動項目", /* @__PURE__ */ (0, l.jsx)("textarea", {
            rows: 4,
            maxLength: 12e3,
            value: $.reference,
            onChange: (E) => de({
              ...$,
              reference: E.target.value
            }),
            placeholder: "設計書與平面圖版本、固定節點／家具 ID、單位、重大變更待核定項。"
          })] }),
          /* @__PURE__ */ (0, l.jsx)("p", {
            className: "muted",
            children: "來源會隨此版本保存。待補欄位可先留空，但原檔、備份與雜湊不齊時不能通過盤點；更正來源請另建版本。登記資料不會修改或上傳模型檔案。"
          }),
          /* @__PURE__ */ (0, l.jsx)("button", {
            className: "btn primary",
            disabled: o,
            children: "保存模型來源與空白流程"
          })
        ]
      }),
      !W || !P ? /* @__PURE__ */ (0, l.jsxs)("div", {
        className: "wide-card empty",
        children: [
          /* @__PURE__ */ (0, l.jsx)(ed, { size: 36 }),
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
                  disabled: o,
                  onChange: (E) => se(() => {
                    A(E.target.value), K(""), ne("M01");
                  }),
                  children: V.models.map((E) => /* @__PURE__ */ (0, l.jsxs)("option", {
                    value: E.id,
                    children: [
                      E.key,
                      " · ",
                      E.title
                    ]
                  }, E.id))
                })] }),
                /* @__PURE__ */ (0, l.jsxs)("label", { children: ["精確版本", /* @__PURE__ */ (0, l.jsx)("select", {
                  value: P.id,
                  disabled: o,
                  onChange: (E) => se(() => K(E.target.value)),
                  children: W.versions.map((E) => /* @__PURE__ */ (0, l.jsxs)("option", {
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
                /* @__PURE__ */ (0, l.jsxs)("button", {
                  className: "btn",
                  disabled: o,
                  onClick: () => se(Oe),
                  children: [/* @__PURE__ */ (0, l.jsx)(Pt, { size: 14 }), "另建候選版本"]
                })
              ]
            }),
            /* @__PURE__ */ (0, l.jsxs)("div", {
              className: "production-totals",
              children: [
                /* @__PURE__ */ (0, l.jsxs)("b", { children: [Na.filter((E) => P.stages[E.id].author).length, " / 8 階段核定"] }),
                /* @__PURE__ */ (0, l.jsxs)("b", { children: [ot.length, " 項待修或待裁定"] }),
                /* @__PURE__ */ (0, l.jsxs)("span", { children: [
                  W.world === "real" ? "現實場景" : W.world === "game" ? "遊戲場景" : "其他模型",
                  " · ",
                  m ? "此採用版本保持不變" : "候選製作中"
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
          children: Na.map((E, ze) => /* @__PURE__ */ (0, l.jsxs)("button", {
            disabled: o,
            className: "model-step " + (U === E.id ? "selected" : "") + (P.stages[E.id].author ? " passed" : ""),
            onClick: () => se(() => ne(E.id)),
            children: [
              /* @__PURE__ */ (0, l.jsx)("small", { children: E.id }),
              /* @__PURE__ */ (0, l.jsx)("b", { children: E.title }),
              /* @__PURE__ */ (0, l.jsx)("span", { children: P.stages[E.id].author ? "作者已確認" : P.stages[E.id].status === "needs_revision" ? "待修正" : P.stages[E.id].status === "candidate" ? "已有工作回報" : "待製作" })
            ]
          }, E.id))
        }),
        /* @__PURE__ */ (0, l.jsxs)("div", {
          className: "wide-card model-stage-detail",
          children: [
            /* @__PURE__ */ (0, l.jsxs)("div", {
              className: "section-title",
              children: [/* @__PURE__ */ (0, l.jsxs)("div", { children: [/* @__PURE__ */ (0, l.jsxs)("div", {
                className: "eyebrow",
                children: [
                  pe.id,
                  " · ",
                  W.title,
                  " · ",
                  P.label
                ]
              }), /* @__PURE__ */ (0, l.jsx)("h2", { children: pe.title })] }), /* @__PURE__ */ (0, l.jsx)("span", {
                className: "status " + (ge.author ? "passed" : ge.status === "needs_revision" ? "needs_revision" : "candidate"),
                children: ge.author ? "作者已確認" : ge.status === "todo" ? "待製作" : "待確認工作"
              })]
            }),
            /* @__PURE__ */ (0, l.jsxs)("div", {
              className: "output-box",
              children: [/* @__PURE__ */ (0, l.jsx)(xl, { size: 19 }), /* @__PURE__ */ (0, l.jsxs)("div", { children: [/* @__PURE__ */ (0, l.jsx)("strong", { children: "應留下的產出" }), /* @__PURE__ */ (0, l.jsx)("p", { children: pe.output })] })]
            }),
            /* @__PURE__ */ (0, l.jsxs)("form", {
              className: "context-form",
              onSubmit: async (E) => {
                E.preventDefault(), await ye("save_model_stage", {
                  modelId: W.id,
                  versionId: P.id,
                  stageId: U,
                  checks: j,
                  evidence: Se,
                  summary: g,
                  nextStep: X,
                  candidateLocation: G
                });
              },
              children: [
                /* @__PURE__ */ (0, l.jsx)("div", {
                  className: "checklist",
                  children: pe.checks.map((E, ze) => /* @__PURE__ */ (0, l.jsxs)("label", { children: [/* @__PURE__ */ (0, l.jsx)("input", {
                    type: "checkbox",
                    disabled: o || m,
                    checked: j[ze] ?? !1,
                    onChange: (at) => {
                      Z((Jt) => Jt.map((We, Ja) => Ja === ze ? at.target.checked : We)), Y(!0);
                    }
                  }), /* @__PURE__ */ (0, l.jsx)("span", { children: E })] }, E))
                }),
                U === "M04" && /* @__PURE__ */ (0, l.jsxs)("label", { children: ["本次獨立候選 GLB", /* @__PURE__ */ (0, l.jsx)("input", {
                  disabled: o || m,
                  maxLength: 2e3,
                  value: G,
                  placeholder: ".../reality-home_v2_candidate.glb",
                  onChange: (E) => {
                    ce(E.target.value), Y(!0);
                  }
                })] }),
                /* @__PURE__ */ (0, l.jsxs)("label", { children: ["實際產出／檢查依據位置", /* @__PURE__ */ (0, l.jsx)("textarea", {
                  rows: 2,
                  disabled: o || m,
                  value: Se,
                  onChange: (E) => {
                    qe(E.target.value), Y(!0);
                  },
                  placeholder: "原檔盤點報告、逐物件差異、檢查結果或指定鏡位截圖；附來源版本。"
                })] }),
                /* @__PURE__ */ (0, l.jsxs)("label", { children: ["本次實際做了什麼 *", /* @__PURE__ */ (0, l.jsx)("textarea", {
                  required: !0,
                  rows: 3,
                  maxLength: 6e3,
                  disabled: o || m,
                  value: g,
                  onChange: (E) => {
                    ee(E.target.value), Y(!0);
                  },
                  placeholder: "具體節點／物件、改動、檢查方式、尚未完成項。"
                })] }),
                /* @__PURE__ */ (0, l.jsxs)("label", { children: ["下一位 AI 從哪裡繼續 *", /* @__PURE__ */ (0, l.jsx)("textarea", {
                  required: !0,
                  rows: 3,
                  maxLength: 6e3,
                  disabled: o || m,
                  value: X,
                  onChange: (E) => {
                    B(E.target.value), Y(!0);
                  },
                  placeholder: "指定版本、檔案位置、先讀資料、下一個物件或鏡位，以及受阻原因。"
                })] }),
                /* @__PURE__ */ (0, l.jsxs)("div", {
                  className: "context-actions",
                  children: [/* @__PURE__ */ (0, l.jsxs)("button", {
                    className: "btn",
                    disabled: o || m || !b,
                    children: ["保存候選工作紀錄", b ? " *" : ""]
                  }), /* @__PURE__ */ (0, l.jsxs)("button", {
                    type: "button",
                    className: "btn primary",
                    disabled: o || m || b || te.length > 0 || !!ge.author,
                    onClick: () => {
                      ye(U === "M08" ? "adopt_model_version" : "approve_model_stage", {
                        modelId: W.id,
                        versionId: P.id,
                        stageId: U,
                        note: "作者確認指定候選版本與適用範圍"
                      });
                    },
                    children: [/* @__PURE__ */ (0, l.jsx)(si, { size: 15 }), U === "M08" ? "作者登記採用此版本" : "作者確認本階段"]
                  })]
                }),
                /* @__PURE__ */ (0, l.jsx)("p", {
                  className: "muted",
                  children: m ? "已採用版本及舊集引用保持不變；需要修改請另建候選。" : b ? "請先保存工作紀錄，再確認。" : te.length ? "待補：" + te.join("；") : "檢查條件已齊，請核對實際成果後確認。"
                }),
                U === "M08" && /* @__PURE__ */ (0, l.jsx)("p", {
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
              onSubmit: async (E) => {
                E.preventDefault(), await ye("report_model_issue", {
                  modelId: W.id,
                  versionId: P.id,
                  stageId: U,
                  kind: h,
                  reason: fe
                }) && Ae("");
              },
              children: [
                /* @__PURE__ */ (0, l.jsxs)("div", {
                  className: "context-form-grid",
                  children: [/* @__PURE__ */ (0, l.jsxs)("label", { children: ["問題分類", /* @__PURE__ */ (0, l.jsxs)("select", {
                    value: h,
                    onChange: (E) => R(E.target.value),
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
                    value: pe.id + " " + pe.title
                  })] })]
                }),
                /* @__PURE__ */ (0, l.jsxs)("label", { children: ["具體原因", /* @__PURE__ */ (0, l.jsx)("textarea", {
                  required: !0,
                  rows: 2,
                  maxLength: 6e3,
                  value: fe,
                  onChange: (E) => Ae(E.target.value)
                })] }),
                /* @__PURE__ */ (0, l.jsxs)("button", {
                  className: "btn",
                  disabled: o || !fe.trim(),
                  children: [/* @__PURE__ */ (0, l.jsx)(ii, { size: 15 }), "登記問題"]
                })
              ]
            }),
            ct.map((E) => /* @__PURE__ */ (0, l.jsxs)("article", {
              className: "context-record",
              children: [
                /* @__PURE__ */ (0, l.jsxs)("div", {
                  className: "issue-top",
                  children: [/* @__PURE__ */ (0, l.jsx)("span", {
                    className: "status " + (E.status === "open" ? "needs_revision" : "passed"),
                    children: E.status === "open" ? "待處理" : "作者已複核"
                  }), /* @__PURE__ */ (0, l.jsxs)("b", { children: [
                    E.stageId,
                    " · ",
                    E.kind === "major" ? "重大變更" : E.kind === "technical" ? "技術" : "視覺"
                  ] })]
                }),
                /* @__PURE__ */ (0, l.jsx)("p", { children: E.reason }),
                /* @__PURE__ */ (0, l.jsxs)("small", { children: [
                  E.by,
                  " · ",
                  new Date(E.at).toLocaleString("zh-TW", { timeZone: "Asia/Taipei" })
                ] }),
                E.status === "open" ? /* @__PURE__ */ (0, l.jsxs)("form", {
                  className: "context-form",
                  onSubmit: async (ze) => {
                    ze.preventDefault(), await ye("resolve_model_issue", {
                      modelId: W.id,
                      versionId: P.id,
                      issueId: E.id,
                      resolution: J[E.id] ?? ""
                    });
                  },
                  children: [/* @__PURE__ */ (0, l.jsxs)("label", { children: ["作者修正複核／裁定結果", /* @__PURE__ */ (0, l.jsx)("textarea", {
                    required: !0,
                    rows: 2,
                    maxLength: 6e3,
                    value: J[E.id] ?? "",
                    onChange: (ze) => ae({
                      ...J,
                      [E.id]: ze.target.value
                    })
                  })] }), /* @__PURE__ */ (0, l.jsx)("button", {
                    className: "btn",
                    disabled: o,
                    children: "作者確認處理結果"
                  })]
                }) : /* @__PURE__ */ (0, l.jsxs)("p", { children: ["處理結果：", E.resolution] })
              ]
            }, E.id))
          ]
        }),
        /* @__PURE__ */ (0, l.jsxs)("div", {
          className: "wide-card",
          children: [
            /* @__PURE__ */ (0, l.jsx)("div", {
              className: "section-title",
              children: /* @__PURE__ */ (0, l.jsxs)("div", { children: [/* @__PURE__ */ (0, l.jsxs)("h2", { children: [/* @__PURE__ */ (0, l.jsx)(sd, { size: 19 }), "各集固定版本引用"] }), /* @__PURE__ */ (0, l.jsxs)("p", { children: [
                "目前集數：",
                C.episode,
                "。新候選不會自動替換 EP01 或其他集的模型來源。"
              ] })] })
            }),
            m && /* @__PURE__ */ (0, l.jsxs)("form", {
              className: "context-form",
              onSubmit: async (E) => {
                E.preventDefault(), await ye("pin_model_version", {
                  modelId: W.id,
                  versionId: P.id,
                  episodeId: C.id,
                  purpose: je,
                  sceneIds: ue
                }) && (F(""), Ue(""));
              },
              children: [/* @__PURE__ */ (0, l.jsxs)("div", {
                className: "context-form-grid",
                children: [/* @__PURE__ */ (0, l.jsxs)("label", { children: ["引用場次（選填）", /* @__PURE__ */ (0, l.jsx)("input", {
                  value: ue,
                  maxLength: 1e3,
                  placeholder: "S06、S07",
                  onChange: (E) => Ue(E.target.value)
                })] }), /* @__PURE__ */ (0, l.jsxs)("label", { children: ["本集用途 *", /* @__PURE__ */ (0, l.jsx)("input", {
                  required: !0,
                  value: je,
                  maxLength: 2e3,
                  placeholder: "固定樓梯、餐桌與走道位置",
                  onChange: (E) => F(E.target.value)
                })] })]
              }), /* @__PURE__ */ (0, l.jsxs)("button", {
                className: "btn",
                disabled: o || ot.length > 0,
                children: ["將此採用版本引用至 ", C.episode]
              })]
            }),
            tt.length ? /* @__PURE__ */ (0, l.jsx)("div", {
              className: "model-pins",
              children: tt.map((E, ze) => {
                const at = V.models.find((We) => We.id === E.modelId), Jt = at?.versions.find((We) => We.id === E.versionId);
                return /* @__PURE__ */ (0, l.jsxs)("article", { children: [
                  /* @__PURE__ */ (0, l.jsxs)("b", { children: [
                    at?.title,
                    " · ",
                    Jt?.label
                  ] }),
                  " ",
                  /* @__PURE__ */ (0, l.jsx)("span", {
                    className: "status " + (Dt.get([E.modelId, E.sceneIds].join("|")) === E ? "passed" : "todo"),
                    children: Dt.get([E.modelId, E.sceneIds].join("|")) === E ? "本集現行引用" : "歷史引用"
                  }),
                  /* @__PURE__ */ (0, l.jsxs)("p", { children: [
                    E.sceneIds || "本集",
                    " ／ ",
                    E.purpose
                  ] }),
                  /* @__PURE__ */ (0, l.jsx)("code", { children: Jt?.candidateLocation })
                ] }, ze);
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
            V.history.filter((E) => E.modelId === W.id).length,
            "）"
          ] }), [...V.history].reverse().filter((E) => E.modelId === W.id).slice(0, 60).map((E, ze) => /* @__PURE__ */ (0, l.jsxs)("article", {
            className: "context-mini",
            children: [
              /* @__PURE__ */ (0, l.jsxs)("b", { children: [
                ex[E.action] ?? E.action,
                " · ",
                E.stageId,
                " · ",
                W.versions.find((at) => at.id === E.versionId)?.label
              ] }),
              /* @__PURE__ */ (0, l.jsx)("p", { children: E.detail }),
              /* @__PURE__ */ (0, l.jsxs)("small", { children: [
                E.actor === "ai" ? "AI" : "作者",
                " · ",
                E.by,
                " · ",
                new Date(E.at).toLocaleString("zh-TW", { timeZone: "Asia/Taipei" })
              ] })
            ]
          }, ze))]
        })
      ] }),
      Q && /* @__PURE__ */ (0, l.jsx)("p", {
        role: "alert",
        children: Q
      })
    ]
  });
}
var Wr = "https://lihuany635-create.github.io/lizhi-cloud-web/?open=animationflow", Fr = {
  todo: "待製作",
  candidate: "候選待驗收",
  passed: "已通過",
  in_timeline: "已入片",
  needs_revision: "待修正"
}, xf = [
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
function ai(r) {
  return r ? new Date(r).toLocaleString("zh-TW", {
    timeZone: "Asia/Taipei",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  }) : "尚無紀錄";
}
function ax(r, x, C = "application/json") {
  const p = URL.createObjectURL(new Blob([x], { type: C })), o = document.createElement("a");
  o.href = p, o.download = r, o.click(), setTimeout(() => URL.revokeObjectURL(p), 1e3);
}
function lx({ nativeTransport: r, initialWorkId: x, initialTab: C = "resume", onDirtyChange: p } = {}) {
  const [o, M] = (0, k.useState)([]), [S, H] = (0, k.useState)(null), [T, A] = (0, k.useState)(C), [z, K] = (0, k.useState)("01"), [U, ne] = (0, k.useState)(null), [he, I] = (0, k.useState)([]), [$, de] = (0, k.useState)(!0), [Q, oe] = (0, k.useState)(!1), [V, W] = (0, k.useState)(""), [P, ge] = (0, k.useState)(""), [pe, Y] = (0, k.useState)(!1), [j, Z] = (0, k.useState)([]), [Se, qe] = (0, k.useState)(""), [g, ee] = (0, k.useState)(""), [X, B] = (0, k.useState)(!1), [G, ce] = (0, k.useState)(null), [fe, Ae] = (0, k.useState)({}), [h, R] = (0, k.useState)(""), [J, ae] = (0, k.useState)(!1), [je, F] = (0, k.useState)(null), ue = (0, k.useRef)(0), Ue = (0, k.useRef)(""), b = (0, k.useRef)(!1);
  (0, k.useEffect)(() => {
    b.current = X, p?.(X);
  }, [X, p]);
  const le = (0, k.useCallback)((u) => {
    Ue.current = u.id, H(u), ne((xe) => xe?.id === u.workId ? xe : null), M((xe) => [ad(u), ...xe.filter((be) => be.id !== u.id)]), B(!1);
  }, []);
  async function se(u, xe, be = "projects") {
    const Fe = r ? await r(be, u, xe) : await fetch("/api/" + be + u, {
      cache: "no-store",
      ...xe ? {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(xe)
      } : {}
    });
    if (Fe.status === 401)
      throw Y(!0), new Error("請先登入流程工作台");
    if (!Fe.headers.get("content-type")?.includes("application/json"))
      throw Y(!0), new Error("請開啟工作台並使用 ChatGPT 登入");
    const Xe = await Fe.json();
    if (!Fe.ok) throw new Error(Xe.error || "讀取失敗");
    return Y(!1), Xe;
  }
  const ye = (0, k.useCallback)(async (u) => {
    const xe = ++ue.current;
    u && u !== Ue.current && (Ue.current = u, de(!0));
    try {
      const [be, Fe] = await Promise.all([se(""), se("", void 0, "works")]), Xe = x ? be.filter((jt) => jt.workId === x) : be, bt = u || Ue.current || Xe.find((jt) => !jt.archived && jt.workId && jt.episode === "EP01")?.id || Xe.find((jt) => !jt.archived && jt.workId)?.id || Xe.find((jt) => !jt.archived)?.id;
      let rt = null, ln = null;
      if (bt && (rt = await se("?id=" + encodeURIComponent(bt)), rt.workId && (ln = (await se("?id=" + encodeURIComponent(rt.workId), void 0, "works")).work)), xe !== ue.current) return;
      W(""), M(Xe), I(x ? Fe.filter((jt) => jt.id === x) : Fe), b.current || (rt ? le(rt) : H(null), ne(ln));
    } catch (be) {
      xe === ue.current && W(be.message);
    } finally {
      xe === ue.current && de(!1);
    }
  }, [le, x]);
  (0, k.useEffect)(() => {
    const u = new URLSearchParams(window.location.search).get("view");
    !x && u && [
      "resume",
      "project",
      "models",
      "context"
    ].includes(u) && A(u);
  }, []), (0, k.useEffect)(() => {
    ye();
  }, [ye]), (0, k.useEffect)(() => {
    const u = setInterval(() => {
      !X && !G && !Q && ye(Ue.current || void 0);
    }, 2e4);
    return () => clearInterval(u);
  }, [
    X,
    G,
    Q,
    S?.id,
    ye
  ]), (0, k.useEffect)(() => {
    const u = S?.stages[z];
    u && (Z(u.checks), qe(u.evidence), ee(u.note), B(!1));
  }, [S, z]), (0, k.useEffect)(() => {
    if (!X) return;
    const u = (xe) => {
      xe.preventDefault();
    };
    return window.addEventListener("beforeunload", u), () => window.removeEventListener("beforeunload", u);
  }, [X]), (0, k.useEffect)(() => {
    if (!P) return;
    const u = setTimeout(() => ge(""), 4500);
    return () => clearTimeout(u);
  }, [P]);
  async function Oe(u, xe = {}) {
    if (S) {
      ue.current++, oe(!0), W("");
      try {
        const be = await se("", {
          projectId: S.id,
          revision: S.revision,
          action: u,
          args: xe
        });
        return le(be), be.archived && ae(!0), ge("已儲存至雲端"), be;
      } catch (be) {
        W(be.message);
      } finally {
        oe(!1);
      }
    }
  }
  async function ct(u, xe) {
    ue.current++, oe(!0), W("");
    try {
      const be = await se("", [
        "convert_episode",
        "create_work",
        "create_episode"
      ].includes(u) ? {
        action: u,
        ...xe,
        workId: U?.id,
        revision: U?.revision
      } : {
        action: u,
        workId: U?.id,
        revision: U?.revision,
        args: xe
      }, "works");
      return ne(be.work), I((Fe) => [{
        ...Hm(be.work),
        episodeCount: be.episodes.length
      }, ...Fe.filter((Xe) => Xe.id !== be.work.id)]), M((Fe) => [...be.episodes, ...Fe.filter((Xe) => !be.episodes.some((bt) => bt.id === Xe.id))]), be.episode && le(be.episode), ge("作品專案已儲存"), be;
    } catch (be) {
      if (W(be.message), u === "create_episode") throw be;
    } finally {
      oe(!1);
    }
  }
  function ot(u) {
    X && !window.confirm("此階段有未儲存修改，要放棄修改嗎？") || (B(!1), u());
  }
  function m(u) {
    ot(() => K(u));
  }
  function te(u) {
    ot(() => {
      A(u), [
        "main",
        "op",
        "ed"
      ].includes(u) && K(Kt.find((xe) => xe.group === u).id);
    });
  }
  async function tt(u) {
    u.preventDefault(), oe(!0), W("");
    try {
      G === "create" ? (U ? await ct("create_episode", {
        title: fe.title || "製作資料",
        episode: fe.episode || "EP01"
      }) : le(await se("", {
        action: "create_project",
        title: fe.title || "現實遊戲",
        episode: fe.episode || "EP01"
      })), A("main"), K("01"), ce(null), ge("專案已建立，全部階段待確認")) : G === "shot" ? await Oe("save_shot", fe) && ce(null) : G === "issue" ? await Oe("add_issue", fe) && ce(null) : G === "resolve" ? await Oe("resolve_issue", fe) && ce(null) : G === "archive" && await Oe(S?.archived ? "restore" : "archive") && ce(null);
    } catch (xe) {
      W(xe.message);
    } finally {
      oe(!1);
    }
  }
  const Dt = S ? ad(S) : null, E = Kt.find((u) => u.id === z), ze = S?.stages[z], at = S ? wf(S, z) : [], Jt = S ? ws(S, z) : [], We = Kt.filter((u) => u.group === T), Ja = S?.issues.filter((u) => u.status === "open") || [], bl = S?.production?.completionReports?.at(-1), Ut = bl?.status === "completed", ea = S ? rd(S).registration : null, Ia = [
    [
      "resume",
      "工作首頁",
      ni
    ],
    [
      "project",
      "作品與集數",
      Pi
    ],
    [
      "models",
      "3D 模型",
      sf
    ],
    [
      "settings",
      "採用設定",
      xl
    ],
    [
      "context",
      "資料與交接",
      ni
    ],
    [
      "main",
      "動畫製作",
      bm
    ],
    [
      "op",
      "片頭 OP",
      Gr
    ],
    [
      "ed",
      "片尾 ED",
      Pi
    ],
    [
      "shots",
      "鏡頭與素材",
      sf
    ],
    [
      "issues",
      "待修問題",
      ii
    ],
    [
      "chatgpt",
      "AI 協作",
      Xr
    ],
    [
      "history",
      "異動紀錄",
      yf
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
            href: Wr,
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
            children: [/* @__PURE__ */ (0, l.jsx)(Pi, { size: 19 }), /* @__PURE__ */ (0, l.jsxs)("select", {
              disabled: Q || $,
              "aria-label": "切換作品專案",
              value: U?.id || "",
              onChange: (u) => ot(() => {
                const xe = o.find((be) => (be.workId || "") === u.target.value && !be.archived);
                xe && ye(xe.id), F(null), A("resume");
              }),
              children: [/* @__PURE__ */ (0, l.jsx)("option", {
                value: "",
                children: "未歸屬單集"
              }), he.map((u) => /* @__PURE__ */ (0, l.jsxs)("option", {
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
          /* @__PURE__ */ (0, l.jsx)("div", {
            className: "side-label",
            children: "集數"
          }),
          /* @__PURE__ */ (0, l.jsxs)("div", {
            className: "project-switch",
            children: [/* @__PURE__ */ (0, l.jsx)(ni, { size: 19 }), /* @__PURE__ */ (0, l.jsxs)("select", {
              disabled: Q || $,
              "aria-label": "切換集數",
              value: S?.id || "",
              onChange: (u) => ot(() => {
                ye(u.target.value);
              }),
              children: [/* @__PURE__ */ (0, l.jsx)("option", {
                value: "",
                disabled: !0,
                children: "選擇集數"
              }), o.filter((u) => (u.workId || "") === (U?.id || "") && (J || !u.archived)).map((u) => /* @__PURE__ */ (0, l.jsxs)("option", {
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
          /* @__PURE__ */ (0, l.jsxs)("button", {
            className: "new-project",
            onClick: () => ot(() => {
              Ae({
                title: "製作資料",
                episode: "EP" + String(Math.max(0, ...o.map((u) => Number(u.episode.replace(/^EP/i, "")) || 0)) + 1).padStart(2, "0")
              }), ce("create");
            }),
            children: [/* @__PURE__ */ (0, l.jsx)(Pt, { size: 15 }), "建立其他單集"]
          }),
          /* @__PURE__ */ (0, l.jsx)("nav", {
            "aria-label": "主要功能",
            children: Ia.filter(([u]) => [
              "resume",
              "main",
              "models",
              "context",
              "chatgpt"
            ].includes(u)).map(([u, xe, be]) => /* @__PURE__ */ (0, l.jsxs)("button", {
              "aria-current": T === u ? "page" : void 0,
              className: "nav-item " + (T === u || u === "main" && [
                "op",
                "ed",
                "shots",
                "issues"
              ].includes(T) ? "active" : ""),
              onClick: () => te(u),
              children: [/* @__PURE__ */ (0, l.jsx)(be, { size: 18 }), /* @__PURE__ */ (0, l.jsx)("span", { children: xe })]
            }, u))
          }),
          /* @__PURE__ */ (0, l.jsxs)("details", {
            className: "nav-more",
            open: [
              "project",
              "settings",
              "history"
            ].includes(T) || void 0,
            children: [/* @__PURE__ */ (0, l.jsx)("summary", { children: "專案管理" }), Ia.filter(([u]) => [
              "project",
              "settings",
              "history"
            ].includes(u)).map(([u, xe, be]) => /* @__PURE__ */ (0, l.jsxs)("button", {
              className: "nav-item " + (T === u ? "active" : ""),
              onClick: () => te(u),
              children: [/* @__PURE__ */ (0, l.jsx)(be, { size: 17 }), xe]
            }, u))]
          }),
          /* @__PURE__ */ (0, l.jsxs)("div", {
            className: "side-bottom",
            children: [/* @__PURE__ */ (0, l.jsxs)("label", {
              className: "archive-toggle",
              children: [/* @__PURE__ */ (0, l.jsx)("input", {
                type: "checkbox",
                checked: J,
                onChange: (u) => ae(u.target.checked)
              }), "顯示已封存專案"]
            }), /* @__PURE__ */ (0, l.jsxs)("a", {
              href: Wr,
              target: "_top",
              children: ["返回立之雲端庫 ", /* @__PURE__ */ (0, l.jsx)(Fh, { size: 14 })]
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
              /* @__PURE__ */ (0, l.jsx)(nf, { size: 14 }),
              /* @__PURE__ */ (0, l.jsx)("span", { children: Ia.find((u) => u[0] === T)?.[1] })
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
              disabled: Q || $,
              onClick: () => ot(() => {
                ye(S?.id);
              }),
              children: /* @__PURE__ */ (0, l.jsx)(cd, {
                size: 17,
                className: $ ? "spin" : ""
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
                /* @__PURE__ */ (0, l.jsx)(ii, { size: 18 }),
                /* @__PURE__ */ (0, l.jsx)("span", { children: V }),
                pe && /* @__PURE__ */ (0, l.jsx)("a", {
                  href: r ? Wr : "/signin-with-chatgpt?return_to=" + encodeURIComponent("/?view=" + T),
                  target: "_top",
                  children: r ? "重新登入雲端庫" : "登入工作台 ↗"
                }),
                /* @__PURE__ */ (0, l.jsx)("button", {
                  "aria-label": "關閉訊息",
                  onClick: () => W(""),
                  children: /* @__PURE__ */ (0, l.jsx)(Ns, { size: 16 })
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
                /* @__PURE__ */ (0, l.jsx)("h1", { children: Ia.find((u) => u[0] === T)?.[1] }),
                /* @__PURE__ */ (0, l.jsx)("p", { children: T === "resume" ? "查看進度，選一件事接著做。" : T === "models" ? "選擇模型與版本，記錄這次完成的工作。" : T === "context" ? "查找製作資料，保留每次工作的交接。" : "目前選取的作品與集數如下。" })
              ] }), /* @__PURE__ */ (0, l.jsx)("div", {
                className: "heading-actions",
                children: S && /* @__PURE__ */ (0, l.jsxs)(l.Fragment, { children: [/* @__PURE__ */ (0, l.jsxs)("button", {
                  className: "btn",
                  onClick: () => ax(S.title + "_" + S.episode + "_流程備份.json", JSON.stringify(S, null, 2)),
                  children: [/* @__PURE__ */ (0, l.jsx)(nd, { size: 15 }), "匯出紀錄"]
                }), /* @__PURE__ */ (0, l.jsx)("button", {
                  className: "icon-btn bordered",
                  title: S.archived ? "還原專案" : "封存專案",
                  "aria-label": S.archived ? "還原專案" : "封存專案",
                  onClick: () => {
                    Ae({}), ce("archive");
                  },
                  children: S.archived ? /* @__PURE__ */ (0, l.jsx)(wm, { size: 17 }) : /* @__PURE__ */ (0, l.jsx)(jf, { size: 17 })
                })] })
              })]
            }),
            $ ? /* @__PURE__ */ (0, l.jsxs)("div", {
              className: "empty",
              children: [/* @__PURE__ */ (0, l.jsx)(Vr, {
                className: "spin",
                size: 26
              }), /* @__PURE__ */ (0, l.jsx)("h3", { children: "讀取製作進度" })]
            }) : S ? /* @__PURE__ */ (0, l.jsxs)(l.Fragment, { children: [
              /* @__PURE__ */ (0, l.jsxs)("section", {
                className: "project-banner",
                children: [/* @__PURE__ */ (0, l.jsxs)("div", {
                  className: "project-title",
                  children: [/* @__PURE__ */ (0, l.jsx)("span", {
                    className: "episode",
                    children: S.episode
                  }), /* @__PURE__ */ (0, l.jsxs)("div", { children: [/* @__PURE__ */ (0, l.jsxs)("h2", { children: [U ? U.title + " · " + S.episode : S.title, S.archived && /* @__PURE__ */ (0, l.jsx)("span", {
                    className: "status todo",
                    children: "已封存"
                  })] }), /* @__PURE__ */ (0, l.jsxs)("p", { children: [
                    "更新於 ",
                    ai(S.updatedAt),
                    " ",
                    /* @__PURE__ */ (0, l.jsx)("span", { children: "·" }),
                    " 紀錄版本 ",
                    S.revision
                  ] })] })]
                }), /* @__PURE__ */ (0, l.jsxs)("div", {
                  className: "project-progress",
                  children: [/* @__PURE__ */ (0, l.jsxs)("div", { children: [/* @__PURE__ */ (0, l.jsx)("span", { children: "本集製作狀態" }), /* @__PURE__ */ (0, l.jsx)("strong", { children: Ut ? "作者告知已完成" : bl?.status === "in_progress" ? "作者告知製作中" : bl?.status === "not_started" ? "作者告知尚未開始" : "尚未登記" })] }), /* @__PURE__ */ (0, l.jsx)("small", { children: Ut ? "目前進行資料補登與來源對應" : "依本集作者告知紀錄顯示" })]
                })]
              }),
              T !== "resume" && /* @__PURE__ */ (0, l.jsxs)("details", {
                className: "registration-detail",
                children: [
                  /* @__PURE__ */ (0, l.jsx)("summary", { children: "查看資料登記統計" }),
                  /* @__PURE__ */ (0, l.jsxs)("div", {
                    className: "metrics",
                    children: [
                      /* @__PURE__ */ (0, l.jsxs)("div", { children: [/* @__PURE__ */ (0, l.jsx)("span", {
                        className: "metric-icon green",
                        children: /* @__PURE__ */ (0, l.jsx)(si, { size: 20 })
                      }), /* @__PURE__ */ (0, l.jsxs)("div", { children: [/* @__PURE__ */ (0, l.jsxs)("b", { children: [ea.acceptedSources, /* @__PURE__ */ (0, l.jsxs)("em", { children: [" / ", ea.sources] })] }), /* @__PURE__ */ (0, l.jsx)("small", { children: "來源已確認收錄" })] })] }),
                      /* @__PURE__ */ (0, l.jsxs)("div", { children: [/* @__PURE__ */ (0, l.jsx)("span", {
                        className: "metric-icon blue",
                        children: /* @__PURE__ */ (0, l.jsx)(Gr, { size: 20 })
                      }), /* @__PURE__ */ (0, l.jsxs)("div", { children: [/* @__PURE__ */ (0, l.jsxs)("b", { children: [ea.linkedShots, /* @__PURE__ */ (0, l.jsxs)("em", { children: [" / ", ea.shots] })] }), /* @__PURE__ */ (0, l.jsx)("small", { children: "鏡頭來源關聯" })] })] }),
                      /* @__PURE__ */ (0, l.jsxs)("div", { children: [/* @__PURE__ */ (0, l.jsx)("span", {
                        className: "metric-icon amber",
                        children: /* @__PURE__ */ (0, l.jsx)(xl, { size: 20 })
                      }), /* @__PURE__ */ (0, l.jsxs)("div", { children: [/* @__PURE__ */ (0, l.jsx)("b", { children: ea.registeredSelections || "待補登" }), /* @__PURE__ */ (0, l.jsx)("small", { children: "實際採用檔紀錄" })] })] }),
                      /* @__PURE__ */ (0, l.jsxs)("div", { children: [/* @__PURE__ */ (0, l.jsx)("span", {
                        className: "metric-icon red",
                        children: /* @__PURE__ */ (0, l.jsx)(ii, { size: 20 })
                      }), /* @__PURE__ */ (0, l.jsxs)("div", { children: [/* @__PURE__ */ (0, l.jsx)("b", { children: Ja.length }), /* @__PURE__ */ (0, l.jsx)("small", { children: "已登記退修問題" })] })] })
                    ]
                  }),
                  /* @__PURE__ */ (0, l.jsxs)("details", {
                    className: "registration-detail",
                    children: [/* @__PURE__ */ (0, l.jsx)("summary", { children: "逐項檢視與入片登記" }), /* @__PURE__ */ (0, l.jsxs)("p", { children: [
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
              ].includes(T) && /* @__PURE__ */ (0, l.jsx)("nav", {
                className: "section-nav",
                "aria-label": "動畫製作內容",
                children: Ia.filter(([u]) => [
                  "main",
                  "op",
                  "ed",
                  "shots",
                  "issues"
                ].includes(u)).map(([u, xe]) => /* @__PURE__ */ (0, l.jsxs)("button", {
                  className: T === u ? "active" : "",
                  "aria-current": T === u ? "page" : void 0,
                  onClick: () => te(u),
                  children: [xe, u === "issues" && Ja.length > 0 ? " · " + Ja.length : ""]
                }, u))
              }),
              T === "resume" ? /* @__PURE__ */ (0, l.jsx)(Xm, {
                project: S,
                work: U,
                busy: Q,
                onNavigate: te,
                onModel: (u) => {
                  F(u), te("models");
                }
              }) : T === "project" ? /* @__PURE__ */ (0, l.jsx)(Pm, {
                work: U,
                episode: S,
                episodes: o,
                busy: Q,
                onWorkAction: ct,
                onSelectEpisode: (u) => ot(() => {
                  ye(u);
                }),
                onPin: (u) => Oe("pin_shared_reference", { assetId: u }),
                mutate: Oe
              }, S.id) : T === "models" ? /* @__PURE__ */ (0, l.jsx)(tx, {
                initialSelection: je,
                work: U,
                episode: S,
                episodes: o,
                busy: Q,
                onAction: ct,
                onProject: () => te("project"),
                onDirty: B
              }, (U?.id || S.id) + JSON.stringify(je)) : T === "settings" ? /* @__PURE__ */ (0, l.jsx)(_f, {
                project: S,
                busy: Q,
                mutate: Oe
              }, S.id) : T === "context" ? /* @__PURE__ */ (0, l.jsx)($m, {
                project: S,
                mutate: Oe,
                busy: Q
              }, S.id) : [
                "main",
                "op",
                "ed"
              ].includes(T) ? /* @__PURE__ */ (0, l.jsxs)(l.Fragment, { children: [
                /* @__PURE__ */ (0, l.jsxs)("div", {
                  className: "section-title",
                  children: [
                    /* @__PURE__ */ (0, l.jsx)("h2", { children: T === "main" ? "主線製作流程" : T.toUpperCase() + " 獨立製作支線" }),
                    /* @__PURE__ */ (0, l.jsx)("span", { children: T === "main" ? "每階段留下產出，再進行驗收" : "完成支線後接回全片驗收" }),
                    T !== "main" && /* @__PURE__ */ (0, l.jsxs)("label", {
                      className: "branch-toggle",
                      children: [/* @__PURE__ */ (0, l.jsx)("input", {
                        type: "checkbox",
                        checked: S.branches[T],
                        disabled: Q || S.archived,
                        onChange: (u) => {
                          Oe("set_branches", {
                            ...S.branches,
                            [T]: u.target.checked
                          });
                        }
                      }), "納入本集"]
                    })
                  ]
                }),
                T !== "main" && !S.branches[T] ? /* @__PURE__ */ (0, l.jsxs)("div", {
                  className: "empty",
                  children: [
                    /* @__PURE__ */ (0, l.jsx)(Pi, { size: 30 }),
                    /* @__PURE__ */ (0, l.jsxs)("h3", { children: ["本集未納入 ", T.toUpperCase()] }),
                    /* @__PURE__ */ (0, l.jsx)("p", { children: "重新勾選「納入本集」即可保留並繼續原有紀錄。" })
                  ]
                }) : /* @__PURE__ */ (0, l.jsxs)("div", {
                  className: "flow-layout",
                  children: [/* @__PURE__ */ (0, l.jsxs)("div", {
                    className: "stage-list",
                    children: [We.map((u, xe) => {
                      const be = S.stages[u.id], Fe = ws(S, u.id).length > 0;
                      return /* @__PURE__ */ (0, l.jsxs)("button", {
                        className: "stage-item " + (z === u.id ? "selected" : "") + (be.author ? " completed" : ""),
                        onClick: () => m(u.id),
                        children: [
                          /* @__PURE__ */ (0, l.jsx)("span", {
                            className: "stage-number " + (be.author ? "done" : ""),
                            children: be.author ? /* @__PURE__ */ (0, l.jsx)(ys, { size: 17 }) : T === "main" ? u.id : String(xe + 1).padStart(2, "0")
                          }),
                          /* @__PURE__ */ (0, l.jsxs)("div", { children: [
                            /* @__PURE__ */ (0, l.jsx)("small", { children: u.phase }),
                            /* @__PURE__ */ (0, l.jsx)("strong", { children: u.title }),
                            /* @__PURE__ */ (0, l.jsx)("span", {
                              className: "stage-label " + (be.status === "needs_revision" ? "red-text" : ""),
                              children: Ut && !be.author && be.status === "todo" ? "已完成 · 待補登" : Fe && !be.author ? /* @__PURE__ */ (0, l.jsxs)(l.Fragment, { children: [/* @__PURE__ */ (0, l.jsx)(td, { size: 11 }), "待前階段核定"] }) : Fr[be.status]
                            })
                          ] }),
                          /* @__PURE__ */ (0, l.jsx)(nf, { size: 15 })
                        ]
                      }, u.id);
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
                          children: T === "main" ? "STAGE " + z : T.toUpperCase() + " · " + z.slice(2)
                        }), /* @__PURE__ */ (0, l.jsx)("h2", { children: E.title })] }), /* @__PURE__ */ (0, l.jsx)("span", {
                          className: "status " + ze.status,
                          children: Ut && ze.status === "todo" ? "已完成 · 明細待補登" : Fr[ze.status]
                        })]
                      }),
                      /* @__PURE__ */ (0, l.jsx)("p", {
                        className: "stage-description",
                        children: E.description
                      }),
                      Jt.length > 0 && /* @__PURE__ */ (0, l.jsxs)("div", {
                        className: "gate-notice",
                        children: [/* @__PURE__ */ (0, l.jsx)(td, { size: 16 }), /* @__PURE__ */ (0, l.jsxs)("span", { children: [
                          Ut ? "逐項紀錄尚缺：" : "正式核定前，需先完成：",
                          Jt.join("、"),
                          "。可直接補登產出依據。"
                        ] })]
                      }),
                      /* @__PURE__ */ (0, l.jsxs)("div", {
                        className: "output-box",
                        children: [/* @__PURE__ */ (0, l.jsx)(xl, { size: 19 }), /* @__PURE__ */ (0, l.jsxs)("div", { children: [/* @__PURE__ */ (0, l.jsx)("strong", { children: "本階段產出" }), /* @__PURE__ */ (0, l.jsx)("p", { children: E.output })] })]
                      }),
                      Ka(S.episodeRules ?? []).filter((u) => !u.stageIds.length || u.stageIds.includes(z)).map((u) => /* @__PURE__ */ (0, l.jsxs)("div", {
                        className: "context-mini",
                        children: [
                          /* @__PURE__ */ (0, l.jsxs)("b", { children: [
                            "本集採用規則 · ",
                            u.title,
                            " v",
                            u.version
                          ] }),
                          /* @__PURE__ */ (0, l.jsx)("p", { children: u.content }),
                          /* @__PURE__ */ (0, l.jsxs)("small", { children: [
                            "場次：",
                            u.sceneIds.join("、") || "全部",
                            " · 來源：",
                            u.source
                          ] })
                        ]
                      }, u.id)),
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
                        children: E.checks.map((u, xe) => /* @__PURE__ */ (0, l.jsxs)("label", {
                          className: j[xe] ? "checked" : "",
                          children: [/* @__PURE__ */ (0, l.jsx)("input", {
                            type: "checkbox",
                            checked: j[xe] || !1,
                            disabled: Q || S.archived,
                            onChange: (be) => {
                              Z((Fe) => Fe.map((Xe, bt) => bt === xe ? be.target.checked : Xe)), B(!0);
                            }
                          }), /* @__PURE__ */ (0, l.jsx)("span", { children: u })]
                        }, xe))
                      }),
                      /* @__PURE__ */ (0, l.jsxs)("label", {
                        className: "field-label",
                        htmlFor: "evidence",
                        children: [
                          /* @__PURE__ */ (0, l.jsx)(sd, { size: 15 }),
                          "產出依據與位置 ",
                          /* @__PURE__ */ (0, l.jsx)("span", { children: "必填" })
                        ]
                      }),
                      /* @__PURE__ */ (0, l.jsx)("textarea", {
                        id: "evidence",
                        rows: 3,
                        placeholder: "貼上成果連結、檔案位置與參考版本；每行一筆。",
                        value: Se,
                        disabled: S.archived,
                        onChange: (u) => {
                          qe(u.target.value), B(!0);
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
                        disabled: S.archived,
                        onChange: (u) => {
                          ee(u.target.value), B(!0);
                        }
                      }),
                      /* @__PURE__ */ (0, l.jsxs)("div", {
                        className: "reviews",
                        children: [/* @__PURE__ */ (0, l.jsxs)("div", { children: [/* @__PURE__ */ (0, l.jsxs)("span", {
                          className: "review-title",
                          children: [/* @__PURE__ */ (0, l.jsx)(Xr, { size: 15 }), "AI 初驗"]
                        }), ze.ai ? /* @__PURE__ */ (0, l.jsxs)(l.Fragment, { children: [
                          /* @__PURE__ */ (0, l.jsx)("b", {
                            className: ze.ai.verdict === "pass" ? "green-text" : "red-text",
                            children: ze.ai.verdict === "pass" ? "初驗通過" : "需修正"
                          }),
                          /* @__PURE__ */ (0, l.jsx)("p", { children: ze.ai.note }),
                          /* @__PURE__ */ (0, l.jsxs)("small", { children: [
                            ai(ze.ai.at),
                            " · ",
                            ze.ai.by
                          ] })
                        ] }) : /* @__PURE__ */ (0, l.jsx)("p", {
                          className: "muted",
                          children: "尚未收到 AI 初驗"
                        })] }), /* @__PURE__ */ (0, l.jsxs)("div", { children: [/* @__PURE__ */ (0, l.jsxs)("span", {
                          className: "review-title",
                          children: [/* @__PURE__ */ (0, l.jsx)(si, { size: 15 }), "作者正式核定"]
                        }), ze.author ? /* @__PURE__ */ (0, l.jsxs)(l.Fragment, { children: [
                          /* @__PURE__ */ (0, l.jsx)("b", {
                            className: "green-text",
                            children: "已核定"
                          }),
                          /* @__PURE__ */ (0, l.jsx)("p", { children: ze.author.note || "已確認本階段成果與驗收條件" }),
                          /* @__PURE__ */ (0, l.jsxs)("small", { children: [
                            ai(ze.author.at),
                            " · ",
                            ze.author.by
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
                          disabled: Q || S.archived,
                          onClick: () => {
                            Ae({
                              stageId: z,
                              reason: "",
                              shotId: ""
                            }), ce("issue");
                          },
                          children: [/* @__PURE__ */ (0, l.jsx)(ii, { size: 15 }), "記錄退修"]
                        }), /* @__PURE__ */ (0, l.jsxs)("div", { children: [/* @__PURE__ */ (0, l.jsxs)("button", {
                          className: "btn",
                          disabled: Q || S.archived || !X,
                          onClick: () => {
                            Oe("save_stage", {
                              stageId: z,
                              checks: j,
                              evidence: Se,
                              note: g
                            });
                          },
                          children: [
                            Q ? /* @__PURE__ */ (0, l.jsx)(Vr, {
                              size: 15,
                              className: "spin"
                            }) : null,
                            "儲存草稿",
                            X ? " *" : ""
                          ]
                        }), /* @__PURE__ */ (0, l.jsxs)("button", {
                          className: "btn primary",
                          disabled: Q || S.archived || X || at.length > 0 || !!ze.author,
                          onClick: () => {
                            Oe("approve_stage", {
                              stageId: z,
                              note: "作者已核對產出與全部驗收條件"
                            });
                          },
                          children: [/* @__PURE__ */ (0, l.jsx)(si, { size: 15 }), ze.author ? "已正式核定" : "作者確認通過"]
                        })] })]
                      }),
                      !ze.author && /* @__PURE__ */ (0, l.jsx)("div", {
                        className: "gate-reasons",
                        children: Ut ? "本集維持作者告知完成；此處保存逐項檢視依據，不要求重新確認整集。" : X ? "先儲存修改，再確認通過。" : at.length ? "待完成：" + at.join("；") : "已符合檢查條件，請實際檢視成果後確認通過。"
                      })
                    ]
                  }, z)]
                }),
                T === "main" && /* @__PURE__ */ (0, l.jsxs)("div", {
                  className: "principle",
                  children: [/* @__PURE__ */ (0, l.jsx)(Pi, { size: 19 }), /* @__PURE__ */ (0, l.jsxs)("div", { children: [/* @__PURE__ */ (0, l.jsx)("b", { children: "發現問題，就回到造成問題的環節。" }), /* @__PURE__ */ (0, l.jsx)("p", { children: "更新已核定的製作依據時，相關下游階段會標為待修正。AI 初驗與作者核定各自留存。" })] })]
                }),
                /* @__PURE__ */ (0, l.jsxs)("details", {
                  className: "manual-rules",
                  children: [/* @__PURE__ */ (0, l.jsx)("summary", { children: "歷史製作經驗（不作為目前有效設定）" }), /* @__PURE__ */ (0, l.jsxs)("div", {
                    className: "manual-rule-content",
                    children: [
                      /* @__PURE__ */ (0, l.jsx)("h3", { children: "場景定位" }),
                      en.scenePosition.map((u) => /* @__PURE__ */ (0, l.jsx)("p", { children: u }, u)),
                      /* @__PURE__ */ (0, l.jsx)("h3", { children: "生圖提示詞順序" }),
                      /* @__PURE__ */ (0, l.jsx)("p", { children: en.imagePrompt }),
                      /* @__PURE__ */ (0, l.jsx)("h3", { children: "影片提示詞順序" }),
                      /* @__PURE__ */ (0, l.jsx)("p", { children: en.videoPrompt }),
                      /* @__PURE__ */ (0, l.jsx)("h3", { children: "失敗時回查" }),
                      en.repairs.map((u) => /* @__PURE__ */ (0, l.jsx)("p", { children: u }, u)),
                      /* @__PURE__ */ (0, l.jsx)("h3", { children: "本集專用條件" }),
                      /* @__PURE__ */ (0, l.jsx)("p", { children: "請從「本集規則與採用」取得指定版本；前一集的劇情條件不自動沿用。" }),
                      /* @__PURE__ */ (0, l.jsx)("h3", { children: "素材編號" }),
                      /* @__PURE__ */ (0, l.jsx)("p", { children: "每集保留自己的素材編號與明確對照，不依編號相近猜配。" }),
                      /* @__PURE__ */ (0, l.jsxs)("p", { children: ["後續檔名範例：", en.filenames.map((u) => u.replace("EP01", S.episode)).join("、")] })
                    ]
                  })]
                })
              ] }) : T === "shots" ? /* @__PURE__ */ (0, l.jsxs)("section", {
                className: "wide-card",
                children: [
                  /* @__PURE__ */ (0, l.jsxs)("div", {
                    className: "section-title",
                    children: [/* @__PURE__ */ (0, l.jsxs)("div", { children: [/* @__PURE__ */ (0, l.jsx)("h2", { children: "製作素材總表" }), /* @__PURE__ */ (0, l.jsx)("p", { children: "依鏡頭串起參考版本、素材位置、舊編號與成片時間。" })] }), /* @__PURE__ */ (0, l.jsxs)("button", {
                      className: "btn primary",
                      disabled: S.archived,
                      onClick: () => {
                        Ae({}), ce("shot");
                      },
                      children: [/* @__PURE__ */ (0, l.jsx)(Pt, { size: 16 }), "新增鏡頭"]
                    })]
                  }),
                  /* @__PURE__ */ (0, l.jsxs)("div", {
                    className: "search",
                    children: [/* @__PURE__ */ (0, l.jsx)(zf, { size: 16 }), /* @__PURE__ */ (0, l.jsx)("input", {
                      "aria-label": "搜尋鏡頭",
                      placeholder: "搜尋場次、鏡頭 ID 或舊編號…",
                      value: h,
                      onChange: (u) => R(u.target.value)
                    })]
                  }),
                  S.shots.length ? /* @__PURE__ */ (0, l.jsx)("div", {
                    className: "table-scroll",
                    children: /* @__PURE__ */ (0, l.jsxs)("table", { children: [/* @__PURE__ */ (0, l.jsx)("thead", { children: /* @__PURE__ */ (0, l.jsxs)("tr", { children: [
                      /* @__PURE__ */ (0, l.jsx)("th", { children: "鏡頭／場次" }),
                      /* @__PURE__ */ (0, l.jsx)("th", { children: "內容與編號對照" }),
                      /* @__PURE__ */ (0, l.jsx)("th", { children: "參考版本" }),
                      /* @__PURE__ */ (0, l.jsx)("th", { children: "採用／剪輯版本" }),
                      /* @__PURE__ */ (0, l.jsx)("th", { children: "狀態" }),
                      /* @__PURE__ */ (0, l.jsx)("th", { children: "操作" })
                    ] }) }), /* @__PURE__ */ (0, l.jsx)("tbody", { children: S.shots.filter((u) => [
                      u.id,
                      u.scene,
                      u.description,
                      u.legacyIds
                    ].join(" ").includes(h)).map((u) => /* @__PURE__ */ (0, l.jsxs)("tr", { children: [
                      /* @__PURE__ */ (0, l.jsxs)("td", { children: [/* @__PURE__ */ (0, l.jsx)("b", { children: u.id }), /* @__PURE__ */ (0, l.jsx)("small", { children: u.scene })] }),
                      /* @__PURE__ */ (0, l.jsxs)("td", { children: [u.description, /* @__PURE__ */ (0, l.jsxs)("small", { children: [
                        u.legacyIds || "未填舊編號",
                        " · ",
                        u.versions.length + 1,
                        " 次紀錄"
                      ] })] }),
                      /* @__PURE__ */ (0, l.jsxs)("td", { children: [/* @__PURE__ */ (0, l.jsxs)("small", { children: ["劇本 ", u.scriptVersion || "—"] }), /* @__PURE__ */ (0, l.jsxs)("small", { children: [
                        "角色 ",
                        u.characterVersion || "—",
                        "／場景 ",
                        u.sceneVersion || "—"
                      ] })] }),
                      /* @__PURE__ */ (0, l.jsxs)("td", { children: [u.adoptedVersion || "尚未採用", /* @__PURE__ */ (0, l.jsxs)("small", { children: [
                        u.editorVersion || "—",
                        " · ",
                        u.inPoint || "—",
                        " → ",
                        u.outPoint || "—"
                      ] })] }),
                      /* @__PURE__ */ (0, l.jsx)("td", { children: /* @__PURE__ */ (0, l.jsx)("span", {
                        className: "status " + u.status,
                        children: Fr[u.status]
                      }) }),
                      /* @__PURE__ */ (0, l.jsx)("td", { children: /* @__PURE__ */ (0, l.jsxs)("div", {
                        className: "table-actions",
                        children: [/* @__PURE__ */ (0, l.jsx)("button", {
                          className: "text-btn",
                          disabled: S.archived,
                          onClick: () => {
                            Ae(Object.fromEntries(xf.map(([xe]) => [xe, u[xe]]))), ce("shot");
                          },
                          children: "查看／編輯"
                        }), u.author ? u.status !== "in_timeline" ? /* @__PURE__ */ (0, l.jsx)("button", {
                          className: "text-btn",
                          disabled: Q || S.archived,
                          onClick: () => {
                            Oe("timeline_shot", { shotId: u.id });
                          },
                          children: "確認已入片"
                        }) : null : /* @__PURE__ */ (0, l.jsx)("button", {
                          className: "text-btn",
                          disabled: Q || S.archived,
                          onClick: () => {
                            Oe("approve_shot", { shotId: u.id });
                          },
                          children: "核定素材"
                        })]
                      }) })
                    ] }, u.id)) })] })
                  }) : /* @__PURE__ */ (0, l.jsxs)("div", {
                    className: "empty",
                    children: [
                      /* @__PURE__ */ (0, l.jsx)(Gr, { size: 32 }),
                      /* @__PURE__ */ (0, l.jsx)("h3", { children: "先建立一個實際鏡頭" }),
                      /* @__PURE__ */ (0, l.jsx)("p", { children: "不同來源的鏡號與素材編號填入對照欄，保留原始名稱。" })
                    ]
                  }),
                  /* @__PURE__ */ (0, l.jsx)("div", {
                    className: "inline-note",
                    children: "新版本會保留前次紀錄；填寫檔案位置不會上傳或覆寫原始素材。鏡頭更新後須重新核定。"
                  })
                ]
              }) : T === "issues" ? /* @__PURE__ */ (0, l.jsxs)("section", {
                className: "wide-card",
                children: [/* @__PURE__ */ (0, l.jsxs)("div", {
                  className: "section-title",
                  children: [/* @__PURE__ */ (0, l.jsxs)("div", { children: [/* @__PURE__ */ (0, l.jsx)("h2", { children: "退修與複核" }), /* @__PURE__ */ (0, l.jsx)("p", { children: "保留原因、受影響階段及修正結果。" })] }), /* @__PURE__ */ (0, l.jsxs)("button", {
                    className: "btn",
                    disabled: S.archived,
                    onClick: () => {
                      Ae({
                        stageId: "08",
                        reason: "",
                        shotId: ""
                      }), ce("issue");
                    },
                    children: [/* @__PURE__ */ (0, l.jsx)(Pt, { size: 16 }), "新增問題"]
                  })]
                }), S.issues.length ? /* @__PURE__ */ (0, l.jsx)("div", {
                  className: "issue-list",
                  children: [...S.issues].reverse().map((u) => /* @__PURE__ */ (0, l.jsxs)("article", {
                    className: "issue-card",
                    children: [
                      /* @__PURE__ */ (0, l.jsxs)("div", {
                        className: "issue-top",
                        children: [
                          /* @__PURE__ */ (0, l.jsx)("span", {
                            className: "status " + (u.status === "open" ? "needs_revision" : "passed"),
                            children: u.status === "open" ? "待修正" : "已複核結案"
                          }),
                          /* @__PURE__ */ (0, l.jsxs)("b", { children: [
                            u.stageId,
                            " ",
                            Kt.find((xe) => xe.id === u.stageId)?.title,
                            " ",
                            u.shotId ? "／" + u.shotId : ""
                          ] }),
                          /* @__PURE__ */ (0, l.jsx)("time", { children: ai(u.at) })
                        ]
                      }),
                      /* @__PURE__ */ (0, l.jsx)("p", { children: u.reason }),
                      /* @__PURE__ */ (0, l.jsx)("small", { children: u.by }),
                      u.resolution && /* @__PURE__ */ (0, l.jsxs)("div", {
                        className: "resolution",
                        children: [/* @__PURE__ */ (0, l.jsx)(ys, { size: 15 }), u.resolution]
                      }),
                      u.status === "open" && /* @__PURE__ */ (0, l.jsx)("button", {
                        className: "btn",
                        disabled: S.archived,
                        onClick: () => {
                          Ae({
                            issueId: u.id,
                            resolution: ""
                          }), ce("resolve");
                        },
                        children: "填寫修正並複核"
                      })
                    ]
                  }, u.id))
                }) : /* @__PURE__ */ (0, l.jsxs)("div", {
                  className: "empty",
                  children: [
                    /* @__PURE__ */ (0, l.jsx)(ys, { size: 32 }),
                    /* @__PURE__ */ (0, l.jsx)("h3", { children: "目前沒有退修問題" }),
                    /* @__PURE__ */ (0, l.jsx)("p", { children: "發現問題時，請指定造成問題的階段。" })
                  ]
                })]
              }) : T === "chatgpt" ? /* @__PURE__ */ (0, l.jsx)(Qm, {
                project: S,
                check: () => se("")
              }) : /* @__PURE__ */ (0, l.jsxs)("section", {
                className: "wide-card",
                children: [/* @__PURE__ */ (0, l.jsxs)("div", {
                  className: "section-title",
                  children: [/* @__PURE__ */ (0, l.jsxs)("div", { children: [/* @__PURE__ */ (0, l.jsx)("h2", { children: "製作異動紀錄" }), /* @__PURE__ */ (0, l.jsx)("p", { children: "作者與 ChatGPT 的更新分別標記，依時間保留。" })] }), /* @__PURE__ */ (0, l.jsxs)("span", {
                    className: "muted",
                    children: [S.audit.length, " 筆"]
                  })]
                }), /* @__PURE__ */ (0, l.jsx)("div", {
                  className: "audit-list",
                  children: [...S.audit].reverse().map((u, xe) => /* @__PURE__ */ (0, l.jsxs)("div", { children: [
                    /* @__PURE__ */ (0, l.jsx)("span", {
                      className: "audit-icon " + (u.actor === "ai" ? "ai" : ""),
                      children: u.actor === "ai" ? /* @__PURE__ */ (0, l.jsx)(Xr, { size: 17 }) : /* @__PURE__ */ (0, l.jsx)(si, { size: 17 })
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
                      }[u.action] || u.action,
                      " ",
                      /* @__PURE__ */ (0, l.jsx)("span", { children: u.detail })
                    ] }), /* @__PURE__ */ (0, l.jsx)("small", { children: u.by })] }),
                    /* @__PURE__ */ (0, l.jsx)("time", { children: ai(u.at) })
                  ] }, xe))
                })]
              })
            ] }) : /* @__PURE__ */ (0, l.jsxs)("div", {
              className: "onboarding",
              children: [
                /* @__PURE__ */ (0, l.jsx)("div", {
                  className: "onboarding-icon",
                  children: /* @__PURE__ */ (0, l.jsx)(ni, { size: 34 })
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
                    Ae({
                      title: "現實遊戲",
                      episode: "EP01"
                    }), ce("create");
                  },
                  children: [/* @__PURE__ */ (0, l.jsx)(Pt, { size: 17 }), "建立第一個製作專案"]
                }),
                /* @__PURE__ */ (0, l.jsx)("div", {
                  className: "onboarding-grid",
                  children: Kt.filter((u) => u.group === "main").map((u) => /* @__PURE__ */ (0, l.jsxs)("div", { children: [/* @__PURE__ */ (0, l.jsx)("span", { children: u.id }), u.title] }, u.id))
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
        children: [/* @__PURE__ */ (0, l.jsx)(ys, { size: 17 }), P]
      }),
      G && /* @__PURE__ */ (0, l.jsx)("div", {
        className: "modal-backdrop",
        onMouseDown: (u) => {
          u.target === u.currentTarget && !Q && ce(null);
        },
        children: /* @__PURE__ */ (0, l.jsxs)("section", {
          className: "modal " + (G === "shot" ? "large" : ""),
          role: "dialog",
          "aria-modal": "true",
          "aria-label": G === "create" ? "建立製作專案" : G === "shot" ? "鏡頭素材紀錄" : "製作確認",
          children: [/* @__PURE__ */ (0, l.jsxs)("div", {
            className: "modal-head",
            children: [/* @__PURE__ */ (0, l.jsx)("h2", { children: G === "create" ? "建立製作專案" : G === "shot" ? "鏡頭素材紀錄" : G === "issue" ? "記錄退修問題" : G === "resolve" ? "修正與複核結果" : S?.archived ? "還原專案" : "封存專案" }), /* @__PURE__ */ (0, l.jsx)("button", {
              className: "icon-btn",
              "aria-label": "關閉視窗",
              disabled: Q,
              onClick: () => ce(null),
              children: /* @__PURE__ */ (0, l.jsx)(Ns, { size: 21 })
            })]
          }), /* @__PURE__ */ (0, l.jsxs)("form", {
            onSubmit: tt,
            children: [
              G === "create" ? /* @__PURE__ */ (0, l.jsxs)(l.Fragment, { children: [/* @__PURE__ */ (0, l.jsx)("p", {
                className: "muted",
                children: "依手冊建立完整流程，從待製作開始記錄。"
              }), [["title", "專案名稱"], ["episode", "集數"]].map(([u, xe]) => /* @__PURE__ */ (0, l.jsxs)("label", {
                className: "form-field",
                children: [xe, /* @__PURE__ */ (0, l.jsx)("input", {
                  required: !0,
                  maxLength: u === "title" ? 200 : 60,
                  value: fe[u] || "",
                  onChange: (be) => Ae({
                    ...fe,
                    [u]: be.target.value
                  })
                })]
              }, u))] }) : G === "shot" ? /* @__PURE__ */ (0, l.jsxs)(l.Fragment, { children: [
                /* @__PURE__ */ (0, l.jsx)("p", {
                  className: "muted",
                  children: "修改既有鏡頭請使用相同 ID。系統保留前次紀錄，並要求重新驗收。"
                }),
                /* @__PURE__ */ (0, l.jsx)("div", {
                  className: "shot-form",
                  children: xf.map(([u, xe]) => /* @__PURE__ */ (0, l.jsxs)("label", {
                    className: "form-field",
                    children: [xe, /* @__PURE__ */ (0, l.jsx)("input", {
                      required: [
                        "id",
                        "scene",
                        "description"
                      ].includes(u),
                      maxLength: u === "id" ? 100 : 12e3,
                      value: fe[u] || "",
                      placeholder: u === "id" ? "如 EP01_S06_SH03" : "",
                      onChange: (be) => Ae({
                        ...fe,
                        [u]: be.target.value
                      })
                    })]
                  }, u))
                }),
                S?.shots.find((u) => u.id === fe.id)?.versions.length ? /* @__PURE__ */ (0, l.jsxs)("details", { children: [/* @__PURE__ */ (0, l.jsx)("summary", { children: "查看保留的舊版本" }), S.shots.find((u) => u.id === fe.id).versions.map((u, xe) => /* @__PURE__ */ (0, l.jsxs)("pre", { children: [
                  ai(u.at),
                  " · ",
                  u.by,
                  `
`,
                  JSON.stringify(u.data, null, 2)
                ] }, xe))] }) : null
              ] }) : G === "issue" ? /* @__PURE__ */ (0, l.jsxs)(l.Fragment, { children: [
                /* @__PURE__ */ (0, l.jsxs)("label", {
                  className: "form-field",
                  children: ["回查階段", /* @__PURE__ */ (0, l.jsx)("select", {
                    value: fe.stageId || "08",
                    onChange: (u) => Ae({
                      ...fe,
                      stageId: u.target.value
                    }),
                    children: Ts(S).map((u) => /* @__PURE__ */ (0, l.jsxs)("option", {
                      value: u.id,
                      children: [
                        u.id,
                        " ",
                        u.title
                      ]
                    }, u.id))
                  })]
                }),
                /* @__PURE__ */ (0, l.jsxs)("label", {
                  className: "form-field",
                  children: ["受影響鏡頭（選填）", /* @__PURE__ */ (0, l.jsxs)("select", {
                    value: fe.shotId || "",
                    onChange: (u) => Ae({
                      ...fe,
                      shotId: u.target.value
                    }),
                    children: [/* @__PURE__ */ (0, l.jsx)("option", {
                      value: "",
                      children: "整個階段"
                    }), S.shots.map((u) => /* @__PURE__ */ (0, l.jsx)("option", { children: u.id }, u.id))]
                  })]
                }),
                /* @__PURE__ */ (0, l.jsxs)("label", {
                  className: "form-field",
                  children: ["具體問題與回查原因", /* @__PURE__ */ (0, l.jsx)("textarea", {
                    required: !0,
                    rows: 5,
                    value: fe.reason || "",
                    onChange: (u) => Ae({
                      ...fe,
                      reason: u.target.value
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
                  value: fe.resolution || "",
                  onChange: (u) => Ae({
                    ...fe,
                    resolution: u.target.value
                  })
                })]
              }) : /* @__PURE__ */ (0, l.jsxs)("p", { children: ["專案", S?.archived ? "還原後可繼續製作。" : "封存後會保留全部進度與紀錄，可隨時還原。"] }),
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
                  disabled: Q,
                  onClick: () => ce(null),
                  children: "取消"
                }), /* @__PURE__ */ (0, l.jsxs)("button", {
                  type: "submit",
                  className: "btn primary",
                  disabled: Q,
                  children: [Q ? /* @__PURE__ */ (0, l.jsx)(Vr, {
                    className: "spin",
                    size: 16
                  }) : null, G === "create" ? "建立專案" : G === "archive" ? S?.archived ? "還原專案" : "確認封存" : "儲存紀錄"]
                })]
              })
            ]
          })]
        })
      })
    ]
  });
}
var zs = {
  animation: "動畫製作",
  model: "3D 模型",
  software: "軟體開發",
  general: "一般專案"
}, gf = [
  "PLANNED",
  "IN_PROGRESS",
  "PASS",
  "FAIL",
  "BLOCKED",
  "NOT_TESTED"
], Ft = {
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
}, Pr = (r) => new Date(r).toLocaleString("zh-TW", {
  timeZone: "Asia/Taipei",
  month: "numeric",
  day: "numeric",
  hour: "2-digit",
  minute: "2-digit"
});
function bf({ url: r, children: x }) {
  return /^https?:\/\//i.test(r) ? /* @__PURE__ */ (0, l.jsxs)("a", {
    href: r,
    target: "_blank",
    rel: "noopener noreferrer",
    children: [x, " ↗"]
  }) : /* @__PURE__ */ (0, l.jsxs)("span", { children: [x, /* @__PURE__ */ (0, l.jsx)("small", {
    className: "preserve-text",
    children: r
  })] });
}
function ix({ nativeTransport: r } = {}) {
  const [x, C] = (0, k.useState)([]), [p, o] = (0, k.useState)(null), [M, S] = (0, k.useState)("overview"), [H, T] = (0, k.useState)(""), [A, z] = (0, k.useState)("resume"), [K, U] = (0, k.useState)(!0), [ne, he] = (0, k.useState)(!1), [I, $] = (0, k.useState)(""), [de, Q] = (0, k.useState)(""), [oe, V] = (0, k.useState)(""), [W, P] = (0, k.useState)(!1), [ge, pe] = (0, k.useState)(!1), [Y, j] = (0, k.useState)(""), [Z, Se] = (0, k.useState)({}), qe = (0, k.useRef)(""), g = (0, k.useRef)(0), ee = (0, k.useRef)(""), X = (0, k.useRef)(!1);
  ee.current = Y;
  const B = (0, k.useCallback)((b) => {
    X.current = b;
  }, []), G = (0, k.useCallback)(async (b, le, se) => {
    const ye = r ? await r(b, le, se) : await fetch("/api/" + b + le, {
      cache: "no-store",
      ...se ? {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(se)
      } : {}
    });
    if (!ye.headers.get("content-type")?.includes("application/json")) throw Error("請先登入立之雲端庫");
    const Oe = await ye.json();
    if (!ye.ok) throw Error(Oe.error || "讀取失敗");
    return Oe;
  }, [r]), ce = (0, k.useCallback)(async (b = qe.current) => {
    const le = ++g.current;
    try {
      const se = await G("workspace", "?view=managed"), ye = b ? await G("workspace", "?view=managed&id=" + encodeURIComponent(b)) : null;
      if (le !== g.current) return;
      C(se), ee.current || o(ye), $("");
    } catch (se) {
      le === g.current && $(se.message);
    } finally {
      le === g.current && U(!1);
    }
  }, [G]);
  (0, k.useEffect)(() => {
    ce();
    const b = setInterval(() => {
      !ee.current && !X.current && ce();
    }, 3e4);
    return () => clearInterval(b);
  }, [ce]), (0, k.useEffect)(() => {
    if (!Y) return;
    const b = (le) => le.preventDefault();
    return window.addEventListener("beforeunload", b), () => window.removeEventListener("beforeunload", b);
  }, [Y]), (0, k.useEffect)(() => {
    if (!de) return;
    const b = setTimeout(() => Q(""), 4500);
    return () => clearTimeout(b);
  }, [de]);
  async function fe(b) {
    qe.current = b, o(null), U(!0), S("overview"), await ce(b);
  }
  function Ae() {
    qe.current = "", g.current++, o(null), T(""), ce("");
  }
  function h(b, le = {}) {
    $(""), Se({
      key: crypto.randomUUID(),
      type: "software",
      status: b === "record" ? "NOT_TESTED" : "PLANNED",
      mode: "not_run",
      stageId: p?.stages[0]?.id ?? "",
      evidenceIds: [],
      sourceIds: [],
      ...le
    }), j(b);
  }
  async function R(b, le) {
    if (!(!p && b !== "createManagedProject")) {
      g.current++, he(!0);
      try {
        const se = await G("workspace", "", {
          action: b,
          id: p?.id,
          revision: p?.revision,
          args: le
        });
        return qe.current = se.id, o(se), j(""), ee.current = "", Q("已保存並讀回最新專案"), await ce(se.id), se;
      } catch (se) {
        $(se.message);
      } finally {
        he(!1);
      }
    }
  }
  async function J(b) {
    b.preventDefault(), await R({
      create: "createManagedProject",
      stage: "createProjectStage",
      task: Z.taskId ? "updateProjectTask" : "createProjectTask",
      record: "appendWorkRecord",
      artifact: "registerProjectArtifact",
      source: "registerProjectSource",
      issue: "reportProjectIssue",
      resolve: "resolveProjectIssue",
      edit: "updateManagedProject",
      restore: "restoreProjectBackup"
    }[Y], {
      ...Z,
      ...Y === "stage" ? { stageKey: Z.stageKey || Z.key } : Y === "task" ? { taskKey: Z.taskKey || Z.key } : Y === "artifact" ? { artifactKey: Z.artifactKey || Z.key } : Y === "source" ? { sourceKey: Z.sourceKey || Z.key } : Y === "issue" ? { issueKey: Z.issueKey || Z.key } : {}
    });
  }
  async function ae() {
    if (p) {
      he(!0);
      try {
        const b = await G("workspace", "?view=managed&id=" + p.id);
        let le = null;
        if (p.animation) {
          const Oe = await G("works", "?id=" + p.animation.workId), ct = [];
          for (const ot of p.animation.episodes) ct.push(await G("projects", "?id=" + ot.id));
          le = {
            work: Oe.work,
            episodes: ct
          };
        }
        const se = URL.createObjectURL(new Blob([JSON.stringify({
          schemaVersion: 2,
          exportedAt: (/* @__PURE__ */ new Date()).toISOString(),
          project: b,
          animation: le
        }, null, 2)], { type: "application/json" })), ye = document.createElement("a");
        ye.href = se, ye.download = p.title.replace(/[\\/:*?"<>|]/g, "_") + "_專案備份.json", ye.click(), setTimeout(() => URL.revokeObjectURL(se), 1e3);
      } catch (b) {
        $(b.message);
      } finally {
        he(!1);
      }
    }
  }
  function je(b) {
    p?.workId && (z(b), T(p.workId));
  }
  function F(b, le, se = !1, ye = !1) {
    return /* @__PURE__ */ (0, l.jsxs)("label", {
      className: "form-field",
      children: [le, ye ? /* @__PURE__ */ (0, l.jsx)("textarea", {
        rows: 3,
        required: se,
        maxLength: b === "snapshot" ? 6e4 : 12e3,
        value: Z[b] ?? "",
        onChange: (Oe) => Se({
          ...Z,
          [b]: Oe.target.value
        })
      }) : /* @__PURE__ */ (0, l.jsx)("input", {
        required: se,
        maxLength: b === "sha256" ? 64 : 2e3,
        value: Z[b] ?? "",
        onChange: (Oe) => Se({
          ...Z,
          [b]: Oe.target.value
        })
      })]
    }, b);
  }
  function ue(b, le, se) {
    return /* @__PURE__ */ (0, l.jsxs)("label", {
      className: "form-field",
      children: [le, /* @__PURE__ */ (0, l.jsx)("select", {
        value: Z[b] ?? "",
        onChange: (ye) => Se({
          ...Z,
          [b]: ye.target.value,
          ...b === "stageId" ? { taskId: "" } : {}
        }),
        children: se.map(([ye, Oe]) => /* @__PURE__ */ (0, l.jsx)("option", {
          value: ye,
          children: Oe
        }, ye))
      })]
    });
  }
  function Ue(b, le) {
    return /* @__PURE__ */ (0, l.jsxs)("fieldset", {
      className: "proof-picker",
      children: [/* @__PURE__ */ (0, l.jsx)("legend", { children: b === "evidenceIds" ? "成果證據" : "已讀來源" }), le.length ? le.map((se) => /* @__PURE__ */ (0, l.jsxs)("label", { children: [/* @__PURE__ */ (0, l.jsx)("input", {
        type: "checkbox",
        checked: (Z[b] ?? []).includes(se.id),
        onChange: (ye) => Se({
          ...Z,
          [b]: ye.target.checked ? [...Z[b] ?? [], se.id] : (Z[b] ?? []).filter((Oe) => Oe !== se.id)
        })
      }), se.title] }, se.id)) : /* @__PURE__ */ (0, l.jsx)("small", { children: "先在成果分頁登記，僅貼連結不能作為已檢查證據。" })]
    });
  }
  return H ? /* @__PURE__ */ (0, l.jsxs)(l.Fragment, { children: [/* @__PURE__ */ (0, l.jsx)("div", {
    className: "project-return",
    children: /* @__PURE__ */ (0, l.jsxs)("button", {
      className: "text-btn",
      onClick: () => {
        X.current && !window.confirm("有未儲存的動畫或模型修改，確定離開？") || (X.current = !1, T(""), ce());
      },
      children: [
        /* @__PURE__ */ (0, l.jsx)(lf, { size: 16 }),
        "返回 ",
        p?.title ?? "專案清單"
      ]
    })
  }), /* @__PURE__ */ (0, l.jsx)(lx, {
    nativeTransport: r,
    initialWorkId: H === "legacy" ? void 0 : H,
    initialTab: A,
    onDirtyChange: B
  }, H + A)] }) : /* @__PURE__ */ (0, l.jsxs)("div", {
    className: "project-hub",
    children: [
      /* @__PURE__ */ (0, l.jsxs)("header", {
        className: "hub-header",
        children: [/* @__PURE__ */ (0, l.jsxs)("div", {
          className: "hub-brand",
          children: [/* @__PURE__ */ (0, l.jsx)(Yr, { size: 22 }), /* @__PURE__ */ (0, l.jsx)("b", { children: "製作工作台" })]
        }), /* @__PURE__ */ (0, l.jsx)("button", {
          className: "icon-btn",
          "aria-label": "重新整理",
          disabled: K || ne || !!Y,
          onClick: () => {
            ce();
          },
          children: /* @__PURE__ */ (0, l.jsx)(cd, { size: 18 })
        })]
      }),
      /* @__PURE__ */ (0, l.jsxs)("main", {
        className: "hub-main",
        children: [
          I && /* @__PURE__ */ (0, l.jsxs)("div", {
            role: "alert",
            className: "error-banner",
            children: [I, /* @__PURE__ */ (0, l.jsx)("button", {
              "aria-label": "關閉錯誤",
              onClick: () => $(""),
              children: /* @__PURE__ */ (0, l.jsx)(Ns, { size: 16 })
            })]
          }),
          qe.current && /* @__PURE__ */ (0, l.jsxs)("button", {
            className: "text-btn hub-back",
            onClick: Ae,
            children: [/* @__PURE__ */ (0, l.jsx)(lf, { size: 16 }), "我的專案"]
          }),
          K ? /* @__PURE__ */ (0, l.jsx)("div", {
            className: "empty",
            children: "讀取專案中…"
          }) : p ? /* @__PURE__ */ (0, l.jsxs)(l.Fragment, { children: [
            /* @__PURE__ */ (0, l.jsxs)("div", {
              className: "page-heading",
              children: [/* @__PURE__ */ (0, l.jsxs)("div", { children: [
                /* @__PURE__ */ (0, l.jsxs)("div", {
                  className: "eyebrow",
                  children: [
                    zs[p.kind],
                    " · ",
                    Ft[p.status]
                  ]
                }),
                /* @__PURE__ */ (0, l.jsx)("h1", { children: p.title }),
                /* @__PURE__ */ (0, l.jsx)("p", { children: p.objective || "先填寫這個專案的目標。" })
              ] }), /* @__PURE__ */ (0, l.jsxs)("div", {
                className: "heading-actions",
                children: [/* @__PURE__ */ (0, l.jsxs)("button", {
                  className: "btn",
                  disabled: ne,
                  onClick: () => {
                    ae();
                  },
                  children: [/* @__PURE__ */ (0, l.jsx)(nd, { size: 15 }), "匯出備份"]
                }), /* @__PURE__ */ (0, l.jsx)("button", {
                  className: "icon-btn bordered",
                  "aria-label": p.archived ? "還原專案" : "封存專案",
                  title: p.archived ? "還原專案" : "封存專案",
                  disabled: ne,
                  onClick: () => {
                    R("updateManagedProject", {
                      key: crypto.randomUUID(),
                      status: p.archived ? "in_progress" : "archived"
                    });
                  },
                  children: /* @__PURE__ */ (0, l.jsx)(jf, { size: 17 })
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
                ["artifacts", "成果"],
                ["issues", "問題"]
              ].map(([b, le]) => /* @__PURE__ */ (0, l.jsxs)("button", {
                className: M === b ? "active" : "",
                "aria-current": M === b ? "page" : void 0,
                onClick: () => S(b),
                children: [le, b === "issues" && p.issues.some((se) => se.status === "open") ? " · " + p.issues.filter((se) => se.status === "open").length : ""]
              }, b))
            }),
            M === "overview" ? /* @__PURE__ */ (0, l.jsxs)(l.Fragment, { children: [
              /* @__PURE__ */ (0, l.jsxs)("section", {
                className: "handoff-card",
                children: [
                  /* @__PURE__ */ (0, l.jsxs)("div", {
                    className: "eyebrow",
                    children: ["目前階段 · ", p.handoff.currentStage?.title ?? "尚未設定"]
                  }),
                  /* @__PURE__ */ (0, l.jsx)("h2", { children: p.handoff.nextActions[0] ?? "先建立任務或記錄本次工作" }),
                  /* @__PURE__ */ (0, l.jsx)("p", { children: p.handoff.lastWork?.summary ?? "尚無通用工作紀錄。" }),
                  p.handoff.lastWork && /* @__PURE__ */ (0, l.jsxs)("span", {
                    className: "status",
                    children: [
                      Ft[p.handoff.lastWork.status],
                      " · ",
                      Ft[p.handoff.lastWork.mode]
                    ]
                  }),
                  /* @__PURE__ */ (0, l.jsx)("div", {
                    style: { marginTop: 18 },
                    children: /* @__PURE__ */ (0, l.jsxs)("button", {
                      className: "btn primary",
                      disabled: p.archived,
                      onClick: () => h("record"),
                      children: [/* @__PURE__ */ (0, l.jsx)(Pt, { size: 16 }), "記錄這次工作"]
                    })
                  })
                ]
              }),
              p.animation && /* @__PURE__ */ (0, l.jsxs)("div", {
                className: "hub-module-grid",
                children: [/* @__PURE__ */ (0, l.jsxs)("button", {
                  className: "module-card",
                  onClick: () => je("resume"),
                  children: [
                    /* @__PURE__ */ (0, l.jsx)(ni, { size: 26 }),
                    /* @__PURE__ */ (0, l.jsx)("h3", { children: "動畫製作" }),
                    /* @__PURE__ */ (0, l.jsxs)("p", { children: [p.animation.episodes.length, " 集 · 劇本、鏡頭、影格、OP／ED"] }),
                    /* @__PURE__ */ (0, l.jsx)("span", { children: "開啟動畫流程 →" })
                  ]
                }), /* @__PURE__ */ (0, l.jsxs)("button", {
                  className: "module-card",
                  onClick: () => je("models"),
                  children: [
                    /* @__PURE__ */ (0, l.jsx)(hm, { size: 26 }),
                    /* @__PURE__ */ (0, l.jsx)("h3", { children: "3D 模型" }),
                    /* @__PURE__ */ (0, l.jsxs)("p", { children: [p.animation.modelCount, " 個模型 · 來源、版本與驗收"] }),
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
                      disabled: p.archived,
                      onClick: () => h("edit", {
                        name: p.title,
                        description: p.objective,
                        status: p.status
                      }),
                      children: "編輯專案"
                    })]
                  }),
                  /* @__PURE__ */ (0, l.jsxs)("p", { children: [
                    p.managedTasks.filter((b) => b.status !== "PASS").length,
                    " 項工作未完成 · ",
                    p.issues.filter((b) => b.status === "open").length,
                    " 項問題"
                  ] }),
                  /* @__PURE__ */ (0, l.jsx)("h3", { children: "操作限制" }),
                  p.restrictions.map((b, le) => /* @__PURE__ */ (0, l.jsx)("p", {
                    className: "muted",
                    children: b
                  }, le)),
                  /* @__PURE__ */ (0, l.jsxs)("details", { children: [
                    /* @__PURE__ */ (0, l.jsx)("summary", { children: "進階資訊與 AI 交接資料" }),
                    /* @__PURE__ */ (0, l.jsxs)("p", { children: [
                      "紀錄版本 ",
                      p.revision,
                      " · 更新於 ",
                      Pr(p.updatedAt)
                    ] }),
                    /* @__PURE__ */ (0, l.jsx)("pre", {
                      className: "hub-json",
                      children: JSON.stringify(p.handoff, null, 2)
                    }),
                    /* @__PURE__ */ (0, l.jsx)("h3", { children: "異動紀錄" }),
                    [...p.history].reverse().map((b, le) => /* @__PURE__ */ (0, l.jsxs)("p", {
                      className: "muted",
                      children: [
                        Pr(b.at),
                        " · ",
                        b.by,
                        " · ",
                        b.action
                      ]
                    }, le)),
                    /* @__PURE__ */ (0, l.jsxs)("label", {
                      className: "form-field",
                      children: ["回復本專案的通用資料備份", /* @__PURE__ */ (0, l.jsx)("input", {
                        type: "file",
                        accept: "application/json,.json",
                        disabled: ne,
                        onChange: async (b) => {
                          try {
                            const le = b.target.files?.[0];
                            if (!le) return;
                            if (le.size > 24e6) throw Error("備份過大");
                            const se = JSON.parse(await le.text());
                            if (se.schemaVersion !== 2 || se.project?.id !== p.id) throw Error("請選取此專案的 v2 備份");
                            h("restore", { backup: se.project });
                          } catch (le) {
                            $(le.message);
                          }
                          b.target.value = "";
                        }
                      })]
                    })
                  ] })
                ]
              })
            ] }) : M === "stages" ? /* @__PURE__ */ (0, l.jsxs)(l.Fragment, { children: [/* @__PURE__ */ (0, l.jsxs)("div", {
              className: "section-title",
              children: [/* @__PURE__ */ (0, l.jsx)("h2", { children: "階段與工作項目" }), /* @__PURE__ */ (0, l.jsxs)("button", {
                className: "btn",
                disabled: p.archived,
                onClick: () => h("stage"),
                children: [/* @__PURE__ */ (0, l.jsx)(Pt, { size: 16 }), "新增階段"]
              })]
            }), p.stages.map((b) => /* @__PURE__ */ (0, l.jsxs)("section", {
              className: "wide-card stage-work-card",
              children: [/* @__PURE__ */ (0, l.jsxs)("div", {
                className: "section-title",
                children: [/* @__PURE__ */ (0, l.jsxs)("div", { children: [/* @__PURE__ */ (0, l.jsxs)("h3", { children: [
                  b.key,
                  " · ",
                  b.title
                ] }), /* @__PURE__ */ (0, l.jsx)("span", {
                  className: "status",
                  children: Ft[b.status]
                })] }), /* @__PURE__ */ (0, l.jsx)("button", {
                  className: "text-btn",
                  disabled: p.archived,
                  onClick: () => h("task", { stageId: b.id }),
                  children: "新增工作"
                })]
              }), p.managedTasks.filter((le) => le.stageId === b.id).map((le) => /* @__PURE__ */ (0, l.jsxs)("article", {
                className: "task-card",
                children: [
                  /* @__PURE__ */ (0, l.jsxs)("div", { children: [
                    /* @__PURE__ */ (0, l.jsx)("b", { children: le.title }),
                    /* @__PURE__ */ (0, l.jsx)("small", { children: Ft[le.status] }),
                    le.nextAction && /* @__PURE__ */ (0, l.jsxs)("p", { children: ["下一步：", le.nextAction] })
                  ] }),
                  /* @__PURE__ */ (0, l.jsx)("button", {
                    className: "text-btn",
                    disabled: p.archived,
                    onClick: () => h("record", {
                      stageId: b.id,
                      taskId: le.id,
                      summary: le.title
                    }),
                    children: "回報"
                  }),
                  /* @__PURE__ */ (0, l.jsx)("button", {
                    className: "text-btn",
                    disabled: p.archived,
                    onClick: () => h("task", {
                      ...le,
                      key: crypto.randomUUID(),
                      taskId: le.id
                    }),
                    children: "編輯"
                  })
                ]
              }, le.id))]
            }, b.id))] }) : M === "records" ? /* @__PURE__ */ (0, l.jsxs)("section", {
              className: "wide-card",
              children: [
                /* @__PURE__ */ (0, l.jsxs)("div", {
                  className: "section-title",
                  children: [/* @__PURE__ */ (0, l.jsxs)("div", { children: [/* @__PURE__ */ (0, l.jsx)("h2", { children: "執行紀錄" }), /* @__PURE__ */ (0, l.jsx)("p", { children: "計畫、模擬與實測分開保存；沒有證據不會轉成 PASS。" })] }), /* @__PURE__ */ (0, l.jsxs)("button", {
                    className: "btn primary",
                    disabled: p.archived,
                    onClick: () => h("record"),
                    children: [/* @__PURE__ */ (0, l.jsx)(Pt, { size: 16 }), "新增紀錄"]
                  })]
                }),
                !p.records.length && /* @__PURE__ */ (0, l.jsx)("div", {
                  className: "empty",
                  children: "還沒有工作紀錄。"
                }),
                [...p.records].reverse().map((b) => /* @__PURE__ */ (0, l.jsxs)("article", {
                  className: "journal-card",
                  children: [
                    /* @__PURE__ */ (0, l.jsxs)("div", {
                      className: "journal-meta",
                      children: [
                        /* @__PURE__ */ (0, l.jsx)("span", {
                          className: "result-badge " + b.status.toLowerCase(),
                          children: Ft[b.status]
                        }),
                        /* @__PURE__ */ (0, l.jsxs)("span", { children: [
                          Ft[b.mode],
                          " · ",
                          b.scope
                        ] }),
                        /* @__PURE__ */ (0, l.jsxs)("small", { children: [
                          Pr(b.at),
                          " · ",
                          b.by
                        ] })
                      ]
                    }),
                    /* @__PURE__ */ (0, l.jsx)("h3", { children: b.summary }),
                    /* @__PURE__ */ (0, l.jsxs)("dl", { children: [
                      /* @__PURE__ */ (0, l.jsx)("dt", { children: "方法與結果" }),
                      /* @__PURE__ */ (0, l.jsxs)("dd", { children: [
                        b.method,
                        `
`,
                        b.result
                      ] }),
                      /* @__PURE__ */ (0, l.jsx)("dt", { children: "證據" }),
                      /* @__PURE__ */ (0, l.jsx)("dd", { children: [...b.evidenceIds.map((le) => p.artifacts.find((se) => se.id === le)?.title), ...b.sourceIds.map((le) => p.sources.find((se) => se.id === le)?.title)].filter(Boolean).join("、") || "未附可核對證據" }),
                      /* @__PURE__ */ (0, l.jsx)("dt", { children: "下一步" }),
                      /* @__PURE__ */ (0, l.jsx)("dd", { children: b.nextStep }),
                      b.limitations && /* @__PURE__ */ (0, l.jsxs)(l.Fragment, { children: [/* @__PURE__ */ (0, l.jsx)("dt", { children: "限制" }), /* @__PURE__ */ (0, l.jsx)("dd", { children: b.limitations })] })
                    ] }),
                    b.requestedStatus !== b.status && /* @__PURE__ */ (0, l.jsxs)("p", {
                      className: "modal-error",
                      children: [
                        "原回報 ",
                        b.requestedStatus,
                        "；",
                        b.validationNote
                      ]
                    })
                  ]
                }, b.id))
              ]
            }) : M === "artifacts" ? /* @__PURE__ */ (0, l.jsxs)("section", {
              className: "wide-card",
              children: [
                /* @__PURE__ */ (0, l.jsxs)("div", {
                  className: "section-title",
                  children: [/* @__PURE__ */ (0, l.jsx)("h2", { children: "成果與來源" }), /* @__PURE__ */ (0, l.jsxs)("div", {
                    className: "heading-actions",
                    children: [/* @__PURE__ */ (0, l.jsx)("button", {
                      className: "btn",
                      disabled: p.archived,
                      onClick: () => h("source"),
                      children: "登記來源"
                    }), /* @__PURE__ */ (0, l.jsxs)("button", {
                      className: "btn primary",
                      disabled: p.archived,
                      onClick: () => h("artifact"),
                      children: [/* @__PURE__ */ (0, l.jsx)(Pt, { size: 16 }), "登記成果"]
                    })]
                  })]
                }),
                !p.artifacts.length && /* @__PURE__ */ (0, l.jsx)("p", {
                  className: "muted",
                  children: "尚無成果；檔案位置只是引用，需檢查內容及雜湊才能作為 PASS 證據。"
                }),
                p.artifacts.map((b) => /* @__PURE__ */ (0, l.jsxs)("article", {
                  className: "journal-card",
                  children: [
                    /* @__PURE__ */ (0, l.jsx)("h3", { children: /* @__PURE__ */ (0, l.jsx)(bf, {
                      url: b.location,
                      children: b.title
                    }) }),
                    /* @__PURE__ */ (0, l.jsxs)("p", { children: [
                      b.version,
                      " · ",
                      b.availability === "inspected" ? "已檢查（執行者回報）" : "僅登記位置"
                    ] }),
                    /* @__PURE__ */ (0, l.jsx)("p", {
                      className: "preserve-text",
                      children: b.inspection
                    }),
                    /* @__PURE__ */ (0, l.jsxs)("details", { children: [/* @__PURE__ */ (0, l.jsx)("summary", { children: "版本與雜湊" }), /* @__PURE__ */ (0, l.jsx)("code", { children: b.sha256 || "未提供" })] })
                  ]
                }, b.id)),
                /* @__PURE__ */ (0, l.jsx)("h3", { children: "資料來源" }),
                p.sources.map((b) => /* @__PURE__ */ (0, l.jsxs)("article", {
                  className: "journal-card",
                  children: [
                    /* @__PURE__ */ (0, l.jsx)("b", { children: /* @__PURE__ */ (0, l.jsx)(bf, {
                      url: b.location,
                      children: b.title
                    }) }),
                    /* @__PURE__ */ (0, l.jsxs)("p", { children: [
                      b.readStatus === "read" ? "已讀內容快照" : "未讀，只登記連結",
                      " · ",
                      b.version
                    ] }),
                    /* @__PURE__ */ (0, l.jsx)("p", { children: b.observation }),
                    /* @__PURE__ */ (0, l.jsxs)("details", { children: [
                      /* @__PURE__ */ (0, l.jsx)("summary", { children: "查看保存的來源內容" }),
                      /* @__PURE__ */ (0, l.jsx)("pre", {
                        className: "hub-json",
                        children: b.snapshot || "尚未讀取"
                      }),
                      /* @__PURE__ */ (0, l.jsx)("code", { children: b.sha256 })
                    ] })
                  ]
                }, b.id))
              ]
            }) : /* @__PURE__ */ (0, l.jsxs)("section", {
              className: "wide-card",
              children: [
                /* @__PURE__ */ (0, l.jsxs)("div", {
                  className: "section-title",
                  children: [/* @__PURE__ */ (0, l.jsx)("h2", { children: "問題與阻礙" }), /* @__PURE__ */ (0, l.jsx)("button", {
                    className: "btn primary",
                    disabled: p.archived,
                    onClick: () => h("issue"),
                    children: "新增問題"
                  })]
                }),
                !p.issues.length && /* @__PURE__ */ (0, l.jsx)("div", {
                  className: "empty",
                  children: "尚未登記問題。"
                }),
                p.issues.map((b) => /* @__PURE__ */ (0, l.jsxs)("article", {
                  className: "journal-card",
                  children: [
                    /* @__PURE__ */ (0, l.jsx)("span", {
                      className: "status",
                      children: b.status === "open" ? "待處理" : "已記錄解法"
                    }),
                    /* @__PURE__ */ (0, l.jsx)("h3", { children: b.title }),
                    /* @__PURE__ */ (0, l.jsx)("p", {
                      className: "preserve-text",
                      children: b.detail
                    }),
                    b.resolution && /* @__PURE__ */ (0, l.jsx)("p", {
                      className: "preserve-text",
                      children: b.resolution
                    }),
                    b.status === "open" && /* @__PURE__ */ (0, l.jsx)("button", {
                      className: "btn",
                      disabled: p.archived,
                      onClick: () => h("resolve", { issueId: b.id }),
                      children: "填寫處理結果"
                    })
                  ]
                }, b.id))
              ]
            })
          ] }) : /* @__PURE__ */ (0, l.jsxs)(l.Fragment, { children: [/* @__PURE__ */ (0, l.jsxs)("div", {
            className: "page-heading",
            children: [/* @__PURE__ */ (0, l.jsxs)("div", { children: [
              /* @__PURE__ */ (0, l.jsx)("div", {
                className: "eyebrow",
                children: "立之雲端庫"
              }),
              /* @__PURE__ */ (0, l.jsx)("h1", { children: ge ? "專案範本" : "我的專案" }),
              /* @__PURE__ */ (0, l.jsx)("p", { children: "把目標、過程和成果放在同一個專案裡。" })
            ] }), /* @__PURE__ */ (0, l.jsxs)("div", {
              className: "heading-actions",
              children: [/* @__PURE__ */ (0, l.jsx)("button", {
                className: "btn",
                onClick: () => pe(!ge),
                children: ge ? "我的專案" : "專案範本"
              }), /* @__PURE__ */ (0, l.jsxs)("button", {
                className: "btn primary",
                onClick: () => h("create"),
                children: [/* @__PURE__ */ (0, l.jsx)(Pt, { size: 17 }), "建立專案"]
              })]
            })]
          }), ge ? /* @__PURE__ */ (0, l.jsx)("div", {
            className: "hub-project-grid",
            children: Object.entries(zs).map(([b, le]) => /* @__PURE__ */ (0, l.jsxs)("button", {
              className: "hub-project-card",
              onClick: () => h("create", { type: b }),
              children: [
                /* @__PURE__ */ (0, l.jsx)(Yr, { size: 24 }),
                /* @__PURE__ */ (0, l.jsx)("h2", { children: le }),
                /* @__PURE__ */ (0, l.jsx)("p", { children: b === "animation" ? "集數、共用模型與既有動畫專業流程。" : b === "model" ? "八個模型工作階段，保存來源、候選、檢查與交接。" : b === "software" ? "需求、設計、實作、測試、發布與維護。" : "自訂階段、任務、工作紀錄及交付。" }),
                /* @__PURE__ */ (0, l.jsx)("span", { children: "使用範本 →" })
              ]
            }, b))
          }) : /* @__PURE__ */ (0, l.jsxs)(l.Fragment, { children: [
            /* @__PURE__ */ (0, l.jsxs)("div", {
              className: "hub-filter",
              children: [/* @__PURE__ */ (0, l.jsxs)("label", {
                className: "search",
                children: [/* @__PURE__ */ (0, l.jsx)(zf, { size: 16 }), /* @__PURE__ */ (0, l.jsx)("input", {
                  "aria-label": "搜尋專案",
                  placeholder: "搜尋專案",
                  value: oe,
                  onChange: (b) => V(b.target.value)
                })]
              }), /* @__PURE__ */ (0, l.jsxs)("label", { children: [/* @__PURE__ */ (0, l.jsx)("input", {
                type: "checkbox",
                checked: W,
                onChange: (b) => P(b.target.checked)
              }), " 顯示封存"] })]
            }),
            /* @__PURE__ */ (0, l.jsx)("div", {
              className: "hub-project-grid",
              children: x.filter((b) => (W || !b.archived) && b.name.toLowerCase().includes(oe.toLowerCase())).map((b) => /* @__PURE__ */ (0, l.jsxs)("button", {
                className: "hub-project-card",
                onClick: () => {
                  fe(b.id);
                },
                children: [
                  /* @__PURE__ */ (0, l.jsxs)("div", {
                    className: "project-card-top",
                    children: [b.type === "animation" ? /* @__PURE__ */ (0, l.jsx)(ni, { size: 24 }) : b.type === "software" ? /* @__PURE__ */ (0, l.jsx)(sm, { size: 24 }) : /* @__PURE__ */ (0, l.jsx)(Yr, { size: 24 }), /* @__PURE__ */ (0, l.jsx)("span", { children: zs[b.type] })]
                  }),
                  /* @__PURE__ */ (0, l.jsx)("h2", { children: b.name }),
                  /* @__PURE__ */ (0, l.jsxs)("p", { children: ["目前階段：", b.currentStage] }),
                  /* @__PURE__ */ (0, l.jsxs)("div", {
                    className: "project-card-next",
                    children: [
                      /* @__PURE__ */ (0, l.jsx)("small", { children: "最近工作" }),
                      /* @__PURE__ */ (0, l.jsx)("strong", { children: b.recentWork }),
                      /* @__PURE__ */ (0, l.jsx)("small", { children: "下一個待辦" }),
                      /* @__PURE__ */ (0, l.jsx)("strong", { children: b.nextAction })
                    ]
                  }),
                  /* @__PURE__ */ (0, l.jsxs)("div", {
                    className: "project-card-bottom",
                    children: [/* @__PURE__ */ (0, l.jsx)("span", {}), /* @__PURE__ */ (0, l.jsx)("span", { children: "開啟專案 →" })]
                  })
                ]
              }, b.id))
            }),
            !x.length && /* @__PURE__ */ (0, l.jsx)("div", {
              className: "empty",
              children: "尚無專案，請建立第一個專案。"
            }),
            /* @__PURE__ */ (0, l.jsxs)("details", {
              className: "hub-help",
              children: [/* @__PURE__ */ (0, l.jsx)("summary", { children: "舊版獨立單集紀錄" }), /* @__PURE__ */ (0, l.jsx)("button", {
                className: "text-btn",
                onClick: () => {
                  z("resume"), T("legacy");
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
      de && /* @__PURE__ */ (0, l.jsx)("div", {
        role: "status",
        className: "toast",
        children: de
      }),
      Y && /* @__PURE__ */ (0, l.jsx)("div", {
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
            }[Y] }), /* @__PURE__ */ (0, l.jsx)("button", {
              className: "icon-btn",
              "aria-label": "關閉表單",
              disabled: ne,
              onClick: () => {
                window.confirm("確定放棄尚未儲存的表單？") && j("");
              },
              children: /* @__PURE__ */ (0, l.jsx)(Ns, { size: 20 })
            })]
          }), /* @__PURE__ */ (0, l.jsxs)("form", {
            onSubmit: J,
            children: [
              Y === "create" ? /* @__PURE__ */ (0, l.jsxs)(l.Fragment, { children: [
                ue("type", "專案類型", Object.entries(zs)),
                F("name", "專案名稱", !0),
                F("description", "專案目標", !1, !0)
              ] }) : Y === "stage" ? /* @__PURE__ */ (0, l.jsxs)(l.Fragment, { children: [F("stageKey", "階段編號（例如 M0）", !0), F("title", "階段名稱", !0)] }) : Y === "edit" ? /* @__PURE__ */ (0, l.jsxs)(l.Fragment, { children: [
                p?.kind !== "animation" && F("name", "專案名稱", !0),
                F("description", "專案目標", !1, !0),
                ue("status", "專案狀態", Object.entries(Ft).filter(([b]) => [
                  "planning",
                  "in_progress",
                  "blocked",
                  "completed"
                ].includes(b)))
              ] }) : Y === "restore" ? /* @__PURE__ */ (0, l.jsx)("p", { children: "以新版本回復此專案的通用資料，保留回復前內容與異動紀錄。動畫及模型專業資料維持現況。" }) : Y === "resolve" ? F("resolution", "處理方式與依據", !0, !0) : /* @__PURE__ */ (0, l.jsxs)(l.Fragment, { children: [[
                "task",
                "record",
                "issue",
                "artifact"
              ].includes(Y) && ue("stageId", "階段", [...Y === "artifact" || Y === "issue" ? [["", "不指定階段"]] : [], ...(p?.stages ?? []).map((b) => [b.id, b.key + " · " + b.title])]), Y === "task" ? /* @__PURE__ */ (0, l.jsxs)(l.Fragment, { children: [
                F("title", "工作項目", !0),
                ue("status", "目前狀態", gf.map((b) => [b, Ft[b]])),
                F("nextAction", "下一步", !1, !0),
                /* @__PURE__ */ (0, l.jsx)("p", {
                  className: "muted",
                  children: "選擇 PASS 仍需有此任務的測試紀錄及證據，否則保存為待驗證。"
                })
              ] }) : Y === "record" ? /* @__PURE__ */ (0, l.jsxs)(l.Fragment, { children: [
                ue("taskId", "對應工作", [["", "整個階段"], ...(p?.managedTasks ?? []).filter((b) => b.stageId === Z.stageId).map((b) => [b.id, b.title])]),
                ue("status", "回報結果", gf.map((b) => [b, Ft[b]])),
                ue("mode", "這次如何執行", [
                  "actual",
                  "simulation",
                  "document",
                  "not_run"
                ].map((b) => [b, Ft[b]])),
                F("scope", "測試／工作範圍（例如 ezdxf 或模擬 MCP）", !0),
                F("summary", "這次實際做了什麼", !0, !0),
                F("method", "檢查方法", !1, !0),
                F("result", "檢查結果", !1, !0),
                Ue("evidenceIds", p?.artifacts ?? []),
                Ue("sourceIds", p?.sources ?? []),
                F("limitations", "限制與未完成項目", !1, !0),
                F("nextStep", "下一位接手要做什麼", !0, !0),
                /* @__PURE__ */ (0, l.jsx)("p", {
                  className: "muted",
                  children: "無有效證據的 PASS 回報會保存為 NOT_TESTED；模擬通過不代表實機通過。"
                })
              ] }) : Y === "artifact" ? /* @__PURE__ */ (0, l.jsxs)(l.Fragment, { children: [
                F("title", "成果名稱", !0),
                F("location", "成果檔案位置", !0),
                F("version", "成果版本"),
                ue("availability", "檢查情形", [["reference", "只登記位置"], ["inspected", "已檢查內容"]]),
                F("sha256", "SHA-256", Z.availability === "inspected"),
                F("inspection", "實際檢查內容", Z.availability === "inspected", !0)
              ] }) : Y === "source" ? /* @__PURE__ */ (0, l.jsxs)(l.Fragment, { children: [
                F("title", "來源名稱", !0),
                F("location", "來源位置", !0),
                F("version", "來源版本"),
                ue("readStatus", "閱讀情形", [["reference", "未讀，只登記連結"], ["read", "已讀取內容"]]),
                F("snapshot", "讀取內容快照", Z.readStatus === "read", !0),
                F("sha256", "內容 SHA-256", Z.readStatus === "read"),
                F("observation", "閱讀觀察", Z.readStatus === "read", !0)
              ] }) : /* @__PURE__ */ (0, l.jsxs)(l.Fragment, { children: [F("title", "問題名稱", !0), F("detail", "問題、影響及缺少的條件", !0, !0)] })] }),
              I && /* @__PURE__ */ (0, l.jsx)("p", {
                className: "modal-error",
                role: "alert",
                children: I
              }),
              /* @__PURE__ */ (0, l.jsx)("div", {
                className: "modal-actions",
                children: /* @__PURE__ */ (0, l.jsx)("button", {
                  type: "submit",
                  className: "btn primary",
                  disabled: ne,
                  children: ne ? "儲存中…" : Y === "restore" ? "回復成新版本" : "儲存並讀回"
                })
              })
            ]
          })]
        })
      })
    ]
  });
}
var nx = `
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

:host{display:block;--bg:#f7f8fa;--ink:#23322e;--muted:#85908b;--green:#326552;--border:#e4e9e6;--mint:#edf4ef;--font:'Noto Sans TC','Microsoft JhengHei',system-ui,sans-serif;color:var(--ink);font:14px/1.6 var(--font);background:var(--bg)}.native-production{min-width:0}.workspace{display:grid;grid-template-columns:230px minmax(0,1fr);min-height:calc(100dvh - 70px)}.sidebar{position:sticky;inset:auto;top:0;width:auto;height:calc(100dvh - 70px);overflow-y:auto;padding-top:20px}.brand{display:none}.main{margin-left:0!important}.topbar{height:48px}.page-content{padding:24px}.cloud-indicator{font-size:11px}.sidebar nav{max-height:none}.side-bottom{padding-top:20px}@media(max-width:850px){.workspace{grid-template-columns:185px minmax(0,1fr)}.page-content{padding:20px}}@media(max-width:600px){.workspace{display:block}.sidebar{position:relative;height:auto;padding:12px 16px 0}.main{margin:0}.topbar{display:none}.page-content{padding:20px 16px}.page-heading{margin-top:0}.page-heading p{max-width:none;font-size:12px}.sidebar .new-project{margin-bottom:6px}h1{font-size:24px}}`, sx = "https://hrdzywkihfqggiwjgavi.supabase.co/functions/v1/lizhi-production", _s = /* @__PURE__ */ new WeakMap(), cx = async (r, x, C) => {
  const p = window.LizhiAuth;
  if (!p?.client) throw new Error("請先登入立之雲端庫");
  const { data: o, error: M } = await p.client.auth.getSession();
  if (M || !o.session?.access_token) throw new Error("登入已失效，請重新登入雲端庫");
  return fetch(sx + "/" + r + x, {
    cache: "no-store",
    headers: {
      Authorization: "Bearer " + o.session.access_token,
      apikey: window.LIZHI_SUPABASE_PUBLISHABLE_KEY,
      ...C ? { "Content-Type": "application/json" } : {}
    },
    ...C ? {
      method: "POST",
      body: JSON.stringify(C)
    } : {}
  });
};
function rx(r) {
  if (_s.has(r)) return;
  const x = r.attachShadow({ mode: "open" }), C = document.createElement("style");
  C.textContent = nx, x.append(C);
  const p = document.createElement("div");
  p.className = "native-production", x.append(p);
  const o = (0, km.createRoot)(p);
  _s.set(r, o), o.render(/* @__PURE__ */ (0, l.jsx)(ix, { nativeTransport: cx }));
}
function dx(r) {
  _s.get(r)?.unmount(), _s.delete(r);
}
export {
  rx as mount,
  dx as unmount
};
