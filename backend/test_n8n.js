const token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI4OTkzMGRkNy00ZDFkLTRjMmItODA1YS05NGU2NmNjYjZhNDYiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwianRpIjoiODkxYjQ2MTUtMjJiNy00NDY4LWIxMTMtYTJiMTlkMzQ2MzlhIiwiaWF0IjoxNzgwMjU2MTcyfQ.yVE986YkceSNPPxUwHF5cW1Oklu_gSOjKb9Nj0tcUXg";
const url = "https://n8n.andreverissimo.shop/api/v1/workflows/1CUu2mqTMxbYCz9R";
const fs = require('fs');

async function downloadWorkflow() {
  try {
    const res = await fetch(url, {
      headers: {
        "X-N8N-API-KEY": token
      }
    });
    if (!res.ok) {
      console.error(`Failed to fetch. Status: ${res.status}`);
      return;
    }
    const data = await res.json();
    fs.writeFileSync('workflow_agent.json', JSON.stringify(data, null, 2));
    console.log("Workflow downloaded successfully and saved as workflow_agent.json!");
  } catch (err) {
    console.error("Error calling n8n API:", err.message);
  }
}

downloadWorkflow();
