import { Injectable } from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { ConfirmDialogComponent, ConfirmDialogModel, ConfirmDialogTableHeader } from './confirm-dialog/confirm-dialog.component';
import { Observable } from 'rxjs';
import { InputDialogComponent } from './input-dialog/input-dialog.component';
import { InputDialogModel, InputDialogResponse } from './input-dialog/input-dialog.model';
import { NotificationDialogModel, NotificationTypes } from './notification-dialog/notification-dialog.model';
import { NotificationDialogComponent } from './notification-dialog/notification-dialog.component';
import { AutocompleteDialogModel } from './autocomplete-dialog/autocomplete-dialog.model';
import { AutoCompleteDialogComponent } from './autocomplete-dialog/autocomplete-dialog.component';
import { Selectable } from '../core.model';
import { CheckboxListDialogModel } from './checkbox-list-dialog/checkbox-list-dialog.model';
import { CheckboxListDialogComponent } from './checkbox-list-dialog/checkbox-list-dialog.component';
import { ColoredString } from './dialog.model';
import { IpcService } from '../ipc.service';
import { SelectGuildMemberDialogModel } from './select-guild-member-dialog/select-guild-member.model';
import { SelectGuildMemberDialogComponent } from './select-guild-member-dialog/select-guild-member-dialog.component';

@Injectable()
export class DialogService {

    private ignoredInfoDialogs: Record<string, boolean> = {};

    constructor( private dialog: MatDialog, private ipcService: IpcService ) {
        window.setTimeout( () => { ipcService.getIgnoredWarnings().subscribe( r => this.ignoredInfoDialogs = r ); }, 1500 );
    }










    /**
     * Displays a confirmation dialog to the user.
     * 
     * @param title The title of the confirmation dialog.
     * @param message The question to display to the user.
     * @param yesText The description of the action taken when the user confirms the question.
     * @param noText The description of the action taken when the user declines the question.
     * @param onClose This function is executed after the user makes their decision and the decision is passed as the confirmed parameter.
     */
    public showAskDialog( title: string, message: string | (string|ColoredString)[], yesText: string, noText: string, onClose: ( confirmed: boolean ) => void ): void {
        
        let dialogRef: MatDialogRef<ConfirmDialogComponent<any>> = this.dialog.open( ConfirmDialogComponent, {
            width: '550px',
            data: {
                title: title ?? 'Confirm',
                message: message,
                yesMessage: yesText,
                noMessage: noText
            },
            panelClass: 'app-dialog',
        } );

        let af = dialogRef.afterClosed();

        af.subscribe( onClose );
        af.subscribe( e => {

            if ( document.activeElement instanceof HTMLElement ) {
                // This is a workaround to prevent the error:
                // 
                //      ExpressionChangedAfterItHasBeenCheckedError: Expression has changed after it was checked. Previous value for 'mat-form-field-should-float': 'false'. Current value: 'true'.
                //
                // I'm sure there's some deeper meaning behind it, but for some 
                // reason when the confirm dialog's `Yes` button is still the 
                // active element at this point, that error is written to the 
                // console.
                // This error only happens when a list is reloaded after.
                document.activeElement.blur();
            }

        } );
        
    }










    /**
     * Displays a confirmation dialog to the user.
     * 
     * @param message The question to display to the user.
     * @param yesText The description of the action taken when the user confirms the question.
     * @param noText The description of the action taken when the user declines the question.
     * @param onClose This function is executed after the user makes their decision and the decision is passed as the confirmed parameter.
     */
    public showConfirmDialog( message: string | (string|ColoredString)[], yesText: string, noText: string, onClose: ( confirmed: boolean ) => void ): void {
        
        let dialogRef: MatDialogRef<ConfirmDialogComponent<any>> = this.dialog.open<ConfirmDialogComponent<any>, ConfirmDialogModel<any>>( ConfirmDialogComponent, {
            width: '550px',
            data: {
                message: message,
                yesMessage: yesText,
                noMessage: noText
            },
            panelClass: 'app-dialog',
        } );

        let af = dialogRef.afterClosed();

        af.subscribe( onClose );
        af.subscribe( e => {

            if ( document.activeElement instanceof HTMLElement ) {
                // This is a workaround to prevent the error:
                // 
                //      ExpressionChangedAfterItHasBeenCheckedError: Expression has changed after it was checked. Previous value for 'mat-form-field-should-float': 'false'. Current value: 'true'.
                //
                // I'm sure there's some deeper meaning behind it, but for some 
                // reason when the confirm dialog's `Yes` button is still the 
                // active element at this point, that error is written to the 
                // console.
                // This error only happens when a list is reloaded after.
                document.activeElement.blur();
            }

        } );
        
    }









    
    /**
     * Displays a confirmation dialog to the user that includes tabular display of data.
     * 
     * @param tableData The data to display in a table.
     * @param headers The column descriptors for each row.
     * @param message The question to display to the user.
     * @param yesText The description of the action taken when the user confirms the question.
     * @param noText The description of the action taken when the user declines the question.
     */
    public showConfirmTable<T>( tableData: T[], headers: ConfirmDialogTableHeader<T>[], message: string | ( string | ColoredString )[], yesText: string, noText: string ): Observable<boolean> {

        let ref = this.dialog.open<ConfirmDialogComponent<T>, ConfirmDialogModel<T>, boolean>( ConfirmDialogComponent, {
            width: '550px',
            data: {
                message: message,
                yesMessage: yesText,
                noMessage: noText,
                tableData: tableData,
                tableColumns: headers,
            },
            panelClass: 'app-dialog',
        } );

        ref.afterClosed().subscribe( e => {

            if ( document.activeElement instanceof HTMLElement ) {
                // This is a workaround to prevent the error:
                // 
                //      ExpressionChangedAfterItHasBeenCheckedError: Expression has changed after it was checked. Previous value for 'mat-form-field-should-float': 'false'. Current value: 'true'.
                //
                // I'm sure there's some deeper meaning behind it, but for some 
                // reason when the confirm dialog's `Yes` button is still the 
                // active element at this point, that error is written to the 
                // console.
                // This error only happens when a list is reloaded after.
                document.activeElement.blur();
            }

        } );

        return ref.afterClosed();
    }










    /**
     * Shows a simple dialog with an input.
     * 
     * @param title The title for the dialog.
     * @param message Instructions to the user.
     * @param label Placeholder/label for the input.
     * @param hint Any additional information related to the request and how to fulfill it.
     */
    public showInputDialog( title: string, message: string | string[], label?: string, hint?: string, defaultValue?: string, checkboxLabel: string = null ): Observable<InputDialogResponse> {
        let data: InputDialogModel = new InputDialogModel();
        
        data.title = title;
        data.message = message;
        data.label = label;
        data.hint = hint;
        data.defaultValue = defaultValue;
        data.showCheckBox = checkboxLabel?.length > 0;
        data.checkboxLabel = checkboxLabel;
        
        return this.dialog.open<InputDialogComponent, any, InputDialogResponse>( InputDialogComponent, {
            width: '450px',
            data: data,
            panelClass: 'app-dialog',
        } ).afterClosed();
    }









    
    /**
     * Displays the select guild member dialog.
     * 
     * @param title The title of the window.
     * @param excludeNames The names of members to exclude from the list.
     * @param label The input label.
     * @param hint The hint text for the dropdown.
     */
    public showSelectGuildMemberDialog( title: string, excludeNames: string | string[], label?: string, hint?: string, ): Observable<string> {
        let data: SelectGuildMemberDialogModel = new SelectGuildMemberDialogModel();
        
        data.title = title;
        data.excludeNames = excludeNames instanceof Array ? excludeNames : [ excludeNames ];
        data.label = label;
        data.hint = hint;

        return this.dialog.open<SelectGuildMemberDialogComponent, any, string>( SelectGuildMemberDialogComponent, {
            width: '450px',
            data: data,
            panelClass: 'app-dialog',
        } ).afterClosed();
    }










    /**
     * Shows a simple dialog with an input with an autocomplete.
     * 
     * @param title The title for the dialog.
     * @param message Instructions to the user.
     * @param options The available options.
     * @param label Placeholder/label for the input.
     * @param hint Any additional information related to the request and how to fulfill it.
     */
    public showAutocompleteDialog( title: string, message: string | string[], options: string[], label?: string, hint?: string, ): Observable<string> {
        let data: AutocompleteDialogModel = new AutocompleteDialogModel();
        
        data.title = title;
        data.message = message;
        data.label = label;
        data.hint = hint;
        data.options = options;

        return this.dialog.open<AutoCompleteDialogComponent, any, string>( AutoCompleteDialogComponent, {
            width: '450px',
            data: data,
            panelClass: 'app-dialog',
        } ).afterClosed();
        
    }
    








    
    /**
     * 
     * @param title The title for the dialog.
     * @param message Instructions to the user.
     * @param options The available options.
     * @param affirmativeText The button text for the 'Ok' button.
     * @param negativeText The button text for the 'Cancel' button.
     * @param otherText The button text for the 'Other' button.
     * 
     * @returns Returns the options list if affirmative, null if negative, and undefined if other.
     */
    public showCheckboxListDialog<T extends Selectable>( title: string, message: string | string[], options: T[], affirmativeText?: string, negativeText?: string, otherText?: string ): Observable<T[]> {
        let data: CheckboxListDialogModel<T> = new CheckboxListDialogModel<T>();
        
        data.title = title;
        data.message = message;
        data.options = options;
        data.affirmativeText = affirmativeText ? affirmativeText : data.affirmativeText;
        data.negativeText = negativeText ? negativeText : data.negativeText;
        data.otherText = otherText ? otherText : null;

        return this.dialog.open<CheckboxListDialogComponent<T>, any, T[]>( CheckboxListDialogComponent, {
            width: data.otherText?.length > 0 ? '640px' : '450px',
            data: data,
            panelClass: 'app-dialog',
        } ).afterClosed();
        
    }
    









    public showWarningDialog( title: string, message: string | string[] ): void {
        let data: NotificationDialogModel = new NotificationDialogModel();
        
        data.title = title;
        data.message = message;
        data.notificationType = NotificationTypes.Warning;
        data.showHideCheckbox = false;

        this.dialog.open( NotificationDialogComponent, {
            width: '450px',
            data: data,
            panelClass: 'app-dialog',
        } ).afterClosed().subscribe();
    }
    
    /**
     * Displays an info dialog to the user.
     * 
     * @param title The title of this information dialog.
     * @param message The message(s) to display to the user.
     * @param hwnd A unique identifier for this information, which allows the user to ignore this dialog in the future.
     */
    public showInfoDialog( title: string, message: string | string[], hwnd?: string ): void {
        if ( hwnd == null || !this.ignoredInfoDialogs[ hwnd ] ) {
            let data: NotificationDialogModel = new NotificationDialogModel();

            data.title = title;
            data.message = message;
            data.notificationType = NotificationTypes.Information;
            data.showHideCheckbox = hwnd != null;

            this.dialog.open( NotificationDialogComponent, {
                width: '550px',
                data: data,
                panelClass: 'app-dialog',
            } ).afterClosed().subscribe( ignoreWarnings => {
                if ( ignoreWarnings ) {
                    this.ignoredInfoDialogs[ hwnd ] = true;
                    this.ipcService.storeIgnoredWarnings( this.ignoredInfoDialogs );
                }
            } );
        }
    }
    
    public showNoteDialog( title: string, message: string | string[] ): void {
        
        let data: NotificationDialogModel = new NotificationDialogModel();

        data.title = title;
        data.message = message;
        data.notificationType = NotificationTypes.Note;
        data.showHideCheckbox = false;

        this.dialog.open( NotificationDialogComponent, {
            width: '550px',
            data: data,
            panelClass: 'app-dialog',
        } ).afterClosed().subscribe( ignoreWarnings => {
        } );
    }
    
    public showErrorDialog( title: string, message: string | string[] ): void {
        let data: NotificationDialogModel = new NotificationDialogModel();
        
        data.title = title;
        data.message = message;
        data.notificationType = NotificationTypes.Error;
        data.showHideCheckbox = false;

        this.dialog.open( NotificationDialogComponent, {
            width: '450px',
            data: data,
            panelClass: 'app-dialog',
        } ).afterClosed().subscribe();
    }

    public showExceptionDialog( errorId: string, error: Error, title?: string, message?: string | string[] ) {
        let data: NotificationDialogModel = new NotificationDialogModel();
        
        data.title = title ?? 'Error!';
        data.message = message;
        data.notificationType = NotificationTypes.Error;
        data.showHideCheckbox = false;
        data.error = error;
        data.errorId = errorId;

        this.dialog.open( NotificationDialogComponent, {
            width: '450px',
            data: data,
            panelClass: 'app-dialog',
        } ).afterClosed().subscribe();
    }
    
}
