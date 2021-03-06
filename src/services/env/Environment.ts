import { readFileSync } from 'fs'
import { resolve } from 'path'

import { PackageJson } from './PackageJson.type'

export interface IEnvironmentVariables {
    port?: string;
    crypt: {
        jwt_secret: string,
        jwt_expiresIn: string,
        salt_rounds: string,
    };
    server: {
        port: string,
        host: string,
        api: {
            base_path: string,
            doc_path: string,
        },
    };
    db:
    {
        main: {
            connectionString: string,
            name: string,
        },
        events: {
            connectionString: string,
            name: string,
        },
    };
}

export class Environment {
    package: PackageJson;
    listenPort?: string;
    vars: IEnvironmentVariables;

    create (): void {
        const packageJson = readFileSync( resolve( __dirname, '../../../package.json' ), 'utf8' )
        this.package = new PackageJson( JSON.parse( packageJson ) )

        this.listenPort = this.var( 'PORT' ) || this.var( 'SERVER_PORT' )

        this.vars = {
            port: this.var( 'PORT' ),
            crypt: {
                jwt_secret: this.var( 'JWT_SECRET' ),
                jwt_expiresIn: this.var( 'JWT_EXPIRESIN' ),
                salt_rounds: this.var( 'CRYPT_SALT_ROUNDS' ),
            },
            server: {
                port: this.var( 'SERVER_PORT' ),
                host: this.var( 'SERVER_HOST' ),
                api: {
                    base_path: this.var( 'SERVER_API_BASE_PATH' ),
                    doc_path: this.var( 'SERVER_API_DOC_PATH' ),
                },
            },
            db: {
                main: {
                    connectionString: this.var( 'DB_MAIN_CONNECTION_STRING' ),
                    name: this.var( 'DB_MAIN_NAME' ),
                },
                events: {
                    connectionString: this.var( 'DB_EVENTS_CONNECTION_STRING' ),
                    name: this.var( 'DB_EVENTS_NAME' ),
                },
            },
        }
    }
    check (): void {
        this.checkExists( 'JWT_SECRET' )
        this.checkExists( 'JWT_EXPIRESIN' )
        this.checkExists( 'CRYPT_SALT_ROUNDS' )

        this.checkExists( 'SERVER_API_BASE_PATH' )
        this.checkExists( 'SERVER_API_DOC_PATH' )

        this.checkExists( 'DB_MAIN_CONNECTION_STRING' )
        this.checkExists( 'DB_MAIN_NAME' )

        this.checkExists( 'DB_EVENTS_CONNECTION_STRING' )
        this.checkExists( 'DB_EVENTS_NAME' )
    }
    print (): void {
        console.log( 'Environment mode = ', process.env.NODE_ENV )
        console.log( `serve sta on ${this.vars.server.host}:${this.listenPort}` )
        console.log( `serve api on ${this.vars.server.host}:${this.listenPort}/${this.vars.server.api.base_path}` )
        console.log( `serve doc on ${this.vars.server.host}:${this.listenPort}/${this.vars.server.api.doc_path}` )
    }

    private checkExists ( name: string ): void {
        if ( !process.env[name] ) {
            throw new Error( `Env variable ${name} not found` )
        }
    }
    private var ( name: string ): string {
        return process.env[name] || ''
    }
}
