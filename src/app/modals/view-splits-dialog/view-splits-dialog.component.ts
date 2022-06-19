import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialog } from '@angular/material/dialog';
import * as _ from 'lodash-es';
import { IpcService } from '../../ipc.service';
import { RaidAttendee, raidKeyMap, RaidMember, RaidSplit } from '../../core.model';
import { eqskid } from '../../core/eqsk-id';

@Component( {
    selector: 'app-raid-splits-dialog',
    templateUrl: 'view-splits-dialog.component.html',
    styleUrls: [ 'view-splits-dialog.component.scss', '../../core.scss' ]
} )
export class ViewSplitsDialogComponent implements OnInit {

    constructor(
        public dialogRef: MatDialogRef<ViewSplitsDialogComponent>,
        @Inject( MAT_DIALOG_DATA ) public data: { splits: RaidSplit[], raiders: RaidMember[] },
        public dialog: MatDialog,
        private ipcService: IpcService,
    ) { }

    ngOnInit() {
        console.log( 'data in', this.data );
    }

    public getSplitMembers( splitId: string ): RaidMember[] {
        console.log( 'split id', splitId );
        return this.data.raiders.filter( f => f.splitId === splitId );
    }
    
}
