import * as migration_20261020_210055_initial from './20261020_210055_initial';

export const migrations = [
  {
    up: migration_20261020_210055_initial.up,
    down: migration_20261020_210055_initial.down,
    name: '20261020_210055_initial'
  },
];
