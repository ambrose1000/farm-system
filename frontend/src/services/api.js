import axios from "axios";

// Detect current network
function detectBackendBaseURL() {
  const hostname = window.location.hostname;

  // If frontend is accessed locally (LAN 192.168.2.x)
  if (hostname.startsWith("192.168.2.")) {
    return "http://192.168.2.20:8000";
  }

  // If frontend is accessed from WAN or another LAN (192.168.0.x)
  if (hostname.startsWith("192.168.0.")) {
    return "http://192.168.0.115:8000";
  }

  // Fallback for Vite dev, Twingate, external networks, domains
  return "http://192.168.2.20:8000";
}

const api = axios.create({
  baseURL: detectBackendBaseURL(),
});

export default api;
