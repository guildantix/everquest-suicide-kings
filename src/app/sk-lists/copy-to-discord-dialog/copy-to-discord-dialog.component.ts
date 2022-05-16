import { Component, Inject, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialog } from '@angular/material/dialog';
import { Observable } from 'rxjs';
import { map, startWith } from 'rxjs/operators';
import Fuse from 'fuse.js';
import * as _ from 'lodash-es';
import { IpcService } from '../../ipc.service';
import { GuildMember, ListsDatabase, SuicideKingsCharacter } from '../../core.model';
import { DialogService } from '../../dialogs/dialog.service';
import { CsvUtilities } from 'src/app/utilities/csv.utilities';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component( {
    selector: 'app-copy-to-discord-dialog',
    templateUrl: 'copy-to-discord-dialog.component.html',
    styleUrls: [ 'copy-to-discord-dialog.component.scss', '../../core.scss' ]
} )
export class CopyToDiscordDialogComponent implements OnInit {

    public discordTexts: ListToDiscord[] = [];

    constructor(
        public dialogRef: MatDialogRef<CopyToDiscordDialogComponent>,
        @Inject( MAT_DIALOG_DATA ) public data: any,
        public dialog: MatDialog,
        private ipcService: IpcService,
        private dialogService: DialogService,
        private snackBar: MatSnackBar ) {
        
    }

    ngOnInit() {
        // this.ipcService.getGuildRoster().subscribe( roster => this.roster = roster );
        this.ipcService.getMasterListsDb().subscribe( master => {
            // this.masterDb = master;
            master.masterLists.forEach( list => {
                let text = new ListToDiscord();
                text.name = list.name;
                text.numericalText = CsvUtilities.listToDiscord( list, false );
                text.alphaText = CsvUtilities.listToDiscord( list, true );
                this.discordTexts.push( text );
            } );
        } );
    }

    public filterText( text: string ): string {
        // table += `\`\`\`css\r\n.Numerical ${masterList.name}\r\n`;
        // table += '```\r\n';
        let t = text.replace( /\.(Numerical|Alphabetical) \[(.+)\]/gmi, '<span class="header">.$1 <span class="header-text">[$2]</span></span>' ).replace( /```css\r\n|```/gmi, '' ).replace(/\r\n|\n|\r/gmi, '<br />');
        t = t.replace( /(<br \/>)(\s*\d+)/gmi, '$1<span class="number">$2</span>' );
        return t;
    }

    public copyText( text: string ): void {
        this.ipcService.sendTextToClipboard( text );
        this.snackBar.open( 'Copied!', 'dismiss', { duration: 5000 } );
    }

}

export class ListToDiscord {
    public numericalText: string;
    public alphaText: string;
    public name: string;
}
