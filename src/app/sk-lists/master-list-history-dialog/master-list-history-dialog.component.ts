import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialog } from '@angular/material/dialog';
import * as _ from 'lodash-es';
import { IpcService } from '../../ipc.service';
import { ErrorIds, HistoryTypes, MasterSuicideKingsList, Suicide, SuicideKingsListHistory } from '../../core.model';
import { DialogService } from '../../dialogs/dialog.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ColoredString } from 'src/app/dialogs/dialog.model';

@Component( {
    selector: 'app-master-list-history-dialog',
    templateUrl: 'master-list-history-dialog.component.html',
    styleUrls: [ 'master-list-history-dialog.component.scss', '../../core.scss' ]
} )
export class MasterListHistoryDialogComponent implements OnInit {

    public suicides: Suicide[] = [];
    public searchTerm: string;
    public searchDate: Date = null;
    public raidDates: Date[] = [];
    public showJoinLeaveData: boolean = false;
    public showStartData: boolean = false;
    public get history(): SuicideKingsListHistory[] {
        let data = this.data?.history?.filter( f => f.historyType === HistoryTypes.Suicide || f.historyType === HistoryTypes.StartRaid || f.historyType === HistoryTypes.LeaveRaid || f.historyType === HistoryTypes.JoinRaid ) ?? [];

        if ( this.searchDate ) {
            data = data.filter( h => {
                let d = new Date( h.timestamp );
                return d.getFullYear() === this.searchDate.getFullYear() && d.getMonth() === this.searchDate.getMonth() && d.getDate() === this.searchDate.getDate();
            } );
        }

        if ( this.searchTerm ) {
            let s = this.searchTerm.toLowerCase();
            data = data.filter( h => {
                return ( h.historyType === HistoryTypes.Suicide && h.list[ h.suicideIndex ].name.toLowerCase().indexOf( s ) > -1 )
                    || ( h.characterName?.toLowerCase().indexOf( s ) > -1 );
            } );
        }

        if ( !this.showJoinLeaveData ) {
            data = data.filter( h => h.historyType === this.historyTypes.Suicide );
        }

        if ( !this.showStartData ) {
            _.remove( data, h => h.historyType === HistoryTypes.StartRaid );
        }

        

        return _.orderBy( data, f => new Date( f.timestamp ), [ 'desc' ] );
    }
    public historyTypes: typeof HistoryTypes = HistoryTypes;

    constructor(
        public dialogRef: MatDialogRef<MasterListHistoryDialogComponent>,
        @Inject( MAT_DIALOG_DATA ) public data: MasterSuicideKingsList,
        public dialog: MatDialog,
        private ipcService: IpcService,
        private dialogService: DialogService,
        private snackBar: MatSnackBar ) {
        
    }

    ngOnInit() {

        let dates = _.map( this.data.history, f => {
            let d = new Date( f.timestamp );

            return new Date( d.getFullYear(), d.getMonth(), d.getDate() );
        } );
        
        let uniqDates = _.uniqBy( dates, f => f.toISOString() );
        this.raidDates = _.orderBy( uniqDates, f => f, 'desc' );

    }










    /**
     * Returns a class name for the given item, used to style the character name in the history list.
     * 
     * @param item The item to evaluate.
     */
    public getHistoryItemCssClassName( item: SuicideKingsListHistory ): string {
        if ( item.historyType === HistoryTypes.JoinRaid || item.historyType === HistoryTypes.StartRaid ) {
            return 'color-green';
        } else if ( item.historyType === HistoryTypes.LeaveRaid || item.historyType === HistoryTypes.EndRaid ) {
            return 'color-red';
        }
    }











    /**
     * Shows the note associated with a history record.
     * 
     * @param history The history record.
     */
    showHistoryNote( history: SuicideKingsListHistory ) {
        let name = history.historyType === HistoryTypes.Suicide ? history.list[ history.suicideIndex ].name : history.characterName;
        this.ipcService.getGuildRoster().subscribe( roster => {
            if ( history.historyType === HistoryTypes.Suicide ) {
                let member = roster.find( f => f.name === name );
                let suicide = member.suicides.find( f => f.raidId === history.raidId && f.date === history.timestamp );
                if ( suicide && suicide.item ) {
                    this.dialogService.showNoteDialog( 'Suicide Note', suicide.item );
                } else {
                    this.dialogService.showInfoDialog( 'Suicide Note Missing', 'There was no description for this event.' );
                }
            } else {
                this.dialogService.showNoteDialog( 'History Note', history.description );
            }
        } );
    }
    










    /**
     * Allows the user to change who was suicided on the given suicide.
     * 
     * @param history The history record.
     */
     confirmSwapName( history: SuicideKingsListHistory ) {
        let name = history.list[ history.suicideIndex ].name;

        this.ipcService.getGuildRoster().subscribe( roster => {
            let member = roster.find( f => f.name === name );
            let suicide = member.suicides.find( f => f.raidId === history.raidId && f.date === history.timestamp );

            this.dialogService.showConfirmDialog(
                [
                    `Are you sure you want to exchange ${name}'s suicide on ${new Date( history.timestamp ).toLocaleString()} for another character?`,
                    `Description: ${suicide?.item ? suicide.item : 'n/a'}`,
                ],
                'Click "Yes" to choose a different character and recalculate positions.',
                'Click "No" to cancel this action and make no changes.',
                confirmed => {
                    if ( !!confirmed ) {
                        this.swapCharacterHistory( history );
                    } else {
                        console.log( 'avoiding action' );
                    }
                } );
        } );

    }











    /**
     * Allows the user to select a new character and swap historical events 
     * with the specified new character.
     * 
     * @param history The history record.
     */
     swapCharacterHistory( history: SuicideKingsListHistory ) {
        let name = history.list[ history.suicideIndex ].name;
        let options = _.map( history.list, f => f.name ).filter( f => f !== name );
        this.dialogService.showAutocompleteDialog(
            'Change List History', 
            [`Enter the name of the character that should have been suicided on ${new Date( history.timestamp ).toLocaleString()}`],
            options,
            'Character Name',
            'Enter the name of a character that was at the raid.'
        ).subscribe( selection => {
            if ( selection ) {
                if ( options.findIndex( f => f === selection ) > -1 ) {

                    this.ipcService.getMasterListsDb().subscribe( listsDb => {
                        let backup = _.cloneDeep( listsDb );

                        this.ipcService.getGuildRoster().subscribe( roster => {

                            try {
                                SuicideKingsListHistory.changeEventCharacter( listsDb.masterLists.find(f => f.listId === this.data.listId), history, selection, roster );
                        
                                this.ipcService.storeMasterListDb( listsDb );
                                this.ipcService.storeGuildRoster( roster );
    
                                this.data = listsDb.masterLists.find( f => f.listId === this.data.listId );
                                this.snackBar.open( `List updated!`, 'dismiss', { duration: 5000 } );

                            } catch ( e ) {
                            
                                // Let the user know that an error has occurred.
                                let msg = [ 'An error occurred while attempting to swap the event character.', 'No changes have been made to the list.' ];

                                if ( e instanceof Error ) {
                                    this.dialogService.showExceptionDialog( ErrorIds.swapSuicideCharacters, e, 'Error!', msg[ 0 ] );

                                } else if ( typeof e === 'string' ) {
                                    msg.push( e );
                                
                                    this.dialogService.showErrorDialog( 'Error!', msg );
                                }

                                // Restore any modifications from the event change.
                                listsDb = backup;
                                this.ipcService.storeMasterListDb( listsDb );

                            }

                        } );
                    } );

                } else {
                    this.dialogService.showErrorDialog( 'Invalid Data', [ 'Invalid selection.', 'Please enter the name of a character that attended the raid.' ] );
                }
            } else {
                this.snackBar.open( 'Operation cancelled!', 'dismiss', { duration: 5000 } );
            }
        } );
    }
    










    /**
     * Allows the user to rollback the given history record.
     * 
     * @param history The history record.
     */
     confirmRollback( history: SuicideKingsListHistory ) {
        let name = history.list[ history.suicideIndex ].name;
        this.ipcService.getGuildRoster().subscribe( roster => {
            let member = roster.find( f => f.name === name );
            let suicide = member.suicides.find( f => f.raidId === history.raidId && f.date === history.timestamp );

            this.dialogService.showConfirmDialog(
                [
                    `Are you sure you want to remove ${name}'s suicide on ${new Date( history.timestamp ).toLocaleString()}?`,
                    `Description: ${suicide?.item ? suicide.item : 'n/a'}`,
                    new ColoredString( 'WARNING! This action cannot be undone!', '#f06969', true )
                ],
                'Click "Yes" to remove this suicide from history and recalculate positions.',
                'Click "No" to cancel this action and make no changes.',
                confirmed => {
                    if ( !!confirmed ) {

                        this.ipcService.getMasterListsDb().subscribe( listsDb => {
                            let backup = _.cloneDeep( listsDb );
                            this.ipcService.getGuildRoster().subscribe( roster => {
                        
                                try {
                                    SuicideKingsListHistory.rollbackSuicide( listsDb.masterLists.find( f => f.listId === this.data.listId ), history, roster );
                                
                                    this.ipcService.storeMasterListDb( listsDb );
                                    this.ipcService.storeGuildRoster( roster );
        
                                    this.data = listsDb.masterLists.find( f => f.listId === this.data.listId );
                                    this.snackBar.open( `List updated!`, 'dismiss', { duration: 5000 } );
    
                                } catch ( e ) {
                                
                                    // Let the user know that an error has occurred.
                                    let msg = [ 'An error occurred while attempting to rollback the event.', 'No changes have been made to the list.' ];
    
                                    if ( e instanceof Error ) {
                                        this.dialogService.showExceptionDialog( ErrorIds.swapSuicideCharacters, e, 'Error!', msg[ 0 ] );
    
                                    } else if ( typeof e === 'string' ) {
                                        msg.push( e );
                                    
                                        this.dialogService.showErrorDialog( 'Error!', msg );
                                    }
    
                                    // Restore any modifications from the event change.
                                    listsDb = backup;
                                    this.ipcService.storeMasterListDb( listsDb );
                                }
                            
                            } );
                        } );

                    } else {
                        this.snackBar.open( `Rollback cancelled!`, 'dismiss', { duration: 5000 } );
                    }
                } );
        } );
    }
}
