import { Component, Inject, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialog } from '@angular/material/dialog';
import { Observable } from 'rxjs';
import { map, startWith } from 'rxjs/operators';
import { InputDialogComponent } from '../input-dialog/input-dialog.component';
import Fuse from 'fuse.js';
import * as _ from 'lodash-es';
import { Selectable } from '../../core.model';
import { CheckboxListDialogModel } from './checkbox-list-dialog.model';
// import { Fuse } from 'fuse.js';
// import * as fz from 'fuse.js';

@Component( {
    selector: 'app-checkbox-list',
    templateUrl: 'checkbox-list-dialog.component.html',
    styleUrls: [ 'checkbox-list-dialog.component.scss' ]
} )
export class CheckboxListDialogComponent<T extends Selectable> implements OnInit {

    public messages: string[] = [];
    public options: T[] = [];

    constructor(
        public dialogRef: MatDialogRef<CheckboxListDialogComponent<T>>,
        @Inject( MAT_DIALOG_DATA ) public data: CheckboxListDialogModel<T>,
        public dialog: MatDialog ) {
        
        if ( data.message instanceof Array ) {
            this.messages = data.message;
        } else {
            this.messages.push( data.message );
        }

        this.options = data.options;
    }

    ngOnInit() {

    }

}