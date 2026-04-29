import { defineStore } from 'pinia';
import type { z } from 'zod';

interface VariableOption {
  type: 'message';
  message_id: number;
}

export function defineMvuDataStore<T extends z.ZodTypeAny>(
  schema: T,
  variableOption: VariableOption,
) {
  return defineStore('mvu-data', {
    state: () => ({
      _data: null as z.output<T> | null,
    }),
    getters: {
      data(state): z.output<T> {
        if (!state._data) {
          const w = (window.parent !== window ? window.parent : window) as any;
          const variables = w.Mvu?.getMvuData?.(variableOption) ?? {};
          const raw = w._?.get?.(variables, 'stat_data', {}) ?? {};
          state._data = schema.parse(raw);
        }
        return state._data!;
      },
    },
    actions: {
      refresh() {
        const w = (window.parent !== window ? window.parent : window) as any;
        const variables = w.Mvu?.getMvuData?.(variableOption) ?? {};
        const raw = w._?.get?.(variables, 'stat_data', {}) ?? {};
        this._data = schema.parse(raw);
      },
    },
  });
}
