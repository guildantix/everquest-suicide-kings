import { ListsDatabase, SuicideKingsCharacter } from '../../core.model';
import { ICharacterMultiList } from '../modals.model';

export class NewRaiderModel {
    public listsDatabase: ListsDatabase;
    public name?: string;
    public standby?: boolean;
}

export class NewRaiderResultModel extends SuicideKingsCharacter implements ICharacterMultiList {
    // public character: SuicideKingsCharacter;
    public listIds: string[] = [];
}