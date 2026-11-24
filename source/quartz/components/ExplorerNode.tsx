// @ts-ignore
import {
    LineDotRightHorizontal,
    LifeBuoy,
    LandPlot,
    Earth,
    MapPin,
    Swords,
    UserGroup,
} from "lucide-preact"
import { QuartzPluginData } from "../plugins/vfile"
import {
    joinSegments,
    resolveRelative,
    clone,
    simplifySlug,
    SimpleSlug,
    FilePath,
} from "../util/path"

const tagIcons: Record<string, any> = {
    spoke: LineDotRightHorizontal,
    hub: LifeBuoy,
    region: LandPlot,
    planet: Earth,
    location: MapPin,
    enemy: Swords,
    faction: UserGroup,
}

type OrderEntries = "sort" | "filter" | "map"

export interface Options {
    title?: string
    folderDefaultState: "collapsed" | "open"
    folderClickBehavior: "collapse" | "link"
    useSavedState: boolean
    sortFn: (a: FileNode, b: FileNode) => number
    filterFn: (node: FileNode) => boolean
    mapFn: (node: FileNode) => void
    order: OrderEntries[]
}

type DataWrapper = {
    file: QuartzPluginData
    path: string[]
}

export type FolderState = {
    path: string
    collapsed: boolean
}

function getPathSegment(fp: FilePath | undefined, idx: number): string | undefined {
    if (!fp) {
        return undefined
    }

    return fp.split("/").at(idx)
}

// Structure to add all files into a tree
export class FileNode {
    children: Array<FileNode>
    name: string
    displayName: string
    file: QuartzPluginData | null
    depth: number
    isFolder: boolean

    constructor(slugSegment: string, displayName?: string, file?: QuartzPluginData, depth?: number) {
        this.children = []
        this.name = slugSegment
        this.displayName = displayName ?? file?.frontmatter?.title ?? slugSegment
        this.file = file ? clone(file) : null
        this.depth = depth ?? 0
        this.isFolder = false
    }

    private insert(fileData: DataWrapper) {
        if (fileData.path.length === 0) {
            return
        }

        const nextSegment = fileData.path[0]

        // base case, insert here
        if (fileData.path.length === 1) {
            if (nextSegment === "") {
                // index case (we are the root and we just found index.md), set our data appropriately
                const title = fileData.file.frontmatter?.title
                if (title && title !== "index") {
                    this.displayName = title
                }
            } else {
                // direct child
                this.children.push(new FileNode(nextSegment, undefined, fileData.file, this.depth + 1))
            }

            return
        }

        // find the right child to insert into
        fileData.path = fileData.path.splice(1)
        const child = this.children.find((c) => c.name === nextSegment)
        if (child) {
            child.insert(fileData)
            return
        }

        const newChild = new FileNode(
            nextSegment,
            getPathSegment(fileData.file.relativePath, this.depth),
            undefined,
            this.depth + 1,
        )

        newChild.isFolder = true
        newChild.insert(fileData)
        this.children.push(newChild)
    }

    // Add new file to tree
    add(file: QuartzPluginData) {
        this.insert({ file: file, path: simplifySlug(file.slug!).split("/") })
    }

    attachFolderNotes() {
        for (const child of this.children) {
            if (!child.isFolder) continue

            const noteIndex = child.children.findIndex(
                (entry) =>
                    !entry.isFolder &&
                    entry.file !== null &&
                    entry.name.toLowerCase() === child.name.toLowerCase(),
            )

            if (noteIndex !== -1) {
                const [folderNote] = child.children.splice(noteIndex, 1)
                child.file = folderNote.file
            }

            child.attachFolderNotes()
        }
    }

    /**
     * Filter FileNode tree. Behaves similar to `Array.prototype.filter()`, but modifies tree in place
     * @param filterFn function to filter tree with
     */
    filter(filterFn: (node: FileNode) => boolean) {
        this.children = this.children.filter(filterFn)
        this.children.forEach((child) => child.filter(filterFn))
    }

    /**
     * Filter FileNode tree. Behaves similar to `Array.prototype.map()`, but modifies tree in place
     * @param mapFn function to use for mapping over tree
     */
    map(mapFn: (node: FileNode) => void) {
        mapFn(this)
        this.children.forEach((child) => child.map(mapFn))
    }

    /**
     * Get folder representation with state of tree.
     * Intended to only be called on root node before changes to the tree are made
     * @param collapsed default state of folders (collapsed by default or not)
     * @returns array containing folder state for tree
     */
    getFolderPaths(collapsed: boolean): FolderState[] {
        const folderPaths: FolderState[] = []

        const traverse = (node: FileNode, currentPath: string) => {
            if (node.isFolder) {
                const folderPath = joinSegments(currentPath, node.name)
                if (folderPath !== "") {
                    folderPaths.push({ path: folderPath, collapsed })
                }

                node.children.forEach((child) => traverse(child, folderPath))
            }
        }

        traverse(this, "")
        return folderPaths
    }

    // Sort order: folders first, then files. Sort folders and files alphabetically
    /**
     * Sorts tree according to sort/compare function
     * @param sortFn compare function used for `.sort()`, also used recursively for children
     */
    sort(sortFn: (a: FileNode, b: FileNode) => number) {
        this.children = this.children.sort(sortFn)
        this.children.forEach((e) => e.sort(sortFn))
    }
}

type ExplorerNodeProps = {
    node: FileNode
    opts: Options
    fileData: QuartzPluginData
    fullPath?: string
}

export function ExplorerNode({ node, opts, fullPath, fileData }: ExplorerNodeProps) {
    const folderBehavior = opts.folderClickBehavior
    const isDefaultOpen = opts.folderDefaultState === "open"

    const folderPath = node.name !== "" ? joinSegments(fullPath ?? "", node.name) : ""
    const href = resolveRelative(fileData.slug!, folderPath as SimpleSlug) + "/"

    return (
        <>
            {!node.isFolder && node.name !== "" ? (
                <li key={node.file?.slug}>
                    <a
                        href={resolveRelative(fileData.slug!, node.file!.slug!)}
                        data-for={node.file!.slug}
                        class="explorer-file-link"
                    >
                        {(() => {
                            const tags: string[] = node.file?.frontmatter?.tags ?? []
                            const matchingTag = Object.keys(tagIcons).find((iconTag) =>
                                tags.some((noteTag) => noteTag.toLowerCase() === iconTag),
                            )
                            const TagIcon = matchingTag ? tagIcons[matchingTag] : null

                            return (
                                <>
                                    {TagIcon && (
                                        <TagIcon
                                            size={16}
                                            strokeWidth={1.5}
                                            class="explorer-tag-icon"
                                        />
                                    )}
                                    <span>{node.displayName}</span>
                                </>
                            )
                        })()}
                    </a>
                </li>
            ) : (
                <li>
                    {node.name !== "" && (

                        <div class="folder-container">
                            {(() => {
                                const tags: string[] = node.file?.frontmatter?.tags ?? []
                                const matchingTag = Object.keys(tagIcons).find((iconTag) =>
                                    tags.some((noteTag) => noteTag.toLowerCase() === iconTag),
                                )
                                const TagIcon = matchingTag ? tagIcons[matchingTag] : null

                                return node.file && TagIcon ? (
                                    <TagIcon
                                        size={16}
                                        strokeWidth={1.5}
                                        class="folder-icon folder-note-icon explorer-tag-icon"
                                    />
                                ) : (
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        width="12"
                                        height="12"
                                        viewBox="5 8 14 8"
                                        fill="none"
                                        stroke="currentColor"
                                        stroke-width="2"
                                        stroke-linecap="round"
                                        stroke-linejoin="round"
                                        class="folder-icon"
                                    >
                                        <polyline points="6 9 12 15 18 9"></polyline>
                                    </svg>
                                )
                            })()}

                            <div key={node.name} data-folderpath={folderPath}>
                                {node.file ? (
                                    <a
                                        href={resolveRelative(fileData.slug!, node.file.slug!)}
                                        data-for={node.file.slug}
                                        class="folder-title"
                                    >
                                        {node.displayName}
                                    </a>
                                ) : folderBehavior === "link" ? (
                                    <a href={href} data-for={node.name} class="folder-title">
                                        {node.displayName}
                                    </a>
                                ) : (
                                    <button class="folder-button">
                                        <span class="folder-title">{node.displayName}</span>
                                    </button>
                                )}
                            </div>
                        </div>

                    )}

                    <div class={`folder-outer ${isDefaultOpen ? "open" : ""}`}>
                        <ul
                            style={{
                                paddingLeft: node.name !== "" ? "1.4rem" : "0",
                            }}
                            class="content"
                            data-folderul={folderPath}
                        >
                            {node.children.map((childNode, i) => (
                                <ExplorerNode
                                    node={childNode}
                                    key={i}
                                    opts={opts}
                                    fullPath={folderPath}
                                    fileData={fileData}
                                />
                            ))}
                        </ul>
                    </div>
                </li>
            )}
        </>
    )
}
