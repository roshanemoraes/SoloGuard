import SQLite from 'react-native-sqlite-storage';

// Enable promise-based API
SQLite.enablePromise(true);

const DATABASE_NAME = 'SafeGuard.db';
const DATABASE_VERSION = '1.0';
const DATABASE_DISPLAYNAME = 'SafeGuard Database';
const DATABASE_SIZE = 200000;

class DatabaseService {
  constructor() {
    this.db = null;
  }

  async initializeDatabase() {
    try {
      this.db = await SQLite.openDatabase({
        name: DATABASE_NAME,
        version: DATABASE_VERSION,
        displayName: DATABASE_DISPLAYNAME,
        size: DATABASE_SIZE,
      });

      await this.createTables();
      console.log('Database initialized successfully');
    } catch (error) {
      console.error('Database initialization failed:', error);
      throw error;
    }
  }

  async createTables() {
    const createTablesQueries = [
      // Location Updates Table
      `CREATE TABLE IF NOT EXISTS location_updates (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        latitude REAL NOT NULL,
        longitude REAL NOT NULL,
        accuracy REAL,
        timestamp INTEGER NOT NULL,
        battery_level INTEGER,
        is_emergency INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`,

      // Emergency Contacts Table
      `CREATE TABLE IF NOT EXISTS emergency_contacts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        phone_number TEXT NOT NULL,
        is_primary INTEGER DEFAULT 0,
        is_active INTEGER DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`,

      // Planned Destinations Table
      `CREATE TABLE IF NOT EXISTS planned_destinations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        latitude REAL NOT NULL,
        longitude REAL NOT NULL,
        address TEXT,
        type TEXT NOT NULL,
        is_visited INTEGER DEFAULT 0,
        visit_date INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`,

      // Trip Sessions Table
      `CREATE TABLE IF NOT EXISTS trip_sessions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        start_time INTEGER NOT NULL,
        end_time INTEGER,
        is_active INTEGER DEFAULT 1,
        total_distance REAL DEFAULT 0.0,
        emergency_count INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`,

      // Activity Logs Table
      `CREATE TABLE IF NOT EXISTS activity_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        timestamp INTEGER NOT NULL,
        activity_type TEXT NOT NULL,
        description TEXT,
        location_lat REAL,
        location_lng REAL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`,

      // Sensor Data Table
      `CREATE TABLE IF NOT EXISTS sensor_data (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        timestamp INTEGER NOT NULL,
        accelerometer_x REAL,
        accelerometer_y REAL,
        accelerometer_z REAL,
        gyroscope_x REAL,
        gyroscope_y REAL,
        gyroscope_z REAL,
        magnetometer_x REAL,
        magnetometer_y REAL,
        magnetometer_z REAL,
        barometer_pressure REAL,
        light_sensor_lux REAL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`,
    ];

    for (const query of createTablesQueries) {
      await this.db.executeSql(query);
    }

    // Create indexes for better performance
    const createIndexesQueries = [
      'CREATE INDEX IF NOT EXISTS idx_location_timestamp ON location_updates(timestamp)',
      'CREATE INDEX IF NOT EXISTS idx_location_emergency ON location_updates(is_emergency)',
      'CREATE INDEX IF NOT EXISTS idx_contacts_active ON emergency_contacts(is_active)',
      'CREATE INDEX IF NOT EXISTS idx_destinations_type ON planned_destinations(type)',
      'CREATE INDEX IF NOT EXISTS idx_trip_active ON trip_sessions(is_active)',
      'CREATE INDEX IF NOT EXISTS idx_activity_type ON activity_logs(activity_type)',
      'CREATE INDEX IF NOT EXISTS idx_sensor_timestamp ON sensor_data(timestamp)',
    ];

    for (const query of createIndexesQueries) {
      await this.db.executeSql(query);
    }
  }

  // Location Updates Methods
  async insertLocationUpdate(locationData) {
    const {latitude, longitude, accuracy, batteryLevel, isEmergency = false} = locationData;
    const timestamp = Date.now();

    const query = `
      INSERT INTO location_updates 
      (latitude, longitude, accuracy, timestamp, battery_level, is_emergency)
      VALUES (?, ?, ?, ?, ?, ?)
    `;

    await this.db.executeSql(query, [
      latitude,
      longitude,
      accuracy,
      timestamp,
      batteryLevel,
      isEmergency ? 1 : 0,
    ]);

    return timestamp;
  }

  async getRecentLocationUpdates(limit = 10) {
    const query = `
      SELECT * FROM location_updates 
      ORDER BY timestamp DESC 
      LIMIT ?
    `;

    const [results] = await this.db.executeSql(query, [limit]);
    const rows = results.rows.raw();

    return rows.map(row => ({
      id: row.id,
      latitude: row.latitude,
      longitude: row.longitude,
      accuracy: row.accuracy,
      timestamp: row.timestamp,
      batteryLevel: row.battery_level,
      isEmergency: row.is_emergency === 1,
    }));
  }

  async getEmergencyLocationUpdates() {
    const query = `
      SELECT * FROM location_updates 
      WHERE is_emergency = 1 
      ORDER BY timestamp DESC
    `;

    const [results] = await this.db.executeSql(query);
    const rows = results.rows.raw();

    return rows.map(row => ({
      id: row.id,
      latitude: row.latitude,
      longitude: row.longitude,
      accuracy: row.accuracy,
      timestamp: row.timestamp,
      batteryLevel: row.battery_level,
      isEmergency: true,
    }));
  }

  // Emergency Contacts Methods
  async insertEmergencyContact(contactData) {
    const {name, phoneNumber, isPrimary = false} = contactData;

    const query = `
      INSERT INTO emergency_contacts (name, phone_number, is_primary)
      VALUES (?, ?, ?)
    `;

    await this.db.executeSql(query, [name, phoneNumber, isPrimary ? 1 : 0]);
  }

  async getActiveEmergencyContacts() {
    const query = `
      SELECT * FROM emergency_contacts 
      WHERE is_active = 1 
      ORDER BY is_primary DESC, name ASC
    `;

    const [results] = await this.db.executeSql(query);
    const rows = results.rows.raw();

    return rows.map(row => ({
      id: row.id,
      name: row.name,
      phoneNumber: row.phone_number,
      isPrimary: row.is_primary === 1,
      isActive: row.is_active === 1,
    }));
  }

  async getPrimaryEmergencyContact() {
    const query = `
      SELECT * FROM emergency_contacts 
      WHERE is_primary = 1 AND is_active = 1 
      LIMIT 1
    `;

    const [results] = await this.db.executeSql(query);
    if (results.rows.length > 0) {
      const row = results.rows.item(0);
      return {
        id: row.id,
        name: row.name,
        phoneNumber: row.phone_number,
        isPrimary: true,
        isActive: true,
      };
    }
    return null;
  }

  // Trip Sessions Methods
  async startTripSession() {
    const startTime = Date.now();

    const query = `
      INSERT INTO trip_sessions (start_time, is_active)
      VALUES (?, 1)
    `;

    await this.db.executeSql(query, [startTime]);

    // Log activity
    await this.logActivity('TRIP_STARTED', 'Trip monitoring started');

    return startTime;
  }

  async stopTripSession() {
    const endTime = Date.now();

    const query = `
      UPDATE trip_sessions 
      SET end_time = ?, is_active = 0 
      WHERE is_active = 1
    `;

    await this.db.executeSql(query, [endTime]);

    // Log activity
    await this.logActivity('TRIP_STOPPED', 'Trip monitoring stopped');
  }

  async getActiveTripSession() {
    const query = `
      SELECT * FROM trip_sessions 
      WHERE is_active = 1 
      LIMIT 1
    `;

    const [results] = await this.db.executeSql(query);
    if (results.rows.length > 0) {
      const row = results.rows.item(0);
      return {
        id: row.id,
        startTime: row.start_time,
        endTime: row.end_time,
        isActive: row.is_active === 1,
        totalDistance: row.total_distance,
        emergencyCount: row.emergency_count,
      };
    }
    return null;
  }

  // Activity Logging Methods
  async logActivity(activityType, description, location = null) {
    const timestamp = Date.now();

    const query = `
      INSERT INTO activity_logs 
      (timestamp, activity_type, description, location_lat, location_lng)
      VALUES (?, ?, ?, ?, ?)
    `;

    await this.db.executeSql(query, [
      timestamp,
      activityType,
      description,
      location?.latitude || null,
      location?.longitude || null,
    ]);
  }

  async getRecentActivityLogs(limit = 20) {
    const query = `
      SELECT * FROM activity_logs 
      ORDER BY timestamp DESC 
      LIMIT ?
    `;

    const [results] = await this.db.executeSql(query, [limit]);
    const rows = results.rows.raw();

    return rows.map(row => ({
      id: row.id,
      timestamp: row.timestamp,
      activityType: row.activity_type,
      description: row.description,
      locationLat: row.location_lat,
      locationLng: row.location_lng,
    }));
  }

  // Sensor Data Methods
  async insertSensorData(sensorData) {
    const {
      accelerometer,
      gyroscope,
      magnetometer,
      barometer,
      lightSensor,
    } = sensorData;

    const timestamp = Date.now();

    const query = `
      INSERT INTO sensor_data 
      (timestamp, accelerometer_x, accelerometer_y, accelerometer_z,
       gyroscope_x, gyroscope_y, gyroscope_z,
       magnetometer_x, magnetometer_y, magnetometer_z,
       barometer_pressure, light_sensor_lux)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    await this.db.executeSql(query, [
      timestamp,
      accelerometer?.x || null,
      accelerometer?.y || null,
      accelerometer?.z || null,
      gyroscope?.x || null,
      gyroscope?.y || null,
      gyroscope?.z || null,
      magnetometer?.x || null,
      magnetometer?.y || null,
      magnetometer?.z || null,
      barometer?.pressure || null,
      lightSensor?.lux || null,
    ]);
  }

  // Cleanup Methods
  async cleanupOldData(daysToKeep = 7) {
    const cutoffTime = Date.now() - daysToKeep * 24 * 60 * 60 * 1000;

    const cleanupQueries = [
      'DELETE FROM location_updates WHERE timestamp < ?',
      'DELETE FROM activity_logs WHERE timestamp < ?',
      'DELETE FROM sensor_data WHERE timestamp < ?',
    ];

    for (const query of cleanupQueries) {
      await this.db.executeSql(query, [cutoffTime]);
    }
  }

  async closeDatabase() {
    if (this.db) {
      await this.db.close();
      this.db = null;
    }
  }
}

// Export singleton instance
export const databaseService = new DatabaseService();
export const initializeDatabase = () => databaseService.initializeDatabase();
export default databaseService;
