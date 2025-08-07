// src/greffes.ts
import { environment } from '@raycast/api';
import fs from 'fs';
import path from 'path';

interface GreffeIndex {
  byCodePostal: { [code: string]: string };
  byCodeInsee: { [code: string]: string };
}

let loadedIndex: GreffeIndex | null = null;

function getIndex(): GreffeIndex {
  if (loadedIndex) {
    return loadedIndex;
  }

  try {
    const jsonPath = path.join(environment.assetsPath, 'greffes-index.json');
    const fileContent = fs.readFileSync(jsonPath, 'utf-8');
    loadedIndex = JSON.parse(fileContent) as GreffeIndex;
    return loadedIndex;
  } catch (error) {
    console.error("Erreur lors du chargement du fichier greffes-index.json:", error);
    loadedIndex = { byCodePostal: {}, byCodeInsee: {} };
    return loadedIndex;
  }
}

export function findGreffeByCodePostal(codePostal: string): string | null {
  if (!codePostal || codePostal.length !== 5) {
    return null;
  }
  const index = getIndex();
  return index.byCodePostal[codePostal] || null;
}