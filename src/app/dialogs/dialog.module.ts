import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { DialogService } from './dialog.service';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MaterialModule } from '../material.module';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { ConfirmDialogComponent } from './confirm-dialog/confirm-dialog.component';
import { ContextMenuModule } from '../context-menu/context-menu.module';
import { InputDialogComponent } from './input-dialog/input-dialog.component';
import { NotificationDialogComponent } from './notification-dialog/notification-dialog.component';
import { AutoCompleteDialogComponent } from './autocomplete-dialog/autocomplete-dialog.component';
import { CheckboxListDialogComponent } from './checkbox-list-dialog/checkbox-list-dialog.component';
import { SelectGuildMemberDialogComponent } from './select-guild-member-dialog/select-guild-member-dialog.component';

@NgModule( {
    imports: [
        BrowserModule,
        FormsModule,
        ReactiveFormsModule,
        MaterialModule,
        BrowserAnimationsModule,
        ContextMenuModule,
    ],
    exports: [
        ConfirmDialogComponent,
        InputDialogComponent,
        NotificationDialogComponent,
        AutoCompleteDialogComponent,
        CheckboxListDialogComponent,
        SelectGuildMemberDialogComponent,
    ],
    declarations: [
        ConfirmDialogComponent,
        InputDialogComponent,
        NotificationDialogComponent,
        AutoCompleteDialogComponent,
        CheckboxListDialogComponent,
        SelectGuildMemberDialogComponent,
    ],
    providers: [
        DialogService,
    ],
} )
export class DialogModule { }
