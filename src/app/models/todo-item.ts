import { Tag } from "./tag";

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
}
