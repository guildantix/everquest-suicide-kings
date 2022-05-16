import { ListsDatabase, RaidAttendee } from "src/app/core.model";
import { ICharacterMultiList } from '../modals.model';

export class MissingRaiderModel extends RaidAttendee implements ICharacterMultiList {
    public listIds: string[] = [];
}

export class MissingRaidersModel {

    public listsDatabase: ListsDatabase;
    public raiders: MissingRaiderModel[];
    
}
