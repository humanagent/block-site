const status = document.getElementById("status");
const pauses = document.querySelectorAll("button[data-min]");
const resume = document.getElementById("resume");

async function render() {
  const { off } = await chrome.storage.local.get("off");
  const alarm = await chrome.alarms.get("resume");
  pauses.forEach((b) => (b.hidden = !!off));
  resume.hidden = !off;
  if (!off) status.textContent = "Activo";
  else if (alarm) {
    const t = new Date(alarm.scheduledTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    status.textContent = `En pausa hasta las ${t}`;
  } else status.textContent = "En pausa";
}

const send = (msg) => chrome.runtime.sendMessage(msg).then(render);
pauses.forEach((b) => b.addEventListener("click", () => send({ off: true, minutes: Number(b.dataset.min) })));
resume.addEventListener("click", () => send({ off: false }));

render();
