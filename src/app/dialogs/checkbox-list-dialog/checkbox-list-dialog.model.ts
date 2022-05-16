import { Selectable } from '../../core.model';

export class CheckboxListDialogModel<T extends Selectable> {
    
    public title: string;
    public message: string | string[];
    public options: T[] = [];
    public affirmativeText: string = 'Select';
    public negativeText: string = 'Cancel';
    public otherText: string | null = null;

}
