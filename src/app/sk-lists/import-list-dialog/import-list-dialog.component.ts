import { Component, Inject, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialog } from '@angular/material/dialog';
import { Observable } from 'rxjs';
import { map, startWith } from 'rxjs/operators';
import Fuse from 'fuse.js';
import * as _ from 'lodash-es';
import { IpcService } from '../../ipc.service';
import { GuildMember, SuicideKingsCharacter } from '../../core.model';
import { DialogService } from '../../dialogs/dialog.service';
// import { Fuse } from 'fuse.js';
// import * as fz from 'fuse.js';

@Component( {
    selector: 'app-import-list-dialog',
    templateUrl: 'import-list-dialog.component.html',
    styleUrls: [ 'import-list-dialog.component.scss', '../../core.scss' ]
} )
export class ImportListDialogComponent implements OnInit {

    // public model: NewSkListModel = new NewSkListModel();
    // public roster: GuildMember[] = [];
    public step: number = 0;
    public discordText: string;
    public list: SuicideKingsCharacter[] = null;
    public rosterWarning: boolean = false;

    constructor(
        public dialogRef: MatDialogRef<ImportListDialogComponent>,
        @Inject( MAT_DIALOG_DATA ) public data: any,
        public dialog: MatDialog,
        private ipcService: IpcService,
        private dialogService: DialogService ) {
        
    }

    ngOnInit() {
        // this.ipcService.getGuildRoster().subscribe( roster => this.roster = roster );
    }

    parseList() {
        // The roster will/may have class and level information.
        this.ipcService.getGuildRoster().subscribe( roster => {
            let lines = this.discordText?.split( /\r\n|\r|\n/gi );

            // Init the array.
            this.list = new Array( lines.length - 1 );

            // Skip the first line.
            for ( let i = 1; i < lines.length; i++ ) {
                let fields = lines[ i ].trim().split( ' ' );
                let no = +fields[ 0 ].trim();
                let name = fields[ 1 ].trim();
                let gi = roster.findIndex( f => f.name === name );
                let chr = new SuicideKingsCharacter();

                if ( gi > -1 ) {
                        
                    chr.class = roster[ gi ].class;
                    chr.name = name;
                    chr.level = roster[ gi ].level;

                    this.list[ no - 1 ] = chr;

                } else {
                        
                    chr.name = name;
                        
                    this.list[ no - 1 ] = chr;
                }
            }

            this.rosterWarning = _.some( this.list, f => !f.class || f.level == 0 );

            this.step = 1;
            
        } );
        
    }

    importList() {
        this.dialogRef.close( this.list );
    }

}