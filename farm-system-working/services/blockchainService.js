const Web3 = require('web3');
const db = require('../config/database');
const logger = require('../utils/logger');
const { v4: uuidv4 } = require('uuid');
const crypto = require('crypto');

let web3 = null;
let traceabilityContract = null;

const initializeBlockchainService = async () => {
  try {
    if (process.env.BLOCKCHAIN_NETWORK) {
      web3 = new Web3(process.env.BLOCKCHAIN_NETWORK);
      
      // Load smart contract if available
      const network = await db('blockchain_networks')
        .where('is_active', true)
        .first();
      
      if (network && network.contract_address && network.contract_abi) {
        traceabilityContract = new web3.eth.Contract(
          network.contract_abi,
          network.contract_address
        );
        logger.info('Blockchain service initialized with smart contract');
      } else {
        logger.info('Blockchain service initialized without smart contract');
      }
    } else {
      logger.info('Blockchain service initialized in mock mode');
    }
  } catch (error) {
    logger.error('Failed to initialize blockchain service:', error);
  }
};

const createTraceabilityEvent = async (eventData) => {
  try {
    const {
      farmId,
      eventType,
      entityType,
      entityId,
      eventTimestamp,
      location,
      data,
      userId
    } = eventData;

    // Get previous event hash for chaining
    const previousEvent = await db('traceability_events')
      .where({ entity_type: entityType, entity_id: entityId })
      .orderBy('event_timestamp', 'desc')
      .first();

    // Create event hash
    const eventString = JSON.stringify({
      eventType,
      entityType,
      entityId,
      eventTimestamp,
      location,
      data,
      previousHash: previousEvent?.event_hash || '0'
    });
    
    const eventHash = crypto.createHash('sha256').update(eventString).digest('hex');

    // Store event in database
    const eventId = uuidv4();
    const traceabilityEvent = {
      id: eventId,
      farm_id: farmId,
      event_type: eventType,
      entity_type: entityType,
      entity_id: entityId,
      event_timestamp: eventTimestamp,
      location,
      event_data: JSON.stringify(data),
      previous_event_hash: previousEvent?.event_hash || '0',
      event_hash: eventHash,
      recorded_by: userId,
      blockchain_synced: false
    };

    await db('traceability_events').insert(traceabilityEvent);

    // Attempt to sync to blockchain
    if (web3 && traceabilityContract) {
      try {
        await syncToBlockchain(eventId, traceabilityEvent);
      } catch (blockchainError) {
        logger.error('Failed to sync to blockchain:', blockchainError);
        // Continue without blockchain sync
      }
    }

    logger.info(`Traceability event created: ${eventType} for ${entityType}:${entityId}`);
    
    return {
      success: true,
      eventId,
      eventHash
    };

  } catch (error) {
    logger.error('Error creating traceability event:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

const syncToBlockchain = async (eventId, eventData) => {
  try {
    if (!web3 || !traceabilityContract) {
      throw new Error('Blockchain not initialized');
    }

    // Get account for transactions
    const accounts = await web3.eth.getAccounts();
    if (accounts.length === 0) {
      throw new Error('No blockchain accounts available');
    }

    const account = accounts[0];

    // Prepare transaction data
    const txData = traceabilityContract.methods.recordEvent(
      eventData.entity_id,
      eventData.event_type,
      eventData.event_hash,
      eventData.previous_event_hash,
      JSON.stringify(eventData.event_data)
    );

    // Estimate gas
    const gasEstimate = await txData.estimateGas({ from: account });

    // Send transaction
    const tx = await txData.send({
      from: account,
      gas: gasEstimate,
      gasPrice: await web3.eth.getGasPrice()
    });

    // Update database with blockchain info
    await db('traceability_events')
      .where('id', eventId)
      .update({
        blockchain_synced: true,
        blockchain_tx_hash: tx.transactionHash,
        blockchain_timestamp: new Date()
      });

    // Store blockchain transaction record
    await db('blockchain_transactions').insert({
      id: uuidv4(),
      network_id: (await db('blockchain_networks').where('is_active', true).first()).id,
      transaction_hash: tx.transactionHash,
      block_number: tx.blockNumber.toString(),
      from_address: account,
      to_address: traceabilityContract.options.address,
      transaction_data: JSON.stringify(tx),
      timestamp: new Date(),
      gas_used: tx.gasUsed.toString(),
      status: 'confirmed',
      related_entity_type: 'traceability_event',
      related_entity_id: eventId
    });

    logger.info(`Event synced to blockchain: ${tx.transactionHash}`);

  } catch (error) {
    logger.error('Error syncing to blockchain:', error);
    throw error;
  }
};

const getTraceabilityChain = async (entityType, entityId) => {
  try {
    const events = await db('traceability_events')
      .leftJoin('users', 'traceability_events.recorded_by', 'users.id')
      .select(
        'traceability_events.*',
        'users.first_name',
        'users.last_name'
      )
      .where({
        entity_type: entityType,
        entity_id: entityId
      })
      .orderBy('event_timestamp', 'asc');

    // Verify chain integrity
    let isValid = true;
    for (let i = 1; i < events.length; i++) {
      if (events[i].previous_event_hash !== events[i - 1].event_hash) {
        isValid = false;
        break;
      }
    }

    return {
      success: true,
      events: events.map(event => ({
        ...event,
        event_data: JSON.parse(event.event_data || '{}')
      })),
      isValid,
      totalEvents: events.length
    };

  } catch (error) {
    logger.error('Error getting traceability chain:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

const createProductBatch = async (batchData) => {
  try {
    const {
      farmId,
      batchNumber,
      productType,
      productName,
      productionDate,
      expiryDate,
      quantity,
      unit,
      sourceAnimals,
      processingSteps,
      qualityParameters,
      packagingType,
      storageConditions,
      userId
    } = batchData;

    const batchId = uuidv4();
    
    // Create product batch record
    await db('product_batches').insert({
      id: batchId,
      farm_id: farmId,
      batch_number: batchNumber,
      product_type: productType,
      product_name: productName,
      production_date: productionDate,
      expiry_date: expiryDate,
      quantity,
      unit,
      source_animals: JSON.stringify(sourceAnimals || []),
      processing_steps: JSON.stringify(processingSteps || []),
      quality_parameters: JSON.stringify(qualityParameters || {}),
      packaging_type: packagingType,
      storage_conditions: JSON.stringify(storageConditions || {}),
      status: 'production'
    });

    // Create traceability event for batch creation
    await createTraceabilityEvent({
      farmId,
      eventType: 'batch_created',
      entityType: 'batch',
      entityId: batchId,
      eventTimestamp: new Date(),
      location: 'Production Facility',
      data: {
        batchNumber,
        productType,
        productName,
        quantity,
        unit,
        sourceAnimals,
        processingSteps
      },
      userId
    });

    logger.info(`Product batch created: ${batchNumber}`);

    return {
      success: true,
      batchId,
      batchNumber
    };

  } catch (error) {
    logger.error('Error creating product batch:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

const transferBatch = async (transferData) => {
  try {
    const {
      batchId,
      fromParticipantId,
      toParticipantId,
      transferTimestamp,
      quantityTransferred,
      transportMethod,
      transportConditions,
      transferDocumentNumber,
      qualityChecks,
      userId
    } = transferData;

    const transferId = uuidv4();
    
    // Create transfer hash
    const transferString = JSON.stringify({
      batchId,
      fromParticipantId,
      toParticipantId,
      transferTimestamp,
      quantityTransferred,
      transferDocumentNumber
    });
    
    const transferHash = crypto.createHash('sha256').update(transferString).digest('hex');

    // Store transfer record
    await db('supply_chain_transfers').insert({
      id: transferId,
      batch_id: batchId,
      from_participant_id: fromParticipantId,
      to_participant_id: toParticipantId,
      transfer_timestamp: transferTimestamp,
      quantity_transferred: quantityTransferred,
      transport_method: transportMethod,
      transport_conditions: JSON.stringify(transportConditions || {}),
      transfer_document_number: transferDocumentNumber,
      quality_checks: JSON.stringify(qualityChecks || {}),
      transfer_hash: transferHash,
      blockchain_synced: false
    });

    // Create traceability event
    await createTraceabilityEvent({
      farmId: (await db('product_batches').where('id', batchId).first()).farm_id,
      eventType: 'batch_transferred',
      entityType: 'batch',
      entityId: batchId,
      eventTimestamp: transferTimestamp,
      location: 'In Transit',
      data: {
        fromParticipant: fromParticipantId,
        toParticipant: toParticipantId,
        quantityTransferred,
        transportMethod,
        transferDocumentNumber
      },
      userId
    });

    logger.info(`Batch transfer recorded: ${batchId} -> ${toParticipantId}`);

    return {
      success: true,
      transferId,
      transferHash
    };

  } catch (error) {
    logger.error('Error recording batch transfer:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

const generateQRCode = async (entityType, entityId, embeddedData = {}) => {
  try {
    const QRCode = require('qrcode');
    
    const qrCodeId = uuidv4();
    const qrCodeData = {
      id: qrCodeId,
      entityType,
      entityId,
      timestamp: new Date().toISOString(),
      ...embeddedData
    };

    // Generate QR code string
    const qrString = JSON.stringify(qrCodeData);
    const qrCode = await QRCode.toDataURL(qrString);

    // Store QR code record
    await db('qr_codes').insert({
      id: qrCodeId,
      qr_code: qrCode,
      entity_type: entityType,
      entity_id: entityId,
      embedded_data: JSON.stringify(embeddedData),
      generation_date: new Date(),
      is_active: true,
      scan_count: 0
    });

    logger.info(`QR code generated for ${entityType}:${entityId}`);

    return {
      success: true,
      qrCodeId,
      qrCode,
      qrString
    };

  } catch (error) {
    logger.error('Error generating QR code:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

const scanQRCode = async (qrCodeId, scannerInfo = {}) => {
  try {
    // Update scan count and record scan
    await db('qr_codes')
      .where('id', qrCodeId)
      .increment('scan_count', 1)
      .update('last_scanned', new Date());

    await db('qr_code_scans').insert({
      id: uuidv4(),
      qr_code_id: qrCodeId,
      scan_timestamp: new Date(),
      scanner_ip: scannerInfo.ip,
      scanner_location: scannerInfo.location,
      scanner_device_info: JSON.stringify(scannerInfo.deviceInfo || {}),
      scanned_by: scannerInfo.userId,
      scan_purpose: scannerInfo.purpose || 'verification'
    });

    // Get QR code data
    const qrCode = await db('qr_codes')
      .where('id', qrCodeId)
      .first();

    if (!qrCode) {
      return {
        success: false,
        error: 'QR code not found'
      };
    }

    // Get traceability data
    const traceabilityChain = await getTraceabilityChain(
      qrCode.entity_type,
      qrCode.entity_id
    );

    return {
      success: true,
      qrCode: {
        ...qrCode,
        embedded_data: JSON.parse(qrCode.embedded_data || '{}')
      },
      traceabilityChain
    };

  } catch (error) {
    logger.error('Error scanning QR code:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

module.exports = {
  initializeBlockchainService,
  createTraceabilityEvent,
  getTraceabilityChain,
  createProductBatch,
  transferBatch,
  generateQRCode,
  scanQRCode
};