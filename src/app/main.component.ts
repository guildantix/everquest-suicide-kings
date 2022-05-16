import { Component, ViewChild, ElementRef, OnInit } from '@angular/core';
import * as _ from 'lodash-es';
import { MatSnackBar } from '@angular/material/snack-bar';
import { IpcService } from './ipc.service';
import { DialogService } from './dialogs/dialog.service';
import { customAlphabet } from 'nanoid';
const alphabet = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
const nanoid = customAlphabet( alphabet, 16 );
import { MatTable } from '@angular/material/table';
import { SkListsComponent } from './sk-lists/sk-lists/sk-lists.component';
import { SettingsComponent } from './settings/settings.component';
import { GuildRosterComponent } from './guild-roster/guild-roster/guild-roster.component';
import { AttendanceComponent } from './attendance/attendance.component';

interface IPhoneticTransform {
    id: string;
    originalText?: string;
    phoneticText?: string;
}

@Component( {
    selector: 'app-main',
    templateUrl: 'main.component.html',
    styleUrls: [ 'main.component.scss', 'core.scss' ]
} )
export class MainComponent implements OnInit {

    public msg: string;
    public isDev: boolean = false;

    @ViewChild( 'skLists', { static: true } ) private skLists: SkListsComponent;
    @ViewChild( 'settingsComponent', { static: true } ) private settingsComponent: SettingsComponent;
    @ViewChild( 'guildRoster', { static: true } ) private guildRoster: GuildRosterComponent;
    @ViewChild( 'attendance', { static: true } ) private attendance: AttendanceComponent;

    constructor( private snackBar: MatSnackBar, private ipcService: IpcService, private dialogService: DialogService )
    { }

    ngOnInit(): void {

        this.ipcService.tickReceived().subscribe( data => {
            
        } );

        this.ipcService.consoleLogRequested().subscribe( data => console.log( 'from main', data ) );
        this.ipcService.getAppIsDev().subscribe( isDev => this.isDev = isDev );
        
    }









    
    /**
     * Closes the application.
     */
    quitApp(): void {
        this.ipcService.quitApp();
    }









    
    /**
     * Minimizes the application to the taskbar.
     */
    minimizeTaskbar(): void {
        this.ipcService.minimizeApp();
    }










    /**
     * Executes events based on the user selected tab index.
     * 
     * @param selectedIndex The new tab index.
     */
    onChangeTabs( selectedIndex: number ): void {
        if ( selectedIndex === 0 ) {
            this.skLists.reload();
        } else if ( selectedIndex === 1 ) {
            this.guildRoster.reload();
        } else if ( selectedIndex === 2 ) {
            this.attendance.reload();
        } else if ( selectedIndex === 2 ) {
            this.settingsComponent.reload();
        }
    }

}
