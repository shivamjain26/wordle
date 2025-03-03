from fastapi import FastAPI, WebSocket, WebSocketDisconnect
import sqlite3
import json

app = FastAPI()

# Database setup
def init_db():
    conn = sqlite3.connect("wordle.db")
    cursor = conn.cursor()
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS games (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        word TEXT NOT NULL,
        status TEXT DEFAULT 'waiting'
    )""")
    conn.commit()
    conn.close()

init_db()

# WebSocket connection manager
class ConnectionManager:
    def __init__(self):
        self.active_connections: dict[int, WebSocket] = {}
    
    async def connect(self, game_id: int, websocket: WebSocket):
        await websocket.accept()
        self.active_connections[game_id] = websocket
    
    def disconnect(self, game_id: int):
        if game_id in self.active_connections:
            del self.active_connections[game_id]
    
    async def send_message(self, game_id: int, message: dict):
        if game_id in self.active_connections:
            await self.active_connections[game_id].send_text(json.dumps(message))

manager = ConnectionManager()

@app.post("/create_game/")
async def create_game(word: str):
    conn = sqlite3.connect("wordle.db")
    cursor = conn.cursor()
    cursor.execute("INSERT INTO games (word) VALUES (?)", (word,))
    game_id = cursor.lastrowid
    conn.commit()
    conn.close()
    return {"game_id": game_id}

@app.websocket("/ws/{game_id}")
async def websocket_endpoint(game_id: int, websocket: WebSocket):
    await manager.connect(game_id, websocket)
    try:
        while True:
            data = await websocket.receive_text()
            message = json.loads(data)
            await manager.send_message(game_id, message)  # Send message to opponent
    except WebSocketDisconnect:
        manager.disconnect(game_id)
