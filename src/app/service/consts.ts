import { User } from "../models/User";

export const escapeCharsRex = /[.@ \/\\]/g;
export const IDbRootName = 'todo_items_db';
export const localUser:User = {
  email: 'qtodo',
  userGroup: 'local',
  alias: 'local'
}