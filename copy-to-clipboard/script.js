async function copyText() {
    const textToCopy = document.getElementById("textToCopy");
    const feedback = document.getElementById("feedback");

    try {
        await navigator.clipboard.writeText(textToCopy.value.trim());
        feedback.textContent = "Text copied!";
    } catch {
        // The Clipboard API needs a secure context (https or localhost).
        feedback.textContent = "Copying is not available here. Select the text and copy it manually.";
    }
    feedback.classList.remove("hidden");

    // Hide the feedback message after 2 seconds
    setTimeout(function () {
        feedback.classList.add("hidden");
    }, 2000);
}
