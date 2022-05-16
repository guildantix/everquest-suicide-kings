import { MasterSuicideKingsList } from "../core.model";
import * as _ from 'lodash-es';

export class CsvUtilities {

    /**
     * Returns an array of array of strings from the given csv data.
     * 
     * @param data The csv data to parse.
     */
    public static parseCsvData( data: string ): string[][] {
        let out: string[][] = [];
    
        let rows = data.split( '\r\n' );
    
        rows.forEach( row => {
            out.push( row.split( '\t' ) );
        } );
    
        return out;
    }
    
    public static listToDiscord( masterList: MasterSuicideKingsList, alpha: boolean = false ): string {
        let numerical = masterList.list.slice();
        numerical.forEach( ( n, i ) => n.rank = i + 1 );
        let alphabetical = _.sortBy( numerical, f => f.name );
        let table: string = '';
        let nDist: number = numerical.length.toString().length;
        let mDist: number = 30;
    
        if ( !alpha ) {
            table += `\`\`\`css\r\n.Numerical [${masterList.name}]\r\n`;
            for ( let i = 0; i < numerical.length; i++ ) {
                table += `${numerical[ i ].rank}`.padStart( nDist, ' ' ) + ' ' + numerical[ i ].name.substr( 0, mDist - nDist ) + '\r\n';
            }
            table += '```\r\n';
        } else {
            table += `\`\`\`css\r\n.Alphabetical [${masterList.name}]\r\n`;
            for ( let i = 0; i < alphabetical.length; i++ ) {
                table += `${alphabetical[ i ].rank}`.padStart( nDist, ' ' ) + ' ' + alphabetical[ i ].name.substr( 0, mDist - nDist ) + '\r\n';
            }
            table += '```\r\n';
        }
    
        return table;
        // this.ipcService.sendTextToClipboard( table );
        // this.snackBar.open( 'Copied!', 'dismiss', { duration: 5000 } );
    }
}
