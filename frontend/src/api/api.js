// import axios from "axios";

// const API_BASE_URL = "https://api.findflavor.site/api/v1";
// const REFRESH_API = `${API_BASE_URL}/auth/refresh`;

// const api = axios.create({
//   baseURL: API_BASE_URL,
//   headers: {
//     "Content-Type": "application/json",
//   },
// });

// let isRefreshing = false;
// let failedQueue = [];

// const processQueue = (error, token = null) => {
//   failedQueue.forEach((prom) => {
//     if (error) {
//       prom.reject(error);
//     } else {
//       prom.resolve(token);
//     }
//   });

//   failedQueue = [];
// }

// api.interceptors.request.use((config) => {
//   const token = localStorage.getItem("accessToken");
//   if (token) {
//     config.headers.Authorization = `Bearer ${token}`;
//   }
//   return config;
// }, (error) => {
//   return Promise.reject(error);
// });

// api.interceptors.response.use(
//   (response) => response,
//   async error => {
//     const originalRequest = error.config;

//     if (error.response?.status === 401 && originalRequest.url !== REFRESH_API) {
//       if(originalRequest._retry) {
//         localStorage.clear();
//         window.location.href = '/login';
//         return Promise.reject(error);
//       }
//       originalRequest._retry = true; // Mark this request for retry
      
//       // 1. If a refresh is already happening, queue the failed request
//       if (isRefreshing) {
//         return new Promise(function(resolve, reject) {
//           failedQueue.push({ resolve, reject });
//         }).then(token => {
//           // Retry the request with the new token
//           originalRequest.headers.Authorization = `Bearer ${token}`;
//           return api(originalRequest);
//         }).catch(err => {
//           return Promise.reject(err);
//         });
//       }

//       isRefreshing = true; // Start the refresh process

//       const refreshToken = localStorage.getItem('refreshToken');
//       if (!refreshToken) {
//         // No refresh token available, force log out
//         localStorage.clear();
//         window.location.href = '/login';
//         return Promise.reject(error);
//       }

//       try {
//         // ⭐ API CALL TO REFRESH TOKEN ⭐
//         const res = await axios.post(REFRESH_API, { refreshToken });
        
//         const newAccessToken = res.data.accessToken;
//         const newRefreshToken = res.data.refreshToken || refreshToken; // Use new RT if provided

//         // Update local storage with new tokens
//         localStorage.setItem('accessToken', newAccessToken);
//         localStorage.setItem('refreshToken', newRefreshToken);

//         // 2. Update the header of the original request
//         originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        
//         // 3. Process the queue of requests that failed while refreshing
//         processQueue(null, newAccessToken); 
        
//         // 4. Retry the original request
//         return api(originalRequest);

//       } catch (refreshError) {
//         // Refresh token failed (e.g., expired or revoked)
//         processQueue(refreshError, null); // Reject all queued requests
//         localStorage.clear();
//         window.location.href = '/login'; // Force log out
//         return Promise.reject(refreshError);
//       } finally {
//         isRefreshing = false;
//       }
//     }

//     // Return error for all other non-401 statuses (400, 403, 500, etc.)
//     return Promise.reject(error);
//   }
// );
// export default api;
