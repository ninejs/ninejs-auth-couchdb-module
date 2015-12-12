import { NineJs, Logger } from 'ninejs/modules/ninejs-server';
import { CradleConnection, Database } from './cradle';
declare class AuthCouchDb {
    usersDb: string;
    storeConfig: any;
    storeConnection: CradleConnection;
    logger: Logger;
    db: Database;
    hash: (username: string, password: string) => string;
    documentName: string;
    config: any;
    constructor(config: any, ninejs: NineJs);
    login(username: string, password: string, domain?: string): Promise<any>;
    usersByPermission(permissions?: string[]): Promise<any>;
    users(): Promise<any>;
    permissions(): Promise<any>;
    init(): Promise<boolean>;
    getUser(username: string): Promise<any>;
}
export default AuthCouchDb;
