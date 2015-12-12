import { Logger } from 'ninejs/modules/ninejs-server';
import { Database } from '../cradle';
import { PromiseType } from 'ninejs/core/deferredUtils';
export default function checkDb(db: Database, log: Logger, config: any, justCreated?: boolean): PromiseType<any[]>;
