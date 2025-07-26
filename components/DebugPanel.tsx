// components/DebugPanel.tsx
import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Platform } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

interface CarbieResult {
  model_name: string;
  model_version: string;
  prompt: string;
  structured_data?: any;
  usage: {
    prompt_tokens?: number;
    completion_tokens?: number;
    total_tokens?: number;
    input_tokens?: number;
    output_tokens?: number;
    cache_creation_input_tokens?: number;
    cache_read_input_tokens?: number;
  };
  elapsed_time_seconds: number;
}

interface LogMessage {
  id: string;
  timestamp: Date;
  level: 'info' | 'warn' | 'error' | 'debug';
  message: string;
  data?: any;
}

interface DebugPanelProps {
  fullResponse?: CarbieResult | null;
  logs: LogMessage[];
  initiallyExpanded?: boolean;
}

export default function DebugPanel({ fullResponse, logs, initiallyExpanded = true }: DebugPanelProps) {
  const [showDebugPanel, setShowDebugPanel] = useState(true); // Always start expanded
  const [activeTab, setActiveTab] = useState<'logs' | 'response'>('logs');
  const scrollViewRef = useRef<ScrollView>(null);

  // Add debugging to see if component is mounting
  useEffect(() => {
    console.log('DebugPanel component mounted');
    console.log('DebugPanel props:', { fullResponse: !!fullResponse, logsLength: logs.length, initiallyExpanded });
  }, [fullResponse, logs.length, initiallyExpanded]);

  // Auto-scroll to bottom when new logs are added
  useEffect(() => {
    if (scrollViewRef.current && logs.length > 0) {
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [logs]);

  const getLogLevelColor = (level: LogMessage['level']) => {
    switch (level) {
      case 'error': return '#D32F2F';
      case 'warn': return '#F57C00';
      case 'info': return '#1976D2';
      case 'debug': return '#388E3C';
      default: return '#666';
    }
  };

  const getLogLevelIcon = (level: LogMessage['level']) => {
    switch (level) {
      case 'error': return 'error';
      case 'warn': return 'warning';
      case 'info': return 'info';
      case 'debug': return 'bug-report';
      default: return 'info';
    }
  };

  const formatTimestamp = (date: Date) => {
    return date.toLocaleTimeString();
  };

  const copyToClipboard = (text: string) => {
    if (Platform.OS === 'web') {
      navigator.clipboard.writeText(text).then(() => {
        console.log('Copied to clipboard');
      }).catch(err => {
        console.error('Failed to copy: ', err);
      });
    } else {
      // For React Native, you'd need to use a clipboard library
      console.log('Copy to clipboard not implemented for mobile yet');
    }
  };

  const getLogsText = () => {
    return logs.map(log => 
      `[${log.level.toUpperCase()}] ${log.message}${log.data ? ` - ${JSON.stringify(log.data)}` : ''}`
    ).join('\n');
  };

  const getResponseText = () => {
    if (!fullResponse) return 'No response data yet...';
    return JSON.stringify(fullResponse, null, 2);
  };

  return (
    <View style={styles.debugContainer}>
      {/* Header */}
      <View style={styles.debugHeader}>
        <Text style={styles.debugTitle}>Debug Panel</Text>
        <View style={styles.headerControls}>
          {/* Tab Buttons */}
          <View style={styles.tabContainer}>
            <TouchableOpacity 
              style={[styles.tabButton, activeTab === 'logs' && styles.activeTabButton]}
              onPress={() => setActiveTab('logs')}
            >
              <Text style={[styles.tabText, activeTab === 'logs' && styles.activeTabText]}>
                Logs ({logs.length})
              </Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.tabButton, activeTab === 'response' && styles.activeTabButton]}
              onPress={() => setActiveTab('response')}
            >
              <Text style={[styles.tabText, activeTab === 'response' && styles.activeTabText]}>
                Response
              </Text>
            </TouchableOpacity>
          </View>
          
          {/* Copy Button */}
          <TouchableOpacity 
            onPress={() => copyToClipboard(activeTab === 'logs' ? getLogsText() : getResponseText())}
            style={styles.copyButton}
          >
            <MaterialIcons name="content-copy" size={16} color="#FFFFFF" />
          </TouchableOpacity>
          
          {/* Toggle Button */}
          <TouchableOpacity 
            onPress={() => setShowDebugPanel(!showDebugPanel)}
            style={styles.toggleButton}
          >
            <MaterialIcons 
              name={showDebugPanel ? "expand-less" : "expand-more"} 
              size={20} 
              color="#FFFFFF" 
            />
          </TouchableOpacity>
        </View>
      </View>
      
      {showDebugPanel && (
        <View style={styles.debugContent}>
          {activeTab === 'logs' ? (
            /* Logs Tab */
            <ScrollView 
              ref={scrollViewRef}
              style={styles.logsContainer} 
              nestedScrollEnabled={true}
              showsVerticalScrollIndicator={true}
            >
                             {logs.length === 0 ? (
                 <View style={styles.noLogsContainer}>
                   <Text style={styles.noLogsText}>No logs yet...</Text>
                   <Text style={styles.noLogsSubtext}>Debug panel is working - logs will appear here</Text>
                 </View>
               ) : (
                logs.map((log) => (
                  <View key={log.id} style={styles.logEntry}>
                    <View style={styles.logHeader}>
                      <MaterialIcons 
                        name={getLogLevelIcon(log.level)} 
                        size={16} 
                        color={getLogLevelColor(log.level)} 
                      />
                      <Text style={[styles.logLevel, { color: getLogLevelColor(log.level) }]}>
                        {log.level.toUpperCase()}
                      </Text>
                      <Text style={styles.logTimestamp}>
                        {formatTimestamp(log.timestamp)}
                      </Text>
                    </View>
                    <Text style={styles.logMessage}>{log.message}</Text>
                    {log.data && (
                      <Text style={styles.logData}>
                        {typeof log.data === 'object' ? JSON.stringify(log.data, null, 2) : String(log.data)}
                      </Text>
                    )}
                  </View>
                ))
              )}
            </ScrollView>
          ) : (
            /* Response Tab */
            <ScrollView style={styles.responseContainer} nestedScrollEnabled={true}>
              {fullResponse ? (
                <>
                  <Text style={styles.debugText}>
                    <Text style={styles.debugLabel}>Model:</Text> {fullResponse.model_name} ({fullResponse.model_version})
                  </Text>
                  
                  <Text style={styles.debugText}>
                    <Text style={styles.debugLabel}>Prompt:</Text> {fullResponse.prompt}
                  </Text>
                  
                  <Text style={styles.debugText}>
                    <Text style={styles.debugLabel}>Elapsed Time:</Text> {fullResponse.elapsed_time_seconds.toFixed(2)}s
                  </Text>
                  
                  <Text style={styles.debugText}>
                    <Text style={styles.debugLabel}>Usage:</Text>
                  </Text>
                  <View style={styles.usageContainer}>
                    {Object.entries(fullResponse.usage).map(([key, value]) => (
                      <Text key={key} style={styles.usageText}>
                        • {key}: {value}
                      </Text>
                    ))}
                  </View>
                  
                  <Text style={styles.debugText}>
                    <Text style={styles.debugLabel}>Full Response JSON:</Text>
                  </Text>
                  <Text style={styles.jsonText}>
                    {JSON.stringify(fullResponse, null, 2)}
                  </Text>
                </>
              ) : (
                <Text style={styles.noResponseText}>No response data yet...</Text>
              )}
            </ScrollView>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  debugContainer: {
    backgroundColor: '#2C3E50', // Dark blue-gray background
    borderRadius: 10,
    marginHorizontal: 20,
    marginBottom: 10,
    borderWidth: 2,
    borderColor: '#34495E',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
    minHeight: 120, // Ensure minimum height
  },
  debugHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#34495E', // Darker header
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
  },
  debugTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF', // White text on red background
  },
  headerControls: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tabContainer: {
    flexDirection: 'row',
    marginRight: 10,
  },
  tabButton: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    marginHorizontal: 2,
    borderRadius: 4,
    backgroundColor: '#F5F5F5',
  },
  activeTabButton: {
    backgroundColor: '#2E7D32',
  },
  tabText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  activeTabText: {
    color: '#FFFFFF',
  },
  copyButton: {
    padding: 6,
    marginRight: 8,
    backgroundColor: '#3498DB',
    borderRadius: 4,
  },
  toggleButton: {
    padding: 4,
  },
  debugContent: {
    maxHeight: 300,
    minHeight: 100, // Ensure minimum height for visibility
  },
  logsContainer: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  responseContainer: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  noLogsContainer: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  noLogsText: {
    fontSize: 14,
    color: '#BDC3C7', // Light gray for dark background
    fontStyle: 'italic',
    textAlign: 'center',
    marginBottom: 8,
  },
  noLogsSubtext: {
    fontSize: 12,
    color: '#95A5A6', // Lighter gray for dark background
    textAlign: 'center',
  },
  noResponseText: {
    fontSize: 14,
    color: '#BDC3C7', // Light gray for dark background
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: 20,
  },
  logEntry: {
    marginBottom: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  logHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  logLevel: {
    fontSize: 12,
    fontWeight: 'bold',
    marginLeft: 4,
    marginRight: 8,
  },
  logTimestamp: {
    fontSize: 11,
    color: '#999',
  },
  logMessage: {
    fontSize: 13,
    color: '#ECF0F1', // Light text for dark background
    lineHeight: 18,
    marginBottom: 4,
  },
  logData: {
    fontSize: 11,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    color: '#666',
    backgroundColor: '#F5F5F5',
    padding: 6,
    borderRadius: 3,
    lineHeight: 14,
  },
  debugText: {
    fontSize: 14,
    color: '#ECF0F1', // Light text for dark background
    marginBottom: 8,
    lineHeight: 18,
  },
  debugLabel: {
    fontWeight: 'bold',
    color: '#2E7D32',
  },
  usageContainer: {
    paddingLeft: 12,
    marginBottom: 8,
  },
  usageText: {
    fontSize: 13,
    color: '#555',
    marginBottom: 2,
  },
  jsonText: {
    fontSize: 12,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    color: '#444',
    backgroundColor: '#F5F5F5',
    padding: 8,
    borderRadius: 4,
    lineHeight: 16,
  },
}); 