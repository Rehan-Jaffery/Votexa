import api from "./api";

export const createAnnouncement = async (data) => {
    // data: { title, content, audience_scope, priority }
    const response = await api.post("/announcements/", data);
    return response.data;
};

export const getAnnouncements = async () => {
    const response = await api.get("/announcements/");
    return response.data;
};

export const deleteAnnouncement = async (id) => {
    const response = await api.delete(`/announcements/${id}`);
    return response.data;
};
