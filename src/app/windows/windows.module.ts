import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MaterialModule } from '../material.module';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { ContextMenuModule } from '../context-menu/context-menu.module';

import { DialogModule } from '../dialogs/dialog.module';

@NgModule({
    imports: [
        BrowserModule,
        FormsModule,
        ReactiveFormsModule,
        MaterialModule,
        BrowserAnimationsModule,
        ContextMenuModule,
        DialogModule,
    ],
    exports: [
    ],
    declarations: [
    ],
    providers: [],
})
export class WindowsModule { }
