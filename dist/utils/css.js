"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isCSSRequest = void 0;
const cssLangs = '\\.(css|less|sass|scss|styl|stylus|pcss|postcss)($|\\?)';
const cssLangRE = new RegExp(cssLangs);
const isCSSRequest = (request) => cssLangRE.test(request);
exports.isCSSRequest = isCSSRequest;
//# sourceMappingURL=css.js.map