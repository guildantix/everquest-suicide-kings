import { ErrorHandler, NgModule } from '@angular/core';
import { GlobalErrorHandler } from './global-error-handler';
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
    providers: [
        {
            provide: ErrorHandler,
            useClass: GlobalErrorHandler,
        },
    ],
})
export class CoreModule { }
