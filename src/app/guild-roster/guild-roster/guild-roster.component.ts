import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { GuildMember, guildMemberKeyMap, ListsDatabase, MasterSuicideKingsList, Raid } from '../../core.model';
import { IpcService } from '../../ipc.service';
import { CsvUtilities } from '../../utilities/csv.utilities';
import * as _ from 'lodash-es';
import { MathUtilities } from '../../utilities/math.utilities';
import { DialogService } from '../../dialogs/dialog.service';
import { MatDialog } from '@angular/material/dialog';
import { MemberSuicideHistoryDialogComponent } from '../member-suidice-history-dialog/member-suidice-history-dialog.component';
import { ColoredString } from 'src/app/dialogs/dialog.model';

interface IBasicMemberData {
    name: string;
    notes: string;
}

@Component( {
    selector: 'app-guild-roster',
    templateUrl: 'guild-roster.component.html',
    styleUrls: [ 'guild-roster.component.scss', '../../core.scss' ],
} )
export class GuildRosterComponent implements OnInit {

    public searchTerm: string;
    public roster: GuildMember[] = [];
    public activeRaids: Raid[] = [];

    private _rosterHash: string;

    public get hasChanges(): boolean {
        return this._rosterHash != MathUtilities.computeHash( JSON.stringify( this.roster ) );
    }

    public get hasMissingMembers(): boolean {
        for ( let i = 0; i < this.roster?.length; i++ ) {
            if ( this.roster[ i ].missingFromDump ) {
                return true;
            }
        }

        return false;
    }

    public get filteredRoster(): GuildMember[] {
        return _.filter( this.roster, ( f: GuildMember ) => !f.placeholder && ( this.searchTerm == null || f.name?.toLowerCase().indexOf( this.searchTerm.toLowerCase() ) > -1 ) );
    }

    @ViewChild( 'fileSelector' ) private fileSelector: ElementRef<HTMLInputElement>;

    constructor( private ipcService: IpcService, private dialogService: DialogService, private dialog: MatDialog ) { }

    ngOnInit() {
        this.loadData();
    }









    
    /**
     * Populates the data on the screen.
     */
    loadData() {
        this.ipcService
            .getGuildRoster()
            .subscribe( roster => {
                this.roster = roster;
                this._rosterHash = MathUtilities.computeHash( JSON.stringify( this.roster ) );
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
        
    }










    /**
     * Repopulates the data on the screen.
     */
    reload() {
        this.loadData();
    }









    
    /**
     * Opens the file selector dialog.
     */
    openFileSelect() {
        if ( this.activeRaids?.length > 0 ) {
            this.dialogService.showErrorDialog( 'Error', [ 'Cannot modify the guild roster while there is an active raid.', 'End all active raids before performing this action.' ] );

        } else {
            this.fileSelector.nativeElement.click();
        }
    }









    
    /**
     * Parses the selected file as a guild dump.
     * 
     * @param e The file input event args.
     */
    fileSelected( e: Event ) {
        let input = e.target as HTMLInputElement;
        this.parseGuildDump( input.files[ 0 ] );
        this.fileSelector.nativeElement.value = null;
    }

    showMemberNote( note: string ) {
        this.dialogService.showNoteDialog( 'Member Note', note );
    }









    
    /**
     * Parses the given guild dump file and adds new members to the roster and 
     * marks missing members from the dump.
     * 
     * @param file The guild dump file.
     */
    parseGuildDump( file: File ) {
        let fileReader = new FileReader();
        fileReader.onload = () => {
            let csv = CsvUtilities.parseCsvData( fileReader.result as string );
            let members: GuildMember[] = [];
    
            csv.forEach( raider => {
                let member = new GuildMember();
    
                member.name = raider[ guildMemberKeyMap.name ];
    
                if ( member.name ) {

                    member.level = +raider[ guildMemberKeyMap.level ];
                    member.class = raider[ guildMemberKeyMap.class ];
                    member.rank = raider[ guildMemberKeyMap.rank ];
                    member.alt = raider[ guildMemberKeyMap.alt ] === 'A';
                    member.lastOnline = raider[ guildMemberKeyMap.lastOnline ];
                    member.zone = raider[ guildMemberKeyMap.zone ];
                    member.notes = raider[ guildMemberKeyMap.notes ];
    
                    members.push( member );
                }
    
            } );
            
            // update or add to the existing roster.
            members.forEach( member => {
                let i = this.roster.findIndex( f => f.name === member.name );
                
                if ( i > -1 ) {
                    this.roster[ i ].rank = member.rank;
                    this.roster[ i ].alt = member.alt;
                    this.roster[ i ].lastOnline = member.lastOnline;
                    this.roster[ i ].zone = member.zone;
                    this.roster[ i ].notes = member.notes;
                    this.roster[ i ].level = member.level;
                    this.roster[ i ].class = member.class;
                    this.roster[ i ].placeholder = false;
                } else {
                    this.roster.push( member );
                }
            } );
            
            // note any missing members.
            this.roster.forEach( member => {
                if ( members.findIndex( f => f.name === member.name ) === -1 && !member.placeholder ) {
                    member.missingFromDump = true;
                }
            } );

            this.roster = _.sortBy( this.roster, f => f.name );

        };
        fileReader.readAsText( file );
    }









    
    /**
     * Removes all members flagged as missing, and asks the user to remove them 
     * from all lists.
     */
    deleteMissingMembers() {
        if ( this.activeRaids?.length > 0 ) {
            this.dialogService.showErrorDialog( 'Error', [ 'Cannot modify the guild roster while there is an active raid.', 'End all active raids before performing this action.' ] );

        } else {
            // let _roster: GuildMember[] = [];
            let _missing: GuildMember[] = [];

            this.roster.forEach( member => {
                if ( !member.missingFromDump ) {
                    // _roster.push( member );
                } else {
                    _missing.push( member );
                    member.placeholder = true;
                    member.missingFromDump = false;
                }
            } );

            // this.roster = _.sortBy( _roster, f => f.name );
            this.saveRoster();

            if ( _missing.length > 0 ) {
                this.removeMembersFromLists( _missing );
            }
        }
    }









    
    /**
     * Updates all changes to the roster and recalculates the change hash.
     */
    saveRoster() {

        if ( this.activeRaids?.length > 0 ) {
            this.dialogService.showErrorDialog( 'Error', [ 'Cannot modify the guild roster while there is an active raid.', 'End all active raids before performing this action.' ] );

        } else {
            this.ipcService.storeGuildRoster( this.roster );
            this._rosterHash = MathUtilities.computeHash( JSON.stringify( this.roster ) );

            // Update the level and class for all master lists.
            this.ipcService
                .getMasterListsDb()
                .subscribe( master => {

                    master.masterLists.forEach( list => {
                        list.list.forEach( skMember => {
                            let i = this.roster.findIndex( f => f.name === skMember.name );
                            if ( i > -1 ) {
                                skMember.level = this.roster[ i ].level;
                                skMember.class = this.roster[ i ].class;
                            }
                        } );
                    } );

                    this.ipcService.storeMasterListDb( master );

                } );
        }
        
    }









    
    /**
     * When confirmed, removes the specified guild member from the guild and, 
     * if the member exists in any lists, ask the user to remove them from 
     * those lists.
     * 
     * @param index The index of the desired guild member.
     */
    deleteGuildMember( member: GuildMember ) {
        
        if ( this.activeRaids?.length > 0 ) {
            this.dialogService.showErrorDialog( 'Error', [ 'Cannot modify the guild roster while there is an active raid.', 'End all active raids before performing this action.' ] );

        } else {
            let index = this.roster.findIndex( f => f.name === member.name );
            this.dialogService.showConfirmDialog(
                `Are you sure you want to delete ${this.roster[ index ].name}?`,
                `Click "Yes" to delete this guild ${this.roster[ index ].alt ? 'alt' : 'member'}.`,
                `Click "No" to close this dialog without deleting this guild ${this.roster[ index ].alt ? 'alt' : 'member'}.`,
                confirmed => {
                    if ( confirmed === true ) {
                        let member = this.roster[ index ];
                        member.placeholder = true;
                        let skLists: MasterSuicideKingsList[] = [];
                        
                        this.saveRoster();

                        this.ipcService.getMasterListsDb().subscribe( masterListsDb => {
                            masterListsDb.masterLists.forEach( skList => {
                                if ( _.some( skList.list, f => f.name === member.name ) ) {
                                    skLists.push( skList );
                                }
                            } );

                            if ( skLists.length > 0 ) {
                                this.removeMemberFromLists( member, skLists );
                            }
                        } );
                    }
                } );
        }
        
    }









    
    /**
     * After confirmation, immediatelly removes all given members from all 
     * lists.
     * 
     * @param members The members to remove from all lists.
     */
    removeMembersFromLists( members: GuildMember[] ) {

        if ( this.activeRaids?.length > 0 ) {
            this.dialogService.showErrorDialog( 'Error', [ 'Cannot modify the guild roster while there is an active raid.', 'End all active raids before performing this action.' ] );

        } else {
            this.dialogService.showConfirmTable<IBasicMemberData>(
                members.map( f => <IBasicMemberData>{ name: f.name, notes: f.notes } ),
                [ { headerText: 'Name', predicate: m => m.name }, { headerText: 'Notes', predicate: m => m.notes } ],
                [ `Would you like to remove the following characters from all lists?`, new ColoredString( 'This is a permanent action!', '#f44336', true ) ],
                `Click "Yes" to remove this all listed members from all lists.`,
                `Click "No" to close this dialog without modifying the lists.`,
            ).subscribe( confirmed => {
                if ( confirmed ) {
                    this.ipcService.getMasterListsDb().subscribe( master => {
                    
                        members.forEach( member => {
                        
                            master.masterLists.forEach( skList => {
                                let i = skList.list.findIndex( f => f.name === member.name );
                                if ( i > -1 ) {
                                    skList.list.splice( i, 1 );
                                }
                            } );
                    
                        } );
                    } );

                    this.saveRoster();
                }
            } );
        }
        
    }










    /**
     * After confirmation, removes the given member from the given lists.
     * 
     * @param member The member to remove.
     * @param skLists The lists to remove the member from.
     */
    removeMemberFromLists( member: GuildMember, skLists: MasterSuicideKingsList[] ) {

        if ( this.activeRaids?.length > 0 ) {
            this.dialogService.showErrorDialog( 'Error', [ 'Cannot modify the guild roster while there is an active raid.', 'End all active raids before performing this action.' ] );

        } else {
            this.dialogService.showConfirmDialog(
                [ `Would you like to remove ${member.name} from ${_.map( skLists, f => f.name ).join( ', ' )}?`, 'This is a permanent action' ],
                `Click "Yes" to remove this ${member.alt ? 'alt' : 'member'} from all specified lists.`,
                `Click "No" to close this dialog without modifying the lists.`,
                confirmed => {
                    if ( confirmed ) {
                        
                        skLists.forEach( skList => {
                            let i = skList.list.findIndex( f => f.name === member.name );
                            if ( i > -1 ) {
                                skList.list.splice( i, 1 );
                            }
                        } );
                        
                        this.ipcService.getMasterListsDb().subscribe( master => {
                            skLists.forEach( list => {
                                let i = master.masterLists.findIndex( f => f.listId == list.listId );
                                if ( i > -1 ) {
                                    master.masterLists[ i ] = list;
                                }
                            } );

                            this.ipcService.storeMasterListDb( master );
                        } );
                    }
                } );
        }
        
    }









    
    /**
     * Opens a dialog to show the history of the specified guild member.
     * 
     * @param name The name of the guild member.
     */
    showMemberSuicideHistory( name: string ) {
        
        this.dialog.open<MemberSuicideHistoryDialogComponent, any, null>( MemberSuicideHistoryDialogComponent, {
            width: '650px',
            data: name,
            panelClass: 'app-dialog',
        } ).afterClosed();

    }









    
    /**
     * Opens the loot history modal.
     */
    openLootHistory() {
        this.ipcService.showLootHistoryModal().subscribe();
    }

}
