import { useState } from 'react';
import { useAppStore } from '../stores/useAppStore';
import { EmergencyContact } from '../types';
import { smsService } from '../services/smsService';
import { Alert } from 'react-native';

export const useEmergencyContacts = () => {
  const {
    emergencyContacts,
    addEmergencyContact,
    updateEmergencyContact,
    removeEmergencyContact,
  } = useAppStore();

  const [isLoading, setIsLoading] = useState(false);

  const addContact = async (contact: Omit<EmergencyContact, 'id'>) => {
    try {
      setIsLoading(true);
      
      // Validate contact data
      if (!contact.name.trim() || !contact.phoneNumber.trim()) {
        throw new Error('Please fill in all fields');
      }

      // Validate phone number format
      const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
      const cleanPhone = contact.phoneNumber.replace(/[\s\-\(\)]/g, '');
      if (!phoneRegex.test(cleanPhone)) {
        throw new Error('Please enter a valid phone number');
      }

      // Create contact with ID
      const newContact: EmergencyContact = {
        ...contact,
        id: Date.now().toString(),
        name: contact.name.trim(),
        phoneNumber: contact.phoneNumber.trim(),
      };

      // If this is set as primary, unset other primary contacts
      if (newContact.isPrimary) {
        emergencyContacts.forEach(c => {
          if (c.isPrimary) {
            updateEmergencyContact(c.id, { isPrimary: false });
          }
        });
      }

      addEmergencyContact(newContact);
      return { success: true, contact: newContact };
    } catch (error) {
      console.error('Error adding contact:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Failed to add contact' };
    } finally {
      setIsLoading(false);
    }
  };

  const updateContact = async (id: string, updates: Partial<EmergencyContact>) => {
    try {
      setIsLoading(true);

      // If setting as primary, unset other primary contacts
      if (updates.isPrimary) {
        emergencyContacts.forEach(c => {
          if (c.isPrimary && c.id !== id) {
            updateEmergencyContact(c.id, { isPrimary: false });
          }
        });
      }

      updateEmergencyContact(id, updates);
      return { success: true };
    } catch (error) {
      console.error('Error updating contact:', error);
      return { success: false, error: 'Failed to update contact' };
    } finally {
      setIsLoading(false);
    }
  };

  const deleteContact = async (id: string) => {
    try {
      setIsLoading(true);
      removeEmergencyContact(id);
      return { success: true };
    } catch (error) {
      console.error('Error deleting contact:', error);
      return { success: false, error: 'Failed to delete contact' };
    } finally {
      setIsLoading(false);
    }
  };

  const testContact = async (contact: EmergencyContact) => {
    try {
      setIsLoading(true);
      
      const success = await smsService.sendTestMessage(contact.phoneNumber);
      
      if (success) {
        Alert.alert(
          'Test Message Sent',
          `Test message sent to ${contact.name} successfully.`
        );
      } else {
        Alert.alert(
          'Test Failed',
          `Failed to send test message to ${contact.name}. Please check the phone number and SMS permissions.`
        );
      }
      
      return success;
    } catch (error) {
      console.error('Error sending test message:', error);
      Alert.alert('Error', 'Failed to send test message.');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const getActiveContacts = () => {
    return emergencyContacts.filter(contact => contact.isActive);
  };

  const getPrimaryContact = () => {
    return emergencyContacts.find(contact => contact.isPrimary && contact.isActive);
  };

  const hasActiveContacts = () => {
    return getActiveContacts().length > 0;
  };

  const getContactsByType = () => {
    const primary = getPrimaryContact();
    const secondary = getActiveContacts().filter(contact => !contact.isPrimary);
    
    return { primary, secondary };
  };

  return {
    emergencyContacts,
    isLoading,
    addContact,
    updateContact,
    deleteContact,
    testContact,
    getActiveContacts,
    getPrimaryContact,
    hasActiveContacts,
    getContactsByType,
  };
};
