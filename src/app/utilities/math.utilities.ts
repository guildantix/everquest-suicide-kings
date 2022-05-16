// Much help from https://easings.net
export class EasingUtilities {

    /**
     * Returns the eased position from 0 to 1.
     * 
     * @param x The current progress of the animation, from 0 to 1.
     */
    public static easeOutQuart( x: number ): number {
        return 1 - Math.pow( 1 - x, 4 );
    }

    /**
     * Returns the eased position from 0 to 1.
     * 
     * @param x The current progress of the animation, from 0 to 1.
     */
    public static easeOutQuad( x: number ): number {
        return 1 - ( 1 - x ) * ( 1 - x );
    }

    /**
     * Returns the eased position from 0 to 1.
     * 
     * @param x The current progress of the animation, from 0 to 1.
     */
    public static easeOutExpo( x: number ): number {
        return x === 1 ? 1 : 1 - Math.pow( 2, -10 * x );
    }

    /**
     * Returns the eased position from 0 to 1.
     * 
     * @param x The current progress of the animation, from 0 to 1.
     */
    public static easeOutSine( x: number ): number {
        return Math.sin( ( x * Math.PI ) / 2 );
    }

}

export class MathUtilities {
    /**
     * Returns value clamped between the inclusive barriers min and max.
     * 
     * @param value The value to evaluate.
     * @param min The minimum value.
     * @param max The maximum value.
     */
    public static clamp( value: number, min: number, max: number ): number {

        if ( value < min ) {
            return min;
        } else if ( value > max ) {
            return max;
        }
        
        return value;
    }

    /**
     * Computes a hash of the given string value.
     * 
     * @author https://stackoverflow.com/a/52171480
     * 
     * @param value The value to hash.
     * @param seed Any seed, default 0.
     */
    public static computeHash( value: string, seed: number = 0 ): string {
        let h1 = 0xdeadbeef ^ seed, h2 = 0x41c6ce57 ^ seed;
        
        for ( let i = 0, ch; i < value.length; i++ ) {
            ch = value.charCodeAt( i );
            h1 = Math.imul( h1 ^ ch, 2654435761 );
            h2 = Math.imul( h2 ^ ch, 1597334677 );
        }

        h1 = Math.imul( h1 ^ ( h1 >>> 16 ), 2246822507 ) ^ Math.imul( h2 ^ ( h2 >>> 13 ), 3266489909 );
        h2 = Math.imul( h2 ^ ( h2 >>> 16 ), 2246822507 ) ^ Math.imul( h1 ^ ( h1 >>> 13 ), 3266489909 );
        
        return ( h2 >>> 0 ).toString( 16 ).padStart( 8 ) + ( h1 >>> 0 ).toString( 16 ).padStart( 8 );
    }
}
