import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { Raid, SelectOption } from '../core.model';
import { IpcService } from '../ipc.service';
import * as _ from 'lodash-es';
import { DialogService } from '../dialogs/dialog.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ColoredString } from '../dialogs/dialog.model';

@Component({
    selector: 'app-settings',
    templateUrl: 'settings.component.html', 
    styleUrls: [ 'settings.component.scss', '../core.scss' ],
})

export class SettingsComponent implements OnInit {
    
    public version: string;
    public masterListOptions: SelectOption[] = [];
    public activeRaids: Raid[] = [];
    public logFilePath: string = null;
    public youCharacterName: string = null;
    public bidSymbol: string = null;
    public bidTakers: string = null;
    public raidTrackingCount: number = null;
    public enableSuicideGroups: boolean = false;
    public singleListBidAccept: boolean = false;

    @ViewChild( 'logFileSelector' ) private logFileSelector: ElementRef<HTMLInputElement>;
    
    constructor( private ipcService: IpcService,  private dialogService: DialogService, private snackBar: MatSnackBar ) { }

    ngOnInit() {
        this.loadData();
    }

    loadData() {
        this.ipcService.getAppVersion().subscribe( version => this.version = version );
        this.ipcService
            .getMasterListsDb()
            .subscribe( master => {
                
                if ( master ) {
                    
                    this.masterListOptions = _.map( master.masterLists, f => {
                        let option = new SelectOption();
                        option.id = f.listId;
                        option.label = f.name;
                        return option;
                    } );

                } else {
                    this.masterListOptions = [];

                }

            } );
        this.ipcService
            .getRaids()
            .subscribe( raids => {
                this.activeRaids = [];
                raids.forEach( raid => {
                    if ( !raid.completed ) {
                        this.activeRaids.push( raid );
                    }
                } );
            } );
        this.ipcService.getValue<string>( 'logFilePath' ).subscribe( logFile => this.logFilePath = logFile );
        this.ipcService.getValue<string>( 'youCharacterName' ).subscribe( name => this.youCharacterName = name );
        this.ipcService.getValue<string>( 'bidSymbol' ).subscribe( chr => {
            if ( chr ) {
                this.bidSymbol = chr;
            } else {
                this.bidSymbol = 'X';
                this.ipcService.storeValue( 'bidSymbol', 'X' );
                this.snackBar.open( 'The bidding symbol has been defaulted to the character "X"!', 'dismiss', { duration: 5000 } );
            }
        } );
        this.ipcService.getValue<string[]>( 'bidTakers' ).subscribe( bidTakers => {
            if ( bidTakers?.length > 0 ) {
                this.bidTakers = bidTakers.join( '\r\n' );
            }
        } );
        this.ipcService.getValue<number>( 'raidTrackingCount' ).subscribe( raidTrackingCount => this.raidTrackingCount = raidTrackingCount );
        this.ipcService.getValue<boolean>( 'useSuicideGroups' ).subscribe( useSuicideGroups => this.enableSuicideGroups = useSuicideGroups );
        this.ipcService.getValue<boolean>( 'singleListBidAccept' ).subscribe( singleListBidAccept => this.singleListBidAccept = singleListBidAccept );
    }

    reload() {
        this.loadData();
    }

    getBackupFile() {
        this.ipcService.getDatabaseBackup().subscribe( path => {
            this.snackBar.open( `${path} saved.`, 'dismiss', { duration: 5000 } );
        } );
    }

    exportDataFile() {
        this.ipcService.exportData().subscribe( path => {
            this.snackBar.open( `${path} saved.`, 'dismiss', { duration: 5000 } );
        } );
    }

    saveBidSymbol() {
        
        if ( this.bidSymbol === null || this.bidSymbol === undefined || this.bidSymbol.trim().length === 0 ) {
            this.bidSymbol = 'X';
        } else if ( this.bidSymbol.length > 1 ) {
            this.bidSymbol = this.bidSymbol.substr( 0, 1 );
        }

        this.ipcService.storeValue( 'bidSymbol', this.bidSymbol );
        this.snackBar.open( `The suicide symbol has been saved! [${this.bidSymbol}]`, 'dismiss', { duration: 5000 } );
    }

    saveRaidTrackingCount() {
        this.ipcService.storeValue( 'raidTrackingCount', this.raidTrackingCount );
        this.snackBar.open( `History tracking will display raid attendance for the past ${this.raidTrackingCount} raids!`, 'dismiss', { duration: 5000 } );
    }

    saveSkVariantRules() {
        this.ipcService.storeValue( 'useSuicideGroups', this.enableSuicideGroups );
        this.snackBar.open( 'Variant rules updated!', 'dismiss', { duration: 5000 } );
    }

    saveListOptions() {
        this.ipcService.storeValue( 'singleListBidAccept', this.singleListBidAccept );
        this.snackBar.open( 'List options updated!', 'dismiss', { duration: 5000 } );
    }

    showSuicideGroupsHelp() {
        this.dialogService.showInfoDialog( 'Suicide Groups', ['When enabled, a character is added to a suicide group when they are suicided.', 'Suicide groups are executed as a group, where each member in the list will maintain their relative positions to other members of the same list, when their suicides are executed.'] );
    }

    saveBidTakers() {
        if ( this.bidTakers ) {
            let takers = this.bidTakers
                // Removes trailing new-line characters of any type.
                .replace( /[\r\n|\n|\r]*$/gi, '' )
                // Removes preceding new-line characters of any type.
                .replace( /^[\r\n|\n|\r]*/gi, '' )
                // Ensures there are only one name per line by removing all double (or more) new-line characters.
                .replace(/[\r\n|\n|\r]+/gi, '\r\n')
                // Splits the remained by new line characters.
                .split( /\r\n|\n|\r/gi )
                // Trims the whitespace around each element in the array.
                .map( t => t.trim() );
            
            this.ipcService.storeValue( 'bidTakers', takers );
            this.bidTakers = takers.join( '\r\n' );
            
            this.snackBar.open( `The master loots list has been updated! [${takers.join( ', ' )}]`, 'dismiss', { duration: 5000 } );
        }
    }

    saveYouCharacterName() {
        this.ipcService.storeValue( 'youCharacterName', this.youCharacterName );
        this.snackBar.open( 'Character name updated!', 'dismiss', { duration: 5000 } );
    }

    restoreBackupFile() {
        this.ipcService
            .restoreBackupFile()
            .subscribe( restored => {
                if ( restored ) {
                    this.reload();
                    this.snackBar.open( 'Database restored!', 'dismiss', { duration: 5000 } );
                }
            } );
    }

    importDataFile() {
        this.ipcService
            .importData()
            .subscribe( restored => {
                if ( restored ) {
                    this.reload();
                    this.snackBar.open( 'Data imported!', 'dismiss', { duration: 5000 } );
                }
            } );
    }

    selectLogFile() {
        this.logFileSelector.nativeElement.click();
    }

    logFileSelected( e: Event ) {
        let input = e.target as HTMLInputElement;

        this.ipcService.storeValue( 'logFilePath', input.files[ 0 ].path );

        this.snackBar.open( 'Log file updated!', 'dismiss', { duration: 5000 } );
        this.reload();

        this.logFileSelector.nativeElement.value = null;
    }

    /**
     * Deletes the specified SK list, after confirmation and validation.
     * 
     * @param index The index of the desired list to delete.
     */
    deleteSkList( index: number ) {

        if ( this.activeRaids?.length > 0 ) {
            this.dialogService.showErrorDialog( 'Error', [ `${this.masterListOptions[ index ].label} has an active raid.`, 'Lists with active raids cannot be deleted.' ] );

        } else {
        
            this.dialogService.showConfirmDialog(
                [`Are you sure you want to delete the suicide kings list [${this.masterListOptions[ index ].label}?]`, new ColoredString('This action is permanent and cannot be undone!', '#f44336', true)],
                `Click "Yes" to delete [${this.masterListOptions[ index ].label}].`,
                `Click "No" to close this dialog without deleting [${this.masterListOptions[ index ].label}].`,
                confirmed => {
                    if ( confirmed === true ) {
                        this.ipcService.getMasterListsDb().subscribe( master => {

                            let di = master.masterLists.findIndex( list => list.listId === this.masterListOptions[ index ].id );
                            if ( di > -1 ) {

                                master.masterLists.splice( di, 1 );

                                this.ipcService.storeMasterListDb( master );
    
                                this.snackBar.open( 'List deleted', 'dismiss', { duration: 5000 } );
                                this.reload();

                            } else {
                                this.dialogService.showErrorDialog(
                                    'List not found',
                                    [
                                        `Could not find list id ${this.masterListOptions[ index ].id}, no action was taken.`,
                                        'This may be because the list has already been deleted.' ] );
                            }
                        } );
                    }
                } );
            
        }
    }
}