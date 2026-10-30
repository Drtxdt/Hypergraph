"use strict";
function pagePath(type, config = {}) {
  return (config.path || type + "/").replace(/^\/+/, "").replace(/\/?$/, "/");
}
module.exports = { pagePath };
