import { Component, OnInit } from '@angular/core';
import { GuildMember } from 'src/app/core.model';
import { IpcService } from 'src/app/ipc.service';
import * as _ from 'lodash-es';

interface ILootedItem {
    name: string;
    count: number;
}

interface IGuildMemberLoot {
    name: string;
    lootHistory: ILootedItem[];
}

@Component( {
    selector: 'app-loot-history-modal',
    templateUrl: 'loot-history-modal.component.html',
    styleUrls: [ 'loot-history-modal.component.scss', '../../core.scss', '../../modal.scss' ]
} )
export class LootHistoryModalComponent implements OnInit {

    // public roster: GuildMember[] = [];
    public memberLoots: IGuildMemberLoot[] = [];
    
    constructor(
        private ipcService: IpcService,
    ) { }

    ngOnInit() {
        this.ipcService
            .getGuildRoster()
            .subscribe( members => {
                this.memberLoots = members.map( member => {
                    let g = _.groupBy( member.suicides, f => f.item );
                    let loot: ILootedItem[] = [];

                    for ( let key in g ) {
                        loot.push( {
                            name: key == 'undefined' ? 'Unspecified' : key,
                            count: g[ key ].length,
                        } );
                    }

                    return {
                        name: member.name,
                        lootHistory: loot.filter( f => f.name !== 'Unspecified' ),
                    };
                } ).filter( f => f.lootHistory?.length > 0 );
            } );
    }

    /**
     * Closes this window.
     */
    public closeModal(): void {
        this.ipcService.closeThisChild();
    }
}
