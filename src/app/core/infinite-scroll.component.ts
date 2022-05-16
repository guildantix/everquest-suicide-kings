import { Component, ElementRef, HostListener, Input, OnInit } from '@angular/core';
import { DomUtilities } from '../utilities/dom.utilities';

const initPage = 4;

@Component( {
    selector: 'app-infinite-scroller',
    template: `<ng-content></ng-content>`
} )
export class InfiniteScrollerComponent<T> implements OnInit {

    private _i: number = initPage;
    public set pageIndex( value: number ) {
        this._i = value;
    }
    public get pageIndex(): number {
        return this._i;
    }

    private _data: T[] = [];
    @Input() public set data( values: T[] ) {
        this.pageIndex = values.length != this._data.length ? initPage : this.pageIndex;
        this._data = values;
    }
    public get data(): T[]{
        let sliceCount = ( this.pageIndex * this.pageSize ) + this.pageSize;
        sliceCount = sliceCount > this._data.length ? this._data.length : sliceCount;

        return this._data.slice( 0, sliceCount );
    }

    @Input() public pageSize: number = 25;

    public get bottomShown(): boolean {
        let scrollingElement = new ElementRef<HTMLElement>( DomUtilities.getScrollParent( this.el.nativeElement, true ) );
        let rect = this.el.nativeElement.getBoundingClientRect();
        let bottomPos = rect.height + rect.top;

        return scrollingElement.nativeElement?.scrollTop + scrollingElement.nativeElement?.clientHeight > bottomPos;
    }

    @HostListener( 'wheel' ) onMouseScroll() {
        if ( this.bottomShown ) {
            this.pageIndex = this.pageIndex + 1;
        }
    }

    constructor( private el: ElementRef<HTMLElement> ) {
        
    }

    ngOnInit() { }

}