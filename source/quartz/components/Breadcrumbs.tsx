import { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "./types"
import breadcrumbsStyle from "./styles/breadcrumbs.scss"
import { FullSlug, SimpleSlug, joinSegments, resolveRelative } from "../util/path"
import { QuartzPluginData } from "../plugins/vfile"
import { classNames } from "../util/lang"

type CrumbData = {
    displayName: string
    path: string
}

interface BreadcrumbOptions {
    /**
     * Symbol between crumbs
     */
    spacerSymbol: string
    /**
     * Name of first crumb
     */
    rootName: string
    /**
     * Whether to look up frontmatter title for folders (could cause performance problems with big vaults)
     */
    resolveFrontmatterTitle: boolean
    /**
     * Whether to display breadcrumbs on root `index.md`
     */
    hideOnRoot: boolean
    /**
     * Whether to display the current page in the breadcrumbs.
     */
    showCurrentPage: boolean
}

const defaultOptions: BreadcrumbOptions = {
    spacerSymbol: "\\\\",
    rootName: "Home",
    resolveFrontmatterTitle: true,
    hideOnRoot: true,
    showCurrentPage: true,
}

function formatCrumb(displayName: string, baseSlug: FullSlug, currentSlug: SimpleSlug): CrumbData {
    return {
        displayName: displayName.replaceAll("-", " "),
        path: resolveRelative(baseSlug, currentSlug),
    }
}

export default ((opts?: Partial<BreadcrumbOptions>) => {
    // Merge options with defaults
    const options: BreadcrumbOptions = { ...defaultOptions, ...opts }

    // computed index of folder name to its associated file data
    let folderIndex: Map<string, QuartzPluginData> | undefined

    const Breadcrumbs: QuartzComponent = ({
        fileData,
        allFiles,
        displayClass,
    }: QuartzComponentProps) => {
        // Hide crumbs on root if enabled
        if (options.hideOnRoot && fileData.slug === "index") {
            return <></>
        }

        // Format entry for root element
        const firstEntry = formatCrumb(options.rootName, fileData.slug!, "/" as SimpleSlug)
        const crumbs: CrumbData[] = [firstEntry]

        if (!folderIndex) {
            folderIndex = new Map()

            // First, index conventional index.md folder pages
            for (const file of allFiles) {
                const parts = file.slug?.split("/")
                if (parts?.at(-1) === "index") {
                    folderIndex.set(parts.slice(0, -1).join("/"), file)
                }
            }

            // Then, index matching folder notes (e.g. Scenario/Scenario.md)
            // These take priority over index.md.
            for (const file of allFiles) {
                const parts = file.slug?.split("/")
                if (!parts || parts.length < 2) continue

                const fileName = parts.at(-1)
                const folderName = parts.at(-2)

                if (fileName?.toLowerCase() === folderName?.toLowerCase()) {
                    folderIndex.set(parts.slice(0, -1).join("/"), file)
                }
            }
        }

        // Split slug into hierarchy/parts
        const slugParts = fileData.slug?.split("/")
        if (slugParts) {
            // is tag breadcrumb?
            const isTagPath = slugParts[0] === "tags"

            // full path until current part
            let currentPath = ""

            for (let i = 0; i < slugParts.length - 1; i++) {
                let curPathSegment = slugParts[i]

                // Add current slug to full path
                currentPath = joinSegments(currentPath, slugParts[i])

                // Look for a matching folder note or index.md
                const currentFile = folderIndex?.get(currentPath)

                // Resolve frontmatter title if enabled
                if (options.resolveFrontmatterTitle && currentFile) {
                    const title = currentFile.frontmatter!.title
                    if (title !== "index") {
                        curPathSegment = title
                    }
                }

                const includeTrailingSlash = !isTagPath || i < 1

                // Link to the folder note when one exists
                const crumbPath = currentFile
                    ? resolveRelative(fileData.slug!, currentFile.slug!)
                    : resolveRelative(
                        fileData.slug!,
                        (currentPath + (includeTrailingSlash ? "/" : "")) as SimpleSlug,
                    )

                crumbs.push({
                    displayName: curPathSegment.replaceAll("-", " "),
                    path: crumbPath,
                })
            }

            // Add current file to crumb (can directly use frontmatter title)
            if (options.showCurrentPage && slugParts.at(-1) !== "index") {
                crumbs.push({
                    displayName: fileData.frontmatter!.title,
                    path: "",
                })
            }
        }

        return (
            <nav class={classNames(displayClass, "breadcrumb-container")} aria-label="breadcrumbs">
                {crumbs.map((crumb, index) => (
                    <div class="breadcrumb-element">
                        <a href={crumb.path}>{crumb.displayName}</a>
                        {index !== crumbs.length - 1 && <p>{` ${options.spacerSymbol} `}</p>}
                    </div>
                ))}
            </nav>
        )
    }
    Breadcrumbs.css = breadcrumbsStyle

    return Breadcrumbs
}) satisfies QuartzComponentConstructor
