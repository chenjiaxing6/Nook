import focusTimer from "./focus-timer"
import productivityInsights from "./productivity-insights"
import { registerPlugin } from "./registry"

const pluginModules = [productivityInsights, focusTimer]

pluginModules.forEach(registerPlugin)
