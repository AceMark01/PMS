// API service for Google Apps Script backend
// In dev, requests go to /api/gas/exec (proxied by Vite → GAS, no CORS).
// In production builds, the real GAS URL is used directly.
const API_URL = import.meta.env.DEV
    ? '/api/gas/exec'
    : import.meta.env.VITE_GOOGLE_SHEETS_API;

function getHeaderKey(h) {
    if (!h) return '';
    const clean = h.toString().replace(/[\r\n]+/g, ' ').replace(/\s+/g, ' ').trim();
    const upper = clean.toUpperCase();
    if (upper === 'S NO' || upper === 'S.NO.' || upper === 'S. NO') {
        return 'sNo';
    }
    if (upper === 'QUANTITY (J/I)' || upper === 'QUANTITY(J/I)' || upper === 'QUANTITY (J I)') {
        return 'qty';
    }
    if (upper === 'QTY(FROM RAW MATERIAL)' || upper === 'QTY(FROM RAW)') {
        return 'qtyFromRaw';
    }
    if (upper === 'FG CODE' || upper === 'FGCODE') {
        return 'fgCode';
    }
    if (upper === 'CHECK JC' || upper === 'CHECKJC') {
        return 'checkJc';
    }
    if (upper === 'JOB CARD NO.' || upper === 'JOB CARD NO' || upper === 'JOB CARD' || upper === 'JOBCARDNO') {
        return 'jobCardNo';
    }
    if (upper === 'BASE CAT' || upper === 'BASECAT' || upper === 'BASE CAT.') {
        return 'baseCat';
    }
    if (upper === 'PROD GROUP' || upper === 'PRODGROUP') {
        return 'prodGroup';
    }
    if (upper === 'PRODUCT CODE' || upper === 'PRODUCTCODE') {
        return 'productCode';
    }
    if (upper === 'PRODUCT NAME' || upper === 'PRODUCTNAME') {
        return 'productName';
    }
    if (upper === 'ORDER QUANTITY' || upper === 'ORDERQUANTITY') {
        return 'qty';
    }
    if (upper.includes('ORDER CANCEL') || upper.includes('PRE-CLOSED')) {
        return 'orderCancel';
    }
    if (upper.includes('ACTUAL PRODUCTION PLANNED')) {
        return 'actualProductionPlanned';
    }
    if (upper.includes('ACTUAL PRODUCTION DONE')) {
        return 'actualProductionDone';
    }
    if (upper.includes('PLANNING PENDING QTY') || upper.includes('PLANNING PENDING')) {
        return 'planningPendingQty';
    }
    if (upper.includes('PRODUCTION PENDING QTY') || upper.includes('PRODUCTION PENDING')) {
        return 'productionPendingQty';
    }
    if (upper.includes('DATE OF COMPLETE PLANNING') || upper.includes('COMPLETE PLANNING')) {
        return 'dateOfCompletePlanning';
    }
    if (upper.includes('DATE OF COMPLETE PRODUCTION') || upper.includes('COMPLETE PRODUCTION')) {
        return 'dateOfCompleteProduction';
    }
    return clean
        .replace(/(?:^\w|[A-Z]|\b\w)/g, (word, index) => index === 0 ? word.toLowerCase() : word.toUpperCase())
        .replace(/\s+/g, '');
}

function convert2DArrayToObjects(data, headerRow = 1) {
    if (!data || data.length === 0) return [];
    const headers = data[0];
    const rows = data.slice(1);
    
    const headerKeys = headers.map(getHeaderKey);

    return rows
        .map((row, rowIndex) => {
            const obj = { 
                id: row[0],
                rowIndex: rowIndex + headerRow + 1,
                __rowValues: row
            };
            let hasData = false;
            headerKeys.forEach((key, colIndex) => {
                if (key) {
                    const val = row[colIndex];
                    obj[key] = val;
                    if (val !== undefined && val !== null && val.toString().trim() !== '') {
                        hasData = true;
                    }
                }
            });
            return hasData ? obj : null;
        })
        .filter(Boolean);
}

function mapObjectToRow(headers, obj) {
    const headerKeys = headers.map(getHeaderKey);

    const row = new Array(headers.length).fill('');
    headerKeys.forEach((key, index) => {
        if (key && obj[key] !== undefined) {
            row[index] = obj[key];
        }
    });
    return row;
}

export const productionAPI = {
    // Get full sheet data parsed into camelCase objects
    async getSheetData(sheetName, options = {}) {
        try {
            const response = await fetch(API_URL, {
                method: 'POST',
                mode: 'cors',
                redirect: 'follow',
                headers: {
                    'Content-Type': 'text/plain;charset=utf-8',
                },
                body: JSON.stringify({
                    action: 'read',
                    sheetName: sheetName
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            if (data.success && data.data) {
                const headerRow = options.headerRow || 1;
                const slicedData = data.data.slice(headerRow - 1);
                const headers = slicedData.length > 0 ? slicedData[0] : [];
                const records = convert2DArrayToObjects(slicedData, headerRow);
                return { success: true, records, headers };
            }
            return data;
        } catch (error) {
            console.error(`Error fetching sheet ${sheetName}:`, error);
            return { success: false, error: error.message };
        }
    },

    // Insert a single row
    async insertRow(sheetName, rowObjOrArray, options = {}) {
        try {
            let rowData = rowObjOrArray;
            if (!Array.isArray(rowData)) {
                const headersResult = await this.getSheetHeaders(sheetName, options);
                if (!headersResult.success) {
                    throw new Error(`Failed to fetch headers for ${sheetName}`);
                }
                rowData = mapObjectToRow(headersResult.headers, rowObjOrArray);
            }

            const response = await fetch(API_URL, {
                method: 'POST',
                mode: 'cors',
                redirect: 'follow',
                headers: {
                    'Content-Type': 'text/plain;charset=utf-8',
                },
                body: JSON.stringify({
                    action: 'insert',
                    sheetName: sheetName,
                    rowData: rowData,
                    options: options
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error(`Error inserting row into ${sheetName}:`, error);
            return { success: false, error: error.message };
        }
    },

    // Batch insert multiple rows
    async batchInsertRows(sheetName, rowsDataObjOrArray, options = {}) {
        try {
            let rowsData = rowsDataObjOrArray;
            if (rowsData.length > 0 && !Array.isArray(rowsData[0])) {
                const headersResult = await this.getSheetHeaders(sheetName, options);
                if (!headersResult.success) {
                    throw new Error(`Failed to fetch headers for ${sheetName}`);
                }
                rowsData = rowsDataObjOrArray.map(obj => mapObjectToRow(headersResult.headers, obj));
            }

            const response = await fetch(API_URL, {
                method: 'POST',
                mode: 'cors',
                redirect: 'follow',
                headers: {
                    'Content-Type': 'text/plain;charset=utf-8',
                },
                body: JSON.stringify({
                    action: 'batchInsert',
                    sheetName: sheetName,
                    rowsData: rowsData,
                    options: options
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error(`Error batch inserting rows into ${sheetName}:`, error);
            return { success: false, error: error.message };
        }
    },

    // Update a single row by rowIndex
    async updateRow(sheetName, rowIndex, rowObjOrArray) {
        try {
            let rowData = rowObjOrArray;
            if (!Array.isArray(rowData)) {
                const headersResult = await this.getSheetHeaders(sheetName);
                if (!headersResult.success) {
                    throw new Error(`Failed to fetch headers for ${sheetName}`);
                }
                rowData = mapObjectToRow(headersResult.headers, rowObjOrArray);
            }

            const response = await fetch(API_URL, {
                method: 'POST',
                mode: 'cors',
                redirect: 'follow',
                headers: {
                    'Content-Type': 'text/plain;charset=utf-8',
                },
                body: JSON.stringify({
                    action: 'update',
                    sheetName: sheetName,
                    rowIndex: rowIndex,
                    rowData: rowData
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error(`Error updating row in ${sheetName}:`, error);
            return { success: false, error: error.message };
        }
    },

    // Update a single cell
    async updateCell(sheetName, rowIndex, columnIndex, value) {
        try {
            const response = await fetch(API_URL, {
                method: 'POST',
                mode: 'cors',
                redirect: 'follow',
                headers: {
                    'Content-Type': 'text/plain;charset=utf-8',
                },
                body: JSON.stringify({
                    action: 'updateCell',
                    sheetName: sheetName,
                    rowIndex: rowIndex,
                    columnIndex: columnIndex,
                    value: value
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error(`Error updating cell in ${sheetName}:`, error);
            return { success: false, error: error.message };
        }
    },

    // Delete a single row by rowIndex
    async deleteRow(sheetName, rowIndex) {
        try {
            const response = await fetch(API_URL, {
                method: 'POST',
                mode: 'cors',
                redirect: 'follow',
                headers: {
                    'Content-Type': 'text/plain;charset=utf-8',
                },
                body: JSON.stringify({
                    action: 'delete',
                    sheetName: sheetName,
                    rowIndex: rowIndex
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error(`Error deleting row in ${sheetName}:`, error);
            return { success: false, error: error.message };
        }
    },

    // Helper to get only headers
    async getSheetHeaders(sheetName, options = {}) {
        try {
            const response = await fetch(API_URL, {
                method: 'POST',
                mode: 'cors',
                redirect: 'follow',
                headers: {
                    'Content-Type': 'text/plain;charset=utf-8',
                },
                body: JSON.stringify({
                    action: 'read',
                    sheetName: sheetName
                })
            });
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            const data = await response.json();
            if (data.success && data.data && data.data.length > 0) {
                const headerRow = options.headerRow || 1;
                const headers = data.data.length >= headerRow ? data.data[headerRow - 1] : data.data[0];
                return { success: true, headers: headers };
            }
            return { success: false, error: "No data found" };
        } catch (error) {
            return { success: false, error: error.message };
        }
    },

    // Upload a file to Google Drive folder
    async uploadFile(base64Data, fileName, mimeType, folderId) {
        try {
            console.log("api.js: uploadFile parameters:", {
                fileName,
                mimeType,
                folderId,
                base64DataLength: base64Data ? base64Data.length : 0
            });
            const response = await fetch(API_URL, {
                method: 'POST',
                mode: 'cors',
                redirect: 'follow',
                headers: {
                    'Content-Type': 'text/plain;charset=utf-8',
                },
                body: JSON.stringify({
                    action: 'uploadFile',
                    base64Data: base64Data,
                    fileName: fileName,
                    mimeType: mimeType,
                    folderId: folderId
                })
            });

            console.log("api.js: uploadFile HTTP response status:", response.status, response.statusText);

            if (!response.ok) {
                const errText = await response.text();
                console.error("api.js: uploadFile HTTP error text:", errText);
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const rawText = await response.clone().text();
            console.log("api.js: uploadFile raw response body:", rawText);

            const data = await response.json();
            console.log("api.js: uploadFile parsed JSON data:", data);
            return data;
        } catch (error) {
            console.error('api.js: Error uploading file:', error);
            return { success: false, error: error.message };
        }
    }
};