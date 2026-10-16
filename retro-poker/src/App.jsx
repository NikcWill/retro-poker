import React, { useState, useEffect, useMemo } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged } from 'firebase/auth';
import { 
  getFirestore, 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  onSnapshot, 
  deleteDoc,
  updateDoc
} from 'firebase/firestore';
import { Users, Play, RotateCcw, Plus, Trash2, Home, Columns } from 'lucide-react';

// --- Firebase Initialization ---
const appId = typeof __app_id !== 'undefined' ? __app_id : 'agile-tools-app';
const firebaseConfig = typeof __firebase_config !== 'undefined' ? JSON.parse(__firebase_config) : {};
const initialAuthToken = typeof __initial_auth_token !== 'undefined' ? __initial_auth_token : null;

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Helper for strict Firebase paths
const getPublicCollectionPath = (collectionName) => `artifacts/${appId}/public/data/${collectionName}`;
const getPublicDocRef = (collectionName, documentId) => doc(db, getPublicCollectionPath(collectionName), documentId);
const getPublicCollectionRef = (collectionName) => collection(db, getPublicCollectionPath(collectionName));

// --- Components ---

export default function AgileApp() {
  const [user, setUser] = useState(null);
  const [userName, setUserName] = useState('');
  const [roomId, setRoomId] = useState('');
  const [currentRoom, setCurrentRoom] = useState(null);
  const [isConductor, setIsConductor] = useState(false);
  const [activeTab, setActiveTab] = useState('poker'); // 'poker' or 'retro'

  // Auth Effect
  useEffect(() => {
    const authenticate = async () => {
      try {
        if (initialAuthToken) {
          await signInWithCustomToken(auth, initialAuthToken);
        } else {
          await signInAnonymously(auth);
        }
      } catch (error) {
        console.error("Authentication failed:", error);
      }
    };
    
    authenticate();

    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });

    return () => unsubscribe();
  }, []);

  const createRoom = async () => {
    if (!user || !userName.trim()) return;
    
    const newRoomId = Math.random().toString(36).substring(2, 8).toUpperCase();
    const roomRef = getPublicDocRef('rooms', newRoomId);
    
    await setDoc(roomRef, {
      id: newRoomId,
      conductor: user.uid,
      pokerState: 'voting', // 'voting' or 'revealed'
      createdAt: Date.now()
    });

    joinRoom(newRoomId, true);
  };

  const joinRoom = async (idToJoin, isCreator = false) => {
    if (!user || !userName.trim() || !idToJoin) return;
    
    const uppercaseId = idToJoin.toUpperCase();
    const roomRef = getPublicDocRef('rooms', uppercaseId);
    const roomSnap = await getDoc(roomRef);

    if (roomSnap.exists()) {
      const roomData = roomSnap.data();
      
      // Register user in the room
      const userRef = getPublicDocRef('roomUsers', `${uppercaseId}_${user.uid}`);
      await setDoc(userRef, {
        roomId: uppercaseId,
        userId: user.uid,
        name: userName,
        joinedAt: Date.now()
      });

      setRoomId(uppercaseId);
      setIsConductor(roomData.conductor === user.uid);
    } else if (!isCreator) {
      alert("Room not found!");
    }
  };

  const leaveRoom = async () => {
    if (!user || !roomId) return;
    const userRef = getPublicDocRef('roomUsers', `${roomId}_${user.uid}`);
    await deleteDoc(userRef);
    setRoomId('');
    setCurrentRoom(null);
  };

  if (!user) {
    return <div className="flex h-screen items-center justify-center bg-slate-50 text-slate-800 font-sans">Connecting...</div>;
  }

  return (
    <div className="min-h-screen bg-slate-100 text-slate-800 font-sans">
      {!roomId ? (
        <HomeState 
          userName={userName} 
          setUserName={setUserName} 
          roomIdInput={roomId} 
          setRoomIdInput={setRoomId} 
          onCreate={createRoom} 
          onJoin={() => joinRoom(roomId)} 
        />
      ) : (
        <RoomState 
          roomId={roomId} 
          userId={user.uid} 
          userName={userName}
          isConductor={isConductor} 
          onLeave={leaveRoom}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
        />
      )}
    </div>
  );
}

// --- Screens ---

function HomeState({ userName, setUserName, roomIdInput, setRoomIdInput, onCreate, onJoin }) {
  const [joinId, setJoinId] = useState('');

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <div className="bg-white p-8 rounded-xl shadow-lg max-w-md w-full border border-slate-200">
        <div className="flex justify-center mb-6 text-indigo-600">
          <Columns size={48} />
        </div>
        <h1 className="text-2xl font-bold text-center mb-6">Agile Planner & Retro</h1>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Your Name</label>
            <input 
              type="text" 
              value={userName} 
              onChange={(e) => setUserName(e.target.value)} 
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
              placeholder="e.g. John Doe"
            />
          </div>

          <div className="pt-4 border-t border-slate-100">
            <button 
              onClick={onCreate}
              disabled={!userName.trim()}
              className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-semibold py-2 px-4 rounded-lg transition-colors flex justify-center items-center gap-2"
            >
              <Plus size={18} /> Create New Room
            </button>
          </div>

          <div className="pt-4 border-t border-slate-100 flex gap-2">
            <input 
              type="text" 
              value={joinId} 
              onChange={(e) => setJoinId(e.target.value)} 
              className="flex-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none uppercase"
              placeholder="ROOM ID"
            />
            <button 
              onClick={() => onJoin(joinId)}
              disabled={!userName.trim() || !joinId.trim()}
              className="bg-slate-800 hover:bg-slate-900 disabled:bg-slate-300 text-white font-semibold py-2 px-6 rounded-lg transition-colors"
            >
              Join
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function RoomState({ roomId, userId, userName, isConductor, onLeave, activeTab, setActiveTab }) {
  const [room, setRoom] = useState(null);
  const [users, setUsers] = useState([]);
  
  // Real-time listener for Room Data
  useEffect(() => {
    const roomRef = getPublicDocRef('rooms', roomId);
    const unsubscribe = onSnapshot(roomRef, (snap) => {
      if (snap.exists()) {
        setRoom(snap.data());
      } else {
        onLeave(); // Room deleted or invalid
      }
    }, (error) => console.error(error));
    return () => unsubscribe();
  }, [roomId]);

  // Real-time listener for Users in Room
  useEffect(() => {
    const usersRef = getPublicCollectionRef('roomUsers');
    const unsubscribe = onSnapshot(usersRef, (snap) => {
      const allUsers = snap.docs.map(doc => doc.data());
      setUsers(allUsers.filter(u => u.roomId === roomId));
    }, (error) => console.error(error));
    return () => unsubscribe();
  }, [roomId]);

  if (!room) return <div className="p-8 text-center">Loading room...</div>;

  return (
    <div className="flex flex-col h-screen">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-6 py-4 flex justify-between items-center shadow-sm">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            Room: <span className="text-indigo-600 tracking-wider bg-indigo-50 px-2 py-1 rounded">{roomId}</span>
          </h1>
          {isConductor && <span className="bg-amber-100 text-amber-800 text-xs font-semibold px-2 py-1 rounded-full flex items-center gap-1"><Users size={12}/> Conductor</span>}
        </div>
        
        <div className="flex bg-slate-100 p-1 rounded-lg">
          <button 
            onClick={() => setActiveTab('poker')}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${activeTab === 'poker' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}
          >
            Planning Poker
          </button>
          <button 
            onClick={() => setActiveTab('retro')}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${activeTab === 'retro' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}
          >
            Retrospective
          </button>
        </div>

        <div className="flex items-center gap-4">
          <span className="text-sm font-medium text-slate-600">{userName}</span>
          <button onClick={onLeave} className="text-slate-400 hover:text-red-500 transition-colors">
            <Home size={20} />
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-hidden">
        {activeTab === 'poker' ? (
          <PokerTab roomId={roomId} userId={userId} room={room} users={users} isConductor={isConductor} />
        ) : (
          <RetroTab roomId={roomId} userId={userId} userName={userName} isConductor={isConductor} />
        )}
      </main>
    </div>
  );
}

// --- Poker Features ---

const POKER_CARDS = ['1', '2', '3', '5', '8', '13', '21', '?', '☕'];

function PokerTab({ roomId, userId, room, users, isConductor }) {
  const [votes, setVotes] = useState([]);
  const [myVote, setMyVote] = useState(null);

  // Real-time listener for Votes
  useEffect(() => {
    const votesRef = getPublicCollectionRef('pokerVotes');
    const unsubscribe = onSnapshot(votesRef, (snap) => {
      const allVotes = snap.docs.map(doc => doc.data());
      const roomVotes = allVotes.filter(v => v.roomId === roomId);
      setVotes(roomVotes);
      
      const me = roomVotes.find(v => v.userId === userId);
      setMyVote(me ? me.vote : null);
    }, (error) => console.error(error));
    return () => unsubscribe();
  }, [roomId, userId]);

  const castVote = async (value) => {
    if (room.pokerState === 'revealed') return;
    const voteRef = getPublicDocRef('pokerVotes', `${roomId}_${userId}`);
    await setDoc(voteRef, { roomId, userId, vote: value });
  };

  const revealVotes = async () => {
    if (!isConductor) return;
    const roomRef = getPublicDocRef('rooms', roomId);
    await updateDoc(roomRef, { pokerState: 'revealed' });
  };

  const resetRound = async () => {
    if (!isConductor) return;
    
    // Reset room state
    const roomRef = getPublicDocRef('rooms', roomId);
    await updateDoc(roomRef, { pokerState: 'voting' });

    // Clear votes using in-memory filtering of all votes (following strict rule 2: no complex queries)
    const votesRef = getPublicCollectionRef('pokerVotes');
    // For a real prod app, delete individually. Here we just overwrite state by users re-voting or we can delete their docs.
    // Given the constraints, let's delete the vote documents for this room.
    for (const v of votes) {
       await deleteDoc(getPublicDocRef('pokerVotes', `${roomId}_${v.userId}`));
    }
  };

  const isRevealed = room.pokerState === 'revealed';

  return (
    <div className="h-full flex flex-col items-center p-6 bg-slate-50 overflow-y-auto">
      
      {/* Table Area */}
      <div className="w-full max-w-4xl bg-white rounded-2xl p-8 shadow-sm border border-slate-200 min-h-[300px] mb-8 relative flex flex-wrap justify-center items-center gap-6">
        
        {/* Conductor Controls overlay */}
        {isConductor && (
          <div className="absolute top-4 right-4 flex gap-2">
            {!isRevealed ? (
              <button onClick={revealVotes} className="flex items-center gap-1 bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors shadow-sm">
                <Play size={16}/> Reveal
              </button>
            ) : (
              <button onClick={resetRound} className="flex items-center gap-1 bg-slate-800 hover:bg-slate-900 text-white px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors shadow-sm">
                <RotateCcw size={16}/> Reset
              </button>
            )}
          </div>
        )}

        {users.map(u => {
          const userVote = votes.find(v => v.userId === u.userId);
          const hasVoted = !!userVote;
          
          return (
            <div key={u.userId} className="flex flex-col items-center gap-3">
              <div className={`w-16 h-24 rounded-xl border-2 flex items-center justify-center text-xl font-bold transition-all shadow-sm
                ${!hasVoted ? 'bg-slate-50 border-dashed border-slate-300' : 
                  (isRevealed ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : 'bg-indigo-600 border-indigo-700 text-white')}
              `}>
                {!hasVoted ? '?' : (isRevealed ? userVote.vote : '✓')}
              </div>
              <span className="text-sm font-medium text-slate-600 truncate max-w-[100px]" title={u.name}>{u.name}</span>
            </div>
          );
        })}
      </div>

      {/* Voting Cards */}
      <div className="w-full max-w-4xl">
        <h3 className="text-center text-slate-500 font-medium mb-4">Choose your card</h3>
        <div className="flex flex-wrap justify-center gap-3">
          {POKER_CARDS.map(card => (
            <button
              key={card}
              onClick={() => castVote(card)}
              disabled={isRevealed}
              className={`w-14 h-20 sm:w-16 sm:h-24 rounded-xl border-2 flex items-center justify-center text-lg sm:text-2xl font-bold transition-all shadow-sm
                ${myVote === card ? 'bg-indigo-600 border-indigo-700 text-white -translate-y-2' : 'bg-white border-slate-200 text-slate-700 hover:border-indigo-400 hover:text-indigo-600 hover:-translate-y-1'}
                ${isRevealed ? 'opacity-50 cursor-not-allowed transform-none' : ''}
              `}
            >
              {card}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// --- Retrospective Features ---

const RETRO_COLUMNS = [
  { id: 'wentWell', title: 'Went Well', color: 'bg-emerald-50', borderColor: 'border-emerald-200', titleColor: 'text-emerald-700' },
  { id: 'toImprove', title: 'To Improve', color: 'bg-rose-50', borderColor: 'border-rose-200', titleColor: 'text-rose-700' },
  { id: 'actionItems', title: 'Action Items', color: 'bg-blue-50', borderColor: 'border-blue-200', titleColor: 'text-blue-700' }
];

function RetroTab({ roomId, userId, userName, isConductor }) {
  const [cards, setCards] = useState([]);
  const [inputs, setInputs] = useState({ wentWell: '', toImprove: '', actionItems: '' });

  // Real-time listener for Retro Cards
  useEffect(() => {
    const cardsRef = getPublicCollectionRef('retroCards');
    const unsubscribe = onSnapshot(cardsRef, (snap) => {
      const allCards = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setCards(allCards.filter(c => c.roomId === roomId));
    }, (error) => console.error(error));
    return () => unsubscribe();
  }, [roomId]);

  const addCard = async (columnId) => {
    const text = inputs[columnId]?.trim();
    if (!text) return;

    const newCardId = `${Date.now()}_${userId}`;
    const cardRef = getPublicDocRef('retroCards', newCardId);
    
    await setDoc(cardRef, {
      roomId,
      column: columnId,
      text,
      authorId: userId,
      authorName: userName,
      createdAt: Date.now()
    });

    setInputs(prev => ({ ...prev, [columnId]: '' }));
  };

  const deleteCard = async (cardId) => {
    const cardRef = getPublicDocRef('retroCards', cardId);
    await deleteDoc(cardRef);
  };

  return (
    <div className="h-full p-6 bg-slate-50 overflow-x-auto">
      <div className="flex gap-6 min-w-[900px] h-full">
        {RETRO_COLUMNS.map(col => (
          <div key={col.id} className={`flex-1 flex flex-col rounded-xl border ${col.borderColor} ${col.color} overflow-hidden shadow-sm`}>
            <div className={`p-4 border-b ${col.borderColor} font-semibold ${col.titleColor} bg-white/50 backdrop-blur-sm`}>
              {col.title}
            </div>
            
            <div className="flex-1 p-4 overflow-y-auto space-y-3">
              {cards.filter(c => c.column === col.id).map(card => (
                <div key={card.id} className="bg-white p-3 rounded-lg shadow-sm border border-slate-100 group relative">
                  <p className="text-slate-800 whitespace-pre-wrap text-sm mb-2">{card.text}</p>
                  <div className="text-xs text-slate-400 font-medium">{card.authorName}</div>
                  
                  {(isConductor || card.authorId === userId) && (
                    <button 
                      onClick={() => deleteCard(card.id)}
                      className="absolute top-2 right-2 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              ))}
            </div>

            <div className="p-4 bg-white/50 border-t border-slate-100 mt-auto">
              <div className="flex gap-2">
                <input 
                  type="text" 
                  value={inputs[col.id] || ''}
                  onChange={(e) => setInputs(prev => ({ ...prev, [col.id]: e.target.value }))}
                  onKeyDown={(e) => e.key === 'Enter' && addCard(col.id)}
                  placeholder={`Add to ${col.title}...`}
                  className="flex-1 px-3 py-2 text-sm border rounded-lg outline-none focus:ring-2 focus:ring-indigo-500/50 bg-white"
                />
                <button 
                  onClick={() => addCard(col.id)}
                  disabled={!inputs[col.id]?.trim()}
                  className="bg-slate-800 text-white p-2 rounded-lg disabled:bg-slate-300 hover:bg-slate-900 transition-colors"
                >
                  <Plus size={18} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}