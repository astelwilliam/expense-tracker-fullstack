import axios from "axios";

const api = axios.create({
  baseURL: "https://expense-tracker-fullstack-dvfm.onrender.com/api",
});

export default api;