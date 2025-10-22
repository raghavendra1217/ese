const express = require('express');
const router = express.Router();
const { 
    getTransactionList, 
    getTransactionSummary, 
    getTransactionListFromDate,
    sendTransactionToExternalAPI,
    processTransactionAndSendToAPI,
    sendAllTransactionsToAPI,
    pushAllTransactionsToExternalAPI,
    pushTransactionsFromId
} = require('../controllers/integrationController');

// Basic transaction list with pagination
router.get('/list', getTransactionList);

// Transaction list from specific date onwards
router.get('/list-from-date', getTransactionListFromDate);

// Transaction summary information
router.get('/last', getTransactionSummary);

// Send specific transaction to external API
router.post('/send/:transaction_id', processTransactionAndSendToAPI);

// Send all transactions to external API (bulk processing)
router.post('/send-all', sendAllTransactionsToAPI);

// 🚀 Push all transactions to external API (GET endpoint for frontend)
router.get('/push-all', pushAllTransactionsToExternalAPI);

// 🎯 NEW: Push transactions from specific ID onwards
router.get('/push-from/:from_transaction_id', pushTransactionsFromId);

module.exports = router;
