
import {
    QuartzComponent,
    QuartzComponentConstructor,
    QuartzComponentProps,
} from "./types"
import { QuartzPluginData } from "../plugins/vfile"
import { resolveRelative } from "../util/path"

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
    // Do not overwrite it with an empty list on special pages such as 404.
    if (folderNotes.size > 0) {
        cachedTabs = [...folderNotes.entries()].sort(([a], [b]) =>
            a.localeCompare(b, undefined, {
                numeric: true,
                sensitivity: "base",
            }),
        )
    }

    const tabs = cachedTabs

    // Determine the active tab from the current page.
    const currentSlug = fileData.slug ?? ""

    const currentFolder =
        currentSlug === "index"
            ? tabs[0]?.[0]
            : currentSlug.split("/")[0]?.toLowerCase()

    return (
        <header class="site-header">
            <div class="site-header-title-bar">
                <div class="site-header-inner">
                    <a href="/" class="site-header-title">
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
