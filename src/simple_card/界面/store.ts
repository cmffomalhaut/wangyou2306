import { defineMvuDataStore } from '@util/mvu';
import { Schema } from '../../wangyou/schema';

const w = (window.parent !== window ? window.parent : window) as any;
export const useDataStore = defineMvuDataStore(Schema, { type: 'message', message_id: w.getCurrentMessageId?.() ?? -1 });
