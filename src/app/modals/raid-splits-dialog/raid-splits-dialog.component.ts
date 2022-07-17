import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialog } from '@angular/material/dialog';
import * as _ from 'lodash-es';
import { IpcService } from '../../ipc.service';
import { RaidAttendee, raidKeyMap, RaidSplit } from '../../core.model';
import { eqskid } from '../../core/eqsk-id';
import { CsvUtilities } from 'src/app/utilities/csv.utilities';

@Component( {
    selector: 'app-raid-splits-dialog',
    templateUrl: 'raid-splits-dialog.component.html',
    styleUrls: [ 'raid-splits-dialog.component.scss', '../../core.scss' ]
} )
export class RaidSplitsDialogComponent implements OnInit {

    public myName: string;

    constructor(
        public dialogRef: MatDialogRef<RaidSplitsDialogComponent>,
        @Inject( MAT_DIALOG_DATA ) public data: RaidSplit[],
        public dialog: MatDialog,
        private ipcService: IpcService,
    ) { }

    ngOnInit() {
        this.ipcService.getValue<string>( 'youCharacterName' ).subscribe( name => this.myName = name );
    }









    
    /**
     * Modifies ownership of the given raid split.
     * 
     * @param mine True if the given split is the user's raid.
     * @param split The split the user is modifying.
     */
    public changeSplitOwner( mine: boolean, split: RaidSplit ) {
        this.data.forEach( f => f.raidLeader = f.raidLeader === this.myName ? undefined : f.raidLeader );
        if ( mine ) {
            split.raidLeader = this.myName;
        }
    }









    
    /**
     * Changes the split standby property, only allowing 1 standby per raid.
     * 
     * @param checked True, if the user is making the split the standby.
     * @param split The split the user is changing.
     */
    public changeStandby( checked: boolean, split: RaidSplit ) {
        this.data.forEach( f => f.standby = false );
        split.standby = checked;
    }









    
    /**
     * Adds a new split to the list.
     */
    public addSplit(): void {
        let split = new RaidSplit();
        split.id = eqskid();
        split.name = `${this.data.length + 1}`;
        this.data.push( split );
    }









    
    /**
     * Closes the dialog and passes the updated split data to caller.
     */
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
            split.dumpRoster = this.parseRaidDumpData( fileReader.result as string, split.id );
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
     * @param splitId The id of the raid split.
     */
    parseRaidDumpData( data: string, splitId: string ): RaidAttendee[] {
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
                attendee.splitId = splitId;
    
                raidRoster.push( attendee );
            }
    
        } );

        return raidRoster;

    }
    
}
