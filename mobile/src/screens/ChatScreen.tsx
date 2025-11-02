import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import apiService from '../services/api.service';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/AppNavigator';

type ChatScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Chat'>;

interface Props {
  navigation: ChatScreenNavigationProp;
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  response?: string;
  createdAt: string;
}

export default function ChatScreen({ navigation }: Props) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const { user, logout } = useAuth();
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    loadChatHistory();
    checkTrialStatus();
  }, []);

  const checkTrialStatus = () => {
    if (user?.trialEnd) {
      const trialEnd = new Date(user.trialEnd);
      const now = new Date();
      const hoursRemaining = Math.max(0, (trialEnd.getTime() - now.getTime()) / (1000 * 60 * 60));

      if (hoursRemaining > 0 && hoursRemaining < 24 && !user.subscriptionStatus) {
        Alert.alert(
          'Trial Ending Soon',
          `Your trial ends in ${Math.floor(hoursRemaining)} hours. Subscribe to continue using ZYNX AI.`,
          [
            { text: 'Later', style: 'cancel' },
            { text: 'Subscribe', onPress: () => navigation.navigate('Subscription') },
          ]
        );
      }
    }
  };

  const loadChatHistory = async () => {
    setLoading(true);
    try {
      const response = await apiService.getChatHistory();
      const history = response.data.messages;

      // Convert to chat format
      const chatMessages: Message[] = [];
      history.forEach((msg: any) => {
        chatMessages.push({
          id: msg.id + '-user',
          role: 'user',
          content: msg.content,
          createdAt: msg.createdAt,
        });
        if (msg.response) {
          chatMessages.push({
            id: msg.id + '-assistant',
            role: 'assistant',
            content: msg.response,
            createdAt: msg.createdAt,
          });
        }
      });

      setMessages(chatMessages);
    } catch (error: any) {
      if (error.response?.status === 402) {
        Alert.alert(
          'Trial Expired',
          'Your trial has expired. Please subscribe to continue.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Subscribe', onPress: () => navigation.navigate('Subscription') },
          ]
        );
      } else {
        Alert.alert('Error', 'Failed to load chat history');
      }
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!inputText.trim() || sending) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputText.trim(),
      createdAt: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputText('');
    setSending(true);

    try {
      const response = await apiService.sendMessage(userMessage.content);
      const aiMessage: Message = {
        id: Date.now().toString() + '-ai',
        role: 'assistant',
        content: response.data.response,
        createdAt: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, aiMessage]);
      setTimeout(() => flatListRef.current?.scrollToEnd(), 100);
    } catch (error: any) {
      if (error.response?.status === 402) {
        Alert.alert(
          'Trial Expired',
          'Your trial has expired. Please subscribe to continue.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Subscribe', onPress: () => navigation.navigate('Subscription') },
          ]
        );
      } else if (error.response?.status === 429) {
        Alert.alert('Rate Limit', 'You have reached your message limit. Please try again later.');
      } else {
        Alert.alert('Error', 'Failed to send message');
      }
    } finally {
      setSending(false);
    }
  };

  const renderMessage = ({ item }: { item: Message }) => {
    const isUser = item.role === 'user';

    return (
      <View style={[styles.messageContainer, isUser ? styles.userMessage : styles.aiMessage]}>
        <Text style={[styles.messageText, isUser ? styles.userMessageText : styles.aiMessageText]}>
          {item.content}
        </Text>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
      keyboardVerticalOffset={90}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.navigate('Profile')}>
          <Text style={styles.headerButton}>Profile</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={logout}>
          <Text style={styles.headerButton}>Logout</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6366f1" />
        </View>
      ) : (
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.messagesList}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd()}
        />
      )}

      {sending && (
        <View style={styles.typingIndicator}>
          <Text style={styles.typingText}>AI is typing...</Text>
        </View>
      )}

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Type your message..."
          value={inputText}
          onChangeText={setInputText}
          multiline
          maxLength={4000}
          editable={!sending}
        />
        <TouchableOpacity
          style={[styles.sendButton, (!inputText.trim() || sending) && styles.sendButtonDisabled]}
          onPress={sendMessage}
          disabled={!inputText.trim() || sending}
        >
          <Text style={styles.sendButtonText}>Send</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  headerButton: {
    color: '#6366f1',
    fontSize: 16,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  messagesList: {
    padding: 16,
  },
  messageContainer: {
    maxWidth: '80%',
    padding: 12,
    borderRadius: 16,
    marginBottom: 12,
  },
  userMessage: {
    alignSelf: 'flex-end',
    backgroundColor: '#6366f1',
  },
  aiMessage: {
    alignSelf: 'flex-start',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
  },
  userMessageText: {
    color: '#fff',
  },
  aiMessageText: {
    color: '#333',
  },
  typingIndicator: {
    padding: 12,
    paddingLeft: 16,
  },
  typingText: {
    color: '#666',
    fontStyle: 'italic',
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#ddd',
  },
  input: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginRight: 8,
    maxHeight: 100,
    fontSize: 16,
  },
  sendButton: {
    backgroundColor: '#6366f1',
    borderRadius: 20,
    paddingHorizontal: 20,
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
  sendButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
});
