import { Component, Inject, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialog } from '@angular/material/dialog';
import { Observable } from 'rxjs';
import { map, startWith } from 'rxjs/operators';
import Fuse from 'fuse.js';
import * as _ from 'lodash-es';
import { IpcService } from '../../ipc.service';
import { GuildMember, SuicideKingsCharacter } from '../../core.model';
import { DialogService } from '../../dialogs/dialog.service';
// import { Fuse } from 'fuse.js';
// import * as fz from 'fuse.js';

@Component( {
    selector: 'app-new-character-dialog',
    templateUrl: 'new-character-dialog.component.html',
    styleUrls: [ 'new-character-dialog.component.scss', '../../core.scss' ]
} )
export class NewCharacterDialogComponent implements OnInit {

    public model: SuicideKingsCharacter = new SuicideKingsCharacter();
    public roster: GuildMember[] = [];

    constructor(
        public dialogRef: MatDialogRef<NewCharacterDialogComponent>,
        @Inject( MAT_DIALOG_DATA ) public data: any,
        public dialog: MatDialog,
        private ipcService: IpcService,
        private dialogService: DialogService ) {
        
    }

    ngOnInit() {
        
    }
    
}