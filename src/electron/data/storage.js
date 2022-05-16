const { app, BrowserWindow, ipcMain, remote, dialog } = require( "electron" );
const path = require( 'path' );
const fs = require( 'fs' );
const _ = require( 'lodash' );
const customAlphabet = require( 'nanoid' ).customAlphabet;
const alphabet = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
const idLen = 16;
const nanoid = customAlphabet( alphabet, 16 );
const archiver = require( 'archiver' );
const extract = require( 'extract-zip' );
const WindowManager = require( "../utilities/window-manager" );

class Database {

    #userDataPath;

    /** The stored file path and location for this object. */
    #path;

    /** The data store for this object. */
    #data;

    constructor() {

        this.#userDataPath = ( app || remote.app ).getPath( 'userData' );
        this.#path = path.join( this.#userDataPath, 'database.json' );
        
        this.#data = this.parseDataFile();

        this.upgradeDatabaseFile();
    }

    upgradeDatabaseFile() {
        
        if ( this.#data.databaseVersion == null || this.#data.databaseVersion < 3 ) {
            // Setup the history types, previous versions had no history type and only kept history on suicides so we set the values to 0.
            // However, I can manually insert histories (bad me) so there's that if statement in the assignment.

            if ( this.#data.masterListsDb && this.#data.masterListsDb.masterLists?.length > 0 ) {

                this.#data.masterListsDb.masterLists.forEach( master => {
                    for ( let i = 1; i < master.history.length; i++ ) {
                        master.history[ i ].historyType = master.history[ i ].historyType > 0 ? master.history[ i ].historyType : 0;
                    }
                } );

            }

            this.#data.databaseVersion = 3;
            this.storeDataFile();

        } else if ( this.#data.databaseVersion < 4 ) {
            /** @type {any[]} */
            let raids = this.#data.raidsDb;
            let lists = this.#data.masterListsDb?.masterLists;
            let removeRaidIds = [];

            if ( raids?.length > 0 ) {
                for ( let i = 0; i < raids.length; i++ ) {
                    let raidId = raids[ i ].raidId;

                    // Find the first suicide for the current raid, and use that timestamp to date the raid.
                    for ( let mi = 0; mi < lists.length; mi++ ) {
                        for ( let si = 0; si < lists[ mi ].history?.length; si++ ) {
                            if ( lists[ mi ].history[ si ].raidId === raidId && lists[ mi ].history[ si ].timestamp ) {
                                raids[ i ].date = lists[ mi ].history[ si ].timestamp;
                                break;
                            }
                        }

                        if ( raids[ i ].date ) {
                            break;
                        }
                    }

                    // If a date was not found, we need to remove this raid from the store.
                    if ( raids[ i ].date == null ) {
                        removeRaidIds.push( raids[ i ].raidId );
                    }
                }

                // Remove each raid that a date could not be found.
                if ( removeRaidIds.length > 0 ) {
                    removeRaidIds.forEach( raidId => {
                        let i = raids.findIndex( f => f.raidId === raidId );
                        raids.splice( i, 1 );
                    } );
                }
                
            }

            // Saves the changes made to the store.
            this.#data.databaseVersion = 4;
            this.storeDataFile();
            
        }
    }









    
    /**
     * Creates a backup of the database.  ASks the user to save this file to their harddrive.
     * 
     * @param {(string) => void)} onComplete Callback function executed when the backup file is created that receives the backup file location.
     */
    backupDatafile( onComplete ) {
        let backupFile = path.join( this.#userDataPath, 'backup.zip' );
        let output = fs.createWriteStream( backupFile );
        let zip = archiver( 'zip' );

        output.on( 'close', () => {

            let options = {
                //Placeholder 1
                title: "EQ Suicide Kings - Save Backup File",
                
                //Placeholder 2
                defaultPath: "eq-suicide-kings-backup.zip",
                
                //Placeholder 4
                buttonLabel: "Save Backup File",
                
                //Placeholder 3
                filters: [
                    { name: 'Zip', extensions: [ 'zip' ] }
                ]
            }

            const WIN = BrowserWindow.getFocusedWindow();

            dialog.showSaveDialog( WIN, options ).then( saveResult => {
                if ( !saveResult.canceled ) {
                    fs.copyFile( backupFile, saveResult.filePath, () => { onComplete( saveResult.filePath ) } );
                }
            } );
        } );

        zip.pipe( output );
        zip.file( this.#path, { name: 'database.json' } );
        zip.finalize();
    }










    /**
     * Creates an export file of the database.  Asks the user to save this file to their harddrive.
     * 
     * @param {(string) => void)} onComplete Callback function executed when the export file is created that receives the export file location.
     */
    exportData( onComplete ) {
        let exportFile = path.join( this.#userDataPath, 'export.skzip' );
        let output = fs.createWriteStream( exportFile );
        let zip = archiver( 'zip' );
        let rawPath = path.join( this.#userDataPath, 'export.json' );

        output.on( 'close', () => {

            let options = {
                //Placeholder 1
                title: "EQ Suicide Kings - Save Export File",
                
                //Placeholder 2
                defaultPath: "eq-suicide-kings-data.skzip",
                
                //Placeholder 4
                buttonLabel: "Save Export File",
                
                //Placeholder 3
                filters: [
                    { name: 'skzip', extensions: [ 'skzip' ] }
                ]
            }

            const WIN = BrowserWindow.getFocusedWindow();

            dialog.showSaveDialog( WIN, options ).then( saveResult => {
                if ( !saveResult.canceled ) {
                    fs.copyFile( exportFile, saveResult.filePath, () => { onComplete( saveResult.filePath ) } );
                }
                fs.rmSync( rawPath );
            } );
        } );

        let raw = {
            guildRoster: this.#data.guildRoster,
            masterListsDb: this.#data.masterListsDb,
            raidsDb: this.#data.raidsDb,
            databaseVersion: this.#data.databaseVersion
        };

        fs.writeFileSync( rawPath, JSON.stringify( raw ) );

        zip.pipe( output );
        zip.file( rawPath, { name: 'export.json' } );
        zip.finalize();
    }










    /**
     * Retores the database from a backup file.  This method will also update the 
     * database object.
     * 
     * @param {function} onComplete Callback executed when the operation completes.  Passes a boolean value true when the restore succeeds.
     */
    restoreDataFile( onComplete ) {
        
        let options = {
            //Placeholder 1
            title: "EQ Suicide Kings - Restore Backup File",
            
            //Placeholder 4
            buttonLabel: "Restore Backup File",
            
            //Placeholder 3
            filters: [
                { name: 'Zip', extensions: [ 'zip' ] }
            ]
        }

        const WIN = BrowserWindow.getFocusedWindow();

        dialog.showOpenDialog( WIN, options ).then( openResult => {
            let backup = openResult.filePaths[ 0 ];
            
            var restorePath = path.join( this.#userDataPath, '\\restored' );

            extract( backup, { dir: restorePath } ).then( () => {
                let bak = path.join( restorePath, `database-${Date.now()}.json` );
            
                if ( fs.existsSync( this.#path ) ) {
                    fs.copyFileSync( this.#path, bak );
                    fs.unlinkSync( this.#path );
                }

                fs.renameSync( path.join( restorePath, 'database.json' ), this.#path );

                if ( fs.existsSync( this.#path ) ) {
                    this.#data = this.parseDataFile();
                    onComplete( true );

                } else {
                    fs.renameSync( bak, this.#path );
                    onComplete( false );

                }
            } );
        } );

    }
    









    /**
     * Imports data from an export file.  This method will also update the 
     * database object.
     * 
     * @param {function} onComplete Callback executed when the operation completes.  Passes a boolean value true when the restore succeeds.
     */
    importData( onComplete ) {

        let options = {
            //Placeholder 1
            title: "EQ Suicide Kings - Import Data File",
            
            //Placeholder 4
            buttonLabel: "Import Data File",
            
            //Placeholder 3
            filters: [
                { name: 'skzip', extensions: [ 'skzip' ] }
            ]
        };

        const WIN = BrowserWindow.getFocusedWindow();

        dialog.showOpenDialog( WIN, options ).then( exportFile => {
            
            var restorePath = path.join( this.#userDataPath, '\\restored' );

            extract( exportFile.filePaths[0], { dir: restorePath } ).then( () => {
                let bak = path.join( restorePath, `database-${Date.now()}.json` );
                
                if ( fs.existsSync( this.#path ) ) {
                    fs.copyFileSync( this.#path, bak );
                }
    
                let importFilePath = path.join( restorePath, 'export.json' );
                if ( fs.existsSync( importFilePath ) ) {
                    let importedData = JSON.parse( fs.readFileSync( importFilePath ) ?? '{}' );
        
                    this.#data.guildRoster = importedData.guildRoster;
                    this.#data.masterListsDb = importedData.masterListsDb;
                    this.#data.raidsDb = importedData.raidsDb;
                    this.#data.databaseVersion = importedData.databaseVersion;
    
                    this.upgradeDatabaseFile();
                    this.storeDataFile();
                    onComplete( true );
                    return;
                }
    
                onComplete( false );
            } );

        } );
    }









    
    /**
     * Parses the database.json file and returns the database object.
     * 
     * @returns Returns the database json object.
     */
    parseDataFile() {
        // We'll try/catch it in case the file doesn't exist yet, which will be the case on the first application run.
        // `fs.readFileSync` will return a JSON string which we then parse into a Javascript object
        try {
            return JSON.parse( fs.readFileSync( this.#path ) ?? '{}' );
        } catch ( error ) {
            // if there was some kind of error, return an empty object.
            return {};
        }
    }









    
    /**
     * Serializes and stores the database file to disk.
     */
    storeDataFile() {
        try {
            fs.writeFileSync( this.#path, JSON.stringify( this.#data ) );
        } catch ( error ) {
            console.error( 'Error storing database.json', error );
        }
    }









    
    /**
     * Retrieves the specified value from the db.
     * 
     * @returns Returns the value from the database for key, or empty array.
     * 
     * @param {string} name The key value.
     */
    getTable( name ) {
        return this.#data[ name ] ?? [];
    }









    
    /**
     * Retrieves the specified value from the db.
     * 
     * @returns Returns the value from the database for key, or empty object.
     * 
     * @param {string} name The key value.
     */
    getObject( name ) {
        return this.#data[ name ] ?? {};
    }










    /**
     * Retrieves the specified value from the db.
     * 
     * @returns Returns the value from the database for key, or empty object.
     * 
     * @param {string} name The key value.
     */
    getValue( name ) {
        return this.#data[ name ] ?? null;
    }









    
    /**
     * Stores the given value under the specified key.
     * 
     * @param {string} name The key value for the database.
     * @param {any} val The value to store under key.
     */
    setValue( name, val ) {
        this.#data[ name ] = val;
        this.storeDataFile();
    }










    /**
     * Attaches store events to ipc main and dispatches react events to the main window.
     * 
     * @param {function} sendTick The send tick method.
     * @param {WindowManager} windowManager The window manager.
     */
    attachIpcEvents( sendTick, windowManager ) {
        
        ipcMain.on( 'db:set', ( event, args ) => {
            this.setValue( args.name, args.value );
            windowManager.sendMessageAll( `db:set:${args.name}`, args.value );
        } );

        ipcMain.on( 'db:get:value', ( event, name ) => {
            event.sender.webContents.send( `db:get:${name}`, this.getValue( name ) );
        } );

        ipcMain.on( 'db:get:object', ( event, name ) => {
            event.sender.webContents.send( 'db:get:object', this.getObject( name ) );
        } );

        ipcMain.on( 'db:get:guildRoster', ( event ) => {
            event.sender.webContents.send( 'db:get:guildRoster', this.getTable( 'guildRoster' ) );
        } );

        ipcMain.on( 'db:get:raidsDb', ( event ) => {
            event.sender.webContents.send( 'db:get:raidsDb', this.getTable( 'raidsDb' ) );
        } );

        ipcMain.on( 'db:get:backup', ( event ) => {
            this.backupDatafile( ( path ) => {
                event.sender.webContents.send( 'db:get:backup', path );
            } );
        } );

        ipcMain.on( 'db:get:export', ( event ) => {
            this.exportData( ( path ) => {
                event.sender.webContents.send( 'db:get:export', path );
            } );
        } );

        ipcMain.on( 'db:set:backup', ( event ) => {
            this.restoreDataFile( ( restored ) => {
                event.sender.webContents.send( 'db:set:backup', restored );
            } );
        } );

        ipcMain.on( 'db:set:export', ( event ) => {
            this.importData( ( restored ) => {
                event.sender.webContents.send( 'db:set:export', restored );
            } );
        } );

    }

}

module.exports = Database;
