document.addEventListener("nav", () => {
  for (const facade of document.querySelectorAll<HTMLElement>(".youtube-facade")) {
    const button = facade.querySelector("button")
    const src = facade.dataset.embedSrc
    if (!button || !src) continue

    const load = () => {
      const frame = document.createElement("iframe")
      frame.className = "external-embed youtube"
      frame.setAttribute("allow", "fullscreen")
      frame.setAttribute("frameborder", "0")
      frame.setAttribute("title", "YouTube video player")
      frame.setAttribute("width", "600px")
      frame.src = src
      facade.replaceWith(frame)
    }

    button.addEventListener("click", load)
    window.addCleanup(() => button.removeEventListener("click", load))
  }
})
