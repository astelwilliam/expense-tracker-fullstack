import axios from "axios";

const API = axios.create({
  baseURL: "https://expense-tracker-fullstack-dvfm.onrender.com/api",
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
});

export default API;