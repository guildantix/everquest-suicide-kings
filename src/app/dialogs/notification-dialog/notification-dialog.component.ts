import { Component, Inject, OnInit } from '@angular/core';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { IpcService } from 'src/app/ipc.service';
import { DialogService } from '../dialog.service';
// import { IpcService } from 'src/app/ipc.service';
import { NotificationDialogModel, NotificationTypes } from './notification-dialog.model';

@Component( {
    selector: 'app-notification-dialog',
    templateUrl: 'notification-dialog.component.html',
    styleUrls: [ 'notification-dialog.component.scss' ],
} )
export class NotificationDialogComponent implements OnInit {

    public model: string;
    public messages: string[] = [];
    public notificationTypes: typeof NotificationTypes = NotificationTypes;
    public ignoreFutureWarnings: boolean = false;

    constructor(
        public dialogRef: MatDialogRef<NotificationDialogComponent>,
        @Inject( MAT_DIALOG_DATA ) public data: NotificationDialogModel,
        public dialog: MatDialog,
        public snackBar: MatSnackBar,
        public ipcService: IpcService ) {
        
        if ( data.message instanceof Array ) {
            this.messages = data.message;
        } else {
            this.messages.push( data.message );
        }

        if ( data.error && data.error instanceof Error ) {
            this.messages.push( data.error.message );
        } else if ( data.error && typeof data.error === 'string' ) {
            this.messages.push( data.error );
            data.error = null;

        }
    }

    ngOnInit() { }

    public copyErrorInformation() {
        if ( this.data.error ) {
            this.ipcService.sendTextToClipboard( JSON.stringify( { errorId: this.data.errorId, message: this.data.error.message, name: this.data.error.name, stack: this.data.error.stack } ) );
            this.snackBar.open(
                'The error details have been copied to your clipboard.\r\nYou can paste that into an email or Discord message to send to the developers.',
                'dismiss',
                { duration: 15000, panelClass: [ 'error-details-snackbar' ] } );
        }
    }
}
