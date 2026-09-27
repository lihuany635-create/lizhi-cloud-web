(function (root, factory) {
  var api = factory(root.FinanceAiContext || (typeof require === "function" ? require("./finance-ai-context.js") : null));
  if (typeof module === "object" && module.exports) module.exports = api;
  root.FinanceAiOutputGuard = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function (FinanceAiContext) {
  "use strict";
  function pushUnique(list, value) { if (list.indexOf(value) === -1) list.push(value); }
  function normalizeText(value) { return String(value == null ? "" : value).normalize("NFKC").trim().toLowerCase(); }
  function parseOnce(rawText) {
    var text = String(rawText == null ? "" : rawText).trim();
    if (!text) return {error: "ai_empty_response", repaired: false, repairs: []};
    var candidate = text;
    var repaired = false;
    var repairs = [];
    var fenced = candidate.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
    if (fenced) { candidate = fenced[1].trim(); repaired = true; repairs.push("strip_markdown_fence"); }
    try { return {value: JSON.parse(candidate), repaired: repaired, repairs: repairs}; }
    catch (firstError) {
      if (repaired) return {error: "ai_invalid_json", repaired: true, repairs: repairs};
      var start = candidate.indexOf("{");
      var end = candidate.lastIndexOf("}");
      if (start === -1 || end <= start) return {error: "ai_invalid_json", repaired: false, repairs: []};
      try { return {value: JSON.parse(candidate.slice(start, end + 1)), repaired: true, repairs: ["extract_json_object"]}; }
      catch (secondError) { return {error: "ai_invalid_json", repaired: true, repairs: ["extract_json_object"]}; }
    }
  }
  function allowedForField(field, context) {
    var values = context.allowedValues || {};
    if (field === "type") return values.types || [];
    if (field === "category") return values.categories || [];
    if (field === "creditCard") return values.creditCards || [];
    if (["account", "fromAccount", "toAccount"].indexOf(field) !== -1) return values.accounts || [];
    return null;
  }
  function validateValue(field, value, context) {
    if (value == null || value === "") return {value: null};
    if (typeof value !== "string") return {value: null, issue: "ai_value_not_allowed:" + field};
    var text = value.trim();
    var allowed = allowedForField(field, context);
    if (allowed && allowed.indexOf(text) === -1) return {value: null, issue: "ai_value_not_allowed:" + field};
    if (field === "category" && normalizeText(context.rawText).indexOf(normalizeText(text)) === -1) return {value: null, issue: "ai_value_not_allowed:category"};
    if (field === "merchant" && normalizeText(context.rawText).indexOf(normalizeText(text)) === -1) return {value: null, issue: "ai_value_not_allowed:merchant"};
    if (field === "note" && text.length > 200) return {value: null, issue: "ai_value_not_allowed:note"};
    return {value: text};
  }
  function invalidResult(error, parsed) {
    return Object.freeze({patch: Object.freeze({}), issues: Object.freeze([error]), repaired: parsed.repaired, repairs: Object.freeze(parsed.repairs), valid: false});
  }
  function guardFinanceAiOutput(rawOutput, context) {
    context = context || {};
    var parsed = typeof rawOutput === "string" || rawOutput == null ? parseOnce(rawOutput) : {value: rawOutput, repaired: false, repairs: []};
    if (parsed.error) return invalidResult(parsed.error, parsed);
    if (!parsed.value || typeof parsed.value !== "object" || Array.isArray(parsed.value)) return invalidResult("ai_invalid_json", parsed);
    var allowedFields = FinanceAiContext.AI_ALLOWED_FIELDS;
    var missingFields = Array.isArray(context.missingFields) ? context.missingFields : [];
    var lockedFields = Array.isArray(context.lockedFields) ? context.lockedFields : [];
    var patch = {};
    var issues = [];
    Object.keys(parsed.value).forEach(function (field) {
      var value = parsed.value[field];
      if (lockedFields.indexOf(field) !== -1) { pushUnique(issues, "ai_attempted_locked_field:" + field); return; }
      if (allowedFields.indexOf(field) === -1) { pushUnique(issues, "ai_unknown_field:" + field); return; }
      if (missingFields.indexOf(field) === -1) {
        if (value != null && value !== "") pushUnique(issues, "ai_field_not_requested:" + field);
        return;
      }
      var checked = validateValue(field, value, context);
      patch[field] = checked.value;
      if (checked.issue) pushUnique(issues, checked.issue);
    });
    missingFields.forEach(function (field) {
      if (allowedFields.indexOf(field) !== -1 && !Object.prototype.hasOwnProperty.call(patch, field)) patch[field] = null;
    });
    return Object.freeze({patch: Object.freeze(patch), issues: Object.freeze(issues), repaired: parsed.repaired, repairs: Object.freeze(parsed.repairs), valid: true});
  }
  return Object.freeze({guardFinanceAiOutput: guardFinanceAiOutput});
});
