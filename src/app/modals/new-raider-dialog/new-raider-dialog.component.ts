import { Component, Inject, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialog } from '@angular/material/dialog';
import { Observable } from 'rxjs';
import { map, startWith } from 'rxjs/operators';
import Fuse from 'fuse.js';
import * as _ from 'lodash-es';
import { IpcService } from '../../ipc.service';
import { GuildMember, SelectOption, SuicideKingsCharacter } from '../../core.model';
import { DialogService } from '../../dialogs/dialog.service';
import { NewRaiderModel, NewRaiderResultModel } from './new-raider.model';

// import { Fuse } from 'fuse.js';
// import * as fz from 'fuse.js';

@Component( {
    selector: 'app-new-raider-dialog',
    templateUrl: 'new-raider-dialog.component.html',
    styleUrls: [ 'new-raider-dialog.component.scss', '../../core.scss' ]
} )
export class NewRaiderDialogComponent implements OnInit {

    public model: SuicideKingsCharacter = new SuicideKingsCharacter();
    public roster: GuildMember[] = [];
    public listOptions: SelectOption[] = [];
    public selectedListIds: string[]=[];

    constructor(
        public dialogRef: MatDialogRef<NewRaiderDialogComponent>,
        @Inject( MAT_DIALOG_DATA ) public data: NewRaiderModel,
        public dialog: MatDialog,
        private ipcService: IpcService,
        private dialogService: DialogService ) {
        
    }

    ngOnInit() {
        this.model.name = this.data.name ? this.data.name : null;
        this.listOptions = _.map( this.data.listsDatabase.masterLists, f => {
            let opt = new SelectOption();
            opt.id = f.listId;
            opt.label = f.name;
            return opt;
        } );
    }

    createNewRaider() {
        if ( !this.model.name ) {
            this.dialogRef.close( null );

        } else if ( this.selectedListIds == null || this.selectedListIds.length === 0 ) {
            this.dialogService.showErrorDialog( 'Missing Data', 'The SK List is required.' );

        } else {
         
            let raider = this.model as NewRaiderResultModel;
            raider.listIds = this.selectedListIds;
            this.dialogRef.close( raider );
            
        }
    }
    
}