import { QuartzEmitterPlugin } from "../types"
import { QuartzComponentProps } from "../../components/types"
import HeaderConstructor from "../../components/Header"
import BodyConstructor from "../../components/Body"
import { pageResources, renderPage } from "../../components/renderPage"
import { ProcessedContent, QuartzPluginData, defaultProcessedContent } from "../vfile"
import { FullPageLayout } from "../../cfg"
import path from "path"
import {
    FilePath,
    FullSlug,
    SimpleSlug,
    stripSlashes,
    joinSegments,
    pathToRoot,
    simplifySlug,
} from "../../util/path"
import { defaultListPageLayout, sharedPageComponents } from "../../../quartz.layout"
import { FolderContent } from "../../components"
import { write } from "./helpers"
import { i18n } from "../../i18n"
import DepGraph from "../../depgraph"

interface FolderPageOptions extends FullPageLayout {
    sort?: (f1: QuartzPluginData, f2: QuartzPluginData) => number
}

export const FolderPage: QuartzEmitterPlugin<Partial<FolderPageOptions>> = (userOpts) => {
    const opts: FullPageLayout = {
        ...sharedPageComponents,
        ...defaultListPageLayout,
        pageBody: FolderContent({ sort: userOpts?.sort }),
        ...userOpts,
    }

    const { head: Head, header, beforeBody, pageBody, afterBody, left, right, footer: Footer } = opts
    const Header = HeaderConstructor()
    const Body = BodyConstructor()

    return {
        name: "FolderPage",
        getQuartzComponents() {
            return [
                Head,
                Header,
                Body,
                ...header,
                ...beforeBody,
                pageBody,
                ...afterBody,
                ...left,
                ...right,
                Footer,
            ]
        },
        async getDependencyGraph(_ctx, content, _resources) {
            // Example graph:
            // nested/file.md --> nested/index.html
            // nested/file2.md ------^
            const graph = new DepGraph<FilePath>()

            content.map(([_tree, vfile]) => {
                const slug = vfile.data.slug
                const folderName = path.dirname(slug ?? "") as SimpleSlug
                if (slug && folderName !== "." && folderName !== "tags") {
                    graph.addEdge(vfile.data.filePath!, joinSegments(folderName, "index.html") as FilePath)
                }
            })

            return graph
        },
        async emit(ctx, content, resources): Promise<FilePath[]> {
            const fps: FilePath[] = []
            const allFiles = content.map((c) => c[1].data)
            const cfg = ctx.cfg.configuration

            const folders: Set<SimpleSlug> = new Set(
                allFiles.flatMap((data) => {
                    const slug = data.slug
                    const folderName = path.dirname(slug ?? "") as SimpleSlug
                    if (slug && folderName !== "." && folderName !== "tags") {
                        return [folderName]
                    }
                    return []
                }),
            )

            const folderDescriptions: Record<string, ProcessedContent> = Object.fromEntries(
                [...folders].map((folder) => [
                    folder,
                    defaultProcessedContent({
                        slug: joinSegments(folder, "index") as FullSlug,
                        frontmatter: {
                            title: `${i18n(cfg.locale).pages.folderContent.folder}: ${folder}`,
                            tags: [],
                        },
                    }),
                ]),
            )

            for (const [tree, file] of content) {
                const slug = stripSlashes(simplifySlug(file.data.slug!)) as SimpleSlug
                if (folders.has(slug)) {
                    folderDescriptions[slug] = [tree, file]
                }
            }

            for (const folder of folders) {
                const slug = joinSegments(folder, "index") as FullSlug
                const externalResources = pageResources(pathToRoot(slug), resources)
                for (const folder of folders) {
                    const slug = joinSegments(folder, "index") as FullSlug

                    // Check whether this folder has a matching folder note.
                    const folderNote = allFiles.find((file) => {
                        const noteSlug = stripSlashes(simplifySlug(file.slug!))
                        const noteFolder = path.dirname(noteSlug)
                        const noteName = path.basename(noteSlug)
                        const folderName = path.basename(folder)

                        return noteFolder === folder && noteName === folderName
                    })

                    let content: string

                    if (folderNote) {
                        // Redirect the folder URL to its matching folder note.
                        const folderName = path.basename(folder)
                        const target = `./${encodeURIComponent(folderName)}`

                        content = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta http-equiv="refresh" content="0;url=${target}">
  <title>Redirecting...</title>
  <script>
    window.location.replace(${JSON.stringify(target)})
  </script>
</head>
<body>
  <p>Redirecting to <a href="${target}">${folderName}</a>...</p>
</body>
</html>`
                    } else {
                        // Preserve the normal folder page when no folder note exists.
                        const externalResources = pageResources(pathToRoot(slug), resources)
                        const [tree, file] = folderDescriptions[folder]

                        const componentData: QuartzComponentProps = {
                            ctx,
                            fileData: file.data,
                            externalResources,
                            cfg,
                            children: [],
                            tree,
                            allFiles,
                        }

                        content = renderPage(cfg, slug, componentData, opts, externalResources)
                    }

                    const fp = await write({
                        ctx,
                        content,
                        slug,
                        ext: ".html",
                    })

                    fps.push(fp)
                }
            }
            return fps
        },
    }
}
