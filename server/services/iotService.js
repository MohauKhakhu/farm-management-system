const mqtt = require('mqtt');
const db = require('../config/database');
const logger = require('../utils/logger');
const { v4: uuidv4 } = require('uuid');

let mqttClient = null;
let io = null;

const initializeIoTServices = async (socketIo) => {
  io = socketIo;
  
  try {
    // Initialize MQTT client if configured
    if (process.env.MQTT_BROKER_URL) {
      await initializeMQTTClient();
    }
    
    // Start sensor data processing
    startSensorDataProcessing();
    
    logger.info('IoT services initialized successfully');
  } catch (error) {
    logger.error('Failed to initialize IoT services:', error);
  }
};

const initializeMQTTClient = async () => {
  try {
    const options = {
      username: process.env.MQTT_USERNAME,
      password: process.env.MQTT_PASSWORD,
      reconnectPeriod: 5000,
      connectTimeout: 30000,
    };

    mqttClient = mqtt.connect(process.env.MQTT_BROKER_URL, options);

    mqttClient.on('connect', () => {
      logger.info('Connected to MQTT broker');
      
      // Subscribe to sensor topics
      mqttClient.subscribe('farm/+/sensors/+/data', (err) => {
        if (err) {
          logger.error('Failed to subscribe to sensor topics:', err);
        } else {
          logger.info('Subscribed to sensor data topics');
        }
      });
    });

    mqttClient.on('message', handleMQTTMessage);

    mqttClient.on('error', (error) => {
      logger.error('MQTT client error:', error);
    });

    mqttClient.on('close', () => {
      logger.warn('MQTT client disconnected');
    });

  } catch (error) {
    logger.error('Failed to initialize MQTT client:', error);
  }
};

const handleMQTTMessage = async (topic, message) => {
  try {
    const topicParts = topic.split('/');
    if (topicParts.length !== 5 || topicParts[0] !== 'farm' || topicParts[2] !== 'sensors' || topicParts[4] !== 'data') {
      return;
    }

    const farmId = topicParts[1];
    const sensorId = topicParts[3];
    const data = JSON.parse(message.toString());

    // Process sensor data
    await processSensorReading(farmId, sensorId, data);

  } catch (error) {
    logger.error('Error processing MQTT message:', error);
  }
};

const processSensorReading = async (farmId, deviceId, data) => {
  try {
    // Find sensor in database
    const sensor = await db('sensors')
      .where({ device_id: deviceId, farm_id: farmId })
      .first();

    if (!sensor) {
      logger.warn(`Unknown sensor: ${deviceId} for farm: ${farmId}`);
      return;
    }

    // Store sensor reading
    const readingId = uuidv4();
    await db('sensor_readings').insert({
      id: readingId,
      sensor_id: sensor.id,
      reading_timestamp: new Date(data.timestamp || Date.now()),
      value: data.value,
      unit: data.unit || sensor.unit_of_measure,
      raw_data: JSON.stringify(data),
      is_valid: validateSensorReading(sensor, data.value)
    });

    // Check for alerts
    await checkSensorAlerts(sensor, data.value, readingId);

    // Update sensor last communication
    await db('sensors')
      .where('id', sensor.id)
      .update({
        last_communication: new Date(),
        battery_level: data.battery_level || sensor.battery_level
      });

    // Emit real-time data to connected clients
    if (io) {
      io.to(`farm_${farmId}`).emit('sensor_data', {
        sensorId: sensor.id,
        deviceId,
        location: sensor.location,
        value: data.value,
        unit: data.unit,
        timestamp: data.timestamp || Date.now()
      });
    }

    logger.debug(`Processed sensor reading: ${deviceId} = ${data.value}`);

  } catch (error) {
    logger.error('Error processing sensor reading:', error);
  }
};

const validateSensorReading = (sensor, value) => {
  // Basic validation against sensor min/max values
  if (sensor.sensor_type_id) {
    // Could fetch sensor type limits and validate
    return value >= (sensor.alert_min_threshold || -Infinity) && 
           value <= (sensor.alert_max_threshold || Infinity);
  }
  return true;
};

const checkSensorAlerts = async (sensor, value, readingId) => {
  try {
    let alertType = null;
    let severity = 'info';

    // Check threshold alerts
    if (sensor.alert_max_threshold && value > sensor.alert_max_threshold) {
      alertType = 'threshold_exceeded';
      severity = 'warning';
    } else if (sensor.alert_min_threshold && value < sensor.alert_min_threshold) {
      alertType = 'threshold_below';
      severity = 'warning';
    }

    // Check for anomalies (simple implementation)
    const recentReadings = await db('sensor_readings')
      .where('sensor_id', sensor.id)
      .where('reading_timestamp', '>=', new Date(Date.now() - 24 * 60 * 60 * 1000))
      .orderBy('reading_timestamp', 'desc')
      .limit(10);

    if (recentReadings.length >= 5) {
      const avg = recentReadings.reduce((sum, r) => sum + parseFloat(r.value), 0) / recentReadings.length;
      const stdDev = Math.sqrt(
        recentReadings.reduce((sum, r) => sum + Math.pow(parseFloat(r.value) - avg, 2), 0) / recentReadings.length
      );
      
      if (Math.abs(value - avg) > 3 * stdDev) {
        alertType = 'anomaly_detected';
        severity = 'critical';
      }
    }

    // Create alert if needed
    if (alertType) {
      const alertId = uuidv4();
      await db('sensor_alerts').insert({
        id: alertId,
        sensor_id: sensor.id,
        reading_id: readingId,
        alert_type: alertType,
        severity,
        alert_timestamp: new Date(),
        message: generateAlertMessage(sensor, alertType, value),
        trigger_value: value
      });

      // Emit alert to connected clients
      if (io) {
        io.to(`farm_${sensor.farm_id}`).emit('sensor_alert', {
          id: alertId,
          sensorId: sensor.id,
          location: sensor.location,
          alertType,
          severity,
          message: generateAlertMessage(sensor, alertType, value),
          value,
          timestamp: new Date()
        });
      }

      logger.warn(`Sensor alert: ${sensor.name} - ${alertType} - ${value}`);
    }

  } catch (error) {
    logger.error('Error checking sensor alerts:', error);
  }
};

const generateAlertMessage = (sensor, alertType, value) => {
  switch (alertType) {
    case 'threshold_exceeded':
      return `${sensor.name} at ${sensor.location} exceeded maximum threshold: ${value}`;
    case 'threshold_below':
      return `${sensor.name} at ${sensor.location} below minimum threshold: ${value}`;
    case 'anomaly_detected':
      return `Anomaly detected in ${sensor.name} at ${sensor.location}: ${value}`;
    case 'sensor_offline':
      return `${sensor.name} at ${sensor.location} is offline`;
    case 'battery_low':
      return `${sensor.name} at ${sensor.location} has low battery`;
    default:
      return `Alert from ${sensor.name} at ${sensor.location}`;
  }
};

const startSensorDataProcessing = () => {
  // Check for offline sensors every 5 minutes
  setInterval(async () => {
    try {
      const offlineThreshold = new Date(Date.now() - 30 * 60 * 1000); // 30 minutes
      
      const offlineSensors = await db('sensors')
        .where('status', 'active')
        .where('last_communication', '<', offlineThreshold);

      for (const sensor of offlineSensors) {
        // Create offline alert if not already exists
        const existingAlert = await db('sensor_alerts')
          .where({
            sensor_id: sensor.id,
            alert_type: 'sensor_offline',
            resolved: false
          })
          .first();

        if (!existingAlert) {
          const alertId = uuidv4();
          await db('sensor_alerts').insert({
            id: alertId,
            sensor_id: sensor.id,
            alert_type: 'sensor_offline',
            severity: 'critical',
            alert_timestamp: new Date(),
            message: generateAlertMessage(sensor, 'sensor_offline', null)
          });

          // Emit alert
          if (io) {
            io.to(`farm_${sensor.farm_id}`).emit('sensor_alert', {
              id: alertId,
              sensorId: sensor.id,
              location: sensor.location,
              alertType: 'sensor_offline',
              severity: 'critical',
              message: generateAlertMessage(sensor, 'sensor_offline', null),
              timestamp: new Date()
            });
          }
        }

        // Update sensor status
        await db('sensors')
          .where('id', sensor.id)
          .update({ status: 'inactive' });
      }

    } catch (error) {
      logger.error('Error checking offline sensors:', error);
    }
  }, 5 * 60 * 1000);

  logger.info('Sensor data processing started');
};

// Simulate sensor data for demo purposes
const simulateSensorData = async () => {
  try {
    const sensors = await db('sensors')
      .where('status', 'active')
      .limit(10);

    for (const sensor of sensors) {
      const sensorType = await db('sensor_types')
        .where('id', sensor.sensor_type_id)
        .first();

      if (sensorType) {
        let value;
        switch (sensorType.measurement_type) {
          case 'temperature':
            value = 20 + Math.random() * 15; // 20-35°C
            break;
          case 'humidity':
            value = 40 + Math.random() * 40; // 40-80%
            break;
          case 'weight':
            value = 500 + Math.random() * 200; // 500-700kg
            break;
          default:
            value = Math.random() * 100;
        }

        await processSensorReading(sensor.farm_id, sensor.device_id, {
          value: parseFloat(value.toFixed(2)),
          unit: sensorType.unit_of_measure,
          timestamp: new Date().toISOString(),
          battery_level: 80 + Math.random() * 20
        });
      }
    }
  } catch (error) {
    logger.error('Error simulating sensor data:', error);
  }
};

// Start simulation in development mode
if (process.env.NODE_ENV === 'development') {
  setInterval(simulateSensorData, 30000); // Every 30 seconds
}

module.exports = {
  initializeIoTServices,
  processSensorReading,
  simulateSensorData
};