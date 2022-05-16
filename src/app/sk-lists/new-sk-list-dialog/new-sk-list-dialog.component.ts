import { Component, Inject, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialog } from '@angular/material/dialog';
import { Observable } from 'rxjs';
import { map, startWith } from 'rxjs/operators';
import Fuse from 'fuse.js';
import * as _ from 'lodash-es';
import { NewSkListModel } from './new-sk-list-dialog.model';
import { IpcService } from '../../ipc.service';
import { GuildMember } from '../../core.model';
import { DialogService } from '../../dialogs/dialog.service';
// import { Fuse } from 'fuse.js';
// import * as fz from 'fuse.js';

@Component( {
    selector: 'app-new-sk-list-dialog',
    templateUrl: 'new-sk-list-dialog.component.html',
    styleUrls: [ 'new-sk-list-dialog.component.scss', '../../core.scss' ]
} )
export class NewSkListDialogComponent implements OnInit {

    public model: NewSkListModel = new NewSkListModel();
    public roster: GuildMember[] = [];

    constructor(
        public dialogRef: MatDialogRef<NewSkListDialogComponent>,
        @Inject( MAT_DIALOG_DATA ) public data: NewSkListModel,
        public dialog: MatDialog,
        private ipcService: IpcService,
        private dialogService: DialogService ) {
        
    }

    ngOnInit() {
        this.ipcService.getGuildRoster().subscribe( roster => this.roster = roster );
    }









    
    /**
     * Selects all members not marked as alts.
     */
    selectMains() {
        this.roster.forEach( member => {
            if ( !member.alt ) {
                member.selected = true;
            }
        } );
    }









    
    /**
     * Selects all members marked as alts.
     */
    selectAlts() {
        this.roster.forEach( member => {
            if ( member.alt ) {
                member.selected = true;
            }
        } );
    }









    
    /**
     * Unselects all members.
     */
    unselectAll() {
        this.roster.forEach( member => member.selected = false );
    }









    
    /**
     * Randomizes all selected member seeds.
     */
    randomizeSeeds() {
        this.roster.forEach( member => {
            member.initialSeed = member.selected ? Math.floor( Math.random() * 1000 ) : null;
        } );
    }









    
    /**
     * Randomizes the specified member's initial seed value.
     * 
     * @param index The index of the member option.
     */
    randomizeSeed( index: number ) {
        this.roster[ index ].initialSeed = Math.floor( Math.random() * 1000 );
    }










    /**
     * Creates the the new suicide kings list from the selected member options.
     */
    createList() {
        
        this.roster.forEach( member => {
            if ( member.selected ) {
                this.model.members.push( member );
            }
        } );

        this.model.members = _.orderBy( this.model.members, f => f.initialSeed, 'desc' );
        
        this.dialogRef.close( this.model );
    }

}