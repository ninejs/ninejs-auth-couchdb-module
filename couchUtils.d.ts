import { Database } from './cradle';
export declare function mergeWithoutConflict(db: Database, id: string, doc: any, callback: (err: any, data: any) => void, condition?: (data: any) => boolean): void;
export declare function removeWithoutConflict(db: Database, id: string, callback: (err: any, data: any) => void): void;
