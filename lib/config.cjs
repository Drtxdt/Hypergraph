"use strict";
const Ajv = require("ajv");
const schema = require("../config.schema.json");
const validate = new Ajv({
  allErrors: true,
  useDefaults: true,
  strict: false,
}).compile(schema);
function merge(base, override) {
  if (override === undefined) return structuredClone(base);
  if (
    override === null ||
    typeof override !== "object" ||
    Array.isArray(override)
  )
    return structuredClone(override);
  const result =
    base && typeof base === "object" && !Array.isArray(base)
      ? structuredClone(base)
      : {};
  for (const [key, value] of Object.entries(override)) {
    if (["__proto__", "constructor", "prototype"].includes(key))
      throw new Error(`Unsafe configuration key: ${key}`);
    result[key] = merge(result[key], value);
  }
  return result;
}
function resolveConfig(input) {
  const config = structuredClone(input);
  if (!validate(config))
    throw new Error(
      "Hypergraph configuration:\n" +
        validate.errors
          .map(
            (e) =>
              `${e.instancePath || "/"}${e.params.additionalProperty ? "/" + e.params.additionalProperty : ""}: ${e.message}`,
          )
          .join("\n"),
    );
  if (
    config.comments.enable &&
    ["waline", "artalk"].includes(config.comments.provider) &&
    !config.comments.server
  )
    throw new Error(
      "Hypergraph /comments/server: required when comments are enabled",
    );
  if (config.comments.enable && config.comments.provider === "giscus")
    for (const key of ["repo", "repo_id", "category_id"])
      if (!config.comments[key])
        throw Error(`Hypergraph /comments/${key}: required for Giscus`);
  if (
    config.comments.enable &&
    config.comments.provider === "twikoo" &&
    !config.comments.env_id
  )
    throw Error("Hypergraph /comments/env_id: required for Twikoo");
  if (config.external_search.enable)
    for (const key of ["app_id", "search_key", "index"])
      if (!config.external_search[key])
        throw Error(`Hypergraph /external_search/${key}: required`);
  if (config.ai_summary.enable && !config.ai_summary.endpoint)
    throw Error("Hypergraph /ai_summary/endpoint: required");
  if (config.chat.enable && !config.chat.id)
    throw Error("Hypergraph /chat/id: required");
  if (
    config.chat.enable &&
    ["daovoice", "custom"].includes(config.chat.provider) &&
    !config.chat.url
  )
    throw Error("Hypergraph /chat/url: required for custom service loader");
  if (
    config.comments.enable &&
    config.comments.barrage &&
    !config.comments.recent
  )
    throw Error("Hypergraph /comments/barrage requires /comments/recent");
  if (
    config.comments.enable &&
    config.comments.provider !== "waline" &&
    (config.comments.count || config.comments.recent || config.comments.barrage)
  )
    throw Error(
      "Hypergraph /comments: count, recent and barrage currently require Waline",
    );
  for (const [index, service] of config.analytics.entries())
    if (service.provider === "umami" && !service.url)
      throw Error(`Hypergraph /analytics/${index}/url: required for Umami`);
  for (const [index, service] of config.analytics.entries())
    if (["cnzz", "51la", "custom"].includes(service.provider) && !service.url)
      throw Error(
        `Hypergraph /analytics/${index}/url: use the script URL supplied by your service console`,
      );
  if (config.music.enable && !config.music.src)
    throw new Error("Hypergraph /music/src: required when music is enabled");
  if (config.adsense.enable && !/^ca-pub-\d+$/.test(config.adsense.client))
    throw Error(
      "Hypergraph /adsense/client: expected ca-pub- followed by digits",
    );
  if (
    config.resources.asset_base &&
    !/^https?:\/\//.test(config.resources.asset_base)
  )
    throw Error(
      "Hypergraph /resources/asset_base: expected absolute HTTP(S) URL",
    );
  if (
    config.footer.start_date &&
    !Number.isFinite(Date.parse(config.footer.start_date))
  )
    throw Error("Hypergraph /footer/start_date: expected ISO date");
  for (const [label, service] of [
    ["comments", config.comments],
    ["comments/secondary", config.comments.secondary],
  ]) {
    if (!service?.enable) continue;
    const required =
      {
        waline: ["server"],
        artalk: ["server"],
        twikoo: ["env_id"],
        giscus: ["repo", "repo_id", "category_id"],
        disqus: ["shortname"],
        disqusjs: ["shortname", "api_key"],
        livere: ["uid"],
        valine: ["app_id", "app_key"],
        utterances: ["repo"],
        facebook: ["app_id"],
        remark42: ["server", "site"],
        gitalk: ["client_id", "client_secret", "repo", "owner", "proxy"],
      }[service.provider] || [];
    for (const key of required)
      if (!service[key])
        throw Error(
          `Hypergraph /${label}/${key}: required for ${service.provider}`,
        );
    if (service.shortname && !/^[a-z0-9-]+$/i.test(service.shortname))
      throw Error(`Hypergraph /${label}/shortname: invalid forum name`);
  }
  return config;
}
module.exports = { merge, resolveConfig };
