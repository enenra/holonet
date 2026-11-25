
import { QuartzFilterPlugin } from "../types"

export const ExcludeUnpublished: QuartzFilterPlugin = () => ({
    name: "ExcludeUnpublished",
    shouldPublish(_ctx, [_tree, file]) {
        // Include unpublished notes in local builds.
        if (process.env.NODE_ENV !== "production") {
            return true
        }

        const tags = file.data.frontmatter?.tags ?? []

        return !tags.some(
            (tag) => String(tag).toLowerCase() === "unpublished",
        )
    },
})
