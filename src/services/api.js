import axios from 'axios';

// Dynamically determine API endpoint: strictly use '/api' for all live domains (Vercel/mobile)
const getApiUrl = () => {
  if (typeof window !== 'undefined') {
    const host = window.location.hostname;
    if (host === 'localhost' || host === '127.0.0.1') {
      return 'http://localhost:5000/api';
    }
    return '/api';
  }
  return '/api';
};

const API_URL = getApiUrl();

export const fetchProductByBarcode = async (barcode) => {
  try {
    const response = await axios.get(`${API_URL}/products/${barcode}?_t=${Date.now()}`);
    return response.data;
  } catch (error) {
    if (error.response && error.response.status === 404) {
      throw new Error('Product not found');
    }
    throw new Error('Failed to fetch product');
  }
};

export const createPO = async (poData) => {
  try {
    const response = await axios.post(`${API_URL}/po`, poData);
    return response.data;
  } catch (error) {
    throw new Error('Failed to create PO');
  }
};

export const getPOs = async () => {
  try {
    const response = await axios.get(`${API_URL}/po`);
    return response.data;
  } catch (error) {
    throw new Error('Failed to fetch POs');
  }
};

export const deletePO = async (id) => {
  try {
    const response = await axios.delete(`${API_URL}/po/${id}`);
    return response.data;
  } catch (error) {
    throw new Error('Failed to delete PO');
  }
};

export const getNextPoNumber = async () => {
  try {
    const response = await axios.get(`${API_URL}/po/next-number`);
    return response.data.nextPoNo;
  } catch (error) {
    console.error('Failed to get next PO number', error);
    return 'PO-0001';
  }
};

export const getProducts = async () => {
  try {
    const response = await axios.get(`${API_URL}/products`);
    return response.data;
  } catch (error) {
    throw new Error('Failed to fetch products');
  }
};

export const createProduct = async (productData) => {
  try {
    const response = await axios.post(`${API_URL}/products`, productData);
    return response.data;
  } catch (error) {
    throw new Error('Failed to create product');
  }
};

export const updateProduct = async (oldBarcode, productData) => {
  try {
    const response = await axios.put(`${API_URL}/products/${oldBarcode}`, productData);
    return response.data;
  } catch (error) {
    throw new Error('Failed to update product');
  }
};

export const bulkImportProducts = async (products, companyName = '') => {
  try {
    const response = await axios.post(`${API_URL}/products/bulk`, { products, companyName });
    return response.data;
  } catch (error) {
    const msg = error.response?.data?.error || error.response?.data?.message || error.message || 'Failed to import products';
    throw new Error(msg);
  }
};
