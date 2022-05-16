import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { BrowserModule } from '@angular/platform-browser';
import { NgxElectronModule } from 'ngx-electron';
import { MaterialModule } from '../material.module';
import { DialogModule } from '../dialogs/dialog.module';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { HttpClientModule } from '@angular/common/http';
import { CoreModule } from '../core/core.module';
import { ContextMenuModule } from '../context-menu/context-menu.module';

import { SkListsComponent } from './sk-lists/sk-lists.component';
import { NewSkListDialogComponent } from './new-sk-list-dialog/new-sk-list-dialog.component';
import { NewCharacterDialogComponent } from './new-character-dialog/new-character-dialog.component';
import { ImportListDialogComponent } from './import-list-dialog/import-list-dialog.component';
import { CopyToDiscordDialogComponent } from './copy-to-discord-dialog/copy-to-discord-dialog.component';
import { MasterListHistoryDialogComponent } from './master-list-history-dialog/master-list-history-dialog.component';

@NgModule({
    imports: [
        BrowserModule,
        FormsModule,
        MaterialModule,
        NgxElectronModule,
        DialogModule,
        BrowserAnimationsModule,
        HttpClientModule,
        CoreModule,
        ContextMenuModule,
    ],
    exports: [
        SkListsComponent
    ],
    declarations: [
        SkListsComponent,
        NewSkListDialogComponent,
        NewCharacterDialogComponent,
        ImportListDialogComponent,
        CopyToDiscordDialogComponent,
        MasterListHistoryDialogComponent,
    ],
    providers: [],
})
export class SkListsModule { }
