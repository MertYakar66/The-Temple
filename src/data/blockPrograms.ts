// Registry of all hardcoded block-based training programs. The Blocks and
// Workout screens iterate this list; the store namespaces customizations by
// `program.id` so each program's edits stay isolated.

import type { BlockProgram } from './minMaxProgram';
import { minMaxProgram } from './minMaxProgram';
import { powerbuildingProgram } from './powerbuildingProgram';

export const blockPrograms: BlockProgram[] = [minMaxProgram, powerbuildingProgram];

// The id used before programs were namespaced — kept so the v3 store migration
// can remap legacy customization keys (`"${block}-${week}"`) onto it.
export const LEGACY_PROGRAM_ID = 'minmax';

export function getBlockProgram(id: string): BlockProgram | undefined {
  return blockPrograms.find((p) => p.id === id);
}
