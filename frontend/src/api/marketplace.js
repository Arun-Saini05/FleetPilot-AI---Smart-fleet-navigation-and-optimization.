import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000/api/marketplace';

// Get a token from localStorage or your state manager
const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return { headers: { Authorization: `Bearer ${token}` } };
};

export const fetchMarketplaceLoads = async () => {
    const response = await axios.get(`${API_BASE_URL}/loads`, getAuthHeaders());
    return response.data;
};

export const createMarketplaceLoad = async (loadData) => {
    const response = await axios.post(`${API_BASE_URL}/loads`, loadData, getAuthHeaders());
    return response.data;
};

export const placeCarrierBid = async (loadId, bidAmount, deliveryHours) => {
    const response = await axios.post(
        `${API_BASE_URL}/loads/${loadId}/bid`,
        { bid_amount: bidAmount, estimated_delivery_hours: deliveryHours },
        getAuthHeaders()
    );
    return response.data;
};

export const fetchIncomingBids = async () => {
    const response = await axios.get(`${API_BASE_URL}/my-loads/bids`, getAuthHeaders());
    return response.data;
};

export const fetchMyBids = async () => {
    const response = await axios.get(`${API_BASE_URL}/my-bids`, getAuthHeaders());
    return response.data;
};

export const awardFreightContract = async (bidId) => {
    const response = await axios.post(`${API_BASE_URL}/bids/${bidId}/accept`, {}, getAuthHeaders());
    return response.data;
};