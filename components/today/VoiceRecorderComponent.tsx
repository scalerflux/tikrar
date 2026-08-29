import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useAudioPlayer, useAudioPlayerStatus, useAudioRecorder, RecordingPresets, requestRecordingPermissionsAsync } from 'expo-audio';
import { Ionicons } from '@expo/vector-icons';
import { Theme } from '../../constants/theme';
import { RecordingService, VoiceRecording } from '../../services/recording-service';

interface VoiceRecorderComponentProps {
  onCompleted3Times?: () => void;
  /** Local date ("YYYY-MM-DD") the recordings belong to. */
  dateKey: string;
}

export const VoiceRecorderComponent: React.FC<VoiceRecorderComponentProps> = ({
  onCompleted3Times,
  dateKey,
}) => {
  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const playbackPlayer = useAudioPlayer();
  const playbackStatus = useAudioPlayerStatus(playbackPlayer);
  const [isRecording, setIsRecording] = useState(false);
  const [recordings, setRecordings] = useState<VoiceRecording[]>([]);
  const [playingIndex, setPlayingIndex] = useState<number | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const lastPlayedUriRef = React.useRef<string | null>(null);

  const reciteCount = recordings.length;

  // Load today's saved recordings (and reload when the day changes).
  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const saved = await RecordingService.getRecordings(dateKey);
        if (!cancelled) setRecordings(saved);
      } catch (e) {
        console.warn('Failed to load recordings', e);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [dateKey]);

  React.useEffect(() => {
    if (playbackStatus.didJustFinish) {
      setPlayingIndex(null);
    }
  }, [playbackStatus.didJustFinish]);

  React.useEffect(() => {
    if (!playbackStatus.playing) return;
    // keep state in sync when playback starts outside of playRecording
  }, [playbackStatus.playing]);

  const startRecording = async () => {
    if (recordings.length >= 3) {
      Alert.alert('3 recordings saved', 'Delete one of your recordings below if you want to record again.');
      return;
    }
    try {
      const permission = await requestRecordingPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Permission required', 'Microphone access is needed to record your recitation.');
        return;
      }

      if (playbackStatus.playing) {
        try {
          playbackPlayer.pause();
        } catch {}
        setPlayingIndex(null);
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
        setIsSaving(true);
        try {
          const saved = await RecordingService.addRecording(dateKey, uri);
          setRecordings((prev) => {
            const next = [...prev, saved];
            if (next.length >= 3 && onCompleted3Times) {
              onCompleted3Times();
            }
            return next;
          });
        } finally {
          setIsSaving(false);
        }
      }
    } catch (err) {
      console.error('Failed to stop recording', err);
    }
  };

  const playRecording = async (index: number) => {
    const recording = recordings[index];
    if (!recording) return;
    try {
      // Tapping the playing row pauses it.
      if (playingIndex === index && playbackStatus.playing) {
        playbackPlayer.pause();
        setPlayingIndex(null);
        return;
      }

      if (playbackStatus.playing) {
        playbackPlayer.pause();
      }

      await setAudioModeForPlayback();

      const isNewUri = lastPlayedUriRef.current !== recording.uri;
      if (!isNewUri && playbackStatus.isLoaded && playbackStatus.currentTime > 0 && playbackStatus.currentTime < (playbackStatus.duration || 1)) {
        playbackPlayer.play();
        setPlayingIndex(index);
        return;
      }

      lastPlayedUriRef.current = recording.uri;
      playbackPlayer.replace({ uri: recording.uri });
      playbackPlayer.play();
      setPlayingIndex(index);
    } catch (err) {
      console.error('Error playing recording', err);
    }
  };

  const deleteRecording = async (index: number) => {
    const recording = recordings[index];
    if (!recording) return;
    try {
      if (playingIndex === index) {
        try {
          playbackPlayer.pause();
        } catch {}
        setPlayingIndex(null);
      }
      const remaining = await RecordingService.removeRecording(dateKey, recording.uri);
      setRecordings(remaining);
    } catch (err) {
      console.error('Failed to delete recording', err);
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
        Each take is saved separately so you can compare them.
      </Text>

      <View style={styles.controlsRow}>
        <TouchableOpacity
          style={[styles.recordBtn, isRecording && styles.recordingActiveBtn, recordings.length >= 3 && styles.recordBtnDone]}
          onPress={isRecording ? stopRecording : startRecording}
          disabled={isSaving}
        >
          <Ionicons
            name={isRecording ? "stop" : "mic"}
            size={22}
            color={Theme.colors.textPrimary}
          />
          <Text style={styles.recordBtnText}>
            {isRecording
              ? "Stop Recording"
              : recordings.length >= 3
                ? "All 3 Recorded"
                : isSaving
                  ? "Saving..."
                  : `Record Take ${recordings.length + 1}`}
          </Text>
        </TouchableOpacity>

        <View style={styles.countBadge}>
          <Text style={styles.countText}>{reciteCount} / 3</Text>
          <Text style={styles.countSub}>Recorded</Text>
        </View>
      </View>

      {recordings.length > 0 && (
        <View style={styles.playbackBox}>
          <Text style={styles.savedHeader}>MY RECORDINGS</Text>
          {recordings.map((recording, index) => {
            const isThisPlaying = playingIndex === index && playbackStatus.playing;
            return (
              <View key={recording.uri} style={styles.recordingRow}>
                <TouchableOpacity
                  style={styles.recordingPlayBtn}
                  onPress={() => playRecording(index)}
                  activeOpacity={0.8}
                >
                  <Ionicons
                    name={isThisPlaying ? "pause-circle" : "play-circle"}
                    size={26}
                    color={Theme.colors.accentGold}
                  />
                  <Text style={styles.recordingLabel}>
                    {isThisPlaying ? `Playing Take ${index + 1}...` : `Take ${index + 1}`}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.deleteBtn}
                  onPress={() => deleteRecording(index)}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  activeOpacity={0.7}
                >
                  <Ionicons name="trash-outline" size={16} color="#EF4444" />
                </TouchableOpacity>
              </View>
            );
          })}
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
  recordBtnDone: {
    backgroundColor: 'rgba(16,185,129,0.15)',
    borderWidth: 1,
    borderColor: Theme.colors.successGreen,
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
    gap: 6,
  },
  savedHeader: {
    color: Theme.colors.textSecondary,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
    marginBottom: 2,
  },
  recordingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(10,22,40,0.6)',
    borderRadius: Theme.borderRadius.sm,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    paddingRight: 10,
  },
  recordingPlayBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 10,
  },
  recordingLabel: {
    color: Theme.colors.accentGold,
    fontSize: 13,
    fontWeight: '600',
  },
  deleteBtn: {
    padding: 6,
  },
});
