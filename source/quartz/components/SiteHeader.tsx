
import {
    QuartzComponent,
    QuartzComponentConstructor,
    QuartzComponentProps,
} from "./types"
import { QuartzPluginData } from "../plugins/vfile"
import { resolveRelative } from "../util/path"

// Set your preferred tab order here.
const tabOrder = [
    "Scenario",
    "Mod Series",
]

// Retain discovered folder notes between page renders.
let cachedTabs: Array<[string, QuartzPluginData]> = []

const SiteHeader: QuartzComponent = ({ allFiles, fileData }: QuartzComponentProps) => {
    // Discover folder notes dynamically.
    const folderNotes = new Map<string, QuartzPluginData>()

    for (const file of allFiles ?? []) {
        const parts = file.slug?.split("/")

        if (
            parts?.length === 2 &&
            parts[0].toLowerCase() === parts[1].toLowerCase()
        ) {
            folderNotes.set(parts[0].toLowerCase(), file)
        }
    }

    // Update the cache when folder notes are available.
    if (folderNotes.size > 0) {
        cachedTabs = [...folderNotes.entries()]
    }

    // Apply custom ordering.
    const tabs = [...cachedTabs].sort(([a], [b]) => {
        const indexA = tabOrder.findIndex(
            name => name.toLowerCase() === a,
        )
        const indexB = tabOrder.findIndex(
            name => name.toLowerCase() === b,
        )

        // Unlisted folders appear alphabetically at the end.
        if (indexA === -1 && indexB === -1) {
            return a.localeCompare(b, undefined, {
                numeric: true,
                sensitivity: "base",
            })
        }

        if (indexA === -1) return 1
        if (indexB === -1) return -1

        return indexA - indexB
    })

    // Determine the active tab from the current page.
    const currentSlug = fileData.slug ?? ""

    const currentFolder =
        currentSlug === "index"
            ? undefined
            : currentSlug.split("/")[0]?.toLowerCase()

    return (
        <header class="site-header">
            <div class="site-header-title-bar">
                <div class="site-header-inner">
                    <a href="/holonet" class="site-header-title">
                        HOLONET DATA TERMINAL
                    </a>
                </div>
            </div>

            <div class="site-header-tab-bar">
                <nav
                    class="site-header-inner site-header-tabs"
                    aria-label="Vault sections"
                >
                    {tabs.map(([folderName, file]) => {
                        const active = currentFolder === folderName

                        return (
                            <a
                                href={resolveRelative(fileData.slug!, file.slug!)}
                                class={active ? "site-header-tab active" : "site-header-tab"}
                                aria-current={active ? "page" : undefined}
                            >
                                {file.frontmatter?.title ?? folderName}
                            </a>
                        )
                    })}
                </nav>
            </div>
        </header>
    )
}

export default (() => SiteHeader) satisfies QuartzComponentConstructor
