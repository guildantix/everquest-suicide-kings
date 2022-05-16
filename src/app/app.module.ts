import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { MaterialModule } from './material.module';
import { DialogModule } from './dialogs/dialog.module';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { AppComponent } from './app.component';
import { FormsModule } from '@angular/forms';
import { MainComponent } from './main.component';
import { RouterModule, Routes } from '@angular/router';
import { appRoutes } from './ng.routes';
import { HttpClientModule } from '@angular/common/http';
import { NgxElectronModule } from 'ngx-electron';
import { ContextMenuModule } from './context-menu/context-menu.module';
import { ClassNamePipe } from './pipes/class-name.pipe';
import { WindowsModule } from './windows/windows.module';
import { IpcService } from './ipc.service';
import { CoreModule } from './core/core.module';
import { GuildRosterModule } from './guild-roster/guild-roster.module';
import { SkListsModule } from './sk-lists/sk-lists.modules';
import { SettingsComponent } from './settings/settings.component';
import { ModalsModule } from './modals/modals.module';
import { AttendanceComponent } from './attendance/attendance.component';

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
        WindowsModule,
        GuildRosterModule,
        SkListsModule,
        ModalsModule
    ],
    declarations: [
        AppComponent,
        ClassNamePipe,
        MainComponent,
        SettingsComponent,
        AttendanceComponent,
    ],
    providers: [
        IpcService,
    ],
    bootstrap: [ AppComponent ],
} )
export class AppModule { }
