import { Tag } from "./tag";
import { UserDefinedType } from './userdefined-type';

export interface TodoItem {
    id: number;
    subject: string;
    description: string;
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
