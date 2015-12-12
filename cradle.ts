'use strict';

declare var require: any;
let cradle: any = require('cradle');

export interface ViewParameters {
    key?: string;
    reduce?: boolean;
    keys?: string[];
    group?: boolean;
}

export interface Database {
    create (): Promise<any>;
    exists (): Promise<boolean>;
    get (id:string, callback: (err: any, result: any) => void): void;
    view (viewName: string, args: ViewParameters, callback: (err: any, result: any) => void): void;
    save (data: any, callback: (err?: any, data?: any) => void): void;
    save (id: string, data: any, callback: (err?: any, data?: any) => void): void;
    save (id: string, rev: string, data: any, callback: (err?: any, data?: any) => void): void;
    remove (id: string, rev: string, callback: (err?: any, data?: any) => void): void;
}
export interface CradleConnection {
    database: (name: string) => Database;
}

export var Connection: {
    new (host: string, port: string, storeConfig: any): CradleConnection
} = cradle.Connection;

export function merge (...args: any[]): any {
    return cradle.merge(...args);
}



