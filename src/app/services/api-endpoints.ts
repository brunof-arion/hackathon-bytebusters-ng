
const API = 'https://sw7blq3c19.execute-api.us-east-1.amazonaws.com/production'

export const API_ENDPOINTS = {
    getPositions: `${API}/position`,
    getCandidate: `${API}/get-candidate`,
    saveCandidate: `${API}/save-candidate`,
    updateStatus: `${API}/update-status`,
    getCandidateTemplate: `${API}/get-candidate-template`,
    evaluateCandidate: `${API}/evaluate-candidate-ia`
};
