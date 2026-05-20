import axios from "axios";

const api = axios.create({
  baseURL:
    "https://expense-tracker-fullstack-dwfm.onrender.com/api",
});

export default api;