import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { Character, ErrorIds, GuildMember, HistoryTypes, ListsDatabase, MasterSuicideKingsList, Raid, RaidAttendee, raidKeyMap, RaidMember, SelectOption, Suicide, SuicideKingsCharacter, SuicideKingsListHistory } from '../../core.model';
import { IpcService } from '../../ipc.service';
import { customAlphabet } from 'nanoid';
import { DialogService } from '../../dialogs/dialog.service';
import { NewSkListDialogComponent } from '../new-sk-list-dialog/new-sk-list-dialog.component';
const alphabet = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
const nanoid = customAlphabet( alphabet, 16 );
import * as _ from 'lodash-es';
import { MatDialog } from '@angular/material/dialog';
import { NewSkListModel } from '../new-sk-list-dialog/new-sk-list-dialog.model';
import { Observable } from 'rxjs';
import { CsvUtilities } from 'src/app/utilities/csv.utilities';
import { MatSnackBar } from '@angular/material/snack-bar';
import { NewCharacterDialogComponent } from '../new-character-dialog/new-character-dialog.component';
import { ImportListDialogComponent } from '../import-list-dialog/import-list-dialog.component';
import { CopyToDiscordDialogComponent } from '../copy-to-discord-dialog/copy-to-discord-dialog.component';
import { ColoredString } from 'src/app/dialogs/dialog.model';
import { MasterListHistoryDialogComponent } from '../master-list-history-dialog/master-list-history-dialog.component';

@Component( {
    selector: 'app-sk-lists',
    templateUrl: 'sk-lists.component.html',
    styleUrls: [ 'sk-lists.component.scss', '../../core.scss' ],
} )
export class SkListsComponent implements OnInit {

    // public masterList: MasterSuicideKingsList;
    public masterHistoryPreview: SuicideKingsListHistory[];
    private _masterList: MasterSuicideKingsList;
    public get masterList(): MasterSuicideKingsList {
        return this._masterList;
    }
    public set masterList( value: MasterSuicideKingsList ) {
        this._masterList = value;
        this.masterHistoryPreview = [];
        if ( value?.history?.length > 0 ) {
            let recentHistory = _.orderBy( value.history, f => f.timestamp, 'desc' );
            let max = value.history.length > value.list.length ? value.list.length : value.history.length;
            for ( let i = 0; i < max; i++ ) {
                if ( recentHistory[ i ].historyType === HistoryTypes.Suicide ) {
                    this.masterHistoryPreview.push( recentHistory[ i ] );
                }
            }
        }
    }
    public compareSelectOption = SelectOption.compare;
    public masterListOptions: SelectOption[] = [];
    public selectedListId: string;
    // public raid: Raid;
    public sortByAlpha: boolean = false;

    // private raidsDb: Raid[];
    private listsDb: ListsDatabase;

    public get theList(): SuicideKingsCharacter[] {
        if ( this.sortByAlpha ) {
            return _.sortBy( this.masterList.list, f => f.name );
        } else {
            return this.masterList.list;
        }
    }


    @ViewChild( 'fileSelector' ) private fileSelector: ElementRef<HTMLInputElement>;

    constructor( private ipcService: IpcService, private dialogService: DialogService, private dialog: MatDialog, private snackBar: MatSnackBar ) { }

    ngOnInit() {
        this.loadData();

        this.ipcService.masterListsUpdated().subscribe( master => {
            if ( master ) {
                
                this.listsDb = master;
                if ( this.selectedListId ) {
                    this.masterList = this.listsDb.masterLists.find( f => f.listId === this.selectedListId );
                }
                
                this.populateListOptions();
            }
        } );
    }










    /**
     * Updates the list after the user changes the dropdown.
     */
    onChangeList() {
        this.masterList = this.listsDb.masterLists.find( f => f.listId === this.selectedListId );
        // if ( this.raidsDb ) {
        //     this.selectActiveRaid();
        // }
    }










    /**
     * Selects the first active raid for the currently selected master list.
     */
    private selectActiveRaid() {
        // this.raid = null;
        // this.raidsDb.forEach( raid => {
        //     if ( !this.raid && raid.masterListId === this.selectedListId && !raid.completed ) {

        //         if ( raid.list?.length === 0 ) {
        //             // Remove empty raids.
        //             let i = this.raidsDb.findIndex( f => f.raidId === raid.raidId );
        //             this.raidsDb.splice( i, 1 );
        //             this.ipcService.storeRaids( this.raidsDb );

        //         } else {
        //             // Otherwise automatically open this raid.
        //             this.loadRaid( raid );

        //         }

        //     }
        // } );
    }










    /**
     * Reloads the raids and sk lists.
     */
    reload() {
        let listId = this.masterList?.listId;
        // let raidId = this.raid?.raidId;

        this.loadData( () => {
            if ( listId && this.masterList?.listId !== listId ) {
                let i = this.listsDb.masterLists.findIndex( f => f.listId === listId );
                this.masterList = this.listsDb.masterLists[ i ];
                this.selectedListId = listId;
            }

            // if ( raidId && this.raid?.raidId !== raidId ) {
            //     let i = this.raidsDb.findIndex( f => f.raidId === raidId );
            //     this.raid = this.raidsDb[ i ];
            // }

        } );

    }










    /**
     * Loads the raids and and sk lists.
     * 
     * @param onCompleted Executed after the data is loaded.
     */
    loadData( onCompleted?: () => void ) {

        this.ipcService.getRaids().subscribe( raids => {
            let activeRaid = raids.find( f => !f.completed );
            if ( activeRaid ) {
                // the raid window will automatically load any active raids.
                this.beginNewRaid();
            }
        } );
        this.ipcService
            .getMasterListsDb()
            .subscribe( master => {
                if ( master ) {
                    this.listsDb = master;
                    this.masterList = this.listsDb?.masterLists == null || this.listsDb?.masterLists.length === 0 ? null : this.listsDb?.masterLists[ 0 ];
                    this.selectedListId = this.masterList?.listId;
                    
                    // if ( this.selectedListId && this.raidsDb ) {
                    //     this.selectActiveRaid();
                    // }

                } else {
                    // this will effectively initialize a new lists db.
                    this.listsDb = new ListsDatabase();
                    this.ipcService.storeMasterListDb( this.listsDb );
                }

                this.populateListOptions();

                if ( onCompleted ) {
                    onCompleted();
                }
            } );

    }










    /**
     * Opens the new list dialog.
     */
    newList() {

        this.showNewMasterSkListDialog().subscribe( list => {
            if ( list ) {
                let masterList = new MasterSuicideKingsList();

                masterList.name = list.name;
                masterList.listId = nanoid();
                list.members.forEach( f => {
                    let listMember = new SuicideKingsCharacter();

                    listMember.name = f.name;
                    listMember.initialSeed = f.initialSeed;
                    listMember.class = f.class;
                    listMember.level = f.level;

                    masterList.list.push( listMember );
                } );

                // ensure the list is sorted by the seed values of each character.
                masterList.list = _.orderBy( masterList.list, f => f.initialSeed, 'desc' );

                // add the new list to the db.
                this.listsDb.masterLists.push( masterList );

                // save the lists db.
                this.ipcService.storeMasterListDb( this.listsDb );

                // change the context to the current list.
                this.populateListOptions();
                this.selectedListId = masterList.listId;
                this.masterList = masterList;
            }
        } );

    }










    /**
     * Populates the Suicide Kings List dropdown.
     */
    populateListOptions() {

        this.masterListOptions = _.map( this.listsDb?.masterLists, f => {
            let option = new SelectOption();
            option.id = f.listId;
            option.label = f.name;
            return option;
        } );

    }










    /**
     * After confirmation, removes the specified member from the current list.
     * 
     * @param name The name of the member to remove.
     */
    removeFromMasterList( name: string ) {
        let index = this.masterList.list.findIndex( f => f.name === name );

        if ( !this.masterList.list[ index ].inRaid ) {
            this.dialogService.showConfirmDialog(
                [ `Are you sure you want to remove ${this.masterList.list[ index ].name}?`, 'This action cannot be undone.', ],
                `Click 'Yes' to remove this character from the master list.`, `Click 'No' to cancel.`,
                confirmed => {
                    if ( confirmed ) {
                        this.masterList.list.splice( index, 1 );

                        // save the lists db.
                        this.ipcService.storeMasterListDb( this.listsDb );
                    }
                } );
        } else {
            this.dialogService.showErrorDialog( 'Error', 'You cannot remove members that are in active raids.' );
        }
    }










    /**
     * If there are guild members not in this list, then opens a checkbox 
     * dialog to selec those members to add.  Otherwise, opens an input dialog 
     * for new members.
     */
    showAddNewCharacter() {
        this.ipcService.getGuildRoster().subscribe( roster => {
            let missingMembers: GuildMember[] = [];
            roster.forEach( member => {
                let i = this.masterList.list.findIndex( f => f.name === member.name );
                if ( i < 0 ) {
                    missingMembers.push( member );
                }
            } );

            if ( missingMembers.length > 0 ) {
                this.showAddNewCharacterCheckboxList( missingMembers );
            } else {
                this.showAddNewCharacterInput();
            }
        } );
    }










    /**
     * Shows a dialog box that will allow the user to add members via a 
     * checkbox list.
     * 
     * @param missingMembers The guild members not in the current list.
     */
    showAddNewCharacterCheckboxList( missingMembers: GuildMember[] ) {
        let options: Character[] = [];
        missingMembers.forEach( member => {
            let option = new Character();
            
            option.name = member.name;
            option.selected = false;
            option.class = member.class;
            option.level = member.level;

            options.push( option );
        } );
        
        this.dialogService.showCheckboxListDialog(
            'Select from existing members',
            [
                'There are guild members that are not in this list.',
                'If you would like to add guild member(s) check the box next to their name.',
                'If the person you are looking for is not in this list, click on the enter name manually button' ],
            options, 'Add Selected Members', 'Cancel', 'Enter Name Manually' )
            .subscribe( options => {
                if ( options === undefined ) {
                    this.showAddNewCharacterInput();
                } else if ( options !== null ) {
                    options.forEach( option => {
                        if ( option.selected ) {
                            let newChr = new SuicideKingsCharacter();
                            
                            newChr.name = option.name;
                            newChr.class = option.class;
                            newChr.level = option.level;

                            this.addCharacter( newChr );
                        }
                    } );

                    // save the lists db.
                    this.ipcService.storeMasterListDb( this.listsDb );
                }
            } );
    }










    /**
     * Shows an input dialog to allow adding unguilded or non-existent 
     * characters.
     */
    showAddNewCharacterInput() {

        
        return this.dialog.open<NewCharacterDialogComponent, any, SuicideKingsCharacter>( NewCharacterDialogComponent, {
            width: '650px',
            // data: data,
            panelClass: 'app-dialog',
        } ).afterClosed().subscribe( newCharacter => {

            if ( newCharacter?.name ) {
                
                this.addCharacter( newCharacter );

                // save the lists db.
                this.ipcService.storeMasterListDb( this.listsDb );
            }

        } );

    }










    /**
     * Adds the given name to the current list.
     * 
     * @description This method does not save changes.
     * 
     * @param character The new character to add.
     */
    addCharacter( character: SuicideKingsCharacter ) {
        let i = this.masterList.list.findIndex( f => f.name === character.name );

        if ( i === -1 ) {
            this.masterList.list.push( character );
        }
    }










    /**
     * Selects the given character if the character is not in a raid.
     * 
     * @param character The character to select.
     */
    selectCharacter( character: SuicideKingsCharacter ) {
        if ( !character.inRaid ) {
            character.selected = !character.selected;
        }
    }










    /**
     * Loads the given raid to the view.
     * 
     * @param raid The raid to load.
     */
    loadRaid( raid: Raid ) {
        // this.masterList.list.forEach( f => {
        //     let i = raid.list.findIndex( raider => raider.name === f.name );
        //     f.inRaid = i > -1;
        // } );

        // this.raid = raid;
    }










    /**
     * Generates the discord string to display the current list and sends that 
     * string to the clipboard.
     */
    copyToDiscord() {
        let table = CsvUtilities.listToDiscord( this.masterList, false );
        table += CsvUtilities.listToDiscord( this.masterList, true );

        this.ipcService.sendTextToClipboard( table );
        this.snackBar.open( 'Copied!', 'dismiss', { duration: 5000 } );
    }










    /**
     * Opens the new master list dialog.
     * 
     * @returns Returns details about the new list.
     */
    public showNewMasterSkListDialog(): Observable<NewSkListModel> {
        return this.dialog.open<NewSkListDialogComponent, any, NewSkListModel>( NewSkListDialogComponent, {
            width: '650px',
            // data: data,
            panelClass: 'app-dialog',
        } ).afterClosed();
    }










    /**
     * Allows the user to update a master list by importing from the output generated 
     * with the Copy to Discord function.
     */
    public importList() {
        this.showImportListDialog().subscribe( list => {
            if ( list instanceof Array ) {
                this.masterList.list = list;
                this.ipcService.storeMasterListDb( this.listsDb );
            }
        } );
    }










    /**
     * Opens the new master list dialog.
     * 
     * @returns Returns details about the new list.
     */
    public showImportListDialog(): Observable<SuicideKingsCharacter[]> {
        return this.dialog.open<ImportListDialogComponent, any, SuicideKingsCharacter[]>( ImportListDialogComponent, {
            width: '650px',
            // data: data,
            panelClass: 'app-dialog',
        } ).afterClosed();
    }
    









    /**
     * Opens the copy to discord dialog.
     */
    public showCopyToDiscordDialog() {
        if ( this.listsDb?.masterLists?.length > 0 ) {
            if ( this.listsDb.masterLists.length > 1 || this.listsDb.masterLists[0].list?.length > 50) {
                this.dialog.open<CopyToDiscordDialogComponent, any, SuicideKingsCharacter[]>( CopyToDiscordDialogComponent, {
                    width: '650px',
                    // data: data,
                    panelClass: 'app-dialog',
                } ).afterClosed();
            } else {
                this.copyToDiscord();
            }
        }
    }










    /**
     * Opens the raid window.
     */
    beginNewRaid() {
        this.ipcService.showRaidModal().subscribe( hwnd => { } );
    }










    /**
     * Shows the note associated with a history record.
     * 
     * @param history The history record.
     */
    showHistoryNote( history: SuicideKingsListHistory ) {
        let name = history.list[ history.suicideIndex ].name;
        this.ipcService.getGuildRoster().subscribe( roster => {
            let member = roster.find( f => f.name === name );
            let suicide = member.suicides.find( f => f.raidId === history.raidId && f.date === history.timestamp );
            if ( suicide && suicide.item ) {
                this.dialogService.showNoteDialog( 'Suicide Note', suicide.item );
            } else {
                this.dialogService.showInfoDialog( 'Suicide Note Missing', 'There was no description for this event.' );
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
                        this.ipcService.getGuildRoster().subscribe( roster => {
                        
                            let backup = _.cloneDeep( this.masterList );
    
                            try {
                                SuicideKingsListHistory.rollbackSuicide( this.masterList, history, roster );
                                
                                this.ipcService.storeMasterListDb( this.listsDb );
                                this.ipcService.storeGuildRoster( roster );
        
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
                                this.masterList = backup;
                            }
                            
                            
                        } );
                    } else {
                        this.snackBar.open( `Rollback cancelled!`, 'dismiss', { duration: 5000 } );
                    }
                } );
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
     * Opens a modal to  allow the user to select which user to replace with 
     * the given name.
     * 
     * @param name The name of the character to replace.
     */
    confirmPositionSwap( name: string ) {
        this.dialogService
            .showSelectGuildMemberDialog(
                'Select Replacement Guild Member',
                name,
                'Guild Member',
                `Select the name of the guild member to replace with ${name}.` )
            .subscribe( replacor => {
                if ( replacor ) {
                    this.dialogService.showConfirmDialog(
                        [
                            `Are you sure you want to exchange ${name}'s position on the current list for ${replacor}?`,
                            `This is not a swap and ${name} will be removed from the list and ${replacor} will be inserted into their old position.`
                        ],
                        'Click "Yes" to change positions.',
                        'Click "No" to cancel this action and make no changes.',
                        confirmed => {
                            if ( !!confirmed ) {
                                this.swapCharacters( name, replacor );
                            } else {
                                this.snackBar.open( 'Replacement action cancelled', 'Dismiss', { duration: 5000 } );
                            }
                        } );
                } else {
                    this.snackBar.open( 'Replacement action cancelled', 'Dismiss', { duration: 5000 } );
                }
            } );
    }










    /**
     * Replaces a character in the list with a new character.
     * 
     * @param replacee The character to replace.
     * @param replacor The new main character.
     */
    swapCharacters( replacee: string, replacor: string ) {
        this.ipcService.getGuildRoster().subscribe( roster => {
            let listIndex = this.masterList.list.findIndex( f => f.name === replacee );
            let guildIndex = roster.findIndex( f => f.name === replacor );
            
            this.masterList.list[ listIndex ].class = roster[ guildIndex ].class;
            this.masterList.list[ listIndex ].level = roster[ guildIndex ].level;
            this.masterList.list[ listIndex ].name = roster[ guildIndex ].name;
            this.masterList.list[ listIndex ].selected = roster[ guildIndex ].selected;

            let x = _.findLastIndex( this.masterList.history, f => f.historyType !== HistoryTypes.MainChange );
            let replaceeRecord = this.masterList.history[ x ].list.find( f => f.name === replacee );
            if ( replaceeRecord != null ) {
                replaceeRecord.previousName = replacee;
            }
            
            // Insert the main change history record.
            let history = new SuicideKingsListHistory();
            history.raidId = null;
            history.timestamp = ( new Date() ).toISOString();
            history.suicideIndex = listIndex;
            history.activeIndices = [];
            history.list = [];
            history.oldMain = replacee;
            history.newMain = replacor;
            history.historyType = HistoryTypes.MainChange;

            this.masterList.history = this.masterList.history ? this.masterList.history : [];
            this.masterList.history.push( history );

            this.ipcService.storeMasterListDb( this.listsDb );
            this.snackBar.open( 'Master list updated!', 'Dismiss', { duration: 5000 } );
            
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
                    this.ipcService.getGuildRoster().subscribe( roster => {
                        
                        let backup = _.cloneDeep( this.masterList );

                        try {
                            SuicideKingsListHistory.changeEventCharacter( this.masterList, history, selection, roster );
                        
                            this.ipcService.storeMasterListDb( this.listsDb );
                            this.ipcService.storeGuildRoster( roster );
    
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
                            this.masterList = backup;
                        }

                    } );
                } else {
                    this.dialogService.showErrorDialog( 'Invalid Data', [ 'Invalid selection.', 'Please enter the name of a character that attended the raid.' ] );
                }
            } else {
                this.snackBar.open( 'Operation cancelled!', 'dismiss', { duration: 5000 } );
            }
        } );
    }

    openMasterHistory() {
        this.dialog.open( MasterListHistoryDialogComponent, {
            width: '750px',
            data: this.masterList,
            panelClass: 'app-dialog',
        } ).afterClosed().subscribe();
    }

}
