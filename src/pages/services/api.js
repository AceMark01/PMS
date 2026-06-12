// // API service for Google Apps Script backend
// const API_URL = 'https://script.google.com/macros/s/AKfycbxwV8CRKru8ka6R-zR_-XWj1QwD4F7SaSBt1whTnwGQ2Zp-km0W4MKt-oAogHFeezs6/exec'; // Replace with your deployed web app URL

// export const productionAPI = {
//     // Fetch all production orders - Using POST method
//     async getProductionOrders() {
//         try {
//             const response = await fetch(API_URL, {
//                 method: 'POST',
//                 mode: 'cors',
//                 headers: {
//                     'Content-Type': 'text/plain;charset=utf-8',
//                 },
//                 body: JSON.stringify({
//                     action: 'getProductionOrders'
//                 })
//             });

//             if (!response.ok) {
//                 throw new Error(`HTTP error! status: ${response.status}`);
//             }

//             const data = await response.json();
//             return data;
//         } catch (error) {
//             console.error('Error fetching production orders:', error);
//             return { success: false, error: error.message };
//         }
//     },

//     // Add new production order
//     async addProductionOrder(orderData) {
//         try {
//             const response = await fetch(API_URL, {
//                 method: 'POST',
//                 mode: 'cors',
//                 headers: {
//                     'Content-Type': 'text/plain;charset=utf-8',
//                     'Accept': 'application/json',
//                 },
//                 body: JSON.stringify({
//                     action: 'addProductionOrder',
//                     orderData: orderData
//                 })
//             });

//             if (!response.ok) {
//                 throw new Error(`HTTP error! status: ${response.status}`);
//             }

//             const data = await response.json();
//             return data;
//         } catch (error) {
//             console.error('Error adding production order:', error);
//             return { success: false, error: error.message };
//         }
//     },

//     // Delete production order
//     async deleteProductionOrder(sNo) {
//         try {
//             const response = await fetch(API_URL, {
//                 method: 'POST',
//                 mode: 'cors',
//                 headers: {
//                     'Content-Type': 'text/plain;charset=utf-8',
//                     'Accept': 'application/json',
//                 },
//                 body: JSON.stringify({
//                     action: 'deleteProductionOrder',
//                     sNo: sNo
//                 })
//             });

//             if (!response.ok) {
//                 throw new Error(`HTTP error! status: ${response.status}`);
//             }

//             const data = await response.json();
//             return data;
//         } catch (error) {
//             console.error('Error deleting production order:', error);
//             return { success: false, error: error.message };
//         }
//     }
// };