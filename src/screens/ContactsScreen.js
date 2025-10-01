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

import {databaseService} from '../services/DatabaseService';
import {smsService} from '../services/SMSService';

const ContactsScreen = () => {
  const [contacts, setContacts] = useState([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingContact, setEditingContact] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    phoneNumber: '',
    isPrimary: false,
  });
  const [isLoading, setIsLoading] = useState(false);

  useFocusEffect(
    useCallback(() => {
      loadContacts();
    }, []),
  );

  const loadContacts = async () => {
    try {
      setIsLoading(true);
      const contactsData = await databaseService.getActiveEmergencyContacts();
      setContacts(contactsData);
    } catch (error) {
      console.error('Failed to load contacts:', error);
      Alert.alert('Error', 'Failed to load emergency contacts.');
    } finally {
      setIsLoading(false);
    }
  };

  const openAddContactModal = () => {
    setFormData({name: '', phoneNumber: '', isPrimary: false});
    setEditingContact(null);
    setIsModalVisible(true);
  };

  const openEditContactModal = (contact) => {
    setFormData({
      name: contact.name,
      phoneNumber: contact.phoneNumber,
      isPrimary: contact.isPrimary,
    });
    setEditingContact(contact);
    setIsModalVisible(true);
  };

  const closeModal = () => {
    setIsModalVisible(false);
    setEditingContact(null);
    setFormData({name: '', phoneNumber: '', isPrimary: false});
  };

  const validateForm = () => {
    if (!formData.name.trim()) {
      Alert.alert('Error', 'Please enter a contact name.');
      return false;
    }
    if (!formData.phoneNumber.trim()) {
      Alert.alert('Error', 'Please enter a phone number.');
      return false;
    }
    if (!smsService.validatePhoneNumber(formData.phoneNumber)) {
      Alert.alert('Error', 'Please enter a valid phone number.');
      return false;
    }
    return true;
  };

  const handleSaveContact = async () => {
    if (!validateForm()) return;

    try {
      setIsLoading(true);
      
      const formattedPhoneNumber = smsService.formatPhoneNumber(formData.phoneNumber);
      
      if (editingContact) {
        // Update existing contact
        const updatedContact = {
          ...editingContact,
          name: formData.name.trim(),
          phoneNumber: formattedPhoneNumber,
          isPrimary: formData.isPrimary,
        };
        await databaseService.updateEmergencyContact(updatedContact);
      } else {
        // Add new contact
        const newContact = {
          name: formData.name.trim(),
          phoneNumber: formattedPhoneNumber,
          isPrimary: formData.isPrimary,
        };
        await databaseService.insertEmergencyContact(newContact);
      }

      await loadContacts();
      closeModal();
      
      Alert.alert('Success', 'Emergency contact saved successfully.');
    } catch (error) {
      console.error('Failed to save contact:', error);
      Alert.alert('Error', 'Failed to save emergency contact.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteContact = (contact) => {
    Alert.alert(
      'Delete Contact',
      `Are you sure you want to delete ${contact.name}?`,
      [
        {text: 'Cancel', style: 'cancel'},
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              setIsLoading(true);
              await databaseService.deleteEmergencyContact(contact);
              await loadContacts();
              Alert.alert('Success', 'Emergency contact deleted successfully.');
            } catch (error) {
              console.error('Failed to delete contact:', error);
              Alert.alert('Error', 'Failed to delete emergency contact.');
            } finally {
              setIsLoading(false);
            }
          },
        },
      ],
    );
  };

  const handleTestSMS = async (contact) => {
    Alert.alert(
      'Test SMS',
      `Send a test message to ${contact.name} (${contact.phoneNumber})?`,
      [
        {text: 'Cancel', style: 'cancel'},
        {
          text: 'Send Test',
          onPress: async () => {
            try {
              setIsLoading(true);
              await smsService.testSMS(contact.phoneNumber);
              Alert.alert('Success', 'Test SMS sent successfully.');
            } catch (error) {
              console.error('Failed to send test SMS:', error);
              Alert.alert('Error', 'Failed to send test SMS.');
            } finally {
              setIsLoading(false);
            }
          },
        },
      ],
    );
  };

  const handleSetPrimary = async (contact) => {
    try {
      setIsLoading(true);
      
      // Remove primary status from all contacts
      const updatedContacts = contacts.map(c => ({
        ...c,
        isPrimary: false,
      }));
      
      // Set the selected contact as primary
      const targetContact = updatedContacts.find(c => c.id === contact.id);
      if (targetContact) {
        targetContact.isPrimary = true;
      }
      
      // Update all contacts
      for (const c of updatedContacts) {
        await databaseService.updateEmergencyContact(c);
      }
      
      await loadContacts();
      Alert.alert('Success', `${contact.name} is now your primary emergency contact.`);
    } catch (error) {
      console.error('Failed to set primary contact:', error);
      Alert.alert('Error', 'Failed to set primary contact.');
    } finally {
      setIsLoading(false);
    }
  };

  const renderContact = ({item}) => (
    <View style={styles.contactCard}>
      <View style={styles.contactInfo}>
        <View style={styles.contactHeader}>
          <Text style={styles.contactName}>{item.name}</Text>
          {item.isPrimary && (
            <View style={styles.primaryBadge}>
              <Text style={styles.primaryText}>PRIMARY</Text>
            </View>
          )}
        </View>
        <Text style={styles.contactPhone}>{item.phoneNumber}</Text>
      </View>
      
      <View style={styles.contactActions}>
        {!item.isPrimary && (
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleSetPrimary(item)}>
            <Icon name="star" size={20} color="#ff9800" />
          </TouchableOpacity>
        )}
        
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => handleTestSMS(item)}>
          <Icon name="message" size={20} color="#2196f3" />
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => openEditContactModal(item)}>
          <Icon name="edit" size={20} color="#4caf50" />
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => handleDeleteContact(item)}>
          <Icon name="delete" size={20} color="#f44336" />
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Icon name="contacts" size={64} color="#ccc" />
      <Text style={styles.emptyStateTitle}>No Emergency Contacts</Text>
      <Text style={styles.emptyStateText}>
        Add emergency contacts to receive SOS alerts when you need help.
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Emergency Contacts</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={openAddContactModal}>
          <LinearGradient
            colors={['#4caf50', '#388e3c']}
            style={styles.addButtonGradient}>
            <Icon name="add" size={24} color="white" />
          </LinearGradient>
        </TouchableOpacity>
      </View>

      <FlatList
        data={contacts}
        renderItem={renderContact}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={renderEmptyState}
        refreshing={isLoading}
        onRefresh={loadContacts}
      />

      {/* Add/Edit Contact Modal */}
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
                {editingContact ? 'Edit Contact' : 'Add Emergency Contact'}
              </Text>
              <TouchableOpacity onPress={closeModal}>
                <Icon name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <View style={styles.form}>
              <Text style={styles.label}>Contact Name</Text>
              <TextInput
                style={styles.input}
                value={formData.name}
                onChangeText={(text) => setFormData({...formData, name: text})}
                placeholder="Enter contact name"
                autoCapitalize="words"
              />

              <Text style={styles.label}>Phone Number</Text>
              <TextInput
                style={styles.input}
                value={formData.phoneNumber}
                onChangeText={(text) => setFormData({...formData, phoneNumber: text})}
                placeholder="Enter phone number"
                keyboardType="phone-pad"
              />

              <TouchableOpacity
                style={styles.checkboxContainer}
                onPress={() => setFormData({...formData, isPrimary: !formData.isPrimary})}>
                <View style={[
                  styles.checkbox,
                  formData.isPrimary && styles.checkboxChecked
                ]}>
                  {formData.isPrimary && <Icon name="check" size={16} color="white" />}
                </View>
                <Text style={styles.checkboxLabel}>Set as Primary Contact</Text>
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
                onPress={handleSaveContact}
                disabled={isLoading}>
                <LinearGradient
                  colors={['#4caf50', '#388e3c']}
                  style={styles.saveButtonGradient}>
                  <Text style={styles.saveButtonText}>
                    {editingContact ? 'Update' : 'Add'} Contact
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
  listContainer: {
    padding: 20,
    flexGrow: 1,
  },
  contactCard: {
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
  contactInfo: {
    flex: 1,
  },
  contactHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  contactName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  primaryBadge: {
    backgroundColor: '#ff9800',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  primaryText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: 'white',
  },
  contactPhone: {
    fontSize: 14,
    color: '#666',
  },
  contactActions: {
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
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 2,
    borderColor: '#ddd',
    borderRadius: 4,
    marginRight: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#4caf50',
    borderColor: '#4caf50',
  },
  checkboxLabel: {
    fontSize: 14,
    color: '#333',
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

export default ContactsScreen;
