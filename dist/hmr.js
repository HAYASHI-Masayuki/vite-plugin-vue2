"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleHotUpdate = void 0;
const debug_1 = __importDefault(require("debug"));
const descriptorCache_1 = require("./utils/descriptorCache");
const css_1 = require("./utils/css");
const debug = (0, debug_1.default)('vite:hmr');
/**
 * Vite-specific HMR handling
 */
async function handleHotUpdate({ file, modules, read }, options) {
    var _a;
    const prevDescriptor = (0, descriptorCache_1.getDescriptor)(file, false);
    if (!prevDescriptor) {
        // file hasn't been requested yet (e.g. async component)
        return;
    }
    (0, descriptorCache_1.setPrevDescriptor)(file, prevDescriptor);
    const content = await read();
    const descriptor = (0, descriptorCache_1.createDescriptor)(content, file, options);
    let needRerender = false;
    const affectedModules = new Set();
    const mainModule = modules.find(m => !/type=/.test(m.url) || /type=script/.test(m.url));
    const templateModule = modules.find(m => /type=template/.test(m.url));
    if (!isEqualBlock(descriptor.script, prevDescriptor.script)) {
        let scriptModule;
        if (((_a = descriptor.script) === null || _a === void 0 ? void 0 : _a.lang) && !descriptor.script.src) {
            const scriptModuleRE = new RegExp(`type=script.*&lang\.${descriptor.script.lang}$`);
            scriptModule = modules.find(m => scriptModuleRE.test(m.url));
        }
        affectedModules.add(scriptModule || mainModule);
    }
    if (!isEqualBlock(descriptor.template, prevDescriptor.template)) {
        affectedModules.add(templateModule);
        needRerender = true;
    }
    let didUpdateStyle = false;
    const prevStyles = prevDescriptor.styles || [];
    const nextStyles = descriptor.styles || [];
    // force reload if scoped status has changed
    if (prevStyles.some(s => s.scoped) !== nextStyles.some(s => s.scoped)) {
        // template needs to be invalidated as well
        affectedModules.add(templateModule);
        affectedModules.add(mainModule);
    }
    // only need to update styles if not reloading, since reload forces
    // style updates as well.
    for (let i = 0; i < nextStyles.length; i++) {
        const prev = prevStyles[i];
        const next = nextStyles[i];
        if (!prev || !isEqualBlock(prev, next)) {
            didUpdateStyle = true;
            const mod = modules.find(m => m.url.includes(`type=style&index=${i}`));
            if (mod) {
                affectedModules.add(mod);
            }
            else {
                // new style block - force reload
                affectedModules.add(mainModule);
            }
        }
    }
    if (prevStyles.length > nextStyles.length) {
        // style block removed - force reload
        affectedModules.add(mainModule);
    }
    const prevCustoms = prevDescriptor.customBlocks || [];
    const nextCustoms = descriptor.customBlocks || [];
    // custom blocks update causes a reload
    // because the custom block contents is changed and it may be used in JS.
    if (prevCustoms.length !== nextCustoms.length) {
        // block removed/added, force reload
        affectedModules.add(mainModule);
    }
    else {
        for (let i = 0; i < nextCustoms.length; i++) {
            const prev = prevCustoms[i];
            const next = nextCustoms[i];
            if (!prev || !isEqualBlock(prev, next)) {
                const mod = modules.find(m => m.url.includes(`type=${prev.type}&index=${i}`));
                if (mod)
                    affectedModules.add(mod);
                else
                    affectedModules.add(mainModule);
            }
        }
    }
    const updateType = [];
    if (needRerender) {
        updateType.push('template');
        // template is inlined into main, add main module instead
        if (!templateModule) {
            affectedModules.add(mainModule);
        }
        else if (mainModule) {
            for (const importer of mainModule.importers) {
                if ((0, css_1.isCSSRequest)(importer.url))
                    affectedModules.add(importer);
            }
        }
    }
    if (didUpdateStyle)
        updateType.push('style');
    if (updateType.length)
        debug(`[vue:update(${updateType.join('&')})] ${file}`);
    return [...affectedModules].filter(Boolean);
}
exports.handleHotUpdate = handleHotUpdate;
function isEqualBlock(a, b) {
    if (!a && !b)
        return true;
    if (!a || !b)
        return false;
    // src imports will trigger their own updates
    if (a.src && b.src && a.src === b.src)
        return true;
    if (a.content !== b.content)
        return false;
    const keysA = Object.keys(a.attrs);
    const keysB = Object.keys(b.attrs);
    if (keysA.length !== keysB.length)
        return false;
    return keysA.every(key => a.attrs[key] === b.attrs[key]);
}
//# sourceMappingURL=hmr.js.map