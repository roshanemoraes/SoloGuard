import React, { useState } from 'react';
import { View, Text, Button } from 'react-native';
import i18n, { setAppLanguage, getAppLanguage } from '../i18n';

const HomeScreen: React.FC = () => {
  const [lang, setLang] = useState(getAppLanguage());

  const cycleLanguage = () => {
    const nextLang = lang === 'en' ? 'ta' : lang === 'ta' ? 'si' : 'en';
    setAppLanguage(nextLang);
    setLang(nextLang);
  };

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Text style={{ fontSize: 24, marginBottom: 8 }}>{i18n.t('welcome')}</Text>
      <Text style={{ marginBottom: 16 }}>{i18n.t('hello_user', { name: 'Nirodha' })}</Text>

      <Button title={i18n.t('change_language')} onPress={cycleLanguage} />
      <Text style={{ marginTop: 20 }}>Current: {lang}</Text>
    </View>
  );
};

export default HomeScreen;
