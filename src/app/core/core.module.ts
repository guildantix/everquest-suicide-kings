import { NgModule } from '@angular/core';
import { HorizontalScrollDirective } from './horizontal-scroll.directive';
import { InfiniteScrollerComponent } from './infinite-scroll.component';

@NgModule({
    imports: [

    ],
    exports: [
        HorizontalScrollDirective,
        InfiniteScrollerComponent,
    ],
    declarations: [
        HorizontalScrollDirective,
        InfiniteScrollerComponent,
    ],
    providers: [],
})
export class CoreModule { }
