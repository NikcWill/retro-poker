import React, { useState, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import { 
  getFirestore, collection, doc, setDoc, getDoc, onSnapshot, deleteDoc, updateDoc, getDocs, query, where
} from 'firebase/firestore';
import { Users, Play, RotateCcw, Plus, Trash2, Home, Columns, ClipboardPaste, Clock, Sun, Moon, Copy, ThumbsUp, ListOrdered, Lightbulb } from 'lucide-react';

// --- Inicialização do Firebase ---
const appId = 'agile-tools-app';
const firebaseConfig = {
  // COLOQUE SUAS CHAVES DO FIREBASE AQUI:
  apiKey: "AIzaSyDP3CaAYD7imjxv80pZK3gnMO6r2KS65YE",
  authDomain: "retro-poker-26b5d.firebaseapp.com",
  projectId: "retro-poker-26b5d",
  storageBucket: "retro-poker-26b5d.firebasestorage.app",
  messagingSenderId: "97492910124",
  appId: "1:97492910124:web:8a6b1d8ffa32175fa15189"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const getPublicCollectionPath = (collectionName) => `artifacts/${appId}/public/data/${collectionName}`;
const getPublicDocRef = (collectionName, documentId) => doc(db, getPublicCollectionPath(collectionName), documentId);
const getPublicCollectionRef = (collectionName) => collection(db, getPublicCollectionPath(collectionName));

const getExpirationDate = () => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

// --- Configurações Fixas ---
const RETRO_COLUMNS = [
  { id: 'wentWell', title: 'O que foi bem', light: 'bg-emerald-50 dark:bg-emerald-900/20', border: 'border-emerald-200 dark:border-emerald-800/50', text: 'text-emerald-700 dark:text-emerald-400' },
  { id: 'toImprove', title: 'O que melhorar', light: 'bg-rose-50 dark:bg-rose-900/20', border: 'border-rose-200 dark:border-rose-800/50', text: 'text-rose-700 dark:text-rose-400' },
  { id: 'actionItems', title: 'Plano de Ação', light: 'bg-blue-50 dark:bg-blue-900/20', border: 'border-blue-200 dark:border-blue-800/50', text: 'text-blue-700 dark:text-blue-400' }
];

// --- Componentes ---
export default function AgileApp() {
  const [user, setUser] = useState(null);
  const [userName, setUserName] = useState('');
  const [roomId, setRoomId] = useState('');
  const [isConductor, setIsConductor] = useState(false);
  const [activeTab, setActiveTab] = useState('poker'); 
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    signInAnonymously(auth).catch(console.error);
    const unsubscribe = onAuthStateChanged(auth, setUser);
    return () => unsubscribe();
  }, []);

  const createRoom = async () => {
    if (!user || !userName.trim()) return;
    const newRoomId = Math.random().toString(36).substring(2, 8).toUpperCase();
    await setDoc(getPublicDocRef('rooms', newRoomId), {
      id: newRoomId, conductor: user.uid, pokerState: 'voting', 
      retroState: 'brainstorm', retroMaxVotes: 2, // Novos campos da Retro
      createdAt: Date.now(), expireAt: getExpirationDate()
    });
    joinRoom(newRoomId, true);
  };

  const joinRoom = async (idToJoin, isCreator = false) => {
    if (!user || !userName.trim() || !idToJoin) return;
    const uppercaseId = idToJoin.toUpperCase();
    const roomSnap = await getDoc(getPublicDocRef('rooms', uppercaseId));

    if (roomSnap.exists()) {
      await setDoc(getPublicDocRef('roomUsers', `${uppercaseId}_${user.uid}`), {
        roomId: uppercaseId, userId: user.uid, name: userName, joinedAt: Date.now(), expireAt: getExpirationDate()
      });
      setRoomId(uppercaseId);
      setIsConductor(roomSnap.data().conductor === user.uid);
    } else if (!isCreator) {
      alert("Sala não encontrada!");
    }
  };

  const leaveRoom = async () => {
    if (!user || !roomId) return;
    await deleteDoc(getPublicDocRef('roomUsers', `${roomId}_${user.uid}`));
    setRoomId('');
  };

  if (!user) return <div className="flex h-screen items-center justify-center bg-slate-50 text-slate-800 font-sans">Conectando...</div>;

  return (
    <div className={isDarkMode ? 'dark' : ''}>
      <div className="min-h-screen bg-slate-100 dark:bg-slate-900 text-slate-800 dark:text-slate-100 font-sans transition-colors duration-200">
        {!roomId ? (
          <HomeState userName={userName} setUserName={setUserName} onCreate={createRoom} onJoin={joinRoom} isDarkMode={isDarkMode} setIsDarkMode={setIsDarkMode} />
        ) : (
          <RoomState roomId={roomId} userId={user.uid} userName={userName} isConductor={isConductor} onLeave={leaveRoom} activeTab={activeTab} setActiveTab={setActiveTab} isDarkMode={isDarkMode} setIsDarkMode={setIsDarkMode} />
        )}
      </div>
    </div>
  );
}

// --- Telas ---
function HomeState({ userName, setUserName, onCreate, onJoin, isDarkMode, setIsDarkMode }) {
  const [joinId, setJoinId] = useState('');

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setJoinId(text);
    } catch (err) {
      console.error("Falha ao colar", err);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 relative">
      <button onClick={() => setIsDarkMode(!isDarkMode)} className="absolute top-6 right-6 p-2 bg-white dark:bg-slate-800 rounded-full shadow-sm text-slate-500 hover:text-indigo-500 transition-colors border border-slate-200 dark:border-slate-700">
        {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
      </button>

      <div className="bg-white dark:bg-slate-800 p-8 rounded-xl shadow-lg max-w-md w-full border border-slate-200 dark:border-slate-700 transition-colors duration-200">
        <div className="flex justify-center mb-6 text-indigo-600 dark:text-indigo-400"><Columns size={48} /></div>
        <h1 className="text-2xl font-bold text-center mb-6 dark:text-white">Planejamento & Retro Ágil</h1>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Seu Nome</label>
            <input type="text" value={userName} onChange={(e) => setUserName(e.target.value)} className="w-full px-4 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none dark:text-white placeholder-slate-400 transition-colors" placeholder="Ex: João Silva" />
          </div>

          <div className="pt-4 border-t border-slate-100 dark:border-slate-700">
            <button onClick={onCreate} disabled={!userName.trim()} className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 dark:disabled:bg-slate-600 text-white font-semibold py-2 px-4 rounded-lg flex justify-center items-center gap-2 transition-colors">
              <Plus size={18} /> Criar Nova Sala
            </button>
          </div>

          <div className="pt-4 border-t border-slate-100 dark:border-slate-700 flex gap-2">
            <input type="text" value={joinId} onChange={(e) => setJoinId(e.target.value)} className="flex-1 px-4 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none uppercase dark:text-white placeholder-slate-400 transition-colors" placeholder="ID DA SALA" />
            <button onClick={handlePaste} className="px-3 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-600 dark:text-slate-300 transition-colors" title="Colar ID copiado">
              <ClipboardPaste size={18} />
            </button>
            <button onClick={() => onJoin(joinId)} disabled={!userName.trim() || !joinId.trim()} className="bg-slate-800 dark:bg-slate-900 hover:bg-slate-900 dark:hover:bg-black disabled:bg-slate-300 dark:disabled:bg-slate-600 text-white font-semibold py-2 px-6 rounded-lg transition-colors">
              Entrar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function RoomState({ roomId, userId, userName, isConductor, onLeave, activeTab, setActiveTab, isDarkMode, setIsDarkMode }) {
  const [room, setRoom] = useState(null);
  const [users, setUsers] = useState([]);
  const [timerInput, setTimerInput] = useState('5');
  const [timeLeft, setTimeLeft] = useState(null);

  useEffect(() => {
    const unsubscribe = onSnapshot(getPublicDocRef('rooms', roomId), (snap) => {
      if (snap.exists()) setRoom(snap.data()); else onLeave();
    });
    return () => unsubscribe();
  }, [roomId]);

  useEffect(() => {
    const unsubscribe = onSnapshot(getPublicCollectionRef('roomUsers'), (snap) => {
      setUsers(snap.docs.map(doc => doc.data()).filter(u => u.roomId === roomId));
    });
    return () => unsubscribe();
  }, [roomId]);

  useEffect(() => {
    if (!room?.timerEnd) { setTimeLeft(null); return; }
    const updateTimer = () => {
      const remaining = Math.max(0, Math.floor((room.timerEnd - Date.now()) / 1000));
      setTimeLeft(remaining);
    };
    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [room?.timerEnd]);

  const startTimer = async () => {
    const minutes = parseInt(timerInput);
    if (isNaN(minutes) || minutes <= 0) return;
    await updateDoc(getPublicDocRef('rooms', roomId), { timerEnd: Date.now() + minutes * 60000 });
  };

  const clearTimer = async () => {
    await updateDoc(getPublicDocRef('rooms', roomId), { timerEnd: null });
  };

  const copyRoomId = async () => {
    try {
      await navigator.clipboard.writeText(roomId);
      alert("ID da sala copiado: " + roomId);
    } catch (err) {
      console.error("Falha ao copiar", err);
    }
  };

  const destroyRoom = async () => {
    if (!window.confirm("Atenção: Tem a certeza que deseja encerrar a reunião e APAGAR todos os dados desta sala permanentemente?")) return;
    
    const collectionsToClear = ['retroCards', 'pokerVotes', 'roomUsers', 'retroVotes'];
    for (const col of collectionsToClear) {
      const q = query(getPublicCollectionRef(col), where('roomId', '==', roomId));
      const snap = await getDocs(q);
      snap.forEach(d => deleteDoc(d.ref));
    }
    await deleteDoc(getPublicDocRef('rooms', roomId));
  };

  if (!room) return <div className="p-8 text-center">Carregando sala...</div>;

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  return (
    <div className="flex flex-col h-screen">
      <header className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 px-6 py-4 flex justify-between items-center shadow-sm gap-4 overflow-x-auto transition-colors duration-200 z-10">
        <div className="flex items-center gap-4 whitespace-nowrap">
          <h1 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
            Sala: 
            <div className="flex items-center gap-1 bg-indigo-50 dark:bg-indigo-900/30 px-2 py-1.5 rounded border border-indigo-100 dark:border-indigo-800/50">
              <span className="text-indigo-600 dark:text-indigo-400 tracking-wider">{roomId}</span>
              <button onClick={copyRoomId} className="text-indigo-400 hover:text-indigo-600 dark:hover:text-indigo-300 transition-colors ml-1" title="Copiar ID da sala">
                <Copy size={16} />
              </button>
            </div>
          </h1>
          {isConductor && <span className="bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-400 border border-amber-200 dark:border-amber-800 text-xs font-semibold px-2 py-1 rounded-full flex items-center gap-1"><Users size={12}/> Condutor</span>}
        </div>
        
        {/* Navegação e Timer */}
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5">
            <Clock size={16} className="text-slate-400 dark:text-slate-500" />
            {isConductor && timeLeft === null ? (
              <div className="flex items-center gap-2">
                <input type="number" value={timerInput} onChange={e => setTimerInput(e.target.value)} className="w-12 text-center border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 dark:text-white rounded text-sm outline-none" min="1" />
                <span className="text-xs text-slate-500 dark:text-slate-400">min</span>
                <button onClick={startTimer} className="text-emerald-600 hover:bg-emerald-50 dark:text-emerald-500 dark:hover:bg-emerald-900/30 rounded p-1"><Play size={14} /></button>
              </div>
            ) : timeLeft !== null ? (
              <div className="flex items-center gap-3">
                <span className={`font-mono font-bold ${timeLeft <= 60 ? 'text-red-500' : 'text-slate-700 dark:text-slate-200'}`}>{formatTime(timeLeft)}</span>
                {isConductor && <button onClick={clearTimer} className="text-slate-400 hover:text-red-500"><Trash2 size={14} /></button>}
              </div>
            ) : (
              <span className="text-sm text-slate-400 dark:text-slate-500">Timer inativo</span>
            )}
          </div>

          <div className="flex bg-slate-100 dark:bg-slate-900 p-1 rounded-lg">
            <button onClick={() => setActiveTab('poker')} className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${activeTab === 'poker' ? 'bg-white dark:bg-slate-700 shadow-sm text-indigo-600 dark:text-indigo-400' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'}`}>Planning Poker</button>
            <button onClick={() => setActiveTab('retro')} className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${activeTab === 'retro' ? 'bg-white dark:bg-slate-700 shadow-sm text-indigo-600 dark:text-indigo-400' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'}`}>Retrospectiva</button>
          </div>
        </div>

        {/* Perfil e Botões */}
        <div className="flex items-center gap-4">
          <button onClick={() => setIsDarkMode(!isDarkMode)} className="p-1.5 text-slate-400 hover:text-indigo-500 transition-colors">
            {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          <span className="text-sm font-medium text-slate-600 dark:text-slate-300 border-l border-slate-200 dark:border-slate-700 pl-4">{userName}</span>
          
          <div className="flex items-center gap-2 border-l border-slate-200 dark:border-slate-700 pl-4">
            {isConductor && (
              <button onClick={destroyRoom} className="flex items-center gap-1 bg-red-50 hover:bg-red-100 dark:bg-red-900/30 dark:hover:bg-red-900/50 text-red-600 dark:text-red-400 px-3 py-1.5 rounded-lg border border-red-200 dark:border-red-800 transition-colors shadow-sm" title="Encerrar e Destruir Sala permanentemente">
                <Trash2 size={16} />
                <span className="text-sm font-semibold hidden sm:block">Encerrar Sala</span>
              </button>
            )}
            <button onClick={onLeave} className="p-1.5 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 transition-colors bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg border border-slate-200 dark:border-slate-600" title="Sair da Sala">
              <Home size={18} />
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-hidden relative">
        {activeTab === 'poker' ? <PokerTab roomId={roomId} userId={userId} room={room} users={users} isConductor={isConductor} /> : <RetroTab roomId={roomId} userId={userId} room={room} isConductor={isConductor} />}
      </main>
    </div>
  );
}

// --- Funções do Poker ---
const POKER_CARDS = ['1', '2', '3', '5', '8', '13', '21', '?', '☕'];

function PokerTab({ roomId, userId, room, users, isConductor }) {
  const [votes, setVotes] = useState([]);
  const [myVote, setMyVote] = useState(null);

  useEffect(() => {
    const unsubscribe = onSnapshot(getPublicCollectionRef('pokerVotes'), (snap) => {
      const roomVotes = snap.docs.map(doc => doc.data()).filter(v => v.roomId === roomId);
      setVotes(roomVotes);
      setMyVote(roomVotes.find(v => v.userId === userId)?.vote || null);
    });
    return () => unsubscribe();
  }, [roomId, userId]);

  const castVote = async (value) => {
    if (room.pokerState === 'revealed') return;
    await setDoc(getPublicDocRef('pokerVotes', `${roomId}_${userId}`), { roomId, userId, vote: value, expireAt: getExpirationDate() });
  };

  const revealVotes = async () => isConductor && updateDoc(getPublicDocRef('rooms', roomId), { pokerState: 'revealed' });

  const resetRound = async () => {
    if (!isConductor) return;
    await updateDoc(getPublicDocRef('rooms', roomId), { pokerState: 'voting' });
    for (const v of votes) await deleteDoc(getPublicDocRef('pokerVotes', `${roomId}_${v.userId}`));
  };

  const isRevealed = room.pokerState === 'revealed';

  return (
    <div className="h-full flex flex-col items-center p-6 bg-slate-50 dark:bg-slate-900 overflow-y-auto transition-colors duration-200">
      <div className="w-full max-w-4xl bg-white dark:bg-slate-800 rounded-2xl p-8 shadow-sm border border-slate-200 dark:border-slate-700 min-h-[300px] mb-8 relative flex flex-wrap justify-center items-center gap-6">
        {isConductor && (
          <div className="absolute top-4 right-4 flex gap-2">
            {!isRevealed ? (
              <button onClick={revealVotes} className="flex items-center gap-1 bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded-lg text-sm font-semibold shadow-sm"><Play size={16}/> Revelar</button>
            ) : (
              <button onClick={resetRound} className="flex items-center gap-1 bg-slate-800 dark:bg-slate-900 hover:bg-slate-900 dark:hover:bg-black text-white px-3 py-1.5 rounded-lg text-sm font-semibold shadow-sm"><RotateCcw size={16}/> Reiniciar</button>
            )}
          </div>
        )}

        {users.map(u => {
          const userVote = votes.find(v => v.userId === u.userId);
          const hasVoted = !!userVote;
          return (
            <div key={u.userId} className="flex flex-col items-center gap-3">
              <div className={`w-16 h-24 rounded-xl border-2 flex items-center justify-center text-xl font-bold transition-all shadow-sm ${!hasVoted ? 'bg-slate-50 dark:bg-slate-800 border-dashed border-slate-300 dark:border-slate-600' : (isRevealed ? 'bg-indigo-50 dark:bg-indigo-900/30 border-indigo-200 dark:border-indigo-800 text-indigo-600 dark:text-indigo-400' : 'bg-indigo-600 border-indigo-600 text-white')}`}>
                {!hasVoted ? '?' : (isRevealed ? userVote.vote : '✓')}
              </div>
              <span className="text-sm font-medium text-slate-600 dark:text-slate-300 truncate max-w-[100px]" title={u.name}>{u.name}</span>
            </div>
          );
        })}
      </div>

      <div className="w-full max-w-4xl">
        <h3 className="text-center text-slate-500 dark:text-slate-400 font-medium mb-4">Escolha sua carta</h3>
        <div className="flex flex-wrap justify-center gap-3">
          {POKER_CARDS.map(card => (
            <button key={card} onClick={() => castVote(card)} disabled={isRevealed}
              className={`w-14 h-20 sm:w-16 sm:h-24 rounded-xl border-2 flex items-center justify-center text-lg sm:text-2xl font-bold transition-all shadow-sm ${myVote === card ? 'bg-indigo-600 border-indigo-600 text-white -translate-y-2' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200 hover:border-slate-400 dark:hover:border-slate-500 hover:-translate-y-1'} ${isRevealed ? 'opacity-50 cursor-not-allowed transform-none' : ''}`}>
              {card}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// --- Funções da Retrospectiva ---
function RetroTab({ roomId, userId, room, isConductor }) {
  const [cards, setCards] = useState([]);
  const [votes, setVotes] = useState([]);
  const [inputs, setInputs] = useState({ wentWell: '', toImprove: '', actionItems: '' });

  // Monitora Cartões
  useEffect(() => {
    const unsubscribe = onSnapshot(getPublicCollectionRef('retroCards'), (snap) => {
      setCards(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })).filter(c => c.roomId === roomId));
    });
    return () => unsubscribe();
  }, [roomId]);

  // Monitora Votos da Retro
  useEffect(() => {
    const unsubscribe = onSnapshot(getPublicCollectionRef('retroVotes'), (snap) => {
      setVotes(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })).filter(v => v.roomId === roomId));
    });
    return () => unsubscribe();
  }, [roomId]);

  const retroState = room?.retroState || 'brainstorm';
  const maxVotes = room?.retroMaxVotes || 2;
  const myVotesCount = votes.filter(v => v.userId === userId).length;
  const votesRemaining = maxVotes - myVotesCount;

  // --- Ações do Condutor ---
  const changePhase = async (newPhase) => {
    if (!isConductor) return;
    await updateDoc(getPublicDocRef('rooms', roomId), { retroState: newPhase });
  };

  const changeMaxVotes = async (val) => {
    if (!isConductor) return;
    const newMax = Math.max(1, parseInt(val) || 1);
    await updateDoc(getPublicDocRef('rooms', roomId), { retroMaxVotes: newMax });
  };

  // --- Ações dos Usuários ---
  const addCard = async (columnId) => {
    if (retroState !== 'brainstorm') return;
    const text = inputs[columnId]?.trim();
    if (!text) return;
    const newCardId = `${Date.now()}_${userId}`;
    await setDoc(getPublicDocRef('retroCards', newCardId), {
      roomId, column: columnId, text, authorId: userId, createdAt: Date.now(), expireAt: getExpirationDate()
    });
    setInputs(prev => ({ ...prev, [columnId]: '' }));
  };

  const deleteCard = async (cardId) => {
    if (retroState !== 'brainstorm') return;
    await deleteDoc(getPublicDocRef('retroCards', cardId));
  };

  const handleDrop = async (e, targetCardId, columnId) => {
    e.preventDefault();
    if (retroState !== 'brainstorm') return;
    const sourceId = e.dataTransfer.getData('cardId');
    if (sourceId === targetCardId) return;

    const sourceCard = cards.find(c => c.id === sourceId);
    const targetCard = cards.find(c => c.id === targetCardId);
    
    if (sourceCard && targetCard && sourceCard.column === columnId) {
      const newText = `${targetCard.text}\n\n--- Agrupado ---\n${sourceCard.text}`;
      await updateDoc(getPublicDocRef('retroCards', targetCardId), { text: newText });
      await deleteDoc(getPublicDocRef('retroCards', sourceId));
    }
  };

  const toggleVote = async (cardId) => {
    if (retroState !== 'voting') return;
    const voteId = `${roomId}_${userId}_${cardId}`;
    const hasVoted = votes.find(v => v.id === voteId);

    if (hasVoted) {
      await deleteDoc(getPublicDocRef('retroVotes', voteId));
    } else {
      if (votesRemaining > 0) {
        await setDoc(getPublicDocRef('retroVotes', voteId), {
          roomId, userId, cardId, expireAt: getExpirationDate()
        });
      }
    }
  };

  const getCardVotesCount = (cardId) => votes.filter(v => v.cardId === cardId).length;

  return (
    <div className="h-full flex flex-col bg-slate-50 dark:bg-slate-900 transition-colors duration-200">
      
      {/* Controle da Retro (Topo) */}
      <div className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 p-4 flex justify-between items-center z-0">
        <div className="flex items-center gap-4">
          <span className="font-semibold text-slate-700 dark:text-slate-200 text-sm">Fase da Retro:</span>
          
          {/* Seletor de Fases */}
          <div className="flex bg-slate-100 dark:bg-slate-900 p-1 rounded-lg">
            <button onClick={() => changePhase('brainstorm')} disabled={!isConductor} className={`flex items-center gap-1 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${retroState === 'brainstorm' ? 'bg-white dark:bg-slate-700 shadow-sm text-indigo-600 dark:text-indigo-400' : 'text-slate-500 dark:text-slate-400'}`}>
              <Lightbulb size={16} /> 1. Ideação
            </button>
            <button onClick={() => changePhase('voting')} disabled={!isConductor} className={`flex items-center gap-1 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${retroState === 'voting' ? 'bg-white dark:bg-slate-700 shadow-sm text-indigo-600 dark:text-indigo-400' : 'text-slate-500 dark:text-slate-400'}`}>
              <ThumbsUp size={16} /> 2. Votação
            </button>
            <button onClick={() => changePhase('results')} disabled={!isConductor} className={`flex items-center gap-1 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${retroState === 'results' ? 'bg-white dark:bg-slate-700 shadow-sm text-indigo-600 dark:text-indigo-400' : 'text-slate-500 dark:text-slate-400'}`}>
              <ListOrdered size={16} /> 3. Resultados
            </button>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* Configuração de Votos */}
          {retroState === 'brainstorm' && isConductor ? (
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-slate-600 dark:text-slate-400">Votos por pessoa:</label>
              <input type="number" min="1" value={maxVotes} onChange={(e) => changeMaxVotes(e.target.value)} className="w-16 px-2 py-1 text-center border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 dark:text-white rounded-md text-sm outline-none" />
            </div>
          ) : (
            <div className="text-sm font-medium text-slate-600 dark:text-slate-400">
              Limite de votos: <span className="text-indigo-600 dark:text-indigo-400 font-bold">{maxVotes}</span>
            </div>
          )}

          {/* Contador de Votos Restantes (Só aparece na fase de Votação) */}
          {retroState === 'voting' && (
            <div className={`px-3 py-1.5 rounded-lg text-sm font-semibold border ${votesRemaining === 0 ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800' : 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800'}`}>
              Meus Votos: {votesRemaining} restantes
            </div>
          )}
        </div>
      </div>

      {/* Colunas */}
      <div className="flex-1 p-6 overflow-x-auto">
        <div className="flex gap-6 min-w-[900px] h-full">
          {RETRO_COLUMNS.map(col => {
            // Se estiver nos Resultados, ordena os cartões por votos. Se não, ordem normal cronológica.
            const colCards = cards.filter(c => c.column === col.id);
            if (retroState === 'results') {
              colCards.sort((a, b) => getCardVotesCount(b.id) - getCardVotesCount(a.id));
            }

            return (
              <div key={col.id} className={`flex-1 flex flex-col rounded-xl border ${col.border} ${col.light} overflow-hidden shadow-sm`}>
                <div className={`p-4 border-b ${col.border} font-semibold flex justify-between items-center ${col.text} bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm`}>
                  {col.title}
                  <span className="text-xs bg-white dark:bg-slate-800 px-2 py-1 rounded-full border opacity-80">{colCards.length}</span>
                </div>
                
                <div className="flex-1 p-4 overflow-y-auto space-y-3" onDragOver={(e) => e.preventDefault()}>
                  {colCards.map(card => {
                    const cardVotesCount = getCardVotesCount(card.id);
                    const myVoteOnCard = votes.find(v => v.userId === userId && v.cardId === card.id);

                    return (
                      <div key={card.id} 
                        draggable={retroState === 'brainstorm'} 
                        onDragStart={(e) => e.dataTransfer.setData('cardId', card.id)}
                        onDrop={(e) => handleDrop(e, card.id, col.id)}
                        className={`bg-white dark:bg-slate-800 p-3 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 relative transition-colors ${retroState === 'brainstorm' ? 'cursor-move hover:border-slate-400 dark:hover:border-slate-500' : ''}`}
                        title={retroState === 'brainstorm' ? "Arraste para cima de outro cartão para agrupar" : ""}
                      >
                        <p className="text-slate-800 dark:text-slate-200 whitespace-pre-wrap text-sm">{card.text}</p>
                        
                        <div className="flex justify-between items-end mt-3">
                          <div className="text-xs text-slate-400 dark:text-slate-500 italic">Anônimo</div>

                          {/* Sistema de Votos visível apenas nas fases corretas */}
                          {retroState === 'voting' && (
                            <button 
                              onClick={() => toggleVote(card.id)}
                              disabled={!myVoteOnCard && votesRemaining <= 0}
                              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-sm font-medium transition-colors border ${myVoteOnCard ? 'bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-400 border-indigo-200 dark:border-indigo-700' : 'bg-slate-50 dark:bg-slate-700 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-600'} disabled:opacity-50 disabled:cursor-not-allowed`}
                            >
                              <ThumbsUp size={14} className={myVoteOnCard ? 'fill-current' : ''} />
                              {cardVotesCount > 0 ? cardVotesCount : 'Votar'}
                            </button>
                          )}

                          {retroState === 'results' && cardVotesCount > 0 && (
                            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-sm font-bold bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-800/50">
                              <ThumbsUp size={14} className="fill-current" /> {cardVotesCount}
                            </span>
                          )}
                        </div>
                        
                        {(retroState === 'brainstorm' && card.authorId === userId) && (
                          <button onClick={() => deleteCard(card.id)} className="absolute top-2 right-2 p-1 text-slate-300 dark:text-slate-600 hover:text-red-500 dark:hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    )
                  })}
                </div>

                {/* Área de Criar Cartões (Bloqueada fora do Brainstorm) */}
                <div className={`p-4 border-t transition-colors ${retroState === 'brainstorm' ? 'bg-white/50 dark:bg-slate-800/50 border-slate-100 dark:border-slate-700' : 'bg-slate-100/50 dark:bg-slate-900/30 border-transparent'} mt-auto`}>
                  {retroState === 'brainstorm' ? (
                    <div className="flex gap-2">
                      <input type="text" value={inputs[col.id] || ''} onChange={(e) => setInputs(prev => ({ ...prev, [col.id]: e.target.value }))} onKeyDown={(e) => e.key === 'Enter' && addCard(col.id)} placeholder={`Adicionar em ${col.title}...`} className="flex-1 px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 dark:text-white rounded-lg outline-none focus:ring-2 focus:ring-indigo-500" />
                      <button onClick={() => addCard(col.id)} disabled={!inputs[col.id]?.trim()} className="bg-slate-800 dark:bg-slate-900 text-white p-2 rounded-lg disabled:bg-slate-300 dark:disabled:bg-slate-600 hover:bg-slate-900 dark:hover:bg-black transition-colors"><Plus size={18} /></button>
                    </div>
                  ) : (
                    <div className="text-center text-sm font-medium text-slate-400 dark:text-slate-500">
                      Criação de cartões bloqueada
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  );
}