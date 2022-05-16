import { Component, OnInit, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { ColoredString } from '../dialog.model';

export class ConfirmDialogTableHeader<T> {
    public headerText: string;
    public fieldName?: string;
    public predicate?: ( item: T ) => string;
}

export class ConfirmDialogModel<T> {
    public message: string | (string|ColoredString)[];
    public yesMessage: string;
    public noMessage: string;
    public tableData?: T[];
    public tableColumns?: ConfirmDialogTableHeader<T>[];
}

@Component( {
    selector: 'app-confirm-dialog',
    templateUrl: 'confirm-dialog.component.html',
    styleUrls: [ 'confirm-dialog.component.scss', '../../core.scss' ]
} )
export class ConfirmDialogComponent<T> implements OnInit {

    public messages: (string|ColoredString)[] = [];
    public get showTable(): boolean { return this.data.tableData?.length > 0 };

    constructor(
        public dialogRef: MatDialogRef<ConfirmDialogComponent<T>>,
        @Inject(MAT_DIALOG_DATA) public data: ConfirmDialogModel<T> ) { }

    ngOnInit(): void {
        console.log( 'data', this.data );
        if ( this.data.message instanceof Array ) {
            this.messages = this.data.message;
        } else if ( this.data.message ) {
            this.messages.push( this.data.message );
        } else {
            this.messages.push( 'Are you sure?' );
        }
    }

    isColoredString( msg: any ): boolean {
        return msg instanceof ColoredString;
    }

    getTableValue( header: ConfirmDialogTableHeader<T>, item: T ): string {
        if ( header.fieldName ) {
            return item[ header.fieldName ];
        } else if ( header.predicate != null ) {
            return header.predicate( item );
        } else {
            return '';
        }
    }

}
