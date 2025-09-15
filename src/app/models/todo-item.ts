import { Tag } from "./tag";
import { UserDefinedType } from './userdefined-type';

export interface TodoItem {
    id: number;
    uuid: string;
    subject: string;
    description: string;
    version: number;
    tags: Tag[];
    completionStatus: boolean;
    setForReminder: boolean;
    creationTimestamp: string;
    updationTimestamp: string;
    eventStart?: string;
    eventEnd?: string;
    eventFullDay?: boolean;
    deleted?:boolean;
    userDefined?: UserDefinedType;
}
