import { Component, HostListener, Inject, OnInit } from '@angular/core';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { IpcService } from 'src/app/ipc.service';
import { SelectGuildMemberDialogModel } from './select-guild-member.model';
import * as _ from 'lodash-es';

@Component( {
    selector: 'app-select-guild-member-dialog',
    templateUrl: 'select-guild-member-dialog.component.html',
    styleUrls: [ 'select-guild-member-dialog.component.scss' ],
} )
export class SelectGuildMemberDialogComponent implements OnInit {

    public model: string;
    public options: string[] = [];

    constructor(
        public dialogRef: MatDialogRef<SelectGuildMemberDialogComponent>,
        @Inject( MAT_DIALOG_DATA ) public data: SelectGuildMemberDialogModel,
        public dialog: MatDialog,
        private ipcService: IpcService ) {

        this.ipcService.getGuildRoster().subscribe( roster => {
            this.options = _.filter( _.map( roster, f => f.name ), f => data.excludeNames?.indexOf( f ) === -1 );
        } );
        
    }

    ngOnInit() { }
}
