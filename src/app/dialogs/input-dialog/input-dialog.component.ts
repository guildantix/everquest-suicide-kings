import { Component, HostListener, Inject, OnInit } from '@angular/core';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { IpcService } from 'src/app/ipc.service';
import { ColoredString } from '../dialog.model';
import { InputDialogModel, InputDialogResponse } from './input-dialog.model';

@Component( {
    selector: 'app-input-dialog',
    templateUrl: 'input-dialog.component.html',
    styleUrls: [ 'input-dialog.component.scss' ],
} )
export class InputDialogComponent implements OnInit {

    public model: InputDialogResponse = new InputDialogResponse();
    public messages: (string|ColoredString)[] = [];

    @HostListener( 'document:keydown.enter', [ '$event' ] ) onKeydownHandler( event: KeyboardEvent ) {
        this.dialogRef.close( this.model );
    }

    constructor(
        public dialogRef: MatDialogRef<InputDialogComponent>,
        @Inject( MAT_DIALOG_DATA ) public data: InputDialogModel,
        public dialog: MatDialog,
        private ipcService: IpcService ) {
        if ( data.message instanceof Array ) {
            this.messages = data.message;
        } else {
            this.messages.push( data.message );
        }

        if ( data.defaultValue ) {
            this.model.value = data.defaultValue;
        }
    }

    ngOnInit() { }

    isColoredString( msg: any ): boolean {
        return msg instanceof ColoredString;
    }
}
