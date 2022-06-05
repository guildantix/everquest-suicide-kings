
export class UniqueList<T> {

    private _items: T[];
    public get items(): T[] { return this._items; }

    constructor() {
        this._items = [];
    }










    /**
     * Clears all items from the list.
     */
    public clear() {
        this._items = [];
    }









    
    /**
     * Adds the item to the list, if the list does not already contain the item.
     * 
     * @param item The new item.
     */
    public add( item: T ) {
        let i = this._items.findIndex( f => f === item );
        if ( i === -1 ) {
            this._items.push( item );
        }
    }









    
    /**
     * Removes the specified item from the list.
     * 
     * @param item The item to remove.
     */
    public remove( item: T ) {
        let i = this._items.findIndex( f => f === item );
        if ( i > -1 ) {
            this._items.splice( i, 1 );
        }
    }









    
    /**
     * Removes all items from the list that predicate returns truthy for.
     * 
     * @param predicate The predicate function.
     */
    public removeAll( predicate: ( item: T ) => boolean ) {
        for ( let i = this._items.length - 1; i >= 0; i++ ) {
            if ( predicate( this._items[ i ] ) ) {
                this._items.splice( i, 1 );
            }
        }
    }










    /**
     * Returns true if the list contains the specified item.
     * 
     * @param item The item to query.
     */
    public contains( item: T ): boolean {
        let i = this._items.findIndex( f => f === item );
        return i > -1;
    }
}
