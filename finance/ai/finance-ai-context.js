(function (root, factory) {
  var api = factory(root.FinanceTemplate || null);
  if (typeof module === "object" && module.exports) module.exports = api;
  root.FinanceAiContext = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  var AI_ALLOWED_FIELDS = Object.freeze(["type", "category", "account", "creditCard", "fromAccount", "toAccount", "merchant", "note"]);
  var ALLOWED_TYPES = Object.freeze(["expense", "income", "transfer", "credit_card_purchase", "credit_card_payment"]);
  var BLOCKING_ISSUES = Object.freeze(["multiple_transactions_not_supported", "amount_conflict", "date_conflict", "preprocessing_failed", "invalid_input", "memory_conflict", "memory_target_unavailable", "payment_intent_unclear"]);

  function uniqueStrings(values) {
    var seen = Object.create(null);
    return (Array.isArray(values) ? values : []).reduce(function (out, value) {
      var text = String(value == null ? "" : value).trim();
      if (text && !seen[text]) { seen[text] = true; out.push(text); }
      return out;
    }, []);
  }

  function activeNames(rows, type) {
    return uniqueStrings((Array.isArray(rows) ? rows : []).filter(function (row) {
      return row && row.active !== false && row.archived !== true && row.name && (!type || !row.type || row.type === type);
    }).map(function (row) { return row.name; }));
  }

  function evidenceBackedNames(rows, type, rawText) {
    var normalized = String(rawText == null ? "" : rawText).normalize("NFKC").trim().toLowerCase();
    return activeNames(rows, type).filter(function (name) {
      return normalized.indexOf(String(name).normalize("NFKC").trim().toLowerCase()) !== -1;
    });
  }

  function nonNullKnownFields(draft) {
    var out = {};
    Object.keys(draft || {}).forEach(function (key) {
      var value = draft[key];
      if (value === null || value === undefined || value === "") return;
      if (["version", "rawText", "source", "confidence"].indexOf(key) !== -1) return;
      out[key] = value;
    });
    return out;
  }

  function inferredType(draft, typeHints) {
    if (draft && ALLOWED_TYPES.indexOf(draft.type) !== -1) return draft.type;
    var hints = uniqueStrings(typeHints).filter(function (value) { return ALLOWED_TYPES.indexOf(value) !== -1; });
    return hints.length === 1 ? hints[0] : null;
  }

  function relevantMissingFields(draft, typeHints) {
    var missing = [];
    var type = inferredType(draft, typeHints);
    if (!draft || ALLOWED_TYPES.indexOf(draft.type) === -1) missing.push("type");
    function add(field) {
      if ((!draft || draft[field] == null || draft[field] === "") && missing.indexOf(field) === -1) missing.push(field);
    }
    if (type === "expense" || type === "income") { add("category"); add("account"); }
    else if (type === "transfer") { add("fromAccount"); add("toAccount"); }
    else if (type === "credit_card_purchase") { add("category"); add("creditCard"); }
    else if (type === "credit_card_payment") { if (!draft || (!draft.fromAccount && !draft.account)) add("fromAccount"); add("creditCard"); }
    return missing;
  }

  function hasBlockingIssue(ruleResult, issues) {
    if (ruleResult && ruleResult.multipleTransactions) return true;
    return issues.some(function (issue) { return BLOCKING_ISSUES.indexOf(String(issue).split(":")[0]) !== -1; });
  }

  function buildFinanceAiContext(options) {
    options = options || {};
    var ruleResult = options.ruleResult || {};
    var draft = options.draft || ruleResult.draft || {};
    var references = options.references || {};
    var rawText = String(options.rawText == null ? draft.rawText || "" : options.rawText).trim();
    var issues = uniqueStrings(ruleResult.issues || []);
    var lockedFields = uniqueStrings(ruleResult.lockedFields || []);
    var typeHints = uniqueStrings(ruleResult.typeHints || []);
    var missingFields = relevantMissingFields(draft, typeHints);
    var allowedValues = { types: ALLOWED_TYPES.slice() };
    var expectedType = inferredType(draft, typeHints);
    var categoryType = expectedType === "income" ? "income" : (["expense", "credit_card_purchase"].indexOf(expectedType) !== -1 ? "expense" : null);
    if (missingFields.indexOf("category") !== -1) allowedValues.categories = evidenceBackedNames(references.categories, categoryType, rawText);
    if (["account", "fromAccount", "toAccount"].some(function (field) { return missingFields.indexOf(field) !== -1; })) {
      allowedValues.accounts = activeNames(references.accounts);
    }
    if (missingFields.indexOf("creditCard") !== -1) allowedValues.creditCards = activeNames(references.creditCards);
    var blocking = hasBlockingIssue(ruleResult, issues);
    return Object.freeze({
      rawText: rawText,
      draft: draft,
      knownFields: nonNullKnownFields(draft),
      lockedFields: lockedFields,
      missingFields: missingFields,
      typeHints: typeHints,
      issues: issues,
      allowedValues: allowedValues,
      shouldCallAI: !blocking && missingFields.length > 0,
      skipReason: blocking ? "blocking_issue" : (missingFields.length ? null : "no_missing_fields")
    });
  }

  return Object.freeze({AI_ALLOWED_FIELDS: AI_ALLOWED_FIELDS, ALLOWED_TYPES: ALLOWED_TYPES, BLOCKING_ISSUES: BLOCKING_ISSUES, buildFinanceAiContext: buildFinanceAiContext});
});
