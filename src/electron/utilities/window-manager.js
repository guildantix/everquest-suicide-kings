const { app, BrowserWindow, ipcMain, screen } = require( "electron" );
const customAlphabet = require( 'nanoid' ).customAlphabet;
const alphabet = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
const idLen = 16;
const nanoid = customAlphabet( alphabet, 16 );
const ForwardRef = require( '../forward-ref' );
const url = require( "url" );
const path = require( "path" );

/** @type {Record<string, BrowserWindow>} */
var windowDictionary = {};
/** @type {BrowserWindow} */
var logWatcherWindow = null;
var logFilePath = null;
var suicideBidSymbol = null;
var suicideBidTakers = null;
var youCharacterName = null;

class WindowManager {
    
    #dirname;
    /** @type {ForwardRef<BrowserWindow>} */
    #mainWindowRef;

    constructor(dirname) {
        this.#dirname = dirname;
    }
    








    
    /**
     * Initializes all ipc event handlers for the window manager.
     * 
     * @param {BrowserWindow} mainWindowRef The reference to the main window.
     * @param {() => void} sendTick A reference to the send tick function.
     */
    attachIpcEvents( mainWindowRef, sendTick ) {

        this.#mainWindowRef = mainWindowRef;

        ipcMain.on( 'raid:dialog:new', ( event, arg ) => {

            let modalWindow = new BrowserWindow( {
                parent: mainWindowRef.reference,
                modal: true,
                show: false,
                width: 1300,
                height: 900,
                frame: false,
                webPreferences: {
                    nodeIntegration: true,
                    devTools: app.isDev(),
                }
            } );

            let url = `file://${this.#dirname}/dist/index.html#/raid`;

            if ( arg ) {
                url += `/${arg}`;
            }
            modalWindow.loadURL( url );
            modalWindow.once( "ready-to-show", () => {
                modalWindow.show();
            } );
            let hwnd = nanoid();
            windowDictionary[ hwnd ] = modalWindow;

        } );
        
        ipcMain.on( 'window:child:close', ( event, hwnd ) => {
            if ( hwnd !== null && hwnd !== undefined && hwnd.length > 0 ) {
                let bwin = windowDictionary[ hwnd ];
                bwin?.close();
                windowDictionary[ hwnd ] = null;
            } else {
                let bwin = BrowserWindow.fromWebContents( event.sender );
                bwin?.close();
            }
        } );

        ipcMain.on( 'log:event:characterBidded', ( event, chr ) => {
            this.sendMessageAll( 'log:event:characterBidded', chr );
        } );

        ipcMain.on( 'log:event:characterLeft', ( event, chr ) => {
            this.sendMessageAll( 'log:event:characterLeft', chr );
        } );

        ipcMain.on( 'log:event:characterJoined', ( event, chr ) => {
            this.sendMessageAll( 'log:event:characterJoined', chr );
        } );

        ipcMain.on( 'log:event:bidStarted', ( event, chr ) => {
            this.sendMessageAll( 'log:event:bidStarted', chr );
        } );

        ipcMain.on( 'log:raid:dumpDetected', ( event, data ) => {
            this.sendMessageAll( 'log:raid:dumpDetected', data );
        } );

    }










    /**
     * Sends a message to all windows.
     * 
     * @param {string} key The message key
     * @param {any} value The message value.
     */
    sendMessageAll( key, value ) {
        this.#mainWindowRef.reference.webContents.send( key, value );

        if ( windowDictionary ) {
            for ( let hwnd in windowDictionary ) {
                if ( windowDictionary.hasOwnProperty( hwnd ) ) {
                    if ( windowDictionary[ hwnd ] == null || windowDictionary[ hwnd ].isDestroyed() ) {
                        windowDictionary[ hwnd ] = null;
                    } else {
                        windowDictionary[ hwnd ].webContents.send( key, value );
                    }
                }
            }
        }

        let restartLogWatcher = false;

        if ( key === 'db:set:youCharacterName') {
            restartLogWatcher = youCharacterName !== value;
            youCharacterName = value;
        } else if ( key === 'db:set:logFilePath' ) {
            restartLogWatcher = logFilePath !== value;
            logFilePath = value;
        } else if ( key === 'db:set:bidSymbol' ) {
            restartLogWatcher = suicideBidSymbol !== value;
            suicideBidSymbol = value;
        } else if ( key === 'db:set:bidTakers' ) {
            restartLogWatcher = true;
            suicideBidTakers = value;
        }

        if ( restartLogWatcher ) {
            this.startLogWatcherWindow( logFilePath, app.isDev(), youCharacterName, suicideBidSymbol, suicideBidTakers );
        }
    }










    /**
     * Unloads any opened modal windows.
     */
    unload() {
        if ( windowDictionary ) {
            for ( let hwnd in windowDictionary ) {
                if ( windowDictionary.hasOwnProperty( hwnd ) ) {
                    windowDictionary[ hwnd ].close();
                    windowDictionary[ hwnd ] = null;
                }
            }
        }
    }

    startLogWatcherWindow( logFile, isDev, characterName, bidSymbol, bidTakers ) {

        logFilePath = logFile;
        youCharacterName = characterName;
        suicideBidSymbol = bidSymbol;
        suicideBidTakers = bidTakers;

        if ( logWatcherWindow != null ) {
            logWatcherWindow.removeAllListeners( 'closed' );
            logWatcherWindow.close();
            logWatcherWindow = null;
        }

        logWatcherWindow = new BrowserWindow( {
            //   width: 800,
            //   height: 600,
            show: isDev === true,
            webPreferences: { nodeIntegration: true, webSecurity: false },
        } );

        logWatcherWindow.webContents.openDevTools();
        // let url = `file://${this.#dirname}/dist/index.html#/raid`;

        // logWatcherWindow.loadURL(
        //     url.format( {
        //         pathname: path.join( this.#dirname, `/src/electron/threads/log-watcher.html?logFile=${encodeURI(logFile)}` ),
        //         protocol: "file:",
        //         slashes: true
        //     } )
        // );

        logWatcherWindow.loadURL( `file://${this.#dirname}/src/electron/threads/log-watcher.html?logFile=${encodeURI( logFile )}&characterName=${encodeURI( youCharacterName )}&bidSymbol=${encodeURI( bidSymbol )}&bidTakers=${encodeURI( JSON.stringify( bidTakers ) )}` );
    
        logWatcherWindow.on( 'closed', function () {
            logWatcherWindow = null;
        } );
    
        logWatcherWindow.setPosition( 100, 500 );
    
        return logWatcherWindow;
    }

}

module.exports = WindowManager;
