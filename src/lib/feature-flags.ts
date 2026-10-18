import fs from "fs"
import path from "path"

export interface FeatureFlags {
  enableSubscriptions: boolean
  enableLoyalty: boolean
}

const FLAGS_FILE = path.join(process.cwd(), "src", "data", "feature-flags.json")

const DEFAULT_FLAGS: FeatureFlags = {
  enableSubscriptions: true,
  enableLoyalty: true,
}

export function getFeatureFlags(): FeatureFlags {
  try {
    if (fs.existsSync(FLAGS_FILE)) {
      const raw = fs.readFileSync(FLAGS_FILE, "utf-8")
      const parsed = JSON.parse(raw)
      return {
        enableSubscriptions: parsed.enableSubscriptions !== false,
        enableLoyalty: parsed.enableLoyalty !== false,
      }
    }
  } catch {}
  return DEFAULT_FLAGS
}

export function saveFeatureFlags(flags: Partial<FeatureFlags>): FeatureFlags {
  const current = getFeatureFlags()
  const updated: FeatureFlags = {
    enableSubscriptions: flags.enableSubscriptions !== undefined ? !!flags.enableSubscriptions : current.enableSubscriptions,
    enableLoyalty: flags.enableLoyalty !== undefined ? !!flags.enableLoyalty : current.enableLoyalty,
  }

  try {
    const dir = path.dirname(FLAGS_FILE)
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
    fs.writeFileSync(FLAGS_FILE, JSON.stringify(updated, null, 2), "utf-8")

    // Sync loyalty-config.json enabled status
    const loyaltyConfigFile = path.join(process.cwd(), "src", "data", "loyalty-config.json")
    if (fs.existsSync(loyaltyConfigFile)) {
      try {
        const lConfig = JSON.parse(fs.readFileSync(loyaltyConfigFile, "utf-8"))
        lConfig.enabled = updated.enableLoyalty
        fs.writeFileSync(loyaltyConfigFile, JSON.stringify(lConfig, null, 2), "utf-8")
      } catch {}
    }
  } catch (err) {
    console.error("Failed to save feature flags:", err)
  }

  return updated
}
