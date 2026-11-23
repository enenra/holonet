
import { FolderState } from "../ExplorerNode"

type MaybeHTMLElement = HTMLElement | null

let currentExplorerState: FolderState[] = []

const observer = new IntersectionObserver((entries) => {
    const explorerUl = document.getElementById("explorer-ul")
    if (!explorerUl) return

    for (const entry of entries) {
        if (entry.isIntersecting) {
            explorerUl.classList.add("no-background")
        } else {
            explorerUl.classList.remove("no-background")
        }
    }
})

function toggleExplorer(this: HTMLElement) {
    this.classList.toggle("collapsed")

    const expanded = this.getAttribute("aria-expanded") === "true"

    this.setAttribute("aria-expanded", String(!expanded))

    const content = document.getElementById("explorer-content")
    if (!content) return

    content.classList.toggle("collapsed")
}

function saveFolderState(path: string, collapsed: boolean) {
    const entry = currentExplorerState.find((item) => item.path === path)

    if (entry) {
        entry.collapsed = collapsed
    } else {
        currentExplorerState.push({ path, collapsed })
    }

    localStorage.setItem("fileTree", JSON.stringify(currentExplorerState))
}

function toggleFolder(evt: Event) {
    const target = evt.target as HTMLElement | null
    if (!target) return

    const icon = target.closest(".folder-icon")
    const button = target.closest(".folder-button")

    if (!icon && !button) return

    evt.preventDefault()
    evt.stopPropagation()

    const folderPathElement = (
        icon
            ? icon.parentElement?.querySelector("[data-folderpath]")
            : button?.closest("[data-folderpath]")
    ) as MaybeHTMLElement

    if (!folderPathElement) return

    const folderContainer = folderPathElement.parentElement
    const folderOuter = folderContainer?.nextElementSibling as MaybeHTMLElement

    if (!folderOuter) return

    folderOuter.classList.toggle("open")

    const collapsed = !folderOuter.classList.contains("open")
    const path = folderPathElement.dataset.folderpath

    if (path) {
        saveFolderState(path, collapsed)
    }
}

function setupExplorer() {
    const explorer = document.getElementById("explorer")
    const explorerContainer = document.querySelector(".explorer")

    if (!explorer || !explorerContainer) return

    // Set up the main Explorer heading
    explorer.addEventListener("click", toggleExplorer)
    window.addCleanup(() =>
        explorer.removeEventListener("click", toggleExplorer),
    )

    // Set up folder click handling
    explorerContainer.addEventListener("click", toggleFolder)
    window.addCleanup(() =>
        explorerContainer.removeEventListener("click", toggleFolder),
    )

    // Restore saved folder states
    const storageTree = localStorage.getItem("fileTree")
    const useSavedState = explorer.dataset.savestate === "true"

    const oldState: FolderState[] =
        storageTree && useSavedState ? JSON.parse(storageTree) : []

    const oldIndex = new Map(
        oldState.map((entry) => [entry.path, entry.collapsed]),
    )

    const newState: FolderState[] = explorer.dataset.tree
        ? JSON.parse(explorer.dataset.tree)
        : []

    currentExplorerState = newState.map(({ path, collapsed }) => ({
        path,
        collapsed: oldIndex.has(path)
            ? oldIndex.get(path)!
            : collapsed,
    }))

    // Preserve saved folder states that are missing from data-tree
    for (const saved of oldState) {
        if (!currentExplorerState.some((entry) => entry.path === saved.path)) {
            currentExplorerState.push(saved)
        }
    }

    // Apply saved states to the rendered folder tree
    // Restore saved folder states
    const folderElements = explorerContainer.querySelectorAll<HTMLElement>(
        "[data-folderpath]",
    )

    folderElements.forEach((folderPathElement) => {
        const path = folderPathElement.dataset.folderpath
        if (!path) return

        const state = currentExplorerState.find(
            (entry) => entry.path === path,
        )

        if (!state) return

        // The folder content is the sibling after .folder-container
        const folderContainer = folderPathElement.closest(".folder-container")
        const folderOuter = folderContainer?.nextElementSibling

        if (!(folderOuter instanceof HTMLElement)) return

        folderOuter.classList.toggle("open", !state.collapsed)
    })
}

document.addEventListener("nav", () => {
    setupExplorer()

    observer.disconnect()

    const lastItem = document.getElementById("explorer-end")
    if (lastItem) observer.observe(lastItem)
})
