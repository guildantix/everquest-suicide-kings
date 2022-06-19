import { Injectable, NgZone } from '@angular/core';
import { IpcRenderer } from 'electron';
import { Observable, Observer } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { DataTickModel, ListsDatabase, MasterSuicideKingsList, GuildMember, Raid } from './core.model';
import { GinaConfiguration, GinaTriggerGroups } from './gina.model';
import * as _ from 'lodash-es';
import { UpdateInfo } from 'electron-updater';

@Injectable( { providedIn: 'root' })
export class IpcService {
    
    private ipc: IpcRenderer;
    private _tickObservers: Observer<DataTickModel>[] = [];
    private _logFileChangeObservers: Observer<string>[] = [];
    private _consoleLogRequestObservers: Observer<any>[] = [];
    private _masterListsUpdatedObservers: Observer<ListsDatabase>[] = [];
    private _characterBiddedObservers: Observer<string>[] = [];
    private _characterLeftRaidObservers: Observer<string>[] = [];
    private _characterJoinedRaidObservers: Observer<string>[] = [];
    private _bidStartedObservers: Observer<string>[] = [];
    private _raidDumpObservers: Observer<string>[] = [];
    private _updateAvailableObservers: Observer<UpdateInfo>[] = [];
    private _standByObservers: Observer<string>[] = [];

    constructor( private ngZone: NgZone ) {
        if ( ( <any>window ).require ) {
            try {
                this.ipc = ( <any>window ).require( 'electron' ).ipcRenderer;

                this.ipc.on( 'standby_raider', ( event: any, data: string ) => {
                    ngZone.run( () => {
                        this._standByObservers?.forEach( f => {
                            f.next( data );
                        } );
                    } );
                } );

                this.ipc.on( 'update_downloaded', ( event: any, data: UpdateInfo ) => {
                    ngZone.run( () => {
                        this._updateAvailableObservers?.forEach( f => {
                            f.next( data );
                        } );
                    } );
                } );

                this.ipc.on( 'tick', ( event: any, data: DataTickModel ) => {
                    ngZone.run( () => {
                        this._tickObservers?.forEach( f => {
                            f.next( data );
                        } );
                    } );
                } );

                this.ipc.on( 'db:set:masterListsDb', ( event: any, data: ListsDatabase ) => {
                    ngZone.run( () => {
                        this._masterListsUpdatedObservers?.forEach( f => {
                            f.next( data );
                        } );
                    } );
                } );

                this.ipc.on( 'log:event:characterBidded', ( event: any, data: string ) => {
                    ngZone.run( () => {
                        this._characterBiddedObservers?.forEach( f => {
                            f.next( data );
                        } );
                    } );
                } );

                this.ipc.on( 'log:event:characterLeft', ( event: any, data: string ) => {
                    ngZone.run( () => {
                        this._characterLeftRaidObservers?.forEach( f => {
                            f.next( data );
                        } );
                    } );
                } );

                this.ipc.on( 'log:event:characterJoined', ( event: any, data: string ) => {
                    ngZone.run( () => {
                        this._characterJoinedRaidObservers?.forEach( f => {
                            f.next( data );
                        } );
                    } );
                } );

                this.ipc.on( 'log:event:bidStarted', ( event: any, data: string ) => {
                    ngZone.run( () => {
                        this._bidStartedObservers?.forEach( f => {
                            f.next( data );
                        } );
                    } );
                } );

                this.ipc.on( 'log:raid:dumpDetected', ( event: any, data: string ) => {
                    ngZone.run( () => {
                        this._raidDumpObservers?.forEach( f => {
                            f.next( data );
                        } );
                    } );
                } );

            } catch ( e ) {
                throw e;
            }
        } else {
            console.warn( 'App not running inside Electron!' );
        }
    }

    public onStandbyRaider(): Observable<string> {
        let obs: Observable<string> = new Observable<string>( ( observer: Observer<string> ) => {
            this._standByObservers.push( observer );
        } );

        return obs;
    }

    public updateAvailable(): Observable<UpdateInfo> {
        let obs: Observable<UpdateInfo> = new Observable<UpdateInfo>( ( observer: Observer<UpdateInfo> ) => {
            this._updateAvailableObservers.push( observer );
        } );

        return obs;
    }

    public masterListsUpdated(): Observable<ListsDatabase> {
        let obs: Observable<ListsDatabase> = new Observable<ListsDatabase>( ( observer: Observer<ListsDatabase> ) => {
            this._masterListsUpdatedObservers.push( observer );
        } );

        return obs;
    }

    public characterBidded(): Observable<string> {
        let obs: Observable<string> = new Observable<string>( ( observer: Observer<string> ) => {
            this._characterBiddedObservers.push( observer );
        } );

        return obs;
    }

    public characterLeftRaid(): Observable<string> {
        let obs: Observable<string> = new Observable<string>( ( observer: Observer<string> ) => {
            this._characterLeftRaidObservers.push( observer );
        } );

        return obs;
    }

    public characterJoinedRaid(): Observable<string> {
        let obs: Observable<string> = new Observable<string>( ( observer: Observer<string> ) => {
            this._characterJoinedRaidObservers.push( observer );
        } );

        return obs;
    }

    public bidStarted(): Observable<string> {
        let obs: Observable<string> = new Observable<string>( ( observer: Observer<string> ) => {
            this._bidStartedObservers.push( observer );
        } );

        return obs;
    }

    public raidDumpDetected(): Observable<string> {
        let obs: Observable<string> = new Observable<string>( ( observer: Observer<string> ) => {
            this._raidDumpObservers.push( observer );
        } );

        return obs;
    }

    public tickReceived(): Observable<DataTickModel> {
        let obs: Observable<DataTickModel> = new Observable<DataTickModel>( ( observer: Observer<DataTickModel> ) => {
            this._tickObservers.push( observer );
        } );

        return obs;
    }

    public logFileChanged(): Observable<string> {
        let obs: Observable<string> = new Observable<string>( ( observer: Observer<string> ) => {
            this._logFileChangeObservers.push( observer );
        } );

        return obs;
    }

    public getAppVersion(): Observable<string> {
        let obs: Observable<string> = new Observable<string>( ( observer: Observer<string> ) => {
            
            this.ipc.once( 'app:version', ( e, v ) => {
                this.ngZone.run( () => {
                    observer.next( v.version );
                    observer.complete();
                } );
            } );
            this.ipc.send( 'app:version' );

        } );

        return obs;
    }

    public getAppIsDev(): Observable<boolean> {
        let obs: Observable<boolean> = new Observable<boolean>( ( observer: Observer<boolean> ) => {
            
            this.ipc.once( 'app:isDev', ( e, isDev ) => {
                this.ngZone.run( () => {
                    observer.next( isDev );
                    observer.complete();
                } );
            } );
            this.ipc.send( 'app:isDev' );

        } );

        return obs;
    }

    public consoleLogRequested(): Observable<any> {
        let obs: Observable<any> = new Observable<any>( ( observer: Observer<any> ) => {
            this._consoleLogRequestObservers.push( observer );
        } );

        return obs;
    }

    public closeThisChild(): void {
        this.ipc.send( 'window:child:close' );
    }

    public quitApp(): void {
        this.ipc.send( 'app:quit' );
    }

    public quitAndInstallUpdate(): void {
        this.ipc.send( 'app:restart', null );
    }

    public minimizeApp(): void {
        this.ipc.send( 'app:minimize' );
    }

    public showRaidModal(): Observable<string> {
        let obs: Observable<string> = new Observable<string>( ( observer: Observer<string> ) => {
            
            this.ipc.once( 'raid:dialog:new', ( e, hwnd: string ) => {
                this.ngZone.run( () => {
                    observer.next( hwnd );
                    observer.complete();
                } );
            } );
            this.ipc.send( 'raid:dialog:new' );

        } );

        return obs;
    }

    public updateLogFile( logFile: string ): void {
        this.ipc.send( 'log:select', logFile );
    }

    public getValue<T>( name: string ): Observable<T> {
        let obs: Observable<T> = new Observable<T>( ( observer: Observer<T> ) => {
            
            this.ipc.once( `db:get:${name}`, ( e, v: T ) => {
                this.ngZone.run( () => {
                    observer.next( v );
                    observer.complete();
                } );
            } );
            this.ipc.send( 'db:get:value', name );

        } );

        return obs;
    }

    public storeGuildRoster( value: GuildMember[] ): void {
        if ( value ) {
            this.storeValue( 'guildRoster', value );
        }
    }

    public storeRaids( value: Raid[] ): void {
        if ( value ) {
            this.storeValue( 'raidsDb', value );
        }
    }

    public storeMasterListDb( value: ListsDatabase ): void {
        if ( value ) {
            this.storeValue( 'masterListsDb', value );
        }
    }

    public storeValue( key: string, value: any ): void {
        console.log( 'storing', key, value );
        this.ipc.send( 'db:set', { name: key, value: value } );
    }

    public getGuildRoster(): Observable<GuildMember[]> {
        return this.getTable<GuildMember>( 'guildRoster' );
    }

    public getRaids(): Observable<Raid[]> {
        return this.getTable<Raid>( 'raidsDb' );
    }

    public storeIgnoredWarnings( ignoredWarnings: Record<string, boolean> ) {
        this.storeValue( 'ignoredWarnings', ignoredWarnings );
    }

    public getIgnoredWarnings(): Observable<Record<string, boolean>> {
        return this.getObject<Record<string, boolean>>( 'ignoredWarnings' );
    }

    private getTable<T>( key: string ): Observable<T[]> {
        let obs: Observable<T[]> = new Observable<T[]>( ( observer: Observer<T[]> ) => {
            
            this.ipc.once( `db:get:${key}`, ( e, results ) => {
                this.ngZone.run( () => {
                    observer.next( results );
                    observer.complete();
                } );
            } );
            this.ipc.send( `db:get:${key}`, key );

        } );

        return obs;
    }

    public getObject<T>( key: string ): Observable<T> {
        let obs: Observable<T> = new Observable<T>( ( observer: Observer<T> ) => {
            
            this.ipc.once( 'db:get:object', ( e, results ) => {
                this.ngZone.run( () => {
                    observer.next( results );
                    observer.complete();
                } );
            } );
            this.ipc.send( 'db:get:object', key );

        } );

        return obs;
    }

    /**
     * Returns the hydrated lists database.
     */
    public getMasterListsDb(): Observable<ListsDatabase> {
        let obs: Observable<ListsDatabase> = new Observable<ListsDatabase>( ( observer: Observer<ListsDatabase> ) => {
            
            this.ipc.once( 'db:get:object', ( e, results: ListsDatabase ) => {
                this.ngZone.run( () => {
                    let listsDb = new ListsDatabase();

                    listsDb.masterLists = _.map( results.masterLists, f => Object.assign( new MasterSuicideKingsList(), f ) );
                    
                    observer.next( listsDb );
                    observer.complete();
                } );
            } );
            this.ipc.send( 'db:get:object', 'masterListsDb' );

        } );

        return obs;
    }

    public sendTextToClipboard( value: string ): void {
        this.ipc.send( 'clipboard:writeText', value );
    }
    
    public getDatabaseBackup(): Observable<string> {
        let obs: Observable<string> = new Observable<string>( ( observer: Observer<string> ) => {
            
            this.ipc.once( 'db:get:backup', ( e, path: string ) => {
                this.ngZone.run( () => {
                    observer.next( path );
                    observer.complete();
                } );
            } );
            this.ipc.send( 'db:get:backup', null );

        } );

        return obs;
    }
    
    public exportData(): Observable<string> {
        let obs: Observable<string> = new Observable<string>( ( observer: Observer<string> ) => {
            
            this.ipc.once( 'db:get:export', ( e, path: string ) => {
                this.ngZone.run( () => {
                    observer.next( path );
                    observer.complete();
                } );
            } );
            this.ipc.send( 'db:get:export', null );

        } );

        return obs;
    }

    public restoreBackupFile(): Observable<boolean> {
        let obs: Observable<boolean> = new Observable<boolean>( ( observer: Observer<boolean> ) => {
            
            this.ipc.once( 'db:set:backup', ( e, restored: boolean ) => {
                this.ngZone.run( () => {
                    observer.next( restored );
                    observer.complete();
                } );
            } );
            this.ipc.send( 'db:set:backup' );

        } );

        return obs;
    }

    public importData(): Observable<boolean> {
        let obs: Observable<boolean> = new Observable<boolean>( ( observer: Observer<boolean> ) => {
            
            this.ipc.once( 'db:set:export', ( e, restored: boolean ) => {
                this.ngZone.run( () => {
                    observer.next( restored );
                    observer.complete();
                } );
            } );
            this.ipc.send( 'db:set:export' );

        } );

        return obs;
    }

}
