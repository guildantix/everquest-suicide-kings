const { app, protocol, BrowserWindow, ipcMain } = require( "electron" );
const { autoUpdater } = require('electron-updater');
const url = require( "url" );
const path = require( "path" );
const { clipboard } = require( 'electron' );
const ForwardRef = require( './src/electron/forward-ref' );
const Database = require( './src/electron/data/storage' );
const WindowManager = require( './src/electron/utilities/window-manager' );

/** @type {BrowserWindow} */
var mainWindow;
var enableDevMode = true;

GH_TOKEN = "e3460400ae1273a5cac83e1b86a5aceae7f8bab7";

const database = new Database();
/** @type {WindowManager} */
const windowManager = new WindowManager(__dirname);

function createWindow() {
    mainWindow = new BrowserWindow( {
        // width: userPreferences.windowWidth,
        // height: userPreferences.windowHeight,
        // x: userPreferences.windowX,
        // y: userPreferences.windowY,
        //   transparent: true,
        width: 850,
        height: 600,
        frame: false,
        backgroundThrottling: false,
        webPreferences: {
            nodeIntegration: true,
            devTools: app.isDev(),
        },
    } );

    mainWindow.loadURL(
        url.format( {
            pathname: path.join( __dirname, `/dist/index.html` ),
            protocol: "file:",
            slashes: true
        } )
    );
    // Open the DevTools.
    if ( app.isDev() ) {
        mainWindow.webContents.openDevTools();
    }

    mainWindow.on( 'closed', function () {
        mainWindow = null
    } );

    mainWindow.on( 'close', function () {
        windowManager.unload();
    } );

    mainWindow.on( 'resize', function ( e ) {
        let bounds = mainWindow.webContents.getOwnerBrowserWindow().getBounds();
        // userPreferences.windowWidth = bounds.width;
        // userPreferences.windowHeight = bounds.height;
    } );

    mainWindow.on( 'move', function () {
        let bounds = mainWindow.webContents.getOwnerBrowserWindow().getBounds();
        // userPreferences.windowX = bounds.x;
        // userPreferences.windowY = bounds.y;
    } );

    mainWindow.webContents.once( 'dom-ready', () => {
        autoUpdater.checkForUpdatesAndNotify().then( result => {
            mainWindow.webContents.send( 'console:log', result );
        }, error => {
            mainWindow.webContents.send( 'console:log', error );
        } );
        sendTick();
    } );

    

    let logFile = database.getValue( 'logFilePath' );
    let suicideBidSymbol = database.getValue( 'bidSymbol' ) ?? 'X';
    let suicideLootMasters = database.getValue( 'bidTakers' ) ?? [];

    if ( logFile ) {
        let youCharacterName = database.getValue( 'youCharacterName' );
        windowManager.startLogWatcherWindow( logFile, app.isDev(), youCharacterName, suicideBidSymbol, suicideLootMasters );
    }

};

app.isDev = () => enableDevMode === true && process.defaultApp === true;

app.commandLine.appendSwitch( 'enable-speech-dispatcher' );

// app.on( 'ready', createWindow );
app.on( 'ready', function () {
    protocol.interceptFileProtocol( 'file', ( req, callback ) => {
        let filePath = new url.URL( req.url ).pathname;
        if ( process.platform === 'win32' ) {

            if ( filePath.match( /^\/[A-Za-z]:/ ) ) {
                // If it begins with a slash, remove it.
                filePath = filePath.slice( 1 );
            }

            if ( filePath.match( /^[A-Za-z]:\/(css|img|js|fonts)/ ) ) {
                filePath = path.join( app.getAppPath(), 'dist', filePath.slice( 3 ) );
            } else if ( filePath.match( /^[A-Za-z]:\/[^/\\]+?\.(js|css|png|jpeg|jpg|ico|svg|woff|woff2|ttf)$/ ) ) {
                // case of "vue-cli-service build --mode development"
                filePath = path.join( app.getAppPath(), 'dist', filePath.slice( 3 ) );
            }

        } else {

            if ( filePath.match( /^\/(css|img|js)/ ) ) {
                filePath = path.join( app.getAppPath(), 'dist', filePath.slice( 1 ) );
            } else if ( filePath.match( /^\/[^/\\]+?\.(js|css|png|jpeg|jpg|ico|svg)$/ ) ) {
                // case of "vue-cli-service build --mode development"
                filePath = path.join( app.getAppPath(), 'dist', filePath.slice( 1 ) );
            }

        }

        callback( path.normalize( filePath ) );
    } );
    createWindow();
} );

app.on( 'window-all-closed', function () {
    if ( process.platform !== 'darwin' ) app.quit()
} );

app.on( 'activate', function () {
    if ( mainWindow === null ) createWindow()
} );

ipcMain.on( 'app:quit', ( event, data ) => { app.quit(); } );

ipcMain.on( 'app:minimize', ( event, data ) => {
    mainWindow.minimize();
} );

ipcMain.on( 'app:minimize:tray', ( event, data ) => {
    mainWindow.minimize();
} );

ipcMain.on( 'app:request:tick', ( event, data ) => {
    sendTick();
} );

ipcMain.on( 'main:console:log', ( event, data ) => { mainWindow.webContents.send( 'console:log', data ); } );

function sendTick() {
    
    let tickData = {
        // logFile: userPreferences.logFile,
        // voiceIndex: userPreferences.voiceIndex,
        isDev: app.isDev(),
    };

    mainWindow.webContents.send( 'tick', tickData );

}

autoUpdater.signals.updateDownloaded( () => {
    mainWindow.webContents.send( 'update_downloaded' );
} );

autoUpdater.on( 'update-available', () => {
    mainWindow.webContents.send( 'update_available' );
} );

ipcMain.on( 'app:restart', () => {
    autoUpdater.quitAndInstall();
} );

ipcMain.on( 'app:isDev', ( event ) => {
    event.sender.send( 'app:isDev', app.isDev() );
} );

ipcMain.on( 'app:version', ( event ) => {
    event.sender.send( 'app:version', { version: app.getVersion() } );
} );

ipcMain.on( 'clipboard:writeText', ( event, value ) => {
    clipboard.writeText( value );
} );

var pseudoClipboard = {};
ipcMain.on( 'context:store:pseudo-clipboard', ( event, model ) => {
    if ( model && model.key ) {
        pseudoClipboard[ model.key ] = model.value;
    }
} );
ipcMain.on( 'context:get:pseudo-clipboard', ( event, key ) => {
    event.sender.send( 'context:get:pseudo-clipboard', pseudoClipboard[ key ] );
} );

var mainWindowRef = new ForwardRef( () => mainWindow ? mainWindow : null );

database.attachIpcEvents( sendTick, windowManager );
windowManager.attachIpcEvents( mainWindowRef, sendTick );
