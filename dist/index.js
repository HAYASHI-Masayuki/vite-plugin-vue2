"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createVuePlugin = exports.vueHotReload = exports.vueComponentNormalizer = void 0;
const fs_1 = __importDefault(require("fs"));
const pluginutils_1 = require("@rollup/pluginutils");
const componentNormalizer_1 = require("./utils/componentNormalizer");
const vueHotReload_1 = require("./utils/vueHotReload");
const query_1 = require("./utils/query");
const main_1 = require("./main");
const template_1 = require("./template");
const descriptorCache_1 = require("./utils/descriptorCache");
const style_1 = require("./style");
const hmr_1 = require("./hmr");
const jsxTransform_1 = require("./jsxTransform");
exports.vueComponentNormalizer = '\0/vite/vueComponentNormalizer';
exports.vueHotReload = '\0/vite/vueHotReload';
function createVuePlugin(rawOptions = {}) {
    const options = {
        isProduction: process.env.NODE_ENV === 'production',
        ...rawOptions,
        root: process.cwd(),
    };
    const filter = (0, pluginutils_1.createFilter)(options.include || /\.vue$/, options.exclude);
    return {
        name: 'vite-plugin-vue2',
        config() {
            if (options.jsx) {
                return {
                    esbuild: {
                        include: /\.ts$/,
                        exclude: /\.(tsx|jsx)$/,
                    },
                };
            }
        },
        handleHotUpdate(ctx) {
            if (!filter(ctx.file))
                return;
            return (0, hmr_1.handleHotUpdate)(ctx, options);
        },
        configResolved(config) {
            options.isProduction = config.isProduction;
            options.root = config.root;
        },
        configureServer(server) {
            options.devServer = server;
        },
        async resolveId(id) {
            if (id === exports.vueComponentNormalizer || id === exports.vueHotReload)
                return id;
            // serve subpart requests (*?vue) as virtual modules
            if ((0, query_1.parseVueRequest)(id).query.vue)
                return id;
        },
        load(id) {
            if (id === exports.vueComponentNormalizer)
                return componentNormalizer_1.normalizeComponentCode;
            if (id === exports.vueHotReload)
                return vueHotReload_1.vueHotReloadCode;
            const { filename, query } = (0, query_1.parseVueRequest)(id);
            // select corresponding block for subpart virtual modules
            if (query.vue) {
                if (query.src)
                    return fs_1.default.readFileSync(filename, 'utf-8');
                const descriptor = (0, descriptorCache_1.getDescriptor)(filename);
                let block;
                if (query.type === 'script')
                    block = descriptor.script;
                else if (query.type === 'template')
                    block = descriptor.template;
                else if (query.type === 'style')
                    block = descriptor.styles[query.index];
                else if (query.index != null)
                    block = descriptor.customBlocks[query.index];
                if (block) {
                    return {
                        code: block.content,
                        map: block.map,
                    };
                }
            }
        },
        async transform(code, id) {
            const { filename, query } = (0, query_1.parseVueRequest)(id);
            if (/\.(tsx|jsx)$/.test(id))
                return (0, jsxTransform_1.transformVueJsx)(code, id, options.jsxOptions);
            if ((!query.vue && !filter(filename)) || query.raw)
                return;
            if (!query.vue) {
                // main request
                return await (0, main_1.transformMain)(code, filename, options, this);
            }
            const descriptor = (0, descriptorCache_1.getDescriptor)(query.from ? decodeURIComponent(query.from) : filename);
            // sub block request
            if (query.type === 'template') {
                return (0, template_1.compileSFCTemplate)(code, descriptor.template, filename, options, this);
            }
            if (query.type === 'style') {
                return await (0, style_1.transformStyle)(code, filename, descriptor, Number(query.index), this);
            }
        },
    };
}
exports.createVuePlugin = createVuePlugin;
//# sourceMappingURL=index.js.map