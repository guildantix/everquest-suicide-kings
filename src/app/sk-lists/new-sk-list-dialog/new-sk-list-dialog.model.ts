import { GuildMember } from "../../core.model";

export class NewSkListModel {
    public name: string;
    public members: GuildMember[] = [];
}