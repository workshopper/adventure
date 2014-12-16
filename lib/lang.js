var lang = require('./en.json');

module.exports = function (i18n) {
  i18n = i18n || {}
  Object.keys(lang).forEach(function (key) {
    lang[key] = i18n[key] || lang[key]
  })
  return lang
}