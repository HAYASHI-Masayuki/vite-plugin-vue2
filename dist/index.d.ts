import type { TemplateCompileOptions } from '@vue/component-compiler-utils';
import type { Plugin, ViteDevServer } from 'vite';
export declare const vueComponentNormalizer = "\0/vite/vueComponentNormalizer";
export declare const vueHotReload = "\0/vite/vueHotReload";
declare module '@vue/component-compiler-utils' {
    interface SFCDescriptor {
        id: string;
    }
}
export interface VueViteOptions {
    include?: string | RegExp | (string | RegExp)[];
    exclude?: string | RegExp | (string | RegExp)[];
    /**
     * The options for `@vue/component-compiler-utils`.
     */
    vueTemplateOptions?: Partial<TemplateCompileOptions>;
    /**
     * The options for jsx transform
     * @default false
     */
    jsx?: boolean;
    /**
     * The options for `@vue/babel-preset-jsx`
     */
    jsxOptions?: Record<string, any>;
    /**
     * The options for esbuild to transform script code
     * @default 'esnext'
     * @example 'esnext' | ['esnext','chrome58','firefox57','safari11','edge16','node12']
     */
    target?: string | string[];
}
export interface ResolvedOptions extends VueViteOptions {
    root: string;
    devServer?: ViteDevServer;
    isProduction: boolean;
    target?: string | string[];
}
export declare function createVuePlugin(rawOptions?: VueViteOptions): Plugin;
