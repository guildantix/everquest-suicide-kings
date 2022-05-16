import { StringProtocolResponse } from 'electron';
import * as _ from 'lodash-es';

export const ErrorCodes = {
    EqFolderNotFound: {
        code: 'EQDIRNULL',
        message: 'Could not locate your EverQuest folder.',
    }
};

export const ErrorIds = {
    swapSuicideCharacters: 'SKHISTSWP'
};

export enum CharacterClasses {
    Bard = 'BRD',
    Beastlord = 'BST',
    Berserker = 'BER',
    Cleric = 'CLR',
    Druid = 'DRU',
    Enchanter = 'ENC',
    Magician = 'MAG',
    Monk = 'MNK',
    Necromancer = 'NEC',
    Paladin = 'PAL',
    Ranger = 'RNG',
    Rogue = 'ROG',
    Shadowknight = 'SHD',
    Shaman = 'SHM',
    Warrior = 'WAR',
    Wizard = 'WIZ',
}

export class BasicError {
    
    public errorCode: string;
    public message: string;

}

export enum OperatorTypes {
    
    IsNull =                0,
    Equals =                1 << 0,
    DoesNotEqual =          1 << 1,
    LessThan =              1 << 2,
    GreaterThan =           1 << 3,

}

export class DataTickModel {
    
}

// EQ Suicide Kings

export interface Selectable {
    selected: boolean;
    name: string;
}

export class SelectOption {

    public id: string;
    public label: string;

    public static compare( a: SelectOption, b: SelectOption ): boolean {
        return a != null && b != null && a.id === b.id;
    }
}
export class Suicide {
    
    public date: string | null = null;
    public raidId: string | null = null;
    public item: string | null = null;

}

export class GuildMember {

    public name: string | null = null;
    public level: number | null = null;
    public class: string | null = null;
    public rank: string | null = null;
    public alt: boolean = false;
    public lastOnline: string | null = null;
    public zone: string | null = null;
    public notes: string | null = null;
    public suicides: Suicide[] | null = null;
    public missingFromDump: boolean = false;
    public selected: boolean = false;
    public initialSeed: number | null = null;
    public placeholder: boolean = false;

}

export class Character implements Selectable {
    
    selected: boolean;
    name: string;
    level: number;
    class: string;
    disabled: boolean = false;

}

export class SuicideKingsCharacter implements Selectable {
    
    public name: string;
    public selected: boolean;
    public initialSeed: number;
    public inRaid: boolean = false;
    public rank: number;
    public class: string;
    public level: number;

}

export class MasterSuicideKingsList implements Selectable {
    
    public listId: string;
    public name: string;
    public list: SuicideKingsCharacter[] = [];
    public selected: boolean;
    public history: SuicideKingsListHistory[] = [];

}

export class MovementHistory {
    
    public initialIndex: number;
    public deestinationIndex: number;

}

export class ListDescription {

    public previousName: string;

    constructor( public name?: string, public skListIndex?: number ) { }

    public static fromSuicideMasterList( master: MasterSuicideKingsList ): ListDescription[] {
        let output: ListDescription[] = [];

        master.list.forEach( ( char, i ) => output.push( new ListDescription( char.name, i ) ) );

        return output;
    }
}

export enum HistoryTypes {
    
    Suicide = 0,
    MainChange = 1,

}

export class SuicideKingsListHistory {

    /** The id of the raid during which the event occurred. */
    public raidId: string;
    /** The date and time of the event. */
    public timestamp: string;
    /** The skListIndex of the suicide character, before suicide. */
    public suicideIndex: number;
    /** Array containing the skListIndices of all characters in the raid, before the suicide. */
    public activeIndices: number[] = [];
    /** Array containing the name and skListIndex of all characters in the master list, before the suicide. */
    public list: ListDescription[] = [];
    /** The event type. */
    public historyType: HistoryTypes;
    /** The old name of the position holder. */
    public oldMain: string;
    /** The new name of the position holder. */
    public newMain: string;
    /** If true, this suicide will not be counted for attendance. */
    public excludeAttendance: boolean = false;









    
    /**
     * Calculates the active suicide kings indices from members at the raid.
     * 
     * @returns Returns an array of suicide kings indices.
     * 
     * @param raid The active raid.
     * @param master The master suicide kings list.
     */
    public static calculateActiveIndices( raid: RaidList, master: MasterSuicideKingsList ): number[] {
        let output: number[] = [];

        raid.list.forEach( ( raider ) => {
            let skListIndex = master.list.findIndex( f => f.name === raider.name );
            output.push( skListIndex );
        } );

        return output;
    }









    
    /**
     * Changes the suicide target for the specified suicide to the given name.
     * 
     * @description This method modifies the given master list object.
     * 
     * @param master The master list.
     * @param history The history event to change.
     * @param name The name of the character to suicide instead of history event's.
     * @param roster The guild roster is updated to move the suicide information to name's history.
     */
    public static changeEventCharacter( master: MasterSuicideKingsList, history: SuicideKingsListHistory, name: string, roster: GuildMember[] ) {
        let originalName = history.list.find( f => f.skListIndex === history.suicideIndex ).name;
        let targetHistoryIndex = master.history.findIndex( f => f.suicideIndex === history.suicideIndex && f.timestamp === history.timestamp );
        
        // Start by rolling back to the history event.
        let masterHistory = this.rollbackToHistory( targetHistoryIndex, master, roster );

        // Then execute a new suicide for the desired character.
        this.executeSuicide( master, history, name, roster );

        // Removes the previous suicide record.
        masterHistory.splice( 0, 1 );

        // Re-execute the remaining history.
        this.executeHistoryActions( master, masterHistory, roster );
        
        // Update character histories.
        if ( roster ) {
            let originalMember = roster.find( f => f.name === originalName );
            let i = originalMember.suicides.findIndex( f => f.date === history.timestamp && f.raidId === history.raidId );
            let targetMember = roster.find( f => f.name === name );

            if ( i > -1 ) {
                let suicide = originalMember.suicides.splice( i, 1 )[ 0 ];
                targetMember.suicides.push( suicide );
                targetMember.suicides = _.orderBy( targetMember.suicides, f => f.date, 'asc' );
            }
        }
    }









    
    /**
     * Rollsback the given suicide history and recalculates the master list as 
     * if the event never occurred.
     * 
     * @param master The master suicide kings list.
     * @param history The desired history event to remove.
     * @param roster The current guild roster.
     */
    public static rollbackSuicide( master: MasterSuicideKingsList, history: SuicideKingsListHistory, roster?: GuildMember[] ) {
        let name: string = history.list.find( f => f.skListIndex === history.suicideIndex ).name;
        let targetHistoryIndex = master.history.findIndex( f => f.suicideIndex === history.suicideIndex && f.timestamp === history.timestamp );

        // Start by rolling back to the history event.
        let masterHistory = this.rollbackToHistory( targetHistoryIndex, master, roster );

        // Remove the requested suicide from history.
        masterHistory.splice( 0, 1 );

        // Re-execute the remaining history.
        this.executeHistoryActions( master, masterHistory, roster );

        // Update character histories.
        if ( roster ) {
            let member = roster.find( f => f.name === name );
            let i = member.suicides.findIndex( f => f.date === history.timestamp && f.raidId === history.raidId );

            if ( i > -1 ) {
                member.suicides.splice( i, 1 )[ 0 ];
                member.suicides = member.suicides.length === 0 ? null : member.suicides;
            }
        }
    }









    
    /**
     * Rolls the master list back to before the target history event was 
     * executed.
     * 
     * @returns Returns the history events that were removed from the list.
     * 
     * @param targetHistoryIndex The target history event.
     * @param master The master list for the history event.
     */
    private static rollbackToHistory( targetHistoryIndex: number, master: MasterSuicideKingsList, roster: GuildMember[] ): SuicideKingsListHistory[] {
        
        if ( targetHistoryIndex < 0 ) {
            throw 'Cannot roll history back that far, not enough data.';

        } else {
            let history = master.history[ targetHistoryIndex ];
            let masterList: SuicideKingsCharacter[] = [];
            // Each suicide history stores the value of the master list prior 
            // to suicide.
            history.list.forEach( item => {
                let skchar = new SuicideKingsCharacter();
                skchar.name = item.name;
                
                let guildMember = roster.find( f => f.name === item.name );
                if ( guildMember ) {
                    skchar.class = guildMember.class;
                    skchar.inRaid = master.list.find( f => f.name === guildMember.name )?.inRaid === true;
                    skchar.level = guildMember.level;
                }
                masterList[ item.skListIndex ] = skchar;
            } );
            
            master.list = masterList;

            let masterHistory = master.history.splice( targetHistoryIndex, master.history.length - targetHistoryIndex );
            return masterHistory;
        }

    }









    
    /**
     * Executes all suicides from the given historical list.
     * 
     * @param master The master list.
     * @param history The historical actions to execute against the list.
     */
    private static executeHistoryActions( master: MasterSuicideKingsList, history: SuicideKingsListHistory[], roster: GuildMember[] ) {
        for ( let i = 0; i < history.length; i++ ) {

            if ( history[ i ].historyType === HistoryTypes.Suicide ) {
                
                // First, check if any player is removed from the list, and if 
                // so remove them from the list now.
                this.removeMissingFromHistory( master, history[ i ] );

                // Get the name of the suicide action from the list at the time 
                // of execution.  We use this method because the master list 
                // may have changed since the action was originally executed.
                let suicideName = history[ i ].list.find( f => f.skListIndex === history[ i ].suicideIndex ).name;
                
                // Execute this suicide action.
                this.executeSuicide( master, history[ i ], suicideName, roster );

            } else if ( history[ i ].historyType === HistoryTypes.MainChange ) {

                this.executeMainChange( master, history[ i ], roster );

            }
        }
    }









    
    /**
     * Removes any members that exist in the suicide kings list but not in the 
     * history item.
     * 
     * @param master The master suicide kings list.
     * @param history The current history item.
     */
    private static removeMissingFromHistory( master: MasterSuicideKingsList, history: SuicideKingsListHistory ) {
        let removeIndices: number[] = [];

        // Calculate the indices of any players in the master list that have 
        // been removed.
        for ( let mi = 0; mi < master.list.length; mi++ ) {
            let hi = history.list.findIndex( f => f.name === master.list[ mi ].name );
            if ( hi < 0 ) {
                removeIndices.push( mi );
            }
        }

        // Start from the bottom and move up, removing characters that were 
        // deleted.
        for ( let i = removeIndices.length - 1; i >= 0; i-- ) {
            master.list.splice( removeIndices[ i ], 1 );
        }
    }









    
    /**
     * Executes a main swap, ensuring that any modified positions due to 
     * rollbacks or exchanges maintain the member's position in the list.
     * 
     * @param master The master suicide kings list.
     * @param history The main change history event.
     * @param roster The current guild roster.
     */
    private static executeMainChange( master: MasterSuicideKingsList, history: SuicideKingsListHistory, roster: GuildMember[] ) {

        let currentSkIndex = master.list.findIndex( f => f.name === history.oldMain );
        if ( currentSkIndex > -1 ) {
            
            // Apply the main change to the master list.
            master.list[ currentSkIndex ].name = history.newMain;

            let guildMember = roster?.find( f => f.name === history.newMain );

            // If the new name exists in the guild roster, then update the 
            // character information in the master list.
            if ( guildMember ) {
                master.list[ currentSkIndex ].class = guildMember.class;
                master.list[ currentSkIndex ].inRaid = master.list[ currentSkIndex ]?.inRaid === true;
                master.list[ currentSkIndex ].level = guildMember.level;
                master.list[ currentSkIndex ].selected = false;
            }

            // Create a new main change history record.
            let newHistory = new SuicideKingsListHistory();
            newHistory.raidId = null;
            newHistory.timestamp = history.timestamp ? history.timestamp : ( new Date() ).toISOString();
            newHistory.suicideIndex = currentSkIndex;
            newHistory.activeIndices = [];
            newHistory.list = [];
            newHistory.oldMain = history.oldMain;
            newHistory.newMain = history.newMain;
            newHistory.historyType = HistoryTypes.MainChange;

            // Insert the new history into the record.
            master.history = master.history ? master.history : [];
            master.history.push( newHistory );

        }
    }










    /**
     * Executes a suicicde against the given master list.
     * 
     * @param master The master list.
     * @param activeRaiderIndices The list of indices of the active raiders at time of suicide.
     * @param name The name of the character to suicide.
     * @param raidId The id of the raid when suicide occurred.
     * @param timestamp The timestamp of the suicide.
     */
    private static executeSuicide( master: MasterSuicideKingsList, oldHistory: SuicideKingsListHistory, name: string, roster: GuildMember[] ) {
        let activeList: ListDescription[] = [];

        // Start by inserting new players from the original history event into 
        // the updated master list.
        if ( oldHistory.list.length != master.list.length ) {
            let newPeople = _.orderBy( oldHistory.list.filter( f => f.skListIndex > master.list.length - 1 ), f => f.skListIndex, 'asc' );

            newPeople.forEach( person => {
                let skChar = new SuicideKingsCharacter();
                skChar.name = person.name;
                if ( roster ) {
                    let member = roster.find( f => f.name === person.name );
                    if ( member ) {
                        skChar.class = member.class;
                        skChar.inRaid = master.list.find( f => f.name === member.name )?.inRaid === true;
                        skChar.level = member.level;
                        skChar.selected = false;
                    }
                }
                master.list.push( skChar );
            } );
            
        }
        
        // Recalculate the sk indices from the original history event to match 
        // the updated master list.
        oldHistory.activeIndices.forEach( i => {
            let name = oldHistory.list.find( f => f.skListIndex === i ).name;
            let skIndex = master.list.findIndex( f => f.name === name );
            activeList.push( new ListDescription( name, skIndex ) );
        } );
        activeList = _.orderBy( activeList, f => f.skListIndex, 'asc' );

        // Calculate the start and end.
        let suicideSkIndex = master.list.findIndex( f => f.name === name );
        let topActiveIndex = activeList.findIndex( f => f.skListIndex === suicideSkIndex );
        let bottomActiveIndex = activeList.length - 1;
        let bottom = activeList[ bottomActiveIndex ].skListIndex;

        // Update each active character's sk index.
        for ( let i = bottomActiveIndex; i >= topActiveIndex; i-- ) {
            let p = activeList[ i ].skListIndex;
            
            if ( i === topActiveIndex ) {
                activeList[ i ].skListIndex = bottom;
            } else {
                activeList[ i ].skListIndex = activeList[ i - 1 ].skListIndex;
            }
            
        }

        // Create a new movement history event.
        let history = new SuicideKingsListHistory();
        history.raidId = oldHistory.raidId;
        history.timestamp = oldHistory.timestamp ? oldHistory.timestamp : ( new Date() ).toISOString();
        history.suicideIndex = suicideSkIndex;
        history.activeIndices = oldHistory.activeIndices.slice();
        history.list = ListDescription.fromSuicideMasterList( master );
        history.historyType = HistoryTypes.Suicide;

        // Insert the new history into the record.
        master.history = master.history ? master.history : [];
        master.history.push( history );

        // Remove all active characters from the master list.
        let removed = _.remove( master.list, f => _.some( activeList, a => a.name === f.name ) );
        // Then add them back at their updated sk list index, updating the 
        // master list.
        activeList.forEach( char => {
            let i = removed.findIndex( f => f.name === char.name );
            master.list.splice( char.skListIndex, 0, removed[ i ] );
        } );

    }

}

export class RaidMember extends SuicideKingsCharacter {
    public skListIndex: number;

    public static fromAttendee( attendee: RaidAttendee, listIndex: number ): RaidMember {
        let raidMember = new RaidMember();

        raidMember.class = attendee.class;
        raidMember.level = attendee.level;
        raidMember.name = attendee.name;
        raidMember.skListIndex = listIndex;

        return raidMember;
    }

    public static fromSuicideKingsCharacter( character: SuicideKingsCharacter, listIndex: number ): RaidMember {
        let raidMember = new RaidMember();

        raidMember.class = character.class;
        raidMember.level = character.level;
        raidMember.name = character.name;
        raidMember.skListIndex = listIndex;

        return raidMember;
    }
}

export class RaidList {

    public masterListId: string;
    public listName: string;
    public list: RaidMember[] = [];
    public bidders: RaidMember[] = [];

}

export class SuicideGroupMember extends RaidMember {
    
    public articles: string[] = [];
    public excludeFromAttendance: boolean = false;

}

export class SuicideGroup {
    
    public masterListId: string;
    public masterListName: string;
    public members: SuicideGroupMember[] = [];

}

export class Raid {

    public raidId: string;
    // public masterListIds: string[];
    public name: string;
    // public list: RaidMember[] = [];
    public completed: boolean = false;
    public lists: RaidList[] = [];
    public date: string;

}

export class ListsDatabase {
    
    public masterLists: MasterSuicideKingsList[] = [];

}

export class RaidAttendee {

    public group: number | null = null;
    public name: string | null = null;
    public level: number | null = null;
    public class: string | null = null;
    public raidRank: string | null = null;
    public inList: boolean = false;

}

export const raidKeyMap = {
    group: 0,
    name: 1,
    level: 2,
    class: 3,
    raidRank: 4
};

export const guildMemberKeyMap = {
    name: 0,
    level: 1,
    class: 2,
    rank: 3,
    alt: 4,
    lastOnline: 5,
    zone: 6,
    notes: 7,
};
