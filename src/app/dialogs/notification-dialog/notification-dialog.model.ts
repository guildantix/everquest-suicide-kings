export class NotificationDialogModel {
    public title: string;
    public message: string | string[];
    public notificationType: NotificationTypes;
    public showHideCheckbox: boolean = true;
    public error?: Error;
    public errorId?: string;
}

export enum NotificationTypes {
    Error,
    Information,
    Warning,
    Note,
}
