import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || (window.location.hostname === 'localhost' ? 'http://localhost:5000/api' : '/api');

export const fetchProductByBarcode = async (barcode) => {
  try {
    const response = await axios.get(`${API_URL}/products/${barcode}`);
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
    throw new Error(error.response?.data?.message || 'Failed to import products');
  }
};
