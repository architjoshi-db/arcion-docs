// copy code icon markup
const copyIcon = `<span class="material-symbols-outlined tooltip">content_copy</span>`
const copySuccessIcon = `<span class="material-symbols-outlined">done</span>`

// insert copy buttons for code blocks
const codeBlocks = document.querySelectorAll("div.highlight")
codeBlocks.forEach((codeBlock) => {
  codeBlock.insertAdjacentHTML(
    "afterbegin",
    `<button class="copy" data-label="Click to copy" data-tooltip="Copy" aria-label="Copy code sample to clipboard">${copyIcon}</button>`
  )
})

// handler that saves the code block innerText to clipboard
function copyCodeBlock(event) {
  const copyButton = event.currentTarget
  copyButton.classList.add("no-hover")

  const codeBlock = copyButton.parentElement.querySelector("div.highlight pre code")
  const code = codeBlock.textContent.trim()
  const strippedCode = code.replace(/^[\s]?\$|postgres=>\s+/gm, "")
  window.navigator.clipboard.writeText(strippedCode)

  // change the button temporarily and restore  
  // the hover effect and copy icon
  copyButton.innerHTML = copySuccessIcon 
  setTimeout(() => { 
    copyButton.innerHTML = copyIcon;
    copyButton.classList.remove("no-hover")
  }, 3000)
}

// register event listeners for copy buttons
const copyButtons = document.querySelectorAll("button.copy")
copyButtons.forEach((button) => {
  button.addEventListener("click", copyCodeBlock)
})