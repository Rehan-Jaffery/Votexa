import axios from "axios";

const API_URL = "http://127.0.0.1:5000/api";

export const loginUser = async (university_id) => {
  const response = await axios.post(`${API_URL}/login`, {
    university_id: university_id,
  });

  return response.data;
};
