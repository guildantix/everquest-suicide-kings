import { Component, ElementRef, Inject, OnInit, ViewChild } from '@angular/core';
import { FormControl } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialog } from '@angular/material/dialog';
import { Observable } from 'rxjs';
import { map, startWith } from 'rxjs/operators';
import Fuse from 'fuse.js';
import * as _ from 'lodash-es';
import { IpcService } from '../../ipc.service';
import { GuildMember, RaidAttendee, raidKeyMap, RaidSplit, SelectOption, SuicideKingsCharacter } from '../../core.model';
import { DialogService } from '../../dialogs/dialog.service';
import { eqskid } from '../../core/eqsk-id';
import { CsvUtilities } from 'src/app/utilities/csv.utilities';

// import { Fuse } from 'fuse.js';
// import * as fz from 'fuse.js';

@Component( {
    selector: 'app-raid-splits-dialog',
    templateUrl: 'raid-splits-dialog.component.html',
    styleUrls: [ 'raid-splits-dialog.component.scss', '../../core.scss' ]
} )
export class RaidSplitsDialogComponent implements OnInit {

    // public model: SuicideKingsCharacter = new SuicideKingsCharacter();
    // public roster: GuildMember[] = [];
    // public listOptions: SelectOption[] = [];
    // public selectedListIds: string[]=[];
    private myName: string;
    // @ViewChild( 'fileSelector' ) private fileSelector: ElementRef<HTMLInputElement>;

    constructor(
        public dialogRef: MatDialogRef<RaidSplitsDialogComponent>,
        @Inject( MAT_DIALOG_DATA ) public data: RaidSplit[],
        public dialog: MatDialog,
        private ipcService: IpcService,
        // private dialogService: DialogService,
    ) { }

    ngOnInit() {
        this.ipcService.getValue<string>( 'youCharacterName' ).subscribe( name => this.myName = name );
        // this.ipcService.
        // this.model.name = this.data.name ? this.data.name : null;
        // this.listOptions = _.map( this.data.listsDatabase.masterLists, f => {
        //     let opt = new SelectOption();
        //     opt.id = f.listId;
        //     opt.label = f.name;
        //     return opt;
        // } );
    }

    public changeSplitOwner( mine: boolean, split: RaidSplit ) {
        this.data.forEach( f => f.raidLeader = f.raidLeader === this.myName ? undefined : f.raidLeader );
        if ( mine ) {
            split.raidLeader = this.myName;
        }
    }

    public changeStandby( checked: boolean, split: RaidSplit ) {
        this.data.forEach( f => f.standby = false );
        split.standby = checked;
    }

    public addSplit(): void {
        let split = new RaidSplit();
        split.id = eqskid();
        split.name = `${this.data.length + 1}`;
        this.data.push( split );
    }

    public saveSplits(): void {
        this.dialogRef.close( this.data );
    }

    /**
     * Parses the given raid dump file and creates a new raid.
     * 
     * @param file The raid dump file.
     */
    parseRaidDump( split: RaidSplit, fileSelector: HTMLInputElement ) {
        let fileReader = new FileReader();
        
        fileReader.onload = () => {
            split.dumpRoster = this.parseRaidDumpData( fileReader.result as string );
            fileSelector.value = null;
        };

        fileReader.readAsText( fileSelector.files[ 0 ] );
    }

    /**
     * Parses the given raid dump into raid attendees.
     * 
     * @returns Returns the list of raid attendees.
     * 
     * @param data The raw csv file.
     */
    parseRaidDumpData( data: string ): RaidAttendee[] {
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

        return raidRoster;

    }
    
}