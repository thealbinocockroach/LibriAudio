import React, { useEffect, useMemo, useState } from 'react';
import { SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { AudioModule, useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';

const books = [
  { id: '47', title: 'The Adventures of Sherlock Holmes', author: 'Arthur Conan Doyle', duration: '10h 52m', audio: 'https://www.archive.org/download/adventures_sherlock_holmes_1012_librivox/adventuresholmes_01_doyle_64kb.mp3' },
  { id: '12', title: 'Pride and Prejudice', author: 'Jane Austen', duration: '10h 24m', audio: 'https://www.archive.org/download/pride_and_prejudice_librivox/prideandprejudice_01_austen_64kb.mp3' },
  { id: '52', title: 'Frankenstein', author: 'Mary Shelley', duration: '8h', audio: 'https://www.archive.org/download/frankenstein_shelley_librivox/frankenstein_01_shelley_64kb.mp3' },
  { id: '19', title: 'The Time Machine', author: 'H. G. Wells', duration: '3h 40m', audio: 'https://www.archive.org/download/the_time_machine_librivox/timemachine_01_wells_64kb.mp3' },
];

export default function App() {
  const [selected, setSelected] = useState(books[0]);
  const [tab, setTab] = useState<'Explore' | 'Library'>('Explore');
  const player = useAudioPlayer(selected.audio, { updateInterval: 500 });
  const status = useAudioPlayerStatus(player);

  useEffect(() => {
    AudioModule.requestRecordingPermissionsAsync().catch(() => {});
  }, []);

  useEffect(() => {
    player.replace(selected.audio);
  }, [selected.id]);

  const progress = useMemo(() => status.duration ? status.currentTime / status.duration : 0, [status.currentTime, status.duration]);

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}><Text style={styles.logo}>LibriAudio</Text><Text style={styles.tag}>FREE CLASSICS</Text></View>
      {tab === 'Explore' ? (
        <ScrollView contentContainerStyle={styles.content}>
          <Text style={styles.kicker}>LISTEN & READ</Text>
          <Text style={styles.hero}>Stories worth{`\n`}remembering.</Text>
          <Text style={styles.sub}>Public-domain audiobooks, built for distraction-free listening.</Text>
          <Text style={styles.section}>Featured classics</Text>
          {books.map(book => (
            <TouchableOpacity key={book.id} style={[styles.card, selected.id === book.id && styles.activeCard]} onPress={() => setSelected(book)}>
              <View style={styles.cover}><Text style={styles.coverText}>{book.title.slice(0, 1)}</Text></View>
              <View style={styles.cardBody}><Text style={styles.title}>{book.title}</Text><Text style={styles.author}>{book.author}</Text><Text style={styles.meta}>{book.duration} · LibriVox</Text></View>
              <TouchableOpacity style={styles.playSmall} onPress={() => { setSelected(book); player.play(); }}><Text style={styles.playText}>▶</Text></TouchableOpacity>
            </TouchableOpacity>
          ))}
        </ScrollView>
      ) : (
        <ScrollView contentContainerStyle={styles.content}><Text style={styles.kicker}>YOUR LIBRARY</Text><Text style={styles.hero}>Keep listening.</Text><Text style={styles.sub}>Your saved classics will live here.</Text></ScrollView>
      )}

      <View style={styles.nowPlaying}>
        <View style={styles.npTop}><View><Text style={styles.npTitle} numberOfLines={1}>{selected.title}</Text><Text style={styles.npAuthor}>{selected.author}</Text></View><TouchableOpacity onPress={() => status.playing ? player.pause() : player.play()}><Text style={styles.bigPlay}>{status.playing ? '❚❚' : '▶'}</Text></TouchableOpacity></View>
        <View style={styles.track}><View style={[styles.fill, { width: `${Math.min(100, Math.max(0, progress * 100))}%` }]} /></View>
        <View style={styles.controls}><TouchableOpacity onPress={() => player.seekTo(Math.max(0, status.currentTime - 15))}><Text style={styles.control}>↶15</Text></TouchableOpacity><Text style={styles.time}>{Math.floor(status.currentTime / 60)}:{String(Math.floor(status.currentTime % 60)).padStart(2, '0')}</Text><TouchableOpacity onPress={() => player.seekTo(status.currentTime + 30)}><Text style={styles.control}>30↷</Text></TouchableOpacity></View>
      </View>
      <View style={styles.nav}><TouchableOpacity onPress={() => setTab('Explore')}><Text style={[styles.navText, tab === 'Explore' && styles.navActive]}>Explore</Text></TouchableOpacity><TouchableOpacity onPress={() => setTab('Library')}><Text style={[styles.navText, tab === 'Library' && styles.navActive]}>Library</Text></TouchableOpacity></View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#0c0c0c' }, header: { paddingHorizontal: 22, paddingTop: 18, paddingBottom: 10, flexDirection: 'row', alignItems: 'baseline', gap: 10 }, logo: { color: '#f3efe5', fontSize: 25, fontWeight: '800' }, tag: { color: '#8c887d', fontSize: 9, letterSpacing: 1.5 }, content: { padding: 22, paddingBottom: 240 }, kicker: { color: '#b7a77a', fontSize: 11, letterSpacing: 2, fontWeight: '700', marginTop: 20 }, hero: { color: '#f3efe5', fontSize: 42, lineHeight: 45, fontWeight: '800', marginTop: 8 }, sub: { color: '#aaa59a', fontSize: 15, lineHeight: 22, marginTop: 12, marginBottom: 28 }, section: { color: '#eee9df', fontSize: 20, fontWeight: '700', marginBottom: 14 }, card: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#151515', borderRadius: 16, padding: 12, marginBottom: 12 }, activeCard: { borderWidth: 1, borderColor: '#b7a77a' }, cover: { width: 62, height: 82, borderRadius: 9, backgroundColor: '#29261f', alignItems: 'center', justifyContent: 'center' }, coverText: { color: '#b7a77a', fontSize: 32, fontWeight: '800' }, cardBody: { flex: 1, paddingHorizontal: 13 }, title: { color: '#f2eee6', fontSize: 15, fontWeight: '700' }, author: { color: '#aaa59a', marginTop: 5, fontSize: 13 }, meta: { color: '#706d65', marginTop: 7, fontSize: 11 }, playSmall: { width: 42, height: 42, borderRadius: 21, backgroundColor: '#b7a77a', alignItems: 'center', justifyContent: 'center' }, playText: { color: '#101010', fontSize: 16 }, nowPlaying: { position: 'absolute', left: 12, right: 12, bottom: 65, backgroundColor: '#191919', borderRadius: 18, padding: 16 }, npTop: { flexDirection: 'row', alignItems: 'center' }, npTitle: { color: '#f3efe5', fontSize: 15, fontWeight: '700', maxWidth: 280 }, npAuthor: { color: '#8f8b82', fontSize: 12, marginTop: 4 }, bigPlay: { color: '#b7a77a', fontSize: 22, marginLeft: 12 }, track: { height: 3, backgroundColor: '#35332f', marginTop: 14, overflow: 'hidden' }, fill: { height: 3, backgroundColor: '#b7a77a' }, controls: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 9 }, control: { color: '#d6d0c5', fontSize: 13 }, time: { color: '#77736a', fontSize: 11 }, nav: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 65, backgroundColor: '#101010', flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center' }, navText: { color: '#6f6b63', fontSize: 13, fontWeight: '600' }, navActive: { color: '#b7a77a' }
});
