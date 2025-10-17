import mqtt from 'mqtt';
import prisma from '@farm/db';

const MQTT_URL = process.env.MQTT_URL || 'mqtt://localhost:1883';

const client = mqtt.connect(MQTT_URL);

client.on('connect', () => {
  console.log('IoT service connected to MQTT');
  client.subscribe('farm/+/sensors/#');
});

client.on('message', async (topic, payload) => {
  try {
    const text = payload.toString('utf8');
    const data = JSON.parse(text) as { metric: string; value: number; unit?: string; deviceId?: string; relatedAnimalId?: string; recordedAt?: string };
    const deviceId = data.deviceId ?? (await upsertDevice(topic));
    await prisma.sensorReading.create({ data: { deviceId, metric: data.metric, value: Number(data.value), unit: data.unit, relatedAnimalId: data.relatedAnimalId ?? null, recordedAt: data.recordedAt ? new Date(data.recordedAt) : undefined } });
    await maybeRaiseAlert(data.metric, data.value, data.relatedAnimalId);
  } catch (e) {
    console.error('Failed to process message', e);
  }
});

async function upsertDevice(topic: string): Promise<string> {
  const name = topic.split('/').slice(0, 3).join('-');
  const dev = await prisma.sensorDevice.upsert({ where: { topic }, update: {}, create: { topic, name } });
  return dev.id;
}

async function maybeRaiseAlert(metric: string, value: number, relatedAnimalId?: string) {
  // simple threshold-based alerts; replace with AI later
  if (metric === 'temperature' && (value < 0 || value > 40)) {
    await prisma.alert.create({ data: { type: 'ENVIRONMENT', severity: 'WARN', message: `Temperature out of range: ${value}`, relatedAnimalId: relatedAnimalId ?? null } });
  }
}
