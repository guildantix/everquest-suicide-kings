import { Component, Inject, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialog } from '@angular/material/dialog';
import { Observable } from 'rxjs';
import { map, startWith } from 'rxjs/operators';
import Fuse from 'fuse.js';
import * as _ from 'lodash-es';
import { IpcService } from '../../ipc.service';
import { GuildMember, RaidSplit, SelectOption, SuicideKingsCharacter } from '../../core.model';
import { DialogService } from '../../dialogs/dialog.service';
import { eqskid } from '../../core/eqsk-id';

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

    public changeSplitOwner( mine: boolean, split: RaidSplit ): void {
        this.data.forEach( f => f.raidLeader = f.raidLeader === this.myName ? undefined : f.raidLeader );
        if ( mine ) {
            split.raidLeader = this.myName;
        }
    }

    public addSplit(): void {
        let split = new RaidSplit();
        split.id = eqskid();
        this.data.push( split );
    }

    public saveSplits(): void {
        this.dialogRef.close( this.data );
    }

    // createNewRaider() {
    //     if ( !this.model.name ) {
    //         this.dialogRef.close( null );

    //     } else if ( this.selectedListIds == null || this.selectedListIds.length === 0 ) {
    //         this.dialogService.showErrorDialog( 'Missing Data', 'The SK List is required.' );

    //     } else {
         
    //         let raider = this.model as NewRaiderResultModel;
    //         raider.listIds = this.selectedListIds;
    //         this.dialogRef.close( raider );
            
    //     }
    // }
    
}