// API service for Google Apps Script backend
const API_URL = 'https://script.google.com/macros/s/AKfycbxwV8CRKru8ka6R-zR_-XWj1QwD4F7SaSBt1whTnwGQ2Zp-km0W4MKt-oAogHFeezs6/exec'; // Replace with your deployed web app URL

export const productionAPI = {
    // Fetch all production orders - Using POST method
    async getProductionOrders() {
        return this.getProductionOrdersPost();
    },

    // Use POST for all API calls to avoid CORS
    async getProductionOrdersPost() {
        try {
            const response = await fetch(API_URL, {
                method: 'POST',
                mode: 'cors',
                headers: {
                    'Content-Type': 'text/plain;charset=utf-8',
                },
                body: JSON.stringify({
                    action: 'getProductionOrders'
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error fetching production orders:', error);
            return { success: false, error: error.message };
        }
    },

    // Add new production order
    async addProductionOrder(orderData) {
        try {
            const response = await fetch(API_URL, {
                method: 'POST',
                mode: 'cors',
                headers: {
                    'Content-Type': 'text/plain;charset=utf-8',
                },
                body: JSON.stringify({
                    action: 'addProductionOrder',
                    orderData: orderData
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error adding production order:', error);
            return { success: false, error: error.message };
        }
    },

    // Delete production order
    async deleteProductionOrder(sNo) {
        try {
            const response = await fetch(API_URL, {
                method: 'POST',
                mode: 'cors',
                headers: {
                    'Content-Type': 'text/plain;charset=utf-8',
                },
                body: JSON.stringify({
                    action: 'deleteProductionOrder',
                    sNo: sNo
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error deleting production order:', error);
            return { success: false, error: error.message };
        }
    },

    // Update kitting data for a list of S Nos
    async updateKittingData(sNos, kittingData) {
        try {
            const response = await fetch(API_URL, {
                method: 'POST',
                mode: 'cors',
                headers: {
                    'Content-Type': 'text/plain;charset=utf-8',
                },
                body: JSON.stringify({
                    action: 'updateKittingData',
                    sNos: sNos,
                    kittingData: kittingData
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error updating kitting data:', error);
            return { success: false, error: error.message };
        }
    },

    // Clear kitting data (revert to pending) for a list of S Nos
    async clearKittingData(sNos) {
        try {
            const response = await fetch(API_URL, {
                method: 'POST',
                mode: 'cors',
                headers: {
                    'Content-Type': 'text/plain;charset=utf-8',
                },
                body: JSON.stringify({
                    action: 'clearKittingData',
                    sNos: sNos
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error clearing kitting data:', error);
            return { success: false, error: error.message };
        }
    },

    // Approve kitting data for a list of S Nos
    async approveKittingData(sNos, status, remarks) {
        try {
            const response = await fetch(API_URL, {
                method: 'POST',
                mode: 'cors',
                headers: {
                    'Content-Type': 'text/plain;charset=utf-8',
                },
                body: JSON.stringify({
                    action: 'approveKittingData',
                    sNos: sNos,
                    status: status,
                    remarks: remarks
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error approving kitting data:', error);
            return { success: false, error: error.message };
        }
    },

    // Fetch all BOM records
    async getBOM() {
        try {
            const response = await fetch(API_URL, {
                method: 'POST',
                mode: 'cors',
                headers: {
                    'Content-Type': 'text/plain;charset=utf-8',
                },
                body: JSON.stringify({
                    action: 'getBOM'
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error fetching BOM:', error);
            return { success: false, error: error.message };
        }
    },

    // Add new BOM record
    async addBOM(bomData) {
        try {
            const response = await fetch(API_URL, {
                method: 'POST',
                mode: 'cors',
                headers: {
                    'Content-Type': 'text/plain;charset=utf-8',
                },
                body: JSON.stringify({
                    action: 'addBOM',
                    bomData: bomData
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error adding BOM:', error);
            return { success: false, error: error.message };
        }
    },

    // Update BOM record by rowIndex
    async updateBOM(rowIndex, bomData) {
        try {
            const response = await fetch(API_URL, {
                method: 'POST',
                mode: 'cors',
                headers: {
                    'Content-Type': 'text/plain;charset=utf-8',
                },
                body: JSON.stringify({
                    action: 'updateBOM',
                    rowIndex: rowIndex,
                    bomData: bomData
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error updating BOM:', error);
            return { success: false, error: error.message };
        }
    },

    // Delete BOM record by rowIndex
    async deleteBOM(rowIndex) {
        try {
            const response = await fetch(API_URL, {
                method: 'POST',
                mode: 'cors',
                headers: {
                    'Content-Type': 'text/plain;charset=utf-8',
                },
                body: JSON.stringify({
                    action: 'deleteBOM',
                    rowIndex: rowIndex
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error deleting BOM:', error);
            return { success: false, error: error.message };
        }
    },

    // Fetch all inventory records
    async getInventory() {
        try {
            const response = await fetch(API_URL, {
                method: 'POST',
                mode: 'cors',
                headers: {
                    'Content-Type': 'text/plain;charset=utf-8',
                },
                body: JSON.stringify({
                    action: 'getInventory'
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error fetching inventory:', error);
            return { success: false, error: error.message };
        }
    },

    // Update or Add Inventory record
    async updateInventory(inventoryData) {
        try {
            const response = await fetch(API_URL, {
                method: 'POST',
                mode: 'cors',
                headers: {
                    'Content-Type': 'text/plain;charset=utf-8',
                },
                body: JSON.stringify({
                    action: 'updateInventory',
                    inventoryData: inventoryData
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error updating inventory:', error);
            return { success: false, error: error.message };
        }
    },

    // Fetch all Kitting Approval History records
    async getKittingApprovalHistory() {
        try {
            const response = await fetch(API_URL, {
                method: 'POST',
                mode: 'cors',
                headers: {
                    'Content-Type': 'text/plain;charset=utf-8',
                },
                body: JSON.stringify({
                    action: 'getKittingApprovalHistory'
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error fetching approval history:', error);
            return { success: false, error: error.message };
        }
    },

    // Fetch all Actual Production records
    async getActualProduction() {
        try {
            const response = await fetch(API_URL, {
                method: 'POST',
                mode: 'cors',
                headers: {
                    'Content-Type': 'text/plain;charset=utf-8',
                },
                body: JSON.stringify({
                    action: 'getActualProduction'
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error fetching actual production:', error);
            return { success: false, error: error.message };
        }
    },

    // Add new Actual Production record
    async addActualProduction(productionData) {
        try {
            const response = await fetch(API_URL, {
                method: 'POST',
                mode: 'cors',
                headers: {
                    'Content-Type': 'text/plain;charset=utf-8',
                },
                body: JSON.stringify({
                    action: 'addActualProduction',
                    productionData: productionData
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error adding actual production:', error);
            return { success: false, error: error.message };
        }
    },

    // Delete Actual Production record
    async deleteActualProduction(sNo) {
        try {
            const response = await fetch(API_URL, {
                method: 'POST',
                mode: 'cors',
                headers: {
                    'Content-Type': 'text/plain;charset=utf-8',
                },
                body: JSON.stringify({
                    action: 'deleteActualProduction',
                    sNo: sNo
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error deleting actual production:', error);
            return { success: false, error: error.message };
        }
    },

    // Fetch all Quality Testing records from Costing history
    async getTestingHistory() {
        try {
            const response = await fetch(API_URL, {
                method: 'POST',
                mode: 'cors',
                headers: {
                    'Content-Type': 'text/plain;charset=utf-8',
                },
                body: JSON.stringify({
                    action: 'getTestingHistory'
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error fetching testing history:', error);
            return { success: false, error: error.message };
        }
    },

    // Add new Quality Testing record to Costing history
    async addTestingHistory(testingData) {
        try {
            const response = await fetch(API_URL, {
                method: 'POST',
                mode: 'cors',
                headers: {
                    'Content-Type': 'text/plain;charset=utf-8',
                },
                body: JSON.stringify({
                    action: 'addTestingHistory',
                    testingData: testingData
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error adding testing history:', error);
            return { success: false, error: error.message };
        }
    },

    // Delete Quality Testing record from Costing history
    async deleteTestingHistory(sNo) {
        try {
            const response = await fetch(API_URL, {
                method: 'POST',
                mode: 'cors',
                headers: {
                    'Content-Type': 'text/plain;charset=utf-8',
                },
                body: JSON.stringify({
                    action: 'deleteTestingHistory',
                    sNo: sNo
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error deleting testing history:', error);
            return { success: false, error: error.message };
        }
    }
};