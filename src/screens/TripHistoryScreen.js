import React, {useState, useEffect, useCallback} from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
} from 'react-native';
import {useFocusEffect} from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialIcons';

import {databaseService} from '../services/DatabaseService';

const TripHistoryScreen = () => {
  const [tripSessions, setTripSessions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  useFocusEffect(
    useCallback(() => {
      loadTripHistory();
    }, []),
  );

  const loadTripHistory = async () => {
    try {
      setIsLoading(true);
      const sessions = await databaseService.getAllTripSessions();
      setTripSessions(sessions);
    } catch (error) {
      console.error('Failed to load trip history:', error);
      Alert.alert('Error', 'Failed to load trip history.');
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (timestamp) => {
    return new Date(timestamp).toLocaleDateString();
  };

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString();
  };

  const formatDuration = (startTime, endTime) => {
    if (!endTime) return 'Ongoing';
    
    const duration = endTime - startTime;
    const hours = Math.floor(duration / (1000 * 60 * 60));
    const minutes = Math.floor((duration % (1000 * 60 * 60)) / (1000 * 60));
    
    return `${hours}h ${minutes}m`;
  };

  const renderTripSession = ({item}) => (
    <View style={styles.tripCard}>
      <View style={styles.tripHeader}>
        <Icon 
          name={item.isActive ? "play-circle-filled" : "stop-circle"} 
          size={24} 
          color={item.isActive ? "#4caf50" : "#f44336"} 
        />
        <View style={styles.tripInfo}>
          <Text style={styles.tripDate}>{formatDate(item.startTime)}</Text>
          <Text style={styles.tripTime}>
            {formatTime(item.startTime)} - {item.endTime ? formatTime(item.endTime) : 'Ongoing'}
          </Text>
        </View>
        <View style={styles.tripStatus}>
          <Text style={[
            styles.statusText,
            {color: item.isActive ? "#4caf50" : "#f44336"}
          ]}>
            {item.isActive ? 'Active' : 'Completed'}
          </Text>
        </View>
      </View>
      
      <View style={styles.tripDetails}>
        <View style={styles.detailRow}>
          <Icon name="schedule" size={16} color="#666" />
          <Text style={styles.detailLabel}>Duration:</Text>
          <Text style={styles.detailValue}>{formatDuration(item.startTime, item.endTime)}</Text>
        </View>
        
        <View style={styles.detailRow}>
          <Icon name="straighten" size={16} color="#666" />
          <Text style={styles.detailLabel}>Distance:</Text>
          <Text style={styles.detailValue}>{item.totalDistance.toFixed(2)} km</Text>
        </View>
        
        <View style={styles.detailRow}>
          <Icon name="warning" size={16} color="#f44336" />
          <Text style={styles.detailLabel}>Emergencies:</Text>
          <Text style={styles.detailValue}>{item.emergencyCount}</Text>
        </View>
      </View>
    </View>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Icon name="history" size={64} color="#ccc" />
      <Text style={styles.emptyStateTitle}>No Trip History</Text>
      <Text style={styles.emptyStateText}>
        Your trip history will appear here once you start monitoring trips.
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Trip History</Text>
      </View>

      <FlatList
        data={tripSessions}
        renderItem={renderTripSession}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={renderEmptyState}
        refreshing={isLoading}
        onRefresh={loadTripHistory}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: 'white',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  listContainer: {
    padding: 20,
    flexGrow: 1,
  },
  tripCard: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 12,
    marginBottom: 15,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  tripHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  tripInfo: {
    flex: 1,
    marginLeft: 10,
  },
  tripDate: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  tripTime: {
    fontSize: 14,
    color: '#666',
  },
  tripStatus: {
    alignItems: 'flex-end',
  },
  statusText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  tripDetails: {
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingTop: 15,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  detailLabel: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
    flex: 1,
  },
  detailValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 50,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#666',
    marginTop: 15,
    marginBottom: 10,
  },
  emptyStateText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    paddingHorizontal: 40,
  },
});

export default TripHistoryScreen;
