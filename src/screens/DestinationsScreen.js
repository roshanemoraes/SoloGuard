import React, {useState, useEffect, useCallback} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Alert,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import {useFocusEffect} from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import LinearGradient from 'react-native-linear-gradient';
import RNPickerSelect from 'react-native-picker-select';

import {databaseService} from '../services/DatabaseService';
import {locationService} from '../services/LocationService';

const DESTINATION_TYPES = [
  {label: 'Hospital', value: 'HOSPITAL'},
  {label: 'Police Station', value: 'POLICE_STATION'},
  {label: 'Restaurant', value: 'RESTAURANT'},
  {label: 'Hotel', value: 'HOTEL'},
  {label: 'Tourist Attraction', value: 'ATTRACTION'},
  {label: 'Custom', value: 'CUSTOM'},
];

const DestinationsScreen = () => {
  const [destinations, setDestinations] = useState([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingDestination, setEditingDestination] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    latitude: '',
    longitude: '',
    address: '',
    type: 'HOSPITAL',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [selectedType, setSelectedType] = useState('ALL');

  useFocusEffect(
    useCallback(() => {
      loadDestinations();
    }, []),
  );

  const loadDestinations = async () => {
    try {
      setIsLoading(true);
      const destinationsData = await databaseService.getAllPlannedDestinations();
      setDestinations(destinationsData);
    } catch (error) {
      console.error('Failed to load destinations:', error);
      Alert.alert('Error', 'Failed to load planned destinations.');
    } finally {
      setIsLoading(false);
    }
  };

  const openAddDestinationModal = () => {
    setFormData({
      name: '',
      latitude: '',
      longitude: '',
      address: '',
      type: 'HOSPITAL',
    });
    setEditingDestination(null);
    setIsModalVisible(true);
  };

  const openEditDestinationModal = (destination) => {
    setFormData({
      name: destination.name,
      latitude: destination.latitude.toString(),
      longitude: destination.longitude.toString(),
      address: destination.address || '',
      type: destination.type,
    });
    setEditingDestination(destination);
    setIsModalVisible(true);
  };

  const closeModal = () => {
    setIsModalVisible(false);
    setEditingDestination(null);
    setFormData({
      name: '',
      latitude: '',
      longitude: '',
      address: '',
      type: 'HOSPITAL',
    });
  };

  const validateForm = () => {
    if (!formData.name.trim()) {
      Alert.alert('Error', 'Please enter a destination name.');
      return false;
    }
    if (!formData.latitude.trim()) {
      Alert.alert('Error', 'Please enter latitude.');
      return false;
    }
    if (!formData.longitude.trim()) {
      Alert.alert('Error', 'Please enter longitude.');
      return false;
    }
    
    const lat = parseFloat(formData.latitude);
    const lng = parseFloat(formData.longitude);
    
    if (isNaN(lat) || lat < -90 || lat > 90) {
      Alert.alert('Error', 'Please enter a valid latitude (-90 to 90).');
      return false;
    }
    if (isNaN(lng) || lng < -180 || lng > 180) {
      Alert.alert('Error', 'Please enter a valid longitude (-180 to 180).');
      return false;
    }
    
    return true;
  };

  const handleSaveDestination = async () => {
    if (!validateForm()) return;

    try {
      setIsLoading(true);
      
      const destinationData = {
        name: formData.name.trim(),
        latitude: parseFloat(formData.latitude),
        longitude: parseFloat(formData.longitude),
        address: formData.address.trim(),
        type: formData.type,
      };
      
      if (editingDestination) {
        // Update existing destination
        const updatedDestination = {
          ...editingDestination,
          ...destinationData,
        };
        await databaseService.updatePlannedDestination(updatedDestination);
      } else {
        // Add new destination
        await databaseService.insertPlannedDestination(destinationData);
      }

      await loadDestinations();
      closeModal();
      
      Alert.alert('Success', 'Planned destination saved successfully.');
    } catch (error) {
      console.error('Failed to save destination:', error);
      Alert.alert('Error', 'Failed to save planned destination.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteDestination = (destination) => {
    Alert.alert(
      'Delete Destination',
      `Are you sure you want to delete ${destination.name}?`,
      [
        {text: 'Cancel', style: 'cancel'},
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              setIsLoading(true);
              await databaseService.deletePlannedDestination(destination);
              await loadDestinations();
              Alert.alert('Success', 'Planned destination deleted successfully.');
            } catch (error) {
              console.error('Failed to delete destination:', error);
              Alert.alert('Error', 'Failed to delete planned destination.');
            } finally {
              setIsLoading(false);
            }
          },
        },
      ],
    );
  };

  const handleUseCurrentLocation = async () => {
    try {
      const location = await locationService.getCurrentLocation();
      if (location) {
        setFormData({
          ...formData,
          latitude: location.latitude.toString(),
          longitude: location.longitude.toString(),
        });
        Alert.alert('Success', 'Current location added to form.');
      }
    } catch (error) {
      console.error('Failed to get current location:', error);
      Alert.alert('Error', 'Failed to get current location.');
    }
  };

  const handleMarkAsVisited = async (destination) => {
    try {
      setIsLoading(true);
      const updatedDestination = {
        ...destination,
        isVisited: !destination.isVisited,
        visitDate: destination.isVisited ? null : Date.now(),
      };
      await databaseService.updatePlannedDestination(updatedDestination);
      await loadDestinations();
      
      const status = updatedDestination.isVisited ? 'visited' : 'unvisited';
      Alert.alert('Success', `Destination marked as ${status}.`);
    } catch (error) {
      console.error('Failed to update destination:', error);
      Alert.alert('Error', 'Failed to update destination status.');
    } finally {
      setIsLoading(false);
    }
  };

  const getFilteredDestinations = () => {
    if (selectedType === 'ALL') {
      return destinations;
    }
    return destinations.filter(dest => dest.type === selectedType);
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'HOSPITAL': return 'local-hospital';
      case 'POLICE_STATION': return 'local-police';
      case 'RESTAURANT': return 'restaurant';
      case 'HOTEL': return 'hotel';
      case 'ATTRACTION': return 'place';
      case 'CUSTOM': return 'star';
      default: return 'place';
    }
  };

  const getTypeColor = (type) => {
    switch (type) {
      case 'HOSPITAL': return '#f44336';
      case 'POLICE_STATION': return '#2196f3';
      case 'RESTAURANT': return '#ff9800';
      case 'HOTEL': return '#4caf50';
      case 'ATTRACTION': return '#9c27b0';
      case 'CUSTOM': return '#607d8b';
      default: return '#666';
    }
  };

  const renderDestination = ({item}) => (
    <View style={styles.destinationCard}>
      <View style={styles.destinationInfo}>
        <View style={styles.destinationHeader}>
          <Icon 
            name={getTypeIcon(item.type)} 
            size={24} 
            color={getTypeColor(item.type)} 
          />
          <View style={styles.destinationDetails}>
            <Text style={styles.destinationName}>{item.name}</Text>
            <Text style={styles.destinationType}>
              {DESTINATION_TYPES.find(t => t.value === item.type)?.label}
            </Text>
            {item.address && (
              <Text style={styles.destinationAddress}>{item.address}</Text>
            )}
            <Text style={styles.destinationCoordinates}>
              {item.latitude.toFixed(6)}, {item.longitude.toFixed(6)}
            </Text>
          </View>
        </View>
        
        {item.isVisited && (
          <View style={styles.visitedBadge}>
            <Icon name="check-circle" size={16} color="#4caf50" />
            <Text style={styles.visitedText}>Visited</Text>
          </View>
        )}
      </View>
      
      <View style={styles.destinationActions}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => handleMarkAsVisited(item)}>
          <Icon 
            name={item.isVisited ? "undo" : "check"} 
            size={20} 
            color={item.isVisited ? "#ff9800" : "#4caf50"} 
          />
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => openEditDestinationModal(item)}>
          <Icon name="edit" size={20} color="#2196f3" />
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => handleDeleteDestination(item)}>
          <Icon name="delete" size={20} color="#f44336" />
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Icon name="place" size={64} color="#ccc" />
      <Text style={styles.emptyStateTitle}>No Planned Destinations</Text>
      <Text style={styles.emptyStateText}>
        Add destinations to plan your trip and have offline access to important locations.
      </Text>
    </View>
  );

  const renderFilterButtons = () => (
    <View style={styles.filterContainer}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {['ALL', ...DESTINATION_TYPES.map(t => t.value)].map(type => (
          <TouchableOpacity
            key={type}
            style={[
              styles.filterButton,
              selectedType === type && styles.filterButtonActive
            ]}
            onPress={() => setSelectedType(type)}>
            <Text style={[
              styles.filterButtonText,
              selectedType === type && styles.filterButtonTextActive
            ]}>
              {type === 'ALL' ? 'All' : DESTINATION_TYPES.find(t => t.value === type)?.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Planned Destinations</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={openAddDestinationModal}>
          <LinearGradient
            colors={['#4caf50', '#388e3c']}
            style={styles.addButtonGradient}>
            <Icon name="add" size={24} color="white" />
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {renderFilterButtons()}

      <FlatList
        data={getFilteredDestinations()}
        renderItem={renderDestination}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={renderEmptyState}
        refreshing={isLoading}
        onRefresh={loadDestinations}
      />

      {/* Add/Edit Destination Modal */}
      <Modal
        visible={isModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={closeModal}>
        <KeyboardAvoidingView
          style={styles.modalContainer}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingDestination ? 'Edit Destination' : 'Add Planned Destination'}
              </Text>
              <TouchableOpacity onPress={closeModal}>
                <Icon name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <View style={styles.form}>
              <Text style={styles.label}>Destination Name</Text>
              <TextInput
                style={styles.input}
                value={formData.name}
                onChangeText={(text) => setFormData({...formData, name: text})}
                placeholder="Enter destination name"
                autoCapitalize="words"
              />

              <Text style={styles.label}>Type</Text>
              <RNPickerSelect
                onValueChange={(value) => setFormData({...formData, type: value})}
                items={DESTINATION_TYPES}
                value={formData.type}
                style={pickerSelectStyles}
              />

              <Text style={styles.label}>Address (Optional)</Text>
              <TextInput
                style={styles.input}
                value={formData.address}
                onChangeText={(text) => setFormData({...formData, address: text})}
                placeholder="Enter address"
                autoCapitalize="words"
              />

              <View style={styles.coordinatesRow}>
                <View style={styles.coordinateInput}>
                  <Text style={styles.label}>Latitude</Text>
                  <TextInput
                    style={styles.input}
                    value={formData.latitude}
                    onChangeText={(text) => setFormData({...formData, latitude: text})}
                    placeholder="0.000000"
                    keyboardType="numeric"
                  />
                </View>
                
                <View style={styles.coordinateInput}>
                  <Text style={styles.label}>Longitude</Text>
                  <TextInput
                    style={styles.input}
                    value={formData.longitude}
                    onChangeText={(text) => setFormData({...formData, longitude: text})}
                    placeholder="0.000000"
                    keyboardType="numeric"
                  />
                </View>
              </View>

              <TouchableOpacity
                style={styles.currentLocationButton}
                onPress={handleUseCurrentLocation}>
                <Icon name="my-location" size={20} color="#2196f3" />
                <Text style={styles.currentLocationText}>Use Current Location</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={closeModal}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.saveButton}
                onPress={handleSaveDestination}
                disabled={isLoading}>
                <LinearGradient
                  colors={['#4caf50', '#388e3c']}
                  style={styles.saveButtonGradient}>
                  <Text style={styles.saveButtonText}>
                    {editingDestination ? 'Update' : 'Add'} Destination
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
};

const pickerSelectStyles = StyleSheet.create({
  inputIOS: {
    fontSize: 16,
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    color: 'black',
    paddingRight: 30,
    marginBottom: 20,
  },
  inputAndroid: {
    fontSize: 16,
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    color: 'black',
    paddingRight: 30,
    marginBottom: 20,
  },
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  addButton: {
    borderRadius: 25,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  addButtonGradient: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterContainer: {
    backgroundColor: 'white',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  filterButton: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    marginHorizontal: 5,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
  },
  filterButtonActive: {
    backgroundColor: '#2196f3',
  },
  filterButtonText: {
    fontSize: 14,
    color: '#666',
  },
  filterButtonTextActive: {
    color: 'white',
    fontWeight: 'bold',
  },
  listContainer: {
    padding: 20,
    flexGrow: 1,
  },
  destinationCard: {
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
  destinationInfo: {
    flex: 1,
  },
  destinationHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  destinationDetails: {
    flex: 1,
    marginLeft: 10,
  },
  destinationName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 2,
  },
  destinationType: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  destinationAddress: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  destinationCoordinates: {
    fontSize: 12,
    color: '#999',
  },
  visitedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e8f5e8',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  visitedText: {
    fontSize: 12,
    color: '#4caf50',
    marginLeft: 4,
    fontWeight: '500',
  },
  destinationActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 10,
  },
  actionButton: {
    padding: 8,
    marginLeft: 10,
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
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  form: {
    padding: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 16,
    marginBottom: 20,
  },
  coordinatesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  coordinateInput: {
    flex: 1,
    marginHorizontal: 5,
  },
  currentLocationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    backgroundColor: '#e3f2fd',
    borderRadius: 8,
    marginBottom: 20,
  },
  currentLocationText: {
    fontSize: 14,
    color: '#2196f3',
    marginLeft: 8,
    fontWeight: '500',
  },
  modalActions: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    justifyContent: 'space-between',
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    marginRight: 10,
    alignItems: 'center',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  cancelButtonText: {
    fontSize: 16,
    color: '#666',
  },
  saveButton: {
    flex: 1,
    marginLeft: 10,
    borderRadius: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  saveButtonGradient: {
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 8,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
  },
});

export default DestinationsScreen;
