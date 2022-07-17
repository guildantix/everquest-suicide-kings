import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { BrowserModule } from '@angular/platform-browser';
import { RouterModule } from '@angular/router';
import { NgxElectronModule } from 'ngx-electron';
import { MaterialModule } from '../material.module';
import { DialogModule } from '../dialogs/dialog.module';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { appRoutes } from '../ng.routes';
import { HttpClientModule } from '@angular/common/http';
import { CoreModule } from '../core/core.module';
import { ContextMenuModule } from '../context-menu/context-menu.module';

import { GuildRosterComponent } from './guild-roster/guild-roster.component';
import { MemberSuicideHistoryDialogComponent } from './member-suidice-history-dialog/member-suidice-history-dialog.component';
import { LootHistoryModalComponent } from './loot-report-modal/loot-history-modal.component';

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
        GuildRosterComponent
    ],
    declarations: [
        GuildRosterComponent,
        MemberSuicideHistoryDialogComponent,
        LootHistoryModalComponent,
    ],
    providers: [],
})
export class GuildRosterModule { }
