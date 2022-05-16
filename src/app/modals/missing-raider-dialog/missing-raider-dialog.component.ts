import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialog } from '@angular/material/dialog';
import { SelectOption } from 'src/app/core.model';
import { DialogService } from 'src/app/dialogs/dialog.service';
import { IpcService } from 'src/app/ipc.service';
import { NewRaiderModel } from '../new-raider-dialog/new-raider.model';
import { MissingRaidersModel } from './missing-raider.model';
import * as _ from 'lodash-es';

@Component( {
    selector: 'app-missing-raider-dialog',
    templateUrl: 'missing-raider-dialog.component.html',
    styleUrls: [ 'missing-raider-dialog.component.scss', '../../core.scss' ]
} )
export class MissingRaiderDialogComponent implements OnInit {
    
    public listOptions: SelectOption[] = [];

    constructor(
        public dialogRef: MatDialogRef<MissingRaiderDialogComponent>,
        @Inject( MAT_DIALOG_DATA ) public data: MissingRaidersModel,
        public dialog: MatDialog,
        private ipcService: IpcService,
        private dialogService: DialogService ) { }
    
    ngOnInit() {
        this.listOptions = _.map( this.data.listsDatabase.masterLists, f => {
            let opt = new SelectOption();
            opt.id = f.listId;
            opt.label = f.name;
            return opt;
        } );
    }

    addNewRaiders() {
        this.dialogRef.close( this.data );
    }

}
