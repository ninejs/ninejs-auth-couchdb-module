import { Logger } from 'ninejs/modules/ninejs-server';
import { Database } from 'ninejs-store/CouchDB';
export default function checkDb(db: Database, log: Logger, config: any): Promise<{}>;
