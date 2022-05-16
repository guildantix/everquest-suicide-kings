export class TimeSpan {

    public get totalMilliseconds(): number {
        return this.ticks;
    }

    public get totalSeconds(): number {
        return Math.floor( this.ticks / 1000 );
    }

    public get totalMinutes(): number {
        return Math.floor( this.totalSeconds / 60 );
    }

    public get totalHours(): number {
        return Math.floor( this.totalMinutes / 60 );
    }

    public get totalDays(): number {
        return Math.floor( this.totalHours / 24 );
    }

    constructor( private ticks: number ) { }

}

export class DateUtilities {

    /**
     * Returns the amount of time between two dates.
     * 
     * @param a Any date value.
     * @param b Any date value.
     */
    public static getTimeBetweenDates( a: Date, b: Date ): TimeSpan {
        return new TimeSpan( Math.abs( a.getTime() - b.getTime() ) );
    }

    /**
     * Adds the specified number of days to the given date.
     * 
     * @param a The date.
     * @param days The number of days to add.
     */
    public static addDays( a: Date, days: number ): Date {
        let b = new Date( a.getTime() );
        b.setDate( b.getDate() + days );
        return b;
    }
}
