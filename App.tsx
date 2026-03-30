import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
} from 'react-native';
import { SafeAreaView, SafeAreaProvider } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface Domino {
  id: number;
  left: number;
  right: number;
  isDouble: boolean;
}

interface PlacedDomino extends Domino {
  rotation: number;
  position: 'left' | 'right' | 'center';
}

const generateAllDominoes = (): Domino[] => {
  const dominoes: Domino[] = [];
  let id = 0;
  for (let i = 0; i <= 6; i++) {
    for (let j = i; j <= 6; j++) {
      dominoes.push({ id: id++, left: i, right: j, isDouble: i === j });
    }
  }
  return dominoes;
};

const shuffleDominoes = (dominoes: Domino[]): Domino[] => {
  const shuffled = [...dominoes];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

const DominoTile: React.FC<{
  domino: Domino;
  onPress?: () => void;
  isSelected?: boolean;
  rotation?: number;
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
}> = ({ domino, onPress, isSelected, rotation = 0, size = 'medium', disabled }) => {
  const sizes = {
    small: { width: 30, height: 60, dotSize: 4, gap: 2 },
    medium: { width: 45, height: 90, dotSize: 6, gap: 3 },
    large: { width: 60, height: 120, dotSize: 8, gap: 4 },
  };

  const s = sizes[size];
  const isHorizontal = rotation === 90 || rotation === 270;

  const renderDots = (value: number, containerSize: number) => {
    const dotPositions: { [key: number]: { x: number; y: number }[] } = {
      0: [],
      1: [{ x: 0.5, y: 0.5 }],
      2: [{ x: 0.25, y: 0.25 }, { x: 0.75, y: 0.75 }],
      3: [{ x: 0.25, y: 0.25 }, { x: 0.5, y: 0.5 }, { x: 0.75, y: 0.75 }],
      4: [{ x: 0.25, y: 0.25 }, { x: 0.75, y: 0.25 }, { x: 0.25, y: 0.75 }, { x: 0.75, y: 0.75 }],
      5: [{ x: 0.25, y: 0.25 }, { x: 0.75, y: 0.25 }, { x: 0.5, y: 0.5 }, { x: 0.25, y: 0.75 }, { x: 0.75, y: 0.75 }],
      6: [{ x: 0.25, y: 0.2 }, { x: 0.75, y: 0.2 }, { x: 0.25, y: 0.5 }, { x: 0.75, y: 0.5 }, { x: 0.25, y: 0.8 }, { x: 0.75, y: 0.8 }],
    };

    return dotPositions[value].map((pos, idx) => (
      <View
        key={idx}
        style={[
          styles.dot,
          {
            width: s.dotSize,
            height: s.dotSize,
            borderRadius: s.dotSize / 2,
            left: pos.x * containerSize - s.dotSize / 2,
            top: pos.y * containerSize - s.dotSize / 2,
          },
        ]}
      />
    ));
  };

  const halfSize = isHorizontal ? s.height / 2 : s.width;

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || !onPress}
      activeOpacity={0.7}
      style={[
        styles.dominoContainer,
        {
          width: isHorizontal ? s.height : s.width,
          height: isHorizontal ? s.width : s.height,
          transform: [{ rotate: `${rotation}deg` }],
        },
        isSelected && styles.dominoSelected,
      ]}
    >
      <View style={[styles.dominoTile, { width: '100%', height: '100%' }]}>
        <View style={[styles.dominoHalf, { width: halfSize, height: halfSize }]}>
          {renderDots(domino.left, halfSize)}
        </View>
        <View
          style={[
            styles.dominoDivider,
            isHorizontal ? { width: 2, height: '80%' } : { height: 2, width: '80%' },
          ]}
        />
        <View style={[styles.dominoHalf, { width: halfSize, height: halfSize }]}>
          {renderDots(domino.right, halfSize)}
        </View>
      </View>
    </TouchableOpacity>
  );
};

export default function DominoGame() {
  const [gameStarted, setGameStarted] = useState(false);
  const [playerHand, setPlayerHand] = useState<Domino[]>([]);
  const [computerHand, setComputerHand] = useState<Domino[]>([]);
  const [boneyard, setBoneyard] = useState<Domino[]>([]);
  const [board, setBoard] = useState<PlacedDomino[]>([]);
  const [selectedDomino, setSelectedDomino] = useState<Domino | null>(null);
  const [leftEnd, setLeftEnd] = useState<number | null>(null);
  const [rightEnd, setRightEnd] = useState<number | null>(null);
  const [currentPlayer, setCurrentPlayer] = useState<'player' | 'computer'>('player');
  const [message, setMessage] = useState('');

  const startGame = useCallback(() => {
    const allDominoes = shuffleDominoes(generateAllDominoes());
    const playerCards = allDominoes.slice(0, 7);
    const computerCards = allDominoes.slice(7, 14);
    const remaining = allDominoes.slice(14);
    setPlayerHand(playerCards);
    setComputerHand(computerCards);
    setBoneyard(remaining);
    setBoard([]);
    setSelectedDomino(null);
    setLeftEnd(null);
    setRightEnd(null);
    setCurrentPlayer('player');
    setGameStarted(true);
    setMessage("Votre tour ! Sélectionnez un domino.");
  }, []);

  const canPlay = (domino: Domino): { canPlayLeft: boolean; canPlayRight: boolean } => {
    if (board.length === 0) return { canPlayLeft: true, canPlayRight: true };
    const canPlayLeft = domino.left === leftEnd || domino.right === leftEnd;
    const canPlayRight = domino.left === rightEnd || domino.right === rightEnd;
    return { canPlayLeft, canPlayRight };
  };

  const canPlayerPlay = (hand: Domino[]): boolean => {
    return hand.some(d => {
      const { canPlayLeft, canPlayRight } = canPlay(d);
      return canPlayLeft || canPlayRight;
    });
  };

  const placeDomino = (domino: Domino, side: 'left' | 'right') => {
    if (board.length === 0) {
      const placed: PlacedDomino = {
        ...domino,
        rotation: domino.isDouble ? 90 : 0,
        position: 'center',
      };
      setBoard([placed]);
      setLeftEnd(domino.left);
      setRightEnd(domino.right);
    } else {
      let placed: PlacedDomino;
      if (side === 'left') {
        let newDomino = { ...domino };
        if (domino.right !== leftEnd && domino.left === leftEnd) {
          newDomino = { ...domino, left: domino.right, right: domino.left };
        }
        placed = { ...newDomino, rotation: newDomino.isDouble ? 90 : 0, position: 'left' };
        setLeftEnd(newDomino.left === leftEnd ? newDomino.right : newDomino.left);
        setBoard(prev => [placed, ...prev]);
      } else {
        let newDomino = { ...domino };
        if (domino.left !== rightEnd && domino.right === rightEnd) {
          newDomino = { ...domino, left: domino.right, right: domino.left };
        }
        placed = { ...newDomino, rotation: newDomino.isDouble ? 90 : 0, position: 'right' };
        setRightEnd(newDomino.right === rightEnd ? newDomino.left : newDomino.right);
        setBoard(prev => [...prev, placed]);
      }
    }
  };

  const playDomino = (side: 'left' | 'right') => {
    if (!selectedDomino || currentPlayer !== 'player') return;
    const { canPlayLeft, canPlayRight } = canPlay(selectedDomino);
    if (side === 'left' && !canPlayLeft) {
      setMessage("Impossible de jouer ce domino à gauche !");
      return;
    }
    if (side === 'right' && !canPlayRight) {
      setMessage("Impossible de jouer ce domino à droite !");
      return;
    }
    placeDomino(selectedDomino, side);
    setPlayerHand(prev => prev.filter(d => d.id !== selectedDomino.id));
    setSelectedDomino(null);
    if (playerHand.length === 1) {
      setMessage("Félicitations ! Vous avez gagné !");
      setGameStarted(false);
      return;
    }
    setCurrentPlayer('computer');
    setMessage("Tour de l'ordinateur...");
    setTimeout(() => computerPlay(), 1000);
  };

  const computerPlay = () => {
    const playableDominoes = computerHand.filter(d => {
      const { canPlayLeft, canPlayRight } = canPlay(d);
      return canPlayLeft || canPlayRight;
    });
    if (playableDominoes.length === 0) {
      if (boneyard.length > 0) {
        const drawn = boneyard[0];
        setComputerHand(prev => [...prev, drawn]);
        setBoneyard(prev => prev.slice(1));
        setMessage("L'ordinateur pioche...");
        setTimeout(() => {
          setCurrentPlayer('player');
          setMessage("Votre tour !");
        }, 500);
      } else {
        setCurrentPlayer('player');
        setMessage("L'ordinateur passe. Votre tour !");
      }
      return;
    }
    const bestDomino = playableDominoes.reduce((best, current) => {
      const currentSum = current.left + current.right;
      const bestSum = best.left + best.right;
      return currentSum > bestSum ? current : best;
    });
    const { canPlayLeft, canPlayRight } = canPlay(bestDomino);
    const side = canPlayLeft ? 'left' : 'right';
    placeDomino(bestDomino, side);
    setComputerHand(prev => prev.filter(d => d.id !== bestDomino.id));
    if (computerHand.length === 1) {
      setMessage("L'ordinateur a gagné !");
      setGameStarted(false);
      return;
    }
    setCurrentPlayer('player');
    const newPlayerHand = playerHand;
    if (!canPlayerPlay(newPlayerHand)) {
      if (boneyard.length > 0) {
        setMessage("Vous ne pouvez pas jouer. Piochez !");
      } else {
        setMessage("Personne ne peut jouer. Match nul !");
        setGameStarted(false);
      }
    } else {
      setMessage("Votre tour !");
    }
  };

  const drawDomino = () => {
    if (boneyard.length === 0) {
      setMessage("La pioche est vide !");
      return;
    }
    if (canPlayerPlay(playerHand)) {
      setMessage("Vous pouvez jouer ! Pas besoin de piocher.");
      return;
    }
    const drawn = boneyard[0];
    setPlayerHand(prev => [...prev, drawn]);
    setBoneyard(prev => prev.slice(1));
    setMessage("Vous avez pioché un domino.");
  };

  const selectDomino = (domino: Domino) => {
    if (currentPlayer !== 'player') return;
    const { canPlayLeft, canPlayRight } = canPlay(domino);
    if (!canPlayLeft && !canPlayRight && board.length > 0) {
      setMessage("Ce domino ne peut pas être joué !");
      return;
    }
    setSelectedDomino(domino.id === selectedDomino?.id ? null : domino);
  };

  if (!gameStarted) {
    return (
      <SafeAreaProvider>
        <SafeAreaView style={styles.container}>
          <View style={styles.startScreen}>
            <Text style={styles.title}>Domino</Text>
            <View style={styles.logoContainer}>
              <DominoTile domino={{ id: -1, left: 6, right: 6, isDouble: true }} size="large" />
            </View>
            <TouchableOpacity style={styles.startButton} onPress={startGame}>
              <Ionicons name="play" size={24} color="#fff" />
              <Text style={styles.startButtonText}>Nouvelle Partie</Text>
            </TouchableOpacity>
            {message !== '' && <Text style={styles.endMessage}>{message}</Text>}
          </View>
        </SafeAreaView>
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <View style={styles.scoreContainer}>
            <Ionicons name="desktop-outline" size={20} color="#666" />
            <Text style={styles.scoreText}>{computerHand.length}</Text>
          </View>
          <Text style={styles.headerTitle}>Domino</Text>
          <View style={styles.scoreContainer}>
            <Ionicons name="layers-outline" size={20} color="#666" />
            <Text style={styles.scoreText}>{boneyard.length}</Text>
          </View>
        </View>

        <View style={styles.messageContainer}>
          <Text style={styles.messageText}>{message}</Text>
        </View>

        <View style={styles.boardContainer}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.boardScroll}
          >
            {board.length === 0 ? (
              <View style={styles.emptyBoard}>
                <Text style={styles.emptyBoardText}>Jouez votre premier domino</Text>
                {selectedDomino && (
                  <TouchableOpacity
                    style={[styles.playIndicator, { marginTop: 15 }]}
                    onPress={() => playDomino('left')}
                  >
                    <Ionicons name="add-circle" size={50} color="#4CAF50" />
                  </TouchableOpacity>
                )}
              </View>
            ) : (
              <View style={styles.boardRow}>
                {selectedDomino && canPlay(selectedDomino).canPlayLeft && (
                  <TouchableOpacity style={styles.playIndicator} onPress={() => playDomino('left')}>
                    <Ionicons name="add-circle" size={40} color="#4CAF50" />
                  </TouchableOpacity>
                )}
                {board.map(domino => (
                  <View key={domino.id} style={styles.placedDomino}>
                    <DominoTile domino={domino} size="small" rotation={domino.isDouble ? 90 : 0} />
                  </View>
                ))}
                {selectedDomino && canPlay(selectedDomino).canPlayRight && (
                  <TouchableOpacity style={styles.playIndicator} onPress={() => playDomino('right')}>
                    <Ionicons name="add-circle" size={40} color="#4CAF50" />
                  </TouchableOpacity>
                )}
              </View>
            )}
          </ScrollView>
          {board.length > 0 && (
            <View style={styles.endsIndicator}>
              <Text style={styles.endText}>Gauche: {leftEnd}</Text>
              <Text style={styles.endText}>Droite: {rightEnd}</Text>
            </View>
          )}
        </View>

        <View style={styles.handContainer}>
          <Text style={styles.handTitle}>Vos dominos ({playerHand.length})</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.handScroll}
          >
            {playerHand.map(domino => {
              const { canPlayLeft, canPlayRight } = canPlay(domino);
              const isPlayable = board.length === 0 || canPlayLeft || canPlayRight;
              return (
                <View key={domino.id} style={styles.handDomino}>
                  <DominoTile
                    domino={domino}
                    size="medium"
                    isSelected={selectedDomino?.id === domino.id}
                    onPress={() => selectDomino(domino)}
                    disabled={currentPlayer !== 'player'}
                  />
                  {!isPlayable && (
                    <View style={styles.unplayableOverlay}>
                      <Ionicons name="close-circle" size={20} color="#f44336" />
                    </View>
                  )}
                </View>
              );
            })}
          </ScrollView>
        </View>

        <View style={styles.actionsContainer}>
          <TouchableOpacity
            style={[styles.actionButton, styles.drawButton]}
            onPress={drawDomino}
            disabled={currentPlayer !== 'player' || boneyard.length === 0}
          >
            <Ionicons name="add" size={24} color="#fff" />
            <Text style={styles.actionButtonText}>Piocher</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, styles.resetButton]}
            onPress={() => { setGameStarted(false); setMessage(''); }}
          >
            <Ionicons name="refresh" size={24} color="#fff" />
            <Text style={styles.actionButtonText}>Recommencer</Text>
          </TouchableOpacity>
        </View>

        {selectedDomino && board.length > 0 && (
          <View style={styles.instructionContainer}>
            <Text style={styles.instructionText}>Appuyez sur + pour placer le domino</Text>
          </View>
        )}
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1a472a' },
  startScreen: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  title: {
    fontSize: 48, fontWeight: 'bold', color: '#fff', marginBottom: 30,
    textShadowColor: 'rgba(0,0,0,0.3)', textShadowOffset: { width: 2, height: 2 }, textShadowRadius: 5,
  },
  logoContainer: { marginBottom: 40 },
  startButton: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#4CAF50',
    paddingVertical: 15, paddingHorizontal: 30, borderRadius: 25, gap: 10,
  },
  startButtonText: { color: '#fff', fontSize: 20, fontWeight: '600' },
  endMessage: { marginTop: 20, fontSize: 18, color: '#FFD700', fontWeight: '600' },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: 15, backgroundColor: 'rgba(0,0,0,0.2)',
  },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#fff' },
  scoreContainer: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.9)',
    paddingVertical: 5, paddingHorizontal: 12, borderRadius: 15, gap: 5,
  },
  scoreText: { fontSize: 16, fontWeight: '600', color: '#333' },
  messageContainer: { padding: 10, alignItems: 'center' },
  messageText: { fontSize: 16, color: '#FFD700', fontWeight: '500' },
  boardContainer: {
    flex: 1, justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.1)',
    marginHorizontal: 10, borderRadius: 15, padding: 10,
  },
  boardScroll: { flexGrow: 1, justifyContent: 'center', alignItems: 'center' },
  boardRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20 },
  emptyBoard: {
    padding: 40, borderWidth: 2, borderColor: 'rgba(255,255,255,0.3)',
    borderStyle: 'dashed', borderRadius: 10, alignItems: 'center',
  },
  emptyBoardText: { color: 'rgba(255,255,255,0.6)', fontSize: 16 },
  placedDomino: { marginHorizontal: 2 },
  playIndicator: { padding: 5 },
  endsIndicator: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 15, paddingHorizontal: 20 },
  endText: {
    color: '#fff', fontSize: 14, backgroundColor: 'rgba(0,0,0,0.3)',
    paddingVertical: 5, paddingHorizontal: 10, borderRadius: 10,
  },
  handContainer: { backgroundColor: 'rgba(0,0,0,0.3)', paddingVertical: 15, paddingHorizontal: 10 },
  handTitle: { color: '#fff', fontSize: 14, marginBottom: 10, marginLeft: 10 },
  handScroll: { paddingHorizontal: 10 },
  handDomino: { marginHorizontal: 5, position: 'relative' },
  unplayableOverlay: {
    position: 'absolute', top: -5, right: -5,
    backgroundColor: 'rgba(255,255,255,0.9)', borderRadius: 10,
  },
  actionsContainer: { flexDirection: 'row', justifyContent: 'center', gap: 20, padding: 15 },
  actionButton: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 12, paddingHorizontal: 20, borderRadius: 20, gap: 8,
  },
  drawButton: { backgroundColor: '#2196F3' },
  resetButton: { backgroundColor: '#f44336' },
  actionButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  instructionContainer: { padding: 10, alignItems: 'center', backgroundColor: 'rgba(76, 175, 80, 0.3)' },
  instructionText: { color: '#fff', fontSize: 14 },
  dominoContainer: { borderRadius: 8, overflow: 'hidden' },
  dominoSelected: {
    shadowColor: '#FFD700', shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1, shadowRadius: 10, elevation: 10,
    transform: [{ scale: 1.05 }],
  },
  dominoTile: {
    backgroundColor: '#f5f5dc', borderRadius: 8, borderWidth: 2, borderColor: '#333',
    flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
  },
  dominoHalf: { position: 'relative' },
  dominoDivider: { backgroundColor: '#333' },
  dot: { position: 'absolute', backgroundColor: '#1a1a1a' },
});
