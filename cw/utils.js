export const ATTACK_COOLDOWN = 500;
export const ENEMY_TYPES = ["enemy_1", "enemy_2", "enemy_3"];
export const DASH_SPEED = 30;
export const DASH_DURATION = 10;
export const FIRE_TYPE = "fire";
export const FIRE_SPAWN_INTERVAL = 2000;
export const FIRE_FALL_SPEED = 6;
export const FIRE_COUNT = 7;
export const maps = ["lvl1.json", "lvl2.json"];

export function isSolidTile(tileId) {
    return tileId != 55 && tileId != 56 && tileId != 46;
}
