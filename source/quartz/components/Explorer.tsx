import { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "./types"
import explorerStyle from "./styles/explorer.scss"

// @ts-ignore
import script from "./scripts/explorer.inline"
import { ExplorerNode, FileNode, Options } from "./ExplorerNode"
import { QuartzPluginData } from "../plugins/vfile"
import { classNames } from "../util/lang"

// Options interface defined in `ExplorerNode` to avoid circular dependency
const defaultOptions = {
    folderClickBehavior: "collapse",
    folderDefaultState: "collapsed",
    useSavedState: true,
    mapFn: (node) => {
        return node
    },
    sortFn: (a, b) => {
        // Folders first, then files. Sort alphabetically.
        if (a.isFolder === b.isFolder) {
            return a.displayName.localeCompare(b.displayName, undefined, {
                numeric: true,
                sensitivity: "base",
            })
        }

        return a.isFolder ? -1 : 1
    },
    filterFn: (node) => node.name !== "tags",
    order: ["filter", "map", "sort"],
} satisfies Options

export default ((userOpts?: Partial<Options>) => {
    // Parse config
    const opts: Options = { ...defaultOptions, ...userOpts }

    // memoized
    let fileTree: FileNode
    let lastBuildId: string = ""

    function constructFileTree(allFiles: QuartzPluginData[]) {
        // Construct tree from allFiles
        fileTree = new FileNode("")
        allFiles.forEach((file) => fileTree.add(file))

        // Promote matching folder notes to their parent folders
        fileTree.attachFolderNotes()

        // Execute all functions (sort, filter, map) that were provided (if none were provided, only default "sort" is applied)
        if (opts.order) {
            // Order is important, use loop with index instead of order.map()
            for (let i = 0; i < opts.order.length; i++) {
                const functionName = opts.order[i]
                if (functionName === "map") {
                    fileTree.map(opts.mapFn)
                } else if (functionName === "sort") {
                    fileTree.sort(opts.sortFn)
                } else if (functionName === "filter") {
                    fileTree.filter(opts.filterFn)
                }
            }
        }

        // Get all folders of tree. Initialize with collapsed state
        // Stringify to pass json tree as data attribute ([data-tree])
        const folders = fileTree.getFolderPaths(opts.folderDefaultState === "collapsed")
    }

    function getActiveTree(fileData: QuartzPluginData) {
        const currentFolder = fileData.slug?.split("/")[0]?.toLowerCase()

        const activeNode = currentFolder
            ? fileTree.children.find(
                (child) =>
                    child.isFolder &&
                    child.name.toLowerCase() === currentFolder,
            )
            : undefined

        return activeNode ?? fileTree.children.find((child) => child.isFolder) ?? fileTree
    }

    const Explorer: QuartzComponent = ({
        ctx,
        allFiles,
        displayClass,
        fileData,
    }: QuartzComponentProps) => {
        if (ctx.buildId !== lastBuildId) {
            lastBuildId = ctx.buildId
            constructFileTree(allFiles)
        }
        const activeTree = getActiveTree(fileData)

        return (
            <div class={classNames(displayClass, "explorer")}>
                <div id="explorer-content">
                    <ul class="overflow" id="explorer-ul">
                        {activeTree.children.map((child) => (
                            <ExplorerNode
                                node={child}
                                opts={opts}
                                fileData={fileData}
                                fullPath={activeTree.name}
                            />
                        ))}
                        <li id="explorer-end" />
                    </ul>
                </div>
            </div>
        )
    }

    Explorer.css = explorerStyle
    Explorer.afterDOMLoaded = script
    return Explorer
}) satisfies QuartzComponentConstructor
