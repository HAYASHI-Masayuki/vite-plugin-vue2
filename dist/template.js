"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.transformRequireToImport = exports.compileSFCTemplate = void 0;
const vueTemplateCompiler = __importStar(require("vue-template-compiler"));
const hash_sum_1 = __importDefault(require("hash-sum"));
const error_1 = require("./utils/error");
const compileTemplate_1 = require("./template/compileTemplate");
function compileSFCTemplate(source, block, filename, { isProduction, vueTemplateOptions = {} }, pluginContext) {
    const { tips, errors, code } = (0, compileTemplate_1.compileTemplate)({
        source,
        filename,
        compiler: vueTemplateCompiler,
        transformAssetUrls: true,
        transformAssetUrlsOptions: {
            forceRequire: true,
        },
        isProduction,
        isFunctional: !!block.attrs.functional,
        optimizeSSR: false,
        prettify: false,
        preprocessLang: block.lang,
        ...vueTemplateOptions,
        compilerOptions: {
            whitespace: 'condense',
            ...(vueTemplateOptions.compilerOptions || {}),
        },
    });
    if (tips) {
        tips.forEach(warn => pluginContext.warn({
            id: filename,
            message: typeof warn === 'string' ? warn : warn.msg,
        }));
    }
    if (errors) {
        const generateCodeFrame = vueTemplateCompiler.generateCodeFrame;
        errors.forEach((error) => {
            var _a;
            // 2.6 compiler outputs errors as objects with range
            if (generateCodeFrame
                && ((_a = vueTemplateOptions.compilerOptions) === null || _a === void 0 ? void 0 : _a.outputSourceRange)) {
                const { msg, start, end } = error;
                return pluginContext.error((0, error_1.createRollupError)(filename, {
                    message: msg,
                    frame: generateCodeFrame(source, start, end),
                }));
            }
            else {
                pluginContext.error({
                    id: filename,
                    message: typeof error === 'string' ? error : error.msg,
                });
            }
        });
    }
    // rewrite require calls to import on build
    return {
        code: `${transformRequireToImport(code)}\nexport { render, staticRenderFns }`,
        map: null,
    };
}
exports.compileSFCTemplate = compileSFCTemplate;
function transformRequireToImport(code) {
    const imports = {};
    let strImports = '';
    code = code.replace(/require\(("(?:[^"\\]|\\.)+"|'(?:[^'\\]|\\.)+')\)/g, (_, name) => {
        if (!(name in imports)) {
            // #81 compat unicode assets name
            imports[name] = `__$_require_${(0, hash_sum_1.default)(name)}__`;
            strImports += `import ${imports[name]} from ${name}\n`;
        }
        return imports[name];
    });
    return strImports + code;
}
exports.transformRequireToImport = transformRequireToImport;
//# sourceMappingURL=template.js.map