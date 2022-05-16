export class InputDialogModel {
    public title: string;
    public message: string | string[];
    public label: string;
    public hint: string;
    public defaultValue: string;

    public showCheckBox: boolean = false;
    public checkboxLabel: string = null;
}

export class InputDialogResponse {
    
    public value: string;
    public checked: boolean = false;
    
}
