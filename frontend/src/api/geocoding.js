import axios from 'axios';

const LOCATIONIQ_TOKEN = "pk.ef4ba1bfada4e18349c160e28451c837";

export const fetchAddressSuggestions = async (query) => {
    if (!query || query.length < 3) return [];

    try {
        const response = await axios.get(`https://api.locationiq.com/v1/autocomplete`, {
            params: {
                key: LOCATIONIQ_TOKEN,
                q: query,
                limit: 5,         // Only grab the top 5 matches to keep lists clean
                dedupe: 1         // Filter out identical adjacent text matches
            }
        });
        return response.data; // LocationIQ returns an array of matching place structures
    } catch (error) {
        console.error("LocationIQ Autocomplete bypass drop:", error);
        return [];
    }
};