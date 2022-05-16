import { Component, Inject, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialog } from '@angular/material/dialog';
import { Observable } from 'rxjs';
import { map, startWith } from 'rxjs/operators';
import Fuse from 'fuse.js';
import * as _ from 'lodash-es';
import { IpcService } from '../../ipc.service';
import { GuildMember, ListsDatabase, Suicide, SuicideKingsCharacter } from '../../core.model';
import { DialogService } from '../../dialogs/dialog.service';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component( {
    selector: 'app-member-suidice-history-dialog',
    templateUrl: 'member-suidice-history-dialog.component.html',
    styleUrls: [ 'member-suidice-history-dialog.component.scss', '../../core.scss' ]
} )
export class MemberSuicideHistoryDialogComponent implements OnInit {

    public suicides: Suicide[] = [];

    constructor(
        public dialogRef: MatDialogRef<MemberSuicideHistoryDialogComponent>,
        @Inject( MAT_DIALOG_DATA ) public data: string,
        public dialog: MatDialog,
        private ipcService: IpcService,
        private dialogService: DialogService,
        private snackBar: MatSnackBar ) {
        
    }

    ngOnInit() {
        this.ipcService.getGuildRoster().subscribe( roster => {
            roster.forEach( member => {
                if ( member.name === this.data ) {
                    this.suicides = member.suicides;
                }
            } );
        } );
    }

}
