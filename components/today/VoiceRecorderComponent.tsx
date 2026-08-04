import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useAudioPlayer, useAudioPlayerStatus, useAudioRecorder, RecordingPresets, requestRecordingPermissionsAsync } from 'expo-audio';
import { Ionicons } from '@expo/vector-icons';
import { Theme } from '../../constants/theme';

interface VoiceRecorderComponentProps {
  onCompleted3Times?: () => void;
}

export const VoiceRecorderComponent: React.FC<VoiceRecorderComponentProps> = ({
  onCompleted3Times,
}) => {
  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY, (status) => {
    if (status.isFinished && status.url) {
      setRecordedUri(status.url);
    }
  });
  const playbackPlayer = useAudioPlayer();
  const playbackStatus = useAudioPlayerStatus(playbackPlayer);
  const [isRecording, setIsRecording] = useState(false);
  const [recordedUri, setRecordedUri] = useState<string | null>(null);
  const [isPlayingRecording, setIsPlayingRecording] = useState(false);
  const [reciteCount, setReciteCount] = useState(0);

  React.useEffect(() => {
    if (playbackStatus.didJustFinish) {
      setIsPlayingRecording(false);
    }
  }, [playbackStatus.didJustFinish]);

  const startRecording = async () => {
    try {
      const permission = await requestRecordingPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Permission required', 'Microphone access is needed to record your recitation.');
        return;
      }

      await setAudioModeForRecording();
      await recorder.prepareToRecordAsync();
      recorder.record();
      setIsRecording(true);
    } catch (err) {
      console.error('Failed to start recording', err);
    }
  };

  const stopRecording = async () => {
    if (!recorder.isRecording) return;
    try {
      setIsRecording(false);
      await recorder.stop();
      const uri = recorder.uri;
      if (uri) {
        setRecordedUri(uri);
      }

      setReciteCount(prev => {
        const next = prev + 1;
        if (next >= 3 && onCompleted3Times) {
          onCompleted3Times();
        }
        return next;
      });
    } catch (err) {
      console.error('Failed to stop recording', err);
    }
  };

  const playRecording = async () => {
    if (!recordedUri) return;
    try {
      await setAudioModeForPlayback();
      playbackPlayer.replace({ uri: recordedUri });
      playbackPlayer.play();
      setIsPlayingRecording(true);
    } catch (err) {
      console.error('Error playing recording', err);
    }
  };

  const setAudioModeForRecording = async () => {
    const { setAudioModeAsync } = await import('expo-audio');
    await setAudioModeAsync({
      allowsRecording: true,
      playsInSilentMode: true,
    });
  };

  const setAudioModeForPlayback = async () => {
    const { setAudioModeAsync } = await import('expo-audio');
    await setAudioModeAsync({
      allowsRecording: false,
      playsInSilentMode: true,
      interruptionMode: 'doNotMix',
    });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.instruction}>
        Recite from memory without looking at Mus-haf (3 times required).
        Record your recitation and check for errors.
      </Text>

      <View style={styles.controlsRow}>
        <TouchableOpacity
          style={[styles.recordBtn, isRecording && styles.recordingActiveBtn]}
          onPress={isRecording ? stopRecording : startRecording}
        >
          <Ionicons
            name={isRecording ? "stop" : "mic"}
            size={22}
            color={Theme.colors.textPrimary}
          />
          <Text style={styles.recordBtnText}>
            {isRecording ? "Stop Recording" : "Record Recitation"}
          </Text>
        </TouchableOpacity>

        <View style={styles.countBadge}>
          <Text style={styles.countText}>{reciteCount} / 3</Text>
          <Text style={styles.countSub}>Recorded</Text>
        </View>
      </View>

      {recordedUri && (
        <View style={styles.playbackBox}>
          <TouchableOpacity
            style={styles.playbackBtn}
            onPress={playRecording}
          >
            <Ionicons
              name={isPlayingRecording ? "pause-circle" : "play-circle"}
              size={28}
              color={Theme.colors.accentGold}
            />
            <Text style={styles.playbackText}>
              {isPlayingRecording ? "Playing My Recitation..." : "Listen to My Recording"}
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(10, 22, 40, 0.6)',
    borderRadius: Theme.borderRadius.md,
    padding: Theme.spacing.md,
    marginTop: Theme.spacing.sm,
    borderWidth: 1,
    borderColor: Theme.colors.border,
  },
  instruction: {
    color: Theme.colors.textSecondary,
    fontSize: 12,
    lineHeight: 18,
    marginBottom: Theme.spacing.md,
  },
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Theme.spacing.sm,
  },
  recordBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Theme.colors.errorRed,
    paddingVertical: 10,
    paddingHorizontal: Theme.spacing.md,
    borderRadius: Theme.borderRadius.md,
    gap: 8,
  },
  recordingActiveBtn: {
    backgroundColor: '#DC2626',
    borderWidth: 1,
    borderColor: '#EF4444',
  },
  recordBtnText: {
    color: Theme.colors.textPrimary,
    fontSize: 14,
    fontWeight: '700',
  },
  countBadge: {
    backgroundColor: Theme.colors.accentGoldMuted,
    paddingHorizontal: Theme.spacing.md,
    paddingVertical: 6,
    borderRadius: Theme.borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Theme.colors.accentGoldBorder,
  },
  countText: {
    color: Theme.colors.accentGold,
    fontSize: 16,
    fontWeight: '800',
  },
  countSub: {
    color: Theme.colors.textSecondary,
    fontSize: 9,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  playbackBox: {
    marginTop: Theme.spacing.sm,
    paddingTop: Theme.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Theme.colors.border,
  },
  playbackBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  playbackText: {
    color: Theme.colors.accentGold,
    fontSize: 13,
    fontWeight: '600',
  },
});
