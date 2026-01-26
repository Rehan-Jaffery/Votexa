import api from "./api";

export const getActiveElections = async () => {
    const response = await api.get("/elections/active");
    return response.data;
};

export const getCandidates = async (electionId) => {
    const response = await api.get(`/elections/${electionId}/candidates`);
    return response.data;
};

export const castVote = async (electionId, candidateId) => {
    const response = await api.post("/votes/vote", {
        election_id: electionId,
        candidate_id: candidateId
    });
    return response.data;
};
