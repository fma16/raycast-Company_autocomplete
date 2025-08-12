/**
 * Helper pour accéder aux identifiants INPI dans les tests locaux
 * Essaie d'abord les variables d'environnement, puis les préférences Raycast
 */

import { execSync } from "child_process";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";

export interface TestCredentials {
  username: string;
  password: string;
  source: "env" | "raycast" | "none";
}

/**
 * Récupère les identifiants INPI pour les tests locaux
 */
export function getTestCredentials(): TestCredentials {
  // 1. Priorité aux variables d'environnement
  if (
    process.env.INPI_USERNAME &&
    process.env.INPI_PASSWORD &&
    process.env.INPI_USERNAME.trim() &&
    process.env.INPI_PASSWORD.trim()
  ) {
    return {
      username: process.env.INPI_USERNAME.trim(),
      password: process.env.INPI_PASSWORD.trim(),
      source: "env",
    };
  }

  // 2. Essayer de lire les préférences Raycast depuis le système de fichiers
  try {
    const raycastCredentials = getRaycastStoredCredentials();
    if (raycastCredentials.username && raycastCredentials.password) {
      return {
        username: raycastCredentials.username,
        password: raycastCredentials.password,
        source: "raycast",
      };
    }
  } catch (error) {
    console.warn("Could not access Raycast stored credentials:", error);
  }

  // 3. Aucun identifiant trouvé
  return {
    username: "",
    password: "",
    source: "none",
  };
}

/**
 * Essaie de lire les préférences Raycast stockées sur le système
 * Note: Cette approche est expérimentale et peut ne pas fonctionner sur tous les systèmes
 */
function getRaycastStoredCredentials(): { username?: string; password?: string } {
  try {
    // Raycast stocke ses préférences dans ~/Library/Preferences/com.raycast.macos.plist
    // On utilise la commande `defaults` de macOS pour les lire
    const plistPath = path.join(os.homedir(), "Library", "Preferences", "com.raycast.macos.plist");

    if (!fs.existsSync(plistPath)) {
      return {};
    }

    // Essayer de lire les préférences avec la commande defaults
    // Format probable: com.raycast.extension.{extension-name}.{preference-key}
    const extensionPrefix = "com.raycast.extension.french-company-search-inpi";

    try {
      const username = execSync(`defaults read com.raycast.macos "${extensionPrefix}.inpiUsername" 2>/dev/null`, {
        encoding: "utf8",
      }).trim();
      const password = execSync(`defaults read com.raycast.macos "${extensionPrefix}.inpiPassword" 2>/dev/null`, {
        encoding: "utf8",
      }).trim();

      if (username && password && username !== "(null)" && password !== "(null)") {
        return { username, password };
      }
    } catch {
      // Les clés n'existent peut-être pas encore
    }

    return {};
  } catch {
    return {};
  }
}

/**
 * Affiche des informations de debug sur les credentials trouvés
 */
export function debugCredentials(): void {
  const creds = getTestCredentials();

  console.log("🔍 Debug credentials:");
  console.log(`  Source: ${creds.source}`);
  console.log(`  Username: ${creds.username ? "✅ Found" : "❌ Not found"}`);
  console.log(`  Password: ${creds.password ? "✅ Found" : "❌ Not found"}`);

  if (creds.source === "none") {
    console.log("");
    console.log("💡 To provide credentials:");
    console.log("  Option 1: INPI_USERNAME=xxx INPI_PASSWORD=xxx npm test");
    console.log("  Option 2: Configure in Raycast extension preferences");
  }
}
