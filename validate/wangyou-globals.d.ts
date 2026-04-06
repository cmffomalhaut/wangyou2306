declare module '*.vue' {
  import type { DefineComponent } from 'vue';

  const component: DefineComponent<Record<string, never>, Record<string, never>, any>;
  export default component;
}

declare module '*.yaml' {
  const value: any;
  export default value;
}

declare const z: typeof import('zod');
declare const _: typeof import('lodash');
declare const createApp: typeof import('vue')['createApp'];
declare const createPinia: typeof import('pinia')['createPinia'];
declare const $: any;
declare function waitGlobalInitialized(name: string): Promise<void>;
declare function getVariables(input: { type: string }): unknown;
