document.addEventListener("DOMContentLoaded", function () {
    // Load saved API key if it exists
    chrome.storage.sync.get(["apiKey"], function (result) {
        if (result.apiKey) {
            document.getElementById("apiKey").value = result.apiKey;
        }
    });

    // Save API key when button is clicked
    document.getElementById("save").addEventListener("click", function () {
        const apiKey = document.getElementById("apiKey").value.trim();

        if (!apiKey) {
            showStatus("Please enter an API key.", "error");
            return;
        }

        // Save to Chrome storage
        chrome.storage.sync.set({ apiKey: apiKey }, function () {
            showStatus("API key saved successfully!", "success");

            // Optional: Test the API key
            testApiKey(apiKey);
        });
    });

    function showStatus(message, type) {
        const status = document.getElementById("status");
        status.textContent = message;
        status.className = "status " + type;
        status.style.display = "block";

        // Hide the status message after 3 seconds
        setTimeout(function () {
            status.style.display = "none";
        }, 3000);
    }

    // Optional: Test if the API key works
    async function testApiKey(apiKey) {
        try {
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
                                        text: "Hello, this is a test.",
                                    },
                                ],
                            },
                        ],
                    }),
                }
            );

            if (!response.ok) {
                const error = await response.json();
                showStatus(
                    "API key error: " +
                        (error?.error?.message || "Unknown error"),
                    "error"
                );
            }
            // If no error, we already showed success message when saving
        } catch (error) {
            showStatus("Error testing API key: " + error.message, "error");
        }
    }
});
