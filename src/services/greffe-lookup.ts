import { readFileSync } from "fs";
import { join } from "path";
import { environment } from "@raycast/api";

interface GreffeIndex {
  [codePostal: string]: string;
}

let greffeIndex: GreffeIndex | null = null;

/**
 * Loads the greffe index from the JSON file
 * Uses lazy loading to avoid blocking the main thread
 */
function loadGreffeIndex(): GreffeIndex {
  if (greffeIndex !== null) {
    return greffeIndex;
  }

  try {
    const jsonPath = join(environment.assetsPath, 'greffes-index.json');
    const fileContent = readFileSync(jsonPath, 'utf-8');
    greffeIndex = JSON.parse(fileContent);
    return greffeIndex!;
  } catch (error) {
    console.error('Failed to load greffe index:', error);
    return {};
  }
}

/**
 * Finds the appropriate greffe (court registry) based on postal code
 */
export function findGreffeByCodePostal(codePostal: string): string | null {
  try {
    const index = loadGreffeIndex();
    return index[codePostal] || null;
  } catch (error) {
    console.error('Error looking up greffe for postal code:', codePostal, error);
    return null;
  }
}