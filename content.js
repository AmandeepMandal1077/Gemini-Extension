// Function to get selected text
const getText = () => window.getSelection().toString().trim();

// Listen for messages from popup or background
chrome.runtime.onMessage.addListener((req, sender, sendResponse) => {
    if (req.type === "searchGivenText") {
        const text = getText();
        console.log("Selected text:", text);
        if (text) {
            sendResponse({ text });
        } else {
            console.warn("No text selected to search.");
        }
        return true;
    } else if (req.type === "showGeminiPopup") {
        createAndShowPopup(req.text);
        sendResponse({ status: "popup_shown" });
        return true;
    }
});

// Create and show the floating popup
function createAndShowPopup(selectedText) {
    // Remove any existing popup
    const existingPopup = document.querySelector(".gemini-popup");
    if (existingPopup) {
        existingPopup.remove();
    }

    // Create popup elements
    const popup = document.createElement("div");
    popup.className = "gemini-popup";

    popup.innerHTML = `
        <div class="gemini-popup-header">
            <h3 class="gemini-popup-title">Gemini Searcher</h3>
            <button class="gemini-popup-close">&times;</button>
        </div>
        <div class="gemini-popup-content">
            <div class="gemini-popup-form">
                <label for="gemini-prompt">Edit your prompt:</label>
                <textarea id="gemini-prompt" rows="4">${selectedText}</textarea>
                <button id="gemini-submit" class="gemini-popup-button">Submit to Gemini</button>
            </div>
            <div id="gemini-result" class="gemini-popup-result">
                <!-- Results will appear here after submission -->
            </div>
        </div>
    `;

    // Add to page
    document.body.appendChild(popup);

    // Add event listener for the close button
    document
        .querySelector(".gemini-popup-close")
        .addEventListener("click", () => {
            popup.remove();
        });

    // Handle form submission
    document.getElementById("gemini-submit").addEventListener("click", () => {
        submitPrompt();
    });

    // Also submit on Enter key (with Ctrl or Shift for multi-line text)
    document
        .getElementById("gemini-prompt")
        .addEventListener("keydown", (e) => {
            if (e.key === "Enter" && !e.shiftKey && !e.ctrlKey) {
                e.preventDefault();
                submitPrompt();
            }
        });

    // Focus the textarea and put cursor at the end
    const textarea = document.getElementById("gemini-prompt");
    textarea.focus();
    textarea.selectionStart = textarea.selectionEnd = textarea.value.length;

    // Function to handle submission
    function submitPrompt() {
        const promptText = document
            .getElementById("gemini-prompt")
            .value.trim();
        if (!promptText) {
            document.getElementById("gemini-result").textContent =
                "Please enter a prompt.";
            return;
        }

        // Show loading animation
        document.getElementById("gemini-result").innerHTML = `
            <div class="gemini-loader-container">
                <div class="gemini-loader"></div>
                <div class="gemini-loader-text">Getting response from Gemini...</div>
            </div>
        `;

        // Get API key and search
        chrome.storage.sync.get(["apiKey"], async (results) => {
            if (!results.apiKey) {
                document.getElementById("gemini-result").textContent =
                    "Please set your API Key in the extension options.";
                return;
            }

            try {
                const result = await getGeminiResponse(
                    promptText,
                    results.apiKey
                );

                document.getElementById("gemini-result").innerHTML =
                    result || "No response from Gemini.";
            } catch (error) {
                console.error("Error fetching Gemini response ->", error);
                document.getElementById("gemini-result").textContent =
                    "Error fetching search results: " + error.message;
            }
        });
    }

    //gpt
    function convertMarkdownToHTML(mdText) {
        let html = mdText;
        // Bold conversion
        html = html.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
        // Italic conversion
        html = html.replace(/\*(.*?)\*/g, "<em>$1</em>");

        // Process bullet lists and paragraphs
        const lines = html.split("\n");
        let result = "";
        let inList = false;
        lines.forEach((line) => {
            if (line.trim().startsWith("* ")) {
                if (!inList) {
                    result += "<ul>";
                    inList = true;
                }
                let listItem = line.trim().substring(2).trim();
                result += "<li>" + listItem + "</li>";
            } else {
                if (inList) {
                    result += "</ul>";
                    inList = false;
                }
                if (line.trim() !== "") {
                    result += "<p>" + line.trim() + "</p>";
                }
            }
        });
        if (inList) result += "</ul>";

        return result;
    }
}

// Function to get Gemini response
async function getGeminiResponse(query, apiKey) {
    const maxLen = 1000;
    if (query.length > maxLen) {
        throw new Error(
            `Query exceeds maximum length of ${maxLen} characters.`
        );
    }

    query =
        query +
        "Please reply in HTML (use `<ul>`, `<li>`, `<strong>`, etc.), not Markdown.";

    const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                contents: [
                    {
                        parts: [
                            {
                                text: query,
                            },
                        ],
                    },
                ],
            }),
        }
    );

    if (!response.ok) {
        const { error } = await response.json();
        throw new Error(error?.message || "Request failed");
    }

    const data = await response.json();
    let res = data.candidates?.[0]?.content?.parts?.[0]?.text ?? "No result";
    if (res.startsWith("```") && res.endsWith("```")) {
        res = res.replace(/^```(?:html)?\r?\n?/, "").replace(/\r?\n?```$/, "");
    }

    return res;
}
