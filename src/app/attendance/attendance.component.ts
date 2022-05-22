import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { GuildMember, ListsDatabase, Raid } from '../core.model';
import { DialogService } from '../dialogs/dialog.service';
import { IpcService } from '../ipc.service';
import { MathUtilities } from '../utilities/math.utilities';
import * as _ from 'lodash-es';
import { forkJoin } from 'rxjs';
import { DateUtilities } from '../utilities/date.utilities';

interface IAttendance extends GuildMember {
    countPercent: number;
    thirtyDays: string;
    sixtyDays: string;
    ninetyDays: string;
    allTime: string;
    trackedRaids: string;
    suicideCount: number;
    totalRaids: number;
    lists: string;
}

interface IRaidAttendance {
    raidId: string;
    date: Date;
    attendees: string[];
    thirtyDay: boolean;
    sixtyDay: boolean;
    ninetyDay: boolean;
}

@Component( {
    selector: 'app-attendance',
    templateUrl: 'attendance.component.html',
    styleUrls: [ 'attendance.component.scss', '../core.scss' ]
} )
export class AttendanceComponent implements OnInit {

    public searchTerm: string;

    public roster: IAttendance[] = [];
    public raids: Raid[] = [];
    public listsDb: ListsDatabase;
    public raidTrackingCount: number;
    public showNonRaiders: boolean = false;
    public rankOptions: string[] = [];
    public selectedRank: string = null;
    public classOptions: string[] = [];
    public selectedClass: string = null;

    public get filteredRoster(): IAttendance[] {

        return _.filter( this.roster, ( f: IAttendance ) =>
            !f.placeholder &&
            ( this.searchTerm == null || f.name?.toLowerCase().indexOf( this.searchTerm.toLowerCase() ) > -1 ) &&
            ( this.showNonRaiders || f.totalRaids > 0 ) &&
            ( this.selectedRank == null || f.rank === this.selectedRank ) &&
            ( this.selectedClass == null || f.class === this.selectedClass ) );
        
    }

    constructor(
        private ipcService: IpcService,
        private dialogService: DialogService,
        private dialog: MatDialog
    ) { }

    ngOnInit() {
        this.ipcService.getValue<number>( 'raidTrackingCount' ).subscribe( raidTrackingCount => this.raidTrackingCount = raidTrackingCount );
    }










    /**
     * Populates the data on the screen.
     */
    loadData() {
        forkJoin( {
            roster: this.ipcService.getGuildRoster(),
            raids: this.ipcService.getRaids(),
            masterLists: this.ipcService.getMasterListsDb(),
            raidTrackingCount: this.ipcService.getValue<number>('raidTrackingCount'),
        } ).subscribe( results => {
            this.raidTrackingCount = results.raidTrackingCount;
            this.roster = [];
            this.raids = results.raids;
            this.listsDb = results.masterLists;
            this.rankOptions = _.uniq( results.roster.map( f => f.rank ) ).filter( f => f != null );
            this.classOptions = _.uniq( results.roster.map( f => f.class ) ).filter( f => f != null );
            
            let now = new Date( new Date().toISOString() );
            let thirtyDays = DateUtilities.addDays( now, -30 );
            let sixtyDays = DateUtilities.addDays( now, -60 );
            let ninetyDays = DateUtilities.addDays( now, -90 );

            let thirtyDayRaidCount = results.raids.filter( f => new Date( f.date ) >= thirtyDays ).length;
            let sixtyDayRaidCount = results.raids.filter( f => new Date( f.date ) >= sixtyDays ).length;
            let ninetyDayRaidCount = results.raids.filter( f => new Date( f.date ) >= ninetyDays ).length;
            let allRaidCount = results.raids.length;
            let trackedRaidCount = results.raids.length < this.raidTrackingCount ? results.raids.length : this.raidTrackingCount;

            let raidAttendances: IRaidAttendance[] = [];

            results.raids.forEach( raid => {
                let raidDate = new Date( raid.date );
                let raidAttendance: IRaidAttendance = {
                    date: raidDate,
                    raidId: raid.raidId,
                    attendees: [],
                    thirtyDay: raidDate >= thirtyDays ? true : false,
                    sixtyDay: raidDate >= sixtyDays ? true : false,
                    ninetyDay: raidDate >= ninetyDays ? true : false,
                };

                results.masterLists.masterLists.forEach( master => {
                    master.history.forEach( history => {
                        if ( history.raidId === raid.raidId && !history.excludeAttendance ) {
                            history.activeIndices.forEach( i => {
                                let name = history.list[ i ].name;
                                if ( raidAttendance.attendees.indexOf( name ) === -1 ) {
                                    raidAttendance.attendees.push( name );
                                }
                            } );
                        }
                    } );
                } );

                raidAttendances.push( raidAttendance );
            } );

            results.roster.forEach( member => {
                let attendee = member as IAttendance;
                let thirtyCount = raidAttendances.filter( f => f.thirtyDay ).filter( f => f.attendees.indexOf( member.name ) > -1 )?.length;
                let sixtyCount = raidAttendances.filter( f => f.sixtyDay ).filter( f => f.attendees.indexOf( member.name ) > -1 )?.length;
                let ninetyCount = raidAttendances.filter( f => f.ninetyDay ).filter( f => f.attendees.indexOf( member.name ) > -1 )?.length;
                let allCount = raidAttendances.filter( f => f.attendees.indexOf( member.name ) > -1 )?.length;
                let trackedCount = raidAttendances.filter( ( raid, i ) => ( i >= raidAttendances.length - this.raidTrackingCount ) && raid.attendees.indexOf( member.name ) > -1 )?.length;

                attendee.thirtyDays = thirtyDayRaidCount > 0 ? ( thirtyCount / thirtyDayRaidCount * 100 ).toFixed( 2 ) : '';
                attendee.sixtyDays = sixtyDayRaidCount > 0 ? ( sixtyCount / sixtyDayRaidCount * 100 ).toFixed( 2 ) : '';
                attendee.ninetyDays = ninetyDayRaidCount > 0 ? ( ninetyCount / ninetyDayRaidCount * 100 ).toFixed( 2 ) : '';
                attendee.allTime = allRaidCount > 0 ? ( allCount / allRaidCount * 100 ).toFixed( 2 ) : '';
                attendee.trackedRaids = trackedRaidCount > 0 ? ( trackedCount / trackedRaidCount * 100 ).toFixed( 2 ) : '';
                attendee.totalRaids = allCount;
                attendee.suicideCount = member.suicides?.length;
                attendee.lists = results.masterLists.masterLists.filter( f => f.list.findIndex( x => x.name === member.name ) > -1 ).map( f => f.name ).join( ', ' );

                this.roster.push( attendee );
            } );

            this.roster = _.sortBy( this.roster, f => f.name );

        } );
    }









    
    /**
     * Repopulates the data on the screen.
     */
    reload() {
        this.loadData();
    }
    
}