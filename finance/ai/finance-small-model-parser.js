(function (root, factory) {
  var isNode = typeof module === "object" && module.exports;
  var api = factory(
    isNode ? require("./finance-ai-context.js") : root.FinanceAiContext,
    isNode ? require("./finance-ai-prompt.js") : root.FinanceAiPrompt,
    isNode ? require("./finance-ai-output-guard.js") : root.FinanceAiOutputGuard,
    isNode ? require("./finance-ai-gateway-connector.js") : root.FinanceAIGatewayConnector,
    isNode ? require("../domain/finance-transaction-template.js") : root.FinanceTransactionTemplate
  );
  if (isNode) module.exports = api;
  root.FinanceSmallModelParser = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function (Context, Prompt, OutputGuard, GatewayConnector, Template) {
  "use strict";

  function errorIssue(error) {
    var code = error && error.code;
    if (code === "TIMEOUT" || code === "ABORTED" || code === "OLLAMA_TIMEOUT") return "ai_timeout";
    if (code === "CANCELLED") return "ai_cancelled";
    if (code === "EMPTY_RESPONSE") return "ai_empty_response";
    return "ai_unavailable";
  }

  function noCallResult(draft, context, ruleResult) {
    return Object.freeze({
      draft: draft,
      ruleResult: ruleResult,
      sourceTrace: Object.freeze(Object.assign({}, ruleResult.sourceTrace || {})),
      context: context,
      aiResult: Object.freeze({called: false, patch: Object.freeze({}), issues: Object.freeze([]), repaired: false, repairs: Object.freeze([]), model: null, durationMs: 0, skippedReason: context.skipReason})
    });
  }

  async function parseFinanceWithSmallModel(options) {
    options = options || {};
    var ruleResult = options.ruleResult || {};
    var draft = options.draft || ruleResult.draft;
    if (!draft) throw new TypeError("A Phase 2 finance draft is required.");
    var context = Context.buildFinanceAiContext({rawText: options.rawText, draft: draft, ruleResult: ruleResult, references: options.references || {}});
    if (!context.shouldCallAI) return noCallResult(draft, context, ruleResult);

    var connector = options.connector || GatewayConnector;
    var promptPackage = Prompt.buildFinanceAiPrompt(context);
    var started = Date.now();
    var response;
    try {
      response = await connector.generateConstrainedFinancePatch(promptPackage, options.settings, {signal: options.signal, context: context});
    } catch (error) {
      var issue = errorIssue(error);
      return Object.freeze({
        draft: draft,
        ruleResult: ruleResult,
        sourceTrace: Object.freeze(Object.assign({}, ruleResult.sourceTrace || {})),
        context: context,
        aiResult: Object.freeze({called: true, patch: Object.freeze({}), issues: Object.freeze([issue]), repaired: false, repairs: Object.freeze([]), model: null, durationMs: Date.now() - started, skippedReason: null})
      });
    }

    var guarded = OutputGuard.guardFinanceAiOutput(response && response.rawText, context);
    var mergedDraft = guarded.valid ? Template.mergeFinanceTransactionTemplate(draft, guarded.patch, context.lockedFields) : draft;
    var sourceTrace = Object.assign({}, ruleResult.sourceTrace || {});
    Object.keys(guarded.patch).forEach(function (field) {
      if (guarded.patch[field] != null && context.lockedFields.indexOf(field) === -1) sourceTrace[field] = "ai";
    });
    return Object.freeze({
      draft: mergedDraft,
      ruleResult: ruleResult,
      sourceTrace: Object.freeze(sourceTrace),
      context: context,
      aiResult: Object.freeze({called: true, patch: guarded.patch, issues: guarded.issues, repaired: guarded.repaired, repairs: guarded.repairs, model: response && response.model || null, durationMs: Date.now() - started, skippedReason: null})
    });
  }

  return Object.freeze({parseFinanceWithSmallModel: parseFinanceWithSmallModel});
});
