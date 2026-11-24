
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
    const explorerContainer = document.querySelector(".explorer")
    if (!explorerContainer) return

    // Set up folder click handling
    explorerContainer.addEventListener("click", toggleFolder)
    window.addCleanup(() =>
        explorerContainer.removeEventListener("click", toggleFolder),
    )

    // Restore saved folder states
    const storageTree = localStorage.getItem("fileTree")
    const oldState: FolderState[] =
        storageTree ? JSON.parse(storageTree) : []

    const oldIndex = new Map(
        oldState.map((entry) => [entry.path, entry.collapsed]),
    )

    const newState: FolderState[] = []

    // Read the rendered folders and their current default state.
    const folderElements = explorerContainer.querySelectorAll<HTMLElement>(
        "[data-folderpath]",
    )

    folderElements.forEach((folderPathElement) => {
        const path = folderPathElement.dataset.folderpath
        if (!path) return

        const folderContainer = folderPathElement.closest(".folder-container")
        const folderOuter = folderContainer?.nextElementSibling

        if (!(folderOuter instanceof HTMLElement)) return

        const defaultCollapsed = !folderOuter.classList.contains("open")
        const collapsed = oldIndex.has(path)
            ? oldIndex.get(path)!
            : defaultCollapsed

        folderOuter.classList.toggle("open", !collapsed)
        newState.push({ path, collapsed })
    })

    currentExplorerState = newState

    // Preserve saved states for folders not currently rendered.
    for (const saved of oldState) {
        if (!currentExplorerState.some((entry) => entry.path === saved.path)) {
            currentExplorerState.push(saved)
        }
    }
}

document.addEventListener("nav", () => {
    setupExplorer()

    observer.disconnect()

    const lastItem = document.getElementById("explorer-end")
    if (lastItem) observer.observe(lastItem)
})
