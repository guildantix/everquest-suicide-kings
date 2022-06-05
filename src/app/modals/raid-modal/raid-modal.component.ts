import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { Character, GuildMember, ListsDatabase, MasterSuicideKingsList, Raid, RaidList, RaidAttendee, raidKeyMap, RaidMember, Suicide, SuicideKingsCharacter, MovementHistory, SuicideKingsListHistory, ListDescription, HistoryTypes, SuicideGroup, SuicideGroupMember } from 'src/app/core.model';
import { DialogService } from 'src/app/dialogs/dialog.service';
import { IpcService } from 'src/app/ipc.service';
const alphabet = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
import { customAlphabet } from 'nanoid';
const nanoid = customAlphabet( alphabet, 16 );
import * as _ from 'lodash-es';
import { CsvUtilities } from 'src/app/utilities/csv.utilities';
import { DateUtilities } from 'src/app/utilities/date.utilities';
import { NewRaiderDialogComponent } from '../new-raider-dialog/new-raider-dialog.component';
import { MatDialog } from '@angular/material/dialog';
import { NewRaiderModel, NewRaiderResultModel } from '../new-raider-dialog/new-raider.model';
import { MatSnackBar, MatSnackBarRef, SimpleSnackBar } from '@angular/material/snack-bar';
import { MissingRaiderModel, MissingRaidersModel } from '../missing-raider-dialog/missing-raider.model';
import { ICharacterMultiList } from '../modals.model';
import { MissingRaiderDialogComponent } from '../missing-raider-dialog/missing-raider-dialog.component';
import { MasterListHistoryDialogComponent } from 'src/app/sk-lists/master-list-history-dialog/master-list-history-dialog.component';
import { UniqueList } from 'src/app/core/unique-list';

const raidReactivationHours = 24 * 365 * 1;

@Component( {
    selector: 'app-raid-modal',
    templateUrl: 'raid-modal.component.html', 
    styleUrls: [ 'raid-modal.component.scss', '../../core.scss', '../../modal.scss' ],
} )
export class RaidModalComponent implements OnInit {

    public raid: Raid;
    public sortByAlpha: boolean = true;
    public masterCharacterList: Character[] = [];
    public takingBids: boolean = false;
    public namesLeftRaid: string[] = [];
    public namesJoinedRaid: string[] = [];
    public leftRaidSnackBarRef: MatSnackBarRef<SimpleSnackBar>;
    public bidArticle: string = null;
    public get bidArticleLabel(): string {
        return this.bidArticle ?? 'Unknown';
    }
    public guildRoster: GuildMember[] = [];
    public bidLists: RaidList[] = [];
    public get bl(): RaidList | RaidList[] {
        return this.singleListBidAccept ? this.bidLists[ 0 ] : this.bidLists;
    }
    public set bl( val: RaidList | RaidList[] ) {
        if ( Array.isArray( val ) ) {
            this.bidLists = val;
        } else {
            this.bidLists = [ val ];
        }
    }
    public useSuicideGroups: boolean = false;
    public suicideGroups: SuicideGroup[] = [];
    public singleListBidAccept: boolean = false;
    public autoSelectedRaiders: UniqueList<string> = new UniqueList<string>();

    public get selectedMasterLists(): MasterSuicideKingsList[] {
        // Possible error could occur if the selected master lists change after the raid has begun.
        return this.listsDatabase ? this.listsDatabase.masterLists.filter( f => f.selected ) : [];
    }

    public get hasSelectedInMaster(): boolean {
        for ( let i = 0; i < this.listsDatabase?.masterLists.length; i++ ) {
            if ( this.listsDatabase.masterLists[ i ].selected ) {
                let list = this.listsDatabase.masterLists[ i ].list;
                for ( let j = 0; j < list.length; j++ ) {
                    if ( !list[ j ].inRaid && list[ j ].selected ) {
                        return true;
                    }
                }
            }
        }
        return _.some( this.masterCharacterList, f => f.selected );
    }

    public get hasSelectedInRaid(): boolean {
        if ( this.raid?.lists.length > 0 ) {
            for ( let i = 0; i < this.raid.lists.length; i++ ) {
                let list = this.raid.lists[ i ].list;
                for ( let j = 0; j < list.length; j++ ) {
                    if ( list[ j ].selected ) {
                        return true;
                    }
                }
            }
        }
        return false;
    }

    private raidDb: Raid[];
    private _listsDatabase: ListsDatabase;
    private get listsDatabase(): ListsDatabase {
        return this._listsDatabase;
    }
    private set listsDatabase( db: ListsDatabase ) {
        this._listsDatabase = db;
        this.updateMasterCharacterList();
    }

    @ViewChild( 'fileSelector' ) private fileSelector: ElementRef<HTMLInputElement>;

    constructor( private ipcService: IpcService, private dialogService: DialogService, private dialog: MatDialog, private snackBar: MatSnackBar ) { }

    ngOnInit() {
        this.ipcService.getRaids().subscribe( raids => {
            this.raidDb = raids;
            let activeRaid = raids.find( f => !f.completed );
            let lastRaidDate = new Date( raids[ raids.length - 1 ].date );

            this.ipcService.getMasterListsDb().subscribe( db => {
                    
                this.listsDatabase = db;
                    
                if ( activeRaid ) {
                    this.raid = activeRaid;
                    this.recalculateSkListPositions( this.listsDatabase );
                
                } else {

                    let showLastRaid = DateUtilities.getTimeBetweenDates( lastRaidDate, new Date( new Date().toISOString() ) ).totalHours < raidReactivationHours;
        
                    this.dialogService
                        .showCheckboxListDialog( 'Select Lists',
                            [ 'Select the Suicide Kings lists to be run during this raid event.' ],
                            this.listsDatabase.masterLists,
                            'Create new raid with these list(s)', 'Cancel raid event', showLastRaid ? 'Reactivate last raid event' : null
                        ).subscribe( selected => {
                            if ( selected?.length > 0 ) {
                                this.createRaid();
                                this.updateMasterCharacterList();
                            } else if ( selected === undefined ) {
                                this.activateRaid( raids[ raids.length - 1 ] );
                            } else {
                                this.ipcService.closeThisChild();
                            }
                        } );
                }
                    
            } );
        } );

        this.ipcService.getValue<boolean>( 'useSuicideGroups' ).subscribe( useSuicideGroups => this.useSuicideGroups = useSuicideGroups );
        this.ipcService.getValue<boolean>( 'singleListBidAccept' ).subscribe( singleListBidAccept => this.singleListBidAccept = singleListBidAccept );

        this.ipcService.characterBidded().subscribe( name => {
            this.addBidder( name );
        } );

        this.ipcService.characterLeftRaid().subscribe( name => {
            this.setNameLeftRaid( name );
        } );

        this.ipcService.characterJoinedRaid().subscribe( name => {
            this.setNameJoinedRaid( name );
        } );

        this.ipcService.bidStarted().subscribe( article => {
            this.bidArticle = article;
            this.startTakingBids();
        } );

        this.ipcService.raidDumpDetected().subscribe( dumpFile => {
            this.parseRaidDumpData( dumpFile );
        } );

        this.ipcService.getGuildRoster().subscribe( roster => {
            this.guildRoster = roster;
        } );
        
    }









    
    /**
     * Returns the guild rank, or 'n/a', of the given character name.
     * 
     * @param name The name of the character.
     */
    public getGuildRank( name: string ): string {
        let gi = this.guildRoster.findIndex( f => f.name === name );
        return gi >= 0 ? this.guildRoster[ gi ].rank : 'n/a';
    }










    /**
     * Updates the sk list position of each raider from the given lists database.
     * 
     * @param listsDb The lists database.
     */
    public recalculateSkListPositions( listsDb: ListsDatabase ) {
        
        this.raid.lists.forEach( raidList => {
            raidList.list.forEach( raider => {
                let masterList = listsDb.masterLists.find( f => f.listId === raidList.masterListId );
                raider.skListIndex = masterList.list.findIndex( f => f.name === raider.name );
            } );

            raidList.list = _.sortBy( raidList.list, f => f.skListIndex );
            
        } );

    }









    
    /**
     * Manually send execute tests.
     */
    public sendTest() {

        // this.bidArticle = 'Item of Awesomeness';
        // this.startTakingBids();

        // this.addBidder( 'Sedulin' );
        // this.addBidder( 'Alanor' );

        // window.setTimeout( () => this.setNameLeftRaid( 'Sedulin' ), 1000 );
        // window.setTimeout( () => this.removeSelectedFromRaid(), 2000 );
        // window.setTimeout( () => this.setNameJoinedRaid( 'Sedulin' ), 4000 );
        // this.setNameLeftRaid( 'Sedulin' );
        // window.setTimeout( () => this.setNameLeftRaid( 'Alanor' ), 500 );

        // window.setTimeout( () => this.setNameJoinedRaid( 'Sedulin' ), 2000 );
        // window.setTimeout( () => this.setNameJoinedRaid( 'Alanor' ), 10000 );

        window.setTimeout( () => this.setNameJoinedRaid( 'Abc' ), 1000 );
        window.setTimeout( () => this.setNameJoinedRaid( '123' ), 1000 );
        window.setTimeout( () => this.setNameJoinedRaid( 'Comewithme' ), 1000 );
    }










    /**
     * Removes the specified raider from the unknown raider list.
     * 
     * @param name The name of the unknown raider.
     */
    public dismissUnknownRaider( name: string ) {
        let i = this.namesJoinedRaid.findIndex( f => f === name );
        if ( i > -1 ) {
            this.namesJoinedRaid.splice( i, 1 );
        }
    }










    /**
     * Adds the specified bidder to the bidders list, if taking bids.
     * 
     * @param name The name of the bidder.
     */
    public addBidder( name: string ) {

        if ( this.takingBids ) {
            this.bidLists.forEach( raidList => {
                raidList.bidders = raidList.bidders?.length > 0 ? raidList.bidders : [];
                
                let raidMember = raidList.list.find( f => f.name === name );
                
                if ( raidMember && !_.some( raidList.bidders, f => f.name === name ) ) {
                    raidList.bidders.push( raidMember );
                    raidList.bidders = _.orderBy( raidList.bidders, f => f.skListIndex, [ 'asc' ] );
                }

            } );
        }
        
    }









    
    /**
     * Updates the current raid and selects the given character if found in any lists.
     * 
     * @param name The name of the character that has left the raid.
     */
    public setNameLeftRaid( name: string ) {
            
        this.selectCharacterInRaid( name );
        this.autoSelectedRaiders.add( name );

        if ( this.namesLeftRaid.indexOf( name ) === -1 ) {
            this.namesLeftRaid.push( name );
        }

        this.updateNamesLeftRaidSnackBar();
    }









    
    /**
     * Updates/opens the left raid snackbar notification text.
     */
    public updateNamesLeftRaidSnackBar() {

        if ( this.leftRaidSnackBarRef ) {
            this.leftRaidSnackBarRef.dismiss();
            this.leftRaidSnackBarRef = null;
        }
        
        if ( this.namesLeftRaid?.length > 0 ) {
            this.leftRaidSnackBarRef = this.snackBar.open( `Left raid: ${this.namesLeftRaid.join( ', ' )}`, 'dismiss', { duration: 10000000 } );
        }

    }









    
    /**
     * Attempts to add the name to the raid.  If the name recently left but has 
     * not been removed from the raid, they are deselected.  If they exist in a 
     * list but are not in the raid, they are added to the raid.  If they do 
     * not exist, they are shown to the user for action.
     * 
     * @param name The name of the character that joined the raid.
     */
    public setNameJoinedRaid( name: string ) {
        if ( this.namesLeftRaid.indexOf( name ) > -1 ) {
            _.remove( this.namesLeftRaid, f => f === name );

            this.deselectCharacterInRaid( name );
            this.updateNamesLeftRaidSnackBar();

        } else {
            
            let isMissing = !_.some( this.listsDatabase.masterLists, m => m.selected && _.some( m.list, c => c.name === name ) );
            if ( isMissing && this.namesJoinedRaid.indexOf( name ) === -1 ) {
                this.namesJoinedRaid.push( name );
            } else {
                this.activateNameToRaid( name );
            }
        }
    }










    /**
     * Finds the given name in all master lists, selects those names, then 
     * executes the add selected to raid method.
     * 
     * @param name The name to activate.
     */
    public activateNameToRaid( name: string ) {

        this.listsDatabase.masterLists.forEach( master => {
            master.list.forEach( character => {
                if ( !character.inRaid && character.name === name ) {
                    character.selected = true;
                }
            } );
        } );

        this.addSelectedToRaid();
    }









    
    /**
     * Ends the current raid, saves changes, and closes the raid modal.
     */
    public closeModal(): void {
        this.dialogService.showConfirmDialog( 'Are you sure you want to end this raid?', 'Click "Yes" to end the raid and close this window.', 'Click "No" to remain on this screen.', confirmed => {
            if ( confirmed ) {
                this.raid.completed = true;
                this.ipcService.storeRaids( this.raidDb );
                this.listsDatabase.masterLists.forEach( f => f.list.forEach( c => c.inRaid = false ) );
                this.ipcService.storeMasterListDb( this.listsDatabase );
                this.ipcService.closeThisChild();
            }
        } );
    }









    
    /**
     * Saves any changes to the master suicide kings lists and the current 
     * raid.
     */
    public save(): void {
        this.ipcService.storeMasterListDb( this.listsDatabase );
        this.ipcService.storeRaids( this.raidDb );
    }









    
    /**
     * Pulls all of the possible character namess found in all master suicide 
     * lists.
     */
    private updateMasterCharacterList() {
        let namesAdded: string[] = [];
        this.masterCharacterList = [];
        this._listsDatabase?.masterLists.forEach( master => {
            if ( master.selected ) {
                master.list.forEach( chr => {
                    if ( namesAdded.indexOf( chr.name ) === -1 ) {
                        let character = new Character();
                    
                        character.selected = false;
                        character.name = chr.name;
                        character.level = chr.level;
                        character.class = chr.class;
                        character.disabled = this._listsDatabase.masterLists.some( master => master.list.some( listChr => listChr.name === chr.name && listChr.inRaid ) );
                        this.masterCharacterList.push( character );
                        namesAdded.push( chr.name );
                    }
                } );
            }
        } );
        this.masterCharacterList = _.orderBy( this.masterCharacterList, f => f.name, 'asc' );
    }









    
    /**
     * Handles the file inputs change event and parses the selected raid dump 
     * file.
     * 
     * @param e The file input event args.
     */
    fileSelected( e: Event ) {
        let input = e.target as HTMLInputElement;
        this.parseRaidDump( input.files[ 0 ] );
    }
    








    
    /**
     * Selects the given character if the character is not in a raid.
     * 
     * @param character The character to select.
     */
    selectSkCharacter( character: SuicideKingsCharacter ) {
        if ( !character.inRaid ) {
            character.selected = !character.selected;
            this.listsDatabase.masterLists.forEach( master => master.list.forEach( chr => {
                if ( chr.name === character.name ) {
                    chr.selected = character.selected;
                }
            } ) );
            this.masterCharacterList.forEach( chr => {
                if ( chr.name === character.name ) {
                    chr.selected = character.selected;
                }
            } );
        }
    }









    
    /**
     * Selects the given character in all active raid and master suicide lists 
     * their name is found in.
     * 
     * @param character The character to select.
     */
    selectNewCharacter( character: ICharacterMultiList ) {

        this.listsDatabase.masterLists.forEach( master => master.list.forEach( chr => {
            if ( chr.name === character.name ) {
                chr.selected = true;
            }
        } ) );

        this.masterCharacterList.forEach( chr => {
            if ( chr.name === character.name ) {
                chr.selected = true;
            }
        } );

    }









    
    /**
     * Sets the selected property to true for all active raid and master 
     * suicide kings lists.
     * 
     * @param raider The raid attendee
     */
    selectRaidAttendee( raider: RaidAttendee ) {
        this.listsDatabase.masterLists.forEach( master => master.list.forEach( chr => {
            if ( !chr.inRaid && chr.name === raider.name ) {
                chr.selected = true;
            }
        } ) );
        this.masterCharacterList.forEach( chr => {
            if ( !chr.disabled && chr.name === raider.name ) {
                chr.selected = true;
            }
        } );
    }









    
    /**
     * Toggles the select state on the give character in all lists, if the character is not in the raid.
     * 
     * @param character The character.
     */
    toggleSelectCharacter( character: Character ) {
        if ( !character.disabled ) {
            character.selected = !character.selected;
            this.listsDatabase.masterLists.forEach( master => master.list.forEach( chr => {
                if ( chr.name === character.name ) {
                    chr.selected = character.selected;
                }
            } ) );
        }
    }










    /**
     * Selects the specified character in each active sk list and bidding lists.
     * 
     * @param name The name of the character to select.
     */
    private selectCharacterInRaid( name: string ) {
        this.raid.lists.forEach( raidList => {
            raidList.list.forEach( r => {
                if ( r.name === name ) {
                    r.selected = true;
                }
            } );
            raidList.bidders.forEach( r => {
                if ( r.name === name ) {
                    r.selected = true;
                }
            } );
        });
    }










    /**
     * Deselects the specified character in all raid and bidding lists.
     * 
     * @param name The name of the character to deselect.
     */
    private deselectCharacterInRaid( name: string ) {
        this.raid.lists.forEach( raidList => {
            raidList.list.forEach( r => {
                if ( r.name === name ) {
                    r.selected = false;
                }
            } );
            raidList.bidders.forEach( r => {
                if ( r.name === name ) {
                    r.selected = false;
                }
            } );
        });
    }









    
    /**
     * Toggles the select state of the given raider in all lists.
     * 
     * @param raider The raider.
     */
    selectRaider( raider: RaidMember ) {
        raider.selected = !raider.selected;
        this.raid.lists.forEach( raidList => {
            raidList.list.forEach( r => {
                if ( r.name === raider.name ) {
                    r.selected = raider.selected;
                }
            } );
            raidList.bidders.forEach( r => {
                if ( r.name === raider.name ) {
                    r.selected = raider.selected;
                }
            } );
        });
    }









    
    /**
     * Adds the selected characters to the raid.
     * 
     * @param fromDump If the selected raiders were added automaticaly by parsing a raid dump file.
     */
    addSelectedToRaid( fromDump?: boolean ) {
        
        fromDump = fromDump ? true : false;

        let raidStarting = true;
        this.raid.lists?.forEach( list => {
            if ( list.list?.length > 0 ) {
                raidStarting = false;
            }
        } );

        let now = ( new Date() ).toISOString();

        this.listsDatabase.masterLists.forEach( master => {
            if ( master.selected ) {
                master.list.forEach( ( character: SuicideKingsCharacter, listIndex: number ) => {
                    if ( character.selected ) {
                        let i = this.raid.lists.findIndex( f => f.masterListId === master.listId );
                        if ( !_.some( this.raid.lists[ i ].list, f => f.name === character.name ) ) {
                            
                            // Add this character to the raid list.
                            this.raid.lists[ i ].list.push( RaidMember.fromSuicideKingsCharacter( character, listIndex ) );

                            // Create the Start/Join event
                            let history = SuicideKingsListHistory
                                .CreateAttendRaidEvent(
                                    raidStarting ? HistoryTypes.StartRaid : HistoryTypes.JoinRaid,
                                    now,
                                    character.name,
                                    this.raid.raidId,
                                    fromDump, master,
                                    this.raid.lists[ i ] );

                            // Add the join event to the list history.
                            master.history = master.history ? master.history : [];
                            master.history.push( history );
                        }
                        character.inRaid = true;
                        character.selected = false;
                    }
                } );
            }
        } );

        this.updateMasterCharacterList();
        
        // Reorder the raid list and save the changes.
        this.raid.lists.forEach( raidList => raidList.list = _.sortBy( raidList.list, f => f.skListIndex ) );

        this.save();
    }









    
    /**
     * Removes the selected character(s) from the raid.
     */
    removeSelectedFromRaid() {
        let now = ( new Date() ).toISOString();

        this.raid.lists.forEach( raidList => {
            let mi = this.listsDatabase.masterLists.findIndex( f => f.listId === raidList.masterListId );
            let master = this.listsDatabase.masterLists[ mi ];
            let removed = _.remove( raidList.list, f => f.selected );
            removed.forEach( raider => {
                let i = this.listsDatabase.masterLists[ mi ].list.findIndex( f => f.name === raider.name );
                this.listsDatabase.masterLists[ mi ].list[ i ].inRaid = false;
                this.listsDatabase.masterLists[ mi ].list[ i ].selected = false;
                
                // Create the leave event.
                let history = SuicideKingsListHistory
                    .CreateAttendRaidEvent(
                        HistoryTypes.LeaveRaid,
                        now,
                        raider.name,
                        this.raid.raidId,
                        this.autoSelectedRaiders.contains( raider.name ),
                        master,
                        raidList );

                // Add the join event to the list history.
                master.history = master.history ? master.history : [];
                master.history.push( history );

                this.autoSelectedRaiders.remove( raider.name );
            } );

            _.remove( raidList.bidders, f => f.selected );
        } );
        this.updateMasterCharacterList();
        this.namesLeftRaid = [];

        if ( this.leftRaidSnackBarRef ) {
            this.leftRaidSnackBarRef.dismiss();
            this.leftRaidSnackBarRef = null;
        }

        this.save();
    }
    








    
    /**
     * Parses the given raid dump file and creates a new raid.
     * 
     * @param file The raid dump file.
     */
    parseRaidDump( file: File ) {
        let fileReader = new FileReader();
        fileReader.onload = () => {
            this.parseRaidDumpData( fileReader.result as string );
            this.fileSelector.nativeElement.value = null;
        };
        fileReader.readAsText( file );
    }









    
    /**
     * Parses the given raid dump data and updates attendance.
     * 
     * @param data The raid dump data.
     */
    parseRaidDumpData( data: string ) {
        let csv = CsvUtilities.parseCsvData( data );
        let raidRoster: RaidAttendee[] = [];
    
        csv.forEach( raider => {
            let attendee = new RaidAttendee();
    
            attendee.name = raider[ raidKeyMap.name ];
    
            if ( attendee.name ) {

                attendee.group = +raider[ raidKeyMap.group ];
                attendee.level = +raider[ raidKeyMap.level ];
                attendee.class = raider[ raidKeyMap.class ];
                attendee.raidRank = raider[ raidKeyMap.raidRank ];
                // attendee.inList = raider[ raidKeyMap.inList ];
    
                raidRoster.push( attendee );
            }
    
        } );


        // First, remove raid attendees that are not in the dump file.
        let hasMissingFromDump = false;
        this.raid.lists.forEach( raidList => {
            raidList.list.forEach( raider => {
                if ( !_.some( raidRoster, rost => rost.name === raider.name ) ) {
                    raider.selected = true;
                    hasMissingFromDump = true;
                    this.autoSelectedRaiders.add( raider.name );
                }
            } );
        } );
            
        // Next, add existing members that are not in the raid, to the raid.
        raidRoster.forEach( raider => this.selectRaidAttendee( raider ) );
        this.addSelectedToRaid( true );

        // determine if new members need to be added to the list (ask the user to confirm/select)
        let notInMasterList: RaidAttendee[] = [];
        raidRoster.forEach( attendee => {
            let isMissing = !_.some( this.listsDatabase.masterLists, m => m.selected && _.some( m.list, c => c.name === attendee.name ) );
            if ( isMissing ) {
                notInMasterList.push( attendee );
            }
        } );

        if ( notInMasterList.length > 0 ) {
            this.dialog.open<MissingRaiderDialogComponent, MissingRaidersModel, MissingRaidersModel>( MissingRaiderDialogComponent, {
                width: '650px',
                data: { listsDatabase: this.listsDatabase, raiders: notInMasterList as MissingRaiderModel[] },
                panelClass: 'app-dialog',
            } ).afterClosed().subscribe( raiderListAssignments => {
                if ( raiderListAssignments !== null ) {

                    this.ipcService.getGuildRoster().subscribe( roster => {
                        raiderListAssignments.raiders.forEach( newRaider => {
                            this.assignAttendeeToLists( roster, newRaider );
                        } );
        
                    } );
                        
                    this.save();
                }
                if ( hasMissingFromDump ) {
                    this.dialogService.showInfoDialog( 'Missing Members', [ 'There are some members that are in the raid but were not found in the output file.', 'The characters that were missing from the output file have been automatically selected for removal.', 'To remove these characters from the raid, please click on the "Remove Selected from Raid" button.' ], 'raid-modal:missing-members-warning' );
                }
            } );
                
        } else if ( hasMissingFromDump ) {
            this.dialogService.showInfoDialog( 'Missing Members', [ 'There are some members that are in the raid but were not found in the output file.', 'The characters that were missing from the output file have been automatically selected for removal.', 'To remove these characters from the raid, please click on the "Remove Selected from Raid" button.' ], 'raid-modal:missing-members-warning' );
        }

    }










    /**
     * Removes the specified raider from auto-selected status.
     * 
     * @param name The name of the raider
     */
    public removeAutoSelectedRaider( name: string ) {
        this.autoSelectedRaiders.remove( name );
    }









    
    /**
     * Creates an empty raid based on the user-selected master lists.
     */
    createRaid() {
        let raid = new Raid();

        raid.raidId = nanoid();
        raid.name = null;
        raid.completed = false;
        raid.date = ( new Date() ).toISOString();

        // Create a raid list for all selected master SK lists.
        this.listsDatabase.masterLists.forEach( master => {
            if ( master.selected ) {
                let raidList = new RaidList();
                
                raidList.masterListId = master.listId;
                raidList.listName = master.name;

                raid.lists.push( raidList );

            }
        } );
        
        this.raid = raid;
        this.raidDb.push( raid );

        this.save();
    }










    /**
     * Activates the given raid.
     * 
     * @param raid The raid to activate.
     */
    activateRaid( raid: Raid ) {
        raid.completed = false;
        this.raid = raid;

        // Marks each character from the raid as inRaid.
        this.raid.lists.forEach( raidList => {
            let master = this.listsDatabase.masterLists.find( f => f.listId === raidList.masterListId );

            master.list.forEach( ( character: SuicideKingsCharacter, listIndex: number ) => {
                character.inRaid = raidList.list.findIndex( f => f.name === character.name ) > -1 ? true : character.inRaid;
            } );

        } );

        this.recalculateSkListPositions( this.listsDatabase );
        this.updateMasterCharacterList();

        this.save();
    }









    
    /**
     * After confirmation, suicides the given raider.
     * 
     * @param raider The desired raider.
     */
    askSuicideRaider( raider: RaidMember, masterListId: string ) {
        this.dialogService.showInputDialog(
            `Suicide ${raider.name}`,
            [ 'Enter the item description (or reason for suicide).', 'You can leave the field blank to suicide this character with no reason.', 'Clicking on cancel will stop the suicide' ],
            'Item',
            'Enter an item description/name or leave blank to ignore.',
            this.bidArticle ?? null,
            'Exclude raider from attendance?' )
            .subscribe( answer => {
                if ( answer || answer === undefined ) {
                    if ( !this.useSuicideGroups ) {
                        this.suicideRaider( raider, answer.value, masterListId, answer.checked );
                    } else {
                        let suicideGroup = this.suicideGroups.find( f => f.masterListId === masterListId );

                        if ( !suicideGroup ) {
                            
                            suicideGroup = new SuicideGroup();
                            suicideGroup.masterListId = masterListId;
                            suicideGroup.masterListName = this.raid.lists.find( f => f.masterListId === masterListId ).listName;
                            suicideGroup.members = [];

                            this.suicideGroups.push( suicideGroup );
                        }
                        
                        let sgMember = suicideGroup.members.find( f => f.name === raider.name );
                        if ( !sgMember ) {
                            sgMember = Object.assign( new SuicideGroupMember(), raider );
                            sgMember.articles = [];
                            suicideGroup.members.push( sgMember );
                            suicideGroup.members = _.orderBy( suicideGroup.members, f => f.skListIndex, [ 'asc' ] );
                        }
                        
                        sgMember.articles.push( answer.value );
                        sgMember.excludeFromAttendance = answer.checked;

                    }
                    this.stopTakingBids();
                }
            } );
    }









    
    /**
     * Removes the specified article from the specified suicide group's member.
     * 
     * @description If the raider has no more articles after removal, they are 
     *              removed from the suicide group.  Additionally, if the 
     *              suicide group contains zero members, then the group is 
     *              removed.
     * 
     * @param suicideGroup The suicide group that contains the raider's suicide.
     * @param name The name of the raider.
     * @param article The article to remove.
     */
    removeArticle( suicideGroup: SuicideGroup, name: string, article: string ): void {

        // Start with removing the article from the member's  suicides.
        let mi = suicideGroup.members.findIndex( f => f.name === name );
        let ai = suicideGroup.members[ mi ].articles.findIndex( f => f == article );
        if ( ai > -1 ) {
            suicideGroup.members[ mi ].articles.splice( ai, 1 );
        }

        // If the member now has zero suicide articles, remove them from the 
        // suicide group.
        if ( suicideGroup.members[ mi ].articles?.length == 0 ) {
            suicideGroup.members.splice( mi, 1 );

            // If the suicide group has zero members, remove it from the array.
            if ( suicideGroup.members?.length == 0 ) {
                let si = this.suicideGroups.findIndex( f => f.masterListId === suicideGroup.masterListId );
                this.suicideGroups.splice( si, 1 );
            }
        }
    }









    
    /**
     * Returns true if the specified raid is in a suicide group for the 
     * specified list.
     * 
     * @param masterListId The master list id to check.
     * @param name The name of the raider.
     */
    inSuicideGroup( masterListId: string, name: string ): boolean {
        let group = this.suicideGroups.find( f => f.masterListId === masterListId );

        if ( group ) {
            let member = group.members.find( f => f.name === name );
            return member != null;
        }

        return false;
    }









    
    /**
     * Executes all of the staged suicide groups, in order.
     */
    executeGroupSuicides(): void {
        this.ipcService.getGuildRoster().subscribe( roster => {

            this.suicideGroups.forEach( group => {
                let raid = this.raid.lists.find( f => f.masterListId === group.masterListId );
                group.members.forEach( member => {
                    member.articles.forEach( article => {
                        // the raid list has their SK index updated, so we need 
                        // to pass a reference to the raid list member instead 
                        // of the suicide group member.
                        let raider = raid.list.find( f => f.name === member.name );
                        this.suicideGroupRaider( roster, raider, article, group.masterListId, member.excludeFromAttendance );
                    } );
                } );
            } );

            this.ipcService.storeGuildRoster( roster );
            this.save();
            this.suicideGroups = [];
        } );
    }









    
    /**
     * Suicides the specified raider for the specified reason.
     * 
     * @param raider The raider to suicide.
     * @param description The reason for suicide (item, random text, nothing)
     */
    suicideRaider( raider: RaidMember, description: string, masterListId: string, excludeAttendance: boolean ) {
        let raid = this.raid.lists.find( f => f.masterListId === masterListId );
        let top = raider.skListIndex;
        let bottomIndex = raid.list.length - 1;
        let bottom = raid.list[ bottomIndex ].skListIndex;
        let now = ( new Date() ).toISOString();

        for ( let i = bottomIndex; i >= 0; i-- ) {
            if ( raid.list[ i ].skListIndex === top ) {
                raid.list[ i ].skListIndex = bottom;
                break;
            } else {
                raid.list[ i ].skListIndex = raid.list[ i - 1 ].skListIndex;
            }
        }

        // Reorder the raid list and save the changes.
        raid.list = _.sortBy( raid.list, f => f.skListIndex );

        let masterList = this.listsDatabase.masterLists.find( f => f.listId === masterListId );

        // Store the movement history
        let history = new SuicideKingsListHistory();
        history.raidId = this.raid.raidId;
        history.timestamp = now;
        history.suicideIndex = top;
        history.activeIndices = SuicideKingsListHistory.calculateActiveIndices( raid, masterList );
        history.list = ListDescription.fromSuicideMasterList( masterList );
        history.historyType = HistoryTypes.Suicide;
        history.excludeAttendance = excludeAttendance;

        masterList.history = masterList.history ? masterList.history : [];
        masterList.history.push( history );

        // Update the main list.
        let removed = _.remove( masterList.list, f => f.inRaid );
        
        // Re-insert the raiders at their updated sk list index.
        raid.list.forEach( raider => {
            let i = removed.findIndex( f => f.name === raider.name );
            masterList.list.splice( raider.skListIndex, 0, removed[ i ] );
        } );

        // Update the guild member record.
        this.ipcService.getGuildRoster().subscribe( roster => {
            if ( roster ) {
                roster.forEach( member => {
                    if ( member.name === raider.name ) {
                        let suicide = new Suicide();
                        
                        suicide.date = now;
                        suicide.raidId = this.raid.raidId;
                        suicide.item = description;

                        member.suicides = member.suicides ? member.suicides : [];
                        member.suicides.push( suicide );
                    }
                } );

                this.ipcService.storeGuildRoster( roster );
            }
        } );

        this.save();
    }










    /**
     * Suicides the specified raider for the specified reason, in the given 
     * suicide group.
     * 
     * @param raider The raider to suicide.
     * @param description The reason for suicide (item, random text, nothing)
     */
    suicideGroupRaider( roster: GuildMember[], raider: RaidMember, description: string, masterListId: string, excludeAttendance: boolean ): void {
        let raid = this.raid.lists.find( f => f.masterListId === masterListId );
        let top = raider.skListIndex;
        let bottomIndex = raid.list.length - 1;
        let bottom = raid.list[ bottomIndex ].skListIndex;
        let now = ( new Date() ).toISOString();

        for ( let i = bottomIndex; i >= 0; i-- ) {
            if ( raid.list[ i ].skListIndex === top ) {
                raid.list[ i ].skListIndex = bottom;
                break;
            } else {
                raid.list[ i ].skListIndex = raid.list[ i - 1 ].skListIndex;
            }
        }

        // Reorder the raid list and save the changes.
        raid.list = _.sortBy( raid.list, f => f.skListIndex );

        let masterList = this.listsDatabase.masterLists.find( f => f.listId === masterListId );

        // Store the movement history
        let history = new SuicideKingsListHistory();
        history.raidId = this.raid.raidId;
        history.timestamp = now;
        history.suicideIndex = top;
        history.activeIndices = SuicideKingsListHistory.calculateActiveIndices( raid, masterList );
        history.list = ListDescription.fromSuicideMasterList( masterList );
        history.historyType = HistoryTypes.Suicide;
        history.excludeAttendance = excludeAttendance;

        masterList.history = masterList.history ? masterList.history : [];
        masterList.history.push( history );

        // Update the main list.
        let removed = _.remove( masterList.list, f => f.inRaid );
        
        // Re-insert the raiders at their updated sk list index.
        raid.list.forEach( raider => {
            let i = removed.findIndex( f => f.name === raider.name );
            masterList.list.splice( raider.skListIndex, 0, removed[ i ] );
        } );

        // Update the guild member record.
        roster.forEach( member => {
            if ( member.name === raider.name ) {
                let suicide = new Suicide();
                        
                suicide.date = now;
                suicide.raidId = this.raid.raidId;
                suicide.item = description;

                member.suicides = member.suicides ? member.suicides : [];
                member.suicides.push( suicide );
            }
        } );

    }









    
    /**
     * Adds the specified raid attendee to the given list of master suicide 
     * lists and adds them to the active raid lists they are assigned to.
     * 
     * @param roster The full guild roster.
     * @param attendee The raid attendee.
     */
    assignAttendeeToLists( roster: GuildMember[], attendee: ICharacterMultiList ) {
        
        let rosterIndex = roster.findIndex( f => f.name === attendee.name );
                    
        attendee.listIds?.forEach( listId => {
            
            let masterIndex = this.listsDatabase.masterLists.findIndex( f => f.listId === listId );
            let charMasterIndex = this.listsDatabase.masterLists[ masterIndex ].list.findIndex( f => f.name === attendee.name );

            if ( charMasterIndex === -1 ) {
                this.listsDatabase.masterLists[ masterIndex ].list.push( Object.assign( new SuicideKingsCharacter(), attendee ) );
            }
            
        } );

        this.selectNewCharacter( attendee );
        this.addSelectedToRaid();

        if ( rosterIndex === -1 ) {
            let guildy = new GuildMember();
            
            guildy.name = attendee.name;
            guildy.level = attendee.level;
            guildy.class = attendee.class;
            guildy.placeholder = true;

            roster.push( guildy );
            roster = _.orderBy( roster, f => f.name, 'asc' );
            this.ipcService.storeGuildRoster( roster );
        }

    }









    
    /**
     * If there are guild members not in this list, then opens a checkbox 
     * dialog to selec those members to add.  Otherwise, opens an input dialog 
     * for new members.
     */
    showAddNewCharacter( name?: string ) {
        this.dialog.open<NewRaiderDialogComponent, NewRaiderModel, NewRaiderResultModel>( NewRaiderDialogComponent, {
            width: '650px',
            data: { listsDatabase: this.listsDatabase, name: name },
            panelClass: 'app-dialog',
        } ).afterClosed().subscribe( newRaider => {

            if ( newRaider ) {

                this.ipcService.getGuildRoster().subscribe( roster => {
                    this.assignAttendeeToLists( roster, newRaider );
                } );

                this.save();

                this.dismissUnknownRaider( name );
            }

        } );

    }









    
    /**
     * Starts listening to the log file for bids.
     */
    startTakingBids() {
        this.takingBids = true;
        if ( this.raid?.lists?.length > 0 ) {
            this.bidLists = [ this.raid.lists[ 0 ] ];
        } else {
            this.bidLists = [];
        }
    }










    /**
     * Stops taking bids and resets any captured bidders.
     */
    stopTakingBids() {
        this.takingBids = false;
        this.raid.lists.forEach( raidList => raidList.bidders = [] );
    }










    /**
     * Opens the master list history dialog.
     */
    openMasterHistory( masterListId: string ) {
        
        
        let masterList = this.listsDatabase.masterLists.find( f => f.listId === masterListId );

        this.dialog.open( MasterListHistoryDialogComponent, {
            width: '750px',
            data: masterList,
            panelClass: 'app-dialog',
        } ).afterClosed().subscribe( () => {
            this.ipcService.getMasterListsDb().subscribe( listsDb => {
                this.listsDatabase = listsDb;
                
                this.recalculateSkListPositions( this.listsDatabase );

            } );
        });
    }

}
