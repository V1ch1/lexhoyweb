// Test GET endpoint
fetch("http://localhost:3000/api/webhooks/lexhoy")
  .then((res) => res.json())
  .then((data) => console.log("✅ GET Response:", JSON.stringify(data, null, 2)))
  .catch((err) => console.error("❌ Error:", err.message));
