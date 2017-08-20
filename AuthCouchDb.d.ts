import { NineJs } from 'ninejs/modules/ninejs-server';
import { default as CouchDB, CouchConnection, Database } from 'ninejs-store/CouchDB';
declare class AuthCouchDb {
    usersDb: string;
    storeConnection: CouchConnection;
    db: Database;
    hash: (username: string, password: string) => string;
    documentName: string;
    config: any;
    constructor(config: any, ninejs: NineJs, couchdb: CouchDB);
    login(username: string, password: string, domain?: string): Promise<any>;
    usersByPermission(permissions?: string[]): Promise<any>;
    users(): Promise<any>;
    permissions(): Promise<any>;
    init(): Promise<boolean>;
    getUser(username: string): Promise<any>;
}
export default AuthCouchDb;
