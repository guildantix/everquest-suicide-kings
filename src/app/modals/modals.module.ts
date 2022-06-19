import { HttpClientModule } from '@angular/common/http';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { RouterModule } from '@angular/router';
import { NgxElectronModule } from 'ngx-electron';
import { ContextMenuModule } from '../context-menu/context-menu.module';
import { CoreModule } from '../core/core.module';
import { DialogModule } from '../dialogs/dialog.module';
import { MaterialModule } from '../material.module';
import { appRoutes } from '../ng.routes';

import { RaidModalComponent } from './raid-modal/raid-modal.component';
import { NewRaiderDialogComponent } from './new-raider-dialog/new-raider-dialog.component';
import { MissingRaiderDialogComponent } from './missing-raider-dialog/missing-raider-dialog.component';
import { RaidSplitsDialogComponent } from './raid-splits-dialog/raid-splits-dialog.component';
import { ViewSplitsDialogComponent } from './view-splits-dialog/view-splits-dialog.component';

@NgModule( {
    imports: [
        BrowserModule,
        FormsModule,
        MaterialModule,
        NgxElectronModule,
        DialogModule,
        BrowserAnimationsModule,
        RouterModule.forRoot( appRoutes, { enableTracing: false, useHash: true } ),
        HttpClientModule,
        CoreModule,
        ContextMenuModule,
    ],
    exports: [
        RaidModalComponent
    ],
    declarations: [
        MissingRaiderDialogComponent,
        NewRaiderDialogComponent,
        RaidModalComponent,
        RaidSplitsDialogComponent,
        ViewSplitsDialogComponent,
    ],
    providers: [],
} )
export class ModalsModule { }
