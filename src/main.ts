import 'module-alias/register'

import { writeFileSync } from 'fs'
import { resolve } from 'path'

import { Logger, ValidationPipe } from '@nestjs/common'
import { NestFactory } from '@nestjs/core'
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger'

import * as morgan from 'morgan'

import { AppModule } from './app.module'
import { env } from './services/env'
import * as dbService from './services/db'

import * as session from 'express-session'
import * as passport from 'passport'
import ioserver from './app.wsserver'
import contracts from './contracts'

async function bootstrap (): Promise<void> {
    const logger = new Logger( 'main' )
    const app = await NestFactory.create( AppModule )

    //#region [ EXPRESS CONFIGS ]
    logger.log( 'enable cors' )
    app.enableCors( {
        origin: true,
        optionsSuccessStatus: 200,
        credentials: true,
    } )
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    // app.use(require('helmet')()); // problems with typings
    app.use( morgan( 'tiny', { skip: ( ( req: any ) => req.url.startsWith( '/socket.io' ) ) } ) )

    // passport and sessions
    app.use( session( {
        secret: process.env.SESSION_SECRET,
        resave: false,
        saveUninitialized: false,
    } ) )

    app.use( passport.initialize() )
    app.use( passport.session() )

    //#endregion

    //#region [ NESTJS CONFIGS]
    logger.log( `set global prefix ${env.vars.server.api.base_path}` )
    app.setGlobalPrefix( env.vars.server.api.base_path )

    logger.log( 'use global pipes' )
    app.useGlobalPipes( new ValidationPipe( { transform: true } ) )

    logger.log( 'use websocket adapter (socket.io)' )
    ioserver.setup( app.getHttpServer(), false, 5000 )
    ioserver.register( contracts.get() )
    ioserver.debubWSServer()
    //ioserver.debugEngineIOServer()
    //#endregion

    //#region [ services DB ]
    logger.log( 'initialize DB' )
    dbService.initialize()
    await dbService.db.connect()
    //#endregion

    //#region [ swagger ]
    logger.log( 'initialize  swagger' )
    const options = new DocumentBuilder()
        .addServer( 'http://localhost:3000' )
        .addServer( 'https://api.nexjs.io' )
        .addBearerAuth(
            {
                type: 'http',
                scheme: 'bearer',
                bearerFormat: 'JWT',
            },
            'bearer'
        )
        .setTitle( env.package.name )
        .setDescription( env.package.description )
        .setVersion( env.package.version )
        .build()
    const document = SwaggerModule.createDocument( app, options )

    // create swagger especification file output. Used by openapi-generator.
    const path = resolve( __dirname, 'swagger-spec.json' )
    logger.log( `Write swagger definition file: ${path}` )
    writeFileSync( path, JSON.stringify( document ) )

    SwaggerModule.setup( env.vars.server.api.doc_path, app, document )
    //#endregion

    await app.listen( 3000 )
}
bootstrap()
