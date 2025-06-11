document.addEventListener("DOMContentLoaded", function () {
    const searchButton = document.getElementById("Search");
    const resultDiv = document.getElementById("result");
    const promptInput = document.getElementById("prompt");

    if (promptInput) {
        promptInput.addEventListener("keydown", (e) => {
            if (e.key === "Enter" && !e.shiftKey && !e.ctrlKey) {
                e.preventDefault();
                searchButton.click();
            }
        });
    }

    searchButton.addEventListener("click", () => {
        resultDiv.innerHTML = `
            <div class="gemini-loader-container">
                <div class="gemini-loader"></div>
                <div class="gemini-loader-text">Getting response from Gemini...</div>
            </div>
        `;

        chrome.storage.sync.get(["apiKey"], (results) => {
            if (!results.apiKey) {
                alert("Please set your API Key in the options.");
                return;
            }

            if (promptInput) {
                processPrompt(promptInput.value, results.apiKey);
            } else {
                chrome.tabs.query(
                    { active: true, currentWindow: true },
                    (tabs) => {
                        chrome.tabs.sendMessage(
                            tabs[0].id,
                            { type: "searchGivenText" },
                            (response) => {
                                if (chrome.runtime.lastError) {
                                    resultDiv.textContent =
                                        "Error: " +
                                        chrome.runtime.lastError.message;
                                    return;
                                }

                                if (response && response.text) {
                                    console.log(
                                        "Selected text:",
                                        response.text
                                    );
                                    processPrompt(
                                        response.text,
                                        results.apiKey
                                    );
                                } else {
                                    resultDiv.textContent =
                                        "No text selected on the webpage.";
                                }
                            }
                        );
                    }
                );
            }
        });
    });

    async function processPrompt(text, apiKey) {
        try {
            const result = await getGeminiResponse(text, apiKey);
            // Convert markdown to HTML before rendering
            // resultDiv.innerHTML = convertMarkdownToHTML(result);
            // resultDiv.textContent = result || "No response from Gemini.";
            console.log("Gemini response:", result);
            const element = document.createElement("pre");
            element.textContent = result || "No response from Gemini.";
            resultDiv.innerHTML = ""; // Clear previous content
            resultDiv.appendChild(element);
        } catch (error) {
            console.error("Error:", error);
            resultDiv.textContent = "Error: " + error.message;
        }
    }

    // Updated markdown-to-HTML converter:
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
                // Remove the bullet marker ('* ') and trim the line
                let listItem = line.trim().substring(2).trim();
                result += "<li>" + listItem + "</li>";
            } else {
                if (inList) {
                    result += "</ul>";
                    inList = false;
                }
                // Only add non-empty lines as paragraphs
                if (line.trim() !== "") {
                    result += "<p>" + line.trim() + "</p>";
                }
            }
        });
        if (inList) result += "</ul>";

        return result;
    }

    async function getGeminiResponse(query, apiKey) {
        const maxLen = 1000;
        if (query.length > maxLen) {
            throw new Error(
                `Query exceeds maximum length of ${maxLen} characters.`
            );
        }

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
        return data.candidates?.[0]?.content?.parts?.[0]?.text ?? "No result";
    }

    // Options link
    document.getElementById("options-link").addEventListener("click", () => {
        chrome.runtime.openOptionsPage();
    });
});
