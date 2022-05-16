import { Injectable, NgZone } from '@angular/core';
import { Observable, Observer } from 'rxjs';
import { IpcRenderer } from 'electron';
import { ContextMenuComponent } from './context-menu.component';

@Injectable()
export class ContextService {

    private ipc: IpcRenderer;
    private openedMenu: ContextMenuComponent;

    constructor( private ngZone: NgZone ) {
        this.ipc = ( <any>window ).require( 'electron' ).ipcRenderer;
    }

    private copyProperties( source: any, target: any, keys: string[] ): void {

        for ( const key of keys ) {
            target[ key ] = source[ key ];
        }
        
    }

    private get<T>( key: string ): Observable<T> {
        let obs: Observable<T> = new Observable<T>( ( observer: Observer<T> ) => {
            
            this.ipc.once( 'context:get:pseudo-clipboard', ( e, model ) => {
                this.ngZone.run( () => {
                    observer.next( model );
                    observer.complete();
                } );
            } );
            this.ipc.send( 'context:get:pseudo-clipboard', key );

        } );

        return obs;
    }

    private store( key: string, value: any ): void {
        this.ipc.send( 'context:store:pseudo-clipboard', { key: key, value: value } );
    }

    public closeAllButThis( menu: ContextMenuComponent ): void {
        if ( this.openedMenu != null && this.openedMenu.isOpen && menu != this.openedMenu ) {
            this.openedMenu.close();
        }
        this.openedMenu = menu;
    }

    public clearOpenedMenu(): void {
        this.openedMenu = null;
    }
    
}
