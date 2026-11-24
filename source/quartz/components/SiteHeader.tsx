
import {
    QuartzComponent,
    QuartzComponentConstructor,
    QuartzComponentProps,
} from "./types"
import { resolveRelative } from "../util/path"

const SiteHeader: QuartzComponent = ({ allFiles, fileData }: QuartzComponentProps) => {
    const folderNotes = new Map<string, (typeof allFiles)[number]>()

    for (const file of allFiles) {
        const parts = file.slug?.split("/")

        if (
            parts?.length === 2 &&
            parts[0].toLowerCase() === parts[1].toLowerCase()
        ) {
            folderNotes.set(parts[0].toLowerCase(), file)
        }
    }

    const tabs = [...folderNotes.entries()].sort(([a], [b]) =>
        a.localeCompare(b, undefined, {
            numeric: true,
            sensitivity: "base",
        }),
    )

    const currentFolder =
        fileData.slug === "index"
            ? tabs[0]?.[0]
            : fileData.slug?.split("/")[0]?.toLowerCase()

    return (
        <header class="site-header">
            {/* Title occupies its own full-width row */}
            <div class="site-header-title-bar">
                <div class="site-header-inner">
                    <a href="/" class="site-header-title">
                        HOLONET DATA TERMINAL
                    </a>
                </div>
            </div>

            {/* Tabs occupy a separate row underneath */}
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
