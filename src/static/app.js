document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
  // Avoid returning a cached response so UI reflects recent changes
  const response = await fetch("/activities", { cache: "no-store" });
      const activities = await response.json();

  // Clear loading message
  activitiesList.innerHTML = "";

  // Reset activity select options
  activitySelect.innerHTML = `<option value="">-- Select an activity --</option>`;

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft = details.max_participants - details.participants.length;

        activityCard.innerHTML = `
          <h4>${name}</h4>
          <p>${details.description}</p>
          <p><strong>Schedule:</strong> ${details.schedule}</p>
          <p><strong>Availability:</strong> ${spotsLeft} spots left</p>
        `;

        // Participants section (bulleted list)
        const participantsDiv = document.createElement("div");
        participantsDiv.className = "participants";

        const participantsHeader = document.createElement("strong");
        participantsHeader.textContent = "Participants:";
        participantsDiv.appendChild(participantsHeader);

        const ul = document.createElement("ul");
        // Create list items for each participant (hidden bullets, delete icon)
        details.participants.forEach((participant) => {
          const li = document.createElement("li");
          li.className = "participant-item";

          const span = document.createElement("span");
          span.className = "participant-email";
          span.textContent = participant;

          const delBtn = document.createElement("button");
          delBtn.type = "button";
          delBtn.className = "participant-delete";
          delBtn.setAttribute("aria-label", `Remove ${participant} from ${name}`);
          delBtn.innerHTML = "&times;"; // simple cross icon

          // Wire up delete handler
          delBtn.addEventListener("click", async (e) => {
            e.preventDefault();
            // Call DELETE endpoint to remove participant
            try {
              const resp = await fetch(
                `/activities/${encodeURIComponent(name)}/participants?email=${encodeURIComponent(participant)}`,
                { method: "DELETE" }
              );

              const resJson = await resp.json();
              if (resp.ok) {
                messageDiv.textContent = resJson.message || "Participant removed";
                messageDiv.className = "message success";
                messageDiv.classList.remove("hidden");
                // Refresh activities to reflect change and wait for it to finish
                await fetchActivities();
              } else {
                messageDiv.textContent = resJson.detail || "Could not remove participant";
                messageDiv.className = "message error";
                messageDiv.classList.remove("hidden");
              }

              // Hide message after 4 seconds
              setTimeout(() => messageDiv.classList.add("hidden"), 4000);
            } catch (err) {
              console.error("Error removing participant:", err);
              messageDiv.textContent = "Failed to remove participant. Try again.";
              messageDiv.className = "message error";
              messageDiv.classList.remove("hidden");
              setTimeout(() => messageDiv.classList.add("hidden"), 4000);
            }
          });

          li.appendChild(span);
          li.appendChild(delBtn);
          ul.appendChild(li);
        });

        participantsDiv.appendChild(ul);
        activityCard.appendChild(participantsDiv);

        activitiesList.appendChild(activityCard);

        // Add option to select dropdown
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      });
    } catch (error) {
      activitiesList.innerHTML = "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "message success";
        signupForm.reset();
  // Refresh activities list to show new participant and wait for it to finish
  await fetchActivities();
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "message error";
      }

      messageDiv.classList.remove("hidden");

      // Hide message after 5 seconds
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to sign up. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error signing up:", error);
    }
  });

  // Initialize app
  fetchActivities();
});
