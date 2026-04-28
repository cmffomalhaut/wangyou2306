import { defineMvuDataStore } from '@util/mvu';
import { Schema } from '../../wangyou/schema';

export const useDataStore = defineMvuDataStore(Schema, { type: 'message', message_id: getCurrentMessageId() });
